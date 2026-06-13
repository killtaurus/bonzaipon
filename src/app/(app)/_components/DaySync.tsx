"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncDay } from "../actions";
import { localDay } from "@/lib/day";

// Mounts once on app open, tells the server the device-local date so the
// previous day can roll over (tasks -> tickets), then refreshes if needed.
export function DaySync({ storedDay }: { storedDay: string }) {
  const router = useRouter();

  useEffect(() => {
    const today = localDay();
    if (today > storedDay) {
      syncDay(today).then(() => router.refresh());
    }
  }, [storedDay, router]);

  return null;
}
