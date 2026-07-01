(function () {
  "use strict";

  const DEFAULT_SIZE = { width: 1600, height: 900 };
  const themes = {};
  const DEFAULT_TEXT_SAVE_DEBOUNCE_MS = 600;

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

    const listenerOptions = deck.eventListenerOptions || undefined;
    const toolbar = document.createElement("div");
    toolbar.className = "ls-toolbar";
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "Slide controls");

    const prev = button("上一页", "‹", () => deck.prev(), listenerOptions);
    const next = button("下一页", "›", () => deck.next(), listenerOptions);
    const share = button("复制当前页链接", copyLinkIcon(), () => {
      deck.copyCurrentSlideLink().catch((error) => {
        showToolbarMessage(deck, "复制失败", 1600);
        if (deck.options.textSync?.onError) deck.options.textSync.onError(error, deck);
      });
    }, listenerOptions);
    const fullscreen = button("全屏播放", fullscreenIcon(), () => deck.toggleFullscreen(), listenerOptions);

    const status = document.createElement("div");
    status.className = "ls-status";
    status.setAttribute("aria-live", "polite");
    deck.status = status;

    toolbar.append(prev, status, next);
    if (deck.options.share) toolbar.appendChild(share);
    toolbar.appendChild(fullscreen);
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

  function button(label, text, onClick, listenerOptions) {
    const el = document.createElement("button");
    el.className = "ls-button";
    el.type = "button";
    el.setAttribute("aria-label", label);
    el.title = label;
    if (text instanceof Node) el.appendChild(text);
    else el.textContent = text;
    el.addEventListener("click", onClick, listenerOptions);
    return el;
  }

  function iconSvg(children) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ls-button-icon");
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.7");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    children.forEach(([name, attrs]) => {
      const child = document.createElementNS("http://www.w3.org/2000/svg", name);
      Object.entries(attrs).forEach(([key, value]) => child.setAttribute(key, value));
      svg.appendChild(child);
    });
    return svg;
  }

  function copyLinkIcon() {
    return iconSvg([
      ["rect", { x: "7.5", y: "7.5", width: "9", height: "9", rx: "1.8" }],
      ["path", { d: "M4 12.5V5.8C4 4.8 4.8 4 5.8 4h6.7" }],
    ]);
  }

  function fullscreenIcon() {
    return iconSvg([
      ["path", { d: "M7.2 4H4v3.2" }],
      ["path", { d: "M12.8 4H16v3.2" }],
      ["path", { d: "M16 12.8V16h-3.2" }],
      ["path", { d: "M4 12.8V16h3.2" }],
    ]);
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
    annotateEditableText(deck.slides);
    setupTextSync(deck);

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
    const eventController = typeof AbortController !== "undefined" ? new AbortController() : null;
    const eventListenerOptions = eventController ? { signal: eventController.signal } : undefined;

    const deck = {
      mount,
      stage: ensureStructure(mount),
      eventController,
      eventListenerOptions,
      options: {
        controls: options.controls !== false,
        keyboard: options.keyboard !== false,
        hash: options.hash !== false,
        share: options.share !== false,
        textSync: normalizeTextSyncOptions(options.textSync || options.remoteText || options.textStore),
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
      statusMessageTimer: 0,
      wheelLock: 0,
      touchStartY: null,
      textSync: null,
      theme: null,
      updateScale,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen,
      syncPresentationState,
      isPresenting,
      loadRemoteTexts() {
        return loadRemoteTexts(this);
      },
      saveCurrentTexts() {
        return saveCurrentTexts(this);
      },
      getCurrentSlideLink() {
        return currentSlideLink(this);
      },
      copyCurrentSlideLink() {
        return copyCurrentSlideLink(this);
      },
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
        updateSlideStatus(this);
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
        if (this.eventController) {
          this.eventController.abort();
        } else {
          window.removeEventListener("resize", this.onResize);
          window.removeEventListener("hashchange", this.onHashChange);
          window.removeEventListener("keydown", this.onKeydown);
          document.removeEventListener("fullscreenchange", this.onFullscreenChange);
          this.mount.removeEventListener("wheel", this.onWheel);
          this.mount.removeEventListener("touchstart", this.onTouchStart);
          this.mount.removeEventListener("touchend", this.onTouchEnd);
        }
        cancelAnimationFrame(this.scaleFrame);
        clearTimeout(this.statusMessageTimer);
        destroyTextSync(this);
      },
    };

    deck.theme = applyTheme(deck, deck.options.theme);

    deck.onResize = () => {
      cancelAnimationFrame(deck.scaleFrame);
      deck.scaleFrame = requestAnimationFrame(() => deck.updateScale());
    };
    deck.onHashChange = () => deck.goTo(readHashIndex() || 0, { replace: true });
    deck.onFullscreenChange = () => deck.syncPresentationState();
    deck.onWheel = (event) => {
      if (!deck.options.keyboard) return;
      if (event.target?.isContentEditable) return;
      const now = Date.now();
      if (now - deck.wheelLock < 520) return;
      if (Math.abs(event.deltaY) < 28) return;
      deck.wheelLock = now;
      event.preventDefault();
      if (event.deltaY > 0) deck.next();
      else deck.prev();
    };
    deck.onTouchStart = (event) => {
      if (!deck.options.keyboard) return;
      deck.touchStartY = event.touches?.[0]?.clientY ?? null;
    };
    deck.onTouchEnd = (event) => {
      if (!deck.options.keyboard || deck.touchStartY == null) return;
      const endY = event.changedTouches?.[0]?.clientY ?? deck.touchStartY;
      const deltaY = endY - deck.touchStartY;
      deck.touchStartY = null;
      if (Math.abs(deltaY) < 48) return;
      if (deltaY < 0) deck.next();
      else deck.prev();
    };
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

    window.addEventListener("resize", deck.onResize, eventListenerOptions);
    window.addEventListener("hashchange", deck.onHashChange, eventListenerOptions);
    window.addEventListener("keydown", deck.onKeydown, eventListenerOptions);
    document.addEventListener("fullscreenchange", deck.onFullscreenChange, eventListenerOptions);
    mount.addEventListener("wheel", deck.onWheel, eventListenerOptions);
    mount.addEventListener("touchstart", deck.onTouchStart, eventListenerOptions);
    mount.addEventListener("touchend", deck.onTouchEnd, eventListenerOptions);

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

  function normalizeTextSyncOptions(input) {
    if (!input) return null;
    const options = typeof input === "string" ? { loadUrl: input, saveUrl: input } : { ...input };
    if (!options.loadUrl && !options.saveUrl) return null;
    return {
      deckId: options.deckId || options.id || "",
      loadUrl: options.loadUrl || options.url || "",
      saveUrl: options.saveUrl || options.url || "",
      loadMethod: options.loadMethod || "GET",
      saveMethod: options.saveMethod || "POST",
      headers: { ...(options.headers || {}) },
      loadHeaders: { ...(options.loadHeaders || {}) },
      saveHeaders: { ...(options.saveHeaders || {}) },
      credentials: options.credentials,
      saveDebounceMs: Number.isFinite(Number(options.saveDebounceMs))
        ? Number(options.saveDebounceMs)
        : DEFAULT_TEXT_SAVE_DEBOUNCE_MS,
      saveAll: options.saveAll !== false,
      editable: options.editable !== false,
      onLoad: options.onLoad,
      onSave: options.onSave,
      onError: options.onError,
    };
  }

  function setupTextSync(deck) {
    destroyTextSync(deck);
    const options = deck.options.textSync;
    if (!options) return null;

    const nodes = editableTextNodes(deck);
    const state = {
      options,
      nodes,
      values: {},
      timers: new Map(),
      pending: new Map(),
      saving: new Set(),
      loaded: false,
    };
    deck.textSync = state;

    nodes.forEach((node) => {
      if (options.editable && node.hasAttribute("data-editable-text") && node.getAttribute("contenteditable") !== "true") {
        node.setAttribute("contenteditable", "true");
      }
      node.dataset.larkTextSync = "true";
      node.__larkTextInputHandler = () => scheduleTextSave(deck, node);
      node.__larkTextBlurHandler = () => flushTextSave(deck, node);
      node.addEventListener("input", node.__larkTextInputHandler);
      node.addEventListener("blur", node.__larkTextBlurHandler);
    });

    if (options.loadUrl) {
      loadRemoteTexts(deck).catch((error) => handleTextSyncError(deck, error));
    }
    return state;
  }

  function destroyTextSync(deck) {
    const state = deck.textSync;
    if (!state) return;
    state.timers?.forEach((timer) => clearTimeout(timer));
    state.nodes?.forEach((node) => {
      if (node.__larkTextInputHandler) {
        node.removeEventListener("input", node.__larkTextInputHandler);
        delete node.__larkTextInputHandler;
      }
      if (node.__larkTextBlurHandler) {
        node.removeEventListener("blur", node.__larkTextBlurHandler);
        delete node.__larkTextBlurHandler;
      }
    });
    deck.textSync = null;
  }

  function editableTextNodes(deck) {
    const root = deck?.stage || document;
    return Array.from(root.querySelectorAll("[data-text-id]")).filter((node) =>
      node.matches?.('[contenteditable="true"], [data-editable-text], [data-text-id]')
    );
  }

  async function loadRemoteTexts(deck) {
    const options = deck.options.textSync;
    if (!options?.loadUrl) return {};
    const payload = await requestJson(options.loadUrl, {
      method: options.loadMethod,
      headers: mergeHeaders(options.headers, options.loadHeaders),
      credentials: options.credentials,
    });
    const values = normalizeTextPayload(payload);
    applyRemoteTexts(deck, values);
    if (deck.textSync) {
      deck.textSync.values = values;
      deck.textSync.loaded = true;
    }
    if (typeof options.onLoad === "function") options.onLoad(values, deck);
    return values;
  }

  function applyRemoteTexts(deck, values) {
    const nodes = editableTextNodes(deck);
    nodes.forEach((node) => {
      const id = node.dataset.textId;
      if (!id || !Object.prototype.hasOwnProperty.call(values, id)) return;
      applyTextValue(node, values[id]);
      node.dataset.larkTextRemote = "true";
    });
  }

  function normalizeTextPayload(payload) {
    const source = payload?.texts || payload?.items || payload?.data || payload || {};
    const result = {};
    if (Array.isArray(source)) {
      source.forEach((item) => {
        const id = item?.id || item?.textId || item?.key;
        if (id) result[id] = normalizeTextValue(item);
      });
      return result;
    }
    Object.entries(source).forEach(([id, value]) => {
      if (value == null) return;
      result[id] = normalizeTextValue(value);
    });
    return result;
  }

  function normalizeTextValue(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (value.html != null) return { html: String(value.html) };
      if (value.text != null) return { text: String(value.text) };
      if (value.value != null) return { text: String(value.value) };
    }
    return { text: String(value) };
  }

  function applyTextValue(node, value) {
    const normalized = normalizeTextValue(value);
    if (normalized.html != null) {
      node.innerHTML = normalized.html;
      return;
    }
    node.innerHTML = escapeHtml(normalized.text).replace(/\n/g, "<br>");
  }

  function scheduleTextSave(deck, node) {
    const state = deck.textSync;
    const options = state?.options;
    if (!state || !options?.saveUrl) return;
    const id = node.dataset.textId;
    if (!id) return;
    if (state.timers.has(id)) clearTimeout(state.timers.get(id));
    const timer = setTimeout(() => {
      state.timers.delete(id);
      saveTextNode(deck, node).catch((error) => handleTextSyncError(deck, error));
    }, Math.max(0, options.saveDebounceMs));
    state.timers.set(id, timer);
  }

  function flushTextSave(deck, node) {
    const state = deck.textSync;
    const id = node?.dataset?.textId;
    if (!state || !id || !state.timers.has(id)) return;
    clearTimeout(state.timers.get(id));
    state.timers.delete(id);
    saveTextNode(deck, node).catch((error) => handleTextSyncError(deck, error));
  }

  async function saveTextNode(deck, node) {
    const state = deck.textSync;
    const options = state?.options;
    if (!state || !options?.saveUrl) return null;
    const entry = serializeTextNode(node, deck);
    state.pending.set(entry.id, entry);
    state.saving.add(entry.id);
    node.dataset.larkTextSaving = "true";

    const payload = {
      deckId: options.deckId || deck.options.metadata?.id || deck.options.metadata?.title || "",
      activeSlide: deck.index + 1,
      changed: entry,
      texts: options.saveAll ? collectDeckTexts(deck) : undefined,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await requestJson(options.saveUrl, {
        method: options.saveMethod,
        headers: mergeHeaders(options.headers, options.saveHeaders, { "Content-Type": "application/json" }),
        credentials: options.credentials,
        body: JSON.stringify(payload),
      });

      state.saving.delete(entry.id);
      state.pending.delete(entry.id);
      node.dataset.larkTextSaving = "false";
      node.dataset.larkTextSavedAt = payload.updatedAt;
      state.values[entry.id] = { html: entry.html, text: entry.text };
      if (typeof options.onSave === "function") options.onSave({ entry, payload, response }, deck);
      showToolbarMessage(deck, "已保存", 900);
      return response;
    } catch (error) {
      state.saving.delete(entry.id);
      node.dataset.larkTextSaving = "error";
      throw error;
    }
  }

  function saveCurrentTexts(deck) {
    const state = deck.textSync;
    if (!state?.options?.saveUrl) return Promise.resolve(null);
    const options = state.options;
    const payload = {
      deckId: options.deckId || deck.options.metadata?.id || deck.options.metadata?.title || "",
      activeSlide: deck.index + 1,
      changed: null,
      texts: collectDeckTexts(deck),
      updatedAt: new Date().toISOString(),
    };
    return requestJson(options.saveUrl, {
      method: options.saveMethod,
      headers: mergeHeaders(options.headers, options.saveHeaders, { "Content-Type": "application/json" }),
      credentials: options.credentials,
      body: JSON.stringify(payload),
    }).then((response) => {
      showToolbarMessage(deck, "已保存", 900);
      if (typeof options.onSave === "function") options.onSave({ entry: null, payload, response }, deck);
      return response;
    });
  }

  function serializeTextNode(node, deck) {
    const slide = node.closest(".ls-slide");
    return {
      id: node.dataset.textId,
      text: textFromNode(node),
      html: node.innerHTML,
      slide: slide?.dataset.index ? Number(slide.dataset.index) : deck.index + 1,
      slideId: slide?.id || "",
      slideTitle: slide?.dataset.title || "",
    };
  }

  function collectDeckTexts(deck) {
    return editableTextNodes(deck).reduce((acc, node) => {
      const item = serializeTextNode(node, deck);
      acc[item.id] = {
        text: item.text,
        html: item.html,
        slide: item.slide,
        slideId: item.slideId,
        slideTitle: item.slideTitle,
      };
      return acc;
    }, {});
  }

  function textFromNode(node) {
    if (typeof node.innerText === "string") return node.innerText.replace(/\u00a0/g, " ");
    return String(node.textContent || "").replace(/\u00a0/g, " ");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function requestJson(url, options = {}) {
    if (typeof fetch !== "function") {
      throw new Error("LarkSlides: fetch is required for textSync");
    }
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`LarkSlides: textSync request failed ${response.status}`);
    if (response.status === 204) return {};
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }

  function mergeHeaders(...headersList) {
    return headersList.reduce((acc, headers) => {
      Object.entries(headers || {}).forEach(([key, value]) => {
        if (value != null) acc[key] = value;
      });
      return acc;
    }, {});
  }

  function handleTextSyncError(deck, error) {
    showToolbarMessage(deck, "保存异常", 1400);
    if (typeof deck.options.textSync?.onError === "function") {
      deck.options.textSync.onError(error, deck);
      return;
    }
    console.warn(error);
  }

  function updateSlideStatus(deck) {
    if (!deck.status) return;
    deck.status.textContent = `${deck.index + 1} / ${deck.slides.length}`;
  }

  function showToolbarMessage(deck, message, duration = 1200) {
    if (!deck.status) return;
    clearTimeout(deck.statusMessageTimer);
    deck.status.textContent = message;
    deck.statusMessageTimer = setTimeout(() => updateSlideStatus(deck), duration);
  }

  function currentSlideLink(deck) {
    const page = normalizeIndex(deck.index, deck.slides.length) + 1;
    if (typeof URL !== "undefined") {
      const url = new URL(location.href);
      url.hash = `/${page}`;
      return url.toString();
    }
    return `${location.href.replace(/#.*$/, "")}#/${page}`;
  }

  function copyCurrentSlideLink(deck) {
    const link = currentSlideLink(deck);
    return copyText(link).then(() => {
      showToolbarMessage(deck, "已复制", 900);
      return link;
    });
  }

  function copyText(text) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    return Promise.resolve();
  }

  function annotateEditableText(slides) {
    const slideList = Array.from(slides || document.querySelectorAll(".ls-slide"));
    let count = 0;
    slideList.forEach((slide, index) => {
      const slideId = `slide-${String(index + 1).padStart(2, "0")}`;
      const used = new Set(
        Array.from(slide.querySelectorAll("[data-text-id]")).map((node) => node.dataset.textId)
      );
      const counters = {};
      const editables = Array.from(slide.querySelectorAll('[contenteditable="true"], [data-editable-text]'));
      editables.forEach((node) => {
        if (node.dataset.textId) return;
        const base = editableTextBase(node);
        counters[base] = (counters[base] || 0) + 1;
        let field = counters[base] === 1 ? base : `${base}-${String(counters[base]).padStart(2, "0")}`;
        let textId = `${slideId}.${field}`;
        while (used.has(textId)) {
          counters[base] += 1;
          field = `${base}-${String(counters[base]).padStart(2, "0")}`;
          textId = `${slideId}.${field}`;
        }
        node.dataset.textId = textId;
        node.dataset.larkTextAutogen = "true";
        used.add(textId);
        count += 1;
      });
    });
    return count;
  }

  function editableTextBase(node) {
    const className = Array.from(node.classList || []).find((name) => !/^ls-/.test(name) && !/^lvg-layout-block$/.test(name));
    const base = className || node.tagName?.toLowerCase() || "text";
    return base
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "text";
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
    annotateEditableText,
    normalizeTextPayload,
    collectDeckTexts,
    loadRemoteTexts,
    saveCurrentTexts,
    currentSlideLink,
    copyCurrentSlideLink,
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
