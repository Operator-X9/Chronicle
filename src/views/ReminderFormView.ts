import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import { ChronicleReminder, ReminderStatus, ReminderPriority, AlertOffset } from "../types";
import { ReminderManager } from "../data/ReminderManager";
import { ListManager } from "../data/ListManager";
import { buildTagField } from "../ui/tagField";

export const REMINDER_FORM_VIEW_TYPE = "chronicle-reminder-form";

export class ReminderFormView extends ItemView {
  private reminderManager: ReminderManager;
  private listManager: ListManager;
  private editingReminder: ChronicleReminder | null = null;
  onSave?: () => void;

  constructor(
    leaf: WorkspaceLeaf,
    reminderManager: ReminderManager,
    listManager: ListManager,
    editingReminder?: ChronicleReminder,
    onSave?: () => void
  ) {
    super(leaf);
    this.reminderManager = reminderManager;
    this.listManager     = listManager;
    this.editingReminder = editingReminder ?? null;
    this.onSave          = onSave;
  }

  getViewType(): string { return REMINDER_FORM_VIEW_TYPE; }
  getDisplayText(): string { return this.editingReminder ? "Edit reminder" : "New reminder"; }
  getIcon(): string { return "check-circle"; }

  async onOpen() { this.render(); }

  loadReminder(reminder: ChronicleReminder) {
    this.editingReminder = reminder;
    this.render();
  }

  render() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("chronicle-form-page");

    const r     = this.editingReminder;
    const lists = this.listManager.getAll();

    // ── Header ───────────────────────────────────────────────────────────
    const header = container.createDiv("cf-header");
    const cancelBtn = header.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });
    header.createDiv("cf-header-title").setText(r ? "Edit reminder" : "New reminder");
    const saveBtn = header.createEl("button", { cls: "cf-btn-primary", text: r ? "Save" : "Add" });

    // ── Form ─────────────────────────────────────────────────────────────
    const form = container.createDiv("cf-form");

    // Title
    const titleInput = this.field(form, "Title").createEl("input", {
      type: "text", cls: "cf-input cf-title-input", placeholder: "Reminder name"
    });
    titleInput.value = r?.title ?? "";
    titleInput.focus();

    // Location
    const locationInput = this.field(form, "Location").createEl("input", {
      type: "text", cls: "cf-input", placeholder: "Add location"
    });
    locationInput.value = r?.location ?? "";

    // Status + Priority
    const row1 = form.createDiv("cf-row");

    const statusSelect = this.field(row1, "Status").createEl("select", { cls: "cf-select" });
    const statuses: { value: ReminderStatus; label: string }[] = [
      { value: "todo",        label: "To do" },
      { value: "in-progress", label: "In progress" },
      { value: "done",        label: "Done" },
      { value: "cancelled",   label: "Cancelled" },
    ];
    for (const s of statuses) {
      const opt = statusSelect.createEl("option", { value: s.value, text: s.label });
      if (r?.status === s.value) opt.selected = true;
    }

    const prioritySelect = this.field(row1, "Priority").createEl("select", { cls: "cf-select" });
    const priorities: { value: ReminderPriority; label: string }[] = [
      { value: "none",   label: "None" },
      { value: "low",    label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high",   label: "High" },
    ];
    for (const p of priorities) {
      const opt = prioritySelect.createEl("option", { value: p.value, text: p.label });
      if (r?.priority === p.value) opt.selected = true;
    }

    // Due date + time
    const row2 = form.createDiv("cf-row");
    const dueDateInput = this.field(row2, "Date").createEl("input", { type: "date", cls: "cf-input" });
    dueDateInput.value = r?.dueDate ?? "";
    const dueTimeInput = this.field(row2, "Time").createEl("input", { type: "time", cls: "cf-input" });
    dueTimeInput.value = r?.dueTime ?? "";

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
    for (const rec of recurrences) {
      const opt = recSelect.createEl("option", { value: rec.value, text: rec.label });
      if (r?.recurrence === rec.value) opt.selected = true;
    }

    // Alert
    const alertSelect = this.field(form, "Alert").createEl("select", { cls: "cf-select" });
    const formAlerts: { value: AlertOffset; label: string }[] = [
      { value: "none",    label: "None" },
      { value: "at-time", label: "At time of reminder" },
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
      if (r?.alert === a.value) opt.selected = true;
    }

    // List
    const listSelect = this.field(form, "List").createEl("select", { cls: "cf-select" });
    listSelect.createEl("option", { value: "", text: "None" });
    for (const list of lists) {
      const opt = listSelect.createEl("option", { value: list.id, text: list.name });
      if (r?.listId === list.id) opt.selected = true;
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
    const tagField = buildTagField(this.app, this.field(form, "Tags"), r?.tags ?? []);

    // Linked notes
    const linkedInput = this.field(form, "Linked notes").createEl("input", {
      type: "text", cls: "cf-input",
      placeholder: "Projects/Website, Journal/2024  (comma separated)"
    });
    linkedInput.value = r?.linkedNotes.join(", ") ?? "";

    // Notes
    const notesInput = this.field(form, "Notes").createEl("textarea", {
      cls: "cf-textarea", placeholder: "Add notes..."
    });
    notesInput.value = r?.notes ?? "";

    // ── Actions ──────────────────────────────────────────────────────────
    cancelBtn.addEventListener("click", () => {
      this.app.workspace.detachLeavesOfType(REMINDER_FORM_VIEW_TYPE);
    });

    const handleSave = async () => {
      const title = titleInput.value.trim();
      if (!title) { titleInput.focus(); titleInput.classList.add("cf-error"); return; }

      if (!this.editingReminder) {
        const existing = await this.reminderManager.getAll();
        const duplicate = existing.find(e => e.title.toLowerCase() === title.toLowerCase());
        if (duplicate) {
          new Notice(`A reminder named "${title}" already exists.`, 4000);
          titleInput.classList.add("cf-error");
          titleInput.focus();
          return;
        }
      }

      const reminderData = {
        title,
        location:           locationInput.value || undefined,
        status:             statusSelect.value as ReminderStatus,
        priority:           prioritySelect.value as ReminderPriority,
        dueDate:            dueDateInput.value || undefined,
        dueTime:            dueTimeInput.value || undefined,
        listId:             listSelect.value || undefined,
        recurrence:         recSelect.value || undefined,
        alert:              alertSelect.value as AlertOffset,
        tags:               tagField.getTags(),
        linkedNotes:        linkedInput.value ? linkedInput.value.split(",").map(s => s.trim()).filter(Boolean) : [],
        projects:           r?.projects ?? [],
        timeEntries:        r?.timeEntries ?? [],
        completedInstances: r?.completedInstances ?? [],
        customFields:       r?.customFields ?? [],
        notes:              notesInput.value || undefined,
      };

      if (r) {
        await this.reminderManager.update({ ...r, ...reminderData });
      } else {
        await this.reminderManager.create(reminderData);
      }

      this.onSave?.();
      this.app.workspace.detachLeavesOfType(REMINDER_FORM_VIEW_TYPE);
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
