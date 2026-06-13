"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Profile, RollResponse } from "@/lib/types";

// Keep the stored "current day" in sync with the user's device-local date.
// Called on app open; a no-op unless the local date is newer than stored.
export async function syncDay(clientDay: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("sync_day", { p_client_day: clientDay });
  revalidatePath("/", "layout");
}

export async function completeTask(taskId: string, note: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_task", {
    p_task_id: taskId,
    p_note: note,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteCompletion(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("task_completions").delete().eq("id", id);
  revalidatePath("/");
}

export async function roll(
  count: 1 | 10,
  clientDay: string,
): Promise<RollResponse> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("roll_tickets", {
    p_count: count,
    p_client_day: clientDay,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/roll");
  return data as RollResponse;
}

export async function spendViceCoin(): Promise<Profile> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("spend_vice_coin");
  if (error) throw new Error(error.message);
  revalidatePath("/roll");
  return data as Profile;
}

export async function updateSettings(input: {
  gold_chance: number;
  vice_chance: number;
  copper_rollover: number;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");

  const { error } = await supabase
    .from("profiles")
    .update({
      gold_chance: input.gold_chance,
      vice_chance: input.vice_chance,
      copper_rollover: input.copper_rollover,
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/roll");
}

// ---- Preset task management ----

export async function addPreset(label: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");

  const { count } = await supabase
    .from("preset_tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("archived", false);

  const { error } = await supabase.from("preset_tasks").insert({
    user_id: user.id,
    label: label.trim(),
    sort_order: count ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function renamePreset(id: string, label: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("preset_tasks")
    .update({ label: label.trim() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/");
}

// Soft-delete so historical completion labels remain meaningful.
export async function archivePreset(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("preset_tasks")
    .update({ archived: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/");
}
