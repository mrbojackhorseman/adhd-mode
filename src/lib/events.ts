// ─── Types ────────────────────────────────────────────────────────────────────
export interface TimerEvent {
  id: number;
  name: string;
  target: Date;
  stoppedAt: Date | null;
}

// ─── Supabase config (anon key — public by design, safe to hardcode) ─────────
const SB_URL  = "https://jmquzjacvsdwfbklplex.supabase.co";
const SB_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptcXV6amFjdnNkd2Zia2xwbGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjA5NDksImV4cCI6MjA4ODc5Njk0OX0.t6pH8GRTurU-uo_Dym9kZ51yBB5bPASdn5MCrwM-PJU";
const SB_USER = "godfrey";

// ─── localStorage keys — identical to tvc-timer so data carries over ─────────
const EVENTS_KEY   = "time-tracker-events";
const ORDER_TS_KEY = "time-tracker-order-ts";

// ─── Parse raw JSON → typed events ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEvents(raw: any[]): TimerEvent[] {
  return raw.map(ev => ({
    ...ev,
    target:    new Date(ev.target),
    stoppedAt: ev.stoppedAt ? new Date(ev.stoppedAt) : null,
  }));
}

// ─── localStorage ─────────────────────────────────────────────────────────────
export function loadLocalEvents(): TimerEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    return parseEvents(JSON.parse(raw));
  } catch { return []; }
}

export function saveLocalEvents(events: TimerEvent[]) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function loadLocalOrderTs(): number {
  return parseInt(localStorage.getItem(ORDER_TS_KEY) ?? "0", 10);
}

export function saveLocalOrderTs(ts: number) {
  localStorage.setItem(ORDER_TS_KEY, String(ts));
}

// ─── Supabase REST helpers ────────────────────────────────────────────────────
function sbHeaders() {
  return {
    apikey:          SB_KEY,
    Authorization:   `Bearer ${SB_KEY}`,
    "Content-Type":  "application/json",
  };
}

export async function fetchRemoteEvents(): Promise<{ events: TimerEvent[]; orderTs: number }> {
  const res = await fetch(
    `${SB_URL}/rest/v1/timer_data?user_id=eq.${encodeURIComponent(SB_USER)}&select=events,order_ts`,
    { headers: sbHeaders() },
  );
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  if (!data.length) return { events: [], orderTs: 0 };
  return {
    events:  parseEvents(data[0].events ?? []),
    orderTs: data[0].order_ts ?? 0,
  };
}

export async function pushRemoteEvents(events: TimerEvent[], orderTs: number): Promise<void> {
  const res = await fetch(`${SB_URL}/rest/v1/timer_data`, {
    method:  "POST",
    headers: { ...sbHeaders(), Prefer: "resolution=merge-duplicates" },
    body:    JSON.stringify({ user_id: SB_USER, events, order_ts: orderTs }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
}

// ─── Merge — canonical order = whichever side has newer drag timestamp ────────
export function mergeEvents(
  local:         TimerEvent[],
  remote:        TimerEvent[],
  localOrderTs:  number,
  remoteOrderTs: number,
): TimerEvent[] {
  const useRemote   = remoteOrderTs > localOrderTs;
  const canonical   = useRemote ? remote : local;
  const other       = useRemote ? local  : remote;
  const allById: Record<string, TimerEvent> = {};
  [...local, ...remote].forEach(ev => { allById[String(ev.id)] = ev; });
  const canonicalIds = new Set(canonical.map(ev => String(ev.id)));
  const merged = canonical.map(ev => allById[String(ev.id)]);
  other.forEach(ev => { if (!canonicalIds.has(String(ev.id))) merged.push(ev); });
  return merged;
}

// ─── Diff (years / days / hours / minutes / seconds) ─────────────────────────
export function calcDiff(from: Date, to: Date) {
  const totalSeconds = Math.floor(Math.abs(to.getTime() - from.getTime()) / 1000);
  const seconds      = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes      = totalMinutes % 60;
  const totalHours   = Math.floor(totalMinutes / 60);
  const hours        = totalHours % 24;
  const totalDays    = Math.floor(totalHours / 24);
  const years        = Math.floor(totalDays / 365.25);
  const days         = Math.floor(totalDays % 365.25);
  return { years, days, hours, minutes, seconds };
}

export function formatDate(d: Date) {
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

// ─── Accent palette (same order as tvc-timer) ────────────────────────────────
export const ACCENT_COLORS = [
  { border: "#6366f1", text: "#a5b4fc", dot: "#6366f1" },
  { border: "#10b981", text: "#6ee7b7", dot: "#10b981" },
  { border: "#f97316", text: "#fdba74", dot: "#f97316" },
  { border: "#8b5cf6", text: "#c4b5fd", dot: "#8b5cf6" },
  { border: "#3b82f6", text: "#93c5fd", dot: "#3b82f6" },
  { border: "#ec4899", text: "#f9a8d4", dot: "#ec4899" },
] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number];
export const STOPPED_ACCENT = { border: "#f59e0b", text: "#fcd34d", dot: "#f59e0b" };
