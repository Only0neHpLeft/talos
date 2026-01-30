import React from "react";
import { render } from "ink";
import App from "./app.js";

// Clear terminal so Talos starts at the top
process.stdout.write("\x1b[2J\x1b[3J\x1b[H");

render(<App />, { patchConsole: false });
