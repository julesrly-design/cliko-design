"""Musique du film motion design Cliko (synthétisée, numpy/scipy) → public/motion/music.wav

120 BPM (1 temps = 15 frames à 30 fps), la mineur, grille Am · F · C · G, calée sur src/motion/timeline.ts :
  0–8 s    intro : nappe qui s'ouvre, arpège pincé, charleys puis grosse caisse filtrée, roulement, silence
  8 s      DROP (le code file) : 4/4, claps, basse roulante, accroche pincée
  14 s     coupe vers le clair : impact, un temps de vide, groove plus lumineux
  20 s     aplat ambre : accord « stab », roulement
  21,5 s   plan final : impact, accord de do majeur qui s'éteint
Usage : python3 scripts/synth_motion.py
"""
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
BPM = 120.0
BT = 60.0 / BPM  # 0,5 s
BAR = 4 * BT
DUR = 25.0
N = int(DUR * SR)
rng = np.random.default_rng(3)

DROP, LIGHT, BRAND, END = 8.0, 14.0, 20.0, 21.5


def bus():
    return np.zeros((2, N))


def t_(d):
    return np.arange(int(d * SR)) / SR


def filt(x, kind, f, order=2):
    wn = np.asarray(f, float) / (SR / 2)
    return sosfilt(butter(order, wn, btype=kind, output="sos"), x)


def add(b, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i + len(sig) <= 0:
        return
    s = sig[: max(0, N - i)]
    l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    b[0, i: i + len(s)] += s * gain * l * 1.414
    b[1, i: i + len(s)] += s * gain * r * 1.414


def hz(note):
    return 440.0 * 2 ** ((note - 69) / 12)


# ---------------- instruments ----------------
def kick(d=0.45):
    t = t_(d)
    f = 45 + 120 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.22)
    click = filt(rng.standard_normal(len(t)), "highpass", 2500) * np.exp(-t / 0.004) * 0.35
    return np.tanh((body + click) * 1.6)


def clap():
    t = t_(0.35)
    n = rng.standard_normal(len(t))
    env = np.zeros(len(t))
    for k, o in enumerate([0, 0.011, 0.022]):
        i = int(o * SR)
        env[i:] += np.exp(-(t[: len(t) - i]) / (0.01 if k < 2 else 0.12))
    return filt(n * env, "bandpass", [900, 3200]) * 0.9


def hat(open_=False):
    t = t_(0.25 if open_ else 0.06)
    return filt(rng.standard_normal(len(t)), "highpass", 7000) * np.exp(-t / (0.09 if open_ else 0.018))


def snare():
    t = t_(0.25)
    n = filt(rng.standard_normal(len(t)), "bandpass", [1200, 6000]) * np.exp(-t / 0.07)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05)
    return n * 0.8 + body * 0.5


def pluck(freq, d=0.45, bright=1.0, decay=0.22):
    t = t_(d)
    s = np.zeros(len(t))
    for k in range(1, 14):
        if freq * k > 16000:
            break
        s += np.sin(2 * np.pi * freq * k * t + k) / k * np.exp(-t * (1 / decay + k * 9 / bright))
    a = np.minimum(1, t / 0.003)
    return s * a * 0.6


def saw(freq, t):
    return 2 * ((freq * t) % 1.0) - 1


def supersaw(freqs, d, cutoff, att=0.4, rel=0.6):
    t = t_(d)
    s = np.zeros(len(t))
    for f in freqs:
        for det in (-0.12, -0.05, 0, 0.06, 0.13):
            s += saw(f * 2 ** (det / 12), t + rng.random())
    s = filt(s, "lowpass", cutoff, 2) / (len(freqs) * 5)
    env = np.minimum(1, t / att) * np.minimum(1, (d - t) / rel)
    return s * np.clip(env, 0, 1)


def sub(freq, d):
    t = t_(d)
    env = np.minimum(1, t / 0.005) * np.exp(-t / 0.35)
    return (np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(4 * np.pi * freq * t)) * env


