"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadStoredSchedule,
  SCHEDULE_UPDATED_EVENT,
} from "@/lib/mock-schedule-store";
import type { ScheduleEntry } from "@/lib/mock-schedule";
import styles from "./schedule.module.css";
const DEPARTMENTS = ["dealer", "floor", "chip_runner"] as const;

const DAYS = [
  { key: "sat", label: "Saturday", shortDate: "Apr 4" },
  { key: "sun", label: "Sunday", shortDate: "Apr 5" },
  { key: "mon", label: "Monday", shortDate: "Apr 6" },
  { key: "tue", label: "Tuesday", shortDate: "Apr 7" },
  { key: "wed", label: "Wednesday", shortDate: "Apr 8" },
  { key: "thu", label: "Thursday", shortDate: "Apr 9" },
  { key: "fri", label: "Friday", shortDate: "Apr 10" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

type ShiftTone =
  | "pink"
  | "blue"
  | "orange"
  | "lavender"
  | "sky"
  | "green"
  | "amber"
  | "coral"
  | "red";

type ShiftValue = {
  label: string;
  tone: ShiftTone;
};

type ScheduleRow = {
  name: string;
} & Record<DayKey, ShiftValue | "OFF" | "RO">;

type ScheduleBoard = {
  id: (typeof DEPARTMENTS)[number];
  title: string;
  rows: ScheduleRow[];
};

type AvailableWeek = {
  key: string;
  label: string;
  dates: Array<{
    key: DayKey;
    label: string;
    shortDate: string;
    iso: string;
  }>;
};

const SHIFT_STYLES: Record<string, ShiftValue> = {
  "7:45a": { label: "7:45a", tone: "pink" },
  "9:45a": { label: "9:45a", tone: "blue" },
  "11:45a": { label: "11:45a", tone: "orange" },
  "1:45p": { label: "1:45p", tone: "lavender" },
  "3:45p": { label: "3:45p", tone: "sky" },
  "5:45p": { label: "5:45p", tone: "green" },
  "7:45p": { label: "7:45p", tone: "amber" },
  "9:45p": { label: "9:45p", tone: "coral" },
  "11:45p": { label: "11:45p", tone: "red" },
};

const SHIFT_TONE_CLASS: Record<ShiftTone, string> = {
  pink: styles.floorScheduleShiftChipPink,
  blue: styles.floorScheduleShiftChipBlue,
  orange: styles.floorScheduleShiftChipOrange,
  lavender: styles.floorScheduleShiftChipLavender,
  sky: styles.floorScheduleShiftChipSky,
  green: styles.floorScheduleShiftChipGreen,
  amber: styles.floorScheduleShiftChipAmber,
  coral: styles.floorScheduleShiftChipCoral,
  red: styles.floorScheduleShiftChipRed,
};

const FLOOR_SCHEDULE: ScheduleRow[] = [
  {
    name: "Brian Cole",
    sat: SHIFT_STYLES["3:45p"],
    sun: "OFF",
    mon: SHIFT_STYLES["11:45a"],
    tue: SHIFT_STYLES["11:45a"],
    wed: "OFF",
    thu: SHIFT_STYLES["11:45a"],
    fri: SHIFT_STYLES["11:45a"],
  },
  {
    name: "Angela Fox",
    sat: "OFF",
    sun: SHIFT_STYLES["5:45p"],
    mon: SHIFT_STYLES["5:45p"],
    tue: "OFF",
    wed: SHIFT_STYLES["5:45p"],
    thu: SHIFT_STYLES["5:45p"],
    fri: "OFF",
  },
  {
    name: "Rico James",
    sat: SHIFT_STYLES["1:45p"],
    sun: SHIFT_STYLES["1:45p"],
    mon: "OFF",
    tue: SHIFT_STYLES["3:45p"],
    wed: SHIFT_STYLES["3:45p"],
    thu: "OFF",
    fri: SHIFT_STYLES["3:45p"],
  },
  {
    name: "Mina Ortiz",
    sat: "OFF",
    sun: "OFF",
    mon: SHIFT_STYLES["9:45a"],
    tue: SHIFT_STYLES["9:45a"],
    wed: SHIFT_STYLES["9:45a"],
    thu: "OFF",
    fri: SHIFT_STYLES["9:45a"],
  },
];

const CHIP_RUNNER_SCHEDULE: ScheduleRow[] = [
  {
    name: "Johnny Pham",
    sat: SHIFT_STYLES["7:45a"],
    sun: "OFF",
    mon: SHIFT_STYLES["7:45a"],
    tue: SHIFT_STYLES["7:45a"],
    wed: "OFF",
    thu: SHIFT_STYLES["7:45a"],
    fri: SHIFT_STYLES["7:45a"],
  },
  {
    name: "Tola Green",
    sat: "OFF",
    sun: SHIFT_STYLES["1:45p"],
    mon: "OFF",
    tue: SHIFT_STYLES["1:45p"],
    wed: SHIFT_STYLES["1:45p"],
    thu: SHIFT_STYLES["1:45p"],
    fri: "OFF",
  },
  {
    name: "Linda S",
    sat: SHIFT_STYLES["5:45p"],
    sun: SHIFT_STYLES["5:45p"],
    mon: "OFF",
    tue: "OFF",
    wed: SHIFT_STYLES["5:45p"],
    thu: SHIFT_STYLES["5:45p"],
    fri: SHIFT_STYLES["5:45p"],
  },
  {
    name: "Eric Wu",
    sat: "OFF",
    sun: "OFF",
    mon: SHIFT_STYLES["9:45p"],
    tue: SHIFT_STYLES["9:45p"],
    wed: SHIFT_STYLES["9:45p"],
    thu: "OFF",
    fri: SHIFT_STYLES["9:45p"],
  },
];

function ScheduleCell({
  value,
  hasPassed,
}: {
  value: ScheduleRow[DayKey];
  hasPassed: boolean;
}) {
  if (value === "OFF" || value === "RO") {
    return (
      <td
        className={`${styles.floorScheduleGridCell} ${styles.floorScheduleGridCellOff} ${hasPassed ? styles.floorScheduleDayPassed : ""}`}
      >
        <span className={styles.floorScheduleOffText}>{value}</span>
      </td>
    );
  }

  return (
    <td className={`${styles.floorScheduleGridCell} ${hasPassed ? styles.floorScheduleDayPassed : ""}`}>
      <span className={`${styles.floorScheduleShiftChip} ${SHIFT_TONE_CLASS[value.tone]}`}>
        {value.label}
      </span>
    </td>
  );
}

function formatWeekLabel(startIso: string, endIso: string) {
  const start = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString("en-US", { day: "numeric" });

  return `${startLabel} - ${endLabel}`;
}

function formatShortDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function mapShiftTimeToCellValue(shiftTime: string, status: ScheduleEntry["status"]) {
  if (status === "ro") {
    return "RO" as const;
  }

  if (status !== "scheduled") {
    return "OFF" as const;
  }

  const normalizedStart = shiftTime.split("–")[0]?.trim().toLowerCase() ?? "";
  const shorthand = normalizedStart
    .replace(":45", ":45")
    .replace(" am", "a")
    .replace(" pm", "p");

  return SHIFT_STYLES[shorthand] ?? "OFF";
}

function buildAvailableWeeks(entries: ScheduleEntry[]): AvailableWeek[] {
  const uniqueDates = [...new Set(entries.map((entry) => entry.shiftDate))].sort();
  const weeks: AvailableWeek[] = [];

  for (let index = 0; index < uniqueDates.length; index += 7) {
    const weekDates = uniqueDates.slice(index, index + 7);

    if (weekDates.length < 7) {
      continue;
    }

    weeks.push({
      key: weekDates[0],
      label: formatWeekLabel(weekDates[0], weekDates[6]),
      dates: DAYS.map((day, dayIndex) => ({
        ...day,
        shortDate: formatShortDate(weekDates[dayIndex]),
        iso: weekDates[dayIndex],
      })),
    });
  }

  return weeks;
}

function buildDealerScheduleRows(entries: ScheduleEntry[], week: AvailableWeek | null): ScheduleRow[] {
  if (!week) {
    return [];
  }

  const dealerNames = [...new Set(
    entries
      .filter((entry) => entry.dept === "Dealer" || entry.dept === "Dual Rate")
      .map((entry) => entry.employeeName),
  )].sort((a, b) => a.localeCompare(b));

  return dealerNames.map((name) => {
    const row = {
      name,
      sat: "OFF" as ScheduleRow["sat"],
      sun: "OFF" as ScheduleRow["sun"],
      mon: "OFF" as ScheduleRow["mon"],
      tue: "OFF" as ScheduleRow["tue"],
      wed: "OFF" as ScheduleRow["wed"],
      thu: "OFF" as ScheduleRow["thu"],
      fri: "OFF" as ScheduleRow["fri"],
    };

    week.dates.forEach((day) => {
      const entry = entries.find(
        (scheduleEntry) =>
          scheduleEntry.employeeName === name &&
          scheduleEntry.shiftDate === day.iso,
      );

      if (entry) {
        row[day.key] = mapShiftTimeToCellValue(entry.shiftTime, entry.status);
      }
    });

    return row;
  });
}

export default function FloorSchedulePage() {
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [selectedDepartment, setSelectedDepartment] =
    useState<(typeof DEPARTMENTS)[number]>("dealer");
  const todayIso = new Date().toISOString().slice(0, 10);
  const availableWeeks = useMemo(() => buildAvailableWeeks(scheduleEntries), [scheduleEntries]);
  const [selectedWeekKey, setSelectedWeekKey] = useState<string | null>(null);

  useEffect(() => {
    const syncScheduleEntries = () => {
      setScheduleEntries(loadStoredSchedule());
    };

    syncScheduleEntries();
    window.addEventListener("storage", syncScheduleEntries);
    window.addEventListener(SCHEDULE_UPDATED_EVENT, syncScheduleEntries);

    return () => {
      window.removeEventListener("storage", syncScheduleEntries);
      window.removeEventListener(SCHEDULE_UPDATED_EVENT, syncScheduleEntries);
    };
  }, []);

  useEffect(() => {
    if (!selectedWeekKey && availableWeeks[0]) {
      setSelectedWeekKey(availableWeeks[0].key);
    }
  }, [availableWeeks, selectedWeekKey]);

  const selectedWeek =
    availableWeeks.find((week) => week.key === selectedWeekKey) ?? availableWeeks[0] ?? null;

  const dealerSchedule = useMemo(
    () => buildDealerScheduleRows(scheduleEntries, selectedWeek),
    [scheduleEntries, selectedWeek],
  );

  const scheduleBoards: ScheduleBoard[] = [
    { id: "dealer", title: "Dealers Schedule Board", rows: dealerSchedule },
    { id: "floor", title: "Floor Schedule Board", rows: FLOOR_SCHEDULE },
    { id: "chip_runner", title: "Chip Runners Schedule Board", rows: CHIP_RUNNER_SCHEDULE },
  ];

  const selectedBoard =
    scheduleBoards.find((board) => board.id === selectedDepartment) ?? scheduleBoards[0];

  return (
    <>
      <div className={styles.floorControlBar}>
        <div className={styles.floorFilterRow}>
          <span className={styles.floorFilterLabel}>Week</span>
          {availableWeeks.map((week) => (
            <button
              key={week.key}
              className={`${styles.floorPill} ${selectedWeek?.key === week.key ? styles.floorPillActive : ""}`}
              type="button"
              onClick={() => setSelectedWeekKey(week.key)}
            >
              {week.label}
            </button>
          ))}
        </div>
        <div className={styles.floorFilterRow}>
          <span className={styles.floorFilterLabel}>Dept</span>
          <button
            className={`${styles.floorPill} ${selectedDepartment === "dealer" ? styles.floorPillActive : ""}`}
            type="button"
            onClick={() => setSelectedDepartment("dealer")}
          >
            Dealers
          </button>
          <button
            className={`${styles.floorPill} ${selectedDepartment === "floor" ? styles.floorPillActive : ""}`}
            type="button"
            onClick={() => setSelectedDepartment("floor")}
          >
            Floor
          </button>
          <button
            className={`${styles.floorPill} ${selectedDepartment === "chip_runner" ? styles.floorPillActive : ""}`}
            type="button"
            onClick={() => setSelectedDepartment("chip_runner")}
          >
            Chip Runners
          </button>
        </div>
      </div>

      <main className={styles.floorContent}>
        <div className={`${styles.floorMainCol} ${styles.floorSchedulePageMain}`}>
          <div className={`${styles.floorSection} ${styles.floorScheduleSheet}`}>
            <div className={styles.floorSectionHeader}>
              <div>
                <p className={styles.floorSectionTitle}>{selectedBoard.title}</p>
              </div>
            </div>

            <div className={styles.floorScheduleSheetBody}>
              <div className={styles.floorScheduleMatrixWrap}>
                <table className={styles.floorScheduleMatrix}>
                  <thead>
                    <tr>
                      <th className={styles.floorScheduleNameHead}>Name</th>
                      {(selectedWeek?.dates ?? DAYS).map((day) => (
                        <th
                          key={day.key}
                          className={styles.floorScheduleDayHead}
                        >
                          <span className={styles.floorScheduleDayLabel}>{day.label}</span>
                          <span className={styles.floorScheduleDayDate}>{day.shortDate}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBoard.rows.map((row) => (
                      <tr key={`${selectedBoard.title}-${row.name}`}>
                        <th className={styles.floorScheduleNameCell}>{row.name}</th>
                        {(selectedWeek?.dates ?? DAYS).map((day) => (
                          <ScheduleCell
                            key={`${selectedBoard.title}-${row.name}-${day.key}`}
                            value={row[day.key]}
                            hasPassed={"iso" in day && day.iso < todayIso}
                          />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
