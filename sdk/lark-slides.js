(function () {
  "use strict";

  const DEFAULT_SIZE = { width: 1600, height: 900 };
  const themes = {};

  defineTheme("default", {
    className: "ls-theme-default",
    cssVars: {},
  });

  defineTheme("larkVisual", {
    className: "ls-theme-lark-visual",
    cssVars: {
      "--ls-app-bg": "#111217",
      "--ls-slide-bg": "#000000",
      "--ls-accent": "#1456f0",
    },
  });

  function toElement(slide, index) {
    if (slide instanceof HTMLElement) return slide;

    const section = document.createElement("section");
    section.className = `ls-slide ${slide.className || ""}`.trim();
    section.dataset.index = String(index + 1);
    if (slide.id) section.id = slide.id;
    if (slide.title) section.dataset.title = slide.title;
    if (slide.template) section.dataset.template = slide.template;
    if (slide.sourceSlide) section.dataset.sourceSlide = String(slide.sourceSlide);
    section.setAttribute("aria-label", slide.title || `Slide ${index + 1}`);

    const inner = document.createElement("div");
    inner.className = "ls-slide-inner";
    inner.innerHTML = typeof slide === "string" ? slide : slide.content || "";
    section.appendChild(inner);
    return section;
  }

  function ensureStructure(mount) {
    let stage = mount.querySelector(":scope > .ls-stage");
    if (stage) return stage;

    stage = document.createElement("div");
    stage.className = "ls-stage";

    const existingSlides = Array.from(mount.querySelectorAll(":scope > .ls-slide"));
    for (const slide of existingSlides) stage.appendChild(slide);
    mount.appendChild(stage);
    return stage;
  }

  function ensureInner(slide) {
    let inner = slide.querySelector(":scope > .ls-slide-inner");
    if (!inner) {
      inner = document.createElement("div");
      inner.className = "ls-slide-inner";
      while (slide.firstChild) inner.appendChild(slide.firstChild);
      slide.appendChild(inner);
    }
    return inner;
  }

  function mountControls(deck) {
    if (!deck.options.controls) return null;

    const toolbar = document.createElement("div");
    toolbar.className = "ls-toolbar";
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "Slide controls");

    const prev = button("上一页", "‹", () => deck.prev());
    const next = button("下一页", "›", () => deck.next());
    const fullscreen = button("全屏播放", "⛶", () => deck.toggleFullscreen());

    const status = document.createElement("div");
    status.className = "ls-status";
    status.setAttribute("aria-live", "polite");
    deck.status = status;

    toolbar.append(prev, status, next, fullscreen);
    deck.mount.appendChild(toolbar);

    const progress = document.createElement("div");
    progress.className = "ls-progress";
    const bar = document.createElement("div");
    bar.className = "ls-progress-bar";
    progress.appendChild(bar);
    deck.mount.appendChild(progress);
    deck.progressBar = bar;

    return toolbar;
  }

  function button(label, text, onClick) {
    const el = document.createElement("button");
    el.className = "ls-button";
    el.type = "button";
    el.setAttribute("aria-label", label);
    el.title = label;
    el.textContent = text;
    el.addEventListener("click", onClick);
    return el;
  }

  function renderDeck(deck) {
    if (deck.options.slides?.length) {
      deck.stage.replaceChildren(
        ...deck.options.slides.map((slide, index) => toElement(slide, index))
      );
    }

    deck.slides = Array.from(deck.stage.querySelectorAll(":scope > .ls-slide"));
    deck.slideInners = deck.slides.map((slide, index) => {
      const inner = ensureInner(slide);
      slide.dataset.index = slide.dataset.index || String(index + 1);
      setSlideActive(slide, index === deck.index);
      return inner;
    });

    if (!deck.controls) deck.controls = mountControls(deck);
    deck.updateScale();
    deck.goTo(deck.index, { replace: true });
    return deck;
  }

  function createDeck(rawOptions = {}) {
    const options = normalizeCreateOptions(rawOptions);
    const mount =
      typeof options.mount === "string"
        ? document.querySelector(options.mount)
        : options.mount || document.querySelector("[data-lark-deck]");

    if (!mount) throw new Error("LarkSlides: missing mount element");
    mount.classList.add("ls-app");
    mount.classList.toggle("ls-no-controls", options.controls === false);

    const deck = {
      mount,
      stage: ensureStructure(mount),
      options: {
        controls: options.controls !== false,
        keyboard: options.keyboard !== false,
        hash: options.hash !== false,
        size: options.size || DEFAULT_SIZE,
        slides: options.slides || null,
        theme: options.theme || "default",
        metadata: options.metadata || options.meta || {},
      },
      index: readHashIndex() || 0,
      slides: [],
      slideInners: [],
      controls: null,
      status: null,
      progressBar: null,
      scaleFrame: 0,
      scaleTransform: "",
      theme: null,
      updateScale,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen,
      syncPresentationState,
      isPresenting,
      renderDeck() {
        return renderDeck(this);
      },
      goTo(index, meta = {}) {
        const numeric = normalizeIndex(index, this.slides.length);
        const previous = this.index;
        this.index = numeric;
        setSlideActive(this.slides[previous], false);
        setSlideActive(this.slides[numeric], true);
        preloadNearbySlides(this.slides, numeric);
        if (this.status) this.status.textContent = `${numeric + 1} / ${this.slides.length}`;
        if (this.progressBar) {
          const width = this.slides.length <= 1 ? 100 : ((numeric + 1) / this.slides.length) * 100;
          this.progressBar.style.width = `${width}%`;
        }
        if (this.options.hash && !meta.replace) {
          history.replaceState(null, "", `#/${numeric + 1}`);
        }
        return this;
      },
      next() {
        return this.goTo(this.index + 1);
      },
      prev() {
        return this.goTo(this.index - 1);
      },
      destroy() {
        window.removeEventListener("resize", this.onResize);
        window.removeEventListener("hashchange", this.onHashChange);
        window.removeEventListener("keydown", this.onKeydown);
        document.removeEventListener("fullscreenchange", this.onFullscreenChange);
        cancelAnimationFrame(this.scaleFrame);
      },
    };

    deck.theme = applyTheme(deck, deck.options.theme);

    deck.onResize = () => {
      cancelAnimationFrame(deck.scaleFrame);
      deck.scaleFrame = requestAnimationFrame(() => deck.updateScale());
    };
    deck.onHashChange = () => deck.goTo(readHashIndex() || 0, { replace: true });
    deck.onFullscreenChange = () => deck.syncPresentationState();
    deck.onKeydown = (event) => {
      if (!deck.options.keyboard) return;
      if (event.target?.isContentEditable) return;
      if (event.code === "Escape" && deck.isPresenting()) {
        event.preventDefault();
        deck.exitFullscreen();
        return;
      }
      if (["ArrowRight", "PageDown", "Space"].includes(event.code)) {
        event.preventDefault();
        deck.next();
      }
      if (["ArrowLeft", "PageUp"].includes(event.code)) {
        event.preventDefault();
        deck.prev();
      }
      if (event.code === "Home") deck.goTo(0);
      if (event.code === "End") deck.goTo(deck.slides.length - 1);
    };

    window.addEventListener("resize", deck.onResize);
    window.addEventListener("hashchange", deck.onHashChange);
    window.addEventListener("keydown", deck.onKeydown);
    document.addEventListener("fullscreenchange", deck.onFullscreenChange);

    return deck.renderDeck();
  }

  function createDeckSpec({
    title = "",
    description = "",
    theme = "larkVisual",
    size = DEFAULT_SIZE,
    slides = [],
    assets = {},
    meta = {},
  } = {}) {
    return {
      title,
      description,
      theme,
      size,
      slides: Array.from(slides),
      assets: { ...assets },
      meta: { ...meta },
    };
  }

  function normalizeCreateOptions(options = {}) {
    const spec = options.deck || options.spec;
    if (!spec) return options;

    return {
      ...spec,
      ...options,
      slides: options.slides || spec.slides || [],
      size: options.size || spec.size || DEFAULT_SIZE,
      theme: options.theme || spec.theme || "default",
      metadata: options.metadata || options.meta || spec.meta || {},
    };
  }

  function defineTheme(name, theme = {}) {
    if (!name || typeof name !== "string") {
      throw new Error("LarkSlides: theme name is required");
    }
    const normalized = {
      name,
      className: theme.className || "",
      cssVars: { ...(theme.cssVars || {}) },
      meta: { ...(theme.meta || {}) },
    };
    themes[name] = normalized;
    return normalized;
  }

  function resolveTheme(theme = "default") {
    if (typeof theme === "string") return themes[theme] || themes.default;
    if (theme && typeof theme === "object") {
      return {
        name: theme.name || "custom",
        className: theme.className || "",
        cssVars: { ...(theme.cssVars || {}) },
        meta: { ...(theme.meta || {}) },
      };
    }
    return themes.default;
  }

  function applyTheme(target, themeInput = "default") {
    const mount = target?.mount || target;
    const theme = resolveTheme(themeInput);
    if (!mount) return theme;

    if (mount.__larkThemeClass) mount.classList.remove(mount.__larkThemeClass);
    (mount.__larkThemeVars || []).forEach((property) => mount.style.removeProperty(property));

    if (mount.dataset) mount.dataset.larkTheme = theme.name;
    if (theme.className) mount.classList.add(theme.className);
    Object.entries(theme.cssVars || {}).forEach(([property, value]) => {
      mount.style.setProperty(property, value);
    });
    mount.__larkThemeClass = theme.className;
    mount.__larkThemeVars = Object.keys(theme.cssVars || {});
    return theme;
  }

  function updateScale() {
    const size = this?.options?.size || DEFAULT_SIZE;
    const stage = this?.stage || document.querySelector(".ls-stage");
    if (!stage) return;
    const scale = Math.min(stage.clientWidth / size.width, stage.clientHeight / size.height);
    const offsetX = (stage.clientWidth - size.width * scale) / 2;
    const offsetY = (stage.clientHeight - size.height * scale) / 2;
    const transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    if (this?.stage && this.scaleTransform === transform) return;
    if (this?.stage) this.scaleTransform = transform;

    const inners = this?.slideInners?.length
      ? this.slideInners
      : Array.from(stage.querySelectorAll(".ls-slide-inner"));
    inners.forEach((inner) => {
      inner.style.transform = transform;
    });
  }

  function enterFullscreen() {
    if (document.fullscreenElement === this.mount) return Promise.resolve(this);
    if (!this.mount.requestFullscreen) {
      this.syncPresentationState(true);
      return Promise.resolve(this);
    }
    return this.mount.requestFullscreen().then(() => this);
  }

  function exitFullscreen() {
    if (document.fullscreenElement === this.mount && document.exitFullscreen) {
      return document.exitFullscreen().then(() => this);
    }
    this.syncPresentationState(false);
    return Promise.resolve(this);
  }

  function toggleFullscreen() {
    return this.isPresenting() ? this.exitFullscreen() : this.enterFullscreen();
  }

  function isPresenting() {
    return this.mount.classList.contains("ls-presenting") || document.fullscreenElement === this.mount;
  }

  function syncPresentationState(force) {
    const isFullscreen = force ?? document.fullscreenElement === this.mount;
    this.mount.classList.toggle("ls-presenting", Boolean(isFullscreen));
    cancelAnimationFrame(this.scaleFrame);
    this.scaleFrame = requestAnimationFrame(() => this.updateScale());
    return this;
  }

  function setSlideActive(slide, isActive) {
    if (!slide) return;
    slide.hidden = !isActive;
    slide.classList.toggle("is-active", isActive);
  }

  function preloadNearbySlides(slides, index) {
    loadSlideImages(slides[index]);
    loadSlideImages(slides[index - 1]);
    loadSlideImages(slides[index + 1]);
    loadSlideImages(slides[index - 2]);
    loadSlideImages(slides[index + 2]);
  }

  function loadSlideImages(slide) {
    if (!slide) return;
    slide.querySelectorAll("img[data-src]").forEach((image) => {
      const source = image.dataset.src;
      if (!source) return;
      if (image.getAttribute("src") !== source) {
        image.classList.add("is-loading");
        image.addEventListener("load", markImageLoaded, { once: true });
        image.addEventListener("error", markImageLoaded, { once: true });
        image.setAttribute("src", source);
      }
      if (image.complete && image.getAttribute("src") === source) {
        markImageLoaded({ currentTarget: image });
      }
    });
  }

  function markImageLoaded(event) {
    const image = event.currentTarget;
    image.classList.remove("is-loading");
    image.classList.add("is-loaded");
    image.dataset.lsLoaded = "true";
  }

  function normalizeIndex(index, length) {
    const numeric = Number(index);
    if (!Number.isFinite(numeric) || length <= 0) return 0;
    return Math.max(0, Math.min(length - 1, Math.trunc(numeric)));
  }

  function readHashIndex() {
    const match = location.hash.match(/^#\/(\d+)$/);
    if (!match) return 0;
    return Math.max(0, Number(match[1]) - 1);
  }

  window.LarkSlides = {
    themes,
    createDeckSpec,
    createDeck,
    renderDeck,
    mountControls,
    defineTheme,
    applyTheme,
    enterFullscreen(deck) {
      return deck.enterFullscreen();
    },
    exitFullscreen(deck) {
      return deck.exitFullscreen();
    },
    toggleFullscreen(deck) {
      return deck.toggleFullscreen();
    },
    goTo(deck, index) {
      return deck.goTo(index);
    },
    next(deck) {
      return deck.next();
    },
    prev(deck) {
      return deck.prev();
    },
  };
})();
