import { CircleAlert } from "lucide-react";

type AttendanceLogType =
  | "half_point"
  | "full_point"
  | "psl_call_out"
  | "psl_leave_early"
  | "reverse_psl";

const LOG_ENTRIES = [
  { id: "1", time: "12:18 PM", name: "Susan Tran", type: "half_point" as AttendanceLogType, detail: "Left early" },
  { id: "2", time: "1:06 PM", name: "Priya Nair", type: "reverse_psl" as AttendanceLogType, detail: "Used PSL to come in later" },
  { id: "3", time: "1:42 PM", name: "Carlos Ruiz", type: "psl_call_out" as AttendanceLogType, detail: "Used PSL to call out" },
  { id: "4", time: "2:09 PM", name: "Marcus Webb", type: "full_point" as AttendanceLogType, detail: "Missed full shift" },
  { id: "5", time: "4:24 PM", name: "Angela Fox", type: "psl_leave_early" as AttendanceLogType, detail: "Used PSL to leave early" },
];

const TYPE_STYLE: Record<AttendanceLogType, { dot: string; badge: string; label: string }> = {
  half_point: { dot: "var(--gold-dark)", badge: "warning", label: "Half Point" },
  full_point: { dot: "var(--foreground)", badge: "danger", label: "Full Point" },
  psl_call_out: { dot: "var(--foreground-emphasis)", badge: "success", label: "PSL Call Out" },
  psl_leave_early: { dot: "var(--gold)", badge: "gold", label: "PSL Leave Early" },
  reverse_psl: { dot: "var(--gold-dark)", badge: "gold", label: "Reverse PSL" },
};

export default function FloorLogPage() {
  const halfPointCount = LOG_ENTRIES.filter((entry) => entry.type === "half_point").length;
  const fullPointCount = LOG_ENTRIES.filter((entry) => entry.type === "full_point").length;
  const pslCount = LOG_ENTRIES.filter((entry) => entry.type !== "half_point" && entry.type !== "full_point").length;

  return (
    <>
      <div className="floor-control-bar">
        <div className="floor-filter-row">
          <span className="floor-filter-label">Today</span>
          <button className="floor-pill active" type="button">All Entries</button>
          <button className="floor-pill" type="button">Points</button>
          <button className="floor-pill" type="button">PSL</button>
        </div>
      </div>

      <main className="floor-content">

        <div className="floor-main-col">
          <div className="floor-section">
            <div className="floor-section-header">
              <div>
                <p className="floor-section-title">Attendance Log</p>
                <p className="floor-section-subtitle">Friday, April 4</p>
              </div>
            </div>
            <div className="floor-section-body" style={{ gap: 0 }}>
              {LOG_ENTRIES.map((entry) => {
                const style = TYPE_STYLE[entry.type];
                return (
                  <div key={entry.id} className="data-row" style={{ padding: "12px 4px" }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: style.dot,
                        flexShrink: 0,
                        marginTop: 3,
                      }}
                    />
                    <div className="data-row-main">
                      <p className="data-row-title">{entry.name}</p>
                      <p className="data-row-sub">{entry.detail} · {entry.time}</p>
                    </div>
                    <div className="data-row-right">
                      <span className={`badge ${style.badge}`}>{style.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="floor-side-col">
          <div className="floor-section">
            <div className="floor-section-header">
              <p className="floor-section-title">Today&apos;s Summary</p>
            </div>
            <div className="floor-section-body">
              <div className="data-list">
                <div className="data-row">
                  <div className="data-row-main"><p className="data-row-title">Total Entries</p></div>
                  <span className="badge gold">{LOG_ENTRIES.length}</span>
                </div>
                <div className="data-row">
                  <div className="data-row-main"><p className="data-row-title">Point Entries</p></div>
                  <span className="badge warning">{halfPointCount + fullPointCount}</span>
                </div>
                <div className="data-row">
                  <div className="data-row-main"><p className="data-row-title">PSL Entries</p></div>
                  <span className="badge success">{pslCount}</span>
                </div>
                <div className="data-row">
                  <div className="data-row-main"><p className="data-row-title">Full Point Uses</p></div>
                  <span className="badge danger">{fullPointCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="notice-card info">
            <CircleAlert size={15} aria-hidden="true" />
            <div>
              <p className="notice-title">Attendance-only tracking</p>
              <p className="notice-body">This log should only track employee name plus Half Point, Full Point, PSL, or Reverse PSL usage.</p>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
