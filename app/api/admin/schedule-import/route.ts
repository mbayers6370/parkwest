import { ScheduleImportStatus, ScheduleImportMatchStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { isMockModeEnabled } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { parseScheduleWorkbook } from "@/lib/schedule-parser";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please attach an Excel file." }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isSupported =
      fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv");

    if (!isSupported) {
      return NextResponse.json(
        { error: "Only .xlsx, .xls, and .csv files are supported right now." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const preview = parseScheduleWorkbook(file.name, buffer);

    const shouldPersist = formData.get("persist") === "true";
    let importBatchId: string | null = null;

    if (isMockModeEnabled()) {
      return NextResponse.json({
        preview,
        importBatchId: shouldPersist ? `mock-import-${Date.now()}` : null,
        mockMode: true,
      });
    }

    if (shouldPersist) {
      const batch = await prisma.scheduleImportBatch.create({
        data: {
          originalFilename: file.name,
          fileType: file.type || "application/octet-stream",
          importStatus: ScheduleImportStatus.NEEDS_REVIEW,
          weekStart: new Date(),
          weekEnd: new Date(),
          totalRows: preview.rowCount,
          matchedRows: 0,
          unmatchedRows: preview.rowCount,
          ambiguousRows: 0,
          rows: {
            create: preview.rows.map((row, index) => ({
              sourceRowNumber: index + 1,
              sourceEmployeeName:
                row.Name ??
                row.name ??
                row.Employee ??
                row.employee ??
                row.EmployeeName ??
                row.employeeName ??
                "",
              normalizedSourceEmployeeName: (
                row.Name ??
                row.name ??
                row.Employee ??
                row.employee ??
                row.EmployeeName ??
                row.employeeName ??
                ""
              )
                .toLowerCase()
                .replace(/[^\p{L}\p{N}]+/gu, " ")
                .trim(),
              matchStatus: ScheduleImportMatchStatus.UNMATCHED,
              rawPayloadJson: row,
            })),
          },
        },
        select: {
          id: true,
        },
      });

      importBatchId = batch.id;
    }

    return NextResponse.json({ preview, importBatchId });
  } catch (error) {
    console.error("Schedule import preview failed", error);

    return NextResponse.json(
      {
        error:
          "The file could not be parsed or saved. Please check the spreadsheet format and database setup.",
      },
      { status: 500 },
    );
  }
}
