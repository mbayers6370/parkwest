import {
  TIME_OFF_REQUESTS_STORAGE_KEY,
  type TimeOffRequest,
} from "@/lib/time-off-requests";

export const TIME_OFF_REQUESTS_UPDATED_EVENT = "parkwest-time-off-requests-updated";

export function loadStoredTimeOffRequests() {
  if (typeof window === "undefined") {
    return [] as TimeOffRequest[];
  }

  const raw = window.localStorage.getItem(TIME_OFF_REQUESTS_STORAGE_KEY);

  if (!raw) {
    return [] as TimeOffRequest[];
  }

  try {
    const parsed = JSON.parse(raw) as TimeOffRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredTimeOffRequests(requests: TimeOffRequest[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    TIME_OFF_REQUESTS_STORAGE_KEY,
    JSON.stringify(requests),
  );
  window.dispatchEvent(new Event(TIME_OFF_REQUESTS_UPDATED_EVENT));
}
