import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { useUIStore } from "../store/ui-store.js";
import theme from "../theme/theme.js";
import MinimalBox from "./MinimalBox.js";
import { VERSION } from "../version.js";

interface ReleaseInfo {
  tag_name: string;
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch("https://api.github.com/repos/Only0neHpLeft/talos/releases/latest", {
      headers: { "User-Agent": "talos" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ReleaseInfo;
    return data.tag_name;
  } catch {
    return null;
  }
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
