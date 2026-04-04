export default function AdminAuditLogPage() {
  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Audit Log</h1>
        <p className="admin-page-subtitle">
          Timestamped record of every important action taken in the system
        </p>
        <nav className="admin-page-tabs" aria-label="Audit filters">
          <span className="admin-page-tab active">All Events</span>
          <span className="admin-page-tab">Schedule</span>
          <span className="admin-page-tab">Attendance</span>
          <span className="admin-page-tab">Requests</span>
        </nav>
      </header>

      <div className="admin-content">
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <p className="admin-card-title">Event History</p>
              <p className="admin-card-subtitle">
                Records are created automatically as the system is used
              </p>
            </div>
          </div>
          <div className="admin-card-body">
            <div className="empty-state" style={{ textAlign: "center", padding: "32px 16px" }}>
              <p className="mini-title" style={{ marginBottom: 8 }}>
                No audit events yet
              </p>
              <p className="mini-copy">
                The system will begin recording here when schedules are imported and published,
                attendance is marked, requests are reviewed, and other key actions are taken.
                Every entry includes who did it, when, and what changed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
