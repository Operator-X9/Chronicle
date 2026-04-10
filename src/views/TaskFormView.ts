import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import { ChronicleTask, TaskStatus, TaskPriority, AlertOffset } from "../types";
import { TaskManager } from "../data/TaskManager";
import { ListManager } from "../data/ListManager";

export const TASK_FORM_VIEW_TYPE = "chronicle-task-form";

export class TaskFormView extends ItemView {
  private taskManager: TaskManager;
  private listManager: ListManager;
  private editingTask: ChronicleTask | null = null;
  onSave?: () => void;

  constructor(
    leaf: WorkspaceLeaf,
    taskManager: TaskManager,
    listManager: ListManager,
    editingTask?: ChronicleTask,
    onSave?: () => void
  ) {
    super(leaf);
    this.taskManager = taskManager;
    this.listManager = listManager;
    this.editingTask = editingTask ?? null;
    this.onSave      = onSave;
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

    const t     = this.editingTask;
    const lists = this.listManager.getAll();

    // ── Header ───────────────────────────────────────────────────────────
    const header = container.createDiv("cf-header");
    const cancelBtn = header.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });
    header.createDiv("cf-header-title").setText(t ? "Edit task" : "New task");
    const saveBtn = header.createEl("button", { cls: "cf-btn-primary", text: t ? "Save" : "Add" });

    // ── Form ─────────────────────────────────────────────────────────────
    const form = container.createDiv("cf-form");

    // Title
    const titleInput = this.field(form, "Title").createEl("input", {
      type: "text", cls: "cf-input cf-title-input", placeholder: "Task name"
    });
    titleInput.value = t?.title ?? "";
    titleInput.focus();

    // Location
    const locationInput = this.field(form, "Location").createEl("input", {
      type: "text", cls: "cf-input", placeholder: "Add location"
    });
    locationInput.value = t?.location ?? "";

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
    const dueDateInput = this.field(row2, "Date").createEl("input", { type: "date", cls: "cf-input" });
    dueDateInput.value = t?.dueDate ?? "";
    const dueTimeInput = this.field(row2, "Time").createEl("input", { type: "time", cls: "cf-input" });
    dueTimeInput.value = t?.dueTime ?? "";

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
      if (t?.recurrence === r.value) opt.selected = true;
    }

    // Alert
    const alertSelect = this.field(form, "Alert").createEl("select", { cls: "cf-select" });
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

    // List
    const listSelect = this.field(form, "List").createEl("select", { cls: "cf-select" });
    listSelect.createEl("option", { value: "", text: "None" });
    for (const list of lists) {
      const opt = listSelect.createEl("option", { value: list.id, text: list.name });
      if (t?.listId === list.id) opt.selected = true;
    }
    const updateListColor = () => {
      const list = this.listManager.getById(listSelect.value);
      listSelect.style.borderLeftColor = list ? list.color : "transparent";
      listSelect.style.borderLeftWidth = "4px";
      listSelect.style.borderLeftStyle = "solid";
    };
    listSelect.addEventListener("change", updateListColor);
    updateListColor();

    // Tags
    const tagsInput = this.field(form, "Tags").createEl("input", {
      type: "text", cls: "cf-input",
      placeholder: "work, personal  (comma separated)"
    });
    tagsInput.value = t?.tags.join(", ") ?? "";

    // Linked notes
    const linkedInput = this.field(form, "Linked notes").createEl("input", {
      type: "text", cls: "cf-input",
      placeholder: "Projects/Website, Journal/2024  (comma separated)"
    });
    linkedInput.value = t?.linkedNotes.join(", ") ?? "";

    // Notes
    const notesInput = this.field(form, "Notes").createEl("textarea", {
      cls: "cf-textarea", placeholder: "Add notes..."
    });
    notesInput.value = t?.notes ?? "";

    // ── Actions ──────────────────────────────────────────────────────────
    cancelBtn.addEventListener("click", () => {
      this.app.workspace.detachLeavesOfType(TASK_FORM_VIEW_TYPE);
    });

    const handleSave = async () => {
      const title = titleInput.value.trim();
      if (!title) { titleInput.focus(); titleInput.classList.add("cf-error"); return; }

      if (!this.editingTask) {
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
        location:           locationInput.value || undefined,
        status:             statusSelect.value as TaskStatus,
        priority:           prioritySelect.value as TaskPriority,
        dueDate:            dueDateInput.value || undefined,
        dueTime:            dueTimeInput.value || undefined,
        listId:             listSelect.value || undefined,
        recurrence:         recSelect.value || undefined,
        alert:              alertSelect.value as AlertOffset,
        tags:               tagsInput.value ? tagsInput.value.split(",").map(s => s.trim()).filter(Boolean) : [],
        linkedNotes:        linkedInput.value ? linkedInput.value.split(",").map(s => s.trim()).filter(Boolean) : [],
        projects:           t?.projects ?? [],
        timeEntries:        t?.timeEntries ?? [],
        completedInstances: t?.completedInstances ?? [],
        customFields:       t?.customFields ?? [],
        notes:              notesInput.value || undefined,
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
