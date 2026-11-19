"""Store screenshots v2 — one continuous panorama sliced into N frames.
Bigger 2-line headlines, hero first frame (logo + Roo), tilted phones that fill the frame,
a magnifier on the hidden gem, Roo interacting with the phones, and block pieces that run
across frame boundaries so the set reads as one strip on the store page."""
import os, io, base64, random, subprocess, math
from PIL import Image
from art import *
import build
from shots import caption_line, SRC, STATUS_BAR

OUT = 'out/9_store_screenshots'
os.makedirs(OUT, exist_ok=True)

GEM_CELL = (262, 1500)  # centre of the diamond cell in 67ee1253 (source px)

PANELS = [
    dict(fn='84582429-image.png', hero=True, lines=['Drag. Drop. *Clear lines!*'], tilt=-3, roo=('wink', 'top_right')),
    dict(fn='67ee1253-image.png', lines=['Hunt hidden', '*gems*'], tilt=3, zoom=GEM_CELL),
    dict(fn='f8225f7a-image.png', lines=['*100* fun', 'levels'], tilt=-3, roo=('cheer', 'bottom_left')),
    dict(fn='fc12064f-image.png', lines=['Win all', '*3 stars!*'], tilt=3),
    dict(fn='4273b8e2-image.png', lines=['*2* ways', 'to play'], tilt=-3, roo=('happy', 'top_left')),
]


