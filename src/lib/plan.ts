export const PLAN_START = new Date("2026-04-19T00:00:00");

export type Phase = 1 | 2 | 3;

const WEEKDAY_SUBJECTS: Record<number, string> = {
  0: "GRE Deep / Project Review",
  1: "SQL",
  2: "GRE Quant",
  3: "Python",
  4: "GRE Verbal",
  5: "SQL + Project",
  6: "GRE Deep",
};

const PHASE_TASK: Record<Phase, Record<string, string>> = {
  1: {
    "SQL": "SQLBolt — SELECT, JOIN, GROUP BY. Type every query.",
    "GRE Quant": "Khan Academy — arithmetic, algebra, geometry fundamentals",
    "Python": "Automate the Boring Stuff — syntax, lists, functions",
    "GRE Verbal": "Magoosh Anki 10 new cards + 1 RC passage",
    "SQL + Project": "SQLBolt review + Mode SQL Tutorial intro",
    "GRE Deep": "ETS PowerPrep section or GregMat full quant walkthrough",
    "GRE Deep / Project Review": "Sunday: Obsidian weekly review + plan next week",
  },
  2: {
    "SQL": "Window functions + CTEs — DataLemur easy-medium",
    "GRE Quant": "Statistics + Data Interpretation — GregMat or ETS quant",
    "Python": "Web scraping — requests + BeautifulSoup, scrape a real site",
    "GRE Verbal": "Text completion + RC — GregMat verbal strategy",
    "SQL + Project": "DataLemur medium + real Postgres dataset queries",
    "GRE Deep": "Full mock section or GRE Math Review PDF sets",
    "GRE Deep / Project Review": "Sunday: Obsidian weekly review + next week plan",
  },
  3: {
    "SQL": "Portfolio project — Strava data queries, DataLemur hard",
    "GRE Quant": "Mock quant under timed conditions — 320+ pacing",
    "Python": "Automation project — email reports or job scraper",
    "GRE Verbal": "Full verbal section under timed conditions",
    "SQL + Project": "Portfolio polish + DataLemur hard",
    "GRE Deep": "Full GRE mock — Day 75 decision tree evaluation",
    "GRE Deep / Project Review": "Sunday: Day 75 checkpoint if applicable + weekly review",
  },
};

export function getPlanDay(): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.floor((Date.now() - PLAN_START.getTime()) / msPerDay) + 1);
}

export function getPhase(day: number): Phase {
  if (day <= 30) return 1;
  if (day <= 60) return 2;
  return 3;
}

export function getPhaseName(phase: Phase): string {
  return (["", "Foundations", "Application", "Integration"] as const)[phase];
}

export function getTodaySubject(): string {
  return WEEKDAY_SUBJECTS[new Date().getDay()];
}

export function getTodayTask(phase: Phase): string {
  const subject = getTodaySubject();
  return PHASE_TASK[phase][subject] ?? `${subject} — study session`;
}

export interface MissionSummary {
  day: number;
  phase: Phase;
  phaseName: string;
  subject: string;
  task: string;
}

export function getMissionSummary(): MissionSummary {
  const day = getPlanDay();
  const phase = getPhase(day);
  return {
    day,
    phase,
    phaseName: getPhaseName(phase),
    subject: getTodaySubject(),
    task: getTodayTask(phase),
  };
}
