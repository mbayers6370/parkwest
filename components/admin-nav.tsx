"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarDays,
  ClipboardList,
  ChevronDown,
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
import {
  ADMIN_MODULE_OPTIONS,
  getAdminModuleLabel,
  isGlobalAdminModule,
  moduleScopeLabel,
  type AdminModuleKey,
} from "@/lib/admin-modules";
import { DEFAULT_PROPERTIES } from "@/lib/properties";
import type { AdminPropertySession } from "@/lib/property-access";

const ICONS = {
  overview: LayoutDashboard,
  employees: Users,
  scheduleImport: Upload,
  requests: ClipboardList,
  scheduleManager: CalendarDays,
  communications: BellRing,
  rules: SlidersHorizontal,
  auditLog: FileClock,
  support: Building2,
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
  { href: "/admin/requests", label: "Requests", icon: ICONS.requests },
  { href: "/admin/communications", label: "Communications", icon: ICONS.communications },
  { href: "/admin/schedule-manager", label: "Schedule Manager", icon: ICONS.scheduleManager },
  { href: "/admin/audit-log", label: "Audit Log", icon: ICONS.auditLog },
];

const UTILITY_NAV_ITEMS: NavItem[] = [
  { href: "/admin/rules", label: "Rules & Settings", icon: ICONS.rules },
];

const BOTTOM_TABS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: ICONS.overview, exact: true },
  { href: "/admin/schedule-import", label: "Schedule", icon: ICONS.scheduleManager },
  { href: "/admin/requests", label: "Requests", icon: ICONS.requests },
  { href: "/admin/communications", label: "Comms", icon: ICONS.communications },
  { href: "/admin/employees", label: "Employees", icon: ICONS.employees },
  { href: "/admin/audit-log", label: "More", icon: ICONS.auditLog },
];

