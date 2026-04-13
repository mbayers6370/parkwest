export type AttendanceEventType =
  | "call_out_point"
  | "call_out_psl"
  | "reverse_psl"
  | "half_point"
  | "psl_leave_early";

export type AttendancePslHours = 2 | 4 | 6 | 8;

export type AttendanceEvent = {
  id: string;
  employeeName: string;
  shiftDate: string;
  shiftLabel: string;
  shiftStartTime: string;
  shiftEndTime: string;
  eventType: AttendanceEventType;
  pslHours?: AttendancePslHours;
  note?: string;
  submittedAt: string;
};

export const ATTENDANCE_EVENTS_STORAGE_KEY = "parkwest-attendance-events";

export const ATTENDANCE_EVENT_LABELS: Record<AttendanceEventType, string> = {
  call_out_point: "Absent 1 Point",
  call_out_psl: "Absent - PSL",
  reverse_psl: "Tardy with use of PSL",
  half_point: "Early Out - 1/2 Point",
  psl_leave_early: "Early Out - PSL",
};

export const MOCK_ATTENDANCE_EVENTS: AttendanceEvent[] = [];

export function getAllowedPslHours(
  eventType: AttendanceEventType,
): AttendancePslHours[] {
  if (eventType === "call_out_psl") {
    return [8];
  }

  if (eventType === "reverse_psl" || eventType === "psl_leave_early") {
    return [2, 4, 6, 8];
  }

  return [];
}

export function usesPslHours(eventType: AttendanceEventType) {
  return getAllowedPslHours(eventType).length > 0;
}

export function sanitizeAttendancePslHours(
  eventType: AttendanceEventType,
  hours?: AttendancePslHours,
) {
  const allowedHours = getAllowedPslHours(eventType);

  if (allowedHours.length === 0) {
    return undefined;
  }

  if (hours && allowedHours.includes(hours)) {
    return hours;
  }

  return allowedHours[0];
}

export function getAllAttendanceEvents(storedEvents: AttendanceEvent[] = []) {
  return [...storedEvents, ...MOCK_ATTENDANCE_EVENTS].sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  );
}

export function getAttendanceEventsForDate(
  events: AttendanceEvent[],
  isoDate: string,
) {
  return events.filter((event) => event.shiftDate === isoDate);
}

export function getAttendanceSummary(events: AttendanceEvent[]) {
  const callOuts = events.filter(
    (event) =>
      event.eventType === "call_out_point" || event.eventType === "call_out_psl",
  ).length;
  const reversePsl = events.filter(
    (event) => event.eventType === "reverse_psl",
  ).length;
  const leaveEarly = events.filter(
    (event) =>
      event.eventType === "half_point" || event.eventType === "psl_leave_early",
  ).length;
  const pointCallOuts = events.filter(
    (event) => event.eventType === "call_out_point",
  ).length;
  const pslCallOuts = events.filter(
    (event) => event.eventType === "call_out_psl",
  ).length;
  const halfPoints = events.filter(
    (event) => event.eventType === "half_point",
  ).length;
  const pslLeaveEarly = events.filter(
    (event) => event.eventType === "psl_leave_early",
  ).length;
  const pslHours = events.reduce(
    (total, event) => total + (event.pslHours ?? 0),
    0,
  );

  return {
    total: events.length,
    callOuts,
    reversePsl,
    leaveEarly,
    pointCallOuts,
    pslCallOuts,
    halfPoints,
    pslLeaveEarly,
    pslHours,
  };
}

export function formatAttendanceEventLabel(
  eventType: AttendanceEventType,
  pslHours?: AttendancePslHours,
) {
  if (eventType === "reverse_psl" || eventType === "psl_leave_early") {
    return `${ATTENDANCE_EVENT_LABELS[eventType]} ${pslHours ?? 0} Hours`;
  }

  return ATTENDANCE_EVENT_LABELS[eventType];
}

export function formatAttendanceEventDetail(event: AttendanceEvent) {
  return formatAttendanceEventLabel(event.eventType, event.pslHours);
}

export function getLast24HourAttendanceEvents(
  events: AttendanceEvent[],
  nowIso: string,
) {
  const now = new Date(nowIso).getTime();
  const cutoff = now - 24 * 60 * 60 * 1000;

  return events.filter((event) => {
    const submittedAt = new Date(event.submittedAt).getTime();
    return submittedAt >= cutoff && submittedAt <= now;
  });
}
