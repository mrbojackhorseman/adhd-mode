"use client";

import { MODES, Mode } from "@/lib/modes";

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
};

export default function Dashboard({ onSelect }: Props) {
  return (
    <div className="min-h-screen px-5 py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10 space-y-2">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          ADHD Mode
        </h1>
        <p className="text-slate-400 text-sm">
          Pick what your brain needs right now. One mode, one session.
        </p>
      </div>

      {/* Mode grid */}
      <div className="space-y-3">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelect(mode)}
            className={`w-full text-left rounded-2xl border p-5 bg-gradient-to-br ${mode.color} ${mode.borderColor} hover:brightness-125 active:scale-[0.99] transition-all duration-150 group`}
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-0.5">{mode.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-100 text-sm">
                    {mode.title}
                  </span>
                  <span className="text-slate-600 group-hover:text-slate-400 text-lg transition-colors">
                    →
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  {modeDescriptions[mode.id]}
                </p>
                <p className="text-slate-500 text-xs mt-2 italic">
                  {mode.tagline}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-slate-700 text-xs mt-10">
        Powered by Claude · Built for Godfrey
      </p>
    </div>
  );
}
