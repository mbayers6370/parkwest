import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Placeholder weeks — will pull from schedule API once DB is live
const SCHEDULE_ROWS = [
  { date: "Sat Apr 12", dayShort: "Sat", shiftTime: "10:00 AM – 6:00 PM", dept: "Dealers Floor", status: "scheduled" },
  { date: "Sun Apr 13", dayShort: "Sun", shiftTime: "OFF", dept: "", status: "off" },
  { date: "Mon Apr 14", dayShort: "Mon", shiftTime: "2:00 – 10:00 PM", dept: "Dealers Floor", status: "scheduled" },
  { date: "Tue Apr 15", dayShort: "Tue", shiftTime: "2:00 – 10:00 PM", dept: "Dealers Floor", status: "scheduled" },
  { date: "Wed Apr 16", dayShort: "Wed", shiftTime: "OFF", dept: "", status: "off" },
  { date: "Thu Apr 17", dayShort: "Thu", shiftTime: "OFF", dept: "", status: "off" },
  { date: "Fri Apr 18", dayShort: "Fri", shiftTime: "10:00 AM – 6:00 PM", dept: "Dealers Floor", status: "scheduled" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Scheduled", cls: "success" },
  off: { label: "OFF", cls: "warning" },
  pto: { label: "PTO", cls: "gold" },
  ro: { label: "RO", cls: "gold" },
  psl: { label: "PSL", cls: "gold" },
};

export default function PersonalSchedulePage() {
  return (
    <main className="personal-content">

      {/* ── Mobile: card per day ── */}
      <div className="personal-col-main schedule-page-main">

        {/* Week header card */}
        <div className="p-card schedule-week-header-card">
          <div className="p-card-header">
            <div>
              <p className="p-card-title">Week of April 12</p>
            </div>
            <div className="schedule-week-nav">
              <button className="secondary-button schedule-week-nav-button" type="button">
                <ChevronLeft size={16} strokeWidth={2} />
                <span>Prev</span>
              </button>
              <button className="secondary-button schedule-week-nav-button" type="button">
                <span>Next</span>
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        <div className="schedule-day-list">
          {/* Day cards — shown on mobile, becomes section rows on desktop */}
          {SCHEDULE_ROWS.map((row) => (
            <div
              key={row.date}
              className="p-card schedule-day-card"
              style={row.status === "off" ? { opacity: 0.7 } : undefined}
            >
              <div className="p-card-body" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: row.status === "off" ? "var(--surface-muted)" : "color-mix(in srgb, var(--gold) 10%, transparent)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--foreground-muted)", textTransform: "uppercase" }}>
                    {row.dayShort}
                  </span>
                  <span style={{ fontSize: "var(--text-base-plus)", fontWeight: 800 }}>
                    {row.date.replace(/[A-Za-z]+\s/, "").split(" ")[1]}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "var(--text-lg-minus)" }}>
                    {row.shiftTime}
                  </p>
                  {row.dept && (
                    <p style={{ margin: 0, fontSize: "var(--text-sm-plus)", color: "var(--foreground-muted)" }}>
                      {row.dept}
                    </p>
                  )}
                </div>
                <span className={`badge ${STATUS_BADGE[row.status]?.cls ?? "gold"}`}>
                  {STATUS_BADGE[row.status]?.label ?? row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Side column (desktop) ── */}
      <div className="personal-col-side">
        <div className="p-card">
          <div className="p-card-header">
            <p className="p-card-title">Week Summary</p>
          </div>
          <div className="p-card-body">
            <div className="data-list">
              <div className="data-row">
                <div className="data-row-main"><p className="data-row-title">Shifts scheduled</p></div>
                <span className="badge success">4</span>
              </div>
              <div className="data-row">
                <div className="data-row-main"><p className="data-row-title">Days off</p></div>
                <span className="badge warning">3</span>
              </div>
              <div className="data-row">
                <div className="data-row-main"><p className="data-row-title">Total hours</p></div>
                <span className="badge gold">32h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
