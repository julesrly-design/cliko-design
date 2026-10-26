"""Musique originale (libre de droits) pour le reel Cliko, synthétisée en numpy/scipy.

120 BPM, fa mineur (Fm7 → Dbmaj7 → Abmaj7 → Eb add9), électro sombre et élégante,
calée sur la timeline de la vidéo (secondes) :
  0,0 – 2,5   intro : nappe filtrée + arpège qui s'ouvre, montée vers la plongée
  2,5         DROP quand la ligne plonge (kick, basse, clap, charleys)
  7,0 / 13,0  relances sur les whip-pans ; mélodie « cloche » à partir de 13 s
  17 – 21     respiration (demi-temps) sur le téléphone, puis roulement
  21 – 23,5   coups d'accords sur FR · NL · EN (21,5 / 22 / 22,5)
  23,5 – 26   reprise, roulement + riser
  26 – 27     suspension (tout s'arrête sauf le riser)
  27,0        GROS IMPACT sur la convergence du logo, refrain final
  29,5 – 30   le groove s'efface vers la nappe d'intro : la boucle se referme

Sortie : public/music.wav et public/music.mp3 (stéréo 48 kHz).
Usage : python3 scripts/synth_music.py
"""
import subprocess
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 30.0
BEAT = 0.5
N = int(DUR * SR)
rng = np.random.default_rng(2026)
OUT = Path(__file__).resolve().parent.parent / "public"

L = np.zeros(N)
R = np.zeros(N)


def t_(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, min(f, SR / 2 - 100), "low", fs=SR, output="sos"), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)


def place(x, t0, gain=1.0, pan=0.0):
    """Ajoute un son mono (ou (n,2)) à t0 secondes, avec panoramique."""
    i = int(round(t0 * SR))
    if i >= N:
        return
    if x.ndim == 1:
        x = np.stack([x * (1 - max(0, pan)), x * (1 + min(0, pan))], axis=1)
    n = min(len(x), N - i)
    if i < 0:
        x = x[-i:]
        n = min(len(x), N)
        i = 0
    L[i:i + n] += x[:n, 0] * gain
    R[i:i + n] += x[:n, 1] * gain


def saw(f, t, phase=0.0):
    return 2 * ((f * t + phase) % 1.0) - 1


def env(n, a, d, s, r_start=None, r=0.05):
    e = np.ones(n) * s
    na, nd = int(a * SR), int(d * SR)
    e[:na] = np.linspace(0, 1, max(na, 1))[:n]
    if na < n:
        e[na:na + nd] = np.linspace(1, s, max(nd, 1))[: max(0, min(nd, n - na))]
    if r_start is not None:
        rs = int(r_start * SR)
        if rs < n:
            e[rs:] *= np.linspace(1, 0, n - rs) ** 2
    return e


# ── Harmonie ────────────────────────────────────────────────────────────────
HZ = {
    "F1": 43.65, "Ab1": 51.91, "Db2": 69.30, "Eb2": 77.78, "F2": 87.31,
    "Db3": 138.59, "Eb3": 155.56, "F3": 174.61, "G3": 196.00, "Ab3": 207.65, "Bb3": 233.08,
    "C4": 261.63, "Db4": 277.18, "Eb4": 311.13, "F4": 349.23, "G4": 392.00, "Ab4": 415.30, "Bb4": 466.16,
    "C5": 523.25, "Eb5": 622.25, "F5": 698.46,
}
CHORDS = [  # (basse, voix de nappe)
    ("F1", ["F3", "Ab3", "C4", "Eb4"]),
    ("Db2", ["Db3", "F3", "Ab3", "C4"]),
    ("Ab1", ["Ab3", "C4", "Eb4", "G4"]),
    ("Eb2", ["Eb3", "G3", "Bb3", "F4"]),
]


