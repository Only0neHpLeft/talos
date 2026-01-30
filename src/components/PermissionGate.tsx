import React from "react";
import { Box, Text, useInput } from "ink";
import { useUIStore } from "../store/ui-store.js";
import theme from "../theme/theme.js";

function Pill({ label, hotkey, color }: {
  label: string;
  hotkey: string;
  color: string;
}) {
  return (
    <Box>
      <Text backgroundColor={color} color={theme.colors.surface}>
        {" "}{hotkey}{" "}
      </Text>
      <Text color={theme.colors.text}> {label}  </Text>
    </Box>
  );
}

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
      borderStyle="round"
      borderColor={theme.colors.warning}
      paddingX={2}
      paddingY={1}
      marginX={1}
    >
      <Box gap={1}>
        <Text color={theme.colors.warning} bold>
          {theme.glyphs.warning} Permission Required
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color={theme.colors.accent} bold>
          {permissionRequest.command}
        </Text>
      </Box>

      <Text color={theme.colors.dimText}>
        {permissionRequest.description}
      </Text>

      <Box marginTop={1} gap={2}>
        <Pill hotkey="Y" label="Allow" color={theme.colors.success} />
        <Pill hotkey="N" label="Deny" color={theme.colors.error} />
      </Box>
    </Box>
  );
}
