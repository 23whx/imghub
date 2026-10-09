# Independent source and static-output audit

Audit date: 2026-10-03. Production origin confirmed by the user: `https://imghub.oumashu.top/`.

This is a **baseline**, inspected before the parent task's SEO changes and next build. Existing `dist` contains 68 HTML files and predates the new AI watermark tool. It is not evidence that those old files are currently deployed. No files outside this report were edited by this auditor.

## Findings and ownership

| Priority | Finding and evidence | Recommended action | Owner |
| --- | --- | --- | --- |
| High | `astro.config.mjs`, both layouts, and sitemap/robots source use the placeholder `imghub.com`. Old built canonical URLs and redirect targets therefore point off the confirmed production origin. | Use one production-origin constant/configuration; verify canonical, hreflang, JSON-LD, sitemap, robots and redirect destinations after rebuilding. | Parent technical SEO work |
| High | `Layout.astro` defaults social images to `/og-image.png`; that file is absent from `public` and old `dist`. `public/OG-IMAGE-README.md` is only a placeholder. | Provide a real 1200 × 630 share image, valid absolute production URL, descriptive alt, and explicit image dimensions. This improves sharing completeness; no direct ranking uplift is claimed. | Parent technical SEO work |
| High | `public: false` tools `screenshot` and `watermark-remover` are excluded from the sitemap/home but included in both `getStaticPaths` sets. They produce six localized content pages and two legacy redirect entrances. Current content layouts emit no `noindex`. | Preserve any required compatibility/access but put hidden localized tools under `noindex,follow`; omit public-tool guides/recommendations/schema claims. Do not robots-disallow those pages, because Google must crawl them to see `noindex`. | Parent route/meta work |
| High | `AIWatermarkRemover.jsx` example loader and `ArtworkPreview.jsx` new card reference `/assets/ai-watermark/example.webp`; that asset is absent from `public` during this inspection. | Coordinate with the existing AI tool editor before changing its files. Ensure the example asset exists before publishing, or remove/change the preview reference. | Existing AI tool work; parent coordinate |
| Medium | Root `src/pages/index.astro` uses `Astro.redirect('/en/', 302)`. Static output is a **2-second meta refresh**, not an HTTP 302. Old monolingual redirects point to destinations without trailing slashes, whereas localized paths consistently include them. | For the permanent default-language selection, use a permanent redirect and zero-second static fallback; normalize destinations to trailing-slash URLs. Prefer real 301/308 rules where the deployment host supports them. Verify production HTTP behavior separately. | Parent deployment/redirect work |
| Medium | Hidden `Screenshot.jsx` advertises URL long screenshots and POSTs to `/api/screenshot`. Repository output is static without an adapter. `src/pages/api/screenshot.js` exposes only POST, so it is not a usable static API endpoint. | Keep this unfinished route out of indexed/public tool promotion. Fixing or removing its server capability is a distinct functional task; do not claim it works because a component is present. | Parent noindex; future functional work |
| Low | `Layout.astro` still emits `twitter:creator` as `@Rollkey`, despite contact links having changed to `@Rollkey8`. Manifest name is `ImgHub - Image Generator`, short name `SubShot`. | Synchronize author/share metadata and manifest identity to the user's current handle and image-tool brand. | Parent metadata work |
| Medium | Public tool pages initially provide a short H1/description and application UI but little static task guidance or links to related workflows. Home H1 is evocative rather than descriptive; relevant toolkit wording currently appears in the intro. | Add useful, accurate static instructions/limits and related-tool links. Keep each tool page focused on its own search task. If adjusting the home H1, preserve the existing visual system while making the tool-collection purpose clear. Avoid mass keyword-only landing pages. | Parent and tool-guide agent |

## Checks performed

- Read configuration, layouts, route generation, registry, hero/card rendering, local font declarations, worker loading and hidden screenshot source.
- Recursively inspected old `dist`: 68 HTML files, including 51 localized content pages and 17 redirect documents. Every localized content page has exactly one `<h1>`.
- Checked all root-relative built HTML `href` and `src` references against output files/directories: no missing references in that old build. This limited check does **not** cover URLs in meta tags, CSS, JavaScript, external hosts, or assets introduced after that build. The missing OG image was separately checked from the meta default.
- Confirmed home cards and tool links are present in server-rendered HTML. `[data-reveal]` content is visible without JavaScript; CSS does not start it at opacity zero. Home tool discovery is not contingent on menu hydration.
- Confirmed responsive hero assets: mobile 58,862 bytes; desktop 173,724 bytes. The hero uses `<picture>`, dimensions, `fetchpriority="high"`, and breakpoint-matched image preload. Most decorative card assets use dimensions and lazy loading.
- Confirmed the 29,541,096-byte MI-GAN model and ONNX runtime are loaded inside the AI worker's processing path, rather than fetched by the home preview. Their disk size is not a measured initial-page payload.
- Available package inspection found Puppeteer, but no installed Lighthouse, axe, or web-vitals package. No external browser was launched and no Core Web Vitals or Lighthouse score was measured. Production CDN/cache/TTFB and real-user INP remain unmeasured.

## Search task targeting opportunities

These are intent-based suggestions derived from implemented capabilities, **not measured keyword search volumes**:

| Public page | Main task | Useful specific tasks to answer accurately |
| --- | --- | --- |
| Image compression | 在线图片压缩 / image compressor | JPG/PNG/WebP compression, compress to a chosen KB target, retain dimensions, transparent PNG lossless mode versus automatic WebP/JPG conversion |
| Online drawing | 在线画图 / online drawing and photo editor | Layers, text/shapes, crop/color adjustment, supported export formats; clearly disclose lack of PSD support |
| Image OCR | 图片文字识别 / image to text | Copy text from images; language choices and first-use OCR resource loading; do not advertise PDF processing without implementation |
| Video thumbnails | B站封面下载、YouTube thumbnail downloader | Full links, BV/AV input and actual output WebP; disclose unsupported automatic b23 redirection rather than promise all links |
| AI watermark removal | Gemini 图片水印去除 / Gemini watermark remover | Gemini sparkle restoration versus selected-region local inpainting; model-loading and visible-mark limits; describe genuine output behavior |
| Watermark adding | 在线图片加水印 / add watermark to image | Repeated text watermark, placement and export; distinguish from removal intent |
| Subtitle screenshots | 字幕截图制作 / subtitle screenshot generator | Add styled text to an image; do not suggest automatic speech transcription or extracting real movie subtitles |

## Primary references

- [Google redirect guidance](https://developers.google.com/search/docs/crawling-indexing/301-redirects): permanent server redirects are preferable when supported; immediate versus delayed meta refresh have different canonicalization implications.
- [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing): pages must remain crawlable for the noindex rule to be seen.
- [Core Web Vitals](https://web.dev/articles/vitals): distinguish field measurements from laboratory observations and source-level performance inferences. This audit does not establish LCP/INP/CLS compliance.

The parent task should rebuild and validate the final artifact after edits, then verify the live origin once deployed. No ranking position can be guaranteed from these local changes.
