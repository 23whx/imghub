# Local AI watermark assets

These assets are served by the same static site. User image pixels are never
posted to a server. The MI-GAN model and WASM runtime are loaded only when local
AI repair is requested, about 40.8 MB in total before HTTP compression.

## Model and runtime

- `migan.onnx`: MI-GAN, 29,541,096 bytes. Download source:
  https://huggingface.co/lxfater/inpaint-web/blob/main/migan.onnx
- SHA-256: `bb7189b2523b8485d9dd6baa2e7e8bccce4493760daa33ffcd432f667945bf62`
- Official model architecture and license:
  https://github.com/Picsart-AI-Research/MI-GAN
  (`MI-GAN-LICENSE.txt`, MIT).
- `ort/`: ONNX Runtime Web 1.20.1, copied from the pinned npm package.
  `ONNX-Runtime-LICENSE.txt` contains the Microsoft MIT license.
- Model preprocessing reference: WatermarkOut by Prince Ramgarhia (DiceCodes),
  https://github.com/IamRamgarhia/free-ai-watermark-remover
  (`WatermarkOut-LICENSE.txt`, MIT). Application UI and worker orchestration
  are implemented for ImgHub.

## Gemini templates

`gemini-48.webp` and `gemini-96.webp` are lossless WebP conversions of the
`gemini_bg_48.png` and `gemini_bg_96.png` reference templates in
https://github.com/tbxark-arc/remove-ai-watermarks
at commit `c05577e094f7f1676d83b7d8f495bcb60035ad0c`.
That project's README states the MIT license; the inspected checkout does not
include a separate LICENSE file. Attribution is retained here.

Reverse alpha blending and template matching are also described by
https://github.com/wiltodelta/remove-ai-watermarks (Apache-2.0).
No Python/GPU diffusion pipeline or invisible-watermark-removal routine from
that project is bundled into the website.

## Example

`example.webp` is an ImgHub gallery image with a synthetic standard sparkle
added for a reproducible demo. It is not presented as an actual Gemini output.
Regenerate with `node scripts/ai-watermark-example.mjs` from the project root.

## Preparing a static deployment

`npm run build` verifies the checked-in model checksum and copies the pinned
WASM runtime locally. It does not fetch models from third-party services.
To restore missing model data, run:

```
node scripts/prepare-ai-watermark.mjs --download-model
```

The tool also provides experimental whole-image reconstruction. It does not detect or guarantee removal of
SynthID or other invisible watermarks. Metadata-only export re-encodes the
image rather than copying its EXIF/XMP/C2PA fields. WebP encoding can introduce
small compression differences even in regions not modified by the repair.

## Experimental TAESD reconstruction

- Official source: https://github.com/madebyollin/taesd
- Revision: `027d3ef404a04a141e60d5ec0fee149c2c8bdd74`.
- MIT copyright and terms: `TAESD-LICENSE.txt`.
- `taesd-encoder.onnx`: 4,902,774 bytes, SHA-256
  `44b9af2636e23e396ee77130e604c93dafd8f6841a892521f5d5fe91ef2dbc56`.
- `taesd-decoder.onnx`: 4,904,109 bytes, SHA-256
  `bb212b73febb9783ab3925ecfb5cab8adc10810aa6ef3472f72cdbe063c306e9`.
- `taesd-manifest.json` records source, tensor contract and output hashes.
- The matching ORT 1.20.1 JSEP WASM is 21,663,894 bytes and its MJS is 46,839
  bytes. Total first-use reconstruction assets are about 31.5 MB, before HTTP
  compression. The ordinary WASM files remain for MI-GAN repair.

Convert source weights offline with `scripts/export-ai-watermark-vae.py` (CPU
PyTorch and ONNX). This is a maintenance script, not a website backend or a
regular build dependency. `scripts/prepare-ai-watermark.mjs` checks the local
model hashes and copies runtime files from the pinned npm package.

TAESD is a lightweight lossy image autoencoder, not a watermark-removal model.
The browser worker reconstructs at bounded resolution, optionally adds seeded
latent noise, and restores original dimensions and alpha. Automatic mode uses
WebGPU when available, otherwise WASM CPU. A software adapter is reported as
such; watermark detection is not inferred from device execution or PSNR.

`reconstruction-example.webp` is an actual browser WebGPU reconstruction of
ImgHub's own `studio/subtitle.webp`: working tensor 512 x 344 (content 512 x 341),
latent noise strength 0.05, seed 42, exported 900 x 600, gallery-encoded WebP 90.
The demo input has NOT been independently verified for an invisible watermark.
The comparison shows lossy reconstruction, not proven watermark removal.
