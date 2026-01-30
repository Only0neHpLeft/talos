import * as https from "https";
import { IncomingMessage } from "http";

const REPO = "Only0neHpLeft/talos";
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface ChangelogInfo {
  version: string;
  commitMessage: string;
  author: string;
  date: string;
}

interface ChangelogResult {
  changelog: ChangelogInfo | null;
  error: "none" | "network" | "timeout" | "parse";
}

// Simple in-memory cache
let cachedResult: ChangelogResult | null = null;
let cachedAt: number = 0;

/**
 * Fetch tag info from GitHub API to get commit message
 */
function fetchTagInfo(version: string): Promise<ChangelogInfo | null> {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, 10000);

    const req = https.get(
      `https://api.github.com/repos/${REPO}/git/refs/tags/v${version}`,
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
            const objectUrl = json.object?.url;
            
            if (!objectUrl) {
              resolve(null);
              return;
            }

            // Fetch the commit/tag object to get message
            fetchCommitMessage(objectUrl, version).then(resolve);
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
 * Fetch commit message from commit URL
 */
function fetchCommitMessage(url: string, tagVersion: string): Promise<ChangelogInfo | null> {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, 10000);

    const req = https.get(
      url,
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
            
            // Extract version from tag (if this is an annotated tag)
            const version = json.tag || tagVersion;
            const message = json.message || "";
            const author = json.tagger?.name || json.committer?.name || "Unknown";
            const date = json.tagger?.date || json.committer?.date || "";
            
            // If it's a lightweight tag, we need to fetch the commit
            if (!message && json.sha) {
              // This is a commit object, message is in the commit
              const commitMessage = json.message || "";
              const commitAuthor = json.committer?.name || json.author?.name || "Unknown";
              const commitDate = json.committer?.date || json.author?.date || "";
              
              resolve({
                version: version.replace(/^v/, ""),
                commitMessage: commitMessage.trim(),
                author: commitAuthor,
                date: commitDate,
              });
              return;
            }

            resolve({
              version: version.replace(/^v/, ""),
              commitMessage: message.trim(),
              author: author,
              date: date,
            });
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
 * Fetch the changelog (commit message) for current version
 * Uses caching to avoid unnecessary requests
 */
export async function fetchChangelog(
  version: string,
  forceRefresh = false
): Promise<ChangelogResult> {
  const now = Date.now();

  // Return cached result if still valid and for same version
  if (!forceRefresh && cachedResult && cachedResult.changelog?.version === version && now - cachedAt < CACHE_DURATION_MS) {
    return cachedResult;
  }

  const changelog = await fetchTagInfo(version);

  if (changelog) {
    const result: ChangelogResult = { changelog, error: "none" };
    cachedResult = result;
    cachedAt = now;
    return result;
  }

  return { changelog: null, error: "network" };
}

/**
 * Clear the changelog cache
 */
export function clearChangelogCache(): void {
  cachedResult = null;
  cachedAt = 0;
}

/**
 * Format commit message for display
 * Converts to simple text format
 */
export function formatCommitMessage(message: string): string[] {
  if (!message) return ["No changelog available."];

  return message
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
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
      return "Failed to parse changelog data";
    default:
      return "Unknown error";
  }
}
