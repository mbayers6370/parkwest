"use client";

import { FormEvent, useState } from "react";
import { CircleAlert, CloudUpload, FileSpreadsheet } from "lucide-react";

type SchedulePreview = {
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  rowCount: number;
  headers: string[];
  previewRows: Record<string, string>[];
};

export function AdminScheduleImport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const [preview, setPreview] = useState<SchedulePreview | null>(null);

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

      const response = await fetch("/api/admin/schedule-import", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        preview?: SchedulePreview;
        importBatchId?: string | null;
        error?: string;
        mockMode?: boolean;
      };

      if (!response.ok || !data.preview) {
        throw new Error(data.error ?? "The spreadsheet could not be parsed.");
      }

      setPreview(data.preview);
      setMockMode(Boolean(data.mockMode));
      if (data.importBatchId) {
        setSuccess(
          `Saved import batch ${data.importBatchId}.${data.mockMode ? " Mock mode is on, so this is only a simulated save." : ""}`,
        );
      }
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
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
                Select the weekly spreadsheet and preview it before publishing.
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
      {success ? <p className="status-text success">{success}</p> : null}

      {preview ? (
        <section className="stack">
          <div className="result-card">
            <div className="result-card-header">
              <div>
                <p className="result-title">{preview.fileName}</p>
                <p className="result-subtitle">
                  {preview.rowCount} rows in {preview.selectedSheet}
                </p>
              </div>
              <span className="badge success">Parsed</span>
            </div>

            <div className="badge-row">
              {preview.sheetNames.map((sheetName) => (
                <span
                  key={sheetName}
                  className={`badge ${sheetName === preview.selectedSheet ? "gold" : "warning"}`}
                >
                  {sheetName}
                </span>
              ))}
            </div>
          </div>

          <div className="result-card">
            <p className="mini-label">Detected Columns</p>
            <div className="badge-row">
              {preview.headers.length > 0 ? (
                preview.headers.map((header) => (
                  <span key={header} className="badge warning">
                    {header}
                  </span>
                ))
              ) : (
                <span className="badge warning">No headers detected</span>
              )}
            </div>
          </div>

          <div className="result-card">
            <p className="mini-label">Preview Rows</p>
            <div className="preview-table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    {preview.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.previewRows.map((row, index) => (
                    <tr key={`preview-row-${index + 1}`}>
                      {preview.headers.map((header) => (
                        <td key={`${header}-${index + 1}`}>{row[header] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
