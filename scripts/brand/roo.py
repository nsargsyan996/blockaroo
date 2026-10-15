"""
Draws Roo, Blockaroo's kangaroo mascot, as layered SVG parts.

Every part shares one 240x260 canvas so the parts stack exactly; the app animates each layer separately (ears,
tail, arms, eyes...). Composed single-file versions (roo-happy / roo-oops / roo-cheer) feed the app icon and splash.

It also writes the app icon and Android adaptive icon (icon.svg, adaptive-icon.svg).

Run: pnpm brand:roo   (then `pnpm brand:build` for the PNGs)
"""
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "src", "assets", "brand")
PARTS = os.path.join(OUT, "roo")
os.makedirs(PARTS, exist_ok=True)

LINE = "#3D1F2B"          # warm dark outline, softer than black on the night background
W = 'stroke="#3D1F2B" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"'
VIEW = "0 0 240 260"

DEFS = """<defs>
<linearGradient id="fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC27A"/><stop offset="1" stop-color="#F2893D"/></linearGradient>
<linearGradient id="furDeep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F59A4C"/><stop offset="1" stop-color="#D96A28"/></linearGradient>
<linearGradient id="belly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1DC"/><stop offset="1" stop-color="#FFD6A3"/></linearGradient>
<linearGradient id="pouch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD9A8"/><stop offset="1" stop-color="#F4B877"/></linearGradient>
<linearGradient id="earIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB3C1"/><stop offset="1" stop-color="#FF8FA6"/></linearGradient>
<radialGradient id="iris" cx="0.45" cy="0.4" r="0.6"><stop offset="0" stop-color="#5B3FA0"/><stop offset="1" stop-color="#1E1240"/></radialGradient>
<radialGradient id="blush" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FF7F9C" stop-opacity="0.75"/><stop offset="1" stop-color="#FF7F9C" stop-opacity="0"/></radialGradient>
<linearGradient id="gem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8C96"/><stop offset="1" stop-color="#E5404F"/></linearGradient>
</defs>"""


def svg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VIEW}">\n{DEFS}\n{body}\n</svg>\n'


def ear(cx, sign):
    rot = 14 * sign
    return (f'<g transform="rotate({rot} {cx} 84)">'
            f'<path d="M{cx} 6 C {cx + 22} 10, {cx + 24} 58, {cx + 14} 84 L {cx - 14} 84 C {cx - 24} 58, {cx - 22} 10, {cx} 6 Z" fill="url(#fur)" {W}/>'
            f'<path d="M{cx} 20 C {cx + 12} 24, {cx + 13} 56, {cx + 7} 76 L {cx - 7} 76 C {cx - 13} 56, {cx - 12} 24, {cx} 20 Z" fill="url(#earIn)"/>'
            f'</g>')


