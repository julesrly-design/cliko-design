"""Bande son du short GTA 6 → public/gta6/mix.wav (voix + musique synthwave synthétisée + bruitages).

Musique : 120 BPM, la mineur (Am · F · C · G), intro filtrée jusqu'à « GTA 6 », drop, coupure sur « dans la vraie vie »,
reprise sur « des milliers », trou d'un temps avant « GTA flu », accord final. Pompage (sidechain) sur la grosse caisse,
et la musique s'efface sous la voix (ducking calculé sur l'enveloppe de la voix).
Usage : npx tsx scripts/gta6-cues.ts && python3 scripts/gta6_audio.py
"""
import json, subprocess
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, resample_poly

SR = 48000
ROOT = Path("public/gta6")
cue = json.loads((ROOT / "cues.json").read_text())
DUR = cue["duration"]
M = cue["marks"]
N = int(DUR * SR) + SR
rng = np.random.default_rng(7)
BT = 0.5
t_ = lambda d: np.arange(int(d * SR)) / SR

def dec(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(float)

def filt(x, kind, f, order=2):
    return sosfilt(butter(order, np.asarray(f, float) / (SR / 2), btype=kind, output="sos"), x)

def place(bus, x, t, g=1.0):
    i = int(t * SR)
    if i >= bus.shape[-1] or i + x.shape[-1] <= 0: return
    if i < 0: x, i = x[..., -i:], 0
    n = min(x.shape[-1], bus.shape[-1] - i)
    bus[..., i:i + n] += g * x[..., :n]

midi = lambda m: 440 * 2 ** ((m - 69) / 12)
def saw(f, d, det=0.0):
    t = t_(d); out = 0
    for k in (-det, 0, det):
        ph = (t * f * (1 + k) + rng.random()) % 1
        out = out + (2 * ph - 1)
    return out / 3

# --- sections ------------------------------------------------------------------------------
GTA, CONG, MIL, FLU = M["gta"], M["conges"], M["conges"] + 2.6, M["fluGta"]
OUT = M["outro"]
def drums_on(t):
    return (GTA <= t < CONG) or (MIL <= t < FLU - BT) or (FLU <= t < OUT + 1.6)

CH = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [48, 52, 55]), (55, [55, 59, 62])]  # Am F C G
music = np.zeros((2, N))
kick_env = np.zeros(N)

# pad (toujours, ouvert après le drop)
for b in range(int(DUR / 2) + 1):
    t0 = b * 2.0
    root, notes = CH[b % 4]
    x = sum(saw(midi(n), 2.05, 0.006) for n in notes) / 3
    x *= np.minimum(1, t_(2.05) / 0.05) * np.minimum(1, (2.05 - t_(2.05)) / 0.1)
    cut = 900 if t0 < GTA else 2600
    x = filt(x, "low", cut)
    place(music, np.vstack([x, np.roll(x, 300)]), t0, 0.16)
    # basse : croches, octave
    for k in range(4 if t0 >= GTA else 0):
        bt = t0 + k * BT
        if not drums_on(bt): continue
        for h in (0, 0.25):
            d = 0.22
            f = midi(root - 24 + (12 if h else 0))
            y = np.sin(2 * np.pi * f * t_(d)) + 0.3 * np.sign(np.sin(2 * np.pi * f * t_(d)))
            y *= np.exp(-t_(d) * 6)
            y = filt(y, "low", 700)
            place(music, np.vstack([y, y]), bt + h, 0.32)
    # arpège pincé (doubles croches)
    for k in range(16):
        at = t0 + k * BT / 4
        if at > OUT + 1.6: break
        n = notes[[0, 1, 2, 1][k % 4]] + 12 + (12 if k % 8 >= 4 else 0)
        d = 0.18
        y = saw(midi(n), d) * np.exp(-t_(d) * 18)
        y = filt(y, "low", 3800 if at >= GTA else 1500)
        pan = 0.5 + 0.35 * np.sin(k)
        place(music, np.vstack([y * (1 - pan), y * pan]) * 2, at, 0.07)

# batterie
nb = int(DUR / BT) + 1
for i in range(nb):
    t0 = i * BT
    if not drums_on(t0): continue
    d = 0.4; tt = t_(d)
    f = 50 + 110 * np.exp(-tt * 30)
    k = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7)
    place(music, np.vstack([k, k]), t0, 0.75)
    kick_env[int(t0 * SR):int((t0 + 0.25) * SR)] = 1
    if i % 2 == 1:  # clap
        c = filt(rng.standard_normal(int(0.25 * SR)), "band", [900, 5000]) * np.exp(-t_(0.25) * 14)
        place(music, np.vstack([c, c]), t0, 0.35)
    for h in range(4):  # charleys
        hh = filt(rng.standard_normal(int(0.05 * SR)), "high", 7000) * np.exp(-t_(0.05) * 70)
        place(music, np.vstack([hh * 0.8, hh]), t0 + h * BT / 4, 0.12 if h % 2 else 0.07)

# accord final
root, notes = CH[0]
x = sum(saw(midi(n), 3.0, 0.008) for n in notes + [69, 72]) / 5 * np.exp(-t_(3.0) * 1.2)
x = filt(x, "low", 3000)
place(music, np.vstack([x, x]), OUT + 1.6, 0.3)

# pompage
from scipy.ndimage import uniform_filter1d
pump = 1 - 0.55 * uniform_filter1d(kick_env, int(0.04 * SR))
music *= pump

# --- voix et ducking -----------------------------------------------------------------------
voice = dec(ROOT / "voix.mp3")
v = np.zeros((2, N)); place(v, voice, 0.0)
env = uniform_filter1d(np.abs(v[0]), int(0.08 * SR))
env = uniform_filter1d((env > 0.02).astype(float), int(0.25 * SR))
duck = 1 - 0.55 * env
music *= duck

# --- bruitages -----------------------------------------------------------------------------
cache = {}
def load(name):
    if name not in cache:
        x = dec(Path("public/motion/sfx") / f"{name}.mp3")
        e = np.abs(x).max(0); on = int(np.argmax(e > e.max() * 0.05))
        x = x[:, max(0, on - int(0.003 * SR)):]
        cache[name] = x / max(1e-9, np.abs(x).max())
    return cache[name]
sfx = np.zeros((2, N))
for c in cue["cues"]:
    x = load(c["s"]); st = c.get("st") or 0
    if abs(st) > 0.05:
        r = 2 ** (st / 12); x = np.vstack([resample_poly(x[0], 1000, int(1000 * r)), resample_poly(x[1], 1000, int(1000 * r))])
    place(sfx, x, c["t"], c.get("g", 1))

mix = 0.95 * v + 0.55 * music / max(1e-9, np.abs(music).max()) + 0.32 * sfx
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix = mix[:, :int(DUR * SR)]
mix *= 0.89 / np.abs(mix).max()
wavfile.write(ROOT / "mix.wav", SR, (mix.T * 32767).astype(np.int16))
print("→", ROOT / "mix.wav", f"{mix.shape[1] / SR:.2f} s")
