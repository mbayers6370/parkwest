"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAdminProperty } from "@/components/admin-property-provider";
import { getAdminModuleLabel } from "@/lib/admin-modules";
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
import {
  parseShiftRange,
  type ScheduleEntry,
} from "@/lib/mock-schedule";
import {
  applyScheduleOverrides,
  type ScheduleOverride,
} from "@/lib/schedule-overrides";
import {
  loadStoredScheduleOverrides,
  SCHEDULE_OVERRIDES_UPDATED_EVENT,
} from "@/lib/schedule-override-store";
import {
  getAllTimeOffRequests,
  TIME_OFF_REASON_LABELS,
  TIME_OFF_STATUS_LABELS,
  type TimeOffRequest,
} from "@/lib/time-off-requests";
import {
  loadStoredTimeOffRequests,
  TIME_OFF_REQUESTS_UPDATED_EVENT,
} from "@/lib/time-off-request-store";

const QUICK_ACTIONS = [
  {
    href: "/admin/schedule-manager",
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
  const adminProperty = useAdminProperty();
  const [storedAttendanceEvents, setStoredAttendanceEvents] = useState<
    AttendanceEvent[]
  >([]);
  const [storedTimeOffRequests, setStoredTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [employees, setEmployees] = useState<
    { displayName: string; firstName?: string; lastName?: string }[]
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
    const syncTimeOffRequests = () => {
      setStoredTimeOffRequests(loadStoredTimeOffRequests());
    };
    const syncScheduleEntries = () => {
      setScheduleEntries(loadStoredSchedule());
    };
    const syncScheduleOverrides = () => {
      setScheduleOverrides(loadStoredScheduleOverrides());
    };

    syncAttendanceEvents();
    syncGiveawayRequests();
    syncTimeOffRequests();
    syncScheduleEntries();
    syncScheduleOverrides();

    window.addEventListener("storage", syncAttendanceEvents);
    window.addEventListener("storage", syncGiveawayRequests);
    window.addEventListener("storage", syncTimeOffRequests);
    window.addEventListener("storage", syncScheduleEntries);
    window.addEventListener("storage", syncScheduleOverrides);
    window.addEventListener(
      SHIFT_GIVEAWAY_REQUESTS_UPDATED_EVENT,
      syncGiveawayRequests,
    );
    window.addEventListener(TIME_OFF_REQUESTS_UPDATED_EVENT, syncTimeOffRequests);
    window.addEventListener(SCHEDULE_UPDATED_EVENT, syncScheduleEntries);
    window.addEventListener(SCHEDULE_OVERRIDES_UPDATED_EVENT, syncScheduleOverrides);

    return () => {
      window.removeEventListener("storage", syncAttendanceEvents);
      window.removeEventListener("storage", syncGiveawayRequests);
      window.removeEventListener("storage", syncTimeOffRequests);
      window.removeEventListener("storage", syncScheduleEntries);
      window.removeEventListener("storage", syncScheduleOverrides);
      window.removeEventListener(
        SHIFT_GIVEAWAY_REQUESTS_UPDATED_EVENT,
        syncGiveawayRequests,
      );
      window.removeEventListener(TIME_OFF_REQUESTS_UPDATED_EVENT, syncTimeOffRequests);
      window.removeEventListener(SCHEDULE_UPDATED_EVENT, syncScheduleEntries);
      window.removeEventListener(SCHEDULE_OVERRIDES_UPDATED_EVENT, syncScheduleOverrides);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEmployees() {
      if (!adminProperty?.propertyKey) {
        setEmployees([]);
        return;
      }

      try {
        const params = new URLSearchParams({
          all: "1",
          propertyKey: adminProperty.propertyKey,
          moduleKey: adminProperty.moduleKey,
        });
        const response = await fetch(`/api/admin/employees?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          employees?: { displayName: string; firstName?: string; lastName?: string }[];
        };
        setEmployees(data.employees ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setEmployees([]);
        }
      }
    }

    loadEmployees();

    return () => controller.abort();
  }, [adminProperty?.moduleKey, adminProperty?.propertyKey]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const attendanceWindow = useMemo(() => {
    return getLast24HourAttendanceEvents(
      getAllAttendanceEvents(storedAttendanceEvents).filter((event) =>
        employeeBelongsToProperty(event.employeeName, employees),
      ),
      new Date().toISOString(),
    );
  }, [employees, storedAttendanceEvents]);

  const attendanceSummary = getAttendanceSummary(attendanceWindow);
  const effectiveScheduleEntries = useMemo(
    () => applyScheduleOverrides(scheduleEntries, scheduleOverrides),
    [scheduleEntries, scheduleOverrides],
  );
  const pendingTimeOffRequests = useMemo(
    () =>
      getAllTimeOffRequests(storedTimeOffRequests).filter(
        (request) =>
          request.status === "pending" &&
          requestBelongsToProperty(request, employees, adminProperty?.propertyKey),
      ),
    [adminProperty?.propertyKey, employees, storedTimeOffRequests],
  );
  const latestPendingTimeOffRequests = useMemo(
    () =>
      [...pendingTimeOffRequests]
        .sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted))
        .slice(0, 2),
    [pendingTimeOffRequests],
  );
  const pendingGiveawayRequests = useMemo(
    () => giveawayRequests.filter((request) => request.status === "pending"),
    [giveawayRequests],
  );
  const activeEmployees = useMemo(() => {
    const now = new Date();
    const activeNames = new Set(
      effectiveScheduleEntries
        .filter((entry) => entry.status === "scheduled")
        .filter((entry) => employeeBelongsToProperty(entry.employeeName, employees))
        .filter((entry) => {
          const range = parseShiftRange(entry.shiftDate, entry.shiftTime);

          if (!range) {
            return false;
          }

          return now.getTime() >= range.start.getTime() && now.getTime() <= range.end.getTime();
        })
        .map((entry) => entry.employeeName),
    );

    return activeNames.size;
  }, [effectiveScheduleEntries, employees]);
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
        <p className="admin-page-eyebrow">
          {getAdminModuleLabel(adminProperty?.moduleKey)} Module
        </p>
        <h1 className="admin-page-title">Overview</h1>
        <p className="admin-page-subtitle">
          {today} · {getAdminModuleLabel(adminProperty?.moduleKey)} ·{" "}
          {adminProperty?.propertyName ?? "This property"}
        </p>
      </header>

      <div className="admin-content">
        <div className="stat-row">
          <div className="stat-card">
            <p className="stat-label">Pending Requests</p>
            <p className={`stat-value ${pendingTimeOffRequests.length > 0 ? "alert" : "muted"}`}>
              {pendingTimeOffRequests.length}
            </p>
            <p className="stat-meta">
              {pendingTimeOffRequests.length > 0
                ? "Time-off requests awaiting review"
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
            <p className={`stat-value ${activeEmployees > 0 ? "ok" : "muted"}`}>{activeEmployees}</p>
            <p className="stat-meta">
              {activeEmployees > 0
                ? "Scheduled and currently on shift"
                : "No employees currently on shift"}
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
                <div className="quick-action-copy">
                  <p className="quick-action-title">{action.title}</p>
                  <p className="quick-action-desc">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-grid">
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <p className="admin-card-title">Pending Requests</p>
                <p className="admin-card-subtitle">Latest time-off requests awaiting review</p>
              </div>
              <Link href="/admin/requests" className="secondary-button" style={{ fontSize: "var(--text-sm-plus)" }}>
                View All
              </Link>
            </div>
            <div className="admin-card-body">
              {latestPendingTimeOffRequests.length === 0 ? (
                <div className="empty-state" style={{ textAlign: "center", padding: "28px 16px" }}>
                  <p className="mini-title" style={{ marginBottom: 6 }}>
                    No pending requests
                  </p>
                  <p className="mini-copy">
                    Time-off requests will appear here for review.
                  </p>
                </div>
              ) : (
                <div className="admin-giveaway-list">
                  {latestPendingTimeOffRequests.map((request) => (
                    <div key={request.id} className="admin-giveaway-item">
                      <div className="admin-giveaway-item-top">
                        <div>
                          <p className="admin-giveaway-title">{request.fullName}</p>
                          <p className="admin-giveaway-meta">
                            {request.shift} · {request.location} · Submitted {request.dateSubmitted}
                          </p>
                        </div>
                        <span className="badge warning">
                          {TIME_OFF_STATUS_LABELS[request.status]}
                        </span>
                      </div>
                      <p className="admin-giveaway-copy">
                        {request.datesAbsent} · {request.hoursAbsent} hours
                      </p>
                      <p className="admin-giveaway-copy">
                        {TIME_OFF_REASON_LABELS[request.reason]}
                      </p>
                      {request.explanation ? (
                        <p className="admin-giveaway-note">{request.explanation}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <p className="admin-card-title">Shift Exchanges</p>
                <p className="admin-card-subtitle">Pending giveaway and pickup requests</p>
              </div>
            </div>
            <div className="admin-card-body">
              {pendingGiveawayRequests.length === 0 ? (
                <div className="empty-state" style={{ textAlign: "center", padding: "28px 16px" }}>
                  <p className="mini-title" style={{ marginBottom: 6 }}>
                    No pending shift exchanges
                  </p>
                  <p className="mini-copy">
                    Shift giveaway and pickup requests will appear here for review.
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
                            {SHIFT_REQUEST_KIND_LABELS[request.requestKind]} · {request.shiftDayLabel}
                          </p>
                        </div>
                        <span className="badge warning">Pending</span>
                      </div>
                      <p className="admin-giveaway-copy">
                        Shift: {request.requesterShiftTime}
                      </p>
                      <p className="admin-giveaway-copy">
                        {request.targetDealerStatus === "off"
                          ? `${request.targetDealerName} is OFF`
                          : `${request.targetDealerName} currently has ${request.targetDealerShiftTime}`}
                      </p>
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
                <p className="admin-card-subtitle">Absent, tardy with PSL, and early out changes in the last 24 hours</p>
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
                    <p className="data-row-sub">Absent 1 Point and Absent - PSL entries combined</p>
                  </div>
                  <div className="data-row-right">
                    <span className="badge warning">{attendanceSummary.callOuts}</span>
                  </div>
                </div>
                <div className="data-row">
                  <div className="data-row-main">
                    <p className="data-row-title">Tardy with use of PSL</p>
                    <p className="data-row-sub">Late arrivals reported using PSL hours</p>
                  </div>
                  <div className="data-row-right">
                    <span className="badge gold">{attendanceSummary.reversePsl}</span>
                  </div>
                </div>
                <div className="data-row">
                  <div className="data-row-main">
                    <p className="data-row-title">Early Out</p>
                    <p className="data-row-sub">Early Out - 1/2 Point and Early Out - PSL reports</p>
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

        </div>
      </div>
    </>
  );
}

function employeeBelongsToProperty(
  employeeName: string,
  employees: { displayName: string; firstName?: string; lastName?: string }[],
) {
  const normalizedEmployeeName = employeeName.trim().toLowerCase();

  return employees.some((employee) => {
    const names = [
      employee.displayName,
      employee.firstName && employee.lastName
        ? `${employee.firstName} ${employee.lastName}`
        : null,
    ]
      .filter(Boolean)
      .map((value) => value?.trim().toLowerCase());

    return names.includes(normalizedEmployeeName);
  });
}

function requestBelongsToProperty(
  request: TimeOffRequest,
  employees: { displayName: string; firstName?: string; lastName?: string }[],
  propertyKey?: string,
) {
  if (!propertyKey) {
    return false;
  }

  if (request.location.trim().toLowerCase() === propertyKey.trim().toLowerCase()) {
    return true;
  }

  return employeeBelongsToProperty(request.fullName, employees);
}
