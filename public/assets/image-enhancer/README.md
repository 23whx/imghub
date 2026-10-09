# Local image enhancement assets

Official source: https://github.com/xinntao/Real-ESRGAN
Code revision: a4abfb2979a7bbff3f69f58f58ae324608821e27
Weights: official release v0.2.5.0, realesr-general-x4v3 and
realesr-general-wdn-x4v3. The export blends weights50/50, matching the official
inference default denoise_strength0.5. This is a compact32-convolution SRVGGNet.
BSD-3-Clause copyright and license are retained in Real-ESRGAN-LICENSE.txt.

realesrgan-general-x4.onnx: 4,866,420 bytes
SHA-256: ec68fd4c6bd3031badf58ef565011e14da084a27f5f86c36ca611f7702a74aa6
manifest.json retains both source weight checksums, URLs and conversion settings.

scripts/export-image-enhancer.py is an offline maintenance conversion using
PyTorch and ONNX. Website operation and builds require no Python or CUDA.
scripts/prepare-image-enhancer.mjs verifies local assets in the regular build.
The ONNX graph uses RGB CHW[0,1] and produces a4x RGB result. Browser workers use
128px cores plus36px context (model receptive radius34px), retain only cores,
and reduce the4x output for1x/2x. Strength mixes the result with a bilinear
baseline. Transparent input is white-matted for inference, then unmatted using
resized original alpha. Alpha at1x is retained exactly; higher scales interpolate.

ORT1.20.1 JSEP WASM/MJS runtime is shared with /assets/ai-watermark/ort/, with its
MIT license retained there. First enhancement loads about26.6 MB before HTTP
compression. All processing uses WebGPU or single-thread WASM CPU in a worker.
Images are never transmitted to processing services. No API key or backend.

example-low.webp is an intentionally reduced192x128, JPEG-quality48 version of
ImgHub’s own studio/subtitle.webp, converted to lossless WebP. Recreate with
node scripts/image-enhancer-example.mjs. The enhanced gallery case is generated
by the actual browser model, not copied from the high-resolution source image.


example-enhanced.webp is the actual local WebGPU output of example-low.webp:
scale4, strength0.8, exported768x512, then gallery-encoded WebP92. It does not
reuse the uncompressed high-resolution reference as the claimed model result.
The baseline comparison is upscaled low-res input; no efficacy percentage is
invented. The browser export is retained in output/image-enhancer/gpu-4x.webp.
