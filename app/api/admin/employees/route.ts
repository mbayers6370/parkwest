import { NextRequest, NextResponse } from "next/server";
import { AliasType, EmployeeStatus, EmploymentType, WorkspaceKey } from "@prisma/client";
import { isMockModeEnabled, mockEmployees } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";

function parseAliases(rawAliases: string) {
  return Array.from(
    new Set(
      rawAliases
        .split(",")
        .map((alias) => alias.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeAlias(alias: string) {
  return alias.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";

  if (isMockModeEnabled()) {
    const normalizedQuery = query.toLowerCase();
    const employees = mockEmployees.filter((employee) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        employee.displayName,
        employee.firstName,
        employee.lastName,
        employee.preferredName ?? "",
        ...employee.aliases.map((alias) => alias.aliasName),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    return NextResponse.json({ employees: employees.slice(0, query ? 12 : 20), mockMode: true });
  }

  try {
    const employees = await prisma.employee.findMany({
      where: query
        ? {
            OR: [
              {
                displayName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                firstName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                preferredName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                aliases: {
                  some: {
                    aliasName: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          }
        : undefined,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        displayName: true,
        preferredName: true,
        badgeId: true,
        status: true,
        employmentType: true,
        departmentAssignments: {
          where: {
            active: true,
          },
          select: {
            isPrimary: true,
            department: {
              select: {
                departmentName: true,
              },
            },
          },
        },
        aliases: {
          take: 3,
          orderBy: {
            isPrimary: "desc",
          },
          select: {
            aliasName: true,
          },
        },
      },
      orderBy: {
        displayName: "asc",
      },
      take: query ? 12 : 20,
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Employee search failed", error);

    return NextResponse.json(
      {
        employees: [],
        error:
          "Employee search is not available right now. Check the database connection and migrations.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    employeeId: string;
    firstName: string;
    lastName: string;
    preferredName?: string;
    displayName?: string;
    badgeId?: string;
    aliases?: string;
  };

  if (isMockModeEnabled()) {
    const aliases = parseAliases(body.aliases ?? "");
    const displayName =
      body.displayName?.trim() || body.preferredName?.trim() || `${body.firstName} ${body.lastName}`;

    return NextResponse.json({
      employee: {
        id: `mock-created-${Date.now()}`,
        employeeId: body.employeeId.trim(),
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        displayName,
        preferredName: body.preferredName?.trim() || null,
        badgeId: body.badgeId?.trim() || null,
        status: "ACTIVE",
        employmentType: "OTHER",
        departmentAssignments: [],
        aliases: aliases.map((alias) => ({
          aliasName: alias,
        })),
      },
      mockMode: true,
    });
  }

  try {
    const aliases = parseAliases(body.aliases ?? "");
    const displayName =
      body.displayName?.trim() || body.preferredName?.trim() || `${body.firstName} ${body.lastName}`;

    const employee = await prisma.employee.create({
      data: {
        employeeId: body.employeeId.trim(),
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        preferredName: body.preferredName?.trim() || null,
        displayName,
        badgeId: body.badgeId?.trim() || null,
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
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        displayName: true,
        preferredName: true,
        badgeId: true,
        status: true,
        employmentType: true,
        departmentAssignments: {
          where: {
            active: true,
          },
          select: {
            isPrimary: true,
            department: {
              select: {
                departmentName: true,
              },
            },
          },
        },
        aliases: {
          orderBy: [{ isPrimary: "desc" }, { aliasName: "asc" }],
          select: {
            aliasName: true,
          },
        },
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Employee creation failed", error);

    return NextResponse.json(
      {
        error:
          "Employee creation failed. Check required fields, uniqueness, and applied migrations.",
      },
      { status: 500 },
    );
  }
}
