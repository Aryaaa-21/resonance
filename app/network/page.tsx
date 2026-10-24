import type { Metadata } from "next";
import RouteConsolePage from "@/components/layout/route-console-page";

export const metadata: Metadata = { title: "Network — RESONANCE", description: "Explore the simulated RESONANCE witness network." };

export default function NetworkPage() {
  return <RouteConsolePage initialView="network" />;
}
