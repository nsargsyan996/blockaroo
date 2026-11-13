"""Roo as separate parts for in-app animation.
Every part is drawn on the same padded 520x600 canvas (Roo offset by 60,40 so the tail, ears and arms
have room to sway or rotate), so the parts line up when stacked at (0,0).
Pivots are in that canvas's coordinates."""
import json, os, subprocess
from art import *
from art import _face, _nose, _eye, _ear, _limb, _hand

OUT = 'out/6_mascot_roo/rig'
os.makedirs(f'{OUT}/parts', exist_ok=True)

d0 = Doc()
SHOULDER_L, SHOULDER_R = (150, 320), (250, 320)


def arm(side):
    # neutral, hanging arm. Rotate around the shoulder pivot to pose it.
    if side == 'L':
        pts = [SHOULDER_L, (128, 356), (138, 392)]
    else:
        pts = [SHOULDER_R, (272, 356), (262, 392)]
    return _limb(pts, 22) + _hand(*pts[2])


def foot(fx):
    return (f'<ellipse cx="{fx}" cy="488" rx="58" ry="20" fill="url(#rfur)" stroke="{NAVY}" stroke-width="{SW}"/>'
            f'<path d="M{fx-30},482 q8,-6 18,0 M{fx+12},482 q8,-6 18,0" stroke="{FUR_L}" stroke-width="5" fill="none" stroke-linecap="round"/>')


def head_base(blush=.65):
    return (f'<path d="{HEAD}" fill="url(#rfur)" stroke="{NAVY}" stroke-width="{SW}"/>'
            f'<path d="M184,98 C186,74 204,70 210,84 C214,70 232,76 226,98 Z" fill="url(#rfur)" stroke="{NAVY}" stroke-width="{SW-2}" stroke-linejoin="round"/>'
            f'<path d="M180,100 L230,100 L232,112 L178,112Z" fill="{FUR}"/>'
            f'<ellipse cx="146" cy="134" rx="34" ry="15" transform="rotate(-22 146 134)" fill="#fff" opacity=".35"/>'
            f'<ellipse cx="200" cy="232" rx="62" ry="42" fill="url(#rcream)"/>'
            f'<ellipse cx="122" cy="226" rx="20" ry="12" fill="{PINK}" opacity="{blush}"/>'
            f'<ellipse cx="278" cy="226" rx="20" ry="12" fill="{PINK}" opacity="{blush}"/>')


def split_face(p):
    f = _face(p); n = _nose()
    eyes, mouth = f.split(n)
    if p == 'think':  # this pose's brow is drawn after the nose
        i = mouth.index('<path d="M136,146')
        j = mouth.index('/>', i) + 2
        eyes += mouth[i:j]; mouth = mouth[:i] + mouth[j:]
    return eyes, mouth


E = {k: split_face(p)[0] for k, p in [('open', 'happy'), ('closed_happy', 'cheer'), ('worried', 'oops'),
                                      ('wink', 'wink'), ('look_up', 'think')]}
M = {k: split_face(p)[1] for k, p in [('smile', 'happy'), ('laugh', 'cheer'), ('wobble', 'oops'),
                                      ('tongue', 'wink'), ('hmm', 'think')]}

roo_defs(d0)
pb = block(d0, 172, 368, 54, 'topaz', rot=-12)

