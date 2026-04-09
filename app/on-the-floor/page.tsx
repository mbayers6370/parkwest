"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Check,
  Copy,
  LoaderCircle,
  Pencil,
  Shuffle,
  X,
} from "lucide-react";
import {
  getAllAttendanceEvents,
  getAttendanceEventsForDate,
  getAllowedPslHours,
  sanitizeAttendancePslHours,
  type AttendanceEvent,
  type AttendancePslHours,
  type AttendanceEventType,
} from "@/lib/attendance-events";
import {
  loadStoredAttendanceEvents,
  saveStoredAttendanceEvents,
} from "@/lib/attendance-event-store";
import {
  loadStoredSchedule,
  saveStoredSchedule,
  SCHEDULE_UPDATED_EVENT,
} from "@/lib/mock-schedule-store";
import { type ScheduleEntry } from "@/lib/mock-schedule";
import {
  loadCurrentAndFuturePublishedScheduleEntries,
  PUBLISHED_SCHEDULE_UPDATED_EVENT,
} from "@/lib/published-schedule-store";
import {
  getMostRecentWorkedShiftEnd,
  parseShiftRange,
} from "@/lib/mock-schedule";
import {
  loadStoredShiftGiveawayRequests,
  saveStoredShiftGiveawayRequests,
  SHIFT_GIVEAWAY_REQUESTS_UPDATED_EVENT,
} from "@/lib/shift-giveaway-request-store";
import {
  applyApprovedGiveawayRequest,
  SHIFT_REQUEST_KIND_LABELS,
  type ShiftGiveawayRequest,
} from "@/lib/shift-giveaway-requests";
import {
  applyScheduleOverrides,
  buildShiftTimeRange,
  formatShiftStartOptionLabel,
  getScheduledDaysForWeek,
  getShiftStartLabel,
  SHIFT_START_OPTIONS,
  type ScheduleOverride,
} from "@/lib/schedule-overrides";
import {
  loadStoredScheduleOverrides,
  saveStoredScheduleOverrides,
  SCHEDULE_OVERRIDES_UPDATED_EVENT,
} from "@/lib/schedule-override-store";
import {
  loadStoredSpecialtySchedule,
  SPECIALTY_SCHEDULE_UPDATED_EVENT,
  saveStoredSpecialtySchedule,
} from "@/lib/specialty-schedule-store";
import pageStyles from "./page.module.css";
import sharedStyles from "./floor-shared.module.css";

const styles = { ...sharedStyles, ...pageStyles };

// ─── Types ────────────────────────────────────────────────────
type AttendanceStatus = "unset" | "late" | "absent" | "callout";
type AttendanceLogFilter = "all" | "points" | "psl";

type DealerEntry = {
  id: string;
  name: string;
  initials: string;
  status: AttendanceStatus;
};

type ShiftSlot = {
  label: string;
  hour: number; // 24h; midnight = 0
  dealers: DealerEntry[];
};

type LineupState = {
  slotLabel: string;
  names: string[];
  source: "random.org" | "fallback" | "trivial";
  isShuffling: boolean;
};

type ScheduleAdjustmentMode =
  | "start_time_change"
  | "dealer_added"
  | "floor_added"
  | "chip_runner_added";

const SCHEDULE_ADJUSTMENT_LABELS: Record<ScheduleAdjustmentMode, string> = {
  start_time_change: "Change Start Time",
  dealer_added: "Add Dealer",
  floor_added: "Add Floor",
  chip_runner_added: "Add Chip Runner",
};

const SHIFT_TEMPLATES: Array<{ label: string; hour: number }> = [
  { label: "7:45 AM", hour: 8 },
  { label: "9:45 AM", hour: 10 },
  { label: "11:45 AM", hour: 12 },
  { label: "1:45 PM", hour: 14 },
  { label: "3:45 PM", hour: 16 },
  { label: "5:45 PM", hour: 18 },
  { label: "7:45 PM", hour: 20 },
  { label: "9:45 PM", hour: 22 },
  { label: "11:45 PM", hour: 0 },
];

// ─── Display maps ─────────────────────────────────────────────
const STATUS_LABELS: Record<AttendanceStatus, string> = {
  unset:   "Unmarked",
  late:    "Late",
  absent:  "Absent",
  callout: "Absent",
};

const STATUS_BADGE: Record<AttendanceStatus, string> = {
  unset:   "gold",
  late:    "warning",
  absent:  "danger",
  callout: "danger",
};

// ─── Helpers ──────────────────────────────────────────────────
const DAY_NAMES   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function shiftOrder(hour: number) { return hour === 0 ? 24 : hour; }

function parseShiftLabelMinutes(label: string) {
  const [timePart, meridiem] = label.split(" ");
  const [rawHour, rawMinute = "0"] = timePart.split(":");
  let hour = Number(rawHour) % 12;

  if (meridiem === "PM") {
    hour += 12;
  }

  let totalMinutes = hour * 60 + Number(rawMinute);

  if (hour < 6) {
    totalMinutes += 24 * 60;
  }

  return totalMinutes;
}

function getCurrentTimeMinutes(now: Date): number {
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const hourMinutes = hour * 60 + minutes;

  return hour < 6 ? hourMinutes + 24 * 60 : hourMinutes;
}

// Casino closes Sun & Mon at 2 AM, reopens at 10:30 AM.
// All other days the operating day rolls at 6 AM.
const CLOSE_MINUTES = 2 * 60;       // 2:00 AM
const REOPEN_MINUTES = 10 * 60 + 30; // 10:30 AM
const ROLLOVER_MINUTES = 6 * 60;     // 6:00 AM (normal days)

function getOperatingDay(now: Date): { date: Date; isClosed: boolean } {
  const dow = now.getDay(); // 0 = Sun, 1 = Mon
  const totalMinutes = now.getHours() * 60 + now.getMinutes();

  function prevDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1,
      d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
  }

  // Sunday 12:00 AM–2:00 AM → still Saturday
  if (dow === 0 && totalMinutes < CLOSE_MINUTES) {
    return { date: prevDay(now), isClosed: false };
  }
  // Sunday 2:00 AM–10:30 AM → closed
  if (dow === 0 && totalMinutes < REOPEN_MINUTES) {
    return { date: now, isClosed: true };
  }
  // Monday 12:00 AM–2:00 AM → still Sunday
  if (dow === 1 && totalMinutes < CLOSE_MINUTES) {
    return { date: prevDay(now), isClosed: false };
  }
  // Monday 2:00 AM–10:30 AM → closed
  if (dow === 1 && totalMinutes < REOPEN_MINUTES) {
    return { date: now, isClosed: true };
  }
  // Normal days before 6 AM → previous day
  if (totalMinutes < ROLLOVER_MINUTES) {
    return { date: prevDay(now), isClosed: false };
  }
  return { date: now, isClosed: false };
}

// Keep old name for compatibility with existing call sites
function getOperatingDate(now: Date) {
  return getOperatingDay(now).date;
}

function getShiftStartMinutes(label: string): number {
  return parseShiftLabelMinutes(label);
}

function getCurrentShiftIdx(slots: ShiftSlot[], currentMinutes: number): number {
  for (let i = 0; i < slots.length; i++) {
    if (getShiftStartMinutes(slots[i].label) > currentMinutes) return i;
  }
  return -1;
}

