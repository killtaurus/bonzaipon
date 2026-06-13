// Shared types mirroring the Postgres schema.

export type Profile = {
  id: string;
  gold_chance: number;
  vice_chance: number;
  copper_rollover: number;
  tickets: number;
  gold_coins: number;
  vice_coins: number;
  copper_coins: number;
  running_total: number;
  current_streak: number;
  highest_streak: number;
  current_day: string; // ISO date
  created_at: string;
};

export type PresetTask = {
  id: string;
  user_id: string;
  label: string;
  sort_order: number;
  archived: boolean;
  created_at: string;
};

export type TaskCompletion = {
  id: string;
  user_id: string;
  preset_task_id: string | null;
  label: string;
  note: string | null;
  day: string; // ISO date
  completed_at: string;
};

export type CoinKind = "gold" | "vice" | "copper";

export type RollResponse = {
  results: CoinKind[];
  rollovers: number;
  profile: Profile;
};

// The copper chance is whatever is left after gold + vice.
export function copperChance(p: Pick<Profile, "gold_chance" | "vice_chance">) {
  return Math.max(0, 100 - p.gold_chance - p.vice_chance);
}
