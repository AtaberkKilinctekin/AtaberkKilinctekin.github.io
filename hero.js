function initHero() {
  const canvas = document.getElementById("hero-canvas");
  const hero = document.getElementById("hero");
  if (!canvas || !hero) return;
  const ctx = canvas.getContext("2d");
  const coins = [];
  const pointer = { x: 0, y: 0 };
  let w = 0, h = 0, raf = 0, visible = true;

  function seed() {
    const count = w < 600 ? 40 : 90;
    coins.length = 0;
    for (let i = 0; i < count; i++) {
      coins.push({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 3, v: 0.15 + Math.random() * 0.5, depth: 0.2 + Math.random() });
    }
  }

  function resize() {
    const nw = canvas.clientWidth, nh = canvas.clientHeight;
    if (nw === w && nh === h) return;
    // Mobile toolbars fire height-only resizes while scrolling; keep the particles then.
    const widthChanged = nw !== w;
    w = nw; h = nh;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (widthChanged || !coins.length) seed();
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    for (const c of coins) {
      c.y -= c.v;
      if (c.y < -5) { c.y = h + 5; c.x = Math.random() * w; }
      const x = c.x + pointer.x * 30 * c.depth + Math.sin(t / 1500 + c.x) * 6;
      const y = c.y + pointer.y * 20 * c.depth;
      ctx.beginPath();
      ctx.arc(x, y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(170,255,190,${0.25 + 0.5 * c.depth / 1.2})`;
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) / r.width - 0.5;
    pointer.y = (e.clientY - r.top) / r.height - 0.5;
    // The cave layers read these in CSS (parallax).
    hero.style.setProperty("--px", pointer.x.toFixed(3));
    hero.style.setProperty("--py", pointer.y.toFixed(3));
  });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(hero);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  window.addEventListener("resize", resize);
  resize(); start();
}
