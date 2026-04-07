import { WorkspaceKey } from "@prisma/client";
import { isMockModeEnabled, mockEmployees, mockPropertyAccess } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { findDefaultPropertyByKey } from "@/lib/properties";

export const PROPERTY_SCOPED_ROLE_KEYS = ["ADMIN", "MANAGER"] as const;

export type PropertyScopedRoleKey = (typeof PROPERTY_SCOPED_ROLE_KEYS)[number];

export type PropertyAccessEntry = {
  assignmentId: string;
  employeeRecordId: string;
  employeeId: string;
  displayName: string;
  roleKey: PropertyScopedRoleKey;
  roleName: string;
  propertyKey: string;
  propertyName: string;
};

export type AdminPropertySession = {
  employeeRecordId: string;
  employeeId: string;
  displayName: string;
  roleKey: PropertyScopedRoleKey;
  propertyKey: string;
  propertyName: string;
};

const ROLE_DEFINITIONS: Record<PropertyScopedRoleKey, { roleName: string; description: string }> = {
  ADMIN: {
    roleName: "Admin",
    description: "Property-scoped administrator access",
  },
  MANAGER: {
    roleName: "Manager",
    description: "Property-scoped manager access",
  },
};

function normalizeRoleKey(value: string): PropertyScopedRoleKey | null {
  const normalized = value.trim().toUpperCase();
  return PROPERTY_SCOPED_ROLE_KEYS.find((roleKey) => roleKey === normalized) ?? null;
}

async function ensureRole(roleKey: PropertyScopedRoleKey) {
  const roleDefinition = ROLE_DEFINITIONS[roleKey];

  return prisma.role.upsert({
    where: {
      roleKey,
    },
    update: {
      roleName: roleDefinition.roleName,
      description: roleDefinition.description,
    },
    create: {
      roleKey,
      roleName: roleDefinition.roleName,
      description: roleDefinition.description,
    },
  });
}

function toMockAccessEntries(propertyKey: string) {
  const property = findDefaultPropertyByKey(propertyKey);

  if (!property) {
    return [] as PropertyAccessEntry[];
  }

  return mockPropertyAccess
    .filter((entry) => entry.propertyKey === property.key)
    .map((entry, index) => {
      const employee = mockEmployees.find(
        (candidate) =>
          candidate.employeeId === entry.employeeId &&
          (candidate.propertyKey ?? "").toLowerCase() === property.key,
      );

      if (!employee) {
        return null;
      }

      return {
        assignmentId: `mock-access-${property.key}-${index + 1}`,
        employeeRecordId: employee.id,
        employeeId: employee.employeeId,
        displayName: employee.displayName,
        roleKey: entry.roleKey,
        roleName: ROLE_DEFINITIONS[entry.roleKey].roleName,
        propertyKey: property.key,
        propertyName: property.name,
      } satisfies PropertyAccessEntry;
    })
    .filter(Boolean) as PropertyAccessEntry[];
}

export async function getPropertyAccessEntries(propertyKey: string) {
  const property = findDefaultPropertyByKey(propertyKey);

  if (!property) {
    return [] as PropertyAccessEntry[];
  }

  if (isMockModeEnabled()) {
    return toMockAccessEntries(property.key);
  }

  const assignments = await prisma.employeeRoleAssignment.findMany({
    where: {
      active: true,
      role: {
        roleKey: {
          in: [...PROPERTY_SCOPED_ROLE_KEYS],
        },
      },
      employee: {
        property: {
          is: {
            propertyKey: property.key,
          },
        },
      },
    },
    select: {
      id: true,
      role: {
        select: {
          roleKey: true,
          roleName: true,
        },
      },
      employee: {
        select: {
          id: true,
          employeeId: true,
          displayName: true,
          property: {
            select: {
              propertyKey: true,
              propertyName: true,
            },
          },
        },
      },
    },
    orderBy: [{ role: { roleName: "asc" } }, { employee: { displayName: "asc" } }],
  });

  return assignments.flatMap((assignment) => {
    const roleKey = normalizeRoleKey(assignment.role.roleKey);
    const propertyRecord = assignment.employee.property;

    if (!roleKey || !propertyRecord) {
      return [];
    }

    return [
      {
        assignmentId: assignment.id,
        employeeRecordId: assignment.employee.id,
        employeeId: assignment.employee.employeeId,
        displayName: assignment.employee.displayName,
        roleKey,
        roleName: assignment.role.roleName,
        propertyKey: propertyRecord.propertyKey,
        propertyName: propertyRecord.propertyName,
      },
    ];
  });
}

