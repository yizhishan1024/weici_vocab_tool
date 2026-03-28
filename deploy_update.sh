#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

git pull
source .venv/bin/activate
python -m pip install -r requirements.txt

echo "代码和依赖已更新。接下来去 PythonAnywhere 的 Web 页面点 Reload。"
