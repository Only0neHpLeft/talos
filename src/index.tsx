import React from "react";
import { render } from "ink";
import App from "./app.js";

const VERSION = "1.0.0";

// Handle CLI args
const args = process.argv.slice(2);

if (args.includes("--version") || args.includes("-v")) {
  console.log(`talos v${VERSION}`);
  process.exit(0);
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
talos v${VERSION} - Terminal AI Chat Interface

Usage:
  talos                    Start the chat interface
  talos --version, -v      Show version
  talos --help, -h         Show this help

Commands (in chat):
  /model                   Switch AI model
  Ctrl+C                   Exit
`);
  process.exit(0);
}

// Clear terminal so Talos starts at the top
process.stdout.write("\x1b[2J\x1b[3J\x1b[H");

render(<App />, { patchConsole: false });
