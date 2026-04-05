export type ScheduleStatus = "scheduled" | "off";

export type ScheduleEntry = {
  id: string;
  employeeName: string;
  shiftDate: string;
  dayShort: string;
  dayLabel: string;
  shiftTime: string;
  dept: string;
  status: ScheduleStatus;
};

export const SCHEDULE_STORAGE_KEY = "parkwest-mock-schedule";

export const DEFAULT_SCHEDULE: ScheduleEntry[] = [
  { id: "matt-0412", employeeName: "Matthew Bayers", shiftDate: "2026-04-12", dayShort: "Sat", dayLabel: "Saturday, April 12", shiftTime: "10:00 AM – 6:00 PM", dept: "Dealer", status: "scheduled" },
  { id: "matt-0413", employeeName: "Matthew Bayers", shiftDate: "2026-04-13", dayShort: "Sun", dayLabel: "Sunday, April 13", shiftTime: "OFF", dept: "", status: "off" },
  { id: "matt-0414", employeeName: "Matthew Bayers", shiftDate: "2026-04-14", dayShort: "Mon", dayLabel: "Monday, April 14", shiftTime: "2:00 PM – 10:00 PM", dept: "Dealer", status: "scheduled" },
  { id: "matt-0415", employeeName: "Matthew Bayers", shiftDate: "2026-04-15", dayShort: "Tue", dayLabel: "Tuesday, April 15", shiftTime: "2:00 PM – 10:00 PM", dept: "Dealer", status: "scheduled" },
  { id: "matt-0416", employeeName: "Matthew Bayers", shiftDate: "2026-04-16", dayShort: "Wed", dayLabel: "Wednesday, April 16", shiftTime: "OFF", dept: "", status: "off" },
  { id: "matt-0417", employeeName: "Matthew Bayers", shiftDate: "2026-04-17", dayShort: "Thu", dayLabel: "Thursday, April 17", shiftTime: "OFF", dept: "", status: "off" },
  { id: "matt-0418", employeeName: "Matthew Bayers", shiftDate: "2026-04-18", dayShort: "Fri", dayLabel: "Friday, April 18", shiftTime: "10:00 AM – 6:00 PM", dept: "Dealer", status: "scheduled" },

  { id: "janelle-0412", employeeName: "Janelle Rivera", shiftDate: "2026-04-12", dayShort: "Sat", dayLabel: "Saturday, April 12", shiftTime: "10:00 AM – 6:00 PM", dept: "Dealer", status: "scheduled" },
  { id: "janelle-0413", employeeName: "Janelle Rivera", shiftDate: "2026-04-13", dayShort: "Sun", dayLabel: "Sunday, April 13", shiftTime: "10:00 AM – 6:00 PM", dept: "Dealer", status: "scheduled" },
  { id: "janelle-0414", employeeName: "Janelle Rivera", shiftDate: "2026-04-14", dayShort: "Mon", dayLabel: "Monday, April 14", shiftTime: "2:00 PM – 10:00 PM", dept: "Dealer", status: "scheduled" },
  { id: "janelle-0415", employeeName: "Janelle Rivera", shiftDate: "2026-04-15", dayShort: "Tue", dayLabel: "Tuesday, April 15", shiftTime: "10:00 AM – 6:00 PM", dept: "Dealer", status: "scheduled" },
  { id: "janelle-0416", employeeName: "Janelle Rivera", shiftDate: "2026-04-16", dayShort: "Wed", dayLabel: "Wednesday, April 16", shiftTime: "OFF", dept: "", status: "off" },
  { id: "janelle-0417", employeeName: "Janelle Rivera", shiftDate: "2026-04-17", dayShort: "Thu", dayLabel: "Thursday, April 17", shiftTime: "2:00 PM – 10:00 PM", dept: "Dealer", status: "scheduled" },
  { id: "janelle-0418", employeeName: "Janelle Rivera", shiftDate: "2026-04-18", dayShort: "Fri", dayLabel: "Friday, April 18", shiftTime: "2:00 PM – 10:00 PM", dept: "Dealer", status: "scheduled" },

  { id: "marcus-0412", employeeName: "Marcus Tran", shiftDate: "2026-04-12", dayShort: "Sat", dayLabel: "Saturday, April 12", shiftTime: "2:00 PM – 10:00 PM", dept: "Dealer", status: "scheduled" },
  { id: "marcus-0413", employeeName: "Marcus Tran", shiftDate: "2026-04-13", dayShort: "Sun", dayLabel: "Sunday, April 13", shiftTime: "OFF", dept: "", status: "off" },
  { id: "marcus-0414", employeeName: "Marcus Tran", shiftDate: "2026-04-14", dayShort: "Mon", dayLabel: "Monday, April 14", shiftTime: "10:00 AM – 6:00 PM", dept: "Dealer", status: "scheduled" },
  { id: "marcus-0415", employeeName: "Marcus Tran", shiftDate: "2026-04-15", dayShort: "Tue", dayLabel: "Tuesday, April 15", shiftTime: "OFF", dept: "", status: "off" },
  { id: "marcus-0416", employeeName: "Marcus Tran", shiftDate: "2026-04-16", dayShort: "Wed", dayLabel: "Wednesday, April 16", shiftTime: "2:00 PM – 10:00 PM", dept: "Dealer", status: "scheduled" },
  { id: "marcus-0417", employeeName: "Marcus Tran", shiftDate: "2026-04-17", dayShort: "Thu", dayLabel: "Thursday, April 17", shiftTime: "OFF", dept: "", status: "off" },
  { id: "marcus-0418", employeeName: "Marcus Tran", shiftDate: "2026-04-18", dayShort: "Fri", dayLabel: "Friday, April 18", shiftTime: "2:00 PM – 10:00 PM", dept: "Dealer", status: "scheduled" },

  { id: "susan-0412", employeeName: "Susan Tran", shiftDate: "2026-04-12", dayShort: "Sat", dayLabel: "Saturday, April 12", shiftTime: "OFF", dept: "", status: "off" },
  { id: "susan-0413", employeeName: "Susan Tran", shiftDate: "2026-04-13", dayShort: "Sun", dayLabel: "Sunday, April 13", shiftTime: "2:00 PM – 10:00 PM", dept: "Dealer", status: "scheduled" },
  { id: "susan-0414", employeeName: "Susan Tran", shiftDate: "2026-04-14", dayShort: "Mon", dayLabel: "Monday, April 14", shiftTime: "OFF", dept: "", status: "off" },
  { id: "susan-0415", employeeName: "Susan Tran", shiftDate: "2026-04-15", dayShort: "Tue", dayLabel: "Tuesday, April 15", shiftTime: "OFF", dept: "", status: "off" },
  { id: "susan-0416", employeeName: "Susan Tran", shiftDate: "2026-04-16", dayShort: "Wed", dayLabel: "Wednesday, April 16", shiftTime: "10:00 AM – 6:00 PM", dept: "Dealer", status: "scheduled" },
  { id: "susan-0417", employeeName: "Susan Tran", shiftDate: "2026-04-17", dayShort: "Thu", dayLabel: "Thursday, April 17", shiftTime: "OFF", dept: "", status: "off" },
  { id: "susan-0418", employeeName: "Susan Tran", shiftDate: "2026-04-18", dayShort: "Fri", dayLabel: "Friday, April 18", shiftTime: "OFF", dept: "", status: "off" },
];

