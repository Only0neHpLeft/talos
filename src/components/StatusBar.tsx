import React, { useState, useEffect } from "react";
import { Box, Text, Spacer } from "ink";
import { getGitBranch, getGitRoot } from "../utils/git.js";
import { useChatStore } from "../store/chat-store.js";
import { useUIStore } from "../store/ui-store.js";
import theme from "../theme/theme.js";
import path from "path";

export default function StatusBar() {
  const [branch, setBranch] = useState("");
  const [project, setProject] = useState("");
  const totalTokens = useChatStore((s) => s.totalTokens);
  const currentModel = useUIStore((s) => s.currentModel);

  useEffect(() => {
    setBranch(getGitBranch());
    const root = getGitRoot();
    if (root) setProject(path.basename(root));
  }, []);

  return (
    <Box flexDirection="row" paddingX={1}>
      <Text color={theme.colors.dimText}>
        {currentModel.label}
      </Text>
      {project ? (
        <Text color={theme.colors.dimText}>
          {" "}{theme.glyphs.vertSep} {project}
        </Text>
      ) : null}
      {branch ? (
        <Text color={theme.colors.success}>
          {" "}{theme.glyphs.vertSep} {theme.glyphs.branch} {branch}
        </Text>
      ) : null}

      <Spacer />

      <Text color={theme.colors.dimText}>
        {totalTokens.toLocaleString()} tokens
      </Text>
      <Text color={theme.colors.muted}>
        {" "}{theme.glyphs.vertSep}{" "}
      </Text>
      <Text color={theme.colors.dimText}>
        v0.0.1
      </Text>
    </Box>
  );
}
