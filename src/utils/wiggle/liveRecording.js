/** Capture the same frames the user sees, including manual gestures. */
export function videoMime(format) {
  if (typeof MediaRecorder === "undefined") return null;
  const list =
    format === "mp4"
      ? ["video/mp4;codecs=avc1.42E01E", "video/mp4"]
      : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return list.find((type) => MediaRecorder.isTypeSupported(type)) || null;
}

export function startLiveRecording(
  source,
  {
    format = "gif",
    duration = 5,
    presentation = "original",
    initialData,
    onProgress = () => {},
    onEncoding = () => {},
  } = {},
) {
  const size = Math.min(
    format === "gif" ? 512 : 1080,
    Math.max(source.width, source.height),
  );
  const ratio = size / Math.max(source.width, source.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * ratio);
  canvas.height = Math.round(source.height * ratio);
  const ctx = canvas.getContext("2d", { willReadFrequently: format === "gif" });
  let worker,
    recorder,
    stream,
    timer,
    stopped = false,
    cancelled = false,
    frames = 0,
    lastFrame = -Infinity,
    start = performance.now();
  let resolve, reject;
  const done = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  let lastOffset = initialData?.frame || { x: 0, y: 0 };
  let lastAspect = initialData?.aspect || { sx: 1, sy: 1 };
  const cleanup = () => {
    clearTimeout(timer);
    stream?.getTracks().forEach((t) => t.stop());
    worker?.terminate();
  };
  const fail = (error) => {
    stopped = true;
    cleanup();
    reject(error);
  };
  const finish = (blob) => {
    cleanup();
    resolve({
      blob,
      filename: `imghub-wiggle.${format}`,
      format,
      width: canvas.width,
      height: canvas.height,
      frames,
      seconds: (performance.now() - start) / 1000,
    });
  };
  if (format === "gif") {
    worker = new Worker(new URL("./gifWorker.js", import.meta.url), {
      type: "module",
    });
    worker.onmessage = ({ data }) => {
      if (data.type === "done")
        finish(new Blob([data.buffer], { type: "image/gif" }));
      else if (data.type === "error") fail(new Error(data.message));
    };
    worker.onerror = (e) => fail(new Error(e.message || "GIF worker failed"));
    worker.postMessage({
      type: "init",
      width: canvas.width,
      height: canvas.height,
    });
  } else {
    const mimeType = videoMime(format);
    if (!mimeType || !canvas.captureStream)
      throw new Error("Unsupported video format");
    stream = canvas.captureStream(30);
    try {
      recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 6_000_000,
      });
    } catch (error) {
      cleanup();
      throw error;
    }
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onerror = (e) => fail(e.error || new Error("Recording failed"));
    recorder.onstop = () => {
      if (!cancelled)
        finish(new Blob(chunks, { type: mimeType.split(";")[0] }));
    };
    recorder.start(250);
  }
  function capture(
    now,
    frameOffset = lastOffset,
    meshAspect = lastAspect,
  ) {
    if (stopped) return;
    lastOffset = frameOffset;
    lastAspect = meshAspect;
    const delay = 1000 / (format === "gif" ? 16 : 30);
    if (now - lastFrame < delay - 1) return;
    const frameDelay = Number.isFinite(lastFrame)
      ? Math.max(10, Math.round(now - lastFrame))
      : Math.round(delay);
    lastFrame = now;
    frames++;
    ctx.fillStyle = "#faf2ed";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const zoom = presentation === "crop" ? 1.14 : 1;
    // Same mesh-to-pixel mapping as the renderer, with frame motion removed.
    const scale =
      Math.min(canvas.width / meshAspect.sx, canvas.height / meshAspect.sy) *
      0.925;
    const dx = presentation === "camera-follow" ? -frameOffset.x * scale : 0;
    const dy = presentation === "camera-follow" ? -frameOffset.y * scale : 0;
    ctx.drawImage(
      source,
      (canvas.width * (1 - zoom)) / 2 + dx,
      (canvas.height * (1 - zoom)) / 2 + dy,
      canvas.width * zoom,
      canvas.height * zoom,
    );
    if (worker) {
      const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      worker.postMessage(
        { type: "frame", buffer: rgba.buffer, delay: frameDelay },
        [rgba.buffer],
      );
    }
    onProgress(Math.min(1, (now - start) / (duration * 1000)));
  }
  function stop() {
    if (stopped) return;
    capture(performance.now());
    stopped = true;
    clearTimeout(timer);
    onEncoding();
    if (worker) worker.postMessage({ type: "finish" });
    else if (recorder.state !== "inactive") recorder.stop();
  }
  function cancel() {
    if (cancelled) return;
    cancelled = true;
    stopped = true;
    if (recorder?.state !== "inactive" && recorder) recorder.stop();
    cleanup();
    reject(new DOMException("Cancelled", "AbortError"));
  }
  capture(start);
  timer = setTimeout(stop, duration * 1000);
  return { done, capture, stop, cancel };
}
