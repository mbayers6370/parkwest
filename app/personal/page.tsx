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

const MOCK_WEEK_TEMPLATE = [
  { name: "Sat", shift: "10a-6p", off: false, shiftLabel: "Day", startHour24: 10, endHour24: 18 },
  { name: "Sun", shift: "OFF", off: true },
  { name: "Mon", shift: "2-10p", off: false, shiftLabel: "Swing", startHour24: 14, endHour24: 22 },
  { name: "Tue", shift: "2-10p", off: false, shiftLabel: "Swing", startHour24: 14, endHour24: 22 },
  { name: "Wed", shift: "OFF", off: true },
  { name: "Thu", shift: "OFF", off: true },
  { name: "Fri", shift: "10a-6p", off: false, shiftLabel: "Day", startHour24: 10, endHour24: 18 },
] as const;

function getUpcomingSaturday(baseDate: Date) {
  const nextSaturday = new Date(baseDate);
  nextSaturday.setHours(0, 0, 0, 0);

  const daysUntilSaturday = (6 - nextSaturday.getDay() + 7) % 7;
  nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);

  return nextSaturday;
}

function formatShiftDateIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShiftTime(hour24: number) {
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:00 ${suffix}`;
}

function buildMockWeek(baseDate: Date) {
  const weekStart = getUpcomingSaturday(baseDate);
  const todayIso = formatShiftDateIso(baseDate);

  return MOCK_WEEK_TEMPLATE.map((template, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);

    const dateIso = formatShiftDateIso(date);

    return {
      ...template,
      dateIso,
      num: String(date.getDate()),
      today: dateIso === todayIso,
      monthShort: date.toLocaleDateString("en-US", { month: "short" }),
      shiftLabel: template.off ? null : template.shiftLabel,
      fullDayLabel: date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      startTime:
        template.off || template.startHour24 === undefined
          ? null
          : formatShiftTime(template.startHour24),
      endTime:
        template.off || template.endHour24 === undefined
          ? null
          : formatShiftTime(template.endHour24),
      startDateTime:
        template.off || template.startHour24 === undefined
          ? null
          : `${dateIso}T${String(template.startHour24).padStart(2, "0")}:00:00`,
    };
  });
}

function findNextScheduledShift(weekDays: ReturnType<typeof buildMockWeek>) {
  return weekDays.find((day) => !day.off && day.startDateTime) ?? null;
}

type MockWeekDay = ReturnType<typeof buildMockWeek>[number];

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
  const [selectedWeekDay, setSelectedWeekDay] = useState<MockWeekDay | null>(null);
  const [attendanceType, setAttendanceType] =
    useState<AttendanceEventType>("call_out_point");
  const [pslHours, setPslHours] = useState<AttendancePslHours>(8);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const weekDays = useMemo(() => buildMockWeek(new Date(nowMs)), [nowMs]);
  const nextShift = useMemo(() => findNextScheduledShift(weekDays), [weekDays]);

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

  const hasAtLeastTwoHours = nextShift
    ? new Date(nextShift.startDateTime as string).getTime() - nowMs >= 2 * 60 * 60 * 1000
    : false;

  const shiftHasStarted = nextShift
    ? nowMs >= new Date(nextShift.startDateTime as string).getTime()
    : false;

  const nextShiftAttendance = useMemo(
    () => {
      if (!nextShift) {
        return null;
      }

      return getAllAttendanceEvents(storedEvents).find(
        (event) =>
          event.employeeName === CURRENT_USER.fullName &&
          event.shiftDate === nextShift.dateIso,
      );
    },
    [nextShift, storedEvents],
  );

  const activeNextShiftAttendance = shiftHasStarted ? null : nextShiftAttendance;

  function submitAttendance() {
    if (!nextShift) {
      return;
    }

    const newEvent: AttendanceEvent = {
      id: `attendance-${Date.now()}`,
      employeeName: CURRENT_USER.fullName,
      shiftDate: nextShift.dateIso,
      shiftLabel: nextShift.shiftLabel ?? "Scheduled",
      shiftStartTime: nextShift.startTime ?? "",
      shiftEndTime: nextShift.endTime ?? "",
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
          <div className={styles.nextShiftBadgeRow}>
            <span className={`${styles.shiftBadge} ${styles.roleBadge}`}>
              {CURRENT_USER.roleLabel}
            </span>
          </div>
          <div className={styles.nextShiftTop}>
            <div className={styles.nextShiftIntro}>
              <p className={styles.nextShiftKicker}>Welcome Back</p>
              <p className={styles.welcomeCardTitle}>{CURRENT_USER.firstName}</p>
            </div>

            {/* ── Hero shift: big date + side-by-side times ── */}
            {nextShift ? (() => {
              const dayName = nextShift.name.toUpperCase();
              const monthShort = nextShift.monthShort.toUpperCase();
              return (
                <div className={styles.heroShiftBlock}>
                  <div className={styles.heroShiftMain}>
                    <div className={styles.heroDateCol}>
                      <p className={styles.heroShiftKicker}>Next Shift</p>
                      <span className={styles.heroDateNum}>{nextShift.num}</span>
                      <span className={styles.heroDateSub}>{monthShort} · {dayName}</span>
                    </div>
                    <div className={styles.heroTimeCol}>
                      <div className={styles.heroTimeEntry}>
                        <span className={styles.heroTimeLabel}>Start</span>
                        <span className={styles.heroTimeValue}>{nextShift.startTime}</span>
                      </div>
                      <div className={styles.heroTimeEntry}>
                        <span className={styles.heroTimeLabel}>End</span>
                        <span className={styles.heroTimeValue}>{nextShift.endTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })() : null}
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
                  Request Attendance Change
                </button>
                <p className={styles.attendanceReportHelper}>
                  Attendance changes must be submitted at least 2 hours before your scheduled shift.
                </p>
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
          <div className={styles.calendarStrip}>
            {/* Month row */}
            <div className={styles.monthRow} aria-label="Months">
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
                <Link
                  key={m}
                  href="/personal/schedule"
                  className={`${styles.monthPill} ${m === "Apr" ? styles.monthPillActive : ""}`}
                >
                  {m}
                </Link>
              ))}
            </div>
            {/* Date row */}
            <div className={styles.dateRow} role="list">
              {weekDays.map((day) => (
                <button
                  key={day.dateIso}
                  type="button"
                  role="listitem"
                  className={[
                    styles.dateCell,
                    day.today ? styles.dateCellToday : "",
                    day.off ? styles.dateCellOff : "",
                  ].filter(Boolean).join(" ")}
                  aria-label={`${day.name} ${day.num}, ${day.shift}`}
                  onClick={() => setSelectedWeekDay(day)}
                >
                  <span className={styles.dateCellNum}>{day.num}</span>
                  <span className={styles.dateCellName}>{day.name}</span>
                  {day.off
                    ? <span className={styles.dateCellDotEmpty} aria-hidden="true" />
                    : <span className={styles.dateCellDot} aria-hidden="true" />
                  }
                </button>
              ))}
            </div>
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
                  {nextShift
                    ? `${nextShift.fullDayLabel} · ${nextShift.startTime} - ${nextShift.endTime}`
                    : "No upcoming scheduled shift"}
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

              <div className={`notice-card ${styles.attendanceRuleNotice}`}>
                <div>
                  <div className={styles.attendanceRuleNoticeHeader}>
                    <CircleAlert
                      size={15}
                      aria-hidden="true"
                      className={styles.attendanceRuleNoticeIcon}
                    />
                    <p className={styles.attendanceRuleNoticeTitle}>2-Hour Rule</p>
                  </div>
                  <p className={styles.attendanceRuleNoticeBody}>
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

      {selectedWeekDay && (
        <div
          className={styles.attendanceOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="week-day-modal-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedWeekDay(null);
            }
          }}
        >
          <div className={`${styles.attendanceModal} ${styles.weekDayModal}`}>
            <div className={`${styles.attendanceModalHeader} ${styles.weekDayModalHeader}`}>
              <div>
                <h2
                  className={`${styles.attendanceModalTitle} ${styles.weekDayModalTitle}`}
                  id="week-day-modal-title"
                >
                  {selectedWeekDay.fullDayLabel}
                </h2>
              </div>
              <button
                type="button"
                className={`${styles.attendanceModalClose} ${styles.weekDayModalClose}`}
                onClick={() => setSelectedWeekDay(null)}
                aria-label="Close day details dialog"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.attendanceModalBody}>
              <div className={styles.weekDayDetailCard}>
                <p className={styles.weekDayDetailLabel}>Start Time</p>
                <p className={styles.weekDayDetailValue}>
                  {selectedWeekDay.off ? "Off" : selectedWeekDay.startTime}
                </p>
                {!selectedWeekDay.off && selectedWeekDay.endTime ? (
                  <p className={styles.weekDayDetailMeta}>Ends at {selectedWeekDay.endTime}</p>
                ) : (
                  <p className={styles.weekDayDetailMeta}>No shift is scheduled for this day.</p>
                )}
              </div>
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
