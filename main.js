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

// src/data/AlertManager.ts
var import_obsidian = require("obsidian");
var AlertManager = class {
  constructor(app, taskManager, eventManager) {
    this.intervalId = null;
    this.firedAlerts = /* @__PURE__ */ new Set();
    this.audioCtx = null;
    // Store handler references so we can remove them in stop()
    this.onChanged = null;
    this.onCreate = null;
    this.app = app;
    this.taskManager = taskManager;
    this.eventManager = eventManager;
  }
  start() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setTimeout(() => {
      console.log("[Chronicle] AlertManager ready, starting poll");
      this.check();
      this.intervalId = window.setInterval(() => this.check(), 30 * 1e3);
    }, 3e3);
    this.onChanged = (file) => {
      const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
      const inTasks = file.path.startsWith(this.taskManager["tasksFolder"]);
      if (inEvents || inTasks) setTimeout(() => this.check(), 300);
    };
    this.onCreate = (file) => {
      const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
      const inTasks = file.path.startsWith(this.taskManager["tasksFolder"]);
      if (inEvents || inTasks) setTimeout(() => this.check(), 500);
    };
    this.app.metadataCache.on("changed", this.onChanged);
    this.app.vault.on("create", this.onCreate);
  }
  stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.onChanged) {
      this.app.metadataCache.off("changed", this.onChanged);
      this.onChanged = null;
    }
    if (this.onCreate) {
      this.app.vault.off("create", this.onCreate);
      this.onCreate = null;
    }
    console.log("[Chronicle] AlertManager stopped");
  }
  async check() {
    var _a, _b;
    const now = /* @__PURE__ */ new Date();
    const nowMs = now.getTime();
    const windowMs = 5 * 60 * 1e3;
    console.log(`[Chronicle] Alert check at ${now.toLocaleTimeString()}`);
    const events = await this.eventManager.getAll();
    console.log(`[Chronicle] Checking ${events.length} events`);
    for (const event of events) {
      if (!event.alert || event.alert === "none") continue;
      if (!event.startDate || !event.startTime) continue;
      const alertKey = `event-${event.id}-${event.startDate}-${event.alert}`;
      if (this.firedAlerts.has(alertKey)) continue;
      const startMs = (/* @__PURE__ */ new Date(`${event.startDate}T${event.startTime}`)).getTime();
      const alertMs = startMs - this.offsetToMs(event.alert);
      console.log(`[Chronicle] Event "${event.title}" fires at ${new Date(alertMs).toLocaleTimeString()} (${Math.round((alertMs - nowMs) / 1e3)}s)`);
      if (nowMs >= alertMs && nowMs < alertMs + windowMs) {
        console.log(`[Chronicle] FIRING alert for event "${event.title}"`);
        this.fire(alertKey, event.title, this.buildEventBody(event.startTime, event.alert), "event");
      }
    }
    const tasks = await this.taskManager.getAll();
    console.log(`[Chronicle] Checking ${tasks.length} tasks`);
    for (const task of tasks) {
      if (!task.alert || task.alert === "none") continue;
      if (!task.dueDate && !task.dueTime) continue;
      if (task.status === "done" || task.status === "cancelled") continue;
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const dateStr = (_a = task.dueDate) != null ? _a : todayStr;
      const alertKey = `task-${task.id}-${dateStr}-${task.alert}`;
      if (this.firedAlerts.has(alertKey)) continue;
      const timeStr = (_b = task.dueTime) != null ? _b : "09:00";
      const dueMs = (/* @__PURE__ */ new Date(`${dateStr}T${timeStr}`)).getTime();
      const alertMs = dueMs - this.offsetToMs(task.alert);
      console.log(`[Chronicle] Task "${task.title}" date="${dateStr}" time="${timeStr}" alert="${task.alert}" fires at ${new Date(alertMs).toLocaleTimeString()} (${Math.round((alertMs - nowMs) / 1e3)}s)`);
      if (nowMs >= alertMs && nowMs < alertMs + windowMs) {
        console.log(`[Chronicle] FIRING alert for task "${task.title}"`);
        this.fire(alertKey, task.title, this.buildTaskBody(task.dueDate, task.dueTime, task.alert), "task");
      }
    }
  }
  fire(key, title, body, type) {
    this.firedAlerts.add(key);
    const icon = type === "event" ? "\u{1F5D3}" : "\u2713";
    let notifSent = false;
    try {
      const { exec } = window.require("child_process");
      const t = `Chronicle \u2014 ${type === "event" ? "Event" : "Task"}`;
      const b = `${title} \u2014 ${body}`.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      exec(
        `osascript -e 'display notification "${b}" with title "${t}" sound name "Glass"'`,
        (err) => {
          if (err) console.log("[Chronicle] osascript failed:", err.message);
          else console.log("[Chronicle] osascript notification sent");
        }
      );
      notifSent = true;
    } catch (err) {
      console.log("[Chronicle] osascript unavailable:", err);
    }
    if (!notifSent) {
      try {
        const { ipcRenderer } = window.require("electron");
        ipcRenderer.send("show-notification", {
          title: `Chronicle \u2014 ${type === "event" ? "Event" : "Task"}`,
          body: `${title}
${body}`
        });
        console.log("[Chronicle] ipcRenderer notification sent");
      } catch (err) {
        console.log("[Chronicle] ipcRenderer failed:", err);
      }
    }
    new import_obsidian.Notice(`${icon} ${title}
${body}`, 8e3);
    this.playSound();
  }
  playSound() {
    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      const ctx = this.audioCtx;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + 0.6);
      for (const [freq, delay] of [[880, 0], [1108, 0.15]]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        osc.connect(gain);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.5);
      }
    } catch (e) {
    }
  }
  offsetToMs(offset) {
    var _a;
    const map = {
      "none": 0,
      "at-time": 0,
      "5min": 3e5,
      "10min": 6e5,
      "15min": 9e5,
      "30min": 18e5,
      "1hour": 36e5,
      "2hours": 72e5,
      "1day": 864e5,
      "2days": 1728e5,
      "1week": 6048e5
    };
    return (_a = map[offset]) != null ? _a : 0;
  }
  buildEventBody(startTime, alert) {
    if (alert === "at-time") return `Starting at ${this.formatTime(startTime)}`;
    return `${this.offsetLabel(alert)} \u2014 starts at ${this.formatTime(startTime)}`;
  }
  buildTaskBody(dueDate, dueTime, alert) {
    const dateLabel = (/* @__PURE__ */ new Date(dueDate + "T00:00:00")).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
    if (dueTime) {
      if (alert === "at-time") return `Due at ${this.formatTime(dueTime)}`;
      return `${this.offsetLabel(alert)} \u2014 due at ${this.formatTime(dueTime)}`;
    }
    return `Due ${dateLabel}`;
  }
  offsetLabel(offset) {
    var _a;
    const map = {
      "none": "",
      "at-time": "Now",
      "5min": "5 min",
      "10min": "10 min",
      "15min": "15 min",
      "30min": "30 min",
      "1hour": "1 hour",
      "2hours": "2 hours",
      "1day": "1 day",
      "2days": "2 days",
      "1week": "1 week"
    };
    return (_a = map[offset]) != null ? _a : "";
  }
  formatTime(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  }
};

