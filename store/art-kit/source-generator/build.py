import os, subprocess
from art import *

OUT = 'out'
for sub in ['1_app_icon', '2_android_adaptive', '3_logo', '4_splash', '5_feature_graphic', '6_mascot_roo',
            '7_screenshot_frames', 'source_svg']:
    os.makedirs(f'{OUT}/{sub}', exist_ok=True)


def save(svg, name, folder, png=None, w=None, h=None):
    sp = f'{OUT}/source_svg/{name}.svg'
    open(sp, 'w').write(svg)
    if folder:
        open(f'{OUT}/{folder}/{name}.svg', 'w').write(svg)
    if png:
        args = ['rsvg-convert', sp, '-o', f'{OUT}/{folder}/{png}']
        if w: args += ['-w', str(w)]
        if h: args += ['-h', str(h)]
        subprocess.run(args, check=True)


def stage(d, w, h, cell=None, cx=.5, cy=.42):
    """Royal-blue stage: radial glow, faint grid, soft vignette."""
    cell = cell or round(min(w, h) / 9)
    d.add('stg', f'<radialGradient id="stg" cx="{cx}" cy="{cy}" r=".85"><stop offset="0" stop-color="#4C7BF5"/>'
                 f'<stop offset=".45" stop-color="{BLUE}"/><stop offset=".8" stop-color="{BLUE2}"/>'
                 f'<stop offset="1" stop-color="{BLUE3}"/></radialGradient>')
    d.add('grid', f'<pattern id="grid" width="{cell}" height="{cell}" patternUnits="userSpaceOnUse" x="{(w/2)%cell}" y="{(h/2)%cell}">'
                  f'<rect width="{cell}" height="{cell}" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="{max(2,cell/40):.1f}"/>'
                  f'<circle cx="0" cy="0" r="{cell/22:.1f}" fill="#fff" fill-opacity=".12"/></pattern>')
    rays = ''
    for i in range(12):
        a = i * 30
        rays += (f'<path d="M0,0 L{-0.13*max(w,h)},{-1.2*max(w,h)} L{0.13*max(w,h)},{-1.2*max(w,h)}Z" '
                 f'transform="translate({w*cx},{h*cy}) rotate({a})" fill="#fff" opacity=".035"/>')
    return (f'<rect width="{w}" height="{h}" fill="url(#stg)"/>{rays}'
            f'<rect width="{w}" height="{h}" fill="url(#grid)"/>')


