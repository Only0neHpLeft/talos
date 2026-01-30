import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function getGitBranch(): Promise<string> {
  try {
    const { stdout } = await execAsync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
    });
    return stdout.trim();
  } catch (err) {
    console.debug("Failed to get git branch:", err);
    return "";
  }
}

export async function getGitRoot(): Promise<string> {
  try {
    const { stdout } = await execAsync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
    });
    return stdout.trim();
  } catch (err) {
    console.debug("Failed to get git root:", err);
    return "";
  }
}
