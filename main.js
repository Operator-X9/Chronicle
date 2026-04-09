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

// src/views/EventFormView.ts
var import_obsidian = require("obsidian");

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

// src/views/EventFormView.ts
var EVENT_FORM_VIEW_TYPE = "chronicle-event-form";
var EventFormView = class extends import_obsidian.ItemView {
  constructor(leaf, eventManager, calendarManager, editingEvent, onSave) {
    super(leaf);
    this.editingEvent = null;
    this.eventManager = eventManager;
    this.calendarManager = calendarManager;
    this.editingEvent = editingEvent != null ? editingEvent : null;
    this.onSave = onSave;
  }
  getViewType() {
    return EVENT_FORM_VIEW_TYPE;
  }
  getDisplayText() {
    return this.editingEvent ? "Edit event" : "New event";
  }
  getIcon() {
    return "calendar";
  }
  async onOpen() {
    this.render();
  }
  loadEvent(event) {
    this.editingEvent = event;
    this.render();
  }
  render() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("chronicle-form-page");
    const e = this.editingEvent;
    const calendars = this.calendarManager.getAll();
    const header = container.createDiv("cf-header");
    const cancelBtn = header.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });
    header.createDiv("cf-header-title").setText(e ? "Edit event" : "New event");
    const saveBtn = header.createEl("button", { cls: "cf-btn-primary", text: e ? "Save" : "Add" });
    const form = container.createDiv("cf-form");
    const titleInput = this.field(form, "Title").createEl("input", {
      type: "text",
      cls: "cf-input cf-title-input",
      placeholder: "Event name"
    });
    titleInput.value = (_a = e == null ? void 0 : e.title) != null ? _a : "";
    titleInput.focus();
    const locationInput = this.field(form, "Location").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Add location"
    });
    locationInput.value = (_b = e == null ? void 0 : e.location) != null ? _b : "";
    const allDayWrap = this.field(form, "All day").createDiv("cem-toggle-wrap");
    const allDayToggle = allDayWrap.createEl("input", { type: "checkbox", cls: "cem-toggle" });
    allDayToggle.checked = (_c = e == null ? void 0 : e.allDay) != null ? _c : false;
    const allDayLabel = allDayWrap.createSpan({ cls: "cem-toggle-label" });
    allDayLabel.setText(allDayToggle.checked ? "Yes" : "No");
    allDayToggle.addEventListener("change", () => {
      allDayLabel.setText(allDayToggle.checked ? "Yes" : "No");
      timeFields.style.display = allDayToggle.checked ? "none" : "";
    });
    const dateRow = form.createDiv("cf-row");
    const startDateInput = this.field(dateRow, "Start date").createEl("input", {
      type: "date",
      cls: "cf-input"
    });
    startDateInput.value = (_d = e == null ? void 0 : e.startDate) != null ? _d : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const endDateInput = this.field(dateRow, "End date").createEl("input", {
      type: "date",
      cls: "cf-input"
    });
    endDateInput.value = (_e = e == null ? void 0 : e.endDate) != null ? _e : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    startDateInput.addEventListener("change", () => {
      if (!endDateInput.value || endDateInput.value < startDateInput.value) {
        endDateInput.value = startDateInput.value;
      }
    });
    const timeFields = form.createDiv("cf-row");
    timeFields.style.display = allDayToggle.checked ? "none" : "";
    const startTimeInput = this.field(timeFields, "Start time").createEl("input", {
      type: "time",
      cls: "cf-input"
    });
    startTimeInput.value = (_f = e == null ? void 0 : e.startTime) != null ? _f : "09:00";
    const endTimeInput = this.field(timeFields, "End time").createEl("input", {
      type: "time",
      cls: "cf-input"
    });
    endTimeInput.value = (_g = e == null ? void 0 : e.endTime) != null ? _g : "10:00";
    const recSelect = this.field(form, "Repeat").createEl("select", { cls: "cf-select" });
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
    const calSelect = this.field(form, "Calendar").createEl("select", { cls: "cf-select" });
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
    const alertSelect = this.field(form, "Alert").createEl("select", { cls: "cf-select" });
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
    const notesInput = this.field(form, "Notes").createEl("textarea", {
      cls: "cf-textarea",
      placeholder: "Add notes..."
    });
    notesInput.value = (_h = e == null ? void 0 : e.notes) != null ? _h : "";
    cancelBtn.addEventListener("click", () => {
      this.app.workspace.detachLeavesOfType(EVENT_FORM_VIEW_TYPE);
    });
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
      if (e == null ? void 0 : e.id) {
        await this.eventManager.update({ ...e, ...eventData });
      } else {
        await this.eventManager.create(eventData);
      }
      (_c2 = this.onSave) == null ? void 0 : _c2.call(this);
      this.app.workspace.detachLeavesOfType(EVENT_FORM_VIEW_TYPE);
    };
    saveBtn.addEventListener("click", handleSave);
    titleInput.addEventListener("keydown", (e2) => {
      if (e2.key === "Enter") handleSave();
    });
  }
  field(parent, label) {
    const wrap = parent.createDiv("cf-field");
    wrap.createDiv("cf-label").setText(label);
    return wrap;
  }
};

// src/main.ts
var import_obsidian9 = require("obsidian");

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

