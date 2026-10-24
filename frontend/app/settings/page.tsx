import type { Metadata } from "next";
import RouteConsolePage from "@/components/layout/route-console-page";

export const metadata: Metadata = { title: "Settings — RESONANCE", description: "Configure simulated RESONANCE request and network defaults." };

export default function SettingsPage() {
  return <RouteConsolePage initialView="settings" />;
}
