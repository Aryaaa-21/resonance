import type { Metadata } from "next";
import RouteConsolePage from "@/components/layout/route-console-page";

export const metadata: Metadata = { title: "Challenges — RESONANCE", description: "Review application-level dispute notes; protocol challenge transactions are not wired here." };

export default function ChallengesPage() {
  return <RouteConsolePage initialView="challenges" />;
}
