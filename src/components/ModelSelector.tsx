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
      borderStyle="single"
      borderColor={theme.colors.border}
      paddingX={1}
      paddingY={0}
      marginX={1}
    >
      {/* Models list */}
      <Box flexDirection="column">
        {availableModels.map((model, idx) => {
          const isHighlighted = idx === highlightIndex;
          const isCurrent = model.id === currentModel.id;

          return (
            <Box key={model.id} gap={1}>
              <Text color={isCurrent ? theme.colors.success : theme.colors.muted}>
                {isCurrent ? "●" : "○"}
              </Text>
              <Text
                color={isHighlighted ? theme.colors.text : theme.colors.dimText}
                bold={isHighlighted}
              >
                {model.label}
              </Text>
              <Text color={theme.colors.muted}>
                {model.provider}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Actions */}
      <Box gap={2} marginTop={1}>
        <Text color={theme.colors.dimText}>
          [<Text bold>↵</Text>] select
        </Text>
        <Text color={theme.colors.dimText}>
          [<Text bold>esc</Text>] cancel
        </Text>
      </Box>
    </Box>
  );
}
