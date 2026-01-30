import React from "react";
import { Box, Text } from "ink";
import { renderMarkdown } from "../utils/markdown.js";
import { formatRelativeTime } from "../utils/format.js";
import DiffView from "./DiffView.js";
import theme from "../theme/theme.js";
import type { Message } from "../types/index.js";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  
  const roleGlyph = isUser ? theme.glyphs.user : isSystem ? "◈" : theme.glyphs.assistant;
  const roleColor = isUser ? theme.colors.secondary : isSystem ? theme.colors.warning : theme.colors.primary;
  const roleLabel = isUser ? "You" : isSystem ? "System" : "Talos";

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Role header with timestamp */}
      <Box justifyContent="space-between" width="100%">
        <Box gap={1}>
          <Text color={roleColor} bold>
            {roleGlyph}
          </Text>
          <Text color={roleColor} bold>
            {roleLabel}
          </Text>
        </Box>
        <Text color={theme.colors.dimText} dimColor>
          {formatRelativeTime(message.timestamp)}
        </Text>
      </Box>

      {/* Message content indented under role glyph */}
      <Box marginLeft={3} flexDirection="column">
        <Text>{renderMarkdown(message.content)}</Text>

        {/* Inline diff if present */}
        {message.diff ? (
          <Box marginTop={1}>
            <DiffView
              filename={message.diff.filename}
              oldText={message.diff.oldText}
              newText={message.diff.newText}
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
