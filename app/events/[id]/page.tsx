import type { Metadata } from "next";
import RouteConsolePage from "@/components/layout/route-console-page";

export const metadata: Metadata = { title: "Event detail — RESONANCE", description: "Inspect application evidence, witness records, and explicit protocol publication status for a RESONANCE event." };

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RouteConsolePage initialView="event" selectedEventId={id.replace("evt_", "")} />;
}
