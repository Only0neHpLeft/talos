import { create } from "zustand";
import type { Message } from "../types/index.js";

interface ChatState {
  messages: Message[];
  totalTokens: number;
  addMessage: (role: Message["role"], content: string, diff?: Message["diff"]) => void;
  clearMessages: () => void;
  reset: () => void;
}

// Simple deterministic token estimation
function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4);
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  totalTokens: 0,
  addMessage: (role, content, diff) =>
    set((state) => {
      const messageTokens = estimateTokenCount(content);
      const diffTokens = diff ? estimateTokenCount(diff.newText) : 0;
      
      return {
        messages: [
          ...state.messages,
          {
            id: crypto.randomUUID(),
            role,
            content,
            timestamp: Date.now(),
            diff,
          },
        ],
        totalTokens: state.totalTokens + messageTokens + diffTokens,
      };
    }),
  clearMessages: () => set({ messages: [], totalTokens: 0 }),
  reset: () => set({ messages: [], totalTokens: 0 }),
}));
