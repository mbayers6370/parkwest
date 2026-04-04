"use client";

import { useEffect, useState } from "react";
import {
  getAllTimeOffRequests,
  TIME_OFF_REASON_LABELS,
  TIME_OFF_STATUS_LABELS,
  TIME_OFF_WINDOW_LABELS,
  groupRequestsBySaturdayWeek,
  type TimeOffRequest,
} from "@/lib/time-off-requests";
import { loadStoredTimeOffRequests } from "@/lib/time-off-request-store";

const STATUS_CLASS = {
  pending: "warning",
  approved: "success",
  not_approved: "danger",
} as const;

export default function AdminRequestsPage() {
  const [storedRequests, setStoredRequests] = useState<TimeOffRequest[]>([]);

  useEffect(() => {
    setStoredRequests(loadStoredTimeOffRequests());
  }, []);

  const requestGroups = groupRequestsBySaturdayWeek(
    getAllTimeOffRequests(storedRequests),
  );

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Requests</h1>
        <p className="admin-page-subtitle">
          Review employee time-off requests grouped by Saturday-start weeks.
        </p>
        <nav className="admin-page-tabs" aria-label="Request filters">
          <span className="admin-page-tab active">Weekly Queue</span>
          <span className="admin-page-tab">Approved</span>
          <span className="admin-page-tab">Not Approved</span>
        </nav>
      </header>

      <div className="admin-content admin-requests-layout">
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
                    <button className="secondary-button" type="button">
                      Not Approved
                    </button>
                    <button className="primary-button" type="button">
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
