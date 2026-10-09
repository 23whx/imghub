/**
 * WebGL2 mesh warp renderer + 2D fallback (PuruPuru-style textured mesh).
 */

const VERT = `#version 300 es
precision mediump float;
in vec2 a_position;
in vec2 a_uv;
uniform vec2 u_content_scale;
uniform vec2 u_translation;
uniform float u_scale;
out vec2 v_uv;
void main() {
  vec2 clip = (a_position * u_content_scale + u_translation) * u_scale;
  // Mesh Y grows downward (same as image); negate for WebGL clip space (Y up).
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  // Mesh UVs: v=0 at image top. With UNPACK_FLIP_Y=false, canvas top is at
  // texture v=0, so pass UVs through — do NOT invert V (that flips the image).
  v_uv = a_uv;
}`;

const FRAG = `#version 300 es
precision mediump float;
uniform sampler2D u_image;
uniform float u_bg_dim;
in vec2 v_uv;
out vec4 out_color;
void main() {
  vec4 c = texture(u_image, v_uv);
  out_color = vec4(c.rgb * u_bg_dim, c.a);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log || 'shader compile failed');
  }
  return sh;
}

function link(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || 'program link failed');
  }
  return p;
}

export class WiggleRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.mode = 'canvas2d';
    this.texture = null;
    this.buffers = null;
    this.uniforms = null;
    this.imageSize = { w: 1, h: 1 };
    this.tryInitWebGL();
  }

  tryInitWebGL() {
    try {
      const gl = this.canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true,
      });
      if (!gl) return;
      const vs = compile(gl, gl.VERTEX_SHADER, VERT);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      const program = link(gl, vs, fs);
      this.gl = gl;
      this.program = program;
      this.mode = 'webgl2';
      this.buffers = {
        pos: gl.createBuffer(),
        uv: gl.createBuffer(),
        idx: gl.createBuffer(),
      };
      this.attribs = {
        pos: gl.getAttribLocation(program, 'a_position'),
        uv: gl.getAttribLocation(program, 'a_uv'),
      };
      this.uniforms = {
        contentScale: gl.getUniformLocation(program, 'u_content_scale'),
        translation: gl.getUniformLocation(program, 'u_translation'),
        scale: gl.getUniformLocation(program, 'u_scale'),
        image: gl.getUniformLocation(program, 'u_image'),
        bgDim: gl.getUniformLocation(program, 'u_bg_dim'),
      };
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    } catch {
      this.mode = 'canvas2d';
      this.gl = null;
    }
  }

  setImage(sourceCanvas) {
    this.imageSize = { w: sourceCanvas.width, h: sourceCanvas.height };
    if (this.mode === 'webgl2' && this.gl) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
    }
    this.sourceCanvas = sourceCanvas;
  }

  resize(cssW, cssH, dpr = window.devicePixelRatio || 1) {
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.cssSize = { w: cssW, h: cssH, dpr };
  }

  render(renderData, options = {}) {
    if (this.mode === 'webgl2' && this.gl) {
      this.renderWebGL(renderData, options);
    } else {
      this.renderCanvas2D(renderData, options);
    }
  }

  renderWebGL(data, options) {
    const gl = this.gl;
    const { positions, uvs, indices, aspect, frame } = data;
    const posF32 = this.positions?.length === positions.length ? this.positions : (this.positions = new Float32Array(positions.length));
    for (let i = 0; i < positions.length; i++) posF32[i] = positions[i];

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.98, 0.95, 0.93, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.pos);
    gl.bufferData(gl.ARRAY_BUFFER, posF32, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.attribs.pos);
    gl.vertexAttribPointer(this.attribs.pos, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uv);
    if (this.lastUvs !== uvs) gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.attribs.uv);
    gl.vertexAttribPointer(this.attribs.uv, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.idx);
    if (this.lastIndices !== indices) gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    this.lastUvs = uvs;
    this.lastIndices = indices;

    // Fit mesh into canvas preserving aspect
    const meshW = aspect.sx;
    const meshH = aspect.sy;
    const scale = 1.85;
    // content scale maps mesh units to NDC-ish
    const pixelScale = Math.min(this.canvas.width / meshW, this.canvas.height / meshH);
    const contentScaleX = pixelScale / this.canvas.width;
    const contentScaleY = pixelScale / this.canvas.height;

    gl.uniform2f(this.uniforms.contentScale, contentScaleX, contentScaleY);
    gl.uniform2f(
      this.uniforms.translation,
      (frame?.x || 0) * contentScaleX,
      (frame?.y || 0) * contentScaleY
    );
    gl.uniform1f(this.uniforms.scale, scale);
    gl.uniform1f(this.uniforms.bgDim, options.dim ?? 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.uniforms.image, 0);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
  }

  renderCanvas2D(data, options) {
    const ctx = this.canvas.getContext('2d');
    const { positions, restPositions, indices, aspect, frame } = data;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#faf5f2';
    ctx.fillRect(0, 0, w, h);
    if (!this.sourceCanvas) return;

    const meshW = aspect.sx;
    const meshH = aspect.sy;
    // Fit full mesh (span = meshW x meshH, centered at origin) into canvas
    const pad = 0.075;
    const scale = Math.min(w / meshW, h / meshH) * (1 - pad);
    const ox = w / 2 + (frame?.x || 0) * scale;
    const oy = h / 2 + (frame?.y || 0) * scale;
    const imgW = this.sourceCanvas.width;
    const imgH = this.sourceCanvas.height;

    const toScreen = (i) => ({
      x: ox + (positions[i * 2] ?? 0) * scale,
      y: oy + (positions[i * 2 + 1] ?? 0) * scale,
    });
    // Source UVs from rest pose → image pixels (no double-draw base — avoids ghosting)
    const toSrc = (i) => {
      const rx = restPositions[i * 2] ?? 0;
      const ry = restPositions[i * 2 + 1] ?? 0;
      return {
        x: (rx / meshW + 0.5) * imgW,
        y: (ry / meshH + 0.5) * imgH,
      };
    };

    ctx.save();
    if (options.dim != null && options.dim !== 1) ctx.globalAlpha = options.dim;
    // Draw every mesh triangle (fixed cells ≈ identity warp, free cells deform)
    for (let t = 0; t < indices.length; t += 3) {
      const i0 = indices[t];
      const i1 = indices[t + 1];
      const i2 = indices[t + 2];
      this.drawTexturedTriangle(
        ctx,
        this.sourceCanvas,
        toSrc(i0),
        toSrc(i1),
        toSrc(i2),
        toScreen(i0),
        toScreen(i1),
        toScreen(i2)
      );
    }
    ctx.restore();
  }

  drawTexturedTriangle(ctx, img, s0, s1, s2, d0, d1, d2) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(d0.x, d0.y);
    ctx.lineTo(d1.x, d1.y);
    ctx.lineTo(d2.x, d2.y);
    ctx.closePath();
    ctx.clip();
    const denom =
      s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
    if (Math.abs(denom) < 1e-6) {
      ctx.restore();
      return;
    }
    const m11 =
      (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / denom;
    const m12 =
      (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / denom;
    const m13 =
      (d0.x * (s1.x * s2.y - s2.x * s1.y) +
        d1.x * (s2.x * s0.y - s0.x * s2.y) +
        d2.x * (s0.x * s1.y - s1.x * s0.y)) /
      denom;
    const m21 =
      (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / denom;
    const m22 =
      (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / denom;
    const m23 =
      (d0.y * (s1.x * s2.y - s2.x * s1.y) +
        d1.y * (s2.x * s0.y - s0.x * s2.y) +
        d2.y * (s0.x * s1.y - s1.x * s0.y)) /
      denom;
    ctx.setTransform(m11, m21, m12, m22, m13, m23);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  /** Snapshot current canvas to an offscreen canvas at export size */
  snapshotToCanvas(targetW, targetH) {
    const out = document.createElement('canvas');
    out.width = targetW;
    out.height = targetH;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#faf5f2';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(this.canvas, 0, 0, targetW, targetH);
    return out;
  }

  dispose() {
    const gl = this.gl;
    if (!gl) return;
    Object.values(this.buffers || {}).forEach(buffer => gl.deleteBuffer(buffer));
    gl.deleteTexture(this.texture);
    gl.deleteProgram(this.program);
  }
}
