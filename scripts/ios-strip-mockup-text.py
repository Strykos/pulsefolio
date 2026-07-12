#!/usr/bin/env python3
"""Strip baked demo text from approved Option B mockups — calibrated to 1024×1536 PNGs."""

from __future__ import annotations

import statistics
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
MOCKUPS = ROOT / "apps/ios/Pulsefolio/Resources/Mockups"

# (x, y, w, h, radius) — normalized; keep in sync with MockupLiveOverlay.swift
Slot = tuple[float, float, float, float, int]

BRIEFING: list[Slot] = [
    (0.04, 0.118, 0.56, 0.050, 10),   # portfolio value
    (0.04, 0.155, 0.54, 0.036, 8),    # day change
    (0.12, 0.188, 0.48, 0.038, 8),    # chart-area duplicate day line
    (0.22, 0.435, 0.72, 0.048, 12),   # glass card
    (0.22, 0.528, 0.72, 0.052, 10),   # AI decision line
    (0.12, 0.638, 0.30, 0.048, 12),   # allocation donut center
    (0.55, 0.630, 0.38, 0.090, 12),   # risk gauge center
    (0.08, 0.720, 0.38, 0.090, 12),   # confidence ring center
    (0.55, 0.720, 0.40, 0.090, 10),   # drift alert copy
]

DECISION: list[Slot] = [
    (0.05, 0.090, 0.82, 0.058, 10),   # headline
    (0.05, 0.128, 0.85, 0.050, 8),    # risk subtitle (full width)
    (0.10, 0.268, 0.24, 0.058, 10),   # before donut value
    (0.60, 0.268, 0.24, 0.058, 10),   # after donut value
    (0.08, 0.468, 0.18, 0.060, 10),   # confidence orb
    (0.41, 0.468, 0.18, 0.060, 10),   # return orb
    (0.74, 0.468, 0.18, 0.060, 10),   # guardrails orb
    (0.07, 0.576, 0.86, 0.034, 4),    # table row 1
    (0.07, 0.606, 0.86, 0.034, 4),
    (0.07, 0.636, 0.86, 0.034, 4),
    (0.07, 0.666, 0.86, 0.034, 4),
    (0.07, 0.696, 0.86, 0.034, 4),
]

PORTFOLIO: list[Slot] = [
    (0.04, 0.118, 0.52, 0.050, 10),   # total value
    (0.04, 0.155, 0.48, 0.036, 8),    # day change
    (0.72, 0.112, 0.22, 0.050, 10),   # asset count badge
    (0.08, 0.318, 0.36, 0.058, 8),    # AAPL tile text band
    (0.56, 0.318, 0.36, 0.058, 8),    # MSFT tile text band
    (0.06, 0.498, 0.28, 0.052, 8),    # VTI tile text band
    (0.36, 0.498, 0.28, 0.052, 8),    # BTC tile text band
    (0.66, 0.498, 0.28, 0.052, 8),    # BND tile text band
    (0.08, 0.648, 0.84, 0.038, 6),    # holdings row 1
    (0.08, 0.688, 0.84, 0.038, 6),
    (0.08, 0.728, 0.84, 0.038, 6),
    (0.08, 0.768, 0.84, 0.038, 6),
]


def sample_fill(src: Image.Image, left: int, top: int, right: int, bottom: int) -> tuple[int, int, int]:
    """Sample tile border pixels — avoids picking up glyph colors from slot center."""
    w, h = src.size
    border: list[tuple[int, int, int]] = []
    for x in range(left + 2, right - 2, max(4, (right - left) // 8)):
        for y in (top + 2, bottom - 3):
            if 0 <= x < w and 0 <= y < h:
                px = src.getpixel((x, y))
                border.append(px[:3] if not isinstance(px, int) else (px, px, px))
    for y in range(top + 2, bottom - 2, max(4, (bottom - top) // 8)):
        for x in (left + 2, right - 3):
            if 0 <= x < w and 0 <= y < h:
                px = src.getpixel((x, y))
                border.append(px[:3] if not isinstance(px, int) else (px, px, px))
    if not border:
        px = src.getpixel((max(0, left - 6), top + (bottom - top) // 2))
        border.append(px[:3] if not isinstance(px, int) else (px, px, px))
    return tuple(int(statistics.median(c)) for c in zip(*border))  # type: ignore[return-value]


def strip_slots(src: Image.Image, slots: list[Slot]) -> Image.Image:
    out = src.copy()
    w, h = out.size
    for x, y, sw, sh, _radius in slots:
        left = int(x * w)
        top = int(y * h)
        right = int((x + sw) * w)
        bottom = int((y + sh) * h)
        pad = 6
        el = max(0, left - pad)
        et = max(0, top - pad)
        er = min(w, right + pad)
        eb = min(h, bottom + pad)
        region = out.crop((el, et, er, eb))
        blurred = region.filter(ImageFilter.GaussianBlur(radius=14))
        out.paste(blurred, (el, et))
    return out


def ghost_pixels(src: Image.Image, clean: Image.Image, slots: list[Slot]) -> int:
    """Count bright pixels that changed < 30 luminance in strip regions (likely ghost text)."""
    w, h = src.size
    count = 0
    for x, y, sw, sh, _ in slots:
        left, top = int(x * w), int(y * h)
        right, bottom = int((x + sw) * w), int((y + sh) * h)
        for py in range(top, bottom, 3):
            for px in range(left, right, 3):
                s = src.getpixel((px, py))
                c = clean.getpixel((px, py))
                if max(s) > 130 and sum(abs(s[i] - c[i]) for i in range(3)) < 30:
                    count += 1
    return count


def process(name: str, slots: list[Slot]) -> int:
    src_path = MOCKUPS / f"{name}.png"
    dst_path = MOCKUPS / f"{name}-clean.png"
    src = Image.open(src_path).convert("RGB")
    cleaned = strip_slots(src, slots)
    cleaned.save(dst_path, optimize=True)
    ghosts = ghost_pixels(src, cleaned, slots)
    print(f"Wrote {dst_path} (ghost_pixels={ghosts})")
    return ghosts


def main() -> None:
    total = 0
    total += process("pulsefolio-ios-option-b-briefing", BRIEFING)
    total += process("pulsefolio-ios-option-b-decision", DECISION)
    total += process("pulsefolio-ios-option-b-portfolio", PORTFOLIO)
    if total > 30:
        print(f"WARNING: {total} possible ghost pixels remain — tune slots", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
