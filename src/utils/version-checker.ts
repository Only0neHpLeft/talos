import * as https from "https";
import { IncomingMessage } from "http";

const REPO = "Only0neHpLeft/talos";
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface ReleaseInfo {
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

interface VersionCheckResult {
  version: string | null;
  error: "none" | "rate_limited" | "network" | "timeout";
}

// Simple in-memory cache
let cachedResult: VersionCheckResult | null = null;
let cachedAt: number = 0;

/**
 * Alternative method: Get latest version from GitHub releases page redirect
 * This bypasses the API rate limit by using the /latest redirect
 */
function fetchLatestVersionFromRedirect(): Promise<string | null> {
  return new Promise((resolve) => {
    const req = https.get(
      `https://github.com/${REPO}/releases/latest`,
      {
        headers: {
          "User-Agent": "talos-cli",
        },
        method: "HEAD",
      },
      (res: IncomingMessage) => {
        // GitHub redirects /latest to /tag/vX.Y.Z
        if (res.statusCode === 302 || res.statusCode === 301) {
          const location = res.headers.location;
          if (location) {
            // Extract version from URL like /Only0neHpLeft/talos/releases/tag/v0.0.17
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
 * Primary method: Get full release info from GitHub API
 */
function fetchReleaseInfoFromApi(): Promise<ReleaseInfo | null> {
  return new Promise((resolve) => {
    const req = https.get(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: {
          "User-Agent": "talos-cli",
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
      (res: IncomingMessage) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          if (location) {
            https
              .get(
                location,
                {
                  headers: {
                    "User-Agent": "talos-cli",
                    Accept: "application/vnd.github+json",
                  },
                },
                (redirectRes) => {
                  handleApiResponse(redirectRes, resolve);
                }
              )
              .on("error", () => resolve(null));
            return;
          }
        }
        handleApiResponse(res, resolve);
      }
    );

    req.on("error", () => resolve(null));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

function handleApiResponse(
  res: IncomingMessage,
  resolve: (value: ReleaseInfo | null) => void
): void {
  if (res.statusCode === 403) {
    // Rate limited
    resolve(null);
    return;
  }
  if (res.statusCode !== 200) {
    resolve(null);
    return;
  }

  let data = "";
  res.on("data", (chunk: Buffer) => (data += chunk.toString()));
  res.on("end", () => {
    try {
      resolve(JSON.parse(data) as ReleaseInfo);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Fetch the latest version from GitHub releases
 * Uses caching to avoid hitting rate limits
 * Falls back to redirect method if API is rate limited
 */
export async function fetchLatestVersion(
  forceRefresh = false
): Promise<VersionCheckResult> {
  const now = Date.now();

  // Return cached result if still valid
  if (!forceRefresh && cachedResult && now - cachedAt < CACHE_DURATION_MS) {
    return cachedResult;
  }

  // Try API first (gets full release info)
  const releaseInfo = await fetchReleaseInfoFromApi();

  if (releaseInfo) {
    const result: VersionCheckResult = {
      version: releaseInfo.tag_name,
      error: "none",
    };
    cachedResult = result;
    cachedAt = now;
    return result;
  }

  // API failed (rate limited or error), try redirect method
  const versionFromRedirect = await fetchLatestVersionFromRedirect();

  if (versionFromRedirect) {
    const result: VersionCheckResult = {
      version: versionFromRedirect,
      error: "none",
    };
    cachedResult = result;
    cachedAt = now;
    return result;
  }

  // Both methods failed
  return { version: null, error: "rate_limited" };
}

/**
 * Fetch full release info including download URLs
 * This uses the API but if rate limited, constructs URLs manually
 */
export async function fetchReleaseInfo(): Promise<ReleaseInfo | null> {
  // Try API first
  const apiResult = await fetchReleaseInfoFromApi();
  if (apiResult) {
    return apiResult;
  }

  // API rate limited - try to get version from redirect and construct URLs
  const version = await fetchLatestVersionFromRedirect();
  if (!version) {
    return null;
  }

  // Construct download URLs manually (GitHub follows a predictable pattern)
  return {
    tag_name: version,
    assets: [
      {
        name: "talos-darwin-arm64",
        browser_download_url: `https://github.com/${REPO}/releases/download/${version}/talos-darwin-arm64`,
      },
      {
        name: "talos-darwin-x64",
        browser_download_url: `https://github.com/${REPO}/releases/download/${version}/talos-darwin-x64`,
      },
    ],
  };
}

/**
 * Get the download URL for a specific binary and version
 * This doesn't require API access - constructs URL directly
 */
export function getDownloadUrl(version: string, binaryName: string): string {
  return `https://github.com/${REPO}/releases/download/${version}/${binaryName}`;
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
