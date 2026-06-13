import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

const MILESTONE = 1000; // grains per jar before the next jar starts filling

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("running_total, current_streak, highest_streak")
    .eq("id", user!.id)
    .single<Pick<Profile, "running_total" | "current_streak" | "highest_streak">>();

  const total = profile?.running_total ?? 0;
  const inJar = total % MILESTONE;
  const fill = inJar / MILESTONE; // 0..1
  const jarsFilled = Math.floor(total / MILESTONE);

  // Jar geometry for the SVG fill.
  const jarTop = 30;
  const jarBottom = 250;
  const jarHeight = jarBottom - jarTop;
  const fillY = jarBottom - fill * jarHeight;

  return (
    <main className="flex flex-1 flex-col px-5 pb-6 pt-7">
      <h1 className="mb-1 text-2xl font-bold text-[var(--color-leaf-bright)]">
        Progress
      </h1>
      <p className="mb-5 text-sm text-[var(--color-muted)]">
        Every task you’ve ever completed, as grains of sand.
      </p>

      <div className="flex flex-col items-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <svg viewBox="0 0 200 280" className="h-64 w-auto" role="img">
          <defs>
            <clipPath id="jar">
              <path d="M60 30 h80 v10 a40 40 0 0 1 -10 26 v150 a30 30 0 0 1 -30 30 h0 a30 30 0 0 1 -30 -30 v-150 a40 40 0 0 1 -10 -26 z" />
            </clipPath>
          </defs>

          {/* sand fill */}
          <g clipPath="url(#jar)">
            <rect x="0" y="0" width="200" height="280" fill="var(--color-surface-2)" />
            <rect
              x="0"
              y={fillY}
              width="200"
              height={jarBottom - fillY}
              fill="var(--color-copper)"
            />
          </g>

          {/* jar outline */}
          <path
            d="M60 30 h80 v10 a40 40 0 0 1 -10 26 v150 a30 30 0 0 1 -30 30 h0 a30 30 0 0 1 -30 -30 v-150 a40 40 0 0 1 -10 -26 z"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="3"
          />
          <rect
            x="54"
            y="20"
            width="92"
            height="14"
            rx="4"
            fill="var(--color-surface-2)"
            stroke="var(--color-border)"
            strokeWidth="3"
          />
        </svg>

        <div className="mt-2 text-center">
          <div className="text-4xl font-bold">{total.toLocaleString()}</div>
          <div className="text-sm text-[var(--color-muted)]">
            tasks completed, all time
          </div>
          <div className="mt-1 text-xs text-[var(--color-muted)]">
            {inJar} / {MILESTONE} in this jar
            {jarsFilled > 0 && ` · ${jarsFilled} jar${jarsFilled === 1 ? "" : "s"} filled`}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="Current streak" value={profile?.current_streak ?? 0} />
        <Stat label="Highest streak" value={profile?.highest_streak ?? 0} />
      </div>
      <p className="mt-3 text-center text-[11px] text-[var(--color-muted)]">
        Streak counts tasks completed and resets when you spend a vice coin.
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
    </div>
  );
}
