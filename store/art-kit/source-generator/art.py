"""Hoppy Blocks art library — every asset is generated from these vector primitives.
All shapes are original constructions; fonts used for the wordmark are OFL-1.1
(Lilita One) and are converted to outlines, so no font file ships with the art."""
import math
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

# ---------------------------------------------------------------- palette
BLUE, BLUE2, BLUE3 = '#2B5BE0', '#1438B8', '#0A1F7A'
NAVY = '#0A1C5E'
J = {
    'aqua': '#38C7F0', 'emerald': '#3ED68A', 'amethyst': '#8F6BFF', 'ruby': '#FF5F6D',
    'topaz': '#FFD23F', 'amber': '#FF9A3C', 'rose': '#FF6FC1',
}
FUR, FUR_L, FUR_D = '#F7A14C', '#FFC983', '#D9772E'
CREAM, PINK = '#FFF0D6', '#FF9EBB'


def _hex(c):
    c = c.lstrip('#'); return [int(c[i:i + 2], 16) for i in (0, 2, 4)]


def mix(a, b, t):
    A, B = _hex(a), _hex(b)
    return '#%02X%02X%02X' % tuple(round(A[i] + (B[i] - A[i]) * t) for i in range(3))


def light(c, t=.45): return mix(c, '#FFFFFF', t)
def dark(c, t=.32): return mix(c, NAVY, t)


# ---------------------------------------------------------------- defs registry
class Doc:
    def __init__(self):
        self.defs = {}
        self.n = 0

    def add(self, key, xml):
        if key not in self.defs:
            self.defs[key] = xml
        return key

    def uid(self, p='u'):
        self.n += 1
        return f'{p}{self.n}'

    def svg(self, w, h, body, bg=None, title='Hoppy Blocks'):
        defs = ''.join(self.defs.values())
        bgr = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
        return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
                f'width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>{title}</title>'
                f'<defs>{defs}</defs>{bgr}{body}</svg>')


# ---------------------------------------------------------------- jewel blocks
def block(d, x, y, s, name, rot=0, shine=True):
    """Glossy beveled jewel block, unit design on 100x100, navy rim."""
    c = J[name]
    gid = d.add(f'bf-{name}', f'<linearGradient id="bf-{name}" x1="0" y1="0" x2="0" y2="1">'
                              f'<stop offset="0" stop-color="{light(c,.38)}"/><stop offset=".55" stop-color="{c}"/>'
                              f'<stop offset="1" stop-color="{mix(c, NAVY, .12)}"/></linearGradient>')
    d.add('bclip', '<clipPath id="bclip"><rect x="6" y="6" width="88" height="88" rx="15"/></clipPath>')
    tr = f'translate({x},{y}) rotate({rot},{s/2},{s/2}) scale({s/100})'
    sh = ''
    if shine:
        sh = (f'<path d="M24,28 Q24,22 30,22 L58,22 Q62,22 59,26 L30,52 Q24,57 24,50 Z" fill="#fff" opacity=".55"/>'
              f'<circle cx="70" cy="72" r="3.4" fill="#fff" opacity=".55"/>')
    return (f'<g transform="{tr}">'
            f'<rect x="0" y="0" width="100" height="100" rx="20" fill="{NAVY}"/>'
            f'<g clip-path="url(#bclip)">'
            f'<rect x="6" y="6" width="88" height="88" fill="{c}"/>'
            f'<polygon points="6,6 94,6 80,20 20,20" fill="{light(c,.62)}"/>'
            f'<polygon points="6,6 20,20 20,80 6,94" fill="{light(c,.30)}"/>'
            f'<polygon points="94,6 94,94 80,80 80,20" fill="{dark(c,.18)}"/>'
            f'<polygon points="6,94 94,94 80,80 20,80" fill="{dark(c,.34)}"/></g>'
            f'<rect x="20" y="20" width="60" height="60" rx="6" fill="url(#{gid})"/>'
            f'{sh}</g>')


