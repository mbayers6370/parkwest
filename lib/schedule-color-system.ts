export type ScheduleTone =
  | "pink"
  | "blue"
  | "orange"
  | "lavender"
  | "sky"
  | "green"
  | "amber"
  | "coral"
  | "red";

export type ScheduleShiftFamily = {
  familyLabel: string;
  displayLabel: string;
  tone: ScheduleTone;
};

const SHIFT_FAMILY_MAP: Record<string, ScheduleShiftFamily> = {
  "7:45a": { familyLabel: "8 AM", displayLabel: "7:45a", tone: "pink" },
  "7:30a": { familyLabel: "8 AM", displayLabel: "7:30a", tone: "pink" },
  "9:45a": { familyLabel: "10 AM", displayLabel: "9:45a", tone: "blue" },
  "10:15a": { familyLabel: "10 AM", displayLabel: "10:15a", tone: "blue" },
  "10:35a": { familyLabel: "10 AM", displayLabel: "10:35a", tone: "blue" },
  "11:45a": { familyLabel: "12 PM", displayLabel: "11:45a", tone: "orange" },
  "1:45p": { familyLabel: "2 PM", displayLabel: "1:45p", tone: "lavender" },
  "3:45p": { familyLabel: "4 PM", displayLabel: "3:45p", tone: "sky" },
  "3:30p": { familyLabel: "4 PM", displayLabel: "3:30p", tone: "sky" },
  "5:45p": { familyLabel: "6 PM", displayLabel: "5:45p", tone: "green" },
  "7:45p": { familyLabel: "8 PM", displayLabel: "7:45p", tone: "amber" },
  "7:30p": { familyLabel: "8 PM", displayLabel: "7:30p", tone: "amber" },
  "9:45p": { familyLabel: "10 PM", displayLabel: "9:45p", tone: "coral" },
  "11:45p": { familyLabel: "12 AM", displayLabel: "11:45p", tone: "red" },
  "11:30p": { familyLabel: "12 AM", displayLabel: "11:30p", tone: "red" },
  "1:45a": { familyLabel: "2 AM", displayLabel: "1:45a", tone: "red" },
};

const SHIFT_FAMILY_ORDER = [
  "8 AM",
  "10 AM",
  "12 PM",
  "2 PM",
  "4 PM",
  "6 PM",
  "8 PM",
  "10 PM",
  "12 AM",
  "2 AM",
] as const;

function normalizeShiftToken(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function getScheduleShiftFamily(value: string) {
  return SHIFT_FAMILY_MAP[normalizeShiftToken(value)] ?? null;
}

export function isScheduleStatusToken(value: string) {
  const normalized = normalizeShiftToken(value);
  return normalized === "off" || normalized === "ro" || normalized === "pto" || normalized === "fsr";
}

export function getScheduleShiftFamilies(values: string[]) {
  const selectedFamilies = new Map<string, ScheduleShiftFamily>();

  for (const value of values) {
    const family = getScheduleShiftFamily(value);

    if (family && !selectedFamilies.has(family.familyLabel)) {
      selectedFamilies.set(family.familyLabel, family);
    }
  }

  return SHIFT_FAMILY_ORDER.map((label) => selectedFamilies.get(label)).filter(
    (family): family is ScheduleShiftFamily => Boolean(family),
  );
}
