"use client";

import { useState } from "react";
import shared from "../personal-shared.module.css";
import styles from "./account.module.css";

const MOCK_PROFILE = {
  firstName: "Matt",
  lastName: "Bayers",
  initials: "MB",
  employeeId: "10021",
  department: "Dealer",
  employmentType: "Full-time",
  badgeId: "BW-1021",
  property: "Parkwest 580",
};

export default function PersonalAccountPage() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  return (
    <main className={shared.personalContent}>
      <div className={`${shared.personalColMain} ${shared.personalAccountMain}`}>

        {/* Profile card */}
        <div className={shared.pCard}>
          <div className={shared.pCardHeader}>
            <p className={shared.pCardTitle}>Profile</p>
          </div>
          <div className={shared.pCardBody}>
            <div className={styles.profileSummary}>
              <div className={styles.profileAvatar}>
                {MOCK_PROFILE.initials}
              </div>
              <div className={styles.profileIdentity}>
                <p className={styles.profileName}>
                  {MOCK_PROFILE.firstName} {MOCK_PROFILE.lastName}
                </p>
                <p className={styles.profileRole}>
                  {MOCK_PROFILE.department} · {MOCK_PROFILE.property}
                </p>
              </div>
            </div>

            <div className="data-list">
              <div className="data-row">
                <div className="data-row-main">
                  <p className="data-row-title">Employee ID</p>
                </div>
                <span className={styles.dataValue}>{MOCK_PROFILE.employeeId}</span>
              </div>
              <div className="data-row">
                <div className="data-row-main">
                  <p className="data-row-title">Badge</p>
                </div>
                <span className={styles.dataValue}>{MOCK_PROFILE.badgeId}</span>
              </div>
              <div className="data-row">
                <div className="data-row-main">
                  <p className="data-row-title">Department</p>
                </div>
                <span className={styles.dataValue}>{MOCK_PROFILE.department}</span>
              </div>
              <div className="data-row">
                <div className="data-row-main">
                  <p className="data-row-title">Employment type</p>
                </div>
                <span className={styles.dataValue}>{MOCK_PROFILE.employmentType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Password card */}
        <div className={shared.pCard}>
          <div className={shared.pCardHeader}>
            <p className={shared.pCardTitle}>Change Password</p>
          </div>
          <div className={shared.pCardBody}>
            <div className={shared.pForm}>
              <div className={shared.pField}>
                <label className={shared.pLabel} htmlFor="current-pw">
                  Current password
                </label>
                <input
                  id="current-pw"
                  type="password"
                  className="text-input"
                  placeholder="••••••••"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                />
              </div>
              <div className={shared.pField}>
                <label className={shared.pLabel} htmlFor="new-pw">
                  New password
                </label>
                <input
                  id="new-pw"
                  type="password"
                  className="text-input"
                  placeholder="••••••••"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                />
              </div>
              <div className={shared.pField}>
                <label className={shared.pLabel} htmlFor="confirm-pw">
                  Confirm new password
                </label>
                <input
                  id="confirm-pw"
                  type="password"
                  className="text-input"
                  placeholder="••••••••"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                />
              </div>
              <button className={`primary-button ${styles.fullWidthButton}`}>
                Update Password
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
