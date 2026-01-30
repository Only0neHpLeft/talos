import { test, expect, describe, beforeEach } from "bun:test";
import { useChatStore } from "../store/chat-store.js";
import { useActivityStore } from "../store/activity-store.js";
import { useUIStore, availableModels } from "../store/ui-store.js";

// Helper to reset stores between tests
const resetStores = () => {
  useChatStore.getState().reset();
  useActivityStore.getState().reset();
  useUIStore.getState().reset();
};

describe("Chat Store Tests", () => {
  beforeEach(resetStores);

  test("initial state is correct", () => {
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.totalTokens).toBe(0);
  });

  test("addMessage adds a message", () => {
    const { addMessage } = useChatStore.getState();
    addMessage("user", "Hello");
    
    const state = useChatStore.getState();
    expect(state.messages.length).toBe(1);
    expect(state.messages[0].role).toBe("user");
    expect(state.messages[0].content).toBe("Hello");
    expect(state.messages[0].id).toBeDefined();
    expect(state.messages[0].timestamp).toBeDefined();
  });

  test("addMessage with diff includes diff data", () => {
    const { addMessage } = useChatStore.getState();
    const diff = { filename: "test.ts", oldText: "", newText: "content" };
    addMessage("assistant", "Here is a file", diff);
    
    const state = useChatStore.getState();
    expect(state.messages[0].diff).toEqual(diff);
  });

  test("addMessage increments totalTokens", () => {
    const { addMessage } = useChatStore.getState();
    const initialTokens = useChatStore.getState().totalTokens;
    
    addMessage("user", "Test");
    
    const state = useChatStore.getState();
    expect(state.totalTokens).toBeGreaterThan(initialTokens);
  });

  test("clearMessages resets state", () => {
    const { addMessage, clearMessages } = useChatStore.getState();
    addMessage("user", "Hello");
    addMessage("assistant", "Hi");
    
    clearMessages();
    
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.totalTokens).toBe(0);
  });

  test("multiple messages maintain order", () => {
    const { addMessage } = useChatStore.getState();
    addMessage("user", "First");
    addMessage("assistant", "Second");
    addMessage("user", "Third");
    
    const state = useChatStore.getState();
    expect(state.messages[0].content).toBe("First");
    expect(state.messages[1].content).toBe("Second");
    expect(state.messages[2].content).toBe("Third");
  });
});

describe("Activity Store Tests", () => {
  beforeEach(resetStores);

  test("initial state is inactive", () => {
    const state = useActivityStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.statusText).toBe("");
    expect(state.category).toBe("thinking");
    expect(state.startedAt).toBe(0);
  });

  test("start activates with statusText and category", () => {
    const { start } = useActivityStore.getState();
    start("Loading...", "thinking");
    
    const state = useActivityStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.statusText).toBe("Loading...");
    expect(state.category).toBe("thinking");
    expect(state.startedAt).toBeGreaterThan(0);
  });

  test("stop deactivates and clears statusText", () => {
    const { start, stop } = useActivityStore.getState();
    start("Loading...", "thinking");
    stop();
    
    const state = useActivityStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.statusText).toBe("");
    expect(state.category).toBe("thinking");
    expect(state.startedAt).toBe(0);
  });

  test("start overwrites previous state", () => {
    const { start } = useActivityStore.getState();
    start("First", "thinking");
    start("Second", "reading");
    
    const state = useActivityStore.getState();
    expect(state.statusText).toBe("Second");
    expect(state.category).toBe("reading");
  });
});

describe("UI Store Tests", () => {
  beforeEach(resetStores);

  test("initial state has default model", () => {
    const state = useUIStore.getState();
    expect(state.currentModel).toEqual(availableModels[0]);
    expect(state.permissionRequest).toBeNull();
    expect(state.modelSelectorVisible).toBe(false);
    expect(state.versionBoxVisible).toBe(false);
  });

  test("showModelSelector toggles visibility", () => {
    const { showModelSelector, hideModelSelector } = useUIStore.getState();
    
    showModelSelector();
    expect(useUIStore.getState().modelSelectorVisible).toBe(true);
    
    hideModelSelector();
    expect(useUIStore.getState().modelSelectorVisible).toBe(false);
  });

  test("showVersionBox toggles visibility", () => {
    const { showVersionBox, hideVersionBox } = useUIStore.getState();
    
    showVersionBox();
    expect(useUIStore.getState().versionBoxVisible).toBe(true);
    
    hideVersionBox();
    expect(useUIStore.getState().versionBoxVisible).toBe(false);
  });

  test("requestPermission sets permission request with id", () => {
    const { requestPermission } = useUIStore.getState();
    const onAllow = () => {};
    const onDeny = () => {};
    
    requestPermission({
      command: "test command",
      description: "test description",
      onAllow,
      onDeny,
    });
    
    const state = useUIStore.getState();
    expect(state.permissionRequest).not.toBeNull();
    expect(state.permissionRequest?.command).toBe("test command");
    expect(state.permissionRequest?.description).toBe("test description");
    expect(state.permissionRequest?.id).toBeDefined();
  });

  test("resolvePermission removes request and calls callback", () => {
    const { requestPermission, resolvePermission } = useUIStore.getState();
    let allowed = false;
    let denied = false;
    
    requestPermission({
      command: "test",
      description: "test",
      onAllow: () => { allowed = true; },
      onDeny: () => { denied = true; },
    });
    
    resolvePermission(true);
    expect(allowed).toBe(true);
    expect(useUIStore.getState().permissionRequest).toBeNull();
    
    // Test deny
    requestPermission({
      command: "test2",
      description: "test2",
      onAllow: () => {},
      onDeny: () => { denied = true; },
    });
    
    resolvePermission(false);
    expect(denied).toBe(true);
  });

  test("setModel changes the model", () => {
    const { setModel } = useUIStore.getState();
    const newModel = availableModels[1];
    
    setModel(newModel);
    expect(useUIStore.getState().currentModel).toEqual(newModel);
  });

  test("resolvePermission does nothing if no request", () => {
    const { resolvePermission } = useUIStore.getState();
    // Should not throw
    resolvePermission(true);
    expect(useUIStore.getState().permissionRequest).toBeNull();
  });
});
