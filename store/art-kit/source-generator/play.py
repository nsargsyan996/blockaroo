"""Google Play extras: feature graphic v2 (real gameplay board + Roo + logo) and the 512 px store icon."""
import os, io, base64, subprocess
from PIL import Image, ImageDraw
from art import *
import build
from shots import caption_line, SRC

OUT = 'out/10_google_play'
os.makedirs(OUT, exist_ok=True)


def uri(im):
    b = io.BytesIO(); im.save(b, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


# ---------------- feature graphic 1024 x 500
W, H = 1024, 500
d = Doc()
g = build.stage(d, W, H, cell=64, cx=.62, cy=.5)
g += build.glow(790, 250, 260, '#CFEBFF', .5) + build.glow(300, 230, 260, '#9FD8FF', .3)
# edge decoration (non-critical, allowed to crop)
g += (block(d, -36, 392, 104, 'emerald', rot=-10) + block(d, 960, -34, 100, 'rose', rot=-8)
      + block(d, 968, 402, 96, 'amber', rot=10) + block(d, -30, -40, 96, 'amethyst', rot=12))
# real board from the Adventure capture (the one with the hidden diamond)
board = Image.open(SRC + '67ee1253-image.png').convert('RGB').crop((30, 722, 1176, 1868))
bs = 316; bx, by = 800 - bs / 2, 250 - bs / 2
g += (f'<g transform="rotate(7,800,250)">'
      f'<rect x="{bx-10}" y="{by-2}" width="{bs+20}" height="{bs+20}" rx="34" fill="{NAVY}" opacity=".45"/>'
      f'<rect x="{bx-10}" y="{by-10}" width="{bs+20}" height="{bs+20}" rx="34" fill="{NAVY}"/>'
      f'<clipPath id="bd"><rect x="{bx}" y="{by}" width="{bs}" height="{bs}" rx="26"/></clipPath>'
      f'<image href="{uri(board)}" x="{bx}" y="{by}" width="{bs}" height="{bs}" clip-path="url(#bd)"/></g>')
g += gem_star(d, 958, 128, 56, rot=14) + gem_heart(d, 640, 88, 44, rot=-14)
g += sparkle(965, 300, 16, '#fff', .9) + sparkle(600, 430, 12, '#fff', .8)
# Roo cheering in front of the board's lower-left corner
g += f'<g transform="translate(560,150) scale(.62)">{roo(d, "cheer", ground=False)}</g>'
# logo + tagline, left
lw, LW_, _ = word(d, 'Hoppy Blocks', 100, WM_COLORS)
k = 520 / LW_
g += f'<g transform="translate({300 - LW_*k/2},{238}) scale({k})">{lw}</g>'
tl, _ = caption_line(d, 'Drag. Drop. *Clear lines!*', 40, 300, 318)
g += tl
svg = d.svg(W, H, g, title='Hoppy Blocks feature graphic')
open(f'{OUT}/feature_graphic_1024x500.svg', 'w').write(svg)
subprocess.run(['rsvg-convert', f'{OUT}/feature_graphic_1024x500.svg', '-o', f'{OUT}/feature_graphic_1024x500.png'], check=True)
subprocess.run(['convert', f'{OUT}/feature_graphic_1024x500.png', '-background', BLUE, '-alpha', 'remove', '-alpha', 'off',
                f'{OUT}/feature_graphic_1024x500.png'], check=True)
os.remove(f'{OUT}/feature_graphic_1024x500.svg')  # embeds the capture; PNG is the deliverable

# ---------------- 512 px Play icon (+ preview through Google's rounded mask)
ic = Image.open('out/1_app_icon/app_icon_1024.png').convert('RGB').resize((512, 512), Image.LANCZOS)
ic.save(f'{OUT}/play_icon_512.png')
m = Image.new('L', (512, 512), 0)
ImageDraw.Draw(m).rounded_rectangle((0, 0, 511, 511), radius=int(512 * .2), fill=255)
prev = Image.new('RGB', (512, 512), (230, 232, 240)); prev.paste(ic, (0, 0), m)
prev.save('test/play_icon_masked.png')
print('play done')
