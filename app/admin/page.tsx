"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CircleAlert,
  ClipboardCheck,
  FileClock,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import {
  getAllAttendanceEvents,
  getAttendanceSummary,
  getLast24HourAttendanceEvents,
  type AttendanceEvent,
} from "@/lib/attendance-events";
import { loadStoredAttendanceEvents } from "@/lib/attendance-event-store";
import {
  applyApprovedGiveawayRequest,
  SHIFT_REQUEST_KIND_LABELS,
  type ShiftGiveawayRequest,
} from "@/lib/shift-giveaway-requests";
import {
  loadStoredShiftGiveawayRequests,
  saveStoredShiftGiveawayRequests,
  SHIFT_GIVEAWAY_REQUESTS_UPDATED_EVENT,
} from "@/lib/shift-giveaway-request-store";
import {
  loadStoredSchedule,
  saveStoredSchedule,
  SCHEDULE_UPDATED_EVENT,
} from "@/lib/mock-schedule-store";
import { type ScheduleEntry } from "@/lib/mock-schedule";
import {
  SCHEDULE_OVERRIDE_KIND_LABELS,
  type ScheduleOverride,
} from "@/lib/schedule-overrides";
import {
  loadStoredScheduleOverrides,
  SCHEDULE_OVERRIDES_UPDATED_EVENT,
} from "@/lib/schedule-override-store";

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
  const [storedAttendanceEvents, setStoredAttendanceEvents] = useState<
    AttendanceEvent[]
  >([]);
  const [giveawayRequests, setGiveawayRequests] = useState<ShiftGiveawayRequest[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverride[]>([]);

  useEffect(() => {
    const syncAttendanceEvents = () => {
      setStoredAttendanceEvents(loadStoredAttendanceEvents());
    };
    const syncGiveawayRequests = () => {
      setGiveawayRequests(loadStoredShiftGiveawayRequests());
    };
    const syncScheduleEntries = () => {
      setScheduleEntries(loadStoredSchedule());
    };
    const syncScheduleOverrides = () => {
      setScheduleOverrides(loadStoredScheduleOverrides());
    };

    syncAttendanceEvents();
    syncGiveawayRequests();
    syncScheduleEntries();
    syncScheduleOverrides();

    window.addEventListener("storage", syncAttendanceEvents);
    window.addEventListener("storage", syncGiveawayRequests);
    window.addEventListener("storage", syncScheduleEntries);
    window.addEventListener("storage", syncScheduleOverrides);
    window.addEventListener(
      SHIFT_GIVEAWAY_REQUESTS_UPDATED_EVENT,
      syncGiveawayRequests,
    );
    window.addEventListener(SCHEDULE_UPDATED_EVENT, syncScheduleEntries);
    window.addEventListener(SCHEDULE_OVERRIDES_UPDATED_EVENT, syncScheduleOverrides);

    return () => {
      window.removeEventListener("storage", syncAttendanceEvents);
      window.removeEventListener("storage", syncGiveawayRequests);
      window.removeEventListener("storage", syncScheduleEntries);
      window.removeEventListener("storage", syncScheduleOverrides);
      window.removeEventListener(
        SHIFT_GIVEAWAY_REQUESTS_UPDATED_EVENT,
        syncGiveawayRequests,
      );
      window.removeEventListener(SCHEDULE_UPDATED_EVENT, syncScheduleEntries);
      window.removeEventListener(SCHEDULE_OVERRIDES_UPDATED_EVENT, syncScheduleOverrides);
    };
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const attendanceWindow = useMemo(() => {
    return getLast24HourAttendanceEvents(
      getAllAttendanceEvents(storedAttendanceEvents),
      new Date().toISOString(),
    );
  }, [storedAttendanceEvents]);

  const attendanceSummary = getAttendanceSummary(attendanceWindow);
  const pendingGiveawayRequests = useMemo(
    () => giveawayRequests.filter((request) => request.status === "pending"),
    [giveawayRequests],
  );
  const recentScheduleOverrides = useMemo(
    () =>
      [...scheduleOverrides]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [scheduleOverrides],
  );

  function updateGiveawayRequest(requestId: string, status: "approved" | "denied") {
    const request = giveawayRequests.find((entry) => entry.id === requestId);

    if (!request) {
      return;
    }

    if (status === "approved") {
      const nextScheduleEntries = applyApprovedGiveawayRequest(scheduleEntries, request);
      setScheduleEntries(nextScheduleEntries);
      saveStoredSchedule(nextScheduleEntries);
    }

    const nextRequests = giveawayRequests.map((entry) =>
      entry.id !== requestId
        ? entry
        : {
            ...entry,
            status,
            reviewedAt: new Date().toISOString(),
            reviewedBy: "Manager / Admin",
          },
    );

    setGiveawayRequests(nextRequests);
    saveStoredShiftGiveawayRequests(nextRequests);
  }

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Overview</h1>
        <p className="admin-page-subtitle">{today}</p>
      </header>

      <div className="admin-content">
        <div className="stat-row">
          <div className="stat-card">
            <p className="stat-label">Pending Requests</p>
            <p className={`stat-value ${pendingGiveawayRequests.length > 0 ? "alert" : "muted"}`}>
              {pendingGiveawayRequests.length}
            </p>
            <p className="stat-meta">
              {pendingGiveawayRequests.length > 0
                ? "Shift giveaway requests awaiting review"
                : "No requests awaiting review"}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">This Week&apos;s Schedule</p>
            <p className="stat-value warn">Draft</p>
            <p className="stat-meta">Not yet published</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Attendance 24h</p>
            <p className="stat-value ok">{attendanceSummary.total}</p>
            <p className="stat-meta">Attendance reports in the last 24 hours</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Active Employees</p>
            <p className="stat-value muted">0</p>
            <p className="stat-meta">No records imported yet</p>
          </div>
        </div>

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

        <div className="admin-grid">
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <p className="admin-card-title">Pending Requests</p>
                <p className="admin-card-subtitle">Shift giveaway requests awaiting decision</p>
              </div>
              <Link href="/admin/requests" className="secondary-button" style={{ fontSize: "var(--text-sm-plus)" }}>
                View All
              </Link>
            </div>
            <div className="admin-card-body">
              {pendingGiveawayRequests.length === 0 ? (
                <div className="empty-state" style={{ textAlign: "center", padding: "28px 16px" }}>
                  <p className="mini-title" style={{ marginBottom: 6 }}>
                    No pending requests
                  </p>
                  <p className="mini-copy">
                    Shift giveaway requests will appear here for review.
                  </p>
                </div>
              ) : (
                <div className="admin-giveaway-list">
                  {pendingGiveawayRequests.map((request) => (
                    <div key={request.id} className="admin-giveaway-item">
                      <div className="admin-giveaway-item-top">
                        <div>
                          <p className="admin-giveaway-title">
                            {request.requesterName} → {request.targetDealerName}
                          </p>
                          <p className="admin-giveaway-meta">
                            {SHIFT_REQUEST_KIND_LABELS[request.requestKind]} · {request.shiftDayLabel} · {request.requesterShiftTime}
                          </p>
                        </div>
                        <span className="badge warning">Pending</span>
                      </div>
                      <p className="admin-giveaway-copy">
                        {request.requestKind === "switch" ? "Requested switch: " : "Target dealer: "}
                        {request.targetDealerStatus === "off" ? "Off that day" : request.targetDealerShiftTime}
                      </p>
                      {request.validationSnapshot.restHoursBeforeShift !== null ? (
                        <p className="admin-giveaway-copy">
                          Rest before shift: {request.validationSnapshot.restHoursBeforeShift} hours
                        </p>
                      ) : null}
                      {request.validationSnapshot.targetDealerAlreadyAtSixDays ? (
                        <div className="notice-card danger">
                          <CircleAlert size={14} aria-hidden="true" />
                          <div>
                            <p className="notice-title">Red flag</p>
                            <p className="notice-body">
                              {request.targetDealerName} is already scheduled for six days this week.
                            </p>
                          </div>
                        </div>
                      ) : null}
                      {request.note ? (
                        <p className="admin-giveaway-note">{request.note}</p>
                      ) : null}
                      <div className="admin-giveaway-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => updateGiveawayRequest(request.id, "denied")}
                        >
                          Deny
                        </button>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => updateGiveawayRequest(request.id, "approved")}
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <p className="admin-card-title">Attendance 24-Hour Report</p>
                <p className="admin-card-subtitle">Call outs, reverse PSL, and leave-early changes in the last 24 hours</p>
              </div>
              <Link href="/admin/audit-log" className="secondary-button" style={{ fontSize: "var(--text-sm-plus)" }}>
                Daily Log
              </Link>
            </div>
            <div className="admin-card-body">
              <div className="data-list">
                <div className="data-row">
                  <div className="data-row-main">
                    <p className="data-row-title">Call Outs</p>
                    <p className="data-row-sub">1 point and PSL call outs combined</p>
                  </div>
                  <div className="data-row-right">
                    <span className="badge warning">{attendanceSummary.callOuts}</span>
                  </div>
                </div>
                <div className="data-row">
                  <div className="data-row-main">
                    <p className="data-row-title">Reverse PSL</p>
                    <p className="data-row-sub">Delayed starts reported by employees</p>
                  </div>
                  <div className="data-row-right">
                    <span className="badge gold">{attendanceSummary.reversePsl}</span>
                  </div>
                </div>
                <div className="data-row">
                  <div className="data-row-main">
                    <p className="data-row-title">Leave Early</p>
                    <p className="data-row-sub">Half points and PSL leave-early reports</p>
                  </div>
                  <div className="data-row-right">
                    <span className="badge warning">{attendanceSummary.leaveEarly}</span>
                  </div>
                </div>
                <div className="data-row">
                  <div className="data-row-main">
                    <p className="data-row-title">PSL Hours</p>
                    <p className="data-row-sub">Total PSL hours reported in the last 24 hours</p>
                  </div>
                  <div className="data-row-right">
                    <span className="badge success">{attendanceSummary.pslHours}h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <p className="admin-card-title">Schedule Changes</p>
                <p className="admin-card-subtitle">Floor overrides added to the weekly schedule</p>
              </div>
            </div>
            <div className="admin-card-body">
              {recentScheduleOverrides.length === 0 ? (
                <div className="empty-state" style={{ textAlign: "center", padding: "28px 16px" }}>
                  <p className="mini-title" style={{ marginBottom: 6 }}>
                    No schedule changes yet
                  </p>
                  <p className="mini-copy">
                    Start-time changes and added dealers will appear here.
                  </p>
                </div>
              ) : (
                <div className="admin-giveaway-list">
                  {recentScheduleOverrides.map((override) => (
                    <div key={override.id} className="admin-giveaway-item">
                      <div className="admin-giveaway-item-top">
                        <div>
                          <p className="admin-giveaway-title">{override.employeeName}</p>
                          <p className="admin-giveaway-meta">
                            {SCHEDULE_OVERRIDE_KIND_LABELS[override.kind]} · {override.shiftDate}
                          </p>
                        </div>
                        {override.flaggedSixDay ? (
                          <span className="badge danger">Red Flag</span>
                        ) : null}
                      </div>
                      <p className="admin-giveaway-copy">
                        {override.previousShiftTime} → {override.nextShiftTime}
                      </p>
                      {override.note ? (
                        <p className="admin-giveaway-note">{override.note}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
