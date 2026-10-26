"""Bruitages synthétisés (numpy/scipy) pour compléter ceux d'ElevenLabs.

Produit public/sfx/{impact,riser,pop,flap,sparkle}.wav. Les fichiers déjà générés par
ElevenLabs (scripts/sfx.mjs, en .mp3) restent prioritaires : voir src/sfx.ts.
Usage : python3 scripts/synth_sfx.py
"""
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(11)
OUT = Path(__file__).resolve().parent.parent / "public" / "sfx"
OUT.mkdir(parents=True, exist_ok=True)


def t_(d):
    return np.arange(int(d * SR)) / SR


def bp(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=4):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=4):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def save(name, x, stereo_width=0.0):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    if stereo_width > 0:
        d = int(0.011 * SR)
        r = np.concatenate([np.zeros(d), x[:-d]])
        st = np.stack([x, x * (1 - stereo_width) + r * stereo_width], axis=1)
    else:
        st = np.stack([x, x], axis=1)
    wavfile.write(OUT / f"{name}.wav", SR, (st * 32767).astype(np.int16))
    print("→", OUT / f"{name}.wav")


# Gros impact : sub qui plonge + claquement + traîne scintillante
t = t_(2.4)
sub = np.sin(2 * np.pi * (55 * t - 18 * t**2 * (t < 0.6))) * np.exp(-t * 2.2)
knock = lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 30)
crack = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 18) * 0.5
shimmer = sum(np.sin(2 * np.pi * f * t + rng.random() * 6) for f in (1760, 2217, 2637, 3520)) * np.exp(-t * 1.6) * 0.05
tail = bp(rng.standard_normal(len(t)), 300, 1500) * np.exp(-t * 2.5) * 0.25
save("impact", np.tanh(1.6 * (sub * 1.2 + knock * 0.9 + crack + shimmer + tail)), 0.5)

# Riser : bruit filtré qui monte + glissando, coupure nette
t = t_(1.6)
k = t / t[-1]
noise = rng.standard_normal(len(t))
sweep = np.zeros_like(t)
for i, (a, b) in enumerate(zip(np.linspace(300, 6000, 32)[:-1], np.linspace(300, 6000, 32)[1:])):
    seg = slice(int(i * len(t) / 31), int((i + 1) * len(t) / 31))
    sweep[seg] = bp(noise, a, b * 1.6)[seg]
tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (k * 2.5)) / SR) * 0.35
x = (sweep * 0.8 + tone) * k**2.2
x[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
save("riser", x, 0.6)

# Pop vitré
t = t_(0.35)
f = 900 * np.exp(-t * 18) + 500
x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26) + hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 90) * 0.25
save("pop", x)

# Clapets de split-flap : train de petits clics qui ralentit
t = t_(1.0)
x = np.zeros_like(t)
pos = 0.0
gap = 0.035
while pos < 0.9:
    i = int(pos * SR)
    n = int(0.012 * SR)
    click = hp(rng.standard_normal(n), 1800) * np.exp(-np.arange(n) / SR * 400)
    x[i:i + n] += click * (0.6 + 0.4 * rng.random())
    pos += gap * (0.8 + 0.4 * rng.random())
    gap *= 1.04
save("flap", bp(x, 900, 9000), 0.3)

# Étincelles : crépitement + paillettes aiguës
t = t_(0.8)
crackle = np.zeros_like(t)
for _ in range(90):
    i = int(rng.random() ** 1.6 * (len(t) - 400))
    crackle[i:i + 200] += rng.standard_normal(200) * np.exp(-np.arange(200) / 30) * rng.random()
glitter = sum(np.sin(2 * np.pi * (4000 + 3000 * rng.random()) * t) * (rng.random(len(t)) < 0.002) for _ in range(6))
x = hp(crackle, 1500) * np.exp(-t * 4) + lp(glitter.astype(float), 9000) * np.exp(-t * 3) * 0.6
save("sparkle", x, 0.7)
