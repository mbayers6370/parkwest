"use client";

import { useEffect, useState } from "react";
import { Check, Square, SquareCheckBig } from "lucide-react";
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
  TIME_OFF_REQUESTS_UPDATED_EVENT,
} from "@/lib/time-off-request-store";
import shared from "../personal-shared.module.css";
import styles from "./requests.module.css";

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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

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
    <main className={shared.personalContent}>
      <div className={`${shared.personalFullSpan} ${styles.requestsPageStack}`}>
        <div className={`${shared.pCard} ${styles.requestsPanelCard}`}>
          <div className={`${shared.pCardHeader} ${styles.requestsPanelHeader}`}>
            <p className={shared.pCardTitle}>My Requests</p>
          </div>
          <div className={`${shared.pCardBody} ${styles.requestsPanelBody}`}>
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
                <div key={request.id} className={styles.requestRow}>
                  <div className={styles.requestInfo}>
                    <p className={styles.requestInfoTitle}>{request.datesAbsent}</p>
                    <p className={styles.requestInfoDates}>
                      {TIME_OFF_REASON_LABELS[request.reason]} · {request.hoursAbsent} hours
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

        <div className={`${shared.pCard} ${styles.requestFormCard} ${styles.requestsPanelCard}`}>
          <div className={`${shared.pCardHeader} ${styles.requestsPanelHeader} ${styles.requestFormHeader}`}>
            <div>
              <p className={shared.pCardTitle}>Time Off Request Form</p>
            </div>
          </div>

          <div className={`${shared.pCardBody} ${styles.requestsPanelBody}`}>
            {submitted && (
              <div className="notice-card ok" style={{ marginBottom: 16 }}>
                <Check size={15} aria-hidden="true" />
                <div>
                  <p className="notice-title">Request submitted</p>
                  <p className="notice-body">Your manager will receive this.</p>
                </div>
              </div>
            )}

            <form className={`${shared.pForm} ${styles.requestPaperForm}`} onSubmit={handleSubmit}>
              <div className={styles.requestSection}>
                <p className={styles.requestSectionTitle}>Employee Details</p>
                <div className={`${styles.requestFormGrid} ${styles.requestFormGridThree}`}>
                  <div className={shared.pField}>
                    <label className={shared.pLabel} htmlFor="full-name">
                      Full Name
                    </label>
                    <input
                      id="full-name"
                      className="text-input"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />
                  </div>
                  <div className={shared.pField}>
                    <label className={shared.pLabel} htmlFor="request-date">
                      Date
                    </label>
                    <input
                      id="request-date"
                      type="date"
                      className="text-input"
                      value={dateSubmitted}
                      onChange={(event) => setDateSubmitted(event.target.value)}
                      required
                    />
                  </div>
                  <div className={shared.pField}>
                    <label className={shared.pLabel} htmlFor="request-shift">
                      Shift
                    </label>
                    <input
                      id="request-shift"
                      className="text-input"
                      value={shift}
                      onChange={(event) => setShift(event.target.value)}
                      required
                    />
                  </div>
                  <div className={shared.pField}>
                    <label className={shared.pLabel} htmlFor="request-supervisor">
                      Supervisor
                    </label>
                    <input
                      id="request-supervisor"
                      className="text-input"
                      value={supervisor}
                      onChange={(event) => setSupervisor(event.target.value)}
                      required
                    />
                  </div>
                  <div className={shared.pField}>
                    <label className={shared.pLabel} htmlFor="request-location">
                      Location
                    </label>
                    <input
                      id="request-location"
                      className="text-input"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      required
                    />
                  </div>
                  <div className={shared.pField}>
                    <label className={shared.pLabel} htmlFor="hours-absent">
                      Number Of Hours Absent
                    </label>
                    <input
                      id="hours-absent"
                      className="text-input"
                      value={hoursAbsent}
                      onChange={(event) => setHoursAbsent(event.target.value)}
                      placeholder="8"
                      required
                    />
                  </div>
                </div>

                <div className={shared.pField}>
                  <label className={shared.pLabel}>Dates Absent</label>
                  <div className={styles.requestFormGrid}>
                    <div className={shared.pField}>
                      <label className={shared.pLabel} htmlFor="absence-start-date">
                        Start Date
                      </label>
                      <input
                        id="absence-start-date"
                        type="date"
                        className="text-input"
                        value={absenceStartDate}
                        onChange={(event) => setAbsenceStartDate(event.target.value)}
                        required
                      />
                    </div>
                    <div className={shared.pField}>
                      <label className={shared.pLabel} htmlFor="absence-end-date">
                        End Date
                      </label>
                      <input
                        id="absence-end-date"
                        type="date"
                        className="text-input"
                        value={absenceEndDate}
                        onChange={(event) => setAbsenceEndDate(event.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <p className={styles.requestDatePreview}>
                    {datesAbsent || "Select dates to populate the request"}
                  </p>
                </div>
              </div>

              <div className={styles.requestSection}>
                <p className={styles.requestSectionTitle}>Reason For Absence</p>
                <div className={styles.requestReasonList}>
                  {(Object.keys(TIME_OFF_REASON_LABELS) as TimeOffReason[]).map(
                    (option) => (
                      <label
                        key={option}
                        className={`${styles.requestChoiceRow} ${reason === option ? styles.selected : ""}`}
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

                <div className={shared.pField}>
                  <label className={shared.pLabel} htmlFor="request-explanation">
                    Other, Explain
                  </label>
                  <textarea
                    id="request-explanation"
                    className="text-input"
                    rows={3}
                    value={explanation}
                    onChange={(event) => setExplanation(event.target.value)}
                    placeholder="Add details if needed"
                    style={{ resize: "vertical" }}
                  />
                </div>
              </div>

              <div className={styles.requestSection}>
                <p className={styles.requestSectionTitle}>Request Timing</p>
                <div className={styles.requestWindowGrid}>
                  {(Object.keys(TIME_OFF_WINDOW_LABELS) as TimeOffWindow[]).map(
                    (option) => (
                      <label
                        key={option}
                        className={`${styles.requestWindowCard} ${requestWindow === option ? styles.selected : ""}`}
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
                    ),
                  )}
                </div>
              </div>

              <button className={`primary-button ${styles.requestSubmitButton}`} type="submit">
                Submit Request
              </button>
            </form>
          </div>
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
