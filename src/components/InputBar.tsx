import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { useChatStore } from "../store/chat-store.js";
import { useUIStore } from "../store/ui-store.js";
import { useActivityStore } from "../store/activity-store.js";
import theme from "../theme/theme.js";
import { VERSION } from "../version.js";

interface SlashCommand {
  name: string;
  description: string;
}

const slashCommands: SlashCommand[] = [
  { name: "/model", description: "Switch model" },
  { name: "/version", description: "Show version info" },
];

interface ReleaseInfo {
  tag_name: string;
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch("https://api.github.com/repos/Only0neHpLeft/talos/releases/latest", {
      headers: { "User-Agent": "talos" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ReleaseInfo;
    return data.tag_name;
  } catch {
    return null;
  }
}

export default function InputBar() {
  const [draft, setDraft] = useState("");
  const addMessage = useChatStore((s) => s.addMessage);
  const permissionRequest = useUIStore((s) => s.permissionRequest);
  const isActive = useActivityStore((s) => s.isActive);
  const modelSelectorVisible = useUIStore((s) => s.modelSelectorVisible);
  const showModelSelector = useUIStore((s) => s.showModelSelector);

  const isMuted = isActive;

  const matches = useMemo(() => {
    if (!draft.startsWith("/") || draft.length < 1) return [];
    const lower = draft.toLowerCase();
    return slashCommands.filter((c) => c.name.startsWith(lower));
  }, [draft]);

  // Check if the current draft is a valid (complete) command at the start
  const isValidCommand = useMemo(() => {
    if (!draft.startsWith("/")) return false;
    const lower = draft.toLowerCase();
    return slashCommands.some((c) => lower === c.name);
  }, [draft]);

  useInput((_input, key) => {
    if (isMuted || permissionRequest || modelSelectorVisible) return;
    if (key.tab && matches.length > 0) {
      setDraft(matches[0].name);
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
      setDraft("");
      
      const latest = await fetchLatestVersion();
      let content = `Current version: v${VERSION}`;
      
      if (latest) {
        const current = VERSION;
        const latestClean = latest.replace(/^v/, "");
        
        if (current === latestClean) {
          content += `\n✓ You are on the latest version (${latest})`;
        } else {
          content += `\n⬆️  Latest version: ${latest}`;
          content += `\n   Run \`talos\` to auto-update, or reinstall with curl.`;
        }
      } else {
        content += `\n⚠️  Could not check for latest version`;
      }
      
      addMessage("system", content);
      return;
    }

    addMessage("user", trimmed);
    setDraft("");
  };

  if (permissionRequest || modelSelectorVisible) return null;

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
          {matches.map((cmd) => (
            <Box key={cmd.name} gap={1}>
              <Text color={theme.colors.accent}>{cmd.name}</Text>
              <Text color={theme.colors.dimText}>{cmd.description}</Text>
              <Text color={theme.colors.muted}> tab</Text>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
