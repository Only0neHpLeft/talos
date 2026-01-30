import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type { SpinnerName } from "cli-spinners";
import { useActivityStore } from "../store/activity-store.js";
import { useElapsedTime } from "../hooks/useElapsedTime.js";
import { formatElapsed } from "../utils/format.js";
import theme from "../theme/theme.js";
import type { ActivityCategory } from "../types/index.js";

const categoryConfig: Record<
  ActivityCategory,
  { color: string; spinner: SpinnerName; icon: string }
> = {
  thinking: { color: theme.colors.primary, spinner: "dots", icon: "◇" },
  reading: { color: theme.colors.info, spinner: "dots2", icon: "↓" },
  writing: { color: theme.colors.warning, spinner: "dots3", icon: "↑" },
  tool: { color: theme.colors.accent, spinner: "dots4", icon: "⚙" },
};

export default function Throbber() {
  const { isActive, statusText, category } = useActivityStore();
  const elapsed = useElapsedTime(isActive);

  if (!isActive) return null;

  const config = categoryConfig[category];

  return (
    <Box paddingX={2} gap={1}>
      <Text color={config.color}>
        <Spinner type={config.spinner} />
      </Text>
      <Text color={config.color}>
        {config.icon} {statusText}
      </Text>
      {elapsed > 0 ? (
        <Text color={theme.colors.dimText}>{formatElapsed(elapsed)}</Text>
      ) : null}
    </Box>
  );
}
