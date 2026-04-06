import { NextRequest, NextResponse } from "next/server";
import { EmployeeStatus, EmploymentType, WorkspaceKey } from "@prisma/client";
import { findDepartmentOptionByName } from "@/lib/employee-departments";
import { isMockModeEnabled, mockEmployees } from "@/lib/mock-data";
import { findDefaultPropertyByKey } from "@/lib/properties";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  const propertyKey = request.nextUrl.searchParams.get("propertyKey")?.trim().toLowerCase() ?? "";
  const includeAll = request.nextUrl.searchParams.get("all") === "1";

  if (isMockModeEnabled()) {
    const normalizedQuery = query.toLowerCase();
    const employees = mockEmployees.filter((employee) => {
      const matchesProperty = propertyKey
        ? (employee.propertyKey ?? "580").toLowerCase() === propertyKey
        : true;

      if (!matchesProperty) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        employee.displayName,
        employee.firstName,
        employee.lastName,
        employee.employeeId,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    return NextResponse.json({
      employees: includeAll ? employees : employees.slice(0, query ? 12 : 20),
      mockMode: true,
    });
  }

  try {
    const employees = await prisma.employee.findMany({
      where: query
        ? {
            AND: [
              propertyKey
                ? {
                    property: {
                      is: {
                        propertyKey,
                      },
                    },
                  }
                : {},
              {
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
                ],
              },
            ],
          }
        : propertyKey
          ? {
              property: {
                is: {
                  propertyKey,
                },
              },
            }
          : undefined,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        displayName: true,
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
      },
      orderBy: {
        displayName: "asc",
      },
      take: includeAll ? undefined : query ? 12 : 20,
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
    propertyKey?: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    department?: string;
  };

  const departmentOption = findDepartmentOptionByName(body.department);
  const property = findDefaultPropertyByKey(body.propertyKey ?? "580");

  if (!departmentOption || !property) {
    return NextResponse.json(
      { error: "A valid property and department are required." },
      { status: 400 },
    );
  }

  if (isMockModeEnabled()) {
    const displayName =
      body.displayName?.trim() || `${body.firstName} ${body.lastName}`;

    return NextResponse.json({
      employee: {
        id: `mock-created-${Date.now()}`,
        employeeId: body.employeeId.trim(),
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        displayName,
        badgeId: body.employeeId.trim(),
        status: "ACTIVE",
        employmentType: "OTHER",
        property: {
          propertyKey: property.key,
          propertyName: property.name,
        },
        departmentAssignments: [
          {
            isPrimary: true,
            department: {
              departmentName: departmentOption.name,
            },
          },
        ],
      },
      mockMode: true,
    });
  }

  try {
    const displayName =
      body.displayName?.trim() || `${body.firstName} ${body.lastName}`;

    const employee = await prisma.employee.create({
      data: {
        employeeId: body.employeeId.trim(),
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        preferredName: null,
        displayName,
        badgeId: body.employeeId.trim(),
        status: EmployeeStatus.ACTIVE,
        employmentType: EmploymentType.OTHER,
        workspaceAccess: {
          create: {
            workspaceKey: WorkspaceKey.PERSONAL,
          },
        },
        property: {
          connectOrCreate: {
            where: {
              propertyKey: property.key,
            },
            create: {
              propertyKey: property.key,
              propertyName: property.name,
            },
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
        employeeId: true,
        firstName: true,
        lastName: true,
        displayName: true,
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
