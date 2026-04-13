"use client";

import "./employees.css";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getAdminModuleLabel, isGlobalAdminModule } from "@/lib/admin-modules";
import { useAdminProperty } from "@/components/admin-property-provider";
import {
  AdminEmployeeDirectory,
  AdminEmployeeManager,
} from "@/components/admin-employee-manager";

type EmployeeAdminTab = "manage" | "directory";

export default function AdminEmployeesPage() {
  const adminProperty = useAdminProperty();
  const searchParams = useSearchParams();
  const requestedTab = searchParams?.get("tab");
  const activeTab: EmployeeAdminTab = requestedTab === "directory" ? "directory" : "manage";
  const isGm = isGlobalAdminModule(adminProperty?.moduleKey);

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">
          {getAdminModuleLabel(adminProperty?.moduleKey)} Module
        </p>
        <h1 className="admin-page-title">Employees</h1>
        <p className="admin-page-subtitle">
          Create, search, and manage employee records for{" "}
          {getAdminModuleLabel(adminProperty?.moduleKey)} at{" "}
          {adminProperty?.propertyName ?? "this property"}.
        </p>
        <nav className="admin-page-tabs" aria-label="Employee views">
          <Link
            href="/admin/employees?tab=manage"
            className={`admin-page-tab${activeTab === "manage" ? " active" : ""}`}
          >
            Manage Employees
          </Link>
          <Link
            href="/admin/employees?tab=directory"
            className={`admin-page-tab${activeTab === "directory" ? " active" : ""}`}
          >
            Employee Directory
          </Link>
          {isGm ? (
            <Link href="/admin/employees/department-admin-access" className="admin-page-tab">
              Department Admin Access
            </Link>
          ) : null}
        </nav>
      </header>

      <div className="admin-content">
        {activeTab === "manage" ? (
          <AdminEmployeeManager
            propertyKey={adminProperty?.propertyKey}
            propertyName={adminProperty?.propertyName}
            moduleKey={adminProperty?.moduleKey}
          />
        ) : (
          <AdminEmployeeDirectory
            propertyKey={adminProperty?.propertyKey}
            propertyName={adminProperty?.propertyName}
            moduleKey={adminProperty?.moduleKey}
          />
        )}
      </div>
    </>
  );
}
