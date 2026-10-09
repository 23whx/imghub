# Browser-only reconstruction verification

2026-10-03. Static Astro output, served on localhost in the Codex in-app browser.

- `node --test tests/ai-watermark.test.mjs tests/ai-watermark-latent.test.mjs`:
  11 tests pass, including seeded noise, color contracts, ImageData getter
  dimensions, aspect-ratio padding and alpha preservation.
- `npm run build`: Astro check reports 0 errors / 0 warnings and produces 72
  static pages. No backend/serverless route is introduced.
- Own gallery input: 900x600. Automatic mode reported **WebGPU (local GPU)**,
  working tensor 512x344 / image content 512x341, seed42/strength0.05:
  PSNR26.85dB, first execution0.9s (this environment only).
- CPU forced mode at256px: tensor256x176, PSNR23.77dB, 1.0s.
- Explicit WebGPU at512px, seed43/strength0.15: PSNR25.54dB, 0.2s warm run.
  This demonstrates parameter-dependent reconstruction, not removal efficacy.
- Explicit WebGPU with1024px limit on the900x600 input: tensor904x600,
  content900x600, PSNR29.45dB, 3.0s. Final desktop proof shows this run.
- Cancellation stops a1024px CPU job. Retrying automatic512px succeeds.
- Changed settings disable download until a fresh reconstruction completes.
- Real browser WebP download is900x600 (`reconstruction-gpu.webp`). The
  homepage preview is derived from this exact browser result.
- Transparent input256x192: CPU reconstruction/export remains256x192,
  PSNR32.63dB, 1.2s; all49152 alpha bytes match the source after WebP decoding.
- At360px viewport, document width345px (scrollbar), no horizontal overflow;
  settings fonts16px and controls44px high. Viewport reset after testing.
- Final-build legacy Gemini example still reports100% template matching and
  correctly restores the visible sparkle. A stale pre-build tab initially
  could not load an old worker URL; after reloading the final build it works.

Proof: `latent-desktop.webp`, `latent-mobile.webp`, `reconstruction-gpu.webp`,
`latent-alpha.webp`. The first preview crash exposed ImageData dimensions as
non-enumerable prototype properties; fixed by explicitly preserving width and
height, with a regression test.

No provider detector was called. No user image was transmitted. No SynthID
removal verdict, classifier score, or efficacy percentage is claimed. TAESD
reconstruction is not the full diffusion regeneration pipeline in wiltodelta.
