"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  LoaderCircle,
  Shuffle,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
type AttendanceStatus = "unset" | "late" | "absent" | "callout";

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

// ─── Demo data (replaced by DB later) ────────────────────────
const ALL_SHIFTS: ShiftSlot[] = [
  {
    label: "8 AM", hour: 8,
    dealers: [
      { id: "s1-1", name: "Tom Hall",    initials: "TH", status: "unset" },
      { id: "s1-2", name: "Wendy Park",  initials: "WP", status: "unset" },
      { id: "s1-3", name: "Ray Singh",   initials: "RS", status: "late"  },
    ],
  },
  {
    label: "10 AM", hour: 10,
    dealers: [
      { id: "s2-1", name: "Susan Tran",  initials: "ST", status: "unset"   },
      { id: "s2-2", name: "Marcus Webb", initials: "MW", status: "callout" },
    ],
  },
  {
    label: "12 PM", hour: 12,
    dealers: [
      { id: "s3-1", name: "Priya Nair",   initials: "PN", status: "unset"  },
      { id: "s3-2", name: "David Kim",    initials: "DK", status: "unset"  },
      { id: "s3-3", name: "Angela Fox",   initials: "AF", status: "unset"  },
      { id: "s3-4", name: "Terrence Yeo", initials: "TY", status: "absent" },
    ],
  },
  {
    label: "2 PM", hour: 14,
    dealers: [
      { id: "s4-1", name: "Carlos Ruiz",  initials: "CR", status: "unset" },
      { id: "s4-2", name: "Linda Ho",     initials: "LH", status: "unset" },
      { id: "s4-3", name: "James Okafor", initials: "JO", status: "late"  },
    ],
  },
  {
    label: "4 PM", hour: 16,
    dealers: [
      { id: "s5-1", name: "Nina Patel", initials: "NP", status: "unset" },
      { id: "s5-2", name: "Eric Lam",   initials: "EL", status: "unset" },
    ],
  },
  {
    label: "6 PM", hour: 18,
    dealers: [
      { id: "s6-1", name: "Jasmine Cole", initials: "JC", status: "unset"   },
      { id: "s6-2", name: "Patrick Liu",  initials: "PL", status: "unset"   },
      { id: "s6-3", name: "Sarah Moon",   initials: "SM", status: "callout" },
    ],
  },
  {
    label: "8 PM", hour: 20,
    dealers: [
      { id: "s7-1", name: "Derek Nash",   initials: "DN", status: "unset" },
      { id: "s7-2", name: "Tanya Flores", initials: "TF", status: "unset" },
    ],
  },
  {
    label: "10 PM", hour: 22,
    dealers: [
      { id: "s8-1", name: "Kai Yamamoto", initials: "KY", status: "unset" },
      { id: "s8-2", name: "Dana Reed",    initials: "DR", status: "unset" },
    ],
  },
  {
    label: "12 AM", hour: 0,
    dealers: [
      { id: "s9-1", name: "Brianna Cross", initials: "BC", status: "unset" },
      { id: "s9-2", name: "Miles Ford",    initials: "MF", status: "unset" },
    ],
  },
];

