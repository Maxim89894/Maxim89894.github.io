#!/bin/sh
# Использование (из корня проекта): sh tools/avatar/encode.sh frames   (папка с кадрами 0001.png … 0120.png)
# Каждый кадр ключевой (-g 1): так видео мгновенно перематывается при перетаскивании.
OUT="$(dirname "$0")/../../site"
mkdir -p "$OUT/video" "$OUT/img"
ffmpeg -y -framerate 30 -i "$1/%04d.png" -vf "scale=720:-2,format=yuv420p" -c:v libx264 -g 1 -crf 23 -preset slow -movflags +faststart -an "$OUT/video/avatar-360.mp4"
ffmpeg -y -framerate 30 -i "$1/%04d.png" -vf "scale=720:-2" -c:v libvpx-vp9 -g 1 -crf 36 -b:v 0 -an "$OUT/video/avatar-360.webm"
ffmpeg -y -i "$OUT/video/avatar-360.mp4" -frames:v 1 "$OUT/img/avatar-poster.jpg"
echo "Готово: site/video/avatar-360.mp4, site/video/avatar-360.webm, site/img/avatar-poster.jpg"
