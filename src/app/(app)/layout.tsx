import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { BottomNav } from "./_components/BottomNav";
import { DaySync } from "./_components/DaySync";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_day")
    .eq("id", user.id)
    .single<Pick<Profile, "current_day">>();

  return (
    <>
      <DaySync storedDay={profile?.current_day ?? "1970-01-01"} />
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav />
    </>
  );
}
