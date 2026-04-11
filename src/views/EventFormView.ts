import { ItemView, WorkspaceLeaf } from "obsidian";
import { EventManager } from "../data/EventManager";
import { CalendarManager } from "../data/CalendarManager";
import { ReminderManager } from "../data/ReminderManager";
import { ChronicleEvent, AlertOffset } from "../types";
import { buildTagField } from "../ui/tagField";
import { ALERT_OPTIONS, RECURRENCE_OPTIONS } from "../utils/constants";

export const EVENT_FORM_VIEW_TYPE = "chronicle-event-form";

export class EventFormView extends ItemView {
  private eventManager: EventManager;
  private calendarManager: CalendarManager;
  private reminderManager: ReminderManager;
  private editingEvent: ChronicleEvent | null = null;
  onSave?: () => void;

  constructor(
    leaf: WorkspaceLeaf,
    eventManager: EventManager,
    calendarManager: CalendarManager,
    reminderManager: ReminderManager,
    editingEvent?: ChronicleEvent,
    onSave?: () => void
  ) {
    super(leaf);
    this.eventManager    = eventManager;
    this.calendarManager = calendarManager;
    this.reminderManager = reminderManager;
    this.editingEvent    = editingEvent ?? null;
    this.onSave          = onSave;
  }

  getViewType():    string { return EVENT_FORM_VIEW_TYPE; }
  getDisplayText(): string { return this.editingEvent ? "Edit event" : "New event"; }
  getIcon():        string { return "calendar"; }

  async onOpen() { await this.render(); }

  loadEvent(event: ChronicleEvent) {
    this.editingEvent = event;
    this.render();
  }

  async render() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("chronicle-form-page");

    const e         = this.editingEvent;
    const calendars = this.calendarManager.getAll();

    // Fetch all reminders upfront for linked-reminders UI
    const allReminders = await this.reminderManager.getAll();
    let linkedIds: string[] = [...(e?.linkedReminderIds ?? [])];

