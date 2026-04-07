const PUBLISHED_SCHEDULE_STORAGE_KEY = "parkwest-published-schedules";

export const PUBLISHED_SCHEDULE_UPDATED_EVENT = "parkwest-published-schedule-updated";

export type PublishedSchedulePreview = {
  propertyKey?: string;
  propertyName?: string;
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

export function loadPublishedSchedules(propertyKey?: string) {
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
      return propertyKey
        ? parsed.filter(
            (entry) => (entry.propertyKey ?? "").toLowerCase() === propertyKey.toLowerCase(),
          )
        : parsed;
    }

    const list = parsed ? [parsed] : [];
    return propertyKey
      ? list.filter(
          (entry) => (entry.propertyKey ?? "").toLowerCase() === propertyKey.toLowerCase(),
        )
      : list;
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

export function savePublishedSchedulesForProperty(
  propertyKey: string | undefined,
  previews: PublishedSchedulePreview[],
) {
  if (!propertyKey) {
    savePublishedSchedules(previews);
    return;
  }

  const existing = loadPublishedSchedules();
  const otherProperties = existing.filter(
    (entry) => (entry.propertyKey ?? "").toLowerCase() !== propertyKey.toLowerCase(),
  );

  savePublishedSchedules([...otherProperties, ...previews]);
}

export function upsertPublishedSchedule(preview: PublishedSchedulePreview) {
  const existing = loadPublishedSchedules();
  const title = getPublishedScheduleTitle(preview);
  const next = [...existing];
  const index = next.findIndex(
    (entry) =>
      getPublishedScheduleTitle(entry) === title &&
      (entry.propertyKey ?? "") === (preview.propertyKey ?? ""),
  );

  if (index >= 0) {
    next[index] = preview;
  } else {
    next.unshift(preview);
  }

  savePublishedSchedules(next);
}