// src/data/TaskManager.ts
var import_obsidian2 = require("obsidian");
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
      if (child instanceof import_obsidian2.TFile && child.extension === "md") {
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
    const path = (0, import_obsidian2.normalizePath)(`${this.tasksFolder}/${full.title}.md`);
    await this.app.vault.create(path, this.taskToMarkdown(full));
    return full;
  }
  async update(task) {
    var _a;
    const file = this.findFileForTask(task.id);
    if (!file) return;
    const expectedPath = (0, import_obsidian2.normalizePath)(`${this.tasksFolder}/${task.title}.md`);
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
      if (!(child instanceof import_obsidian2.TFile)) continue;
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
var import_obsidian3 = require("obsidian");
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
      if (child instanceof import_obsidian3.TFile && child.extension === "md") {
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
    const path = (0, import_obsidian3.normalizePath)(`${this.eventsFolder}/${full.title}.md`);
    await this.app.vault.create(path, this.eventToMarkdown(full));
    return full;
  }
  async update(event) {
    var _a;
    const file = this.findFileForEvent(event.id);
    if (!file) return;
    const expectedPath = (0, import_obsidian3.normalizePath)(`${this.eventsFolder}/${event.title}.md`);
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
      if (!(child instanceof import_obsidian3.TFile)) continue;
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

// src/ui/TaskModal.ts
var import_obsidian4 = require("obsidian");
var TaskModal = class extends import_obsidian4.Modal {
  constructor(app, taskManager, calendarManager, editingTask, onSave, onExpand) {
    super(app);
    this.taskManager = taskManager;
    this.calendarManager = calendarManager;
    this.editingTask = editingTask != null ? editingTask : null;
    this.onSave = onSave;
    this.onExpand = onExpand;
  }
  onOpen() {
    var _a, _b, _c, _d;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("chronicle-event-modal");
    const t = this.editingTask;
    const calendars = this.calendarManager.getAll();
    const header = contentEl.createDiv("cem-header");
    header.createDiv("cem-title").setText(t ? "Edit task" : "New task");
    const expandBtn = header.createEl("button", { cls: "cf-btn-ghost cem-expand-btn" });
    expandBtn.title = "Open as full page";
    expandBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
    expandBtn.addEventListener("click", () => {
      var _a2;
      this.close();
      (_a2 = this.onExpand) == null ? void 0 : _a2.call(this, t != null ? t : void 0);
    });
    const form = contentEl.createDiv("cem-form");
    const titleInput = this.field(form, "Title").createEl("input", {
      type: "text",
      cls: "cf-input cf-title-input",
      placeholder: "Task name"
    });
    titleInput.value = (_a = t == null ? void 0 : t.title) != null ? _a : "";
    titleInput.focus();
    const row1 = form.createDiv("cf-row");
    const statusSelect = this.field(row1, "Status").createEl("select", { cls: "cf-select" });
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
    const prioritySelect = this.field(row1, "Priority").createEl("select", { cls: "cf-select" });
    const priorities = [
      { value: "none", label: "None" },
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" }
    ];
    for (const p of priorities) {
      const opt = prioritySelect.createEl("option", { value: p.value, text: p.label });
      if ((t == null ? void 0 : t.priority) === p.value) opt.selected = true;
    }
    const row2 = form.createDiv("cf-row");
    const dueDateInput = this.field(row2, "Due date").createEl("input", {
      type: "date",
      cls: "cf-input"
    });
    dueDateInput.value = (_b = t == null ? void 0 : t.dueDate) != null ? _b : "";
    const dueTimeInput = this.field(row2, "Due time").createEl("input", {
      type: "time",
      cls: "cf-input"
    });
    dueTimeInput.value = (_c = t == null ? void 0 : t.dueTime) != null ? _c : "";
    const calSelect = this.field(form, "Calendar").createEl("select", { cls: "cf-select" });
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
    const recSelect = this.field(form, "Repeat").createEl("select", { cls: "cf-select" });
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
    const notesInput = this.field(form, "Notes").createEl("textarea", {
      cls: "cf-textarea",
      placeholder: "Add notes..."
    });
    notesInput.value = (_d = t == null ? void 0 : t.notes) != null ? _d : "";
    const footer = contentEl.createDiv("cem-footer");
    const cancelBtn = footer.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });
    if (t && t.id) {
      const deleteBtn = footer.createEl("button", { cls: "cf-btn-delete", text: "Delete task" });
      deleteBtn.addEventListener("click", async () => {
        var _a2;
        await this.taskManager.delete(t.id);
        (_a2 = this.onSave) == null ? void 0 : _a2.call(this);
        this.close();
      });
    }
    const saveBtn = footer.createEl("button", {
      cls: "cf-btn-primary",
      text: (t == null ? void 0 : t.id) ? "Save" : "Add task"
    });
    cancelBtn.addEventListener("click", () => this.close());
    const handleSave = async () => {
      var _a2, _b2, _c2, _d2, _e, _f, _g, _h;
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.focus();
        titleInput.classList.add("cf-error");
        return;
      }
      if (!(t == null ? void 0 : t.id)) {
        const existing = await this.taskManager.getAll();
        const duplicate = existing.find((e) => e.title.toLowerCase() === title.toLowerCase());
        if (duplicate) {
          new import_obsidian4.Notice(`A task named "${title}" already exists.`, 4e3);
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
        notes: notesInput.value || void 0,
        tags: (_a2 = t == null ? void 0 : t.tags) != null ? _a2 : [],
        contexts: (_b2 = t == null ? void 0 : t.contexts) != null ? _b2 : [],
        linkedNotes: (_c2 = t == null ? void 0 : t.linkedNotes) != null ? _c2 : [],
        projects: (_d2 = t == null ? void 0 : t.projects) != null ? _d2 : [],
        timeEstimate: t == null ? void 0 : t.timeEstimate,
        timeEntries: (_e = t == null ? void 0 : t.timeEntries) != null ? _e : [],
        customFields: (_f = t == null ? void 0 : t.customFields) != null ? _f : [],
        completedInstances: (_g = t == null ? void 0 : t.completedInstances) != null ? _g : []
      };
      if (t == null ? void 0 : t.id) {
        await this.taskManager.update({ ...t, ...taskData });
      } else {
        await this.taskManager.create(taskData);
      }
      (_h = this.onSave) == null ? void 0 : _h.call(this);
      this.close();
    };
    saveBtn.addEventListener("click", handleSave);
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSave();
      if (e.key === "Escape") this.close();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
  field(parent, label) {
    const wrap = parent.createDiv("cf-field");
    wrap.createDiv("cf-label").setText(label);
    return wrap;
  }
};

// src/views/TaskView.ts
var import_obsidian6 = require("obsidian");

// src/views/TaskFormView.ts
var import_obsidian5 = require("obsidian");
var TASK_FORM_VIEW_TYPE = "chronicle-task-form";
var TaskFormView = class extends import_obsidian5.ItemView {
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
          new import_obsidian5.Notice(`A task named "${title}" already exists.`, 4e3);
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
var TaskView = class extends import_obsidian6.ItemView {
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
    const completedRow = sidebar.createDiv("chronicle-list-row");
    if (this.currentListId === "completed") completedRow.addClass("active");
    const completedIcon = completedRow.createDiv("chronicle-completed-icon");
    completedIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    completedRow.createDiv("chronicle-list-name").setText("Completed");
    const completedCount = all.filter((t) => t.status === "done").length;
    if (completedCount > 0) completedRow.createDiv("chronicle-list-count").setText(String(completedCount));
    completedRow.addEventListener("click", () => {
      this.currentListId = "completed";
      this.render();
    });
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
      flagged: "#FF9500",
      completed: "#34C759"
    };
    if (smartColors[this.currentListId]) {
      const labels = {
        today: "Today",
        scheduled: "Scheduled",
        all: "All",
        flagged: "Flagged",
        completed: "Completed"
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
        case "completed":
          tasks = all.filter((t) => t.status === "done");
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
    const isCompleted = this.currentListId === "completed";
    const countTasks = isCompleted ? tasks : tasks.filter((t) => t.status !== "done");
    if (countTasks.length > 0) {
      const subtitle = header.createDiv("chronicle-main-subtitle");
      if (isCompleted) {
        const clearBtn = subtitle.createEl("button", {
          cls: "chronicle-clear-btn",
          text: "Clear all"
        });
        clearBtn.addEventListener("click", async () => {
          const all2 = await this.taskManager.getAll();
          for (const t of all2.filter((t2) => t2.status === "done")) {
            await this.taskManager.delete(t.id);
          }
          await this.render();
        });
      } else {
        subtitle.setText(
          `${countTasks.length} ${countTasks.length === 1 ? "task" : "tasks"}`
        );
      }
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
    const isArchive = this.currentListId === "completed";
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
      }, 300);
    });
    const content = row.createDiv("chronicle-task-content");
    if (!isArchive) content.addEventListener("click", () => this.openTaskForm(task));
    const titleEl = content.createDiv("chronicle-task-title");
    titleEl.setText(task.title);
    if (isDone) titleEl.addClass("done");
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const metaRow = content.createDiv("chronicle-task-meta");
    if (isArchive && task.completedAt) {
      const completedDate = new Date(task.completedAt);
      metaRow.createSpan("chronicle-task-date").setText(
        "Completed " + completedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      );
    } else if (task.dueDate || task.calendarId) {
      if (task.dueDate) {
        const metaDate = metaRow.createSpan("chronicle-task-date");
        metaDate.setText(this.formatDate(task.dueDate));
        if (task.dueDate < todayStr) metaDate.addClass("overdue");
      }
      if (task.calendarId) {
        const cal = this.calendarManager.getById(task.calendarId);
        if (cal) {
          const calDot = metaRow.createSpan("chronicle-task-cal-dot");
          calDot.style.backgroundColor = CalendarManager.colorToHex(cal.color);
          metaRow.createSpan("chronicle-task-cal-name").setText(cal.name);
        }
      }
    }
    if (!isArchive && task.priority === "high") {
      row.createDiv("chronicle-flag").setText("\u2691");
    }
    if (isArchive) {
      const actions = row.createDiv("chronicle-archive-actions");
      const restoreBtn = actions.createEl("button", {
        cls: "chronicle-archive-btn",
        text: "Restore"
      });
      restoreBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.taskManager.update({ ...task, status: "todo", completedAt: void 0 });
      });
      const deleteBtn = actions.createEl("button", {
        cls: "chronicle-archive-btn chronicle-archive-btn-delete",
        text: "Delete"
      });
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.taskManager.delete(task.id);
      });
      return;
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
      });
      const cancelItem = menu.createDiv("chronicle-context-item");
      cancelItem.setText("Cancel");
      cancelItem.addEventListener("click", () => menu.remove());
      document.body.appendChild(menu);
      setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
    });
  }
  groupTasks(tasks) {
    var _a, _b;
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().split("T")[0];
    if (this.currentListId === "completed") {
      const groups2 = {
        "Today": [],
        "This week": [],
        "Earlier": []
      };
      for (const task of tasks) {
        const d = (_b = (_a = task.completedAt) == null ? void 0 : _a.split("T")[0]) != null ? _b : "";
        if (d === today) groups2["Today"].push(task);
        else if (d >= weekAgo) groups2["This week"].push(task);
        else groups2["Earlier"].push(task);
      }
      return groups2;
    }
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
    new TaskModal(
      this.app,
      this.taskManager,
      this.calendarManager,
      task,
      void 0,
      (t) => this.openTaskFullPage(t)
    ).open();
  }
  async openTaskFullPage(task) {
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
var import_obsidian8 = require("obsidian");

// src/ui/EventModal.ts
var import_obsidian7 = require("obsidian");
var EventModal = class extends import_obsidian7.Modal {
  constructor(app, eventManager, calendarManager, editingEvent, onSave, onExpand) {
    super(app);
    this.eventManager = eventManager;
    this.calendarManager = calendarManager;
    this.editingEvent = editingEvent != null ? editingEvent : null;
    this.onSave = onSave;
    this.onExpand = onExpand;
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
      var _a2;
      this.close();
      (_a2 = this.onExpand) == null ? void 0 : _a2.call(this, e != null ? e : void 0);
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
var CalendarView = class extends import_obsidian8.ItemView {
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
  async openEventFullPage(event) {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(EVENT_FORM_VIEW_TYPE)[0];
    if (existing) existing.detach();
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: EVENT_FORM_VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const formLeaf = workspace.getLeavesOfType(EVENT_FORM_VIEW_TYPE)[0];
    const formView = formLeaf == null ? void 0 : formLeaf.view;
    if (formView && event) formView.loadEvent(event);
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
        () => this.render(),
        (e) => this.openEventFullPage(e)
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
          new EventModal(this.app, this.eventManager, this.calendarManager, event, () => this.render(), (e2) => this.openEventFullPage(e2)).open();
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
    const prefill = {
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
    };
    new EventModal(
      this.app,
      this.eventManager,
      this.calendarManager,
      prefill,
      () => this.render(),
      (e) => this.openEventFullPage(e != null ? e : prefill)
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
      new EventModal(this.app, this.eventManager, this.calendarManager, event, () => this.render(), (e) => this.openEventFullPage(e)).open();
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
      new EventModal(this.app, this.eventManager, this.calendarManager, event, () => this.render(), (e2) => this.openEventFullPage(e2)).open();
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
      () => new EventModal(this.app, this.eventManager, this.calendarManager, event, () => this.render(), (e) => this.openEventFullPage(e)).open()
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
var ChroniclePlugin = class extends import_obsidian9.Plugin {
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
    this.registerView(
      EVENT_FORM_VIEW_TYPE,
      (leaf) => new EventFormView(leaf, this.eventManager, this.calendarManager)
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
  openEventModal(event) {
    new EventModal(
      this.app,
      this.eventManager,
      this.calendarManager,
      event,
      void 0,
      (e) => this.openEventFullPage(e)
    ).open();
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(TASK_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(TASK_FORM_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(CALENDAR_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(EVENT_FORM_VIEW_TYPE);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async openEventFullPage(event) {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(EVENT_FORM_VIEW_TYPE)[0];
    if (existing) existing.detach();
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: EVENT_FORM_VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const formLeaf = workspace.getLeavesOfType(EVENT_FORM_VIEW_TYPE)[0];
    const formView = formLeaf == null ? void 0 : formLeaf.view;
    if (formView && event) formView.loadEvent(event);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3ZpZXdzL0V2ZW50Rm9ybVZpZXcudHMiLCAic3JjL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyLnRzIiwgInNyYy90eXBlcy9pbmRleC50cyIsICJzcmMvZGF0YS9UYXNrTWFuYWdlci50cyIsICJzcmMvZGF0YS9FdmVudE1hbmFnZXIudHMiLCAic3JjL3VpL1Rhc2tNb2RhbC50cyIsICJzcmMvdmlld3MvVGFza1ZpZXcudHMiLCAic3JjL3ZpZXdzL1Rhc2tGb3JtVmlldy50cyIsICJzcmMvdmlld3MvQ2FsZW5kYXJWaWV3LnRzIiwgInNyYy91aS9FdmVudE1vZGFsLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBDaHJvbmljbGVTZXR0aW5ncywgREVGQVVMVF9TRVRUSU5HUywgQ2hyb25pY2xlRXZlbnQgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgRXZlbnRGb3JtVmlldywgRVZFTlRfRk9STV9WSUVXX1RZUEUgfSBmcm9tIFwiLi92aWV3cy9FdmVudEZvcm1WaWV3XCI7XG5pbXBvcnQgeyBQbHVnaW4sIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZVNldHRpbmdzLCBERUZBVUxUX1NFVFRJTkdTIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IENhbGVuZGFyTWFuYWdlciB9IGZyb20gXCIuL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuL2RhdGEvVGFza01hbmFnZXJcIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuL2RhdGEvRXZlbnRNYW5hZ2VyXCI7XG5pbXBvcnQgeyBUYXNrVmlldywgVEFTS19WSUVXX1RZUEUgfSBmcm9tIFwiLi92aWV3cy9UYXNrVmlld1wiO1xuaW1wb3J0IHsgVGFza0Zvcm1WaWV3LCBUQVNLX0ZPUk1fVklFV19UWVBFIH0gZnJvbSBcIi4vdmlld3MvVGFza0Zvcm1WaWV3XCI7XG5pbXBvcnQgeyBDYWxlbmRhclZpZXcsIENBTEVOREFSX1ZJRVdfVFlQRSB9IGZyb20gXCIuL3ZpZXdzL0NhbGVuZGFyVmlld1wiO1xuaW1wb3J0IHsgRXZlbnRNb2RhbCB9IGZyb20gXCIuL3VpL0V2ZW50TW9kYWxcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2hyb25pY2xlUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3M6IENocm9uaWNsZVNldHRpbmdzO1xuICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyO1xuICBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcjtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcblxuICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyID0gbmV3IENhbGVuZGFyTWFuYWdlcihcbiAgICAgIHRoaXMuc2V0dGluZ3MuY2FsZW5kYXJzLFxuICAgICAgKCkgPT4gdGhpcy5zYXZlU2V0dGluZ3MoKVxuICAgICk7XG4gICAgdGhpcy50YXNrTWFuYWdlciAgPSBuZXcgVGFza01hbmFnZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MudGFza3NGb2xkZXIpO1xuICAgIHRoaXMuZXZlbnRNYW5hZ2VyID0gbmV3IEV2ZW50TWFuYWdlcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncy5ldmVudHNGb2xkZXIpO1xuXG4gICAgdGhpcy5yZWdpc3RlclZpZXcoXG4gICAgICBUQVNLX1ZJRVdfVFlQRSxcbiAgICAgIChsZWFmKSA9PiBuZXcgVGFza1ZpZXcobGVhZiwgdGhpcy50YXNrTWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIsIHRoaXMuZXZlbnRNYW5hZ2VyKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlclZpZXcoXG4gICAgICBUQVNLX0ZPUk1fVklFV19UWVBFLFxuICAgICAgKGxlYWYpID0+IG5ldyBUYXNrRm9ybVZpZXcobGVhZiwgdGhpcy50YXNrTWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgIENBTEVOREFSX1ZJRVdfVFlQRSxcbiAgICAgIChsZWFmKSA9PiBuZXcgQ2FsZW5kYXJWaWV3KGxlYWYsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLnRhc2tNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlcilcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJWaWV3KFxuICAgICAgRVZFTlRfRk9STV9WSUVXX1RZUEUsXG4gICAgICAobGVhZikgPT4gbmV3IEV2ZW50Rm9ybVZpZXcobGVhZiwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyKVxuICAgICk7XG5cbiAgICAvLyBSaWJib24gXHUyMDE0IHRhc2tzIChjaGVja2xpc3QgaWNvbilcbiAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJjaGVjay1jaXJjbGVcIiwgXCJDaHJvbmljbGUgVGFza3NcIiwgKCkgPT4gdGhpcy5hY3RpdmF0ZVRhc2tWaWV3KCkpO1xuXG4gICAgLy8gUmliYm9uIFx1MjAxNCBjYWxlbmRhclxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcImNhbGVuZGFyXCIsIFwiQ2hyb25pY2xlIENhbGVuZGFyXCIsICgpID0+IHRoaXMuYWN0aXZhdGVDYWxlbmRhclZpZXcoKSk7XG5cbiAgICAvLyBDb21tYW5kc1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvcGVuLWNocm9uaWNsZVwiLFxuICAgICAgbmFtZTogXCJPcGVuIHRhc2sgZGFzaGJvYXJkXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5hY3RpdmF0ZVRhc2tWaWV3KCksXG4gICAgfSk7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9wZW4tY2FsZW5kYXJcIixcbiAgICAgIG5hbWU6IFwiT3BlbiBjYWxlbmRhclwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHRoaXMuYWN0aXZhdGVDYWxlbmRhclZpZXcoKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibmV3LXRhc2tcIixcbiAgICAgIG5hbWU6IFwiTmV3IHRhc2tcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCJdLCBrZXk6IFwiblwiIH1dLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHRoaXMub3BlblRhc2tGb3JtKCksXG4gICAgfSk7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5ldy1ldmVudFwiLFxuICAgICAgbmFtZTogXCJOZXcgZXZlbnRcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJuXCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5vcGVuRXZlbnRNb2RhbCgpLFxuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coXCJDaHJvbmljbGUgbG9hZGVkIFx1MjcxM1wiKTtcbiAgfVxuXG4gIGFzeW5jIGFjdGl2YXRlVGFza1ZpZXcoKSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGxldCBsZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShUQVNLX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IFRBU0tfVklFV19UWVBFLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgfVxuICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgYXN5bmMgYWN0aXZhdGVDYWxlbmRhclZpZXcoKSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGxldCBsZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShDQUxFTkRBUl9WSUVXX1RZUEUpWzBdO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBDQUxFTkRBUl9WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBhc3luYyBvcGVuVGFza0Zvcm0oKSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShUQVNLX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBpZiAoZXhpc3RpbmcpIGV4aXN0aW5nLmRldGFjaCgpO1xuICAgIGNvbnN0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IFRBU0tfRk9STV9WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIG9wZW5FdmVudE1vZGFsKGV2ZW50PzogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBuZXcgRXZlbnRNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy5ldmVudE1hbmFnZXIsXG4gICAgICB0aGlzLmNhbGVuZGFyTWFuYWdlcixcbiAgICAgIGV2ZW50LFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgKGUpID0+IHRoaXMub3BlbkV2ZW50RnVsbFBhZ2UoZSlcbiAgICApLm9wZW4oKTtcbiAgfVxuXG4gIG9udW5sb2FkKCkge1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVEFTS19WSUVXX1RZUEUpO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVEFTS19GT1JNX1ZJRVdfVFlQRSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShDQUxFTkRBUl9WSUVXX1RZUEUpO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoRVZFTlRfRk9STV9WSUVXX1RZUEUpO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gIH1cblxuICBhc3luYyBvcGVuRXZlbnRGdWxsUGFnZShldmVudD86IENocm9uaWNsZUV2ZW50KSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKGV4aXN0aW5nKSBleGlzdGluZy5kZXRhY2goKTtcbiAgICBjb25zdCBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBFVkVOVF9GT1JNX1ZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuXG4gICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMCkpO1xuICAgIGNvbnN0IGZvcm1MZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgY29uc3QgZm9ybVZpZXcgPSBmb3JtTGVhZj8udmlldyBhcyBFdmVudEZvcm1WaWV3IHwgdW5kZWZpbmVkO1xuICAgIGlmIChmb3JtVmlldyAmJiBldmVudCkgZm9ybVZpZXcubG9hZEV2ZW50KGV2ZW50KTtcbiAgfVxufSIsICJpbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgRXZlbnRNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvRXZlbnRNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZUV2ZW50LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY29uc3QgRVZFTlRfRk9STV9WSUVXX1RZUEUgPSBcImNocm9uaWNsZS1ldmVudC1mb3JtXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudEZvcm1WaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyO1xuICBwcml2YXRlIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICBwcml2YXRlIGVkaXRpbmdFdmVudDogQ2hyb25pY2xlRXZlbnQgfCBudWxsID0gbnVsbDtcbiAgb25TYXZlPzogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBsZWFmOiBXb3Jrc3BhY2VMZWFmLFxuICAgIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyLFxuICAgIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyLFxuICAgIGVkaXRpbmdFdmVudD86IENocm9uaWNsZUV2ZW50LFxuICAgIG9uU2F2ZT86ICgpID0+IHZvaWRcbiAgKSB7XG4gICAgc3VwZXIobGVhZik7XG4gICAgdGhpcy5ldmVudE1hbmFnZXIgICAgPSBldmVudE1hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nRXZlbnQgICAgPSBlZGl0aW5nRXZlbnQgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSAgICAgICAgICA9IG9uU2F2ZTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6ICAgIHN0cmluZyB7IHJldHVybiBFVkVOVF9GT1JNX1ZJRVdfVFlQRTsgfVxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5lZGl0aW5nRXZlbnQgPyBcIkVkaXQgZXZlbnRcIiA6IFwiTmV3IGV2ZW50XCI7IH1cbiAgZ2V0SWNvbigpOiAgICAgICAgc3RyaW5nIHsgcmV0dXJuIFwiY2FsZW5kYXJcIjsgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHsgdGhpcy5yZW5kZXIoKTsgfVxuXG4gIGxvYWRFdmVudChldmVudDogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICB0aGlzLmVkaXRpbmdFdmVudCA9IGV2ZW50O1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb250YWluZXIuZW1wdHkoKTtcbiAgICBjb250YWluZXIuYWRkQ2xhc3MoXCJjaHJvbmljbGUtZm9ybS1wYWdlXCIpO1xuXG4gICAgY29uc3QgZSAgICAgICAgID0gdGhpcy5lZGl0aW5nRXZlbnQ7XG4gICAgY29uc3QgY2FsZW5kYXJzID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjZi1oZWFkZXJcIik7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdFwiLCB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZi1oZWFkZXItdGl0bGVcIikuc2V0VGV4dChlID8gXCJFZGl0IGV2ZW50XCIgOiBcIk5ldyBldmVudFwiKTtcbiAgICBjb25zdCBzYXZlQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1wcmltYXJ5XCIsIHRleHQ6IGUgPyBcIlNhdmVcIiA6IFwiQWRkXCIgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9ybSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb3JtID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNmLWZvcm1cIik7XG5cbiAgICAvLyBUaXRsZVxuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGl0bGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLXRpdGxlLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIkV2ZW50IG5hbWVcIlxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSBlPy50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIExvY2F0aW9uXG4gICAgY29uc3QgbG9jYXRpb25JbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJMb2NhdGlvblwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIGxvY2F0aW9uXCJcbiAgICB9KTtcbiAgICBsb2NhdGlvbklucHV0LnZhbHVlID0gZT8ubG9jYXRpb24gPz8gXCJcIjtcblxuICAgIC8vIEFsbCBkYXkgdG9nZ2xlXG4gICAgY29uc3QgYWxsRGF5V3JhcCAgID0gdGhpcy5maWVsZChmb3JtLCBcIkFsbCBkYXlcIikuY3JlYXRlRGl2KFwiY2VtLXRvZ2dsZS13cmFwXCIpO1xuICAgIGNvbnN0IGFsbERheVRvZ2dsZSA9IGFsbERheVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiwgY2xzOiBcImNlbS10b2dnbGVcIiB9KTtcbiAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA9IGU/LmFsbERheSA/PyBmYWxzZTtcbiAgICBjb25zdCBhbGxEYXlMYWJlbCAgPSBhbGxEYXlXcmFwLmNyZWF0ZVNwYW4oeyBjbHM6IFwiY2VtLXRvZ2dsZS1sYWJlbFwiIH0pO1xuICAgIGFsbERheUxhYmVsLnNldFRleHQoYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIlllc1wiIDogXCJOb1wiKTtcbiAgICBhbGxEYXlUb2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBhbGxEYXlMYWJlbC5zZXRUZXh0KGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJZZXNcIiA6IFwiTm9cIik7XG4gICAgICB0aW1lRmllbGRzLnN0eWxlLmRpc3BsYXkgPSBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwibm9uZVwiIDogXCJcIjtcbiAgICB9KTtcblxuICAgIC8vIERhdGVzXG4gICAgY29uc3QgZGF0ZVJvdyAgICAgID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG4gICAgY29uc3Qgc3RhcnREYXRlSW5wdXQgPSB0aGlzLmZpZWxkKGRhdGVSb3csIFwiU3RhcnQgZGF0ZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0RGF0ZUlucHV0LnZhbHVlID0gZT8uc3RhcnREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBjb25zdCBlbmREYXRlSW5wdXQgPSB0aGlzLmZpZWxkKGRhdGVSb3csIFwiRW5kIGRhdGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcImRhdGVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBlbmREYXRlSW5wdXQudmFsdWUgPSBlPy5lbmREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBzdGFydERhdGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmICghZW5kRGF0ZUlucHV0LnZhbHVlIHx8IGVuZERhdGVJbnB1dC52YWx1ZSA8IHN0YXJ0RGF0ZUlucHV0LnZhbHVlKSB7XG4gICAgICAgIGVuZERhdGVJbnB1dC52YWx1ZSA9IHN0YXJ0RGF0ZUlucHV0LnZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVGltZSBmaWVsZHMgKGhpZGRlbiB3aGVuIGFsbC1kYXkpXG4gICAgY29uc3QgdGltZUZpZWxkcyA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuICAgIHRpbWVGaWVsZHMuc3R5bGUuZGlzcGxheSA9IGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJub25lXCIgOiBcIlwiO1xuXG4gICAgY29uc3Qgc3RhcnRUaW1lSW5wdXQgPSB0aGlzLmZpZWxkKHRpbWVGaWVsZHMsIFwiU3RhcnQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0VGltZUlucHV0LnZhbHVlID0gZT8uc3RhcnRUaW1lID8/IFwiMDk6MDBcIjtcblxuICAgIGNvbnN0IGVuZFRpbWVJbnB1dCA9IHRoaXMuZmllbGQodGltZUZpZWxkcywgXCJFbmQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGVuZFRpbWVJbnB1dC52YWx1ZSA9IGU/LmVuZFRpbWUgPz8gXCIxMDowMFwiO1xuXG4gICAgLy8gUmVwZWF0XG4gICAgY29uc3QgcmVjU2VsZWN0ID0gdGhpcy5maWVsZChmb3JtLCBcIlJlcGVhdFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCByZWN1cnJlbmNlcyA9IFtcbiAgICAgIHsgdmFsdWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJOZXZlclwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9REFJTFlcIiwgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgZGF5XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1XRUVLTFlcIiwgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSB3ZWVrXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1NT05USExZXCIsICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSBtb250aFwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9WUVBUkxZXCIsICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgeWVhclwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZO0JZREFZPU1PLFRVLFdFLFRILEZSXCIsICBsYWJlbDogXCJXZWVrZGF5c1wiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IHIgb2YgcmVjdXJyZW5jZXMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IHJlY1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiByLnZhbHVlLCB0ZXh0OiByLmxhYmVsIH0pO1xuICAgICAgaWYgKGU/LnJlY3VycmVuY2UgPT09IHIudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gQ2FsZW5kYXJcbiAgICBjb25zdCBjYWxTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQ2FsZW5kYXJcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY2FsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IFwiXCIsIHRleHQ6IFwiTm9uZVwiIH0pO1xuICAgIGZvciAoY29uc3QgY2FsIG9mIGNhbGVuZGFycykge1xuICAgICAgY29uc3Qgb3B0ID0gY2FsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGNhbC5pZCwgdGV4dDogY2FsLm5hbWUgfSk7XG4gICAgICBpZiAoZT8uY2FsZW5kYXJJZCA9PT0gY2FsLmlkKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cbiAgICBjb25zdCB1cGRhdGVDYWxDb2xvciA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNhbCA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoY2FsU2VsZWN0LnZhbHVlKTtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0Q29sb3IgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCJ0cmFuc3BhcmVudFwiO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRXaWR0aCA9IFwiNHB4XCI7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdFN0eWxlID0gXCJzb2xpZFwiO1xuICAgIH07XG4gICAgY2FsU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdXBkYXRlQ2FsQ29sb3IpO1xuICAgIHVwZGF0ZUNhbENvbG9yKCk7XG5cbiAgICAvLyBBbGVydFxuICAgIGNvbnN0IGFsZXJ0U2VsZWN0ID0gdGhpcy5maWVsZChmb3JtLCBcIkFsZXJ0XCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IGFsZXJ0czogeyB2YWx1ZTogQWxlcnRPZmZzZXQ7IGxhYmVsOiBzdHJpbmcgfVtdID0gW1xuICAgICAgeyB2YWx1ZTogXCJub25lXCIsICAgIGxhYmVsOiBcIk5vbmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJhdC10aW1lXCIsIGxhYmVsOiBcIkF0IHRpbWUgb2YgZXZlbnRcIiB9LFxuICAgICAgeyB2YWx1ZTogXCI1bWluXCIsICAgIGxhYmVsOiBcIjUgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxMG1pblwiLCAgIGxhYmVsOiBcIjEwIG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMTVtaW5cIiwgICBsYWJlbDogXCIxNSBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjMwbWluXCIsICAgbGFiZWw6IFwiMzAgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxaG91clwiLCAgIGxhYmVsOiBcIjEgaG91ciBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIyaG91cnNcIiwgIGxhYmVsOiBcIjIgaG91cnMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMWRheVwiLCAgICBsYWJlbDogXCIxIGRheSBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIyZGF5c1wiLCAgIGxhYmVsOiBcIjIgZGF5cyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxd2Vla1wiLCAgIGxhYmVsOiBcIjEgd2VlayBiZWZvcmVcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCBhIG9mIGFsZXJ0cykge1xuICAgICAgY29uc3Qgb3B0ID0gYWxlcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogYS52YWx1ZSwgdGV4dDogYS5sYWJlbCB9KTtcbiAgICAgIGlmIChlPy5hbGVydCA9PT0gYS52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBOb3Rlc1xuICAgIGNvbnN0IG5vdGVzSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTm90ZXNcIikuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICBjbHM6IFwiY2YtdGV4dGFyZWFcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIG5vdGVzLi4uXCJcbiAgICB9KTtcbiAgICBub3Rlc0lucHV0LnZhbHVlID0gZT8ubm90ZXMgPz8gXCJcIjtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBBY3Rpb25zIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNhbmNlbEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSB0aXRsZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHsgdGl0bGVJbnB1dC5mb2N1cygpOyB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTsgcmV0dXJuOyB9XG5cbiAgICAgIGNvbnN0IGV2ZW50RGF0YSA9IHtcbiAgICAgICAgdGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICBsb2NhdGlvbklucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxsRGF5OiAgICAgIGFsbERheVRvZ2dsZS5jaGVja2VkLFxuICAgICAgICBzdGFydERhdGU6ICAgc3RhcnREYXRlSW5wdXQudmFsdWUsXG4gICAgICAgIHN0YXJ0VGltZTogICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IHVuZGVmaW5lZCA6IHN0YXJ0VGltZUlucHV0LnZhbHVlLFxuICAgICAgICBlbmREYXRlOiAgICAgZW5kRGF0ZUlucHV0LnZhbHVlIHx8IHN0YXJ0RGF0ZUlucHV0LnZhbHVlLFxuICAgICAgICBlbmRUaW1lOiAgICAgYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyB1bmRlZmluZWQgOiBlbmRUaW1lSW5wdXQudmFsdWUsXG4gICAgICAgIHJlY3VycmVuY2U6ICByZWNTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBjYWxlbmRhcklkOiAgY2FsU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgIGFsZXJ0U2VsZWN0LnZhbHVlIGFzIEFsZXJ0T2Zmc2V0LFxuICAgICAgICBub3RlczogICAgICAgbm90ZXNJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGxpbmtlZFRhc2tJZHM6ICAgICAgZT8ubGlua2VkVGFza0lkcyA/PyBbXSxcbiAgICAgICAgY29tcGxldGVkSW5zdGFuY2VzOiBlPy5jb21wbGV0ZWRJbnN0YW5jZXMgPz8gW10sXG4gICAgICB9O1xuXG4gICAgICBpZiAoZT8uaWQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIudXBkYXRlKHsgLi4uZSwgLi4uZXZlbnREYXRhIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuY3JlYXRlKGV2ZW50RGF0YSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoRVZFTlRfRk9STV9WSUVXX1RZUEUpO1xuICAgIH07XG5cbiAgICBzYXZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoYW5kbGVTYXZlKTtcbiAgICB0aXRsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChlKSA9PiB7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIikgaGFuZGxlU2F2ZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBmaWVsZChwYXJlbnQ6IEhUTUxFbGVtZW50LCBsYWJlbDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHdyYXAgPSBwYXJlbnQuY3JlYXRlRGl2KFwiY2YtZmllbGRcIik7XG4gICAgd3JhcC5jcmVhdGVEaXYoXCJjZi1sYWJlbFwiKS5zZXRUZXh0KGxhYmVsKTtcbiAgICByZXR1cm4gd3JhcDtcbiAgfVxufSIsICJpbXBvcnQgeyBDaHJvbmljbGVDYWxlbmRhciwgQ2FsZW5kYXJDb2xvciB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgQ2FsZW5kYXJNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW107XG4gIHByaXZhdGUgb25VcGRhdGU6ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoY2FsZW5kYXJzOiBDaHJvbmljbGVDYWxlbmRhcltdLCBvblVwZGF0ZTogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuY2FsZW5kYXJzID0gY2FsZW5kYXJzO1xuICAgIHRoaXMub25VcGRhdGUgPSBvblVwZGF0ZTtcbiAgfVxuXG4gIGdldEFsbCgpOiBDaHJvbmljbGVDYWxlbmRhcltdIHtcbiAgICByZXR1cm4gWy4uLnRoaXMuY2FsZW5kYXJzXTtcbiAgfVxuXG4gIGdldEJ5SWQoaWQ6IHN0cmluZyk6IENocm9uaWNsZUNhbGVuZGFyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jYWxlbmRhcnMuZmluZCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICB9XG5cbiAgY3JlYXRlKG5hbWU6IHN0cmluZywgY29sb3I6IENhbGVuZGFyQ29sb3IpOiBDaHJvbmljbGVDYWxlbmRhciB7XG4gICAgY29uc3QgY2FsZW5kYXI6IENocm9uaWNsZUNhbGVuZGFyID0ge1xuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZChuYW1lKSxcbiAgICAgIG5hbWUsXG4gICAgICBjb2xvcixcbiAgICAgIGlzVmlzaWJsZTogdHJ1ZSxcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG4gICAgdGhpcy5jYWxlbmRhcnMucHVzaChjYWxlbmRhcik7XG4gICAgdGhpcy5vblVwZGF0ZSgpO1xuICAgIHJldHVybiBjYWxlbmRhcjtcbiAgfVxuXG4gIHVwZGF0ZShpZDogc3RyaW5nLCBjaGFuZ2VzOiBQYXJ0aWFsPENocm9uaWNsZUNhbGVuZGFyPik6IHZvaWQge1xuICAgIGNvbnN0IGlkeCA9IHRoaXMuY2FsZW5kYXJzLmZpbmRJbmRleCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICAgIGlmIChpZHggPT09IC0xKSByZXR1cm47XG4gICAgdGhpcy5jYWxlbmRhcnNbaWR4XSA9IHsgLi4udGhpcy5jYWxlbmRhcnNbaWR4XSwgLi4uY2hhbmdlcyB9O1xuICAgIHRoaXMub25VcGRhdGUoKTtcbiAgfVxuXG4gIGRlbGV0ZShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5jYWxlbmRhcnMgPSB0aGlzLmNhbGVuZGFycy5maWx0ZXIoKGMpID0+IGMuaWQgIT09IGlkKTtcbiAgICB0aGlzLm9uVXBkYXRlKCk7XG4gIH1cblxuICB0b2dnbGVWaXNpYmlsaXR5KGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFycy5maW5kKChjKSA9PiBjLmlkID09PSBpZCk7XG4gICAgaWYgKGNhbCkge1xuICAgICAgY2FsLmlzVmlzaWJsZSA9ICFjYWwuaXNWaXNpYmxlO1xuICAgICAgdGhpcy5vblVwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldHVybnMgQ1NTIGhleCBjb2xvciBmb3IgYSBDYWxlbmRhckNvbG9yIG5hbWVcbiAgc3RhdGljIGNvbG9yVG9IZXgoY29sb3I6IENhbGVuZGFyQ29sb3IpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1hcDogUmVjb3JkPENhbGVuZGFyQ29sb3IsIHN0cmluZz4gPSB7XG4gICAgICBibHVlOiAgIFwiIzM3OEFERFwiLFxuICAgICAgZ3JlZW46ICBcIiMzNEM3NTlcIixcbiAgICAgIHB1cnBsZTogXCIjQUY1MkRFXCIsXG4gICAgICBvcmFuZ2U6IFwiI0ZGOTUwMFwiLFxuICAgICAgcmVkOiAgICBcIiNGRjNCMzBcIixcbiAgICAgIHRlYWw6ICAgXCIjMzBCMEM3XCIsXG4gICAgICBwaW5rOiAgIFwiI0ZGMkQ1NVwiLFxuICAgICAgeWVsbG93OiBcIiNGRkQ2MEFcIixcbiAgICAgIGdyYXk6ICAgXCIjOEU4RTkzXCIsXG4gICAgfTtcbiAgICByZXR1cm4gbWFwW2NvbG9yXTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVJZChuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJhc2UgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCBcIi1cIikucmVwbGFjZSgvW15hLXowLTktXS9nLCBcIlwiKTtcbiAgICBjb25zdCBzdWZmaXggPSBEYXRlLm5vdygpLnRvU3RyaW5nKDM2KTtcbiAgICByZXR1cm4gYCR7YmFzZX0tJHtzdWZmaXh9YDtcbiAgfVxufSIsICIvLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2FsZW5kYXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgdHlwZSBDYWxlbmRhckNvbG9yID1cbiAgfCBcImJsdWVcIiB8IFwiZ3JlZW5cIiB8IFwicHVycGxlXCIgfCBcIm9yYW5nZVwiXG4gIHwgXCJyZWRcIiB8IFwidGVhbFwiIHwgXCJwaW5rXCIgfCBcInllbGxvd1wiIHwgXCJncmF5XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hyb25pY2xlQ2FsZW5kYXIge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbG9yOiBDYWxlbmRhckNvbG9yO1xuICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgaXNWaXNpYmxlOiBib29sZWFuO1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFRhc2tzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgdHlwZSBUYXNrU3RhdHVzID0gXCJ0b2RvXCIgfCBcImluLXByb2dyZXNzXCIgfCBcImRvbmVcIiB8IFwiY2FuY2VsbGVkXCI7XG5leHBvcnQgdHlwZSBUYXNrUHJpb3JpdHkgPSBcIm5vbmVcIiB8IFwibG93XCIgfCBcIm1lZGl1bVwiIHwgXCJoaWdoXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGltZUVudHJ5IHtcbiAgc3RhcnRUaW1lOiBzdHJpbmc7ICAgLy8gSVNPIDg2MDFcbiAgZW5kVGltZT86IHN0cmluZzsgICAgLy8gSVNPIDg2MDFcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDdXN0b21GaWVsZCB7XG4gIGtleTogc3RyaW5nO1xuICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVUYXNrIHtcbiAgLy8gLS0tIENvcmUgLS0tXG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHN0YXR1czogVGFza1N0YXR1cztcbiAgcHJpb3JpdHk6IFRhc2tQcmlvcml0eTtcblxuICAvLyAtLS0gU2NoZWR1bGluZyAtLS1cbiAgZHVlRGF0ZT86IHN0cmluZzsgICAgICAgLy8gWVlZWS1NTS1ERFxuICBkdWVUaW1lPzogc3RyaW5nOyAgICAgICAvLyBISDptbVxuICByZWN1cnJlbmNlPzogc3RyaW5nOyAgICAvLyBSUlVMRSBzdHJpbmcgZS5nLiBcIkZSRVE9V0VFS0xZO0JZREFZPU1PXCJcblxuICAvLyAtLS0gT3JnYW5pc2F0aW9uIC0tLVxuICBjYWxlbmRhcklkPzogc3RyaW5nOyAgICAvLyBsaW5rcyB0byBhIENocm9uaWNsZUNhbGVuZGFyXG4gIHRhZ3M6IHN0cmluZ1tdO1xuICBjb250ZXh0czogc3RyaW5nW107ICAgICAvLyBlLmcuIFtcIkBob21lXCIsIFwiQHdvcmtcIl1cbiAgbGlua2VkTm90ZXM6IHN0cmluZ1tdOyAgLy8gd2lraWxpbmsgcGF0aHMgZS5nLiBbXCJQcm9qZWN0cy9XZWJzaXRlXCJdXG4gIHByb2plY3RzOiBzdHJpbmdbXTtcblxuICAvLyAtLS0gVGltZSB0cmFja2luZyAtLS1cbiAgdGltZUVzdGltYXRlPzogbnVtYmVyOyAgLy8gbWludXRlc1xuICB0aW1lRW50cmllczogVGltZUVudHJ5W107XG5cbiAgLy8gLS0tIEN1c3RvbSAtLS1cbiAgY3VzdG9tRmllbGRzOiBDdXN0b21GaWVsZFtdO1xuXG4gIC8vIC0tLSBSZWN1cnJlbmNlIGNvbXBsZXRpb24gLS0tXG4gIGNvbXBsZXRlZEluc3RhbmNlczogc3RyaW5nW107IC8vIFlZWVktTU0tREQgZGF0ZXNcblxuICAvLyAtLS0gTWV0YSAtLS1cbiAgY3JlYXRlZEF0OiBzdHJpbmc7ICAgICAgLy8gSVNPIDg2MDFcbiAgY29tcGxldGVkQXQ/OiBzdHJpbmc7ICAgLy8gSVNPIDg2MDFcbiAgbm90ZXM/OiBzdHJpbmc7ICAgICAgICAgLy8gYm9keSBjb250ZW50IG9mIHRoZSBub3RlXG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBFdmVudHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIEFsZXJ0T2Zmc2V0ID1cbiAgfCBcIm5vbmVcIlxuICB8IFwiYXQtdGltZVwiXG4gIHwgXCI1bWluXCIgfCBcIjEwbWluXCIgfCBcIjE1bWluXCIgfCBcIjMwbWluXCJcbiAgfCBcIjFob3VyXCIgfCBcIjJob3Vyc1wiXG4gIHwgXCIxZGF5XCIgfCBcIjJkYXlzXCIgfCBcIjF3ZWVrXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hyb25pY2xlRXZlbnQge1xuICAvLyAtLS0gQ29yZSAoaW4gZm9ybSBvcmRlcikgLS0tXG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGxvY2F0aW9uPzogc3RyaW5nO1xuICBhbGxEYXk6IGJvb2xlYW47XG4gIHN0YXJ0RGF0ZTogc3RyaW5nOyAgICAgIC8vIFlZWVktTU0tRERcbiAgc3RhcnRUaW1lPzogc3RyaW5nOyAgICAgLy8gSEg6bW0gICh1bmRlZmluZWQgd2hlbiBhbGxEYXkpXG4gIGVuZERhdGU6IHN0cmluZzsgICAgICAgIC8vIFlZWVktTU0tRERcbiAgZW5kVGltZT86IHN0cmluZzsgICAgICAgLy8gSEg6bW0gICh1bmRlZmluZWQgd2hlbiBhbGxEYXkpXG4gIHJlY3VycmVuY2U/OiBzdHJpbmc7ICAgIC8vIFJSVUxFIHN0cmluZ1xuICBjYWxlbmRhcklkPzogc3RyaW5nOyAgICAvLyBsaW5rcyB0byBhIENocm9uaWNsZUNhbGVuZGFyXG4gIGFsZXJ0OiBBbGVydE9mZnNldDtcbiAgbm90ZXM/OiBzdHJpbmc7ICAgICAgICAgLy8gYm9keSBjb250ZW50IG9mIHRoZSBub3RlXG5cbiAgLy8gLS0tIENvbm5lY3Rpb25zIC0tLVxuICBsaW5rZWRUYXNrSWRzOiBzdHJpbmdbXTsgICAvLyBDaHJvbmljbGUgdGFzayBJRHNcblxuICAvLyAtLS0gTWV0YSAtLS1cbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG4gIGNvbXBsZXRlZEluc3RhbmNlczogc3RyaW5nW107XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBQbHVnaW4gc2V0dGluZ3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hyb25pY2xlU2V0dGluZ3Mge1xuICAvLyBGb2xkZXIgcGF0aHNcbiAgdGFza3NGb2xkZXI6IHN0cmluZztcbiAgZXZlbnRzRm9sZGVyOiBzdHJpbmc7XG5cbiAgLy8gQ2FsZW5kYXJzIChzdG9yZWQgaW4gc2V0dGluZ3MsIG5vdCBhcyBmaWxlcylcbiAgY2FsZW5kYXJzOiBDaHJvbmljbGVDYWxlbmRhcltdO1xuICBkZWZhdWx0Q2FsZW5kYXJJZDogc3RyaW5nO1xuXG4gIC8vIERlZmF1bHRzXG4gIGRlZmF1bHRUYXNrU3RhdHVzOiBUYXNrU3RhdHVzO1xuICBkZWZhdWx0VGFza1ByaW9yaXR5OiBUYXNrUHJpb3JpdHk7XG4gIGRlZmF1bHRBbGVydDogQWxlcnRPZmZzZXQ7XG5cbiAgLy8gRGlzcGxheVxuICBzdGFydE9mV2VlazogMCB8IDEgfCA2OyAgLy8gMD1TdW4sIDE9TW9uLCA2PVNhdFxuICB0aW1lRm9ybWF0OiBcIjEyaFwiIHwgXCIyNGhcIjtcbiAgZGVmYXVsdENhbGVuZGFyVmlldzogXCJkYXlcIiB8IFwid2Vla1wiIHwgXCJtb250aFwiIHwgXCJ5ZWFyXCI7XG5cbiAgLy8gU21hcnQgbGlzdHMgdmlzaWJpbGl0eVxuICBzaG93VG9kYXlDb3VudDogYm9vbGVhbjtcbiAgc2hvd1NjaGVkdWxlZENvdW50OiBib29sZWFuO1xuICBzaG93RmxhZ2dlZENvdW50OiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogQ2hyb25pY2xlU2V0dGluZ3MgPSB7XG4gIHRhc2tzRm9sZGVyOiBcIkNocm9uaWNsZS9UYXNrc1wiLFxuICBldmVudHNGb2xkZXI6IFwiQ2hyb25pY2xlL0V2ZW50c1wiLFxuICBjYWxlbmRhcnM6IFtcbiAgICB7IGlkOiBcInBlcnNvbmFsXCIsIG5hbWU6IFwiUGVyc29uYWxcIiwgY29sb3I6IFwiYmx1ZVwiLCAgIGlzVmlzaWJsZTogdHJ1ZSwgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSxcbiAgICB7IGlkOiBcIndvcmtcIiwgICAgIG5hbWU6IFwiV29ya1wiLCAgICAgY29sb3I6IFwiZ3JlZW5cIiwgIGlzVmlzaWJsZTogdHJ1ZSwgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSxcbiAgXSxcbiAgZGVmYXVsdENhbGVuZGFySWQ6IFwicGVyc29uYWxcIixcbiAgZGVmYXVsdFRhc2tTdGF0dXM6IFwidG9kb1wiLFxuICBkZWZhdWx0VGFza1ByaW9yaXR5OiBcIm5vbmVcIixcbiAgZGVmYXVsdEFsZXJ0OiBcIm5vbmVcIixcbiAgc3RhcnRPZldlZWs6IDAsXG4gIHRpbWVGb3JtYXQ6IFwiMTJoXCIsXG4gIGRlZmF1bHRDYWxlbmRhclZpZXc6IFwid2Vla1wiLFxuICBzaG93VG9kYXlDb3VudDogdHJ1ZSxcbiAgc2hvd1NjaGVkdWxlZENvdW50OiB0cnVlLFxuICBzaG93RmxhZ2dlZENvdW50OiB0cnVlLFxufTsiLCAiaW1wb3J0IHsgQXBwLCBURmlsZSwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlVGFzaywgVGFza1N0YXR1cywgVGFza1ByaW9yaXR5IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBUYXNrTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwOiBBcHAsIHByaXZhdGUgdGFza3NGb2xkZXI6IHN0cmluZykge31cblxuICAvLyBcdTI1MDBcdTI1MDAgUmVhZCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBnZXRBbGwoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCBmb2xkZXIgPSB0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy50YXNrc0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBbXTtcblxuICAgIGNvbnN0IHRhc2tzOiBDaHJvbmljbGVUYXNrW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbiAgICAgICAgY29uc3QgdGFzayA9IGF3YWl0IHRoaXMuZmlsZVRvVGFzayhjaGlsZCk7XG4gICAgICAgIGlmICh0YXNrKSB0YXNrcy5wdXNoKHRhc2spO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFza3M7XG4gIH1cblxuICBhc3luYyBnZXRCeUlkKGlkOiBzdHJpbmcpOiBQcm9taXNlPENocm9uaWNsZVRhc2sgfCBudWxsPiB7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbmQoKHQpID0+IHQuaWQgPT09IGlkKSA/PyBudWxsO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFdyaXRlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIGFzeW5jIGNyZWF0ZSh0YXNrOiBPbWl0PENocm9uaWNsZVRhc2ssIFwiaWRcIiB8IFwiY3JlYXRlZEF0XCI+KTogUHJvbWlzZTxDaHJvbmljbGVUYXNrPiB7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoKTtcblxuICAgIGNvbnN0IGZ1bGw6IENocm9uaWNsZVRhc2sgPSB7XG4gICAgICAuLi50YXNrLFxuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZCgpLFxuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIGNvbnN0IHBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMudGFza3NGb2xkZXJ9LyR7ZnVsbC50aXRsZX0ubWRgKTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgdGhpcy50YXNrVG9NYXJrZG93bihmdWxsKSk7XG4gICAgcmV0dXJuIGZ1bGw7XG4gIH1cblxuICBhc3luYyB1cGRhdGUodGFzazogQ2hyb25pY2xlVGFzayk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbmRGaWxlRm9yVGFzayh0YXNrLmlkKTtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcblxuICAgIC8vIElmIHRpdGxlIGNoYW5nZWQsIHJlbmFtZSB0aGUgZmlsZVxuICAgIGNvbnN0IGV4cGVjdGVkUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy50YXNrc0ZvbGRlcn0vJHt0YXNrLnRpdGxlfS5tZGApO1xuICAgIGlmIChmaWxlLnBhdGggIT09IGV4cGVjdGVkUGF0aCkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAuZmlsZU1hbmFnZXIucmVuYW1lRmlsZShmaWxlLCBleHBlY3RlZFBhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZUJ5UGF0aChleHBlY3RlZFBhdGgpID8/IGZpbGU7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KHVwZGF0ZWRGaWxlLCB0aGlzLnRhc2tUb01hcmtkb3duKHRhc2spKTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZShpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JUYXNrKGlkKTtcbiAgICBpZiAoZmlsZSkgYXdhaXQgdGhpcy5hcHAudmF1bHQuZGVsZXRlKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgbWFya0NvbXBsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0YXNrID0gYXdhaXQgdGhpcy5nZXRCeUlkKGlkKTtcbiAgICBpZiAoIXRhc2spIHJldHVybjtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7XG4gICAgICAuLi50YXNrLFxuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIGNvbXBsZXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfSk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRmlsdGVycyAodXNlZCBieSBzbWFydCBsaXN0cykgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgZ2V0RHVlVG9kYXkoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCB0b2RheSA9IHRoaXMudG9kYXlTdHIoKTtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKFxuICAgICAgKHQpID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIiAmJiB0LnN0YXR1cyAhPT0gXCJjYW5jZWxsZWRcIiAmJiB0LmR1ZURhdGUgPT09IHRvZGF5XG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldE92ZXJkdWUoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCB0b2RheSA9IHRoaXMudG9kYXlTdHIoKTtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKFxuICAgICAgKHQpID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIiAmJiB0LnN0YXR1cyAhPT0gXCJjYW5jZWxsZWRcIiAmJiAhIXQuZHVlRGF0ZSAmJiB0LmR1ZURhdGUgPCB0b2RheVxuICAgICk7XG4gIH1cblxuICBhc3luYyBnZXRTY2hlZHVsZWQoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKFxuICAgICAgKHQpID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIiAmJiB0LnN0YXR1cyAhPT0gXCJjYW5jZWxsZWRcIiAmJiAhIXQuZHVlRGF0ZVxuICAgICk7XG4gIH1cblxuICBhc3luYyBnZXRGbGFnZ2VkKCk6IFByb21pc2U8Q2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcigodCkgPT4gdC5wcmlvcml0eSA9PT0gXCJoaWdoXCIgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTZXJpYWxpc2F0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgdGFza1RvTWFya2Rvd24odGFzazogQ2hyb25pY2xlVGFzayk6IHN0cmluZyB7XG4gICAgY29uc3QgZm06IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgICAgaWQ6ICAgICAgICAgICAgICAgICB0YXNrLmlkLFxuICAgICAgdGl0bGU6ICAgICAgICAgICAgICB0YXNrLnRpdGxlLFxuICAgICAgc3RhdHVzOiAgICAgICAgICAgICB0YXNrLnN0YXR1cyxcbiAgICAgIHByaW9yaXR5OiAgICAgICAgICAgdGFzay5wcmlvcml0eSxcbiAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgdGFzay50YWdzLFxuICAgICAgY29udGV4dHM6ICAgICAgICAgICB0YXNrLmNvbnRleHRzLFxuICAgICAgcHJvamVjdHM6ICAgICAgICAgICB0YXNrLnByb2plY3RzLFxuICAgICAgXCJsaW5rZWQtbm90ZXNcIjogICAgIHRhc2subGlua2VkTm90ZXMsXG4gICAgICBcImNhbGVuZGFyLWlkXCI6ICAgICAgdGFzay5jYWxlbmRhcklkID8/IG51bGwsXG4gICAgICBcImR1ZS1kYXRlXCI6ICAgICAgICAgdGFzay5kdWVEYXRlID8/IG51bGwsXG4gICAgICBcImR1ZS10aW1lXCI6ICAgICAgICAgdGFzay5kdWVUaW1lID8/IG51bGwsXG4gICAgICByZWN1cnJlbmNlOiAgICAgICAgIHRhc2sucmVjdXJyZW5jZSA/PyBudWxsLFxuICAgICAgXCJ0aW1lLWVzdGltYXRlXCI6ICAgIHRhc2sudGltZUVzdGltYXRlID8/IG51bGwsXG4gICAgICBcInRpbWUtZW50cmllc1wiOiAgICAgdGFzay50aW1lRW50cmllcyxcbiAgICAgIFwiY3VzdG9tLWZpZWxkc1wiOiAgICB0YXNrLmN1c3RvbUZpZWxkcyxcbiAgICAgIFwiY29tcGxldGVkLWluc3RhbmNlc1wiOiB0YXNrLmNvbXBsZXRlZEluc3RhbmNlcyxcbiAgICAgIFwiY3JlYXRlZC1hdFwiOiAgICAgICB0YXNrLmNyZWF0ZWRBdCxcbiAgICAgIFwiY29tcGxldGVkLWF0XCI6ICAgICB0YXNrLmNvbXBsZXRlZEF0ID8/IG51bGwsXG4gICAgfTtcblxuICAgIGNvbnN0IHlhbWwgPSBPYmplY3QuZW50cmllcyhmbSlcbiAgICAgIC5tYXAoKFtrLCB2XSkgPT4gYCR7a306ICR7SlNPTi5zdHJpbmdpZnkodil9YClcbiAgICAgIC5qb2luKFwiXFxuXCIpO1xuXG4gICAgY29uc3QgYm9keSA9IHRhc2subm90ZXMgPyBgXFxuJHt0YXNrLm5vdGVzfWAgOiBcIlwiO1xuICAgIHJldHVybiBgLS0tXFxuJHt5YW1sfVxcbi0tLVxcbiR7Ym9keX1gO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBmaWxlVG9UYXNrKGZpbGU6IFRGaWxlKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrIHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgICAgY29uc3QgZm0gPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG4gICAgICBpZiAoIWZtPy5pZCB8fCAhZm0/LnRpdGxlKSByZXR1cm4gbnVsbDtcblxuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBjb25zdCBib2R5TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eLS0tXFxuW1xcc1xcU10qP1xcbi0tLVxcbihbXFxzXFxTXSopJC8pO1xuICAgICAgY29uc3Qgbm90ZXMgPSBib2R5TWF0Y2g/LlsxXT8udHJpbSgpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6ICAgICAgICAgICAgICAgICBmbS5pZCxcbiAgICAgICAgdGl0bGU6ICAgICAgICAgICAgICBmbS50aXRsZSxcbiAgICAgICAgc3RhdHVzOiAgICAgICAgICAgICAoZm0uc3RhdHVzIGFzIFRhc2tTdGF0dXMpID8/IFwidG9kb1wiLFxuICAgICAgICBwcmlvcml0eTogICAgICAgICAgIChmbS5wcmlvcml0eSBhcyBUYXNrUHJpb3JpdHkpID8/IFwibm9uZVwiLFxuICAgICAgICBkdWVEYXRlOiAgICAgICAgICAgIGZtW1wiZHVlLWRhdGVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBkdWVUaW1lOiAgICAgICAgICAgIGZtW1wiZHVlLXRpbWVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICByZWN1cnJlbmNlOiAgICAgICAgIGZtLnJlY3VycmVuY2UgPz8gdW5kZWZpbmVkLFxuICAgICAgICBjYWxlbmRhcklkOiAgICAgICAgIGZtW1wiY2FsZW5kYXItaWRcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICB0YWdzOiAgICAgICAgICAgICAgIGZtLnRhZ3MgPz8gW10sXG4gICAgICAgIGNvbnRleHRzOiAgICAgICAgICAgZm0uY29udGV4dHMgPz8gW10sXG4gICAgICAgIGxpbmtlZE5vdGVzOiAgICAgICAgZm1bXCJsaW5rZWQtbm90ZXNcIl0gPz8gW10sXG4gICAgICAgIHByb2plY3RzOiAgICAgICAgICAgZm0ucHJvamVjdHMgPz8gW10sXG4gICAgICAgIHRpbWVFc3RpbWF0ZTogICAgICAgZm1bXCJ0aW1lLWVzdGltYXRlXCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgdGltZUVudHJpZXM6ICAgICAgICBmbVtcInRpbWUtZW50cmllc1wiXSA/PyBbXSxcbiAgICAgICAgY3VzdG9tRmllbGRzOiAgICAgICBmbVtcImN1c3RvbS1maWVsZHNcIl0gPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogZm1bXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCJdID8/IFtdLFxuICAgICAgICBjcmVhdGVkQXQ6ICAgICAgICAgIGZtW1wiY3JlYXRlZC1hdFwiXSA/PyBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGNvbXBsZXRlZEF0OiAgICAgICAgZm1bXCJjb21wbGV0ZWQtYXRcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBub3RlcyxcbiAgICAgIH07XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgSGVscGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIGZpbmRGaWxlRm9yVGFzayhpZDogc3RyaW5nKTogVEZpbGUgfCBudWxsIHtcbiAgICBjb25zdCBmb2xkZXIgPSB0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy50YXNrc0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBudWxsO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoIShjaGlsZCBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGNoaWxkKTtcbiAgICAgIGlmIChjYWNoZT8uZnJvbnRtYXR0ZXI/LmlkID09PSBpZCkgcmV0dXJuIGNoaWxkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMudGFza3NGb2xkZXIpKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIodGhpcy50YXNrc0ZvbGRlcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGB0YXNrLSR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNil9YDtcbiAgfVxuXG4gIHByaXZhdGUgdG9kYXlTdHIoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIFRGaWxlLCBub3JtYWxpemVQYXRoIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVFdmVudCwgQWxlcnRPZmZzZXQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIEV2ZW50TWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwOiBBcHAsIHByaXZhdGUgZXZlbnRzRm9sZGVyOiBzdHJpbmcpIHt9XG5cbiAgYXN5bmMgZ2V0QWxsKCk6IFByb21pc2U8Q2hyb25pY2xlRXZlbnRbXT4ge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLmV2ZW50c0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBbXTtcblxuICAgIGNvbnN0IGV2ZW50czogQ2hyb25pY2xlRXZlbnRbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSAmJiBjaGlsZC5leHRlbnNpb24gPT09IFwibWRcIikge1xuICAgICAgICBjb25zdCBldmVudCA9IGF3YWl0IHRoaXMuZmlsZVRvRXZlbnQoY2hpbGQpO1xuICAgICAgICBpZiAoZXZlbnQpIGV2ZW50cy5wdXNoKGV2ZW50KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGV2ZW50cztcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZShldmVudDogT21pdDxDaHJvbmljbGVFdmVudCwgXCJpZFwiIHwgXCJjcmVhdGVkQXRcIj4pOiBQcm9taXNlPENocm9uaWNsZUV2ZW50PiB7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoKTtcblxuICAgIGNvbnN0IGZ1bGw6IENocm9uaWNsZUV2ZW50ID0ge1xuICAgICAgLi4uZXZlbnQsXG4gICAgICBpZDogdGhpcy5nZW5lcmF0ZUlkKCksXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgY29uc3QgcGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy5ldmVudHNGb2xkZXJ9LyR7ZnVsbC50aXRsZX0ubWRgKTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgdGhpcy5ldmVudFRvTWFya2Rvd24oZnVsbCkpO1xuICAgIHJldHVybiBmdWxsO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlKGV2ZW50OiBDaHJvbmljbGVFdmVudCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbmRGaWxlRm9yRXZlbnQoZXZlbnQuaWQpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuXG4gICAgY29uc3QgZXhwZWN0ZWRQYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLmV2ZW50c0ZvbGRlcn0vJHtldmVudC50aXRsZX0ubWRgKTtcbiAgICBpZiAoZmlsZS5wYXRoICE9PSBleHBlY3RlZFBhdGgpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLmZpbGVNYW5hZ2VyLnJlbmFtZUZpbGUoZmlsZSwgZXhwZWN0ZWRQYXRoKTtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkRmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEZpbGVCeVBhdGgoZXhwZWN0ZWRQYXRoKSA/PyBmaWxlO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeSh1cGRhdGVkRmlsZSwgdGhpcy5ldmVudFRvTWFya2Rvd24oZXZlbnQpKTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZShpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JFdmVudChpZCk7XG4gICAgaWYgKGZpbGUpIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmRlbGV0ZShmaWxlKTtcbiAgfVxuXG4gIGFzeW5jIGdldEluUmFuZ2Uoc3RhcnREYXRlOiBzdHJpbmcsIGVuZERhdGU6IHN0cmluZyk6IFByb21pc2U8Q2hyb25pY2xlRXZlbnRbXT4ge1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoKGUpID0+IGUuc3RhcnREYXRlID49IHN0YXJ0RGF0ZSAmJiBlLnN0YXJ0RGF0ZSA8PSBlbmREYXRlKTtcbiAgfVxuXG4vLyBFeHBhbmRzIHJlY3VycmluZyBldmVudHMgaW50byBvY2N1cnJlbmNlcyB3aXRoaW4gYSBkYXRlIHJhbmdlLlxuICAvLyBSZXR1cm5zIGEgZmxhdCBsaXN0IG9mIENocm9uaWNsZUV2ZW50IG9iamVjdHMsIG9uZSBwZXIgb2NjdXJyZW5jZSxcbiAgLy8gZWFjaCB3aXRoIHN0YXJ0RGF0ZS9lbmREYXRlIHNldCB0byB0aGUgb2NjdXJyZW5jZSBkYXRlLlxuICBhc3luYyBnZXRJblJhbmdlV2l0aFJlY3VycmVuY2UocmFuZ2VTdGFydDogc3RyaW5nLCByYW5nZUVuZDogc3RyaW5nKTogUHJvbWlzZTxDaHJvbmljbGVFdmVudFtdPiB7XG4gICAgY29uc3QgYWxsICAgID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICBjb25zdCByZXN1bHQ6IENocm9uaWNsZUV2ZW50W10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgZXZlbnQgb2YgYWxsKSB7XG4gICAgICBpZiAoIWV2ZW50LnJlY3VycmVuY2UpIHtcbiAgICAgICAgLy8gTm9uLXJlY3VycmluZyBcdTIwMTQgaW5jbHVkZSBpZiBpdCBmYWxscyBpbiByYW5nZVxuICAgICAgICBpZiAoZXZlbnQuc3RhcnREYXRlID49IHJhbmdlU3RhcnQgJiYgZXZlbnQuc3RhcnREYXRlIDw9IHJhbmdlRW5kKSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2goZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBFeHBhbmQgcmVjdXJyZW5jZSB3aXRoaW4gcmFuZ2VcbiAgICAgIGNvbnN0IG9jY3VycmVuY2VzID0gdGhpcy5leHBhbmRSZWN1cnJlbmNlKGV2ZW50LCByYW5nZVN0YXJ0LCByYW5nZUVuZCk7XG4gICAgICByZXN1bHQucHVzaCguLi5vY2N1cnJlbmNlcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgZXhwYW5kUmVjdXJyZW5jZShldmVudDogQ2hyb25pY2xlRXZlbnQsIHJhbmdlU3RhcnQ6IHN0cmluZywgcmFuZ2VFbmQ6IHN0cmluZyk6IENocm9uaWNsZUV2ZW50W10ge1xuICAgIGNvbnN0IHJlc3VsdHM6IENocm9uaWNsZUV2ZW50W10gPSBbXTtcbiAgICBjb25zdCBydWxlID0gZXZlbnQucmVjdXJyZW5jZSA/PyBcIlwiO1xuXG4gICAgLy8gUGFyc2UgUlJVTEUgcGFydHNcbiAgICBjb25zdCBmcmVxICAgID0gdGhpcy5ycnVsZVBhcnQocnVsZSwgXCJGUkVRXCIpO1xuICAgIGNvbnN0IGJ5RGF5ICAgPSB0aGlzLnJydWxlUGFydChydWxlLCBcIkJZREFZXCIpO1xuICAgIGNvbnN0IHVudGlsICAgPSB0aGlzLnJydWxlUGFydChydWxlLCBcIlVOVElMXCIpO1xuICAgIGNvbnN0IGNvdW50U3RyID0gdGhpcy5ycnVsZVBhcnQocnVsZSwgXCJDT1VOVFwiKTtcbiAgICBjb25zdCBjb3VudCAgID0gY291bnRTdHIgPyBwYXJzZUludChjb3VudFN0cikgOiA5OTk7XG5cbiAgICBjb25zdCBzdGFydCAgID0gbmV3IERhdGUoZXZlbnQuc3RhcnREYXRlICsgXCJUMDA6MDA6MDBcIik7XG4gICAgY29uc3QgckVuZCAgICA9IG5ldyBEYXRlKHJhbmdlRW5kICsgXCJUMDA6MDA6MDBcIik7XG4gICAgY29uc3QgclN0YXJ0ICA9IG5ldyBEYXRlKHJhbmdlU3RhcnQgKyBcIlQwMDowMDowMFwiKTtcbiAgICBjb25zdCB1bnRpbERhdGUgPSB1bnRpbCA/IG5ldyBEYXRlKHVudGlsLnNsaWNlKDAsOCkucmVwbGFjZSgvKFxcZHs0fSkoXFxkezJ9KShcXGR7Mn0pLyxcIiQxLSQyLSQzXCIpICsgXCJUMDA6MDA6MDBcIikgOiBudWxsO1xuXG4gICAgY29uc3QgZGF5TmFtZXMgPSBbXCJTVVwiLFwiTU9cIixcIlRVXCIsXCJXRVwiLFwiVEhcIixcIkZSXCIsXCJTQVwiXTtcbiAgICBjb25zdCBieURheXMgICA9IGJ5RGF5ID8gYnlEYXkuc3BsaXQoXCIsXCIpIDogW107XG5cbiAgICBsZXQgY3VycmVudCAgID0gbmV3IERhdGUoc3RhcnQpO1xuICAgIGxldCBnZW5lcmF0ZWQgPSAwO1xuXG4gICAgd2hpbGUgKGN1cnJlbnQgPD0gckVuZCAmJiBnZW5lcmF0ZWQgPCBjb3VudCkge1xuICAgICAgaWYgKHVudGlsRGF0ZSAmJiBjdXJyZW50ID4gdW50aWxEYXRlKSBicmVhaztcblxuICAgICAgY29uc3QgZGF0ZVN0ciA9IGN1cnJlbnQudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICAgIC8vIENhbGN1bGF0ZSBkdXJhdGlvbiB0byBhcHBseSB0byBlYWNoIG9jY3VycmVuY2VcbiAgICAgIGNvbnN0IGR1cmF0aW9uTXMgPSBuZXcgRGF0ZShldmVudC5lbmREYXRlICsgXCJUMDA6MDA6MDBcIikuZ2V0VGltZSgpIC0gc3RhcnQuZ2V0VGltZSgpO1xuICAgICAgY29uc3QgZW5kRGF0ZSAgICA9IG5ldyBEYXRlKGN1cnJlbnQuZ2V0VGltZSgpICsgZHVyYXRpb25NcykudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICAgIGlmIChjdXJyZW50ID49IHJTdGFydCAmJiAhZXZlbnQuY29tcGxldGVkSW5zdGFuY2VzLmluY2x1ZGVzKGRhdGVTdHIpKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh7IC4uLmV2ZW50LCBzdGFydERhdGU6IGRhdGVTdHIsIGVuZERhdGUgfSk7XG4gICAgICAgIGdlbmVyYXRlZCsrO1xuICAgICAgfVxuXG4gICAgICAvLyBBZHZhbmNlIHRvIG5leHQgb2NjdXJyZW5jZVxuICAgICAgaWYgKGZyZXEgPT09IFwiREFJTFlcIikge1xuICAgICAgICBjdXJyZW50LnNldERhdGUoY3VycmVudC5nZXREYXRlKCkgKyAxKTtcbiAgICAgIH0gZWxzZSBpZiAoZnJlcSA9PT0gXCJXRUVLTFlcIikge1xuICAgICAgICBpZiAoYnlEYXlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvLyBGaW5kIG5leHQgbWF0Y2hpbmcgd2Vla2RheVxuICAgICAgICAgIGN1cnJlbnQuc2V0RGF0ZShjdXJyZW50LmdldERhdGUoKSArIDEpO1xuICAgICAgICAgIGxldCBzYWZldHkgPSAwO1xuICAgICAgICAgIHdoaWxlICghYnlEYXlzLmluY2x1ZGVzKGRheU5hbWVzW2N1cnJlbnQuZ2V0RGF5KCldKSAmJiBzYWZldHkrKyA8IDcpIHtcbiAgICAgICAgICAgIGN1cnJlbnQuc2V0RGF0ZShjdXJyZW50LmdldERhdGUoKSArIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdXJyZW50LnNldERhdGUoY3VycmVudC5nZXREYXRlKCkgKyA3KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChmcmVxID09PSBcIk1PTlRITFlcIikge1xuICAgICAgICBjdXJyZW50LnNldE1vbnRoKGN1cnJlbnQuZ2V0TW9udGgoKSArIDEpO1xuICAgICAgfSBlbHNlIGlmIChmcmVxID09PSBcIllFQVJMWVwiKSB7XG4gICAgICAgIGN1cnJlbnQuc2V0RnVsbFllYXIoY3VycmVudC5nZXRGdWxsWWVhcigpICsgMSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhazsgLy8gVW5rbm93biBmcmVxIFx1MjAxNCBzdG9wIHRvIGF2b2lkIGluZmluaXRlIGxvb3BcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuXG4gIHByaXZhdGUgcnJ1bGVQYXJ0KHJ1bGU6IHN0cmluZywga2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1hdGNoID0gcnVsZS5tYXRjaChuZXcgUmVnRXhwKGAoPzpefDspJHtrZXl9PShbXjtdKylgKSk7XG4gICAgcmV0dXJuIG1hdGNoID8gbWF0Y2hbMV0gOiBcIlwiO1xuICB9XG5cbiAgcHJpdmF0ZSBldmVudFRvTWFya2Rvd24oZXZlbnQ6IENocm9uaWNsZUV2ZW50KTogc3RyaW5nIHtcbiAgICBjb25zdCBmbTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICBpZDogICAgICAgICAgICAgICAgICAgZXZlbnQuaWQsXG4gICAgICB0aXRsZTogICAgICAgICAgICAgICAgZXZlbnQudGl0bGUsXG4gICAgICBsb2NhdGlvbjogICAgICAgICAgICAgZXZlbnQubG9jYXRpb24gPz8gbnVsbCxcbiAgICAgIFwiYWxsLWRheVwiOiAgICAgICAgICAgIGV2ZW50LmFsbERheSxcbiAgICAgIFwic3RhcnQtZGF0ZVwiOiAgICAgICAgIGV2ZW50LnN0YXJ0RGF0ZSxcbiAgICAgIFwic3RhcnQtdGltZVwiOiAgICAgICAgIGV2ZW50LnN0YXJ0VGltZSA/PyBudWxsLFxuICAgICAgXCJlbmQtZGF0ZVwiOiAgICAgICAgICAgZXZlbnQuZW5kRGF0ZSxcbiAgICAgIFwiZW5kLXRpbWVcIjogICAgICAgICAgIGV2ZW50LmVuZFRpbWUgPz8gbnVsbCxcbiAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICBldmVudC5yZWN1cnJlbmNlID8/IG51bGwsXG4gICAgICBcImNhbGVuZGFyLWlkXCI6ICAgICAgICBldmVudC5jYWxlbmRhcklkID8/IG51bGwsXG4gICAgICBhbGVydDogICAgICAgICAgICAgICAgZXZlbnQuYWxlcnQsXG4gICAgICBcImxpbmtlZC10YXNrLWlkc1wiOiAgICBldmVudC5saW5rZWRUYXNrSWRzLFxuICAgICAgXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCI6IGV2ZW50LmNvbXBsZXRlZEluc3RhbmNlcyxcbiAgICAgIFwiY3JlYXRlZC1hdFwiOiAgICAgICAgIGV2ZW50LmNyZWF0ZWRBdCxcbiAgICB9O1xuXG4gICAgY29uc3QgeWFtbCA9IE9iamVjdC5lbnRyaWVzKGZtKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHtKU09OLnN0cmluZ2lmeSh2KX1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCBib2R5ID0gZXZlbnQubm90ZXMgPyBgXFxuJHtldmVudC5ub3Rlc31gIDogXCJcIjtcbiAgICByZXR1cm4gYC0tLVxcbiR7eWFtbH1cXG4tLS1cXG4ke2JvZHl9YDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmlsZVRvRXZlbnQoZmlsZTogVEZpbGUpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50IHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgICAgY29uc3QgZm0gPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG4gICAgICBpZiAoIWZtPy5pZCB8fCAhZm0/LnRpdGxlKSByZXR1cm4gbnVsbDtcblxuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBjb25zdCBib2R5TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eLS0tXFxuW1xcc1xcU10qP1xcbi0tLVxcbihbXFxzXFxTXSopJC8pO1xuICAgICAgY29uc3Qgbm90ZXMgPSBib2R5TWF0Y2g/LlsxXT8udHJpbSgpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6ICAgICAgICAgICAgICAgICAgIGZtLmlkLFxuICAgICAgICB0aXRsZTogICAgICAgICAgICAgICAgZm0udGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICAgICAgICAgICBmbS5sb2NhdGlvbiA/PyB1bmRlZmluZWQsXG4gICAgICAgIGFsbERheTogICAgICAgICAgICAgICBmbVtcImFsbC1kYXlcIl0gPz8gdHJ1ZSxcbiAgICAgICAgc3RhcnREYXRlOiAgICAgICAgICAgIGZtW1wic3RhcnQtZGF0ZVwiXSxcbiAgICAgICAgc3RhcnRUaW1lOiAgICAgICAgICAgIGZtW1wic3RhcnQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGVuZERhdGU6ICAgICAgICAgICAgICBmbVtcImVuZC1kYXRlXCJdLFxuICAgICAgICBlbmRUaW1lOiAgICAgICAgICAgICAgZm1bXCJlbmQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICBmbS5yZWN1cnJlbmNlID8/IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsZW5kYXJJZDogICAgICAgICAgIGZtW1wiY2FsZW5kYXItaWRcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBhbGVydDogICAgICAgICAgICAgICAgKGZtLmFsZXJ0IGFzIEFsZXJ0T2Zmc2V0KSA/PyBcIm5vbmVcIixcbiAgICAgICAgbGlua2VkVGFza0lkczogICAgICAgIGZtW1wibGlua2VkLXRhc2staWRzXCJdID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6ICAgZm1bXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCJdID8/IFtdLFxuICAgICAgICBjcmVhdGVkQXQ6ICAgICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgbm90ZXMsXG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5kRmlsZUZvckV2ZW50KGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLmV2ZW50c0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBudWxsO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoIShjaGlsZCBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGNoaWxkKTtcbiAgICAgIGlmIChjYWNoZT8uZnJvbnRtYXR0ZXI/LmlkID09PSBpZCkgcmV0dXJuIGNoaWxkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMuZXZlbnRzRm9sZGVyKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKHRoaXMuZXZlbnRzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGV2ZW50LSR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNil9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFRhc2tNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvVGFza01hbmFnZXJcIjtcbmltcG9ydCB7IENhbGVuZGFyTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0NhbGVuZGFyTWFuYWdlclwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlVGFzaywgVGFza1N0YXR1cywgVGFza1ByaW9yaXR5IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBUYXNrTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyO1xuICBwcml2YXRlIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICBwcml2YXRlIGVkaXRpbmdUYXNrOiBDaHJvbmljbGVUYXNrIHwgbnVsbDtcbiAgcHJpdmF0ZSBvblNhdmU/OiAoKSA9PiB2b2lkO1xuICBwcml2YXRlIG9uRXhwYW5kPzogKHRhc2s/OiBDaHJvbmljbGVUYXNrKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcixcbiAgICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcixcbiAgICBlZGl0aW5nVGFzaz86IENocm9uaWNsZVRhc2ssXG4gICAgb25TYXZlPzogKCkgPT4gdm9pZCxcbiAgICBvbkV4cGFuZD86ICh0YXNrPzogQ2hyb25pY2xlVGFzaykgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMudGFza01hbmFnZXIgICAgPSB0YXNrTWFuYWdlcjtcbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IGNhbGVuZGFyTWFuYWdlcjtcbiAgICB0aGlzLmVkaXRpbmdUYXNrICAgID0gZWRpdGluZ1Rhc2sgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSAgICAgICAgID0gb25TYXZlO1xuICAgIHRoaXMub25FeHBhbmQgICAgICAgPSBvbkV4cGFuZDtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJjaHJvbmljbGUtZXZlbnQtbW9kYWxcIik7XG5cbiAgICBjb25zdCB0ICAgICAgICAgPSB0aGlzLmVkaXRpbmdUYXNrO1xuICAgIGNvbnN0IGNhbGVuZGFycyA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEhlYWRlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBoZWFkZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWhlYWRlclwiKTtcbiAgICBoZWFkZXIuY3JlYXRlRGl2KFwiY2VtLXRpdGxlXCIpLnNldFRleHQodCA/IFwiRWRpdCB0YXNrXCIgOiBcIk5ldyB0YXNrXCIpO1xuXG4gICAgY29uc3QgZXhwYW5kQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdCBjZW0tZXhwYW5kLWJ0blwiIH0pO1xuICAgIGV4cGFuZEJ0bi50aXRsZSA9IFwiT3BlbiBhcyBmdWxsIHBhZ2VcIjtcbiAgICBleHBhbmRCdG4uaW5uZXJIVE1MID0gYDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPjxwb2x5bGluZSBwb2ludHM9XCIxNSAzIDIxIDMgMjEgOVwiLz48cG9seWxpbmUgcG9pbnRzPVwiOSAyMSAzIDIxIDMgMTVcIi8+PGxpbmUgeDE9XCIyMVwiIHkxPVwiM1wiIHgyPVwiMTRcIiB5Mj1cIjEwXCIvPjxsaW5lIHgxPVwiM1wiIHkxPVwiMjFcIiB4Mj1cIjEwXCIgeTI9XCIxNFwiLz48L3N2Zz5gO1xuICAgIGV4cGFuZEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgdGhpcy5vbkV4cGFuZD8uKHQgPz8gdW5kZWZpbmVkKTtcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBGb3JtIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGZvcm0gPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWZvcm1cIik7XG5cbiAgICAvLyBUaXRsZVxuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGl0bGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLXRpdGxlLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIlRhc2sgbmFtZVwiXG4gICAgfSk7XG4gICAgdGl0bGVJbnB1dC52YWx1ZSA9IHQ/LnRpdGxlID8/IFwiXCI7XG4gICAgdGl0bGVJbnB1dC5mb2N1cygpO1xuXG4gICAgLy8gU3RhdHVzICsgUHJpb3JpdHlcbiAgICBjb25zdCByb3cxID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG5cbiAgICBjb25zdCBzdGF0dXNTZWxlY3QgPSB0aGlzLmZpZWxkKHJvdzEsIFwiU3RhdHVzXCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHN0YXR1c2VzOiB7IHZhbHVlOiBUYXNrU3RhdHVzOyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwidG9kb1wiLCAgICAgICAgbGFiZWw6IFwiVG8gZG9cIiB9LFxuICAgICAgeyB2YWx1ZTogXCJpbi1wcm9ncmVzc1wiLCBsYWJlbDogXCJJbiBwcm9ncmVzc1wiIH0sXG4gICAgICB7IHZhbHVlOiBcImRvbmVcIiwgICAgICAgIGxhYmVsOiBcIkRvbmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJjYW5jZWxsZWRcIiwgICBsYWJlbDogXCJDYW5jZWxsZWRcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCBzIG9mIHN0YXR1c2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSBzdGF0dXNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogcy52YWx1ZSwgdGV4dDogcy5sYWJlbCB9KTtcbiAgICAgIGlmICh0Py5zdGF0dXMgPT09IHMudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgcHJpb3JpdHlTZWxlY3QgPSB0aGlzLmZpZWxkKHJvdzEsIFwiUHJpb3JpdHlcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcHJpb3JpdGllczogeyB2YWx1ZTogVGFza1ByaW9yaXR5OyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwibm9uZVwiLCAgIGxhYmVsOiBcIk5vbmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJsb3dcIiwgICAgbGFiZWw6IFwiTG93XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwibWVkaXVtXCIsIGxhYmVsOiBcIk1lZGl1bVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImhpZ2hcIiwgICBsYWJlbDogXCJIaWdoXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgcCBvZiBwcmlvcml0aWVzKSB7XG4gICAgICBjb25zdCBvcHQgPSBwcmlvcml0eVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBwLnZhbHVlLCB0ZXh0OiBwLmxhYmVsIH0pO1xuICAgICAgaWYgKHQ/LnByaW9yaXR5ID09PSBwLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIER1ZSBkYXRlICsgdGltZVxuICAgIGNvbnN0IHJvdzIgPSBmb3JtLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcblxuICAgIGNvbnN0IGR1ZURhdGVJbnB1dCA9IHRoaXMuZmllbGQocm93MiwgXCJEdWUgZGF0ZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGR1ZURhdGVJbnB1dC52YWx1ZSA9IHQ/LmR1ZURhdGUgPz8gXCJcIjtcblxuICAgIGNvbnN0IGR1ZVRpbWVJbnB1dCA9IHRoaXMuZmllbGQocm93MiwgXCJEdWUgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGR1ZVRpbWVJbnB1dC52YWx1ZSA9IHQ/LmR1ZVRpbWUgPz8gXCJcIjtcblxuICAgIC8vIENhbGVuZGFyXG4gICAgY29uc3QgY2FsU2VsZWN0ID0gdGhpcy5maWVsZChmb3JtLCBcIkNhbGVuZGFyXCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBcIlwiLCB0ZXh0OiBcIk5vbmVcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGNhbCBvZiBjYWxlbmRhcnMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBjYWwuaWQsIHRleHQ6IGNhbC5uYW1lIH0pO1xuICAgICAgaWYgKHQ/LmNhbGVuZGFySWQgPT09IGNhbC5pZCkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgdXBkYXRlQ2FsQ29sb3IgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGNhbFNlbGVjdC52YWx1ZSk7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdENvbG9yID0gY2FsID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSA6IFwidHJhbnNwYXJlbnRcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0V2lkdGggPSBcIjRweFwiO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRTdHlsZSA9IFwic29saWRcIjtcbiAgICB9O1xuICAgIGNhbFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHVwZGF0ZUNhbENvbG9yKTtcbiAgICB1cGRhdGVDYWxDb2xvcigpO1xuXG4gICAgLy8gUmVjdXJyZW5jZVxuICAgIGNvbnN0IHJlY1NlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJSZXBlYXRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcmVjdXJyZW5jZXMgPSBbXG4gICAgICB7IHZhbHVlOiBcIlwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIk5ldmVyXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1EQUlMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgZGF5XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1XRUVLTFlcIiwgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgd2Vla1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9TU9OVEhMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IG1vbnRoXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1ZRUFSTFlcIiwgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgeWVhclwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZO0JZREFZPU1PLFRVLFdFLFRILEZSXCIsICAgbGFiZWw6IFwiV2Vla2RheXNcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCByIG9mIHJlY3VycmVuY2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSByZWNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogci52YWx1ZSwgdGV4dDogci5sYWJlbCB9KTtcbiAgICAgIGlmICh0Py5yZWN1cnJlbmNlID09PSByLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIE5vdGVzXG4gICAgY29uc3Qgbm90ZXNJbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJOb3Rlc1wiKS5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJjZi10ZXh0YXJlYVwiLCBwbGFjZWhvbGRlcjogXCJBZGQgbm90ZXMuLi5cIlxuICAgIH0pO1xuICAgIG5vdGVzSW5wdXQudmFsdWUgPSB0Py5ub3RlcyA/PyBcIlwiO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEZvb3RlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb290ZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWZvb3RlclwiKTtcbiAgICBjb25zdCBjYW5jZWxCdG4gPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWdob3N0XCIsIHRleHQ6IFwiQ2FuY2VsXCIgfSk7XG5cbiAgICBpZiAodCAmJiB0LmlkKSB7XG4gICAgICBjb25zdCBkZWxldGVCdG4gPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWRlbGV0ZVwiLCB0ZXh0OiBcIkRlbGV0ZSB0YXNrXCIgfSk7XG4gICAgICBkZWxldGVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5kZWxldGUodC5pZCk7XG4gICAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2F2ZUJ0biA9IGZvb3Rlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiY2YtYnRuLXByaW1hcnlcIiwgdGV4dDogdD8uaWQgPyBcIlNhdmVcIiA6IFwiQWRkIHRhc2tcIlxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEhhbmRsZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNhbmNlbEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5jbG9zZSgpKTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0aXRsZSA9IHRpdGxlSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCF0aXRsZSkge1xuICAgICAgICB0aXRsZUlucHV0LmZvY3VzKCk7XG4gICAgICAgIHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIER1cGxpY2F0ZSBjaGVjayAobmV3IHRhc2tzIG9ubHkpXG4gICAgICBpZiAoIXQ/LmlkKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRBbGwoKTtcbiAgICAgICAgY29uc3QgZHVwbGljYXRlID0gZXhpc3RpbmcuZmluZChlID0+IGUudGl0bGUudG9Mb3dlckNhc2UoKSA9PT0gdGl0bGUudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIGlmIChkdXBsaWNhdGUpIHtcbiAgICAgICAgICBuZXcgTm90aWNlKGBBIHRhc2sgbmFtZWQgXCIke3RpdGxlfVwiIGFscmVhZHkgZXhpc3RzLmAsIDQwMDApO1xuICAgICAgICAgIHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpO1xuICAgICAgICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdGFza0RhdGEgPSB7XG4gICAgICAgIHRpdGxlLFxuICAgICAgICBzdGF0dXM6ICAgICAgc3RhdHVzU2VsZWN0LnZhbHVlIGFzIFRhc2tTdGF0dXMsXG4gICAgICAgIHByaW9yaXR5OiAgICBwcmlvcml0eVNlbGVjdC52YWx1ZSBhcyBUYXNrUHJpb3JpdHksXG4gICAgICAgIGR1ZURhdGU6ICAgICBkdWVEYXRlSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBkdWVUaW1lOiAgICAgZHVlVGltZUlucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsZW5kYXJJZDogIGNhbFNlbGVjdC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICByZWNTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBub3RlczogICAgICAgbm90ZXNJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgICAgICB0Py50YWdzID8/IFtdLFxuICAgICAgICBjb250ZXh0czogICAgICAgICAgdD8uY29udGV4dHMgPz8gW10sXG4gICAgICAgIGxpbmtlZE5vdGVzOiAgICAgICB0Py5saW5rZWROb3RlcyA/PyBbXSxcbiAgICAgICAgcHJvamVjdHM6ICAgICAgICAgIHQ/LnByb2plY3RzID8/IFtdLFxuICAgICAgICB0aW1lRXN0aW1hdGU6ICAgICAgdD8udGltZUVzdGltYXRlLFxuICAgICAgICB0aW1lRW50cmllczogICAgICAgdD8udGltZUVudHJpZXMgPz8gW10sXG4gICAgICAgIGN1c3RvbUZpZWxkczogICAgICB0Py5jdXN0b21GaWVsZHMgPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogdD8uY29tcGxldGVkSW5zdGFuY2VzID8/IFtdLFxuICAgICAgfTtcblxuICAgICAgaWYgKHQ/LmlkKSB7XG4gICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIudXBkYXRlKHsgLi4udCwgLi4udGFza0RhdGEgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmNyZWF0ZSh0YXNrRGF0YSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9O1xuXG4gICAgc2F2ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGFuZGxlU2F2ZSk7XG4gICAgdGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZSkgPT4ge1xuICAgICAgaWYgKGUua2V5ID09PSBcIkVudGVyXCIpIGhhbmRsZVNhdmUoKTtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFc2NhcGVcIikgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgb25DbG9zZSgpIHsgdGhpcy5jb250ZW50RWwuZW1wdHkoKTsgfVxuXG4gIHByaXZhdGUgZmllbGQocGFyZW50OiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCB3cmFwID0gcGFyZW50LmNyZWF0ZURpdihcImNmLWZpZWxkXCIpO1xuICAgIHdyYXAuY3JlYXRlRGl2KFwiY2YtbGFiZWxcIikuc2V0VGV4dChsYWJlbCk7XG4gICAgcmV0dXJuIHdyYXA7XG4gIH1cbn0iLCAiaW1wb3J0IHsgVGFza01vZGFsIH0gZnJvbSBcIi4uL3VpL1Rhc2tNb2RhbFwiO1xuaW1wb3J0IHsgSXRlbVZpZXcsIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZVRhc2sgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IFRhc2tNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvVGFza01hbmFnZXJcIjtcbmltcG9ydCB7IENhbGVuZGFyTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0NhbGVuZGFyTWFuYWdlclwiO1xuaW1wb3J0IHsgVGFza0Zvcm1WaWV3LCBUQVNLX0ZPUk1fVklFV19UWVBFIH0gZnJvbSBcIi4vVGFza0Zvcm1WaWV3XCI7XG5pbXBvcnQgeyBFdmVudE1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9FdmVudE1hbmFnZXJcIjtcblxuZXhwb3J0IGNvbnN0IFRBU0tfVklFV19UWVBFID0gXCJjaHJvbmljbGUtdGFzay12aWV3XCI7XG5cbmV4cG9ydCBjbGFzcyBUYXNrVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSB0YXNrTWFuYWdlcjogVGFza01hbmFnZXI7XG4gIHByaXZhdGUgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXI7XG4gIHByaXZhdGUgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXI7XG4gIHByaXZhdGUgY3VycmVudExpc3RJZDogc3RyaW5nID0gXCJ0b2RheVwiO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICAgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyLFxuICAgIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyLFxuICAgIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyXG4gICkge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMudGFza01hbmFnZXIgPSB0YXNrTWFuYWdlcjtcbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IGNhbGVuZGFyTWFuYWdlcjtcbiAgICB0aGlzLmV2ZW50TWFuYWdlciA9IGV2ZW50TWFuYWdlcjtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7IHJldHVybiBUQVNLX1ZJRVdfVFlQRTsgfVxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gXCJDaHJvbmljbGVcIjsgfVxuICBnZXRJY29uKCk6IHN0cmluZyB7IHJldHVybiBcImNoZWNrLWNpcmNsZVwiOyB9XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKSkge1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC52YXVsdC5vbihcImNyZWF0ZVwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKSkge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5yZW5kZXIoKSwgMjAwKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwiZGVsZXRlXCIsIChmaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLnRhc2tNYW5hZ2VyW1widGFza3NGb2xkZXJcIl0pKSB7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgcmVuZGVyKCkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29udGFpbmVyLmVtcHR5KCk7XG4gICAgY29udGFpbmVyLmFkZENsYXNzKFwiY2hyb25pY2xlLWFwcFwiKTtcblxuICAgIGNvbnN0IGFsbCAgICAgICA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0QWxsKCk7XG4gICAgY29uc3QgdG9kYXkgICAgID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXREdWVUb2RheSgpO1xuICAgIGNvbnN0IHNjaGVkdWxlZCA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0U2NoZWR1bGVkKCk7XG4gICAgY29uc3QgZmxhZ2dlZCAgID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRGbGFnZ2VkKCk7XG4gICAgY29uc3Qgb3ZlcmR1ZSAgID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRPdmVyZHVlKCk7XG4gICAgY29uc3QgY2FsZW5kYXJzID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCk7XG5cbiAgICBjb25zdCBsYXlvdXQgID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1sYXlvdXRcIik7XG4gICAgY29uc3Qgc2lkZWJhciA9IGxheW91dC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtc2lkZWJhclwiKTtcbiAgICBjb25zdCBtYWluICAgID0gbGF5b3V0LmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluXCIpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE5ldyB0YXNrIGJ1dHRvbiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBuZXdUYXNrQnRuID0gc2lkZWJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiY2hyb25pY2xlLW5ldy10YXNrLWJ0blwiLCB0ZXh0OiBcIk5ldyB0YXNrXCJcbiAgICB9KTtcbiAgICBuZXdUYXNrQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLm9wZW5UYXNrRm9ybSgpKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBTbWFydCBsaXN0IHRpbGVzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHRpbGVzR3JpZCA9IHNpZGViYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGVzXCIpO1xuXG4gICAgY29uc3QgdGlsZXMgPSBbXG4gICAgICB7IGlkOiBcInRvZGF5XCIsICAgICBsYWJlbDogXCJUb2RheVwiLCAgICAgY291bnQ6IHRvZGF5Lmxlbmd0aCArIG92ZXJkdWUubGVuZ3RoLCBjb2xvcjogXCIjRkYzQjMwXCIsIGJhZGdlOiBvdmVyZHVlLmxlbmd0aCB9LFxuICAgICAgeyBpZDogXCJzY2hlZHVsZWRcIiwgbGFiZWw6IFwiU2NoZWR1bGVkXCIsIGNvdW50OiBzY2hlZHVsZWQubGVuZ3RoLCAgICAgICAgICAgICAgY29sb3I6IFwiIzM3OEFERFwiLCBiYWRnZTogMCB9LFxuICAgICAgeyBpZDogXCJhbGxcIiwgICAgICAgbGFiZWw6IFwiQWxsXCIsICAgICAgIGNvdW50OiBhbGwuZmlsdGVyKHQgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiKS5sZW5ndGgsIGNvbG9yOiBcIiM2MzYzNjZcIiwgYmFkZ2U6IDAgfSxcbiAgICAgIHsgaWQ6IFwiZmxhZ2dlZFwiLCAgIGxhYmVsOiBcIkZsYWdnZWRcIiwgICBjb3VudDogZmxhZ2dlZC5sZW5ndGgsICAgICAgICAgICAgICAgIGNvbG9yOiBcIiNGRjk1MDBcIiwgYmFkZ2U6IDAgfSxcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCB0aWxlIG9mIHRpbGVzKSB7XG4gICAgICBjb25zdCB0ID0gdGlsZXNHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlXCIpO1xuICAgICAgdC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aWxlLmNvbG9yO1xuICAgICAgaWYgKHRpbGUuaWQgPT09IHRoaXMuY3VycmVudExpc3RJZCkgdC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcblxuICAgICAgY29uc3QgdG9wUm93ID0gdC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGlsZS10b3BcIik7XG4gICAgICB0b3BSb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtY291bnRcIikuc2V0VGV4dChTdHJpbmcodGlsZS5jb3VudCkpO1xuXG4gICAgICBpZiAodGlsZS5iYWRnZSA+IDApIHtcbiAgICAgICAgY29uc3QgYmFkZ2UgPSB0b3BSb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtYmFkZ2VcIik7XG4gICAgICAgIGJhZGdlLnNldFRleHQoU3RyaW5nKHRpbGUuYmFkZ2UpKTtcbiAgICAgICAgYmFkZ2UudGl0bGUgPSBgJHt0aWxlLmJhZGdlfSBvdmVyZHVlYDtcbiAgICAgIH1cblxuICAgICAgdC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGlsZS1sYWJlbFwiKS5zZXRUZXh0KHRpbGUubGFiZWwpO1xuICAgICAgdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmN1cnJlbnRMaXN0SWQgPSB0aWxlLmlkOyB0aGlzLnJlbmRlcigpOyB9KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQ29tcGxldGVkIGFyY2hpdmUgZW50cnkgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgY29tcGxldGVkUm93ID0gc2lkZWJhci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1yb3dcIik7XG4gICAgaWYgKHRoaXMuY3VycmVudExpc3RJZCA9PT0gXCJjb21wbGV0ZWRcIikgY29tcGxldGVkUm93LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuICAgIGNvbnN0IGNvbXBsZXRlZEljb24gPSBjb21wbGV0ZWRSb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbXBsZXRlZC1pY29uXCIpO1xuICAgIGNvbXBsZXRlZEljb24uaW5uZXJIVE1MID0gYDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPjxwYXRoIGQ9XCJNMjIgMTEuMDhWMTJhMTAgMTAgMCAxIDEtNS45My05LjE0XCIvPjxwb2x5bGluZSBwb2ludHM9XCIyMiA0IDEyIDE0LjAxIDkgMTEuMDFcIi8+PC9zdmc+YDtcbiAgICBjb21wbGV0ZWRSb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3QtbmFtZVwiKS5zZXRUZXh0KFwiQ29tcGxldGVkXCIpO1xuICAgIGNvbnN0IGNvbXBsZXRlZENvdW50ID0gYWxsLmZpbHRlcih0ID0+IHQuc3RhdHVzID09PSBcImRvbmVcIikubGVuZ3RoO1xuICAgIGlmIChjb21wbGV0ZWRDb3VudCA+IDApIGNvbXBsZXRlZFJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1jb3VudFwiKS5zZXRUZXh0KFN0cmluZyhjb21wbGV0ZWRDb3VudCkpO1xuICAgIGNvbXBsZXRlZFJvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmN1cnJlbnRMaXN0SWQgPSBcImNvbXBsZXRlZFwiOyB0aGlzLnJlbmRlcigpOyB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBNeSBMaXN0cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBsaXN0c1NlY3Rpb24gPSBzaWRlYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0cy1zZWN0aW9uXCIpO1xuICAgIGxpc3RzU2VjdGlvbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtc2VjdGlvbi1sYWJlbFwiKS5zZXRUZXh0KFwiTXkgTGlzdHNcIik7XG5cbiAgICBmb3IgKGNvbnN0IGNhbCBvZiBjYWxlbmRhcnMpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGxpc3RzU2VjdGlvbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1yb3dcIik7XG4gICAgICBpZiAoY2FsLmlkID09PSB0aGlzLmN1cnJlbnRMaXN0SWQpIHJvdy5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcblxuICAgICAgY29uc3QgZG90ID0gcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LWRvdFwiKTtcbiAgICAgIGRvdC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpO1xuXG4gICAgICByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3QtbmFtZVwiKS5zZXRUZXh0KGNhbC5uYW1lKTtcblxuICAgICAgY29uc3QgY2FsQ291bnQgPSBhbGwuZmlsdGVyKHQgPT4gdC5jYWxlbmRhcklkID09PSBjYWwuaWQgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKS5sZW5ndGg7XG4gICAgICBpZiAoY2FsQ291bnQgPiAwKSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3QtY291bnRcIikuc2V0VGV4dChTdHJpbmcoY2FsQ291bnQpKTtcblxuICAgICAgcm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY3VycmVudExpc3RJZCA9IGNhbC5pZDsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE1haW4gcGFuZWwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgYXdhaXQgdGhpcy5yZW5kZXJNYWluUGFuZWwobWFpbiwgYWxsLCBvdmVyZHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVuZGVyTWFpblBhbmVsKFxuICAgIG1haW46IEhUTUxFbGVtZW50LFxuICAgIGFsbDogQ2hyb25pY2xlVGFza1tdLFxuICAgIG92ZXJkdWU6IENocm9uaWNsZVRhc2tbXVxuICApIHtcbiAgICBjb25zdCBoZWFkZXIgID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWFpbi1oZWFkZXJcIik7XG4gICAgY29uc3QgdGl0bGVFbCA9IGhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWFpbi10aXRsZVwiKTtcblxuICAgIGxldCB0YXNrczogQ2hyb25pY2xlVGFza1tdID0gW107XG5cbiAgICBjb25zdCBzbWFydENvbG9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgIHRvZGF5OiBcIiNGRjNCMzBcIiwgc2NoZWR1bGVkOiBcIiMzNzhBRERcIiwgYWxsOiBcIiM2MzYzNjZcIixcbiAgICAgIGZsYWdnZWQ6IFwiI0ZGOTUwMFwiLCBjb21wbGV0ZWQ6IFwiIzM0Qzc1OVwiXG4gICAgfTtcblxuICAgIGlmIChzbWFydENvbG9yc1t0aGlzLmN1cnJlbnRMaXN0SWRdKSB7XG4gICAgICBjb25zdCBsYWJlbHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICAgIHRvZGF5OiBcIlRvZGF5XCIsIHNjaGVkdWxlZDogXCJTY2hlZHVsZWRcIiwgYWxsOiBcIkFsbFwiLFxuICAgICAgICBmbGFnZ2VkOiBcIkZsYWdnZWRcIiwgY29tcGxldGVkOiBcIkNvbXBsZXRlZFwiXG4gICAgICB9O1xuICAgICAgdGl0bGVFbC5zZXRUZXh0KGxhYmVsc1t0aGlzLmN1cnJlbnRMaXN0SWRdKTtcbiAgICAgIHRpdGxlRWwuc3R5bGUuY29sb3IgPSBzbWFydENvbG9yc1t0aGlzLmN1cnJlbnRMaXN0SWRdO1xuXG4gICAgICBzd2l0Y2ggKHRoaXMuY3VycmVudExpc3RJZCkge1xuICAgICAgICBjYXNlIFwidG9kYXlcIjpcbiAgICAgICAgICB0YXNrcyA9IFsuLi5vdmVyZHVlLCAuLi4oYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXREdWVUb2RheSgpKV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzY2hlZHVsZWRcIjpcbiAgICAgICAgICB0YXNrcyA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0U2NoZWR1bGVkKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJmbGFnZ2VkXCI6XG4gICAgICAgICAgdGFza3MgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEZsYWdnZWQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImFsbFwiOlxuICAgICAgICAgIHRhc2tzID0gYWxsLmZpbHRlcih0ID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJjb21wbGV0ZWRcIjpcbiAgICAgICAgICB0YXNrcyA9IGFsbC5maWx0ZXIodCA9PiB0LnN0YXR1cyA9PT0gXCJkb25lXCIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKHRoaXMuY3VycmVudExpc3RJZCk7XG4gICAgICB0aXRsZUVsLnNldFRleHQoY2FsPy5uYW1lID8/IFwiTGlzdFwiKTtcbiAgICAgIHRpdGxlRWwuc3R5bGUuY29sb3IgPSBjYWxcbiAgICAgICAgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpXG4gICAgICAgIDogXCJ2YXIoLS10ZXh0LW5vcm1hbClcIjtcbiAgICAgIHRhc2tzID0gYWxsLmZpbHRlcihcbiAgICAgICAgdCA9PiB0LmNhbGVuZGFySWQgPT09IHRoaXMuY3VycmVudExpc3RJZCAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgaXNDb21wbGV0ZWQgPSB0aGlzLmN1cnJlbnRMaXN0SWQgPT09IFwiY29tcGxldGVkXCI7XG4gICAgY29uc3QgY291bnRUYXNrcyAgPSBpc0NvbXBsZXRlZCA/IHRhc2tzIDogdGFza3MuZmlsdGVyKHQgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgICBpZiAoY291bnRUYXNrcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBzdWJ0aXRsZSA9IGhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWFpbi1zdWJ0aXRsZVwiKTtcbiAgICAgIGlmIChpc0NvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCBjbGVhckJ0biA9IHN1YnRpdGxlLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiY2hyb25pY2xlLWNsZWFyLWJ0blwiLCB0ZXh0OiBcIkNsZWFyIGFsbFwiXG4gICAgICAgIH0pO1xuICAgICAgICBjbGVhckJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGFsbDIgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEFsbCgpO1xuICAgICAgICAgIGZvciAoY29uc3QgdCBvZiBhbGwyLmZpbHRlcih0ID0+IHQuc3RhdHVzID09PSBcImRvbmVcIikpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIuZGVsZXRlKHQuaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN1YnRpdGxlLnNldFRleHQoXG4gICAgICAgICAgYCR7Y291bnRUYXNrcy5sZW5ndGh9ICR7Y291bnRUYXNrcy5sZW5ndGggPT09IDEgPyBcInRhc2tcIiA6IFwidGFza3NcIn1gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdEVsID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1saXN0XCIpO1xuXG4gICAgaWYgKHRhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5yZW5kZXJFbXB0eVN0YXRlKGxpc3RFbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGdyb3VwcyA9IHRoaXMuZ3JvdXBUYXNrcyh0YXNrcyk7XG4gICAgICBmb3IgKGNvbnN0IFtncm91cCwgZ3JvdXBUYXNrc10gb2YgT2JqZWN0LmVudHJpZXMoZ3JvdXBzKSkge1xuICAgICAgICBpZiAoZ3JvdXBUYXNrcy5sZW5ndGggPT09IDApIGNvbnRpbnVlO1xuICAgICAgICBsaXN0RWwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWdyb3VwLWxhYmVsXCIpLnNldFRleHQoZ3JvdXApO1xuICAgICAgICBjb25zdCBjYXJkID0gbGlzdEVsLmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLWNhcmQtZ3JvdXBcIik7XG4gICAgICAgIGZvciAoY29uc3QgdGFzayBvZiBncm91cFRhc2tzKSB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJUYXNrUm93KGNhcmQsIHRhc2spO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJFbXB0eVN0YXRlKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBlbXB0eSA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZW1wdHktc3RhdGVcIik7XG4gICAgY29uc3QgaWNvbiAgPSBlbXB0eS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZW1wdHktaWNvblwiKTtcbiAgICBpY29uLmlubmVySFRNTCA9IGA8c3ZnIHdpZHRoPVwiNDhcIiBoZWlnaHQ9XCI0OFwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPjxwYXRoIGQ9XCJNMjIgMTEuMDhWMTJhMTAgMTAgMCAxIDEtNS45My05LjE0XCIvPjxwb2x5bGluZSBwb2ludHM9XCIyMiA0IDEyIDE0LjAxIDkgMTEuMDFcIi8+PC9zdmc+YDtcbiAgICBlbXB0eS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZW1wdHktdGl0bGVcIikuc2V0VGV4dChcIkFsbCBkb25lXCIpO1xuICAgIGVtcHR5LmNyZWF0ZURpdihcImNocm9uaWNsZS1lbXB0eS1zdWJ0aXRsZVwiKS5zZXRUZXh0KFwiTm90aGluZyBsZWZ0IGluIHRoaXMgbGlzdC5cIik7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclRhc2tSb3coY29udGFpbmVyOiBIVE1MRWxlbWVudCwgdGFzazogQ2hyb25pY2xlVGFzaykge1xuICAgIGNvbnN0IHJvdyAgICAgICA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1yb3dcIik7XG4gICAgY29uc3QgaXNEb25lICAgID0gdGFzay5zdGF0dXMgPT09IFwiZG9uZVwiO1xuICAgIGNvbnN0IGlzQXJjaGl2ZSA9IHRoaXMuY3VycmVudExpc3RJZCA9PT0gXCJjb21wbGV0ZWRcIjtcblxuICAgIC8vIENoZWNrYm94XG4gICAgY29uc3QgY2hlY2tib3hXcmFwID0gcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1jaGVja2JveC13cmFwXCIpO1xuICAgIGNvbnN0IGNoZWNrYm94ICAgICA9IGNoZWNrYm94V3JhcC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2hlY2tib3hcIik7XG4gICAgaWYgKGlzRG9uZSkgY2hlY2tib3guYWRkQ2xhc3MoXCJkb25lXCIpO1xuICAgIGNoZWNrYm94LmlubmVySFRNTCA9IGA8c3ZnIGNsYXNzPVwiY2hyb25pY2xlLWNoZWNrbWFya1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiNmZmZcIiBzdHJva2Utd2lkdGg9XCIzXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+PHBvbHlsaW5lIHBvaW50cz1cIjIwIDYgOSAxNyA0IDEyXCIvPjwvc3ZnPmA7XG5cbiAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBjaGVja2JveC5hZGRDbGFzcyhcImNvbXBsZXRpbmdcIik7XG4gICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci51cGRhdGUoe1xuICAgICAgICAgIC4uLnRhc2ssXG4gICAgICAgICAgc3RhdHVzOiAgICAgIGlzRG9uZSA/IFwidG9kb1wiIDogXCJkb25lXCIsXG4gICAgICAgICAgY29tcGxldGVkQXQ6IGlzRG9uZSA/IHVuZGVmaW5lZCA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgfSk7XG4gICAgICB9LCAzMDApO1xuICAgIH0pO1xuXG4gICAgLy8gQ29udGVudFxuICAgIGNvbnN0IGNvbnRlbnQgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stY29udGVudFwiKTtcbiAgICBpZiAoIWlzQXJjaGl2ZSkgY29udGVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5vcGVuVGFza0Zvcm0odGFzaykpO1xuXG4gICAgY29uc3QgdGl0bGVFbCA9IGNvbnRlbnQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stdGl0bGVcIik7XG4gICAgdGl0bGVFbC5zZXRUZXh0KHRhc2sudGl0bGUpO1xuICAgIGlmIChpc0RvbmUpIHRpdGxlRWwuYWRkQ2xhc3MoXCJkb25lXCIpO1xuXG4gICAgLy8gTWV0YVxuICAgIGNvbnN0IHRvZGF5U3RyID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCBtZXRhUm93ICA9IGNvbnRlbnQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stbWV0YVwiKTtcblxuICAgIGlmIChpc0FyY2hpdmUgJiYgdGFzay5jb21wbGV0ZWRBdCkge1xuICAgICAgY29uc3QgY29tcGxldGVkRGF0ZSA9IG5ldyBEYXRlKHRhc2suY29tcGxldGVkQXQpO1xuICAgICAgbWV0YVJvdy5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXRhc2stZGF0ZVwiKS5zZXRUZXh0KFxuICAgICAgICBcIkNvbXBsZXRlZCBcIiArIGNvbXBsZXRlZERhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwge1xuICAgICAgICAgIG1vbnRoOiBcInNob3J0XCIsIGRheTogXCJudW1lcmljXCIsIHllYXI6IFwibnVtZXJpY1wiXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAodGFzay5kdWVEYXRlIHx8IHRhc2suY2FsZW5kYXJJZCkge1xuICAgICAgaWYgKHRhc2suZHVlRGF0ZSkge1xuICAgICAgICBjb25zdCBtZXRhRGF0ZSA9IG1ldGFSb3cuY3JlYXRlU3BhbihcImNocm9uaWNsZS10YXNrLWRhdGVcIik7XG4gICAgICAgIG1ldGFEYXRlLnNldFRleHQodGhpcy5mb3JtYXREYXRlKHRhc2suZHVlRGF0ZSkpO1xuICAgICAgICBpZiAodGFzay5kdWVEYXRlIDwgdG9kYXlTdHIpIG1ldGFEYXRlLmFkZENsYXNzKFwib3ZlcmR1ZVwiKTtcbiAgICAgIH1cbiAgICAgIGlmICh0YXNrLmNhbGVuZGFySWQpIHtcbiAgICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZCh0YXNrLmNhbGVuZGFySWQpO1xuICAgICAgICBpZiAoY2FsKSB7XG4gICAgICAgICAgY29uc3QgY2FsRG90ID0gbWV0YVJvdy5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXRhc2stY2FsLWRvdFwiKTtcbiAgICAgICAgICBjYWxEb3Quc3R5bGUuYmFja2dyb3VuZENvbG9yID0gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKTtcbiAgICAgICAgICBtZXRhUm93LmNyZWF0ZVNwYW4oXCJjaHJvbmljbGUtdGFzay1jYWwtbmFtZVwiKS5zZXRUZXh0KGNhbC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFByaW9yaXR5IGZsYWcgKG5vbi1hcmNoaXZlIG9ubHkpXG4gICAgaWYgKCFpc0FyY2hpdmUgJiYgdGFzay5wcmlvcml0eSA9PT0gXCJoaWdoXCIpIHtcbiAgICAgIHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZmxhZ1wiKS5zZXRUZXh0KFwiXHUyNjkxXCIpO1xuICAgIH1cblxuICAgIC8vIEFyY2hpdmU6IFJlc3RvcmUgKyBEZWxldGUgYnV0dG9uc1xuICAgIGlmIChpc0FyY2hpdmUpIHtcbiAgICAgIGNvbnN0IGFjdGlvbnMgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWFyY2hpdmUtYWN0aW9uc1wiKTtcblxuICAgICAgY29uc3QgcmVzdG9yZUJ0biA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiY2hyb25pY2xlLWFyY2hpdmUtYnRuXCIsIHRleHQ6IFwiUmVzdG9yZVwiXG4gICAgICB9KTtcbiAgICAgIHJlc3RvcmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIudXBkYXRlKHsgLi4udGFzaywgc3RhdHVzOiBcInRvZG9cIiwgY29tcGxldGVkQXQ6IHVuZGVmaW5lZCB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBkZWxldGVCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImNocm9uaWNsZS1hcmNoaXZlLWJ0biBjaHJvbmljbGUtYXJjaGl2ZS1idG4tZGVsZXRlXCIsIHRleHQ6IFwiRGVsZXRlXCJcbiAgICAgIH0pO1xuICAgICAgZGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmRlbGV0ZSh0YXNrLmlkKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmlnaHQtY2xpY2sgY29udGV4dCBtZW51IChub24tYXJjaGl2ZSlcbiAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBtZW51ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG1lbnUuY2xhc3NOYW1lICA9IFwiY2hyb25pY2xlLWNvbnRleHQtbWVudVwiO1xuICAgICAgbWVudS5zdHlsZS5sZWZ0ID0gYCR7ZS5jbGllbnRYfXB4YDtcbiAgICAgIG1lbnUuc3R5bGUudG9wICA9IGAke2UuY2xpZW50WX1weGA7XG5cbiAgICAgIGNvbnN0IGVkaXRJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtXCIpO1xuICAgICAgZWRpdEl0ZW0uc2V0VGV4dChcIkVkaXQgdGFza1wiKTtcbiAgICAgIGVkaXRJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IG1lbnUucmVtb3ZlKCk7IHRoaXMub3BlblRhc2tGb3JtKHRhc2spOyB9KTtcblxuICAgICAgY29uc3QgZGVsZXRlSXRlbSA9IG1lbnUuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbnRleHQtaXRlbSBjaHJvbmljbGUtY29udGV4dC1kZWxldGVcIik7XG4gICAgICBkZWxldGVJdGVtLnNldFRleHQoXCJEZWxldGUgdGFza1wiKTtcbiAgICAgIGRlbGV0ZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbWVudS5yZW1vdmUoKTtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5kZWxldGUodGFzay5pZCk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2FuY2VsSXRlbSA9IG1lbnUuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbnRleHQtaXRlbVwiKTtcbiAgICAgIGNhbmNlbEl0ZW0uc2V0VGV4dChcIkNhbmNlbFwiKTtcbiAgICAgIGNhbmNlbEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IG1lbnUucmVtb3ZlKCkpO1xuXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1lbnUpO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gbWVudS5yZW1vdmUoKSwgeyBvbmNlOiB0cnVlIH0pLCAwKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZ3JvdXBUYXNrcyh0YXNrczogQ2hyb25pY2xlVGFza1tdKTogUmVjb3JkPHN0cmluZywgQ2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgdG9kYXkgICAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IG5leHRXZWVrID0gbmV3IERhdGUoRGF0ZS5ub3coKSArIDcgKiA4NjQwMDAwMCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3Qgd2Vla0FnbyAgPSBuZXcgRGF0ZShEYXRlLm5vdygpIC0gNyAqIDg2NDAwMDAwKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIGlmICh0aGlzLmN1cnJlbnRMaXN0SWQgPT09IFwiY29tcGxldGVkXCIpIHtcbiAgICAgIGNvbnN0IGdyb3VwczogUmVjb3JkPHN0cmluZywgQ2hyb25pY2xlVGFza1tdPiA9IHtcbiAgICAgICAgXCJUb2RheVwiOiAgICAgW10sXG4gICAgICAgIFwiVGhpcyB3ZWVrXCI6IFtdLFxuICAgICAgICBcIkVhcmxpZXJcIjogICBbXSxcbiAgICAgIH07XG4gICAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGFza3MpIHtcbiAgICAgICAgY29uc3QgZCA9IHRhc2suY29tcGxldGVkQXQ/LnNwbGl0KFwiVFwiKVswXSA/PyBcIlwiO1xuICAgICAgICBpZiAoZCA9PT0gdG9kYXkpICAgICAgIGdyb3Vwc1tcIlRvZGF5XCJdLnB1c2godGFzayk7XG4gICAgICAgIGVsc2UgaWYgKGQgPj0gd2Vla0FnbykgZ3JvdXBzW1wiVGhpcyB3ZWVrXCJdLnB1c2godGFzayk7XG4gICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgZ3JvdXBzW1wiRWFybGllclwiXS5wdXNoKHRhc2spO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICB9XG5cbiAgICBjb25zdCBncm91cHM6IFJlY29yZDxzdHJpbmcsIENocm9uaWNsZVRhc2tbXT4gPSB7XG4gICAgICBcIk92ZXJkdWVcIjogICBbXSxcbiAgICAgIFwiVG9kYXlcIjogICAgIFtdLFxuICAgICAgXCJUaGlzIHdlZWtcIjogW10sXG4gICAgICBcIkxhdGVyXCI6ICAgICBbXSxcbiAgICAgIFwiTm8gZGF0ZVwiOiAgIFtdLFxuICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGFza3MpIHtcbiAgICAgIGlmICh0YXNrLnN0YXR1cyA9PT0gXCJkb25lXCIpIGNvbnRpbnVlO1xuICAgICAgaWYgKCF0YXNrLmR1ZURhdGUpICAgICAgICAgICAgeyBncm91cHNbXCJObyBkYXRlXCJdLnB1c2godGFzayk7ICAgY29udGludWU7IH1cbiAgICAgIGlmICh0YXNrLmR1ZURhdGUgPCB0b2RheSkgICAgIHsgZ3JvdXBzW1wiT3ZlcmR1ZVwiXS5wdXNoKHRhc2spOyAgIGNvbnRpbnVlOyB9XG4gICAgICBpZiAodGFzay5kdWVEYXRlID09PSB0b2RheSkgICB7IGdyb3Vwc1tcIlRvZGF5XCJdLnB1c2godGFzayk7ICAgICBjb250aW51ZTsgfVxuICAgICAgaWYgKHRhc2suZHVlRGF0ZSA8PSBuZXh0V2VlaykgeyBncm91cHNbXCJUaGlzIHdlZWtcIl0ucHVzaCh0YXNrKTsgY29udGludWU7IH1cbiAgICAgIGdyb3Vwc1tcIkxhdGVyXCJdLnB1c2godGFzayk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdyb3VwcztcbiAgfVxuXG4gIHByaXZhdGUgZm9ybWF0RGF0ZShkYXRlU3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHRvZGF5ICAgID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCB0b21vcnJvdyA9IG5ldyBEYXRlKERhdGUubm93KCkgKyA4NjQwMDAwMCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5KSAgICByZXR1cm4gXCJUb2RheVwiO1xuICAgIGlmIChkYXRlU3RyID09PSB0b21vcnJvdykgcmV0dXJuIFwiVG9tb3Jyb3dcIjtcbiAgICByZXR1cm4gbmV3IERhdGUoZGF0ZVN0ciArIFwiVDAwOjAwOjAwXCIpLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHtcbiAgICAgIG1vbnRoOiBcInNob3J0XCIsIGRheTogXCJudW1lcmljXCJcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5UYXNrRm9ybSh0YXNrPzogQ2hyb25pY2xlVGFzaykge1xuICAgIG5ldyBUYXNrTW9kYWwoXG4gICAgICB0aGlzLmFwcCxcbiAgICAgIHRoaXMudGFza01hbmFnZXIsXG4gICAgICB0aGlzLmNhbGVuZGFyTWFuYWdlcixcbiAgICAgIHRhc2ssXG4gICAgICB1bmRlZmluZWQsXG4gICAgICAodCkgPT4gdGhpcy5vcGVuVGFza0Z1bGxQYWdlKHQpXG4gICAgKS5vcGVuKCk7XG4gIH1cblxuICBhc3luYyBvcGVuVGFza0Z1bGxQYWdlKHRhc2s/OiBDaHJvbmljbGVUYXNrKSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShUQVNLX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBpZiAoZXhpc3RpbmcpIGV4aXN0aW5nLmRldGFjaCgpO1xuICAgIGNvbnN0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IFRBU0tfRk9STV9WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcblxuICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTtcbiAgICBjb25zdCBmb3JtTGVhZiA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVEFTS19GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgY29uc3QgZm9ybVZpZXcgPSBmb3JtTGVhZj8udmlldyBhcyBUYXNrRm9ybVZpZXcgfCB1bmRlZmluZWQ7XG4gICAgaWYgKGZvcm1WaWV3ICYmIHRhc2spIGZvcm1WaWV3LmxvYWRUYXNrKHRhc2spO1xuICB9XG59IiwgImltcG9ydCB7IEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFRhc2tNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvVGFza01hbmFnZXJcIjtcbmltcG9ydCB7IENhbGVuZGFyTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0NhbGVuZGFyTWFuYWdlclwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlVGFzaywgVGFza1N0YXR1cywgVGFza1ByaW9yaXR5IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjb25zdCBUQVNLX0ZPUk1fVklFV19UWVBFID0gXCJjaHJvbmljbGUtdGFzay1mb3JtXCI7XG5cbmV4cG9ydCBjbGFzcyBUYXNrRm9ybVZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIHByaXZhdGUgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyO1xuICBwcml2YXRlIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICBwcml2YXRlIGVkaXRpbmdUYXNrOiBDaHJvbmljbGVUYXNrIHwgbnVsbCA9IG51bGw7XG4gIG9uU2F2ZT86ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbGVhZjogV29ya3NwYWNlTGVhZixcbiAgICB0YXNrTWFuYWdlcjogVGFza01hbmFnZXIsXG4gICAgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXIsXG4gICAgZWRpdGluZ1Rhc2s/OiBDaHJvbmljbGVUYXNrLFxuICAgIG9uU2F2ZT86ICgpID0+IHZvaWRcbiAgKSB7XG4gICAgc3VwZXIobGVhZik7XG4gICAgdGhpcy50YXNrTWFuYWdlciA9IHRhc2tNYW5hZ2VyO1xuICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyID0gY2FsZW5kYXJNYW5hZ2VyO1xuICAgIHRoaXMuZWRpdGluZ1Rhc2sgPSBlZGl0aW5nVGFzayA/PyBudWxsO1xuICAgIHRoaXMub25TYXZlID0gb25TYXZlO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHsgcmV0dXJuIFRBU0tfRk9STV9WSUVXX1RZUEU7IH1cbiAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuZWRpdGluZ1Rhc2sgPyBcIkVkaXQgdGFza1wiIDogXCJOZXcgdGFza1wiOyB9XG4gIGdldEljb24oKTogc3RyaW5nIHsgcmV0dXJuIFwiY2hlY2stY2lyY2xlXCI7IH1cblxuICBhc3luYyBvbk9wZW4oKSB7IHRoaXMucmVuZGVyKCk7IH1cblxuICBsb2FkVGFzayh0YXNrOiBDaHJvbmljbGVUYXNrKSB7XG4gICAgdGhpcy5lZGl0aW5nVGFzayA9IHRhc2s7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuICAgIGNvbnRhaW5lci5hZGRDbGFzcyhcImNocm9uaWNsZS1mb3JtLXBhZ2VcIik7XG5cbiAgICBjb25zdCB0ID0gdGhpcy5lZGl0aW5nVGFzaztcbiAgICBjb25zdCBjYWxlbmRhcnMgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRBbGwoKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIZWFkZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaGVhZGVyID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNmLWhlYWRlclwiKTtcbiAgICBjb25zdCBjYW5jZWxCdG4gPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWdob3N0XCIsIHRleHQ6IFwiQ2FuY2VsXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZURpdihcImNmLWhlYWRlci10aXRsZVwiKS5zZXRUZXh0KHQgPyBcIkVkaXQgdGFza1wiIDogXCJOZXcgdGFza1wiKTtcbiAgICBjb25zdCBzYXZlQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1wcmltYXJ5XCIsIHRleHQ6IHQgPyBcIlNhdmVcIiA6IFwiQWRkXCIgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9ybSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb3JtID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNmLWZvcm1cIik7XG5cbiAgICAvLyBUaXRsZVxuICAgIGNvbnN0IHRpdGxlRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGl0bGVcIik7XG4gICAgY29uc3QgdGl0bGVJbnB1dCA9IHRpdGxlRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIGNsczogXCJjZi1pbnB1dCBjZi10aXRsZS1pbnB1dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiVGFzayBuYW1lXCIsXG4gICAgfSk7XG4gICAgdGl0bGVJbnB1dC52YWx1ZSA9IHQ/LnRpdGxlID8/IFwiXCI7XG4gICAgdGl0bGVJbnB1dC5mb2N1cygpO1xuXG4gICAgLy8gU3RhdHVzICsgUHJpb3JpdHkgKHNpZGUgYnkgc2lkZSlcbiAgICBjb25zdCByb3cxID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG5cbiAgICBjb25zdCBzdGF0dXNGaWVsZCA9IHRoaXMuZmllbGQocm93MSwgXCJTdGF0dXNcIik7XG4gICAgY29uc3Qgc3RhdHVzU2VsZWN0ID0gc3RhdHVzRmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3Qgc3RhdHVzZXM6IHsgdmFsdWU6IFRhc2tTdGF0dXM7IGxhYmVsOiBzdHJpbmcgfVtdID0gW1xuICAgICAgeyB2YWx1ZTogXCJ0b2RvXCIsICAgICAgICBsYWJlbDogXCJUbyBkb1wiIH0sXG4gICAgICB7IHZhbHVlOiBcImluLXByb2dyZXNzXCIsIGxhYmVsOiBcIkluIHByb2dyZXNzXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiZG9uZVwiLCAgICAgICAgbGFiZWw6IFwiRG9uZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImNhbmNlbGxlZFwiLCAgIGxhYmVsOiBcIkNhbmNlbGxlZFwiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IHMgb2Ygc3RhdHVzZXMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IHN0YXR1c1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBzLnZhbHVlLCB0ZXh0OiBzLmxhYmVsIH0pO1xuICAgICAgaWYgKHQ/LnN0YXR1cyA9PT0gcy52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmlvcml0eUZpZWxkID0gdGhpcy5maWVsZChyb3cxLCBcIlByaW9yaXR5XCIpO1xuICAgIGNvbnN0IHByaW9yaXR5U2VsZWN0ID0gcHJpb3JpdHlGaWVsZC5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCBwcmlvcml0aWVzOiB7IHZhbHVlOiBUYXNrUHJpb3JpdHk7IGxhYmVsOiBzdHJpbmc7IGNvbG9yOiBzdHJpbmcgfVtdID0gW1xuICAgICAgeyB2YWx1ZTogXCJub25lXCIsICAgbGFiZWw6IFwiTm9uZVwiLCAgIGNvbG9yOiBcIlwiIH0sXG4gICAgICB7IHZhbHVlOiBcImxvd1wiLCAgICBsYWJlbDogXCJMb3dcIiwgICAgY29sb3I6IFwiIzM0Qzc1OVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIm1lZGl1bVwiLCBsYWJlbDogXCJNZWRpdW1cIiwgY29sb3I6IFwiI0ZGOTUwMFwiIH0sXG4gICAgICB7IHZhbHVlOiBcImhpZ2hcIiwgICBsYWJlbDogXCJIaWdoXCIsICAgY29sb3I6IFwiI0ZGM0IzMFwiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgcHJpb3JpdGllcykge1xuICAgICAgY29uc3Qgb3B0ID0gcHJpb3JpdHlTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogcC52YWx1ZSwgdGV4dDogcC5sYWJlbCB9KTtcbiAgICAgIGlmICh0Py5wcmlvcml0eSA9PT0gcC52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBEdWUgZGF0ZSArIHRpbWUgKHNpZGUgYnkgc2lkZSlcbiAgICBjb25zdCByb3cyID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG5cbiAgICBjb25zdCBkdWVEYXRlRmllbGQgPSB0aGlzLmZpZWxkKHJvdzIsIFwiRHVlIGRhdGVcIik7XG4gICAgY29uc3QgZHVlRGF0ZUlucHV0ID0gZHVlRGF0ZUZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJkYXRlXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgZHVlRGF0ZUlucHV0LnZhbHVlID0gdD8uZHVlRGF0ZSA/PyBcIlwiO1xuXG4gICAgY29uc3QgZHVlVGltZUZpZWxkID0gdGhpcy5maWVsZChyb3cyLCBcIkR1ZSB0aW1lXCIpO1xuICAgIGNvbnN0IGR1ZVRpbWVJbnB1dCA9IGR1ZVRpbWVGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGR1ZVRpbWVJbnB1dC52YWx1ZSA9IHQ/LmR1ZVRpbWUgPz8gXCJcIjtcblxuICAgIC8vIENhbGVuZGFyXG4gICAgY29uc3QgY2FsRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQ2FsZW5kYXJcIik7XG4gICAgY29uc3QgY2FsU2VsZWN0ID0gY2FsRmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY2FsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IFwiXCIsIHRleHQ6IFwiTm9uZVwiIH0pO1xuICAgIGZvciAoY29uc3QgY2FsIG9mIGNhbGVuZGFycykge1xuICAgICAgY29uc3Qgb3B0ID0gY2FsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGNhbC5pZCwgdGV4dDogY2FsLm5hbWUgfSk7XG4gICAgICBpZiAodD8uY2FsZW5kYXJJZCA9PT0gY2FsLmlkKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBjYWxlbmRhciBzZWxlY3QgZG90IGNvbG9yXG4gICAgY29uc3QgdXBkYXRlQ2FsQ29sb3IgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGNhbFNlbGVjdC52YWx1ZSk7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdENvbG9yID0gY2FsID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSA6IFwidHJhbnNwYXJlbnRcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0V2lkdGggPSBcIjRweFwiO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRTdHlsZSA9IFwic29saWRcIjtcbiAgICB9O1xuICAgIGNhbFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHVwZGF0ZUNhbENvbG9yKTtcbiAgICB1cGRhdGVDYWxDb2xvcigpO1xuXG4gICAgLy8gUmVjdXJyZW5jZVxuICAgIGNvbnN0IHJlY0ZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIlJlcGVhdFwiKTtcbiAgICBjb25zdCByZWNTZWxlY3QgPSByZWNGaWVsZC5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCByZWN1cnJlbmNlcyA9IFtcbiAgICAgIHsgdmFsdWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiTmV2ZXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPURBSUxZXCIsICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSBkYXlcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWVwiLCAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSB3ZWVrXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1NT05USExZXCIsICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgbW9udGhcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVlFQVJMWVwiLCAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSB5ZWFyXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1XRUVLTFk7QllEQVk9TU8sVFUsV0UsVEgsRlJcIiwgbGFiZWw6IFwiV2Vla2RheXNcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCByIG9mIHJlY3VycmVuY2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSByZWNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogci52YWx1ZSwgdGV4dDogci5sYWJlbCB9KTtcbiAgICAgIGlmICh0Py5yZWN1cnJlbmNlID09PSByLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIFRpbWUgZXN0aW1hdGVcbiAgICBjb25zdCBlc3RpbWF0ZUZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIlRpbWUgZXN0aW1hdGVcIik7XG4gICAgY29uc3QgZXN0aW1hdGVXcmFwID0gZXN0aW1hdGVGaWVsZC5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG4gICAgY29uc3QgZXN0aW1hdGVJbnB1dCA9IGVzdGltYXRlV3JhcC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwibnVtYmVyXCIsIGNsczogXCJjZi1pbnB1dCBjZi1pbnB1dC1zbVwiLCBwbGFjZWhvbGRlcjogXCIwXCJcbiAgICB9KTtcbiAgICBlc3RpbWF0ZUlucHV0LnZhbHVlID0gdD8udGltZUVzdGltYXRlID8gU3RyaW5nKHQudGltZUVzdGltYXRlKSA6IFwiXCI7XG4gICAgZXN0aW1hdGVJbnB1dC5taW4gPSBcIjBcIjtcbiAgICBlc3RpbWF0ZVdyYXAuY3JlYXRlU3Bhbih7IGNsczogXCJjZi11bml0XCIsIHRleHQ6IFwibWludXRlc1wiIH0pO1xuXG4gICAgLy8gVGFnc1xuICAgIGNvbnN0IHRhZ3NGaWVsZCA9IHRoaXMuZmllbGQoZm9ybSwgXCJUYWdzXCIpO1xuICAgIGNvbnN0IHRhZ3NJbnB1dCA9IHRhZ3NGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIndvcmssIHBlcnNvbmFsLCB1cmdlbnQgIChjb21tYSBzZXBhcmF0ZWQpXCJcbiAgICB9KTtcbiAgICB0YWdzSW5wdXQudmFsdWUgPSB0Py50YWdzLmpvaW4oXCIsIFwiKSA/PyBcIlwiO1xuXG4gICAgLy8gQ29udGV4dHNcbiAgICBjb25zdCBjb250ZXh0c0ZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIkNvbnRleHRzXCIpO1xuICAgIGNvbnN0IGNvbnRleHRzSW5wdXQgPSBjb250ZXh0c0ZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiQGhvbWUsIEB3b3JrICAoY29tbWEgc2VwYXJhdGVkKVwiXG4gICAgfSk7XG4gICAgY29udGV4dHNJbnB1dC52YWx1ZSA9IHQ/LmNvbnRleHRzLmpvaW4oXCIsIFwiKSA/PyBcIlwiO1xuXG4gICAgLy8gTGlua2VkIG5vdGVzXG4gICAgY29uc3QgbGlua2VkRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTGlua2VkIG5vdGVzXCIpO1xuICAgIGNvbnN0IGxpbmtlZElucHV0ID0gbGlua2VkRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJQcm9qZWN0cy9XZWJzaXRlLCBKb3VybmFsLzIwMjQgIChjb21tYSBzZXBhcmF0ZWQpXCJcbiAgICB9KTtcbiAgICBsaW5rZWRJbnB1dC52YWx1ZSA9IHQ/LmxpbmtlZE5vdGVzLmpvaW4oXCIsIFwiKSA/PyBcIlwiO1xuXG4gICAgLy8gQ3VzdG9tIGZpZWxkc1xuICAgIGNvbnN0IGN1c3RvbVNlY3Rpb24gPSBmb3JtLmNyZWF0ZURpdihcImNmLXNlY3Rpb25cIik7XG4gICAgY3VzdG9tU2VjdGlvbi5jcmVhdGVEaXYoXCJjZi1zZWN0aW9uLWxhYmVsXCIpLnNldFRleHQoXCJDdXN0b20gZmllbGRzXCIpO1xuICAgIGNvbnN0IGN1c3RvbUxpc3QgPSBjdXN0b21TZWN0aW9uLmNyZWF0ZURpdihcImNmLWN1c3RvbS1saXN0XCIpO1xuICAgIGNvbnN0IGN1c3RvbUZpZWxkczogeyBrZXk6IHN0cmluZzsgdmFsdWU6IHN0cmluZyB9W10gPSBbXG4gICAgICAuLi4odD8uY3VzdG9tRmllbGRzLm1hcChmID0+ICh7IGtleTogZi5rZXksIHZhbHVlOiBTdHJpbmcoZi52YWx1ZSkgfSkpID8/IFtdKVxuICAgIF07XG5cbiAgICBjb25zdCByZW5kZXJDdXN0b21GaWVsZHMgPSAoKSA9PiB7XG4gICAgICBjdXN0b21MaXN0LmVtcHR5KCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGN1c3RvbUZpZWxkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjZiA9IGN1c3RvbUZpZWxkc1tpXTtcbiAgICAgICAgY29uc3QgY2ZSb3cgPSBjdXN0b21MaXN0LmNyZWF0ZURpdihcImNmLWN1c3RvbS1yb3dcIik7XG4gICAgICAgIGNvbnN0IGtleUlucHV0ID0gY2ZSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dCBjZi1jdXN0b20ta2V5XCIsIHBsYWNlaG9sZGVyOiBcIkZpZWxkIG5hbWVcIlxuICAgICAgICB9KTtcbiAgICAgICAga2V5SW5wdXQudmFsdWUgPSBjZi5rZXk7XG4gICAgICAgIGtleUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7IGN1c3RvbUZpZWxkc1tpXS5rZXkgPSBrZXlJbnB1dC52YWx1ZTsgfSk7XG5cbiAgICAgICAgY29uc3QgdmFsSW5wdXQgPSBjZlJvdy5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLWN1c3RvbS12YWxcIiwgcGxhY2Vob2xkZXI6IFwiVmFsdWVcIlxuICAgICAgICB9KTtcbiAgICAgICAgdmFsSW5wdXQudmFsdWUgPSBjZi52YWx1ZTtcbiAgICAgICAgdmFsSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHsgY3VzdG9tRmllbGRzW2ldLnZhbHVlID0gdmFsSW5wdXQudmFsdWU7IH0pO1xuXG4gICAgICAgIGNvbnN0IHJlbW92ZUJ0biA9IGNmUm93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1pY29uXCIsIHRleHQ6IFwiXHUwMEQ3XCIgfSk7XG4gICAgICAgIHJlbW92ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIGN1c3RvbUZpZWxkcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgcmVuZGVyQ3VzdG9tRmllbGRzKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhZGRDZkJ0biA9IGN1c3RvbUxpc3QuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiY2YtYnRuLWdob3N0IGNmLWFkZC1maWVsZFwiLCB0ZXh0OiBcIisgQWRkIGZpZWxkXCJcbiAgICAgIH0pO1xuICAgICAgYWRkQ2ZCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgY3VzdG9tRmllbGRzLnB1c2goeyBrZXk6IFwiXCIsIHZhbHVlOiBcIlwiIH0pO1xuICAgICAgICByZW5kZXJDdXN0b21GaWVsZHMoKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmVuZGVyQ3VzdG9tRmllbGRzKCk7XG5cbiAgICAvLyBOb3Rlc1xuICAgIGNvbnN0IG5vdGVzRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTm90ZXNcIik7XG4gICAgY29uc3Qgbm90ZXNJbnB1dCA9IG5vdGVzRmllbGQuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICBjbHM6IFwiY2YtdGV4dGFyZWFcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIG5vdGVzLi4uXCJcbiAgICB9KTtcbiAgICBub3Rlc0lucHV0LnZhbHVlID0gdD8ubm90ZXMgPz8gXCJcIjtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBBY3Rpb25zIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNhbmNlbEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShUQVNLX0ZPUk1fVklFV19UWVBFKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0aXRsZSA9IHRpdGxlSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCF0aXRsZSkgeyB0aXRsZUlucHV0LmZvY3VzKCk7IHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpOyByZXR1cm47IH1cblxuICAvLyBDaGVjayBmb3IgZHVwbGljYXRlIHRpdGxlXG4gICAgICBpZiAoIXRoaXMuZWRpdGluZ1Rhc2spIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEFsbCgpO1xuICAgICAgICBjb25zdCBkdXBsaWNhdGUgPSBleGlzdGluZy5maW5kKFxuICAgICAgICAgIHQgPT4gdC50aXRsZS50b0xvd2VyQ2FzZSgpID09PSB0aXRsZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICk7XG4gICAgICAgIGlmIChkdXBsaWNhdGUpIHtcbiAgICAgICAgICBuZXcgTm90aWNlKGBBIHRhc2sgbmFtZWQgXCIke3RpdGxlfVwiIGFscmVhZHkgZXhpc3RzLmAsIDQwMDApO1xuICAgICAgICAgIHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpO1xuICAgICAgICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdGFza0RhdGEgPSB7XG4gICAgICAgIHRpdGxlLFxuICAgICAgICBzdGF0dXM6ICAgICAgICBzdGF0dXNTZWxlY3QudmFsdWUgYXMgVGFza1N0YXR1cyxcbiAgICAgICAgcHJpb3JpdHk6ICAgICAgcHJpb3JpdHlTZWxlY3QudmFsdWUgYXMgVGFza1ByaW9yaXR5LFxuICAgICAgICBkdWVEYXRlOiAgICAgICBkdWVEYXRlSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBkdWVUaW1lOiAgICAgICBkdWVUaW1lSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBjYWxlbmRhcklkOiAgICBjYWxTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICByZWN1cnJlbmNlOiAgICByZWNTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICB0aW1lRXN0aW1hdGU6ICBlc3RpbWF0ZUlucHV0LnZhbHVlID8gcGFyc2VJbnQoZXN0aW1hdGVJbnB1dC52YWx1ZSkgOiB1bmRlZmluZWQsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgIHRhZ3NJbnB1dC52YWx1ZSA/IHRhZ3NJbnB1dC52YWx1ZS5zcGxpdChcIixcIikubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKSA6IFtdLFxuICAgICAgICBjb250ZXh0czogICAgICBjb250ZXh0c0lucHV0LnZhbHVlID8gY29udGV4dHNJbnB1dC52YWx1ZS5zcGxpdChcIixcIikubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKSA6IFtdLFxuICAgICAgICBsaW5rZWROb3RlczogICBsaW5rZWRJbnB1dC52YWx1ZSA/IGxpbmtlZElucHV0LnZhbHVlLnNwbGl0KFwiLFwiKS5tYXAocyA9PiBzLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pIDogW10sXG4gICAgICAgIHByb2plY3RzOiAgICAgIHQ/LnByb2plY3RzID8/IFtdLFxuICAgICAgICB0aW1lRW50cmllczogICB0Py50aW1lRW50cmllcyA/PyBbXSxcbiAgICAgICAgY29tcGxldGVkSW5zdGFuY2VzOiB0Py5jb21wbGV0ZWRJbnN0YW5jZXMgPz8gW10sXG4gICAgICAgIGN1c3RvbUZpZWxkczogIGN1c3RvbUZpZWxkcy5maWx0ZXIoZiA9PiBmLmtleSkubWFwKGYgPT4gKHsga2V5OiBmLmtleSwgdmFsdWU6IGYudmFsdWUgfSkpLFxuICAgICAgICBub3RlczogICAgICAgICBub3Rlc0lucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgIH07XG5cbiAgICAgIGlmICh0KSB7XG4gICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIudXBkYXRlKHsgLi4udCwgLi4udGFza0RhdGEgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmNyZWF0ZSh0YXNrRGF0YSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVEFTS19GT1JNX1ZJRVdfVFlQRSk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhhbmRsZVNhdmUpO1xuXG4gICAgLy8gVGFiIHRocm91Z2ggZmllbGRzIG5hdHVyYWxseSwgRW50ZXIgb24gdGl0bGUgc2F2ZXNcbiAgICB0aXRsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChlKSA9PiB7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIikgaGFuZGxlU2F2ZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBmaWVsZChwYXJlbnQ6IEhUTUxFbGVtZW50LCBsYWJlbDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHdyYXAgPSBwYXJlbnQuY3JlYXRlRGl2KFwiY2YtZmllbGRcIik7XG4gICAgd3JhcC5jcmVhdGVEaXYoXCJjZi1sYWJlbFwiKS5zZXRUZXh0KGxhYmVsKTtcbiAgICByZXR1cm4gd3JhcDtcbiAgfVxufSIsICJpbXBvcnQgeyBFdmVudEZvcm1WaWV3LCBFVkVOVF9GT1JNX1ZJRVdfVFlQRSB9IGZyb20gXCIuL0V2ZW50Rm9ybVZpZXdcIjtcbmltcG9ydCB7IENocm9uaWNsZUV2ZW50IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgRXZlbnRNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvRXZlbnRNYW5hZ2VyXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL1Rhc2tNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZUV2ZW50LCBDaHJvbmljbGVUYXNrIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBFdmVudE1vZGFsIH0gZnJvbSBcIi4uL3VpL0V2ZW50TW9kYWxcIjtcblxuZXhwb3J0IGNvbnN0IENBTEVOREFSX1ZJRVdfVFlQRSA9IFwiY2hyb25pY2xlLWNhbGVuZGFyLXZpZXdcIjtcbnR5cGUgQ2FsZW5kYXJNb2RlID0gXCJkYXlcIiB8IFwid2Vla1wiIHwgXCJtb250aFwiIHwgXCJ5ZWFyXCI7XG5cbmNvbnN0IEhPVVJfSEVJR0hUID0gNTY7XG5cbmV4cG9ydCBjbGFzcyBDYWxlbmRhclZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIHByaXZhdGUgZXZlbnRNYW5hZ2VyOiAgICBFdmVudE1hbmFnZXI7XG4gIHByaXZhdGUgdGFza01hbmFnZXI6ICAgICBUYXNrTWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSBjdXJyZW50RGF0ZTogRGF0ZSAgICAgICAgID0gbmV3IERhdGUoKTtcbiAgcHJpdmF0ZSBtb2RlOiAgICAgICAgQ2FsZW5kYXJNb2RlID0gXCJ3ZWVrXCI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbGVhZjogV29ya3NwYWNlTGVhZixcbiAgICBldmVudE1hbmFnZXI6ICAgIEV2ZW50TWFuYWdlcixcbiAgICB0YXNrTWFuYWdlcjogICAgIFRhc2tNYW5hZ2VyLFxuICAgIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyXG4gICkge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMuZXZlbnRNYW5hZ2VyICAgID0gZXZlbnRNYW5hZ2VyO1xuICAgIHRoaXMudGFza01hbmFnZXIgICAgID0gdGFza01hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiAgICBzdHJpbmcgeyByZXR1cm4gQ0FMRU5EQVJfVklFV19UWVBFOyB9XG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7IHJldHVybiBcIkNocm9uaWNsZSBDYWxlbmRhclwiOyB9XG4gIGdldEljb24oKTogICAgICAgIHN0cmluZyB7IHJldHVybiBcImNhbGVuZGFyXCI7IH1cblxuICBhc3luYyBvbk9wZW4oKSB7XG4gICAgYXdhaXQgdGhpcy5yZW5kZXIoKTtcblxuICAgIC8vIFNhbWUgcGVybWFuZW50IGZpeCBhcyB0YXNrIGRhc2hib2FyZCBcdTIwMTQgbWV0YWRhdGFDYWNoZSBmaXJlcyBhZnRlclxuICAgIC8vIGZyb250bWF0dGVyIGlzIGZ1bGx5IHBhcnNlZCwgc28gZGF0YSBpcyBmcmVzaCB3aGVuIHdlIHJlLXJlbmRlclxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUub24oXCJjaGFuZ2VkXCIsIChmaWxlKSA9PiB7XG4gICAgICAgIGNvbnN0IGluRXZlbnRzID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5ldmVudE1hbmFnZXJbXCJldmVudHNGb2xkZXJcIl0pO1xuICAgICAgICBjb25zdCBpblRhc2tzICA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMudGFza01hbmFnZXJbXCJ0YXNrc0ZvbGRlclwiXSk7XG4gICAgICAgIGlmIChpbkV2ZW50cyB8fCBpblRhc2tzKSB0aGlzLnJlbmRlcigpO1xuICAgICAgfSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwiY3JlYXRlXCIsIChmaWxlKSA9PiB7XG4gICAgICAgIGNvbnN0IGluRXZlbnRzID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5ldmVudE1hbmFnZXJbXCJldmVudHNGb2xkZXJcIl0pO1xuICAgICAgICBjb25zdCBpblRhc2tzICA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMudGFza01hbmFnZXJbXCJ0YXNrc0ZvbGRlclwiXSk7XG4gICAgICAgIGlmIChpbkV2ZW50cyB8fCBpblRhc2tzKSBzZXRUaW1lb3V0KCgpID0+IHRoaXMucmVuZGVyKCksIDIwMCk7XG4gICAgICB9KVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAudmF1bHQub24oXCJkZWxldGVcIiwgKGZpbGUpID0+IHtcbiAgICAgICAgY29uc3QgaW5FdmVudHMgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLmV2ZW50TWFuYWdlcltcImV2ZW50c0ZvbGRlclwiXSk7XG4gICAgICAgIGNvbnN0IGluVGFza3MgID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKTtcbiAgICAgICAgaWYgKGluRXZlbnRzIHx8IGluVGFza3MpIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBhc3luYyByZW5kZXIoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb250YWluZXIuZW1wdHkoKTtcbiAgICBjb250YWluZXIuYWRkQ2xhc3MoXCJjaHJvbmljbGUtY2FsLWFwcFwiKTtcblxuICAgIGNvbnN0IHRhc2tzICA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0QWxsKCk7XG5cbiAgICAvLyBHZXQgZGF0ZSByYW5nZSBmb3IgY3VycmVudCB2aWV3IHNvIHJlY3VycmVuY2UgZXhwYW5zaW9uIGlzIHNjb3BlZFxuICAgIGNvbnN0IHJhbmdlU3RhcnQgPSB0aGlzLmdldFJhbmdlU3RhcnQoKTtcbiAgICBjb25zdCByYW5nZUVuZCAgID0gdGhpcy5nZXRSYW5nZUVuZCgpO1xuICAgIGNvbnN0IGV2ZW50cyAgICAgPSBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci5nZXRJblJhbmdlV2l0aFJlY3VycmVuY2UocmFuZ2VTdGFydCwgcmFuZ2VFbmQpO1xuXG4gICAgY29uc3QgbGF5b3V0ICA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2FsLWxheW91dFwiKTtcbiAgICBjb25zdCBzaWRlYmFyID0gbGF5b3V0LmNyZWF0ZURpdihcImNocm9uaWNsZS1jYWwtc2lkZWJhclwiKTtcbiAgICBjb25zdCBtYWluICAgID0gbGF5b3V0LmNyZWF0ZURpdihcImNocm9uaWNsZS1jYWwtbWFpblwiKTtcblxuICAgIHRoaXMucmVuZGVyU2lkZWJhcihzaWRlYmFyKTtcbiAgICB0aGlzLnJlbmRlclRvb2xiYXIobWFpbik7XG5cbiAgICBpZiAgICAgICh0aGlzLm1vZGUgPT09IFwieWVhclwiKSAgdGhpcy5yZW5kZXJZZWFyVmlldyhtYWluLCBldmVudHMsIHRhc2tzKTtcbiAgICBlbHNlIGlmICh0aGlzLm1vZGUgPT09IFwibW9udGhcIikgdGhpcy5yZW5kZXJNb250aFZpZXcobWFpbiwgZXZlbnRzLCB0YXNrcyk7XG4gICAgZWxzZSBpZiAodGhpcy5tb2RlID09PSBcIndlZWtcIikgIHRoaXMucmVuZGVyV2Vla1ZpZXcobWFpbiwgZXZlbnRzLCB0YXNrcyk7XG4gICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckRheVZpZXcobWFpbiwgZXZlbnRzLCB0YXNrcyk7XG4gIH1cblxucHJpdmF0ZSBhc3luYyBvcGVuRXZlbnRGdWxsUGFnZShldmVudD86IENocm9uaWNsZUV2ZW50KSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKGV4aXN0aW5nKSBleGlzdGluZy5kZXRhY2goKTtcbiAgICBjb25zdCBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBFVkVOVF9GT1JNX1ZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuXG4gICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMCkpO1xuICAgIGNvbnN0IGZvcm1MZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgY29uc3QgZm9ybVZpZXcgPSBmb3JtTGVhZj8udmlldyBhcyBFdmVudEZvcm1WaWV3IHwgdW5kZWZpbmVkO1xuICAgIGlmIChmb3JtVmlldyAmJiBldmVudCkgZm9ybVZpZXcubG9hZEV2ZW50KGV2ZW50KTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTaWRlYmFyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5wcml2YXRlIGdldFJhbmdlU3RhcnQoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcImRheVwiKSByZXR1cm4gdGhpcy5jdXJyZW50RGF0ZS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcIndlZWtcIikge1xuICAgICAgY29uc3QgcyA9IHRoaXMuZ2V0V2Vla1N0YXJ0KCk7XG4gICAgICByZXR1cm4gcy50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJ5ZWFyXCIpIHJldHVybiBgJHt0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCl9LTAxLTAxYDtcbiAgICAvLyBtb250aFxuICAgIGNvbnN0IHkgPSB0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgY29uc3QgbSA9IHRoaXMuY3VycmVudERhdGUuZ2V0TW9udGgoKTtcbiAgICByZXR1cm4gYCR7eX0tJHtTdHJpbmcobSsxKS5wYWRTdGFydCgyLFwiMFwiKX0tMDFgO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRSYW5nZUVuZCgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwiZGF5XCIpIHJldHVybiB0aGlzLmN1cnJlbnREYXRlLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwid2Vla1wiKSB7XG4gICAgICBjb25zdCBzID0gdGhpcy5nZXRXZWVrU3RhcnQoKTtcbiAgICAgIGNvbnN0IGUgPSBuZXcgRGF0ZShzKTsgZS5zZXREYXRlKGUuZ2V0RGF0ZSgpICsgNik7XG4gICAgICByZXR1cm4gZS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJ5ZWFyXCIpIHJldHVybiBgJHt0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCl9LTEyLTMxYDtcbiAgICAvLyBtb250aFxuICAgIGNvbnN0IHkgPSB0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgY29uc3QgbSA9IHRoaXMuY3VycmVudERhdGUuZ2V0TW9udGgoKTtcbiAgICByZXR1cm4gbmV3IERhdGUoeSwgbSArIDEsIDApLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJTaWRlYmFyKHNpZGViYXI6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgbmV3RXZlbnRCdG4gPSBzaWRlYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJjaHJvbmljbGUtbmV3LXRhc2stYnRuXCIsIHRleHQ6IFwiTmV3IGV2ZW50XCJcbiAgICB9KTtcbiAgICBuZXdFdmVudEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgbmV3IEV2ZW50TW9kYWwoXG4gICAgICAgIHRoaXMuYXBwLCB0aGlzLmV2ZW50TWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIsXG4gICAgICAgIHVuZGVmaW5lZCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGUpID0+IHRoaXMub3BlbkV2ZW50RnVsbFBhZ2UoZSlcbiAgICAgICkub3BlbigpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJNaW5pQ2FsZW5kYXIoc2lkZWJhcik7XG5cbiAgICBjb25zdCBjYWxTZWN0aW9uID0gc2lkZWJhci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdHMtc2VjdGlvblwiKTtcbiAgICBjYWxTZWN0aW9uLmNyZWF0ZURpdihcImNocm9uaWNsZS1zZWN0aW9uLWxhYmVsXCIpLnNldFRleHQoXCJNeSBDYWxlbmRhcnNcIik7XG5cbiAgICBmb3IgKGNvbnN0IGNhbCBvZiB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRBbGwoKSkge1xuICAgICAgY29uc3Qgcm93ICAgID0gY2FsU2VjdGlvbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2FsLWxpc3Qtcm93XCIpO1xuICAgICAgY29uc3QgdG9nZ2xlID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNoZWNrYm94XCIsIGNsczogXCJjaHJvbmljbGUtY2FsLXRvZ2dsZVwiIH0pO1xuICAgICAgdG9nZ2xlLmNoZWNrZWQgPSBjYWwuaXNWaXNpYmxlO1xuICAgICAgdG9nZ2xlLnN0eWxlLmFjY2VudENvbG9yID0gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKTtcbiAgICAgIHRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5jYWxlbmRhck1hbmFnZXIudG9nZ2xlVmlzaWJpbGl0eShjYWwuaWQpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfSk7XG4gICAgICBjb25zdCBkb3QgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3QtZG90XCIpO1xuICAgICAgZG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcik7XG4gICAgICByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3QtbmFtZVwiKS5zZXRUZXh0KGNhbC5uYW1lKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlck1pbmlDYWxlbmRhcihwYXJlbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgbWluaSAgID0gcGFyZW50LmNyZWF0ZURpdihcImNocm9uaWNsZS1taW5pLWNhbFwiKTtcbiAgICBjb25zdCBoZWFkZXIgPSBtaW5pLmNyZWF0ZURpdihcImNocm9uaWNsZS1taW5pLWNhbC1oZWFkZXJcIik7XG5cbiAgICBjb25zdCBwcmV2QnRuICAgID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNocm9uaWNsZS1taW5pLW5hdlwiLCB0ZXh0OiBcIlx1MjAzOVwiIH0pO1xuICAgIGNvbnN0IG1vbnRoTGFiZWwgPSBoZWFkZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktbW9udGgtbGFiZWxcIik7XG4gICAgY29uc3QgbmV4dEJ0biAgICA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjaHJvbmljbGUtbWluaS1uYXZcIiwgdGV4dDogXCJcdTIwM0FcIiB9KTtcblxuICAgIGNvbnN0IHllYXIgID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpO1xuICAgIGNvbnN0IG1vbnRoID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRNb250aCgpO1xuICAgIG1vbnRoTGFiZWwuc2V0VGV4dChcbiAgICAgIG5ldyBEYXRlKHllYXIsIG1vbnRoKS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7IG1vbnRoOiBcImxvbmdcIiwgeWVhcjogXCJudW1lcmljXCIgfSlcbiAgICApO1xuXG4gICAgcHJldkJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jdXJyZW50RGF0ZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoIC0gMSwgMSk7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pO1xuICAgIG5leHRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY3VycmVudERhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCArIDEsIDEpO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGdyaWQgICAgICAgID0gbWluaS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1ncmlkXCIpO1xuICAgIGNvbnN0IGZpcnN0RGF5ICAgID0gbmV3IERhdGUoeWVhciwgbW9udGgsIDEpLmdldERheSgpO1xuICAgIGNvbnN0IGRheXNJbk1vbnRoID0gbmV3IERhdGUoeWVhciwgbW9udGggKyAxLCAwKS5nZXREYXRlKCk7XG4gICAgY29uc3QgdG9kYXlTdHIgICAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgZm9yIChjb25zdCBkIG9mIFtcIlNcIixcIk1cIixcIlRcIixcIldcIixcIlRcIixcIkZcIixcIlNcIl0pXG4gICAgICBncmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1taW5pLWRheS1uYW1lXCIpLnNldFRleHQoZCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpcnN0RGF5OyBpKyspXG4gICAgICBncmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1taW5pLWRheSBjaHJvbmljbGUtbWluaS1kYXktZW1wdHlcIik7XG5cbiAgICBmb3IgKGxldCBkID0gMTsgZCA8PSBkYXlzSW5Nb250aDsgZCsrKSB7XG4gICAgICBjb25zdCBkYXRlU3RyID0gYCR7eWVhcn0tJHtTdHJpbmcobW9udGgrMSkucGFkU3RhcnQoMixcIjBcIil9LSR7U3RyaW5nKGQpLnBhZFN0YXJ0KDIsXCIwXCIpfWA7XG4gICAgICBjb25zdCBkYXlFbCAgID0gZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1kYXlcIik7XG4gICAgICBkYXlFbC5zZXRUZXh0KFN0cmluZyhkKSk7XG4gICAgICBpZiAoZGF0ZVN0ciA9PT0gdG9kYXlTdHIpIGRheUVsLmFkZENsYXNzKFwidG9kYXlcIik7XG4gICAgICBkYXlFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmN1cnJlbnREYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGQpO1xuICAgICAgICB0aGlzLm1vZGUgPSBcImRheVwiO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFRvb2xiYXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSByZW5kZXJUb29sYmFyKG1haW46IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgdG9vbGJhciAgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS1jYWwtdG9vbGJhclwiKTtcbiAgICBjb25zdCBuYXZHcm91cCA9IHRvb2xiYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC1uYXYtZ3JvdXBcIik7XG5cbiAgICBuYXZHcm91cC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjaHJvbmljbGUtY2FsLW5hdi1idG5cIiwgdGV4dDogXCJcdTIwMzlcIiB9KVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKC0xKSk7XG4gICAgbmF2R3JvdXAuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2hyb25pY2xlLWNhbC10b2RheS1idG5cIiwgdGV4dDogXCJUb2RheVwiIH0pXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50RGF0ZSA9IG5ldyBEYXRlKCk7IHRoaXMucmVuZGVyKCk7IH0pO1xuICAgIG5hdkdyb3VwLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNocm9uaWNsZS1jYWwtbmF2LWJ0blwiLCB0ZXh0OiBcIlx1MjAzQVwiIH0pXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMubmF2aWdhdGUoMSkpO1xuXG4gICAgdG9vbGJhci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2FsLXRvb2xiYXItdGl0bGVcIikuc2V0VGV4dCh0aGlzLmdldFRvb2xiYXJUaXRsZSgpKTtcblxuICAgIGNvbnN0IHBpbGxzID0gdG9vbGJhci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdmlldy1waWxsc1wiKTtcbiAgICBmb3IgKGNvbnN0IFttLCBsYWJlbF0gb2YgW1tcImRheVwiLFwiRGF5XCJdLFtcIndlZWtcIixcIldlZWtcIl0sW1wibW9udGhcIixcIk1vbnRoXCJdLFtcInllYXJcIixcIlllYXJcIl1dIGFzIFtDYWxlbmRhck1vZGUsc3RyaW5nXVtdKSB7XG4gICAgICBjb25zdCBwaWxsID0gcGlsbHMuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXZpZXctcGlsbFwiKTtcbiAgICAgIHBpbGwuc2V0VGV4dChsYWJlbCk7XG4gICAgICBpZiAodGhpcy5tb2RlID09PSBtKSBwaWxsLmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgcGlsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLm1vZGUgPSBtOyB0aGlzLnJlbmRlcigpOyB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG5hdmlnYXRlKGRpcjogbnVtYmVyKSB7XG4gICAgY29uc3QgZCA9IG5ldyBEYXRlKHRoaXMuY3VycmVudERhdGUpO1xuICAgIGlmICAgICAgKHRoaXMubW9kZSA9PT0gXCJkYXlcIikgIGQuc2V0RGF0ZShkLmdldERhdGUoKSArIGRpcik7XG4gICAgZWxzZSBpZiAodGhpcy5tb2RlID09PSBcIndlZWtcIikgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgZGlyICogNyk7XG4gICAgZWxzZSBpZiAodGhpcy5tb2RlID09PSBcInllYXJcIikgZC5zZXRGdWxsWWVhcihkLmdldEZ1bGxZZWFyKCkgKyBkaXIpO1xuICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnNldE1vbnRoKGQuZ2V0TW9udGgoKSArIGRpcik7XG4gICAgdGhpcy5jdXJyZW50RGF0ZSA9IGQ7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0VG9vbGJhclRpdGxlKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJ5ZWFyXCIpICByZXR1cm4gU3RyaW5nKHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKSk7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJtb250aFwiKSByZXR1cm4gdGhpcy5jdXJyZW50RGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7IG1vbnRoOiBcImxvbmdcIiwgeWVhcjogXCJudW1lcmljXCIgfSk7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJkYXlcIikgICByZXR1cm4gdGhpcy5jdXJyZW50RGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7IHdlZWtkYXk6IFwibG9uZ1wiLCBtb250aDogXCJsb25nXCIsIGRheTogXCJudW1lcmljXCIsIHllYXI6IFwibnVtZXJpY1wiIH0pO1xuICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5nZXRXZWVrU3RhcnQoKTtcbiAgICBjb25zdCBlbmQgICA9IG5ldyBEYXRlKHN0YXJ0KTsgZW5kLnNldERhdGUoZW5kLmdldERhdGUoKSArIDYpO1xuICAgIHJldHVybiBgJHtzdGFydC50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLHsgbW9udGg6XCJzaG9ydFwiLCBkYXk6XCJudW1lcmljXCIgfSl9IFx1MjAxMyAke2VuZC50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLHsgbW9udGg6XCJzaG9ydFwiLCBkYXk6XCJudW1lcmljXCIsIHllYXI6XCJudW1lcmljXCIgfSl9YDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0V2Vla1N0YXJ0KCk6IERhdGUge1xuICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSh0aGlzLmN1cnJlbnREYXRlKTtcbiAgICBkLnNldERhdGUoZC5nZXREYXRlKCkgLSBkLmdldERheSgpKTtcbiAgICByZXR1cm4gZDtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBZZWFyIHZpZXcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSByZW5kZXJZZWFyVmlldyhtYWluOiBIVE1MRWxlbWVudCwgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdLCB0YXNrczogQ2hyb25pY2xlVGFza1tdKSB7XG4gICAgY29uc3QgeWVhciAgICAgPSB0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgY29uc3QgdG9kYXlTdHIgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IHllYXJHcmlkID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1ncmlkXCIpO1xuXG4gICAgZm9yIChsZXQgbSA9IDA7IG0gPCAxMjsgbSsrKSB7XG4gICAgICBjb25zdCBjYXJkID0geWVhckdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXllYXItbW9udGgtY2FyZFwiKTtcbiAgICAgIGNvbnN0IG5hbWUgPSBjYXJkLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLW1vbnRoLW5hbWVcIik7XG4gICAgICBuYW1lLnNldFRleHQobmV3IERhdGUoeWVhciwgbSkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyBtb250aDogXCJsb25nXCIgfSkpO1xuICAgICAgbmFtZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmN1cnJlbnREYXRlID0gbmV3IERhdGUoeWVhciwgbSwgMSk7IHRoaXMubW9kZSA9IFwibW9udGhcIjsgdGhpcy5yZW5kZXIoKTsgfSk7XG5cbiAgICAgIGNvbnN0IG1pbmlHcmlkICAgID0gY2FyZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1taW5pLWdyaWRcIik7XG4gICAgICBjb25zdCBmaXJzdERheSAgICA9IG5ldyBEYXRlKHllYXIsIG0sIDEpLmdldERheSgpO1xuICAgICAgY29uc3QgZGF5c0luTW9udGggPSBuZXcgRGF0ZSh5ZWFyLCBtICsgMSwgMCkuZ2V0RGF0ZSgpO1xuXG4gICAgICBmb3IgKGNvbnN0IGQgb2YgW1wiU1wiLFwiTVwiLFwiVFwiLFwiV1wiLFwiVFwiLFwiRlwiLFwiU1wiXSlcbiAgICAgICAgbWluaUdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXllYXItZGF5LW5hbWVcIikuc2V0VGV4dChkKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaXJzdERheTsgaSsrKVxuICAgICAgICBtaW5pR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1kYXktZW1wdHlcIik7XG5cbiAgICAgIGZvciAobGV0IGQgPSAxOyBkIDw9IGRheXNJbk1vbnRoOyBkKyspIHtcbiAgICAgICAgY29uc3QgZGF0ZVN0ciAgPSBgJHt5ZWFyfS0ke1N0cmluZyhtKzEpLnBhZFN0YXJ0KDIsXCIwXCIpfS0ke1N0cmluZyhkKS5wYWRTdGFydCgyLFwiMFwiKX1gO1xuICAgICAgICBjb25zdCBoYXNFdmVudCA9IGV2ZW50cy5zb21lKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgdGhpcy5pc0NhbGVuZGFyVmlzaWJsZShlLmNhbGVuZGFySWQpKTtcbiAgICAgICAgY29uc3QgaGFzVGFzayAgPSB0YXNrcy5zb21lKHQgPT4gdC5kdWVEYXRlID09PSBkYXRlU3RyICYmIHQuc3RhdHVzICE9PSBcImRvbmVcIik7XG4gICAgICAgIGNvbnN0IGRheUVsICAgID0gbWluaUdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXllYXItZGF5XCIpO1xuICAgICAgICBkYXlFbC5zZXRUZXh0KFN0cmluZyhkKSk7XG4gICAgICAgIGlmIChkYXRlU3RyID09PSB0b2RheVN0cikgZGF5RWwuYWRkQ2xhc3MoXCJ0b2RheVwiKTtcbiAgICAgICAgaWYgKGhhc0V2ZW50KSBkYXlFbC5hZGRDbGFzcyhcImhhcy1ldmVudFwiKTtcbiAgICAgICAgaWYgKGhhc1Rhc2spICBkYXlFbC5hZGRDbGFzcyhcImhhcy10YXNrXCIpO1xuICAgICAgICBkYXlFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmN1cnJlbnREYXRlID0gbmV3IERhdGUoeWVhciwgbSwgZCk7IHRoaXMubW9kZSA9IFwiZGF5XCI7IHRoaXMucmVuZGVyKCk7IH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBNb250aCB2aWV3IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyTW9udGhWaWV3KG1haW46IEhUTUxFbGVtZW50LCBldmVudHM6IENocm9uaWNsZUV2ZW50W10sIHRhc2tzOiBDaHJvbmljbGVUYXNrW10pIHtcbiAgICBjb25zdCB5ZWFyICAgICA9IHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBtb250aCAgICA9IHRoaXMuY3VycmVudERhdGUuZ2V0TW9udGgoKTtcbiAgICBjb25zdCB0b2RheVN0ciA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgZ3JpZCAgICAgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1ncmlkXCIpO1xuXG4gICAgZm9yIChjb25zdCBkIG9mIFtcIlN1blwiLFwiTW9uXCIsXCJUdWVcIixcIldlZFwiLFwiVGh1XCIsXCJGcmlcIixcIlNhdFwiXSlcbiAgICAgIGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWRheS1uYW1lXCIpLnNldFRleHQoZCk7XG5cbiAgICBjb25zdCBmaXJzdERheSAgICAgID0gbmV3IERhdGUoeWVhciwgbW9udGgsIDEpLmdldERheSgpO1xuICAgIGNvbnN0IGRheXNJbk1vbnRoICAgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCArIDEsIDApLmdldERhdGUoKTtcbiAgICBjb25zdCBkYXlzSW5QcmV2TW9uID0gbmV3IERhdGUoeWVhciwgbW9udGgsIDApLmdldERhdGUoKTtcblxuICAgIGZvciAobGV0IGkgPSBmaXJzdERheSAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCBjZWxsID0gZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtY2VsbCBjaHJvbmljbGUtbW9udGgtY2VsbC1vdGhlclwiKTtcbiAgICAgIGNlbGwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGwtbnVtXCIpLnNldFRleHQoU3RyaW5nKGRheXNJblByZXZNb24gLSBpKSk7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgZCA9IDE7IGQgPD0gZGF5c0luTW9udGg7IGQrKykge1xuICAgICAgY29uc3QgZGF0ZVN0ciA9IGAke3llYXJ9LSR7U3RyaW5nKG1vbnRoKzEpLnBhZFN0YXJ0KDIsXCIwXCIpfS0ke1N0cmluZyhkKS5wYWRTdGFydCgyLFwiMFwiKX1gO1xuICAgICAgY29uc3QgY2VsbCAgICA9IGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGxcIik7XG4gICAgICBpZiAoZGF0ZVN0ciA9PT0gdG9kYXlTdHIpIGNlbGwuYWRkQ2xhc3MoXCJ0b2RheVwiKTtcbiAgICAgIGNlbGwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGwtbnVtXCIpLnNldFRleHQoU3RyaW5nKGQpKTtcblxuICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKCkgPT4gdGhpcy5vcGVuTmV3RXZlbnRNb2RhbChkYXRlU3RyLCB0cnVlKSk7XG4gICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuc2hvd0NhbENvbnRleHRNZW51KGUuY2xpZW50WCwgZS5jbGllbnRZLCBkYXRlU3RyLCB0cnVlKTtcbiAgICAgIH0pO1xuXG4gICAgICBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgdGhpcy5pc0NhbGVuZGFyVmlzaWJsZShlLmNhbGVuZGFySWQpKS5zbGljZSgwLDMpXG4gICAgICAgIC5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgICAgICBjb25zdCBjYWwgICA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoZXZlbnQuY2FsZW5kYXJJZCA/PyBcIlwiKTtcbiAgICAgICAgICBjb25zdCBjb2xvciA9IGNhbCA/IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcikgOiBcIiMzNzhBRERcIjtcbiAgICAgICAgICBjb25zdCBwaWxsICA9IGNlbGwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWV2ZW50LXBpbGxcIik7XG4gICAgICAgICAgcGlsbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvciArIFwiMzNcIjtcbiAgICAgICAgICBwaWxsLnN0eWxlLmJvcmRlckxlZnQgICAgICA9IGAzcHggc29saWQgJHtjb2xvcn1gO1xuICAgICAgICAgIHBpbGwuc3R5bGUuY29sb3IgICAgICAgICAgID0gY29sb3I7XG4gICAgICAgICAgcGlsbC5zZXRUZXh0KGV2ZW50LnRpdGxlKTtcbiAgICAgICAgICBwaWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIG5ldyBFdmVudE1vZGFsKHRoaXMuYXBwLCB0aGlzLmV2ZW50TWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIsIGV2ZW50LCAoKSA9PiB0aGlzLnJlbmRlcigpLCAoZSkgPT4gdGhpcy5vcGVuRXZlbnRGdWxsUGFnZShlKSkub3BlbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgdGFza3MuZmlsdGVyKHQgPT4gdC5kdWVEYXRlID09PSBkYXRlU3RyICYmIHQuc3RhdHVzICE9PSBcImRvbmVcIikuc2xpY2UoMCwyKVxuICAgICAgICAuZm9yRWFjaCh0YXNrID0+IHtcbiAgICAgICAgICBjb25zdCBwaWxsID0gY2VsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtZXZlbnQtcGlsbFwiKTtcbiAgICAgICAgICBwaWxsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiI0ZGM0IzMDIyXCI7XG4gICAgICAgICAgcGlsbC5zdHlsZS5ib3JkZXJMZWZ0ICAgICAgPSBcIjNweCBzb2xpZCAjRkYzQjMwXCI7XG4gICAgICAgICAgcGlsbC5zdHlsZS5jb2xvciAgICAgICAgICAgPSBcIiNGRjNCMzBcIjtcbiAgICAgICAgICBwaWxsLnNldFRleHQoXCJcdTI3MTMgXCIgKyB0YXNrLnRpdGxlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVtYWluaW5nID0gNyAtICgoZmlyc3REYXkgKyBkYXlzSW5Nb250aCkgJSA3KTtcbiAgICBpZiAocmVtYWluaW5nIDwgNylcbiAgICAgIGZvciAobGV0IGQgPSAxOyBkIDw9IHJlbWFpbmluZzsgZCsrKSB7XG4gICAgICAgIGNvbnN0IGNlbGwgPSBncmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1jZWxsIGNocm9uaWNsZS1tb250aC1jZWxsLW90aGVyXCIpO1xuICAgICAgICBjZWxsLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1jZWxsLW51bVwiKS5zZXRUZXh0KFN0cmluZyhkKSk7XG4gICAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgV2VlayB2aWV3IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyV2Vla1ZpZXcobWFpbjogSFRNTEVsZW1lbnQsIGV2ZW50czogQ2hyb25pY2xlRXZlbnRbXSwgdGFza3M6IENocm9uaWNsZVRhc2tbXSkge1xuICAgIGNvbnN0IHdlZWtTdGFydCA9IHRoaXMuZ2V0V2Vla1N0YXJ0KCk7XG4gICAgY29uc3QgZGF5czogRGF0ZVtdID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogNyB9LCAoXywgaSkgPT4ge1xuICAgICAgY29uc3QgZCA9IG5ldyBEYXRlKHdlZWtTdGFydCk7IGQuc2V0RGF0ZShkLmdldERhdGUoKSArIGkpOyByZXR1cm4gZDtcbiAgICB9KTtcbiAgICBjb25zdCB0b2RheVN0ciA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICAvLyBUaGUgd2VlayBncmlkOiB0aW1lLWNvbCArIDcgZGF5LWNvbHNcbiAgICAvLyBFYWNoIGRheS1jb2wgY29udGFpbnM6IGhlYWRlciBcdTIxOTIgYWxsLWRheSBzaGVsZiBcdTIxOTIgdGltZSBncmlkXG4gICAgLy8gVGhpcyBtaXJyb3JzIGRheSB2aWV3IGV4YWN0bHkgXHUyMDE0IHNoZWxmIGlzIGFsd2F5cyBiZWxvdyB0aGUgZGF0ZSBoZWFkZXJcbiAgICBjb25zdCBjYWxHcmlkID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtd2Vlay1ncmlkXCIpO1xuXG4gICAgLy8gVGltZSBjb2x1bW5cbiAgICBjb25zdCB0aW1lQ29sID0gY2FsR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGltZS1jb2xcIik7XG4gICAgLy8gQmxhbmsgY2VsbCB0aGF0IGFsaWducyB3aXRoIHRoZSBkYXkgaGVhZGVyIHJvd1xuICAgIHRpbWVDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbWUtY29sLWhlYWRlclwiKTtcbiAgICAvLyBCbGFuayBjZWxsIHRoYXQgYWxpZ25zIHdpdGggdGhlIGFsbC1kYXkgc2hlbGYgcm93XG4gICAgY29uc3Qgc2hlbGZTcGFjZXIgPSB0aW1lQ29sLmNyZWF0ZURpdihcImNocm9uaWNsZS10aW1lLWNvbC1zaGVsZi1zcGFjZXJcIik7XG4gICAgc2hlbGZTcGFjZXIuc2V0VGV4dChcImFsbC1kYXlcIik7XG4gICAgLy8gSG91ciBsYWJlbHNcbiAgICBmb3IgKGxldCBoID0gMDsgaCA8IDI0OyBoKyspXG4gICAgICB0aW1lQ29sLmNyZWF0ZURpdihcImNocm9uaWNsZS10aW1lLXNsb3RcIikuc2V0VGV4dCh0aGlzLmZvcm1hdEhvdXIoaCkpO1xuXG4gICAgLy8gRGF5IGNvbHVtbnNcbiAgICBmb3IgKGNvbnN0IGRheSBvZiBkYXlzKSB7XG4gICAgICBjb25zdCBkYXRlU3RyICAgICAgPSBkYXkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgICBjb25zdCBjb2wgICAgICAgICAgPSBjYWxHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktY29sXCIpO1xuICAgICAgY29uc3QgYWxsRGF5RXZlbnRzID0gZXZlbnRzLmZpbHRlcihlID0+IGUuc3RhcnREYXRlID09PSBkYXRlU3RyICYmIGUuYWxsRGF5ICYmIHRoaXMuaXNDYWxlbmRhclZpc2libGUoZS5jYWxlbmRhcklkKSk7XG5cbiAgICAgIC8vIDEuIERheSBoZWFkZXJcbiAgICAgIGNvbnN0IGRheUhlYWRlciA9IGNvbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LWhlYWRlclwiKTtcbiAgICAgIGRheUhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LW5hbWVcIikuc2V0VGV4dChcbiAgICAgICAgZGF5LnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgd2Vla2RheTogXCJzaG9ydFwiIH0pLnRvVXBwZXJDYXNlKClcbiAgICAgICk7XG4gICAgICBjb25zdCBkYXlOdW0gPSBkYXlIZWFkZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1udW1cIik7XG4gICAgICBkYXlOdW0uc2V0VGV4dChTdHJpbmcoZGF5LmdldERhdGUoKSkpO1xuICAgICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSBkYXlOdW0uYWRkQ2xhc3MoXCJ0b2RheVwiKTtcblxuICAgICAgLy8gMi4gQWxsLWRheSBzaGVsZiBcdTIwMTQgc2l0cyBkaXJlY3RseSBiZWxvdyBoZWFkZXIsIHNhbWUgYXMgZGF5IHZpZXdcbiAgICAgIGNvbnN0IHNoZWxmID0gY29sLmNyZWF0ZURpdihcImNocm9uaWNsZS13ZWVrLWFsbGRheS1zaGVsZlwiKTtcbiAgICAgIGZvciAoY29uc3QgZXZlbnQgb2YgYWxsRGF5RXZlbnRzKVxuICAgICAgICB0aGlzLnJlbmRlckV2ZW50UGlsbEFsbERheShzaGVsZiwgZXZlbnQpO1xuXG4gICAgICAvLyAzLiBUaW1lIGdyaWRcbiAgICAgIGNvbnN0IHRpbWVHcmlkID0gY29sLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktdGltZS1ncmlkXCIpO1xuICAgICAgdGltZUdyaWQuc3R5bGUuaGVpZ2h0ID0gYCR7MjQgKiBIT1VSX0hFSUdIVH1weGA7XG5cbiAgICAgIGZvciAobGV0IGggPSAwOyBoIDwgMjQ7IGgrKykge1xuICAgICAgICBjb25zdCBsaW5lID0gdGltZUdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWhvdXItbGluZVwiKTtcbiAgICAgICAgbGluZS5zdHlsZS50b3AgPSBgJHtoICogSE9VUl9IRUlHSFR9cHhgO1xuICAgICAgfVxuXG4gICAgICB0aW1lR3JpZC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgY29uc3QgcmVjdCAgID0gdGltZUdyaWQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IHkgICAgICA9IGUuY2xpZW50WSAtIHJlY3QudG9wO1xuICAgICAgICBjb25zdCBob3VyICAgPSBNYXRoLm1pbihNYXRoLmZsb29yKHkgLyBIT1VSX0hFSUdIVCksIDIzKTtcbiAgICAgICAgY29uc3QgbWludXRlID0gTWF0aC5mbG9vcigoeSAlIEhPVVJfSEVJR0hUKSAvIEhPVVJfSEVJR0hUICogNjAgLyAxNSkgKiAxNTtcbiAgICAgICAgdGhpcy5vcGVuTmV3RXZlbnRNb2RhbChkYXRlU3RyLCBmYWxzZSwgaG91ciwgbWludXRlKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aW1lR3JpZC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCByZWN0ICAgPSB0aW1lR3JpZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgeSAgICAgID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICAgIGNvbnN0IGhvdXIgICA9IE1hdGgubWluKE1hdGguZmxvb3IoeSAvIEhPVVJfSEVJR0hUKSwgMjMpO1xuICAgICAgICBjb25zdCBtaW51dGUgPSBNYXRoLmZsb29yKCh5ICUgSE9VUl9IRUlHSFQpIC8gSE9VUl9IRUlHSFQgKiA2MCAvIDE1KSAqIDE1O1xuICAgICAgICB0aGlzLnNob3dDYWxDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZGF0ZVN0ciwgZmFsc2UsIGhvdXIsIG1pbnV0ZSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gVGltZWQgZXZlbnRzXG4gICAgICBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgIWUuYWxsRGF5ICYmIGUuc3RhcnRUaW1lICYmIHRoaXMuaXNDYWxlbmRhclZpc2libGUoZS5jYWxlbmRhcklkKSlcbiAgICAgICAgLmZvckVhY2goZXZlbnQgPT4gdGhpcy5yZW5kZXJFdmVudFBpbGxUaW1lZCh0aW1lR3JpZCwgZXZlbnQpKTtcblxuICAgICAgLy8gVGFzayBkdWUgcGlsbHNcbiAgICAgIHRhc2tzLmZpbHRlcih0ID0+IHQuZHVlRGF0ZSA9PT0gZGF0ZVN0ciAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpXG4gICAgICAgIC5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICAgIGNvbnN0IHRvcCAgPSB0YXNrLmR1ZVRpbWVcbiAgICAgICAgICAgID8gKCgpID0+IHsgY29uc3QgW2gsbV0gPSB0YXNrLmR1ZVRpbWUhLnNwbGl0KFwiOlwiKS5tYXAoTnVtYmVyKTsgcmV0dXJuIChoICsgbS82MCkgKiBIT1VSX0hFSUdIVDsgfSkoKVxuICAgICAgICAgICAgOiAwO1xuICAgICAgICAgIGNvbnN0IHBpbGwgPSB0aW1lR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1kYXktcGlsbFwiKTtcbiAgICAgICAgICBwaWxsLnN0eWxlLnRvcCAgICAgICAgICAgICA9IGAke3RvcH1weGA7XG4gICAgICAgICAgcGlsbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIiNGRjNCMzAyMlwiO1xuICAgICAgICAgIHBpbGwuc3R5bGUuYm9yZGVyTGVmdCAgICAgID0gXCIzcHggc29saWQgI0ZGM0IzMFwiO1xuICAgICAgICAgIHBpbGwuc3R5bGUuY29sb3IgICAgICAgICAgID0gXCIjRkYzQjMwXCI7XG4gICAgICAgICAgcGlsbC5zZXRUZXh0KFwiXHUyNzEzIFwiICsgdGFzay50aXRsZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIE5vdyBsaW5lXG4gICAgY29uc3Qgbm93ICAgICAgICAgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IG5vd1N0ciAgICAgID0gbm93LnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IHRvZGF5Q29sSWR4ID0gZGF5cy5maW5kSW5kZXgoZCA9PiBkLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdID09PSBub3dTdHIpO1xuICAgIGlmICh0b2RheUNvbElkeCA+PSAwKSB7XG4gICAgICBjb25zdCBjb2xzICAgICA9IGNhbEdyaWQucXVlcnlTZWxlY3RvckFsbChcIi5jaHJvbmljbGUtZGF5LWNvbFwiKTtcbiAgICAgIGNvbnN0IHRvZGF5Q29sID0gY29sc1t0b2RheUNvbElkeF0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgICBjb25zdCB0ZyAgICAgICA9IHRvZGF5Q29sLnF1ZXJ5U2VsZWN0b3IoXCIuY2hyb25pY2xlLWRheS10aW1lLWdyaWRcIikgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICBpZiAodGcpIHtcbiAgICAgICAgY29uc3QgdG9wICA9IChub3cuZ2V0SG91cnMoKSArIG5vdy5nZXRNaW51dGVzKCkgLyA2MCkgKiBIT1VSX0hFSUdIVDtcbiAgICAgICAgY29uc3QgbGluZSA9IHRnLmNyZWF0ZURpdihcImNocm9uaWNsZS1ub3ctbGluZVwiKTtcbiAgICAgICAgbGluZS5zdHlsZS50b3AgPSBgJHt0b3B9cHhgO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBEYXkgdmlldyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHJlbmRlckRheVZpZXcobWFpbjogSFRNTEVsZW1lbnQsIGV2ZW50czogQ2hyb25pY2xlRXZlbnRbXSwgdGFza3M6IENocm9uaWNsZVRhc2tbXSkge1xuICAgIGNvbnN0IGRhdGVTdHIgICAgICA9IHRoaXMuY3VycmVudERhdGUudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgdG9kYXlTdHIgICAgID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCBhbGxEYXlFdmVudHMgPSBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgZS5hbGxEYXkgJiYgdGhpcy5pc0NhbGVuZGFyVmlzaWJsZShlLmNhbGVuZGFySWQpKTtcbiAgICBjb25zdCBkYXlWaWV3ICAgICAgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktdmlld1wiKTtcblxuICAgIC8vIERheSBoZWFkZXJcbiAgICBjb25zdCBkYXlIZWFkZXIgPSBkYXlWaWV3LmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktdmlldy1oZWFkZXJcIik7XG4gICAgZGF5SGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktbmFtZS1sYXJnZVwiKS5zZXRUZXh0KFxuICAgICAgdGhpcy5jdXJyZW50RGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7IHdlZWtkYXk6IFwibG9uZ1wiIH0pLnRvVXBwZXJDYXNlKClcbiAgICApO1xuICAgIGNvbnN0IG51bUVsID0gZGF5SGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktbnVtLWxhcmdlXCIpO1xuICAgIG51bUVsLnNldFRleHQoU3RyaW5nKHRoaXMuY3VycmVudERhdGUuZ2V0RGF0ZSgpKSk7XG4gICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSBudW1FbC5hZGRDbGFzcyhcInRvZGF5XCIpO1xuXG4gICAgLy8gQWxsLWRheSBzaGVsZlxuICAgIGNvbnN0IHNoZWxmICAgICAgICA9IGRheVZpZXcuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1hbGxkYXktc2hlbGZcIik7XG4gICAgc2hlbGYuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1hbGxkYXktbGFiZWxcIikuc2V0VGV4dChcImFsbC1kYXlcIik7XG4gICAgY29uc3Qgc2hlbGZDb250ZW50ID0gc2hlbGYuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1hbGxkYXktY29udGVudFwiKTtcbiAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIGFsbERheUV2ZW50cylcbiAgICAgIHRoaXMucmVuZGVyRXZlbnRQaWxsQWxsRGF5KHNoZWxmQ29udGVudCwgZXZlbnQpO1xuXG4gICAgLy8gVGltZSBhcmVhXG4gICAgY29uc3QgdGltZUFyZWEgICA9IGRheVZpZXcuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1zaW5nbGUtYXJlYVwiKTtcbiAgICBjb25zdCB0aW1lTGFiZWxzID0gdGltZUFyZWEuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1zaW5nbGUtbGFiZWxzXCIpO1xuICAgIGNvbnN0IGV2ZW50Q29sICAgPSB0aW1lQXJlYS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LXNpbmdsZS1ldmVudHNcIik7XG4gICAgZXZlbnRDb2wuc3R5bGUuaGVpZ2h0ID0gYCR7MjQgKiBIT1VSX0hFSUdIVH1weGA7XG5cbiAgICBmb3IgKGxldCBoID0gMDsgaCA8IDI0OyBoKyspIHtcbiAgICAgIHRpbWVMYWJlbHMuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbWUtc2xvdFwiKS5zZXRUZXh0KHRoaXMuZm9ybWF0SG91cihoKSk7XG4gICAgICBjb25zdCBsaW5lID0gZXZlbnRDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWhvdXItbGluZVwiKTtcbiAgICAgIGxpbmUuc3R5bGUudG9wID0gYCR7aCAqIEhPVVJfSEVJR0hUfXB4YDtcbiAgICB9XG5cbiAgICBldmVudENvbC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgIGNvbnN0IHJlY3QgICA9IGV2ZW50Q29sLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgeSAgICAgID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICBjb25zdCBob3VyICAgPSBNYXRoLm1pbihNYXRoLmZsb29yKHkgLyBIT1VSX0hFSUdIVCksIDIzKTtcbiAgICAgIGNvbnN0IG1pbnV0ZSA9IE1hdGguZmxvb3IoKHkgJSBIT1VSX0hFSUdIVCkgLyBIT1VSX0hFSUdIVCAqIDYwIC8gMTUpICogMTU7XG4gICAgICB0aGlzLm9wZW5OZXdFdmVudE1vZGFsKGRhdGVTdHIsIGZhbHNlLCBob3VyLCBtaW51dGUpO1xuICAgIH0pO1xuXG4gICAgZXZlbnRDb2wuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCByZWN0ICAgPSBldmVudENvbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IHkgICAgICA9IGUuY2xpZW50WSAtIHJlY3QudG9wO1xuICAgICAgY29uc3QgaG91ciAgID0gTWF0aC5taW4oTWF0aC5mbG9vcih5IC8gSE9VUl9IRUlHSFQpLCAyMyk7XG4gICAgICBjb25zdCBtaW51dGUgPSBNYXRoLmZsb29yKCh5ICUgSE9VUl9IRUlHSFQpIC8gSE9VUl9IRUlHSFQgKiA2MCAvIDE1KSAqIDE1O1xuICAgICAgdGhpcy5zaG93Q2FsQ29udGV4dE1lbnUoZS5jbGllbnRYLCBlLmNsaWVudFksIGRhdGVTdHIsIGZhbHNlLCBob3VyLCBtaW51dGUpO1xuICAgIH0pO1xuXG4gICAgZXZlbnRzLmZpbHRlcihlID0+IGUuc3RhcnREYXRlID09PSBkYXRlU3RyICYmICFlLmFsbERheSAmJiBlLnN0YXJ0VGltZSAmJiB0aGlzLmlzQ2FsZW5kYXJWaXNpYmxlKGUuY2FsZW5kYXJJZCkpXG4gICAgICAuZm9yRWFjaChldmVudCA9PiB0aGlzLnJlbmRlckV2ZW50UGlsbFRpbWVkKGV2ZW50Q29sLCBldmVudCkpO1xuXG4gICAgdGFza3MuZmlsdGVyKHQgPT4gdC5kdWVEYXRlID09PSBkYXRlU3RyICYmIHQuc3RhdHVzICE9PSBcImRvbmVcIilcbiAgICAgIC5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICBjb25zdCB0b3AgID0gdGFzay5kdWVUaW1lXG4gICAgICAgICAgPyAoKCkgPT4geyBjb25zdCBbaCxtXSA9IHRhc2suZHVlVGltZSEuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpOyByZXR1cm4gKGggKyBtLzYwKSAqIEhPVVJfSEVJR0hUOyB9KSgpXG4gICAgICAgICAgOiAwO1xuICAgICAgICBjb25zdCBwaWxsID0gZXZlbnRDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stZGF5LXBpbGxcIik7XG4gICAgICAgIHBpbGwuc3R5bGUudG9wICAgICAgICAgICAgID0gYCR7dG9wfXB4YDtcbiAgICAgICAgcGlsbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIiNGRjNCMzAyMlwiO1xuICAgICAgICBwaWxsLnN0eWxlLmJvcmRlckxlZnQgICAgICA9IFwiM3B4IHNvbGlkICNGRjNCMzBcIjtcbiAgICAgICAgcGlsbC5zdHlsZS5jb2xvciAgICAgICAgICAgPSBcIiNGRjNCMzBcIjtcbiAgICAgICAgcGlsbC5zZXRUZXh0KFwiXHUyNzEzIFwiICsgdGFzay50aXRsZSk7XG4gICAgICB9KTtcblxuICAgIGlmIChkYXRlU3RyID09PSB0b2RheVN0cikge1xuICAgICAgY29uc3Qgbm93ICA9IG5ldyBEYXRlKCk7XG4gICAgICBjb25zdCB0b3AgID0gKG5vdy5nZXRIb3VycygpICsgbm93LmdldE1pbnV0ZXMoKSAvIDYwKSAqIEhPVVJfSEVJR0hUO1xuICAgICAgY29uc3QgbGluZSA9IGV2ZW50Q29sLmNyZWF0ZURpdihcImNocm9uaWNsZS1ub3ctbGluZVwiKTtcbiAgICAgIGxpbmUuc3R5bGUudG9wID0gYCR7dG9wfXB4YDtcbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgSGVscGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIG9wZW5OZXdFdmVudE1vZGFsKGRhdGVTdHI6IHN0cmluZywgYWxsRGF5OiBib29sZWFuLCBob3VyID0gOSwgbWludXRlID0gMCkge1xuICAgIGNvbnN0IHRpbWVTdHIgPSBgJHtTdHJpbmcoaG91cikucGFkU3RhcnQoMixcIjBcIil9OiR7U3RyaW5nKG1pbnV0ZSkucGFkU3RhcnQoMixcIjBcIil9YDtcbiAgICBjb25zdCBlbmRTdHIgID0gYCR7U3RyaW5nKE1hdGgubWluKGhvdXIrMSwyMykpLnBhZFN0YXJ0KDIsXCIwXCIpfToke1N0cmluZyhtaW51dGUpLnBhZFN0YXJ0KDIsXCIwXCIpfWA7XG4gICAgY29uc3QgcHJlZmlsbCA9IHtcbiAgICAgIGlkOiBcIlwiLCB0aXRsZTogXCJcIiwgYWxsRGF5LFxuICAgICAgc3RhcnREYXRlOiBkYXRlU3RyLCBzdGFydFRpbWU6IGFsbERheSA/IHVuZGVmaW5lZCA6IHRpbWVTdHIsXG4gICAgICBlbmREYXRlOiAgIGRhdGVTdHIsIGVuZFRpbWU6ICAgYWxsRGF5ID8gdW5kZWZpbmVkIDogZW5kU3RyLFxuICAgICAgYWxlcnQ6IFwibm9uZVwiLCBsaW5rZWRUYXNrSWRzOiBbXSwgY29tcGxldGVkSW5zdGFuY2VzOiBbXSwgY3JlYXRlZEF0OiBcIlwiXG4gICAgfSBhcyBDaHJvbmljbGVFdmVudDtcblxuICAgIG5ldyBFdmVudE1vZGFsKFxuICAgICAgdGhpcy5hcHAsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlcixcbiAgICAgIHByZWZpbGwsICgpID0+IHRoaXMucmVuZGVyKCksIChlKSA9PiB0aGlzLm9wZW5FdmVudEZ1bGxQYWdlKGUgPz8gcHJlZmlsbClcbiAgICApLm9wZW4oKTtcbiAgfVxuXG5wcml2YXRlIHNob3dFdmVudENvbnRleHRNZW51KHg6IG51bWJlciwgeTogbnVtYmVyLCBldmVudDogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBjb25zdCBtZW51ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBtZW51LmNsYXNzTmFtZSAgPSBcImNocm9uaWNsZS1jb250ZXh0LW1lbnVcIjtcbiAgICBtZW51LnN0eWxlLmxlZnQgPSBgJHt4fXB4YDtcbiAgICBtZW51LnN0eWxlLnRvcCAgPSBgJHt5fXB4YDtcblxuICAgIGNvbnN0IGVkaXRJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtXCIpO1xuICAgIGVkaXRJdGVtLnNldFRleHQoXCJFZGl0IGV2ZW50XCIpO1xuICAgIGVkaXRJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBtZW51LnJlbW92ZSgpO1xuICAgICAgbmV3IEV2ZW50TW9kYWwodGhpcy5hcHAsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlciwgZXZlbnQsICgpID0+IHRoaXMucmVuZGVyKCksIChlKSA9PiB0aGlzLm9wZW5FdmVudEZ1bGxQYWdlKGUpKS5vcGVuKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBkZWxldGVJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtIGNocm9uaWNsZS1jb250ZXh0LWRlbGV0ZVwiKTtcbiAgICBkZWxldGVJdGVtLnNldFRleHQoXCJEZWxldGUgZXZlbnRcIik7XG4gICAgZGVsZXRlSXRlbS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgbWVudS5yZW1vdmUoKTtcbiAgICAgIGF3YWl0IHRoaXMuZXZlbnRNYW5hZ2VyLmRlbGV0ZShldmVudC5pZCk7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtZW51KTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBtZW51LnJlbW92ZSgpLCB7IG9uY2U6IHRydWUgfSksIDApO1xuICB9XG5cbiAgcHJpdmF0ZSBzaG93Q2FsQ29udGV4dE1lbnUoeDogbnVtYmVyLCB5OiBudW1iZXIsIGRhdGVTdHI6IHN0cmluZywgYWxsRGF5OiBib29sZWFuLCBob3VyID0gOSwgbWludXRlID0gMCkge1xuICAgIGNvbnN0IG1lbnUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG1lbnUuY2xhc3NOYW1lICAgID0gXCJjaHJvbmljbGUtY29udGV4dC1tZW51XCI7XG4gICAgbWVudS5zdHlsZS5sZWZ0ICAgPSBgJHt4fXB4YDtcbiAgICBtZW51LnN0eWxlLnRvcCAgICA9IGAke3l9cHhgO1xuXG4gICAgY29uc3QgYWRkSXRlbSA9IG1lbnUuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbnRleHQtaXRlbVwiKTtcbiAgICBhZGRJdGVtLnNldFRleHQoXCJOZXcgZXZlbnQgaGVyZVwiKTtcbiAgICBhZGRJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IG1lbnUucmVtb3ZlKCk7IHRoaXMub3Blbk5ld0V2ZW50TW9kYWwoZGF0ZVN0ciwgYWxsRGF5LCBob3VyLCBtaW51dGUpOyB9KTtcblxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobWVudSk7XG4gICAgc2V0VGltZW91dCgoKSA9PiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gbWVudS5yZW1vdmUoKSwgeyBvbmNlOiB0cnVlIH0pLCAwKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyRXZlbnRQaWxsVGltZWQoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZXZlbnQ6IENocm9uaWNsZUV2ZW50KSB7XG4gICAgY29uc3QgW3NoLCBzbV0gPSAoZXZlbnQuc3RhcnRUaW1lID8/IFwiMDk6MDBcIikuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpO1xuICAgIGNvbnN0IFtlaCwgZW1dID0gKGV2ZW50LmVuZFRpbWUgICA/PyBcIjEwOjAwXCIpLnNwbGl0KFwiOlwiKS5tYXAoTnVtYmVyKTtcbiAgICBjb25zdCB0b3AgICAgPSAoc2ggKyBzbSAvIDYwKSAqIEhPVVJfSEVJR0hUO1xuICAgIGNvbnN0IGhlaWdodCA9IE1hdGgubWF4KChlaCAtIHNoICsgKGVtIC0gc20pIC8gNjApICogSE9VUl9IRUlHSFQsIDIyKTtcbiAgICBjb25zdCBjYWwgICAgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGV2ZW50LmNhbGVuZGFySWQgPz8gXCJcIik7XG4gICAgY29uc3QgY29sb3IgID0gY2FsID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSA6IFwiIzM3OEFERFwiO1xuXG4gICAgY29uc3QgcGlsbCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZXZlbnQtcGlsbFwiKTtcbiAgICBwaWxsLnN0eWxlLnRvcCAgICAgICAgICAgICA9IGAke3RvcH1weGA7XG4gICAgcGlsbC5zdHlsZS5oZWlnaHQgICAgICAgICAgPSBgJHtoZWlnaHR9cHhgO1xuICAgIHBpbGwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IgKyBcIjMzXCI7XG4gICAgcGlsbC5zdHlsZS5ib3JkZXJMZWZ0ICAgICAgPSBgM3B4IHNvbGlkICR7Y29sb3J9YDtcbiAgICBwaWxsLnN0eWxlLmNvbG9yICAgICAgICAgICA9IGNvbG9yO1xuICAgIHBpbGwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWV2ZW50LXBpbGwtdGl0bGVcIikuc2V0VGV4dChldmVudC50aXRsZSk7XG4gICAgaWYgKGhlaWdodCA+IDM2ICYmIGV2ZW50LnN0YXJ0VGltZSlcbiAgICAgIHBpbGwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWV2ZW50LXBpbGwtdGltZVwiKS5zZXRUZXh0KHRoaXMuZm9ybWF0VGltZShldmVudC5zdGFydFRpbWUpKTtcblxuICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgbmV3IEV2ZW50TW9kYWwodGhpcy5hcHAsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlciwgZXZlbnQsICgpID0+IHRoaXMucmVuZGVyKCksIChlKSA9PiB0aGlzLm9wZW5FdmVudEZ1bGxQYWdlKGUpKS5vcGVuKCk7XG4gICAgfSk7XG5cbiAgICBwaWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHRoaXMuc2hvd0V2ZW50Q29udGV4dE1lbnUoZS5jbGllbnRYLCBlLmNsaWVudFksIGV2ZW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyRXZlbnRQaWxsQWxsRGF5KGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGV2ZW50OiBDaHJvbmljbGVFdmVudCkge1xuICAgIGNvbnN0IGNhbCAgID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChldmVudC5jYWxlbmRhcklkID8/IFwiXCIpO1xuICAgIGNvbnN0IGNvbG9yID0gY2FsID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSA6IFwiIzM3OEFERFwiO1xuICAgIGNvbnN0IHBpbGwgID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1ldmVudC1waWxsLWFsbGRheVwiKTtcbiAgICBwaWxsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yICsgXCIzM1wiO1xuICAgIHBpbGwuc3R5bGUuYm9yZGVyTGVmdCAgICAgID0gYDNweCBzb2xpZCAke2NvbG9yfWA7XG4gICAgcGlsbC5zdHlsZS5jb2xvciAgICAgICAgICAgPSBjb2xvcjtcbiAgICBwaWxsLnNldFRleHQoZXZlbnQudGl0bGUpO1xuICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+XG4gICAgICBuZXcgRXZlbnRNb2RhbCh0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCBldmVudCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGUpID0+IHRoaXMub3BlbkV2ZW50RnVsbFBhZ2UoZSkpLm9wZW4oKVxuICAgICk7XG5cbiAgICBwaWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHRoaXMuc2hvd0V2ZW50Q29udGV4dE1lbnUoZS5jbGllbnRYLCBlLmNsaWVudFksIGV2ZW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgaXNDYWxlbmRhclZpc2libGUoY2FsZW5kYXJJZD86IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICghY2FsZW5kYXJJZCkgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoY2FsZW5kYXJJZCk/LmlzVmlzaWJsZSA/PyB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBmb3JtYXRIb3VyKGg6IG51bWJlcik6IHN0cmluZyB7XG4gICAgaWYgKGggPT09IDApICByZXR1cm4gXCIxMiBBTVwiO1xuICAgIGlmIChoIDwgMTIpICAgcmV0dXJuIGAke2h9IEFNYDtcbiAgICBpZiAoaCA9PT0gMTIpIHJldHVybiBcIjEyIFBNXCI7XG4gICAgcmV0dXJuIGAke2ggLSAxMn0gUE1gO1xuICB9XG5cbiAgcHJpdmF0ZSBmb3JtYXRUaW1lKHRpbWVTdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgW2gsIG1dID0gdGltZVN0ci5zcGxpdChcIjpcIikubWFwKE51bWJlcik7XG4gICAgcmV0dXJuIGAke2ggJSAxMiB8fCAxMn06JHtTdHJpbmcobSkucGFkU3RhcnQoMixcIjBcIil9ICR7aCA+PSAxMiA/IFwiUE1cIiA6IFwiQU1cIn1gO1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgTW9kYWwgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0V2ZW50TWFuYWdlclwiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVFdmVudCwgQWxlcnRPZmZzZXQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIEV2ZW50TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXI7XG4gIHByaXZhdGUgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXI7XG4gIHByaXZhdGUgZWRpdGluZ0V2ZW50OiBDaHJvbmljbGVFdmVudCB8IG51bGw7XG4gIHByaXZhdGUgb25TYXZlPzogKCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBvbkV4cGFuZD86IChldmVudD86IENocm9uaWNsZUV2ZW50KSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyLFxuICAgIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyLFxuICAgIGVkaXRpbmdFdmVudD86IENocm9uaWNsZUV2ZW50LFxuICAgIG9uU2F2ZT86ICgpID0+IHZvaWQsXG4gICAgb25FeHBhbmQ/OiAoZXZlbnQ/OiBDaHJvbmljbGVFdmVudCkgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuZXZlbnRNYW5hZ2VyICAgID0gZXZlbnRNYW5hZ2VyO1xuICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyID0gY2FsZW5kYXJNYW5hZ2VyO1xuICAgIHRoaXMuZWRpdGluZ0V2ZW50ICAgID0gZWRpdGluZ0V2ZW50ID8/IG51bGw7XG4gICAgdGhpcy5vblNhdmUgICAgICAgICAgPSBvblNhdmU7XG4gICAgdGhpcy5vbkV4cGFuZCAgICAgICAgPSBvbkV4cGFuZDtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJjaHJvbmljbGUtZXZlbnQtbW9kYWxcIik7XG5cbiAgICBjb25zdCBlID0gdGhpcy5lZGl0aW5nRXZlbnQ7XG4gICAgY29uc3QgY2FsZW5kYXJzID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZW0taGVhZGVyXCIpO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZW0tdGl0bGVcIikuc2V0VGV4dChlID8gXCJFZGl0IGV2ZW50XCIgOiBcIk5ldyBldmVudFwiKTtcblxuICAgIGNvbnN0IGV4cGFuZEJ0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tZ2hvc3QgY2VtLWV4cGFuZC1idG5cIiB9KTtcbiAgICBleHBhbmRCdG4udGl0bGUgPSBcIk9wZW4gYXMgZnVsbCBwYWdlXCI7XG4gICAgZXhwYW5kQnRuLmlubmVySFRNTCA9IGA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIj48cG9seWxpbmUgcG9pbnRzPVwiMTUgMyAyMSAzIDIxIDlcIi8+PHBvbHlsaW5lIHBvaW50cz1cIjkgMjEgMyAyMSAzIDE1XCIvPjxsaW5lIHgxPVwiMjFcIiB5MT1cIjNcIiB4Mj1cIjE0XCIgeTI9XCIxMFwiLz48bGluZSB4MT1cIjNcIiB5MT1cIjIxXCIgeDI9XCIxMFwiIHkyPVwiMTRcIi8+PC9zdmc+YDtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBGb3JtIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGZvcm0gPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWZvcm1cIik7XG5cbiAgICAvLyBUaXRsZVxuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aGlzLmNlbUZpZWxkKGZvcm0sIFwiVGl0bGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLXRpdGxlLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIkV2ZW50IG5hbWVcIlxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSBlPy50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIExvY2F0aW9uXG4gICAgY29uc3QgbG9jYXRpb25JbnB1dCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJMb2NhdGlvblwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIGxvY2F0aW9uXCJcbiAgICB9KTtcbiAgICBsb2NhdGlvbklucHV0LnZhbHVlID0gZT8ubG9jYXRpb24gPz8gXCJcIjtcblxuICAgIC8vIEFsbCBkYXkgdG9nZ2xlXG4gICAgY29uc3QgYWxsRGF5RmllbGQgPSB0aGlzLmNlbUZpZWxkKGZvcm0sIFwiQWxsIGRheVwiKTtcbiAgICBjb25zdCBhbGxEYXlXcmFwID0gYWxsRGF5RmllbGQuY3JlYXRlRGl2KFwiY2VtLXRvZ2dsZS13cmFwXCIpO1xuICAgIGNvbnN0IGFsbERheVRvZ2dsZSA9IGFsbERheVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiwgY2xzOiBcImNlbS10b2dnbGVcIiB9KTtcbiAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA9IGU/LmFsbERheSA/PyBmYWxzZTtcbiAgICBjb25zdCBhbGxEYXlMYWJlbCA9IGFsbERheVdyYXAuY3JlYXRlU3Bhbih7IGNsczogXCJjZW0tdG9nZ2xlLWxhYmVsXCIsIHRleHQ6IGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJZZXNcIiA6IFwiTm9cIiB9KTtcbiAgICBhbGxEYXlUb2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBhbGxEYXlMYWJlbC5zZXRUZXh0KGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJZZXNcIiA6IFwiTm9cIik7XG4gICAgICB0aW1lRmllbGRzLnN0eWxlLmRpc3BsYXkgPSBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwibm9uZVwiIDogXCJcIjtcbiAgICB9KTtcblxuICAgIC8vIFN0YXJ0IGRhdGUgKyB0aW1lXG4gICAgY29uc3Qgc3RhcnRSb3cgPSBmb3JtLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcbiAgICBjb25zdCBzdGFydERhdGVJbnB1dCA9IHRoaXMuY2VtRmllbGQoc3RhcnRSb3csIFwiU3RhcnQgZGF0ZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0RGF0ZUlucHV0LnZhbHVlID0gZT8uc3RhcnREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBjb25zdCB0aW1lRmllbGRzID0gZm9ybS5jcmVhdGVEaXYoXCJjZW0tdGltZS1maWVsZHNcIik7XG4gICAgdGltZUZpZWxkcy5zdHlsZS5kaXNwbGF5ID0gYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIm5vbmVcIiA6IFwiXCI7XG5cbiAgICBjb25zdCBzdGFydFRpbWVSb3cgPSB0aW1lRmllbGRzLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcbiAgICBjb25zdCBzdGFydFRpbWVJbnB1dCA9IHRoaXMuY2VtRmllbGQoc3RhcnRUaW1lUm93LCBcIlN0YXJ0IHRpbWVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRpbWVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBzdGFydFRpbWVJbnB1dC52YWx1ZSA9IGU/LnN0YXJ0VGltZSA/PyBcIjA5OjAwXCI7XG5cbiAgICBjb25zdCBlbmRUaW1lSW5wdXQgPSB0aGlzLmNlbUZpZWxkKHN0YXJ0VGltZVJvdywgXCJFbmQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGVuZFRpbWVJbnB1dC52YWx1ZSA9IGU/LmVuZFRpbWUgPz8gXCIxMDowMFwiO1xuXG4gICAgLy8gRW5kIGRhdGVcbiAgICBjb25zdCBlbmREYXRlSW5wdXQgPSB0aGlzLmNlbUZpZWxkKHN0YXJ0Um93LCBcIkVuZCBkYXRlXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJkYXRlXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgZW5kRGF0ZUlucHV0LnZhbHVlID0gZT8uZW5kRGF0ZSA/PyBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgLy8gQXV0by1hZHZhbmNlIGVuZCBkYXRlIHdoZW4gc3RhcnQgY2hhbmdlc1xuICAgIHN0YXJ0RGF0ZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgaWYgKCFlbmREYXRlSW5wdXQudmFsdWUgfHwgZW5kRGF0ZUlucHV0LnZhbHVlIDwgc3RhcnREYXRlSW5wdXQudmFsdWUpIHtcbiAgICAgICAgZW5kRGF0ZUlucHV0LnZhbHVlID0gc3RhcnREYXRlSW5wdXQudmFsdWU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBSZXBlYXRcbiAgICBjb25zdCByZWNTZWxlY3QgPSB0aGlzLmNlbUZpZWxkKGZvcm0sIFwiUmVwZWF0XCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHJlY3VycmVuY2VzID0gW1xuICAgICAgeyB2YWx1ZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIk5ldmVyXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1EQUlMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSBkYXlcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IHdlZWtcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPU1PTlRITFlcIiwgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IG1vbnRoXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1ZRUFSTFlcIiwgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSB5ZWFyXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1XRUVLTFk7QllEQVk9TU8sVFUsV0UsVEgsRlJcIiwgIGxhYmVsOiBcIldlZWtkYXlzXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgciBvZiByZWN1cnJlbmNlcykge1xuICAgICAgY29uc3Qgb3B0ID0gcmVjU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHIudmFsdWUsIHRleHQ6IHIubGFiZWwgfSk7XG4gICAgICBpZiAoZT8ucmVjdXJyZW5jZSA9PT0gci52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBDYWxlbmRhclxuICAgIGNvbnN0IGNhbFNlbGVjdCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJDYWxlbmRhclwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogXCJcIiwgdGV4dDogXCJOb25lXCIgfSk7XG4gICAgZm9yIChjb25zdCBjYWwgb2YgY2FsZW5kYXJzKSB7XG4gICAgICBjb25zdCBvcHQgPSBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogY2FsLmlkLCB0ZXh0OiBjYWwubmFtZSB9KTtcbiAgICAgIGlmIChlPy5jYWxlbmRhcklkID09PSBjYWwuaWQpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuICAgIGNvbnN0IHVwZGF0ZUNhbENvbG9yID0gKCkgPT4ge1xuICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChjYWxTZWxlY3QudmFsdWUpO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRDb2xvciA9IGNhbCA/IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcikgOiBcInRyYW5zcGFyZW50XCI7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdFdpZHRoID0gXCI0cHhcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0U3R5bGUgPSBcInNvbGlkXCI7XG4gICAgfTtcbiAgICBjYWxTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB1cGRhdGVDYWxDb2xvcik7XG4gICAgdXBkYXRlQ2FsQ29sb3IoKTtcblxuICAgIC8vIEFsZXJ0XG4gICAgY29uc3QgYWxlcnRTZWxlY3QgPSB0aGlzLmNlbUZpZWxkKGZvcm0sIFwiQWxlcnRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgYWxlcnRzOiB7IHZhbHVlOiBBbGVydE9mZnNldDsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcIm5vbmVcIiwgICAgbGFiZWw6IFwiTm9uZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImF0LXRpbWVcIiwgbGFiZWw6IFwiQXQgdGltZSBvZiBldmVudFwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjVtaW5cIiwgICAgbGFiZWw6IFwiNSBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjEwbWluXCIsICAgbGFiZWw6IFwiMTAgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxNW1pblwiLCAgIGxhYmVsOiBcIjE1IG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMzBtaW5cIiwgICBsYWJlbDogXCIzMCBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjFob3VyXCIsICAgbGFiZWw6IFwiMSBob3VyIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJob3Vyc1wiLCAgbGFiZWw6IFwiMiBob3VycyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxZGF5XCIsICAgIGxhYmVsOiBcIjEgZGF5IGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJkYXlzXCIsICAgbGFiZWw6IFwiMiBkYXlzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjF3ZWVrXCIsICAgbGFiZWw6IFwiMSB3ZWVrIGJlZm9yZVwiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IGEgb2YgYWxlcnRzKSB7XG4gICAgICBjb25zdCBvcHQgPSBhbGVydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBhLnZhbHVlLCB0ZXh0OiBhLmxhYmVsIH0pO1xuICAgICAgaWYgKGU/LmFsZXJ0ID09PSBhLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIE5vdGVzXG4gICAgY29uc3Qgbm90ZXNJbnB1dCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJOb3Rlc1wiKS5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJjZi10ZXh0YXJlYVwiLCBwbGFjZWhvbGRlcjogXCJBZGQgbm90ZXMuLi5cIlxuICAgIH0pO1xuICAgIG5vdGVzSW5wdXQudmFsdWUgPSBlPy5ub3RlcyA/PyBcIlwiO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEZvb3RlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb290ZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWZvb3RlclwiKTtcbiAgICBjb25zdCBjYW5jZWxCdG4gPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWdob3N0XCIsIHRleHQ6IFwiQ2FuY2VsXCIgfSk7XG5cbiAgICBpZiAoZSAmJiBlLmlkKSB7XG4gICAgICBjb25zdCBkZWxldGVCdG4gPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWRlbGV0ZVwiLCB0ZXh0OiBcIkRlbGV0ZSBldmVudFwiIH0pO1xuICAgICAgZGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXZlbnRNYW5hZ2VyLmRlbGV0ZShlLmlkKTtcbiAgICAgICAgdGhpcy5vblNhdmU/LigpO1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBzYXZlQnRuID0gZm9vdGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1wcmltYXJ5XCIsIHRleHQ6IGUgJiYgZS5pZCA/IFwiU2F2ZVwiIDogXCJBZGQgZXZlbnRcIiB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIYW5kbGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuY2xvc2UoKSk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSB0aXRsZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHsgdGl0bGVJbnB1dC5mb2N1cygpOyB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTsgcmV0dXJuOyB9XG5cbiAgICAgIGNvbnN0IGV2ZW50RGF0YSA9IHtcbiAgICAgICAgdGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICBsb2NhdGlvbklucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxsRGF5OiAgICAgIGFsbERheVRvZ2dsZS5jaGVja2VkLFxuICAgICAgICBzdGFydERhdGU6ICAgc3RhcnREYXRlSW5wdXQudmFsdWUsXG4gICAgICAgIHN0YXJ0VGltZTogICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IHVuZGVmaW5lZCA6IHN0YXJ0VGltZUlucHV0LnZhbHVlLFxuICAgICAgICBlbmREYXRlOiAgICAgZW5kRGF0ZUlucHV0LnZhbHVlIHx8IHN0YXJ0RGF0ZUlucHV0LnZhbHVlLFxuICAgICAgICBlbmRUaW1lOiAgICAgYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyB1bmRlZmluZWQgOiBlbmRUaW1lSW5wdXQudmFsdWUsXG4gICAgICAgIHJlY3VycmVuY2U6ICByZWNTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBjYWxlbmRhcklkOiAgY2FsU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgIGFsZXJ0U2VsZWN0LnZhbHVlIGFzIEFsZXJ0T2Zmc2V0LFxuICAgICAgICBub3RlczogICAgICAgbm90ZXNJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGxpbmtlZFRhc2tJZHM6IGU/LmxpbmtlZFRhc2tJZHMgPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogZT8uY29tcGxldGVkSW5zdGFuY2VzID8/IFtdLFxuICAgICAgfTtcblxuICAgICAgaWYgKGUgJiYgZS5pZCkge1xuICAgICAgICBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci51cGRhdGUoeyAuLi5lLCAuLi5ldmVudERhdGEgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci5jcmVhdGUoZXZlbnREYXRhKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5vblNhdmU/LigpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH07XG5cbiAgICBzYXZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoYW5kbGVTYXZlKTtcbiAgICBleHBhbmRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIHRoaXMub25FeHBhbmQ/LihlID8/IHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICB0aXRsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChlKSA9PiB7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIikgaGFuZGxlU2F2ZSgpO1xuICAgICAgaWYgKGUua2V5ID09PSBcIkVzY2FwZVwiKSB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbkNsb3NlKCkge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBwcml2YXRlIGNlbUZpZWxkKHBhcmVudDogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3Qgd3JhcCA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZi1maWVsZFwiKTtcbiAgICB3cmFwLmNyZWF0ZURpdihcImNmLWxhYmVsXCIpLnNldFRleHQobGFiZWwpO1xuICAgIHJldHVybiB3cmFwO1xuICB9XG59Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUNBQSxzQkFBd0M7OztBQ0VqQyxJQUFNLGtCQUFOLE1BQXNCO0FBQUEsRUFJM0IsWUFBWSxXQUFnQyxVQUFzQjtBQUNoRSxTQUFLLFlBQVk7QUFDakIsU0FBSyxXQUFXO0FBQUEsRUFDbEI7QUFBQSxFQUVBLFNBQThCO0FBQzVCLFdBQU8sQ0FBQyxHQUFHLEtBQUssU0FBUztBQUFBLEVBQzNCO0FBQUEsRUFFQSxRQUFRLElBQTJDO0FBQ2pELFdBQU8sS0FBSyxVQUFVLEtBQUssQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFO0FBQUEsRUFDL0M7QUFBQSxFQUVB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QVUsV0FBVyxJQUFJO0FBQUEsRUFDM0I7QUFBQSxFQUVBLGVBQWUsT0FBd0I7QUFDckMsUUFBSTtBQUFBLE1BQ0YsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQSxDQUFDLE1BQU0sS0FBSyxrQkFBa0IsQ0FBQztBQUFBLElBQ2pDLEVBQUUsS0FBSztBQUFBLEVBQ1Q7QUFBQSxFQUVBLFdBQVc7QUFDVCxTQUFLLElBQUksVUFBVSxtQkFBbUIsY0FBYztBQUNwRCxTQUFLLElBQUksVUFBVSxtQkFBbUIsbUJBQW1CO0FBQ3pELFNBQUssSUFBSSxVQUFVLG1CQUFtQixrQkFBa0I7QUFDeEQsU0FBSyxJQUFJLFVBQVUsbUJBQW1CLG9CQUFvQjtBQUFBLEVBQzVEO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDbkIsU0FBSyxXQUFXLE9BQU8sT0FBTyxDQUFDLEdBQUcsa0JBQWtCLE1BQU0sS0FBSyxTQUFTLENBQUM7QUFBQSxFQUMzRTtBQUFBLEVBRUEsTUFBTSxlQUFlO0FBQ25CLFVBQU0sS0FBSyxTQUFTLEtBQUssUUFBUTtBQUFBLEVBQ25DO0FBQUEsRUFFQSxNQUFNLGtCQUFrQixPQUF3QjtBQUM5QyxVQUFNLEVBQUUsVUFBVSxJQUFJLEtBQUs7QUFDM0IsVUFBTSxXQUFXLFVBQVUsZ0JBQWdCLG9CQUFvQixFQUFFLENBQUM7QUFDbEUsUUFBSSxTQUFVLFVBQVMsT0FBTztBQUM5QixVQUFNLE9BQU8sVUFBVSxRQUFRLEtBQUs7QUFDcEMsVUFBTSxLQUFLLGFBQWEsRUFBRSxNQUFNLHNCQUFzQixRQUFRLEtBQUssQ0FBQztBQUNwRSxjQUFVLFdBQVcsSUFBSTtBQUV6QixVQUFNLElBQUksUUFBUSxhQUFXLFdBQVcsU0FBUyxHQUFHLENBQUM7QUFDckQsVUFBTSxXQUFXLFVBQVUsZ0JBQWdCLG9CQUFvQixFQUFFLENBQUM7QUFDbEUsVUFBTSxXQUFXLHFDQUFVO0FBQzNCLFFBQUksWUFBWSxNQUFPLFVBQVMsVUFBVSxLQUFLO0FBQUEsRUFDakQ7QUFDRjsiLAogICJuYW1lcyI6IFsiX2EiLCAiX2IiLCAiX2MiLCAiZSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiX2IiLCAiX2MiLCAiX2QiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJfYiIsICJfYyIsICJfZCIsICJ0IiwgInQiLCAiZ3JvdXBzIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiX2IiLCAiX2MiLCAiZSIsICJlIl0KfQo=