    // ── Header ──────────────────────────────────────────────────────────
    const header = container.createDiv("cf-header");
    const cancelBtn = header.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });
    header.createDiv("cf-header-title").setText(e ? "Edit event" : "New event");
    const saveBtn = header.createEl("button", { cls: "cf-btn-primary", text: e ? "Save" : "Add" });

    // ── Form ─────────────────────────────────────────────────────────────
    const form = container.createDiv("cf-form");

    // Title
    const titleInput = this.field(form, "Title").createEl("input", {
      type: "text", cls: "cf-input cf-title-input", placeholder: "Event name"
    });
    titleInput.value = e?.title ?? "";
    titleInput.focus();

    // Location
    const locationInput = this.field(form, "Location").createEl("input", {
      type: "text", cls: "cf-input", placeholder: "Add location"
    });
    locationInput.value = e?.location ?? "";

    // All day toggle
    const allDayWrap   = this.field(form, "All day").createDiv("cem-toggle-wrap");
    const allDayToggle = allDayWrap.createEl("input", { type: "checkbox", cls: "cem-toggle" });
    allDayToggle.checked = e?.allDay ?? false;
    const allDayLabel  = allDayWrap.createSpan({ cls: "cem-toggle-label" });
    allDayLabel.setText(allDayToggle.checked ? "Yes" : "No");
    allDayToggle.addEventListener("change", () => {
      allDayLabel.setText(allDayToggle.checked ? "Yes" : "No");
      timeFields.style.display = allDayToggle.checked ? "none" : "";
    });

    // Dates
    const dateRow      = form.createDiv("cf-row");
    const startDateInput = this.field(dateRow, "Start date").createEl("input", {
      type: "date", cls: "cf-input"
    });
    startDateInput.value = e?.startDate ?? new Date().toISOString().split("T")[0];

    const endDateInput = this.field(dateRow, "End date").createEl("input", {
      type: "date", cls: "cf-input"
    });
    endDateInput.value = e?.endDate ?? new Date().toISOString().split("T")[0];

    startDateInput.addEventListener("change", () => {
      if (!endDateInput.value || endDateInput.value < startDateInput.value) {
        endDateInput.value = startDateInput.value;
      }
    });

    // Time fields (hidden when all-day)
    const timeFields = form.createDiv("cf-row");
    timeFields.style.display = allDayToggle.checked ? "none" : "";

    const startTimeInput = this.field(timeFields, "Start time").createEl("input", {
      type: "time", cls: "cf-input"
    });
    startTimeInput.value = e?.startTime ?? "09:00";

    const endTimeInput = this.field(timeFields, "End time").createEl("input", {
      type: "time", cls: "cf-input"
    });
    endTimeInput.value = e?.endTime ?? "10:00";

    // Repeat
    const recSelect = this.field(form, "Repeat").createEl("select", { cls: "cf-select" });
    for (const rec of RECURRENCE_OPTIONS) {
      const opt = recSelect.createEl("option", { value: rec.value, text: rec.label });
      if (e?.recurrence === rec.value) opt.selected = true;
    }

    // Alert
    const alertSelect = this.field(form, "Alert").createEl("select", { cls: "cf-select" });
    for (const a of ALERT_OPTIONS) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if (e?.alert === a.value) opt.selected = true;
    }

    // Calendar
    const calSelect = this.field(form, "Calendar").createEl("select", { cls: "cf-select" });
    calSelect.createEl("option", { value: "", text: "None" });
    for (const cal of calendars) {
      const opt = calSelect.createEl("option", { value: cal.id, text: cal.name });
      if (e?.calendarId === cal.id) opt.selected = true;
    }
    const updateCalColor = () => {
      const cal = this.calendarManager.getById(calSelect.value);
      calSelect.style.borderLeftColor = cal ? CalendarManager.colorToHex(cal.color) : "transparent";
      calSelect.style.borderLeftWidth = "4px";
      calSelect.style.borderLeftStyle = "solid";
    };
    calSelect.addEventListener("change", updateCalColor);
    updateCalColor();

    // Tags
    const tagField = buildTagField(this.app, this.field(form, "Tags"), e?.tags ?? []);

    // Linked notes
    const linkedInput = this.field(form, "Linked notes").createEl("input", {
      type: "text", cls: "cf-input",
      placeholder: "Projects/Website, Journal/2024  (comma separated)"
    });
    linkedInput.value = e?.linkedNotes?.join(", ") ?? "";

    // ── Linked reminders ─────────────────────────────────────────────────
    const linkedRemindersField = this.field(form, "Linked reminders");
    const linkedList           = linkedRemindersField.createDiv("ctl-list");

    const renderLinkedList = () => {
      linkedList.empty();
      const items = allReminders.filter(r => linkedIds.includes(r.id));
      if (items.length === 0) {
        linkedList.createDiv("ctl-empty").setText("No linked reminders");
      }
      for (const reminder of items) {
        const row = linkedList.createDiv("ctl-item");
        row.createSpan({ cls: `ctl-status ctl-status-${reminder.status}` });
        row.createSpan({ cls: "ctl-title" }).setText(reminder.title);
        const unlinkBtn = row.createEl("button", { cls: "ctl-unlink", text: "×" });
        unlinkBtn.addEventListener("click", () => {
          linkedIds = linkedIds.filter(id => id !== reminder.id);
          renderLinkedList();
        });
      }
    };
    renderLinkedList();

    // Search to link existing reminders
    const searchWrap    = linkedRemindersField.createDiv("ctl-search-wrap");
    const searchInput   = searchWrap.createEl("input", {
      type: "text", cls: "cf-input ctl-search",
      placeholder: "Search reminders to link…"
    });
    const searchResults = searchWrap.createDiv("ctl-results");
    searchResults.style.display = "none";

    const closeSearch = () => {
      searchResults.style.display = "none";
      searchResults.empty();
    };

    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase().trim();
      searchResults.empty();
      if (!q) { closeSearch(); return; }

      const matches = allReminders
        .filter(r => !linkedIds.includes(r.id) && r.title.toLowerCase().includes(q))
        .slice(0, 6);

      if (matches.length === 0) { closeSearch(); return; }
      searchResults.style.display = "";
      for (const reminder of matches) {
        const item = searchResults.createDiv("ctl-result-item");
        item.createSpan({ cls: `ctl-status ctl-status-${reminder.status}` });
        item.createSpan({ cls: "ctl-result-title" }).setText(reminder.title);
        item.addEventListener("mousedown", (ev) => {
          ev.preventDefault();
          linkedIds.push(reminder.id);
          searchInput.value = "";
          closeSearch();
          renderLinkedList();
        });
      }
    });

    searchInput.addEventListener("blur", () => {
      setTimeout(closeSearch, 150);
    });

    // Create new reminder and link it
    const newReminderWrap  = linkedRemindersField.createDiv("ctl-new-wrap");
    const newReminderInput = newReminderWrap.createEl("input", {
      type: "text", cls: "cf-input ctl-new-input",
      placeholder: "New reminder title…"
    });
    const addReminderBtn = newReminderWrap.createEl("button", { cls: "cf-btn-primary ctl-add-btn", text: "Add reminder" });

    const createAndLink = async () => {
      const title = newReminderInput.value.trim();
      if (!title) return;
      const newReminder = await this.reminderManager.create({
        title,
        status:             "todo",
        priority:           "none",
        alert:              "none",
        tags:               [],
        linkedNotes:        [],
        projects:           [],
        timeEntries:        [],
        customFields:       [],
        completedInstances: [],
      });
      allReminders.push(newReminder);
      linkedIds.push(newReminder.id);
      newReminderInput.value = "";
      renderLinkedList();
    };

    addReminderBtn.addEventListener("click", createAndLink);
    newReminderInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { ev.preventDefault(); createAndLink(); }
    });

    // Notes
    const notesInput = this.field(form, "Notes").createEl("textarea", {
      cls: "cf-textarea", placeholder: "Add notes..."
    });
    notesInput.value = e?.notes ?? "";

    // ── Actions ──────────────────────────────────────────────────────────
    cancelBtn.addEventListener("click", () => {
      this.app.workspace.detachLeavesOfType(EVENT_FORM_VIEW_TYPE);
    });

    const handleSave = async () => {
      const title = titleInput.value.trim();
      if (!title) { titleInput.focus(); titleInput.classList.add("cf-error"); return; }

      const eventData = {
        title,
        location:    locationInput.value || undefined,
        allDay:      allDayToggle.checked,
        startDate:   startDateInput.value,
        startTime:   allDayToggle.checked ? undefined : startTimeInput.value,
        endDate:     endDateInput.value || startDateInput.value,
        endTime:     allDayToggle.checked ? undefined : endTimeInput.value,
        recurrence:  recSelect.value || undefined,
        calendarId:  calSelect.value || undefined,
        alert:       alertSelect.value as AlertOffset,
        notes:       notesInput.value || undefined,
        linkedNotes: linkedInput.value ? linkedInput.value.split(",").map(s => s.trim()).filter(Boolean) : (e?.linkedNotes ?? []),
        tags:        tagField.getTags(),
        linkedReminderIds:  linkedIds,
        completedInstances: e?.completedInstances ?? [],
      };

      if (e?.id) {
        await this.eventManager.update({ ...e, ...eventData });
      } else {
        await this.eventManager.create(eventData);
      }

      this.onSave?.();
      this.app.workspace.detachLeavesOfType(EVENT_FORM_VIEW_TYPE);
    };

    saveBtn.addEventListener("click", handleSave);
    titleInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") handleSave();
    });
  }

  private field(parent: HTMLElement, label: string): HTMLElement {
    const wrap = parent.createDiv("cf-field");
    wrap.createDiv("cf-label").setText(label);
    return wrap;
  }
}
