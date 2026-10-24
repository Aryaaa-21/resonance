import type { Metadata } from "next";
import RouteConsolePage from "@/components/layout/route-console-page";

export const metadata: Metadata = { title: "Resonance Intelligence — RESONANCE", description: "Review advisory anomaly analysis in the RESONANCE demo console." };

export default function AgentPage() {
  return <RouteConsolePage initialView="agent" />;
}
