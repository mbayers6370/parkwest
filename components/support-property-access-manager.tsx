"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_MODULE_OPTIONS,
  type AdminModuleKey,
} from "@/lib/admin-modules";
import type { PropertyAccessEntry, PropertyScopedRoleKey } from "@/lib/property-access";

type EmployeeSearchResult = {
  id: string;
  employeeId: string;
  displayName: string;
  departmentAssignments: {
    isPrimary: boolean;
    department: {
      departmentName: string;
    };
  }[];
};

type EmployeeResponse = {
  employees: EmployeeSearchResult[];
  error?: string;
};

type AccessResponse = {
  access: PropertyAccessEntry[];
  error?: string;
};

const ROLE_OPTIONS: { key: PropertyScopedRoleKey; label: string }[] = [
  { key: "ADMIN", label: "Admin" },
  { key: "MANAGER", label: "Manager" },
];

const ACCESS_SCOPE_OPTIONS = ADMIN_MODULE_OPTIONS;

function getPrimaryDepartment(employee: EmployeeSearchResult) {
  return (
    employee.departmentAssignments.find((assignment) => assignment.isPrimary)?.department
      .departmentName ??
    employee.departmentAssignments[0]?.department.departmentName ??
    "No department"
  );
}

export function SupportPropertyAccessManager({
  propertyKey,
  propertyName,
  headingLabel = "Property Access",
  title,
  description = "Support controls who can enter this property’s admin workspace.",
  grantButtonLabel = "Grant Property Access",
}: {
  propertyKey: string;
  propertyName: string;
  headingLabel?: string;
  title?: string;
  description?: string;
  grantButtonLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<EmployeeSearchResult[]>([]);
  const [accessEntries, setAccessEntries] = useState<PropertyAccessEntry[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedRoleKey, setSelectedRoleKey] = useState<PropertyScopedRoleKey>("ADMIN");
  const [selectedModuleKey, setSelectedModuleKey] = useState<AdminModuleKey>("GAMING");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const employeeSearchUrl = useMemo(() => {
    const params = new URLSearchParams({
      propertyKey,
    });

    if (query.trim()) {
      params.set("query", query.trim());
    }

    return `/api/admin/employees?${params.toString()}`;
  }, [propertyKey, query]);

  const selectedEmployee =
    employees.find((employee) => employee.id === selectedEmployeeId) ?? null;

  useEffect(() => {
    async function loadAccess() {
      try {
        const response = await fetch(`/api/support/properties/${propertyKey}/access`);
        const data = (await response.json()) as AccessResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Property access failed to load.");
        }

        setAccessEntries(data.access);
      } catch (loadError) {
        setError((loadError as Error).message);
      }
    }

    loadAccess();
  }, [propertyKey]);

  useEffect(() => {
    if (!query.trim()) {
      setEmployees([]);
      setLoading(false);
      setSelectedEmployeeId(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(employeeSearchUrl, { signal: controller.signal });
        const data = (await response.json()) as EmployeeResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Employee search failed.");
        }

        setEmployees(data.employees);
      } catch (searchError) {
        if ((searchError as Error).name !== "AbortError") {
          setEmployees([]);
        }
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [employeeSearchUrl, query]);

  async function refreshAccess() {
    const response = await fetch(`/api/support/properties/${propertyKey}/access`);
    const data = (await response.json()) as AccessResponse;
    setAccessEntries(data.access);
  }

  async function handleGrantAccess() {
    if (!selectedEmployee) {
      return;
    }

    setAssigning(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/support/properties/${propertyKey}/access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeRecordId: selectedEmployee.id,
          roleKey: selectedRoleKey,
          moduleKey: selectedModuleKey,
        }),
      });
      const data = (await response.json()) as { access?: PropertyAccessEntry; error?: string };

      if (!response.ok || !data.access) {
        throw new Error(data.error ?? "Property access could not be granted.");
      }

      await refreshAccess();
      setMessage(`${data.access.displayName} now has ${data.access.roleName.toLowerCase()} access for ${propertyName}.`);
    } catch (grantError) {
      setError((grantError as Error).message);
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemoveAccess(assignmentId: string) {
    setRemovingId(assignmentId);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/support/properties/${propertyKey}/access/${assignmentId}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Property access could not be removed.");
      }

      await refreshAccess();
      setMessage(`Elevated access was removed from ${propertyName}.`);
    } catch (removeError) {
      setError((removeError as Error).message);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleEnterAdmin(access: PropertyAccessEntry) {
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/support/properties/${propertyKey}/admin-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeRecordId: access.employeeRecordId,
          employeeId: access.employeeId,
          displayName: access.displayName,
          roleKey: access.roleKey,
          moduleKey: access.moduleKey,
          moduleLabel: access.moduleLabel,
          propertyKey: access.propertyKey,
          propertyName: access.propertyName,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Admin workspace could not be opened.");
      }

      window.location.href = "/admin";
    } catch (sessionError) {
      setError((sessionError as Error).message);
    }
  }

  return (
    <section className="result-card support-access-card">
      <div className="result-card-header">
        <div>
          <p className="mini-label">{headingLabel}</p>
          <p className="mini-title">{title ?? `Admins and managers for ${propertyName}`}</p>
          <p className="mini-copy">
            {description}
          </p>
        </div>
      </div>

      {message ? (
        <div className="notice-card ok">
          <div>
            <p className="notice-title">Saved</p>
            <p className="notice-body">{message}</p>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="notice-card danger">
          <div>
            <p className="notice-title">Access error</p>
            <p className="notice-body">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="support-access-grid">
        <div className="mini-card support-access-panel">
          <p className="mini-label">Grant Access</p>
          <div className="support-access-form">
            <div className="field-stack support-access-section">
              <label className="field-label" htmlFor={`support-access-search-${propertyKey}`}>
                Find Employee
              </label>
              <input
                id={`support-access-search-${propertyKey}`}
                className="text-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${propertyName} employees`}
              />
            </div>

            <div className="support-access-search-results support-access-section">
              {loading ? (
                <p className="mini-copy">Searching employees...</p>
              ) : query.trim() ? (
                employees.length > 0 ? (
                  employees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      className={`result-card support-access-employee${selectedEmployeeId === employee.id ? " active" : ""}`}
                      onClick={() => setSelectedEmployeeId(employee.id)}
                    >
                      <div>
                        <p className="result-title">{employee.displayName}</p>
                        <p className="result-subtitle">
                          Employee ID {employee.employeeId} · {getPrimaryDepartment(employee)}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="mini-copy">No employees matched that search.</p>
                )
              ) : (
                <p className="mini-copy">Search by employee name before assigning access.</p>
              )}
            </div>

            <div className="field-stack support-access-section">
              <label className="field-label" htmlFor={`support-access-role-${propertyKey}`}>
                Access Level
              </label>
              <select
                id={`support-access-role-${propertyKey}`}
                className="text-input app-select-input"
                value={selectedRoleKey}
                onChange={(event) => setSelectedRoleKey(event.target.value as PropertyScopedRoleKey)}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-stack support-access-section">
              <label className="field-label" htmlFor={`support-access-module-${propertyKey}`}>
                Department Scope
              </label>
              <select
                id={`support-access-module-${propertyKey}`}
                className="text-input app-select-input"
                value={selectedModuleKey}
                onChange={(event) => setSelectedModuleKey(event.target.value as AdminModuleKey)}
              >
                {ACCESS_SCOPE_OPTIONS.map((moduleOption) => (
                  <option key={moduleOption.key} value={moduleOption.key}>
                    {moduleOption.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="support-access-section support-access-submit-row">
              <button
                type="button"
                className="primary-button"
                onClick={handleGrantAccess}
                disabled={!selectedEmployee || assigning}
              >
                {assigning ? "Saving..." : grantButtonLabel}
              </button>
            </div>
          </div>
        </div>

        <div className="mini-card support-access-panel">
          <p className="mini-label">Current Access</p>
          <div className="stack">
            {accessEntries.length > 0 ? (
              accessEntries.map((entry) => (
                <div key={entry.assignmentId} className="result-card support-access-entry">
                  <div>
                    <p className="result-title">{entry.displayName}</p>
                    <p className="result-subtitle">
                      {entry.moduleLabel} · {entry.roleName} · Employee ID {entry.employeeId}
                    </p>
                  </div>
                  <div className="support-access-entry-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleEnterAdmin(entry)}
                    >
                      Enter Admin
                    </button>
                    <button
                      type="button"
                      className="secondary-button danger"
                      onClick={() => handleRemoveAccess(entry.assignmentId)}
                      disabled={removingId === entry.assignmentId}
                    >
                      {removingId === entry.assignmentId ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p className="mini-title">No admins or managers yet.</p>
                <p className="mini-copy">
                  Add property-scoped access from the left side when you are ready.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
