"use client";

import { useState, useEffect } from "react";
import {
  getPlanDay,
  getPhase,
  getPhaseName,
  getPhaseProgress,
  getDaysUntil,
  PLAN_TOTAL,
  PLAN_END,
  DAY_75_DATE,
  type Countdown,
} from "@/lib/plan";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function CountdownUnits({ c, accent }: { c: Countdown; accent: string }) {
  const units = [
    { label: "days",  value: c.days,    pad: false },
    { label: "hrs",   value: c.hours,   pad: true  },
    { label: "min",   value: c.minutes, pad: true  },
    { label: "sec",   value: c.seconds, pad: true  },
  ];
  return (
    <div className="grid grid-cols-4 gap-2 mt-3">
      {units.map(({ label, value, pad: shouldPad }) => (
        <div
          key={label}
          className="rounded-xl bg-white/5 border border-white/8 py-2 text-center"
        >
          <div
            className="text-xl font-bold tabular-nums leading-none"
            style={{ color: accent }}
          >
            {shouldPad ? pad(value) : value}
          </div>
          <div className="text-[10px] text-slate-600 uppercase tracking-widest mt-1 font-semibold">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({
  value,
  total,
  accent,
}: {
  value: number;
  total: number;
  accent: string;
}) {
  const pct = Math.min(100, Math.round((value / total) * 100));
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{value} done</span>
        <span>{total - value} left</span>
      </div>
      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: accent }}
        />
      </div>
      <div className="text-right text-[10px] text-slate-600 mt-1">{pct}%</div>
    </div>
  );
}

export default function Timers() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const day            = getPlanDay();
  const phase          = getPhase(day);
  const phaseName      = getPhaseName(phase);
  const { dayInPhase, totalInPhase } = getPhaseProgress();
  const toDay75        = getDaysUntil(DAY_75_DATE);
  const toPlanEnd      = getDaysUntil(PLAN_END);

  const day75Soon      = !toDay75.past && toDay75.days < 14;
  const planEndSoon    = !toPlanEnd.past && toPlanEnd.days < 14;

  return (
    <div className="space-y-4">

      {/* Plan arc */}
      <div className="rounded-2xl border border-white/10 bg-white/3 px-5 py-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Plan Arc
          </span>
          <span className="text-xs font-mono text-slate-500">
            Day {day} / {PLAN_TOTAL}
          </span>
        </div>
        <ProgressBar value={day} total={PLAN_TOTAL} accent="#6366f1" />
      </div>

      {/* Phase progress */}
      <div className="rounded-2xl border border-white/10 bg-white/3 px-5 py-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Phase {phase}: {phaseName}
          </span>
          <span className="text-xs font-mono text-slate-500">
            Day {dayInPhase} / {totalInPhase}
          </span>
        </div>
        <ProgressBar
          value={dayInPhase}
          total={totalInPhase}
          accent="#10b981"
        />
      </div>

      {/* Day 75 decision */}
      <div
        className={`rounded-2xl border px-5 py-4 ${
          toDay75.past
            ? "border-slate-700/50 bg-slate-800/30"
            : day75Soon
            ? "border-amber-500/40 bg-amber-900/20"
            : "border-white/10 bg-white/3"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Day 75 — Decision Point
          </span>
          {toDay75.past ? (
            <span className="text-xs text-slate-500 font-mono">passed</span>
          ) : day75Soon ? (
            <span className="text-xs font-semibold text-amber-400">
              ⚠ {toDay75.days}d left
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {toDay75.past
            ? "Mock score determines: book test, extend 6–8 wk, or extend 12 wk."
            : "Mock > 320 → book. 310–320 → extend 6–8 wk. < 310 → extend 12 wk."}
        </p>
        {!toDay75.past && (
          <CountdownUnits
            c={toDay75}
            accent={day75Soon ? "#fbbf24" : "#a5b4fc"}
          />
        )}
      </div>

      {/* Plan end */}
      <div
        className={`rounded-2xl border px-5 py-4 ${
          toPlanEnd.past
            ? "border-slate-700/50 bg-slate-800/30"
            : planEndSoon
            ? "border-red-500/40 bg-red-900/20"
            : "border-white/10 bg-white/3"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Plan End — 17 Jul 2026
          </span>
          {planEndSoon && !toPlanEnd.past && (
            <span className="text-xs font-semibold text-red-400">
              🔴 {toPlanEnd.days}d left
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {toPlanEnd.past ? "Plan window closed." : "SQL + Python + GRE window closes."}
        </p>
        {!toPlanEnd.past && (
          <CountdownUnits
            c={toPlanEnd}
            accent={planEndSoon ? "#f87171" : "#6ee7b7"}
          />
        )}
      </div>

      {/* Link to tvc-timer */}
      <a
        href="https://tvc-timer.vercel.app"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between w-full rounded-2xl border border-white/10 bg-white/3 px-5 py-4 hover:bg-white/6 transition-all group"
      >
        <div>
          <p className="text-sm font-semibold text-slate-200">Custom Timers</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Track any event — runs, milestones, dates
          </p>
        </div>
        <span className="text-slate-600 group-hover:text-slate-400 text-lg transition-colors">
          →
        </span>
      </a>

    </div>
  );
}
