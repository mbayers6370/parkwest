import * as XLSX from "xlsx";
import { normalizeCellValue } from "@/lib/workbook-utils";

export type SchedulePreview = {
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  rowCount: number;
  headers: string[];
  previewRows: Record<string, string>[];
};

export type ParsedScheduleWorkbook = SchedulePreview & {
  rows: Record<string, string>[];
};

export function parseScheduleWorkbook(
  fileName: string,
  buffer: Buffer,
): ParsedScheduleWorkbook {
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
  const previewRows = normalizedRows.slice(0, 8);

  return {
    fileName,
    sheetNames: workbook.SheetNames,
    selectedSheet,
    rowCount: rows.length,
    headers,
    previewRows,
    rows: normalizedRows,
  };
}
