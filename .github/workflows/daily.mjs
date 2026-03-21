/**
 * ishistory — Daily Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs at 09:00 UTC every day via daily.yml.
 * 1. Posts "Today in History" to Discord
 * 2. Reads src/data/scheduled.json, publishes any posts due today,
 * removes them from the file, commits back.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ENV = {
  DISCORD_TODAY:    process.env.DISCORD_WEBHOOK_TODAY    || '',
  DISCORD_ARTICLES: process.env.DISCORD_WEBHOOK_ARTICLES || '',
  NTFY_TOPIC:       process.env.NTFY_TOPIC               || '',
  GITHUB_TOKEN:     process.env.GITHUB_TOKEN             || '',
  GIT_REPO:         process.env.GIT_REPO                 || 'ishaan-00/ishistory',
};

const log = {
  info:    (...a) => console.log('  ℹ', ...a),
  ok:      (...a) => console.log('  ✓', ...a),
  warn:    (...a) => console.warn('  ⚠', ...a),
  fail:    (...a) => console.error('  ✗', ...a),
  section: (t)   => console.log(`\n${'─'.repeat(52)}\n  ${t}\n${'─'.repeat(52)}`),
};

// ─── GitHub API helper ────────────────────────────────────────────────────────
async function ghApi(endpoint, method = 'GET', body = null) {
  const token = ENV.GITHUB_TOKEN;
  const res = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Authorization:  `Bearer ${token}`,
      Accept:         'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (res.status === 204) return null;
  return res.json();
}

// ─── Read file from repo ──────────────────────────────────────────────────────
async function readRepoFile(filePath) {
  const data = await ghApi(`/repos/${ENV.GIT_REPO}/contents/${filePath}`);
  if (!data || data.message) return null;
  const content = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
  return { content, sha: data.sha };
}

// ─── Write file to repo ───────────────────────────────────────────────────────
async function writeRepoFile(filePath, content, message, existingSha = null) {
  const body = {
    message,
    content: Buffer.from(content).toString('base64'),
    ...(existingSha ? { sha: existingSha } : {}),
  };
  const result = await ghApi(`/repos/${ENV.GIT_REPO}/contents/${filePath}`, 'PUT', body);
  return result?.commit?.sha;
}

// ─── 1. Today in History ──────────────────────────────────────────────────────
async function postTodayInHistory() {
  log.section('Today in History');
  if (!ENV.DISCORD_TODAY) { log.warn('DISCORD_WEBHOOK_TODAY not set — skipping'); return; }

  const now   = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day   = String(now.getUTCDate()).padStart(2, '0');
  const date  = now.toISOString().slice(0, 10);

  try {
    const res  = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`);
    const data = await res.json();
    const events = (data.events || []).filter(e => e.text && e.year);
    if (!events.length) { log.warn('No events found for today'); return; }

    // Pick a historically significant event (prefer older ones)
    const sorted = [...events].sort((a, b) => a.year - b.year);
    const pick   = sorted[Math.floor(Math.random() * Math.min(5, sorted.length))];

    const embed = {
      title:       `📅 Today in History — ${date}`,
      description: `**${pick.year}** — ${pick.text}`,
      color:       0x92400E,
      footer:      { text: 'ishistory.pages.dev' },
      timestamp:   now.toISOString(),
    };

    // Add Wikipedia link if available
    if (pick.pages?.[0]?.content_urls?.desktop?.page) {
      embed.url = pick.pages[0].content_urls.desktop.page;
    }

    const postRes = await fetch(ENV.DISCORD_TODAY, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username: 'ishistory', embeds: [embed] }),
    });

    if (postRes.ok) log.ok(`Posted: ${pick.year} — ${pick.text.slice(0, 60)}...`);
    else log.fail(`Discord failed: HTTP ${postRes.status}`);
  } catch (e) {
    log.fail(`Today in History error: ${e.message}`);
  }
}

// ─── 2. Process scheduled posts ───────────────────────────────────────────────
async function processScheduledPosts() {
  log.section('Scheduled Posts');

  // Read scheduled.json from repo
  const file = await readRepoFile('src/data/scheduled.json').catch(() => null);
  if (!file) { log.info('No scheduled.json found — nothing to process'); return; }

  let scheduled;
  try {
    scheduled = JSON.parse(file.content);
  } catch (e) {
    log.fail(`scheduled.json parse error: ${e.message}`);
    return;
  }

  if (!Array.isArray(scheduled) || !scheduled.length) {
    log.info('No scheduled posts');
    return;
  }

  const now = new Date();
  const due = scheduled.filter(entry => new Date(entry.publish_at) <= now);

  if (!due.length) {
    log.info(`${scheduled.length} scheduled — none due yet`);
    return;
  }

  log.info(`${due.length} post(s) due today`);

  // Process each due post via workflow_dispatch on on-publish.yml
  const published = [];
  for (const entry of due) {
    log.info(`Publishing: ${entry.file}`);
    try {
      // Trigger the publish pipeline for this file
      const res = await ghApi(
        `/repos/${ENV.GIT_REPO}/actions/workflows/on-publish.yml/dispatches`,
        'POST',
        { ref: 'main', inputs: { file: entry.file } }
      );
      // null response = 204 No Content = success
      log.ok(`Triggered pipeline for: ${entry.file}`);
      published.push(entry.id);
    } catch (e) {
      log.fail(`Failed to trigger ${entry.file}: ${e.message}`);
    }
  }

  // Remove processed entries from scheduled.json and commit back
  if (published.length > 0) {
    const remaining = scheduled.filter(e => !published.includes(e.id));
    const newContent = JSON.stringify(remaining, null, 2);
    try {
      await writeRepoFile(
        'src/data/scheduled.json',
        newContent,
        `chore: remove ${published.length} published scheduled post(s) [skip ci]`,
        file.sha
      );
      log.ok(`Removed ${published.length} entry/entries from scheduled.json`);
    } catch (e) {
      log.fail(`Failed to update scheduled.json: ${e.message}`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${'═'.repeat(52)}`);
  console.log(`  ishistory Daily — ${new Date().toISOString()}`);
  console.log(`${'═'.repeat(52)}`);

  await postTodayInHistory();
  await processScheduledPosts();

  console.log(`\n${'═'.repeat(52)}`);
  console.log('  Daily tasks complete');
  console.log(`${'═'.repeat(52)}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
