export type ScheduleStatus = "scheduled" | "off" | "ro" | "pto";

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

// ---------------------------------------------------------------------------
// Week definitions
// ---------------------------------------------------------------------------

const WEEK1_DAYS = [
  { iso: "2026-03-28", dayShort: "Sat", dayLabel: "Saturday, March 28" },
  { iso: "2026-03-29", dayShort: "Sun", dayLabel: "Sunday, March 29" },
  { iso: "2026-03-30", dayShort: "Mon", dayLabel: "Monday, March 30" },
  { iso: "2026-03-31", dayShort: "Tue", dayLabel: "Tuesday, March 31" },
  { iso: "2026-04-01", dayShort: "Wed", dayLabel: "Wednesday, April 1" },
  { iso: "2026-04-02", dayShort: "Thu", dayLabel: "Thursday, April 2" },
  { iso: "2026-04-03", dayShort: "Fri", dayLabel: "Friday, April 3" },
];

const WEEK2_DAYS = [
  { iso: "2026-04-04", dayShort: "Sat", dayLabel: "Saturday, April 4" },
  { iso: "2026-04-05", dayShort: "Sun", dayLabel: "Sunday, April 5" },
  { iso: "2026-04-06", dayShort: "Mon", dayLabel: "Monday, April 6" },
  { iso: "2026-04-07", dayShort: "Tue", dayLabel: "Tuesday, April 7" },
  { iso: "2026-04-08", dayShort: "Wed", dayLabel: "Wednesday, April 8" },
  { iso: "2026-04-09", dayShort: "Thu", dayLabel: "Thursday, April 9" },
  { iso: "2026-04-10", dayShort: "Fri", dayLabel: "Friday, April 10" },
];

// ---------------------------------------------------------------------------
// Shift time ranges (:45 starts with top-of-hour end times)
// Sunday 7:45p ends at 2:00 AM due to casino closure — use "7p_sun"
// ---------------------------------------------------------------------------

const SHIFT_TIMES: Record<string, string> = {
  "7a":     "7:45 AM – 4:00 PM",
  "9a":     "9:45 AM – 6:00 PM",
  "11a":    "11:45 AM – 8:00 PM",
  "1p":     "1:45 PM – 10:00 PM",
  "3p":     "3:45 PM – 12:00 AM",
  "5p":     "5:45 PM – 2:00 AM",
  "7p":     "7:45 PM – 4:00 AM",
  "9p":     "9:45 PM – 6:00 AM",
  "11p":    "11:45 PM – 8:00 AM",
  "7p_sun": "7:45 PM – 2:00 AM",
  "off":    "OFF",
  "ro":     "RO",
  "pto":    "PTO",
};

function shiftStatus(key: string): ScheduleStatus {
  if (key === "ro")  return "ro";
  if (key === "pto") return "pto";
  if (key === "off") return "off";
  return "scheduled";
}

function buildWeekEntries(
  name: string,
  prefix: string,
  dept: string,
  days: typeof WEEK1_DAYS,
  shifts: string[],
): ScheduleEntry[] {
  return days.map((day, i) => {
    const raw = shifts[i];
    // Sunday (i === 1): 7p becomes 7p_sun — casino closes at 2 AM
    const key = i === 1 && raw === "7p" ? "7p_sun" : raw;
    const status = shiftStatus(raw);
    return {
      id: `${prefix}-${day.iso.replace(/-/g, "").slice(4)}`,
      employeeName: name,
      shiftDate: day.iso,
      dayShort: day.dayShort,
      dayLabel: day.dayLabel,
      shiftTime: SHIFT_TIMES[key] ?? "OFF",
      dept: status === "scheduled" ? dept : "",
      status,
    };
  });
}

function row(
  name: string,
  prefix: string,
  dept: string,
  w1: string[],
  w2: string[],
): ScheduleEntry[] {
  return [
    ...buildWeekEntries(name, prefix, dept, WEEK1_DAYS, w1),
    ...buildWeekEntries(name, prefix, dept, WEEK2_DAYS, w2),
  ];
}

