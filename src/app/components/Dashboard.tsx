"use client";

import { useState } from "react";
import { MODES, Mode } from "@/lib/modes";
import { getMissionSummary } from "@/lib/plan";
import ThemeToggle from "./ThemeToggle";
import History from "./History";
import Timers from "./Timers";

interface Props {
  onSelect: (mode: Mode) => void;
}

export default function Dashboard({ onSelect }: Props) {
  const [tab, setTab] = useState<"modes" | "history" | "timers">("modes");
  const mission = getMissionSummary();

  const handleModeSelect = (mode: Mode) => {
    const todayTask = mission.task;
    const todaySubject = mission.subject;

    const enriched: Mode = {
      ...mode,
      defaultInputs: {
        ...(mode.defaultInputs ?? {}),
        ...(["cant-start", "make-quest", "morningstudy"].includes(mode.id) && {
          task: todayTask,
        }),
        ...(mode.id === "work-to-study" && { study_subject: todaySubject }),
        ...(mode.id === "escape" && {
          should_be_doing: `Morning study block — ${todaySubject}`,
        }),
        ...(mode.id === "flat" && { study_coming: todaySubject }),
      },
    };

    onSelect(enriched);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f]">
      <div className="px-5 py-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
              90-Day Plan
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              Pick what your brain needs right now.
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Today's Mission */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/3 px-5 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 tracking-wide">
              DAY {mission.day} · PHASE {mission.phase}: {mission.phaseName.toUpperCase()}
            </span>
            <span className="text-xs text-slate-600">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-200">{mission.subject}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{mission.task}</p>
          <div className="flex gap-4 pt-1">
            <span className="text-xs text-amber-400/70">☕ Morning 40 min</span>
            <span className="text-xs text-indigo-400/70">🌙 Night 20 min Anki</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
          {(["modes", "timers", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                tab === t
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-slate-100 shadow-sm"
                  : "text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "modes" && (
          <div className="space-y-3">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeSelect(mode)}
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
                      {mode.description}
                    </p>
                    <p className="text-gray-400 dark:text-slate-500 text-xs mt-2 italic">
                      {mode.tagline}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        {tab === "timers"  && <Timers />}
        {tab === "history" && <History />}

        <p className="text-center text-gray-300 dark:text-slate-700 text-xs mt-10">
          Built for Godfrey · 90-Day Plan
        </p>
      </div>
    </div>
  );
}
