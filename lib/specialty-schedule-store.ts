import { mockEmployees } from "@/lib/mock-data";

export type SpecialtyScheduleStatus = "scheduled" | "off";

export type SpecialtyScheduleEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentLabel: string;
  shiftDate: string;
  shiftTime: string;
  status: SpecialtyScheduleStatus;
};

export const SPECIALTY_SCHEDULE_STORAGE_KEY = "parkwest-specialty-schedule";
export const SPECIALTY_SCHEDULE_UPDATED_EVENT = "parkwest-specialty-schedule-updated";

export function loadStoredSpecialtySchedule(shiftDate: string) {
  const defaults = buildDefaultSpecialtySchedule(shiftDate);

  if (typeof window === "undefined") {
    return defaults;
  }

  const raw = window.localStorage.getItem(SPECIALTY_SCHEDULE_STORAGE_KEY);

  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as SpecialtyScheduleEntry[];

    if (!Array.isArray(parsed)) {
      return defaults;
    }

    const dateEntries = parsed.filter((entry) => entry.shiftDate === shiftDate);
    const mergedByEmployeeId = new Map(
      defaults.map((entry) => [entry.employeeId, entry] as const),
    );

    dateEntries.forEach((entry) => {
      mergedByEmployeeId.set(entry.employeeId, entry);
    });

    return [...mergedByEmployeeId.values()].sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName),
    );
  } catch {
    return defaults;
  }
}

export function saveStoredSpecialtySchedule(
  shiftDate: string,
  entries: SpecialtyScheduleEntry[],
) {
  if (typeof window === "undefined") {
    return;
  }

  const raw = window.localStorage.getItem(SPECIALTY_SCHEDULE_STORAGE_KEY);
  const existing = raw ? safeParseSchedule(raw) : [];
  const keptOtherDates = existing.filter((entry) => entry.shiftDate !== shiftDate);
  const next = [...keptOtherDates, ...entries];

  window.localStorage.setItem(SPECIALTY_SCHEDULE_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(SPECIALTY_SCHEDULE_UPDATED_EVENT));
}

function safeParseSchedule(raw: string) {
  try {
    const parsed = JSON.parse(raw) as SpecialtyScheduleEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildDefaultSpecialtySchedule(shiftDate: string) {
  return mockEmployees
    .map((employee) => {
      const departmentLabel =
        employee.departmentAssignments.find((assignment) => assignment.isPrimary)?.department
          .departmentName ?? "Team";

      const normalizedDepartment = departmentLabel.toLowerCase();

      if (
        normalizedDepartment !== "floor" &&
        normalizedDepartment !== "chip runner"
      ) {
        return null;
      }

      const employeeName =
        employee.displayName || `${employee.firstName} ${employee.lastName}`.trim();
      const shiftTime =
        normalizedDepartment === "floor" ? "3:45 PM – 12:00 AM" : "OFF";

      return {
        id: `specialty-${shiftDate}-${employee.employeeId}`,
        employeeId: employee.id,
        employeeName,
        departmentLabel,
        shiftDate,
        shiftTime,
        status: shiftTime === "OFF" ? "off" : "scheduled",
      } satisfies SpecialtyScheduleEntry;
    })
    .filter((entry): entry is SpecialtyScheduleEntry => Boolean(entry))
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}
