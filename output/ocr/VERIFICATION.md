# OCR verification — 2026-10-03

Verified the static production build in the local in-app Chromium browser at
http://127.0.0.1:4321/zh/tools/image-ocr/. No deployment was performed.

- Official PP-OCRv5 mobile detection / joint recognition with PaddleOCR.js 0.4.2
  and its bundled ORT 1.24.3. Models, worker and WASM are same-origin static assets.
  Model hashes and official source URLs are in public/assets/ocr/manifest.json.
- Real 980×540 multilingual image: all six lines matched the fixture exactly,
  including Simplified Chinese, Traditional Chinese, Japanese and English.
  Automatic mode reported WebGPU for both stages: first cold run about 10.8s;
  final cached run about 1.7s. Forced CPU reported WASM for both stages, 1.2s.
  These are machine-specific timings, not performance guarantees.
- Real 600×3600 image with forty numbered 16px text lines: all forty rows found,
  in order and without duplicate rows, in 2.5s on GPU. One Chinese character was
  omitted and some whitespace differed. Actual/expected text retained alongside
  fixtures. Results remain editable; no claim of perfect recognition.
- Cancelled an active CPU job, then successfully used GPU again. Blank image
  returned zero lines with a clear notice. A 4001×3000 image was rejected above
  the 12MP limit while retaining the previous valid image.
- Pointer selection isolated the English line (886×67 source crop); only that
  line was recognized. JSON coordinates were translated to the current original
  image space and checked. Edited text was copied successfully and verified in
  both downloaded UTF-8 TXT and JSON. JSON retains original recognized line data.
- Line review shows raw confidence; selecting the Japanese line selects its
  corresponding box. Latest browser warning/error log was empty.
- At 360×800, document width was 345px (no horizontal page overflow), select and
  textarea fonts were 16px and select height was 44px. 100% view had 980px inner
  scroll width inside its 250px panel without page overflow. Viewport reset.
- `node --test tests/ocr.test.mjs tests/seo.test.mjs`: 12 passed. Covers bounds,
  tile coverage, overlap deduplication, reading order, text spacing, cancellation,
  failed transfer cleanup, multilingual metadata/guides and SEO.
- `npm run build`: 0 errors, 0 warnings, 76 static pages. Final CSS adjustment
  also passed `npx astro build` with 76 pages.

Proof: desktop.webp, mobile.webp, mixed-cpu.json, region-edited.json, edited.txt,
long-actual.txt, long-expected.txt. Build logs are in output/ocr-build*.log.

Coverage limits: the joint model supports the advertised CJK/English scripts,
not every language. Complex columns, tables, severe blur and handwriting still
need review. Approximate row order is not structured table reconstruction.
