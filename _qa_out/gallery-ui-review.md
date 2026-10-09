# ImgHub Gallery UI verification

- Final command: npm run build — passed; Astro check: 0 errors, 0 warnings, 49 informational hints; 64 generated pages.
- All 48 zh/en/ja content routes have the shared site shell, an H1 and a canonical URL.
- Desktop: all 12 tool routes checked. Narrow 360px viewport: homepage, all 12 tool routes, About, Privacy, Terms, English compression and Japanese slicer checked; no horizontal page overflow.
- Production browser console: no errors during checked navigation, theme switching and language switching.
- Homepage category filtering: 3 edit tools; OCR search: 1 result; unmatched query: resettable empty state.
- Mobile navigation opens/closes with Escape. Theme choice persists across navigation; new visitors start with ivory surfaces.
- Subtitle editor: bilingual text entry, styles panel and PNG download verified; downloaded PNG is 800 × 584.
- Compression: real image upload and ZIP download verified; output is JPEG and final ZIP uses .jpg extensions. Signed size change displays correctly, including when JPEG is larger than an already optimized WebP.
- Slicer: real image upload, 2 × 2 preset and ZIP download verified; four 450 × 300 PNG tiles extracted.
- Artwork: optimized WebP files; fonts: local WOFF2 subsets with bundled OFL licenses.
- Existing server-dependent screenshot/Bilibili endpoints and OCR model recognition were not exercised; this verification covers their page rendering only.

Screenshots are saved in output/design-previews/: homepage-desktop.jpg, homepage-gallery.jpg, homepage-mobile.jpg and workspace-desktop.jpg. The app preview uses http://127.0.0.1:4321/zh/.
