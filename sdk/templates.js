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
      zh: "\"FZLanTingHeiPro_GB18030\", \"PingFang SC\", \"Microsoft YaHei\", Arial, sans-serif",
      en: "\"TikTok Display\", \"Inter\", Arial, sans-serif",
    },
  };

  const templateRegistry = {};

  function defineTemplate(name, renderer) {
    if (!name || typeof name !== "string") throw new Error("LarkSlideTemplates: template name is required");
    if (typeof renderer !== "function") throw new Error(`LarkSlideTemplates: ${name} must be a function`);
    templateRegistry[name] = renderer;
    return renderer;
  }

  function create(name, props = {}) {
    const renderer = typeof name === "function" ? name : templateRegistry[name];
    if (!renderer) throw new Error(`LarkSlideTemplates: unknown template ${name}`);
    return renderer(props);
  }

  function templateNames() {
    return Object.keys(templateRegistry);
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

  Object.entries(builtInTemplates).forEach(([name, renderer]) => defineTemplate(name, renderer));

  const components = {
    editable,
    richText,
    imageTag,
    gradientText,
    textBlock,
    imageBlock,
    shapeBlock,
    vectorBlock,
  };

  window.LarkSlideTemplates = {
    ...builtInTemplates,
    tokens,
    components,
    templates: templateRegistry,
    defineTemplate,
    create,
    templateNames,
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
    asset,
    deckSpec,
    createDeck(options) {
      if (!window.LarkSlides?.createDeck) throw new Error("LarkSlideSDK: lark-slides.js is required");
      return window.LarkSlides.createDeck(options);
    },
  };
})();
