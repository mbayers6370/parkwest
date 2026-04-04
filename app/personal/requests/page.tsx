"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CircleAlert,
  Square,
  SquareCheckBig,
} from "lucide-react";
import {
  getAllTimeOffRequests,
  TIME_OFF_REASON_LABELS,
  TIME_OFF_STATUS_LABELS,
  TIME_OFF_WINDOW_LABELS,
  type TimeOffRequest,
  type TimeOffReason,
  type TimeOffWindow,
} from "@/lib/time-off-requests";
import {
  loadStoredTimeOffRequests,
  saveStoredTimeOffRequests,
} from "@/lib/time-off-request-store";

const STATUS_STYLE = {
  pending: "warning",
  approved: "success",
  not_approved: "danger",
} as const;

const CURRENT_EMPLOYEE = {
  fullName: "Matthew Bayers",
  supervisor: "Brian",
  shift: "Grave",
  location: "580",
};

export default function PersonalRequestsPage() {
  const [fullName, setFullName] = useState(CURRENT_EMPLOYEE.fullName);
  const [supervisor, setSupervisor] = useState(CURRENT_EMPLOYEE.supervisor);
  const [dateSubmitted, setDateSubmitted] = useState(getTodayIsoDate());
  const [shift, setShift] = useState(CURRENT_EMPLOYEE.shift);
  const [location, setLocation] = useState(CURRENT_EMPLOYEE.location);
  const [hoursAbsent, setHoursAbsent] = useState("");
  const [absenceStartDate, setAbsenceStartDate] = useState("");
  const [absenceEndDate, setAbsenceEndDate] = useState("");
  const [reason, setReason] = useState<TimeOffReason>("vacation");
  const [explanation, setExplanation] = useState("");
  const [requestWindow, setRequestWindow] =
    useState<TimeOffWindow>("request_in_advance");
  const [submitted, setSubmitted] = useState(false);
  const [storedRequests, setStoredRequests] = useState<TimeOffRequest[]>([]);

  const datesAbsent = formatDateRange(absenceStartDate, absenceEndDate);

  useEffect(() => {
    setStoredRequests(loadStoredTimeOffRequests());
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newRequest: TimeOffRequest = {
      id: `tor-${Date.now()}`,
      fullName,
      supervisor,
      dateSubmitted,
      absenceStartDate,
      absenceEndDate,
      shift,
      location,
      hoursAbsent,
      datesAbsent,
      reason,
      explanation: explanation.trim() || undefined,
      requestWindow,
      status: "pending",
    };

    const nextStoredRequests = [newRequest, ...storedRequests];
    setStoredRequests(nextStoredRequests);
    saveStoredTimeOffRequests(nextStoredRequests);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setHoursAbsent("");
    setAbsenceStartDate("");
    setAbsenceEndDate("");
    setExplanation("");
    setReason("vacation");
    setRequestWindow("request_in_advance");
  }

  const employeeRequests = getAllTimeOffRequests(storedRequests).filter(
    (request) => request.fullName === CURRENT_EMPLOYEE.fullName,
  );

  return (
    <main className="personal-content">
      <div className="personal-col-main">
        <div className="p-card request-form-card">
          <div className="p-card-header request-form-header">
            <div>
              <p className="p-card-title">Time Off Request Form</p>
            </div>
          </div>

          <div className="p-card-body">
            {submitted && (
              <div className="notice-card ok" style={{ marginBottom: 16 }}>
                <Check size={15} aria-hidden="true" />
                <div>
                  <p className="notice-title">Request submitted</p>
                  <p className="notice-body">Your manager will receive this.</p>
                </div>
              </div>
            )}

            <form className="p-form request-paper-form" onSubmit={handleSubmit}>
              <div className="request-section">
                <p className="request-section-title">Employee Details</p>
                <div className="request-form-grid request-form-grid-three">
                  <div className="p-field">
                    <label className="p-label" htmlFor="full-name">
                      Full Name
                    </label>
                    <input
                      id="full-name"
                      className="text-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="p-field">
                    <label className="p-label" htmlFor="request-date">
                      Date
                    </label>
                    <input
                      id="request-date"
                      type="date"
                      className="text-input"
                      value={dateSubmitted}
                      onChange={(e) => setDateSubmitted(e.target.value)}
                      required
                    />
                  </div>
                  <div className="p-field">
                    <label className="p-label" htmlFor="request-shift">
                      Shift
                    </label>
                    <input
                      id="request-shift"
                      className="text-input"
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      required
                    />
                  </div>
                  <div className="p-field">
                    <label className="p-label" htmlFor="request-supervisor">
                      Supervisor
                    </label>
                    <input
                      id="request-supervisor"
                      className="text-input"
                      value={supervisor}
                      onChange={(e) => setSupervisor(e.target.value)}
                      required
                    />
                  </div>
                  <div className="p-field">
                    <label className="p-label" htmlFor="request-location">
                      Location
                    </label>
                    <input
                      id="request-location"
                      className="text-input"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div className="p-field">
                    <label className="p-label" htmlFor="hours-absent">
                      Number Of Hours Absent
                    </label>
                    <input
                      id="hours-absent"
                      className="text-input"
                      value={hoursAbsent}
                      onChange={(e) => setHoursAbsent(e.target.value)}
                      placeholder="8"
                      required
                    />
                  </div>
                </div>

                <div className="p-field">
                  <label className="p-label">
                    Dates Absent
                  </label>
                  <div className="request-form-grid">
                    <div className="p-field">
                      <label className="p-label" htmlFor="absence-start-date">
                        Start Date
                      </label>
                      <input
                        id="absence-start-date"
                        type="date"
                        className="text-input"
                        value={absenceStartDate}
                        onChange={(e) => setAbsenceStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="p-field">
                      <label className="p-label" htmlFor="absence-end-date">
                        End Date
                      </label>
                      <input
                        id="absence-end-date"
                        type="date"
                        className="text-input"
                        value={absenceEndDate}
                        onChange={(e) => setAbsenceEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <p className="request-date-preview">
                    {datesAbsent || "Select dates to populate the request"}
                  </p>
                </div>
              </div>

              <div className="request-section">
                <p className="request-section-title">Reason For Absence</p>
                <div className="request-reason-list">
                  {(Object.keys(TIME_OFF_REASON_LABELS) as TimeOffReason[]).map(
                    (option) => (
                      <label
                        key={option}
                        className={`request-choice-row${
                          reason === option ? " selected" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="reason"
                          checked={reason === option}
                          onChange={() => setReason(option)}
                        />
                        {reason === option ? (
                          <SquareCheckBig size={18} aria-hidden="true" />
                        ) : (
                          <Square size={18} aria-hidden="true" />
                        )}
                        <span>{TIME_OFF_REASON_LABELS[option]}</span>
                      </label>
                    ),
                  )}
                </div>

                <div className="p-field">
                  <label className="p-label" htmlFor="request-explanation">
                    Other, Explain
                  </label>
                  <textarea
                    id="request-explanation"
                    className="text-input"
                    rows={3}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Add details if needed"
                    style={{ resize: "vertical" }}
                  />
                </div>
              </div>

              <div className="request-section">
                <p className="request-section-title">Request Timing</p>
                <div className="request-window-grid">
                  {(
                    Object.keys(TIME_OFF_WINDOW_LABELS) as TimeOffWindow[]
                  ).map((option) => (
                    <label
                      key={option}
                      className={`request-window-card${
                        requestWindow === option ? " selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="request-window"
                        checked={requestWindow === option}
                        onChange={() => setRequestWindow(option)}
                      />
                      {requestWindow === option ? (
                        <SquareCheckBig size={18} aria-hidden="true" />
                      ) : (
                        <Square size={18} aria-hidden="true" />
                      )}
                      <span>{TIME_OFF_WINDOW_LABELS[option]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="primary-button request-submit-button" type="submit">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="personal-col-side">
        <div className="p-card">
          <div className="p-card-header">
            <p className="p-card-title">My Requests</p>
          </div>
          <div className="p-card-body">
            {employeeRequests.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 12px", textAlign: "center" }}>
                <p className="mini-title" style={{ marginBottom: 4 }}>
                  No requests yet
                </p>
                <p className="mini-copy">
                  Requests you submit will appear here with their current status.
                </p>
              </div>
            ) : (
              employeeRequests.map((request) => (
                <div key={request.id} className="request-row">
                  <div className="request-info">
                    <p className="request-info-title">{request.datesAbsent}</p>
                    <p className="request-info-dates">
                      {TIME_OFF_REASON_LABELS[request.reason]} ·{" "}
                      {request.hoursAbsent} hours
                    </p>
                  </div>
                  <span className={`badge ${STATUS_STYLE[request.status]}`}>
                    {TIME_OFF_STATUS_LABELS[request.status]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="notice-card info">
          <CircleAlert size={15} aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}

function formatDateRange(start: string, end: string) {
  if (!start && !end) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  });

  if (start && !end) {
    return formatter.format(new Date(`${start}T12:00:00`));
  }

  if (!start && end) {
    return formatter.format(new Date(`${end}T12:00:00`));
  }

  const startLabel = formatter.format(new Date(`${start}T12:00:00`));
  const endLabel = formatter.format(new Date(`${end}T12:00:00`));

  if (start === end) {
    return startLabel;
  }

  return `${startLabel} - ${endLabel}`;
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
