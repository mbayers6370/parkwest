import { TriangleAlert } from "lucide-react";
import shared from "../personal-shared.module.css";
import styles from "./account.module.css";

export default function PersonalAccountPage() {
  return (
    <main className={shared.personalContent}>
      <div className={`${shared.personalColMain} ${shared.personalAccountMain}`}>
        <div className={shared.pCard}>
          <div className={`${shared.pCardHeader} ${styles.personalProfileCardHeader}`}>
            <p className={shared.pCardTitle}>Profile</p>
          </div>
          <div className={`${shared.pCardBody} ${styles.personalProfileCardBody}`}>
            <div className={styles.personalProfileSummary}>
              <div className={styles.profileAvatar}>—</div>
              <div>
                <p className={styles.profileIdentityTitle}>Not signed in</p>
                <p className={styles.profileIdentitySubtle}>Auth not yet wired</p>
              </div>
            </div>

            <div className={`data-list ${styles.dataList}`}>
              <div className="data-row">
                <div className="data-row-main">
                  <p className="data-row-title">Employee ID</p>
                </div>
                <span className={styles.profileMutedValue}>—</span>
              </div>
              <div className="data-row">
                <div className="data-row-main">
                  <p className="data-row-title">Department</p>
                </div>
                <span className={styles.profileMutedValue}>—</span>
              </div>
              <div className="data-row">
                <div className="data-row-main">
                  <p className="data-row-title">Employment type</p>
                </div>
                <span className={styles.profileMutedValue}>—</span>
              </div>
            </div>
          </div>
        </div>

        <div className={shared.pCard}>
          <div className={shared.pCardHeader}>
            <p className={shared.pCardTitle}>Password</p>
          </div>
          <div className={shared.pCardBody}>
            <div className={`notice-card warn ${styles.passwordNotice}`}>
              <TriangleAlert size={14} aria-hidden="true" />
              <div>
                <p className="notice-title">Auth not yet connected</p>
                <p className="notice-body">
                  Password change will be available once login is wired up.
                </p>
              </div>
            </div>

            <div className={shared.pForm}>
              <div className={shared.pField}>
                <label className={shared.pLabel} htmlFor="current-pw">
                  Current password
                </label>
                <input
                  id="current-pw"
                  type="password"
                  className="text-input"
                  disabled
                  placeholder="••••••••"
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
                  disabled
                  placeholder="••••••••"
                />
              </div>
              <button className={`primary-button ${styles.fullWidthButton}`} disabled>
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
