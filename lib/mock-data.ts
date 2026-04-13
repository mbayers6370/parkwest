export const mockPropertyAccess: {
  propertyKey: string;
  employeeId: string;
  roleKey: "ADMIN" | "MANAGER";
  moduleKey?: "GAMING" | "CAGE" | "F_AND_B" | "SECURITY" | "GM";
}[] = [
  { propertyKey: "580", employeeId: "10077", roleKey: "ADMIN", moduleKey: "GM" },
  { propertyKey: "580", employeeId: "10488", roleKey: "ADMIN", moduleKey: "GAMING" },
];

export const mockEmployees = [
  {
    id: "mock-1",
    propertyKey: "580",
    employeeId: "10021",
    firstName: "Matt",
    lastName: "Bayers",
    displayName: "Matt",
    preferredName: "Matt",
    badgeId: "BW-1021",
    status: "ACTIVE",
    employmentType: "FULL_TIME",
    departmentAssignments: [
      {
        isPrimary: true,
        department: {
          departmentName: "Dealer",
        },
      },
    ],
    aliases: [{ aliasName: "Matt" }, { aliasName: "Matthew Bayers" }],
  },
  {
    id: "mock-4",
    propertyKey: "580",
    employeeId: "10077",
    firstName: "Brett",
    lastName: "S",
    displayName: "Brett S",
    preferredName: "Brett",
    badgeId: "BW-1077",
    status: "ACTIVE",
    employmentType: "FULL_TIME",
    departmentAssignments: [{ isPrimary: true, department: { departmentName: "Floor" } }],
    aliases: [{ aliasName: "Brett S" }],
  },
  {
    id: "mock-2",
    propertyKey: "580",
    employeeId: "10488",
    firstName: "Susan",
    lastName: "Tran",
    displayName: "Susan",
    preferredName: "Susan",
    badgeId: "BW-1488",
    status: "ACTIVE",
    employmentType: "PART_TIME",
    departmentAssignments: [
      {
        isPrimary: true,
        department: {
          departmentName: "Dealer",
        },
      },
    ],
    aliases: [{ aliasName: "Susan" }, { aliasName: "Susan Tran" }],
  },
  {
    id: "mock-3",
    propertyKey: "580",
    employeeId: "10931",
    firstName: "Johnny",
    lastName: "Pham",
    displayName: "Johnny P",
    preferredName: "Johnny",
    badgeId: "BW-1931",
    status: "ACTIVE",
    employmentType: "OTHER",
    departmentAssignments: [
      {
        isPrimary: true,
        department: {
          departmentName: "Chip Runner",
        },
      },
    ],
    aliases: [{ aliasName: "Johnny P" }, { aliasName: "Johnny Pham" }],
  },
];

export function isMockModeEnabled() {
  return process.env.MOCK_DB === "true";
}
