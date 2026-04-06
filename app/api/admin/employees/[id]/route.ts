import { NextResponse } from "next/server";
import { findDepartmentOptionByName } from "@/lib/employee-departments";
import { isMockModeEnabled } from "@/lib/mock-data";
import { findDefaultPropertyByKey } from "@/lib/properties";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
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
        id,
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
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        property: {
          select: {
            propertyKey: true,
          },
        },
      },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    if (
      body.propertyKey &&
      existingEmployee.property?.propertyKey &&
      existingEmployee.property.propertyKey !== property.key
    ) {
      return NextResponse.json(
        { error: "That employee does not belong to the selected property." },
        { status: 400 },
      );
    }

    const displayName =
      body.displayName?.trim() || `${body.firstName} ${body.lastName}`;

    await prisma.employee.update({
      where: { id },
      data: {
        employeeId: body.employeeId.trim(),
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        preferredName: null,
        displayName,
        badgeId: body.employeeId.trim(),
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
        aliases: {
          deleteMany: {},
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
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        displayName: true,
        status: true,
        employmentType: true,
        departmentAssignments: {
          where: { active: true },
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

    const employee = await prisma.employee.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        displayName: true,
        status: true,
        employmentType: true,
        departmentAssignments: {
          where: { active: true },
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
    console.error("Employee update failed", error);

    return NextResponse.json(
      {
        error:
          "Employee update failed. Check database connectivity, uniqueness, and applied migrations.",
      },
      { status: 500 },
    );
  }
}
