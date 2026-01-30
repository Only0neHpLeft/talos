import { spawn } from "child_process";
import { createWriteStream } from "fs";
import { access, chmod, rename, stat, writeFile } from "fs/promises";
import * as https from "https";
import { tmpdir } from "os";
import { join } from "path";
import { VERSION as CURRENT_VERSION } from "./version.js";
const REPO = "Only0neHpLeft/talos";
const UPDATE_CHECK_INTERVAL_HOURS = 1;

interface ReleaseInfo {
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function getBinaryName(): string | null {
  const arch = process.arch;
  const platform = process.platform;

  if (platform !== "darwin") return null;

  if (arch === "arm64") return "talos-darwin-arm64";
  if (arch === "x64") return "talos-darwin-x64";

  return null;
}

function getExecPath(): string | null {
  // Get the path to the current executable
  if (process.argv[0].endsWith("talos") || process.argv[0].includes("talos-darwin")) {
    return process.argv[0];
  }
  return null;
}

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": "talos-updater", Accept: "application/vnd.github+json" } },
      (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          if (location) {
            fetchJson<T>(location).then(resolve).catch(reject);
            return;
          }
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const req = https.get(
      url,
      { headers: { "User-Agent": "talos-updater" } },
      (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          if (location) {
            file.close();
            downloadFile(location, dest).then(resolve).catch(reject);
            return;
          }
        }

        if (res.statusCode !== 200) {
          file.close();
          reject(new Error(`Download failed: ${res.statusCode}`));
          return;
        }

        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      }
    );
    req.on("error", (err) => {
      file.close();
      reject(err);
    });
    req.setTimeout(60000, () => {
      req.destroy();
      file.close();
      reject(new Error("Download timeout"));
    });
  });
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.replace(/^v/, "").split(".").map(Number);
  const parts2 = v2.replace(/^v/, "").split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

async function shouldCheckUpdate(): Promise<boolean> {
  const lastCheckFile = join(tmpdir(), ".talos-last-update-check");

  try {
    const stats = await stat(lastCheckFile);
    const hoursSinceLastCheck = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    return hoursSinceLastCheck >= UPDATE_CHECK_INTERVAL_HOURS;
  } catch {
    return true;
  }
}

async function markUpdateChecked(): Promise<void> {
  const lastCheckFile = join(tmpdir(), ".talos-last-update-check");
  await writeFile(lastCheckFile, "");
}

export async function checkAndUpdate(): Promise<boolean> {
  // Only check if we're running as a compiled binary
  const execPath = getExecPath();
  if (!execPath) {
    // Running via bun/tsx, skip update check
    return false;
  }

  // Check if we should check for updates (throttle)
  if (!(await shouldCheckUpdate())) {
    return false;
  }

  const binaryName = getBinaryName();
  if (!binaryName) {
    console.error("Unsupported platform/architecture for auto-update");
    return false;
  }

  console.log("🔍 Checking for updates...");

  try {
    // Fetch latest release
    const release = await fetchJson<ReleaseInfo>(
      `https://api.github.com/repos/${REPO}/releases/latest`
    );

    const latestVersion = release.tag_name;

    if (compareVersions(latestVersion, CURRENT_VERSION) <= 0) {
      await markUpdateChecked();
      return false; // No update needed
    }

    console.log(`⬆️  Update available: ${CURRENT_VERSION} → ${latestVersion}`);

    // Find the correct asset
    const asset = release.assets.find((a) => a.name === binaryName);
    if (!asset) {
      console.error("❌ Could not find update for your platform");
      return false;
    }

    // Download to temp location
    const tmpDir = tmpdir();
    const tmpPath = join(tmpDir, binaryName + ".new");
    const backupPath = join(tmpDir, binaryName + ".backup");

    console.log("📥 Downloading update...");
    await downloadFile(asset.browser_download_url, tmpPath);
    await chmod(tmpPath, 0o755);

    // Verify the download worked
    if (!(await fileExists(tmpPath))) {
      throw new Error("Downloaded file not found");
    }

    // Backup current binary
    try {
      await rename(execPath, backupPath);
    } catch {
      // Might not have permission to rename, try direct replace
    }

    // Replace binary
    console.log("📦 Installing update...");
    try {
      await rename(tmpPath, execPath);
    } catch (err) {
      // Try with sudo if permission denied
      console.log("🔑 Administrator permission needed for update...");

      // Restore backup if exists
      if (await fileExists(backupPath)) {
        try {
          await rename(backupPath, execPath);
        } catch {
          // ignore
        }
      }

      // Use sudo for the move
      const sudoMv = spawn("sudo", ["mv", tmpPath, execPath], {
        stdio: "inherit",
      });

      await new Promise<void>((resolve, reject) => {
        sudoMv.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error("sudo mv failed"));
        });
      });

      // Set permissions
      spawn("sudo", ["chmod", "+x", execPath]).unref();
    }

    // Clean up backup
    try {
      if (await fileExists(backupPath)) {
        await Bun.file(backupPath).delete();
      }
    } catch {
      // ignore cleanup errors
    }

    console.log(`✅ Updated to ${latestVersion}! Restarting...\n`);
    await markUpdateChecked();

    // Relaunch with the new binary
    const child = spawn(execPath, process.argv.slice(1), {
      detached: true,
      stdio: "inherit",
    });
    child.unref();

    return true; // Update applied, exit current process
  } catch (err) {
    console.error("⚠️  Update check failed:", (err as Error).message);
    await markUpdateChecked(); // Don't check again immediately
    return false;
  }
}
