export type AdminAuditCategory = "communications" | "published_schedule";

export type AdminAuditEvent = {
  id: string;
  category: AdminAuditCategory;
  action: string;
  title: string;
  detail: string;
  createdAt: string;
  actor: string;
  propertyKey?: string;
  propertyName?: string;
};

export const ADMIN_AUDIT_LOG_STORAGE_KEY = "parkwest-admin-audit-log";
export const ADMIN_AUDIT_LOG_UPDATED_EVENT = "parkwest-admin-audit-log-updated";

export function loadStoredAdminAuditEvents(propertyKey?: string) {
  if (typeof window === "undefined") {
    return [] as AdminAuditEvent[];
  }

  const raw = window.localStorage.getItem(ADMIN_AUDIT_LOG_STORAGE_KEY);

  if (!raw) {
    return [] as AdminAuditEvent[];
  }

  try {
    const parsed = JSON.parse(raw) as AdminAuditEvent[];
    const events = Array.isArray(parsed) ? parsed : [];

    return propertyKey
      ? events.filter(
          (event) => (event.propertyKey ?? "").toLowerCase() === propertyKey.toLowerCase(),
        )
      : events;
  } catch {
    return [] as AdminAuditEvent[];
  }
}

export function saveStoredAdminAuditEvents(events: AdminAuditEvent[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ADMIN_AUDIT_LOG_STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event(ADMIN_AUDIT_LOG_UPDATED_EVENT));
}

export function appendAdminAuditEvent(event: Omit<AdminAuditEvent, "id" | "createdAt">) {
  const nextEvent: AdminAuditEvent = {
    id: `admin-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...event,
  };

  const existing = loadStoredAdminAuditEvents();
  saveStoredAdminAuditEvents([nextEvent, ...existing]);
  return nextEvent;
}