const D = "Dealer";
const DR = "Dual Rate";

// ---------------------------------------------------------------------------
// Schedule data — transcribed from printed Excel schedule
// Columns: [Sat, Sun, Mon, Tue, Wed, Thu, Fri]
// ---------------------------------------------------------------------------

export const DEFAULT_SCHEDULE: ScheduleEntry[] = [
  // eslint-disable-next-line prettier/prettier
  ...row("Hong",      "hong",    D,  ["off","ro", "7p", "7p", "7p", "off","off"], ["off","7p", "7p", "7p", "7p", "off","off"]),
  ...row("Susan",     "susan",   D,  ["off","off","7p", "7p", "7p", "7p", "7p"],  ["off","off","7p", "7p", "7p", "7p", "7p" ]),
  ...row("Sinnoun",   "sinnoun", D,  ["off","off","9p", "9p", "9p", "off","off"], ["off","off","9p", "9p", "9p", "9p", "off"]),
  ...row("Derek",     "derek",   D,  ["off","off","off","9p", "9p", "9p", "9p"],  ["off","off","off","9p", "9p", "9p", "9p" ]),
  ...row("Bobby",     "bobby",   D,  ["off","off","off","off","off","off","off"],  ["off","off","off","off","off","9p", "off"]),
  ...row("Dee",       "dee",     D,  ["9p", "7p", "9p", "off","off","off","off"], ["9p", "7p", "9p", "off","off","off","off"]),
  ...row("Lee",       "lee",     D,  ["off","off","9p", "9p", "9p", "9p", "9p"],  ["off","off","off","off","off","off","off"]),
  ...row("Kevin D",   "kevind",  D,  ["5p", "off","9p", "off","9p", "9p", "9p"],  ["5p", "off","9p", "9p", "9p", "5p", "9p" ]),
  ...row("Johnny P",  "johnnp",  D,  ["off","off","off","off","9p", "9p", "off"],  ["off","off","off","off","11p","5p", "9p" ]),
  ...row("Ngoc",      "ngoc",    DR, ["off","off","3p", "3p", "off","off","3p"],   ["3p", "3p", "off","3p", "11p","5p", "off"]),
  ...row("Duy",       "duy",     D,  ["9p", "off","off","11p","11p","off","3p"],   ["7p", "off","9p", "off","off","off","3p" ]),
  ...row("Quynh",     "quynh",   D,  ["9p", "5p", "off","11p","11p","11p","9p"],   ["9p", "off","off","9p", "11p","9p", "11p"]),
  ...row("Matt",      "matt",    D,  ["5p", "off","3p", "off","11p","11p","11p"],  ["3p", "3p", "5p", "off","off","11a","3p" ]),
  ...row("Jia",       "jia",     D,  ["9p", "off","9p", "off","off","off","5p"],   ["9p", "off","5p", "off","off","11a","3p" ]),
  ...row("Thomas",    "thomas",  D,  ["3p", "3p", "9p", "3p", "11p","off","off"],  ["off","3p", "ro", "ro", "off","off","11p"]),
  ...row("Thy Thy",   "thythy",  D,  ["pto","off","off","pto","11p","11p","off"],   ["11p","off","off","11p","11p","11p","off"]),
  ...row("Ryan",      "ryan",    D,  ["11p","7p", "11p","off","11p","11p","11p"],  ["11p","7p", "11p","off","off","off","11p"]),
  ...row("Tim P",     "timp",    DR, ["5p", "off","off","off","11p","11p","11p"],   ["9p", "off","off","11p","11p","11p","11p"]),
  ...row("Tola",      "tola",    D,  ["7p", "off","off","11p","11p","11p","11p"],  ["7p", "off","off","11p","11p","11p","11p"]),
  ...row("Linda S",   "lindas",  D,  ["off","off","off","off","off","off","off"],  ["off","off","off","off","off","off","off"]),
  ...row("MhieMhie",  "mhie",    D,  ["9p", "off","11p","11p","off","9p", "11p"],  ["11p","off","9p", "11p","off","off","11p"]),
  ...row("Thong",     "thong",   D,  ["3p", "3p", "11p","11p","off","11p","11p"],  ["3p", "3p", "5p", "off","11p","11p","off"]),
  ...row("Kim",       "kim",     D,  ["7p", "5p", "11p","off","off","11p","off"],  ["11p","7p", "11p","5p", "off","11p","11p"]),
  ...row("Fanny",     "fanny",   D,  ["ro", "off","off","off","11p","11p","11p"],  ["3p", "3p", "off","off","ro", "ro", "11p"]),
  ...row("Chhaya",    "chhaya",  D,  ["11p","5p", "off","off","11p","11p","11p"],  ["11p","5p", "off","off","11p","off","off"]),
  ...row("Victor",    "victor",  D,  ["off","off","11p","11p","11p","off","off"],  ["5p", "3p", "11p","11p","11p","off","off"]),
  ...row("Jessica T", "jesst",   D,  ["11p","7p", "11p","11p","11p","off","off"],  ["11p","5p", "11p","11p","11p","off","off"]),
  ...row("Ada",       "ada",     D,  ["11p","7p", "11p","11p","11p","off","off"],  ["11p","7p", "11p","11p","off","off","off"]),
  ...row("Jesse",     "jesse",   D,  ["11p","7p", "11p","11p","off","off","5p"],   ["ro", "7p", "11p","11p","off","11p","11p"]),
  ...row("Pha",       "pha",     D,  ["11p","off","off","11p","off","11p","11p"],  ["11p","off","off","11p","off","11p","7a" ]),
  ...row("Houa",      "houa",    D,  ["11p","off","off","11p","off","11p","11p"],  ["ro", "off","11p","off","9p", "11p","off"]),
  ...row("Nelson",    "nelson",  D,  ["11p","7p", "11p","pto","off","11p","11p"],  ["11p","7p", "11p","off","off","11p","off"]),
  ...row("Erica",     "erica",   D,  ["11p","5p", "11p","off","off","off","off"],  ["11p","off","7p", "off","off","off","11p"]),
  ...row("Keven",     "keven",   D,  ["11p","7p", "11p","off","off","off","11p"],  ["11p","7p", "11p","off","off","off","off"]),
  ...row("Linda V",   "lindav",  D,  ["11p","7p", "11p","off","off","7p", "off"],  ["11p","7p", "11p","11p","off","off","off"]),
  ...row("Johnny S",  "johnns",  D,  ["11p","7p", "11p","11p","9p", "off","7p"],   ["11p","7p", "11p","11p","off","off","off"]),
  ...row("Franky",    "franky",  D,  ["11p","7p", "11p","11p","off","off","11p"],  ["11p","7p", "11p","11p","off","off","off"]),
];

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

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

