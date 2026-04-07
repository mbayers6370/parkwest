import Link from "next/link";
import { getPropertySummaries } from "@/lib/property-service";

export default async function SupportOverviewPage() {
  const properties = await getPropertySummaries();
  const activeProperties = properties.filter((property) => property.active).length;
  const configuredProperties = properties.filter(
    (property) => property.employeeImportCount > 0,
  ).length;
  const totalEmployees = properties.reduce(
    (sum, property) => sum + property.employeeCount,
    0,
  );
  const totalElevatedUsers = properties.reduce(
    (sum, property) => sum + property.adminCount + property.managerCount,
    0,
  );

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Support / Platform</p>
        <h1 className="admin-page-title">Properties</h1>
        <p className="admin-page-subtitle">
          Enter a property, inspect health, and manage property-scoped employee onboarding.
        </p>
      </header>

      <div className="admin-content">
        <div className="support-overview-stats">
          <div className="mini-card">
            <p className="mini-label">Active Properties</p>
            <p className="mini-title">{activeProperties}</p>
          </div>
          <div className="mini-card">
            <p className="mini-label">Configured Properties</p>
            <p className="mini-title">{configuredProperties}</p>
          </div>
          <div className="mini-card">
            <p className="mini-label">Employee Records</p>
            <p className="mini-title">{totalEmployees}</p>
          </div>
          <div className="mini-card">
            <p className="mini-label">Admins + Managers</p>
            <p className="mini-title">{totalElevatedUsers}</p>
          </div>
        </div>

        <div className="support-property-grid">
          {properties.map((property) => (
            <article key={property.propertyKey} className="result-card support-property-card">
              <div className="result-card-header">
                <div>
                  <p className="result-title">{property.propertyName}</p>
                  <p className="result-subtitle">Property key: {property.propertyKey}</p>
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
                  <p className="mini-label">Admins</p>
                  <p className="mini-title">{property.adminCount}</p>
                </div>
                <div className="mini-card">
                  <p className="mini-label">Managers</p>
                  <p className="mini-title">{property.managerCount}</p>
                </div>
              </div>

              <p className="mini-copy">
                {property.lastEmployeeImportAt
                  ? `Last employee import ${new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(property.lastEmployeeImportAt))}.`
                  : "No employee imports have been recorded yet."}
              </p>
              <p className="mini-copy">
                {property.employeeImportCount > 0
                  ? "Property is configured and ready for scoped admin access."
                  : "Property has not been onboarded yet and still needs employee data."}
              </p>

              <div className="support-link-row">
                <Link
                  href={`/support/properties/${property.propertyKey}`}
                  className="primary-button"
                >
                  Open Property
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
