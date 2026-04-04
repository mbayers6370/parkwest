import { CalendarDays } from "lucide-react";

export default function AdminScheduleManagerPage() {
  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Schedule Manager</h1>
        <p className="admin-page-subtitle">
          View, compare, and manage published weekly schedules
        </p>
        <nav className="admin-page-tabs" aria-label="Schedule views">
          <span className="admin-page-tab active">Published</span>
          <span className="admin-page-tab">Drafts</span>
          <span className="admin-page-tab">Archived</span>
        </nav>
      </header>

      <div className="admin-content">
        <div className="coming-soon-card">
          <div className="coming-soon-icon">
            <CalendarDays size={22} aria-hidden="true" />
          </div>
          <p className="coming-soon-title">Schedule view coming after import is wired</p>
          <p className="coming-soon-body">
            Once schedules are imported and published via Schedule Import, they will appear here
            as a weekly grid with department filters, admin adjustment controls, and side-by-side
            staffing comparisons.
          </p>
        </div>
      </div>
    </>
  );
}
