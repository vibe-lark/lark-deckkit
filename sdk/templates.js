(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderList(items = [], renderItem) {
    return items.map(renderItem).join("");
  }

  function renderIf(value, renderValue) {
    return value ? renderValue(value) : "";
  }

  function imageTag(src, className = "", attrs = "") {
    const classAttr = className ? ` class="${escapeHtml(className)}"` : "";
    const extraAttrs = attrs ? ` ${attrs}` : "";
    return `<img${classAttr} data-src="${escapeHtml(src)}" alt="" decoding="async"${extraAttrs}>`;
  }

  const tokens = {
    canvas: { width: 1600, height: 900 },
    colors: {
      black: "#000000",
      white: "#ffffff",
      gray: "#858b96",
      lightBlue: "#ceeafe",
      cyan: "#3ec3f7",
      deepBlue: "#1456f0",
    },
    gradients: {
      brand: "linear-gradient(90deg, #e2fff7 0%, #c8effa 43%, #b1d5f6 62%, #80a3ff 100%)",
      soft: "linear-gradient(90deg, #ffffff 0%, #e2fff7 38%, #b1d5f6 68%, #80a3ff 100%)",
      gray: "linear-gradient(90deg, #e6e8ee 0%, #b5bac4 52%, #858b96 100%)",
      whiteGray: "linear-gradient(90deg, #f7f9ff 0%, #d9dee8 48%, #9ea8b8 100%)",
      deepBlue: "linear-gradient(90deg, #3ec3f7 0%, #1456f0 100%)",
    },
    fonts: {
      display: "var(--ld-font-display, \"TikTok Display\", \"FZLanTingHeiPro_GB18030\", \"PingFang SC\", \"Microsoft YaHei\", Arial, sans-serif)",
      zh: "var(--ld-font-zh, \"FZLanTingHeiPro_GB18030\", \"PingFang SC\", \"Microsoft YaHei\", Arial, sans-serif)",
      ui: "var(--ld-font-ui, \"Inter\", \"FZLanTingHeiPro_GB18030\", \"PingFang SC\", \"Microsoft YaHei\", Arial, sans-serif)",
      en: "\"TikTok Display\", \"Inter\", Arial, sans-serif",
    },
  };

  const templateRegistry = {};
  const templateContracts = {};

  const qualityRules = {
    canvas: { width: 1600, height: 900 },
    typography: {
      heroClaim: { min: 76, max: 92, weight: "740-760", lineHeight: "1.05-1.10" },
      sectionClaim: { min: 58, max: 68, weight: "700-760", lineHeight: "1.08-1.15" },
      subtitle: { min: 28, max: 40, weight: "400-600", lineHeight: "1.35-1.45" },
      body: { min: 20, max: 28, weight: "400-600", lineHeight: "1.35-1.55" },
      micro: { min: 12, max: 18, weight: "400-500", lineHeight: "1.30-1.50" },
    },
    defaults: {
      maxTitleChars: 34,
      maxSubtitleChars: 96,
      maxBodyChars: 220,
      maxItems: 6,
      maxBlocks: 96,
    },
  };

  const designGuidance = {
    name: "front-design keynote loop",
    intent: "Generate fewer, stronger, presentation-ready HTML slides before doing precision layout.",
    workflow: [
      "Compress the narrative before choosing a template.",
      "Map each slide to one job: statement, todo, caseFlow, metric, or precision visualLayout.",
      "Keep one dominant focal point per slide; supporting text should be short and visibly secondary.",
      "Use the 1600x900 typography scale instead of web UI defaults.",
      "Preview screenshots and fix alignment, density, and hierarchy before publishing.",
    ],
    layout: [
      "Prefer large centered claims, restrained dividers, and generous negative space.",
      "Avoid nested cards, decorative card grids, and repeated equal-weight boxes.",
      "Use columns only when comparison or process flow is the actual message.",
      "Keep tags rectangular and precise; do not use overly round pill shapes unless the source deck does.",
    ],
    typography: [
      "Hero claim: 76-92px on the 1600x900 canvas.",
      "Section claim: 58-68px.",
      "Subtitle: 28-40px.",
      "Body and labels: 20-28px, except metadata labels can use 12-18px.",
    ],
    antiPatterns: [
      "Starting from HTML/CSS layout before the page story is clear.",
      "Filling a slide with many cards because the content has many bullets.",
      "Using web-dashboard density for a fullscreen presentation.",
      "Adding glow, shine, or gradients when they do not clarify hierarchy.",
    ],
    verification: [
      "Run validateDeckSpec for structure and density.",
      "Run scripts/validate_deck.js for HTML entrypoint checks.",
      "Use browser screenshots to inspect alignment, clipping, and perceived type size.",
    ],
  };

  function normalizeContract(contract = {}) {
    return {
      intent: contract.intent || "",
      slots: { ...(contract.slots || {}) },
      limits: { ...(contract.limits || {}) },
      guidance: Array.from(contract.guidance || []),
    };
  }

  function defineTemplate(name, renderer, contract = {}) {
    if (!name || typeof name !== "string") throw new Error("LarkSlideTemplates: template name is required");
    if (typeof renderer !== "function") throw new Error(`LarkSlideTemplates: ${name} must be a function`);
    templateRegistry[name] = renderer;
    templateContracts[name] = normalizeContract(contract);
    return renderer;
  }

  function normalizeTemplateName(name = "") {
    return String(name).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  }

  function resolveTemplateName(name = "") {
    const value = String(name || "");
    if (templateRegistry[value] || templateContracts[value]) return value;
    const normalized = normalizeTemplateName(value);
    if (templateRegistry[normalized] || templateContracts[normalized]) return normalized;
    return value;
  }

  function create(name, props = {}) {
    const renderer = typeof name === "function" ? name : templateRegistry[name];
    if (!renderer) throw new Error(`LarkSlideTemplates: unknown template ${name}`);
    return renderer(props);
  }

  function templateNames() {
    return Object.keys(templateRegistry);
  }

  function getTemplateContract(name) {
    const resolved = resolveTemplateName(name);
    return templateContracts[resolved]
      ? {
          ...templateContracts[resolved],
          slots: { ...templateContracts[resolved].slots },
          limits: { ...templateContracts[resolved].limits },
          guidance: Array.from(templateContracts[resolved].guidance || []),
        }
      : null;
  }

  function getDesignGuidance() {
    return {
      ...designGuidance,
      workflow: Array.from(designGuidance.workflow),
      layout: Array.from(designGuidance.layout),
      typography: Array.from(designGuidance.typography),
      antiPatterns: Array.from(designGuidance.antiPatterns),
      verification: Array.from(designGuidance.verification),
    };
  }

  function plainText(value = "") {
    return String(value ?? "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function textLength(value = "") {
    return plainText(value).length;
  }

  function addIssue(list, level, code, message, details = {}) {
    list.push({ level, code, message, ...details });
  }

  function validateDeckSpec(spec = {}, options = {}) {
    const issues = [];
    const rules = { ...qualityRules.defaults, ...(options.rules || {}) };
    const slides = Array.isArray(spec.slides) ? spec.slides : [];
    const size = spec.size || qualityRules.canvas;

    if (!spec.title) addIssue(issues, "warning", "deck-title-missing", "Deck title is missing.");
    if (!slides.length) addIssue(issues, "error", "slides-empty", "Deck has no slides.");
    if (size.width !== qualityRules.canvas.width || size.height !== qualityRules.canvas.height) {
      addIssue(issues, "warning", "canvas-size", "DeckKit is tuned for 1600x900 slides.", { size });
    }

    slides.forEach((slide, index) => {
      const label = `slide ${index + 1}`;
      const resolvedTemplate = slide.template ? resolveTemplateName(slide.template) : "";
      const contract = resolvedTemplate ? templateContracts[resolvedTemplate] : null;
      const limits = { ...rules, ...(contract?.limits || {}) };
      const titleLength = textLength(slide.title || "");
      const contentLength = textLength(slide.content || "");

      if (!slide.title) addIssue(issues, "warning", "slide-title-missing", `${label} has no title.`, { index });
      if (slide.template && !templateRegistry[resolvedTemplate]) {
        addIssue(issues, "warning", "template-unknown", `${label} uses an unknown template "${slide.template}".`, { index, template: slide.template });
      }
      if (titleLength > limits.maxTitleChars) {
        addIssue(issues, "warning", "title-density", `${label} title is long; split or shorten for keynote-quality layout.`, { index, length: titleLength, max: limits.maxTitleChars });
      }
      if (contentLength > limits.maxBodyChars) {
        addIssue(issues, "warning", "content-density", `${label} has dense text; use a higher-level template or split into multiple slides.`, { index, length: contentLength, max: limits.maxBodyChars });
      }
      if (slide.template === "visual-layout") {
        const blockCount = (slide.content || "").match(/lvg-layout-block/g)?.length || 0;
        if (blockCount > limits.maxBlocks) {
          addIssue(issues, "warning", "block-density", `${label} has many absolute blocks; prefer a stable pattern template for new decks.`, { index, blockCount, max: limits.maxBlocks });
        }
      }
    });

    return {
      ok: !issues.some((issue) => issue.level === "error"),
      issueCount: issues.length,
      errors: issues.filter((issue) => issue.level === "error").length,
      warnings: issues.filter((issue) => issue.level === "warning").length,
      issues,
    };
  }

  function asset(basePath = "") {
    const prefix = String(basePath || "").replace(/\/+$/, "");
    return (name) => {
      const value = String(name || "");
      if (!value) return "";
      if (/^(?:https?:\/\/|data:|blob:|\/)/.test(value)) return value;
      const path = value.replace(/^\/+/, "");
      return prefix ? `${prefix}/${path}` : path;
    };
  }

  function deckSpec({
    title = "",
    description = "",
    theme = "larkVisual",
    slides = [],
    assets = {},
    meta = {},
  } = {}) {
    const createDeckSpec = window.LarkSlides?.createDeckSpec;
    if (createDeckSpec) return createDeckSpec({ title, description, theme, slides, assets, meta });
    return { title, description, theme, slides: Array.from(slides), assets: { ...assets }, meta: { ...meta } };
  }

  function geometryStyle({ x, y, w, h, style = "" } = {}) {
    const parts = ["position:absolute;"];
    if (x != null) parts.push(`left:${Number(x).toFixed(3)}px;`);
    if (y != null) parts.push(`top:${Number(y).toFixed(3)}px;`);
    if (w != null) parts.push(`width:${Number(w).toFixed(3)}px;`);
    if (h != null) parts.push(`height:${Number(h).toFixed(3)}px;`);
    if (style) parts.push(style);
    return parts.join("");
  }

  function gradientClass(gradient) {
    if (!gradient) return "";
    const variants = {
      brand: "brand",
      soft: "soft",
      gray: "gray",
      whiteGray: "white-gray",
      deepBlue: "deep-blue",
    };
    return `lvg-gradient-text ${variants[gradient] || escapeHtml(gradient)}`;
  }

  function gradientText(text, gradient = "brand", className = "") {
    const classes = [gradientClass(gradient), className].filter(Boolean).join(" ");
    return `<span class="${classes}">${escapeHtml(text)}</span>`;
  }

  function textBlock({
    x,
    y,
    w,
    h,
    text = "",
    html,
    className = "",
    style = "",
    align = "left",
    size = 48,
    color = tokens.colors.white,
    weight = 700,
    lineHeight = 1.15,
    gradient = "",
  } = {}) {
    const blockStyleValue = geometryStyle({ x, y, w, h, style: `background:transparent;${style}` });
    const spanClass = gradient ? ` class="${gradientClass(gradient)}"` : "";
    const spanStyles = [
      `font-size:${Number(size).toFixed(3)}px;`,
      `font-weight:${escapeHtml(weight)};`,
      gradient ? "" : `color:${escapeHtml(color)};`,
    ].join("");
    const spanStyle = ` style="${spanStyles}"`;
    const body =
      html != null
        ? html
        : `<p style="text-align:${escapeHtml(align)};line-height:${escapeHtml(lineHeight)};"><span${spanClass}${spanStyle}>${escapeHtml(text)}</span></p>`;
    return { kind: "text", className, style: blockStyleValue, html: body };
  }

  function imageBlock({
    src,
    x = 0,
    y = 0,
    w = tokens.canvas.width,
    h = tokens.canvas.height,
    fit = "cover",
    className = "",
    style = "",
    innerStyle,
  } = {}) {
    return {
      kind: "image",
      className,
      src,
      style: geometryStyle({ x, y, w, h, style }),
      innerStyle: innerStyle || `left:0;top:0;width:100%;height:100%;object-fit:${escapeHtml(fit)};`,
    };
  }

  function shapeBlock({
    x,
    y,
    w,
    h,
    fill = "transparent",
    radius,
    border,
    opacity,
    className = "",
    style = "",
  } = {}) {
    const shapeStyle = [
      `background:${fill};`,
      radius ? `border-radius:${escapeHtml(radius)};` : "",
      border ? `border:${border};` : "",
      opacity != null ? `opacity:${Number(opacity).toFixed(3)};` : "",
      style,
    ].join("");
    return { kind: "shape", className, style: geometryStyle({ x, y, w, h, style: shapeStyle }) };
  }

  function vectorBlock({ html = "", x, y, w, h, className = "", style = "" } = {}) {
    return { kind: "vector", className, html, style: geometryStyle({ x, y, w, h, style }) };
  }

  function layoutGrid({ x = 120, y = 0, w = 1360, columns = 3, gap = 32 } = {}) {
    const safeColumns = Math.max(1, Number(columns) || 1);
    const safeGap = Number(gap) || 0;
    const colW = (Number(w) - safeGap * (safeColumns - 1)) / safeColumns;
    return {
      x: Number(x),
      y: Number(y),
      w: Number(w),
      columns: safeColumns,
      gap: safeGap,
      colW,
      col(index = 0, span = 1) {
        const safeSpan = Math.max(1, Number(span) || 1);
        return {
          x: Number(x) + Number(index) * (colW + safeGap),
          y: Number(y),
          w: colW * safeSpan + safeGap * (safeSpan - 1),
        };
      },
    };
  }

  function paragraphList(items = []) {
    return renderList(items, (item) => `<p class="ls-template-label">${escapeHtml(item)}</p>`);
  }

  function cover({ title, subtitle, kicker } = {}) {
    return {
      title,
      className: "ls-template",
      content: `
        <div class="ls-template-slide" style="display:flex;flex-direction:column;justify-content:center;">
          ${renderIf(kicker, (text) => `<p class="ls-template-kicker">${escapeHtml(text)}</p>`)}
          <h1 class="ls-template-title">${escapeHtml(title)}</h1>
          ${renderIf(subtitle, (text) => `<p class="ls-template-subtitle">${escapeHtml(text)}</p>`)}
        </div>
      `,
    };
  }

  function section({ title, subtitle, index } = {}) {
    return {
      title,
      className: "ls-template",
      content: `
        <div class="ls-template-slide" style="display:grid;grid-template-columns:240px 1fr;align-items:center;">
          <div class="ls-template-metric">${escapeHtml(index ?? "")}</div>
          <div>
            <h1 class="ls-template-title">${escapeHtml(title)}</h1>
            ${renderIf(subtitle, (text) => `<p class="ls-template-subtitle">${escapeHtml(text)}</p>`)}
          </div>
        </div>
      `,
    };
  }

  function imageHero({ title, subtitle, image, align = "left" } = {}) {
    const textAlign = align === "right" ? "right" : "left";
    const gradient =
      align === "right"
        ? "linear-gradient(90deg, rgba(0,0,0,0.05), rgba(0,0,0,0.74))"
        : "linear-gradient(90deg, rgba(0,0,0,0.74), rgba(0,0,0,0.05))";
    return {
      title,
      className: "ls-template",
      content: `
        <div class="ls-template-slide" style="padding:0;position:relative;color:#fff;background:#111;">
          ${imageTag(image, "", 'style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"')}
          <div style="position:absolute;inset:0;background:${gradient};"></div>
          <div style="position:relative;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:${textAlign === "right" ? "flex-end" : "flex-start"};padding:96px 112px;text-align:${textAlign};box-sizing:border-box;">
            <h1 class="ls-template-title" style="max-width:900px;color:#fff;">${escapeHtml(title)}</h1>
            ${renderIf(subtitle, (text) => `<p class="ls-template-subtitle" style="color:rgba(255,255,255,0.82);">${escapeHtml(text)}</p>`)}
          </div>
        </div>
      `,
    };
  }

  function metric({ title, metrics = [] } = {}) {
    return {
      title,
      className: "ls-template",
      content: `
        <div class="ls-template-slide">
          <h1 class="ls-template-title" style="font-size:58px;">${escapeHtml(title)}</h1>
          <div class="ls-template-grid" style="grid-template-columns:repeat(${Math.max(metrics.length, 1)},1fr);margin-top:72px;">
            ${renderList(
              metrics,
              (item) => `
                  <div class="ls-template-card">
                    <div class="ls-template-metric">${escapeHtml(item.value)}</div>
                    <div class="ls-template-label">${escapeHtml(item.label)}</div>
                  </div>
                `
            )}
          </div>
        </div>
      `,
    };
  }

  function twoColumn({ title, left = [], right = [] } = {}) {
    return {
      title,
      className: "ls-template",
      content: `
        <div class="ls-template-slide">
          <h1 class="ls-template-title" style="font-size:58px;">${escapeHtml(title)}</h1>
          <div class="ls-template-grid" style="grid-template-columns:1fr 1fr;margin-top:56px;">
            <div class="ls-template-card">${paragraphList(left)}</div>
            <div class="ls-template-card">${paragraphList(right)}</div>
          </div>
        </div>
      `,
    };
  }

  function editable(value, className = "", tag = "span") {
    return `<${tag}${className ? ` class="${className}"` : ""} contenteditable="true">${escapeHtml(value)}</${tag}>`;
  }

  function richText(parts = []) {
    return parts
      .map((part) => {
        if (typeof part === "string") return escapeHtml(part);
        const className = part.className ? ` class="${escapeHtml(part.className)}"` : "";
        return `<span${className}>${escapeHtml(part.text)}</span>`;
      })
      .join("");
  }

  function visualSlide({ title, template, sourceSlide, content, className = "" }) {
    return {
      title,
      template,
      sourceSlide,
      className: `ls-visual ${className}`.trim(),
      content,
    };
  }

  function blockStyle(block = {}) {
    if (block.style) return block.style;
    const parts = ["position:absolute;"];
    if (block.x != null) parts.push(`left:${Number(block.x).toFixed(3)}px;`);
    if (block.y != null) parts.push(`top:${Number(block.y).toFixed(3)}px;`);
    if (block.w != null) parts.push(`width:${Number(block.w).toFixed(3)}px;`);
    if (block.h != null) parts.push(`height:${Number(block.h).toFixed(3)}px;`);
    if (block.opacity != null) parts.push(`opacity:${Number(block.opacity).toFixed(3)};`);
    if (block.fill) parts.push(`background:${block.fill};`);
    if (block.color) parts.push(`color:${block.color};`);
    if (block.size) parts.push(`font-size:${Number(block.size).toFixed(3)}px;`);
    if (block.weight) parts.push(`font-weight:${escapeHtml(block.weight)};`);
    if (block.align) parts.push(`text-align:${escapeHtml(block.align)};`);
    if (block.lineHeight) parts.push(`line-height:${escapeHtml(block.lineHeight)};`);
    if (block.radius) parts.push(`border-radius:${escapeHtml(block.radius)};`);
    if (block.border) parts.push(`border:${block.border};`);
    return parts.join("");
  }

  function visualLayoutBlock(block = {}) {
    const className = block.className ? ` ${escapeHtml(block.className)}` : "";
    const style = escapeHtml(blockStyle(block));
    if (block.kind === "image") {
      const innerStyle = block.innerStyle ? escapeHtml(block.innerStyle) : "left:0;top:0;width:100%;height:100%;";
      return `
        <div class="lvg-layout-block lvg-layout-image${className}" style="${style}">
          <img data-src="${escapeHtml(block.src)}" alt="" decoding="async" style="${innerStyle}">
        </div>
      `;
    }
    if (block.kind === "shape") {
      return `<div class="lvg-layout-block lvg-layout-shape${className}" style="${style}"></div>`;
    }
    if (block.kind === "vector" || block.kind === "raw") {
      return `<div class="lvg-layout-block lvg-layout-vector${className}" style="${style}">${block.html || ""}</div>`;
    }
    if (block.kind === "text") {
      const body = block.html != null ? block.html : escapeHtml(block.text || "");
      return `<div class="lvg-layout-block lvg-layout-text${className}" contenteditable="true" style="${style}">${body}</div>`;
    }
    return "";
  }

  function visualLayout({ title, sourceSlide, blocks = [], className = "" } = {}) {
    return visualSlide({
      title,
      template: "visual-layout",
      sourceSlide,
      className: `lvg-layout-slide ${className}`.trim(),
      content: `
          <div class="lvg-slide lvg-layout">
          ${renderList(blocks, visualLayoutBlock)}
        </div>
      `,
    });
  }

  function visualBackgroundBlocks() {
    return [
      shapeBlock({ x: 0, y: 0, w: 1600, h: 900, fill: "#03050a" }),
      shapeBlock({
        x: 0,
        y: 0,
        w: 1600,
        h: 900,
        fill: "radial-gradient(circle at 50% -10%, rgba(128,163,255,0.26), rgba(3,5,10,0) 44%), radial-gradient(circle at 18% 18%, rgba(62,195,247,0.08), rgba(3,5,10,0) 34%)",
      }),
    ];
  }

  function quickText({ x, y, w, h, text, size = 34, weight = 620, color = tokens.colors.white, align = "left", gradient = "", lineHeight = 1.2, className = "", style = "" }) {
    return textBlock({ x, y, w, h, text, size, weight, color, align, gradient, lineHeight, className, style });
  }

  function visualStatement({ title, subtitle, kicker = "", sourceSlide } = {}) {
    return visualLayout({
      title,
      sourceSlide,
      className: "lvg-quick-slide lvg-quick-apple lvg-quick-statement",
      blocks: [
        ...visualBackgroundBlocks(),
        quickText({ x: 0, y: 174, w: 1600, h: 28, text: kicker, size: 19, weight: 640, align: "center", color: "#7b8494", className: "lvg-quick-copy" }),
        quickText({ x: 180, y: 268, w: 1240, h: 126, text: title, size: 76, weight: 760, align: "center", gradient: "brand", lineHeight: 1.05, className: "lvg-quick-heading" }),
        quickText({ x: 360, y: 456, w: 880, h: 86, text: subtitle, size: 29, weight: 500, align: "center", color: "#b9c2d1", lineHeight: 1.36, className: "lvg-quick-copy" }),
        shapeBlock({ x: 610, y: 604, w: 380, h: 2, fill: tokens.gradients.deepBlue, radius: "999px", opacity: 0.82 }),
      ],
    });
  }

  function visualTodoList({ title, subtitle = "", items = [], sourceSlide } = {}) {
    const visibleItems = Array.from(items).slice(0, 5);
    const blocks = [
      ...visualBackgroundBlocks(),
      quickText({ x: 240, y: 106, w: 1120, h: 74, text: title, size: 60, weight: 760, align: "center", gradient: "brand", className: "lvg-quick-heading" }),
      quickText({ x: 330, y: 196, w: 940, h: 42, text: subtitle, size: 28, weight: 500, align: "center", color: "#aeb7c7", lineHeight: 1.36, className: "lvg-quick-copy" }),
    ];
    if (visibleItems.length <= 5) {
      const grid = layoutGrid({ x: 216, y: 348, w: 1168, columns: visibleItems.length, gap: 56 });
      blocks.push(shapeBlock({ x: 240, y: 306, w: 1120, h: 1, fill: "linear-gradient(90deg, rgba(206,234,254,0), rgba(206,234,254,0.30), rgba(206,234,254,0))", radius: "999px" }));
      visibleItems.forEach((item, index) => {
        const col = grid.col(index);
        const label = item.label || `Step ${index + 1}`;
        const heading = item.title || item.heading || "";
        const body = item.body || item.text || "";
        blocks.push(quickText({ x: col.x, y: grid.y, w: col.w, h: 44, text: String(index + 1).padStart(2, "0"), size: 40, weight: 720, align: "center", gradient: "deepBlue", className: "lvg-quick-heading" }));
        blocks.push(quickText({ x: col.x, y: grid.y + 82, w: col.w, h: 22, text: label, size: 17, weight: 650, align: "center", color: "#7f8aa0", className: "lvg-quick-copy" }));
        blocks.push(quickText({ x: col.x, y: grid.y + 116, w: col.w, h: 34, text: heading, size: 28, weight: 740, align: "center", gradient: "brand", className: "lvg-quick-heading" }));
        blocks.push(quickText({ x: col.x - 4, y: grid.y + 178, w: col.w + 8, h: 102, text: body, size: 21, weight: 500, align: "center", color: "#aeb7c7", lineHeight: 1.34, className: "lvg-quick-copy" }));
        if (index < visibleItems.length - 1) {
          blocks.push(shapeBlock({ x: col.x + col.w + 28, y: grid.y + 94, w: 1, h: 132, fill: "rgba(206,234,254,0.14)" }));
        }
      });
      return visualLayout({ title, sourceSlide, className: "lvg-quick-slide lvg-quick-apple lvg-quick-todo", blocks });
    }
    const rowH = 88;
    const startY = 286;
    blocks.push(shapeBlock({ x: 238, y: 250, w: 1124, h: Math.max(visibleItems.length * rowH + 64, 300), fill: "rgba(255,255,255,0.035)", radius: "8px", border: "1.2px solid rgba(62,195,247,0.34)" }));
    visibleItems.forEach((item, index) => {
      const y = startY + index * rowH;
      const label = item.label || `Step ${index + 1}`;
      const heading = item.title || item.heading || "";
      const body = item.body || item.text || "";
      const chips = Array.from(item.chips || []).slice(0, 3);
      blocks.push(shapeBlock({ x: 292, y, w: 1016, h: rowH - 14, fill: "rgba(3,10,23,0.62)", radius: "8px", border: "1.1px solid rgba(62,195,247,0.22)" }));
      blocks.push(shapeBlock({ x: 318, y: y + 27, w: 30, h: 30, fill: "rgba(62,195,247,0.12)", radius: "6px", border: "1.2px solid rgba(62,195,247,0.62)" }));
      blocks.push(quickText({ x: 318, y: y + 29, w: 30, h: 26, text: "✓", size: 21, weight: 760, align: "center", gradient: "deepBlue" }));
      blocks.push(quickText({ x: 374, y: y + 18, w: 148, h: 26, text: label, size: 19, weight: 720, gradient: "deepBlue", className: "lvg-quick-copy" }));
      blocks.push(quickText({ x: 374, y: y + 47, w: 230, h: 32, text: heading, size: 27, weight: 740, gradient: "brand", className: "lvg-quick-heading" }));
      blocks.push(quickText({ x: 628, y: y + 25, w: chips.length ? 374 : 604, h: 42, text: body, size: 21, weight: 500, color: "#aeb7c7", lineHeight: 1.3, className: "lvg-quick-copy" }));
      chips.forEach((chip, chipIndex) => {
        const chipX = 1042 + chipIndex * 88;
        blocks.push(shapeBlock({ x: chipX, y: y + 27, w: 74, h: 32, fill: "rgba(255,255,255,0.04)", radius: "6px", border: "1px solid rgba(62,195,247,0.30)" }));
        blocks.push(quickText({ x: chipX, y: y + 35, w: 74, h: 18, text: chip, size: 13, weight: 620, align: "center", color: "#dceeff", className: "lvg-quick-copy" }));
      });
    });
    return visualLayout({ title, sourceSlide, className: "lvg-quick-slide lvg-quick-todo", blocks });
  }

  function visualCaseFlow({ title, subtitle = "", prompt = "", steps = [], sourceSlide } = {}) {
    const visibleSteps = Array.from(steps).slice(0, 4);
    const grid = layoutGrid({ x: 230, y: 500, w: 1140, columns: Math.min(Math.max(visibleSteps.length, 1), 4), gap: 54 });
    const blocks = [
      ...visualBackgroundBlocks(),
      quickText({ x: 240, y: 100, w: 1120, h: 74, text: title, size: 60, weight: 760, align: "center", gradient: "brand", className: "lvg-quick-heading" }),
      quickText({ x: 330, y: 190, w: 940, h: 42, text: subtitle, size: 28, weight: 500, align: "center", color: "#aeb7c7", lineHeight: 1.36, className: "lvg-quick-copy" }),
      quickText({ x: 260, y: 304, w: 1080, h: 46, text: prompt, size: 36, weight: 680, align: "center", color: tokens.colors.white, className: "lvg-quick-copy" }),
      shapeBlock({ x: 580, y: 394, w: 440, h: 2, fill: tokens.gradients.deepBlue, radius: "999px", opacity: 0.78 }),
    ];
    visibleSteps.forEach((step, index) => {
      const col = grid.col(index);
      blocks.push(quickText({ x: col.x, y: grid.y, w: col.w, h: 26, text: String(index + 1).padStart(2, "0"), size: 20, weight: 700, align: "center", gradient: "deepBlue", className: "lvg-quick-copy" }));
      blocks.push(quickText({ x: col.x, y: grid.y + 50, w: col.w, h: 34, text: step.title || "", size: 28, weight: 740, align: "center", gradient: "brand", className: "lvg-quick-heading" }));
      blocks.push(quickText({ x: col.x - 8, y: grid.y + 114, w: col.w + 16, h: 84, text: step.body || "", size: 21, weight: 500, align: "center", color: "#aeb7c7", lineHeight: 1.36, className: "lvg-quick-copy" }));
      if (index < visibleSteps.length - 1) {
        blocks.push(shapeBlock({ x: col.x + col.w + 24, y: grid.y + 66, w: 38, h: 1, fill: "rgba(206,234,254,0.24)" }));
      }
    });
    return visualLayout({ title, sourceSlide, className: "lvg-quick-slide lvg-quick-apple lvg-quick-flow", blocks });
  }

  function createDeckFromOutline({ title = "", description = "", theme = "larkVisual", slides = [], meta = {} } = {}) {
    const renderedSlides = Array.from(slides).map((slide) => {
      const type = slide.type || slide.template || "statement";
      if (type === "statement" || type === "title") return visualStatement(slide);
      if (type === "todo" || type === "todoList") return visualTodoList(slide);
      if (type === "caseFlow" || type === "flow") return visualCaseFlow(slide);
      if (templateRegistry[type]) return create(type, slide);
      return visualStatement(slide);
    });
    return deckSpec({ title, description, theme, slides: renderedSlides, meta });
  }

  function visualCover({ title, subtitle, caption, sourceSlide } = {}) {
    return visualSlide({
      title,
      template: "visual-cover",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          <div class="lvg-center">
            ${editable(title, "", "h1")}
            ${renderIf(subtitle, (text) => editable(text, "", "p"))}
          </div>
          ${renderIf(caption, (text) => editable(text, "lvg-small-caption"))}
        </div>
      `,
    });
  }

  function visualHero({ title, subtitle, bg, logo, align = "center", highlight = [], sourceSlide } = {}) {
    const titleContent = highlight.length ? richText(highlight) : escapeHtml(title);
    return visualSlide({
      title,
      template: "visual-hero",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          ${renderIf(bg, (src) => imageTag(src, "lvg-bg lvg-bg-soft"))}
          <div class="lvg-vignette"></div>
          <div class="lvg-hero-copy ${escapeHtml(align)}">
            ${renderIf(logo, (src) => imageTag(src, "lvg-mini-logo"))}
            <h1 contenteditable="true">${titleContent}</h1>
            ${renderIf(subtitle, (text) => editable(text, "", "p"))}
          </div>
        </div>
      `,
    });
  }

  function visualQuote({ title, subtitle, bg, sourceSlide } = {}) {
    return visualSlide({
      title,
      template: "visual-quote",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          ${renderIf(bg, (src) => imageTag(src, "lvg-bg lvg-bg-soft"))}
          <div class="lvg-vignette"></div>
          <div class="lvg-quote">
            ${editable(title, "", "h1")}
            ${renderIf(subtitle, (text) => editable(text, "", "p"))}
          </div>
        </div>
      `,
    });
  }

  function visualPalette({ sourceSlide } = {}) {
    const swatches = [
      ["#548BFF", "#548bff"],
      ["#9BC6FF", "#9bc6ff"],
      ["#EADAFB", "#eadafb"],
      ["#FFF1E6", "#fff1e6"],
      ["#E2FFF7", "#e2fff7"],
      ["#BEE3FF", "#bee3ff"],
      ["#FFFADD", "#fffadd"],
      ["#D7F3D7", "#d7f3d7"],
      ["#336DF4", "#336df4"],
      ["#976EFF", "#976eff"],
      ["#FFAB6B", "#ffab6b"],
      ["#FFAB6B", "#ffab6b"],
      ["#96EDFF", "#96edff"],
      ["#71C6FF", "#71c6ff"],
    ];
    return visualSlide({
      title: "品牌色板",
      template: "visual-palette",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          ${editable("品牌色板", "lvg-title")}
          ${editable("更多资源见 figma", "lvg-link")}
          <div class="lvg-palette-stack">
            ${editable("PPT 色彩应用", "lvg-palette-label", "p")}
            <div class="lvg-gradient-row small"><span>Brand</span><span>Intelligent</span><span>Nature</span></div>
            <div class="lvg-gradient-row large"><span># 548BFF</span><span># D29AFF</span><span># FFCFB4</span></div>
            <div class="lvg-swatch-row">
              ${renderList(swatches, ([label, color]) => `<div style="background:${color};">${escapeHtml(label)}</div>`)}
            </div>
          </div>
        </div>
      `,
    });
  }

  function visualHighlight({ sourceSlide } = {}) {
    return visualSlide({
      title: "高亮字",
      template: "visual-highlight",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          ${editable("高亮字", "lvg-title lvg-muted")}
          <div class="lvg-highlight-demo">
            <div class="lvg-ok-line">
              <img class="lvg-status" src="assets/pptx-media/a4540d81cce4891e.png" alt="">
              <strong contenteditable="true">先进团队 <span class="lvg-blue">先用飞书</span></strong>
            </div>
            <div class="lvg-rule"></div>
            <div class="lvg-bad-line">
              <img class="lvg-status" src="assets/pptx-media/70f40590943bfa16.png" alt="">
              <strong contenteditable="true">封面标题\\金句高亮文案<span class="lvg-blue">高亮文案</span><br>封面标题\\金句高亮文案<span class="lvg-blue">高亮文案</span></strong>
            </div>
          </div>
        </div>
      `,
    });
  }

  function visualTypography({ sourceSlide } = {}) {
    return visualSlide({
      title: "字体样式",
      template: "visual-typography",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          ${editable("字体样式", "lvg-title")}
          <div class="lvg-type-board">
            <div>
              ${editable("_ 中文字体", "lvg-type-kicker", "p")}
              <div class="lvg-type-group">${editable("中文 Typography", "lvg-type-caption", "p")}${editable("方正兰亭黑Pro", "lvg-type-main", "p")}</div>
              <div class="lvg-type-group">${editable("标题_Semi Bold+加粗", "lvg-type-caption", "p")}${editable("2024飞书未来无限大会", "lvg-type-main", "p")}</div>
              <div class="lvg-type-group">${editable("内容文本_Medium", "lvg-type-caption", "p")}${editable("飞 书 未 来 无 限 大 会", "lvg-type-body", "p")}</div>
            </div>
            <div class="lvg-type-separator"></div>
            <div>
              ${editable("_ 英文(数字)字体", "lvg-type-kicker", "p")}
              <div class="lvg-type-group">${editable("EN Typography", "lvg-type-caption", "p")}${editable("TikTok Display", "lvg-type-main", "p")}</div>
              <div class="lvg-type-group">${editable("Headline_Bold", "lvg-type-caption", "p")}${editable("ABCDEFGHIJKLMN1234567890", "lvg-type-main", "p")}</div>
              <div class="lvg-type-group">${editable("Content Body_Regular", "lvg-type-caption", "p")}${editable("Abcdefghijklmn1234567890", "lvg-type-body", "p")}</div>
            </div>
          </div>
        </div>
      `,
    });
  }

  function visualLogoWall({ logos = [], bg, sourceSlide } = {}) {
    return visualSlide({
      title: "Logo",
      template: "visual-logo-wall",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          ${renderIf(bg, (src) => `${imageTag(src, "lvg-bg lvg-bg-soft")}<div class="lvg-wash"></div>`)}
          <div class="lvg-logo-cloud">
            ${renderList(logos, (logo) => `<div class="lvg-logo-card">${imageTag(logo)}</div>`)}
          </div>
        </div>
      `,
    });
  }

  function visualAvatarLibrary({ columns = [], sourceSlide } = {}) {
    return visualSlide({
      title: "通用头像",
      template: "visual-avatar-library",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          ${editable("通用头像", "lvg-title")}
          ${editable("更多人像资源见 figma", "lvg-link")}
          <div class="lvg-avatar-columns">
            ${renderList(
              columns,
              (column) => `
                  <div class="lvg-avatar-col">
                    ${editable(column.title, "lvg-col-title", "p")}
                    ${renderList(
                      column.people || [],
                      (person) => `
                          <div class="lvg-person">
                            ${imageTag(person.image)}
                            ${editable(person.name)}
                            ${editable(person.group)}
                          </div>
                        `
                    )}
                  </div>
                `
            )}
          </div>
        </div>
      `,
    });
  }

  function visualIconLibrary({ icons = [], sourceSlide } = {}) {
    return visualSlide({
      title: "功能 ICON 资源库",
      template: "visual-icon-library",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          ${editable("功能 ICON 资源库", "lvg-title strong")}
          ${editable("功能 ICON 资源库", "lvg-link")}
          <div class="lvg-status-row">
            <img src="assets/pptx-media/a4540d81cce4891e.png" alt="">
            <img src="assets/pptx-media/70f40590943bfa16.png" alt="">
            <img src="assets/pptx-media/79537a3295e5735a.png" alt="">
          </div>
          <div class="lvg-icon-grid">
            ${renderList(icons, (icon) => `<span class="lvg-icon-dot">${imageTag(icon)}</span>`)}
          </div>
        </div>
      `,
    });
  }

  function visualProductIcons({ icons = [], labels = [], sourceSlide } = {}) {
    return visualSlide({
      title: "产品 ICON",
      template: "visual-product-icons",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          ${editable("产品 ICON", "lvg-title strong")}
          ${editable("更多资源见 figma", "lvg-link")}
          <div class="lvg-product-icons">
            ${renderList(icons, (icon) => `<div class="lvg-product-icon">${imageTag(icon)}</div>`)}
          </div>
          <div class="lvg-product-labels">
            ${renderList(labels, (label) => editable(label))}
          </div>
        </div>
      `,
    });
  }

  function visualPhotoStory({ title, subtitle, images = [], captions = [], sourceSlide } = {}) {
    return visualSlide({
      title,
      template: "visual-photo-story",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          <div class="lvg-photo-strip">${renderList(images, (image) => imageTag(image))}</div>
          <div class="lvg-wash"></div>
          ${renderList(
            captions,
            (caption, index) => `
                <div class="lvg-photo-caption" style="left:${index * 25}%;">
                  ${editable(caption.title, "", "h3")}
                  ${renderIf(caption.body, (text) => editable(text, "", "p"))}
                </div>
              `
          )}
          <div class="lvg-hero-copy center">
            ${editable(title, "", "h1")}
            ${renderIf(subtitle, (text) => editable(text, "", "p"))}
          </div>
        </div>
      `,
    });
  }

  function visualProductShot({ title, subtitle, image, bg, phone = false, sourceSlide } = {}) {
    return visualSlide({
      title,
      template: "visual-product-shot",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          ${renderIf(bg, (src) => imageTag(src, "lvg-bg lvg-bg-soft"))}
          <div class="lvg-wash"></div>
          <div class="lvg-hero-copy">
            ${editable(title, "", "h1")}
            ${renderIf(subtitle, (text) => editable(text, "", "p"))}
          </div>
          <div class="lvg-shot ${phone ? "phone" : ""}">${imageTag(image)}</div>
        </div>
      `,
    });
  }

  function visualMetricChart({ title, value, label, subtitle, sourceSlide } = {}) {
    return visualSlide({
      title,
      template: "visual-metric-chart",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          <div class="lvg-metrics">
            ${editable(label, "lvg-metric-label", "p")}
            ${editable(value, "lvg-metric-value", "p")}
            ${renderIf(subtitle, (text) => editable(text, "", "p"))}
          </div>
          <div class="lvg-chart"><div class="lvg-chart-grid"></div><div class="lvg-chart-line"></div></div>
        </div>
      `,
    });
  }

  function visualBars({ title, subtitle, bars = [], sourceSlide } = {}) {
    return visualSlide({
      title,
      template: "visual-bars",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          <div class="lvg-hero-copy">
            ${editable(title, "", "h1")}
            ${renderIf(subtitle, (text) => editable(text, "", "p"))}
          </div>
          <div class="lvg-bar-group">
            ${renderList(bars, (bar) => `<div class="lvg-bar"><span style="width:${Math.max(4, Math.min(100, Number(bar)))}%;"></span></div>`)}
          </div>
        </div>
      `,
    });
  }

  function visualCards({ title, subtitle, cards = [], bg, sourceSlide } = {}) {
    return visualSlide({
      title,
      template: "visual-cards",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          ${renderIf(bg, (src) => imageTag(src, "lvg-bg lvg-bg-soft"))}
          <div class="lvg-wash"></div>
          <div class="lvg-hero-copy center" style="top:34%;">
            ${editable(title, "", "h1")}
            ${renderIf(subtitle, (text) => editable(text, "", "p"))}
          </div>
          <div class="lvg-card-row">
            ${renderList(cards, (card) => `<div class="lvg-dark-card">${editable(card.title, "", "h3")}${editable(card.body, "", "p")}</div>`)}
          </div>
        </div>
      `,
    });
  }

  function visualLogoSpec({ sourceSlide } = {}) {
    return visualSlide({
      title: "Logo",
      template: "visual-logo-spec",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          ${editable("Logo", "lvg-title lvg-muted")}
          ${editable("更多品牌规范见设计资产库", "lvg-link")}
          <div class="lvg-logo-spec">
            <div class="lvg-logo-panel"><img src="assets/pptx-media/c79530d42bdf7e25.png" alt=""></div>
            <div class="lvg-logo-panel dark"><img src="assets/pptx-media/c79530d42bdf7e25.png" alt=""></div>
            <div>
              ${editable("联合 Logo，飞书 Logo 固定在前面展示", "lvg-palette-label", "p")}
              <div class="lvg-lockup-spec">
                <img src="assets/pptx-media/c79530d42bdf7e25.png" alt="">
                <span class="partner" contenteditable="true">Partner logo</span>
              </div>
            </div>
          </div>
        </div>
      `,
    });
  }

  function visualGuideLines({ sourceSlide } = {}) {
    return visualSlide({
      title: "引导线组件",
      template: "visual-guide-lines",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          ${editable("引导线组件", "lvg-title lvg-muted")}
          <div class="lvg-line-kit">
            ${editable("内容引导线：基于内容需要 2px 的倍数使用，增长越高，越正向颜色越亮", "lvg-type-main", "p")}
            <div class="lvg-line"></div>
            <div class="lvg-line thin"></div>
            <div class="lvg-line"></div>
            <div class="lvg-line" style="background:#2e2e2e;"></div>
            <div class="lvg-line" style="width:58%;"></div>
            ${editable("产品引导线", "lvg-type-main", "p")}
            <div class="lvg-line thin"></div>
            <div class="lvg-line dashed"></div>
          </div>
          <div class="lvg-tag-list">
            <div class="lvg-tag-row"><span class="lvg-tag" contenteditable="true">标签</span><span class="lvg-tag-line"></span></div>
            <div class="lvg-tag-row"><span class="lvg-tag" contenteditable="true">标签</span><span class="lvg-tag-line" style="background:linear-gradient(90deg,#fff1e6,#d29aff);"></span></div>
            <div class="lvg-tag-row"><span class="lvg-tag" contenteditable="true">标签</span><span class="lvg-tag-line" style="background:#fff;"></span></div>
          </div>
        </div>
      `,
    });
  }

  function visualMilestone({ title, subtitle, map, sourceSlide } = {}) {
    return visualSlide({
      title,
      template: "visual-milestone",
      sourceSlide,
      content: `
        <div class="lvg-slide">
          <div class="lvg-hero-copy center" style="top:30%;">
            ${editable(title, "", "h1")}
            ${renderIf(subtitle, (text) => editable(text, "", "p"))}
          </div>
          ${renderIf(map, (src) => imageTag(src, "lvg-map"))}
          <div class="lvg-milestone">
            <i class="lvg-point" style="left:2%;"><span>2025.3</span></i>
            <i class="lvg-point" style="left:28%;"><span>2025.5</span></i>
            <i class="lvg-point" style="left:56%;"><span>2025.8</span></i>
            <i class="lvg-point" style="left:86%;"><span>至今</span></i>
          </div>
        </div>
      `,
    });
  }

  const builtInTemplates = {
    cover,
    section,
    imageHero,
    metric,
    twoColumn,
    visualSlide,
    visualLayout,
    visualStatement,
    visualTodoList,
    visualCaseFlow,
    visualCover,
    visualHero,
    visualQuote,
    visualPalette,
    visualHighlight,
    visualTypography,
    visualLogoWall,
    visualAvatarLibrary,
    visualIconLibrary,
    visualProductIcons,
    visualPhotoStory,
    visualProductShot,
    visualMetricChart,
    visualBars,
    visualCards,
    visualLogoSpec,
    visualGuideLines,
    visualMilestone,
  };

  const builtInContracts = {
    cover: { intent: "Simple opening slide.", limits: { maxTitleChars: 34, maxBodyChars: 140 }, slots: { title: "required", subtitle: "optional" } },
    metric: { intent: "Metric summary slide.", limits: { maxItems: 4, maxBodyChars: 180 }, slots: { title: "required", metrics: "1-4 items" } },
    twoColumn: { intent: "Two balanced content columns.", limits: { maxItems: 10, maxBodyChars: 420 }, slots: { title: "required", left: "up to 5 items", right: "up to 5 items" } },
    visualLayout: { intent: "Precision 1600x900 editable block layout.", limits: { maxBlocks: 96, maxBodyChars: 2800 }, slots: { blocks: "absolute image/text/shape/vector blocks" } },
    visualStatement: {
      intent: "Fast keynote statement slide.",
      limits: { maxTitleChars: 42, maxSubtitleChars: 96, maxBodyChars: 180 },
      slots: { title: "required", subtitle: "optional", kicker: "optional" },
      guidance: ["Use one dominant claim.", "Avoid body copy and decorative cards.", "Keep subtitle short enough to breathe at 28px or larger."],
    },
    visualTodoList: {
      intent: "Stable checklist/process slide for Agent plans.",
      limits: { maxItems: 5, maxBodyChars: 520 },
      slots: { title: "required", subtitle: "optional", items: "up to 5 todo rows" },
      guidance: ["Use only when each column is a real step.", "Prefer 3-4 items for stage presentation.", "Shorten body text before adding more boxes."],
    },
    visualCaseFlow: {
      intent: "Prompt-to-actions case story.",
      limits: { maxItems: 4, maxBodyChars: 560 },
      slots: { title: "required", prompt: "required", steps: "up to 4 action cards" },
      guidance: ["Show user goal to executed action.", "Keep the prompt centered and readable.", "Do not mix separate product narratives on this slide."],
    },
  };

  Object.entries(builtInTemplates).forEach(([name, renderer]) => defineTemplate(name, renderer, builtInContracts[name]));

  const components = {
    editable,
    richText,
    imageTag,
    gradientText,
    textBlock,
    imageBlock,
    shapeBlock,
    vectorBlock,
    layoutGrid,
  };

  window.LarkSlideTemplates = {
    ...builtInTemplates,
    tokens,
    components,
    templates: templateRegistry,
    contracts: templateContracts,
    qualityRules,
    designGuidance,
    defineTemplate,
    create,
    templateNames,
    getTemplateContract,
    getDesignGuidance,
    validateDeckSpec,
    createDeckFromOutline,
    asset,
    deckSpec,
  };

  window.LarkSlideSDK = {
    runtime: window.LarkSlides,
    templates: window.LarkSlideTemplates,
    tokens,
    components,
    create,
    defineTemplate,
    templateNames,
    getTemplateContract,
    getDesignGuidance,
    validateDeckSpec,
    createDeckFromOutline,
    asset,
    deckSpec,
    createDeck(options) {
      if (!window.LarkSlides?.createDeck) throw new Error("LarkSlideSDK: lark-slides.js is required");
      return window.LarkSlides.createDeck(options);
    },
  };
})();
