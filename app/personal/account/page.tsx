import { TriangleAlert } from "lucide-react";

export default function PersonalAccountPage() {
  return (
    <main className="personal-content">
      <div className="personal-col-main personal-account-main">

        {/* Profile */}
        <div className="p-card personal-profile-card">
          <div className="p-card-header">
            <p className="p-card-title">Profile</p>
          </div>
          <div className="p-card-body">
            <div className="personal-profile-summary">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--background-top-glow)",
                  color: "var(--gold-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "var(--text-xl-plus)",
                  flexShrink: 0,
                }}
              >
                —
              </div>
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: "var(--text-base-plus)" }}>
                  Not signed in
                </p>
                <p style={{ margin: 0, color: "var(--foreground-muted)", fontSize: "var(--text-md-minus)" }}>
                  Auth not yet wired
                </p>
              </div>
            </div>

            <div className="data-list">
              <div className="data-row">
                <div className="data-row-main">
                  <p className="data-row-title">Employee ID</p>
                </div>
                <span style={{ color: "var(--foreground-muted)", fontSize: "var(--text-md-minus)" }}>—</span>
              </div>
              <div className="data-row">
                <div className="data-row-main">
                  <p className="data-row-title">Department</p>
                </div>
                <span style={{ color: "var(--foreground-muted)", fontSize: "var(--text-md-minus)" }}>—</span>
              </div>
              <div className="data-row">
                <div className="data-row-main">
                  <p className="data-row-title">Employment type</p>
                </div>
                <span style={{ color: "var(--foreground-muted)", fontSize: "var(--text-md-minus)" }}>—</span>
              </div>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="p-card">
          <div className="p-card-header">
            <p className="p-card-title">Password</p>
          </div>
          <div className="p-card-body">
            <div className="notice-card warn" style={{ marginBottom: 14 }}>
              <TriangleAlert size={14} aria-hidden="true" />
              <div>
                <p className="notice-title">Auth not yet connected</p>
                <p className="notice-body">Password change will be available once login is wired up.</p>
              </div>
            </div>

            <div className="p-form">
              <div className="p-field">
                <label className="p-label" htmlFor="current-pw">Current password</label>
                <input id="current-pw" type="password" className="text-input" disabled placeholder="••••••••" />
              </div>
              <div className="p-field">
                <label className="p-label" htmlFor="new-pw">New password</label>
                <input id="new-pw" type="password" className="text-input" disabled placeholder="••••••••" />
              </div>
              <button className="primary-button" disabled style={{ width: "100%", textAlign: "center", minHeight: 48, opacity: 0.5 }}>
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
