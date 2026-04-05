"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, Square, SquareCheckBig, X } from "lucide-react";
import { OPEN_SHIFT_POSTS } from "@/lib/open-shifts";
import {
  getAllAttendanceEvents,
  getAllowedPslHours,
  sanitizeAttendancePslHours,
  type AttendanceEvent,
  type AttendancePslHours,
  type AttendanceEventType,
} from "@/lib/attendance-events";
import {
  ATTENDANCE_EVENTS_UPDATED_EVENT,
  loadStoredAttendanceEvents,
  saveStoredAttendanceEvents,
} from "@/lib/attendance-event-store";
import shared from "./personal-shared.module.css";
import styles from "./home.module.css";
import requestStyles from "./requests/requests.module.css";
import exchangeStyles from "./exchange/exchange.module.css";

const CURRENT_USER = {
  firstName: "Matt",
  fullName: "Matthew Bayers",
  roleLabel: "Dealer",
};

const NEXT_SHIFT = {
  dateIso: "2026-04-05",
  dayLabel: "Saturday, April 5",
  shiftLabel: "Swing",
  startTime: "6:00 PM",
  endTime: "2:00 AM",
  startDateTime: "2026-04-05T18:00:00",
};

const WEEK_DAYS = [
  { name: "Sat", num: "12", shift: "10a–6p", today: false, off: false },
  { name: "Sun", num: "13", shift: "OFF", today: false, off: true },
  { name: "Mon", num: "14", shift: "2–10p", today: false, off: false },
  { name: "Tue", num: "15", shift: "2–10p", today: false, off: false },
  { name: "Wed", num: "16", shift: "OFF", today: false, off: true },
  { name: "Thu", num: "17", shift: "OFF", today: false, off: true },
  { name: "Fri", num: "18", shift: "10a–6p", today: false, off: false },
];

const ATTENDANCE_OPTIONS: Array<{
  value: AttendanceEventType;
  label: string;
}> = [
  { value: "call_out_point", label: "Call Out - 1 Point" },
  { value: "call_out_psl", label: "Call Out - PSL" },
  { value: "reverse_psl", label: "Reverse PSL" },
];

