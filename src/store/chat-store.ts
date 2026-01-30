import { create } from "zustand";
import type { Message } from "../types/index.js";

interface ChatState {
  messages: Message[];
  totalTokens: number;
  addMessage: (role: Message["role"], content: string, diff?: Message["diff"]) => void;
  clearMessages: () => void;
}

function mockTokenCount(): number {
  return Math.floor(Math.random() * 400) + 100;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  totalTokens: 0,
  addMessage: (role, content, diff) =>
    set((state) => ({
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
      totalTokens: state.totalTokens + mockTokenCount(),
    })),
  clearMessages: () => set({ messages: [], totalTokens: 0 }),
}));
