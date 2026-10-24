import type { Metadata } from "next";
import RouteConsolePage from "@/components/layout/route-console-page";

export const metadata: Metadata = { title: "Staking — RESONANCE", description: "Review the RESONANCE staking boundary without claiming balances, rewards, or slashing." };

export default function StakingPage() {
  return <RouteConsolePage initialView="staking" />;
}
