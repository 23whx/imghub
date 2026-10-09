# Homepage Alps background verification

- Built-in image edit replaces the central pudding artwork with Alpine snow peaks, pine forest and a lake. Visual review preserves the dark heading area, flower panel, collage, brass frames, curtains, lighting and floor composition.
- Active desktop asset: `public/assets/studio/gallery-hero-alps.webp`, real WebP, 1800 × 1029, 173724 bytes.
- Active mobile asset: `public/assets/studio/gallery-hero-alps-mobile.webp`, real WebP, 900 × 514, 58862 bytes.
- Homepage picture sources and shared layout image preloads use the same versioned paths. Existing backgrounds remain available for rollback.
- `npm run build` succeeded. Astro check reports 0 errors and 0 warnings; existing unused-variable hints remain.
- Browser at 1280px: desktop image fully loaded with natural size 1800 × 1029; preload paths match. Screenshot: `home-desktop.webp`.
- Browser at 360px: mobile WebP fully loaded with natural size 900 × 514; page scroll width 345px, no horizontal overflow. Visual review shows the alpine panel within the mobile gallery. Temporary viewport override reset after checking.
- Homepage image change is shared across the existing language routes. Tool example assets are unaffected.
