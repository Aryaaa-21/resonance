"use client";

import { useRouter } from "next/navigation";
import ResonanceLanding from "./resonance-landing";

export function ResonanceApp() {
  const router = useRouter();

  return (
    <ResonanceLanding
      onOpenConsole={(view = "dashboard") => {
        router.push(view === "request" ? "/events/create" : view === "network" ? "/network" : "/dashboard");
      }}
    />
  );
}

export default ResonanceApp;
