# Lark DeckKit DESIGN.md

This document follows the DESIGN.md pattern from VoltAgent's `awesome-design-md` collection and the Google Stitch DESIGN.md format. It is written for AI design and coding agents that need to create new HTML slide decks using this project's visual language.

Use this file together with:

- `sdk/lark-slides.css` for implemented visual tokens and component styles.
- `sdk/lark-slides.js` for deck runtime, themes, and `createDeckSpec`.
- `sdk/templates.js` for template registry, tokens, and block components.
- `dist/lark-visual-sample.html` as the visual reference deck.

## 1. Visual Theme & Atmosphere

Lark DeckKit is a dark, keynote-grade presentation system for business and product storytelling. The visual language should feel premium, calm, technical, and precise. It is not a generic SaaS dashboard, not a marketing landing page, and not a screenshot playback shell.

The dominant canvas is near-black (`#000000` / `#111217`) with high-contrast white text, restrained blue-cyan gradients, and occasional glassy or luminous line work. Slides should feel like edited keynote pages: one idea per page, strong hierarchy, large typography, controlled spacing, and minimal chrome.

The design has two modes:

- **Presentation shell**: runtime UI around the slide, using `#111217`, compact toolbar controls, subtle borders, and a bottom progress bar. In fullscreen playback, the shell must disappear and the 16:9 stage fills the available screen like a PPT presentation; `ESC` exits playback.
- **Lark visual slide**: the actual 1600x900 slide canvas, usually black, asset-driven, gradient-type-heavy, and centered on a single message or diagram.

Key characteristics:

- Fixed 16:9 editorial canvas: `1600px x 900px`.
- Dark-first visual identity, with black backgrounds and luminous blue/cyan highlights.
- Large headline typography, often centered, with gradients applied to key phrases.
- PPT asset reuse is expected, but slides must remain editable HTML elements.
- Avoid decorative clutter. The reference style uses discipline, not ornament.
- Geometry should be precise: aligned blocks, short dashed connectors, 4-8px radii, and rectangular labels.
- Use visual depth through image overlays, subtle glow, thin borders, and gradient lines, not heavy shadows.

## 2. Color Palette & Roles

### Core Surfaces

| Name | Hex / Value | Role |
|---|---:|---|
| App Background | `#111217` | Browser/player background outside the slide canvas |
| Slide Black | `#000000` | Primary visual slide background |
| Slide White | `#ffffff` | Light template background and white overlays |
| Carbon Panel | `#101010` | Dark cards, dark buttons, contained surfaces |
| Border Dark | `rgba(255,255,255,0.12)` | Toolbar and subtle dark-surface borders |
| Text Primary Dark | `#f7f8fb` | Main text on black slides |
| Text Secondary Dark | `#b5bac4` | Supporting copy on black slides |
| Text Muted Dark | `#858b96` | Labels, metadata, low-emphasis notes |
| Text Primary Light | `#111217` | Main text on white slides |
| Text Secondary Light | `#4e5969` | Supporting copy on white slides |

### Brand / Accent Colors

| Name | Hex | Role |
|---|---:|---|
| Lark Deep Blue | `#1456f0` | Main accent, progress bar, deep gradient endpoint |
| Lark Cyan | `#3ec3f7` | Active line work, bright gradient midpoint |
| Lark Light Blue | `#ceeafe` | Soft gradient start and pale line work |
| Soft Blue | `#80a3ff` | Headline gradient endpoint in the current PPT recreation |
| Mist Blue | `#b1d5f6` | Middle stop for soft headline gradients |
| Pale Aqua | `#e2fff7` | Bright headline gradient start |

### Gradient System

Use gradients for high-signal words, section claims, metrics, and guide lines. Do not overuse gradients on body paragraphs.

