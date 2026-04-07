"use client";

import { createContext, useContext } from "react";
import type { AdminPropertySession } from "@/lib/property-access";

const AdminPropertyContext = createContext<AdminPropertySession | null>(null);

export function AdminPropertyProvider({
  value,
  children,
}: {
  value: AdminPropertySession;
  children: React.ReactNode;
}) {
  return <AdminPropertyContext.Provider value={value}>{children}</AdminPropertyContext.Provider>;
}

export function useAdminProperty() {
  return useContext(AdminPropertyContext);
}
