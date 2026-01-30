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
talos
```

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
# Tag a new version
git tag v1.0.1
git push origin v1.0.1

# GitHub Actions will automatically build and release
```

## License

MIT