# name, svg, pivot, parent, note   (listed back to front = draw order)
parts = [
    ('tail', f'<path d="M256,394 C328,386 372,432 380,500 C356,502 318,490 264,470 Z" fill="url(#rfur)" stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>', (262, 430), 'body', 'sway / thump'),
    ('foot_l', foot(146), (170, 488), 'root', ''),
    ('foot_r', foot(254), (230, 488), 'root', ''),
    ('body', f'<path d="{BODY}" fill="url(#rfur)" stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>'
             f'<path d="M128,388 C114,412 116,446 142,464 M272,388 C286,412 284,446 258,464" stroke="{FUR_D}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>'
             f'<ellipse cx="200" cy="396" rx="60" ry="70" fill="url(#rcream)"/>', (200, 480), 'root', 'squash & stretch from the feet'),
    ('pouch_block', pb, (199, 395), 'body', 'can swap colour or bob'),
    ('pouch_front', f'<path d="M146,404 Q200,436 254,404 Q256,466 200,470 Q144,466 146,404Z" fill="url(#rcream)" stroke="{NAVY}" stroke-width="{SW-2}" stroke-linejoin="round"/>'
                    f'<path d="M160,420 Q200,442 240,420" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>', (200, 404), 'body', ''),
    ('arm_l_behind_head', arm('L'), SHOULDER_L, 'body', 'same art as arm_l; use this layer when the arm is raised above the head'),
    ('arm_r_behind_head', arm('R'), SHOULDER_R, 'body', 'same art as arm_r; use this layer when the arm is raised above the head'),
    ('ear_l', _ear('L'), (150, 122), 'head', 'twitch / droop (oops: rotate about -26°)'),
    ('ear_r', _ear('R', flop=True), (250, 122), 'head', 'folded signature ear; droop (oops: rotate about +26°)'),
    ('head', head_base(), (200, 282), 'body', 'tilt from the neck'),
    ('nose', _nose(), (200, 212), 'head', ''),
] + [(f'eyes_{k}', v, (200, 178), 'head', 'show one eyes_* at a time') for k, v in E.items()] \
  + [(f'mouth_{k}', v, (200, 248), 'head', 'show one mouth_* at a time') for k, v in M.items()] + [
    ('arm_l', arm('L'), SHOULDER_L, 'body', 'rotate about shoulder'),
    ('arm_r', arm('R'), SHOULDER_R, 'body', 'rotate about shoulder'),
    ('fx_sweat', f'<path d="M340,126 C352,146 360,156 360,166 A14,14 0 0 1 332,166 C332,156 334,146 340,126Z" fill="{J["aqua"]}" stroke="{NAVY}" stroke-width="6"/><ellipse cx="340" cy="162" rx="4" ry="6" fill="#fff"/>', (346, 154), 'head', 'oops'),
    ('fx_sparkles', sparkle(40, 170, 22, J['topaz']) + sparkle(362, 160, 18, J['aqua']) + sparkle(352, 60, 12, J['rose']) + sparkle(52, 80, 12, J['emerald']), (200, 120), 'root', 'cheer'),
    ('shadow', f'<ellipse cx="200" cy="506" rx="128" ry="13" fill="{NAVY}" opacity=".22"/>', (200, 506), 'root', 'scale down while Roo is in the air; draw first'),
]

defs_xml = ''.join(d0.defs.values())
CW, CH, OX, OY = 520, 600, 60, 40


def doc(inner, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{CW}" height="{CH}" viewBox="0 0 {CW} {CH}"><title>{title}</title>'
            f'<defs>{defs_xml}</defs><g transform="translate({OX},{OY})">{inner}</g></svg>')


meta = {'canvas': [CW, CH], 'roo_offset': [OX, OY], 'note': 'Every part is drawn on the same canvas; stack them at (0,0). '
        'Pivots are in canvas pixels. Order = draw order, back to front (shadow first).',
        'parts': []}
order = ['shadow'] + [p[0] for p in parts if p[0] != 'shadow']
pd = {p[0]: p for p in parts}
for i, name in enumerate(order):
    _, svg, piv, parent, note = pd[name]
    open(f'{OUT}/parts/{name}.svg', 'w').write(doc(svg, f'Roo part {name}'))
    subprocess.run(['rsvg-convert', f'{OUT}/parts/{name}.svg', '-w', str(CW*2), '-o', f'{OUT}/parts/{name}@2x.png'], check=True)
    meta['parts'].append({'name': name, 'order': i, 'pivot': [piv[0] + OX, piv[1] + OY], 'parent': parent, 'file': f'parts/{name}.svg', 'note': note})
json.dump(meta, open(f'{OUT}/roo_rig.json', 'w'), indent=2)

# layered master file with the default (neutral, happy) state visible
DEFAULT_HIDDEN = {k for k in order if (k.startswith('eyes_') and k != 'eyes_open') or (k.startswith('mouth_') and k != 'mouth_smile')
                  or k.startswith('fx_') or k.endswith('_behind_head')}
layers = ''
for name in order:
    _, svg, piv, parent, note = pd[name]
    vis = ' display="none"' if name in DEFAULT_HIDDEN else ''
    layers += f'<g id="{name}" data-pivot="{piv[0]+OX},{piv[1]+OY}" data-parent="{parent}"{vis}>{svg}</g>'
open(f'{OUT}/roo_rig_layered.svg', 'w').write(doc(layers, 'Roo rig, layered'))
subprocess.run(['rsvg-convert', f'{OUT}/roo_rig_layered.svg', '-w', str(CW*2), '-o', f'{OUT}/roo_rig_assembled.png'], check=True)
print(len(order), 'parts')
