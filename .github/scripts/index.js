/**
 * sveltia-cms-auth — Extended Worker
 * Fixed: multiple Set-Cookie headers, KV binding guard
 */

const SESSION_TTL_SECONDS = 60 * 60 * 8;
const SESSION_COOKIE      = 'ih-session';
const SUPPORTED_PROVIDERS = ['github', 'gitlab'];
const ALLOWED_ORIGINS     = [
  'https://ishistory.pages.dev',
  'https://sveltia-cms-auth.aadityadarpan5.workers.dev',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':      allowed,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods':     'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':     'Content-Type, Authorization',
  };
}

function generateSessionId() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function sessionCookieHeader(sessionId, maxAge = SESSION_TTL_SECONDS) {
  return `${SESSION_COOKIE}=${sessionId}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${maxAge}`;
}

async function createSession(kv, token, userLogin) {
  const sessionId = generateSessionId();
  await kv.put(
    `session:${sessionId}`,
    JSON.stringify({ token, login: userLogin, created_at: Date.now() }),
    { expirationTtl: SESSION_TTL_SECONDS }
  );
  return sessionId;
}

async function getSession(kv, request) {
  if (!kv) return null;
  const cookie = request.headers.get('Cookie') || '';
  const match  = cookie.match(new RegExp(`\\b${SESSION_COOKIE}=([a-f0-9]{64})\\b`));
  if (!match) return null;
  const raw = await kv.get(`session:${match[1]}`);
  if (!raw) return null;
  try { return { sessionId: match[1], ...JSON.parse(raw) }; }
  catch (_) { return null; }
}

async function deleteSession(kv, request) {
  if (!kv) return;
  const cookie = request.headers.get('Cookie') || '';
  const match  = cookie.match(new RegExp(`\\b${SESSION_COOKIE}=([a-f0-9]{64})\\b`));
  if (match) await kv.delete(`session:${match[1]}`);
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Original outputHTML — unchanged, keeps Sveltia CMS working
function outputHTML({ provider = 'unknown', token, error, errorCode }) {
  const state   = error ? 'error' : 'success';
  const content = error ? { provider, error, errorCode } : { provider, token };
  return new Response(
    `<!doctype html><html><body><script>
      (() => {
        window.addEventListener('message', ({ data, origin }) => {
          if (data === 'authorizing:${provider}') {
            window.opener?.postMessage(
              'authorization:${provider}:${state}:${JSON.stringify(content)}',
              origin
            );
          }
        });
        window.opener?.postMessage('authorizing:${provider}', '*');
      })();
    <\/script></body></html>`,
    { headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Set-Cookie':   `csrf-token=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure`,
    }}
  );
}

// ── FIXED: use Headers.append() to set multiple Set-Cookie headers properly ──
function outputHTMLWithSession({ provider, token, error, errorCode }, sessionId) {
  const state   = error ? 'error' : 'success';
  const content = error ? { provider, error, errorCode } : { provider, token };
  const html    = `<!doctype html><html><body><script>
    (() => {
      window.addEventListener('message', ({ data, origin }) => {
        if (data === 'authorizing:${provider}') {
          window.opener?.postMessage(
            'authorization:${provider}:${state}:${JSON.stringify(content)}',
            origin
          );
        }
      });
      window.opener?.postMessage('authorizing:${provider}', '*');
    })();
  <\/script></body></html>`;

  const headers = new Headers({ 'Content-Type': 'text/html;charset=UTF-8' });
  // Delete the CSRF token cookie
  headers.append('Set-Cookie', `csrf-token=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure`);
  // Set the session cookie only if we have a sessionId
  if (sessionId) {
    headers.append('Set-Cookie', sessionCookieHeader(sessionId));
  }

  return new Response(html, { headers });
}

async function handleAuth(request, env) {
  const { url }                  = request;
  const { origin, searchParams } = new URL(url);
  const { provider, site_id: domain } = Object.fromEntries(searchParams);

  if (!provider || !SUPPORTED_PROVIDERS.includes(provider))
    return outputHTML({ error: 'Your Git backend is not supported.', errorCode: 'UNSUPPORTED_BACKEND' });

  const { ALLOWED_DOMAINS, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_HOSTNAME = 'github.com' } = env;

  if (ALLOWED_DOMAINS && !ALLOWED_DOMAINS.split(/,/).some(
    str => (domain ?? '').match(new RegExp(`^${escapeRegExp(str.trim()).replace('\\*', '.+')}$`))
  )) {
    return outputHTML({ provider, error: 'Your domain is not allowed.', errorCode: 'UNSUPPORTED_DOMAIN' });
  }

  const csrfToken = crypto.randomUUID().replaceAll('-', '');

  if (provider === 'github') {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET)
      return outputHTML({ provider, error: 'OAuth app not configured.', errorCode: 'MISCONFIGURED_CLIENT' });

    const params  = new URLSearchParams({ client_id: GITHUB_CLIENT_ID, scope: 'repo,user', state: csrfToken });
    return new Response('', {
      status: 302,
      headers: {
        Location:     `https://${GITHUB_HOSTNAME}/login/oauth/authorize?${params}`,
        'Set-Cookie': `csrf-token=${provider}_${csrfToken}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure`,
      }
    });
  }
  return outputHTML({ error: 'Provider not handled.', errorCode: 'UNSUPPORTED_BACKEND' });
}

