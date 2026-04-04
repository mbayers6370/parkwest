"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type EmployeeSearchResult = {
  id: string;
  employeeId: string;
  displayName: string;
  preferredName: string | null;
  badgeId?: string | null;
  firstName?: string;
  lastName?: string;
  status: string;
  employmentType: string;
  departmentAssignments: {
    isPrimary: boolean;
    department: {
      departmentName: string;
    };
  }[];
  aliases: {
    aliasName: string;
  }[];
};

type EmployeeResponse = {
  employees: EmployeeSearchResult[];
  error?: string;
  mockMode?: boolean;
};

type EmployeeMutationResponse = {
  employee?: EmployeeSearchResult;
  error?: string;
  mockMode?: boolean;
};

type EmployeeFormState = {
  employeeId: string;
  firstName: string;
  lastName: string;
  preferredName: string;
  displayName: string;
  badgeId: string;
  aliases: string;
};

const emptyForm: EmployeeFormState = {
  employeeId: "",
  firstName: "",
  lastName: "",
  preferredName: "",
  displayName: "",
  badgeId: "",
  aliases: "",
};

function toFormState(employee: EmployeeSearchResult): EmployeeFormState {
  return {
    employeeId: employee.employeeId,
    firstName: employee.firstName ?? "",
    lastName: employee.lastName ?? "",
    preferredName: employee.preferredName ?? "",
    displayName: employee.displayName,
    badgeId: employee.badgeId ?? "",
    aliases: employee.aliases.map((alias) => alias.aliasName).join(", "),
  };
}

