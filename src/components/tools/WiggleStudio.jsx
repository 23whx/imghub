import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Undo2,
  Redo2,
  Paintbrush,
  Eraser,
  Hand,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Play,
  Square,
  X,
  Smartphone,
} from "lucide-react";
import {
  WiggleSimulator,
  getPreset,
  PRESET_ORDER,
} from "../../utils/wiggle/physics.js";
import { automaticAcceleration } from "../../utils/wiggle/autoMotion.js";
import { WiggleRenderer } from "../../utils/wiggle/renderer.js";
import { stamp, puddingMask, coverage } from "../../utils/wiggle/mask.js";
import {
  startLiveRecording,
  videoMime,
} from "../../utils/wiggle/liveRecording.js";
import { i18n, PRESET_META } from "../../i18n/wiggle.js";
import { syncLanguageFromLocale } from "../../stores/globalStore";
import "./WiggleStudio.css";

const EXTRA = {
  zh: {
    demo: "焦糖布丁 · 即刻试摇",
    ready: "拖动布丁，松开看看它的弹性。",
    loading: "正在准备布丁…",
    change: "替换图片",
    examples: "让一张图片，活起来。",
    exampleHelp: "同一块布丁，三种动法。点击案例即可继续调整。",
    soft: "柔软摇摆",
    bounce: "弹性跳跃",
    float: "轻盈漂浮",
    applied: "案例已载入，试试拖动图片。",
    zoom: "缩放",
    resetView: "重置视图",
    pan: "移动画布",
    pause: "暂停",
    resume: "继续",
    coverage: "晃动区域",
    inputStrength: "推动力度",
    bounceParam: "回弹",
    maxStretch: "形变上限",
    sensor: "手机体感",
    sensorOff: "关闭体感",
    sensorHelp: "在支持的手机与安全连接中，允许体感后摇动手机。",
    sensorUnavailable: "当前设备无法使用体感，请拖动图片。",
    sensorDenied: "未获体感权限，你仍可手动拖动。",
    sensorOn: "体感已开启",
    live: "正在录制 · 可继续拖动图片",
    saveStop: "停止并保存",
    exportHint: "记录你现在看到的动画。GIF 无限循环，视频保留录制过程。",
    unsupported: "此浏览器不支持",
    replaceTitle: "替换当前图片？",
    replaceHelp: "当前涂抹区域和参数会重置。已导出的文件仍可保存。",
    replace: "替换",
    fileError: "请选择不超过 80 MB 的静态 PNG、JPEG 或 WebP 图片。",
    imageError: "图片读取失败，请尝试另一张图片。",
    empty: "请先涂抹晃动区域，或选择「全涂」。",
    keys: "B 涂抹 · E 橡皮 · H 移动 · Ctrl/⌘ Z 撤销",
    hint: "滚轮 / 双指缩放 · 移动模式拖拽",
    recordIdle: "选择格式，录制当前动作",
    quality: "导出尺寸",
    recording: "录制中",
    reduced: "已按减少动态效果偏好暂停，可点击继续。",
    resultInfo: "像素",
    local: "本地处理 · 无需上传",
    sampleName: "焦糖布丁",
    failed: "录制失败，请缩短时长或使用 GIF 重试。",
  },
  en: {
    demo: "Caramel pudding · Try it now",
    ready: "Drag the pudding and release to feel its spring.",
    loading: "Preparing the pudding…",
    change: "Replace image",
    examples: "Give a still image a little life.",
    exampleHelp:
      "One pudding, three motions. Choose an example to keep editing.",
    soft: "Soft sway",
    bounce: "Spring bounce",
    float: "Light float",
    applied: "Example loaded. Try dragging the image.",
    zoom: "Zoom",
    resetView: "Reset view",
    pan: "Pan canvas",
    pause: "Pause",
    resume: "Resume",
    coverage: "Moving area",
    inputStrength: "Push strength",
    bounceParam: "Bounce",
    maxStretch: "Stretch limit",
    sensor: "Motion sensor",
    sensorOff: "Disable sensor",
    sensorHelp:
      "Shake a supported phone over a secure connection after allowing motion access.",
    sensorUnavailable: "Motion sensing is unavailable. Drag the image instead.",
    sensorDenied: "Motion permission was not granted. Drag still works.",
    sensorOn: "Motion sensor enabled",
    live: "Recording · You can keep dragging",
    saveStop: "Stop & save",
    exportHint:
      "Capture the animation you see. GIF loops forever; video captures your gestures.",
    unsupported: "Unsupported in this browser",
    replaceTitle: "Replace this image?",
    replaceHelp:
      "The painted area and parameters will reset. Existing exports stay available.",
    replace: "Replace",
    fileError: "Choose a static PNG, JPEG or WebP image under 80 MB.",
    imageError: "Unable to read this image. Try another one.",
    empty: "Paint a moving area first, or choose Fill all.",
    keys: "B Paint · E Erase · H Pan · Ctrl/⌘ Z Undo",
    hint: "Scroll / pinch to zoom · Drag to pan",
    recordIdle: "Choose a format to capture your motion",
    quality: "Output size",
    recording: "Recording",
    reduced:
      "Paused for your reduced-motion preference. Press Resume to animate.",
    resultInfo: "pixels",
    local: "Local processing · No upload",
    sampleName: "Caramel pudding",
    failed: "Recording failed. Try a shorter duration or GIF.",
  },
  ja: {
    demo: "キャラメルプリン · 今すぐ体験",
    ready: "プリンをドラッグして離し、弾力を試そう。",
    loading: "プリンを準備中…",
    change: "画像を変更",
    examples: "静止画に、動きを。",
    exampleHelp: "同じプリンで3つの動き。サンプルを選んで調整できます。",
    soft: "やわらか揺れ",
    bounce: "弾むプリン",
    float: "ふわふわ浮遊",
    applied: "サンプルを読み込みました。ドラッグしてみよう。",
    zoom: "ズーム",
    resetView: "表示をリセット",
    pan: "キャンバス移動",
    pause: "一時停止",
    resume: "再開",
    coverage: "動く範囲",
    inputStrength: "押す強さ",
    bounceParam: "弾力",
    maxStretch: "変形上限",
    sensor: "モーションセンサー",
    sensorOff: "センサーを無効化",
    sensorHelp:
      "対応スマートフォンの安全な接続で、動作へのアクセスを許可して振ってください。",
    sensorUnavailable:
      "この端末では体感が利用できません。ドラッグしてください。",
    sensorDenied: "体感の許可がありません。ドラッグは利用できます。",
    sensorOn: "体感が有効です",
    live: "録画中 · ドラッグできます",
    saveStop: "停止して保存",
    exportHint:
      "プレビュー中の動きを録画。GIF は無限ループ、動画は操作も記録します。",
    unsupported: "このブラウザは非対応",
    replaceTitle: "画像を変更しますか？",
    replaceHelp:
      "ペイント範囲と設定がリセットされます。書き出したファイルは保存できます。",
    replace: "変更",
    fileError: "80 MB 以下の静止 PNG、JPEG、WebP を選択してください。",
    imageError: "画像を読み込めません。別の画像をお試しください。",
    empty: "動く範囲を塗るか、全塗りを選択してください。",
    keys: "B ペイント · E 消しゴム · H 移動 · Ctrl/⌘ Z 戻す",
    hint: "スクロール / ピンチでズーム · 移動でドラッグ",
    recordIdle: "形式を選び、現在の動きを録画",
    quality: "出力サイズ",
    recording: "録画中",
    reduced: "動きを減らす設定により一時停止中。再開を押してください。",
    resultInfo: "ピクセル",
    local: "端末内で処理 · アップロード不要",
    sampleName: "キャラメルプリン",
    failed: "録画に失敗。時間を短くするか GIF をお試しください。",
  },
};
const DEMOS = [
  { id: "soft", preset: "purupuru", mode: "sway", strength: 45, period: 1400 },
  { id: "bounce", preset: "sloshing", mode: "hop", strength: 32, period: 1200 },
  {
    id: "float",
    preset: "floating",
    mode: "orbit",
    strength: 28,
    period: 1800,
  },
];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function Range({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  suffix = "",
}) {
  return (
    <label className="wig-range">
      <span>
        {label}
        <output>
          {typeof value === "number" ? Number(value.toFixed(2)) : value}
          {suffix}
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export default function WiggleStudio({ lang: langProp = "zh" }) {
  const lang = i18n[langProp] ? langProp : "zh",
    t = i18n[lang],
    c = EXTRA[lang],
    meta = PRESET_META[lang];
  const [step, setStep] = useState("play"),
    [loaded, setLoaded] = useState(false),
    [name, setName] = useState(c.sampleName),
    [tool, setTool] = useState("paint");
  const [brush, setBrush] = useState(64),
    [strength, setStrength] = useState(0.85),
    [amount, setAmount] = useState(0),
    [historyCounts, setHistoryCounts] = useState([0, 0]);
  const [preset, setPreset] = useState("purupuru"),
    [params, setParams] = useState({ ...getPreset("purupuru") });
  const [auto, setAuto] = useState("sway"),
    [autoStrength, setAutoStrength] = useState(45),
    [period, setPeriod] = useState(1400),
    [paused, setPaused] = useState(false);
  const [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [size, setSize] = useState({ w: 720, h: 720 });
  const [format, setFormat] = useState("gif"),
    [duration, setDuration] = useState(5),
    [presentation, setPresentation] = useState("original"),
    [formats, setFormats] = useState({ gif: true });
  const [phase, setPhase] = useState("idle"),
    [progress, setProgress] = useState(0),
    [result, setResult] = useState(null),
    [message, setMessage] = useState(""),
    [pending, setPending] = useState(null),
    [sensor, setSensor] = useState(false);
  const view = useRef(null),
    paint = useRef(null),
    input = useRef(null),
    stage = useRef(null),
    modal = useRef(null),
    focusReturn = useRef(null);
  const model = useRef({
    source: null,
    mask: null,
    sim: null,
    renderer: null,
    history: [],
    future: [],
    elapsed: 0,
    drag: { active: false, target: { x: 0, y: 0 } },
    sensor: { x: 0, y: 0 },
    sensorCleanup: null,
    recording: null,
    stroke: null,
    loadId: 0,
  });
  const config = useRef({});
  config.current = {
    step,
    params,
    auto,
    autoStrength,
    period,
    paused,
    brush,
    strength,
    tool,
    phase,
  };
  const busy = phase !== "idle";

  function drawPaint() {
    const m = model.current;
    if (!m.source || !paint.current) return;
    const canvas = paint.current;
    canvas.width = m.source.width;
    canvas.height = m.source.height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#faf2ed";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(m.source, 0, 0);
    const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < m.mask.length; i++) {
      const a = m.mask[i] * 0.48,
        j = i * 4;
      rgba.data[j] = rgba.data[j] * (1 - a) + 210 * a;
      rgba.data[j + 1] = rgba.data[j + 1] * (1 - a) + 73 * a;
      rgba.data[j + 2] = rgba.data[j + 2] * (1 - a) + 114 * a;
    }
    ctx.putImageData(rgba, 0, 0);
  }
  function updateMask() {
    const m = model.current;
    setAmount(coverage(m.mask));
    setHistoryCounts([m.history.length, m.future.length]);
    m.sim = null;
    drawPaint();
  }
  function remember() {
    const m = model.current;
    m.history.push(m.mask.slice());
    if (m.history.length > 16) m.history.shift();
    m.future = [];
  }
  function maskAction(action) {
    const m = model.current;
    remember();
    if (action === "clear") m.mask.fill(0);
    if (action === "fill") m.mask.fill(1);
    if (action === "invert")
      for (let i = 0; i < m.mask.length; i++) m.mask[i] = 1 - m.mask[i];
    updateMask();
  }
  function undo(redo = false) {
    const m = model.current,
      from = redo ? m.future : m.history,
      to = redo ? m.history : m.future;
    if (!from.length) return;
    to.push(m.mask);
    m.mask = from.pop();
    updateMask();
  }
  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }
  async function loadImage(source, isSample = false, demo = DEMOS[0]) {
    const m = model.current,
      id = ++m.loadId;
    m.loading = true;
    setLoaded(false);
    const objectUrl =
      typeof source === "string" ? null : URL.createObjectURL(source);
    try {
      const img = new Image();
      img.src = objectUrl || source;
      await img.decode();
      if (id !== m.loadId) return;
      const scale = Math.min(
        1,
        720 / Math.max(img.naturalWidth, img.naturalHeight),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      m.source = canvas;
      m.isSample = isSample;
      m.mask = isSample
        ? puddingMask(canvas.width, canvas.height)
        : new Float32Array(canvas.width * canvas.height);
      m.history = [];
      m.future = [];
      m.sim = null;
      m.elapsed = 0;
      m.drag = { active: false, target: { x: 0, y: 0 } };
      m.renderer ||= new WiggleRenderer(view.current);
      m.renderer.setImage(canvas);
      m.renderer.resize(canvas.width, canvas.height, 1);
      setSize({ w: canvas.width, h: canvas.height });
      setName(isSample ? c.sampleName : source.name);
      setLoaded(true);
      setPreset(demo.preset);
      setParams({ ...getPreset(demo.preset) });
      setAuto(isSample ? demo.mode : null);
      setAutoStrength(demo.strength);
      setPeriod(demo.period);
      setStep(isSample ? "play" : "paint");
      resetView();
      updateMask();
      setMessage(isSample ? c.ready : t.paintHelp);
    } catch (error) {
      if (id === m.loadId) {
        setMessage(c.imageError);
        setLoaded(!!m.source);
      }
    } finally {
      if (id === m.loadId) m.loading = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }
  async function chooseFile(file) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 80 * 1024 * 1024
    ) {
      setMessage(c.fileError);
      return;
    }
    const header = new Uint8Array(await file.arrayBuffer());
    // APNG and animated WebP cannot be represented by this still-image editor.
    let animated = false;
    for (
      let at = file.type === "image/png" ? 8 : 12;
      at + 8 < header.length;

    ) {
      const png = file.type === "image/png";
      const type = String.fromCharCode(
        ...header.slice(at + (png ? 4 : 0), at + (png ? 8 : 4)),
      );
      if (type === "acTL" || type === "ANIM") {
        animated = true;
        break;
      }
      const n = png
        ? header[at] * 2 ** 24 +
          (header[at + 1] << 16) +
          (header[at + 2] << 8) +
          header[at + 3]
        : header[at + 4] +
          header[at + 5] * 256 +
          header[at + 6] * 65536 +
          header[at + 7] * 16777216;
      at += png ? n + 12 : n + 8 + (n % 2);
      if (file.type === "image/jpeg") break;
    }
    if (animated) {
      setMessage(c.fileError);
      return;
    }
    if (loaded) setPending({ file });
    else loadImage(file);
  }
  function example(demo) {
    if (!loaded || model.current.isSample)
      loadImage("/assets/wiggle/pudding.webp", true, demo);
    else setPending({ demo });
  }
  function changeStep(next) {
    if (busy) return;
    if (next !== "paint" && amount === 0) {
      setMessage(c.empty);
      setStep("paint");
      return;
    }
    setStep(next);
    resetView();
    setMessage(
      next === "paint"
        ? t.paintHelp
        : next === "record"
          ? c.recordIdle
          : c.ready,
    );
  }

  useEffect(() => {
    syncLanguageFromLocale(langProp);
    setFormats({
      gif: true,
      webm: !!videoMime("webm"),
      mp4: !!videoMime("mp4"),
    });
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setPaused(reduce);
    loadImage("/assets/wiggle/pudding.webp", true);
    let raf = 0,
      previous = performance.now();
    function tick(now) {
      const m = model.current,
        cfg = config.current,
        dt = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      if (m.source && cfg.step !== "paint") {
        if (!m.sim)
          m.sim = new WiggleSimulator(
            m.source.width,
            m.source.height,
            m.mask,
            m.source.width,
            m.source.height,
            cfg.params,
            { meshRes: m.renderer.mode === "webgl2" ? 48 : 20 },
          );
        if (m.paramVersion !== cfg.params) {
          m.sim.setParameters(cfg.params);
          m.paramVersion = cfg.params;
        }
        if (!cfg.paused || cfg.phase === "recording") {
          m.elapsed += dt;
          m.sim.advance(dt, {
            frameDragging: m.drag.active,
            frameTarget: m.drag.target,
            localAcceleration: m.sensor,
            automaticAcceleration: cfg.auto
              ? automaticAcceleration(
                  cfg.auto,
                  m.elapsed,
                  cfg.period,
                  cfg.autoStrength,
                )
              : { x: 0, y: 0 },
          });
        }
        const data = m.sim.getRenderData();
        m.renderer.render(data);
        m.recording?.capture(now, data.frame, data.aspect);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      const m = model.current;
      m.loadId++;
      clearTimeout(m.keyTimer);
      m.recording?.cancel();
      m.renderer?.dispose();
      m.renderer = null;
      m.sim = null;
      m.sensorCleanup?.();
    };
  }, [langProp]);
  useEffect(
    () => () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    },
    [result?.url],
  );
  useEffect(() => {
    if (!result && !pending) return;
    focusReturn.current = document.activeElement;
    const dialog = modal.current;
    dialog?.focus();
    function keys(e) {
      if (e.key === "Escape") {
        setPending(null);
        setResult(null);
      }
      if (e.key === "Tab" && dialog) {
        const all = [...dialog.querySelectorAll("button,a[href]")].filter(
          (el) => !el.disabled,
        );
        const first = all[0],
          last = all.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
      focusReturn.current?.focus();
    };
  }, [!!result, !!pending]);
  useEffect(() => {
    const el = stage.current;
    function wheel(e) {
      if (config.current.step !== "paint" || config.current.phase !== "idle")
        return;
      e.preventDefault();
      setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), 1, 4));
    }
    el?.addEventListener("wheel", wheel, { passive: false });
    return () => el?.removeEventListener("wheel", wheel);
  }, []);

  function point(e) {
    const rect = paint.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * size.w) / rect.width,
      y: ((e.clientY - rect.top) * size.h) / rect.height,
    };
  }
  function paintLine(a, b) {
    const m = model.current;
    const cfg = config.current;
    const distance = Math.hypot(b.x - a.x, b.y - a.y),
      n = Math.max(1, Math.ceil(distance / (cfg.brush * 0.15)));
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      stamp(
        m.mask,
        size.w,
        size.h,
        a.x + (b.x - a.x) * u,
        a.y + (b.y - a.y) * u,
        cfg.brush / 2,
        cfg.strength,
        cfg.tool === "erase",
      );
    }
    drawPaint();
  }
  function pointerDown(e) {
    if (!loaded || phase === "encoding" || (e.button != null && e.button !== 0))
      return;
    if (step !== "paint" && e.isPrimary === false) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus({ preventScroll: true });
    const m = model.current;
    if (step === "paint") {
      m.pointers ||= new Map();
      m.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (m.pointers.size === 2) {
        const [a, b] = [...m.pointers.values()];
        m.pinch = {
          distance: Math.hypot(a.x - b.x, a.y - b.y),
          zoom,
          pan,
          center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        };
        if (m.stroke && !m.stroke.pan) updateMask();
        m.stroke = null;
        return;
      }
      if (m.pointers.size > 2) return;
      if (tool === "pan")
        m.stroke = {
          id: e.pointerId,
          pan: true,
          x: e.clientX,
          y: e.clientY,
          origin: pan,
        };
      else {
        remember();
        const p = point(e);
        m.stroke = { id: e.pointerId, point: p };
        paintLine(p, p);
      }
    } else {
      m.drag.active = true;
      m.drag.target = { ...(m.sim?.getFrameOffset() || { x: 0, y: 0 }) };
      m.stroke = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        origin: { ...m.drag.target },
        scale:
          Math.min(
            e.currentTarget.getBoundingClientRect().width /
              (size.w / Math.min(size.w, size.h)),
            e.currentTarget.getBoundingClientRect().height /
              (size.h / Math.min(size.w, size.h)),
          ) * 0.925,
      };
    }
  }
  function pointerMove(e) {
    const m = model.current;
    if (m.pointers?.has(e.pointerId))
      m.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (step === "paint" && m.pinch && m.pointers.size >= 2) {
      const [a, b] = [...m.pointers.values()],
        p = m.pinch;
      setZoom(
        clamp(
          (p.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / Math.max(1, p.distance),
          1,
          4,
        ),
      );
      setPan({
        x: p.pan.x + (a.x + b.x) / 2 - p.center.x,
        y: p.pan.y + (a.y + b.y) / 2 - p.center.y,
      });
      return;
    }
    const s = m.stroke;
    if (!s || s.id !== e.pointerId) return;
    if (step === "paint") {
      if (s.pan)
        setPan({
          x: s.origin.x + e.clientX - s.x,
          y: s.origin.y + e.clientY - s.y,
        });
      else {
        const p = point(e);
        paintLine(s.point, p);
        s.point = p;
      }
    } else
      m.drag.target = {
        x: clamp(s.origin.x + (e.clientX - s.x) / s.scale, -0.16, 0.16),
        y: clamp(s.origin.y + (e.clientY - s.y) / s.scale, -0.16, 0.16),
      };
  }
  function pointerUp(e) {
    const m = model.current;
    m.pointers?.delete(e.pointerId);
    if (m.pinch) {
      m.pinch = null;
      m.stroke = null;
    } else if (m.stroke?.id === e.pointerId) {
      if (step === "paint" && !m.stroke.pan) updateMask();
      m.stroke = null;
      m.drag.active = false;
      m.drag.target = { x: 0, y: 0 };
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function editorKeys(e) {
    if (busy || step !== "paint") return;
    const key = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && key === "z") {
      e.preventDefault();
      undo(e.shiftKey);
    } else if (key === "b") setTool("paint");
    else if (key === "e") setTool("erase");
    else if (key === "h") setTool("pan");
  }
  function wiggleKeys(e) {
    if (phase === "encoding") return;
    const directions = {
      ArrowLeft: { x: -0.12, y: 0 },
      ArrowRight: { x: 0.12, y: 0 },
      ArrowUp: { x: 0, y: -0.12 },
      ArrowDown: { x: 0, y: 0.12 },
    };
    if (directions[e.key]) {
      e.preventDefault();
      const m = model.current;
      clearTimeout(m.keyTimer);
      m.drag = { active: true, target: directions[e.key] };
      m.keyTimer = setTimeout(() => {
        m.drag = { active: false, target: { x: 0, y: 0 } };
      }, 180);
    } else if (e.key === " " && !busy) {
      e.preventDefault();
      setPaused((p) => !p);
    }
  }

  async function record() {
    if (model.current.loading || !loaded) return;
    if (!amount) {
      setMessage(c.empty);
      return;
    }
    setPaused(false);
    setProgress(0);
    setPhase("recording");
    setMessage(c.live);
    try {
      const capture = startLiveRecording(view.current, {
        format,
        duration,
        presentation,
        initialData: model.current.sim?.getRenderData(),
        onProgress: setProgress,
        onEncoding: () => {
          setPhase("encoding");
          setMessage(t.encoding);
        },
      });
      model.current.recording = capture;
      const output = await capture.done;
      setResult({ ...output, url: URL.createObjectURL(output.blob) });
      setMessage(t.done);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Wiggle recording:", error);
        setMessage(c.failed);
      } else {
        setMessage(t.cancel);
        setProgress(0);
      }
    } finally {
      model.current.recording = null;
      setPhase("idle");
    }
  }
  async function toggleSensor() {
    const m = model.current;
    if (sensor) {
      m.sensorCleanup?.();
      m.sensorCleanup = null;
      m.sensor = { x: 0, y: 0 };
      setSensor(false);
      return;
    }
    if (!window.isSecureContext || !window.DeviceMotionEvent) {
      setMessage(c.sensorUnavailable);
      return;
    }
    try {
      if (
        typeof DeviceMotionEvent.requestPermission === "function" &&
        (await DeviceMotionEvent.requestPermission()) !== "granted"
      ) {
        setMessage(c.sensorDenied);
        return;
      }
      let received = false;
      const timer = setTimeout(() => {
        if (!received) {
          m.sensorCleanup?.();
          setSensor(false);
          setMessage(c.sensorUnavailable);
        }
      }, 2500);
      function motion(e) {
        const a = e.acceleration;
        if (!a || (!Number.isFinite(a.x) && !Number.isFinite(a.y))) return;
        received = true;
        const angle = ((screen.orientation?.angle || 0) * Math.PI) / 180,
          x = a.x || 0,
          y = -(a.y || 0);
        m.sensor = {
          x: clamp((x * Math.cos(angle) - y * Math.sin(angle)) / 5, -2, 2),
          y: clamp((x * Math.sin(angle) + y * Math.cos(angle)) / 5, -2, 2),
        };
      }
      window.addEventListener("devicemotion", motion);
      m.sensorCleanup = () => {
        clearTimeout(timer);
        window.removeEventListener("devicemotion", motion);
        m.sensor = { x: 0, y: 0 };
      };
      setSensor(true);
      setMessage(c.sensorOn);
    } catch {
      setMessage(c.sensorDenied);
    }
  }
  const setParam = (key, value) => setParams((p) => ({ ...p, [key]: value }));
  const pickPreset = (id) => {
    setPreset(id);
    setParams({ ...getPreset(id) });
  };
  const status = paused && !busy ? c.reduced : message || c.loading;
  return (
    <div className="wig-studio">
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="wig-file"
        aria-label={t.uploadTitle}
        onChange={(e) => {
          chooseFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="wig-intro">
        <div>
          <span className="wig-eyebrow">MOTION LAB / 01</span>
          <h2>{c.demo}</h2>
          <p>{t.subtitle}</p>
        </div>
        <span className="wig-local">● {c.local}</span>
      </div>
      <nav className="wig-steps" aria-label={t.title}>
        {["paint", "play", "record"].map((id, i) => (
          <button
            key={id}
            disabled={!loaded || busy}
            aria-current={step === id ? "step" : undefined}
            onClick={() => changeStep(id)}
          >
            <span>0{i + 1}</span>
            {
              t[
                { paint: "stepPaint", play: "stepPlay", record: "stepRecord" }[
                  id
                ]
              ]
            }
          </button>
        ))}
      </nav>
      <div className="wig-workbench">
        <section className="wig-preview" aria-label={t.nextPlay}>
          <div className="wig-preview-bar">
            <span className="wig-image-name" title={name}>
              {name}
            </span>
            <button disabled={busy} onClick={() => input.current.click()}>
              <Upload size={15} />
              {c.change}
            </button>
          </div>
          <div
            ref={stage}
            className={
              "wig-stage " + (step === "paint" ? "is-paint" : "is-play")
            }
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (!busy) chooseFile(e.dataTransfer.files?.[0]);
            }}
          >
            <div
              className="wig-canvas-wrap"
              style={{
                aspectRatio: `${size.w}/${size.h}`,
                "--wig-desktop-width": `${Math.min(600, (440 * size.w) / size.h)}px`,
                "--wig-mobile-width": `${Math.min(340, (320 * size.w) / size.h)}px`,
                transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
              }}
            >
              <canvas
                ref={view}
                className="wig-view"
                style={{ display: step === "paint" ? "none" : "block" }}
                tabIndex={step === "paint" ? -1 : 0}
                aria-label={c.ready}
                onKeyDown={wiggleKeys}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={pointerUp}
                onPointerCancel={pointerUp}
              />
              <canvas
                ref={paint}
                className={"wig-paint " + tool}
                style={{ display: step === "paint" ? "block" : "none" }}
                tabIndex={step === "paint" ? 0 : -1}
                aria-label={t.paintHelp}
                onKeyDown={editorKeys}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={pointerUp}
                onPointerCancel={pointerUp}
              />
            </div>
            {!loaded && <p className="wig-loading">{c.loading}</p>}
            {phase === "recording" && (
              <span className="wig-live">
                <i />
                {c.recording} {Math.round(progress * duration * 10) / 10}s /{" "}
                {duration}s
              </span>
            )}
          </div>
          <div className="wig-preview-footer">
            {step === "paint" ? (
              <>
                <span>{c.hint}</span>
                <div className="wig-zoom">
                  <button
                    aria-label={c.zoom + " −"}
                    disabled={zoom <= 1}
                    onClick={() => setZoom((z) => clamp(z / 1.25, 1, 4))}
                  >
                    <ZoomOut size={16} />
                  </button>
                  <output>{Math.round(zoom * 100)}%</output>
                  <button
                    aria-label={c.zoom + " +"}
                    disabled={zoom >= 4}
                    onClick={() => setZoom((z) => clamp(z * 1.25, 1, 4))}
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button aria-label={c.resetView} onClick={resetView}>
                    <RotateCcw size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <span>{c.ready}</span>
                <button disabled={busy} onClick={() => setPaused((p) => !p)}>
                  {paused ? <Play size={14} /> : <Square size={12} />}{" "}
                  {paused ? c.resume : c.pause}
                </button>
              </>
            )}
          </div>
          <p className="wig-status" role="status">
            {status}
          </p>
        </section>
        <aside className="wig-controls">
          {step === "paint" && (
            <>
              <div className="wig-control-head">
                <span>01 / PAINT</span>
                <h3>{t.paintTitle}</h3>
                <p>{t.paintHelp}</p>
              </div>
              <div className="wig-segments">
                {[
                  ["paint", Paintbrush, t.paint],
                  ["erase", Eraser, t.erase],
                  ["pan", Hand, c.pan],
                ].map(([id, Icon, label]) => (
                  <button
                    key={id}
                    aria-pressed={tool === id}
                    onClick={() => setTool(id)}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
              <Range
                label={t.brushSize}
                value={brush}
                min={8}
                max={200}
                onChange={setBrush}
                suffix=" px"
              />
              <Range
                label={t.brushStrength}
                value={strength * 100}
                min={5}
                max={100}
                onChange={(v) => setStrength(v / 100)}
                suffix="%"
              />
              <div className="wig-history">
                <button disabled={!historyCounts[0]} onClick={() => undo()}>
                  <Undo2 size={16} />
                  {t.undo}
                </button>
                <button disabled={!historyCounts[1]} onClick={() => undo(true)}>
                  <Redo2 size={16} />
                  {t.redo}
                </button>
              </div>
              <div className="wig-segments">
                {["fill", "invert", "clear"].map((id) => (
                  <button key={id} onClick={() => maskAction(id)}>
                    {t[id]}
                  </button>
                ))}
              </div>
              <p className="wig-note">
                {c.coverage} <strong>{Math.round(amount * 100)}%</strong>
                <br />
                {c.keys}
              </p>
              <button
                className="wig-primary"
                disabled={!loaded}
                onClick={() => changeStep("play")}
              >
                <Play size={16} />
                {t.nextPlay}
              </button>
            </>
          )}
          {step === "play" && (
            <>
              <div className="wig-control-head">
                <span>02 / WIGGLE</span>
                <h3>{t.playTitle}</h3>
                <p>{t.playHelp}</p>
              </div>
              <fieldset>
                <legend>{t.material}</legend>
                <div className="wig-materials">
                  {PRESET_ORDER.map((id) => (
                    <button
                      key={id}
                      aria-pressed={preset === id}
                      title={meta[id].hint}
                      onClick={() => pickPreset(id)}
                    >
                      {meta[id].name}
                      <small>{meta[id].hint}</small>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>{t.autoMotion}</legend>
                <div className="wig-segments">
                  {[null, "sway", "hop", "orbit"].map((id) => (
                    <button
                      key={id || "off"}
                      aria-pressed={auto === id}
                      onClick={() => setAuto(id)}
                    >
                      {t[id || "autoOff"]}
                    </button>
                  ))}
                </div>
              </fieldset>
              {auto && (
                <>
                  <Range
                    label={t.autoStrength}
                    value={autoStrength}
                    onChange={setAutoStrength}
                    suffix="%"
                  />
                  <Range
                    label={t.autoPeriod}
                    value={period / 1000}
                    min={0.2}
                    max={1.8}
                    step={0.05}
                    onChange={(v) => setPeriod(v * 1000)}
                    suffix={" " + t.seconds}
                  />
                </>
              )}
              <details className="wig-fine">
                <summary>{t.params}</summary>
                {[
                  ["inputStrength", c.inputStrength],
                  ["stretch", t.stretch],
                  ["bounce", c.bounceParam],
                  ["damping", t.damping],
                  ["cohesion", t.cohesion],
                  ["variation", t.variation],
                  ["maxStretch", c.maxStretch],
                ].map(([key, label]) => (
                  <Range
                    key={key}
                    label={label}
                    value={params[key]}
                    onChange={(v) => setParam(key, v)}
                  />
                ))}
                <label className="wig-select">
                  {t.gravityDir}
                  <select
                    value={params.gravityDirection}
                    onChange={(e) =>
                      setParam("gravityDirection", e.target.value)
                    }
                  >
                    {["down", "up", "left", "right", "none"].map((id) => (
                      <option key={id} value={id}>
                        {t["grav" + id[0].toUpperCase() + id.slice(1)]}
                      </option>
                    ))}
                  </select>
                </label>
                <Range
                  label={t.gravityStr}
                  value={params.gravityStrength}
                  min={0}
                  max={2}
                  step={0.05}
                  onChange={(v) => setParam("gravityStrength", v)}
                />
                <button onClick={() => pickPreset(preset)}>
                  <RotateCcw size={14} />
                  {t.resetPreset}
                </button>
              </details>
              <button className="wig-sensor" onClick={toggleSensor}>
                <Smartphone size={15} />
                {sensor ? c.sensorOff : c.sensor}
              </button>
              <p className="wig-note">{c.sensorHelp}</p>
              <button
                className="wig-primary"
                onClick={() => changeStep("record")}
              >
                {t.nextRecord}
                <span>→</span>
              </button>
            </>
          )}
          {step === "record" && (
            <>
              <div className="wig-control-head">
                <span>03 / RECORD</span>
                <h3>{t.recordTitle}</h3>
                <p>{c.exportHint}</p>
              </div>
              <fieldset disabled={busy}>
                <legend>{t.format}</legend>
                <div className="wig-segments">
                  {["gif", "mp4", "webm"].map((id) => (
                    <button
                      key={id}
                      aria-pressed={format === id}
                      disabled={!formats[id]}
                      title={!formats[id] ? c.unsupported : undefined}
                      onClick={() => setFormat(id)}
                    >
                      {id.toUpperCase()}
                    </button>
                  ))}
                </div>
                {!formats.mp4 && (
                  <p className="wig-note">MP4 · {c.unsupported}</p>
                )}
                <Range
                  label={t.duration}
                  value={duration}
                  min={1}
                  max={10}
                  onChange={setDuration}
                  suffix={" " + t.seconds}
                />
                <label className="wig-select">
                  {t.view}
                  <select
                    value={presentation}
                    onChange={(e) => setPresentation(e.target.value)}
                  >
                    <option value="original">{t.viewOriginal}</option>
                    <option value="crop">{t.viewCrop}</option>
                    <option value="camera-follow">{t.viewFollow}</option>
                  </select>
                </label>
                <p className="wig-note">
                  {
                    t[
                      {
                        original: "viewHelpOriginal",
                        crop: "viewHelpCrop",
                        "camera-follow": "viewHelpFollow",
                      }[presentation]
                    ]
                  }
                </p>
                <p className="wig-note">
                  {c.quality} ·{" "}
                  {Math.round(
                    (size.w *
                      Math.min(
                        format === "gif" ? 512 : 1080,
                        Math.max(size.w, size.h),
                      )) /
                      Math.max(size.w, size.h),
                  )}{" "}
                  ×{" "}
                  {Math.round(
                    (size.h *
                      Math.min(
                        format === "gif" ? 512 : 1080,
                        Math.max(size.w, size.h),
                      )) /
                      Math.max(size.w, size.h),
                  )}{" "}
                  px
                </p>
              </fieldset>
              {busy ? (
                <>
                  <progress value={progress} max="1" aria-label={c.recording} />
                  <button
                    className="wig-primary"
                    disabled={phase !== "recording"}
                    onClick={() => model.current.recording?.stop()}
                  >
                    <Square size={14} />
                    {phase === "encoding" ? t.encoding : c.saveStop}
                  </button>
                  <button
                    className="wig-cancel"
                    onClick={() => model.current.recording?.cancel()}
                  >
                    {t.cancel}
                  </button>
                </>
              ) : (
                <button
                  className="wig-primary"
                  disabled={!loaded}
                  onClick={record}
                >
                  <span className="wig-record-dot" />
                  {t.startRecord}
                </button>
              )}
              <button
                className="wig-back"
                disabled={busy}
                onClick={() => changeStep("play")}
              >
                ← {t.backPlay}
              </button>
            </>
          )}
        </aside>
      </div>
      <section className="wig-examples">
        <div>
          <span className="wig-eyebrow">MADE TO MOVE</span>
          <h3>{c.examples}</h3>
          <p>{c.exampleHelp}</p>
        </div>
        <div className="wig-example-grid">
          {DEMOS.map((demo, i) => (
            <button key={demo.id} disabled={busy} onClick={() => example(demo)}>
              <picture>
                <source
                  media="(prefers-reduced-motion: reduce)"
                  srcSet="/assets/wiggle/pudding.webp"
                />
                <img
                  src={"/assets/wiggle/pudding-" + demo.id + ".webp"}
                  alt={c.sampleName}
                  loading="lazy"
                  width="512"
                  height="512"
                />
              </picture>
              <span>
                <small>
                  0{i + 1} / {demo.mode.toUpperCase()}
                </small>
                {c[demo.id]}
                <b>↗</b>
              </span>
            </button>
          ))}
        </div>
      </section>
      {(pending || result) && (
        <div
          className="wig-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPending(null);
              setResult(null);
            }
          }}
        >
          <div
            ref={modal}
            className="wig-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wig-dialog-title"
            tabIndex={-1}
          >
            <button
              className="wig-modal-close"
              aria-label={t.closeResult}
              onClick={() => {
                setPending(null);
                setResult(null);
              }}
            >
              <X size={20} />
            </button>
            <h3 id="wig-dialog-title">
              {pending ? c.replaceTitle : t.resultTitle}
            </h3>
            {pending ? (
              <>
                <p>{c.replaceHelp}</p>
                <div className="wig-modal-actions">
                  <button onClick={() => setPending(null)}>{t.cancel}</button>
                  <button
                    className="wig-primary"
                    onClick={() => {
                      const next = pending;
                      setPending(null);
                      next.file
                        ? loadImage(next.file)
                        : loadImage(
                            "/assets/wiggle/pudding.webp",
                            true,
                            next.demo,
                          );
                    }}
                  >
                    {c.replace}
                  </button>
                </div>
              </>
            ) : (
              <>
                {result.format === "gif" ? (
                  <img
                    className="wig-result"
                    src={result.url}
                    alt={t.resultTitle}
                  />
                ) : (
                  <video
                    className="wig-result"
                    src={result.url}
                    controls
                    autoPlay
                    loop
                    playsInline
                  />
                )}
                <p>
                  {result.width} × {result.height} px ·{" "}
                  {(result.blob.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                  {result.format.toUpperCase()}
                </p>
                <a
                  className="wig-primary"
                  href={result.url}
                  download={result.filename}
                >
                  <Download size={16} />
                  {t.download} {result.format.toUpperCase()}
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
