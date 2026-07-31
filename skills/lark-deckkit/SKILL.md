---
name: lark-deckkit
description: Create, revise, or review editable 16:9 Lark-style HTML slide decks with the Lark DeckKit SDK. Use for presentation narrative, slide layout, typography, reusable Lark visual components, product mockups, remote icon/logo selection, text-sidecar editing, and pre-publish deck validation.
---

# Lark DeckKit

Build editable HTML slides from structured content. Keep the output code-first: reference approved TOS assets by URL and never copy image, font, or PPTX binaries into the project.

## Workflow

1. Read [design-principles.md](references/design-principles.md).
2. Draft the narrative before choosing layouts. Give each slide one job.
3. Load the SDK:

```html
<div id="deck" data-lark-deck></div>
<script src="https://cdn.jsdelivr.net/gh/vibe-lark/lark-deckkit@main/sdk/lark-deckkit-loader.js"></script>
```

4. Prefer `LarkSlideTemplates.createDeckFromOutline()` for the first pass. Use `visualLayout()` and `components` only for pages that need precise composition.
5. If the deck needs an icon, logo, or Feishu product element, read [element-library.md](references/element-library.md) and use its public TOS URL directly.
6. For Feishu product UI diagrams, read the repository's `product-mocks/README.md` and use editable `.lpm-*` components instead of screenshots.
7. Keep a `texts.md` sidecar when the deck will go through copy revisions.
8. Run:

```bash
node scripts/validate_deck.js <html-file> --expect-slides <count>
```

9. Preview every slide at 1600×900. Fix overflow, weak hierarchy, cramped alignment, and repeated equal-weight cards before delivery.

## Output Rules

- Keep text, shapes, lines, and product mockups editable.
- Use one dominant focal point and generous negative space.
- Use remote asset URLs; do not download or embed binaries.
- Keep titles and body copy within the limits in `LarkSlideTemplates.qualityRules`.
- Treat remote availability as a dependency and keep asset URLs in inspectable code or a small manifest.
- Do not recreate the original PPT pixel-for-pixel when a simpler editable composition communicates the point better.

Read the repository's `sdk/README.md` only when advanced API or text-sidecar details are needed.