export async function grantPropertyAccess(args: {
  propertyKey: string;
  employeeRecordId: string;
  roleKey: string;
}) {
  const property = findDefaultPropertyByKey(args.propertyKey);
  const roleKey = normalizeRoleKey(args.roleKey);

  if (!property || !roleKey) {
    throw new Error("A valid property and role are required.");
  }

  if (isMockModeEnabled()) {
    const employee = mockEmployees.find(
      (entry) =>
        entry.id === args.employeeRecordId &&
        (entry.propertyKey ?? "").toLowerCase() === property.key,
    );

    if (!employee) {
      throw new Error("That employee does not belong to this property.");
    }

    return {
      assignmentId: `mock-access-${property.key}-${employee.id}-${roleKey.toLowerCase()}`,
      employeeRecordId: employee.id,
      employeeId: employee.employeeId,
      displayName: employee.displayName,
      roleKey,
      roleName: ROLE_DEFINITIONS[roleKey].roleName,
      propertyKey: property.key,
      propertyName: property.name,
    } satisfies PropertyAccessEntry;
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id: args.employeeRecordId,
      property: {
        is: {
          propertyKey: property.key,
        },
      },
    },
    select: {
      id: true,
      employeeId: true,
      displayName: true,
      property: {
        select: {
          propertyKey: true,
          propertyName: true,
        },
      },
    },
  });

  if (!employee || !employee.property) {
    throw new Error("That employee does not belong to this property.");
  }

  const role = await ensureRole(roleKey);
  const existingAssignment = await prisma.employeeRoleAssignment.findFirst({
    where: {
      employeeIdFk: employee.id,
      roleIdFk: role.id,
    },
    select: {
      id: true,
      active: true,
    },
  });

  const assignment =
    existingAssignment
      ? await prisma.employeeRoleAssignment.update({
          where: {
            id: existingAssignment.id,
          },
          data: {
            active: true,
            startsAt: new Date(),
            endsAt: null,
          },
        })
      : await prisma.employeeRoleAssignment.create({
          data: {
            employeeIdFk: employee.id,
            roleIdFk: role.id,
            active: true,
            startsAt: new Date(),
          },
        });

  const activeWorkspaceAccess = await prisma.workspaceAccess.findFirst({
    where: {
      employeeIdFk: employee.id,
      workspaceKey: WorkspaceKey.MANAGER_ADMIN,
      revokedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!activeWorkspaceAccess) {
    await prisma.workspaceAccess.create({
      data: {
        employeeIdFk: employee.id,
        workspaceKey: WorkspaceKey.MANAGER_ADMIN,
      },
    });
  }

  return {
    assignmentId: assignment.id,
    employeeRecordId: employee.id,
    employeeId: employee.employeeId,
    displayName: employee.displayName,
    roleKey,
    roleName: role.roleName,
    propertyKey: employee.property.propertyKey,
    propertyName: employee.property.propertyName,
  } satisfies PropertyAccessEntry;
}

export async function revokePropertyAccess(args: {
  propertyKey: string;
  assignmentId: string;
}) {
  const property = findDefaultPropertyByKey(args.propertyKey);

  if (!property) {
    throw new Error("A valid property is required.");
  }

  if (isMockModeEnabled()) {
    return;
  }

  const assignment = await prisma.employeeRoleAssignment.findFirst({
    where: {
      id: args.assignmentId,
      employee: {
        property: {
          is: {
            propertyKey: property.key,
          },
        },
      },
    },
    select: {
      id: true,
      employeeIdFk: true,
    },
  });

  if (!assignment) {
    throw new Error("That access assignment could not be found.");
  }

  await prisma.employeeRoleAssignment.update({
    where: {
      id: assignment.id,
    },
    data: {
      active: false,
      endsAt: new Date(),
    },
  });

  const remainingElevatedAssignments = await prisma.employeeRoleAssignment.count({
    where: {
      employeeIdFk: assignment.employeeIdFk,
      active: true,
      role: {
        roleKey: {
          in: [...PROPERTY_SCOPED_ROLE_KEYS],
        },
      },
    },
  });

  if (remainingElevatedAssignments === 0) {
    await prisma.workspaceAccess.updateMany({
      where: {
        employeeIdFk: assignment.employeeIdFk,
        workspaceKey: WorkspaceKey.MANAGER_ADMIN,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
