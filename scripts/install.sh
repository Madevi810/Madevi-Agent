#!/usr/bin/env bash
set -Eeuo pipefail

REPOSITORY="https://github.com/Madevi810/Madevi-Agent.git"
INSTALL_DIR="$HOME/.local/share/madevi"
BIN_DIR="$HOME/.local/bin"
TEMP_DIR=""

cleanup() {
  if [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]]; then
    rm -rf "$TEMP_DIR"
  fi
}

fail() {
  printf 'Madevi installer: %s\n' "$1" >&2
  exit 1
}

trap cleanup EXIT

command -v git >/dev/null 2>&1 || fail "Git is required. Install Git, then run this command again."
command -v node >/dev/null 2>&1 || fail "Node.js 20 or newer is required. Install Node.js, then run this command again."

NODE_VERSION="$(node --version | sed 's/^v//')"
NODE_MAJOR="$(printf '%s' "$NODE_VERSION" | cut -d. -f1)"
[[ "$NODE_MAJOR" -ge 20 ]] || fail "Node.js 20 or newer is required; found $NODE_VERSION."

if [[ -d "$INSTALL_DIR/.git" ]]; then
  if [[ -n "$(git -C "$INSTALL_DIR" status --porcelain)" ]]; then
    fail "Existing Madevi installation has uncommitted changes at $INSTALL_DIR. Preserve or commit them before updating."
  fi

  printf 'Updating Madevi in %s...\n' "$INSTALL_DIR"
  git -C "$INSTALL_DIR" fetch --depth 1 origin main
  git -C "$INSTALL_DIR" checkout --quiet main
  git -C "$INSTALL_DIR" pull --ff-only origin main
elif [[ -e "$INSTALL_DIR" ]]; then
  fail "$INSTALL_DIR already exists but is not a Madevi Git installation."
else
  TEMP_DIR="$(mktemp -d)"
  printf 'Installing Madevi in %s...\n' "$INSTALL_DIR"
  git clone --depth 1 --branch main "$REPOSITORY" "$TEMP_DIR/madevi"
  mkdir -p "$(dirname "$INSTALL_DIR")"
  mv "$TEMP_DIR/madevi" "$INSTALL_DIR"
fi

mkdir -p "$BIN_DIR"
printf '#!/usr/bin/env bash\nexec node "%s/apps/cli/bin/madevi.mjs" "$@"\n' "$INSTALL_DIR" > "$BIN_DIR/madevi"
chmod +x "$BIN_DIR/madevi"

"$BIN_DIR/madevi" init

printf '\nMadevi is ready.\n'
printf 'Run: %s status\n' "$BIN_DIR/madevi"

if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
  printf '\nAdd Madevi to your PATH to use the short command:\n'
  printf '  export PATH="$HOME/.local/bin:$PATH"\n'
fi