function toggle(current: AttendanceStatus, next: AttendanceStatus): AttendanceStatus {
  return current === next ? "unset" : next;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getAttendanceStatusForEventType(
  eventType: AttendanceEventType,
): AttendanceStatus {
  if (eventType === "call_out_point" || eventType === "call_out_psl") {
    return "absent";
  }

  return "unset";
}

function sortDealers(dealers: DealerEntry[]) {
  return [...dealers].sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Lineup modal ─────────────────────────────────────────────
function LineupModal({
  lineup,
  onClose,
  onReshuffle,
}: {
  lineup: LineupState;
  onClose: () => void;
  onReshuffle: () => void;
}) {
  const [copied, setCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleCopy() {
    const text = lineup.names
      .map((name) => name.trim().split(/\s+/)[0] ?? name)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  const sourceLabel =
    lineup.source === "random.org" ? "True random · random.org" :
    lineup.source === "trivial"    ? "1 dealer" :
    "Randomized";

  return (
    <div
      className={styles.lineupOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lineup-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.lineupModal}>

        {/* ── Header ── */}
        <div className={styles.lineupModalHeader}>
          <div className={styles.lineupModalHeaderLeft}>
            <h2 className={styles.lineupModalTitle} id="lineup-modal-title">
              {lineup.slotLabel}
            </h2>
            {!lineup.isShuffling && (
              <p className={styles.lineupModalMeta}>
                {lineup.names.length} dealer{lineup.names.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            className={styles.lineupModalClose}
            onClick={onClose}
            type="button"
            aria-label="Close draw"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.lineupModalBody}>
          {lineup.isShuffling ? (
            <div className={styles.lineupModalLoading}>
              <LoaderCircle className={styles.spinIcon} size={18} aria-hidden="true" />
              Loading...
            </div>
          ) : (
            <ol className={styles.lineupModalNames} role="list">
              {lineup.names.map((name, i) => (
                <li key={i} className={styles.lineupModalNameItem}>
                  <span className={styles.lineupModalNum}>{i + 1}</span>
                  <span className={styles.lineupModalName}>{name}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* ── Footer actions ── */}
        {!lineup.isShuffling && (
          <div className={styles.lineupModalFooter}>
            <button
              type="button"
              className={cx(
                styles.lineupModalCopy,
                copied && styles.lineupModalCopyCopied,
              )}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check size={14} aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} aria-hidden="true" />
                  Copy List
                </>
              )}
            </button>
            <button
              type="button"
              className={styles.lineupModalReshuffle}
              onClick={onReshuffle}
            >
              <Shuffle size={14} aria-hidden="true" />
              Randomize Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function OnTheFloorNowPage() {
  const [now, setNow] = useState(() => new Date());
  const [storedAttendanceEvents, setStoredAttendanceEvents] = useState<
    AttendanceEvent[]
  >([]);
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceLogFilter, setAttendanceLogFilter] =
    useState<AttendanceLogFilter>("all");
  const [selectedAttendanceDealerId, setSelectedAttendanceDealerId] =
    useState("");
  const [newAttendanceType, setNewAttendanceType] =
    useState<AttendanceEventType>("call_out_point");
  const [newAttendancePslHours, setNewAttendancePslHours] = useState<AttendancePslHours>(2);
  const [pendingClearEventId, setPendingClearEventId] = useState<string | null>(null);
  const [pendingEditEventId, setPendingEditEventId] = useState<string | null>(null);
  const [editAttendanceType, setEditAttendanceType] =
    useState<AttendanceEventType>("call_out_point");
  const [editAttendancePslHours, setEditAttendancePslHours] = useState<AttendancePslHours>(2);
  const [giveawayRequests, setGiveawayRequests] = useState<ShiftGiveawayRequest[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [specialtyScheduleEntries, setSpecialtyScheduleEntries] = useState<
    Array<{
      id: string;
      employeeId: string;
      employeeName: string;
      departmentLabel: string;
      shiftDate: string;
      shiftTime: string;
      status: "scheduled" | "off";
    }>
  >([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverride[]>([]);
  const [scheduleChangeType, setScheduleChangeType] =
    useState<ScheduleAdjustmentMode>("start_time_change");
  const [selectedScheduleEmployeeId, setSelectedScheduleEmployeeId] = useState("");
  const [scheduleChangeSearch, setScheduleChangeSearch] = useState("");
  const [scheduleChangeStartLabel, setScheduleChangeStartLabel] = useState<(typeof SHIFT_START_OPTIONS)[number]>("7:45 AM");
  const [scheduleChangeNote, setScheduleChangeNote] = useState("");
  const [scheduleChangeMessage, setScheduleChangeMessage] = useState("");
  const { date: operatingDate, isClosed } = getOperatingDay(now);
  const dow       = operatingDate.getDay();
  const isSunday  = dow === 0;
  const dayLabel  = DAY_NAMES[dow];
  const dateLabel = `${MONTH_NAMES[operatingDate.getMonth()]} ${operatingDate.getDate()}`;
  const currentMinutes = getCurrentTimeMinutes(now);
  const todayIso = toIsoDate(operatingDate);

  useEffect(() => {
    let timeout: number | undefined;

    const scheduleNextUpdate = () => {
      const current = new Date();
      const msUntilNextHour =
        ((60 - current.getMinutes()) * 60 - current.getSeconds()) * 1000 -
        current.getMilliseconds();

      timeout = window.setTimeout(() => {
        setNow(new Date());
        scheduleNextUpdate();
      }, msUntilNextHour);
    };

    scheduleNextUpdate();

    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const syncAttendanceEvents = () => {
      setStoredAttendanceEvents(loadStoredAttendanceEvents());
    };
    const syncGiveawayRequests = () => {
      setGiveawayRequests(loadStoredShiftGiveawayRequests());
    };
    const syncScheduleEntries = () => {
      const publishedEntries = loadCurrentAndFuturePublishedScheduleEntries("580");
      setScheduleEntries(publishedEntries);
    };
    const syncScheduleOverrides = () => {
      setScheduleOverrides(loadStoredScheduleOverrides());
    };
    const syncSpecialtySchedule = () => {
      setSpecialtyScheduleEntries(loadStoredSpecialtySchedule(todayIso));
    };

    syncAttendanceEvents();
    syncGiveawayRequests();
    syncScheduleEntries();
    syncScheduleOverrides();
    syncSpecialtySchedule();

    window.addEventListener("storage", syncAttendanceEvents);
    window.addEventListener("storage", syncGiveawayRequests);
    window.addEventListener("storage", syncScheduleEntries);
    window.addEventListener("storage", syncScheduleOverrides);
    window.addEventListener("storage", syncSpecialtySchedule);
    window.addEventListener(
      SHIFT_GIVEAWAY_REQUESTS_UPDATED_EVENT,
      syncGiveawayRequests,
    );
    window.addEventListener(SCHEDULE_UPDATED_EVENT, syncScheduleEntries);
    window.addEventListener(PUBLISHED_SCHEDULE_UPDATED_EVENT, syncScheduleEntries);
    window.addEventListener(SCHEDULE_OVERRIDES_UPDATED_EVENT, syncScheduleOverrides);
    window.addEventListener(SPECIALTY_SCHEDULE_UPDATED_EVENT, syncSpecialtySchedule);

    return () => {
      window.removeEventListener("storage", syncAttendanceEvents);
      window.removeEventListener("storage", syncGiveawayRequests);
      window.removeEventListener("storage", syncScheduleEntries);
      window.removeEventListener("storage", syncScheduleOverrides);
      window.removeEventListener("storage", syncSpecialtySchedule);
      window.removeEventListener(
        SHIFT_GIVEAWAY_REQUESTS_UPDATED_EVENT,
        syncGiveawayRequests,
      );
      window.removeEventListener(SCHEDULE_UPDATED_EVENT, syncScheduleEntries);
      window.removeEventListener(PUBLISHED_SCHEDULE_UPDATED_EVENT, syncScheduleEntries);
      window.removeEventListener(SCHEDULE_OVERRIDES_UPDATED_EVENT, syncScheduleOverrides);
      window.removeEventListener(SPECIALTY_SCHEDULE_UPDATED_EVENT, syncSpecialtySchedule);
    };
  }, [todayIso]);
  const effectiveScheduleEntries = useMemo(
    () => applyScheduleOverrides(scheduleEntries, scheduleOverrides),
    [scheduleEntries, scheduleOverrides],
  );

  const baseSlots = useMemo(
    () => createShiftSlotsForDate(effectiveScheduleEntries, todayIso, isSunday),
    [effectiveScheduleEntries, todayIso, isSunday]
  );

  const [slots, setSlots] = useState<ShiftSlot[]>(baseSlots);
  const [selectedSlotLabel, setSelectedSlotLabel] = useState("");
  const [lineup, setLineup] = useState<LineupState | null>(null);
  // slotIdx the lineup belongs to, so we can reshuffle with fresh dealer statuses
  const [lineupSlotIdx, setLineupSlotIdx] = useState<number>(-1);

  useEffect(() => {
    setSlots((prev) => mergeShiftSlots(baseSlots, prev));
  }, [baseSlots]);

  const currentIdx = useMemo(() => getCurrentShiftIdx(slots, currentMinutes), [slots, currentMinutes]);

  useEffect(() => {
    if (slots.length === 0) {
      setSelectedSlotLabel("");
      return;
    }

    setSelectedSlotLabel((current) => {
      if (current && slots.some((slot) => slot.label === current)) {
        return current;
      }

      const fallbackIndex =
        currentIdx >= 0 && currentIdx < slots.length ? currentIdx : Math.max(slots.length - 1, 0);

      return slots[fallbackIndex]?.label ?? slots[0].label;
    });
  }, [currentIdx, slots]);

  const selectedSlotIdx = useMemo(
    () => slots.findIndex((slot) => slot.label === selectedSlotLabel),
    [selectedSlotLabel, slots],
  );

  const selectedSlot =
    (selectedSlotIdx >= 0 ? slots[selectedSlotIdx] : null) ??
    slots[0] ??
    null;

  // ── Randomize ──
  const handleRandomize = useCallback(async (slotIdx: number) => {
    const eligible = slots[slotIdx].dealers.filter(
      (d) => d.status === "unset" || d.status === "late"
    );
    if (eligible.length === 0) return;

    setLineupSlotIdx(slotIdx);

    // Open modal immediately in loading state
    setLineup((prev) => ({
      slotLabel:  slots[slotIdx].label,
      names:      prev?.slotLabel === slots[slotIdx].label ? prev.names : [],
      source:     prev?.source ?? "random.org",
      isShuffling: true,
    }));

    try {
      const res  = await fetch(`/api/shuffle?n=${eligible.length}`);
      const data = await res.json() as { order: number[]; source: string };
      setLineup({
        slotLabel:   slots[slotIdx].label,
        names:       data.order.map((i) => eligible[i].name),
        source:      data.source as LineupState["source"],
        isShuffling: false,
      });
    } catch {
      const shuffled = [...eligible].sort(() => Math.random() - 0.5).map((d) => d.name);
      setLineup({
        slotLabel:   slots[slotIdx].label,
        names:       shuffled,
        source:      "fallback",
        isShuffling: false,
      });
    }
  }, [slots]);

  // ── Attendance mark ──
  function markDealer(slotIdx: number, dealerId: string, newStatus: AttendanceStatus) {
    setSlots((prev) =>
      prev.map((slot, si) =>
        si !== slotIdx ? slot : {
          ...slot,
          dealers: slot.dealers.map((d) =>
            d.id !== dealerId ? d : { ...d, status: newStatus }
          ),
        }
      )
    );
  }

  function syncDealerAssignment(
    employeeName: string,
    shiftLabel: string,
    eventType?: AttendanceEventType,
    pslHours?: 2 | 4 | 6 | 8,
  ) {
    setSlots((prev) => {
      let dealerRecord: DealerEntry | undefined;

      const slotsWithoutDealer = prev.map((slot) => {
        const matchingDealer = slot.dealers.find((dealer) => dealer.name === employeeName);
        if (matchingDealer && !dealerRecord) {
          dealerRecord = matchingDealer;
        }

        return {
          ...slot,
          dealers: slot.dealers.filter((dealer) => dealer.name !== employeeName),
        };
      });

      if (!dealerRecord) {
        dealerRecord = createDealerEntry(employeeName, shiftLabel, todayIso);
      }

      if (!dealerRecord) {
        return prev;
      }

      const sourceSlot = prev.find((slot) => slot.label === shiftLabel);
      const targetHour =
        eventType === "reverse_psl" && sourceSlot
          ? (sourceSlot.hour + (pslHours ?? 2)) % 24
          : null;
      const targetSlotLabel =
        targetHour === null
          ? shiftLabel
          : prev.find((slot) => slot.hour === targetHour)?.label ?? shiftLabel;
      const targetStatus =
        eventType === undefined
          ? "unset"
          : getAttendanceStatusForEventType(eventType);

      return slotsWithoutDealer.map((slot) =>
        slot.label !== targetSlotLabel
          ? slot
          : {
              ...slot,
              dealers: sortDealers([
                ...slot.dealers,
                {
                  ...dealerRecord!,
                  status: targetStatus,
                },
              ]),
            },
      );
    });
  }

  function clearAttendanceEvent(eventId: string) {
    const currentEvent = storedAttendanceEvents.find((event) => event.id === eventId);

    setStoredAttendanceEvents((prev) => {
      const next = prev.filter((event) => event.id !== eventId);
      saveStoredAttendanceEvents(next);
      return next;
    });

    if (currentEvent) {
      syncDealerAssignment(currentEvent.employeeName, currentEvent.shiftLabel);
    }
  }

  function updateAttendanceEvent(
    eventId: string,
    eventType: AttendanceEventType,
    pslHours?: AttendancePslHours,
  ) {
    const currentEvent = storedAttendanceEvents.find((event) => event.id === eventId);

    setStoredAttendanceEvents((prev) => {
      const next = prev.map((event) =>
        event.id !== eventId
          ? event
          : {
              ...event,
              submittedAt: new Date().toISOString(),
              eventType,
              pslHours: sanitizeAttendancePslHours(eventType, pslHours),
            },
      );
      saveStoredAttendanceEvents(next);
      return next;
    });

    if (currentEvent) {
      syncDealerAssignment(
        currentEvent.employeeName,
        currentEvent.shiftLabel,
        eventType,
        sanitizeAttendancePslHours(eventType, pslHours),
      );
    }
  }

  // Day stats
  const todayAttendanceEvents = getAttendanceEventsForDate(
    getAllAttendanceEvents(storedAttendanceEvents),
    todayIso,
  );
  const pendingClearEvent = useMemo(
    () =>
      pendingClearEventId
        ? todayAttendanceEvents.find((event) => event.id === pendingClearEventId) ?? null
        : null,
    [pendingClearEventId, todayAttendanceEvents],
  );
  const pendingEditEvent = useMemo(
    () =>
      pendingEditEventId
        ? todayAttendanceEvents.find((event) => event.id === pendingEditEventId) ?? null
        : null,
    [pendingEditEventId, todayAttendanceEvents],
  );
  const scheduledDealers = useMemo(() => {
    return slots.flatMap((slot) =>
      slot.dealers.map((dealer) => ({
        id: dealer.id,
        name: dealer.name,
        shiftLabel: slot.label,
        shiftStartTime: slot.label,
        shiftEndTime: getShiftEndLabel(slot.label),
        departmentLabel: "Dealer",
      })),
    );
  }, [slots]);
  const specialtyTeamMembers = useMemo(
    () =>
      specialtyScheduleEntries
        .filter((entry) => entry.status === "scheduled")
        .map((entry) => {
          const [shiftStartTime, shiftEndTime] = entry.shiftTime
            .split("–")
            .map((part) => part.trim());

          return {
            id: entry.employeeId,
            name: entry.employeeName,
            shiftLabel: getShiftStartLabel(entry.shiftTime),
            shiftStartTime,
            shiftEndTime,
            departmentLabel: entry.departmentLabel,
          };
        }),
    [specialtyScheduleEntries],
  );
  const scheduledAttendanceMembers = useMemo(
    () => [...scheduledDealers, ...specialtyTeamMembers],
    [scheduledDealers, specialtyTeamMembers],
  );
  const filteredScheduledDealers = useMemo(() => {
    const normalizedSearch = attendanceSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return [];
    }

    return scheduledAttendanceMembers
      .filter((dealer) => dealer.name.toLowerCase().includes(normalizedSearch))
      .slice(0, 8);
  }, [attendanceSearch, scheduledAttendanceMembers]);
  const selectedAttendanceDealer = useMemo(
    () =>
      scheduledAttendanceMembers.find((dealer) => dealer.id === selectedAttendanceDealerId),
    [scheduledAttendanceMembers, selectedAttendanceDealerId],
  );
  const dealerNameSet = useMemo(
    () => new Set(scheduledAttendanceMembers.map((dealer) => dealer.name)),
    [scheduledAttendanceMembers],
  );
  const dealerAttendanceEvents = useMemo(
    () => todayAttendanceEvents.filter((event) => dealerNameSet.has(event.employeeName)),
    [dealerNameSet, todayAttendanceEvents],
  );
  const filteredDealerAttendanceEvents = useMemo(
    () =>
      dealerAttendanceEvents.filter((event) => {
        if (attendanceLogFilter === "all") {
          return true;
        }

        if (attendanceLogFilter === "points") {
          return event.eventType === "call_out_point" || event.eventType === "half_point";
        }

        return (
          event.eventType === "call_out_psl" ||
          event.eventType === "reverse_psl" ||
          event.eventType === "psl_leave_early"
        );
      }),
    [attendanceLogFilter, dealerAttendanceEvents],
  );
  const pendingGiveawayRequests = useMemo(
    () =>
      giveawayRequests.filter(
        (request) =>
          request.status === "pending" && request.approvalRoute !== "admin_only",
      ),
    [giveawayRequests],
  );

  function updateFloorGiveawayRequest(requestId: string, status: "approved" | "denied") {
    const request = giveawayRequests.find((entry) => entry.id === requestId);

    if (!request) {
      return;
    }

    if (status === "approved") {
      const nextStoredSchedule = applyApprovedGiveawayRequest(loadStoredSchedule(), request);
      saveStoredSchedule(nextStoredSchedule);
    }

    const nextRequests = giveawayRequests.map((entry) =>
      entry.id !== requestId
        ? entry
        : {
            ...entry,
            status,
            reviewedAt: new Date().toISOString(),
            reviewedBy: "Floor",
          },
    );

    setGiveawayRequests(nextRequests);
    saveStoredShiftGiveawayRequests(nextRequests);
  }

  const scheduleChangeCandidates = useMemo(() => {
    const dealerCandidates = effectiveScheduleEntries
      .filter((entry) => entry.shiftDate === todayIso)
      .filter((entry) => {
        if (scheduleChangeType === "start_time_change") {
          return entry.status === "scheduled";
        }

        if (scheduleChangeType === "dealer_added") {
          return entry.status === "off";
        }

        return false;
      })
      .filter((entry) => {
        if (scheduleChangeType !== "dealer_added") {
          return true;
        }

        const scheduledDays = getScheduledDaysForWeek(
          effectiveScheduleEntries,
          entry.employeeName,
          entry.shiftDate,
        );

        if (scheduledDays > 5) {
          return false;
        }

        const targetRange = parseShiftRange(
          todayIso,
          buildShiftTimeRange(scheduleChangeStartLabel),
        );

        if (!targetRange) {
          return false;
        }

        const lastWorkedEnd = getMostRecentWorkedShiftEnd(
          effectiveScheduleEntries,
          entry.employeeName,
          targetRange.start,
        );

        if (!lastWorkedEnd) {
          return true;
        }

        const restHours =
          (targetRange.start.getTime() - lastWorkedEnd.getTime()) / (60 * 60 * 1000);

        return restHours >= 9.5;
      })
      .map((entry) => ({
        id: entry.id,
        employeeId: entry.id,
        employeeName: entry.employeeName,
        shiftDate: entry.shiftDate,
        shiftTime: entry.shiftTime,
        departmentLabel: "Dealer",
        source: "dealer" as const,
      }));

    const specialtyCandidates = specialtyScheduleEntries
      .filter((entry) => entry.shiftDate === todayIso)
      .filter((entry) => {
        if (scheduleChangeType === "start_time_change") {
          return entry.status === "scheduled";
        }

        if (scheduleChangeType === "floor_added") {
          return entry.departmentLabel === "Floor" && entry.status === "off";
        }

        if (scheduleChangeType === "chip_runner_added") {
          return entry.departmentLabel === "Chip Runner" && entry.status === "off";
        }

        return false;
      })
      .map((entry) => ({
        id: entry.id,
        employeeId: entry.employeeId,
        employeeName: entry.employeeName,
        shiftDate: entry.shiftDate,
        shiftTime: entry.shiftTime,
        departmentLabel: entry.departmentLabel,
        source: "specialty" as const,
      }));

    return [...dealerCandidates, ...specialtyCandidates].sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName),
    );
  }, [
    effectiveScheduleEntries,
    scheduleChangeStartLabel,
    scheduleChangeType,
    specialtyScheduleEntries,
    todayIso,
  ]);
  const filteredScheduleChangeCandidates = useMemo(() => {
    const normalizedSearch = scheduleChangeSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return [];
    }

    return scheduleChangeCandidates
      .filter((entry) => entry.employeeName.toLowerCase().includes(normalizedSearch))
      .slice(0, 8);
  }, [scheduleChangeCandidates, scheduleChangeSearch]);
  const selectedScheduleEntry = useMemo(
    () =>
      scheduleChangeCandidates.find(
        (entry) => entry.employeeId === selectedScheduleEmployeeId,
      ) ?? null,
    [scheduleChangeCandidates, selectedScheduleEmployeeId],
  );
  const availableScheduleStartOptions = useMemo(
    () =>
      SHIFT_START_OPTIONS.filter((label) => {
        const slot = SHIFT_TEMPLATES.find((entry) => entry.label === label);

        if (!slot) {
          return false;
        }

        return getShiftStartMinutes(slot.label) > currentMinutes;
      }),
    [currentMinutes],
  );
  useEffect(() => {
    if (availableScheduleStartOptions.length === 0) {
      return;
    }

    if (!availableScheduleStartOptions.includes(scheduleChangeStartLabel)) {
      setScheduleChangeStartLabel(availableScheduleStartOptions[0]);
    }
  }, [availableScheduleStartOptions, scheduleChangeStartLabel]);
  const scheduleChangeSixDayFlag = useMemo(() => {
    if (!selectedScheduleEntry) {
      return false;
    }

    if (selectedScheduleEntry.source !== "dealer") {
      return false;
    }

    const scheduledDays = getScheduledDaysForWeek(
      effectiveScheduleEntries,
      selectedScheduleEntry.employeeName,
      selectedScheduleEntry.shiftDate,
    );

    return scheduleChangeType === "dealer_added"
      ? scheduledDays + 1 >= 6
      : scheduledDays >= 6;
  }, [effectiveScheduleEntries, scheduleChangeType, selectedScheduleEntry]);

  function submitFloorAttendance() {
    if (!selectedAttendanceDealer) return;

    const nextEvent: AttendanceEvent = {
      id: `attendance-${Date.now()}`,
      employeeName: selectedAttendanceDealer.name,
      shiftDate: todayIso,
      shiftLabel: selectedAttendanceDealer.shiftLabel,
      shiftStartTime: selectedAttendanceDealer.shiftStartTime,
      shiftEndTime: selectedAttendanceDealer.shiftEndTime,
      eventType: newAttendanceType,
      pslHours: sanitizeAttendancePslHours(newAttendanceType, newAttendancePslHours),
      submittedAt: new Date().toISOString(),
    };

    setStoredAttendanceEvents((prev) => {
      const next = [nextEvent, ...prev];
      saveStoredAttendanceEvents(next);
      return next;
    });

    syncDealerAssignment(
      nextEvent.employeeName,
      nextEvent.shiftLabel,
      nextEvent.eventType,
      nextEvent.pslHours,
    );

    setAttendanceSearch("");
    setSelectedAttendanceDealerId("");
    setNewAttendanceType("call_out_point");
    setNewAttendancePslHours(2);
  }

  function submitScheduleChange() {
    if (!selectedScheduleEntry) {
      return;
    }

    const nextShiftTime = buildShiftTimeRange(scheduleChangeStartLabel);

    if (
      scheduleChangeType === "start_time_change" &&
      getShiftStartLabel(selectedScheduleEntry.shiftTime) === scheduleChangeStartLabel
    ) {
      setScheduleChangeMessage("That dealer already has this start time.");
      return;
    }

    if (selectedScheduleEntry.source === "specialty") {
      const nextEntries = specialtyScheduleEntries.map((entry) =>
        entry.employeeId !== selectedScheduleEntry.employeeId
          ? entry
          : {
              ...entry,
              shiftTime: nextShiftTime,
              status: "scheduled" as const,
            },
      );

      setSpecialtyScheduleEntries(nextEntries);
      saveStoredSpecialtySchedule(todayIso, nextEntries);
      setScheduleChangeMessage(
        scheduleChangeType === "start_time_change"
          ? "Start time updated for today’s schedule."
          : `${selectedScheduleEntry.departmentLabel} added to today’s schedule.`,
      );
      setSelectedScheduleEmployeeId("");
      setScheduleChangeSearch("");
      setScheduleChangeStartLabel(availableScheduleStartOptions[0] ?? SHIFT_START_OPTIONS[0]);
      setScheduleChangeNote("");
      window.setTimeout(() => setScheduleChangeMessage(""), 4000);
      return;
    }

    const nextOverride: ScheduleOverride = {
      id: `schedule-override-${Date.now()}`,
      kind:
        scheduleChangeType === "start_time_change" ? "start_time_change" : "dealer_added",
      employeeName: selectedScheduleEntry.employeeName,
      shiftDate: selectedScheduleEntry.shiftDate,
      previousShiftTime: selectedScheduleEntry.shiftTime,
      nextShiftTime,
      note: scheduleChangeNote.trim() || undefined,
      createdAt: new Date().toISOString(),
      createdBy: "Floor",
      flaggedSixDay: scheduleChangeSixDayFlag,
    };

    const nextOverrides = [nextOverride, ...scheduleOverrides];
    setScheduleOverrides(nextOverrides);
    saveStoredScheduleOverrides(nextOverrides);
    setScheduleChangeMessage(
      scheduleChangeType === "dealer_added"
        ? "Dealer added to today’s schedule."
        : "Start time updated for today’s schedule.",
    );
    setSelectedScheduleEmployeeId("");
    setScheduleChangeSearch("");
    setScheduleChangeStartLabel(availableScheduleStartOptions[0] ?? SHIFT_START_OPTIONS[0]);
    setScheduleChangeNote("");
    window.setTimeout(() => setScheduleChangeMessage(""), 4000);
  }

  const shiftListContent = isClosed ? (
    <div className={styles.casinoClosed}>
      <p className={styles.casinoClosedTitle}>Casino closed</p>
      <p className={styles.casinoClosedSub}>Opens at 10:30 AM</p>
    </div>
  ) : selectedSlot ? (
    (() => {
      const eligible = selectedSlot.dealers.filter(
        (d) => d.status === "unset" || d.status === "late",
      ).length;

      return (
        <div className={styles.floorShiftCard}>
          <div className={styles.floorShiftCardTop}>
            <div className="field-stack">
              <label className="field-label" htmlFor="floor-shift-time-select">
                Shift Time
              </label>
              <select
                id="floor-shift-time-select"
                className={`text-input app-select-input ${styles.shiftTimeSelect}`}
                value={selectedSlot.label}
                onChange={(event) => setSelectedSlotLabel(event.target.value)}
              >
                {slots.map((slot, index) => (
                  <option key={slot.label} value={slot.label}>
                    {slot.label}
                    {` • ${slot.dealers.length} dealer${slot.dealers.length !== 1 ? "s" : ""}`}
                    {index === currentIdx ? " • Current" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.shiftExpandedBody}>
            <ul className={styles.shiftDealerList} role="list">
              {selectedSlot.dealers.map((dealer) => (
                <li key={dealer.id} className={styles.shiftDealerRow}>
                  <div className={styles.shiftDealerAvatar}>{dealer.initials}</div>
                  <div className={styles.shiftDealerMeta}>
                    <span className={styles.shiftDealerName}>{dealer.name}</span>
                    {dealer.status !== "unset" ? (
                      <span className={`badge ${STATUS_BADGE[dealer.status]}`}>
                        {STATUS_LABELS[dealer.status]}
                      </span>
                    ) : null}
                  </div>
                  <div className={styles.shiftMarkBtns}>
                    <button
                      type="button"
                      className={cx(
                        styles.shiftMarkBtn,
                        styles.shiftMarkBtnLate,
                        dealer.status === "late" && styles.shiftMarkBtnLateActive,
                      )}
                      onClick={() =>
                        markDealer(selectedSlotIdx, dealer.id, toggle(dealer.status, "late"))
                      }
                    >
                      Late
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className={styles.shiftRandomizeBar}>
              <span className={styles.shiftRandomizeLabel}>{eligible} in the draw</span>
              <button
                type="button"
                className={styles.shiftLineupBtn}
                onClick={() => handleRandomize(selectedSlotIdx)}
                disabled={eligible === 0}
              >
                <Shuffle size={13} aria-hidden="true" />
                Randomize
              </button>
            </div>
          </div>
        </div>
      );
    })()
  ) : null;

  return (
    <>
      <main className={styles.floorContent}>
        <div className={styles.floorNowLayout}>
          <div className={styles.floorDesktopGrid}>
            <div className={styles.floorTopGrid}>
              <div
                className={`${styles.floorSection} ${styles.floorSectionDrenched} ${styles.floorTopCard}`}
              >
                <div className={`${styles.floorSectionHeader} ${styles.floorSectionHeaderDrenched}`}>
                  <div>
                    <p className={`${styles.floorSectionTitle} ${styles.floorSectionTitleDrenched}`}>{dayLabel}</p>
                    <p className={`${styles.floorSectionSubtitle} ${styles.floorSectionSubtitleDrenched}`}>
                      {dateLabel}
                    </p>
                  </div>
                </div>
	              <div
                  className={`${styles.floorSectionBody} ${styles.floorScheduleBody} ${styles.floorScheduleBodyScrollable} ${styles.floorTopCardBody}`}
                >
	                  {shiftListContent}
	                </div>
		              </div>
	              <div
                  className={`${styles.floorSection} ${styles.floorSectionDrenched} ${styles.floorTopCard}`}
                >
                <div className={`${styles.floorSectionHeader} ${styles.floorSectionHeaderDrenched}`}>
                  <div>
                    <p className={`${styles.floorSectionTitle} ${styles.floorSectionTitleDrenched}`}>Attendance Reports</p>
                    <p className={`${styles.floorSectionSubtitle} ${styles.floorSectionSubtitleDrenched}`}>
                      Search today&apos;s scheduled dealers, floor, and chip runners and log leave-early changes.
                    </p>
                  </div>
                </div>
                <div className={`${styles.floorSectionBody} ${styles.floorTopCardBody}`}>
                  <div className={styles.floorAttendanceCreate}>
                    <div className="field-stack">
                      <label className="field-label" htmlFor="attendance-search">
                        Search Scheduled Team Members
                      </label>
                      <input
                        id="attendance-search"
                        className="text-input"
                        type="text"
                        value={attendanceSearch}
                        onChange={(event) => {
                          setAttendanceSearch(event.target.value);
                          setSelectedAttendanceDealerId("");
                        }}
                        placeholder="Start typing a name"
                        autoComplete="off"
                      />
                    </div>
                    {attendanceSearch.trim() ? (
                      <div className={styles.floorAttendanceSearchResults}>
                        {filteredScheduledDealers.length === 0 ? (
                          <div className={styles.floorAttendanceNoResults}>
                            No scheduled team members match that search.
                          </div>
                        ) : (
                          filteredScheduledDealers.map((dealer) => (
                            <button
                              key={dealer.id}
                              type="button"
                              className={cx(
                                styles.floorAttendanceResult,
                                selectedAttendanceDealerId === dealer.id &&
                                  styles.floorAttendanceResultActive,
                              )}
                              onClick={() => {
                                setSelectedAttendanceDealerId(dealer.id);
                                setAttendanceSearch(dealer.name);
                              }}
                            >
                              <span className={styles.floorAttendanceResultName}>
                                {dealer.name}
                              </span>
                              <span className={styles.floorAttendanceResultMeta}>
                                {dealer.departmentLabel} · {dealer.shiftStartTime} - {dealer.shiftEndTime}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    ) : null}
                    <div className={styles.floorAttendanceCreateGrid}>
                      <div className="field-stack">
                        <span className="field-label">Attendance Type</span>
                        <div className={styles.floorAttendanceTypeRow}>
                          <button
                            type="button"
                            className={cx(
                              styles.floorPill,
                              styles.floorAttendanceChip,
                              newAttendanceType === "call_out_point" &&
                                styles.floorPillActive,
                            )}
                            onClick={() => setNewAttendanceType("call_out_point")}
                          >
                            Call Out - 1 Point
                          </button>
                          <button
                            type="button"
                            className={cx(
                              styles.floorPill,
                              styles.floorAttendanceChip,
                              newAttendanceType === "half_point" &&
                                styles.floorPillHalfPointActive,
                            )}
                            onClick={() => setNewAttendanceType("half_point")}
                          >
                            Half Point
                          </button>
                          <button
                            type="button"
                            className={cx(
                              styles.floorPill,
                              styles.floorAttendanceChip,
                              newAttendanceType === "psl_leave_early" &&
                                styles.floorPillActive,
                            )}
                            onClick={() => setNewAttendanceType("psl_leave_early")}
                          >
                            PSL Leave Early
                          </button>
                        </div>
                      </div>
                      {getAllowedPslHours(newAttendanceType).length > 0 ? (
                        <div className={`field-stack ${styles.floorAttendanceHoursField}`}>
                          <label className="field-label" htmlFor="attendance-psl-hours">
                            PSL Hours
                          </label>
                          <select
                            id="attendance-psl-hours"
                            className={`text-input app-select-input ${styles.floorAttendanceHoursInput}`}
                            value={newAttendancePslHours}
                            onChange={(event) =>
                              setNewAttendancePslHours(
                                Number(event.target.value) as AttendancePslHours,
                              )
                            }
                          >
                            {getAllowedPslHours(newAttendanceType).map((hours) => (
                              <option key={hours} value={hours}>
                                {hours} Hours
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className={`primary-button ${styles.floorAttendanceSubmit}`}
                      disabled={!selectedAttendanceDealer}
                      onClick={submitFloorAttendance}
                    >
                      Add Attendance Entry
                    </button>
                  </div>
                  <div className={styles.floorAttendanceFilterRow}>
                    <button
                      type="button"
                      className={cx(
                        styles.floorPill,
                        styles.floorAttendanceFilterPill,
                        attendanceLogFilter === "all" && styles.floorPillActive,
                      )}
                      onClick={() => setAttendanceLogFilter("all")}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={cx(
                        styles.floorPill,
                        styles.floorAttendanceFilterPill,
                        attendanceLogFilter === "points" && styles.floorPillActive,
                      )}
                      onClick={() => setAttendanceLogFilter("points")}
                    >
                      Points
                    </button>
                    <button
                      type="button"
                      className={cx(
                        styles.floorPill,
                        styles.floorAttendanceFilterPill,
                        attendanceLogFilter === "psl" && styles.floorPillActive,
                      )}
                      onClick={() => setAttendanceLogFilter("psl")}
                    >
                      PSL
                    </button>
                  </div>
                  <div className={styles.floorAttendanceReportCard}>
                    {filteredDealerAttendanceEvents.length === 0 ? (
                      <div className={styles.floorAttendanceEmptyState}>
                        <p className="mini-title" style={{ marginBottom: 6 }}>
                          {dealerAttendanceEvents.length === 0
                            ? "No attendance reports yet"
                            : "No matching attendance reports"}
                        </p>
                        <p className="mini-copy">
                          {dealerAttendanceEvents.length === 0
                            ? "New floor attendance edits will appear here for admin reporting."
                            : "Try a different attendance filter to see more reports."}
                        </p>
                      </div>
                    ) : (
                      <div className={styles.floorAttendanceAlertList}>
                        {filteredDealerAttendanceEvents.map((event) => (
                          <div key={event.id} className={styles.floorAttendanceEditor}>
                            <div className={styles.floorAttendanceEditorTop}>
                              <div>
                                <p className={styles.floorAttendanceEditorName}>{event.employeeName}</p>
                                <p className={styles.floorAttendanceEditorMeta}>
                                  {event.shiftStartTime} · {getAttendanceActionLabel(event)}
                                  {event.pslHours ? ` · ${event.pslHours} Hours` : ""}
                                </p>
                              </div>
                              <div className={styles.floorAttendanceEditorActions}>
                                <button
                                  type="button"
                                  className={`${styles.floorAttendanceDismiss} ${styles.floorAttendanceEdit}`}
                                  aria-label={`Edit ${event.employeeName} attendance report`}
                                  onClick={() => {
                                    setPendingEditEventId(event.id);
                                    setEditAttendanceType(event.eventType);
                                    setEditAttendancePslHours(
                                      sanitizeAttendancePslHours(
                                        event.eventType,
                                        event.pslHours,
                                      ) ?? 2,
                                    );
                                  }}
                                >
                                  <Pencil size={14} aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  className={styles.floorAttendanceDismiss}
                                  aria-label={`Remove ${event.employeeName} attendance report`}
                                  onClick={() => setPendingClearEventId(event.id)}
                                >
                                  <X size={14} aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
	              </div>
              </div>
              <div className={styles.floorFullStack}>
	              <div className={`${styles.floorSection} ${styles.floorSectionDrenched} ${styles.floorGiveawayRail}`}>
                <div className={`${styles.floorSectionHeader} ${styles.floorSectionHeaderDrenched}`}>
                  <div>
                    <p className={`${styles.floorSectionTitle} ${styles.floorSectionTitleDrenched}`}>Shift Exchanges</p>
                    <p className={`${styles.floorSectionSubtitle} ${styles.floorSectionSubtitleDrenched}`}>
                      Pending shift exchange requests from dealers.
                    </p>
                  </div>
                </div>
                <div className={`${styles.floorSectionBody} ${styles.floorGiveawayRailBody}`}>
                  {pendingGiveawayRequests.length === 0 ? (
                    <div className={styles.floorGiveawayEmpty}>
                      <p className="mini-title" style={{ marginBottom: 6 }}>
                        No shift exchange requests yet
                      </p>
                      <p className="mini-copy">
                        New shift exchange requests will appear here for the floor to review.
                      </p>
                    </div>
                  ) : (
                    <div className={styles.floorGiveawayList}>
                      {pendingGiveawayRequests.map((request) => (
                        <div key={request.id} className={styles.floorGiveawayCard}>
                          <div className={styles.floorGiveawayTop}>
                            <div>
                              <p className={styles.floorGiveawayTitle}>
                                {request.requesterName} → {request.targetDealerName}
                              </p>
                              <p className={styles.floorGiveawayMeta}>
                                {SHIFT_REQUEST_KIND_LABELS[request.requestKind]} · {request.shiftDayLabel} · {request.requesterShiftTime}
                              </p>
                            </div>
                            <span className="badge warning">Pending</span>
                          </div>
                          <p className={styles.floorGiveawayCopy}>
                            {request.requestKind === "switch" ? "Requested switch: " : "Target dealer: "}
                            {request.targetDealerStatus === "off" ? "Off that day" : request.targetDealerShiftTime}
                          </p>
                          {request.validationSnapshot.targetDealerAlreadyAtSixDays ? (
                            <p className={styles.floorGiveawayFlag}>
                              Red flag: {request.targetDealerName} is already scheduled for six days this
                              week.
                            </p>
                          ) : null}
                          <div className={styles.floorGiveawayActions}>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => updateFloorGiveawayRequest(request.id, "denied")}
                            >
                              Deny
                            </button>
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() => updateFloorGiveawayRequest(request.id, "approved")}
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={`${styles.floorSection} ${styles.floorSectionDrenched}`}>
                <div className={`${styles.floorSectionHeader} ${styles.floorSectionHeaderDrenched}`}>
                  <div>
                    <p className={`${styles.floorSectionTitle} ${styles.floorSectionTitleDrenched}`}>Schedule Adjustments</p>
                    <p className={`${styles.floorSectionSubtitle} ${styles.floorSectionSubtitleDrenched}`}>
                      Change a start time or add a dealer, floor, or chip runner to today&apos;s lineup.
                    </p>
                  </div>
                </div>
                <div className={`${styles.floorSectionBody} ${styles.floorScheduleChangeBody}`}>
                  <div className={`${styles.floorAttendanceCreate} ${styles.floorScheduleChangeForm}`}>
                    <div className="field-stack">
                      <span className="field-label">Change Type</span>
                      <div className={styles.floorScheduleChangeTypeRow}>
                        <button
                          type="button"
                          className={cx(
                            styles.floorPill,
                            styles.floorScheduleChangePill,
                            scheduleChangeType === "start_time_change" && styles.floorPillActive,
                          )}
                          onClick={() => setScheduleChangeType("start_time_change")}
                        >
                          Change Start Time
                        </button>
                        <button
                          type="button"
                          className={cx(
                            styles.floorPill,
                            styles.floorScheduleChangePill,
                            scheduleChangeType === "dealer_added" && styles.floorPillActive,
                          )}
                          onClick={() => setScheduleChangeType("dealer_added")}
                        >
                          Add Dealer
                        </button>
                        <button
                          type="button"
                          className={cx(
                            styles.floorPill,
                            styles.floorScheduleChangePill,
                            scheduleChangeType === "floor_added" && styles.floorPillActive,
                          )}
                          onClick={() => setScheduleChangeType("floor_added")}
                        >
                          Add Floor
                        </button>
                        <button
                          type="button"
                          className={cx(
                            styles.floorPill,
                            styles.floorScheduleChangePill,
                            scheduleChangeType === "chip_runner_added" && styles.floorPillActive,
                          )}
                          onClick={() => setScheduleChangeType("chip_runner_added")}
                        >
                          Add Chip Runner
                        </button>
                      </div>
                    </div>
                    <div className="field-stack">
                      <label className="field-label" htmlFor="schedule-change-start">
                        {scheduleChangeType === "start_time_change" ? "New Start Time" : "Shift Time"}
                      </label>
                      <select
                        id="schedule-change-start"
                        className="text-input app-select-input"
                        value={scheduleChangeStartLabel}
                        onChange={(event) =>
                          setScheduleChangeStartLabel(
                            event.target.value as (typeof SHIFT_START_OPTIONS)[number],
                          )
                        }
                      >
                        {availableScheduleStartOptions.map((label) => (
                          <option key={label} value={label}>
                            {formatShiftStartOptionLabel(label)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-stack">
                      <label className="field-label" htmlFor="schedule-change-search">
                        {scheduleChangeType === "start_time_change"
                          ? "Search Scheduled Team Members"
                          : scheduleChangeType === "dealer_added"
                            ? "Search Available Dealers"
                            : scheduleChangeType === "floor_added"
                              ? "Search Available Floor"
                              : "Search Available Chip Runners"}
                      </label>
                      <input
                        id="schedule-change-search"
                        className="text-input"
                        type="text"
                        value={scheduleChangeSearch}
                        onChange={(event) => {
                          setScheduleChangeSearch(event.target.value);
                          setSelectedScheduleEmployeeId("");
                        }}
                        placeholder={
                          scheduleChangeType === "start_time_change"
                            ? "Start typing a scheduled team member"
                            : scheduleChangeType === "dealer_added"
                              ? "Start typing an available dealer"
                              : scheduleChangeType === "floor_added"
                                ? "Start typing an available floor team member"
                                : "Start typing an available chip runner"
                        }
                        autoComplete="off"
                      />
                    </div>

                    {scheduleChangeSearch.trim() ? (
                      <div className={styles.floorScheduleChangeResults}>
                        {filteredScheduleChangeCandidates.length === 0 ? (
                          <div className={styles.floorAttendanceNoResults}>
                            {scheduleChangeType === "start_time_change"
                              ? "No scheduled team members match that search."
                              : scheduleChangeType === "dealer_added"
                                ? "No eligible off-day dealers match that search."
                                : scheduleChangeType === "floor_added"
                                  ? "No eligible off-day floor team members match that search."
                                  : "No eligible off-day chip runners match that search."}
                          </div>
                        ) : (
                          filteredScheduleChangeCandidates.map((entry) => (
                            <button
                              key={entry.id}
                              type="button"
                              className={cx(
                                styles.floorAttendanceResult,
                                selectedScheduleEmployeeId === entry.employeeId &&
                                  styles.floorAttendanceResultActive,
                              )}
                              onClick={() => {
                                setSelectedScheduleEmployeeId(entry.employeeId);
                                setScheduleChangeSearch(entry.employeeName);
                              }}
                            >
                              <span className={styles.floorAttendanceResultName}>
                                {entry.employeeName}
                              </span>
                              <span className={styles.floorAttendanceResultMeta}>
                                {entry.departmentLabel} · {entry.shiftTime === "OFF" ? "Off today" : entry.shiftTime}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    ) : null}

                    {selectedScheduleEntry ? (
                      <p className={styles.floorScheduleChangeMeta}>
                        {scheduleChangeType !== "start_time_change"
                          ? `Current status: ${selectedScheduleEntry.shiftTime}`
                          : `Current shift: ${selectedScheduleEntry.shiftTime}`}
                      </p>
                    ) : null}

                    {scheduleChangeSixDayFlag ? (
                      <p className={styles.floorGiveawayFlag}>
                        Red flag: this change would put this dealer at six scheduled days this week.
                      </p>
                    ) : null}

                    <div className="field-stack">
                      <label className="field-label" htmlFor="schedule-change-note">
                        Note
                      </label>
                      <textarea
                        id="schedule-change-note"
                        className={`text-input ${styles.floorScheduleChangeNote}`}
                        rows={3}
                        value={scheduleChangeNote}
                        onChange={(event) => setScheduleChangeNote(event.target.value)}
                        placeholder="Add a quick note for admin and the team member."
                        style={{ resize: "vertical" }}
                      />
                    </div>

                    <button
                      type="button"
                      className={`primary-button ${styles.floorScheduleChangeSubmit}`}
                      disabled={!selectedScheduleEntry}
                      onClick={submitScheduleChange}
                    >
                      {SCHEDULE_ADJUSTMENT_LABELS[scheduleChangeType]}
                    </button>

                    {scheduleChangeMessage ? (
                      <p className={styles.floorScheduleChangeMeta}>{scheduleChangeMessage}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Lineup modal ── */}
      {lineup && (
        <LineupModal
          lineup={lineup}
          onClose={() => setLineup(null)}
          onReshuffle={() => handleRandomize(lineupSlotIdx)}
        />
      )}

      {pendingClearEvent && (
        <div
          className={styles.lineupOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-clear-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPendingClearEventId(null);
            }
          }}
        >
          <div className={styles.lineupModal}>
            <div className={styles.lineupModalHeader}>
              <div className={styles.lineupModalHeaderLeft}>
                <h2 className={styles.lineupModalTitle} id="attendance-clear-title">
                  Remove Attendance Report
                </h2>
                <p className={styles.lineupModalMeta}>
                  This will remove the attendance report for {pendingClearEvent.employeeName}.
                </p>
              </div>
            </div>
            <div className={styles.lineupModalBody}>
              <p className={styles.confirmModalCopy}>
                Are you sure you want to remove this attendance report? This action will also remove
                it from the admin daily attendance report.
              </p>
            </div>
            <div className={styles.confirmModalFooter}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPendingClearEventId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  clearAttendanceEvent(pendingClearEvent.id);
                  setPendingClearEventId(null);
                }}
              >
                Remove Report
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingEditEvent && (
        <div
          className={styles.lineupOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-edit-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPendingEditEventId(null);
            }
          }}
        >
          <div className={styles.lineupModal}>
            <div className={styles.lineupModalHeader}>
              <div className={styles.lineupModalHeaderLeft}>
                <h2 className={styles.lineupModalTitle} id="attendance-edit-title">
                  Edit Attendance Report
                </h2>
                <p className={styles.lineupModalMeta}>
                  Update the attendance report for {pendingEditEvent.employeeName}.
                </p>
              </div>
            </div>
            <div className={styles.lineupModalBody}>
              <div className="field-stack">
                <span className="field-label">Attendance Type</span>
                <div className={styles.floorAttendanceTypeRow}>
                  <button
                    type="button"
                    className={cx(
                      styles.floorPill,
                      styles.floorAttendanceChip,
                      editAttendanceType === "call_out_point" && styles.floorPillActive,
                    )}
                    onClick={() => setEditAttendanceType("call_out_point")}
                  >
                    Call Out - 1 Point
                  </button>
                  <button
                    type="button"
                    className={cx(
                      styles.floorPill,
                      styles.floorAttendanceChip,
                      editAttendanceType === "call_out_psl" && styles.floorPillActive,
                    )}
                    onClick={() => setEditAttendanceType("call_out_psl")}
                  >
                    PSL
                  </button>
                  <button
                    type="button"
                    className={cx(
                      styles.floorPill,
                      styles.floorAttendanceChip,
                      editAttendanceType === "reverse_psl" && styles.floorPillActive,
                    )}
                    onClick={() => setEditAttendanceType("reverse_psl")}
                  >
                    Reverse PSL
                  </button>
                  <button
                    type="button"
                    className={cx(
                      styles.floorPill,
                      styles.floorAttendanceChip,
                      editAttendanceType === "half_point" &&
                        styles.floorPillHalfPointActive,
                    )}
                    onClick={() => setEditAttendanceType("half_point")}
                  >
                    Half Point
                  </button>
                  <button
                    type="button"
                    className={cx(
                      styles.floorPill,
                      styles.floorAttendanceChip,
                      editAttendanceType === "psl_leave_early" && styles.floorPillActive,
                    )}
                    onClick={() => setEditAttendanceType("psl_leave_early")}
                  >
                    PSL Leave Early
                  </button>
                </div>
              </div>
              {getAllowedPslHours(editAttendanceType).length > 0 && (
                <div className={`field-stack ${styles.floorAttendanceModalHoursField}`}>
                  <label className="field-label" htmlFor="attendance-edit-psl-hours">
                    PSL Hours
                  </label>
                  <select
                    id="attendance-edit-psl-hours"
                    className={`text-input app-select-input ${styles.floorAttendanceHoursInput}`}
                    value={editAttendancePslHours}
                    onChange={(event) =>
                      setEditAttendancePslHours(
                        Number(event.target.value) as AttendancePslHours,
                      )
                    }
                  >
                    {getAllowedPslHours(editAttendanceType).map((hours) => (
                      <option key={hours} value={hours}>
                        {hours} Hours
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className={styles.confirmModalFooter}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPendingEditEventId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  updateAttendanceEvent(
                    pendingEditEvent.id,
                    editAttendanceType,
                    sanitizeAttendancePslHours(
                      editAttendanceType,
                      editAttendancePslHours,
                    ),
                  );
                  setPendingEditEventId(null);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function toIsoDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
    .toISOString()
    .slice(0, 10);
}

function createShiftSlotsForDate(
  entries: ScheduleEntry[],
  shiftDate: string,
  isSunday: boolean,
) {
  // Sunday: casino opens 10:30 AM, so first shift is 12 PM.
  // Last shift is 12 AM (runs until casino closes at 2 AM Monday).
  const templates = isSunday
    ? SHIFT_TEMPLATES.filter((slot) => slot.hour === 0 || slot.hour >= 12)
    : SHIFT_TEMPLATES;

  return templates.map((template) => {
    const dealers = entries
      .filter(
        (entry) =>
          entry.shiftDate === shiftDate &&
          entry.status === "scheduled" &&
          getShiftStartLabel(entry.shiftTime) === template.label,
      )
      .sort(
        (a, b) =>
          (a.sourceOrder ?? Number.MAX_SAFE_INTEGER) - (b.sourceOrder ?? Number.MAX_SAFE_INTEGER),
      )
      .map((entry) => createDealerEntry(entry.employeeName, template.label, shiftDate));

    return {
      label: template.label,
      hour: template.hour,
      dealers,
    };
  });
}

function mergeShiftSlots(nextSlots: ShiftSlot[], previousSlots: ShiftSlot[]) {
  const previousStatusByName = new Map(
    previousSlots.flatMap((slot) =>
      slot.dealers.map((dealer) => [dealer.name, dealer.status] as const),
    ),
  );

  return nextSlots.map((slot) => ({
    ...slot,
    dealers: slot.dealers.map((dealer) => ({
      ...dealer,
      status: previousStatusByName.get(dealer.name) ?? dealer.status,
    })),
  }));
}

function createDealerEntry(
  name: string,
  shiftLabel: string,
  shiftDate: string,
): DealerEntry {
  return {
    id: `${shiftDate}-${shiftLabel}-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    initials: getInitials(name),
    status: "unset",
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getShiftEndLabel(startLabel: string) {
  const [timePart, meridiem] = startLabel.split(" ");
  const [rawHour, rawMinute] = timePart.split(":").map(Number);
  let hour = rawHour % 12;
  const minute = Number.isFinite(rawMinute) ? rawMinute : 0;

  if (meridiem === "PM") {
    hour += 12;
  }

  const start = new Date(2026, 0, 1, hour, minute, 0, 0);
  const end = new Date(start.getTime() + (8 * 60 + 15) * 60 * 1000);
  const endHour = end.getHours();
  const period = endHour >= 12 ? "PM" : "AM";
  const normalizedHour = endHour % 12 || 12;

  return `${normalizedHour} ${period}`;
}

function getAttendanceActionLabel(event: AttendanceEvent) {
  if (event.eventType === "call_out_point") {
    return "Full Point";
  }

  if (event.eventType === "call_out_psl") {
    return "PSL";
  }

  if (event.eventType === "reverse_psl") {
    return "Reverse PSL";
  }

  if (event.eventType === "half_point") {
    return "Half Point";
  }

  return "PSL Leave Early";
}
