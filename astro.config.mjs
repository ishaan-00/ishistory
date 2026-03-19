import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://ishistory.pages.dev',
  integrations: [mdx()],
  markdown: {
    shikiConfig: { theme: 'css-variables' }
  }
});