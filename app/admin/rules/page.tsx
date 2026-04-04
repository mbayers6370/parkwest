import { TriangleAlert } from "lucide-react";

export default function AdminRulesPage() {
  const RULE_GROUPS = [
    {
      title: "Shift Swap Rules",
      subtitle: "Controls when and how employees can swap shifts with each other",
      rules: [
        { label: "Swap request cutoff", value: "4 hours before shift start", status: "default" },
        { label: "Minimum rest window", value: "9.5 hours between shifts", status: "default" },
      ],
    },
    {
      title: "Attendance & Points",
      subtitle: "How points, PSL, and Reverse PSL should be tracked",
      rules: [
        { label: "Half Point", value: "Leave early", status: "default" },
        { label: "Full Point", value: "Miss full shift", status: "default" },
        { label: "PSL", value: "Call out or leave early", status: "default" },
        { label: "Reverse PSL", value: "Come in later using PSL", status: "default" },
      ],
    },
    {
      title: "Open Shift Bidding",
      subtitle: "Eligibility rules for open shift bids",
      rules: [
        { label: "Seniority priority", value: "Enabled", status: "ok" },
        { label: "Department restriction", value: "Same department first", status: "default" },
      ],
    },
  ];

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Rules &amp; Settings</h1>
        <p className="admin-page-subtitle">
          Configure business rules that govern scheduling, attendance, and bidding
        </p>
      </header>

      <div className="admin-content">
        <div className="notice-card warn" style={{ marginBottom: 22 }}>
          <TriangleAlert size={16} aria-hidden="true" />
          <div>
            <p className="notice-title">Rules are read-only for now</p>
            <p className="notice-body">
              These values reflect the initial business rules from the planning documents. Editing
              controls will be wired in a later build phase.
            </p>
          </div>
        </div>

        <div className="admin-grid">
          {RULE_GROUPS.map((group) => (
            <div key={group.title} className="admin-card">
              <div className="admin-card-header">
                <div>
                  <p className="admin-card-title">{group.title}</p>
                  <p className="admin-card-subtitle">{group.subtitle}</p>
                </div>
              </div>
              <div className="admin-card-body">
                <div className="data-list">
                  {group.rules.map((rule) => (
                    <div key={rule.label} className="data-row">
                      <div className="data-row-main">
                        <p className="data-row-title">{rule.label}</p>
                      </div>
                      <div className="data-row-right">
                        <span
                          className={`badge ${rule.status === "ok" ? "success" : rule.status === "warn" ? "warning" : "gold"}`}
                        >
                          {rule.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
