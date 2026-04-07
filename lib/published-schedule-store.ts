const PUBLISHED_SCHEDULE_STORAGE_KEY = "parkwest-published-schedules";

export const PUBLISHED_SCHEDULE_UPDATED_EVENT = "parkwest-published-schedule-updated";

export type PublishedSchedulePreview = {
  fileName: string;
  sheetNames: string[];
  sheets: {
    sheetName: string;
    displayName: string;
    dayHeaders: string[];
    dateHeaders: string[];
    scheduleRows: {
      name: string;
      shifts: string[];
    }[];
    detectedShifts: string[];
  }[];
  shiftFamilies: {
    familyLabel: string;
    displayLabel: string;
    tone: string;
  }[];
};

export function getPublishedScheduleTitle(preview: PublishedSchedulePreview) {
  return preview.sheets[0]?.displayName ?? preview.fileName;
}

export function loadPublishedSchedules() {
  if (typeof window === "undefined") {
    return [] as PublishedSchedulePreview[];
  }

  const raw = window.localStorage.getItem(PUBLISHED_SCHEDULE_STORAGE_KEY);

  if (!raw) {
    return [] as PublishedSchedulePreview[];
  }

  try {
    const parsed = JSON.parse(raw) as PublishedSchedulePreview[] | PublishedSchedulePreview;

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return parsed ? [parsed] : [];
  } catch {
    return [] as PublishedSchedulePreview[];
  }
}

export function savePublishedSchedules(previews: PublishedSchedulePreview[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PUBLISHED_SCHEDULE_STORAGE_KEY, JSON.stringify(previews));
  window.dispatchEvent(new Event(PUBLISHED_SCHEDULE_UPDATED_EVENT));
}

export function upsertPublishedSchedule(preview: PublishedSchedulePreview) {
  const existing = loadPublishedSchedules();
  const title = getPublishedScheduleTitle(preview);
  const next = [...existing];
  const index = next.findIndex((entry) => getPublishedScheduleTitle(entry) === title);

  if (index >= 0) {
    next[index] = preview;
  } else {
    next.unshift(preview);
  }

  savePublishedSchedules(next);
}
