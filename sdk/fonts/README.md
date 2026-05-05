# Font Assets

This folder stores committed web fonts used by Lark DeckKit.

Rules:

- Store browser-facing fonts as `.woff2`, not source `.otf` or `.ttf`.
- Use ASCII filenames in the form `<Family>-<Weight>.woff2`.
- Register every committed font in `../fonts.css` and `../font-manifest.json`.
- Keep `font-display: swap` so decks render immediately while fonts load.
- Do not alias a missing brand font to a different family. If `TikTok Display` is needed, add licensed files and explicit `@font-face` declarations.

The current bundled family is `FZLanTingHeiPro_GB18030`, exported as full-glyph WOFF2 files so new Chinese decks do not miss characters.