// src/views/EventFormView.ts
var import_obsidian2 = require("obsidian");

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
var EventFormView = class extends import_obsidian2.ItemView {
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
var import_obsidian10 = require("obsidian");

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
var import_obsidian3 = require("obsidian");
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
      if (child instanceof import_obsidian3.TFile && child.extension === "md") {
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
    const path = (0, import_obsidian3.normalizePath)(`${this.tasksFolder}/${full.title}.md`);
    await this.app.vault.create(path, this.taskToMarkdown(full));
    return full;
  }
  async update(task) {
    var _a;
    const file = this.findFileForTask(task.id);
    if (!file) return;
    const expectedPath = (0, import_obsidian3.normalizePath)(`${this.tasksFolder}/${task.title}.md`);
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
    var _a, _b, _c, _d, _e, _f, _g;
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
      "alert": (_e = task.alert) != null ? _e : "none",
      "time-estimate": (_f = task.timeEstimate) != null ? _f : null,
      "time-entries": task.timeEntries,
      "custom-fields": task.customFields,
      "completed-instances": task.completedInstances,
      "created-at": task.createdAt,
      "completed-at": (_g = task.completedAt) != null ? _g : null
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
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
        alert: (_g = fm.alert) != null ? _g : "none",
        calendarId: (_h = fm["calendar-id"]) != null ? _h : void 0,
        tags: (_i = fm.tags) != null ? _i : [],
        contexts: (_j = fm.contexts) != null ? _j : [],
        linkedNotes: (_k = fm["linked-notes"]) != null ? _k : [],
        projects: (_l = fm.projects) != null ? _l : [],
        timeEstimate: (_m = fm["time-estimate"]) != null ? _m : void 0,
        timeEntries: (_n = fm["time-entries"]) != null ? _n : [],
        customFields: (_o = fm["custom-fields"]) != null ? _o : [],
        completedInstances: (_p = fm["completed-instances"]) != null ? _p : [],
        createdAt: (_q = fm["created-at"]) != null ? _q : (/* @__PURE__ */ new Date()).toISOString(),
        completedAt: (_r = fm["completed-at"]) != null ? _r : void 0,
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
      if (!(child instanceof import_obsidian3.TFile)) continue;
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
var import_obsidian4 = require("obsidian");
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
      if (child instanceof import_obsidian4.TFile && child.extension === "md") {
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
    const path = (0, import_obsidian4.normalizePath)(`${this.eventsFolder}/${full.title}.md`);
    await this.app.vault.create(path, this.eventToMarkdown(full));
    return full;
  }
  async update(event) {
    var _a;
    const file = this.findFileForEvent(event.id);
    if (!file) return;
    const expectedPath = (0, import_obsidian4.normalizePath)(`${this.eventsFolder}/${event.title}.md`);
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
      if (!(child instanceof import_obsidian4.TFile)) continue;
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
var import_obsidian5 = require("obsidian");
var TaskModal = class extends import_obsidian5.Modal {
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
    const dueDateInput = this.field(row2, "Date").createEl("input", {
      type: "date",
      cls: "cf-input"
    });
    dueDateInput.value = (_b = t == null ? void 0 : t.dueDate) != null ? _b : "";
    const dueTimeInput = this.field(row2, "Time").createEl("input", {
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
    const alertSelect = this.field(form, "Alert").createEl("select", { cls: "cf-select" });
    const taskAlerts = [
      { value: "none", label: "None" },
      { value: "at-time", label: "At time of task" },
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
    for (const a of taskAlerts) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if ((t == null ? void 0 : t.alert) === a.value) opt.selected = true;
    }
    if (!t) {
      const noneOpt = alertSelect.querySelector('option[value="none"]');
      if (noneOpt) noneOpt.selected = true;
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
        notes: notesInput.value || void 0,
        alert: alertSelect.value,
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
var import_obsidian7 = require("obsidian");

// src/views/TaskFormView.ts
var import_obsidian6 = require("obsidian");
var TASK_FORM_VIEW_TYPE = "chronicle-task-form";
var TaskFormView = class extends import_obsidian6.ItemView {
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
    const dueDateField = this.field(row2, "Date");
    const dueDateInput = dueDateField.createEl("input", {
      type: "date",
      cls: "cf-input"
    });
    dueDateInput.value = (_b = t == null ? void 0 : t.dueDate) != null ? _b : "";
    const dueTimeField = this.field(row2, "Time");
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
    const alertField = this.field(form, "Alert");
    const alertSelect = alertField.createEl("select", { cls: "cf-select" });
    const formAlerts = [
      { value: "none", label: "None" },
      { value: "at-time", label: "At time of task" },
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
    for (const a of formAlerts) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if ((t == null ? void 0 : t.alert) === a.value) opt.selected = true;
    }
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
          new import_obsidian6.Notice(`A task named "${title}" already exists.`, 4e3);
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
        alert: alertSelect.value,
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
var TaskView = class extends import_obsidian7.ItemView {
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
var import_obsidian9 = require("obsidian");

// src/ui/EventModal.ts
var import_obsidian8 = require("obsidian");
var EventModal = class extends import_obsidian8.Modal {
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
var CalendarView = class extends import_obsidian9.ItemView {
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
var ChroniclePlugin = class extends import_obsidian10.Plugin {
  async onload() {
    await this.loadSettings();
    this.calendarManager = new CalendarManager(
      this.settings.calendars,
      () => this.saveSettings()
    );
    this.taskManager = new TaskManager(this.app, this.settings.tasksFolder);
    this.eventManager = new EventManager(this.app, this.settings.eventsFolder);
    this.alertManager = new AlertManager(this.app, this.taskManager, this.eventManager);
    this.alertManager.start();
    this.alertManager.stop();
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL2RhdGEvQWxlcnRNYW5hZ2VyLnRzIiwgInNyYy92aWV3cy9FdmVudEZvcm1WaWV3LnRzIiwgInNyYy9kYXRhL0NhbGVuZGFyTWFuYWdlci50cyIsICJzcmMvdHlwZXMvaW5kZXgudHMiLCAic3JjL2RhdGEvVGFza01hbmFnZXIudHMiLCAic3JjL2RhdGEvRXZlbnRNYW5hZ2VyLnRzIiwgInNyYy91aS9UYXNrTW9kYWwudHMiLCAic3JjL3ZpZXdzL1Rhc2tWaWV3LnRzIiwgInNyYy92aWV3cy9UYXNrRm9ybVZpZXcudHMiLCAic3JjL3ZpZXdzL0NhbGVuZGFyVmlldy50cyIsICJzcmMvdWkvRXZlbnRNb2RhbC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQWxlcnRNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9BbGVydE1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZVNldHRpbmdzLCBERUZBVUxUX1NFVFRJTkdTLCBDaHJvbmljbGVFdmVudCB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBFdmVudEZvcm1WaWV3LCBFVkVOVF9GT1JNX1ZJRVdfVFlQRSB9IGZyb20gXCIuL3ZpZXdzL0V2ZW50Rm9ybVZpZXdcIjtcbmltcG9ydCB7IFBsdWdpbiwgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlU2V0dGluZ3MsIERFRkFVTFRfU0VUVElOR1MgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IFRhc2tNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9UYXNrTWFuYWdlclwiO1xuaW1wb3J0IHsgRXZlbnRNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9FdmVudE1hbmFnZXJcIjtcbmltcG9ydCB7IFRhc2tWaWV3LCBUQVNLX1ZJRVdfVFlQRSB9IGZyb20gXCIuL3ZpZXdzL1Rhc2tWaWV3XCI7XG5pbXBvcnQgeyBUYXNrRm9ybVZpZXcsIFRBU0tfRk9STV9WSUVXX1RZUEUgfSBmcm9tIFwiLi92aWV3cy9UYXNrRm9ybVZpZXdcIjtcbmltcG9ydCB7IENhbGVuZGFyVmlldywgQ0FMRU5EQVJfVklFV19UWVBFIH0gZnJvbSBcIi4vdmlld3MvQ2FsZW5kYXJWaWV3XCI7XG5pbXBvcnQgeyBFdmVudE1vZGFsIH0gZnJvbSBcIi4vdWkvRXZlbnRNb2RhbFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaHJvbmljbGVQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5nczogQ2hyb25pY2xlU2V0dGluZ3M7XG4gIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICB0YXNrTWFuYWdlcjogVGFza01hbmFnZXI7XG4gIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyO1xuICBhbGVydE1hbmFnZXI6IEFsZXJ0TWFuYWdlcjtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcblxuICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyID0gbmV3IENhbGVuZGFyTWFuYWdlcihcbiAgICAgIHRoaXMuc2V0dGluZ3MuY2FsZW5kYXJzLFxuICAgICAgKCkgPT4gdGhpcy5zYXZlU2V0dGluZ3MoKVxuICAgICk7XG4gICAgdGhpcy50YXNrTWFuYWdlciAgPSBuZXcgVGFza01hbmFnZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MudGFza3NGb2xkZXIpO1xuICAgIHRoaXMuZXZlbnRNYW5hZ2VyID0gbmV3IEV2ZW50TWFuYWdlcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncy5ldmVudHNGb2xkZXIpO1xuXG4gICAgdGhpcy5hbGVydE1hbmFnZXIgPSBuZXcgQWxlcnRNYW5hZ2VyKHRoaXMuYXBwLCB0aGlzLnRhc2tNYW5hZ2VyLCB0aGlzLmV2ZW50TWFuYWdlcik7XG4gICAgdGhpcy5hbGVydE1hbmFnZXIuc3RhcnQoKTtcbiAgICB0aGlzLmFsZXJ0TWFuYWdlci5zdG9wKCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgIFRBU0tfVklFV19UWVBFLFxuICAgICAgKGxlYWYpID0+IG5ldyBUYXNrVmlldyhsZWFmLCB0aGlzLnRhc2tNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlciwgdGhpcy5ldmVudE1hbmFnZXIpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgIFRBU0tfRk9STV9WSUVXX1RZUEUsXG4gICAgICAobGVhZikgPT4gbmV3IFRhc2tGb3JtVmlldyhsZWFmLCB0aGlzLnRhc2tNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlcilcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJWaWV3KFxuICAgICAgQ0FMRU5EQVJfVklFV19UWVBFLFxuICAgICAgKGxlYWYpID0+IG5ldyBDYWxlbmRhclZpZXcobGVhZiwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMudGFza01hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlclZpZXcoXG4gICAgICBFVkVOVF9GT1JNX1ZJRVdfVFlQRSxcbiAgICAgIChsZWFmKSA9PiBuZXcgRXZlbnRGb3JtVmlldyhsZWFmLCB0aGlzLmV2ZW50TWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIpXG4gICAgKTtcblxuICAgIC8vIFJpYmJvbiBcdTIwMTQgdGFza3MgKGNoZWNrbGlzdCBpY29uKVxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcImNoZWNrLWNpcmNsZVwiLCBcIkNocm9uaWNsZSBUYXNrc1wiLCAoKSA9PiB0aGlzLmFjdGl2YXRlVGFza1ZpZXcoKSk7XG5cbiAgICAvLyBSaWJib24gXHUyMDE0IGNhbGVuZGFyXG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwiY2FsZW5kYXJcIiwgXCJDaHJvbmljbGUgQ2FsZW5kYXJcIiwgKCkgPT4gdGhpcy5hY3RpdmF0ZUNhbGVuZGFyVmlldygpKTtcblxuICAgIC8vIENvbW1hbmRzXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9wZW4tY2hyb25pY2xlXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gdGFzayBkYXNoYm9hcmRcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLmFjdGl2YXRlVGFza1ZpZXcoKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib3Blbi1jYWxlbmRhclwiLFxuICAgICAgbmFtZTogXCJPcGVuIGNhbGVuZGFyXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5hY3RpdmF0ZUNhbGVuZGFyVmlldygpLFxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJuZXctdGFza1wiLFxuICAgICAgbmFtZTogXCJOZXcgdGFza1wiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIl0sIGtleTogXCJuXCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5vcGVuVGFza0Zvcm0oKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibmV3LWV2ZW50XCIsXG4gICAgICBuYW1lOiBcIk5ldyBldmVudFwiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIm5cIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm9wZW5FdmVudE1vZGFsKCksXG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZyhcIkNocm9uaWNsZSBsb2FkZWQgXHUyNzEzXCIpO1xuICB9XG5cbiAgYXN5bmMgYWN0aXZhdGVUYXNrVmlldygpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgbGV0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfVklFV19UWVBFKVswXTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogVEFTS19WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBhc3luYyBhY3RpdmF0ZUNhbGVuZGFyVmlldygpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgbGV0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKENBTEVOREFSX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IENBTEVOREFSX1ZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIH1cbiAgICB3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5UYXNrRm9ybSgpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfRk9STV9WSUVXX1RZUEUpWzBdO1xuICAgIGlmIChleGlzdGluZykgZXhpc3RpbmcuZGV0YWNoKCk7XG4gICAgY29uc3QgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogVEFTS19GT1JNX1ZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgb3BlbkV2ZW50TW9kYWwoZXZlbnQ/OiBDaHJvbmljbGVFdmVudCkge1xuICAgIG5ldyBFdmVudE1vZGFsKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLmV2ZW50TWFuYWdlcixcbiAgICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLFxuICAgICAgZXZlbnQsXG4gICAgICB1bmRlZmluZWQsXG4gICAgICAoZSkgPT4gdGhpcy5vcGVuRXZlbnRGdWxsUGFnZShlKVxuICAgICkub3BlbigpO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShUQVNLX1ZJRVdfVFlQRSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShUQVNLX0ZPUk1fVklFV19UWVBFKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKENBTEVOREFSX1ZJRVdfVFlQRSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5FdmVudEZ1bGxQYWdlKGV2ZW50PzogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEVWRU5UX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBpZiAoZXhpc3RpbmcpIGV4aXN0aW5nLmRldGFjaCgpO1xuICAgIGNvbnN0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IEVWRU5UX0ZPUk1fVklFV19UWVBFLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7XG4gICAgY29uc3QgZm9ybUxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEVWRU5UX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBjb25zdCBmb3JtVmlldyA9IGZvcm1MZWFmPy52aWV3IGFzIEV2ZW50Rm9ybVZpZXcgfCB1bmRlZmluZWQ7XG4gICAgaWYgKGZvcm1WaWV3ICYmIGV2ZW50KSBmb3JtVmlldy5sb2FkRXZlbnQoZXZlbnQpO1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgVGFza01hbmFnZXIgfSBmcm9tIFwiLi9UYXNrTWFuYWdlclwiO1xuaW1wb3J0IHsgRXZlbnRNYW5hZ2VyIH0gZnJvbSBcIi4vRXZlbnRNYW5hZ2VyXCI7XG5pbXBvcnQgeyBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgQWxlcnRNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBhcHA6ICAgICAgICAgIEFwcDtcbiAgcHJpdmF0ZSB0YXNrTWFuYWdlcjogIFRhc2tNYW5hZ2VyO1xuICBwcml2YXRlIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyO1xuICBwcml2YXRlIGludGVydmFsSWQ6ICAgbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZmlyZWRBbGVydHM6ICBTZXQ8c3RyaW5nPiAgID0gbmV3IFNldCgpO1xuICBwcml2YXRlIGF1ZGlvQ3R4OiAgICAgQXVkaW9Db250ZXh0IHwgbnVsbCA9IG51bGw7XG5cbiAgLy8gU3RvcmUgaGFuZGxlciByZWZlcmVuY2VzIHNvIHdlIGNhbiByZW1vdmUgdGhlbSBpbiBzdG9wKClcbiAgcHJpdmF0ZSBvbkNoYW5nZWQ6ICgoZmlsZTogVEZpbGUpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgb25DcmVhdGU6ICAoKGZpbGU6IGFueSkgICA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCB0YXNrTWFuYWdlcjogVGFza01hbmFnZXIsIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyKSB7XG4gICAgdGhpcy5hcHAgICAgICAgICAgPSBhcHA7XG4gICAgdGhpcy50YXNrTWFuYWdlciAgPSB0YXNrTWFuYWdlcjtcbiAgICB0aGlzLmV2ZW50TWFuYWdlciA9IGV2ZW50TWFuYWdlcjtcbiAgfVxuXG4gIHN0YXJ0KCkge1xuICAgIC8vIFJlcXVlc3QgcGVybWlzc2lvbiBpbmxpbmVcbiAgICBpZiAoXCJOb3RpZmljYXRpb25cIiBpbiB3aW5kb3cgJiYgTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZGVmYXVsdFwiKSB7XG4gICAgICBOb3RpZmljYXRpb24ucmVxdWVzdFBlcm1pc3Npb24oKTtcbiAgICB9XG5cbiAgICAvLyBEZWxheSBmaXJzdCBjaGVjayB0byBsZXQgdmF1bHQgZmluaXNoIGxvYWRpbmdcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiW0Nocm9uaWNsZV0gQWxlcnRNYW5hZ2VyIHJlYWR5LCBzdGFydGluZyBwb2xsXCIpO1xuICAgICAgdGhpcy5jaGVjaygpO1xuICAgICAgdGhpcy5pbnRlcnZhbElkID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHRoaXMuY2hlY2soKSwgMzAgKiAxMDAwKTtcbiAgICB9LCAzMDAwKTtcblxuICAgIC8vIFJlLWNoZWNrIHdoZW4gZmlsZXMgY2hhbmdlIFx1MjAxNCBzdG9yZSByZWZzIHNvIHdlIGNhbiByZW1vdmUgdGhlbVxuICAgIHRoaXMub25DaGFuZ2VkID0gKGZpbGU6IFRGaWxlKSA9PiB7XG4gICAgICBjb25zdCBpbkV2ZW50cyA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMuZXZlbnRNYW5hZ2VyW1wiZXZlbnRzRm9sZGVyXCJdKTtcbiAgICAgIGNvbnN0IGluVGFza3MgID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKTtcbiAgICAgIGlmIChpbkV2ZW50cyB8fCBpblRhc2tzKSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuY2hlY2soKSwgMzAwKTtcbiAgICB9O1xuXG4gICAgdGhpcy5vbkNyZWF0ZSA9IChmaWxlOiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IGluRXZlbnRzID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5ldmVudE1hbmFnZXJbXCJldmVudHNGb2xkZXJcIl0pO1xuICAgICAgY29uc3QgaW5UYXNrcyAgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLnRhc2tNYW5hZ2VyW1widGFza3NGb2xkZXJcIl0pO1xuICAgICAgaWYgKGluRXZlbnRzIHx8IGluVGFza3MpIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5jaGVjaygpLCA1MDApO1xuICAgIH07XG5cbiAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCB0aGlzLm9uQ2hhbmdlZCk7XG4gICAgdGhpcy5hcHAudmF1bHQub24oXCJjcmVhdGVcIiwgdGhpcy5vbkNyZWF0ZSk7XG4gIH1cblxuICBzdG9wKCkge1xuICAgIGlmICh0aGlzLmludGVydmFsSWQgIT09IG51bGwpIHtcbiAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWxJZCk7XG4gICAgICB0aGlzLmludGVydmFsSWQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy5vbkNoYW5nZWQpIHtcbiAgICAgIHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUub2ZmKFwiY2hhbmdlZFwiLCB0aGlzLm9uQ2hhbmdlZCk7XG4gICAgICB0aGlzLm9uQ2hhbmdlZCA9IG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLm9uQ3JlYXRlKSB7XG4gICAgICB0aGlzLmFwcC52YXVsdC5vZmYoXCJjcmVhdGVcIiwgdGhpcy5vbkNyZWF0ZSk7XG4gICAgICB0aGlzLm9uQ3JlYXRlID0gbnVsbDtcbiAgICB9XG4gICAgY29uc29sZS5sb2coXCJbQ2hyb25pY2xlXSBBbGVydE1hbmFnZXIgc3RvcHBlZFwiKTtcbiAgfVxuXG4gIGFzeW5jIGNoZWNrKCkge1xuICAgIGNvbnN0IG5vdyAgICAgID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBub3dNcyAgICA9IG5vdy5nZXRUaW1lKCk7XG4gICAgY29uc3Qgd2luZG93TXMgPSA1ICogNjAgKiAxMDAwO1xuXG4gICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIEFsZXJ0IGNoZWNrIGF0ICR7bm93LnRvTG9jYWxlVGltZVN0cmluZygpfWApO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIENoZWNrIGV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBldmVudHMgPSBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci5nZXRBbGwoKTtcbiAgICBjb25zb2xlLmxvZyhgW0Nocm9uaWNsZV0gQ2hlY2tpbmcgJHtldmVudHMubGVuZ3RofSBldmVudHNgKTtcblxuICAgIGZvciAoY29uc3QgZXZlbnQgb2YgZXZlbnRzKSB7XG4gICAgICBpZiAoIWV2ZW50LmFsZXJ0IHx8IGV2ZW50LmFsZXJ0ID09PSBcIm5vbmVcIikgY29udGludWU7XG4gICAgICBpZiAoIWV2ZW50LnN0YXJ0RGF0ZSB8fCAhZXZlbnQuc3RhcnRUaW1lKSAgIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBhbGVydEtleSA9IGBldmVudC0ke2V2ZW50LmlkfS0ke2V2ZW50LnN0YXJ0RGF0ZX0tJHtldmVudC5hbGVydH1gO1xuICAgICAgaWYgKHRoaXMuZmlyZWRBbGVydHMuaGFzKGFsZXJ0S2V5KSkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IHN0YXJ0TXMgPSBuZXcgRGF0ZShgJHtldmVudC5zdGFydERhdGV9VCR7ZXZlbnQuc3RhcnRUaW1lfWApLmdldFRpbWUoKTtcbiAgICAgIGNvbnN0IGFsZXJ0TXMgPSBzdGFydE1zIC0gdGhpcy5vZmZzZXRUb01zKGV2ZW50LmFsZXJ0KTtcblxuICAgICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIEV2ZW50IFwiJHtldmVudC50aXRsZX1cIiBmaXJlcyBhdCAke25ldyBEYXRlKGFsZXJ0TXMpLnRvTG9jYWxlVGltZVN0cmluZygpfSAoJHtNYXRoLnJvdW5kKChhbGVydE1zIC0gbm93TXMpLzEwMDApfXMpYCk7XG5cbiAgICAgIGlmIChub3dNcyA+PSBhbGVydE1zICYmIG5vd01zIDwgYWxlcnRNcyArIHdpbmRvd01zKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbQ2hyb25pY2xlXSBGSVJJTkcgYWxlcnQgZm9yIGV2ZW50IFwiJHtldmVudC50aXRsZX1cImApO1xuICAgICAgICB0aGlzLmZpcmUoYWxlcnRLZXksIGV2ZW50LnRpdGxlLCB0aGlzLmJ1aWxkRXZlbnRCb2R5KGV2ZW50LnN0YXJ0VGltZSwgZXZlbnQuYWxlcnQpLCBcImV2ZW50XCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBDaGVjayB0YXNrcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB0YXNrcyA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0QWxsKCk7XG4gICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIENoZWNraW5nICR7dGFza3MubGVuZ3RofSB0YXNrc2ApO1xuXG4gICAgZm9yIChjb25zdCB0YXNrIG9mIHRhc2tzKSB7XG4gICAgICBpZiAoIXRhc2suYWxlcnQgfHwgdGFzay5hbGVydCA9PT0gXCJub25lXCIpICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICBpZiAoIXRhc2suZHVlRGF0ZSAmJiAhdGFzay5kdWVUaW1lKSAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgaWYgKHRhc2suc3RhdHVzID09PSBcImRvbmVcIiB8fCB0YXNrLnN0YXR1cyA9PT0gXCJjYW5jZWxsZWRcIikgY29udGludWU7XG5cbiAgICAgIGNvbnN0IHRvZGF5U3RyID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICAgIGNvbnN0IGRhdGVTdHIgID0gdGFzay5kdWVEYXRlID8/IHRvZGF5U3RyO1xuICAgICAgY29uc3QgYWxlcnRLZXkgPSBgdGFzay0ke3Rhc2suaWR9LSR7ZGF0ZVN0cn0tJHt0YXNrLmFsZXJ0fWA7XG4gICAgICBpZiAodGhpcy5maXJlZEFsZXJ0cy5oYXMoYWxlcnRLZXkpKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgdGltZVN0ciA9IHRhc2suZHVlVGltZSA/PyBcIjA5OjAwXCI7XG4gICAgICBjb25zdCBkdWVNcyAgID0gbmV3IERhdGUoYCR7ZGF0ZVN0cn1UJHt0aW1lU3RyfWApLmdldFRpbWUoKTtcbiAgICAgIGNvbnN0IGFsZXJ0TXMgPSBkdWVNcyAtIHRoaXMub2Zmc2V0VG9Ncyh0YXNrLmFsZXJ0KTtcblxuICAgICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIFRhc2sgXCIke3Rhc2sudGl0bGV9XCIgZGF0ZT1cIiR7ZGF0ZVN0cn1cIiB0aW1lPVwiJHt0aW1lU3RyfVwiIGFsZXJ0PVwiJHt0YXNrLmFsZXJ0fVwiIGZpcmVzIGF0ICR7bmV3IERhdGUoYWxlcnRNcykudG9Mb2NhbGVUaW1lU3RyaW5nKCl9ICgke01hdGgucm91bmQoKGFsZXJ0TXMgLSBub3dNcykvMTAwMCl9cylgKTtcblxuICAgICAgaWYgKG5vd01zID49IGFsZXJ0TXMgJiYgbm93TXMgPCBhbGVydE1zICsgd2luZG93TXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIEZJUklORyBhbGVydCBmb3IgdGFzayBcIiR7dGFzay50aXRsZX1cImApO1xuICAgICAgICB0aGlzLmZpcmUoYWxlcnRLZXksIHRhc2sudGl0bGUsIHRoaXMuYnVpbGRUYXNrQm9keSh0YXNrLmR1ZURhdGUsIHRhc2suZHVlVGltZSwgdGFzay5hbGVydCksIFwidGFza1wiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpcmUoa2V5OiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIGJvZHk6IHN0cmluZywgdHlwZTogXCJldmVudFwiIHwgXCJ0YXNrXCIpIHtcbiAgICB0aGlzLmZpcmVkQWxlcnRzLmFkZChrZXkpO1xuICAgIGNvbnN0IGljb24gPSB0eXBlID09PSBcImV2ZW50XCIgPyBcIlx1RDgzRFx1REREM1wiIDogXCJcdTI3MTNcIjtcblxuICAgIC8vIE5hdGl2ZSBtYWNPUyBub3RpZmljYXRpb24gXHUyMDE0IHRyeSBtdWx0aXBsZSBhcHByb2FjaGVzXG4gICAgbGV0IG5vdGlmU2VudCA9IGZhbHNlO1xuXG4gICAgLy8gQXBwcm9hY2ggMTogb3Nhc2NyaXB0IChtb3N0IHJlbGlhYmxlIG9uIG1hY09TIHJlZ2FyZGxlc3Mgb2YgRWxlY3Ryb24gdmVyc2lvbilcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBleGVjIH0gPSAod2luZG93IGFzIGFueSkucmVxdWlyZShcImNoaWxkX3Byb2Nlc3NcIik7XG4gICAgICBjb25zdCB0ID0gYENocm9uaWNsZSBcdTIwMTQgJHt0eXBlID09PSBcImV2ZW50XCIgPyBcIkV2ZW50XCIgOiBcIlRhc2tcIn1gO1xuICAgICAgY29uc3QgYiA9IGAke3RpdGxlfSBcdTIwMTQgJHtib2R5fWAucmVwbGFjZSgvXFxcXC9nLCBcIlxcXFxcXFxcXCIpLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKTtcbiAgICAgIGV4ZWMoYG9zYXNjcmlwdCAtZSAnZGlzcGxheSBub3RpZmljYXRpb24gXCIke2J9XCIgd2l0aCB0aXRsZSBcIiR7dH1cIiBzb3VuZCBuYW1lIFwiR2xhc3NcIidgLFxuICAgICAgICAoZXJyOiBhbnkpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSBjb25zb2xlLmxvZyhcIltDaHJvbmljbGVdIG9zYXNjcmlwdCBmYWlsZWQ6XCIsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICBlbHNlIGNvbnNvbGUubG9nKFwiW0Nocm9uaWNsZV0gb3Nhc2NyaXB0IG5vdGlmaWNhdGlvbiBzZW50XCIpO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgbm90aWZTZW50ID0gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiW0Nocm9uaWNsZV0gb3Nhc2NyaXB0IHVuYXZhaWxhYmxlOlwiLCBlcnIpO1xuICAgIH1cblxuICAgIC8vIEFwcHJvYWNoIDI6IEVsZWN0cm9uIGlwY1JlbmRlcmVyIFx1MjE5MiBtYWluIHByb2Nlc3MgKGZhbGxiYWNrKVxuICAgIGlmICghbm90aWZTZW50KSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB7IGlwY1JlbmRlcmVyIH0gPSAod2luZG93IGFzIGFueSkucmVxdWlyZShcImVsZWN0cm9uXCIpO1xuICAgICAgICBpcGNSZW5kZXJlci5zZW5kKFwic2hvdy1ub3RpZmljYXRpb25cIiwge1xuICAgICAgICAgIHRpdGxlOiBgQ2hyb25pY2xlIFx1MjAxNCAke3R5cGUgPT09IFwiZXZlbnRcIiA/IFwiRXZlbnRcIiA6IFwiVGFza1wifWAsXG4gICAgICAgICAgYm9keTogIGAke3RpdGxlfVxcbiR7Ym9keX1gLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2coXCJbQ2hyb25pY2xlXSBpcGNSZW5kZXJlciBub3RpZmljYXRpb24gc2VudFwiKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmxvZyhcIltDaHJvbmljbGVdIGlwY1JlbmRlcmVyIGZhaWxlZDpcIiwgZXJyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJbi1hcHAgdG9hc3QgXHUyMDE0IGFsd2F5cyB3b3Jrc1xuICAgIG5ldyBOb3RpY2UoYCR7aWNvbn0gJHt0aXRsZX1cXG4ke2JvZHl9YCwgODAwMCk7XG5cbiAgICAvLyBTb3VuZFxuICAgIHRoaXMucGxheVNvdW5kKCk7XG4gIH1cblxuICBwcml2YXRlIHBsYXlTb3VuZCgpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLmF1ZGlvQ3R4KSB0aGlzLmF1ZGlvQ3R4ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuICAgICAgY29uc3QgY3R4ICA9IHRoaXMuYXVkaW9DdHg7XG4gICAgICBjb25zdCBnYWluID0gY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgIGdhaW4uY29ubmVjdChjdHguZGVzdGluYXRpb24pO1xuICAgICAgZ2Fpbi5nYWluLnNldFZhbHVlQXRUaW1lKDAuMywgY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgIGdhaW4uZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKDAuMDAxLCBjdHguY3VycmVudFRpbWUgKyAwLjYpO1xuICAgICAgZm9yIChjb25zdCBbZnJlcSwgZGVsYXldIG9mIFtbODgwLCAwXSwgWzExMDgsIDAuMTVdXSBhcyBbbnVtYmVyLCBudW1iZXJdW10pIHtcbiAgICAgICAgY29uc3Qgb3NjID0gY3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgICAgICAgb3NjLnR5cGUgPSBcInNpbmVcIjtcbiAgICAgICAgb3NjLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZShmcmVxLCBjdHguY3VycmVudFRpbWUgKyBkZWxheSk7XG4gICAgICAgIG9zYy5jb25uZWN0KGdhaW4pO1xuICAgICAgICBvc2Muc3RhcnQoY3R4LmN1cnJlbnRUaW1lICsgZGVsYXkpO1xuICAgICAgICBvc2Muc3RvcChjdHguY3VycmVudFRpbWUgKyBkZWxheSArIDAuNSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7IC8qIHNpbGVudCBmYWlsICovIH1cbiAgfVxuXG4gIHByaXZhdGUgb2Zmc2V0VG9NcyhvZmZzZXQ6IEFsZXJ0T2Zmc2V0KTogbnVtYmVyIHtcbiAgICBjb25zdCBtYXA6IFJlY29yZDxBbGVydE9mZnNldCwgbnVtYmVyPiA9IHtcbiAgICAgIFwibm9uZVwiOiAgICAwLCAgICAgICBcImF0LXRpbWVcIjogMCxcbiAgICAgIFwiNW1pblwiOiAgICAzMDAwMDAsICBcIjEwbWluXCI6ICAgNjAwMDAwLFxuICAgICAgXCIxNW1pblwiOiAgIDkwMDAwMCwgIFwiMzBtaW5cIjogICAxODAwMDAwLFxuICAgICAgXCIxaG91clwiOiAgIDM2MDAwMDAsIFwiMmhvdXJzXCI6ICA3MjAwMDAwLFxuICAgICAgXCIxZGF5XCI6ICAgIDg2NDAwMDAwLFwiMmRheXNcIjogICAxNzI4MDAwMDAsXG4gICAgICBcIjF3ZWVrXCI6ICAgNjA0ODAwMDAwLFxuICAgIH07XG4gICAgcmV0dXJuIG1hcFtvZmZzZXRdID8/IDA7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkRXZlbnRCb2R5KHN0YXJ0VGltZTogc3RyaW5nLCBhbGVydDogQWxlcnRPZmZzZXQpOiBzdHJpbmcge1xuICAgIGlmIChhbGVydCA9PT0gXCJhdC10aW1lXCIpIHJldHVybiBgU3RhcnRpbmcgYXQgJHt0aGlzLmZvcm1hdFRpbWUoc3RhcnRUaW1lKX1gO1xuICAgIHJldHVybiBgJHt0aGlzLm9mZnNldExhYmVsKGFsZXJ0KX0gXHUyMDE0IHN0YXJ0cyBhdCAke3RoaXMuZm9ybWF0VGltZShzdGFydFRpbWUpfWA7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkVGFza0JvZHkoZHVlRGF0ZTogc3RyaW5nLCBkdWVUaW1lOiBzdHJpbmcgfCB1bmRlZmluZWQsIGFsZXJ0OiBBbGVydE9mZnNldCk6IHN0cmluZyB7XG4gICAgY29uc3QgZGF0ZUxhYmVsID0gbmV3IERhdGUoZHVlRGF0ZSArIFwiVDAwOjAwOjAwXCIpLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHtcbiAgICAgIHdlZWtkYXk6IFwic2hvcnRcIiwgbW9udGg6IFwic2hvcnRcIiwgZGF5OiBcIm51bWVyaWNcIlxuICAgIH0pO1xuICAgIGlmIChkdWVUaW1lKSB7XG4gICAgICBpZiAoYWxlcnQgPT09IFwiYXQtdGltZVwiKSByZXR1cm4gYER1ZSBhdCAke3RoaXMuZm9ybWF0VGltZShkdWVUaW1lKX1gO1xuICAgICAgcmV0dXJuIGAke3RoaXMub2Zmc2V0TGFiZWwoYWxlcnQpfSBcdTIwMTQgZHVlIGF0ICR7dGhpcy5mb3JtYXRUaW1lKGR1ZVRpbWUpfWA7XG4gICAgfVxuICAgIHJldHVybiBgRHVlICR7ZGF0ZUxhYmVsfWA7XG4gIH1cblxuICBwcml2YXRlIG9mZnNldExhYmVsKG9mZnNldDogQWxlcnRPZmZzZXQpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1hcDogUmVjb3JkPEFsZXJ0T2Zmc2V0LCBzdHJpbmc+ID0ge1xuICAgICAgXCJub25lXCI6IFwiXCIsIFwiYXQtdGltZVwiOiBcIk5vd1wiLFxuICAgICAgXCI1bWluXCI6IFwiNSBtaW5cIiwgXCIxMG1pblwiOiBcIjEwIG1pblwiLCBcIjE1bWluXCI6IFwiMTUgbWluXCIsIFwiMzBtaW5cIjogXCIzMCBtaW5cIixcbiAgICAgIFwiMWhvdXJcIjogXCIxIGhvdXJcIiwgXCIyaG91cnNcIjogXCIyIGhvdXJzXCIsXG4gICAgICBcIjFkYXlcIjogXCIxIGRheVwiLCBcIjJkYXlzXCI6IFwiMiBkYXlzXCIsIFwiMXdlZWtcIjogXCIxIHdlZWtcIixcbiAgICB9O1xuICAgIHJldHVybiBtYXBbb2Zmc2V0XSA/PyBcIlwiO1xuICB9XG5cbiAgcHJpdmF0ZSBmb3JtYXRUaW1lKHRpbWVTdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgW2gsIG1dID0gdGltZVN0ci5zcGxpdChcIjpcIikubWFwKE51bWJlcik7XG4gICAgcmV0dXJuIGAke2ggJSAxMiB8fCAxMn06JHtTdHJpbmcobSkucGFkU3RhcnQoMixcIjBcIil9ICR7aCA+PSAxMiA/IFwiUE1cIiA6IFwiQU1cIn1gO1xuICB9XG59IiwgImltcG9ydCB7IEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBFdmVudE1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9FdmVudE1hbmFnZXJcIjtcbmltcG9ydCB7IENhbGVuZGFyTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0NhbGVuZGFyTWFuYWdlclwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlRXZlbnQsIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjb25zdCBFVkVOVF9GT1JNX1ZJRVdfVFlQRSA9IFwiY2hyb25pY2xlLWV2ZW50LWZvcm1cIjtcblxuZXhwb3J0IGNsYXNzIEV2ZW50Rm9ybVZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIHByaXZhdGUgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXI7XG4gIHByaXZhdGUgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXI7XG4gIHByaXZhdGUgZWRpdGluZ0V2ZW50OiBDaHJvbmljbGVFdmVudCB8IG51bGwgPSBudWxsO1xuICBvblNhdmU/OiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICAgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXIsXG4gICAgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXIsXG4gICAgZWRpdGluZ0V2ZW50PzogQ2hyb25pY2xlRXZlbnQsXG4gICAgb25TYXZlPzogKCkgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLmV2ZW50TWFuYWdlciAgICA9IGV2ZW50TWFuYWdlcjtcbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IGNhbGVuZGFyTWFuYWdlcjtcbiAgICB0aGlzLmVkaXRpbmdFdmVudCAgICA9IGVkaXRpbmdFdmVudCA/PyBudWxsO1xuICAgIHRoaXMub25TYXZlICAgICAgICAgID0gb25TYXZlO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogICAgc3RyaW5nIHsgcmV0dXJuIEVWRU5UX0ZPUk1fVklFV19UWVBFOyB9XG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmVkaXRpbmdFdmVudCA/IFwiRWRpdCBldmVudFwiIDogXCJOZXcgZXZlbnRcIjsgfVxuICBnZXRJY29uKCk6ICAgICAgICBzdHJpbmcgeyByZXR1cm4gXCJjYWxlbmRhclwiOyB9XG5cbiAgYXN5bmMgb25PcGVuKCkgeyB0aGlzLnJlbmRlcigpOyB9XG5cbiAgbG9hZEV2ZW50KGV2ZW50OiBDaHJvbmljbGVFdmVudCkge1xuICAgIHRoaXMuZWRpdGluZ0V2ZW50ID0gZXZlbnQ7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuICAgIGNvbnRhaW5lci5hZGRDbGFzcyhcImNocm9uaWNsZS1mb3JtLXBhZ2VcIik7XG5cbiAgICBjb25zdCBlICAgICAgICAgPSB0aGlzLmVkaXRpbmdFdmVudDtcbiAgICBjb25zdCBjYWxlbmRhcnMgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRBbGwoKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIZWFkZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaGVhZGVyID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNmLWhlYWRlclwiKTtcbiAgICBjb25zdCBjYW5jZWxCdG4gPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWdob3N0XCIsIHRleHQ6IFwiQ2FuY2VsXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZURpdihcImNmLWhlYWRlci10aXRsZVwiKS5zZXRUZXh0KGUgPyBcIkVkaXQgZXZlbnRcIiA6IFwiTmV3IGV2ZW50XCIpO1xuICAgIGNvbnN0IHNhdmVCdG4gPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLXByaW1hcnlcIiwgdGV4dDogZSA/IFwiU2F2ZVwiIDogXCJBZGRcIiB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBGb3JtIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGZvcm0gPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2YtZm9ybVwiKTtcblxuICAgIC8vIFRpdGxlXG4gICAgY29uc3QgdGl0bGVJbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJUaXRsZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXQgY2YtdGl0bGUtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiRXZlbnQgbmFtZVwiXG4gICAgfSk7XG4gICAgdGl0bGVJbnB1dC52YWx1ZSA9IGU/LnRpdGxlID8/IFwiXCI7XG4gICAgdGl0bGVJbnB1dC5mb2N1cygpO1xuXG4gICAgLy8gTG9jYXRpb25cbiAgICBjb25zdCBsb2NhdGlvbklucHV0ID0gdGhpcy5maWVsZChmb3JtLCBcIkxvY2F0aW9uXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLCBwbGFjZWhvbGRlcjogXCJBZGQgbG9jYXRpb25cIlxuICAgIH0pO1xuICAgIGxvY2F0aW9uSW5wdXQudmFsdWUgPSBlPy5sb2NhdGlvbiA/PyBcIlwiO1xuXG4gICAgLy8gQWxsIGRheSB0b2dnbGVcbiAgICBjb25zdCBhbGxEYXlXcmFwICAgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQWxsIGRheVwiKS5jcmVhdGVEaXYoXCJjZW0tdG9nZ2xlLXdyYXBcIik7XG4gICAgY29uc3QgYWxsRGF5VG9nZ2xlID0gYWxsRGF5V3JhcC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiLCBjbHM6IFwiY2VtLXRvZ2dsZVwiIH0pO1xuICAgIGFsbERheVRvZ2dsZS5jaGVja2VkID0gZT8uYWxsRGF5ID8/IGZhbHNlO1xuICAgIGNvbnN0IGFsbERheUxhYmVsICA9IGFsbERheVdyYXAuY3JlYXRlU3Bhbih7IGNsczogXCJjZW0tdG9nZ2xlLWxhYmVsXCIgfSk7XG4gICAgYWxsRGF5TGFiZWwuc2V0VGV4dChhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwiWWVzXCIgOiBcIk5vXCIpO1xuICAgIGFsbERheVRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGFsbERheUxhYmVsLnNldFRleHQoYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIlllc1wiIDogXCJOb1wiKTtcbiAgICAgIHRpbWVGaWVsZHMuc3R5bGUuZGlzcGxheSA9IGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJub25lXCIgOiBcIlwiO1xuICAgIH0pO1xuXG4gICAgLy8gRGF0ZXNcbiAgICBjb25zdCBkYXRlUm93ICAgICAgPSBmb3JtLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcbiAgICBjb25zdCBzdGFydERhdGVJbnB1dCA9IHRoaXMuZmllbGQoZGF0ZVJvdywgXCJTdGFydCBkYXRlXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJkYXRlXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgc3RhcnREYXRlSW5wdXQudmFsdWUgPSBlPy5zdGFydERhdGUgPz8gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIGNvbnN0IGVuZERhdGVJbnB1dCA9IHRoaXMuZmllbGQoZGF0ZVJvdywgXCJFbmQgZGF0ZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGVuZERhdGVJbnB1dC52YWx1ZSA9IGU/LmVuZERhdGUgPz8gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIHN0YXJ0RGF0ZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgaWYgKCFlbmREYXRlSW5wdXQudmFsdWUgfHwgZW5kRGF0ZUlucHV0LnZhbHVlIDwgc3RhcnREYXRlSW5wdXQudmFsdWUpIHtcbiAgICAgICAgZW5kRGF0ZUlucHV0LnZhbHVlID0gc3RhcnREYXRlSW5wdXQudmFsdWU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBUaW1lIGZpZWxkcyAoaGlkZGVuIHdoZW4gYWxsLWRheSlcbiAgICBjb25zdCB0aW1lRmllbGRzID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG4gICAgdGltZUZpZWxkcy5zdHlsZS5kaXNwbGF5ID0gYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIm5vbmVcIiA6IFwiXCI7XG5cbiAgICBjb25zdCBzdGFydFRpbWVJbnB1dCA9IHRoaXMuZmllbGQodGltZUZpZWxkcywgXCJTdGFydCB0aW1lXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0aW1lXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgc3RhcnRUaW1lSW5wdXQudmFsdWUgPSBlPy5zdGFydFRpbWUgPz8gXCIwOTowMFwiO1xuXG4gICAgY29uc3QgZW5kVGltZUlucHV0ID0gdGhpcy5maWVsZCh0aW1lRmllbGRzLCBcIkVuZCB0aW1lXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0aW1lXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgZW5kVGltZUlucHV0LnZhbHVlID0gZT8uZW5kVGltZSA/PyBcIjEwOjAwXCI7XG5cbiAgICAvLyBSZXBlYXRcbiAgICBjb25zdCByZWNTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiUmVwZWF0XCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHJlY3VycmVuY2VzID0gW1xuICAgICAgeyB2YWx1ZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIk5ldmVyXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1EQUlMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSBkYXlcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IHdlZWtcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPU1PTlRITFlcIiwgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IG1vbnRoXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1ZRUFSTFlcIiwgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSB5ZWFyXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1XRUVLTFk7QllEQVk9TU8sVFUsV0UsVEgsRlJcIiwgIGxhYmVsOiBcIldlZWtkYXlzXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgciBvZiByZWN1cnJlbmNlcykge1xuICAgICAgY29uc3Qgb3B0ID0gcmVjU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHIudmFsdWUsIHRleHQ6IHIubGFiZWwgfSk7XG4gICAgICBpZiAoZT8ucmVjdXJyZW5jZSA9PT0gci52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBDYWxlbmRhclxuICAgIGNvbnN0IGNhbFNlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJDYWxlbmRhclwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogXCJcIiwgdGV4dDogXCJOb25lXCIgfSk7XG4gICAgZm9yIChjb25zdCBjYWwgb2YgY2FsZW5kYXJzKSB7XG4gICAgICBjb25zdCBvcHQgPSBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogY2FsLmlkLCB0ZXh0OiBjYWwubmFtZSB9KTtcbiAgICAgIGlmIChlPy5jYWxlbmRhcklkID09PSBjYWwuaWQpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuICAgIGNvbnN0IHVwZGF0ZUNhbENvbG9yID0gKCkgPT4ge1xuICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChjYWxTZWxlY3QudmFsdWUpO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRDb2xvciA9IGNhbCA/IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcikgOiBcInRyYW5zcGFyZW50XCI7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdFdpZHRoID0gXCI0cHhcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0U3R5bGUgPSBcInNvbGlkXCI7XG4gICAgfTtcbiAgICBjYWxTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB1cGRhdGVDYWxDb2xvcik7XG4gICAgdXBkYXRlQ2FsQ29sb3IoKTtcblxuICAgIC8vIEFsZXJ0XG4gICAgY29uc3QgYWxlcnRTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQWxlcnRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgYWxlcnRzOiB7IHZhbHVlOiBBbGVydE9mZnNldDsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcIm5vbmVcIiwgICAgbGFiZWw6IFwiTm9uZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImF0LXRpbWVcIiwgbGFiZWw6IFwiQXQgdGltZSBvZiBldmVudFwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjVtaW5cIiwgICAgbGFiZWw6IFwiNSBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjEwbWluXCIsICAgbGFiZWw6IFwiMTAgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxNW1pblwiLCAgIGxhYmVsOiBcIjE1IG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMzBtaW5cIiwgICBsYWJlbDogXCIzMCBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjFob3VyXCIsICAgbGFiZWw6IFwiMSBob3VyIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJob3Vyc1wiLCAgbGFiZWw6IFwiMiBob3VycyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxZGF5XCIsICAgIGxhYmVsOiBcIjEgZGF5IGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJkYXlzXCIsICAgbGFiZWw6IFwiMiBkYXlzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjF3ZWVrXCIsICAgbGFiZWw6IFwiMSB3ZWVrIGJlZm9yZVwiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IGEgb2YgYWxlcnRzKSB7XG4gICAgICBjb25zdCBvcHQgPSBhbGVydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBhLnZhbHVlLCB0ZXh0OiBhLmxhYmVsIH0pO1xuICAgICAgaWYgKGU/LmFsZXJ0ID09PSBhLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIE5vdGVzXG4gICAgY29uc3Qgbm90ZXNJbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJOb3Rlc1wiKS5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJjZi10ZXh0YXJlYVwiLCBwbGFjZWhvbGRlcjogXCJBZGQgbm90ZXMuLi5cIlxuICAgIH0pO1xuICAgIG5vdGVzSW5wdXQudmFsdWUgPSBlPy5ub3RlcyA/PyBcIlwiO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEFjdGlvbnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY2FuY2VsQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKEVWRU5UX0ZPUk1fVklFV19UWVBFKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0aXRsZSA9IHRpdGxlSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCF0aXRsZSkgeyB0aXRsZUlucHV0LmZvY3VzKCk7IHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpOyByZXR1cm47IH1cblxuICAgICAgY29uc3QgZXZlbnREYXRhID0ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgbG9jYXRpb246ICAgIGxvY2F0aW9uSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBhbGxEYXk6ICAgICAgYWxsRGF5VG9nZ2xlLmNoZWNrZWQsXG4gICAgICAgIHN0YXJ0RGF0ZTogICBzdGFydERhdGVJbnB1dC52YWx1ZSxcbiAgICAgICAgc3RhcnRUaW1lOiAgIGFsbERheVRvZ2dsZS5jaGVja2VkID8gdW5kZWZpbmVkIDogc3RhcnRUaW1lSW5wdXQudmFsdWUsXG4gICAgICAgIGVuZERhdGU6ICAgICBlbmREYXRlSW5wdXQudmFsdWUgfHwgc3RhcnREYXRlSW5wdXQudmFsdWUsXG4gICAgICAgIGVuZFRpbWU6ICAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IHVuZGVmaW5lZCA6IGVuZFRpbWVJbnB1dC52YWx1ZSxcbiAgICAgICAgcmVjdXJyZW5jZTogIHJlY1NlbGVjdC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGNhbGVuZGFySWQ6ICBjYWxTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBhbGVydDogICAgICAgYWxlcnRTZWxlY3QudmFsdWUgYXMgQWxlcnRPZmZzZXQsXG4gICAgICAgIG5vdGVzOiAgICAgICBub3Rlc0lucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgbGlua2VkVGFza0lkczogICAgICBlPy5saW5rZWRUYXNrSWRzID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6IGU/LmNvbXBsZXRlZEluc3RhbmNlcyA/PyBbXSxcbiAgICAgIH07XG5cbiAgICAgIGlmIChlPy5pZCkge1xuICAgICAgICBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci51cGRhdGUoeyAuLi5lLCAuLi5ldmVudERhdGEgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci5jcmVhdGUoZXZlbnREYXRhKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5vblNhdmU/LigpO1xuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhhbmRsZVNhdmUpO1xuICAgIHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGUpID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiKSBoYW5kbGVTYXZlKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGZpZWxkKHBhcmVudDogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3Qgd3JhcCA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZi1maWVsZFwiKTtcbiAgICB3cmFwLmNyZWF0ZURpdihcImNmLWxhYmVsXCIpLnNldFRleHQobGFiZWwpO1xuICAgIHJldHVybiB3cmFwO1xuICB9XG59IiwgImltcG9ydCB7IENocm9uaWNsZUNhbGVuZGFyLCBDYWxlbmRhckNvbG9yIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBDYWxlbmRhck1hbmFnZXIge1xuICBwcml2YXRlIGNhbGVuZGFyczogQ2hyb25pY2xlQ2FsZW5kYXJbXTtcbiAgcHJpdmF0ZSBvblVwZGF0ZTogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW10sIG9uVXBkYXRlOiAoKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5jYWxlbmRhcnMgPSBjYWxlbmRhcnM7XG4gICAgdGhpcy5vblVwZGF0ZSA9IG9uVXBkYXRlO1xuICB9XG5cbiAgZ2V0QWxsKCk6IENocm9uaWNsZUNhbGVuZGFyW10ge1xuICAgIHJldHVybiBbLi4udGhpcy5jYWxlbmRhcnNdO1xuICB9XG5cbiAgZ2V0QnlJZChpZDogc3RyaW5nKTogQ2hyb25pY2xlQ2FsZW5kYXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNhbGVuZGFycy5maW5kKChjKSA9PiBjLmlkID09PSBpZCk7XG4gIH1cblxuICBjcmVhdGUobmFtZTogc3RyaW5nLCBjb2xvcjogQ2FsZW5kYXJDb2xvcik6IENocm9uaWNsZUNhbGVuZGFyIHtcbiAgICBjb25zdCBjYWxlbmRhcjogQ2hyb25pY2xlQ2FsZW5kYXIgPSB7XG4gICAgICBpZDogdGhpcy5nZW5lcmF0ZUlkKG5hbWUpLFxuICAgICAgbmFtZSxcbiAgICAgIGNvbG9yLFxuICAgICAgaXNWaXNpYmxlOiB0cnVlLFxuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcbiAgICB0aGlzLmNhbGVuZGFycy5wdXNoKGNhbGVuZGFyKTtcbiAgICB0aGlzLm9uVXBkYXRlKCk7XG4gICAgcmV0dXJuIGNhbGVuZGFyO1xuICB9XG5cbiAgdXBkYXRlKGlkOiBzdHJpbmcsIGNoYW5nZXM6IFBhcnRpYWw8Q2hyb25pY2xlQ2FsZW5kYXI+KTogdm9pZCB7XG4gICAgY29uc3QgaWR4ID0gdGhpcy5jYWxlbmRhcnMuZmluZEluZGV4KChjKSA9PiBjLmlkID09PSBpZCk7XG4gICAgaWYgKGlkeCA9PT0gLTEpIHJldHVybjtcbiAgICB0aGlzLmNhbGVuZGFyc1tpZHhdID0geyAuLi50aGlzLmNhbGVuZGFyc1tpZHhdLCAuLi5jaGFuZ2VzIH07XG4gICAgdGhpcy5vblVwZGF0ZSgpO1xuICB9XG5cbiAgZGVsZXRlKGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmNhbGVuZGFycyA9IHRoaXMuY2FsZW5kYXJzLmZpbHRlcigoYykgPT4gYy5pZCAhPT0gaWQpO1xuICAgIHRoaXMub25VcGRhdGUoKTtcbiAgfVxuXG4gIHRvZ2dsZVZpc2liaWxpdHkoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGNhbCA9IHRoaXMuY2FsZW5kYXJzLmZpbmQoKGMpID0+IGMuaWQgPT09IGlkKTtcbiAgICBpZiAoY2FsKSB7XG4gICAgICBjYWwuaXNWaXNpYmxlID0gIWNhbC5pc1Zpc2libGU7XG4gICAgICB0aGlzLm9uVXBkYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJucyBDU1MgaGV4IGNvbG9yIGZvciBhIENhbGVuZGFyQ29sb3IgbmFtZVxuICBzdGF0aWMgY29sb3JUb0hleChjb2xvcjogQ2FsZW5kYXJDb2xvcik6IHN0cmluZyB7XG4gICAgY29uc3QgbWFwOiBSZWNvcmQ8Q2FsZW5kYXJDb2xvciwgc3RyaW5nPiA9IHtcbiAgICAgIGJsdWU6ICAgXCIjMzc4QUREXCIsXG4gICAgICBncmVlbjogIFwiIzM0Qzc1OVwiLFxuICAgICAgcHVycGxlOiBcIiNBRjUyREVcIixcbiAgICAgIG9yYW5nZTogXCIjRkY5NTAwXCIsXG4gICAgICByZWQ6ICAgIFwiI0ZGM0IzMFwiLFxuICAgICAgdGVhbDogICBcIiMzMEIwQzdcIixcbiAgICAgIHBpbms6ICAgXCIjRkYyRDU1XCIsXG4gICAgICB5ZWxsb3c6IFwiI0ZGRDYwQVwiLFxuICAgICAgZ3JheTogICBcIiM4RThFOTNcIixcbiAgICB9O1xuICAgIHJldHVybiBtYXBbY29sb3JdO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUlkKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYmFzZSA9IG5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csIFwiLVwiKS5yZXBsYWNlKC9bXmEtejAtOS1dL2csIFwiXCIpO1xuICAgIGNvbnN0IHN1ZmZpeCA9IERhdGUubm93KCkudG9TdHJpbmcoMzYpO1xuICAgIHJldHVybiBgJHtiYXNlfS0ke3N1ZmZpeH1gO1xuICB9XG59IiwgIi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDYWxlbmRhcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIENhbGVuZGFyQ29sb3IgPVxuICB8IFwiYmx1ZVwiIHwgXCJncmVlblwiIHwgXCJwdXJwbGVcIiB8IFwib3JhbmdlXCJcbiAgfCBcInJlZFwiIHwgXCJ0ZWFsXCIgfCBcInBpbmtcIiB8IFwieWVsbG93XCIgfCBcImdyYXlcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVDYWxlbmRhciB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgY29sb3I6IENhbGVuZGFyQ29sb3I7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBpc1Zpc2libGU6IGJvb2xlYW47XG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgVGFza3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIFRhc2tTdGF0dXMgPSBcInRvZG9cIiB8IFwiaW4tcHJvZ3Jlc3NcIiB8IFwiZG9uZVwiIHwgXCJjYW5jZWxsZWRcIjtcbmV4cG9ydCB0eXBlIFRhc2tQcmlvcml0eSA9IFwibm9uZVwiIHwgXCJsb3dcIiB8IFwibWVkaXVtXCIgfCBcImhpZ2hcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUaW1lRW50cnkge1xuICBzdGFydFRpbWU6IHN0cmluZzsgICAvLyBJU08gODYwMVxuICBlbmRUaW1lPzogc3RyaW5nOyAgICAvLyBJU08gODYwMVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEN1c3RvbUZpZWxkIHtcbiAga2V5OiBzdHJpbmc7XG4gIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENocm9uaWNsZVRhc2sge1xuICAvLyAtLS0gQ29yZSAtLS1cbiAgaWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgc3RhdHVzOiBUYXNrU3RhdHVzO1xuICBwcmlvcml0eTogVGFza1ByaW9yaXR5O1xuXG4gIC8vIC0tLSBTY2hlZHVsaW5nIC0tLVxuICBkdWVEYXRlPzogc3RyaW5nOyAgICAgICAvLyBZWVlZLU1NLUREXG4gIGR1ZVRpbWU/OiBzdHJpbmc7ICAgICAgIC8vIEhIOm1tXG4gIHJlY3VycmVuY2U/OiBzdHJpbmc7ICAgIC8vIFJSVUxFIHN0cmluZyBlLmcuIFwiRlJFUT1XRUVLTFk7QllEQVk9TU9cIlxuICBcblxuICAvLyAtLS0gT3JnYW5pc2F0aW9uIC0tLVxuICBjYWxlbmRhcklkPzogc3RyaW5nOyAgICAvLyBsaW5rcyB0byBhIENocm9uaWNsZUNhbGVuZGFyXG4gIHRhZ3M6IHN0cmluZ1tdO1xuICBjb250ZXh0czogc3RyaW5nW107ICAgICAvLyBlLmcuIFtcIkBob21lXCIsIFwiQHdvcmtcIl1cbiAgbGlua2VkTm90ZXM6IHN0cmluZ1tdOyAgLy8gd2lraWxpbmsgcGF0aHMgZS5nLiBbXCJQcm9qZWN0cy9XZWJzaXRlXCJdXG4gIHByb2plY3RzOiBzdHJpbmdbXTtcblxuICAvLyAtLS0gVGltZSB0cmFja2luZyAtLS1cbiAgdGltZUVzdGltYXRlPzogbnVtYmVyOyAgLy8gbWludXRlc1xuICB0aW1lRW50cmllczogVGltZUVudHJ5W107XG5cbiAgLy8gLS0tIEN1c3RvbSAtLS1cbiAgY3VzdG9tRmllbGRzOiBDdXN0b21GaWVsZFtdO1xuXG4gIC8vIC0tLSBSZWN1cnJlbmNlIGNvbXBsZXRpb24gLS0tXG4gIGNvbXBsZXRlZEluc3RhbmNlczogc3RyaW5nW107IC8vIFlZWVktTU0tREQgZGF0ZXNcblxuICAvLyAtLS0gTWV0YSAtLS1cbiAgY3JlYXRlZEF0OiBzdHJpbmc7ICAgICAgLy8gSVNPIDg2MDFcbiAgY29tcGxldGVkQXQ/OiBzdHJpbmc7ICAgLy8gSVNPIDg2MDFcbiAgbm90ZXM/OiBzdHJpbmc7ICAgICAgICAgLy8gYm9keSBjb250ZW50IG9mIHRoZSBub3RlXG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBFdmVudHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIEFsZXJ0T2Zmc2V0ID1cbiAgfCBcIm5vbmVcIlxuICB8IFwiYXQtdGltZVwiXG4gIHwgXCI1bWluXCIgfCBcIjEwbWluXCIgfCBcIjE1bWluXCIgfCBcIjMwbWluXCJcbiAgfCBcIjFob3VyXCIgfCBcIjJob3Vyc1wiXG4gIHwgXCIxZGF5XCIgfCBcIjJkYXlzXCIgfCBcIjF3ZWVrXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hyb25pY2xlRXZlbnQge1xuICAvLyAtLS0gQ29yZSAoaW4gZm9ybSBvcmRlcikgLS0tXG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGxvY2F0aW9uPzogc3RyaW5nO1xuICBhbGxEYXk6IGJvb2xlYW47XG4gIHN0YXJ0RGF0ZTogc3RyaW5nOyAgICAgIC8vIFlZWVktTU0tRERcbiAgc3RhcnRUaW1lPzogc3RyaW5nOyAgICAgLy8gSEg6bW0gICh1bmRlZmluZWQgd2hlbiBhbGxEYXkpXG4gIGVuZERhdGU6IHN0cmluZzsgICAgICAgIC8vIFlZWVktTU0tRERcbiAgZW5kVGltZT86IHN0cmluZzsgICAgICAgLy8gSEg6bW0gICh1bmRlZmluZWQgd2hlbiBhbGxEYXkpXG4gIHJlY3VycmVuY2U/OiBzdHJpbmc7ICAgIC8vIFJSVUxFIHN0cmluZ1xuICBjYWxlbmRhcklkPzogc3RyaW5nOyAgICAvLyBsaW5rcyB0byBhIENocm9uaWNsZUNhbGVuZGFyXG4gIGFsZXJ0OiBBbGVydE9mZnNldDtcbiAgbm90ZXM/OiBzdHJpbmc7ICAgICAgICAgLy8gYm9keSBjb250ZW50IG9mIHRoZSBub3RlXG5cbiAgLy8gLS0tIENvbm5lY3Rpb25zIC0tLVxuICBsaW5rZWRUYXNrSWRzOiBzdHJpbmdbXTsgICAvLyBDaHJvbmljbGUgdGFzayBJRHNcblxuICAvLyAtLS0gTWV0YSAtLS1cbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG4gIGNvbXBsZXRlZEluc3RhbmNlczogc3RyaW5nW107XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBQbHVnaW4gc2V0dGluZ3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hyb25pY2xlU2V0dGluZ3Mge1xuICAvLyBGb2xkZXIgcGF0aHNcbiAgdGFza3NGb2xkZXI6IHN0cmluZztcbiAgZXZlbnRzRm9sZGVyOiBzdHJpbmc7XG5cbiAgLy8gQ2FsZW5kYXJzIChzdG9yZWQgaW4gc2V0dGluZ3MsIG5vdCBhcyBmaWxlcylcbiAgY2FsZW5kYXJzOiBDaHJvbmljbGVDYWxlbmRhcltdO1xuICBkZWZhdWx0Q2FsZW5kYXJJZDogc3RyaW5nO1xuXG4gIC8vIERlZmF1bHRzXG4gIGRlZmF1bHRUYXNrU3RhdHVzOiBUYXNrU3RhdHVzO1xuICBkZWZhdWx0VGFza1ByaW9yaXR5OiBUYXNrUHJpb3JpdHk7XG4gIGRlZmF1bHRBbGVydDogQWxlcnRPZmZzZXQ7XG5cbiAgLy8gRGlzcGxheVxuICBzdGFydE9mV2VlazogMCB8IDEgfCA2OyAgLy8gMD1TdW4sIDE9TW9uLCA2PVNhdFxuICB0aW1lRm9ybWF0OiBcIjEyaFwiIHwgXCIyNGhcIjtcbiAgZGVmYXVsdENhbGVuZGFyVmlldzogXCJkYXlcIiB8IFwid2Vla1wiIHwgXCJtb250aFwiIHwgXCJ5ZWFyXCI7XG5cbiAgLy8gU21hcnQgbGlzdHMgdmlzaWJpbGl0eVxuICBzaG93VG9kYXlDb3VudDogYm9vbGVhbjtcbiAgc2hvd1NjaGVkdWxlZENvdW50OiBib29sZWFuO1xuICBzaG93RmxhZ2dlZENvdW50OiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogQ2hyb25pY2xlU2V0dGluZ3MgPSB7XG4gIHRhc2tzRm9sZGVyOiBcIkNocm9uaWNsZS9UYXNrc1wiLFxuICBldmVudHNGb2xkZXI6IFwiQ2hyb25pY2xlL0V2ZW50c1wiLFxuICBjYWxlbmRhcnM6IFtcbiAgICB7IGlkOiBcInBlcnNvbmFsXCIsIG5hbWU6IFwiUGVyc29uYWxcIiwgY29sb3I6IFwiYmx1ZVwiLCAgIGlzVmlzaWJsZTogdHJ1ZSwgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSxcbiAgICB7IGlkOiBcIndvcmtcIiwgICAgIG5hbWU6IFwiV29ya1wiLCAgICAgY29sb3I6IFwiZ3JlZW5cIiwgIGlzVmlzaWJsZTogdHJ1ZSwgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSxcbiAgXSxcbiAgZGVmYXVsdENhbGVuZGFySWQ6IFwicGVyc29uYWxcIixcbiAgZGVmYXVsdFRhc2tTdGF0dXM6IFwidG9kb1wiLFxuICBkZWZhdWx0VGFza1ByaW9yaXR5OiBcIm5vbmVcIixcbiAgZGVmYXVsdEFsZXJ0OiBcIm5vbmVcIixcbiAgc3RhcnRPZldlZWs6IDAsXG4gIHRpbWVGb3JtYXQ6IFwiMTJoXCIsXG4gIGRlZmF1bHRDYWxlbmRhclZpZXc6IFwid2Vla1wiLFxuICBzaG93VG9kYXlDb3VudDogdHJ1ZSxcbiAgc2hvd1NjaGVkdWxlZENvdW50OiB0cnVlLFxuICBzaG93RmxhZ2dlZENvdW50OiB0cnVlLFxufTsiLCAiaW1wb3J0IHsgQ2hyb25pY2xlVGFzaywgVGFza1N0YXR1cywgVGFza1ByaW9yaXR5LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgQXBwLCBURmlsZSwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlVGFzaywgVGFza1N0YXR1cywgVGFza1ByaW9yaXR5IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBUYXNrTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwOiBBcHAsIHByaXZhdGUgdGFza3NGb2xkZXI6IHN0cmluZykge31cblxuICAvLyBcdTI1MDBcdTI1MDAgUmVhZCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBnZXRBbGwoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCBmb2xkZXIgPSB0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy50YXNrc0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBbXTtcblxuICAgIGNvbnN0IHRhc2tzOiBDaHJvbmljbGVUYXNrW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbiAgICAgICAgY29uc3QgdGFzayA9IGF3YWl0IHRoaXMuZmlsZVRvVGFzayhjaGlsZCk7XG4gICAgICAgIGlmICh0YXNrKSB0YXNrcy5wdXNoKHRhc2spO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFza3M7XG4gIH1cblxuICBhc3luYyBnZXRCeUlkKGlkOiBzdHJpbmcpOiBQcm9taXNlPENocm9uaWNsZVRhc2sgfCBudWxsPiB7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbmQoKHQpID0+IHQuaWQgPT09IGlkKSA/PyBudWxsO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFdyaXRlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIGFzeW5jIGNyZWF0ZSh0YXNrOiBPbWl0PENocm9uaWNsZVRhc2ssIFwiaWRcIiB8IFwiY3JlYXRlZEF0XCI+KTogUHJvbWlzZTxDaHJvbmljbGVUYXNrPiB7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoKTtcblxuICAgIGNvbnN0IGZ1bGw6IENocm9uaWNsZVRhc2sgPSB7XG4gICAgICAuLi50YXNrLFxuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZCgpLFxuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIGNvbnN0IHBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMudGFza3NGb2xkZXJ9LyR7ZnVsbC50aXRsZX0ubWRgKTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgdGhpcy50YXNrVG9NYXJrZG93bihmdWxsKSk7XG4gICAgcmV0dXJuIGZ1bGw7XG4gIH1cblxuICBhc3luYyB1cGRhdGUodGFzazogQ2hyb25pY2xlVGFzayk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbmRGaWxlRm9yVGFzayh0YXNrLmlkKTtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcblxuICAgIC8vIElmIHRpdGxlIGNoYW5nZWQsIHJlbmFtZSB0aGUgZmlsZVxuICAgIGNvbnN0IGV4cGVjdGVkUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy50YXNrc0ZvbGRlcn0vJHt0YXNrLnRpdGxlfS5tZGApO1xuICAgIGlmIChmaWxlLnBhdGggIT09IGV4cGVjdGVkUGF0aCkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAuZmlsZU1hbmFnZXIucmVuYW1lRmlsZShmaWxlLCBleHBlY3RlZFBhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZUJ5UGF0aChleHBlY3RlZFBhdGgpID8/IGZpbGU7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KHVwZGF0ZWRGaWxlLCB0aGlzLnRhc2tUb01hcmtkb3duKHRhc2spKTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZShpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JUYXNrKGlkKTtcbiAgICBpZiAoZmlsZSkgYXdhaXQgdGhpcy5hcHAudmF1bHQuZGVsZXRlKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgbWFya0NvbXBsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0YXNrID0gYXdhaXQgdGhpcy5nZXRCeUlkKGlkKTtcbiAgICBpZiAoIXRhc2spIHJldHVybjtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7XG4gICAgICAuLi50YXNrLFxuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIGNvbXBsZXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfSk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRmlsdGVycyAodXNlZCBieSBzbWFydCBsaXN0cykgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgZ2V0RHVlVG9kYXkoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCB0b2RheSA9IHRoaXMudG9kYXlTdHIoKTtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKFxuICAgICAgKHQpID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIiAmJiB0LnN0YXR1cyAhPT0gXCJjYW5jZWxsZWRcIiAmJiB0LmR1ZURhdGUgPT09IHRvZGF5XG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldE92ZXJkdWUoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCB0b2RheSA9IHRoaXMudG9kYXlTdHIoKTtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKFxuICAgICAgKHQpID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIiAmJiB0LnN0YXR1cyAhPT0gXCJjYW5jZWxsZWRcIiAmJiAhIXQuZHVlRGF0ZSAmJiB0LmR1ZURhdGUgPCB0b2RheVxuICAgICk7XG4gIH1cblxuICBhc3luYyBnZXRTY2hlZHVsZWQoKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKFxuICAgICAgKHQpID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIiAmJiB0LnN0YXR1cyAhPT0gXCJjYW5jZWxsZWRcIiAmJiAhIXQuZHVlRGF0ZVxuICAgICk7XG4gIH1cblxuICBhc3luYyBnZXRGbGFnZ2VkKCk6IFByb21pc2U8Q2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcigodCkgPT4gdC5wcmlvcml0eSA9PT0gXCJoaWdoXCIgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTZXJpYWxpc2F0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgdGFza1RvTWFya2Rvd24odGFzazogQ2hyb25pY2xlVGFzayk6IHN0cmluZyB7XG4gICAgY29uc3QgZm06IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgICAgaWQ6ICAgICAgICAgICAgICAgICB0YXNrLmlkLFxuICAgICAgdGl0bGU6ICAgICAgICAgICAgICB0YXNrLnRpdGxlLFxuICAgICAgc3RhdHVzOiAgICAgICAgICAgICB0YXNrLnN0YXR1cyxcbiAgICAgIHByaW9yaXR5OiAgICAgICAgICAgdGFzay5wcmlvcml0eSxcbiAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgdGFzay50YWdzLFxuICAgICAgY29udGV4dHM6ICAgICAgICAgICB0YXNrLmNvbnRleHRzLFxuICAgICAgcHJvamVjdHM6ICAgICAgICAgICB0YXNrLnByb2plY3RzLFxuICAgICAgXCJsaW5rZWQtbm90ZXNcIjogICAgIHRhc2subGlua2VkTm90ZXMsXG4gICAgICBcImNhbGVuZGFyLWlkXCI6ICAgICAgdGFzay5jYWxlbmRhcklkID8/IG51bGwsXG4gICAgICBcImR1ZS1kYXRlXCI6ICAgICAgICAgdGFzay5kdWVEYXRlID8/IG51bGwsXG4gICAgICBcImR1ZS10aW1lXCI6ICAgICAgICAgdGFzay5kdWVUaW1lID8/IG51bGwsXG4gICAgICByZWN1cnJlbmNlOiAgICAgICAgIHRhc2sucmVjdXJyZW5jZSA/PyBudWxsLFxuICAgICAgXCJhbGVydFwiOiAgICAgICAgICAgIHRhc2suYWxlcnQgPz8gXCJub25lXCIsXG4gICAgICBcInRpbWUtZXN0aW1hdGVcIjogICAgdGFzay50aW1lRXN0aW1hdGUgPz8gbnVsbCxcbiAgICAgIFwidGltZS1lbnRyaWVzXCI6ICAgICB0YXNrLnRpbWVFbnRyaWVzLFxuICAgICAgXCJjdXN0b20tZmllbGRzXCI6ICAgIHRhc2suY3VzdG9tRmllbGRzLFxuICAgICAgXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCI6IHRhc2suY29tcGxldGVkSW5zdGFuY2VzLFxuICAgICAgXCJjcmVhdGVkLWF0XCI6ICAgICAgIHRhc2suY3JlYXRlZEF0LFxuICAgICAgXCJjb21wbGV0ZWQtYXRcIjogICAgIHRhc2suY29tcGxldGVkQXQgPz8gbnVsbCxcbiAgICB9O1xuXG4gICAgY29uc3QgeWFtbCA9IE9iamVjdC5lbnRyaWVzKGZtKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHtKU09OLnN0cmluZ2lmeSh2KX1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCBib2R5ID0gdGFzay5ub3RlcyA/IGBcXG4ke3Rhc2subm90ZXN9YCA6IFwiXCI7XG4gICAgcmV0dXJuIGAtLS1cXG4ke3lhbWx9XFxuLS0tXFxuJHtib2R5fWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGZpbGVUb1Rhc2soZmlsZTogVEZpbGUpOiBQcm9taXNlPENocm9uaWNsZVRhc2sgfCBudWxsPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XG4gICAgICBjb25zdCBmbSA9IGNhY2hlPy5mcm9udG1hdHRlcjtcbiAgICAgIGlmICghZm0/LmlkIHx8ICFmbT8udGl0bGUpIHJldHVybiBudWxsO1xuXG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICAgIGNvbnN0IGJvZHlNYXRjaCA9IGNvbnRlbnQubWF0Y2goL14tLS1cXG5bXFxzXFxTXSo/XFxuLS0tXFxuKFtcXHNcXFNdKikkLyk7XG4gICAgICBjb25zdCBub3RlcyA9IGJvZHlNYXRjaD8uWzFdPy50cmltKCkgfHwgdW5kZWZpbmVkO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZDogICAgICAgICAgICAgICAgIGZtLmlkLFxuICAgICAgICB0aXRsZTogICAgICAgICAgICAgIGZtLnRpdGxlLFxuICAgICAgICBzdGF0dXM6ICAgICAgICAgICAgIChmbS5zdGF0dXMgYXMgVGFza1N0YXR1cykgPz8gXCJ0b2RvXCIsXG4gICAgICAgIHByaW9yaXR5OiAgICAgICAgICAgKGZtLnByaW9yaXR5IGFzIFRhc2tQcmlvcml0eSkgPz8gXCJub25lXCIsXG4gICAgICAgIGR1ZURhdGU6ICAgICAgICAgICAgZm1bXCJkdWUtZGF0ZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGR1ZVRpbWU6ICAgICAgICAgICAgZm1bXCJkdWUtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgZm0ucmVjdXJyZW5jZSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGFsZXJ0OiAgICAgICAgICAgICAgKGZtLmFsZXJ0IGFzIEFsZXJ0T2Zmc2V0KSA/PyBcIm5vbmVcIixcbiAgICAgICAgY2FsZW5kYXJJZDogICAgICAgICBmbVtcImNhbGVuZGFyLWlkXCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgdGFnczogICAgICAgICAgICAgICBmbS50YWdzID8/IFtdLFxuICAgICAgICBjb250ZXh0czogICAgICAgICAgIGZtLmNvbnRleHRzID8/IFtdLFxuICAgICAgICBsaW5rZWROb3RlczogICAgICAgIGZtW1wibGlua2VkLW5vdGVzXCJdID8/IFtdLFxuICAgICAgICBwcm9qZWN0czogICAgICAgICAgIGZtLnByb2plY3RzID8/IFtdLFxuICAgICAgICB0aW1lRXN0aW1hdGU6ICAgICAgIGZtW1widGltZS1lc3RpbWF0ZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHRpbWVFbnRyaWVzOiAgICAgICAgZm1bXCJ0aW1lLWVudHJpZXNcIl0gPz8gW10sXG4gICAgICAgIGN1c3RvbUZpZWxkczogICAgICAgZm1bXCJjdXN0b20tZmllbGRzXCJdID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6IGZtW1wiY29tcGxldGVkLWluc3RhbmNlc1wiXSA/PyBbXSxcbiAgICAgICAgY3JlYXRlZEF0OiAgICAgICAgICBmbVtcImNyZWF0ZWQtYXRcIl0gPz8gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBjb21wbGV0ZWRBdDogICAgICAgIGZtW1wiY29tcGxldGVkLWF0XCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgbm90ZXMsXG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEhlbHBlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSBmaW5kRmlsZUZvclRhc2soaWQ6IHN0cmluZyk6IFRGaWxlIHwgbnVsbCB7XG4gICAgY29uc3QgZm9sZGVyID0gdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMudGFza3NGb2xkZXIpO1xuICAgIGlmICghZm9sZGVyKSByZXR1cm4gbnVsbDtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuICAgICAgaWYgKCEoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSkpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShjaGlsZCk7XG4gICAgICBpZiAoY2FjaGU/LmZyb250bWF0dGVyPy5pZCA9PT0gaWQpIHJldHVybiBjaGlsZDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGVuc3VyZUZvbGRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLnRhc2tzRm9sZGVyKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKHRoaXMudGFza3NGb2xkZXIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgdGFzay0ke0RhdGUubm93KCkudG9TdHJpbmcoMzYpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDYpfWA7XG4gIH1cblxuICBwcml2YXRlIHRvZGF5U3RyKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBURmlsZSwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlRXZlbnQsIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudE1hbmFnZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwLCBwcml2YXRlIGV2ZW50c0ZvbGRlcjogc3RyaW5nKSB7fVxuXG4gIGFzeW5jIGdldEFsbCgpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50W10+IHtcbiAgICBjb25zdCBmb2xkZXIgPSB0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy5ldmVudHNGb2xkZXIpO1xuICAgIGlmICghZm9sZGVyKSByZXR1cm4gW107XG5cbiAgICBjb25zdCBldmVudHM6IENocm9uaWNsZUV2ZW50W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbiAgICAgICAgY29uc3QgZXZlbnQgPSBhd2FpdCB0aGlzLmZpbGVUb0V2ZW50KGNoaWxkKTtcbiAgICAgICAgaWYgKGV2ZW50KSBldmVudHMucHVzaChldmVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBldmVudHM7XG4gIH1cblxuICBhc3luYyBjcmVhdGUoZXZlbnQ6IE9taXQ8Q2hyb25pY2xlRXZlbnQsIFwiaWRcIiB8IFwiY3JlYXRlZEF0XCI+KTogUHJvbWlzZTxDaHJvbmljbGVFdmVudD4ge1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKCk7XG5cbiAgICBjb25zdCBmdWxsOiBDaHJvbmljbGVFdmVudCA9IHtcbiAgICAgIC4uLmV2ZW50LFxuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZCgpLFxuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIGNvbnN0IHBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMuZXZlbnRzRm9sZGVyfS8ke2Z1bGwudGl0bGV9Lm1kYCk7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIHRoaXMuZXZlbnRUb01hcmtkb3duKGZ1bGwpKTtcbiAgICByZXR1cm4gZnVsbDtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZShldmVudDogQ2hyb25pY2xlRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvckV2ZW50KGV2ZW50LmlkKTtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcblxuICAgIGNvbnN0IGV4cGVjdGVkUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy5ldmVudHNGb2xkZXJ9LyR7ZXZlbnQudGl0bGV9Lm1kYCk7XG4gICAgaWYgKGZpbGUucGF0aCAhPT0gZXhwZWN0ZWRQYXRoKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIGV4cGVjdGVkUGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKGV4cGVjdGVkUGF0aCkgPz8gZmlsZTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkodXBkYXRlZEZpbGUsIHRoaXMuZXZlbnRUb01hcmtkb3duKGV2ZW50KSk7XG4gIH1cblxuICBhc3luYyBkZWxldGUoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbmRGaWxlRm9yRXZlbnQoaWQpO1xuICAgIGlmIChmaWxlKSBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBnZXRJblJhbmdlKHN0YXJ0RGF0ZTogc3RyaW5nLCBlbmREYXRlOiBzdHJpbmcpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50W10+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKChlKSA9PiBlLnN0YXJ0RGF0ZSA+PSBzdGFydERhdGUgJiYgZS5zdGFydERhdGUgPD0gZW5kRGF0ZSk7XG4gIH1cblxuLy8gRXhwYW5kcyByZWN1cnJpbmcgZXZlbnRzIGludG8gb2NjdXJyZW5jZXMgd2l0aGluIGEgZGF0ZSByYW5nZS5cbiAgLy8gUmV0dXJucyBhIGZsYXQgbGlzdCBvZiBDaHJvbmljbGVFdmVudCBvYmplY3RzLCBvbmUgcGVyIG9jY3VycmVuY2UsXG4gIC8vIGVhY2ggd2l0aCBzdGFydERhdGUvZW5kRGF0ZSBzZXQgdG8gdGhlIG9jY3VycmVuY2UgZGF0ZS5cbiAgYXN5bmMgZ2V0SW5SYW5nZVdpdGhSZWN1cnJlbmNlKHJhbmdlU3RhcnQ6IHN0cmluZywgcmFuZ2VFbmQ6IHN0cmluZyk6IFByb21pc2U8Q2hyb25pY2xlRXZlbnRbXT4ge1xuICAgIGNvbnN0IGFsbCAgICA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgY29uc3QgcmVzdWx0OiBDaHJvbmljbGVFdmVudFtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIGFsbCkge1xuICAgICAgaWYgKCFldmVudC5yZWN1cnJlbmNlKSB7XG4gICAgICAgIC8vIE5vbi1yZWN1cnJpbmcgXHUyMDE0IGluY2x1ZGUgaWYgaXQgZmFsbHMgaW4gcmFuZ2VcbiAgICAgICAgaWYgKGV2ZW50LnN0YXJ0RGF0ZSA+PSByYW5nZVN0YXJ0ICYmIGV2ZW50LnN0YXJ0RGF0ZSA8PSByYW5nZUVuZCkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gRXhwYW5kIHJlY3VycmVuY2Ugd2l0aGluIHJhbmdlXG4gICAgICBjb25zdCBvY2N1cnJlbmNlcyA9IHRoaXMuZXhwYW5kUmVjdXJyZW5jZShldmVudCwgcmFuZ2VTdGFydCwgcmFuZ2VFbmQpO1xuICAgICAgcmVzdWx0LnB1c2goLi4ub2NjdXJyZW5jZXMpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGV4cGFuZFJlY3VycmVuY2UoZXZlbnQ6IENocm9uaWNsZUV2ZW50LCByYW5nZVN0YXJ0OiBzdHJpbmcsIHJhbmdlRW5kOiBzdHJpbmcpOiBDaHJvbmljbGVFdmVudFtdIHtcbiAgICBjb25zdCByZXN1bHRzOiBDaHJvbmljbGVFdmVudFtdID0gW107XG4gICAgY29uc3QgcnVsZSA9IGV2ZW50LnJlY3VycmVuY2UgPz8gXCJcIjtcblxuICAgIC8vIFBhcnNlIFJSVUxFIHBhcnRzXG4gICAgY29uc3QgZnJlcSAgICA9IHRoaXMucnJ1bGVQYXJ0KHJ1bGUsIFwiRlJFUVwiKTtcbiAgICBjb25zdCBieURheSAgID0gdGhpcy5ycnVsZVBhcnQocnVsZSwgXCJCWURBWVwiKTtcbiAgICBjb25zdCB1bnRpbCAgID0gdGhpcy5ycnVsZVBhcnQocnVsZSwgXCJVTlRJTFwiKTtcbiAgICBjb25zdCBjb3VudFN0ciA9IHRoaXMucnJ1bGVQYXJ0KHJ1bGUsIFwiQ09VTlRcIik7XG4gICAgY29uc3QgY291bnQgICA9IGNvdW50U3RyID8gcGFyc2VJbnQoY291bnRTdHIpIDogOTk5O1xuXG4gICAgY29uc3Qgc3RhcnQgICA9IG5ldyBEYXRlKGV2ZW50LnN0YXJ0RGF0ZSArIFwiVDAwOjAwOjAwXCIpO1xuICAgIGNvbnN0IHJFbmQgICAgPSBuZXcgRGF0ZShyYW5nZUVuZCArIFwiVDAwOjAwOjAwXCIpO1xuICAgIGNvbnN0IHJTdGFydCAgPSBuZXcgRGF0ZShyYW5nZVN0YXJ0ICsgXCJUMDA6MDA6MDBcIik7XG4gICAgY29uc3QgdW50aWxEYXRlID0gdW50aWwgPyBuZXcgRGF0ZSh1bnRpbC5zbGljZSgwLDgpLnJlcGxhY2UoLyhcXGR7NH0pKFxcZHsyfSkoXFxkezJ9KS8sXCIkMS0kMi0kM1wiKSArIFwiVDAwOjAwOjAwXCIpIDogbnVsbDtcblxuICAgIGNvbnN0IGRheU5hbWVzID0gW1wiU1VcIixcIk1PXCIsXCJUVVwiLFwiV0VcIixcIlRIXCIsXCJGUlwiLFwiU0FcIl07XG4gICAgY29uc3QgYnlEYXlzICAgPSBieURheSA/IGJ5RGF5LnNwbGl0KFwiLFwiKSA6IFtdO1xuXG4gICAgbGV0IGN1cnJlbnQgICA9IG5ldyBEYXRlKHN0YXJ0KTtcbiAgICBsZXQgZ2VuZXJhdGVkID0gMDtcblxuICAgIHdoaWxlIChjdXJyZW50IDw9IHJFbmQgJiYgZ2VuZXJhdGVkIDwgY291bnQpIHtcbiAgICAgIGlmICh1bnRpbERhdGUgJiYgY3VycmVudCA+IHVudGlsRGF0ZSkgYnJlYWs7XG5cbiAgICAgIGNvbnN0IGRhdGVTdHIgPSBjdXJyZW50LnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgICAvLyBDYWxjdWxhdGUgZHVyYXRpb24gdG8gYXBwbHkgdG8gZWFjaCBvY2N1cnJlbmNlXG4gICAgICBjb25zdCBkdXJhdGlvbk1zID0gbmV3IERhdGUoZXZlbnQuZW5kRGF0ZSArIFwiVDAwOjAwOjAwXCIpLmdldFRpbWUoKSAtIHN0YXJ0LmdldFRpbWUoKTtcbiAgICAgIGNvbnN0IGVuZERhdGUgICAgPSBuZXcgRGF0ZShjdXJyZW50LmdldFRpbWUoKSArIGR1cmF0aW9uTXMpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgICBpZiAoY3VycmVudCA+PSByU3RhcnQgJiYgIWV2ZW50LmNvbXBsZXRlZEluc3RhbmNlcy5pbmNsdWRlcyhkYXRlU3RyKSkge1xuICAgICAgICByZXN1bHRzLnB1c2goeyAuLi5ldmVudCwgc3RhcnREYXRlOiBkYXRlU3RyLCBlbmREYXRlIH0pO1xuICAgICAgICBnZW5lcmF0ZWQrKztcbiAgICAgIH1cblxuICAgICAgLy8gQWR2YW5jZSB0byBuZXh0IG9jY3VycmVuY2VcbiAgICAgIGlmIChmcmVxID09PSBcIkRBSUxZXCIpIHtcbiAgICAgICAgY3VycmVudC5zZXREYXRlKGN1cnJlbnQuZ2V0RGF0ZSgpICsgMSk7XG4gICAgICB9IGVsc2UgaWYgKGZyZXEgPT09IFwiV0VFS0xZXCIpIHtcbiAgICAgICAgaWYgKGJ5RGF5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gRmluZCBuZXh0IG1hdGNoaW5nIHdlZWtkYXlcbiAgICAgICAgICBjdXJyZW50LnNldERhdGUoY3VycmVudC5nZXREYXRlKCkgKyAxKTtcbiAgICAgICAgICBsZXQgc2FmZXR5ID0gMDtcbiAgICAgICAgICB3aGlsZSAoIWJ5RGF5cy5pbmNsdWRlcyhkYXlOYW1lc1tjdXJyZW50LmdldERheSgpXSkgJiYgc2FmZXR5KysgPCA3KSB7XG4gICAgICAgICAgICBjdXJyZW50LnNldERhdGUoY3VycmVudC5nZXREYXRlKCkgKyAxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudC5zZXREYXRlKGN1cnJlbnQuZ2V0RGF0ZSgpICsgNyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZnJlcSA9PT0gXCJNT05USExZXCIpIHtcbiAgICAgICAgY3VycmVudC5zZXRNb250aChjdXJyZW50LmdldE1vbnRoKCkgKyAxKTtcbiAgICAgIH0gZWxzZSBpZiAoZnJlcSA9PT0gXCJZRUFSTFlcIikge1xuICAgICAgICBjdXJyZW50LnNldEZ1bGxZZWFyKGN1cnJlbnQuZ2V0RnVsbFllYXIoKSArIDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7IC8vIFVua25vd24gZnJlcSBcdTIwMTQgc3RvcCB0byBhdm9pZCBpbmZpbml0ZSBsb29wXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICBwcml2YXRlIHJydWxlUGFydChydWxlOiBzdHJpbmcsIGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXRjaCA9IHJ1bGUubWF0Y2gobmV3IFJlZ0V4cChgKD86Xnw7KSR7a2V5fT0oW147XSspYCkpO1xuICAgIHJldHVybiBtYXRjaCA/IG1hdGNoWzFdIDogXCJcIjtcbiAgfVxuXG4gIHByaXZhdGUgZXZlbnRUb01hcmtkb3duKGV2ZW50OiBDaHJvbmljbGVFdmVudCk6IHN0cmluZyB7XG4gICAgY29uc3QgZm06IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgICAgaWQ6ICAgICAgICAgICAgICAgICAgIGV2ZW50LmlkLFxuICAgICAgdGl0bGU6ICAgICAgICAgICAgICAgIGV2ZW50LnRpdGxlLFxuICAgICAgbG9jYXRpb246ICAgICAgICAgICAgIGV2ZW50LmxvY2F0aW9uID8/IG51bGwsXG4gICAgICBcImFsbC1kYXlcIjogICAgICAgICAgICBldmVudC5hbGxEYXksXG4gICAgICBcInN0YXJ0LWRhdGVcIjogICAgICAgICBldmVudC5zdGFydERhdGUsXG4gICAgICBcInN0YXJ0LXRpbWVcIjogICAgICAgICBldmVudC5zdGFydFRpbWUgPz8gbnVsbCxcbiAgICAgIFwiZW5kLWRhdGVcIjogICAgICAgICAgIGV2ZW50LmVuZERhdGUsXG4gICAgICBcImVuZC10aW1lXCI6ICAgICAgICAgICBldmVudC5lbmRUaW1lID8/IG51bGwsXG4gICAgICByZWN1cnJlbmNlOiAgICAgICAgICAgZXZlbnQucmVjdXJyZW5jZSA/PyBudWxsLFxuICAgICAgXCJjYWxlbmRhci1pZFwiOiAgICAgICAgZXZlbnQuY2FsZW5kYXJJZCA/PyBudWxsLFxuICAgICAgYWxlcnQ6ICAgICAgICAgICAgICAgIGV2ZW50LmFsZXJ0LFxuICAgICAgXCJsaW5rZWQtdGFzay1pZHNcIjogICAgZXZlbnQubGlua2VkVGFza0lkcyxcbiAgICAgIFwiY29tcGxldGVkLWluc3RhbmNlc1wiOiBldmVudC5jb21wbGV0ZWRJbnN0YW5jZXMsXG4gICAgICBcImNyZWF0ZWQtYXRcIjogICAgICAgICBldmVudC5jcmVhdGVkQXQsXG4gICAgfTtcblxuICAgIGNvbnN0IHlhbWwgPSBPYmplY3QuZW50cmllcyhmbSlcbiAgICAgIC5tYXAoKFtrLCB2XSkgPT4gYCR7a306ICR7SlNPTi5zdHJpbmdpZnkodil9YClcbiAgICAgIC5qb2luKFwiXFxuXCIpO1xuXG4gICAgY29uc3QgYm9keSA9IGV2ZW50Lm5vdGVzID8gYFxcbiR7ZXZlbnQubm90ZXN9YCA6IFwiXCI7XG4gICAgcmV0dXJuIGAtLS1cXG4ke3lhbWx9XFxuLS0tXFxuJHtib2R5fWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGZpbGVUb0V2ZW50KGZpbGU6IFRGaWxlKTogUHJvbWlzZTxDaHJvbmljbGVFdmVudCB8IG51bGw+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICAgIGNvbnN0IGZtID0gY2FjaGU/LmZyb250bWF0dGVyO1xuICAgICAgaWYgKCFmbT8uaWQgfHwgIWZtPy50aXRsZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgICAgY29uc3QgYm9keU1hdGNoID0gY29udGVudC5tYXRjaCgvXi0tLVxcbltcXHNcXFNdKj9cXG4tLS1cXG4oW1xcc1xcU10qKSQvKTtcbiAgICAgIGNvbnN0IG5vdGVzID0gYm9keU1hdGNoPy5bMV0/LnRyaW0oKSB8fCB1bmRlZmluZWQ7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkOiAgICAgICAgICAgICAgICAgICBmbS5pZCxcbiAgICAgICAgdGl0bGU6ICAgICAgICAgICAgICAgIGZtLnRpdGxlLFxuICAgICAgICBsb2NhdGlvbjogICAgICAgICAgICAgZm0ubG9jYXRpb24gPz8gdW5kZWZpbmVkLFxuICAgICAgICBhbGxEYXk6ICAgICAgICAgICAgICAgZm1bXCJhbGwtZGF5XCJdID8/IHRydWUsXG4gICAgICAgIHN0YXJ0RGF0ZTogICAgICAgICAgICBmbVtcInN0YXJ0LWRhdGVcIl0sXG4gICAgICAgIHN0YXJ0VGltZTogICAgICAgICAgICBmbVtcInN0YXJ0LXRpbWVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBlbmREYXRlOiAgICAgICAgICAgICAgZm1bXCJlbmQtZGF0ZVwiXSxcbiAgICAgICAgZW5kVGltZTogICAgICAgICAgICAgIGZtW1wiZW5kLXRpbWVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICByZWN1cnJlbmNlOiAgICAgICAgICAgZm0ucmVjdXJyZW5jZSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGNhbGVuZGFySWQ6ICAgICAgICAgICBmbVtcImNhbGVuZGFyLWlkXCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgICAgICAgICAgIChmbS5hbGVydCBhcyBBbGVydE9mZnNldCkgPz8gXCJub25lXCIsXG4gICAgICAgIGxpbmtlZFRhc2tJZHM6ICAgICAgICBmbVtcImxpbmtlZC10YXNrLWlkc1wiXSA/PyBbXSxcbiAgICAgICAgY29tcGxldGVkSW5zdGFuY2VzOiAgIGZtW1wiY29tcGxldGVkLWluc3RhbmNlc1wiXSA/PyBbXSxcbiAgICAgICAgY3JlYXRlZEF0OiAgICAgICAgICAgIGZtW1wiY3JlYXRlZC1hdFwiXSA/PyBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIG5vdGVzLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmluZEZpbGVGb3JFdmVudChpZDogc3RyaW5nKTogVEZpbGUgfCBudWxsIHtcbiAgICBjb25zdCBmb2xkZXIgPSB0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy5ldmVudHNGb2xkZXIpO1xuICAgIGlmICghZm9sZGVyKSByZXR1cm4gbnVsbDtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuICAgICAgaWYgKCEoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSkpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShjaGlsZCk7XG4gICAgICBpZiAoY2FjaGU/LmZyb250bWF0dGVyPy5pZCA9PT0gaWQpIHJldHVybiBjaGlsZDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGVuc3VyZUZvbGRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLmV2ZW50c0ZvbGRlcikpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcih0aGlzLmV2ZW50c0ZvbGRlcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBldmVudC0ke0RhdGUubm93KCkudG9TdHJpbmcoMzYpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDYpfWA7XG4gIH1cbn0iLCAiaW1wb3J0IHsgQ2hyb25pY2xlVGFzaywgVGFza1N0YXR1cywgVGFza1ByaW9yaXR5LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL1Rhc2tNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZVRhc2ssIFRhc2tTdGF0dXMsIFRhc2tQcmlvcml0eSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgVGFza01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSBlZGl0aW5nVGFzazogQ2hyb25pY2xlVGFzayB8IG51bGw7XG4gIHByaXZhdGUgb25TYXZlPzogKCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBvbkV4cGFuZD86ICh0YXNrPzogQ2hyb25pY2xlVGFzaykgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICB0YXNrTWFuYWdlcjogVGFza01hbmFnZXIsXG4gICAgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXIsXG4gICAgZWRpdGluZ1Rhc2s/OiBDaHJvbmljbGVUYXNrLFxuICAgIG9uU2F2ZT86ICgpID0+IHZvaWQsXG4gICAgb25FeHBhbmQ/OiAodGFzaz86IENocm9uaWNsZVRhc2spID0+IHZvaWRcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLnRhc2tNYW5hZ2VyICAgID0gdGFza01hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nVGFzayAgICA9IGVkaXRpbmdUYXNrID8/IG51bGw7XG4gICAgdGhpcy5vblNhdmUgICAgICAgICA9IG9uU2F2ZTtcbiAgICB0aGlzLm9uRXhwYW5kICAgICAgID0gb25FeHBhbmQ7XG4gIH1cblxuICBvbk9wZW4oKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwiY2hyb25pY2xlLWV2ZW50LW1vZGFsXCIpO1xuXG4gICAgY29uc3QgdCAgICAgICAgID0gdGhpcy5lZGl0aW5nVGFzaztcbiAgICBjb25zdCBjYWxlbmRhcnMgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRBbGwoKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIZWFkZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaGVhZGVyID0gY29udGVudEVsLmNyZWF0ZURpdihcImNlbS1oZWFkZXJcIik7XG4gICAgaGVhZGVyLmNyZWF0ZURpdihcImNlbS10aXRsZVwiKS5zZXRUZXh0KHQgPyBcIkVkaXQgdGFza1wiIDogXCJOZXcgdGFza1wiKTtcblxuICAgIGNvbnN0IGV4cGFuZEJ0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tZ2hvc3QgY2VtLWV4cGFuZC1idG5cIiB9KTtcbiAgICBleHBhbmRCdG4udGl0bGUgPSBcIk9wZW4gYXMgZnVsbCBwYWdlXCI7XG4gICAgZXhwYW5kQnRuLmlubmVySFRNTCA9IGA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIj48cG9seWxpbmUgcG9pbnRzPVwiMTUgMyAyMSAzIDIxIDlcIi8+PHBvbHlsaW5lIHBvaW50cz1cIjkgMjEgMyAyMSAzIDE1XCIvPjxsaW5lIHgxPVwiMjFcIiB5MT1cIjNcIiB4Mj1cIjE0XCIgeTI9XCIxMFwiLz48bGluZSB4MT1cIjNcIiB5MT1cIjIxXCIgeDI9XCIxMFwiIHkyPVwiMTRcIi8+PC9zdmc+YDtcbiAgICBleHBhbmRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIHRoaXMub25FeHBhbmQ/Lih0ID8/IHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9ybSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb3JtID0gY29udGVudEVsLmNyZWF0ZURpdihcImNlbS1mb3JtXCIpO1xuXG4gICAgLy8gVGl0bGVcbiAgICBjb25zdCB0aXRsZUlucHV0ID0gdGhpcy5maWVsZChmb3JtLCBcIlRpdGxlXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dCBjZi10aXRsZS1pbnB1dFwiLCBwbGFjZWhvbGRlcjogXCJUYXNrIG5hbWVcIlxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSB0Py50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIFN0YXR1cyArIFByaW9yaXR5XG4gICAgY29uc3Qgcm93MSA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuXG4gICAgY29uc3Qgc3RhdHVzU2VsZWN0ID0gdGhpcy5maWVsZChyb3cxLCBcIlN0YXR1c1wiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCBzdGF0dXNlczogeyB2YWx1ZTogVGFza1N0YXR1czsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcInRvZG9cIiwgICAgICAgIGxhYmVsOiBcIlRvIGRvXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiaW4tcHJvZ3Jlc3NcIiwgbGFiZWw6IFwiSW4gcHJvZ3Jlc3NcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJkb25lXCIsICAgICAgICBsYWJlbDogXCJEb25lXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiY2FuY2VsbGVkXCIsICAgbGFiZWw6IFwiQ2FuY2VsbGVkXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgcyBvZiBzdGF0dXNlcykge1xuICAgICAgY29uc3Qgb3B0ID0gc3RhdHVzU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHMudmFsdWUsIHRleHQ6IHMubGFiZWwgfSk7XG4gICAgICBpZiAodD8uc3RhdHVzID09PSBzLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHByaW9yaXR5U2VsZWN0ID0gdGhpcy5maWVsZChyb3cxLCBcIlByaW9yaXR5XCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHByaW9yaXRpZXM6IHsgdmFsdWU6IFRhc2tQcmlvcml0eTsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcIm5vbmVcIiwgICBsYWJlbDogXCJOb25lXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwibG93XCIsICAgIGxhYmVsOiBcIkxvd1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIm1lZGl1bVwiLCBsYWJlbDogXCJNZWRpdW1cIiB9LFxuICAgICAgeyB2YWx1ZTogXCJoaWdoXCIsICAgbGFiZWw6IFwiSGlnaFwiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgcHJpb3JpdGllcykge1xuICAgICAgY29uc3Qgb3B0ID0gcHJpb3JpdHlTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogcC52YWx1ZSwgdGV4dDogcC5sYWJlbCB9KTtcbiAgICAgIGlmICh0Py5wcmlvcml0eSA9PT0gcC52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBEdWUgZGF0ZSArIHRpbWVcbiAgICBjb25zdCByb3cyID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG5cbiAgICBjb25zdCBkdWVEYXRlSW5wdXQgPSB0aGlzLmZpZWxkKHJvdzIsIFwiRGF0ZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGR1ZURhdGVJbnB1dC52YWx1ZSA9IHQ/LmR1ZURhdGUgPz8gXCJcIjtcblxuICAgIGNvbnN0IGR1ZVRpbWVJbnB1dCA9IHRoaXMuZmllbGQocm93MiwgXCJUaW1lXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0aW1lXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgZHVlVGltZUlucHV0LnZhbHVlID0gdD8uZHVlVGltZSA/PyBcIlwiO1xuXG4gICAgLy8gQ2FsZW5kYXJcbiAgICBjb25zdCBjYWxTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQ2FsZW5kYXJcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY2FsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IFwiXCIsIHRleHQ6IFwiTm9uZVwiIH0pO1xuICAgIGZvciAoY29uc3QgY2FsIG9mIGNhbGVuZGFycykge1xuICAgICAgY29uc3Qgb3B0ID0gY2FsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGNhbC5pZCwgdGV4dDogY2FsLm5hbWUgfSk7XG4gICAgICBpZiAodD8uY2FsZW5kYXJJZCA9PT0gY2FsLmlkKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cbiAgICBjb25zdCB1cGRhdGVDYWxDb2xvciA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNhbCA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoY2FsU2VsZWN0LnZhbHVlKTtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0Q29sb3IgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCJ0cmFuc3BhcmVudFwiO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRXaWR0aCA9IFwiNHB4XCI7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdFN0eWxlID0gXCJzb2xpZFwiO1xuICAgIH07XG4gICAgY2FsU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdXBkYXRlQ2FsQ29sb3IpO1xuICAgIHVwZGF0ZUNhbENvbG9yKCk7XG5cbiAgICAvLyBSZWN1cnJlbmNlXG4gICAgY29uc3QgcmVjU2VsZWN0ID0gdGhpcy5maWVsZChmb3JtLCBcIlJlcGVhdFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCByZWN1cnJlbmNlcyA9IFtcbiAgICAgIHsgdmFsdWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiTmV2ZXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPURBSUxZXCIsICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSBkYXlcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSB3ZWVrXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1NT05USExZXCIsICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgbW9udGhcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVlFQVJMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSB5ZWFyXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1XRUVLTFk7QllEQVk9TU8sVFUsV0UsVEgsRlJcIiwgICBsYWJlbDogXCJXZWVrZGF5c1wiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IHIgb2YgcmVjdXJyZW5jZXMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IHJlY1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiByLnZhbHVlLCB0ZXh0OiByLmxhYmVsIH0pO1xuICAgICAgaWYgKHQ/LnJlY3VycmVuY2UgPT09IHIudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gQWxlcnRcbiAgICBjb25zdCBhbGVydFNlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJBbGVydFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCB0YXNrQWxlcnRzOiB7IHZhbHVlOiBBbGVydE9mZnNldDsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcIm5vbmVcIiwgICAgbGFiZWw6IFwiTm9uZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImF0LXRpbWVcIiwgbGFiZWw6IFwiQXQgdGltZSBvZiB0YXNrXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiNW1pblwiLCAgICBsYWJlbDogXCI1IG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMTBtaW5cIiwgICBsYWJlbDogXCIxMCBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjE1bWluXCIsICAgbGFiZWw6IFwiMTUgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIzMG1pblwiLCAgIGxhYmVsOiBcIjMwIG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMWhvdXJcIiwgICBsYWJlbDogXCIxIGhvdXIgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMmhvdXJzXCIsICBsYWJlbDogXCIyIGhvdXJzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjFkYXlcIiwgICAgbGFiZWw6IFwiMSBkYXkgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMmRheXNcIiwgICBsYWJlbDogXCIyIGRheXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMXdlZWtcIiwgICBsYWJlbDogXCIxIHdlZWsgYmVmb3JlXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgYSBvZiB0YXNrQWxlcnRzKSB7XG4gICAgICBjb25zdCBvcHQgPSBhbGVydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBhLnZhbHVlLCB0ZXh0OiBhLmxhYmVsIH0pO1xuICAgICAgaWYgKHQ/LmFsZXJ0ID09PSBhLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICghdCkge1xuICAgICAgY29uc3Qgbm9uZU9wdCA9IGFsZXJ0U2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJ29wdGlvblt2YWx1ZT1cIm5vbmVcIl0nKSBhcyBIVE1MT3B0aW9uRWxlbWVudDtcbiAgICAgIGlmIChub25lT3B0KSBub25lT3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgXG4gICAgLy8gTm90ZXNcbiAgICBjb25zdCBub3Rlc0lucHV0ID0gdGhpcy5maWVsZChmb3JtLCBcIk5vdGVzXCIpLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImNmLXRleHRhcmVhXCIsIHBsYWNlaG9sZGVyOiBcIkFkZCBub3Rlcy4uLlwiXG4gICAgfSk7XG4gICAgbm90ZXNJbnB1dC52YWx1ZSA9IHQ/Lm5vdGVzID8/IFwiXCI7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9vdGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGZvb3RlciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZW0tZm9vdGVyXCIpO1xuICAgIGNvbnN0IGNhbmNlbEJ0biA9IGZvb3Rlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tZ2hvc3RcIiwgdGV4dDogXCJDYW5jZWxcIiB9KTtcblxuICAgIGlmICh0ICYmIHQuaWQpIHtcbiAgICAgIGNvbnN0IGRlbGV0ZUJ0biA9IGZvb3Rlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tZGVsZXRlXCIsIHRleHQ6IFwiRGVsZXRlIHRhc2tcIiB9KTtcbiAgICAgIGRlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmRlbGV0ZSh0LmlkKTtcbiAgICAgICAgdGhpcy5vblNhdmU/LigpO1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBzYXZlQnRuID0gZm9vdGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJjZi1idG4tcHJpbWFyeVwiLCB0ZXh0OiB0Py5pZCA/IFwiU2F2ZVwiIDogXCJBZGQgdGFza1wiXG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGFuZGxlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY2FuY2VsQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuXG4gICAgY29uc3QgaGFuZGxlU2F2ZSA9IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRpdGxlID0gdGl0bGVJbnB1dC52YWx1ZS50cmltKCk7XG4gICAgICBpZiAoIXRpdGxlKSB7XG4gICAgICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgdGl0bGVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiY2YtZXJyb3JcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gRHVwbGljYXRlIGNoZWNrIChuZXcgdGFza3Mgb25seSlcbiAgICAgIGlmICghdD8uaWQpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEFsbCgpO1xuICAgICAgICBjb25zdCBkdXBsaWNhdGUgPSBleGlzdGluZy5maW5kKGUgPT4gZS50aXRsZS50b0xvd2VyQ2FzZSgpID09PSB0aXRsZS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgaWYgKGR1cGxpY2F0ZSkge1xuICAgICAgICAgIG5ldyBOb3RpY2UoYEEgdGFzayBuYW1lZCBcIiR7dGl0bGV9XCIgYWxyZWFkeSBleGlzdHMuYCwgNDAwMCk7XG4gICAgICAgICAgdGl0bGVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiY2YtZXJyb3JcIik7XG4gICAgICAgICAgdGl0bGVJbnB1dC5mb2N1cygpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB0YXNrRGF0YSA9IHtcbiAgICAgICAgdGl0bGUsXG4gICAgICAgIHN0YXR1czogICAgICBzdGF0dXNTZWxlY3QudmFsdWUgYXMgVGFza1N0YXR1cyxcbiAgICAgICAgcHJpb3JpdHk6ICAgIHByaW9yaXR5U2VsZWN0LnZhbHVlIGFzIFRhc2tQcmlvcml0eSxcbiAgICAgICAgZHVlRGF0ZTogICAgIGR1ZURhdGVJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGR1ZVRpbWU6ICAgICBkdWVUaW1lSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBjYWxlbmRhcklkOiAgY2FsU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgcmVjdXJyZW5jZTogIHJlY1NlbGVjdC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIG5vdGVzOiAgICAgICBub3Rlc0lucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgIGFsZXJ0U2VsZWN0LnZhbHVlIGFzIEFsZXJ0T2Zmc2V0LFxuICAgICAgICB0YWdzOiAgICAgICAgICAgICAgdD8udGFncyA/PyBbXSxcbiAgICAgICAgY29udGV4dHM6ICAgICAgICAgIHQ/LmNvbnRleHRzID8/IFtdLFxuICAgICAgICBsaW5rZWROb3RlczogICAgICAgdD8ubGlua2VkTm90ZXMgPz8gW10sXG4gICAgICAgIHByb2plY3RzOiAgICAgICAgICB0Py5wcm9qZWN0cyA/PyBbXSxcbiAgICAgICAgdGltZUVzdGltYXRlOiAgICAgIHQ/LnRpbWVFc3RpbWF0ZSxcbiAgICAgICAgdGltZUVudHJpZXM6ICAgICAgIHQ/LnRpbWVFbnRyaWVzID8/IFtdLFxuICAgICAgICBjdXN0b21GaWVsZHM6ICAgICAgdD8uY3VzdG9tRmllbGRzID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6IHQ/LmNvbXBsZXRlZEluc3RhbmNlcyA/PyBbXSxcbiAgICAgIH07XG5cbiAgICAgIGlmICh0Py5pZCkge1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLnVwZGF0ZSh7IC4uLnQsIC4uLnRhc2tEYXRhIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5jcmVhdGUodGFza0RhdGEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm9uU2F2ZT8uKCk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhhbmRsZVNhdmUpO1xuICAgIHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGUpID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiKSBoYW5kbGVTYXZlKCk7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiRXNjYXBlXCIpIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7IHRoaXMuY29udGVudEVsLmVtcHR5KCk7IH1cblxuICBwcml2YXRlIGZpZWxkKHBhcmVudDogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3Qgd3JhcCA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZi1maWVsZFwiKTtcbiAgICB3cmFwLmNyZWF0ZURpdihcImNmLWxhYmVsXCIpLnNldFRleHQobGFiZWwpO1xuICAgIHJldHVybiB3cmFwO1xuICB9XG59IiwgImltcG9ydCB7IFRhc2tNb2RhbCB9IGZyb20gXCIuLi91aS9UYXNrTW9kYWxcIjtcbmltcG9ydCB7IEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVUYXNrIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL1Rhc2tNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IFRhc2tGb3JtVmlldywgVEFTS19GT1JNX1ZJRVdfVFlQRSB9IGZyb20gXCIuL1Rhc2tGb3JtVmlld1wiO1xuaW1wb3J0IHsgRXZlbnRNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvRXZlbnRNYW5hZ2VyXCI7XG5cbmV4cG9ydCBjb25zdCBUQVNLX1ZJRVdfVFlQRSA9IFwiY2hyb25pY2xlLXRhc2stdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgVGFza1ZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIHByaXZhdGUgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyO1xuICBwcml2YXRlIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICBwcml2YXRlIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyO1xuICBwcml2YXRlIGN1cnJlbnRMaXN0SWQ6IHN0cmluZyA9IFwidG9kYXlcIjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBsZWFmOiBXb3Jrc3BhY2VMZWFmLFxuICAgIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcixcbiAgICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcixcbiAgICBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlclxuICApIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLnRhc2tNYW5hZ2VyID0gdGFza01hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5ldmVudE1hbmFnZXIgPSBldmVudE1hbmFnZXI7XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcgeyByZXR1cm4gVEFTS19WSUVXX1RZUEU7IH1cbiAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHsgcmV0dXJuIFwiQ2hyb25pY2xlXCI7IH1cbiAgZ2V0SWNvbigpOiBzdHJpbmcgeyByZXR1cm4gXCJjaGVjay1jaXJjbGVcIjsgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHtcbiAgICBhd2FpdCB0aGlzLnJlbmRlcigpO1xuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5vbihcImNoYW5nZWRcIiwgKGZpbGUpID0+IHtcbiAgICAgICAgaWYgKGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMudGFza01hbmFnZXJbXCJ0YXNrc0ZvbGRlclwiXSkpIHtcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAudmF1bHQub24oXCJjcmVhdGVcIiwgKGZpbGUpID0+IHtcbiAgICAgICAgaWYgKGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMudGFza01hbmFnZXJbXCJ0YXNrc0ZvbGRlclwiXSkpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMucmVuZGVyKCksIDIwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC52YXVsdC5vbihcImRlbGV0ZVwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKSkge1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHJlbmRlcigpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuICAgIGNvbnRhaW5lci5hZGRDbGFzcyhcImNocm9uaWNsZS1hcHBcIik7XG5cbiAgICBjb25zdCBhbGwgICAgICAgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEFsbCgpO1xuICAgIGNvbnN0IHRvZGF5ICAgICA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0RHVlVG9kYXkoKTtcbiAgICBjb25zdCBzY2hlZHVsZWQgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldFNjaGVkdWxlZCgpO1xuICAgIGNvbnN0IGZsYWdnZWQgICA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0RmxhZ2dlZCgpO1xuICAgIGNvbnN0IG92ZXJkdWUgICA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0T3ZlcmR1ZSgpO1xuICAgIGNvbnN0IGNhbGVuZGFycyA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgY29uc3QgbGF5b3V0ICA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGF5b3V0XCIpO1xuICAgIGNvbnN0IHNpZGViYXIgPSBsYXlvdXQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXNpZGViYXJcIik7XG4gICAgY29uc3QgbWFpbiAgICA9IGxheW91dC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWFpblwiKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBOZXcgdGFzayBidXR0b24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgbmV3VGFza0J0biA9IHNpZGViYXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImNocm9uaWNsZS1uZXctdGFzay1idG5cIiwgdGV4dDogXCJOZXcgdGFza1wiXG4gICAgfSk7XG4gICAgbmV3VGFza0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5vcGVuVGFza0Zvcm0oKSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgU21hcnQgbGlzdCB0aWxlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB0aWxlc0dyaWQgPSBzaWRlYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlc1wiKTtcblxuICAgIGNvbnN0IHRpbGVzID0gW1xuICAgICAgeyBpZDogXCJ0b2RheVwiLCAgICAgbGFiZWw6IFwiVG9kYXlcIiwgICAgIGNvdW50OiB0b2RheS5sZW5ndGggKyBvdmVyZHVlLmxlbmd0aCwgY29sb3I6IFwiI0ZGM0IzMFwiLCBiYWRnZTogb3ZlcmR1ZS5sZW5ndGggfSxcbiAgICAgIHsgaWQ6IFwic2NoZWR1bGVkXCIsIGxhYmVsOiBcIlNjaGVkdWxlZFwiLCBjb3VudDogc2NoZWR1bGVkLmxlbmd0aCwgICAgICAgICAgICAgIGNvbG9yOiBcIiMzNzhBRERcIiwgYmFkZ2U6IDAgfSxcbiAgICAgIHsgaWQ6IFwiYWxsXCIsICAgICAgIGxhYmVsOiBcIkFsbFwiLCAgICAgICBjb3VudDogYWxsLmZpbHRlcih0ID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIikubGVuZ3RoLCBjb2xvcjogXCIjNjM2MzY2XCIsIGJhZGdlOiAwIH0sXG4gICAgICB7IGlkOiBcImZsYWdnZWRcIiwgICBsYWJlbDogXCJGbGFnZ2VkXCIsICAgY291bnQ6IGZsYWdnZWQubGVuZ3RoLCAgICAgICAgICAgICAgICBjb2xvcjogXCIjRkY5NTAwXCIsIGJhZGdlOiAwIH0sXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgdGlsZSBvZiB0aWxlcykge1xuICAgICAgY29uc3QgdCA9IHRpbGVzR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGlsZVwiKTtcbiAgICAgIHQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGlsZS5jb2xvcjtcbiAgICAgIGlmICh0aWxlLmlkID09PSB0aGlzLmN1cnJlbnRMaXN0SWQpIHQuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG5cbiAgICAgIGNvbnN0IHRvcFJvdyA9IHQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtdG9wXCIpO1xuICAgICAgdG9wUm93LmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlLWNvdW50XCIpLnNldFRleHQoU3RyaW5nKHRpbGUuY291bnQpKTtcblxuICAgICAgaWYgKHRpbGUuYmFkZ2UgPiAwKSB7XG4gICAgICAgIGNvbnN0IGJhZGdlID0gdG9wUm93LmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlLWJhZGdlXCIpO1xuICAgICAgICBiYWRnZS5zZXRUZXh0KFN0cmluZyh0aWxlLmJhZGdlKSk7XG4gICAgICAgIGJhZGdlLnRpdGxlID0gYCR7dGlsZS5iYWRnZX0gb3ZlcmR1ZWA7XG4gICAgICB9XG5cbiAgICAgIHQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtbGFiZWxcIikuc2V0VGV4dCh0aWxlLmxhYmVsKTtcbiAgICAgIHQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50TGlzdElkID0gdGlsZS5pZDsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIENvbXBsZXRlZCBhcmNoaXZlIGVudHJ5IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGNvbXBsZXRlZFJvdyA9IHNpZGViYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3Qtcm93XCIpO1xuICAgIGlmICh0aGlzLmN1cnJlbnRMaXN0SWQgPT09IFwiY29tcGxldGVkXCIpIGNvbXBsZXRlZFJvdy5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICBjb25zdCBjb21wbGV0ZWRJY29uID0gY29tcGxldGVkUm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb21wbGV0ZWQtaWNvblwiKTtcbiAgICBjb21wbGV0ZWRJY29uLmlubmVySFRNTCA9IGA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIj48cGF0aCBkPVwiTTIyIDExLjA4VjEyYTEwIDEwIDAgMSAxLTUuOTMtOS4xNFwiLz48cG9seWxpbmUgcG9pbnRzPVwiMjIgNCAxMiAxNC4wMSA5IDExLjAxXCIvPjwvc3ZnPmA7XG4gICAgY29tcGxldGVkUm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LW5hbWVcIikuc2V0VGV4dChcIkNvbXBsZXRlZFwiKTtcbiAgICBjb25zdCBjb21wbGV0ZWRDb3VudCA9IGFsbC5maWx0ZXIodCA9PiB0LnN0YXR1cyA9PT0gXCJkb25lXCIpLmxlbmd0aDtcbiAgICBpZiAoY29tcGxldGVkQ291bnQgPiAwKSBjb21wbGV0ZWRSb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3QtY291bnRcIikuc2V0VGV4dChTdHJpbmcoY29tcGxldGVkQ291bnQpKTtcbiAgICBjb21wbGV0ZWRSb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50TGlzdElkID0gXCJjb21wbGV0ZWRcIjsgdGhpcy5yZW5kZXIoKTsgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTXkgTGlzdHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgbGlzdHNTZWN0aW9uID0gc2lkZWJhci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdHMtc2VjdGlvblwiKTtcbiAgICBsaXN0c1NlY3Rpb24uY3JlYXRlRGl2KFwiY2hyb25pY2xlLXNlY3Rpb24tbGFiZWxcIikuc2V0VGV4dChcIk15IExpc3RzXCIpO1xuXG4gICAgZm9yIChjb25zdCBjYWwgb2YgY2FsZW5kYXJzKSB7XG4gICAgICBjb25zdCByb3cgPSBsaXN0c1NlY3Rpb24uY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3Qtcm93XCIpO1xuICAgICAgaWYgKGNhbC5pZCA9PT0gdGhpcy5jdXJyZW50TGlzdElkKSByb3cuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG5cbiAgICAgIGNvbnN0IGRvdCA9IHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1kb3RcIik7XG4gICAgICBkb3Quc3R5bGUuYmFja2dyb3VuZENvbG9yID0gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKTtcblxuICAgICAgcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LW5hbWVcIikuc2V0VGV4dChjYWwubmFtZSk7XG5cbiAgICAgIGNvbnN0IGNhbENvdW50ID0gYWxsLmZpbHRlcih0ID0+IHQuY2FsZW5kYXJJZCA9PT0gY2FsLmlkICYmIHQuc3RhdHVzICE9PSBcImRvbmVcIikubGVuZ3RoO1xuICAgICAgaWYgKGNhbENvdW50ID4gMCkgcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LWNvdW50XCIpLnNldFRleHQoU3RyaW5nKGNhbENvdW50KSk7XG5cbiAgICAgIHJvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmN1cnJlbnRMaXN0SWQgPSBjYWwuaWQ7IHRoaXMucmVuZGVyKCk7IH0pO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBNYWluIHBhbmVsIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGF3YWl0IHRoaXMucmVuZGVyTWFpblBhbmVsKG1haW4sIGFsbCwgb3ZlcmR1ZSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlbmRlck1haW5QYW5lbChcbiAgICBtYWluOiBIVE1MRWxlbWVudCxcbiAgICBhbGw6IENocm9uaWNsZVRhc2tbXSxcbiAgICBvdmVyZHVlOiBDaHJvbmljbGVUYXNrW11cbiAgKSB7XG4gICAgY29uc3QgaGVhZGVyICA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1haW4taGVhZGVyXCIpO1xuICAgIGNvbnN0IHRpdGxlRWwgPSBoZWFkZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1haW4tdGl0bGVcIik7XG5cbiAgICBsZXQgdGFza3M6IENocm9uaWNsZVRhc2tbXSA9IFtdO1xuXG4gICAgY29uc3Qgc21hcnRDb2xvcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICB0b2RheTogXCIjRkYzQjMwXCIsIHNjaGVkdWxlZDogXCIjMzc4QUREXCIsIGFsbDogXCIjNjM2MzY2XCIsXG4gICAgICBmbGFnZ2VkOiBcIiNGRjk1MDBcIiwgY29tcGxldGVkOiBcIiMzNEM3NTlcIlxuICAgIH07XG5cbiAgICBpZiAoc21hcnRDb2xvcnNbdGhpcy5jdXJyZW50TGlzdElkXSkge1xuICAgICAgY29uc3QgbGFiZWxzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgICB0b2RheTogXCJUb2RheVwiLCBzY2hlZHVsZWQ6IFwiU2NoZWR1bGVkXCIsIGFsbDogXCJBbGxcIixcbiAgICAgICAgZmxhZ2dlZDogXCJGbGFnZ2VkXCIsIGNvbXBsZXRlZDogXCJDb21wbGV0ZWRcIlxuICAgICAgfTtcbiAgICAgIHRpdGxlRWwuc2V0VGV4dChsYWJlbHNbdGhpcy5jdXJyZW50TGlzdElkXSk7XG4gICAgICB0aXRsZUVsLnN0eWxlLmNvbG9yID0gc21hcnRDb2xvcnNbdGhpcy5jdXJyZW50TGlzdElkXTtcblxuICAgICAgc3dpdGNoICh0aGlzLmN1cnJlbnRMaXN0SWQpIHtcbiAgICAgICAgY2FzZSBcInRvZGF5XCI6XG4gICAgICAgICAgdGFza3MgPSBbLi4ub3ZlcmR1ZSwgLi4uKGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0RHVlVG9kYXkoKSldO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwic2NoZWR1bGVkXCI6XG4gICAgICAgICAgdGFza3MgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldFNjaGVkdWxlZCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZmxhZ2dlZFwiOlxuICAgICAgICAgIHRhc2tzID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRGbGFnZ2VkKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJhbGxcIjpcbiAgICAgICAgICB0YXNrcyA9IGFsbC5maWx0ZXIodCA9PiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiY29tcGxldGVkXCI6XG4gICAgICAgICAgdGFza3MgPSBhbGwuZmlsdGVyKHQgPT4gdC5zdGF0dXMgPT09IFwiZG9uZVwiKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZCh0aGlzLmN1cnJlbnRMaXN0SWQpO1xuICAgICAgdGl0bGVFbC5zZXRUZXh0KGNhbD8ubmFtZSA/PyBcIkxpc3RcIik7XG4gICAgICB0aXRsZUVsLnN0eWxlLmNvbG9yID0gY2FsXG4gICAgICAgID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKVxuICAgICAgICA6IFwidmFyKC0tdGV4dC1ub3JtYWwpXCI7XG4gICAgICB0YXNrcyA9IGFsbC5maWx0ZXIoXG4gICAgICAgIHQgPT4gdC5jYWxlbmRhcklkID09PSB0aGlzLmN1cnJlbnRMaXN0SWQgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGlzQ29tcGxldGVkID0gdGhpcy5jdXJyZW50TGlzdElkID09PSBcImNvbXBsZXRlZFwiO1xuICAgIGNvbnN0IGNvdW50VGFza3MgID0gaXNDb21wbGV0ZWQgPyB0YXNrcyA6IHRhc2tzLmZpbHRlcih0ID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIik7XG4gICAgaWYgKGNvdW50VGFza3MubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3Qgc3VidGl0bGUgPSBoZWFkZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1haW4tc3VidGl0bGVcIik7XG4gICAgICBpZiAoaXNDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgY2xlYXJCdG4gPSBzdWJ0aXRsZS5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgY2xzOiBcImNocm9uaWNsZS1jbGVhci1idG5cIiwgdGV4dDogXCJDbGVhciBhbGxcIlxuICAgICAgICB9KTtcbiAgICAgICAgY2xlYXJCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICBjb25zdCBhbGwyID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRBbGwoKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IHQgb2YgYWxsMi5maWx0ZXIodCA9PiB0LnN0YXR1cyA9PT0gXCJkb25lXCIpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmRlbGV0ZSh0LmlkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdWJ0aXRsZS5zZXRUZXh0KFxuICAgICAgICAgIGAke2NvdW50VGFza3MubGVuZ3RofSAke2NvdW50VGFza3MubGVuZ3RoID09PSAxID8gXCJ0YXNrXCIgOiBcInRhc2tzXCJ9YFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGxpc3RFbCA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stbGlzdFwiKTtcblxuICAgIGlmICh0YXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMucmVuZGVyRW1wdHlTdGF0ZShsaXN0RWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBncm91cHMgPSB0aGlzLmdyb3VwVGFza3ModGFza3MpO1xuICAgICAgZm9yIChjb25zdCBbZ3JvdXAsIGdyb3VwVGFza3NdIG9mIE9iamVjdC5lbnRyaWVzKGdyb3VwcykpIHtcbiAgICAgICAgaWYgKGdyb3VwVGFza3MubGVuZ3RoID09PSAwKSBjb250aW51ZTtcbiAgICAgICAgbGlzdEVsLmNyZWF0ZURpdihcImNocm9uaWNsZS1ncm91cC1sYWJlbFwiKS5zZXRUZXh0KGdyb3VwKTtcbiAgICAgICAgY29uc3QgY2FyZCA9IGxpc3RFbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1jYXJkLWdyb3VwXCIpO1xuICAgICAgICBmb3IgKGNvbnN0IHRhc2sgb2YgZ3JvdXBUYXNrcykge1xuICAgICAgICAgIHRoaXMucmVuZGVyVGFza1JvdyhjYXJkLCB0YXNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyRW1wdHlTdGF0ZShjb250YWluZXI6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgZW1wdHkgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWVtcHR5LXN0YXRlXCIpO1xuICAgIGNvbnN0IGljb24gID0gZW1wdHkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWVtcHR5LWljb25cIik7XG4gICAgaWNvbi5pbm5lckhUTUwgPSBgPHN2ZyB3aWR0aD1cIjQ4XCIgaGVpZ2h0PVwiNDhcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIj48cGF0aCBkPVwiTTIyIDExLjA4VjEyYTEwIDEwIDAgMSAxLTUuOTMtOS4xNFwiLz48cG9seWxpbmUgcG9pbnRzPVwiMjIgNCAxMiAxNC4wMSA5IDExLjAxXCIvPjwvc3ZnPmA7XG4gICAgZW1wdHkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWVtcHR5LXRpdGxlXCIpLnNldFRleHQoXCJBbGwgZG9uZVwiKTtcbiAgICBlbXB0eS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZW1wdHktc3VidGl0bGVcIikuc2V0VGV4dChcIk5vdGhpbmcgbGVmdCBpbiB0aGlzIGxpc3QuXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJUYXNrUm93KGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHRhc2s6IENocm9uaWNsZVRhc2spIHtcbiAgICBjb25zdCByb3cgICAgICAgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stcm93XCIpO1xuICAgIGNvbnN0IGlzRG9uZSAgICA9IHRhc2suc3RhdHVzID09PSBcImRvbmVcIjtcbiAgICBjb25zdCBpc0FyY2hpdmUgPSB0aGlzLmN1cnJlbnRMaXN0SWQgPT09IFwiY29tcGxldGVkXCI7XG5cbiAgICAvLyBDaGVja2JveFxuICAgIGNvbnN0IGNoZWNrYm94V3JhcCA9IHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2hlY2tib3gtd3JhcFwiKTtcbiAgICBjb25zdCBjaGVja2JveCAgICAgPSBjaGVja2JveFdyYXAuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNoZWNrYm94XCIpO1xuICAgIGlmIChpc0RvbmUpIGNoZWNrYm94LmFkZENsYXNzKFwiZG9uZVwiKTtcbiAgICBjaGVja2JveC5pbm5lckhUTUwgPSBgPHN2ZyBjbGFzcz1cImNocm9uaWNsZS1jaGVja21hcmtcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIjZmZmXCIgc3Ryb2tlLXdpZHRoPVwiM1wiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPjxwb2x5bGluZSBwb2ludHM9XCIyMCA2IDkgMTcgNCAxMlwiLz48L3N2Zz5gO1xuXG4gICAgY2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgY2hlY2tib3guYWRkQ2xhc3MoXCJjb21wbGV0aW5nXCIpO1xuICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIudXBkYXRlKHtcbiAgICAgICAgICAuLi50YXNrLFxuICAgICAgICAgIHN0YXR1czogICAgICBpc0RvbmUgPyBcInRvZG9cIiA6IFwiZG9uZVwiLFxuICAgICAgICAgIGNvbXBsZXRlZEF0OiBpc0RvbmUgPyB1bmRlZmluZWQgOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIH0pO1xuICAgICAgfSwgMzAwKTtcbiAgICB9KTtcblxuICAgIC8vIENvbnRlbnRcbiAgICBjb25zdCBjb250ZW50ID0gcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLWNvbnRlbnRcIik7XG4gICAgaWYgKCFpc0FyY2hpdmUpIGNvbnRlbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMub3BlblRhc2tGb3JtKHRhc2spKTtcblxuICAgIGNvbnN0IHRpdGxlRWwgPSBjb250ZW50LmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLXRpdGxlXCIpO1xuICAgIHRpdGxlRWwuc2V0VGV4dCh0YXNrLnRpdGxlKTtcbiAgICBpZiAoaXNEb25lKSB0aXRsZUVsLmFkZENsYXNzKFwiZG9uZVwiKTtcblxuICAgIC8vIE1ldGFcbiAgICBjb25zdCB0b2RheVN0ciA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgbWV0YVJvdyAgPSBjb250ZW50LmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLW1ldGFcIik7XG5cbiAgICBpZiAoaXNBcmNoaXZlICYmIHRhc2suY29tcGxldGVkQXQpIHtcbiAgICAgIGNvbnN0IGNvbXBsZXRlZERhdGUgPSBuZXcgRGF0ZSh0YXNrLmNvbXBsZXRlZEF0KTtcbiAgICAgIG1ldGFSb3cuY3JlYXRlU3BhbihcImNocm9uaWNsZS10YXNrLWRhdGVcIikuc2V0VGV4dChcbiAgICAgICAgXCJDb21wbGV0ZWQgXCIgKyBjb21wbGV0ZWREYXRlLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHtcbiAgICAgICAgICBtb250aDogXCJzaG9ydFwiLCBkYXk6IFwibnVtZXJpY1wiLCB5ZWFyOiBcIm51bWVyaWNcIlxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHRhc2suZHVlRGF0ZSB8fCB0YXNrLmNhbGVuZGFySWQpIHtcbiAgICAgIGlmICh0YXNrLmR1ZURhdGUpIHtcbiAgICAgICAgY29uc3QgbWV0YURhdGUgPSBtZXRhUm93LmNyZWF0ZVNwYW4oXCJjaHJvbmljbGUtdGFzay1kYXRlXCIpO1xuICAgICAgICBtZXRhRGF0ZS5zZXRUZXh0KHRoaXMuZm9ybWF0RGF0ZSh0YXNrLmR1ZURhdGUpKTtcbiAgICAgICAgaWYgKHRhc2suZHVlRGF0ZSA8IHRvZGF5U3RyKSBtZXRhRGF0ZS5hZGRDbGFzcyhcIm92ZXJkdWVcIik7XG4gICAgICB9XG4gICAgICBpZiAodGFzay5jYWxlbmRhcklkKSB7XG4gICAgICAgIGNvbnN0IGNhbCA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQodGFzay5jYWxlbmRhcklkKTtcbiAgICAgICAgaWYgKGNhbCkge1xuICAgICAgICAgIGNvbnN0IGNhbERvdCA9IG1ldGFSb3cuY3JlYXRlU3BhbihcImNocm9uaWNsZS10YXNrLWNhbC1kb3RcIik7XG4gICAgICAgICAgY2FsRG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcik7XG4gICAgICAgICAgbWV0YVJvdy5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXRhc2stY2FsLW5hbWVcIikuc2V0VGV4dChjYWwubmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBQcmlvcml0eSBmbGFnIChub24tYXJjaGl2ZSBvbmx5KVxuICAgIGlmICghaXNBcmNoaXZlICYmIHRhc2sucHJpb3JpdHkgPT09IFwiaGlnaFwiKSB7XG4gICAgICByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWZsYWdcIikuc2V0VGV4dChcIlx1MjY5MVwiKTtcbiAgICB9XG5cbiAgICAvLyBBcmNoaXZlOiBSZXN0b3JlICsgRGVsZXRlIGJ1dHRvbnNcbiAgICBpZiAoaXNBcmNoaXZlKSB7XG4gICAgICBjb25zdCBhY3Rpb25zID0gcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1hcmNoaXZlLWFjdGlvbnNcIik7XG5cbiAgICAgIGNvbnN0IHJlc3RvcmVCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImNocm9uaWNsZS1hcmNoaXZlLWJ0blwiLCB0ZXh0OiBcIlJlc3RvcmVcIlxuICAgICAgfSk7XG4gICAgICByZXN0b3JlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLnVwZGF0ZSh7IC4uLnRhc2ssIHN0YXR1czogXCJ0b2RvXCIsIGNvbXBsZXRlZEF0OiB1bmRlZmluZWQgfSk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZGVsZXRlQnRuID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJjaHJvbmljbGUtYXJjaGl2ZS1idG4gY2hyb25pY2xlLWFyY2hpdmUtYnRuLWRlbGV0ZVwiLCB0ZXh0OiBcIkRlbGV0ZVwiXG4gICAgICB9KTtcbiAgICAgIGRlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5kZWxldGUodGFzay5pZCk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJpZ2h0LWNsaWNrIGNvbnRleHQgbWVudSAobm9uLWFyY2hpdmUpXG4gICAgcm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY29uc3QgbWVudSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBtZW51LmNsYXNzTmFtZSAgPSBcImNocm9uaWNsZS1jb250ZXh0LW1lbnVcIjtcbiAgICAgIG1lbnUuc3R5bGUubGVmdCA9IGAke2UuY2xpZW50WH1weGA7XG4gICAgICBtZW51LnN0eWxlLnRvcCAgPSBgJHtlLmNsaWVudFl9cHhgO1xuXG4gICAgICBjb25zdCBlZGl0SXRlbSA9IG1lbnUuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbnRleHQtaXRlbVwiKTtcbiAgICAgIGVkaXRJdGVtLnNldFRleHQoXCJFZGl0IHRhc2tcIik7XG4gICAgICBlZGl0SXRlbS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyBtZW51LnJlbW92ZSgpOyB0aGlzLm9wZW5UYXNrRm9ybSh0YXNrKTsgfSk7XG5cbiAgICAgIGNvbnN0IGRlbGV0ZUl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW0gY2hyb25pY2xlLWNvbnRleHQtZGVsZXRlXCIpO1xuICAgICAgZGVsZXRlSXRlbS5zZXRUZXh0KFwiRGVsZXRlIHRhc2tcIik7XG4gICAgICBkZWxldGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIG1lbnUucmVtb3ZlKCk7XG4gICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIuZGVsZXRlKHRhc2suaWQpO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNhbmNlbEl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW1cIik7XG4gICAgICBjYW5jZWxJdGVtLnNldFRleHQoXCJDYW5jZWxcIik7XG4gICAgICBjYW5jZWxJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBtZW51LnJlbW92ZSgpKTtcblxuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtZW51KTtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IG1lbnUucmVtb3ZlKCksIHsgb25jZTogdHJ1ZSB9KSwgMCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGdyb3VwVGFza3ModGFza3M6IENocm9uaWNsZVRhc2tbXSk6IFJlY29yZDxzdHJpbmcsIENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IHRvZGF5ICAgID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCBuZXh0V2VlayA9IG5ldyBEYXRlKERhdGUubm93KCkgKyA3ICogODY0MDAwMDApLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IHdlZWtBZ28gID0gbmV3IERhdGUoRGF0ZS5ub3coKSAtIDcgKiA4NjQwMDAwMCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBpZiAodGhpcy5jdXJyZW50TGlzdElkID09PSBcImNvbXBsZXRlZFwiKSB7XG4gICAgICBjb25zdCBncm91cHM6IFJlY29yZDxzdHJpbmcsIENocm9uaWNsZVRhc2tbXT4gPSB7XG4gICAgICAgIFwiVG9kYXlcIjogICAgIFtdLFxuICAgICAgICBcIlRoaXMgd2Vla1wiOiBbXSxcbiAgICAgICAgXCJFYXJsaWVyXCI6ICAgW10sXG4gICAgICB9O1xuICAgICAgZm9yIChjb25zdCB0YXNrIG9mIHRhc2tzKSB7XG4gICAgICAgIGNvbnN0IGQgPSB0YXNrLmNvbXBsZXRlZEF0Py5zcGxpdChcIlRcIilbMF0gPz8gXCJcIjtcbiAgICAgICAgaWYgKGQgPT09IHRvZGF5KSAgICAgICBncm91cHNbXCJUb2RheVwiXS5wdXNoKHRhc2spO1xuICAgICAgICBlbHNlIGlmIChkID49IHdlZWtBZ28pIGdyb3Vwc1tcIlRoaXMgd2Vla1wiXS5wdXNoKHRhc2spO1xuICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgIGdyb3Vwc1tcIkVhcmxpZXJcIl0ucHVzaCh0YXNrKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBncm91cHM7XG4gICAgfVxuXG4gICAgY29uc3QgZ3JvdXBzOiBSZWNvcmQ8c3RyaW5nLCBDaHJvbmljbGVUYXNrW10+ID0ge1xuICAgICAgXCJPdmVyZHVlXCI6ICAgW10sXG4gICAgICBcIlRvZGF5XCI6ICAgICBbXSxcbiAgICAgIFwiVGhpcyB3ZWVrXCI6IFtdLFxuICAgICAgXCJMYXRlclwiOiAgICAgW10sXG4gICAgICBcIk5vIGRhdGVcIjogICBbXSxcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCB0YXNrIG9mIHRhc2tzKSB7XG4gICAgICBpZiAodGFzay5zdGF0dXMgPT09IFwiZG9uZVwiKSBjb250aW51ZTtcbiAgICAgIGlmICghdGFzay5kdWVEYXRlKSAgICAgICAgICAgIHsgZ3JvdXBzW1wiTm8gZGF0ZVwiXS5wdXNoKHRhc2spOyAgIGNvbnRpbnVlOyB9XG4gICAgICBpZiAodGFzay5kdWVEYXRlIDwgdG9kYXkpICAgICB7IGdyb3Vwc1tcIk92ZXJkdWVcIl0ucHVzaCh0YXNrKTsgICBjb250aW51ZTsgfVxuICAgICAgaWYgKHRhc2suZHVlRGF0ZSA9PT0gdG9kYXkpICAgeyBncm91cHNbXCJUb2RheVwiXS5wdXNoKHRhc2spOyAgICAgY29udGludWU7IH1cbiAgICAgIGlmICh0YXNrLmR1ZURhdGUgPD0gbmV4dFdlZWspIHsgZ3JvdXBzW1wiVGhpcyB3ZWVrXCJdLnB1c2godGFzayk7IGNvbnRpbnVlOyB9XG4gICAgICBncm91cHNbXCJMYXRlclwiXS5wdXNoKHRhc2spO1xuICAgIH1cblxuICAgIHJldHVybiBncm91cHM7XG4gIH1cblxuICBwcml2YXRlIGZvcm1hdERhdGUoZGF0ZVN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCB0b2RheSAgICA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgdG9tb3Jyb3cgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgODY0MDAwMDApLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGlmIChkYXRlU3RyID09PSB0b2RheSkgICAgcmV0dXJuIFwiVG9kYXlcIjtcbiAgICBpZiAoZGF0ZVN0ciA9PT0gdG9tb3Jyb3cpIHJldHVybiBcIlRvbW9ycm93XCI7XG4gICAgcmV0dXJuIG5ldyBEYXRlKGRhdGVTdHIgKyBcIlQwMDowMDowMFwiKS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7XG4gICAgICBtb250aDogXCJzaG9ydFwiLCBkYXk6IFwibnVtZXJpY1wiXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBvcGVuVGFza0Zvcm0odGFzaz86IENocm9uaWNsZVRhc2spIHtcbiAgICBuZXcgVGFza01vZGFsKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLnRhc2tNYW5hZ2VyLFxuICAgICAgdGhpcy5jYWxlbmRhck1hbmFnZXIsXG4gICAgICB0YXNrLFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgKHQpID0+IHRoaXMub3BlblRhc2tGdWxsUGFnZSh0KVxuICAgICkub3BlbigpO1xuICB9XG5cbiAgYXN5bmMgb3BlblRhc2tGdWxsUGFnZSh0YXNrPzogQ2hyb25pY2xlVGFzaykge1xuICAgIGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcbiAgICBjb25zdCBleGlzdGluZyA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVEFTS19GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKGV4aXN0aW5nKSBleGlzdGluZy5kZXRhY2goKTtcbiAgICBjb25zdCBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBUQVNLX0ZPUk1fVklFV19UWVBFLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7XG4gICAgY29uc3QgZm9ybUxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfRk9STV9WSUVXX1RZUEUpWzBdO1xuICAgIGNvbnN0IGZvcm1WaWV3ID0gZm9ybUxlYWY/LnZpZXcgYXMgVGFza0Zvcm1WaWV3IHwgdW5kZWZpbmVkO1xuICAgIGlmIChmb3JtVmlldyAmJiB0YXNrKSBmb3JtVmlldy5sb2FkVGFzayh0YXNrKTtcbiAgfVxufSIsICJpbXBvcnQgeyBDaHJvbmljbGVUYXNrLCBUYXNrU3RhdHVzLCBUYXNrUHJpb3JpdHksIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL1Rhc2tNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZVRhc2ssIFRhc2tTdGF0dXMsIFRhc2tQcmlvcml0eSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY29uc3QgVEFTS19GT1JNX1ZJRVdfVFlQRSA9IFwiY2hyb25pY2xlLXRhc2stZm9ybVwiO1xuXG5leHBvcnQgY2xhc3MgVGFza0Zvcm1WaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSBlZGl0aW5nVGFzazogQ2hyb25pY2xlVGFzayB8IG51bGwgPSBudWxsO1xuICBvblNhdmU/OiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICAgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyLFxuICAgIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyLFxuICAgIGVkaXRpbmdUYXNrPzogQ2hyb25pY2xlVGFzayxcbiAgICBvblNhdmU/OiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMudGFza01hbmFnZXIgPSB0YXNrTWFuYWdlcjtcbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IGNhbGVuZGFyTWFuYWdlcjtcbiAgICB0aGlzLmVkaXRpbmdUYXNrID0gZWRpdGluZ1Rhc2sgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSA9IG9uU2F2ZTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7IHJldHVybiBUQVNLX0ZPUk1fVklFV19UWVBFOyB9XG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmVkaXRpbmdUYXNrID8gXCJFZGl0IHRhc2tcIiA6IFwiTmV3IHRhc2tcIjsgfVxuICBnZXRJY29uKCk6IHN0cmluZyB7IHJldHVybiBcImNoZWNrLWNpcmNsZVwiOyB9XG5cbiAgYXN5bmMgb25PcGVuKCkgeyB0aGlzLnJlbmRlcigpOyB9XG5cbiAgbG9hZFRhc2sodGFzazogQ2hyb25pY2xlVGFzaykge1xuICAgIHRoaXMuZWRpdGluZ1Rhc2sgPSB0YXNrO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb250YWluZXIuZW1wdHkoKTtcbiAgICBjb250YWluZXIuYWRkQ2xhc3MoXCJjaHJvbmljbGUtZm9ybS1wYWdlXCIpO1xuXG4gICAgY29uc3QgdCA9IHRoaXMuZWRpdGluZ1Rhc2s7XG4gICAgY29uc3QgY2FsZW5kYXJzID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjZi1oZWFkZXJcIik7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdFwiLCB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZi1oZWFkZXItdGl0bGVcIikuc2V0VGV4dCh0ID8gXCJFZGl0IHRhc2tcIiA6IFwiTmV3IHRhc2tcIik7XG4gICAgY29uc3Qgc2F2ZUJ0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tcHJpbWFyeVwiLCB0ZXh0OiB0ID8gXCJTYXZlXCIgOiBcIkFkZFwiIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEZvcm0gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgZm9ybSA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjZi1mb3JtXCIpO1xuXG4gICAgLy8gVGl0bGVcbiAgICBjb25zdCB0aXRsZUZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIlRpdGxlXCIpO1xuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aXRsZUZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICBjbHM6IFwiY2YtaW5wdXQgY2YtdGl0bGUtaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIlRhc2sgbmFtZVwiLFxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSB0Py50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIFN0YXR1cyArIFByaW9yaXR5IChzaWRlIGJ5IHNpZGUpXG4gICAgY29uc3Qgcm93MSA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuXG4gICAgY29uc3Qgc3RhdHVzRmllbGQgPSB0aGlzLmZpZWxkKHJvdzEsIFwiU3RhdHVzXCIpO1xuICAgIGNvbnN0IHN0YXR1c1NlbGVjdCA9IHN0YXR1c0ZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHN0YXR1c2VzOiB7IHZhbHVlOiBUYXNrU3RhdHVzOyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwidG9kb1wiLCAgICAgICAgbGFiZWw6IFwiVG8gZG9cIiB9LFxuICAgICAgeyB2YWx1ZTogXCJpbi1wcm9ncmVzc1wiLCBsYWJlbDogXCJJbiBwcm9ncmVzc1wiIH0sXG4gICAgICB7IHZhbHVlOiBcImRvbmVcIiwgICAgICAgIGxhYmVsOiBcIkRvbmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJjYW5jZWxsZWRcIiwgICBsYWJlbDogXCJDYW5jZWxsZWRcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCBzIG9mIHN0YXR1c2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSBzdGF0dXNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogcy52YWx1ZSwgdGV4dDogcy5sYWJlbCB9KTtcbiAgICAgIGlmICh0Py5zdGF0dXMgPT09IHMudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgcHJpb3JpdHlGaWVsZCA9IHRoaXMuZmllbGQocm93MSwgXCJQcmlvcml0eVwiKTtcbiAgICBjb25zdCBwcmlvcml0eVNlbGVjdCA9IHByaW9yaXR5RmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcHJpb3JpdGllczogeyB2YWx1ZTogVGFza1ByaW9yaXR5OyBsYWJlbDogc3RyaW5nOyBjb2xvcjogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwibm9uZVwiLCAgIGxhYmVsOiBcIk5vbmVcIiwgICBjb2xvcjogXCJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJsb3dcIiwgICAgbGFiZWw6IFwiTG93XCIsICAgIGNvbG9yOiBcIiMzNEM3NTlcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJtZWRpdW1cIiwgbGFiZWw6IFwiTWVkaXVtXCIsIGNvbG9yOiBcIiNGRjk1MDBcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJoaWdoXCIsICAgbGFiZWw6IFwiSGlnaFwiLCAgIGNvbG9yOiBcIiNGRjNCMzBcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCBwIG9mIHByaW9yaXRpZXMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IHByaW9yaXR5U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHAudmFsdWUsIHRleHQ6IHAubGFiZWwgfSk7XG4gICAgICBpZiAodD8ucHJpb3JpdHkgPT09IHAudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gRHVlIGRhdGUgKyB0aW1lIChzaWRlIGJ5IHNpZGUpXG4gICAgY29uc3Qgcm93MiA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuXG4gICAgY29uc3QgZHVlRGF0ZUZpZWxkID0gdGhpcy5maWVsZChyb3cyLCBcIkRhdGVcIik7XG4gICAgY29uc3QgZHVlRGF0ZUlucHV0ID0gZHVlRGF0ZUZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJkYXRlXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgZHVlRGF0ZUlucHV0LnZhbHVlID0gdD8uZHVlRGF0ZSA/PyBcIlwiO1xuXG4gICAgY29uc3QgZHVlVGltZUZpZWxkID0gdGhpcy5maWVsZChyb3cyLCBcIlRpbWVcIik7XG4gICAgY29uc3QgZHVlVGltZUlucHV0ID0gZHVlVGltZUZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0aW1lXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgZHVlVGltZUlucHV0LnZhbHVlID0gdD8uZHVlVGltZSA/PyBcIlwiO1xuXG4gICAgLy8gQ2FsZW5kYXJcbiAgICBjb25zdCBjYWxGaWVsZCA9IHRoaXMuZmllbGQoZm9ybSwgXCJDYWxlbmRhclwiKTtcbiAgICBjb25zdCBjYWxTZWxlY3QgPSBjYWxGaWVsZC5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogXCJcIiwgdGV4dDogXCJOb25lXCIgfSk7XG4gICAgZm9yIChjb25zdCBjYWwgb2YgY2FsZW5kYXJzKSB7XG4gICAgICBjb25zdCBvcHQgPSBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogY2FsLmlkLCB0ZXh0OiBjYWwubmFtZSB9KTtcbiAgICAgIGlmICh0Py5jYWxlbmRhcklkID09PSBjYWwuaWQpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIGNhbGVuZGFyIHNlbGVjdCBkb3QgY29sb3JcbiAgICBjb25zdCB1cGRhdGVDYWxDb2xvciA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNhbCA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoY2FsU2VsZWN0LnZhbHVlKTtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0Q29sb3IgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCJ0cmFuc3BhcmVudFwiO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRXaWR0aCA9IFwiNHB4XCI7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdFN0eWxlID0gXCJzb2xpZFwiO1xuICAgIH07XG4gICAgY2FsU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdXBkYXRlQ2FsQ29sb3IpO1xuICAgIHVwZGF0ZUNhbENvbG9yKCk7XG5cbiAgICAvLyBSZWN1cnJlbmNlXG4gICAgY29uc3QgcmVjRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiUmVwZWF0XCIpO1xuICAgIGNvbnN0IHJlY1NlbGVjdCA9IHJlY0ZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHJlY3VycmVuY2VzID0gW1xuICAgICAgeyB2YWx1ZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJOZXZlclwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9REFJTFlcIiwgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IGRheVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZXCIsICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IHdlZWtcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPU1PTlRITFlcIiwgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSBtb250aFwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9WUVBUkxZXCIsICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IHllYXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWTtCWURBWT1NTyxUVSxXRSxUSCxGUlwiLCBsYWJlbDogXCJXZWVrZGF5c1wiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IHIgb2YgcmVjdXJyZW5jZXMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IHJlY1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiByLnZhbHVlLCB0ZXh0OiByLmxhYmVsIH0pO1xuICAgICAgaWYgKHQ/LnJlY3VycmVuY2UgPT09IHIudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gVGltZSBlc3RpbWF0ZVxuICAgIGNvbnN0IGVzdGltYXRlRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGltZSBlc3RpbWF0ZVwiKTtcbiAgICBjb25zdCBlc3RpbWF0ZVdyYXAgPSBlc3RpbWF0ZUZpZWxkLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcbiAgICBjb25zdCBlc3RpbWF0ZUlucHV0ID0gZXN0aW1hdGVXcmFwLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJudW1iZXJcIiwgY2xzOiBcImNmLWlucHV0IGNmLWlucHV0LXNtXCIsIHBsYWNlaG9sZGVyOiBcIjBcIlxuICAgIH0pO1xuICAgIGVzdGltYXRlSW5wdXQudmFsdWUgPSB0Py50aW1lRXN0aW1hdGUgPyBTdHJpbmcodC50aW1lRXN0aW1hdGUpIDogXCJcIjtcbiAgICBlc3RpbWF0ZUlucHV0Lm1pbiA9IFwiMFwiO1xuICAgIGVzdGltYXRlV3JhcC5jcmVhdGVTcGFuKHsgY2xzOiBcImNmLXVuaXRcIiwgdGV4dDogXCJtaW51dGVzXCIgfSk7XG5cbiAgICAvLyBUYWdzXG4gICAgY29uc3QgdGFnc0ZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIlRhZ3NcIik7XG4gICAgY29uc3QgdGFnc0lucHV0ID0gdGFnc0ZpZWxkLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwid29yaywgcGVyc29uYWwsIHVyZ2VudCAgKGNvbW1hIHNlcGFyYXRlZClcIlxuICAgIH0pO1xuICAgIHRhZ3NJbnB1dC52YWx1ZSA9IHQ/LnRhZ3Muam9pbihcIiwgXCIpID8/IFwiXCI7XG5cbiAgICAvLyBDb250ZXh0c1xuICAgIGNvbnN0IGNvbnRleHRzRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQ29udGV4dHNcIik7XG4gICAgY29uc3QgY29udGV4dHNJbnB1dCA9IGNvbnRleHRzRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJAaG9tZSwgQHdvcmsgIChjb21tYSBzZXBhcmF0ZWQpXCJcbiAgICB9KTtcbiAgICBjb250ZXh0c0lucHV0LnZhbHVlID0gdD8uY29udGV4dHMuam9pbihcIiwgXCIpID8/IFwiXCI7XG5cbiAgICAvLyBMaW5rZWQgbm90ZXNcbiAgICBjb25zdCBsaW5rZWRGaWVsZCA9IHRoaXMuZmllbGQoZm9ybSwgXCJMaW5rZWQgbm90ZXNcIik7XG4gICAgY29uc3QgbGlua2VkSW5wdXQgPSBsaW5rZWRGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIlByb2plY3RzL1dlYnNpdGUsIEpvdXJuYWwvMjAyNCAgKGNvbW1hIHNlcGFyYXRlZClcIlxuICAgIH0pO1xuICAgIGxpbmtlZElucHV0LnZhbHVlID0gdD8ubGlua2VkTm90ZXMuam9pbihcIiwgXCIpID8/IFwiXCI7XG5cbiAgICAvLyBDdXN0b20gZmllbGRzXG4gICAgY29uc3QgY3VzdG9tU2VjdGlvbiA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytc2VjdGlvblwiKTtcbiAgICBjdXN0b21TZWN0aW9uLmNyZWF0ZURpdihcImNmLXNlY3Rpb24tbGFiZWxcIikuc2V0VGV4dChcIkN1c3RvbSBmaWVsZHNcIik7XG4gICAgY29uc3QgY3VzdG9tTGlzdCA9IGN1c3RvbVNlY3Rpb24uY3JlYXRlRGl2KFwiY2YtY3VzdG9tLWxpc3RcIik7XG4gICAgY29uc3QgY3VzdG9tRmllbGRzOiB7IGtleTogc3RyaW5nOyB2YWx1ZTogc3RyaW5nIH1bXSA9IFtcbiAgICAgIC4uLih0Py5jdXN0b21GaWVsZHMubWFwKGYgPT4gKHsga2V5OiBmLmtleSwgdmFsdWU6IFN0cmluZyhmLnZhbHVlKSB9KSkgPz8gW10pXG4gICAgXTtcblxuICAgIGNvbnN0IHJlbmRlckN1c3RvbUZpZWxkcyA9ICgpID0+IHtcbiAgICAgIGN1c3RvbUxpc3QuZW1wdHkoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY3VzdG9tRmllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNmID0gY3VzdG9tRmllbGRzW2ldO1xuICAgICAgICBjb25zdCBjZlJvdyA9IGN1c3RvbUxpc3QuY3JlYXRlRGl2KFwiY2YtY3VzdG9tLXJvd1wiKTtcbiAgICAgICAgY29uc3Qga2V5SW5wdXQgPSBjZlJvdy5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLWN1c3RvbS1rZXlcIiwgcGxhY2Vob2xkZXI6IFwiRmllbGQgbmFtZVwiXG4gICAgICAgIH0pO1xuICAgICAgICBrZXlJbnB1dC52YWx1ZSA9IGNmLmtleTtcbiAgICAgICAga2V5SW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHsgY3VzdG9tRmllbGRzW2ldLmtleSA9IGtleUlucHV0LnZhbHVlOyB9KTtcblxuICAgICAgICBjb25zdCB2YWxJbnB1dCA9IGNmUm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXQgY2YtY3VzdG9tLXZhbFwiLCBwbGFjZWhvbGRlcjogXCJWYWx1ZVwiXG4gICAgICAgIH0pO1xuICAgICAgICB2YWxJbnB1dC52YWx1ZSA9IGNmLnZhbHVlO1xuICAgICAgICB2YWxJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4geyBjdXN0b21GaWVsZHNbaV0udmFsdWUgPSB2YWxJbnB1dC52YWx1ZTsgfSk7XG5cbiAgICAgICAgY29uc3QgcmVtb3ZlQnRuID0gY2ZSb3cuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWljb25cIiwgdGV4dDogXCJcdTAwRDdcIiB9KTtcbiAgICAgICAgcmVtb3ZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgY3VzdG9tRmllbGRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICByZW5kZXJDdXN0b21GaWVsZHMoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGFkZENmQnRuID0gY3VzdG9tTGlzdC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogXCJjZi1idG4tZ2hvc3QgY2YtYWRkLWZpZWxkXCIsIHRleHQ6IFwiKyBBZGQgZmllbGRcIlxuICAgICAgfSk7XG4gICAgICBhZGRDZkJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICBjdXN0b21GaWVsZHMucHVzaCh7IGtleTogXCJcIiwgdmFsdWU6IFwiXCIgfSk7XG4gICAgICAgIHJlbmRlckN1c3RvbUZpZWxkcygpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICByZW5kZXJDdXN0b21GaWVsZHMoKTtcblxuICAgIC8vIEFsZXJ0XG4gICAgY29uc3QgYWxlcnRGaWVsZCAgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQWxlcnRcIik7XG4gICAgY29uc3QgYWxlcnRTZWxlY3QgPSBhbGVydEZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IGZvcm1BbGVydHM6IHsgdmFsdWU6IEFsZXJ0T2Zmc2V0OyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwibm9uZVwiLCAgICBsYWJlbDogXCJOb25lXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiYXQtdGltZVwiLCBsYWJlbDogXCJBdCB0aW1lIG9mIHRhc2tcIiB9LFxuICAgICAgeyB2YWx1ZTogXCI1bWluXCIsICAgIGxhYmVsOiBcIjUgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxMG1pblwiLCAgIGxhYmVsOiBcIjEwIG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMTVtaW5cIiwgICBsYWJlbDogXCIxNSBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjMwbWluXCIsICAgbGFiZWw6IFwiMzAgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxaG91clwiLCAgIGxhYmVsOiBcIjEgaG91ciBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIyaG91cnNcIiwgIGxhYmVsOiBcIjIgaG91cnMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMWRheVwiLCAgICBsYWJlbDogXCIxIGRheSBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIyZGF5c1wiLCAgIGxhYmVsOiBcIjIgZGF5cyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxd2Vla1wiLCAgIGxhYmVsOiBcIjEgd2VlayBiZWZvcmVcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCBhIG9mIGZvcm1BbGVydHMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGFsZXJ0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGEudmFsdWUsIHRleHQ6IGEubGFiZWwgfSk7XG4gICAgICBpZiAodD8uYWxlcnQgPT09IGEudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gTm90ZXNcbiAgICBjb25zdCBub3Rlc0ZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIk5vdGVzXCIpO1xuICAgIGNvbnN0IG5vdGVzSW5wdXQgPSBub3Rlc0ZpZWxkLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImNmLXRleHRhcmVhXCIsIHBsYWNlaG9sZGVyOiBcIkFkZCBub3Rlcy4uLlwiXG4gICAgfSk7XG4gICAgbm90ZXNJbnB1dC52YWx1ZSA9IHQ/Lm5vdGVzID8/IFwiXCI7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQWN0aW9ucyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVEFTS19GT1JNX1ZJRVdfVFlQRSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSB0aXRsZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHsgdGl0bGVJbnB1dC5mb2N1cygpOyB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTsgcmV0dXJuOyB9XG5cbiAgLy8gQ2hlY2sgZm9yIGR1cGxpY2F0ZSB0aXRsZVxuICAgICAgaWYgKCF0aGlzLmVkaXRpbmdUYXNrKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRBbGwoKTtcbiAgICAgICAgY29uc3QgZHVwbGljYXRlID0gZXhpc3RpbmcuZmluZChcbiAgICAgICAgICB0ID0+IHQudGl0bGUudG9Mb3dlckNhc2UoKSA9PT0gdGl0bGUudG9Mb3dlckNhc2UoKVxuICAgICAgICApO1xuICAgICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShgQSB0YXNrIG5hbWVkIFwiJHt0aXRsZX1cIiBhbHJlYWR5IGV4aXN0cy5gLCA0MDAwKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRhc2tEYXRhID0ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgc3RhdHVzOiAgICAgICAgc3RhdHVzU2VsZWN0LnZhbHVlIGFzIFRhc2tTdGF0dXMsXG4gICAgICAgIHByaW9yaXR5OiAgICAgIHByaW9yaXR5U2VsZWN0LnZhbHVlIGFzIFRhc2tQcmlvcml0eSxcbiAgICAgICAgZHVlRGF0ZTogICAgICAgZHVlRGF0ZUlucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgZHVlVGltZTogICAgICAgZHVlVGltZUlucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsZW5kYXJJZDogICAgY2FsU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgcmVjdXJyZW5jZTogICAgcmVjU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgdGltZUVzdGltYXRlOiAgZXN0aW1hdGVJbnB1dC52YWx1ZSA/IHBhcnNlSW50KGVzdGltYXRlSW5wdXQudmFsdWUpIDogdW5kZWZpbmVkLFxuICAgICAgICB0YWdzOiAgICAgICAgICB0YWdzSW5wdXQudmFsdWUgPyB0YWdzSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiBbXSxcbiAgICAgICAgY29udGV4dHM6ICAgICAgY29udGV4dHNJbnB1dC52YWx1ZSA/IGNvbnRleHRzSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiBbXSxcbiAgICAgICAgbGlua2VkTm90ZXM6ICAgbGlua2VkSW5wdXQudmFsdWUgPyBsaW5rZWRJbnB1dC52YWx1ZS5zcGxpdChcIixcIikubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKSA6IFtdLFxuICAgICAgICBwcm9qZWN0czogICAgICB0Py5wcm9qZWN0cyA/PyBbXSxcbiAgICAgICAgdGltZUVudHJpZXM6ICAgdD8udGltZUVudHJpZXMgPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogdD8uY29tcGxldGVkSW5zdGFuY2VzID8/IFtdLFxuICAgICAgICBjdXN0b21GaWVsZHM6ICBjdXN0b21GaWVsZHMuZmlsdGVyKGYgPT4gZi5rZXkpLm1hcChmID0+ICh7IGtleTogZi5rZXksIHZhbHVlOiBmLnZhbHVlIH0pKSxcbiAgICAgICAgYWxlcnQ6ICAgICAgICAgYWxlcnRTZWxlY3QudmFsdWUgYXMgQWxlcnRPZmZzZXQsXG4gICAgICAgIG5vdGVzOiAgICAgICAgIG5vdGVzSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgfTtcblxuICAgICAgaWYgKHQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci51cGRhdGUoeyAuLi50LCAuLi50YXNrRGF0YSB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIuY3JlYXRlKHRhc2tEYXRhKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5vblNhdmU/LigpO1xuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShUQVNLX0ZPUk1fVklFV19UWVBFKTtcbiAgICB9O1xuXG4gICAgc2F2ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGFuZGxlU2F2ZSk7XG5cbiAgICAvLyBUYWIgdGhyb3VnaCBmaWVsZHMgbmF0dXJhbGx5LCBFbnRlciBvbiB0aXRsZSBzYXZlc1xuICAgIHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGUpID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiKSBoYW5kbGVTYXZlKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGZpZWxkKHBhcmVudDogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3Qgd3JhcCA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZi1maWVsZFwiKTtcbiAgICB3cmFwLmNyZWF0ZURpdihcImNmLWxhYmVsXCIpLnNldFRleHQobGFiZWwpO1xuICAgIHJldHVybiB3cmFwO1xuICB9XG59IiwgImltcG9ydCB7IEV2ZW50Rm9ybVZpZXcsIEVWRU5UX0ZPUk1fVklFV19UWVBFIH0gZnJvbSBcIi4vRXZlbnRGb3JtVmlld1wiO1xuaW1wb3J0IHsgQ2hyb25pY2xlRXZlbnQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBFdmVudE1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9FdmVudE1hbmFnZXJcIjtcbmltcG9ydCB7IFRhc2tNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvVGFza01hbmFnZXJcIjtcbmltcG9ydCB7IENhbGVuZGFyTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0NhbGVuZGFyTWFuYWdlclwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlRXZlbnQsIENocm9uaWNsZVRhc2sgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IEV2ZW50TW9kYWwgfSBmcm9tIFwiLi4vdWkvRXZlbnRNb2RhbFwiO1xuXG5leHBvcnQgY29uc3QgQ0FMRU5EQVJfVklFV19UWVBFID0gXCJjaHJvbmljbGUtY2FsZW5kYXItdmlld1wiO1xudHlwZSBDYWxlbmRhck1vZGUgPSBcImRheVwiIHwgXCJ3ZWVrXCIgfCBcIm1vbnRoXCIgfCBcInllYXJcIjtcblxuY29uc3QgSE9VUl9IRUlHSFQgPSA1NjtcblxuZXhwb3J0IGNsYXNzIENhbGVuZGFyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBldmVudE1hbmFnZXI6ICAgIEV2ZW50TWFuYWdlcjtcbiAgcHJpdmF0ZSB0YXNrTWFuYWdlcjogICAgIFRhc2tNYW5hZ2VyO1xuICBwcml2YXRlIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICBwcml2YXRlIGN1cnJlbnREYXRlOiBEYXRlICAgICAgICAgPSBuZXcgRGF0ZSgpO1xuICBwcml2YXRlIG1vZGU6ICAgICAgICBDYWxlbmRhck1vZGUgPSBcIndlZWtcIjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBsZWFmOiBXb3Jrc3BhY2VMZWFmLFxuICAgIGV2ZW50TWFuYWdlcjogICAgRXZlbnRNYW5hZ2VyLFxuICAgIHRhc2tNYW5hZ2VyOiAgICAgVGFza01hbmFnZXIsXG4gICAgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXJcbiAgKSB7XG4gICAgc3VwZXIobGVhZik7XG4gICAgdGhpcy5ldmVudE1hbmFnZXIgICAgPSBldmVudE1hbmFnZXI7XG4gICAgdGhpcy50YXNrTWFuYWdlciAgICAgPSB0YXNrTWFuYWdlcjtcbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IGNhbGVuZGFyTWFuYWdlcjtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6ICAgIHN0cmluZyB7IHJldHVybiBDQUxFTkRBUl9WSUVXX1RZUEU7IH1cbiAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHsgcmV0dXJuIFwiQ2hyb25pY2xlIENhbGVuZGFyXCI7IH1cbiAgZ2V0SWNvbigpOiAgICAgICAgc3RyaW5nIHsgcmV0dXJuIFwiY2FsZW5kYXJcIjsgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHtcbiAgICBhd2FpdCB0aGlzLnJlbmRlcigpO1xuXG4gICAgLy8gU2FtZSBwZXJtYW5lbnQgZml4IGFzIHRhc2sgZGFzaGJvYXJkIFx1MjAxNCBtZXRhZGF0YUNhY2hlIGZpcmVzIGFmdGVyXG4gICAgLy8gZnJvbnRtYXR0ZXIgaXMgZnVsbHkgcGFyc2VkLCBzbyBkYXRhIGlzIGZyZXNoIHdoZW4gd2UgcmUtcmVuZGVyXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5vbihcImNoYW5nZWRcIiwgKGZpbGUpID0+IHtcbiAgICAgICAgY29uc3QgaW5FdmVudHMgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLmV2ZW50TWFuYWdlcltcImV2ZW50c0ZvbGRlclwiXSk7XG4gICAgICAgIGNvbnN0IGluVGFza3MgID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKTtcbiAgICAgICAgaWYgKGluRXZlbnRzIHx8IGluVGFza3MpIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAudmF1bHQub24oXCJjcmVhdGVcIiwgKGZpbGUpID0+IHtcbiAgICAgICAgY29uc3QgaW5FdmVudHMgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLmV2ZW50TWFuYWdlcltcImV2ZW50c0ZvbGRlclwiXSk7XG4gICAgICAgIGNvbnN0IGluVGFza3MgID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKTtcbiAgICAgICAgaWYgKGluRXZlbnRzIHx8IGluVGFza3MpIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5yZW5kZXIoKSwgMjAwKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC52YXVsdC5vbihcImRlbGV0ZVwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBjb25zdCBpbkV2ZW50cyA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMuZXZlbnRNYW5hZ2VyW1wiZXZlbnRzRm9sZGVyXCJdKTtcbiAgICAgICAgY29uc3QgaW5UYXNrcyAgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLnRhc2tNYW5hZ2VyW1widGFza3NGb2xkZXJcIl0pO1xuICAgICAgICBpZiAoaW5FdmVudHMgfHwgaW5UYXNrcykgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHJlbmRlcigpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuICAgIGNvbnRhaW5lci5hZGRDbGFzcyhcImNocm9uaWNsZS1jYWwtYXBwXCIpO1xuXG4gICAgY29uc3QgdGFza3MgID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRBbGwoKTtcblxuICAgIC8vIEdldCBkYXRlIHJhbmdlIGZvciBjdXJyZW50IHZpZXcgc28gcmVjdXJyZW5jZSBleHBhbnNpb24gaXMgc2NvcGVkXG4gICAgY29uc3QgcmFuZ2VTdGFydCA9IHRoaXMuZ2V0UmFuZ2VTdGFydCgpO1xuICAgIGNvbnN0IHJhbmdlRW5kICAgPSB0aGlzLmdldFJhbmdlRW5kKCk7XG4gICAgY29uc3QgZXZlbnRzICAgICA9IGF3YWl0IHRoaXMuZXZlbnRNYW5hZ2VyLmdldEluUmFuZ2VXaXRoUmVjdXJyZW5jZShyYW5nZVN0YXJ0LCByYW5nZUVuZCk7XG5cbiAgICBjb25zdCBsYXlvdXQgID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1jYWwtbGF5b3V0XCIpO1xuICAgIGNvbnN0IHNpZGViYXIgPSBsYXlvdXQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC1zaWRlYmFyXCIpO1xuICAgIGNvbnN0IG1haW4gICAgPSBsYXlvdXQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC1tYWluXCIpO1xuXG4gICAgdGhpcy5yZW5kZXJTaWRlYmFyKHNpZGViYXIpO1xuICAgIHRoaXMucmVuZGVyVG9vbGJhcihtYWluKTtcblxuICAgIGlmICAgICAgKHRoaXMubW9kZSA9PT0gXCJ5ZWFyXCIpICB0aGlzLnJlbmRlclllYXJWaWV3KG1haW4sIGV2ZW50cywgdGFza3MpO1xuICAgIGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gXCJtb250aFwiKSB0aGlzLnJlbmRlck1vbnRoVmlldyhtYWluLCBldmVudHMsIHRhc2tzKTtcbiAgICBlbHNlIGlmICh0aGlzLm1vZGUgPT09IFwid2Vla1wiKSAgdGhpcy5yZW5kZXJXZWVrVmlldyhtYWluLCBldmVudHMsIHRhc2tzKTtcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyRGF5VmlldyhtYWluLCBldmVudHMsIHRhc2tzKTtcbiAgfVxuXG5wcml2YXRlIGFzeW5jIG9wZW5FdmVudEZ1bGxQYWdlKGV2ZW50PzogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEVWRU5UX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBpZiAoZXhpc3RpbmcpIGV4aXN0aW5nLmRldGFjaCgpO1xuICAgIGNvbnN0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IEVWRU5UX0ZPUk1fVklFV19UWVBFLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7XG4gICAgY29uc3QgZm9ybUxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEVWRU5UX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBjb25zdCBmb3JtVmlldyA9IGZvcm1MZWFmPy52aWV3IGFzIEV2ZW50Rm9ybVZpZXcgfCB1bmRlZmluZWQ7XG4gICAgaWYgKGZvcm1WaWV3ICYmIGV2ZW50KSBmb3JtVmlldy5sb2FkRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNpZGViYXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbnByaXZhdGUgZ2V0UmFuZ2VTdGFydCgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwiZGF5XCIpIHJldHVybiB0aGlzLmN1cnJlbnREYXRlLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwid2Vla1wiKSB7XG4gICAgICBjb25zdCBzID0gdGhpcy5nZXRXZWVrU3RhcnQoKTtcbiAgICAgIHJldHVybiBzLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb2RlID09PSBcInllYXJcIikgcmV0dXJuIGAke3RoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKX0tMDEtMDFgO1xuICAgIC8vIG1vbnRoXG4gICAgY29uc3QgeSA9IHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBtID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRNb250aCgpO1xuICAgIHJldHVybiBgJHt5fS0ke1N0cmluZyhtKzEpLnBhZFN0YXJ0KDIsXCIwXCIpfS0wMWA7XG4gIH1cblxuICBwcml2YXRlIGdldFJhbmdlRW5kKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJkYXlcIikgcmV0dXJuIHRoaXMuY3VycmVudERhdGUudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJ3ZWVrXCIpIHtcbiAgICAgIGNvbnN0IHMgPSB0aGlzLmdldFdlZWtTdGFydCgpO1xuICAgICAgY29uc3QgZSA9IG5ldyBEYXRlKHMpOyBlLnNldERhdGUoZS5nZXREYXRlKCkgKyA2KTtcbiAgICAgIHJldHVybiBlLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb2RlID09PSBcInllYXJcIikgcmV0dXJuIGAke3RoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKX0tMTItMzFgO1xuICAgIC8vIG1vbnRoXG4gICAgY29uc3QgeSA9IHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBtID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRNb250aCgpO1xuICAgIHJldHVybiBuZXcgRGF0ZSh5LCBtICsgMSwgMCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclNpZGViYXIoc2lkZWJhcjogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBuZXdFdmVudEJ0biA9IHNpZGViYXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImNocm9uaWNsZS1uZXctdGFzay1idG5cIiwgdGV4dDogXCJOZXcgZXZlbnRcIlxuICAgIH0pO1xuICAgIG5ld0V2ZW50QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBuZXcgRXZlbnRNb2RhbChcbiAgICAgICAgdGhpcy5hcHAsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlcixcbiAgICAgICAgdW5kZWZpbmVkLCAoKSA9PiB0aGlzLnJlbmRlcigpLCAoZSkgPT4gdGhpcy5vcGVuRXZlbnRGdWxsUGFnZShlKVxuICAgICAgKS5vcGVuKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlck1pbmlDYWxlbmRhcihzaWRlYmFyKTtcblxuICAgIGNvbnN0IGNhbFNlY3Rpb24gPSBzaWRlYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0cy1zZWN0aW9uXCIpO1xuICAgIGNhbFNlY3Rpb24uY3JlYXRlRGl2KFwiY2hyb25pY2xlLXNlY3Rpb24tbGFiZWxcIikuc2V0VGV4dChcIk15IENhbGVuZGFyc1wiKTtcblxuICAgIGZvciAoY29uc3QgY2FsIG9mIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpKSB7XG4gICAgICBjb25zdCByb3cgICAgPSBjYWxTZWN0aW9uLmNyZWF0ZURpdihcImNocm9uaWNsZS1jYWwtbGlzdC1yb3dcIik7XG4gICAgICBjb25zdCB0b2dnbGUgPSByb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiwgY2xzOiBcImNocm9uaWNsZS1jYWwtdG9nZ2xlXCIgfSk7XG4gICAgICB0b2dnbGUuY2hlY2tlZCA9IGNhbC5pc1Zpc2libGU7XG4gICAgICB0b2dnbGUuc3R5bGUuYWNjZW50Q29sb3IgPSBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpO1xuICAgICAgdG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmNhbGVuZGFyTWFuYWdlci50b2dnbGVWaXNpYmlsaXR5KGNhbC5pZCk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRvdCA9IHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1kb3RcIik7XG4gICAgICBkb3Quc3R5bGUuYmFja2dyb3VuZENvbG9yID0gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKTtcbiAgICAgIHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1uYW1lXCIpLnNldFRleHQoY2FsLm5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTWluaUNhbGVuZGFyKHBhcmVudDogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBtaW5pICAgPSBwYXJlbnQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktY2FsXCIpO1xuICAgIGNvbnN0IGhlYWRlciA9IG1pbmkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktY2FsLWhlYWRlclwiKTtcblxuICAgIGNvbnN0IHByZXZCdG4gICAgPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2hyb25pY2xlLW1pbmktbmF2XCIsIHRleHQ6IFwiXHUyMDM5XCIgfSk7XG4gICAgY29uc3QgbW9udGhMYWJlbCA9IGhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1tb250aC1sYWJlbFwiKTtcbiAgICBjb25zdCBuZXh0QnRuICAgID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNocm9uaWNsZS1taW5pLW5hdlwiLCB0ZXh0OiBcIlx1MjAzQVwiIH0pO1xuXG4gICAgY29uc3QgeWVhciAgPSB0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgY29uc3QgbW9udGggPSB0aGlzLmN1cnJlbnREYXRlLmdldE1vbnRoKCk7XG4gICAgbW9udGhMYWJlbC5zZXRUZXh0KFxuICAgICAgbmV3IERhdGUoeWVhciwgbW9udGgpLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgbW9udGg6IFwibG9uZ1wiLCB5ZWFyOiBcIm51bWVyaWNcIiB9KVxuICAgICk7XG5cbiAgICBwcmV2QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmN1cnJlbnREYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGggLSAxLCAxKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG4gICAgbmV4dEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jdXJyZW50RGF0ZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoICsgMSwgMSk7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgZ3JpZCAgICAgICAgPSBtaW5pLmNyZWF0ZURpdihcImNocm9uaWNsZS1taW5pLWdyaWRcIik7XG4gICAgY29uc3QgZmlyc3REYXkgICAgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgMSkuZ2V0RGF5KCk7XG4gICAgY29uc3QgZGF5c0luTW9udGggPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCArIDEsIDApLmdldERhdGUoKTtcbiAgICBjb25zdCB0b2RheVN0ciAgICA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBmb3IgKGNvbnN0IGQgb2YgW1wiU1wiLFwiTVwiLFwiVFwiLFwiV1wiLFwiVFwiLFwiRlwiLFwiU1wiXSlcbiAgICAgIGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktZGF5LW5hbWVcIikuc2V0VGV4dChkKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlyc3REYXk7IGkrKylcbiAgICAgIGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktZGF5IGNocm9uaWNsZS1taW5pLWRheS1lbXB0eVwiKTtcblxuICAgIGZvciAobGV0IGQgPSAxOyBkIDw9IGRheXNJbk1vbnRoOyBkKyspIHtcbiAgICAgIGNvbnN0IGRhdGVTdHIgPSBgJHt5ZWFyfS0ke1N0cmluZyhtb250aCsxKS5wYWRTdGFydCgyLFwiMFwiKX0tJHtTdHJpbmcoZCkucGFkU3RhcnQoMixcIjBcIil9YDtcbiAgICAgIGNvbnN0IGRheUVsICAgPSBncmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1taW5pLWRheVwiKTtcbiAgICAgIGRheUVsLnNldFRleHQoU3RyaW5nKGQpKTtcbiAgICAgIGlmIChkYXRlU3RyID09PSB0b2RheVN0cikgZGF5RWwuYWRkQ2xhc3MoXCJ0b2RheVwiKTtcbiAgICAgIGRheUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuY3VycmVudERhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZCk7XG4gICAgICAgIHRoaXMubW9kZSA9IFwiZGF5XCI7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgVG9vbGJhciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHJlbmRlclRvb2xiYXIobWFpbjogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCB0b29sYmFyICA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC10b29sYmFyXCIpO1xuICAgIGNvbnN0IG5hdkdyb3VwID0gdG9vbGJhci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2FsLW5hdi1ncm91cFwiKTtcblxuICAgIG5hdkdyb3VwLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNocm9uaWNsZS1jYWwtbmF2LWJ0blwiLCB0ZXh0OiBcIlx1MjAzOVwiIH0pXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMubmF2aWdhdGUoLTEpKTtcbiAgICBuYXZHcm91cC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjaHJvbmljbGUtY2FsLXRvZGF5LWJ0blwiLCB0ZXh0OiBcIlRvZGF5XCIgfSlcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmN1cnJlbnREYXRlID0gbmV3IERhdGUoKTsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgbmF2R3JvdXAuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2hyb25pY2xlLWNhbC1uYXYtYnRuXCIsIHRleHQ6IFwiXHUyMDNBXCIgfSlcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZSgxKSk7XG5cbiAgICB0b29sYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS1jYWwtdG9vbGJhci10aXRsZVwiKS5zZXRUZXh0KHRoaXMuZ2V0VG9vbGJhclRpdGxlKCkpO1xuXG4gICAgY29uc3QgcGlsbHMgPSB0b29sYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS12aWV3LXBpbGxzXCIpO1xuICAgIGZvciAoY29uc3QgW20sIGxhYmVsXSBvZiBbW1wiZGF5XCIsXCJEYXlcIl0sW1wid2Vla1wiLFwiV2Vla1wiXSxbXCJtb250aFwiLFwiTW9udGhcIl0sW1wieWVhclwiLFwiWWVhclwiXV0gYXMgW0NhbGVuZGFyTW9kZSxzdHJpbmddW10pIHtcbiAgICAgIGNvbnN0IHBpbGwgPSBwaWxscy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdmlldy1waWxsXCIpO1xuICAgICAgcGlsbC5zZXRUZXh0KGxhYmVsKTtcbiAgICAgIGlmICh0aGlzLm1vZGUgPT09IG0pIHBpbGwuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICBwaWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMubW9kZSA9IG07IHRoaXMucmVuZGVyKCk7IH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbmF2aWdhdGUoZGlyOiBudW1iZXIpIHtcbiAgICBjb25zdCBkID0gbmV3IERhdGUodGhpcy5jdXJyZW50RGF0ZSk7XG4gICAgaWYgICAgICAodGhpcy5tb2RlID09PSBcImRheVwiKSAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgZGlyKTtcbiAgICBlbHNlIGlmICh0aGlzLm1vZGUgPT09IFwid2Vla1wiKSBkLnNldERhdGUoZC5nZXREYXRlKCkgKyBkaXIgKiA3KTtcbiAgICBlbHNlIGlmICh0aGlzLm1vZGUgPT09IFwieWVhclwiKSBkLnNldEZ1bGxZZWFyKGQuZ2V0RnVsbFllYXIoKSArIGRpcik7XG4gICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgIGQuc2V0TW9udGgoZC5nZXRNb250aCgpICsgZGlyKTtcbiAgICB0aGlzLmN1cnJlbnREYXRlID0gZDtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRUb29sYmFyVGl0bGUoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcInllYXJcIikgIHJldHVybiBTdHJpbmcodGhpcy5jdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpKTtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcIm1vbnRoXCIpIHJldHVybiB0aGlzLmN1cnJlbnREYXRlLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgbW9udGg6IFwibG9uZ1wiLCB5ZWFyOiBcIm51bWVyaWNcIiB9KTtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcImRheVwiKSAgIHJldHVybiB0aGlzLmN1cnJlbnREYXRlLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgd2Vla2RheTogXCJsb25nXCIsIG1vbnRoOiBcImxvbmdcIiwgZGF5OiBcIm51bWVyaWNcIiwgeWVhcjogXCJudW1lcmljXCIgfSk7XG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLmdldFdlZWtTdGFydCgpO1xuICAgIGNvbnN0IGVuZCAgID0gbmV3IERhdGUoc3RhcnQpOyBlbmQuc2V0RGF0ZShlbmQuZ2V0RGF0ZSgpICsgNik7XG4gICAgcmV0dXJuIGAke3N0YXJ0LnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIseyBtb250aDpcInNob3J0XCIsIGRheTpcIm51bWVyaWNcIiB9KX0gXHUyMDEzICR7ZW5kLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIseyBtb250aDpcInNob3J0XCIsIGRheTpcIm51bWVyaWNcIiwgeWVhcjpcIm51bWVyaWNcIiB9KX1gO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRXZWVrU3RhcnQoKTogRGF0ZSB7XG4gICAgY29uc3QgZCA9IG5ldyBEYXRlKHRoaXMuY3VycmVudERhdGUpO1xuICAgIGQuc2V0RGF0ZShkLmdldERhdGUoKSAtIGQuZ2V0RGF5KCkpO1xuICAgIHJldHVybiBkO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFllYXIgdmlldyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHJlbmRlclllYXJWaWV3KG1haW46IEhUTUxFbGVtZW50LCBldmVudHM6IENocm9uaWNsZUV2ZW50W10sIHRhc2tzOiBDaHJvbmljbGVUYXNrW10pIHtcbiAgICBjb25zdCB5ZWFyICAgICA9IHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCB0b2RheVN0ciA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgeWVhckdyaWQgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLWdyaWRcIik7XG5cbiAgICBmb3IgKGxldCBtID0gMDsgbSA8IDEyOyBtKyspIHtcbiAgICAgIGNvbnN0IGNhcmQgPSB5ZWFyR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1tb250aC1jYXJkXCIpO1xuICAgICAgY29uc3QgbmFtZSA9IGNhcmQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXllYXItbW9udGgtbmFtZVwiKTtcbiAgICAgIG5hbWUuc2V0VGV4dChuZXcgRGF0ZSh5ZWFyLCBtKS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7IG1vbnRoOiBcImxvbmdcIiB9KSk7XG4gICAgICBuYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY3VycmVudERhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtLCAxKTsgdGhpcy5tb2RlID0gXCJtb250aFwiOyB0aGlzLnJlbmRlcigpOyB9KTtcblxuICAgICAgY29uc3QgbWluaUdyaWQgICAgPSBjYXJkLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLW1pbmktZ3JpZFwiKTtcbiAgICAgIGNvbnN0IGZpcnN0RGF5ICAgID0gbmV3IERhdGUoeWVhciwgbSwgMSkuZ2V0RGF5KCk7XG4gICAgICBjb25zdCBkYXlzSW5Nb250aCA9IG5ldyBEYXRlKHllYXIsIG0gKyAxLCAwKS5nZXREYXRlKCk7XG5cbiAgICAgIGZvciAoY29uc3QgZCBvZiBbXCJTXCIsXCJNXCIsXCJUXCIsXCJXXCIsXCJUXCIsXCJGXCIsXCJTXCJdKVxuICAgICAgICBtaW5pR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1kYXktbmFtZVwiKS5zZXRUZXh0KGQpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpcnN0RGF5OyBpKyspXG4gICAgICAgIG1pbmlHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLWRheS1lbXB0eVwiKTtcblxuICAgICAgZm9yIChsZXQgZCA9IDE7IGQgPD0gZGF5c0luTW9udGg7IGQrKykge1xuICAgICAgICBjb25zdCBkYXRlU3RyICA9IGAke3llYXJ9LSR7U3RyaW5nKG0rMSkucGFkU3RhcnQoMixcIjBcIil9LSR7U3RyaW5nKGQpLnBhZFN0YXJ0KDIsXCIwXCIpfWA7XG4gICAgICAgIGNvbnN0IGhhc0V2ZW50ID0gZXZlbnRzLnNvbWUoZSA9PiBlLnN0YXJ0RGF0ZSA9PT0gZGF0ZVN0ciAmJiB0aGlzLmlzQ2FsZW5kYXJWaXNpYmxlKGUuY2FsZW5kYXJJZCkpO1xuICAgICAgICBjb25zdCBoYXNUYXNrICA9IHRhc2tzLnNvbWUodCA9PiB0LmR1ZURhdGUgPT09IGRhdGVTdHIgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgICAgICAgY29uc3QgZGF5RWwgICAgPSBtaW5pR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1kYXlcIik7XG4gICAgICAgIGRheUVsLnNldFRleHQoU3RyaW5nKGQpKTtcbiAgICAgICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSBkYXlFbC5hZGRDbGFzcyhcInRvZGF5XCIpO1xuICAgICAgICBpZiAoaGFzRXZlbnQpIGRheUVsLmFkZENsYXNzKFwiaGFzLWV2ZW50XCIpO1xuICAgICAgICBpZiAoaGFzVGFzaykgIGRheUVsLmFkZENsYXNzKFwiaGFzLXRhc2tcIik7XG4gICAgICAgIGRheUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY3VycmVudERhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtLCBkKTsgdGhpcy5tb2RlID0gXCJkYXlcIjsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIE1vbnRoIHZpZXcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSByZW5kZXJNb250aFZpZXcobWFpbjogSFRNTEVsZW1lbnQsIGV2ZW50czogQ2hyb25pY2xlRXZlbnRbXSwgdGFza3M6IENocm9uaWNsZVRhc2tbXSkge1xuICAgIGNvbnN0IHllYXIgICAgID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpO1xuICAgIGNvbnN0IG1vbnRoICAgID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRNb250aCgpO1xuICAgIGNvbnN0IHRvZGF5U3RyID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCBncmlkICAgICA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWdyaWRcIik7XG5cbiAgICBmb3IgKGNvbnN0IGQgb2YgW1wiU3VuXCIsXCJNb25cIixcIlR1ZVwiLFwiV2VkXCIsXCJUaHVcIixcIkZyaVwiLFwiU2F0XCJdKVxuICAgICAgZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtZGF5LW5hbWVcIikuc2V0VGV4dChkKTtcblxuICAgIGNvbnN0IGZpcnN0RGF5ICAgICAgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgMSkuZ2V0RGF5KCk7XG4gICAgY29uc3QgZGF5c0luTW9udGggICA9IG5ldyBEYXRlKHllYXIsIG1vbnRoICsgMSwgMCkuZ2V0RGF0ZSgpO1xuICAgIGNvbnN0IGRheXNJblByZXZNb24gPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgMCkuZ2V0RGF0ZSgpO1xuXG4gICAgZm9yIChsZXQgaSA9IGZpcnN0RGF5IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IGNlbGwgPSBncmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1jZWxsIGNocm9uaWNsZS1tb250aC1jZWxsLW90aGVyXCIpO1xuICAgICAgY2VsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtY2VsbC1udW1cIikuc2V0VGV4dChTdHJpbmcoZGF5c0luUHJldk1vbiAtIGkpKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBkID0gMTsgZCA8PSBkYXlzSW5Nb250aDsgZCsrKSB7XG4gICAgICBjb25zdCBkYXRlU3RyID0gYCR7eWVhcn0tJHtTdHJpbmcobW9udGgrMSkucGFkU3RhcnQoMixcIjBcIil9LSR7U3RyaW5nKGQpLnBhZFN0YXJ0KDIsXCIwXCIpfWA7XG4gICAgICBjb25zdCBjZWxsICAgID0gZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtY2VsbFwiKTtcbiAgICAgIGlmIChkYXRlU3RyID09PSB0b2RheVN0cikgY2VsbC5hZGRDbGFzcyhcInRvZGF5XCIpO1xuICAgICAgY2VsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtY2VsbC1udW1cIikuc2V0VGV4dChTdHJpbmcoZCkpO1xuXG4gICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoKSA9PiB0aGlzLm9wZW5OZXdFdmVudE1vZGFsKGRhdGVTdHIsIHRydWUpKTtcbiAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5zaG93Q2FsQ29udGV4dE1lbnUoZS5jbGllbnRYLCBlLmNsaWVudFksIGRhdGVTdHIsIHRydWUpO1xuICAgICAgfSk7XG5cbiAgICAgIGV2ZW50cy5maWx0ZXIoZSA9PiBlLnN0YXJ0RGF0ZSA9PT0gZGF0ZVN0ciAmJiB0aGlzLmlzQ2FsZW5kYXJWaXNpYmxlKGUuY2FsZW5kYXJJZCkpLnNsaWNlKDAsMylcbiAgICAgICAgLmZvckVhY2goZXZlbnQgPT4ge1xuICAgICAgICAgIGNvbnN0IGNhbCAgID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChldmVudC5jYWxlbmRhcklkID8/IFwiXCIpO1xuICAgICAgICAgIGNvbnN0IGNvbG9yID0gY2FsID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSA6IFwiIzM3OEFERFwiO1xuICAgICAgICAgIGNvbnN0IHBpbGwgID0gY2VsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtZXZlbnQtcGlsbFwiKTtcbiAgICAgICAgICBwaWxsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yICsgXCIzM1wiO1xuICAgICAgICAgIHBpbGwuc3R5bGUuYm9yZGVyTGVmdCAgICAgID0gYDNweCBzb2xpZCAke2NvbG9yfWA7XG4gICAgICAgICAgcGlsbC5zdHlsZS5jb2xvciAgICAgICAgICAgPSBjb2xvcjtcbiAgICAgICAgICBwaWxsLnNldFRleHQoZXZlbnQudGl0bGUpO1xuICAgICAgICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgbmV3IEV2ZW50TW9kYWwodGhpcy5hcHAsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlciwgZXZlbnQsICgpID0+IHRoaXMucmVuZGVyKCksIChlKSA9PiB0aGlzLm9wZW5FdmVudEZ1bGxQYWdlKGUpKS5vcGVuKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICB0YXNrcy5maWx0ZXIodCA9PiB0LmR1ZURhdGUgPT09IGRhdGVTdHIgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKS5zbGljZSgwLDIpXG4gICAgICAgIC5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICAgIGNvbnN0IHBpbGwgPSBjZWxsLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1ldmVudC1waWxsXCIpO1xuICAgICAgICAgIHBpbGwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCIjRkYzQjMwMjJcIjtcbiAgICAgICAgICBwaWxsLnN0eWxlLmJvcmRlckxlZnQgICAgICA9IFwiM3B4IHNvbGlkICNGRjNCMzBcIjtcbiAgICAgICAgICBwaWxsLnN0eWxlLmNvbG9yICAgICAgICAgICA9IFwiI0ZGM0IzMFwiO1xuICAgICAgICAgIHBpbGwuc2V0VGV4dChcIlx1MjcxMyBcIiArIHRhc2sudGl0bGUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCByZW1haW5pbmcgPSA3IC0gKChmaXJzdERheSArIGRheXNJbk1vbnRoKSAlIDcpO1xuICAgIGlmIChyZW1haW5pbmcgPCA3KVxuICAgICAgZm9yIChsZXQgZCA9IDE7IGQgPD0gcmVtYWluaW5nOyBkKyspIHtcbiAgICAgICAgY29uc3QgY2VsbCA9IGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGwgY2hyb25pY2xlLW1vbnRoLWNlbGwtb3RoZXJcIik7XG4gICAgICAgIGNlbGwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGwtbnVtXCIpLnNldFRleHQoU3RyaW5nKGQpKTtcbiAgICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBXZWVrIHZpZXcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSByZW5kZXJXZWVrVmlldyhtYWluOiBIVE1MRWxlbWVudCwgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdLCB0YXNrczogQ2hyb25pY2xlVGFza1tdKSB7XG4gICAgY29uc3Qgd2Vla1N0YXJ0ID0gdGhpcy5nZXRXZWVrU3RhcnQoKTtcbiAgICBjb25zdCBkYXlzOiBEYXRlW10gPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiA3IH0sIChfLCBpKSA9PiB7XG4gICAgICBjb25zdCBkID0gbmV3IERhdGUod2Vla1N0YXJ0KTsgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgaSk7IHJldHVybiBkO1xuICAgIH0pO1xuICAgIGNvbnN0IHRvZGF5U3RyID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIC8vIFRoZSB3ZWVrIGdyaWQ6IHRpbWUtY29sICsgNyBkYXktY29sc1xuICAgIC8vIEVhY2ggZGF5LWNvbCBjb250YWluczogaGVhZGVyIFx1MjE5MiBhbGwtZGF5IHNoZWxmIFx1MjE5MiB0aW1lIGdyaWRcbiAgICAvLyBUaGlzIG1pcnJvcnMgZGF5IHZpZXcgZXhhY3RseSBcdTIwMTQgc2hlbGYgaXMgYWx3YXlzIGJlbG93IHRoZSBkYXRlIGhlYWRlclxuICAgIGNvbnN0IGNhbEdyaWQgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS13ZWVrLWdyaWRcIik7XG5cbiAgICAvLyBUaW1lIGNvbHVtblxuICAgIGNvbnN0IHRpbWVDb2wgPSBjYWxHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS10aW1lLWNvbFwiKTtcbiAgICAvLyBCbGFuayBjZWxsIHRoYXQgYWxpZ25zIHdpdGggdGhlIGRheSBoZWFkZXIgcm93XG4gICAgdGltZUNvbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGltZS1jb2wtaGVhZGVyXCIpO1xuICAgIC8vIEJsYW5rIGNlbGwgdGhhdCBhbGlnbnMgd2l0aCB0aGUgYWxsLWRheSBzaGVsZiByb3dcbiAgICBjb25zdCBzaGVsZlNwYWNlciA9IHRpbWVDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbWUtY29sLXNoZWxmLXNwYWNlclwiKTtcbiAgICBzaGVsZlNwYWNlci5zZXRUZXh0KFwiYWxsLWRheVwiKTtcbiAgICAvLyBIb3VyIGxhYmVsc1xuICAgIGZvciAobGV0IGggPSAwOyBoIDwgMjQ7IGgrKylcbiAgICAgIHRpbWVDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbWUtc2xvdFwiKS5zZXRUZXh0KHRoaXMuZm9ybWF0SG91cihoKSk7XG5cbiAgICAvLyBEYXkgY29sdW1uc1xuICAgIGZvciAoY29uc3QgZGF5IG9mIGRheXMpIHtcbiAgICAgIGNvbnN0IGRhdGVTdHIgICAgICA9IGRheS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICAgIGNvbnN0IGNvbCAgICAgICAgICA9IGNhbEdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1jb2xcIik7XG4gICAgICBjb25zdCBhbGxEYXlFdmVudHMgPSBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgZS5hbGxEYXkgJiYgdGhpcy5pc0NhbGVuZGFyVmlzaWJsZShlLmNhbGVuZGFySWQpKTtcblxuICAgICAgLy8gMS4gRGF5IGhlYWRlclxuICAgICAgY29uc3QgZGF5SGVhZGVyID0gY29sLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktaGVhZGVyXCIpO1xuICAgICAgZGF5SGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktbmFtZVwiKS5zZXRUZXh0KFxuICAgICAgICBkYXkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyB3ZWVrZGF5OiBcInNob3J0XCIgfSkudG9VcHBlckNhc2UoKVxuICAgICAgKTtcbiAgICAgIGNvbnN0IGRheU51bSA9IGRheUhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LW51bVwiKTtcbiAgICAgIGRheU51bS5zZXRUZXh0KFN0cmluZyhkYXkuZ2V0RGF0ZSgpKSk7XG4gICAgICBpZiAoZGF0ZVN0ciA9PT0gdG9kYXlTdHIpIGRheU51bS5hZGRDbGFzcyhcInRvZGF5XCIpO1xuXG4gICAgICAvLyAyLiBBbGwtZGF5IHNoZWxmIFx1MjAxNCBzaXRzIGRpcmVjdGx5IGJlbG93IGhlYWRlciwgc2FtZSBhcyBkYXkgdmlld1xuICAgICAgY29uc3Qgc2hlbGYgPSBjb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXdlZWstYWxsZGF5LXNoZWxmXCIpO1xuICAgICAgZm9yIChjb25zdCBldmVudCBvZiBhbGxEYXlFdmVudHMpXG4gICAgICAgIHRoaXMucmVuZGVyRXZlbnRQaWxsQWxsRGF5KHNoZWxmLCBldmVudCk7XG5cbiAgICAgIC8vIDMuIFRpbWUgZ3JpZFxuICAgICAgY29uc3QgdGltZUdyaWQgPSBjb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS10aW1lLWdyaWRcIik7XG4gICAgICB0aW1lR3JpZC5zdHlsZS5oZWlnaHQgPSBgJHsyNCAqIEhPVVJfSEVJR0hUfXB4YDtcblxuICAgICAgZm9yIChsZXQgaCA9IDA7IGggPCAyNDsgaCsrKSB7XG4gICAgICAgIGNvbnN0IGxpbmUgPSB0aW1lR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtaG91ci1saW5lXCIpO1xuICAgICAgICBsaW5lLnN0eWxlLnRvcCA9IGAke2ggKiBIT1VSX0hFSUdIVH1weGA7XG4gICAgICB9XG5cbiAgICAgIHRpbWVHcmlkLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICBjb25zdCByZWN0ICAgPSB0aW1lR3JpZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgeSAgICAgID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICAgIGNvbnN0IGhvdXIgICA9IE1hdGgubWluKE1hdGguZmxvb3IoeSAvIEhPVVJfSEVJR0hUKSwgMjMpO1xuICAgICAgICBjb25zdCBtaW51dGUgPSBNYXRoLmZsb29yKCh5ICUgSE9VUl9IRUlHSFQpIC8gSE9VUl9IRUlHSFQgKiA2MCAvIDE1KSAqIDE1O1xuICAgICAgICB0aGlzLm9wZW5OZXdFdmVudE1vZGFsKGRhdGVTdHIsIGZhbHNlLCBob3VyLCBtaW51dGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHRpbWVHcmlkLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IHJlY3QgICA9IHRpbWVHcmlkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCB5ICAgICAgPSBlLmNsaWVudFkgLSByZWN0LnRvcDtcbiAgICAgICAgY29uc3QgaG91ciAgID0gTWF0aC5taW4oTWF0aC5mbG9vcih5IC8gSE9VUl9IRUlHSFQpLCAyMyk7XG4gICAgICAgIGNvbnN0IG1pbnV0ZSA9IE1hdGguZmxvb3IoKHkgJSBIT1VSX0hFSUdIVCkgLyBIT1VSX0hFSUdIVCAqIDYwIC8gMTUpICogMTU7XG4gICAgICAgIHRoaXMuc2hvd0NhbENvbnRleHRNZW51KGUuY2xpZW50WCwgZS5jbGllbnRZLCBkYXRlU3RyLCBmYWxzZSwgaG91ciwgbWludXRlKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUaW1lZCBldmVudHNcbiAgICAgIGV2ZW50cy5maWx0ZXIoZSA9PiBlLnN0YXJ0RGF0ZSA9PT0gZGF0ZVN0ciAmJiAhZS5hbGxEYXkgJiYgZS5zdGFydFRpbWUgJiYgdGhpcy5pc0NhbGVuZGFyVmlzaWJsZShlLmNhbGVuZGFySWQpKVxuICAgICAgICAuZm9yRWFjaChldmVudCA9PiB0aGlzLnJlbmRlckV2ZW50UGlsbFRpbWVkKHRpbWVHcmlkLCBldmVudCkpO1xuXG4gICAgICAvLyBUYXNrIGR1ZSBwaWxsc1xuICAgICAgdGFza3MuZmlsdGVyKHQgPT4gdC5kdWVEYXRlID09PSBkYXRlU3RyICYmIHQuc3RhdHVzICE9PSBcImRvbmVcIilcbiAgICAgICAgLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgICAgY29uc3QgdG9wICA9IHRhc2suZHVlVGltZVxuICAgICAgICAgICAgPyAoKCkgPT4geyBjb25zdCBbaCxtXSA9IHRhc2suZHVlVGltZSEuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpOyByZXR1cm4gKGggKyBtLzYwKSAqIEhPVVJfSEVJR0hUOyB9KSgpXG4gICAgICAgICAgICA6IDA7XG4gICAgICAgICAgY29uc3QgcGlsbCA9IHRpbWVHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLWRheS1waWxsXCIpO1xuICAgICAgICAgIHBpbGwuc3R5bGUudG9wICAgICAgICAgICAgID0gYCR7dG9wfXB4YDtcbiAgICAgICAgICBwaWxsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiI0ZGM0IzMDIyXCI7XG4gICAgICAgICAgcGlsbC5zdHlsZS5ib3JkZXJMZWZ0ICAgICAgPSBcIjNweCBzb2xpZCAjRkYzQjMwXCI7XG4gICAgICAgICAgcGlsbC5zdHlsZS5jb2xvciAgICAgICAgICAgPSBcIiNGRjNCMzBcIjtcbiAgICAgICAgICBwaWxsLnNldFRleHQoXCJcdTI3MTMgXCIgKyB0YXNrLnRpdGxlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gTm93IGxpbmVcbiAgICBjb25zdCBub3cgICAgICAgICA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3Qgbm93U3RyICAgICAgPSBub3cudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgdG9kYXlDb2xJZHggPSBkYXlzLmZpbmRJbmRleChkID0+IGQudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF0gPT09IG5vd1N0cik7XG4gICAgaWYgKHRvZGF5Q29sSWR4ID49IDApIHtcbiAgICAgIGNvbnN0IGNvbHMgICAgID0gY2FsR3JpZC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNocm9uaWNsZS1kYXktY29sXCIpO1xuICAgICAgY29uc3QgdG9kYXlDb2wgPSBjb2xzW3RvZGF5Q29sSWR4XSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGNvbnN0IHRnICAgICAgID0gdG9kYXlDb2wucXVlcnlTZWxlY3RvcihcIi5jaHJvbmljbGUtZGF5LXRpbWUtZ3JpZFwiKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmICh0Zykge1xuICAgICAgICBjb25zdCB0b3AgID0gKG5vdy5nZXRIb3VycygpICsgbm93LmdldE1pbnV0ZXMoKSAvIDYwKSAqIEhPVVJfSEVJR0hUO1xuICAgICAgICBjb25zdCBsaW5lID0gdGcuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW5vdy1saW5lXCIpO1xuICAgICAgICBsaW5lLnN0eWxlLnRvcCA9IGAke3RvcH1weGA7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIERheSB2aWV3IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyRGF5VmlldyhtYWluOiBIVE1MRWxlbWVudCwgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdLCB0YXNrczogQ2hyb25pY2xlVGFza1tdKSB7XG4gICAgY29uc3QgZGF0ZVN0ciAgICAgID0gdGhpcy5jdXJyZW50RGF0ZS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCB0b2RheVN0ciAgICAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IGFsbERheUV2ZW50cyA9IGV2ZW50cy5maWx0ZXIoZSA9PiBlLnN0YXJ0RGF0ZSA9PT0gZGF0ZVN0ciAmJiBlLmFsbERheSAmJiB0aGlzLmlzQ2FsZW5kYXJWaXNpYmxlKGUuY2FsZW5kYXJJZCkpO1xuICAgIGNvbnN0IGRheVZpZXcgICAgICA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS12aWV3XCIpO1xuXG4gICAgLy8gRGF5IGhlYWRlclxuICAgIGNvbnN0IGRheUhlYWRlciA9IGRheVZpZXcuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS12aWV3LWhlYWRlclwiKTtcbiAgICBkYXlIZWFkZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1uYW1lLWxhcmdlXCIpLnNldFRleHQoXG4gICAgICB0aGlzLmN1cnJlbnREYXRlLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgd2Vla2RheTogXCJsb25nXCIgfSkudG9VcHBlckNhc2UoKVxuICAgICk7XG4gICAgY29uc3QgbnVtRWwgPSBkYXlIZWFkZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1udW0tbGFyZ2VcIik7XG4gICAgbnVtRWwuc2V0VGV4dChTdHJpbmcodGhpcy5jdXJyZW50RGF0ZS5nZXREYXRlKCkpKTtcbiAgICBpZiAoZGF0ZVN0ciA9PT0gdG9kYXlTdHIpIG51bUVsLmFkZENsYXNzKFwidG9kYXlcIik7XG5cbiAgICAvLyBBbGwtZGF5IHNoZWxmXG4gICAgY29uc3Qgc2hlbGYgICAgICAgID0gZGF5Vmlldy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LWFsbGRheS1zaGVsZlwiKTtcbiAgICBzaGVsZi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LWFsbGRheS1sYWJlbFwiKS5zZXRUZXh0KFwiYWxsLWRheVwiKTtcbiAgICBjb25zdCBzaGVsZkNvbnRlbnQgPSBzaGVsZi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LWFsbGRheS1jb250ZW50XCIpO1xuICAgIGZvciAoY29uc3QgZXZlbnQgb2YgYWxsRGF5RXZlbnRzKVxuICAgICAgdGhpcy5yZW5kZXJFdmVudFBpbGxBbGxEYXkoc2hlbGZDb250ZW50LCBldmVudCk7XG5cbiAgICAvLyBUaW1lIGFyZWFcbiAgICBjb25zdCB0aW1lQXJlYSAgID0gZGF5Vmlldy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LXNpbmdsZS1hcmVhXCIpO1xuICAgIGNvbnN0IHRpbWVMYWJlbHMgPSB0aW1lQXJlYS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LXNpbmdsZS1sYWJlbHNcIik7XG4gICAgY29uc3QgZXZlbnRDb2wgICA9IHRpbWVBcmVhLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktc2luZ2xlLWV2ZW50c1wiKTtcbiAgICBldmVudENvbC5zdHlsZS5oZWlnaHQgPSBgJHsyNCAqIEhPVVJfSEVJR0hUfXB4YDtcblxuICAgIGZvciAobGV0IGggPSAwOyBoIDwgMjQ7IGgrKykge1xuICAgICAgdGltZUxhYmVscy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGltZS1zbG90XCIpLnNldFRleHQodGhpcy5mb3JtYXRIb3VyKGgpKTtcbiAgICAgIGNvbnN0IGxpbmUgPSBldmVudENvbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtaG91ci1saW5lXCIpO1xuICAgICAgbGluZS5zdHlsZS50b3AgPSBgJHtoICogSE9VUl9IRUlHSFR9cHhgO1xuICAgIH1cblxuICAgIGV2ZW50Q29sLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgY29uc3QgcmVjdCAgID0gZXZlbnRDb2wuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCB5ICAgICAgPSBlLmNsaWVudFkgLSByZWN0LnRvcDtcbiAgICAgIGNvbnN0IGhvdXIgICA9IE1hdGgubWluKE1hdGguZmxvb3IoeSAvIEhPVVJfSEVJR0hUKSwgMjMpO1xuICAgICAgY29uc3QgbWludXRlID0gTWF0aC5mbG9vcigoeSAlIEhPVVJfSEVJR0hUKSAvIEhPVVJfSEVJR0hUICogNjAgLyAxNSkgKiAxNTtcbiAgICAgIHRoaXMub3Blbk5ld0V2ZW50TW9kYWwoZGF0ZVN0ciwgZmFsc2UsIGhvdXIsIG1pbnV0ZSk7XG4gICAgfSk7XG5cbiAgICBldmVudENvbC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHJlY3QgICA9IGV2ZW50Q29sLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgeSAgICAgID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICBjb25zdCBob3VyICAgPSBNYXRoLm1pbihNYXRoLmZsb29yKHkgLyBIT1VSX0hFSUdIVCksIDIzKTtcbiAgICAgIGNvbnN0IG1pbnV0ZSA9IE1hdGguZmxvb3IoKHkgJSBIT1VSX0hFSUdIVCkgLyBIT1VSX0hFSUdIVCAqIDYwIC8gMTUpICogMTU7XG4gICAgICB0aGlzLnNob3dDYWxDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZGF0ZVN0ciwgZmFsc2UsIGhvdXIsIG1pbnV0ZSk7XG4gICAgfSk7XG5cbiAgICBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgIWUuYWxsRGF5ICYmIGUuc3RhcnRUaW1lICYmIHRoaXMuaXNDYWxlbmRhclZpc2libGUoZS5jYWxlbmRhcklkKSlcbiAgICAgIC5mb3JFYWNoKGV2ZW50ID0+IHRoaXMucmVuZGVyRXZlbnRQaWxsVGltZWQoZXZlbnRDb2wsIGV2ZW50KSk7XG5cbiAgICB0YXNrcy5maWx0ZXIodCA9PiB0LmR1ZURhdGUgPT09IGRhdGVTdHIgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKVxuICAgICAgLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgIGNvbnN0IHRvcCAgPSB0YXNrLmR1ZVRpbWVcbiAgICAgICAgICA/ICgoKSA9PiB7IGNvbnN0IFtoLG1dID0gdGFzay5kdWVUaW1lIS5zcGxpdChcIjpcIikubWFwKE51bWJlcik7IHJldHVybiAoaCArIG0vNjApICogSE9VUl9IRUlHSFQ7IH0pKClcbiAgICAgICAgICA6IDA7XG4gICAgICAgIGNvbnN0IHBpbGwgPSBldmVudENvbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1kYXktcGlsbFwiKTtcbiAgICAgICAgcGlsbC5zdHlsZS50b3AgICAgICAgICAgICAgPSBgJHt0b3B9cHhgO1xuICAgICAgICBwaWxsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiI0ZGM0IzMDIyXCI7XG4gICAgICAgIHBpbGwuc3R5bGUuYm9yZGVyTGVmdCAgICAgID0gXCIzcHggc29saWQgI0ZGM0IzMFwiO1xuICAgICAgICBwaWxsLnN0eWxlLmNvbG9yICAgICAgICAgICA9IFwiI0ZGM0IzMFwiO1xuICAgICAgICBwaWxsLnNldFRleHQoXCJcdTI3MTMgXCIgKyB0YXNrLnRpdGxlKTtcbiAgICAgIH0pO1xuXG4gICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSB7XG4gICAgICBjb25zdCBub3cgID0gbmV3IERhdGUoKTtcbiAgICAgIGNvbnN0IHRvcCAgPSAobm93LmdldEhvdXJzKCkgKyBub3cuZ2V0TWludXRlcygpIC8gNjApICogSE9VUl9IRUlHSFQ7XG4gICAgICBjb25zdCBsaW5lID0gZXZlbnRDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW5vdy1saW5lXCIpO1xuICAgICAgbGluZS5zdHlsZS50b3AgPSBgJHt0b3B9cHhgO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgb3Blbk5ld0V2ZW50TW9kYWwoZGF0ZVN0cjogc3RyaW5nLCBhbGxEYXk6IGJvb2xlYW4sIGhvdXIgPSA5LCBtaW51dGUgPSAwKSB7XG4gICAgY29uc3QgdGltZVN0ciA9IGAke1N0cmluZyhob3VyKS5wYWRTdGFydCgyLFwiMFwiKX06JHtTdHJpbmcobWludXRlKS5wYWRTdGFydCgyLFwiMFwiKX1gO1xuICAgIGNvbnN0IGVuZFN0ciAgPSBgJHtTdHJpbmcoTWF0aC5taW4oaG91cisxLDIzKSkucGFkU3RhcnQoMixcIjBcIil9OiR7U3RyaW5nKG1pbnV0ZSkucGFkU3RhcnQoMixcIjBcIil9YDtcbiAgICBjb25zdCBwcmVmaWxsID0ge1xuICAgICAgaWQ6IFwiXCIsIHRpdGxlOiBcIlwiLCBhbGxEYXksXG4gICAgICBzdGFydERhdGU6IGRhdGVTdHIsIHN0YXJ0VGltZTogYWxsRGF5ID8gdW5kZWZpbmVkIDogdGltZVN0cixcbiAgICAgIGVuZERhdGU6ICAgZGF0ZVN0ciwgZW5kVGltZTogICBhbGxEYXkgPyB1bmRlZmluZWQgOiBlbmRTdHIsXG4gICAgICBhbGVydDogXCJub25lXCIsIGxpbmtlZFRhc2tJZHM6IFtdLCBjb21wbGV0ZWRJbnN0YW5jZXM6IFtdLCBjcmVhdGVkQXQ6IFwiXCJcbiAgICB9IGFzIENocm9uaWNsZUV2ZW50O1xuXG4gICAgbmV3IEV2ZW50TW9kYWwoXG4gICAgICB0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLFxuICAgICAgcHJlZmlsbCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGUpID0+IHRoaXMub3BlbkV2ZW50RnVsbFBhZ2UoZSA/PyBwcmVmaWxsKVxuICAgICkub3BlbigpO1xuICB9XG5cbnByaXZhdGUgc2hvd0V2ZW50Q29udGV4dE1lbnUoeDogbnVtYmVyLCB5OiBudW1iZXIsIGV2ZW50OiBDaHJvbmljbGVFdmVudCkge1xuICAgIGNvbnN0IG1lbnUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG1lbnUuY2xhc3NOYW1lICA9IFwiY2hyb25pY2xlLWNvbnRleHQtbWVudVwiO1xuICAgIG1lbnUuc3R5bGUubGVmdCA9IGAke3h9cHhgO1xuICAgIG1lbnUuc3R5bGUudG9wICA9IGAke3l9cHhgO1xuXG4gICAgY29uc3QgZWRpdEl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW1cIik7XG4gICAgZWRpdEl0ZW0uc2V0VGV4dChcIkVkaXQgZXZlbnRcIik7XG4gICAgZWRpdEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIG1lbnUucmVtb3ZlKCk7XG4gICAgICBuZXcgRXZlbnRNb2RhbCh0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCBldmVudCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGUpID0+IHRoaXMub3BlbkV2ZW50RnVsbFBhZ2UoZSkpLm9wZW4oKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGRlbGV0ZUl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW0gY2hyb25pY2xlLWNvbnRleHQtZGVsZXRlXCIpO1xuICAgIGRlbGV0ZUl0ZW0uc2V0VGV4dChcIkRlbGV0ZSBldmVudFwiKTtcbiAgICBkZWxldGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICBtZW51LnJlbW92ZSgpO1xuICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuZGVsZXRlKGV2ZW50LmlkKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1lbnUpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IG1lbnUucmVtb3ZlKCksIHsgb25jZTogdHJ1ZSB9KSwgMCk7XG4gIH1cblxuICBwcml2YXRlIHNob3dDYWxDb250ZXh0TWVudSh4OiBudW1iZXIsIHk6IG51bWJlciwgZGF0ZVN0cjogc3RyaW5nLCBhbGxEYXk6IGJvb2xlYW4sIGhvdXIgPSA5LCBtaW51dGUgPSAwKSB7XG4gICAgY29uc3QgbWVudSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbWVudS5jbGFzc05hbWUgICAgPSBcImNocm9uaWNsZS1jb250ZXh0LW1lbnVcIjtcbiAgICBtZW51LnN0eWxlLmxlZnQgICA9IGAke3h9cHhgO1xuICAgIG1lbnUuc3R5bGUudG9wICAgID0gYCR7eX1weGA7XG5cbiAgICBjb25zdCBhZGRJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtXCIpO1xuICAgIGFkZEl0ZW0uc2V0VGV4dChcIk5ldyBldmVudCBoZXJlXCIpO1xuICAgIGFkZEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgbWVudS5yZW1vdmUoKTsgdGhpcy5vcGVuTmV3RXZlbnRNb2RhbChkYXRlU3RyLCBhbGxEYXksIGhvdXIsIG1pbnV0ZSk7IH0pO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtZW51KTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBtZW51LnJlbW92ZSgpLCB7IG9uY2U6IHRydWUgfSksIDApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJFdmVudFBpbGxUaW1lZChjb250YWluZXI6IEhUTUxFbGVtZW50LCBldmVudDogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBjb25zdCBbc2gsIHNtXSA9IChldmVudC5zdGFydFRpbWUgPz8gXCIwOTowMFwiKS5zcGxpdChcIjpcIikubWFwKE51bWJlcik7XG4gICAgY29uc3QgW2VoLCBlbV0gPSAoZXZlbnQuZW5kVGltZSAgID8/IFwiMTA6MDBcIikuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpO1xuICAgIGNvbnN0IHRvcCAgICA9IChzaCArIHNtIC8gNjApICogSE9VUl9IRUlHSFQ7XG4gICAgY29uc3QgaGVpZ2h0ID0gTWF0aC5tYXgoKGVoIC0gc2ggKyAoZW0gLSBzbSkgLyA2MCkgKiBIT1VSX0hFSUdIVCwgMjIpO1xuICAgIGNvbnN0IGNhbCAgICA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoZXZlbnQuY2FsZW5kYXJJZCA/PyBcIlwiKTtcbiAgICBjb25zdCBjb2xvciAgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCIjMzc4QUREXCI7XG5cbiAgICBjb25zdCBwaWxsID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1ldmVudC1waWxsXCIpO1xuICAgIHBpbGwuc3R5bGUudG9wICAgICAgICAgICAgID0gYCR7dG9wfXB4YDtcbiAgICBwaWxsLnN0eWxlLmhlaWdodCAgICAgICAgICA9IGAke2hlaWdodH1weGA7XG4gICAgcGlsbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvciArIFwiMzNcIjtcbiAgICBwaWxsLnN0eWxlLmJvcmRlckxlZnQgICAgICA9IGAzcHggc29saWQgJHtjb2xvcn1gO1xuICAgIHBpbGwuc3R5bGUuY29sb3IgICAgICAgICAgID0gY29sb3I7XG4gICAgcGlsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZXZlbnQtcGlsbC10aXRsZVwiKS5zZXRUZXh0KGV2ZW50LnRpdGxlKTtcbiAgICBpZiAoaGVpZ2h0ID4gMzYgJiYgZXZlbnQuc3RhcnRUaW1lKVxuICAgICAgcGlsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZXZlbnQtcGlsbC10aW1lXCIpLnNldFRleHQodGhpcy5mb3JtYXRUaW1lKGV2ZW50LnN0YXJ0VGltZSkpO1xuXG4gICAgcGlsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBuZXcgRXZlbnRNb2RhbCh0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCBldmVudCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGUpID0+IHRoaXMub3BlbkV2ZW50RnVsbFBhZ2UoZSkpLm9wZW4oKTtcbiAgICB9KTtcblxuICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgdGhpcy5zaG93RXZlbnRDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZXZlbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJFdmVudFBpbGxBbGxEYXkoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZXZlbnQ6IENocm9uaWNsZUV2ZW50KSB7XG4gICAgY29uc3QgY2FsICAgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGV2ZW50LmNhbGVuZGFySWQgPz8gXCJcIik7XG4gICAgY29uc3QgY29sb3IgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCIjMzc4QUREXCI7XG4gICAgY29uc3QgcGlsbCAgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWV2ZW50LXBpbGwtYWxsZGF5XCIpO1xuICAgIHBpbGwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IgKyBcIjMzXCI7XG4gICAgcGlsbC5zdHlsZS5ib3JkZXJMZWZ0ICAgICAgPSBgM3B4IHNvbGlkICR7Y29sb3J9YDtcbiAgICBwaWxsLnN0eWxlLmNvbG9yICAgICAgICAgICA9IGNvbG9yO1xuICAgIHBpbGwuc2V0VGV4dChldmVudC50aXRsZSk7XG4gICAgcGlsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT5cbiAgICAgIG5ldyBFdmVudE1vZGFsKHRoaXMuYXBwLCB0aGlzLmV2ZW50TWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIsIGV2ZW50LCAoKSA9PiB0aGlzLnJlbmRlcigpLCAoZSkgPT4gdGhpcy5vcGVuRXZlbnRGdWxsUGFnZShlKSkub3BlbigpXG4gICAgKTtcblxuICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgdGhpcy5zaG93RXZlbnRDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZXZlbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBpc0NhbGVuZGFyVmlzaWJsZShjYWxlbmRhcklkPzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCFjYWxlbmRhcklkKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChjYWxlbmRhcklkKT8uaXNWaXNpYmxlID8/IHRydWU7XG4gIH1cblxuICBwcml2YXRlIGZvcm1hdEhvdXIoaDogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBpZiAoaCA9PT0gMCkgIHJldHVybiBcIjEyIEFNXCI7XG4gICAgaWYgKGggPCAxMikgICByZXR1cm4gYCR7aH0gQU1gO1xuICAgIGlmIChoID09PSAxMikgcmV0dXJuIFwiMTIgUE1cIjtcbiAgICByZXR1cm4gYCR7aCAtIDEyfSBQTWA7XG4gIH1cblxuICBwcml2YXRlIGZvcm1hdFRpbWUodGltZVN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBbaCwgbV0gPSB0aW1lU3RyLnNwbGl0KFwiOlwiKS5tYXAoTnVtYmVyKTtcbiAgICByZXR1cm4gYCR7aCAlIDEyIHx8IDEyfToke1N0cmluZyhtKS5wYWRTdGFydCgyLFwiMFwiKX0gJHtoID49IDEyID8gXCJQTVwiIDogXCJBTVwifWA7XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgRXZlbnRNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvRXZlbnRNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZUV2ZW50LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSBlZGl0aW5nRXZlbnQ6IENocm9uaWNsZUV2ZW50IHwgbnVsbDtcbiAgcHJpdmF0ZSBvblNhdmU/OiAoKSA9PiB2b2lkO1xuICBwcml2YXRlIG9uRXhwYW5kPzogKGV2ZW50PzogQ2hyb25pY2xlRXZlbnQpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXIsXG4gICAgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXIsXG4gICAgZWRpdGluZ0V2ZW50PzogQ2hyb25pY2xlRXZlbnQsXG4gICAgb25TYXZlPzogKCkgPT4gdm9pZCxcbiAgICBvbkV4cGFuZD86IChldmVudD86IENocm9uaWNsZUV2ZW50KSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5ldmVudE1hbmFnZXIgICAgPSBldmVudE1hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nRXZlbnQgICAgPSBlZGl0aW5nRXZlbnQgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSAgICAgICAgICA9IG9uU2F2ZTtcbiAgICB0aGlzLm9uRXhwYW5kICAgICAgICA9IG9uRXhwYW5kO1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImNocm9uaWNsZS1ldmVudC1tb2RhbFwiKTtcblxuICAgIGNvbnN0IGUgPSB0aGlzLmVkaXRpbmdFdmVudDtcbiAgICBjb25zdCBjYWxlbmRhcnMgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRBbGwoKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIZWFkZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaGVhZGVyID0gY29udGVudEVsLmNyZWF0ZURpdihcImNlbS1oZWFkZXJcIik7XG4gICAgaGVhZGVyLmNyZWF0ZURpdihcImNlbS10aXRsZVwiKS5zZXRUZXh0KGUgPyBcIkVkaXQgZXZlbnRcIiA6IFwiTmV3IGV2ZW50XCIpO1xuXG4gICAgY29uc3QgZXhwYW5kQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdCBjZW0tZXhwYW5kLWJ0blwiIH0pO1xuICAgIGV4cGFuZEJ0bi50aXRsZSA9IFwiT3BlbiBhcyBmdWxsIHBhZ2VcIjtcbiAgICBleHBhbmRCdG4uaW5uZXJIVE1MID0gYDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPjxwb2x5bGluZSBwb2ludHM9XCIxNSAzIDIxIDMgMjEgOVwiLz48cG9seWxpbmUgcG9pbnRzPVwiOSAyMSAzIDIxIDMgMTVcIi8+PGxpbmUgeDE9XCIyMVwiIHkxPVwiM1wiIHgyPVwiMTRcIiB5Mj1cIjEwXCIvPjxsaW5lIHgxPVwiM1wiIHkxPVwiMjFcIiB4Mj1cIjEwXCIgeTI9XCIxNFwiLz48L3N2Zz5gO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEZvcm0gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgZm9ybSA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZW0tZm9ybVwiKTtcblxuICAgIC8vIFRpdGxlXG4gICAgY29uc3QgdGl0bGVJbnB1dCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJUaXRsZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXQgY2YtdGl0bGUtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiRXZlbnQgbmFtZVwiXG4gICAgfSk7XG4gICAgdGl0bGVJbnB1dC52YWx1ZSA9IGU/LnRpdGxlID8/IFwiXCI7XG4gICAgdGl0bGVJbnB1dC5mb2N1cygpO1xuXG4gICAgLy8gTG9jYXRpb25cbiAgICBjb25zdCBsb2NhdGlvbklucHV0ID0gdGhpcy5jZW1GaWVsZChmb3JtLCBcIkxvY2F0aW9uXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLCBwbGFjZWhvbGRlcjogXCJBZGQgbG9jYXRpb25cIlxuICAgIH0pO1xuICAgIGxvY2F0aW9uSW5wdXQudmFsdWUgPSBlPy5sb2NhdGlvbiA/PyBcIlwiO1xuXG4gICAgLy8gQWxsIGRheSB0b2dnbGVcbiAgICBjb25zdCBhbGxEYXlGaWVsZCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJBbGwgZGF5XCIpO1xuICAgIGNvbnN0IGFsbERheVdyYXAgPSBhbGxEYXlGaWVsZC5jcmVhdGVEaXYoXCJjZW0tdG9nZ2xlLXdyYXBcIik7XG4gICAgY29uc3QgYWxsRGF5VG9nZ2xlID0gYWxsRGF5V3JhcC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiLCBjbHM6IFwiY2VtLXRvZ2dsZVwiIH0pO1xuICAgIGFsbERheVRvZ2dsZS5jaGVja2VkID0gZT8uYWxsRGF5ID8/IGZhbHNlO1xuICAgIGNvbnN0IGFsbERheUxhYmVsID0gYWxsRGF5V3JhcC5jcmVhdGVTcGFuKHsgY2xzOiBcImNlbS10b2dnbGUtbGFiZWxcIiwgdGV4dDogYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIlllc1wiIDogXCJOb1wiIH0pO1xuICAgIGFsbERheVRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGFsbERheUxhYmVsLnNldFRleHQoYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIlllc1wiIDogXCJOb1wiKTtcbiAgICAgIHRpbWVGaWVsZHMuc3R5bGUuZGlzcGxheSA9IGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJub25lXCIgOiBcIlwiO1xuICAgIH0pO1xuXG4gICAgLy8gU3RhcnQgZGF0ZSArIHRpbWVcbiAgICBjb25zdCBzdGFydFJvdyA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuICAgIGNvbnN0IHN0YXJ0RGF0ZUlucHV0ID0gdGhpcy5jZW1GaWVsZChzdGFydFJvdywgXCJTdGFydCBkYXRlXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJkYXRlXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgc3RhcnREYXRlSW5wdXQudmFsdWUgPSBlPy5zdGFydERhdGUgPz8gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIGNvbnN0IHRpbWVGaWVsZHMgPSBmb3JtLmNyZWF0ZURpdihcImNlbS10aW1lLWZpZWxkc1wiKTtcbiAgICB0aW1lRmllbGRzLnN0eWxlLmRpc3BsYXkgPSBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwibm9uZVwiIDogXCJcIjtcblxuICAgIGNvbnN0IHN0YXJ0VGltZVJvdyA9IHRpbWVGaWVsZHMuY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuICAgIGNvbnN0IHN0YXJ0VGltZUlucHV0ID0gdGhpcy5jZW1GaWVsZChzdGFydFRpbWVSb3csIFwiU3RhcnQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0VGltZUlucHV0LnZhbHVlID0gZT8uc3RhcnRUaW1lID8/IFwiMDk6MDBcIjtcblxuICAgIGNvbnN0IGVuZFRpbWVJbnB1dCA9IHRoaXMuY2VtRmllbGQoc3RhcnRUaW1lUm93LCBcIkVuZCB0aW1lXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0aW1lXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgZW5kVGltZUlucHV0LnZhbHVlID0gZT8uZW5kVGltZSA/PyBcIjEwOjAwXCI7XG5cbiAgICAvLyBFbmQgZGF0ZVxuICAgIGNvbnN0IGVuZERhdGVJbnB1dCA9IHRoaXMuY2VtRmllbGQoc3RhcnRSb3csIFwiRW5kIGRhdGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcImRhdGVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBlbmREYXRlSW5wdXQudmFsdWUgPSBlPy5lbmREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICAvLyBBdXRvLWFkdmFuY2UgZW5kIGRhdGUgd2hlbiBzdGFydCBjaGFuZ2VzXG4gICAgc3RhcnREYXRlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBpZiAoIWVuZERhdGVJbnB1dC52YWx1ZSB8fCBlbmREYXRlSW5wdXQudmFsdWUgPCBzdGFydERhdGVJbnB1dC52YWx1ZSkge1xuICAgICAgICBlbmREYXRlSW5wdXQudmFsdWUgPSBzdGFydERhdGVJbnB1dC52YWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFJlcGVhdFxuICAgIGNvbnN0IHJlY1NlbGVjdCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJSZXBlYXRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcmVjdXJyZW5jZXMgPSBbXG4gICAgICB7IHZhbHVlOiBcIlwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiTmV2ZXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPURBSUxZXCIsICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IGRheVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZXCIsICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgd2Vla1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9TU9OVEhMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgbW9udGhcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVlFQVJMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IHllYXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWTtCWURBWT1NTyxUVSxXRSxUSCxGUlwiLCAgbGFiZWw6IFwiV2Vla2RheXNcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCByIG9mIHJlY3VycmVuY2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSByZWNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogci52YWx1ZSwgdGV4dDogci5sYWJlbCB9KTtcbiAgICAgIGlmIChlPy5yZWN1cnJlbmNlID09PSByLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIENhbGVuZGFyXG4gICAgY29uc3QgY2FsU2VsZWN0ID0gdGhpcy5jZW1GaWVsZChmb3JtLCBcIkNhbGVuZGFyXCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBcIlwiLCB0ZXh0OiBcIk5vbmVcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGNhbCBvZiBjYWxlbmRhcnMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBjYWwuaWQsIHRleHQ6IGNhbC5uYW1lIH0pO1xuICAgICAgaWYgKGU/LmNhbGVuZGFySWQgPT09IGNhbC5pZCkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgdXBkYXRlQ2FsQ29sb3IgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGNhbFNlbGVjdC52YWx1ZSk7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdENvbG9yID0gY2FsID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSA6IFwidHJhbnNwYXJlbnRcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0V2lkdGggPSBcIjRweFwiO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRTdHlsZSA9IFwic29saWRcIjtcbiAgICB9O1xuICAgIGNhbFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHVwZGF0ZUNhbENvbG9yKTtcbiAgICB1cGRhdGVDYWxDb2xvcigpO1xuXG4gICAgLy8gQWxlcnRcbiAgICBjb25zdCBhbGVydFNlbGVjdCA9IHRoaXMuY2VtRmllbGQoZm9ybSwgXCJBbGVydFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCBhbGVydHM6IHsgdmFsdWU6IEFsZXJ0T2Zmc2V0OyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwibm9uZVwiLCAgICBsYWJlbDogXCJOb25lXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiYXQtdGltZVwiLCBsYWJlbDogXCJBdCB0aW1lIG9mIGV2ZW50XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiNW1pblwiLCAgICBsYWJlbDogXCI1IG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMTBtaW5cIiwgICBsYWJlbDogXCIxMCBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjE1bWluXCIsICAgbGFiZWw6IFwiMTUgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIzMG1pblwiLCAgIGxhYmVsOiBcIjMwIG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMWhvdXJcIiwgICBsYWJlbDogXCIxIGhvdXIgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMmhvdXJzXCIsICBsYWJlbDogXCIyIGhvdXJzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjFkYXlcIiwgICAgbGFiZWw6IFwiMSBkYXkgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMmRheXNcIiwgICBsYWJlbDogXCIyIGRheXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMXdlZWtcIiwgICBsYWJlbDogXCIxIHdlZWsgYmVmb3JlXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgYSBvZiBhbGVydHMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGFsZXJ0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGEudmFsdWUsIHRleHQ6IGEubGFiZWwgfSk7XG4gICAgICBpZiAoZT8uYWxlcnQgPT09IGEudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gTm90ZXNcbiAgICBjb25zdCBub3Rlc0lucHV0ID0gdGhpcy5jZW1GaWVsZChmb3JtLCBcIk5vdGVzXCIpLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImNmLXRleHRhcmVhXCIsIHBsYWNlaG9sZGVyOiBcIkFkZCBub3Rlcy4uLlwiXG4gICAgfSk7XG4gICAgbm90ZXNJbnB1dC52YWx1ZSA9IGU/Lm5vdGVzID8/IFwiXCI7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9vdGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGZvb3RlciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZW0tZm9vdGVyXCIpO1xuICAgIGNvbnN0IGNhbmNlbEJ0biA9IGZvb3Rlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tZ2hvc3RcIiwgdGV4dDogXCJDYW5jZWxcIiB9KTtcblxuICAgIGlmIChlICYmIGUuaWQpIHtcbiAgICAgIGNvbnN0IGRlbGV0ZUJ0biA9IGZvb3Rlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tZGVsZXRlXCIsIHRleHQ6IFwiRGVsZXRlIGV2ZW50XCIgfSk7XG4gICAgICBkZWxldGVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuZGVsZXRlKGUuaWQpO1xuICAgICAgICB0aGlzLm9uU2F2ZT8uKCk7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHNhdmVCdG4gPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLXByaW1hcnlcIiwgdGV4dDogZSAmJiBlLmlkID8gXCJTYXZlXCIgOiBcIkFkZCBldmVudFwiIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEhhbmRsZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNhbmNlbEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5jbG9zZSgpKTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0aXRsZSA9IHRpdGxlSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCF0aXRsZSkgeyB0aXRsZUlucHV0LmZvY3VzKCk7IHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpOyByZXR1cm47IH1cblxuICAgICAgY29uc3QgZXZlbnREYXRhID0ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgbG9jYXRpb246ICAgIGxvY2F0aW9uSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBhbGxEYXk6ICAgICAgYWxsRGF5VG9nZ2xlLmNoZWNrZWQsXG4gICAgICAgIHN0YXJ0RGF0ZTogICBzdGFydERhdGVJbnB1dC52YWx1ZSxcbiAgICAgICAgc3RhcnRUaW1lOiAgIGFsbERheVRvZ2dsZS5jaGVja2VkID8gdW5kZWZpbmVkIDogc3RhcnRUaW1lSW5wdXQudmFsdWUsXG4gICAgICAgIGVuZERhdGU6ICAgICBlbmREYXRlSW5wdXQudmFsdWUgfHwgc3RhcnREYXRlSW5wdXQudmFsdWUsXG4gICAgICAgIGVuZFRpbWU6ICAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IHVuZGVmaW5lZCA6IGVuZFRpbWVJbnB1dC52YWx1ZSxcbiAgICAgICAgcmVjdXJyZW5jZTogIHJlY1NlbGVjdC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGNhbGVuZGFySWQ6ICBjYWxTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBhbGVydDogICAgICAgYWxlcnRTZWxlY3QudmFsdWUgYXMgQWxlcnRPZmZzZXQsXG4gICAgICAgIG5vdGVzOiAgICAgICBub3Rlc0lucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgbGlua2VkVGFza0lkczogZT8ubGlua2VkVGFza0lkcyA/PyBbXSxcbiAgICAgICAgY29tcGxldGVkSW5zdGFuY2VzOiBlPy5jb21wbGV0ZWRJbnN0YW5jZXMgPz8gW10sXG4gICAgICB9O1xuXG4gICAgICBpZiAoZSAmJiBlLmlkKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXZlbnRNYW5hZ2VyLnVwZGF0ZSh7IC4uLmUsIC4uLmV2ZW50RGF0YSB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXZlbnRNYW5hZ2VyLmNyZWF0ZShldmVudERhdGEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm9uU2F2ZT8uKCk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhhbmRsZVNhdmUpO1xuICAgIGV4cGFuZEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgdGhpcy5vbkV4cGFuZD8uKGUgPz8gdW5kZWZpbmVkKTtcbiAgICB9KTtcblxuICAgIHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGUpID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiKSBoYW5kbGVTYXZlKCk7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiRXNjYXBlXCIpIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgY2VtRmllbGQocGFyZW50OiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCB3cmFwID0gcGFyZW50LmNyZWF0ZURpdihcImNmLWZpZWxkXCIpO1xuICAgIHdyYXAuY3JlYXRlRGl2KFwiY2YtbGFiZWxcIikuc2V0VGV4dChsYWJlbCk7XG4g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VUFBUyxPQUFPO0FBQzlCLFVBQU0sT0FBTyxVQUFVLFFBQVEsS0FBSztBQUNwQyxVQUFNLEtBQUssYUFBYSxFQUFFLE1BQU0sc0JBQXNCLFFBQVEsS0FBSyxDQUFDO0FBQ3BFLGNBQVUsV0FBVyxJQUFJO0FBRXpCLFVBQU0sSUFBSSxRQUFRLGFBQVcsV0FBVyxTQUFTLEdBQUcsQ0FBQztBQUNyRCxVQUFNLFdBQVcsVUFBVSxnQkFBZ0Isb0JBQW9CLEVBQUUsQ0FBQztBQUNsRSxVQUFNLFdBQVcscUNBQVU7QUFDM0IsUUFBSSxZQUFZLE1BQU8sVUFBUyxVQUFVLEtBQUs7QUFBQSxFQUNqRDtBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiX2IiLCAiX2MiLCAiZSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiX2IiLCAiX2MiLCAiX2QiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJfYiIsICJfYyIsICJfZCIsICJ0IiwgInQiLCAiZ3JvdXBzIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiX2IiLCAiX2MiLCAiZSIsICJlIl0KfQo=
