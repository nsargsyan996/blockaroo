"""App Store product page Header (iOS 27+) art.
Header only:  3840 x 1646 (21:9), art safe area 1646 x 661 at (1097, 493)
Universal:    5244 x 2950 (16:9, PNG), safe area 1402 x 962 at (1921, 660)
Key art (Roo + logo) stays inside the safe area; the rest is atmospheric 'auxiliary' art."""
import os, subprocess, random
from art import *
import build  # reuses stage(), glow(), logo_stacked() and writes the rest of the kit (idempotent)

OUT = 'out/8_app_store_header'
os.makedirs(OUT, exist_ok=True)

PIECES = [  # original block-piece shapes (cells as (col,row))
    [(0, 0), (1, 0), (0, 1), (1, 1)],
    [(0, 0), (1, 0), (2, 0)],
    [(0, 0), (0, 1), (1, 1)],
    [(0, 0), (1, 0), (1, 1), (2, 1)],
    [(0, 0), (0, 1), (0, 2), (1, 2)],
    [(0, 0)],
    [(0, 0), (1, 0)],
]


def piece(d, cells, x, y, s, color, rot=0):
    w = (max(c[0] for c in cells) + 1) * s; h = (max(c[1] for c in cells) + 1) * s
    inner = ''.join(block(d, cx * s, cy * s, s, color) for cx, cy in cells)
    return f'<g transform="translate({x},{y}) rotate({rot},{w/2},{h/2})">{inner}</g>'


def compose(W, H, sx, sy, sw, sh, name, debug=False, seed=7):
    d = Doc()
    rnd = random.Random(seed)
    cx, cy = sx + sw / 2, sy + sh / 2
    g = build.stage(d, W, H, cell=round(H / 9), cx=cx / W, cy=cy / H)
    g += build.glow(cx, cy, sh * 1.05, '#CFEBFF', .5)
    # auxiliary art: block pieces drifting in from both sides, gems and sparkles
    colors = list(J)
    s = H * .085
    slots = []
    for side in (0, 1):
        for k in range(6):
            fx = rnd.uniform(.02, .9) * sx if side == 0 else sx + sw + rnd.uniform(.1, .98) * (W - sx - sw)
            fy = H * (k / 6) + rnd.uniform(-.02, .06) * H
            slots.append((fx, fy))
    for i, (fx, fy) in enumerate(slots):
        cells = PIECES[i % len(PIECES)]
        g += piece(d, cells, fx - s, fy - s * .5, s * rnd.uniform(.75, 1.1), colors[i % 7], rot=rnd.choice([-14, -8, 6, 10, 15]))
    for i in range(8):
        side = i % 2
        gx = rnd.uniform(.08, .9) * sx if side == 0 else sx + sw + rnd.uniform(.08, .9) * (W - sx - sw)
        gy = rnd.uniform(.1, .9) * H
        f = [gem_diamond, gem_star, gem_heart][i % 3]
        g += f(d, gx, gy, H * .07, rot=rnd.uniform(-20, 20))
    for i in range(14):
        g += sparkle(rnd.uniform(0, W), rnd.uniform(0, H), H * rnd.uniform(.008, .02), '#fff', rnd.uniform(.5, .9))
    # key art inside the safe area: cheering Roo + stacked logo
    pad = sh * .04
    rh = sh - 2 * pad                                   # Roo height inside the safe area
    rsc = rh / 560
    lg, LW, LH = build.logo_stacked(d, 220)
    lsc = min((sh - 2 * pad) / LH, (sw - 400 * rsc - 3 * pad) / LW)
    total = 400 * rsc + pad + LW * lsc
    x0 = cx - total / 2
    g += f'<g transform="translate({x0},{sy + pad + 36*rsc}) scale({rsc})">{roo(d, "cheer")}</g>'
    g += f'<g transform="translate({x0 + 400*rsc + pad},{cy - LH*lsc/2}) scale({lsc})">{lg}</g>'
    if debug:
        g += (f'<rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" fill="none" stroke="#fff" stroke-width="{H/250}" '
              f'stroke-dasharray="{H/60} {H/90}"/>')
    svg = d.svg(W, H, g, title='Hoppy Blocks App Store header')
    p = f'{OUT}/{name}{"_safe_area_check" if debug else ""}'
    open(p + '.svg', 'w').write(svg)
    subprocess.run(['rsvg-convert', p + '.svg', '-o', p + '.png'], check=True)
    # stores refuse alpha: flatten to opaque RGB
    subprocess.run(['convert', p + '.png', '-background', BLUE, '-alpha', 'remove', '-alpha', 'off', p + '.png'], check=True)
    if debug:
        os.remove(p + '.svg')


compose(3840, 1646, 1097, 493, 1646, 661, 'header_3840x1646')
compose(3840, 1646, 1097, 493, 1646, 661, 'header_3840x1646', debug=True)
compose(5244, 2950, 1921, 660, 1402, 962, 'universal_5244x2950')
compose(5244, 2950, 1921, 660, 1402, 962, 'universal_5244x2950', debug=True)
print('header done')
