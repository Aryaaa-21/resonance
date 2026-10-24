import type { Metadata } from "next";
import RouteConsolePage from "@/components/layout/route-console-page";

export const metadata: Metadata = { title: "Create verification request — RESONANCE", description: "Configure an application-level RESONANCE verification request." };

export default function CreateEventPage() {
  return <RouteConsolePage initialView="request" />;
}
