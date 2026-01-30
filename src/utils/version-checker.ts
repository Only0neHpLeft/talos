import * as https from "https";
import { IncomingMessage } from "http";

const REPO = "Only0neHpLeft/talos";
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface VersionCheckResult {
  version: string | null;
  error: "none" | "network" | "timeout";
}

// Simple in-memory cache
let cachedResult: VersionCheckResult | null = null;
let cachedAt: number = 0;

/**
 * Fetch latest version from GitHub releases page redirect
 * 100% reliable, no rate limits
 */
function fetchLatestVersionFromRedirect(): Promise<string | null> {
  return new Promise((resolve) => {
    const req = https.get(
      `https://github.com/${REPO}/releases/latest`,
      { headers: { "User-Agent": "talos-cli" }, method: "HEAD" },
      (res: IncomingMessage) => {
        // GitHub redirects /latest to /tag/vX.Y.Z
        if (res.statusCode === 302 || res.statusCode === 301) {
          const location = res.headers.location;
          if (location) {
            const match = location.match(/\/tag\/(v[\d.]+)$/);
            if (match) {
              resolve(match[1]);
              return;
            }
          }
        }
        resolve(null);
      }
    );

    req.on("error", () => resolve(null));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * Fetch the latest version from GitHub releases
 * Uses caching to avoid unnecessary requests
 */
export async function fetchLatestVersion(
  forceRefresh = false
): Promise<VersionCheckResult> {
  const now = Date.now();

  // Return cached result if still valid
  if (!forceRefresh && cachedResult && now - cachedAt < CACHE_DURATION_MS) {
    return cachedResult;
  }

  const version = await fetchLatestVersionFromRedirect();

  if (version) {
    const result: VersionCheckResult = { version, error: "none" };
    cachedResult = result;
    cachedAt = now;
    return result;
  }

  return { version: null, error: "network" };
}

/**
 * Clear the version cache
 */
export function clearVersionCache(): void {
  cachedResult = null;
  cachedAt = 0;
}

/**
 * Check if version check is cached
 */
export function isVersionCached(): boolean {
  const now = Date.now();
  return cachedResult !== null && now - cachedAt < CACHE_DURATION_MS;
}

/**
 * Get cached version if available
 */
export function getCachedVersion(): string | null {
  const now = Date.now();
  if (cachedResult && now - cachedAt < CACHE_DURATION_MS) {
    return cachedResult.version;
  }
  return null;
}

/**
 * Get human-readable error message
 */
export function getVersionErrorMessage(
  error: VersionCheckResult["error"]
): string {
  switch (error) {
    case "timeout":
      return "Request timed out";
    case "network":
      return "Network error";
    default:
      return "Unknown error";
  }
}
