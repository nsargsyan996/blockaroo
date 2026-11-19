"""Store screenshots: real gameplay captures placed on the Hoppy Blocks stage with a headline."""
import os, sys, base64, io, subprocess
from PIL import Image
from art import *
from art import glyphs
import build

SRC = '/mnt/user-data/attachments/eaf84a3c-8978-546c-9a23-002f7bdf6bb3/'
OUT = 'out/9_store_screenshots'
os.makedirs(OUT, exist_ok=True)
STATUS_BAR = 170  # px cropped off the top of each capture (clock, signal, battery)

SHOTS = [  # (file, headline lines; words wrapped in * are highlighted in topaz)
    ('84582429-image.png', ['Drag, drop &', '*clear lines!*']),
    ('67ee1253-image.png', ['Find hidden', '*gems*']),
    ('f8225f7a-image.png', ['*100 levels* of', 'Adventure']),
    ('fc12064f-image.png', ['Cheer with Roo', 'for *3 stars!*']),
    ('4273b8e2-image.png', ['*Classic* or', '*Adventure*?']),
]


def caption_line(d, text, size, cx, baseline):
    """Headline in the logo's typeface: white (or topaz) letters, chunky navy rim, drop shadow."""
    plain = text.replace('*', '')
    hi, on = [], False
    for ch in text:
        if ch == '*':
            on = not on; continue
        hi.append(on)
    gl, W = glyphs(plain, size, track=size * .02)
    x0 = cx - W / 2
    ow = size * .13
    sh = rim = fill = ''
    for (ch, path, solid, x, w), h in zip(gl, hi):
        if ch == ' ':
            continue
        col = J['topaz'] if h else '#FFFFFF'
        sh += f'<path d="{solid}" transform="translate(0,{size*.07:.1f})" fill="{NAVY}" stroke="{NAVY}" stroke-width="{ow*2:.1f}" stroke-linejoin="round" opacity=".55"/>'
        rim += f'<path d="{solid}" fill="{NAVY}" stroke="{NAVY}" stroke-width="{ow*2:.1f}" stroke-linejoin="round"/>'
        fill += f'<path d="{path}" fill="{col}"/>'
    return f'<g transform="translate({x0:.1f},{baseline:.1f})">{sh}{rim}{fill}</g>', W


def shot_uri(fn):
    im = Image.open(SRC + fn).convert('RGB')
    im = im.crop((0, STATUS_BAR, im.width, im.height))
    buf = io.BytesIO(); im.save(buf, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode(), im.width / im.height


def make(W, H, idx, fn, lines, tag):
    d = Doc()
    u = W / 1290
    g = build.stage(d, W, H, cell=round(120 * u), cy=.3)
    # headline (top band)
    size = 118 * u
    top_band = H * .2
    lh = size * 1.12
    y = top_band / 2 - (len(lines) - 1) * lh / 2 + size * .38 + H * .012
    for i, ln in enumerate(lines):
        svg, w = caption_line(d, ln, size, W / 2, y + i * lh)
        if w > W * .88:  # shrink an over-long line
            k = W * .88 / w
            svg = f'<g transform="translate({W/2},{y+i*lh}) scale({k}) translate({-W/2},{-(y+i*lh)})">{svg}</g>'
        g += svg
    # screenshot card
    uri, asp = shot_uri(fn)
    sh = H - top_band - H * .045
    sw = sh * asp
    if sw > W * .86:
        sw = W * .86; sh = sw / asp
    sx, sy = (W - sw) / 2, top_band + H * .01
    r = 64 * u * (sw / 1010 / u)
    bez = 14 * u
    cid = f'sc{idx}'
    # decorations peeking from behind the card
    g += block(d, sx - 90 * u, sy + sh * .1, 150 * u, ['ruby', 'aqua', 'emerald', 'amethyst', 'amber'][idx % 5], rot=-14)
    g += block(d, sx + sw - 60 * u, sy + sh * .62, 140 * u, ['topaz', 'rose', 'aqua', 'emerald', 'ruby'][idx % 5], rot=12)
    g += gem_star(d, sx + sw + 10 * u, sy + 40 * u, 80 * u, rot=14) if idx % 2 == 0 else gem_heart(d, sx - 10 * u, sy + 40 * u, 74 * u, rot=-12)
    g += (f'<rect x="{sx-bez}" y="{sy-bez+18*u}" width="{sw+2*bez}" height="{sh+2*bez}" rx="{r+bez}" fill="{NAVY}" opacity=".45"/>'
          f'<rect x="{sx-bez}" y="{sy-bez}" width="{sw+2*bez}" height="{sh+2*bez}" rx="{r+bez}" fill="{NAVY}"/>'
          f'<clipPath id="{cid}"><rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" rx="{r}"/></clipPath>'
          f'<image href="{uri}" x="{sx}" y="{sy}" width="{sw}" height="{sh}" preserveAspectRatio="xMidYMin slice" clip-path="url(#{cid})"/>')
    g += sparkle(sx - 30 * u, sy + sh * .45, 18 * u, '#fff', .8) + sparkle(sx + sw + 30 * u, sy + sh * .3, 14 * u, '#fff', .7)
    name = f'{tag}_{idx+1:02d}'
    p = f'{OUT}/{name}'
    open(p + '.svg', 'w').write(d.svg(W, H, g, title=f'Hoppy Blocks screenshot {idx+1}'))
    subprocess.run(['rsvg-convert', p + '.svg', '-o', p + '.png'], check=True)
    subprocess.run(['convert', p + '.png', '-background', BLUE, '-alpha', 'remove', '-alpha', 'off', p + '.png'], check=True)
    os.remove(p + '.svg')  # svg embeds the capture; the PNG is the deliverable


if __name__ == '__main__':
  for i, (fn, lines) in enumerate(SHOTS):
    make(1206, 2622, i, fn, lines, 'iphone_1206x2622')  # App Store Connect 'iPhone with Dynamic Island (medium display)'
    make(1080, 1920, i, fn, lines, 'android_1080x1920')
print('shots done')
