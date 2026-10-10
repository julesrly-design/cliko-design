#!/usr/bin/env bash
# Mastering audio d'un rendu : normalisation à -14 LUFS intégrés, crête vraie ≤ -1 dBTP (loudnorm 2 passes).
# La vidéo est copiée telle quelle. Usage : scripts/master.sh entree.mp4 sortie.mp4
set -euo pipefail
in="$1"
out="$2"
stats=$(ffmpeg -hide_banner -nostats -i "$in" -af loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
get() { echo "$stats" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -loglevel error -y -i "$in" -c:v copy \
  -af "loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" \
  -ar 48000 -c:a aac -b:a 256k -movflags +faststart "$out"
ffmpeg -hide_banner -nostats -i "$out" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|True peak|Peak):" | head -3
