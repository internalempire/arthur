#!/usr/bin/env python3
"""Build Arthur's digital SVG kit; optionally render PNG/ICO with local Chromium.

python3 tools/generate-brand.py
python3 tools/generate-brand.py --browser /path/to/chromium
No third-party Python packages or runtime application dependencies.
"""
import argparse
import copy
import html
import json
from pathlib import Path
import struct
import subprocess
import tempfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/brand'
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
MASTER = ET.parse(OUT / 'source/arthur-master.svg').getroot()
SYMBOL, WORD = MASTER.findall(f'{{{NS}}}g')
PALETTES = {
    'color': ('#1689C5', '#D4434B', '#182B3A'),
    'color-dark': ('#65C6F0', '#FF8088', '#FFFFFF'),
    'black': ('#111111',) * 3,
    'white': ('#FFFFFF',) * 3,
    'blue': ('#087DB5',) * 3,
    'red': ('#C93642',) * 3,
}


def group(source, colors, transform=None):
    node = copy.deepcopy(source)
    if transform is not None:
        node.set('transform', transform)
    for i, p in enumerate(node.iter(f'{{{NS}}}path')):
        p.set('fill', colors[min(i, len(colors) - 1)])
    return ET.tostring(node, encoding='unicode')


def svg(name, width, height, body, title='arthur'):
    text = (f'<svg xmlns="{NS}" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}" role="img" aria-label="{html.escape(title)}">'
            f'<title>{html.escape(title)}</title>{body}</svg>\n')
    (OUT / f'{name}.svg').write_text(text)


def build():
    for variant, (a, b, ink) in PALETTES.items():
        mark = group(SYMBOL, [a, b])
        word = group(WORD, [ink])
        svg(f'symbol-{variant}', 256, 256, mark)
        svg(f'logo-{variant}', 888, 256, mark + word)
        svg(f'wordmark-{variant}', 512, 144,
            group(WORD, [ink], 'translate(20 20)'))
        svg(f'stacked-{variant}', 512, 416,
            group(SYMBOL, [a, b], 'translate(128 0)') +
            group(WORD, [ink], 'translate(68 300) scale(.8)'))

    # Transparent SVG favicon responds to the browser/OS theme, independently
    # from the application's theme toggle. PNG/ICO fallbacks use a light tile.
    mark = group(SYMBOL, list(PALETTES['color'][:2]))
    mark = mark.replace('fill="#1689C5"', 'class="left" fill="#1689C5"')
    mark = mark.replace('fill="#D4434B"', 'class="right" fill="#D4434B"')
    svg('favicon', 256, 256,
        '<style>@media(prefers-color-scheme:dark){.left{fill:#65C6F0}.right{fill:#FF8088}}</style>' + mark)
    svg('app-icon', 256, 256,
        '<rect width="256" height="256" rx="48" fill="#F5F8FC"/>' +
        group(SYMBOL, list(PALETTES['color'][:2]), 'translate(20.48 20.48) scale(.84)'))

    for mode, variant, bg, muted in [
        ('light', 'color', '#F5F8FC', '#516574'),
        ('dark', 'color-dark', '#15232E', '#B8CDD9'),
    ]:
        a, b, ink = PALETTES[variant]
        body = (group(SYMBOL, [a, b]) + group(WORD, [ink]))
        svg(f'banner-{mode}', 1200, 360,
            f'<rect width="1200" height="360" rx="24" fill="{bg}"/>'
            f'<g transform="translate(245 48) scale(.8)">{body}</g>'
            f'<text x="600" y="289" text-anchor="middle" font-family="system-ui,sans-serif" '
            f'font-size="24" fill="{muted}">A teaching model of heart–lung interaction</text>',
            'arthur — a teaching model of heart–lung interaction')
    a, b, ink = PALETTES['color-dark']
    svg('social-card', 1200, 630,
        '<rect width="1200" height="630" fill="#15232E"/>'
        '<g transform="translate(156 146)">' + group(SYMBOL, [a, b]) + group(WORD, [ink]) + '</g>'
        '<text x="600" y="457" text-anchor="middle" font-family="system-ui,sans-serif" '
        'font-size="30" fill="#B8CDD9">A teaching model of heart–lung interaction</text>'
        '<text x="600" y="560" text-anchor="middle" font-family="system-ui,sans-serif" '
        'font-size="20" fill="#B8CDD9">internalempire.github.io/arthur</text>',
        'arthur — a teaching model of heart–lung interaction')
    (OUT / 'palette.json').write_text(json.dumps(PALETTES, indent=2) + '\n')


def raster(browser):
    # A temporary HTML viewport avoids Chrome's standalone-SVG viewer sizing.
    with tempfile.TemporaryDirectory(prefix='arthur-brand-') as temp:
        temp = Path(temp)
        def render(source, target, width, height):
            body = (OUT / f'{source}.svg').read_text().replace(
                'role="img"', 'style="display:block;width:100%;height:100%" role="img"', 1)
            page = temp / 'render.html'
            page.write_text(f'<html><head><meta charset="utf-8"><style>html,body{{margin:0;width:100%;height:100%;overflow:hidden}}</style></head><body>{body}</body></html>')
            subprocess.run([browser, '--headless', '--no-sandbox', '--disable-gpu',
                '--disable-dev-shm-usage', '--hide-scrollbars', '--no-first-run',
                f'--user-data-dir={temp / "profile"}', '--default-background-color=00000000',
                '--force-device-scale-factor=1', f'--window-size={width},{height}',
                f'--screenshot={OUT / target}', page.as_uri()], check=True,
                stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=45)
            data = (OUT / target).read_bytes()
            assert data[:8] == b'\x89PNG\r\n\x1a\n'
            assert struct.unpack('>II', data[16:24]) == (width, height), target
        for size in (16, 32, 48):
            render('app-icon', f'favicon-{size}.png', size, size)
        for size in (180, 192, 512):
            render('app-icon', f'icon-{size}.png', size, size)
        for variant in PALETTES:
            render(f'symbol-{variant}', f'symbol-{variant}.png', 512, 512)
            render(f'logo-{variant}', f'logo-{variant}.png', 1332, 384)
        render('social-card', 'social-card.png', 1200, 630)
        # ICO directory with three lossless PNG frames (16, 32, 48 px).
        frames = [(s, (OUT / f'favicon-{s}.png').read_bytes()) for s in (16, 32, 48)]
        offset = 6 + 16 * len(frames)
        entries = []
        for size, data in frames:
            entries.append(struct.pack('<BBBBHHII', size, size, 0, 0, 1, 32, len(data), offset))
            offset += len(data)
        (OUT / 'favicon.ico').write_bytes(struct.pack('<HHH', 0, 1, len(frames)) + b''.join(entries) + b''.join(d for _, d in frames))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser', help='Chromium executable; omit to regenerate SVG only')
    args = parser.parse_args()
    build()
    if args.browser:
        raster(args.browser)
    print('Arthur digital assets generated in assets/brand/')
