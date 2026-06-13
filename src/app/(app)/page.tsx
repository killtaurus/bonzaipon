import { createClient } from "@/lib/supabase/server";
import type { PresetTask, Profile, TaskCompletion } from "@/lib/types";
import { TodayClient } from "./_components/TodayClient";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("tickets, current_day")
    .eq("id", user!.id)
    .single<Pick<Profile, "tickets" | "current_day">>();

  const day = profile?.current_day ?? "1970-01-01";

  const [{ data: presets }, { data: completions }] = await Promise.all([
    supabase
      .from("preset_tasks")
      .select("*")
      .eq("archived", false)
      .order("sort_order"),
    supabase
      .from("task_completions")
      .select("*")
      .eq("day", day)
      .order("completed_at", { ascending: false }),
  ]);

  return (
    <TodayClient
      presets={(presets ?? []) as PresetTask[]}
      completions={(completions ?? []) as TaskCompletion[]}
      tickets={profile?.tickets ?? 0}
    />
  );
}
