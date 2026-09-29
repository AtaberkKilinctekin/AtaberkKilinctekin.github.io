// The name resolves out of random characters once, on load.
function scramble(el, ms) {
  const text = el.textContent;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  el.setAttribute("aria-label", text);
  const t0 = performance.now();
  const tick = (t) => {
    const k = Math.min((t - t0) / ms, 1);
    const fixed = Math.floor(text.length * k);
    let out = text.slice(0, fixed);
    for (let i = fixed; i < text.length; i++) out += text[i] === " " ? " " : chars[(Math.random() * chars.length) | 0];
    el.textContent = out;
    if (k < 1) requestAnimationFrame(tick);
    else el.removeAttribute("aria-label");
  };
  requestAnimationFrame(tick);
}

function initFx() {
  const name = document.querySelector(".hero h1");
  if (name) scramble(name, 1400);

  document.querySelectorAll(".spot").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  // Tilt only for a real mouse; on touch it would fight scrolling.
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".project").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
      });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      io.unobserve(target);
      const end = Number(target.dataset.count);
      const suffix = target.dataset.suffix || "";
      const t0 = performance.now();
      const tick = (t) => {
        const k = Math.min((t - t0) / 1400, 1);
        target.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suffix;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });
  document.querySelectorAll("[data-count]").forEach((n) => io.observe(n));
}
