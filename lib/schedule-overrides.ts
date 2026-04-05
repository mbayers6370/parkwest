import {
  getScheduleEntryForEmployeeAndDate,
  type ScheduleEntry,
} from "@/lib/mock-schedule";

export type ScheduleOverrideKind = "start_time_change" | "dealer_added";

export type ScheduleOverride = {
  id: string;
  kind: ScheduleOverrideKind;
  employeeName: string;
  shiftDate: string;
  previousShiftTime: string;
  nextShiftTime: string;
  note?: string;
  createdAt: string;
  createdBy: string;
  flaggedSixDay: boolean;
};

export const SCHEDULE_OVERRIDE_KIND_LABELS: Record<ScheduleOverrideKind, string> = {
  start_time_change: "Change Start Time",
  dealer_added: "Add Dealer",
};

export const SHIFT_START_OPTIONS = [
  "8 AM",
  "10 AM",
  "12 PM",
  "2 PM",
  "4 PM",
  "6 PM",
  "8 PM",
  "10 PM",
  "12 AM",
] as const;

export function buildShiftTimeRange(startLabel: string) {
  const startDate = parseLabelToDate(startLabel);
  const endDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000);

  return `${formatHourLabel(startDate)} – ${formatHourLabel(endDate)}`;
}

export function getShiftStartLabel(shiftTime: string) {
  return shiftTime.split("–")[0]?.trim() ?? shiftTime;
}

export function applyScheduleOverrides(
  entries: ScheduleEntry[],
  overrides: ScheduleOverride[],
) {
  const sortedOverrides = [...overrides].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  return sortedOverrides.reduce((currentEntries, override) => {
    const currentEntry = getScheduleEntryForEmployeeAndDate(
      currentEntries,
      override.employeeName,
      override.shiftDate,
    );

    if (!currentEntry) {
      return currentEntries;
    }

    return currentEntries.map((entry) =>
      entry.id !== currentEntry.id
        ? entry
        : {
            ...entry,
            shiftTime: override.nextShiftTime,
            dept: "Dealer",
            status: "scheduled",
          },
    );
  }, entries);
}

export function getScheduledDaysForWeek(
  entries: ScheduleEntry[],
  employeeName: string,
  shiftDate: string,
) {
  const monthKey = shiftDate.slice(0, 7);

  return entries.filter(
    (entry) =>
      entry.employeeName === employeeName &&
      entry.status === "scheduled" &&
      entry.shiftDate.slice(0, 7) === monthKey,
  ).length;
}

function parseLabelToDate(label: string) {
  const [rawHour, meridiem] = label.split(" ");
  let hour = Number(rawHour) % 12;

  if (meridiem === "PM") {
    hour += 12;
  }

  return new Date(2026, 0, hour === 0 ? 2 : 1, hour, 0, 0, 0);
}

function formatHourLabel(date: Date) {
  const hour = date.getHours();
  const normalizedHour = hour % 12 || 12;
  const meridiem = hour >= 12 ? "PM" : "AM";

  return `${normalizedHour}:00 ${meridiem}`;
}
