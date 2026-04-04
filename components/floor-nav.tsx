"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  Clock3,
} from "lucide-react";

const ICONS = {
  now: Clock3,
  schedule: CalendarDays,
  log: ClipboardList,
};

const BOTTOM_TABS = [
  { href: "/on-the-floor", label: "Now", icon: ICONS.now, exact: true },
  { href: "/on-the-floor/schedule", label: "Schedule", icon: ICONS.schedule },
  { href: "/on-the-floor/log", label: "Log", icon: ICONS.log },
];

const DESKTOP_TABS = [
  { href: "/on-the-floor", label: "Now", exact: true },
  { href: "/on-the-floor/schedule", label: "Schedule" },
  { href: "/on-the-floor/log", label: "Change Log" },
];

export function FloorNav() {
  const pathname = usePathname() ?? "";

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <header className="portal-topbar">
        <div className="portal-topbar-content">
          <div className="portal-topbar-left">
            <Link href="/on-the-floor" className="portal-logo-link" aria-label="Parkwest home">
              <Image
                src="/logo2x.png"
                alt="Parkwest Casinos"
                width={220}
                height={67}
                className="portal-logo"
                priority
              />
            </Link>
          </div>

          <div className="portal-topbar-right">
            <Link href="/personal" className="portal-topbar-link">
              Personal
            </Link>
            <Link href="/admin" className="portal-topbar-link">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <nav className="portal-desktop-tabs" aria-label="Floor navigation">
        {DESKTOP_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`portal-desktop-tab${isActive(tab.href, tab.exact) ? " active" : ""}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="floor-bottom-nav" aria-label="Mobile navigation">
        {BOTTOM_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`floor-bottom-tab${isActive(tab.href, tab.exact) ? " active" : ""}`}
          >
            <tab.icon size={20} aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