def impact(d=2.2):
    t = t_(d)
    f = 28 + 40 * np.exp(-t / 0.25)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    noise = filt(rng.standard_normal(len(t)), "lowpass", 900) * np.exp(-t / 0.18) * 0.6
    return np.tanh((boom + noise) * 1.4)


def reverse_swell(d):
    t = t_(d)
    n = filt(rng.standard_normal(len(t)), "highpass", 3000)
    return n * (t / d) ** 3


def reverb(x, secs=1.6, mix=0.25, seed=0):
    r = np.random.default_rng(seed)
    t = t_(secs)
    out = np.zeros_like(x)
    for ch in range(2):
        ir = r.standard_normal(len(t)) * np.exp(-t / (secs / 5))
        ir = filt(ir, "lowpass", 6000)
        ir /= np.sqrt(np.sum(ir ** 2))
        out[ch] = fftconvolve(x[ch], ir)[: x.shape[1]]
    return x * (1 - mix) + out * mix * 1.4


# ---------------- harmonie ----------------
# Am, F, C, G (notes MIDI)
CHORDS = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]]
ROOTS = [33, 29, 36, 31]


def bar_of(t):
    return int(t // BAR) % 4


drums, bass, pad, keys, fx = bus(), bus(), bus(), bus(), bus()
kicks = []

# --- intro (0–8 s) ---
add(fx, reverse_swell(0.45), 0.02, 0.25)
add(fx, impact(2.0), 0.46, 0.55)  # allumage du point (frame 14)
for b in range(4):
    ch = CHORDS[b % 4]
    cutoff = 500 + 2500 * (b / 3) ** 1.5
    add(pad, supersaw([hz(n) for n in ch] + [hz(ch[0] - 12)], BAR + 0.3, cutoff, att=0.6 if b == 0 else 0.15), b * BAR, 0.55)
# arpège à partir des puces (2,4 s), qui s'ouvre
for i in range(int((DROP - 2.4) / (BT / 4))):
    t = 2.4 + i * BT / 4
    ch = CHORDS[bar_of(t)]
    seq = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[0] + 12, ch[1], ch[2] + 12]
    note = seq[i % 8] + 12
    prog = (t - 2.4) / (DROP - 2.4)
    add(keys, pluck(hz(note), 0.35, bright=0.4 + prog * 1.6), t, 0.18 + 0.2 * prog, pan=0.35 * np.sin(i * 1.7))
# charleys dès 4 s, grosse caisse filtrée dès 5,25 s (frame 158), roulement 6,5 → 7,85 s
for i in range(int((DROP - 4.0) / (BT / 2))):
    t = 4.0 + i * BT / 2
    if t < 7.85:
        add(drums, hat(i % 2 == 1), t, 0.12 if i % 2 else 0.08, pan=0.2)
for i in range(int((7.5 - 5.0) / BT) + 1):
    t = 5.0 + i * BT
    add(drums, filt(kick(), "lowpass", 300), t, 0.32)
roll_t = 6.0
step = BT / 4
while roll_t < 7.85:
    prog = (roll_t - 6.0) / 1.85
    add(drums, snare(), roll_t, 0.08 + 0.35 * prog ** 2, pan=0.1)
    if roll_t > 7.0:
        step = BT / 8
    roll_t += step

