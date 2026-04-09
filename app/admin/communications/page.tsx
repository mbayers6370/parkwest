"use client";

import "./communications.css";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useAdminProperty } from "@/components/admin-property-provider";
import {
  COMMUNICATION_AUDIENCE_OPTIONS,
  COMMUNICATIONS_UPDATED_EVENT,
  getAllCommunications,
  getCommunicationAudienceLabel,
  getGroupedSlots,
  loadStoredCommunications,
  saveStoredCommunications,
  splitCommunicationsByStatus,
  type CommunicationAudience,
  type CommunicationItem,
  type CommunicationSignupSlot,
  type CommunicationType,
} from "@/lib/communications";
import { appendAdminAuditEvent } from "@/lib/admin-audit-log-store";

type TabKey = "active" | "archived" | "create";

type DraftSlot = {
  id: string;
  dateIso: string;
  startTime: string;
  endTime: string;
  capacity: number;
  signupCount: number;
};

function formatSlotDateLabel(dateIso: string) {
  if (!dateIso) {
    return "";
  }

  return new Date(`${dateIso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "numeric",
    day: "numeric",
  });
}

function formatTimeLabel(timeValue: string) {
  if (!timeValue) {
    return "";
  }

  const [rawHour, rawMinute] = timeValue.split(":").map(Number);

  if (!Number.isFinite(rawHour) || !Number.isFinite(rawMinute)) {
    return "";
  }

  const meridiem = rawHour >= 12 ? "PM" : "AM";
  const normalizedHour = rawHour % 12 || 12;
  return `${normalizedHour}:${String(rawMinute).padStart(2, "0")} ${meridiem}`;
}

function buildSlotTimeLabel(startTime: string, endTime: string) {
  const startLabel = formatTimeLabel(startTime);
  const endLabel = formatTimeLabel(endTime);

  if (!startLabel || !endLabel) {
    return "";
  }

  return `${startLabel} - ${endLabel}`;
}

function parseStoredTimeLabel(timeLabel: string) {
  const [startLabel = "", endLabel = ""] = timeLabel.split("-").map((part) => part.trim());

  return {
    startTime: parseTimeLabelToInputValue(startLabel),
    endTime: parseTimeLabelToInputValue(endLabel),
  };
}

function parseTimeLabelToInputValue(timeLabel: string) {
  const match = timeLabel.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return "";
  }

  const rawHour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  let hour = rawHour % 12;

  if (meridiem === "PM") {
    hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function AdminCommunicationsPage() {
  const adminProperty = useAdminProperty();
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [storedCommunications, setStoredCommunications] = useState<CommunicationItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [type, setType] = useState<CommunicationType>("announcement");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<CommunicationAudience[]>(["all_employees"]);
  const [expiresAt, setExpiresAt] = useState("");
  const [slots, setSlots] = useState<DraftSlot[]>([]);
  const [editingCommunicationId, setEditingCommunicationId] = useState<string | null>(null);
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

  useEffect(() => {
    if (type === "meeting" && slots.length === 0) {
      addDraftSlot();
    }
  }, [slots.length, type]);

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
        startTime: "",
        endTime: "",
        capacity: 12,
        signupCount: 0,
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
    setAudience(["all_employees"]);
    setExpiresAt("");
    setSlots([]);
    setEditingCommunicationId(null);
  }

  function handleCreateCommunication(event: React.FormEvent) {
    event.preventDefault();

    if (!adminProperty?.propertyKey) {
      return;
    }

    const hasInvalidSlotTime =
      type === "meeting" &&
      slots.some(
        (slot) =>
          slot.dateIso &&
          slot.startTime &&
          slot.endTime &&
          slot.endTime <= slot.startTime,
      );

    if (hasInvalidSlotTime) {
      setMessage("Each meeting time needs an end time that is later than the start time.");
      return;
    }

    if (audience.length === 0) {
      setMessage("Select at least one audience for this communication.");
      return;
    }

    const audienceLabel =
      getCommunicationAudienceLabel(audience) || "All Employees";

    const existingItem =
      editingCommunicationId != null
        ? communications.find((item) => item.id === editingCommunicationId) ?? null
        : null;

    const nextItem: CommunicationItem = {
      id: existingItem?.id ?? `communication-${Date.now()}`,
      propertyKey: adminProperty.propertyKey,
      title: title.trim(),
      summary: summary.trim(),
      body: body.trim() || undefined,
      type,
      audience,
      audienceLabel,
      publishedAt: existingItem?.publishedAt ?? new Date().toISOString(),
      expiresAt: expiresAt ? `${expiresAt}T23:59:59.000Z` : undefined,
      slots:
        type === "meeting"
          ? slots
              .filter((slot) => slot.dateIso && slot.startTime && slot.endTime)
              .map((slot) => ({
                id: slot.id,
                dateIso: slot.dateIso,
                dateLabel: formatSlotDateLabel(slot.dateIso),
                timeLabel: buildSlotTimeLabel(slot.startTime, slot.endTime),
                capacity: slot.capacity,
                signups:
                  existingItem?.slots?.find((existingSlot) => existingSlot.id === slot.id)?.signups ?? [],
              }))
          : undefined,
    };

    const nextItems = existingItem
      ? communications.map((item) => (item.id === existingItem.id ? nextItem : item))
      : [nextItem, ...communications];

    saveItems(nextItems);
    appendAdminAuditEvent({
      category: "communications",
      action: existingItem ? "Edited" : "Published",
      title: nextItem.title,
      detail: existingItem
        ? `${nextItem.type === "meeting" ? "Meeting" : "Announcement"} updated`
        : `${nextItem.type === "meeting" ? "Meeting" : "Announcement"} published`,
      actor: "Manager / Admin",
      propertyKey: adminProperty.propertyKey,
      propertyName: adminProperty.propertyName,
    });
    setExpandedIds((current) => ({ ...current, [nextItem.id]: true }));
    setActiveTab("active");
    setMessage(
      existingItem ? `Saved changes to ${nextItem.title}.` : `Published ${nextItem.title}.`,
    );
    resetDraft();
  }

  function handleDeleteCommunication(id: string) {
    const targetItem = communications.find((item) => item.id === id);
    saveItems(communications.filter((item) => item.id !== id));
    if (targetItem) {
      appendAdminAuditEvent({
        category: "communications",
        action: "Deleted",
        title: targetItem.title,
        detail: `${targetItem.type === "meeting" ? "Meeting" : "Announcement"} removed`,
        actor: "Manager / Admin",
        propertyKey: adminProperty?.propertyKey,
        propertyName: adminProperty?.propertyName,
      });
    }
    setExpandedIds((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function toggleAudienceOption(option: CommunicationAudience) {
    setAudience((current) =>
      current.includes(option)
        ? current.filter((entry) => entry !== option)
        : [...current, option],
    );
  }

  function handleEditCommunication(item: CommunicationItem) {
    setEditingCommunicationId(item.id);
    setType(item.type);
    setTitle(item.title);
    setSummary(item.summary);
    setBody(item.body ?? "");
    setAudience(item.audience);
    setExpiresAt(item.expiresAt ? item.expiresAt.slice(0, 10) : "");
    setSlots(
      item.type === "meeting"
        ? (item.slots ?? []).map((slot) => {
            const parsedTime = parseStoredTimeLabel(slot.timeLabel);

            return {
              id: slot.id,
              dateIso: slot.dateIso,
              startTime: parsedTime.startTime,
              endTime: parsedTime.endTime,
              capacity: slot.capacity,
              signupCount: slot.signups.length,
            };
          })
        : [],
    );
    setMessage(null);
    setActiveTab("create");
  }

  return (
    <>
      <header className="admin-page-header">
        <p className="admin-page-eyebrow">Manager / Admin</p>
        <h1 className="admin-page-title">Communications</h1>
        <p className="admin-page-subtitle">
          Publish team notices, required trainings, and meetings for{" "}
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
            className={`admin-page-tab${activeTab === "create" ? " active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            Create
          </button>
          <button
            type="button"
            className={`admin-page-tab${activeTab === "archived" ? " active" : ""}`}
            onClick={() => setActiveTab("archived")}
          >
            Archived
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
                  {editingCommunicationId
                    ? "Update the selected communication."
                    : "Create an announcement or a meeting for employees."}
                </p>
              </div>
            </div>
            <div className="admin-card-body">
              <form className="communications-form" onSubmit={handleCreateCommunication}>
                <div className="communications-form-grid">
                  <label className="field">
                    <span className="field-label">Type</span>
                    <select
                      className="text-input communications-select-input"
                      value={type}
                      onChange={(event) => setType(event.target.value as CommunicationType)}
                    >
                      <option value="announcement">Announcement</option>
                      <option value="meeting">Meeting</option>
                    </select>
                  </label>
                  <div className="field communications-audience-field">
                    <span className="field-label">Audience</span>
                    <div className="communications-audience-grid">
                      {COMMUNICATION_AUDIENCE_OPTIONS.map((option) => {
                        const selected = audience.includes(option.value);

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`communications-audience-chip${selected ? " active" : ""}`}
                            onClick={() => toggleAudienceOption(option.value)}
                            aria-pressed={selected}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {type === "announcement" ? (
                    <label className="field">
                      <span className="field-label">Archive After</span>
                      <input
                        type="date"
                        className="text-input"
                        value={expiresAt}
                        onChange={(event) => setExpiresAt(event.target.value)}
                      />
                    </label>
                  ) : (
                    <p className="communications-archive-note">
                      Meetings archive automatically after the last meeting time ends.
                    </p>
                  )}
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

                {type === "meeting" ? (
                  <div className="communications-slot-builder">
                    <div className="communications-section-header">
                      <div>
                        <p className="admin-card-title">Meeting Dates & Times</p>
                        <p className="admin-card-subtitle">
                          Add each meeting date, time range, and how many employees can sign up.
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
                          <p className="mini-title">No meeting times yet</p>
                          <p className="mini-copy">
                            Add one or more dates with start times, end times, and available slots.
                          </p>
                        </div>
                      ) : (
                        slots.map((slot) => (
                          <div key={slot.id} className="communications-slot-row">
                            <div className="communications-slot-fields">
                              <label className="field">
                                <span className="field-label">Date</span>
                                <input
                                  type="date"
                                  className="text-input"
                                  value={slot.dateIso}
                                  onChange={(event) =>
                                    updateDraftSlot(slot.id, { dateIso: event.target.value })
                                  }
                                />
                              </label>
                              <label className="field">
                                <span className="field-label">Start Time</span>
                                <input
                                  type="time"
                                  className="text-input communications-time-input"
                                  value={slot.startTime}
                                  onChange={(event) =>
                                    updateDraftSlot(slot.id, { startTime: event.target.value })
                                  }
                                />
                              </label>
                              <label className="field">
                                <span className="field-label">End Time</span>
                                <input
                                  type="time"
                                  className="text-input communications-time-input"
                                  value={slot.endTime}
                                  onChange={(event) =>
                                    updateDraftSlot(slot.id, { endTime: event.target.value })
                                  }
                                />
                              </label>
                              <label className="field">
                                <span className="field-label">Open Slots</span>
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
                              </label>
                              <p className="mini-label communications-slot-signups">
                                {slot.signupCount}/{slot.capacity} signed up
                              </p>
                              <button
                                type="button"
                                className="secondary-button communications-slot-delete"
                                onClick={() => removeDraftSlot(slot.id)}
                                aria-label="Remove meeting time"
                              >
                                <Trash2 size={16} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="button-row communications-actions-row">
                  <button type="submit" className="primary-button">
                    {editingCommunicationId ? "Save Changes" : "Publish Communication"}
                  </button>
                  {editingCommunicationId ? (
                    <button type="button" className="secondary-button" onClick={resetDraft}>
                      Cancel Edit
                    </button>
                  ) : null}
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
                        {item.type === "meeting" ? "Meeting" : "Announcement"}
                      </p>
                      <h2 className="communications-row-title">{item.title}</h2>
                      <p className="communications-row-meta">
                        {item.audienceLabel}
                      </p>
                    </div>
                    <div className="communications-row-right">
                      {item.type === "meeting" ? (
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

                      {item.type === "meeting" ? (
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

                      <div className="button-row communications-actions-row">
                        {activeTab === "active" ? (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => handleEditCommunication(item)}
                          >
                            Edit
                          </button>
                        ) : null}
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
                        ? "Published notices and meetings will appear here."
                        : "Past notices and expired meetings will move here automatically."}
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
