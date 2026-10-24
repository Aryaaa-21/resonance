import type { Metadata } from "next";
import AppProviders from "@/components/layout/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "RESONANCE — Prove real-world events",
  description: "A decentralized protocol for cryptographically verifiable real-world events.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
