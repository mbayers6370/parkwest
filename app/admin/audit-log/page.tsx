"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ATTENDANCE_EVENT_LABELS,
  formatAttendanceEventDetail,
  getAllAttendanceEvents,
  getAttendanceSummary,
  getLast24HourAttendanceEvents,
  type AttendanceEvent,
} from "@/lib/attendance-events";
import { loadStoredAttendanceEvents } from "@/lib/attendance-event-store";
import {
  SCHEDULE_OVERRIDE_KIND_LABELS,
  type ScheduleOverride,
} from "@/lib/schedule-overrides";
import {
  loadStoredScheduleOverrides,
  SCHEDULE_OVERRIDES_UPDATED_EVENT,
} from "@/lib/schedule-override-store";

export default function AdminAuditLogPage() {
  const [storedAttendanceEvents, setStoredAttendanceEvents] = useState<
    AttendanceEvent[]
  >([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverride[]>([]);
  const [activeTab, setActiveTab] = useState<"attendance" | "schedule">("attendance");

  useEffect(() => {
    const syncAttendanceEvents = () => {
      setStoredAttendanceEvents(loadStoredAttendanceEvents());
    };
    const syncScheduleOverrides = () => {
      setScheduleOverrides(loadStoredScheduleOverrides());
    };

    syncAttendanceEvents();
    syncScheduleOverrides();
    window.addEventListener("storage", syncAttendanceEvents);
    window.addEventListener("storage", syncScheduleOverrides);
    window.addEventListener(SCHEDULE_OVERRIDES_UPDATED_EVENT, syncScheduleOverrides);

    return () => {
      window.removeEventListener("storage", syncAttendanceEvents);
      window.removeEventListener("storage", syncScheduleOverrides);
      window.removeEventListener(SCHEDULE_OVERRIDES_UPDATED_EVENT, syncScheduleOverrides);
    };
  }, []);

  const attendanceWindow = useMemo(() => {
    return getLast24HourAttendanceEvents(
      getAllAttendanceEvents(storedAttendanceEvents),
      new Date().toISOString(),
    );
  }, [storedAttendanceEvents]);

  const summary = getAttendanceSummary(attendanceWindow);
  const recentScheduleOverrides = useMemo(
    () =>
      [...scheduleOverrides]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 24),
    [scheduleOverrides],
  );

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Attendance Log</h1>
        <p className="admin-page-subtitle">
          Daily attendance report for the last 24 hours
        </p>
        <nav className="admin-page-tabs" aria-label="Audit filters">
          <button
            type="button"
            className={`admin-page-tab${activeTab === "attendance" ? " active" : ""}`}
            onClick={() => setActiveTab("attendance")}
          >
            Attendance
          </button>
          <button
            type="button"
            className={`admin-page-tab${activeTab === "schedule" ? " active" : ""}`}
            onClick={() => setActiveTab("schedule")}
          >
            Schedule Changes
          </button>
        </nav>
      </header>

      <div className="admin-content">
        {activeTab === "attendance" ? (
          <>
            <div className="stat-row">
              <div className="stat-card">
                <p className="stat-label">Total Entries</p>
                <p className="stat-value ok">{summary.total}</p>
                <p className="stat-meta">Attendance reports in the last 24 hours</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Call Outs</p>
                <p className="stat-value warn">{summary.callOuts}</p>
                <p className="stat-meta">PSL and 1-point full shift call outs</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Reverse PSL</p>
                <p className="stat-value">{summary.reversePsl}</p>
                <p className="stat-meta">Delayed starts in 2-hour increments</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Leave Early</p>
                <p className="stat-value ok">{summary.leaveEarly}</p>
                <p className="stat-meta">Half points and PSL leave-early reports</p>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <p className="admin-card-title">Daily Attendance Log</p>
                  <p className="admin-card-subtitle">
                    Employee attendance submissions recorded over the last 24 hours
                  </p>
                </div>
              </div>
              <div className="admin-card-body">
                {attendanceWindow.length === 0 ? (
                  <div className="empty-state" style={{ textAlign: "center", padding: "32px 16px" }}>
                    <p className="mini-title" style={{ marginBottom: 8 }}>
                      No attendance entries yet
                    </p>
                    <p className="mini-copy">
                      Employee and floor attendance changes will appear here once they are reported.
                    </p>
                  </div>
                ) : (
                  <div className="data-list">
                    {attendanceWindow.map((event) => (
                      <div key={event.id} className="data-row">
                        <div className="data-row-main">
                          <p className="data-row-title">{event.employeeName}</p>
                          <p className="data-row-sub">
                            {event.shiftDate} · {event.shiftStartTime} - {event.shiftEndTime} · Submitted{" "}
                            {formatTime(event.submittedAt)}
                          </p>
                        </div>
                        <div className="data-row-right">
                          <span className="badge gold">{ATTENDANCE_EVENT_LABELS[event.eventType]}</span>
                          <span className="badge success">{formatAttendanceEventDetail(event)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
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
        )}
      </div>
    </>
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