export function getCurrentWeekRange(baseDate: Date) {
  const date = new Date(baseDate);
  date.setHours(12, 0, 0, 0);

  const daysFromSaturday = (date.getDay() + 1) % 7;
  const weekStartDate = new Date(date);
  weekStartDate.setDate(date.getDate() - daysFromSaturday);

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  return {
    weekStartIso: toIsoDate(weekStartDate),
    weekEndIso: toIsoDate(weekEndDate),
  };
}

export function parseShiftRange(shiftDate: string, shiftTime: string) {
  if (shiftTime === "OFF" || shiftTime === "RO" || shiftTime === "PTO") {
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

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getMostRecentWorkedShiftEnd(
  entries: ScheduleEntry[],
  employeeName: string,
  beforeDateTime: Date,
) {
  const workedEntries = entries
    .filter(
      (entry) =>
        entry.employeeName === employeeName &&
        entry.status === "scheduled" &&
        entry.shiftTime !== "OFF",
    )
    .map((entry) => parseShiftRange(entry.shiftDate, entry.shiftTime))
    .filter((range): range is NonNullable<typeof range> => Boolean(range))
    .filter((range) => range.end.getTime() <= beforeDateTime.getTime())
    .sort((a, b) => b.end.getTime() - a.end.getTime());

  return workedEntries[0]?.end ?? null;
}
