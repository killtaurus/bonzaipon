"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PresetTask, Profile } from "@/lib/types";
import { copperChance } from "@/lib/types";
import { signOut } from "@/app/login/actions";
import {
  addPreset,
  archivePreset,
  renamePreset,
  updateSettings,
} from "../actions";

export function SettingsClient({
  profile,
  presets,
  email,
}: {
  profile: Profile;
  presets: PresetTask[];
  email: string;
}) {
  const [gold, setGold] = useState(String(profile.gold_chance));
  const [vice, setVice] = useState(String(profile.vice_chance));
  const [rollover, setRollover] = useState(String(profile.copper_rollover));
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  const goldN = parseFloat(gold) || 0;
  const viceN = parseFloat(vice) || 0;
  const copper = Math.max(0, 100 - goldN - viceN);
  const invalid = goldN < 0 || viceN < 0 || goldN + viceN > 100;

  function save() {
    setErr("");
    if (invalid) {
      setErr("Gold + Vice must be between 0 and 100%.");
      return;
    }
    startTransition(async () => {
      await updateSettings({
        gold_chance: goldN,
        vice_chance: viceN,
        copper_rollover: Math.max(1, parseInt(rollover) || 1),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  // Preset editing
  const [newLabel, setNewLabel] = useState("");
  const router = useRouter();

  return (
    <main className="flex flex-1 flex-col px-5 pb-6 pt-7">
      <h1 className="mb-5 text-2xl font-bold text-[var(--color-leaf-bright)]">
        Settings
      </h1>

      {/* Lootbox odds */}
      <section className="mb-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Lootbox odds
        </h2>

        <Field label="Gold coin chance (%)" value={gold} onChange={setGold} />
        <Field label="Vice coin chance (%)" value={vice} onChange={setVice} />
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-[var(--color-muted)]">
            Copper coin chance (auto)
          </span>
          <span className="font-semibold">{copper.toFixed(1)}%</span>
        </div>
        <Field
          label="Copper coins per vice coin"
          value={rollover}
          onChange={setRollover}
          step={1}
        />

        {err && <p className="mb-2 text-sm text-[var(--color-vice)]">{err}</p>}
        <button
          onClick={save}
          disabled={pending}
          className="mt-1 w-full rounded-xl bg-[var(--color-leaf)] py-3 font-semibold text-[var(--color-bg)] disabled:opacity-50"
        >
          {saved ? "Saved ✓" : pending ? "Saving…" : "Save odds"}
        </button>
      </section>

      {/* Preset tasks */}
      <section className="mb-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Preset tasks
        </h2>
        <ul className="mb-3 space-y-2">
          {presets.map((p) => (
            <PresetRow key={p.id} preset={p} />
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="New task…"
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 outline-none focus:border-[var(--color-leaf)]"
          />
          <button
            onClick={() => {
              const l = newLabel.trim();
              if (!l) return;
              setNewLabel("");
              startTransition(async () => {
                await addPreset(l);
                router.refresh();
              });
            }}
            className="rounded-xl bg-[var(--color-leaf)] px-4 font-semibold text-[var(--color-bg)]"
          >
            Add
          </button>
        </div>
      </section>

      {/* Account */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Account
        </h2>
        <p className="mb-3 text-sm text-[var(--color-muted)]">{email}</p>
        <form action={signOut}>
          <button className="w-full rounded-xl border border-[var(--color-border)] py-3 font-medium">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  step = 0.1,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: number;
}) {
  return (
    <label className="mb-3 flex items-center justify-between gap-3 text-sm">
      <span className="text-[var(--color-muted)]">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-right outline-none focus:border-[var(--color-leaf)]"
      />
    </label>
  );
}

function PresetRow({ preset }: { preset: PresetTask }) {
  const [label, setLabel] = useState(preset.label);
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <li className="flex items-center gap-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => {
          const l = label.trim();
          if (l && l !== preset.label) {
            startTransition(async () => {
              await renamePreset(preset.id, l);
              router.refresh();
            });
          }
        }}
        className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--color-leaf)]"
      />
      <button
        onClick={() =>
          startTransition(async () => {
            await archivePreset(preset.id);
            router.refresh();
          })
        }
        className="px-2 text-[var(--color-muted)] active:text-[var(--color-vice)]"
        aria-label="Remove task"
      >
        ✕
      </button>
    </li>
  );
}
