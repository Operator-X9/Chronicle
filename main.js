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
var import_obsidian4 = require("obsidian");

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
var import_obsidian3 = require("obsidian");
var TASK_VIEW_TYPE = "chronicle-task-view";
var TaskView = class extends import_obsidian3.ItemView {
  constructor(leaf, taskManager, calendarManager) {
    super(leaf);
    this.currentListId = "today";
    this.taskManager = taskManager;
    this.calendarManager = calendarManager;
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
      tasks = all.filter((t) => t.calendarId === this.currentListId && t.status !== "done");
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
        for (const task of groupTasks) {
          this.renderTaskRow(listEl, task);
        }
      }
    }
    const newRow = listEl.createDiv("chronicle-new-task-row");
    const plusIcon = newRow.createDiv("chronicle-new-task-plus");
    plusIcon.setText("+");
    const newInput = newRow.createEl("input", {
      type: "text",
      placeholder: "New reminder...",
      cls: "chronicle-new-task-input"
    });
    newInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && newInput.value.trim()) {
        const calendarId = smartColors[this.currentListId] ? void 0 : this.currentListId;
        await this.taskManager.create({
          title: newInput.value.trim(),
          status: "todo",
          priority: this.currentListId === "flagged" ? "high" : "none",
          calendarId,
          tags: [],
          contexts: [],
          linkedNotes: [],
          projects: [],
          timeEntries: [],
          customFields: [],
          completedInstances: []
        });
        await this.render();
      }
      if (e.key === "Escape") newInput.blur();
    });
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
    const checkSvg = `<svg class="chronicle-checkmark" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    checkbox.innerHTML = checkSvg;
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
    content.addEventListener("click", () => this.openTaskNote(task));
    const titleEl = content.createDiv("chronicle-task-title");
    titleEl.setText(task.title);
    if (isDone) titleEl.addClass("done");
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (task.dueDate || task.calendarId) {
      const meta = content.createDiv("chronicle-task-meta");
      if (task.dueDate) {
        const metaDate = meta.createSpan("chronicle-task-date");
        metaDate.setText(this.formatDate(task.dueDate));
        if (task.dueDate < today) metaDate.addClass("overdue");
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
      const flag = row.createDiv("chronicle-flag");
      flag.setText("\u2691");
    }
    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const menu = document.createElement("div");
      menu.className = "chronicle-context-menu";
      menu.style.left = `${e.clientX}px`;
      menu.style.top = `${e.clientY}px`;
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
  async openTaskNote(task) {
    const folder = this.taskManager["tasksFolder"];
    const path = `${folder}/${task.title}.md`;
    const file = this.app.vault.getFileByPath(path);
    if (file instanceof import_obsidian3.TFile) {
      const leaf = this.app.workspace.getLeaf("tab");
      await leaf.openFile(file);
    }
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
};

// src/main.ts
var ChroniclePlugin = class extends import_obsidian4.Plugin {
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
      (leaf) => new TaskView(leaf, this.taskManager, this.calendarManager)
    );
    this.addRibbonIcon("check-circle", "Chronicle", () => {
      this.activateView();
    });
    this.addCommand({
      id: "open-chronicle",
      name: "Open Chronicle",
      callback: () => this.activateView()
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
  onunload() {
    this.app.workspace.detachLeavesOfType(TASK_VIEW_TYPE);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3R5cGVzL2luZGV4LnRzIiwgInNyYy9kYXRhL0NhbGVuZGFyTWFuYWdlci50cyIsICJzcmMvZGF0YS9UYXNrTWFuYWdlci50cyIsICJzcmMvZGF0YS9FdmVudE1hbmFnZXIudHMiLCAic3JjL3ZpZXdzL1Rhc2tWaWV3LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBQbHVnaW4sIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZVNldHRpbmdzLCBERUZBVUxUX1NFVFRJTkdTIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IENhbGVuZGFyTWFuYWdlciB9IGZyb20gXCIuL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuL2RhdGEvVGFza01hbmFnZXJcIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuL2RhdGEvRXZlbnRNYW5hZ2VyXCI7XG5pbXBvcnQgeyBUYXNrVmlldywgVEFTS19WSUVXX1RZUEUgfSBmcm9tIFwiLi92aWV3cy9UYXNrVmlld1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaHJvbmljbGVQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5nczogQ2hyb25pY2xlU2V0dGluZ3M7XG4gIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICB0YXNrTWFuYWdlcjogVGFza01hbmFnZXI7XG4gIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyO1xuXG4gIGFzeW5jIG9ubG9hZCgpIHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBuZXcgQ2FsZW5kYXJNYW5hZ2VyKFxuICAgICAgdGhpcy5zZXR0aW5ncy5jYWxlbmRhcnMsXG4gICAgICAoKSA9PiB0aGlzLnNhdmVTZXR0aW5ncygpXG4gICAgKTtcbiAgICB0aGlzLnRhc2tNYW5hZ2VyID0gbmV3IFRhc2tNYW5hZ2VyKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLnRhc2tzRm9sZGVyKTtcbiAgICB0aGlzLmV2ZW50TWFuYWdlciA9IG5ldyBFdmVudE1hbmFnZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MuZXZlbnRzRm9sZGVyKTtcblxuICAgIC8vIFJlZ2lzdGVyIHRoZSB0YXNrIHZpZXdcbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgIFRBU0tfVklFV19UWVBFLFxuICAgICAgKGxlYWYpID0+IG5ldyBUYXNrVmlldyhsZWFmLCB0aGlzLnRhc2tNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlcilcbiAgICApO1xuXG4gICAgLy8gUmliYm9uIGJ1dHRvblxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcImNoZWNrLWNpcmNsZVwiLCBcIkNocm9uaWNsZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmFjdGl2YXRlVmlldygpO1xuICAgIH0pO1xuXG4gICAgLy8gQ29tbWFuZCBwYWxldHRlXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9wZW4tY2hyb25pY2xlXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gQ2hyb25pY2xlXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5hY3RpdmF0ZVZpZXcoKSxcbiAgICB9KTtcblxuICAgIGNvbnNvbGUubG9nKFwiQ2hyb25pY2xlIGxvYWRlZCBcdTI3MTNcIik7XG4gIH1cblxuICBhc3luYyBhY3RpdmF0ZVZpZXcoKSB7XG4gIGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcbiAgbGV0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfVklFV19UWVBFKVswXTtcbiAgaWYgKCFsZWFmKSB7XG4gICAgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogVEFTS19WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgfVxuICB3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbn1cblxuICBvbnVubG9hZCgpIHtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFRBU0tfVklFV19UWVBFKTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG59IiwgIi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDYWxlbmRhcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIENhbGVuZGFyQ29sb3IgPVxuICB8IFwiYmx1ZVwiIHwgXCJncmVlblwiIHwgXCJwdXJwbGVcIiB8IFwib3JhbmdlXCJcbiAgfCBcInJlZFwiIHwgXCJ0ZWFsXCIgfCBcInBpbmtcIiB8IFwieWVsbG93XCIgfCBcImdyYXlcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVDYWxlbmRhciB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgY29sb3I6IENhbGVuZGFyQ29sb3I7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBpc1Zpc2libGU6IGJvb2xlYW47XG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgVGFza3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIFRhc2tTdGF0dXMgPSBcInRvZG9cIiB8IFwiaW4tcHJvZ3Jlc3NcIiB8IFwiZG9uZVwiIHwgXCJjYW5jZWxsZWRcIjtcbmV4cG9ydCB0eXBlIFRhc2tQcmlvcml0eSA9IFwibm9uZVwiIHwgXCJsb3dcIiB8IFwibWVkaXVtXCIgfCBcImhpZ2hcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUaW1lRW50cnkge1xuICBzdGFydFRpbWU6IHN0cmluZzsgICAvLyBJU08gODYwMVxuICBlbmRUaW1lPzogc3RyaW5nOyAgICAvLyBJU08gODYwMVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEN1c3RvbUZpZWxkIHtcbiAga2V5OiBzdHJpbmc7XG4gIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENocm9uaWNsZVRhc2sge1xuICAvLyAtLS0gQ29yZSAtLS1cbiAgaWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgc3RhdHVzOiBUYXNrU3RhdHVzO1xuICBwcmlvcml0eTogVGFza1ByaW9yaXR5O1xuXG4gIC8vIC0tLSBTY2hlZHVsaW5nIC0tLVxuICBkdWVEYXRlPzogc3RyaW5nOyAgICAgICAvLyBZWVlZLU1NLUREXG4gIGR1ZVRpbWU/OiBzdHJpbmc7ICAgICAgIC8vIEhIOm1tXG4gIHJlY3VycmVuY2U/OiBzdHJpbmc7ICAgIC8vIFJSVUxFIHN0cmluZyBlLmcuIFwiRlJFUT1XRUVLTFk7QllEQVk9TU9cIlxuXG4gIC8vIC0tLSBPcmdhbmlzYXRpb24gLS0tXG4gIGNhbGVuZGFySWQ/OiBzdHJpbmc7ICAgIC8vIGxpbmtzIHRvIGEgQ2hyb25pY2xlQ2FsZW5kYXJcbiAgdGFnczogc3RyaW5nW107XG4gIGNvbnRleHRzOiBzdHJpbmdbXTsgICAgIC8vIGUuZy4gW1wiQGhvbWVcIiwgXCJAd29ya1wiXVxuICBsaW5rZWROb3Rlczogc3RyaW5nW107ICAvLyB3aWtpbGluayBwYXRocyBlLmcuIFtcIlByb2plY3RzL1dlYnNpdGVcIl1cbiAgcHJvamVjdHM6IHN0cmluZ1tdO1xuXG4gIC8vIC0tLSBUaW1lIHRyYWNraW5nIC0tLVxuICB0aW1lRXN0aW1hdGU/OiBudW1iZXI7ICAvLyBtaW51dGVzXG4gIHRpbWVFbnRyaWVzOiBUaW1lRW50cnlbXTtcblxuICAvLyAtLS0gQ3VzdG9tIC0tLVxuICBjdXN0b21GaWVsZHM6IEN1c3RvbUZpZWxkW107XG5cbiAgLy8gLS0tIFJlY3VycmVuY2UgY29tcGxldGlvbiAtLS1cbiAgY29tcGxldGVkSW5zdGFuY2VzOiBzdHJpbmdbXTsgLy8gWVlZWS1NTS1ERCBkYXRlc1xuXG4gIC8vIC0tLSBNZXRhIC0tLVxuICBjcmVhdGVkQXQ6IHN0cmluZzsgICAgICAvLyBJU08gODYwMVxuICBjb21wbGV0ZWRBdD86IHN0cmluZzsgICAvLyBJU08gODYwMVxuICBub3Rlcz86IHN0cmluZzsgICAgICAgICAvLyBib2R5IGNvbnRlbnQgb2YgdGhlIG5vdGVcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIEV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IHR5cGUgQWxlcnRPZmZzZXQgPVxuICB8IFwibm9uZVwiXG4gIHwgXCJhdC10aW1lXCJcbiAgfCBcIjVtaW5cIiB8IFwiMTBtaW5cIiB8IFwiMTVtaW5cIiB8IFwiMzBtaW5cIlxuICB8IFwiMWhvdXJcIiB8IFwiMmhvdXJzXCJcbiAgfCBcIjFkYXlcIiB8IFwiMmRheXNcIiB8IFwiMXdlZWtcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVFdmVudCB7XG4gIC8vIC0tLSBDb3JlIChpbiBmb3JtIG9yZGVyKSAtLS1cbiAgaWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgbG9jYXRpb24/OiBzdHJpbmc7XG4gIGFsbERheTogYm9vbGVhbjtcbiAgc3RhcnREYXRlOiBzdHJpbmc7ICAgICAgLy8gWVlZWS1NTS1ERFxuICBzdGFydFRpbWU/OiBzdHJpbmc7ICAgICAvLyBISDptbSAgKHVuZGVmaW5lZCB3aGVuIGFsbERheSlcbiAgZW5kRGF0ZTogc3RyaW5nOyAgICAgICAgLy8gWVlZWS1NTS1ERFxuICBlbmRUaW1lPzogc3RyaW5nOyAgICAgICAvLyBISDptbSAgKHVuZGVmaW5lZCB3aGVuIGFsbERheSlcbiAgcmVjdXJyZW5jZT86IHN0cmluZzsgICAgLy8gUlJVTEUgc3RyaW5nXG4gIGNhbGVuZGFySWQ/OiBzdHJpbmc7ICAgIC8vIGxpbmtzIHRvIGEgQ2hyb25pY2xlQ2FsZW5kYXJcbiAgYWxlcnQ6IEFsZXJ0T2Zmc2V0O1xuICBub3Rlcz86IHN0cmluZzsgICAgICAgICAvLyBib2R5IGNvbnRlbnQgb2YgdGhlIG5vdGVcblxuICAvLyAtLS0gQ29ubmVjdGlvbnMgLS0tXG4gIGxpbmtlZFRhc2tJZHM6IHN0cmluZ1tdOyAgIC8vIENocm9uaWNsZSB0YXNrIElEc1xuXG4gIC8vIC0tLSBNZXRhIC0tLVxuICBjcmVhdGVkQXQ6IHN0cmluZztcbiAgY29tcGxldGVkSW5zdGFuY2VzOiBzdHJpbmdbXTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFBsdWdpbiBzZXR0aW5ncyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVTZXR0aW5ncyB7XG4gIC8vIEZvbGRlciBwYXRoc1xuICB0YXNrc0ZvbGRlcjogc3RyaW5nO1xuICBldmVudHNGb2xkZXI6IHN0cmluZztcblxuICAvLyBDYWxlbmRhcnMgKHN0b3JlZCBpbiBzZXR0aW5ncywgbm90IGFzIGZpbGVzKVxuICBjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW107XG4gIGRlZmF1bHRDYWxlbmRhcklkOiBzdHJpbmc7XG5cbiAgLy8gRGVmYXVsdHNcbiAgZGVmYXVsdFRhc2tTdGF0dXM6IFRhc2tTdGF0dXM7XG4gIGRlZmF1bHRUYXNrUHJpb3JpdHk6IFRhc2tQcmlvcml0eTtcbiAgZGVmYXVsdEFsZXJ0OiBBbGVydE9mZnNldDtcblxuICAvLyBEaXNwbGF5XG4gIHN0YXJ0T2ZXZWVrOiAwIHwgMSB8IDY7ICAvLyAwPVN1biwgMT1Nb24sIDY9U2F0XG4gIHRpbWVGb3JtYXQ6IFwiMTJoXCIgfCBcIjI0aFwiO1xuICBkZWZhdWx0Q2FsZW5kYXJWaWV3OiBcImRheVwiIHwgXCJ3ZWVrXCIgfCBcIm1vbnRoXCIgfCBcInllYXJcIjtcblxuICAvLyBTbWFydCBsaXN0cyB2aXNpYmlsaXR5XG4gIHNob3dUb2RheUNvdW50OiBib29sZWFuO1xuICBzaG93U2NoZWR1bGVkQ291bnQ6IGJvb2xlYW47XG4gIHNob3dGbGFnZ2VkQ291bnQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBDaHJvbmljbGVTZXR0aW5ncyA9IHtcbiAgdGFza3NGb2xkZXI6IFwiQ2hyb25pY2xlL1Rhc2tzXCIsXG4gIGV2ZW50c0ZvbGRlcjogXCJDaHJvbmljbGUvRXZlbnRzXCIsXG4gIGNhbGVuZGFyczogW1xuICAgIHsgaWQ6IFwicGVyc29uYWxcIiwgbmFtZTogXCJQZXJzb25hbFwiLCBjb2xvcjogXCJibHVlXCIsICAgaXNWaXNpYmxlOiB0cnVlLCBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9LFxuICAgIHsgaWQ6IFwid29ya1wiLCAgICAgbmFtZTogXCJXb3JrXCIsICAgICBjb2xvcjogXCJncmVlblwiLCAgaXNWaXNpYmxlOiB0cnVlLCBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9LFxuICBdLFxuICBkZWZhdWx0Q2FsZW5kYXJJZDogXCJwZXJzb25hbFwiLFxuICBkZWZhdWx0VGFza1N0YXR1czogXCJ0b2RvXCIsXG4gIGRlZmF1bHRUYXNrUHJpb3JpdHk6IFwibm9uZVwiLFxuICBkZWZhdWx0QWxlcnQ6IFwibm9uZVwiLFxuICBzdGFydE9mV2VlazogMCxcbiAgdGltZUZvcm1hdDogXCIxMmhcIixcbiAgZGVmYXVsdENhbGVuZGFyVmlldzogXCJ3ZWVrXCIsXG4gIHNob3dUb2RheUNvdW50OiB0cnVlLFxuICBzaG93U2NoZWR1bGVkQ291bnQ6IHRydWUsXG4gIHNob3dGbGFnZ2VkQ291bnQ6IHRydWUsXG59OyIsICJpbXBvcnQgeyBDaHJvbmljbGVDYWxlbmRhciwgQ2FsZW5kYXJDb2xvciB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgQ2FsZW5kYXJNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW107XG4gIHByaXZhdGUgb25VcGRhdGU6ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoY2FsZW5kYXJzOiBDaHJvbmljbGVDYWxlbmRhcltdLCBvblVwZGF0ZTogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuY2FsZW5kYXJzID0gY2FsZW5kYXJzO1xuICAgIHRoaXMub25VcGRhdGUgPSBvblVwZGF0ZTtcbiAgfVxuXG4gIGdldEFsbCgpOiBDaHJvbmljbGVDYWxlbmRhcltdIHtcbiAgICByZXR1cm4gWy4uLnRoaXMuY2FsZW5kYXJzXTtcbiAgfVxuXG4gIGdldEJ5SWQoaWQ6IHN0cmluZyk6IENocm9uaWNsZUNhbGVuZGFyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jYWxlbmRhcnMuZmluZCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICB9XG5cbiAgY3JlYXRlKG5hbWU6IHN0cmluZywgY29sb3I6IENhbGVuZGFyQ29sb3IpOiBDaHJvbmljbGVDYWxlbmRhciB7XG4gICAgY29uc3QgY2FsZW5kYXI6IENocm9uaWNsZUNhbGVuZGFyID0ge1xuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZChuYW1lKSxcbiAgICAgIG5hbWUsXG4gICAgICBjb2xvcixcbiAgICAgIGlzVmlzaWJsZTogdHJ1ZSxcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG4gICAgdGhpcy5jYWxlbmRhcnMucHVzaChjYWxlbmRhcik7XG4gICAgdGhpcy5vblVwZGF0ZSgpO1xuICAgIHJldHVybiBjYWxlbmRhcjtcbiAgfVxuXG4gIHVwZGF0ZShpZDogc3RyaW5nLCBjaGFuZ2VzOiBQYXJ0aWFsPENocm9uaWNsZUNhbGVuZGFyPik6IHZvaWQge1xuICAgIGNvbnN0IGlkeCA9IHRoaXMuY2FsZW5kYXJzLmZpbmRJbmRleCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICAgIGlmIChpZHggPT09IC0xKSByZXR1cm47XG4gICAgdGhpcy5jYWxlbmRhcnNbaWR4XSA9IHsgLi4udGhpcy5jYWxlbmRhcnNbaWR4XSwgLi4uY2hhbmdlcyB9O1xuICAgIHRoaXMub25VcGRhdGUoKTtcbiAgfVxuXG4gIGRlbGV0ZShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5jYWxlbmRhcnMgPSB0aGlzLmNhbGVuZGFycy5maWx0ZXIoKGMpID0+IGMuaWQgIT09IGlkKTtcbiAgICB0aGlzLm9uVXBkYXRlKCk7XG4gIH1cblxuICB0b2dnbGVWaXNpYmlsaXR5KGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFycy5maW5kKChjKSA9PiBjLmlkID09PSBpZCk7XG4gICAgaWYgKGNhbCkge1xuICAgICAgY2FsLmlzVmlzaWJsZSA9ICFjYWwuaXNWaXNpYmxlO1xuICAgICAgdGhpcy5vblVwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldHVybnMgQ1NTIGhleCBjb2xvciBmb3IgYSBDYWxlbmRhckNvbG9yIG5hbWVcbiAgc3RhdGljIGNvbG9yVG9IZXgoY29sb3I6IENhbGVuZGFyQ29sb3IpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1hcDogUmVjb3JkPENhbGVuZGFyQ29sb3IsIHN0cmluZz4gPSB7XG4gICAgICBibHVlOiAgIFwiIzM3OEFERFwiLFxuICAgICAgZ3JlZW46ICBcIiMzNEM3NTlcIixcbiAgICAgIHB1cnBsZTogXCIjQUY1MkRFXCIsXG4gICAgICBvcmFuZ2U6IFwiI0ZGOTUwMFwiLFxuICAgICAgcmVkOiAgICBcIiNGRjNCMzBcIixcbiAgICAgIHRlYWw6ICAgXCIjMzBCMEM3XCIsXG4gICAgICBwaW5rOiAgIFwiI0ZGMkQ1NVwiLFxuICAgICAgeWVsbG93OiBcIiNGRkQ2MEFcIixcbiAgICAgIGdyYXk6ICAgXCIjOEU4RTkzXCIsXG4gICAgfTtcbiAgICByZXR1cm4gbWFwW2NvbG9yXTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVJZChuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJhc2UgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCBcIi1cIikucmVwbGFjZSgvW15hLXowLTktXS9nLCBcIlwiKTtcbiAgICBjb25zdCBzdWZmaXggPSBEYXRlLm5vdygpLnRvU3RyaW5nKDM2KTtcbiAgICByZXR1cm4gYCR7YmFzZX0tJHtzdWZmaXh9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIFRGaWxlLCBub3JtYWxpemVQYXRoIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVUYXNrLCBUYXNrU3RhdHVzLCBUYXNrUHJpb3JpdHkgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIFRhc2tNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCwgcHJpdmF0ZSB0YXNrc0ZvbGRlcjogc3RyaW5nKSB7fVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBSZWFkIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIGFzeW5jIGdldEFsbCgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgdGFza3M6IENocm9uaWNsZVRhc2tbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSAmJiBjaGlsZC5leHRlbnNpb24gPT09IFwibWRcIikge1xuICAgICAgICBjb25zdCB0YXNrID0gYXdhaXQgdGhpcy5maWxlVG9UYXNrKGNoaWxkKTtcbiAgICAgICAgaWYgKHRhc2spIHRhc2tzLnB1c2godGFzayk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXNrcztcbiAgfVxuXG4gIGFzeW5jIGdldEJ5SWQoaWQ6IHN0cmluZyk6IFByb21pc2U8Q2hyb25pY2xlVGFzayB8IG51bGw+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmluZCgodCkgPT4gdC5pZCA9PT0gaWQpID8/IG51bGw7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgV3JpdGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgY3JlYXRlKHRhc2s6IE9taXQ8Q2hyb25pY2xlVGFzaywgXCJpZFwiIHwgXCJjcmVhdGVkQXRcIj4pOiBQcm9taXNlPENocm9uaWNsZVRhc2s+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcigpO1xuXG4gICAgY29uc3QgZnVsbDogQ2hyb25pY2xlVGFzayA9IHtcbiAgICAgIC4uLnRhc2ssXG4gICAgICBpZDogdGhpcy5nZW5lcmF0ZUlkKCksXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgY29uc3QgcGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy50YXNrc0ZvbGRlcn0vJHtmdWxsLnRpdGxlfS5tZGApO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCB0aGlzLnRhc2tUb01hcmtkb3duKGZ1bGwpKTtcbiAgICByZXR1cm4gZnVsbDtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZSh0YXNrOiBDaHJvbmljbGVUYXNrKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JUYXNrKHRhc2suaWQpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuXG4gICAgLy8gSWYgdGl0bGUgY2hhbmdlZCwgcmVuYW1lIHRoZSBmaWxlXG4gICAgY29uc3QgZXhwZWN0ZWRQYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLnRhc2tzRm9sZGVyfS8ke3Rhc2sudGl0bGV9Lm1kYCk7XG4gICAgaWYgKGZpbGUucGF0aCAhPT0gZXhwZWN0ZWRQYXRoKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIGV4cGVjdGVkUGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKGV4cGVjdGVkUGF0aCkgPz8gZmlsZTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkodXBkYXRlZEZpbGUsIHRoaXMudGFza1RvTWFya2Rvd24odGFzaykpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvclRhc2soaWQpO1xuICAgIGlmIChmaWxlKSBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBtYXJrQ29tcGxldGUoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRhc2sgPSBhd2FpdCB0aGlzLmdldEJ5SWQoaWQpO1xuICAgIGlmICghdGFzaykgcmV0dXJuO1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHtcbiAgICAgIC4uLnRhc2ssXG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgY29tcGxldGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBGaWx0ZXJzICh1c2VkIGJ5IHNtYXJ0IGxpc3RzKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBnZXREdWVUb2RheSgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IHRvZGF5ID0gdGhpcy50b2RheVN0cigpO1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoXG4gICAgICAodCkgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiICYmIHQuc3RhdHVzICE9PSBcImNhbmNlbGxlZFwiICYmIHQuZHVlRGF0ZSA9PT0gdG9kYXlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgZ2V0T3ZlcmR1ZSgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IHRvZGF5ID0gdGhpcy50b2RheVN0cigpO1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoXG4gICAgICAodCkgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiICYmIHQuc3RhdHVzICE9PSBcImNhbmNlbGxlZFwiICYmICEhdC5kdWVEYXRlICYmIHQuZHVlRGF0ZSA8IHRvZGF5XG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldFNjaGVkdWxlZCgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoXG4gICAgICAodCkgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiICYmIHQuc3RhdHVzICE9PSBcImNhbmNlbGxlZFwiICYmICEhdC5kdWVEYXRlXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldEZsYWdnZWQoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKCh0KSA9PiB0LnByaW9yaXR5ID09PSBcImhpZ2hcIiAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNlcmlhbGlzYXRpb24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSB0YXNrVG9NYXJrZG93bih0YXNrOiBDaHJvbmljbGVUYXNrKTogc3RyaW5nIHtcbiAgICBjb25zdCBmbTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICBpZDogICAgICAgICAgICAgICAgIHRhc2suaWQsXG4gICAgICB0aXRsZTogICAgICAgICAgICAgIHRhc2sudGl0bGUsXG4gICAgICBzdGF0dXM6ICAgICAgICAgICAgIHRhc2suc3RhdHVzLFxuICAgICAgcHJpb3JpdHk6ICAgICAgICAgICB0YXNrLnByaW9yaXR5LFxuICAgICAgdGFnczogICAgICAgICAgICAgICB0YXNrLnRhZ3MsXG4gICAgICBjb250ZXh0czogICAgICAgICAgIHRhc2suY29udGV4dHMsXG4gICAgICBwcm9qZWN0czogICAgICAgICAgIHRhc2sucHJvamVjdHMsXG4gICAgICBcImxpbmtlZC1ub3Rlc1wiOiAgICAgdGFzay5saW5rZWROb3RlcyxcbiAgICAgIFwiY2FsZW5kYXItaWRcIjogICAgICB0YXNrLmNhbGVuZGFySWQgPz8gbnVsbCxcbiAgICAgIFwiZHVlLWRhdGVcIjogICAgICAgICB0YXNrLmR1ZURhdGUgPz8gbnVsbCxcbiAgICAgIFwiZHVlLXRpbWVcIjogICAgICAgICB0YXNrLmR1ZVRpbWUgPz8gbnVsbCxcbiAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgdGFzay5yZWN1cnJlbmNlID8/IG51bGwsXG4gICAgICBcInRpbWUtZXN0aW1hdGVcIjogICAgdGFzay50aW1lRXN0aW1hdGUgPz8gbnVsbCxcbiAgICAgIFwidGltZS1lbnRyaWVzXCI6ICAgICB0YXNrLnRpbWVFbnRyaWVzLFxuICAgICAgXCJjdXN0b20tZmllbGRzXCI6ICAgIHRhc2suY3VzdG9tRmllbGRzLFxuICAgICAgXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCI6IHRhc2suY29tcGxldGVkSW5zdGFuY2VzLFxuICAgICAgXCJjcmVhdGVkLWF0XCI6ICAgICAgIHRhc2suY3JlYXRlZEF0LFxuICAgICAgXCJjb21wbGV0ZWQtYXRcIjogICAgIHRhc2suY29tcGxldGVkQXQgPz8gbnVsbCxcbiAgICB9O1xuXG4gICAgY29uc3QgeWFtbCA9IE9iamVjdC5lbnRyaWVzKGZtKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHtKU09OLnN0cmluZ2lmeSh2KX1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCBib2R5ID0gdGFzay5ub3RlcyA/IGBcXG4ke3Rhc2subm90ZXN9YCA6IFwiXCI7XG4gICAgcmV0dXJuIGAtLS1cXG4ke3lhbWx9XFxuLS0tXFxuJHtib2R5fWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGZpbGVUb1Rhc2soZmlsZTogVEZpbGUpOiBQcm9taXNlPENocm9uaWNsZVRhc2sgfCBudWxsPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgICBjb25zdCBmbSA9IGNhY2hlPy5mcm9udG1hdHRlcjtcbiAgICAgIGlmICghZm0/LmlkIHx8ICFmbT8udGl0bGUpIHJldHVybiBudWxsO1xuXG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICAgIGNvbnN0IGJvZHlNYXRjaCA9IGNvbnRlbnQubWF0Y2goL14tLS1cXG5bXFxzXFxTXSo/XFxuLS0tXFxuKFtcXHNcXFNdKikkLyk7XG4gICAgICBjb25zdCBub3RlcyA9IGJvZHlNYXRjaD8uWzFdPy50cmltKCkgfHwgdW5kZWZpbmVkO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZDogICAgICAgICAgICAgICAgIGZtLmlkLFxuICAgICAgICB0aXRsZTogICAgICAgICAgICAgIGZtLnRpdGxlLFxuICAgICAgICBzdGF0dXM6ICAgICAgICAgICAgIChmbS5zdGF0dXMgYXMgVGFza1N0YXR1cykgPz8gXCJ0b2RvXCIsXG4gICAgICAgIHByaW9yaXR5OiAgICAgICAgICAgKGZtLnByaW9yaXR5IGFzIFRhc2tQcmlvcml0eSkgPz8gXCJub25lXCIsXG4gICAgICAgIGR1ZURhdGU6ICAgICAgICAgICAgZm1bXCJkdWUtZGF0ZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGR1ZVRpbWU6ICAgICAgICAgICAgZm1bXCJkdWUtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgZm0ucmVjdXJyZW5jZSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGNhbGVuZGFySWQ6ICAgICAgICAgZm1bXCJjYWxlbmRhci1pZFwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgZm0udGFncyA/PyBbXSxcbiAgICAgICAgY29udGV4dHM6ICAgICAgICAgICBmbS5jb250ZXh0cyA/PyBbXSxcbiAgICAgICAgbGlua2VkTm90ZXM6ICAgICAgICBmbVtcImxpbmtlZC1ub3Rlc1wiXSA/PyBbXSxcbiAgICAgICAgcHJvamVjdHM6ICAgICAgICAgICBmbS5wcm9qZWN0cyA/PyBbXSxcbiAgICAgICAgdGltZUVzdGltYXRlOiAgICAgICBmbVtcInRpbWUtZXN0aW1hdGVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICB0aW1lRW50cmllczogICAgICAgIGZtW1widGltZS1lbnRyaWVzXCJdID8/IFtdLFxuICAgICAgICBjdXN0b21GaWVsZHM6ICAgICAgIGZtW1wiY3VzdG9tLWZpZWxkc1wiXSA/PyBbXSxcbiAgICAgICAgY29tcGxldGVkSW5zdGFuY2VzOiBmbVtcImNvbXBsZXRlZC1pbnN0YW5jZXNcIl0gPz8gW10sXG4gICAgICAgIGNyZWF0ZWRBdDogICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgY29tcGxldGVkQXQ6ICAgICAgICBmbVtcImNvbXBsZXRlZC1hdFwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIG5vdGVzLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgZmluZEZpbGVGb3JUYXNrKGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIG51bGw7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmICghKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoY2hpbGQpO1xuICAgICAgaWYgKGNhY2hlPy5mcm9udG1hdHRlcj8uaWQgPT09IGlkKSByZXR1cm4gY2hpbGQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy50YXNrc0ZvbGRlcikpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcih0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYHRhc2stJHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA2KX1gO1xuICB9XG5cbiAgcHJpdmF0ZSB0b2RheVN0cigpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgVEZpbGUsIG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZUV2ZW50LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCwgcHJpdmF0ZSBldmVudHNGb2xkZXI6IHN0cmluZykge31cblxuICBhc3luYyBnZXRBbGwoKTogUHJvbWlzZTxDaHJvbmljbGVFdmVudFtdPiB7XG4gICAgY29uc3QgZm9sZGVyID0gdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMuZXZlbnRzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdID0gW107XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRGaWxlICYmIGNoaWxkLmV4dGVuc2lvbiA9PT0gXCJtZFwiKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50ID0gYXdhaXQgdGhpcy5maWxlVG9FdmVudChjaGlsZCk7XG4gICAgICAgIGlmIChldmVudCkgZXZlbnRzLnB1c2goZXZlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZXZlbnRzO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlKGV2ZW50OiBPbWl0PENocm9uaWNsZUV2ZW50LCBcImlkXCIgfCBcImNyZWF0ZWRBdFwiPik6IFByb21pc2U8Q2hyb25pY2xlRXZlbnQ+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcigpO1xuXG4gICAgY29uc3QgZnVsbDogQ2hyb25pY2xlRXZlbnQgPSB7XG4gICAgICAuLi5ldmVudCxcbiAgICAgIGlkOiB0aGlzLmdlbmVyYXRlSWQoKSxcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICBjb25zdCBwYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLmV2ZW50c0ZvbGRlcn0vJHtmdWxsLnRpdGxlfS5tZGApO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCB0aGlzLmV2ZW50VG9NYXJrZG93bihmdWxsKSk7XG4gICAgcmV0dXJuIGZ1bGw7XG4gIH1cblxuICBhc3luYyB1cGRhdGUoZXZlbnQ6IENocm9uaWNsZUV2ZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JFdmVudChldmVudC5pZCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG5cbiAgICBjb25zdCBleHBlY3RlZFBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMuZXZlbnRzRm9sZGVyfS8ke2V2ZW50LnRpdGxlfS5tZGApO1xuICAgIGlmIChmaWxlLnBhdGggIT09IGV4cGVjdGVkUGF0aCkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAuZmlsZU1hbmFnZXIucmVuYW1lRmlsZShmaWxlLCBleHBlY3RlZFBhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZUJ5UGF0aChleHBlY3RlZFBhdGgpID8/IGZpbGU7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KHVwZGF0ZWRGaWxlLCB0aGlzLmV2ZW50VG9NYXJrZG93bihldmVudCkpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvckV2ZW50KGlkKTtcbiAgICBpZiAoZmlsZSkgYXdhaXQgdGhpcy5hcHAudmF1bHQuZGVsZXRlKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgZ2V0SW5SYW5nZShzdGFydERhdGU6IHN0cmluZywgZW5kRGF0ZTogc3RyaW5nKTogUHJvbWlzZTxDaHJvbmljbGVFdmVudFtdPiB7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcigoZSkgPT4gZS5zdGFydERhdGUgPj0gc3RhcnREYXRlICYmIGUuc3RhcnREYXRlIDw9IGVuZERhdGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBldmVudFRvTWFya2Rvd24oZXZlbnQ6IENocm9uaWNsZUV2ZW50KTogc3RyaW5nIHtcbiAgICBjb25zdCBmbTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICBpZDogICAgICAgICAgICAgICAgICAgZXZlbnQuaWQsXG4gICAgICB0aXRsZTogICAgICAgICAgICAgICAgZXZlbnQudGl0bGUsXG4gICAgICBsb2NhdGlvbjogICAgICAgICAgICAgZXZlbnQubG9jYXRpb24gPz8gbnVsbCxcbiAgICAgIFwiYWxsLWRheVwiOiAgICAgICAgICAgIGV2ZW50LmFsbERheSxcbiAgICAgIFwic3RhcnQtZGF0ZVwiOiAgICAgICAgIGV2ZW50LnN0YXJ0RGF0ZSxcbiAgICAgIFwic3RhcnQtdGltZVwiOiAgICAgICAgIGV2ZW50LnN0YXJ0VGltZSA/PyBudWxsLFxuICAgICAgXCJlbmQtZGF0ZVwiOiAgICAgICAgICAgZXZlbnQuZW5kRGF0ZSxcbiAgICAgIFwiZW5kLXRpbWVcIjogICAgICAgICAgIGV2ZW50LmVuZFRpbWUgPz8gbnVsbCxcbiAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICBldmVudC5yZWN1cnJlbmNlID8/IG51bGwsXG4gICAgICBcImNhbGVuZGFyLWlkXCI6ICAgICAgICBldmVudC5jYWxlbmRhcklkID8/IG51bGwsXG4gICAgICBhbGVydDogICAgICAgICAgICAgICAgZXZlbnQuYWxlcnQsXG4gICAgICBcImxpbmtlZC10YXNrLWlkc1wiOiAgICBldmVudC5saW5rZWRUYXNrSWRzLFxuICAgICAgXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCI6IGV2ZW50LmNvbXBsZXRlZEluc3RhbmNlcyxcbiAgICAgIFwiY3JlYXRlZC1hdFwiOiAgICAgICAgIGV2ZW50LmNyZWF0ZWRBdCxcbiAgICB9O1xuXG4gICAgY29uc3QgeWFtbCA9IE9iamVjdC5lbnRyaWVzKGZtKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHtKU09OLnN0cmluZ2lmeSh2KX1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCBib2R5ID0gZXZlbnQubm90ZXMgPyBgXFxuJHtldmVudC5ub3Rlc31gIDogXCJcIjtcbiAgICByZXR1cm4gYC0tLVxcbiR7eWFtbH1cXG4tLS1cXG4ke2JvZHl9YDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmlsZVRvRXZlbnQoZmlsZTogVEZpbGUpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50IHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgICAgY29uc3QgZm0gPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG4gICAgICBpZiAoIWZtPy5pZCB8fCAhZm0/LnRpdGxlKSByZXR1cm4gbnVsbDtcblxuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBjb25zdCBib2R5TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eLS0tXFxuW1xcc1xcU10qP1xcbi0tLVxcbihbXFxzXFxTXSopJC8pO1xuICAgICAgY29uc3Qgbm90ZXMgPSBib2R5TWF0Y2g/LlsxXT8udHJpbSgpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6ICAgICAgICAgICAgICAgICAgIGZtLmlkLFxuICAgICAgICB0aXRsZTogICAgICAgICAgICAgICAgZm0udGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICAgICAgICAgICBmbS5sb2NhdGlvbiA/PyB1bmRlZmluZWQsXG4gICAgICAgIGFsbERheTogICAgICAgICAgICAgICBmbVtcImFsbC1kYXlcIl0gPz8gdHJ1ZSxcbiAgICAgICAgc3RhcnREYXRlOiAgICAgICAgICAgIGZtW1wic3RhcnQtZGF0ZVwiXSxcbiAgICAgICAgc3RhcnRUaW1lOiAgICAgICAgICAgIGZtW1wic3RhcnQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGVuZERhdGU6ICAgICAgICAgICAgICBmbVtcImVuZC1kYXRlXCJdLFxuICAgICAgICBlbmRUaW1lOiAgICAgICAgICAgICAgZm1bXCJlbmQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICBmbS5yZWN1cnJlbmNlID8/IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsZW5kYXJJZDogICAgICAgICAgIGZtW1wiY2FsZW5kYXItaWRcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBhbGVydDogICAgICAgICAgICAgICAgKGZtLmFsZXJ0IGFzIEFsZXJ0T2Zmc2V0KSA/PyBcIm5vbmVcIixcbiAgICAgICAgbGlua2VkVGFza0lkczogICAgICAgIGZtW1wibGlua2VkLXRhc2staWRzXCJdID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6ICAgZm1bXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCJdID8/IFtdLFxuICAgICAgICBjcmVhdGVkQXQ6ICAgICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgbm90ZXMsXG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5kRmlsZUZvckV2ZW50KGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLmV2ZW50c0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBudWxsO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoIShjaGlsZCBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGNoaWxkKTtcbiAgICAgIGlmIChjYWNoZT8uZnJvbnRtYXR0ZXI/LmlkID09PSBpZCkgcmV0dXJuIGNoaWxkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMuZXZlbnRzRm9sZGVyKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKHRoaXMuZXZlbnRzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGV2ZW50LSR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNil9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZVRhc2ssIENocm9uaWNsZUNhbGVuZGFyIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL1Rhc2tNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcblxuZXhwb3J0IGNvbnN0IFRBU0tfVklFV19UWVBFID0gXCJjaHJvbmljbGUtdGFzay12aWV3XCI7XG5cbmV4cG9ydCBjbGFzcyBUYXNrVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSB0YXNrTWFuYWdlcjogVGFza01hbmFnZXI7XG4gIHByaXZhdGUgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXI7XG4gIHByaXZhdGUgY3VycmVudExpc3RJZDogc3RyaW5nID0gXCJ0b2RheVwiO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICAgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyLFxuICAgIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyXG4gICkge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMudGFza01hbmFnZXIgPSB0YXNrTWFuYWdlcjtcbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IGNhbGVuZGFyTWFuYWdlcjtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7IHJldHVybiBUQVNLX1ZJRVdfVFlQRTsgfVxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gXCJDaHJvbmljbGVcIjsgfVxuICBnZXRJY29uKCk6IHN0cmluZyB7IHJldHVybiBcImNoZWNrLWNpcmNsZVwiOyB9XG5cbiAgYXN5bmMgb25PcGVuKCkgeyBhd2FpdCB0aGlzLnJlbmRlcigpOyB9XG5cbiAgYXN5bmMgcmVuZGVyKCkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29udGFpbmVyLmVtcHR5KCk7XG4gICAgY29udGFpbmVyLmFkZENsYXNzKFwiY2hyb25pY2xlLWFwcFwiKTtcblxuICAgIGNvbnN0IGFsbCAgICAgID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRBbGwoKTtcbiAgICBjb25zdCB0b2RheSAgICA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0RHVlVG9kYXkoKTtcbiAgICBjb25zdCBzY2hlZHVsZWQgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldFNjaGVkdWxlZCgpO1xuICAgIGNvbnN0IGZsYWdnZWQgID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRGbGFnZ2VkKCk7XG4gICAgY29uc3Qgb3ZlcmR1ZSAgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldE92ZXJkdWUoKTtcbiAgICBjb25zdCBjYWxlbmRhcnMgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRBbGwoKTtcblxuICAgIGNvbnN0IGxheW91dCAgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxheW91dFwiKTtcbiAgICBjb25zdCBzaWRlYmFyID0gbGF5b3V0LmNyZWF0ZURpdihcImNocm9uaWNsZS1zaWRlYmFyXCIpO1xuICAgIGNvbnN0IG1haW4gICAgPSBsYXlvdXQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1haW5cIik7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgU21hcnQgbGlzdCB0aWxlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB0aWxlc0dyaWQgPSBzaWRlYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlc1wiKTtcblxuICAgIGNvbnN0IHRpbGVzID0gW1xuICAgICAgeyBpZDogXCJ0b2RheVwiLCAgICAgbGFiZWw6IFwiVG9kYXlcIiwgICAgIGNvdW50OiB0b2RheS5sZW5ndGggKyBvdmVyZHVlLmxlbmd0aCwgY29sb3I6IFwiI0ZGM0IzMFwiLCBiYWRnZTogb3ZlcmR1ZS5sZW5ndGggfSxcbiAgICAgIHsgaWQ6IFwic2NoZWR1bGVkXCIsIGxhYmVsOiBcIlNjaGVkdWxlZFwiLCBjb3VudDogc2NoZWR1bGVkLmxlbmd0aCwgICAgICAgICAgICAgIGNvbG9yOiBcIiMzNzhBRERcIiwgYmFkZ2U6IDAgfSxcbiAgICAgIHsgaWQ6IFwiYWxsXCIsICAgICAgIGxhYmVsOiBcIkFsbFwiLCAgICAgICBjb3VudDogYWxsLmZpbHRlcih0ID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIikubGVuZ3RoLCBjb2xvcjogXCIjNjM2MzY2XCIsIGJhZGdlOiAwIH0sXG4gICAgICB7IGlkOiBcImZsYWdnZWRcIiwgICBsYWJlbDogXCJGbGFnZ2VkXCIsICAgY291bnQ6IGZsYWdnZWQubGVuZ3RoLCAgICAgICAgICAgICAgICBjb2xvcjogXCIjRkY5NTAwXCIsIGJhZGdlOiAwIH0sXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgdGlsZSBvZiB0aWxlcykge1xuICAgICAgY29uc3QgdCA9IHRpbGVzR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGlsZVwiKTtcbiAgICAgIHQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGlsZS5jb2xvcjtcbiAgICAgIGlmICh0aWxlLmlkID09PSB0aGlzLmN1cnJlbnRMaXN0SWQpIHQuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG5cbiAgICAgIGNvbnN0IHRvcFJvdyA9IHQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtdG9wXCIpO1xuICAgICAgdG9wUm93LmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlLWNvdW50XCIpLnNldFRleHQoU3RyaW5nKHRpbGUuY291bnQpKTtcblxuICAgICAgaWYgKHRpbGUuYmFkZ2UgPiAwKSB7XG4gICAgICAgIGNvbnN0IGJhZGdlID0gdG9wUm93LmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlLWJhZGdlXCIpO1xuICAgICAgICBiYWRnZS5zZXRUZXh0KFN0cmluZyh0aWxlLmJhZGdlKSk7XG4gICAgICAgIGJhZGdlLnRpdGxlID0gYCR7dGlsZS5iYWRnZX0gb3ZlcmR1ZWA7XG4gICAgICB9XG5cbiAgICAgIHQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtbGFiZWxcIikuc2V0VGV4dCh0aWxlLmxhYmVsKTtcbiAgICAgIHQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50TGlzdElkID0gdGlsZS5pZDsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE15IExpc3RzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGxpc3RzU2VjdGlvbiA9IHNpZGViYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3RzLXNlY3Rpb25cIik7XG4gICAgbGlzdHNTZWN0aW9uLmNyZWF0ZURpdihcImNocm9uaWNsZS1zZWN0aW9uLWxhYmVsXCIpLnNldFRleHQoXCJNeSBMaXN0c1wiKTtcblxuICAgIGZvciAoY29uc3QgY2FsIG9mIGNhbGVuZGFycykge1xuICAgICAgY29uc3Qgcm93ID0gbGlzdHNTZWN0aW9uLmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LXJvd1wiKTtcbiAgICAgIGlmIChjYWwuaWQgPT09IHRoaXMuY3VycmVudExpc3RJZCkgcm93LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuXG4gICAgICBjb25zdCBkb3QgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3QtZG90XCIpO1xuICAgICAgZG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcik7XG5cbiAgICAgIHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1uYW1lXCIpLnNldFRleHQoY2FsLm5hbWUpO1xuXG4gICAgICBjb25zdCBjYWxDb3VudCA9IGFsbC5maWx0ZXIodCA9PiB0LmNhbGVuZGFySWQgPT09IGNhbC5pZCAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpLmxlbmd0aDtcbiAgICAgIGlmIChjYWxDb3VudCA+IDApIHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1jb3VudFwiKS5zZXRUZXh0KFN0cmluZyhjYWxDb3VudCkpO1xuXG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50TGlzdElkID0gY2FsLmlkOyB0aGlzLnJlbmRlcigpOyB9KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTWFpbiBwYW5lbCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBhd2FpdCB0aGlzLnJlbmRlck1haW5QYW5lbChtYWluLCBhbGwsIG92ZXJkdWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZW5kZXJNYWluUGFuZWwoXG4gICAgbWFpbjogSFRNTEVsZW1lbnQsXG4gICAgYWxsOiBDaHJvbmljbGVUYXNrW10sXG4gICAgb3ZlcmR1ZTogQ2hyb25pY2xlVGFza1tdXG4gICkge1xuICAgIGNvbnN0IGhlYWRlciA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1haW4taGVhZGVyXCIpO1xuICAgIGNvbnN0IHRpdGxlRWwgPSBoZWFkZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1haW4tdGl0bGVcIik7XG5cbiAgICBsZXQgdGFza3M6IENocm9uaWNsZVRhc2tbXSA9IFtdO1xuXG4gICAgY29uc3Qgc21hcnRDb2xvcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICB0b2RheTogXCIjRkYzQjMwXCIsIHNjaGVkdWxlZDogXCIjMzc4QUREXCIsIGFsbDogXCIjNjM2MzY2XCIsIGZsYWdnZWQ6IFwiI0ZGOTUwMFwiXG4gICAgfTtcblxuICAgIGlmIChzbWFydENvbG9yc1t0aGlzLmN1cnJlbnRMaXN0SWRdKSB7XG4gICAgICBjb25zdCBsYWJlbHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICAgIHRvZGF5OiBcIlRvZGF5XCIsIHNjaGVkdWxlZDogXCJTY2hlZHVsZWRcIiwgYWxsOiBcIkFsbFwiLCBmbGFnZ2VkOiBcIkZsYWdnZWRcIlxuICAgICAgfTtcbiAgICAgIHRpdGxlRWwuc2V0VGV4dChsYWJlbHNbdGhpcy5jdXJyZW50TGlzdElkXSk7XG4gICAgICB0aXRsZUVsLnN0eWxlLmNvbG9yID0gc21hcnRDb2xvcnNbdGhpcy5jdXJyZW50TGlzdElkXTtcblxuICAgICAgc3dpdGNoICh0aGlzLmN1cnJlbnRMaXN0SWQpIHtcbiAgICAgICAgY2FzZSBcInRvZGF5XCI6XG4gICAgICAgICAgdGFza3MgPSBbLi4ub3ZlcmR1ZSwgLi4uKGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0RHVlVG9kYXkoKSldO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwic2NoZWR1bGVkXCI6XG4gICAgICAgICAgdGFza3MgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldFNjaGVkdWxlZCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZmxhZ2dlZFwiOlxuICAgICAgICAgIHRhc2tzID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRGbGFnZ2VkKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJhbGxcIjpcbiAgICAgICAgICB0YXNrcyA9IGFsbC5maWx0ZXIodCA9PiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKHRoaXMuY3VycmVudExpc3RJZCk7XG4gICAgICB0aXRsZUVsLnNldFRleHQoY2FsPy5uYW1lID8/IFwiTGlzdFwiKTtcbiAgICAgIHRpdGxlRWwuc3R5bGUuY29sb3IgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCJ2YXIoLS10ZXh0LW5vcm1hbClcIjtcbiAgICAgIHRhc2tzID0gYWxsLmZpbHRlcih0ID0+IHQuY2FsZW5kYXJJZCA9PT0gdGhpcy5jdXJyZW50TGlzdElkICYmIHQuc3RhdHVzICE9PSBcImRvbmVcIik7XG4gICAgfVxuXG4gICAgLy8gVGFzayBjb3VudCBzdWJ0aXRsZVxuICAgIGNvbnN0IGFjdGl2ZVRhc2tzID0gdGFza3MuZmlsdGVyKHQgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgICBpZiAoYWN0aXZlVGFza3MubGVuZ3RoID4gMCkge1xuICAgICAgaGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluLXN1YnRpdGxlXCIpLnNldFRleHQoXG4gICAgICAgIGAke2FjdGl2ZVRhc2tzLmxlbmd0aH0gJHthY3RpdmVUYXNrcy5sZW5ndGggPT09IDEgPyBcInRhc2tcIiA6IFwidGFza3NcIn1gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGxpc3RFbCA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stbGlzdFwiKTtcblxuICAgIGlmICh0YXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMucmVuZGVyRW1wdHlTdGF0ZShsaXN0RWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBncm91cHMgPSB0aGlzLmdyb3VwVGFza3ModGFza3MpO1xuICAgICAgZm9yIChjb25zdCBbZ3JvdXAsIGdyb3VwVGFza3NdIG9mIE9iamVjdC5lbnRyaWVzKGdyb3VwcykpIHtcbiAgICAgICAgaWYgKGdyb3VwVGFza3MubGVuZ3RoID09PSAwKSBjb250aW51ZTtcbiAgICAgICAgbGlzdEVsLmNyZWF0ZURpdihcImNocm9uaWNsZS1ncm91cC1sYWJlbFwiKS5zZXRUZXh0KGdyb3VwKTtcbiAgICAgICAgZm9yIChjb25zdCB0YXNrIG9mIGdyb3VwVGFza3MpIHtcbiAgICAgICAgICB0aGlzLnJlbmRlclRhc2tSb3cobGlzdEVsLCB0YXNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElubGluZSBuZXcgdGFzayBlbnRyeVxuICAgIGNvbnN0IG5ld1JvdyA9IGxpc3RFbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbmV3LXRhc2stcm93XCIpO1xuICAgIGNvbnN0IHBsdXNJY29uID0gbmV3Um93LmNyZWF0ZURpdihcImNocm9uaWNsZS1uZXctdGFzay1wbHVzXCIpO1xuICAgIHBsdXNJY29uLnNldFRleHQoXCIrXCIpO1xuICAgIGNvbnN0IG5ld0lucHV0ID0gbmV3Um93LmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJOZXcgcmVtaW5kZXIuLi5cIixcbiAgICAgIGNsczogXCJjaHJvbmljbGUtbmV3LXRhc2staW5wdXRcIlxuICAgIH0pO1xuXG4gICAgbmV3SW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiICYmIG5ld0lucHV0LnZhbHVlLnRyaW0oKSkge1xuICAgICAgICBjb25zdCBjYWxlbmRhcklkID0gc21hcnRDb2xvcnNbdGhpcy5jdXJyZW50TGlzdElkXVxuICAgICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgICAgOiB0aGlzLmN1cnJlbnRMaXN0SWQ7XG4gICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIuY3JlYXRlKHtcbiAgICAgICAgICB0aXRsZTogbmV3SW5wdXQudmFsdWUudHJpbSgpLFxuICAgICAgICAgIHN0YXR1czogXCJ0b2RvXCIsXG4gICAgICAgICAgcHJpb3JpdHk6IHRoaXMuY3VycmVudExpc3RJZCA9PT0gXCJmbGFnZ2VkXCIgPyBcImhpZ2hcIiA6IFwibm9uZVwiLFxuICAgICAgICAgIGNhbGVuZGFySWQsXG4gICAgICAgICAgdGFnczogW10sIGNvbnRleHRzOiBbXSwgbGlua2VkTm90ZXM6IFtdLCBwcm9qZWN0czogW10sXG4gICAgICAgICAgdGltZUVudHJpZXM6IFtdLCBjdXN0b21GaWVsZHM6IFtdLCBjb21wbGV0ZWRJbnN0YW5jZXM6IFtdLFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH1cbiAgICAgIGlmIChlLmtleSA9PT0gXCJFc2NhcGVcIikgbmV3SW5wdXQuYmx1cigpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJFbXB0eVN0YXRlKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBlbXB0eSA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZW1wdHktc3RhdGVcIik7XG4gICAgY29uc3QgaWNvbiA9IGVtcHR5LmNyZWF0ZURpdihcImNocm9uaWNsZS1lbXB0eS1pY29uXCIpO1xuICAgIGljb24uaW5uZXJIVE1MID0gYDxzdmcgd2lkdGg9XCI0OFwiIGhlaWdodD1cIjQ4XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS4yXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+PHBhdGggZD1cIk0yMiAxMS4wOFYxMmExMCAxMCAwIDEgMS01LjkzLTkuMTRcIi8+PHBvbHlsaW5lIHBvaW50cz1cIjIyIDQgMTIgMTQuMDEgOSAxMS4wMVwiLz48L3N2Zz5gO1xuICAgIGVtcHR5LmNyZWF0ZURpdihcImNocm9uaWNsZS1lbXB0eS10aXRsZVwiKS5zZXRUZXh0KFwiQWxsIGRvbmVcIik7XG4gICAgZW1wdHkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWVtcHR5LXN1YnRpdGxlXCIpLnNldFRleHQoXCJOb3RoaW5nIGxlZnQgaW4gdGhpcyBsaXN0LlwiKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyVGFza1Jvdyhjb250YWluZXI6IEhUTUxFbGVtZW50LCB0YXNrOiBDaHJvbmljbGVUYXNrKSB7XG4gICAgY29uc3Qgcm93ID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLXJvd1wiKTtcbiAgICBjb25zdCBpc0RvbmUgPSB0YXNrLnN0YXR1cyA9PT0gXCJkb25lXCI7XG5cbiAgICAvLyBDaGVja2JveFxuICAgIGNvbnN0IGNoZWNrYm94V3JhcCA9IHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2hlY2tib3gtd3JhcFwiKTtcbiAgICBjb25zdCBjaGVja2JveCA9IGNoZWNrYm94V3JhcC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2hlY2tib3hcIik7XG4gICAgaWYgKGlzRG9uZSkgY2hlY2tib3guYWRkQ2xhc3MoXCJkb25lXCIpO1xuXG4gICAgLy8gQ2hlY2ttYXJrIFNWRyBpbnNpZGUgY2hlY2tib3hcbiAgICBjb25zdCBjaGVja1N2ZyA9IGA8c3ZnIGNsYXNzPVwiY2hyb25pY2xlLWNoZWNrbWFya1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiNmZmZcIiBzdHJva2Utd2lkdGg9XCIzXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+PHBvbHlsaW5lIHBvaW50cz1cIjIwIDYgOSAxNyA0IDEyXCIvPjwvc3ZnPmA7XG4gICAgY2hlY2tib3guaW5uZXJIVE1MID0gY2hlY2tTdmc7XG5cbiAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBjaGVja2JveC5hZGRDbGFzcyhcImNvbXBsZXRpbmdcIik7XG4gICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci51cGRhdGUoe1xuICAgICAgICAgIC4uLnRhc2ssXG4gICAgICAgICAgc3RhdHVzOiBpc0RvbmUgPyBcInRvZG9cIiA6IFwiZG9uZVwiLFxuICAgICAgICAgIGNvbXBsZXRlZEF0OiBpc0RvbmUgPyB1bmRlZmluZWQgOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCB0aGlzLnJlbmRlcigpO1xuICAgICAgfSwgMzAwKTtcbiAgICB9KTtcblxuICAgIC8vIENvbnRlbnQgXHUyMDE0IGNsaWNraW5nIG9wZW5zIHRoZSBub3RlXG4gICAgY29uc3QgY29udGVudCA9IHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1jb250ZW50XCIpO1xuICAgIGNvbnRlbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMub3BlblRhc2tOb3RlKHRhc2spKTtcblxuICAgIGNvbnN0IHRpdGxlRWwgPSBjb250ZW50LmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLXRpdGxlXCIpO1xuICAgIHRpdGxlRWwuc2V0VGV4dCh0YXNrLnRpdGxlKTtcbiAgICBpZiAoaXNEb25lKSB0aXRsZUVsLmFkZENsYXNzKFwiZG9uZVwiKTtcblxuICAgIC8vIE1ldGFcbiAgICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgaWYgKHRhc2suZHVlRGF0ZSB8fCB0YXNrLmNhbGVuZGFySWQpIHtcbiAgICAgIGNvbnN0IG1ldGEgPSBjb250ZW50LmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLW1ldGFcIik7XG5cbiAgICAgIGlmICh0YXNrLmR1ZURhdGUpIHtcbiAgICAgICAgY29uc3QgbWV0YURhdGUgPSBtZXRhLmNyZWF0ZVNwYW4oXCJjaHJvbmljbGUtdGFzay1kYXRlXCIpO1xuICAgICAgICBtZXRhRGF0ZS5zZXRUZXh0KHRoaXMuZm9ybWF0RGF0ZSh0YXNrLmR1ZURhdGUpKTtcbiAgICAgICAgaWYgKHRhc2suZHVlRGF0ZSA8IHRvZGF5KSBtZXRhRGF0ZS5hZGRDbGFzcyhcIm92ZXJkdWVcIik7XG4gICAgICB9XG5cbiAgICAgIGlmICh0YXNrLmNhbGVuZGFySWQpIHtcbiAgICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZCh0YXNrLmNhbGVuZGFySWQpO1xuICAgICAgICBpZiAoY2FsKSB7XG4gICAgICAgICAgY29uc3QgY2FsRG90ID0gbWV0YS5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXRhc2stY2FsLWRvdFwiKTtcbiAgICAgICAgICBjYWxEb3Quc3R5bGUuYmFja2dyb3VuZENvbG9yID0gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKTtcbiAgICAgICAgICBtZXRhLmNyZWF0ZVNwYW4oXCJjaHJvbmljbGUtdGFzay1jYWwtbmFtZVwiKS5zZXRUZXh0KGNhbC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFByaW9yaXR5IGZsYWdcbiAgICBpZiAodGFzay5wcmlvcml0eSA9PT0gXCJoaWdoXCIpIHtcbiAgICAgIGNvbnN0IGZsYWcgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWZsYWdcIik7XG4gICAgICBmbGFnLnNldFRleHQoXCJcdTI2OTFcIik7XG4gICAgfVxuXG4gICAgLy8gUmlnaHQtY2xpY2sgdG8gZGVsZXRlXG4gICAgcm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY29uc3QgbWVudSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBtZW51LmNsYXNzTmFtZSA9IFwiY2hyb25pY2xlLWNvbnRleHQtbWVudVwiO1xuICAgICAgbWVudS5zdHlsZS5sZWZ0ID0gYCR7ZS5jbGllbnRYfXB4YDtcbiAgICAgIG1lbnUuc3R5bGUudG9wICA9IGAke2UuY2xpZW50WX1weGA7XG5cbiAgICAgIGNvbnN0IGRlbGV0ZUl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW0gY2hyb25pY2xlLWNvbnRleHQtZGVsZXRlXCIpO1xuICAgICAgZGVsZXRlSXRlbS5zZXRUZXh0KFwiRGVsZXRlIHRhc2tcIik7XG4gICAgICBkZWxldGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIG1lbnUucmVtb3ZlKCk7XG4gICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIuZGVsZXRlKHRhc2suaWQpO1xuICAgICAgICBhd2FpdCB0aGlzLnJlbmRlcigpO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNhbmNlbEl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW1cIik7XG4gICAgICBjYW5jZWxJdGVtLnNldFRleHQoXCJDYW5jZWxcIik7XG4gICAgICBjYW5jZWxJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBtZW51LnJlbW92ZSgpKTtcblxuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtZW51KTtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IG1lbnUucmVtb3ZlKCksIHsgb25jZTogdHJ1ZSB9KSwgMCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG9wZW5UYXNrTm90ZSh0YXNrOiBDaHJvbmljbGVUYXNrKSB7XG4gICAgY29uc3QgZm9sZGVyID0gdGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdIGFzIHN0cmluZztcbiAgICBjb25zdCBwYXRoID0gYCR7Zm9sZGVyfS8ke3Rhc2sudGl0bGV9Lm1kYDtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ3JvdXBUYXNrcyh0YXNrczogQ2hyb25pY2xlVGFza1tdKTogUmVjb3JkPHN0cmluZywgQ2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgdG9kYXkgICA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgbmV4dFdlZWsgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgNyAqIDg2NDAwMDAwKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIGNvbnN0IGdyb3VwczogUmVjb3JkPHN0cmluZywgQ2hyb25pY2xlVGFza1tdPiA9IHtcbiAgICAgIFwiT3ZlcmR1ZVwiOiAgIFtdLFxuICAgICAgXCJUb2RheVwiOiAgICAgW10sXG4gICAgICBcIlRoaXMgd2Vla1wiOiBbXSxcbiAgICAgIFwiTGF0ZXJcIjogICAgIFtdLFxuICAgICAgXCJObyBkYXRlXCI6ICAgW10sXG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgdGFzayBvZiB0YXNrcykge1xuICAgICAgaWYgKHRhc2suc3RhdHVzID09PSBcImRvbmVcIikgY29udGludWU7XG4gICAgICBpZiAoIXRhc2suZHVlRGF0ZSkgICAgICAgICAgIHsgZ3JvdXBzW1wiTm8gZGF0ZVwiXS5wdXNoKHRhc2spOyAgIGNvbnRpbnVlOyB9XG4gICAgICBpZiAodGFzay5kdWVEYXRlIDwgdG9kYXkpICAgIHsgZ3JvdXBzW1wiT3ZlcmR1ZVwiXS5wdXNoKHRhc2spOyAgIGNvbnRpbnVlOyB9XG4gICAgICBpZiAodGFzay5kdWVEYXRlID09PSB0b2RheSkgIHsgZ3JvdXBzW1wiVG9kYXlcIl0ucHVzaCh0YXNrKTsgICAgIGNvbnRpbnVlOyB9XG4gICAgICBpZiAodGFzay5kdWVEYXRlIDw9IG5leHRXZWVrKXsgZ3JvdXBzW1wiVGhpcyB3ZWVrXCJdLnB1c2godGFzayk7IGNvbnRpbnVlOyB9XG4gICAgICBncm91cHNbXCJMYXRlclwiXS5wdXNoKHRhc2spO1xuICAgIH1cblxuICAgIHJldHVybiBncm91cHM7XG4gIH1cblxuICBwcml2YXRlIGZvcm1hdERhdGUoZGF0ZVN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCB0b2RheSAgICA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgdG9tb3Jyb3cgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgODY0MDAwMDApLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGlmIChkYXRlU3RyID09PSB0b2RheSkgICAgcmV0dXJuIFwiVG9kYXlcIjtcbiAgICBpZiAoZGF0ZVN0ciA9PT0gdG9tb3Jyb3cpIHJldHVybiBcIlRvbW9ycm93XCI7XG4gICAgcmV0dXJuIG5ldyBEYXRlKGRhdGVTdHIgKyBcIlQwMDowMDowMFwiKS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7XG4gICAgICBtb250aDogXCJzaG9ydFwiLCBkYXk6IFwibnVtZXJpY1wiXG4gICAgfSk7XG4gIH1cbn0iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxtQkFBc0M7OztBQzRIL0IsSUFBTSxtQkFBc0M7QUFBQSxFQUNqRCxhQUFhO0FBQUEsRUFDYixjQUFjO0FBQUEsRUFDZCxXQUFXO0FBQUEsSUFDVCxFQUFFLElBQUksWUFBWSxNQUFNLFlBQVksT0FBTyxRQUFVLFdBQVcsTUFBTSxZQUFXLG9CQUFJLEtBQUssR0FBRSxZQUFZLEVBQUU7QUFBQSxJQUMxRyxFQUFFLElBQUksUUFBWSxNQUFNLFFBQVksT0FBTyxTQUFVLFdBQVcsTUFBTSxZQUFXLG9CQUFJLEtBQUssR0FBRSxZQUFZLEVBQUU7QUFBQSxFQUM1RztBQUFBLEVBQ0EsbUJBQW1CO0FBQUEsRUFDbkIsbUJBQW1CO0FBQUEsRUFDbkIscUJBQXFCO0FBQUEsRUFDckIsY0FBYztBQUFBLEVBQ2QsYUFBYTtBQUFBLEVBQ2IsWUFBWTtBQUFBLEVBQ1oscUJBQXFCO0FBQUEsRUFD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LE1BQU0sS0FBSyxhQUFhLEtBQUssZUFBZTtBQUFBLElBQ3JFO0FBR0EsU0FBSyxjQUFjLGdCQUFnQixhQUFhLE1BQU07QUFDcEQsV0FBSyxhQUFhO0FBQUEsSUFDcEIsQ0FBQztBQUdELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxNQUFNLEtBQUssYUFBYTtBQUFBLElBQ3BDLENBQUM7QUFFRCxZQUFRLElBQUkseUJBQW9CO0FBQUEsRUFDbEM7QUFBQSxFQUVBLE1BQU0sZUFBZTtBQUNyQixVQUFNLEVBQUUsVUFBVSxJQUFJLEtBQUs7QUFDM0IsUUFBSSxPQUFPLFVBQVUsZ0JBQWdCLGNBQWMsRUFBRSxDQUFDO0FBQ3RELFFBQUksQ0FBQyxNQUFNO0FBQ1QsYUFBTyxVQUFVLFFBQVEsS0FBSztBQUM5QixZQUFNLEtBQUssYUFBYSxFQUFFLE1BQU0sZ0JBQWdCLFFBQVEsS0FBSyxDQUFDO0FBQUEsSUFDaEU7QUFDQSxjQUFVLFdBQVcsSUFBSTtBQUFBLEVBQzNCO0FBQUEsRUFFRSxXQUFXO0FBQ1QsU0FBSyxJQUFJLFVBQVUsbUJBQW1CLGNBQWM7QUFBQSxFQUN0RDtBQUFBLEVBRUEsTUFBTSxlQUFlO0FBQ25CLFNBQUssV0FBVyxPQUFPLE9BQU8sQ0FBQyxHQUFHLGtCQUFrQixNQUFNLEtBQUssU0FBUyxDQUFDO0FBQUEsRUFDM0U7QUFBQSxFQUVBLE1BQU0sZUFBZTtBQUNuQixVQUFNLEtBQUssU0FBUyxLQUFLLFFBQVE7QUFBQSxFQUNuQztBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
