import { type ScheduleOverride } from "@/lib/schedule-overrides";

export const SCHEDULE_OVERRIDES_STORAGE_KEY = "parkwest-schedule-overrides";
export const SCHEDULE_OVERRIDES_UPDATED_EVENT = "parkwest-schedule-overrides-updated";

export function loadStoredScheduleOverrides() {
  if (typeof window === "undefined") {
    return [] as ScheduleOverride[];
  }

  const raw = window.localStorage.getItem(SCHEDULE_OVERRIDES_STORAGE_KEY);

  if (!raw) {
    return [] as ScheduleOverride[];
  }

  try {
    const parsed = JSON.parse(raw) as ScheduleOverride[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as ScheduleOverride[];
  }
}

export function saveStoredScheduleOverrides(overrides: ScheduleOverride[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SCHEDULE_OVERRIDES_STORAGE_KEY,
    JSON.stringify(overrides),
  );
  window.dispatchEvent(new Event(SCHEDULE_OVERRIDES_UPDATED_EVENT));
}
