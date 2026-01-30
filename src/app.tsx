import React, { useEffect, useRef } from "react";
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

export default function App() {
  const messages = useChatStore((s) => s.messages);
  const addMessage = useChatStore((s) => s.addMessage);
  const { start, stop } = useActivityStore();
  const { requestPermission } = useUIStore();
  const lastCount = useRef(0);

  useEffect(() => {
    const count = messages.length;
    if (count > lastCount.current) {
      const latest = messages[count - 1];
      lastCount.current = count;

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
  }, [messages, addMessage, start, stop, requestPermission]);

  return <Layout />;
}
