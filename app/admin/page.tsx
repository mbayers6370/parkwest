import Link from "next/link";
import {
  CalendarDays,
  CircleAlert,
  ClipboardCheck,
  FileClock,
  Upload,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

const QUICK_ACTIONS = [
  {
    href: "/admin/schedule-import",
    icon: Upload,
    title: "Import Schedule",
    desc: "Upload a weekly spreadsheet and map it to employee records",
  },
  {
    href: "/admin/employees",
    icon: UserPlus,
    title: "Add Employee",
    desc: "Create a new employee record with name and schedule aliases",
  },
  {
    href: "/admin/requests",
    icon: ClipboardCheck,
    title: "Review Requests",
    desc: "Approve or deny pending time-off requests from the queue",
  },
  {
    href: "/admin/employees",
    icon: Users,
    title: "Manage Employees",
    desc: "Search, edit, and review aliases for existing employee records",
  },
  {
    href: "/admin/schedule-manager",
    icon: CalendarDays,
    title: "Schedule Manager",
    desc: "View and manage the published schedule for any week",
  },
  {
    href: "/admin/audit-log",
    icon: FileClock,
    title: "Audit Log",
    desc: "Review a timestamped history of important system changes",
  },
];

export default function AdminOverviewPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Overview</h1>
        <p className="admin-page-subtitle">{today}</p>
      </header>

      <div className="admin-content">
        {/* ── Stat Row ── */}
        <div className="stat-row">
          <div className="stat-card">
            <p className="stat-label">Pending Requests</p>
            <p className="stat-value muted">0</p>
            <p className="stat-meta">No requests awaiting review</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">This Week&rsquo;s Schedule</p>
            <p className="stat-value warn">Draft</p>
            <p className="stat-meta">Not yet published</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Active Employees</p>
            <p className="stat-value muted">0</p>
            <p className="stat-meta">No records imported yet</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Import Issues</p>
            <p className="stat-value ok">0</p>
            <p className="stat-meta">No unmatched names</p>
          </div>
        </div>

        {/* ── Setup Notice ── */}
        <div className="notice-card info" style={{ marginBottom: 22 }}>
          <CircleAlert size={16} aria-hidden="true" />
          <div>
            <p className="notice-title">Getting started</p>
            <p className="notice-body">
              Start by importing your employee roster, then upload a weekly schedule. Once employees
              are mapped, the dealer and floor portals will have real data to show.
            </p>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="page-section">
          <div className="page-section-header">
            <div>
              <p className="page-section-title">Quick Actions</p>
              <p className="page-section-subtitle">Common tasks at a glance</p>
            </div>
          </div>
          <div className="quick-action-grid">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href + action.title} href={action.href} className="quick-action">
                <div className="quick-action-icon">
                  <action.icon size={17} aria-hidden="true" />
                </div>
                <p className="quick-action-title">{action.title}</p>
                <p className="quick-action-desc">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Two-column grid ── */}
        <div className="admin-grid">
          {/* Pending Requests */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <p className="admin-card-title">Pending Requests</p>
                <p className="admin-card-subtitle">Time-off requests awaiting decision</p>
              </div>
              <Link href="/admin/requests" className="secondary-button" style={{ fontSize: "var(--text-sm-plus)" }}>
                View all
              </Link>
            </div>
            <div className="admin-card-body">
              <div
                className="empty-state"
                style={{ textAlign: "center", padding: "28px 16px" }}
              >
                <p className="mini-title" style={{ marginBottom: 6 }}>
                  No pending requests
                </p>
                <p className="mini-copy">
                  When dealers submit time-off requests they will appear here for review.
                </p>
              </div>
            </div>
          </div>

          {/* Schedule Status */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <p className="admin-card-title">Schedule Status</p>
                <p className="admin-card-subtitle">Current and upcoming week readiness</p>
              </div>
              <Link
                href="/admin/schedule-manager"
                className="secondary-button"
                style={{ fontSize: "var(--text-sm-plus)" }}
              >
                Manage
              </Link>
            </div>
            <div className="admin-card-body">
              <div className="data-list">
                <div className="data-row">
                  <div className="data-row-main">
                    <p className="data-row-title">This week</p>
                    <p className="data-row-sub">No schedule imported yet</p>
                  </div>
                  <div className="data-row-right">
                    <span className="badge warning">No data</span>
                  </div>
                </div>
                <div className="data-row">
                  <div className="data-row-main">
                    <p className="data-row-title">Next week</p>
                    <p className="data-row-sub">No schedule imported yet</p>
                  </div>
                  <div className="data-row-right">
                    <span className="badge warning">No data</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <Link href="/admin/schedule-import" className="primary-button" style={{ fontSize: "var(--text-md)" }}>
                  Import a schedule
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity — full width */}
          <div className="admin-card full">
            <div className="admin-card-header">
              <div>
                <p className="admin-card-title">Recent Activity</p>
                <p className="admin-card-subtitle">Latest audit trail entries across the system</p>
              </div>
              <Link
                href="/admin/audit-log"
                className="secondary-button"
                style={{ fontSize: "var(--text-sm-plus)" }}
              >
                Full log
              </Link>
            </div>
            <div className="admin-card-body">
              <div className="empty-state" style={{ textAlign: "center", padding: "28px 16px" }}>
                <p className="mini-title" style={{ marginBottom: 6 }}>
                  No activity recorded yet
                </p>
                <p className="mini-copy">
                  Schedule imports, publish events, request decisions, and attendance changes will
                  appear here once the system is in use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
