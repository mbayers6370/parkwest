export type CommunicationType = "announcement" | "meeting";

export type CommunicationAudience =
  | "all_employees"
  | "all_foh"
  | "dealer"
  | "floor"
  | "dual_rate"
  | "chip_runner"
  | "cage";

export type CommunicationSignupSlot = {
  id: string;
  dateIso: string;
  dateLabel: string;
  timeLabel: string;
  capacity: number;
  signups: string[];
};

export type CommunicationItem = {
  id: string;
  propertyKey: string;
  title: string;
  summary: string;
  body?: string;
  type: CommunicationType;
  audience: CommunicationAudience[];
  audienceLabel: string;
  publishedAt: string;
  expiresAt?: string;
  slots?: CommunicationSignupSlot[];
};

export const COMMUNICATIONS_STORAGE_KEY = "parkwest-communications";
export const COMMUNICATIONS_UPDATED_EVENT = "parkwest-communications-updated";

export const COMMUNICATION_AUDIENCE_OPTIONS: Array<{
  value: CommunicationAudience;
  label: string;
}> = [
  { value: "all_employees", label: "All Employees" },
  { value: "all_foh", label: "All FOH Employees" },
  { value: "dealer", label: "Dealer" },
  { value: "floor", label: "Floor" },
  { value: "dual_rate", label: "Dual Rate" },
  { value: "chip_runner", label: "Chip Runner" },
  { value: "cage", label: "Cage" },
];

const COMMUNICATION_AUDIENCE_LABELS = new Map(
  COMMUNICATION_AUDIENCE_OPTIONS.map((option) => [option.value, option.label] as const),
);

const SEEDED_COMMUNICATIONS: CommunicationItem[] = [
  {
    id: "comms-title31-apr-2026",
    propertyKey: "580",
    title: "Title 31 Training",
    summary: "All FOH employees must attend one upcoming training session.",
    body: "Please sign up for one available Title 31 Training session below. Attendance is required.",
    type: "meeting",
    audience: ["all_foh"],
    audienceLabel: "All FOH Employees",
    publishedAt: "2026-04-07T09:00:00.000Z",
    expiresAt: "2026-04-30T23:59:59.000Z",
    slots: [
      slot("t31-2026-04-28-0830", "2026-04-28", "Tuesday 4/28", "8:30 AM - 9:30 AM"),
      slot("t31-2026-04-28-1030", "2026-04-28", "Tuesday 4/28", "10:30 AM - 11:30 AM"),
      slot("t31-2026-04-28-1430", "2026-04-28", "Tuesday 4/28", "2:30 PM - 3:30 PM"),
      slot("t31-2026-04-28-1630", "2026-04-28", "Tuesday 4/28", "4:30 PM - 5:30 PM"),
      slot("t31-2026-04-29-1030", "2026-04-29", "Wednesday 4/29", "10:30 AM - 11:30 AM"),
      slot("t31-2026-04-29-1430", "2026-04-29", "Wednesday 4/29", "2:30 PM - 3:30 PM"),
      slot("t31-2026-04-29-1630", "2026-04-29", "Wednesday 4/29", "4:30 PM - 5:30 PM"),
      slot("t31-2026-04-29-2030", "2026-04-29", "Wednesday 4/29", "8:30 PM - 9:30 PM"),
      slot("t31-2026-04-30-0830", "2026-04-30", "Thursday 4/30", "8:30 AM - 9:30 AM"),
      slot("t31-2026-04-30-1030", "2026-04-30", "Thursday 4/30", "10:30 AM - 11:30 AM"),
      slot("t31-2026-04-30-1430", "2026-04-30", "Thursday 4/30", "2:30 PM - 3:30 PM"),
    ],
  },
];

function slot(id: string, dateIso: string, dateLabel: string, timeLabel: string): CommunicationSignupSlot {
  return {
    id,
    dateIso,
    dateLabel,
    timeLabel,
    capacity: 12,
    signups: [],
  };
}