export default function PersonalHomePage() {
  const [storedEvents, setStoredEvents] = useState<AttendanceEvent[]>([]);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [attendanceType, setAttendanceType] =
    useState<AttendanceEventType>("call_out_point");
  const [pslHours, setPslHours] = useState<AttendancePslHours>(8);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const syncStoredEvents = () => {
      setStoredEvents(loadStoredAttendanceEvents());
    };

    syncStoredEvents();
    window.addEventListener(ATTENDANCE_EVENTS_UPDATED_EVENT, syncStoredEvents);
    window.addEventListener("storage", syncStoredEvents);

    return () => {
      window.removeEventListener(ATTENDANCE_EVENTS_UPDATED_EVENT, syncStoredEvents);
      window.removeEventListener("storage", syncStoredEvents);
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const nextHours = sanitizeAttendancePslHours(attendanceType, pslHours);

    if (nextHours && nextHours !== pslHours) {
      setPslHours(nextHours);
    }
  }, [attendanceType, pslHours]);

  const hasAtLeastTwoHours =
    new Date(NEXT_SHIFT.startDateTime).getTime() - nowMs >=
    2 * 60 * 60 * 1000;

  const shiftHasStarted = nowMs >= new Date(NEXT_SHIFT.startDateTime).getTime();

  const nextShiftAttendance = useMemo(
    () =>
      getAllAttendanceEvents(storedEvents).find(
        (event) =>
          event.employeeName === CURRENT_USER.fullName &&
          event.shiftDate === NEXT_SHIFT.dateIso,
      ),
    [storedEvents],
  );

  const activeNextShiftAttendance = shiftHasStarted ? null : nextShiftAttendance;

  function submitAttendance() {
    const newEvent: AttendanceEvent = {
      id: `attendance-${Date.now()}`,
      employeeName: CURRENT_USER.fullName,
      shiftDate: NEXT_SHIFT.dateIso,
      shiftLabel: NEXT_SHIFT.shiftLabel,
      shiftStartTime: NEXT_SHIFT.startTime,
      shiftEndTime: NEXT_SHIFT.endTime,
      eventType: attendanceType,
      pslHours: sanitizeAttendancePslHours(attendanceType, pslHours),
      note: note.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };

    const nextEvents = [newEvent, ...storedEvents];
    setStoredEvents(nextEvents);
    saveStoredAttendanceEvents(nextEvents);
    setIsAttendanceOpen(false);
    setSubmitted(true);
    setNote("");
    setAttendanceType("call_out_point");
    setPslHours(8);
    window.setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <main className={shared.personalContent}>
      <div className={`${shared.personalFullSpan} ${styles.nextShiftCardRow}`}>
        <div className={styles.nextShiftCard}>
          <p className={styles.nextShiftKicker}>Welcome Back</p>
          <span className={`${styles.shiftBadge} ${styles.roleBadge}`}>
            {CURRENT_USER.roleLabel}
          </span>
          <p className={styles.welcomeCardTitle}>{CURRENT_USER.firstName}</p>
          <div className={styles.nextShiftFooter}>
            <div className={`${styles.welcomeDetailBlock} ${styles.welcomeDetailBlockWide}`}>
              <p className={styles.welcomeDetailLabel}>Next shift</p>
              <p className={styles.welcomeDetailValue}>Tomorrow · {NEXT_SHIFT.dayLabel}</p>
              <p className={styles.welcomeDetailSubvalue}>
                {NEXT_SHIFT.startTime} - {NEXT_SHIFT.endTime}
              </p>
            </div>
          </div>
          <div className={styles.attendanceReportRow}>
            {activeNextShiftAttendance ? (
              <div className={`notice-card ok ${styles.attendanceStatusNotice}`}>
                <Check size={15} aria-hidden="true" />
                <div>
                  <p className="notice-title">Attendance reported</p>
                  <p className="notice-body">
                    {formatAttendanceSummary(activeNextShiftAttendance)}
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.attendanceReportActions}>
                <button
                  type="button"
                  className={`primary-button ${styles.attendanceReportButton}`}
                  onClick={() => setIsAttendanceOpen(true)}
                  disabled={!hasAtLeastTwoHours}
                >
                  Report Attendance
                </button>
                {!hasAtLeastTwoHours && (
                  <p className={styles.attendanceReportHelper}>
                    Attendance changes must be submitted at least 2 hours before
                    your scheduled shift.
                  </p>
                )}
              </div>
            )}
            {submitted && !activeNextShiftAttendance && (
              <p className={styles.attendanceReportHelper}>
                Your manager will receive this.
              </p>
            )}
          </div>
        </div>
      </div>

      <section
        className={`${shared.personalFullSpan} ${shared.personalSection} ${shared.personalPanel}`}
      >
        <div className={`${shared.personalSectionHeader} ${styles.sectionHeaderRow}`}>
          <div>
            <p className={shared.personalSectionKicker}>Schedule</p>
            <h2 className={shared.personalSectionTitle}>Your Week</h2>
          </div>
          <Link
            href="/personal/schedule"
            className={`secondary-button ${shared.personalCardAction}`}
          >
            Full Schedule
          </Link>
        </div>

        <div className={styles.scheduleOverviewStrip}>
          <div className={styles.weekStrip}>
            {WEEK_DAYS.map((day) => (
              <div
                key={day.name}
                className={[
                  styles.dayCell,
                  day.today ? styles.today : "",
                  day.off ? styles.offDay : styles.hasShift,
                ].join(" ").trim()}
              >
                <span className={styles.dayName}>{day.name}</span>
                <span className={styles.dayNum}>{day.num}</span>
                <span className={styles.dayShiftLabel}>{day.shift}</span>
              </div>
            ))}
          </div>
          <div className={shared.scheduleMobileFooter}>
            <Link
              href="/personal/schedule"
              className={`primary-button ${shared.personalMobileAction}`}
            >
              Full Schedule
            </Link>
          </div>
        </div>
      </section>

      <section
        className={`${shared.personalFullSpan} ${shared.personalSection} ${shared.personalPanel}`}
      >
        <div className={`${shared.personalSectionHeader} ${styles.sectionHeaderRow}`}>
          <div>
            <h2 className={shared.personalSectionTitle}>Shift Exchange</h2>
          </div>
          <Link
            href="/personal/exchange"
            className={`secondary-button ${shared.personalCardAction}`}
          >
            Open Board
          </Link>
        </div>

        <div className={shared.pCard}>
          <div className={shared.pCardHeader}>
            <p className={shared.pCardTitle}>Open Shifts</p>
          </div>
          <div className={shared.pCardBody}>
            <div className={exchangeStyles.exchangeList}>
              {OPEN_SHIFT_POSTS.slice(0, 2).map((post) => (
                <div key={post.id} className={exchangeStyles.exchangeRow}>
                  <p className={exchangeStyles.exchangeRowTitle}>{post.title}</p>
                  <p className={exchangeStyles.exchangeRowTime}>{post.line}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`${shared.pCardFooter} ${shared.personalMobileFooter}`}>
            <Link
              href="/personal/exchange"
              className={`primary-button ${shared.personalMobileAction}`}
            >
              Open Board
            </Link>
          </div>
        </div>
      </section>

      <section
        className={`${shared.personalFullSpan} ${shared.personalSection} ${shared.personalPanel}`}
      >
        <div className={`${shared.personalSectionHeader} ${styles.sectionHeaderRow}`}>
          <div>
            <h2 className={shared.personalSectionTitle}>My Requests</h2>
          </div>
          <Link
            href="/personal/requests"
            className={`secondary-button ${shared.personalCardAction}`}
          >
            View All
          </Link>
        </div>

        <div className={shared.pCard}>
          <div className={shared.pCardBody}>
            <div className="empty-state" style={{ padding: "20px 12px", textAlign: "center" }}>
              <p className="mini-title" style={{ marginBottom: 4 }}>
                No requests yet
              </p>
              <p className="mini-copy">
                Time-off requests you submit will appear here with their status.
              </p>
            </div>
          </div>
          <div className={shared.pCardFooter}>
            <Link
              href="/personal/requests"
              className="primary-button"
              style={{
                width: "100%",
                textAlign: "center",
                display: "block",
                minHeight: 44,
                lineHeight: "20px",
              }}
            >
              Request Time Off
            </Link>
          </div>
        </div>
      </section>

      {isAttendanceOpen && (
        <div
          className={styles.attendanceOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-modal-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsAttendanceOpen(false);
            }
          }}
        >
          <div className={styles.attendanceModal}>
            <div className={styles.attendanceModalHeader}>
              <div>
                <h2 className={styles.attendanceModalTitle} id="attendance-modal-title">
                  Report Attendance
                </h2>
                <p className={styles.attendanceModalSubtitle}>
                  {NEXT_SHIFT.dayLabel} · {NEXT_SHIFT.startTime} - {NEXT_SHIFT.endTime}
                </p>
              </div>
              <button
                type="button"
                className={styles.attendanceModalClose}
                onClick={() => setIsAttendanceOpen(false)}
                aria-label="Close attendance dialog"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.attendanceModalBody}>
              <div className={requestStyles.requestSection}>
                <p className={requestStyles.requestSectionTitle}>Attendance Type</p>
                <div className={requestStyles.requestWindowGrid}>
                  {ATTENDANCE_OPTIONS.map((option) => {
                    const selected = attendanceType === option.value;

                    return (
                      <label
                        key={option.value}
                        className={`${requestStyles.requestWindowCard} ${selected ? requestStyles.selected : ""}`}
                      >
                        <input
                          type="radio"
                          name="attendance-type"
                          checked={selected}
                          onChange={() => setAttendanceType(option.value)}
                        />
                        {selected ? (
                          <SquareCheckBig size={18} aria-hidden="true" />
                        ) : (
                          <Square size={18} aria-hidden="true" />
                        )}
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {getAllowedPslHours(attendanceType).length > 0 && (
                <div className={requestStyles.requestSection}>
                  <p className={requestStyles.requestSectionTitle}>PSL Hours</p>
                  <div className={requestStyles.requestWindowGrid}>
                    {getAllowedPslHours(attendanceType).map((hours) => {
                      const selected = pslHours === hours;

                      return (
                        <label
                          key={hours}
                          className={`${requestStyles.requestWindowCard} ${selected ? requestStyles.selected : ""}`}
                        >
                          <input
                            type="radio"
                            name="psl-hours"
                            checked={selected}
                            onChange={() => setPslHours(hours)}
                          />
                          {selected ? (
                            <SquareCheckBig size={18} aria-hidden="true" />
                          ) : (
                            <Square size={18} aria-hidden="true" />
                          )}
                          <span>{hours} Hours</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={requestStyles.requestSection}>
                <div className={shared.pField}>
                  <label className={shared.pLabel} htmlFor="attendance-note">
                    Note
                  </label>
                  <textarea
                    id="attendance-note"
                    className="text-input"
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Optional context for your manager"
                    style={{ resize: "vertical" }}
                  />
                </div>
              </div>

              <div className="notice-card info">
                <CircleAlert size={15} aria-hidden="true" />
                <div>
                  <p className="notice-title">2-hour rule</p>
                  <p className="notice-body">
                    Attendance changes must be submitted at least 2 hours before
                    your scheduled shift.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.attendanceModalFooter}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsAttendanceOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={submitAttendance}
              >
                Submit Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function formatAttendanceSummary(event: AttendanceEvent) {
  if (event.eventType === "call_out_point") {
    return "Full Point";
  }

  if (event.eventType === "call_out_psl") {
    return `PSL · ${event.pslHours} Hours`;
  }

  return `Reverse PSL - ${event.pslHours}h`;
}
