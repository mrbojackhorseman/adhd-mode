"use client";

import { useState, useEffect } from "react";
import { Trash2, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { loadHistory, deleteEntry, clearHistory, HistoryEntry } from "@/lib/history";
import MarkdownRenderer from "./MarkdownRenderer";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

export default function History() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  const handleDelete = (id: string) => {
    deleteEntry(id);
    setEntries(loadHistory());
    if (expanded === id) setExpanded(null);
  };

  const handleClear = () => {
    clearHistory();
    setEntries([]);
    setExpanded(null);
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-20">
        <Clock className="mx-auto mb-4 text-gray-200 dark:text-slate-700" size={36} />
        <p className="text-gray-400 dark:text-slate-500 text-sm">No sessions yet.</p>
        <p className="text-gray-300 dark:text-slate-600 text-xs mt-1">
          Complete a mode session and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={handleClear}
          className="text-xs text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Clear all
        </button>
      </div>

      {entries.map((entry) => {
        const firstKey = Object.keys(entry.inputs)[0];
        const preview = entry.inputs[firstKey] ?? "";
        const isOpen = expanded === entry.id;

        return (
          <div
            key={entry.id}
            className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 overflow-hidden"
          >
            <div
              className="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              onClick={() => setExpanded(isOpen ? null : entry.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{entry.modeEmoji}</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                    {entry.modeTitle}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-600 ml-auto mr-2 shrink-0">
                    {timeAgo(entry.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-500 truncate">
                  {preview.slice(0, 90)}
                  {preview.length > 90 ? "…" : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-3 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(entry.id);
                  }}
                  className="text-gray-300 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  aria-label="Delete entry"
                >
                  <Trash2 size={13} />
                </button>
                {isOpen ? (
                  <ChevronUp size={14} className="text-gray-400 dark:text-slate-500" />
                ) : (
                  <ChevronDown size={14} className="text-gray-400 dark:text-slate-500" />
                )}
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-gray-100 dark:border-white/5 p-4 max-h-96 overflow-auto">
                <MarkdownRenderer content={entry.response} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