| Token | CSS |
|---|---|
| Brand Text | `linear-gradient(90deg, #e2fff7 0%, #c8effa 43%, #b1d5f6 62%, #80a3ff 100%)` |
| Soft Text | `linear-gradient(90deg, #ffffff 0%, #e2fff7 38%, #b1d5f6 68%, #80a3ff 100%)` |
| Gray Text | `linear-gradient(90deg, #e6e8ee 0%, #b5bac4 52%, #858b96 100%)` |
| White-Gray Text | `linear-gradient(90deg, #f7f9ff 0%, #d9dee8 48%, #9ea8b8 100%)` |
| Deep Blue Text | `linear-gradient(90deg, #3ec3f7 0%, #1456f0 100%)` |
| Guide Line | `linear-gradient(90deg, #ceeafe 0%, #3ec3f7 54%, #1456f0 100%)` |

Implementation:

- Prefer `LarkSlideTemplates.components.textBlock({ gradient: "brand" })`.
- Prefer `.lvg-gradient-text.brand|soft|gray|white-gray|deep-blue` for custom HTML.
- Use horizontal gradients for most text. Use vertical gradients only when matching specific source slides.

## 3. Typography Rules

### Font Families

| Role | Font Stack |
|---|---|
| Visual Slide Display | `"TikTok Display", "FZLanTingHeiS-H-GB", "方正兰亭黑Pro", "PingFang SC", "Microsoft YaHei", Arial, sans-serif` |
| Chinese Business Headline | `"FZLanTingHeiPro_GB18030", "PingFang SC", "Microsoft YaHei", Arial, sans-serif` |
| SDK Light Template | `"Inter", "PingFang SC", "Microsoft YaHei", Arial, sans-serif` |
| English / Numeric Accent | `"TikTok Display", "Inter", Arial, sans-serif` |

### Hierarchy

| Role | Size | Weight | Line Height | Usage |
|---|---:|---:|---:|---|
| Cover English Display | `92-96px` | `500-700` | `1.05` | English keynote title |
| Hero Claim | `76-92px` | `740-760` | `1.05-1.10` | Main centered phrase |
| Section Claim | `58-68px` | `700-760` | `1.08-1.15` | Strong business statement |
| Large Metric | `96-120px` | `760` | `1.0` | Numbers such as `60%`, `90%`, `20x` |
| Template Title | `76px` | `760` | `1.05` | Light SDK templates |
| Subtitle | `28-40px` | `400-600` | `1.35-1.45` | Supporting statement |
| Body / Labels | `20-28px` | `400-600` | `1.35-1.55` | Cards, tags, captions |
| Micro / Metadata | `12-18px` | `400-500` | `1.3-1.5` | Asset labels, minor annotations |

### Rules

- Keep letter spacing at `0` unless matching a source PPT page that clearly uses wider spacing.
- Use big type sparingly. A slide should have one dominant typographic focal point.
- Chinese hero text should look heavy and stable, not thin. Use `700-760` for key claims.
- Body copy should be gray or white, not bright gradient.
- Metrics can use gradient fills, but labels should remain readable and aligned.
- Do not mix too many font families on one slide. The visual reference relies on a small stack.

## 4. Component Stylings

### Slide Runtime

- `.ls-app`: fixed full-window presentation shell.
- `.ls-stage`: centered 16:9 slide frame. With controls, reserve bottom space for toolbar; without controls or in fullscreen playback, fill the viewport.
- `.ls-toolbar`: compact, dark, translucent, `8px` radius, subtle white border.
- `.ls-button`: square `36px`, `6px` radius, centered icon/text.
- `.ls-progress-bar`: blue `#1456f0`, 3px high.

Runtime controls must never dominate the slide. They are playback utilities, not part of the deck design.

### Visual Layout Blocks

Use `visualLayout` when precision matters.

```js
const { imageBlock, textBlock, shapeBlock, vectorBlock } = LarkSlideTemplates.components;

LarkSlideTemplates.visualLayout({
  title: "业务价值",
  blocks: [
    imageBlock({ src: A("bg.png") }),
    textBlock({ x: 0, y: 360, w: 1600, h: 120, text: "提效价值", align: "center", size: 76, gradient: "brand" }),
    shapeBlock({ x: 280, y: 560, w: 1040, h: 1, fill: "linear-gradient(90deg,#ceeafe,#3ec3f7,#1456f0)" }),
  ],
});
```