PARTS_SVG = {
    "shadow": '<ellipse cx="120" cy="250" rx="64" ry="8" fill="#000000" opacity="0.28"/>',
    "tail": (f'<path d="M156 214 C 196 226, 232 204, 228 160 C 227 146, 211 144, 210 157 C 210 186, 192 198, 158 194 Z" fill="url(#fur)" {W}/>'
             '<path d="M224 162 C 224 152, 214 151, 213 160 C 213 168, 211 175, 208 181 C 216 179, 224 172, 224 162 Z" fill="#FFE2BF" opacity="0.9"/>'),
    "feet": "".join(
        f'<ellipse cx="{cx}" cy="238" rx="30" ry="12.5" fill="url(#furDeep)" {W}/>'
        f'<path d="M{cx - 14} 236 q4 -5 8 0 M{cx - 4} 235 q4 -5 8 0 M{cx + 6} 236 q4 -5 8 0" fill="none" stroke="#B5531D" stroke-width="2.4" stroke-linecap="round"/>'
        for cx in (90, 150)),
    "body": (f'<ellipse cx="120" cy="190" rx="54" ry="50" fill="url(#fur)" {W}/>'
             '<ellipse cx="120" cy="197" rx="36" ry="37" fill="url(#belly)"/>'
             # gem block peeking from the pouch
             '<g transform="rotate(-8 120 186)"><rect x="104" y="170" width="32" height="32" rx="8" fill="#C93A4B" stroke="#3D1F2B" stroke-width="3.5"/>'
             '<rect x="106.5" y="172" width="27" height="25" rx="6" fill="url(#gem)"/>'
             '<rect x="110" y="175" width="9" height="5" rx="2.5" fill="#FFFFFF" opacity="0.75"/></g>'
             f'<path d="M86 199 Q120 214 154 199 Q153 229 120 231 Q87 229 86 199 Z" fill="url(#pouch)" {W}/>'
             '<path d="M96 208 Q120 216 144 208" fill="none" stroke="#E2A15F" stroke-width="2.5" stroke-linecap="round"/>'),
    "arm-left": f'<ellipse cx="92" cy="188" rx="11" ry="16" transform="rotate(-28 92 188)" fill="url(#fur)" {W}/>',
    "arm-right": f'<ellipse cx="148" cy="188" rx="11" ry="16" transform="rotate(28 148 188)" fill="url(#fur)" {W}/>',
    "ear-left": ear(88, -1),
    "ear-right": ear(152, 1),
    "head": (f'<ellipse cx="120" cy="102" rx="64" ry="56" fill="url(#fur)" {W}/>'
             '<path d="M72 78 Q86 54 112 50" fill="none" stroke="#FFE0B8" stroke-width="5" stroke-linecap="round" opacity="0.7"/>'
             f'<path d="M108 50 Q113 36 120 47 Q127 35 132 51" fill="url(#fur)" {W}/>'
             '<ellipse cx="120" cy="125" rx="35" ry="24" fill="url(#belly)"/>'
             '<ellipse cx="80" cy="120" rx="15" ry="10" fill="url(#blush)"/><ellipse cx="160" cy="120" rx="15" ry="10" fill="url(#blush)"/>'
             '<path d="M110 108 Q120 103 130 108 Q130 116 120 118 Q110 116 110 108 Z" fill="#3D1F2B"/>'
             '<ellipse cx="116" cy="108" rx="3.5" ry="2" fill="#FFFFFF" opacity="0.6"/>'),
    # Eyes are their own layer so the app can blink them (scaleY around y=94).
    "eyes-happy": "".join(
        f'<ellipse cx="{cx}" cy="94" rx="14" ry="16.5" fill="#FFFFFF" {W}/>'
        f'<ellipse cx="{cx + 2}" cy="97" rx="9.5" ry="12" fill="url(#iris)"/>'
        f'<circle cx="{cx + 5.5}" cy="91" r="3.8" fill="#FFFFFF"/><circle cx="{cx - 1}" cy="102" r="1.8" fill="#FFFFFF" opacity="0.8"/>'
        for cx in (96, 144)) +
        '<path d="M84 72 Q94 67 104 71 M136 71 Q146 67 156 72" fill="none" stroke="#3D1F2B" stroke-width="3.5" stroke-linecap="round"/>',
    "eyes-oops": "".join(
        f'<ellipse cx="{cx}" cy="94" rx="14" ry="16.5" fill="#FFFFFF" {W}/>'
        f'<circle cx="{cx}" cy="96" r="6.5" fill="url(#iris)"/><circle cx="{cx + 2.5}" cy="93" r="2.2" fill="#FFFFFF"/>'
        for cx in (96, 144)) +
        '<path d="M83 74 Q94 72 105 65 M135 65 Q146 72 157 74" fill="none" stroke="#3D1F2B" stroke-width="3.5" stroke-linecap="round"/>',
    "eyes-cheer": ('<path d="M84 98 Q96 82 108 98 M132 98 Q144 82 156 98" fill="none" stroke="#3D1F2B" stroke-width="5" stroke-linecap="round"/>'
                   '<path d="M84 70 Q94 64 104 69 M136 69 Q146 64 156 70" fill="none" stroke="#3D1F2B" stroke-width="3.5" stroke-linecap="round"/>'),
    "mouth-happy": ('<path d="M106 124 Q120 142 134 124 Q120 130 106 124 Z" fill="#3D1F2B" stroke="#3D1F2B" stroke-width="3" stroke-linejoin="round"/>'
                    '<path d="M113 131 Q120 127 127 131 Q124 136 120 136 Q116 136 113 131 Z" fill="#FF7A8E"/>'),
    "mouth-oops": ('<ellipse cx="120" cy="131" rx="6.5" ry="7.5" fill="#3D1F2B"/>'
                   '<path d="M181 58 Q192 75 181 82 Q170 75 181 58 Z" fill="#A6E4FF" stroke="#3D1F2B" stroke-width="3" stroke-linejoin="round"/>'
                   '<ellipse cx="178" cy="73" rx="2" ry="3" fill="#FFFFFF" opacity="0.8"/>'),
    "mouth-cheer": ('<path d="M102 121 Q120 150 138 121 Q120 128 102 121 Z" fill="#3D1F2B" stroke="#3D1F2B" stroke-width="3" stroke-linejoin="round"/>'
                    '<path d="M110 132 Q120 126 130 132 Q126 140 120 140 Q114 140 110 132 Z" fill="#FF7A8E"/>'),
}

