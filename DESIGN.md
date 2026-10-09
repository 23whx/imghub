---
version: 1.0
name: ImgHub Gallery
description: Warm theatrical gallery entrance with quiet editorial image-tool workspaces.
---

# ImgHub Gallery

The approved direction combines a burgundy-curtain, amber-lit entrance with an ivory gallery of image tools. The references are Kaori's portfolio for atmosphere and Runway's DESIGN.md for cinematic imagery and restrained chrome. These ideas are adapted to ImgHub's tools, not copied as a portfolio layout.

## Tokens

The implementation source of truth is src/styles/gallery.css; warm neutral utility colors live in tailwind.config.mjs.

| Token | Light | Dark |
| --- | --- | --- |
| Page | #f4f0e8 | #14120f |
| Surface | #fffdf8 | #211e1a |
| Soft surface | #eee8dd | #2b2722 |
| Ink | #2c251e | #eee6d6 |
| Secondary text | #75685b | #b3a797 |
| Border | #d5cbbb | #443a2f |
| Accent | #765323 | #d6b983 |
| Action fill | #dcc08b | #d6b983 |
| Action ink | #261c0e | #261c0e |

Use amber for the next action and active state. Preserve semantic colors and the original pixels/colors of user artwork. Tool previews are not recolored. Avoid blue gradients, glass panels, oversized rounded cards, or generic dashboard decoration.

## Typography

Cormorant Garamond is the Latin display face. Noto Serif SC / JP provides the shipped Chinese and Japanese display characters; system serif fonts cover other characters. Inter and system sans-serif fonts carry body text and controls. Fonts are self-hosted as WOFF2 with swap; licenses are bundled in public/assets/fonts/.

Titles use regular-weight serif typography, natural sentence case and restrained tracking. Forms use clear sans-serif labels, 14–16px text and 16px mobile inputs. Decorative Latin labels use 10px tracking; never use them for essential instructions.

## Layout and components

- Shared container: maximum 1380px, 56px desktop side margins, 20px mobile margins.
- Navigation: 80px desktop / 72px mobile, transparent over the hero and sticky on tool/content pages.
- Hero: generated textless gallery artwork, semantic HTML heading and actions; mobile art positioning and shading keep the title legible.
- Homepage: three featured exhibits, then a searchable/filterable tool collection derived from the public registry. Image content leads, followed by a number, title, description and small arrow.
- Workspaces: shared route heading and return link, bordered warm surfaces, 6px controls and 8px panels. Existing canvas processing and exports remain independent of styling.
- Reading pages: clear serif heading, restrained notice panel, readable text width and quiet separators.
- Footer: wordmark, one short tagline, tool navigation and existing legal/contact links.
- Grid: three exhibits per desktop row, two tool exhibits on mobile, one featured exhibit on mobile. Tool settings collapse to one column and previews fit the available width.

## Interaction and accessibility

Use semantic links, buttons and labeled controls, 44px touch targets, visible focus, expanded-state navigation and a skip link. Escape closes menus and restores focus. Search/filter state is announced. Keep essential content visible before hydration. Motion is a short entrance, gentle image sway and small hover cues; reduced-motion disables animation. Do not move interactive targets continuously.

Use light and dark token pairs throughout, including upload zones, empty states, legal pages and cookie consent. Avoid horizontal page overflow at 360px. Preserve all zh/en/ja route destinations and localized SEO metadata.

## Assets and references

- https://portfolio.kaori-dododo.com/
- https://www.inspora.design/posts/interactive-cards
- https://www.inspora.design/posts/scenic-footer-section
- https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/runwayml/DESIGN.md
- https://github.com/MengTo/threeui (spatial atmosphere reference; no WebGL dependency was needed)

Gallery artwork in public/assets/studio/ was generated for this project. Background imagery contains no baked-in navigation or UI text. All buttons, titles, labels and cards are implemented as real HTML/React controls.

## Image compression

Preserve the gallery tokens and restrained Runway reference. Place a labeled upload surface above a 310px settings panel and flexible results list; stack settings and results below 850px. Use amber for compression and active dimension presets, quiet borders for individual images, 44px controls, visible focus, 16px mobile inputs, and the shared dark theme. Keep original artwork colors and transparency independent of theme.