# ---------------------------------------------------------------- gems
def gem_diamond(d, x, y, s, c=J['aqua'], rot=0):
    """Brilliant-cut diamond in 100x90 unit box."""
    L, D = light(c, .55), dark(c, .25)
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s/100}) translate(-50,-45)">'
            f'<path d="M22,6 L78,6 L98,32 L50,88 L2,32 Z" fill="{c}" stroke="{NAVY}" stroke-width="7" stroke-linejoin="round"/>'
            f'<path d="M22,6 L36,32 L2,32 Z" fill="{L}"/><path d="M36,32 L50,6 L64,32 Z" fill="{light(c,.75)}"/>'
            f'<path d="M22,6 L50,6 L36,32Z" fill="{light(c,.35)}"/><path d="M50,6 L78,6 L64,32Z" fill="{light(c,.2)}"/>'
            f'<path d="M78,6 L98,32 L64,32Z" fill="{dark(c,.1)}"/>'
            f'<path d="M2,32 L36,32 L50,88Z" fill="{light(c,.2)}"/><path d="M64,32 L98,32 L50,88Z" fill="{D}"/>'
            f'<path d="M22,6 L78,6 L98,32 L50,88 L2,32 Z" fill="none" stroke="{NAVY}" stroke-width="7" stroke-linejoin="round"/>'
            f'<path d="M30,14 L40,14 L34,26Z" fill="#fff" opacity=".8"/></g>')


def star_path(cx, cy, R, r, n=5, rot=-90):
    pts = []
    for i in range(n * 2):
        a = math.radians(rot + i * 180 / n)
        rr = R if i % 2 == 0 else r
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts


def rounded_poly(pts, rad):
    """Polygon path with rounded corners (quadratic)."""
    n = len(pts); out = []
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        def toward(a, b, t):
            dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy); t = min(t, L / 2.2)
            return (a[0] + dx / L * t, a[1] + dy / L * t)
        a = toward(p1, p0, rad); b = toward(p1, p2, rad)
        out.append((a, p1, b))
    s = f'M{out[0][0][0]:.1f},{out[0][0][1]:.1f} '
    for i, (a, p, b) in enumerate(out):
        if i: s += f'L{a[0]:.1f},{a[1]:.1f} '
        s += f'Q{p[0]:.1f},{p[1]:.1f} {b[0]:.1f},{b[1]:.1f} '
    return s + 'Z'


def gem_star(d, x, y, s, c=J['topaz'], rot=0):
    pts = star_path(50, 54, 50, 22)
    facets = ''
    for i in range(10):
        p1, p2 = pts[i], pts[(i + 1) % 10]
        col = light(c, .45) if i in (8, 9, 0, 1) else (dark(c, .18) if i in (3, 4, 5, 6) else c)
        facets += f'<path d="M50,54 L{p1[0]:.1f},{p1[1]:.1f} L{p2[0]:.1f},{p2[1]:.1f}Z" fill="{col}"/>'
    cid = d.uid('sc')
    path = rounded_poly(pts, 7)
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s/100}) translate(-50,-52)">'
            f'<clipPath id="{cid}"><path d="{path}"/></clipPath>'
            f'<path d="{path}" fill="{c}"/><g clip-path="url(#{cid})">{facets}</g>'
            f'<path d="{path}" fill="none" stroke="{NAVY}" stroke-width="7" stroke-linejoin="round"/>'
            f'<ellipse cx="38" cy="38" rx="7" ry="4" transform="rotate(-35 38 38)" fill="#fff" opacity=".85"/></g>')


HEART = 'M50,90 C20,70 4,52 4,32 C4,16 16,6 29,6 C39,6 46,12 50,20 C54,12 61,6 71,6 C84,6 96,16 96,32 C96,52 80,70 50,90Z'


