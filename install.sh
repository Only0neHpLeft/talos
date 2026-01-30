#!/bin/bash

set -e

REPO="Only0neHpLeft/talos"

# Box drawing characters
TOP_LEFT="┌"
TOP_RIGHT="┐"
BOTTOM_LEFT="└"
BOTTOM_RIGHT="┘"
HORIZONTAL="─"
VERTICAL="│"
BULLET="•"
ARROW="→"
CHECK="✓"

# Colors - use -e flag with echo for escape sequences
BOLD='\e[1m'
DIM='\e[2m'
RESET='\e[0m'
CYAN='\e[36m'
GREEN='\e[32m'
YELLOW='\e[33m'
RED='\e[31m'

# Print a box with title - fixed width
print_box() {
    local title="$1"
    local width=48
    local title_len=${#title}
    local total_padding=$((width - title_len))
    local left_padding=$((total_padding / 2))
    local right_padding=$((total_padding - left_padding))
    
    echo -e "${CYAN}${TOP_LEFT}$(printf '%*s' $width '' | tr ' ' "${HORIZONTAL}")${TOP_RIGHT}${RESET}"
    echo -e "${CYAN}${VERTICAL}${RESET}$(printf '%*s' $left_padding '')${BOLD}${title}${RESET}$(printf '%*s' $right_padding '')${CYAN}${VERTICAL}${RESET}"
    echo -e "${CYAN}${BOTTOM_LEFT}$(printf '%*s' $width '' | tr ' ' "${HORIZONTAL}")${BOTTOM_RIGHT}${RESET}"
}

# Print a status line
print_status() {
    local icon="$1"
    local message="$2"
    echo -e "  ${CYAN}${icon}${RESET} ${message}"
}

# Print error and exit
error() {
    echo -e "  ${RED}[ERROR]${RESET} $1" >&2
    exit 1
}

# Print warning
warn() {
    echo -e "  ${YELLOW}[WARN]${RESET} $1"
}

# Print success
success() {
    echo -e "  ${GREEN}${CHECK}${RESET} $1"
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
echo ""
print_box "TALOS INSTALLER"
echo ""

# Architecture info
print_status "$BULLET" "Target: macOS ${ARCH_NAME}"
print_status "$BULLET" "Location: ${INSTALL_DIR}"
echo ""

# PATH warning
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    warn "${INSTALL_DIR} is not in your PATH"
    echo ""
    echo "  Add this to your shell config:"
    echo -e "  ${DIM}export PATH=\"\$HOME/.local/bin:\$PATH\"${RESET}"
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
    echo -e "  ${YELLOW}[sudo required for ${INSTALL_DIR}]${RESET}"
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
if command -v talos &> /dev/null; then
    echo -e "  Run ${BOLD}talos${RESET} to start the CLI."
    echo ""
    echo -e "  ${DIM}Auto-updates are enabled. Just run 'talos' and it will"
    echo -e "  check for updates automatically on startup.${RESET}"
else
    warn "talos is installed but not in your PATH"
    echo ""
    echo "  Add this to your shell config (~/.zshrc or ~/.bashrc):"
    echo -e "  ${DIM}export PATH=\"\$HOME/.local/bin:\$PATH\"${RESET}"
    echo ""
    echo -e "  Then run: ${BOLD}${INSTALL_DIR}/talos${RESET}"
fi

echo ""
