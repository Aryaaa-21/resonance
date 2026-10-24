import type { Metadata } from "next";
import WitnessDetailClient from "./witness-detail-client";

export const metadata: Metadata = {
  title: "Witness profile — RESONANCE",
  description: "Inspect a RESONANCE witness profile, reputation, and application participation history.",
};

export default async function WitnessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WitnessDetailClient id={id} />;
}