def gem_heart(d, x, y, s, c=J['ruby'], rot=0):
    cid = d.uid('hc')
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s/100}) translate(-50,-48)">'
            f'<clipPath id="{cid}"><path d="{HEART}"/></clipPath>'
            f'<path d="{HEART}" fill="{c}"/>'
            f'<g clip-path="url(#{cid})"><path d="M0,0 L50,20 L50,50 L0,40Z" fill="{light(c,.4)}"/>'
            f'<path d="M100,0 L50,20 L50,50 L100,40Z" fill="{light(c,.15)}"/>'
            f'<path d="M0,40 L50,50 L50,100 Z" fill="{c}"/><path d="M100,40 L50,50 L50,100Z" fill="{dark(c,.2)}"/></g>'
            f'<path d="{HEART}" fill="none" stroke="{NAVY}" stroke-width="7" stroke-linejoin="round"/>'
            f'<ellipse cx="25" cy="24" rx="9" ry="5" transform="rotate(-30 25 24)" fill="#fff" opacity=".85"/></g>')


def sparkle(x, y, r, c='#fff', op=1):
    p = f'M{x},{y-r} Q{x+r*.18},{y-r*.18} {x+r},{y} Q{x+r*.18},{y+r*.18} {x},{y+r} Q{x-r*.18},{y+r*.18} {x-r},{y} Q{x-r*.18},{y-r*.18} {x},{y-r}Z'
    return f'<path d="{p}" fill="{c}" opacity="{op}"/>'


# ---------------------------------------------------------------- Roo
SW = 9  # outline width at native 400x520 scale


def _limb(pts, w=20, color=FUR):
    p = f'M{pts[0][0]},{pts[0][1]} ' + (
        f'Q{pts[1][0]},{pts[1][1]} {pts[2][0]},{pts[2][1]}' if len(pts) == 3 else f'L{pts[1][0]},{pts[1][1]}')
    return (f'<path d="{p}" fill="none" stroke="{NAVY}" stroke-width="{w+2*SW}" stroke-linecap="round"/>'
            f'<path d="{p}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>')


def _hand(x, y, r=17, thumb=None):
    t = ''
    if thumb:
        tx, ty = thumb
        t = (f'<path d="M{x},{y} L{tx},{ty}" stroke="{NAVY}" stroke-width="{14+2*SW-4}" stroke-linecap="round"/>'
             f'<path d="M{x},{y} L{tx},{ty}" stroke="{FUR_L}" stroke-width="10" stroke-linecap="round"/>')
    return (t + f'<circle cx="{x}" cy="{y}" r="{r}" fill="{FUR_L}" stroke="{NAVY}" stroke-width="{SW-1}"/>'
            f'<circle cx="{x-5}" cy="{y-6}" r="{r*.32}" fill="#fff" opacity=".45"/>')


def _ear(side, droop=0, flop=False):
    # left ear designed; right is mirrored
    outer = 'M116,132 C84,96 62,34 84,10 C106,-8 160,40 172,104 Z'
    inner = 'M124,116 C102,86 88,46 98,30 C112,22 146,60 154,100 Z'
    shade = (f'<path d="{outer}" fill="url(#rfur)" stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>'
             f'<path d="{inner}" fill="{PINK}"/>')
    if not flop:
        g = shade + '<path d="M96,40 C92,56 96,74 104,86" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".5"/>'
    else:
        # Signature folded ear: the tip bends over and hangs outward — a clear Roo silhouette
        g = (f'<path d="M116,132 C96,110 78,86 74,58 L142,58 C156,78 168,94 172,104 Z" fill="url(#rfur)" '
             f'stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>'
             f'<path d="M126,116 C110,98 98,82 94,66 L134,66 C144,82 150,94 154,100Z" fill="{PINK}"/>'
             f'<path d="M74,58 C58,58 38,66 22,88 C14,100 22,110 34,104 C66,90 108,72 142,58 Z" fill="{FUR}" '
             f'stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>'
             f'<path d="M44,80 C60,72 80,66 100,62" stroke="{FUR_L}" stroke-width="6" stroke-linecap="round" fill="none"/>')
    rot = -droop
    if side == 'R':
        return f'<g transform="translate(400,0) scale(-1,1) rotate({rot},150,120)">{g}</g>'
    return f'<g transform="rotate({rot},150,120)">{g}</g>'


