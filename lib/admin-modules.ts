export const ADMIN_MODULE_OPTIONS = [
  {
    key: "GAMING",
    label: "Gaming",
    shortLabel: "Gaming",
    departmentNames: ["Dealer", "Floor", "Dual Rate", "Chip Runner"],
  },
  {
    key: "CAGE",
    label: "Cage",
    shortLabel: "Cage",
    departmentNames: ["Cage"],
  },
  {
    key: "F_AND_B",
    label: "F&B",
    shortLabel: "F&B",
    departmentNames: ["Food & Beverage", "F&B"],
  },
  {
    key: "SECURITY",
    label: "Security",
    shortLabel: "Security",
    departmentNames: ["Security"],
  },
  {
    key: "GM",
    label: "GM",
    shortLabel: "GM",
    departmentNames: [],
  },
] as const;

export type AdminModuleKey = (typeof ADMIN_MODULE_OPTIONS)[number]["key"];

export function getAdminModuleOption(moduleKey?: string | null) {
  const normalized = moduleKey?.trim().toUpperCase();

  return (
    ADMIN_MODULE_OPTIONS.find((moduleOption) => moduleOption.key === normalized) ??
    ADMIN_MODULE_OPTIONS[0]
  );
}

export function getAdminModuleLabel(moduleKey?: string | null) {
  return getAdminModuleOption(moduleKey).label;
}

export function getAdminModuleShortLabel(moduleKey?: string | null) {
  return getAdminModuleOption(moduleKey).shortLabel;
}

export function getAdminModuleDepartmentNames(moduleKey?: string | null) {
  return getAdminModuleOption(moduleKey).departmentNames;
}

export function isGlobalAdminModule(moduleKey?: string | null) {
  return getAdminModuleOption(moduleKey).key === "GM";
}

export function moduleAllowsDepartment(
  moduleKey: string | null | undefined,
  departmentName?: string | null,
) {
  if (isGlobalAdminModule(moduleKey)) {
    return true;
  }

  const normalizedDepartment = departmentName?.trim().toLowerCase();

  if (!normalizedDepartment) {
    return false;
  }

  return getAdminModuleDepartmentNames(moduleKey).some(
    (allowedDepartment) => allowedDepartment.toLowerCase() === normalizedDepartment,
  );
}

export function moduleScopeLabel(moduleKey?: string | null, propertyName?: string | null) {
  const shortLabel = getAdminModuleShortLabel(moduleKey).toUpperCase();

  return propertyName ? `${shortLabel} ${propertyName}` : shortLabel;
}
