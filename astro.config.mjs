import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://imghub.com', // 请替换为您的实际域名
  integrations: [react(), tailwind()],
  server: {
    port: 3000,
    host: true
  }
});
