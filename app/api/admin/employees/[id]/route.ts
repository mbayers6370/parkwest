import { NextResponse } from "next/server";
import { AliasType } from "@prisma/client";
import { isMockModeEnabled } from "@/lib/mock-data";
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
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
        id,
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

    await prisma.employee.update({
      where: { id },
      data: {
        employeeId: body.employeeId.trim(),
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        preferredName: body.preferredName?.trim() || null,
        displayName,
        badgeId: body.badgeId?.trim() || null,
        aliases: {
          deleteMany: {},
          create: aliases.map((alias, index) => ({
            aliasName: alias,
            normalizedAliasName: normalizeAlias(alias),
            aliasType: index === 0 ? AliasType.SCHEDULE : AliasType.MANUAL,
            isPrimary: index === 0,
          })),
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
        aliases: {
          orderBy: [{ isPrimary: "desc" }, { aliasName: "asc" }],
          select: {
            aliasName: true,
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
        preferredName: true,
        badgeId: true,
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
