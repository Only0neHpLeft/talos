#!/bin/bash

set -e

REPO="Only0neHpLeft/talos"
INSTALL_DIR="/usr/local/bin"

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

echo "🚀 Installing talos for macOS $ARCH_NAME..."

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
echo "📦 Installing to $INSTALL_DIR..."
if [ -w "$INSTALL_DIR" ]; then
    mv "$TMP_FILE" "$INSTALL_DIR/talos"
else
    echo "🔑 Administrator password required to install to $INSTALL_DIR"
    sudo mv "$TMP_FILE" "$INSTALL_DIR/talos"
fi

# Verify installation
if command -v talos &> /dev/null; then
    echo ""
    echo "✅ talos installed successfully!"
    echo ""
    echo "Run 'talos' to start the CLI."
else
    echo "⚠️  Installation complete, but 'talos' is not in your PATH."
    echo "Add $INSTALL_DIR to your PATH or run: $INSTALL_DIR/talos"
fi