def roo_defs(d):
    d.add('rfur', f'<radialGradient id="rfur" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="{FUR_L}"/>'
                  f'<stop offset=".55" stop-color="{FUR}"/><stop offset="1" stop-color="{FUR_D}"/></radialGradient>')
    d.add('rcream', f'<radialGradient id="rcream" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="#FFFFFF"/>'
                    f'<stop offset=".6" stop-color="{CREAM}"/><stop offset="1" stop-color="#FFDDB0"/></radialGradient>')


HEAD = 'M200,92 C278,92 318,136 317,192 C316,250 266,284 200,284 C134,284 84,250 83,192 C82,136 122,92 200,92Z'
BODY = ('M200,270 C252,270 272,316 276,356 C312,374 322,440 298,468 C272,490 128,490 102,468 '
        'C78,440 88,374 124,356 C128,316 148,270 200,270Z')


def roo(d, pose='happy', ground=True, pouch_block='topaz'):
    """Roo, 400 x 520 box, feet resting at y≈500."""
    roo_defs(d)
    lift = {'cheer': -26}.get(pose, 0)
    droop = {'oops': 26}.get(pose, 0)
    out = []
    if ground:
        sc = .78 if lift else 1
        out.append(f'<ellipse cx="200" cy="506" rx="{128*sc}" ry="{13*sc}" fill="{NAVY}" opacity=".22"/>')
    g = []
    # tail
    g.append(f'<path d="M256,394 C328,386 372,432 380,500 C356,502 318,490 264,470 Z" fill="url(#rfur)" '
             f'stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>')
    # arms behind head (raised poses)
    arms = {
        'happy': ([(150, 320), (122, 360), (146, 392)], [(250, 320), (318, 310), (344, 262)]),
        'cheer': ([(150, 318), (112, 262), (66, 236)], [(250, 318), (288, 262), (334, 236)]),
        'oops': ([(150, 322), (104, 300), (100, 246)], [(250, 322), (292, 350), (322, 330)]),
        'wink': ([(150, 320), (122, 360), (146, 392)], [(250, 320), (300, 330), (326, 300)]),
        'think': ([(150, 320), (122, 360), (146, 392)], [(250, 322), (262, 300), (236, 256)]),
    }[pose]
    # feet
    for fx in (146, 254):
        g.append(f'<ellipse cx="{fx}" cy="488" rx="58" ry="20" fill="url(#rfur)" stroke="{NAVY}" stroke-width="{SW}"/>'
                 f'<path d="M{fx-30},{482} q8,-6 18,0 M{fx+12},{482} q8,-6 18,0" stroke="{FUR_L}" stroke-width="5" fill="none" stroke-linecap="round"/>')
    # body
    g.append(f'<path d="{BODY}" fill="url(#rfur)" stroke="{NAVY}" stroke-width="{SW}" stroke-linejoin="round"/>')
    g.append(f'<path d="M128,388 C114,412 116,446 142,464 M272,388 C286,412 284,446 258,464" stroke="{FUR_D}" '
             f'stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>')
    g.append(f'<ellipse cx="200" cy="396" rx="60" ry="70" fill="url(#rcream)"/>')
    # block peeking out of pouch
    if pouch_block:
        g.append(block(d, 172, 368, 54, pouch_block, rot=-12))
    g.append(f'<path d="M146,404 Q200,436 254,404 Q256,466 200,470 Q144,466 146,404Z" fill="url(#rcream)" '
             f'stroke="{NAVY}" stroke-width="{SW-2}" stroke-linejoin="round"/>')
    g.append(f'<path d="M160,420 Q200,442 240,420" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>')
    raised = pose in ('cheer',)
    armsvg = ''
    for a in arms:
        armsvg += _limb(a, 22)
    hands = ''
    if pose == 'wink':
        hands = _hand(*arms[0][2]) + _hand(326, 300, 18, thumb=(330, 270))
    else:
        hands = ''.join(_hand(*a[2]) for a in arms)
    if raised:
        g.append(f'<path d="M122,250 L278,250 L262,318 L138,318 Z" fill="{FUR}"/>')
        g.append(armsvg + hands)
    # ears + head
    flop = True
    g.append(_ear('L', droop))
    g.append(_ear('R', droop, flop=flop))
    g.append(f'<path d="{HEAD}" fill="url(#rfur)" stroke="{NAVY}" stroke-width="{SW}"/>')
    # tuft
    g.append(f'<path d="M184,98 C186,74 204,70 210,84 C214,70 232,76 226,98 Z" fill="url(#rfur)" stroke="{NAVY}" '
             f'stroke-width="{SW-2}" stroke-linejoin="round"/>')
    g.append(f'<path d="M180,100 L230,100 L232,112 L178,112Z" fill="{FUR}"/>')
    g.append(f'<ellipse cx="146" cy="134" rx="34" ry="15" transform="rotate(-22 146 134)" fill="#fff" opacity=".35"/>')
    # muzzle
    g.append(f'<ellipse cx="200" cy="232" rx="62" ry="42" fill="url(#rcream)"/>')
    # cheeks
    blush = .85 if pose == 'oops' else .65
    g.append(f'<ellipse cx="122" cy="226" rx="20" ry="12" fill="{PINK}" opacity="{blush}"/>'
             f'<ellipse cx="278" cy="226" rx="20" ry="12" fill="{PINK}" opacity="{blush}"/>')
    g.append(_face(pose))
    if not raised:
        g.append(armsvg + hands)
    # extras
    if pose == 'cheer':
        g.append(sparkle(40, 170, 22, J['topaz']) + sparkle(362, 160, 18, J['aqua']) + sparkle(352, 60, 12, J['rose'])
                 + sparkle(52, 80, 12, J['emerald']))
        g.append(f'<path d="M110,520 q-8,-14 0,-26 M290,520 q8,-14 0,-26" stroke="{NAVY}" stroke-width="7" fill="none" '
                 f'stroke-linecap="round" opacity=".35"/>')
    if pose == 'oops':
        g.append(f'<path d="M340,126 C352,146 360,156 360,166 A14,14 0 0 1 332,166 C332,156 334,146 340,126Z" fill="{J["aqua"]}" '
                 f'stroke="{NAVY}" stroke-width="6"/><ellipse cx="340" cy="162" rx="4" ry="6" fill="#fff"/>')
    if pose == 'think':
        g.append(f'<circle cx="60" cy="150" r="9" fill="#fff" stroke="{NAVY}" stroke-width="5"/>'
                 f'<circle cx="36" cy="116" r="14" fill="#fff" stroke="{NAVY}" stroke-width="5"/>')
    out.append(f'<g transform="translate(0,{lift})">' + ''.join(g) + '</g>')
    return ''.join(out)


