---
title: "Claude Pipeline Test"
series: "ai-history"
episode_number: 99
date: 2026-03-21
description: "A test post staged directly by Claude to verify the full publish pipeline — GitHub commit, Discord notification, Dev.to crosspost, Hashnode crosspost, Bing IndexNow, and Ntfy push."
tag: "Pipeline Test"
---

# Claude Pipeline Test

This post was staged by Claude on **2026-03-21** to verify the complete ishistory publish pipeline end-to-end.

## What this test verifies

- **GitHub** — file committed to `ishaan-00/ishistory` via atomic commit
- **Discord** — rich embed card posted to articles webhook
- **Dev.to** — article cross-posted with canonical URL
- **Hashnode** — article published to publication
- **Bing IndexNow** — URL submitted for instant indexing
- **Ntfy** — push notification sent to topic

## Pipeline flow

1. File staged into D1 drafts table
2. Cron picks it up (runs every minute)
3. Reads content, extracts frontmatter
4. Commits to GitHub via atomic commit
5. Fires all social platforms in parallel
6. Logs activity to D1

If you are reading this on any platform — the pipeline works!

*Staged by Claude · ishistory.pages.dev*