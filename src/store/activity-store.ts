import { create } from "zustand";
import type { ActivityCategory } from "../types/index.js";

interface ActivityState {
  isActive: boolean;
  statusText: string;
  category: ActivityCategory;
  startedAt: number;
  start: (text: string, category?: ActivityCategory) => void;
  stop: () => void;
  reset: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  isActive: false,
  statusText: "",
  category: "thinking",
  startedAt: 0,
  start: (text, category = "thinking") =>
    set({ isActive: true, statusText: text, category, startedAt: Date.now() }),
  stop: () =>
    set({ isActive: false, statusText: "", category: "thinking", startedAt: 0 }),
  reset: () =>
    set({ isActive: false, statusText: "", category: "thinking", startedAt: 0 }),
}));
