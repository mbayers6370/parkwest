import { WorkspaceKey } from "@prisma/client";
import { isMockModeEnabled, mockEmployees, mockPropertyAccess } from "@/lib/mock-data";
import {
  ADMIN_MODULE_OPTIONS,
  getAdminModuleLabel,
  getAdminModuleOption,
  type AdminModuleKey,
} from "@/lib/admin-modules";
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
  moduleKey: AdminModuleKey;
  moduleLabel: string;
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
  moduleKey: AdminModuleKey;
  moduleLabel: string;
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

function toScopedRoleIdentifier(roleKey: PropertyScopedRoleKey, moduleKey: AdminModuleKey) {
  return moduleKey === "GM" ? roleKey : `${roleKey}_${moduleKey}`;
}

function parseScopedRoleIdentifier(roleIdentifier: string) {
  const normalized = roleIdentifier.trim().toUpperCase();
  const [rawRoleKey, ...moduleParts] = normalized.split("_");
  const roleKey = normalizeRoleKey(rawRoleKey);

  if (!roleKey) {
    return null;
  }

  const moduleKey = getAdminModuleOption(moduleParts.join("_") || "GM").key;

  return {
    roleKey,
    moduleKey,
    moduleLabel: getAdminModuleLabel(moduleKey),
  };
}

function normalizeRoleKey(value: string): PropertyScopedRoleKey | null {
  const normalized = value.trim().toUpperCase();
  return PROPERTY_SCOPED_ROLE_KEYS.find((roleKey) => roleKey === normalized) ?? null;
}

async function ensureRole(roleKey: PropertyScopedRoleKey, moduleKey: AdminModuleKey) {
  const roleDefinition = ROLE_DEFINITIONS[roleKey];
  const moduleLabel = getAdminModuleLabel(moduleKey);
  const scopedRoleKey = toScopedRoleIdentifier(roleKey, moduleKey);
  const scopedRoleName =
    moduleKey === "GM" ? roleDefinition.roleName : `${moduleLabel} ${roleDefinition.roleName}`;
  const scopedDescription =
    moduleKey === "GM"
      ? `Property-scoped ${roleDefinition.roleName.toLowerCase()} access across all departments`
      : `${moduleLabel}-scoped ${roleDefinition.roleName.toLowerCase()} access`;

  return prisma.role.upsert({
    where: {
      roleKey: scopedRoleKey,
    },
    update: {
      roleName: scopedRoleName,
      description: scopedDescription,
    },
    create: {
      roleKey: scopedRoleKey,
      roleName: scopedRoleName,
      description: scopedDescription,
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
        moduleKey: entry.moduleKey ?? "GM",
        moduleLabel: getAdminModuleLabel(entry.moduleKey ?? "GM"),
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
        OR: [
          { roleKey: "ADMIN" },
          { roleKey: "MANAGER" },
          { roleKey: { startsWith: "ADMIN_" } },
          { roleKey: { startsWith: "MANAGER_" } },
        ],
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
    const parsedRole = parseScopedRoleIdentifier(assignment.role.roleKey);
    const propertyRecord = assignment.employee.property;

    if (!parsedRole || !propertyRecord) {
      return [];
    }

    return [
      {
        assignmentId: assignment.id,
        employeeRecordId: assignment.employee.id,
        employeeId: assignment.employee.employeeId,
        displayName: assignment.employee.displayName,
        roleKey: parsedRole.roleKey,
        roleName: assignment.role.roleName,
        moduleKey: parsedRole.moduleKey,
        moduleLabel: parsedRole.moduleLabel,
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
  moduleKey?: string;
}) {
  const property = findDefaultPropertyByKey(args.propertyKey);
  const roleKey = normalizeRoleKey(args.roleKey);
  const moduleKey = getAdminModuleOption(args.moduleKey).key;

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
      roleName:
        moduleKey === "GM"
          ? ROLE_DEFINITIONS[roleKey].roleName
          : `${getAdminModuleLabel(moduleKey)} ${ROLE_DEFINITIONS[roleKey].roleName}`,
      moduleKey,
      moduleLabel: getAdminModuleLabel(moduleKey),
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

  const role = await ensureRole(roleKey, moduleKey);
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
    moduleKey,
    moduleLabel: getAdminModuleLabel(moduleKey),
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
        OR: [
          { roleKey: "ADMIN" },
          { roleKey: "MANAGER" },
          { roleKey: { startsWith: "ADMIN_" } },
          { roleKey: { startsWith: "MANAGER_" } },
        ],
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
