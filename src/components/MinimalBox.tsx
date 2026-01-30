import React from "react";
import { Box } from "ink";
import theme from "../theme/theme.js";

interface MinimalBoxProps {
  children: React.ReactNode;
}

export default function MinimalBox({ children }: MinimalBoxProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme.colors.border}
      paddingX={1}
      paddingY={0}
      marginX={1}
    >
      {children}
    </Box>
  );
}
