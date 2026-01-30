import React from "react";
import { Box, Text, useInput } from "ink";
import { useUIStore } from "../store/ui-store.js";
import theme from "../theme/theme.js";

export default function PermissionGate() {
  const { permissionRequest, resolvePermission } = useUIStore();

  useInput((input) => {
    if (!permissionRequest) return;
    if (input === "y" || input === "Y") resolvePermission(true);
    else if (input === "n" || input === "N") resolvePermission(false);
  });

  if (!permissionRequest) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme.colors.border}
      paddingX={1}
      paddingY={0}
      marginX={1}
    >
      {/* Title row */}
      <Box gap={1}>
        <Text color={theme.colors.muted}>{theme.glyphs.warning}</Text>
        <Text color={theme.colors.dimText}>Allow</Text>
        <Text color={theme.colors.text} bold>
          {permissionRequest.command}
        </Text>
        <Text color={theme.colors.dimText}>?</Text>
      </Box>

      {/* Description */}
      <Box marginTop={0}>
        <Text color={theme.colors.muted}>
          {permissionRequest.description}
        </Text>
      </Box>

      {/* Actions */}
      <Box gap={2} marginTop={1}>
        <Text color={theme.colors.dimText}>
          [<Text color={theme.colors.success} bold>Y</Text>] yes
        </Text>
        <Text color={theme.colors.dimText}>
          [<Text color={theme.colors.error} bold>N</Text>] no
        </Text>
      </Box>
    </Box>
  );
}
