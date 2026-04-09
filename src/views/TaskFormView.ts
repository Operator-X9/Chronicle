import { ChronicleTask, TaskStatus, TaskPriority, AlertOffset } from "../types";
import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import { TaskManager } from "../data/TaskManager";
import { CalendarManager } from "../data/CalendarManager";
import { ChronicleTask, TaskStatus, TaskPriority } from "../types";

export const TASK_FORM_VIEW_TYPE = "chronicle-task-form";

export class TaskFormView extends ItemView {
  private taskManager: TaskManager;
  private calendarManager: CalendarManager;
  private editingTask: ChronicleTask | null = null;
  onSave?: () => void;

  constructor(
    leaf: WorkspaceLeaf,
    taskManager: TaskManager,
    calendarManager: CalendarManager,
    editingTask?: ChronicleTask,
    onSave?: () => void
  ) {
    super(leaf);
    this.taskManager = taskManager;
    this.calendarManager = calendarManager;
    this.editingTask = editingTask ?? null;
    this.onSave = onSave;
  }

  getViewType(): string { return TASK_FORM_VIEW_TYPE; }
  getDisplayText(): string { return this.editingTask ? "Edit task" : "New task"; }
  getIcon(): string { return "check-circle"; }

  async onOpen() { this.render(); }

  loadTask(task: ChronicleTask) {
    this.editingTask = task;
    this.render();
  }

  render() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("chronicle-form-page");

    const t = this.editingTask;
    const calendars = this.calendarManager.getAll();

