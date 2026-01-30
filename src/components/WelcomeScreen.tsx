import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { useUIStore } from "../store/ui-store.js";
import theme from "../theme/theme.js";
import { VERSION } from "../version.js";

export default function WelcomeScreen() {
  const currentModel = useUIStore((s) => s.currentModel);
  const [cwd, setCwd] = useState("");

  useEffect(() => {
    setCwd(process.cwd());
  }, []);

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
        <Text color={theme.colors.dimText}>v{VERSION}</Text>
      </Box>
      <Box gap={1}>
        <Text color={theme.colors.muted}>model:</Text>
        <Text color={theme.colors.text} bold>{currentModel.label}</Text>
      </Box>
      <Box gap={1}>
        <Text color={theme.colors.muted}>cwd:</Text>
        <Text color={theme.colors.text}>{cwd}</Text>
      </Box>
    </Box>
  );
}