def chord_at(t):
    return CHORDS[int(t // 2) % 4]


# ── Courbes d'intensité par section (secondes) ─────────────────────────────
def drums_on(t):
    return (2.5 <= t < 26.0 and not (17.0 <= t < 19.0)) or (27.0 <= t < 29.5)


# ── Instruments ─────────────────────────────────────────────────────────────
def kick():
    t = t_(0.42)
    f = 46 + 110 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 300) * 0.25
    return np.tanh(1.8 * (body + click))


def clap():
    t = t_(0.35)
    x = np.zeros(len(t))
    for k, dt in enumerate((0, 0.009, 0.018, 0.028)):
        i = int(dt * SR)
        x[i:] += bp(rng.standard_normal(len(t) - i), 900, 3200) * np.exp(-t[: len(t) - i] * (60 if k < 3 else 14))
    return x * 0.6


def hat(open_=False):
    t = t_(0.22 if open_ else 0.05)
    return hp(rng.standard_normal(len(t)), 7500, 4) * np.exp(-t * (16 if open_ else 90))


def pluck(f, d=0.24, bright=3200):
    t = t_(d)
    x = saw(f, t) * 0.6 + saw(f * 1.004, t, 0.3) * 0.4
    cutoff_env = 300 + bright * np.exp(-t * 18)
    # filtre approché : moyenne de deux passe-bas (brillant au début, sombre ensuite)
    y = lp(x, bright) * np.exp(-t * 16) + lp(x, 600) * np.exp(-t * 6) * 0.4
    return y * (cutoff_env > 0) * env(len(t), 0.002, 0.05, 1.0, d - 0.04, 0.04)


def bell(f, d=1.1):
    t = t_(d)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * 2.2 * np.exp(-t * 4)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 3.2)
    return x + 0.25 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 5)


def pad_chord(notes, d, cutoff):
    t = t_(d)
    x = np.zeros((len(t), 2))
    for n in notes:
        for k, det in enumerate((-0.11, -0.04, 0.03, 0.1)):
            f = HZ[n] * 2 ** (det / 12)
            v = saw(f, t, rng.random())
            pan = -0.6 + 1.2 * (k / 3)
            x[:, 0] += v * (1 - max(0, pan))
            x[:, 1] += v * (1 + min(0, pan))
    x[:, 0] = lp(x[:, 0], cutoff, 2)
    x[:, 1] = lp(x[:, 1], cutoff, 2)
    e = env(len(t), 0.35, 0.3, 0.85, d - 0.35, 0.35)
    return x * e[:, None] * 0.05


def sub(f, d):
    t = t_(d)
    x = np.sin(2 * np.pi * f * t) + 0.35 * lp(saw(f, t), 220)
    return x * env(len(t), 0.005, 0.08, 0.85, d - 0.05, 0.05)


def riser(d, f0=400, f1=7000):
    t = t_(d)
    k = t / d
    nz = rng.standard_normal(len(t))
    y = np.zeros_like(t)
    steps = 40
    for s in range(steps):
        sl = slice(int(s * len(t) / steps), int((s + 1) * len(t) / steps))
        fc = f0 * (f1 / f0) ** (s / steps)
        y[sl] = bp(nz, fc * 0.7, min(fc * 1.6, 20000))[sl]
    return y * k ** 2.4 * 0.6


def boom(d=2.6):
    t = t_(d)
    f = 34 + 60 * np.exp(-t * 6)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    x += lp(rng.standard_normal(len(t)), 500) * np.exp(-t * 5) * 0.5
    x += hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 3) * 0.12
    return np.tanh(1.4 * x)


# ── Composition ─────────────────────────────────────────────────────────────
kicks = []

# Nappe : un accord par mesure, filtre qui s'ouvre au fil de la vidéo
for bar in range(15):
    t0 = bar * 2.0
    _, notes = chord_at(t0)
    if t0 < 2.5:
        cutoff = 500 + 700 * (t0 / 2.5)
    elif 17 <= t0 < 21:
        cutoff = 2600
    elif 26 <= t0 < 27:
        cutoff = 900
    else:
        cutoff = 1500 + 30 * t0
    place(pad_chord(notes, 2.3, cutoff), t0, 1.8 if t0 < 2.5 else 1.0)

# Arpège en doubles croches (ping-pong), plus discret dans l'intro
ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2, 3, 1, 2]
for i in range(int(DUR / (BEAT / 4))):
    t0 = i * BEAT / 4
    if 26.0 <= t0 < 27.0 or t0 >= 29.75:
        continue
    _, notes = chord_at(t0)
    n = notes[ARP[i % 16]]
    f = HZ[n] * 2
    bright = 900 + 2600 * min(1, t0 / 2.5) if t0 < 2.5 else 3400
    g = 0.2 if t0 < 2.5 else 0.085
    place(pluck(f, 0.2, bright), t0, g, pan=0.45 if i % 2 else -0.45)
    # écho en croche pointée, côté opposé
    place(pluck(f, 0.2, bright * 0.6), t0 + 0.375, g * 0.35, pan=-0.6 if i % 2 else 0.6)

# Batterie
for i in range(int(DUR / BEAT)):
    t0 = i * BEAT
    if not drums_on(t0):
        continue
    half_time = 17.0 <= t0 < 21.0
    if not half_time or i % 2 == 0:
        place(kick(), t0, 0.95)
        kicks.append(t0)
    if i % 2 == 1 and not half_time:
        place(clap(), t0, 0.55, pan=0.05)
    # charleys : fermés en doubles croches, ouverts en contretemps
    for k in range(4):
        tt = t0 + k * BEAT / 4
        if k == 2:
            place(hat(True), tt, 0.16, pan=0.25)
        else:
            place(hat(False), tt, 0.09 if k % 2 else 0.05, pan=-0.2)

