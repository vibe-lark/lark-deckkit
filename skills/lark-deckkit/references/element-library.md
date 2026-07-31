# Remote Element Library

Use the lightweight catalog first:

- Entry point: https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/llms.txt
- Search page: https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/index.html

Load only the relevant machine-readable index:

- Feishu product assets: https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/product-assets.json
- General icons: https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/general-icons.json
- Brand and customer logos: https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/brand-customer-logos.json
- Full audit index: https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/assets-index.json

## Selection rules

- Use product assets for Feishu app icons and product logos.
- Use general icons for concepts, process nodes, capabilities, and status.
- Use brand/customer logos only when the deck has authorization to show them.
- Do not treat screenshots, photos, slogans, metrics text, or decorative lines as reusable UI elements.
- Do not stretch, crop, recolor, or redraw logos.
- Reference the selected `url` directly from HTML or deck data; do not download it into the repository.
