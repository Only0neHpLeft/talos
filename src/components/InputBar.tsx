import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { useChatStore } from "../store/chat-store.js";
import { useUIStore } from "../store/ui-store.js";
import { useActivityStore } from "../store/activity-store.js";
import theme from "../theme/theme.js";

interface SlashCommand {
  name: string;
  description: string;
}

const slashCommands: SlashCommand[] = [
  { name: "/model", description: "Switch model" },
  { name: "/version", description: "Show version info" },
];

export default function InputBar() {
  const [draft, setDraft] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const addMessage = useChatStore((s) => s.addMessage);
  const permissionRequest = useUIStore((s) => s.permissionRequest);
  const isActive = useActivityStore((s) => s.isActive);
  const modelSelectorVisible = useUIStore((s) => s.modelSelectorVisible);
  const versionBoxVisible = useUIStore((s) => s.versionBoxVisible);
  const showModelSelector = useUIStore((s) => s.showModelSelector);
  const showVersionBox = useUIStore((s) => s.showVersionBox);

  const isMuted = isActive;

  const matches = useMemo(() => {
    if (!draft.startsWith("/") || draft.length < 1) return [];
    const lower = draft.toLowerCase();
    return slashCommands.filter((c) => c.name.startsWith(lower));
  }, [draft]);

  // Reset selection when matches change
  useMemo(() => {
    setSelectedIndex(0);
  }, [matches.length]);

  // Check if the current draft is a valid (complete) command at the start
  const isValidCommand = useMemo(() => {
    if (!draft.startsWith("/")) return false;
    const lower = draft.toLowerCase();
    return slashCommands.some((c) => lower === c.name);
  }, [draft]);

  useInput((_input, key) => {
    if (isMuted || permissionRequest || modelSelectorVisible || versionBoxVisible) return;
    
    if (matches.length > 0) {
      if (key.upArrow) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : matches.length - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((prev) => (prev < matches.length - 1 ? prev + 1 : 0));
        return;
      }
      if (key.tab) {
        setDraft(matches[selectedIndex].name);
        return;
      }
    }
  });

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (trimmed === "/model") {
      showModelSelector();
      setDraft("");
      return;
    }

    if (trimmed === "/version") {
      showVersionBox();
      setDraft("");
      return;
    }

    addMessage("user", trimmed);
    setDraft("");
  };

  if (permissionRequest || modelSelectorVisible || versionBoxVisible) return null;

  return (
    <Box flexDirection="column" paddingX={1} paddingTop={1}>
      <Box>
        <Text 
          color={isValidCommand ? theme.colors.success : (isMuted ? theme.colors.muted : theme.colors.secondary)} 
          bold
        >
          {theme.glyphs.user}{" "}
        </Text>
        <Box flexGrow={1}>
          <TextInput
            value={draft}
            onChange={setDraft}
            onSubmit={handleSubmit}
            focus={!isMuted}
            placeholder={isMuted ? "Waiting for response..." : "Send a message..."}
          />
        </Box>
      </Box>
      {matches.length > 0 && draft !== matches[0].name ? (
        <Box paddingLeft={2} marginTop={0} flexDirection="column">
          {matches.map((cmd, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <Box key={cmd.name} gap={1}>
                <Text color={isSelected ? theme.colors.success : theme.colors.accent} bold={isSelected}>
                  {isSelected ? "❯ " : "  "}{cmd.name}
                </Text>
                <Text color={theme.colors.dimText}>{cmd.description}</Text>
                <Text color={theme.colors.muted}>{isSelected ? " tab" : ""}</Text>
              </Box>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
}