Block rules:

- `imageBlock`: use for full-slide backgrounds, product screenshots, photo strips, maps, and logo walls.
- `textBlock`: use for every editable text region. Prefer this over raw HTML when possible.
- `shapeBlock`: use for cards, tags, separators, rectangles, and line work.
- `vectorBlock`: use for SVG paths from PPT assets or rebuilt diagrams.

### Tags / Labels

- Radius: `4-8px`, never overly pill-like unless the source requires it.
- Border: thin gradient or subtle white/gray line.
- Text must be vertically centered inside the rectangle.
- Use gradient text only for high-signal labels; supporting labels should be gray.

### Cards / Panels

- Dark card background: `rgba(255,255,255,0.04)` or near-black panel.
- Light card background: pale blue/white gradients for contrast pages.
- Radius: usually `6-8px`.
- Border: subtle, often gradient or `rgba(255,255,255,0.18)`.
- Avoid nested cards. A page section should not look like a UI dashboard unless the content is a product surface.

### Lines / Connectors

- Use short dashed lines with visible gap from boxes; do not let connectors touch card edges.
- Gradient dashed lines are preferred for important relationships.
- End caps should be round for line samples and guide-line components.
- Line weights should be intentional: `2px`, `4px`, `6px`, `8px`.

### Images

- Use real PPT assets from `dist/assets/pptx-media/` when reproducing the style.
- Prefer full-bleed or large art-directed image use; avoid small decorative blobs.
- Apply dark wash overlays when text needs contrast.
- Do not use a full-slide screenshot as the slide implementation unless explicitly requested.

## 5. Layout Principles

### Canvas

- Fixed design size: `1600 x 900`.
- All coordinates in `visualLayout` are canvas pixels.
- Runtime scaling is handled by `LarkSlides`; templates should not use viewport-relative font sizes.

### Composition

- Most pages are center-weighted: one main message, one supporting visual region.
- Use top/bottom bands only when the source visual calls for it.
- Leave generous margins: `96-160px` is normal for slide edges.
- Diagrams should be built from simple geometry: rectangles, lines, nodes, labels.
- Background image or shape layers should be placed first in `blocks`; text and vectors should sit above.

### Spacing Scale

Use this spacing vocabulary:

| Use | Value |
|---|---:|
| Hairline / line gap | `2-4px` |
| Small label padding | `8-12px` |
| Component gap | `16-24px` |
| Card internal padding | `28-40px` |
| Text block vertical rhythm | `32-56px` |
| Major layout gap | `72-120px` |
| Edge margin | `96-160px` |

### Alignment

- Center large claims exactly across the 1600px canvas unless the page is intentionally split.
- When using two cards, make their shape dimensions consistent.
- Keep connector lines shorter than the distance between cards; preserve visible breathing room.
- For numbers and labels, align baselines and optical centers, not only bounding boxes.

## 6. Depth & Elevation

Depth should be quiet and presentation-focused.

| Level | Treatment | Use |
|---|---|---|
| 0 | Flat black / white canvas | Default slide background |
| 1 | Subtle border, `rgba(255,255,255,0.12-0.22)` | Tags, panels, card shells |
| 2 | Soft glow, `rgba(80,175,255,0.30-0.75)` | Active guide lines, graph nodes |
| 3 | Dark image wash, `rgba(0,0,0,0.35-0.82)` | Text over image, cinematic slides |
| 4 | Light blue gradient panels | Business value contrast blocks |

Rules:

- Do not use heavy generic drop shadows.
- Do not add decorative gradient orbs, bokeh blobs, or random glows.
- Use depth to improve hierarchy and readability, not to decorate.
- Keep the player shell separate from slide depth; the shell shadow does not count as slide styling.

## 7. Do's and Don'ts

### Do

