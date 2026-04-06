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
  "7:45 AM",
  "9:45 AM",
  "11:45 AM",
  "1:45 PM",
  "3:45 PM",
  "5:45 PM",
  "7:45 PM",
  "9:45 PM",
  "11:45 PM",
] as const;

export function buildShiftTimeRange(startLabel: string) {
  const actualStartDate = parseLabelToDate(startLabel);
  const endDate = new Date(actualStartDate.getTime() + (8 * 60 + 15) * 60 * 1000);

  return `${formatMinuteLabel(actualStartDate)} – ${formatHourLabel(endDate)}`;
}

export function formatShiftStartOptionLabel(startLabel: string) {
  return formatMinuteLabel(parseLabelToDate(startLabel));
}

export function getShiftStartLabel(shiftTime: string) {
  const startLabel = shiftTime.split("–")[0]?.trim() ?? shiftTime;
  return formatMinuteLabel(parseLabelToDate(startLabel));
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
  // Find the Saturday-to-Friday week containing shiftDate
  const d = new Date(shiftDate + "T12:00:00");
  const daysFromSat = (d.getDay() + 1) % 7;
  const sat = new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysFromSat);
  const fri = new Date(sat.getFullYear(), sat.getMonth(), sat.getDate() + 6);

  function toISO(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  const weekStart = toISO(sat);
  const weekEnd = toISO(fri);

  return entries.filter(
    (entry) =>
      entry.employeeName === employeeName &&
      entry.status === "scheduled" &&
      entry.shiftDate >= weekStart &&
      entry.shiftDate <= weekEnd,
  ).length;
}

function parseLabelToDate(label: string) {
  const [timePart, meridiem] = label.split(" ");
  const [rawHour, rawMinute] = timePart.split(":").map(Number);
  let hour = Number(rawHour) % 12;

  if (meridiem === "PM") {
    hour += 12;
  }

  const minute = Number.isFinite(rawMinute) ? rawMinute : 0;
  return new Date(2026, 0, hour === 0 ? 2 : 1, hour, minute, 0, 0);
}

function formatHourLabel(date: Date) {
  const hour = date.getHours();
  const normalizedHour = hour % 12 || 12;
  const meridiem = hour >= 12 ? "PM" : "AM";

  return `${normalizedHour}:00 ${meridiem}`;
}

function formatMinuteLabel(date: Date) {
  const hour = date.getHours();
  const normalizedHour = hour % 12 || 12;
  const meridiem = hour >= 12 ? "PM" : "AM";

  return `${normalizedHour}:45 ${meridiem}`;
}
