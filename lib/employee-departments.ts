export const EMPLOYEE_DEPARTMENT_OPTIONS = [
  { key: "dealer", name: "Dealer" },
  { key: "floor", name: "Floor" },
  { key: "dual_rate", name: "Dual Rate" },
  { key: "chip_runner", name: "Chip Runner" },
  { key: "cage", name: "Cage" },
  { key: "food_and_beverage", name: "Food & Beverage" },
  { key: "security", name: "Security" },
] as const;

export type EmployeeDepartmentName =
  (typeof EMPLOYEE_DEPARTMENT_OPTIONS)[number]["name"];

export function findDepartmentOptionByName(rawName?: string | null) {
  const normalized = rawName?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const legacyAliases: Record<string, EmployeeDepartmentName> = {
    dealers: "Dealer",
    "chip runners": "Chip Runner",
    "food and beverage": "Food & Beverage",
    "f&b": "Food & Beverage",
  };

  const canonicalName = legacyAliases[normalized] ?? rawName?.trim();

  return (
    EMPLOYEE_DEPARTMENT_OPTIONS.find(
      (option) => option.name.toLowerCase() === canonicalName?.toLowerCase(),
    ) ?? null
  );
}
