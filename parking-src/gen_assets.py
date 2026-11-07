#!/usr/bin/env python3
"""Графика для циферблата «Парковка» (Amazfit Active 2, 466x466)."""
import math, os, sys, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = sys.argv[1] if len(sys.argv) > 1 else 'assets'
os.makedirs(OUT, exist_ok=True)
K = 4  # сглаживание

COLORS = ['#f4f4f2', '#e4e6e9', '#d4d8dc', '#f7f5ee']
JACKETS = ['#4a8ad0', '#c94a4a', '#3aa676', '#e09a2e']
STATES = ['park', 'idle', 'fwd', 'rev', 'door']
FONT_B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def hexc(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


class Canvas:
    """Рисование в локальных координатах (0,0 — центр объекта) с суперсэмплингом."""
    def __init__(self, w, h, cx, cy):
        self.w, self.h, self.cx, self.cy = w, h, cx, cy
        self.img = Image.new('RGBA', (w * K, h * K), (0, 0, 0, 0))

    def P(self, x, y):
        return ((self.cx + x) * K, (self.cy + y) * K)

    def layer(self):
        return Image.new('RGBA', self.img.size, (0, 0, 0, 0))

    def comp(self, lay):
        self.img = Image.alpha_composite(self.img, lay)

    def rrect(self, x0, y0, x1, y1, r, fill, lay=None):
        L = lay if lay is not None else self.layer()
        ImageDraw.Draw(L).rounded_rectangle([self.P(x0, y0), self.P(x1, y1)], radius=r * K, fill=fill)
        if lay is None: self.comp(L)
        return L

    def rect(self, x0, y0, x1, y1, fill):
        L = self.layer(); ImageDraw.Draw(L).rectangle([self.P(x0, y0), self.P(x1, y1)], fill=fill); self.comp(L)

    def poly(self, pts, fill):
        L = self.layer(); ImageDraw.Draw(L).polygon([self.P(x, y) for x, y in pts], fill=fill); self.comp(L)

    def ellipse(self, x, y, rx, ry, fill):
        L = self.layer(); ImageDraw.Draw(L).ellipse([self.P(x - rx, y - ry), self.P(x + rx, y + ry)], fill=fill); self.comp(L)

    def line(self, x0, y0, x1, y1, w, fill):
        L = self.layer(); d = ImageDraw.Draw(L)
        d.line([self.P(x0, y0), self.P(x1, y1)], fill=fill, width=int(w * K))
        for (x, y) in ((x0, y0), (x1, y1)):
            px, py = self.P(x, y); r = w * K / 2
            d.ellipse([px - r, py - r, px + r, py + r], fill=fill)
        self.comp(L)

    def cone(self, x0, x1, w0, w1, alpha, rgb=(255, 244, 205)):
        # рассеянный свет фар: без жёстких краёв, мягко гаснет вдаль и к бокам
        H, W = self.img.size[1], self.img.size[0]
        ys, xs = np.mgrid[0:H, 0:W]
        lx = xs / K - self.cx; ly = ys / K - self.cy
        t = (lx - x0) / (x1 - x0)
        tc = np.clip(t, 0, 1)
        width = w0 + (w1 - w0) * tc
        lat = np.exp(-1.3 * (ly / width) ** 2)
        lon = np.where((t >= 0) & (t <= 1), np.clip(t * 6, 0, 1) * (1 - tc) ** 1.1, 0)
        a = np.clip(alpha * 255 * lat * lon, 0, 255).astype(np.uint8)
        arr = np.zeros((H, W, 4), np.uint8); arr[..., 0], arr[..., 1], arr[..., 2] = rgb; arr[..., 3] = a
        self.comp(Image.fromarray(arr, 'RGBA').filter(ImageFilter.GaussianBlur(K * 3)))

    def done(self):
        return self.img.resize((self.w, self.h), Image.LANCZOS)


def car(color, st):
    # изображение 128x72, центр машины в (64,36), нос смотрит вправо (+x)
    c = Canvas(128, 72, 64, 36)
    if st == 'fwd': c.cone(16, 64, 9, 32, 0.75)
    if st == 'idle': c.cone(16, 46, 8, 18, 0.4)
    sh = c.rrect(-19, -6.5, 21, 11.5, 6, (0, 0, 0, 135), lay=c.layer())
    c.comp(sh.filter(ImageFilter.GaussianBlur(K * 1.2)))
    body = c.rrect(-20, -9, 20, 9, 6, hexc(color), lay=c.layer())
    c.comp(body)
    mask = body.split()[3]
    hl = c.layer(); d = ImageDraw.Draw(hl)
    d.rectangle([c.P(-20, -9), c.P(20, -4.5)], fill=(255, 255, 255, 50))
    d.rectangle([c.P(-20, 4.5), c.P(20, 9)], fill=(0, 0, 0, 45))
    hl.putalpha(Image.fromarray(np.minimum(np.array(hl.split()[3]), np.array(mask))))
    c.comp(hl)
    c.rect(4, -11, 7, -8.6, hexc(color)); c.rect(4, 8.6, 7, 11, hexc(color))
    glass = hexc('#1b2028')
    c.poly([(3, -7.2), (8, -6.8), (10.5, -3), (10.5, 3), (8, 6.8), (3, 7.2)], glass)
    c.poly([(-10, -6.6), (-13.5, -5), (-14.5, 0), (-13.5, 5), (-10, 6.6)], glass)
    c.rect(-9, -8.2, 2, -6.6, hexc('#232a33')); c.rect(-9, 6.6, 2, 8.2, hexc('#232a33'))
    c.rrect(-10, -6.4, 3, 6.4, 3, hexc(color))
    c.rrect(-10, -6.4, 3, -1, 3, (255, 255, 255, 70))
    c.rrect(-10, 2, 3, 6.4, 3, (0, 0, 0, 25))
    head = '#fff6d2' if st in ('fwd', 'idle') else '#c9ced4'
    c.rect(18.6, -7, 20, -3.8, hexc(head)); c.rect(18.6, 3.8, 20, 7, hexc(head))
    tail = '#ff3030' if st in ('fwd', 'rev', 'idle') else '#8a2121'
    c.rect(-20, -7, -18.6, -4, hexc(tail)); c.rect(-20, 4, -18.6, 7, hexc(tail))
    if st == 'door':
        a = 1.05; ex, ey = 7 - 11 * math.cos(a), -9 - 11 * math.sin(a)
        c.line(7, -8, ex, ey + 1.5, 3.2, (0, 0, 0, 120))
        c.line(7, -9, ex, ey, 2.4, hexc(color))
    return c.done()


def person(jacket, sw):
    # 32x32, центр (16,16), смотрит вправо; масштаб 1.45 от прототипа
    k = 1.45
    c = Canvas(32, 32, 16, 16)
    L = c.layer(); ImageDraw.Draw(L).ellipse([c.P(-4*k, -5*k), c.P(6*k, 8*k)], fill=(0, 0, 0, 110)); c.comp(L.filter(ImageFilter.GaussianBlur(K)))
    c.ellipse(sw*k, -2.3*k, 2.4*k, 1.5*k, hexc('#1a1c21')); c.ellipse(-sw*k, 2.3*k, 2.4*k, 1.5*k, hexc('#1a1c21'))
    c.ellipse(-sw*.8*k, -5.6*k, 1.6*k, 1.6*k, hexc(jacket)); c.ellipse(sw*.8*k, 5.6*k, 1.6*k, 1.6*k, hexc(jacket))
    c.ellipse(0, 0, 3.4*k, 5.6*k, hexc(jacket))
    c.ellipse(-.6*k, -1.2*k, 1.6*k, 3*k, (255, 255, 255, 40))
    c.ellipse(.4*k, 0, 2.8*k, 2.8*k, hexc('#e2b48c')); c.ellipse(-.4*k, 0, 2.5*k, 2.5*k, hexc('#3a2a20'))
    return c.done()


def aod_car():
    c = Canvas(48, 24, 24, 12)
    g = hexc('#6b7078')
    L = c.layer(); d = ImageDraw.Draw(L)
    d.rounded_rectangle([c.P(-20, -9), c.P(20, 9)], radius=6 * K, outline=g, width=int(1.6 * K))
    d.line([c.P(10, -6), c.P(10, 6)], fill=g, width=int(1.4 * K))
    d.line([c.P(-12, -5), c.P(-12, 5)], fill=g, width=int(1.4 * K))
    c.comp(L)
    return c.done()


def sign(on):
    c = Canvas(20, 20, 10, 10)
    a = 255 if on else 72
    c.ellipse(0, 0, 8.5, 8.5, hexc('#2f6fe0', a))
    L = c.layer(); d = ImageDraw.Draw(L); f = ImageFont.truetype(FONT_B, 11 * K)
    d.text(c.P(0, 0.5), 'P', font=f, fill=(255, 255, 255, a if on else 90), anchor='mm'); c.comp(L)
    return c.done()


def sec_car():
    # такси для секунд — того же размера, что остальные машины (128x72, центр в (64,36))
    return car('#f2c230', 'fwd')


def dot():
    c = Canvas(10, 10, 5, 5); c.ellipse(0, 0, 3.4, 3.4, hexc('#f2c230')); return c.done()


def background():
    random.seed(7); rs = np.random.RandomState(7)
    S = 466
    base = np.zeros((S, S, 3), np.float32); base[:] = (22, 23, 26)
    noise = rs.rand(S, S)
    base[noise < .05] += 9
    base[noise > .93] -= 10
    ys, xs = np.mgrid[0:S, 0:S]; r = np.hypot(xs - 233, ys - 233)
    vig = 1.0 + 0.05 * np.clip(1 - r / 120, 0, 1) - 0.32 * np.clip((r - 120) / 113, 0, 1) ** 1.6
    base *= vig[..., None]
    # кольцевая дорога для секундной машинки
    band = np.clip(1 - np.abs(r - 220) / 12, 0, 1) ** .5 * 6
    ang = np.arctan2(ys - 233, xs - 233)
    dash = ((np.floor((ang + np.pi) / (2 * np.pi) * 90) % 2) == 0) & (np.abs(r - 220) < .7)
    base += band[..., None]
    base[dash] += 18
    base[r > 233.5] = 0
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), 'RGB')


if __name__ == '__main__':
    for i, col in enumerate(COLORS):
        for st in STATES:
            car(col, st).save(f'{OUT}/car_{i}_{st}.png', optimize=True)
    for j, jk in enumerate(JACKETS):
        person(jk, 3).save(f'{OUT}/man_{j}_0.png', optimize=True)
        person(jk, -3).save(f'{OUT}/man_{j}_1.png', optimize=True)
    aod_car().save(f'{OUT}/aod_car.png', optimize=True)
    sign(True).save(f'{OUT}/p_on.png', optimize=True)
    sign(False).save(f'{OUT}/p_off.png', optimize=True)
    sec_car().save(f'{OUT}/sec_car.png', optimize=True)
    background().save(f'{OUT}/bg.png', optimize=True)
    print('ok', len(os.listdir(OUT)))
