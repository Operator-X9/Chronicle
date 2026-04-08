import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import { TaskManager } from "../data/TaskManager";
import { CalendarManager } from "../data/CalendarManager";
import { ChronicleTask, TaskStatus, TaskPriority } from "../types";

export const TASK_FORM_VIEW_TYPE = "chronicle-task-form";

export class TaskFormView extends ItemView {
  private taskManager: TaskManager;
  private calendarManager: CalendarManager;
  private editingTask: ChronicleTask | null = null;
  private onSave?: () => void;

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

    const dueDateField = this.field(row2, "Due date");
    const dueDateInput = dueDateField.createEl("input", {
      type: "date", cls: "cf-input"
    });
    dueDateInput.value = t?.dueDate ?? "";

    const dueTimeField = this.field(row2, "Due time");
    const dueTimeInput = dueTimeField.createEl("input", {
      type: "time", cls: "cf-input"
    });
    dueTimeInput.value = t?.dueTime ?? "";

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

    // Time estimate
    const estimateField = this.field(form, "Time estimate");
    const estimateWrap = estimateField.createDiv("cf-row");
    const estimateInput = estimateWrap.createEl("input", {
      type: "number", cls: "cf-input cf-input-sm", placeholder: "0"
    });
    estimateInput.value = t?.timeEstimate ? String(t.timeEstimate) : "";
    estimateInput.min = "0";
    estimateWrap.createSpan({ cls: "cf-unit", text: "minutes" });

    // Tags
    const tagsField = this.field(form, "Tags");
    const tagsInput = tagsField.createEl("input", {
      type: "text", cls: "cf-input",
      placeholder: "work, personal, urgent  (comma separated)"
    });
    tagsInput.value = t?.tags.join(", ") ?? "";

    // Contexts
    const contextsField = this.field(form, "Contexts");
    const contextsInput = contextsField.createEl("input", {
      type: "text", cls: "cf-input",
      placeholder: "@home, @work  (comma separated)"
    });
    contextsInput.value = t?.contexts.join(", ") ?? "";

    // Linked notes
    const linkedField = this.field(form, "Linked notes");
    const linkedInput = linkedField.createEl("input", {
      type: "text", cls: "cf-input",
      placeholder: "Projects/Website, Journal/2024  (comma separated)"
    });
    linkedInput.value = t?.linkedNotes.join(", ") ?? "";

    // Custom fields
    const customSection = form.createDiv("cf-section");
    customSection.createDiv("cf-section-label").setText("Custom fields");
    const customList = customSection.createDiv("cf-custom-list");
    const customFields: { key: string; value: string }[] = [
      ...(t?.customFields.map(f => ({ key: f.key, value: String(f.value) })) ?? [])
    ];

    const renderCustomFields = () => {
      customList.empty();
      for (let i = 0; i < customFields.length; i++) {
        const cf = customFields[i];
        const cfRow = customList.createDiv("cf-custom-row");
        const keyInput = cfRow.createEl("input", {
          type: "text", cls: "cf-input cf-custom-key", placeholder: "Field name"
        });
        keyInput.value = cf.key;
        keyInput.addEventListener("input", () => { customFields[i].key = keyInput.value; });

        const valInput = cfRow.createEl("input", {
          type: "text", cls: "cf-input cf-custom-val", placeholder: "Value"
        });
        valInput.value = cf.value;
        valInput.addEventListener("input", () => { customFields[i].value = valInput.value; });

        const removeBtn = cfRow.createEl("button", { cls: "cf-btn-icon", text: "×" });
        removeBtn.addEventListener("click", () => {
          customFields.splice(i, 1);
          renderCustomFields();
        });
      }

      const addCfBtn = customList.createEl("button", {
        cls: "cf-btn-ghost cf-add-field", text: "+ Add field"
      });
      addCfBtn.addEventListener("click", () => {
        customFields.push({ key: "", value: "" });
        renderCustomFields();
      });
    };
    renderCustomFields();

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
        status:        statusSelect.value as TaskStatus,
        priority:      prioritySelect.value as TaskPriority,
        dueDate:       dueDateInput.value || undefined,
        dueTime:       dueTimeInput.value || undefined,
        calendarId:    calSelect.value || undefined,
        recurrence:    recSelect.value || undefined,
        timeEstimate:  estimateInput.value ? parseInt(estimateInput.value) : undefined,
        tags:          tagsInput.value ? tagsInput.value.split(",").map(s => s.trim()).filter(Boolean) : [],
        contexts:      contextsInput.value ? contextsInput.value.split(",").map(s => s.trim()).filter(Boolean) : [],
        linkedNotes:   linkedInput.value ? linkedInput.value.split(",").map(s => s.trim()).filter(Boolean) : [],
        projects:      t?.projects ?? [],
        timeEntries:   t?.timeEntries ?? [],
        completedInstances: t?.completedInstances ?? [],
        customFields:  customFields.filter(f => f.key).map(f => ({ key: f.key, value: f.value })),
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