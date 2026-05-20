"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, RotateCcw, Clock } from "lucide-react";
import { Mode } from "@/lib/modes";
import { saveSession } from "@/lib/history";
import MarkdownRenderer from "./MarkdownRenderer";

interface Props {
  mode: Mode;
  onBack: () => void;
}

export default function ModeSession({ mode, onBack }: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [checkInDue, setCheckInDue] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  const isBodyDouble = mode.id === "bodydouble";

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => {
        setTimer((t) => {
          const next = t + 1;
          if (next % 600 === 0) setCheckInDue(true);
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive]);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const minutesElapsed = Math.floor(timer / 60);
  const minutesLeft = 30 - minutesElapsed;

  const submit = async (extraInputs?: Record<string, string>) => {
    const isInitialSubmit = !extraInputs;
    const payload = extraInputs ?? inputs;
    setLoading(true);
    setResponse("");
    setCheckInDue(false);

    try {
      const res = await fetch("/api/adhd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modeId: mode.id, inputs: payload }),
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setResponse(accumulated);
      }

      setSubmitted(true);

      if (isInitialSubmit) {
        saveSession({
          modeId: mode.id,
          modeTitle: mode.title,
          modeEmoji: mode.emoji,
          inputs: payload,
          response: accumulated,
        });
      }

      if (isBodyDouble && isInitialSubmit) {
        setTimerActive(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setInputs({});
    setResponse("");
    setSubmitted(false);
    setLoading(false);
    setTimer(0);
    setTimerActive(false);
    setCheckInDue(false);
  };

  const allFilled = mode.inputs.every((f) => inputs[f.key]?.trim());

  return (
    <div className="session-container min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0a0f]">
      {/* Header */}
      <div className="session-header flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-3">
          <span className="text-lg">{mode.emoji}</span>
          <span className="text-sm font-medium text-gray-800 dark:text-slate-200">{mode.title}</span>
        </div>

        {isBodyDouble && timerActive && (
          <div
            className={`flex items-center gap-2 text-sm font-mono px-3 py-1.5 rounded-full border ${
              checkInDue
                ? "bg-orange-500/20 border-orange-500/50 text-orange-600 dark:text-orange-300 animate-pulse"
                : minutesLeft <= 5
                ? "bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-300"
                : "bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-blue-300"
            }`}
          >
            <Clock size={13} />
            {checkInDue ? "Check-in!" : formatTime(timer)}
            {!checkInDue && (
              <span className="text-xs opacity-60">{minutesLeft}m left</span>
            )}
          </div>
        )}

        {!isBodyDouble && <div className="w-20" />}
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-5 py-8 gap-6">
        {/* Input form */}
        {!submitted && (
          <div className="animate-slide-up space-y-5">
            <p className="text-gray-500 dark:text-slate-400 text-sm">{mode.tagline}</p>

            {mode.inputs.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {field.label}
                </label>
                {field.multiline ? (
                  <textarea
                    className="session-input w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/25 focus:bg-white/8 transition-all resize-none min-h-[120px]"
                    placeholder={field.placeholder}
                    value={inputs[field.key] ?? ""}
                    onChange={(e) =>
                      setInputs((p) => ({ ...p, [field.key]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && allFilled) {
                        submit();
                      }
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    className="session-input w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/25 focus:bg-white/8 transition-all"
                    placeholder={field.placeholder}
                    value={inputs[field.key] ?? ""}
                    onChange={(e) =>
                      setInputs((p) => ({ ...p, [field.key]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && allFilled) submit();
                    }}
                  />
                )}
              </div>
            ))}

            <button
              onClick={() => submit()}
              disabled={!allFilled || loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm bg-gray-900 text-white dark:bg-white dark:text-black hover:bg-gray-700 dark:hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send size={14} />
              {loading ? "Thinking..." : "Get my plan"}
            </button>

            <p className="text-xs text-gray-400 dark:text-slate-600">⌘↵ to submit</p>
          </div>
        )}

        {/* Response */}
        {(response || loading) && (
          <div
            ref={responseRef}
            className={`session-response rounded-2xl border p-6 space-y-2 overflow-auto max-h-[60vh] animate-fade-in ${mode.borderColor} bg-white/3`}
          >
            {loading && !response && (
              <div className="flex gap-1 items-center text-slate-500 text-sm">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse delay-75">●</span>
                <span className="animate-pulse delay-150">●</span>
              </div>
            )}
            {response && <MarkdownRenderer content={response} />}
          </div>
        )}

        {/* Body double check-in prompt */}
        {isBodyDouble && checkInDue && submitted && (
          <CheckIn
            minutesElapsed={minutesElapsed}
            onSubmit={(update) => {
              submit({
                ...inputs,
                task: `${inputs.task}\n\n---\n[CHECK-IN at ${minutesElapsed} min]\nUser update: ${update}\nTime remaining: ~${minutesLeft} minutes`,
              });
            }}
          />
        )}

        {/* Reset */}
        {submitted && !checkInDue && (
          <button
            onClick={reset}
            className="flex items-center gap-2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 text-sm transition-colors self-start"
          >
            <RotateCcw size={13} />
            Start over
          </button>
        )}
      </div>
    </div>
  );
}

function CheckIn({
  minutesElapsed,
  onSubmit,
}: {
  minutesElapsed: number;
  onSubmit: (update: string) => void;
}) {
  const [update, setUpdate] = useState("");

  return (
    <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-5 space-y-3 animate-slide-up">
      <p className="text-orange-600 dark:text-orange-300 font-medium text-sm">
        ⏰ {minutesElapsed}-minute check-in
      </p>
      <textarea
        className="session-input w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition-all resize-none min-h-[80px]"
        placeholder="What have you done so far? What are you stuck on?"
        value={update}
        onChange={(e) => setUpdate(e.target.value)}
      />
      <button
        onClick={() => onSubmit(update)}
        disabled={!update.trim()}
        className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        Submit check-in
      </button>
    </div>
  );
}
