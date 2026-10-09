import { GIFEncoder, quantize, applyPalette } from "gifenc";
let encoder,
  palette,
  width,
  height,
  count = 0;
self.onmessage = ({ data }) => {
  try {
    if (data.type === "init") {
      encoder = GIFEncoder();
      width = data.width;
      height = data.height;
      count = 0;
    } else if (data.type === "frame") {
      const rgba = new Uint8Array(data.buffer);
      if (!palette || count % 12 === 0) palette = quantize(rgba, 256);
      encoder.writeFrame(applyPalette(rgba, palette), width, height, {
        palette,
        delay: data.delay,
        repeat: 0,
        dispose: 1,
      });
      count++;
    } else if (data.type === "finish") {
      encoder.finish();
      const bytes = encoder.bytes().slice();
      self.postMessage({ type: "done", buffer: bytes.buffer, frames: count }, [
        bytes.buffer,
      ]);
      self.close();
    }
  } catch (error) {
    self.postMessage({ type: "error", message: error.message });
    self.close();
  }
};
