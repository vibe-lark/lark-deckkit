# Lark DeckKit Font Standard

## Decision

Lark DeckKit treats fonts as SDK assets. Every deck that wants the project visual style must load `sdk/fonts.css` before `sdk/lark-slides.css`.

```html
<link rel="stylesheet" href="./sdk/fonts.css" />
<link rel="stylesheet" href="./sdk/lark-slides.css" />
```

For HTML files inside `dist/`, use:

```html
<link rel="stylesheet" href="../sdk/fonts.css" />
<link rel="stylesheet" href="../sdk/lark-slides.css" />
```

## Bundled Fonts

The committed primary family is `FZLanTingHeiPro_GB18030`.

| Weight | File |
|---:|---|
| 200 | `sdk/fonts/FZLanTingHeiProGB18030-ExtraLight.woff2` |
| 300 | `sdk/fonts/FZLanTingHeiProGB18030-Light.woff2` |
| 400 | `sdk/fonts/FZLanTingHeiProGB18030-Regular.woff2` |
| 500 | `sdk/fonts/FZLanTingHeiProGB18030-Medium.woff2` |
| 600 | `sdk/fonts/FZLanTingHeiProGB18030-SemiBold.woff2` |
| 650 | `sdk/fonts/FZLanTingHeiProGB18030-DemiBold.woff2` |
| 700 | `sdk/fonts/FZLanTingHeiProGB18030-Bold.woff2` |
| 800 | `sdk/fonts/FZLanTingHeiProGB18030-ExtraBold.woff2` |
| 900 | `sdk/fonts/FZLanTingHeiProGB18030-Heavy.woff2` |

The files are full-glyph WOFF2 exports, not Chinese subsets, so new document-generated decks can use arbitrary Chinese text.

## Font Stacks

Use the CSS variables from `sdk/fonts.css`:

```css
font-family: var(--ld-font-display);
font-family: var(--ld-font-zh);
font-family: var(--ld-font-ui);
```

Default meaning:

- `--ld-font-display`: hero titles and keynote-style claims.
- `--ld-font-zh`: Chinese headings, body labels, metrics labels.
- `--ld-font-ui`: player chrome, controls, lightweight SDK templates.

## New Deck Rule

Every new HTML deck should start from this head:

```html
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="./sdk/fonts.css" />
  <link rel="stylesheet" href="./sdk/lark-slides.css" />
</head>
```

Then use `LarkSlideTemplates.tokens.fonts` or the CSS variables instead of hardcoding one-off font stacks.

## Magic Pages Rule

Magic Pages cannot load repo-local font files. Publishing must:

1. Upload `sdk/fonts/` to Magic TOS/CDN.
2. Write the returned URLs into `dist/magic-fonts-manifest.json`.
3. Run `python3 scripts/build_magic_page.py`, which inlines `fonts.css` and rewrites font URLs to CDN URLs.
4. Publish `dist/lark-deckkit-magic.html`.

## Optional Fonts

`TikTok Display` is referenced by the original PPT and remains an optional font family in the stack. It is not bundled in this repo because the file is not currently available here. Do not alias `TikTok Display` to another font. If a licensed WOFF2 file is available later, add it under `sdk/fonts/`, register it in `sdk/fonts.css`, and update `sdk/font-manifest.json`.

## Licensing Rule

Only commit font files that the project is allowed to redistribute. If a deck is internal-only, publish the font through the internal Magic CDN flow rather than adding an unlicensed binary to the public repo.
