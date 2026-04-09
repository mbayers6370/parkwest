"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { EMPLOYEE_DEPARTMENT_OPTIONS } from "@/lib/employee-departments";

type EmployeeSearchResult = {
  id: string;
  employeeId: string;
  displayName: string;
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
};

type AdminEmployeeDirectoryProps = {
  propertyKey?: string;
  propertyName?: string;
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
  displayName: string;
  department: string;
};

const emptyForm: EmployeeFormState = {
  employeeId: "",
  firstName: "",
  lastName: "",
  displayName: "",
  department: "",
};

function toFormState(employee: EmployeeSearchResult): EmployeeFormState {
  const primaryDepartment =
    employee.departmentAssignments.find((assignment) => assignment.isPrimary)?.department
      .departmentName ??
    employee.departmentAssignments[0]?.department.departmentName ??
    "";

  return {
    employeeId: employee.employeeId,
    firstName: employee.firstName ?? "",
    lastName: employee.lastName ?? "",
    displayName: employee.displayName,
    department: primaryDepartment,
  };
}

type AdminEmployeeManagerProps = {
  propertyKey?: string;
  propertyName?: string;
};

export function AdminEmployeeManager({
  propertyKey,
  propertyName,
}: AdminEmployeeManagerProps) {
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<EmployeeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const [createForm, setCreateForm] = useState<EmployeeFormState>(emptyForm);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EmployeeFormState>(emptyForm);
  const employeeSearchUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (query) {
      params.set("query", query);
    }

    if (propertyKey) {
      params.set("propertyKey", propertyKey);
    }

    return `/api/admin/employees?${params.toString()}`;
  }, [propertyKey, query]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(employeeSearchUrl, { signal: controller.signal });

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
  }, [employeeSearchUrl]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId],
  );

  useEffect(() => {
    if (!query.trim()) {
      setSelectedEmployeeId(null);
    }
  }, [query]);

  useEffect(() => {
    if (selectedEmployee) {
      setEditForm(toFormState(selectedEmployee));
    } else {
      setEditForm(emptyForm);
    }
  }, [selectedEmployee]);

  useEffect(() => {
    if (!editMessage && !resetMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setEditMessage(null);
      setResetMessage(null);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [editMessage, resetMessage]);

  async function refreshSearch() {
    const response = await fetch(employeeSearchUrl);
    const data = (await response.json()) as EmployeeResponse;
    setEmployees(data.employees);
    setMockMode(Boolean(data.mockMode));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateLoading(true);
    setCreateMessage(null);
    setError(null);
    setResetMessage(null);

    try {
      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...createForm,
          propertyKey,
        }),
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
    setResetMessage(null);

    try {
      const response = await fetch(`/api/admin/employees/${selectedEmployeeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editForm,
          propertyKey,
        }),
      });

      const data = (await response.json()) as EmployeeMutationResponse;

      if (!response.ok || !data.employee) {
        throw new Error(data.error ?? "Employee could not be updated.");
      }

      setEditMessage(
        `Saved changes for ${data.employee.displayName}.${data.mockMode ? " Mock mode is on, so this is not saved permanently yet." : ""}`,
      );
      await refreshSearch();
      setQuery("");
      setEmployees([]);
      setSelectedEmployeeId(null);
    } catch (updateError) {
      setError((updateError as Error).message);
    } finally {
      setEditLoading(false);
    }
  }

  function handleResetLogin() {
    if (!selectedEmployee) {
      return;
    }

    setResetMessage(
      `Reset login link queued for ${selectedEmployee.displayName}. Mock only for now.`,
    );
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
        <section className="result-card employee-search-card">
          <p className="mini-label">Add Employee</p>
          <p className="mini-title">Create a new employee record</p>
          <p className="mini-copy">
            This writes directly to the employee table
            {propertyName ? ` for ${propertyName}` : ""}.
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

              <div className="field-stack">
                <label className="field-label" htmlFor="create-department">
                  Department
                </label>
                <select
                  id="create-department"
                  className="text-input admin-select-input"
                  value={createForm.department}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, department: event.target.value }))
                  }
                  required
                >
                  <option value="">Select department</option>
                  {EMPLOYEE_DEPARTMENT_OPTIONS.map((department) => (
                    <option key={department.key} value={department.name}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
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
            Search by employee name or employee ID, then choose the correct employee to edit
            {propertyName ? ` inside ${propertyName}` : ""}.
          </p>

          <div className="field-stack">
            <input
              id="employee-search"
              className="text-input"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by display name or employee ID"
            />
          </div>

          {loading ? <p className="status-text">Searching...</p> : null}
          {error ? <p className="status-text error">{error}</p> : null}
          {query.trim() && employees.length > 0 ? (
            <div className="stack compact-stack employee-search-results">
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
                </article>
              ))}
            </div>
          ) : null}
          {!loading && !error && query.trim() && employees.length === 0 ? (
            <div className="empty-state">
              <p className="mini-title">No employees found.</p>
              <p className="mini-copy">Keep typing to search by employee name or employee ID.</p>
            </div>
          ) : null}
        </section>
      </div>

      <section className="result-card employee-edit-card">
        <p className="mini-label">Edit Employee</p>
        <p className="mini-title">
          {selectedEmployee ? `Editing ${selectedEmployee.displayName}` : "Choose an employee"}
        </p>
        <p className="mini-copy">
          Update the base employee record for the selected person.
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

              <div className="field-stack">
                <label className="field-label" htmlFor="edit-department">
                  Department
                </label>
                <select
                  id="edit-department"
                  className="text-input admin-select-input"
                  value={editForm.department}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, department: event.target.value }))
                  }
                  required
                >
                  <option value="">Select department</option>
                  {EMPLOYEE_DEPARTMENT_OPTIONS.map((department) => (
                    <option key={department.key} value={department.name}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="button-row employee-edit-actions">
              <button className="primary-button" type="submit" disabled={editLoading}>
                {editLoading ? "Saving changes..." : "Save employee changes"}
              </button>
              <button
                className="secondary-button employee-edit-secondary"
                type="button"
                onClick={handleResetLogin}
              >
                Reset Login
              </button>
            </div>
          </form>
        ) : (
          <div className="empty-state">
            <p className="mini-title">Choose an employee.</p>
            <p className="mini-copy">
              Search above, then pick the correct person from the matching list.
            </p>
          </div>
        )}

        {editMessage ? <p className="employee-helper-text">{editMessage}</p> : null}
        {resetMessage ? <p className="employee-helper-text">{resetMessage}</p> : null}
      </section>
    </div>
  );
}

export function AdminEmployeeDirectory({
  propertyKey,
  propertyName,
}: AdminEmployeeDirectoryProps) {
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<EmployeeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);

  const employeeDirectoryUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("all", "1");

    if (propertyKey) {
      params.set("propertyKey", propertyKey);
    }

    return `/api/admin/employees?${params.toString()}`;
  }, [propertyKey]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEmployees() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(employeeDirectoryUrl, { signal: controller.signal });
        const data = (await response.json()) as EmployeeResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Employee directory failed to load.");
        }

        setEmployees(data.employees);
        setMockMode(Boolean(data.mockMode));
      } catch (directoryError) {
        if ((directoryError as Error).name === "AbortError") {
          return;
        }

        setEmployees([]);
        setError((directoryError as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();

    return () => controller.abort();
  }, [employeeDirectoryUrl]);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return employees;
    }

    return employees.filter((employee) =>
      [
        employee.displayName,
        employee.firstName ?? "",
        employee.lastName ?? "",
        employee.employeeId,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [employees, query]);

  return (
    <div className="stack">
      {mockMode ? (
        <div className="result-card">
          <p className="mini-label">Mock Mode</p>
          <p className="mini-title">Employee directory is reading mock data</p>
          <p className="mini-copy">
            You can still test the full directory view
            {propertyName ? ` for ${propertyName}` : ""}.
          </p>
        </div>
      ) : null}

      <section className="result-card">
        <p className="mini-label">Employee Directory</p>
        <p className="mini-title">All employees</p>
        <p className="mini-copy">
          Search the full employee list
          {propertyName ? ` for ${propertyName}` : ""}. The list filters live as you type.
        </p>

        <div className="field-stack">
          <label className="field-label" htmlFor="employee-directory-search">
            Search employees
          </label>
          <input
            id="employee-directory-search"
            className="text-input"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Start typing a name or employee ID"
          />
        </div>

        {loading ? <p className="status-text">Loading employees...</p> : null}
        {error ? <p className="status-text error">{error}</p> : null}

        {!loading && !error ? (
          filteredEmployees.length > 0 ? (
            <div className="stack compact-stack employee-directory-results">
              {filteredEmployees.map((employee) => (
                <article key={employee.id} className="result-card nested-card">
                  <div className="result-card-header">
                    <div>
                      <p className="result-title">{employee.displayName}</p>
                      <p className="result-subtitle">Employee ID {employee.employeeId}</p>
                    </div>
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
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="mini-title">No employees found.</p>
              <p className="mini-copy">Try another name or employee ID.</p>
            </div>
          )
        ) : null}
      </section>
    </div>
  );
}
