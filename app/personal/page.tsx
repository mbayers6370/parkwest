import Link from "next/link";
import { OPEN_SHIFT_POSTS } from "@/lib/open-shifts";

const CURRENT_USER = {
  firstName: "Matt",
  roleLabel: "Dealer",
};

// Placeholder week days — will come from schedule data once DB is live
const WEEK_DAYS = [
  { name: "Sat", num: "12", shift: "10a–6p", today: false, off: false },
  { name: "Sun", num: "13", shift: "OFF", today: false, off: true },
  { name: "Mon", num: "14", shift: "2–10p", today: false, off: false },
  { name: "Tue", num: "15", shift: "2–10p", today: false, off: false },
  { name: "Wed", num: "16", shift: "OFF", today: false, off: true },
  { name: "Thu", num: "17", shift: "OFF", today: false, off: true },
  { name: "Fri", num: "18", shift: "10a–6p", today: false, off: false },
];

export default function PersonalHomePage() {
  return (
    <main className="personal-content">
      {/* ── Welcome card — hero card, always first on mobile ── */}
      <div className="next-shift-card">
        <p className="next-shift-kicker">Welcome Back</p>
        <div className="welcome-card-header">
          <p className="welcome-card-title">{CURRENT_USER.firstName}</p>
          <span className="shift-badge role-badge">{CURRENT_USER.roleLabel}</span>
        </div>
        <div className="next-shift-footer">
          <div className="welcome-detail-block welcome-detail-block-wide">
            <p className="welcome-detail-label">Next shift</p>
            <p className="welcome-detail-value">Tomorrow · Monday, April 7</p>
            <p className="welcome-detail-subvalue">2:00 – 10:00 PM</p>
          </div>
        </div>
      </div>

      <section className="personal-full-span personal-section personal-panel">
        <div className="personal-section-header shift-exchange-header">
          <div>
            <p className="personal-section-kicker">Schedule</p>
            <h2 className="personal-section-title">Your Week</h2>
          </div>
          <Link href="/personal/schedule" className="secondary-button personal-card-action">
            Full schedule
          </Link>
        </div>

        <div className="schedule-overview-strip">
          <div className="week-strip">
            {WEEK_DAYS.map((day) => (
              <div
                key={day.name}
                className={`day-cell${day.today ? " today" : ""}${day.off ? " off-day" : " has-shift"}`}
              >
                <span className="day-name">{day.name}</span>
                <span className="day-num">{day.num}</span>
                <span className="day-shift-label">{day.shift}</span>
              </div>
            ))}
          </div>
          <div className="schedule-mobile-footer">
            <Link
              href="/personal/schedule"
              className="primary-button personal-mobile-action"
            >
              Full Schedule
            </Link>
          </div>
        </div>

      </section>

      <section className="personal-full-span personal-section personal-panel">
        <div className="personal-section-header shift-exchange-header">
          <div>
            <h2 className="personal-section-title">Shift Exchange</h2>
          </div>
          <Link href="/personal/exchange" className="secondary-button personal-card-action">
            Open Board
          </Link>
        </div>

        <div className="p-card">
          <div className="p-card-header">
            <p className="p-card-title">Open Shifts</p>
          </div>
          <div className="p-card-body">
            <div className="exchange-list">
              {OPEN_SHIFT_POSTS.slice(0, 2).map((post) => (
                <div key={post.id} className="exchange-row">
                  <p className="exchange-row-title">{post.title}</p>
                  <p className="exchange-row-time">{post.line}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-card-footer personal-mobile-footer">
            <Link href="/personal/exchange" className="primary-button personal-mobile-action">
              Open Board
            </Link>
          </div>
        </div>
      </section>

      <section className="personal-full-span personal-section personal-panel">
        <div className="personal-section-header shift-exchange-header">
          <div>
            <h2 className="personal-section-title">My Requests</h2>
          </div>
          <Link href="/personal/requests" className="secondary-button personal-card-action">
            View All
          </Link>
        </div>

        <div className="p-card">
          <div className="p-card-body">
            <div
              className="empty-state"
              style={{ padding: "20px 12px", textAlign: "center" }}
            >
              <p className="mini-title" style={{ marginBottom: 4 }}>No requests yet</p>
              <p className="mini-copy">Time-off requests you submit will appear here with their status.</p>
            </div>
          </div>
          <div className="p-card-footer">
            <Link href="/personal/requests" className="primary-button" style={{ width: "100%", textAlign: "center", display: "block", minHeight: 44, lineHeight: "20px" }}>
              Request Time Off
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
