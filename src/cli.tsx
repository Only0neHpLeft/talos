import React from "react";
import { render, useApp, useInput, useStdout, Box, Text } from "ink";
import Layout from "./components/Layout.js";
import { useChatStore } from "./store/chat-store.js";
import { useActivityStore } from "./store/activity-store.js";
import { useUIStore } from "./store/ui-store.js";

const DEMO_RESPONSE = `Here's a simple **TypeScript** function:

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

This function takes a \`name\` parameter and returns a greeting string. I'll create the file for you.`;

const DEMO_DIFF = {
  filename: "src/hello.ts",
  oldText: "",
  newText: `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
`,
};

const FOLLOW_UP_ALLOWED = `Done! I've created \`src/hello.ts\` with the greeting function.

You can import and use it like this:

\`\`\`typescript
import { greet } from "./hello.js";
console.log(greet("world")); // Hello, world!
\`\`\`

Want me to add tests for this function?`;

const FOLLOW_UP_DENIED = `Understood — I won't create the file. Let me know if you'd like to take a different approach.`;

// Debug logging hook using useStdout (best practice from Context7)
export function useDebugLog() {
  const { write } = useStdout();
  return {
    log: (message: string) => write(`[DEBUG] ${message}\n`),
    error: (message: string) => write(`[ERROR] ${message}\n`),
  };
}

function App() {
  const { exit } = useApp();
  const { log } = useDebugLog();
  const messages = useChatStore((s) => s.messages);
  const addMessage = useChatStore((s) => s.addMessage);
  const { start, stop } = useActivityStore();
  const { requestPermission } = useUIStore();
  const lastCount = React.useRef(0);

  // Handle Ctrl+C gracefully using useInput (best practice from Context7)
  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      log("User pressed Ctrl+C, exiting gracefully...");
      exit();
    }
  });

  React.useEffect(() => {
    log("App mounted");
    return () => log("App unmounting");
  }, [log]);

  React.useEffect(() => {
    const count = messages.length;
    if (count > lastCount.current) {
      const latest = messages[count - 1];
      lastCount.current = count;
      log(`New message received: ${latest.role}`);

      if (latest.role === "user") {
        start("Thinking...", "thinking");

        const timer = setTimeout(() => {
          start("Reading project files...", "reading");

          const readTimer = setTimeout(() => {
            stop();
            addMessage("assistant", DEMO_RESPONSE, DEMO_DIFF);

            const permTimer = setTimeout(() => {
              requestPermission({
                command: "Write file: src/hello.ts",
                description:
                  "The assistant wants to create a new file with the greeting function.",
                onAllow: () => {
                  start("Writing src/hello.ts...", "writing");
                  setTimeout(() => {
                    stop();
                    addMessage("assistant", FOLLOW_UP_ALLOWED);
                  }, 1000);
                },
                onDeny: () => {
                  addMessage("assistant", FOLLOW_UP_DENIED);
                },
              });
            }, 1500);

            return () => clearTimeout(permTimer);
          }, 1000);

          return () => clearTimeout(readTimer);
        }, 2000);

        return () => clearTimeout(timer);
      }
    }
  }, [messages, addMessage, start, stop, requestPermission, log]);

  return <Layout />;
}

// Error boundary for graceful error handling
function ErrorFallback({ error }: { error: Error }) {
  return (
    <Box flexDirection="column" padding={1}>
      <Text color="red" bold>Something went wrong:</Text>
      <Text color="red">{error.message}</Text>
    </Box>
  );
}

// Main render function with proper options
export function startApp() {
  // Clear terminal so Talos starts at the top
  process.stdout.write("\x1b[2J\x1b[3J\x1b[H");

  const instance = render(<App />, {
    stdout: process.stdout,
    stdin: process.stdin,
    stderr: process.stderr,
    exitOnCtrlC: false, // We handle Ctrl+C manually with useInput
    patchConsole: false,
  });

  return instance;
}

export default App;
