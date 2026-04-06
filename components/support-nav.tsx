"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  PanelsTopLeft,
  ShieldUser,
  UserRound,
  type LucideIcon,
} from "lucide-react";

const ICONS = {
  overview: LayoutDashboard,
  properties: Building2,
  admin: ShieldUser,
  personal: UserRound,
  floor: PanelsTopLeft,
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/support", label: "Overview", icon: ICONS.overview, exact: true },
  { href: "/support/properties", label: "Properties", icon: ICONS.properties },
];

export function SupportNav() {
  const pathname = usePathname() ?? "";

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Image
            src="/logo2x.png"
            alt="Parkwest Casinos"
            width={100}
            height={67}
            className="admin-brand-logo"
            priority
          />
          <p className="admin-brand-kicker">Support / Platform</p>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Support Navigation">
          <p className="admin-nav-section-label">Support</p>
          {NAV_ITEMS.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={`admin-nav-link${isActive(item.href, item.exact) ? " active" : ""}`}
            >
              <item.icon size={16} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <p className="admin-nav-section-label">Switch Workspace</p>
          <Link href="/admin" className="admin-workspace-link">
            <ICONS.admin size={14} aria-hidden="true" />
            Admin
          </Link>
          <Link href="/personal" className="admin-workspace-link">
            <ICONS.personal size={14} aria-hidden="true" />
            Personal
          </Link>
          <Link href="/on-the-floor" className="admin-workspace-link">
            <ICONS.floor size={14} aria-hidden="true" />
            On The Floor
          </Link>
        </div>
      </aside>
    </>
  );
}
