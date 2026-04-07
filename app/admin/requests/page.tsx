"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminProperty } from "@/components/admin-property-provider";
import {
  getAllTimeOffRequests,
  TIME_OFF_REASON_LABELS,
  TIME_OFF_STATUS_LABELS,
  TIME_OFF_WINDOW_LABELS,
  groupRequestsBySaturdayWeek,
  type TimeOffRequest,
  type TimeOffStatus,
} from "@/lib/time-off-requests";
import {
  loadStoredTimeOffRequests,
  saveStoredTimeOffRequests,
  TIME_OFF_REQUESTS_UPDATED_EVENT,
} from "@/lib/time-off-request-store";
import { EMPLOYEE_DEPARTMENT_OPTIONS } from "@/lib/employee-departments";

const STATUS_CLASS = {
  pending: "warning",
  approved: "success",
  not_approved: "danger",
} as const;

type EmployeeDirectoryEntry = {
  id: string;
  employeeId: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  departmentAssignments: {
    isPrimary: boolean;
    department: {
      departmentName: string;
    };
  }[];
};

type EmployeeDirectoryResponse = {
  employees: EmployeeDirectoryEntry[];
  error?: string;
};

export default function AdminRequestsPage() {
  const adminProperty = useAdminProperty();
  const [storedRequests, setStoredRequests] = useState<TimeOffRequest[]>([]);
  const [employees, setEmployees] = useState<EmployeeDirectoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TimeOffStatus>("pending");
  const [activeDepartment, setActiveDepartment] = useState<string>("all");

  useEffect(() => {
    const syncStoredRequests = () => {
      setStoredRequests(loadStoredTimeOffRequests());
    };

    syncStoredRequests();
    window.addEventListener(TIME_OFF_REQUESTS_UPDATED_EVENT, syncStoredRequests);
    window.addEventListener("storage", syncStoredRequests);

    return () => {
      window.removeEventListener(TIME_OFF_REQUESTS_UPDATED_EVENT, syncStoredRequests);
      window.removeEventListener("storage", syncStoredRequests);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEmployees() {
      try {
        const params = new URLSearchParams({ all: "1" });

        if (adminProperty?.propertyKey) {
          params.set("propertyKey", adminProperty.propertyKey);
        }

        const response = await fetch(`/api/admin/employees?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as EmployeeDirectoryResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Employee directory failed to load.");
        }

        setEmployees(data.employees);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setEmployees([]);
      }
    }

    if (adminProperty?.propertyKey) {
      loadEmployees();
    }

    return () => controller.abort();
  }, [adminProperty?.propertyKey]);

  const allRequests = useMemo(
    () => getAllTimeOffRequests(storedRequests),
    [storedRequests],
  );
  const requestsWithDepartment = useMemo(
    () =>
      allRequests
        .filter((request) =>
          requestBelongsToProperty(request, employees, adminProperty?.propertyKey),
        )
        .map((request) => ({
          ...request,
          departmentLabel: getRequestDepartmentLabel(request, employees),
        })),
    [adminProperty?.propertyKey, allRequests, employees],
  );
  const filteredRequests = useMemo(
    () =>
      requestsWithDepartment.filter((request) => {
        if (request.status !== activeTab) {
          return false;
        }

        if (activeDepartment === "all") {
          return true;
        }

        return request.departmentLabel === activeDepartment;
      }),
    [activeDepartment, activeTab, requestsWithDepartment],
  );
  const requestGroups = useMemo(
    () => groupRequestsBySaturdayWeek(filteredRequests),
    [filteredRequests],
  );

  function updateRequestStatus(requestId: string, status: Exclude<TimeOffStatus, "pending">) {
    const existingStoredRequest = storedRequests.find((request) => request.id === requestId);
    const sourceRequest =
      existingStoredRequest ?? allRequests.find((request) => request.id === requestId);

    if (!sourceRequest) {
      return;
    }

    const nextStoredRequests = existingStoredRequest
      ? storedRequests.map((request) =>
          request.id !== requestId ? request : { ...request, status },
        )
      : [{ ...sourceRequest, status }, ...storedRequests];

    setStoredRequests(nextStoredRequests);
    saveStoredTimeOffRequests(nextStoredRequests);
  }

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Requests</h1>
        <p className="admin-page-subtitle">
          Review employee time-off requests for {adminProperty?.propertyName ?? "this property"}, grouped by Saturday-start weeks.
        </p>
        <nav className="admin-page-tabs" aria-label="Request filters">
          <button
            type="button"
            className={`admin-page-tab${activeTab === "pending" ? " active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending
          </button>
          <button
            type="button"
            className={`admin-page-tab${activeTab === "approved" ? " active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            Approved
          </button>
          <button
            type="button"
            className={`admin-page-tab${activeTab === "not_approved" ? " active" : ""}`}
            onClick={() => setActiveTab("not_approved")}
          >
            Not Approved
          </button>
        </nav>
      </header>

      <div className="admin-content admin-requests-layout">
        <div className="admin-page-tabs" aria-label="Department filters">
          <button
            type="button"
            className={`admin-page-tab${activeDepartment === "all" ? " active" : ""}`}
            onClick={() => setActiveDepartment("all")}
          >
            All Departments
          </button>
          {EMPLOYEE_DEPARTMENT_OPTIONS.map((department) => (
            <button
              key={department.key}
              type="button"
              className={`admin-page-tab${activeDepartment === department.name ? " active" : ""}`}
              onClick={() => setActiveDepartment(department.name)}
            >
              {department.name}
            </button>
          ))}
        </div>
        {requestGroups.length === 0 ? (
          <section className="admin-request-week">
            <div className="empty-state">
              <p className="mini-title">No {TIME_OFF_STATUS_LABELS[activeTab].toLowerCase()} requests.</p>
              <p className="mini-copy">
                Requests will move here once they are marked {TIME_OFF_STATUS_LABELS[activeTab].toLowerCase()}.
              </p>
            </div>
          </section>
        ) : null}
        {requestGroups.map((group) => (
          <section key={group.weekStart} className="admin-request-week">
            <div className="admin-request-week-header">
              <div>
                <p className="admin-request-week-kicker">Saturday Start Week</p>
                <h2 className="admin-request-week-title">{group.weekLabel}</h2>
              </div>
              <span className="badge gold">
                {group.requests.length} Request
                {group.requests.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="admin-request-list">
              {group.requests.map((request) => (
                <article key={request.id} className="admin-request-card">
                  <div className="admin-request-card-top">
                    <div>
                      <p className="admin-request-name">{request.fullName}</p>
                      <p className="admin-request-meta">
                        {request.shift} · {request.location} · Submitted{" "}
                        {request.dateSubmitted}
                      </p>
                    </div>
                    <span className={`badge ${STATUS_CLASS[request.status]}`}>
                      {TIME_OFF_STATUS_LABELS[request.status]}
                    </span>
                  </div>

                  <div className="admin-request-detail-grid">
                    <div>
                      <p className="admin-request-detail-label">Supervisor</p>
                      <p className="admin-request-detail-value">
                        {request.supervisor}
                      </p>
                    </div>
                    <div>
                      <p className="admin-request-detail-label">Hours Absent</p>
                      <p className="admin-request-detail-value">
                        {request.hoursAbsent}
                      </p>
                    </div>
                    <div>
                      <p className="admin-request-detail-label">Dates Absent</p>
                      <p className="admin-request-detail-value">
                        {request.datesAbsent}
                      </p>
                    </div>
                    <div>
                      <p className="admin-request-detail-label">Request Timing</p>
                      <p className="admin-request-detail-value">
                        {TIME_OFF_WINDOW_LABELS[request.requestWindow]}
                      </p>
                    </div>
                  </div>

                  <div className="admin-request-reason-row">
                    <span className="badge success">
                      {getRequestDepartmentLabel(request, employees)}
                    </span>
                    <span className="badge gold">
                      {TIME_OFF_REASON_LABELS[request.reason]}
                    </span>
                    {request.explanation ? (
                      <p className="admin-request-explanation">
                        {request.explanation}
                      </p>
                    ) : null}
                  </div>

                  <div className="admin-request-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => updateRequestStatus(request.id, "not_approved")}
                      disabled={request.status === "not_approved"}
                    >
                      Not Approved
                    </button>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => updateRequestStatus(request.id, "approved")}
                      disabled={request.status === "approved"}
                    >
                      Approve
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function requestBelongsToProperty(
  request: TimeOffRequest,
  employees: EmployeeDirectoryEntry[],
  propertyKey?: string,
) {
  if (!propertyKey) {
    return false;
  }

  const normalizedPropertyKey = propertyKey.trim().toLowerCase();

  if (request.location.trim().toLowerCase() === normalizedPropertyKey) {
    return true;
  }

  const requestName = request.fullName.trim().toLowerCase();

  return employees.some((employee) => {
    const exactNames = [
      employee.displayName,
      employee.firstName && employee.lastName
        ? `${employee.firstName} ${employee.lastName}`
        : null,
    ]
      .filter(Boolean)
      .map((value) => value?.trim().toLowerCase());

    return exactNames.includes(requestName);
  });
}

function getRequestDepartmentLabel(
  request: TimeOffRequest,
  employees: EmployeeDirectoryEntry[],
) {
  const normalizedRequestName = normalizeName(request.fullName);
  const requestParts = normalizedRequestName.split(" ").filter(Boolean);
  const requestLastName = requestParts.at(-1) ?? "";
  const requestFirstName = requestParts[0] ?? "";

  const directMatch = employees.find((employee) => {
    const candidateNames = [
      employee.displayName,
      `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim(),
    ]
      .map(normalizeName)
      .filter(Boolean);

    return candidateNames.includes(normalizedRequestName);
  });

  const softMatch =
    directMatch ??
    employees.find((employee) => {
      const employeeFirst = normalizeName(employee.firstName ?? "");
      const employeeLast = normalizeName(employee.lastName ?? "");

      if (!employeeFirst || !employeeLast || employeeLast !== requestLastName) {
        return false;
      }

      return (
        employeeFirst.startsWith(requestFirstName.slice(0, 3)) ||
        requestFirstName.startsWith(employeeFirst.slice(0, 3))
      );
    });

  return (
    softMatch?.departmentAssignments.find((assignment) => assignment.isPrimary)?.department
      .departmentName ??
    softMatch?.departmentAssignments[0]?.department.departmentName ??
    "Unknown"
  );
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
