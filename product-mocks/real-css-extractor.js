(function () {
  "use strict";

  const DEFAULT_PROPS = [
    "position",
    "display",
    "box-sizing",
    "inset",
    "top",
    "right",
    "bottom",
    "left",
    "z-index",
    "float",
    "clear",
    "width",
    "min-width",
    "max-width",
    "height",
    "min-height",
    "max-height",
    "margin",
    "padding",
    "overflow",
    "overflow-x",
    "overflow-y",
    "clip-path",
    "flex",
    "flex-basis",
    "flex-direction",
    "flex-flow",
    "flex-grow",
    "flex-shrink",
    "flex-wrap",
    "align-content",
    "align-items",
    "align-self",
    "justify-content",
    "justify-items",
    "justify-self",
    "gap",
    "row-gap",
    "column-gap",
    "grid",
    "grid-area",
    "grid-auto-columns",
    "grid-auto-flow",
    "grid-auto-rows",
    "grid-column",
    "grid-row",
    "grid-template",
    "grid-template-areas",
    "grid-template-columns",
    "grid-template-rows",
    "font",
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "letter-spacing",
    "line-height",
    "text-align",
    "text-decoration",
    "text-overflow",
    "text-transform",
    "white-space",
    "word-break",
    "color",
    "background",
    "background-color",
    "background-image",
    "background-position",
    "background-size",
    "background-repeat",
    "border",
    "border-color",
    "border-style",
    "border-width",
    "border-radius",
    "box-shadow",
    "opacity",
    "transform",
    "transform-origin",
    "object-fit",
    "object-position",
    "vertical-align",
    "cursor",
    "pointer-events",
    "list-style",
  ];

  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE"]);
  const FORM_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "OPTION"]);
  const PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' fill='%23f5f6f7'/%3E%3Cpath d='M104 112l42-44 34 34 18-18 42 28' fill='none' stroke='%23c9cdd4' stroke-width='8' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='212' cy='62' r='16' fill='%23c9cdd4'/%3E%3C/svg%3E";

  function px(value) {
    return `${Math.round(value)}px`;
  }

  function safeSelector(root) {
    if (!root) return document.body;
    if (root instanceof Element) return root;
    const found = document.querySelector(root);
    if (!found) throw new Error(`No element found for selector: ${root}`);
    return found;
  }

  function isVisible(element, viewportOnly) {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    if (!viewportOnly) return true;
    return rect.bottom >= 0 && rect.right >= 0 && rect.top <= innerHeight && rect.left <= innerWidth;
  }

  function normalizeStyleValue(prop, value, options) {
    if (!value) return "";
    if (!options.allowAssetUrls && /url\(/i.test(value)) return prop === "background-image" ? "none" : "";
    if (value === "auto" && ["top", "right", "bottom", "left", "inset"].includes(prop)) return "";
    return value;
  }

  function styleSignature(element, options) {
    const computed = getComputedStyle(element);
    const lines = [];
    for (const prop of options.props) {
      const normalized = normalizeStyleValue(prop, computed.getPropertyValue(prop), options);
      if (!normalized) continue;
      lines.push(`${prop}: ${normalized};`);
    }
    return lines.join("\n");
  }

  function addClassForStyle(element, styleText, registry) {
    if (!styleText) return "";
    if (!registry.has(styleText)) registry.set(styleText, `ldk-real-${registry.size}`);
    const className = registry.get(styleText);
    element.classList.add(className);
    return className;
  }

  function createTextPlaceholder(state, options) {
    state.textCount += 1;
    const label = options.placeholderPrefix ? `${options.placeholderPrefix} ${state.textCount}` : `Text ${state.textCount}`;
    return document.createTextNode(label);
  }

  function copySafeAttributes(source, target, options, state) {
    target.removeAttribute("id");
    target.removeAttribute("class");
    target.removeAttribute("style");
    target.removeAttribute("srcset");
    target.removeAttribute("href");
    target.removeAttribute("onclick");
    target.removeAttribute("oninput");
    target.setAttribute("data-ldk-node", String(state.nodeCount));

    const role = source.getAttribute("role");
    const ariaLabel = source.getAttribute("aria-label");
    if (role) target.setAttribute("role", role);
    if (ariaLabel && !options.sanitizeText) target.setAttribute("aria-label", ariaLabel);

    if (target instanceof HTMLImageElement) {
      target.src = options.allowImages ? source.currentSrc || source.src || PLACEHOLDER_IMAGE : PLACEHOLDER_IMAGE;
      target.alt = options.sanitizeText ? "Image placeholder" : source.alt || "Image placeholder";
    }

    if (FORM_TAGS.has(source.tagName)) {
      target.setAttribute("disabled", "");
      if ("placeholder" in target) target.setAttribute("placeholder", options.sanitizeText ? "Placeholder" : source.placeholder || "");
      if ("value" in target) target.setAttribute("value", options.sanitizeText ? "" : source.value || "");
    }
  }

  function copySvgAttributes(source, target) {
    const attrs = [
      "viewBox",
      "x",
      "y",
      "x1",
      "y1",
      "x2",
      "y2",
      "cx",
      "cy",
      "r",
      "rx",
      "ry",
      "width",
      "height",
      "d",
      "points",
      "fill",
      "stroke",
      "stroke-width",
      "stroke-linecap",
      "stroke-linejoin",
      "stroke-dasharray",
      "stroke-dashoffset",
      "fill-rule",
      "clip-rule",
      "transform",
    ];
    for (const name of attrs) {
      const value = source.getAttribute(name);
      if (value !== null) target.setAttribute(name, value);
    }
  }

  function cloneTree(source, options, state) {
    if (state.nodeCount >= options.maxNodes) return null;
    if (source.nodeType === Node.TEXT_NODE) {
      if (!source.textContent || !source.textContent.trim()) return document.createTextNode(source.textContent || "");
      return options.sanitizeText ? createTextPlaceholder(state, options) : document.createTextNode(source.textContent);
    }
    if (source.nodeType !== Node.ELEMENT_NODE) return null;
    if (SKIP_TAGS.has(source.tagName)) return null;
    if (!isVisible(source, options.viewportOnly)) return null;

    state.nodeCount += 1;
    const originalTag = source.tagName.toLowerCase();
    const shouldWrapDocumentRoot = originalTag === "html" || originalTag === "body";
    const target = source instanceof SVGElement
      ? document.createElementNS(source.namespaceURI || "http://www.w3.org/2000/svg", originalTag)
      : document.createElement(shouldWrapDocumentRoot ? "div" : originalTag);
    if (shouldWrapDocumentRoot) target.setAttribute("data-ldk-original-tag", originalTag);
    copySafeAttributes(source, target, options, state);
    if (source instanceof SVGElement) copySvgAttributes(source, target);
    addClassForStyle(target, styleSignature(source, options), state.styles);

    const childNodes = Array.from(source.childNodes);
    for (const child of childNodes) {
      const cloned = cloneTree(child, options, state);
      if (cloned) target.appendChild(cloned);
    }
    return target;
  }

  function cssFromRegistry(registry) {
    return Array.from(registry.entries())
      .map(([styleText, className]) => `.${className} {\n${styleText}\n}`)
      .join("\n\n");
  }

  function capture(userOptions = {}) {
    const options = {
      root: "body",
      title: document.title || "Lark Product Mock",
      maxNodes: 900,
      viewportOnly: true,
      sanitizeText: true,
      allowImages: false,
      allowAssetUrls: false,
      placeholderPrefix: "Text",
      props: DEFAULT_PROPS,
      ...userOptions,
    };
    const root = safeSelector(options.root);
    const rect = root.getBoundingClientRect();
    const state = { nodeCount: 0, textCount: 0, styles: new Map() };
    const cloned = cloneTree(root, options, state);
    if (!cloned) throw new Error("Selected root produced no visible nodes.");
    cloned.classList.add("ldk-real-root");
    const css = cssFromRegistry(state.styles);
    return {
      version: 1,
      title: options.title,
      sourceUrl: location.origin + location.pathname,
      capturedAt: new Date().toISOString(),
      viewport: { width: innerWidth, height: innerHeight },
      rootRect: { width: rect.width, height: rect.height, x: rect.x, y: rect.y },
      sanitized: options.sanitizeText,
      allowImages: options.allowImages,
      nodeCount: state.nodeCount,
      textCount: state.textCount,
      css,
      html: cloned.outerHTML,
    };
  }

  function renderStandalone(captureResult) {
    const width = Math.max(1, Math.round(captureResult.rootRect.width || captureResult.viewport.width));
    const height = Math.max(1, Math.round(captureResult.rootRect.height || captureResult.viewport.height));
    const title = escapeHtml(captureResult.title || "Lark Product Mock");
    return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
      html, body {
        margin: 0;
        width: 100%;
        min-height: 100%;
        background: #ffffff;
      }

      .ldk-real-stage {
        width: ${px(width)};
        height: ${px(height)};
        overflow: hidden;
        background: #ffffff;
      }

      .ldk-real-root {
        transform-origin: top left;
      }

      [data-ldk-node] {
        box-sizing: border-box;
      }

      [data-ldk-node]:not(svg):not(path):not(circle):not(rect):not(line):not(polyline):not(polygon) {
        content-visibility: visible;
      }

${captureResult.css}
    </style>
  </head>
  <body>
    <div class="ldk-real-stage">
      ${captureResult.html}
    </div>
  </body>
</html>
`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  window.LarkDeckKitRealCssExtractor = {
    capture,
    renderStandalone,
    DEFAULT_PROPS,
  };
})();
