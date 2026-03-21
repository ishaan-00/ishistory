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

// ─── Paths ────────────────────────────────────────────────────────────────────
const __dir     = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dir, '../..');
const SITE_URL  = 'https://ishistory.pages.dev';

// ─── Retry config ─────────────────────────────────────────────────────────────
const MAX_RETRIES    = 2;
const RETRY_DELAY_MS = 1500;

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
};

// ─── Logger ───────────────────────────────────────────────────────────────────
const log = {
  info:    (...a) => console.log('  ·', ...a),
  ok:      (...a) => console.log('  ✓', ...a),
  warn:    (...a) => console.warn('  ⚠', ...a),
  fail:    (...a) => console.error('  ✗', ...a),
  section: (t)   => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 48 - t.length))}`),
};

// ─── Inline frontmatter parser (zero deps) ────────────────────────────────────
// Handles all ishistory fields including multiline `teaser: |` blocks.
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { fm: {}, body: raw };

  const fm = {};
  let currentKey  = null;
  let multilineVal = null;
  let multilineIndent = 0;

  for (const line of match[1].split('\n')) {
    // Inside a block scalar
    if (multilineVal !== null) {
      // Detect indent of first content line
      if (multilineIndent === 0 && line.trim()) {
        multilineIndent = line.length - line.trimStart().length;
      }
      if (line.trim() === '' || (multilineIndent > 0 && line.startsWith(' '.repeat(multilineIndent)))) {
        multilineVal += (multilineVal ? '\n' : '') + line.slice(multilineIndent);
        continue;
      }
      // End of block scalar
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

    // Block scalar marker
    if (rest === '|') {
      currentKey      = key;
      multilineVal    = '';
      multilineIndent = 0;
      continue;
    }

    // Strip surrounding quotes and coerce integer
    let val = rest.replace(/^["']|["']$/g, '');
    if (/^\d+$/.test(val)) val = parseInt(val, 10);
    fm[key] = val;
  }

  // Flush trailing multiline value
  if (multilineVal !== null && currentKey) fm[currentKey] = multilineVal.trimEnd();

  return { fm, body: match[2] };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function canonical(filePath) {
  const norm   = filePath.replace(/\\/g, '/');
  const parts  = norm.split('/');
  const series = parts[parts.length - 2] || '';
  const slug   = path.basename(filePath, '.md');
  return `${SITE_URL}/${series ? series + '/' : ''}${slug}`;
}

function wc(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

function validateFm(fm) {
  const issues = [];
  if (!fm.title)       issues.push('missing: title');
  if (!fm.series)      issues.push('missing: series');
  if (!fm.date)        issues.push('missing: date');
  if (!fm.description) issues.push('recommended: description (Discord embed + teaser fallback)');
  return issues;
}

// ─── Teaser builder ───────────────────────────────────────────────────────────
// ─── Core excerpt builder (shared base) ──────────────────────────────────────
// Uses `teaser` frontmatter if present, otherwise auto-generates from body.
function buildExcerpt(fm, body) {
  if (fm.teaser && typeof fm.teaser === 'string' && wc(fm.teaser) > 50) {
    log.info(`Using custom teaser — ${wc(fm.teaser)} words`);
    return fm.teaser.trim();
  }
  log.warn('No custom teaser — auto-generating excerpt');
  const sections  = body.split(/^(?=## )/m);
  const introRaw  = sections[0].replace(/^#[^\n]*\n+/, '').trim();
  const introPara = introRaw.split(/\n{2,}/)[0].trim();
  let excerpt = '';
  if (fm.description)                            excerpt += fm.description + '\n\n';
  if (introPara && introPara !== fm.description) excerpt += introPara + '\n\n';
  for (let i = 1; i < sections.length && wc(excerpt) < 900; i++) {
    const lines     = sections[i].split('\n');
    const heading   = lines[0].trim();
    const sBody     = lines.slice(1).join('\n').trim();
    const firstPara = sBody.split(/\n{2,}/)[0].trim();
    if (firstPara) excerpt += `## ${heading}\n\n${firstPara}\n\n`;
  }
  log.info(`Auto-excerpt — ${wc(excerpt.trim())} words`);
  return excerpt.trim();
}

// ─── Dev.to formatter ─────────────────────────────────────────────────────────
// Community platform — readers scan fast. Opens with a canonical note (Dev.to
// norm), uses a community-style CTA, keeps series context light.
function formatForDevto(fm, body, url) {
  const excerpt    = buildExcerpt(fm, body);
  const totalWords = wc(body);
  const approx     = `~${(Math.round(totalWords / 100) * 100).toLocaleString()}`;
  const seriesName = (fm.series || '').replace(/-/g, ' ');
  const epNum      = fm.episode_number ? ` — Episode ${fm.episode_number}` : '';
  const partLabel  = fm.part_label ? ` · ${fm.part_label}` : '';

  const header = [
    `> 📖 *Originally published on [ishistory.pages.dev](${url})*`,
    `> *${approx} word deep-dive · ${seriesName}${epNum}${partLabel}*`,
    '',
  ].join('\n');

  const cta = [
    '',
    '---',
    '',
    '## Continue Reading',
    '',
    `This post is part of the **${seriesName}** series on [ishistory.pages.dev](https://ishistory.pages.dev).`,
    `The full article (${approx} words) covers this topic in complete depth.`,
    '',
    `👉 **[Read the full article on ishistory.pages.dev](${url})**`,
    '',
    `*Follow the series — new episodes cover AI history, internet history, and robotics.*`,
  ].join('\n');

  return `${header}\n${excerpt}${cta}`;
}

