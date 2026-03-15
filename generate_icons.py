#!/usr/bin/env python3
"""
generate_icons.py — generates icons/icon-192.png and icons/icon-512.png

Requires:
    pip install Pillow

Usage:
    python generate_icons.py
"""

from PIL import Image, ImageDraw
import os
import math

os.makedirs('icons', exist_ok=True)

def draw_icon(size):
    img = Image.new('RGBA', (size, size), (245, 242, 235, 255))  # #f5f2eb
    draw = ImageDraw.Draw(img)
    cx, cy = size / 2, size / 2

    # Outer ring
    r_outer = size * 0.43
    draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer],
                 outline=(90, 122, 66, 71), width=max(1, int(size * 0.01)))

    # Inner ring
    r_inner = size * 0.35
    draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner],
                 outline=(90, 122, 66, 33), width=max(1, int(size * 0.006)))

    # Main circle — filled
    r_main = size * 0.234
    draw.ellipse([cx - r_main, cy - r_main, cx + r_main, cy + r_main],
                 fill=(122, 158, 90, 56),
                 outline=(90, 122, 66, 229), width=max(2, int(size * 0.02)))

    return img

for size in [192, 512]:
    img = draw_icon(size)
    path = f'icons/icon-{size}.png'
    img.save(path)
    print(f'{path} written')
