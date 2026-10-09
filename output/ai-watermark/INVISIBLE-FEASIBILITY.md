# GPT-image / Nano Banana invisible-watermark feasibility

Reviewed 2026-10-03 after the user clarified that invisible pixel watermarks,
not corner logos, are the primary requirement. The existing visible-mark tool
does not fulfill this clarified requirement.

## Mechanisms

OpenAI currently describes both C2PA metadata and an invisible SynthID layer
for supported images generated through ChatGPT, Codex and the OpenAI API:
https://openai.com/index/advancing-content-provenance/
https://developers.openai.com/api/docs/guides/content-provenance

Google describes SynthID as a pixel-embedded watermark designed to survive
cropping, filters and lossy compression:
https://deepmind.google/models/synthid/

Removing metadata or exporting WebP does not establish that this pixel signal
has been removed. A generic AI classifier's score is not a SynthID verdict.

## Referenced projects

### wiltodelta/remove-ai-watermarks

README `invisible` processing requires NVIDIA CUDA. The documented default
Qwen-Image-2512 Lightning + Canny ControlNet + SAM-masked Z-Image face stage,
as well as the alternate SDXL/Z-Image and Chroma/Z-Image profiles, are Python
diffusion regeneration pipelines, not browser-ready ONNX/WASM modules.

The README reports verifier-checked example files, explicitly limiting the
result to those files rather than all images, seeds or future watermark
versions. Its SynthID research document also reports that mild non-generative
spectral/phase attacks that lowered surrogate scores still tested positive
with matching-provider verifiers. It does not ship a production local SynthID
pixel detector.

https://github.com/wiltodelta/remove-ai-watermarks
https://github.com/wiltodelta/remove-ai-watermarks/blob/main/docs/synthid.md

### IamRamgarhia/free-ai-watermark-remover

Browser MI-GAN inpainting removes selected visible marks. Its public README
explicitly describes visible-watermark removal; it does not supply a validated
GPT-image/Nano Banana SynthID-removal algorithm.

https://github.com/IamRamgarhia/free-ai-watermark-remover

### tbxark-arc/remove-ai-watermarks

Browser edition strips metadata, reverses visible Gemini alpha blending, and
optionally applies a humanizer. The inspected humanizer adds Gaussian grain
and wraps red/blue channels by a few pixels. Its README describes reducing
passive AI-image classifiers, not verified removal of the proprietary SynthID
signal. This cannot be substituted for a validated invisible-watermark remover.

https://github.com/tbxark-arc/remove-ai-watermarks

## Accepted scope and prototype

The user chose a pure-frontend experimental route. Their GPU can be used through
WebGPU; CUDA is a limitation of the reference implementation, not a requirement
for every reconstruction algorithm. Porting the full Python diffusion pipeline
would require separate conversion, operator support and performance work.

The implemented prototype is TAESD encoder -> optional seeded latent Gaussian
perturbation -> decoder, using ONNX Runtime WebGPU or WASM CPU in a worker. It is
whole-image lossy autoencoder reconstruction, NOT full diffusion regeneration
and NOT a trained SynthID removal or detection model. Working resolution is
bounded at 256/512/768/1024px. Export returns to original dimensions and alpha;
it cannot recover detail lost at the working resolution. PSNR only measures
pixel differences. All image processing is local and no verifier uploads occur.

The UI explicitly reports invisible-watermark status as unverified. No claim
of GPT-image / Nano Banana invisible-watermark removal is supported until
independent provider-verifier checks are performed on documented input/output
pairs. Browser runtime validation proves reconstruction and device execution,
not removal efficacy.

Primary implementation references:
https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html
https://github.com/madebyollin/taesd
https://huggingface.co/docs/diffusers/api/models/autoencoder_tiny
