#!/usr/bin/env bash
# Rendu complet + livrables : MP4 final (24 Mb/s), version téléphone (6 Mb/s), version mini 720p, miniature.
# Usage : bash scripts/render-all.sh   (dans le conteneur cloud, REMOTION_BROWSER doit être défini)
# COMP=ClikoMotion pour la version 3D (WebGL, plus lente) ; ClikoNeon par défaut.
set -euo pipefail
cd "$(dirname "$0")/.."
COMP=${COMP:-ClikoNeon}
npx remotion render src/index.ts "$COMP" out/raw-render.mp4 --concurrency=${CONCURRENCY:-4} --timeout=120000 > out/render.log 2>&1
PASSLOG=$(mktemp -d)/x264
ffmpeg -nostdin -y -v error -i out/raw-render.mp4 -c:v libx264 -preset slow -b:v 24M -maxrate 30M -bufsize 48M -pass 1 -passlogfile "$PASSLOG" -pix_fmt yuv420p -an -f mp4 /dev/null
ffmpeg -nostdin -y -v error -i out/raw-render.mp4 -c:v libx264 -preset slow -b:v 24M -maxrate 30M -bufsize 48M -pass 2 -passlogfile "$PASSLOG" \
  -pix_fmt yuv420p -profile:v high -level 4.2 -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 256k -ar 48000 -movflags +faststart out/cliko-motion.mp4
ffmpeg -nostdin -y -v error -i out/cliko-motion.mp4 -c:v libx264 -preset medium -b:v 6M -maxrate 8M -bufsize 12M -pix_fmt yuv420p \
  -profile:v high -level 4.2 -c:a aac -b:a 160k -movflags +faststart out/cliko-reel-telephone.mp4
ffmpeg -nostdin -y -v error -i out/cliko-reel-telephone.mp4 -vf scale=720:1280:flags=lanczos -c:v libx264 -preset medium -b:v 2.5M -maxrate 3.5M -bufsize 5M -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart out/cliko-reel-mini.mp4
COMP="$COMP" npx tsx scripts/thumbnail.ts > /dev/null 2>&1
convert out/miniature.png -quality 90 out/miniature.jpg
ls -la out/cliko-motion.mp4 out/cliko-reel-telephone.mp4 out/cliko-reel-mini.mp4 out/miniature.png out/miniature.jpg
