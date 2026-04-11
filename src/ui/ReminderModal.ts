import { App, Modal, Notice } from "obsidian";
import { ChronicleReminder, ReminderStatus, ReminderPriority, AlertOffset } from "../types";
import { ReminderManager } from "../data/ReminderManager";
import { ListManager } from "../data/ListManager";
import { buildTagField } from "./tagField";

export class ReminderModal extends Modal {
  private reminderManager: ReminderManager;
  private listManager: ListManager;
  private editingReminder: ChronicleReminder | null;
  private onSave?: () => void;
  private onExpand?: (reminder?: ChronicleReminder) => void;
  private plugin: any;

  constructor(
    app: App,
    reminderManager: ReminderManager,
    listManager: ListManager,
    editingReminder?: ChronicleReminder,
    onSave?: () => void,
    onExpand?: (reminder?: ChronicleReminder) => void,
    plugin?: any
  ) {
    super(app);
    this.reminderManager = reminderManager;
    this.listManager     = listManager;
    this.editingReminder = editingReminder ?? null;
    this.onSave          = onSave;
    this.onExpand        = onExpand;
    this.plugin          = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("chronicle-event-modal");

    const r     = this.editingReminder;
    const lists = this.listManager.getAll();

    // ── Header ──────────────────────────────────────────────────────────
    const header = contentEl.createDiv("cem-header");
    header.createDiv("cem-title").setText(r ? "Edit reminder" : "New reminder");

    const expandBtn = header.createEl("button", { cls: "cf-btn-ghost cem-expand-btn" });
    expandBtn.title = "Open as full page";
    expandBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
    expandBtn.addEventListener("click", () => { this.close(); this.onExpand?.(r ?? undefined); });

    // ── Form ─────────────────────────────────────────────────────────────
    const form = contentEl.createDiv("cem-form");

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
    const defaultStatus = this.plugin?.settings?.defaultReminderStatus ?? "todo";
    for (const s of statuses) {
      const opt = statusSelect.createEl("option", { value: s.value, text: s.label });
      if (r ? r.status === s.value : s.value === defaultStatus) opt.selected = true;
    }

    const prioritySelect = this.field(row1, "Priority").createEl("select", { cls: "cf-select" });
    const priorities: { value: ReminderPriority; label: string }[] = [
      { value: "none",   label: "None" },
      { value: "low",    label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high",   label: "High" },
    ];
    const defaultPriority = this.plugin?.settings?.defaultReminderPriority ?? "none";
    for (const p of priorities) {
      const opt = prioritySelect.createEl("option", { value: p.value, text: p.label });
      if (r ? r.priority === p.value : p.value === defaultPriority) opt.selected = true;
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
    const reminderAlerts: { value: AlertOffset; label: string }[] = [
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
    const defaultAlert = this.plugin?.settings?.defaultAlert ?? "none";
    for (const a of reminderAlerts) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if (r ? r.alert === a.value : a.value === defaultAlert) opt.selected = true;
    }

    // List
    const listSelect = this.field(form, "List").createEl("select", { cls: "cf-select" });
    const defaultListId = this.plugin?.settings?.defaultListId ?? "";
    listSelect.createEl("option", { value: "", text: "None" });
    for (const list of lists) {
      const opt = listSelect.createEl("option", { value: list.id, text: list.name });
      if (r ? r.listId === list.id : list.id === defaultListId) opt.selected = true;
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

    // ── Footer ────────────────────────────────────────────────────────────
    const footer    = contentEl.createDiv("cem-footer");
    const cancelBtn = footer.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });

    if (r && r.id) {
      const deleteBtn = footer.createEl("button", { cls: "cf-btn-delete", text: "Delete reminder" });
      deleteBtn.addEventListener("click", async () => {
        await this.reminderManager.delete(r.id);
        this.onSave?.();
        this.close();
      });
    }

    const saveBtn = footer.createEl("button", {
      cls: "cf-btn-primary", text: r?.id ? "Save" : "Add reminder"
    });

    // ── Handlers ──────────────────────────────────────────────────────────
    cancelBtn.addEventListener("click", () => this.close());

    const handleSave = async () => {
      const title = titleInput.value.trim();
      if (!title) { titleInput.focus(); titleInput.classList.add("cf-error"); return; }

      if (!r?.id) {
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
        status:             statusSelect.value as ReminderStatus,
        priority:           prioritySelect.value as ReminderPriority,
        dueDate:            dueDateInput.value || undefined,
        dueTime:            dueTimeInput.value || undefined,
        listId:             listSelect.value || undefined,
        recurrence:         recSelect.value || undefined,
        alert:              alertSelect.value as AlertOffset,
        location:           locationInput.value || undefined,
        tags:               tagField.getTags(),
        notes:              r?.notes,
        linkedNotes:        r?.linkedNotes ?? [],
        projects:           r?.projects ?? [],
        timeEstimate:       r?.timeEstimate,
        timeEntries:        r?.timeEntries ?? [],
        customFields:       r?.customFields ?? [],
        completedInstances: r?.completedInstances ?? [],
      };

      if (r?.id) {
        await this.reminderManager.update({ ...r, ...reminderData });
      } else {
        await this.reminderManager.create(reminderData);
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
