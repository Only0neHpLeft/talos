#!/usr/bin/env node
import { checkAndUpdate } from "./update-checker.js";
import { VERSION } from "./version.js";

// CLI argument parsing function
function parseArgs(args: string[]): { 
  version: boolean; 
  help: boolean; 
  noUpdate: boolean;
  unknownArgs: string[];
} {
  const result = {
    version: false,
    help: false,
    noUpdate: false,
    unknownArgs: [] as string[],
  };

  for (const arg of args) {
    switch (arg) {
      case "--version":
      case "-v":
        result.version = true;
        break;
      case "--help":
      case "-h":
        result.help = true;
        break;
      case "--no-update":
        result.noUpdate = true;
        break;
      default:
        if (arg.startsWith("-")) {
          result.unknownArgs.push(arg);
        }
        break;
    }
  }

  return result;
}

function showVersion() {
  console.log(`talos v${VERSION}`);
}

function showHelp() {
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
}

async function main() {
  const args = process.argv.slice(2);
  const { version, help, noUpdate, unknownArgs } = parseArgs(args);

  // Handle unknown arguments
  if (unknownArgs.length > 0) {
    console.error(`Error: Unknown option(s): ${unknownArgs.join(", ")}`);
    console.error(`Run 'talos --help' for usage information.`);
    process.exit(1);
  }

  // Handle version flag
  if (version) {
    showVersion();
    process.exit(0);
  }

  // Handle help flag
  if (help) {
    showHelp();
    process.exit(0);
  }

  // Check for updates before starting (unless skipped)
  if (!noUpdate) {
    const updateApplied = await checkAndUpdate();
    if (updateApplied) {
      // Exit this process - the new version will take over
      process.exit(0);
    }
  }

  // Import and start the Ink app
  // Dynamic import to avoid loading React/Ink for --version/--help
  const { startApp } = await import("./cli.js");
  
  try {
    const instance = startApp();
    await instance.waitUntilExit();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
