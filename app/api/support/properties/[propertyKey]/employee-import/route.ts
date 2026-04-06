import {
  AliasType,
  EmployeeStatus,
  EmploymentType,
  WorkspaceKey,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { findDepartmentOptionByName } from "@/lib/employee-departments";
import { parseEmployeeWorkbook } from "@/lib/employee-parser";
import { isMockModeEnabled } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { findDefaultPropertyByKey } from "@/lib/properties";

function normalizeAlias(alias: string) {
  return alias.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function getCellValue(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value?.trim()) {
      return value.trim();
    }
  }

  return "";
}

function parseAliases(rawAliases: string, displayName: string) {
  return Array.from(
    new Set(
      [displayName, ...rawAliases.split(",")]
        .map((alias) => alias.trim())
        .filter(Boolean),
    ),
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyKey: string }> },
) {
  try {
    const { propertyKey } = await context.params;
    const property = findDefaultPropertyByKey(propertyKey);

    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please attach an employee file." }, { status: 400 });
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
    const preview = parseEmployeeWorkbook(file.name, buffer);
    const shouldPersist = formData.get("persist") === "true";

    const normalizedRows = preview.rows
      .map((row) => {
        const employeeId = getCellValue(
          row,
          "Employee ID",
          "EmployeeID",
          "employeeId",
          "ID",
          "Id",
        );
        const firstName = getCellValue(row, "First Name", "FirstName", "firstName");
        const lastName = getCellValue(row, "Last Name", "LastName", "lastName");
        const preferredName = getCellValue(
          row,
          "Preferred Name",
          "PreferredName",
          "preferredName",
        );
        const displayName =
          getCellValue(row, "Display Name", "DisplayName", "displayName", "Name", "name") ||
          preferredName ||
          [firstName, lastName].filter(Boolean).join(" ");
        const badgeId = getCellValue(row, "Badge ID", "BadgeID", "badgeId");
        const department = getCellValue(
          row,
          "Department",
          "department",
          "Dept",
          "dept",
          "Role",
          "role",
        );
        const aliases = getCellValue(row, "Aliases", "aliases", "Alias", "alias");

        return {
          employeeId,
          firstName,
          lastName,
          preferredName,
          displayName,
          badgeId,
          department,
          aliases,
        };
      })
      .filter((row) => row.employeeId && row.firstName && row.lastName && row.department);

    if (shouldPersist && normalizedRows.length === 0) {
      return NextResponse.json(
        { error: "No importable rows were found. Include employee ID, name, and department." },
        { status: 400 },
      );
    }

    if (isMockModeEnabled()) {
      return NextResponse.json({
        preview,
        importedCount: shouldPersist ? normalizedRows.length : 0,
        importBatchId: shouldPersist ? `mock-employee-import-${Date.now()}` : null,
        mockMode: true,
      });
    }

    let importBatchId: string | null = null;
    let importedCount = 0;

    if (shouldPersist) {
      const propertyRecord = await prisma.property.upsert({
        where: {
          propertyKey: property.key,
        },
        update: {
          propertyName: property.name,
          active: true,
        },
        create: {
          propertyKey: property.key,
          propertyName: property.name,
          active: true,
        },
        select: {
          id: true,
        },
      });

      const batch = await prisma.employeeImportBatch.create({
        data: {
          propertyIdFk: propertyRecord.id,
          originalFilename: file.name,
          fileType: file.type || "application/octet-stream",
          totalRows: normalizedRows.length,
        },
        select: {
          id: true,
        },
      });

      importBatchId = batch.id;

      for (const row of normalizedRows) {
        const departmentOption = findDepartmentOptionByName(row.department);

        if (!departmentOption) {
          continue;
        }

        const aliases = parseAliases(row.aliases, row.displayName);

        const employee = await prisma.employee.upsert({
          where: {
            propertyIdFk_employeeId: {
              propertyIdFk: propertyRecord.id,
              employeeId: row.employeeId,
            },
          },
          update: {
            firstName: row.firstName,
            lastName: row.lastName,
            preferredName: row.preferredName || null,
            displayName: row.displayName,
            badgeId: row.badgeId || null,
            status: EmployeeStatus.ACTIVE,
            employmentType: EmploymentType.OTHER,
            aliases: {
              deleteMany: {},
              create: aliases.map((alias, index) => ({
                aliasName: alias,
                normalizedAliasName: normalizeAlias(alias),
                aliasType: index === 0 ? AliasType.SCHEDULE : AliasType.MANUAL,
                isPrimary: index === 0,
              })),
            },
            departmentAssignments: {
              updateMany: {
                where: {
                  active: true,
                },
                data: {
                  active: false,
                  isPrimary: false,
                  endsAt: new Date(),
                },
              },
              create: {
                isPrimary: true,
                department: {
                  connectOrCreate: {
                    where: {
                      departmentKey: departmentOption.key,
                    },
                    create: {
                      departmentKey: departmentOption.key,
                      departmentName: departmentOption.name,
                    },
                  },
                },
              },
            },
          },
          create: {
            propertyIdFk: propertyRecord.id,
            employeeId: row.employeeId,
            firstName: row.firstName,
            lastName: row.lastName,
            preferredName: row.preferredName || null,
            displayName: row.displayName,
            badgeId: row.badgeId || null,
            status: EmployeeStatus.ACTIVE,
            employmentType: EmploymentType.OTHER,
            aliases: {
              create: aliases.map((alias, index) => ({
                aliasName: alias,
                normalizedAliasName: normalizeAlias(alias),
                aliasType: index === 0 ? AliasType.SCHEDULE : AliasType.MANUAL,
                isPrimary: index === 0,
              })),
            },
            workspaceAccess: {
              create: {
                workspaceKey: WorkspaceKey.PERSONAL,
              },
            },
            departmentAssignments: {
              create: {
                isPrimary: true,
                department: {
                  connectOrCreate: {
                    where: {
                      departmentKey: departmentOption.key,
                    },
                    create: {
                      departmentKey: departmentOption.key,
                      departmentName: departmentOption.name,
                    },
                  },
                },
              },
            },
          },
          select: {
            id: true,
          },
        });

        if (employee.id) {
          importedCount += 1;
        }
      }
    }

    return NextResponse.json({ preview, importBatchId, importedCount });
  } catch (error) {
    console.error("Employee import failed", error);

    return NextResponse.json(
      {
        error:
          "The employee file could not be parsed or saved. Check the spreadsheet format and database setup.",
      },
      { status: 500 },
    );
  }
}