// ─── Hashnode formatter ───────────────────────────────────────────────────────
// Editorial/blog audience — expects context, series info, polished structure.
// Opens with an episode metadata block, uses richer markdown, editorial CTA.
function formatForHashnode(fm, body, url) {
  const excerpt    = buildExcerpt(fm, body);
  const totalWords = wc(body);
  const approx     = `~${(Math.round(totalWords / 100) * 100).toLocaleString()}`;
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
  ].filter((l, i, a) => !(l === '' && (a[i-1] === '' || i === 0))).join('\n');

  const cta = [
    '',
    '---',
    '',
    `### Full Article`,
    '',
    `*This is an excerpt from a ${approx}-word article in the **${seriesName}** series.*`,
    '',
    `The complete piece — with full historical context, primary sources, and detailed analysis — is on [ishistory.pages.dev](https://ishistory.pages.dev).`,
    '',
    `**[→ Read the complete article](${url})**`,
  ].join('\n');

  return `${header}\n${excerpt}${cta}`;
}

// ─── Tag sanitisers ───────────────────────────────────────────────────────────
function devtoTags(series) {
  return [series, 'history', 'technology', 'programming']
    .filter(Boolean)
    .map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(t => t.length > 1)
    .slice(0, 4);
}

function hashnodeTags(series) {
  return [series, 'history']
    .filter(Boolean)
    .map(t => ({ name: t, slug: t.toLowerCase().replace(/[^a-z0-9]/g, '-') }));
}

// ─── Retry wrapper ────────────────────────────────────────────────────────────
async function withRetry(label, fn) {
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt <= MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        log.warn(`${label}: attempt ${attempt} failed (${err.message}) — retrying in ${delay}ms`);
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
    if (fm.series)         fields.push({ name: 'Series',  value: fm.series.replace(/-/g, ' '), inline: true });
    if (fm.episode_number) fields.push({ name: 'Episode', value: `#${fm.episode_number}`,      inline: true });
    if (fm.tag)            fields.push({ name: 'Topic',   value: String(fm.tag),               inline: true });
    if (fm.date)           fields.push({ name: 'Date',    value: String(fm.date).slice(0, 10), inline: true });

    const res = await fetch(ENV.DISCORD_WEBHOOK, {
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
    const res = await fetch('https://dev.to/api/articles', {
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

    const data = await res.json().catch(() => ({}));
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
    const res = await fetch('https://gql.hashnode.com', {
      method:  'POST',
      headers: { Authorization: ENV.HASHNODE_KEY, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        query: `mutation PublishPost($input: PublishPostInput!) {
          publishPost(input: $input) { post { id url title } }
        }`,
        variables: {
          input: {
            title:           fm.title,
            contentMarkdown: teaser,
            publicationId:   ENV.HASHNODE_PUB_ID,
            originalArticleURL: url,
            tags:            hashnodeTags(fm.series),
          },
        },
      }),
    });

    const data = await res.json().catch(() => ({}));
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
    const res = await fetch(`https://ntfy.sh/${ENV.NTFY_TOPIC}`, {
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
    const res = await fetch('https://api.indexnow.org/indexnow', {
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
    const res = await fetch(`${ENV.WORKER_URL}/webhook/pipeline-result`, {
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
  const url          = canonical(relPath);
  const devtoContent    = formatForDevto(fm, body, url);
  const hashnodeContent = formatForHashnode(fm, body, url);

  log.section(`Processing: ${path.basename(relPath)}`);
  log.info(`Title:    ${fm.title || '(missing)'}`);
  log.info(`Series:   ${fm.series || '(missing)'}`);
  log.info(`URL:      ${url}`);
  log.info(`Commit:   ${ENV.GIT_SHA || '(local)'}`);
  log.info(`Article:  ${wc(body)} words`);
  log.info(`Dev.to:   ${wc(devtoContent)} words`);
  log.info(`Hashnode: ${wc(hashnodeContent)} words`);

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

  // Fail only if every configured (non-skipped) platform failed
  const active    = Object.values(results).filter(r => !r.skipped);
  const allFailed = active.length > 0 && active.every(r => !r.ok);
  if (allFailed) {
    log.fail('All configured platforms failed.');
    process.exit(1);
  }
}

// ─── Write results to src/data/status.json in repo ───────────────────────────
// Uses the automatic GITHUB_TOKEN available in Actions (no extra secret needed).
// Commit message contains [skip ci] so it never re-triggers the pipeline.
async function updateStatusJson(filePath, results, commitSha) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = ENV.GIT_REPO;
  if (!token || !repo) { log.warn('GITHUB_TOKEN or GIT_REPO missing — skipping status.json update'); return; }

  const apiBase = `https://api.github.com/repos/${repo}/contents/src/data/status.json`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };

  // Read current file (may not exist yet)
  let current = { updated_at: null, runs: [] };
  let existingSha = null;
  try {
    const res = await fetch(apiBase, { headers });
    if (res.ok) {
      const data = await res.json();
      existingSha = data.sha;
      current = JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'));
    }
  } catch (_) {}

  // Prepend new run entry, keep last 50
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

  // Commit back with [skip ci] to prevent pipeline re-trigger
  const body = {
    message: `chore: update pipeline status [skip ci]`,
    content: Buffer.from(JSON.stringify(current, null, 2)).toString('base64'),
    ...(existingSha ? { sha: existingSha } : {}),
  };

  try {
    const res = await fetch(apiBase, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (res.ok) log.ok('status.json updated in repo');
    else {
      const err = await res.json().catch(() => ({}));
      log.warn(`status.json update failed: ${err.message || res.status}`);
    }
  } catch (e) {
    log.warn(`status.json update error: ${e.message}`);
  }
}

main();
