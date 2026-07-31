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

## Hosted Fonts

The primary family is `FZLanTingHeiPro_GB18030`. Font binaries live on TOS and are referenced by `sdk/fonts.css` and `sdk/font-manifest.json`.

| Weight | Manifest entry |
|---:|---|
| 200 | `FZLanTingHeiProGB18030-ExtraLight.woff2` |
| 300 | `FZLanTingHeiProGB18030-Light.woff2` |
| 400 | `FZLanTingHeiProGB18030-Regular.woff2` |
| 500 | `FZLanTingHeiProGB18030-Medium.woff2` |
| 600 | `FZLanTingHeiProGB18030-SemiBold.woff2` |
| 650 | `FZLanTingHeiProGB18030-DemiBold.woff2` |
| 700 | `FZLanTingHeiProGB18030-Bold.woff2` |
| 800 | `FZLanTingHeiProGB18030-ExtraBold.woff2` |
| 900 | `FZLanTingHeiProGB18030-Heavy.woff2` |

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

Publishing must:

1. Keep `sdk/font-manifest.json` and `dist/magic-fonts-manifest.json` aligned.
2. Run `python3 scripts/build_magic_page.py`, which inlines `fonts.css`.
3. Publish `dist/lark-deckkit-magic.html`.

## Optional Fonts

`TikTok Display` is referenced by the original PPT and remains an optional font family in the stack. It is not hosted by this project. Do not alias it to another family. If a licensed WOFF2 file is available later, upload it to the approved CDN, register the URL in `sdk/fonts.css`, and update `sdk/font-manifest.json`.

## Licensing Rule

Do not commit font binaries. For internal-only decks, publish licensed fonts through the approved internal CDN flow.