def glow(x, y, r, c='#9FD8FF', op=.55):
    gid = f'gl{abs(hash((c,op)))%9999}'
    return (f'<defs><radialGradient id="{gid}"><stop offset="0" stop-color="{c}" stop-opacity="{op}"/>'
            f'<stop offset="1" stop-color="{c}" stop-opacity="0"/></radialGradient></defs>'
            f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#{gid})"/>')


# ------------------------------------------------------------------ 1. app icon
def icon_art(d):
    """1024 composition: full-figure Roo so the kangaroo cues (pouch block, tail, big feet,
    folded ear) all survive at home-screen size; jewel blocks frame the bottom corners."""
    g = glow(470, 470, 440, '#BFE6FF', .5)
    g += block(d, 770, 690, 230, 'aqua', rot=8) + block(d, 820, 470, 170, 'emerald', rot=-6)
    g += f'<g transform="translate(76,34) scale(1.8)">{roo(d, "happy", ground=False)}</g>'
    g += block(d, -60, 800, 230, 'ruby', rot=-8)
    g += sparkle(140, 210, 34, '#fff', .95) + sparkle(900, 330, 24, J['topaz']) + sparkle(860, 150, 14, '#fff', .8)
    return g


d = Doc()
icon = d.svg(1024, 1024, stage(d, 1024, 1024, cell=128) + icon_art(d), title='Hoppy Blocks app icon')
save(icon, 'app_icon_1024', '1_app_icon', 'app_icon_1024.png', 1024)

# ------------------------------------------------------------------ 2. android adaptive
d = Doc()
# Same full-figure Roo as the main icon, scaled so every part (ear tip, tail tip, blocks)
# stays inside the 66% safe circle (r = 338 px) with margin to spare.
fg = (block(d, 290, 640, 96, 'ruby', rot=-10) + block(d, 640, 380, 80, 'emerald', rot=8)
      + f'<g transform="translate({512-200*1.0},{512-262*1.0}) scale(1.0)">{roo(d, "happy", ground=False)}</g>')
def fg_again():
    roo(d, 'happy'); [block(d,0,0,1,c) for c in ('ruby','emerald','topaz')]; return fg
fgsvg = d.svg(1024, 1024, fg, title='Hoppy Blocks adaptive foreground')
save(fgsvg, 'adaptive_foreground_1024', '2_android_adaptive', 'adaptive_foreground_1024.png', 1024)
d = Doc()
bgsvg = d.svg(1024, 1024, stage(d, 1024, 1024, cell=128, cy=.45), title='Hoppy Blocks adaptive background')
save(bgsvg, 'adaptive_background_1024', '2_android_adaptive', 'adaptive_background_1024.png', 1024)
# safe-zone check image (not a deliverable to upload)
d = Doc()
chk = d.svg(1024, 1024, stage(d, 1024, 1024, cell=128) + fg_again() +
            f'<circle cx="512" cy="512" r="338" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="20 14"/>'
            f'<circle cx="512" cy="512" r="512" fill="none" stroke="#FFD23F" stroke-width="4" stroke-dasharray="8 10"/>')
save(chk, 'adaptive_safezone_check', '2_android_adaptive', 'adaptive_safezone_check.png', 512)

# ------------------------------------------------------------------ 3. logo
def logo_line(d, size=200):
    w, W, H = word(d, 'Hoppy Blocks', size, WM_COLORS)
    pad = size * .35
    return w, W, pad


d = Doc()
w, W, pad = logo_line(d)
LW, LH = round(W + pad * 2), round(200 * 1.25 + pad * 1.2)
body = f'<g transform="translate({pad},{200*.95+pad*.5})">{w}</g>'
save(d.svg(LW, LH, body, title='Hoppy Blocks logo one-line'), 'logo_oneline', '3_logo', 'logo_oneline.png', LW * 2)
d2 = Doc(); w2, _, _ = logo_line(d2)
save(d2.svg(LW, LH, stage(d2, LW, LH) + f'<g transform="translate({pad},{200*.95+pad*.5})">{w2}</g>',
            title='logo on blue'), 'logo_oneline_on_blue', '3_logo', 'logo_oneline_on_blue.png', LW * 2)


def logo_stacked(d, size=220, with_gems=True):
    # Both lines are painted layer by layer (all shadows, then all rims, then all fills) so the
    # second line's outline never covers the first line's descenders.
    l1, W1, _ = word(d, 'Hoppy', size, ['ruby', 'amber', 'topaz', 'emerald', 'aqua'], layers=True)
    l2, W2, _ = word(d, 'Blocks', size, ['amethyst', 'rose', 'ruby', 'amber', 'topaz', 'aqua'], layers=True)
    W = max(W1, W2)
    t1 = f'translate({(W-W1)/2},{size*.82})'
    t2 = f'translate({(W-W2)/2},{size*1.92})'
    # navy bridge between the lines so the joined outline has no slivers where the two lines meet
    x0, x1 = (W - min(W1, W2)) / 2 + size * .15, (W + min(W1, W2)) / 2 - size * .15
    bridge = f'<rect x="{x0:.1f}" y="{size*.7:.1f}" width="{x1-x0:.1f}" height="{size*.75:.1f}" rx="{size*.1:.1f}" fill="{NAVY}"/>'
    g = ''.join(f'<g transform="{t1}">{l1[k]}</g><g transform="{t2}">{l2[k]}</g>' + (bridge if k == 1 else '') for k in range(3))
    if with_gems:
        g += gem_star(d, W1 + (W - W1) / 2 + size * .2, size * .12, size * .38, rot=14)
        g += sparkle((W - W1) / 2 - size * .12, size * .2, size * .12, '#fff')
    return g, W, size * 2.15


d = Doc(); g, W, H = logo_stacked(d)
p = 90; SW_, SH_ = round(W + p * 2), round(H + p * 2)
save(d.svg(SW_, SH_, f'<g transform="translate({p},{p})">{g}</g>', title='Hoppy Blocks logo stacked'),
     'logo_stacked', '3_logo', 'logo_stacked.png', SW_ * 2)
d = Doc(); g, W, H = logo_stacked(d)
save(d.svg(SW_, SH_, stage(d, SW_, SH_) + f'<g transform="translate({p},{p})">{g}</g>', title='stacked on blue'),
     'logo_stacked_on_blue', '3_logo', 'logo_stacked_on_blue.png', SW_ * 2)

# ------------------------------------------------------------------ 4. splash
d = Doc(); g, W, H = logo_stacked(d, 230)
sc = min(1, 900 / W)
splash = (glow(600, 420, 330, '#ffffff', .0) +
          f'<g transform="translate(600,70) scale(1.12) translate(-200,0)">{roo(d, "cheer")}</g>'
          f'<g transform="translate({600 - W*sc/2},{650}) scale({sc})">{g}</g>'
          + block(d, 70, 820, 120, 'aqua', rot=-12) + block(d, 1010, 860, 110, 'emerald', rot=10)
          + gem_heart(d, 230, 330, 90, rot=-12) + gem_diamond(d, 975, 360, 100, rot=10))
save(d.svg(1200, 1200, splash, title='Hoppy Blocks splash'), 'splash_1200', '4_splash', 'splash_1200.png', 1200)
d2 = Doc(); g2, _, _ = logo_stacked(d2, 200)
splash_prev = d2.svg(1200, 1200, stage(d2, 1200, 1200) + splash.replace('', ''), title='splash preview')

# ------------------------------------------------------------------ 5. feature graphic
d = Doc()
w, W, _ = word(d, 'Hoppy Blocks', 104, WM_COLORS)
fgx = (stage(d, 1024, 500, cell=64, cx=.4, cy=.5)
       + ''.join(block(d, x, y, s, c, rot=r) for x, y, s, c, r in [
           (-30, 380, 120, 'emerald', -10), (70, 410, 110, 'aqua', 6), (-40, -40, 110, 'amethyst', 12),
           (930, -40, 110, 'rose', -8), (975, 400, 100, 'amber', 10), (440, 425, 90, 'topaz', -6)])
       + glow(770, 260, 230, '#CFEBFF', .45)
       + f'<g transform="translate(70,262)">{w}</g>'
       + f'<g transform="translate(110,300)">'
       + ''.join(block(d, 0 + i * 70, 50, 62, c, rot=0) for i, c in enumerate(['ruby', 'topaz', 'emerald', 'aqua', 'amethyst']))
       + '</g>'
       + gem_star(d, 560, 118, 60, rot=12) + gem_heart(d, 88, 120, 54, rot=-12) + gem_diamond(d, 590, 360, 56, rot=-8)
       + f'<g transform="translate(828,268) scale(.8) translate(-200,-290)">{roo(d, "cheer")}</g>'
       + sparkle(330, 110, 18, '#fff', .9) + sparkle(940, 230, 14, '#fff', .8))
save(d.svg(1024, 500, fgx, title='Hoppy Blocks feature graphic'), 'feature_graphic_1024x500', '5_feature_graphic',
     'feature_graphic_1024x500.png', 1024)

# ------------------------------------------------------------------ 6. Roo
poses = ['happy', 'cheer', 'oops', 'wink', 'think']
labels = {'happy': 'Happy', 'cheer': 'Cheering', 'oops': 'Oops!', 'wink': 'Nice move', 'think': 'Thinking'}
for p_ in poses:
    d = Doc()
    save(d.svg(400, 560, f'<g transform="translate(0,36)">{roo(d, p_)}</g>', title=f'Roo {p_}'), f'roo_{p_}', '6_mascot_roo', f'roo_{p_}.png', 800)
# sheet
d = Doc()
SWD, SHD = 2300, 1040
sheet = f'<rect width="{SWD}" height="{SHD}" fill="#F3F6FF"/>'
sheet += f'<rect x="0" y="0" width="{SWD}" height="150" fill="{BLUE}"/>'
tw, TW, _ = word(d, 'Meet Roo', 90, ['amber', 'topaz', 'emerald', 'aqua', 'amethyst', 'rose', 'ruby'], hop=True)
sheet += f'<g transform="translate(60,112)">{tw}</g>'
for i, p_ in enumerate(poses):
    x = 40 + i * 450
    sheet += f'<rect x="{x}" y="190" width="420" height="640" rx="36" fill="#fff" stroke="#DCE4FA" stroke-width="4"/>'
    sheet += f'<g transform="translate({x+10},230)">{roo(d, p_)}</g>'
    lw, LWW, _ = word(d, labels[p_], 54, [['ruby', 'amber', 'topaz', 'emerald', 'aqua', 'amethyst', 'rose'][(i + k) % 7] for k in range(9)], hop=False, outline=6)
    sheet += f'<g transform="translate({x + 210 - LWW/2},{805})">{lw}</g>'
# palette strip
sw = [('Fur', FUR), ('Fur light', FUR_L), ('Fur shade', FUR_D), ('Cream', CREAM), ('Blush', PINK), ('Outline', NAVY)]
for i, (n, c) in enumerate(sw):
    sheet += (f'<rect x="{60+i*150}" y="880" width="120" height="120" rx="24" fill="{c}" stroke="{NAVY}" stroke-width="5"/>')
for i, n in enumerate(['ruby', 'amber', 'topaz', 'emerald', 'aqua', 'amethyst', 'rose']):
    sheet += block(d, 1000 + i * 135, 885, 110, n)
save(d.svg(SWD, SHD, sheet, title='Roo character sheet'), 'roo_character_sheet', '6_mascot_roo', 'roo_character_sheet.png', SWD)


# ------------------------------------------------------------------ 7. screenshot frames
def frame(W, H, name, roo_pose='cheer'):
    d = Doc()
    u = W / 1080
    top = H * .25
    g = stage(d, W, H, cell=round(120 * u), cy=.35)
    # headline zone marker-free; device / screenshot panel
    px, pw = W * .09, W * .82
    ph = H - top - H * .06
    py = top
    g += '<!--ROO-->'
    g += (f'<rect x="{px - 14*u}" y="{py - 14*u}" width="{pw + 28*u}" height="{ph + 28*u}" rx="{70*u}" fill="{NAVY}"/>'
          f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="{58*u}" fill="#FFFFFF" fill-opacity=".14" '
          f'stroke="#fff" stroke-opacity=".5" stroke-width="{4*u}" stroke-dasharray="{18*u} {14*u}"/>')
    # Roo peeks over the top-right edge of the panel, BEHIND it, so nothing ever covers the
    # screenshot (the piece tray at the bottom stays clear). Headline goes top-left/centre.
    rs = .62 * u
    roo_g = (f'<clipPath id="peek"><rect x="0" y="0" width="{W}" height="{py - 14*u + 4*u}"/></clipPath>'
             f'<g clip-path="url(#peek)"><g transform="translate({px + pw - 400*rs - 10*u},{py - 300*rs}) scale({rs})">'
             f'{roo(d, roo_pose, ground=False)}</g></g>')
    g = g.replace('<!--ROO-->', roo_g)
    g += block(d, -40 * u, top - 260 * u, 140 * u, 'ruby', rot=-14)
    g += gem_star(d, W - 50 * u, H * .62, 70 * u, rot=16) + gem_heart(d, 50 * u, H * .5, 64 * u, rot=-14)
    save(d.svg(W, H, g, title=f'screenshot frame {name}'), f'frame_{name}', '7_screenshot_frames', f'frame_{name}.png', W)
    d = Doc()
    save(d.svg(W, H, stage(d, W, H, cell=round(120 * u), cy=.35)), f'background_{name}', '7_screenshot_frames', f'background_{name}.png', W)


frame(1290, 2796, 'iphone_1290x2796')
frame(2064, 2752, 'ipad_2064x2752', 'happy')
frame(1080, 1920, 'android_1080x1920', 'wink')
print('done')
