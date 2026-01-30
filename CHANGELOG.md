# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.0.28] - 2026-01-31

### Fixed
- [FIX] Removed git error spam when running outside git repositories
- [FIX] Suppressed debug output from git commands

---

## [0.0.27] - 2026-01-31

### Changed
- [CHANGE] Removed emojis from console output in update-checker
- [CHANGE] Replaced glyphs with text labels in theme for better compatibility

---

## [0.0.26] - 2026-01-31

### Fixed
- [FIX] Fixed install.sh box alignment issues
- [FIX] Removed color codes for better terminal compatibility when piped

---

## [0.0.25] - 2026-01-31

### Fixed
- [FIX] Fixed color escape sequences not working in piped bash execution
- [FIX] Fixed box alignment in Ghosty and other terminals

---

## [0.0.24] - 2026-01-31

### Added
- [FEATURE] Install script now displays version number during download

### Changed
- [CHANGE] Improved install script output formatting

---

## [0.0.23] - 2026-01-31

### Fixed
- [FIX] Fixed version.ts to use hardcoded value matching GitHub releases
- [FIX] Updated package.json version to match latest tag

---

## [0.0.22] - 2026-01-31

### Changed
- [CHANGE] Simplified auto-updater to direct download-install-restart flow
- [CHANGE] Removed complex update logic

---

## [0.0.21] - 2026-01-30

### Fixed
- [FIX] Fixed infinite re-render loop in InputBar component

---

## [0.0.20] - 2026-01-30

### Changed
- [CHANGE] Simplified version display UI

---

## [0.0.19] - 2026-01-30

### Fixed
- [FIX] Hide DEBUG messages in production builds

---

## [0.0.18] - 2026-01-30

### Fixed
- [FIX] Fixed auto-updater to work when GitHub API is rate limited
- [FIX] Fixed version check rate limiting issues

---

## [0.0.17] - 2026-01-29

### Changed
- [CHANGE] Implemented Ink best practices from Context7

---

## [0.0.16] - 2026-01-29

### Fixed
- [FIX] Fixed API calls: use https module instead of fetch for compiled binary

---

## [0.0.15] - 2026-01-29

### Fixed
- [FIX] Fixed restart bug: don't inherit stdio, exit immediately after spawn

---

## [0.0.14] - 2026-01-29

### Added
- [FEATURE] Initial auto-updater implementation

### Changed
- [CHANGE] Make update download truly background/non-blocking

---

## [0.0.13] - 2026-01-28

### Added
- [FEATURE] Add Bun dependency caching to release workflow

### Changed
- [CHANGE] UI improvements: minimal boxes, faster downloads

---

## [0.0.12] - 2026-01-28

### Changed
- [CHANGE] Redesigned ModelSelector to be minimalistic and compact

---

## [0.0.11] - 2026-01-28

### Fixed
- [FIX] Fix auto-updater file naming inconsistency

---

## [0.0.10] - 2026-01-28

### Changed
- [CHANGE] Redesigned PermissionGate to be minimalistic

---

## [0.0.9] - 2026-01-27

### Added
- [FEATURE] Initial release with basic chat functionality

### Changed
- [CHANGE] UI redesign with Catppuccin Mocha theme

---

## [0.0.8] - 2026-01-27

### Added
- [FEATURE] File diff viewer
- [FEATURE] Permission system for file operations

---

## [0.0.7] - 2026-01-27

### Added
- [FEATURE] Multiple AI model support

---

## [0.0.6] - 2026-01-26

### Added
- [FEATURE] Syntax highlighting for code blocks

---

## [0.0.5] - 2026-01-26

### Added
- [FEATURE] Auto-updates on startup

---

## [0.0.4] - 2026-01-26

### Fixed
- [FIX] Terminal input handling improvements

---

## [0.0.3] - 2026-01-25

### Added
- [FEATURE] Basic slash command support (/model, /version)

---

## [0.0.2] - 2026-01-25

### Fixed
- [FIX] Initial bug fixes for macOS compatibility

---

## [0.0.1] - 2026-01-25

### Added
- [FEATURE] Initial release
- [FEATURE] Terminal-based AI chat interface
- [FEATURE] React/Ink-based UI

---
