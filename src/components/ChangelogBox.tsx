import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { useUIStore } from "../store/ui-store.js";
import theme from "../theme/theme.js";
import MinimalBox from "./MinimalBox.js";
import {
  fetchLatestChangelog,
  formatReleaseBody,
  formatReleaseDate,
  getChangelogErrorMessage,
  type ReleaseInfo,
} from "../utils/changelog-fetcher.js";

export default function ChangelogBox() {
  const { changelogBoxVisible, hideChangelogBox } = useUIStore();
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [formattedBody, setFormattedBody] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    if (changelogBoxVisible) {
      setIsLoading(true);
      setError(null);
      setScrollOffset(0);

      fetchLatestChangelog()
        .then((result) => {
          if (result.release) {
            setRelease(result.release);
            setFormattedBody(formatReleaseBody(result.release.body));
          }
          if (result.error !== "none") {
            setError(getChangelogErrorMessage(result.error));
          }
        })
        .catch((err) => {
          setError("Failed to fetch changelog");
          console.error("Changelog fetch failed:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [changelogBoxVisible]);

  useInput((input, key) => {
    if (!changelogBoxVisible) return;

    if (key.escape || input === "q") {
      hideChangelogBox();
    } else if (key.upArrow) {
      setScrollOffset((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setScrollOffset((prev) =>
        Math.min(Math.max(0, formattedBody.length - 10), prev + 1)
      );
    } else if (key.return) {
      hideChangelogBox();
    }
  });

  if (!changelogBoxVisible) return null;

  // Calculate visible lines (show max 10 lines at a time)
  const maxVisibleLines = 10;
  const visibleLines = formattedBody.slice(
    scrollOffset,
    scrollOffset + maxVisibleLines
  );
  const canScrollUp = scrollOffset > 0;
  const canScrollDown = scrollOffset + maxVisibleLines < formattedBody.length;

  return (
    <MinimalBox>
      {/* Header */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={theme.colors.text}>
          LATEST RELEASE
        </Text>
        {release && (
          <Box flexDirection="column" marginTop={1}>
            <Box gap={1}>
              <Text color={theme.colors.dimText}>Version:</Text>
              <Text color={theme.colors.text}>v{release.version}</Text>
            </Box>
            <Box gap={1}>
              <Text color={theme.colors.dimText}>Date:</Text>
              <Text color={theme.colors.text}>
                {formatReleaseDate(release.publishedAt)}
              </Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box flexDirection="column" minHeight={maxVisibleLines}>
        {isLoading ? (
          <Text color={theme.colors.muted}>Loading changelog...</Text>
        ) : error ? (
          <Text color={theme.colors.error}>{error}</Text>
        ) : visibleLines.length > 0 ? (
          visibleLines.map((line, index) => (
            <Text key={index} color={theme.colors.text} wrap="truncate">
              {line}
            </Text>
          ))
        ) : (
          <Text color={theme.colors.muted}>No release notes available.</Text>
        )}
      </Box>

      {/* Scroll indicators */}
      {(canScrollUp || canScrollDown) && (
        <Box marginTop={1} gap={2}>
          {canScrollUp && (
            <Text color={theme.colors.dimText}>[↑] scroll up</Text>
          )}
          {canScrollDown && (
            <Text color={theme.colors.dimText}>[↓] scroll down</Text>
          )}
        </Box>
      )}

      {/* Actions */}
      <Box marginTop={1} gap={2}>
        <Text color={theme.colors.dimText}>
          [<Text bold>esc/q</Text>] close
        </Text>
        <Text color={theme.colors.dimText}>
          [<Text bold>enter</Text>] close
        </Text>
      </Box>
    </MinimalBox>
  );
}
