"""Trames de grain filmique (public/fx/grain-0..7.png), superposées en lumière douce dans le montage."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

out = Path("public/fx")
out.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(11)
for i in range(8):
    n = rng.normal(128, 38, (960, 540)).clip(0, 255).astype(np.uint8)
    im = Image.fromarray(n, "L").filter(ImageFilter.GaussianBlur(0.55)).resize((1080, 1920), Image.BILINEAR)
    im.save(out / f"grain-{i}.png", optimize=True)
    print("→", out / f"grain-{i}.png")
