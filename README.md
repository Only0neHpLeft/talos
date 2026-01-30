# Talos

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        TALOS TERMINAL AI                        │
│                                                                 │
│              Terminal-based AI Chat Interface                   │
│                      for macOS                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

### Quick Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/Only0neHpLeft/talos/main/install.sh | bash
```

### Manual Install

**Apple Silicon (ARM64):**
```bash
curl -fsSL https://github.com/Only0neHpLeft/talos/releases/latest/download/talos-darwin-arm64 -o talos
chmod +x talos
sudo mv talos /usr/local/bin/
```

**Intel Macs (x64):**
```bash
curl -fsSL https://github.com/Only0neHpLeft/talos/releases/latest/download/talos-darwin-x64 -o talos
chmod +x talos
sudo mv talos /usr/local/bin/
```

---

## Usage

```
┌─────────────────────────────────────────────────────────────────┐
│  COMMANDS                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Start Talos:                                                   │
│    $ talos                                                      │
│                                                                 │
│  Skip update check:                                             │
│    $ talos --no-update                                          │
│                                                                 │
│  Show version:                                                  │
│    $ talos --version                                            │
│                                                                 │
│  Show help:                                                     │
│    $ talos --help                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### In-App Commands

```
┌─────────────────────────────────────────────────────────────────┐
│  SLASH COMMANDS                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /model        Switch between AI models                         │
│  /changelog    Show latest release notes                        │
│  /version      Show version information                         │
│  Ctrl+C        Exit the application                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

```
┌─────────────────────────────────────────────────────────────────┐
│  FEATURES                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Multiple AI Model Support                                    │
│    - Anthropic Opus 4.5                                         │
│    - Moonshot Kimi 2.5                                          │
│                                                                 │
│  • Syntax Highlighting                                          │
│    - Code blocks with proper formatting                         │
│    - Multiple language support                                  │
│                                                                 │
│  • File Operations                                              │
│    - View file diffs                                            │
│    - Permission-based file writing                              │
│    - Safe operation confirmation                                │
│                                                                 │
│  • Auto-Updates                                                 │
│    - Automatic version checking                                 │
│    - One-command update installation                            │
│    - Graceful restart after update                              │
│                                                                 │
│  • Beautiful Terminal UI                                        │
│    - Minimalist design                                          │
│    - Box-drawing interface                                      │
│    - Keyboard navigation                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Auto-Update

Talos automatically checks for updates when you start it. If a new version is available:

1. Downloads the latest version from GitHub Releases
2. Installs it (may prompt for password if system-wide)
3. Restarts automatically with the new version

To skip the update check, use `talos --no-update`.

---

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build TypeScript
bun run build

# Create standalone binary
bun run compile

# Run tests
bun test
```

---

## Releasing

To create a new release:

```bash
# 1. Update version in src/version.ts
echo 'export const VERSION = "0.0.3";' > src/version.ts

# 2. Update CHANGELOG.md with new changes

# 3. Commit changes
git add .
git commit -m "Bump version to 0.0.3"
git push

# 4. Tag and push (triggers GitHub Actions workflow)
git tag v0.0.3
git push origin v0.0.3

# GitHub Actions automatically builds and releases
```

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed release history.

---

## License

MIT License - see LICENSE file for details.

---

## Requirements

- macOS (Apple Silicon or Intel)
- Terminal with Unicode support (for box drawing characters)
- Internet connection (for AI model API access)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Made with care for the terminal               │
└─────────────────────────────────────────────────────────────────┘
```
