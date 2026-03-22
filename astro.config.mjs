import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { siteUrl } from './src/data/config.js';

export default defineConfig({
  site: siteUrl,
  integrations: [mdx()],
  markdown: {
    shikiConfig: { theme: 'css-variables' }
  }
});