/**
 * Check if running in development mode
 * Dev mode: bun run dev, tsx, or node
 * Prod mode: compiled binary
 */
export function isDevMode(): boolean {
  // Check if running via tsx or from source
  const execPath = process.argv[0];
  const mainScript = process.argv[1] || "";
  
  // Running via tsx, node, or bun directly
  if (
    execPath.includes("tsx") ||
    execPath.includes("node") ||
    execPath.includes("bun") ||
    mainScript.includes(".tsx") ||
    mainScript.includes(".ts")
  ) {
    return true;
  }
  
  // Check if we have source maps or dev indicators
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  
  // Compiled binary mode
  return false;
}

/**
 * Check if running in production mode (compiled binary)
 */
export function isProdMode(): boolean {
  return !isDevMode();
}
