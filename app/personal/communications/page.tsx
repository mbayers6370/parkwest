"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, CheckCircle2, ChevronDown } from "lucide-react";
import {
  COMMUNICATIONS_UPDATED_EVENT,
  getAllCommunications,
  getCommunicationEmployeeSignup,
  getGroupedSlots,
  loadStoredCommunications,
  saveStoredCommunications,
  splitCommunicationsByStatus,
  type CommunicationItem,
} from "@/lib/communications";
import shared from "../personal-shared.module.css";
import styles from "./communications.module.css";

const CURRENT_EMPLOYEE_NAME = "Matthew Bayers";

export default function PersonalCommunicationsPage() {
  const [storedCommunications, setStoredCommunications] = useState<CommunicationItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [changingSignupIds, setChangingSignupIds] = useState<string[]>([]);

  useEffect(() => {
    const syncCommunications = () => {
      setStoredCommunications(loadStoredCommunications());
    };

    syncCommunications();
    window.addEventListener(COMMUNICATIONS_UPDATED_EVENT, syncCommunications);
    window.addEventListener("storage", syncCommunications);

    return () => {
      window.removeEventListener(COMMUNICATIONS_UPDATED_EVENT, syncCommunications);
      window.removeEventListener("storage", syncCommunications);
    };
  }, []);

  const allCommunications = useMemo(
    () => getAllCommunications(storedCommunications, "580"),
    [storedCommunications],
  );
  const grouped = useMemo(
    () => splitCommunicationsByStatus(allCommunications, new Date()),
    [allCommunications],
  );
  const visibleItems = grouped.active;

  useEffect(() => {
    setExpandedIds((current) => {
      const nextIds = visibleItems.map((item) => item.id);
      const kept = current.filter((id) => nextIds.includes(id));

      return kept.length > 0 ? kept : nextIds;
    });
  }, [visibleItems]);

  useEffect(() => {
    setChangingSignupIds((current) =>
      current.filter((id) => visibleItems.some((item) => item.id === id)),
    );
  }, [visibleItems]);

  function updateCommunications(nextItems: CommunicationItem[]) {
    setStoredCommunications(nextItems);
    saveStoredCommunications(nextItems);
  }

  function handleSignup(itemId: string, slotId: string) {
    const nextItems = allCommunications.map((item) => {
      if (item.id !== itemId) {
        return item;
      }

      return {
        ...item,
        slots: item.slots?.map((slot) => {
          const nextSignups = slot.signups.filter((entry) => entry !== CURRENT_EMPLOYEE_NAME);

          if (slot.id === slotId) {
            nextSignups.push(CURRENT_EMPLOYEE_NAME);
          }

          return {
            ...slot,
            signups: nextSignups,
          };
        }),
      };
    });

    updateCommunications(nextItems);
    setChangingSignupIds((current) => current.filter((id) => id !== itemId));
  }

  function toggleItem(itemId: string) {
    setExpandedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  }

  return (
    <main className={shared.personalContent}>
      <div className={shared.personalFullSpan}>
        <section className={shared.personalSection}>
          <header className={shared.personalSectionHeader}>
            <div>
              <p className={shared.personalSectionKicker}>Team Updates</p>
              <h1 className={shared.personalSectionTitle}>Communications</h1>
            </div>
          </header>

          <div className={styles.stack}>
            {visibleItems.length === 0 ? (
              <div className={shared.personalPanel}>
                <div className="empty-state">
                  <p className="mini-title">No current communications.</p>
                  <p className="mini-copy">
                    New team notices and meetings will show up here.
                  </p>
                </div>
              </div>
            ) : (
              visibleItems.map((item) => {
                const employeeSignup = getCommunicationEmployeeSignup(item, CURRENT_EMPLOYEE_NAME);
                const isExpanded = expandedIds.includes(item.id);

                return (
                  <article key={item.id} className={shared.personalPanel}>
                    <button
                      type="button"
                      className={styles.cardToggle}
                      onClick={() => toggleItem(item.id)}
                      aria-expanded={isExpanded}
                    >
                      <div className={styles.cardHeader}>
                        <div>
                          <p className={styles.eyebrow}>
                            {item.type === "meeting" ? "Meeting" : "Notice"}
                          </p>
                          <h2 className={styles.title}>{item.title}</h2>
                          <p className={styles.meta}>
                            {item.audienceLabel}
                          </p>
                        </div>
                        <div className={styles.cardHeaderRight}>
                          {employeeSignup ? (
                            <span className="badge success">Signed Up</span>
                          ) : null}
                          <ChevronDown
                            size={18}
                            aria-hidden="true"
                            className={`${styles.cardChevron} ${isExpanded ? styles.cardChevronOpen : ""}`}
                          />
                        </div>
                      </div>
                    </button>

                  {isExpanded ? (
                      <div className={styles.cardBody}>
                        <p className={styles.summary}>{item.summary}</p>
                        {item.body ? <p className={styles.body}>{item.body}</p> : null}

                        {employeeSignup ? (
                          <div className={styles.signupSummary}>
                            <CheckCircle2 size={18} aria-hidden="true" />
                            <div className={styles.signupSummaryContent}>
                              <div>
                                <p className={styles.signupSummaryTitle}>You are signed up</p>
                                <p className={styles.signupSummaryMeta}>
                                  {employeeSignup.dateLabel} · {employeeSignup.timeLabel}
                                </p>
                              </div>
                              <button
                                type="button"
                                className={`secondary-button ${styles.signupSummaryButton}`}
                                onClick={() =>
                                  setChangingSignupIds((current) =>
                                    current.includes(item.id)
                                      ? current.filter((id) => id !== item.id)
                                      : [...current, item.id],
                                  )
                                }
                              >
                                {changingSignupIds.includes(item.id) ? "Cancel" : "Change Time"}
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {item.type === "meeting" ? (
                          <div className={styles.dateGroups}>
                            {getGroupedSlots(item).map((group) => (
                              <section key={group.dateIso} className={styles.dateGroup}>
                                <h3 className={styles.dateTitle}>{group.dateLabel}</h3>
                                <div className={styles.slotList}>
                                  {group.slots.map((slot) => {
                                    const isSelected = employeeSignup?.id === slot.id;
                                    const isFull =
                                      slot.signups.length >= slot.capacity && !isSelected;
                                    const isChangingTime = changingSignupIds.includes(item.id);
                                    const isLockedForChange =
                                      Boolean(employeeSignup) && !isChangingTime && !isSelected;

                                    return (
                                      <button
                                        key={slot.id}
                                        type="button"
                                        className={`${styles.slotButton} ${isSelected ? styles.slotButtonActive : ""}`}
                                        disabled={isFull || isLockedForChange}
                                        onClick={() => handleSignup(item.id, slot.id)}
                                      >
                                        <div>
                                          <p className={styles.slotTime}>{slot.timeLabel}</p>
                                          <p className={styles.slotMeta}>
                                            {slot.signups.length}/{slot.capacity} filled
                                          </p>
                                        </div>
                                        <div className={styles.slotAction}>
                                          {isSelected ? (
                                            <>
                                              <CalendarCheck2 size={18} aria-hidden="true" />
                                              <span>Selected</span>
                                            </>
                                          ) : isFull ? (
                                            <span>Full</span>
                                          ) : employeeSignup && isChangingTime ? (
                                            <span>Change To This Time</span>
                                          ) : employeeSignup ? (
                                            <span>Change Time</span>
                                          ) : (
                                            <span>Sign Up</span>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </section>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
