import { spawn } from "child_process";
import { access, chmod, mkdir, rename, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { VERSION as CURRENT_VERSION } from "./version.js";

const REPO = "Only0neHpLeft/talos";

// Get config directory for talos
function getConfigDir(): string {
  return join(homedir(), ".config", "talos");
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

// Check if we have a pending update downloaded
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

// Install pending update if exists
async function installPendingUpdate(execPath: string): Promise<boolean> {
  const pendingVersion = await getPendingVersion();
  if (!pendingVersion) return false;

  // Check if pending version is actually newer
  if (compareVersions(pendingVersion, CURRENT_VERSION) <= 0) {
    await clearPendingVersion();
    // Also clean up the file if it exists
    const downloadPath = join(getConfigDir(), `talos-${pendingVersion}.new`);
    try {
      await Bun.file(downloadPath).delete();
    } catch {
      // ignore
    }
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
    
    // Relaunch - don't inherit stdio to avoid input conflicts
    const child = spawn(execPath, process.argv.slice(1), {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    
    // Exit immediately so the new process can take over
    process.exit(0);
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
        stdio: "ignore",
      });
      child.unref();
      
      // Exit immediately
      process.exit(0);
    } catch {
      return false;
    }
  }
}

// Spawn a detached background download process
function spawnBackgroundDownload(version: string, url: string, downloadPath: string): void {
  const configDir = getConfigDir();
  
  // Create a simple script that downloads the file
  const script = `
    const { spawn } = require('child_process');
    const { writeFileSync } = require('fs');
    
    const version = "${version}";
    const url = "${url}";
    const downloadPath = "${downloadPath}";
    const pendingFile = "${join(configDir, "pending-version")}";
    
    console.log("📥 Downloading v" + version + " in background...");
    
    const curl = spawn("curl", ["-fsSL", "-o", downloadPath, url], {
      stdio: "ignore",
      detached: true,
    });
    
    curl.on("close", (code) => {
      if (code === 0) {
        require('fs').chmodSync(downloadPath, 0o755);
        writeFileSync(pendingFile, version);
        console.log("📦 Update v" + version + " ready. Install on next startup.");
      } else {
        console.error("❌ Background download failed");
      }
    });
  `;
  
  // Spawn node process to run the download script detached
  const child = spawn(process.execPath, ["-e", script], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

// Check for updates and handle them
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
    const downloadPath = join(getConfigDir(), `talos-${existingPending}.new`);
    if (await fileExists(downloadPath)) {
      console.log(`📦 Update v${existingPending} ready. Install on next startup.`);
      return false;
    }
    // File doesn't exist, clear the pending
    await clearPendingVersion();
  }

  // Check for new updates online (non-blocking)
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      { headers: { "User-Agent": "talos", Accept: "application/vnd.github+json" } }
    );

    if (!response.ok) return false;

    const release = await response.json();
    const latestVersion = release.tag_name;

    if (compareVersions(latestVersion, CURRENT_VERSION) <= 0) {
      return false;
    }

    console.log(`⬆️  Update available: ${CURRENT_VERSION} → ${latestVersion}`);

    const asset = release.assets.find((a: { name: string }) => a.name === binaryName);
    if (!asset) {
      console.error("❌ Could not find update for your platform");
      return false;
    }

    // Check if already downloading or downloaded
    const versionClean = latestVersion.replace(/^v/, "");
    const downloadPath = join(getConfigDir(), `talos-${versionClean}.new`);
    
    if (await fileExists(downloadPath)) {
      console.log(`📦 Update v${versionClean} ready. Install on next startup.`);
      return false;
    }

    // Start background download and return immediately
    console.log(`📥 Downloading v${versionClean} in background...`);
    spawnBackgroundDownload(versionClean, asset.browser_download_url, downloadPath);
    console.log(`   App will continue while download completes.`);
    
    return false; // Don't exit, continue with current version
  } catch (err) {
    return false;
  }
}
