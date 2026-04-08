"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquareMore,
  Repeat,
  Split,
  TriangleAlert,
} from "lucide-react";
import {
  getAllAttendanceEvents,
  getAttendanceSummary,
  type AttendanceEvent,
} from "@/lib/attendance-events";
import {
  ATTENDANCE_EVENTS_UPDATED_EVENT,
  loadStoredAttendanceEvents,
} from "@/lib/attendance-event-store";
import {
  getAllEmployeeNames,
  getCurrentWeekRange,
  getScheduleEntriesForEmployee,
  getScheduleEntryForEmployeeAndDate,
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
  applyApprovedGiveawayRequest,
  getEmployeeShiftExchangeRole,
  SHIFT_REQUEST_ROUTE_LABELS,
  SHIFT_REQUEST_KIND_LABELS,
  validateShiftGiveawayRequest,
  type ShiftGiveawayRequest,
} from "@/lib/shift-giveaway-requests";
import {
  loadStoredShiftGiveawayRequests,
  saveStoredShiftGiveawayRequests,
  SHIFT_GIVEAWAY_REQUESTS_UPDATED_EVENT,
} from "@/lib/shift-giveaway-request-store";
import {
  loadStoredScheduleOverrides,
  SCHEDULE_OVERRIDES_UPDATED_EVENT,
} from "@/lib/schedule-override-store";
import { saveStoredSchedule } from "@/lib/mock-schedule-store";
import shared from "../personal-shared.module.css";
import exchangeStyles from "../exchange/exchange.module.css";
import styles from "./schedule.module.css";

const CURRENT_EMPLOYEE_NAME = "Matt";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Scheduled", cls: "success" },
  off: { label: "OFF", cls: "warning" },
  pto: { label: "PTO", cls: "gold" },
  ro: { label: "RO", cls: "gold" },
  psl: { label: "PSL", cls: "gold" },
};

const ACTION_OPTIONS = [
  { id: "giveaway", label: "Give Away Shift", icon: Repeat },
  { id: "switch", label: "Switch Shift", icon: Split },
  { id: "post", label: "Post Shift", icon: Repeat },
  { id: "problem", label: "Report Problem", icon: TriangleAlert },
] as const;

type ActionType = (typeof ACTION_OPTIONS)[number]["id"];

function getLocalIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PersonalSchedulePage() {
  const [storedAttendanceEvents, setStoredAttendanceEvents] = useState<AttendanceEvent[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverride[]>([]);
  const [giveawayRequests, setGiveawayRequests] = useState<ShiftGiveawayRequest[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [hasManualDaySelection, setHasManualDaySelection] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionType>("giveaway");
  const [actionNote, setActionNote] = useState("");
  const [selectedDealerName, setSelectedDealerName] = useState("");
  const [selectedPickupOwnerName, setSelectedPickupOwnerName] = useState("");
  const [isOpenShiftsExpanded, setIsOpenShiftsExpanded] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const todayIso = useMemo(() => getLocalIsoDate(new Date()), []);
  const { weekStartIso, weekEndIso } = useMemo(() => getCurrentWeekRange(new Date()), []);

  useEffect(() => {
    const syncStoredEvents = () => {
      setStoredAttendanceEvents(loadStoredAttendanceEvents());
    };
    const syncSchedule = () => {
      setScheduleEntries(loadStoredSchedule());
    };
    const syncRequests = () => {
      setGiveawayRequests(loadStoredShiftGiveawayRequests());
    };
    const syncOverrides = () => {
      setScheduleOverrides(loadStoredScheduleOverrides());
    };

    syncStoredEvents();
    syncSchedule();
    syncRequests();
    syncOverrides();

    window.addEventListener(ATTENDANCE_EVENTS_UPDATED_EVENT, syncStoredEvents);
    window.addEventListener(SCHEDULE_UPDATED_EVENT, syncSchedule);
    window.addEventListener(SHIFT_GIVEAWAY_REQUESTS_UPDATED_EVENT, syncRequests);
    window.addEventListener(SCHEDULE_OVERRIDES_UPDATED_EVENT, syncOverrides);
    window.addEventListener("storage", syncStoredEvents);
    window.addEventListener("storage", syncSchedule);
    window.addEventListener("storage", syncRequests);
    window.addEventListener("storage", syncOverrides);

    return () => {
      window.removeEventListener(ATTENDANCE_EVENTS_UPDATED_EVENT, syncStoredEvents);
      window.removeEventListener(SCHEDULE_UPDATED_EVENT, syncSchedule);
      window.removeEventListener(SHIFT_GIVEAWAY_REQUESTS_UPDATED_EVENT, syncRequests);
      window.removeEventListener(SCHEDULE_OVERRIDES_UPDATED_EVENT, syncOverrides);
      window.removeEventListener("storage", syncStoredEvents);
      window.removeEventListener("storage", syncSchedule);
      window.removeEventListener("storage", syncRequests);
      window.removeEventListener("storage", syncOverrides);
    };
  }, []);

  const effectiveScheduleEntries = useMemo(
    () => applyScheduleOverrides(scheduleEntries, scheduleOverrides),
    [scheduleEntries, scheduleOverrides],
  );

  const scheduleRows = useMemo(
    () =>
      getScheduleEntriesForEmployee(effectiveScheduleEntries, CURRENT_EMPLOYEE_NAME)
        .filter((entry) => entry.shiftDate >= weekStartIso && entry.shiftDate <= weekEndIso)
        .sort((a, b) => a.shiftDate.localeCompare(b.shiftDate)),
    [effectiveScheduleEntries, weekEndIso, weekStartIso],
  );

  useEffect(() => {
    if (!hasManualDaySelection && scheduleRows.length > 0) {
      const todayRow = scheduleRows.find((row) => row.shiftDate === todayIso);
      setSelectedDayId((todayRow ?? scheduleRows[0]).id);
    }
  }, [hasManualDaySelection, scheduleRows, todayIso]);

  const weekAttendanceSummary = useMemo(() => {
    const employeeWeekEvents = getAllAttendanceEvents(storedAttendanceEvents).filter(
      (event) =>
        event.employeeName === CURRENT_EMPLOYEE_NAME &&
        event.shiftDate >= weekStartIso &&
        event.shiftDate <= weekEndIso,
    );

    return getAttendanceSummary(employeeWeekEvents);
  }, [storedAttendanceEvents, weekEndIso, weekStartIso]);

  const shiftsScheduled = scheduleRows.filter((row) => row.status === "scheduled").length;
  const daysOff = scheduleRows.filter((row) => row.status === "off").length;
  const totalHours = scheduleRows.reduce((total, row) => {
    if (row.status !== "scheduled" || row.shiftTime === "OFF") {
      return total;
    }

    return total + 8;
  }, 0);

  const summaryCards = [
    { label: "Shifts Scheduled", value: String(shiftsScheduled), badgeClass: "success" },
    { label: "Days Off", value: String(daysOff), badgeClass: "warning" },
    { label: "Total Hours", value: `${totalHours}h`, badgeClass: "gold" },
    {
      label: "Full Points Used",
      value: String(weekAttendanceSummary.pointCallOuts),
      badgeClass: "danger",
    },
    {
      label: "Half Points Used",
      value: String(weekAttendanceSummary.halfPoints),
      badgeClass: "warning",
    },
    {
      label: "PSL Hours Used",
      value: `${weekAttendanceSummary.pslHours}h`,
      badgeClass: "gold",
    },
    {
      label: "Reverse PSL Uses",
      value: String(weekAttendanceSummary.reversePsl),
      badgeClass: "success",
    },
  ];

  const selectedDay =
    scheduleRows.find((row) => row.id === selectedDayId) ?? scheduleRows[0] ?? null;
  const activeMonthIndex = selectedDay
    ? new Date(`${selectedDay.shiftDate}T12:00:00`).getMonth()
    : new Date(`${weekStartIso}T12:00:00`).getMonth();
  const isWorkingDay = selectedDay?.status === "scheduled";
  const isOffDay = selectedDay?.status === "off" && selectedDay?.shiftTime === "OFF";
  const availableActions = isWorkingDay
    ? ACTION_OPTIONS
    : ACTION_OPTIONS.filter((action) => action.id === "problem");

  useEffect(() => {
    if (availableActions.length > 0 && !availableActions.some((action) => action.id === selectedAction)) {
      setSelectedAction(availableActions[0].id);
    }
  }, [availableActions, selectedAction]);

  const selectedDayCandidates = useMemo(() => {
    if (!selectedDay || (selectedAction !== "giveaway" && selectedAction !== "switch")) {
      return [];
    }

    return getAllEmployeeNames(effectiveScheduleEntries)
      .filter((name) => name !== CURRENT_EMPLOYEE_NAME)
      .map((name) => {
        const scheduleEntry = getScheduleEntryForEmployeeAndDate(
          effectiveScheduleEntries,
          name,
          selectedDay.shiftDate,
        );

        return {
          name,
          scheduleEntry,
          validation: validateShiftGiveawayRequest({
            scheduleEntries: effectiveScheduleEntries,
            requesterName: CURRENT_EMPLOYEE_NAME,
            targetDealerName: name,
            shiftDate: selectedDay.shiftDate,
            requestKind: selectedAction,
          }),
        };
      })
      .filter(
        (candidate) =>
          candidate.scheduleEntry &&
          (selectedAction !== "switch" || candidate.scheduleEntry.status === "scheduled") &&
          (selectedAction !== "switch" || candidate.validation.roleCompatible),
      );
  }, [effectiveScheduleEntries, selectedAction, selectedDay]);

  const selectedCandidate = selectedDayCandidates.find(
    (candidate) => candidate.name === selectedDealerName,
  );
  const openShiftCandidates = useMemo(() => {
    if (!selectedDay || !isOffDay) {
      return [];
    }

    return effectiveScheduleEntries
      .filter((entry) => entry.shiftDate === selectedDay.shiftDate)
      .filter((entry) => entry.employeeName !== CURRENT_EMPLOYEE_NAME)
      .filter((entry) => entry.status === "scheduled" && entry.shiftTime !== "OFF")
      .map((entry) => {
        const validation = validateShiftGiveawayRequest({
          scheduleEntries: effectiveScheduleEntries,
          requesterName: entry.employeeName,
          targetDealerName: CURRENT_EMPLOYEE_NAME,
          shiftDate: selectedDay.shiftDate,
          requestKind: "giveaway",
        });
        const pendingRequest =
          giveawayRequests.find(
            (request) =>
              request.status === "pending" &&
              request.requestKind === "giveaway" &&
              request.shiftDate === selectedDay.shiftDate &&
              request.requesterName === entry.employeeName &&
              request.targetDealerName === CURRENT_EMPLOYEE_NAME,
          ) ?? null;

        return {
          id: entry.id,
          employeeName: entry.employeeName,
          shiftTime: entry.shiftTime,
          dept: entry.dept,
          validation,
          pendingRequest,
        };
      });
  }, [effectiveScheduleEntries, giveawayRequests, isOffDay, selectedDay]);
  const selectedPickupCandidate = openShiftCandidates.find(
    (candidate) => candidate.employeeName === selectedPickupOwnerName,
  );

  const selectedDayRequest = useMemo(
    () =>
      giveawayRequests.find(
        (request) =>
          request.requesterName === CURRENT_EMPLOYEE_NAME &&
          request.shiftDate === selectedDay?.shiftDate &&
          request.requestKind === (selectedAction === "switch" ? "switch" : "giveaway") &&
          request.status === "pending",
      ) ?? null,
    [giveawayRequests, selectedAction, selectedDay],
  );
  const selectedPickupRequest = useMemo(
    () =>
      giveawayRequests.find(
        (request) =>
          request.status === "pending" &&
          request.requestKind === "giveaway" &&
          request.shiftDate === selectedDay?.shiftDate &&
          request.targetDealerName === CURRENT_EMPLOYEE_NAME &&
          (selectedPickupOwnerName ? request.requesterName === selectedPickupOwnerName : true),
      ) ?? null,
    [giveawayRequests, selectedDay, selectedPickupOwnerName],
  );
  const currentEmployeeRole = useMemo(
    () =>
      getEmployeeShiftExchangeRole(
        effectiveScheduleEntries,
        CURRENT_EMPLOYEE_NAME,
        selectedDay?.shiftDate,
      ),
    [effectiveScheduleEntries, selectedDay?.shiftDate],
  );

  function handleSubmitShiftRequest() {
    if (!selectedDay || !selectedCandidate || !selectedCandidate.validation.valid) {
      return;
    }

    const approvalRoute = selectedCandidate.validation.approvalRoute;
    const nextRequest: ShiftGiveawayRequest = {
      id: `giveaway-${Date.now()}`,
      requestKind: selectedAction === "switch" ? "switch" : "giveaway",
      requesterName: CURRENT_EMPLOYEE_NAME,
      requesterRole: selectedCandidate.validation.requesterRole,
      targetDealerName: selectedCandidate.name,
      targetDealerRole: selectedCandidate.validation.targetRole,
      shiftDate: selectedDay.shiftDate,
      shiftDayLabel: selectedDay.dayLabel,
      requesterShiftTime: selectedDay.shiftTime,
      targetDealerShiftTime: selectedCandidate.scheduleEntry?.shiftTime ?? "OFF",
      targetDealerStatus:
        selectedCandidate.scheduleEntry?.status === "scheduled" ? "scheduled" : "off",
      approvalRoute,
      note: actionNote.trim() || undefined,
      status: approvalRoute === "automatic" ? "approved" : "pending",
      submittedAt: new Date().toISOString(),
      reviewedAt: approvalRoute === "automatic" ? new Date().toISOString() : undefined,
      reviewedBy: approvalRoute === "automatic" ? "Automatic Floor Rule" : undefined,
      validationSnapshot: {
        submittedAtLeastFourHoursBefore:
          selectedCandidate.validation.submittedAtLeastFourHoursBefore,
        targetDealerEligibleForRestWindow:
          selectedCandidate.validation.targetDealerEligibleForRestWindow,
        restHoursBeforeShift: selectedCandidate.validation.restHoursBeforeShift,
        targetDealerAlreadyAtSixDays:
          selectedCandidate.validation.targetDealerAlreadyAtSixDays,
      },
    };

    if (approvalRoute === "automatic") {
      const nextScheduleEntries = applyApprovedGiveawayRequest(scheduleEntries, nextRequest);
      setScheduleEntries(nextScheduleEntries);
      saveStoredSchedule(nextScheduleEntries);
    }

    const nextRequests = [nextRequest, ...giveawayRequests];
    setGiveawayRequests(nextRequests);
    saveStoredShiftGiveawayRequests(nextRequests);
    setSubmitMessage(
      approvalRoute === "automatic"
        ? "Switch processed automatically."
        : approvalRoute === "admin_only"
          ? `${selectedAction === "switch" ? "Switch" : "Giveaway"} request sent to admin.`
          : selectedAction === "switch"
            ? "Switch request sent for floor and admin review."
            : "Giveaway request sent for floor and admin review.",
    );
    setActionNote("");
    setSelectedDealerName("");
    window.setTimeout(() => setSubmitMessage(""), 4000);
  }

  function handleSubmitPickupRequest() {
    if (!selectedDay || !selectedPickupCandidate || !selectedPickupCandidate.validation.valid) {
      return;
    }

    const approvalRoute = selectedPickupCandidate.validation.approvalRoute;
    const nextRequest: ShiftGiveawayRequest = {
      id: `giveaway-${Date.now()}`,
      requestKind: "giveaway",
      requesterName: selectedPickupCandidate.employeeName,
      requesterRole: selectedPickupCandidate.validation.requesterRole,
      targetDealerName: CURRENT_EMPLOYEE_NAME,
      targetDealerRole: selectedPickupCandidate.validation.targetRole,
      shiftDate: selectedDay.shiftDate,
      shiftDayLabel: selectedDay.dayLabel,
      requesterShiftTime: selectedPickupCandidate.shiftTime,
      targetDealerShiftTime: selectedDay.shiftTime,
      targetDealerStatus: "off",
      approvalRoute,
      note: actionNote.trim() || undefined,
      status: approvalRoute === "automatic" ? "approved" : "pending",
      submittedAt: new Date().toISOString(),
      reviewedAt: approvalRoute === "automatic" ? new Date().toISOString() : undefined,
      reviewedBy: approvalRoute === "automatic" ? "Automatic Floor Rule" : undefined,
      validationSnapshot: {
        submittedAtLeastFourHoursBefore:
          selectedPickupCandidate.validation.submittedAtLeastFourHoursBefore,
        targetDealerEligibleForRestWindow:
          selectedPickupCandidate.validation.targetDealerEligibleForRestWindow,
        restHoursBeforeShift: selectedPickupCandidate.validation.restHoursBeforeShift,
        targetDealerAlreadyAtSixDays:
          selectedPickupCandidate.validation.targetDealerAlreadyAtSixDays,
      },
    };

    if (approvalRoute === "automatic") {
      const nextScheduleEntries = applyApprovedGiveawayRequest(scheduleEntries, nextRequest);
      setScheduleEntries(nextScheduleEntries);
      saveStoredSchedule(nextScheduleEntries);
    }

    const nextRequests = [nextRequest, ...giveawayRequests];
    setGiveawayRequests(nextRequests);
    saveStoredShiftGiveawayRequests(nextRequests);
    setSubmitMessage(
      approvalRoute === "automatic"
        ? "Pickup processed automatically."
        : approvalRoute === "admin_only"
          ? "Pickup request sent to admin."
          : "Pickup request sent for floor and admin review.",
    );
    setSelectedPickupOwnerName("");
    window.setTimeout(() => setSubmitMessage(""), 4000);
  }

  return (
    <main className={shared.personalContent}>
      <div className={`${shared.personalColMain} ${styles.schedulePageMain}`}>
        <div className={`${shared.pCard} ${styles.scheduleWeekHeaderCard}`}>
          <div className={`${shared.pCardHeader} ${styles.scheduleWeekHeaderInner}`}>
            <div className={styles.scheduleWeekTitleBlock}>
              <p className={shared.pCardEyebrow}>Schedule</p>
              <p className={shared.pCardTitle}>Your Week</p>
            </div>
          </div>
          <div className={shared.pCardBody}>
            <div className={styles.calendarStrip}>
              <div className={styles.monthRow}>
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((month, index) => (
                  <span
                    key={month}
                    className={`${styles.monthPill} ${index === activeMonthIndex ? styles.monthPillActive : ""}`}
                  >
                    {month}
                  </span>
                ))}
              </div>
              <div className={styles.dateRow}>
                {scheduleRows.map((row) => {
                  const isSelected = row.id === selectedDayId;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      className={`${styles.dateCell} ${row.status !== "scheduled" ? styles.dateCellOff : ""} ${row.shiftDate < todayIso ? styles.dateCellPast : ""} ${row.shiftDate === todayIso ? styles.dateCellToday : ""} ${isSelected ? styles.dateCellSelected : ""}`}
                      onClick={() => {
                        setHasManualDaySelection(true);
                        setSelectedDayId(row.id);
                      }}
                    >
                      <span className={styles.dateCellNum}>
                        {row.shiftDate.slice(-2).replace(/^0/, "")}
                      </span>
                      <span className={styles.dateCellName}>{row.dayShort}</span>
                      <span className={row.status === "scheduled" ? styles.dateCellDot : styles.dateCellDotEmpty} />
                    </button>
                  );
                })}
              </div>
              <div className={styles.scheduleWeekNav}>
                <button className={`secondary-button ${styles.scheduleWeekNavButton}`} type="button">
                  <ChevronLeft size={16} strokeWidth={2} />
                  <span>Prev</span>
                </button>
                <button className={`secondary-button ${styles.scheduleWeekNavButton}`} type="button">
                  <span>Next</span>
                  <ChevronRight size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedDay && (
          <div className={`${shared.pCard} ${styles.scheduleActionCard}`}>
            <div className={shared.pCardHeader}>
              <div>
                <p className={shared.pCardTitle}>{selectedDay.dayLabel}</p>
                <p className={styles.scheduleActionSubtitle}>
                  {selectedDay.shiftTime}
                  {selectedDay.dept ? ` · ${selectedDay.dept}` : ""}
                </p>
              </div>
            </div>
            <div className={shared.pCardBody}>
              <div className={styles.scheduleActionGrid}>
                {availableActions.map((action) => {
                  const Icon = action.icon;
                  const isSelected = selectedAction === action.id;

                  return (
                    <button
                      key={action.id}
                      type="button"
                      className={`${styles.scheduleActionPill} ${isSelected ? styles.scheduleActionPillSelected : ""}`}
                      onClick={() => setSelectedAction(action.id)}
                    >
                      <Icon size={15} aria-hidden="true" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>

              {(selectedAction === "giveaway" || selectedAction === "switch") && isWorkingDay ? (
                <div className={styles.scheduleGiveawayPanel}>
                  <div className={shared.pField}>
                    <label className={shared.pLabel} htmlFor="giveaway-dealer">
                      {selectedAction === "switch" ? "Choose Coworker to Switch With" : "Choose Coworker"}
                    </label>
                    <select
                      id="giveaway-dealer"
                      className="text-input"
                      value={selectedDealerName}
                      onChange={(event) => setSelectedDealerName(event.target.value)}
                    >
                      <option value="">Select a coworker</option>
                      {selectedDayCandidates.map((candidate) => (
                        <option key={candidate.name} value={candidate.name}>
                          {candidate.name}
                          {" · "}
                          {candidate.scheduleEntry?.shiftTime ?? "OFF"}
                          {candidate.validation.targetRole
                            ? ` · ${candidate.validation.targetRole.replace("_", " ")}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCandidate && (
                    <div className={styles.scheduleValidationBlock}>
                      <p className={styles.scheduleValidationLine}>
                        {selectedAction === "switch"
                          ? `This coworker is currently scheduled for ${selectedCandidate.scheduleEntry?.shiftTime}.`
                          : selectedCandidate.scheduleEntry?.status === "off"
                            ? "This coworker is off that day."
                            : `This coworker is currently scheduled for ${selectedCandidate.scheduleEntry?.shiftTime}.`}
                      </p>
                      <p className={styles.scheduleValidationLine}>
                        Routing:{" "}
                        {SHIFT_REQUEST_ROUTE_LABELS[
                          selectedCandidate.validation.approvalRoute ?? "floor_admin"
                        ]}
                      </p>
                      {selectedCandidate.validation.restHoursBeforeShift !== null && (
                        <p className={styles.scheduleValidationLine}>
                          Rest before shift: {selectedCandidate.validation.restHoursBeforeShift} hours
                        </p>
                      )}
                      {selectedCandidate.validation.targetDealerAlreadyAtSixDays && (
                        <div className="notice-card danger">
                          <TriangleAlert size={14} aria-hidden="true" />
                          <div>
                            <p className="notice-title">Red flag</p>
                            <p className="notice-body">
                              This dealer is already scheduled for six days this week. Floor and
                              admin will see this note before approval.
                            </p>
                          </div>
                        </div>
                      )}
                      {!selectedCandidate.validation.valid && (
                        <div className="notice-card info">
                          <MessageSquareMore size={14} aria-hidden="true" />
                          <div>
                            <p className="notice-title">Cannot submit yet</p>
                            <p className="notice-body">{selectedCandidate.validation.message}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              <div className={styles.scheduleActionNote}>
                <label className={shared.pLabel} htmlFor="schedule-day-note">
                  {selectedAction === "problem"
                    ? "Describe the issue for this day"
                      : selectedAction === "post"
                        ? "Add notes for the shift post"
                        : selectedAction === "switch"
                          ? "Add context for this switch request"
                      : "Add context for this giveaway request"}
                </label>
                <textarea
                  id="schedule-day-note"
                  className="text-input"
                  rows={4}
                  value={actionNote}
                  onChange={(event) => setActionNote(event.target.value)}
                  placeholder={
                    selectedAction === "problem"
                      ? "Let your manager know what went wrong for this day."
                      : "Add anything your manager or coworkers should know."
                  }
                  style={{ resize: "vertical" }}
                  />
                </div>

              <div className={styles.scheduleActionFooter}>
                <div className={styles.scheduleActionHint}>
                  <MessageSquareMore size={15} aria-hidden="true" />
                  <span>
                    {selectedAction === "problem"
                      ? "This will go to admin for review."
                      : selectedAction === "giveaway" || selectedAction === "switch"
                        ? selectedCandidate
                          ? selectedCandidate.validation.approvalRoute === "automatic"
                            ? "This will process automatically based on floor role rules."
                            : selectedCandidate.validation.approvalRoute === "admin_only"
                              ? "This will go to admin only for review."
                              : "This will go to floor and admin for approval."
                          : currentEmployeeRole === "chip_runner" || currentEmployeeRole === "cage"
                            ? "This request type routes to admin only."
                            : "This will go to floor and admin for approval."
                        : "Posting flow is staged for the exchange board next."}
                  </span>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  disabled={
                    selectedAction === "giveaway" || selectedAction === "switch"
                      ? !selectedCandidate || !selectedCandidate.validation.valid || Boolean(selectedDayRequest)
                      : true
                  }
                  onClick={() => {
                    if (selectedAction === "giveaway" || selectedAction === "switch") {
                      handleSubmitShiftRequest();
                    }
                  }}
                >
                  {selectedAction === "problem"
                    ? "Submit Issue"
                    : selectedAction === "post"
                      ? "Post Shift"
                      : selectedDayRequest
                        ? "Request Pending"
                        : selectedAction === "switch"
                          ? selectedCandidate?.validation.approvalRoute === "automatic"
                            ? "Process Switch"
                            : "Request Switch"
                          : "Request Giveaway"}
                </button>
              </div>

              {submitMessage ? (
                <p className={styles.scheduleSubmitMessage}>{submitMessage}</p>
              ) : selectedDayRequest ? (
                <p className={styles.scheduleSubmitMessage}>
                  {SHIFT_REQUEST_KIND_LABELS[selectedDayRequest.requestKind]} request pending review.
                </p>
              ) : null}
            </div>
          </div>
        )}

        <div
          id="open-shifts"
          className={`${shared.pCard} ${styles.scheduleExchangeCard}`}
        >
          <div className={`${shared.pCardHeader} ${styles.scheduleExchangeHeader}`}>
            <p className={shared.pCardTitle}>Open Shifts</p>
            <button
              type="button"
              className={styles.scheduleExchangeToggle}
              aria-expanded={isOpenShiftsExpanded}
              aria-controls="open-shifts-body"
              onClick={() => setIsOpenShiftsExpanded((current) => !current)}
            >
              {isOpenShiftsExpanded ? (
                <ChevronDown size={18} strokeWidth={2.25} aria-hidden="true" />
              ) : (
                <ChevronRight size={18} strokeWidth={2.25} aria-hidden="true" />
              )}
            </button>
          </div>
          {isOpenShiftsExpanded ? (
            <div id="open-shifts-body" className={`${shared.pCardBody} ${styles.scheduleExchangeBody}`}>
              {!isOffDay ? (
                <div className="empty-state" style={{ padding: "20px 12px", textAlign: "center" }}>
                  <p className="mini-title" style={{ marginBottom: 4 }}>
                    Select an OFF day
                  </p>
                  <p className="mini-copy">
                    Open shifts populate here only when your selected day is OFF.
                  </p>
                </div>
              ) : openShiftCandidates.length === 0 ? (
                <div className="empty-state" style={{ padding: "20px 12px", textAlign: "center" }}>
                  <p className="mini-title" style={{ marginBottom: 4 }}>
                    No open shifts available
                  </p>
                  <p className="mini-copy">
                    There are no eligible scheduled shifts to pick up for this day.
                  </p>
                </div>
              ) : (
                <div className={styles.schedulePickupPanel}>
                  <div className={`${exchangeStyles.exchangeList} ${styles.scheduleExchangeList}`}>
                    {openShiftCandidates.map((candidate) => {
                      const isSelected = selectedPickupOwnerName === candidate.employeeName;
                      return (
                        <button
                          key={candidate.id}
                          type="button"
                          className={`${styles.schedulePickupRow} ${isSelected ? styles.schedulePickupRowSelected : ""}`}
                          onClick={() => setSelectedPickupOwnerName(candidate.employeeName)}
                        >
                          <span className={styles.schedulePickupRowTitle}>{candidate.employeeName}</span>
                          <span className={styles.schedulePickupRowMeta}>
                            {candidate.shiftTime}
                            {candidate.dept ? ` · ${candidate.dept}` : ""}
                            {candidate.pendingRequest ? " · Pending" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedPickupCandidate && !selectedPickupCandidate.validation.valid ? (
                    <div className="notice-card info">
                      <MessageSquareMore size={14} aria-hidden="true" />
                      <div>
                        <p className="notice-title">Cannot submit yet</p>
                        <p className="notice-body">{selectedPickupCandidate.validation.message}</p>
                      </div>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="primary-button"
                    disabled={
                      !selectedPickupCandidate ||
                      !selectedPickupCandidate.validation.valid ||
                      Boolean(selectedPickupRequest)
                    }
                    onClick={handleSubmitPickupRequest}
                  >
                    {selectedPickupRequest ? "Request Pending" : "Request Pickup"}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className={shared.personalColSide}>
        <div className={shared.pCard}>
          <div className={shared.pCardHeader}>
            <p className={shared.pCardTitle}>Week Summary</p>
          </div>
          <div className={shared.pCardBody}>
            <div className={styles.summaryGrid}>
              {summaryCards.map((card) => (
                <div key={card.label} className={styles.summaryStatCard}>
                  <p className={styles.summaryStatLabel}>{card.label}</p>
                  <span className={`badge ${card.badgeClass} ${styles.summaryStatValue}`}>
                    {card.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
