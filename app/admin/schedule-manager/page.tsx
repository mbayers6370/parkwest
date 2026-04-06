"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { AdminScheduleImport } from "@/components/admin-schedule-import";

type ScheduleManagerTab = "import" | "published";

export default function AdminScheduleManagerPage() {
  const [activeTab, setActiveTab] = useState<ScheduleManagerTab>("import");

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Schedule Manager</h1>
        <p className="admin-page-subtitle">
          Import, review, and manage published weekly schedules
        </p>
        <nav className="admin-page-tabs" aria-label="Schedule views">
          <button
            type="button"
            className={`admin-page-tab${activeTab === "import" ? " active" : ""}`}
            onClick={() => setActiveTab("import")}
          >
            Import Schedule
          </button>
          <button
            type="button"
            className={`admin-page-tab${activeTab === "published" ? " active" : ""}`}
            onClick={() => setActiveTab("published")}
          >
            Published Schedule
          </button>
        </nav>
      </header>

      <div className="admin-content">
        {activeTab === "import" ? (
          <AdminScheduleImport />
        ) : (
          <div className="coming-soon-card">
            <div className="coming-soon-icon">
              <CalendarDays size={22} aria-hidden="true" />
            </div>
            <p className="coming-soon-title">Published schedule view is coming next</p>
            <p className="coming-soon-body">
              Once schedules are imported and published, they will appear here as a weekly grid
              with department filters, admin adjustment controls, and side-by-side staffing
              comparisons.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