# Cheer pose raises both arms: same arm shape rotated up around the shoulder.
PARTS_SVG["arm-left-up"] = f'<ellipse cx="66" cy="150" rx="11" ry="19" transform="rotate(40 66 150)" fill="url(#fur)" {W}/>'
PARTS_SVG["arm-right-up"] = f'<ellipse cx="174" cy="150" rx="11" ry="19" transform="rotate(-40 174 150)" fill="url(#fur)" {W}/>'

for name, body in PARTS_SVG.items():
    with open(os.path.join(PARTS, f"{name}.svg"), "w") as f:
        f.write(svg(body))

ORDER = {
    "happy": ["shadow", "tail", "feet", "body", "arm-left", "arm-right", "ear-left", "ear-right", "head", "eyes-happy", "mouth-happy"],
    "oops": ["shadow", "tail", "feet", "body", "arm-left", "arm-right", "ear-left", "ear-right", "head", "eyes-oops", "mouth-oops"],
    "cheer": ["shadow", "tail", "feet", "body", "ear-left", "ear-right", "head", "eyes-cheer", "mouth-cheer", "arm-left-up", "arm-right-up"],
}


def compose(mood, shadow=True):
    return "\n".join(PARTS_SVG[p] for p in ORDER[mood] if shadow or p != "shadow")


for mood in ORDER:
    with open(os.path.join(OUT, f"roo-{mood}.svg"), "w") as f:
        f.write(svg(compose(mood)))

# App icon: night tile with a violet glow, three jewel blocks and Roo.
JEWELS = [("#38C7F0", "#8BE1F8", "#1A93BD"), ("#3ED68A", "#86EDB8", "#1FA463"), ("#8F6BFF", "#BBA5FF", "#6343D6")]


def jewel(x, y, size, color, rot):
    base, light, shade = color
    r = size * 0.22
    return (f'<g transform="rotate({rot} {x + size / 2} {y + size / 2})">'
            f'<rect x="{x}" y="{y}" width="{size}" height="{size}" rx="{r}" fill="{shade}" stroke="#000000" stroke-opacity="0.3" stroke-width="3"/>'
            f'<rect x="{x + size * 0.06}" y="{y + size * 0.05}" width="{size * 0.88}" height="{size * 0.81}" rx="{r * 0.75}" fill="{base}"/>'
            f'<rect x="{x + size * 0.06}" y="{y + size * 0.05}" width="{size * 0.88}" height="{size * 0.36}" rx="{r * 0.75}" fill="{light}" opacity="0.45"/>'
            f'<rect x="{x + size * 0.16}" y="{y + size * 0.12}" width="{size * 0.18}" height="{size * 0.12}" rx="{size * 0.06}" fill="#FFFFFF" opacity="0.7"/></g>')


TRAY = jewel(0, 0, 230, JEWELS[0], -6) + jewel(250, 20, 230, JEWELS[1], 3) + jewel(500, 0, 230, JEWELS[2], 7)
ROO = f'<g transform="translate(212 40) scale(2.5)">{compose("happy", shadow=False)}</g>'
ICON_DEFS = """<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1F6B"/><stop offset="1" stop-color="#110C30"/></linearGradient>
<radialGradient id="glow" cx="0.5" cy="0.42" r="0.5"><stop offset="0" stop-color="#8F6BFF" stop-opacity="0.55"/><stop offset="1" stop-color="#8F6BFF" stop-opacity="0"/></radialGradient>"""
icon = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
{DEFS.replace("<defs>", "<defs>" + ICON_DEFS)}
<rect width="1024" height="1024" fill="url(#sky)"/><circle cx="512" cy="430" r="470" fill="url(#glow)"/>
<circle cx="150" cy="160" r="6" fill="#FFFFFF" opacity="0.7"/><circle cx="880" cy="230" r="5" fill="#FFFFFF" opacity="0.6"/>
<circle cx="760" cy="110" r="4" fill="#FFFFFF" opacity="0.5"/><circle cx="260" cy="330" r="3.5" fill="#FFFFFF" opacity="0.5"/>
<g transform="translate(140 742)">{TRAY}</g>{ROO}
</svg>
'''
adaptive = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
{DEFS}
<g transform="translate(512 512) scale(0.62) translate(-512 -512)"><g transform="translate(140 742)">{TRAY}</g>{ROO}</g>
</svg>
'''
with open(os.path.join(OUT, "icon.svg"), "w") as f:
    f.write(icon)
with open(os.path.join(OUT, "adaptive-icon.svg"), "w") as f:
    f.write(adaptive)

if __name__ == "__main__":
    print("wrote", len(PARTS_SVG), "parts and", len(ORDER), "poses to", os.path.normpath(OUT))
