import type { Metadata } from "next";
import RouteConsolePage from "@/components/layout/route-console-page";

export const metadata: Metadata = { title: "Witnesses — RESONANCE", description: "Explore API-backed witness reputation and application participation." };

export default function WitnessesPage() {
  return <RouteConsolePage initialView="witnesses" />;
}
