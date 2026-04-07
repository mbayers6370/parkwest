import { ScheduleImportStatus, ScheduleImportMatchStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { isMockModeEnabled } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { findDefaultPropertyByKey } from "@/lib/properties";
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
    const propertyKey = String(formData.get("propertyKey") ?? "").trim().toLowerCase();
    const property = propertyKey ? findDefaultPropertyByKey(propertyKey) : null;

    const shouldPersist = formData.get("persist") === "true";
    let importBatchId: string | null = null;
    const databaseConfigured = Boolean(process.env.DATABASE_URL);

    if (isMockModeEnabled() || !databaseConfigured) {
      return NextResponse.json({
        preview,
        importBatchId: shouldPersist ? `mock-import-${Date.now()}` : null,
        mockMode: true,
        persistenceMessage: databaseConfigured
          ? "Import persistence is currently running in mock mode."
          : "Spreadsheet preview is available, but the database is not configured yet.",
      });
    }

    if (shouldPersist) {
      const propertyRecord = property
        ? await prisma.property.upsert({
            where: {
              propertyKey: property.key,
            },
            update: {
              propertyName: property.name,
            },
            create: {
              propertyKey: property.key,
              propertyName: property.name,
            },
            select: {
              id: true,
            },
          })
        : null;

      const batch = await prisma.scheduleImportBatch.create({
        data: {
          propertyIdFk: propertyRecord?.id,
          originalFilename: file.name,
          fileType: file.type || "application/octet-stream",
          importStatus: ScheduleImportStatus.NEEDS_REVIEW,
          weekStart: new Date(),
          weekEnd: new Date(),
          totalRows: preview.totalRows,
          matchedRows: 0,
          unmatchedRows: preview.totalRows,
          ambiguousRows: 0,
          rows: {
            create: preview.rows.map((row) => ({
              sourceRowNumber: row.rowNumber,
              sourceEmployeeName: row.cells[0] ?? "",
              normalizedSourceEmployeeName: (row.cells[0] ?? "")
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

    return NextResponse.json({ preview, importBatchId, mockMode: false });
  } catch (error) {
    console.error("Schedule import preview failed", error);

    return NextResponse.json(
      {
        error:
          "The spreadsheet could not be previewed. Please check the file format and try again.",
      },
      { status: 500 },
    );
  }
}
