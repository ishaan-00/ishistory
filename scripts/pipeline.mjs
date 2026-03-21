/**
 * ishistory — Publish Pipeline
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs in GitHub Actions when a new .md file is added to src/content/**.
 * Distributes the post to: Discord · Dev.to · Hashnode · Ntfy · Bing IndexNow
 * Reports per-platform results back to the Worker → stored in pipeline_log.
 *
 * Usage: node .github/scripts/pipeline.mjs <repo-relative-path-to-md>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

// ─── Constants ────────────────────────────────────────────────────────────────
const SITE_URL   = 'https://ishistory.pages.dev';
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(SCRIPT_DIR, '../..');

// How many times to retry a failed platform call before giving up
const MAX_RETRIES    = 2;
const RETRY_DELAY_MS = 1500;

// ─── Environment ──────────────────────────────────────────────────────────────
const ENV = {
  DEVTO_API_KEY:            process.env.DEVTO_API_KEY           || '',
  HASHNODE_API_KEY:         process.env.HASHNODE_API_KEY        || '',
  HASHNODE_PUBLICATION_ID:  process.env.HASHNODE_PUBLICATION_ID || '',
  DISCORD_WEBHOOK:          process.env.DISCORD_WEBHOOK_ARTICLES || '',
  NTFY_TOPIC:               process.env.NTFY_TOPIC              || '',
  INDEXNOW_KEY:             process.env.INDEXNOW_KEY            || '',
  WORKER_URL:               process.env.WORKER_URL              || '',
  CMS_API_KEY:              process.env.CMS_API_KEY             || '',
  GIT_SHA:                  (process.env.GIT_SHA || '').slice(0, 7),
  GIT_REPO:                 process.env.GIT_REPO               || 'ishaan-00/ishistory',
};

// ─── Logging ──────────────────────────────────────────────────────────────────
const log = {
  info:    (...a) => console.log('  ℹ', ...a),
  success: (...a) => console.log('  ✓', ...a),
  warn:    (...a) => console.warn('  ⚠', ...a),
  error:   (...a) => console.error('  ✗', ...a),
  section: (t)   => console.log(`\n${'─'.repeat(52)}\n  ${t}\n${'─'.repeat(52)}`),
};

// ─── Retry wrapper ────────────────────────────────────────────────────────────
async function withRetry(name, fn, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt <= retries) {
        log.warn(`${name}: attempt ${attempt} failed (${err.message}) — retrying in ${RETRY_DELAY_MS}ms…`);
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      } else {
        throw err;
      }
    }
  }
}

// ─── Frontmatter validation ───────────────────────────────────────────────────
function validateFrontmatter(fm, filePath) {
  const issues = [];
  if (!fm.title)          issues.push('missing: title');
  if (!fm.series)         issues.push('missing: series');
  if (!fm.date)           issues.push('missing: date');
  if (!fm.description)    issues.push('recommended: description (used in Discord embed and teaser)');
  if (fm.title && fm.title.length > 250) issues.push('title too long (>250 chars)');
  return issues;
}

// ─── Canonical URL ────────────────────────────────────────────────────────────
function canonicalUrl(filePath) {
  const parts  = filePath.replace(/\\/g, '/').split('/');
  const series = parts[parts.length - 2] || '';
  const slug   = path.basename(filePath, '.md');
  return `${SITE_URL}/${series ? series + '/' : ''}${slug}`;
}

// ─── Word counter ─────────────────────────────────────────────────────────────
function wordCount(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

// ─── Teaser builder ───────────────────────────────────────────────────────────
// Priority:
//   1. `teaser` frontmatter field      (custom written — best)
//   2. Auto-generated from body        (description + intro + section excerpts)
function buildTeaser(fm, body, url) {
  const totalWords = wordCount(body);
  const approxK    = `~${Math.round(totalWords / 100) * 100}`;
  const cta        = `\n\n---\n\n*This is an excerpt. Read the full article (${approxK} words) on ishistory.pages.dev →*\n\n**[Continue reading: ${fm.title}](${url})**`;

  // Custom teaser takes absolute priority
  if (fm.teaser && fm.teaser.trim().length > 50) {
    log.info(`Using custom teaser (${wordCount(fm.teaser)} words)`);
    return fm.teaser.trim() + cta;
  }

  log.info('No custom teaser found — auto-generating from body');

  // Auto-generate: strip frontmatter, split on H2 sections
  const sections   = body.split(/^(?=## )/m);
  const introBlock = sections[0].replace(/^#[^\n]+\n+/, '').trim();
  const introPara  = introBlock.split(/\n{2,}/)[0].trim();

  let result = '';
  if (fm.description) result += `${fm.description}\n\n`;
  if (introPara && introPara !== fm.description) result += `${introPara}\n\n`;

  // Pull first paragraph from each H2 section until ~900 words
  for (let i = 1; i < sections.length; i++) {
    const lines      = sections[i].split('\n');
    const heading    = lines[0].trim();
    const body_      = lines.slice(1).join('\n').trim();
    const firstPara  = body_.split(/\n{2,}/)[0].trim();
    if (!firstPara) continue;
    result += `## ${heading}\n\n${firstPara}\n\n`;
    if (wordCount(result) > 900) break;
  }

  log.info(`Auto-teaser: ${wordCount(result)} words`);
  return result.trim() + cta;
}

// ─── Tag helpers ──────────────────────────────────────────────────────────────
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

// ─── Platform: Discord ────────────────────────────────────────────────────────
async function postDiscord(fm, url) {
  if (!ENV.DISCORD_WEBHOOK) return { ok: false, skipped: true, err: 'DISCORD_WEBHOOK_ARTICLES not configured' };

  return withRetry('Discord', async () => {
    const fields = [];
    if (fm.series)         fields.push({ name: 'Series',  value: fm.series.replace(/-/g, ' '),       inline: true });
    if (fm.episode_number) fields.push({ name: 'Episode', value: `#${fm.episode_number}`,             inline: true });
    if (fm.tag)            fields.push({ name: 'Topic',   value: fm.tag,                              inline: true });
    if (fm.date)           fields.push({ name: 'Date',    value: String(fm.date).slice(0, 10),        inline: true });

    const embed = {
      title:       `📰 ${fm.title}`,
      description: fm.description || '',
      url,
      color:       0xB45309,
      fields,
      footer:      { text: 'ishistory.pages.dev' },
      timestamp:   new Date().toISOString(),
    };

    const res = await fetch(ENV.DISCORD_WEBHOOK, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username: 'ishistory', embeds: [embed] }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    return { ok: true };
  });
}

// ─── Platform: Dev.to ─────────────────────────────────────────────────────────
async function postDevto(fm, teaser, url) {
  if (!ENV.DEVTO_API_KEY) return { ok: false, skipped: true, err: 'DEVTO_API_KEY not configured' };

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
  if (!ENV.HASHNODE_API_KEY)       return { ok: false, skipped: true, err: 'HASHNODE_API_KEY not configured' };
  if (!ENV.HASHNODE_PUBLICATION_ID) return { ok: false, skipped: true, err: 'HASHNODE_PUBLICATION_ID not configured' };

  return withRetry('Hashnode', async () => {
    const res = await fetch('https://gql.hashnode.com', {
      method:  'POST',
      headers: { Authorization: ENV.HASHNODE_API_KEY, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        query: `mutation PublishPost($input: PublishPostInput!) {
          publishPost(input: $input) { post { id url title } }
        }`,
        variables: {
          input: {
            title:           fm.title,
            contentMarkdown: teaser,
            publicationId:   ENV.HASHNODE_PUBLICATION_ID,
            canonicalUrl:    url,
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
  if (!ENV.NTFY_TOPIC) return { ok: false, skipped: true, err: 'NTFY_TOPIC not configured' };

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
  if (!ENV.INDEXNOW_KEY) return { ok: false, skipped: true, err: 'INDEXNOW_KEY not configured' };

  return withRetry('IndexNow', async () => {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ host: 'ishistory.pages.dev', key: ENV.INDEXNOW_KEY, urlList: [url] }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true };
  });
}

// ─── Report results → Worker pipeline_log ────────────────────────────────────
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
    else         log.success('Results logged to Worker pipeline_log');
  } catch (e) {
    log.warn(`Worker callback failed: ${e.message}`);
  }
}

// ─── Results table ────────────────────────────────────────────────────────────
function printSummary(results) {
  log.section('Pipeline Results');
  const pad = s => s.padEnd(12);
  for (const [platform, r] of Object.entries(results)) {
    if (r.skipped) {
      log.warn(`${pad(platform)} SKIPPED  ${r.err}`);
    } else if (r.ok) {
      const extra = r.url ? `  → ${r.url}` : '';
      log.success(`${pad(platform)} OK${extra}`);
    } else {
      log.error(`${pad(platform)} FAILED   ${r.err}`);
    }
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

  // Parse file
  const raw              = fs.readFileSync(absPath, 'utf8');
  const { data: fm, content: body } = matter(raw);
  const url              = canonicalUrl(relPath);
  const teaser           = buildTeaser(fm, body, url);

  log.section(`Processing: ${path.basename(relPath)}`);
  log.info(`Title:     ${fm.title}`);
  log.info(`Series:    ${fm.series || '(none)'}`);
  log.info(`URL:       ${url}`);
  log.info(`Commit:    ${ENV.GIT_SHA || '(local)'}`);
  log.info(`Full body: ${wordCount(body)} words`);
  log.info(`Teaser:    ${wordCount(teaser)} words`);

  // Validate frontmatter
  const issues = validateFrontmatter(fm, relPath);
  if (issues.length) {
    issues.forEach(i => log.warn(`Frontmatter: ${i}`));
  }

  // Run all platforms in parallel — failures never block others
  log.section('Running platforms');
  const [discord, devto, hashnode, ntfy, indexnow] = await Promise.all([
    postDiscord(fm, url).catch(e => ({ ok: false, err: e.message })),
    postDevto(fm, teaser, url).catch(e => ({ ok: false, err: e.message })),
    postHashnode(fm, teaser, url).catch(e => ({ ok: false, err: e.message })),
    sendNtfy(fm, url).catch(e => ({ ok: false, err: e.message })),
    pingIndexNow(url).catch(e => ({ ok: false, err: e.message })),
  ]);

  const results = { discord, devto, hashnode, ntfy, indexnow };

  printSummary(results);
  await reportToWorker(relPath, results);

  // Write GitHub Actions job summary
  const summary = [
    `## Pipeline: ${fm.title}`,
    '',
    `**URL:** ${url}`,
    `**Commit:** \`${ENV.GIT_SHA}\``,
    '',
    '| Platform | Status | Detail |',
    '|---|---|---|',
    ...Object.entries(results).map(([p, r]) => {
      const status = r.skipped ? '⏭ Skipped' : r.ok ? '✅ OK' : '❌ Failed';
      const detail = r.url ? `[View](${r.url})` : (r.err || '');
      return `| ${p} | ${status} | ${detail} |`;
    }),
  ].join('\n');

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '\n' + summary + '\n');
  }

  // Exit 1 only if all non-skipped platforms failed
  const nonSkipped = Object.values(results).filter(r => !r.skipped);
  const allFailed  = nonSkipped.length > 0 && nonSkipped.every(r => !r.ok);
  if (allFailed) {
    log.error('All platforms failed.');
    process.exit(1);
  }
}

main();
