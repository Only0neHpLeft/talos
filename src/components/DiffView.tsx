import React from "react";
import { Box, Text } from "ink";
import { structuredPatch } from "diff";
import theme from "../theme/theme.js";

interface DiffViewProps {
  filename: string;
  oldText: string;
  newText: string;
}

export default function DiffView({ filename, oldText, newText }: DiffViewProps) {
  const patch = structuredPatch(filename, filename, oldText, newText);

  if (patch.hunks.length === 0) {
    return (
      <Box paddingX={2}>
        <Text color={theme.colors.dimText}>No changes</Text>
      </Box>
    );
  }

  let additions = 0;
  let deletions = 0;
  for (const h of patch.hunks) {
    for (const l of h.lines) {
      if (l.startsWith("+")) additions++;
      else if (l.startsWith("-")) deletions++;
    }
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.colors.border}
      paddingX={1}
    >
      {/* File header */}
      <Box justifyContent="space-between">
        <Text color={theme.colors.accent} bold>
          {theme.glyphs.arrowRight} {filename}
        </Text>
        <Box gap={1}>
          <Text color={theme.colors.success}>+{additions}</Text>
          <Text color={theme.colors.error}>-{deletions}</Text>
        </Box>
      </Box>

      {/* Hunks */}
      {patch.hunks.map((hunk, hi) => (
        <Box key={hi} flexDirection="column" marginTop={hi > 0 ? 1 : 0}>
          <Text color={theme.colors.info} dimColor>
            @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
          </Text>
          {hunk.lines.map((line, li) => {
            const nums = lineNumber(hunk, li);
            const gutter = 4;

            if (line.startsWith("+")) {
              return (
                <Box key={li}>
                  <Text color={theme.colors.dimText}>
                    {String(nums.num).padStart(gutter, " ")}
                  </Text>
                  <Text color={theme.colors.success}> + {line.slice(1)}</Text>
                </Box>
              );
            }
            if (line.startsWith("-")) {
              return (
                <Box key={li}>
                  <Text color={theme.colors.dimText}>
                    {String(nums.num).padStart(gutter, " ")}
                  </Text>
                  <Text color={theme.colors.error}> - {line.slice(1)}</Text>
                </Box>
              );
            }
            return (
              <Box key={li}>
                <Text color={theme.colors.dimText}>
                  {String(nums.num).padStart(gutter, " ")}
                </Text>
                <Text color={theme.colors.dimText}>   {line.slice(1)}</Text>
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

function lineNumber(
  hunk: ReturnType<typeof structuredPatch>["hunks"][0],
  lineIndex: number,
): { num: number } {
  let oldLine = hunk.oldStart;
  let newLine = hunk.newStart;
  for (let i = 0; i < lineIndex; i++) {
    const l = hunk.lines[i];
    if (l.startsWith("+")) newLine++;
    else if (l.startsWith("-")) oldLine++;
    else {
      oldLine++;
      newLine++;
    }
  }
  const current = hunk.lines[lineIndex];
  if (current.startsWith("+")) return { num: newLine };
  if (current.startsWith("-")) return { num: oldLine };
  return { num: newLine };
}
