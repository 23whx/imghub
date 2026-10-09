# Bilibili thumbnails: static frontend verification

## Architecture

- Astro static output is retained. The temporary Node adapter and runtime image endpoint were removed, and the obsolete Bilibili API route was deleted.
- No server, Vercel Function, proxy service or API key is required.
- The browser creates a classic script for the fixed Bilibili public `x/web-interface/view` endpoint with `jsonp=jsonp`, a random callback name and `referrerPolicy=no-referrer`.
- Only validated BV/AV identifiers reach that endpoint. Returned cover URLs are restricted to Bilibili's archive image CDN and normalized to HTTPS.
- The browser fetches the cover with CORS, decodes it and uses Canvas to encode an actual WebP at its original dimensions. No JPEG bytes renamed as WebP.
- b23 short-link redirects cannot be read by a static browser app without a cooperating service. The tool offers a link to open the short URL and asks the user to paste the full video URL; it does not claim automatic short-link resolution.

## Verification

- `node --test tests/video-thumbnail.test.mjs`: 6 tests passed, including link parsing, host validation, response errors, JSONP callback cleanup, cancellation and timeout.
- `npm run build`: static output, 68 pages, 0 Astro errors, 0 warnings (existing unused-variable hints remain).
- Actual browser on the static preview: full Bilibili link / BV ID / AV ID all load metadata and covers. AV170001 maps to BV17x411w7KC.
- Bilibili example BV1GBa66HEC7: title and creator shown, actual image size 1076 × 608. Browser-generated downloaded file copied to `bilibili-cover.webp`; Sharp confirms WebP and the same dimensions.
- YouTube example jNQXAC9IVRw: multiple qualities displayed; unavailable HD variants are disabled with a message. HQ downloads as a real 480 × 360 WebP, copied to `youtube-cover.webp`.
- Unsupported b23 input shows the full-link instruction and external short-link button. A lookalike Bilibili host is rejected before requesting metadata.
- At 360px, page scroll width is 345px and input text is 16px; no horizontal overflow. Temporary viewport reset after checking.
- Completed Bilibili requests leave no JSONP scripts in the DOM. Bilibili result browser console contains no errors or warnings.
- Chinese, English and Japanese UI, tool cards and SEO now describe both Bilibili and YouTube. The workspace guide describes the actual paste / preview / download workflow.
- Screenshot: `tool-desktop.webp`.

Public platform APIs and CDN policies remain controlled by the respective platforms. Deleted/unavailable videos, request failures and timeouts are reported in the interface.