async function handleCallback(request, env) {
  const { headers }              = request;
  const { searchParams }         = new URL(request.url);
  const { code, state }          = Object.fromEntries(searchParams);
  const [, provider, csrfToken]  = headers.get('Cookie')?.match(/\bcsrf-token=([a-z-]+?)_([0-9a-f]{32})\b/) ?? [];

  if (!provider || !SUPPORTED_PROVIDERS.includes(provider))
    return outputHTML({ error: 'Backend not supported.', errorCode: 'UNSUPPORTED_BACKEND' });
  if (!code || !state)
    return outputHTML({ provider, error: 'No auth code received.', errorCode: 'AUTH_CODE_REQUEST_FAILED' });
  if (!csrfToken || state !== csrfToken)
    return outputHTML({ provider, error: 'CSRF check failed.', errorCode: 'CSRF_DETECTED' });

  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_HOSTNAME = 'github.com' } = env;
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET)
    return outputHTML({ provider, error: 'OAuth app not configured.', errorCode: 'MISCONFIGURED_CLIENT' });

  let token = '', error = '';
  try {
    const res = await fetch(`https://${GITHUB_HOSTNAME}/login/oauth/access_token`, {
      method:  'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code, client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET }),
    });
    ({ access_token: token, error } = await res.json());
  } catch {
    return outputHTML({ provider, error: 'Token request failed.', errorCode: 'TOKEN_REQUEST_FAILED' });
  }

  if (error || !token) return outputHTML({ provider, token, error });

  // Create server-side session — guarded so Worker still works if KV not bound yet
  let sessionId = null;
  if (env.SESSIONS) {
    try {
      const userRes  = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ishistory-cms-auth' }
      });
      const userLogin = userRes.ok ? (await userRes.json()).login : 'unknown';
      sessionId = await createSession(env.SESSIONS, token, userLogin);
      console.log(`[session] created for ${userLogin}`);
    } catch (e) {
      // Non-fatal — Sveltia CMS still works via postMessage even without session
      console.error('[session] create failed:', e.message);
    }
  } else {
    // KV not bound — log clearly so it's obvious in Worker logs
    console.warn('[session] SESSIONS KV binding not found — session cookie will not be set. Bind ishistory-sessions KV namespace to this Worker.');
  }

  return outputHTMLWithSession({ provider, token, error }, sessionId);
}

async function handleSessionVerify(request, env) {
  const origin = request.headers.get('Origin') || '';
  const cors   = corsHeaders(origin);
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

  const session = await getSession(env.SESSIONS, request);
  if (!session)
    return new Response(JSON.stringify({ ok: false }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' }
    });

  return new Response(JSON.stringify({ ok: true, login: session.login }), {
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}

async function handleSessionLogout(request, env) {
  const origin = request.headers.get('Origin') || '';
  const cors   = corsHeaders(origin);
  await deleteSession(env.SESSIONS, request);
  const h = new Headers({ ...cors, 'Content-Type': 'application/json' });
  h.append('Set-Cookie', sessionCookieHeader('deleted', 0));
  return new Response(JSON.stringify({ ok: true }), { headers: h });
}

async function handleGitHubProxy(request, env, pathname) {
  const origin = request.headers.get('Origin') || '';
  const cors   = corsHeaders(origin);
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

  const session = await getSession(env.SESSIONS, request);
  if (!session)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' }
    });

  const ghPath  = pathname.replace(/^\/api\/github/, '') || '/';
  const reqURL  = new URL(request.url);
  const finalURL = `https://api.github.com${ghPath}${reqURL.search || ''}`;

  const proxyHeaders = new Headers({
    Authorization:  `Bearer ${session.token}`,
    Accept:         'application/vnd.github.v3+json',
    'User-Agent':   'ishistory-cms-dashboard',
    'Content-Type': 'application/json',
  });

  const body   = ['POST','PUT','PATCH','DELETE'].includes(request.method) ? await request.text() : null;
  const ghRes  = await fetch(finalURL, { method: request.method, headers: proxyHeaders, body });

  const resHeaders = new Headers(ghRes.headers);
  Object.entries(cors).forEach(([k, v]) => resHeaders.set(k, v));
  resHeaders.set('Content-Type', ghRes.headers.get('Content-Type') || 'application/json');

  return new Response(ghRes.body, { status: ghRes.status, headers: resHeaders });
}

export default {
  async fetch(request, env) {
    const { method } = request;
    const { pathname } = new URL(request.url);

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request.headers.get('Origin') || '') });
    }

    if (method === 'GET' && ['/auth', '/oauth/authorize'].includes(pathname))   return handleAuth(request, env);
    if (method === 'GET' && ['/callback', '/oauth/redirect'].includes(pathname)) return handleCallback(request, env);
    if (pathname === '/session/verify')   return handleSessionVerify(request, env);
    if (pathname === '/session/logout')   return handleSessionLogout(request, env);
    if (pathname.startsWith('/api/github')) return handleGitHubProxy(request, env, pathname);

    return new Response('', { status: 404 });
  }
};
