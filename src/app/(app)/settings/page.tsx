import { createClient } from "@/lib/supabase/server";
import type { PresetTask, Profile } from "@/lib/types";
import { SettingsClient } from "../_components/SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: presets }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single<Profile>(),
    supabase
      .from("preset_tasks")
      .select("*")
      .eq("archived", false)
      .order("sort_order"),
  ]);

  return (
    <SettingsClient
      profile={profile!}
      presets={(presets ?? []) as PresetTask[]}
      email={user!.email ?? ""}
    />
  );
}
