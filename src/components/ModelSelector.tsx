import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useUIStore, availableModels } from "../store/ui-store.js";
import theme from "../theme/theme.js";

export default function ModelSelector() {
  const { currentModel, setModel, hideModelSelector, modelSelectorVisible } =
    useUIStore();
  const [highlightIndex, setHighlightIndex] = useState(() =>
    availableModels.findIndex((m) => m.id === currentModel.id),
  );

  useInput((input, key) => {
    if (!modelSelectorVisible) return;

    if (key.escape) {
      hideModelSelector();
      return;
    }

    if (key.return) {
      setModel(availableModels[highlightIndex]);
      hideModelSelector();
      return;
    }

    if (key.upArrow) {
      setHighlightIndex((i) => (i > 0 ? i - 1 : availableModels.length - 1));
    } else if (key.downArrow) {
      setHighlightIndex((i) => (i < availableModels.length - 1 ? i + 1 : 0));
    }
  });

  if (!modelSelectorVisible) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.colors.accent}
      paddingX={2}
      paddingY={1}
      marginX={1}
    >
      <Text color={theme.colors.accent} bold>
        Select Model
      </Text>

      <Box flexDirection="column" marginTop={1}>
        {availableModels.map((model, idx) => {
          const isHighlighted = idx === highlightIndex;
          const isCurrent = model.id === currentModel.id;
          const bullet = isCurrent ? "\u25CF" : "\u25CB";

          return (
            <Box key={model.id} gap={1}>
              <Text
                color={
                  isHighlighted ? theme.colors.primary : theme.colors.dimText
                }
                bold={isHighlighted}
              >
                {bullet} {model.label}
              </Text>
              <Text color={theme.colors.muted}>({model.provider})</Text>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1} gap={2}>
        <Text color={theme.colors.dimText}>
          {"\u2191\u2193"} navigate {"  "} Enter select {"  "} Esc cancel
        </Text>
      </Box>
    </Box>
  );
}
