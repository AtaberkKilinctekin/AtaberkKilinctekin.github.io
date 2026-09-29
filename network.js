function initNetwork() {
  const canvas = document.getElementById("net-canvas");
  const section = document.getElementById("ai");
  if (!canvas || !section) return;
  const ctx = canvas.getContext("2d");
  const nodes = [];
  let w = 0, h = 0, raf = 0, visible = false;

  function seed() {
    const count = w < 600 ? 22 : 46;
    nodes.length = 0;
    for (let i = 0; i < count; i++) {
      nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 });
    }
  }

  function resize() {
    const nw = canvas.clientWidth, nh = canvas.clientHeight;
    if (nw === w && nh === h) return;
    const widthChanged = nw !== w;
    w = nw; h = nh;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (widthChanged || !nodes.length) seed();
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    const maxD = w < 600 ? 90 : 140;
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d < maxD) {
          ctx.strokeStyle = `rgba(232,180,60,${0.25 * (1 - d / maxD)})`;
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
        }
      }
      ctx.fillStyle = "rgba(246,217,138,.6)";
      ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, 2, 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(section);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  window.addEventListener("resize", resize);
  resize();
}
