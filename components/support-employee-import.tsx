"use client";

import { FormEvent, useState } from "react";

type EmployeeImportPreview = {
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  rowCount: number;
  headers: string[];
  previewRows: Record<string, string>[];
};

type SupportEmployeeImportProps = {
  propertyKey: string;
  propertyName: string;
};

export function SupportEmployeeImport({
  propertyKey,
  propertyName,
}: SupportEmployeeImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const [preview, setPreview] = useState<EmployeeImportPreview | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose an employee spreadsheet first.");
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

      const response = await fetch(`/api/support/properties/${propertyKey}/employee-import`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        preview?: EmployeeImportPreview;
        importBatchId?: string | null;
        importedCount?: number;
        error?: string;
        mockMode?: boolean;
      };

      if (!response.ok || !data.preview) {
        throw new Error(data.error ?? "The employee spreadsheet could not be parsed.");
      }

      setPreview(data.preview);
      setMockMode(Boolean(data.mockMode));
      setSuccess(
        `Imported ${data.importedCount ?? 0} employees into ${propertyName}.${data.importBatchId ? ` Batch ${data.importBatchId}.` : ""}${data.mockMode ? " Mock mode is on, so this is only a simulated save." : ""}`,
      );
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <div className="mini-card">
        <p className="mini-label">Employee Import</p>
        <p className="mini-title">Load employees into {propertyName}</p>
        <p className="mini-copy">
          Upload an employee spreadsheet and write those records directly into the {propertyName}{" "}
          property scope.
        </p>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor={`employee-file-${propertyKey}`}>
          Spreadsheet file
        </label>
        <input
          id={`employee-file-${propertyKey}`}
          className="file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Importing employees..." : `Import employees into ${propertyName}`}
        </button>
      </form>

      {mockMode ? (
        <div className="result-card">
          <p className="mini-label">Mock Mode</p>
          <p className="mini-title">Employee imports are simulated</p>
          <p className="mini-copy">
            The file preview is real, but persistence is disabled until database writes are turned
            back on.
          </p>
        </div>
      ) : null}

      {error ? <p className="status-text error">{error}</p> : null}
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
              <span className="badge success">Imported</span>
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
        </section>
      ) : null}
    </div>
  );
}
