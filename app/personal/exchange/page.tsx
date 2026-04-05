import { OPEN_SHIFT_POSTS } from "@/lib/open-shifts";
import shared from "../personal-shared.module.css";
import styles from "./exchange.module.css";

export default function PersonalExchangePage() {
  return (
    <main className={shared.personalContent}>
      <div
        className={`${shared.personalColMain} ${shared.personalSection} ${shared.personalFullSpan}`}
      >
        <div className={shared.personalSectionHeader}>
          <div>
            <p className={shared.personalSectionKicker}>Shift Exchange</p>
            <h2 className={shared.personalSectionTitle}>Open Shifts</h2>
          </div>
        </div>

        <div className={`${shared.pCard} ${styles.exchangeBoardCard}`}>
          <div className={shared.pCardHeader}>
            <p className={shared.pCardTitle}>Open Shifts</p>
          </div>
          <div className={`${shared.pCardBody} ${styles.exchangeScrollBody}`}>
            <div className={`${styles.exchangeList} ${styles.exchangeScrollList}`}>
              {OPEN_SHIFT_POSTS.map((post) => (
                <div key={post.id} className={styles.exchangeRow}>
                  <p className={styles.exchangeRowTitle}>{post.title}</p>
                  <p className={styles.exchangeRowTime}>{post.line}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