export function getScheduleEntriesForEmployee(
  entries: ScheduleEntry[],
  employeeName: string,
) {
  return entries.filter((entry) => entry.employeeName === employeeName);
}

export function getScheduleEntryForEmployeeAndDate(
  entries: ScheduleEntry[],
  employeeName: string,
  shiftDate: string,
) {
  return entries.find(
    (entry) => entry.employeeName === employeeName && entry.shiftDate === shiftDate,
  );
}

export function getScheduleEntriesForDate(entries: ScheduleEntry[], shiftDate: string) {
  return entries.filter((entry) => entry.shiftDate === shiftDate);
}

export function getAllEmployeeNames(entries: ScheduleEntry[]) {
  return [...new Set(entries.map((entry) => entry.employeeName))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function parseShiftRange(
  shiftDate: string,
  shiftTime: string,
) {
  if (shiftTime === "OFF") {
    return null;
  }

  const [startLabel, endLabel] = shiftTime.split("–").map((part) => part.trim());

  const start = parseDateTime(shiftDate, startLabel);
  let end = parseDateTime(shiftDate, endLabel);

  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  return { start, end };
}

function parseDateTime(shiftDate: string, timeLabel: string) {
  const [time, meridiem] = timeLabel.split(" ");
  const [rawHour, rawMinute] = time.split(":").map(Number);
  let hour = rawHour % 12;

  if (meridiem === "PM") {
    hour += 12;
  }

  const [year, month, day] = shiftDate.split("-").map(Number);
  return new Date(year, month - 1, day, hour, rawMinute ?? 0, 0, 0);
}

export function getMostRecentWorkedShiftEnd(
  entries: ScheduleEntry[],
  employeeName: string,
  beforeDateTime: Date,
) {
  const workedEntries = entries
    .filter(
      (entry) =>
        entry.employeeName === employeeName && entry.status === "scheduled" && entry.shiftTime !== "OFF",
    )
    .map((entry) => parseShiftRange(entry.shiftDate, entry.shiftTime))
    .filter((range): range is NonNullable<typeof range> => Boolean(range))
    .filter((range) => range.end.getTime() <= beforeDateTime.getTime())
    .sort((a, b) => b.end.getTime() - a.end.getTime());

  return workedEntries[0]?.end ?? null;
}
