import { ItemView, WorkspaceLeaf } from "obsidian";
import { EventManager } from "../data/EventManager";
import { CalendarManager } from "../data/CalendarManager";
import { TaskManager } from "../data/TaskManager";
import { ChronicleEvent, AlertOffset } from "../types";

export const EVENT_FORM_VIEW_TYPE = "chronicle-event-form";

export class EventFormView extends ItemView {
  private eventManager: EventManager;
  private calendarManager: CalendarManager;
  private taskManager: TaskManager;
  private editingEvent: ChronicleEvent | null = null;
  onSave?: () => void;

  constructor(
    leaf: WorkspaceLeaf,
    eventManager: EventManager,
    calendarManager: CalendarManager,
    taskManager: TaskManager,
    editingEvent?: ChronicleEvent,
    onSave?: () => void
  ) {
    super(leaf);
    this.eventManager    = eventManager;
    this.calendarManager = calendarManager;
    this.taskManager     = taskManager;
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

    // Fetch all tasks upfront for linked-tasks UI
    const allTasks = await this.taskManager.getAll();
    let linkedIds: string[] = [...(e?.linkedTaskIds ?? [])];

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

    // Linked notes
    const linkedInput = this.field(form, "Linked notes").createEl("input", {
      type: "text", cls: "cf-input",
      placeholder: "Projects/Website, Journal/2024  (comma separated)"
    });
    linkedInput.value = e?.linkedNotes?.join(", ") ?? "";

    // ── Linked tasks ─────────────────────────────────────────────────────
    const linkedTasksField = this.field(form, "Linked tasks");
    const linkedList       = linkedTasksField.createDiv("ctl-list");

    const renderLinkedList = () => {
      linkedList.empty();
      const items = allTasks.filter(t => linkedIds.includes(t.id));
      if (items.length === 0) {
        linkedList.createDiv("ctl-empty").setText("No linked tasks");
      }
      for (const task of items) {
        const row = linkedList.createDiv("ctl-item");
        row.createSpan({ cls: `ctl-status ctl-status-${task.status}` });
        row.createSpan({ cls: "ctl-title" }).setText(task.title);
        const unlinkBtn = row.createEl("button", { cls: "ctl-unlink", text: "×" });
        unlinkBtn.addEventListener("click", () => {
          linkedIds = linkedIds.filter(id => id !== task.id);
          renderLinkedList();
        });
      }
    };
    renderLinkedList();

    // Search to link existing tasks
    const searchWrap    = linkedTasksField.createDiv("ctl-search-wrap");
    const searchInput   = searchWrap.createEl("input", {
      type: "text", cls: "cf-input ctl-search",
      placeholder: "Search tasks to link…"
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

      const matches = allTasks
        .filter(t => !linkedIds.includes(t.id) && t.title.toLowerCase().includes(q))
        .slice(0, 6);

      if (matches.length === 0) { closeSearch(); return; }
      searchResults.style.display = "";
      for (const task of matches) {
        const item = searchResults.createDiv("ctl-result-item");
        item.createSpan({ cls: `ctl-status ctl-status-${task.status}` });
        item.createSpan({ cls: "ctl-result-title" }).setText(task.title);
        item.addEventListener("mousedown", (ev) => {
          ev.preventDefault();
          linkedIds.push(task.id);
          searchInput.value = "";
          closeSearch();
          renderLinkedList();
        });
      }
    });

    searchInput.addEventListener("blur", () => {
      setTimeout(closeSearch, 150);
    });

    // Create new task and link it
    const newTaskWrap  = linkedTasksField.createDiv("ctl-new-wrap");
    const newTaskInput = newTaskWrap.createEl("input", {
      type: "text", cls: "cf-input ctl-new-input",
      placeholder: "New task title…"
    });
    const addTaskBtn = newTaskWrap.createEl("button", { cls: "cf-btn-primary ctl-add-btn", text: "Add task" });

    const createAndLink = async () => {
      const title = newTaskInput.value.trim();
      if (!title) return;
      const newTask = await this.taskManager.create({
        title,
        status:             "todo",
        priority:           "none",
        calendarId:         calSelect.value || undefined,
        tags:               [],
        linkedNotes:        [],
        projects:           [],
        timeEntries:        [],
        customFields:       [],
        completedInstances: [],
      });
      allTasks.push(newTask);
      linkedIds.push(newTask.id);
      newTaskInput.value = "";
      renderLinkedList();
    };

    addTaskBtn.addEventListener("click", createAndLink);
    newTaskInput.addEventListener("keydown", (ev) => {
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
        tags:        tagsInput.value ? tagsInput.value.split(",").map(s => s.trim()).filter(Boolean) : (e?.tags ?? []),
        linkedTaskIds:      linkedIds,
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
