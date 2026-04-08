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
      { id: "today", label: "Today", count: today.length + overdue.length, color: "#FF3B30" },
      { id: "scheduled", label: "Scheduled", count: scheduled.length, color: "#378ADD" },
      { id: "all", label: "All", count: all.filter((t) => t.status !== "done").length, color: "#555555" },
      { id: "flagged", label: "Flagged", count: flagged.length, color: "#FF9500" }
    ];
    for (const tile of tiles) {
      const t = tilesGrid.createDiv("chronicle-tile");
      t.style.backgroundColor = tile.color;
      if (tile.id === this.currentListId) t.addClass("active");
      t.createDiv("chronicle-tile-count").setText(String(tile.count));
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
      const calTasks = all.filter(
        (t) => t.calendarId === cal.id && t.status !== "done"
      );
      row.createDiv("chronicle-list-count").setText(String(calTasks.length));
      row.addEventListener("click", () => {
        this.currentListId = cal.id;
        this.render();
      });
    }
    await this.renderMainPanel(main, all, overdue, calendars);
  }
  async renderMainPanel(main, all, overdue, calendars) {
    var _a, _b;
    const header = main.createDiv("chronicle-main-header");
    const titleEl = header.createDiv("chronicle-main-title");
    let tasks = [];
    const smartLists = {
      today: "Today",
      scheduled: "Scheduled",
      all: "All",
      flagged: "Flagged"
    };
    if (smartLists[this.currentListId]) {
      titleEl.setText(smartLists[this.currentListId]);
      titleEl.style.color = (_a = {
        today: "#FF3B30",
        scheduled: "#378ADD",
        all: "#555555",
        flagged: "#FF9500"
      }[this.currentListId]) != null ? _a : "var(--text-normal)";
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
      titleEl.setText((_b = cal == null ? void 0 : cal.name) != null ? _b : "List");
      titleEl.style.color = cal ? CalendarManager.colorToHex(cal.color) : "var(--text-normal)";
      tasks = all.filter(
        (t) => t.calendarId === this.currentListId && t.status !== "done"
      );
    }
    const listEl = main.createDiv("chronicle-task-list");
    if (tasks.length === 0) {
      listEl.createDiv("chronicle-empty").setText("No tasks");
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
    const newInput = newRow.createEl("input", {
      type: "text",
      placeholder: "New reminder...",
      cls: "chronicle-new-task-input"
    });
    newInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && newInput.value.trim()) {
        await this.taskManager.create({
          title: newInput.value.trim(),
          status: "todo",
          priority: this.currentListId === "flagged" ? "high" : "none",
          calendarId: Object.values({
            today: void 0,
            scheduled: void 0,
            all: void 0,
            flagged: void 0
          }).includes(this.currentListId) ? void 0 : this.currentListId,
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
    });
  }
  renderTaskRow(container, task) {
    const row = container.createDiv("chronicle-task-row");
    const checkbox = row.createDiv("chronicle-checkbox");
    if (task.status === "done") checkbox.addClass("done");
    checkbox.addEventListener("click", async () => {
      await this.taskManager.update({
        ...task,
        status: task.status === "done" ? "todo" : "done",
        completedAt: task.status === "done" ? void 0 : (/* @__PURE__ */ new Date()).toISOString()
      });
      await this.render();
    });
    const content = row.createDiv("chronicle-task-content");
    const titleEl = content.createDiv("chronicle-task-title");
    titleEl.setText(task.title);
    if (task.status === "done") titleEl.addClass("done");
    if (task.dueDate || task.calendarId) {
      const meta = content.createDiv("chronicle-task-meta");
      if (task.dueDate) {
        const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const metaDate = meta.createDiv("chronicle-task-date");
        metaDate.setText(this.formatDate(task.dueDate));
        if (task.dueDate < today) metaDate.addClass("overdue");
      }
    }
    if (task.priority === "high") {
      row.createDiv("chronicle-flag").setText("\u2691");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3R5cGVzL2luZGV4LnRzIiwgInNyYy9kYXRhL0NhbGVuZGFyTWFuYWdlci50cyIsICJzcmMvZGF0YS9UYXNrTWFuYWdlci50cyIsICJzcmMvZGF0YS9FdmVudE1hbmFnZXIudHMiLCAic3JjL3ZpZXdzL1Rhc2tWaWV3LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBQbHVnaW4sIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZVNldHRpbmdzLCBERUZBVUxUX1NFVFRJTkdTIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IENhbGVuZGFyTWFuYWdlciB9IGZyb20gXCIuL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuL2RhdGEvVGFza01hbmFnZXJcIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuL2RhdGEvRXZlbnRNYW5hZ2VyXCI7XG5pbXBvcnQgeyBUYXNrVmlldywgVEFTS19WSUVXX1RZUEUgfSBmcm9tIFwiLi92aWV3cy9UYXNrVmlld1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaHJvbmljbGVQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5nczogQ2hyb25pY2xlU2V0dGluZ3M7XG4gIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICB0YXNrTWFuYWdlcjogVGFza01hbmFnZXI7XG4gIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyO1xuXG4gIGFzeW5jIG9ubG9hZCgpIHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBuZXcgQ2FsZW5kYXJNYW5hZ2VyKFxuICAgICAgdGhpcy5zZXR0aW5ncy5jYWxlbmRhcnMsXG4gICAgICAoKSA9PiB0aGlzLnNhdmVTZXR0aW5ncygpXG4gICAgKTtcbiAgICB0aGlzLnRhc2tNYW5hZ2VyID0gbmV3IFRhc2tNYW5hZ2VyKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLnRhc2tzRm9sZGVyKTtcbiAgICB0aGlzLmV2ZW50TWFuYWdlciA9IG5ldyBFdmVudE1hbmFnZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MuZXZlbnRzRm9sZGVyKTtcblxuICAgIC8vIFJlZ2lzdGVyIHRoZSB0YXNrIHZpZXdcbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgIFRBU0tfVklFV19UWVBFLFxuICAgICAgKGxlYWYpID0+IG5ldyBUYXNrVmlldyhsZWFmLCB0aGlzLnRhc2tNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlcilcbiAgICApO1xuXG4gICAgLy8gUmliYm9uIGJ1dHRvblxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcImNoZWNrLWNpcmNsZVwiLCBcIkNocm9uaWNsZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmFjdGl2YXRlVmlldygpO1xuICAgIH0pO1xuXG4gICAgLy8gQ29tbWFuZCBwYWxldHRlXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9wZW4tY2hyb25pY2xlXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gQ2hyb25pY2xlXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5hY3RpdmF0ZVZpZXcoKSxcbiAgICB9KTtcblxuICAgIGNvbnNvbGUubG9nKFwiQ2hyb25pY2xlIGxvYWRlZCBcdTI3MTNcIik7XG4gIH1cblxuICBhc3luYyBhY3RpdmF0ZVZpZXcoKSB7XG4gIGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcbiAgbGV0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfVklFV19UWVBFKVswXTtcbiAgaWYgKCFsZWFmKSB7XG4gICAgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogVEFTS19WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgfVxuICB3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbn1cblxuICBvbnVubG9hZCgpIHtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFRBU0tfVklFV19UWVBFKTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG59IiwgIi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDYWxlbmRhcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIENhbGVuZGFyQ29sb3IgPVxuICB8IFwiYmx1ZVwiIHwgXCJncmVlblwiIHwgXCJwdXJwbGVcIiB8IFwib3JhbmdlXCJcbiAgfCBcInJlZFwiIHwgXCJ0ZWFsXCIgfCBcInBpbmtcIiB8IFwieWVsbG93XCIgfCBcImdyYXlcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVDYWxlbmRhciB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgY29sb3I6IENhbGVuZGFyQ29sb3I7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBpc1Zpc2libGU6IGJvb2xlYW47XG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgVGFza3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIFRhc2tTdGF0dXMgPSBcInRvZG9cIiB8IFwiaW4tcHJvZ3Jlc3NcIiB8IFwiZG9uZVwiIHwgXCJjYW5jZWxsZWRcIjtcbmV4cG9ydCB0eXBlIFRhc2tQcmlvcml0eSA9IFwibm9uZVwiIHwgXCJsb3dcIiB8IFwibWVkaXVtXCIgfCBcImhpZ2hcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUaW1lRW50cnkge1xuICBzdGFydFRpbWU6IHN0cmluZzsgICAvLyBJU08gODYwMVxuICBlbmRUaW1lPzogc3RyaW5nOyAgICAvLyBJU08gODYwMVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEN1c3RvbUZpZWxkIHtcbiAga2V5OiBzdHJpbmc7XG4gIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENocm9uaWNsZVRhc2sge1xuICAvLyAtLS0gQ29yZSAtLS1cbiAgaWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgc3RhdHVzOiBUYXNrU3RhdHVzO1xuICBwcmlvcml0eTogVGFza1ByaW9yaXR5O1xuXG4gIC8vIC0tLSBTY2hlZHVsaW5nIC0tLVxuICBkdWVEYXRlPzogc3RyaW5nOyAgICAgICAvLyBZWVlZLU1NLUREXG4gIGR1ZVRpbWU/OiBzdHJpbmc7ICAgICAgIC8vIEhIOm1tXG4gIHJlY3VycmVuY2U/OiBzdHJpbmc7ICAgIC8vIFJSVUxFIHN0cmluZyBlLmcuIFwiRlJFUT1XRUVLTFk7QllEQVk9TU9cIlxuXG4gIC8vIC0tLSBPcmdhbmlzYXRpb24gLS0tXG4gIGNhbGVuZGFySWQ/OiBzdHJpbmc7ICAgIC8vIGxpbmtzIHRvIGEgQ2hyb25pY2xlQ2FsZW5kYXJcbiAgdGFnczogc3RyaW5nW107XG4gIGNvbnRleHRzOiBzdHJpbmdbXTsgICAgIC8vIGUuZy4gW1wiQGhvbWVcIiwgXCJAd29ya1wiXVxuICBsaW5rZWROb3Rlczogc3RyaW5nW107ICAvLyB3aWtpbGluayBwYXRocyBlLmcuIFtcIlByb2plY3RzL1dlYnNpdGVcIl1cbiAgcHJvamVjdHM6IHN0cmluZ1tdO1xuXG4gIC8vIC0tLSBUaW1lIHRyYWNraW5nIC0tLVxuICB0aW1lRXN0aW1hdGU/OiBudW1iZXI7ICAvLyBtaW51dGVzXG4gIHRpbWVFbnRyaWVzOiBUaW1lRW50cnlbXTtcblxuICAvLyAtLS0gQ3VzdG9tIC0tLVxuICBjdXN0b21GaWVsZHM6IEN1c3RvbUZpZWxkW107XG5cbiAgLy8gLS0tIFJlY3VycmVuY2UgY29tcGxldGlvbiAtLS1cbiAgY29tcGxldGVkSW5zdGFuY2VzOiBzdHJpbmdbXTsgLy8gWVlZWS1NTS1ERCBkYXRlc1xuXG4gIC8vIC0tLSBNZXRhIC0tLVxuICBjcmVhdGVkQXQ6IHN0cmluZzsgICAgICAvLyBJU08gODYwMVxuICBjb21wbGV0ZWRBdD86IHN0cmluZzsgICAvLyBJU08gODYwMVxuICBub3Rlcz86IHN0cmluZzsgICAgICAgICAvLyBib2R5IGNvbnRlbnQgb2YgdGhlIG5vdGVcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIEV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IHR5cGUgQWxlcnRPZmZzZXQgPVxuICB8IFwibm9uZVwiXG4gIHwgXCJhdC10aW1lXCJcbiAgfCBcIjVtaW5cIiB8IFwiMTBtaW5cIiB8IFwiMTVtaW5cIiB8IFwiMzBtaW5cIlxuICB8IFwiMWhvdXJcIiB8IFwiMmhvdXJzXCJcbiAgfCBcIjFkYXlcIiB8IFwiMmRheXNcIiB8IFwiMXdlZWtcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVFdmVudCB7XG4gIC8vIC0tLSBDb3JlIChpbiBmb3JtIG9yZGVyKSAtLS1cbiAgaWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgbG9jYXRpb24/OiBzdHJpbmc7XG4gIGFsbERheTogYm9vbGVhbjtcbiAgc3RhcnREYXRlOiBzdHJpbmc7ICAgICAgLy8gWVlZWS1NTS1ERFxuICBzdGFydFRpbWU/OiBzdHJpbmc7ICAgICAvLyBISDptbSAgKHVuZGVmaW5lZCB3aGVuIGFsbERheSlcbiAgZW5kRGF0ZTogc3RyaW5nOyAgICAgICAgLy8gWVlZWS1NTS1ERFxuICBlbmRUaW1lPzogc3RyaW5nOyAgICAgICAvLyBISDptbSAgKHVuZGVmaW5lZCB3aGVuIGFsbERheSlcbiAgcmVjdXJyZW5jZT86IHN0cmluZzsgICAgLy8gUlJVTEUgc3RyaW5nXG4gIGNhbGVuZGFySWQ/OiBzdHJpbmc7ICAgIC8vIGxpbmtzIHRvIGEgQ2hyb25pY2xlQ2FsZW5kYXJcbiAgYWxlcnQ6IEFsZXJ0T2Zmc2V0O1xuICBub3Rlcz86IHN0cmluZzsgICAgICAgICAvLyBib2R5IGNvbnRlbnQgb2YgdGhlIG5vdGVcblxuICAvLyAtLS0gQ29ubmVjdGlvbnMgLS0tXG4gIGxpbmtlZFRhc2tJZHM6IHN0cmluZ1tdOyAgIC8vIENocm9uaWNsZSB0YXNrIElEc1xuXG4gIC8vIC0tLSBNZXRhIC0tLVxuICBjcmVhdGVkQXQ6IHN0cmluZztcbiAgY29tcGxldGVkSW5zdGFuY2VzOiBzdHJpbmdbXTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFBsdWdpbiBzZXR0aW5ncyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVTZXR0aW5ncyB7XG4gIC8vIEZvbGRlciBwYXRoc1xuICB0YXNrc0ZvbGRlcjogc3RyaW5nO1xuICBldmVudHNGb2xkZXI6IHN0cmluZztcblxuICAvLyBDYWxlbmRhcnMgKHN0b3JlZCBpbiBzZXR0aW5ncywgbm90IGFzIGZpbGVzKVxuICBjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW107XG4gIGRlZmF1bHRDYWxlbmRhcklkOiBzdHJpbmc7XG5cbiAgLy8gRGVmYXVsdHNcbiAgZGVmYXVsdFRhc2tTdGF0dXM6IFRhc2tTdGF0dXM7XG4gIGRlZmF1bHRUYXNrUHJpb3JpdHk6IFRhc2tQcmlvcml0eTtcbiAgZGVmYXVsdEFsZXJ0OiBBbGVydE9mZnNldDtcblxuICAvLyBEaXNwbGF5XG4gIHN0YXJ0T2ZXZWVrOiAwIHwgMSB8IDY7ICAvLyAwPVN1biwgMT1Nb24sIDY9U2F0XG4gIHRpbWVGb3JtYXQ6IFwiMTJoXCIgfCBcIjI0aFwiO1xuICBkZWZhdWx0Q2FsZW5kYXJWaWV3OiBcImRheVwiIHwgXCJ3ZWVrXCIgfCBcIm1vbnRoXCIgfCBcInllYXJcIjtcblxuICAvLyBTbWFydCBsaXN0cyB2aXNpYmlsaXR5XG4gIHNob3dUb2RheUNvdW50OiBib29sZWFuO1xuICBzaG93U2NoZWR1bGVkQ291bnQ6IGJvb2xlYW47XG4gIHNob3dGbGFnZ2VkQ291bnQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBDaHJvbmljbGVTZXR0aW5ncyA9IHtcbiAgdGFza3NGb2xkZXI6IFwiQ2hyb25pY2xlL1Rhc2tzXCIsXG4gIGV2ZW50c0ZvbGRlcjogXCJDaHJvbmljbGUvRXZlbnRzXCIsXG4gIGNhbGVuZGFyczogW1xuICAgIHsgaWQ6IFwicGVyc29uYWxcIiwgbmFtZTogXCJQZXJzb25hbFwiLCBjb2xvcjogXCJibHVlXCIsICAgaXNWaXNpYmxlOiB0cnVlLCBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9LFxuICAgIHsgaWQ6IFwid29ya1wiLCAgICAgbmFtZTogXCJXb3JrXCIsICAgICBjb2xvcjogXCJncmVlblwiLCAgaXNWaXNpYmxlOiB0cnVlLCBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9LFxuICBdLFxuICBkZWZhdWx0Q2FsZW5kYXJJZDogXCJwZXJzb25hbFwiLFxuICBkZWZhdWx0VGFza1N0YXR1czogXCJ0b2RvXCIsXG4gIGRlZmF1bHRUYXNrUHJpb3JpdHk6IFwibm9uZVwiLFxuICBkZWZhdWx0QWxlcnQ6IFwibm9uZVwiLFxuICBzdGFydE9mV2VlazogMCxcbiAgdGltZUZvcm1hdDogXCIxMmhcIixcbiAgZGVmYXVsdENhbGVuZGFyVmlldzogXCJ3ZWVrXCIsXG4gIHNob3dUb2RheUNvdW50OiB0cnVlLFxuICBzaG93U2NoZWR1bGVkQ291bnQ6IHRydWUsXG4gIHNob3dGbGFnZ2VkQ291bnQ6IHRydWUsXG59OyIsICJpbXBvcnQgeyBDaHJvbmljbGVDYWxlbmRhciwgQ2FsZW5kYXJDb2xvciB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgQ2FsZW5kYXJNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW107XG4gIHByaXZhdGUgb25VcGRhdGU6ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoY2FsZW5kYXJzOiBDaHJvbmljbGVDYWxlbmRhcltdLCBvblVwZGF0ZTogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMuY2FsZW5kYXJzID0gY2FsZW5kYXJzO1xuICAgIHRoaXMub25VcGRhdGUgPSBvblVwZGF0ZTtcbiAgfVxuXG4gIGdldEFsbCgpOiBDaHJvbmljbGVDYWxlbmRhcltdIHtcbiAgICByZXR1cm4gWy4uLnRoaXMuY2FsZW5kYXJzXTtcbiAgfVxuXG4gIGdldEJ5SWQoaWQ6IHN0cmluZyk6IENocm9uaWNsZUNhbGVuZGFyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jYWxlbmRhcnMuZmluZCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICB9XG5cbiAgY3JlYXRlKG5hbWU6IHN0cmluZywgY29sb3I6IENhbGVuZGFyQ29sb3IpOiBDaHJvbmljbGVDYWxlbmRhciB7XG4gICAgY29uc3QgY2FsZW5kYXI6IENocm9uaWNsZUNhbGVuZGFyID0ge1xuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZChuYW1lKSxcbiAgICAgIG5hbWUsXG4gICAgICBjb2xvcixcbiAgICAgIGlzVmlzaWJsZTogdHJ1ZSxcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG4gICAgdGhpcy5jYWxlbmRhcnMucHVzaChjYWxlbmRhcik7XG4gICAgdGhpcy5vblVwZGF0ZSgpO1xuICAgIHJldHVybiBjYWxlbmRhcjtcbiAgfVxuXG4gIHVwZGF0ZShpZDogc3RyaW5nLCBjaGFuZ2VzOiBQYXJ0aWFsPENocm9uaWNsZUNhbGVuZGFyPik6IHZvaWQge1xuICAgIGNvbnN0IGlkeCA9IHRoaXMuY2FsZW5kYXJzLmZpbmRJbmRleCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICAgIGlmIChpZHggPT09IC0xKSByZXR1cm47XG4gICAgdGhpcy5jYWxlbmRhcnNbaWR4XSA9IHsgLi4udGhpcy5jYWxlbmRhcnNbaWR4XSwgLi4uY2hhbmdlcyB9O1xuICAgIHRoaXMub25VcGRhdGUoKTtcbiAgfVxuXG4gIGRlbGV0ZShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5jYWxlbmRhcnMgPSB0aGlzLmNhbGVuZGFycy5maWx0ZXIoKGMpID0+IGMuaWQgIT09IGlkKTtcbiAgICB0aGlzLm9uVXBkYXRlKCk7XG4gIH1cblxuICB0b2dnbGVWaXNpYmlsaXR5KGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFycy5maW5kKChjKSA9PiBjLmlkID09PSBpZCk7XG4gICAgaWYgKGNhbCkge1xuICAgICAgY2FsLmlzVmlzaWJsZSA9ICFjYWwuaXNWaXNpYmxlO1xuICAgICAgdGhpcy5vblVwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldHVybnMgQ1NTIGhleCBjb2xvciBmb3IgYSBDYWxlbmRhckNvbG9yIG5hbWVcbiAgc3RhdGljIGNvbG9yVG9IZXgoY29sb3I6IENhbGVuZGFyQ29sb3IpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1hcDogUmVjb3JkPENhbGVuZGFyQ29sb3IsIHN0cmluZz4gPSB7XG4gICAgICBibHVlOiAgIFwiIzM3OEFERFwiLFxuICAgICAgZ3JlZW46ICBcIiMzNEM3NTlcIixcbiAgICAgIHB1cnBsZTogXCIjQUY1MkRFXCIsXG4gICAgICBvcmFuZ2U6IFwiI0ZGOTUwMFwiLFxuICAgICAgcmVkOiAgICBcIiNGRjNCMzBcIixcbiAgICAgIHRlYWw6ICAgXCIjMzBCMEM3XCIsXG4gICAgICBwaW5rOiAgIFwiI0ZGMkQ1NVwiLFxuICAgICAgeWVsbG93OiBcIiNGRkQ2MEFcIixcbiAgICAgIGdyYXk6ICAgXCIjOEU4RTkzXCIsXG4gICAgfTtcbiAgICByZXR1cm4gbWFwW2NvbG9yXTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVJZChuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJhc2UgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCBcIi1cIikucmVwbGFjZSgvW15hLXowLTktXS9nLCBcIlwiKTtcbiAgICBjb25zdCBzdWZmaXggPSBEYXRlLm5vdygpLnRvU3RyaW5nKDM2KTtcbiAgICByZXR1cm4gYCR7YmFzZX0tJHtzdWZmaXh9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIFRGaWxlLCBub3JtYWxpemVQYXRoIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVUYXNrLCBUYXNrU3RhdHVzLCBUYXNrUHJpb3JpdHkgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIFRhc2tNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCwgcHJpdmF0ZSB0YXNrc0ZvbGRlcjogc3RyaW5nKSB7fVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBSZWFkIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIGFzeW5jIGdldEFsbCgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgdGFza3M6IENocm9uaWNsZVRhc2tbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSAmJiBjaGlsZC5leHRlbnNpb24gPT09IFwibWRcIikge1xuICAgICAgICBjb25zdCB0YXNrID0gYXdhaXQgdGhpcy5maWxlVG9UYXNrKGNoaWxkKTtcbiAgICAgICAgaWYgKHRhc2spIHRhc2tzLnB1c2godGFzayk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXNrcztcbiAgfVxuXG4gIGFzeW5jIGdldEJ5SWQoaWQ6IHN0cmluZyk6IFByb21pc2U8Q2hyb25pY2xlVGFzayB8IG51bGw+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmluZCgodCkgPT4gdC5pZCA9PT0gaWQpID8/IG51bGw7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgV3JpdGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgY3JlYXRlKHRhc2s6IE9taXQ8Q2hyb25pY2xlVGFzaywgXCJpZFwiIHwgXCJjcmVhdGVkQXRcIj4pOiBQcm9taXNlPENocm9uaWNsZVRhc2s+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcigpO1xuXG4gICAgY29uc3QgZnVsbDogQ2hyb25pY2xlVGFzayA9IHtcbiAgICAgIC4uLnRhc2ssXG4gICAgICBpZDogdGhpcy5nZW5lcmF0ZUlkKCksXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgY29uc3QgcGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy50YXNrc0ZvbGRlcn0vJHtmdWxsLnRpdGxlfS5tZGApO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCB0aGlzLnRhc2tUb01hcmtkb3duKGZ1bGwpKTtcbiAgICByZXR1cm4gZnVsbDtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZSh0YXNrOiBDaHJvbmljbGVUYXNrKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JUYXNrKHRhc2suaWQpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuXG4gICAgLy8gSWYgdGl0bGUgY2hhbmdlZCwgcmVuYW1lIHRoZSBmaWxlXG4gICAgY29uc3QgZXhwZWN0ZWRQYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLnRhc2tzRm9sZGVyfS8ke3Rhc2sudGl0bGV9Lm1kYCk7XG4gICAgaWYgKGZpbGUucGF0aCAhPT0gZXhwZWN0ZWRQYXRoKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIGV4cGVjdGVkUGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKGV4cGVjdGVkUGF0aCkgPz8gZmlsZTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkodXBkYXRlZEZpbGUsIHRoaXMudGFza1RvTWFya2Rvd24odGFzaykpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvclRhc2soaWQpO1xuICAgIGlmIChmaWxlKSBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBtYXJrQ29tcGxldGUoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRhc2sgPSBhd2FpdCB0aGlzLmdldEJ5SWQoaWQpO1xuICAgIGlmICghdGFzaykgcmV0dXJuO1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHtcbiAgICAgIC4uLnRhc2ssXG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgY29tcGxldGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBGaWx0ZXJzICh1c2VkIGJ5IHNtYXJ0IGxpc3RzKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBnZXREdWVUb2RheSgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IHRvZGF5ID0gdGhpcy50b2RheVN0cigpO1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoXG4gICAgICAodCkgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiICYmIHQuc3RhdHVzICE9PSBcImNhbmNlbGxlZFwiICYmIHQuZHVlRGF0ZSA9PT0gdG9kYXlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgZ2V0T3ZlcmR1ZSgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IHRvZGF5ID0gdGhpcy50b2RheVN0cigpO1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoXG4gICAgICAodCkgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiICYmIHQuc3RhdHVzICE9PSBcImNhbmNlbGxlZFwiICYmICEhdC5kdWVEYXRlICYmIHQuZHVlRGF0ZSA8IHRvZGF5XG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldFNjaGVkdWxlZCgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoXG4gICAgICAodCkgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiICYmIHQuc3RhdHVzICE9PSBcImNhbmNlbGxlZFwiICYmICEhdC5kdWVEYXRlXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldEZsYWdnZWQoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKCh0KSA9PiB0LnByaW9yaXR5ID09PSBcImhpZ2hcIiAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNlcmlhbGlzYXRpb24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSB0YXNrVG9NYXJrZG93bih0YXNrOiBDaHJvbmljbGVUYXNrKTogc3RyaW5nIHtcbiAgICBjb25zdCBmbTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICBpZDogICAgICAgICAgICAgICAgIHRhc2suaWQsXG4gICAgICB0aXRsZTogICAgICAgICAgICAgIHRhc2sudGl0bGUsXG4gICAgICBzdGF0dXM6ICAgICAgICAgICAgIHRhc2suc3RhdHVzLFxuICAgICAgcHJpb3JpdHk6ICAgICAgICAgICB0YXNrLnByaW9yaXR5LFxuICAgICAgdGFnczogICAgICAgICAgICAgICB0YXNrLnRhZ3MsXG4gICAgICBjb250ZXh0czogICAgICAgICAgIHRhc2suY29udGV4dHMsXG4gICAgICBwcm9qZWN0czogICAgICAgICAgIHRhc2sucHJvamVjdHMsXG4gICAgICBcImxpbmtlZC1ub3Rlc1wiOiAgICAgdGFzay5saW5rZWROb3RlcyxcbiAgICAgIFwiY2FsZW5kYXItaWRcIjogICAgICB0YXNrLmNhbGVuZGFySWQgPz8gbnVsbCxcbiAgICAgIFwiZHVlLWRhdGVcIjogICAgICAgICB0YXNrLmR1ZURhdGUgPz8gbnVsbCxcbiAgICAgIFwiZHVlLXRpbWVcIjogICAgICAgICB0YXNrLmR1ZVRpbWUgPz8gbnVsbCxcbiAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgdGFzay5yZWN1cnJlbmNlID8/IG51bGwsXG4gICAgICBcInRpbWUtZXN0aW1hdGVcIjogICAgdGFzay50aW1lRXN0aW1hdGUgPz8gbnVsbCxcbiAgICAgIFwidGltZS1lbnRyaWVzXCI6ICAgICB0YXNrLnRpbWVFbnRyaWVzLFxuICAgICAgXCJjdXN0b20tZmllbGRzXCI6ICAgIHRhc2suY3VzdG9tRmllbGRzLFxuICAgICAgXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCI6IHRhc2suY29tcGxldGVkSW5zdGFuY2VzLFxuICAgICAgXCJjcmVhdGVkLWF0XCI6ICAgICAgIHRhc2suY3JlYXRlZEF0LFxuICAgICAgXCJjb21wbGV0ZWQtYXRcIjogICAgIHRhc2suY29tcGxldGVkQXQgPz8gbnVsbCxcbiAgICB9O1xuXG4gICAgY29uc3QgeWFtbCA9IE9iamVjdC5lbnRyaWVzKGZtKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHtKU09OLnN0cmluZ2lmeSh2KX1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCBib2R5ID0gdGFzay5ub3RlcyA/IGBcXG4ke3Rhc2subm90ZXN9YCA6IFwiXCI7XG4gICAgcmV0dXJuIGAtLS1cXG4ke3lhbWx9XFxuLS0tXFxuJHtib2R5fWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGZpbGVUb1Rhc2soZmlsZTogVEZpbGUpOiBQcm9taXNlPENocm9uaWNsZVRhc2sgfCBudWxsPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgICBjb25zdCBmbSA9IGNhY2hlPy5mcm9udG1hdHRlcjtcbiAgICAgIGlmICghZm0/LmlkIHx8ICFmbT8udGl0bGUpIHJldHVybiBudWxsO1xuXG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICAgIGNvbnN0IGJvZHlNYXRjaCA9IGNvbnRlbnQubWF0Y2goL14tLS1cXG5bXFxzXFxTXSo/XFxuLS0tXFxuKFtcXHNcXFNdKikkLyk7XG4gICAgICBjb25zdCBub3RlcyA9IGJvZHlNYXRjaD8uWzFdPy50cmltKCkgfHwgdW5kZWZpbmVkO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZDogICAgICAgICAgICAgICAgIGZtLmlkLFxuICAgICAgICB0aXRsZTogICAgICAgICAgICAgIGZtLnRpdGxlLFxuICAgICAgICBzdGF0dXM6ICAgICAgICAgICAgIChmbS5zdGF0dXMgYXMgVGFza1N0YXR1cykgPz8gXCJ0b2RvXCIsXG4gICAgICAgIHByaW9yaXR5OiAgICAgICAgICAgKGZtLnByaW9yaXR5IGFzIFRhc2tQcmlvcml0eSkgPz8gXCJub25lXCIsXG4gICAgICAgIGR1ZURhdGU6ICAgICAgICAgICAgZm1bXCJkdWUtZGF0ZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGR1ZVRpbWU6ICAgICAgICAgICAgZm1bXCJkdWUtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgZm0ucmVjdXJyZW5jZSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGNhbGVuZGFySWQ6ICAgICAgICAgZm1bXCJjYWxlbmRhci1pZFwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgZm0udGFncyA/PyBbXSxcbiAgICAgICAgY29udGV4dHM6ICAgICAgICAgICBmbS5jb250ZXh0cyA/PyBbXSxcbiAgICAgICAgbGlua2VkTm90ZXM6ICAgICAgICBmbVtcImxpbmtlZC1ub3Rlc1wiXSA/PyBbXSxcbiAgICAgICAgcHJvamVjdHM6ICAgICAgICAgICBmbS5wcm9qZWN0cyA/PyBbXSxcbiAgICAgICAgdGltZUVzdGltYXRlOiAgICAgICBmbVtcInRpbWUtZXN0aW1hdGVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICB0aW1lRW50cmllczogICAgICAgIGZtW1widGltZS1lbnRyaWVzXCJdID8/IFtdLFxuICAgICAgICBjdXN0b21GaWVsZHM6ICAgICAgIGZtW1wiY3VzdG9tLWZpZWxkc1wiXSA/PyBbXSxcbiAgICAgICAgY29tcGxldGVkSW5zdGFuY2VzOiBmbVtcImNvbXBsZXRlZC1pbnN0YW5jZXNcIl0gPz8gW10sXG4gICAgICAgIGNyZWF0ZWRBdDogICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgY29tcGxldGVkQXQ6ICAgICAgICBmbVtcImNvbXBsZXRlZC1hdFwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIG5vdGVzLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgZmluZEZpbGVGb3JUYXNrKGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIG51bGw7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmICghKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoY2hpbGQpO1xuICAgICAgaWYgKGNhY2hlPy5mcm9udG1hdHRlcj8uaWQgPT09IGlkKSByZXR1cm4gY2hpbGQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy50YXNrc0ZvbGRlcikpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcih0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYHRhc2stJHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA2KX1gO1xuICB9XG5cbiAgcHJpdmF0ZSB0b2RheVN0cigpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgVEZpbGUsIG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZUV2ZW50LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCwgcHJpdmF0ZSBldmVudHNGb2xkZXI6IHN0cmluZykge31cblxuICBhc3luYyBnZXRBbGwoKTogUHJvbWlzZTxDaHJvbmljbGVFdmVudFtdPiB7XG4gICAgY29uc3QgZm9sZGVyID0gdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMuZXZlbnRzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdID0gW107XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRGaWxlICYmIGNoaWxkLmV4dGVuc2lvbiA9PT0gXCJtZFwiKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50ID0gYXdhaXQgdGhpcy5maWxlVG9FdmVudChjaGlsZCk7XG4gICAgICAgIGlmIChldmVudCkgZXZlbnRzLnB1c2goZXZlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZXZlbnRzO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlKGV2ZW50OiBPbWl0PENocm9uaWNsZUV2ZW50LCBcImlkXCIgfCBcImNyZWF0ZWRBdFwiPik6IFByb21pc2U8Q2hyb25pY2xlRXZlbnQ+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcigpO1xuXG4gICAgY29uc3QgZnVsbDogQ2hyb25pY2xlRXZlbnQgPSB7XG4gICAgICAuLi5ldmVudCxcbiAgICAgIGlkOiB0aGlzLmdlbmVyYXRlSWQoKSxcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICBjb25zdCBwYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLmV2ZW50c0ZvbGRlcn0vJHtmdWxsLnRpdGxlfS5tZGApO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCB0aGlzLmV2ZW50VG9NYXJrZG93bihmdWxsKSk7XG4gICAgcmV0dXJuIGZ1bGw7XG4gIH1cblxuICBhc3luYyB1cGRhdGUoZXZlbnQ6IENocm9uaWNsZUV2ZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JFdmVudChldmVudC5pZCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG5cbiAgICBjb25zdCBleHBlY3RlZFBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMuZXZlbnRzRm9sZGVyfS8ke2V2ZW50LnRpdGxlfS5tZGApO1xuICAgIGlmIChmaWxlLnBhdGggIT09IGV4cGVjdGVkUGF0aCkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAuZmlsZU1hbmFnZXIucmVuYW1lRmlsZShmaWxlLCBleHBlY3RlZFBhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZUJ5UGF0aChleHBlY3RlZFBhdGgpID8/IGZpbGU7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KHVwZGF0ZWRGaWxlLCB0aGlzLmV2ZW50VG9NYXJrZG93bihldmVudCkpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvckV2ZW50KGlkKTtcbiAgICBpZiAoZmlsZSkgYXdhaXQgdGhpcy5hcHAudmF1bHQuZGVsZXRlKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgZ2V0SW5SYW5nZShzdGFydERhdGU6IHN0cmluZywgZW5kRGF0ZTogc3RyaW5nKTogUHJvbWlzZTxDaHJvbmljbGVFdmVudFtdPiB7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcigoZSkgPT4gZS5zdGFydERhdGUgPj0gc3RhcnREYXRlICYmIGUuc3RhcnREYXRlIDw9IGVuZERhdGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBldmVudFRvTWFya2Rvd24oZXZlbnQ6IENocm9uaWNsZUV2ZW50KTogc3RyaW5nIHtcbiAgICBjb25zdCBmbTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICBpZDogICAgICAgICAgICAgICAgICAgZXZlbnQuaWQsXG4gICAgICB0aXRsZTogICAgICAgICAgICAgICAgZXZlbnQudGl0bGUsXG4gICAgICBsb2NhdGlvbjogICAgICAgICAgICAgZXZlbnQubG9jYXRpb24gPz8gbnVsbCxcbiAgICAgIFwiYWxsLWRheVwiOiAgICAgICAgICAgIGV2ZW50LmFsbERheSxcbiAgICAgIFwic3RhcnQtZGF0ZVwiOiAgICAgICAgIGV2ZW50LnN0YXJ0RGF0ZSxcbiAgICAgIFwic3RhcnQtdGltZVwiOiAgICAgICAgIGV2ZW50LnN0YXJ0VGltZSA/PyBudWxsLFxuICAgICAgXCJlbmQtZGF0ZVwiOiAgICAgICAgICAgZXZlbnQuZW5kRGF0ZSxcbiAgICAgIFwiZW5kLXRpbWVcIjogICAgICAgICAgIGV2ZW50LmVuZFRpbWUgPz8gbnVsbCxcbiAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICBldmVudC5yZWN1cnJlbmNlID8/IG51bGwsXG4gICAgICBcImNhbGVuZGFyLWlkXCI6ICAgICAgICBldmVudC5jYWxlbmRhcklkID8/IG51bGwsXG4gICAgICBhbGVydDogICAgICAgICAgICAgICAgZXZlbnQuYWxlcnQsXG4gICAgICBcImxpbmtlZC10YXNrLWlkc1wiOiAgICBldmVudC5saW5rZWRUYXNrSWRzLFxuICAgICAgXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCI6IGV2ZW50LmNvbXBsZXRlZEluc3RhbmNlcyxcbiAgICAgIFwiY3JlYXRlZC1hdFwiOiAgICAgICAgIGV2ZW50LmNyZWF0ZWRBdCxcbiAgICB9O1xuXG4gICAgY29uc3QgeWFtbCA9IE9iamVjdC5lbnRyaWVzKGZtKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHtKU09OLnN0cmluZ2lmeSh2KX1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCBib2R5ID0gZXZlbnQubm90ZXMgPyBgXFxuJHtldmVudC5ub3Rlc31gIDogXCJcIjtcbiAgICByZXR1cm4gYC0tLVxcbiR7eWFtbH1cXG4tLS1cXG4ke2JvZHl9YDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmlsZVRvRXZlbnQoZmlsZTogVEZpbGUpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50IHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgICAgY29uc3QgZm0gPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG4gICAgICBpZiAoIWZtPy5pZCB8fCAhZm0/LnRpdGxlKSByZXR1cm4gbnVsbDtcblxuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBjb25zdCBib2R5TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eLS0tXFxuW1xcc1xcU10qP1xcbi0tLVxcbihbXFxzXFxTXSopJC8pO1xuICAgICAgY29uc3Qgbm90ZXMgPSBib2R5TWF0Y2g/LlsxXT8udHJpbSgpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6ICAgICAgICAgICAgICAgICAgIGZtLmlkLFxuICAgICAgICB0aXRsZTogICAgICAgICAgICAgICAgZm0udGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICAgICAgICAgICBmbS5sb2NhdGlvbiA/PyB1bmRlZmluZWQsXG4gICAgICAgIGFsbERheTogICAgICAgICAgICAgICBmbVtcImFsbC1kYXlcIl0gPz8gdHJ1ZSxcbiAgICAgICAgc3RhcnREYXRlOiAgICAgICAgICAgIGZtW1wic3RhcnQtZGF0ZVwiXSxcbiAgICAgICAgc3RhcnRUaW1lOiAgICAgICAgICAgIGZtW1wic3RhcnQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGVuZERhdGU6ICAgICAgICAgICAgICBmbVtcImVuZC1kYXRlXCJdLFxuICAgICAgICBlbmRUaW1lOiAgICAgICAgICAgICAgZm1bXCJlbmQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICBmbS5yZWN1cnJlbmNlID8/IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsZW5kYXJJZDogICAgICAgICAgIGZtW1wiY2FsZW5kYXItaWRcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBhbGVydDogICAgICAgICAgICAgICAgKGZtLmFsZXJ0IGFzIEFsZXJ0T2Zmc2V0KSA/PyBcIm5vbmVcIixcbiAgICAgICAgbGlua2VkVGFza0lkczogICAgICAgIGZtW1wibGlua2VkLXRhc2staWRzXCJdID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6ICAgZm1bXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCJdID8/IFtdLFxuICAgICAgICBjcmVhdGVkQXQ6ICAgICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgbm90ZXMsXG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5kRmlsZUZvckV2ZW50KGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLmV2ZW50c0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBudWxsO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoIShjaGlsZCBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGNoaWxkKTtcbiAgICAgIGlmIChjYWNoZT8uZnJvbnRtYXR0ZXI/LmlkID09PSBpZCkgcmV0dXJuIGNoaWxkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMuZXZlbnRzRm9sZGVyKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKHRoaXMuZXZlbnRzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGV2ZW50LSR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNil9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiwgbW9tZW50IH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVUYXNrLCBDaHJvbmljbGVDYWxlbmRhciwgQ2FsZW5kYXJDb2xvciB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgVGFza01hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9UYXNrTWFuYWdlclwiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5cbmV4cG9ydCBjb25zdCBUQVNLX1ZJRVdfVFlQRSA9IFwiY2hyb25pY2xlLXRhc2stdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgVGFza1ZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIHByaXZhdGUgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyO1xuICBwcml2YXRlIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICBwcml2YXRlIGN1cnJlbnRMaXN0SWQ6IHN0cmluZyA9IFwidG9kYXlcIjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBsZWFmOiBXb3Jrc3BhY2VMZWFmLFxuICAgIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcixcbiAgICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlclxuICApIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLnRhc2tNYW5hZ2VyID0gdGFza01hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcgeyByZXR1cm4gVEFTS19WSUVXX1RZUEU7IH1cbiAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHsgcmV0dXJuIFwiQ2hyb25pY2xlXCI7IH1cbiAgZ2V0SWNvbigpOiBzdHJpbmcgeyByZXR1cm4gXCJjaGVjay1jaXJjbGVcIjsgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHtcbiAgICBhd2FpdCB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgYXN5bmMgcmVuZGVyKCkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29udGFpbmVyLmVtcHR5KCk7XG4gICAgY29udGFpbmVyLmFkZENsYXNzKFwiY2hyb25pY2xlLWFwcFwiKTtcblxuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0QWxsKCk7XG4gICAgY29uc3QgdG9kYXkgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldER1ZVRvZGF5KCk7XG4gICAgY29uc3Qgc2NoZWR1bGVkID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRTY2hlZHVsZWQoKTtcbiAgICBjb25zdCBmbGFnZ2VkID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRGbGFnZ2VkKCk7XG4gICAgY29uc3Qgb3ZlcmR1ZSA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0T3ZlcmR1ZSgpO1xuICAgIGNvbnN0IGNhbGVuZGFycyA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIExheW91dCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBsYXlvdXQgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxheW91dFwiKTtcbiAgICBjb25zdCBzaWRlYmFyID0gbGF5b3V0LmNyZWF0ZURpdihcImNocm9uaWNsZS1zaWRlYmFyXCIpO1xuICAgIGNvbnN0IG1haW4gPSBsYXlvdXQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1haW5cIik7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgU21hcnQgbGlzdCB0aWxlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB0aWxlc0dyaWQgPSBzaWRlYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlc1wiKTtcblxuICAgIGNvbnN0IHRpbGVzID0gW1xuICAgICAgeyBpZDogXCJ0b2RheVwiLCAgICAgbGFiZWw6IFwiVG9kYXlcIiwgICAgIGNvdW50OiB0b2RheS5sZW5ndGggKyBvdmVyZHVlLmxlbmd0aCwgY29sb3I6IFwiI0ZGM0IzMFwiIH0sXG4gICAgICB7IGlkOiBcInNjaGVkdWxlZFwiLCBsYWJlbDogXCJTY2hlZHVsZWRcIiwgY291bnQ6IHNjaGVkdWxlZC5sZW5ndGgsICAgICAgICAgICAgICBjb2xvcjogXCIjMzc4QUREXCIgfSxcbiAgICAgIHsgaWQ6IFwiYWxsXCIsICAgICAgIGxhYmVsOiBcIkFsbFwiLCAgICAgICBjb3VudDogYWxsLmZpbHRlcih0ID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIikubGVuZ3RoLCBjb2xvcjogXCIjNTU1NTU1XCIgfSxcbiAgICAgIHsgaWQ6IFwiZmxhZ2dlZFwiLCAgIGxhYmVsOiBcIkZsYWdnZWRcIiwgICBjb3VudDogZmxhZ2dlZC5sZW5ndGgsICAgICAgICAgICAgICAgIGNvbG9yOiBcIiNGRjk1MDBcIiB9LFxuICAgIF07XG5cbiAgICBmb3IgKGNvbnN0IHRpbGUgb2YgdGlsZXMpIHtcbiAgICAgIGNvbnN0IHQgPSB0aWxlc0dyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGVcIik7XG4gICAgICB0LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRpbGUuY29sb3I7XG4gICAgICBpZiAodGlsZS5pZCA9PT0gdGhpcy5jdXJyZW50TGlzdElkKSB0LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgdC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGlsZS1jb3VudFwiKS5zZXRUZXh0KFN0cmluZyh0aWxlLmNvdW50KSk7XG4gICAgICB0LmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlLWxhYmVsXCIpLnNldFRleHQodGlsZS5sYWJlbCk7XG4gICAgICB0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuY3VycmVudExpc3RJZCA9IHRpbGUuaWQ7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTXkgTGlzdHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgbGlzdHNTZWN0aW9uID0gc2lkZWJhci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdHMtc2VjdGlvblwiKTtcbiAgICBsaXN0c1NlY3Rpb24uY3JlYXRlRGl2KFwiY2hyb25pY2xlLXNlY3Rpb24tbGFiZWxcIikuc2V0VGV4dChcIk15IExpc3RzXCIpO1xuXG4gICAgZm9yIChjb25zdCBjYWwgb2YgY2FsZW5kYXJzKSB7XG4gICAgICBjb25zdCByb3cgPSBsaXN0c1NlY3Rpb24uY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3Qtcm93XCIpO1xuICAgICAgaWYgKGNhbC5pZCA9PT0gdGhpcy5jdXJyZW50TGlzdElkKSByb3cuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG5cbiAgICAgIGNvbnN0IGRvdCA9IHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1kb3RcIik7XG4gICAgICBkb3Quc3R5bGUuYmFja2dyb3VuZENvbG9yID0gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKTtcblxuICAgICAgcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LW5hbWVcIikuc2V0VGV4dChjYWwubmFtZSk7XG5cbiAgICAgIGNvbnN0IGNhbFRhc2tzID0gYWxsLmZpbHRlcihcbiAgICAgICAgdCA9PiB0LmNhbGVuZGFySWQgPT09IGNhbC5pZCAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCJcbiAgICAgICk7XG4gICAgICByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3QtY291bnRcIikuc2V0VGV4dChTdHJpbmcoY2FsVGFza3MubGVuZ3RoKSk7XG5cbiAgICAgIHJvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmN1cnJlbnRMaXN0SWQgPSBjYWwuaWQ7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTWFpbiBwYW5lbCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBhd2FpdCB0aGlzLnJlbmRlck1haW5QYW5lbChtYWluLCBhbGwsIG92ZXJkdWUsIGNhbGVuZGFycyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlbmRlck1haW5QYW5lbChcbiAgICBtYWluOiBIVE1MRWxlbWVudCxcbiAgICBhbGw6IENocm9uaWNsZVRhc2tbXSxcbiAgICBvdmVyZHVlOiBDaHJvbmljbGVUYXNrW10sXG4gICAgY2FsZW5kYXJzOiBDaHJvbmljbGVDYWxlbmRhcltdXG4gICkge1xuICAgIC8vIFRpdGxlXG4gICAgY29uc3QgaGVhZGVyID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWFpbi1oZWFkZXJcIik7XG4gICAgY29uc3QgdGl0bGVFbCA9IGhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWFpbi10aXRsZVwiKTtcblxuICAgIGxldCB0YXNrczogQ2hyb25pY2xlVGFza1tdID0gW107XG5cbiAgICBjb25zdCBzbWFydExpc3RzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgdG9kYXk6IFwiVG9kYXlcIiwgc2NoZWR1bGVkOiBcIlNjaGVkdWxlZFwiLCBhbGw6IFwiQWxsXCIsIGZsYWdnZWQ6IFwiRmxhZ2dlZFwiXG4gICAgfTtcblxuICAgIGlmIChzbWFydExpc3RzW3RoaXMuY3VycmVudExpc3RJZF0pIHtcbiAgICAgIHRpdGxlRWwuc2V0VGV4dChzbWFydExpc3RzW3RoaXMuY3VycmVudExpc3RJZF0pO1xuICAgICAgdGl0bGVFbC5zdHlsZS5jb2xvciA9IHtcbiAgICAgICAgdG9kYXk6IFwiI0ZGM0IzMFwiLCBzY2hlZHVsZWQ6IFwiIzM3OEFERFwiLCBhbGw6IFwiIzU1NTU1NVwiLCBmbGFnZ2VkOiBcIiNGRjk1MDBcIlxuICAgICAgfVt0aGlzLmN1cnJlbnRMaXN0SWRdID8/IFwidmFyKC0tdGV4dC1ub3JtYWwpXCI7XG5cbiAgICAgIHN3aXRjaCAodGhpcy5jdXJyZW50TGlzdElkKSB7XG4gICAgICAgIGNhc2UgXCJ0b2RheVwiOlxuICAgICAgICAgIHRhc2tzID0gWy4uLm92ZXJkdWUsIC4uLihhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldER1ZVRvZGF5KCkpXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInNjaGVkdWxlZFwiOlxuICAgICAgICAgIHRhc2tzID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRTY2hlZHVsZWQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImZsYWdnZWRcIjpcbiAgICAgICAgICB0YXNrcyA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0RmxhZ2dlZCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiYWxsXCI6XG4gICAgICAgICAgdGFza3MgPSBhbGwuZmlsdGVyKHQgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZCh0aGlzLmN1cnJlbnRMaXN0SWQpO1xuICAgICAgdGl0bGVFbC5zZXRUZXh0KGNhbD8ubmFtZSA/PyBcIkxpc3RcIik7XG4gICAgICB0aXRsZUVsLnN0eWxlLmNvbG9yID0gY2FsID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSA6IFwidmFyKC0tdGV4dC1ub3JtYWwpXCI7XG4gICAgICB0YXNrcyA9IGFsbC5maWx0ZXIoXG4gICAgICAgIHQgPT4gdC5jYWxlbmRhcklkID09PSB0aGlzLmN1cnJlbnRMaXN0SWQgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIFRhc2sgbGlzdFxuICAgIGNvbnN0IGxpc3RFbCA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stbGlzdFwiKTtcblxuICAgIGlmICh0YXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGxpc3RFbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZW1wdHlcIikuc2V0VGV4dChcIk5vIHRhc2tzXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBncm91cHMgPSB0aGlzLmdyb3VwVGFza3ModGFza3MpO1xuICAgICAgZm9yIChjb25zdCBbZ3JvdXAsIGdyb3VwVGFza3NdIG9mIE9iamVjdC5lbnRyaWVzKGdyb3VwcykpIHtcbiAgICAgICAgaWYgKGdyb3VwVGFza3MubGVuZ3RoID09PSAwKSBjb250aW51ZTtcbiAgICAgICAgbGlzdEVsLmNyZWF0ZURpdihcImNocm9uaWNsZS1ncm91cC1sYWJlbFwiKS5zZXRUZXh0KGdyb3VwKTtcbiAgICAgICAgZm9yIChjb25zdCB0YXNrIG9mIGdyb3VwVGFza3MpIHtcbiAgICAgICAgICB0aGlzLnJlbmRlclRhc2tSb3cobGlzdEVsLCB0YXNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5ldyB0YXNrIGlubGluZSBlbnRyeVxuICAgIGNvbnN0IG5ld1JvdyA9IGxpc3RFbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbmV3LXRhc2stcm93XCIpO1xuICAgIGNvbnN0IG5ld0lucHV0ID0gbmV3Um93LmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJOZXcgcmVtaW5kZXIuLi5cIixcbiAgICAgIGNsczogXCJjaHJvbmljbGUtbmV3LXRhc2staW5wdXRcIlxuICAgIH0pO1xuICAgIG5ld0lucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIiAmJiBuZXdJbnB1dC52YWx1ZS50cmltKCkpIHtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5jcmVhdGUoe1xuICAgICAgICAgIHRpdGxlOiBuZXdJbnB1dC52YWx1ZS50cmltKCksXG4gICAgICAgICAgc3RhdHVzOiBcInRvZG9cIixcbiAgICAgICAgICBwcmlvcml0eTogdGhpcy5jdXJyZW50TGlzdElkID09PSBcImZsYWdnZWRcIiA/IFwiaGlnaFwiIDogXCJub25lXCIsXG4gICAgICAgICAgY2FsZW5kYXJJZDogT2JqZWN0LnZhbHVlcyh7XG4gICAgICAgICAgICB0b2RheTogdW5kZWZpbmVkLCBzY2hlZHVsZWQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGFsbDogdW5kZWZpbmVkLCBmbGFnZ2VkOiB1bmRlZmluZWRcbiAgICAgICAgICB9KS5pbmNsdWRlcyh0aGlzLmN1cnJlbnRMaXN0SWQgYXMgYW55KVxuICAgICAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgICAgIDogdGhpcy5jdXJyZW50TGlzdElkLFxuICAgICAgICAgIHRhZ3M6IFtdLCBjb250ZXh0czogW10sIGxpbmtlZE5vdGVzOiBbXSwgcHJvamVjdHM6IFtdLFxuICAgICAgICAgIHRpbWVFbnRyaWVzOiBbXSwgY3VzdG9tRmllbGRzOiBbXSwgY29tcGxldGVkSW5zdGFuY2VzOiBbXSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclRhc2tSb3coY29udGFpbmVyOiBIVE1MRWxlbWVudCwgdGFzazogQ2hyb25pY2xlVGFzaykge1xuICAgIGNvbnN0IHJvdyA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1yb3dcIik7XG5cbiAgICAvLyBDaGVja2JveFxuICAgIGNvbnN0IGNoZWNrYm94ID0gcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1jaGVja2JveFwiKTtcbiAgICBpZiAodGFzay5zdGF0dXMgPT09IFwiZG9uZVwiKSBjaGVja2JveC5hZGRDbGFzcyhcImRvbmVcIik7XG4gICAgY2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIudXBkYXRlKHtcbiAgICAgICAgLi4udGFzayxcbiAgICAgICAgc3RhdHVzOiB0YXNrLnN0YXR1cyA9PT0gXCJkb25lXCIgPyBcInRvZG9cIiA6IFwiZG9uZVwiLFxuICAgICAgICBjb21wbGV0ZWRBdDogdGFzay5zdGF0dXMgPT09IFwiZG9uZVwiID8gdW5kZWZpbmVkIDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgfSk7XG4gICAgICBhd2FpdCB0aGlzLnJlbmRlcigpO1xuICAgIH0pO1xuXG4gICAgLy8gQ29udGVudFxuICAgIGNvbnN0IGNvbnRlbnQgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stY29udGVudFwiKTtcbiAgICBjb25zdCB0aXRsZUVsID0gY29udGVudC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay10aXRsZVwiKTtcbiAgICB0aXRsZUVsLnNldFRleHQodGFzay50aXRsZSk7XG4gICAgaWYgKHRhc2suc3RhdHVzID09PSBcImRvbmVcIikgdGl0bGVFbC5hZGRDbGFzcyhcImRvbmVcIik7XG5cbiAgICAvLyBNZXRhIHJvd1xuICAgIGlmICh0YXNrLmR1ZURhdGUgfHwgdGFzay5jYWxlbmRhcklkKSB7XG4gICAgICBjb25zdCBtZXRhID0gY29udGVudC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1tZXRhXCIpO1xuXG4gICAgICBpZiAodGFzay5kdWVEYXRlKSB7XG4gICAgICAgIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICAgICAgY29uc3QgbWV0YURhdGUgPSBtZXRhLmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLWRhdGVcIik7XG4gICAgICAgIG1ldGFEYXRlLnNldFRleHQodGhpcy5mb3JtYXREYXRlKHRhc2suZHVlRGF0ZSkpO1xuICAgICAgICBpZiAodGFzay5kdWVEYXRlIDwgdG9kYXkpIG1ldGFEYXRlLmFkZENsYXNzKFwib3ZlcmR1ZVwiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBQcmlvcml0eSBmbGFnXG4gICAgaWYgKHRhc2sucHJpb3JpdHkgPT09IFwiaGlnaFwiKSB7XG4gICAgICByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWZsYWdcIikuc2V0VGV4dChcIlx1MjY5MVwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdyb3VwVGFza3ModGFza3M6IENocm9uaWNsZVRhc2tbXSk6IFJlY29yZDxzdHJpbmcsIENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCBuZXh0V2VlayA9IG5ldyBEYXRlKERhdGUubm93KCkgKyA3ICogODY0MDAwMDApLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgY29uc3QgZ3JvdXBzOiBSZWNvcmQ8c3RyaW5nLCBDaHJvbmljbGVUYXNrW10+ID0ge1xuICAgICAgXCJPdmVyZHVlXCI6IFtdLFxuICAgICAgXCJUb2RheVwiOiBbXSxcbiAgICAgIFwiVGhpcyB3ZWVrXCI6IFtdLFxuICAgICAgXCJMYXRlclwiOiBbXSxcbiAgICAgIFwiTm8gZGF0ZVwiOiBbXSxcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCB0YXNrIG9mIHRhc2tzKSB7XG4gICAgICBpZiAoIXRhc2suZHVlRGF0ZSkgeyBncm91cHNbXCJObyBkYXRlXCJdLnB1c2godGFzayk7IGNvbnRpbnVlOyB9XG4gICAgICBpZiAodGFzay5kdWVEYXRlIDwgdG9kYXkpIHsgZ3JvdXBzW1wiT3ZlcmR1ZVwiXS5wdXNoKHRhc2spOyBjb250aW51ZTsgfVxuICAgICAgaWYgKHRhc2suZHVlRGF0ZSA9PT0gdG9kYXkpIHsgZ3JvdXBzW1wiVG9kYXlcIl0ucHVzaCh0YXNrKTsgY29udGludWU7IH1cbiAgICAgIGlmICh0YXNrLmR1ZURhdGUgPD0gbmV4dFdlZWspIHsgZ3JvdXBzW1wiVGhpcyB3ZWVrXCJdLnB1c2godGFzayk7IGNvbnRpbnVlOyB9XG4gICAgICBncm91cHNbXCJMYXRlclwiXS5wdXNoKHRhc2spO1xuICAgIH1cblxuICAgIHJldHVybiBncm91cHM7XG4gIH1cblxuICBwcml2YXRlIGZvcm1hdERhdGUoZGF0ZVN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgdG9tb3Jyb3cgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgODY0MDAwMDApLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGlmIChkYXRlU3RyID09PSB0b2RheSkgcmV0dXJuIFwiVG9kYXlcIjtcbiAgICBpZiAoZGF0ZVN0ciA9PT0gdG9tb3Jyb3cpIHJldHVybiBcIlRvbW9ycm93XCI7XG4gICAgcmV0dXJuIG5ldyBEYXRlKGRhdGVTdHIgKyBcIlQwMDowMDowMFwiKS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7XG4gICAgICBtb250aDogXCJzaG9ydFwiLCBkYXk6IFwibnVtZXJpY1wiXG4gICAgfSk7XG4gIH1cbn0iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxtQkFBc0M7OztBQzRIL0IsSUFBTSxtQkFBc0M7QUFBQSxFQUNqRCxhQUFhO0FBQUEsRUFDYixjQUFjO0FBQUEsRUFDZCxXQUFXO0FBQUEsSUFDVCxFQUFFLElBQUksWUFBWSxNQUFNLFlBQVksT0FBTyxRQUFVLFdBQVcsTUFBTSxZQUFXLG9CQUFJLEtBQUssR0FBRSxZQUFZLEVBQUU7QUFBQSxJQUMxRyxFQUFFLElBQUksUUFBWSxNQUFNLFFBQVksT0FBTyxTQUFVLFdBQVcsTUFBTSxZQUFXLG9CQUFJLEtBQUssR0FBRSxZQUFZLEVBQUU7QUFBQSxFQUM1RztBQUFBLEVBQ0EsbUJBQW1CO0FBQUEsRUFDbkIsbUJBQW1CO0FBQUEsRUFDbkIscUJBQXFCO0FBQUEsRUFDckIsY0FBYztBQUFBLEVBQ2QsYUFBYTtBQUFBLEVBQ2IsWUFBWTtBQUFBLEVBQ1oscUJBQXFCO0FBQUEsRUFDckIsZ0JBQWdCO0FBQUEsRUFDaEIsb0JBQW9CO0FBQUEsRUFDcEIsa0JBQWtCO0FBQ3BCOzs7QUMzSU8sSUFBTSxrQkFBTixNQUFzQjtBQUFBLEVBSTNCLFlBQVksV0FBZ0MsVUFBc0I7QUFDaEUsU0FBSyxZQUFZO0FBQ2pCLFNBQUssV0FBVztBQUFBLEVBQ2xCO0FBQUEsRUFFQSxTQUE4QjtBQUM1QixXQUFPLENBQUMsR0FBRyxLQUFLLFNBQVM7QUFBQSxFQUMzQjtBQUFBLEVBRUEsUUFBUSxJQUEyQztBQUNqRCxXQUFPLEtBQUssVUFBVSxLQUFLLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRTtBQUFBLEVBQy9DO0FBQUEsRUFFQSxPQUFPLE1BQWMsT0FBeUM7QUFDNUQsVUFBTSxXQUE4QjtBQUFBLE1BQ2xDLElBQUksS0FBSyxXQUFXLElBQUk7QUFBQSxNQUN4QjtBQUFB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LFlBQVksRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQzNFLFFBQUksWUFBWSxNQUFPLFFBQU87QUFDOUIsUUFBSSxZQUFZLFNBQVUsUUFBTztBQUNqQyxZQUFPLG9CQUFJLEtBQUssVUFBVSxXQUFXLEdBQUUsbUJBQW1CLFNBQVM7QUFBQSxNQUNqRSxPQUFPO0FBQUEsTUFBUyxLQUFLO0FBQUEsSUFDdkIsQ0FBQztBQUFBLEVBQ0g7QUFDRjs7O0FMelBBLElBQXFCLGtCQUFyQixjQUE2Qyx3QkFBTztBQUFBLEVBTWxELE1BQU0sU0FBUztBQUNiLFVBQU0sS0FBSyxhQUFhO0FBRXhCLFNBQUssa0JBQWtCLElBQUk7QUFBQSxNQUN6QixLQUFLLFNBQVM7QUFBQSxNQUNkLE1BQU0sS0FBSyxhQUFhO0FBQUEsSUFDMUI7QUFDQSxTQUFLLGNBQWMsSUFBSSxZQUFZLEtBQUssS0FBSyxLQUFLLFNBQVMsV0FBVztBQUN0RSxTQUFLLGVBQWUsSUFBSSxhQUFhLEtBQUssS0FBSyxLQUFLLFNBQVMsWUFBWTtBQUd6RSxTQUFLO0FBQUEsTUFDSDtBQUFBLE1BQ0EsQ0FBQyxTQUFTLElBQUksU0FBUyxNQUFNLEtBQUssYUFBYSxLQUFLLGVBQWU7QUFBQSxJQUNyRTtBQUdBLFNBQUssY0FBYyxnQkFBZ0IsYUFBYSxNQUFNO0FBQ3BELFdBQUssYUFBYTtBQUFBLElBQ3BCLENBQUM7QUFHRCxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLFVBQVUsTUFBTSxLQUFLLGFBQWE7QUFBQSxJQUNwQyxDQUFDO0FBRUQsWUFBUSxJQUFJLHlCQUFvQjtBQUFBLEVBQ2xDO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDckIsVUFBTSxFQUFFLFVBQVUsSUFBSSxLQUFLO0FBQzNCLFFBQUksT0FBTyxVQUFVLGdCQUFnQixjQUFjLEVBQUUsQ0FBQztBQUN0RCxRQUFJLENBQUMsTUFBTTtBQUNULGFBQU8sVUFBVSxRQUFRLEtBQUs7QUFDOUIsWUFBTSxLQUFLLGFBQWEsRUFBRSxNQUFNLGdCQUFnQixRQUFRLEtBQUssQ0FBQztBQUFBLElBQ2hFO0FBQ0EsY0FBVSxXQUFXLElBQUk7QUFBQSxFQUMzQjtBQUFBLEVBRUUsV0FBVztBQUNULFNBQUssSUFBSSxVQUFVLG1CQUFtQixjQUFjO0FBQUEsRUFDdEQ7QUFBQSxFQUVBLE1BQU0sZUFBZTtBQUNuQixTQUFLLFdBQVcsT0FBTyxPQUFPLENBQUMsR0FBRyxrQkFBa0IsTUFBTSxLQUFLLFNBQVMsQ0FBQztBQUFBLEVBQzNFO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDbkIsVUFBTSxLQUFLLFNBQVMsS0FBSyxRQUFRO0FBQUEsRUFDbkM7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iXQp9Cg==
