"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PresetTask, TaskCompletion } from "@/lib/types";
import { completeTask, deleteCompletion } from "../actions";

export function TodayClient({
  presets,
  completions,
  tickets,
}: {
  presets: PresetTask[];
  completions: TaskCompletion[];
  tickets: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modalTask, setModalTask] = useState<PresetTask | null>(null);
  const [note, setNote] = useState("");
  const [showLog, setShowLog] = useState(false);

  const dailyCount = completions.length;

  function openTask(task: PresetTask) {
    setNote("");
    setModalTask(task);
  }

  function confirm() {
    if (!modalTask) return;
    const task = modalTask;
    const n = note;
    setModalTask(null);
    startTransition(async () => {
      await completeTask(task.id, n);
      router.refresh();
    });
  }

  return (
    <main className="flex flex-1 flex-col px-5 pb-6 pt-7">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-leaf-bright)]">
            Today
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            {dailyCount} task{dailyCount === 1 ? "" : "s"} done · banking{" "}
            {dailyCount} ticket{dailyCount === 1 ? "" : "s"} tonight
          </p>
        </div>
        <div className="rounded-xl bg-[var(--color-surface)] px-3 py-2 text-center">
          <div className="text-lg font-bold">{tickets}</div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
            tickets
          </div>
        </div>
      </header>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        Tap to check off
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {presets.map((task) => (
          <button
            key={task.id}
            onClick={() => openTask(task)}
            disabled={pending}
            className="min-h-20 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left text-sm font-medium leading-snug active:scale-95 disabled:opacity-50"
          >
            {task.label}
          </button>
        ))}
        {presets.length === 0 && (
          <p className="col-span-2 text-sm text-[var(--color-muted)]">
            No preset tasks yet. Add some in Settings.
          </p>
        )}
      </div>

      <button
        onClick={() => setShowLog((s) => !s)}
        className="mt-7 self-start text-sm font-medium text-[var(--color-leaf-bright)]"
      >
        {showLog ? "Hide today's log" : `Review today's log (${dailyCount})`}
      </button>

      {showLog && (
        <ul className="mt-3 space-y-2">
          {completions.map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-[var(--color-surface)] px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium">{c.label}</div>
                {c.note && (
                  <div className="mt-0.5 text-xs text-[var(--color-muted)]">
                    “{c.note}”
                  </div>
                )}
              </div>
              <button
                onClick={() =>
                  startTransition(async () => {
                    await deleteCompletion(c.id);
                    router.refresh();
                  })
                }
                className="shrink-0 text-xs text-[var(--color-muted)] active:text-[var(--color-vice)]"
                aria-label="Remove"
              >
                ✕
              </button>
            </li>
          ))}
          {completions.length === 0 && (
            <li className="text-sm text-[var(--color-muted)]">
              Nothing logged yet today.
            </li>
          )}
        </ul>
      )}

      {/* Note modal */}
      {modalTask && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
            <h3 className="text-lg font-semibold">{modalTask.label}</h3>
            <p className="mb-3 text-sm text-[var(--color-muted)]">
              Add a note (optional) — what was it?
            </p>
            <input
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirm()}
              placeholder="e.g. paid bills"
              className="mb-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:border-[var(--color-leaf)]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setModalTask(null)}
                className="flex-1 rounded-xl border border-[var(--color-border)] py-3 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                className="flex-1 rounded-xl bg-[var(--color-leaf)] py-3 font-semibold text-[var(--color-bg)]"
              >
                Check off
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
