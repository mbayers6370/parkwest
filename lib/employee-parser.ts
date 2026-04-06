import * as XLSX from "xlsx";

export type EmployeeImportPreview = {
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  rowCount: number;
  headers: string[];
  previewRows: Record<string, string>[];
};

export type ParsedEmployeeWorkbook = EmployeeImportPreview & {
  rows: Record<string, string>[];
};

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

export function parseEmployeeWorkbook(
  fileName: string,
  buffer: Buffer,
): ParsedEmployeeWorkbook {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const selectedSheet = workbook.SheetNames[0];

  if (!selectedSheet) {
    throw new Error("The uploaded workbook does not contain any sheets.");
  }

  const worksheet = workbook.Sheets[selectedSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const normalizedRows = rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, normalizeCellValue(value)]),
    ),
  );

  return {
    fileName,
    sheetNames: workbook.SheetNames,
    selectedSheet,
    rowCount: rows.length,
    headers,
    previewRows: normalizedRows.slice(0, 8),
    rows: normalizedRows,
  };
}
