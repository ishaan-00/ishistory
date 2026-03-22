/**
 * ishistory — Publish Pipeline
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external dependencies. Runs on Node 20 out-of-the-box — no npm install.
 * Triggered when a new .md file is added to src/content/**.
 *
 * Distributes to: Discord · Dev.to · Hashnode · Ntfy · Bing IndexNow
 * Reports results back to Worker → stored in D1 pipeline_log table.
 *
 * Usage: node .github/scripts/pipeline.mjs <repo-relative-path>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

// ─── Paths ────────────────────────────────────────────────────────────────────
const __dir     = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dir, '../..');
const SITE_URL  = 'https://ishistory.pages.dev';

// ─── Retry config ─────────────────────────────────────────────────────────────
const MAX_ATTEMPTS   = 3;   // 1 initial + 2 retries
const RETRY_DELAY_MS = 1500;
const FETCH_TIMEOUT  = 30000; // 30s default for all platform calls

// ─── Environment ──────────────────────────────────────────────────────────────
const ENV = {
  DEVTO_API_KEY:    process.env.DEVTO_API_KEY            || '',
  HASHNODE_KEY:     process.env.HASHNODE_API_KEY         || '',
  HASHNODE_PUB_ID:  process.env.HASHNODE_PUBLICATION_ID  || '',
  DISCORD_WEBHOOK:  process.env.DISCORD_WEBHOOK_ARTICLES || '',
  NTFY_TOPIC:       process.env.NTFY_TOPIC               || '',
  INDEXNOW_KEY:     process.env.INDEXNOW_KEY             || '',
  WORKER_URL:       process.env.WORKER_URL               || '',
  CMS_API_KEY:      process.env.CMS_API_KEY              || '',
  GIT_SHA:          (process.env.GIT_SHA || '').slice(0, 7),
  GIT_REPO:         process.env.GIT_REPO || 'ishaan-00/ishistory',
  GITHUB_TOKEN:     process.env.GITHUB_TOKEN || '',
};

// ─── Logger ───────────────────────────────────────────────────────────────────
const log = {
  info:    (...a) => console.log('  ·', ...a),
  ok:      (...a) => console.log('  ✓', ...a),
  warn:    (...a) => console.warn('  ⚠', ...a),
  fail:    (...a) => console.error('  ✗', ...a),
  section: (t)   => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 48 - t.length))}`),
};

// ─── Fetch with timeout ───────────────────────────────────────────────────────
// Wraps every external HTTP call so a hung connection never blocks the pipeline.
async function fetchWithTimeout(url, opts = {}, timeoutMs = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } catch (e) {
    if (e.name === 'AbortError')
      throw new Error(`Request to ${new URL(url).hostname} timed out after ${timeoutMs}ms`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Safe JSON parser — validates content-type before parsing ─────────────────
async function safeJson(res) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`Expected JSON but got ${ct}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ─── Frontmatter parser (using gray-matter) ───────────────────────────────────
function parseFrontmatter(raw) {
  try {
    const { data: fm, content: body } = matter(raw);

    // Convert Dates returned by gray-matter back to YYYY-MM-DD strings to match expected behaviour
    if (fm.date && fm.date instanceof Date) {
      fm.date = fm.date.toISOString().slice(0, 10);
    }

    return { fm, body };
  } catch (e) {
    log.warn(`Frontmatter parse failed: ${e.message}`);
    return { fm: {}, body: raw };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function canonical(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  const idx  = norm.indexOf('src/content/');
  const rel  = idx !== -1
    ? norm.slice(idx + 'src/content/'.length)
    : norm.split('/').slice(-2).join('/');
  const slug = rel.replace(/\.md$/, '');
  return `${SITE_URL}/${slug}`;
}

function wc(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

function wcDisplay(text) {
  const count = wc(text);
  if (count === 0) return '—';
  return `~${(Math.round(count / 100) * 100).toLocaleString()}`;
}

function validateFm(fm) {
  const issues = [];
  if (!fm.title)       issues.push('missing: title');
  if (!fm.series)      issues.push('missing: series');
  if (!fm.date)        issues.push('missing: date');
  if (!fm.description) issues.push('recommended: description (Discord embed + teaser fallback)');
  return issues;
}

function logMissingSecrets() {
  const mapping = {
    DEVTO_API_KEY:   'Dev.to',
    HASHNODE_KEY:    'Hashnode',
    DISCORD_WEBHOOK: 'Discord',
    NTFY_TOPIC:      'Ntfy',
    INDEXNOW_KEY:    'IndexNow',
  };
  const missing = Object.entries(mapping).filter(([k]) => !ENV[k]).map(([, v]) => v);
  if (missing.length) {
    log.warn(`Optional secrets not configured: ${missing.join(', ')}`);
    log.warn('Corresponding platforms will be skipped');
  }
}

// ─── GitHub Models API ───────────────────────────────────────────────────────
const GH_MODEL = 'openai/gpt-4o-mini';

async function generateContent(systemPrompt, userPrompt, maxTokens = 2000) {
  if (!ENV.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not available');

  const res = await fetchWithTimeout('https://models.github.ai/inference/chat/completions', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${ENV.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model:       GH_MODEL,
      messages:    [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      max_tokens:  maxTokens,
      temperature: 0.7,
    }),
  }, 90_000); // 90s timeout for AI generation

  if (!res.ok) {
    const err = await safeJson(res).catch(() => ({}));
    throw new Error(err.error?.message || err.message || `GitHub Models HTTP ${res.status}`);
  }

  const data = await safeJson(res);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('GitHub Models returned empty response');
  return text.trim();
}

// ─── Generate Dev.to content (1,200–1,300 words) ─────────────────────────────
async function generateDevtoContent(fm) {
  const descWords = wc(fm.description || '');
  const cached    = fm.devto_content && typeof fm.devto_content === 'string';
  const cacheOk   = cached && wc(fm.devto_content) > Math.max(200, descWords + 50);
  if (cacheOk) {
    log.info(`Dev.to: using cached content (${wc(fm.devto_content)} words)`);
    return fm.devto_content.trim();
  }
  if (cached && !cacheOk) {
    log.warn(`Dev.to: cached content too short (${wc(fm.devto_content)} words) — regenerating`);
  }
  log.info('Dev.to: generating via GitHub Models (gpt-4o-mini)…');
  const seriesName = (fm.series || '').replace(/-/g, ' ');
  const epNum      = fm.episode_number ? `, Episode ${fm.episode_number}` : '';

  const system = `You are a technical history writer for Dev.to. Write engaging, well-structured articles for a developer audience. Use clear H2 headings, keep sections 150-200 words each. Write only the article body in markdown — no title, no preamble.`;

  const user = `Write a 1,200-1,300 word article for the Dev.to developer and tech community.\n\nTitle: "${fm.title}"\nSubtitle: "${fm.description || ''}"\nSeries: ${seriesName}${epNum}\n\nRequirements:\n- Engaging tone suited to curious technical readers\n- Clear H2 section headings breaking up the article\n- Historical context, key figures, why this matters today\n- End with a paragraph noting this is part of the ${seriesName} series on ishistory.pages.dev\n- Write only the article body — no title heading, no preamble, no commentary`;

  return withRetry('GitHub Models Dev.to', () => generateContent(system, user, 2000));
}

// ─── Generate Hashnode content (1,500–2,000 words) ───────────────────────────
async function generateHashnodeContent(fm) {
  const descWords = wc(fm.description || '');
  const cached    = fm.hashnode_content && typeof fm.hashnode_content === 'string';
  const cacheOk   = cached && wc(fm.hashnode_content) > Math.max(200, descWords + 50);
  if (cacheOk) {
    log.info(`Hashnode: using cached content (${wc(fm.hashnode_content)} words)`);
    return fm.hashnode_content.trim();
  }
  if (cached && !cacheOk) {
    log.warn(`Hashnode: cached content too short (${wc(fm.hashnode_content)} words) — regenerating`);
  }
  log.info('Hashnode: generating via GitHub Models (gpt-4o-mini)…');
  const seriesName = (fm.series || '').replace(/-/g, ' ');
  const epNum      = fm.episode_number ? `, Episode ${fm.episode_number}` : '';

  const system = `You are an authoritative history writer for Hashnode. Write rich, narrative-driven long-form articles in a literary journalism style. Favour dense flowing paragraphs over bullet points. Write only the article body in markdown — no title, no preamble.`;

  const user = `Write a 1,500-2,000 word editorial article for a history and ideas blog.\n\nTitle: "${fm.title}"\nSubtitle: "${fm.description || ''}"\nSeries: ${seriesName}${epNum}\n\nRequirements:\n- Authoritative, richly written, narrative-driven journalism style\n- Single flowing argument with dense paragraphs — avoid bullet points\n- Historically rich: specific names, dates, primary details\n- Build towards a conclusion about why this history matters now\n- End with a paragraph noting this is part of the ${seriesName} series on ishistory.pages.dev\n- Write only the article body — no title heading, no preamble, no commentary`;

  return withRetry('GitHub Models Hashnode', () => generateContent(system, user, 2500));
}

// ─── Sanitise generated content for safe YAML embedding ──────────────────────
function sanitizeForFrontmatter(text) {
  // Replace standalone --- lines that could break YAML frontmatter delimiters
  return text.replace(/^---$/gm, '\\-\\-\\-');
}

// ─── YAML block scalar builder — preserves indentation on empty lines ─────────
function yamlBlockScalar(key, text) {
  const trimmed = text.replace(/\n+$/, '');
  const lines   = trimmed.split('\n').map(l => '  ' + l);
  return `${key}: |\n${lines.join('\n')}`;
}

// ─── Write generated content back to .md frontmatter ─────────────────────────
async function cacheGeneratedContent(relPath, devtoRaw, hashnodeRaw) {
  const token = ENV.GITHUB_TOKEN;
  const repo  = ENV.GIT_REPO;
  if (!token || !repo) return;

  const apiBase = `https://api.github.com/repos/${repo}/contents/${relPath}`;
  const headers = {
    Authorization:  `Bearer ${token}`,
    Accept:         'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    const res  = await fetchWithTimeout(apiBase, { headers });
    if (!res.ok) return;
    const data = await safeJson(res);
    const raw  = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');

    // Only inject if not already present (precise line-start match)
    if (/^devto_content:/m.test(raw)) return;

    const devtoSafe    = sanitizeForFrontmatter(devtoRaw);
    const hashSafe     = sanitizeForFrontmatter(hashnodeRaw);
    const devtoBlock   = yamlBlockScalar('devto_content', devtoSafe);
    const hashnodeBlock = yamlBlockScalar('hashnode_content', hashSafe);

    // Insert before the closing --- of frontmatter
    const updated = raw.replace(
      /^(---[\s\S]*?)(---)/m,
      `$1${devtoBlock}\n${hashnodeBlock}\n$2`
    );

    if (updated === raw) return;

    await fetchWithTimeout(apiBase, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `chore: cache generated content for ${relPath.split('/').pop()} [skip ci]`,
        content: Buffer.from(updated).toString('base64'),
        sha:     data.sha,
      }),
    });
    log.ok('Generated content cached in frontmatter');
  } catch (e) {
    log.warn(`Cache write-back failed (non-fatal): ${e.message}`);
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatForDevto(fm, generatedBody, url) {
  const seriesName = (fm.series || '').replace(/-/g, ' ');
  const epNum      = fm.episode_number ? ` — Episode ${fm.episode_number}` : '';
  const partLabel  = fm.part_label ? ` · ${fm.part_label}` : '';
  const fullApprox = wcDisplay(fm._body || '');

  const header = [
    `> 📖 *Originally published on [ishistory.pages.dev](${url})*`,
    `> *${fullApprox} word deep-dive · ${seriesName}${epNum}${partLabel}*`,
    '',
  ].join('\n');

  const cta = [
    '',
    '---',
    '',
    '## Continue Reading',
    '',
    `This is part of the **${seriesName}** series on [ishistory.pages.dev](https://ishistory.pages.dev).`,
    `The full article (${fullApprox} words) covers this topic in complete depth with primary sources.`,
    '',
    `👉 **[Read the full article](${url})**`,
    '',
    `*Follow the series — new episodes cover AI history, internet history, and robotics.*`,
  ].join('\n');

  return `${header}\n${generatedBody}\n${cta}`;
}

function formatForHashnode(fm, generatedBody, url) {
  const fullApprox = wcDisplay(fm._body || '');
  const seriesName = (fm.series || '').replace(/-/g, ' ');
  const metaParts  = [
    fm.episode_number ? `Episode ${fm.episode_number}` : null,
    fm.part_label     || null,
    fm.tag            || null,
    seriesName        ? `Series: ${seriesName}` : null,
  ].filter(Boolean);

  const header = [
    metaParts.length ? `*${metaParts.join(' · ')}*` : '',
    '',
    fm.description ? `**${fm.description}**` : '',
    '',
  ].filter((l, i, a) => !(l === '' && (a[i - 1] === '' || i === 0))).join('\n');

  const cta = [
    '',
    '---',
    '',
    `### Read the Full Article`,
    '',
    `*This piece is part of the **${seriesName}** series. The complete article (${fullApprox} words) — with full historical context, primary sources, and extended analysis — is published on ishistory.pages.dev.*`,
    '',
    `**[→ Read the complete article](${url})**`,
  ].join('\n');

  return `${header}\n${generatedBody}\n${cta}`;
}

// ─── Tag sanitisers ───────────────────────────────────────────────────────────
function devtoTags(series) {
  return [series, 'history', 'technology', 'programming']
    .filter(Boolean)
    .map(t => String(t).toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(t => t.length > 1)
    .slice(0, 4);
}

function hashnodeTags(series) {
  return [series, 'history']
    .filter(Boolean)
    .map(t => ({ name: String(t), slug: String(t).toLowerCase().replace(/[^a-z0-9]/g, '-') }));
}

// ─── Retry wrapper ────────────────────────────────────────────────────────────
async function withRetry(label, fn, maxAttempts = MAX_ATTEMPTS) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt < maxAttempts) {
        const delay = RETRY_DELAY_MS * attempt;
        log.warn(`${label}: attempt ${attempt}/${maxAttempts} failed (${err.message}) — retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// ─── Platform: Discord ────────────────────────────────────────────────────────
async function postDiscord(fm, url) {
  if (!ENV.DISCORD_WEBHOOK)
    return { ok: false, skipped: true, err: 'DISCORD_WEBHOOK_ARTICLES not configured' };

  return withRetry('Discord', async () => {
    const fields = [];
    if (fm.series)         fields.push({ name: 'Series',  value: String(fm.series).replace(/-/g, ' '), inline: true });
    if (fm.episode_number) fields.push({ name: 'Episode', value: `#${fm.episode_number}`,              inline: true });
    if (fm.tag)            fields.push({ name: 'Topic',   value: String(fm.tag),                       inline: true });
    if (fm.date)           fields.push({ name: 'Date',    value: String(fm.date).slice(0, 10),         inline: true });

    const res = await fetchWithTimeout(ENV.DISCORD_WEBHOOK, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        username: 'ishistory',
        embeds: [{
          title:       `📰 ${fm.title}`,
          description: fm.description || '',
          url,
          color:       0xB45309,
          fields,
          footer:      { text: 'ishistory.pages.dev' },
          timestamp:   new Date().toISOString(),
        }],
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
    }
    return { ok: true };
  });
}

// ─── Platform: Dev.to ─────────────────────────────────────────────────────────
async function postDevto(fm, teaser, url) {
  if (!ENV.DEVTO_API_KEY)
    return { ok: false, skipped: true, err: 'DEVTO_API_KEY not configured' };

  return withRetry('Dev.to', async () => {
    const res = await fetchWithTimeout('https://dev.to/api/articles', {
      method:  'POST',
      headers: { 'api-key': ENV.DEVTO_API_KEY, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        article: {
          title:         fm.title,
          body_markdown: teaser,
          published:     true,
          canonical_url: url,
          description:   fm.description || '',
          tags:          devtoTags(fm.series),
        },
      }),
    });

    const data = await safeJson(res).catch(() => ({}));
    if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
    return { ok: true, url: data.url, id: data.id };
  });
}

// ─── Platform: Hashnode ───────────────────────────────────────────────────────
async function postHashnode(fm, teaser, url) {
  if (!ENV.HASHNODE_KEY)
    return { ok: false, skipped: true, err: 'HASHNODE_API_KEY not configured' };
  if (!ENV.HASHNODE_PUB_ID)
    return { ok: false, skipped: true, err: 'HASHNODE_PUBLICATION_ID not configured' };

  return withRetry('Hashnode', async () => {
    const res = await fetchWithTimeout('https://gql.hashnode.com', {
      method:  'POST',
      headers: { Authorization: ENV.HASHNODE_KEY, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        query: `mutation PublishPost($input: PublishPostInput!) {
          publishPost(input: $input) { post { id url title } }
        }`,
        variables: {
          input: {
            title:              fm.title,
            contentMarkdown:    teaser,
            publicationId:      ENV.HASHNODE_PUB_ID,
            originalArticleURL: url,
            tags:               hashnodeTags(fm.series),
          },
        },
      }),
    });

    const data = await safeJson(res).catch(() => ({}));
    const post = data.data?.publishPost?.post;
    if (!post) {
      const errs = (data.errors || []).map(e => e.message).join('; ');
      throw new Error(errs || `HTTP ${res.status}`);
    }
    return { ok: true, url: post.url, id: post.id };
  });
}

// ─── Platform: Ntfy ───────────────────────────────────────────────────────────
async function sendNtfy(fm, url) {
  if (!ENV.NTFY_TOPIC)
    return { ok: false, skipped: true, err: 'NTFY_TOPIC not configured' };

  return withRetry('Ntfy', async () => {
    const res = await fetchWithTimeout(`https://ntfy.sh/${ENV.NTFY_TOPIC}`, {
      method:  'POST',
      headers: {
        Title:          `Published: ${fm.title}`,
        Click:          url,
        Tags:           'newspaper',
        Priority:       'default',
        'Content-Type': 'text/plain',
      },
      body: fm.description || 'New article on ishistory.pages.dev',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true };
  });
}

// ─── Platform: Bing IndexNow ──────────────────────────────────────────────────
async function pingIndexNow(url) {
  if (!ENV.INDEXNOW_KEY)
    return { ok: false, skipped: true, err: 'INDEXNOW_KEY not configured' };

  return withRetry('IndexNow', async () => {
    const res = await fetchWithTimeout('https://api.indexnow.org/indexnow', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        host:    'ishistory.pages.dev',
        key:     ENV.INDEXNOW_KEY,
        urlList: [url],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true };
  });
}

// ─── Report results → Worker ──────────────────────────────────────────────────
async function reportToWorker(filePath, results) {
  if (!ENV.WORKER_URL || !ENV.CMS_API_KEY) {
    log.warn('WORKER_URL or CMS_API_KEY not set — skipping pipeline_log update');
    return;
  }

  const toInt = r => r.skipped ? -1 : (r.ok ? 1 : 0);

  try {
    const res = await fetchWithTimeout(`${ENV.WORKER_URL}/webhook/pipeline-result`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ENV.CMS_API_KEY}` },
      body:    JSON.stringify({
        path:         filePath,
        repo:         ENV.GIT_REPO,
        commit_sha:   ENV.GIT_SHA,
        discord:      toInt(results.discord),
        devto:        toInt(results.devto),
        hashnode:     toInt(results.hashnode),
        ntfy:         toInt(results.ntfy),
        indexnow:     toInt(results.indexnow),
        discord_err:  results.discord.err  || null,
        devto_err:    results.devto.err    || null,
        hashnode_err: results.hashnode.err || null,
        ntfy_err:     results.ntfy.err     || null,
        indexnow_err: results.indexnow.err || null,
      }),
    });
    if (!res.ok) log.warn(`Worker callback HTTP ${res.status}`);
    else         log.ok('Results logged to Worker pipeline_log');
  } catch (e) {
    log.warn(`Worker callback failed: ${e.message}`);
  }
}

// ─── Print results ────────────────────────────────────────────────────────────
function printResults(results) {
  log.section('Results');
  for (const [platform, r] of Object.entries(results)) {
    const label = platform.padEnd(12);
    if (r.skipped)   log.warn(`${label} SKIPPED  — ${r.err}`);
    else if (r.ok)   log.ok(`${label} OK${r.url ? '  → ' + r.url : ''}`);
    else             log.fail(`${label} FAILED   — ${r.err}`);
  }
}

// ─── Write GitHub Actions step summary ───────────────────────────────────────
function writeStepSummary(fm, body, results, url) {
  const f = process.env.GITHUB_STEP_SUMMARY;
  if (!f) return;

  const rows = Object.entries(results).map(([p, r]) => {
    const status = r.skipped ? '⏭ Skipped' : r.ok ? '✅ OK' : '❌ Failed';
    const detail = r.url ? `[View post](${r.url})` : (r.err || '—');
    return `| ${p} | ${status} | ${detail} |`;
  });

  const md = [
    `## 📰 ${fm.title}`,
    '',
    `| | |`,
    `|---|---|`,
    `| **URL** | [${url}](${url}) |`,
    `| **Commit** | \`${ENV.GIT_SHA || 'local'}\` |`,
    `| **Article length** | ~${wc(body)} words |`,
    '',
    '| Platform | Status | Detail |',
    '|----------|--------|--------|',
    ...rows,
  ].join('\n');

  fs.appendFileSync(f, '\n' + md + '\n');
}

// ─── Write results to src/data/status.json in repo ───────────────────────────
async function updateStatusJson(filePath, results, commitSha) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = ENV.GIT_REPO;
  if (!token || !repo) { log.warn('GITHUB_TOKEN or GIT_REPO missing — skipping status.json update'); return; }

  const apiBase = `https://api.github.com/repos/${repo}/contents/src/data/status.json`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };

  let current = { updated_at: null, runs: [] };
  let existingSha = null;
  try {
    const res = await fetchWithTimeout(apiBase, { headers });
    if (res.ok) {
      const data = await safeJson(res);
      existingSha = data.sha;
      current = JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'));
    }
  } catch (_) {}

  const newRun = {
    file:     filePath,
    commit:   commitSha || 'unknown',
    ran_at:   new Date().toISOString(),
    discord:  { ok: results.discord.ok,  skipped: !!results.discord.skipped,  err: results.discord.err  || null },
    devto:    { ok: results.devto.ok,    skipped: !!results.devto.skipped,    err: results.devto.err    || null },
    hashnode: { ok: results.hashnode.ok, skipped: !!results.hashnode.skipped, err: results.hashnode.err || null },
    ntfy:     { ok: results.ntfy.ok,     skipped: !!results.ntfy.skipped,     err: results.ntfy.err     || null },
    indexnow: { ok: results.indexnow.ok, skipped: !!results.indexnow.skipped, err: results.indexnow.err || null },
  };

  current.updated_at = new Date().toISOString();
  current.runs = [newRun, ...(current.runs || [])].slice(0, 50);

  const body = {
    message: `chore: update pipeline status [skip ci]`,
    content: Buffer.from(JSON.stringify(current, null, 2)).toString('base64'),
    ...(existingSha ? { sha: existingSha } : {}),
  };

  try {
    const res = await fetchWithTimeout(apiBase, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (res.ok) log.ok('status.json updated in repo');
    else {
      const err = await safeJson(res).catch(() => ({}));
      log.warn(`status.json update failed: ${err.message || res.status}`);
    }
  } catch (e) {
    log.warn(`status.json update error: ${e.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const relPath = process.argv[2];
  if (!relPath) {
    console.error('Usage: node pipeline.mjs <repo-relative-path>');
    process.exit(1);
  }

  const absPath = path.resolve(REPO_ROOT, relPath);
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  const raw          = fs.readFileSync(absPath, 'utf8');
  const { fm, body } = parseFrontmatter(raw);
  fm._body           = body;
  const url          = canonical(relPath);

  log.section(`Processing: ${path.basename(relPath)}`);
  log.info(`Title:    ${fm.title || '(missing)'}`);
  log.info(`Series:   ${fm.series || '(missing)'}`);
  log.info(`URL:      ${url}`);
  log.info(`Commit:   ${ENV.GIT_SHA || '(local)'}`);
  log.info(`Article:  ${wc(body)} words`);

  logMissingSecrets();

  log.section('Generating platform content');
  const [devtoRaw, hashnodeRaw] = await Promise.all([
    ENV.GITHUB_TOKEN
      ? generateDevtoContent(fm).catch(e => { log.warn(`Dev.to gen failed: ${e.message} — using description`); return fm.description || fm.title; })
      : Promise.resolve(fm.description || fm.title),
    ENV.GITHUB_TOKEN
      ? generateHashnodeContent(fm).catch(e => { log.warn(`Hashnode gen failed: ${e.message} — using description`); return fm.description || fm.title; })
      : Promise.resolve(fm.description || fm.title),
  ]);

  log.info(`Dev.to:   ${wc(devtoRaw)} words generated`);
  log.info(`Hashnode: ${wc(hashnodeRaw)} words generated`);

  // Cache generated content back to .md frontmatter (non-blocking, logged on error)
  cacheGeneratedContent(relPath, devtoRaw, hashnodeRaw).catch(e => {
    log.warn(`Cache write-back failed: ${e.message}`);
  });

  const devtoContent    = formatForDevto(fm, devtoRaw, url);
  const hashnodeContent = formatForHashnode(fm, hashnodeRaw, url);

  const issues = validateFm(fm);
  if (issues.length) {
    log.section('Frontmatter warnings');
    issues.forEach(i => log.warn(i));
  }

  log.section('Running platforms');

  const [discord, devto, hashnode, ntfy, indexnow] = await Promise.all([
    postDiscord(fm, url).catch(e => ({ ok: false, err: e.message })),
    postDevto(fm, devtoContent, url).catch(e => ({ ok: false, err: e.message })),
    postHashnode(fm, hashnodeContent, url).catch(e => ({ ok: false, err: e.message })),
    sendNtfy(fm, url).catch(e => ({ ok: false, err: e.message })),
    pingIndexNow(url).catch(e => ({ ok: false, err: e.message })),
  ]);

  const results = { discord, devto, hashnode, ntfy, indexnow };

  printResults(results);
  writeStepSummary(fm, body, results, url);
  await updateStatusJson(relPath, results, ENV.GIT_SHA);

  const active    = Object.values(results).filter(r => !r.skipped);
  const allFailed = active.length > 0 && active.every(r => !r.ok);
  if (allFailed) {
    log.fail('All configured platforms failed.');
    process.exit(1);
  }
}

main();