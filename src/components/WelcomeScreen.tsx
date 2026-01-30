import React from "react";
import { Box, Text } from "ink";
import { useUIStore } from "../store/ui-store.js";
import theme from "../theme/theme.js";

export default function WelcomeScreen() {
  const currentModel = useUIStore((s) => s.currentModel);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.colors.border}
      paddingX={1}
      marginX={1}
      alignSelf="flex-start"
    >
      <Box gap={1}>
        <Text color={theme.colors.primary} bold>
          {theme.glyphs.app} talos
        </Text>
        <Text color={theme.colors.dimText}>v0.0.1</Text>
      </Box>
      <Box gap={1}>
        <Text color={theme.colors.muted}>model:</Text>
        <Text color={theme.colors.text} bold>{currentModel.label}</Text>
      </Box>
      <Box gap={1}>
        <Text color={theme.colors.muted}>cwd:</Text>
        <Text color={theme.colors.text}>{process.cwd()}</Text>
      </Box>
    </Box>
  );
}
