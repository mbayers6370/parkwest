import { AdminScheduleImport } from "@/components/admin-schedule-import";
import Link from "next/link";
import { CircleAlert } from "lucide-react";

export default function AdminScheduleImportPage() {
  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Schedule Import</h1>
        <p className="admin-page-subtitle">
          Upload a weekly spreadsheet, review name matches, and publish
        </p>
        <nav className="admin-page-tabs" aria-label="Import steps">
          <span className="admin-page-tab active">Upload &amp; Preview</span>
          <Link href="/admin/schedule-manager" className="admin-page-tab">
            Published Schedules
          </Link>
        </nav>
      </header>

      <div className="admin-content">
        <div
          className="notice-card info"
          style={{ marginBottom: 22 }}
        >
          <CircleAlert size={16} aria-hidden="true" />
          <div>
            <p className="notice-title">How import works</p>
            <p className="notice-body">
              Upload an Excel or CSV file. The system will parse each row, match employee names to
              existing records using saved aliases, and flag anything it cannot resolve. You review
              unmatched names before publishing.
            </p>
          </div>
        </div>

        <AdminScheduleImport />
      </div>
    </>
  );
}
