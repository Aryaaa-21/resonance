"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppView } from "@/components/resonance-data";
import ResonanceConsole from "@/components/resonance-console";

type RouteConsolePageProps = {
  initialView: AppView;
  selectedEventId?: string;
};

const routes: Partial<Record<AppView, string>> = {
  dashboard: "/dashboard",
  events: "/events",
  witnesses: "/witnesses",
  challenges: "/challenges",
  network: "/network",
  staking: "/staking",
  agent: "/agent",
  settings: "/settings",
  request: "/events/create",
};

export default function RouteConsolePage({ initialView, selectedEventId = "8271" }: RouteConsolePageProps) {
  const router = useRouter();
  const selectedEventRef = useRef(selectedEventId);
  const [activeEventId, setActiveEventId] = useState(selectedEventId);
  const [wizardStep, setWizardStep] = useState(0);
  const [currentView, setCurrentView] = useState<AppView>(initialView);

  function navigate(view: AppView) {
    if (view === "event") {
      router.push(`/events/${selectedEventRef.current}`);
      return;
    }
    const path = routes[view];
    if (path) {
      setCurrentView(view);
      router.push(path);
    }
  }

  return (
    <ResonanceConsole
      activeView={currentView}
      selectedEventId={activeEventId}
      wizardStep={wizardStep}
      onBack={() => router.push("/")}
      onViewChange={navigate}
      onSelectEvent={(id) => { selectedEventRef.current = id; setActiveEventId(id); }}
      onWizardStepChange={setWizardStep}
    />
  );
}
