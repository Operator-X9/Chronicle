import { ChronicleTask, TaskStatus, TaskPriority, AlertOffset } from "../types";
import { App, Modal, Notice } from "obsidian";
import { TaskManager } from "../data/TaskManager";
import { CalendarManager } from "../data/CalendarManager";
import { ChronicleTask, TaskStatus, TaskPriority } from "../types";

export class TaskModal extends Modal {
  private taskManager: TaskManager;
  private calendarManager: CalendarManager;
  private editingTask: ChronicleTask | null;
  private onSave?: () => void;
  private onExpand?: (task?: ChronicleTask) => void;

  constructor(
    app: App,
    taskManager: TaskManager,
    calendarManager: CalendarManager,
    editingTask?: ChronicleTask,
    onSave?: () => void,
    onExpand?: (task?: ChronicleTask) => void
  ) {
    super(app);
    this.taskManager    = taskManager;
    this.calendarManager = calendarManager;
    this.editingTask    = editingTask ?? null;
    this.onSave         = onSave;
    this.onExpand       = onExpand;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("chronicle-event-modal");

    const t         = this.editingTask;
    const calendars = this.calendarManager.getAll();

    // ── Header ──────────────────────────────────────────────────────────
    const header = contentEl.createDiv("cem-header");
    header.createDiv("cem-title").setText(t ? "Edit task" : "New task");

    const expandBtn = header.createEl("button", { cls: "cf-btn-ghost cem-expand-btn" });
    expandBtn.title = "Open as full page";
    expandBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
    expandBtn.addEventListener("click", () => {
      this.close();
      this.onExpand?.(t ?? undefined);
    });

    // ── Form ─────────────────────────────────────────────────────────────
    const form = contentEl.createDiv("cem-form");

    // Title
    const titleInput = this.field(form, "Title").createEl("input", {
      type: "text", cls: "cf-input cf-title-input", placeholder: "Task name"
    });
    titleInput.value = t?.title ?? "";
    titleInput.focus();

    // Status + Priority
    const row1 = form.createDiv("cf-row");

    const statusSelect = this.field(row1, "Status").createEl("select", { cls: "cf-select" });
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

    const prioritySelect = this.field(row1, "Priority").createEl("select", { cls: "cf-select" });
    const priorities: { value: TaskPriority; label: string }[] = [
      { value: "none",   label: "None" },
      { value: "low",    label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high",   label: "High" },
    ];
    for (const p of priorities) {
      const opt = prioritySelect.createEl("option", { value: p.value, text: p.label });
      if (t?.priority === p.value) opt.selected = true;
    }

    // Due date + time
    const row2 = form.createDiv("cf-row");

    const dueDateInput = this.field(row2, "Date").createEl("input", {
      type: "date", cls: "cf-input"
    });
    dueDateInput.value = t?.dueDate ?? "";

    const dueTimeInput = this.field(row2, "Time").createEl("input", {
      type: "time", cls: "cf-input"
    });
    dueTimeInput.value = t?.dueTime ?? "";

    // Calendar
    const calSelect = this.field(form, "Calendar").createEl("select", { cls: "cf-select" });
    calSelect.createEl("option", { value: "", text: "None" });
    for (const cal of calendars) {
      const opt = calSelect.createEl("option", { value: cal.id, text: cal.name });
      if (t?.calendarId === cal.id) opt.selected = true;
    }
    const updateCalColor = () => {
      const cal = this.calendarManager.getById(calSelect.value);
      calSelect.style.borderLeftColor = cal ? CalendarManager.colorToHex(cal.color) : "transparent";
      calSelect.style.borderLeftWidth = "4px";
      calSelect.style.borderLeftStyle = "solid";
    };
    calSelect.addEventListener("change", updateCalColor);
    updateCalColor();

    // Recurrence
    const recSelect = this.field(form, "Repeat").createEl("select", { cls: "cf-select" });
    const recurrences = [
      { value: "",                                    label: "Never" },
      { value: "FREQ=DAILY",                          label: "Every day" },
      { value: "FREQ=WEEKLY",                         label: "Every week" },
      { value: "FREQ=MONTHLY",                        label: "Every month" },
      { value: "FREQ=YEARLY",                         label: "Every year" },
      { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",   label: "Weekdays" },
    ];
    for (const r of recurrences) {
      const opt = recSelect.createEl("option", { value: r.value, text: r.label });
      if (t?.recurrence === r.value) opt.selected = true;
    }

    // Alert
    const alertSelect = this.field(form, "Alert").createEl("select", { cls: "cf-select" });
    const taskAlerts: { value: AlertOffset; label: string }[] = [
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
    for (const a of taskAlerts) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if (t?.alert === a.value) opt.selected = true;
    }

    if (!t) {
      const noneOpt = alertSelect.querySelector('option[value="none"]') as HTMLOptionElement;
      if (noneOpt) noneOpt.selected = true;
    }
    
    // Notes
    const notesInput = this.field(form, "Notes").createEl("textarea", {
      cls: "cf-textarea", placeholder: "Add notes..."
    });
    notesInput.value = t?.notes ?? "";

    // ── Footer ────────────────────────────────────────────────────────────
    const footer = contentEl.createDiv("cem-footer");
    const cancelBtn = footer.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });

    if (t && t.id) {
      const deleteBtn = footer.createEl("button", { cls: "cf-btn-delete", text: "Delete task" });
      deleteBtn.addEventListener("click", async () => {
        await this.taskManager.delete(t.id);
        this.onSave?.();
        this.close();
      });
    }

    const saveBtn = footer.createEl("button", {
      cls: "cf-btn-primary", text: t?.id ? "Save" : "Add task"
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

      // Duplicate check (new tasks only)
      if (!t?.id) {
        const existing = await this.taskManager.getAll();
        const duplicate = existing.find(e => e.title.toLowerCase() === title.toLowerCase());
        if (duplicate) {
          new Notice(`A task named "${title}" already exists.`, 4000);
          titleInput.classList.add("cf-error");
          titleInput.focus();
          return;
        }
      }

      const taskData = {
        title,
        status:      statusSelect.value as TaskStatus,
        priority:    prioritySelect.value as TaskPriority,
        dueDate:     dueDateInput.value || undefined,
        dueTime:     dueTimeInput.value || undefined,
        calendarId:  calSelect.value || undefined,
        recurrence:  recSelect.value || undefined,
        notes:       notesInput.value || undefined,
        alert:       alertSelect.value as AlertOffset,
        tags:              t?.tags ?? [],
        contexts:          t?.contexts ?? [],
        linkedNotes:       t?.linkedNotes ?? [],
        projects:          t?.projects ?? [],
        timeEstimate:      t?.timeEstimate,
        timeEntries:       t?.timeEntries ?? [],
        customFields:      t?.customFields ?? [],
        completedInstances: t?.completedInstances ?? [],
      };

      if (t?.id) {
        await this.taskManager.update({ ...t, ...taskData });
      } else {
        await this.taskManager.create(taskData);
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

  onClose() { this.contentEl.empty(); }

  private field(parent: HTMLElement, label: string): HTMLElement {
    const wrap = parent.createDiv("cf-field");
    wrap.createDiv("cf-label").setText(label);
    return wrap;
  }
}