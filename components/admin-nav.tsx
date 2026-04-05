"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileClock,
  House,
  LayoutDashboard,
  ListChecks,
  PanelsTopLeft,
  SlidersHorizontal,
  Upload,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICONS = {
  overview: LayoutDashboard,
  employees: Users,
  scheduleImport: Upload,
  requests: ClipboardList,
  scheduleManager: CalendarDays,
  rules: SlidersHorizontal,
  auditLog: FileClock,
  personal: UserRound,
  floor: PanelsTopLeft,
  arrowRight: ArrowRight,
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: number;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: ICONS.overview, exact: true },
  { href: "/admin/employees", label: "Employees", icon: ICONS.employees },
  { href: "/admin/schedule-import", label: "Schedule Import", icon: ICONS.scheduleImport },
  { href: "/admin/requests", label: "Requests", icon: ICONS.requests },
  { href: "/admin/schedule-manager", label: "Schedule Manager", icon: ICONS.scheduleManager },
  { href: "/admin/rules", label: "Rules & Settings", icon: ICONS.rules },
  { href: "/admin/audit-log", label: "Audit Log", icon: ICONS.auditLog },
];

const BOTTOM_TABS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: ICONS.overview, exact: true },
  { href: "/admin/schedule-import", label: "Schedule", icon: ICONS.scheduleManager },
  { href: "/admin/requests", label: "Requests", icon: ICONS.requests },
  { href: "/admin/employees", label: "Employees", icon: ICONS.employees },
  { href: "/admin/audit-log", label: "More", icon: ICONS.auditLog },
];

export function AdminNav() {
  const pathname = usePathname() ?? "";

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Desktop Sidebar ── */}
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
          <p className="admin-brand-kicker">Manager / Admin</p>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin Navigation">
          <p className="admin-nav-section-label">Workspace</p>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link${isActive(item.href, item.exact) ? " active" : ""}`}
            >
              <item.icon size={16} aria-hidden="true" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="admin-nav-badge">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <p className="admin-nav-section-label">Switch Workspace</p>
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

      {/* ── Mobile Top Bar ── */}
      <div className="admin-mobile-topbar" role="banner">
        <div className="admin-mobile-brand-wrap">
          <Image
            src="/logo2x.png"
            alt="Parkwest Casinos"
            width={220}
            height={67}
            className="admin-mobile-logo"
            priority
          />
          <p className="admin-mobile-kicker">Manager / Admin</p>
        </div>
        <div className="admin-mobile-ws-links">
          <Link href="/personal" className="admin-mobile-ws-link">
            Personal
          </Link>
          <Link href="/on-the-floor" className="admin-mobile-ws-link">
            Floor
          </Link>
        </div>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="admin-bottom-nav" aria-label="Mobile Navigation">
        {BOTTOM_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`admin-bottom-tab${isActive(tab.href, tab.exact) ? " active" : ""}`}
          >
            <tab.icon size={20} aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
