(function (global) {
  "use strict";

  const version = "0.2.0-figma-components";

  /**
   * @typedef {{icon?: string, label?: string}} LpmAction
   * @typedef {{label?: string, icon?: string}} LpmChip
   * @typedef {{
   *   showBrand?: boolean,
   *   logo?: string,
   *   brandName?: string,
   *   showFeatures?: boolean,
   *   showNavLinks?: boolean,
   *   search?: boolean,
   *   searchPlaceholder?: string,
   *   level?: 1 | 2,
   *   navLinks?: string[],
   *   activeIndex?: number,
   *   primaryAction?: string,
   *   actions?: LpmAction[],
   *   avatar?: string
   * }} LpmDesktopHeaderOptions
   * @typedef {{label?: string, icon?: string | false, variant?: "primary" | "default" | "text", size?: "small" | "large", shape?: "square" | "round"}} LpmMobileButtonOptions
   * @typedef {{variant?: "primary" | "secondary", title?: string, subtitle?: string, avatar?: string, avatarSrc?: string, actions?: LpmAction[], backLabel?: string, actionLabel?: string}} LpmMobileNavBarOptions
   * @typedef {{shadow?: "s1" | "s2" | "s3", border?: boolean, content?: string}} LpmMobileCardOptions
   * @typedef {{label: string, primary?: boolean}} LpmDialogAction
   * @typedef {{title?: string, description?: string, slot?: string, actions?: LpmDialogAction[]}} LpmMobileDialogOptions
   * @typedef {{chips?: LpmChip[], placeholder?: string, ariaLabel?: string, leadingIcon?: string, trailingIcon?: string}} LpmMobileChatSenderOptions
   */

  const figmaSources = Object.freeze({
    desktop: {
      fileKey: "QkRegi9u4LiT3fXZI2xCOI",
      nodeId: "2376:182012",
      focus: "[D] Header",
    },
    mobile: {
      fileKey: "5DGQfSYstIuypw5wCjGvQz",
      nodeId: "508:77283",
      focus: "Mobile component index",
    },
  });

  const componentCatalog = Object.freeze({
    desktop: ["Header"],
    mobile: {
      navigation: ["Breadcrumb", "Menu", "NavBar", "TabBar", "Tabs"],
      dataEntry: [
        "Button",
        "Checkbox",
        "ColorPicker",
        "DatePicker",
        "Filter",
        "Input",
        "Radio",
        "Rate",
        "Stepper",
        "Switch",
        "Upload",
      ],
      dataDisplay: ["Avatar", "Badge", "Card", "Collapse", "Empty", "List", "Tag", "Timeline"],
      feedback: ["ActionPanels", "Dialog", "Drawer", "Loading", "ModalView", "Notice", "Progress", "Toast"],
      biz: ["Mention", "SharePanel", "OnboardingPopover", "Picker", "Profile"],
      ai: ["ChatSender", "ChatReasoning", "ChatContent"],
    },
  });

  const styleTokens = Object.freeze({
    color: {
      primary: "#1456f0",
      primaryFill: "#3370ff",
      textTitle: "#1f2329",
      textBody: "#2b2f36",
      textCaption: "#646a73",
      textPlaceholder: "#8f959e",
      bgBase: "#f2f3f5",
      bgBody: "#ffffff",
      lineBorder: "#dee0e3",
      lineDivider: "rgba(31,35,41,0.15)",
      mask: "rgba(0,0,0,0.55)",
    },
    desktop: {
      headerHeight: 56,
      headerBrandWidth: 160,
      headerSearchWidth: 248,
    },
    mobile: {
      canvasWidth: 375,
      navBarHeight: 72,
      buttonHeightSmall: 70,
      cardWidth: 343,
      radiusLarge: 8,
    },
  });

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  function classNames() {
    return Array.prototype.slice
      .call(arguments)
      .filter(Boolean)
      .join(" ");
  }

  function attrs(map) {
    return Object.keys(map || {})
      .filter((key) => map[key] !== false && map[key] != null)
      .map((key) => {
        if (map[key] === true) return ` ${key}`;
        return ` ${key}="${escapeAttr(map[key])}"`;
      })
      .join("");
  }

  const iconPaths = Object.freeze({
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
    keyboard: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h.01"/><path d="M11 9h.01"/><path d="M15 9h.01"/><path d="M7 13h10"/><path d="M9 17h6"/>',
  });

  function icon(name, options) {
    const opts = options || {};
    const size = opts.size ? ` is-${opts.size}` : "";
    const key = String(name || "more");
    const body = iconPaths[key] || `<use href="#lpm-i-${escapeAttr(key)}"></use>`;
    return `<svg class="lpm-icon${size}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  }

  function desktopHeader(options) {
    const props = options || {};
    const navLinks = props.navLinks || ["页签", "页签", "页签", "页签", "页签"];
    const actions = props.actions || [
      { icon: "search", label: "查看" },
      { icon: "download", label: "下载" },
      { icon: "trash", label: "删除" },
    ];
    const showBrand = props.showBrand !== false;
    const showFeatures = props.showFeatures !== false;
    const showNavLinks = props.showNavLinks !== false;
    const showSearch = props.search !== false;
    const level = props.level === 1 ? 1 : 2;
    const activeIndex = props.activeIndex == null ? 0 : Number(props.activeIndex);

    const brand = showBrand
      ? `<div class="lpm-d-header-brand">
          <span class="lpm-d-header-logo" aria-hidden="true">${props.logo || ""}</span>
          <span class="lpm-d-header-brand-name">${escapeHtml(props.brandName || "产品名称")}</span>
        </div>`
      : "";

    const nav = showNavLinks
      ? `<nav class="lpm-d-header-nav" aria-label="Desktop product navigation">
          ${navLinks
            .map((label, index) => {
              const active = index === activeIndex ? " is-active" : "";
              return `<a class="lpm-d-header-link${active}" href="#">${escapeHtml(label)}</a>`;
            })
            .join("")}
        </nav>`
      : "";

    const search = showSearch
      ? `<div class="lpm-d-header-search">${icon("search", { size: "sm" })}<span>${escapeHtml(
          props.searchPlaceholder || "输入框文本"
        )}</span></div>`
      : "";

    const featureButtons = showFeatures
      ? `<div class="lpm-d-header-actions">
          <button class="lpm-button is-primary" type="button">${icon("plus", { size: "sm" })}<span>${escapeHtml(
            props.primaryAction || "Button"
          )}</span></button>
          ${actions
            .map(
              (action) =>
                `<button class="lpm-d-header-icon-button" type="button" aria-label="${escapeAttr(
                  action.label || action.icon
                )}">${icon(action.icon || "more")}</button>`
            )
            .join("")}
          <span class="lpm-d-header-slot" aria-hidden="true"></span>
          <span class="lpm-d-header-divider"></span>
          <button class="lpm-d-header-icon-button" type="button" aria-label="更多">${icon("more")}</button>
          <button class="lpm-d-header-icon-button" type="button" aria-label="新增">${icon("plus")}</button>
          <span class="lpm-avatar lpm-d-header-avatar">${escapeHtml(props.avatar || "明")}</span>
        </div>`
      : "";

    return `<header class="lpm-d-header"${attrs({
      "data-lpm-component": "desktop-header",
      "data-level": level,
    })}>
      ${brand}
      ${nav}
      <div class="lpm-d-header-spacer"></div>
      ${search}
      ${featureButtons}
    </header>`;
  }

  function mobileButton(options) {
    const props = options || {};
    const variant = props.variant || "primary";
    const size = props.size || "small";
    const shape = props.shape || "square";
    const iconName = props.icon === false ? "" : props.icon || "plus";
    return `<button class="${classNames(
      "lpm-m-button",
      `is-${variant}`,
      `is-${size}`,
      `is-${shape}`
    )}" type="button" data-lpm-component="mobile-button">
      ${iconName ? icon(iconName) : ""}
      <span>${escapeHtml(props.label || "Button")}</span>
    </button>`;
  }

  function mobileNavBar(options) {
    const props = options || {};
    const actions = props.actions || [
      { icon: "mic", label: "语音" },
      { icon: "search", label: "搜索" },
      { icon: "calendar", label: "日历" },
    ];
    const isSecondary = props.variant === "secondary";

    if (isSecondary) {
      return `<header class="lpm-m-navbar is-secondary" data-lpm-component="mobile-navbar">
        <button class="lpm-m-icon-button" type="button" aria-label="${escapeAttr(props.backLabel || "返回")}">${icon(
          "chevron-left"
        )}</button>
        <div class="lpm-m-navbar-title-stack">
          <strong>${escapeHtml(props.title || "标题")}</strong>
          <span>${escapeHtml(props.subtitle || "辅助说明文本，建议不超过一行")}</span>
        </div>
        <button class="lpm-m-text-button" type="button">${escapeHtml(props.actionLabel || "操作")}</button>
      </header>`;
    }

    return `<header class="lpm-m-navbar" data-lpm-component="mobile-navbar">
      <div class="lpm-m-navbar-profile">
        ${
          props.avatarSrc
            ? `<img class="lpm-m-navbar-photo" alt="" src="${escapeAttr(props.avatarSrc)}">`
            : `<span class="lpm-avatar">${escapeHtml(props.avatar || "李")}</span>`
        }
        <div class="lpm-m-navbar-title-stack">
          <strong>${escapeHtml(props.title || "李天天")}</strong>
          <span>${escapeHtml(props.subtitle || "辅助说明文本，不超过一行")}</span>
        </div>
      </div>
      <div class="lpm-m-navbar-actions">
        ${actions
          .map(
            (action) =>
              `<button class="lpm-m-icon-button" type="button" aria-label="${escapeAttr(
                action.label || action.icon
              )}">${icon(action.icon || "more")}</button>`
          )
          .join("")}
      </div>
    </header>`;
  }

  function mobileCard(options) {
    const props = options || {};
    const shadow = props.shadow || "s1";
    const body = props.content || '<div class="lpm-m-card-placeholder"></div>';
    return `<section class="${classNames(
      "lpm-m-card",
      `is-${shadow}`,
      props.border === false ? "is-borderless" : ""
    )}" data-lpm-component="mobile-card">
      ${typeof body === "string" ? body : ""}
    </section>`;
  }

  function mobileDialog(options) {
    const props = options || {};
    const actions = props.actions || [
      { label: "操作" },
      { label: "操作", primary: true },
    ];
    return `<div class="lpm-m-dialog-mask" data-lpm-component="mobile-dialog">
      <section class="lpm-m-dialog" role="dialog" aria-modal="true" aria-label="${escapeAttr(
        props.title || "我是标题"
      )}">
        <div class="lpm-m-dialog-content">
          <h3>${escapeHtml(props.title || "我是标题")}</h3>
          <p>${escapeHtml(props.description || "我是纯文本内容")}</p>
          ${props.slot || ""}
        </div>
        <div class="lpm-m-dialog-actions">
          ${actions
            .map(
              (action) =>
                `<button class="${action.primary ? "is-primary" : ""}" type="button">${escapeHtml(action.label)}</button>`
            )
            .join("")}
        </div>
      </section>
    </div>`;
  }

  function mobileChatSender(options) {
    const props = options || {};
    const chips = props.chips || [
      { label: "联网搜索", icon: "search" },
      { label: "", icon: "more" },
    ];
    return `<section class="lpm-m-chat-sender" data-lpm-component="mobile-chat-sender">
      <div class="lpm-m-chat-sender-chips">
        ${chips
          .map(
            (chip) =>
              `<button class="lpm-m-chat-chip" type="button">${chip.icon ? icon(chip.icon, { size: "sm" }) : ""}<span>${escapeHtml(
                chip.label
              )}</span></button>`
          )
          .join("")}
      </div>
      <div class="lpm-m-chat-input" role="textbox" aria-label="${escapeAttr(props.ariaLabel || "AI 输入框")}">
        <span class="lpm-m-chat-input-icon">${icon(props.leadingIcon || "keyboard", { size: "sm" })}</span>
        <strong>${escapeHtml(props.placeholder || "按住 说话")}</strong>
        <span class="lpm-m-chat-input-icon">${icon(props.trailingIcon || "plus")}</span>
      </div>
    </section>`;
  }

  const components = Object.freeze({
    desktopHeader,
    mobileButton,
    mobileNavBar,
    mobileCard,
    mobileDialog,
    mobileChatSender,
  });

  function render(name, props) {
    if (!components[name]) {
      throw new Error(`Unknown LarkProductMocks component: ${name}`);
    }
    return components[name](props || {});
  }

  function mount(target, name, props) {
    const root = typeof target === "string" ? global.document && global.document.querySelector(target) : target;
    if (!root) {
      throw new Error("LarkProductMocks.mount target not found");
    }
    root.innerHTML = render(name, props);
    return root.firstElementChild;
  }

  global.LarkProductMocks = Object.freeze({
    version,
    figmaSources,
    componentCatalog,
    styleTokens,
    components,
    render,
    mount,
  });
})(typeof window !== "undefined" ? window : globalThis);
