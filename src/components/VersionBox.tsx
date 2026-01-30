import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import * as https from "https";
import { IncomingMessage } from "http";
import { useUIStore } from "../store/ui-store.js";
import theme from "../theme/theme.js";
import MinimalBox from "./MinimalBox.js";
import { VERSION } from "../version.js";

interface ReleaseInfo {
  tag_name: string;
}

function fetchLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const req = https.get(
      "https://api.github.com/repos/Only0neHpLeft/talos/releases/latest",
      { headers: { "User-Agent": "talos", Accept: "application/vnd.github+json" } },
      (res: IncomingMessage) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          if (location) {
            https.get(location, { headers: { "User-Agent": "talos" } }, (redirectRes) => {
              handleResponse(redirectRes, resolve);
            }).on("error", () => resolve(null));
            return;
          }
        }
        handleResponse(res, resolve);
      }
    );
    req.on("error", () => resolve(null));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

function handleResponse(res: IncomingMessage, resolve: (value: string | null) => void): void {
  if (res.statusCode !== 200) {
    resolve(null);
    return;
  }

  let data = "";
  res.on("data", (chunk: Buffer) => (data += chunk.toString()));
  res.on("end", () => {
    try {
      const json = JSON.parse(data) as ReleaseInfo;
      resolve(json.tag_name);
    } catch {
      resolve(null);
    }
  });
}

export default function VersionBox() {
  const { versionBoxVisible, hideVersionBox } = useUIStore();
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (versionBoxVisible) {
      setIsChecking(true);
      fetchLatestVersion().then((version) => {
        setLatestVersion(version);
        setIsChecking(false);
      });
    }
  }, [versionBoxVisible]);

  useInput((input, key) => {
    if (!versionBoxVisible) return;
    if (key.escape || key.return || input === "q") {
      hideVersionBox();
    }
  });

  if (!versionBoxVisible) return null;

  const isLatest = latestVersion && VERSION === latestVersion.replace(/^v/, "");

  return (
    <MinimalBox>
      {/* Current version */}
      <Box gap={1}>
        <Text color={theme.colors.dimText}>Current:</Text>
        <Text color={theme.colors.text} bold>
          v{VERSION}
        </Text>
      </Box>

      {/* Latest version */}
      <Box gap={1}>
        <Text color={theme.colors.dimText}>Latest:</Text>
        {isChecking ? (
          <Text color={theme.colors.muted}>checking...</Text>
        ) : latestVersion ? (
          <Text color={theme.colors.text} bold>
            {latestVersion}
          </Text>
        ) : (
          <Text color={theme.colors.muted}>unavailable</Text>
        )}
      </Box>

      {/* Status */}
      {latestVersion && (
        <Box gap={1}>
          <Text color={theme.colors.dimText}>Status:</Text>
          {isLatest ? (
            <Text color={theme.colors.success}>up to date</Text>
          ) : (
            <Text color={theme.colors.warning}>update available</Text>
          )}
        </Box>
      )}

      {/* Actions */}
      <Box gap={2} marginTop={1}>
        <Text color={theme.colors.dimText}>
          [<Text bold>esc</Text>] close
        </Text>
      </Box>
    </MinimalBox>
  );
}
