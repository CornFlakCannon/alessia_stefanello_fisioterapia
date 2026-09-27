#!/usr/bin/env bash
# Rigenera Preventivo_Alessia_Stefanello.pdf da preventivo.html con Chrome headless.
# Uso: bash docs/preventivo/build.sh   (da qualsiasi directory)
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser)}"
"$CHROME" --headless=new --disable-gpu --no-sandbox \
  --no-pdf-header-footer \
  --virtual-time-budget=8000 \
  --print-to-pdf="$PWD/Preventivo_Alessia_Stefanello.pdf" \
  "file://$PWD/preventivo.html" 2>/dev/null
echo "scritto: $PWD/Preventivo_Alessia_Stefanello.pdf"
