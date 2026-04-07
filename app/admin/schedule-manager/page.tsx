"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import { useAdminProperty } from "@/components/admin-property-provider";
import { AdminScheduleImport } from "@/components/admin-schedule-import";
import { getScheduleShiftFamily, isScheduleStatusToken } from "@/lib/schedule-color-system";
import {
  getPublishedScheduleTitle,
  loadPublishedSchedules,
  PUBLISHED_SCHEDULE_UPDATED_EVENT,
  savePublishedSchedulesForProperty,
  type PublishedSchedulePreview,
} from "@/lib/published-schedule-store";

type ScheduleManagerTab = "import" | "published" | "edit";

type EmployeeMatch = {
  key: string;
  scheduleTitle: string;
  scheduleIndex: number;
  sheetName: string;
  sheetDisplayName: string;
  name: string;
  shifts: string[];
  dayHeaders: string[];
  dateHeaders: string[];
  rowIndex: number;
};

function renderPublishedScheduleCell(value: string, key: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return <td key={key} />;
  }

  const family = getScheduleShiftFamily(trimmedValue);

  if (family) {
    return (
      <td key={key}>
        <span
          className={`schedule-import-shift-card schedule-import-shift-card-${family.tone} schedule-import-shift-card-compact`}
        >
          {trimmedValue}
        </span>
      </td>
    );
  }

  if (isScheduleStatusToken(trimmedValue)) {
    return (
      <td key={key}>
        <span className="schedule-import-status-chip">{trimmedValue}</span>
      </td>
    );
  }

  return <td key={key}>{trimmedValue}</td>;
}