# Demi-temps du téléphone : clap sur le 3
for t0 in np.arange(19.0, 21.0, 2.0):
    place(clap(), t0 + 1.0, 0.6)

# Basse (sidechainée plus bas) : fondamentale en croches syncopées
for i in range(int(DUR / (BEAT / 2))):
    t0 = i * BEAT / 2
    if not (2.5 <= t0 < 26.0 or 27.0 <= t0 < 29.5):
        continue
    if i % 4 == 0:  # on laisse le kick seul sur le temps
        continue
    root, _ = chord_at(t0)
    place(sub(HZ[root] * (2 if i % 8 == 6 else 1), 0.22), t0, 0.5)

# Relances : roulements de clap avant les whip-pans et avant l'impact final
for start, end in ((6.5, 7.0), (12.5, 13.0), (20.0, 21.0), (25.0, 26.0)):
    n = int((end - start) / (BEAT / 4))
    for k in range(n):
        tt = start + k * BEAT / 4
        place(clap(), tt, 0.12 + 0.35 * (k / n))

# Coups d'accords sur FR · NL · EN (et l'accent de l'impact du « ? »)
for t0 in (21.5, 22.0, 22.5):
    _, notes = chord_at(t0)
    stab = sum(pluck(HZ[n], 0.5, 5000) for n in notes)
    place(stab, t0, 0.35)
    place(kick(), t0, 0.9)
place(boom(1.2), 1.5, 0.3)
# pulsation sourde dès la 1re seconde : l'intro accroche sans attendre le drop
for t0 in (0.0, 0.5, 1.0, 2.0):
    place(lp(kick(), 180), t0, 0.35)

# Mélodie « cloche » (accroche) à partir de 13 s et sur le refrain final
MOTIF = [(0.0, "C5"), (0.75, "Ab4"), (1.5, "F4"), (2.0, "Eb5"), (2.75, "C5"), (3.5, "Bb4")]
for base in (13.0, 17.0, 27.0):
    for dt, n in MOTIF:
        if base + dt < 29.6:
            place(bell(HZ[n]), base + dt, 0.13, pan=0.15)
            place(bell(HZ[n]) * 0.6, base + dt + 0.375, 0.05, pan=-0.4)

# Risers et impacts calés sur les transitions
place(riser(1.0), 1.5, 0.5)  # vers le drop (2,5 s)
place(riser(1.6), 25.4, 0.8)  # vers l'impact (27 s)
place(boom(), 27.0, 0.9)
place(boom(1.4), 2.5, 0.45)

# ── Mixage ──────────────────────────────────────────────────────────────────
# Sidechain : tout sauf le kick « respire » après chaque kick
t_all = np.arange(N) / SR
duck = np.ones(N)
for k in kicks:
    i = int(k * SR)
    n = min(int(0.3 * SR), N - i)
    duck[i:i + n] = np.minimum(duck[i:i + n], 1 - 0.45 * np.exp(-np.arange(n) / SR / 0.09))
Ld, Rd = L * duck, R * duck
# le kick est déjà dans L/R : la légère réduction qu'il subit lui-même reste naturelle

# Fin : le groove s'efface vers l'état de l'intro (boucle)
fade = np.ones(N)
i0 = int(29.5 * SR)
fade[i0:] = np.linspace(1, 0.35, N - i0)
Ld *= fade
Rd *= fade
# Début : très courte montée pour éviter un clic à la boucle
i1 = int(0.02 * SR)
Ld[:i1] *= np.linspace(0, 1, i1)
Rd[:i1] *= np.linspace(0, 1, i1)

# Bus master : EQ légère, saturation douce, normalisation (-1 dBFS)
Ld = hp(Ld, 28)
Rd = hp(Rd, 28)
peak = max(np.max(np.abs(Ld)), np.max(np.abs(Rd)))
Ld, Rd = np.tanh(1.3 * Ld / peak) / np.tanh(1.3), np.tanh(1.3 * Rd / peak) / np.tanh(1.3)
st = np.stack([Ld, Rd], axis=1)
st *= 0.89 / np.max(np.abs(st))

OUT.mkdir(parents=True, exist_ok=True)
wav = OUT / "music.wav"
wavfile.write(wav, SR, (st * 32767).astype(np.int16))
subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(wav), "-c:a", "libmp3lame", "-b:a", "256k", str(OUT / "music.mp3")], check=True)
print("→", wav, "et", OUT / "music.mp3")
