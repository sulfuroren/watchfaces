#!/usr/bin/env python3
"""Превью циферблата: собирает сцену из тех же картинок и координат, что и код часов."""
import math, sys
from PIL import Image, ImageDraw, ImageFont

A = sys.argv[1]; OUT = sys.argv[2]; HH, MM = sys.argv[3], sys.argv[4]
extra = sys.argv[5] if len(sys.argv) > 5 else ''
C = 233
DX = [38, 140, 250, 352]; ROWS = [169, 233, 297]; VY = [201, 265]; CORR = [25, 127, 339, 441]
SEGS = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg']


def info(d, s):
    x0 = DX[d]
    return {'a': ('h', x0 + 38, ROWS[0], 0), 'g': ('h', x0 + 38, ROWS[1], 0), 'd': ('h', x0 + 38, ROWS[2], 0),
            'f': ('v', x0 + 9, VY[0], 1), 'b': ('v', x0 + 67, VY[0], 1),
            'e': ('v', x0 + 9, VY[1], 0), 'c': ('v', x0 + 67, VY[1], 0)}[s]


def heading(d, i):
    t, x, y, up = i
    if t == 'h': return 0 if CORR[d] > x else 180
    return 90 if up else -90


img = Image.open(f'{A}/bg.png').convert('RGBA')


def put(src, x, y, deg, box, pos):
    sp = Image.open(f'{A}/{src}').convert('RGBA')
    tile = Image.new('RGBA', (box, box), (0, 0, 0, 0)); tile.paste(sp, pos, sp)
    tile = tile.rotate(-deg, resample=Image.BICUBIC, center=(box / 2, box / 2))
    img.alpha_composite(tile, (int(round(x - box / 2)), int(round(y - box / 2))))


digits = [int(HH[0]), int(HH[1]), int(MM[0]), int(MM[1])]
k = 0
for d, v in enumerate(digits):
    for s in SEGS[v]:
        i = info(d, s)
        st = 'idle' if (extra == 'idle' and k % 5 == 2) else 'park'
        put(f'car_{k % 4}_{st}.png', i[1], i[2], heading(d, i), 128, (0, 28)); k += 1
if extra == 'idle':
    put('man_0_0.png', 127, 120, 90, 32, (0, 0))
    put('man_2_1.png', 339, 330, -90, 32, (0, 0))
for y in VY: put('p_on.png', C, y, 0, 20, (0, 0))
a = math.radians(42 * 6 - 90); put('sec_car.png', C + math.cos(a) * 220, C + math.sin(a) * 220, math.degrees(a) + 90, 128, (0, 28))
if extra == 'idle':
    put('car_1_fwd.png', 127, 120, -90, 128, (0, 28))
d = ImageDraw.Draw(img)
f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 21)
d.text((C, 118), 'ВС · 08', font=f, fill=(233, 231, 225), anchor='mm')
img.convert('RGB').save(OUT)
print('ok')