def uri_of(im):
    b = io.BytesIO(); im.save(b, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def load(fn):
    im = Image.open(SRC + fn).convert('RGB')
    return im, im.crop((0, STATUS_BAR, im.width, im.height))


def headline(d, lines, W, cx, top, size):
    g = ''; lh = size * 1.08
    for i, ln in enumerate(lines):
        y = top + size * .78 + i * lh
        svg, w = caption_line(d, ln, size, cx, y)
        if w > W * .9:
            k = W * .9 / w
            svg = f'<g transform="translate({cx},{y}) scale({k}) translate({-cx},{-y})">{svg}</g>'
        g += svg
    return g


def build_set(W, H, tag, seed=11):
    N = len(PANELS)
    d = Doc()
    rnd = random.Random(seed)
    u = W / 1206
    TW = W * N
    g = build.stage(d, TW, H, cell=round(120 * u), cx=.5, cy=.25)
    for i in range(N):  # a glow behind every headline + phone
        g += build.glow(W * i + W / 2, H * .45, H * .42, '#BFE6FF', .35)
    # pieces straddling the frame boundaries (drawn behind the phones)
    from header import PIECES, piece
    cols = list(J)
    for k in range(1, N):
        for j, fy in enumerate((rnd.uniform(.3, .4), rnd.uniform(.72, .85))):
            s = 105 * u
            cells = PIECES[(k * 2 + j) % len(PIECES)]
            pw = (max(c[0] for c in cells) + 1) * s
            g += piece(d, cells, W * k - pw / 2, H * fy, s, cols[(k * 3 + j) % 7], rot=rnd.choice([-12, -7, 8, 13]))
    for i in range(N * 3):
        g += sparkle(rnd.uniform(0, TW), rnd.uniform(.05, .95) * H, rnd.uniform(10, 22) * u, '#fff', rnd.uniform(.5, .9))
    gems = [gem_star, gem_heart, gem_diamond]
    for i in range(N):
        g += gems[i % 3](d, W * i + rnd.choice([.08, .92]) * W, H * rnd.uniform(.25, .3), 64 * u, rot=rnd.uniform(-18, 18))

    for i, p in enumerate(PANELS):
        x0 = W * i
        cx = x0 + W / 2
        full, shot = load(p['fn'])
        asp = shot.width / shot.height
        # --- headline: whole block kept inside the top 17% (Google: taglines <= 20% of the image)
        band = H * .17
        if p.get('hero'):
            lw, LW_, _ = word(d, 'Hoppy Blocks', 150 * u, WM_COLORS)
            k = min(W * .88 / LW_, band * .58 / (150 * u * 1.05))
            g += f'<g transform="translate({cx - LW_*k/2},{H*.022 + 150*u*.86*k}) scale({k})">{lw}</g>'
            tsz = min(band * .3, 86 * u)
            g += headline(d, p['lines'], W, cx, H * .022 + band * .62, tsz)
        else:
            hs = min(150 * u, band / 2.32)
            g += headline(d, p['lines'], W, cx, H * .022, hs)
        top = band + H * .035
        # --- phone (tilted, bleeding off the bottom edge so it fills the frame)
        ch = H * 1.05 - top
        cw = ch * asp
        if cw > W * .86:
            cw = W * .86; ch = cw / asp
        sx, sy = cx - cw / 2, top
        r = 70 * u; bez = 16 * u
        cid = f'ph{tag}{i}'
        rot = f'rotate({p["tilt"]},{cx},{sy + ch/2})'
        g += (f'<g transform="{rot}">'
              f'<rect x="{sx-bez}" y="{sy-bez+26*u}" width="{cw+2*bez}" height="{ch+2*bez}" rx="{r+bez}" fill="{NAVY}" opacity=".4"/>'
              f'<rect x="{sx-bez}" y="{sy-bez}" width="{cw+2*bez}" height="{ch+2*bez}" rx="{r+bez}" fill="{NAVY}"/>'
              f'<rect x="{sx-bez+4*u}" y="{sy-bez+4*u}" width="{cw+2*bez-8*u}" height="{ch+2*bez-8*u}" rx="{r+bez-4*u}" fill="none" stroke="#5B86FF" stroke-width="{4*u}" opacity=".7"/>'
              f'<clipPath id="{cid}"><rect x="{sx}" y="{sy}" width="{cw}" height="{ch}" rx="{r}"/></clipPath>'
              f'<image href="{uri_of(shot)}" x="{sx}" y="{sy}" width="{cw}" height="{ch}" preserveAspectRatio="xMidYMin slice" clip-path="url(#{cid})"/>')
        # --- magnifier on the hidden gem (real pixels from the capture)
        if 'zoom' in p:
            gx, gy = p['zoom']; sc = cw / shot.width
            px, py = sx + gx * sc, sy + (gy - STATUS_BAR) * sc            # gem position inside the phone
            R = 175 * u; mx, my = px + cw * .42, py - ch * .2               # bubble position
            crop = full.crop((gx - 110, gy - 110, gx + 110, gy + 110)).resize((440, 440), Image.LANCZOS)
            zid = f'zm{tag}{i}'
            g += (f'<circle cx="{px}" cy="{py}" r="{70*u}" fill="none" stroke="#fff" stroke-width="{10*u}"/>'
                  f'<path d="M{px + 50*u},{py - 50*u} L{mx - R*.7},{my + R*.7}" stroke="#fff" stroke-width="{10*u}" stroke-linecap="round"/>'
                  f'<circle cx="{mx}" cy="{my+18*u}" r="{R+16*u}" fill="{NAVY}" opacity=".4"/>'
                  f'<circle cx="{mx}" cy="{my}" r="{R+16*u}" fill="#fff"/><circle cx="{mx}" cy="{my}" r="{R+6*u}" fill="{NAVY}"/>'
                  f'<clipPath id="{zid}"><circle cx="{mx}" cy="{my}" r="{R}"/></clipPath>'
                  f'<image href="{uri_of(crop)}" x="{mx-R}" y="{my-R}" width="{2*R}" height="{2*R}" clip-path="url(#{zid})"/>'
                  + sparkle(mx + R * .78, my - R * .8, 30 * u, J['topaz']) + sparkle(mx - R * .9, my - R * .5, 18 * u, '#fff'))
        g += '</g>'
        # --- Roo interacting with the phone (in front)
        if 'roo' in p:
            pose, where = p['roo']
            rs = .86 * u
            if where == 'top_right':
                rx, ry = sx + cw - 175 * rs, sy + ch * .3
            elif where == 'top_left':
                rx, ry = sx - 120 * rs, max(sy - 215 * rs, band + 6 * u)
            else:
                rx, ry = sx - 110 * rs, H - 500 * rs
            g += f'<g transform="translate({rx},{ry}) scale({rs})">{roo(d, pose, ground=False)}</g>'

    svg = d.svg(TW, H, g, title='Hoppy Blocks store screenshots')
    strip = f'{OUT}/_{tag}_strip'
    open(strip + '.svg', 'w').write(svg)
    subprocess.run(['rsvg-convert', strip + '.svg', '-o', strip + '.png'], check=True)
    big = Image.open(strip + '.png').convert('RGB')
    for i in range(N):
        big.crop((W * i, 0, W * (i + 1), H)).save(f'{OUT}/{tag}_{i+1:02d}.png')
    big.resize((TW // 4, H // 4)).save(f'{OUT}/_{tag}_strip_preview.png')
    os.remove(strip + '.svg'); os.remove(strip + '.png')


if __name__ == '__main__':
    for f in os.listdir(OUT):
        os.remove(f'{OUT}/{f}')
    build_set(1206, 2622, 'iphone_1206x2622')
    build_set(1080, 1920, 'android_1080x1920')
    print('v2 done')
