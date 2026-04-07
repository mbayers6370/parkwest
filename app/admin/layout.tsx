import "./admin.css";
import { AdminPropertyProvider } from "@/components/admin-property-provider";
import { AdminNav } from "@/components/admin-nav";
import { getAdminPropertySession } from "@/lib/admin-session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminSession = await getAdminPropertySession();

  return (
    <div className="admin-shell">
      <AdminNav session={adminSession} />
      <div className="admin-main">
        {adminSession ? (
          <AdminPropertyProvider value={adminSession}>{children}</AdminPropertyProvider>
        ) : (
          <div className="admin-empty-scope">
            <div className="result-card">
              <p className="mini-label">Property Access Required</p>
              <p className="mini-title">Choose a property from Support first</p>
              <p className="mini-copy">
                Admin is now property-scoped. Enter a property from the support workspace so this
                side of the app knows which database tenant you are operating in.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
