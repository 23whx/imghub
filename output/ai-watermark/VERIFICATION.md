# AI watermark remover verification

## Deployment

- Astro static build: 72 generated pages; no server functions added.
- Astro check: 0 errors, 0 warnings; existing unused/deprecation hints remain.
- ONNX Runtime 1.20.1 uses ES-module worker output, same-origin WASM assets and
  `numThreads = 1`. No global cross-origin isolation headers are required.
- Browser model download is same origin; images are never uploaded.
- Model SHA-256 checked during build and during runtime loading.

## Algorithms

`node --test tests/ai-watermark.test.mjs`: six passing tests for template sizing,
shifted detection, clean/tiny images, reverse blending, actual gallery demo,
MI-GAN keep-mask/channel normalization and region-only compositing.

The reference project's `demo_banana_before.png` (2048 × 2048) also matched the
96px template at (1888,1888), score 0.7472. It was inspected as a local test
fixture and is not shipped with the tool.

## Actual browser runs

Verified against the built static output at `http://127.0.0.1:4321/`:

- Standard sparkle demo → Gemini template detected and restored.
- Local MI-GAN inference → selected region repaired, no console errors/warnings.
- Actual downloads → Gemini and MI-GAN WebP files, both 900 × 600.
- Cancellation → worker terminated, original/current pixels and 2304px mask
  retained; controls enabled for retry.
- Brush → 1228 marked pixels; eraser → 655 pixels; clear → 0; undo → prior mask.
- Numeric 200px width at X=820 rejected for a 900px image; corrected 48px selection
  accepted (2304 pixels).
- Clean 256 × 192 PNG → no Gemini template match, image left unchanged.
- Metadata fixture → downloaded WebP retained 256 × 192 dimensions and alpha;
  original EXIF absent, no XMP present. A browser-generated sRGB ICC may remain.
- 360px viewport → no horizontal page overflow, numeric fields 16px.
- Chinese, English, Japanese routes and language switching work.
- Homepage registry has 12 tools, search finds the new card and its actual
  synthetic watermark example. Before/after images remain aligned on hover.

Screenshots: `tool-desktop.webp`, `tool-mobile.webp`.
Actual exports: `gemini-result.webp`, `inpaint-result.webp`, `metadata-result.webp`.
Crop comparison: `repair-comparison.webp` (input / reverse blend / MI-GAN).

## Limits

Matching standard visible Gemini sparkles and local inpainting do not detect or
guarantee removal of SynthID. Cropped/scaled/custom marks may require manual
selection. Fully opaque marks and compression destroy original information;
AI repair can produce artifacts. The repair preserves unselected pixels in
memory; WebP re-encoding can introduce small changes across the exported image.
