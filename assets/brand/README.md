# Arthur digital identity

B2b “Fluida”: two rounded forms separated by a transparent channel. Its width is
32 units measured perpendicular to the curved centreline in the 256-unit symbol.
The approved source and outlined lowercase lettering live in `source/arthur-master.svg`.
No font, external image service or JavaScript is required to display the logo.

[Preview and download the digital kit](https://internalempire.github.io/arthur/assets/brand/).

## Choose an asset

| Use | Files |
| --- | --- |
| App/manual header, slides, digital documents | `logo-color.svg`, `logo-color-dark.svg` |
| Symbol without lettering | `symbol-*.svg` / `symbol-*.png` |
| Monochrome | `*-black.svg`, `*-white.svg`, `*-blue.svg`, `*-red.svg` |
| Vertical composition / lettering alone | `stacked-*.svg`, `wordmark-*.svg` |
| GitHub README header | `banner-light.svg`, `banner-dark.svg` |
| Link preview, 1200 × 630 | `social-card.png` (editable `social-card.svg`) |
| Browser tab | `favicon.svg`, fallback `favicon.ico` (16/32/48 px) |
| Saved shortcut / touch icon | `icon-180.png`, `icon-192.png`, `icon-512.png` |

Transparent PNGs: symbols at 512 × 512, horizontal logos at 1332 × 384.
SVG remains the preferred choice at any display density. Banner descriptions use
system fonts; the logo lettering itself consists entirely of paths.

## Screen colours

| Role | Light background | Dark background |
| --- | --- | --- |
| Left form, sky blue (air/lungs) | `#1689C5` · RGB 22,137,197 | `#65C6F0` · RGB 101,198,240 |
| Right form, red (blood/heart) | `#D4434B` · RGB 212,67,75 | `#FF8088` · RGB 255,128,136 |
| Lettering | `#182B3A` · RGB 24,43,58 | `#FFFFFF` · RGB 255,255,255 |

Monochrome: black `#111111`, white `#FFFFFF`, blue `#087DB5` or red `#C93642`.
The monochrome blue/red tones are slightly deeper to keep the small lettering
legible. Banner backgrounds: `#F5F8FC` and `#15232E`.

Sky blue evokes air and the lungs; red evokes blood and the heart. The two forms
symbolise their interaction. These are identity colours, not a key to measured
signals, oxygen saturation or the current physiological state. The simulator's
clinical signal colours are specified separately.

## Display rules

Preserve aspect ratio, the transparent channel and the relative placement of the
two forms. Do not move one form independently, stretch, outline, add shadows or
fill the central channel. Use the dark-background version on dark surfaces.
Keep at least 32 symbol units of clear space around the visible mark; in compact
headers the SVG canvas supplies most of this margin. Recommended display sizes:
symbol ≥16 px; horizontal logo ≥90 px wide; stacked logo ≥120 px wide. Below the
horizontal minimum, use the symbol alone. The unchanged symbol works at favicon
size; no separate geometry is introduced.

`theme.css` switches the app/manual artwork using their existing theme selection,
with an OS-theme fallback. The SVG favicon follows the browser/OS preference,
independently of the in-page theme. PNG/ICO icons have their own light background.
The README uses a `picture` element for light/dark artwork. Saved shortcut icons
do not introduce an offline mode or installable web-app functionality.

## Rebuild

```sh
python3 tools/generate-brand.py
# Also regenerate transparent PNGs and the multi-size ICO with local Chromium:
python3 tools/generate-brand.py --browser /path/to/chromium
```

The generator uses only Python's standard library; Chromium is an optional local
export tool, never a runtime dependency. It reads the checked-in master, not the
private design experiments or an installed skill. This kit is for digital use.
