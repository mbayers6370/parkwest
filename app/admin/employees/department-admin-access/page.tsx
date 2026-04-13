"use client";

import Link from "next/link";
import "../employees.css";
import { useAdminProperty } from "@/components/admin-property-provider";
import { SupportPropertyAccessManager } from "@/components/support-property-access-manager";
import { getAdminModuleLabel, isGlobalAdminModule } from "@/lib/admin-modules";

export default function AdminDepartmentAccessPage() {
  const adminProperty = useAdminProperty();
  const isGm = isGlobalAdminModule(adminProperty?.moduleKey);

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">
          {getAdminModuleLabel(adminProperty?.moduleKey)} Module
        </p>
        <h1 className="admin-page-title">Employees</h1>
        <p className="admin-page-subtitle">
          Manage employee records and department-level admin access for{" "}
          {adminProperty?.propertyName ?? "this property"}.
        </p>
        <nav className="admin-page-tabs" aria-label="Employee views">
          <Link href="/admin/employees?tab=manage" className="admin-page-tab">
            Manage Employees
          </Link>
          <Link href="/admin/employees?tab=directory" className="admin-page-tab">
            Employee Directory
          </Link>
          {isGm ? (
            <Link
              href="/admin/employees/department-admin-access"
              className="admin-page-tab active"
            >
              Department Admin Access
            </Link>
          ) : null}
        </nav>
      </header>

      <div className="admin-content">
        {isGm && adminProperty?.propertyKey && adminProperty?.propertyName ? (
          <SupportPropertyAccessManager
            propertyKey={adminProperty.propertyKey}
            propertyName={adminProperty.propertyName}
            headingLabel="Department Admin Access"
            title={`Grant admin and manager access for ${adminProperty.propertyName}`}
            description="GM can assign department admins and managers for this property without using the support workspace."
            grantButtonLabel="Grant Admin Access"
          />
        ) : (
          <section className="result-card">
            <p className="mini-label">Department Admin Access</p>
            <p className="mini-title">This page is only available in GM.</p>
            <p className="mini-copy">
              Switch to the GM module to manage department-level admin and manager access.
            </p>
          </section>
        )}
      </div>
    </>
  );
}
