"use client";

import { useState } from "react";
import { Mode } from "@/lib/modes";
import Dashboard from "./components/Dashboard";
import ModeSession from "./components/ModeSession";

export default function Home() {
  const [activeMode, setActiveMode] = useState<Mode | null>(null);

  if (activeMode) {
    return (
      <ModeSession
        mode={activeMode}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  return <Dashboard onSelect={setActiveMode} />;
}
