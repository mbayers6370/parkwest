"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Search, X } from "lucide-react";
import {
  getAllAttendanceEvents,
  getAttendanceEventsForDate,
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
import { mockEmployees } from "@/lib/mock-data";
import styles from "./log.module.css";

type LogFilter = "all" | "points" | "psl";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function FloorLogPage() {
  const [storedAttendanceEvents, setStoredAttendanceEvents] = useState<AttendanceEvent[]>([]);
  const [filter, setFilter] = useState<LogFilter>("all");
  const [search, setSearch] = useState("");
  const [coverageSearch, setCoverageSearch] = useState("");
  const [selectedCoverageEmployeeId, setSelectedCoverageEmployeeId] = useState("");
  const [newCoverageAttendanceType, setNewCoverageAttendanceType] =
    useState<AttendanceEventType>("call_out_point");
  const [newCoverageAttendancePslHours, setNewCoverageAttendancePslHours] =
    useState<AttendancePslHours>(2);
  const [pendingClearEventId, setPendingClearEventId] = useState<string | null>(null);
  const [pendingEditEventId, setPendingEditEventId] = useState<string | null>(null);
  const [editAttendanceType, setEditAttendanceType] =
    useState<AttendanceEventType>("call_out_point");
  const [editAttendancePslHours, setEditAttendancePslHours] =
    useState<AttendancePslHours>(2);

  useEffect(() => {
    const syncStoredEvents = () => {
      setStoredAttendanceEvents(loadStoredAttendanceEvents());
    };

    syncStoredEvents();
    window.addEventListener(ATTENDANCE_EVENTS_UPDATED_EVENT, syncStoredEvents);
    window.addEventListener("storage", syncStoredEvents);

    return () => {
      window.removeEventListener(ATTENDANCE_EVENTS_UPDATED_EVENT, syncStoredEvents);
      window.removeEventListener("storage", syncStoredEvents);
    };
  }, []);

  const todayIso = toIsoDate(new Date());
  const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    new Date(`${todayIso}T12:00:00`),
  );
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(new Date(`${todayIso}T12:00:00`));

  const todayAttendanceEvents = useMemo(
    () =>
      getAttendanceEventsForDate(
        getAllAttendanceEvents(storedAttendanceEvents),
        todayIso,
      ),
    [storedAttendanceEvents, todayIso],
  );

  const specialtyTeamMembers = useMemo(
    () =>
      mockEmployees
        .map((employee) => {
          const primaryDepartment = employee.departmentAssignments.find(
            (assignment) => assignment.isPrimary,
          )?.department.departmentName;
          const fullName =
            employee.aliases.find((alias) => alias.aliasName.includes(" "))?.aliasName ??
            `${employee.firstName} ${employee.lastName}`.trim();

          return {
            id: employee.id,
            name: fullName,
            departmentLabel: primaryDepartment ?? "Team",
            shiftLabel: "Coverage",
            shiftStartTime: primaryDepartment ?? "Specialty",
            shiftEndTime: "Team",
          };
        })
        .filter((employee) => {
          const normalizedDept = employee.departmentLabel.toLowerCase();
          return normalizedDept.includes("floor") || normalizedDept.includes("chip");
        }),
    [],
  );

  const filteredCoverageMembers = useMemo(() => {
    const normalizedSearch = coverageSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return [];
    }

    return specialtyTeamMembers
      .filter((employee) => employee.name.toLowerCase().includes(normalizedSearch))
      .slice(0, 8);
  }, [coverageSearch, specialtyTeamMembers]);

  const selectedCoverageEmployee = useMemo(
    () =>
      specialtyTeamMembers.find((employee) => employee.id === selectedCoverageEmployeeId) ??
      null,
    [selectedCoverageEmployeeId, specialtyTeamMembers],
  );

  const specialtyNameSet = useMemo(
    () => new Set(specialtyTeamMembers.map((employee) => employee.name)),
    [specialtyTeamMembers],
  );

  const specialtyAttendanceEvents = useMemo(
    () => todayAttendanceEvents.filter((event) => specialtyNameSet.has(event.employeeName)),
    [specialtyNameSet, todayAttendanceEvents],
  );

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return todayAttendanceEvents.filter((event) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "points"
            ? event.eventType === "call_out_point" || event.eventType === "half_point"
            : event.eventType === "call_out_psl" ||
              event.eventType === "reverse_psl" ||
              event.eventType === "psl_leave_early";

      const matchesSearch = normalizedSearch
        ? event.employeeName.toLowerCase().includes(normalizedSearch)
        : true;

      return matchesFilter && matchesSearch;
    });
  }, [filter, search, todayAttendanceEvents]);

  const pendingClearEvent = useMemo(
    () =>
      pendingClearEventId
        ? todayAttendanceEvents.find((event) => event.id === pendingClearEventId) ?? null
        : null,
    [pendingClearEventId, todayAttendanceEvents],
  );

  const pendingEditEvent = useMemo(
    () =>
      pendingEditEventId
        ? todayAttendanceEvents.find((event) => event.id === pendingEditEventId) ?? null
        : null,
    [pendingEditEventId, todayAttendanceEvents],
  );

  function clearAttendanceEvent(eventId: string) {
    setStoredAttendanceEvents((prev) => {
      const next = prev.filter((event) => event.id !== eventId);
      saveStoredAttendanceEvents(next);
      return next;
    });
  }

  function updateAttendanceEvent(
    eventId: string,
    eventType: AttendanceEventType,
    pslHours?: AttendancePslHours,
  ) {
    setStoredAttendanceEvents((prev) => {
      const next = prev.map((event) =>
        event.id === eventId
          ? {
              ...event,
              submittedAt: new Date().toISOString(),
              eventType,
              pslHours: sanitizeAttendancePslHours(eventType, pslHours),
            }
          : event,
      );

      saveStoredAttendanceEvents(next);
      return next;
    });
  }

  function submitCoverageAttendance() {
    if (!selectedCoverageEmployee) {
      return;
    }

    const nextEvent: AttendanceEvent = {
      id: `attendance-${Date.now()}`,
      employeeName: selectedCoverageEmployee.name,
      shiftDate: todayIso,
      shiftLabel: selectedCoverageEmployee.shiftLabel,
      shiftStartTime: selectedCoverageEmployee.shiftStartTime,
      shiftEndTime: selectedCoverageEmployee.shiftEndTime,
      eventType: newCoverageAttendanceType,
      pslHours: sanitizeAttendancePslHours(
        newCoverageAttendanceType,
        newCoverageAttendancePslHours,
      ),
      submittedAt: new Date().toISOString(),
    };

    setStoredAttendanceEvents((prev) => {
      const next = [nextEvent, ...prev];
      saveStoredAttendanceEvents(next);
      return next;
    });

    setCoverageSearch("");
    setSelectedCoverageEmployeeId("");
    setNewCoverageAttendanceType("call_out_point");
    setNewCoverageAttendancePslHours(2);
  }

  return (
    <>
      <main className={styles.floorContent}>
        <div className={styles.floorLogLayout}>
          <div className={`${styles.floorSection} ${styles.floorCoverageSection}`}>
            <div className={styles.floorSectionHeader}>
              <div>
                <p className={styles.floorSectionTitle}>Floor / Chip Runner Coverage</p>
                <p className={styles.floorSectionSubtitle}>
                  Search floor and chip runner staff and log attendance changes.
                </p>
              </div>
            </div>

            <div className={styles.floorSectionBody}>
              <div className={styles.floorAttendanceCreate}>
                <div className="field-stack">
                  <label className="field-label" htmlFor="coverage-attendance-search">
                    Search Floor Or Chip Runner Staff
                  </label>
                  <input
                    id="coverage-attendance-search"
                    className="text-input"
                    type="text"
                    value={coverageSearch}
                    onChange={(event) => {
                      setCoverageSearch(event.target.value);
                      setSelectedCoverageEmployeeId("");
                    }}
                    placeholder="Start typing a floor or chip runner name"
                    autoComplete="off"
                  />
                </div>

                {coverageSearch.trim() ? (
                  <div className={styles.floorAttendanceSearchResults}>
                    {filteredCoverageMembers.length === 0 ? (
                      <div className={styles.floorAttendanceNoResults}>
                        No floor or chip runner staff match that search.
                      </div>
                    ) : (
                      filteredCoverageMembers.map((employee) => (
                        <button
                          key={employee.id}
                          type="button"
                          className={cx(
                            styles.floorAttendanceResult,
                            selectedCoverageEmployeeId === employee.id &&
                              styles.floorAttendanceResultActive,
                          )}
                          onClick={() => {
                            setSelectedCoverageEmployeeId(employee.id);
                            setCoverageSearch(employee.name);
                          }}
                        >
                          <span className={styles.floorAttendanceResultName}>
                            {employee.name}
                          </span>
                          <span className={styles.floorAttendanceResultMeta}>
                            {employee.departmentLabel}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}

                <div className={styles.floorAttendanceCreateGrid}>
                  <div className="field-stack">
                    <span className="field-label">Attendance Type</span>
                    <div className={styles.floorAttendanceTypeRow}>
                      <button
                        type="button"
                        className={cx(
                          styles.floorPill,
                          styles.floorAttendanceChip,
                          newCoverageAttendanceType === "call_out_point" &&
                            styles.floorPillActive,
                        )}
                        onClick={() => setNewCoverageAttendanceType("call_out_point")}
                      >
                        Call Out - 1 Point
                      </button>
                      <button
                        type="button"
                        className={cx(
                          styles.floorPill,
                          styles.floorAttendanceChip,
                          newCoverageAttendanceType === "half_point" &&
                            styles.floorPillHalfPointActive,
                        )}
                        onClick={() => setNewCoverageAttendanceType("half_point")}
                      >
                        Half Point
                      </button>
                      <button
                        type="button"
                        className={cx(
                          styles.floorPill,
                          styles.floorAttendanceChip,
                          newCoverageAttendanceType === "psl_leave_early" &&
                            styles.floorPillActive,
                        )}
                        onClick={() => setNewCoverageAttendanceType("psl_leave_early")}
                      >
                        PSL Leave Early
                      </button>
                    </div>
                  </div>

                  {getAllowedPslHours(newCoverageAttendanceType).length > 0 ? (
                    <div className={`field-stack ${styles.floorAttendanceHoursField}`}>
                      <label className="field-label" htmlFor="coverage-attendance-psl-hours">
                        PSL Hours
                      </label>
                      <select
                        id="coverage-attendance-psl-hours"
                        className={`text-input ${styles.floorAttendanceHoursInput}`}
                        value={newCoverageAttendancePslHours}
                        onChange={(event) =>
                          setNewCoverageAttendancePslHours(
                            Number(event.target.value) as AttendancePslHours,
                          )
                        }
                      >
                        {getAllowedPslHours(newCoverageAttendanceType).map((hours) => (
                          <option key={hours} value={hours}>
                            {hours} Hours
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  className={`primary-button ${styles.floorAttendanceSubmit}`}
                  disabled={!selectedCoverageEmployee}
                  onClick={submitCoverageAttendance}
                >
                  Add Attendance Entry
                </button>
              </div>

              {specialtyAttendanceEvents.length === 0 ? (
                <div className={styles.floorLogEmpty}>
                  <p className="mini-title" style={{ marginBottom: 6 }}>
                    No floor or chip runner reports yet
                  </p>
                  <p className="mini-copy">
                    New coverage attendance edits will appear here for review.
                  </p>
                </div>
              ) : (
                <div className={styles.floorAttendanceAlertList}>
                  {specialtyAttendanceEvents.map((event) => (
                    <div key={event.id} className={styles.floorAttendanceEditor}>
                      <div className={styles.floorAttendanceEditorTop}>
                        <div>
                          <p className={styles.floorAttendanceEditorName}>{event.employeeName}</p>
                          <p className={styles.floorAttendanceEditorMeta}>
                            {event.shiftStartTime} · {getAttendanceActionLabel(event)}
                            {event.pslHours ? ` · ${event.pslHours} Hours` : ""}
                          </p>
                        </div>
                        <div className={styles.floorAttendanceEditorActions}>
                          <button
                            type="button"
                            className={`${styles.floorAttendanceDismiss} ${styles.floorAttendanceEdit}`}
                            aria-label={`Edit ${event.employeeName} attendance report`}
                            onClick={() => {
                              setPendingEditEventId(event.id);
                              setEditAttendanceType(event.eventType);
                              setEditAttendancePslHours(
                                sanitizeAttendancePslHours(
                                  event.eventType,
                                  event.pslHours,
                                ) ?? 2,
                              );
                            }}
                          >
                            <Pencil size={14} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={styles.floorAttendanceDismiss}
                            aria-label={`Remove ${event.employeeName} attendance report`}
                            onClick={() => setPendingClearEventId(event.id)}
                          >
                            <X size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.floorSection}>
            <div className={styles.floorSectionHeader}>
              <div>
                <p className={styles.floorSectionTitle}>Attendance</p>
                <p className={styles.floorSectionSubtitle}>
                  {dayLabel}, {dateLabel}
                </p>
              </div>
            </div>

            <div className={styles.floorSectionBody}>
              <div className={styles.floorLogToolbar}>
                <div className={styles.floorFilterRow}>
                  <button
                    className={`${styles.floorPill} ${filter === "all" ? styles.floorPillActive : ""}`}
                    type="button"
                    onClick={() => setFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={`${styles.floorPill} ${filter === "points" ? styles.floorPillActive : ""}`}
                    type="button"
                    onClick={() => setFilter("points")}
                  >
                    Points
                  </button>
                  <button
                    className={`${styles.floorPill} ${filter === "psl" ? styles.floorPillActive : ""}`}
                    type="button"
                    onClick={() => setFilter("psl")}
                  >
                    PSL
                  </button>
                </div>

                <label className={styles.floorLogSearch}>
                  <Search size={14} aria-hidden="true" />
                  <input
                    className="text-input"
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search attendance reports"
                  />
                </label>
              </div>

              {filteredEvents.length === 0 ? (
                <div className={styles.floorLogEmpty}>
                  <p className="mini-title" style={{ marginBottom: 6 }}>
                    No attendance reports found
                  </p>
                  <p className="mini-copy">
                    Attendance reports from the Now page will appear here for review.
                  </p>
                </div>
              ) : (
                <div className={styles.floorAttendanceAlertList}>
                  {filteredEvents.map((event) => (
                    <div key={event.id} className={styles.floorAttendanceEditor}>
                      <div className={styles.floorAttendanceEditorTop}>
                        <div>
                          <p className={styles.floorAttendanceEditorName}>{event.employeeName}</p>
                          <p className={styles.floorAttendanceEditorMeta}>
                            {event.shiftStartTime} · {getAttendanceActionLabel(event)}
                            {event.pslHours ? ` · ${event.pslHours} Hours` : ""}
                          </p>
                        </div>
                        <div className={styles.floorAttendanceEditorActions}>
                          <button
                            type="button"
                            className={`${styles.floorAttendanceDismiss} ${styles.floorAttendanceEdit}`}
                            aria-label={`Edit ${event.employeeName} attendance report`}
                            onClick={() => {
                              setPendingEditEventId(event.id);
                              setEditAttendanceType(event.eventType);
                              setEditAttendancePslHours(
                                sanitizeAttendancePslHours(
                                  event.eventType,
                                  event.pslHours,
                                ) ?? 2,
                              );
                            }}
                          >
                            <Pencil size={14} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={styles.floorAttendanceDismiss}
                            aria-label={`Remove ${event.employeeName} attendance report`}
                            onClick={() => setPendingClearEventId(event.id)}
                          >
                            <X size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {pendingClearEvent && (
        <div
          className={styles.lineupOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-clear-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPendingClearEventId(null);
            }
          }}
        >
          <div className={styles.lineupModal}>
            <div className={styles.lineupModalHeader}>
              <div className={styles.lineupModalHeaderLeft}>
                <h2 className={styles.lineupModalTitle} id="attendance-clear-title">
                  Remove Attendance Report
                </h2>
                <p className={styles.lineupModalMeta}>
                  This will remove the attendance report for {pendingClearEvent.employeeName}.
                </p>
              </div>
            </div>
            <div className={styles.lineupModalBody}>
              <p className={styles.confirmModalCopy}>
                Are you sure you want to remove this attendance report?
              </p>
            </div>
            <div className={styles.confirmModalFooter}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPendingClearEventId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  clearAttendanceEvent(pendingClearEvent.id);
                  setPendingClearEventId(null);
                }}
              >
                Remove Report
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingEditEvent && (
        <div
          className={styles.lineupOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-edit-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPendingEditEventId(null);
            }
          }}
        >
          <div className={styles.lineupModal}>
            <div className={styles.lineupModalHeader}>
              <div className={styles.lineupModalHeaderLeft}>
                <h2 className={styles.lineupModalTitle} id="attendance-edit-title">
                  Edit Attendance Report
                </h2>
                <p className={styles.lineupModalMeta}>
                  Update the attendance report for {pendingEditEvent.employeeName}.
                </p>
              </div>
            </div>
            <div className={styles.lineupModalBody}>
              <div className="field-stack">
                <span className="field-label">Attendance Type</span>
                <div className={styles.floorAttendanceTypeRow}>
                  <button
                    type="button"
                    className={`${styles.floorPill} ${styles.floorAttendanceChip} ${editAttendanceType === "call_out_point" ? styles.floorPillActive : ""}`}
                    onClick={() => setEditAttendanceType("call_out_point")}
                  >
                    Call Out - 1 Point
                  </button>
                  <button
                    type="button"
                    className={`${styles.floorPill} ${styles.floorAttendanceChip} ${editAttendanceType === "call_out_psl" ? styles.floorPillActive : ""}`}
                    onClick={() => setEditAttendanceType("call_out_psl")}
                  >
                    PSL
                  </button>
                  <button
                    type="button"
                    className={`${styles.floorPill} ${styles.floorAttendanceChip} ${editAttendanceType === "reverse_psl" ? styles.floorPillActive : ""}`}
                    onClick={() => setEditAttendanceType("reverse_psl")}
                  >
                    Reverse PSL
                  </button>
                  <button
                    type="button"
                    className={`${styles.floorPill} ${styles.floorAttendanceChip} ${editAttendanceType === "half_point" ? styles.floorPillHalfPointActive : ""}`}
                    onClick={() => setEditAttendanceType("half_point")}
                  >
                    Half Point
                  </button>
                  <button
                    type="button"
                    className={`${styles.floorPill} ${styles.floorAttendanceChip} ${editAttendanceType === "psl_leave_early" ? styles.floorPillActive : ""}`}
                    onClick={() => setEditAttendanceType("psl_leave_early")}
                  >
                    PSL Leave Early
                  </button>
                </div>
              </div>

              {getAllowedPslHours(editAttendanceType).length > 0 && (
                <div className={`field-stack ${styles.floorAttendanceModalHoursField}`}>
                  <label className="field-label" htmlFor="attendance-edit-psl-hours">
                    PSL Hours
                  </label>
                  <select
                    id="attendance-edit-psl-hours"
                    className={`text-input ${styles.floorAttendanceHoursInput}`}
                    value={editAttendancePslHours}
                    onChange={(event) =>
                      setEditAttendancePslHours(
                        Number(event.target.value) as AttendancePslHours,
                      )
                    }
                  >
                    {getAllowedPslHours(editAttendanceType).map((hours) => (
                      <option key={hours} value={hours}>
                        {hours} Hours
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className={styles.confirmModalFooter}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPendingEditEventId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  updateAttendanceEvent(
                    pendingEditEvent.id,
                    editAttendanceType,
                    sanitizeAttendancePslHours(
                      editAttendanceType,
                      editAttendancePslHours,
                    ),
                  );
                  setPendingEditEventId(null);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function toIsoDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
    .toISOString()
    .slice(0, 10);
}

function getAttendanceActionLabel(event: AttendanceEvent) {
  if (event.eventType === "call_out_point") {
    return "Full Point";
  }

  if (event.eventType === "call_out_psl") {
    return "PSL";
  }

  if (event.eventType === "reverse_psl") {
    return "Reverse PSL";
  }

  if (event.eventType === "half_point") {
    return "Half Point";
  }

  return "PSL Leave Early";
}
