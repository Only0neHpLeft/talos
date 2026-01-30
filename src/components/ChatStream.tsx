import React from "react";
import { Box, Text } from "ink";
import { useChatStore } from "../store/chat-store.js";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import MessageBubble from "./MessageBubble.js";
import theme from "../theme/theme.js";

export default function ChatStream() {
  const messages = useChatStore((s) => s.messages);
  const { columns } = useTerminalSize();

  if (messages.length === 0) return null;

  return (
    <Box flexDirection="column" paddingTop={1}>
      {messages.map((msg, idx) => (
        <React.Fragment key={msg.id}>
          {idx > 0 ? (
            <Box paddingX={1}>
              <Text color={theme.colors.border}>
                {theme.glyphs.separator.repeat(Math.max(columns - 4, 10))}
              </Text>
            </Box>
          ) : null}
          <MessageBubble message={msg} />
        </React.Fragment>
      ))}
    </Box>
  );
}