// ─── Display maps ─────────────────────────────────────────────
const STATUS_LABELS: Record<AttendanceStatus, string> = {
  unset:   "Unmarked",
  late:    "Late",
  absent:  "Absent",
  callout: "Called off",
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

function getCurrentTimeMinutes(now: Date): number {
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const hourMinutes = hour * 60 + minutes;

  return hour < 8 ? hourMinutes + 24 * 60 : hourMinutes;
}

function getShiftStartMinutes(hour: number): number {
  return shiftOrder(hour) * 60;
}

function getCurrentShiftIdx(slots: ShiftSlot[], currentMinutes: number): number {
  for (let i = 0; i < slots.length; i++) {
    if (getShiftStartMinutes(slots[i].hour) > currentMinutes) return i;
  }
  return -1;
}

function getActiveShiftIdx(slots: ShiftSlot[], currentMinutes: number): number {
  let idx = -1;
  for (let i = 0; i < slots.length; i++) {
    if (getShiftStartMinutes(slots[i].hour) <= currentMinutes) idx = i;
  }
  return idx;
}

function toggle(current: AttendanceStatus, next: AttendanceStatus): AttendanceStatus {
  return current === next ? "unset" : next;
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
    const text = lineup.names.map((n, i) => `${i + 1}. ${n}`).join("\n");
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
      className="lineup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lineup-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="lineup-modal">

        {/* ── Header ── */}
        <div className="lineup-modal-header">
          <div className="lineup-modal-header-left">
            <h2 className="lineup-modal-title" id="lineup-modal-title">
              Table Draw
            </h2>
            <p className="lineup-modal-shift-label">{lineup.slotLabel}</p>
            {!lineup.isShuffling && (
              <p className="lineup-modal-meta">
                {lineup.names.length} dealer{lineup.names.length !== 1 ? "s" : ""} · {sourceLabel}
              </p>
            )}
          </div>
          <button
            className="lineup-modal-close"
            onClick={onClose}
            type="button"
            aria-label="Close draw"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="lineup-modal-body">
          {lineup.isShuffling ? (
            <div className="lineup-modal-loading">
              <LoaderCircle className="spin-icon" size={18} aria-hidden="true" />
              Running draw via random.org…
            </div>
          ) : (
            <ol className="lineup-modal-names" role="list">
              {lineup.names.map((name, i) => (
                <li key={i} className="lineup-modal-name-item">
                  <span className="lineup-modal-num">{i + 1}</span>
                  <span className="lineup-modal-name">{name}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* ── Footer actions ── */}
        {!lineup.isShuffling && (
          <div className="lineup-modal-footer">
            <button
              type="button"
              className={`lineup-modal-copy${copied ? " copied" : ""}`}
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
              className="lineup-modal-reshuffle"
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
  const dow       = now.getDay();
  const isSunday  = dow === 0;
  const dayLabel  = DAY_NAMES[dow];
  const dateLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
  const currentMinutes = getCurrentTimeMinutes(now);

  const baseSlots = useMemo(
    () => isSunday ? ALL_SHIFTS.filter((s) => s.hour !== 0 && s.hour <= 18) : ALL_SHIFTS,
    [isSunday]
  );

  const [slots, setSlots]       = useState<ShiftSlot[]>(baseSlots);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [lineup, setLineup]     = useState<LineupState | null>(null);
  // slotIdx the lineup belongs to, so we can reshuffle with fresh dealer statuses
  const [lineupSlotIdx, setLineupSlotIdx] = useState<number>(-1);

  const currentIdx = useMemo(() => getCurrentShiftIdx(slots, currentMinutes), [slots, currentMinutes]);
  const activeShiftIdx = useMemo(() => getActiveShiftIdx(slots, currentMinutes), [slots, currentMinutes]);

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

  // Day stats
  const allDealers = slots.flatMap((s) => s.dealers);
  const lateTotal  = allDealers.filter((d) => d.status === "late").length;
  const calledOutTotal = allDealers.filter((d) => d.status === "callout").length;
  const activeShiftDealers =
    activeShiftIdx >= 0
      ? slots[activeShiftIdx].dealers.filter((d) => d.status !== "absent" && d.status !== "callout").length
      : 0;

  return (
    <>
      <main className="floor-content">
        <div className="floor-now-layout">

          {/* ── Day header ── */}
          <div className="floor-day-header">
            <h1 className="floor-day-title">{dayLabel}, {dateLabel}</h1>
            <div className="floor-stat-strip floor-day-stats">
              <div className="floor-stat">
                <p className={`floor-stat-value${lateTotal > 0 ? " warn" : ""}`}>{lateTotal}</p>
                <p className="floor-stat-label">Late</p>
              </div>
              <div className="floor-stat">
                <p className={`floor-stat-value${calledOutTotal > 0 ? " alert" : ""}`}>{calledOutTotal}</p>
                <p className="floor-stat-label">Called Out</p>
              </div>
              <div className="floor-stat">
                <p className="floor-stat-value">{activeShiftDealers}</p>
                <p className="floor-stat-label">On Shift</p>
              </div>
            </div>
          </div>

          {/* ── Shift timeline ── */}
          <div className="floor-shift-list">
            {slots.map((slot, si) => {
              const shiftStartMinutes = getShiftStartMinutes(slot.hour);
              const isPast     = shiftStartMinutes <= currentMinutes;
              const isCurrent  = si === currentIdx;
              const isExpanded = expanded === si;
              const shiftLate  = slot.dealers.filter((d) => d.status === "late").length;
              const shiftOut   = slot.dealers.filter((d) => d.status === "absent" || d.status === "callout").length;
              const eligible   = slot.dealers.filter((d) => d.status === "unset" || d.status === "late").length;

              return (
                <div
                  key={slot.label}
                  className={[
                    "shift-slot-card",
                    isCurrent ? "shift-current" : "",
                    isPast    ? "shift-past"    : "",
                  ].filter(Boolean).join(" ")}
                >
                  {/* Collapsed row */}
                  <button
                    className="shift-slot-header"
                    onClick={() => setExpanded(isExpanded ? null : si)}
                    type="button"
                    aria-expanded={isExpanded}
                  >
                    <div className="shift-time-col">
                      <span className="shift-time-label">{slot.label}</span>
                      {isCurrent && <span className="shift-now-pip" aria-hidden="true" />}
                    </div>
                    <div className="shift-summary">
                      <span className="shift-dealer-count">
                        {slot.dealers.length} dealer{slot.dealers.length !== 1 ? "s" : ""}
                      </span>
                      {(shiftLate > 0 || shiftOut > 0) && (
                        <span className="shift-issue-badges">
                          {shiftLate > 0 && <span className="badge warning">{shiftLate} late</span>}
                          {shiftOut  > 0 && <span className="badge danger">{shiftOut} out</span>}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`shift-chevron${isExpanded ? " open" : ""}`}
                      size={16}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Expanded: dealer list + randomize button */}
                  {isExpanded && (
                    <>
                      <ul className="shift-dealer-list" role="list">
                        {slot.dealers.map((dealer) => (
                          <li key={dealer.id} className="shift-dealer-row">
                            <div className="roster-avatar shift-dealer-avatar">
                              {dealer.initials}
                            </div>
                            <div className="shift-dealer-meta">
                              <span className="shift-dealer-name">{dealer.name}</span>
                              {dealer.status !== "unset" && (
                                <span className={`badge ${STATUS_BADGE[dealer.status]}`}>
                                  {STATUS_LABELS[dealer.status]}
                                </span>
                              )}
                            </div>
                            <div className="shift-mark-btns">
                              <button type="button"
                                className={`shift-mark-btn late${dealer.status === "late" ? " active" : ""}`}
                                onClick={() => markDealer(si, dealer.id, toggle(dealer.status, "late"))}>
                                Late
                              </button>
                              <button type="button"
                                className={`shift-mark-btn absent${dealer.status === "absent" ? " active" : ""}`}
                                onClick={() => markDealer(si, dealer.id, toggle(dealer.status, "absent"))}>
                                Absent
                              </button>
                              <button type="button"
                                className={`shift-mark-btn callout${dealer.status === "callout" ? " active" : ""}`}
                                onClick={() => markDealer(si, dealer.id, toggle(dealer.status, "callout"))}>
                                Called off
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* Randomize footer */}
                      <div className="shift-randomize-bar">
                        <span className="shift-randomize-label">
                          {eligible} in the draw
                        </span>
                        <button
                          type="button"
                          className="shift-lineup-btn"
                          onClick={() => handleRandomize(si)}
                          disabled={eligible === 0}
                        >
                          <Shuffle size={13} aria-hidden="true" />
                          Randomize
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
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
    </>
  );
}
