"use client";

import { FormEvent, useState } from "react";
import { useAdminProperty } from "@/components/admin-property-provider";
import { CircleAlert, CloudUpload, FileSpreadsheet } from "lucide-react";
import { getScheduleShiftFamily, isScheduleStatusToken, type ScheduleShiftFamily } from "@/lib/schedule-color-system";
import {
  getPublishedScheduleTitle,
  loadPublishedSchedules,
  upsertPublishedSchedule,
} from "@/lib/published-schedule-store";

type SchedulePreview = {
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  rowCount: number;
  totalRows: number;
  headers: string[];
  previewRows: Record<string, string>[];
  sheets: {
    sheetName: string;
    displayName: string;
    dayHeaders: string[];
    dateHeaders: string[];
    scheduleRows: {
      name: string;
      shifts: string[];
    }[];
    detectedShifts: string[];
  }[];
  shiftFamilies: ScheduleShiftFamily[];
};

function renderSchedulePreviewCell(value: string, key: string, compact = false) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return <td key={key} />;
  }

  const family = getScheduleShiftFamily(trimmedValue);

  if (family) {
    return (
      <td key={key}>
        <span
          className={`schedule-import-shift-card schedule-import-shift-card-${family.tone}${compact ? " schedule-import-shift-card-compact" : ""}`}
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

export function AdminScheduleImport() {
  const adminProperty = useAdminProperty();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const [preview, setPreview] = useState<SchedulePreview | null>(null);
  const [publishConflict, setPublishConflict] = useState<{
    incomingWeek: string;
    currentWeek: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose a spreadsheet file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("persist", "true");
      if (adminProperty?.propertyKey) {
        formData.append("propertyKey", adminProperty.propertyKey);
      }

      const response = await fetch("/api/admin/schedule-import", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        preview?: SchedulePreview;
        importBatchId?: string | null;
        error?: string;
        mockMode?: boolean;
        persistenceMessage?: string;
      };

      if (!response.ok || !data.preview) {
        throw new Error(data.error ?? "The spreadsheet could not be parsed.");
      }

      setPreview(data.preview);
      setMockMode(Boolean(data.mockMode));
      if (data.persistenceMessage) {
        setSuccess(data.persistenceMessage);
      } else if (data.importBatchId) {
        setSuccess(
          `Saved import batch ${data.importBatchId}.${data.mockMode ? " Ready to publish in mock mode." : ""}`,
        );
      }
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handlePublish() {
    if (!preview) {
      return;
    }

    const publishedSchedules = loadPublishedSchedules(adminProperty?.propertyKey);
    const incomingWeek = preview.sheets[0]?.displayName ?? preview.fileName;
    const currentSchedule = publishedSchedules.find(
      (entry) => getPublishedScheduleTitle(entry) === incomingWeek || entry.fileName === preview.fileName,
    );

    if (currentSchedule) {
      setPublishConflict({
        incomingWeek,
        currentWeek: getPublishedScheduleTitle(currentSchedule),
      });
      return;
    }

    publishSchedule();
  }

  function publishSchedule() {
    if (!preview) {
      return;
    }

    upsertPublishedSchedule({
      propertyKey: adminProperty?.propertyKey,
      propertyName: adminProperty?.propertyName,
      fileName: preview.fileName,
      sheetNames: preview.sheetNames,
      sheets: preview.sheets,
      shiftFamilies: preview.shiftFamilies,
    });
    setPublishConflict(null);
    setSuccess(
      `${preview.sheets[0]?.displayName ?? preview.fileName} was published successfully.${mockMode ? " Mock mode is on." : ""}`,
    );
  }

  return (
    <>
      <div className="stack">
      <form className="stack" onSubmit={handleSubmit}>
        <section className="schedule-import-upload-card">
          <div className="schedule-import-upload-head">
            <div className="schedule-import-upload-head-icon">
              <CloudUpload size={24} aria-hidden="true" />
            </div>
            <div>
              <p className="schedule-import-upload-title">Upload schedule file</p>
              <p className="schedule-import-upload-subtitle">
                Select the weekly spreadsheet for {adminProperty?.propertyName ?? "this property"} and preview it before publishing.
              </p>
            </div>
          </div>

          <label className="schedule-import-dropzone" htmlFor="schedule-file">
            <input
              id="schedule-file"
              className="schedule-import-file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />

            <div className="schedule-import-dropzone-icon">
              <FileSpreadsheet size={22} aria-hidden="true" />
            </div>
            <p className="schedule-import-dropzone-title">
              Choose a file or drag and drop it here
            </p>
            <p className="schedule-import-dropzone-copy">
              Excel and CSV formats supported for weekly schedule uploads.
            </p>
            <span className="secondary-button schedule-import-dropzone-button">
              Browse File
            </span>
          </label>

          <div className="schedule-import-actions">
            {file ? (
              <div className="schedule-import-selected-file">
                <div className="schedule-import-selected-file-icon">
                  <FileSpreadsheet size={18} aria-hidden="true" />
                </div>
                <div>
                  <p className="schedule-import-selected-file-name">{file.name}</p>
                  <p className="schedule-import-selected-file-meta">Ready for preview</p>
                </div>
              </div>
            ) : (
              <div className="schedule-import-selected-file schedule-import-selected-fileEmpty">
                <div>
                  <p className="schedule-import-selected-file-name">No file selected</p>
                  <p className="schedule-import-selected-file-meta">
                    Choose a spreadsheet to preview it below.
                  </p>
                </div>
              </div>
            )}

            <button
              className="primary-button schedule-import-submit"
              type="submit"
              disabled={loading || !file}
            >
              {loading ? "Reading file..." : "Preview Spreadsheet"}
            </button>
          </div>
        </section>
      </form>

      {mockMode ? (
        <div className="result-card">
          <p className="mini-label">Mock Mode</p>
          <p className="mini-title">Import persistence is simulated</p>
          <p className="mini-copy">
            Spreadsheet parsing is real, but database persistence is disabled until we turn the
            database back on.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="notice-card danger">
          <CircleAlert size={16} aria-hidden="true" />
          <div>
            <p className="notice-title">Import error</p>
            <p className="notice-body">{error}</p>
          </div>
        </div>
      ) : null}
      {success ? (
        <div className="notice-card ok">
          <div>
            <p className="notice-title">Publish successful</p>
            <p className="notice-body">{success}</p>
          </div>
        </div>
      ) : null}

        {preview ? (
          <section className="stack">
          <div className="result-card schedule-import-summary-card">
            <div className="result-card-header">
              <div>
                <p className="result-title">{preview.fileName}</p>
                <p className="result-subtitle">
                  {preview.sheets.length} imported page
                  {preview.sheetNames.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="schedule-import-top-actions">
                <button type="button" className="primary-button" onClick={handlePublish}>
                  Publish Schedule
                </button>
              </div>
            </div>
          </div>

          <div className="result-card">
            <p className="mini-label">Shift Families</p>
            <div className="schedule-import-shift-legend">
              {preview.shiftFamilies.length > 0 ? (
                preview.shiftFamilies.map((family) => (
                  <div
                    key={family.familyLabel}
                    className={`schedule-import-shift-card schedule-import-shift-card-${family.tone}`}
                  >
                    <span>{family.familyLabel}</span>
                    <strong>{family.displayLabel}</strong>
                  </div>
                ))
              ) : (
                <span className="badge warning">No shift families detected</span>
              )}
            </div>
          </div>

            {preview.sheets.map((sheet) => (
              <div key={sheet.sheetName} className="result-card schedule-import-sheet-card">
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
                        <th key={`${sheet.sheetName}-${header}`}>{header}</th>
                      ))}
                    </tr>
                    <tr>
                      <th />
                      {sheet.dateHeaders.map((header) => (
                        <th key={`${sheet.sheetName}-${header}`}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.scheduleRows.map((row, rowIndex) => (
                      <tr key={`${sheet.sheetName}-preview-row-${rowIndex + 1}`}>
                        <td>{row.name}</td>
                        {row.shifts.map((cell, cellIndex) =>
                          renderSchedulePreviewCell(
                            cell,
                            `${sheet.sheetName}-${rowIndex + 1}-${cellIndex + 1}`,
                            true,
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            ))}
          </section>
        ) : null}
      </div>
      {publishConflict ? (
        <div className="admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="publish-overwrite-title">
          <div className="admin-confirm-modal">
            <div className="admin-confirm-header">
              <div>
                <p className="admin-confirm-title" id="publish-overwrite-title">
                  This schedule has already been published
                </p>
                <p className="admin-confirm-copy">
                  {publishConflict.currentWeek} is already in Published Schedule. Would you like to replace it with {publishConflict.incomingWeek}?
                </p>
              </div>
            </div>
            <div className="admin-confirm-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPublishConflict(null)}
              >
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={publishSchedule}>
                Replace Schedule
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
