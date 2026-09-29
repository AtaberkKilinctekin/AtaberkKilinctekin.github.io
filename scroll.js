function initScroll() {
  if (!window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // Siblings in one container cascade. clearProps hands transform back to CSS (card tilt, hover shifts).
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    const group = [...el.parentElement.children].filter((c) => c.hasAttribute("data-reveal"));
    gsap.from(el, {
      y: 44, opacity: 0, duration: 0.9, ease: "power3.out",
      delay: Math.min(group.indexOf(el), 5) * 0.08,
      clearProps: "transform,opacity",
      scrollTrigger: { trigger: el, start: "top 90%", once: true }
    });
  });

  // --p drives the timeline line (scaleY in CSS); it defaults to 1 without JS.
  gsap.fromTo(".steps", { "--p": 0 }, {
    "--p": 1, ease: "none",
    scrollTrigger: { trigger: ".steps", start: "top 75%", end: "bottom 60%", scrub: true }
  });

  gsap.to(".hero-grid", {
    yPercent: -6, opacity: 0.35, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });

  gsap.utils.toArray(".big-num").forEach((n) => {
    gsap.fromTo(n, { yPercent: 18 }, {
      yPercent: -12, ease: "none",
      scrollTrigger: { trigger: n.parentElement, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  // The gate rises into place and the doors strain against whatever is inside.
  gsap.fromTo(".gate", { y: 70 }, {
    y: 0, ease: "none",
    scrollTrigger: { trigger: ".scene", start: "top bottom", end: "center center", scrub: true }
  });
  gsap.to(".door-left", { x: -4, ease: "none", scrollTrigger: { trigger: ".door", start: "top 80%", end: "bottom 30%", scrub: true } });
  gsap.to(".door-right", { x: 4, ease: "none", scrollTrigger: { trigger: ".door", start: "top 80%", end: "bottom 30%", scrub: true } });
}
