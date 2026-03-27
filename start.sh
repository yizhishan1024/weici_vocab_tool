#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate
python -m pip install -r requirements.txt >/dev/null
WEICI_DEBUG=0 python app.py &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

sleep 2
open http://127.0.0.1:5050

wait "$SERVER_PID"
