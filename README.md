# Talos

A terminal-based AI chat interface.

## Installation (macOS)

### One-liner install:

```bash
curl -fsSL https://raw.githubusercontent.com/Only0neHpLeft/talos/main/install.sh | bash
```

### Or manually:

```bash
# Download for Apple Silicon
curl -fsSL https://github.com/Only0neHpLeft/talos/releases/latest/download/talos-darwin-arm64 -o talos
chmod +x talos
sudo mv talos /usr/local/bin/

# Or download for Intel Macs
curl -fsSL https://github.com/Only0neHpLeft/talos/releases/latest/download/talos-darwin-x64 -o talos
chmod +x talos
sudo mv talos /usr/local/bin/
```

## Usage

```bash
talos                    # Start with auto-update check
talos --no-update        # Skip update check
talos --version          # Show version
talos --help             # Show help
```

### Auto-Update

Talos automatically checks for updates when you start it (once per hour). If a new version is available, it will:
1. Download the latest version
2. Install it (may ask for your password)
3. Restart with the new version

To skip the update check, use `--no-update`.

## Development

```bash
# Install dependencies
bun install

# Run in dev mode
bun run dev

# Build standalone binary
bun run compile
```

## Commands

- `/model` - Switch between AI models
- `Ctrl+C` - Exit

## Releasing

To create a new release:

```bash
# Update version in src/version.ts first!
echo 'export const VERSION = "0.0.3";' > src/version.ts

# Commit and push
git add .
git commit -m "Bump version to 0.0.3"
git push

# Tag a new version (the workflow extracts version from tag)
git tag v0.0.3
git push origin v0.0.3

# GitHub Actions will automatically build and release
```

## License

MIT
