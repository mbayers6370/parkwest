import { cookies } from "next/headers";
import { getAdminModuleLabel } from "@/lib/admin-modules";
import type { AdminPropertySession } from "@/lib/property-access";

export const ADMIN_PROPERTY_SESSION_COOKIE = "parkwest-admin-session";

const DEFAULT_ADMIN_SESSION: AdminPropertySession = {
  employeeRecordId: "mock-4",
  employeeId: "10077",
  displayName: "Brett S",
  roleKey: "ADMIN",
  propertyKey: "580",
  propertyName: "580",
  moduleKey: "GM",
  moduleLabel: getAdminModuleLabel("GM"),
};

function normalizeLegacyMockAdminSession(
  session: AdminPropertySession | null | undefined,
): AdminPropertySession {
  if (
    session?.employeeRecordId === "mock-1" ||
    session?.employeeId === "10021" ||
    session?.displayName === "Matt"
  ) {
    return DEFAULT_ADMIN_SESSION;
  }

  return session ?? DEFAULT_ADMIN_SESSION;
}

export async function getAdminPropertySession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_PROPERTY_SESSION_COOKIE)?.value;

  if (!raw) {
    return DEFAULT_ADMIN_SESSION;
  }

  try {
    return normalizeLegacyMockAdminSession(JSON.parse(raw) as AdminPropertySession);
  } catch {
    return DEFAULT_ADMIN_SESSION;
  }
}