def _eye(cx, cy, look=(0, 0), s=1):
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="{18*s}" ry="{24*s}" fill="{NAVY}"/>'
            f'<circle cx="{cx+6+look[0]}" cy="{cy-9+look[1]}" r="{7.5*s}" fill="#fff"/>'
            f'<circle cx="{cx-6+look[0]}" cy="{cy+9+look[1]}" r="{3.2*s}" fill="#fff" opacity=".9"/>')


def _nose():
    return (f'<path d="M184,208 Q200,198 216,208 Q210,224 200,226 Q190,224 184,208Z" fill="{NAVY}"/>'
            f'<ellipse cx="194" cy="207" rx="5" ry="3" fill="#fff" opacity=".7"/>')


def _face(p):
    if p == 'happy':
        return (_eye(156, 178) + _eye(244, 178) + _nose() +
                f'<path d="M168,238 Q200,282 232,238 Q200,250 168,238Z" fill="{NAVY}" stroke="{NAVY}" stroke-width="5" stroke-linejoin="round"/>'
                f'<path d="M184,258 Q200,272 216,258 Q200,248 184,258Z" fill="#FF7A92"/>')
    if p == 'cheer':
        arc = lambda cx: f'<path d="M{cx-17},{184} Q{cx},{156} {cx+17},{184}" stroke="{NAVY}" stroke-width="10" fill="none" stroke-linecap="round"/>'
        return (arc(156) + arc(244) + _nose() +
                f'<path d="M160,236 Q200,300 240,236 Q200,250 160,236Z" fill="{NAVY}" stroke="{NAVY}" stroke-width="6" stroke-linejoin="round"/>'
                f'<path d="M178,268 Q200,288 222,268 Q200,256 178,268Z" fill="#FF7A92"/>')
    if p == 'oops':
        return (_eye(156, 182, look=(-2, 2), s=.92) + _eye(244, 182, look=(-2, 2), s=.92) +
                f'<path d="M134,146 Q152,140 174,150" stroke="{NAVY}" stroke-width="8" fill="none" stroke-linecap="round" transform="rotate(-16 154 146)"/>'
                f'<path d="M226,150 Q248,140 266,146" stroke="{NAVY}" stroke-width="8" fill="none" stroke-linecap="round" transform="rotate(16 246 146)"/>'
                + _nose() +
                f'<path d="M180,250 q7,-9 14,0 q7,9 14,0 q7,-9 12,-2" stroke="{NAVY}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    if p == 'wink':
        return (_eye(156, 178) +
                f'<path d="M226,182 Q244,196 262,182" stroke="{NAVY}" stroke-width="10" fill="none" stroke-linecap="round"/>' + _nose() +
                f'<path d="M168,240 Q200,276 232,240" stroke="{NAVY}" stroke-width="8" fill="none" stroke-linecap="round"/>'
                f'<path d="M208,256 Q212,276 224,272 Q232,266 228,250Z" fill="#FF7A92" stroke="{NAVY}" stroke-width="5" stroke-linejoin="round"/>')
    if p == 'think':
        return (_eye(156, 176, look=(4, -4)) + _eye(244, 176, look=(4, -4)) + _nose() +
                f'<path d="M136,146 Q152,136 170,142" stroke="{NAVY}" stroke-width="8" fill="none" stroke-linecap="round"/>'
                f'<path d="M184,250 Q204,244 222,252" stroke="{NAVY}" stroke-width="7" fill="none" stroke-linecap="round"/>')
    return ''


# ---------------------------------------------------------------- wordmark
_FONT = None


def glyphs(text, size, font='node_modules/@fontsource/lilita-one/files/lilita-one-latin-400-normal.woff2', track=0):
    """Returns [(char, full_path, solid_path, x, advance)], width.
    solid_path = outer contours only (counters removed), worked out from the font's own points."""
    from fontTools.pens.recordingPen import RecordingPen
    global _FONT
    if _FONT is None:
        _FONT = TTFont(font)
    f = _FONT; gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    sc = size / upm; x = 0; out = []
    for ch in text:
        g = gs[cmap[ord(ch)]]
        rec = RecordingPen()
        g.draw(TransformPen(rec, (sc, 0, 0, -sc, x, 0)))
        contours, cur = [], []
        for op, args in rec.value:
            cur.append((op, args))
            if op in ('closePath', 'endPath'):
                contours.append(cur); cur = []
        if cur: contours.append(cur)
        boxes = []
        for c in contours:
            pts = [p for _, a in c for p in a if p is not None]
            xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
            boxes.append((min(xs), min(ys), max(xs), max(ys)) if pts else (0, 0, 0, 0))

        def to_path(cs):
            pen = SVGPathPen(gs)
            for c in cs:
                for op, args in c:
                    getattr(pen, op)(*args)
            return pen.getCommands()
        outer = [c for i, c in enumerate(contours)
                 if not any(j != i and o[0] <= boxes[i][0] and o[1] <= boxes[i][1] and o[2] >= boxes[i][2] and o[3] >= boxes[i][3]
                            for j, o in enumerate(boxes))]
        out.append((ch, to_path(contours), to_path(outer), x, g.width * sc))
        x += g.width * sc + track
    return out, x - track


WM_COLORS = ['ruby', 'amber', 'topaz', 'emerald', 'aqua', 'amethyst', 'rose', 'ruby', 'amber', 'topaz', 'aqua']


def outer_only(path):
    """Drop counters (inner contours) so the navy rim/shadow is solid inside o, e, B, P alike."""
    import re
    subs = [p.strip() for p in re.split(r'(?=M)', path) if p.strip()]
    boxes = []
    for sp in subs:
        nums = [float(n) for n in re.findall(r'-?\d+(?:\.\d+)?', sp)]
        xs, ys = nums[0::2], nums[1::2]
        boxes.append((min(xs), min(ys), max(xs), max(ys)))
    keep = []
    for i, b in enumerate(boxes):
        inside = any(j != i and o[0] <= b[0] and o[1] <= b[1] and o[2] >= b[2] and o[3] >= b[3]
                     for j, o in enumerate(boxes))
        if not inside:
            keep.append(subs[i])
    return ' '.join(keep)


def word(d, text, size, colors, track=4, hop=True, outline=None, seed=0, layers=False):
    """Candy wordmark: each letter its own jewel color, chunky navy rim, glossy top, slight hop.
    Returns (svg, width, height_above_baseline)."""
    gl, W = glyphs(text, size, track=track)
    ow = outline or size * .16
    parts_shadow, parts_rim, parts_fill = [], [], []
    ci = 0
    for i, (ch, path, solid, x, w) in enumerate(gl):
        if ch == ' ':
            continue
        col = J[colors[ci % len(colors)]]; ci += 1
        dy = (-size * .05 if (i % 2 == 0) else size * .02) if hop else 0
        rot = ([-5, 3, -3, 4, -2, 3, -4, 2, -3, 4, -2, 3][i % 12]) if hop else 0
        cx = x + w / 2
        tr = f'translate(0,{dy:.1f}) rotate({rot},{cx:.1f},{-size*.35:.1f})'
        gid = d.add(f'wg-{col}', f'<linearGradient id="wg-{col[1:]}" x1="0" y1="0" x2="0" y2="1">'
                                 f'<stop offset="0" stop-color="{light(col,.3)}"/><stop offset=".4" stop-color="{col}"/>'
                                 f'<stop offset="1" stop-color="{dark(col,.2)}"/></linearGradient>')
        cid = d.uid('wc')
        parts_shadow.append(f'<path d="{solid}" transform="{tr} translate(0,{size*.07:.1f})" fill="{NAVY}" stroke="{NAVY}" '
                            f'stroke-width="{ow*2:.1f}" stroke-linejoin="round"/>')
        parts_rim.append(f'<path d="{solid}" transform="{tr}" fill="{NAVY}" stroke="{NAVY}" stroke-width="{ow*2:.1f}" stroke-linejoin="round"/>')
        parts_fill.append(
            f'<g transform="{tr}"><clipPath id="{cid}"><path d="{path}"/></clipPath>'
            f'<path d="{path}" fill="url(#wg-{col[1:]})"/>'
            f'<g clip-path="url(#{cid})">'
            f'<path d="{path}" fill="none" stroke="{dark(col,.35)}" stroke-width="{size*.05:.1f}" transform="translate({size*.02:.1f},{size*.03:.1f})" opacity=".5"/>'
            f'<ellipse cx="{x+w*.42:.1f}" cy="{-size*.56:.1f}" rx="{w*.4:.1f}" ry="{size*.1:.1f}" fill="#fff" opacity=".38"/>'
            f'</g>'
            f'</g>')
    if layers:
        return (''.join(parts_shadow), ''.join(parts_rim), ''.join(parts_fill)), W, size * .75
    svg = ('<g>' + ''.join(parts_shadow) + ''.join(parts_rim) + ''.join(parts_fill) + '</g>')
    return svg, W, size * .75