export function AdminEmployeeManager() {
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<EmployeeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const [createForm, setCreateForm] = useState<EmployeeFormState>(emptyForm);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EmployeeFormState>(emptyForm);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/employees?query=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );

        const data = (await response.json()) as EmployeeResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Employee search failed.");
        }

        setEmployees(data.employees);
        setMockMode(Boolean(data.mockMode));
      } catch (searchError) {
        if ((searchError as Error).name === "AbortError") {
          return;
        }

        setEmployees([]);
        setError((searchError as Error).message);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId],
  );

  useEffect(() => {
    if (selectedEmployee) {
      setEditForm(toFormState(selectedEmployee));
    } else {
      setEditForm(emptyForm);
    }
  }, [selectedEmployee]);

  async function refreshSearch() {
    const response = await fetch(`/api/admin/employees?query=${encodeURIComponent(query)}`);
    const data = (await response.json()) as EmployeeResponse;
    setEmployees(data.employees);
    setMockMode(Boolean(data.mockMode));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateLoading(true);
    setCreateMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      });

      const data = (await response.json()) as EmployeeMutationResponse;

      if (!response.ok || !data.employee) {
        throw new Error(data.error ?? "Employee could not be created.");
      }

      setCreateForm(emptyForm);
      setCreateMessage(
        `Created ${data.employee.displayName}.${data.mockMode ? " Mock mode is on, so this is not saved permanently yet." : ""}`,
      );
      await refreshSearch();
    } catch (createError) {
      setError((createError as Error).message);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEmployeeId) {
      return;
    }

    setEditLoading(true);
    setEditMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/employees/${selectedEmployeeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const data = (await response.json()) as EmployeeMutationResponse;

      if (!response.ok || !data.employee) {
        throw new Error(data.error ?? "Employee could not be updated.");
      }

      setEditMessage(
        `Saved changes for ${data.employee.displayName}.${data.mockMode ? " Mock mode is on, so this is not saved permanently yet." : ""}`,
      );
      await refreshSearch();
      setSelectedEmployeeId(data.employee.id);
    } catch (updateError) {
      setError((updateError as Error).message);
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="stack">
      {mockMode ? (
        <div className="result-card">
          <p className="mini-label">Mock Mode</p>
          <p className="mini-title">Database writes are disabled right now</p>
          <p className="mini-copy">
            You can keep building and testing the manager workflow. Search, add, and edit actions
            are returning mock responses instead of writing to the database.
          </p>
        </div>
      ) : null}

      <div className="manager-grid">
        <section className="result-card">
          <p className="mini-label">Add Employee</p>
          <p className="mini-title">Create a new employee record</p>
          <p className="mini-copy">
            This writes directly to the employee table and can include schedule aliases from day
            one.
          </p>

          <form className="stack form-stack" onSubmit={handleCreate}>
            <div className="form-grid">
              <div className="field-stack">
                <label className="field-label" htmlFor="create-employee-id">
                  Employee ID
                </label>
                <input
                  id="create-employee-id"
                  className="text-input"
                  value={createForm.employeeId}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, employeeId: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-stack">
                <label className="field-label" htmlFor="create-badge-id">
                  Badge ID
                </label>
                <input
                  id="create-badge-id"
                  className="text-input"
                  value={createForm.badgeId}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, badgeId: event.target.value }))
                  }
                />
              </div>

              <div className="field-stack">
                <label className="field-label" htmlFor="create-first-name">
                  First name
                </label>
                <input
                  id="create-first-name"
                  className="text-input"
                  value={createForm.firstName}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-stack">
                <label className="field-label" htmlFor="create-last-name">
                  Last name
                </label>
                <input
                  id="create-last-name"
                  className="text-input"
                  value={createForm.lastName}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, lastName: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-stack">
                <label className="field-label" htmlFor="create-preferred-name">
                  Preferred name
                </label>
                <input
                  id="create-preferred-name"
                  className="text-input"
                  value={createForm.preferredName}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      preferredName: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="field-stack">
                <label className="field-label" htmlFor="create-display-name">
                  Display name
                </label>
                <input
                  id="create-display-name"
                  className="text-input"
                  value={createForm.displayName}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, displayName: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="field-stack">
              <label className="field-label" htmlFor="create-aliases">
                Aliases
              </label>
              <input
                id="create-aliases"
                className="text-input"
                value={createForm.aliases}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, aliases: event.target.value }))
                }
                placeholder="Example: Matt, Matthew Bayers, Bayers"
              />
            </div>

            <button className="primary-button" type="submit" disabled={createLoading}>
              {createLoading ? "Saving employee..." : "Add employee"}
            </button>
          </form>

          {createMessage ? <p className="status-text success">{createMessage}</p> : null}
        </section>

        <section className="result-card">
          <p className="mini-label">Search And Edit</p>
          <p className="mini-title">Find employees as you type</p>
          <p className="mini-copy">
            Search by employee name, preferred name, or alias and edit the selected person.
          </p>

          <div className="field-stack">
            <label className="field-label" htmlFor="employee-search">
              Employee name
            </label>
            <input
              id="employee-search"
              className="text-input"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by display name, preferred name, or alias"
            />
          </div>

          {loading ? <p className="status-text">Searching...</p> : null}
          {error ? <p className="status-text error">{error}</p> : null}

          <div className="stack compact-stack">
            {employees.map((employee) => (
              <article key={employee.id} className="result-card nested-card">
                <div className="result-card-header">
                  <div>
                    <p className="result-title">{employee.displayName}</p>
                    <p className="result-subtitle">Employee ID {employee.employeeId}</p>
                  </div>
                  <button
                    className={`secondary-button${
                      selectedEmployeeId === employee.id ? " active" : ""
                    }`}
                    type="button"
                    onClick={() => setSelectedEmployeeId(employee.id)}
                  >
                    {selectedEmployeeId === employee.id ? "Editing" : "Edit"}
                  </button>
                </div>

                <div className="badge-row">
                  {employee.departmentAssignments.length > 0 ? (
                    employee.departmentAssignments.map((assignment) => (
                      <span
                        key={`${employee.id}-${assignment.department.departmentName}`}
                        className={`badge ${assignment.isPrimary ? "success" : "warning"}`}
                      >
                        {assignment.department.departmentName}
                      </span>
                    ))
                  ) : (
                    <span className="badge warning">No department</span>
                  )}
                </div>

                <p className="result-meta">
                  Aliases:{" "}
                  {employee.aliases.length > 0
                    ? employee.aliases.map((alias) => alias.aliasName).join(", ")
                    : "None yet"}
                </p>
              </article>
            ))}

            {!loading && !error && employees.length === 0 ? (
              <div className="empty-state">
                <p className="mini-title">No employees found yet.</p>
                <p className="mini-copy">
                  Once employee records exist in the database, matching results will appear here.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="result-card">
        <p className="mini-label">Edit Employee</p>
        <p className="mini-title">
          {selectedEmployee ? `Editing ${selectedEmployee.displayName}` : "Choose an employee"}
        </p>
        <p className="mini-copy">
          Update the base employee record and the name aliases used for schedule imports.
        </p>

        {selectedEmployee ? (
          <form className="stack form-stack" onSubmit={handleUpdate}>
            <div className="form-grid">
              <div className="field-stack">
                <label className="field-label" htmlFor="edit-employee-id">
                  Employee ID
                </label>
                <input
                  id="edit-employee-id"
                  className="text-input"
                  value={editForm.employeeId}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, employeeId: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-stack">
                <label className="field-label" htmlFor="edit-badge-id">
                  Badge ID
                </label>
                <input
                  id="edit-badge-id"
                  className="text-input"
                  value={editForm.badgeId}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, badgeId: event.target.value }))
                  }
                />
              </div>

              <div className="field-stack">
                <label className="field-label" htmlFor="edit-first-name">
                  First name
                </label>
                <input
                  id="edit-first-name"
                  className="text-input"
                  value={editForm.firstName}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-stack">
                <label className="field-label" htmlFor="edit-last-name">
                  Last name
                </label>
                <input
                  id="edit-last-name"
                  className="text-input"
                  value={editForm.lastName}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, lastName: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="field-stack">
                <label className="field-label" htmlFor="edit-preferred-name">
                  Preferred name
                </label>
                <input
                  id="edit-preferred-name"
                  className="text-input"
                  value={editForm.preferredName}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      preferredName: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="field-stack">
                <label className="field-label" htmlFor="edit-display-name">
                  Display name
                </label>
                <input
                  id="edit-display-name"
                  className="text-input"
                  value={editForm.displayName}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, displayName: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="field-stack">
              <label className="field-label" htmlFor="edit-aliases">
                Aliases
              </label>
              <input
                id="edit-aliases"
                className="text-input"
                value={editForm.aliases}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, aliases: event.target.value }))
                }
              />
            </div>

            <button className="primary-button" type="submit" disabled={editLoading}>
              {editLoading ? "Saving changes..." : "Save employee changes"}
            </button>
          </form>
        ) : (
          <div className="empty-state">
            <p className="mini-title">Select someone from search results.</p>
            <p className="mini-copy">
              Once selected, their record will load into this editor for updates.
            </p>
          </div>
        )}

        {editMessage ? <p className="status-text success">{editMessage}</p> : null}
      </section>
    </div>
  );
}
