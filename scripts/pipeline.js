/**
 * ishistory publish pipeline
 *
 * Triggered by GitHub Actions on push of new src/content/**\/*.md files.
 * Reads the committed post, generates a teaser, then distributes to:
 *   - Discord  (rich embed — full summary)
 *   - Dev.to   (teaser post + canonical URL)
 *   - Hashnode (teaser post + canonical URL)
 *   - Ntfy     (push notification)
 *   - Bing IndexNow (URL submission for fast indexing)
 *
 * Results are POSTed back to the Worker → logged in pipeline_log.
 *
 * Usage: node pipeline.js <path-to-md-file>
 * e.g.:  node pipeline.js src/content/ai-history/episode-26.md
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// ─── Config ──────────────────────────────────────────────────────────────────
const SITE_URL     = 'https://ishistory.pages.dev';
const COMMIT_SHA   = (process.env.GITHUB_SHA || '').slice(0, 7);
const REPO         = process.env.GITHUB_REPOSITORY || 'ishaan-00/ishistory';

const ENV = {
  DEVTO_API_KEY:            process.env.DEVTO_API_KEY,
  HASHNODE_API_KEY:         process.env.HASHNODE_API_KEY,
  HASHNODE_PUBLICATION_ID:  process.env.HASHNODE_PUBLICATION_ID,
  DISCORD_WEBHOOK:          process.env.DISCORD_WEBHOOK_ARTICLES,
  NTFY_TOPIC:               process.env.NTFY_TOPIC,
  INDEXNOW_KEY:             process.env.INDEXNOW_KEY,
  WORKER_URL:               process.env.WORKER_URL,
  CMS_API_KEY:              process.env.CMS_API_KEY,
};

// ─── Teaser builder ───────────────────────────────────────────────────────────
// Prefers the `teaser` frontmatter field (custom written, 1000-1500 words).
// Falls back to auto-generating from description + intro + first section.

function buildTeaser(frontmatter, body, canonicalUrl) {
  const { title, description, teaser: customTeaser } = frontmatter;

  // Custom teaser takes priority — writer's own words
  if (customTeaser && customTeaser.trim().length > 100) {
    return formatTeaserWithCTA(customTeaser.trim(), title, canonicalUrl, countWords(body));
  }

  // Auto-generate: description + intro paragraph + first H2 section's first para
  const sections  = body.split(/^(?=## )/m);
  const introBody = sections[0].replace(/^# .+\n+/, '').trim();
  const introPara = introBody.split(/\n\n+/)[0].trim();

  let auto = '';

  if (description) auto += `${description}\n\n`;
  if (introPara && introPara !== description) auto += `${introPara}\n\n`;

  // Pull first paragraph from each H2 section until ~800 words
  for (let i = 1; i < sections.length; i++) {
    const lines      = sections[i].split('\n');
    const heading    = lines[0].trim();
    const sectionBody = lines.slice(1).join('\n').trim();
    const firstPara  = sectionBody.split(/\n\n+/)[0].trim();
    if (!firstPara) continue;
    auto += `## ${heading}\n\n${firstPara}\n\n`;
    if (countWords(auto) > 800) break;
  }

  return formatTeaserWithCTA(auto.trim(), title, canonicalUrl, countWords(body));
}

function formatTeaserWithCTA(content, title, canonicalUrl, fullWordCount) {
  const approxWords = Math.round(fullWordCount / 100) * 100;
  return `${content}

---

*This is an excerpt. The full article (~${approxWords.toLocaleString()} words) is published on ishistory.pages.dev.*

**[Continue reading: ${title}](${canonicalUrl})**`;
}

function countWords(text) {
  return (text || '').split(/\s+/).filter(Boolean).length;
}

// ─── Canonical URL builder ────────────────────────────────────────────────────
function buildCanonicalUrl(filePath) {
  const parts  = filePath.replace(/\\/g, '/').split('/');
  const series = parts[parts.length - 2] || '';
  const slug   = path.basename(filePath, '.md');
  return `${SITE_URL}/${series ? series + '/' : ''}${slug}`;
}

// ─── Tag sanitizers ───────────────────────────────────────────────────────────
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
    .map(t => ({
      name: t,
      slug: t.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    }));
}

// ─── Platform callers ─────────────────────────────────────────────────────────
async function postToDiscord(frontmatter, canonicalUrl) {
  if (!ENV.DISCORD_WEBHOOK) return { ok: false, err: 'DISCORD_WEBHOOK_ARTICLES not set' };

  const { title, description, series, episode_number, tag } = frontmatter;
  const seriesLabel = series ? series.replace(/-/g, ' ') : '';
  const epLabel     = episode_number ? `Episode ${episode_number}` : (tag || '');

  const embed = {
    title:       `📰 ${title}`,
    description: description || '',
    url:         canonicalUrl,
    color:       0xB45309,
    footer:      { text: 'ishistory.pages.dev' },
    timestamp:   new Date().toISOString(),
    fields:      [],
  };

  if (seriesLabel) embed.fields.push({ name: 'Series', value: seriesLabel, inline: true });
  if (epLabel)     embed.fields.push({ name: 'Type', value: epLabel, inline: true });

  const res = await fetch(ENV.DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ishistory', embeds: [embed] }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, err: `HTTP ${res.status}: ${text}` };
  }
  return { ok: true };
}

async function postToDevto(frontmatter, teaser, canonicalUrl) {
  if (!ENV.DEVTO_API_KEY) return { ok: false, err: 'DEVTO_API_KEY not set' };

  const { title, description, series } = frontmatter;

  const body = {
    article: {
      title,
      body_markdown:  teaser,
      published:      true,
      canonical_url:  canonicalUrl,
      description:    description || '',
      tags:           devtoTags(series),
    },
  };

  const res = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: { 'api-key': ENV.DEVTO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    return { ok: false, err: data.error || `HTTP ${res.status}` };
  }
  return { ok: true, url: data.url, id: data.id };
}

async function postToHashnode(frontmatter, teaser, canonicalUrl) {
  if (!ENV.HASHNODE_API_KEY)        return { ok: false, err: 'HASHNODE_API_KEY not set' };
  if (!ENV.HASHNODE_PUBLICATION_ID) return { ok: false, err: 'HASHNODE_PUBLICATION_ID not set' };

  const { title, series } = frontmatter;

  const query = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post { id url title }
      }
    }
  `;

  const variables = {
    input: {
      title,
      contentMarkdown:  teaser,
      publicationId:    ENV.HASHNODE_PUBLICATION_ID,
      canonicalUrl,
      tags:             hashnodeTags(series),
    },
  };

  const res = await fetch('https://gql.hashnode.com', {
    method: 'POST',
    headers: { Authorization: ENV.HASHNODE_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  const data = await res.json().catch(() => ({}));
  const post = data.data?.publishPost?.post;

  if (!post) {
    const errs = (data.errors || []).map(e => e.message).join('; ');
    return { ok: false, err: errs || `HTTP ${res.status}` };
  }
  return { ok: true, url: post.url, id: post.id };
}

async function sendNtfy(frontmatter, canonicalUrl) {
  if (!ENV.NTFY_TOPIC) return { ok: false, err: 'NTFY_TOPIC not set' };

  const res = await fetch(`https://ntfy.sh/${ENV.NTFY_TOPIC}`, {
    method: 'POST',
    headers: {
      Title:            `Published: ${frontmatter.title}`,
      Click:            canonicalUrl,
      Tags:             'newspaper',
      Priority:         'default',
      'Content-Type':   'text/plain',
    },
    body: frontmatter.description || 'New article published on ishistory.pages.dev',
  });

  if (!res.ok) return { ok: false, err: `HTTP ${res.status}` };
  return { ok: true };
}

async function pingIndexNow(canonicalUrl) {
  if (!ENV.INDEXNOW_KEY) return { ok: false, err: 'INDEXNOW_KEY not set' };

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host:    'ishistory.pages.dev',
      key:     ENV.INDEXNOW_KEY,
      urlList: [canonicalUrl],
    }),
  });

  if (!res.ok) return { ok: false, err: `HTTP ${res.status}` };
  return { ok: true };
}

// ─── Report results back to Worker ───────────────────────────────────────────
async function reportToWorker(filePath, results) {
  if (!ENV.WORKER_URL || !ENV.CMS_API_KEY) {
    console.warn('[pipeline] WORKER_URL or CMS_API_KEY not set — skipping result report');
    return;
  }

  const payload = {
    path:       filePath,
    repo:       REPO,
    commit_sha: COMMIT_SHA,
    discord:    results.discord.ok ? 1 : 0,
    devto:      results.devto.ok   ? 1 : 0,
    hashnode:   results.hashnode.ok ? 1 : 0,
    ntfy:       results.ntfy.ok    ? 1 : 0,
    indexnow:   results.indexnow.ok ? 1 : 0,
    discord_err:  results.discord.err  || null,
    devto_err:    results.devto.err    || null,
    hashnode_err: results.hashnode.err || null,
    ntfy_err:     results.ntfy.err     || null,
    indexnow_err: results.indexnow.err || null,
  };

  try {
    const res = await fetch(`${ENV.WORKER_URL}/webhook/pipeline-result`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${ENV.CMS_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.warn(`[pipeline] Worker callback failed: HTTP ${res.status}`);
    else console.log('[pipeline] Results reported to Worker ✓');
  } catch (e) {
    console.warn('[pipeline] Worker callback error:', e.message);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const filePath = process.argv[2];
  if (!filePath) { console.error('Usage: node pipeline.js <path>'); process.exit(1); }

  // Resolve to repo root (script runs from .github/scripts/, file path is repo-relative)
  const repoRoot   = path.resolve(process.cwd(), '../..');
  const absPath    = path.resolve(repoRoot, filePath);

  if (!fs.existsSync(absPath)) {
    console.error(`[pipeline] File not found: ${absPath}`);
    process.exit(1);
  }

  const raw         = fs.readFileSync(absPath, 'utf8');
  const { data: fm, content: body } = matter(raw);
  const canonicalUrl = buildCanonicalUrl(filePath);
  const teaser       = buildTeaser(fm, body, canonicalUrl);

  console.log(`\n[pipeline] Processing: ${filePath}`);
  console.log(`[pipeline] Title:       ${fm.title}`);
  console.log(`[pipeline] Series:      ${fm.series}`);
  console.log(`[pipeline] Canonical:   ${canonicalUrl}`);
  console.log(`[pipeline] Teaser:      ${countWords(teaser)} words`);
  console.log(`[pipeline] Full body:   ${countWords(body)} words\n`);

  // Run all platforms in parallel, never throw
  const [discord, devto, hashnode, ntfy, indexnow] = await Promise.all([
    postToDiscord(fm, canonicalUrl).catch(e => ({ ok: false, err: e.message })),
    postToDevto(fm, teaser, canonicalUrl).catch(e => ({ ok: false, err: e.message })),
    postToHashnode(fm, teaser, canonicalUrl).catch(e => ({ ok: false, err: e.message })),
    sendNtfy(fm, canonicalUrl).catch(e => ({ ok: false, err: e.message })),
    pingIndexNow(canonicalUrl).catch(e => ({ ok: false, err: e.message })),
  ]);

  const results = { discord, devto, hashnode, ntfy, indexnow };

  // Print summary
  console.log('[pipeline] Results:');
  for (const [platform, result] of Object.entries(results)) {
    const status = result.ok ? '✓' : '✗';
    const detail = result.ok
      ? (result.url ? ` → ${result.url}` : '')
      : ` — ${result.err}`;
    console.log(`  ${status} ${platform}${detail}`);
  }

  // Report back to Worker so pipeline_log gets populated
  await reportToWorker(filePath, results);

  // Exit with error if ALL platforms failed (partial failure is acceptable)
  const anySuccess = Object.values(results).some(r => r.ok);
  if (!anySuccess) {
    console.error('[pipeline] All platforms failed.');
    process.exit(1);
  }
}

main();
