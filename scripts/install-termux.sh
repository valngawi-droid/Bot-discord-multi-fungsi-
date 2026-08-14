#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

if [[ "${PREFIX:-}" != *"com.termux"* ]]; then
  echo "Script ini harus dijalankan dari aplikasi Termux."
  exit 1
fi

cd "$(dirname "$0")/.."

echo "==> Memperbarui package Termux..."
pkg update -y
pkg install -y nodejs-lts git nano tmux

echo "==> Memasang dependency bot..."
npm ci

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "==> File .env dibuat dari .env.example."
else
  echo "==> .env sudah ada; file tidak ditimpa."
fi

cat <<'EOF'

Instalasi dependency selesai.

Langkah berikutnya:
  1. Edit konfigurasi: nano .env
  2. Daftarkan command: npm run deploy
  3. Jalankan bot: npm start

Agar bot tetap berjalan saat layar terminal ditutup:
  termux-wake-lock
  tmux new -s discordbot
  npm start

Keluar dari tampilan tmux tanpa mematikan bot: tekan Ctrl+B, lalu D.
Kembali ke bot: tmux attach -t discordbot
EOF
