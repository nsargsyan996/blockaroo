# Hoppy Blocks: Art Kit v3

All artwork was made from scratch as vector shapes. No stock assets, traced images or references to other games were
used.

## Changes since v2

- **"p" bowls:** the slivers inside both "p"s are gone, in both logos and everywhere the logo appears.
    - **Cause:** the step that removes letter holes from the navy outline read the font's outline commands wrongly. "o"
      happened to work, but the counters in "p" slipped through.
    - **Fix:** letter holes are now found from the font's own points.
    - **Check:** a pixel test finds 0 enclosed holes in the one-line logo, the stacked logo and the splash.
- **Rig tail:** the rig canvas is now **520×600**. Roo sits at offset (60, 40), so the tail, ears and arms have room to
  sway. The tail was also pulled in slightly, so it now clears the canvas edge by about 75 px at 1×. Pivots in
  roo_rig.json already include the offset.
- **Extra fixes the same pixel test found:**
    - Cheer pose: closed a small wedge between the raised arms and the head. It showed on the splash.
    - Happy pose (single file and adaptive icon): moved the waving hand clear of the head.
    - Oops: moved the sweat drop clear of the folded ear.
    - Thinking: moved the thought bubbles clear of the folded ear.
    - The single-pose files are now 400×560, so the cheer pose's ear no longer touches the top edge.
- **One gap left on purpose:** in Oops, the space inside the bent arm (hand on cheek) is see-through.

## Changes since v1

**Fixed (stacked logo, one-line logo, splash)**

- Both "p"s in "Hoppy" now have their descenders. The two lines are now painted layer by layer: all shadows, then all
  outlines, then all colours. Before, the outline of "Blocks" was painted over the "Hoppy" descenders. The line spacing
  is also a little larger.
- The stray marks between the two lines are gone. They were leftover pieces of those covered descenders.
- The inside of every letter is now solid navy: o, e, B, P and the rest. The outline used to keep each letter's holes,
  and the holes in the "o"s were bigger than the stroke could fill. This also fixes the dots inside the "o"s in the
  one-line logo.

**Design changes**

- **Folded ear.** Roo's right ear now folds over at the tip. It's Roo's signature shape and tells Roo apart from a
  bunny. The tail is also bigger.
- **App icon.** Roo is now shown full body, so the pouch block, tail, big feet and folded ear all show at home-screen
  size.
- **Adaptive icon.** Same full-body Roo, scaled so the ear, tail and blocks sit well inside the 66% safe circle.
- **Screenshot frames.** Roo now peeks over the top edge of the screenshot panel, from behind it. Nothing covers the
  screenshot, including the piece tray. The separate overlay layer is gone.
- **New: Roo rig** in 6_mascot_roo/rig/ (see below).

## What's inside

| #   | Folder              | Notes                                                                                                                                                                         |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 1_app_icon          | 1024², square, no transparency, no text.                                                                                                                                      |
| 2   | 2_android_adaptive  | Foreground (transparent) + background. Flat background colour: **#2B5BE0**. adaptive_safezone_check.png is only a check image. Don't upload it.                               |
| 3   | 3_logo              | One-line + stacked, transparent + \_on_blue previews. SVG + PNG at 2×. The letters are outlined paths, so no font install is needed.                                          |
| 4   | 4_splash            | 1200², transparent. Cheering Roo + stacked logo.                                                                                                                              |
| 5   | 5_feature_graphic   | 1024×500, PNG/JPG/SVG. The logo is the only text.                                                                                                                             |
| 6   | 6_mascot_roo        | Character sheet, 5 single poses (Happy, Cheering, Oops, Nice move, Thinking), plus the rig/ folder.                                                                           |
| 7   | 7_screenshot_frames | iPhone 1290×2796, iPad 2064×2752, Android 1080×1920. `frame_*` puts your screenshot on the panel and leaves the top ~22% for the headline. `background_*` is the plain stage. |

## Roo rig (6_mascot_roo/rig)

- `parts/`: 27 parts, each as SVG + PNG at 2×. Parts: tail, feet, body, pouch block, pouch front, ears, head, nose, 5
  eye sets, 5 mouths, arms, sweat drop, sparkles, shadow.
- **Every part is drawn on the same 520×600 canvas.** Roo sits at offset (60, 40), which leaves room for parts to sway.
  Stack the parts at (0,0) and Roo assembles with no offsets.
- `roo_rig.json`: draw order (back to front), pivot point and parent for each part. Example: the arms rotate around the
  shoulders, the head around the neck, the tail around its base.
- `roo_rig_layered.svg`: all parts as named groups (`id`, `data-pivot`, `data-parent`), with the neutral pose showing.
- Show one `eyes_*` and one `mouth_*` at a time. To rebuild a pose:
    - Happy: open + smile
    - Cheer: closed_happy + laugh, sparkles
    - Oops: worried + wobble, sweat drop, ears drooped about 26°
    - Nice move: wink + tongue
    - Thinking: look_up + hmm
- For poses with an arm above the head, use `arm_*_behind_head` instead of `arm_*`. It's the same art on a layer behind
  the head.
- These names were picked for the art. Map them to the part names in your existing rig in src/assets/brand/roo/.

## Palette

Stage: #2B5BE0 / #1438B8 / #0A1F7A · Outline: #0A1C5E Jewels: aqua #38C7F0, emerald #3ED68A, amethyst #8F6BFF, ruby
#FF5F6D, topaz #FFD23F, amber #FF9A3C, rose #FF6FC1 Roo: fur #F7A14C, light #FFC983, shade #D9772E, cream #FFF0D6, blush
#FF9EBB

## Editing

- The SVGs are plain SVG 1.1 using only gradients and clip paths, which react-native-svg supports. They open in Figma,
  Illustrator, Inkscape and Affinity.
- The faint background grid uses an SVG `<pattern>`. Figma flattens patterns on import. If you need to edit the grid
  there, redraw it as lines.
- `source_generator/` builds everything:
    - `python3 build.py` makes the art and `python3 rig.py` makes the rig.
    - Both need fontTools and rsvg-convert.
    - `python3 check.py` runs the pixel checks for holes and edge clipping. It also needs numpy, scipy and Pillow.
    - The scripts read Lilita One from `node_modules/@fontsource/lilita-one`. Run `npm i @fontsource/lilita-one` first.

## Rights

The artwork is original to this commission. Full commercial rights belong to the client. The wordmark letterforms come
from **Lilita One** (SIL Open Font License 1.1). The OFL allows commercial use of artwork made with the font, including
logos and outlined text. The licence text is included. The font file itself is not part of the kit.
