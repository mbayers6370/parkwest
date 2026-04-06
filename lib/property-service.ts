import { prisma } from "@/lib/prisma";
import { isMockModeEnabled, mockEmployees } from "@/lib/mock-data";
import { DEFAULT_PROPERTIES, findDefaultPropertyByKey } from "@/lib/properties";

export type PropertySummary = {
  id: string;
  propertyKey: string;
  propertyName: string;
  active: boolean;
  employeeCount: number;
  employeeImportCount: number;
  lastEmployeeImportAt: string | null;
};

export async function getPropertySummaries(): Promise<PropertySummary[]> {
  if (isMockModeEnabled()) {
    return DEFAULT_PROPERTIES.map((property) => {
      const employeeCount = mockEmployees.filter(
        (employee) => (employee.propertyKey ?? "580").toLowerCase() === property.key,
      ).length;

      return {
        id: `mock-property-${property.key}`,
        propertyKey: property.key,
        propertyName: property.name,
        active: true,
        employeeCount,
        employeeImportCount: employeeCount > 0 ? 1 : 0,
        lastEmployeeImportAt: employeeCount > 0 ? new Date().toISOString() : null,
      };
    });
  }

  try {
    const properties = await prisma.property.findMany({
      orderBy: {
        propertyName: "asc",
      },
      select: {
        id: true,
        propertyKey: true,
        propertyName: true,
        active: true,
        _count: {
          select: {
            employees: true,
            employeeImportBatches: true,
          },
        },
        employeeImportBatches: {
          take: 1,
          orderBy: {
            importedAt: "desc",
          },
          select: {
            importedAt: true,
          },
        },
      },
    });

    return DEFAULT_PROPERTIES.map((defaultProperty) => {
      const property =
        properties.find((entry) => entry.propertyKey === defaultProperty.key) ?? null;

      return {
        id: property?.id ?? `default-property-${defaultProperty.key}`,
        propertyKey: defaultProperty.key,
        propertyName: property?.propertyName ?? defaultProperty.name,
        active: property?.active ?? true,
        employeeCount: property?._count.employees ?? 0,
        employeeImportCount: property?._count.employeeImportBatches ?? 0,
        lastEmployeeImportAt:
          property?.employeeImportBatches[0]?.importedAt.toISOString() ?? null,
      };
    });
  } catch {
    return DEFAULT_PROPERTIES.map((property) => ({
      id: `default-property-${property.key}`,
      propertyKey: property.key,
      propertyName: property.name,
      active: true,
      employeeCount: 0,
      employeeImportCount: 0,
      lastEmployeeImportAt: null,
    }));
  }
}

export async function getPropertySummaryByKey(
  propertyKey: string,
): Promise<PropertySummary | null> {
  if (isMockModeEnabled()) {
    const property = findDefaultPropertyByKey(propertyKey);

    if (!property) {
      return null;
    }

    const employeeCount = mockEmployees.filter(
      (employee) => (employee.propertyKey ?? "580").toLowerCase() === property.key,
    ).length;

    return {
      id: `mock-property-${property.key}`,
      propertyKey: property.key,
      propertyName: property.name,
      active: true,
      employeeCount,
      employeeImportCount: employeeCount > 0 ? 1 : 0,
      lastEmployeeImportAt: employeeCount > 0 ? new Date().toISOString() : null,
    };
  }

  try {
    const property = await prisma.property.findUnique({
      where: {
        propertyKey: propertyKey.trim().toLowerCase(),
      },
      select: {
        id: true,
        propertyKey: true,
        propertyName: true,
        active: true,
        _count: {
          select: {
            employees: true,
            employeeImportBatches: true,
          },
        },
        employeeImportBatches: {
          take: 1,
          orderBy: {
            importedAt: "desc",
          },
          select: {
            importedAt: true,
          },
        },
      },
    });

    if (!property) {
      const defaultProperty = findDefaultPropertyByKey(propertyKey);

      if (!defaultProperty) {
        return null;
      }

      return {
        id: `default-property-${defaultProperty.key}`,
        propertyKey: defaultProperty.key,
        propertyName: defaultProperty.name,
        active: true,
        employeeCount: 0,
        employeeImportCount: 0,
        lastEmployeeImportAt: null,
      };
    }

    return {
      id: property.id,
      propertyKey: property.propertyKey,
      propertyName: property.propertyName,
      active: property.active,
      employeeCount: property._count.employees,
      employeeImportCount: property._count.employeeImportBatches,
      lastEmployeeImportAt: property.employeeImportBatches[0]?.importedAt.toISOString() ?? null,
    };
  } catch {
    const defaultProperty = findDefaultPropertyByKey(propertyKey);

    if (!defaultProperty) {
      return null;
    }

    return {
      id: `default-property-${defaultProperty.key}`,
      propertyKey: defaultProperty.key,
      propertyName: defaultProperty.name,
      active: true,
      employeeCount: 0,
      employeeImportCount: 0,
      lastEmployeeImportAt: null,
    };
  }
}
