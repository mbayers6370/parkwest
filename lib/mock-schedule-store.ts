import {
  DEFAULT_SCHEDULE,
  SCHEDULE_STORAGE_KEY,
  type ScheduleEntry,
} from "@/lib/mock-schedule";

export const SCHEDULE_UPDATED_EVENT = "parkwest-mock-schedule-updated";

export function loadStoredSchedule() {
  if (typeof window === "undefined") {
    return DEFAULT_SCHEDULE as ScheduleEntry[];
  }

  const raw = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);

  if (!raw) {
    return DEFAULT_SCHEDULE as ScheduleEntry[];
  }

  try {
    const parsed = JSON.parse(raw) as ScheduleEntry[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SCHEDULE;
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

export function saveStoredSchedule(entries: ScheduleEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(SCHEDULE_UPDATED_EVENT));
}
