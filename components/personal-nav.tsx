"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRing,
  CalendarDays,
  House,
  UserRound,
  ClipboardList,
} from "lucide-react";
import styles from "./personal-nav.module.css";

const ICONS = {
  home: House,
  schedule: CalendarDays,
  requests: ClipboardList,
  communications: BellRing,
  account: UserRound,
};

const BOTTOM_TABS = [
  { href: "/personal", label: "Home", icon: ICONS.home, exact: true },
  { href: "/personal/schedule", label: "Schedule", icon: ICONS.schedule },
  { href: "/personal/requests", label: "Requests", icon: ICONS.requests },
  { href: "/personal/communications", label: "Comms", icon: ICONS.communications },
  { href: "/personal/account", label: "Account", icon: ICONS.account },
];

const DESKTOP_TABS = [
  { href: "/personal", label: "Home", exact: true },
  { href: "/personal/schedule", label: "My Schedule" },
  { href: "/personal/requests", label: "Requests" },
  { href: "/personal/communications", label: "Communications" },
  { href: "/personal/account", label: "Account" },
];

export type UserRole =
  | "dealer"
  | "cage"
  | "chip_runner"
  | "floor"
  | "dual_rate"
  | "management";

type PersonalNavProps = {
  showWorkspaceSwitcher?: boolean;
};

export function PersonalNav({ showWorkspaceSwitcher = true }: PersonalNavProps) {
  const pathname = usePathname() ?? "";

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Charcoal Topbar (shared portal-topbar style) ── */}
      <header className="portal-topbar">
        <div className="portal-topbar-content">
          <div className="portal-topbar-left">
            <Link href="/personal" className="portal-logo-link" aria-label="Parkwest home">
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

          {showWorkspaceSwitcher && (
            <div className="portal-topbar-right">
              <Link href="/on-the-floor" className="portal-topbar-link">
                On The Floor
              </Link>
              <Link href="/admin" className="portal-topbar-link">
                Admin
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ── Desktop Tab Strip ── */}
      <nav className="portal-desktop-tabs" aria-label="Personal navigation">
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
      <nav className={styles.personalBottomNav} aria-label="Mobile navigation">
        {BOTTOM_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.personalBottomTab} ${isActive(tab.href, tab.exact) ? styles.personalBottomTabActive : ""}`}
          >
            <tab.icon size={20} aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
