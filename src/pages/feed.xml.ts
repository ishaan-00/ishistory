import type { APIRoute } from 'astro';
import { series as allSeries } from '../data/series.js';

const siteUrl = 'https://ishistory.pages.dev';

function esc(str: string): string {
  return (str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const GET: APIRoute = async () => {
  const mods = import.meta.glob<{
    frontmatter: Record<string, any>;
    rawContent: () => string;
    file: string;
  }>('../content/**/*.md', { eager: true });

  const posts = Object.values(mods)
    .filter(p => p.frontmatter?.series && !p.frontmatter?.draft)
    .sort((a, b) => {
      const da = a.frontmatter.date ? new Date(a.frontmatter.date).getTime() : 0;
      const db = b.frontmatter.date ? new Date(b.frontmatter.date).getTime() : 0;
      return db - da;
    })
    .slice(0, 50);

  const items = posts.map(p => {
    const fm   = p.frontmatter;
    const slug = p.file.split('/').pop()?.replace('.md', '') ?? '';
    const url  = `${siteUrl}/${fm.series}/${slug}/`;
    const s    = (allSeries as Record<string, any>)[fm.series];
    return `
    <item>
      <title>${esc(fm.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(fm.description ?? '')}</description>
      <category>${esc(s?.label ?? fm.series)}</category>
      ${fm.date ? `<pubDate>${new Date(fm.date).toUTCString()}</pubDate>` : ''}
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ishistory</title>
    <link>${siteUrl}</link>
    <description>Long-form history of AI, robotics, and the internet.</description>
    <language>en</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};