#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")"

if [ $# -lt 1 ]; then
  echo "用法: ./push_update.sh \"这次更新说明\""
  exit 1
fi

MESSAGE="$1"

git add .
git commit -m "$MESSAGE"
git push

echo "已完成提交并推送。"
