import { cookies } from "next/headers";
import type { AdminPropertySession } from "@/lib/property-access";

export const ADMIN_PROPERTY_SESSION_COOKIE = "parkwest-admin-session";

const DEFAULT_ADMIN_SESSION: AdminPropertySession = {
  employeeRecordId: "mock-1",
  employeeId: "10021",
  displayName: "Matt",
  roleKey: "ADMIN",
  propertyKey: "580",
  propertyName: "580",
};

export async function getAdminPropertySession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_PROPERTY_SESSION_COOKIE)?.value;

  if (!raw) {
    return DEFAULT_ADMIN_SESSION;
  }

  try {
    return JSON.parse(raw) as AdminPropertySession;
  } catch {
    return DEFAULT_ADMIN_SESSION;
  }
}