# --- groove : drop (8–14 s) et clair (14,5–20 s) ---
def groove(t0, t1, bright):
    t = t0
    while t < t1 - 1e-6:
        beat = round((t - t0) / BT)
        kicks.append(t)
        add(drums, kick(), t, 0.95)
        if beat % 2 == 1:
            add(drums, clap(), t, 0.55, pan=0.05)
        for s in range(4):
            ts = t + s * BT / 4
            if ts >= t1:
                break
            add(drums, hat(s == 2), ts, (0.16 if s == 2 else 0.07) * (1.2 if bright else 1), pan=-0.25 if s % 2 else 0.25)
        b = bar_of(t)
        # basse roulante : 2e et 4e doubles croches de chaque temps (la grosse caisse garde le 1er)
        for s in (2, 3):
            oct_up = 12 if (s == 3 and beat % 4 == 3) else 0
            add(bass, sub(hz(ROOTS[b] + oct_up), BT / 4 * 0.95), t + s * BT / 4, 0.7)
        t += BT
    # nappe et accroche
    b0 = int(round(t0 / BAR))
    tt = t0
    while tt < t1 - 1e-6:
        b = bar_of(tt)
        d = min(BAR, t1 - tt)
        ch = CHORDS[b]
        add(pad, supersaw([hz(n) for n in ch], d + 0.2, 3800 if bright else 2600, att=0.02, rel=0.25), tt, 0.38)
        rhythm = [1, 0, 1, 1, 0, 1, 1, 0] if not bright else [1, 0, 1, 0, 1, 1, 0, 1]
        tones = [ch[2] + 12, ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 12]
        for k in range(8):
            ts = tt + k * BT / 2
            if rhythm[k] and ts < t1:
                note = tones[k] + (12 if bright else 0)
                add(keys, pluck(hz(note), 0.4, bright=2.2 if bright else 1.5, decay=0.18), ts, 0.3 if not bright else 0.22, pan=0.3 * (1 if k % 2 else -1))
        tt += BAR
    _ = b0


groove(DROP, LIGHT, bright=False)
add(fx, impact(2.4), DROP, 0.75)
add(fx, impact(2.0), LIGHT, 0.6)
groove(LIGHT + BT, BRAND, bright=True)

# --- aplat ambre (20–21,5 s) : stab + roulement ---
add(pad, supersaw([hz(n) for n in [57, 60, 64, 69, 72]], 1.4, 5000, att=0.005, rel=0.9), BRAND, 0.6)
add(fx, impact(1.2), BRAND, 0.35)
for k in [0.0, BT]:
    kicks.append(BRAND + k)
    add(drums, kick(), BRAND + k, 0.9)
rt = BRAND + 2 * BT
while rt < END - 0.06:
    prog = (rt - (BRAND + 2 * BT)) / (END - BRAND - 2 * BT)
    add(drums, snare(), rt, 0.15 + 0.4 * prog, pan=0.1)
    rt += BT / 4 if prog < 0.5 else BT / 8
add(fx, reverse_swell(0.6), END - 0.6, 0.3)

# --- plan final (21,5–25 s) : impact + do majeur add9 qui s'éteint ---
add(fx, impact(3.0), END, 0.85)
kicks.append(END)
add(drums, kick(0.8), END, 1.0)
add(pad, supersaw([hz(n) for n in [48, 55, 60, 62, 64, 67, 72]], DUR - END, 3200, att=0.01, rel=2.6), END, 0.55)
for i, n in enumerate([72, 76, 79, 84, 86, 84, 79, 76, 79, 84]):
    add(keys, pluck(hz(n), 0.8, bright=2.5, decay=0.4), END + 0.25 + i * BT / 2, 0.16 * (1 - i / 12), pan=0.4 * np.sin(i))

# ---------------- mixage ----------------
duck = np.ones(N)
tt = np.arange(int(0.25 * SR)) / SR
shape = 1 - 0.65 * np.exp(-tt / 0.07)
for k in kicks:
    i = int(k * SR)
    j = min(N, i + len(shape))
    duck[i:j] = np.minimum(duck[i:j], shape[: j - i])

bass = np.vstack([filt(bass[0], "lowpass", 220), filt(bass[1], "lowpass", 220)])
mix = drums * 1.0 + bass * duck + reverb(pad, 2.2, 0.35, 1) * duck + reverb(keys, 1.4, 0.3, 2) * duck + reverb(fx, 2.5, 0.2, 3)
# légère saturation et limiteur doux
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
fade = np.ones(N)
fade[-int(0.8 * SR):] = np.linspace(1, 0, int(0.8 * SR)) ** 2
mix *= fade
mix /= np.max(np.abs(mix)) / 0.89
out = Path("public/motion/music.wav")
out.parent.mkdir(parents=True, exist_ok=True)
wavfile.write(out, SR, (mix.T * 32767).astype(np.int16))
print("→", out)
