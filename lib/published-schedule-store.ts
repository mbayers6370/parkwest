import { type ScheduleEntry, type ScheduleStatus } from "@/lib/mock-schedule";
import { getScheduleShiftFamily } from "@/lib/schedule-color-system";

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

export function removePublishedScheduleForProperty(
  propertyKey: string | undefined,
  scheduleTitle: string,
) {
  const existing = loadPublishedSchedules();
  const next = existing.filter((entry) => {
    const matchesProperty = propertyKey
      ? (entry.propertyKey ?? "").toLowerCase() === propertyKey.toLowerCase()
      : true;

    if (!matchesProperty) {
      return true;
    }

    return getPublishedScheduleTitle(entry) !== scheduleTitle;
  });

  savePublishedSchedules(next);
}

const MONTH_INDEX_BY_LABEL: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function toIsoDate(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getWorkbookYear(fileName: string) {
  const match = fileName.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);

  if (!match) {
    return new Date().getFullYear();
  }

  const rawYear = Number(match[3]);

  if (rawYear < 100) {
    return 2000 + rawYear;
  }

  return rawYear;
}

function getScheduleStatus(value: string): ScheduleStatus {
  const normalized = value.trim().toLowerCase();

  if (normalized === "off") {
    return "off";
  }

  if (normalized === "ro") {
    return "ro";
  }

  if (normalized === "pto") {
    return "pto";
  }

  return "scheduled";
}

function formatShiftTokenToRange(value: string) {
  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase().replace(/\s+/g, "");

  const family = getScheduleShiftFamily(normalized);

  if (family) {
    switch (family.familyLabel) {
      case "8 AM":
        return "7:45 AM – 4:00 PM";
      case "10 AM":
        return "9:45 AM – 6:00 PM";
      case "12 PM":
        return "11:45 AM – 8:00 PM";
      case "2 PM":
        return "1:45 PM – 10:00 PM";
      case "4 PM":
        return "3:45 PM – 12:00 AM";
      case "6 PM":
        return "5:45 PM – 2:00 AM";
      case "8 PM":
        return "7:45 PM – 4:00 AM";
      case "10 PM":
        return "9:45 PM – 6:00 AM";
      case "12 AM":
        return "11:45 PM – 8:00 AM";
      case "2 AM":
        return "1:45 AM – 10:00 AM";
      default:
        break;
    }
  }

  if (!normalized) {
    return "OFF";
  }

  if (normalized === "off" || normalized === "ro" || normalized === "pto") {
    return normalized.toUpperCase();
  }

  const match = normalized.match(/^(\d{1,2}):(\d{2})([ap])m?$/);

  if (!match) {
    return trimmed;
  }

  const rawHour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3] === "p" ? "PM" : "AM";
  let hour24 = rawHour % 12;

  if (meridiem === "PM") {
    hour24 += 12;
  }

  const start = new Date(2026, 0, 1, hour24, minute, 0, 0);
  const end = new Date(start.getTime() + (8 * 60 + 15) * 60 * 1000);
  const endHour = end.getHours() % 12 || 12;
  const endMeridiem = end.getHours() >= 12 ? "PM" : "AM";

  return `${rawHour}:${String(minute).padStart(2, "0")} ${meridiem} – ${endHour}:00 ${endMeridiem}`;
}

function formatOriginalShiftLabel(value: string) {
  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase().replace(/\s+/g, "");
  const match = normalized.match(/^(\d{1,2}):(\d{2})([ap])m?$/);

  if (!match) {
    return trimmed;
  }

  const meridiem = match[3] === "p" ? "p" : "a";
  return `${Number(match[1])}:${match[2]}${meridiem}`;
}

function buildEntriesFromPreview(preview: PublishedSchedulePreview): ScheduleEntry[] {
  const year = getWorkbookYear(preview.fileName);
  const entries: ScheduleEntry[] = [];

  preview.sheets.forEach((sheet, sheetIndex) => {
    sheet.scheduleRows.forEach((row, rowIndex) => {
      row.shifts.forEach((shift, dayIndex) => {
        const dateHeader = sheet.dateHeaders[dayIndex] ?? "";
        const dayHeader = sheet.dayHeaders[dayIndex] ?? "";
        const headerMatch = dateHeader.trim().match(/^(\d{1,2})-([a-z]{3})$/i);

        if (!headerMatch) {
          return;
        }

        const day = Number(headerMatch[1]);
        const monthIndex = MONTH_INDEX_BY_LABEL[headerMatch[2].toLowerCase()];

        if (monthIndex == null) {
          return;
        }

        const shiftDate = toIsoDate(year, monthIndex, day);
        const dayLabel = dayHeader
          ? `${dayHeader.trim()}, ${headerMatch[2]} ${day}`
          : `${headerMatch[2]} ${day}`;

        entries.push({
          id: `${preview.propertyKey ?? "default"}-${sheetIndex}-${rowIndex}-${dayIndex}-${row.name.toLowerCase().replace(/\s+/g, "-")}`,
          employeeName: row.name,
          shiftDate,
          dayShort: dayHeader.slice(0, 3),
          dayLabel,
          shiftTime: formatShiftTokenToRange(shift),
          originalShiftLabel: formatOriginalShiftLabel(shift),
          dept: getScheduleStatus(shift) === "scheduled" ? "Dealer" : "",
          status: getScheduleStatus(shift),
          sourceOrder: sheetIndex * 1000 + rowIndex,
        });
      });
    });
  });

  return entries;
}

export function loadPublishedScheduleEntries(propertyKey?: string) {
  return loadPublishedSchedules(propertyKey).flatMap(buildEntriesFromPreview);
}

export function loadLatestPublishedScheduleEntries(propertyKey?: string) {
  const latest = loadPublishedSchedules(propertyKey)[0];

  if (!latest) {
    return [] as ScheduleEntry[];
  }

  return buildEntriesFromPreview(latest);
}

export function loadCurrentAndFuturePublishedScheduleEntries(
  propertyKey?: string,
  baseDate = new Date(),
) {
  const date = new Date(baseDate);
  date.setHours(12, 0, 0, 0);

  const daysFromSaturday = (date.getDay() + 1) % 7;
  const currentWeekStart = new Date(date);
  currentWeekStart.setDate(date.getDate() - daysFromSaturday);
  const currentWeekStartIso = toIsoDate(
    currentWeekStart.getFullYear(),
    currentWeekStart.getMonth(),
    currentWeekStart.getDate(),
  );

  return loadPublishedScheduleEntries(propertyKey).filter(
    (entry) => entry.shiftDate >= currentWeekStartIso,
  );
}
