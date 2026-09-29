// 3D code rain in raw WebGL2. Every glyph is an instanced quad; falling, trails and glyph
// changes all run in the vertex shader, so the CPU only uploads a few uniforms per frame.
function initRain() {
  const canvas = document.getElementById("rain");
  const gl = canvas && canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return false;
  document.documentElement.classList.add("rain-on");

  const small = window.innerWidth < 700;
  const COLS = small ? 170 : 360;
  const CELLS = 56;
  // Latin letters, digits and code symbols: 64 glyphs, one 8x8 atlas.
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789aeiknorstuvxyz{}<>/=;+*()[]#";

  const vs = `#version 300 es
  in vec2 aQuad; in vec4 aCol; in float aCell;
  uniform mat4 uProj, uView; uniform float uTime, uFly, uCells, uCellH, uGlyph;
  out vec2 vUv; out float vB; out float vHead;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    float cycle = uCells + 18.0;
    float head = mod(uTime * aCol.z + aCol.w * cycle, cycle);
    float d = head - aCell;
    float trail = 8.0 + hash(aCol.w * 91.7) * 16.0;
    float b = (d >= 0.0 && d < trail) ? pow(1.0 - d / trail, 1.5) : 0.0;
    vHead = step(0.0, d) * step(d, 0.9);
    float rate = 3.0 + hash(aCol.w * 13.1) * 9.0;
    float g = floor(hash(aCell * 12.9898 + aCol.w * 78.233 + floor(uTime * rate + aCell * 0.37)) * 64.0);
    vUv = (vec2(mod(g, 8.0), floor(g / 8.0)) + vec2(aQuad.x * 0.5 + 0.5, 0.5 - aQuad.y * 0.5)) / 8.0;
    // Columns live in z [-28, -2) and wrap, so flying forward never runs out of rain.
    float z = mod(aCol.y + uFly + 28.0, 26.0) - 28.0;
    vec4 mv = uView * vec4(aCol.x, (uCells * 0.5 - aCell) * uCellH, z, 1.0);
    mv.xy += aQuad * uGlyph;
    float fog = smoothstep(-30.0, -11.0, mv.z) * (1.0 - smoothstep(-5.0, -2.2, mv.z));
    vB = b * fog;
    // Dark glyphs never reach the fragment stage.
    gl_Position = vB < 0.003 ? vec4(2.0, 2.0, 2.0, 1.0) : uProj * mv;
  }`;
  const fs = `#version 300 es
  precision mediump float;
  in vec2 vUv; in float vB; in float vHead;
  uniform sampler2D uAtlas; uniform vec3 uColor, uHead; uniform float uAlpha;
  out vec4 o;
  void main() {
    float a = texture(uAtlas, vUv).a * vB * uAlpha;
    if (a < 0.004) discard;
    o = vec4(mix(uColor, uHead, vHead) * a, a);
  }`;

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (_) {
    document.documentElement.classList.remove("rain-on");
    return false;
  }
  gl.useProgram(prog);
  const U = (n) => gl.getUniformLocation(prog, n);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  function attrib(name, data, size, divisor) {
    const loc = gl.getAttribLocation(prog, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(loc, divisor);
  }
  attrib("aQuad", new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), 2, 0);
  const col = new Float32Array(COLS * CELLS * 4);
  const cell = new Float32Array(COLS * CELLS);
  for (let c = 0; c < COLS; c++) {
    const x = (Math.random() * 2 - 1) * 20, z = -2 - Math.random() * 26;
    const speed = 9 + Math.random() * 13, seed = Math.random();
    for (let k = 0; k < CELLS; k++) {
      const i = c * CELLS + k;
      col.set([x, z, speed, seed], i * 4);
      cell[i] = k;
    }
  }
  attrib("aCol", col, 4, 1);
  attrib("aCell", cell, 1, 1);

  // Glyph atlas, redrawn once web fonts are ready.
  const tex = gl.createTexture();
  function drawAtlas() {
    const a = document.createElement("canvas");
    a.width = a.height = 512;
    const ctx = a.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 44px 'IBM Plex Mono', monospace";
    [...GLYPHS].forEach((ch, i) => {
      ctx.save();
      ctx.translate((i % 8) * 64 + 32, Math.floor(i / 8) * 64 + 34);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, a);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  }
  drawAtlas();
  if (document.fonts) document.fonts.ready.then(drawAtlas);

  gl.uniform1f(U("uCells"), CELLS);
  gl.uniform1f(U("uCellH"), 0.42);
  gl.uniform1f(U("uGlyph"), 0.17);
  gl.uniform3f(U("uColor"), 0.0, 1.0, 0.25);
  gl.uniform3f(U("uHead"), 0.85, 1.0, 0.9);
  gl.uniform1f(U("uAlpha"), 0.95);
  gl.uniform1i(U("uAtlas"), 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function lookAt(e, t) {
    let zx = e[0] - t[0], zy = e[1] - t[1], zz = e[2] - t[2];
    let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    let xx = zz, xy = 0, xz = -zx; // cross(up=(0,1,0), z)
    l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
  }

  let w = 0, h = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(U("uProj"), false, perspective(Math.PI / 3, w / h, 0.1, 60));
  }
  resize();
  window.addEventListener("resize", resize);

  const target = { x: 0, y: 0 }, cam = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    target.x = e.clientX / w - 0.5;
    target.y = e.clientY / h - 0.5;
  });

  let raf = 0, fly = 0, last = performance.now();
  function frame(t) {
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    cam.x += (target.x - cam.x) * 0.04;
    cam.y += (target.y - cam.y) * 0.04;
    // Scrolling flies the camera into the rain; time adds a slow drift on top.
    fly += dt * 0.35;
    gl.uniform1f(U("uFly"), fly + window.scrollY * 0.0045);
    gl.uniform1f(U("uTime"), t / 1000);
    gl.uniformMatrix4fv(U("uView"), false, lookAt([cam.x * 1.6, -cam.y * 0.9, 0], [cam.x * 0.4, -cam.y * 0.2, -14]));
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, COLS * CELLS);
    raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  start();
  return true;
}
