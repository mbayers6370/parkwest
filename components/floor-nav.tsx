"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Clock3,
} from "lucide-react";
import styles from "@/app/on-the-floor/floor.module.css";

const ICONS = {
  now: Clock3,
  schedule: CalendarDays,
};

const BOTTOM_TABS = [
  { href: "/on-the-floor", label: "Now", icon: ICONS.now, exact: true },
  { href: "/on-the-floor/schedule", label: "Schedule", icon: ICONS.schedule },
];

const DESKTOP_TABS = [
  { href: "/on-the-floor", label: "Now", exact: true },
  { href: "/on-the-floor/schedule", label: "Schedule" },
];

export function FloorNav() {
  const pathname = usePathname() ?? "";
  const cx = (...classes: Array<string | false | undefined>) =>
    classes.filter(Boolean).join(" ");

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
      <nav className={styles.floorBottomNav} aria-label="Mobile navigation">
        {BOTTOM_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cx(
              styles.floorBottomTab,
              isActive(tab.href, tab.exact) && styles.floorBottomTabActive,
            )}
          >
            <tab.icon size={20} aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
