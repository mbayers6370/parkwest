import { CircleAlert } from "lucide-react";

const DEPT_SCHEDULE = [
  { name: "Susan Tran", mon: "2–10p", tue: "2–10p", wed: "OFF", thu: "2–10p", fri: "2–10p", sat: "OFF", sun: "OFF" },
  { name: "Marcus Webb", mon: "OFF", tue: "10a–6p", wed: "10a–6p", thu: "10a–6p", fri: "OFF", sat: "2–10p", sun: "2–10p" },
  { name: "Priya Nair", mon: "2–10p", tue: "OFF", wed: "2–10p", thu: "2–10p", fri: "OFF", sat: "10a–6p", sun: "10a–6p" },
  { name: "Carlos Ruiz", mon: "4p–12a", tue: "4p–12a", wed: "OFF", thu: "4p–12a", fri: "4p–12a", sat: "OFF", sun: "OFF" },
  { name: "Linda Ho", mon: "OFF", tue: "2–10p", wed: "2–10p", thu: "OFF", fri: "10a–6p", sat: "10a–6p", sun: "OFF" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ShiftCell({ value }: { value: string }) {
  const isOff = value === "OFF";
  return (
    <td
      style={{
        padding: "10px 8px",
        borderBottom: "1px solid color-mix(in srgb, var(--charcoal-500) 15%, var(--ivory-100))",
        fontSize: "var(--text-sm-plus)",
        fontWeight: isOff ? 600 : 700,
        color: isOff ? "var(--foreground-muted)" : "var(--foreground)",
        textAlign: "center",
        background: isOff ? "transparent" : "color-mix(in srgb, var(--gold) 4%, transparent)",
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </td>
  );
}

export default function FloorSchedulePage() {
  return (
    <>
      <div className="floor-control-bar">
        <div className="floor-filter-row">
          <span className="floor-filter-label">Week</span>
          <button className="floor-pill active" type="button">Apr 7 – 13</button>
        </div>
        <div className="floor-filter-row">
          <span className="floor-filter-label">Dept</span>
          <button className="floor-pill active" type="button">Dealers</button>
          <button className="floor-pill" type="button">Floor</button>
          <button className="floor-pill" type="button">All</button>
        </div>
      </div>

      <main className="floor-content">

        {/* Mobile: day cards */}
        <div className="floor-main-col">

          {/* Desktop table — shown as a floor section */}
          <div className="floor-section">
            <div className="floor-section-header">
              <div>
                <p className="floor-section-title">Dealers · Week of Apr 7</p>
                <p className="floor-section-subtitle">Published schedule — tap a name to see attendance state</p>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--foreground-muted)", borderBottom: "1px solid var(--border)" }}>
                      Name
                    </th>
                    {DAYS.map((d) => (
                      <th key={d} style={{ padding: "10px 8px", textAlign: "center", fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--foreground-muted)", borderBottom: "1px solid var(--border)" }}>
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEPT_SCHEDULE.map((row) => (
                    <tr key={row.name}>
                      <td style={{ padding: "10px 12px", fontSize: "var(--text-md)", fontWeight: 700, borderBottom: "1px solid color-mix(in srgb, var(--charcoal-500) 15%, var(--ivory-100))", whiteSpace: "nowrap" }}>
                        {row.name}
                      </td>
                      <ShiftCell value={row.mon} />
                      <ShiftCell value={row.tue} />
                      <ShiftCell value={row.wed} />
                      <ShiftCell value={row.thu} />
                      <ShiftCell value={row.fri} />
                      <ShiftCell value={row.sat} />
                      <ShiftCell value={row.sun} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="notice-card info">
            <CircleAlert size={15} aria-hidden="true" />
            <div>
              <p className="notice-title">This is the published schedule baseline</p>
              <p className="notice-body">Live attendance changes are tracked separately on the Now screen. The schedule here is never overwritten.</p>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
