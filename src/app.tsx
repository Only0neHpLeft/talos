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

  // Cleanup on unmount - reset stores
  useEffect(() => {
    return () => {
      useChatStore.setState({ messages: [], totalTokens: 0 });
      useActivityStore.setState({ isActive: false, statusText: "", category: "thinking", startedAt: 0 });
      useUIStore.setState({ permissionRequest: null, modelSelectorVisible: false, versionBoxVisible: false });
    };
  }, []);

  // Demo effect with async/await pattern
  useEffect(() => {
    const count = messages.length;
    if (count <= lastCount.current) return;
    
    const latest = messages[count - 1];
    lastCount.current = count;

    if (latest.role !== "user") return;

    const abortController = new AbortController();

    async function runDemo() {
      start("Thinking...", "thinking");
      
      await delay(2000, abortController.signal);
      if (abortController.signal.aborted) return;

      start("Reading project files...", "reading");
      
      await delay(1000, abortController.signal);
      if (abortController.signal.aborted) return;

      stop();
      addMessage("assistant", DEMO_RESPONSE, DEMO_DIFF);

      await delay(1500, abortController.signal);
      if (abortController.signal.aborted) return;

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
    }

    runDemo();

    return () => {
      abortController.abort();
    };
  }, [messages, addMessage, start, stop, requestPermission]);

  return <Layout />;
}

// Helper function for delays with abort support
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => resolve(), ms);
    
    signal.addEventListener("abort", () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}
