#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not on PATH." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..."
  npm install
fi

if [[ ! -f build/icon.icns ]]; then
  echo "Error: build/icon.icns is missing. Ensure the build/ directory contains the app icon." >&2
  exit 1
fi

echo "Building macOS app (electron-vite + electron-builder; may take a minute)..."
npm run build:installer

APP_PATH=""
for dir in release/mac-arm64 release/mac-x64 release/mac-universal release/mac; do
  if [[ -d "$ROOT/$dir" ]]; then
    while IFS= read -r -d '' app; do
      APP_PATH="$app"
      break 2
    done < <(find "$ROOT/$dir" -maxdepth 1 -name "*.app" -print0 2>/dev/null)
  fi
done

if [[ -z "${APP_PATH}" || ! -d "${APP_PATH}" ]]; then
  echo "Error: Could not find a built .app under release/. See:" >&2
  find "$ROOT/release" -maxdepth 4 -type d 2>/dev/null || true
  exit 1
fi

APP_NAME="$(basename "$APP_PATH")"
echo "Installing ${APP_NAME} to /Applications ..."

remove_installed() {
  local target="/Applications/${APP_NAME}"
  if [[ ! -d "${target}" ]]; then
    return 0
  fi
  if rm -rf "${target}" 2>/dev/null; then
    return 0
  fi
  echo "Removing existing app requires administrator permission."
  sudo rm -rf "${target}"
}

copy_app() {
  if cp -R "${APP_PATH}" /Applications/ 2>/dev/null; then
    return 0
  fi
  echo "Copying to /Applications requires administrator permission."
  sudo cp -R "${APP_PATH}" /Applications/
}

remove_installed
copy_app

echo ""
echo "Done. Open Tmux Explorer from Launchpad or: open \"/Applications/${APP_NAME}\""
