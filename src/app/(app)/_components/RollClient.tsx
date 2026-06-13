"use client";

import { useState } from "react";
import type { CoinKind, Profile } from "@/lib/types";
import { copperChance } from "@/lib/types";
import { localDay } from "@/lib/day";
import { roll, spendViceCoin } from "../actions";

const COIN = {
  gold: { emoji: "🪙", name: "Gold", color: "var(--color-gold)" },
  vice: { emoji: "🔮", name: "Vice", color: "var(--color-vice)" },
  copper: { emoji: "🟤", name: "Copper", color: "var(--color-copper)" },
} as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function RollClient({ initial }: { initial: Profile }) {
  const [profile, setProfile] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [building, setBuilding] = useState(false);
  const [reveals, setReveals] = useState<(CoinKind | null)[]>([]);
  const [status, setStatus] = useState<string>("");

  async function doRoll(count: 1 | 10) {
    if (busy || profile.tickets < count) return;
    setBusy(true);
    setStatus("");
    setReveals(Array(count).fill(null));

    let res;
    try {
      res = await roll(count, localDay());
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Roll failed");
      setReveals([]);
      setBusy(false);
      return;
    }

    // Reveal one per second: ~700ms of tension, then the coin pops in.
    for (let i = 0; i < res.results.length; i++) {
      setBuilding(true);
      await sleep(700);
      setBuilding(false);
      setReveals((prev) => {
        const next = [...prev];
        next[i] = res.results[i];
        return next;
      });
      await sleep(300);
    }

    setProfile(res.profile);
    if (res.rollovers > 0) {
      setStatus(
        `${res.rollovers} copper rollover${res.rollovers === 1 ? "" : "s"} → +${res.rollovers} vice coin${res.rollovers === 1 ? "" : "s"}!`,
      );
    }
    setBusy(false);
  }

  async function useVice() {
    if (busy || profile.vice_coins < 1) return;
    setBusy(true);
    try {
      const p = await spendViceCoin();
      setProfile(p);
      setStatus("You earned this. Enjoy it. 🎉");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "No vice coins");
    }
    setBusy(false);
  }

  return (
    <main className="flex flex-1 flex-col px-5 pb-6 pt-7">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-[var(--color-leaf-bright)]">
          Gachapon
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {profile.tickets} ticket{profile.tickets === 1 ? "" : "s"} ready
        </p>
      </header>

      {/* Coin balances */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {(["gold", "vice", "copper"] as CoinKind[]).map((k) => (
          <div
            key={k}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center"
          >
            <div className="text-2xl">{COIN[k].emoji}</div>
            <div className="text-lg font-bold">
              {k === "gold"
                ? profile.gold_coins
                : k === "vice"
                  ? profile.vice_coins
                  : profile.copper_coins}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
              {COIN[k].name}
            </div>
          </div>
        ))}
      </div>

      {/* Roll stage */}
      <div className="mb-5 flex min-h-44 flex-1 items-center justify-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {reveals.length === 0 ? (
          <div
            className={`text-6xl ${building ? "anim-shake" : ""}`}
            aria-hidden
          >
            🎁
          </div>
        ) : (
          <div
            className={`grid gap-3 ${reveals.length > 1 ? "grid-cols-5" : "grid-cols-1"}`}
          >
            {reveals.map((r, i) => (
              <div
                key={i}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                  r === null
                    ? `bg-[var(--color-surface-2)] ${building ? "anim-shake" : ""}`
                    : "anim-pop"
                }`}
                style={r ? { background: COIN[r].color + "33" } : undefined}
              >
                {r === null ? "❔" : COIN[r].emoji}
              </div>
            ))}
          </div>
        )}
      </div>

      {status && (
        <p className="mb-3 text-center text-sm font-medium text-[var(--color-leaf-bright)]">
          {status}
        </p>
      )}

      {/* Roll buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => doRoll(1)}
          disabled={busy || profile.tickets < 1}
          className="rounded-2xl bg-[var(--color-leaf)] py-4 font-bold text-[var(--color-bg)] active:scale-95 disabled:opacity-40"
        >
          Roll ×1
        </button>
        <button
          onClick={() => doRoll(10)}
          disabled={busy || profile.tickets < 10}
          className="rounded-2xl bg-[var(--color-leaf-bright)] py-4 font-bold text-[var(--color-bg)] active:scale-95 disabled:opacity-40"
        >
          Roll ×10
        </button>
      </div>

      <button
        onClick={useVice}
        disabled={busy || profile.vice_coins < 1}
        className="mt-3 rounded-2xl border border-[var(--color-vice)] py-3 font-semibold text-[var(--color-vice)] active:scale-95 disabled:opacity-40"
      >
        Spend a Vice Coin 🔮
      </button>

      <p className="mt-4 text-center text-[11px] text-[var(--color-muted)]">
        Odds — Gold {profile.gold_chance}% · Vice {profile.vice_chance}% · Copper{" "}
        {copperChance(profile).toFixed(1)}% ({profile.copper_rollover} copper → 1
        vice)
      </p>
    </main>
  );
}
