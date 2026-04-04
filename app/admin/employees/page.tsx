import { AdminEmployeeManager } from "@/components/admin-employee-manager";
import Link from "next/link";

export default function AdminEmployeesPage() {
  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Employees</h1>
        <p className="admin-page-subtitle">
          Import, search, and manage employee records and schedule aliases
        </p>
        <nav className="admin-page-tabs" aria-label="Employee views">
          <span className="admin-page-tab active">All Employees</span>
          <Link href="/admin/schedule-import" className="admin-page-tab">
            Schedule Import
          </Link>
        </nav>
      </header>

      <div className="admin-content">
        <AdminEmployeeManager />
      </div>
    </>
  );
}
