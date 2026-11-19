"""Bande son des Shorts Mile Zero → public/mz/mix.wav : voix + nappe sombre et pulsation discrète (95 BPM) + whooshs aux coupes.
Style de la chaîne : musique en retrait, la voix porte tout. Usage : python3 scripts/mz_audio.py"""
import json, subprocess
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
from scipy.ndimage import uniform_filter1d
SR = 48000; R = Path("public/mz"); A = json.loads((R / "alignment.json").read_text())
DUR = A["scenes"][-1]["end"] + 1.2; N = int(DUR * SR) + SR; rng = np.random.default_rng(3)
t_ = lambda d: np.arange(int(d * SR)) / SR
filt = lambda x, k, f: sosfilt(butter(2, np.asarray(f, float) / (SR / 2), btype=k, output="sos"), x)
def dec(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(float)
def place(b, x, t, g=1.0):
    i = int(t * SR); n = min(x.shape[-1], b.shape[-1] - i)
    if n > 0: b[..., i:i + n] += g * x[..., :n]
midi = lambda m: 440 * 2 ** ((m - 69) / 12)
BT = 60 / 95; music = np.zeros((2, N)); kick = np.zeros(N)
CH = [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 60]]  # Dm Bb C Am
for b in range(int(DUR / (4 * BT)) + 1):
    t0 = b * 4 * BT; d = 4 * BT + 0.2
    x = sum(np.sin(2 * np.pi * midi(n) * t_(d)) + 0.3 * np.sin(4 * np.pi * midi(n) * t_(d)) for n in CH[b % 4]) / 4
    x *= np.minimum(1, t_(d) / 0.3) * np.minimum(1, (d - t_(d)) / 0.3)
    place(music, np.vstack([x, np.roll(x, 400)]), t0, 0.22)
    sub = np.sin(2 * np.pi * midi(CH[b % 4][0] - 12) * t_(d)) * np.minimum(1, t_(d) / 0.05) * np.minimum(1, (d - t_(d)) / 0.2)
    place(music, np.vstack([sub, sub]), t0, 0.25)
for i in range(int(DUR / BT)):
    t0 = i * BT
    if t0 < 2.0 or t0 > DUR - 1.0: continue
    tt = t_(0.35); k = np.sin(2 * np.pi * np.cumsum(45 + 70 * np.exp(-tt * 28)) / SR) * np.exp(-tt * 8)
    place(music, np.vstack([k, k]), t0, 0.55); kick[int(t0 * SR):int((t0 + .2) * SR)] = 1
    if i % 2:
        h = filt(rng.standard_normal(int(.04 * SR)), "high", 6000) * np.exp(-t_(.04) * 80); place(music, np.vstack([h, h]), t0 + BT / 2, 0.08)
music *= 1 - 0.4 * uniform_filter1d(kick, int(.05 * SR))
v = np.zeros((2, N)); place(v, dec(R / "voix.mp3"), 0)
env = uniform_filter1d((uniform_filter1d(np.abs(v[0]), int(.08 * SR)) > .02).astype(float), int(.25 * SR))
music *= 1 - 0.5 * env
sfx = np.zeros((2, N)); S = Path("public/motion/sfx")
def s(n):
    x = dec(S / f"{n}.mp3"); e = np.abs(x).max(0); x = x[:, int(np.argmax(e > e.max() * .05)):]; return x / np.abs(x).max()
for i, sc in enumerate(A["scenes"][1:]):
    place(sfx, s("whoosh" if i % 2 else "swoosh"), sc["start"] - 0.2, 0.45); place(sfx, s("thud"), sc["start"] - 0.07, 0.35)
place(sfx, s("hit"), 0.0, 0.6)
for w in A["words"]:
    if w["text"].rstrip(".,?") in ("50", "32", "80", "200"):
        for k in range(6): place(sfx, s("tick1"), w["start"] + k * 0.07, 0.25)
        place(sfx, s("ding"), w["start"] + 0.47, 0.3)
    if w["text"].startswith("Follow"): place(sfx, s("pillPop"), w["start"], 0.6)
mix = 0.95 * v + 0.45 * music / np.abs(music).max() + 0.3 * sfx
mix = np.tanh(mix * 1.1) / np.tanh(1.1); mix = mix[:, :int(DUR * SR)]; mix *= 0.89 / np.abs(mix).max()
wavfile.write(R / "mix.wav", SR, (mix.T * 32767).astype(np.int16)); print("→ public/mz/mix.wav", round(DUR, 2), "s")
