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
var import_obsidian7 = require("obsidian");

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
  // Expands recurring events into occurrences within a date range.
  // Returns a flat list of ChronicleEvent objects, one per occurrence,
  // each with startDate/endDate set to the occurrence date.
  async getInRangeWithRecurrence(rangeStart, rangeEnd) {
    const all = await this.getAll();
    const result = [];
    for (const event of all) {
      if (!event.recurrence) {
        if (event.startDate >= rangeStart && event.startDate <= rangeEnd) {
          result.push(event);
        }
        continue;
      }
      const occurrences = this.expandRecurrence(event, rangeStart, rangeEnd);
      result.push(...occurrences);
    }
    return result;
  }
  expandRecurrence(event, rangeStart, rangeEnd) {
    var _a;
    const results = [];
    const rule = (_a = event.recurrence) != null ? _a : "";
    const freq = this.rrulePart(rule, "FREQ");
    const byDay = this.rrulePart(rule, "BYDAY");
    const until = this.rrulePart(rule, "UNTIL");
    const countStr = this.rrulePart(rule, "COUNT");
    const count = countStr ? parseInt(countStr) : 999;
    const start = /* @__PURE__ */ new Date(event.startDate + "T00:00:00");
    const rEnd = /* @__PURE__ */ new Date(rangeEnd + "T00:00:00");
    const rStart = /* @__PURE__ */ new Date(rangeStart + "T00:00:00");
    const untilDate = until ? /* @__PURE__ */ new Date(until.slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") + "T00:00:00") : null;
    const dayNames = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
    const byDays = byDay ? byDay.split(",") : [];
    let current = new Date(start);
    let generated = 0;
    while (current <= rEnd && generated < count) {
      if (untilDate && current > untilDate) break;
      const dateStr = current.toISOString().split("T")[0];
      const durationMs = (/* @__PURE__ */ new Date(event.endDate + "T00:00:00")).getTime() - start.getTime();
      const endDate = new Date(current.getTime() + durationMs).toISOString().split("T")[0];
      if (current >= rStart && !event.completedInstances.includes(dateStr)) {
        results.push({ ...event, startDate: dateStr, endDate });
        generated++;
      }
      if (freq === "DAILY") {
        current.setDate(current.getDate() + 1);
      } else if (freq === "WEEKLY") {
        if (byDays.length > 0) {
          current.setDate(current.getDate() + 1);
          let safety = 0;
          while (!byDays.includes(dayNames[current.getDay()]) && safety++ < 7) {
            current.setDate(current.getDate() + 1);
          }
        } else {
          current.setDate(current.getDate() + 7);
        }
      } else if (freq === "MONTHLY") {
        current.setMonth(current.getMonth() + 1);
      } else if (freq === "YEARLY") {
        current.setFullYear(current.getFullYear() + 1);
      } else {
        break;
      }
    }
    return results;
  }
  rrulePart(rule, key) {
    const match = rule.match(new RegExp(`(?:^|;)${key}=([^;]+)`));
    return match ? match[1] : "";
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

// src/views/CalendarView.ts
var import_obsidian6 = require("obsidian");

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
    if (e && e.id) {
      const deleteBtn = footer.createEl("button", { cls: "cf-btn-delete", text: "Delete event" });
      deleteBtn.addEventListener("click", async () => {
        var _a2;
        await this.eventManager.delete(e.id);
        (_a2 = this.onSave) == null ? void 0 : _a2.call(this);
        this.close();
      });
    }
    const saveBtn = footer.createEl("button", { cls: "cf-btn-primary", text: e && e.id ? "Save" : "Add event" });
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
      if (e && e.id) {
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

// src/views/CalendarView.ts
var CALENDAR_VIEW_TYPE = "chronicle-calendar-view";
var HOUR_HEIGHT = 56;
var CalendarView = class extends import_obsidian6.ItemView {
  constructor(leaf, eventManager, taskManager, calendarManager) {
    super(leaf);
    this.currentDate = /* @__PURE__ */ new Date();
    this.mode = "week";
    this.eventManager = eventManager;
    this.taskManager = taskManager;
    this.calendarManager = calendarManager;
  }
  getViewType() {
    return CALENDAR_VIEW_TYPE;
  }
  getDisplayText() {
    return "Chronicle Calendar";
  }
  getIcon() {
    return "calendar";
  }
  async onOpen() {
    await this.render();
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
        const inTasks = file.path.startsWith(this.taskManager["tasksFolder"]);
        if (inEvents || inTasks) this.render();
      })
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
        const inTasks = file.path.startsWith(this.taskManager["tasksFolder"]);
        if (inEvents || inTasks) setTimeout(() => this.render(), 200);
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
        const inTasks = file.path.startsWith(this.taskManager["tasksFolder"]);
        if (inEvents || inTasks) this.render();
      })
    );
  }
  async render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("chronicle-cal-app");
    const tasks = await this.taskManager.getAll();
    const rangeStart = this.getRangeStart();
    const rangeEnd = this.getRangeEnd();
    const events = await this.eventManager.getInRangeWithRecurrence(rangeStart, rangeEnd);
    const layout = container.createDiv("chronicle-cal-layout");
    const sidebar = layout.createDiv("chronicle-cal-sidebar");
    const main = layout.createDiv("chronicle-cal-main");
    this.renderSidebar(sidebar);
    this.renderToolbar(main);
    if (this.mode === "year") this.renderYearView(main, events, tasks);
    else if (this.mode === "month") this.renderMonthView(main, events, tasks);
    else if (this.mode === "week") this.renderWeekView(main, events, tasks);
    else this.renderDayView(main, events, tasks);
  }
  // ── Sidebar ───────────────────────────────────────────────────────────────
  getRangeStart() {
    if (this.mode === "day") return this.currentDate.toISOString().split("T")[0];
    if (this.mode === "week") {
      const s = this.getWeekStart();
      return s.toISOString().split("T")[0];
    }
    if (this.mode === "year") return `${this.currentDate.getFullYear()}-01-01`;
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();
    return `${y}-${String(m + 1).padStart(2, "0")}-01`;
  }
  getRangeEnd() {
    if (this.mode === "day") return this.currentDate.toISOString().split("T")[0];
    if (this.mode === "week") {
      const s = this.getWeekStart();
      const e = new Date(s);
      e.setDate(e.getDate() + 6);
      return e.toISOString().split("T")[0];
    }
    if (this.mode === "year") return `${this.currentDate.getFullYear()}-12-31`;
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();
    return new Date(y, m + 1, 0).toISOString().split("T")[0];
  }
  renderSidebar(sidebar) {
    const newEventBtn = sidebar.createEl("button", {
      cls: "chronicle-new-task-btn",
      text: "New event"
    });
    newEventBtn.addEventListener("click", () => {
      new EventModal(
        this.app,
        this.eventManager,
        this.calendarManager,
        void 0,
        () => this.render()
      ).open();
    });
    this.renderMiniCalendar(sidebar);
    const calSection = sidebar.createDiv("chronicle-lists-section");
    calSection.createDiv("chronicle-section-label").setText("My Calendars");
    for (const cal of this.calendarManager.getAll()) {
      const row = calSection.createDiv("chronicle-cal-list-row");
      const toggle = row.createEl("input", { type: "checkbox", cls: "chronicle-cal-toggle" });
      toggle.checked = cal.isVisible;
      toggle.style.accentColor = CalendarManager.colorToHex(cal.color);
      toggle.addEventListener("change", () => {
        this.calendarManager.toggleVisibility(cal.id);
        this.render();
      });
      const dot = row.createDiv("chronicle-list-dot");
      dot.style.backgroundColor = CalendarManager.colorToHex(cal.color);
      row.createDiv("chronicle-list-name").setText(cal.name);
    }
  }
  renderMiniCalendar(parent) {
    const mini = parent.createDiv("chronicle-mini-cal");
    const header = mini.createDiv("chronicle-mini-cal-header");
    const prevBtn = header.createEl("button", { cls: "chronicle-mini-nav", text: "\u2039" });
    const monthLabel = header.createDiv("chronicle-mini-month-label");
    const nextBtn = header.createEl("button", { cls: "chronicle-mini-nav", text: "\u203A" });
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    monthLabel.setText(
      new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    );
    prevBtn.addEventListener("click", () => {
      this.currentDate = new Date(year, month - 1, 1);
      this.render();
    });
    nextBtn.addEventListener("click", () => {
      this.currentDate = new Date(year, month + 1, 1);
      this.render();
    });
    const grid = mini.createDiv("chronicle-mini-grid");
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    for (const d of ["S", "M", "T", "W", "T", "F", "S"])
      grid.createDiv("chronicle-mini-day-name").setText(d);
    for (let i = 0; i < firstDay; i++)
      grid.createDiv("chronicle-mini-day chronicle-mini-day-empty");
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEl = grid.createDiv("chronicle-mini-day");
      dayEl.setText(String(d));
      if (dateStr === todayStr) dayEl.addClass("today");
      dayEl.addEventListener("click", () => {
        this.currentDate = new Date(year, month, d);
        this.mode = "day";
        this.render();
      });
    }
  }
  // ── Toolbar ───────────────────────────────────────────────────────────────
  renderToolbar(main) {
    const toolbar = main.createDiv("chronicle-cal-toolbar");
    const navGroup = toolbar.createDiv("chronicle-cal-nav-group");
    navGroup.createEl("button", { cls: "chronicle-cal-nav-btn", text: "\u2039" }).addEventListener("click", () => this.navigate(-1));
    navGroup.createEl("button", { cls: "chronicle-cal-today-btn", text: "Today" }).addEventListener("click", () => {
      this.currentDate = /* @__PURE__ */ new Date();
      this.render();
    });
    navGroup.createEl("button", { cls: "chronicle-cal-nav-btn", text: "\u203A" }).addEventListener("click", () => this.navigate(1));
    toolbar.createDiv("chronicle-cal-toolbar-title").setText(this.getToolbarTitle());
    const pills = toolbar.createDiv("chronicle-view-pills");
    for (const [m, label] of [["day", "Day"], ["week", "Week"], ["month", "Month"], ["year", "Year"]]) {
      const pill = pills.createDiv("chronicle-view-pill");
      pill.setText(label);
      if (this.mode === m) pill.addClass("active");
      pill.addEventListener("click", () => {
        this.mode = m;
        this.render();
      });
    }
  }
  navigate(dir) {
    const d = new Date(this.currentDate);
    if (this.mode === "day") d.setDate(d.getDate() + dir);
    else if (this.mode === "week") d.setDate(d.getDate() + dir * 7);
    else if (this.mode === "year") d.setFullYear(d.getFullYear() + dir);
    else d.setMonth(d.getMonth() + dir);
    this.currentDate = d;
    this.render();
  }
  getToolbarTitle() {
    if (this.mode === "year") return String(this.currentDate.getFullYear());
    if (this.mode === "month") return this.currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (this.mode === "day") return this.currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const start = this.getWeekStart();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }
  getWeekStart() {
    const d = new Date(this.currentDate);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }
  // ── Year view ─────────────────────────────────────────────────────────────
  renderYearView(main, events, tasks) {
    const year = this.currentDate.getFullYear();
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const yearGrid = main.createDiv("chronicle-year-grid");
    for (let m = 0; m < 12; m++) {
      const card = yearGrid.createDiv("chronicle-year-month-card");
      const name = card.createDiv("chronicle-year-month-name");
      name.setText(new Date(year, m).toLocaleDateString("en-US", { month: "long" }));
      name.addEventListener("click", () => {
        this.currentDate = new Date(year, m, 1);
        this.mode = "month";
        this.render();
      });
      const miniGrid = card.createDiv("chronicle-year-mini-grid");
      const firstDay = new Date(year, m, 1).getDay();
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (const d of ["S", "M", "T", "W", "T", "F", "S"])
        miniGrid.createDiv("chronicle-year-day-name").setText(d);
      for (let i = 0; i < firstDay; i++)
        miniGrid.createDiv("chronicle-year-day-empty");
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const hasEvent = events.some((e) => e.startDate === dateStr && this.isCalendarVisible(e.calendarId));
        const hasTask = tasks.some((t) => t.dueDate === dateStr && t.status !== "done");
        const dayEl = miniGrid.createDiv("chronicle-year-day");
        dayEl.setText(String(d));
        if (dateStr === todayStr) dayEl.addClass("today");
        if (hasEvent) dayEl.addClass("has-event");
        if (hasTask) dayEl.addClass("has-task");
        dayEl.addEventListener("click", () => {
          this.currentDate = new Date(year, m, d);
          this.mode = "day";
          this.render();
        });
      }
    }
  }
  // ── Month view ────────────────────────────────────────────────────────────
  renderMonthView(main, events, tasks) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const grid = main.createDiv("chronicle-month-grid");
    for (const d of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])
      grid.createDiv("chronicle-month-day-name").setText(d);
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMon = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const cell = grid.createDiv("chronicle-month-cell chronicle-month-cell-other");
      cell.createDiv("chronicle-month-cell-num").setText(String(daysInPrevMon - i));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const cell = grid.createDiv("chronicle-month-cell");
      if (dateStr === todayStr) cell.addClass("today");
      cell.createDiv("chronicle-month-cell-num").setText(String(d));
      cell.addEventListener("dblclick", () => this.openNewEventModal(dateStr, true));
      cell.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        this.showCalContextMenu(e.clientX, e.clientY, dateStr, true);
      });
      events.filter((e) => e.startDate === dateStr && this.isCalendarVisible(e.calendarId)).slice(0, 3).forEach((event) => {
        var _a;
        const cal = this.calendarManager.getById((_a = event.calendarId) != null ? _a : "");
        const color = cal ? CalendarManager.colorToHex(cal.color) : "#378ADD";
        const pill = cell.createDiv("chronicle-month-event-pill");
        pill.style.backgroundColor = color + "33";
        pill.style.borderLeft = `3px solid ${color}`;
        pill.style.color = color;
        pill.setText(event.title);
        pill.addEventListener("click", (e) => {
          e.stopPropagation();
          new EventModal(this.app, this.eventManager, this.calendarManager, event, () => this.render()).open();
        });
      });
      tasks.filter((t) => t.dueDate === dateStr && t.status !== "done").slice(0, 2).forEach((task) => {
        const pill = cell.createDiv("chronicle-month-event-pill");
        pill.style.backgroundColor = "#FF3B3022";
        pill.style.borderLeft = "3px solid #FF3B30";
        pill.style.color = "#FF3B30";
        pill.setText("\u2713 " + task.title);
      });
    }
    const remaining = 7 - (firstDay + daysInMonth) % 7;
    if (remaining < 7)
      for (let d = 1; d <= remaining; d++) {
        const cell = grid.createDiv("chronicle-month-cell chronicle-month-cell-other");
        cell.createDiv("chronicle-month-cell-num").setText(String(d));
      }
  }
  // ── Week view ─────────────────────────────────────────────────────────────
  renderWeekView(main, events, tasks) {
    const weekStart = this.getWeekStart();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const calGrid = main.createDiv("chronicle-week-grid");
    const timeCol = calGrid.createDiv("chronicle-time-col");
    timeCol.createDiv("chronicle-time-col-header");
    const shelfSpacer = timeCol.createDiv("chronicle-time-col-shelf-spacer");
    shelfSpacer.setText("all-day");
    for (let h = 0; h < 24; h++)
      timeCol.createDiv("chronicle-time-slot").setText(this.formatHour(h));
    for (const day of days) {
      const dateStr = day.toISOString().split("T")[0];
      const col = calGrid.createDiv("chronicle-day-col");
      const allDayEvents = events.filter((e) => e.startDate === dateStr && e.allDay && this.isCalendarVisible(e.calendarId));
      const dayHeader = col.createDiv("chronicle-day-header");
      dayHeader.createDiv("chronicle-day-name").setText(
        day.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
      );
      const dayNum = dayHeader.createDiv("chronicle-day-num");
      dayNum.setText(String(day.getDate()));
      if (dateStr === todayStr) dayNum.addClass("today");
      const shelf = col.createDiv("chronicle-week-allday-shelf");
      for (const event of allDayEvents)
        this.renderEventPillAllDay(shelf, event);
      const timeGrid = col.createDiv("chronicle-day-time-grid");
      timeGrid.style.height = `${24 * HOUR_HEIGHT}px`;
      for (let h = 0; h < 24; h++) {
        const line = timeGrid.createDiv("chronicle-hour-line");
        line.style.top = `${h * HOUR_HEIGHT}px`;
      }
      timeGrid.addEventListener("dblclick", (e) => {
        const rect = timeGrid.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const hour = Math.min(Math.floor(y / HOUR_HEIGHT), 23);
        const minute = Math.floor(y % HOUR_HEIGHT / HOUR_HEIGHT * 60 / 15) * 15;
        this.openNewEventModal(dateStr, false, hour, minute);
      });
      timeGrid.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const rect = timeGrid.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const hour = Math.min(Math.floor(y / HOUR_HEIGHT), 23);
        const minute = Math.floor(y % HOUR_HEIGHT / HOUR_HEIGHT * 60 / 15) * 15;
        this.showCalContextMenu(e.clientX, e.clientY, dateStr, false, hour, minute);
      });
      events.filter((e) => e.startDate === dateStr && !e.allDay && e.startTime && this.isCalendarVisible(e.calendarId)).forEach((event) => this.renderEventPillTimed(timeGrid, event));
      tasks.filter((t) => t.dueDate === dateStr && t.status !== "done").forEach((task) => {
        const top = task.dueTime ? (() => {
          const [h, m] = task.dueTime.split(":").map(Number);
          return (h + m / 60) * HOUR_HEIGHT;
        })() : 0;
        const pill = timeGrid.createDiv("chronicle-task-day-pill");
        pill.style.top = `${top}px`;
        pill.style.backgroundColor = "#FF3B3022";
        pill.style.borderLeft = "3px solid #FF3B30";
        pill.style.color = "#FF3B30";
        pill.setText("\u2713 " + task.title);
      });
    }
    const now = /* @__PURE__ */ new Date();
    const nowStr = now.toISOString().split("T")[0];
    const todayColIdx = days.findIndex((d) => d.toISOString().split("T")[0] === nowStr);
    if (todayColIdx >= 0) {
      const cols = calGrid.querySelectorAll(".chronicle-day-col");
      const todayCol = cols[todayColIdx];
      const tg = todayCol.querySelector(".chronicle-day-time-grid");
      if (tg) {
        const top = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;
        const line = tg.createDiv("chronicle-now-line");
        line.style.top = `${top}px`;
      }
    }
  }
  // ── Day view ──────────────────────────────────────────────────────────────
  renderDayView(main, events, tasks) {
    const dateStr = this.currentDate.toISOString().split("T")[0];
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const allDayEvents = events.filter((e) => e.startDate === dateStr && e.allDay && this.isCalendarVisible(e.calendarId));
    const dayView = main.createDiv("chronicle-day-view");
    const dayHeader = dayView.createDiv("chronicle-day-view-header");
    dayHeader.createDiv("chronicle-day-name-large").setText(
      this.currentDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()
    );
    const numEl = dayHeader.createDiv("chronicle-day-num-large");
    numEl.setText(String(this.currentDate.getDate()));
    if (dateStr === todayStr) numEl.addClass("today");
    const shelf = dayView.createDiv("chronicle-day-allday-shelf");
    shelf.createDiv("chronicle-day-allday-label").setText("all-day");
    const shelfContent = shelf.createDiv("chronicle-day-allday-content");
    for (const event of allDayEvents)
      this.renderEventPillAllDay(shelfContent, event);
    const timeArea = dayView.createDiv("chronicle-day-single-area");
    const timeLabels = timeArea.createDiv("chronicle-day-single-labels");
    const eventCol = timeArea.createDiv("chronicle-day-single-events");
    eventCol.style.height = `${24 * HOUR_HEIGHT}px`;
    for (let h = 0; h < 24; h++) {
      timeLabels.createDiv("chronicle-time-slot").setText(this.formatHour(h));
      const line = eventCol.createDiv("chronicle-hour-line");
      line.style.top = `${h * HOUR_HEIGHT}px`;
    }
    eventCol.addEventListener("dblclick", (e) => {
      const rect = eventCol.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const hour = Math.min(Math.floor(y / HOUR_HEIGHT), 23);
      const minute = Math.floor(y % HOUR_HEIGHT / HOUR_HEIGHT * 60 / 15) * 15;
      this.openNewEventModal(dateStr, false, hour, minute);
    });
    eventCol.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const rect = eventCol.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const hour = Math.min(Math.floor(y / HOUR_HEIGHT), 23);
      const minute = Math.floor(y % HOUR_HEIGHT / HOUR_HEIGHT * 60 / 15) * 15;
      this.showCalContextMenu(e.clientX, e.clientY, dateStr, false, hour, minute);
    });
    events.filter((e) => e.startDate === dateStr && !e.allDay && e.startTime && this.isCalendarVisible(e.calendarId)).forEach((event) => this.renderEventPillTimed(eventCol, event));
    tasks.filter((t) => t.dueDate === dateStr && t.status !== "done").forEach((task) => {
      const top = task.dueTime ? (() => {
        const [h, m] = task.dueTime.split(":").map(Number);
        return (h + m / 60) * HOUR_HEIGHT;
      })() : 0;
      const pill = eventCol.createDiv("chronicle-task-day-pill");
      pill.style.top = `${top}px`;
      pill.style.backgroundColor = "#FF3B3022";
      pill.style.borderLeft = "3px solid #FF3B30";
      pill.style.color = "#FF3B30";
      pill.setText("\u2713 " + task.title);
    });
    if (dateStr === todayStr) {
      const now = /* @__PURE__ */ new Date();
      const top = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;
      const line = eventCol.createDiv("chronicle-now-line");
      line.style.top = `${top}px`;
    }
  }
  // ── Helpers ───────────────────────────────────────────────────────────────
  openNewEventModal(dateStr, allDay, hour = 9, minute = 0) {
    const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const endStr = `${String(Math.min(hour + 1, 23)).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    new EventModal(
      this.app,
      this.eventManager,
      this.calendarManager,
      {
        id: "",
        title: "",
        allDay,
        startDate: dateStr,
        startTime: allDay ? void 0 : timeStr,
        endDate: dateStr,
        endTime: allDay ? void 0 : endStr,
        alert: "none",
        linkedTaskIds: [],
        completedInstances: [],
        createdAt: ""
      },
      () => this.render()
    ).open();
  }
  showEventContextMenu(x, y, event) {
    const menu = document.createElement("div");
    menu.className = "chronicle-context-menu";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    const editItem = menu.createDiv("chronicle-context-item");
    editItem.setText("Edit event");
    editItem.addEventListener("click", () => {
      menu.remove();
      new EventModal(this.app, this.eventManager, this.calendarManager, event, () => this.render()).open();
    });
    const deleteItem = menu.createDiv("chronicle-context-item chronicle-context-delete");
    deleteItem.setText("Delete event");
    deleteItem.addEventListener("click", async () => {
      menu.remove();
      await this.eventManager.delete(event.id);
      this.render();
    });
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
  }
  showCalContextMenu(x, y, dateStr, allDay, hour = 9, minute = 0) {
    const menu = document.createElement("div");
    menu.className = "chronicle-context-menu";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    const addItem = menu.createDiv("chronicle-context-item");
    addItem.setText("New event here");
    addItem.addEventListener("click", () => {
      menu.remove();
      this.openNewEventModal(dateStr, allDay, hour, minute);
    });
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
  }
  renderEventPillTimed(container, event) {
    var _a, _b, _c;
    const [sh, sm] = ((_a = event.startTime) != null ? _a : "09:00").split(":").map(Number);
    const [eh, em] = ((_b = event.endTime) != null ? _b : "10:00").split(":").map(Number);
    const top = (sh + sm / 60) * HOUR_HEIGHT;
    const height = Math.max((eh - sh + (em - sm) / 60) * HOUR_HEIGHT, 22);
    const cal = this.calendarManager.getById((_c = event.calendarId) != null ? _c : "");
    const color = cal ? CalendarManager.colorToHex(cal.color) : "#378ADD";
    const pill = container.createDiv("chronicle-event-pill");
    pill.style.top = `${top}px`;
    pill.style.height = `${height}px`;
    pill.style.backgroundColor = color + "33";
    pill.style.borderLeft = `3px solid ${color}`;
    pill.style.color = color;
    pill.createDiv("chronicle-event-pill-title").setText(event.title);
    if (height > 36 && event.startTime)
      pill.createDiv("chronicle-event-pill-time").setText(this.formatTime(event.startTime));
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      new EventModal(this.app, this.eventManager, this.calendarManager, event, () => this.render()).open();
    });
    pill.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showEventContextMenu(e.clientX, e.clientY, event);
    });
  }
  renderEventPillAllDay(container, event) {
    var _a;
    const cal = this.calendarManager.getById((_a = event.calendarId) != null ? _a : "");
    const color = cal ? CalendarManager.colorToHex(cal.color) : "#378ADD";
    const pill = container.createDiv("chronicle-event-pill-allday");
    pill.style.backgroundColor = color + "33";
    pill.style.borderLeft = `3px solid ${color}`;
    pill.style.color = color;
    pill.setText(event.title);
    pill.addEventListener(
      "click",
      () => new EventModal(this.app, this.eventManager, this.calendarManager, event, () => this.render()).open()
    );
    pill.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showEventContextMenu(e.clientX, e.clientY, event);
    });
  }
  isCalendarVisible(calendarId) {
    var _a, _b;
    if (!calendarId) return true;
    return (_b = (_a = this.calendarManager.getById(calendarId)) == null ? void 0 : _a.isVisible) != null ? _b : true;
  }
  formatHour(h) {
    if (h === 0) return "12 AM";
    if (h < 12) return `${h} AM`;
    if (h === 12) return "12 PM";
    return `${h - 12} PM`;
  }
  formatTime(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  }
};

// src/main.ts
var ChroniclePlugin = class extends import_obsidian7.Plugin {
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
    this.registerView(
      CALENDAR_VIEW_TYPE,
      (leaf) => new CalendarView(leaf, this.eventManager, this.taskManager, this.calendarManager)
    );
    this.addRibbonIcon("check-circle", "Chronicle Tasks", () => this.activateTaskView());
    this.addRibbonIcon("calendar", "Chronicle Calendar", () => this.activateCalendarView());
    this.addCommand({
      id: "open-chronicle",
      name: "Open task dashboard",
      callback: () => this.activateTaskView()
    });
    this.addCommand({
      id: "open-calendar",
      name: "Open calendar",
      callback: () => this.activateCalendarView()
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
  async activateTaskView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(TASK_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: TASK_VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }
  async activateCalendarView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(CALENDAR_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: CALENDAR_VIEW_TYPE, active: true });
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
    this.app.workspace.detachLeavesOfType(CALENDAR_VIEW_TYPE);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3R5cGVzL2luZGV4LnRzIiwgInNyYy9kYXRhL0NhbGVuZGFyTWFuYWdlci50cyIsICJzcmMvZGF0YS9UYXNrTWFuYWdlci50cyIsICJzcmMvZGF0YS9FdmVudE1hbmFnZXIudHMiLCAic3JjL3ZpZXdzL1Rhc2tWaWV3LnRzIiwgInNyYy92aWV3cy9UYXNrRm9ybVZpZXcudHMiLCAic3JjL3ZpZXdzL0NhbGVuZGFyVmlldy50cyIsICJzcmMvdWkvRXZlbnRNb2RhbC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgUGx1Z2luLCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVTZXR0aW5ncywgREVGQVVMVF9TRVRUSU5HUyB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi9kYXRhL0NhbGVuZGFyTWFuYWdlclwiO1xuaW1wb3J0IHsgVGFza01hbmFnZXIgfSBmcm9tIFwiLi9kYXRhL1Rhc2tNYW5hZ2VyXCI7XG5pbXBvcnQgeyBFdmVudE1hbmFnZXIgfSBmcm9tIFwiLi9kYXRhL0V2ZW50TWFuYWdlclwiO1xuaW1wb3J0IHsgVGFza1ZpZXcsIFRBU0tfVklFV19UWVBFIH0gZnJvbSBcIi4vdmlld3MvVGFza1ZpZXdcIjtcbmltcG9ydCB7IFRhc2tGb3JtVmlldywgVEFTS19GT1JNX1ZJRVdfVFlQRSB9IGZyb20gXCIuL3ZpZXdzL1Rhc2tGb3JtVmlld1wiO1xuaW1wb3J0IHsgQ2FsZW5kYXJWaWV3LCBDQUxFTkRBUl9WSUVXX1RZUEUgfSBmcm9tIFwiLi92aWV3cy9DYWxlbmRhclZpZXdcIjtcbmltcG9ydCB7IEV2ZW50TW9kYWwgfSBmcm9tIFwiLi91aS9FdmVudE1vZGFsXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENocm9uaWNsZVBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBDaHJvbmljbGVTZXR0aW5ncztcbiAgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXI7XG4gIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcjtcbiAgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXI7XG5cbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IG5ldyBDYWxlbmRhck1hbmFnZXIoXG4gICAgICB0aGlzLnNldHRpbmdzLmNhbGVuZGFycyxcbiAgICAgICgpID0+IHRoaXMuc2F2ZVNldHRpbmdzKClcbiAgICApO1xuICAgIHRoaXMudGFza01hbmFnZXIgID0gbmV3IFRhc2tNYW5hZ2VyKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLnRhc2tzRm9sZGVyKTtcbiAgICB0aGlzLmV2ZW50TWFuYWdlciA9IG5ldyBFdmVudE1hbmFnZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MuZXZlbnRzRm9sZGVyKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KFxuICAgICAgVEFTS19WSUVXX1RZUEUsXG4gICAgICAobGVhZikgPT4gbmV3IFRhc2tWaWV3KGxlYWYsIHRoaXMudGFza01hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzLmV2ZW50TWFuYWdlcilcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJWaWV3KFxuICAgICAgVEFTS19GT1JNX1ZJRVdfVFlQRSxcbiAgICAgIChsZWFmKSA9PiBuZXcgVGFza0Zvcm1WaWV3KGxlYWYsIHRoaXMudGFza01hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlclZpZXcoXG4gICAgICBDQUxFTkRBUl9WSUVXX1RZUEUsXG4gICAgICAobGVhZikgPT4gbmV3IENhbGVuZGFyVmlldyhsZWFmLCB0aGlzLmV2ZW50TWFuYWdlciwgdGhpcy50YXNrTWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIpXG4gICAgKTtcblxuICAgIC8vIFJpYmJvbiBcdTIwMTQgdGFza3MgKGNoZWNrbGlzdCBpY29uKVxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcImNoZWNrLWNpcmNsZVwiLCBcIkNocm9uaWNsZSBUYXNrc1wiLCAoKSA9PiB0aGlzLmFjdGl2YXRlVGFza1ZpZXcoKSk7XG5cbiAgICAvLyBSaWJib24gXHUyMDE0IGNhbGVuZGFyXG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwiY2FsZW5kYXJcIiwgXCJDaHJvbmljbGUgQ2FsZW5kYXJcIiwgKCkgPT4gdGhpcy5hY3RpdmF0ZUNhbGVuZGFyVmlldygpKTtcblxuICAgIC8vIENvbW1hbmRzXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9wZW4tY2hyb25pY2xlXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gdGFzayBkYXNoYm9hcmRcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLmFjdGl2YXRlVGFza1ZpZXcoKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib3Blbi1jYWxlbmRhclwiLFxuICAgICAgbmFtZTogXCJPcGVuIGNhbGVuZGFyXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5hY3RpdmF0ZUNhbGVuZGFyVmlldygpLFxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJuZXctdGFza1wiLFxuICAgICAgbmFtZTogXCJOZXcgdGFza1wiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIl0sIGtleTogXCJuXCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5vcGVuVGFza0Zvcm0oKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibmV3LWV2ZW50XCIsXG4gICAgICBuYW1lOiBcIk5ldyBldmVudFwiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIm5cIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm9wZW5FdmVudE1vZGFsKCksXG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZyhcIkNocm9uaWNsZSBsb2FkZWQgXHUyNzEzXCIpO1xuICB9XG5cbiAgYXN5bmMgYWN0aXZhdGVUYXNrVmlldygpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgbGV0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfVklFV19UWVBFKVswXTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogVEFTS19WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBhc3luYyBhY3RpdmF0ZUNhbGVuZGFyVmlldygpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgbGV0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKENBTEVOREFSX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IENBTEVOREFSX1ZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIH1cbiAgICB3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5UYXNrRm9ybSgpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfRk9STV9WSUVXX1RZUEUpWzBdO1xuICAgIGlmIChleGlzdGluZykgZXhpc3RpbmcuZGV0YWNoKCk7XG4gICAgY29uc3QgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogVEFTS19GT1JNX1ZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgb3BlbkV2ZW50TW9kYWwoKSB7XG4gICAgbmV3IEV2ZW50TW9kYWwoXG4gICAgICB0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLFxuICAgICAgdW5kZWZpbmVkLCAoKSA9PiB7fVxuICAgICkub3BlbigpO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShUQVNLX1ZJRVdfVFlQRSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShUQVNLX0ZPUk1fVklFV19UWVBFKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKENBTEVOREFSX1ZJRVdfVFlQRSk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxufSIsICIvLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2FsZW5kYXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgdHlwZSBDYWxlbmRhckNvbG9yID1cbiAgfCBcImJsdWVcIiB8IFwiZ3JlZW5cIiB8IFwicHVycGxlXCIgfCBcIm9yYW5nZVwiXG4gIHwgXCJyZWRcIiB8IFwidGVhbFwiIHwgXCJwaW5rXCIgfCBcInllbGxvd1wiIHwgXCJncmF5XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hyb25pY2xlQ2FsZW5kYXIge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbG9yOiBDYWxlbmRhckNvbG9yO1xuICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgaXNWaXNpYmxlOiBib29sZWFuO1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFRhc2tzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgdHlwZSBUYXNrU3RhdHVzID0gXCJ0b2RvXCIgfCBcImluLXByb2dyZXNzXCIgfCBcImRvbmVcIiB8IFwiY2FuY2VsbGVkXCI7XG5leHBvcnQgdHlwZSBUYXNrUHJpb3JpdHkgPSBcIm5vbmVcIiB8IFwibG93XCIgfCBcIm1lZGl1bVwiIHwgXCJoaWdoXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGltZUVudHJ5IHtcbiAgc3RhcnRUaW1lOiBzdHJpbmc7ICAgLy8gSVNPIDg2MDFcbiAgZW5kVGltZT86IHN0cmluZzsgICAgLy8gSVNPIDg2MDFcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDdXN0b21GaWVsZCB7XG4gIGtleTogc3RyaW5nO1xuICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVUYXNrIHtcbiAgLy8gLS0tIENvcmUgLS0tXG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHN0YXR1czogVGFza1N0YXR1cztcbiAgcHJpb3JpdHk6IFRhc2tQcmlvcml0eTtcblxuICAvLyAtLS0gU2NoZWR1bGluZyAtLS1cbiAgZHVlRGF0ZT86IHN0cmluZzsgICAgICAgLy8gWVlZWS1NTS1ERFxuICBkdWVUaW1lPzogc3RyaW5nOyAgICAgICAvLyBISDptbVxuICByZWN1cnJlbmNlPzogc3RyaW5nOyAgICAvLyBSUlVMRSBzdHJpbmcgZS5nLiBcIkZSRVE9V0VFS0xZO0JZREFZPU1PXCJcblxuICAvLyAtLS0gT3JnYW5pc2F0aW9uIC0tLVxuICBjYWxlbmRhcklkPzogc3RyaW5nOyAgICAvLyBsaW5rcyB0byBhIENocm9uaWNsZUNhbGVuZGFyXG4gIHRhZ3M6IHN0cmluZ1tdO1xuICBjb250ZXh0czogc3RyaW5nW107ICAgICAvLyBlLmcuIFtcIkBob21lXCIsIFwiQHdvcmtcIl1cbiAgbGlua2VkTm90ZXM6IHN0cmluZ1tdOyAgLy8gd2lraWxpbmsgcGF0aHMgZS5nLiBbXCJQcm9qZWN0cy9XZWJzaXRlXCJdXG4gIHByb2plY3RzOiBzdHJpbmdbXTtcblxuICAvLyAtLS0gVGltZSB0cmFja2luZyAtLS1cbiAgdGltZUVzdGltYXRlPzogbnVtYmVyOyAgLy8gbWludXRlc1xuICB0aW1lRW50cmllczogVGltZUVudHJ5W107XG5cbiAgLy8gLS0tIEN1c3RvbSAtLS1cbiAgY3VzdG9tRmllbGRzOiBDdXN0b21GaWVsZFtdO1xuXG4gIC8vIC0tLSBSZWN1cnJlbmNlIGNvbXBsZXRpb24gLS0tXG4gIGNvbXBsZXRlZEluc3RhbmNlczogc3RyaW5nW107IC8vIFlZWVktTU0tREQgZGF0ZXNcblxuICAvLyAtLS0gTWV0YSAtLS1cbiAgY3JlYXRlZEF0OiBzdHJpbmc7ICAgICAgLy8gSVNPIDg2MDFcbiAgY29tcGxldGVkQXQ/OiBzdHJpbmc7ICAgLy8gSVNPIDg2MDFcbiAgbm90ZXM/OiBzdHJpbmc7ICAgICAgICAgLy8gYm9keSBjb250ZW50IG9mIHRoZSBub3RlXG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBFdmVudHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIEFsZXJ0T2Zmc2V0ID1cbiAgfCBcIm5vbmVcIlxuICB8IFwiYXQtdGltZVwiXG4gIHwgXCI1bWluXCIgfCBcIjEwbWluXCIgfCBcIjE1bWluXCIgfCBcIjMwbWluXCJcbiAgfCBcIjFob3VyXCIgfCBcIjJob3Vyc1wiXG4gIHwgXCIxZGF5XCIgfCBcIjJkYXlzXCIgfCBcIjF3ZWVrXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hyb25pY2xlRXZlbnQge1xuICAvLyAtLS0gQ29yZSAoaW4gZm9ybSBvcmRlcikgLS0tXG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGxvY2F0aW9uPzogc3RyaW5nO1xuICBhbGxEYXk6IGJvb2xlYW47XG4gIHN0YXJ0RGF0ZTogc3RyaW5nOyAgICAgIC8vIFlZWVktTU0tRERcbiAgc3RhcnRUaW1lPzogc3RyaW5nOyAgICAgLy8gSEg6bW0gICh1bmRlZmluZWQgd2hlbiBhbGxEYXkpXG4gIGVuZERhdGU6IHN0cmluZzsgICAgICAgIC8vIFlZWVktTU0tRERcbiAgZW5kVGltZT86IHN0cmluZzsgICAgICAgLy8gSEg6bW0gICh1bmRlZmluZWQgd2hlbiBhbGxEYXkpXG4gIHJlY3VycmVuY2U/OiBzdHJpbmc7ICAgIC8vIFJSVUxFIHN0cmluZ1xuICBjYWxlbmRhcklkPzogc3RyaW5nOyAgICAvLyBsaW5rcyB0byBhIENocm9uaWNsZUNhbGVuZGFyXG4gIGFsZXJ0OiBBbGVydE9mZnNldDtcbiAgbm90ZXM/OiBzdHJpbmc7ICAgICAgICAgLy8gYm9keSBjb250ZW50IG9mIHRoZSBub3RlXG5cbiAgLy8gLS0tIENvbm5lY3Rpb25zIC0tLVxuICBsaW5rZWRUYXNrSWRzOiBzdHJpbmdbXTsgICAvLyBDaHJvbmljbGUgdGFzayBJRHNcblxuICAvLyAtLS0gTWV0YSAtLS1cbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG4gIGNvbXBsZXRlZEluc3RhbmNlczogc3RyaW5nW107XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBQbHVnaW4gc2V0dGluZ3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hyb25pY2xlU2V0dGluZ3Mge1xuICAvLyBGb2xkZXIgcGF0aHNcbiAgdGFza3NGb2xkZXI6IHN0cmluZztcbiAgZXZlbnRzRm9sZGVyOiBzdHJpbmc7XG5cbiAgLy8gQ2FsZW5kYXJzIChzdG9yZWQgaW4gc2V0dGluZ3MsIG5vdCBhcyBmaWxlcylcbiAgY2FsZW5kYXJzOiBDaHJvbmljbGVDYWxlbmRhcltdO1xuICBkZWZhdWx0Q2FsZW5kYXJJZDogc3RyaW5nO1xuXG4gIC8vIERlZmF1bHRzXG4gIGRlZmF1bHRUYXNrU3RhdHVzOiBUYXNrU3RhdHVzO1xuICBkZWZhdWx0VGFza1ByaW9yaXR5OiBUYXNrUHJpb3JpdHk7XG4gIGRlZmF1bHRBbGVydDogQWxlcnRPZmZzZXQ7XG5cbiAgLy8gRGlzcGxheVxuICBzdGFydE9mV2VlazogMCB8IDEgfCA2OyAgLy8gMD1TdW4sIDE9TW9uLCA2PVNhdFxuICB0aW1lRm9ybWF0OiBcIjEyaFwiIHwgXCIyNGhcIjtcbiAgZGVmYXVsdENhbGVuZGFyVmlldzogXCJkYXlcIiB8IFwid2Vla1wiIHwgXCJtb250aFwiIHwgXCJ5ZWFyXCI7XG5cbiAgLy8gU21hcnQgbGlzdHMgdmlzaWJpbGl0eVxuICBzaG93VG9kYXlDb3VudDogYm9vbGVhbjtcbiAgc2hvd1NjaGVkdWxlZENvdW50OiBib29sZWFuO1xuICBzaG93RmxhZ2dlZENvdW50OiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogQ2hyb25pY2xlU2V0dGluZ3MgPSB7XG4gIHRhc2tzRm9sZGVyOiBcIkNocm9uaWNsZS9UYXNrc1wiLFxuICBldmVudHNGb2xkZXI6IFwiQ2hyb25pY2xlL0V2ZW50c1wiLFxuICBjYWxlbmRhcnM6IFtcbiAgICB7IGlkOiBcInBlcnNvbmFsXCIsIG5hbWU6IFwiUGVyc29uYWxcIiwgY29sb3I6IFwiYmx1ZVwiLCAgIGlzVmlzaWJsZTogdHJ1ZSwgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSxcbiAgICB7IGlkOiBcIndvcmtcIiwgICAgIG5hbWU6IFwiV29ya1wiLCAgICAgY29sb3I6IFwiZ3JlZW5cIiwgIGlzVmlzaWJsZTogdHJ1ZSwgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSxcbiAgXSxcbiAgZGVmYXVsdENhbGVuZGFySWQ6IFwicGVyc29uYWxcIixcbiAgZGVmYXVsdFRhc2tTdGF0dXM6IFwidG9kb1wiLFxuICBkZWZhdWx0VGFza1ByaW9yaXR5OiBcIm5vbmVcIixcbiAgZGVmYXVsdEFsZXJ0OiBcIm5vbmVcIixcbiAgc3RhcnRPZldlZWs6IDAsXG4gIHRpbWVGb3JtYXQ6IFwiMTJoXCIsXG4gIGRlZmF1bHRDYWxlbmRhclZpZXc6IFwid2Vla1wiLFxuICBzaG93VG9kYXlDb3VudDogdHJ1ZSxcbiAgc2hvd1NjaGVkdWxlZENvdW50OiB0cnVlLFxuICBzaG93RmxhZ2dlZENvdW50OiB0cnVlLFxufTsiLCAiaW1wb3J0IHsgQ2hyb25pY2xlQ2FsZW5kYXIsIENhbGVuZGFyQ29sb3IgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIENhbGVuZGFyTWFuYWdlciB7XG4gIHByaXZhdGUgY2FsZW5kYXJzOiBDaHJvbmljbGVDYWxlbmRhcltdO1xuICBwcml2YXRlIG9uVXBkYXRlOiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGNhbGVuZGFyczogQ2hyb25pY2xlQ2FsZW5kYXJbXSwgb25VcGRhdGU6ICgpID0+IHZvaWQpIHtcbiAgICB0aGlzLmNhbGVuZGFycyA9IGNhbGVuZGFycztcbiAgICB0aGlzLm9uVXBkYXRlID0gb25VcGRhdGU7XG4gIH1cblxuICBnZXRBbGwoKTogQ2hyb25pY2xlQ2FsZW5kYXJbXSB7XG4gICAgcmV0dXJuIFsuLi50aGlzLmNhbGVuZGFyc107XG4gIH1cblxuICBnZXRCeUlkKGlkOiBzdHJpbmcpOiBDaHJvbmljbGVDYWxlbmRhciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY2FsZW5kYXJzLmZpbmQoKGMpID0+IGMuaWQgPT09IGlkKTtcbiAgfVxuXG4gIGNyZWF0ZShuYW1lOiBzdHJpbmcsIGNvbG9yOiBDYWxlbmRhckNvbG9yKTogQ2hyb25pY2xlQ2FsZW5kYXIge1xuICAgIGNvbnN0IGNhbGVuZGFyOiBDaHJvbmljbGVDYWxlbmRhciA9IHtcbiAgICAgIGlkOiB0aGlzLmdlbmVyYXRlSWQobmFtZSksXG4gICAgICBuYW1lLFxuICAgICAgY29sb3IsXG4gICAgICBpc1Zpc2libGU6IHRydWUsXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuICAgIHRoaXMuY2FsZW5kYXJzLnB1c2goY2FsZW5kYXIpO1xuICAgIHRoaXMub25VcGRhdGUoKTtcbiAgICByZXR1cm4gY2FsZW5kYXI7XG4gIH1cblxuICB1cGRhdGUoaWQ6IHN0cmluZywgY2hhbmdlczogUGFydGlhbDxDaHJvbmljbGVDYWxlbmRhcj4pOiB2b2lkIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLmNhbGVuZGFycy5maW5kSW5kZXgoKGMpID0+IGMuaWQgPT09IGlkKTtcbiAgICBpZiAoaWR4ID09PSAtMSkgcmV0dXJuO1xuICAgIHRoaXMuY2FsZW5kYXJzW2lkeF0gPSB7IC4uLnRoaXMuY2FsZW5kYXJzW2lkeF0sIC4uLmNoYW5nZXMgfTtcbiAgICB0aGlzLm9uVXBkYXRlKCk7XG4gIH1cblxuICBkZWxldGUoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuY2FsZW5kYXJzID0gdGhpcy5jYWxlbmRhcnMuZmlsdGVyKChjKSA9PiBjLmlkICE9PSBpZCk7XG4gICAgdGhpcy5vblVwZGF0ZSgpO1xuICB9XG5cbiAgdG9nZ2xlVmlzaWJpbGl0eShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhcnMuZmluZCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICAgIGlmIChjYWwpIHtcbiAgICAgIGNhbC5pc1Zpc2libGUgPSAhY2FsLmlzVmlzaWJsZTtcbiAgICAgIHRoaXMub25VcGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZXR1cm5zIENTUyBoZXggY29sb3IgZm9yIGEgQ2FsZW5kYXJDb2xvciBuYW1lXG4gIHN0YXRpYyBjb2xvclRvSGV4KGNvbG9yOiBDYWxlbmRhckNvbG9yKTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXA6IFJlY29yZDxDYWxlbmRhckNvbG9yLCBzdHJpbmc+ID0ge1xuICAgICAgYmx1ZTogICBcIiMzNzhBRERcIixcbiAgICAgIGdyZWVuOiAgXCIjMzRDNzU5XCIsXG4gICAgICBwdXJwbGU6IFwiI0FGNTJERVwiLFxuICAgICAgb3JhbmdlOiBcIiNGRjk1MDBcIixcbiAgICAgIHJlZDogICAgXCIjRkYzQjMwXCIsXG4gICAgICB0ZWFsOiAgIFwiIzMwQjBDN1wiLFxuICAgICAgcGluazogICBcIiNGRjJENTVcIixcbiAgICAgIHllbGxvdzogXCIjRkZENjBBXCIsXG4gICAgICBncmF5OiAgIFwiIzhFOEU5M1wiLFxuICAgIH07XG4gICAgcmV0dXJuIG1hcFtjb2xvcl07XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBiYXNlID0gbmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgXCItXCIpLnJlcGxhY2UoL1teYS16MC05LV0vZywgXCJcIik7XG4gICAgY29uc3Qgc3VmZml4ID0gRGF0ZS5ub3coKS50b1N0cmluZygzNik7XG4gICAgcmV0dXJuIGAke2Jhc2V9LSR7c3VmZml4fWA7XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBURmlsZSwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlVGFzaywgVGFza1N0YXR1cywgVGFza1ByaW9yaXR5IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBUYXNrTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwOiBBcHAsIHByaXZhdGUgdGFza3NGb2xkZXI6IHN0cmluZykge31cblxuICAvLyBcdTI1MDBcdTI1MDAgUmVhZCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBnZXRBbGwoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCBmb2xkZXIgPSB0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy50YXNrc0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBbXTtcblxuICAgIGNvbnN0IHRhc2tzOiBDaHJvbmljbGVUYXNrW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbiAgICAgICAgY29uc3QgdGFzayA9IGF3YWl0IHRoaXMuZmlsZVRvVGFzayhjaGlsZCk7XG4gICAgICAgIGlmICh0YXNrKSB0YXNrcy5wdXNoKHRhc2spO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFza3M7XG4gIH1cblxuICBhc3luYyBnZXRCeUlkKGlkOiBzdHJpbmcpOiBQcm9taXNlPENocm9uaWNsZVRhc2sgfCBudWxsPiB7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbmQoKHQpID0+IHQuaWQgPT09IGlkKSA/PyBudWxsO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFdyaXRlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIGFzeW5jIGNyZWF0ZSh0YXNrOiBPbWl0PENocm9uaWNsZVRhc2ssIFwiaWRcIiB8IFwiY3JlYXRlZEF0XCI+KTogUHJvbWlzZTxDaHJvbmljbGVUYXNrPiB7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoKTtcblxuICAgIGNvbnN0IGZ1bGw6IENocm9uaWNsZVRhc2sgPSB7XG4gICAgICAuLi50YXNrLFxuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZCgpLFxuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIGNvbnN0IHBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMudGFza3NGb2xkZXJ9LyR7ZnVsbC50aXRsZX0ubWRgKTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgdGhpcy50YXNrVG9NYXJrZG93bihmdWxsKSk7XG4gICAgcmV0dXJuIGZ1bGw7XG4gIH1cblxuICBhc3luYyB1cGRhdGUodGFzazogQ2hyb25pY2xlVGFzayk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbmRGaWxlRm9yVGFzayh0YXNrLmlkKTtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcblxuICAgIC8vIElmIHRpdGxlIGNoYW5nZWQsIHJlbmFtZSB0aGUgZmlsZVxuICAgIGNvbnN0IGV4cGVjdGVkUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy50YXNrc0ZvbGRlcn0vJHt0YXNrLnRpdGxlfS5tZGApO1xuICAgIGlmIChmaWxlLnBhdGggIT09IGV4cGVjdGVkUGF0aCkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAuZmlsZU1hbmFnZXIucmVuYW1lRmlsZShmaWxlLCBleHBlY3RlZFBhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZUJ5UGF0aChleHBlY3RlZFBhdGgpID8/IGZpbGU7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KHVwZGF0ZWRGaWxlLCB0aGlzLnRhc2tUb01hcmtkb3duKHRhc2spKTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZShpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JUYXNrKGlkKTtcbiAgICBpZiAoZmlsZSkgYXdhaXQgdGhpcy5hcHAudmF1bHQuZGVsZXRlKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgbWFya0NvbXBsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0YXNrID0gYXdhaXQgdGhpcy5nZXRCeUlkKGlkKTtcbiAgICBpZiAoIXRhc2spIHJldHVybjtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7XG4gICAgICAuLi50YXNrLFxuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIGNvbXBsZXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfSk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRmlsdGVycyAodXNlZCBieSBzbWFydCBsaXN0cykgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgZ2V0RHVlVG9kYXkoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCB0b2RheSA9IHRoaXMudG9kYXlTdHIoKTtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKFxuICAgICAgKHQpID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIiAmJiB0LnN0YXR1cyAhPT0gXCJjYW5jZWxsZWRcIiAmJiB0LmR1ZURhdGUgPT09IHRvZGF5XG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldE92ZXJkdWUoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCB0b2RheSA9IHRoaXMudG9kYXlTdHIoKTtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKFxuICAgICAgKHQpID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIiAmJiB0LnN0YXR1cyAhPT0gXCJjYW5jZWxsZWRcIiAmJiAhIXQuZHVlRGF0ZSAmJiB0LmR1ZURhdGUgPCB0b2RheVxuICAgICk7XG4gIH1cblxuICBhc3luYyBnZXRTY2hlZHVsZWQoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKFxuICAgICAgKHQpID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIiAmJiB0LnN0YXR1cyAhPT0gXCJjYW5jZWxsZWRcIiAmJiAhIXQuZHVlRGF0ZVxuICAgICk7XG4gIH1cblxuICBhc3luYyBnZXRGbGFnZ2VkKCk6IFByb21pc2U8Q2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcigodCkgPT4gdC5wcmlvcml0eSA9PT0gXCJoaWdoXCIgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTZXJpYWxpc2F0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgdGFza1RvTWFya2Rvd24odGFzazogQ2hyb25pY2xlVGFzayk6IHN0cmluZyB7XG4gICAgY29uc3QgZm06IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgICAgaWQ6ICAgICAgICAgICAgICAgICB0YXNrLmlkLFxuICAgICAgdGl0bGU6ICAgICAgICAgICAgICB0YXNrLnRpdGxlLFxuICAgICAgc3RhdHVzOiAgICAgICAgICAgICB0YXNrLnN0YXR1cyxcbiAgICAgIHByaW9yaXR5OiAgICAgICAgICAgdGFzay5wcmlvcml0eSxcbiAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgdGFzay50YWdzLFxuICAgICAgY29udGV4dHM6ICAgICAgICAgICB0YXNrLmNvbnRleHRzLFxuICAgICAgcHJvamVjdHM6ICAgICAgICAgICB0YXNrLnByb2plY3RzLFxuICAgICAgXCJsaW5rZWQtbm90ZXNcIjogICAgIHRhc2subGlua2VkTm90ZXMsXG4gICAgICBcImNhbGVuZGFyLWlkXCI6ICAgICAgdGFzay5jYWxlbmRhcklkID8/IG51bGwsXG4gICAgICBcImR1ZS1kYXRlXCI6ICAgICAgICAgdGFzay5kdWVEYXRlID8/IG51bGwsXG4gICAgICBcImR1ZS10aW1lXCI6ICAgICAgICAgdGFzay5kdWVUaW1lID8/IG51bGwsXG4gICAgICByZWN1cnJlbmNlOiAgICAgICAgIHRhc2sucmVjdXJyZW5jZSA/PyBudWxsLFxuICAgICAgXCJ0aW1lLWVzdGltYXRlXCI6ICAgIHRhc2sudGltZUVzdGltYXRlID8/IG51bGwsXG4gICAgICBcInRpbWUtZW50cmllc1wiOiAgICAgdGFzay50aW1lRW50cmllcyxcbiAgICAgIFwiY3VzdG9tLWZpZWxkc1wiOiAgICB0YXNrLmN1c3RvbUZpZWxkcyxcbiAgICAgIFwiY29tcGxldGVkLWluc3RhbmNlc1wiOiB0YXNrLmNvbXBsZXRlZEluc3RhbmNlcyxcbiAgICAgIFwiY3JlYXRlZC1hdFwiOiAgICAgICB0YXNrLmNyZWF0ZWRBdCxcbiAgICAgIFwiY29tcGxldGVkLWF0XCI6ICAgICB0YXNrLmNvbXBsZXRlZEF0ID8/IG51bGwsXG4gICAgfTtcblxuICAgIGNvbnN0IHlhbWwgPSBPYmplY3QuZW50cmllcyhmbSlcbiAgICAgIC5tYXAoKFtrLCB2XSkgPT4gYCR7a306ICR7SlNPTi5zdHJpbmdpZnkodil9YClcbiAgICAgIC5qb2luKFwiXFxuXCIpO1xuXG4gICAgY29uc3QgYm9keSA9IHRhc2subm90ZXMgPyBgXFxuJHt0YXNrLm5vdGVzfWAgOiBcIlwiO1xuICAgIHJldHVybiBgLS0tXFxuJHt5YW1sfVxcbi0tLVxcbiR7Ym9keX1gO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBmaWxlVG9UYXNrKGZpbGU6IFRGaWxlKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrIHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgICAgY29uc3QgZm0gPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG4gICAgICBpZiAoIWZtPy5pZCB8fCAhZm0/LnRpdGxlKSByZXR1cm4gbnVsbDtcblxuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBjb25zdCBib2R5TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eLS0tXFxuW1xcc1xcU10qP1xcbi0tLVxcbihbXFxzXFxTXSopJC8pO1xuICAgICAgY29uc3Qgbm90ZXMgPSBib2R5TWF0Y2g/LlsxXT8udHJpbSgpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6ICAgICAgICAgICAgICAgICBmbS5pZCxcbiAgICAgICAgdGl0bGU6ICAgICAgICAgICAgICBmbS50aXRsZSxcbiAgICAgICAgc3RhdHVzOiAgICAgICAgICAgICAoZm0uc3RhdHVzIGFzIFRhc2tTdGF0dXMpID8/IFwidG9kb1wiLFxuICAgICAgICBwcmlvcml0eTogICAgICAgICAgIChmbS5wcmlvcml0eSBhcyBUYXNrUHJpb3JpdHkpID8/IFwibm9uZVwiLFxuICAgICAgICBkdWVEYXRlOiAgICAgICAgICAgIGZtW1wiZHVlLWRhdGVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBkdWVUaW1lOiAgICAgICAgICAgIGZtW1wiZHVlLXRpbWVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICByZWN1cnJlbmNlOiAgICAgICAgIGZtLnJlY3VycmVuY2UgPz8gdW5kZWZpbmVkLFxuICAgICAgICBjYWxlbmRhcklkOiAgICAgICAgIGZtW1wiY2FsZW5kYXItaWRcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICB0YWdzOiAgICAgICAgICAgICAgIGZtLnRhZ3MgPz8gW10sXG4gICAgICAgIGNvbnRleHRzOiAgICAgICAgICAgZm0uY29udGV4dHMgPz8gW10sXG4gICAgICAgIGxpbmtlZE5vdGVzOiAgICAgICAgZm1bXCJsaW5rZWQtbm90ZXNcIl0gPz8gW10sXG4gICAgICAgIHByb2plY3RzOiAgICAgICAgICAgZm0ucHJvamVjdHMgPz8gW10sXG4gICAgICAgIHRpbWVFc3RpbWF0ZTogICAgICAgZm1bXCJ0aW1lLWVzdGltYXRlXCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgdGltZUVudHJpZXM6ICAgICAgICBmbVtcInRpbWUtZW50cmllc1wiXSA/PyBbXSxcbiAgICAgICAgY3VzdG9tRmllbGRzOiAgICAgICBmbVtcImN1c3RvbS1maWVsZHNcIl0gPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogZm1bXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCJdID8/IFtdLFxuICAgICAgICBjcmVhdGVkQXQ6ICAgICAgICAgIGZtW1wiY3JlYXRlZC1hdFwiXSA/PyBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGNvbXBsZXRlZEF0OiAgICAgICAgZm1bXCJjb21wbGV0ZWQtYXRcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBub3RlcyxcbiAgICAgIH07XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgSGVscGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIGZpbmRGaWxlRm9yVGFzayhpZDogc3RyaW5nKTogVEZpbGUgfCBudWxsIHtcbiAgICBjb25zdCBmb2xkZXIgPSB0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy50YXNrc0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBudWxsO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoIShjaGlsZCBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGNoaWxkKTtcbiAgICAgIGlmIChjYWNoZT8uZnJvbnRtYXR0ZXI/LmlkID09PSBpZCkgcmV0dXJuIGNoaWxkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMudGFza3NGb2xkZXIpKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIodGhpcy50YXNrc0ZvbGRlcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGB0YXNrLSR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNil9YDtcbiAgfVxuXG4gIHByaXZhdGUgdG9kYXlTdHIoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIFRGaWxlLCBub3JtYWxpemVQYXRoIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVFdmVudCwgQWxlcnRPZmZzZXQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIEV2ZW50TWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwOiBBcHAsIHByaXZhdGUgZXZlbnRzRm9sZGVyOiBzdHJpbmcpIHt9XG5cbiAgYXN5bmMgZ2V0QWxsKCk6IFByb21pc2U8Q2hyb25pY2xlRXZlbnRbXT4ge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLmV2ZW50c0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBbXTtcblxuICAgIGNvbnN0IGV2ZW50czogQ2hyb25pY2xlRXZlbnRbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSAmJiBjaGlsZC5leHRlbnNpb24gPT09IFwibWRcIikge1xuICAgICAgICBjb25zdCBldmVudCA9IGF3YWl0IHRoaXMuZmlsZVRvRXZlbnQoY2hpbGQpO1xuICAgICAgICBpZiAoZXZlbnQpIGV2ZW50cy5wdXNoKGV2ZW50KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGV2ZW50cztcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZShldmVudDogT21pdDxDaHJvbmljbGVFdmVudCwgXCJpZFwiIHwgXCJjcmVhdGVkQXRcIj4pOiBQcm9taXNlPENocm9uaWNsZUV2ZW50PiB7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoKTtcblxuICAgIGNvbnN0IGZ1bGw6IENocm9uaWNsZUV2ZW50ID0ge1xuICAgICAgLi4uZXZlbnQsXG4gICAgICBpZDogdGhpcy5nZW5lcmF0ZUlkKCksXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgY29uc3QgcGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy5ldmVudHNGb2xkZXJ9LyR7ZnVsbC50aXRsZX0ubWRgKTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgdGhpcy5ldmVudFRvTWFya2Rvd24oZnVsbCkpO1xuICAgIHJldHVybiBmdWxsO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlKGV2ZW50OiBDaHJvbmljbGVFdmVudCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbmRGaWxlRm9yRXZlbnQoZXZlbnQuaWQpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuXG4gICAgY29uc3QgZXhwZWN0ZWRQYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLmV2ZW50c0ZvbGRlcn0vJHtldmVudC50aXRsZX0ubWRgKTtcbiAgICBpZiAoZmlsZS5wYXRoICE9PSBleHBlY3RlZFBhdGgpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLmZpbGVNYW5hZ2VyLnJlbmFtZUZpbGUoZmlsZSwgZXhwZWN0ZWRQYXRoKTtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkRmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEZpbGVCeVBhdGgoZXhwZWN0ZWRQYXRoKSA/PyBmaWxlO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeSh1cGRhdGVkRmlsZSwgdGhpcy5ldmVudFRvTWFya2Rvd24oZXZlbnQpKTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZShpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JFdmVudChpZCk7XG4gICAgaWYgKGZpbGUpIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmRlbGV0ZShmaWxlKTtcbiAgfVxuXG4gIGFzeW5jIGdldEluUmFuZ2Uoc3RhcnREYXRlOiBzdHJpbmcsIGVuZERhdGU6IHN0cmluZyk6IFByb21pc2U8Q2hyb25pY2xlRXZlbnRbXT4ge1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoKGUpID0+IGUuc3RhcnREYXRlID49IHN0YXJ0RGF0ZSAmJiBlLnN0YXJ0RGF0ZSA8PSBlbmREYXRlKTtcbiAgfVxuXG4vLyBFeHBhbmRzIHJlY3VycmluZyBldmVudHMgaW50byBvY2N1cnJlbmNlcyB3aXRoaW4gYSBkYXRlIHJhbmdlLlxuICAvLyBSZXR1cm5zIGEgZmxhdCBsaXN0IG9mIENocm9uaWNsZUV2ZW50IG9iamVjdHMsIG9uZSBwZXIgb2NjdXJyZW5jZSxcbiAgLy8gZWFjaCB3aXRoIHN0YXJ0RGF0ZS9lbmREYXRlIHNldCB0byB0aGUgb2NjdXJyZW5jZSBkYXRlLlxuICBhc3luYyBnZXRJblJhbmdlV2l0aFJlY3VycmVuY2UocmFuZ2VTdGFydDogc3RyaW5nLCByYW5nZUVuZDogc3RyaW5nKTogUHJvbWlzZTxDaHJvbmljbGVFdmVudFtdPiB7XG4gICAgY29uc3QgYWxsICAgID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICBjb25zdCByZXN1bHQ6IENocm9uaWNsZUV2ZW50W10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgZXZlbnQgb2YgYWxsKSB7XG4gICAgICBpZiAoIWV2ZW50LnJlY3VycmVuY2UpIHtcbiAgICAgICAgLy8gTm9uLXJlY3VycmluZyBcdTIwMTQgaW5jbHVkZSBpZiBpdCBmYWxscyBpbiByYW5nZVxuICAgICAgICBpZiAoZXZlbnQuc3RhcnREYXRlID49IHJhbmdlU3RhcnQgJiYgZXZlbnQuc3RhcnREYXRlIDw9IHJhbmdlRW5kKSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2goZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBFeHBhbmQgcmVjdXJyZW5jZSB3aXRoaW4gcmFuZ2VcbiAgICAgIGNvbnN0IG9jY3VycmVuY2VzID0gdGhpcy5leHBhbmRSZWN1cnJlbmNlKGV2ZW50LCByYW5nZVN0YXJ0LCByYW5nZUVuZCk7XG4gICAgICByZXN1bHQucHVzaCguLi5vY2N1cnJlbmNlcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgZXhwYW5kUmVjdXJyZW5jZShldmVudDogQ2hyb25pY2xlRXZlbnQsIHJhbmdlU3RhcnQ6IHN0cmluZywgcmFuZ2VFbmQ6IHN0cmluZyk6IENocm9uaWNsZUV2ZW50W10ge1xuICAgIGNvbnN0IHJlc3VsdHM6IENocm9uaWNsZUV2ZW50W10gPSBbXTtcbiAgICBjb25zdCBydWxlID0gZXZlbnQucmVjdXJyZW5jZSA/PyBcIlwiO1xuXG4gICAgLy8gUGFyc2UgUlJVTEUgcGFydHNcbiAgICBjb25zdCBmcmVxICAgID0gdGhpcy5ycnVsZVBhcnQocnVsZSwgXCJGUkVRXCIpO1xuICAgIGNvbnN0IGJ5RGF5ICAgPSB0aGlzLnJydWxlUGFydChydWxlLCBcIkJZREFZXCIpO1xuICAgIGNvbnN0IHVudGlsICAgPSB0aGlzLnJydWxlUGFydChydWxlLCBcIlVOVElMXCIpO1xuICAgIGNvbnN0IGNvdW50U3RyID0gdGhpcy5ycnVsZVBhcnQocnVsZSwgXCJDT1VOVFwiKTtcbiAgICBjb25zdCBjb3VudCAgID0gY291bnRTdHIgPyBwYXJzZUludChjb3VudFN0cikgOiA5OTk7XG5cbiAgICBjb25zdCBzdGFydCAgID0gbmV3IERhdGUoZXZlbnQuc3RhcnREYXRlICsgXCJUMDA6MDA6MDBcIik7XG4gICAgY29uc3QgckVuZCAgICA9IG5ldyBEYXRlKHJhbmdlRW5kICsgXCJUMDA6MDA6MDBcIik7XG4gICAgY29uc3QgclN0YXJ0ICA9IG5ldyBEYXRlKHJhbmdlU3RhcnQgKyBcIlQwMDowMDowMFwiKTtcbiAgICBjb25zdCB1bnRpbERhdGUgPSB1bnRpbCA/IG5ldyBEYXRlKHVudGlsLnNsaWNlKDAsOCkucmVwbGFjZSgvKFxcZHs0fSkoXFxkezJ9KShcXGR7Mn0pLyxcIiQxLSQyLSQzXCIpICsgXCJUMDA6MDA6MDBcIikgOiBudWxsO1xuXG4gICAgY29uc3QgZGF5TmFtZXMgPSBbXCJTVVwiLFwiTU9cIixcIlRVXCIsXCJXRVwiLFwiVEhcIixcIkZSXCIsXCJTQVwiXTtcbiAgICBjb25zdCBieURheXMgICA9IGJ5RGF5ID8gYnlEYXkuc3BsaXQoXCIsXCIpIDogW107XG5cbiAgICBsZXQgY3VycmVudCAgID0gbmV3IERhdGUoc3RhcnQpO1xuICAgIGxldCBnZW5lcmF0ZWQgPSAwO1xuXG4gICAgd2hpbGUgKGN1cnJlbnQgPD0gckVuZCAmJiBnZW5lcmF0ZWQgPCBjb3VudCkge1xuICAgICAgaWYgKHVudGlsRGF0ZSAmJiBjdXJyZW50ID4gdW50aWxEYXRlKSBicmVhaztcblxuICAgICAgY29uc3QgZGF0ZVN0ciA9IGN1cnJlbnQudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICAgIC8vIENhbGN1bGF0ZSBkdXJhdGlvbiB0byBhcHBseSB0byBlYWNoIG9jY3VycmVuY2VcbiAgICAgIGNvbnN0IGR1cmF0aW9uTXMgPSBuZXcgRGF0ZShldmVudC5lbmREYXRlICsgXCJUMDA6MDA6MDBcIikuZ2V0VGltZSgpIC0gc3RhcnQuZ2V0VGltZSgpO1xuICAgICAgY29uc3QgZW5kRGF0ZSAgICA9IG5ldyBEYXRlKGN1cnJlbnQuZ2V0VGltZSgpICsgZHVyYXRpb25NcykudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICAgIGlmIChjdXJyZW50ID49IHJTdGFydCAmJiAhZXZlbnQuY29tcGxldGVkSW5zdGFuY2VzLmluY2x1ZGVzKGRhdGVTdHIpKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh7IC4uLmV2ZW50LCBzdGFydERhdGU6IGRhdGVTdHIsIGVuZERhdGUgfSk7XG4gICAgICAgIGdlbmVyYXRlZCsrO1xuICAgICAgfVxuXG4gICAgICAvLyBBZHZhbmNlIHRvIG5leHQgb2NjdXJyZW5jZVxuICAgICAgaWYgKGZyZXEgPT09IFwiREFJTFlcIikge1xuICAgICAgICBjdXJyZW50LnNldERhdGUoY3VycmVudC5nZXREYXRlKCkgKyAxKTtcbiAgICAgIH0gZWxzZSBpZiAoZnJlcSA9PT0gXCJXRUVLTFlcIikge1xuICAgICAgICBpZiAoYnlEYXlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvLyBGaW5kIG5leHQgbWF0Y2hpbmcgd2Vla2RheVxuICAgICAgICAgIGN1cnJlbnQuc2V0RGF0ZShjdXJyZW50LmdldERhdGUoKSArIDEpO1xuICAgICAgICAgIGxldCBzYWZldHkgPSAwO1xuICAgICAgICAgIHdoaWxlICghYnlEYXlzLmluY2x1ZGVzKGRheU5hbWVzW2N1cnJlbnQuZ2V0RGF5KCldKSAmJiBzYWZldHkrKyA8IDcpIHtcbiAgICAgICAgICAgIGN1cnJlbnQuc2V0RGF0ZShjdXJyZW50LmdldERhdGUoKSArIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdXJyZW50LnNldERhdGUoY3VycmVudC5nZXREYXRlKCkgKyA3KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChmcmVxID09PSBcIk1PTlRITFlcIikge1xuICAgICAgICBjdXJyZW50LnNldE1vbnRoKGN1cnJlbnQuZ2V0TW9udGgoKSArIDEpO1xuICAgICAgfSBlbHNlIGlmIChmcmVxID09PSBcIllFQVJMWVwiKSB7XG4gICAgICAgIGN1cnJlbnQuc2V0RnVsbFllYXIoY3VycmVudC5nZXRGdWxsWWVhcigpICsgMSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhazsgLy8gVW5rbm93biBmcmVxIFx1MjAxNCBzdG9wIHRvIGF2b2lkIGluZmluaXRlIGxvb3BcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuXG4gIHByaXZhdGUgcnJ1bGVQYXJ0KHJ1bGU6IHN0cmluZywga2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1hdGNoID0gcnVsZS5tYXRjaChuZXcgUmVnRXhwKGAoPzpefDspJHtrZXl9PShbXjtdKylgKSk7XG4gICAgcmV0dXJuIG1hdGNoID8gbWF0Y2hbMV0gOiBcIlwiO1xuICB9XG5cbiAgcHJpdmF0ZSBldmVudFRvTWFya2Rvd24oZXZlbnQ6IENocm9uaWNsZUV2ZW50KTogc3RyaW5nIHtcbiAgICBjb25zdCBmbTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICBpZDogICAgICAgICAgICAgICAgICAgZXZlbnQuaWQsXG4gICAgICB0aXRsZTogICAgICAgICAgICAgICAgZXZlbnQudGl0bGUsXG4gICAgICBsb2NhdGlvbjogICAgICAgICAgICAgZXZlbnQubG9jYXRpb24gPz8gbnVsbCxcbiAgICAgIFwiYWxsLWRheVwiOiAgICAgICAgICAgIGV2ZW50LmFsbERheSxcbiAgICAgIFwic3RhcnQtZGF0ZVwiOiAgICAgICAgIGV2ZW50LnN0YXJ0RGF0ZSxcbiAgICAgIFwic3RhcnQtdGltZVwiOiAgICAgICAgIGV2ZW50LnN0YXJ0VGltZSA/PyBudWxsLFxuICAgICAgXCJlbmQtZGF0ZVwiOiAgICAgICAgICAgZXZlbnQuZW5kRGF0ZSxcbiAgICAgIFwiZW5kLXRpbWVcIjogICAgICAgICAgIGV2ZW50LmVuZFRpbWUgPz8gbnVsbCxcbiAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICBldmVudC5yZWN1cnJlbmNlID8/IG51bGwsXG4gICAgICBcImNhbGVuZGFyLWlkXCI6ICAgICAgICBldmVudC5jYWxlbmRhcklkID8/IG51bGwsXG4gICAgICBhbGVydDogICAgICAgICAgICAgICAgZXZlbnQuYWxlcnQsXG4gICAgICBcImxpbmtlZC10YXNrLWlkc1wiOiAgICBldmVudC5saW5rZWRUYXNrSWRzLFxuICAgICAgXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCI6IGV2ZW50LmNvbXBsZXRlZEluc3RhbmNlcyxcbiAgICAgIFwiY3JlYXRlZC1hdFwiOiAgICAgICAgIGV2ZW50LmNyZWF0ZWRBdCxcbiAgICB9O1xuXG4gICAgY29uc3QgeWFtbCA9IE9iamVjdC5lbnRyaWVzKGZtKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHtKU09OLnN0cmluZ2lmeSh2KX1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCBib2R5ID0gZXZlbnQubm90ZXMgPyBgXFxuJHtldmVudC5ub3Rlc31gIDogXCJcIjtcbiAgICByZXR1cm4gYC0tLVxcbiR7eWFtbH1cXG4tLS1cXG4ke2JvZHl9YDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmlsZVRvRXZlbnQoZmlsZTogVEZpbGUpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50IHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgICAgY29uc3QgZm0gPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG4gICAgICBpZiAoIWZtPy5pZCB8fCAhZm0/LnRpdGxlKSByZXR1cm4gbnVsbDtcblxuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBjb25zdCBib2R5TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eLS0tXFxuW1xcc1xcU10qP1xcbi0tLVxcbihbXFxzXFxTXSopJC8pO1xuICAgICAgY29uc3Qgbm90ZXMgPSBib2R5TWF0Y2g/LlsxXT8udHJpbSgpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6ICAgICAgICAgICAgICAgICAgIGZtLmlkLFxuICAgICAgICB0aXRsZTogICAgICAgICAgICAgICAgZm0udGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICAgICAgICAgICBmbS5sb2NhdGlvbiA/PyB1bmRlZmluZWQsXG4gICAgICAgIGFsbERheTogICAgICAgICAgICAgICBmbVtcImFsbC1kYXlcIl0gPz8gdHJ1ZSxcbiAgICAgICAgc3RhcnREYXRlOiAgICAgICAgICAgIGZtW1wic3RhcnQtZGF0ZVwiXSxcbiAgICAgICAgc3RhcnRUaW1lOiAgICAgICAgICAgIGZtW1wic3RhcnQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGVuZERhdGU6ICAgICAgICAgICAgICBmbVtcImVuZC1kYXRlXCJdLFxuICAgICAgICBlbmRUaW1lOiAgICAgICAgICAgICAgZm1bXCJlbmQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICBmbS5yZWN1cnJlbmNlID8/IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsZW5kYXJJZDogICAgICAgICAgIGZtW1wiY2FsZW5kYXItaWRcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBhbGVydDogICAgICAgICAgICAgICAgKGZtLmFsZXJ0IGFzIEFsZXJ0T2Zmc2V0KSA/PyBcIm5vbmVcIixcbiAgICAgICAgbGlua2VkVGFza0lkczogICAgICAgIGZtW1wibGlua2VkLXRhc2staWRzXCJdID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6ICAgZm1bXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCJdID8/IFtdLFxuICAgICAgICBjcmVhdGVkQXQ6ICAgICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgbm90ZXMsXG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5kRmlsZUZvckV2ZW50KGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLmV2ZW50c0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBudWxsO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoIShjaGlsZCBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGNoaWxkKTtcbiAgICAgIGlmIChjYWNoZT8uZnJvbnRtYXR0ZXI/LmlkID09PSBpZCkgcmV0dXJuIGNoaWxkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMuZXZlbnRzRm9sZGVyKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKHRoaXMuZXZlbnRzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGV2ZW50LSR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNil9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlVGFzayB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgVGFza01hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9UYXNrTWFuYWdlclwiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBUYXNrRm9ybVZpZXcsIFRBU0tfRk9STV9WSUVXX1RZUEUgfSBmcm9tIFwiLi9UYXNrRm9ybVZpZXdcIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0V2ZW50TWFuYWdlclwiO1xuXG5leHBvcnQgY29uc3QgVEFTS19WSUVXX1RZUEUgPSBcImNocm9uaWNsZS10YXNrLXZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIFRhc2tWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcjtcbiAgcHJpdmF0ZSBjdXJyZW50TGlzdElkOiBzdHJpbmcgPSBcInRvZGF5XCI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbGVhZjogV29ya3NwYWNlTGVhZixcbiAgICB0YXNrTWFuYWdlcjogVGFza01hbmFnZXIsXG4gICAgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXIsXG4gICAgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXJcbiAgKSB7XG4gICAgc3VwZXIobGVhZik7XG4gICAgdGhpcy50YXNrTWFuYWdlciA9IHRhc2tNYW5hZ2VyO1xuICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyID0gY2FsZW5kYXJNYW5hZ2VyO1xuICAgIHRoaXMuZXZlbnRNYW5hZ2VyID0gZXZlbnRNYW5hZ2VyO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHsgcmV0dXJuIFRBU0tfVklFV19UWVBFOyB9XG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7IHJldHVybiBcIkNocm9uaWNsZVwiOyB9XG4gIGdldEljb24oKTogc3RyaW5nIHsgcmV0dXJuIFwiY2hlY2stY2lyY2xlXCI7IH1cblxuYXN5bmMgb25PcGVuKCkge1xuICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG5cbiAgICAvLyBBdXRvLXJlZnJlc2ggd2hlbmV2ZXIgYW55IGZpbGUgaW4gdGhlIHZhdWx0IGNoYW5nZXNcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKSkge1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwiY3JlYXRlXCIsIChmaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLnRhc2tNYW5hZ2VyW1widGFza3NGb2xkZXJcIl0pKSB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnJlbmRlcigpLCAyMDApO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC52YXVsdC5vbihcImRlbGV0ZVwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKSkge1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHJlbmRlcigpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuICAgIGNvbnRhaW5lci5hZGRDbGFzcyhcImNocm9uaWNsZS1hcHBcIik7XG5cbiAgICBjb25zdCBhbGwgICAgICAgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEFsbCgpO1xuICAgIGNvbnN0IHRvZGF5ICAgICA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0RHVlVG9kYXkoKTtcbiAgICBjb25zdCBzY2hlZHVsZWQgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldFNjaGVkdWxlZCgpO1xuICAgIGNvbnN0IGZsYWdnZWQgICA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0RmxhZ2dlZCgpO1xuICAgIGNvbnN0IG92ZXJkdWUgICA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0T3ZlcmR1ZSgpO1xuICAgIGNvbnN0IGNhbGVuZGFycyA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgY29uc3QgbGF5b3V0ICA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGF5b3V0XCIpO1xuICAgIGNvbnN0IHNpZGViYXIgPSBsYXlvdXQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXNpZGViYXJcIik7XG4gICAgY29uc3QgbWFpbiAgICA9IGxheW91dC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWFpblwiKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBOZXcgdGFzayBidXR0b24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgbmV3VGFza0J0biA9IHNpZGViYXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImNocm9uaWNsZS1uZXctdGFzay1idG5cIiwgdGV4dDogXCJOZXcgdGFza1wiXG4gICAgfSk7XG4gICAgbmV3VGFza0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5vcGVuVGFza0Zvcm0oKSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgU21hcnQgbGlzdCB0aWxlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB0aWxlc0dyaWQgPSBzaWRlYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlc1wiKTtcblxuICAgIGNvbnN0IHRpbGVzID0gW1xuICAgICAgeyBpZDogXCJ0b2RheVwiLCAgICAgbGFiZWw6IFwiVG9kYXlcIiwgICAgIGNvdW50OiB0b2RheS5sZW5ndGggKyBvdmVyZHVlLmxlbmd0aCwgY29sb3I6IFwiI0ZGM0IzMFwiLCBiYWRnZTogb3ZlcmR1ZS5sZW5ndGggfSxcbiAgICAgIHsgaWQ6IFwic2NoZWR1bGVkXCIsIGxhYmVsOiBcIlNjaGVkdWxlZFwiLCBjb3VudDogc2NoZWR1bGVkLmxlbmd0aCwgICAgICAgICAgICAgIGNvbG9yOiBcIiMzNzhBRERcIiwgYmFkZ2U6IDAgfSxcbiAgICAgIHsgaWQ6IFwiYWxsXCIsICAgICAgIGxhYmVsOiBcIkFsbFwiLCAgICAgICBjb3VudDogYWxsLmZpbHRlcih0ID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIikubGVuZ3RoLCBjb2xvcjogXCIjNjM2MzY2XCIsIGJhZGdlOiAwIH0sXG4gICAgICB7IGlkOiBcImZsYWdnZWRcIiwgICBsYWJlbDogXCJGbGFnZ2VkXCIsICAgY291bnQ6IGZsYWdnZWQubGVuZ3RoLCAgICAgICAgICAgICAgICBjb2xvcjogXCIjRkY5NTAwXCIsIGJhZGdlOiAwIH0sXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgdGlsZSBvZiB0aWxlcykge1xuICAgICAgY29uc3QgdCA9IHRpbGVzR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGlsZVwiKTtcbiAgICAgIHQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGlsZS5jb2xvcjtcbiAgICAgIGlmICh0aWxlLmlkID09PSB0aGlzLmN1cnJlbnRMaXN0SWQpIHQuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG5cbiAgICAgIGNvbnN0IHRvcFJvdyA9IHQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtdG9wXCIpO1xuICAgICAgdG9wUm93LmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlLWNvdW50XCIpLnNldFRleHQoU3RyaW5nKHRpbGUuY291bnQpKTtcblxuICAgICAgaWYgKHRpbGUuYmFkZ2UgPiAwKSB7XG4gICAgICAgIGNvbnN0IGJhZGdlID0gdG9wUm93LmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlLWJhZGdlXCIpO1xuICAgICAgICBiYWRnZS5zZXRUZXh0KFN0cmluZyh0aWxlLmJhZGdlKSk7XG4gICAgICAgIGJhZGdlLnRpdGxlID0gYCR7dGlsZS5iYWRnZX0gb3ZlcmR1ZWA7XG4gICAgICB9XG5cbiAgICAgIHQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtbGFiZWxcIikuc2V0VGV4dCh0aWxlLmxhYmVsKTtcbiAgICAgIHQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50TGlzdElkID0gdGlsZS5pZDsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE15IExpc3RzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGxpc3RzU2VjdGlvbiA9IHNpZGViYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3RzLXNlY3Rpb25cIik7XG4gICAgbGlzdHNTZWN0aW9uLmNyZWF0ZURpdihcImNocm9uaWNsZS1zZWN0aW9uLWxhYmVsXCIpLnNldFRleHQoXCJNeSBMaXN0c1wiKTtcblxuICAgIGZvciAoY29uc3QgY2FsIG9mIGNhbGVuZGFycykge1xuICAgICAgY29uc3Qgcm93ID0gbGlzdHNTZWN0aW9uLmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LXJvd1wiKTtcbiAgICAgIGlmIChjYWwuaWQgPT09IHRoaXMuY3VycmVudExpc3RJZCkgcm93LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuXG4gICAgICBjb25zdCBkb3QgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3QtZG90XCIpO1xuICAgICAgZG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcik7XG5cbiAgICAgIHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1uYW1lXCIpLnNldFRleHQoY2FsLm5hbWUpO1xuXG4gICAgICBjb25zdCBjYWxDb3VudCA9IGFsbC5maWx0ZXIodCA9PiB0LmNhbGVuZGFySWQgPT09IGNhbC5pZCAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpLmxlbmd0aDtcbiAgICAgIGlmIChjYWxDb3VudCA+IDApIHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1jb3VudFwiKS5zZXRUZXh0KFN0cmluZyhjYWxDb3VudCkpO1xuXG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50TGlzdElkID0gY2FsLmlkOyB0aGlzLnJlbmRlcigpOyB9KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTWFpbiBwYW5lbCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBhd2FpdCB0aGlzLnJlbmRlck1haW5QYW5lbChtYWluLCBhbGwsIG92ZXJkdWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZW5kZXJNYWluUGFuZWwoXG4gICAgbWFpbjogSFRNTEVsZW1lbnQsXG4gICAgYWxsOiBDaHJvbmljbGVUYXNrW10sXG4gICAgb3ZlcmR1ZTogQ2hyb25pY2xlVGFza1tdXG4gICkge1xuICAgIGNvbnN0IGhlYWRlciAgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluLWhlYWRlclwiKTtcbiAgICBjb25zdCB0aXRsZUVsID0gaGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluLXRpdGxlXCIpO1xuXG4gICAgbGV0IHRhc2tzOiBDaHJvbmljbGVUYXNrW10gPSBbXTtcblxuICAgIGNvbnN0IHNtYXJ0Q29sb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgdG9kYXk6IFwiI0ZGM0IzMFwiLCBzY2hlZHVsZWQ6IFwiIzM3OEFERFwiLCBhbGw6IFwiIzYzNjM2NlwiLCBmbGFnZ2VkOiBcIiNGRjk1MDBcIlxuICAgIH07XG5cbiAgICBpZiAoc21hcnRDb2xvcnNbdGhpcy5jdXJyZW50TGlzdElkXSkge1xuICAgICAgY29uc3QgbGFiZWxzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgICB0b2RheTogXCJUb2RheVwiLCBzY2hlZHVsZWQ6IFwiU2NoZWR1bGVkXCIsIGFsbDogXCJBbGxcIiwgZmxhZ2dlZDogXCJGbGFnZ2VkXCJcbiAgICAgIH07XG4gICAgICB0aXRsZUVsLnNldFRleHQobGFiZWxzW3RoaXMuY3VycmVudExpc3RJZF0pO1xuICAgICAgdGl0bGVFbC5zdHlsZS5jb2xvciA9IHNtYXJ0Q29sb3JzW3RoaXMuY3VycmVudExpc3RJZF07XG5cbiAgICAgIHN3aXRjaCAodGhpcy5jdXJyZW50TGlzdElkKSB7XG4gICAgICAgIGNhc2UgXCJ0b2RheVwiOlxuICAgICAgICAgIHRhc2tzID0gWy4uLm92ZXJkdWUsIC4uLihhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldER1ZVRvZGF5KCkpXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInNjaGVkdWxlZFwiOlxuICAgICAgICAgIHRhc2tzID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRTY2hlZHVsZWQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImZsYWdnZWRcIjpcbiAgICAgICAgICB0YXNrcyA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0RmxhZ2dlZCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiYWxsXCI6XG4gICAgICAgICAgdGFza3MgPSBhbGwuZmlsdGVyKHQgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZCh0aGlzLmN1cnJlbnRMaXN0SWQpO1xuICAgICAgdGl0bGVFbC5zZXRUZXh0KGNhbD8ubmFtZSA/PyBcIkxpc3RcIik7XG4gICAgICB0aXRsZUVsLnN0eWxlLmNvbG9yID0gY2FsXG4gICAgICAgID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKVxuICAgICAgICA6IFwidmFyKC0tdGV4dC1ub3JtYWwpXCI7XG4gICAgICB0YXNrcyA9IGFsbC5maWx0ZXIoXG4gICAgICAgIHQgPT4gdC5jYWxlbmRhcklkID09PSB0aGlzLmN1cnJlbnRMaXN0SWQgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZVRhc2tzID0gdGFza3MuZmlsdGVyKHQgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgICBpZiAoYWN0aXZlVGFza3MubGVuZ3RoID4gMCkge1xuICAgICAgaGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluLXN1YnRpdGxlXCIpLnNldFRleHQoXG4gICAgICAgIGAke2FjdGl2ZVRhc2tzLmxlbmd0aH0gJHthY3RpdmVUYXNrcy5sZW5ndGggPT09IDEgPyBcInRhc2tcIiA6IFwidGFza3NcIn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGxpc3RFbCA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stbGlzdFwiKTtcblxuICAgIGlmICh0YXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMucmVuZGVyRW1wdHlTdGF0ZShsaXN0RWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBncm91cHMgPSB0aGlzLmdyb3VwVGFza3ModGFza3MpO1xuICAgICAgZm9yIChjb25zdCBbZ3JvdXAsIGdyb3VwVGFza3NdIG9mIE9iamVjdC5lbnRyaWVzKGdyb3VwcykpIHtcbiAgICAgICAgaWYgKGdyb3VwVGFza3MubGVuZ3RoID09PSAwKSBjb250aW51ZTtcbiAgICAgICAgbGlzdEVsLmNyZWF0ZURpdihcImNocm9uaWNsZS1ncm91cC1sYWJlbFwiKS5zZXRUZXh0KGdyb3VwKTtcbiAgICAgICAgY29uc3QgY2FyZCA9IGxpc3RFbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1jYXJkLWdyb3VwXCIpO1xuICAgICAgICBmb3IgKGNvbnN0IHRhc2sgb2YgZ3JvdXBUYXNrcykge1xuICAgICAgICAgIHRoaXMucmVuZGVyVGFza1JvdyhjYXJkLCB0YXNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyRW1wdHlTdGF0ZShjb250YWluZXI6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgZW1wdHkgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWVtcHR5LXN0YXRlXCIpO1xuICAgIGNvbnN0IGljb24gID0gZW1wdHkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWVtcHR5LWljb25cIik7XG4gICAgaWNvbi5pbm5lckhUTUwgPSBgPHN2ZyB3aWR0aD1cIjQ4XCIgaGVpZ2h0PVwiNDhcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIj48cGF0aCBkPVwiTTIyIDExLjA4VjEyYTEwIDEwIDAgMSAxLTUuOTMtOS4xNFwiLz48cG9seWxpbmUgcG9pbnRzPVwiMjIgNCAxMiAxNC4wMSA5IDExLjAxXCIvPjwvc3ZnPmA7XG4gICAgZW1wdHkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWVtcHR5LXRpdGxlXCIpLnNldFRleHQoXCJBbGwgZG9uZVwiKTtcbiAgICBlbXB0eS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZW1wdHktc3VidGl0bGVcIikuc2V0VGV4dChcIk5vdGhpbmcgbGVmdCBpbiB0aGlzIGxpc3QuXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJUYXNrUm93KGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHRhc2s6IENocm9uaWNsZVRhc2spIHtcbiAgICBjb25zdCByb3cgICAgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stcm93XCIpO1xuICAgIGNvbnN0IGlzRG9uZSA9IHRhc2suc3RhdHVzID09PSBcImRvbmVcIjtcblxuICAgIC8vIENoZWNrYm94XG4gICAgY29uc3QgY2hlY2tib3hXcmFwID0gcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1jaGVja2JveC13cmFwXCIpO1xuICAgIGNvbnN0IGNoZWNrYm94ICAgICA9IGNoZWNrYm94V3JhcC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2hlY2tib3hcIik7XG4gICAgaWYgKGlzRG9uZSkgY2hlY2tib3guYWRkQ2xhc3MoXCJkb25lXCIpO1xuICAgIGNoZWNrYm94LmlubmVySFRNTCA9IGA8c3ZnIGNsYXNzPVwiY2hyb25pY2xlLWNoZWNrbWFya1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiNmZmZcIiBzdHJva2Utd2lkdGg9XCIzXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+PHBvbHlsaW5lIHBvaW50cz1cIjIwIDYgOSAxNyA0IDEyXCIvPjwvc3ZnPmA7XG5cbiAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBjaGVja2JveC5hZGRDbGFzcyhcImNvbXBsZXRpbmdcIik7XG4gICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci51cGRhdGUoe1xuICAgICAgICAgIC4uLnRhc2ssXG4gICAgICAgICAgc3RhdHVzOiAgICAgIGlzRG9uZSA/IFwidG9kb1wiIDogXCJkb25lXCIsXG4gICAgICAgICAgY29tcGxldGVkQXQ6IGlzRG9uZSA/IHVuZGVmaW5lZCA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG4gICAgICB9LCAzMDApO1xuICAgIH0pO1xuXG4gICAgLy8gQ29udGVudCBcdTIwMTQgY2xpY2sgdG8gZWRpdFxuICAgIGNvbnN0IGNvbnRlbnQgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stY29udGVudFwiKTtcbiAgICBjb250ZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLm9wZW5UYXNrRm9ybSh0YXNrKSk7XG5cbiAgICBjb25zdCB0aXRsZUVsID0gY29udGVudC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay10aXRsZVwiKTtcbiAgICB0aXRsZUVsLnNldFRleHQodGFzay50aXRsZSk7XG4gICAgaWYgKGlzRG9uZSkgdGl0bGVFbC5hZGRDbGFzcyhcImRvbmVcIik7XG5cbiAgICAvLyBNZXRhXG4gICAgY29uc3QgdG9kYXlTdHIgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGlmICh0YXNrLmR1ZURhdGUgfHwgdGFzay5jYWxlbmRhcklkKSB7XG4gICAgICBjb25zdCBtZXRhID0gY29udGVudC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1tZXRhXCIpO1xuXG4gICAgICBpZiAodGFzay5kdWVEYXRlKSB7XG4gICAgICAgIGNvbnN0IG1ldGFEYXRlID0gbWV0YS5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXRhc2stZGF0ZVwiKTtcbiAgICAgICAgbWV0YURhdGUuc2V0VGV4dCh0aGlzLmZvcm1hdERhdGUodGFzay5kdWVEYXRlKSk7XG4gICAgICAgIGlmICh0YXNrLmR1ZURhdGUgPCB0b2RheVN0cikgbWV0YURhdGUuYWRkQ2xhc3MoXCJvdmVyZHVlXCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGFzay5jYWxlbmRhcklkKSB7XG4gICAgICAgIGNvbnN0IGNhbCA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQodGFzay5jYWxlbmRhcklkKTtcbiAgICAgICAgaWYgKGNhbCkge1xuICAgICAgICAgIGNvbnN0IGNhbERvdCA9IG1ldGEuY3JlYXRlU3BhbihcImNocm9uaWNsZS10YXNrLWNhbC1kb3RcIik7XG4gICAgICAgICAgY2FsRG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcik7XG4gICAgICAgICAgbWV0YS5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXRhc2stY2FsLW5hbWVcIikuc2V0VGV4dChjYWwubmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBQcmlvcml0eSBmbGFnXG4gICAgaWYgKHRhc2sucHJpb3JpdHkgPT09IFwiaGlnaFwiKSB7XG4gICAgICByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWZsYWdcIikuc2V0VGV4dChcIlx1MjY5MVwiKTtcbiAgICB9XG5cbiAgICAvLyBSaWdodC1jbGljayBjb250ZXh0IG1lbnVcbiAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBtZW51ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG1lbnUuY2xhc3NOYW1lID0gXCJjaHJvbmljbGUtY29udGV4dC1tZW51XCI7XG4gICAgICBtZW51LnN0eWxlLmxlZnQgPSBgJHtlLmNsaWVudFh9cHhgO1xuICAgICAgbWVudS5zdHlsZS50b3AgID0gYCR7ZS5jbGllbnRZfXB4YDtcblxuICAgICAgY29uc3QgZWRpdEl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW1cIik7XG4gICAgICBlZGl0SXRlbS5zZXRUZXh0KFwiRWRpdCB0YXNrXCIpO1xuICAgICAgZWRpdEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgbWVudS5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5vcGVuVGFza0Zvcm0odGFzayk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZGVsZXRlSXRlbSA9IG1lbnUuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbnRleHQtaXRlbSBjaHJvbmljbGUtY29udGV4dC1kZWxldGVcIik7XG4gICAgICBkZWxldGVJdGVtLnNldFRleHQoXCJEZWxldGUgdGFza1wiKTtcbiAgICAgIGRlbGV0ZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbWVudS5yZW1vdmUoKTtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5kZWxldGUodGFzay5pZCk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2FuY2VsSXRlbSA9IG1lbnUuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbnRleHQtaXRlbVwiKTtcbiAgICAgIGNhbmNlbEl0ZW0uc2V0VGV4dChcIkNhbmNlbFwiKTtcbiAgICAgIGNhbmNlbEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IG1lbnUucmVtb3ZlKCkpO1xuXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1lbnUpO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gbWVudS5yZW1vdmUoKSwgeyBvbmNlOiB0cnVlIH0pLCAwKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZ3JvdXBUYXNrcyh0YXNrczogQ2hyb25pY2xlVGFza1tdKTogUmVjb3JkPHN0cmluZywgQ2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgdG9kYXkgICAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IG5leHRXZWVrID0gbmV3IERhdGUoRGF0ZS5ub3coKSArIDcgKiA4NjQwMDAwMCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBjb25zdCBncm91cHM6IFJlY29yZDxzdHJpbmcsIENocm9uaWNsZVRhc2tbXT4gPSB7XG4gICAgICBcIk92ZXJkdWVcIjogICBbXSxcbiAgICAgIFwiVG9kYXlcIjogICAgIFtdLFxuICAgICAgXCJUaGlzIHdlZWtcIjogW10sXG4gICAgICBcIkxhdGVyXCI6ICAgICBbXSxcbiAgICAgIFwiTm8gZGF0ZVwiOiAgIFtdLFxuICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGFza3MpIHtcbiAgICAgIGlmICh0YXNrLnN0YXR1cyA9PT0gXCJkb25lXCIpIGNvbnRpbnVlO1xuICAgICAgaWYgKCF0YXNrLmR1ZURhdGUpICAgICAgICAgICAgeyBncm91cHNbXCJObyBkYXRlXCJdLnB1c2godGFzayk7ICAgY29udGludWU7IH1cbiAgICAgIGlmICh0YXNrLmR1ZURhdGUgPCB0b2RheSkgICAgIHsgZ3JvdXBzW1wiT3ZlcmR1ZVwiXS5wdXNoKHRhc2spOyAgIGNvbnRpbnVlOyB9XG4gICAgICBpZiAodGFzay5kdWVEYXRlID09PSB0b2RheSkgICB7IGdyb3Vwc1tcIlRvZGF5XCJdLnB1c2godGFzayk7ICAgICBjb250aW51ZTsgfVxuICAgICAgaWYgKHRhc2suZHVlRGF0ZSA8PSBuZXh0V2VlaykgeyBncm91cHNbXCJUaGlzIHdlZWtcIl0ucHVzaCh0YXNrKTsgY29udGludWU7IH1cbiAgICAgIGdyb3Vwc1tcIkxhdGVyXCJdLnB1c2godGFzayk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdyb3VwcztcbiAgfVxuXG4gIHByaXZhdGUgZm9ybWF0RGF0ZShkYXRlU3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHRvZGF5ICAgID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCB0b21vcnJvdyA9IG5ldyBEYXRlKERhdGUubm93KCkgKyA4NjQwMDAwMCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5KSAgICByZXR1cm4gXCJUb2RheVwiO1xuICAgIGlmIChkYXRlU3RyID09PSB0b21vcnJvdykgcmV0dXJuIFwiVG9tb3Jyb3dcIjtcbiAgICByZXR1cm4gbmV3IERhdGUoZGF0ZVN0ciArIFwiVDAwOjAwOjAwXCIpLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHtcbiAgICAgIG1vbnRoOiBcInNob3J0XCIsIGRheTogXCJudW1lcmljXCJcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5UYXNrRm9ybSh0YXNrPzogQ2hyb25pY2xlVGFzaykge1xuICAgIGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcbiAgICBjb25zdCBleGlzdGluZyA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVEFTS19GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKGV4aXN0aW5nKSBleGlzdGluZy5kZXRhY2goKTtcbiAgICBjb25zdCBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBUQVNLX0ZPUk1fVklFV19UWVBFLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7XG4gICAgY29uc3QgZm9ybUxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfRk9STV9WSUVXX1RZUEUpWzBdO1xuICAgIGNvbnN0IGZvcm1WaWV3ID0gZm9ybUxlYWY/LnZpZXcgYXMgVGFza0Zvcm1WaWV3IHwgdW5kZWZpbmVkO1xuICAgIGlmIChmb3JtVmlldyAmJiB0YXNrKSBmb3JtVmlldy5sb2FkVGFzayh0YXNrKTtcbiAgfVxufSIsICJpbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL1Rhc2tNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZVRhc2ssIFRhc2tTdGF0dXMsIFRhc2tQcmlvcml0eSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY29uc3QgVEFTS19GT1JNX1ZJRVdfVFlQRSA9IFwiY2hyb25pY2xlLXRhc2stZm9ybVwiO1xuXG5leHBvcnQgY2xhc3MgVGFza0Zvcm1WaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSBlZGl0aW5nVGFzazogQ2hyb25pY2xlVGFzayB8IG51bGwgPSBudWxsO1xuICBvblNhdmU/OiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICAgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyLFxuICAgIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyLFxuICAgIGVkaXRpbmdUYXNrPzogQ2hyb25pY2xlVGFzayxcbiAgICBvblNhdmU/OiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMudGFza01hbmFnZXIgPSB0YXNrTWFuYWdlcjtcbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IGNhbGVuZGFyTWFuYWdlcjtcbiAgICB0aGlzLmVkaXRpbmdUYXNrID0gZWRpdGluZ1Rhc2sgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSA9IG9uU2F2ZTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7IHJldHVybiBUQVNLX0ZPUk1fVklFV19UWVBFOyB9XG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmVkaXRpbmdUYXNrID8gXCJFZGl0IHRhc2tcIiA6IFwiTmV3IHRhc2tcIjsgfVxuICBnZXRJY29uKCk6IHN0cmluZyB7IHJldHVybiBcImNoZWNrLWNpcmNsZVwiOyB9XG5cbiAgYXN5bmMgb25PcGVuKCkgeyB0aGlzLnJlbmRlcigpOyB9XG5cbiAgbG9hZFRhc2sodGFzazogQ2hyb25pY2xlVGFzaykge1xuICAgIHRoaXMuZWRpdGluZ1Rhc2sgPSB0YXNrO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb250YWluZXIuZW1wdHkoKTtcbiAgICBjb250YWluZXIuYWRkQ2xhc3MoXCJjaHJvbmljbGUtZm9ybS1wYWdlXCIpO1xuXG4gICAgY29uc3QgdCA9IHRoaXMuZWRpdGluZ1Rhc2s7XG4gICAgY29uc3QgY2FsZW5kYXJzID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjZi1oZWFkZXJcIik7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdFwiLCB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZi1oZWFkZXItdGl0bGVcIikuc2V0VGV4dCh0ID8gXCJFZGl0IHRhc2tcIiA6IFwiTmV3IHRhc2tcIik7XG4gICAgY29uc3Qgc2F2ZUJ0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tcHJpbWFyeVwiLCB0ZXh0OiB0ID8gXCJTYXZlXCIgOiBcIkFkZFwiIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEZvcm0gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgZm9ybSA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjZi1mb3JtXCIpO1xuXG4gICAgLy8gVGl0bGVcbiAgICBjb25zdCB0aXRsZUZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIlRpdGxlXCIpO1xuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aXRsZUZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICBjbHM6IFwiY2YtaW5wdXQgY2YtdGl0bGUtaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIlRhc2sgbmFtZVwiLFxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSB0Py50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIFN0YXR1cyArIFByaW9yaXR5IChzaWRlIGJ5IHNpZGUpXG4gICAgY29uc3Qgcm93MSA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuXG4gICAgY29uc3Qgc3RhdHVzRmllbGQgPSB0aGlzLmZpZWxkKHJvdzEsIFwiU3RhdHVzXCIpO1xuICAgIGNvbnN0IHN0YXR1c1NlbGVjdCA9IHN0YXR1c0ZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHN0YXR1c2VzOiB7IHZhbHVlOiBUYXNrU3RhdHVzOyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwidG9kb1wiLCAgICAgICAgbGFiZWw6IFwiVG8gZG9cIiB9LFxuICAgICAgeyB2YWx1ZTogXCJpbi1wcm9ncmVzc1wiLCBsYWJlbDogXCJJbiBwcm9ncmVzc1wiIH0sXG4gICAgICB7IHZhbHVlOiBcImRvbmVcIiwgICAgICAgIGxhYmVsOiBcIkRvbmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJjYW5jZWxsZWRcIiwgICBsYWJlbDogXCJDYW5jZWxsZWRcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCBzIG9mIHN0YXR1c2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSBzdGF0dXNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogcy52YWx1ZSwgdGV4dDogcy5sYWJlbCB9KTtcbiAgICAgIGlmICh0Py5zdGF0dXMgPT09IHMudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgcHJpb3JpdHlGaWVsZCA9IHRoaXMuZmllbGQocm93MSwgXCJQcmlvcml0eVwiKTtcbiAgICBjb25zdCBwcmlvcml0eVNlbGVjdCA9IHByaW9yaXR5RmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcHJpb3JpdGllczogeyB2YWx1ZTogVGFza1ByaW9yaXR5OyBsYWJlbDogc3RyaW5nOyBjb2xvcjogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwibm9uZVwiLCAgIGxhYmVsOiBcIk5vbmVcIiwgICBjb2xvcjogXCJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJsb3dcIiwgICAgbGFiZWw6IFwiTG93XCIsICAgIGNvbG9yOiBcIiMzNEM3NTlcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJtZWRpdW1cIiwgbGFiZWw6IFwiTWVkaXVtXCIsIGNvbG9yOiBcIiNGRjk1MDBcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJoaWdoXCIsICAgbGFiZWw6IFwiSGlnaFwiLCAgIGNvbG9yOiBcIiNGRjNCMzBcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCBwIG9mIHByaW9yaXRpZXMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IHByaW9yaXR5U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHAudmFsdWUsIHRleHQ6IHAubGFiZWwgfSk7XG4gICAgICBpZiAodD8ucHJpb3JpdHkgPT09IHAudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gRHVlIGRhdGUgKyB0aW1lIChzaWRlIGJ5IHNpZGUpXG4gICAgY29uc3Qgcm93MiA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuXG4gICAgY29uc3QgZHVlRGF0ZUZpZWxkID0gdGhpcy5maWVsZChyb3cyLCBcIkR1ZSBkYXRlXCIpO1xuICAgIGNvbnN0IGR1ZURhdGVJbnB1dCA9IGR1ZURhdGVGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGR1ZURhdGVJbnB1dC52YWx1ZSA9IHQ/LmR1ZURhdGUgPz8gXCJcIjtcblxuICAgIGNvbnN0IGR1ZVRpbWVGaWVsZCA9IHRoaXMuZmllbGQocm93MiwgXCJEdWUgdGltZVwiKTtcbiAgICBjb25zdCBkdWVUaW1lSW5wdXQgPSBkdWVUaW1lRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRpbWVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBkdWVUaW1lSW5wdXQudmFsdWUgPSB0Py5kdWVUaW1lID8/IFwiXCI7XG5cbiAgICAvLyBDYWxlbmRhclxuICAgIGNvbnN0IGNhbEZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIkNhbGVuZGFyXCIpO1xuICAgIGNvbnN0IGNhbFNlbGVjdCA9IGNhbEZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBcIlwiLCB0ZXh0OiBcIk5vbmVcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGNhbCBvZiBjYWxlbmRhcnMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBjYWwuaWQsIHRleHQ6IGNhbC5uYW1lIH0pO1xuICAgICAgaWYgKHQ/LmNhbGVuZGFySWQgPT09IGNhbC5pZCkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgY2FsZW5kYXIgc2VsZWN0IGRvdCBjb2xvclxuICAgIGNvbnN0IHVwZGF0ZUNhbENvbG9yID0gKCkgPT4ge1xuICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChjYWxTZWxlY3QudmFsdWUpO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRDb2xvciA9IGNhbCA/IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcikgOiBcInRyYW5zcGFyZW50XCI7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdFdpZHRoID0gXCI0cHhcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0U3R5bGUgPSBcInNvbGlkXCI7XG4gICAgfTtcbiAgICBjYWxTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB1cGRhdGVDYWxDb2xvcik7XG4gICAgdXBkYXRlQ2FsQ29sb3IoKTtcblxuICAgIC8vIFJlY3VycmVuY2VcbiAgICBjb25zdCByZWNGaWVsZCA9IHRoaXMuZmllbGQoZm9ybSwgXCJSZXBlYXRcIik7XG4gICAgY29uc3QgcmVjU2VsZWN0ID0gcmVjRmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcmVjdXJyZW5jZXMgPSBbXG4gICAgICB7IHZhbHVlOiBcIlwiLCAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIk5ldmVyXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1EQUlMWVwiLCAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgZGF5XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1XRUVLTFlcIiwgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgd2Vla1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9TU9OVEhMWVwiLCAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IG1vbnRoXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1ZRUFSTFlcIiwgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgeWVhclwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZO0JZREFZPU1PLFRVLFdFLFRILEZSXCIsIGxhYmVsOiBcIldlZWtkYXlzXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgciBvZiByZWN1cnJlbmNlcykge1xuICAgICAgY29uc3Qgb3B0ID0gcmVjU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHIudmFsdWUsIHRleHQ6IHIubGFiZWwgfSk7XG4gICAgICBpZiAodD8ucmVjdXJyZW5jZSA9PT0gci52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBUaW1lIGVzdGltYXRlXG4gICAgY29uc3QgZXN0aW1hdGVGaWVsZCA9IHRoaXMuZmllbGQoZm9ybSwgXCJUaW1lIGVzdGltYXRlXCIpO1xuICAgIGNvbnN0IGVzdGltYXRlV3JhcCA9IGVzdGltYXRlRmllbGQuY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuICAgIGNvbnN0IGVzdGltYXRlSW5wdXQgPSBlc3RpbWF0ZVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcIm51bWJlclwiLCBjbHM6IFwiY2YtaW5wdXQgY2YtaW5wdXQtc21cIiwgcGxhY2Vob2xkZXI6IFwiMFwiXG4gICAgfSk7XG4gICAgZXN0aW1hdGVJbnB1dC52YWx1ZSA9IHQ/LnRpbWVFc3RpbWF0ZSA/IFN0cmluZyh0LnRpbWVFc3RpbWF0ZSkgOiBcIlwiO1xuICAgIGVzdGltYXRlSW5wdXQubWluID0gXCIwXCI7XG4gICAgZXN0aW1hdGVXcmFwLmNyZWF0ZVNwYW4oeyBjbHM6IFwiY2YtdW5pdFwiLCB0ZXh0OiBcIm1pbnV0ZXNcIiB9KTtcblxuICAgIC8vIFRhZ3NcbiAgICBjb25zdCB0YWdzRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGFnc1wiKTtcbiAgICBjb25zdCB0YWdzSW5wdXQgPSB0YWdzRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJ3b3JrLCBwZXJzb25hbCwgdXJnZW50ICAoY29tbWEgc2VwYXJhdGVkKVwiXG4gICAgfSk7XG4gICAgdGFnc0lucHV0LnZhbHVlID0gdD8udGFncy5qb2luKFwiLCBcIikgPz8gXCJcIjtcblxuICAgIC8vIENvbnRleHRzXG4gICAgY29uc3QgY29udGV4dHNGaWVsZCA9IHRoaXMuZmllbGQoZm9ybSwgXCJDb250ZXh0c1wiKTtcbiAgICBjb25zdCBjb250ZXh0c0lucHV0ID0gY29udGV4dHNGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIkBob21lLCBAd29yayAgKGNvbW1hIHNlcGFyYXRlZClcIlxuICAgIH0pO1xuICAgIGNvbnRleHRzSW5wdXQudmFsdWUgPSB0Py5jb250ZXh0cy5qb2luKFwiLCBcIikgPz8gXCJcIjtcblxuICAgIC8vIExpbmtlZCBub3Rlc1xuICAgIGNvbnN0IGxpbmtlZEZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIkxpbmtlZCBub3Rlc1wiKTtcbiAgICBjb25zdCBsaW5rZWRJbnB1dCA9IGxpbmtlZEZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiUHJvamVjdHMvV2Vic2l0ZSwgSm91cm5hbC8yMDI0ICAoY29tbWEgc2VwYXJhdGVkKVwiXG4gICAgfSk7XG4gICAgbGlua2VkSW5wdXQudmFsdWUgPSB0Py5saW5rZWROb3Rlcy5qb2luKFwiLCBcIikgPz8gXCJcIjtcblxuICAgIC8vIEN1c3RvbSBmaWVsZHNcbiAgICBjb25zdCBjdXN0b21TZWN0aW9uID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1zZWN0aW9uXCIpO1xuICAgIGN1c3RvbVNlY3Rpb24uY3JlYXRlRGl2KFwiY2Ytc2VjdGlvbi1sYWJlbFwiKS5zZXRUZXh0KFwiQ3VzdG9tIGZpZWxkc1wiKTtcbiAgICBjb25zdCBjdXN0b21MaXN0ID0gY3VzdG9tU2VjdGlvbi5jcmVhdGVEaXYoXCJjZi1jdXN0b20tbGlzdFwiKTtcbiAgICBjb25zdCBjdXN0b21GaWVsZHM6IHsga2V5OiBzdHJpbmc7IHZhbHVlOiBzdHJpbmcgfVtdID0gW1xuICAgICAgLi4uKHQ/LmN1c3RvbUZpZWxkcy5tYXAoZiA9PiAoeyBrZXk6IGYua2V5LCB2YWx1ZTogU3RyaW5nKGYudmFsdWUpIH0pKSA/PyBbXSlcbiAgICBdO1xuXG4gICAgY29uc3QgcmVuZGVyQ3VzdG9tRmllbGRzID0gKCkgPT4ge1xuICAgICAgY3VzdG9tTGlzdC5lbXB0eSgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXN0b21GaWVsZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2YgPSBjdXN0b21GaWVsZHNbaV07XG4gICAgICAgIGNvbnN0IGNmUm93ID0gY3VzdG9tTGlzdC5jcmVhdGVEaXYoXCJjZi1jdXN0b20tcm93XCIpO1xuICAgICAgICBjb25zdCBrZXlJbnB1dCA9IGNmUm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXQgY2YtY3VzdG9tLWtleVwiLCBwbGFjZWhvbGRlcjogXCJGaWVsZCBuYW1lXCJcbiAgICAgICAgfSk7XG4gICAgICAgIGtleUlucHV0LnZhbHVlID0gY2Yua2V5O1xuICAgICAgICBrZXlJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4geyBjdXN0b21GaWVsZHNbaV0ua2V5ID0ga2V5SW5wdXQudmFsdWU7IH0pO1xuXG4gICAgICAgIGNvbnN0IHZhbElucHV0ID0gY2ZSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dCBjZi1jdXN0b20tdmFsXCIsIHBsYWNlaG9sZGVyOiBcIlZhbHVlXCJcbiAgICAgICAgfSk7XG4gICAgICAgIHZhbElucHV0LnZhbHVlID0gY2YudmFsdWU7XG4gICAgICAgIHZhbElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7IGN1c3RvbUZpZWxkc1tpXS52YWx1ZSA9IHZhbElucHV0LnZhbHVlOyB9KTtcblxuICAgICAgICBjb25zdCByZW1vdmVCdG4gPSBjZlJvdy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4taWNvblwiLCB0ZXh0OiBcIlx1MDBEN1wiIH0pO1xuICAgICAgICByZW1vdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICBjdXN0b21GaWVsZHMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIHJlbmRlckN1c3RvbUZpZWxkcygpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYWRkQ2ZCdG4gPSBjdXN0b21MaXN0LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImNmLWJ0bi1naG9zdCBjZi1hZGQtZmllbGRcIiwgdGV4dDogXCIrIEFkZCBmaWVsZFwiXG4gICAgICB9KTtcbiAgICAgIGFkZENmQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGN1c3RvbUZpZWxkcy5wdXNoKHsga2V5OiBcIlwiLCB2YWx1ZTogXCJcIiB9KTtcbiAgICAgICAgcmVuZGVyQ3VzdG9tRmllbGRzKCk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJlbmRlckN1c3RvbUZpZWxkcygpO1xuXG4gICAgLy8gTm90ZXNcbiAgICBjb25zdCBub3Rlc0ZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIk5vdGVzXCIpO1xuICAgIGNvbnN0IG5vdGVzSW5wdXQgPSBub3Rlc0ZpZWxkLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImNmLXRleHRhcmVhXCIsIHBsYWNlaG9sZGVyOiBcIkFkZCBub3Rlcy4uLlwiXG4gICAgfSk7XG4gICAgbm90ZXNJbnB1dC52YWx1ZSA9IHQ/Lm5vdGVzID8/IFwiXCI7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQWN0aW9ucyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVEFTS19GT1JNX1ZJRVdfVFlQRSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSB0aXRsZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHsgdGl0bGVJbnB1dC5mb2N1cygpOyB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTsgcmV0dXJuOyB9XG5cbiAgLy8gQ2hlY2sgZm9yIGR1cGxpY2F0ZSB0aXRsZVxuICAgICAgaWYgKCF0aGlzLmVkaXRpbmdUYXNrKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRBbGwoKTtcbiAgICAgICAgY29uc3QgZHVwbGljYXRlID0gZXhpc3RpbmcuZmluZChcbiAgICAgICAgICB0ID0+IHQudGl0bGUudG9Mb3dlckNhc2UoKSA9PT0gdGl0bGUudG9Mb3dlckNhc2UoKVxuICAgICAgICApO1xuICAgICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShgQSB0YXNrIG5hbWVkIFwiJHt0aXRsZX1cIiBhbHJlYWR5IGV4aXN0cy5gLCA0MDAwKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRhc2tEYXRhID0ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgc3RhdHVzOiAgICAgICAgc3RhdHVzU2VsZWN0LnZhbHVlIGFzIFRhc2tTdGF0dXMsXG4gICAgICAgIHByaW9yaXR5OiAgICAgIHByaW9yaXR5U2VsZWN0LnZhbHVlIGFzIFRhc2tQcmlvcml0eSxcbiAgICAgICAgZHVlRGF0ZTogICAgICAgZHVlRGF0ZUlucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgZHVlVGltZTogICAgICAgZHVlVGltZUlucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsZW5kYXJJZDogICAgY2FsU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgcmVjdXJyZW5jZTogICAgcmVjU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgdGltZUVzdGltYXRlOiAgZXN0aW1hdGVJbnB1dC52YWx1ZSA/IHBhcnNlSW50KGVzdGltYXRlSW5wdXQudmFsdWUpIDogdW5kZWZpbmVkLFxuICAgICAgICB0YWdzOiAgICAgICAgICB0YWdzSW5wdXQudmFsdWUgPyB0YWdzSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiBbXSxcbiAgICAgICAgY29udGV4dHM6ICAgICAgY29udGV4dHNJbnB1dC52YWx1ZSA/IGNvbnRleHRzSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiBbXSxcbiAgICAgICAgbGlua2VkTm90ZXM6ICAgbGlua2VkSW5wdXQudmFsdWUgPyBsaW5rZWRJbnB1dC52YWx1ZS5zcGxpdChcIixcIikubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKSA6IFtdLFxuICAgICAgICBwcm9qZWN0czogICAgICB0Py5wcm9qZWN0cyA/PyBbXSxcbiAgICAgICAgdGltZUVudHJpZXM6ICAgdD8udGltZUVudHJpZXMgPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogdD8uY29tcGxldGVkSW5zdGFuY2VzID8/IFtdLFxuICAgICAgICBjdXN0b21GaWVsZHM6ICBjdXN0b21GaWVsZHMuZmlsdGVyKGYgPT4gZi5rZXkpLm1hcChmID0+ICh7IGtleTogZi5rZXksIHZhbHVlOiBmLnZhbHVlIH0pKSxcbiAgICAgICAgbm90ZXM6ICAgICAgICAgbm90ZXNJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICB9O1xuXG4gICAgICBpZiAodCkge1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLnVwZGF0ZSh7IC4uLnQsIC4uLnRhc2tEYXRhIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5jcmVhdGUodGFza0RhdGEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm9uU2F2ZT8uKCk7XG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFRBU0tfRk9STV9WSUVXX1RZUEUpO1xuICAgIH07XG5cbiAgICBzYXZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoYW5kbGVTYXZlKTtcblxuICAgIC8vIFRhYiB0aHJvdWdoIGZpZWxkcyBuYXR1cmFsbHksIEVudGVyIG9uIHRpdGxlIHNhdmVzXG4gICAgdGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZSkgPT4ge1xuICAgICAgaWYgKGUua2V5ID09PSBcIkVudGVyXCIpIGhhbmRsZVNhdmUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZmllbGQocGFyZW50OiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCB3cmFwID0gcGFyZW50LmNyZWF0ZURpdihcImNmLWZpZWxkXCIpO1xuICAgIHdyYXAuY3JlYXRlRGl2KFwiY2YtbGFiZWxcIikuc2V0VGV4dChsYWJlbCk7XG4gICAgcmV0dXJuIHdyYXA7XG4gIH1cbn0iLCAiaW1wb3J0IHsgSXRlbVZpZXcsIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0V2ZW50TWFuYWdlclwiO1xuaW1wb3J0IHsgVGFza01hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9UYXNrTWFuYWdlclwiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVFdmVudCwgQ2hyb25pY2xlVGFzayB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgRXZlbnRNb2RhbCB9IGZyb20gXCIuLi91aS9FdmVudE1vZGFsXCI7XG5cbmV4cG9ydCBjb25zdCBDQUxFTkRBUl9WSUVXX1RZUEUgPSBcImNocm9uaWNsZS1jYWxlbmRhci12aWV3XCI7XG50eXBlIENhbGVuZGFyTW9kZSA9IFwiZGF5XCIgfCBcIndlZWtcIiB8IFwibW9udGhcIiB8IFwieWVhclwiO1xuXG5jb25zdCBIT1VSX0hFSUdIVCA9IDU2O1xuXG5leHBvcnQgY2xhc3MgQ2FsZW5kYXJWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIGV2ZW50TWFuYWdlcjogICAgRXZlbnRNYW5hZ2VyO1xuICBwcml2YXRlIHRhc2tNYW5hZ2VyOiAgICAgVGFza01hbmFnZXI7XG4gIHByaXZhdGUgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXI7XG4gIHByaXZhdGUgY3VycmVudERhdGU6IERhdGUgICAgICAgICA9IG5ldyBEYXRlKCk7XG4gIHByaXZhdGUgbW9kZTogICAgICAgIENhbGVuZGFyTW9kZSA9IFwid2Vla1wiO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICAgZXZlbnRNYW5hZ2VyOiAgICBFdmVudE1hbmFnZXIsXG4gICAgdGFza01hbmFnZXI6ICAgICBUYXNrTWFuYWdlcixcbiAgICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlclxuICApIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLmV2ZW50TWFuYWdlciAgICA9IGV2ZW50TWFuYWdlcjtcbiAgICB0aGlzLnRhc2tNYW5hZ2VyICAgICA9IHRhc2tNYW5hZ2VyO1xuICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyID0gY2FsZW5kYXJNYW5hZ2VyO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogICAgc3RyaW5nIHsgcmV0dXJuIENBTEVOREFSX1ZJRVdfVFlQRTsgfVxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gXCJDaHJvbmljbGUgQ2FsZW5kYXJcIjsgfVxuICBnZXRJY29uKCk6ICAgICAgICBzdHJpbmcgeyByZXR1cm4gXCJjYWxlbmRhclwiOyB9XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG5cbiAgICAvLyBTYW1lIHBlcm1hbmVudCBmaXggYXMgdGFzayBkYXNoYm9hcmQgXHUyMDE0IG1ldGFkYXRhQ2FjaGUgZmlyZXMgYWZ0ZXJcbiAgICAvLyBmcm9udG1hdHRlciBpcyBmdWxseSBwYXJzZWQsIHNvIGRhdGEgaXMgZnJlc2ggd2hlbiB3ZSByZS1yZW5kZXJcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBjb25zdCBpbkV2ZW50cyA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMuZXZlbnRNYW5hZ2VyW1wiZXZlbnRzRm9sZGVyXCJdKTtcbiAgICAgICAgY29uc3QgaW5UYXNrcyAgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLnRhc2tNYW5hZ2VyW1widGFza3NGb2xkZXJcIl0pO1xuICAgICAgICBpZiAoaW5FdmVudHMgfHwgaW5UYXNrcykgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC52YXVsdC5vbihcImNyZWF0ZVwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBjb25zdCBpbkV2ZW50cyA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMuZXZlbnRNYW5hZ2VyW1wiZXZlbnRzRm9sZGVyXCJdKTtcbiAgICAgICAgY29uc3QgaW5UYXNrcyAgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLnRhc2tNYW5hZ2VyW1widGFza3NGb2xkZXJcIl0pO1xuICAgICAgICBpZiAoaW5FdmVudHMgfHwgaW5UYXNrcykgc2V0VGltZW91dCgoKSA9PiB0aGlzLnJlbmRlcigpLCAyMDApO1xuICAgICAgfSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwiZGVsZXRlXCIsIChmaWxlKSA9PiB7XG4gICAgICAgIGNvbnN0IGluRXZlbnRzID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5ldmVudE1hbmFnZXJbXCJldmVudHNGb2xkZXJcIl0pO1xuICAgICAgICBjb25zdCBpblRhc2tzICA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMudGFza01hbmFnZXJbXCJ0YXNrc0ZvbGRlclwiXSk7XG4gICAgICAgIGlmIChpbkV2ZW50cyB8fCBpblRhc2tzKSB0aGlzLnJlbmRlcigpO1xuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgcmVuZGVyKCkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29udGFpbmVyLmVtcHR5KCk7XG4gICAgY29udGFpbmVyLmFkZENsYXNzKFwiY2hyb25pY2xlLWNhbC1hcHBcIik7XG5cbiAgICBjb25zdCB0YXNrcyAgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgLy8gR2V0IGRhdGUgcmFuZ2UgZm9yIGN1cnJlbnQgdmlldyBzbyByZWN1cnJlbmNlIGV4cGFuc2lvbiBpcyBzY29wZWRcbiAgICBjb25zdCByYW5nZVN0YXJ0ID0gdGhpcy5nZXRSYW5nZVN0YXJ0KCk7XG4gICAgY29uc3QgcmFuZ2VFbmQgICA9IHRoaXMuZ2V0UmFuZ2VFbmQoKTtcbiAgICBjb25zdCBldmVudHMgICAgID0gYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuZ2V0SW5SYW5nZVdpdGhSZWN1cnJlbmNlKHJhbmdlU3RhcnQsIHJhbmdlRW5kKTtcblxuICAgIGNvbnN0IGxheW91dCAgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC1sYXlvdXRcIik7XG4gICAgY29uc3Qgc2lkZWJhciA9IGxheW91dC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2FsLXNpZGViYXJcIik7XG4gICAgY29uc3QgbWFpbiAgICA9IGxheW91dC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2FsLW1haW5cIik7XG5cbiAgICB0aGlzLnJlbmRlclNpZGViYXIoc2lkZWJhcik7XG4gICAgdGhpcy5yZW5kZXJUb29sYmFyKG1haW4pO1xuXG4gICAgaWYgICAgICAodGhpcy5tb2RlID09PSBcInllYXJcIikgIHRoaXMucmVuZGVyWWVhclZpZXcobWFpbiwgZXZlbnRzLCB0YXNrcyk7XG4gICAgZWxzZSBpZiAodGhpcy5tb2RlID09PSBcIm1vbnRoXCIpIHRoaXMucmVuZGVyTW9udGhWaWV3KG1haW4sIGV2ZW50cywgdGFza3MpO1xuICAgIGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gXCJ3ZWVrXCIpICB0aGlzLnJlbmRlcldlZWtWaWV3KG1haW4sIGV2ZW50cywgdGFza3MpO1xuICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJEYXlWaWV3KG1haW4sIGV2ZW50cywgdGFza3MpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNpZGViYXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbnByaXZhdGUgZ2V0UmFuZ2VTdGFydCgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwiZGF5XCIpIHJldHVybiB0aGlzLmN1cnJlbnREYXRlLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwid2Vla1wiKSB7XG4gICAgICBjb25zdCBzID0gdGhpcy5nZXRXZWVrU3RhcnQoKTtcbiAgICAgIHJldHVybiBzLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb2RlID09PSBcInllYXJcIikgcmV0dXJuIGAke3RoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKX0tMDEtMDFgO1xuICAgIC8vIG1vbnRoXG4gICAgY29uc3QgeSA9IHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBtID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRNb250aCgpO1xuICAgIHJldHVybiBgJHt5fS0ke1N0cmluZyhtKzEpLnBhZFN0YXJ0KDIsXCIwXCIpfS0wMWA7XG4gIH1cblxuICBwcml2YXRlIGdldFJhbmdlRW5kKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJkYXlcIikgcmV0dXJuIHRoaXMuY3VycmVudERhdGUudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJ3ZWVrXCIpIHtcbiAgICAgIGNvbnN0IHMgPSB0aGlzLmdldFdlZWtTdGFydCgpO1xuICAgICAgY29uc3QgZSA9IG5ldyBEYXRlKHMpOyBlLnNldERhdGUoZS5nZXREYXRlKCkgKyA2KTtcbiAgICAgIHJldHVybiBlLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb2RlID09PSBcInllYXJcIikgcmV0dXJuIGAke3RoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKX0tMTItMzFgO1xuICAgIC8vIG1vbnRoXG4gICAgY29uc3QgeSA9IHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBtID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRNb250aCgpO1xuICAgIHJldHVybiBuZXcgRGF0ZSh5LCBtICsgMSwgMCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclNpZGViYXIoc2lkZWJhcjogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBuZXdFdmVudEJ0biA9IHNpZGViYXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImNocm9uaWNsZS1uZXctdGFzay1idG5cIiwgdGV4dDogXCJOZXcgZXZlbnRcIlxuICAgIH0pO1xuICAgIG5ld0V2ZW50QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBuZXcgRXZlbnRNb2RhbChcbiAgICAgICAgdGhpcy5hcHAsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlcixcbiAgICAgICAgdW5kZWZpbmVkLCAoKSA9PiB0aGlzLnJlbmRlcigpXG4gICAgICApLm9wZW4oKTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyTWluaUNhbGVuZGFyKHNpZGViYXIpO1xuXG4gICAgY29uc3QgY2FsU2VjdGlvbiA9IHNpZGViYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3RzLXNlY3Rpb25cIik7XG4gICAgY2FsU2VjdGlvbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtc2VjdGlvbi1sYWJlbFwiKS5zZXRUZXh0KFwiTXkgQ2FsZW5kYXJzXCIpO1xuXG4gICAgZm9yIChjb25zdCBjYWwgb2YgdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCkpIHtcbiAgICAgIGNvbnN0IHJvdyAgICA9IGNhbFNlY3Rpb24uY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC1saXN0LXJvd1wiKTtcbiAgICAgIGNvbnN0IHRvZ2dsZSA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiLCBjbHM6IFwiY2hyb25pY2xlLWNhbC10b2dnbGVcIiB9KTtcbiAgICAgIHRvZ2dsZS5jaGVja2VkID0gY2FsLmlzVmlzaWJsZTtcbiAgICAgIHRvZ2dsZS5zdHlsZS5hY2NlbnRDb2xvciA9IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcik7XG4gICAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLnRvZ2dsZVZpc2liaWxpdHkoY2FsLmlkKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZG90ID0gcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LWRvdFwiKTtcbiAgICAgIGRvdC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpO1xuICAgICAgcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LW5hbWVcIikuc2V0VGV4dChjYWwubmFtZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNaW5pQ2FsZW5kYXIocGFyZW50OiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IG1pbmkgICA9IHBhcmVudC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1jYWxcIik7XG4gICAgY29uc3QgaGVhZGVyID0gbWluaS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1jYWwtaGVhZGVyXCIpO1xuXG4gICAgY29uc3QgcHJldkJ0biAgICA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjaHJvbmljbGUtbWluaS1uYXZcIiwgdGV4dDogXCJcdTIwMzlcIiB9KTtcbiAgICBjb25zdCBtb250aExhYmVsID0gaGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1taW5pLW1vbnRoLWxhYmVsXCIpO1xuICAgIGNvbnN0IG5leHRCdG4gICAgPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2hyb25pY2xlLW1pbmktbmF2XCIsIHRleHQ6IFwiXHUyMDNBXCIgfSk7XG5cbiAgICBjb25zdCB5ZWFyICA9IHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBtb250aCA9IHRoaXMuY3VycmVudERhdGUuZ2V0TW9udGgoKTtcbiAgICBtb250aExhYmVsLnNldFRleHQoXG4gICAgICBuZXcgRGF0ZSh5ZWFyLCBtb250aCkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyBtb250aDogXCJsb25nXCIsIHllYXI6IFwibnVtZXJpY1wiIH0pXG4gICAgKTtcblxuICAgIHByZXZCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY3VycmVudERhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCAtIDEsIDEpO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9KTtcbiAgICBuZXh0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmN1cnJlbnREYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGggKyAxLCAxKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBncmlkICAgICAgICA9IG1pbmkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktZ3JpZFwiKTtcbiAgICBjb25zdCBmaXJzdERheSAgICA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCAxKS5nZXREYXkoKTtcbiAgICBjb25zdCBkYXlzSW5Nb250aCA9IG5ldyBEYXRlKHllYXIsIG1vbnRoICsgMSwgMCkuZ2V0RGF0ZSgpO1xuICAgIGNvbnN0IHRvZGF5U3RyICAgID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIGZvciAoY29uc3QgZCBvZiBbXCJTXCIsXCJNXCIsXCJUXCIsXCJXXCIsXCJUXCIsXCJGXCIsXCJTXCJdKVxuICAgICAgZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1kYXktbmFtZVwiKS5zZXRUZXh0KGQpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaXJzdERheTsgaSsrKVxuICAgICAgZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1kYXkgY2hyb25pY2xlLW1pbmktZGF5LWVtcHR5XCIpO1xuXG4gICAgZm9yIChsZXQgZCA9IDE7IGQgPD0gZGF5c0luTW9udGg7IGQrKykge1xuICAgICAgY29uc3QgZGF0ZVN0ciA9IGAke3llYXJ9LSR7U3RyaW5nKG1vbnRoKzEpLnBhZFN0YXJ0KDIsXCIwXCIpfS0ke1N0cmluZyhkKS5wYWRTdGFydCgyLFwiMFwiKX1gO1xuICAgICAgY29uc3QgZGF5RWwgICA9IGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktZGF5XCIpO1xuICAgICAgZGF5RWwuc2V0VGV4dChTdHJpbmcoZCkpO1xuICAgICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSBkYXlFbC5hZGRDbGFzcyhcInRvZGF5XCIpO1xuICAgICAgZGF5RWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5jdXJyZW50RGF0ZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkKTtcbiAgICAgICAgdGhpcy5tb2RlID0gXCJkYXlcIjtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBUb29sYmFyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyVG9vbGJhcihtYWluOiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IHRvb2xiYXIgID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2FsLXRvb2xiYXJcIik7XG4gICAgY29uc3QgbmF2R3JvdXAgPSB0b29sYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS1jYWwtbmF2LWdyb3VwXCIpO1xuXG4gICAgbmF2R3JvdXAuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2hyb25pY2xlLWNhbC1uYXYtYnRuXCIsIHRleHQ6IFwiXHUyMDM5XCIgfSlcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZSgtMSkpO1xuICAgIG5hdkdyb3VwLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNocm9uaWNsZS1jYWwtdG9kYXktYnRuXCIsIHRleHQ6IFwiVG9kYXlcIiB9KVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpOyB0aGlzLnJlbmRlcigpOyB9KTtcbiAgICBuYXZHcm91cC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjaHJvbmljbGUtY2FsLW5hdi1idG5cIiwgdGV4dDogXCJcdTIwM0FcIiB9KVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKDEpKTtcblxuICAgIHRvb2xiYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC10b29sYmFyLXRpdGxlXCIpLnNldFRleHQodGhpcy5nZXRUb29sYmFyVGl0bGUoKSk7XG5cbiAgICBjb25zdCBwaWxscyA9IHRvb2xiYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXZpZXctcGlsbHNcIik7XG4gICAgZm9yIChjb25zdCBbbSwgbGFiZWxdIG9mIFtbXCJkYXlcIixcIkRheVwiXSxbXCJ3ZWVrXCIsXCJXZWVrXCJdLFtcIm1vbnRoXCIsXCJNb250aFwiXSxbXCJ5ZWFyXCIsXCJZZWFyXCJdXSBhcyBbQ2FsZW5kYXJNb2RlLHN0cmluZ11bXSkge1xuICAgICAgY29uc3QgcGlsbCA9IHBpbGxzLmNyZWF0ZURpdihcImNocm9uaWNsZS12aWV3LXBpbGxcIik7XG4gICAgICBwaWxsLnNldFRleHQobGFiZWwpO1xuICAgICAgaWYgKHRoaXMubW9kZSA9PT0gbSkgcGlsbC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5tb2RlID0gbTsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBuYXZpZ2F0ZShkaXI6IG51bWJlcikge1xuICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSh0aGlzLmN1cnJlbnREYXRlKTtcbiAgICBpZiAgICAgICh0aGlzLm1vZGUgPT09IFwiZGF5XCIpICBkLnNldERhdGUoZC5nZXREYXRlKCkgKyBkaXIpO1xuICAgIGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gXCJ3ZWVrXCIpIGQuc2V0RGF0ZShkLmdldERhdGUoKSArIGRpciAqIDcpO1xuICAgIGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gXCJ5ZWFyXCIpIGQuc2V0RnVsbFllYXIoZC5nZXRGdWxsWWVhcigpICsgZGlyKTtcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5zZXRNb250aChkLmdldE1vbnRoKCkgKyBkaXIpO1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBkO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIGdldFRvb2xiYXJUaXRsZSgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwieWVhclwiKSAgcmV0dXJuIFN0cmluZyh0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCkpO1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwibW9udGhcIikgcmV0dXJuIHRoaXMuY3VycmVudERhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyBtb250aDogXCJsb25nXCIsIHllYXI6IFwibnVtZXJpY1wiIH0pO1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwiZGF5XCIpICAgcmV0dXJuIHRoaXMuY3VycmVudERhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyB3ZWVrZGF5OiBcImxvbmdcIiwgbW9udGg6IFwibG9uZ1wiLCBkYXk6IFwibnVtZXJpY1wiLCB5ZWFyOiBcIm51bWVyaWNcIiB9KTtcbiAgICBjb25zdCBzdGFydCA9IHRoaXMuZ2V0V2Vla1N0YXJ0KCk7XG4gICAgY29uc3QgZW5kICAgPSBuZXcgRGF0ZShzdGFydCk7IGVuZC5zZXREYXRlKGVuZC5nZXREYXRlKCkgKyA2KTtcbiAgICByZXR1cm4gYCR7c3RhcnQudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIix7IG1vbnRoOlwic2hvcnRcIiwgZGF5OlwibnVtZXJpY1wiIH0pfSBcdTIwMTMgJHtlbmQudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIix7IG1vbnRoOlwic2hvcnRcIiwgZGF5OlwibnVtZXJpY1wiLCB5ZWFyOlwibnVtZXJpY1wiIH0pfWA7XG4gIH1cblxuICBwcml2YXRlIGdldFdlZWtTdGFydCgpOiBEYXRlIHtcbiAgICBjb25zdCBkID0gbmV3IERhdGUodGhpcy5jdXJyZW50RGF0ZSk7XG4gICAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpIC0gZC5nZXREYXkoKSk7XG4gICAgcmV0dXJuIGQ7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgWWVhciB2aWV3IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyWWVhclZpZXcobWFpbjogSFRNTEVsZW1lbnQsIGV2ZW50czogQ2hyb25pY2xlRXZlbnRbXSwgdGFza3M6IENocm9uaWNsZVRhc2tbXSkge1xuICAgIGNvbnN0IHllYXIgICAgID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpO1xuICAgIGNvbnN0IHRvZGF5U3RyID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCB5ZWFyR3JpZCA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLXllYXItZ3JpZFwiKTtcblxuICAgIGZvciAobGV0IG0gPSAwOyBtIDwgMTI7IG0rKykge1xuICAgICAgY29uc3QgY2FyZCA9IHllYXJHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLW1vbnRoLWNhcmRcIik7XG4gICAgICBjb25zdCBuYW1lID0gY2FyZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1tb250aC1uYW1lXCIpO1xuICAgICAgbmFtZS5zZXRUZXh0KG5ldyBEYXRlKHllYXIsIG0pLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgbW9udGg6IFwibG9uZ1wiIH0pKTtcbiAgICAgIG5hbWUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50RGF0ZSA9IG5ldyBEYXRlKHllYXIsIG0sIDEpOyB0aGlzLm1vZGUgPSBcIm1vbnRoXCI7IHRoaXMucmVuZGVyKCk7IH0pO1xuXG4gICAgICBjb25zdCBtaW5pR3JpZCAgICA9IGNhcmQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXllYXItbWluaS1ncmlkXCIpO1xuICAgICAgY29uc3QgZmlyc3REYXkgICAgPSBuZXcgRGF0ZSh5ZWFyLCBtLCAxKS5nZXREYXkoKTtcbiAgICAgIGNvbnN0IGRheXNJbk1vbnRoID0gbmV3IERhdGUoeWVhciwgbSArIDEsIDApLmdldERhdGUoKTtcblxuICAgICAgZm9yIChjb25zdCBkIG9mIFtcIlNcIixcIk1cIixcIlRcIixcIldcIixcIlRcIixcIkZcIixcIlNcIl0pXG4gICAgICAgIG1pbmlHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLWRheS1uYW1lXCIpLnNldFRleHQoZCk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlyc3REYXk7IGkrKylcbiAgICAgICAgbWluaUdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXllYXItZGF5LWVtcHR5XCIpO1xuXG4gICAgICBmb3IgKGxldCBkID0gMTsgZCA8PSBkYXlzSW5Nb250aDsgZCsrKSB7XG4gICAgICAgIGNvbnN0IGRhdGVTdHIgID0gYCR7eWVhcn0tJHtTdHJpbmcobSsxKS5wYWRTdGFydCgyLFwiMFwiKX0tJHtTdHJpbmcoZCkucGFkU3RhcnQoMixcIjBcIil9YDtcbiAgICAgICAgY29uc3QgaGFzRXZlbnQgPSBldmVudHMuc29tZShlID0+IGUuc3RhcnREYXRlID09PSBkYXRlU3RyICYmIHRoaXMuaXNDYWxlbmRhclZpc2libGUoZS5jYWxlbmRhcklkKSk7XG4gICAgICAgIGNvbnN0IGhhc1Rhc2sgID0gdGFza3Muc29tZSh0ID0+IHQuZHVlRGF0ZSA9PT0gZGF0ZVN0ciAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpO1xuICAgICAgICBjb25zdCBkYXlFbCAgICA9IG1pbmlHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLWRheVwiKTtcbiAgICAgICAgZGF5RWwuc2V0VGV4dChTdHJpbmcoZCkpO1xuICAgICAgICBpZiAoZGF0ZVN0ciA9PT0gdG9kYXlTdHIpIGRheUVsLmFkZENsYXNzKFwidG9kYXlcIik7XG4gICAgICAgIGlmIChoYXNFdmVudCkgZGF5RWwuYWRkQ2xhc3MoXCJoYXMtZXZlbnRcIik7XG4gICAgICAgIGlmIChoYXNUYXNrKSAgZGF5RWwuYWRkQ2xhc3MoXCJoYXMtdGFza1wiKTtcbiAgICAgICAgZGF5RWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50RGF0ZSA9IG5ldyBEYXRlKHllYXIsIG0sIGQpOyB0aGlzLm1vZGUgPSBcImRheVwiOyB0aGlzLnJlbmRlcigpOyB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgTW9udGggdmlldyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHJlbmRlck1vbnRoVmlldyhtYWluOiBIVE1MRWxlbWVudCwgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdLCB0YXNrczogQ2hyb25pY2xlVGFza1tdKSB7XG4gICAgY29uc3QgeWVhciAgICAgPSB0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgY29uc3QgbW9udGggICAgPSB0aGlzLmN1cnJlbnREYXRlLmdldE1vbnRoKCk7XG4gICAgY29uc3QgdG9kYXlTdHIgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IGdyaWQgICAgID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtZ3JpZFwiKTtcblxuICAgIGZvciAoY29uc3QgZCBvZiBbXCJTdW5cIixcIk1vblwiLFwiVHVlXCIsXCJXZWRcIixcIlRodVwiLFwiRnJpXCIsXCJTYXRcIl0pXG4gICAgICBncmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1kYXktbmFtZVwiKS5zZXRUZXh0KGQpO1xuXG4gICAgY29uc3QgZmlyc3REYXkgICAgICA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCAxKS5nZXREYXkoKTtcbiAgICBjb25zdCBkYXlzSW5Nb250aCAgID0gbmV3IERhdGUoeWVhciwgbW9udGggKyAxLCAwKS5nZXREYXRlKCk7XG4gICAgY29uc3QgZGF5c0luUHJldk1vbiA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCAwKS5nZXREYXRlKCk7XG5cbiAgICBmb3IgKGxldCBpID0gZmlyc3REYXkgLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3QgY2VsbCA9IGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGwgY2hyb25pY2xlLW1vbnRoLWNlbGwtb3RoZXJcIik7XG4gICAgICBjZWxsLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1jZWxsLW51bVwiKS5zZXRUZXh0KFN0cmluZyhkYXlzSW5QcmV2TW9uIC0gaSkpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGQgPSAxOyBkIDw9IGRheXNJbk1vbnRoOyBkKyspIHtcbiAgICAgIGNvbnN0IGRhdGVTdHIgPSBgJHt5ZWFyfS0ke1N0cmluZyhtb250aCsxKS5wYWRTdGFydCgyLFwiMFwiKX0tJHtTdHJpbmcoZCkucGFkU3RhcnQoMixcIjBcIil9YDtcbiAgICAgIGNvbnN0IGNlbGwgICAgPSBncmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1jZWxsXCIpO1xuICAgICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSBjZWxsLmFkZENsYXNzKFwidG9kYXlcIik7XG4gICAgICBjZWxsLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1jZWxsLW51bVwiKS5zZXRUZXh0KFN0cmluZyhkKSk7XG5cbiAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsICgpID0+IHRoaXMub3Blbk5ld0V2ZW50TW9kYWwoZGF0ZVN0ciwgdHJ1ZSkpO1xuICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnNob3dDYWxDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZGF0ZVN0ciwgdHJ1ZSk7XG4gICAgICB9KTtcblxuICAgICAgZXZlbnRzLmZpbHRlcihlID0+IGUuc3RhcnREYXRlID09PSBkYXRlU3RyICYmIHRoaXMuaXNDYWxlbmRhclZpc2libGUoZS5jYWxlbmRhcklkKSkuc2xpY2UoMCwzKVxuICAgICAgICAuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICAgICAgY29uc3QgY2FsICAgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGV2ZW50LmNhbGVuZGFySWQgPz8gXCJcIik7XG4gICAgICAgICAgY29uc3QgY29sb3IgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCIjMzc4QUREXCI7XG4gICAgICAgICAgY29uc3QgcGlsbCAgPSBjZWxsLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1ldmVudC1waWxsXCIpO1xuICAgICAgICAgIHBpbGwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IgKyBcIjMzXCI7XG4gICAgICAgICAgcGlsbC5zdHlsZS5ib3JkZXJMZWZ0ICAgICAgPSBgM3B4IHNvbGlkICR7Y29sb3J9YDtcbiAgICAgICAgICBwaWxsLnN0eWxlLmNvbG9yICAgICAgICAgICA9IGNvbG9yO1xuICAgICAgICAgIHBpbGwuc2V0VGV4dChldmVudC50aXRsZSk7XG4gICAgICAgICAgcGlsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBuZXcgRXZlbnRNb2RhbCh0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCBldmVudCwgKCkgPT4gdGhpcy5yZW5kZXIoKSkub3BlbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgdGFza3MuZmlsdGVyKHQgPT4gdC5kdWVEYXRlID09PSBkYXRlU3RyICYmIHQuc3RhdHVzICE9PSBcImRvbmVcIikuc2xpY2UoMCwyKVxuICAgICAgICAuZm9yRWFjaCh0YXNrID0+IHtcbiAgICAgICAgICBjb25zdCBwaWxsID0gY2VsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtZXZlbnQtcGlsbFwiKTtcbiAgICAgICAgICBwaWxsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiI0ZGM0IzMDIyXCI7XG4gICAgICAgICAgcGlsbC5zdHlsZS5ib3JkZXJMZWZ0ICAgICAgPSBcIjNweCBzb2xpZCAjRkYzQjMwXCI7XG4gICAgICAgICAgcGlsbC5zdHlsZS5jb2xvciAgICAgICAgICAgPSBcIiNGRjNCMzBcIjtcbiAgICAgICAgICBwaWxsLnNldFRleHQoXCJcdTI3MTMgXCIgKyB0YXNrLnRpdGxlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVtYWluaW5nID0gNyAtICgoZmlyc3REYXkgKyBkYXlzSW5Nb250aCkgJSA3KTtcbiAgICBpZiAocmVtYWluaW5nIDwgNylcbiAgICAgIGZvciAobGV0IGQgPSAxOyBkIDw9IHJlbWFpbmluZzsgZCsrKSB7XG4gICAgICAgIGNvbnN0IGNlbGwgPSBncmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1jZWxsIGNocm9uaWNsZS1tb250aC1jZWxsLW90aGVyXCIpO1xuICAgICAgICBjZWxsLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1jZWxsLW51bVwiKS5zZXRUZXh0KFN0cmluZyhkKSk7XG4gICAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgV2VlayB2aWV3IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyV2Vla1ZpZXcobWFpbjogSFRNTEVsZW1lbnQsIGV2ZW50czogQ2hyb25pY2xlRXZlbnRbXSwgdGFza3M6IENocm9uaWNsZVRhc2tbXSkge1xuICAgIGNvbnN0IHdlZWtTdGFydCA9IHRoaXMuZ2V0V2Vla1N0YXJ0KCk7XG4gICAgY29uc3QgZGF5czogRGF0ZVtdID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogNyB9LCAoXywgaSkgPT4ge1xuICAgICAgY29uc3QgZCA9IG5ldyBEYXRlKHdlZWtTdGFydCk7IGQuc2V0RGF0ZShkLmdldERhdGUoKSArIGkpOyByZXR1cm4gZDtcbiAgICB9KTtcbiAgICBjb25zdCB0b2RheVN0ciA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICAvLyBUaGUgd2VlayBncmlkOiB0aW1lLWNvbCArIDcgZGF5LWNvbHNcbiAgICAvLyBFYWNoIGRheS1jb2wgY29udGFpbnM6IGhlYWRlciBcdTIxOTIgYWxsLWRheSBzaGVsZiBcdTIxOTIgdGltZSBncmlkXG4gICAgLy8gVGhpcyBtaXJyb3JzIGRheSB2aWV3IGV4YWN0bHkgXHUyMDE0IHNoZWxmIGlzIGFsd2F5cyBiZWxvdyB0aGUgZGF0ZSBoZWFkZXJcbiAgICBjb25zdCBjYWxHcmlkID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtd2Vlay1ncmlkXCIpO1xuXG4gICAgLy8gVGltZSBjb2x1bW5cbiAgICBjb25zdCB0aW1lQ29sID0gY2FsR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGltZS1jb2xcIik7XG4gICAgLy8gQmxhbmsgY2VsbCB0aGF0IGFsaWducyB3aXRoIHRoZSBkYXkgaGVhZGVyIHJvd1xuICAgIHRpbWVDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbWUtY29sLWhlYWRlclwiKTtcbiAgICAvLyBCbGFuayBjZWxsIHRoYXQgYWxpZ25zIHdpdGggdGhlIGFsbC1kYXkgc2hlbGYgcm93XG4gICAgY29uc3Qgc2hlbGZTcGFjZXIgPSB0aW1lQ29sLmNyZWF0ZURpdihcImNocm9uaWNsZS10aW1lLWNvbC1zaGVsZi1zcGFjZXJcIik7XG4gICAgc2hlbGZTcGFjZXIuc2V0VGV4dChcImFsbC1kYXlcIik7XG4gICAgLy8gSG91ciBsYWJlbHNcbiAgICBmb3IgKGxldCBoID0gMDsgaCA8IDI0OyBoKyspXG4gICAgICB0aW1lQ29sLmNyZWF0ZURpdihcImNocm9uaWNsZS10aW1lLXNsb3RcIikuc2V0VGV4dCh0aGlzLmZvcm1hdEhvdXIoaCkpO1xuXG4gICAgLy8gRGF5IGNvbHVtbnNcbiAgICBmb3IgKGNvbnN0IGRheSBvZiBkYXlzKSB7XG4gICAgICBjb25zdCBkYXRlU3RyICAgICAgPSBkYXkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgICBjb25zdCBjb2wgICAgICAgICAgPSBjYWxHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktY29sXCIpO1xuICAgICAgY29uc3QgYWxsRGF5RXZlbnRzID0gZXZlbnRzLmZpbHRlcihlID0+IGUuc3RhcnREYXRlID09PSBkYXRlU3RyICYmIGUuYWxsRGF5ICYmIHRoaXMuaXNDYWxlbmRhclZpc2libGUoZS5jYWxlbmRhcklkKSk7XG5cbiAgICAgIC8vIDEuIERheSBoZWFkZXJcbiAgICAgIGNvbnN0IGRheUhlYWRlciA9IGNvbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LWhlYWRlclwiKTtcbiAgICAgIGRheUhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LW5hbWVcIikuc2V0VGV4dChcbiAgICAgICAgZGF5LnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgd2Vla2RheTogXCJzaG9ydFwiIH0pLnRvVXBwZXJDYXNlKClcbiAgICAgICk7XG4gICAgICBjb25zdCBkYXlOdW0gPSBkYXlIZWFkZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1udW1cIik7XG4gICAgICBkYXlOdW0uc2V0VGV4dChTdHJpbmcoZGF5LmdldERhdGUoKSkpO1xuICAgICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSBkYXlOdW0uYWRkQ2xhc3MoXCJ0b2RheVwiKTtcblxuICAgICAgLy8gMi4gQWxsLWRheSBzaGVsZiBcdTIwMTQgc2l0cyBkaXJlY3RseSBiZWxvdyBoZWFkZXIsIHNhbWUgYXMgZGF5IHZpZXdcbiAgICAgIGNvbnN0IHNoZWxmID0gY29sLmNyZWF0ZURpdihcImNocm9uaWNsZS13ZWVrLWFsbGRheS1zaGVsZlwiKTtcbiAgICAgIGZvciAoY29uc3QgZXZlbnQgb2YgYWxsRGF5RXZlbnRzKVxuICAgICAgICB0aGlzLnJlbmRlckV2ZW50UGlsbEFsbERheShzaGVsZiwgZXZlbnQpO1xuXG4gICAgICAvLyAzLiBUaW1lIGdyaWRcbiAgICAgIGNvbnN0IHRpbWVHcmlkID0gY29sLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktdGltZS1ncmlkXCIpO1xuICAgICAgdGltZUdyaWQuc3R5bGUuaGVpZ2h0ID0gYCR7MjQgKiBIT1VSX0hFSUdIVH1weGA7XG5cbiAgICAgIGZvciAobGV0IGggPSAwOyBoIDwgMjQ7IGgrKykge1xuICAgICAgICBjb25zdCBsaW5lID0gdGltZUdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWhvdXItbGluZVwiKTtcbiAgICAgICAgbGluZS5zdHlsZS50b3AgPSBgJHtoICogSE9VUl9IRUlHSFR9cHhgO1xuICAgICAgfVxuXG4gICAgICB0aW1lR3JpZC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgY29uc3QgcmVjdCAgID0gdGltZUdyaWQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IHkgICAgICA9IGUuY2xpZW50WSAtIHJlY3QudG9wO1xuICAgICAgICBjb25zdCBob3VyICAgPSBNYXRoLm1pbihNYXRoLmZsb29yKHkgLyBIT1VSX0hFSUdIVCksIDIzKTtcbiAgICAgICAgY29uc3QgbWludXRlID0gTWF0aC5mbG9vcigoeSAlIEhPVVJfSEVJR0hUKSAvIEhPVVJfSEVJR0hUICogNjAgLyAxNSkgKiAxNTtcbiAgICAgICAgdGhpcy5vcGVuTmV3RXZlbnRNb2RhbChkYXRlU3RyLCBmYWxzZSwgaG91ciwgbWludXRlKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aW1lR3JpZC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCByZWN0ICAgPSB0aW1lR3JpZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgeSAgICAgID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICAgIGNvbnN0IGhvdXIgICA9IE1hdGgubWluKE1hdGguZmxvb3IoeSAvIEhPVVJfSEVJR0hUKSwgMjMpO1xuICAgICAgICBjb25zdCBtaW51dGUgPSBNYXRoLmZsb29yKCh5ICUgSE9VUl9IRUlHSFQpIC8gSE9VUl9IRUlHSFQgKiA2MCAvIDE1KSAqIDE1O1xuICAgICAgICB0aGlzLnNob3dDYWxDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZGF0ZVN0ciwgZmFsc2UsIGhvdXIsIG1pbnV0ZSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gVGltZWQgZXZlbnRzXG4gICAgICBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgIWUuYWxsRGF5ICYmIGUuc3RhcnRUaW1lICYmIHRoaXMuaXNDYWxlbmRhclZpc2libGUoZS5jYWxlbmRhcklkKSlcbiAgICAgICAgLmZvckVhY2goZXZlbnQgPT4gdGhpcy5yZW5kZXJFdmVudFBpbGxUaW1lZCh0aW1lR3JpZCwgZXZlbnQpKTtcblxuICAgICAgLy8gVGFzayBkdWUgcGlsbHNcbiAgICAgIHRhc2tzLmZpbHRlcih0ID0+IHQuZHVlRGF0ZSA9PT0gZGF0ZVN0ciAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpXG4gICAgICAgIC5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICAgIGNvbnN0IHRvcCAgPSB0YXNrLmR1ZVRpbWVcbiAgICAgICAgICAgID8gKCgpID0+IHsgY29uc3QgW2gsbV0gPSB0YXNrLmR1ZVRpbWUhLnNwbGl0KFwiOlwiKS5tYXAoTnVtYmVyKTsgcmV0dXJuIChoICsgbS82MCkgKiBIT1VSX0hFSUdIVDsgfSkoKVxuICAgICAgICAgICAgOiAwO1xuICAgICAgICAgIGNvbnN0IHBpbGwgPSB0aW1lR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1kYXktcGlsbFwiKTtcbiAgICAgICAgICBwaWxsLnN0eWxlLnRvcCAgICAgICAgICAgICA9IGAke3RvcH1weGA7XG4gICAgICAgICAgcGlsbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIiNGRjNCMzAyMlwiO1xuICAgICAgICAgIHBpbGwuc3R5bGUuYm9yZGVyTGVmdCAgICAgID0gXCIzcHggc29saWQgI0ZGM0IzMFwiO1xuICAgICAgICAgIHBpbGwuc3R5bGUuY29sb3IgICAgICAgICAgID0gXCIjRkYzQjMwXCI7XG4gICAgICAgICAgcGlsbC5zZXRUZXh0KFwiXHUyNzEzIFwiICsgdGFzay50aXRsZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIE5vdyBsaW5lXG4gICAgY29uc3Qgbm93ICAgICAgICAgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IG5vd1N0ciAgICAgID0gbm93LnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IHRvZGF5Q29sSWR4ID0gZGF5cy5maW5kSW5kZXgoZCA9PiBkLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdID09PSBub3dTdHIpO1xuICAgIGlmICh0b2RheUNvbElkeCA+PSAwKSB7XG4gICAgICBjb25zdCBjb2xzICAgICA9IGNhbEdyaWQucXVlcnlTZWxlY3RvckFsbChcIi5jaHJvbmljbGUtZGF5LWNvbFwiKTtcbiAgICAgIGNvbnN0IHRvZGF5Q29sID0gY29sc1t0b2RheUNvbElkeF0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgICBjb25zdCB0ZyAgICAgICA9IHRvZGF5Q29sLnF1ZXJ5U2VsZWN0b3IoXCIuY2hyb25pY2xlLWRheS10aW1lLWdyaWRcIikgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICBpZiAodGcpIHtcbiAgICAgICAgY29uc3QgdG9wICA9IChub3cuZ2V0SG91cnMoKSArIG5vdy5nZXRNaW51dGVzKCkgLyA2MCkgKiBIT1VSX0hFSUdIVDtcbiAgICAgICAgY29uc3QgbGluZSA9IHRnLmNyZWF0ZURpdihcImNocm9uaWNsZS1ub3ctbGluZVwiKTtcbiAgICAgICAgbGluZS5zdHlsZS50b3AgPSBgJHt0b3B9cHhgO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBEYXkgdmlldyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHJlbmRlckRheVZpZXcobWFpbjogSFRNTEVsZW1lbnQsIGV2ZW50czogQ2hyb25pY2xlRXZlbnRbXSwgdGFza3M6IENocm9uaWNsZVRhc2tbXSkge1xuICAgIGNvbnN0IGRhdGVTdHIgICAgICA9IHRoaXMuY3VycmVudERhdGUudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgdG9kYXlTdHIgICAgID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCBhbGxEYXlFdmVudHMgPSBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgZS5hbGxEYXkgJiYgdGhpcy5pc0NhbGVuZGFyVmlzaWJsZShlLmNhbGVuZGFySWQpKTtcbiAgICBjb25zdCBkYXlWaWV3ICAgICAgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktdmlld1wiKTtcblxuICAgIC8vIERheSBoZWFkZXJcbiAgICBjb25zdCBkYXlIZWFkZXIgPSBkYXlWaWV3LmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktdmlldy1oZWFkZXJcIik7XG4gICAgZGF5SGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktbmFtZS1sYXJnZVwiKS5zZXRUZXh0KFxuICAgICAgdGhpcy5jdXJyZW50RGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7IHdlZWtkYXk6IFwibG9uZ1wiIH0pLnRvVXBwZXJDYXNlKClcbiAgICApO1xuICAgIGNvbnN0IG51bUVsID0gZGF5SGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktbnVtLWxhcmdlXCIpO1xuICAgIG51bUVsLnNldFRleHQoU3RyaW5nKHRoaXMuY3VycmVudERhdGUuZ2V0RGF0ZSgpKSk7XG4gICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSBudW1FbC5hZGRDbGFzcyhcInRvZGF5XCIpO1xuXG4gICAgLy8gQWxsLWRheSBzaGVsZlxuICAgIGNvbnN0IHNoZWxmICAgICAgICA9IGRheVZpZXcuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1hbGxkYXktc2hlbGZcIik7XG4gICAgc2hlbGYuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1hbGxkYXktbGFiZWxcIikuc2V0VGV4dChcImFsbC1kYXlcIik7XG4gICAgY29uc3Qgc2hlbGZDb250ZW50ID0gc2hlbGYuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1hbGxkYXktY29udGVudFwiKTtcbiAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIGFsbERheUV2ZW50cylcbiAgICAgIHRoaXMucmVuZGVyRXZlbnRQaWxsQWxsRGF5KHNoZWxmQ29udGVudCwgZXZlbnQpO1xuXG4gICAgLy8gVGltZSBhcmVhXG4gICAgY29uc3QgdGltZUFyZWEgICA9IGRheVZpZXcuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1zaW5nbGUtYXJlYVwiKTtcbiAgICBjb25zdCB0aW1lTGFiZWxzID0gdGltZUFyZWEuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1zaW5nbGUtbGFiZWxzXCIpO1xuICAgIGNvbnN0IGV2ZW50Q29sICAgPSB0aW1lQXJlYS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LXNpbmdsZS1ldmVudHNcIik7XG4gICAgZXZlbnRDb2wuc3R5bGUuaGVpZ2h0ID0gYCR7MjQgKiBIT1VSX0hFSUdIVH1weGA7XG5cbiAgICBmb3IgKGxldCBoID0gMDsgaCA8IDI0OyBoKyspIHtcbiAgICAgIHRpbWVMYWJlbHMuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbWUtc2xvdFwiKS5zZXRUZXh0KHRoaXMuZm9ybWF0SG91cihoKSk7XG4gICAgICBjb25zdCBsaW5lID0gZXZlbnRDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWhvdXItbGluZVwiKTtcbiAgICAgIGxpbmUuc3R5bGUudG9wID0gYCR7aCAqIEhPVVJfSEVJR0hUfXB4YDtcbiAgICB9XG5cbiAgICBldmVudENvbC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgIGNvbnN0IHJlY3QgICA9IGV2ZW50Q29sLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgeSAgICAgID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICBjb25zdCBob3VyICAgPSBNYXRoLm1pbihNYXRoLmZsb29yKHkgLyBIT1VSX0hFSUdIVCksIDIzKTtcbiAgICAgIGNvbnN0IG1pbnV0ZSA9IE1hdGguZmxvb3IoKHkgJSBIT1VSX0hFSUdIVCkgLyBIT1VSX0hFSUdIVCAqIDYwIC8gMTUpICogMTU7XG4gICAgICB0aGlzLm9wZW5OZXdFdmVudE1vZGFsKGRhdGVTdHIsIGZhbHNlLCBob3VyLCBtaW51dGUpO1xuICAgIH0pO1xuXG4gICAgZXZlbnRDb2wuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCByZWN0ICAgPSBldmVudENvbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IHkgICAgICA9IGUuY2xpZW50WSAtIHJlY3QudG9wO1xuICAgICAgY29uc3QgaG91ciAgID0gTWF0aC5taW4oTWF0aC5mbG9vcih5IC8gSE9VUl9IRUlHSFQpLCAyMyk7XG4gICAgICBjb25zdCBtaW51dGUgPSBNYXRoLmZsb29yKCh5ICUgSE9VUl9IRUlHSFQpIC8gSE9VUl9IRUlHSFQgKiA2MCAvIDE1KSAqIDE1O1xuICAgICAgdGhpcy5zaG93Q2FsQ29udGV4dE1lbnUoZS5jbGllbnRYLCBlLmNsaWVudFksIGRhdGVTdHIsIGZhbHNlLCBob3VyLCBtaW51dGUpO1xuICAgIH0pO1xuXG4gICAgZXZlbnRzLmZpbHRlcihlID0+IGUuc3RhcnREYXRlID09PSBkYXRlU3RyICYmICFlLmFsbERheSAmJiBlLnN0YXJ0VGltZSAmJiB0aGlzLmlzQ2FsZW5kYXJWaXNpYmxlKGUuY2FsZW5kYXJJZCkpXG4gICAgICAuZm9yRWFjaChldmVudCA9PiB0aGlzLnJlbmRlckV2ZW50UGlsbFRpbWVkKGV2ZW50Q29sLCBldmVudCkpO1xuXG4gICAgdGFza3MuZmlsdGVyKHQgPT4gdC5kdWVEYXRlID09PSBkYXRlU3RyICYmIHQuc3RhdHVzICE9PSBcImRvbmVcIilcbiAgICAgIC5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICBjb25zdCB0b3AgID0gdGFzay5kdWVUaW1lXG4gICAgICAgICAgPyAoKCkgPT4geyBjb25zdCBbaCxtXSA9IHRhc2suZHVlVGltZSEuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpOyByZXR1cm4gKGggKyBtLzYwKSAqIEhPVVJfSEVJR0hUOyB9KSgpXG4gICAgICAgICAgOiAwO1xuICAgICAgICBjb25zdCBwaWxsID0gZXZlbnRDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stZGF5LXBpbGxcIik7XG4gICAgICAgIHBpbGwuc3R5bGUudG9wICAgICAgICAgICAgID0gYCR7dG9wfXB4YDtcbiAgICAgICAgcGlsbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIiNGRjNCMzAyMlwiO1xuICAgICAgICBwaWxsLnN0eWxlLmJvcmRlckxlZnQgICAgICA9IFwiM3B4IHNvbGlkICNGRjNCMzBcIjtcbiAgICAgICAgcGlsbC5zdHlsZS5jb2xvciAgICAgICAgICAgPSBcIiNGRjNCMzBcIjtcbiAgICAgICAgcGlsbC5zZXRUZXh0KFwiXHUyNzEzIFwiICsgdGFzay50aXRsZSk7XG4gICAgICB9KTtcblxuICAgIGlmIChkYXRlU3RyID09PSB0b2RheVN0cikge1xuICAgICAgY29uc3Qgbm93ICA9IG5ldyBEYXRlKCk7XG4gICAgICBjb25zdCB0b3AgID0gKG5vdy5nZXRIb3VycygpICsgbm93LmdldE1pbnV0ZXMoKSAvIDYwKSAqIEhPVVJfSEVJR0hUO1xuICAgICAgY29uc3QgbGluZSA9IGV2ZW50Q29sLmNyZWF0ZURpdihcImNocm9uaWNsZS1ub3ctbGluZVwiKTtcbiAgICAgIGxpbmUuc3R5bGUudG9wID0gYCR7dG9wfXB4YDtcbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgSGVscGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIG9wZW5OZXdFdmVudE1vZGFsKGRhdGVTdHI6IHN0cmluZywgYWxsRGF5OiBib29sZWFuLCBob3VyID0gOSwgbWludXRlID0gMCkge1xuICAgIGNvbnN0IHRpbWVTdHIgPSBgJHtTdHJpbmcoaG91cikucGFkU3RhcnQoMixcIjBcIil9OiR7U3RyaW5nKG1pbnV0ZSkucGFkU3RhcnQoMixcIjBcIil9YDtcbiAgICBjb25zdCBlbmRTdHIgID0gYCR7U3RyaW5nKE1hdGgubWluKGhvdXIrMSwyMykpLnBhZFN0YXJ0KDIsXCIwXCIpfToke1N0cmluZyhtaW51dGUpLnBhZFN0YXJ0KDIsXCIwXCIpfWA7XG4gICAgbmV3IEV2ZW50TW9kYWwoXG4gICAgICB0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLFxuICAgICAge1xuICAgICAgICBpZDogXCJcIiwgdGl0bGU6IFwiXCIsIGFsbERheSxcbiAgICAgICAgc3RhcnREYXRlOiBkYXRlU3RyLCBzdGFydFRpbWU6IGFsbERheSA/IHVuZGVmaW5lZCA6IHRpbWVTdHIsXG4gICAgICAgIGVuZERhdGU6ICAgZGF0ZVN0ciwgZW5kVGltZTogICBhbGxEYXkgPyB1bmRlZmluZWQgOiBlbmRTdHIsXG4gICAgICAgIGFsZXJ0OiBcIm5vbmVcIiwgbGlua2VkVGFza0lkczogW10sIGNvbXBsZXRlZEluc3RhbmNlczogW10sIGNyZWF0ZWRBdDogXCJcIlxuICAgICAgfSBhcyBDaHJvbmljbGVFdmVudCxcbiAgICAgICgpID0+IHRoaXMucmVuZGVyKClcbiAgICApLm9wZW4oKTtcbiAgfVxuXG5wcml2YXRlIHNob3dFdmVudENvbnRleHRNZW51KHg6IG51bWJlciwgeTogbnVtYmVyLCBldmVudDogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBjb25zdCBtZW51ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBtZW51LmNsYXNzTmFtZSAgPSBcImNocm9uaWNsZS1jb250ZXh0LW1lbnVcIjtcbiAgICBtZW51LnN0eWxlLmxlZnQgPSBgJHt4fXB4YDtcbiAgICBtZW51LnN0eWxlLnRvcCAgPSBgJHt5fXB4YDtcblxuICAgIGNvbnN0IGVkaXRJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtXCIpO1xuICAgIGVkaXRJdGVtLnNldFRleHQoXCJFZGl0IGV2ZW50XCIpO1xuICAgIGVkaXRJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBtZW51LnJlbW92ZSgpO1xuICAgICAgbmV3IEV2ZW50TW9kYWwodGhpcy5hcHAsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlciwgZXZlbnQsICgpID0+IHRoaXMucmVuZGVyKCkpLm9wZW4oKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGRlbGV0ZUl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW0gY2hyb25pY2xlLWNvbnRleHQtZGVsZXRlXCIpO1xuICAgIGRlbGV0ZUl0ZW0uc2V0VGV4dChcIkRlbGV0ZSBldmVudFwiKTtcbiAgICBkZWxldGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICBtZW51LnJlbW92ZSgpO1xuICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuZGVsZXRlKGV2ZW50LmlkKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1lbnUpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IG1lbnUucmVtb3ZlKCksIHsgb25jZTogdHJ1ZSB9KSwgMCk7XG4gIH1cblxuICBwcml2YXRlIHNob3dDYWxDb250ZXh0TWVudSh4OiBudW1iZXIsIHk6IG51bWJlciwgZGF0ZVN0cjogc3RyaW5nLCBhbGxEYXk6IGJvb2xlYW4sIGhvdXIgPSA5LCBtaW51dGUgPSAwKSB7XG4gICAgY29uc3QgbWVudSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbWVudS5jbGFzc05hbWUgICAgPSBcImNocm9uaWNsZS1jb250ZXh0LW1lbnVcIjtcbiAgICBtZW51LnN0eWxlLmxlZnQgICA9IGAke3h9cHhgO1xuICAgIG1lbnUuc3R5bGUudG9wICAgID0gYCR7eX1weGA7XG5cbiAgICBjb25zdCBhZGRJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtXCIpO1xuICAgIGFkZEl0ZW0uc2V0VGV4dChcIk5ldyBldmVudCBoZXJlXCIpO1xuICAgIGFkZEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgbWVudS5yZW1vdmUoKTsgdGhpcy5vcGVuTmV3RXZlbnRNb2RhbChkYXRlU3RyLCBhbGxEYXksIGhvdXIsIG1pbnV0ZSk7IH0pO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtZW51KTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBtZW51LnJlbW92ZSgpLCB7IG9uY2U6IHRydWUgfSksIDApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJFdmVudFBpbGxUaW1lZChjb250YWluZXI6IEhUTUxFbGVtZW50LCBldmVudDogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBjb25zdCBbc2gsIHNtXSA9IChldmVudC5zdGFydFRpbWUgPz8gXCIwOTowMFwiKS5zcGxpdChcIjpcIikubWFwKE51bWJlcik7XG4gICAgY29uc3QgW2VoLCBlbV0gPSAoZXZlbnQuZW5kVGltZSAgID8/IFwiMTA6MDBcIikuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpO1xuICAgIGNvbnN0IHRvcCAgICA9IChzaCArIHNtIC8gNjApICogSE9VUl9IRUlHSFQ7XG4gICAgY29uc3QgaGVpZ2h0ID0gTWF0aC5tYXgoKGVoIC0gc2ggKyAoZW0gLSBzbSkgLyA2MCkgKiBIT1VSX0hFSUdIVCwgMjIpO1xuICAgIGNvbnN0IGNhbCAgICA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoZXZlbnQuY2FsZW5kYXJJZCA/PyBcIlwiKTtcbiAgICBjb25zdCBjb2xvciAgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCIjMzc4QUREXCI7XG5cbiAgICBjb25zdCBwaWxsID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1ldmVudC1waWxsXCIpO1xuICAgIHBpbGwuc3R5bGUudG9wICAgICAgICAgICAgID0gYCR7dG9wfXB4YDtcbiAgICBwaWxsLnN0eWxlLmhlaWdodCAgICAgICAgICA9IGAke2hlaWdodH1weGA7XG4gICAgcGlsbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvciArIFwiMzNcIjtcbiAgICBwaWxsLnN0eWxlLmJvcmRlckxlZnQgICAgICA9IGAzcHggc29saWQgJHtjb2xvcn1gO1xuICAgIHBpbGwuc3R5bGUuY29sb3IgICAgICAgICAgID0gY29sb3I7XG4gICAgcGlsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZXZlbnQtcGlsbC10aXRsZVwiKS5zZXRUZXh0KGV2ZW50LnRpdGxlKTtcbiAgICBpZiAoaGVpZ2h0ID4gMzYgJiYgZXZlbnQuc3RhcnRUaW1lKVxuICAgICAgcGlsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZXZlbnQtcGlsbC10aW1lXCIpLnNldFRleHQodGhpcy5mb3JtYXRUaW1lKGV2ZW50LnN0YXJ0VGltZSkpO1xuXG4gICAgcGlsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBuZXcgRXZlbnRNb2RhbCh0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCBldmVudCwgKCkgPT4gdGhpcy5yZW5kZXIoKSkub3BlbigpO1xuICAgIH0pO1xuXG4gICAgcGlsbC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB0aGlzLnNob3dFdmVudENvbnRleHRNZW51KGUuY2xpZW50WCwgZS5jbGllbnRZLCBldmVudCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckV2ZW50UGlsbEFsbERheShjb250YWluZXI6IEhUTUxFbGVtZW50LCBldmVudDogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBjb25zdCBjYWwgICA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoZXZlbnQuY2FsZW5kYXJJZCA/PyBcIlwiKTtcbiAgICBjb25zdCBjb2xvciA9IGNhbCA/IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcikgOiBcIiMzNzhBRERcIjtcbiAgICBjb25zdCBwaWxsICA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZXZlbnQtcGlsbC1hbGxkYXlcIik7XG4gICAgcGlsbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvciArIFwiMzNcIjtcbiAgICBwaWxsLnN0eWxlLmJvcmRlckxlZnQgICAgICA9IGAzcHggc29saWQgJHtjb2xvcn1gO1xuICAgIHBpbGwuc3R5bGUuY29sb3IgICAgICAgICAgID0gY29sb3I7XG4gICAgcGlsbC5zZXRUZXh0KGV2ZW50LnRpdGxlKTtcbiAgICBwaWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PlxuICAgICAgbmV3IEV2ZW50TW9kYWwodGhpcy5hcHAsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlciwgZXZlbnQsICgpID0+IHRoaXMucmVuZGVyKCkpLm9wZW4oKVxuICAgICk7XG5cbiAgICBwaWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHRoaXMuc2hvd0V2ZW50Q29udGV4dE1lbnUoZS5jbGllbnRYLCBlLmNsaWVudFksIGV2ZW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgaXNDYWxlbmRhclZpc2libGUoY2FsZW5kYXJJZD86IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICghY2FsZW5kYXJJZCkgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoY2FsZW5kYXJJZCk/LmlzVmlzaWJsZSA/PyB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBmb3JtYXRIb3VyKGg6IG51bWJlcik6IHN0cmluZyB7XG4gICAgaWYgKGggPT09IDApICByZXR1cm4gXCIxMiBBTVwiO1xuICAgIGlmIChoIDwgMTIpICAgcmV0dXJuIGAke2h9IEFNYDtcbiAgICBpZiAoaCA9PT0gMTIpIHJldHVybiBcIjEyIFBNXCI7XG4gICAgcmV0dXJuIGAke2ggLSAxMn0gUE1gO1xuICB9XG5cbiAgcHJpdmF0ZSBmb3JtYXRUaW1lKHRpbWVTdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgW2gsIG1dID0gdGltZVN0ci5zcGxpdChcIjpcIikubWFwKE51bWJlcik7XG4gICAgcmV0dXJuIGAke2ggJSAxMiB8fCAxMn06JHtTdHJpbmcobSkucGFkU3RhcnQoMixcIjBcIil9ICR7aCA+PSAxMiA/IFwiUE1cIiA6IFwiQU1cIn1gO1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgTW9kYWwgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0V2ZW50TWFuYWdlclwiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVFdmVudCwgQWxlcnRPZmZzZXQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIEV2ZW50TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXI7XG4gIHByaXZhdGUgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXI7XG4gIHByaXZhdGUgZWRpdGluZ0V2ZW50OiBDaHJvbmljbGVFdmVudCB8IG51bGw7XG4gIHByaXZhdGUgb25TYXZlPzogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcixcbiAgICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcixcbiAgICBlZGl0aW5nRXZlbnQ/OiBDaHJvbmljbGVFdmVudCxcbiAgICBvblNhdmU/OiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5ldmVudE1hbmFnZXIgPSBldmVudE1hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nRXZlbnQgPSBlZGl0aW5nRXZlbnQgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSA9IG9uU2F2ZTtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJjaHJvbmljbGUtZXZlbnQtbW9kYWxcIik7XG5cbiAgICBjb25zdCBlID0gdGhpcy5lZGl0aW5nRXZlbnQ7XG4gICAgY29uc3QgY2FsZW5kYXJzID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZW0taGVhZGVyXCIpO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZW0tdGl0bGVcIikuc2V0VGV4dChlID8gXCJFZGl0IGV2ZW50XCIgOiBcIk5ldyBldmVudFwiKTtcblxuICAgIGNvbnN0IGV4cGFuZEJ0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tZ2hvc3QgY2VtLWV4cGFuZC1idG5cIiB9KTtcbiAgICBleHBhbmRCdG4udGl0bGUgPSBcIk9wZW4gYXMgZnVsbCBwYWdlXCI7XG4gICAgZXhwYW5kQnRuLmlubmVySFRNTCA9IGA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIj48cG9seWxpbmUgcG9pbnRzPVwiMTUgMyAyMSAzIDIxIDlcIi8+PHBvbHlsaW5lIHBvaW50cz1cIjkgMjEgMyAyMSAzIDE1XCIvPjxsaW5lIHgxPVwiMjFcIiB5MT1cIjNcIiB4Mj1cIjE0XCIgeTI9XCIxMFwiLz48bGluZSB4MT1cIjNcIiB5MT1cIjIxXCIgeDI9XCIxMFwiIHkyPVwiMTRcIi8+PC9zdmc+YDtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBGb3JtIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGZvcm0gPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWZvcm1cIik7XG5cbiAgICAvLyBUaXRsZVxuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aGlzLmNlbUZpZWxkKGZvcm0sIFwiVGl0bGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLXRpdGxlLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIkV2ZW50IG5hbWVcIlxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSBlPy50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIExvY2F0aW9uXG4gICAgY29uc3QgbG9jYXRpb25JbnB1dCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJMb2NhdGlvblwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIGxvY2F0aW9uXCJcbiAgICB9KTtcbiAgICBsb2NhdGlvbklucHV0LnZhbHVlID0gZT8ubG9jYXRpb24gPz8gXCJcIjtcblxuICAgIC8vIEFsbCBkYXkgdG9nZ2xlXG4gICAgY29uc3QgYWxsRGF5RmllbGQgPSB0aGlzLmNlbUZpZWxkKGZvcm0sIFwiQWxsIGRheVwiKTtcbiAgICBjb25zdCBhbGxEYXlXcmFwID0gYWxsRGF5RmllbGQuY3JlYXRlRGl2KFwiY2VtLXRvZ2dsZS13cmFwXCIpO1xuICAgIGNvbnN0IGFsbERheVRvZ2dsZSA9IGFsbERheVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiwgY2xzOiBcImNlbS10b2dnbGVcIiB9KTtcbiAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA9IGU/LmFsbERheSA/PyBmYWxzZTtcbiAgICBjb25zdCBhbGxEYXlMYWJlbCA9IGFsbERheVdyYXAuY3JlYXRlU3Bhbih7IGNsczogXCJjZW0tdG9nZ2xlLWxhYmVsXCIsIHRleHQ6IGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJZZXNcIiA6IFwiTm9cIiB9KTtcbiAgICBhbGxEYXlUb2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBhbGxEYXlMYWJlbC5zZXRUZXh0KGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJZZXNcIiA6IFwiTm9cIik7XG4gICAgICB0aW1lRmllbGRzLnN0eWxlLmRpc3BsYXkgPSBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwibm9uZVwiIDogXCJcIjtcbiAgICB9KTtcblxuICAgIC8vIFN0YXJ0IGRhdGUgKyB0aW1lXG4gICAgY29uc3Qgc3RhcnRSb3cgPSBmb3JtLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcbiAgICBjb25zdCBzdGFydERhdGVJbnB1dCA9IHRoaXMuY2VtRmllbGQoc3RhcnRSb3csIFwiU3RhcnQgZGF0ZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0RGF0ZUlucHV0LnZhbHVlID0gZT8uc3RhcnREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBjb25zdCB0aW1lRmllbGRzID0gZm9ybS5jcmVhdGVEaXYoXCJjZW0tdGltZS1maWVsZHNcIik7XG4gICAgdGltZUZpZWxkcy5zdHlsZS5kaXNwbGF5ID0gYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIm5vbmVcIiA6IFwiXCI7XG5cbiAgICBjb25zdCBzdGFydFRpbWVSb3cgPSB0aW1lRmllbGRzLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcbiAgICBjb25zdCBzdGFydFRpbWVJbnB1dCA9IHRoaXMuY2VtRmllbGQoc3RhcnRUaW1lUm93LCBcIlN0YXJ0IHRpbWVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRpbWVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBzdGFydFRpbWVJbnB1dC52YWx1ZSA9IGU/LnN0YXJ0VGltZSA/PyBcIjA5OjAwXCI7XG5cbiAgICBjb25zdCBlbmRUaW1lSW5wdXQgPSB0aGlzLmNlbUZpZWxkKHN0YXJ0VGltZVJvdywgXCJFbmQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGVuZFRpbWVJbnB1dC52YWx1ZSA9IGU/LmVuZFRpbWUgPz8gXCIxMDowMFwiO1xuXG4gICAgLy8gRW5kIGRhdGVcbiAgICBjb25zdCBlbmREYXRlSW5wdXQgPSB0aGlzLmNlbUZpZWxkKHN0YXJ0Um93LCBcIkVuZCBkYXRlXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJkYXRlXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgZW5kRGF0ZUlucHV0LnZhbHVlID0gZT8uZW5kRGF0ZSA/PyBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgLy8gQXV0by1hZHZhbmNlIGVuZCBkYXRlIHdoZW4gc3RhcnQgY2hhbmdlc1xuICAgIHN0YXJ0RGF0ZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgaWYgKCFlbmREYXRlSW5wdXQudmFsdWUgfHwgZW5kRGF0ZUlucHV0LnZhbHVlIDwgc3RhcnREYXRlSW5wdXQudmFsdWUpIHtcbiAgICAgICAgZW5kRGF0ZUlucHV0LnZhbHVlID0gc3RhcnREYXRlSW5wdXQudmFsdWU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBSZXBlYXRcbiAgICBjb25zdCByZWNTZWxlY3QgPSB0aGlzLmNlbUZpZWxkKGZvcm0sIFwiUmVwZWF0XCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHJlY3VycmVuY2VzID0gW1xuICAgICAgeyB2YWx1ZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIk5ldmVyXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1EQUlMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSBkYXlcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IHdlZWtcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPU1PTlRITFlcIiwgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IG1vbnRoXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1ZRUFSTFlcIiwgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSB5ZWFyXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1XRUVLTFk7QllEQVk9TU8sVFUsV0UsVEgsRlJcIiwgIGxhYmVsOiBcIldlZWtkYXlzXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgciBvZiByZWN1cnJlbmNlcykge1xuICAgICAgY29uc3Qgb3B0ID0gcmVjU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHIudmFsdWUsIHRleHQ6IHIubGFiZWwgfSk7XG4gICAgICBpZiAoZT8ucmVjdXJyZW5jZSA9PT0gci52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBDYWxlbmRhclxuICAgIGNvbnN0IGNhbFNlbGVjdCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJDYWxlbmRhclwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogXCJcIiwgdGV4dDogXCJOb25lXCIgfSk7XG4gICAgZm9yIChjb25zdCBjYWwgb2YgY2FsZW5kYXJzKSB7XG4gICAgICBjb25zdCBvcHQgPSBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogY2FsLmlkLCB0ZXh0OiBjYWwubmFtZSB9KTtcbiAgICAgIGlmIChlPy5jYWxlbmRhcklkID09PSBjYWwuaWQpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuICAgIGNvbnN0IHVwZGF0ZUNhbENvbG9yID0gKCkgPT4ge1xuICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChjYWxTZWxlY3QudmFsdWUpO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRDb2xvciA9IGNhbCA/IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcikgOiBcInRyYW5zcGFyZW50XCI7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdFdpZHRoID0gXCI0cHhcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0U3R5bGUgPSBcInNvbGlkXCI7XG4gICAgfTtcbiAgICBjYWxTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB1cGRhdGVDYWxDb2xvcik7XG4gICAgdXBkYXRlQ2FsQ29sb3IoKTtcblxuICAgIC8vIEFsZXJ0XG4gICAgY29uc3QgYWxlcnRTZWxlY3QgPSB0aGlzLmNlbUZpZWxkKGZvcm0sIFwiQWxlcnRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgYWxlcnRzOiB7IHZhbHVlOiBBbGVydE9mZnNldDsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcIm5vbmVcIiwgICAgbGFiZWw6IFwiTm9uZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImF0LXRpbWVcIiwgbGFiZWw6IFwiQXQgdGltZSBvZiBldmVudFwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjVtaW5cIiwgICAgbGFiZWw6IFwiNSBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjEwbWluXCIsICAgbGFiZWw6IFwiMTAgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxNW1pblwiLCAgIGxhYmVsOiBcIjE1IG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMzBtaW5cIiwgICBsYWJlbDogXCIzMCBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjFob3VyXCIsICAgbGFiZWw6IFwiMSBob3VyIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJob3Vyc1wiLCAgbGFiZWw6IFwiMiBob3VycyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxZGF5XCIsICAgIGxhYmVsOiBcIjEgZGF5IGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJkYXlzXCIsICAgbGFiZWw6IFwiMiBkYXlzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjF3ZWVrXCIsICAgbGFiZWw6IFwiMSB3ZWVrIGJlZm9yZVwiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IGEgb2YgYWxlcnRzKSB7XG4gICAgICBjb25zdCBvcHQgPSBhbGVydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBhLnZhbHVlLCB0ZXh0OiBhLmxhYmVsIH0pO1xuICAgICAgaWYgKGU/LmFsZXJ0ID09PSBhLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIE5vdGVzXG4gICAgY29uc3Qgbm90ZXNJbnB1dCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJOb3Rlc1wiKS5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJjZi10ZXh0YXJlYVwiLCBwbGFjZWhvbGRlcjogXCJBZGQgbm90ZXMuLi5cIlxuICAgIH0pO1xuICAgIG5vdGVzSW5wdXQudmFsdWUgPSBlPy5ub3RlcyA/PyBcIlwiO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEZvb3RlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb290ZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWZvb3RlclwiKTtcbiAgICBjb25zdCBjYW5jZWxCdG4gPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWdob3N0XCIsIHRleHQ6IFwiQ2FuY2VsXCIgfSk7XG5cbiAgICBpZiAoZSAmJiBlLmlkKSB7XG4gICAgICBjb25zdCBkZWxldGVCdG4gPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWRlbGV0ZVwiLCB0ZXh0OiBcIkRlbGV0ZSBldmVudFwiIH0pO1xuICAgICAgZGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXZlbnRNYW5hZ2VyLmRlbGV0ZShlLmlkKTtcbiAgICAgICAgdGhpcy5vblNhdmU/LigpO1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBzYXZlQnRuID0gZm9vdGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1wcmltYXJ5XCIsIHRleHQ6IGUgJiYgZS5pZCA/IFwiU2F2ZVwiIDogXCJBZGQgZXZlbnRcIiB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIYW5kbGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuY2xvc2UoKSk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSB0aXRsZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHsgdGl0bGVJbnB1dC5mb2N1cygpOyB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTsgcmV0dXJuOyB9XG5cbiAgICAgIGNvbnN0IGV2ZW50RGF0YSA9IHtcbiAgICAgICAgdGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICBsb2NhdGlvbklucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxsRGF5OiAgICAgIGFsbERheVRvZ2dsZS5jaGVja2VkLFxuICAgICAgICBzdGFydERhdGU6ICAgc3RhcnREYXRlSW5wdXQudmFsdWUsXG4gICAgICAgIHN0YXJ0VGltZTogICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IHVuZGVmaW5lZCA6IHN0YXJ0VGltZUlucHV0LnZhbHVlLFxuICAgICAgICBlbmREYXRlOiAgICAgZW5kRGF0ZUlucHV0LnZhbHVlIHx8IHN0YXJ0RGF0ZUlucHV0LnZhbHVlLFxuICAgICAgICBlbmRUaW1lOiAgICAgYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyB1bmRlZmluZWQgOiBlbmRUaW1lSW5wdXQudmFsdWUsXG4gICAgICAgIHJlY3VycmVuY2U6ICByZWNTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBjYWxlbmRhcklkOiAgY2FsU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgIGFsZXJ0U2VsZWN0LnZhbHVlIGFzIEFsZXJ0T2Zmc2V0LFxuICAgICAgICBub3RlczogICAgICAgbm90ZXNJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGxpbmtlZFRhc2tJZHM6IGU/LmxpbmtlZFRhc2tJZHMgPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogZT8uY29tcGxldGVkSW5zdGFuY2VzID8/IFtdLFxuICAgICAgfTtcblxuICAgICAgaWYgKGUgJiYgZS5pZCkge1xuICAgICAgICBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci51cGRhdGUoeyAuLi5lLCAuLi5ldmVudERhdGEgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci5jcmVhdGUoZXZlbnREYXRhKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5vblNhdmU/LigpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH07XG5cbiAgICBzYXZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoYW5kbGVTYXZlKTtcbiAgICBleHBhbmRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIC8vIFJlLW9wZW4gYXMgZnVsbCBwYWdlIChmdXR1cmU6IEV2ZW50Rm9ybVZpZXcpXG4gICAgfSk7XG5cbiAgICB0aXRsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChlKSA9PiB7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIikgaGFuZGxlU2F2ZSgpO1xuICAgICAgaWYgKGUua2V5ID09PSBcIkVzY2FwZVwiKSB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbkNsb3NlKCkge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIGNlbUZpZWxkKHBhcmVudDogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3Qgd3JhcCA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZi1maWVsZFwiKTtcbiAgICB3cmFwLmNyZWF0ZURpdihcImNmLWxhYmVsXCIpLnNldFRleHQobGFiZWwpO1xuICAgIHJldHVybiB3cmFwO1xuICB9XG59Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQXNDOzs7QUM0SC9CLElBQU0sbUJBQXNDO0FBQUEsRUFDakQsYUFBYTtBQUFBLEVBQ2IsY0FBYztBQUFBLEVBQ2QsV0FBVztBQUFBLElBQ1QsRUFBRSxJQUFJLFlBQVksTUFBTSxZQUFZLE9BQU8sUUFBVSxXQUFXLE1BQU0sWUFBVyxvQkFBSSxLQUFLLEdBQUUsWUFBWSxFQUFFO0FBQUEsSUFDMUcsRUFBRSxJQUFJLFFBQVksTUFBTSxRQUFZLE9BQU8sU0FBVSxXQUFXLE1BQU0sWUFBVyxvQkFBSSxLQUFLLEdBQUUsWUFBWSxFQUFFO0FBQUEsRUFDNUc7QUFBQSxFQUNBLG1CQUFtQjtBQUFB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
