"use client";

import { useState } from "react";
import {
  AdminEmployeeDirectory,
  AdminEmployeeManager,
} from "@/components/admin-employee-manager";

type EmployeeAdminTab = "manage" | "directory";

export default function AdminEmployeesPage() {
  const [activeTab, setActiveTab] = useState<EmployeeAdminTab>("manage");

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Employees</h1>
        <p className="admin-page-subtitle">Create, search, and manage employee records</p>
        <nav className="admin-page-tabs" aria-label="Employee views">
          <button
            type="button"
            className={`admin-page-tab${activeTab === "manage" ? " active" : ""}`}
            onClick={() => setActiveTab("manage")}
          >
            Manage Employees
          </button>
          <button
            type="button"
            className={`admin-page-tab${activeTab === "directory" ? " active" : ""}`}
            onClick={() => setActiveTab("directory")}
          >
            Employee Directory
          </button>
        </nav>
      </header>

      <div className="admin-content">
        {activeTab === "manage" ? <AdminEmployeeManager /> : <AdminEmployeeDirectory />}
      </div>
    </>
  );
}
