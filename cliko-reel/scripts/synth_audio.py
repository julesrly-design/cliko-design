"""Piste musicale et bruitages TEMPORAIRES, synthétisés (numpy/scipy), en attendant ElevenLabs.

- public/music/temp-music.wav : house minimaliste 122 BPM, calée sur la timeline
  (intro mécanique filtrée pendant l'accroche, drop à la scène 2, respiration à la scène 5,
  final sur le temps).
- public/sfx/*.wav : bruitages (whoosh, clic signature, pop, tampon, frein, frappe, tuile...).

Usage : python3 scripts/synth_audio.py public/timeline-A.json
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
BPM = 122.0
BEAT = 60.0 / BPM
rng = np.random.default_rng(7)


# ---------- primitives ----------
def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env_adsr(n, a=0.002, d=0.1, s=0.0, r=0.05, sustain_time=0.0):
    a_n, d_n, s_n, r_n = int(a * SR), int(d * SR), int(sustain_time * SR), int(r * SR)
    e = np.concatenate([
        np.linspace(0, 1, max(a_n, 1)),
        np.linspace(1, s, max(d_n, 1)),
        np.full(s_n, s),
        np.linspace(s, 0, max(r_n, 1)),
    ])
    out = np.zeros(n)
    out[: min(n, len(e))] = e[:n]
    return out


def filt(x, kind, f, order=2):
    wn = np.asarray(f, dtype=float) / (SR / 2)
    sos = butter(order, wn if wn.ndim else float(wn), btype=kind, output="sos")
    return sosfilt(sos, x)


def sweep_filter(x, kind, f0, f1, steps=64):
    """Filtre dont la coupure glisse de f0 à f1 (par blocs)."""
    out = np.zeros_like(x)
    edges = np.linspace(0, len(x), steps + 1).astype(int)
    for i in range(steps):
        f = f0 * (f1 / f0) ** (i / max(steps - 1, 1))
        seg = x[max(0, edges[i] - 2048): edges[i + 1]]
        y = filt(seg, kind, min(f, SR / 2 - 100))
        out[edges[i]: edges[i + 1]] = y[-(edges[i + 1] - edges[i]):]
    return out


def noise(n):
    return rng.standard_normal(n)


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def saw(freq, t):
    return 2 * ((freq * t) % 1) - 1


# ---------- instruments ----------
def kick(dur=0.45):
    t = t_(dur)
    f = 48 + 110 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = filt(noise(len(t)), "highpass", 2500) * np.exp(-t * 220) * 0.35
    return np.tanh((body + click) * 1.6)


def clap(dur=0.3):
    t = t_(dur)
    n = filt(noise(len(t)), "bandpass", [900, 3200])
    e = np.zeros(len(t))
    for k, off in enumerate([0, 0.011, 0.022]):
        i = int(off * SR)
        e[i:] += np.exp(-(t[: len(t) - i]) * (90 if k < 2 else 22))
    return n * e * 0.8


def hat(dur=0.06, open_=False):
    t = t_(0.28 if open_ else dur)
    n = filt(noise(len(t)), "highpass", 7000)
    return n * np.exp(-t * (14 if open_ else 70)) * 0.5


def bass_note(freq, dur):
    t = t_(dur)
    x = saw(freq, t) + 0.5 * np.sin(2 * np.pi * freq * t)
    x = filt(x, "lowpass", 420)
    return x * env_adsr(len(t), 0.004, 0.08, 0.7, 0.04, dur - 0.13)


def chord(freqs, dur, cutoff=1800, warm=False):
    t = t_(dur)
    x = np.zeros(len(t))
    for f in freqs:
        for det in (-0.12, 0.0, 0.12):
            ff = f * 2 ** (det / 12)
            x += (np.sin(2 * np.pi * ff * t) * 0.6 + saw(ff, t) * (0.15 if warm else 0.35))
    x = filt(x, "lowpass", cutoff)
    return x * env_adsr(len(t), 0.01 if not warm else 0.05, 0.25, 0.35, 0.2, max(0, dur - 0.5)) / len(freqs)


def metal_tick(dur=0.12):
    t = t_(dur)
    x = sum(np.sin(2 * np.pi * f * t) for f in (1730, 2610, 3920, 5400)) * np.exp(-t * 45)
    return x * 0.25 + filt(noise(len(t)), "bandpass", [3000, 6000]) * np.exp(-t * 80) * 0.15


def place(buf, x, t0, gain=1.0):
    i = int(round(t0 * SR))
    if i >= len(buf) or i + len(x) <= 0:
        return
    j = min(len(buf), i + len(x))
    s = max(0, -i)
    buf[i + s: j] += x[s: j - i] * gain


# ---------- musique ----------
def music(tl):
    sc = tl["scenes"]
    total = tl["total"] + 0.6
    n = int(total * SR)
    drums, bass, keys, mech = (np.zeros(n) for _ in range(4))

    drop = sc["probleme"]["from"]
    breath0 = sc["humain"]["from"]
    breath1 = breath0 + 2 * BEAT
    cta = sc["cta"]["from"]
    end = tl["total"]

    # grille : temps 1 calé sur le drop (le drop tombe sur un temps)
    grid0 = drop - BEAT * np.ceil(drop / BEAT)
    beats = [grid0 + k * BEAT for k in range(int((total - grid0) / BEAT) + 2)]

    # progression Am9 – Fmaj7 – C – G(add9), 1 accord par mesure
    prog = [
        ([220.0, 261.63, 329.63, 392.0, 493.88], 55.0),
        ([174.61, 220.0, 261.63, 329.63], 43.65),
        ([196.0, 261.63, 329.63, 392.0], 65.41),
        ([196.0, 246.94, 293.66, 440.0], 49.0),
    ]

    for k, b in enumerate(beats):
        if b < -0.01 or b > end + 0.05:
            continue
        bar, beat_in_bar = divmod(k, 4)
        in_breath = breath0 <= b < breath1
        in_intro = b < drop - 0.01
        chords, root = prog[bar % 4]

        if in_intro:
            # intro mécanique : tic-tac métallique + kick étouffé
            for s in range(4):
                place(mech, metal_tick(), b + s * BEAT / 4, 0.9 if s == 0 else 0.45)
            place(drums, filt(kick(), "lowpass", 300), b, 0.5)
            continue
        if in_breath:
            continue

        warm = b >= breath1 and b < cta
        place(drums, kick(), b, 1.0)
        place(drums, hat(open_=True), b + BEAT / 2, 0.35 if not warm else 0.25)
        for s in (1, 3):
            place(drums, hat(), b + s * BEAT / 4, 0.25)
        if beat_in_bar in (1, 3):
            place(drums, clap(), b, 0.75)
        # basse en contretemps (house)
        place(bass, bass_note(root * 2, BEAT / 2 * 0.9), b + BEAT / 2, 0.8)
        if beat_in_bar == 0:
            place(keys, chord(chords, BEAT * 4, cutoff=2200 if not warm else 1500, warm=warm), b, 0.7 if not warm else 0.9)
        elif not warm and beat_in_bar == 2:
            place(keys, chord(chords, BEAT * 0.4, cutoff=3000), b + BEAT / 2, 0.35)

    # respiration : nappe chaude seule
    breath_pad = chord([220.0, 277.18, 329.63, 415.3], breath1 - breath0 + 0.6, cutoff=900, warm=True)
    place(keys, breath_pad, breath0, 1.2)

    # pompe sidechain sur basse + claviers
    pump = np.ones(n)
    for b in beats:
        if drop <= b <= end and not (breath0 <= b < breath1):
            i = int(b * SR)
            L = int(BEAT * SR)
            seg = 1 - 0.65 * np.exp(-np.arange(L) / SR * 9)
            j = min(n, i + L)
            if i >= 0:
                pump[i:j] = np.minimum(pump[i:j], seg[: j - i])

    # final : impact sur le dernier temps, puis la mécanique reprend (boucle)
    last_beat = max(b for b in beats if b <= end - 0.1)
    impact = kick(0.9) * 1.2 + filt(noise(int(0.9 * SR)), "lowpass", 900) * np.exp(-t_(0.9) * 6) * 0.3
    place(drums, impact, last_beat, 1.0)
    for s in range(3):
        place(mech, metal_tick(), end - 0.3 + s * BEAT / 4, 0.5)

    mix = drums * 0.9 + bass * pump * 0.7 + keys * pump * 0.55 + mech * 0.6
    # filtre de l'intro (lowpass qui s'ouvre jusqu'au drop)
    i_drop = int(drop * SR)
    if i_drop > 0:
        mix[:i_drop] = sweep_filter(mix[:i_drop], "lowpass", 600, 9000)
    # respiration : passe-bas sur ce qui reste
    i0, i1 = int(breath0 * SR), int(breath1 * SR)
    mix[i0:i1] = filt(mix[i0:i1], "lowpass", 700)
    # fondu de sortie très court
    fade = int(0.08 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)
    st = np.stack([mix, np.roll(mix, int(0.00035 * SR))], axis=1)  # léger élargissement
    return norm(np.tanh(st * 1.3), 0.8), beats


# ---------- bruitages ----------
def sfx_bank():
    out = {}
    # whoosh : bruit filtré passe-bande qui monte puis redescend
    for name, dur, f0, f1, g in [("whoosh", 0.55, 400, 5000, 1.0), ("whoosh-deep", 0.9, 120, 1600, 1.2), ("whip", 0.28, 1200, 9000, 0.9)]:
        t = t_(dur)
        x = sweep_filter(noise(len(t)), "lowpass", f0, f1, 48)
        x = filt(x, "highpass", f0 * 0.5)
        e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
        out[name] = norm(x * e) * g
    # aspiration = whoosh inversé
    out["suck"] = out["whoosh-deep"][::-1].copy()
    # riser
    t = t_(1.4)
    x = sweep_filter(noise(len(t)), "bandpass" if False else "lowpass", 200, 12000, 64) * (t / 1.4) ** 2
    x += np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / 1.4) ** 2) / SR) * (t / 1.4) ** 2 * 0.3
    out["riser"] = norm(x, 0.8)
    # clic signature : transitoire sec + petite queue brillante
    t = t_(0.5)
    click = filt(noise(len(t)), "bandpass", [2000, 8000]) * np.exp(-t * 600)
    tone = (np.sin(2 * np.pi * 1760 * t) + 0.5 * np.sin(2 * np.pi * 2637 * t)) * np.exp(-t * 14) * 0.25
    body = np.sin(2 * np.pi * (180 + 300 * np.exp(-t * 60)) * t) * np.exp(-t * 40) * 0.6
    out["click-signature"] = norm(click + tone + body, 0.9)
    # clic court (validation barre d'adresse)
    out["click"] = norm(click[: int(0.12 * SR)] + body[: int(0.12 * SR)] * 0.7, 0.8)
    # pop
    t = t_(0.18)
    f = 300 + 700 * np.exp(-t * 40)
    out["pop"] = norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28), 0.7)
    # tampon industriel
    t = t_(0.7)
    thud = np.sin(2 * np.pi * (55 + 90 * np.exp(-t * 30)) * t) * np.exp(-t * 9)
    clank = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in [(410, 18), (1130, 25), (2450, 35)]) * 0.3
    hit = filt(noise(len(t)), "lowpass", 2500) * np.exp(-t * 60) * 0.6
    out["stamp"] = norm(np.tanh((thud + clank + hit) * 2), 0.95)
    # frein métallique
    t = t_(0.8)
    sq = np.sin(2 * np.pi * np.cumsum(2400 - 1400 * t / 0.8) / SR) * np.exp(-t * 4) * 0.4
    out["brake"] = norm(sq + filt(noise(len(t)), "bandpass", [1500, 5000]) * np.exp(-t * 5) * 0.4 + np.pad(out["stamp"], (int(0.55 * SR), 0))[: len(t)] * 0.5, 0.85)
    # frappe clavier
    t = t_(0.07)
    out["key"] = norm(filt(noise(len(t)), "bandpass", [1800, 6000]) * np.exp(-t * 160) + np.sin(2 * np.pi * 320 * t) * np.exp(-t * 90) * 0.4, 0.5)
    # tuile split-flap
    t = t_(0.2)
    out["flap"] = norm(filt(noise(len(t)), "bandpass", [700, 4000]) * (np.exp(-t * 120) + 0.6 * np.exp(-np.maximum(t - 0.05, 0) * 140) * (t > 0.05)), 0.7)
    # marqueur
    t = t_(0.45)
    out["marker"] = norm(filt(noise(len(t)), "bandpass", [1500, 7000]) * np.sin(np.pi * t / 0.45) ** 0.5 * (1 + 0.3 * np.sin(2 * np.pi * 40 * t)), 0.5)
    # robot : grésillement puis extinction CRT
    t = t_(1.0)
    buzz = np.sign(np.sin(2 * np.pi * 100 * t)) * 0.3 * (rng.random(len(t)) > 0.3) * (t < 0.6)
    down = np.sin(2 * np.pi * np.cumsum(900 * np.exp(-np.maximum(t - 0.6, 0) * 9)) / SR) * (t >= 0.6) * np.exp(-np.maximum(t - 0.6, 0) * 6) * 0.5
    out["glitch-off"] = norm(filt(buzz, "bandpass", [200, 4000]) + down, 0.7)
    # messages
    t = t_(0.35)
    out["msg-send"] = norm(sweep_filter(noise(len(t)), "lowpass", 800, 6000, 16) * np.sin(np.pi * t / 0.35) ** 2 * 0.6, 0.6)
    t = t_(0.6)
    out["msg-receive"] = norm(sum(np.sin(2 * np.pi * f * t) * np.exp(-(t - o) * 8) * (t >= o) for f, o in [(1318.5, 0), (1760, 0.09)]), 0.6)
    # impact grave
    t = t_(1.2)
    out["impact"] = norm(np.tanh((np.sin(2 * np.pi * (40 + 60 * np.exp(-t * 15)) * t) * np.exp(-t * 3) + filt(noise(len(t)), "lowpass", 1200) * np.exp(-t * 10) * 0.5) * 2), 0.95)
    # chaîne mécanique (boucle)
    t = t_(2.0)
    x = np.zeros(len(t))
    for k in range(int(2.0 / (BEAT / 4))):
        place(x, metal_tick(), k * BEAT / 4, 0.8 if k % 4 == 0 else 0.4)
    x += filt(noise(len(t)), "lowpass", 300) * 0.15
    out["conveyor"] = norm(x, 0.6)
    return out


def write(path, x):
    path.parent.mkdir(parents=True, exist_ok=True)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    wavfile.write(path, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
    print("→", path)


if __name__ == "__main__":
    tl_path = Path(sys.argv[1] if len(sys.argv) > 1 else "public/timeline-A.json")
    tl = json.loads(tl_path.read_text())
    variant = tl.get("variant", "A")
    m, beats = music(tl)
    write(Path(f"public/music/temp-music-{variant}.wav"), m)
    Path(f"public/music/beats-{variant}.json").write_text(json.dumps([round(b, 4) for b in beats if 0 <= b <= tl["total"]]))
    for name, x in sfx_bank().items():
        write(Path(f"public/sfx/{name}.wav"), x)
