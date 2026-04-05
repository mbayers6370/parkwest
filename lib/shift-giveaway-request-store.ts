import {
  type ShiftGiveawayRequest,
} from "@/lib/shift-giveaway-requests";

export const SHIFT_GIVEAWAY_REQUESTS_STORAGE_KEY =
  "parkwest-shift-giveaway-requests";
export const SHIFT_GIVEAWAY_REQUESTS_UPDATED_EVENT =
  "parkwest-shift-giveaway-requests-updated";

export function loadStoredShiftGiveawayRequests() {
  if (typeof window === "undefined") {
    return [] as ShiftGiveawayRequest[];
  }

  const raw = window.localStorage.getItem(SHIFT_GIVEAWAY_REQUESTS_STORAGE_KEY);

  if (!raw) {
    return [] as ShiftGiveawayRequest[];
  }

  try {
    const parsed = JSON.parse(raw) as ShiftGiveawayRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredShiftGiveawayRequests(
  requests: ShiftGiveawayRequest[],
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SHIFT_GIVEAWAY_REQUESTS_STORAGE_KEY,
    JSON.stringify(requests),
  );
  window.dispatchEvent(new Event(SHIFT_GIVEAWAY_REQUESTS_UPDATED_EVENT));
}