- Use `LarkSlides.createDeckSpec` for new decks.
- Use `LarkSlideTemplates.defineTemplate` for repeated page types.
- Use `LarkSlideTemplates.asset("assets/pptx-media")` to resolve local PPT assets.
- Use `visualLayout` for pages that need precise PPT-like positioning.
- Use gradient text for key claims: `先进团队`, `提效价值`, `供应链业务协同平台`, major metrics.
- Keep slides editable: text should be DOM text, not baked into screenshots.
- Verify visual changes with browser screenshots.
- Reuse source imagery and rebuilt diagrams from the reference deck.

### Don't

- Do not rebuild the deck as a screenshot playback shell.
- Do not make a marketing landing page instead of a slide.
- Do not use oversized rounded pills where the source uses rectangular tags.
- Do not introduce a new one-note purple, beige, or generic SaaS palette.
- Do not use random stock imagery, abstract blobs, or decorative SVG illustrations.
- Do not scale font sizes with viewport width. The canvas is fixed; runtime scales the canvas.
- Do not put UI cards inside other UI cards.
- Do not let text overflow or overlap preceding/subsequent content.
- Do not let dashed connectors fully touch both cards; keep visible gaps.

## 8. Responsive Behavior

The slide itself is not responsive in the normal web layout sense. It is a fixed 1600x900 composition scaled by the runtime.

Runtime behavior:

- `.ls-stage` keeps `aspect-ratio: 16 / 9`.
- `.ls-slide-inner` remains `1600px x 900px`.
- `LarkSlides.updateScale()` scales the inner canvas to the available stage size.
- Keyboard, hash navigation, and fullscreen must continue to work after scaling.

Authoring rules:

- Author every slide at 1600x900.
- Do not use `vw` for typography or slide geometry.
- Use canvas-relative pixel positions in `visualLayout`.
- For mobile viewing, rely on runtime scale. Only the player shell should adapt.
- Keep toolbar touch targets at least `36px`.

## 9. Agent Prompt Guide

### Quick Token Reference

```text
Canvas: 1600x900
Dark background: #000000
Player background: #111217
Primary text: #f7f8fb
Secondary text: #b5bac4
Deep blue: #1456f0
Cyan: #3ec3f7
Light blue: #ceeafe
Brand gradient: #e2fff7 -> #c8effa -> #b1d5f6 -> #80a3ff
Guide-line gradient: #ceeafe -> #3ec3f7 -> #1456f0
Radius: 4px, 6px, 8px
Hero text: 76-92px, 740-760 weight
Large metric: 96-120px, 760 weight
```

### Prompt: Create a New Business Case Deck

```text
Use the Lark DeckKit SDK and this design.md. Create a dark 16:9 HTML slide deck using createDeckSpec, defineTemplate, visualLayout, and components. Keep all text editable. Use PPT assets through LarkSlideTemplates.asset. The style should match the Lark visual sample: black canvas, large centered gradient claims, blue-cyan guide lines, precise rectangular tags, restrained card surfaces, and no screenshot playback shell.
```

### Prompt: Build One Precision Slide

```text
Create one visualLayout slide at 1600x900. Use imageBlock for background assets, textBlock for editable text, shapeBlock for rectangular cards/tags/lines, and vectorBlock only for necessary SVG. Apply brand or deep-blue gradient only to the headline and key metric. Keep body labels gray or white. Verify with a browser screenshot.
```

### Prompt: Convert PPT Style Into Reusable Templates

```text
Extract repeated slide patterns into LarkSlideTemplates.defineTemplate. Keep content data separate from visual layout. Use tokens for colors and gradients. Do not copy a whole existing slide as raw HTML when a reusable template can express the same structure.
```

### Prompt: Visual Review Checklist

```text
Compare every generated slide against the reference deck. Check: headline gradient direction, font weight, text centering, card shape consistency, tag radius, line gaps, connector dash length, image crop, overlay darkness, metric alignment, and whether all text remains editable.
```

## Source Alignment

This file follows the section model described by VoltAgent's `awesome-design-md` collection: visual theme, colors, typography, components, layout, depth, do/don't rules, responsive behavior, and agent prompt guidance.

References:

- https://github.com/VoltAgent/awesome-design-md
- https://stitch.withgoogle.com/docs/design-md/format/