export function AdminNav({ session }: { session: AdminPropertySession | null }) {
  const pathname = usePathname() ?? "";
  const [selectedPropertyKey, setSelectedPropertyKey] = useState(session?.propertyKey ?? "580");
  const [selectedModuleKey, setSelectedModuleKey] = useState<AdminModuleKey>(
    session?.moduleKey ?? "GAMING",
  );
  const [isSwitchingModule, setIsSwitchingModule] = useState(false);
  const [isSwitchingProperty, setIsSwitchingProperty] = useState(false);
  const [isDesktopPropertyOpen, setIsDesktopPropertyOpen] = useState(false);
  const [isMobilePropertyOpen, setIsMobilePropertyOpen] = useState(false);
  const [isDesktopModuleOpen, setIsDesktopModuleOpen] = useState(false);
  const [isMobileModuleOpen, setIsMobileModuleOpen] = useState(false);
  const visibleNavItems = isGlobalAdminModule(selectedModuleKey)
    ? NAV_ITEMS.filter((item) => item.href !== "/admin/schedule-manager")
    : NAV_ITEMS;
  const visibleUtilityNavItems = isGlobalAdminModule(selectedModuleKey)
    ? UTILITY_NAV_ITEMS.filter((item) => item.href !== "/admin/rules")
    : UTILITY_NAV_ITEMS;
  const visibleBottomTabs = isGlobalAdminModule(selectedModuleKey)
    ? BOTTOM_TABS.filter((item) => item.href !== "/admin/schedule-import")
    : BOTTOM_TABS;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  async function handleModuleChange(nextModuleKey: string) {
    if (!session || nextModuleKey === selectedModuleKey) {
      return;
    }

    setSelectedModuleKey(nextModuleKey as AdminModuleKey);
    setIsSwitchingModule(true);

    try {
      await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...session,
          moduleKey: nextModuleKey,
          moduleLabel: getAdminModuleLabel(nextModuleKey),
        }),
      });
      window.location.reload();
    } finally {
      setIsSwitchingModule(false);
    }
  }

  async function handlePropertyChange(nextPropertyKey: string) {
    if (!session || nextPropertyKey === selectedPropertyKey) {
      return;
    }

    const nextProperty =
      DEFAULT_PROPERTIES.find((property) => property.key === nextPropertyKey) ??
      DEFAULT_PROPERTIES[0];

    setSelectedPropertyKey(nextProperty.key);
    setIsSwitchingProperty(true);

    try {
      await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...session,
          propertyKey: nextProperty.key,
          propertyName: nextProperty.name,
        }),
      });
      window.location.reload();
    } finally {
      setIsSwitchingProperty(false);
    }
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
          <div className="admin-brand-scope-row">
            {session ? (
              <p className="admin-brand-kicker">
                {isGlobalAdminModule(selectedModuleKey)
                  ? getAdminModuleLabel(selectedModuleKey)
                  : moduleScopeLabel(selectedModuleKey, session.propertyName)}
              </p>
            ) : (
              <p className="admin-brand-kicker">Admin</p>
            )}
          </div>
          {session ? (
            <>
              <label className="admin-module-switcher">
                <span className="admin-nav-section-label">Module</span>
                <span className="admin-module-select-wrap">
                  <select
                    className="text-input app-select-input admin-module-select"
                    value={selectedModuleKey}
                    onChange={(event) => handleModuleChange(event.target.value)}
                    onFocus={() => setIsDesktopModuleOpen(true)}
                    onBlur={() => setIsDesktopModuleOpen(false)}
                    disabled={isSwitchingModule}
                  >
                    {ADMIN_MODULE_OPTIONS.map((moduleOption) => (
                      <option key={moduleOption.key} value={moduleOption.key}>
                        {moduleOption.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`admin-module-chevron${isDesktopModuleOpen ? " open" : ""}`}
                  />
                </span>
              </label>
              {isGlobalAdminModule(selectedModuleKey) ? (
                <label className="admin-module-switcher">
                  <span className="admin-nav-section-label">Property</span>
                  <span className="admin-module-select-wrap">
                    <select
                      className="text-input app-select-input admin-module-select"
                      value={selectedPropertyKey}
                      onChange={(event) => handlePropertyChange(event.target.value)}
                      onFocus={() => setIsDesktopPropertyOpen(true)}
                      onBlur={() => setIsDesktopPropertyOpen(false)}
                      disabled={isSwitchingProperty}
                    >
                      {DEFAULT_PROPERTIES.map((property) => (
                        <option key={property.key} value={property.key}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className={`admin-module-chevron${isDesktopPropertyOpen ? " open" : ""}`}
                    />
                  </span>
                </label>
              ) : null}
            </>
          ) : (
            <>
              <span className="admin-brand-scope-value">Not selected</span>
            </>
          )}
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin Navigation">
          <p className="admin-nav-section-label">Workspace</p>
          {visibleNavItems.map((item) => (
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

        {visibleUtilityNavItems.length > 0 ? (
          <div className="admin-sidebar-utility">
            {visibleUtilityNavItems.map((item) => (
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
          </div>
        ) : null}

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
          <p className="admin-mobile-kicker">
            {session ? moduleScopeLabel(selectedModuleKey, session.propertyName) : "Manager / Admin"}
          </p>
          {session ? (
            <label className="admin-mobile-module-switcher">
              <span className="sr-only">Select module</span>
              <span className="admin-module-select-wrap">
                <select
                  className="text-input app-select-input admin-mobile-module-select"
                  value={selectedModuleKey}
                  onChange={(event) => handleModuleChange(event.target.value)}
                  onFocus={() => setIsMobileModuleOpen(true)}
                  onBlur={() => setIsMobileModuleOpen(false)}
                  disabled={isSwitchingModule}
                >
                  {ADMIN_MODULE_OPTIONS.map((moduleOption) => (
                    <option key={moduleOption.key} value={moduleOption.key}>
                      {moduleOption.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className={`admin-module-chevron${isMobileModuleOpen ? " open" : ""}`}
                />
              </span>
              {isGlobalAdminModule(selectedModuleKey) ? (
                <span className="admin-module-select-wrap">
                  <select
                    className="text-input app-select-input admin-mobile-module-select"
                    value={selectedPropertyKey}
                    onChange={(event) => handlePropertyChange(event.target.value)}
                    onFocus={() => setIsMobilePropertyOpen(true)}
                    onBlur={() => setIsMobilePropertyOpen(false)}
                    disabled={isSwitchingProperty}
                  >
                    {DEFAULT_PROPERTIES.map((property) => (
                      <option key={property.key} value={property.key}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`admin-module-chevron${isMobilePropertyOpen ? " open" : ""}`}
                  />
                </span>
              ) : null}
            </label>
          ) : null}
        </div>
        <div className="admin-mobile-ws-links">
          <Link href="/support" className="admin-mobile-ws-link">
            Support
          </Link>
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
        {visibleBottomTabs.map((tab) => (
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
