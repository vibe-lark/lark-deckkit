(function () {
  "use strict";

  if (window.LarkDeckKitReady) return;

  function currentScript() {
    if (document.currentScript) return document.currentScript;
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    return scripts.find((script) => script.src.includes("lark-deckkit-loader.js")) || scripts[scripts.length - 1];
  }

  const script = currentScript();
  const base = new URL(script?.getAttribute("data-base") || ".", script?.src || window.location.href);

  function url(path) {
    return new URL(path, base).href;
  }

  function loadCss(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const tag = document.createElement("script");
      tag.src = src;
      tag.async = false;
      tag.onload = resolve;
      tag.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(tag);
    });
  }

  loadCss(url("fonts.css"));
  loadCss(url("lark-slides.css"));

  window.LarkDeckKitReady = loadScript(url("lark-slides.js"))
    .then(() => loadScript(url("templates.js")))
    .then(() => {
      window.dispatchEvent(
        new CustomEvent("lark-deckkit:ready", {
          detail: {
            LarkSlides: window.LarkSlides,
            LarkSlideTemplates: window.LarkSlideTemplates,
            LarkSlideSDK: window.LarkSlideSDK,
          },
        })
      );
      return window.LarkSlideSDK;
    });
})();
