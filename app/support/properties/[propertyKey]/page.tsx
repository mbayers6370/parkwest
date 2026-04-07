import { notFound } from "next/navigation";
import { AdminEmployeeManager } from "@/components/admin-employee-manager";
import { SupportPropertyAccessManager } from "@/components/support-property-access-manager";
import { SupportEmployeeImport } from "@/components/support-employee-import";
import { getPropertySummaryByKey } from "@/lib/property-service";

export default async function SupportPropertyDetailPage({
  params,
}: {
  params: Promise<{ propertyKey: string }>;
}) {
  const { propertyKey } = await params;
  const property = await getPropertySummaryByKey(propertyKey);

  if (!property) {
    notFound();
  }

  const lastImportLabel = property.lastEmployeeImportAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(property.lastEmployeeImportAt))
    : "No imports yet";

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Support / Platform</p>
        <h1 className="admin-page-title">{property.propertyName}</h1>
        <p className="admin-page-subtitle">
          Property-scoped employee onboarding and health for {property.propertyName}.
        </p>
      </header>

      <div className="admin-content">
        <section className="result-card">
          <div className="result-card-header">
            <div>
              <p className="mini-label">Property Health</p>
              <p className="mini-title">{property.propertyName}</p>
              <p className="mini-copy">Everything on this screen is scoped to {property.propertyName}.</p>
            </div>
            <span className={`badge ${property.active ? "success" : "danger"}`}>
              {property.active ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="support-stat-grid">
            <div className="mini-card">
              <p className="mini-label">Employees</p>
              <p className="mini-title">{property.employeeCount}</p>
            </div>
            <div className="mini-card">
              <p className="mini-label">Employee Imports</p>
              <p className="mini-title">{property.employeeImportCount}</p>
            </div>
            <div className="mini-card">
              <p className="mini-label">Last Import</p>
              <p className="mini-title">{lastImportLabel}</p>
            </div>
            <div className="mini-card">
              <p className="mini-label">Admins</p>
              <p className="mini-title">{property.adminCount}</p>
            </div>
            <div className="mini-card">
              <p className="mini-label">Managers</p>
              <p className="mini-title">{property.managerCount}</p>
            </div>
          </div>
        </section>

        <SupportEmployeeImport
          propertyKey={property.propertyKey}
          propertyName={property.propertyName}
        />

        <SupportPropertyAccessManager
          propertyKey={property.propertyKey}
          propertyName={property.propertyName}
        />

        <AdminEmployeeManager
          propertyKey={property.propertyKey}
          propertyName={property.propertyName}
        />
      </div>
    </>
  );
}
