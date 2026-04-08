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
var import_obsidian3 = require("obsidian");

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

// src/main.ts
var ChroniclePlugin = class extends import_obsidian3.Plugin {
  async onload() {
    await this.loadSettings();
    this.calendarManager = new CalendarManager(
      this.settings.calendars,
      () => this.saveSettings()
    );
    this.taskManager = new TaskManager(this.app, this.settings.tasksFolder);
    this.eventManager = new EventManager(this.app, this.settings.eventsFolder);
    console.log("Chronicle loaded \u2713");
  }
  onunload() {
    console.log("Chronicle unloaded");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3R5cGVzL2luZGV4LnRzIiwgInNyYy9kYXRhL0NhbGVuZGFyTWFuYWdlci50cyIsICJzcmMvZGF0YS9UYXNrTWFuYWdlci50cyIsICJzcmMvZGF0YS9FdmVudE1hbmFnZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlU2V0dGluZ3MsIERFRkFVTFRfU0VUVElOR1MgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IFRhc2tNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9UYXNrTWFuYWdlclwiO1xuaW1wb3J0IHsgRXZlbnRNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9FdmVudE1hbmFnZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2hyb25pY2xlUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3M6IENocm9uaWNsZVNldHRpbmdzO1xuICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyO1xuICBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcjtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcblxuICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyID0gbmV3IENhbGVuZGFyTWFuYWdlcihcbiAgICAgIHRoaXMuc2V0dGluZ3MuY2FsZW5kYXJzLFxuICAgICAgKCkgPT4gdGhpcy5zYXZlU2V0dGluZ3MoKVxuICAgICk7XG5cbiAgICB0aGlzLnRhc2tNYW5hZ2VyID0gbmV3IFRhc2tNYW5hZ2VyKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLnRhc2tzRm9sZGVyKTtcbiAgICB0aGlzLmV2ZW50TWFuYWdlciA9IG5ldyBFdmVudE1hbmFnZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MuZXZlbnRzRm9sZGVyKTtcblxuICAgIGNvbnNvbGUubG9nKFwiQ2hyb25pY2xlIGxvYWRlZCBcdTI3MTNcIik7XG4gIH1cblxuICBvbnVubG9hZCgpIHtcbiAgICBjb25zb2xlLmxvZyhcIkNocm9uaWNsZSB1bmxvYWRlZFwiKTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG59IiwgIi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDYWxlbmRhcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIENhbGVuZGFyQ29sb3IgPVxuICB8IFwiYmx1ZVwiIHwgXCJncmVlblwiIHwgXCJwdXJwbGVcIiB8IFwib3JhbmdlXCJcbiAgfCBcInJlZFwiIHwgXCJ0ZWFsXCIgfCBcInBpbmtcIiB8IFwieWVsbG93XCIgfCBcImdyYXlcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVDYWxlbmRhciB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgY29sb3I6IENhbGVuZGFyQ29sb3I7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBpc1Zpc2libGU6IGJvb2xlYW47XG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgVGFza3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIFRhc2tTdGF0dXMgPSBcInRvZG9cIiB8IFwiaW4tcHJvZ3Jlc3NcIiB8IFwiZG9uZVwiIHwgXCJjYW5jZWxsZWRcIjtcbmV4cG9ydCB0eXBlIFRhc2tQcmlvcml0eSA9IFwibm9uZVwiIHwgXCJsb3dcIiB8IFwibWVkaXVtXCIgfCBcImhpZ2hcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUaW1lRW50cnkge1xuICBzdGFydFRpbWU6IHN0cmluZzsgICAvLyBJU08gODYwMVxuICBlbmRUaW1lPzogc3RyaW5nOyAgICAvLyBJU08gODYwMVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEN1c3RvbUZpZWxkIHtcbiAga2V5OiBzdHJpbmc7XG4gIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENocm9uaWNsZVRhc2sge1xuICAvLyAtLS0gQ29yZSAtLS1cbiAgaWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgc3RhdHVzOiBUYXNrU3RhdHVzO1xuICBwcmlvcml0eTogVGFza1ByaW9yaXR5O1xuXG4gIC8vIC0tLSBTY2hlZHVsaW5nIC0tLVxuICBkdWVEYXRlPzogc3RyaW5nOyAgICAgICAvLyBZWVlZLU1NLUREXG4gIGR1ZVRpbWU/OiBzdHJpbmc7ICAgICAgIC8vIEhIOm1tXG4gIHJlY3VycmVuY2U/OiBzdHJpbmc7ICAgIC8vIFJSVUxFIHN0cmluZyBlLmcuIFwiRlJFUT1XRUVLTFk7QllEQVk9TU9cIlxuXG4gIC8vIC0tLSBPcmdhbmlzYXRpb24gLS0tXG4gIGNhbGVuZGFySWQ/OiBzdHJpbmc7ICAgIC8vIGxpbmtzIHRvIGEgQ2hyb25pY2xlQ2FsZW5kYXJcbiAgdGFnczogc3RyaW5nW107XG4gIGNvbnRleHRzOiBzdHJpbmdbXTsgICAgIC8vIGUuZy4gW1wiQGhvbWVcIiwgXCJAd29ya1wiXVxuICBsaW5rZWROb3Rlczogc3RyaW5nW107ICAvLyB3aWtpbGluayBwYXRocyBlLmcuIFtcIlByb2plY3RzL1dlYnNpdGVcIl1cbiAgcHJvamVjdHM6IHN0cmluZ1tdO1xuXG4gIC8vIC0tLSBUaW1lIHRyYWNraW5nIC0tLVxuICB0aW1lRXN0aW1hdGU/OiBudW1iZXI7ICAvLyBtaW51dGVzXG4gIHRpbWVFbnRyaWVzOiBUaW1lRW50cnlbXTtcblxuICAvLyAtLS0gQ3VzdG9tIC0tLVxuICBjdXN0b21GaWVsZHM6IEN1c3RvbUZpZWxkW107XG5cbiAgLy8gLS0tIFJlY3VycmVuY2UgY29tcGxldGlvbiAtLS1cbiAgY29tcGxldGVkSW5zdGFuY2VzOiBzdHJpbmdbXTsgLy8gWVlZWS1NTS1ERCBkYXRlc1xuXG4gIC8vIC0tLSBNZXRhIC0tLVxuICBjcmVhdGVkQXQ6IHN0cmluZzsgICAgICAvLyBJU08gODYwMVxuICBjb21wbGV0ZWRBdD86IHN0cmluZzsgICAvLyBJU08gODYwMVxuICBub3Rlcz86IHN0cmluZzsgICAgICAgICAvLyBib2R5IGNvbnRlbnQgb2YgdGhlIG5vdGVcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIEV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IHR5cGUgQWxlcnRPZmZzZXQgPVxuICB8IFwibm9uZVwiXG4gIHwgXCJhdC10aW1lXCJcbiAgfCBcIjVtaW5cIiB8IFwiMTBtaW5cIiB8IFwiMTVtaW5cIiB8IFwiMzBtaW5cIlxuICB8IFwiMWhvdXJcIiB8IFwiMmhvdXJzXCJcbiAgfCBcIjFkYXlcIiB8IFwiMmRheXNcIiB8IFwiMXdlZWtcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVFdmVudCB7XG4gIC8vIC0tLSBDb3JlIChpbiBmb3JtIG9yZGVyKSAtLS1cbiAgaWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgbG9jYXRpb24/OiBzdHJpbmc7XG4gIGFsbERheTogYm9vbGVhbjtcbiAgc3RhcnREYXRlOiBzdHJpbmc7ICAgICAgLy8gWVlZWS1NTS1ERFxuICBzdGFydFRpbWU/OiBzdHJpbmc7ICAgICAvLyBISDptbSAgKHVuZGVmaW5lZCB3aGVuIGFsbERheSlcbiAgZW5kRGF0ZTogc3RyaW5nOyAgICAgICAgLy8gWVlZWS1NTS1ERFxuICBlbmRUaW1lPzogc3RyaW5nOyAgICAgICAvLyBISDptbSAgKHVuZGVmaW5lZCB3aGVuIGFsbERheSlcbiAgcmVjdXJyZW5jZT86IHN0cmluZzsgICAgLy8gUlJVTEUgc3RyaW5nXG4gIGNhbGVuZGFySWQ/OiBzdHJpbmc7ICAgIC8vIGxpbmtzIHRvIGEgQ2hyb25pY2xlQ2FsZW5kYXJcbiAgYWxlcnQ6IEFsZXJ0T2Zmc2V0O1xuICBub3Rlcz86IHN0cmluZzsgICAgICAgICAvLyBib2R5IGNvbnRlbnQgb2YgdGhlIG5vdGVcblxuICAvLyAtLS0gQ29ubmVjdGlvbnMgLS0tXG4gIGxpbmtlZFRhc2tJZHM6IHN0cmluZ1tdOyAgIC8vIENocm9uaWNsZSB0YXNrIElEc1xuXG4gIC8vIC0tLSBNZXRhIC0tLVxuICBjcmVhdGVkQXQ6IHN0cmluZztcbiAgY29tcGxldGVkSW5zdGFuY2VzOiBzdHJpbmdbXTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFBsdWdpbiBzZXR0aW5ncyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVTZXR0aW5ncyB7XG4gIC8vIEZvbGRlciBwYXRoc1xuICB0YXNrc0ZvbGRlcjogc3RyaW5nO1xuICBldmVudHNGb2xkZXI6IHN0cmluZztcblxuICAvLyBDYWxlbmRhcnMgKHN0b3JlZCBpbiBzZXR0aW5ncywgbm90IGFzIGZpbGVzKVxuICBjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW107XG4gIGRlZmF1bHRDYWxlbmRhcklkOiBzdHJpbmc7XG5cbiAgLy8gRGVmYXVsdHNcbiAgZGVmYXVsdFRhc2tTdGF0dXM6IFRhc2tTdGF0dXM7XG4gIGRlZmF1bHRUYXNrUHJpb3JpdHk6IFRhc2tQcmlvcml0eTtcbiAgZGVmYXVsdEFsZXJ0OiBBbGVydE9mZnNldDtcblxuICAvLyBEaXNwbGF5XG4gIHN0YXJ0T2ZXZWVrOiAwIHwgMSB8IDY7ICAvLyAwPVN1biwgMT1Nb24sIDY9U2F0XG4gIHRpbWVGb3JtYXQ6IFwiMTJoXCIgfCBcIjI0aFwiO1xuICBkZWZhdWx0Q2FsZW5kYXJWaWV3OiBcImRheVwiIHwgXCJ3ZWVrXCIgfCBcIm1vbnRoXCIgfCBcInllYXJcIjtcblxuICAvLyBTbWFydCBsaXN0cyB2aXNpYmlsaXR5XG4gIHNob3dUb2RheUNvdW50OiBib29sZWFuO1xuICBzaG93U2NoZWR1bGVkQ291bnQ6IGJvb2xlYW47XG4gIHNob3dGbGFnZ2VkQ291bnQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBDaHJvbmljbGVTZXR0aW5ncyA9IHtcbiAgdGFza3NGb2xkZXI6IFwiQ2hyb25pY2xlL1Rhc2tzXCIsXG4gIGV2ZW50c0ZvbGRlcjogXCJDaHJvbmljbGUvRXZlbnRzXCIsXG4gIGNhbGVuZGFyczogW1xuICAgIHsgaWQ6IFwicGVyc29uYWxcIiwgbmFtZTogXCJQZXJzb25hbFwiLCBjb2xvcjogXCJibHVlXCIsICAgaXNWaXNpYmxlOiB0cnVlLCBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9LFxuICAgIHsgaWQ6IFwid29ya1wiLCAgICAgbmFtZTogXCJXb3JrXCIsICAgICBjb2xvcjogXCJncmVlblwiLCAgaXNWaXNpYmxlOiB0cnVlLCBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9LFxuICBdLFxuICBkZWZhdWx0Q2FsZW5kYXJJZDogXCJwZXJzb25hbFwiLFxuICBkZWZhdWx0VGFza1N0YXR1czogXCJ0b2RvXCIsXG4gIGRlZmF1bHRUYXNrUHJpb3JpdHk6IFwibm9uZVwiLFxuICBkZWZhdWx0QWxlcnQ6IFwibm9uZVwiLFxuICBzdGFydE9mV2VlazogMCxcbiAgdGltZUZvcm1hdDogXCIxMmhcIixcbiAgZGVmYXVsdENhbGVuZGFyVmlldzogXCJ3ZWVrXCIsXG4gIHNob3dUb2RheUNvdW50OiB0cnVlLFxuICBzaG93U2NoZWR1bGVkQ291bnQ6IHRydWUsXG4gIHNob3dGbGFnZ2VkQ291bnQ6IHRydWUsXG59OyIsICJpbXBvcnQgeyBDaHJvbmljbGVDYWxlbmRhciwgQ2FsZW5kYXJDb2xvciB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgQ2FsZW5kYXJNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW107XG4gIHByaXZhdGUgb25VcGRhdGU6ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoY2FsZW5kYXJzOiBDaHJvbmljbGVDYWxlbmRhcltdLCBvblVwZGF0ZTogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuY2FsZW5kYXJzID0gY2FsZW5kYXJzO1xuICAgIHRoaXMub25VcGRhdGUgPSBvblVwZGF0ZTtcbiAgfVxuXG4gIGdldEFsbCgpOiBDaHJvbmljbGVDYWxlbmRhcltdIHtcbiAgICByZXR1cm4gWy4uLnRoaXMuY2FsZW5kYXJzXTtcbiAgfVxuXG4gIGdldEJ5SWQoaWQ6IHN0cmluZyk6IENocm9uaWNsZUNhbGVuZGFyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jYWxlbmRhcnMuZmluZCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICB9XG5cbiAgY3JlYXRlKG5hbWU6IHN0cmluZywgY29sb3I6IENhbGVuZGFyQ29sb3IpOiBDaHJvbmljbGVDYWxlbmRhciB7XG4gICAgY29uc3QgY2FsZW5kYXI6IENocm9uaWNsZUNhbGVuZGFyID0ge1xuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZChuYW1lKSxcbiAgICAgIG5hbWUsXG4gICAgICBjb2xvcixcbiAgICAgIGlzVmlzaWJsZTogdHJ1ZSxcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG4gICAgdGhpcy5jYWxlbmRhcnMucHVzaChjYWxlbmRhcik7XG4gICAgdGhpcy5vblVwZGF0ZSgpO1xuICAgIHJldHVybiBjYWxlbmRhcjtcbiAgfVxuXG4gIHVwZGF0ZShpZDogc3RyaW5nLCBjaGFuZ2VzOiBQYXJ0aWFsPENocm9uaWNsZUNhbGVuZGFyPik6IHZvaWQge1xuICAgIGNvbnN0IGlkeCA9IHRoaXMuY2FsZW5kYXJzLmZpbmRJbmRleCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICAgIGlmIChpZHggPT09IC0xKSByZXR1cm47XG4gICAgdGhpcy5jYWxlbmRhcnNbaWR4XSA9IHsgLi4udGhpcy5jYWxlbmRhcnNbaWR4XSwgLi4uY2hhbmdlcyB9O1xuICAgIHRoaXMub25VcGRhdGUoKTtcbiAgfVxuXG4gIGRlbGV0ZShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5jYWxlbmRhcnMgPSB0aGlzLmNhbGVuZGFycy5maWx0ZXIoKGMpID0+IGMuaWQgIT09IGlkKTtcbiAgICB0aGlzLm9uVXBkYXRlKCk7XG4gIH1cblxuICB0b2dnbGVWaXNpYmlsaXR5KGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFycy5maW5kKChjKSA9PiBjLmlkID09PSBpZCk7XG4gICAgaWYgKGNhbCkge1xuICAgICAgY2FsLmlzVmlzaWJsZSA9ICFjYWwuaXNWaXNpYmxlO1xuICAgICAgdGhpcy5vblVwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldHVybnMgQ1NTIGhleCBjb2xvciBmb3IgYSBDYWxlbmRhckNvbG9yIG5hbWVcbiAgc3RhdGljIGNvbG9yVG9IZXgoY29sb3I6IENhbGVuZGFyQ29sb3IpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1hcDogUmVjb3JkPENhbGVuZGFyQ29sb3IsIHN0cmluZz4gPSB7XG4gICAgICBibHVlOiAgIFwiIzM3OEFERFwiLFxuICAgICAgZ3JlZW46ICBcIiMzNEM3NTlcIixcbiAgICAgIHB1cnBsZTogXCIjQUY1MkRFXCIsXG4gICAgICBvcmFuZ2U6IFwiI0ZGOTUwMFwiLFxuICAgICAgcmVkOiAgICBcIiNGRjNCMzBcIixcbiAgICAgIHRlYWw6ICAgXCIjMzBCMEM3XCIsXG4gICAgICBwaW5rOiAgIFwiI0ZGMkQ1NVwiLFxuICAgICAgeWVsbG93OiBcIiNGRkQ2MEFcIixcbiAgICAgIGdyYXk6ICAgXCIjOEU4RTkzXCIsXG4gICAgfTtcbiAgICByZXR1cm4gbWFwW2NvbG9yXTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVJZChuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJhc2UgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCBcIi1cIikucmVwbGFjZSgvW15hLXowLTktXS9nLCBcIlwiKTtcbiAgICBjb25zdCBzdWZmaXggPSBEYXRlLm5vdygpLnRvU3RyaW5nKDM2KTtcbiAgICByZXR1cm4gYCR7YmFzZX0tJHtzdWZmaXh9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIFRGaWxlLCBub3JtYWxpemVQYXRoIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVUYXNrLCBUYXNrU3RhdHVzLCBUYXNrUHJpb3JpdHkgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIFRhc2tNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCwgcHJpdmF0ZSB0YXNrc0ZvbGRlcjogc3RyaW5nKSB7fVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBSZWFkIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIGFzeW5jIGdldEFsbCgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgdGFza3M6IENocm9uaWNsZVRhc2tbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSAmJiBjaGlsZC5leHRlbnNpb24gPT09IFwibWRcIikge1xuICAgICAgICBjb25zdCB0YXNrID0gYXdhaXQgdGhpcy5maWxlVG9UYXNrKGNoaWxkKTtcbiAgICAgICAgaWYgKHRhc2spIHRhc2tzLnB1c2godGFzayk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXNrcztcbiAgfVxuXG4gIGFzeW5jIGdldEJ5SWQoaWQ6IHN0cmluZyk6IFByb21pc2U8Q2hyb25pY2xlVGFzayB8IG51bGw+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmluZCgodCkgPT4gdC5pZCA9PT0gaWQpID8/IG51bGw7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgV3JpdGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgY3JlYXRlKHRhc2s6IE9taXQ8Q2hyb25pY2xlVGFzaywgXCJpZFwiIHwgXCJjcmVhdGVkQXRcIj4pOiBQcm9taXNlPENocm9uaWNsZVRhc2s+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcigpO1xuXG4gICAgY29uc3QgZnVsbDogQ2hyb25pY2xlVGFzayA9IHtcbiAgICAgIC4uLnRhc2ssXG4gICAgICBpZDogdGhpcy5nZW5lcmF0ZUlkKCksXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgY29uc3QgcGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy50YXNrc0ZvbGRlcn0vJHtmdWxsLnRpdGxlfS5tZGApO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCB0aGlzLnRhc2tUb01hcmtkb3duKGZ1bGwpKTtcbiAgICByZXR1cm4gZnVsbDtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZSh0YXNrOiBDaHJvbmljbGVUYXNrKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JUYXNrKHRhc2suaWQpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuXG4gICAgLy8gSWYgdGl0bGUgY2hhbmdlZCwgcmVuYW1lIHRoZSBmaWxlXG4gICAgY29uc3QgZXhwZWN0ZWRQYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLnRhc2tzRm9sZGVyfS8ke3Rhc2sudGl0bGV9Lm1kYCk7XG4gICAgaWYgKGZpbGUucGF0aCAhPT0gZXhwZWN0ZWRQYXRoKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIGV4cGVjdGVkUGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKGV4cGVjdGVkUGF0aCkgPz8gZmlsZTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkodXBkYXRlZEZpbGUsIHRoaXMudGFza1RvTWFya2Rvd24odGFzaykpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvclRhc2soaWQpO1xuICAgIGlmIChmaWxlKSBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBtYXJrQ29tcGxldGUoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRhc2sgPSBhd2FpdCB0aGlzLmdldEJ5SWQoaWQpO1xuICAgIGlmICghdGFzaykgcmV0dXJuO1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHtcbiAgICAgIC4uLnRhc2ssXG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgY29tcGxldGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBGaWx0ZXJzICh1c2VkIGJ5IHNtYXJ0IGxpc3RzKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBnZXREdWVUb2RheSgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IHRvZGF5ID0gdGhpcy50b2RheVN0cigpO1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoXG4gICAgICAodCkgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiICYmIHQuc3RhdHVzICE9PSBcImNhbmNlbGxlZFwiICYmIHQuZHVlRGF0ZSA9PT0gdG9kYXlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgZ2V0T3ZlcmR1ZSgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IHRvZGF5ID0gdGhpcy50b2RheVN0cigpO1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoXG4gICAgICAodCkgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiICYmIHQuc3RhdHVzICE9PSBcImNhbmNlbGxlZFwiICYmICEhdC5kdWVEYXRlICYmIHQuZHVlRGF0ZSA8IHRvZGF5XG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldFNjaGVkdWxlZCgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoXG4gICAgICAodCkgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiICYmIHQuc3RhdHVzICE9PSBcImNhbmNlbGxlZFwiICYmICEhdC5kdWVEYXRlXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldEZsYWdnZWQoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKCh0KSA9PiB0LnByaW9yaXR5ID09PSBcImhpZ2hcIiAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNlcmlhbGlzYXRpb24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSB0YXNrVG9NYXJrZG93bih0YXNrOiBDaHJvbmljbGVUYXNrKTogc3RyaW5nIHtcbiAgICBjb25zdCBmbTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICBpZDogICAgICAgICAgICAgICAgIHRhc2suaWQsXG4gICAgICB0aXRsZTogICAgICAgICAgICAgIHRhc2sudGl0bGUsXG4gICAgICBzdGF0dXM6ICAgICAgICAgICAgIHRhc2suc3RhdHVzLFxuICAgICAgcHJpb3JpdHk6ICAgICAgICAgICB0YXNrLnByaW9yaXR5LFxuICAgICAgdGFnczogICAgICAgICAgICAgICB0YXNrLnRhZ3MsXG4gICAgICBjb250ZXh0czogICAgICAgICAgIHRhc2suY29udGV4dHMsXG4gICAgICBwcm9qZWN0czogICAgICAgICAgIHRhc2sucHJvamVjdHMsXG4gICAgICBcImxpbmtlZC1ub3Rlc1wiOiAgICAgdGFzay5saW5rZWROb3RlcyxcbiAgICAgIFwiY2FsZW5kYXItaWRcIjogICAgICB0YXNrLmNhbGVuZGFySWQgPz8gbnVsbCxcbiAgICAgIFwiZHVlLWRhdGVcIjogICAgICAgICB0YXNrLmR1ZURhdGUgPz8gbnVsbCxcbiAgICAgIFwiZHVlLXRpbWVcIjogICAgICAgICB0YXNrLmR1ZVRpbWUgPz8gbnVsbCxcbiAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgdGFzay5yZWN1cnJlbmNlID8/IG51bGwsXG4gICAgICBcInRpbWUtZXN0aW1hdGVcIjogICAgdGFzay50aW1lRXN0aW1hdGUgPz8gbnVsbCxcbiAgICAgIFwidGltZS1lbnRyaWVzXCI6ICAgICB0YXNrLnRpbWVFbnRyaWVzLFxuICAgICAgXCJjdXN0b20tZmllbGRzXCI6ICAgIHRhc2suY3VzdG9tRmllbGRzLFxuICAgICAgXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCI6IHRhc2suY29tcGxldGVkSW5zdGFuY2VzLFxuICAgICAgXCJjcmVhdGVkLWF0XCI6ICAgICAgIHRhc2suY3JlYXRlZEF0LFxuICAgICAgXCJjb21wbGV0ZWQtYXRcIjogICAgIHRhc2suY29tcGxldGVkQXQgPz8gbnVsbCxcbiAgICB9O1xuXG4gICAgY29uc3QgeWFtbCA9IE9iamVjdC5lbnRyaWVzKGZtKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHtKU09OLnN0cmluZ2lmeSh2KX1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCBib2R5ID0gdGFzay5ub3RlcyA/IGBcXG4ke3Rhc2subm90ZXN9YCA6IFwiXCI7XG4gICAgcmV0dXJuIGAtLS1cXG4ke3lhbWx9XFxuLS0tXFxuJHtib2R5fWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGZpbGVUb1Rhc2soZmlsZTogVEZpbGUpOiBQcm9taXNlPENocm9uaWNsZVRhc2sgfCBudWxsPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgICBjb25zdCBmbSA9IGNhY2hlPy5mcm9udG1hdHRlcjtcbiAgICAgIGlmICghZm0/LmlkIHx8ICFmbT8udGl0bGUpIHJldHVybiBudWxsO1xuXG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICAgIGNvbnN0IGJvZHlNYXRjaCA9IGNvbnRlbnQubWF0Y2goL14tLS1cXG5bXFxzXFxTXSo/XFxuLS0tXFxuKFtcXHNcXFNdKikkLyk7XG4gICAgICBjb25zdCBub3RlcyA9IGJvZHlNYXRjaD8uWzFdPy50cmltKCkgfHwgdW5kZWZpbmVkO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZDogICAgICAgICAgICAgICAgIGZtLmlkLFxuICAgICAgICB0aXRsZTogICAgICAgICAgICAgIGZtLnRpdGxlLFxuICAgICAgICBzdGF0dXM6ICAgICAgICAgICAgIChmbS5zdGF0dXMgYXMgVGFza1N0YXR1cykgPz8gXCJ0b2RvXCIsXG4gICAgICAgIHByaW9yaXR5OiAgICAgICAgICAgKGZtLnByaW9yaXR5IGFzIFRhc2tQcmlvcml0eSkgPz8gXCJub25lXCIsXG4gICAgICAgIGR1ZURhdGU6ICAgICAgICAgICAgZm1bXCJkdWUtZGF0ZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGR1ZVRpbWU6ICAgICAgICAgICAgZm1bXCJkdWUtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgZm0ucmVjdXJyZW5jZSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGNhbGVuZGFySWQ6ICAgICAgICAgZm1bXCJjYWxlbmRhci1pZFwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgZm0udGFncyA/PyBbXSxcbiAgICAgICAgY29udGV4dHM6ICAgICAgICAgICBmbS5jb250ZXh0cyA/PyBbXSxcbiAgICAgICAgbGlua2VkTm90ZXM6ICAgICAgICBmbVtcImxpbmtlZC1ub3Rlc1wiXSA/PyBbXSxcbiAgICAgICAgcHJvamVjdHM6ICAgICAgICAgICBmbS5wcm9qZWN0cyA/PyBbXSxcbiAgICAgICAgdGltZUVzdGltYXRlOiAgICAgICBmbVtcInRpbWUtZXN0aW1hdGVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICB0aW1lRW50cmllczogICAgICAgIGZtW1widGltZS1lbnRyaWVzXCJdID8/IFtdLFxuICAgICAgICBjdXN0b21GaWVsZHM6ICAgICAgIGZtW1wiY3VzdG9tLWZpZWxkc1wiXSA/PyBbXSxcbiAgICAgICAgY29tcGxldGVkSW5zdGFuY2VzOiBmbVtcImNvbXBsZXRlZC1pbnN0YW5jZXNcIl0gPz8gW10sXG4gICAgICAgIGNyZWF0ZWRBdDogICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgY29tcGxldGVkQXQ6ICAgICAgICBmbVtcImNvbXBsZXRlZC1hdFwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIG5vdGVzLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgZmluZEZpbGVGb3JUYXNrKGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIG51bGw7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmICghKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoY2hpbGQpO1xuICAgICAgaWYgKGNhY2hlPy5mcm9udG1hdHRlcj8uaWQgPT09IGlkKSByZXR1cm4gY2hpbGQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy50YXNrc0ZvbGRlcikpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcih0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYHRhc2stJHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA2KX1gO1xuICB9XG5cbiAgcHJpdmF0ZSB0b2RheVN0cigpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgVEZpbGUsIG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZUV2ZW50LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCwgcHJpdmF0ZSBldmVudHNGb2xkZXI6IHN0cmluZykge31cblxuICBhc3luYyBnZXRBbGwoKTogUHJvbWlzZTxDaHJvbmljbGVFdmVudFtdPiB7XG4gICAgY29uc3QgZm9sZGVyID0gdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMuZXZlbnRzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdID0gW107XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRGaWxlICYmIGNoaWxkLmV4dGVuc2lvbiA9PT0gXCJtZFwiKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50ID0gYXdhaXQgdGhpcy5maWxlVG9FdmVudChjaGlsZCk7XG4gICAgICAgIGlmIChldmVudCkgZXZlbnRzLnB1c2goZXZlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZXZlbnRzO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlKGV2ZW50OiBPbWl0PENocm9uaWNsZUV2ZW50LCBcImlkXCIgfCBcImNyZWF0ZWRBdFwiPik6IFByb21pc2U8Q2hyb25pY2xlRXZlbnQ+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcigpO1xuXG4gICAgY29uc3QgZnVsbDogQ2hyb25pY2xlRXZlbnQgPSB7XG4gICAgICAuLi5ldmVudCxcbiAgICAgIGlkOiB0aGlzLmdlbmVyYXRlSWQoKSxcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICBjb25zdCBwYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLmV2ZW50c0ZvbGRlcn0vJHtmdWxsLnRpdGxlfS5tZGApO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCB0aGlzLmV2ZW50VG9NYXJrZG93bihmdWxsKSk7XG4gICAgcmV0dXJuIGZ1bGw7XG4gIH1cblxuICBhc3luYyB1cGRhdGUoZXZlbnQ6IENocm9uaWNsZUV2ZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JFdmVudChldmVudC5pZCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG5cbiAgICBjb25zdCBleHBlY3RlZFBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMuZXZlbnRzRm9sZGVyfS8ke2V2ZW50LnRpdGxlfS5tZGApO1xuICAgIGlmIChmaWxlLnBhdGggIT09IGV4cGVjdGVkUGF0aCkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAuZmlsZU1hbmFnZXIucmVuYW1lRmlsZShmaWxlLCBleHBlY3RlZFBhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZUJ5UGF0aChleHBlY3RlZFBhdGgpID8/IGZpbGU7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KHVwZGF0ZWRGaWxlLCB0aGlzLmV2ZW50VG9NYXJrZG93bihldmVudCkpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvckV2ZW50KGlkKTtcbiAgICBpZiAoZmlsZSkgYXdhaXQgdGhpcy5hcHAudmF1bHQuZGVsZXRlKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgZ2V0SW5SYW5nZShzdGFydERhdGU6IHN0cmluZywgZW5kRGF0ZTogc3RyaW5nKTogUHJvbWlzZTxDaHJvbmljbGVFdmVudFtdPiB7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcigoZSkgPT4gZS5zdGFydERhdGUgPj0gc3RhcnREYXRlICYmIGUuc3RhcnREYXRlIDw9IGVuZERhdGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBldmVudFRvTWFya2Rvd24oZXZlbnQ6IENocm9uaWNsZUV2ZW50KTogc3RyaW5nIHtcbiAgICBjb25zdCBmbTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICBpZDogICAgICAgICAgICAgICAgICAgZXZlbnQuaWQsXG4gICAgICB0aXRsZTogICAgICAgICAgICAgICAgZXZlbnQudGl0bGUsXG4gICAgICBsb2NhdGlvbjogICAgICAgICAgICAgZXZlbnQubG9jYXRpb24gPz8gbnVsbCxcbiAgICAgIFwiYWxsLWRheVwiOiAgICAgICAgICAgIGV2ZW50LmFsbERheSxcbiAgICAgIFwic3RhcnQtZGF0ZVwiOiAgICAgICAgIGV2ZW50LnN0YXJ0RGF0ZSxcbiAgICAgIFwic3RhcnQtdGltZVwiOiAgICAgICAgIGV2ZW50LnN0YXJ0VGltZSA/PyBudWxsLFxuICAgICAgXCJlbmQtZGF0ZVwiOiAgICAgICAgICAgZXZlbnQuZW5kRGF0ZSxcbiAgICAgIFwiZW5kLXRpbWVcIjogICAgICAgICAgIGV2ZW50LmVuZFRpbWUgPz8gbnVsbCxcbiAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICBldmVudC5yZWN1cnJlbmNlID8/IG51bGwsXG4gICAgICBcImNhbGVuZGFyLWlkXCI6ICAgICAgICBldmVudC5jYWxlbmRhcklkID8/IG51bGwsXG4gICAgICBhbGVydDogICAgICAgICAgICAgICAgZXZlbnQuYWxlcnQsXG4gICAgICBcImxpbmtlZC10YXNrLWlkc1wiOiAgICBldmVudC5saW5rZWRUYXNrSWRzLFxuICAgICAgXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCI6IGV2ZW50LmNvbXBsZXRlZEluc3RhbmNlcyxcbiAgICAgIFwiY3JlYXRlZC1hdFwiOiAgICAgICAgIGV2ZW50LmNyZWF0ZWRBdCxcbiAgICB9O1xuXG4gICAgY29uc3QgeWFtbCA9IE9iamVjdC5lbnRyaWVzKGZtKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHtKU09OLnN0cmluZ2lmeSh2KX1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCBib2R5ID0gZXZlbnQubm90ZXMgPyBgXFxuJHtldmVudC5ub3Rlc31gIDogXCJcIjtcbiAgICByZXR1cm4gYC0tLVxcbiR7eWFtbH1cXG4tLS1cXG4ke2JvZHl9YDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmlsZVRvRXZlbnQoZmlsZTogVEZpbGUpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50IHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgICAgY29uc3QgZm0gPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG4gICAgICBpZiAoIWZtPy5pZCB8fCAhZm0/LnRpdGxlKSByZXR1cm4gbnVsbDtcblxuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBjb25zdCBib2R5TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eLS0tXFxuW1xcc1xcU10qP1xcbi0tLVxcbihbXFxzXFxTXSopJC8pO1xuICAgICAgY29uc3Qgbm90ZXMgPSBib2R5TWF0Y2g/LlsxXT8udHJpbSgpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6ICAgICAgICAgICAgICAgICAgIGZtLmlkLFxuICAgICAgICB0aXRsZTogICAgICAgICAgICAgICAgZm0udGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICAgICAgICAgICBmbS5sb2NhdGlvbiA/PyB1bmRlZmluZWQsXG4gICAgICAgIGFsbERheTogICAgICAgICAgICAgICBmbVtcImFsbC1kYXlcIl0gPz8gdHJ1ZSxcbiAgICAgICAgc3RhcnREYXRlOiAgICAgICAgICAgIGZtW1wic3RhcnQtZGF0ZVwiXSxcbiAgICAgICAgc3RhcnRUaW1lOiAgICAgICAgICAgIGZtW1wic3RhcnQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGVuZERhdGU6ICAgICAgICAgICAgICBmbVtcImVuZC1kYXRlXCJdLFxuICAgICAgICBlbmRUaW1lOiAgICAgICAgICAgICAgZm1bXCJlbmQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICBmbS5yZWN1cnJlbmNlID8/IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsZW5kYXJJZDogICAgICAgICAgIGZtW1wiY2FsZW5kYXItaWRcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBhbGVydDogICAgICAgICAgICAgICAgKGZtLmFsZXJ0IGFzIEFsZXJ0T2Zmc2V0KSA/PyBcIm5vbmVcIixcbiAgICAgICAgbGlua2VkVGFza0lkczogICAgICAgIGZtW1wibGlua2VkLXRhc2staWRzXCJdID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6ICAgZm1bXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCJdID8/IFtdLFxuICAgICAgICBjcmVhdGVkQXQ6ICAgICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgbm90ZXMsXG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5kRmlsZUZvckV2ZW50KGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLmV2ZW50c0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBudWxsO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoIShjaGlsZCBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGNoaWxkKTtcbiAgICAgIGlmIChjYWNoZT8uZnJvbnRtYXR0ZXI/LmlkID09PSBpZCkgcmV0dXJuIGNoaWxkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMuZXZlbnRzRm9sZGVyKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKHRoaXMuZXZlbnRzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGV2ZW50LSR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNil9YDtcbiAgfVxufSJd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QUFHLHFCQUFxQixNQUF4QixZQUE2QixDQUFDO0FBQUEsUUFDcEQsWUFBc0IsUUFBRyxZQUFZLE1BQWYsYUFBb0Isb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFBQSxRQUNqRTtBQUFBLE1BQ0Y7QUFBQSxJQUNGLFNBQVE7QUFDTixhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFBQSxFQUVRLGlCQUFpQixJQUEwQjtBQW5IckQ7QUFvSEksVUFBTSxTQUFTLEtBQUssSUFBSSxNQUFNLGdCQUFnQixLQUFLLFlBQVk7QUFDL0QsUUFBSSxDQUFDLE9BQVEsUUFBTztBQUNwQixlQUFXLFNBQVMsT0FBTyxVQUFVO0FBQ25DLFVBQUksRUFBRSxpQkFBaUIsd0JBQVE7QUFDL0IsWUFBTSxRQUFRLEtBQUssSUFBSSxjQUFjLGFBQWEsS0FBSztBQUN2RCxZQUFJLG9DQUFPLGdCQUFQLG1CQUFvQixRQUFPLEdBQUksUUFBTztBQUFBLElBQzVDO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQWMsZUFBOEI7QUFDMUMsUUFBSSxDQUFDLEtBQUssSUFBSSxNQUFNLGdCQUFnQixLQUFLLFlBQVksR0FBRztBQUN0RCxZQUFNLEtBQUssSUFBSSxNQUFNLGFBQWEsS0FBSyxZQUFZO0FBQUEsSUFDckQ7QUFBQSxFQUNGO0FBQUEsRUFFUSxhQUFxQjtBQUMzQixXQUFPLFNBQVMsS0FBSyxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQUEsRUFDbkY7QUFDRjs7O0FKaklBLElBQXFCLGtCQUFyQixjQUE2Qyx3QkFBTztBQUFBLEVBTWxELE1BQU0sU0FBUztBQUNiLFVBQU0sS0FBSyxhQUFhO0FBRXhCLFNBQUssa0JBQWtCLElBQUk7QUFBQSxNQUN6QixLQUFLLFNBQVM7QUFBQSxNQUNkLE1BQU0sS0FBSyxhQUFhO0FBQUEsSUFDMUI7QUFFQSxTQUFLLGNBQWMsSUFBSSxZQUFZLEtBQUssS0FBSyxLQUFLLFNBQVMsV0FBVztBQUN0RSxTQUFLLGVBQWUsSUFBSSxhQUFhLEtBQUssS0FBSyxLQUFLLFNBQVMsWUFBWTtBQUV6RSxZQUFRLElBQUkseUJBQW9CO0FBQUEsRUFDbEM7QUFBQSxFQUVBLFdBQVc7QUFDVCxZQUFRLElBQUksb0JBQW9CO0FBQUEsRUFDbEM7QUFBQSxFQUVBLE1BQU0sZUFBZTtBQUNuQixTQUFLLFdBQVcsT0FBTyxPQUFPLENBQUMsR0FBRyxrQkFBa0IsTUFBTSxLQUFLLFNBQVMsQ0FBQztBQUFBLEVBQzNFO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDbkIsVUFBTSxLQUFLLFNBQVMsS0FBSyxRQUFRO0FBQUEsRUFDbkM7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
