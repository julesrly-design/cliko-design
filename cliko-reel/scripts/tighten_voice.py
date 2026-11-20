"""Resserre une voix off : silences entre mots ramenés à MAXGAP, puis accélération TEMPO (sans changer la hauteur).
Met à jour l'alignement mot à mot. Usage : python3 scripts/tighten_voice.py mz2 0.16 1.1"""
import json, subprocess, sys
import numpy as np
from scipy.io import wavfile
d, MAXGAP, TEMPO = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
SR = 48000
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"public/{d}/voix-raw.mp3", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], check=True, capture_output=True).stdout
x = np.frombuffer(raw, np.float32).astype(float)
A = json.load(open(f"public/{d}/alignment-raw.json"))
W = A["words"]
pieces, cuts, t = [], [], 0.0  # cuts: (orig_time, shift)
lead = max(0, W[0]["start"] - 0.05)
pos = lead; shift = lead
segs = []
for i, w in enumerate(W):
    nxt = W[i + 1]["start"] if i + 1 < len(W) else None
    end = w["end"] + (0.03 if nxt is None else 0)
    if nxt is not None and nxt - w["end"] > MAXGAP:
        keep_end = w["end"] + MAXGAP / 2
        segs.append((pos, keep_end, shift)); shift += (nxt - MAXGAP / 2) - keep_end; pos = nxt - MAXGAP / 2
segs.append((pos, W[-1]["end"] + 0.25, shift))
def remap(tm):
    for a, b, s in segs:
        if tm <= b + 1e-6: return max(0, tm - s)
    return tm - segs[-1][2]
y = np.concatenate([x[int(a * SR):int(b * SR)] for a, b, _ in segs])
fade = int(0.004 * SR)
wavfile.write(f"/tmp/claude-0/-home-user-cliko-design/a76db72e-9acc-50d0-88d9-d1514be781bc/scratchpad/tight.wav", SR, (y * 32767).astype(np.int16))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "/tmp/claude-0/-home-user-cliko-design/a76db72e-9acc-50d0-88d9-d1514be781bc/scratchpad/tight.wav", "-af", f"atempo={TEMPO}", "-b:a", "192k", f"public/{d}/voix.mp3"], check=True)
for w in W: w["start"] = round(remap(w["start"]) / TEMPO, 3); w["end"] = round(remap(w["end"]) / TEMPO, 3)
for s in A["scenes"]:
    ws = [w for w in W if w["scene"] == s["scene"]]; s["start"], s["end"] = ws[0]["start"], ws[-1]["end"]
for p in (f"public/{d}/alignment.json", f"src/{d}/alignment.json"): json.dump(A, open(p, "w"), indent=1)
print([(s["scene"], s["start"], s["end"]) for s in A["scenes"]])
