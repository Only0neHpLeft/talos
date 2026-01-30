import { checkAndUpdate } from "./update-checker.js";

// Handle CLI args
const args = process.argv.slice(2);

if (args.includes("--version") || args.includes("-v")) {
  const { VERSION } = await import("./version.js");
  console.log(`talos v${VERSION}`);
  process.exit(0);
}

if (args.includes("--help") || args.includes("-h")) {
  const { VERSION } = await import("./version.js");
  console.log(`
talos v${VERSION} - Terminal AI Chat Interface

Usage:
  talos                    Start the chat interface
  talos --version, -v      Show version
  talos --help, -h         Show this help
  talos --no-update        Skip update check on startup

Commands (in chat):
  /model                   Switch AI model
  Ctrl+C                   Exit
`);
  process.exit(0);
}

// Check for updates before starting (unless skipped)
if (!args.includes("--no-update")) {
  const updateApplied = await checkAndUpdate();
  if (updateApplied) {
    // Exit this process - the new version will take over
    process.exit(0);
  }
}

// Import and start the app
const { render } = await import("ink");
const { default: App } = await import("./app.js");
const React = await import("react");

// Clear terminal so Talos starts at the top
process.stdout.write("\x1b[2J\x1b[3J\x1b[H");

render(React.createElement(App), { patchConsole: false });
