import { App, Modal } from "obsidian";
import { EventManager } from "../data/EventManager";
import { CalendarManager } from "../data/CalendarManager";
import { ChronicleEvent, AlertOffset } from "../types";

export class EventModal extends Modal {
  private eventManager: EventManager;
  private calendarManager: CalendarManager;
  private editingEvent: ChronicleEvent | null;
  private onSave?: () => void;
  private onExpand?: (event?: ChronicleEvent) => void;

  constructor(
    app: App,
    eventManager: EventManager,
    calendarManager: CalendarManager,
    editingEvent?: ChronicleEvent,
    onSave?: () => void,
    onExpand?: (event?: ChronicleEvent) => void
  ) {
    super(app);
    this.eventManager    = eventManager;
    this.calendarManager = calendarManager;
    this.editingEvent    = editingEvent ?? null;
    this.onSave          = onSave;
    this.onExpand        = onExpand;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("chronicle-event-modal");

    const e         = this.editingEvent;
    const calendars = this.calendarManager.getAll();

    // ── Header ──────────────────────────────────────────────────────────
    const header = contentEl.createDiv("cem-header");
    header.createDiv("cem-title").setText(e && e.id ? "Edit event" : "New event");

    const expandBtn = header.createEl("button", { cls: "cf-btn-ghost cem-expand-btn" });
    expandBtn.title = "Open as full page";
    expandBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
    expandBtn.addEventListener("click", () => {
      this.close();
      this.onExpand?.(e ?? undefined);
    });

    // ── Scrollable form ──────────────────────────────────────────────────
    const form = contentEl.createDiv("cem-form");

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
    const allDayField  = this.field(form, "All day");
    const allDayWrap   = allDayField.createDiv("cem-toggle-wrap");
    const allDayToggle = allDayWrap.createEl("input", { type: "checkbox", cls: "cem-toggle" });
    allDayToggle.checked = e?.allDay ?? false;
    const allDayLabel  = allDayWrap.createSpan({ cls: "cem-toggle-label" });
    allDayLabel.setText(allDayToggle.checked ? "Yes" : "No");
    allDayToggle.addEventListener("change", () => {
      allDayLabel.setText(allDayToggle.checked ? "Yes" : "No");
      timeFields.style.display = allDayToggle.checked ? "none" : "";
    });

    // Start + End date
    const dateRow        = form.createDiv("cf-row");
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

    // Time fields
    const timeFields     = form.createDiv("cf-row");
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
    const recurrences = [
      { value: "",                                   label: "Never" },
      { value: "FREQ=DAILY",                         label: "Every day" },
      { value: "FREQ=WEEKLY",                        label: "Every week" },
      { value: "FREQ=MONTHLY",                       label: "Every month" },
      { value: "FREQ=YEARLY",                        label: "Every year" },
      { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",  label: "Weekdays" },
    ];
    for (const r of recurrences) {
      const opt = recSelect.createEl("option", { value: r.value, text: r.label });
      if (e?.recurrence === r.value) opt.selected = true;
    }

    // Alert
    const alertSelect = this.field(form, "Alert").createEl("select", { cls: "cf-select" });
    const alerts: { value: AlertOffset; label: string }[] = [
      { value: "none",    label: "None" },
      { value: "at-time", label: "At time of event" },
      { value: "5min",    label: "5 minutes before" },
      { value: "10min",   label: "10 minutes before" },
      { value: "15min",   label: "15 minutes before" },
      { value: "30min",   label: "30 minutes before" },
      { value: "1hour",   label: "1 hour before" },
      { value: "2hours",  label: "2 hours before" },
      { value: "1day",    label: "1 day before" },
      { value: "2days",   label: "2 days before" },
      { value: "1week",   label: "1 week before" },
    ];
    for (const a of alerts) {
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
    const tagsInput = this.field(form, "Tags").createEl("input", {
      type: "text", cls: "cf-input",
      placeholder: "work, personal  (comma separated)"
    });
    tagsInput.value = e?.tags?.join(", ") ?? "";

    const defaultAlert = this.plugin?.settings?.defaultAlert ?? "none";
    for (const a of alerts) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if (e?.alert === a.value) opt.selected = true;
    }

    // ── Footer (always visible, outside scroll area) ───────────────────
    const footer    = contentEl.createDiv("cem-footer");
    const cancelBtn = footer.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });

    if (e && e.id) {
      const deleteBtn = footer.createEl("button", { cls: "cf-btn-delete", text: "Delete event" });
      deleteBtn.addEventListener("click", async () => {
        await this.eventManager.delete(e.id);
        this.onSave?.();
        this.close();
      });
    }

    const saveBtn = footer.createEl("button", {
      cls: "cf-btn-primary", text: e && e.id ? "Save" : "Add event"
    });

    // ── Handlers ──────────────────────────────────────────────────────────
    cancelBtn.addEventListener("click", () => this.close());

    const handleSave = async () => {
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.focus();
        titleInput.classList.add("cf-error");
        return;
      }

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
        tags:              e?.tags ?? [],
        notes:       e?.notes,
        linkedTaskIds:      e?.linkedTaskIds ?? [],
        completedInstances: e?.completedInstances ?? [],
      };

      if (e && e.id) {
        await this.eventManager.update({ ...e, ...eventData });
      } else {
        await this.eventManager.create(eventData);
      }

      this.onSave?.();
      this.close();
    };

    saveBtn.addEventListener("click", handleSave);
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSave();
      if (e.key === "Escape") this.close();
    });
  }

  private field(parent: HTMLElement, label: string): HTMLElement {
    const wrap = parent.createDiv("cf-field");
    wrap.createDiv("cf-label").setText(label);
    return wrap;
  }

  onClose() {
    this.contentEl.empty();
  }

  private cemField(parent: HTMLElement, label: string): HTMLElement {
    const wrap = parent.createDiv("cf-field");
    wrap.createDiv("cf-label").setText(label);
    return wrap;
  }
}