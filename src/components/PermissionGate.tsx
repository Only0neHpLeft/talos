import React from "react";
import { Box, Text, useInput } from "ink";
import { useUIStore } from "../store/ui-store.js";
import theme from "../theme/theme.js";

function Button({ label, hotkey, color, isPrimary }: {
  label: string;
  hotkey: string;
  color: string;
  isPrimary?: boolean;
}) {
  return (
    <Box>
      <Text 
        backgroundColor={color} 
        color={theme.colors.crust}
        bold={isPrimary}
      >
        {" "}{hotkey.toUpperCase()}{" "}
      </Text>
      <Text color={theme.colors.text}>
        {" "}{label}{"  "}
      </Text>
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
      borderStyle="double"
      borderColor={theme.colors.warning}
      paddingX={2}
      paddingY={1}
      marginX={1}
    >
      {/* Header */}
      <Box gap={1} marginBottom={1}>
        <Text color={theme.colors.warning} bold>
          {theme.glyphs.warning}
        </Text>
        <Text color={theme.colors.warning} bold>
          Permission Required
        </Text>
      </Box>

      {/* Separator */}
      <Box marginBottom={1}>
        <Text color={theme.colors.border}>
          {"─".repeat(50)}
        </Text>
      </Box>

      {/* Command */}
      <Box marginBottom={1}>
        <Text color={theme.colors.dimText}>Command: </Text>
        <Text color={theme.colors.accent} bold>
          {permissionRequest.command}
        </Text>
      </Box>

      {/* Description */}
      <Box marginBottom={1} flexDirection="column">
        <Text color={theme.colors.dimText}>Description:</Text>
        <Text color={theme.colors.text}>
          {permissionRequest.description}
        </Text>
      </Box>

      {/* Separator */}
      <Box marginY={1}>
        <Text color={theme.colors.border}>
          {"─".repeat(50)}
        </Text>
      </Box>

      {/* Actions */}
      <Box gap={3}>
        <Button hotkey="Y" label="Allow" color={theme.colors.success} isPrimary />
        <Button hotkey="N" label="Deny" color={theme.colors.error} />
      </Box>
    </Box>
  );
}
