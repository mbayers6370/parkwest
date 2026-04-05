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

export default function AdminAuditLogPage() {
  const [storedAttendanceEvents, setStoredAttendanceEvents] = useState<
    AttendanceEvent[]
  >([]);

  useEffect(() => {
    setStoredAttendanceEvents(loadStoredAttendanceEvents());
  }, []);

  const attendanceWindow = useMemo(() => {
    return getLast24HourAttendanceEvents(
      getAllAttendanceEvents(storedAttendanceEvents),
      new Date().toISOString(),
    );
  }, [storedAttendanceEvents]);

  const summary = getAttendanceSummary(attendanceWindow);

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Attendance Log</h1>
        <p className="admin-page-subtitle">
          Daily attendance report for the last 24 hours
        </p>
        <nav className="admin-page-tabs" aria-label="Audit filters">
          <span className="admin-page-tab active">Attendance</span>
          <span className="admin-page-tab">Requests</span>
          <span className="admin-page-tab">Schedule</span>
        </nav>
      </header>

      <div className="admin-content">
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
