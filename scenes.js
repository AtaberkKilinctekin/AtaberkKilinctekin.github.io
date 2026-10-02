// The hero's exploded view and the AI production line. Both are aria-hidden; the text carries
// every fact they show. Nothing loops: the hero unfolds once, then both follow the scroll.
function initScenes() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  initExplode(reduced);
  initLine(reduced);
  // Only after load, so opening a #section link jumps there instead of scrolling the whole page.
  if (!reduced) addEventListener("load", () => document.documentElement.classList.add("smooth"), { once: true });
}

// Calls fn at most once per frame, however often the event fires.
function perFrame(fn) {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fn(); });
  };
}

function initExplode(reduced) {
  const scene = document.querySelector(".explode");
  if (!scene) return;
  const hero = document.getElementById("hero");
  const stack = scene.querySelector(".stack");
  const pins = [...scene.querySelectorAll(".pin")];
  const labs = [...scene.querySelectorAll(".lab")];

  // Labels sit in a flat overlay, not in the 3D stack, where upper layers would cover them.
  // Each leader starts at its layer's corner pin.
  function placeLabels() {
    const s = scene.getBoundingClientRect();
    const lead = parseFloat(getComputedStyle(scene).getPropertyValue("--lead"));
    let lines = "";
    let dots = "";
    pins.forEach((pin, i) => {
      const r = pin.getBoundingClientRect();
      const x = Math.round(r.left - s.left);
      const y = Math.round(r.top - s.top);
      labs[i].style.transform = `translate(${x + lead + 8}px, ${y}px)`;
      lines += `M${x} ${y}H${x + lead}`;
      dots += `M${x - 2.5} ${y}a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0`;
    });
    scene.querySelector(".lines").setAttribute("d", lines);
    scene.querySelector(".dots").setAttribute("d", dots);
  }

  let open = reduced ? 1 : 0;
  function spread() {
    const fold = reduced ? 0 : Math.min(window.scrollY / hero.offsetHeight, 1);
    stack.style.setProperty("--e", ((0.08 + 0.92 * open) * (1 - 0.8 * fold)).toFixed(3));
    scene.style.setProperty("--fold", fold.toFixed(3));
    placeLabels();
  }

  spread();
  if (reduced) {
    scene.classList.add("ready");
  } else {
    const start = performance.now() + 200;
    const unfold = (now) => {
      const t = Math.min(Math.max((now - start) / 1400, 0), 1);
      open = 1 - (1 - t) ** 3;
      spread();
      if (t < 1) requestAnimationFrame(unfold);
      else scene.classList.add("ready");
    };
    requestAnimationFrame(unfold);
    addEventListener("scroll", perFrame(spread), { passive: true });
  }
  addEventListener("resize", perFrame(spread));
  addEventListener("load", spread, { once: true });
  document.fonts?.ready.then(spread);
}

function initLine(reduced) {
  const line = document.querySelector(".line");
  if (!line) return;
  const parcels = [...line.querySelectorAll(".parcel")];
  const LENGTH = 600;
  const REVIEWED = 500;

  // Progress through the viewport, 0 as the section enters and 1 as it leaves.
  function move() {
    const r = line.getBoundingClientRect();
    const p = reduced ? 0.5 : Math.min(Math.max((innerHeight - r.top) / (innerHeight + r.height), 0), 1);
    parcels.forEach((parcel, i) => {
      const x = Math.round(((p * 1.6 + i / parcels.length) % 1) * LENGTH);
      parcel.style.transform = `translate3d(${x}px, 0, 0)`;
      parcel.style.opacity = Math.min(x / 40, (LENGTH - x) / 40, 1).toFixed(2);
      parcel.classList.toggle("done", x > REVIEWED);
    });
  }

  move();
  if (!reduced) addEventListener("scroll", perFrame(move), { passive: true });
  addEventListener("resize", perFrame(move));
}
