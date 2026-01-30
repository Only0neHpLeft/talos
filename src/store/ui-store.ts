import { create } from "zustand";
import type { PermissionRequest } from "../types/index.js";

export interface ModelInfo {
  id: string;
  label: string;
  provider: string;
}

export const availableModels: ModelInfo[] = [
  { id: "opus-4.5", label: "Opus 4.5", provider: "Anthropic" },
  { id: "kimi-2.5", label: "Kimi 2.5", provider: "Moonshot" },
];

interface UIState {
  permissionRequest: PermissionRequest | null;
  requestPermission: (request: Omit<PermissionRequest, "id">) => void;
  resolvePermission: (allowed: boolean) => void;

  currentModel: ModelInfo;
  modelSelectorVisible: boolean;
  setModel: (model: ModelInfo) => void;
  showModelSelector: () => void;
  hideModelSelector: () => void;

  versionBoxVisible: boolean;
  showVersionBox: () => void;
  hideVersionBox: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  permissionRequest: null,
  requestPermission: (request) =>
    set({
      permissionRequest: {
        ...request,
        id: crypto.randomUUID(),
      },
    }),
  resolvePermission: (allowed) => {
    const req = get().permissionRequest;
    if (!req) return;
    if (allowed) {
      req.onAllow();
    } else {
      req.onDeny();
    }
    set({ permissionRequest: null });
  },

  currentModel: availableModels[0],
  modelSelectorVisible: false,
  setModel: (model) => set({ currentModel: model }),
  showModelSelector: () => set({ modelSelectorVisible: true }),
  hideModelSelector: () => set({ modelSelectorVisible: false }),

  versionBoxVisible: false,
  showVersionBox: () => set({ versionBoxVisible: true }),
  hideVersionBox: () => set({ versionBoxVisible: false }),
}));