    // ── Header ──────────────────────────────────────────────────────────────
    const header = container.createDiv("cf-header");
    const cancelBtn = header.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });
    header.createDiv("cf-header-title").setText(t ? "Edit task" : "New task");
    const saveBtn = header.createEl("button", { cls: "cf-btn-primary", text: t ? "Save" : "Add" });

    // ── Form ────────────────────────────────────────────────────────────────
    const form = container.createDiv("cf-form");

    // Title
    const titleField = this.field(form, "Title");
    const titleInput = titleField.createEl("input", {
      type: "text",
      cls: "cf-input cf-title-input",
      placeholder: "Task name",
    });
    titleInput.value = t?.title ?? "";
    titleInput.focus();

    // Location
    const locationInput = this.field(form, "Location").createEl("input", {
      type: "text", cls: "cf-input", placeholder: "Add location"
    });
    locationInput.value = t?.location ?? "";

    // Status + Priority (side by side)
    const row1 = form.createDiv("cf-row");

    const statusField = this.field(row1, "Status");
    const statusSelect = statusField.createEl("select", { cls: "cf-select" });
    const statuses: { value: TaskStatus; label: string }[] = [
      { value: "todo",        label: "To do" },
      { value: "in-progress", label: "In progress" },
      { value: "done",        label: "Done" },
      { value: "cancelled",   label: "Cancelled" },
    ];
    for (const s of statuses) {
      const opt = statusSelect.createEl("option", { value: s.value, text: s.label });
      if (t?.status === s.value) opt.selected = true;
    }

    const priorityField = this.field(row1, "Priority");
    const prioritySelect = priorityField.createEl("select", { cls: "cf-select" });
    const priorities: { value: TaskPriority; label: string; color: string }[] = [
      { value: "none",   label: "None",   color: "" },
      { value: "low",    label: "Low",    color: "#34C759" },
      { value: "medium", label: "Medium", color: "#FF9500" },
      { value: "high",   label: "High",   color: "#FF3B30" },
    ];
    for (const p of priorities) {
      const opt = prioritySelect.createEl("option", { value: p.value, text: p.label });
      if (t?.priority === p.value) opt.selected = true;
    }

    // Due date + time (side by side)
    const row2 = form.createDiv("cf-row");

    const dueDateField = this.field(row2, "Date");
    const dueDateInput = dueDateField.createEl("input", {
      type: "date", cls: "cf-input"
    });
    dueDateInput.value = t?.dueDate ?? "";

    const dueTimeField = this.field(row2, "Time");
    const dueTimeInput = dueTimeField.createEl("input", {
      type: "time", cls: "cf-input"
    });
    dueTimeInput.value = t?.dueTime ?? "";

    // Recurrence
    const recField = this.field(form, "Repeat");
    const recSelect = recField.createEl("select", { cls: "cf-select" });
    const recurrences = [
      { value: "",                        label: "Never" },
      { value: "FREQ=DAILY",              label: "Every day" },
      { value: "FREQ=WEEKLY",             label: "Every week" },
      { value: "FREQ=MONTHLY",            label: "Every month" },
      { value: "FREQ=YEARLY",             label: "Every year" },
      { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", label: "Weekdays" },
    ];
    for (const r of recurrences) {
      const opt = recSelect.createEl("option", { value: r.value, text: r.label });
      if (t?.recurrence === r.value) opt.selected = true;
    }

    // Alert
    const alertField  = this.field(form, "Alert");
    const alertSelect = alertField.createEl("select", { cls: "cf-select" });
    const formAlerts: { value: AlertOffset; label: string }[] = [
      { value: "none",    label: "None" },
      { value: "at-time", label: "At time of task" },
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
    for (const a of formAlerts) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if (t?.alert === a.value) opt.selected = true;
    }

    // Calendar
    const calField = this.field(form, "Calendar");
    const calSelect = calField.createEl("select", { cls: "cf-select" });
    calSelect.createEl("option", { value: "", text: "None" });
    for (const cal of calendars) {
      const opt = calSelect.createEl("option", { value: cal.id, text: cal.name });
      if (t?.calendarId === cal.id) opt.selected = true;
    }

    // Update calendar select dot color
    const updateCalColor = () => {
      const cal = this.calendarManager.getById(calSelect.value);
      calSelect.style.borderLeftColor = cal ? CalendarManager.colorToHex(cal.color) : "transparent";
      calSelect.style.borderLeftWidth = "4px";
      calSelect.style.borderLeftStyle = "solid";
    };
    calSelect.addEventListener("change", updateCalColor);
    updateCalColor();

    // Tags
    const tagsField = this.field(form, "Tags");
    const tagsInput = tagsField.createEl("input", {
      type: "text", cls: "cf-input",
      placeholder: "work, personal, urgent  (comma separated)"
    });
    tagsInput.value = t?.tags.join(", ") ?? "";

    // Linked notes
    const linkedField = this.field(form, "Linked notes");
    const linkedInput = linkedField.createEl("input", {
      type: "text", cls: "cf-input",
      placeholder: "Projects/Website, Journal/2024  (comma separated)"
    });
    linkedInput.value = t?.linkedNotes.join(", ") ?? "";

    // Notes
    const notesField = this.field(form, "Notes");
    const notesInput = notesField.createEl("textarea", {
      cls: "cf-textarea", placeholder: "Add notes..."
    });
    notesInput.value = t?.notes ?? "";

    // ── Actions ──────────────────────────────────────────────────────────────
    cancelBtn.addEventListener("click", () => {
      this.app.workspace.detachLeavesOfType(TASK_FORM_VIEW_TYPE);
    });

    const handleSave = async () => {
      const title = titleInput.value.trim();
      if (!title) { titleInput.focus(); titleInput.classList.add("cf-error"); return; }

  // Check for duplicate title
      if (!this.editingTask) {
        const existing = await this.taskManager.getAll();
        const duplicate = existing.find(
          t => t.title.toLowerCase() === title.toLowerCase()
        );
        if (duplicate) {
          new Notice(`A task named "${title}" already exists.`, 4000);
          titleInput.classList.add("cf-error");
          titleInput.focus();
          return;
        }
      }

      const taskData = {
        title,
        location:    locationInput.value || undefined,
        status:        statusSelect.value as TaskStatus,
        priority:      prioritySelect.value as TaskPriority,
        dueDate:       dueDateInput.value || undefined,
        dueTime:       dueTimeInput.value || undefined,
        calendarId:    calSelect.value || undefined,
        recurrence:    recSelect.value || undefined,
        tags:          tagsInput.value ? tagsInput.value.split(",").map(s => s.trim()).filter(Boolean) : [],
        contexts:      [],
        linkedNotes:   linkedInput.value ? linkedInput.value.split(",").map(s => s.trim()).filter(Boolean) : [],
        projects:      t?.projects ?? [],
        timeEntries:   t?.timeEntries ?? [],
        completedInstances: t?.completedInstances ?? [],
        customFields:  t?.customFields ?? [],
        alert:         alertSelect.value as AlertOffset,
        notes:         notesInput.value || undefined,
      };

      if (t) {
        await this.taskManager.update({ ...t, ...taskData });
      } else {
        await this.taskManager.create(taskData);
      }

      this.onSave?.();
      this.app.workspace.detachLeavesOfType(TASK_FORM_VIEW_TYPE);
    };

    saveBtn.addEventListener("click", handleSave);

    // Tab through fields naturally, Enter on title saves
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSave();
    });
  }

  private field(parent: HTMLElement, label: string): HTMLElement {
    const wrap = parent.createDiv("cf-field");
    wrap.createDiv("cf-label").setText(label);
    return wrap;
  }
}