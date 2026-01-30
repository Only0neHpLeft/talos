import { spawn } from "child_process";
import { createWriteStream } from "fs";
import { access, chmod, mkdir, rename, writeFile } from "fs/promises";
import * as https from "https";
import { homedir } from "os";
import { join } from "path";
import { VERSION as CURRENT_VERSION } from "./version.js";

const REPO = "Only0neHpLeft/talos";

interface ReleaseInfo {
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

// Get config directory for talos
function getConfigDir(): string {
  return join(homedir(), ".config", "talos");
}

// Get the path to store version info
function getVersionFilePath(): string {
  return join(getConfigDir(), "current-version");
}

async function ensureConfigDir(): Promise<void> {
  try {
    await mkdir(getConfigDir(), { recursive: true });
  } catch {
    // ignore
  }
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
  const execPath = process.argv[0];
  
  if (execPath.endsWith("talos") || execPath.includes("talos-darwin") || execPath.includes("/talos")) {
    return execPath;
  }
  
  if (process.execPath && (process.execPath.endsWith("talos") || process.execPath.includes("talos-darwin"))) {
    return process.execPath;
  }
  
  return null;
}

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": "talos-updater", Accept: "application/vnd.github+json" } },
      (res) => {
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

// Check if we've already downloaded this version (for next-startup install)
async function getPendingVersion(): Promise<string | null> {
  const pendingFile = join(getConfigDir(), "pending-version");
  try {
    const content = await Bun.file(pendingFile).text();
    return content.trim() || null;
  } catch {
    return null;
  }
}

async function setPendingVersion(version: string): Promise<void> {
  await ensureConfigDir();
  await writeFile(join(getConfigDir(), "pending-version"), version);
}

async function clearPendingVersion(): Promise<void> {
  try {
    await Bun.file(join(getConfigDir(), "pending-version")).delete();
  } catch {
    // ignore
  }
}

// Download update in background (doesn't install yet)
async function downloadUpdateInBackground(latestVersion: string, assetUrl: string): Promise<void> {
  await ensureConfigDir();
  // Version without 'v' prefix for filename
  const versionClean = latestVersion.replace(/^v/, "");
  const downloadPath = join(getConfigDir(), `talos-${versionClean}.new`);
  
  // Skip if already downloaded
  if (await fileExists(downloadPath)) {
    console.log(`📦 Update v${versionClean} already downloaded. Will install on next startup.`);
    return;
  }
  
  try {
    await downloadFile(assetUrl, downloadPath);
    await chmod(downloadPath, 0o755);
    await setPendingVersion(versionClean);
    console.log(`📦 Update v${versionClean} downloaded. Will install on next startup.`);
  } catch (err) {
    console.error("Failed to download update:", (err as Error).message);
  }
}

// Install pending update if exists
async function installPendingUpdate(execPath: string): Promise<boolean> {
  const pendingVersion = await getPendingVersion();
  if (!pendingVersion) return false;

  // Check if pending version is actually newer
  if (compareVersions(pendingVersion, CURRENT_VERSION) <= 0) {
    await clearPendingVersion();
    return false;
  }

  const downloadPath = join(getConfigDir(), `talos-${pendingVersion}.new`);
  if (!(await fileExists(downloadPath))) {
    await clearPendingVersion();
    return false;
  }

  console.log(`📦 Installing update v${pendingVersion}...`);

  try {
    await rename(downloadPath, execPath);
    await clearPendingVersion();
    console.log(`✅ Updated to v${pendingVersion}! Restarting...\n`);
    
    // Relaunch
    const child = spawn(execPath, process.argv.slice(1), {
      detached: true,
      stdio: "inherit",
    });
    child.unref();
    return true;
  } catch (err) {
    // Try with sudo
    console.log("");
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│  🔑  Administrator password needed to install update    │");
    console.log("└─────────────────────────────────────────────────────────┘");
    console.log("");

    const sudoMv = spawn("sudo", ["mv", downloadPath, execPath], {
      stdio: "inherit",
    });

    try {
      await new Promise<void>((resolve, reject) => {
        sudoMv.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error("sudo mv failed"));
        });
      });
      
      await clearPendingVersion();
      spawn("sudo", ["chmod", "+x", execPath]).unref();
      
      console.log(`✅ Updated to v${pendingVersion}! Restarting...\n`);
      const child = spawn(execPath, process.argv.slice(1), {
        detached: true,
        stdio: "inherit",
      });
      child.unref();
      return true;
    } catch {
      return false;
    }
  }
}

export async function checkAndUpdate(): Promise<boolean> {
  const execPath = getExecPath();
  if (!execPath) {
    return false;
  }

  const binaryName = getBinaryName();
  if (!binaryName) {
    return false;
  }

  // First, check if there's a pending update to install
  const pendingInstalled = await installPendingUpdate(execPath);
  if (pendingInstalled) {
    return true;
  }

  // Check if we already have a pending update downloaded
  const existingPending = await getPendingVersion();
  if (existingPending && compareVersions(existingPending, CURRENT_VERSION) > 0) {
    console.log(`📦 Update v${existingPending} ready. Install on next startup.`);
    return false;
  }

  // Then check for new updates online
  console.log("🔍 Checking for updates...");

  try {
    const release = await fetchJson<ReleaseInfo>(
      `https://api.github.com/repos/${REPO}/releases/latest`
    );

    const latestVersion = release.tag_name;

    if (compareVersions(latestVersion, CURRENT_VERSION) <= 0) {
      return false;
    }

    console.log(`⬆️  Update available: ${CURRENT_VERSION} → ${latestVersion}`);

    const asset = release.assets.find((a) => a.name === binaryName);
    if (!asset) {
      console.error("❌ Could not find update for your platform");
      return false;
    }

    // Download in background for next startup
    await downloadUpdateInBackground(latestVersion, asset.browser_download_url);
    
    return false; // Don't exit, continue with current version
  } catch (err) {
    return false;
  }
}
