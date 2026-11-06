"""Mixe la feuille de bruitages (public/motion/cues.json) en une seule piste → public/motion/sfx-mix.wav

- chaque son ElevenLabs (public/motion/sfx/*.mp3) est décodé une fois, son silence de tête est coupé
  pour que l'attaque tombe pile sur la frame ;
- variations de hauteur par rééchantillonnage (champ « st », en demi-tons) pour éviter l'effet mitraillette ;
- panoramique léger et déterministe, compression douce du bus, crête à -1 dBFS.
Usage : python3 scripts/mix_sfx.py
"""
import json
import subprocess
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

SR = 48000
ROOT = Path("public/motion")
data = json.loads((ROOT / "cues.json").read_text())
fps, frames = data["fps"], data["frames"]
N = int(frames / fps * SR) + SR  # 1 s de marge pour les queues
mix = np.zeros((2, N))
cache = {}


def load(name):
    if name not in cache:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(ROOT / "sfx" / f"{name}.mp3"), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                             check=True, capture_output=True).stdout
        x = np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(float)
        env = np.abs(x).max(0)
        thr = env.max() * (0.06 if x.shape[1] < SR else 0.01)
        onset = int(np.argmax(env > thr))
        x = x[:, max(0, onset - int(0.003 * SR)):]
        x /= max(1e-9, np.abs(x).max())
        cache[name] = x
    return cache[name]


rng = np.random.default_rng(5)
for i, cue in enumerate(data["cues"]):
    x = load(cue["s"])
    st = cue.get("st", 0) or 0
    if abs(st) > 0.05:
        ratio = 2 ** (st / 12)  # >1 : plus aigu (plus court)
        up, down = 1000, int(round(1000 * ratio))
        x = np.vstack([resample_poly(x[0], up, down), resample_poly(x[1], up, down)])
    if cue.get("dur"):
        want = int(cue["dur"] / fps * SR)
        if want > x.shape[1]:  # ambiance : bouclée avec un fondu enchaîné de 0,5 s
            xf = int(0.5 * SR)
            loop = x.copy()
            while loop.shape[1] < want:
                ramp_ = np.linspace(0, 1, xf)
                head = x[:, :xf] * ramp_ + loop[:, -xf:] * (1 - ramp_)
                loop = np.concatenate([loop[:, :-xf], head, x[:, xf:]], axis=1)
            x = loop
        x = x[:, :want]
    n = x.shape[1]
    env = np.ones(n)
    fi, fo = cue.get("fadeIn"), cue.get("fadeOut")
    if fi:
        k = min(n, int(fi / fps * SR)); env[:k] = np.linspace(0, 1, k)
    if fo:
        k = min(n, int(fo / fps * SR)); env[n - k:] *= np.linspace(1, 0, k)
    pan = 0.0 if cue["s"] in ("fire", "sub", "impact", "riser", "ignite") else float(np.sin(i * 2.3)) * 0.35
    g = 10 ** (cue["db"] / 20) * 0.5
    start = int(cue["f"] / fps * SR) - (n if cue.get("end") else 0)
    if start < 0:
        x, env, n = x[:, -start:], env[-start:], n + start
        start = 0
    end = min(N, start + n)
    if end <= start:
        continue
    seg = x[:, : end - start] * env[: end - start] * g
    mix[0, start:end] += seg[0] * np.sqrt(1 - pan)
    mix[1, start:end] += seg[1] * np.sqrt(1 + pan)

# compression douce (tanh) puis crête à -1 dBFS
mix = np.tanh(mix * 1.6) / 1.6
mix = mix[:, : int(frames / fps * SR)]
mix *= 0.89 / np.abs(mix).max()
wavfile.write(ROOT / "sfx-mix.wav", SR, (mix.T * 32767).astype(np.int16))
print("→", ROOT / "sfx-mix.wav", len(data["cues"]), "sons,", len(cache), "fichiers")
