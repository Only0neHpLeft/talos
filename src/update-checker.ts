import { spawn, execSync } from "child_process";
import { access, rename, chmod, mkdir } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { VERSION as CURRENT_VERSION } from "./version.js";

const REPO = "Only0neHpLeft/talos";

// Get the binary name based on platform and arch
function getBinaryName(): string | null {
  const arch = process.arch;
  const platform = process.platform;

  if (platform !== "darwin") return null;

  if (arch === "arm64") return "talos-darwin-arm64";
  if (arch === "x64") return "talos-darwin-x64";

  return null;
}

// Get the path to the current executable
function getExecPath(): string | null {
  const execPath = process.argv[0];

  if (
    execPath.endsWith("talos") ||
    execPath.includes("talos-darwin") ||
    execPath.includes("/talos")
  ) {
    return execPath;
  }

  if (
    process.execPath &&
    (process.execPath.endsWith("talos") ||
      process.execPath.includes("talos-darwin"))
  ) {
    return process.execPath;
  }

  return null;
}

// Compare two versions (handles v prefix)
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

// Check if a file exists
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Get temp directory
function getTempDir(): string {
  return join(homedir(), ".config", "talos");
}

async function ensureTempDir(): Promise<void> {
  try {
    await mkdir(getTempDir(), { recursive: true });
  } catch {
    // ignore
  }
}

// Fetch latest version from GitHub redirect (100% reliable, no rate limits)
async function fetchLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const https = require("https");
    
    const req = https.get(
      `https://github.com/${REPO}/releases/latest`,
      { method: "HEAD" },
      (res: any) => {
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

// Download file using curl
async function downloadWithCurl(url: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const curl = spawn("curl", ["-fsSL", "-o", outputPath, url], {
      stdio: "inherit",
    });

    curl.on("close", (code) => {
      resolve(code === 0);
    });

    curl.on("error", () => {
      resolve(false);
    });
  });
}

// Main update check and install function
export async function checkAndUpdate(): Promise<boolean> {
  const execPath = getExecPath();
  if (!execPath) {
    return false;
  }

  const binaryName = getBinaryName();
  if (!binaryName) {
    return false;
  }

  console.log("🔍 Checking for updates...");

  // Get latest version
  const latestVersion = await fetchLatestVersion();
  if (!latestVersion) {
    console.log("⚠️  Could not check for updates");
    return false;
  }

  // Check if update is needed
  if (compareVersions(latestVersion, CURRENT_VERSION) <= 0) {
    console.log(`✅ Already on latest version (${CURRENT_VERSION})`);
    return false;
  }

  console.log(`⬆️  Update available: ${CURRENT_VERSION} → ${latestVersion}`);
  console.log("");

  // Construct download URL
  const downloadUrl = `https://github.com/${REPO}/releases/download/${latestVersion}/${binaryName}`;
  
  await ensureTempDir();
  const tempPath = join(getTempDir(), `talos-update-${Date.now()}.new`);

  console.log(`📥 Downloading ${binaryName}...`);
  
  // Download the new version
  const downloaded = await downloadWithCurl(downloadUrl, tempPath);
  if (!downloaded) {
    console.error("❌ Download failed");
    // Clean up temp file
    try {
      await Bun.file(tempPath).delete();
    } catch {}
    return false;
  }

  console.log("📦 Download complete!");
  console.log("");

  // Make it executable
  await chmod(tempPath, 0o755);

  // Install the update
  console.log("🔄 Installing update...");
  
  try {
    // Try direct replacement
    await rename(tempPath, execPath);
    console.log("✅ Update installed!");
  } catch (err) {
    // Need sudo - try with password prompt
    console.log("");
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│  🔑  Administrator password needed to install update    │");
    console.log("└─────────────────────────────────────────────────────────┘");
    console.log("");

    try {
      // Use sudo to move the file
      execSync(`sudo mv "${tempPath}" "${execPath}"`, { stdio: "inherit" });
      execSync(`sudo chmod +x "${execPath}"`, { stdio: "ignore" });
      console.log("✅ Update installed!");
    } catch {
      console.error("❌ Installation failed");
      // Clean up
      try {
        await Bun.file(tempPath).delete();
      } catch {}
      return false;
    }
  }

  console.log("");
  console.log(`🚀 Starting talos ${latestVersion}...`);
  console.log("");

  // Relaunch the app
  const child = spawn(execPath, process.argv.slice(1), {
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  // Exit this process so the new version takes over
  process.exit(0);
}
