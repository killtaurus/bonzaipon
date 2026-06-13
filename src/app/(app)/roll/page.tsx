import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { RollClient } from "../_components/RollClient";

export default async function RollPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  return <RollClient initial={profile!} />;
}
