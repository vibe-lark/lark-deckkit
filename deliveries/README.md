# Lark DeckKit Delivery Warehouse

`deliveries/` is the engineering delivery layer for DeckKit output. It keeps
source material, generated HTML, validation evidence, and human review notes in
one run folder.

## Create a Run

```bash
node scripts/delivery_new.js --slug customer-brief
```

This creates:

```text
deliveries/<YYYYMMDD-HHMMSS>-customer-brief/
├── DELIVERY.md
├── input/
│   └── brief.md
└── output/
```

## Finalize a Deck

Use an existing DeckKit HTML file as the source:

```bash
node scripts/delivery_finalize.js \
  --run deliveries/<run> \
  --source sdk/quickstart.html \
  --expect-slides 3 \
  --name lark-demo-2026-05-09
```

The finalizer writes:

```text
output/
├── index.html
├── lark-demo-2026-05-09.html
├── delivery-manifest.json
├── CHECKLIST.md
└── FEEDBACK.md
```

## Gate Model

- Automated gate: `scripts/validate_deck.js` checks DeckKit structure, runtime
  entry, slide count, and density warnings.
- Manual gate: Front Design Review checks screenshots for hierarchy, spacing,
  clipping, composition, and whether the page reads as a presentation slide.

The default mode is `linked-local`: generated HTML links back to this repo's
SDK, fonts, and assets with rewritten relative paths. Use existing Magic
publishing scripts when the deck needs to leave the repo as a hosted page.
