import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { siteConfig } from './src/config/site.js';

export default defineConfig({
  site: siteConfig.url,
  trailingSlash: 'always',
  integrations: [react(), tailwind()],
  server: {
    port: 3000,
    host: true
  },
  // Old monolingual URLs → English (static-host friendly)
  redirects: {
    '/about': '/en/about/',
    '/privacy': '/en/privacy/',
    '/terms': '/en/terms/',
    // The manual watermark remover was retired in favor of the AI remover.
    '/tools/watermark-remover': '/en/tools/ai-watermark-remover/',
    '/zh/tools/watermark-remover': '/zh/tools/ai-watermark-remover/',
    '/en/tools/watermark-remover': '/en/tools/ai-watermark-remover/',
    '/ja/tools/watermark-remover': '/ja/tools/ai-watermark-remover/',
  },
  vite: {
    // The image-repair worker loads ONNX Runtime on demand as an ES module.
    worker: { format: 'es' },
    resolve: {
      // gifenc package.json "browser" points at CJS, which throws "require is not defined" in the browser.
      alias: {
        gifenc: 'gifenc/dist/gifenc.esm.js',
      },
    },
    optimizeDeps: {
      exclude: ['tesseract.js'],
      include: ['gifenc', 'jszip'],
    },
  },
});
