import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { useUIStore } from "../store/ui-store.js";
import theme from "../theme/theme.js";
import MinimalBox from "./MinimalBox.js";
import { VERSION } from "../version.js";
import {
  fetchLatestVersion,
  getVersionErrorMessage,
} from "../utils/version-checker.js";

export default function VersionBox() {
  const { versionBoxVisible, hideVersionBox } = useUIStore();
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (versionBoxVisible) {
      setIsChecking(true);
      setError(null);
      fetchLatestVersion().then((result) => {
        setLatestVersion(result.version);
        if (result.error !== "none") {
          setError(getVersionErrorMessage(result.error));
        }
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

  const isLatest =
    latestVersion && VERSION === latestVersion.replace(/^v/, "");
  const hasUpdate =
    latestVersion && VERSION !== latestVersion.replace(/^v/, "");

  return (
    <MinimalBox>
      {/* Current version - always shown */}
      <Box gap={1}>
        <Text color={theme.colors.dimText}>Current:</Text>
        <Text color={theme.colors.text} bold>
          v{VERSION}
        </Text>
      </Box>

      {/* Latest version - only shown when there's an update available */}
      {hasUpdate && (
        <Box gap={1}>
          <Text color={theme.colors.dimText}>Latest:</Text>
          <Text color={theme.colors.text} bold>
            {latestVersion}
          </Text>
        </Box>
      )}

      {/* Status - shows checking/error/up-to-date/update-available */}
      <Box gap={1}>
        <Text color={theme.colors.dimText}>Status:</Text>
        {isChecking ? (
          <Text color={theme.colors.muted}>checking...</Text>
        ) : error ? (
          <Text color={theme.colors.error}>{error}</Text>
        ) : hasUpdate ? (
          <Text color={theme.colors.warning}>update available</Text>
        ) : (
          <Text color={theme.colors.success}>up to date ✓</Text>
        )}
      </Box>

      {/* Actions */}
      <Box gap={2} marginTop={1}>
        <Text color={theme.colors.dimText}>
          [<Text bold>esc</Text>] close
        </Text>
      </Box>
    </MinimalBox>
  );
}
