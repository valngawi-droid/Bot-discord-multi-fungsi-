#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "File .env belum ada. Jalankan bash scripts/install-termux.sh terlebih dahulu."
  exit 1
fi

termux-wake-lock 2>/dev/null || true
exec npm start
