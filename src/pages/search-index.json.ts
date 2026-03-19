import type { APIRoute } from 'astro';
import { series as allSeries } from '../data/series.js';
export const GET: APIRoute = async () => {
  const mods = import.meta.glob('../content/**/*.md', { eager: true });
  const items = Object.values(mods).filter((p:any) => p.frontmatter?.series && !p.frontmatter?.draft).map((p:any) => {
    const fm=p.frontmatter; const slug=p.file.split("/").pop()?.replace(".md","")??""
    const s=allSeries[fm.series]; const raw=typeof p.rawContent==="function"?p.rawContent():"";
    const words=raw.trim().split(/\s+/).length;
    return { title:fm.title??"", description:fm.description??"", series:fm.series??"", seriesLabel:s?.label??fm.series, url:`/${fm.series}/${slug}/`, body:raw.replace(/#{1,6}\s/g," ").replace(/\*\*/g,"").replace(/\*/g,"").replace(/\n+/g," ").slice(0,2000), readTime:Math.max(1,Math.round(words/230)), date:fm.date?String(fm.date):null };
  });
  return new Response(JSON.stringify(items), { headers: { "Content-Type": "application/json" } });
};