export function loadStoredCommunications() {
  if (typeof window === "undefined") {
    return [] as CommunicationItem[];
  }

  const raw = window.localStorage.getItem(COMMUNICATIONS_STORAGE_KEY);

  if (!raw) {
    return [] as CommunicationItem[];
  }

  try {
    const parsed = JSON.parse(raw) as CommunicationItem[];
    return Array.isArray(parsed) ? parsed.map(normalizeCommunicationItem) : [];
  } catch {
    return [];
  }
}

export function saveStoredCommunications(items: CommunicationItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(COMMUNICATIONS_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(COMMUNICATIONS_UPDATED_EVENT));
}

export function getAllCommunications(
  storedItems: CommunicationItem[] = [],
  propertyKey?: string,
) {
  const merged = new Map<string, CommunicationItem>();

  SEEDED_COMMUNICATIONS.forEach((item) => {
    if (!propertyKey || item.propertyKey === propertyKey) {
      merged.set(item.id, normalizeCommunicationItem(item));
    }
  });

  storedItems.forEach((item) => {
    if (!propertyKey || item.propertyKey === propertyKey) {
      merged.set(item.id, normalizeCommunicationItem(item));
    }
  });

  return [...merged.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function splitCommunicationsByStatus(
  items: CommunicationItem[],
  now = new Date(),
) {
  return {
    active: items.filter((item) => !isCommunicationArchived(item, now)),
    archived: items.filter((item) => isCommunicationArchived(item, now)),
  };
}

export function isCommunicationArchived(item: CommunicationItem, now = new Date()) {
  const nowMs = now.getTime();

  if (item.type === "meeting" && item.slots && item.slots.length > 0) {
    const lastSlotEnd = [...item.slots]
      .map((slot) => getMeetingSlotEndDate(slot))
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => a.getTime() - b.getTime())
      .at(-1);

    if (lastSlotEnd) {
      return lastSlotEnd.getTime() < nowMs;
    }
  }

  if (item.expiresAt) {
    return new Date(item.expiresAt).getTime() < nowMs;
  }

  return false;
}

export function getCommunicationEmployeeSignup(
  item: CommunicationItem,
  employeeName: string,
) {
  return item.slots?.find((slot) => slot.signups.includes(employeeName)) ?? null;
}

export function getGroupedSlots(item: CommunicationItem) {
  const groups = new Map<string, { dateIso: string; dateLabel: string; slots: CommunicationSignupSlot[] }>();

  (item.slots ?? []).forEach((slot) => {
    if (!groups.has(slot.dateIso)) {
      groups.set(slot.dateIso, {
        dateIso: slot.dateIso,
        dateLabel: slot.dateLabel,
        slots: [],
      });
    }

    groups.get(slot.dateIso)?.slots.push(slot);
  });

  return [...groups.values()].sort((a, b) => a.dateIso.localeCompare(b.dateIso));
}

export function getCommunicationAudienceLabel(audience: CommunicationAudience[] | CommunicationAudience) {
  const audienceValues = Array.isArray(audience) ? audience : [audience];

  return audienceValues
    .map((value) => COMMUNICATION_AUDIENCE_LABELS.get(value) ?? value)
    .join(", ");
}

function normalizeCommunicationItem(item: CommunicationItem) {
  const audienceValues = Array.isArray(item.audience) ? item.audience : [item.audience];
  const { required: _required, ...rest } = item as CommunicationItem & { required?: boolean };

  return {
    ...rest,
    audience: audienceValues,
    audienceLabel: item.audienceLabel || getCommunicationAudienceLabel(audienceValues),
  };
}

function getMeetingSlotEndDate(slot: CommunicationSignupSlot) {
  const endLabel = slot.timeLabel.split("-")[1]?.trim();

  if (!endLabel) {
    return null;
  }

  const match = endLabel.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  const rawHour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  let hour = rawHour % 12;

  if (meridiem === "PM") {
    hour += 12;
  }

  return new Date(`${slot.dateIso}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);
}
