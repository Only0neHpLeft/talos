import * as https from "https";
import { IncomingMessage } from "http";

const REPO = "Only0neHpLeft/talos";
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface ReleaseInfo {
  tag_name: string;
}

interface VersionCheckResult {
  version: string | null;
  error: "none" | "rate_limited" | "network" | "timeout";
}

// Simple in-memory cache
let cachedResult: VersionCheckResult | null = null;
let cachedAt: number = 0;

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "talos-cli",
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
      (res: IncomingMessage) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          if (location) {
            fetchJson<T>(location).then(resolve).catch(reject);
            return;
          }
        }

        // Check for rate limiting
        if (res.statusCode === 403) {
          reject(new Error("RATE_LIMITED"));
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk.toString()));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("TIMEOUT"));
    });
  });
}

/**
 * Fetch the latest version from GitHub releases
 * Uses caching to avoid hitting rate limits
 */
export async function fetchLatestVersion(
  forceRefresh = false
): Promise<VersionCheckResult> {
  const now = Date.now();

  // Return cached result if still valid
  if (
    !forceRefresh &&
    cachedResult &&
    now - cachedAt < CACHE_DURATION_MS
  ) {
    return cachedResult;
  }

  try {
    const release = await fetchJson<ReleaseInfo>(
      `https://api.github.com/repos/${REPO}/releases/latest`
    );

    const result: VersionCheckResult = {
      version: release.tag_name,
      error: "none",
    };

    // Cache the successful result
    cachedResult = result;
    cachedAt = now;

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    let result: VersionCheckResult;

    if (errorMessage.includes("RATE_LIMITED")) {
      result = { version: null, error: "rate_limited" };
    } else if (errorMessage.includes("TIMEOUT")) {
      result = { version: null, error: "timeout" };
    } else {
      result = { version: null, error: "network" };
    }

    // Don't cache errors - allow retry
    return result;
  }
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
 * Get human-readable error message
 */
export function getVersionErrorMessage(error: VersionCheckResult["error"]): string {
  switch (error) {
    case "rate_limited":
      return "GitHub API rate limit exceeded (try again later)";
    case "timeout":
      return "Request timed out";
    case "network":
      return "Network error";
    default:
      return "Unknown error";
  }
}
