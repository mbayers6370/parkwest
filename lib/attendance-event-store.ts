import {
  ATTENDANCE_EVENTS_STORAGE_KEY,
  type AttendanceEvent,
} from "@/lib/attendance-events";

export const ATTENDANCE_EVENTS_UPDATED_EVENT = "parkwest-attendance-events-updated";

export function loadStoredAttendanceEvents() {
  if (typeof window === "undefined") {
    return [] as AttendanceEvent[];
  }

  const raw = window.localStorage.getItem(ATTENDANCE_EVENTS_STORAGE_KEY);

  if (!raw) {
    return [] as AttendanceEvent[];
  }

  try {
    const parsed = JSON.parse(raw) as AttendanceEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredAttendanceEvents(events: AttendanceEvent[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ATTENDANCE_EVENTS_STORAGE_KEY,
    JSON.stringify(events),
  );
  window.dispatchEvent(new Event(ATTENDANCE_EVENTS_UPDATED_EVENT));
}
