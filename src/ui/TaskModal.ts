import { App, Modal, Notice } from "obsidian";
import { ChronicleTask, TaskStatus, TaskPriority, AlertOffset } from "../types";
import { TaskManager } from "../data/TaskManager";
import { ListManager } from "../data/ListManager";

export class TaskModal extends Modal {
  private taskManager: TaskManager;
  private listManager: ListManager;
  private editingTask: ChronicleTask | null;
  private onSave?: () => void;
  private onExpand?: (task?: ChronicleTask) => void;
  private plugin: any;

  constructor(
    app: App,
    taskManager: TaskManager,
    listManager: ListManager,
    editingTask?: ChronicleTask,
    onSave?: () => void,
    onExpand?: (task?: ChronicleTask) => void,
    plugin?: any
  ) {
    super(app);
    this.taskManager = taskManager;
    this.listManager = listManager;
    this.editingTask = editingTask ?? null;
    this.onSave      = onSave;
    this.onExpand    = onExpand;
    this.plugin      = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("chronicle-event-modal");

    const t     = this.editingTask;
    const lists = this.listManager.getAll();

    // ── Header ──────────────────────────────────────────────────────────
    const header = contentEl.createDiv("cem-header");
    header.createDiv("cem-title").setText(t ? "Edit task" : "New task");

    const expandBtn = header.createEl("button", { cls: "cf-btn-ghost cem-expand-btn" });
    expandBtn.title = "Open as full page";
    expandBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
    expandBtn.addEventListener("click", () => { this.close(); this.onExpand?.(t ?? undefined); });

    // ── Form ─────────────────────────────────────────────────────────────
    const form = contentEl.createDiv("cem-form");

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
    const defaultStatus = this.plugin?.settings?.defaultTaskStatus ?? "todo";
    for (const s of statuses) {
      const opt = statusSelect.createEl("option", { value: s.value, text: s.label });
      if (t ? t.status === s.value : s.value === defaultStatus) opt.selected = true;
    }

    const prioritySelect = this.field(row1, "Priority").createEl("select", { cls: "cf-select" });
    const priorities: { value: TaskPriority; label: string }[] = [
      { value: "none",   label: "None" },
      { value: "low",    label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high",   label: "High" },
    ];
    const defaultPriority = this.plugin?.settings?.defaultTaskPriority ?? "none";
    for (const p of priorities) {
      const opt = prioritySelect.createEl("option", { value: p.value, text: p.label });
      if (t ? t.priority === p.value : p.value === defaultPriority) opt.selected = true;
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
    const defaultAlert = this.plugin?.settings?.defaultAlert ?? "none";
    for (const a of taskAlerts) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if (t ? t.alert === a.value : a.value === defaultAlert) opt.selected = true;
    }

    // List
    const listSelect = this.field(form, "List").createEl("select", { cls: "cf-select" });
    const defaultListId = this.plugin?.settings?.defaultListId ?? "";
    listSelect.createEl("option", { value: "", text: "None" });
    for (const list of lists) {
      const opt = listSelect.createEl("option", { value: list.id, text: list.name });
      if (t ? t.listId === list.id : list.id === defaultListId) opt.selected = true;
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
      type: "text", cls: "cf-input", placeholder: "work, personal  (comma separated)"
    });
    tagsInput.value = t?.tags?.join(", ") ?? "";

    // ── Footer ────────────────────────────────────────────────────────────
    const footer    = contentEl.createDiv("cem-footer");
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
      if (!title) { titleInput.focus(); titleInput.classList.add("cf-error"); return; }

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
        status:             statusSelect.value as TaskStatus,
        priority:           prioritySelect.value as TaskPriority,
        dueDate:            dueDateInput.value || undefined,
        dueTime:            dueTimeInput.value || undefined,
        listId:             listSelect.value || undefined,
        recurrence:         recSelect.value || undefined,
        alert:              alertSelect.value as AlertOffset,
        location:           locationInput.value || undefined,
        tags:               tagsInput.value ? tagsInput.value.split(",").map(s => s.trim()).filter(Boolean) : (t?.tags ?? []),
        notes:              t?.notes,
        linkedNotes:        t?.linkedNotes ?? [],
        projects:           t?.projects ?? [],
        timeEstimate:       t?.timeEstimate,
        timeEntries:        t?.timeEntries ?? [],
        customFields:       t?.customFields ?? [],
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
