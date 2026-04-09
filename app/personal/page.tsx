"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, CircleAlert, Square, SquareCheckBig, X } from "lucide-react";
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
import {
  getCurrentWeekRange,
  getScheduleEntriesForEmployee,
  type ScheduleEntry,
} from "@/lib/mock-schedule";
import {
  loadStoredSchedule,
  SCHEDULE_UPDATED_EVENT,
} from "@/lib/mock-schedule-store";
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
import {
  COMMUNICATIONS_UPDATED_EVENT,
  getAllCommunications,
  loadStoredCommunications,
  splitCommunicationsByStatus,
  type CommunicationItem,
} from "@/lib/communications";
import shared from "./personal-shared.module.css";
import calendarStyles from "./personal-calendar.module.css";
import homeStyles from "./home.module.css";
import requestStyles from "./requests/requests.module.css";
import exchangeStyles from "./exchange/exchange.module.css";

const styles = { ...calendarStyles, ...homeStyles };

const CURRENT_USER = {
  firstName: "Matt",
  lastName: "Bayers",
  displayName: "Matt",
  roleLabel: "Dealer",
};
type HomeScheduleDay = {
  id: string;
  name: string;
  off: boolean;
  dateIso: string;
  num: string;
  today: boolean;
  monthShort: string;
  shiftLabel: string | null;
  fullDayLabel: string;
  startTime: string | null;
  endTime: string | null;
  startDateTime: string | null;
  past: boolean;
};

function getLocalIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTwentyFourHourTime(timeLabel: string) {
  const [timePart, meridiem] = timeLabel.split(" ");
  const [rawHour, rawMinute] = timePart.split(":").map(Number);
  let hour = rawHour % 12;

  if (meridiem === "PM") {
    hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${String(rawMinute ?? 0).padStart(2, "0")}:00`;
}

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
  const [storedRequests, setStoredRequests] = useState<TimeOffRequest[]>([]);
  const [storedCommunications, setStoredCommunications] = useState<CommunicationItem[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverride[]>([]);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [selectedWeekDay, setSelectedWeekDay] = useState<HomeScheduleDay | null>(null);
  const [attendanceType, setAttendanceType] =
    useState<AttendanceEventType>("call_out_point");
  const [pslHours, setPslHours] = useState<AttendancePslHours>(8);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const currentDate = useMemo(() => new Date(nowMs), [nowMs]);

  useEffect(() => {
    const syncStoredEvents = () => {
      setStoredEvents(loadStoredAttendanceEvents());
    };
    const syncSchedule = () => {
      setScheduleEntries(loadStoredSchedule());
    };
    const syncOverrides = () => {
      setScheduleOverrides(loadStoredScheduleOverrides());
    };
    const syncRequests = () => {
      setStoredRequests(loadStoredTimeOffRequests());
    };
    const syncCommunications = () => {
      setStoredCommunications(loadStoredCommunications());
    };

    syncStoredEvents();
    syncSchedule();
    syncOverrides();
    syncRequests();
    syncCommunications();
    window.addEventListener(ATTENDANCE_EVENTS_UPDATED_EVENT, syncStoredEvents);
    window.addEventListener(SCHEDULE_UPDATED_EVENT, syncSchedule);
    window.addEventListener(SCHEDULE_OVERRIDES_UPDATED_EVENT, syncOverrides);
    window.addEventListener(TIME_OFF_REQUESTS_UPDATED_EVENT, syncRequests);
    window.addEventListener(COMMUNICATIONS_UPDATED_EVENT, syncCommunications);
    window.addEventListener("storage", syncStoredEvents);
    window.addEventListener("storage", syncSchedule);
    window.addEventListener("storage", syncOverrides);
    window.addEventListener("storage", syncRequests);
    window.addEventListener("storage", syncCommunications);

    return () => {
      window.removeEventListener(ATTENDANCE_EVENTS_UPDATED_EVENT, syncStoredEvents);
      window.removeEventListener(SCHEDULE_UPDATED_EVENT, syncSchedule);
      window.removeEventListener(SCHEDULE_OVERRIDES_UPDATED_EVENT, syncOverrides);
      window.removeEventListener(TIME_OFF_REQUESTS_UPDATED_EVENT, syncRequests);
      window.removeEventListener(COMMUNICATIONS_UPDATED_EVENT, syncCommunications);
      window.removeEventListener("storage", syncStoredEvents);
      window.removeEventListener("storage", syncSchedule);
      window.removeEventListener("storage", syncOverrides);
      window.removeEventListener("storage", syncRequests);
      window.removeEventListener("storage", syncCommunications);
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

  const effectiveScheduleEntries = useMemo(
    () => applyScheduleOverrides(scheduleEntries, scheduleOverrides),
    [scheduleEntries, scheduleOverrides],
  );

  const { weekStartIso, weekEndIso } = useMemo(
    () => getCurrentWeekRange(currentDate),
    [currentDate],
  );
  const todayIso = useMemo(() => getLocalIsoDate(currentDate), [currentDate]);

  const weekDays = useMemo<HomeScheduleDay[]>(() => {
    return getScheduleEntriesForEmployee(effectiveScheduleEntries, CURRENT_USER.displayName)
      .filter((entry) => entry.shiftDate >= weekStartIso && entry.shiftDate <= weekEndIso)
      .sort((a, b) => a.shiftDate.localeCompare(b.shiftDate))
      .map((entry) => {
        const [startTime, endTime] =
          entry.status === "scheduled" ? entry.shiftTime.split("–").map((part) => part.trim()) : [null, null];

        return {
          id: entry.id,
          name: entry.dayShort,
          off: entry.status !== "scheduled",
          dateIso: entry.shiftDate,
          num: String(Number(entry.shiftDate.slice(-2))),
          today: entry.shiftDate === todayIso,
          monthShort: new Date(`${entry.shiftDate}T12:00:00`).toLocaleDateString("en-US", {
            month: "short",
          }),
          shiftLabel: entry.dept || null,
          fullDayLabel: entry.dayLabel,
          startTime,
          endTime,
          startDateTime: startTime ? `${entry.shiftDate}T${toTwentyFourHourTime(startTime)}` : null,
          past: entry.shiftDate < todayIso,
        };
      });
  }, [effectiveScheduleEntries, todayIso, weekEndIso, weekStartIso]);

  const nextShift = useMemo(() => {
    const futureShifts = getScheduleEntriesForEmployee(effectiveScheduleEntries, CURRENT_USER.displayName)
      .filter((entry) => entry.status === "scheduled")
      .sort((a, b) => a.shiftDate.localeCompare(b.shiftDate))
      .map((entry) => {
        const [startTime, endTime] = entry.shiftTime.split("–").map((part) => part.trim());
        return {
          id: entry.id,
          name: entry.dayShort,
          off: false,
          dateIso: entry.shiftDate,
          num: String(Number(entry.shiftDate.slice(-2))),
          today: entry.shiftDate === todayIso,
          monthShort: new Date(`${entry.shiftDate}T12:00:00`).toLocaleDateString("en-US", {
            month: "short",
          }),
          shiftLabel: entry.dept || null,
          fullDayLabel: entry.dayLabel,
          startTime,
          endTime,
          startDateTime: `${entry.shiftDate}T${toTwentyFourHourTime(startTime)}`,
          past: entry.shiftDate < todayIso,
        } satisfies HomeScheduleDay;
      });

    return (
      futureShifts.find(
        (entry) => entry.startDateTime && new Date(entry.startDateTime).getTime() >= nowMs,
      ) ?? null
    );
  }, [effectiveScheduleEntries, nowMs, todayIso]);

  const hasAtLeastTwoHours = nextShift
    ? new Date(nextShift.startDateTime as string).getTime() - nowMs >= 2 * 60 * 60 * 1000
    : false;

  const shiftHasStarted = nextShift
    ? nowMs >= new Date(nextShift.startDateTime as string).getTime()
    : false;
  const employeeRequests = useMemo(
    () =>
      getAllTimeOffRequests(storedRequests)
        .filter((request) => request.fullName === "Matthew Bayers")
        .sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted)),
    [storedRequests],
  );
  const featuredCommunication = useMemo(() => {
    const items = getAllCommunications(storedCommunications, "580");
    return splitCommunicationsByStatus(items, currentDate).active[0] ?? null;
  }, [currentDate, storedCommunications]);

  const nextShiftAttendance = useMemo(
    () => {
      if (!nextShift) {
        return null;
      }

      return getAllAttendanceEvents(storedEvents).find(
        (event) =>
          event.employeeName === CURRENT_USER.displayName &&
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
      employeeName: CURRENT_USER.displayName,
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

      {featuredCommunication ? (
        <section
          className={`${shared.personalFullSpan} ${shared.personalSection} ${shared.personalPanel} ${styles.communicationBannerPanel}`}
        >
          <div className={styles.communicationBanner}>
            <div>
              <p className={styles.communicationBannerKicker}>Communications</p>
              <h2 className={styles.communicationBannerTitle}>{featuredCommunication.title}</h2>
              <p className={styles.communicationBannerCopy}>{featuredCommunication.summary}</p>
            </div>
            <Link
              href="/personal/communications"
              className={`secondary-button ${styles.communicationBannerAction}`}
            >
              View Details
            </Link>
          </div>
        </section>
      ) : null}

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
            aria-label="Open full schedule"
            className={styles.sectionArrowAction}
          >
            <ChevronRight size={18} strokeWidth={2.25} />
          </Link>
        </div>

        <div className={styles.scheduleOverviewStrip}>
          <div className={styles.calendarStrip}>
            {/* Month row */}
            <div
              className={`${calendarStyles.monthRow} ${homeStyles.homeMonthRow ?? ""}`}
              aria-label="Months"
            >
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
                <Link
                  key={m}
                  href="/personal/schedule"
                  className={`${calendarStyles.monthPill} ${homeStyles.homeMonthPill ?? ""} ${m === "Apr" ? calendarStyles.monthPillActive : ""}`}
                >
                  {m}
                </Link>
              ))}
            </div>
            {/* Date row */}
            <div className={`${calendarStyles.dateRow} ${homeStyles.homeDateRow ?? ""}`} role="list">
              {weekDays.map((day) => (
                <button
                  key={day.dateIso}
                  type="button"
                  role="listitem"
                  className={[
                    calendarStyles.dateCell,
                    day.today ? calendarStyles.dateCellToday : "",
                    day.past ? calendarStyles.dateCellPast : "",
                    day.off ? styles.dateCellOff : "",
                  ].filter(Boolean).join(" ")}
                  aria-label={`${day.name} ${day.num}, ${day.off ? "Off" : `${day.startTime} to ${day.endTime}`}`}
                  onClick={() => setSelectedWeekDay(day)}
                >
                  <span className={calendarStyles.dateCellNum}>{day.num}</span>
                  <span className={calendarStyles.dateCellName}>{day.name}</span>
                  {day.off
                    ? <span className={calendarStyles.dateCellDotEmpty} aria-hidden="true" />
                    : <span className={calendarStyles.dateCellDot} aria-hidden="true" />
                  }
                </button>
              ))}
            </div>
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
            href="/personal/schedule#open-shifts"
            aria-label="Open shift exchange"
            className={styles.sectionArrowAction}
          >
            <ChevronRight size={18} strokeWidth={2.25} />
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
            aria-label="Open all requests"
            className={styles.sectionArrowAction}
          >
            <ChevronRight size={18} strokeWidth={2.25} />
          </Link>
        </div>

        <div className={shared.pCard}>
          <div className={shared.pCardBody}>
            {employeeRequests.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 12px", textAlign: "center" }}>
                <p className="mini-title" style={{ marginBottom: 4 }}>
                  No requests yet
                </p>
                <p className="mini-copy">
                  Time-off requests you submit will appear here with their status.
                </p>
              </div>
            ) : (
              employeeRequests.slice(0, 3).map((request) => (
                <div key={request.id} className={requestStyles.requestRow}>
                  <div className={requestStyles.requestInfo}>
                    <p className={requestStyles.requestInfoTitle}>{request.datesAbsent}</p>
                    <p className={requestStyles.requestInfoDates}>
                      {TIME_OFF_REASON_LABELS[request.reason]} · {TIME_OFF_STATUS_LABELS[request.status]}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      request.status === "approved"
                        ? "success"
                        : request.status === "not_approved"
                          ? "danger"
                          : "warning"
                    }`}
                  >
                    {TIME_OFF_STATUS_LABELS[request.status]}
                  </span>
                </div>
              ))
            )}
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
