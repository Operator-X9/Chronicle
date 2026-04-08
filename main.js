/* Chronicle - Obsidian Plugin */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ChroniclePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian6 = require("obsidian");

// src/types/index.ts
var DEFAULT_SETTINGS = {
  tasksFolder: "Chronicle/Tasks",
  eventsFolder: "Chronicle/Events",
  calendars: [
    { id: "personal", name: "Personal", color: "blue", isVisible: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "work", name: "Work", color: "green", isVisible: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() }
  ],
  defaultCalendarId: "personal",
  defaultTaskStatus: "todo",
  defaultTaskPriority: "none",
  defaultAlert: "none",
  startOfWeek: 0,
  timeFormat: "12h",
  defaultCalendarView: "week",
  showTodayCount: true,
  showScheduledCount: true,
  showFlaggedCount: true
};

// src/data/CalendarManager.ts
var CalendarManager = class {
  constructor(calendars, onUpdate) {
    this.calendars = calendars;
    this.onUpdate = onUpdate;
  }
  getAll() {
    return [...this.calendars];
  }
  getById(id) {
    return this.calendars.find((c) => c.id === id);
  }
  create(name, color) {
    const calendar = {
      id: this.generateId(name),
      name,
      color,
      isVisible: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.calendars.push(calendar);
    this.onUpdate();
    return calendar;
  }
  update(id, changes) {
    const idx = this.calendars.findIndex((c) => c.id === id);
    if (idx === -1) return;
    this.calendars[idx] = { ...this.calendars[idx], ...changes };
    this.onUpdate();
  }
  delete(id) {
    this.calendars = this.calendars.filter((c) => c.id !== id);
    this.onUpdate();
  }
  toggleVisibility(id) {
    const cal = this.calendars.find((c) => c.id === id);
    if (cal) {
      cal.isVisible = !cal.isVisible;
      this.onUpdate();
    }
  }
  // Returns CSS hex color for a CalendarColor name
  static colorToHex(color) {
    const map = {
      blue: "#378ADD",
      green: "#34C759",
      purple: "#AF52DE",
      orange: "#FF9500",
      red: "#FF3B30",
      teal: "#30B0C7",
      pink: "#FF2D55",
      yellow: "#FFD60A",
      gray: "#8E8E93"
    };
    return map[color];
  }
  generateId(name) {
    const base = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
  }
};

// src/data/TaskManager.ts
var import_obsidian = require("obsidian");
var TaskManager = class {
  constructor(app, tasksFolder) {
    this.app = app;
    this.tasksFolder = tasksFolder;
  }
  // ── Read ────────────────────────────────────────────────────────────────────
  async getAll() {
    const folder = this.app.vault.getFolderByPath(this.tasksFolder);
    if (!folder) return [];
    const tasks = [];
    for (const child of folder.children) {
      if (child instanceof import_obsidian.TFile && child.extension === "md") {
        const task = await this.fileToTask(child);
        if (task) tasks.push(task);
      }
    }
    return tasks;
  }
  async getById(id) {
    var _a;
    const all = await this.getAll();
    return (_a = all.find((t) => t.id === id)) != null ? _a : null;
  }
  // ── Write ───────────────────────────────────────────────────────────────────
  async create(task) {
    await this.ensureFolder();
    const full = {
      ...task,
      id: this.generateId(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const path = (0, import_obsidian.normalizePath)(`${this.tasksFolder}/${full.title}.md`);
    await this.app.vault.create(path, this.taskToMarkdown(full));
    return full;
  }
  async update(task) {
    var _a;
    const file = this.findFileForTask(task.id);
    if (!file) return;
    const expectedPath = (0, import_obsidian.normalizePath)(`${this.tasksFolder}/${task.title}.md`);
    if (file.path !== expectedPath) {
      await this.app.fileManager.renameFile(file, expectedPath);
    }
    const updatedFile = (_a = this.app.vault.getFileByPath(expectedPath)) != null ? _a : file;
    await this.app.vault.modify(updatedFile, this.taskToMarkdown(task));
  }
  async delete(id) {
    const file = this.findFileForTask(id);
    if (file) await this.app.vault.delete(file);
  }
  async markComplete(id) {
    const task = await this.getById(id);
    if (!task) return;
    await this.update({
      ...task,
      status: "done",
      completedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  // ── Filters (used by smart lists) ───────────────────────────────────────────
  async getDueToday() {
    const today = this.todayStr();
    const all = await this.getAll();
    return all.filter(
      (t) => t.status !== "done" && t.status !== "cancelled" && t.dueDate === today
    );
  }
  async getOverdue() {
    const today = this.todayStr();
    const all = await this.getAll();
    return all.filter(
      (t) => t.status !== "done" && t.status !== "cancelled" && !!t.dueDate && t.dueDate < today
    );
  }
  async getScheduled() {
    const all = await this.getAll();
    return all.filter(
      (t) => t.status !== "done" && t.status !== "cancelled" && !!t.dueDate
    );
  }
  async getFlagged() {
    const all = await this.getAll();
    return all.filter((t) => t.priority === "high" && t.status !== "done");
  }
  // ── Serialisation ───────────────────────────────────────────────────────────
  taskToMarkdown(task) {
    var _a, _b, _c, _d, _e, _f;
    const fm = {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      tags: task.tags,
      contexts: task.contexts,
      projects: task.projects,
      "linked-notes": task.linkedNotes,
      "calendar-id": (_a = task.calendarId) != null ? _a : null,
      "due-date": (_b = task.dueDate) != null ? _b : null,
      "due-time": (_c = task.dueTime) != null ? _c : null,
      recurrence: (_d = task.recurrence) != null ? _d : null,
      "time-estimate": (_e = task.timeEstimate) != null ? _e : null,
      "time-entries": task.timeEntries,
      "custom-fields": task.customFields,
      "completed-instances": task.completedInstances,
      "created-at": task.createdAt,
      "completed-at": (_f = task.completedAt) != null ? _f : null
    };
    const yaml = Object.entries(fm).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n");
    const body = task.notes ? `
${task.notes}` : "";
    return `---
${yaml}
---
${body}`;
  }
  async fileToTask(file) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
    try {
      const cache = this.app.metadataCache.getFileCache(file);
      const fm = cache == null ? void 0 : cache.frontmatter;
      if (!(fm == null ? void 0 : fm.id) || !(fm == null ? void 0 : fm.title)) return null;
      const content = await this.app.vault.read(file);
      const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
      const notes = ((_a = bodyMatch == null ? void 0 : bodyMatch[1]) == null ? void 0 : _a.trim()) || void 0;
      return {
        id: fm.id,
        title: fm.title,
        status: (_b = fm.status) != null ? _b : "todo",
        priority: (_c = fm.priority) != null ? _c : "none",
        dueDate: (_d = fm["due-date"]) != null ? _d : void 0,
        dueTime: (_e = fm["due-time"]) != null ? _e : void 0,
        recurrence: (_f = fm.recurrence) != null ? _f : void 0,
        calendarId: (_g = fm["calendar-id"]) != null ? _g : void 0,
        tags: (_h = fm.tags) != null ? _h : [],
        contexts: (_i = fm.contexts) != null ? _i : [],
        linkedNotes: (_j = fm["linked-notes"]) != null ? _j : [],
        projects: (_k = fm.projects) != null ? _k : [],
        timeEstimate: (_l = fm["time-estimate"]) != null ? _l : void 0,
        timeEntries: (_m = fm["time-entries"]) != null ? _m : [],
        customFields: (_n = fm["custom-fields"]) != null ? _n : [],
        completedInstances: (_o = fm["completed-instances"]) != null ? _o : [],
        createdAt: (_p = fm["created-at"]) != null ? _p : (/* @__PURE__ */ new Date()).toISOString(),
        completedAt: (_q = fm["completed-at"]) != null ? _q : void 0,
        notes
      };
    } catch (e) {
      return null;
    }
  }
  // ── Helpers ─────────────────────────────────────────────────────────────────
  findFileForTask(id) {
    var _a;
    const folder = this.app.vault.getFolderByPath(this.tasksFolder);
    if (!folder) return null;
    for (const child of folder.children) {
      if (!(child instanceof import_obsidian.TFile)) continue;
      const cache = this.app.metadataCache.getFileCache(child);
      if (((_a = cache == null ? void 0 : cache.frontmatter) == null ? void 0 : _a.id) === id) return child;
    }
    return null;
  }
  async ensureFolder() {
    if (!this.app.vault.getFolderByPath(this.tasksFolder)) {
      await this.app.vault.createFolder(this.tasksFolder);
    }
  }
  generateId() {
    return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }
  todayStr() {
    return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  }
};

// src/data/EventManager.ts
var import_obsidian2 = require("obsidian");
var EventManager = class {
  constructor(app, eventsFolder) {
    this.app = app;
    this.eventsFolder = eventsFolder;
  }
  async getAll() {
    const folder = this.app.vault.getFolderByPath(this.eventsFolder);
    if (!folder) return [];
    const events = [];
    for (const child of folder.children) {
      if (child instanceof import_obsidian2.TFile && child.extension === "md") {
        const event = await this.fileToEvent(child);
        if (event) events.push(event);
      }
    }
    return events;
  }
  async create(event) {
    await this.ensureFolder();
    const full = {
      ...event,
      id: this.generateId(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const path = (0, import_obsidian2.normalizePath)(`${this.eventsFolder}/${full.title}.md`);
    await this.app.vault.create(path, this.eventToMarkdown(full));
    return full;
  }
  async update(event) {
    var _a;
    const file = this.findFileForEvent(event.id);
    if (!file) return;
    const expectedPath = (0, import_obsidian2.normalizePath)(`${this.eventsFolder}/${event.title}.md`);
    if (file.path !== expectedPath) {
      await this.app.fileManager.renameFile(file, expectedPath);
    }
    const updatedFile = (_a = this.app.vault.getFileByPath(expectedPath)) != null ? _a : file;
    await this.app.vault.modify(updatedFile, this.eventToMarkdown(event));
  }
  async delete(id) {
    const file = this.findFileForEvent(id);
    if (file) await this.app.vault.delete(file);
  }
  async getInRange(startDate, endDate) {
    const all = await this.getAll();
    return all.filter((e) => e.startDate >= startDate && e.startDate <= endDate);
  }
  eventToMarkdown(event) {
    var _a, _b, _c, _d, _e;
    const fm = {
      id: event.id,
      title: event.title,
      location: (_a = event.location) != null ? _a : null,
      "all-day": event.allDay,
      "start-date": event.startDate,
      "start-time": (_b = event.startTime) != null ? _b : null,
      "end-date": event.endDate,
      "end-time": (_c = event.endTime) != null ? _c : null,
      recurrence: (_d = event.recurrence) != null ? _d : null,
      "calendar-id": (_e = event.calendarId) != null ? _e : null,
      alert: event.alert,
      "linked-task-ids": event.linkedTaskIds,
      "completed-instances": event.completedInstances,
      "created-at": event.createdAt
    };
    const yaml = Object.entries(fm).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n");
    const body = event.notes ? `
${event.notes}` : "";
    return `---
${yaml}
---
${body}`;
  }
  async fileToEvent(file) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    try {
      const cache = this.app.metadataCache.getFileCache(file);
      const fm = cache == null ? void 0 : cache.frontmatter;
      if (!(fm == null ? void 0 : fm.id) || !(fm == null ? void 0 : fm.title)) return null;
      const content = await this.app.vault.read(file);
      const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
      const notes = ((_a = bodyMatch == null ? void 0 : bodyMatch[1]) == null ? void 0 : _a.trim()) || void 0;
      return {
        id: fm.id,
        title: fm.title,
        location: (_b = fm.location) != null ? _b : void 0,
        allDay: (_c = fm["all-day"]) != null ? _c : true,
        startDate: fm["start-date"],
        startTime: (_d = fm["start-time"]) != null ? _d : void 0,
        endDate: fm["end-date"],
        endTime: (_e = fm["end-time"]) != null ? _e : void 0,
        recurrence: (_f = fm.recurrence) != null ? _f : void 0,
        calendarId: (_g = fm["calendar-id"]) != null ? _g : void 0,
        alert: (_h = fm.alert) != null ? _h : "none",
        linkedTaskIds: (_i = fm["linked-task-ids"]) != null ? _i : [],
        completedInstances: (_j = fm["completed-instances"]) != null ? _j : [],
        createdAt: (_k = fm["created-at"]) != null ? _k : (/* @__PURE__ */ new Date()).toISOString(),
        notes
      };
    } catch (e) {
      return null;
    }
  }
  findFileForEvent(id) {
    var _a;
    const folder = this.app.vault.getFolderByPath(this.eventsFolder);
    if (!folder) return null;
    for (const child of folder.children) {
      if (!(child instanceof import_obsidian2.TFile)) continue;
      const cache = this.app.metadataCache.getFileCache(child);
      if (((_a = cache == null ? void 0 : cache.frontmatter) == null ? void 0 : _a.id) === id) return child;
    }
    return null;
  }
  async ensureFolder() {
    if (!this.app.vault.getFolderByPath(this.eventsFolder)) {
      await this.app.vault.createFolder(this.eventsFolder);
    }
  }
  generateId() {
    return `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }
};

// src/views/TaskView.ts
var import_obsidian4 = require("obsidian");

// src/views/TaskFormView.ts
var import_obsidian3 = require("obsidian");
var TASK_FORM_VIEW_TYPE = "chronicle-task-form";
var TaskFormView = class extends import_obsidian3.ItemView {
  constructor(leaf, taskManager, calendarManager, editingTask, onSave) {
    super(leaf);
    this.editingTask = null;
    this.taskManager = taskManager;
    this.calendarManager = calendarManager;
    this.editingTask = editingTask != null ? editingTask : null;
    this.onSave = onSave;
  }
  getViewType() {
    return TASK_FORM_VIEW_TYPE;
  }
  getDisplayText() {
    return this.editingTask ? "Edit task" : "New task";
  }
  getIcon() {
    return "check-circle";
  }
  async onOpen() {
    this.render();
  }
  loadTask(task) {
    this.editingTask = task;
    this.render();
  }
  render() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("chronicle-form-page");
    const t = this.editingTask;
    const calendars = this.calendarManager.getAll();
    const header = container.createDiv("cf-header");
    const cancelBtn = header.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });
    header.createDiv("cf-header-title").setText(t ? "Edit task" : "New task");
    const saveBtn = header.createEl("button", { cls: "cf-btn-primary", text: t ? "Save" : "Add" });
    const form = container.createDiv("cf-form");
    const titleField = this.field(form, "Title");
    const titleInput = titleField.createEl("input", {
      type: "text",
      cls: "cf-input cf-title-input",
      placeholder: "Task name"
    });
    titleInput.value = (_a = t == null ? void 0 : t.title) != null ? _a : "";
    titleInput.focus();
    const row1 = form.createDiv("cf-row");
    const statusField = this.field(row1, "Status");
    const statusSelect = statusField.createEl("select", { cls: "cf-select" });
    const statuses = [
      { value: "todo", label: "To do" },
      { value: "in-progress", label: "In progress" },
      { value: "done", label: "Done" },
      { value: "cancelled", label: "Cancelled" }
    ];
    for (const s of statuses) {
      const opt = statusSelect.createEl("option", { value: s.value, text: s.label });
      if ((t == null ? void 0 : t.status) === s.value) opt.selected = true;
    }
    const priorityField = this.field(row1, "Priority");
    const prioritySelect = priorityField.createEl("select", { cls: "cf-select" });
    const priorities = [
      { value: "none", label: "None", color: "" },
      { value: "low", label: "Low", color: "#34C759" },
      { value: "medium", label: "Medium", color: "#FF9500" },
      { value: "high", label: "High", color: "#FF3B30" }
    ];
    for (const p of priorities) {
      const opt = prioritySelect.createEl("option", { value: p.value, text: p.label });
      if ((t == null ? void 0 : t.priority) === p.value) opt.selected = true;
    }
    const row2 = form.createDiv("cf-row");
    const dueDateField = this.field(row2, "Due date");
    const dueDateInput = dueDateField.createEl("input", {
      type: "date",
      cls: "cf-input"
    });
    dueDateInput.value = (_b = t == null ? void 0 : t.dueDate) != null ? _b : "";
    const dueTimeField = this.field(row2, "Due time");
    const dueTimeInput = dueTimeField.createEl("input", {
      type: "time",
      cls: "cf-input"
    });
    dueTimeInput.value = (_c = t == null ? void 0 : t.dueTime) != null ? _c : "";
    const calField = this.field(form, "Calendar");
    const calSelect = calField.createEl("select", { cls: "cf-select" });
    calSelect.createEl("option", { value: "", text: "None" });
    for (const cal of calendars) {
      const opt = calSelect.createEl("option", { value: cal.id, text: cal.name });
      if ((t == null ? void 0 : t.calendarId) === cal.id) opt.selected = true;
    }
    const updateCalColor = () => {
      const cal = this.calendarManager.getById(calSelect.value);
      calSelect.style.borderLeftColor = cal ? CalendarManager.colorToHex(cal.color) : "transparent";
      calSelect.style.borderLeftWidth = "4px";
      calSelect.style.borderLeftStyle = "solid";
    };
    calSelect.addEventListener("change", updateCalColor);
    updateCalColor();
    const recField = this.field(form, "Repeat");
    const recSelect = recField.createEl("select", { cls: "cf-select" });
    const recurrences = [
      { value: "", label: "Never" },
      { value: "FREQ=DAILY", label: "Every day" },
      { value: "FREQ=WEEKLY", label: "Every week" },
      { value: "FREQ=MONTHLY", label: "Every month" },
      { value: "FREQ=YEARLY", label: "Every year" },
      { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", label: "Weekdays" }
    ];
    for (const r of recurrences) {
      const opt = recSelect.createEl("option", { value: r.value, text: r.label });
      if ((t == null ? void 0 : t.recurrence) === r.value) opt.selected = true;
    }
    const estimateField = this.field(form, "Time estimate");
    const estimateWrap = estimateField.createDiv("cf-row");
    const estimateInput = estimateWrap.createEl("input", {
      type: "number",
      cls: "cf-input cf-input-sm",
      placeholder: "0"
    });
    estimateInput.value = (t == null ? void 0 : t.timeEstimate) ? String(t.timeEstimate) : "";
    estimateInput.min = "0";
    estimateWrap.createSpan({ cls: "cf-unit", text: "minutes" });
    const tagsField = this.field(form, "Tags");
    const tagsInput = tagsField.createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "work, personal, urgent  (comma separated)"
    });
    tagsInput.value = (_d = t == null ? void 0 : t.tags.join(", ")) != null ? _d : "";
    const contextsField = this.field(form, "Contexts");
    const contextsInput = contextsField.createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "@home, @work  (comma separated)"
    });
    contextsInput.value = (_e = t == null ? void 0 : t.contexts.join(", ")) != null ? _e : "";
    const linkedField = this.field(form, "Linked notes");
    const linkedInput = linkedField.createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Projects/Website, Journal/2024  (comma separated)"
    });
    linkedInput.value = (_f = t == null ? void 0 : t.linkedNotes.join(", ")) != null ? _f : "";
    const customSection = form.createDiv("cf-section");
    customSection.createDiv("cf-section-label").setText("Custom fields");
    const customList = customSection.createDiv("cf-custom-list");
    const customFields = [
      ...(_g = t == null ? void 0 : t.customFields.map((f) => ({ key: f.key, value: String(f.value) }))) != null ? _g : []
    ];
    const renderCustomFields = () => {
      customList.empty();
      for (let i = 0; i < customFields.length; i++) {
        const cf = customFields[i];
        const cfRow = customList.createDiv("cf-custom-row");
        const keyInput = cfRow.createEl("input", {
          type: "text",
          cls: "cf-input cf-custom-key",
          placeholder: "Field name"
        });
        keyInput.value = cf.key;
        keyInput.addEventListener("input", () => {
          customFields[i].key = keyInput.value;
        });
        const valInput = cfRow.createEl("input", {
          type: "text",
          cls: "cf-input cf-custom-val",
          placeholder: "Value"
        });
        valInput.value = cf.value;
        valInput.addEventListener("input", () => {
          customFields[i].value = valInput.value;
        });
        const removeBtn = cfRow.createEl("button", { cls: "cf-btn-icon", text: "\xD7" });
        removeBtn.addEventListener("click", () => {
          customFields.splice(i, 1);
          renderCustomFields();
        });
      }
      const addCfBtn = customList.createEl("button", {
        cls: "cf-btn-ghost cf-add-field",
        text: "+ Add field"
      });
      addCfBtn.addEventListener("click", () => {
        customFields.push({ key: "", value: "" });
        renderCustomFields();
      });
    };
    renderCustomFields();
    const notesField = this.field(form, "Notes");
    const notesInput = notesField.createEl("textarea", {
      cls: "cf-textarea",
      placeholder: "Add notes..."
    });
    notesInput.value = (_h = t == null ? void 0 : t.notes) != null ? _h : "";
    cancelBtn.addEventListener("click", () => {
      this.app.workspace.detachLeavesOfType(TASK_FORM_VIEW_TYPE);
    });
    const handleSave = async () => {
      var _a2, _b2, _c2, _d2;
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.focus();
        titleInput.classList.add("cf-error");
        return;
      }
      if (!this.editingTask) {
        const existing = await this.taskManager.getAll();
        const duplicate = existing.find(
          (t2) => t2.title.toLowerCase() === title.toLowerCase()
        );
        if (duplicate) {
          new import_obsidian3.Notice(`A task named "${title}" already exists.`, 4e3);
          titleInput.classList.add("cf-error");
          titleInput.focus();
          return;
        }
      }
      const taskData = {
        title,
        status: statusSelect.value,
        priority: prioritySelect.value,
        dueDate: dueDateInput.value || void 0,
        dueTime: dueTimeInput.value || void 0,
        calendarId: calSelect.value || void 0,
        recurrence: recSelect.value || void 0,
        timeEstimate: estimateInput.value ? parseInt(estimateInput.value) : void 0,
        tags: tagsInput.value ? tagsInput.value.split(",").map((s) => s.trim()).filter(Boolean) : [],
        contexts: contextsInput.value ? contextsInput.value.split(",").map((s) => s.trim()).filter(Boolean) : [],
        linkedNotes: linkedInput.value ? linkedInput.value.split(",").map((s) => s.trim()).filter(Boolean) : [],
        projects: (_a2 = t == null ? void 0 : t.projects) != null ? _a2 : [],
        timeEntries: (_b2 = t == null ? void 0 : t.timeEntries) != null ? _b2 : [],
        completedInstances: (_c2 = t == null ? void 0 : t.completedInstances) != null ? _c2 : [],
        customFields: customFields.filter((f) => f.key).map((f) => ({ key: f.key, value: f.value })),
        notes: notesInput.value || void 0
      };
      if (t) {
        await this.taskManager.update({ ...t, ...taskData });
      } else {
        await this.taskManager.create(taskData);
      }
      (_d2 = this.onSave) == null ? void 0 : _d2.call(this);
      this.app.workspace.detachLeavesOfType(TASK_FORM_VIEW_TYPE);
    };
    saveBtn.addEventListener("click", handleSave);
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSave();
    });
  }
  field(parent, label) {
    const wrap = parent.createDiv("cf-field");
    wrap.createDiv("cf-label").setText(label);
    return wrap;
  }
};

// src/views/TaskView.ts
var TASK_VIEW_TYPE = "chronicle-task-view";
var TaskView = class extends import_obsidian4.ItemView {
  constructor(leaf, taskManager, calendarManager, eventManager) {
    super(leaf);
    this.currentListId = "today";
    this.taskManager = taskManager;
    this.calendarManager = calendarManager;
    this.eventManager = eventManager;
  }
  getViewType() {
    return TASK_VIEW_TYPE;
  }
  getDisplayText() {
    return "Chronicle";
  }
  getIcon() {
    return "check-circle";
  }
  async onOpen() {
    await this.render();
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (file.path.startsWith(this.taskManager["tasksFolder"])) {
          this.render();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (file.path.startsWith(this.taskManager["tasksFolder"])) {
          setTimeout(() => this.render(), 200);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file.path.startsWith(this.taskManager["tasksFolder"])) {
          this.render();
        }
      })
    );
  }
  async render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("chronicle-app");
    const all = await this.taskManager.getAll();
    const today = await this.taskManager.getDueToday();
    const scheduled = await this.taskManager.getScheduled();
    const flagged = await this.taskManager.getFlagged();
    const overdue = await this.taskManager.getOverdue();
    const calendars = this.calendarManager.getAll();
    const layout = container.createDiv("chronicle-layout");
    const sidebar = layout.createDiv("chronicle-sidebar");
    const main = layout.createDiv("chronicle-main");
    const newTaskBtn = sidebar.createEl("button", {
      cls: "chronicle-new-task-btn",
      text: "New task"
    });
    newTaskBtn.addEventListener("click", () => this.openTaskForm());
    const tilesGrid = sidebar.createDiv("chronicle-tiles");
    const tiles = [
      { id: "today", label: "Today", count: today.length + overdue.length, color: "#FF3B30", badge: overdue.length },
      { id: "scheduled", label: "Scheduled", count: scheduled.length, color: "#378ADD", badge: 0 },
      { id: "all", label: "All", count: all.filter((t) => t.status !== "done").length, color: "#636366", badge: 0 },
      { id: "flagged", label: "Flagged", count: flagged.length, color: "#FF9500", badge: 0 }
    ];
    for (const tile of tiles) {
      const t = tilesGrid.createDiv("chronicle-tile");
      t.style.backgroundColor = tile.color;
      if (tile.id === this.currentListId) t.addClass("active");
      const topRow = t.createDiv("chronicle-tile-top");
      topRow.createDiv("chronicle-tile-count").setText(String(tile.count));
      if (tile.badge > 0) {
        const badge = topRow.createDiv("chronicle-tile-badge");
        badge.setText(String(tile.badge));
        badge.title = `${tile.badge} overdue`;
      }
      t.createDiv("chronicle-tile-label").setText(tile.label);
      t.addEventListener("click", () => {
        this.currentListId = tile.id;
        this.render();
      });
    }
    const listsSection = sidebar.createDiv("chronicle-lists-section");
    listsSection.createDiv("chronicle-section-label").setText("My Lists");
    for (const cal of calendars) {
      const row = listsSection.createDiv("chronicle-list-row");
      if (cal.id === this.currentListId) row.addClass("active");
      const dot = row.createDiv("chronicle-list-dot");
      dot.style.backgroundColor = CalendarManager.colorToHex(cal.color);
      row.createDiv("chronicle-list-name").setText(cal.name);
      const calCount = all.filter((t) => t.calendarId === cal.id && t.status !== "done").length;
      if (calCount > 0) row.createDiv("chronicle-list-count").setText(String(calCount));
      row.addEventListener("click", () => {
        this.currentListId = cal.id;
        this.render();
      });
    }
    await this.renderMainPanel(main, all, overdue);
  }
  async renderMainPanel(main, all, overdue) {
    var _a;
    const header = main.createDiv("chronicle-main-header");
    const titleEl = header.createDiv("chronicle-main-title");
    let tasks = [];
    const smartColors = {
      today: "#FF3B30",
      scheduled: "#378ADD",
      all: "#636366",
      flagged: "#FF9500"
    };
    if (smartColors[this.currentListId]) {
      const labels = {
        today: "Today",
        scheduled: "Scheduled",
        all: "All",
        flagged: "Flagged"
      };
      titleEl.setText(labels[this.currentListId]);
      titleEl.style.color = smartColors[this.currentListId];
      switch (this.currentListId) {
        case "today":
          tasks = [...overdue, ...await this.taskManager.getDueToday()];
          break;
        case "scheduled":
          tasks = await this.taskManager.getScheduled();
          break;
        case "flagged":
          tasks = await this.taskManager.getFlagged();
          break;
        case "all":
          tasks = all.filter((t) => t.status !== "done");
          break;
      }
    } else {
      const cal = this.calendarManager.getById(this.currentListId);
      titleEl.setText((_a = cal == null ? void 0 : cal.name) != null ? _a : "List");
      titleEl.style.color = cal ? CalendarManager.colorToHex(cal.color) : "var(--text-normal)";
      tasks = all.filter(
        (t) => t.calendarId === this.currentListId && t.status !== "done"
      );
    }
    const activeTasks = tasks.filter((t) => t.status !== "done");
    if (activeTasks.length > 0) {
      header.createDiv("chronicle-main-subtitle").setText(
        `${activeTasks.length} ${activeTasks.length === 1 ? "task" : "tasks"}`
      );
    }
    const listEl = main.createDiv("chronicle-task-list");
    if (tasks.length === 0) {
      this.renderEmptyState(listEl);
    } else {
      const groups = this.groupTasks(tasks);
      for (const [group, groupTasks] of Object.entries(groups)) {
        if (groupTasks.length === 0) continue;
        listEl.createDiv("chronicle-group-label").setText(group);
        const card = listEl.createDiv("chronicle-task-card-group");
        for (const task of groupTasks) {
          this.renderTaskRow(card, task);
        }
      }
    }
  }
  renderEmptyState(container) {
    const empty = container.createDiv("chronicle-empty-state");
    const icon = empty.createDiv("chronicle-empty-icon");
    icon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    empty.createDiv("chronicle-empty-title").setText("All done");
    empty.createDiv("chronicle-empty-subtitle").setText("Nothing left in this list.");
  }
  renderTaskRow(container, task) {
    const row = container.createDiv("chronicle-task-row");
    const isDone = task.status === "done";
    const checkboxWrap = row.createDiv("chronicle-checkbox-wrap");
    const checkbox = checkboxWrap.createDiv("chronicle-checkbox");
    if (isDone) checkbox.addClass("done");
    checkbox.innerHTML = `<svg class="chronicle-checkmark" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    checkbox.addEventListener("click", async (e) => {
      e.stopPropagation();
      checkbox.addClass("completing");
      setTimeout(async () => {
        await this.taskManager.update({
          ...task,
          status: isDone ? "todo" : "done",
          completedAt: isDone ? void 0 : (/* @__PURE__ */ new Date()).toISOString()
        });
        await this.render();
      }, 300);
    });
    const content = row.createDiv("chronicle-task-content");
    content.addEventListener("click", () => this.openTaskForm(task));
    const titleEl = content.createDiv("chronicle-task-title");
    titleEl.setText(task.title);
    if (isDone) titleEl.addClass("done");
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (task.dueDate || task.calendarId) {
      const meta = content.createDiv("chronicle-task-meta");
      if (task.dueDate) {
        const metaDate = meta.createSpan("chronicle-task-date");
        metaDate.setText(this.formatDate(task.dueDate));
        if (task.dueDate < todayStr) metaDate.addClass("overdue");
      }
      if (task.calendarId) {
        const cal = this.calendarManager.getById(task.calendarId);
        if (cal) {
          const calDot = meta.createSpan("chronicle-task-cal-dot");
          calDot.style.backgroundColor = CalendarManager.colorToHex(cal.color);
          meta.createSpan("chronicle-task-cal-name").setText(cal.name);
        }
      }
    }
    if (task.priority === "high") {
      row.createDiv("chronicle-flag").setText("\u2691");
    }
    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const menu = document.createElement("div");
      menu.className = "chronicle-context-menu";
      menu.style.left = `${e.clientX}px`;
      menu.style.top = `${e.clientY}px`;
      const editItem = menu.createDiv("chronicle-context-item");
      editItem.setText("Edit task");
      editItem.addEventListener("click", () => {
        menu.remove();
        this.openTaskForm(task);
      });
      const deleteItem = menu.createDiv("chronicle-context-item chronicle-context-delete");
      deleteItem.setText("Delete task");
      deleteItem.addEventListener("click", async () => {
        menu.remove();
        await this.taskManager.delete(task.id);
        await this.render();
      });
      const cancelItem = menu.createDiv("chronicle-context-item");
      cancelItem.setText("Cancel");
      cancelItem.addEventListener("click", () => menu.remove());
      document.body.appendChild(menu);
      setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
    });
  }
  groupTasks(tasks) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
    const groups = {
      "Overdue": [],
      "Today": [],
      "This week": [],
      "Later": [],
      "No date": []
    };
    for (const task of tasks) {
      if (task.status === "done") continue;
      if (!task.dueDate) {
        groups["No date"].push(task);
        continue;
      }
      if (task.dueDate < today) {
        groups["Overdue"].push(task);
        continue;
      }
      if (task.dueDate === today) {
        groups["Today"].push(task);
        continue;
      }
      if (task.dueDate <= nextWeek) {
        groups["This week"].push(task);
        continue;
      }
      groups["Later"].push(task);
    }
    return groups;
  }
  formatDate(dateStr) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 864e5).toISOString().split("T")[0];
    if (dateStr === today) return "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    return (/* @__PURE__ */ new Date(dateStr + "T00:00:00")).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  }
  async openTaskForm(task) {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(TASK_FORM_VIEW_TYPE)[0];
    if (existing) existing.detach();
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: TASK_FORM_VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const formLeaf = workspace.getLeavesOfType(TASK_FORM_VIEW_TYPE)[0];
    const formView = formLeaf == null ? void 0 : formLeaf.view;
    if (formView && task) formView.loadTask(task);
  }
};

// src/ui/EventModal.ts
var import_obsidian5 = require("obsidian");
var EventModal = class extends import_obsidian5.Modal {
  constructor(app, eventManager, calendarManager, editingEvent, onSave) {
    super(app);
    this.eventManager = eventManager;
    this.calendarManager = calendarManager;
    this.editingEvent = editingEvent != null ? editingEvent : null;
    this.onSave = onSave;
  }
  onOpen() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("chronicle-event-modal");
    const e = this.editingEvent;
    const calendars = this.calendarManager.getAll();
    const header = contentEl.createDiv("cem-header");
    header.createDiv("cem-title").setText(e ? "Edit event" : "New event");
    const expandBtn = header.createEl("button", { cls: "cf-btn-ghost cem-expand-btn" });
    expandBtn.title = "Open as full page";
    expandBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
    const form = contentEl.createDiv("cem-form");
    const titleInput = this.cemField(form, "Title").createEl("input", {
      type: "text",
      cls: "cf-input cf-title-input",
      placeholder: "Event name"
    });
    titleInput.value = (_a = e == null ? void 0 : e.title) != null ? _a : "";
    titleInput.focus();
    const locationInput = this.cemField(form, "Location").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Add location"
    });
    locationInput.value = (_b = e == null ? void 0 : e.location) != null ? _b : "";
    const allDayField = this.cemField(form, "All day");
    const allDayWrap = allDayField.createDiv("cem-toggle-wrap");
    const allDayToggle = allDayWrap.createEl("input", { type: "checkbox", cls: "cem-toggle" });
    allDayToggle.checked = (_c = e == null ? void 0 : e.allDay) != null ? _c : false;
    const allDayLabel = allDayWrap.createSpan({ cls: "cem-toggle-label", text: allDayToggle.checked ? "Yes" : "No" });
    allDayToggle.addEventListener("change", () => {
      allDayLabel.setText(allDayToggle.checked ? "Yes" : "No");
      timeFields.style.display = allDayToggle.checked ? "none" : "";
    });
    const startRow = form.createDiv("cf-row");
    const startDateInput = this.cemField(startRow, "Start date").createEl("input", {
      type: "date",
      cls: "cf-input"
    });
    startDateInput.value = (_d = e == null ? void 0 : e.startDate) != null ? _d : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const timeFields = form.createDiv("cem-time-fields");
    timeFields.style.display = allDayToggle.checked ? "none" : "";
    const startTimeRow = timeFields.createDiv("cf-row");
    const startTimeInput = this.cemField(startTimeRow, "Start time").createEl("input", {
      type: "time",
      cls: "cf-input"
    });
    startTimeInput.value = (_e = e == null ? void 0 : e.startTime) != null ? _e : "09:00";
    const endTimeInput = this.cemField(startTimeRow, "End time").createEl("input", {
      type: "time",
      cls: "cf-input"
    });
    endTimeInput.value = (_f = e == null ? void 0 : e.endTime) != null ? _f : "10:00";
    const endDateInput = this.cemField(startRow, "End date").createEl("input", {
      type: "date",
      cls: "cf-input"
    });
    endDateInput.value = (_g = e == null ? void 0 : e.endDate) != null ? _g : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    startDateInput.addEventListener("change", () => {
      if (!endDateInput.value || endDateInput.value < startDateInput.value) {
        endDateInput.value = startDateInput.value;
      }
    });
    const recSelect = this.cemField(form, "Repeat").createEl("select", { cls: "cf-select" });
    const recurrences = [
      { value: "", label: "Never" },
      { value: "FREQ=DAILY", label: "Every day" },
      { value: "FREQ=WEEKLY", label: "Every week" },
      { value: "FREQ=MONTHLY", label: "Every month" },
      { value: "FREQ=YEARLY", label: "Every year" },
      { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", label: "Weekdays" }
    ];
    for (const r of recurrences) {
      const opt = recSelect.createEl("option", { value: r.value, text: r.label });
      if ((e == null ? void 0 : e.recurrence) === r.value) opt.selected = true;
    }
    const calSelect = this.cemField(form, "Calendar").createEl("select", { cls: "cf-select" });
    calSelect.createEl("option", { value: "", text: "None" });
    for (const cal of calendars) {
      const opt = calSelect.createEl("option", { value: cal.id, text: cal.name });
      if ((e == null ? void 0 : e.calendarId) === cal.id) opt.selected = true;
    }
    const updateCalColor = () => {
      const cal = this.calendarManager.getById(calSelect.value);
      calSelect.style.borderLeftColor = cal ? CalendarManager.colorToHex(cal.color) : "transparent";
      calSelect.style.borderLeftWidth = "4px";
      calSelect.style.borderLeftStyle = "solid";
    };
    calSelect.addEventListener("change", updateCalColor);
    updateCalColor();
    const alertSelect = this.cemField(form, "Alert").createEl("select", { cls: "cf-select" });
    const alerts = [
      { value: "none", label: "None" },
      { value: "at-time", label: "At time of event" },
      { value: "5min", label: "5 minutes before" },
      { value: "10min", label: "10 minutes before" },
      { value: "15min", label: "15 minutes before" },
      { value: "30min", label: "30 minutes before" },
      { value: "1hour", label: "1 hour before" },
      { value: "2hours", label: "2 hours before" },
      { value: "1day", label: "1 day before" },
      { value: "2days", label: "2 days before" },
      { value: "1week", label: "1 week before" }
    ];
    for (const a of alerts) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if ((e == null ? void 0 : e.alert) === a.value) opt.selected = true;
    }
    const notesInput = this.cemField(form, "Notes").createEl("textarea", {
      cls: "cf-textarea",
      placeholder: "Add notes..."
    });
    notesInput.value = (_h = e == null ? void 0 : e.notes) != null ? _h : "";
    const footer = contentEl.createDiv("cem-footer");
    const cancelBtn = footer.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });
    const saveBtn = footer.createEl("button", { cls: "cf-btn-primary", text: e ? "Save" : "Add event" });
    cancelBtn.addEventListener("click", () => this.close());
    const handleSave = async () => {
      var _a2, _b2, _c2;
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.focus();
        titleInput.classList.add("cf-error");
        return;
      }
      const eventData = {
        title,
        location: locationInput.value || void 0,
        allDay: allDayToggle.checked,
        startDate: startDateInput.value,
        startTime: allDayToggle.checked ? void 0 : startTimeInput.value,
        endDate: endDateInput.value || startDateInput.value,
        endTime: allDayToggle.checked ? void 0 : endTimeInput.value,
        recurrence: recSelect.value || void 0,
        calendarId: calSelect.value || void 0,
        alert: alertSelect.value,
        notes: notesInput.value || void 0,
        linkedTaskIds: (_a2 = e == null ? void 0 : e.linkedTaskIds) != null ? _a2 : [],
        completedInstances: (_b2 = e == null ? void 0 : e.completedInstances) != null ? _b2 : []
      };
      if (e) {
        await this.eventManager.update({ ...e, ...eventData });
      } else {
        await this.eventManager.create(eventData);
      }
      (_c2 = this.onSave) == null ? void 0 : _c2.call(this);
      this.close();
    };
    saveBtn.addEventListener("click", handleSave);
    expandBtn.addEventListener("click", () => {
      this.close();
    });
    titleInput.addEventListener("keydown", (e2) => {
      if (e2.key === "Enter") handleSave();
      if (e2.key === "Escape") this.close();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
  cemField(parent, label) {
    const wrap = parent.createDiv("cf-field");
    wrap.createDiv("cf-label").setText(label);
    return wrap;
  }
};

// src/main.ts
var ChroniclePlugin = class extends import_obsidian6.Plugin {
  async onload() {
    await this.loadSettings();
    this.calendarManager = new CalendarManager(
      this.settings.calendars,
      () => this.saveSettings()
    );
    this.taskManager = new TaskManager(this.app, this.settings.tasksFolder);
    this.eventManager = new EventManager(this.app, this.settings.eventsFolder);
    this.registerView(
      TASK_VIEW_TYPE,
      (leaf) => new TaskView(leaf, this.taskManager, this.calendarManager, this.eventManager)
    );
    this.registerView(
      TASK_FORM_VIEW_TYPE,
      (leaf) => new TaskFormView(leaf, this.taskManager, this.calendarManager)
    );
    this.addRibbonIcon("check-circle", "Chronicle", () => this.activateView());
    this.addCommand({
      id: "open-chronicle",
      name: "Open Chronicle",
      callback: () => this.activateView()
    });
    this.addCommand({
      id: "new-task",
      name: "New task",
      hotkeys: [{ modifiers: ["Mod"], key: "n" }],
      callback: () => this.openTaskForm()
    });
    this.addCommand({
      id: "new-event",
      name: "New event",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "n" }],
      callback: () => this.openEventModal()
    });
    console.log("Chronicle loaded \u2713");
  }
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(TASK_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: TASK_VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }
  async openTaskForm() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(TASK_FORM_VIEW_TYPE)[0];
    if (existing) existing.detach();
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: TASK_FORM_VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const formLeaf = workspace.getLeavesOfType(TASK_FORM_VIEW_TYPE)[0];
    if ((formLeaf == null ? void 0 : formLeaf.view) instanceof TaskFormView) {
      formLeaf.view.onSave = () => {
        const dashLeaf = workspace.getLeavesOfType(TASK_VIEW_TYPE)[0];
        if ((dashLeaf == null ? void 0 : dashLeaf.view) instanceof TaskView) {
          dashLeaf.view.render();
        }
      };
    }
  }
  openEventModal() {
    new EventModal(
      this.app,
      this.eventManager,
      this.calendarManager,
      void 0,
      () => {
      }
    ).open();
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(TASK_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(TASK_FORM_VIEW_TYPE);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3R5cGVzL2luZGV4LnRzIiwgInNyYy9kYXRhL0NhbGVuZGFyTWFuYWdlci50cyIsICJzcmMvZGF0YS9UYXNrTWFuYWdlci50cyIsICJzcmMvZGF0YS9FdmVudE1hbmFnZXIudHMiLCAic3JjL3ZpZXdzL1Rhc2tWaWV3LnRzIiwgInNyYy92aWV3cy9UYXNrRm9ybVZpZXcudHMiLCAic3JjL3VpL0V2ZW50TW9kYWwudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IFBsdWdpbiwgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlU2V0dGluZ3MsIERFRkFVTFRfU0VUVElOR1MgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IFRhc2tNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9UYXNrTWFuYWdlclwiO1xuaW1wb3J0IHsgRXZlbnRNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9FdmVudE1hbmFnZXJcIjtcbmltcG9ydCB7IFRhc2tWaWV3LCBUQVNLX1ZJRVdfVFlQRSB9IGZyb20gXCIuL3ZpZXdzL1Rhc2tWaWV3XCI7XG5pbXBvcnQgeyBUYXNrRm9ybVZpZXcsIFRBU0tfRk9STV9WSUVXX1RZUEUgfSBmcm9tIFwiLi92aWV3cy9UYXNrRm9ybVZpZXdcIjtcbmltcG9ydCB7IEV2ZW50TW9kYWwgfSBmcm9tIFwiLi91aS9FdmVudE1vZGFsXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENocm9uaWNsZVBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBDaHJvbmljbGVTZXR0aW5ncztcbiAgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXI7XG4gIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcjtcbiAgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXI7XG5cbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IG5ldyBDYWxlbmRhck1hbmFnZXIoXG4gICAgICB0aGlzLnNldHRpbmdzLmNhbGVuZGFycyxcbiAgICAgICgpID0+IHRoaXMuc2F2ZVNldHRpbmdzKClcbiAgICApO1xuICAgIHRoaXMudGFza01hbmFnZXIgID0gbmV3IFRhc2tNYW5hZ2VyKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLnRhc2tzRm9sZGVyKTtcbiAgICB0aGlzLmV2ZW50TWFuYWdlciA9IG5ldyBFdmVudE1hbmFnZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MuZXZlbnRzRm9sZGVyKTtcblxuICAgIC8vIFJlZ2lzdGVyIHZpZXdzXG4gICAgdGhpcy5yZWdpc3RlclZpZXcoXG4gICAgICBUQVNLX1ZJRVdfVFlQRSxcbiAgICAgIChsZWFmKSA9PiBuZXcgVGFza1ZpZXcobGVhZiwgdGhpcy50YXNrTWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIsIHRoaXMuZXZlbnRNYW5hZ2VyKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlclZpZXcoXG4gICAgICBUQVNLX0ZPUk1fVklFV19UWVBFLFxuICAgICAgKGxlYWYpID0+IG5ldyBUYXNrRm9ybVZpZXcobGVhZiwgdGhpcy50YXNrTWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIpXG4gICAgKTtcblxuICAgIC8vIFJpYmJvblxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcImNoZWNrLWNpcmNsZVwiLCBcIkNocm9uaWNsZVwiLCAoKSA9PiB0aGlzLmFjdGl2YXRlVmlldygpKTtcblxuICAgIC8vIENvbW1hbmRzXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9wZW4tY2hyb25pY2xlXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gQ2hyb25pY2xlXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5hY3RpdmF0ZVZpZXcoKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJuZXctdGFza1wiLFxuICAgICAgbmFtZTogXCJOZXcgdGFza1wiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIl0sIGtleTogXCJuXCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5vcGVuVGFza0Zvcm0oKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJuZXctZXZlbnRcIixcbiAgICAgIG5hbWU6IFwiTmV3IGV2ZW50XCIsXG4gICAgICBob3RrZXlzOiBbeyBtb2RpZmllcnM6IFtcIk1vZFwiLCBcIlNoaWZ0XCJdLCBrZXk6IFwiblwiIH1dLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHRoaXMub3BlbkV2ZW50TW9kYWwoKSxcbiAgICB9KTtcblxuICAgIGNvbnNvbGUubG9nKFwiQ2hyb25pY2xlIGxvYWRlZCBcdTI3MTNcIik7XG4gIH1cblxuICBhc3luYyBhY3RpdmF0ZVZpZXcoKSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGxldCBsZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShUQVNLX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IFRBU0tfVklFV19UWVBFLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgfVxuICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgYXN5bmMgb3BlblRhc2tGb3JtKCkge1xuICAgIGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcbiAgICBjb25zdCBleGlzdGluZyA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVEFTS19GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKGV4aXN0aW5nKSBleGlzdGluZy5kZXRhY2goKTtcbiAgICBjb25zdCBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBUQVNLX0ZPUk1fVklFV19UWVBFLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cbiAgICAvLyBQYXNzIHJlZnJlc2ggY2FsbGJhY2sgdG8gdGhlIGZvcm1cbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTApKTtcbiAgICBjb25zdCBmb3JtTGVhZiA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVEFTS19GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKGZvcm1MZWFmPy52aWV3IGluc3RhbmNlb2YgVGFza0Zvcm1WaWV3KSB7XG4gICAgICAoZm9ybUxlYWYudmlldyBhcyBUYXNrRm9ybVZpZXcpLm9uU2F2ZSA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgZGFzaExlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfVklFV19UWVBFKVswXTtcbiAgICAgICAgaWYgKGRhc2hMZWFmPy52aWV3IGluc3RhbmNlb2YgVGFza1ZpZXcpIHtcbiAgICAgICAgICAoZGFzaExlYWYudmlldyBhcyBUYXNrVmlldykucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgb3BlbkV2ZW50TW9kYWwoKSB7XG4gICAgbmV3IEV2ZW50TW9kYWwoXG4gICAgICB0aGlzLmFwcCxcbiAgICAgIHRoaXMuZXZlbnRNYW5hZ2VyLFxuICAgICAgdGhpcy5jYWxlbmRhck1hbmFnZXIsXG4gICAgICB1bmRlZmluZWQsXG4gICAgICAoKSA9PiB7fVxuICAgICkub3BlbigpO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShUQVNLX1ZJRVdfVFlQRSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShUQVNLX0ZPUk1fVklFV19UWVBFKTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG59IiwgIi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDYWxlbmRhcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIENhbGVuZGFyQ29sb3IgPVxuICB8IFwiYmx1ZVwiIHwgXCJncmVlblwiIHwgXCJwdXJwbGVcIiB8IFwib3JhbmdlXCJcbiAgfCBcInJlZFwiIHwgXCJ0ZWFsXCIgfCBcInBpbmtcIiB8IFwieWVsbG93XCIgfCBcImdyYXlcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVDYWxlbmRhciB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgY29sb3I6IENhbGVuZGFyQ29sb3I7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBpc1Zpc2libGU6IGJvb2xlYW47XG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgVGFza3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIFRhc2tTdGF0dXMgPSBcInRvZG9cIiB8IFwiaW4tcHJvZ3Jlc3NcIiB8IFwiZG9uZVwiIHwgXCJjYW5jZWxsZWRcIjtcbmV4cG9ydCB0eXBlIFRhc2tQcmlvcml0eSA9IFwibm9uZVwiIHwgXCJsb3dcIiB8IFwibWVkaXVtXCIgfCBcImhpZ2hcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUaW1lRW50cnkge1xuICBzdGFydFRpbWU6IHN0cmluZzsgICAvLyBJU08gODYwMVxuICBlbmRUaW1lPzogc3RyaW5nOyAgICAvLyBJU08gODYwMVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEN1c3RvbUZpZWxkIHtcbiAga2V5OiBzdHJpbmc7XG4gIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENocm9uaWNsZVRhc2sge1xuICAvLyAtLS0gQ29yZSAtLS1cbiAgaWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgc3RhdHVzOiBUYXNrU3RhdHVzO1xuICBwcmlvcml0eTogVGFza1ByaW9yaXR5O1xuXG4gIC8vIC0tLSBTY2hlZHVsaW5nIC0tLVxuICBkdWVEYXRlPzogc3RyaW5nOyAgICAgICAvLyBZWVlZLU1NLUREXG4gIGR1ZVRpbWU/OiBzdHJpbmc7ICAgICAgIC8vIEhIOm1tXG4gIHJlY3VycmVuY2U/OiBzdHJpbmc7ICAgIC8vIFJSVUxFIHN0cmluZyBlLmcuIFwiRlJFUT1XRUVLTFk7QllEQVk9TU9cIlxuXG4gIC8vIC0tLSBPcmdhbmlzYXRpb24gLS0tXG4gIGNhbGVuZGFySWQ/OiBzdHJpbmc7ICAgIC8vIGxpbmtzIHRvIGEgQ2hyb25pY2xlQ2FsZW5kYXJcbiAgdGFnczogc3RyaW5nW107XG4gIGNvbnRleHRzOiBzdHJpbmdbXTsgICAgIC8vIGUuZy4gW1wiQGhvbWVcIiwgXCJAd29ya1wiXVxuICBsaW5rZWROb3Rlczogc3RyaW5nW107ICAvLyB3aWtpbGluayBwYXRocyBlLmcuIFtcIlByb2plY3RzL1dlYnNpdGVcIl1cbiAgcHJvamVjdHM6IHN0cmluZ1tdO1xuXG4gIC8vIC0tLSBUaW1lIHRyYWNraW5nIC0tLVxuICB0aW1lRXN0aW1hdGU/OiBudW1iZXI7ICAvLyBtaW51dGVzXG4gIHRpbWVFbnRyaWVzOiBUaW1lRW50cnlbXTtcblxuICAvLyAtLS0gQ3VzdG9tIC0tLVxuICBjdXN0b21GaWVsZHM6IEN1c3RvbUZpZWxkW107XG5cbiAgLy8gLS0tIFJlY3VycmVuY2UgY29tcGxldGlvbiAtLS1cbiAgY29tcGxldGVkSW5zdGFuY2VzOiBzdHJpbmdbXTsgLy8gWVlZWS1NTS1ERCBkYXRlc1xuXG4gIC8vIC0tLSBNZXRhIC0tLVxuICBjcmVhdGVkQXQ6IHN0cmluZzsgICAgICAvLyBJU08gODYwMVxuICBjb21wbGV0ZWRBdD86IHN0cmluZzsgICAvLyBJU08gODYwMVxuICBub3Rlcz86IHN0cmluZzsgICAgICAgICAvLyBib2R5IGNvbnRlbnQgb2YgdGhlIG5vdGVcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIEV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IHR5cGUgQWxlcnRPZmZzZXQgPVxuICB8IFwibm9uZVwiXG4gIHwgXCJhdC10aW1lXCJcbiAgfCBcIjVtaW5cIiB8IFwiMTBtaW5cIiB8IFwiMTVtaW5cIiB8IFwiMzBtaW5cIlxuICB8IFwiMWhvdXJcIiB8IFwiMmhvdXJzXCJcbiAgfCBcIjFkYXlcIiB8IFwiMmRheXNcIiB8IFwiMXdlZWtcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVFdmVudCB7XG4gIC8vIC0tLSBDb3JlIChpbiBmb3JtIG9yZGVyKSAtLS1cbiAgaWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgbG9jYXRpb24/OiBzdHJpbmc7XG4gIGFsbERheTogYm9vbGVhbjtcbiAgc3RhcnREYXRlOiBzdHJpbmc7ICAgICAgLy8gWVlZWS1NTS1ERFxuICBzdGFydFRpbWU/OiBzdHJpbmc7ICAgICAvLyBISDptbSAgKHVuZGVmaW5lZCB3aGVuIGFsbERheSlcbiAgZW5kRGF0ZTogc3RyaW5nOyAgICAgICAgLy8gWVlZWS1NTS1ERFxuICBlbmRUaW1lPzogc3RyaW5nOyAgICAgICAvLyBISDptbSAgKHVuZGVmaW5lZCB3aGVuIGFsbERheSlcbiAgcmVjdXJyZW5jZT86IHN0cmluZzsgICAgLy8gUlJVTEUgc3RyaW5nXG4gIGNhbGVuZGFySWQ/OiBzdHJpbmc7ICAgIC8vIGxpbmtzIHRvIGEgQ2hyb25pY2xlQ2FsZW5kYXJcbiAgYWxlcnQ6IEFsZXJ0T2Zmc2V0O1xuICBub3Rlcz86IHN0cmluZzsgICAgICAgICAvLyBib2R5IGNvbnRlbnQgb2YgdGhlIG5vdGVcblxuICAvLyAtLS0gQ29ubmVjdGlvbnMgLS0tXG4gIGxpbmtlZFRhc2tJZHM6IHN0cmluZ1tdOyAgIC8vIENocm9uaWNsZSB0YXNrIElEc1xuXG4gIC8vIC0tLSBNZXRhIC0tLVxuICBjcmVhdGVkQXQ6IHN0cmluZztcbiAgY29tcGxldGVkSW5zdGFuY2VzOiBzdHJpbmdbXTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFBsdWdpbiBzZXR0aW5ncyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVTZXR0aW5ncyB7XG4gIC8vIEZvbGRlciBwYXRoc1xuICB0YXNrc0ZvbGRlcjogc3RyaW5nO1xuICBldmVudHNGb2xkZXI6IHN0cmluZztcblxuICAvLyBDYWxlbmRhcnMgKHN0b3JlZCBpbiBzZXR0aW5ncywgbm90IGFzIGZpbGVzKVxuICBjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW107XG4gIGRlZmF1bHRDYWxlbmRhcklkOiBzdHJpbmc7XG5cbiAgLy8gRGVmYXVsdHNcbiAgZGVmYXVsdFRhc2tTdGF0dXM6IFRhc2tTdGF0dXM7XG4gIGRlZmF1bHRUYXNrUHJpb3JpdHk6IFRhc2tQcmlvcml0eTtcbiAgZGVmYXVsdEFsZXJ0OiBBbGVydE9mZnNldDtcblxuICAvLyBEaXNwbGF5XG4gIHN0YXJ0T2ZXZWVrOiAwIHwgMSB8IDY7ICAvLyAwPVN1biwgMT1Nb24sIDY9U2F0XG4gIHRpbWVGb3JtYXQ6IFwiMTJoXCIgfCBcIjI0aFwiO1xuICBkZWZhdWx0Q2FsZW5kYXJWaWV3OiBcImRheVwiIHwgXCJ3ZWVrXCIgfCBcIm1vbnRoXCIgfCBcInllYXJcIjtcblxuICAvLyBTbWFydCBsaXN0cyB2aXNpYmlsaXR5XG4gIHNob3dUb2RheUNvdW50OiBib29sZWFuO1xuICBzaG93U2NoZWR1bGVkQ291bnQ6IGJvb2xlYW47XG4gIHNob3dGbGFnZ2VkQ291bnQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBDaHJvbmljbGVTZXR0aW5ncyA9IHtcbiAgdGFza3NGb2xkZXI6IFwiQ2hyb25pY2xlL1Rhc2tzXCIsXG4gIGV2ZW50c0ZvbGRlcjogXCJDaHJvbmljbGUvRXZlbnRzXCIsXG4gIGNhbGVuZGFyczogW1xuICAgIHsgaWQ6IFwicGVyc29uYWxcIiwgbmFtZTogXCJQZXJzb25hbFwiLCBjb2xvcjogXCJibHVlXCIsICAgaXNWaXNpYmxlOiB0cnVlLCBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9LFxuICAgIHsgaWQ6IFwid29ya1wiLCAgICAgbmFtZTogXCJXb3JrXCIsICAgICBjb2xvcjogXCJncmVlblwiLCAgaXNWaXNpYmxlOiB0cnVlLCBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9LFxuICBdLFxuICBkZWZhdWx0Q2FsZW5kYXJJZDogXCJwZXJzb25hbFwiLFxuICBkZWZhdWx0VGFza1N0YXR1czogXCJ0b2RvXCIsXG4gIGRlZmF1bHRUYXNrUHJpb3JpdHk6IFwibm9uZVwiLFxuICBkZWZhdWx0QWxlcnQ6IFwibm9uZVwiLFxuICBzdGFydE9mV2VlazogMCxcbiAgdGltZUZvcm1hdDogXCIxMmhcIixcbiAgZGVmYXVsdENhbGVuZGFyVmlldzogXCJ3ZWVrXCIsXG4gIHNob3dUb2RheUNvdW50OiB0cnVlLFxuICBzaG93U2NoZWR1bGVkQ291bnQ6IHRydWUsXG4gIHNob3dGbGFnZ2VkQ291bnQ6IHRydWUsXG59OyIsICJpbXBvcnQgeyBDaHJvbmljbGVDYWxlbmRhciwgQ2FsZW5kYXJDb2xvciB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgQ2FsZW5kYXJNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW107XG4gIHByaXZhdGUgb25VcGRhdGU6ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoY2FsZW5kYXJzOiBDaHJvbmljbGVDYWxlbmRhcltdLCBvblVwZGF0ZTogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuY2FsZW5kYXJzID0gY2FsZW5kYXJzO1xuICAgIHRoaXMub25VcGRhdGUgPSBvblVwZGF0ZTtcbiAgfVxuXG4gIGdldEFsbCgpOiBDaHJvbmljbGVDYWxlbmRhcltdIHtcbiAgICByZXR1cm4gWy4uLnRoaXMuY2FsZW5kYXJzXTtcbiAgfVxuXG4gIGdldEJ5SWQoaWQ6IHN0cmluZyk6IENocm9uaWNsZUNhbGVuZGFyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jYWxlbmRhcnMuZmluZCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICB9XG5cbiAgY3JlYXRlKG5hbWU6IHN0cmluZywgY29sb3I6IENhbGVuZGFyQ29sb3IpOiBDaHJvbmljbGVDYWxlbmRhciB7XG4gICAgY29uc3QgY2FsZW5kYXI6IENocm9uaWNsZUNhbGVuZGFyID0ge1xuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZChuYW1lKSxcbiAgICAgIG5hbWUsXG4gICAgICBjb2xvcixcbiAgICAgIGlzVmlzaWJsZTogdHJ1ZSxcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG4gICAgdGhpcy5jYWxlbmRhcnMucHVzaChjYWxlbmRhcik7XG4gICAgdGhpcy5vblVwZGF0ZSgpO1xuICAgIHJldHVybiBjYWxlbmRhcjtcbiAgfVxuXG4gIHVwZGF0ZShpZDogc3RyaW5nLCBjaGFuZ2VzOiBQYXJ0aWFsPENocm9uaWNsZUNhbGVuZGFyPik6IHZvaWQge1xuICAgIGNvbnN0IGlkeCA9IHRoaXMuY2FsZW5kYXJzLmZpbmRJbmRleCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICAgIGlmIChpZHggPT09IC0xKSByZXR1cm47XG4gICAgdGhpcy5jYWxlbmRhcnNbaWR4XSA9IHsgLi4udGhpcy5jYWxlbmRhcnNbaWR4XSwgLi4uY2hhbmdlcyB9O1xuICAgIHRoaXMub25VcGRhdGUoKTtcbiAgfVxuXG4gIGRlbGV0ZShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5jYWxlbmRhcnMgPSB0aGlzLmNhbGVuZGFycy5maWx0ZXIoKGMpID0+IGMuaWQgIT09IGlkKTtcbiAgICB0aGlzLm9uVXBkYXRlKCk7XG4gIH1cblxuICB0b2dnbGVWaXNpYmlsaXR5KGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFycy5maW5kKChjKSA9PiBjLmlkID09PSBpZCk7XG4gICAgaWYgKGNhbCkge1xuICAgICAgY2FsLmlzVmlzaWJsZSA9ICFjYWwuaXNWaXNpYmxlO1xuICAgICAgdGhpcy5vblVwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldHVybnMgQ1NTIGhleCBjb2xvciBmb3IgYSBDYWxlbmRhckNvbG9yIG5hbWVcbiAgc3RhdGljIGNvbG9yVG9IZXgoY29sb3I6IENhbGVuZGFyQ29sb3IpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1hcDogUmVjb3JkPENhbGVuZGFyQ29sb3IsIHN0cmluZz4gPSB7XG4gICAgICBibHVlOiAgIFwiIzM3OEFERFwiLFxuICAgICAgZ3JlZW46ICBcIiMzNEM3NTlcIixcbiAgICAgIHB1cnBsZTogXCIjQUY1MkRFXCIsXG4gICAgICBvcmFuZ2U6IFwiI0ZGOTUwMFwiLFxuICAgICAgcmVkOiAgICBcIiNGRjNCMzBcIixcbiAgICAgIHRlYWw6ICAgXCIjMzBCMEM3XCIsXG4gICAgICBwaW5rOiAgIFwiI0ZGMkQ1NVwiLFxuICAgICAgeWVsbG93OiBcIiNGRkQ2MEFcIixcbiAgICAgIGdyYXk6ICAgXCIjOEU4RTkzXCIsXG4gICAgfTtcbiAgICByZXR1cm4gbWFwW2NvbG9yXTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVJZChuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJhc2UgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCBcIi1cIikucmVwbGFjZSgvW15hLXowLTktXS9nLCBcIlwiKTtcbiAgICBjb25zdCBzdWZmaXggPSBEYXRlLm5vdygpLnRvU3RyaW5nKDM2KTtcbiAgICByZXR1cm4gYCR7YmFzZX0tJHtzdWZmaXh9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIFRGaWxlLCBub3JtYWxpemVQYXRoIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVUYXNrLCBUYXNrU3RhdHVzLCBUYXNrUHJpb3JpdHkgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIFRhc2tNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCwgcHJpdmF0ZSB0YXNrc0ZvbGRlcjogc3RyaW5nKSB7fVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBSZWFkIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIGFzeW5jIGdldEFsbCgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgdGFza3M6IENocm9uaWNsZVRhc2tbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSAmJiBjaGlsZC5leHRlbnNpb24gPT09IFwibWRcIikge1xuICAgICAgICBjb25zdCB0YXNrID0gYXdhaXQgdGhpcy5maWxlVG9UYXNrKGNoaWxkKTtcbiAgICAgICAgaWYgKHRhc2spIHRhc2tzLnB1c2godGFzayk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXNrcztcbiAgfVxuXG4gIGFzeW5jIGdldEJ5SWQoaWQ6IHN0cmluZyk6IFByb21pc2U8Q2hyb25pY2xlVGFzayB8IG51bGw+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmluZCgodCkgPT4gdC5pZCA9PT0gaWQpID8/IG51bGw7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgV3JpdGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgY3JlYXRlKHRhc2s6IE9taXQ8Q2hyb25pY2xlVGFzaywgXCJpZFwiIHwgXCJjcmVhdGVkQXRcIj4pOiBQcm9taXNlPENocm9uaWNsZVRhc2s+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcigpO1xuXG4gICAgY29uc3QgZnVsbDogQ2hyb25pY2xlVGFzayA9IHtcbiAgICAgIC4uLnRhc2ssXG4gICAgICBpZDogdGhpcy5nZW5lcmF0ZUlkKCksXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgY29uc3QgcGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy50YXNrc0ZvbGRlcn0vJHtmdWxsLnRpdGxlfS5tZGApO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCB0aGlzLnRhc2tUb01hcmtkb3duKGZ1bGwpKTtcbiAgICByZXR1cm4gZnVsbDtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZSh0YXNrOiBDaHJvbmljbGVUYXNrKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JUYXNrKHRhc2suaWQpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuXG4gICAgLy8gSWYgdGl0bGUgY2hhbmdlZCwgcmVuYW1lIHRoZSBmaWxlXG4gICAgY29uc3QgZXhwZWN0ZWRQYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLnRhc2tzRm9sZGVyfS8ke3Rhc2sudGl0bGV9Lm1kYCk7XG4gICAgaWYgKGZpbGUucGF0aCAhPT0gZXhwZWN0ZWRQYXRoKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIGV4cGVjdGVkUGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKGV4cGVjdGVkUGF0aCkgPz8gZmlsZTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkodXBkYXRlZEZpbGUsIHRoaXMudGFza1RvTWFya2Rvd24odGFzaykpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvclRhc2soaWQpO1xuICAgIGlmIChmaWxlKSBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBtYXJrQ29tcGxldGUoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRhc2sgPSBhd2FpdCB0aGlzLmdldEJ5SWQoaWQpO1xuICAgIGlmICghdGFzaykgcmV0dXJuO1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHtcbiAgICAgIC4uLnRhc2ssXG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgY29tcGxldGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBGaWx0ZXJzICh1c2VkIGJ5IHNtYXJ0IGxpc3RzKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBnZXREdWVUb2RheSgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IHRvZGF5ID0gdGhpcy50b2RheVN0cigpO1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoXG4gICAgICAodCkgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiICYmIHQuc3RhdHVzICE9PSBcImNhbmNlbGxlZFwiICYmIHQuZHVlRGF0ZSA9PT0gdG9kYXlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgZ2V0T3ZlcmR1ZSgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IHRvZGF5ID0gdGhpcy50b2RheVN0cigpO1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoXG4gICAgICAodCkgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiICYmIHQuc3RhdHVzICE9PSBcImNhbmNlbGxlZFwiICYmICEhdC5kdWVEYXRlICYmIHQuZHVlRGF0ZSA8IHRvZGF5XG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldFNjaGVkdWxlZCgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoXG4gICAgICAodCkgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiICYmIHQuc3RhdHVzICE9PSBcImNhbmNlbGxlZFwiICYmICEhdC5kdWVEYXRlXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldEZsYWdnZWQoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKCh0KSA9PiB0LnByaW9yaXR5ID09PSBcImhpZ2hcIiAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNlcmlhbGlzYXRpb24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSB0YXNrVG9NYXJrZG93bih0YXNrOiBDaHJvbmljbGVUYXNrKTogc3RyaW5nIHtcbiAgICBjb25zdCBmbTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICBpZDogICAgICAgICAgICAgICAgIHRhc2suaWQsXG4gICAgICB0aXRsZTogICAgICAgICAgICAgIHRhc2sudGl0bGUsXG4gICAgICBzdGF0dXM6ICAgICAgICAgICAgIHRhc2suc3RhdHVzLFxuICAgICAgcHJpb3JpdHk6ICAgICAgICAgICB0YXNrLnByaW9yaXR5LFxuICAgICAgdGFnczogICAgICAgICAgICAgICB0YXNrLnRhZ3MsXG4gICAgICBjb250ZXh0czogICAgICAgICAgIHRhc2suY29udGV4dHMsXG4gICAgICBwcm9qZWN0czogICAgICAgICAgIHRhc2sucHJvamVjdHMsXG4gICAgICBcImxpbmtlZC1ub3Rlc1wiOiAgICAgdGFzay5saW5rZWROb3RlcyxcbiAgICAgIFwiY2FsZW5kYXItaWRcIjogICAgICB0YXNrLmNhbGVuZGFySWQgPz8gbnVsbCxcbiAgICAgIFwiZHVlLWRhdGVcIjogICAgICAgICB0YXNrLmR1ZURhdGUgPz8gbnVsbCxcbiAgICAgIFwiZHVlLXRpbWVcIjogICAgICAgICB0YXNrLmR1ZVRpbWUgPz8gbnVsbCxcbiAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgdGFzay5yZWN1cnJlbmNlID8/IG51bGwsXG4gICAgICBcInRpbWUtZXN0aW1hdGVcIjogICAgdGFzay50aW1lRXN0aW1hdGUgPz8gbnVsbCxcbiAgICAgIFwidGltZS1lbnRyaWVzXCI6ICAgICB0YXNrLnRpbWVFbnRyaWVzLFxuICAgICAgXCJjdXN0b20tZmllbGRzXCI6ICAgIHRhc2suY3VzdG9tRmllbGRzLFxuICAgICAgXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCI6IHRhc2suY29tcGxldGVkSW5zdGFuY2VzLFxuICAgICAgXCJjcmVhdGVkLWF0XCI6ICAgICAgIHRhc2suY3JlYXRlZEF0LFxuICAgICAgXCJjb21wbGV0ZWQtYXRcIjogICAgIHRhc2suY29tcGxldGVkQXQgPz8gbnVsbCxcbiAgICB9O1xuXG4gICAgY29uc3QgeWFtbCA9IE9iamVjdC5lbnRyaWVzKGZtKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHtKU09OLnN0cmluZ2lmeSh2KX1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCBib2R5ID0gdGFzay5ub3RlcyA/IGBcXG4ke3Rhc2subm90ZXN9YCA6IFwiXCI7XG4gICAgcmV0dXJuIGAtLS1cXG4ke3lhbWx9XFxuLS0tXFxuJHtib2R5fWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGZpbGVUb1Rhc2soZmlsZTogVEZpbGUpOiBQcm9taXNlPENocm9uaWNsZVRhc2sgfCBudWxsPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgICBjb25zdCBmbSA9IGNhY2hlPy5mcm9udG1hdHRlcjtcbiAgICAgIGlmICghZm0/LmlkIHx8ICFmbT8udGl0bGUpIHJldHVybiBudWxsO1xuXG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICAgIGNvbnN0IGJvZHlNYXRjaCA9IGNvbnRlbnQubWF0Y2goL14tLS1cXG5bXFxzXFxTXSo/XFxuLS0tXFxuKFtcXHNcXFNdKikkLyk7XG4gICAgICBjb25zdCBub3RlcyA9IGJvZHlNYXRjaD8uWzFdPy50cmltKCkgfHwgdW5kZWZpbmVkO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZDogICAgICAgICAgICAgICAgIGZtLmlkLFxuICAgICAgICB0aXRsZTogICAgICAgICAgICAgIGZtLnRpdGxlLFxuICAgICAgICBzdGF0dXM6ICAgICAgICAgICAgIChmbS5zdGF0dXMgYXMgVGFza1N0YXR1cykgPz8gXCJ0b2RvXCIsXG4gICAgICAgIHByaW9yaXR5OiAgICAgICAgICAgKGZtLnByaW9yaXR5IGFzIFRhc2tQcmlvcml0eSkgPz8gXCJub25lXCIsXG4gICAgICAgIGR1ZURhdGU6ICAgICAgICAgICAgZm1bXCJkdWUtZGF0ZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGR1ZVRpbWU6ICAgICAgICAgICAgZm1bXCJkdWUtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgZm0ucmVjdXJyZW5jZSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGNhbGVuZGFySWQ6ICAgICAgICAgZm1bXCJjYWxlbmRhci1pZFwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgZm0udGFncyA/PyBbXSxcbiAgICAgICAgY29udGV4dHM6ICAgICAgICAgICBmbS5jb250ZXh0cyA/PyBbXSxcbiAgICAgICAgbGlua2VkTm90ZXM6ICAgICAgICBmbVtcImxpbmtlZC1ub3Rlc1wiXSA/PyBbXSxcbiAgICAgICAgcHJvamVjdHM6ICAgICAgICAgICBmbS5wcm9qZWN0cyA/PyBbXSxcbiAgICAgICAgdGltZUVzdGltYXRlOiAgICAgICBmbVtcInRpbWUtZXN0aW1hdGVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICB0aW1lRW50cmllczogICAgICAgIGZtW1widGltZS1lbnRyaWVzXCJdID8/IFtdLFxuICAgICAgICBjdXN0b21GaWVsZHM6ICAgICAgIGZtW1wiY3VzdG9tLWZpZWxkc1wiXSA/PyBbXSxcbiAgICAgICAgY29tcGxldGVkSW5zdGFuY2VzOiBmbVtcImNvbXBsZXRlZC1pbnN0YW5jZXNcIl0gPz8gW10sXG4gICAgICAgIGNyZWF0ZWRBdDogICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgY29tcGxldGVkQXQ6ICAgICAgICBmbVtcImNvbXBsZXRlZC1hdFwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIG5vdGVzLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgZmluZEZpbGVGb3JUYXNrKGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIG51bGw7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmICghKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoY2hpbGQpO1xuICAgICAgaWYgKGNhY2hlPy5mcm9udG1hdHRlcj8uaWQgPT09IGlkKSByZXR1cm4gY2hpbGQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy50YXNrc0ZvbGRlcikpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcih0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYHRhc2stJHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA2KX1gO1xuICB9XG5cbiAgcHJpdmF0ZSB0b2RheVN0cigpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgVEZpbGUsIG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZUV2ZW50LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCwgcHJpdmF0ZSBldmVudHNGb2xkZXI6IHN0cmluZykge31cblxuICBhc3luYyBnZXRBbGwoKTogUHJvbWlzZTxDaHJvbmljbGVFdmVudFtdPiB7XG4gICAgY29uc3QgZm9sZGVyID0gdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMuZXZlbnRzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdID0gW107XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRGaWxlICYmIGNoaWxkLmV4dGVuc2lvbiA9PT0gXCJtZFwiKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50ID0gYXdhaXQgdGhpcy5maWxlVG9FdmVudChjaGlsZCk7XG4gICAgICAgIGlmIChldmVudCkgZXZlbnRzLnB1c2goZXZlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZXZlbnRzO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlKGV2ZW50OiBPbWl0PENocm9uaWNsZUV2ZW50LCBcImlkXCIgfCBcImNyZWF0ZWRBdFwiPik6IFByb21pc2U8Q2hyb25pY2xlRXZlbnQ+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcigpO1xuXG4gICAgY29uc3QgZnVsbDogQ2hyb25pY2xlRXZlbnQgPSB7XG4gICAgICAuLi5ldmVudCxcbiAgICAgIGlkOiB0aGlzLmdlbmVyYXRlSWQoKSxcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICBjb25zdCBwYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLmV2ZW50c0ZvbGRlcn0vJHtmdWxsLnRpdGxlfS5tZGApO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCB0aGlzLmV2ZW50VG9NYXJrZG93bihmdWxsKSk7XG4gICAgcmV0dXJuIGZ1bGw7XG4gIH1cblxuICBhc3luYyB1cGRhdGUoZXZlbnQ6IENocm9uaWNsZUV2ZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JFdmVudChldmVudC5pZCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG5cbiAgICBjb25zdCBleHBlY3RlZFBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMuZXZlbnRzRm9sZGVyfS8ke2V2ZW50LnRpdGxlfS5tZGApO1xuICAgIGlmIChmaWxlLnBhdGggIT09IGV4cGVjdGVkUGF0aCkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAuZmlsZU1hbmFnZXIucmVuYW1lRmlsZShmaWxlLCBleHBlY3RlZFBhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZUJ5UGF0aChleHBlY3RlZFBhdGgpID8/IGZpbGU7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KHVwZGF0ZWRGaWxlLCB0aGlzLmV2ZW50VG9NYXJrZG93bihldmVudCkpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvckV2ZW50KGlkKTtcbiAgICBpZiAoZmlsZSkgYXdhaXQgdGhpcy5hcHAudmF1bHQuZGVsZXRlKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgZ2V0SW5SYW5nZShzdGFydERhdGU6IHN0cmluZywgZW5kRGF0ZTogc3RyaW5nKTogUHJvbWlzZTxDaHJvbmljbGVFdmVudFtdPiB7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcigoZSkgPT4gZS5zdGFydERhdGUgPj0gc3RhcnREYXRlICYmIGUuc3RhcnREYXRlIDw9IGVuZERhdGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBldmVudFRvTWFya2Rvd24oZXZlbnQ6IENocm9uaWNsZUV2ZW50KTogc3RyaW5nIHtcbiAgICBjb25zdCBmbTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICBpZDogICAgICAgICAgICAgICAgICAgZXZlbnQuaWQsXG4gICAgICB0aXRsZTogICAgICAgICAgICAgICAgZXZlbnQudGl0bGUsXG4gICAgICBsb2NhdGlvbjogICAgICAgICAgICAgZXZlbnQubG9jYXRpb24gPz8gbnVsbCxcbiAgICAgIFwiYWxsLWRheVwiOiAgICAgICAgICAgIGV2ZW50LmFsbERheSxcbiAgICAgIFwic3RhcnQtZGF0ZVwiOiAgICAgICAgIGV2ZW50LnN0YXJ0RGF0ZSxcbiAgICAgIFwic3RhcnQtdGltZVwiOiAgICAgICAgIGV2ZW50LnN0YXJ0VGltZSA/PyBudWxsLFxuICAgICAgXCJlbmQtZGF0ZVwiOiAgICAgICAgICAgZXZlbnQuZW5kRGF0ZSxcbiAgICAgIFwiZW5kLXRpbWVcIjogICAgICAgICAgIGV2ZW50LmVuZFRpbWUgPz8gbnVsbCxcbiAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICBldmVudC5yZWN1cnJlbmNlID8/IG51bGwsXG4gICAgICBcImNhbGVuZGFyLWlkXCI6ICAgICAgICBldmVudC5jYWxlbmRhcklkID8/IG51bGwsXG4gICAgICBhbGVydDogICAgICAgICAgICAgICAgZXZlbnQuYWxlcnQsXG4gICAgICBcImxpbmtlZC10YXNrLWlkc1wiOiAgICBldmVudC5saW5rZWRUYXNrSWRzLFxuICAgICAgXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCI6IGV2ZW50LmNvbXBsZXRlZEluc3RhbmNlcyxcbiAgICAgIFwiY3JlYXRlZC1hdFwiOiAgICAgICAgIGV2ZW50LmNyZWF0ZWRBdCxcbiAgICB9O1xuXG4gICAgY29uc3QgeWFtbCA9IE9iamVjdC5lbnRyaWVzKGZtKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHtKU09OLnN0cmluZ2lmeSh2KX1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCBib2R5ID0gZXZlbnQubm90ZXMgPyBgXFxuJHtldmVudC5ub3Rlc31gIDogXCJcIjtcbiAgICByZXR1cm4gYC0tLVxcbiR7eWFtbH1cXG4tLS1cXG4ke2JvZHl9YDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmlsZVRvRXZlbnQoZmlsZTogVEZpbGUpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50IHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgICAgY29uc3QgZm0gPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG4gICAgICBpZiAoIWZtPy5pZCB8fCAhZm0/LnRpdGxlKSByZXR1cm4gbnVsbDtcblxuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBjb25zdCBib2R5TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eLS0tXFxuW1xcc1xcU10qP1xcbi0tLVxcbihbXFxzXFxTXSopJC8pO1xuICAgICAgY29uc3Qgbm90ZXMgPSBib2R5TWF0Y2g/LlsxXT8udHJpbSgpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6ICAgICAgICAgICAgICAgICAgIGZtLmlkLFxuICAgICAgICB0aXRsZTogICAgICAgICAgICAgICAgZm0udGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICAgICAgICAgICBmbS5sb2NhdGlvbiA/PyB1bmRlZmluZWQsXG4gICAgICAgIGFsbERheTogICAgICAgICAgICAgICBmbVtcImFsbC1kYXlcIl0gPz8gdHJ1ZSxcbiAgICAgICAgc3RhcnREYXRlOiAgICAgICAgICAgIGZtW1wic3RhcnQtZGF0ZVwiXSxcbiAgICAgICAgc3RhcnRUaW1lOiAgICAgICAgICAgIGZtW1wic3RhcnQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGVuZERhdGU6ICAgICAgICAgICAgICBmbVtcImVuZC1kYXRlXCJdLFxuICAgICAgICBlbmRUaW1lOiAgICAgICAgICAgICAgZm1bXCJlbmQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICBmbS5yZWN1cnJlbmNlID8/IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsZW5kYXJJZDogICAgICAgICAgIGZtW1wiY2FsZW5kYXItaWRcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBhbGVydDogICAgICAgICAgICAgICAgKGZtLmFsZXJ0IGFzIEFsZXJ0T2Zmc2V0KSA/PyBcIm5vbmVcIixcbiAgICAgICAgbGlua2VkVGFza0lkczogICAgICAgIGZtW1wibGlua2VkLXRhc2staWRzXCJdID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6ICAgZm1bXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCJdID8/IFtdLFxuICAgICAgICBjcmVhdGVkQXQ6ICAgICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgbm90ZXMsXG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5kRmlsZUZvckV2ZW50KGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLmV2ZW50c0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBudWxsO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoIShjaGlsZCBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGNoaWxkKTtcbiAgICAgIGlmIChjYWNoZT8uZnJvbnRtYXR0ZXI/LmlkID09PSBpZCkgcmV0dXJuIGNoaWxkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMuZXZlbnRzRm9sZGVyKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKHRoaXMuZXZlbnRzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGV2ZW50LSR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNil9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlVGFzayB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgVGFza01hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9UYXNrTWFuYWdlclwiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBUYXNrRm9ybVZpZXcsIFRBU0tfRk9STV9WSUVXX1RZUEUgfSBmcm9tIFwiLi9UYXNrRm9ybVZpZXdcIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0V2ZW50TWFuYWdlclwiO1xuXG5leHBvcnQgY29uc3QgVEFTS19WSUVXX1RZUEUgPSBcImNocm9uaWNsZS10YXNrLXZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIFRhc2tWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcjtcbiAgcHJpdmF0ZSBjdXJyZW50TGlzdElkOiBzdHJpbmcgPSBcInRvZGF5XCI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbGVhZjogV29ya3NwYWNlTGVhZixcbiAgICB0YXNrTWFuYWdlcjogVGFza01hbmFnZXIsXG4gICAgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXIsXG4gICAgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXJcbiAgKSB7XG4gICAgc3VwZXIobGVhZik7XG4gICAgdGhpcy50YXNrTWFuYWdlciA9IHRhc2tNYW5hZ2VyO1xuICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyID0gY2FsZW5kYXJNYW5hZ2VyO1xuICAgIHRoaXMuZXZlbnRNYW5hZ2VyID0gZXZlbnRNYW5hZ2VyO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHsgcmV0dXJuIFRBU0tfVklFV19UWVBFOyB9XG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7IHJldHVybiBcIkNocm9uaWNsZVwiOyB9XG4gIGdldEljb24oKTogc3RyaW5nIHsgcmV0dXJuIFwiY2hlY2stY2lyY2xlXCI7IH1cblxuYXN5bmMgb25PcGVuKCkge1xuICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG5cbiAgICAvLyBBdXRvLXJlZnJlc2ggd2hlbmV2ZXIgYW55IGZpbGUgaW4gdGhlIHZhdWx0IGNoYW5nZXNcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKSkge1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwiY3JlYXRlXCIsIChmaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLnRhc2tNYW5hZ2VyW1widGFza3NGb2xkZXJcIl0pKSB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnJlbmRlcigpLCAyMDApO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC52YXVsdC5vbihcImRlbGV0ZVwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKSkge1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHJlbmRlcigpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuICAgIGNvbnRhaW5lci5hZGRDbGFzcyhcImNocm9uaWNsZS1hcHBcIik7XG5cbiAgICBjb25zdCBhbGwgICAgICAgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEFsbCgpO1xuICAgIGNvbnN0IHRvZGF5ICAgICA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0RHVlVG9kYXkoKTtcbiAgICBjb25zdCBzY2hlZHVsZWQgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldFNjaGVkdWxlZCgpO1xuICAgIGNvbnN0IGZsYWdnZWQgICA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0RmxhZ2dlZCgpO1xuICAgIGNvbnN0IG92ZXJkdWUgICA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0T3ZlcmR1ZSgpO1xuICAgIGNvbnN0IGNhbGVuZGFycyA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgY29uc3QgbGF5b3V0ICA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGF5b3V0XCIpO1xuICAgIGNvbnN0IHNpZGViYXIgPSBsYXlvdXQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXNpZGViYXJcIik7XG4gICAgY29uc3QgbWFpbiAgICA9IGxheW91dC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWFpblwiKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBOZXcgdGFzayBidXR0b24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgbmV3VGFza0J0biA9IHNpZGViYXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImNocm9uaWNsZS1uZXctdGFzay1idG5cIiwgdGV4dDogXCJOZXcgdGFza1wiXG4gICAgfSk7XG4gICAgbmV3VGFza0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5vcGVuVGFza0Zvcm0oKSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgU21hcnQgbGlzdCB0aWxlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB0aWxlc0dyaWQgPSBzaWRlYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlc1wiKTtcblxuICAgIGNvbnN0IHRpbGVzID0gW1xuICAgICAgeyBpZDogXCJ0b2RheVwiLCAgICAgbGFiZWw6IFwiVG9kYXlcIiwgICAgIGNvdW50OiB0b2RheS5sZW5ndGggKyBvdmVyZHVlLmxlbmd0aCwgY29sb3I6IFwiI0ZGM0IzMFwiLCBiYWRnZTogb3ZlcmR1ZS5sZW5ndGggfSxcbiAgICAgIHsgaWQ6IFwic2NoZWR1bGVkXCIsIGxhYmVsOiBcIlNjaGVkdWxlZFwiLCBjb3VudDogc2NoZWR1bGVkLmxlbmd0aCwgICAgICAgICAgICAgIGNvbG9yOiBcIiMzNzhBRERcIiwgYmFkZ2U6IDAgfSxcbiAgICAgIHsgaWQ6IFwiYWxsXCIsICAgICAgIGxhYmVsOiBcIkFsbFwiLCAgICAgICBjb3VudDogYWxsLmZpbHRlcih0ID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIikubGVuZ3RoLCBjb2xvcjogXCIjNjM2MzY2XCIsIGJhZGdlOiAwIH0sXG4gICAgICB7IGlkOiBcImZsYWdnZWRcIiwgICBsYWJlbDogXCJGbGFnZ2VkXCIsICAgY291bnQ6IGZsYWdnZWQubGVuZ3RoLCAgICAgICAgICAgICAgICBjb2xvcjogXCIjRkY5NTAwXCIsIGJhZGdlOiAwIH0sXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgdGlsZSBvZiB0aWxlcykge1xuICAgICAgY29uc3QgdCA9IHRpbGVzR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGlsZVwiKTtcbiAgICAgIHQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGlsZS5jb2xvcjtcbiAgICAgIGlmICh0aWxlLmlkID09PSB0aGlzLmN1cnJlbnRMaXN0SWQpIHQuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG5cbiAgICAgIGNvbnN0IHRvcFJvdyA9IHQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtdG9wXCIpO1xuICAgICAgdG9wUm93LmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlLWNvdW50XCIpLnNldFRleHQoU3RyaW5nKHRpbGUuY291bnQpKTtcblxuICAgICAgaWYgKHRpbGUuYmFkZ2UgPiAwKSB7XG4gICAgICAgIGNvbnN0IGJhZGdlID0gdG9wUm93LmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlLWJhZGdlXCIpO1xuICAgICAgICBiYWRnZS5zZXRUZXh0KFN0cmluZyh0aWxlLmJhZGdlKSk7XG4gICAgICAgIGJhZGdlLnRpdGxlID0gYCR7dGlsZS5iYWRnZX0gb3ZlcmR1ZWA7XG4gICAgICB9XG5cbiAgICAgIHQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtbGFiZWxcIikuc2V0VGV4dCh0aWxlLmxhYmVsKTtcbiAgICAgIHQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50TGlzdElkID0gdGlsZS5pZDsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE15IExpc3RzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGxpc3RzU2VjdGlvbiA9IHNpZGViYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3RzLXNlY3Rpb25cIik7XG4gICAgbGlzdHNTZWN0aW9uLmNyZWF0ZURpdihcImNocm9uaWNsZS1zZWN0aW9uLWxhYmVsXCIpLnNldFRleHQoXCJNeSBMaXN0c1wiKTtcblxuICAgIGZvciAoY29uc3QgY2FsIG9mIGNhbGVuZGFycykge1xuICAgICAgY29uc3Qgcm93ID0gbGlzdHNTZWN0aW9uLmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LXJvd1wiKTtcbiAgICAgIGlmIChjYWwuaWQgPT09IHRoaXMuY3VycmVudExpc3RJZCkgcm93LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuXG4gICAgICBjb25zdCBkb3QgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3QtZG90XCIpO1xuICAgICAgZG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcik7XG5cbiAgICAgIHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1uYW1lXCIpLnNldFRleHQoY2FsLm5hbWUpO1xuXG4gICAgICBjb25zdCBjYWxDb3VudCA9IGFsbC5maWx0ZXIodCA9PiB0LmNhbGVuZGFySWQgPT09IGNhbC5pZCAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpLmxlbmd0aDtcbiAgICAgIGlmIChjYWxDb3VudCA+IDApIHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1jb3VudFwiKS5zZXRUZXh0KFN0cmluZyhjYWxDb3VudCkpO1xuXG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50TGlzdElkID0gY2FsLmlkOyB0aGlzLnJlbmRlcigpOyB9KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTWFpbiBwYW5lbCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBhd2FpdCB0aGlzLnJlbmRlck1haW5QYW5lbChtYWluLCBhbGwsIG92ZXJkdWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZW5kZXJNYWluUGFuZWwoXG4gICAgbWFpbjogSFRNTEVsZW1lbnQsXG4gICAgYWxsOiBDaHJvbmljbGVUYXNrW10sXG4gICAgb3ZlcmR1ZTogQ2hyb25pY2xlVGFza1tdXG4gICkge1xuICAgIGNvbnN0IGhlYWRlciAgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluLWhlYWRlclwiKTtcbiAgICBjb25zdCB0aXRsZUVsID0gaGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluLXRpdGxlXCIpO1xuXG4gICAgbGV0IHRhc2tzOiBDaHJvbmljbGVUYXNrW10gPSBbXTtcblxuICAgIGNvbnN0IHNtYXJ0Q29sb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgdG9kYXk6IFwiI0ZGM0IzMFwiLCBzY2hlZHVsZWQ6IFwiIzM3OEFERFwiLCBhbGw6IFwiIzYzNjM2NlwiLCBmbGFnZ2VkOiBcIiNGRjk1MDBcIlxuICAgIH07XG5cbiAgICBpZiAoc21hcnRDb2xvcnNbdGhpcy5jdXJyZW50TGlzdElkXSkge1xuICAgICAgY29uc3QgbGFiZWxzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgICB0b2RheTogXCJUb2RheVwiLCBzY2hlZHVsZWQ6IFwiU2NoZWR1bGVkXCIsIGFsbDogXCJBbGxcIiwgZmxhZ2dlZDogXCJGbGFnZ2VkXCJcbiAgICAgIH07XG4gICAgICB0aXRsZUVsLnNldFRleHQobGFiZWxzW3RoaXMuY3VycmVudExpc3RJZF0pO1xuICAgICAgdGl0bGVFbC5zdHlsZS5jb2xvciA9IHNtYXJ0Q29sb3JzW3RoaXMuY3VycmVudExpc3RJZF07XG5cbiAgICAgIHN3aXRjaCAodGhpcy5jdXJyZW50TGlzdElkKSB7XG4gICAgICAgIGNhc2UgXCJ0b2RheVwiOlxuICAgICAgICAgIHRhc2tzID0gWy4uLm92ZXJkdWUsIC4uLihhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldER1ZVRvZGF5KCkpXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInNjaGVkdWxlZFwiOlxuICAgICAgICAgIHRhc2tzID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRTY2hlZHVsZWQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImZsYWdnZWRcIjpcbiAgICAgICAgICB0YXNrcyA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0RmxhZ2dlZCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiYWxsXCI6XG4gICAgICAgICAgdGFza3MgPSBhbGwuZmlsdGVyKHQgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZCh0aGlzLmN1cnJlbnRMaXN0SWQpO1xuICAgICAgdGl0bGVFbC5zZXRUZXh0KGNhbD8ubmFtZSA/PyBcIkxpc3RcIik7XG4gICAgICB0aXRsZUVsLnN0eWxlLmNvbG9yID0gY2FsXG4gICAgICAgID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKVxuICAgICAgICA6IFwidmFyKC0tdGV4dC1ub3JtYWwpXCI7XG4gICAgICB0YXNrcyA9IGFsbC5maWx0ZXIoXG4gICAgICAgIHQgPT4gdC5jYWxlbmRhcklkID09PSB0aGlzLmN1cnJlbnRMaXN0SWQgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZVRhc2tzID0gdGFza3MuZmlsdGVyKHQgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgICBpZiAoYWN0aXZlVGFza3MubGVuZ3RoID4gMCkge1xuICAgICAgaGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluLXN1YnRpdGxlXCIpLnNldFRleHQoXG4gICAgICAgIGAke2FjdGl2ZVRhc2tzLmxlbmd0aH0gJHthY3RpdmVUYXNrcy5sZW5ndGggPT09IDEgPyBcInRhc2tcIiA6IFwidGFza3NcIn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGxpc3RFbCA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stbGlzdFwiKTtcblxuICAgIGlmICh0YXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMucmVuZGVyRW1wdHlTdGF0ZShsaXN0RWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBncm91cHMgPSB0aGlzLmdyb3VwVGFza3ModGFza3MpO1xuICAgICAgZm9yIChjb25zdCBbZ3JvdXAsIGdyb3VwVGFza3NdIG9mIE9iamVjdC5lbnRyaWVzKGdyb3VwcykpIHtcbiAgICAgICAgaWYgKGdyb3VwVGFza3MubGVuZ3RoID09PSAwKSBjb250aW51ZTtcbiAgICAgICAgbGlzdEVsLmNyZWF0ZURpdihcImNocm9uaWNsZS1ncm91cC1sYWJlbFwiKS5zZXRUZXh0KGdyb3VwKTtcbiAgICAgICAgY29uc3QgY2FyZCA9IGxpc3RFbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1jYXJkLWdyb3VwXCIpO1xuICAgICAgICBmb3IgKGNvbnN0IHRhc2sgb2YgZ3JvdXBUYXNrcykge1xuICAgICAgICAgIHRoaXMucmVuZGVyVGFza1JvdyhjYXJkLCB0YXNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyRW1wdHlTdGF0ZShjb250YWluZXI6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgZW1wdHkgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWVtcHR5LXN0YXRlXCIpO1xuICAgIGNvbnN0IGljb24gID0gZW1wdHkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWVtcHR5LWljb25cIik7XG4gICAgaWNvbi5pbm5lckhUTUwgPSBgPHN2ZyB3aWR0aD1cIjQ4XCIgaGVpZ2h0PVwiNDhcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIj48cGF0aCBkPVwiTTIyIDExLjA4VjEyYTEwIDEwIDAgMSAxLTUuOTMtOS4xNFwiLz48cG9seWxpbmUgcG9pbnRzPVwiMjIgNCAxMiAxNC4wMSA5IDExLjAxXCIvPjwvc3ZnPmA7XG4gICAgZW1wdHkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWVtcHR5LXRpdGxlXCIpLnNldFRleHQoXCJBbGwgZG9uZVwiKTtcbiAgICBlbXB0eS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZW1wdHktc3VidGl0bGVcIikuc2V0VGV4dChcIk5vdGhpbmcgbGVmdCBpbiB0aGlzIGxpc3QuXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJUYXNrUm93KGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHRhc2s6IENocm9uaWNsZVRhc2spIHtcbiAgICBjb25zdCByb3cgICAgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stcm93XCIpO1xuICAgIGNvbnN0IGlzRG9uZSA9IHRhc2suc3RhdHVzID09PSBcImRvbmVcIjtcblxuICAgIC8vIENoZWNrYm94XG4gICAgY29uc3QgY2hlY2tib3hXcmFwID0gcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1jaGVja2JveC13cmFwXCIpO1xuICAgIGNvbnN0IGNoZWNrYm94ICAgICA9IGNoZWNrYm94V3JhcC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2hlY2tib3hcIik7XG4gICAgaWYgKGlzRG9uZSkgY2hlY2tib3guYWRkQ2xhc3MoXCJkb25lXCIpO1xuICAgIGNoZWNrYm94LmlubmVySFRNTCA9IGA8c3ZnIGNsYXNzPVwiY2hyb25pY2xlLWNoZWNrbWFya1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiNmZmZcIiBzdHJva2Utd2lkdGg9XCIzXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+PHBvbHlsaW5lIHBvaW50cz1cIjIwIDYgOSAxNyA0IDEyXCIvPjwvc3ZnPmA7XG5cbiAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBjaGVja2JveC5hZGRDbGFzcyhcImNvbXBsZXRpbmdcIik7XG4gICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci51cGRhdGUoe1xuICAgICAgICAgIC4uLnRhc2ssXG4gICAgICAgICAgc3RhdHVzOiAgICAgIGlzRG9uZSA/IFwidG9kb1wiIDogXCJkb25lXCIsXG4gICAgICAgICAgY29tcGxldGVkQXQ6IGlzRG9uZSA/IHVuZGVmaW5lZCA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG4gICAgICB9LCAzMDApO1xuICAgIH0pO1xuXG4gICAgLy8gQ29udGVudCBcdTIwMTQgY2xpY2sgdG8gZWRpdFxuICAgIGNvbnN0IGNvbnRlbnQgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stY29udGVudFwiKTtcbiAgICBjb250ZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLm9wZW5UYXNrRm9ybSh0YXNrKSk7XG5cbiAgICBjb25zdCB0aXRsZUVsID0gY29udGVudC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay10aXRsZVwiKTtcbiAgICB0aXRsZUVsLnNldFRleHQodGFzay50aXRsZSk7XG4gICAgaWYgKGlzRG9uZSkgdGl0bGVFbC5hZGRDbGFzcyhcImRvbmVcIik7XG5cbiAgICAvLyBNZXRhXG4gICAgY29uc3QgdG9kYXlTdHIgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGlmICh0YXNrLmR1ZURhdGUgfHwgdGFzay5jYWxlbmRhcklkKSB7XG4gICAgICBjb25zdCBtZXRhID0gY29udGVudC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1tZXRhXCIpO1xuXG4gICAgICBpZiAodGFzay5kdWVEYXRlKSB7XG4gICAgICAgIGNvbnN0IG1ldGFEYXRlID0gbWV0YS5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXRhc2stZGF0ZVwiKTtcbiAgICAgICAgbWV0YURhdGUuc2V0VGV4dCh0aGlzLmZvcm1hdERhdGUodGFzay5kdWVEYXRlKSk7XG4gICAgICAgIGlmICh0YXNrLmR1ZURhdGUgPCB0b2RheVN0cikgbWV0YURhdGUuYWRkQ2xhc3MoXCJvdmVyZHVlXCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGFzay5jYWxlbmRhcklkKSB7XG4gICAgICAgIGNvbnN0IGNhbCA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQodGFzay5jYWxlbmRhcklkKTtcbiAgICAgICAgaWYgKGNhbCkge1xuICAgICAgICAgIGNvbnN0IGNhbERvdCA9IG1ldGEuY3JlYXRlU3BhbihcImNocm9uaWNsZS10YXNrLWNhbC1kb3RcIik7XG4gICAgICAgICAgY2FsRG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcik7XG4gICAgICAgICAgbWV0YS5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXRhc2stY2FsLW5hbWVcIikuc2V0VGV4dChjYWwubmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBQcmlvcml0eSBmbGFnXG4gICAgaWYgKHRhc2sucHJpb3JpdHkgPT09IFwiaGlnaFwiKSB7XG4gICAgICByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWZsYWdcIikuc2V0VGV4dChcIlx1MjY5MVwiKTtcbiAgICB9XG5cbiAgICAvLyBSaWdodC1jbGljayBjb250ZXh0IG1lbnVcbiAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBtZW51ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG1lbnUuY2xhc3NOYW1lID0gXCJjaHJvbmljbGUtY29udGV4dC1tZW51XCI7XG4gICAgICBtZW51LnN0eWxlLmxlZnQgPSBgJHtlLmNsaWVudFh9cHhgO1xuICAgICAgbWVudS5zdHlsZS50b3AgID0gYCR7ZS5jbGllbnRZfXB4YDtcblxuICAgICAgY29uc3QgZWRpdEl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW1cIik7XG4gICAgICBlZGl0SXRlbS5zZXRUZXh0KFwiRWRpdCB0YXNrXCIpO1xuICAgICAgZWRpdEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgbWVudS5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5vcGVuVGFza0Zvcm0odGFzayk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZGVsZXRlSXRlbSA9IG1lbnUuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbnRleHQtaXRlbSBjaHJvbmljbGUtY29udGV4dC1kZWxldGVcIik7XG4gICAgICBkZWxldGVJdGVtLnNldFRleHQoXCJEZWxldGUgdGFza1wiKTtcbiAgICAgIGRlbGV0ZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbWVudS5yZW1vdmUoKTtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5kZWxldGUodGFzay5pZCk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2FuY2VsSXRlbSA9IG1lbnUuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbnRleHQtaXRlbVwiKTtcbiAgICAgIGNhbmNlbEl0ZW0uc2V0VGV4dChcIkNhbmNlbFwiKTtcbiAgICAgIGNhbmNlbEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IG1lbnUucmVtb3ZlKCkpO1xuXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1lbnUpO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gbWVudS5yZW1vdmUoKSwgeyBvbmNlOiB0cnVlIH0pLCAwKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZ3JvdXBUYXNrcyh0YXNrczogQ2hyb25pY2xlVGFza1tdKTogUmVjb3JkPHN0cmluZywgQ2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgdG9kYXkgICAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IG5leHRXZWVrID0gbmV3IERhdGUoRGF0ZS5ub3coKSArIDcgKiA4NjQwMDAwMCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBjb25zdCBncm91cHM6IFJlY29yZDxzdHJpbmcsIENocm9uaWNsZVRhc2tbXT4gPSB7XG4gICAgICBcIk92ZXJkdWVcIjogICBbXSxcbiAgICAgIFwiVG9kYXlcIjogICAgIFtdLFxuICAgICAgXCJUaGlzIHdlZWtcIjogW10sXG4gICAgICBcIkxhdGVyXCI6ICAgICBbXSxcbiAgICAgIFwiTm8gZGF0ZVwiOiAgIFtdLFxuICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGFza3MpIHtcbiAgICAgIGlmICh0YXNrLnN0YXR1cyA9PT0gXCJkb25lXCIpIGNvbnRpbnVlO1xuICAgICAgaWYgKCF0YXNrLmR1ZURhdGUpICAgICAgICAgICAgeyBncm91cHNbXCJObyBkYXRlXCJdLnB1c2godGFzayk7ICAgY29udGludWU7IH1cbiAgICAgIGlmICh0YXNrLmR1ZURhdGUgPCB0b2RheSkgICAgIHsgZ3JvdXBzW1wiT3ZlcmR1ZVwiXS5wdXNoKHRhc2spOyAgIGNvbnRpbnVlOyB9XG4gICAgICBpZiAodGFzay5kdWVEYXRlID09PSB0b2RheSkgICB7IGdyb3Vwc1tcIlRvZGF5XCJdLnB1c2godGFzayk7ICAgICBjb250aW51ZTsgfVxuICAgICAgaWYgKHRhc2suZHVlRGF0ZSA8PSBuZXh0V2VlaykgeyBncm91cHNbXCJUaGlzIHdlZWtcIl0ucHVzaCh0YXNrKTsgY29udGludWU7IH1cbiAgICAgIGdyb3Vwc1tcIkxhdGVyXCJdLnB1c2godGFzayk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdyb3VwcztcbiAgfVxuXG4gIHByaXZhdGUgZm9ybWF0RGF0ZShkYXRlU3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHRvZGF5ICAgID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCB0b21vcnJvdyA9IG5ldyBEYXRlKERhdGUubm93KCkgKyA4NjQwMDAwMCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5KSAgICByZXR1cm4gXCJUb2RheVwiO1xuICAgIGlmIChkYXRlU3RyID09PSB0b21vcnJvdykgcmV0dXJuIFwiVG9tb3Jyb3dcIjtcbiAgICByZXR1cm4gbmV3IERhdGUoZGF0ZVN0ciArIFwiVDAwOjAwOjAwXCIpLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHtcbiAgICAgIG1vbnRoOiBcInNob3J0XCIsIGRheTogXCJudW1lcmljXCJcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5UYXNrRm9ybSh0YXNrPzogQ2hyb25pY2xlVGFzaykge1xuICAgIGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcbiAgICBjb25zdCBleGlzdGluZyA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVEFTS19GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKGV4aXN0aW5nKSBleGlzdGluZy5kZXRhY2goKTtcbiAgICBjb25zdCBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBUQVNLX0ZPUk1fVklFV19UWVBFLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7XG4gICAgY29uc3QgZm9ybUxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfRk9STV9WSUVXX1RZUEUpWzBdO1xuICAgIGNvbnN0IGZvcm1WaWV3ID0gZm9ybUxlYWY/LnZpZXcgYXMgVGFza0Zvcm1WaWV3IHwgdW5kZWZpbmVkO1xuICAgIGlmIChmb3JtVmlldyAmJiB0YXNrKSBmb3JtVmlldy5sb2FkVGFzayh0YXNrKTtcbiAgfVxufSIsICJpbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL1Rhc2tNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZVRhc2ssIFRhc2tTdGF0dXMsIFRhc2tQcmlvcml0eSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY29uc3QgVEFTS19GT1JNX1ZJRVdfVFlQRSA9IFwiY2hyb25pY2xlLXRhc2stZm9ybVwiO1xuXG5leHBvcnQgY2xhc3MgVGFza0Zvcm1WaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSBlZGl0aW5nVGFzazogQ2hyb25pY2xlVGFzayB8IG51bGwgPSBudWxsO1xuICBvblNhdmU/OiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICAgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyLFxuICAgIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyLFxuICAgIGVkaXRpbmdUYXNrPzogQ2hyb25pY2xlVGFzayxcbiAgICBvblNhdmU/OiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMudGFza01hbmFnZXIgPSB0YXNrTWFuYWdlcjtcbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IGNhbGVuZGFyTWFuYWdlcjtcbiAgICB0aGlzLmVkaXRpbmdUYXNrID0gZWRpdGluZ1Rhc2sgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSA9IG9uU2F2ZTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7IHJldHVybiBUQVNLX0ZPUk1fVklFV19UWVBFOyB9XG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmVkaXRpbmdUYXNrID8gXCJFZGl0IHRhc2tcIiA6IFwiTmV3IHRhc2tcIjsgfVxuICBnZXRJY29uKCk6IHN0cmluZyB7IHJldHVybiBcImNoZWNrLWNpcmNsZVwiOyB9XG5cbiAgYXN5bmMgb25PcGVuKCkgeyB0aGlzLnJlbmRlcigpOyB9XG5cbiAgbG9hZFRhc2sodGFzazogQ2hyb25pY2xlVGFzaykge1xuICAgIHRoaXMuZWRpdGluZ1Rhc2sgPSB0YXNrO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb250YWluZXIuZW1wdHkoKTtcbiAgICBjb250YWluZXIuYWRkQ2xhc3MoXCJjaHJvbmljbGUtZm9ybS1wYWdlXCIpO1xuXG4gICAgY29uc3QgdCA9IHRoaXMuZWRpdGluZ1Rhc2s7XG4gICAgY29uc3QgY2FsZW5kYXJzID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjZi1oZWFkZXJcIik7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdFwiLCB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZi1oZWFkZXItdGl0bGVcIikuc2V0VGV4dCh0ID8gXCJFZGl0IHRhc2tcIiA6IFwiTmV3IHRhc2tcIik7XG4gICAgY29uc3Qgc2F2ZUJ0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tcHJpbWFyeVwiLCB0ZXh0OiB0ID8gXCJTYXZlXCIgOiBcIkFkZFwiIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEZvcm0gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgZm9ybSA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjZi1mb3JtXCIpO1xuXG4gICAgLy8gVGl0bGVcbiAgICBjb25zdCB0aXRsZUZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIlRpdGxlXCIpO1xuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aXRsZUZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICBjbHM6IFwiY2YtaW5wdXQgY2YtdGl0bGUtaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIlRhc2sgbmFtZVwiLFxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSB0Py50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIFN0YXR1cyArIFByaW9yaXR5IChzaWRlIGJ5IHNpZGUpXG4gICAgY29uc3Qgcm93MSA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuXG4gICAgY29uc3Qgc3RhdHVzRmllbGQgPSB0aGlzLmZpZWxkKHJvdzEsIFwiU3RhdHVzXCIpO1xuICAgIGNvbnN0IHN0YXR1c1NlbGVjdCA9IHN0YXR1c0ZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHN0YXR1c2VzOiB7IHZhbHVlOiBUYXNrU3RhdHVzOyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwidG9kb1wiLCAgICAgICAgbGFiZWw6IFwiVG8gZG9cIiB9LFxuICAgICAgeyB2YWx1ZTogXCJpbi1wcm9ncmVzc1wiLCBsYWJlbDogXCJJbiBwcm9ncmVzc1wiIH0sXG4gICAgICB7IHZhbHVlOiBcImRvbmVcIiwgICAgICAgIGxhYmVsOiBcIkRvbmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJjYW5jZWxsZWRcIiwgICBsYWJlbDogXCJDYW5jZWxsZWRcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCBzIG9mIHN0YXR1c2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSBzdGF0dXNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogcy52YWx1ZSwgdGV4dDogcy5sYWJlbCB9KTtcbiAgICAgIGlmICh0Py5zdGF0dXMgPT09IHMudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgcHJpb3JpdHlGaWVsZCA9IHRoaXMuZmllbGQocm93MSwgXCJQcmlvcml0eVwiKTtcbiAgICBjb25zdCBwcmlvcml0eVNlbGVjdCA9IHByaW9yaXR5RmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcHJpb3JpdGllczogeyB2YWx1ZTogVGFza1ByaW9yaXR5OyBsYWJlbDogc3RyaW5nOyBjb2xvcjogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwibm9uZVwiLCAgIGxhYmVsOiBcIk5vbmVcIiwgICBjb2xvcjogXCJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJsb3dcIiwgICAgbGFiZWw6IFwiTG93XCIsICAgIGNvbG9yOiBcIiMzNEM3NTlcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJtZWRpdW1cIiwgbGFiZWw6IFwiTWVkaXVtXCIsIGNvbG9yOiBcIiNGRjk1MDBcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJoaWdoXCIsICAgbGFiZWw6IFwiSGlnaFwiLCAgIGNvbG9yOiBcIiNGRjNCMzBcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCBwIG9mIHByaW9yaXRpZXMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IHByaW9yaXR5U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHAudmFsdWUsIHRleHQ6IHAubGFiZWwgfSk7XG4gICAgICBpZiAodD8ucHJpb3JpdHkgPT09IHAudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gRHVlIGRhdGUgKyB0aW1lIChzaWRlIGJ5IHNpZGUpXG4gICAgY29uc3Qgcm93MiA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuXG4gICAgY29uc3QgZHVlRGF0ZUZpZWxkID0gdGhpcy5maWVsZChyb3cyLCBcIkR1ZSBkYXRlXCIpO1xuICAgIGNvbnN0IGR1ZURhdGVJbnB1dCA9IGR1ZURhdGVGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGR1ZURhdGVJbnB1dC52YWx1ZSA9IHQ/LmR1ZURhdGUgPz8gXCJcIjtcblxuICAgIGNvbnN0IGR1ZVRpbWVGaWVsZCA9IHRoaXMuZmllbGQocm93MiwgXCJEdWUgdGltZVwiKTtcbiAgICBjb25zdCBkdWVUaW1lSW5wdXQgPSBkdWVUaW1lRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRpbWVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBkdWVUaW1lSW5wdXQudmFsdWUgPSB0Py5kdWVUaW1lID8/IFwiXCI7XG5cbiAgICAvLyBDYWxlbmRhclxuICAgIGNvbnN0IGNhbEZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIkNhbGVuZGFyXCIpO1xuICAgIGNvbnN0IGNhbFNlbGVjdCA9IGNhbEZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBcIlwiLCB0ZXh0OiBcIk5vbmVcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGNhbCBvZiBjYWxlbmRhcnMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBjYWwuaWQsIHRleHQ6IGNhbC5uYW1lIH0pO1xuICAgICAgaWYgKHQ/LmNhbGVuZGFySWQgPT09IGNhbC5pZCkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgY2FsZW5kYXIgc2VsZWN0IGRvdCBjb2xvclxuICAgIGNvbnN0IHVwZGF0ZUNhbENvbG9yID0gKCkgPT4ge1xuICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChjYWxTZWxlY3QudmFsdWUpO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRDb2xvciA9IGNhbCA/IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcikgOiBcInRyYW5zcGFyZW50XCI7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdFdpZHRoID0gXCI0cHhcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0U3R5bGUgPSBcInNvbGlkXCI7XG4gICAgfTtcbiAgICBjYWxTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB1cGRhdGVDYWxDb2xvcik7XG4gICAgdXBkYXRlQ2FsQ29sb3IoKTtcblxuICAgIC8vIFJlY3VycmVuY2VcbiAgICBjb25zdCByZWNGaWVsZCA9IHRoaXMuZmllbGQoZm9ybSwgXCJSZXBlYXRcIik7XG4gICAgY29uc3QgcmVjU2VsZWN0ID0gcmVjRmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcmVjdXJyZW5jZXMgPSBbXG4gICAgICB7IHZhbHVlOiBcIlwiLCAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIk5ldmVyXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1EQUlMWVwiLCAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgZGF5XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1XRUVLTFlcIiwgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgd2Vla1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9TU9OVEhMWVwiLCAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IG1vbnRoXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1ZRUFSTFlcIiwgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgeWVhclwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZO0JZREFZPU1PLFRVLFdFLFRILEZSXCIsIGxhYmVsOiBcIldlZWtkYXlzXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgciBvZiByZWN1cnJlbmNlcykge1xuICAgICAgY29uc3Qgb3B0ID0gcmVjU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHIudmFsdWUsIHRleHQ6IHIubGFiZWwgfSk7XG4gICAgICBpZiAodD8ucmVjdXJyZW5jZSA9PT0gci52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBUaW1lIGVzdGltYXRlXG4gICAgY29uc3QgZXN0aW1hdGVGaWVsZCA9IHRoaXMuZmllbGQoZm9ybSwgXCJUaW1lIGVzdGltYXRlXCIpO1xuICAgIGNvbnN0IGVzdGltYXRlV3JhcCA9IGVzdGltYXRlRmllbGQuY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuICAgIGNvbnN0IGVzdGltYXRlSW5wdXQgPSBlc3RpbWF0ZVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcIm51bWJlclwiLCBjbHM6IFwiY2YtaW5wdXQgY2YtaW5wdXQtc21cIiwgcGxhY2Vob2xkZXI6IFwiMFwiXG4gICAgfSk7XG4gICAgZXN0aW1hdGVJbnB1dC52YWx1ZSA9IHQ/LnRpbWVFc3RpbWF0ZSA/IFN0cmluZyh0LnRpbWVFc3RpbWF0ZSkgOiBcIlwiO1xuICAgIGVzdGltYXRlSW5wdXQubWluID0gXCIwXCI7XG4gICAgZXN0aW1hdGVXcmFwLmNyZWF0ZVNwYW4oeyBjbHM6IFwiY2YtdW5pdFwiLCB0ZXh0OiBcIm1pbnV0ZXNcIiB9KTtcblxuICAgIC8vIFRhZ3NcbiAgICBjb25zdCB0YWdzRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGFnc1wiKTtcbiAgICBjb25zdCB0YWdzSW5wdXQgPSB0YWdzRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJ3b3JrLCBwZXJzb25hbCwgdXJnZW50ICAoY29tbWEgc2VwYXJhdGVkKVwiXG4gICAgfSk7XG4gICAgdGFnc0lucHV0LnZhbHVlID0gdD8udGFncy5qb2luKFwiLCBcIikgPz8gXCJcIjtcblxuICAgIC8vIENvbnRleHRzXG4gICAgY29uc3QgY29udGV4dHNGaWVsZCA9IHRoaXMuZmllbGQoZm9ybSwgXCJDb250ZXh0c1wiKTtcbiAgICBjb25zdCBjb250ZXh0c0lucHV0ID0gY29udGV4dHNGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIkBob21lLCBAd29yayAgKGNvbW1hIHNlcGFyYXRlZClcIlxuICAgIH0pO1xuICAgIGNvbnRleHRzSW5wdXQudmFsdWUgPSB0Py5jb250ZXh0cy5qb2luKFwiLCBcIikgPz8gXCJcIjtcblxuICAgIC8vIExpbmtlZCBub3Rlc1xuICAgIGNvbnN0IGxpbmtlZEZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIkxpbmtlZCBub3Rlc1wiKTtcbiAgICBjb25zdCBsaW5rZWRJbnB1dCA9IGxpbmtlZEZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiUHJvamVjdHMvV2Vic2l0ZSwgSm91cm5hbC8yMDI0ICAoY29tbWEgc2VwYXJhdGVkKVwiXG4gICAgfSk7XG4gICAgbGlua2VkSW5wdXQudmFsdWUgPSB0Py5saW5rZWROb3Rlcy5qb2luKFwiLCBcIikgPz8gXCJcIjtcblxuICAgIC8vIEN1c3RvbSBmaWVsZHNcbiAgICBjb25zdCBjdXN0b21TZWN0aW9uID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1zZWN0aW9uXCIpO1xuICAgIGN1c3RvbVNlY3Rpb24uY3JlYXRlRGl2KFwiY2Ytc2VjdGlvbi1sYWJlbFwiKS5zZXRUZXh0KFwiQ3VzdG9tIGZpZWxkc1wiKTtcbiAgICBjb25zdCBjdXN0b21MaXN0ID0gY3VzdG9tU2VjdGlvbi5jcmVhdGVEaXYoXCJjZi1jdXN0b20tbGlzdFwiKTtcbiAgICBjb25zdCBjdXN0b21GaWVsZHM6IHsga2V5OiBzdHJpbmc7IHZhbHVlOiBzdHJpbmcgfVtdID0gW1xuICAgICAgLi4uKHQ/LmN1c3RvbUZpZWxkcy5tYXAoZiA9PiAoeyBrZXk6IGYua2V5LCB2YWx1ZTogU3RyaW5nKGYudmFsdWUpIH0pKSA/PyBbXSlcbiAgICBdO1xuXG4gICAgY29uc3QgcmVuZGVyQ3VzdG9tRmllbGRzID0gKCkgPT4ge1xuICAgICAgY3VzdG9tTGlzdC5lbXB0eSgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXN0b21GaWVsZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2YgPSBjdXN0b21GaWVsZHNbaV07XG4gICAgICAgIGNvbnN0IGNmUm93ID0gY3VzdG9tTGlzdC5jcmVhdGVEaXYoXCJjZi1jdXN0b20tcm93XCIpO1xuICAgICAgICBjb25zdCBrZXlJbnB1dCA9IGNmUm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXQgY2YtY3VzdG9tLWtleVwiLCBwbGFjZWhvbGRlcjogXCJGaWVsZCBuYW1lXCJcbiAgICAgICAgfSk7XG4gICAgICAgIGtleUlucHV0LnZhbHVlID0gY2Yua2V5O1xuICAgICAgICBrZXlJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4geyBjdXN0b21GaWVsZHNbaV0ua2V5ID0ga2V5SW5wdXQudmFsdWU7IH0pO1xuXG4gICAgICAgIGNvbnN0IHZhbElucHV0ID0gY2ZSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dCBjZi1jdXN0b20tdmFsXCIsIHBsYWNlaG9sZGVyOiBcIlZhbHVlXCJcbiAgICAgICAgfSk7XG4gICAgICAgIHZhbElucHV0LnZhbHVlID0gY2YudmFsdWU7XG4gICAgICAgIHZhbElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7IGN1c3RvbUZpZWxkc1tpXS52YWx1ZSA9IHZhbElucHV0LnZhbHVlOyB9KTtcblxuICAgICAgICBjb25zdCByZW1vdmVCdG4gPSBjZlJvdy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4taWNvblwiLCB0ZXh0OiBcIlx1MDBEN1wiIH0pO1xuICAgICAgICByZW1vdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICBjdXN0b21GaWVsZHMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIHJlbmRlckN1c3RvbUZpZWxkcygpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYWRkQ2ZCdG4gPSBjdXN0b21MaXN0LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImNmLWJ0bi1naG9zdCBjZi1hZGQtZmllbGRcIiwgdGV4dDogXCIrIEFkZCBmaWVsZFwiXG4gICAgICB9KTtcbiAgICAgIGFkZENmQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGN1c3RvbUZpZWxkcy5wdXNoKHsga2V5OiBcIlwiLCB2YWx1ZTogXCJcIiB9KTtcbiAgICAgICAgcmVuZGVyQ3VzdG9tRmllbGRzKCk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJlbmRlckN1c3RvbUZpZWxkcygpO1xuXG4gICAgLy8gTm90ZXNcbiAgICBjb25zdCBub3Rlc0ZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIk5vdGVzXCIpO1xuICAgIGNvbnN0IG5vdGVzSW5wdXQgPSBub3Rlc0ZpZWxkLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImNmLXRleHRhcmVhXCIsIHBsYWNlaG9sZGVyOiBcIkFkZCBub3Rlcy4uLlwiXG4gICAgfSk7XG4gICAgbm90ZXNJbnB1dC52YWx1ZSA9IHQ/Lm5vdGVzID8/IFwiXCI7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQWN0aW9ucyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVEFTS19GT1JNX1ZJRVdfVFlQRSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSB0aXRsZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHsgdGl0bGVJbnB1dC5mb2N1cygpOyB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTsgcmV0dXJuOyB9XG5cbiAgLy8gQ2hlY2sgZm9yIGR1cGxpY2F0ZSB0aXRsZVxuICAgICAgaWYgKCF0aGlzLmVkaXRpbmdUYXNrKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRBbGwoKTtcbiAgICAgICAgY29uc3QgZHVwbGljYXRlID0gZXhpc3RpbmcuZmluZChcbiAgICAgICAgICB0ID0+IHQudGl0bGUudG9Mb3dlckNhc2UoKSA9PT0gdGl0bGUudG9Mb3dlckNhc2UoKVxuICAgICAgICApO1xuICAgICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShgQSB0YXNrIG5hbWVkIFwiJHt0aXRsZX1cIiBhbHJlYWR5IGV4aXN0cy5gLCA0MDAwKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRhc2tEYXRhID0ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgc3RhdHVzOiAgICAgICAgc3RhdHVzU2VsZWN0LnZhbHVlIGFzIFRhc2tTdGF0dXMsXG4gICAgICAgIHByaW9yaXR5OiAgICAgIHByaW9yaXR5U2VsZWN0LnZhbHVlIGFzIFRhc2tQcmlvcml0eSxcbiAgICAgICAgZHVlRGF0ZTogICAgICAgZHVlRGF0ZUlucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgZHVlVGltZTogICAgICAgZHVlVGltZUlucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsZW5kYXJJZDogICAgY2FsU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgcmVjdXJyZW5jZTogICAgcmVjU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgdGltZUVzdGltYXRlOiAgZXN0aW1hdGVJbnB1dC52YWx1ZSA/IHBhcnNlSW50KGVzdGltYXRlSW5wdXQudmFsdWUpIDogdW5kZWZpbmVkLFxuICAgICAgICB0YWdzOiAgICAgICAgICB0YWdzSW5wdXQudmFsdWUgPyB0YWdzSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiBbXSxcbiAgICAgICAgY29udGV4dHM6ICAgICAgY29udGV4dHNJbnB1dC52YWx1ZSA/IGNvbnRleHRzSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiBbXSxcbiAgICAgICAgbGlua2VkTm90ZXM6ICAgbGlua2VkSW5wdXQudmFsdWUgPyBsaW5rZWRJbnB1dC52YWx1ZS5zcGxpdChcIixcIikubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKSA6IFtdLFxuICAgICAgICBwcm9qZWN0czogICAgICB0Py5wcm9qZWN0cyA/PyBbXSxcbiAgICAgICAgdGltZUVudHJpZXM6ICAgdD8udGltZUVudHJpZXMgPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogdD8uY29tcGxldGVkSW5zdGFuY2VzID8/IFtdLFxuICAgICAgICBjdXN0b21GaWVsZHM6ICBjdXN0b21GaWVsZHMuZmlsdGVyKGYgPT4gZi5rZXkpLm1hcChmID0+ICh7IGtleTogZi5rZXksIHZhbHVlOiBmLnZhbHVlIH0pKSxcbiAgICAgICAgbm90ZXM6ICAgICAgICAgbm90ZXNJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICB9O1xuXG4gICAgICBpZiAodCkge1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLnVwZGF0ZSh7IC4uLnQsIC4uLnRhc2tEYXRhIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5jcmVhdGUodGFza0RhdGEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm9uU2F2ZT8uKCk7XG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFRBU0tfRk9STV9WSUVXX1RZUEUpO1xuICAgIH07XG5cbiAgICBzYXZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoYW5kbGVTYXZlKTtcblxuICAgIC8vIFRhYiB0aHJvdWdoIGZpZWxkcyBuYXR1cmFsbHksIEVudGVyIG9uIHRpdGxlIHNhdmVzXG4gICAgdGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZSkgPT4ge1xuICAgICAgaWYgKGUua2V5ID09PSBcIkVudGVyXCIpIGhhbmRsZVNhdmUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZmllbGQocGFyZW50OiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCB3cmFwID0gcGFyZW50LmNyZWF0ZURpdihcImNmLWZpZWxkXCIpO1xuICAgIHdyYXAuY3JlYXRlRGl2KFwiY2YtbGFiZWxcIikuc2V0VGV4dChsYWJlbCk7XG4gICAgcmV0dXJuIHdyYXA7XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgRXZlbnRNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvRXZlbnRNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZUV2ZW50LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSBlZGl0aW5nRXZlbnQ6IENocm9uaWNsZUV2ZW50IHwgbnVsbDtcbiAgcHJpdmF0ZSBvblNhdmU/OiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyLFxuICAgIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyLFxuICAgIGVkaXRpbmdFdmVudD86IENocm9uaWNsZUV2ZW50LFxuICAgIG9uU2F2ZT86ICgpID0+IHZvaWRcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLmV2ZW50TWFuYWdlciA9IGV2ZW50TWFuYWdlcjtcbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IGNhbGVuZGFyTWFuYWdlcjtcbiAgICB0aGlzLmVkaXRpbmdFdmVudCA9IGVkaXRpbmdFdmVudCA/PyBudWxsO1xuICAgIHRoaXMub25TYXZlID0gb25TYXZlO1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImNocm9uaWNsZS1ldmVudC1tb2RhbFwiKTtcblxuICAgIGNvbnN0IGUgPSB0aGlzLmVkaXRpbmdFdmVudDtcbiAgICBjb25zdCBjYWxlbmRhcnMgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRBbGwoKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIZWFkZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaGVhZGVyID0gY29udGVudEVsLmNyZWF0ZURpdihcImNlbS1oZWFkZXJcIik7XG4gICAgaGVhZGVyLmNyZWF0ZURpdihcImNlbS10aXRsZVwiKS5zZXRUZXh0KGUgPyBcIkVkaXQgZXZlbnRcIiA6IFwiTmV3IGV2ZW50XCIpO1xuXG4gICAgY29uc3QgZXhwYW5kQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdCBjZW0tZXhwYW5kLWJ0blwiIH0pO1xuICAgIGV4cGFuZEJ0bi50aXRsZSA9IFwiT3BlbiBhcyBmdWxsIHBhZ2VcIjtcbiAgICBleHBhbmRCdG4uaW5uZXJIVE1MID0gYDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPjxwb2x5bGluZSBwb2ludHM9XCIxNSAzIDIxIDMgMjEgOVwiLz48cG9seWxpbmUgcG9pbnRzPVwiOSAyMSAzIDIxIDMgMTVcIi8+PGxpbmUgeDE9XCIyMVwiIHkxPVwiM1wiIHgyPVwiMTRcIiB5Mj1cIjEwXCIvPjxsaW5lIHgxPVwiM1wiIHkxPVwiMjFcIiB4Mj1cIjEwXCIgeTI9XCIxNFwiLz48L3N2Zz5gO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEZvcm0gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgZm9ybSA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZW0tZm9ybVwiKTtcblxuICAgIC8vIFRpdGxlXG4gICAgY29uc3QgdGl0bGVJbnB1dCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJUaXRsZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXQgY2YtdGl0bGUtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiRXZlbnQgbmFtZVwiXG4gICAgfSk7XG4gICAgdGl0bGVJbnB1dC52YWx1ZSA9IGU/LnRpdGxlID8/IFwiXCI7XG4gICAgdGl0bGVJbnB1dC5mb2N1cygpO1xuXG4gICAgLy8gTG9jYXRpb25cbiAgICBjb25zdCBsb2NhdGlvbklucHV0ID0gdGhpcy5jZW1GaWVsZChmb3JtLCBcIkxvY2F0aW9uXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLCBwbGFjZWhvbGRlcjogXCJBZGQgbG9jYXRpb25cIlxuICAgIH0pO1xuICAgIGxvY2F0aW9uSW5wdXQudmFsdWUgPSBlPy5sb2NhdGlvbiA/PyBcIlwiO1xuXG4gICAgLy8gQWxsIGRheSB0b2dnbGVcbiAgICBjb25zdCBhbGxEYXlGaWVsZCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJBbGwgZGF5XCIpO1xuICAgIGNvbnN0IGFsbERheVdyYXAgPSBhbGxEYXlGaWVsZC5jcmVhdGVEaXYoXCJjZW0tdG9nZ2xlLXdyYXBcIik7XG4gICAgY29uc3QgYWxsRGF5VG9nZ2xlID0gYWxsRGF5V3JhcC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiLCBjbHM6IFwiY2VtLXRvZ2dsZVwiIH0pO1xuICAgIGFsbERheVRvZ2dsZS5jaGVja2VkID0gZT8uYWxsRGF5ID8/IGZhbHNlO1xuICAgIGNvbnN0IGFsbERheUxhYmVsID0gYWxsRGF5V3JhcC5jcmVhdGVTcGFuKHsgY2xzOiBcImNlbS10b2dnbGUtbGFiZWxcIiwgdGV4dDogYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIlllc1wiIDogXCJOb1wiIH0pO1xuICAgIGFsbERheVRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGFsbERheUxhYmVsLnNldFRleHQoYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIlllc1wiIDogXCJOb1wiKTtcbiAgICAgIHRpbWVGaWVsZHMuc3R5bGUuZGlzcGxheSA9IGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJub25lXCIgOiBcIlwiO1xuICAgIH0pO1xuXG4gICAgLy8gU3RhcnQgZGF0ZSArIHRpbWVcbiAgICBjb25zdCBzdGFydFJvdyA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuICAgIGNvbnN0IHN0YXJ0RGF0ZUlucHV0ID0gdGhpcy5jZW1GaWVsZChzdGFydFJvdywgXCJTdGFydCBkYXRlXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJkYXRlXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgc3RhcnREYXRlSW5wdXQudmFsdWUgPSBlPy5zdGFydERhdGUgPz8gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIGNvbnN0IHRpbWVGaWVsZHMgPSBmb3JtLmNyZWF0ZURpdihcImNlbS10aW1lLWZpZWxkc1wiKTtcbiAgICB0aW1lRmllbGRzLnN0eWxlLmRpc3BsYXkgPSBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwibm9uZVwiIDogXCJcIjtcblxuICAgIGNvbnN0IHN0YXJ0VGltZVJvdyA9IHRpbWVGaWVsZHMuY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuICAgIGNvbnN0IHN0YXJ0VGltZUlucHV0ID0gdGhpcy5jZW1GaWVsZChzdGFydFRpbWVSb3csIFwiU3RhcnQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0VGltZUlucHV0LnZhbHVlID0gZT8uc3RhcnRUaW1lID8/IFwiMDk6MDBcIjtcblxuICAgIGNvbnN0IGVuZFRpbWVJbnB1dCA9IHRoaXMuY2VtRmllbGQoc3RhcnRUaW1lUm93LCBcIkVuZCB0aW1lXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0aW1lXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgZW5kVGltZUlucHV0LnZhbHVlID0gZT8uZW5kVGltZSA/PyBcIjEwOjAwXCI7XG5cbiAgICAvLyBFbmQgZGF0ZVxuICAgIGNvbnN0IGVuZERhdGVJbnB1dCA9IHRoaXMuY2VtRmllbGQoc3RhcnRSb3csIFwiRW5kIGRhdGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcImRhdGVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBlbmREYXRlSW5wdXQudmFsdWUgPSBlPy5lbmREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICAvLyBBdXRvLWFkdmFuY2UgZW5kIGRhdGUgd2hlbiBzdGFydCBjaGFuZ2VzXG4gICAgc3RhcnREYXRlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBpZiAoIWVuZERhdGVJbnB1dC52YWx1ZSB8fCBlbmREYXRlSW5wdXQudmFsdWUgPCBzdGFydERhdGVJbnB1dC52YWx1ZSkge1xuICAgICAgICBlbmREYXRlSW5wdXQudmFsdWUgPSBzdGFydERhdGVJbnB1dC52YWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFJlcGVhdFxuICAgIGNvbnN0IHJlY1NlbGVjdCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJSZXBlYXRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcmVjdXJyZW5jZXMgPSBbXG4gICAgICB7IHZhbHVlOiBcIlwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiTmV2ZXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPURBSUxZXCIsICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IGRheVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZXCIsICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgd2Vla1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9TU9OVEhMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgbW9udGhcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVlFQVJMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IHllYXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWTtCWURBWT1NTyxUVSxXRSxUSCxGUlwiLCAgbGFiZWw6IFwiV2Vla2RheXNcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCByIG9mIHJlY3VycmVuY2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSByZWNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogci52YWx1ZSwgdGV4dDogci5sYWJlbCB9KTtcbiAgICAgIGlmIChlPy5yZWN1cnJlbmNlID09PSByLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIENhbGVuZGFyXG4gICAgY29uc3QgY2FsU2VsZWN0ID0gdGhpcy5jZW1GaWVsZChmb3JtLCBcIkNhbGVuZGFyXCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBcIlwiLCB0ZXh0OiBcIk5vbmVcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGNhbCBvZiBjYWxlbmRhcnMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBjYWwuaWQsIHRleHQ6IGNhbC5uYW1lIH0pO1xuICAgICAgaWYgKGU/LmNhbGVuZGFySWQgPT09IGNhbC5pZCkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgdXBkYXRlQ2FsQ29sb3IgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGNhbFNlbGVjdC52YWx1ZSk7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdENvbG9yID0gY2FsID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSA6IFwidHJhbnNwYXJlbnRcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0V2lkdGggPSBcIjRweFwiO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRTdHlsZSA9IFwic29saWRcIjtcbiAgICB9O1xuICAgIGNhbFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHVwZGF0ZUNhbENvbG9yKTtcbiAgICB1cGRhdGVDYWxDb2xvcigpO1xuXG4gICAgLy8gQWxlcnRcbiAgICBjb25zdCBhbGVydFNlbGVjdCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJBbGVydFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCBhbGVydHM6IHsgdmFsdWU6IEFsZXJ0T2Zmc2V0OyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwibm9uZVwiLCAgICBsYWJlbDogXCJOb25lXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiYXQtdGltZVwiLCBsYWJlbDogXCJBdCB0aW1lIG9mIGV2ZW50XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiNW1pblwiLCAgICBsYWJlbDogXCI1IG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMTBtaW5cIiwgICBsYWJlbDogXCIxMCBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjE1bWluXCIsICAgbGFiZWw6IFwiMTUgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIzMG1pblwiLCAgIGxhYmVsOiBcIjMwIG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMWhvdXJcIiwgICBsYWJlbDogXCIxIGhvdXIgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMmhvdXJzXCIsICBsYWJlbDogXCIyIGhvdXJzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjFkYXlcIiwgICAgbGFiZWw6IFwiMSBkYXkgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMmRheXNcIiwgICBsYWJlbDogXCIyIGRheXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMXdlZWtcIiwgICBsYWJlbDogXCIxIHdlZWsgYmVmb3JlXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgYSBvZiBhbGVydHMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGFsZXJ0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGEudmFsdWUsIHRleHQ6IGEubGFiZWwgfSk7XG4gICAgICBpZiAoZT8uYWxlcnQgPT09IGEudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gTm90ZXNcbiAgICBjb25zdCBub3Rlc0lucHV0ID0gdGhpcy5jZW1GaWVsZChmb3JtLCBcIk5vdGVzXCIpLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImNmLXRleHRhcmVhXCIsIHBsYWNlaG9sZGVyOiBcIkFkZCBub3Rlcy4uLlwiXG4gICAgfSk7XG4gICAgbm90ZXNJbnB1dC52YWx1ZSA9IGU/Lm5vdGVzID8/IFwiXCI7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9vdGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGZvb3RlciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZW0tZm9vdGVyXCIpO1xuICAgIGNvbnN0IGNhbmNlbEJ0biA9IGZvb3Rlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tZ2hvc3RcIiwgdGV4dDogXCJDYW5jZWxcIiB9KTtcbiAgICBjb25zdCBzYXZlQnRuICAgPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLXByaW1hcnlcIiwgdGV4dDogZSA/IFwiU2F2ZVwiIDogXCJBZGQgZXZlbnRcIiB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIYW5kbGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuY2xvc2UoKSk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSB0aXRsZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHsgdGl0bGVJbnB1dC5mb2N1cygpOyB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTsgcmV0dXJuOyB9XG5cbiAgICAgIGNvbnN0IGV2ZW50RGF0YSA9IHtcbiAgICAgICAgdGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICBsb2NhdGlvbklucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxsRGF5OiAgICAgIGFsbERheVRvZ2dsZS5jaGVja2VkLFxuICAgICAgICBzdGFydERhdGU6ICAgc3RhcnREYXRlSW5wdXQudmFsdWUsXG4gICAgICAgIHN0YXJ0VGltZTogICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IHVuZGVmaW5lZCA6IHN0YXJ0VGltZUlucHV0LnZhbHVlLFxuICAgICAgICBlbmREYXRlOiAgICAgZW5kRGF0ZUlucHV0LnZhbHVlIHx8IHN0YXJ0RGF0ZUlucHV0LnZhbHVlLFxuICAgICAgICBlbmRUaW1lOiAgICAgYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyB1bmRlZmluZWQgOiBlbmRUaW1lSW5wdXQudmFsdWUsXG4gICAgICAgIHJlY3VycmVuY2U6ICByZWNTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBjYWxlbmRhcklkOiAgY2FsU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgIGFsZXJ0U2VsZWN0LnZhbHVlIGFzIEFsZXJ0T2Zmc2V0LFxuICAgICAgICBub3RlczogICAgICAgbm90ZXNJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGxpbmtlZFRhc2tJZHM6IGU/LmxpbmtlZFRhc2tJZHMgPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogZT8uY29tcGxldGVkSW5zdGFuY2VzID8/IFtdLFxuICAgICAgfTtcblxuICAgICAgaWYgKGUpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIudXBkYXRlKHsgLi4uZSwgLi4uZXZlbnREYXRhIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuY3JlYXRlKGV2ZW50RGF0YSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9O1xuXG4gICAgc2F2ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGFuZGxlU2F2ZSk7XG4gICAgZXhwYW5kQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAvLyBSZS1vcGVuIGFzIGZ1bGwgcGFnZSAoZnV0dXJlOiBFdmVudEZvcm1WaWV3KVxuICAgIH0pO1xuXG4gICAgdGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZSkgPT4ge1xuICAgICAgaWYgKGUua2V5ID09PSBcIkVudGVyXCIpIGhhbmRsZVNhdmUoKTtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFc2NhcGVcIikgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgb25DbG9zZSgpIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjZW1GaWVsZChwYXJlbnQ6IEhUTUxFbGVtZW50LCBsYWJlbDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHdyYXAgPSBwYXJlbnQuY3JlYXRlRGl2KFwiY2YtZmllbGRcIik7XG4gICAgd3JhcC5jcmVhdGVEaXYoXCJjZi1sYWJlbFwiKS5zZXRUZXh0KGxhYmVsKTtcbiAgICByZXR1cm4gd3JhcDtcbiAgfVxufSJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG1CQUFzQzs7O0FDNEgvQixJQUFNLG1CQUFzQztBQUFBLEVBQ2pELGFBQWE7QUFBQSxFQUNiLGNBQWM7QUFBQSxFQUNkLFdBQVc7QUFBQSxJQUNULEVBQUUsSUFBSSxZQUFZLE1BQU0sWUFBWSxPQUFPLFFBQVUsV0FBVyxNQUFNLFlBQVcsb0JBQUksS0FBSyxHQUFFLFlBQVksRUFBRTtBQUFBLElBQzFHLEVBQUUsSUFBSSxRQUFZLE1BQU0sUUFBWSxP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
