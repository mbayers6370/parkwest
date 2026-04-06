import Link from "next/link";
import { getPropertySummaries } from "@/lib/property-service";

export default async function SupportPropertiesPage() {
  const properties = await getPropertySummaries();

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Support / Platform</p>
        <h1 className="admin-page-title">Properties</h1>
        <p className="admin-page-subtitle">
          Open a property workspace and manage employee onboarding inside that property only.
        </p>
      </header>

      <div className="admin-content">
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
