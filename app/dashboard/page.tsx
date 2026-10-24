import type { Metadata } from "next";
import RouteConsolePage from "@/components/layout/route-console-page";

export const metadata: Metadata = { title: "Dashboard — RESONANCE", description: "Mission control for simulated RESONANCE verification activity." };

export default function DashboardPage() {
  return <RouteConsolePage initialView="dashboard" />;
}
