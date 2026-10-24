import type { Metadata } from "next";
import RouteConsolePage from "@/components/layout/route-console-page";

export const metadata: Metadata = { title: "Events — RESONANCE", description: "Explore simulated RESONANCE verification requests." };

export default function EventsPage() {
  return <RouteConsolePage initialView="events" />;
}
