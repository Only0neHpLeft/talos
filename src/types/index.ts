export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  diff?: {
    filename: string;
    oldText: string;
    newText: string;
  };
}

export interface DiffChange {
  type: "add" | "remove" | "normal";
  value: string;
}

export interface DiffHunk {
  oldStart: number;
  newStart: number;
  oldLines: number;
  newLines: number;
  changes: DiffChange[];
}

export interface PermissionRequest {
  id: string;
  command: string;
  description: string;
  onAllow: () => void;
  onDeny: () => void;
}

export type ActivityCategory = "thinking" | "reading" | "writing" | "tool";
