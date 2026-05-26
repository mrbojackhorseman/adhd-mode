"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Square, RotateCcw, Pencil, X } from "lucide-react";
import {
  getPlanDay, getPhase, getPhaseName, getPhaseProgress,
  getDaysUntil, PLAN_TOTAL, PLAN_END, DAY_75_DATE,
  type Countdown,
} from "@/lib/plan";
import {
  type TimerEvent, type AccentColor,
  loadLocalEvents, saveLocalEvents,
  loadLocalOrderTs, saveLocalOrderTs,
  fetchRemoteEvents, pushRemoteEvents,
  mergeEvents, calcDiff, formatDate,
  ACCENT_COLORS, STOPPED_ACCENT,
} from "@/lib/events";

// ─── helpers ──────────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, "0"); }

// ─── Section (collapsible) ────────────────────────────────────────────────────
// Uses CSS grid-template-rows trick: 0fr→1fr animates smoothly without
// measuring element height in JS.
function Section({
  title, subtitle, open, onToggle, children,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-2 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-slate-600">{subtitle}</span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-600 group-hover:text-slate-400 transition-transform duration-200 ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>
      <div
        className="grid transition-all duration-300"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 pt-1 pb-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, total, accent }: { value: number; total: number; accent: string }) {
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

// ─── 4-unit countdown (days / hrs / min / sec) ────────────────────────────────
function CountdownUnits({ c, accent }: { c: Countdown; accent: string }) {
  return (
    <div className="grid grid-cols-4 gap-2 mt-3">
      {([ ["days", c.days, false], ["hrs", c.hours, true], ["min", c.minutes, true], ["sec", c.seconds, true] ] as const).map(
        ([label, value, p]) => (
          <div key={label} className="rounded-xl bg-white/5 border border-white/8 py-2 text-center">
            <div className="text-xl font-bold tabular-nums leading-none" style={{ color: accent }}>
              {p ? pad(value) : value}
            </div>
            <div className="text-[10px] text-slate-600 uppercase tracking-widest mt-1 font-semibold">
              {label}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

// ─── Plan milestone cards ─────────────────────────────────────────────────────
function PlanCountdowns({ now }: { now: Date }) {
  const day               = getPlanDay();
  const phase             = getPhase(day);
  const { dayInPhase, totalInPhase } = getPhaseProgress();
  const toDay75           = getDaysUntil(DAY_75_DATE, now);
  const toPlanEnd         = getDaysUntil(PLAN_END, now);
  const day75Soon         = !toDay75.past   && toDay75.days   < 14;
  const planEndSoon       = !toPlanEnd.past && toPlanEnd.days < 14;

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/3 px-5 py-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Plan Arc</span>
          <span className="text-xs font-mono text-slate-500">Day {day} / {PLAN_TOTAL}</span>
        </div>
        <ProgressBar value={day} total={PLAN_TOTAL} accent="#6366f1" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/3 px-5 py-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Phase {phase}: {getPhaseName(phase)}
          </span>
          <span className="text-xs font-mono text-slate-500">Day {dayInPhase} / {totalInPhase}</span>
        </div>
        <ProgressBar value={dayInPhase} total={totalInPhase} accent="#10b981" />
      </div>

      <div className={`rounded-2xl border px-5 py-4 ${
        toDay75.past    ? "border-slate-700/50 bg-slate-800/30"
        : day75Soon     ? "border-amber-500/40 bg-amber-900/20"
        : "border-white/10 bg-white/3"
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Day 75 — Decision Point
          </span>
          {toDay75.past
            ? <span className="text-xs text-slate-500 font-mono">passed</span>
            : day75Soon
            ? <span className="text-xs font-semibold text-amber-400">⚠ {toDay75.days}d left</span>
            : null}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {toDay75.past
            ? "Mock score determines: book, extend 6–8 wk, or extend 12 wk."
            : "Mock > 320 → book. 310–320 → extend 6–8 wk. < 310 → extend 12 wk."}
        </p>
        {!toDay75.past && <CountdownUnits c={toDay75} accent={day75Soon ? "#fbbf24" : "#a5b4fc"} />}
      </div>

      <div className={`rounded-2xl border px-5 py-4 ${
        toPlanEnd.past  ? "border-slate-700/50 bg-slate-800/30"
        : planEndSoon   ? "border-red-500/40 bg-red-900/20"
        : "border-white/10 bg-white/3"
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Plan End — 17 Jul 2026
          </span>
          {planEndSoon && !toPlanEnd.past && (
            <span className="text-xs font-semibold text-red-400">🔴 {toPlanEnd.days}d left</span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {toPlanEnd.past ? "Plan window closed." : "SQL + Python + GRE window closes."}
        </p>
        {!toPlanEnd.past && (
          <CountdownUnits c={toPlanEnd} accent={planEndSoon ? "#f87171" : "#6ee7b7"} />
        )}
      </div>
    </>
  );
}

// ─── 5-unit display (years / days / hrs / min / sec) for custom events ────────
function UnitBox5({
  elapsed,
  accent,
}: {
  elapsed: ReturnType<typeof calcDiff>;
  accent: AccentColor | typeof STOPPED_ACCENT;
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5 mt-3">
      {([ ["yrs", elapsed.years, false], ["days", elapsed.days, false], ["hrs", elapsed.hours, true], ["min", elapsed.minutes, true], ["sec", elapsed.seconds, true] ] as const).map(
        ([label, value, p]) => (
          <div
            key={label}
            className="rounded-xl py-1.5 text-center"
            style={{ background: "#0f172a", border: `1px solid ${accent.border}22` }}
          >
            <div
              className="text-sm font-bold tabular-nums leading-none"
              style={{ color: accent.text, letterSpacing: "-0.02em" }}
            >
              {p ? pad(value) : value}
            </div>
            <div className="text-[9px] text-slate-600 uppercase tracking-widest mt-1 font-semibold">
              {label}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────
function EventCard({
  event, now, accent,
  onStop, onResume, onRemove, onEdit,
  dragHandlers,
}: {
  event: TimerEvent;
  now: Date;
  accent: AccentColor;
  onStop:   (id: number) => void;
  onResume: (id: number) => void;
  onRemove: (id: number) => void;
  onEdit:   (id: number, changes: Partial<Pick<TimerEvent, "name" | "target" | "stoppedAt">>) => void;
  dragHandlers: {
    onDragStart: () => void;
    onDragEnter: () => void;
    onDragOver:  (e: React.DragEvent) => void;
    onDragEnd:   () => void;
  };
}) {
  const isStopped = event.stoppedAt !== null;
  const isPast    = event.target <= now;
  const elapsed   = isStopped ? calcDiff(event.target, event.stoppedAt!) : calcDiff(event.target, now);
  const ac        = isStopped ? STOPPED_ACCENT : accent;

  const [collapsed,   setCollapsed]   = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [showDate,    setShowDate]    = useState(true);
  const [showStop,    setShowStop]    = useState(true);
  const [editName,    setEditName]    = useState(event.name);
  const [editDate,    setEditDate]    = useState(event.target.toISOString().slice(0, 10));
  const [editTime,    setEditTime]    = useState(event.target.toTimeString().slice(0, 8));
  const [editEndDate, setEditEndDate] = useState(event.stoppedAt ? event.stoppedAt.toISOString().slice(0, 10) : "");
  const [editEndTime, setEditEndTime] = useState(event.stoppedAt ? event.stoppedAt.toTimeString().slice(0, 8) : "");
  const [editError,   setEditError]   = useState("");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) { setEditError("Name cannot be empty."); return; }
    const parsed = new Date(`${editDate}T${editTime || "00:00:00"}`);
    if (isNaN(parsed.getTime())) { setEditError("Invalid date or time."); return; }
    let newStop: Date | null = null;
    if (editEndDate) {
      const parsedEnd = new Date(`${editEndDate}T${editEndTime || "00:00:00"}`);
      if (isNaN(parsedEnd.getTime())) { setEditError("Invalid end date."); return; }
      newStop = parsedEnd;
    }
    onEdit(event.id, { name: editName.trim(), target: parsed, stoppedAt: newStop });
    setEditing(false);
    setEditError("");
  }

  function handleCancel() {
    setEditName(event.name);
    setEditDate(event.target.toISOString().slice(0, 10));
    setEditTime(event.target.toTimeString().slice(0, 8));
    setEditEndDate(event.stoppedAt ? event.stoppedAt.toISOString().slice(0, 10) : "");
    setEditEndTime(event.stoppedAt ? event.stoppedAt.toTimeString().slice(0, 8) : "");
    setEditError("");
    setEditing(false);
  }

  return (
    <div
      draggable
      {...dragHandlers}
      className="rounded-2xl p-4 cursor-grab active:cursor-grabbing"
      style={{
        background: isStopped ? "#171208" : "#1e293b",
        border:     `1px solid ${isStopped ? "#f59e0b66" : `${accent.border}55`}`,
        boxShadow:  `0 4px 24px ${ac.border}18`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <span className="text-slate-700 text-base select-none mt-0.5 shrink-0">⠿</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ background: ac.dot, boxShadow: `0 0 6px ${ac.dot}` }}
            />
            <span className="font-bold text-slate-100 text-sm truncate">{event.name}</span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide shrink-0"
              style={{
                border:     `1px solid ${isStopped ? "#f59e0b" : isPast ? "#10b981" : "#3b82f6"}`,
                color:      isStopped ? "#fcd34d" : isPast ? "#6ee7b7" : "#93c5fd",
                background: isStopped ? "#1c1407" : isPast ? "#064e3b" : "#1e3a5f",
              }}
            >
              {isStopped ? "stopped" : isPast ? "elapsed" : "countdown"}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 pl-4">
            <button
              onClick={() => setShowDate(v => !v)}
              className="text-slate-600 text-[10px] leading-none"
            >
              {showDate ? "▾" : "▸"}
            </button>
            {showDate && (
              <span className="text-[11px] text-slate-600">
                {isPast ? "Since" : "Until"} {formatDate(event.target)}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? "Expand" : "Collapse"}
            className="w-7 h-7 rounded-lg bg-slate-700 text-slate-400 flex items-center justify-center text-xs"
          >
            {collapsed ? "▼" : "▲"}
          </button>
          <button
            onClick={() => setEditing(v => !v)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              editing ? "bg-blue-900/50 text-blue-300" : "bg-slate-700 text-slate-400"
            }`}
          >
            <Pencil size={11} />
          </button>
          {isStopped ? (
            <button
              onClick={() => onResume(event.id)}
              title="Resume"
              className="w-7 h-7 rounded-lg bg-slate-700 text-emerald-400 flex items-center justify-center"
            >
              <RotateCcw size={11} />
            </button>
          ) : (
            <button
              onClick={() => onStop(event.id)}
              title="Stop"
              className="w-7 h-7 rounded-lg bg-slate-700 text-slate-400 flex items-center justify-center"
            >
              <Square size={11} />
            </button>
          )}
          <button
            onClick={() => onRemove(event.id)}
            title="Remove"
            className="w-7 h-7 rounded-lg bg-slate-700 text-slate-400 flex items-center justify-center"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Edit form */}
      {!collapsed && editing && (
        <form
          onSubmit={handleSave}
          className="mt-3 rounded-xl p-3 space-y-3"
          style={{ background: "#0f172a", border: `1px solid ${accent.border}33` }}
        >
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">
              Event name
            </label>
            <input
              autoFocus value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">Start date</label>
              <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm outline-none [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">Start time</label>
              <input type="time" step="1" value={editTime} onChange={e => setEditTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm outline-none [color-scheme:dark]" />
            </div>
          </div>
          <div className="border-t border-slate-700 pt-3">
            <p className="text-[10px] text-slate-500 mb-2">End — leave blank to keep running</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">End date</label>
                <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm outline-none [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">End time</label>
                <input type="time" step="1" value={editEndTime} onChange={e => setEditEndTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm outline-none [color-scheme:dark]" />
              </div>
            </div>
          </div>
          {editError && <p className="text-red-400 text-xs">{editError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg font-semibold text-sm text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
            >
              Save
            </button>
            <button
              type="button" onClick={handleCancel}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Unit display */}
      {!collapsed && <UnitBox5 elapsed={elapsed} accent={ac} />}

      {/* Stopped footer */}
      {!collapsed && isStopped && (
        <div className="flex items-center justify-end gap-1 mt-2">
          <button
            onClick={() => setShowStop(v => !v)}
            className="text-amber-800 text-[10px]"
          >
            {showStop ? "▾" : "▸"}
          </button>
          <span className="text-[11px] text-amber-700 font-semibold">
            ■ Stopped{showStop && ` ${formatDate(event.stoppedAt!)}`}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── AddEventForm ─────────────────────────────────────────────────────────────
function AddEventForm({
  nextId, onAdd, onCancel,
}: {
  nextId: number;
  onAdd:    (ev: TimerEvent) => void;
  onCancel: () => void;
}) {
  const now  = new Date();
  const dStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const [name,  setName]  = useState("");
  const [date,  setDate]  = useState(dStr);
  const [time,  setTime]  = useState("00:00:00");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Enter an event name."); return; }
    const parsed = new Date(`${date}T${time || "00:00:00"}`);
    if (isNaN(parsed.getTime())) { setError("Invalid date."); return; }
    onAdd({ id: nextId, name: name.trim(), target: parsed, stoppedAt: null });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/3 p-4 space-y-3"
    >
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Event</p>
      <input
        autoFocus placeholder="Event name" value={name}
        onChange={e => setName(e.target.value)}
        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5 text-slate-100 text-sm outline-none placeholder:text-slate-600"
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required
            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-slate-100 text-sm outline-none [color-scheme:dark]" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Time (opt)</label>
          <input type="time" step="1" value={time} onChange={e => setTime(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-slate-100 text-sm outline-none [color-scheme:dark]" />
        </div>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
        >
          Add Event
        </button>
        <button
          type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-xl bg-slate-700 text-slate-400 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── EventTracker (Supabase-synced event list) ────────────────────────────────
function EventTracker({ now }: { now: Date }) {
  const [events,     setEvents]     = useState<TimerEvent[]>([]);
  const [showForm,   setShowForm]   = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle"|"syncing"|"synced"|"error">("idle");
  const [orderTs,    setOrderTs]    = useState(0);
  const nextIdRef    = useRef(1);
  const pushTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragItem     = useRef<number | null>(null);
  const dragOver     = useRef<number | null>(null);
  const [dragging,   setDragging]   = useState<number | null>(null);
  const mounted      = useRef(false);

  // Load local + kick off cloud sync once on mount
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const local = loadLocalEvents();
    const ts    = loadLocalOrderTs();
    nextIdRef.current = local.reduce((m, e) => Math.max(m, e.id), 0) + 1;
    setEvents(local);
    setOrderTs(ts);
    syncFromCloud(local, ts);
  }, []); // eslint-disable-line

  useEffect(() => { saveLocalEvents(events); }, [events]);

  // Debounced push — 2 s after any change
  useEffect(() => {
    if (!mounted.current) return;
    clearTimeout(pushTimer.current!);
    pushTimer.current = setTimeout(() => pushToCloud(events, orderTs), 2000);
    return () => clearTimeout(pushTimer.current!);
  }, [events, orderTs]); // eslint-disable-line

  async function syncFromCloud(local: TimerEvent[], localTs: number) {
    setSyncStatus("syncing");
    try {
      const { events: remote, orderTs: remoteTs } = await fetchRemoteEvents();
      const merged = mergeEvents(local, remote, localTs, remoteTs);
      nextIdRef.current = merged.reduce((m, e) => Math.max(m, e.id), 0) + 1;
      setEvents(merged);
      if (remoteTs > localTs) { saveLocalOrderTs(remoteTs); setOrderTs(remoteTs); }
      setSyncStatus("synced");
    } catch { setSyncStatus("error"); }
  }

  async function pushToCloud(snap: TimerEvent[], ts: number) {
    setSyncStatus("syncing");
    try { await pushRemoteEvents(snap, ts); setSyncStatus("synced"); }
    catch { setSyncStatus("error"); }
  }

  function addEvent(ev: TimerEvent) {
    nextIdRef.current += 1;
    setEvents(prev => [ev, ...prev]);
    setShowForm(false);
  }
  function stopEvent(id: number) {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, stoppedAt: new Date() } : ev));
  }
  function resumeEvent(id: number) {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, stoppedAt: null } : ev));
  }
  function removeEvent(id: number) {
    setEvents(prev => prev.filter(ev => ev.id !== id));
  }
  function editEvent(id: number, changes: Partial<Pick<TimerEvent, "name" | "target" | "stoppedAt">>) {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, ...changes } : ev));
  }
  function handleDragEnd() {
    const from = dragItem.current;
    const to   = dragOver.current;
    if (from !== null && to !== null && from !== to) {
      setEvents(prev => {
        const copy = [...prev];
        const [moved] = copy.splice(from, 1);
        copy.splice(to, 0, moved);
        return copy;
      });
      const ts = Date.now();
      setOrderTs(ts);
      saveLocalOrderTs(ts);
    }
    dragItem.current = null;
    dragOver.current = null;
    setDragging(null);
  }

  const running = events.filter(e => e.stoppedAt === null).length;

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${
          syncStatus === "synced"  ? "text-emerald-500" :
          syncStatus === "syncing" ? "text-blue-400 animate-pulse" :
          syncStatus === "error"   ? "text-red-400" : "text-transparent"
        }`}>
          {syncStatus === "synced"  ? "✓ synced" :
           syncStatus === "syncing" ? "↻ syncing…" :
           syncStatus === "error"   ? "✕ sync error" : "."}
          {events.length > 0 && (
            <span className="text-slate-600 ml-2 font-normal">
              {running} running · {events.length - running} stopped
            </span>
          )}
        </span>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-white"
          style={{ background: showForm ? "#334155" : "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
        >
          {showForm ? <X size={12} /> : <Plus size={12} />}
          {showForm ? "Cancel" : "Add Event"}
        </button>
      </div>

      {showForm && (
        <AddEventForm
          nextId={nextIdRef.current}
          onAdd={addEvent}
          onCancel={() => setShowForm(false)}
        />
      )}

      {events.length === 0 && !showForm && (
        <div className="text-center py-8 rounded-2xl border border-dashed border-slate-700 text-slate-600">
          <div className="text-2xl mb-2">⏱</div>
          <p className="text-sm font-medium text-slate-600">No events yet</p>
          <p className="text-xs mt-1">Track anything — runs, milestones, dates</p>
        </div>
      )}

      {events.map((ev, i) => (
        <div
          key={ev.id}
          style={{ opacity: dragging === i ? 0.4 : 1, transition: "opacity 0.15s" }}
        >
          <EventCard
            event={ev} now={now}
            accent={ACCENT_COLORS[i % ACCENT_COLORS.length]}
            onStop={stopEvent} onResume={resumeEvent}
            onRemove={removeEvent} onEdit={editEvent}
            dragHandlers={{
              onDragStart: () => { dragItem.current = i; setDragging(i); },
              onDragEnter: () => { dragOver.current = i; },
              onDragOver:  (e) => e.preventDefault(),
              onDragEnd:   handleDragEnd,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Timers (exported, rendered inside Dashboard Timers tab) ──────────────────
export default function Timers() {
  const [now,        setNow]        = useState(new Date());
  const [planOpen,   setPlanOpen]   = useState(true);
  const [eventsOpen, setEventsOpen] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-1">
      <Section
        title="Plan Milestones"
        open={planOpen}
        onToggle={() => setPlanOpen(v => !v)}
      >
        <PlanCountdowns now={now} />
      </Section>

      <div className="border-t border-white/5 my-2" />

      <Section
        title="My Events"
        open={eventsOpen}
        onToggle={() => setEventsOpen(v => !v)}
      >
        <EventTracker now={now} />
      </Section>
    </div>
  );
}