export default function AdminScheduleManagerPage() {
  const adminProperty = useAdminProperty();
  const [activeTab, setActiveTab] = useState<ScheduleManagerTab>("import");
  const [publishedSchedules, setPublishedSchedules] = useState<PublishedSchedulePreview[]>([]);
  const [expandedScheduleTitle, setExpandedScheduleTitle] = useState<string | null>(null);
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [selectedEmployeeKey, setSelectedEmployeeKey] = useState<string | null>(null);
  const [selectedScheduleTitle, setSelectedScheduleTitle] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  useEffect(() => {
    const syncSchedules = () => {
      const loaded = loadPublishedSchedules(adminProperty?.propertyKey);
      setPublishedSchedules(loaded);

      const firstTitle = loaded[0] ? getPublishedScheduleTitle(loaded[0]) : null;
      setExpandedScheduleTitle((current) =>
        current && loaded.some((schedule) => getPublishedScheduleTitle(schedule) === current)
          ? current
          : firstTitle,
      );
      setSelectedScheduleTitle((current) =>
        current && loaded.some((schedule) => getPublishedScheduleTitle(schedule) === current)
          ? current
          : firstTitle,
      );
    };

    if (adminProperty?.propertyKey) {
      syncSchedules();
      window.addEventListener(PUBLISHED_SCHEDULE_UPDATED_EVENT, syncSchedules);
    }

    return () => window.removeEventListener(PUBLISHED_SCHEDULE_UPDATED_EVENT, syncSchedules);
  }, [adminProperty?.propertyKey]);

  const selectedSchedule =
    publishedSchedules.find((schedule) => getPublishedScheduleTitle(schedule) === selectedScheduleTitle) ??
    publishedSchedules[0] ??
    null;

  const employeeMatches = useMemo(() => {
    if (!selectedSchedule) {
      return [] as EmployeeMatch[];
    }

    const normalizedQuery = employeeQuery.trim().toLowerCase();
    const scheduleTitle = getPublishedScheduleTitle(selectedSchedule);

    const matches = selectedSchedule.sheets.flatMap((sheet) =>
      sheet.scheduleRows.map((row, index) => ({
        key: `${scheduleTitle}:${sheet.sheetName}:${index}`,
        scheduleTitle,
        scheduleIndex: publishedSchedules.findIndex(
          (schedule) => getPublishedScheduleTitle(schedule) === scheduleTitle,
        ),
        sheetName: sheet.sheetName,
        sheetDisplayName: sheet.displayName,
        name: row.name,
        shifts: row.shifts,
        dayHeaders: sheet.dayHeaders,
        dateHeaders: sheet.dateHeaders,
        rowIndex: index,
      })),
    );

    if (!normalizedQuery) {
      return matches;
    }

    return matches.filter((match) => match.name.toLowerCase().includes(normalizedQuery));
  }, [employeeQuery, publishedSchedules, selectedSchedule]);

  const selectedEmployee =
    employeeMatches.find((match) => match.key === selectedEmployeeKey) ??
    null;

  function updateSelectedEmployeeShift(dayIndex: number, value: string) {
    if (!selectedEmployee) {
      return;
    }

    const nextSchedules = publishedSchedules.map((schedule) => {
      if (getPublishedScheduleTitle(schedule) !== selectedEmployee.scheduleTitle) {
        return schedule;
      }

      return {
        ...schedule,
        sheets: schedule.sheets.map((sheet) => {
          if (sheet.sheetName !== selectedEmployee.sheetName) {
            return sheet;
          }

          return {
            ...sheet,
            scheduleRows: sheet.scheduleRows.map((row, index) =>
              index === selectedEmployee.rowIndex
                ? {
                    ...row,
                    shifts: row.shifts.map((shift, shiftIndex) =>
                      shiftIndex === dayIndex ? value : shift,
                    ),
                  }
                : row,
            ),
          };
        }),
      };
    });

    setPublishedSchedules(nextSchedules);
  }

  function handleSaveEmployeeSchedule() {
    if (!selectedEmployee) {
      return;
    }

    savePublishedSchedulesForProperty(adminProperty?.propertyKey, publishedSchedules);
    setEditSuccess(`${selectedEmployee.name}'s published schedule was updated.`);
  }

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Schedule Manager</h1>
        <p className="admin-page-subtitle">
          Import, review, and manage published weekly schedules for {adminProperty?.propertyName ?? "this property"}.
        </p>
        <nav className="admin-page-tabs" aria-label="Schedule views">
          <button
            type="button"
            className={`admin-page-tab${activeTab === "import" ? " active" : ""}`}
            onClick={() => setActiveTab("import")}
          >
            Import Schedule
          </button>
          <button
            type="button"
            className={`admin-page-tab${activeTab === "published" ? " active" : ""}`}
            onClick={() => setActiveTab("published")}
          >
            Published Schedule
          </button>
          <button
            type="button"
            className={`admin-page-tab${activeTab === "edit" ? " active" : ""}`}
            onClick={() => setActiveTab("edit")}
          >
            Edit Schedule
          </button>
        </nav>
      </header>

      <div className="admin-content">
        {activeTab === "import" ? (
          <AdminScheduleImport />
        ) : activeTab === "published" ? (
          publishedSchedules.length > 0 ? (
            <div className="stack">
              {publishedSchedules.map((schedule) => {
                const title = getPublishedScheduleTitle(schedule);
                const isExpanded = expandedScheduleTitle === title;

                return (
                  <div key={title} className="result-card">
                    <button
                      type="button"
                      className="published-schedule-row"
                      onClick={() => setExpandedScheduleTitle(isExpanded ? null : title)}
                    >
                      <div>
                        <p className="result-title">{title}</p>
                        <p className="result-subtitle">{schedule.sheets.length} page{schedule.sheets.length === 1 ? "" : "s"}</p>
                      </div>
                      {isExpanded ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
                    </button>

                    {isExpanded ? (
                      <div className="stack published-schedule-expanded">
                        <div className="result-card">
                          <p className="mini-label">Shift Families</p>
                          <div className="schedule-import-shift-legend">
                            {schedule.shiftFamilies.map((family) => (
                              <div
                                key={`${title}-${family.familyLabel}`}
                                className={`schedule-import-shift-card schedule-import-shift-card-${family.tone}`}
                              >
                                <span>{family.familyLabel}</span>
                                <strong>{family.displayLabel}</strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        {schedule.sheets.map((sheet) => (
                          <div key={`${title}-${sheet.sheetName}`} className="result-card schedule-import-sheet-card">
                            <div className="result-card-header">
                              <div>
                                <p className="result-title">{sheet.displayName}</p>
                              </div>
                            </div>

                            <div className="preview-table-wrapper">
                              <table className="preview-table schedule-import-preview-table">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    {sheet.dayHeaders.map((header) => (
                                      <th key={`${title}-${sheet.sheetName}-${header}`}>{header}</th>
                                    ))}
                                  </tr>
                                  <tr>
                                    <th />
                                    {sheet.dateHeaders.map((header) => (
                                      <th key={`${title}-${sheet.sheetName}-${header}-date`}>{header}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {sheet.scheduleRows.map((row, rowIndex) => (
                                    <tr key={`${title}-${sheet.sheetName}-row-${rowIndex + 1}`}>
                                      <td>{row.name}</td>
                                      {row.shifts.map((cell, cellIndex) =>
                                        renderPublishedScheduleCell(
                                          cell,
                                          `${title}-${sheet.sheetName}-${rowIndex + 1}-${cellIndex + 1}`,
                                        ),
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="coming-soon-card">
              <div className="coming-soon-icon">
                <CalendarDays size={22} aria-hidden="true" />
              </div>
              <p className="coming-soon-title">No published schedules yet</p>
              <p className="coming-soon-body">
                Import and publish a weekly schedule first, then it will appear here by week.
              </p>
            </div>
          )
        ) : selectedSchedule ? (
          <div className="admin-grid">
            <div className="admin-card admin-schedule-edit-card">
              <div className="admin-card-header">
                <div>
                  <p className="admin-card-title">Find Employee</p>
                  <p className="admin-card-subtitle">Search by employee name to load a published week.</p>
                </div>
              </div>
              <div className="admin-card-body stack">
                <div className="field-stack">
                  <label className="field-label" htmlFor="schedule-week-select">
                    Published Week
                  </label>
                  <select
                    id="schedule-week-select"
                    className="text-input"
                    value={selectedScheduleTitle ?? ""}
                    onChange={(event) => {
                      setSelectedScheduleTitle(event.target.value);
                      setSelectedEmployeeKey(null);
                      setEditSuccess(null);
                    }}
                  >
                    {publishedSchedules.map((schedule) => {
                      const title = getPublishedScheduleTitle(schedule);
                      return (
                        <option key={title} value={title}>
                          {title}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="field-stack">
                  <label className="field-label" htmlFor="schedule-employee-search">
                    Employee Name
                  </label>
                  <input
                    id="schedule-employee-search"
                    className="text-input"
                    value={employeeQuery}
                    onChange={(event) => {
                      setEmployeeQuery(event.target.value);
                      setSelectedEmployeeKey(null);
                      setEditSuccess(null);
                    }}
                    placeholder="Start typing an employee name"
                  />
                </div>

                {employeeQuery.trim() ? (
                  <div className="data-list admin-schedule-edit-results">
                    {employeeMatches.slice(0, 20).map((match) => (
                      <button
                        key={match.key}
                        type="button"
                        className={`admin-directory-result${selectedEmployeeKey === match.key ? " active" : ""}`}
                        onClick={() => {
                          setSelectedEmployeeKey(match.key);
                          setEditSuccess(null);
                        }}
                      >
                        <span>
                          <strong>{match.name}</strong>
                          <small>{match.sheetDisplayName}</small>
                        </span>
                        <span className="secondary-button">Edit</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="admin-card admin-schedule-edit-card">
              <div className="admin-card-header">
                <div>
                  <p className="admin-card-title">Edit Published Week</p>
                  <p className="admin-card-subtitle">
                    {selectedEmployee
                      ? `${selectedEmployee.name} · ${selectedEmployee.sheetDisplayName}`
                      : "Choose an employee from the left to populate their week."}
                  </p>
                </div>
              </div>
              <div className="admin-card-body stack">
                {selectedEmployee ? (
                  <>
                    <div className="form-grid">
                      {selectedEmployee.dayHeaders.map((day, index) => (
                        <div key={`${selectedEmployee.key}-${day}`} className="field-stack">
                          <label className="field-label" htmlFor={`${selectedEmployee.key}-${day}`}>
                            {day}
                          </label>
                          <input
                            id={`${selectedEmployee.key}-${day}`}
                            className="text-input"
                            value={selectedEmployee.shifts[index] ?? ""}
                            onChange={(event) => updateSelectedEmployeeShift(index, event.target.value)}
                            placeholder={selectedEmployee.dateHeaders[index] ?? ""}
                          />
                        </div>
                      ))}
                    </div>

                    <button type="button" className="primary-button" onClick={handleSaveEmployeeSchedule}>
                      Save Published Schedule
                    </button>
                    {editSuccess ? <p className="status-text success">{editSuccess}</p> : null}
                  </>
                ) : (
                  <div className="coming-soon-card">
                    <p className="coming-soon-title">Choose an employee</p>
                    <p className="coming-soon-body">
                      Search by name and select the correct employee to populate their published week.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="coming-soon-card">
            <div className="coming-soon-icon">
              <CalendarDays size={22} aria-hidden="true" />
            </div>
            <p className="coming-soon-title">No published schedules yet</p>
            <p className="coming-soon-body">
              Import a weekly schedule first and it will appear here as the published view.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
