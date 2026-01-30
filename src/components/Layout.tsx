import React from "react";
import { Box } from "ink";
import StatusBar from "./StatusBar.js";
import ChatStream from "./ChatStream.js";
import WelcomeScreen from "./WelcomeScreen.js";
import Throbber from "./Throbber.js";
import PermissionGate from "./PermissionGate.js";
import ModelSelector from "./ModelSelector.js";
import InputBar from "./InputBar.js";

export default function Layout() {
  return (
    <Box flexDirection="column">
      <WelcomeScreen />
      <ChatStream />
      <Throbber />
      <PermissionGate />
      <InputBar />
      <ModelSelector />
      <StatusBar />
    </Box>
  );
}
