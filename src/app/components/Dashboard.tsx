"use client";

import { useState } from "react";
import { MODES, Mode } from "@/lib/modes";
import ThemeToggle from "./ThemeToggle";
import History from "./History";

interface Props {
  onSelect: (mode: Mode) => void;
}

const modeDescriptions: Record<string, string> = {
  paralysis: "Frozen in front of a task",
  dopamine: "Bored, restless, can't engage",
  bodydouble: "Need someone 'with' you to focus",
  "context-switch": "Finished one thing, can't shift gears to the next",
  gamify: "Task is too boring to start",
  timeblind: "Keep underestimating how long things take",
  externalizer: "Head full of open loops",
  hyperfocus: "Locked in and can't stop, missing something important",
};

export default function Dashboard({ onSelect }: Props) {
  const [tab, setTab] = useState<"modes" | "history">("modes");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f]">
      <div className="px-5 py-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
              ADHD Mode
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              Pick what your brain needs right now.
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setTab("modes")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === "modes"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-slate-100 shadow-sm"
                : "text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
            }`}
          >
            Modes
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === "history"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-slate-100 shadow-sm"
                : "text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
            }`}
          >
            History
          </button>
        </div>

        {tab === "modes" ? (
          <div className="space-y-3">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onSelect(mode)}
                className={`mode-card w-full text-left rounded-2xl border p-5 bg-gradient-to-br ${mode.color} ${mode.borderColor} hover:brightness-125 active:scale-[0.99] transition-all duration-150 group`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl mt-0.5">{mode.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                        {mode.title}
                      </span>
                      <span className="text-gray-300 dark:text-slate-600 group-hover:text-gray-600 dark:group-hover:text-slate-400 text-lg transition-colors">
                        →
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                      {modeDescriptions[mode.id]}
                    </p>
                    <p className="text-gray-400 dark:text-slate-500 text-xs mt-2 italic">
                      {mode.tagline}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <History />
        )}

        <p className="text-center text-gray-300 dark:text-slate-700 text-xs mt-10">
          Powered by Claude · Built for Godfrey
        </p>
      </div>
    </div>
  );
}
