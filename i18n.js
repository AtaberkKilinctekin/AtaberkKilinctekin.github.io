function pickLang() {
  try {
    const saved = localStorage.getItem("lang");
    if (saved === "tr" || saved === "en") return saved;
  } catch (_) { /* storage unavailable */ }
  const prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"];
  const first = prefs.find((l) => /^(tr|en)/i.test(l));
  return first && first.toLowerCase().startsWith("tr") ? "tr" : "en";
}

function apply(lang) {
  document.documentElement.lang = lang;
  document.title = COPY[lang]["meta.title"];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const text = COPY[lang][el.dataset.i18n];
    if (text) el.textContent = text;
  });
  const btn = document.getElementById("lang-toggle");
  if (btn) {
    btn.textContent = lang === "tr" ? "EN" : "TR";
    btn.setAttribute("aria-label", lang === "tr" ? "English (EN)" : "Türkçe (TR)");
  }
}

function initI18n() {
  let lang = pickLang();
  apply(lang);
  document.getElementById("lang-toggle")?.addEventListener("click", () => {
    lang = lang === "tr" ? "en" : "tr";
    try { localStorage.setItem("lang", lang); } catch (_) { /* ignore */ }
    apply(lang);
  });
}
