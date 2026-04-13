"use client";

import { useState } from "react";
import { useAdminProperty } from "@/components/admin-property-provider";
import { getAdminModuleLabel } from "@/lib/admin-modules";

const SWAP_REQUEST_CUTOFF_OPTIONS = [
  "2 hours before shift start",
  "4 hours before shift start",
  "6 hours before shift start",
] as const;

const MINIMUM_REST_WINDOW_OPTIONS = [
  "8 hours between shifts",
  "8.5 hours between shifts",
  "9 hours between shifts",
  "9.5 hours between shifts",
  "10 hours between shifts",
  "10.5 hours between shifts",
  "11 hours between shifts",
  "11.5 hours between shifts",
  "12 hours between shifts",
] as const;

type RuleGroup = {
  title: string;
  subtitle: string;
  rules: Array<
    | {
        label: string;
        value: string;
        status: "default" | "ok" | "warn";
      }
    | {
        label: string;
        value: string;
        key: "swapRequestCutoff" | "minimumRestWindow";
        options: readonly string[];
      }
  >;
};

export default function AdminRulesPage() {
  const adminProperty = useAdminProperty();
  const [swapRequestCutoff, setSwapRequestCutoff] = useState<(typeof SWAP_REQUEST_CUTOFF_OPTIONS)[number]>(
    "4 hours before shift start",
  );
  const [minimumRestWindow, setMinimumRestWindow] = useState<
    (typeof MINIMUM_REST_WINDOW_OPTIONS)[number]
  >("9.5 hours between shifts");

  const RULE_GROUPS: RuleGroup[] = [
    {
      title: "Shift Swap Rules",
      subtitle: "Controls when and how employees can swap shifts with each other",
      rules: [
        {
          label: "Swap request cutoff",
          value: swapRequestCutoff,
          key: "swapRequestCutoff",
          options: SWAP_REQUEST_CUTOFF_OPTIONS,
        },
        {
          label: "Minimum rest window",
          value: minimumRestWindow,
          key: "minimumRestWindow",
          options: MINIMUM_REST_WINDOW_OPTIONS,
        },
      ],
    },
    {
      title: "Attendance & Points",
      subtitle: "How absent, tardy, and early out attendance actions should be tracked",
      rules: [
        { label: "Early Out - 1/2 Point", value: "Leave early", status: "default" },
        { label: "Absent 1 Point", value: "Miss full shift", status: "default" },
        { label: "Absent - PSL", value: "Absent with PSL", status: "default" },
        { label: "Tardy with use of PSL", value: "Come in later using PSL", status: "default" },
      ],
    },
  ];

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">
          {getAdminModuleLabel(adminProperty?.moduleKey)} Module
        </p>
        <h1 className="admin-page-title">Rules &amp; Settings</h1>
        <p className="admin-page-subtitle">
          Configure business rules that govern scheduling, attendance, and bidding
        </p>
      </header>

      <div className="admin-content">
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
                        {"options" in rule ? (
                          <select
                            className="text-input admin-select-input"
                            value={rule.value}
                            onChange={(event) => {
                              if (rule.key === "swapRequestCutoff") {
                                setSwapRequestCutoff(
                                  event.target.value as (typeof SWAP_REQUEST_CUTOFF_OPTIONS)[number],
                                );
                                return;
                              }

                              setMinimumRestWindow(
                                event.target.value as (typeof MINIMUM_REST_WINDOW_OPTIONS)[number],
                              );
                            }}
                          >
                            {rule.options.map((option) => (
                              <option key={`${rule.key}-${option}`} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`badge ${rule.status === "ok" ? "success" : rule.status === "warn" ? "warning" : "gold"}`}
                          >
                            {rule.value}
                          </span>
                        )}
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
