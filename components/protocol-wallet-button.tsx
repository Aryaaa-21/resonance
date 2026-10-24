"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ChevronDown, WalletCards } from "lucide-react";

function shorten(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function ProtocolWalletButton() {
  const { connected, connecting, publicKey, wallet, wallets, connect, disconnect, select } = useWallet();
  const label = connecting ? "Connecting" : connected && publicKey ? shorten(publicKey.toBase58()) : "Connect wallet";
  const detail = connected && wallet ? wallet.adapter.name : "Solana devnet";

  async function toggle() {
    if (connected) {
      await disconnect();
      return;
    }
    if (!wallet && wallets[0]) {
      select(wallets[0].adapter.name);
    }
    await connect();
  }

  return (
    <button className="wallet-chip" type="button" onClick={() => void toggle()} disabled={connecting} aria-label={connected ? `Disconnect ${label}` : "Connect Solana wallet"}>
      <span className="wallet-chip__status" />
      <WalletCards size={14} aria-hidden="true" />
      <span className="wallet-chip__address">{label}</span>
      <span className="wallet-chip__balance">{detail}</span>
      <ChevronDown size={14} aria-hidden="true" />
    </button>
  );
}
