"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useAdminProperty } from "@/components/admin-property-provider";
import {
  getAllTimeOffRequests,
  getCanonicalTimeOffRequestId,
  getTimeOffRequestDisplaySegments,
  TIME_OFF_REASON_LABELS,
  TIME_OFF_STATUS_LABELS,
  TIME_OFF_WINDOW_LABELS,
  groupAlreadySplitRequestsByMonthAndWeek,
  groupAlreadySplitRequestsBySaturdayWeek,
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
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

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
  const requestDisplaySegments = useMemo(
    () =>
      requestsWithDepartment.flatMap((request) =>
        getTimeOffRequestDisplaySegments(request).map((segment) => ({
          ...segment,
          departmentLabel: request.departmentLabel,
        })),
      ),
    [requestsWithDepartment],
  );
  const filteredRequests = useMemo(
    () =>
      requestDisplaySegments.filter((request) => {
        if (request.status !== activeTab) {
          return false;
        }

        if (activeDepartment === "all") {
          return true;
        }

        return request.departmentLabel === activeDepartment;
      }),
    [activeDepartment, activeTab, requestDisplaySegments],
  );
  const requestGroups = useMemo(
    () => groupAlreadySplitRequestsBySaturdayWeek(filteredRequests),
    [filteredRequests],
  );
  const monthGroups = useMemo(
    () => groupAlreadySplitRequestsByMonthAndWeek(filteredRequests),
    [filteredRequests],
  );

  function updateRequestStatus(
    request: TimeOffRequest,
    status: "approved" | "not_approved",
  ) {
    const requestId = getCanonicalTimeOffRequestId(request);
    const existingStoredRequest = storedRequests.find(
      (request) => getCanonicalTimeOffRequestId(request) === requestId,
    );
    const sourceRequest =
      existingStoredRequest ??
      allRequests.find((request) => getCanonicalTimeOffRequestId(request) === requestId);

    if (!sourceRequest) {
      return;
    }

    const reviewedAt = new Date().toISOString();
    const nextReviewSegment = {
      id: `${requestId}-${request.absenceStartDate}-${request.absenceEndDate}`,
      absenceStartDate: request.absenceStartDate ?? sourceRequest.absenceStartDate ?? sourceRequest.dateSubmitted,
      absenceEndDate:
        request.absenceEndDate ??
        sourceRequest.absenceEndDate ??
        sourceRequest.absenceStartDate ??
        sourceRequest.dateSubmitted,
      datesAbsent: request.datesAbsent,
      status,
      reviewedAt,
      reviewedBy: "Admin",
    };

    function applySegmentUpdate(target: TimeOffRequest) {
      const existingSegments = target.reviewSegments ?? [];
      const remainingSegments = existingSegments.filter(
        (segment) =>
          !(
            segment.absenceStartDate === nextReviewSegment.absenceStartDate &&
            segment.absenceEndDate === nextReviewSegment.absenceEndDate
          ),
      );

      return {
        ...target,
        reviewSegments: [...remainingSegments, nextReviewSegment].sort((a, b) =>
          a.absenceStartDate.localeCompare(b.absenceStartDate),
        ),
        reviewedAt,
        reviewedBy: "Admin",
      } satisfies TimeOffRequest;
    }

    const nextStoredRequests = existingStoredRequest
      ? storedRequests.map((request) =>
          getCanonicalTimeOffRequestId(request) !== requestId
            ? request
            : applySegmentUpdate(request),
        )
      : [
          applySegmentUpdate({
            ...sourceRequest,
            id: getCanonicalTimeOffRequestId(sourceRequest),
            sourceRequestId: getCanonicalTimeOffRequestId(sourceRequest),
          }),
          ...storedRequests,
        ];

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
        <div className="admin-page-tabs admin-requests-department-tabs" aria-label="Department filters">
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
        {(activeTab === "pending" ? requestGroups.length : monthGroups.length) === 0 ? (
          <section className="admin-request-week">
            <div className="empty-state">
              <p className="mini-title">No {TIME_OFF_STATUS_LABELS[activeTab].toLowerCase()} requests.</p>
              <p className="mini-copy">
                Requests will move here once they are marked {TIME_OFF_STATUS_LABELS[activeTab].toLowerCase()}.
              </p>
            </div>
          </section>
        ) : null}
        {activeTab === "pending"
          ? requestGroups.map((group) => (
              <section key={group.weekStart} className="admin-request-week">
                <div className="admin-request-week-header">
                  <div>
                    <h2 className="admin-request-week-title">{group.weekLabel}</h2>
                  </div>
                </div>

                <div className="admin-request-list">
                  {group.requests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      employees={employees}
                      onUpdateStatus={updateRequestStatus}
                    />
                  ))}
                </div>
              </section>
            ))
          : monthGroups.map((month) => {
              const monthExpanded = expandedMonths[month.monthKey] ?? true;

              return (
                <section key={month.monthKey} className="admin-request-month">
                  <button
                    type="button"
                    className="admin-request-month-toggle"
                    onClick={() =>
                      setExpandedMonths((current) => ({
                        ...current,
                        [month.monthKey]: !monthExpanded,
                      }))
                    }
                  >
                    <div>
                      <h2 className="admin-request-week-title">{month.monthLabel}</h2>
                    </div>
                    <div className="admin-request-toggle-right">
                      <span className="badge gold">
                        {month.weeks.reduce((sum, week) => sum + week.requests.length, 0)} Request
                        {month.weeks.reduce((sum, week) => sum + week.requests.length, 0) === 1
                          ? ""
                          : "s"}
                      </span>
                      {monthExpanded ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
                    </div>
                  </button>

                  {monthExpanded ? (
                    <div className="admin-request-month-body">
                      {month.weeks.map((group) => {
                        const weekExpanded = expandedWeeks[group.weekStart] ?? true;

                        return (
                          <section key={group.weekStart} className="admin-request-week nested">
                            <button
                              type="button"
                              className="admin-request-week-toggle"
                              onClick={() =>
                                setExpandedWeeks((current) => ({
                                  ...current,
                                  [group.weekStart]: !weekExpanded,
                                }))
                              }
                            >
                              <div>
                                <h3 className="admin-request-week-title">{group.weekLabel}</h3>
                              </div>
                              <div className="admin-request-toggle-right">
                                <span className="badge gold">
                                  {group.requests.length} Request
                                  {group.requests.length === 1 ? "" : "s"}
                                </span>
                                {weekExpanded ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
                              </div>
                            </button>

                            {weekExpanded ? (
                              <div className="admin-request-list">
                                {group.requests.map((request) => (
                                  <RequestCard
                                    key={request.id}
                                    request={request}
                                    employees={employees}
                                    onUpdateStatus={updateRequestStatus}
                                  />
                                ))}
                              </div>
                            ) : null}
                          </section>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })}
      </div>
    </>
  );
}

function RequestCard({
  request,
  employees,
  onUpdateStatus,
}: {
  request: TimeOffRequest;
  employees: EmployeeDirectoryEntry[];
  onUpdateStatus: (request: TimeOffRequest, status: "approved" | "not_approved") => void;
}) {
  const showActions = request.status === "pending";
  const showPendingDetails = request.status === "pending";

  return (
    <article className="admin-request-card">
      <div className="admin-request-card-top">
        <div>
          <p className="admin-request-name">{request.fullName}</p>
          <p className="admin-request-meta">
            {request.shift} · {request.location} · Submitted {request.dateSubmitted}
          </p>
        </div>
        {showPendingDetails ? (
          <div className="admin-request-card-badges">
            <span className="badge success">{getRequestDepartmentLabel(request, employees)}</span>
            <span className="badge gold">{TIME_OFF_REASON_LABELS[request.reason]}</span>
          </div>
        ) : null}
      </div>

      <div className="admin-request-detail-grid">
        {showPendingDetails ? (
          <div>
            <p className="admin-request-detail-label">Supervisor</p>
            <p className="admin-request-detail-value">{request.supervisor}</p>
          </div>
        ) : null}
        <div>
          <p className="admin-request-detail-label">Hours Absent</p>
          <p className="admin-request-detail-value">{request.hoursAbsent}</p>
        </div>
        <div>
          <p className="admin-request-detail-label">Dates Absent</p>
          <p className="admin-request-detail-value">{request.datesAbsent}</p>
        </div>
        <div>
          <p className="admin-request-detail-label">Request Timing</p>
          <p className="admin-request-detail-value">
            {TIME_OFF_WINDOW_LABELS[request.requestWindow]}
          </p>
        </div>
      </div>

      {request.explanation ? (
        <p className="admin-request-explanation">{request.explanation}</p>
      ) : null}

      {request.reviewedAt ? (
        <p className="admin-request-review-meta">
          Reviewed {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(new Date(request.reviewedAt))}
          {request.reviewedBy ? ` by ${request.reviewedBy}` : ""}
        </p>
      ) : null}

      {showActions ? (
        <div className="admin-request-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onUpdateStatus(request, "not_approved")}
            disabled={request.status === "not_approved"}
          >
            Not Approved
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => onUpdateStatus(request, "approved")}
            disabled={request.status === "approved"}
          >
            Approve
          </button>
        </div>
      ) : null}
    </article>
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