Show actual encoded bytes, dimensions, format and savings together so users can judge compression and quality. A modal displays original and result side by side, stacks on mobile, closes with Escape and restores focus. Settings changes mark previous results as stale until recompression. Include clear processing, cancellation, per-file failure and unmet-target states; avoid claims of guaranteed lossless results for JPG or WebP.

## Tool documentation and SEO

Keep the approved ImgHub Gallery system and compatible Runway DESIGN.md reference. Tool instructions use static semantic HTML beneath the workspace: a readable 1100px maximum width, quiet top separator, serif section headings, sans-serif body text, numbered steps, practical limits, visible questions and answers, and related tool links. Use existing ink, muted, surface, line and amber accent tokens in both themes. The two reading columns stack below 700px; links have 44px targets and visible keyboard focus. Keep processing controls ahead of the guide and preserve uploaded artwork colors. The original sharing graphic uses the same ivory and amber palette and contains real tool collection messaging.

## Drawing Studio

The online-drawing tool keeps the gallery tokens and Runway-inspired restrained chrome. Its workspace uses a compact tool rail, central canvas, and layer/properties panel. Amber identifies the active tool and primary export action. Controls use Inter/system sans-serif, 6px radii, visible focus and 44px targets. Artwork pixels and the transparency checkerboard are independent of the page theme. On small screens, the tool rail becomes horizontal and the layers panel moves below the canvas. Fullscreen expands the workspace without changing document resolution. The homepage preview is an original SVG sketch, rather than a copied editor screenshot.

MBTI uses the approved folded-paper character collection in public/assets/mbti/. Purple analysts, green diplomats, teal sentinels and gold explorers retain their own colors. Homepage thumbnails frame the faces; tool examples show the full figures. All 16 individual characters, four group examples and MBTI grid exports use WebP. User uploads can replace each example independently.

## AI watermark workspace

Preserve the gallery palette and compatible Runway DESIGN.md reference. Inspora's
interactive image cards inform the split-image homepage preview. The workspace
places a compact 280px control column beside a flexible image comparison, using
amber selected states and export actions, quiet borders and serif preview titles.
Below 900px the preview and controls stack; below 560px controls form one column.
All input text remains at least 16px on mobile. Image colors and transparency
remain independent of the site theme. Red indicates the repair mask; the eraser
edits only that mask. Explain first-use model loading, cancellation and unmatched
templates in the tool itself. Default to experimental whole-image reconstruction,
with labeled GPU/CPU, resolution, perturbation and seed controls. Show a quiet
amber unverified-watermark status and a report for actual device, duration and
PSNR (pixel difference, never a watermark verdict). Block outdated-parameter
exports until reprocessing. Keep visible-mark repair and metadata modes available.
Explain lossy reconstruction and local processing within the flow.


## Image enhancement workspace

Preserve ImgHub Gallery and the compatible Runway reference. Inspora image
cards inform the genuine low-resolution / enhanced homepage comparison.
Use a 280px control column, flexible image canvas, quiet surfaces and amber
selected actions. Show output dimensions before processing, label GPU/CPU and
strength controls, provide fit / 100% inspection and an original/result slider.
Stack preview before controls below 900px, with one settings column below560px.
Use 44px controls, 16px select text, semantic status and errors, cancel, and
prevent stale-setting exports. Preserve artwork colors and transparency in
both themes. Explain first-use model loading and inferred detail within the
workspace; avoid claims of lossless reconstruction or guaranteed face/text
recovery. Cases must be actual exported model results, never simulated sharpness.

## OCR workspace

Keep the gallery palette and compatible Runway reference. A quiet automatic
multilingual notice precedes the image/results columns. Amber marks actions and
selected scopes; green text boxes indicate ordinary results and muted red flags
low confidence. Artwork stays unchanged. Provide fit-width and scrollable 100%
preview, pointer selection, rotation, text editing and line review. Show actual
backend and duration. Stack columns below 900px, settings below 560px; controls
have 44px targets and mobile inputs use 16px. Model-loading, cancellation and
errors must be visible, with local processing and supported scripts explained.
