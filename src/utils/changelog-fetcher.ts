import * as https from "https";
import { IncomingMessage } from "http";

const REPO = "Only0neHpLeft/talos";
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface ReleaseInfo {
  version: string;
  name: string;
  body: string;
  publishedAt: string;
  htmlUrl: string;
}

interface ChangelogResult {
  release: ReleaseInfo | null;
  error: "none" | "network" | "timeout" | "parse";
}

// Simple in-memory cache
let cachedResult: ChangelogResult | null = null;
let cachedAt: number = 0;

/**
 * Fetch latest release info from GitHub API
 */
function fetchLatestReleaseFromAPI(): Promise<ReleaseInfo | null> {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, 10000);

    const req = https.get(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: {
          "User-Agent": "talos-cli",
          Accept: "application/vnd.github.v3+json",
        },
        signal: controller.signal as any,
      },
      (res: IncomingMessage) => {
        clearTimeout(timeout);

        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }

        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const release: ReleaseInfo = {
              version: json.tag_name?.replace(/^v/, "") || "",
              name: json.name || "",
              body: json.body || "",
              publishedAt: json.published_at || "",
              htmlUrl: json.html_url || "",
            };
            resolve(release);
          } catch {
            resolve(null);
          }
        });
      }
    );

    req.on("error", () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

/**
 * Fetch the latest changelog from GitHub releases
 * Uses caching to avoid unnecessary requests
 */
export async function fetchLatestChangelog(
  forceRefresh = false
): Promise<ChangelogResult> {
  const now = Date.now();

  // Return cached result if still valid
  if (!forceRefresh && cachedResult && now - cachedAt < CACHE_DURATION_MS) {
    return cachedResult;
  }

  const release = await fetchLatestReleaseFromAPI();

  if (release) {
    const result: ChangelogResult = { release, error: "none" };
    cachedResult = result;
    cachedAt = now;
    return result;
  }

  return { release: null, error: "network" };
}

/**
 * Clear the changelog cache
 */
export function clearChangelogCache(): void {
  cachedResult = null;
  cachedAt = 0;
}

/**
 * Format release body for display
 * Converts markdown to simple text format
 */
export function formatReleaseBody(body: string): string[] {
  if (!body) return ["No release notes available."];

  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      // Convert markdown headers to plain text
      if (line.startsWith("### ")) {
        return line.replace(/^### /, "");
      }
      if (line.startsWith("## ")) {
        return line.replace(/^## /, "");
      }
      // Convert markdown list items
      if (line.startsWith("- ")) {
        return "  " + line.replace(/^- /, "• ");
      }
      if (line.match(/^\d+\. /)) {
        return "  " + line.replace(/^\d+\. /, "• ");
      }
      // Remove markdown links, keep text
      line = line.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      // Remove other markdown
      line = line.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "");
      return line;
    })
    .filter((line) => line.length > 0);
}

/**
 * Format date for display
 */
export function formatReleaseDate(dateString: string): string {
  if (!dateString) return "Unknown date";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Get human-readable error message
 */
export function getChangelogErrorMessage(
  error: ChangelogResult["error"]
): string {
  switch (error) {
    case "timeout":
      return "Request timed out";
    case "network":
      return "Network error - check your connection";
    case "parse":
      return "Failed to parse release data";
    default:
      return "Unknown error";
  }
}
