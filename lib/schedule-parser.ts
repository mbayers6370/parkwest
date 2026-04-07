import * as XLSX from "xlsx";
import { normalizeCellValue } from "@/lib/workbook-utils";
import { getScheduleShiftFamilies } from "@/lib/schedule-color-system";

export type SchedulePreview = {
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  rowCount: number;
  totalRows: number;
  headers: string[];
  previewRows: Record<string, string>[];
  sheets: SchedulePreviewSheet[];
  shiftFamilies: ReturnType<typeof getScheduleShiftFamilies>;
};

export type ParsedScheduleWorkbook = SchedulePreview & {
  rows: ParsedScheduleRow[];
};

export type SchedulePreviewSheet = {
  sheetName: string;
  displayName: string;
  dayHeaders: string[];
  dateHeaders: string[];
  scheduleRows: {
    name: string;
    shifts: string[];
  }[];
  detectedShifts: string[];
};

export type ParsedScheduleRow = {
  sheetName: string;
  rowNumber: number;
  cells: string[];
};

function trimTrailingEmptyCells(row: string[]) {
  let lastValueIndex = row.length - 1;

  while (lastValueIndex >= 0 && row[lastValueIndex] === "") {
    lastValueIndex -= 1;
  }

  return row.slice(0, lastValueIndex + 1);
}

function looksLikeDayHeaderRow(row: string[]) {
  const values = row.slice(1, 8).map((value) => value.trim().toLowerCase());
  const dayNames = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

  return values.length === 7 && values.every((value, index) => value === dayNames[index]);
}

function looksLikeDateHeaderRow(row: string[]) {
  const values = row.slice(1, 8).map((value) => value.trim());

  return values.every((value) => /^\d{1,2}-[a-z]{3}$/i.test(value));
}

function formatSheetDisplayName(dateHeaders: string[]) {
  const first = dateHeaders[0];
  const last = dateHeaders[dateHeaders.length - 1];

  if (!first || !last) {
    return "Imported Schedule";
  }

  const [firstDay, firstMonth] = first.split("-");
  const [lastDay] = last.split("-");

  return `${firstMonth} ${firstDay} - ${lastDay}`;
}

export function parseScheduleWorkbook(
  fileName: string,
  buffer: Buffer,
): ParsedScheduleWorkbook {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const selectedSheet = workbook.SheetNames[0];

  if (!selectedSheet) {
    throw new Error("The uploaded workbook does not contain any sheets.");
  }

  const parsedRows: ParsedScheduleRow[] = [];
  const allShiftTokens: string[] = [];

  const sheets = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    const normalizedMatrix = matrix.map((row) => trimTrailingEmptyCells(row.map(normalizeCellValue)));
    const sheetShiftTokens: string[] = [];

    normalizedMatrix.forEach((cells, index) => {
      parsedRows.push({
        sheetName,
        rowNumber: index + 1,
        cells,
      });

      for (const cell of cells) {
        if (cell.includes(":")) {
          allShiftTokens.push(cell);
          sheetShiftTokens.push(cell);
        }
      }
    });

    const dayHeaderIndex = normalizedMatrix.findIndex(looksLikeDayHeaderRow);
    const dateHeaderIndex =
      dayHeaderIndex >= 0 && dayHeaderIndex + 1 < normalizedMatrix.length && looksLikeDateHeaderRow(normalizedMatrix[dayHeaderIndex + 1])
        ? dayHeaderIndex + 1
        : -1;

    const dayHeaders =
      dayHeaderIndex >= 0 ? normalizedMatrix[dayHeaderIndex].slice(1, 8).map((value) => value.trim()) : [];
    const dateHeaders =
      dateHeaderIndex >= 0 ? normalizedMatrix[dateHeaderIndex].slice(1, 8).map((value) => value.trim()) : [];

    const scheduleRows =
      dateHeaderIndex >= 0
        ? normalizedMatrix
            .slice(dateHeaderIndex + 1)
            .map((row) => ({
              name: (row[0] ?? "").trim(),
              shifts: Array.from({ length: 7 }, (_, index) => (row[index + 1] ?? "").trim()),
            }))
            .filter((row) => row.name.length > 0)
        : [];

    const detectedShifts = getScheduleShiftFamilies(sheetShiftTokens)
      .map((family) => family.displayLabel);

    return {
      sheetName,
      displayName: formatSheetDisplayName(dateHeaders),
      dayHeaders,
      dateHeaders,
      scheduleRows,
      detectedShifts,
    };
  });

  const firstSheet = sheets[0];
  const previewRows = firstSheet.scheduleRows.slice(0, 8).map((row) =>
    Object.fromEntries([
      ["Name", row.name],
      ...row.shifts.map((shift, index) => [firstSheet.dayHeaders[index] ?? `Day ${index + 1}`, shift]),
    ]),
  );

  return {
    fileName,
    sheetNames: workbook.SheetNames,
    selectedSheet,
    rowCount: parsedRows.length,
    totalRows: parsedRows.length,
    headers: ["Name", ...firstSheet.dayHeaders],
    previewRows,
    sheets,
    shiftFamilies: getScheduleShiftFamilies(allShiftTokens),
    rows: parsedRows,
  };
}
