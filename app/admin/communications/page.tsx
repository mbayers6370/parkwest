"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus2, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useAdminProperty } from "@/components/admin-property-provider";
import {
  COMMUNICATION_AUDIENCE_OPTIONS,
  COMMUNICATIONS_UPDATED_EVENT,
  getAllCommunications,
  getGroupedSlots,
  loadStoredCommunications,
  saveStoredCommunications,
  splitCommunicationsByStatus,
  type CommunicationAudience,
  type CommunicationItem,
  type CommunicationSignupSlot,
  type CommunicationType,
} from "@/lib/communications";

type TabKey = "active" | "archived" | "create";

type DraftSlot = {
  id: string;
  dateIso: string;
  dateLabel: string;
  timeLabel: string;
  capacity: number;
};

export default function AdminCommunicationsPage() {
  const adminProperty = useAdminProperty();
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [storedCommunications, setStoredCommunications] = useState<CommunicationItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [type, setType] = useState<CommunicationType>("announcement");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<CommunicationAudience>("all_employees");
  const [required, setRequired] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [slots, setSlots] = useState<DraftSlot[]>([]);
  const [message, setMessage] = useState<string | null>(null);

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

  const communications = useMemo(
    () => getAllCommunications(storedCommunications, adminProperty?.propertyKey),
    [adminProperty?.propertyKey, storedCommunications],
  );

  const { active, archived } = useMemo(
    () => splitCommunicationsByStatus(communications, new Date()),
    [communications],
  );

  function saveItems(nextItems: CommunicationItem[]) {
    setStoredCommunications(nextItems);
    saveStoredCommunications(nextItems);
  }

  function addDraftSlot() {
    setSlots((current) => [
      ...current,
      {
        id: `slot-${Date.now()}-${current.length}`,
        dateIso: "",
        dateLabel: "",
        timeLabel: "",
        capacity: 12,
      },
    ]);
  }

  function updateDraftSlot(slotId: string, patch: Partial<DraftSlot>) {
    setSlots((current) =>
      current.map((slot) => (slot.id === slotId ? { ...slot, ...patch } : slot)),
    );
  }

  function removeDraftSlot(slotId: string) {
    setSlots((current) => current.filter((slot) => slot.id !== slotId));
  }

  function resetDraft() {
    setType("announcement");
    setTitle("");
    setSummary("");
    setBody("");
    setAudience("all_employees");
    setRequired(false);
    setExpiresAt("");
    setSlots([]);
  }

  function handleCreateCommunication(event: React.FormEvent) {
    event.preventDefault();

    if (!adminProperty?.propertyKey) {
      return;
    }

    const audienceLabel =
      COMMUNICATION_AUDIENCE_OPTIONS.find((option) => option.value === audience)?.label ??
      "All Employees";

    const nextItem: CommunicationItem = {
      id: `communication-${Date.now()}`,
      propertyKey: adminProperty.propertyKey,
      title: title.trim(),
      summary: summary.trim(),
      body: body.trim() || undefined,
      type,
      audience,
      audienceLabel,
      required,
      publishedAt: new Date().toISOString(),
      expiresAt: expiresAt ? `${expiresAt}T23:59:59.000Z` : undefined,
      slots:
        type === "signup_event"
          ? slots
              .filter((slot) => slot.dateIso && slot.timeLabel.trim())
              .map((slot) => ({
                id: slot.id,
                dateIso: slot.dateIso,
                dateLabel:
                  slot.dateLabel.trim() ||
                  new Date(`${slot.dateIso}T12:00:00`).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "numeric",
                    day: "numeric",
                  }),
                timeLabel: slot.timeLabel.trim(),
                capacity: slot.capacity,
                signups: [],
              }))
          : undefined,
    };

    saveItems([nextItem, ...communications]);
    setExpandedIds((current) => ({ ...current, [nextItem.id]: true }));
    setActiveTab("active");
    setMessage(`Published ${nextItem.title}.`);
    resetDraft();
  }

  function handleDeleteCommunication(id: string) {
    saveItems(communications.filter((item) => item.id !== id));
    setExpandedIds((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Communications</h1>
        <p className="admin-page-subtitle">
          Publish team notices, required trainings, and sign-up events for{" "}
          {adminProperty?.propertyName ?? "this property"}.
        </p>
        <nav className="admin-page-tabs" aria-label="Communications views">
          <button
            type="button"
            className={`admin-page-tab${activeTab === "active" ? " active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active
          </button>
          <button
            type="button"
            className={`admin-page-tab${activeTab === "archived" ? " active" : ""}`}
            onClick={() => setActiveTab("archived")}
          >
            Archived
          </button>
          <button
            type="button"
            className={`admin-page-tab${activeTab === "create" ? " active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            Create
          </button>
        </nav>
      </header>

      <div className="admin-content communications-stack">
        {message ? (
          <div className="notice-card ok">
            <div>
              <p className="notice-title">Communication saved</p>
              <p className="notice-body">{message}</p>
            </div>
          </div>
        ) : null}

        {activeTab === "create" ? (
          <section className="admin-card full">
            <div className="admin-card-header">
              <div>
                <p className="admin-card-title">Create Communication</p>
                <p className="admin-card-subtitle">
                  Create an announcement or a sign-up event for employees.
                </p>
              </div>
            </div>
            <div className="admin-card-body">
              <form className="communications-form" onSubmit={handleCreateCommunication}>
                <div className="communications-form-grid">
                  <label className="field">
                    <span className="field-label">Type</span>
                    <select
                      className="select-input"
                      value={type}
                      onChange={(event) => setType(event.target.value as CommunicationType)}
                    >
                      <option value="announcement">Announcement</option>
                      <option value="signup_event">Sign-Up Event</option>
                    </select>
                  </label>
                  <label className="field">
                    <span className="field-label">Audience</span>
                    <select
                      className="select-input"
                      value={audience}
                      onChange={(event) => setAudience(event.target.value as CommunicationAudience)}
                    >
                      {COMMUNICATION_AUDIENCE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field-label">Archive After</span>
                    <input
                      type="date"
                      className="text-input"
                      value={expiresAt}
                      onChange={(event) => setExpiresAt(event.target.value)}
                    />
                  </label>
                </div>

                <label className="field">
                  <span className="field-label">Title</span>
                  <input
                    className="text-input"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Title 31 Training"
                    required
                  />
                </label>

                <label className="field">
                  <span className="field-label">Summary</span>
                  <input
                    className="text-input"
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="All FOH employees must attend one upcoming training session."
                    required
                  />
                </label>

                <label className="field">
                  <span className="field-label">Body</span>
                  <textarea
                    className="text-input"
                    rows={4}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Add additional details, requirements, or instructions."
                  />
                </label>

                <label className="communications-checkbox">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(event) => setRequired(event.target.checked)}
                  />
                  <span>Required communication</span>
                </label>

                {type === "signup_event" ? (
                  <div className="communications-slot-builder">
                    <div className="communications-section-header">
                      <div>
                        <p className="admin-card-title">Sign-Up Slots</p>
                        <p className="admin-card-subtitle">
                          Add the available days, times, and capacities.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={addDraftSlot}
                      >
                        <Plus size={16} aria-hidden="true" />
                        Add Slot
                      </button>
                    </div>

                    <div className="communications-slot-list">
                      {slots.length === 0 ? (
                        <div className="empty-state">
                          <p className="mini-title">No slots yet</p>
                          <p className="mini-copy">
                            Add one or more date/time options for employees to sign up.
                          </p>
                        </div>
                      ) : (
                        slots.map((slot) => (
                          <div key={slot.id} className="communications-slot-row">
                            <input
                              type="date"
                              className="text-input"
                              value={slot.dateIso}
                              onChange={(event) =>
                                updateDraftSlot(slot.id, { dateIso: event.target.value })
                              }
                            />
                            <input
                              className="text-input"
                              value={slot.dateLabel}
                              onChange={(event) =>
                                updateDraftSlot(slot.id, { dateLabel: event.target.value })
                              }
                              placeholder="Tuesday 4/28"
                            />
                            <input
                              className="text-input"
                              value={slot.timeLabel}
                              onChange={(event) =>
                                updateDraftSlot(slot.id, { timeLabel: event.target.value })
                              }
                              placeholder="8:30 AM - 9:30 AM"
                            />
                            <input
                              type="number"
                              className="text-input"
                              min={1}
                              value={slot.capacity}
                              onChange={(event) =>
                                updateDraftSlot(slot.id, {
                                  capacity: Number(event.target.value || 1),
                                })
                              }
                            />
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => removeDraftSlot(slot.id)}
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="button-row">
                  <button type="submit" className="primary-button">
                    <CalendarPlus2 size={16} aria-hidden="true" />
                    Publish Communication
                  </button>
                </div>
              </form>
            </div>
          </section>
        ) : (
          <div className="communications-list">
            {(activeTab === "active" ? active : archived).map((item) => {
              const isExpanded = expandedIds[item.id] ?? false;
              const signupCount = (item.slots ?? []).reduce(
                (sum, slot) => sum + slot.signups.length,
                0,
              );

              return (
                <section key={item.id} className="admin-card">
                  <button
                    type="button"
                    className="communications-row-toggle"
                    onClick={() =>
                      setExpandedIds((current) => ({
                        ...current,
                        [item.id]: !isExpanded,
                      }))
                    }
                  >
                    <div>
                      <p className="communications-row-kicker">
                        {item.type === "signup_event" ? "Sign-Up Event" : "Announcement"}
                      </p>
                      <h2 className="communications-row-title">{item.title}</h2>
                      <p className="communications-row-meta">
                        {item.audienceLabel} · {item.required ? "Required" : "Optional"}
                      </p>
                    </div>
                    <div className="communications-row-right">
                      {item.type === "signup_event" ? (
                        <span className="badge gold">{signupCount} Sign-Ups</span>
                      ) : null}
                      {isExpanded ? (
                        <ChevronDown size={18} aria-hidden="true" />
                      ) : (
                        <ChevronRight size={18} aria-hidden="true" />
                      )}
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="admin-card-body communications-card-body">
                      <p className="communications-copy">{item.summary}</p>
                      {item.body ? <p className="communications-copy muted">{item.body}</p> : null}

                      {item.type === "signup_event" ? (
                        <div className="communications-date-groups">
                          {getGroupedSlots(item).map((group) => (
                            <div key={group.dateIso} className="communications-date-group">
                              <h3 className="communications-date-title">{group.dateLabel}</h3>
                              <div className="communications-slot-chips">
                                {group.slots.map((slot) => (
                                  <div key={slot.id} className="communications-slot-chip">
                                    <span>{slot.timeLabel}</span>
                                    <span className="communications-slot-count">
                                      {slot.signups.length}/{slot.capacity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="button-row">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleDeleteCommunication(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}

            {(activeTab === "active" ? active : archived).length === 0 ? (
              <section className="admin-card">
                <div className="admin-card-body">
                  <div className="empty-state">
                    <p className="mini-title">
                      No {activeTab === "active" ? "active" : "archived"} communications.
                    </p>
                    <p className="mini-copy">
                      {activeTab === "active"
                        ? "Published notices and sign-up events will appear here."
                        : "Past notices and expired sign-up events will move here automatically."}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
