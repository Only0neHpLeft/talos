#!/bin/bash

set -e

REPO="Only0neHpLeft/talos"

# Box drawing characters
BULLET="•"
ARROW="→"
CHECK="✓"

# Print header box - manually aligned, no colors
print_header() {
    echo ""
    echo "┌───────────────────────────────────────────┐"
    echo "│              TALOS INSTALLER              │"
    echo "└───────────────────────────────────────────┘"
    echo ""
}

# Print a status line
print_status() {
    local icon="$1"
    local message="$2"
    echo "  ${icon} ${message}"
}

# Print error and exit
error() {
    echo "  [ERROR] $1" >&2
    exit 1
}

# Print warning
warn() {
    echo "  [WARN] $1"
}

# Print success
success() {
    echo "  ${CHECK} $1"
}

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    BINARY="talos-darwin-arm64"
    ARCH_NAME="Apple Silicon (ARM64)"
elif [ "$ARCH" = "x86_64" ]; then
    BINARY="talos-darwin-x64"
    ARCH_NAME="Intel (x64)"
else
    error "Unsupported architecture: $ARCH"
    echo "  Only macOS ARM64 and x64 are supported."
    exit 1
fi

# Use user-local bin to avoid sudo
USER_BIN="$HOME/.local/bin"
SYSTEM_BIN="/usr/local/bin"

# Check if talos is already installed in system location
if [ -f "$SYSTEM_BIN/talos" ]; then
    INSTALL_DIR="$SYSTEM_BIN"
    USE_SUDO=true
else
    # Prefer user-local installation (no sudo needed)
    INSTALL_DIR="$USER_BIN"
    USE_SUDO=false
    mkdir -p "$INSTALL_DIR"
fi

# Header
print_header

# Architecture info
print_status "$BULLET" "Target: macOS ${ARCH_NAME}"
print_status "$BULLET" "Location: ${INSTALL_DIR}"
echo ""

# PATH warning
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    warn "${INSTALL_DIR} is not in your PATH"
    echo ""
    echo "  Add this to your shell config:"
    echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
fi

# Fetch latest version from GitHub API
print_status "$ARROW" "Checking for latest version..."
LATEST_VERSION=$(curl -fsSL -I "https://github.com/$REPO/releases/latest" 2>/dev/null | grep -i "location:" | sed 's/.*\/tag\/v//' | tr -d '\r')

if [ -z "$LATEST_VERSION" ]; then
    warn "Could not determine latest version, will attempt download anyway"
    LATEST_VERSION="latest"
fi

# Create temp file
TMP_FILE=$(mktemp)

# Download
print_status "$ARROW" "Downloading version ${LATEST_VERSION}..."
if ! curl -fsSL "https://github.com/$REPO/releases/latest/download/$BINARY" -o "$TMP_FILE" 2>/dev/null; then
    rm -f "$TMP_FILE"
    error "Download failed. Check your internet connection."
    exit 1
fi

# Verify it's a valid binary (not an HTML error page)
if file "$TMP_FILE" | grep -q "HTML"; then
    rm -f "$TMP_FILE"
    error "Downloaded file is not a valid binary."
    exit 1
fi

# Make executable
chmod +x "$TMP_FILE"

# Install
print_status "$ARROW" "Installing to ${INSTALL_DIR}..."
if [ "$USE_SUDO" = true ]; then
    echo ""
    echo "  [sudo required for ${INSTALL_DIR}]"
    sudo mv "$TMP_FILE" "$INSTALL_DIR/talos"
    sudo chmod +x "$INSTALL_DIR/talos"
else
    mv "$TMP_FILE" "$INSTALL_DIR/talos"
fi

# Success message
echo ""
success "Installation complete! (version ${LATEST_VERSION})"
echo ""

# Final instructions
if command -v talos > /dev/null 2>&1; then
    echo "  Run talos to start the CLI."
    echo ""
    echo "  Auto-updates are enabled. Just run 'talos' and it will"
    echo "  check for updates automatically on startup."
else
    warn "talos is installed but not in your PATH"
    echo ""
    echo "  Add this to your shell config (~/.zshrc or ~/.bashrc):"
    echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    echo "  Then run: ${INSTALL_DIR}/talos"
fi

echo ""
