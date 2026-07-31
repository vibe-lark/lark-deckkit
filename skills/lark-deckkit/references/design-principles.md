# Design Principles

## Canvas and hierarchy

- Use a fixed 1600×900 canvas.
- Give each slide one clear communication job.
- Establish one dominant focal point; make supporting copy visibly secondary.
- Prefer negative space over decorative containers.
- Use columns only for real comparison, sequence, or ownership.

## Typography

- Hero claim: 76–92 px, weight 740–760.
- Section claim: 58–68 px, weight 700–760.
- Subtitle: 28–40 px, weight 400–600.
- Body: 20–28 px, weight 400–600.
- Microcopy: 12–18 px.
- Load `sdk/fonts.css` before `sdk/lark-slides.css`.
- Use `var(--ld-font-display)`, `var(--ld-font-zh)`, and `var(--ld-font-ui)`.

## Color and depth

- Base dark canvas: near-black blue.
- Primary accent: `#1456f0`.
- Cyan accent: `#3ec3f7`.
- Use the built-in brand gradient for important claims.
- Use borders, shadows, and glows sparingly; depth must explain grouping or focus.

## Components

- Keep tags rectangular and precise; avoid excessive pill shapes.
- Avoid nested card grids and repeated equal-weight boxes.
- Prefer short labels beside icons.
- Keep logos at their original aspect ratio and use approved variants.
- Use product mock components for editable UI demonstrations.

## Review checklist

- No text overflow or clipped controls.
- No body copy below the recommended scale.
- No more than one primary focal point.
- No unnecessary local images, fonts, or generated binaries.
- Remote assets have descriptive alt text where meaningful.
- The deck works with keyboard navigation and at the intended viewport.
