"use client";

import { useState } from "react";
import styles from "./schedule.module.css";

const AVAILABLE_WEEKS = ["Apr 4 - 10", "Apr 11 - 17", "Apr 18 - 24"];
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

const DEALER_SCHEDULE: ScheduleRow[] = [
  {
    name: "Susan Tran",
    sat: "OFF",
    sun: SHIFT_STYLES["7:45p"],
    mon: SHIFT_STYLES["7:45p"],
    tue: SHIFT_STYLES["7:45p"],
    wed: SHIFT_STYLES["7:45p"],
    thu: SHIFT_STYLES["7:45p"],
    fri: SHIFT_STYLES["7:45p"],
  },
  {
    name: "Marcus Webb",
    sat: "OFF",
    sun: "OFF",
    mon: SHIFT_STYLES["1:45p"],
    tue: SHIFT_STYLES["1:45p"],
    wed: SHIFT_STYLES["1:45p"],
    thu: "OFF",
    fri: SHIFT_STYLES["3:45p"],
  },
  {
    name: "Priya Nair",
    sat: SHIFT_STYLES["9:45a"],
    sun: SHIFT_STYLES["3:45p"],
    mon: SHIFT_STYLES["3:45p"],
    tue: "OFF",
    wed: SHIFT_STYLES["11:45a"],
    thu: SHIFT_STYLES["11:45a"],
    fri: SHIFT_STYLES["3:45p"],
  },
  {
    name: "Carlos Ruiz",
    sat: SHIFT_STYLES["5:45p"],
    sun: "OFF",
    mon: SHIFT_STYLES["9:45p"],
    tue: SHIFT_STYLES["9:45p"],
    wed: "OFF",
    thu: SHIFT_STYLES["9:45p"],
    fri: "OFF",
  },
  {
    name: "Linda Ho",
    sat: "OFF",
    sun: "OFF",
    mon: "OFF",
    tue: "OFF",
    wed: SHIFT_STYLES["11:45p"],
    thu: SHIFT_STYLES["11:45p"],
    fri: SHIFT_STYLES["11:45p"],
  },
  {
    name: "Matt Bayers",
    sat: SHIFT_STYLES["7:45p"],
    sun: SHIFT_STYLES["3:45p"],
    mon: "OFF",
    tue: SHIFT_STYLES["9:45a"],
    wed: SHIFT_STYLES["11:45a"],
    thu: SHIFT_STYLES["9:45p"],
    fri: SHIFT_STYLES["11:45p"],
  },
  {
    name: "Jia Park",
    sat: SHIFT_STYLES["9:45p"],
    sun: "OFF",
    mon: SHIFT_STYLES["5:45p"],
    tue: "OFF",
    wed: "OFF",
    thu: SHIFT_STYLES["11:45a"],
    fri: SHIFT_STYLES["3:45p"],
  },
  {
    name: "Thomas Lee",
    sat: "OFF",
    sun: SHIFT_STYLES["3:45p"],
    mon: SHIFT_STYLES["5:45p"],
    tue: SHIFT_STYLES["11:45a"],
    wed: SHIFT_STYLES["11:45a"],
    thu: SHIFT_STYLES["11:45a"],
    fri: "OFF",
  },
  {
    name: "Fanny Duong",
    sat: SHIFT_STYLES["3:45p"],
    sun: SHIFT_STYLES["3:45p"],
    mon: "OFF",
    tue: "OFF",
    wed: SHIFT_STYLES["11:45p"],
    thu: SHIFT_STYLES["11:45p"],
    fri: SHIFT_STYLES["11:45p"],
  },
];

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

const SCHEDULE_BOARDS: ScheduleBoard[] = [
  { id: "dealer", title: "Dealers Schedule Board", rows: DEALER_SCHEDULE },
  { id: "floor", title: "Floor Schedule Board", rows: FLOOR_SCHEDULE },
  { id: "chip_runner", title: "Chip Runners Schedule Board", rows: CHIP_RUNNER_SCHEDULE },
];

function ScheduleCell({ value }: { value: ScheduleRow[DayKey] }) {
  if (value === "OFF" || value === "RO") {
    return (
      <td className={`${styles.floorScheduleGridCell} ${styles.floorScheduleGridCellOff}`}>
        <span className={styles.floorScheduleOffText}>{value}</span>
      </td>
    );
  }

  return (
    <td className={styles.floorScheduleGridCell}>
      <span className={`${styles.floorScheduleShiftChip} ${SHIFT_TONE_CLASS[value.tone]}`}>
        {value.label}
      </span>
    </td>
  );
}

export default function FloorSchedulePage() {
  const [selectedDepartment, setSelectedDepartment] =
    useState<(typeof DEPARTMENTS)[number]>("dealer");
  const selectedBoard =
    SCHEDULE_BOARDS.find((board) => board.id === selectedDepartment) ?? SCHEDULE_BOARDS[0];

  return (
    <>
      <div className={styles.floorControlBar}>
        <div className={styles.floorFilterRow}>
          <span className={styles.floorFilterLabel}>Week</span>
          {AVAILABLE_WEEKS.map((week, index) => (
            <button
              key={week}
              className={`${styles.floorPill} ${index === 0 ? styles.floorPillActive : ""}`}
              type="button"
            >
              {week}
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
                      {DAYS.map((day) => (
                        <th key={day.key} className={styles.floorScheduleDayHead}>
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
                        {DAYS.map((day) => (
                          <ScheduleCell
                            key={`${selectedBoard.title}-${row.name}-${day.key}`}
                            value={row[day.key]}
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
