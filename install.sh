#!/bin/bash

set -e

REPO="Only0neHpLeft/talos"

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    BINARY="talos-darwin-arm64"
    ARCH_NAME="Apple Silicon (ARM64)"
elif [ "$ARCH" = "x86_64" ]; then
    BINARY="talos-darwin-x64"
    ARCH_NAME="Intel (x64)"
else
    echo "❌ Unsupported architecture: $ARCH"
    echo "Only macOS ARM64 and x64 are supported."
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

# Add to PATH if needed
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo "⚠️  $INSTALL_DIR is not in your PATH."
    echo "   Add this to your ~/.zshrc or ~/.bashrc:"
    echo "   export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
fi

echo "🚀 Installing talos for macOS $ARCH_NAME..."
echo "📁 Install location: $INSTALL_DIR"

# Create temp file
TMP_FILE=$(mktemp)

# Download
echo "📥 Downloading latest release..."
if ! curl -fsSL "https://github.com/$REPO/releases/latest/download/$BINARY" -o "$TMP_FILE"; then
    echo "❌ Download failed. Make sure you have internet connection."
    rm -f "$TMP_FILE"
    exit 1
fi

# Verify it's a valid binary (not an HTML error page)
if file "$TMP_FILE" | grep -q "HTML"; then
    echo "❌ Downloaded file is not a valid binary."
    rm -f "$TMP_FILE"
    exit 1
fi

# Make executable
chmod +x "$TMP_FILE"

# Move to install directory
echo "📦 Installing..."
if [ "$USE_SUDO" = true ]; then
    echo "🔑 Administrator password required for $INSTALL_DIR"
    sudo mv "$TMP_FILE" "$INSTALL_DIR/talos"
    sudo chmod +x "$INSTALL_DIR/talos"
else
    mv "$TMP_FILE" "$INSTALL_DIR/talos"
fi

# Verify installation
if command -v talos &> /dev/null; then
    echo ""
    echo "✅ talos installed successfully!"
    echo ""
    echo "Run 'talos' to start the CLI."
    echo ""
    echo "To update in the future, just run: talos"
    echo "(it will auto-update on startup if a new version is available)"
else
    echo "⚠️  Installation complete, but 'talos' is not in your PATH."
    echo "Add this to your ~/.zshrc or ~/.bashrc:"
    echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    echo "Then run: $INSTALL_DIR/talos"
fi
