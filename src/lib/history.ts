export interface HistoryEntry {
  id: string;
  modeId: string;
  modeTitle: string;
  modeEmoji: string;
  inputs: Record<string, string>;
  response: string;
  timestamp: number;
}

const KEY = "adhd-history";
const MAX = 30;

export function saveSession(entry: Omit<HistoryEntry, "id" | "timestamp">): void {
  const entries = loadHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  localStorage.setItem(KEY, JSON.stringify([newEntry, ...entries].slice(0, MAX)));
}

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function deleteEntry(id: string): void {
  localStorage.setItem(
    KEY,
    JSON.stringify(loadHistory().filter((e) => e.id !== id))
  );
}

export function clearHistory(): void {
  localStorage.removeItem(KEY);
}
