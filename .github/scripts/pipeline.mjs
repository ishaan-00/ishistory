/**
 * ishistory — Publish Pipeline
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external dependencies. Runs on Node 20 out-of-the-box — no npm install.
 * Triggered when a new .md file is added to src/content/**.
 *
 * Distributes to: Discord · Dev.to · Hashnode · Ntfy · Bing IndexNow
 * Reports results back to Worker and writes status.json + post-ids.json.
 *
 * Usage:
 *   node pipeline.mjs <repo-relative-path>           # publish (new post)
 *   node pipeline.mjs <repo-relative-path> --update  # update existing posts
 *   node pipeline.mjs <repo-relative-path> --update --platforms=devto
 *   node pipeline.mjs <repo-relative-path> --dry-run # preview without posting
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs           from 'node:fs';
import path         from 'node:path';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// ─── Paths ────────────────────────────────────────────────────────────────────
const __dir     = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dir, '../..');
const SITE_URL  = 'https://ishistory.pages.dev';

// ─── Platform list — single source of truth ───────────────────────────────────
const PLATFORMS = ['discord', 'devto', 'hashnode', 'ntfy', 'indexnow'];

// ─── Retry / timeout config ───────────────────────────────────────────────────
const MAX_ATTEMPTS   = 3;
const RETRY_BASE_MS  = 1500;   // base for exponential backoff
const FETCH_TIMEOUT  = 30_000;
const AI_TIMEOUT     = 90_000;
const URL_POLL_MAX   = 60_000; // max wait for live URL check
const URL_POLL_STEP  = 5_000;

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

// ─── CLI flags ────────────────────────────────────────────────────────────────
const IS_UPDATE  = process.argv.includes('--update');
const IS_DRY_RUN = process.argv.includes('--dry-run');
const PLATFORMS_FLAG = (() => {
  const p = process.argv.find(a => a.startsWith('--platforms='));
  return p ? p.replace('--platforms=', '').split(',').map(s => s.trim()).filter(Boolean) : null;
})();

// ─── Fetch with timeout ───────────────────────────────────────────────────────
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

// ─── Safe JSON parser ─────────────────────────────────────────────────────────
async function safeJson(res) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`Expected JSON but got ${ct}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ─── Content hashing ──────────────────────────────────────────────────────────
function hashContent(text) {
  return createHash('sha256').update(text).digest('hex');
}

// ─── HMAC request signing (for Worker webhook) ────────────────────────────────
function signRequest(bodyStr, secret, timestamp) {
  return createHmac('sha256', secret).update(`${timestamp}:${bodyStr}`).digest('hex');
}

// ─── Inline frontmatter parser (zero deps) ────────────────────────────────────
// Handles: block scalars (|), booleans, arrays (inline + block), floats, null.
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { fm: {}, body: raw };

  const fm = {};
  let currentKey      = null;
  let multilineVal    = null;
  let multilineIndent = 0;
  let blockListKey    = null;
  let blockList       = null;

  for (const line of match[1].split('\n')) {
    // Inside a block sequence (- item)
    if (blockList !== null) {
      const listItem = line.match(/^\s+-\s+(.*)$/);
      if (listItem) {
        blockList.push(listItem[1].trim().replace(/^["']|["']$/g, ''));
        continue;
      }
      fm[blockListKey] = blockList;
      blockList = null; blockListKey = null;
    }

    // Inside a block scalar (|)
    if (multilineVal !== null) {
      if (multilineIndent === 0 && line.trim())
        multilineIndent = line.length - line.trimStart().length;
      if (line.trim() === '' || (multilineIndent > 0 && line.startsWith(' '.repeat(multilineIndent)))) {
        multilineVal += (multilineVal ? '\n' : '') + line.slice(multilineIndent);
        continue;
      }
      fm[currentKey]  = multilineVal.trimEnd();
      multilineVal    = null;
      multilineIndent = 0;
      currentKey      = null;
    }

    const colon = line.indexOf(':');
    if (colon === -1) continue;

    const key  = line.slice(0, colon).trim();
    const rest = line.slice(colon + 1).trim();
    if (!key) continue;

    if (rest === '|') {
      currentKey = key; multilineVal = ''; multilineIndent = 0; continue;
    }

    // Empty value followed by block list on next lines
    if (rest === '') {
      blockListKey = key; blockList = []; continue;
    }

    fm[key] = coerceYamlValue(rest);
  }

  // Flush trailing values
  if (multilineVal !== null && currentKey) fm[currentKey] = multilineVal.trimEnd();
  if (blockList !== null && blockListKey)  fm[blockListKey] = blockList;

  return { fm, body: match[2] };
}

// ─── YAML value coercion ──────────────────────────────────────────────────────
function coerceYamlValue(raw) {
  const val = raw.replace(/^["']|["']$/g, '');
  if (val === 'true')                   return true;
  if (val === 'false')                  return false;
  if (val === 'null' || val === '~')    return null;
  if (val === '')                       return '';
  if (/^-?\d+$/.test(val))             return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val))        return parseFloat(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(val))  return val;
  if (val.startsWith('[') && val.endsWith(']')) {
    return val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
  }
  return val;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function canonical(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  const idx  = norm.indexOf('src/content/');
  const rel  = idx !== -1
    ? norm.slice(idx + 'src/content/'.length)
    : norm.split('/').slice(-2).join('/');
  return `${SITE_URL}/${rel.replace(/\.md$/, '')}`;
}

function wc(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

function wcDisplay(text) {
  const count = wc(text);
  if (count === 0) return '—';
  return `~${(Math.round(count / 100) * 100).toLocaleString()}`;
}

function fn(p) { return p ? p.split('/').pop() : p; }

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

function shouldRunPlatform(platform) {
  if (!PLATFORMS_FLAG) return true;
  return PLATFORMS_FLAG.includes(platform);
}

// ─── GitHub API helpers ───────────────────────────────────────────────────────
const GH_HEADERS = () => ({
  Authorization:  `Bearer ${ENV.GITHUB_TOKEN}`,
  Accept:         'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
});

async function ghGet(endpoint) {
  const res = await fetchWithTimeout(`https://api.github.com${endpoint}`, { headers: GH_HEADERS() });
  if (!res.ok) return null;
  return safeJson(res);
}

async function ghPut(endpoint, body) {
  const res = await fetchWithTimeout(`https://api.github.com${endpoint}`, {
    method: 'PUT', headers: GH_HEADERS(), body: JSON.stringify(body),
  });
  return res;
}

// ─── post-ids.json helpers ────────────────────────────────────────────────────
function loadPostIdsFromDisk() {
  const fp = path.join(REPO_ROOT, 'src/data/post-ids.json');
  if (!fs.existsSync(fp)) return {};
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (_) { return {}; }
}

function hasContentChanged(relPath, platform, currentContent) {
  const map     = loadPostIdsFromDisk();
  const entry   = map[relPath];
  if (!entry) return true;
  const stored  = entry[`${platform}_content_hash`];
  if (!stored)  return true;
  return hashContent(currentContent) !== stored;
}

async function storePlatformIds(relPath, results, devtoContent, hashnodeContent) {
  if (!ENV.GITHUB_TOKEN || !ENV.GIT_REPO) return;

  const apiBase = `/repos/${ENV.GIT_REPO}/contents/src/data/post-ids.json`;
  let map = {}; let existingSha = null;

  try {
    const data = await ghGet(apiBase);
    if (data) {
      existingSha = data.sha;
      map = JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'));
    }
  } catch (_) {}

  const existing = map[relPath] || {};
  const devtoOk   = results.devto?.ok   && !results.devto?.skipped;
  const hashOk    = results.hashnode?.ok && !results.hashnode?.skipped;

  map[relPath] = {
    devto_id:             results.devto?.id       || existing.devto_id    || null,
    devto_url:            results.devto?.url       || existing.devto_url   || null,
    hashnode_id:          results.hashnode?.id     || existing.hashnode_id || null,
    hashnode_url:         results.hashnode?.url    || existing.hashnode_url || null,
    devto_content_hash:   devtoOk && devtoContent
                            ? hashContent(devtoContent)
                            : (existing.devto_content_hash || null),
    hashnode_content_hash: hashOk && hashnodeContent
                            ? hashContent(hashnodeContent)
                            : (existing.hashnode_content_hash || null),
    first_published:      existing.first_published || new Date().toISOString(),
    last_published:       new Date().toISOString(),
  };

  const body = {
    message: `chore: update post-ids for ${fn(relPath)} [skip ci]`,
    content: Buffer.from(JSON.stringify(map, null, 2)).toString('base64'),
    ...(existingSha ? { sha: existingSha } : {}),
  };

  try {
    const res = await ghPut(apiBase, body);
    if (res.ok) log.ok('post-ids.json updated');
    else log.warn(`post-ids.json write failed: ${res.status}`);
  } catch (e) {
    log.warn(`post-ids.json write error: ${e.message}`);
  }
}

async function loadPostIdsFromRepo(relPath) {
  if (!ENV.GITHUB_TOKEN || !ENV.GIT_REPO) return null;
  try {
    const data = await ghGet(`/repos/${ENV.GIT_REPO}/contents/src/data/post-ids.json`);
    if (!data) return null;
    const map = JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'));
    return map[relPath] || null;
  } catch (_) { return null; }
}

// ─── GitHub Models API ────────────────────────────────────────────────────────
const GH_MODEL = 'openai/gpt-4o-mini';

async function generateContent(systemPrompt, userPrompt, maxTokens = 2000) {
  if (!ENV.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not available');

  const res = await fetchWithTimeout('https://models.github.ai/inference/chat/completions', {
    method:  'POST',
    headers: { Authorization: `Bearer ${ENV.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      model:       GH_MODEL,
      messages:    [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      max_tokens:  maxTokens,
      temperature: 0.7,
    }),
  }, AI_TIMEOUT);

  if (!res.ok) {
    const err = await safeJson(res).catch(() => ({}));
    throw new Error(err.error?.message || err.message || `GitHub Models HTTP ${res.status}`);
  }

  const data = await safeJson(res);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('GitHub Models returned empty response');
  return text.trim();
}

// ─── Shared platform content generator ───────────────────────────────────────
async function generatePlatformContent(platform, fm, systemPrompt, userPrompt, maxTokens, cacheKey) {
  const descWords = wc(fm.description || '');
  const cached    = fm[cacheKey] && typeof fm[cacheKey] === 'string';
  const cacheOk   = cached && wc(fm[cacheKey]) > Math.max(200, descWords + 50);

  if (cacheOk) {
    log.info(`${platform}: using cached content (${wc(fm[cacheKey])} words)`);
    return { text: fm[cacheKey].trim(), fromCache: true };
  }
  if (cached && !cacheOk)
    log.warn(`${platform}: cached content too short (${wc(fm[cacheKey])} words) — regenerating`);

  log.info(`${platform}: generating via GitHub Models (${GH_MODEL})…`);
  const text = await withRetry(`GitHub Models ${platform}`, () =>
    generateContent(systemPrompt, userPrompt, maxTokens)
  );
  return { text, fromCache: false };
}

// ─── Generate Dev.to content (1,200–1,300 words) ─────────────────────────────
async function generateDevtoContent(fm) {
  if (fm.skip_ai)       return { text: fm.description || fm.title, fromCache: false, skipped: true };
  if (wc(fm._body) < 300) { log.info('Dev.to: body under 300 words — using description'); return { text: fm.description || fm.title, fromCache: false }; }

  const seriesName = (fm.series || '').replace(/-/g, ' ');
  const epNum      = fm.episode_number ? `, Episode ${fm.episode_number}` : '';

  const system = `You are a technical history writer for Dev.to. Write engaging, well-structured articles for a developer audience. Use clear H2 headings, keep sections 150-200 words each. Write only the article body in markdown — no title, no preamble.`;
  const user   = `Write a 1,200-1,300 word article for the Dev.to developer and tech community.\n\nTitle: "${fm.title}"\nSubtitle: "${fm.description || ''}"\nSeries: ${seriesName}${epNum}\n\nRequirements:\n- Engaging tone suited to curious technical readers\n- Clear H2 section headings breaking up the article\n- Historical context, key figures, why this matters today\n- End with a paragraph noting this is part of the ${seriesName} series on ishistory.pages.dev\n- Write only the article body — no title heading, no preamble, no commentary`;

  return generatePlatformContent('Dev.to', fm, system, user, 2000, 'devto_content');
}

// ─── Generate Hashnode content (1,500–2,000 words) ───────────────────────────
async function generateHashnodeContent(fm) {
  if (fm.skip_ai)       return { text: fm.description || fm.title, fromCache: false, skipped: true };
  if (wc(fm._body) < 300) { log.info('Hashnode: body under 300 words — using description'); return { text: fm.description || fm.title, fromCache: false }; }

  const seriesName = (fm.series || '').replace(/-/g, ' ');
  const epNum      = fm.episode_number ? `, Episode ${fm.episode_number}` : '';

  const system = `You are an authoritative history writer for Hashnode. Write rich, narrative-driven long-form articles in a literary journalism style. Favour dense flowing paragraphs over bullet points. Write only the article body in markdown — no title, no preamble.`;
  const user   = `Write a 1,500-2,000 word editorial article for a history and ideas blog.\n\nTitle: "${fm.title}"\nSubtitle: "${fm.description || ''}"\nSeries: ${seriesName}${epNum}\n\nRequirements:\n- Authoritative, richly written, narrative-driven journalism style\n- Single flowing argument with dense paragraphs — avoid bullet points\n- Historically rich: specific names, dates, primary details\n- Build towards a conclusion about why this history matters now\n- End with a paragraph noting this is part of the ${seriesName} series on ishistory.pages.dev\n- Write only the article body — no title heading, no preamble, no commentary`;

  return generatePlatformContent('Hashnode', fm, system, user, 2500, 'hashnode_content');
}

// ─── Sanitise generated content for YAML embedding ───────────────────────────
function sanitizeForFrontmatter(text) {
  return text.replace(/^---$/gm, '\\-\\-\\-');
}

function yamlBlockScalar(key, text) {
  const trimmed = text.replace(/\n+$/, '');
  const lines   = trimmed.split('\n').map(l => '  ' + l);
  return `${key}: |\n${lines.join('\n')}`;
}

// ─── Cache generated content back to .md frontmatter ─────────────────────────
// FIX: checks each key independently so partial caches are completed correctly.
async function cacheGeneratedContent(relPath, devtoRaw, hashnodeRaw) {
  if (!ENV.GITHUB_TOKEN || !ENV.GIT_REPO) return;

  const apiBase = `https://api.github.com/repos/${ENV.GIT_REPO}/contents/${relPath}`;
  try {
    const res  = await fetchWithTimeout(apiBase, { headers: GH_HEADERS() });
    if (!res.ok) return;
    const data = await safeJson(res);
    const raw  = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');

    const hasDevto    = /^devto_content:/m.test(raw);
    const hasHashnode = /^hashnode_content:/m.test(raw);
    if (hasDevto && hasHashnode) return; // both cached — nothing to do

    let updated = raw;
    const insertions = [];
    if (!hasDevto)    insertions.push(yamlBlockScalar('devto_content',    sanitizeForFrontmatter(devtoRaw)));
    if (!hasHashnode) insertions.push(yamlBlockScalar('hashnode_content', sanitizeForFrontmatter(hashnodeRaw)));

    updated = raw.replace(/^(---[\s\S]*?)(---)/m, `$1${insertions.join('\n')}\n$2`);
    if (updated === raw) return;

    await fetchWithTimeout(apiBase, {
      method:  'PUT',
      headers: GH_HEADERS(),
      body:    JSON.stringify({
        message: `chore: cache generated content for ${fn(relPath)} [skip ci]`,
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
function formatForDevto(fm, generatedBody, url, isUpdate = false) {
  const seriesName = (fm.series || '').replace(/-/g, ' ');
  const epNum      = fm.episode_number ? ` — Episode ${fm.episode_number}` : '';
  const partLabel  = fm.part_label ? ` · ${fm.part_label}` : '';
  const fullApprox = wcDisplay(fm._body || '');
  const updateLine = isUpdate ? `> *Last updated: ${new Date().toUTCString()}*\n` : '';

  const header = [
    `> 📖 *Originally published on [ishistory.pages.dev](${url})*`,
    `> *${fullApprox} word deep-dive · ${seriesName}${epNum}${partLabel}*`,
    updateLine,
    '',
  ].join('\n');

  const cta = [
    '', '---', '',
    '## Continue Reading', '',
    `This is part of the **${seriesName}** series on [ishistory.pages.dev](https://ishistory.pages.dev).`,
    `The full article (${fullApprox} words) covers this topic in complete depth with primary sources.`,
    '', `👉 **[Read the full article](${url})**`, '',
    `*Follow the series — new episodes cover AI history, internet history, and robotics.*`,
  ].join('\n');

  return `${header}\n${generatedBody}\n${cta}`;
}

function formatForHashnode(fm, generatedBody, url, isUpdate = false) {
  const fullApprox = wcDisplay(fm._body || '');
  const seriesName = (fm.series || '').replace(/-/g, ' ');
  const metaParts  = [
    fm.episode_number ? `Episode ${fm.episode_number}` : null,
    fm.part_label     || null,
    fm.tag            || null,
    seriesName        ? `Series: ${seriesName}` : null,
  ].filter(Boolean);
  const updateLine = isUpdate ? `\n*Last updated: ${new Date().toUTCString()}*\n` : '';

  const header = [
    metaParts.length ? `*${metaParts.join(' · ')}*` : '',
    updateLine,
    fm.description ? `**${fm.description}**` : '',
    '',
  ].filter((l, i, a) => !(l === '' && (a[i - 1] === '' || i === 0))).join('\n');

  const cta = [
    '', '---', '',
    `### Read the Full Article`, '',
    `*This piece is part of the **${seriesName}** series. The complete article (${fullApprox} words) — with full historical context, primary sources, and extended analysis — is published on ishistory.pages.dev.*`,
    '', `**[→ Read the complete article](${url})**`,
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

// ─── Exponential backoff retry ────────────────────────────────────────────────
async function withRetry(label, fn, maxAttempts = MAX_ATTEMPTS) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt < maxAttempts) {
        // Exponential backoff + jitter: base * 2^(attempt-1) + random(0-500ms)
        const delay = RETRY_BASE_MS * (2 ** (attempt - 1)) + Math.random() * 500;
        log.warn(`${label}: attempt ${attempt}/${maxAttempts} failed (${err.message}) — retrying in ${Math.round(delay)}ms`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// ─── Poll URL until live ──────────────────────────────────────────────────────
// Ensures the page is deployed before notifying platforms with the URL.
async function waitForLiveUrl(url) {
  const start = Date.now();
  log.info(`Polling ${url} until live…`);
  while (Date.now() - start < URL_POLL_MAX) {
    try {
      const res = await fetchWithTimeout(url, { method: 'HEAD' }, 10_000);
      if (res.ok || res.status === 405) {
        log.ok(`URL live after ${Math.round((Date.now() - start) / 1000)}s`);
        return true;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, URL_POLL_STEP));
  }
  log.warn(`URL not confirmed live after ${URL_POLL_MAX / 1000}s — proceeding anyway`);
  return false;
}

// ─── Platform: Discord ────────────────────────────────────────────────────────
async function postDiscord(fm, url) {
  if (!shouldRunPlatform('discord') || !ENV.DISCORD_WEBHOOK)
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

// ─── Platform: Dev.to — Publish ───────────────────────────────────────────────
async function postDevto(fm, teaser, url) {
  if (!shouldRunPlatform('devto') || !ENV.DEVTO_API_KEY)
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
    if (data.error?.includes('canonical'))
      throw new Error('Dev.to: canonical URL already exists — use --update flag to update the existing article');
    if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
    return { ok: true, url: data.url, id: data.id };
  });
}

// ─── Platform: Dev.to — Update ───────────────────────────────────────────────
async function updateDevto(fm, content, articleId) {
  if (!shouldRunPlatform('devto') || !ENV.DEVTO_API_KEY)
    return { ok: false, skipped: true, err: 'DEVTO_API_KEY not configured' };
  if (!articleId)
    return { ok: false, skipped: true, err: 'No Dev.to article ID — was it ever published?' };

  return withRetry('Dev.to update', async () => {
    const res = await fetchWithTimeout(`https://dev.to/api/articles/${articleId}`, {
      method:  'PUT',
      headers: { 'api-key': ENV.DEVTO_API_KEY, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        article: {
          title:         fm.title,
          body_markdown: content,
          // canonical_url intentionally omitted — immutable after first publish
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

// ─── Platform: Hashnode — Publish ────────────────────────────────────────────
async function postHashnode(fm, teaser, url) {
  if (!shouldRunPlatform('hashnode') || !ENV.HASHNODE_KEY)
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
      // Classify permanent vs retryable errors
      const isPermanent = /publication not found|invalid.*tag|not authoris/i.test(errs);
      const err = new Error(errs || `HTTP ${res.status}`);
      if (isPermanent) err.permanent = true;
      throw err;
    }
    return { ok: true, url: post.url, id: post.id };
  });
}

// ─── Platform: Hashnode — Update ─────────────────────────────────────────────
async function updateHashnode(fm, content, url, postId) {
  if (!shouldRunPlatform('hashnode') || !ENV.HASHNODE_KEY)
    return { ok: false, skipped: true, err: 'HASHNODE_API_KEY not configured' };
  if (!postId)
    return { ok: false, skipped: true, err: 'No Hashnode post ID — was it ever published?' };

  return withRetry('Hashnode update', async () => {
    const res = await fetchWithTimeout('https://gql.hashnode.com', {
      method:  'POST',
      headers: { Authorization: ENV.HASHNODE_KEY, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        query: `mutation UpdatePost($input: UpdatePostInput!) {
          updatePost(input: $input) { post { id url title updatedAt } }
        }`,
        variables: {
          input: {
            id:                 postId,
            title:              fm.title,
            contentMarkdown:    content,
            originalArticleURL: url,
            tags:               hashnodeTags(fm.series),
          },
        },
      }),
    });

    const data = await safeJson(res).catch(() => ({}));
    const post = data.data?.updatePost?.post;
    if (!post) {
      const errs = (data.errors || []).map(e => e.message).join('; ');
      const isPermanent = /not authoris|post not found/i.test(errs);
      const err = new Error(errs || `HTTP ${res.status}`);
      if (isPermanent) err.permanent = true;
      throw err;
    }
    return { ok: true, url: post.url, id: post.id, updatedAt: post.updatedAt };
  });
}

// ─── Platform: Ntfy ───────────────────────────────────────────────────────────
async function sendNtfy(fm, url) {
  if (!shouldRunPlatform('ntfy') || !ENV.NTFY_TOPIC)
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
  if (!shouldRunPlatform('indexnow') || !ENV.INDEXNOW_KEY)
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
async function reportToWorker(filePath, results, mode = 'publish') {
  if (!ENV.WORKER_URL || !ENV.CMS_API_KEY) {
    log.warn('WORKER_URL or CMS_API_KEY not set — skipping Worker report');
    return;
  }

  const toInt  = r => r.skipped ? -1 : (r.ok ? 1 : 0);
  const timestamp = Date.now();
  const bodyObj = {
    path:         filePath,
    repo:         ENV.GIT_REPO,
    commit_sha:   ENV.GIT_SHA,
    mode,
    discord:      toInt(results.discord),
    devto:        toInt(results.devto),
    hashnode:     toInt(results.hashnode),
    ntfy:         toInt(results.ntfy),
    indexnow:     toInt(results.indexnow),
    discord_err:  results.discord?.err  || null,
    devto_err:    results.devto?.err    || null,
    hashnode_err: results.hashnode?.err || null,
    ntfy_err:     results.ntfy?.err     || null,
    indexnow_err: results.indexnow?.err || null,
  };
  const bodyStr = JSON.stringify(bodyObj);
  const sig     = signRequest(bodyStr, ENV.CMS_API_KEY, timestamp);

  try {
    const res = await fetchWithTimeout(`${ENV.WORKER_URL}/webhook/pipeline-result`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${ENV.CMS_API_KEY}`,
        'X-Timestamp':   String(timestamp),
        'X-Signature':   sig,
      },
      body: bodyStr,
    });
    if (!res.ok) log.warn(`Worker callback HTTP ${res.status}`);
    else         log.ok('Results reported to Worker');
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

// ─── GitHub Actions step summary ─────────────────────────────────────────────
function writeStepSummary(fm, body, results, url, mode = 'publish') {
  const f = process.env.GITHUB_STEP_SUMMARY;
  if (!f) return;

  const rows = Object.entries(results).map(([p, r]) => {
    const status = r.skipped ? '⏭ Skipped' : r.ok ? '✅ OK' : '❌ Failed';
    const detail = r.url ? `[View post](${r.url})` : (r.err || '—');
    return `| ${p} | ${status} | ${detail} |`;
  });

  const modeLabel = mode === 'update' ? '🔄 Updated' : '📰 Published';
  const md = [
    `## ${modeLabel}: ${fm.title}`,
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

// ─── Write results to src/data/status.json ────────────────────────────────────
async function updateStatusJson(filePath, results, commitSha, aiFlags = {}) {
  if (!ENV.GITHUB_TOKEN || !ENV.GIT_REPO) {
    log.warn('GITHUB_TOKEN or GIT_REPO missing — skipping status.json update');
    return;
  }

  const apiBase = `https://api.github.com/repos/${ENV.GIT_REPO}/contents/src/data/status.json`;
  let current = { updated_at: null, runs: [] };
  let existingSha = null;

  try {
    const data = await ghGet(`/repos/${ENV.GIT_REPO}/contents/src/data/status.json`);
    if (data) {
      existingSha = data.sha;
      current = JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'));
    }
  } catch (_) {}

  const newRun = {
    file:          filePath,
    commit:        commitSha || 'unknown',
    ran_at:        new Date().toISOString(),
    ai_generated:  !!aiFlags.generated,
    ai_cached:     !!aiFlags.cached,
    ...Object.fromEntries(
      PLATFORMS.map(p => [p, {
        ok:      results[p]?.ok      ?? false,
        skipped: !!results[p]?.skipped,
        err:     results[p]?.err     || null,
      }])
    ),
  };

  current.updated_at = new Date().toISOString();
  current.runs = [newRun, ...(current.runs || [])].slice(0, 50);

  try {
    const res = await ghPut(
      `/repos/${ENV.GIT_REPO}/contents/src/data/status.json`,
      {
        message: `chore: update pipeline status [skip ci]`,
        content: Buffer.from(JSON.stringify(current, null, 2)).toString('base64'),
        ...(existingSha ? { sha: existingSha } : {}),
      }
    );
    if (res.ok) log.ok('status.json updated');
    else {
      const err = await safeJson(res).catch(() => ({}));
      log.warn(`status.json update failed: ${err.message || res.status}`);
    }
  } catch (e) {
    log.warn(`status.json update error: ${e.message}`);
  }
}

// ─── Run: Publish (new post) ──────────────────────────────────────────────────
async function runPublish(relPath, fm, body, url) {
  log.section('Generating platform content');

  const [devtoResult, hashnodeResult] = await Promise.all([
    ENV.GITHUB_TOKEN
      ? generateDevtoContent(fm).catch(e => { log.warn(`Dev.to gen failed: ${e.message}`); return { text: fm.description || fm.title, fromCache: false }; })
      : Promise.resolve({ text: fm.description || fm.title, fromCache: false }),
    ENV.GITHUB_TOKEN
      ? generateHashnodeContent(fm).catch(e => { log.warn(`Hashnode gen failed: ${e.message}`); return { text: fm.description || fm.title, fromCache: false }; })
      : Promise.resolve({ text: fm.description || fm.title, fromCache: false }),
  ]);

  log.info(`Dev.to:   ${wc(devtoResult.text)} words ${devtoResult.fromCache ? '(cached)' : '(generated)'}`);
  log.info(`Hashnode: ${wc(hashnodeResult.text)} words ${hashnodeResult.fromCache ? '(cached)' : '(generated)'}`);

  const aiFlags = {
    generated: !devtoResult.fromCache || !hashnodeResult.fromCache,
    cached:    devtoResult.fromCache  && hashnodeResult.fromCache,
  };

  // Cache content back to frontmatter (non-blocking)
  cacheGeneratedContent(relPath, devtoResult.text, hashnodeResult.text).catch(e =>
    log.warn(`Cache write-back failed: ${e.message}`)
  );

  const devtoContent    = formatForDevto(fm, devtoResult.text, url);
  const hashnodeContent = formatForHashnode(fm, hashnodeResult.text, url);

  const issues = validateFm(fm);
  if (issues.length) {
    log.section('Frontmatter warnings');
    issues.forEach(i => log.warn(i));
  }

  if (IS_DRY_RUN) {
    log.section('Dry run — no posts will be made');
    log.info('Dev.to content preview (first 200 chars):');
    log.info(devtoContent.slice(0, 200) + '…');
    log.info('Hashnode content preview (first 200 chars):');
    log.info(hashnodeContent.slice(0, 200) + '…');
    return;
  }

  // Wait for live URL before notifying platforms
  log.section('Waiting for deployment');
  await waitForLiveUrl(url);

  // Run platforms — IndexNow fires last (search engine notifier, needs live page)
  log.section('Running platforms');
  const [discord, devto, hashnode, ntfy] = await Promise.all([
    postDiscord(fm, url).catch(e => ({ ok: false, err: e.message })),
    postDevto(fm, devtoContent, url).catch(e => ({ ok: false, err: e.message })),
    postHashnode(fm, hashnodeContent, url).catch(e => ({ ok: false, err: e.message })),
    sendNtfy(fm, url).catch(e => ({ ok: false, err: e.message })),
  ]);
  const indexnow = await pingIndexNow(url).catch(e => ({ ok: false, err: e.message }));

  const results = { discord, devto, hashnode, ntfy, indexnow };

  printResults(results);
  writeStepSummary(fm, body, results, url, 'publish');
  await updateStatusJson(relPath, results, ENV.GIT_SHA, aiFlags);
  await storePlatformIds(relPath, results, devtoContent, hashnodeContent);
  await reportToWorker(relPath, results, 'publish');

  const active    = Object.values(results).filter(r => !r.skipped);
  const allFailed = active.length > 0 && active.every(r => !r.ok);
  if (allFailed) {
    log.fail('All configured platforms failed.');
    process.exit(1);
  }
}

// ─── Run: Update (existing post) ─────────────────────────────────────────────
async function runUpdate(relPath, fm, body, url) {
  log.section('Loading stored post IDs');

  const ids = await loadPostIdsFromRepo(relPath);
  if (!ids) {
    log.fail('No post IDs found for this file. Run without --update to publish first.');
    process.exit(1);
  }

  log.info(`Dev.to ID:    ${ids.devto_id    || '(none)'}`);
  log.info(`Hashnode ID:  ${ids.hashnode_id  || '(none)'}`);

  log.section('Generating platform content');

  const [devtoResult, hashnodeResult] = await Promise.all([
    ENV.GITHUB_TOKEN
      ? generateDevtoContent(fm).catch(e => { log.warn(`Dev.to gen: ${e.message}`); return { text: fm.description || fm.title, fromCache: false }; })
      : Promise.resolve({ text: fm.description || fm.title, fromCache: false }),
    ENV.GITHUB_TOKEN
      ? generateHashnodeContent(fm).catch(e => { log.warn(`Hashnode gen: ${e.message}`); return { text: fm.description || fm.title, fromCache: false }; })
      : Promise.resolve({ text: fm.description || fm.title, fromCache: false }),
  ]);

  const devtoContent    = formatForDevto(fm, devtoResult.text, url, true);
  const hashnodeContent = formatForHashnode(fm, hashnodeResult.text, url, true);

  // Change detection — skip unchanged platforms to avoid spam
  const devtoChanged    = hasContentChanged(relPath, 'devto', devtoContent);
  const hashnodeChanged = hasContentChanged(relPath, 'hashnode', hashnodeContent);

  log.info(`Dev.to content changed:    ${devtoChanged}`);
  log.info(`Hashnode content changed:  ${hashnodeChanged}`);

  if (IS_DRY_RUN) {
    log.section('Dry run — no updates will be made');
    log.info(`Would update Dev.to (ID: ${ids.devto_id || 'none'}): ${devtoChanged}`);
    log.info(`Would update Hashnode (ID: ${ids.hashnode_id || 'none'}): ${hashnodeChanged}`);
    return;
  }

  log.section('Running platform updates');

  const [devto, hashnode] = await Promise.all([
    devtoChanged
      ? updateDevto(fm, devtoContent, ids.devto_id).catch(e => ({ ok: false, err: e.message }))
      : Promise.resolve({ ok: true, skipped: true, err: 'Content unchanged — skipped' }),
    hashnodeChanged
      ? updateHashnode(fm, hashnodeContent, url, ids.hashnode_id).catch(e => ({ ok: false, err: e.message }))
      : Promise.resolve({ ok: true, skipped: true, err: 'Content unchanged — skipped' }),
  ]);

  const results = {
    devto,
    hashnode,
    discord:  { ok: true, skipped: true, err: 'Not re-notified on update' },
    ntfy:     { ok: true, skipped: true, err: 'Not re-notified on update' },
    indexnow: { ok: true, skipped: true, err: 'Not re-pinged on update'   },
  };

  printResults(results);
  writeStepSummary(fm, body, results, url, 'update');
  await updateStatusJson(relPath, results, ENV.GIT_SHA);
  await storePlatformIds(relPath, results, devtoContent, hashnodeContent);
  await reportToWorker(relPath, results, 'update');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const relPath = process.argv[2];
  if (!relPath) {
    console.error('Usage: node pipeline.mjs <repo-relative-path> [--update] [--dry-run] [--platforms=devto,hashnode]');
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

  const mode = IS_UPDATE ? 'UPDATE' : IS_DRY_RUN ? 'DRY RUN' : 'PUBLISH';
  log.section(`${mode}: ${path.basename(relPath)}`);
  log.info(`Title:    ${fm.title  || '(missing)'}`);
  log.info(`Series:   ${fm.series || '(missing)'}`);
  log.info(`URL:      ${url}`);
  log.info(`Commit:   ${ENV.GIT_SHA || '(local)'}`);
  log.info(`Article:  ${wc(body)} words`);
  if (PLATFORMS_FLAG) log.info(`Platforms: ${PLATFORMS_FLAG.join(', ')}`);

  logMissingSecrets();

  if (IS_UPDATE) {
    await runUpdate(relPath, fm, body, url);
  } else {
    await runPublish(relPath, fm, body, url);
  }
}

main();
