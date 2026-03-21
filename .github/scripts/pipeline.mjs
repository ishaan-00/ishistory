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
  GITHUB_TOKEN:     process.env.GITHUB_TOKEN || '',  // used for GitHub Models + status.json writes
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

// ─── GitHub Models API ───────────────────────────────────────────────────────
// Uses GITHUB_TOKEN (already available in Actions) — no extra secret needed.
// OpenAI-compatible endpoint. Always warm, no cold starts.
// Requires `permissions: models: read` in the workflow.
const GH_MODEL = 'openai/gpt-4o-mini'; // fast + cheap, great for article generation

async function generateContent(systemPrompt, userPrompt, maxTokens = 2000) {
  if (!ENV.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not available');

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 90_000); // 90s timeout

  let res;
  try {
    res = await fetch('https://models.github.ai/inference/chat/completions', {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        Authorization: `Bearer ${ENV.GITHUB_TOKEN}`,
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
    });
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error('GitHub Models API timed out after 90s');
    throw e;
  }
  clearTimeout(timeout);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || err.message || `GitHub Models HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('GitHub Models returned empty response');
  return text.trim();
}

// ─── Generate Dev.to content (1,200–1,300 words) ─────────────────────────────
// Community platform — scannable, sectioned, developer-friendly tone.
// Cached in fm.devto_content frontmatter — only calls API on first publish.
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

  const user = `Write a 1,200-1,300 word article for the Dev.to developer and tech community.

Title: "${fm.title}"
Subtitle: "${fm.description || ''}"
Series: ${seriesName}${epNum}

Requirements:
- Engaging tone suited to curious technical readers
- Clear H2 section headings breaking up the article
- Historical context, key figures, why this matters today
- End with a paragraph noting this is part of the ${seriesName} series on ishistory.pages.dev
- Write only the article body — no title heading, no preamble, no commentary`;

  return withRetry('GitHub Models Dev.to', () => generateContent(system, user, 2000));
}

// ─── Generate Hashnode content (1,500–2,000 words) ───────────────────────────
// Editorial blog audience — narrative-driven, authoritative, long-form journalism.
// Cached in fm.hashnode_content frontmatter — only calls API on first publish.
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

  const user = `Write a 1,500-2,000 word editorial article for a history and ideas blog.

Title: "${fm.title}"
Subtitle: "${fm.description || ''}"
Series: ${seriesName}${epNum}

Requirements:
- Authoritative, richly written, narrative-driven journalism style
- Single flowing argument with dense paragraphs — avoid bullet points
- Historically rich: specific names, dates, primary details
- Build towards a conclusion about why this history matters now
- End with a paragraph noting this is part of the ${seriesName} series on ishistory.pages.dev
- Write only the article body — no title heading, no preamble, no commentary`;

  return withRetry('GitHub Models Hashnode', () => generateContent(system, user, 2500));
}

// ─── Write generated content back to .md frontmatter ─────────────────────────
// Commits devto_content and hashnode_content into the file so future runs
// read from cache instead of calling the API again. Uses [skip ci] to
// prevent re-triggering the pipeline. Falls back silently if commit fails.
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
    const res  = await fetch(apiBase, { headers });
    if (!res.ok) return;
    const data = await res.json();
    const raw  = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');

    // Inject both fields into frontmatter after the closing ---
    // Only inject if not already present
    let updated = raw;
    if (!updated.includes('devto_content:')) {
      const devtoBlock    = 'devto_content: |\n' + devtoRaw.split('\n').map(l => '  ' + l).join('\n');
      const hashnodeBlock = 'hashnode_content: |\n' + hashnodeRaw.split('\n').map(l => '  ' + l).join('\n');
      // Insert before the closing --- of frontmatter
      updated = updated.replace(/^(---[\s\S]*?)(---)/m, `$1${devtoBlock}
${hashnodeBlock}
$2`);
    }

    if (updated === raw) return; // nothing to write

    await fetch(apiBase, {
      method: 'PUT', headers,
      body:   JSON.stringify({
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

// ─── Formatters — inject generated content into platform structure ─────────────

// Dev.to: community header + generated body + community CTA
function formatForDevto(fm, generatedBody, url) {
  const totalWords = wc(generatedBody);
  const approx     = `~${(Math.round(totalWords / 100) * 100).toLocaleString()}`;
  const seriesName = (fm.series || '').replace(/-/g, ' ');
  const epNum      = fm.episode_number ? ` — Episode ${fm.episode_number}` : '';
  const partLabel  = fm.part_label ? ` · ${fm.part_label}` : '';
  const fullApprox = `~${(Math.round(wc(fm._body || '') / 100) * 100).toLocaleString()}`;

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

// Hashnode: episode metadata block + generated body + editorial CTA
function formatForHashnode(fm, generatedBody, url) {
  const fullApprox = `~${(Math.round(wc(fm._body || '') / 100) * 100).toLocaleString()}`;
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
  fm._body           = body; // pass article body to formatters for word count
  const url          = canonical(relPath);

  log.section(`Processing: ${path.basename(relPath)}`);
  log.info(`Title:    ${fm.title || '(missing)'}`);
  log.info(`Series:   ${fm.series || '(missing)'}`);
  log.info(`URL:      ${url}`);
  log.info(`Commit:   ${ENV.GIT_SHA || '(local)'}`);
  log.info(`Article:  ${wc(body)} words`);

  // Generate platform-specific content via HF API (2 calls total)
  // Falls back to description if GITHUB_TOKEN unavailable — never blocks the pipeline
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

  // Cache generated content back to .md frontmatter (non-blocking)
  cacheGeneratedContent(relPath, devtoRaw, hashnodeRaw).catch(() => {});

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
