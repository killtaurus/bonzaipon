"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Today", icon: "🌱" },
  { href: "/roll", label: "Roll", icon: "🎰" },
  { href: "/progress", label: "Progress", icon: "🫙" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 grid grid-cols-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${
              active
                ? "text-[var(--color-leaf-bright)]"
                : "text-[var(--color-muted)]"
            }`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
