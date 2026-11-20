"""Bande son « GTA 6 is TOO realistic » → public/mz2/mix.wav.
Trap 140 BPM (demi-temps) qui démarre dès la 1re frame, whoosh sur chaque zoom, cercles et tampons sonorisés,
coupure de 2 temps avant « That's where Rockstar draws the line » (temps comique), fin sèche pour la boucle."""
import json, re, subprocess
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
from scipy.ndimage import uniform_filter1d
SR = 48000; R = Path("public/mz2"); A = json.loads((R / "alignment.json").read_text()); FPS = 30
W = A["words"]; DUR = A["scenes"][-1]["end"] + 0.35; N = int(DUR * SR) + SR; rng = np.random.default_rng(9)
t_ = lambda d: np.arange(int(d * SR)) / SR
filt = lambda x, k, f: sosfilt(butter(2, np.asarray(f, float) / (SR / 2), btype=k, output="sos"), x)
def dec(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(float)
def place(b, x, t, g=1.0):
    i = int(t * SR)
    if i < 0: x, i = x[..., -i:], 0
    n = min(x.shape[-1], b.shape[-1] - i)
    if n > 0: b[..., i:i + n] += g * x[..., :n]
def word(scene, rx, nth=0):
    ws = [w for w in W if w["scene"] == scene and re.search(rx, w["text"])]; return ws[min(nth, len(ws) - 1)]["start"]
start = {s["scene"]: s["start"] for s in A["scenes"]}
T = dict(usd=word("hook", "^300"), priv=word("hook", "^private"), andw=word("hook", "^and"), no=word("hook", "^NO"), look=start["age"], nobody=word("age", "^nobody"), u21=word("age", "^21"),
         car=start["car"], obey=word("car", "^Obey"), badge=word("car", "^badge"), audi=word("car", "^Audi"), ammu=start["ammu"],
         cust=word("ammu", "^Customer"), rifle=word("ammu", "^rifle"), line=word("ammu", "^That's"), out=start["outro"],
         comment=word("outro", "^Comment"), refunds=word("outro", "^no$"))
BT = 60 / 140; music = np.zeros((2, N)); kick = np.zeros(N)
midi = lambda m: 440 * 2 ** ((m - 69) / 12)
ROOTS = [37, 37, 40, 35]  # C# C# E B (sombre)
gap = (T["line"] - 2 * BT, T["line"])
def on(t): return not (gap[0] <= t < gap[1])
for i in range(int(DUR / BT) + 1):
    t0 = i * BT
    if not on(t0): continue
    bar = int(t0 / (4 * BT)) % 4
    if i % 8 in (0, 3) or i % 8 == 6:  # 808 + kick
        d = 0.9 if i % 8 == 0 else 0.45; tt = t_(d)
        f0 = midi(ROOTS[bar]); fr = f0 * (1 + 0.6 * np.exp(-tt * 40))
        b8 = np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(fr) / SR)) * np.exp(-tt * (2.5 if d > .5 else 6))
        place(music, np.vstack([b8, b8]), t0, 0.5)
        k = np.sin(2 * np.pi * np.cumsum(50 + 130 * np.exp(-t_(.2) * 35)) / SR) * np.exp(-t_(.2) * 18)
        place(music, np.vstack([k, k]), t0, 0.7); kick[int(t0 * SR):int((t0 + .15) * SR)] = 1
    if i % 4 == 2:  # caisse claire / clap (demi-temps)
        c = filt(rng.standard_normal(int(.22 * SR)), "band", [700, 6000]) * np.exp(-t_(.22) * 16)
        place(music, np.vstack([c, c]), t0, 0.42)
    rolls = 4 if i % 16 in (13, 14, 15) else 2
    for h in range(rolls):
        th = t0 + h * BT / rolls
        if not on(th): continue
        hh = filt(rng.standard_normal(int(.035 * SR)), "high", 7500) * np.exp(-t_(.035) * 90)
        place(music, np.vstack([hh, hh * .9]), th, 0.13)
# nappe sombre continue (pluck + pad)
for b in range(int(DUR / (4 * BT)) + 1):
    t0 = b * 4 * BT; d = 4 * BT
    if not on(t0 + 0.01): continue
    r = ROOTS[b % 4] + 24
    x = sum(np.sin(2 * np.pi * midi(n) * t_(d)) for n in (r, r + 3, r + 7)) / 3 * np.minimum(1, t_(d) / .2) * np.exp(-t_(d) * .4)
    x = x * np.clip((gap[0] - t0 - t_(d)) * 20, 0, 1) if t0 < gap[0] < t0 + d else x
    place(music, np.vstack([x, np.roll(x, 300)]), t0, 0.16)
music *= 1 - 0.35 * uniform_filter1d(kick, int(.05 * SR))
v = np.zeros((2, N)); place(v, dec(R / "voix.mp3"), 0)
env = uniform_filter1d((uniform_filter1d(np.abs(v[0]), int(.08 * SR)) > .02).astype(float), int(.2 * SR))
music *= 1 - 0.45 * env
sfx = np.zeros((2, N)); SD = Path("public/motion/sfx"); cache = {}
def s(n):
    if n not in cache:
        x = dec(SD / f"{n}.mp3"); e = np.abs(x).max(0); x = x[:, int(np.argmax(e > e.max() * .05)):]; cache[n] = x / np.abs(x).max()
    return cache[n]
place(sfx, s("impact"), 0, 0.8); place(sfx, s("sub"), 0, 0.6)
for k in range(10): place(sfx, s("tick1" if k % 2 else "tick2"), T["usd"] + k * 0.05, .3)
place(sfx, s("ding"), T["usd"] + .55, .45)
for k, g in (("priv", .5), ("andw", .5), ("no", .6), ("nobody", .6), ("obey", .5), ("badge", .6), ("cust", .6), ("line", .5)):
    place(sfx, s("whoosh"), T[k] - 7 / FPS, g)
for k in ("no", "nobody", "badge", "cust"): place(sfx, s("marker"), T[k] + 3 / FPS, .5)
for k in ("u21", "audi"): place(sfx, s("thud"), T[k], .9); place(sfx, s("hit"), T[k], .45)
place(sfx, s("glitch"), T["rifle"], .35)
place(sfx, s("impact"), T["line"], .9); place(sfx, s("sub"), T["line"], .8)
for k in ("look", "car", "ammu", "out"): place(sfx, s("swoosh"), T[k] - .15, .45)
place(sfx, s("pillPop"), T["comment"], .6)
place(sfx, s("whoosh"), T["refunds"], .5); place(sfx, s("hit"), T["refunds"] + 7 / FPS, .6)
mix = 0.95 * v + 0.5 * music / np.abs(music).max() + 0.32 * sfx
mix = np.tanh(mix * 1.15) / np.tanh(1.15); mix = mix[:, :int(DUR * SR)]; mix *= 0.89 / np.abs(mix).max()
wavfile.write(R / "mix.wav", SR, (mix.T * 32767).astype(np.int16)); print("→ public/mz2/mix.wav", round(DUR, 2), "s")
