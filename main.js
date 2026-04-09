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

// src/ui/SettingsTab.ts
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
    var _a;
    if (color.startsWith("#")) return color;
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
    return (_a = map[color]) != null ? _a : "#378ADD";
  }
  generateId(name) {
    const base = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
  }
};

// src/ui/SettingsTab.ts
var ChronicleSettingsTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.activeTab = "general";
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("chronicle-settings");
    const tabBar = containerEl.createDiv("chronicle-tab-bar");
    const tabs = [
      { id: "general", label: "General" },
      { id: "calendar", label: "Calendar" },
      { id: "reminders", label: "Reminders" },
      { id: "appearance", label: "Appearance" }
    ];
    for (const tab of tabs) {
      const tabEl = tabBar.createDiv("chronicle-tab");
      tabEl.setText(tab.label);
      if (this.activeTab === tab.id) tabEl.addClass("active");
      tabEl.addEventListener("click", () => {
        this.activeTab = tab.id;
        this.display();
      });
    }
    const content = containerEl.createDiv("chronicle-tab-content");
    switch (this.activeTab) {
      case "general":
        this.renderGeneral(content);
        break;
      case "calendar":
        this.renderCalendar(content);
        break;
      case "reminders":
        this.renderReminders(content);
        break;
      case "appearance":
        this.renderAppearance(content);
        break;
    }
  }
  // ── General ───────────────────────────────────────────────────────────────
  renderGeneral(el) {
    this.subHeader(el, "Storage");
    new import_obsidian.Setting(el).setName("Tasks folder").setDesc("Where task notes are stored in your vault.").addText(
      (text) => text.setPlaceholder("Chronicle/Tasks").setValue(this.plugin.settings.tasksFolder).onChange(async (value) => {
        this.plugin.settings.tasksFolder = value || "Chronicle/Tasks";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(el).setName("Events folder").setDesc("Where event notes are stored in your vault.").addText(
      (text) => text.setPlaceholder("Chronicle/Events").setValue(this.plugin.settings.eventsFolder).onChange(async (value) => {
        this.plugin.settings.eventsFolder = value || "Chronicle/Events";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(el).setName("Time format").setDesc("How times are displayed throughout Chronicle.").addDropdown(
      (drop) => drop.addOption("12h", "12-hour (2:30 PM)").addOption("24h", "24-hour (14:30)").setValue(this.plugin.settings.timeFormat).onChange(async (value) => {
        this.plugin.settings.timeFormat = value;
        await this.plugin.saveSettings();
      })
    );
    this.divider(el);
    this.subHeader(el, "Notifications");
    new import_obsidian.Setting(el).setName("macOS system notification").setDesc("Show a native macOS notification banner when an alert fires.").addToggle(
      (t) => {
        var _a;
        return t.setValue((_a = this.plugin.settings.notifMacOS) != null ? _a : true).onChange(async (value) => {
          this.plugin.settings.notifMacOS = value;
          await this.plugin.saveSettings();
        });
      }
    );
    new import_obsidian.Setting(el).setName("Obsidian in-app toast").setDesc("Show a banner inside Obsidian when an alert fires.").addToggle(
      (t) => {
        var _a;
        return t.setValue((_a = this.plugin.settings.notifObsidian) != null ? _a : true).onChange(async (value) => {
          this.plugin.settings.notifObsidian = value;
          await this.plugin.saveSettings();
        });
      }
    );
    new import_obsidian.Setting(el).setName("Sound").setDesc("Play a chime when an alert fires.").addToggle(
      (t) => {
        var _a;
        return t.setValue((_a = this.plugin.settings.notifSound) != null ? _a : true).onChange(async (value) => {
          this.plugin.settings.notifSound = value;
          await this.plugin.saveSettings();
        });
      }
    );
    new import_obsidian.Setting(el).setName("Alert for events").setDesc("Enable alerts for calendar events.").addToggle(
      (t) => {
        var _a;
        return t.setValue((_a = this.plugin.settings.notifEvents) != null ? _a : true).onChange(async (value) => {
          this.plugin.settings.notifEvents = value;
          await this.plugin.saveSettings();
        });
      }
    );
    new import_obsidian.Setting(el).setName("Alert for tasks").setDesc("Enable alerts for tasks with a due time.").addToggle(
      (t) => {
        var _a;
        return t.setValue((_a = this.plugin.settings.notifTasks) != null ? _a : true).onChange(async (value) => {
          this.plugin.settings.notifTasks = value;
          await this.plugin.saveSettings();
        });
      }
    );
    new import_obsidian.Setting(el).setName("Send test notification").setDesc("Fires a test alert using your current settings.").addButton(
      (btn) => btn.setButtonText("Test now").onClick(() => {
        this.plugin.alertManager.fire(
          "settings-test",
          "Chronicle test",
          "Your notifications are working.",
          "event"
        );
        this.plugin.alertManager["firedAlerts"].delete("settings-test");
      })
    );
  }
  // ── Calendar ──────────────────────────────────────────────────────────────
  renderCalendar(el) {
    this.subHeader(el, "Calendar defaults");
    new import_obsidian.Setting(el).setName("Start of week").setDesc("Which day the calendar week starts on.").addDropdown(
      (drop) => drop.addOption("0", "Sunday").addOption("1", "Monday").addOption("6", "Saturday").setValue(String(this.plugin.settings.startOfWeek)).onChange(async (value) => {
        this.plugin.settings.startOfWeek = parseInt(value);
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(el).setName("Default view").setDesc("Which view opens when you launch the calendar.").addDropdown(
      (drop) => drop.addOption("day", "Day").addOption("week", "Week").addOption("month", "Month").addOption("year", "Year").setValue(this.plugin.settings.defaultCalendarView).onChange(async (value) => {
        this.plugin.settings.defaultCalendarView = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(el).setName("Default calendar").setDesc("Calendar assigned to new events by default.").addDropdown((drop) => {
      var _a;
      drop.addOption("", "None");
      for (const cal of this.plugin.calendarManager.getAll()) {
        drop.addOption(cal.id, cal.name);
      }
      drop.setValue((_a = this.plugin.settings.defaultCalendarId) != null ? _a : "");
      drop.onChange(async (value) => {
        this.plugin.settings.defaultCalendarId = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(el).setName("Default event duration").setDesc("How long new events last by default (minutes).").addSlider(
      (slider) => {
        var _a;
        return slider.setLimits(15, 480, 15).setValue((_a = this.plugin.settings.defaultEventDuration) != null ? _a : 60).setDynamicTooltip().onChange(async (value) => {
          this.plugin.settings.defaultEventDuration = value;
          await this.plugin.saveSettings();
        });
      }
    );
    new import_obsidian.Setting(el).setName("Default event alert").setDesc("Alert offset applied to new events by default.").addDropdown(
      (drop) => this.addAlertOptions(drop).setValue(this.plugin.settings.defaultAlert).onChange(async (value) => {
        this.plugin.settings.defaultAlert = value;
        await this.plugin.saveSettings();
      })
    );
    this.divider(el);
    this.subHeader(el, "My Calendars");
    el.createDiv("cs-desc").setText("Add, rename, recolor, or delete calendars.");
    for (const cal of this.plugin.calendarManager.getAll()) {
      this.renderCalendarRow(el, cal, this.plugin.calendarManager.getAll().length === 1);
    }
    this.divider(el);
    const addRow = el.createDiv("cs-add-row");
    const nameInput = addRow.createEl("input", {
      type: "text",
      cls: "cs-text-input",
      placeholder: "New calendar name"
    });
    const colorSelect = addRow.createEl("input", { type: "color", cls: "cs-color-picker" });
    colorSelect.value = "#378ADD";
    const addBtn = addRow.createEl("button", { cls: "cs-btn-primary", text: "Add calendar" });
    addBtn.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        return;
      }
      this.plugin.calendarManager.create(name, colorSelect.value);
      await this.plugin.saveSettings();
      new import_obsidian.Notice(`Calendar "${name}" created`);
      this.display();
    });
  }
  renderCalendarRow(el, cal, isOnly) {
    const setting = new import_obsidian.Setting(el);
    const dot = setting.nameEl.createDiv("cs-cal-dot");
    dot.style.backgroundColor = CalendarManager.colorToHex(cal.color);
    setting.nameEl.createSpan({ text: cal.name });
    setting.addColorPicker((picker) => {
      picker.setValue(CalendarManager.colorToHex(cal.color));
      picker.onChange(async (hex) => {
        dot.style.backgroundColor = hex;
        this.plugin.calendarManager.update(cal.id, { color: hex });
        await this.plugin.saveSettings();
      });
    }).addText(
      (text) => text.setValue(cal.name).setPlaceholder("Calendar name").onChange(async (value) => {
        if (!value.trim()) return;
        this.plugin.calendarManager.update(cal.id, { name: value.trim() });
        await this.plugin.saveSettings();
      })
    ).addToggle(
      (toggle) => toggle.setValue(cal.isVisible).setTooltip("Show in views").onChange(async (value) => {
        this.plugin.calendarManager.update(cal.id, { isVisible: value });
        await this.plugin.saveSettings();
      })
    ).addButton(
      (btn) => btn.setIcon("trash").setTooltip("Delete calendar").setDisabled(isOnly).onClick(async () => {
        this.plugin.calendarManager.delete(cal.id);
        await this.plugin.saveSettings();
        new import_obsidian.Notice(`Calendar "${cal.name}" deleted`);
        this.display();
      })
    );
  }
  // ── Reminders ─────────────────────────────────────────────────────────────
  renderReminders(el) {
    this.subHeader(el, "Task defaults");
    new import_obsidian.Setting(el).setName("Default status").addDropdown(
      (drop) => drop.addOption("todo", "To do").addOption("in-progress", "In progress").addOption("done", "Done").addOption("cancelled", "Cancelled").setValue(this.plugin.settings.defaultTaskStatus).onChange(async (value) => {
        this.plugin.settings.defaultTaskStatus = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(el).setName("Default priority").addDropdown(
      (drop) => drop.addOption("none", "None").addOption("low", "Low").addOption("medium", "Medium").addOption("high", "High").setValue(this.plugin.settings.defaultTaskPriority).onChange(async (value) => {
        this.plugin.settings.defaultTaskPriority = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(el).setName("Default alert").setDesc("Alert offset applied to new tasks by default.").addDropdown(
      (drop) => this.addAlertOptions(drop).setValue(this.plugin.settings.defaultAlert).onChange(async (value) => {
        this.plugin.settings.defaultAlert = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(el).setName("Default calendar").setDesc("Calendar assigned to new tasks by default.").addDropdown((drop) => {
      var _a;
      drop.addOption("", "None");
      for (const cal of this.plugin.calendarManager.getAll()) {
        drop.addOption(cal.id, cal.name);
      }
      drop.setValue((_a = this.plugin.settings.defaultCalendarId) != null ? _a : "");
      drop.onChange(async (value) => {
        this.plugin.settings.defaultCalendarId = value;
        await this.plugin.saveSettings();
      });
    });
    this.divider(el);
    this.subHeader(el, "Smart list visibility");
    new import_obsidian.Setting(el).setName("Show Today count").addToggle(
      (t) => t.setValue(this.plugin.settings.showTodayCount).onChange(async (value) => {
        this.plugin.settings.showTodayCount = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(el).setName("Show Scheduled count").addToggle(
      (t) => t.setValue(this.plugin.settings.showScheduledCount).onChange(async (value) => {
        this.plugin.settings.showScheduledCount = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(el).setName("Show Flagged count").addToggle(
      (t) => t.setValue(this.plugin.settings.showFlaggedCount).onChange(async (value) => {
        this.plugin.settings.showFlaggedCount = value;
        await this.plugin.saveSettings();
      })
    );
  }
  // ── Appearance ────────────────────────────────────────────────────────────
  renderAppearance(el) {
    this.subHeader(el, "Layout");
    new import_obsidian.Setting(el).setName("Task list density").setDesc("Comfortable adds more padding between task rows.").addDropdown(
      (drop) => {
        var _a;
        return drop.addOption("compact", "Compact").addOption("comfortable", "Comfortable").setValue((_a = this.plugin.settings.density) != null ? _a : "comfortable").onChange(async (value) => {
          this.plugin.settings.density = value;
          await this.plugin.saveSettings();
        });
      }
    );
    new import_obsidian.Setting(el).setName("Show completed count").setDesc("Show the number of completed tasks next to the Completed entry.").addToggle(
      (t) => {
        var _a;
        return t.setValue((_a = this.plugin.settings.showCompletedCount) != null ? _a : true).onChange(async (value) => {
          this.plugin.settings.showCompletedCount = value;
          await this.plugin.saveSettings();
        });
      }
    );
    new import_obsidian.Setting(el).setName("Show task count subtitle").setDesc("Show '3 tasks' under the list title in the main panel.").addToggle(
      (t) => {
        var _a;
        return t.setValue((_a = this.plugin.settings.showTaskCountSubtitle) != null ? _a : true).onChange(async (value) => {
          this.plugin.settings.showTaskCountSubtitle = value;
          await this.plugin.saveSettings();
        });
      }
    );
  }
  // ── Helpers ───────────────────────────────────────────────────────────────
  subHeader(el, title) {
    el.createDiv("cs-sub-header").setText(title);
  }
  divider(el) {
    el.createDiv("cs-divider");
  }
  addAlertOptions(drop) {
    return drop.addOption("none", "None").addOption("at-time", "At time").addOption("5min", "5 minutes before").addOption("10min", "10 minutes before").addOption("15min", "15 minutes before").addOption("30min", "30 minutes before").addOption("1hour", "1 hour before").addOption("2hours", "2 hours before").addOption("1day", "1 day before").addOption("2days", "2 days before").addOption("1week", "1 week before");
  }
};

// src/data/AlertManager.ts
var import_obsidian2 = require("obsidian");
var AlertManager = class {
  constructor(app, taskManager, eventManager, getSettings) {
    this.intervalId = null;
    this.firedAlerts = /* @__PURE__ */ new Set();
    this.audioCtx = null;
    // Store handler references so we can remove them in stop()
    this.onChanged = null;
    this.onCreate = null;
    this.app = app;
    this.taskManager = taskManager;
    this.eventManager = eventManager;
    this.getSettings = getSettings;
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
    var _a, _b, _c;
    const now = /* @__PURE__ */ new Date();
    const nowMs = now.getTime();
    const windowMs = 5 * 60 * 1e3;
    console.log(`[Chronicle] Alert check at ${now.toLocaleTimeString()}`);
    const events = await this.eventManager.getAll();
    console.log(`[Chronicle] Checking ${events.length} events`);
    if (!((_a = this.getSettings().notifEvents) != null ? _a : true)) return;
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
      const dateStr = (_b = task.dueDate) != null ? _b : todayStr;
      const alertKey = `task-${task.id}-${dateStr}-${task.alert}`;
      if (this.firedAlerts.has(alertKey)) continue;
      const timeStr = (_c = task.dueTime) != null ? _c : "09:00";
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
    var _a, _b, _c;
    this.firedAlerts.add(key);
    const settings = this.getSettings();
    const doMacOS = (_a = settings.notifMacOS) != null ? _a : true;
    const doObsidian = (_b = settings.notifObsidian) != null ? _b : true;
    const doSound = (_c = settings.notifSound) != null ? _c : true;
    const icon = type === "event" ? "\u{1F5D3}" : "\u2713";
    if (doMacOS) {
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
      if (doObsidian) {
        new import_obsidian2.Notice(`${icon} ${title}
${body}`, 8e3);
      }
      if (doSound) {
        this.playSound();
      }
    }
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
var import_obsidian3 = require("obsidian");
var EVENT_FORM_VIEW_TYPE = "chronicle-event-form";
var EventFormView = class extends import_obsidian3.ItemView {
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
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
    const tagsInput = this.field(form, "Tags").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "work, personal  (comma separated)"
    });
    tagsInput.value = (_i = (_h = e == null ? void 0 : e.tags) == null ? void 0 : _h.join(", ")) != null ? _i : "";
    const linkedInput = this.field(form, "Linked notes").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Projects/Website, Journal/2024  (comma separated)"
    });
    linkedInput.value = (_k = (_j = e == null ? void 0 : e.linkedNotes) == null ? void 0 : _j.join(", ")) != null ? _k : "";
    const notesInput = this.field(form, "Notes").createEl("textarea", {
      cls: "cf-textarea",
      placeholder: "Add notes..."
    });
    notesInput.value = (_l = e == null ? void 0 : e.notes) != null ? _l : "";
    cancelBtn.addEventListener("click", () => {
      this.app.workspace.detachLeavesOfType(EVENT_FORM_VIEW_TYPE);
    });
    const handleSave = async () => {
      var _a2, _b2, _c2, _d2, _e2;
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
        linkedNotes: linkedInput.value ? linkedInput.value.split(",").map((s) => s.trim()).filter(Boolean) : (_a2 = e == null ? void 0 : e.linkedNotes) != null ? _a2 : [],
        tags: tagsInput.value ? tagsInput.value.split(",").map((s) => s.trim()).filter(Boolean) : (_b2 = e == null ? void 0 : e.tags) != null ? _b2 : [],
        linkedTaskIds: (_c2 = e == null ? void 0 : e.linkedTaskIds) != null ? _c2 : [],
        completedInstances: (_d2 = e == null ? void 0 : e.completedInstances) != null ? _d2 : []
      };
      if (e == null ? void 0 : e.id) {
        await this.eventManager.update({ ...e, ...eventData });
      } else {
        await this.eventManager.create(eventData);
      }
      (_e2 = this.onSave) == null ? void 0 : _e2.call(this);
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
var import_obsidian11 = require("obsidian");

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
  showFlaggedCount: true,
  notifMacOS: true,
  notifObsidian: true,
  notifSound: true,
  notifEvents: true,
  notifTasks: true,
  defaultEventDuration: 60,
  density: "comfortable",
  showCompletedCount: true,
  showTaskCountSubtitle: true,
  defaultCustomFields: []
};

// src/data/TaskManager.ts
var import_obsidian4 = require("obsidian");
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
      if (child instanceof import_obsidian4.TFile && child.extension === "md") {
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
    const path = (0, import_obsidian4.normalizePath)(`${this.tasksFolder}/${full.title}.md`);
    await this.app.vault.create(path, this.taskToMarkdown(full));
    return full;
  }
  async update(task) {
    var _a;
    const file = this.findFileForTask(task.id);
    if (!file) return;
    const expectedPath = (0, import_obsidian4.normalizePath)(`${this.tasksFolder}/${task.title}.md`);
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
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const fm = {
      id: task.id,
      title: task.title,
      "location": (_a = task.location) != null ? _a : null,
      status: task.status,
      priority: task.priority,
      tags: task.tags,
      projects: task.projects,
      "linked-notes": task.linkedNotes,
      "calendar-id": (_b = task.calendarId) != null ? _b : null,
      "due-date": (_c = task.dueDate) != null ? _c : null,
      "due-time": (_d = task.dueTime) != null ? _d : null,
      recurrence: (_e = task.recurrence) != null ? _e : null,
      "alert": (_f = task.alert) != null ? _f : "none",
      "time-estimate": (_g = task.timeEstimate) != null ? _g : null,
      "time-entries": task.timeEntries,
      "custom-fields": task.customFields,
      "completed-instances": task.completedInstances,
      "created-at": task.createdAt,
      "completed-at": (_h = task.completedAt) != null ? _h : null
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
        location: (_b = fm.location) != null ? _b : void 0,
        status: (_c = fm.status) != null ? _c : "todo",
        priority: (_d = fm.priority) != null ? _d : "none",
        dueDate: (_e = fm["due-date"]) != null ? _e : void 0,
        dueTime: (_f = fm["due-time"]) != null ? _f : void 0,
        recurrence: (_g = fm.recurrence) != null ? _g : void 0,
        alert: (_h = fm.alert) != null ? _h : "none",
        calendarId: (_i = fm["calendar-id"]) != null ? _i : void 0,
        tags: (_j = fm.tags) != null ? _j : [],
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
      if (!(child instanceof import_obsidian4.TFile)) continue;
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
var import_obsidian5 = require("obsidian");
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
      if (child instanceof import_obsidian5.TFile && child.extension === "md") {
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
    const path = (0, import_obsidian5.normalizePath)(`${this.eventsFolder}/${full.title}.md`);
    await this.app.vault.create(path, this.eventToMarkdown(full));
    return full;
  }
  async update(event) {
    var _a;
    const file = this.findFileForEvent(event.id);
    if (!file) return;
    const expectedPath = (0, import_obsidian5.normalizePath)(`${this.eventsFolder}/${event.title}.md`);
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
    var _a, _b, _c, _d, _e, _f, _g;
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
      "tags": (_f = event.tags) != null ? _f : [],
      "linked-notes": (_g = event.linkedNotes) != null ? _g : [],
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
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
        tags: (_i = fm["tags"]) != null ? _i : [],
        linkedNotes: (_j = fm["linked-notes"]) != null ? _j : [],
        linkedTaskIds: (_k = fm["linked-task-ids"]) != null ? _k : [],
        completedInstances: (_l = fm["completed-instances"]) != null ? _l : [],
        createdAt: (_m = fm["created-at"]) != null ? _m : (/* @__PURE__ */ new Date()).toISOString(),
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
      if (!(child instanceof import_obsidian5.TFile)) continue;
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
var import_obsidian8 = require("obsidian");

// src/ui/TaskModal.ts
var import_obsidian6 = require("obsidian");
var TaskModal = class extends import_obsidian6.Modal {
  constructor(app, taskManager, calendarManager, editingTask, onSave, onExpand, plugin) {
    super(app);
    this.taskManager = taskManager;
    this.calendarManager = calendarManager;
    this.editingTask = editingTask != null ? editingTask : null;
    this.onSave = onSave;
    this.onExpand = onExpand;
    this.plugin = plugin;
  }
  onOpen() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
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
    const locationInput = this.field(form, "Location").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Add location"
    });
    locationInput.value = (_b = t == null ? void 0 : t.location) != null ? _b : "";
    const row1 = form.createDiv("cf-row");
    const statusSelect = this.field(row1, "Status").createEl("select", { cls: "cf-select" });
    const statuses = [
      { value: "todo", label: "To do" },
      { value: "in-progress", label: "In progress" },
      { value: "done", label: "Done" },
      { value: "cancelled", label: "Cancelled" }
    ];
    const defaultStatus = (_e = (_d = (_c = this.plugin) == null ? void 0 : _c.settings) == null ? void 0 : _d.defaultTaskStatus) != null ? _e : "todo";
    for (const s of statuses) {
      const opt = statusSelect.createEl("option", { value: s.value, text: s.label });
      if (t ? t.status === s.value : s.value === defaultStatus) opt.selected = true;
    }
    const prioritySelect = this.field(row1, "Priority").createEl("select", { cls: "cf-select" });
    const priorities = [
      { value: "none", label: "None" },
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" }
    ];
    const defaultPriority = (_h = (_g = (_f = this.plugin) == null ? void 0 : _f.settings) == null ? void 0 : _g.defaultTaskPriority) != null ? _h : "none";
    for (const p of priorities) {
      const opt = prioritySelect.createEl("option", { value: p.value, text: p.label });
      if (t ? t.priority === p.value : p.value === defaultPriority) opt.selected = true;
    }
    const row2 = form.createDiv("cf-row");
    const dueDateInput = this.field(row2, "Date").createEl("input", {
      type: "date",
      cls: "cf-input"
    });
    dueDateInput.value = (_i = t == null ? void 0 : t.dueDate) != null ? _i : "";
    const dueTimeInput = this.field(row2, "Time").createEl("input", {
      type: "time",
      cls: "cf-input"
    });
    dueTimeInput.value = (_j = t == null ? void 0 : t.dueTime) != null ? _j : "";
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
    const calSelect = this.field(form, "Calendar").createEl("select", { cls: "cf-select" });
    const defaultCal = (_m = (_l = (_k = this.plugin) == null ? void 0 : _k.settings) == null ? void 0 : _l.defaultCalendarId) != null ? _m : "";
    calSelect.createEl("option", { value: "", text: "None" });
    for (const cal of calendars) {
      const opt = calSelect.createEl("option", { value: cal.id, text: cal.name });
      if (t ? t.calendarId === cal.id : cal.id === defaultCal) opt.selected = true;
    }
    const updateCalColor = () => {
      const cal = this.calendarManager.getById(calSelect.value);
      calSelect.style.borderLeftColor = cal ? CalendarManager.colorToHex(cal.color) : "transparent";
      calSelect.style.borderLeftWidth = "4px";
      calSelect.style.borderLeftStyle = "solid";
    };
    calSelect.addEventListener("change", updateCalColor);
    updateCalColor();
    const tagsInput = this.field(form, "Tags").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "work, personal  (comma separated)"
    });
    tagsInput.value = (_o = (_n = t == null ? void 0 : t.tags) == null ? void 0 : _n.join(", ")) != null ? _o : "";
    const defaultAlert = (_r = (_q = (_p = this.plugin) == null ? void 0 : _p.settings) == null ? void 0 : _q.defaultAlert) != null ? _r : "none";
    for (const a of taskAlerts) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if (t ? t.alert === a.value : a.value === defaultAlert) opt.selected = true;
    }
    if (!t) {
      const noneOpt = alertSelect.querySelector('option[value="none"]');
      if (noneOpt) noneOpt.selected = true;
    }
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
      var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2;
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
        notes: t == null ? void 0 : t.notes,
        location: locationInput.value || void 0,
        tags: tagsInput.value ? tagsInput.value.split(",").map((s) => s.trim()).filter(Boolean) : (_a2 = t == null ? void 0 : t.tags) != null ? _a2 : [],
        alert: alertSelect.value,
        tags: (_b2 = t == null ? void 0 : t.tags) != null ? _b2 : [],
        contexts: [],
        linkedNotes: (_c2 = t == null ? void 0 : t.linkedNotes) != null ? _c2 : [],
        projects: (_d2 = t == null ? void 0 : t.projects) != null ? _d2 : [],
        timeEstimate: t == null ? void 0 : t.timeEstimate,
        timeEntries: (_e2 = t == null ? void 0 : t.timeEntries) != null ? _e2 : [],
        customFields: (_f2 = t == null ? void 0 : t.customFields) != null ? _f2 : [],
        completedInstances: (_g2 = t == null ? void 0 : t.completedInstances) != null ? _g2 : []
      };
      if (t == null ? void 0 : t.id) {
        await this.taskManager.update({ ...t, ...taskData });
      } else {
        await this.taskManager.create(taskData);
      }
      (_h2 = this.onSave) == null ? void 0 : _h2.call(this);
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

// src/views/TaskFormView.ts
var import_obsidian7 = require("obsidian");
var TASK_FORM_VIEW_TYPE = "chronicle-task-form";
var TaskFormView = class extends import_obsidian7.ItemView {
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
    var _a, _b, _c, _d, _e, _f, _g;
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
    const locationInput = this.field(form, "Location").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Add location"
    });
    locationInput.value = (_b = t == null ? void 0 : t.location) != null ? _b : "";
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
    dueDateInput.value = (_c = t == null ? void 0 : t.dueDate) != null ? _c : "";
    const dueTimeField = this.field(row2, "Time");
    const dueTimeInput = dueTimeField.createEl("input", {
      type: "time",
      cls: "cf-input"
    });
    dueTimeInput.value = (_d = t == null ? void 0 : t.dueTime) != null ? _d : "";
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
    const tagsField = this.field(form, "Tags");
    const tagsInput = tagsField.createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "work, personal, urgent  (comma separated)"
    });
    tagsInput.value = (_e = t == null ? void 0 : t.tags.join(", ")) != null ? _e : "";
    const linkedField = this.field(form, "Linked notes");
    const linkedInput = linkedField.createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Projects/Website, Journal/2024  (comma separated)"
    });
    linkedInput.value = (_f = t == null ? void 0 : t.linkedNotes.join(", ")) != null ? _f : "";
    const notesField = this.field(form, "Notes");
    const notesInput = notesField.createEl("textarea", {
      cls: "cf-textarea",
      placeholder: "Add notes..."
    });
    notesInput.value = (_g = t == null ? void 0 : t.notes) != null ? _g : "";
    cancelBtn.addEventListener("click", () => {
      this.app.workspace.detachLeavesOfType(TASK_FORM_VIEW_TYPE);
    });
    const handleSave = async () => {
      var _a2, _b2, _c2, _d2, _e2;
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
          new import_obsidian7.Notice(`A task named "${title}" already exists.`, 4e3);
          titleInput.classList.add("cf-error");
          titleInput.focus();
          return;
        }
      }
      const taskData = {
        title,
        location: locationInput.value || void 0,
        status: statusSelect.value,
        priority: prioritySelect.value,
        dueDate: dueDateInput.value || void 0,
        dueTime: dueTimeInput.value || void 0,
        calendarId: calSelect.value || void 0,
        recurrence: recSelect.value || void 0,
        tags: tagsInput.value ? tagsInput.value.split(",").map((s) => s.trim()).filter(Boolean) : [],
        contexts: [],
        linkedNotes: linkedInput.value ? linkedInput.value.split(",").map((s) => s.trim()).filter(Boolean) : [],
        projects: (_a2 = t == null ? void 0 : t.projects) != null ? _a2 : [],
        timeEntries: (_b2 = t == null ? void 0 : t.timeEntries) != null ? _b2 : [],
        completedInstances: (_c2 = t == null ? void 0 : t.completedInstances) != null ? _c2 : [],
        customFields: (_d2 = t == null ? void 0 : t.customFields) != null ? _d2 : [],
        alert: alertSelect.value,
        notes: notesInput.value || void 0
      };
      if (t) {
        await this.taskManager.update({ ...t, ...taskData });
      } else {
        await this.taskManager.create(taskData);
      }
      (_e2 = this.onSave) == null ? void 0 : _e2.call(this);
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
var TaskView = class extends import_obsidian8.ItemView {
  constructor(leaf, taskManager, calendarManager, eventManager, plugin) {
    super(leaf);
    this.currentListId = "today";
    this.taskManager = taskManager;
    this.calendarManager = calendarManager;
    this.eventManager = eventManager;
    this.plugin = plugin;
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
    var _a, _b;
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
    const showSubtitle = (_b = this.plugin.settings.showTaskCountSubtitle) != null ? _b : true;
    if (countTasks.length > 0 && showSubtitle) {
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
      (t) => this.openTaskFullPage(t),
      this.plugin
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
var import_obsidian10 = require("obsidian");

// src/ui/EventModal.ts
var import_obsidian9 = require("obsidian");
var EventModal = class extends import_obsidian9.Modal {
  constructor(app, eventManager, calendarManager, editingEvent, onSave, onExpand) {
    super(app);
    this.eventManager = eventManager;
    this.calendarManager = calendarManager;
    this.editingEvent = editingEvent != null ? editingEvent : null;
    this.onSave = onSave;
    this.onExpand = onExpand;
  }
  onOpen() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("chronicle-event-modal");
    const e = this.editingEvent;
    const calendars = this.calendarManager.getAll();
    const header = contentEl.createDiv("cem-header");
    header.createDiv("cem-title").setText(e && e.id ? "Edit event" : "New event");
    const expandBtn = header.createEl("button", { cls: "cf-btn-ghost cem-expand-btn" });
    expandBtn.title = "Open as full page";
    expandBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
    expandBtn.addEventListener("click", () => {
      var _a2;
      this.close();
      (_a2 = this.onExpand) == null ? void 0 : _a2.call(this, e != null ? e : void 0);
    });
    const form = contentEl.createDiv("cem-form");
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
    const allDayField = this.field(form, "All day");
    const allDayWrap = allDayField.createDiv("cem-toggle-wrap");
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
    const tagsInput = this.field(form, "Tags").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "work, personal  (comma separated)"
    });
    tagsInput.value = (_i = (_h = e == null ? void 0 : e.tags) == null ? void 0 : _h.join(", ")) != null ? _i : "";
    const defaultAlert = (_l = (_k = (_j = this.plugin) == null ? void 0 : _j.settings) == null ? void 0 : _k.defaultAlert) != null ? _l : "none";
    for (const a of alerts) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if ((e == null ? void 0 : e.alert) === a.value) opt.selected = true;
    }
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
    const saveBtn = footer.createEl("button", {
      cls: "cf-btn-primary",
      text: e && e.id ? "Save" : "Add event"
    });
    cancelBtn.addEventListener("click", () => this.close());
    const handleSave = async () => {
      var _a2, _b2, _c2, _d2;
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
        tags: (_a2 = e == null ? void 0 : e.tags) != null ? _a2 : [],
        notes: e == null ? void 0 : e.notes,
        linkedTaskIds: (_b2 = e == null ? void 0 : e.linkedTaskIds) != null ? _b2 : [],
        completedInstances: (_c2 = e == null ? void 0 : e.completedInstances) != null ? _c2 : []
      };
      if (e && e.id) {
        await this.eventManager.update({ ...e, ...eventData });
      } else {
        await this.eventManager.create(eventData);
      }
      (_d2 = this.onSave) == null ? void 0 : _d2.call(this);
      this.close();
    };
    saveBtn.addEventListener("click", handleSave);
    titleInput.addEventListener("keydown", (e2) => {
      if (e2.key === "Enter") handleSave();
      if (e2.key === "Escape") this.close();
    });
  }
  field(parent, label) {
    const wrap = parent.createDiv("cf-field");
    wrap.createDiv("cf-label").setText(label);
    return wrap;
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
var CalendarView = class extends import_obsidian10.ItemView {
  constructor(leaf, eventManager, taskManager, calendarManager, plugin) {
    super(leaf);
    this.currentDate = /* @__PURE__ */ new Date();
    this.mode = "week";
    this._modeSet = false;
    this.eventManager = eventManager;
    this.taskManager = taskManager;
    this.calendarManager = calendarManager;
    this.plugin = plugin;
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
    var _a;
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("chronicle-cal-app");
    const tasks = await this.taskManager.getAll();
    if (!this._modeSet) {
      this.mode = (_a = this.plugin.settings.defaultCalendarView) != null ? _a : "week";
      this._modeSet = true;
    }
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
var ChroniclePlugin = class extends import_obsidian11.Plugin {
  async onload() {
    await this.loadSettings();
    this.calendarManager = new CalendarManager(
      this.settings.calendars,
      () => this.saveSettings()
    );
    this.taskManager = new TaskManager(this.app, this.settings.tasksFolder);
    this.eventManager = new EventManager(this.app, this.settings.eventsFolder);
    this.alertManager = new AlertManager(
      this.app,
      this.taskManager,
      this.eventManager,
      () => this.settings
    );
    this.alertManager.start();
    this.alertManager.stop();
    this.registerView(
      TASK_VIEW_TYPE,
      (leaf) => new TaskView(leaf, this.taskManager, this.calendarManager, this.eventManager, this)
    );
    this.registerView(
      TASK_FORM_VIEW_TYPE,
      (leaf) => new TaskFormView(leaf, this.taskManager, this.calendarManager)
    );
    this.registerView(
      CALENDAR_VIEW_TYPE,
      (leaf) => new CalendarView(leaf, this.eventManager, this.taskManager, this.calendarManager, this)
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
    this.addSettingTab(new ChronicleSettingsTab(this.app, this));
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3VpL1NldHRpbmdzVGFiLnRzIiwgInNyYy9kYXRhL0NhbGVuZGFyTWFuYWdlci50cyIsICJzcmMvZGF0YS9BbGVydE1hbmFnZXIudHMiLCAic3JjL3ZpZXdzL0V2ZW50Rm9ybVZpZXcudHMiLCAic3JjL3R5cGVzL2luZGV4LnRzIiwgInNyYy9kYXRhL1Rhc2tNYW5hZ2VyLnRzIiwgInNyYy9kYXRhL0V2ZW50TWFuYWdlci50cyIsICJzcmMvdmlld3MvVGFza1ZpZXcudHMiLCAic3JjL3VpL1Rhc2tNb2RhbC50cyIsICJzcmMvdmlld3MvVGFza0Zvcm1WaWV3LnRzIiwgInNyYy92aWV3cy9DYWxlbmRhclZpZXcudHMiLCAic3JjL3VpL0V2ZW50TW9kYWwudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IENocm9uaWNsZVNldHRpbmdzVGFiIH0gZnJvbSBcIi4vdWkvU2V0dGluZ3NUYWJcIjtcbmltcG9ydCB7IEFsZXJ0TWFuYWdlciB9IGZyb20gXCIuL2RhdGEvQWxlcnRNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVTZXR0aW5ncywgREVGQVVMVF9TRVRUSU5HUywgQ2hyb25pY2xlRXZlbnQgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgRXZlbnRGb3JtVmlldywgRVZFTlRfRk9STV9WSUVXX1RZUEUgfSBmcm9tIFwiLi92aWV3cy9FdmVudEZvcm1WaWV3XCI7XG5pbXBvcnQgeyBQbHVnaW4sIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZVNldHRpbmdzLCBERUZBVUxUX1NFVFRJTkdTIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IENhbGVuZGFyTWFuYWdlciB9IGZyb20gXCIuL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuL2RhdGEvVGFza01hbmFnZXJcIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuL2RhdGEvRXZlbnRNYW5hZ2VyXCI7XG5pbXBvcnQgeyBUYXNrVmlldywgVEFTS19WSUVXX1RZUEUgfSBmcm9tIFwiLi92aWV3cy9UYXNrVmlld1wiO1xuaW1wb3J0IHsgVGFza0Zvcm1WaWV3LCBUQVNLX0ZPUk1fVklFV19UWVBFIH0gZnJvbSBcIi4vdmlld3MvVGFza0Zvcm1WaWV3XCI7XG5pbXBvcnQgeyBDYWxlbmRhclZpZXcsIENBTEVOREFSX1ZJRVdfVFlQRSB9IGZyb20gXCIuL3ZpZXdzL0NhbGVuZGFyVmlld1wiO1xuaW1wb3J0IHsgRXZlbnRNb2RhbCB9IGZyb20gXCIuL3VpL0V2ZW50TW9kYWxcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2hyb25pY2xlUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3M6IENocm9uaWNsZVNldHRpbmdzO1xuICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyO1xuICBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcjtcbiAgYWxlcnRNYW5hZ2VyOiBBbGVydE1hbmFnZXI7XG5cbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IG5ldyBDYWxlbmRhck1hbmFnZXIoXG4gICAgICB0aGlzLnNldHRpbmdzLmNhbGVuZGFycyxcbiAgICAgICgpID0+IHRoaXMuc2F2ZVNldHRpbmdzKClcbiAgICApO1xuICAgIHRoaXMudGFza01hbmFnZXIgID0gbmV3IFRhc2tNYW5hZ2VyKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLnRhc2tzRm9sZGVyKTtcbiAgICB0aGlzLmV2ZW50TWFuYWdlciA9IG5ldyBFdmVudE1hbmFnZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MuZXZlbnRzRm9sZGVyKTtcblxuICAgIHRoaXMuYWxlcnRNYW5hZ2VyID0gbmV3IEFsZXJ0TWFuYWdlcihcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy50YXNrTWFuYWdlcixcbiAgICAgIHRoaXMuZXZlbnRNYW5hZ2VyLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5nc1xuICAgICk7XG4gICAgdGhpcy5hbGVydE1hbmFnZXIuc3RhcnQoKTtcbiAgICB0aGlzLmFsZXJ0TWFuYWdlci5zdG9wKCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgIFRBU0tfVklFV19UWVBFLFxuICAgICAgKGxlYWYpID0+IG5ldyBUYXNrVmlldyhsZWFmLCB0aGlzLnRhc2tNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlciwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgIFRBU0tfRk9STV9WSUVXX1RZUEUsXG4gICAgICAobGVhZikgPT4gbmV3IFRhc2tGb3JtVmlldyhsZWFmLCB0aGlzLnRhc2tNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlcilcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJWaWV3KFxuICAgICAgQ0FMRU5EQVJfVklFV19UWVBFLFxuICAgICAgKGxlYWYpID0+IG5ldyBDYWxlbmRhclZpZXcobGVhZiwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMudGFza01hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlclZpZXcoXG4gICAgICBFVkVOVF9GT1JNX1ZJRVdfVFlQRSxcbiAgICAgIChsZWFmKSA9PiBuZXcgRXZlbnRGb3JtVmlldyhsZWFmLCB0aGlzLmV2ZW50TWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIpXG4gICAgKTtcblxuICAgIC8vIFJpYmJvbiBcdTIwMTQgdGFza3MgKGNoZWNrbGlzdCBpY29uKVxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcImNoZWNrLWNpcmNsZVwiLCBcIkNocm9uaWNsZSBUYXNrc1wiLCAoKSA9PiB0aGlzLmFjdGl2YXRlVGFza1ZpZXcoKSk7XG5cbiAgICAvLyBSaWJib24gXHUyMDE0IGNhbGVuZGFyXG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwiY2FsZW5kYXJcIiwgXCJDaHJvbmljbGUgQ2FsZW5kYXJcIiwgKCkgPT4gdGhpcy5hY3RpdmF0ZUNhbGVuZGFyVmlldygpKTtcblxuICAgIC8vIENvbW1hbmRzXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9wZW4tY2hyb25pY2xlXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gdGFzayBkYXNoYm9hcmRcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLmFjdGl2YXRlVGFza1ZpZXcoKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib3Blbi1jYWxlbmRhclwiLFxuICAgICAgbmFtZTogXCJPcGVuIGNhbGVuZGFyXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5hY3RpdmF0ZUNhbGVuZGFyVmlldygpLFxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJuZXctdGFza1wiLFxuICAgICAgbmFtZTogXCJOZXcgdGFza1wiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIl0sIGtleTogXCJuXCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5vcGVuVGFza0Zvcm0oKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibmV3LWV2ZW50XCIsXG4gICAgICBuYW1lOiBcIk5ldyBldmVudFwiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIm5cIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm9wZW5FdmVudE1vZGFsKCksXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IENocm9uaWNsZVNldHRpbmdzVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cbiAgICBjb25zb2xlLmxvZyhcIkNocm9uaWNsZSBsb2FkZWQgXHUyNzEzXCIpO1xuICB9XG5cbiAgYXN5bmMgYWN0aXZhdGVUYXNrVmlldygpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgbGV0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfVklFV19UWVBFKVswXTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogVEFTS19WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBhc3luYyBhY3RpdmF0ZUNhbGVuZGFyVmlldygpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgbGV0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKENBTEVOREFSX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IENBTEVOREFSX1ZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIH1cbiAgICB3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5UYXNrRm9ybSgpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfRk9STV9WSUVXX1RZUEUpWzBdO1xuICAgIGlmIChleGlzdGluZykgZXhpc3RpbmcuZGV0YWNoKCk7XG4gICAgY29uc3QgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogVEFTS19GT1JNX1ZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgb3BlbkV2ZW50TW9kYWwoZXZlbnQ/OiBDaHJvbmljbGVFdmVudCkge1xuICAgIG5ldyBFdmVudE1vZGFsKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLmV2ZW50TWFuYWdlcixcbiAgICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLFxuICAgICAgZXZlbnQsXG4gICAgICB1bmRlZmluZWQsXG4gICAgICAoZSkgPT4gdGhpcy5vcGVuRXZlbnRGdWxsUGFnZShlKVxuICAgICkub3BlbigpO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShUQVNLX1ZJRVdfVFlQRSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShUQVNLX0ZPUk1fVklFV19UWVBFKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKENBTEVOREFSX1ZJRVdfVFlQRSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5FdmVudEZ1bGxQYWdlKGV2ZW50PzogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEVWRU5UX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBpZiAoZXhpc3RpbmcpIGV4aXN0aW5nLmRldGFjaCgpO1xuICAgIGNvbnN0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IEVWRU5UX0ZPUk1fVklFV19UWVBFLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7XG4gICAgY29uc3QgZm9ybUxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEVWRU5UX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBjb25zdCBmb3JtVmlldyA9IGZvcm1MZWFmPy52aWV3IGFzIEV2ZW50Rm9ybVZpZXcgfCB1bmRlZmluZWQ7XG4gICAgaWYgKGZvcm1WaWV3ICYmIGV2ZW50KSBmb3JtVmlldy5sb2FkRXZlbnQoZXZlbnQpO1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSBDaHJvbmljbGVQbHVnaW4gZnJvbSBcIi4uL21haW5cIjtcbmltcG9ydCB7IENhbGVuZGFyQ29sb3IsIENocm9uaWNsZUNhbGVuZGFyLCBUYXNrU3RhdHVzLCBUYXNrUHJpb3JpdHksIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcblxuZXhwb3J0IGNsYXNzIENocm9uaWNsZVNldHRpbmdzVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHByaXZhdGUgcGx1Z2luOiBDaHJvbmljbGVQbHVnaW47XG4gIHByaXZhdGUgYWN0aXZlVGFiOiBzdHJpbmcgPSBcImdlbmVyYWxcIjtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBDaHJvbmljbGVQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5hZGRDbGFzcyhcImNocm9uaWNsZS1zZXR0aW5nc1wiKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBUYWIgYmFyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHRhYkJhciA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdihcImNocm9uaWNsZS10YWItYmFyXCIpO1xuICAgIGNvbnN0IHRhYnMgPSBbXG4gICAgICB7IGlkOiBcImdlbmVyYWxcIiwgICAgbGFiZWw6IFwiR2VuZXJhbFwiIH0sXG4gICAgICB7IGlkOiBcImNhbGVuZGFyXCIsICAgbGFiZWw6IFwiQ2FsZW5kYXJcIiB9LFxuICAgICAgeyBpZDogXCJyZW1pbmRlcnNcIiwgIGxhYmVsOiBcIlJlbWluZGVyc1wiIH0sXG4gICAgICB7IGlkOiBcImFwcGVhcmFuY2VcIiwgbGFiZWw6IFwiQXBwZWFyYW5jZVwiIH0sXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgdGFiIG9mIHRhYnMpIHtcbiAgICAgIGNvbnN0IHRhYkVsID0gdGFiQmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS10YWJcIik7XG4gICAgICB0YWJFbC5zZXRUZXh0KHRhYi5sYWJlbCk7XG4gICAgICBpZiAodGhpcy5hY3RpdmVUYWIgPT09IHRhYi5pZCkgdGFiRWwuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICB0YWJFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmFjdGl2ZVRhYiA9IHRhYi5pZDtcbiAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgVGFiIGNvbnRlbnQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgY29udGVudCA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdihcImNocm9uaWNsZS10YWItY29udGVudFwiKTtcblxuICAgIHN3aXRjaCAodGhpcy5hY3RpdmVUYWIpIHtcbiAgICAgIGNhc2UgXCJnZW5lcmFsXCI6ICAgIHRoaXMucmVuZGVyR2VuZXJhbChjb250ZW50KTsgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiY2FsZW5kYXJcIjogICB0aGlzLnJlbmRlckNhbGVuZGFyKGNvbnRlbnQpOyAgIGJyZWFrO1xuICAgICAgY2FzZSBcInJlbWluZGVyc1wiOiAgdGhpcy5yZW5kZXJSZW1pbmRlcnMoY29udGVudCk7ICBicmVhaztcbiAgICAgIGNhc2UgXCJhcHBlYXJhbmNlXCI6IHRoaXMucmVuZGVyQXBwZWFyYW5jZShjb250ZW50KTsgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEdlbmVyYWwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSByZW5kZXJHZW5lcmFsKGVsOiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMuc3ViSGVhZGVyKGVsLCBcIlN0b3JhZ2VcIik7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiVGFza3MgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIldoZXJlIHRhc2sgbm90ZXMgYXJlIHN0b3JlZCBpbiB5b3VyIHZhdWx0LlwiKVxuICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XG4gICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIkNocm9uaWNsZS9UYXNrc1wiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MudGFza3NGb2xkZXIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50YXNrc0ZvbGRlciA9IHZhbHVlIHx8IFwiQ2hyb25pY2xlL1Rhc2tzXCI7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkV2ZW50cyBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiV2hlcmUgZXZlbnQgbm90ZXMgYXJlIHN0b3JlZCBpbiB5b3VyIHZhdWx0LlwiKVxuICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XG4gICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIkNocm9uaWNsZS9FdmVudHNcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmV2ZW50c0ZvbGRlcilcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmV2ZW50c0ZvbGRlciA9IHZhbHVlIHx8IFwiQ2hyb25pY2xlL0V2ZW50c1wiO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJUaW1lIGZvcm1hdFwiKVxuICAgICAgLnNldERlc2MoXCJIb3cgdGltZXMgYXJlIGRpc3BsYXllZCB0aHJvdWdob3V0IENocm9uaWNsZS5cIilcbiAgICAgIC5hZGREcm9wZG93bihkcm9wID0+IGRyb3BcbiAgICAgICAgLmFkZE9wdGlvbihcIjEyaFwiLCBcIjEyLWhvdXIgKDI6MzAgUE0pXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCIyNGhcIiwgXCIyNC1ob3VyICgxNDozMClcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnRpbWVGb3JtYXQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50aW1lRm9ybWF0ID0gdmFsdWUgYXMgXCIxMmhcIiB8IFwiMjRoXCI7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgdGhpcy5kaXZpZGVyKGVsKTtcbiAgICB0aGlzLnN1YkhlYWRlcihlbCwgXCJOb3RpZmljYXRpb25zXCIpO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIm1hY09TIHN5c3RlbSBub3RpZmljYXRpb25cIilcbiAgICAgIC5zZXREZXNjKFwiU2hvdyBhIG5hdGl2ZSBtYWNPUyBub3RpZmljYXRpb24gYmFubmVyIHdoZW4gYW4gYWxlcnQgZmlyZXMuXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90aWZNYWNPUyA/PyB0cnVlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90aWZNYWNPUyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJPYnNpZGlhbiBpbi1hcHAgdG9hc3RcIilcbiAgICAgIC5zZXREZXNjKFwiU2hvdyBhIGJhbm5lciBpbnNpZGUgT2JzaWRpYW4gd2hlbiBhbiBhbGVydCBmaXJlcy5cIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3RpZk9ic2lkaWFuID8/IHRydWUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3RpZk9ic2lkaWFuID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIlNvdW5kXCIpXG4gICAgICAuc2V0RGVzYyhcIlBsYXkgYSBjaGltZSB3aGVuIGFuIGFsZXJ0IGZpcmVzLlwiKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+IHRcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGlmU291bmQgPz8gdHJ1ZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGlmU291bmQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiQWxlcnQgZm9yIGV2ZW50c1wiKVxuICAgICAgLnNldERlc2MoXCJFbmFibGUgYWxlcnRzIGZvciBjYWxlbmRhciBldmVudHMuXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90aWZFdmVudHMgPz8gdHJ1ZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGlmRXZlbnRzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkFsZXJ0IGZvciB0YXNrc1wiKVxuICAgICAgLnNldERlc2MoXCJFbmFibGUgYWxlcnRzIGZvciB0YXNrcyB3aXRoIGEgZHVlIHRpbWUuXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90aWZUYXNrcyA/PyB0cnVlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90aWZUYXNrcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJTZW5kIHRlc3Qgbm90aWZpY2F0aW9uXCIpXG4gICAgICAuc2V0RGVzYyhcIkZpcmVzIGEgdGVzdCBhbGVydCB1c2luZyB5b3VyIGN1cnJlbnQgc2V0dGluZ3MuXCIpXG4gICAgICAuYWRkQnV0dG9uKGJ0biA9PiBidG5cbiAgICAgICAgLnNldEJ1dHRvblRleHQoXCJUZXN0IG5vd1wiKVxuICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uYWxlcnRNYW5hZ2VyLmZpcmUoXG4gICAgICAgICAgICBcInNldHRpbmdzLXRlc3RcIixcbiAgICAgICAgICAgIFwiQ2hyb25pY2xlIHRlc3RcIixcbiAgICAgICAgICAgIFwiWW91ciBub3RpZmljYXRpb25zIGFyZSB3b3JraW5nLlwiLFxuICAgICAgICAgICAgXCJldmVudFwiXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5hbGVydE1hbmFnZXJbXCJmaXJlZEFsZXJ0c1wiXS5kZWxldGUoXCJzZXR0aW5ncy10ZXN0XCIpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBDYWxlbmRhciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHJlbmRlckNhbGVuZGFyKGVsOiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMuc3ViSGVhZGVyKGVsLCBcIkNhbGVuZGFyIGRlZmF1bHRzXCIpO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIlN0YXJ0IG9mIHdlZWtcIilcbiAgICAgIC5zZXREZXNjKFwiV2hpY2ggZGF5IHRoZSBjYWxlbmRhciB3ZWVrIHN0YXJ0cyBvbi5cIilcbiAgICAgIC5hZGREcm9wZG93bihkcm9wID0+IGRyb3BcbiAgICAgICAgLmFkZE9wdGlvbihcIjBcIiwgXCJTdW5kYXlcIilcbiAgICAgICAgLmFkZE9wdGlvbihcIjFcIiwgXCJNb25kYXlcIilcbiAgICAgICAgLmFkZE9wdGlvbihcIjZcIiwgXCJTYXR1cmRheVwiKVxuICAgICAgICAuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLnN0YXJ0T2ZXZWVrKSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN0YXJ0T2ZXZWVrID0gcGFyc2VJbnQodmFsdWUpIGFzIDAgfCAxIHwgNjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCB2aWV3XCIpXG4gICAgICAuc2V0RGVzYyhcIldoaWNoIHZpZXcgb3BlbnMgd2hlbiB5b3UgbGF1bmNoIHRoZSBjYWxlbmRhci5cIilcbiAgICAgIC5hZGREcm9wZG93bihkcm9wID0+IGRyb3BcbiAgICAgICAgLmFkZE9wdGlvbihcImRheVwiLCAgIFwiRGF5XCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJ3ZWVrXCIsICBcIldlZWtcIilcbiAgICAgICAgLmFkZE9wdGlvbihcIm1vbnRoXCIsIFwiTW9udGhcIilcbiAgICAgICAgLmFkZE9wdGlvbihcInllYXJcIiwgIFwiWWVhclwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdENhbGVuZGFyVmlldylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRDYWxlbmRhclZpZXcgPSB2YWx1ZSBhcyBcImRheVwifFwid2Vla1wifFwibW9udGhcInxcInllYXJcIjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCBjYWxlbmRhclwiKVxuICAgICAgLnNldERlc2MoXCJDYWxlbmRhciBhc3NpZ25lZCB0byBuZXcgZXZlbnRzIGJ5IGRlZmF1bHQuXCIpXG4gICAgICAuYWRkRHJvcGRvd24oZHJvcCA9PiB7XG4gICAgICAgIGRyb3AuYWRkT3B0aW9uKFwiXCIsIFwiTm9uZVwiKTtcbiAgICAgICAgZm9yIChjb25zdCBjYWwgb2YgdGhpcy5wbHVnaW4uY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpKSB7XG4gICAgICAgICAgZHJvcC5hZGRPcHRpb24oY2FsLmlkLCBjYWwubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZHJvcC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Q2FsZW5kYXJJZCA/PyBcIlwiKTtcbiAgICAgICAgZHJvcC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Q2FsZW5kYXJJZCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgZXZlbnQgZHVyYXRpb25cIilcbiAgICAgIC5zZXREZXNjKFwiSG93IGxvbmcgbmV3IGV2ZW50cyBsYXN0IGJ5IGRlZmF1bHQgKG1pbnV0ZXMpLlwiKVxuICAgICAgLmFkZFNsaWRlcihzbGlkZXIgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMTUsIDQ4MCwgMTUpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0RXZlbnREdXJhdGlvbiA/PyA2MClcbiAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRFdmVudER1cmF0aW9uID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgZXZlbnQgYWxlcnRcIilcbiAgICAgIC5zZXREZXNjKFwiQWxlcnQgb2Zmc2V0IGFwcGxpZWQgdG8gbmV3IGV2ZW50cyBieSBkZWZhdWx0LlwiKVxuICAgICAgLmFkZERyb3Bkb3duKGRyb3AgPT4gdGhpcy5hZGRBbGVydE9wdGlvbnMoZHJvcClcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRBbGVydClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRBbGVydCA9IHZhbHVlIGFzIEFsZXJ0T2Zmc2V0O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIHRoaXMuZGl2aWRlcihlbCk7XG4gICAgdGhpcy5zdWJIZWFkZXIoZWwsIFwiTXkgQ2FsZW5kYXJzXCIpO1xuICAgIGVsLmNyZWF0ZURpdihcImNzLWRlc2NcIikuc2V0VGV4dChcIkFkZCwgcmVuYW1lLCByZWNvbG9yLCBvciBkZWxldGUgY2FsZW5kYXJzLlwiKTtcblxuICAgIGZvciAoY29uc3QgY2FsIG9mIHRoaXMucGx1Z2luLmNhbGVuZGFyTWFuYWdlci5nZXRBbGwoKSkge1xuICAgICAgdGhpcy5yZW5kZXJDYWxlbmRhclJvdyhlbCwgY2FsLCB0aGlzLnBsdWdpbi5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCkubGVuZ3RoID09PSAxKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpdmlkZXIoZWwpO1xuXG4gICAgY29uc3QgYWRkUm93ID0gZWwuY3JlYXRlRGl2KFwiY3MtYWRkLXJvd1wiKTtcbiAgICBjb25zdCBuYW1lSW5wdXQgPSBhZGRSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIGNsczogXCJjcy10ZXh0LWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJOZXcgY2FsZW5kYXIgbmFtZVwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY29sb3JTZWxlY3QgPSBhZGRSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY29sb3JcIiwgY2xzOiBcImNzLWNvbG9yLXBpY2tlclwiIH0pO1xuICAgIGNvbG9yU2VsZWN0LnZhbHVlID0gXCIjMzc4QUREXCI7XG5cbiAgICBjb25zdCBhZGRCdG4gPSBhZGRSb3cuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY3MtYnRuLXByaW1hcnlcIiwgdGV4dDogXCJBZGQgY2FsZW5kYXJcIiB9KTtcbiAgICBhZGRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBuYW1lSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCFuYW1lKSB7IG5hbWVJbnB1dC5mb2N1cygpOyByZXR1cm47IH1cbiAgICAgIHRoaXMucGx1Z2luLmNhbGVuZGFyTWFuYWdlci5jcmVhdGUobmFtZSwgY29sb3JTZWxlY3QudmFsdWUgYXMgQ2FsZW5kYXJDb2xvcik7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgIG5ldyBOb3RpY2UoYENhbGVuZGFyIFwiJHtuYW1lfVwiIGNyZWF0ZWRgKTtcbiAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJDYWxlbmRhclJvdyhlbDogSFRNTEVsZW1lbnQsIGNhbDogQ2hyb25pY2xlQ2FsZW5kYXIsIGlzT25seTogYm9vbGVhbikge1xuICAgIGNvbnN0IHNldHRpbmcgPSBuZXcgU2V0dGluZyhlbCk7XG5cbiAgICAvLyBDb2xvciBkb3QgcHJldmlld1xuICAgIGNvbnN0IGRvdCA9IHNldHRpbmcubmFtZUVsLmNyZWF0ZURpdihcImNzLWNhbC1kb3RcIik7XG4gICAgZG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcik7XG4gICAgc2V0dGluZy5uYW1lRWwuY3JlYXRlU3Bhbih7IHRleHQ6IGNhbC5uYW1lIH0pO1xuXG4gICAgc2V0dGluZ1xuICAgICAgLmFkZENvbG9yUGlja2VyKHBpY2tlciA9PiB7XG4gICAgICAgIC8vIENvbnZlcnQgbmFtZWQgY29sb3JzIHRvIGhleCBmb3IgdGhlIHBpY2tlclxuICAgICAgICBwaWNrZXIuc2V0VmFsdWUoQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSk7XG4gICAgICAgIHBpY2tlci5vbkNoYW5nZShhc3luYyAoaGV4KSA9PiB7XG4gICAgICAgICAgZG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGhleDtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5jYWxlbmRhck1hbmFnZXIudXBkYXRlKGNhbC5pZCwgeyBjb2xvcjogaGV4IH0pO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAuYWRkVGV4dCh0ZXh0ID0+IHRleHRcbiAgICAgICAgLnNldFZhbHVlKGNhbC5uYW1lKVxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJDYWxlbmRhciBuYW1lXCIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkgcmV0dXJuO1xuICAgICAgICAgIHRoaXMucGx1Z2luLmNhbGVuZGFyTWFuYWdlci51cGRhdGUoY2FsLmlkLCB7IG5hbWU6IHZhbHVlLnRyaW0oKSB9KTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUoY2FsLmlzVmlzaWJsZSlcbiAgICAgICAgLnNldFRvb2x0aXAoXCJTaG93IGluIHZpZXdzXCIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5jYWxlbmRhck1hbmFnZXIudXBkYXRlKGNhbC5pZCwgeyBpc1Zpc2libGU6IHZhbHVlIH0pO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbihidG4gPT4gYnRuXG4gICAgICAgIC5zZXRJY29uKFwidHJhc2hcIilcbiAgICAgICAgLnNldFRvb2x0aXAoXCJEZWxldGUgY2FsZW5kYXJcIilcbiAgICAgICAgLnNldERpc2FibGVkKGlzT25seSlcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLmNhbGVuZGFyTWFuYWdlci5kZWxldGUoY2FsLmlkKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICBuZXcgTm90aWNlKGBDYWxlbmRhciBcIiR7Y2FsLm5hbWV9XCIgZGVsZXRlZGApO1xuICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBSZW1pbmRlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSByZW5kZXJSZW1pbmRlcnMoZWw6IEhUTUxFbGVtZW50KSB7XG4gICAgdGhpcy5zdWJIZWFkZXIoZWwsIFwiVGFzayBkZWZhdWx0c1wiKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJEZWZhdWx0IHN0YXR1c1wiKVxuICAgICAgLmFkZERyb3Bkb3duKGRyb3AgPT4gZHJvcFxuICAgICAgICAuYWRkT3B0aW9uKFwidG9kb1wiLCAgICAgICAgXCJUbyBkb1wiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiaW4tcHJvZ3Jlc3NcIiwgXCJJbiBwcm9ncmVzc1wiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiZG9uZVwiLCAgICAgICAgXCJEb25lXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJjYW5jZWxsZWRcIiwgICBcIkNhbmNlbGxlZFwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRhc2tTdGF0dXMpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VGFza1N0YXR1cyA9IHZhbHVlIGFzIFRhc2tTdGF0dXM7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgcHJpb3JpdHlcIilcbiAgICAgIC5hZGREcm9wZG93bihkcm9wID0+IGRyb3BcbiAgICAgICAgLmFkZE9wdGlvbihcIm5vbmVcIiwgICBcIk5vbmVcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImxvd1wiLCAgICBcIkxvd1wiKVxuICAgICAgICAuYWRkT3B0aW9uKFwibWVkaXVtXCIsIFwiTWVkaXVtXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJoaWdoXCIsICAgXCJIaWdoXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VGFza1ByaW9yaXR5KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRhc2tQcmlvcml0eSA9IHZhbHVlIGFzIFRhc2tQcmlvcml0eTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCBhbGVydFwiKVxuICAgICAgLnNldERlc2MoXCJBbGVydCBvZmZzZXQgYXBwbGllZCB0byBuZXcgdGFza3MgYnkgZGVmYXVsdC5cIilcbiAgICAgIC5hZGREcm9wZG93bihkcm9wID0+IHRoaXMuYWRkQWxlcnRPcHRpb25zKGRyb3ApXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0QWxlcnQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0QWxlcnQgPSB2YWx1ZSBhcyBBbGVydE9mZnNldDtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCBjYWxlbmRhclwiKVxuICAgICAgLnNldERlc2MoXCJDYWxlbmRhciBhc3NpZ25lZCB0byBuZXcgdGFza3MgYnkgZGVmYXVsdC5cIilcbiAgICAgIC5hZGREcm9wZG93bihkcm9wID0+IHtcbiAgICAgICAgZHJvcC5hZGRPcHRpb24oXCJcIiwgXCJOb25lXCIpO1xuICAgICAgICBmb3IgKGNvbnN0IGNhbCBvZiB0aGlzLnBsdWdpbi5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCkpIHtcbiAgICAgICAgICBkcm9wLmFkZE9wdGlvbihjYWwuaWQsIGNhbC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBkcm9wLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRDYWxlbmRhcklkID8/IFwiXCIpO1xuICAgICAgICBkcm9wLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRDYWxlbmRhcklkID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICB0aGlzLmRpdmlkZXIoZWwpO1xuICAgIHRoaXMuc3ViSGVhZGVyKGVsLCBcIlNtYXJ0IGxpc3QgdmlzaWJpbGl0eVwiKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IFRvZGF5IGNvdW50XCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1RvZGF5Q291bnQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93VG9kYXlDb3VudCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IFNjaGVkdWxlZCBjb3VudFwiKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+IHRcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dTY2hlZHVsZWRDb3VudClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dTY2hlZHVsZWRDb3VudCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IEZsYWdnZWQgY291bnRcIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93RmxhZ2dlZENvdW50KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd0ZsYWdnZWRDb3VudCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBBcHBlYXJhbmNlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyQXBwZWFyYW5jZShlbDogSFRNTEVsZW1lbnQpIHtcbiAgICB0aGlzLnN1YkhlYWRlcihlbCwgXCJMYXlvdXRcIik7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiVGFzayBsaXN0IGRlbnNpdHlcIilcbiAgICAgIC5zZXREZXNjKFwiQ29tZm9ydGFibGUgYWRkcyBtb3JlIHBhZGRpbmcgYmV0d2VlbiB0YXNrIHJvd3MuXCIpXG4gICAgICAuYWRkRHJvcGRvd24oZHJvcCA9PiBkcm9wXG4gICAgICAgIC5hZGRPcHRpb24oXCJjb21wYWN0XCIsICAgICBcIkNvbXBhY3RcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImNvbWZvcnRhYmxlXCIsIFwiQ29tZm9ydGFibGVcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlbnNpdHkgPz8gXCJjb21mb3J0YWJsZVwiKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVuc2l0eSA9IHZhbHVlIGFzIFwiY29tcGFjdFwiIHwgXCJjb21mb3J0YWJsZVwiO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IGNvbXBsZXRlZCBjb3VudFwiKVxuICAgICAgLnNldERlc2MoXCJTaG93IHRoZSBudW1iZXIgb2YgY29tcGxldGVkIHRhc2tzIG5leHQgdG8gdGhlIENvbXBsZXRlZCBlbnRyeS5cIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93Q29tcGxldGVkQ291bnQgPz8gdHJ1ZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dDb21wbGV0ZWRDb3VudCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IHRhc2sgY291bnQgc3VidGl0bGVcIilcbiAgICAgIC5zZXREZXNjKFwiU2hvdyAnMyB0YXNrcycgdW5kZXIgdGhlIGxpc3QgdGl0bGUgaW4gdGhlIG1haW4gcGFuZWwuXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1Rhc2tDb3VudFN1YnRpdGxlID8/IHRydWUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93VGFza0NvdW50U3VidGl0bGUgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgSGVscGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHN1YkhlYWRlcihlbDogSFRNTEVsZW1lbnQsIHRpdGxlOiBzdHJpbmcpIHtcbiAgICBlbC5jcmVhdGVEaXYoXCJjcy1zdWItaGVhZGVyXCIpLnNldFRleHQodGl0bGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBkaXZpZGVyKGVsOiBIVE1MRWxlbWVudCkge1xuICAgIGVsLmNyZWF0ZURpdihcImNzLWRpdmlkZXJcIik7XG4gIH1cblxuICBwcml2YXRlIGFkZEFsZXJ0T3B0aW9ucyhkcm9wOiBhbnkpIHtcbiAgICByZXR1cm4gZHJvcFxuICAgICAgLmFkZE9wdGlvbihcIm5vbmVcIiwgICAgXCJOb25lXCIpXG4gICAgICAuYWRkT3B0aW9uKFwiYXQtdGltZVwiLCBcIkF0IHRpbWVcIilcbiAgICAgIC5hZGRPcHRpb24oXCI1bWluXCIsICAgIFwiNSBtaW51dGVzIGJlZm9yZVwiKVxuICAgICAgLmFkZE9wdGlvbihcIjEwbWluXCIsICAgXCIxMCBtaW51dGVzIGJlZm9yZVwiKVxuICAgICAgLmFkZE9wdGlvbihcIjE1bWluXCIsICAgXCIxNSBtaW51dGVzIGJlZm9yZVwiKVxuICAgICAgLmFkZE9wdGlvbihcIjMwbWluXCIsICAgXCIzMCBtaW51dGVzIGJlZm9yZVwiKVxuICAgICAgLmFkZE9wdGlvbihcIjFob3VyXCIsICAgXCIxIGhvdXIgYmVmb3JlXCIpXG4gICAgICAuYWRkT3B0aW9uKFwiMmhvdXJzXCIsICBcIjIgaG91cnMgYmVmb3JlXCIpXG4gICAgICAuYWRkT3B0aW9uKFwiMWRheVwiLCAgICBcIjEgZGF5IGJlZm9yZVwiKVxuICAgICAgLmFkZE9wdGlvbihcIjJkYXlzXCIsICAgXCIyIGRheXMgYmVmb3JlXCIpXG4gICAgICAuYWRkT3B0aW9uKFwiMXdlZWtcIiwgICBcIjEgd2VlayBiZWZvcmVcIik7XG4gIH1cbn0iLCAiaW1wb3J0IHsgQ2hyb25pY2xlQ2FsZW5kYXIsIENhbGVuZGFyQ29sb3IgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIENhbGVuZGFyTWFuYWdlciB7XG4gIHByaXZhdGUgY2FsZW5kYXJzOiBDaHJvbmljbGVDYWxlbmRhcltdO1xuICBwcml2YXRlIG9uVXBkYXRlOiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGNhbGVuZGFyczogQ2hyb25pY2xlQ2FsZW5kYXJbXSwgb25VcGRhdGU6ICgpID0+IHZvaWQpIHtcbiAgICB0aGlzLmNhbGVuZGFycyA9IGNhbGVuZGFycztcbiAgICB0aGlzLm9uVXBkYXRlID0gb25VcGRhdGU7XG4gIH1cblxuICBnZXRBbGwoKTogQ2hyb25pY2xlQ2FsZW5kYXJbXSB7XG4gICAgcmV0dXJuIFsuLi50aGlzLmNhbGVuZGFyc107XG4gIH1cblxuICBnZXRCeUlkKGlkOiBzdHJpbmcpOiBDaHJvbmljbGVDYWxlbmRhciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY2FsZW5kYXJzLmZpbmQoKGMpID0+IGMuaWQgPT09IGlkKTtcbiAgfVxuXG4gIGNyZWF0ZShuYW1lOiBzdHJpbmcsIGNvbG9yOiBDYWxlbmRhckNvbG9yKTogQ2hyb25pY2xlQ2FsZW5kYXIge1xuICAgIGNvbnN0IGNhbGVuZGFyOiBDaHJvbmljbGVDYWxlbmRhciA9IHtcbiAgICAgIGlkOiB0aGlzLmdlbmVyYXRlSWQobmFtZSksXG4gICAgICBuYW1lLFxuICAgICAgY29sb3IsXG4gICAgICBpc1Zpc2libGU6IHRydWUsXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuICAgIHRoaXMuY2FsZW5kYXJzLnB1c2goY2FsZW5kYXIpO1xuICAgIHRoaXMub25VcGRhdGUoKTtcbiAgICByZXR1cm4gY2FsZW5kYXI7XG4gIH1cblxuICB1cGRhdGUoaWQ6IHN0cmluZywgY2hhbmdlczogUGFydGlhbDxDaHJvbmljbGVDYWxlbmRhcj4pOiB2b2lkIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLmNhbGVuZGFycy5maW5kSW5kZXgoKGMpID0+IGMuaWQgPT09IGlkKTtcbiAgICBpZiAoaWR4ID09PSAtMSkgcmV0dXJuO1xuICAgIHRoaXMuY2FsZW5kYXJzW2lkeF0gPSB7IC4uLnRoaXMuY2FsZW5kYXJzW2lkeF0sIC4uLmNoYW5nZXMgfTtcbiAgICB0aGlzLm9uVXBkYXRlKCk7XG4gIH1cblxuICBkZWxldGUoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuY2FsZW5kYXJzID0gdGhpcy5jYWxlbmRhcnMuZmlsdGVyKChjKSA9PiBjLmlkICE9PSBpZCk7XG4gICAgdGhpcy5vblVwZGF0ZSgpO1xuICB9XG5cbiAgdG9nZ2xlVmlzaWJpbGl0eShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhcnMuZmluZCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICAgIGlmIChjYWwpIHtcbiAgICAgIGNhbC5pc1Zpc2libGUgPSAhY2FsLmlzVmlzaWJsZTtcbiAgICAgIHRoaXMub25VcGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZXR1cm5zIENTUyBoZXggY29sb3IgZm9yIGEgQ2FsZW5kYXJDb2xvciBuYW1lXG4gIHN0YXRpYyBjb2xvclRvSGV4KGNvbG9yOiBDYWxlbmRhckNvbG9yKTogc3RyaW5nIHtcbiAgICAvLyBJZiBhbHJlYWR5IGEgaGV4IHZhbHVlLCByZXR1cm4gaXQgZGlyZWN0bHlcbiAgICBpZiAoY29sb3Iuc3RhcnRzV2l0aChcIiNcIikpIHJldHVybiBjb2xvcjtcblxuICAgIC8vIExlZ2FjeSBuYW1lZCBjb2xvciBtYXBcbiAgICBjb25zdCBtYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICBibHVlOiAgIFwiIzM3OEFERFwiLFxuICAgICAgZ3JlZW46ICBcIiMzNEM3NTlcIixcbiAgICAgIHB1cnBsZTogXCIjQUY1MkRFXCIsXG4gICAgICBvcmFuZ2U6IFwiI0ZGOTUwMFwiLFxuICAgICAgcmVkOiAgICBcIiNGRjNCMzBcIixcbiAgICAgIHRlYWw6ICAgXCIjMzBCMEM3XCIsXG4gICAgICBwaW5rOiAgIFwiI0ZGMkQ1NVwiLFxuICAgICAgeWVsbG93OiBcIiNGRkQ2MEFcIixcbiAgICAgIGdyYXk6ICAgXCIjOEU4RTkzXCIsXG4gICAgfTtcbiAgICByZXR1cm4gbWFwW2NvbG9yXSA/PyBcIiMzNzhBRERcIjtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVJZChuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJhc2UgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCBcIi1cIikucmVwbGFjZSgvW15hLXowLTktXS9nLCBcIlwiKTtcbiAgICBjb25zdCBzdWZmaXggPSBEYXRlLm5vdygpLnRvU3RyaW5nKDM2KTtcbiAgICByZXR1cm4gYCR7YmFzZX0tJHtzdWZmaXh9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFRhc2tNYW5hZ2VyIH0gZnJvbSBcIi4vVGFza01hbmFnZXJcIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuL0V2ZW50TWFuYWdlclwiO1xuaW1wb3J0IHsgQWxlcnRPZmZzZXQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIEFsZXJ0TWFuYWdlciB7XG4gIHByaXZhdGUgZ2V0U2V0dGluZ3M6ICgpID0+IGltcG9ydChcIi4uL3R5cGVzXCIpLkNocm9uaWNsZVNldHRpbmdzO1xuICBwcml2YXRlIGFwcDogICAgICAgICAgQXBwO1xuICBwcml2YXRlIHRhc2tNYW5hZ2VyOiAgVGFza01hbmFnZXI7XG4gIHByaXZhdGUgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXI7XG4gIHByaXZhdGUgaW50ZXJ2YWxJZDogICBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBmaXJlZEFsZXJ0czogIFNldDxzdHJpbmc+ICAgPSBuZXcgU2V0KCk7XG4gIHByaXZhdGUgYXVkaW9DdHg6ICAgICBBdWRpb0NvbnRleHQgfCBudWxsID0gbnVsbDtcblxuICAvLyBTdG9yZSBoYW5kbGVyIHJlZmVyZW5jZXMgc28gd2UgY2FuIHJlbW92ZSB0aGVtIGluIHN0b3AoKVxuICBwcml2YXRlIG9uQ2hhbmdlZDogKChmaWxlOiBURmlsZSkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBvbkNyZWF0ZTogICgoZmlsZTogYW55KSAgID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlciwgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXIsIGdldFNldHRpbmdzOiAoKSA9PiBpbXBvcnQoXCIuLi90eXBlc1wiKS5DaHJvbmljbGVTZXR0aW5ncykge1xuICAgIHRoaXMuYXBwICAgICAgICAgID0gYXBwO1xuICAgIHRoaXMudGFza01hbmFnZXIgID0gdGFza01hbmFnZXI7XG4gICAgdGhpcy5ldmVudE1hbmFnZXIgPSBldmVudE1hbmFnZXI7XG4gICAgdGhpcy5nZXRTZXR0aW5ncyAgPSBnZXRTZXR0aW5ncztcbiAgfVxuXG4gIHN0YXJ0KCkge1xuICAgIC8vIFJlcXVlc3QgcGVybWlzc2lvbiBpbmxpbmVcbiAgICBpZiAoXCJOb3RpZmljYXRpb25cIiBpbiB3aW5kb3cgJiYgTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZGVmYXVsdFwiKSB7XG4gICAgICBOb3RpZmljYXRpb24ucmVxdWVzdFBlcm1pc3Npb24oKTtcbiAgICB9XG5cbiAgICAvLyBEZWxheSBmaXJzdCBjaGVjayB0byBsZXQgdmF1bHQgZmluaXNoIGxvYWRpbmdcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiW0Nocm9uaWNsZV0gQWxlcnRNYW5hZ2VyIHJlYWR5LCBzdGFydGluZyBwb2xsXCIpO1xuICAgICAgdGhpcy5jaGVjaygpO1xuICAgICAgdGhpcy5pbnRlcnZhbElkID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHRoaXMuY2hlY2soKSwgMzAgKiAxMDAwKTtcbiAgICB9LCAzMDAwKTtcblxuICAgIC8vIFJlLWNoZWNrIHdoZW4gZmlsZXMgY2hhbmdlIFx1MjAxNCBzdG9yZSByZWZzIHNvIHdlIGNhbiByZW1vdmUgdGhlbVxuICAgIHRoaXMub25DaGFuZ2VkID0gKGZpbGU6IFRGaWxlKSA9PiB7XG4gICAgICBjb25zdCBpbkV2ZW50cyA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMuZXZlbnRNYW5hZ2VyW1wiZXZlbnRzRm9sZGVyXCJdKTtcbiAgICAgIGNvbnN0IGluVGFza3MgID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKTtcbiAgICAgIGlmIChpbkV2ZW50cyB8fCBpblRhc2tzKSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuY2hlY2soKSwgMzAwKTtcbiAgICB9O1xuXG4gICAgdGhpcy5vbkNyZWF0ZSA9IChmaWxlOiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IGluRXZlbnRzID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5ldmVudE1hbmFnZXJbXCJldmVudHNGb2xkZXJcIl0pO1xuICAgICAgY29uc3QgaW5UYXNrcyAgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLnRhc2tNYW5hZ2VyW1widGFza3NGb2xkZXJcIl0pO1xuICAgICAgaWYgKGluRXZlbnRzIHx8IGluVGFza3MpIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5jaGVjaygpLCA1MDApO1xuICAgIH07XG5cbiAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCB0aGlzLm9uQ2hhbmdlZCk7XG4gICAgdGhpcy5hcHAudmF1bHQub24oXCJjcmVhdGVcIiwgdGhpcy5vbkNyZWF0ZSk7XG4gIH1cblxuICBzdG9wKCkge1xuICAgIGlmICh0aGlzLmludGVydmFsSWQgIT09IG51bGwpIHtcbiAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWxJZCk7XG4gICAgICB0aGlzLmludGVydmFsSWQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy5vbkNoYW5nZWQpIHtcbiAgICAgIHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUub2ZmKFwiY2hhbmdlZFwiLCB0aGlzLm9uQ2hhbmdlZCk7XG4gICAgICB0aGlzLm9uQ2hhbmdlZCA9IG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLm9uQ3JlYXRlKSB7XG4gICAgICB0aGlzLmFwcC52YXVsdC5vZmYoXCJjcmVhdGVcIiwgdGhpcy5vbkNyZWF0ZSk7XG4gICAgICB0aGlzLm9uQ3JlYXRlID0gbnVsbDtcbiAgICB9XG4gICAgY29uc29sZS5sb2coXCJbQ2hyb25pY2xlXSBBbGVydE1hbmFnZXIgc3RvcHBlZFwiKTtcbiAgfVxuXG4gIGFzeW5jIGNoZWNrKCkge1xuICAgIGNvbnN0IG5vdyAgICAgID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBub3dNcyAgICA9IG5vdy5nZXRUaW1lKCk7XG4gICAgY29uc3Qgd2luZG93TXMgPSA1ICogNjAgKiAxMDAwO1xuXG4gICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIEFsZXJ0IGNoZWNrIGF0ICR7bm93LnRvTG9jYWxlVGltZVN0cmluZygpfWApO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIENoZWNrIGV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBldmVudHMgPSBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci5nZXRBbGwoKTtcbiAgICBjb25zb2xlLmxvZyhgW0Nocm9uaWNsZV0gQ2hlY2tpbmcgJHtldmVudHMubGVuZ3RofSBldmVudHNgKTtcblxuICAgIGlmICghKHRoaXMuZ2V0U2V0dGluZ3MoKS5ub3RpZkV2ZW50cyA/PyB0cnVlKSkgcmV0dXJuO1xuICAgIGZvciAoY29uc3QgZXZlbnQgb2YgZXZlbnRzKSB7XG4gICAgICBpZiAoIWV2ZW50LmFsZXJ0IHx8IGV2ZW50LmFsZXJ0ID09PSBcIm5vbmVcIikgY29udGludWU7XG4gICAgICBpZiAoIWV2ZW50LnN0YXJ0RGF0ZSB8fCAhZXZlbnQuc3RhcnRUaW1lKSAgIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBhbGVydEtleSA9IGBldmVudC0ke2V2ZW50LmlkfS0ke2V2ZW50LnN0YXJ0RGF0ZX0tJHtldmVudC5hbGVydH1gO1xuICAgICAgaWYgKHRoaXMuZmlyZWRBbGVydHMuaGFzKGFsZXJ0S2V5KSkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IHN0YXJ0TXMgPSBuZXcgRGF0ZShgJHtldmVudC5zdGFydERhdGV9VCR7ZXZlbnQuc3RhcnRUaW1lfWApLmdldFRpbWUoKTtcbiAgICAgIGNvbnN0IGFsZXJ0TXMgPSBzdGFydE1zIC0gdGhpcy5vZmZzZXRUb01zKGV2ZW50LmFsZXJ0KTtcblxuICAgICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIEV2ZW50IFwiJHtldmVudC50aXRsZX1cIiBmaXJlcyBhdCAke25ldyBEYXRlKGFsZXJ0TXMpLnRvTG9jYWxlVGltZVN0cmluZygpfSAoJHtNYXRoLnJvdW5kKChhbGVydE1zIC0gbm93TXMpLzEwMDApfXMpYCk7XG5cbiAgICAgIGlmIChub3dNcyA+PSBhbGVydE1zICYmIG5vd01zIDwgYWxlcnRNcyArIHdpbmRvd01zKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbQ2hyb25pY2xlXSBGSVJJTkcgYWxlcnQgZm9yIGV2ZW50IFwiJHtldmVudC50aXRsZX1cImApO1xuICAgICAgICB0aGlzLmZpcmUoYWxlcnRLZXksIGV2ZW50LnRpdGxlLCB0aGlzLmJ1aWxkRXZlbnRCb2R5KGV2ZW50LnN0YXJ0VGltZSwgZXZlbnQuYWxlcnQpLCBcImV2ZW50XCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBDaGVjayB0YXNrcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB0YXNrcyA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0QWxsKCk7XG4gICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIENoZWNraW5nICR7dGFza3MubGVuZ3RofSB0YXNrc2ApO1xuXG4gICAgZm9yIChjb25zdCB0YXNrIG9mIHRhc2tzKSB7XG4gICAgICBpZiAoIXRhc2suYWxlcnQgfHwgdGFzay5hbGVydCA9PT0gXCJub25lXCIpICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICBpZiAoIXRhc2suZHVlRGF0ZSAmJiAhdGFzay5kdWVUaW1lKSAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgaWYgKHRhc2suc3RhdHVzID09PSBcImRvbmVcIiB8fCB0YXNrLnN0YXR1cyA9PT0gXCJjYW5jZWxsZWRcIikgY29udGludWU7XG5cbiAgICAgIGNvbnN0IHRvZGF5U3RyID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICAgIGNvbnN0IGRhdGVTdHIgID0gdGFzay5kdWVEYXRlID8/IHRvZGF5U3RyO1xuICAgICAgY29uc3QgYWxlcnRLZXkgPSBgdGFzay0ke3Rhc2suaWR9LSR7ZGF0ZVN0cn0tJHt0YXNrLmFsZXJ0fWA7XG4gICAgICBpZiAodGhpcy5maXJlZEFsZXJ0cy5oYXMoYWxlcnRLZXkpKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgdGltZVN0ciA9IHRhc2suZHVlVGltZSA/PyBcIjA5OjAwXCI7XG4gICAgICBjb25zdCBkdWVNcyAgID0gbmV3IERhdGUoYCR7ZGF0ZVN0cn1UJHt0aW1lU3RyfWApLmdldFRpbWUoKTtcbiAgICAgIGNvbnN0IGFsZXJ0TXMgPSBkdWVNcyAtIHRoaXMub2Zmc2V0VG9Ncyh0YXNrLmFsZXJ0KTtcblxuICAgICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIFRhc2sgXCIke3Rhc2sudGl0bGV9XCIgZGF0ZT1cIiR7ZGF0ZVN0cn1cIiB0aW1lPVwiJHt0aW1lU3RyfVwiIGFsZXJ0PVwiJHt0YXNrLmFsZXJ0fVwiIGZpcmVzIGF0ICR7bmV3IERhdGUoYWxlcnRNcykudG9Mb2NhbGVUaW1lU3RyaW5nKCl9ICgke01hdGgucm91bmQoKGFsZXJ0TXMgLSBub3dNcykvMTAwMCl9cylgKTtcblxuICAgICAgaWYgKG5vd01zID49IGFsZXJ0TXMgJiYgbm93TXMgPCBhbGVydE1zICsgd2luZG93TXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIEZJUklORyBhbGVydCBmb3IgdGFzayBcIiR7dGFzay50aXRsZX1cImApO1xuICAgICAgICB0aGlzLmZpcmUoYWxlcnRLZXksIHRhc2sudGl0bGUsIHRoaXMuYnVpbGRUYXNrQm9keSh0YXNrLmR1ZURhdGUsIHRhc2suZHVlVGltZSwgdGFzay5hbGVydCksIFwidGFza1wiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZmlyZShrZXk6IHN0cmluZywgdGl0bGU6IHN0cmluZywgYm9keTogc3RyaW5nLCB0eXBlOiBcImV2ZW50XCIgfCBcInRhc2tcIikge1xuICAgIHRoaXMuZmlyZWRBbGVydHMuYWRkKGtleSk7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLmdldFNldHRpbmdzKCk7XG4gICAgY29uc3QgZG9NYWNPUyAgICA9IHNldHRpbmdzLm5vdGlmTWFjT1MgICAgPz8gdHJ1ZTtcbiAgICBjb25zdCBkb09ic2lkaWFuID0gc2V0dGluZ3Mubm90aWZPYnNpZGlhbiA/PyB0cnVlO1xuICAgIGNvbnN0IGRvU291bmQgICAgPSBzZXR0aW5ncy5ub3RpZlNvdW5kICAgID8/IHRydWU7XG4gICAgY29uc3QgaWNvbiA9IHR5cGUgPT09IFwiZXZlbnRcIiA/IFwiXHVEODNEXHVEREQzXCIgOiBcIlx1MjcxM1wiO1xuXG4gICAgLy8gTmF0aXZlIG1hY09TIG5vdGlmaWNhdGlvbiBcdTIwMTQgdHJ5IG11bHRpcGxlIGFwcHJvYWNoZXNcbiAgICBpZiAoZG9NYWNPUykge1xuICAgIGxldCBub3RpZlNlbnQgPSBmYWxzZTtcblxuICAgIC8vIEFwcHJvYWNoIDE6IG9zYXNjcmlwdCAobW9zdCByZWxpYWJsZSBvbiBtYWNPUyByZWdhcmRsZXNzIG9mIEVsZWN0cm9uIHZlcnNpb24pXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHsgZXhlYyB9ID0gKHdpbmRvdyBhcyBhbnkpLnJlcXVpcmUoXCJjaGlsZF9wcm9jZXNzXCIpO1xuICAgICAgY29uc3QgdCA9IGBDaHJvbmljbGUgXHUyMDE0ICR7dHlwZSA9PT0gXCJldmVudFwiID8gXCJFdmVudFwiIDogXCJUYXNrXCJ9YDtcbiAgICAgIGNvbnN0IGIgPSBgJHt0aXRsZX0gXHUyMDE0ICR7Ym9keX1gLnJlcGxhY2UoL1xcXFwvZywgXCJcXFxcXFxcXFwiKS5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJyk7XG4gICAgICBleGVjKGBvc2FzY3JpcHQgLWUgJ2Rpc3BsYXkgbm90aWZpY2F0aW9uIFwiJHtifVwiIHdpdGggdGl0bGUgXCIke3R9XCIgc291bmQgbmFtZSBcIkdsYXNzXCInYCxcbiAgICAgICAgKGVycjogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgY29uc29sZS5sb2coXCJbQ2hyb25pY2xlXSBvc2FzY3JpcHQgZmFpbGVkOlwiLCBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIltDaHJvbmljbGVdIG9zYXNjcmlwdCBub3RpZmljYXRpb24gc2VudFwiKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIG5vdGlmU2VudCA9IHRydWU7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIltDaHJvbmljbGVdIG9zYXNjcmlwdCB1bmF2YWlsYWJsZTpcIiwgZXJyKTtcbiAgICB9XG5cbiAgICAvLyBBcHByb2FjaCAyOiBFbGVjdHJvbiBpcGNSZW5kZXJlciBcdTIxOTIgbWFpbiBwcm9jZXNzIChmYWxsYmFjaylcbiAgICBpZiAoIW5vdGlmU2VudCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyBpcGNSZW5kZXJlciB9ID0gKHdpbmRvdyBhcyBhbnkpLnJlcXVpcmUoXCJlbGVjdHJvblwiKTtcbiAgICAgICAgaXBjUmVuZGVyZXIuc2VuZChcInNob3ctbm90aWZpY2F0aW9uXCIsIHtcbiAgICAgICAgICB0aXRsZTogYENocm9uaWNsZSBcdTIwMTQgJHt0eXBlID09PSBcImV2ZW50XCIgPyBcIkV2ZW50XCIgOiBcIlRhc2tcIn1gLFxuICAgICAgICAgIGJvZHk6ICBgJHt0aXRsZX1cXG4ke2JvZHl9YCxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiW0Nocm9uaWNsZV0gaXBjUmVuZGVyZXIgbm90aWZpY2F0aW9uIHNlbnRcIik7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJbQ2hyb25pY2xlXSBpcGNSZW5kZXJlciBmYWlsZWQ6XCIsIGVycik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSW4tYXBwIHRvYXN0XG4gICAgaWYgKGRvT2JzaWRpYW4pIHtcbiAgICAgIG5ldyBOb3RpY2UoYCR7aWNvbn0gJHt0aXRsZX1cXG4ke2JvZHl9YCwgODAwMCk7XG4gICAgfVxuXG4gICAgLy8gU291bmRcbiAgICBpZiAoZG9Tb3VuZCkge1xuICAgICAgdGhpcy5wbGF5U291bmQoKTtcbiAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwbGF5U291bmQoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy5hdWRpb0N0eCkgdGhpcy5hdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgICAgIGNvbnN0IGN0eCAgPSB0aGlzLmF1ZGlvQ3R4O1xuICAgICAgY29uc3QgZ2FpbiA9IGN0eC5jcmVhdGVHYWluKCk7XG4gICAgICBnYWluLmNvbm5lY3QoY3R4LmRlc3RpbmF0aW9uKTtcbiAgICAgIGdhaW4uZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLjMsIGN0eC5jdXJyZW50VGltZSk7XG4gICAgICBnYWluLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSgwLjAwMSwgY3R4LmN1cnJlbnRUaW1lICsgMC42KTtcbiAgICAgIGZvciAoY29uc3QgW2ZyZXEsIGRlbGF5XSBvZiBbWzg4MCwgMF0sIFsxMTA4LCAwLjE1XV0gYXMgW251bWJlciwgbnVtYmVyXVtdKSB7XG4gICAgICAgIGNvbnN0IG9zYyA9IGN0eC5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gICAgICAgIG9zYy50eXBlID0gXCJzaW5lXCI7XG4gICAgICAgIG9zYy5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoZnJlcSwgY3R4LmN1cnJlbnRUaW1lICsgZGVsYXkpO1xuICAgICAgICBvc2MuY29ubmVjdChnYWluKTtcbiAgICAgICAgb3NjLnN0YXJ0KGN0eC5jdXJyZW50VGltZSArIGRlbGF5KTtcbiAgICAgICAgb3NjLnN0b3AoY3R4LmN1cnJlbnRUaW1lICsgZGVsYXkgKyAwLjUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyAvKiBzaWxlbnQgZmFpbCAqLyB9XG4gIH1cblxuICBwcml2YXRlIG9mZnNldFRvTXMob2Zmc2V0OiBBbGVydE9mZnNldCk6IG51bWJlciB7XG4gICAgY29uc3QgbWFwOiBSZWNvcmQ8QWxlcnRPZmZzZXQsIG51bWJlcj4gPSB7XG4gICAgICBcIm5vbmVcIjogICAgMCwgICAgICAgXCJhdC10aW1lXCI6IDAsXG4gICAgICBcIjVtaW5cIjogICAgMzAwMDAwLCAgXCIxMG1pblwiOiAgIDYwMDAwMCxcbiAgICAgIFwiMTVtaW5cIjogICA5MDAwMDAsICBcIjMwbWluXCI6ICAgMTgwMDAwMCxcbiAgICAgIFwiMWhvdXJcIjogICAzNjAwMDAwLCBcIjJob3Vyc1wiOiAgNzIwMDAwMCxcbiAgICAgIFwiMWRheVwiOiAgICA4NjQwMDAwMCxcIjJkYXlzXCI6ICAgMTcyODAwMDAwLFxuICAgICAgXCIxd2Vla1wiOiAgIDYwNDgwMDAwMCxcbiAgICB9O1xuICAgIHJldHVybiBtYXBbb2Zmc2V0XSA/PyAwO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZEV2ZW50Qm9keShzdGFydFRpbWU6IHN0cmluZywgYWxlcnQ6IEFsZXJ0T2Zmc2V0KTogc3RyaW5nIHtcbiAgICBpZiAoYWxlcnQgPT09IFwiYXQtdGltZVwiKSByZXR1cm4gYFN0YXJ0aW5nIGF0ICR7dGhpcy5mb3JtYXRUaW1lKHN0YXJ0VGltZSl9YDtcbiAgICByZXR1cm4gYCR7dGhpcy5vZmZzZXRMYWJlbChhbGVydCl9IFx1MjAxNCBzdGFydHMgYXQgJHt0aGlzLmZvcm1hdFRpbWUoc3RhcnRUaW1lKX1gO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZFRhc2tCb2R5KGR1ZURhdGU6IHN0cmluZywgZHVlVGltZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBhbGVydDogQWxlcnRPZmZzZXQpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRhdGVMYWJlbCA9IG5ldyBEYXRlKGR1ZURhdGUgKyBcIlQwMDowMDowMFwiKS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7XG4gICAgICB3ZWVrZGF5OiBcInNob3J0XCIsIG1vbnRoOiBcInNob3J0XCIsIGRheTogXCJudW1lcmljXCJcbiAgICB9KTtcbiAgICBpZiAoZHVlVGltZSkge1xuICAgICAgaWYgKGFsZXJ0ID09PSBcImF0LXRpbWVcIikgcmV0dXJuIGBEdWUgYXQgJHt0aGlzLmZvcm1hdFRpbWUoZHVlVGltZSl9YDtcbiAgICAgIHJldHVybiBgJHt0aGlzLm9mZnNldExhYmVsKGFsZXJ0KX0gXHUyMDE0IGR1ZSBhdCAke3RoaXMuZm9ybWF0VGltZShkdWVUaW1lKX1gO1xuICAgIH1cbiAgICByZXR1cm4gYER1ZSAke2RhdGVMYWJlbH1gO1xuICB9XG5cbiAgcHJpdmF0ZSBvZmZzZXRMYWJlbChvZmZzZXQ6IEFsZXJ0T2Zmc2V0KTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXA6IFJlY29yZDxBbGVydE9mZnNldCwgc3RyaW5nPiA9IHtcbiAgICAgIFwibm9uZVwiOiBcIlwiLCBcImF0LXRpbWVcIjogXCJOb3dcIixcbiAgICAgIFwiNW1pblwiOiBcIjUgbWluXCIsIFwiMTBtaW5cIjogXCIxMCBtaW5cIiwgXCIxNW1pblwiOiBcIjE1IG1pblwiLCBcIjMwbWluXCI6IFwiMzAgbWluXCIsXG4gICAgICBcIjFob3VyXCI6IFwiMSBob3VyXCIsIFwiMmhvdXJzXCI6IFwiMiBob3Vyc1wiLFxuICAgICAgXCIxZGF5XCI6IFwiMSBkYXlcIiwgXCIyZGF5c1wiOiBcIjIgZGF5c1wiLCBcIjF3ZWVrXCI6IFwiMSB3ZWVrXCIsXG4gICAgfTtcbiAgICByZXR1cm4gbWFwW29mZnNldF0gPz8gXCJcIjtcbiAgfVxuXG4gIHByaXZhdGUgZm9ybWF0VGltZSh0aW1lU3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IFtoLCBtXSA9IHRpbWVTdHIuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpO1xuICAgIHJldHVybiBgJHtoICUgMTIgfHwgMTJ9OiR7U3RyaW5nKG0pLnBhZFN0YXJ0KDIsXCIwXCIpfSAke2ggPj0gMTIgPyBcIlBNXCIgOiBcIkFNXCJ9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgRXZlbnRNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvRXZlbnRNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZUV2ZW50LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY29uc3QgRVZFTlRfRk9STV9WSUVXX1RZUEUgPSBcImNocm9uaWNsZS1ldmVudC1mb3JtXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudEZvcm1WaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyO1xuICBwcml2YXRlIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICBwcml2YXRlIGVkaXRpbmdFdmVudDogQ2hyb25pY2xlRXZlbnQgfCBudWxsID0gbnVsbDtcbiAgb25TYXZlPzogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBsZWFmOiBXb3Jrc3BhY2VMZWFmLFxuICAgIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyLFxuICAgIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyLFxuICAgIGVkaXRpbmdFdmVudD86IENocm9uaWNsZUV2ZW50LFxuICAgIG9uU2F2ZT86ICgpID0+IHZvaWRcbiAgKSB7XG4gICAgc3VwZXIobGVhZik7XG4gICAgdGhpcy5ldmVudE1hbmFnZXIgICAgPSBldmVudE1hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nRXZlbnQgICAgPSBlZGl0aW5nRXZlbnQgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSAgICAgICAgICA9IG9uU2F2ZTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6ICAgIHN0cmluZyB7IHJldHVybiBFVkVOVF9GT1JNX1ZJRVdfVFlQRTsgfVxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5lZGl0aW5nRXZlbnQgPyBcIkVkaXQgZXZlbnRcIiA6IFwiTmV3IGV2ZW50XCI7IH1cbiAgZ2V0SWNvbigpOiAgICAgICAgc3RyaW5nIHsgcmV0dXJuIFwiY2FsZW5kYXJcIjsgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHsgdGhpcy5yZW5kZXIoKTsgfVxuXG4gIGxvYWRFdmVudChldmVudDogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICB0aGlzLmVkaXRpbmdFdmVudCA9IGV2ZW50O1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb250YWluZXIuZW1wdHkoKTtcbiAgICBjb250YWluZXIuYWRkQ2xhc3MoXCJjaHJvbmljbGUtZm9ybS1wYWdlXCIpO1xuXG4gICAgY29uc3QgZSAgICAgICAgID0gdGhpcy5lZGl0aW5nRXZlbnQ7XG4gICAgY29uc3QgY2FsZW5kYXJzID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjZi1oZWFkZXJcIik7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdFwiLCB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZi1oZWFkZXItdGl0bGVcIikuc2V0VGV4dChlID8gXCJFZGl0IGV2ZW50XCIgOiBcIk5ldyBldmVudFwiKTtcbiAgICBjb25zdCBzYXZlQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1wcmltYXJ5XCIsIHRleHQ6IGUgPyBcIlNhdmVcIiA6IFwiQWRkXCIgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9ybSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb3JtID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNmLWZvcm1cIik7XG5cbiAgICAvLyBUaXRsZVxuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGl0bGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLXRpdGxlLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIkV2ZW50IG5hbWVcIlxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSBlPy50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIExvY2F0aW9uXG4gICAgY29uc3QgbG9jYXRpb25JbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJMb2NhdGlvblwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIGxvY2F0aW9uXCJcbiAgICB9KTtcbiAgICBsb2NhdGlvbklucHV0LnZhbHVlID0gZT8ubG9jYXRpb24gPz8gXCJcIjtcblxuICAgIC8vIEFsbCBkYXkgdG9nZ2xlXG4gICAgY29uc3QgYWxsRGF5V3JhcCAgID0gdGhpcy5maWVsZChmb3JtLCBcIkFsbCBkYXlcIikuY3JlYXRlRGl2KFwiY2VtLXRvZ2dsZS13cmFwXCIpO1xuICAgIGNvbnN0IGFsbERheVRvZ2dsZSA9IGFsbERheVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiwgY2xzOiBcImNlbS10b2dnbGVcIiB9KTtcbiAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA9IGU/LmFsbERheSA/PyBmYWxzZTtcbiAgICBjb25zdCBhbGxEYXlMYWJlbCAgPSBhbGxEYXlXcmFwLmNyZWF0ZVNwYW4oeyBjbHM6IFwiY2VtLXRvZ2dsZS1sYWJlbFwiIH0pO1xuICAgIGFsbERheUxhYmVsLnNldFRleHQoYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIlllc1wiIDogXCJOb1wiKTtcbiAgICBhbGxEYXlUb2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBhbGxEYXlMYWJlbC5zZXRUZXh0KGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJZZXNcIiA6IFwiTm9cIik7XG4gICAgICB0aW1lRmllbGRzLnN0eWxlLmRpc3BsYXkgPSBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwibm9uZVwiIDogXCJcIjtcbiAgICB9KTtcblxuICAgIC8vIERhdGVzXG4gICAgY29uc3QgZGF0ZVJvdyAgICAgID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG4gICAgY29uc3Qgc3RhcnREYXRlSW5wdXQgPSB0aGlzLmZpZWxkKGRhdGVSb3csIFwiU3RhcnQgZGF0ZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0RGF0ZUlucHV0LnZhbHVlID0gZT8uc3RhcnREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBjb25zdCBlbmREYXRlSW5wdXQgPSB0aGlzLmZpZWxkKGRhdGVSb3csIFwiRW5kIGRhdGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcImRhdGVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBlbmREYXRlSW5wdXQudmFsdWUgPSBlPy5lbmREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBzdGFydERhdGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmICghZW5kRGF0ZUlucHV0LnZhbHVlIHx8IGVuZERhdGVJbnB1dC52YWx1ZSA8IHN0YXJ0RGF0ZUlucHV0LnZhbHVlKSB7XG4gICAgICAgIGVuZERhdGVJbnB1dC52YWx1ZSA9IHN0YXJ0RGF0ZUlucHV0LnZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVGltZSBmaWVsZHMgKGhpZGRlbiB3aGVuIGFsbC1kYXkpXG4gICAgY29uc3QgdGltZUZpZWxkcyA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuICAgIHRpbWVGaWVsZHMuc3R5bGUuZGlzcGxheSA9IGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJub25lXCIgOiBcIlwiO1xuXG4gICAgY29uc3Qgc3RhcnRUaW1lSW5wdXQgPSB0aGlzLmZpZWxkKHRpbWVGaWVsZHMsIFwiU3RhcnQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0VGltZUlucHV0LnZhbHVlID0gZT8uc3RhcnRUaW1lID8/IFwiMDk6MDBcIjtcblxuICAgIGNvbnN0IGVuZFRpbWVJbnB1dCA9IHRoaXMuZmllbGQodGltZUZpZWxkcywgXCJFbmQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGVuZFRpbWVJbnB1dC52YWx1ZSA9IGU/LmVuZFRpbWUgPz8gXCIxMDowMFwiO1xuXG4gICAgLy8gUmVwZWF0XG4gICAgY29uc3QgcmVjU2VsZWN0ID0gdGhpcy5maWVsZChmb3JtLCBcIlJlcGVhdFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCByZWN1cnJlbmNlcyA9IFtcbiAgICAgIHsgdmFsdWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJOZXZlclwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9REFJTFlcIiwgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgZGF5XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1XRUVLTFlcIiwgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSB3ZWVrXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1NT05USExZXCIsICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSBtb250aFwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9WUVBUkxZXCIsICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgeWVhclwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZO0JZREFZPU1PLFRVLFdFLFRILEZSXCIsICBsYWJlbDogXCJXZWVrZGF5c1wiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IHIgb2YgcmVjdXJyZW5jZXMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IHJlY1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiByLnZhbHVlLCB0ZXh0OiByLmxhYmVsIH0pO1xuICAgICAgaWYgKGU/LnJlY3VycmVuY2UgPT09IHIudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gQWxlcnRcbiAgICBjb25zdCBhbGVydFNlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJBbGVydFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCBhbGVydHM6IHsgdmFsdWU6IEFsZXJ0T2Zmc2V0OyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwibm9uZVwiLCAgICBsYWJlbDogXCJOb25lXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiYXQtdGltZVwiLCBsYWJlbDogXCJBdCB0aW1lIG9mIGV2ZW50XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiNW1pblwiLCAgICBsYWJlbDogXCI1IG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMTBtaW5cIiwgICBsYWJlbDogXCIxMCBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjE1bWluXCIsICAgbGFiZWw6IFwiMTUgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIzMG1pblwiLCAgIGxhYmVsOiBcIjMwIG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMWhvdXJcIiwgICBsYWJlbDogXCIxIGhvdXIgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMmhvdXJzXCIsICBsYWJlbDogXCIyIGhvdXJzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjFkYXlcIiwgICAgbGFiZWw6IFwiMSBkYXkgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMmRheXNcIiwgICBsYWJlbDogXCIyIGRheXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMXdlZWtcIiwgICBsYWJlbDogXCIxIHdlZWsgYmVmb3JlXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgYSBvZiBhbGVydHMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGFsZXJ0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGEudmFsdWUsIHRleHQ6IGEubGFiZWwgfSk7XG4gICAgICBpZiAoZT8uYWxlcnQgPT09IGEudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gQ2FsZW5kYXJcbiAgICBjb25zdCBjYWxTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQ2FsZW5kYXJcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY2FsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IFwiXCIsIHRleHQ6IFwiTm9uZVwiIH0pO1xuICAgIGZvciAoY29uc3QgY2FsIG9mIGNhbGVuZGFycykge1xuICAgICAgY29uc3Qgb3B0ID0gY2FsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGNhbC5pZCwgdGV4dDogY2FsLm5hbWUgfSk7XG4gICAgICBpZiAoZT8uY2FsZW5kYXJJZCA9PT0gY2FsLmlkKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cbiAgICBjb25zdCB1cGRhdGVDYWxDb2xvciA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNhbCA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoY2FsU2VsZWN0LnZhbHVlKTtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0Q29sb3IgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCJ0cmFuc3BhcmVudFwiO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRXaWR0aCA9IFwiNHB4XCI7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdFN0eWxlID0gXCJzb2xpZFwiO1xuICAgIH07XG4gICAgY2FsU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdXBkYXRlQ2FsQ29sb3IpO1xuICAgIHVwZGF0ZUNhbENvbG9yKCk7XG5cbiAgICAvLyBUYWdzXG4gICAgY29uc3QgdGFnc0lucHV0ID0gdGhpcy5maWVsZChmb3JtLCBcIlRhZ3NcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJ3b3JrLCBwZXJzb25hbCAgKGNvbW1hIHNlcGFyYXRlZClcIlxuICAgIH0pO1xuICAgIHRhZ3NJbnB1dC52YWx1ZSA9IGU/LnRhZ3M/LmpvaW4oXCIsIFwiKSA/PyBcIlwiO1xuXG4gICAgLy8gTGlua2VkIG5vdGVzXG4gICAgY29uc3QgbGlua2VkSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTGlua2VkIG5vdGVzXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiUHJvamVjdHMvV2Vic2l0ZSwgSm91cm5hbC8yMDI0ICAoY29tbWEgc2VwYXJhdGVkKVwiXG4gICAgfSk7XG4gICAgbGlua2VkSW5wdXQudmFsdWUgPSBlPy5saW5rZWROb3Rlcz8uam9pbihcIiwgXCIpID8/IFwiXCI7XG5cbiAgICAvLyBOb3Rlc1xuICAgIGNvbnN0IG5vdGVzSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTm90ZXNcIikuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICBjbHM6IFwiY2YtdGV4dGFyZWFcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIG5vdGVzLi4uXCJcbiAgICB9KTtcbiAgICBub3Rlc0lucHV0LnZhbHVlID0gZT8ubm90ZXMgPz8gXCJcIjtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBBY3Rpb25zIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNhbmNlbEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSB0aXRsZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHsgdGl0bGVJbnB1dC5mb2N1cygpOyB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTsgcmV0dXJuOyB9XG5cbiAgICAgIGNvbnN0IGV2ZW50RGF0YSA9IHtcbiAgICAgICAgdGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICBsb2NhdGlvbklucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxsRGF5OiAgICAgIGFsbERheVRvZ2dsZS5jaGVja2VkLFxuICAgICAgICBzdGFydERhdGU6ICAgc3RhcnREYXRlSW5wdXQudmFsdWUsXG4gICAgICAgIHN0YXJ0VGltZTogICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IHVuZGVmaW5lZCA6IHN0YXJ0VGltZUlucHV0LnZhbHVlLFxuICAgICAgICBlbmREYXRlOiAgICAgZW5kRGF0ZUlucHV0LnZhbHVlIHx8IHN0YXJ0RGF0ZUlucHV0LnZhbHVlLFxuICAgICAgICBlbmRUaW1lOiAgICAgYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyB1bmRlZmluZWQgOiBlbmRUaW1lSW5wdXQudmFsdWUsXG4gICAgICAgIHJlY3VycmVuY2U6ICByZWNTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBjYWxlbmRhcklkOiAgY2FsU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgIGFsZXJ0U2VsZWN0LnZhbHVlIGFzIEFsZXJ0T2Zmc2V0LFxuICAgICAgICBub3RlczogICAgICAgbm90ZXNJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGxpbmtlZE5vdGVzOiAgIGxpbmtlZElucHV0LnZhbHVlID8gbGlua2VkSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiAoZT8ubGlua2VkTm90ZXMgPz8gW10pLFxuICAgICAgICB0YWdzOiAgICAgICAgICB0YWdzSW5wdXQudmFsdWUgPyB0YWdzSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiAoZT8udGFncyA/PyBbXSksXG4gICAgICAgIGxpbmtlZFRhc2tJZHM6ICAgICAgZT8ubGlua2VkVGFza0lkcyA/PyBbXSxcbiAgICAgICAgY29tcGxldGVkSW5zdGFuY2VzOiBlPy5jb21wbGV0ZWRJbnN0YW5jZXMgPz8gW10sXG4gICAgICB9O1xuXG4gICAgICBpZiAoZT8uaWQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIudXBkYXRlKHsgLi4uZSwgLi4uZXZlbnREYXRhIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuY3JlYXRlKGV2ZW50RGF0YSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoRVZFTlRfRk9STV9WSUVXX1RZUEUpO1xuICAgIH07XG5cbiAgICBzYXZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoYW5kbGVTYXZlKTtcbiAgICB0aXRsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChlKSA9PiB7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIikgaGFuZGxlU2F2ZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBmaWVsZChwYXJlbnQ6IEhUTUxFbGVtZW50LCBsYWJlbDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHdyYXAgPSBwYXJlbnQuY3JlYXRlRGl2KFwiY2YtZmllbGRcIik7XG4gICAgd3JhcC5jcmVhdGVEaXYoXCJjZi1sYWJlbFwiKS5zZXRUZXh0KGxhYmVsKTtcbiAgICByZXR1cm4gd3JhcDtcbiAgfVxufSIsICIvLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2FsZW5kYXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgdHlwZSBDYWxlbmRhckNvbG9yID0gc3RyaW5nO1xuXG5leHBvcnQgaW50ZXJmYWNlIENocm9uaWNsZUNhbGVuZGFyIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBjb2xvcjogQ2FsZW5kYXJDb2xvcjtcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIGlzVmlzaWJsZTogYm9vbGVhbjtcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBUYXNrcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IHR5cGUgVGFza1N0YXR1cyA9IFwidG9kb1wiIHwgXCJpbi1wcm9ncmVzc1wiIHwgXCJkb25lXCIgfCBcImNhbmNlbGxlZFwiO1xuZXhwb3J0IHR5cGUgVGFza1ByaW9yaXR5ID0gXCJub25lXCIgfCBcImxvd1wiIHwgXCJtZWRpdW1cIiB8IFwiaGlnaFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRpbWVFbnRyeSB7XG4gIHN0YXJ0VGltZTogc3RyaW5nOyAgIC8vIElTTyA4NjAxXG4gIGVuZFRpbWU/OiBzdHJpbmc7ICAgIC8vIElTTyA4NjAxXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ3VzdG9tRmllbGQge1xuICBrZXk6IHN0cmluZztcbiAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hyb25pY2xlVGFzayB7XG4gIC8vIC0tLSBDb3JlIC0tLVxuICBpZDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBzdGF0dXM6IFRhc2tTdGF0dXM7XG4gIHByaW9yaXR5OiBUYXNrUHJpb3JpdHk7XG5cbiAgLy8gLS0tIFNjaGVkdWxpbmcgLS0tXG4gIGR1ZURhdGU/OiBzdHJpbmc7ICAgICAgIC8vIFlZWVktTU0tRERcbiAgZHVlVGltZT86IHN0cmluZzsgICAgICAgLy8gSEg6bW1cbiAgcmVjdXJyZW5jZT86IHN0cmluZzsgICAgLy8gUlJVTEUgc3RyaW5nIGUuZy4gXCJGUkVRPVdFRUtMWTtCWURBWT1NT1wiXG4gIFxuXG4gIC8vIC0tLSBPcmdhbmlzYXRpb24gLS0tXG4gIGxvY2F0aW9uPzogc3RyaW5nO1xuICBjYWxlbmRhcklkPzogc3RyaW5nOyAgICAvLyBsaW5rcyB0byBhIENocm9uaWNsZUNhbGVuZGFyXG4gIHRhZ3M6IHN0cmluZ1tdO1xuICBsaW5rZWROb3Rlczogc3RyaW5nW107ICAvLyB3aWtpbGluayBwYXRocyBlLmcuIFtcIlByb2plY3RzL1dlYnNpdGVcIl1cbiAgcHJvamVjdHM6IHN0cmluZ1tdO1xuXG4gIC8vIC0tLSBUaW1lIHRyYWNraW5nIC0tLVxuICB0aW1lRXN0aW1hdGU/OiBudW1iZXI7ICAvLyBtaW51dGVzXG4gIHRpbWVFbnRyaWVzOiBUaW1lRW50cnlbXTtcblxuICAvLyAtLS0gQ3VzdG9tIC0tLVxuICBjdXN0b21GaWVsZHM6IEN1c3RvbUZpZWxkW107XG5cbiAgLy8gLS0tIFJlY3VycmVuY2UgY29tcGxldGlvbiAtLS1cbiAgY29tcGxldGVkSW5zdGFuY2VzOiBzdHJpbmdbXTsgLy8gWVlZWS1NTS1ERCBkYXRlc1xuXG4gIC8vIC0tLSBNZXRhIC0tLVxuICBjcmVhdGVkQXQ6IHN0cmluZzsgICAgICAvLyBJU08gODYwMVxuICBjb21wbGV0ZWRBdD86IHN0cmluZzsgICAvLyBJU08gODYwMVxuICBub3Rlcz86IHN0cmluZzsgICAgICAgICAvLyBib2R5IGNvbnRlbnQgb2YgdGhlIG5vdGVcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIEV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IHR5cGUgQWxlcnRPZmZzZXQgPVxuICB8IFwibm9uZVwiXG4gIHwgXCJhdC10aW1lXCJcbiAgfCBcIjVtaW5cIiB8IFwiMTBtaW5cIiB8IFwiMTVtaW5cIiB8IFwiMzBtaW5cIlxuICB8IFwiMWhvdXJcIiB8IFwiMmhvdXJzXCJcbiAgfCBcIjFkYXlcIiB8IFwiMmRheXNcIiB8IFwiMXdlZWtcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVFdmVudCB7XG4gIC8vIC0tLSBDb3JlIChpbiBmb3JtIG9yZGVyKSAtLS1cbiAgaWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgbG9jYXRpb24/OiBzdHJpbmc7XG4gIGFsbERheTogYm9vbGVhbjtcbiAgc3RhcnREYXRlOiBzdHJpbmc7ICAgICAgLy8gWVlZWS1NTS1ERFxuICBzdGFydFRpbWU/OiBzdHJpbmc7ICAgICAvLyBISDptbSAgKHVuZGVmaW5lZCB3aGVuIGFsbERheSlcbiAgZW5kRGF0ZTogc3RyaW5nOyAgICAgICAgLy8gWVlZWS1NTS1ERFxuICBlbmRUaW1lPzogc3RyaW5nOyAgICAgICAvLyBISDptbSAgKHVuZGVmaW5lZCB3aGVuIGFsbERheSlcbiAgcmVjdXJyZW5jZT86IHN0cmluZzsgICAgLy8gUlJVTEUgc3RyaW5nXG4gIGNhbGVuZGFySWQ/OiBzdHJpbmc7ICAgIC8vIGxpbmtzIHRvIGEgQ2hyb25pY2xlQ2FsZW5kYXJcbiAgYWxlcnQ6IEFsZXJ0T2Zmc2V0O1xuICBub3Rlcz86IHN0cmluZzsgICAgICAgICAvLyBib2R5IGNvbnRlbnQgb2YgdGhlIG5vdGVcbiAgbGlua2VkTm90ZXM/OiBzdHJpbmdbXTtcbiAgdGFncz86IHN0cmluZ1tdO1xuXG4gIC8vIC0tLSBDb25uZWN0aW9ucyAtLS1cbiAgbGlua2VkVGFza0lkczogc3RyaW5nW107ICAgLy8gQ2hyb25pY2xlIHRhc2sgSURzXG5cbiAgLy8gLS0tIE1ldGEgLS0tXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xuICBjb21wbGV0ZWRJbnN0YW5jZXM6IHN0cmluZ1tdO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgUGx1Z2luIHNldHRpbmdzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgaW50ZXJmYWNlIENocm9uaWNsZVNldHRpbmdzIHtcbiAgLy8gRm9sZGVyIHBhdGhzXG4gIHRhc2tzRm9sZGVyOiBzdHJpbmc7XG4gIGV2ZW50c0ZvbGRlcjogc3RyaW5nO1xuXG4gIC8vIENhbGVuZGFycyAoc3RvcmVkIGluIHNldHRpbmdzLCBub3QgYXMgZmlsZXMpXG4gIGNhbGVuZGFyczogQ2hyb25pY2xlQ2FsZW5kYXJbXTtcbiAgZGVmYXVsdENhbGVuZGFySWQ6IHN0cmluZztcblxuICAvLyBEZWZhdWx0c1xuICBkZWZhdWx0VGFza1N0YXR1czogVGFza1N0YXR1cztcbiAgZGVmYXVsdFRhc2tQcmlvcml0eTogVGFza1ByaW9yaXR5O1xuICBkZWZhdWx0QWxlcnQ6IEFsZXJ0T2Zmc2V0O1xuXG4gIC8vIERpc3BsYXlcbiAgc3RhcnRPZldlZWs6IDAgfCAxIHwgNjsgIC8vIDA9U3VuLCAxPU1vbiwgNj1TYXRcbiAgdGltZUZvcm1hdDogXCIxMmhcIiB8IFwiMjRoXCI7XG4gIGRlZmF1bHRDYWxlbmRhclZpZXc6IFwiZGF5XCIgfCBcIndlZWtcIiB8IFwibW9udGhcIiB8IFwieWVhclwiO1xuXG4gIC8vIFNtYXJ0IGxpc3RzIHZpc2liaWxpdHlcbiAgc2hvd1RvZGF5Q291bnQ6IGJvb2xlYW47XG4gIHNob3dTY2hlZHVsZWRDb3VudDogYm9vbGVhbjtcbiAgc2hvd0ZsYWdnZWRDb3VudDogYm9vbGVhbjtcblxuICAvLyBOb3RpZmljYXRpb24gY2hhbm5lbHNcbiAgbm90aWZNYWNPUzogYm9vbGVhbjtcbiAgbm90aWZPYnNpZGlhbjogYm9vbGVhbjtcbiAgbm90aWZTb3VuZDogYm9vbGVhbjtcbiAgbm90aWZFdmVudHM6IGJvb2xlYW47XG4gIG5vdGlmVGFza3M6IGJvb2xlYW47XG5cbiAgLy8gRXZlbnRzXG4gIGRlZmF1bHRFdmVudER1cmF0aW9uOiBudW1iZXI7XG5cbiAgLy8gQXBwZWFyYW5jZVxuICBkZW5zaXR5OiBcImNvbXBhY3RcIiB8IFwiY29tZm9ydGFibGVcIjtcbiAgc2hvd0NvbXBsZXRlZENvdW50OiBib29sZWFuO1xuICBzaG93VGFza0NvdW50U3VidGl0bGU6IGJvb2xlYW47XG5cbiAgLy8gQ3VzdG9tIGZpZWxkIHRlbXBsYXRlc1xuICBkZWZhdWx0Q3VzdG9tRmllbGRzOiB7IGtleTogc3RyaW5nOyB0eXBlOiBcInRleHRcIiB8IFwibnVtYmVyXCIgfCBcImRhdGVcIiB8IFwiY2hlY2tib3hcIiB9W107XG59XG5cblxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogQ2hyb25pY2xlU2V0dGluZ3MgPSB7XG4gIHRhc2tzRm9sZGVyOiBcIkNocm9uaWNsZS9UYXNrc1wiLFxuICBldmVudHNGb2xkZXI6IFwiQ2hyb25pY2xlL0V2ZW50c1wiLFxuICBjYWxlbmRhcnM6IFtcbiAgICB7IGlkOiBcInBlcnNvbmFsXCIsIG5hbWU6IFwiUGVyc29uYWxcIiwgY29sb3I6IFwiYmx1ZVwiLCAgIGlzVmlzaWJsZTogdHJ1ZSwgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSxcbiAgICB7IGlkOiBcIndvcmtcIiwgICAgIG5hbWU6IFwiV29ya1wiLCAgICAgY29sb3I6IFwiZ3JlZW5cIiwgIGlzVmlzaWJsZTogdHJ1ZSwgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSxcbiAgXSxcbiAgZGVmYXVsdENhbGVuZGFySWQ6IFwicGVyc29uYWxcIixcbiAgZGVmYXVsdFRhc2tTdGF0dXM6IFwidG9kb1wiLFxuICBkZWZhdWx0VGFza1ByaW9yaXR5OiBcIm5vbmVcIixcbiAgZGVmYXVsdEFsZXJ0OiBcIm5vbmVcIixcbiAgc3RhcnRPZldlZWs6IDAsXG4gIHRpbWVGb3JtYXQ6IFwiMTJoXCIsXG4gIGRlZmF1bHRDYWxlbmRhclZpZXc6IFwid2Vla1wiLFxuICBzaG93VG9kYXlDb3VudDogdHJ1ZSxcbiAgc2hvd1NjaGVkdWxlZENvdW50OiB0cnVlLFxuICBzaG93RmxhZ2dlZENvdW50OiB0cnVlLFxuICBub3RpZk1hY09TOiB0cnVlLFxuICBub3RpZk9ic2lkaWFuOiB0cnVlLFxuICBub3RpZlNvdW5kOiB0cnVlLFxuICBub3RpZkV2ZW50czogdHJ1ZSxcbiAgbm90aWZUYXNrczogdHJ1ZSxcbiAgZGVmYXVsdEV2ZW50RHVyYXRpb246IDYwLFxuICBkZW5zaXR5OiBcImNvbWZvcnRhYmxlXCIsXG4gIHNob3dDb21wbGV0ZWRDb3VudDogdHJ1ZSxcbiAgc2hvd1Rhc2tDb3VudFN1YnRpdGxlOiB0cnVlLFxuICBkZWZhdWx0Q3VzdG9tRmllbGRzOiBbXSxcbn07IiwgImltcG9ydCB7IENocm9uaWNsZVRhc2ssIFRhc2tTdGF0dXMsIFRhc2tQcmlvcml0eSwgQWxlcnRPZmZzZXQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IEFwcCwgVEZpbGUsIG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZVRhc2ssIFRhc2tTdGF0dXMsIFRhc2tQcmlvcml0eSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgVGFza01hbmFnZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwLCBwcml2YXRlIHRhc2tzRm9sZGVyOiBzdHJpbmcpIHt9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFJlYWQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgZ2V0QWxsKCk6IFByb21pc2U8Q2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgZm9sZGVyID0gdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMudGFza3NGb2xkZXIpO1xuICAgIGlmICghZm9sZGVyKSByZXR1cm4gW107XG5cbiAgICBjb25zdCB0YXNrczogQ2hyb25pY2xlVGFza1tdID0gW107XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRGaWxlICYmIGNoaWxkLmV4dGVuc2lvbiA9PT0gXCJtZFwiKSB7XG4gICAgICAgIGNvbnN0IHRhc2sgPSBhd2FpdCB0aGlzLmZpbGVUb1Rhc2soY2hpbGQpO1xuICAgICAgICBpZiAodGFzaykgdGFza3MucHVzaCh0YXNrKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhc2tzO1xuICB9XG5cbiAgYXN5bmMgZ2V0QnlJZChpZDogc3RyaW5nKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrIHwgbnVsbD4ge1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maW5kKCh0KSA9PiB0LmlkID09PSBpZCkgPz8gbnVsbDtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBXcml0ZSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBjcmVhdGUodGFzazogT21pdDxDaHJvbmljbGVUYXNrLCBcImlkXCIgfCBcImNyZWF0ZWRBdFwiPik6IFByb21pc2U8Q2hyb25pY2xlVGFzaz4ge1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKCk7XG5cbiAgICBjb25zdCBmdWxsOiBDaHJvbmljbGVUYXNrID0ge1xuICAgICAgLi4udGFzayxcbiAgICAgIGlkOiB0aGlzLmdlbmVyYXRlSWQoKSxcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICBjb25zdCBwYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLnRhc2tzRm9sZGVyfS8ke2Z1bGwudGl0bGV9Lm1kYCk7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIHRoaXMudGFza1RvTWFya2Rvd24oZnVsbCkpO1xuICAgIHJldHVybiBmdWxsO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlKHRhc2s6IENocm9uaWNsZVRhc2spOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvclRhc2sodGFzay5pZCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG5cbiAgICAvLyBJZiB0aXRsZSBjaGFuZ2VkLCByZW5hbWUgdGhlIGZpbGVcbiAgICBjb25zdCBleHBlY3RlZFBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMudGFza3NGb2xkZXJ9LyR7dGFzay50aXRsZX0ubWRgKTtcbiAgICBpZiAoZmlsZS5wYXRoICE9PSBleHBlY3RlZFBhdGgpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLmZpbGVNYW5hZ2VyLnJlbmFtZUZpbGUoZmlsZSwgZXhwZWN0ZWRQYXRoKTtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkRmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEZpbGVCeVBhdGgoZXhwZWN0ZWRQYXRoKSA/PyBmaWxlO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeSh1cGRhdGVkRmlsZSwgdGhpcy50YXNrVG9NYXJrZG93bih0YXNrKSk7XG4gIH1cblxuICBhc3luYyBkZWxldGUoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbmRGaWxlRm9yVGFzayhpZCk7XG4gICAgaWYgKGZpbGUpIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmRlbGV0ZShmaWxlKTtcbiAgfVxuXG4gIGFzeW5jIG1hcmtDb21wbGV0ZShpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdGFzayA9IGF3YWl0IHRoaXMuZ2V0QnlJZChpZCk7XG4gICAgaWYgKCF0YXNrKSByZXR1cm47XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoe1xuICAgICAgLi4udGFzayxcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICBjb21wbGV0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEZpbHRlcnMgKHVzZWQgYnkgc21hcnQgbGlzdHMpIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIGFzeW5jIGdldER1ZVRvZGF5KCk6IFByb21pc2U8Q2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgdG9kYXkgPSB0aGlzLnRvZGF5U3RyKCk7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcihcbiAgICAgICh0KSA9PiB0LnN0YXR1cyAhPT0gXCJkb25lXCIgJiYgdC5zdGF0dXMgIT09IFwiY2FuY2VsbGVkXCIgJiYgdC5kdWVEYXRlID09PSB0b2RheVxuICAgICk7XG4gIH1cblxuICBhc3luYyBnZXRPdmVyZHVlKCk6IFByb21pc2U8Q2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgdG9kYXkgPSB0aGlzLnRvZGF5U3RyKCk7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcihcbiAgICAgICh0KSA9PiB0LnN0YXR1cyAhPT0gXCJkb25lXCIgJiYgdC5zdGF0dXMgIT09IFwiY2FuY2VsbGVkXCIgJiYgISF0LmR1ZURhdGUgJiYgdC5kdWVEYXRlIDwgdG9kYXlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgZ2V0U2NoZWR1bGVkKCk6IFByb21pc2U8Q2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcihcbiAgICAgICh0KSA9PiB0LnN0YXR1cyAhPT0gXCJkb25lXCIgJiYgdC5zdGF0dXMgIT09IFwiY2FuY2VsbGVkXCIgJiYgISF0LmR1ZURhdGVcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgZ2V0RmxhZ2dlZCgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoKHQpID0+IHQucHJpb3JpdHkgPT09IFwiaGlnaFwiICYmIHQuc3RhdHVzICE9PSBcImRvbmVcIik7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2VyaWFsaXNhdGlvbiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHRhc2tUb01hcmtkb3duKHRhc2s6IENocm9uaWNsZVRhc2spOiBzdHJpbmcge1xuICAgIGNvbnN0IGZtOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICAgIGlkOiAgICAgICAgICAgICAgICAgdGFzay5pZCxcbiAgICAgIHRpdGxlOiAgICAgICAgICAgICAgdGFzay50aXRsZSxcbiAgICAgIFwibG9jYXRpb25cIjogICAgICAgICB0YXNrLmxvY2F0aW9uID8/IG51bGwsXG4gICAgICBzdGF0dXM6ICAgICAgICAgICAgIHRhc2suc3RhdHVzLFxuICAgICAgcHJpb3JpdHk6ICAgICAgICAgICB0YXNrLnByaW9yaXR5LFxuICAgICAgdGFnczogICAgICAgICAgICAgICB0YXNrLnRhZ3MsXG4gICAgICBwcm9qZWN0czogICAgICAgICAgIHRhc2sucHJvamVjdHMsXG4gICAgICBcImxpbmtlZC1ub3Rlc1wiOiAgICAgdGFzay5saW5rZWROb3RlcyxcbiAgICAgIFwiY2FsZW5kYXItaWRcIjogICAgICB0YXNrLmNhbGVuZGFySWQgPz8gbnVsbCxcbiAgICAgIFwiZHVlLWRhdGVcIjogICAgICAgICB0YXNrLmR1ZURhdGUgPz8gbnVsbCxcbiAgICAgIFwiZHVlLXRpbWVcIjogICAgICAgICB0YXNrLmR1ZVRpbWUgPz8gbnVsbCxcbiAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgdGFzay5yZWN1cnJlbmNlID8/IG51bGwsXG4gICAgICBcImFsZXJ0XCI6ICAgICAgICAgICAgdGFzay5hbGVydCA/PyBcIm5vbmVcIixcbiAgICAgIFwidGltZS1lc3RpbWF0ZVwiOiAgICB0YXNrLnRpbWVFc3RpbWF0ZSA/PyBudWxsLFxuICAgICAgXCJ0aW1lLWVudHJpZXNcIjogICAgIHRhc2sudGltZUVudHJpZXMsXG4gICAgICBcImN1c3RvbS1maWVsZHNcIjogICAgdGFzay5jdXN0b21GaWVsZHMsXG4gICAgICBcImNvbXBsZXRlZC1pbnN0YW5jZXNcIjogdGFzay5jb21wbGV0ZWRJbnN0YW5jZXMsXG4gICAgICBcImNyZWF0ZWQtYXRcIjogICAgICAgdGFzay5jcmVhdGVkQXQsXG4gICAgICBcImNvbXBsZXRlZC1hdFwiOiAgICAgdGFzay5jb21wbGV0ZWRBdCA/PyBudWxsLFxuICAgIH07XG5cbiAgICBjb25zdCB5YW1sID0gT2JqZWN0LmVudHJpZXMoZm0pXG4gICAgICAubWFwKChbaywgdl0pID0+IGAke2t9OiAke0pTT04uc3RyaW5naWZ5KHYpfWApXG4gICAgICAuam9pbihcIlxcblwiKTtcblxuICAgIGNvbnN0IGJvZHkgPSB0YXNrLm5vdGVzID8gYFxcbiR7dGFzay5ub3Rlc31gIDogXCJcIjtcbiAgICByZXR1cm4gYC0tLVxcbiR7eWFtbH1cXG4tLS1cXG4ke2JvZHl9YDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmlsZVRvVGFzayhmaWxlOiBURmlsZSk6IFByb21pc2U8Q2hyb25pY2xlVGFzayB8IG51bGw+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICAgIGNvbnN0IGZtID0gY2FjaGU/LmZyb250bWF0dGVyO1xuICAgICAgaWYgKCFmbT8uaWQgfHwgIWZtPy50aXRsZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgICAgY29uc3QgYm9keU1hdGNoID0gY29udGVudC5tYXRjaCgvXi0tLVxcbltcXHNcXFNdKj9cXG4tLS1cXG4oW1xcc1xcU10qKSQvKTtcbiAgICAgIGNvbnN0IG5vdGVzID0gYm9keU1hdGNoPy5bMV0/LnRyaW0oKSB8fCB1bmRlZmluZWQ7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkOiAgICAgICAgICAgICAgICAgZm0uaWQsXG4gICAgICAgIHRpdGxlOiAgICAgICAgICAgICAgZm0udGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICAgICAgICAgZm0ubG9jYXRpb24gPz8gdW5kZWZpbmVkLFxuICAgICAgICBzdGF0dXM6ICAgICAgICAgICAgIChmbS5zdGF0dXMgYXMgVGFza1N0YXR1cykgPz8gXCJ0b2RvXCIsXG4gICAgICAgIHByaW9yaXR5OiAgICAgICAgICAgKGZtLnByaW9yaXR5IGFzIFRhc2tQcmlvcml0eSkgPz8gXCJub25lXCIsXG4gICAgICAgIGR1ZURhdGU6ICAgICAgICAgICAgZm1bXCJkdWUtZGF0ZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGR1ZVRpbWU6ICAgICAgICAgICAgZm1bXCJkdWUtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgZm0ucmVjdXJyZW5jZSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGFsZXJ0OiAgICAgICAgICAgICAgKGZtLmFsZXJ0IGFzIEFsZXJ0T2Zmc2V0KSA/PyBcIm5vbmVcIixcbiAgICAgICAgY2FsZW5kYXJJZDogICAgICAgICBmbVtcImNhbGVuZGFyLWlkXCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgdGFnczogICAgICAgICAgICAgICBmbS50YWdzID8/IFtdLFxuICAgICAgICBsaW5rZWROb3RlczogICAgICAgIGZtW1wibGlua2VkLW5vdGVzXCJdID8/IFtdLFxuICAgICAgICBwcm9qZWN0czogICAgICAgICAgIGZtLnByb2plY3RzID8/IFtdLFxuICAgICAgICB0aW1lRXN0aW1hdGU6ICAgICAgIGZtW1widGltZS1lc3RpbWF0ZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHRpbWVFbnRyaWVzOiAgICAgICAgZm1bXCJ0aW1lLWVudHJpZXNcIl0gPz8gW10sXG4gICAgICAgIGN1c3RvbUZpZWxkczogICAgICAgZm1bXCJjdXN0b20tZmllbGRzXCJdID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6IGZtW1wiY29tcGxldGVkLWluc3RhbmNlc1wiXSA/PyBbXSxcbiAgICAgICAgY3JlYXRlZEF0OiAgICAgICAgICBmbVtcImNyZWF0ZWQtYXRcIl0gPz8gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBjb21wbGV0ZWRBdDogICAgICAgIGZtW1wiY29tcGxldGVkLWF0XCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgbm90ZXMsXG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEhlbHBlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSBmaW5kRmlsZUZvclRhc2soaWQ6IHN0cmluZyk6IFRGaWxlIHwgbnVsbCB7XG4gICAgY29uc3QgZm9sZGVyID0gdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMudGFza3NGb2xkZXIpO1xuICAgIGlmICghZm9sZGVyKSByZXR1cm4gbnVsbDtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuICAgICAgaWYgKCEoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSkpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShjaGlsZCk7XG4gICAgICBpZiAoY2FjaGU/LmZyb250bWF0dGVyPy5pZCA9PT0gaWQpIHJldHVybiBjaGlsZDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGVuc3VyZUZvbGRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLnRhc2tzRm9sZGVyKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKHRoaXMudGFza3NGb2xkZXIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgdGFzay0ke0RhdGUubm93KCkudG9TdHJpbmcoMzYpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDYpfWA7XG4gIH1cblxuICBwcml2YXRlIHRvZGF5U3RyKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBURmlsZSwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlRXZlbnQsIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudE1hbmFnZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwLCBwcml2YXRlIGV2ZW50c0ZvbGRlcjogc3RyaW5nKSB7fVxuXG4gIGFzeW5jIGdldEFsbCgpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50W10+IHtcbiAgICBjb25zdCBmb2xkZXIgPSB0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy5ldmVudHNGb2xkZXIpO1xuICAgIGlmICghZm9sZGVyKSByZXR1cm4gW107XG5cbiAgICBjb25zdCBldmVudHM6IENocm9uaWNsZUV2ZW50W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbiAgICAgICAgY29uc3QgZXZlbnQgPSBhd2FpdCB0aGlzLmZpbGVUb0V2ZW50KGNoaWxkKTtcbiAgICAgICAgaWYgKGV2ZW50KSBldmVudHMucHVzaChldmVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBldmVudHM7XG4gIH1cblxuICBhc3luYyBjcmVhdGUoZXZlbnQ6IE9taXQ8Q2hyb25pY2xlRXZlbnQsIFwiaWRcIiB8IFwiY3JlYXRlZEF0XCI+KTogUHJvbWlzZTxDaHJvbmljbGVFdmVudD4ge1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKCk7XG5cbiAgICBjb25zdCBmdWxsOiBDaHJvbmljbGVFdmVudCA9IHtcbiAgICAgIC4uLmV2ZW50LFxuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZCgpLFxuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIGNvbnN0IHBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMuZXZlbnRzRm9sZGVyfS8ke2Z1bGwudGl0bGV9Lm1kYCk7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIHRoaXMuZXZlbnRUb01hcmtkb3duKGZ1bGwpKTtcbiAgICByZXR1cm4gZnVsbDtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZShldmVudDogQ2hyb25pY2xlRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvckV2ZW50KGV2ZW50LmlkKTtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcblxuICAgIGNvbnN0IGV4cGVjdGVkUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy5ldmVudHNGb2xkZXJ9LyR7ZXZlbnQudGl0bGV9Lm1kYCk7XG4gICAgaWYgKGZpbGUucGF0aCAhPT0gZXhwZWN0ZWRQYXRoKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIGV4cGVjdGVkUGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKGV4cGVjdGVkUGF0aCkgPz8gZmlsZTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkodXBkYXRlZEZpbGUsIHRoaXMuZXZlbnRUb01hcmtkb3duKGV2ZW50KSk7XG4gIH1cblxuICBhc3luYyBkZWxldGUoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbmRGaWxlRm9yRXZlbnQoaWQpO1xuICAgIGlmIChmaWxlKSBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBnZXRJblJhbmdlKHN0YXJ0RGF0ZTogc3RyaW5nLCBlbmREYXRlOiBzdHJpbmcpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50W10+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKChlKSA9PiBlLnN0YXJ0RGF0ZSA+PSBzdGFydERhdGUgJiYgZS5zdGFydERhdGUgPD0gZW5kRGF0ZSk7XG4gIH1cblxuLy8gRXhwYW5kcyByZWN1cnJpbmcgZXZlbnRzIGludG8gb2NjdXJyZW5jZXMgd2l0aGluIGEgZGF0ZSByYW5nZS5cbiAgLy8gUmV0dXJucyBhIGZsYXQgbGlzdCBvZiBDaHJvbmljbGVFdmVudCBvYmplY3RzLCBvbmUgcGVyIG9jY3VycmVuY2UsXG4gIC8vIGVhY2ggd2l0aCBzdGFydERhdGUvZW5kRGF0ZSBzZXQgdG8gdGhlIG9jY3VycmVuY2UgZGF0ZS5cbiAgYXN5bmMgZ2V0SW5SYW5nZVdpdGhSZWN1cnJlbmNlKHJhbmdlU3RhcnQ6IHN0cmluZywgcmFuZ2VFbmQ6IHN0cmluZyk6IFByb21pc2U8Q2hyb25pY2xlRXZlbnRbXT4ge1xuICAgIGNvbnN0IGFsbCAgICA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgY29uc3QgcmVzdWx0OiBDaHJvbmljbGVFdmVudFtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIGFsbCkge1xuICAgICAgaWYgKCFldmVudC5yZWN1cnJlbmNlKSB7XG4gICAgICAgIC8vIE5vbi1yZWN1cnJpbmcgXHUyMDE0IGluY2x1ZGUgaWYgaXQgZmFsbHMgaW4gcmFuZ2VcbiAgICAgICAgaWYgKGV2ZW50LnN0YXJ0RGF0ZSA+PSByYW5nZVN0YXJ0ICYmIGV2ZW50LnN0YXJ0RGF0ZSA8PSByYW5nZUVuZCkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gRXhwYW5kIHJlY3VycmVuY2Ugd2l0aGluIHJhbmdlXG4gICAgICBjb25zdCBvY2N1cnJlbmNlcyA9IHRoaXMuZXhwYW5kUmVjdXJyZW5jZShldmVudCwgcmFuZ2VTdGFydCwgcmFuZ2VFbmQpO1xuICAgICAgcmVzdWx0LnB1c2goLi4ub2NjdXJyZW5jZXMpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGV4cGFuZFJlY3VycmVuY2UoZXZlbnQ6IENocm9uaWNsZUV2ZW50LCByYW5nZVN0YXJ0OiBzdHJpbmcsIHJhbmdlRW5kOiBzdHJpbmcpOiBDaHJvbmljbGVFdmVudFtdIHtcbiAgICBjb25zdCByZXN1bHRzOiBDaHJvbmljbGVFdmVudFtdID0gW107XG4gICAgY29uc3QgcnVsZSA9IGV2ZW50LnJlY3VycmVuY2UgPz8gXCJcIjtcblxuICAgIC8vIFBhcnNlIFJSVUxFIHBhcnRzXG4gICAgY29uc3QgZnJlcSAgICA9IHRoaXMucnJ1bGVQYXJ0KHJ1bGUsIFwiRlJFUVwiKTtcbiAgICBjb25zdCBieURheSAgID0gdGhpcy5ycnVsZVBhcnQocnVsZSwgXCJCWURBWVwiKTtcbiAgICBjb25zdCB1bnRpbCAgID0gdGhpcy5ycnVsZVBhcnQocnVsZSwgXCJVTlRJTFwiKTtcbiAgICBjb25zdCBjb3VudFN0ciA9IHRoaXMucnJ1bGVQYXJ0KHJ1bGUsIFwiQ09VTlRcIik7XG4gICAgY29uc3QgY291bnQgICA9IGNvdW50U3RyID8gcGFyc2VJbnQoY291bnRTdHIpIDogOTk5O1xuXG4gICAgY29uc3Qgc3RhcnQgICA9IG5ldyBEYXRlKGV2ZW50LnN0YXJ0RGF0ZSArIFwiVDAwOjAwOjAwXCIpO1xuICAgIGNvbnN0IHJFbmQgICAgPSBuZXcgRGF0ZShyYW5nZUVuZCArIFwiVDAwOjAwOjAwXCIpO1xuICAgIGNvbnN0IHJTdGFydCAgPSBuZXcgRGF0ZShyYW5nZVN0YXJ0ICsgXCJUMDA6MDA6MDBcIik7XG4gICAgY29uc3QgdW50aWxEYXRlID0gdW50aWwgPyBuZXcgRGF0ZSh1bnRpbC5zbGljZSgwLDgpLnJlcGxhY2UoLyhcXGR7NH0pKFxcZHsyfSkoXFxkezJ9KS8sXCIkMS0kMi0kM1wiKSArIFwiVDAwOjAwOjAwXCIpIDogbnVsbDtcblxuICAgIGNvbnN0IGRheU5hbWVzID0gW1wiU1VcIixcIk1PXCIsXCJUVVwiLFwiV0VcIixcIlRIXCIsXCJGUlwiLFwiU0FcIl07XG4gICAgY29uc3QgYnlEYXlzICAgPSBieURheSA/IGJ5RGF5LnNwbGl0KFwiLFwiKSA6IFtdO1xuXG4gICAgbGV0IGN1cnJlbnQgICA9IG5ldyBEYXRlKHN0YXJ0KTtcbiAgICBsZXQgZ2VuZXJhdGVkID0gMDtcblxuICAgIHdoaWxlIChjdXJyZW50IDw9IHJFbmQgJiYgZ2VuZXJhdGVkIDwgY291bnQpIHtcbiAgICAgIGlmICh1bnRpbERhdGUgJiYgY3VycmVudCA+IHVudGlsRGF0ZSkgYnJlYWs7XG5cbiAgICAgIGNvbnN0IGRhdGVTdHIgPSBjdXJyZW50LnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgICAvLyBDYWxjdWxhdGUgZHVyYXRpb24gdG8gYXBwbHkgdG8gZWFjaCBvY2N1cnJlbmNlXG4gICAgICBjb25zdCBkdXJhdGlvbk1zID0gbmV3IERhdGUoZXZlbnQuZW5kRGF0ZSArIFwiVDAwOjAwOjAwXCIpLmdldFRpbWUoKSAtIHN0YXJ0LmdldFRpbWUoKTtcbiAgICAgIGNvbnN0IGVuZERhdGUgICAgPSBuZXcgRGF0ZShjdXJyZW50LmdldFRpbWUoKSArIGR1cmF0aW9uTXMpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgICBpZiAoY3VycmVudCA+PSByU3RhcnQgJiYgIWV2ZW50LmNvbXBsZXRlZEluc3RhbmNlcy5pbmNsdWRlcyhkYXRlU3RyKSkge1xuICAgICAgICByZXN1bHRzLnB1c2goeyAuLi5ldmVudCwgc3RhcnREYXRlOiBkYXRlU3RyLCBlbmREYXRlIH0pO1xuICAgICAgICBnZW5lcmF0ZWQrKztcbiAgICAgIH1cblxuICAgICAgLy8gQWR2YW5jZSB0byBuZXh0IG9jY3VycmVuY2VcbiAgICAgIGlmIChmcmVxID09PSBcIkRBSUxZXCIpIHtcbiAgICAgICAgY3VycmVudC5zZXREYXRlKGN1cnJlbnQuZ2V0RGF0ZSgpICsgMSk7XG4gICAgICB9IGVsc2UgaWYgKGZyZXEgPT09IFwiV0VFS0xZXCIpIHtcbiAgICAgICAgaWYgKGJ5RGF5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gRmluZCBuZXh0IG1hdGNoaW5nIHdlZWtkYXlcbiAgICAgICAgICBjdXJyZW50LnNldERhdGUoY3VycmVudC5nZXREYXRlKCkgKyAxKTtcbiAgICAgICAgICBsZXQgc2FmZXR5ID0gMDtcbiAgICAgICAgICB3aGlsZSAoIWJ5RGF5cy5pbmNsdWRlcyhkYXlOYW1lc1tjdXJyZW50LmdldERheSgpXSkgJiYgc2FmZXR5KysgPCA3KSB7XG4gICAgICAgICAgICBjdXJyZW50LnNldERhdGUoY3VycmVudC5nZXREYXRlKCkgKyAxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudC5zZXREYXRlKGN1cnJlbnQuZ2V0RGF0ZSgpICsgNyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZnJlcSA9PT0gXCJNT05USExZXCIpIHtcbiAgICAgICAgY3VycmVudC5zZXRNb250aChjdXJyZW50LmdldE1vbnRoKCkgKyAxKTtcbiAgICAgIH0gZWxzZSBpZiAoZnJlcSA9PT0gXCJZRUFSTFlcIikge1xuICAgICAgICBjdXJyZW50LnNldEZ1bGxZZWFyKGN1cnJlbnQuZ2V0RnVsbFllYXIoKSArIDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7IC8vIFVua25vd24gZnJlcSBcdTIwMTQgc3RvcCB0byBhdm9pZCBpbmZpbml0ZSBsb29wXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICBwcml2YXRlIHJydWxlUGFydChydWxlOiBzdHJpbmcsIGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXRjaCA9IHJ1bGUubWF0Y2gobmV3IFJlZ0V4cChgKD86Xnw7KSR7a2V5fT0oW147XSspYCkpO1xuICAgIHJldHVybiBtYXRjaCA/IG1hdGNoWzFdIDogXCJcIjtcbiAgfVxuXG4gIHByaXZhdGUgZXZlbnRUb01hcmtkb3duKGV2ZW50OiBDaHJvbmljbGVFdmVudCk6IHN0cmluZyB7XG4gICAgY29uc3QgZm06IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgICAgaWQ6ICAgICAgICAgICAgICAgICAgIGV2ZW50LmlkLFxuICAgICAgdGl0bGU6ICAgICAgICAgICAgICAgIGV2ZW50LnRpdGxlLFxuICAgICAgbG9jYXRpb246ICAgICAgICAgICAgIGV2ZW50LmxvY2F0aW9uID8/IG51bGwsXG4gICAgICBcImFsbC1kYXlcIjogICAgICAgICAgICBldmVudC5hbGxEYXksXG4gICAgICBcInN0YXJ0LWRhdGVcIjogICAgICAgICBldmVudC5zdGFydERhdGUsXG4gICAgICBcInN0YXJ0LXRpbWVcIjogICAgICAgICBldmVudC5zdGFydFRpbWUgPz8gbnVsbCxcbiAgICAgIFwiZW5kLWRhdGVcIjogICAgICAgICAgIGV2ZW50LmVuZERhdGUsXG4gICAgICBcImVuZC10aW1lXCI6ICAgICAgICAgICBldmVudC5lbmRUaW1lID8/IG51bGwsXG4gICAgICByZWN1cnJlbmNlOiAgICAgICAgICAgZXZlbnQucmVjdXJyZW5jZSA/PyBudWxsLFxuICAgICAgXCJjYWxlbmRhci1pZFwiOiAgICAgICAgZXZlbnQuY2FsZW5kYXJJZCA/PyBudWxsLFxuICAgICAgYWxlcnQ6ICAgICAgICAgICAgICAgIGV2ZW50LmFsZXJ0LFxuICAgICAgXCJ0YWdzXCI6ICAgICAgICAgICAgICAgZXZlbnQudGFncyA/PyBbXSxcbiAgICAgIFwibGlua2VkLW5vdGVzXCI6ICAgICAgIGV2ZW50LmxpbmtlZE5vdGVzID8/IFtdLFxuICAgICAgXCJsaW5rZWQtdGFzay1pZHNcIjogICAgZXZlbnQubGlua2VkVGFza0lkcyxcbiAgICAgIFwiY29tcGxldGVkLWluc3RhbmNlc1wiOiBldmVudC5jb21wbGV0ZWRJbnN0YW5jZXMsXG4gICAgICBcImNyZWF0ZWQtYXRcIjogICAgICAgICBldmVudC5jcmVhdGVkQXQsXG4gICAgfTtcblxuICAgIGNvbnN0IHlhbWwgPSBPYmplY3QuZW50cmllcyhmbSlcbiAgICAgIC5tYXAoKFtrLCB2XSkgPT4gYCR7a306ICR7SlNPTi5zdHJpbmdpZnkodil9YClcbiAgICAgIC5qb2luKFwiXFxuXCIpO1xuXG4gICAgY29uc3QgYm9keSA9IGV2ZW50Lm5vdGVzID8gYFxcbiR7ZXZlbnQubm90ZXN9YCA6IFwiXCI7XG4gICAgcmV0dXJuIGAtLS1cXG4ke3lhbWx9XFxuLS0tXFxuJHtib2R5fWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGZpbGVUb0V2ZW50KGZpbGU6IFRGaWxlKTogUHJvbWlzZTxDaHJvbmljbGVFdmVudCB8IG51bGw+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICAgIGNvbnN0IGZtID0gY2FjaGU/LmZyb250bWF0dGVyO1xuICAgICAgaWYgKCFmbT8uaWQgfHwgIWZtPy50aXRsZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgICAgY29uc3QgYm9keU1hdGNoID0gY29udGVudC5tYXRjaCgvXi0tLVxcbltcXHNcXFNdKj9cXG4tLS1cXG4oW1xcc1xcU10qKSQvKTtcbiAgICAgIGNvbnN0IG5vdGVzID0gYm9keU1hdGNoPy5bMV0/LnRyaW0oKSB8fCB1bmRlZmluZWQ7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkOiAgICAgICAgICAgICAgICAgICBmbS5pZCxcbiAgICAgICAgdGl0bGU6ICAgICAgICAgICAgICAgIGZtLnRpdGxlLFxuICAgICAgICBsb2NhdGlvbjogICAgICAgICAgICAgZm0ubG9jYXRpb24gPz8gdW5kZWZpbmVkLFxuICAgICAgICBhbGxEYXk6ICAgICAgICAgICAgICAgZm1bXCJhbGwtZGF5XCJdID8/IHRydWUsXG4gICAgICAgIHN0YXJ0RGF0ZTogICAgICAgICAgICBmbVtcInN0YXJ0LWRhdGVcIl0sXG4gICAgICAgIHN0YXJ0VGltZTogICAgICAgICAgICBmbVtcInN0YXJ0LXRpbWVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBlbmREYXRlOiAgICAgICAgICAgICAgZm1bXCJlbmQtZGF0ZVwiXSxcbiAgICAgICAgZW5kVGltZTogICAgICAgICAgICAgIGZtW1wiZW5kLXRpbWVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICByZWN1cnJlbmNlOiAgICAgICAgICAgZm0ucmVjdXJyZW5jZSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGNhbGVuZGFySWQ6ICAgICAgICAgICBmbVtcImNhbGVuZGFyLWlkXCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgICAgICAgICAgIChmbS5hbGVydCBhcyBBbGVydE9mZnNldCkgPz8gXCJub25lXCIsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgICBmbVtcInRhZ3NcIl0gPz8gW10sXG4gICAgICAgIGxpbmtlZE5vdGVzOiAgICAgICAgICBmbVtcImxpbmtlZC1ub3Rlc1wiXSA/PyBbXSxcbiAgICAgICAgbGlua2VkVGFza0lkczogICAgICAgIGZtW1wibGlua2VkLXRhc2staWRzXCJdID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6ICAgZm1bXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCJdID8/IFtdLFxuICAgICAgICBjcmVhdGVkQXQ6ICAgICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgbm90ZXMsXG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5kRmlsZUZvckV2ZW50KGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLmV2ZW50c0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBudWxsO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoIShjaGlsZCBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGNoaWxkKTtcbiAgICAgIGlmIChjYWNoZT8uZnJvbnRtYXR0ZXI/LmlkID09PSBpZCkgcmV0dXJuIGNoaWxkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMuZXZlbnRzRm9sZGVyKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKHRoaXMuZXZlbnRzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGV2ZW50LSR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNil9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgVGFza01vZGFsIH0gZnJvbSBcIi4uL3VpL1Rhc2tNb2RhbFwiO1xuaW1wb3J0IHR5cGUgQ2hyb25pY2xlUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVUYXNrIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL1Rhc2tNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IFRhc2tGb3JtVmlldywgVEFTS19GT1JNX1ZJRVdfVFlQRSB9IGZyb20gXCIuL1Rhc2tGb3JtVmlld1wiO1xuaW1wb3J0IHsgRXZlbnRNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvRXZlbnRNYW5hZ2VyXCI7XG5cbmV4cG9ydCBjb25zdCBUQVNLX1ZJRVdfVFlQRSA9IFwiY2hyb25pY2xlLXRhc2stdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgVGFza1ZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIHByaXZhdGUgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyO1xuICBwcml2YXRlIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICBwcml2YXRlIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyO1xuICBwcml2YXRlIHBsdWdpbjogQ2hyb25pY2xlUGx1Z2luO1xuICBwcml2YXRlIGN1cnJlbnRMaXN0SWQ6IHN0cmluZyA9IFwidG9kYXlcIjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBsZWFmOiBXb3Jrc3BhY2VMZWFmLFxuICAgIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcixcbiAgICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcixcbiAgICBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcixcbiAgICBwbHVnaW46IENocm9uaWNsZVBsdWdpblxuICApIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLnRhc2tNYW5hZ2VyICAgID0gdGFza01hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5ldmVudE1hbmFnZXIgICA9IGV2ZW50TWFuYWdlcjtcbiAgICB0aGlzLnBsdWdpbiAgICAgICAgID0gcGx1Z2luO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHsgcmV0dXJuIFRBU0tfVklFV19UWVBFOyB9XG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7IHJldHVybiBcIkNocm9uaWNsZVwiOyB9XG4gIGdldEljb24oKTogc3RyaW5nIHsgcmV0dXJuIFwiY2hlY2stY2lyY2xlXCI7IH1cblxuICBhc3luYyBvbk9wZW4oKSB7XG4gICAgYXdhaXQgdGhpcy5yZW5kZXIoKTtcblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUub24oXCJjaGFuZ2VkXCIsIChmaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLnRhc2tNYW5hZ2VyW1widGFza3NGb2xkZXJcIl0pKSB7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwiY3JlYXRlXCIsIChmaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLnRhc2tNYW5hZ2VyW1widGFza3NGb2xkZXJcIl0pKSB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnJlbmRlcigpLCAyMDApO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAudmF1bHQub24oXCJkZWxldGVcIiwgKGZpbGUpID0+IHtcbiAgICAgICAgaWYgKGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMudGFza01hbmFnZXJbXCJ0YXNrc0ZvbGRlclwiXSkpIHtcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBhc3luYyByZW5kZXIoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb250YWluZXIuZW1wdHkoKTtcbiAgICBjb250YWluZXIuYWRkQ2xhc3MoXCJjaHJvbmljbGUtYXBwXCIpO1xuXG4gICAgY29uc3QgYWxsICAgICAgID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRBbGwoKTtcbiAgICBjb25zdCB0b2RheSAgICAgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldER1ZVRvZGF5KCk7XG4gICAgY29uc3Qgc2NoZWR1bGVkID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRTY2hlZHVsZWQoKTtcbiAgICBjb25zdCBmbGFnZ2VkICAgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEZsYWdnZWQoKTtcbiAgICBjb25zdCBvdmVyZHVlICAgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldE92ZXJkdWUoKTtcbiAgICBjb25zdCBjYWxlbmRhcnMgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRBbGwoKTtcblxuICAgIGNvbnN0IGxheW91dCAgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxheW91dFwiKTtcbiAgICBjb25zdCBzaWRlYmFyID0gbGF5b3V0LmNyZWF0ZURpdihcImNocm9uaWNsZS1zaWRlYmFyXCIpO1xuICAgIGNvbnN0IG1haW4gICAgPSBsYXlvdXQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1haW5cIik7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTmV3IHRhc2sgYnV0dG9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IG5ld1Rhc2tCdG4gPSBzaWRlYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJjaHJvbmljbGUtbmV3LXRhc2stYnRuXCIsIHRleHQ6IFwiTmV3IHRhc2tcIlxuICAgIH0pO1xuICAgIG5ld1Rhc2tCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMub3BlblRhc2tGb3JtKCkpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFNtYXJ0IGxpc3QgdGlsZXMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgdGlsZXNHcmlkID0gc2lkZWJhci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGlsZXNcIik7XG5cbiAgICBjb25zdCB0aWxlcyA9IFtcbiAgICAgIHsgaWQ6IFwidG9kYXlcIiwgICAgIGxhYmVsOiBcIlRvZGF5XCIsICAgICBjb3VudDogdG9kYXkubGVuZ3RoICsgb3ZlcmR1ZS5sZW5ndGgsIGNvbG9yOiBcIiNGRjNCMzBcIiwgYmFkZ2U6IG92ZXJkdWUubGVuZ3RoIH0sXG4gICAgICB7IGlkOiBcInNjaGVkdWxlZFwiLCBsYWJlbDogXCJTY2hlZHVsZWRcIiwgY291bnQ6IHNjaGVkdWxlZC5sZW5ndGgsICAgICAgICAgICAgICBjb2xvcjogXCIjMzc4QUREXCIsIGJhZGdlOiAwIH0sXG4gICAgICB7IGlkOiBcImFsbFwiLCAgICAgICBsYWJlbDogXCJBbGxcIiwgICAgICAgY291bnQ6IGFsbC5maWx0ZXIodCA9PiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpLmxlbmd0aCwgY29sb3I6IFwiIzYzNjM2NlwiLCBiYWRnZTogMCB9LFxuICAgICAgeyBpZDogXCJmbGFnZ2VkXCIsICAgbGFiZWw6IFwiRmxhZ2dlZFwiLCAgIGNvdW50OiBmbGFnZ2VkLmxlbmd0aCwgICAgICAgICAgICAgICAgY29sb3I6IFwiI0ZGOTUwMFwiLCBiYWRnZTogMCB9LFxuICAgIF07XG5cbiAgICBmb3IgKGNvbnN0IHRpbGUgb2YgdGlsZXMpIHtcbiAgICAgIGNvbnN0IHQgPSB0aWxlc0dyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGVcIik7XG4gICAgICB0LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRpbGUuY29sb3I7XG4gICAgICBpZiAodGlsZS5pZCA9PT0gdGhpcy5jdXJyZW50TGlzdElkKSB0LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuXG4gICAgICBjb25zdCB0b3BSb3cgPSB0LmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlLXRvcFwiKTtcbiAgICAgIHRvcFJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGlsZS1jb3VudFwiKS5zZXRUZXh0KFN0cmluZyh0aWxlLmNvdW50KSk7XG5cbiAgICAgIGlmICh0aWxlLmJhZGdlID4gMCkge1xuICAgICAgICBjb25zdCBiYWRnZSA9IHRvcFJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGlsZS1iYWRnZVwiKTtcbiAgICAgICAgYmFkZ2Uuc2V0VGV4dChTdHJpbmcodGlsZS5iYWRnZSkpO1xuICAgICAgICBiYWRnZS50aXRsZSA9IGAke3RpbGUuYmFkZ2V9IG92ZXJkdWVgO1xuICAgICAgfVxuXG4gICAgICB0LmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlLWxhYmVsXCIpLnNldFRleHQodGlsZS5sYWJlbCk7XG4gICAgICB0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY3VycmVudExpc3RJZCA9IHRpbGUuaWQ7IHRoaXMucmVuZGVyKCk7IH0pO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBDb21wbGV0ZWQgYXJjaGl2ZSBlbnRyeSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBjb21wbGV0ZWRSb3cgPSBzaWRlYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LXJvd1wiKTtcbiAgICBpZiAodGhpcy5jdXJyZW50TGlzdElkID09PSBcImNvbXBsZXRlZFwiKSBjb21wbGV0ZWRSb3cuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgY29uc3QgY29tcGxldGVkSWNvbiA9IGNvbXBsZXRlZFJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29tcGxldGVkLWljb25cIik7XG4gICAgY29tcGxldGVkSWNvbi5pbm5lckhUTUwgPSBgPHN2ZyB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+PHBhdGggZD1cIk0yMiAxMS4wOFYxMmExMCAxMCAwIDEgMS01LjkzLTkuMTRcIi8+PHBvbHlsaW5lIHBvaW50cz1cIjIyIDQgMTIgMTQuMDEgOSAxMS4wMVwiLz48L3N2Zz5gO1xuICAgIGNvbXBsZXRlZFJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1uYW1lXCIpLnNldFRleHQoXCJDb21wbGV0ZWRcIik7XG4gICAgY29uc3QgY29tcGxldGVkQ291bnQgPSBhbGwuZmlsdGVyKHQgPT4gdC5zdGF0dXMgPT09IFwiZG9uZVwiKS5sZW5ndGg7XG4gICAgaWYgKGNvbXBsZXRlZENvdW50ID4gMCkgY29tcGxldGVkUm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LWNvdW50XCIpLnNldFRleHQoU3RyaW5nKGNvbXBsZXRlZENvdW50KSk7XG4gICAgY29tcGxldGVkUm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY3VycmVudExpc3RJZCA9IFwiY29tcGxldGVkXCI7IHRoaXMucmVuZGVyKCk7IH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE15IExpc3RzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGxpc3RzU2VjdGlvbiA9IHNpZGViYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3RzLXNlY3Rpb25cIik7XG4gICAgbGlzdHNTZWN0aW9uLmNyZWF0ZURpdihcImNocm9uaWNsZS1zZWN0aW9uLWxhYmVsXCIpLnNldFRleHQoXCJNeSBMaXN0c1wiKTtcblxuICAgIGZvciAoY29uc3QgY2FsIG9mIGNhbGVuZGFycykge1xuICAgICAgY29uc3Qgcm93ID0gbGlzdHNTZWN0aW9uLmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LXJvd1wiKTtcbiAgICAgIGlmIChjYWwuaWQgPT09IHRoaXMuY3VycmVudExpc3RJZCkgcm93LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuXG4gICAgICBjb25zdCBkb3QgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3QtZG90XCIpO1xuICAgICAgZG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcik7XG5cbiAgICAgIHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1uYW1lXCIpLnNldFRleHQoY2FsLm5hbWUpO1xuXG4gICAgICBjb25zdCBjYWxDb3VudCA9IGFsbC5maWx0ZXIodCA9PiB0LmNhbGVuZGFySWQgPT09IGNhbC5pZCAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpLmxlbmd0aDtcbiAgICAgIGlmIChjYWxDb3VudCA+IDApIHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1jb3VudFwiKS5zZXRUZXh0KFN0cmluZyhjYWxDb3VudCkpO1xuXG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50TGlzdElkID0gY2FsLmlkOyB0aGlzLnJlbmRlcigpOyB9KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTWFpbiBwYW5lbCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBhd2FpdCB0aGlzLnJlbmRlck1haW5QYW5lbChtYWluLCBhbGwsIG92ZXJkdWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZW5kZXJNYWluUGFuZWwoXG4gICAgbWFpbjogSFRNTEVsZW1lbnQsXG4gICAgYWxsOiBDaHJvbmljbGVUYXNrW10sXG4gICAgb3ZlcmR1ZTogQ2hyb25pY2xlVGFza1tdXG4gICkge1xuICAgIGNvbnN0IGhlYWRlciAgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluLWhlYWRlclwiKTtcbiAgICBjb25zdCB0aXRsZUVsID0gaGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluLXRpdGxlXCIpO1xuXG4gICAgbGV0IHRhc2tzOiBDaHJvbmljbGVUYXNrW10gPSBbXTtcblxuICAgIGNvbnN0IHNtYXJ0Q29sb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgdG9kYXk6IFwiI0ZGM0IzMFwiLCBzY2hlZHVsZWQ6IFwiIzM3OEFERFwiLCBhbGw6IFwiIzYzNjM2NlwiLFxuICAgICAgZmxhZ2dlZDogXCIjRkY5NTAwXCIsIGNvbXBsZXRlZDogXCIjMzRDNzU5XCJcbiAgICB9O1xuXG4gICAgaWYgKHNtYXJ0Q29sb3JzW3RoaXMuY3VycmVudExpc3RJZF0pIHtcbiAgICAgIGNvbnN0IGxhYmVsczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICAgdG9kYXk6IFwiVG9kYXlcIiwgc2NoZWR1bGVkOiBcIlNjaGVkdWxlZFwiLCBhbGw6IFwiQWxsXCIsXG4gICAgICAgIGZsYWdnZWQ6IFwiRmxhZ2dlZFwiLCBjb21wbGV0ZWQ6IFwiQ29tcGxldGVkXCJcbiAgICAgIH07XG4gICAgICB0aXRsZUVsLnNldFRleHQobGFiZWxzW3RoaXMuY3VycmVudExpc3RJZF0pO1xuICAgICAgdGl0bGVFbC5zdHlsZS5jb2xvciA9IHNtYXJ0Q29sb3JzW3RoaXMuY3VycmVudExpc3RJZF07XG5cbiAgICAgIHN3aXRjaCAodGhpcy5jdXJyZW50TGlzdElkKSB7XG4gICAgICAgIGNhc2UgXCJ0b2RheVwiOlxuICAgICAgICAgIHRhc2tzID0gWy4uLm92ZXJkdWUsIC4uLihhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldER1ZVRvZGF5KCkpXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInNjaGVkdWxlZFwiOlxuICAgICAgICAgIHRhc2tzID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRTY2hlZHVsZWQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImZsYWdnZWRcIjpcbiAgICAgICAgICB0YXNrcyA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0RmxhZ2dlZCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiYWxsXCI6XG4gICAgICAgICAgdGFza3MgPSBhbGwuZmlsdGVyKHQgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImNvbXBsZXRlZFwiOlxuICAgICAgICAgIHRhc2tzID0gYWxsLmZpbHRlcih0ID0+IHQuc3RhdHVzID09PSBcImRvbmVcIik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNhbCA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQodGhpcy5jdXJyZW50TGlzdElkKTtcbiAgICAgIHRpdGxlRWwuc2V0VGV4dChjYWw/Lm5hbWUgPz8gXCJMaXN0XCIpO1xuICAgICAgdGl0bGVFbC5zdHlsZS5jb2xvciA9IGNhbFxuICAgICAgICA/IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcilcbiAgICAgICAgOiBcInZhcigtLXRleHQtbm9ybWFsKVwiO1xuICAgICAgdGFza3MgPSBhbGwuZmlsdGVyKFxuICAgICAgICB0ID0+IHQuY2FsZW5kYXJJZCA9PT0gdGhpcy5jdXJyZW50TGlzdElkICYmIHQuc3RhdHVzICE9PSBcImRvbmVcIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBpc0NvbXBsZXRlZCA9IHRoaXMuY3VycmVudExpc3RJZCA9PT0gXCJjb21wbGV0ZWRcIjtcbiAgICBjb25zdCBjb3VudFRhc2tzICA9IGlzQ29tcGxldGVkID8gdGFza3MgOiB0YXNrcy5maWx0ZXIodCA9PiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpO1xuICAgIGNvbnN0IHNob3dTdWJ0aXRsZSA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUYXNrQ291bnRTdWJ0aXRsZSA/PyB0cnVlO1xuICAgIGlmIChjb3VudFRhc2tzLmxlbmd0aCA+IDAgJiYgc2hvd1N1YnRpdGxlKSB7XG4gICAgICBjb25zdCBzdWJ0aXRsZSA9IGhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWFpbi1zdWJ0aXRsZVwiKTtcbiAgICAgIGlmIChpc0NvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCBjbGVhckJ0biA9IHN1YnRpdGxlLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiY2hyb25pY2xlLWNsZWFyLWJ0blwiLCB0ZXh0OiBcIkNsZWFyIGFsbFwiXG4gICAgICAgIH0pO1xuICAgICAgICBjbGVhckJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGFsbDIgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEFsbCgpO1xuICAgICAgICAgIGZvciAoY29uc3QgdCBvZiBhbGwyLmZpbHRlcih0ID0+IHQuc3RhdHVzID09PSBcImRvbmVcIikpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIuZGVsZXRlKHQuaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN1YnRpdGxlLnNldFRleHQoXG4gICAgICAgICAgYCR7Y291bnRUYXNrcy5sZW5ndGh9ICR7Y291bnRUYXNrcy5sZW5ndGggPT09IDEgPyBcInRhc2tcIiA6IFwidGFza3NcIn1gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdEVsID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1saXN0XCIpO1xuXG4gICAgaWYgKHRhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5yZW5kZXJFbXB0eVN0YXRlKGxpc3RFbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGdyb3VwcyA9IHRoaXMuZ3JvdXBUYXNrcyh0YXNrcyk7XG4gICAgICBmb3IgKGNvbnN0IFtncm91cCwgZ3JvdXBUYXNrc10gb2YgT2JqZWN0LmVudHJpZXMoZ3JvdXBzKSkge1xuICAgICAgICBpZiAoZ3JvdXBUYXNrcy5sZW5ndGggPT09IDApIGNvbnRpbnVlO1xuICAgICAgICBsaXN0RWwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWdyb3VwLWxhYmVsXCIpLnNldFRleHQoZ3JvdXApO1xuICAgICAgICBjb25zdCBjYXJkID0gbGlzdEVsLmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLWNhcmQtZ3JvdXBcIik7XG4gICAgICAgIGZvciAoY29uc3QgdGFzayBvZiBncm91cFRhc2tzKSB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJUYXNrUm93KGNhcmQsIHRhc2spO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJFbXB0eVN0YXRlKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBlbXB0eSA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZW1wdHktc3RhdGVcIik7XG4gICAgY29uc3QgaWNvbiAgPSBlbXB0eS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZW1wdHktaWNvblwiKTtcbiAgICBpY29uLmlubmVySFRNTCA9IGA8c3ZnIHdpZHRoPVwiNDhcIiBoZWlnaHQ9XCI0OFwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPjxwYXRoIGQ9XCJNMjIgMTEuMDhWMTJhMTAgMTAgMCAxIDEtNS45My05LjE0XCIvPjxwb2x5bGluZSBwb2ludHM9XCIyMiA0IDEyIDE0LjAxIDkgMTEuMDFcIi8+PC9zdmc+YDtcbiAgICBlbXB0eS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZW1wdHktdGl0bGVcIikuc2V0VGV4dChcIkFsbCBkb25lXCIpO1xuICAgIGVtcHR5LmNyZWF0ZURpdihcImNocm9uaWNsZS1lbXB0eS1zdWJ0aXRsZVwiKS5zZXRUZXh0KFwiTm90aGluZyBsZWZ0IGluIHRoaXMgbGlzdC5cIik7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclRhc2tSb3coY29udGFpbmVyOiBIVE1MRWxlbWVudCwgdGFzazogQ2hyb25pY2xlVGFzaykge1xuICAgIGNvbnN0IHJvdyAgICAgICA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1yb3dcIik7XG4gICAgY29uc3QgaXNEb25lICAgID0gdGFzay5zdGF0dXMgPT09IFwiZG9uZVwiO1xuICAgIGNvbnN0IGlzQXJjaGl2ZSA9IHRoaXMuY3VycmVudExpc3RJZCA9PT0gXCJjb21wbGV0ZWRcIjtcblxuICAgIC8vIENoZWNrYm94XG4gICAgY29uc3QgY2hlY2tib3hXcmFwID0gcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1jaGVja2JveC13cmFwXCIpO1xuICAgIGNvbnN0IGNoZWNrYm94ICAgICA9IGNoZWNrYm94V3JhcC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2hlY2tib3hcIik7XG4gICAgaWYgKGlzRG9uZSkgY2hlY2tib3guYWRkQ2xhc3MoXCJkb25lXCIpO1xuICAgIGNoZWNrYm94LmlubmVySFRNTCA9IGA8c3ZnIGNsYXNzPVwiY2hyb25pY2xlLWNoZWNrbWFya1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiNmZmZcIiBzdHJva2Utd2lkdGg9XCIzXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+PHBvbHlsaW5lIHBvaW50cz1cIjIwIDYgOSAxNyA0IDEyXCIvPjwvc3ZnPmA7XG5cbiAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBjaGVja2JveC5hZGRDbGFzcyhcImNvbXBsZXRpbmdcIik7XG4gICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci51cGRhdGUoe1xuICAgICAgICAgIC4uLnRhc2ssXG4gICAgICAgICAgc3RhdHVzOiAgICAgIGlzRG9uZSA/IFwidG9kb1wiIDogXCJkb25lXCIsXG4gICAgICAgICAgY29tcGxldGVkQXQ6IGlzRG9uZSA/IHVuZGVmaW5lZCA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgfSk7XG4gICAgICB9LCAzMDApO1xuICAgIH0pO1xuXG4gICAgLy8gQ29udGVudFxuICAgIGNvbnN0IGNvbnRlbnQgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stY29udGVudFwiKTtcbiAgICBpZiAoIWlzQXJjaGl2ZSkgY29udGVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5vcGVuVGFza0Zvcm0odGFzaykpO1xuXG4gICAgY29uc3QgdGl0bGVFbCA9IGNvbnRlbnQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stdGl0bGVcIik7XG4gICAgdGl0bGVFbC5zZXRUZXh0KHRhc2sudGl0bGUpO1xuICAgIGlmIChpc0RvbmUpIHRpdGxlRWwuYWRkQ2xhc3MoXCJkb25lXCIpO1xuXG4gICAgLy8gTWV0YVxuICAgIGNvbnN0IHRvZGF5U3RyID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCBtZXRhUm93ICA9IGNvbnRlbnQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stbWV0YVwiKTtcblxuICAgIGlmIChpc0FyY2hpdmUgJiYgdGFzay5jb21wbGV0ZWRBdCkge1xuICAgICAgY29uc3QgY29tcGxldGVkRGF0ZSA9IG5ldyBEYXRlKHRhc2suY29tcGxldGVkQXQpO1xuICAgICAgbWV0YVJvdy5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXRhc2stZGF0ZVwiKS5zZXRUZXh0KFxuICAgICAgICBcIkNvbXBsZXRlZCBcIiArIGNvbXBsZXRlZERhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwge1xuICAgICAgICAgIG1vbnRoOiBcInNob3J0XCIsIGRheTogXCJudW1lcmljXCIsIHllYXI6IFwibnVtZXJpY1wiXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAodGFzay5kdWVEYXRlIHx8IHRhc2suY2FsZW5kYXJJZCkge1xuICAgICAgaWYgKHRhc2suZHVlRGF0ZSkge1xuICAgICAgICBjb25zdCBtZXRhRGF0ZSA9IG1ldGFSb3cuY3JlYXRlU3BhbihcImNocm9uaWNsZS10YXNrLWRhdGVcIik7XG4gICAgICAgIG1ldGFEYXRlLnNldFRleHQodGhpcy5mb3JtYXREYXRlKHRhc2suZHVlRGF0ZSkpO1xuICAgICAgICBpZiAodGFzay5kdWVEYXRlIDwgdG9kYXlTdHIpIG1ldGFEYXRlLmFkZENsYXNzKFwib3ZlcmR1ZVwiKTtcbiAgICAgIH1cbiAgICAgIGlmICh0YXNrLmNhbGVuZGFySWQpIHtcbiAgICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZCh0YXNrLmNhbGVuZGFySWQpO1xuICAgICAgICBpZiAoY2FsKSB7XG4gICAgICAgICAgY29uc3QgY2FsRG90ID0gbWV0YVJvdy5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXRhc2stY2FsLWRvdFwiKTtcbiAgICAgICAgICBjYWxEb3Quc3R5bGUuYmFja2dyb3VuZENvbG9yID0gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKTtcbiAgICAgICAgICBtZXRhUm93LmNyZWF0ZVNwYW4oXCJjaHJvbmljbGUtdGFzay1jYWwtbmFtZVwiKS5zZXRUZXh0KGNhbC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFByaW9yaXR5IGZsYWcgKG5vbi1hcmNoaXZlIG9ubHkpXG4gICAgaWYgKCFpc0FyY2hpdmUgJiYgdGFzay5wcmlvcml0eSA9PT0gXCJoaWdoXCIpIHtcbiAgICAgIHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZmxhZ1wiKS5zZXRUZXh0KFwiXHUyNjkxXCIpO1xuICAgIH1cblxuICAgIC8vIEFyY2hpdmU6IFJlc3RvcmUgKyBEZWxldGUgYnV0dG9uc1xuICAgIGlmIChpc0FyY2hpdmUpIHtcbiAgICAgIGNvbnN0IGFjdGlvbnMgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWFyY2hpdmUtYWN0aW9uc1wiKTtcblxuICAgICAgY29uc3QgcmVzdG9yZUJ0biA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IFwiY2hyb25pY2xlLWFyY2hpdmUtYnRuXCIsIHRleHQ6IFwiUmVzdG9yZVwiXG4gICAgICB9KTtcbiAgICAgIHJlc3RvcmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIudXBkYXRlKHsgLi4udGFzaywgc3RhdHVzOiBcInRvZG9cIiwgY29tcGxldGVkQXQ6IHVuZGVmaW5lZCB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBkZWxldGVCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImNocm9uaWNsZS1hcmNoaXZlLWJ0biBjaHJvbmljbGUtYXJjaGl2ZS1idG4tZGVsZXRlXCIsIHRleHQ6IFwiRGVsZXRlXCJcbiAgICAgIH0pO1xuICAgICAgZGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmRlbGV0ZSh0YXNrLmlkKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmlnaHQtY2xpY2sgY29udGV4dCBtZW51IChub24tYXJjaGl2ZSlcbiAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBtZW51ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG1lbnUuY2xhc3NOYW1lICA9IFwiY2hyb25pY2xlLWNvbnRleHQtbWVudVwiO1xuICAgICAgbWVudS5zdHlsZS5sZWZ0ID0gYCR7ZS5jbGllbnRYfXB4YDtcbiAgICAgIG1lbnUuc3R5bGUudG9wICA9IGAke2UuY2xpZW50WX1weGA7XG5cbiAgICAgIGNvbnN0IGVkaXRJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtXCIpO1xuICAgICAgZWRpdEl0ZW0uc2V0VGV4dChcIkVkaXQgdGFza1wiKTtcbiAgICAgIGVkaXRJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IG1lbnUucmVtb3ZlKCk7IHRoaXMub3BlblRhc2tGb3JtKHRhc2spOyB9KTtcblxuICAgICAgY29uc3QgZGVsZXRlSXRlbSA9IG1lbnUuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbnRleHQtaXRlbSBjaHJvbmljbGUtY29udGV4dC1kZWxldGVcIik7XG4gICAgICBkZWxldGVJdGVtLnNldFRleHQoXCJEZWxldGUgdGFza1wiKTtcbiAgICAgIGRlbGV0ZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbWVudS5yZW1vdmUoKTtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5kZWxldGUodGFzay5pZCk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2FuY2VsSXRlbSA9IG1lbnUuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbnRleHQtaXRlbVwiKTtcbiAgICAgIGNhbmNlbEl0ZW0uc2V0VGV4dChcIkNhbmNlbFwiKTtcbiAgICAgIGNhbmNlbEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IG1lbnUucmVtb3ZlKCkpO1xuXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1lbnUpO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gbWVudS5yZW1vdmUoKSwgeyBvbmNlOiB0cnVlIH0pLCAwKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZ3JvdXBUYXNrcyh0YXNrczogQ2hyb25pY2xlVGFza1tdKTogUmVjb3JkPHN0cmluZywgQ2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgdG9kYXkgICAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IG5leHRXZWVrID0gbmV3IERhdGUoRGF0ZS5ub3coKSArIDcgKiA4NjQwMDAwMCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3Qgd2Vla0FnbyAgPSBuZXcgRGF0ZShEYXRlLm5vdygpIC0gNyAqIDg2NDAwMDAwKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIGlmICh0aGlzLmN1cnJlbnRMaXN0SWQgPT09IFwiY29tcGxldGVkXCIpIHtcbiAgICAgIGNvbnN0IGdyb3VwczogUmVjb3JkPHN0cmluZywgQ2hyb25pY2xlVGFza1tdPiA9IHtcbiAgICAgICAgXCJUb2RheVwiOiAgICAgW10sXG4gICAgICAgIFwiVGhpcyB3ZWVrXCI6IFtdLFxuICAgICAgICBcIkVhcmxpZXJcIjogICBbXSxcbiAgICAgIH07XG4gICAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGFza3MpIHtcbiAgICAgICAgY29uc3QgZCA9IHRhc2suY29tcGxldGVkQXQ/LnNwbGl0KFwiVFwiKVswXSA/PyBcIlwiO1xuICAgICAgICBpZiAoZCA9PT0gdG9kYXkpICAgICAgIGdyb3Vwc1tcIlRvZGF5XCJdLnB1c2godGFzayk7XG4gICAgICAgIGVsc2UgaWYgKGQgPj0gd2Vla0FnbykgZ3JvdXBzW1wiVGhpcyB3ZWVrXCJdLnB1c2godGFzayk7XG4gICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgZ3JvdXBzW1wiRWFybGllclwiXS5wdXNoKHRhc2spO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICB9XG5cbiAgICBjb25zdCBncm91cHM6IFJlY29yZDxzdHJpbmcsIENocm9uaWNsZVRhc2tbXT4gPSB7XG4gICAgICBcIk92ZXJkdWVcIjogICBbXSxcbiAgICAgIFwiVG9kYXlcIjogICAgIFtdLFxuICAgICAgXCJUaGlzIHdlZWtcIjogW10sXG4gICAgICBcIkxhdGVyXCI6ICAgICBbXSxcbiAgICAgIFwiTm8gZGF0ZVwiOiAgIFtdLFxuICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGFza3MpIHtcbiAgICAgIGlmICh0YXNrLnN0YXR1cyA9PT0gXCJkb25lXCIpIGNvbnRpbnVlO1xuICAgICAgaWYgKCF0YXNrLmR1ZURhdGUpICAgICAgICAgICAgeyBncm91cHNbXCJObyBkYXRlXCJdLnB1c2godGFzayk7ICAgY29udGludWU7IH1cbiAgICAgIGlmICh0YXNrLmR1ZURhdGUgPCB0b2RheSkgICAgIHsgZ3JvdXBzW1wiT3ZlcmR1ZVwiXS5wdXNoKHRhc2spOyAgIGNvbnRpbnVlOyB9XG4gICAgICBpZiAodGFzay5kdWVEYXRlID09PSB0b2RheSkgICB7IGdyb3Vwc1tcIlRvZGF5XCJdLnB1c2godGFzayk7ICAgICBjb250aW51ZTsgfVxuICAgICAgaWYgKHRhc2suZHVlRGF0ZSA8PSBuZXh0V2VlaykgeyBncm91cHNbXCJUaGlzIHdlZWtcIl0ucHVzaCh0YXNrKTsgY29udGludWU7IH1cbiAgICAgIGdyb3Vwc1tcIkxhdGVyXCJdLnB1c2godGFzayk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdyb3VwcztcbiAgfVxuXG4gIHByaXZhdGUgZm9ybWF0RGF0ZShkYXRlU3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHRvZGF5ICAgID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCB0b21vcnJvdyA9IG5ldyBEYXRlKERhdGUubm93KCkgKyA4NjQwMDAwMCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5KSAgICByZXR1cm4gXCJUb2RheVwiO1xuICAgIGlmIChkYXRlU3RyID09PSB0b21vcnJvdykgcmV0dXJuIFwiVG9tb3Jyb3dcIjtcbiAgICByZXR1cm4gbmV3IERhdGUoZGF0ZVN0ciArIFwiVDAwOjAwOjAwXCIpLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHtcbiAgICAgIG1vbnRoOiBcInNob3J0XCIsIGRheTogXCJudW1lcmljXCJcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5UYXNrRm9ybSh0YXNrPzogQ2hyb25pY2xlVGFzaykge1xuICAgIG5ldyBUYXNrTW9kYWwoXG4gICAgICB0aGlzLmFwcCxcbiAgICAgIHRoaXMudGFza01hbmFnZXIsXG4gICAgICB0aGlzLmNhbGVuZGFyTWFuYWdlcixcbiAgICAgIHRhc2ssXG4gICAgICB1bmRlZmluZWQsXG4gICAgICAodCkgPT4gdGhpcy5vcGVuVGFza0Z1bGxQYWdlKHQpLFxuICAgICAgdGhpcy5wbHVnaW5cbiAgICApLm9wZW4oKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5UYXNrRnVsbFBhZ2UodGFzaz86IENocm9uaWNsZVRhc2spIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfRk9STV9WSUVXX1RZUEUpWzBdO1xuICAgIGlmIChleGlzdGluZykgZXhpc3RpbmcuZGV0YWNoKCk7XG4gICAgY29uc3QgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogVEFTS19GT1JNX1ZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuXG4gICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMCkpO1xuICAgIGNvbnN0IGZvcm1MZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShUQVNLX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBjb25zdCBmb3JtVmlldyA9IGZvcm1MZWFmPy52aWV3IGFzIFRhc2tGb3JtVmlldyB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZm9ybVZpZXcgJiYgdGFzaykgZm9ybVZpZXcubG9hZFRhc2sodGFzayk7XG4gIH1cbn0iLCAiaW1wb3J0IHsgQ2hyb25pY2xlVGFzaywgVGFza1N0YXR1cywgVGFza1ByaW9yaXR5LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL1Rhc2tNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZVRhc2ssIFRhc2tTdGF0dXMsIFRhc2tQcmlvcml0eSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgVGFza01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSBlZGl0aW5nVGFzazogQ2hyb25pY2xlVGFzayB8IG51bGw7XG4gIHByaXZhdGUgb25TYXZlPzogKCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBvbkV4cGFuZD86ICh0YXNrPzogQ2hyb25pY2xlVGFzaykgPT4gdm9pZDtcblxuICBwcml2YXRlIHBsdWdpbjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcixcbiAgICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcixcbiAgICBlZGl0aW5nVGFzaz86IENocm9uaWNsZVRhc2ssXG4gICAgb25TYXZlPzogKCkgPT4gdm9pZCxcbiAgICBvbkV4cGFuZD86ICh0YXNrPzogQ2hyb25pY2xlVGFzaykgPT4gdm9pZCxcbiAgICBwbHVnaW4/OiBhbnlcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLnRhc2tNYW5hZ2VyICAgID0gdGFza01hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nVGFzayAgICA9IGVkaXRpbmdUYXNrID8/IG51bGw7XG4gICAgdGhpcy5vblNhdmUgICAgICAgICA9IG9uU2F2ZTtcbiAgICB0aGlzLm9uRXhwYW5kICAgICAgID0gb25FeHBhbmQ7XG4gICAgdGhpcy5wbHVnaW4gICAgICAgICA9IHBsdWdpbjtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJjaHJvbmljbGUtZXZlbnQtbW9kYWxcIik7XG5cbiAgICBjb25zdCB0ICAgICAgICAgPSB0aGlzLmVkaXRpbmdUYXNrO1xuICAgIGNvbnN0IGNhbGVuZGFycyA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEhlYWRlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBoZWFkZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWhlYWRlclwiKTtcbiAgICBoZWFkZXIuY3JlYXRlRGl2KFwiY2VtLXRpdGxlXCIpLnNldFRleHQodCA/IFwiRWRpdCB0YXNrXCIgOiBcIk5ldyB0YXNrXCIpO1xuXG4gICAgY29uc3QgZXhwYW5kQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdCBjZW0tZXhwYW5kLWJ0blwiIH0pO1xuICAgIGV4cGFuZEJ0bi50aXRsZSA9IFwiT3BlbiBhcyBmdWxsIHBhZ2VcIjtcbiAgICBleHBhbmRCdG4uaW5uZXJIVE1MID0gYDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPjxwb2x5bGluZSBwb2ludHM9XCIxNSAzIDIxIDMgMjEgOVwiLz48cG9seWxpbmUgcG9pbnRzPVwiOSAyMSAzIDIxIDMgMTVcIi8+PGxpbmUgeDE9XCIyMVwiIHkxPVwiM1wiIHgyPVwiMTRcIiB5Mj1cIjEwXCIvPjxsaW5lIHgxPVwiM1wiIHkxPVwiMjFcIiB4Mj1cIjEwXCIgeTI9XCIxNFwiLz48L3N2Zz5gO1xuICAgIGV4cGFuZEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgdGhpcy5vbkV4cGFuZD8uKHQgPz8gdW5kZWZpbmVkKTtcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBGb3JtIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGZvcm0gPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWZvcm1cIik7XG5cbiAgICAvLyBUaXRsZVxuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGl0bGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLXRpdGxlLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIlRhc2sgbmFtZVwiXG4gICAgfSk7XG4gICAgdGl0bGVJbnB1dC52YWx1ZSA9IHQ/LnRpdGxlID8/IFwiXCI7XG4gICAgdGl0bGVJbnB1dC5mb2N1cygpO1xuXG4gICAgLy8gTG9jYXRpb25cbiAgICBjb25zdCBsb2NhdGlvbklucHV0ID0gdGhpcy5maWVsZChmb3JtLCBcIkxvY2F0aW9uXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLCBwbGFjZWhvbGRlcjogXCJBZGQgbG9jYXRpb25cIlxuICAgIH0pO1xuICAgIGxvY2F0aW9uSW5wdXQudmFsdWUgPSB0Py5sb2NhdGlvbiA/PyBcIlwiO1xuXG4gICAgLy8gU3RhdHVzICsgUHJpb3JpdHlcbiAgICBjb25zdCByb3cxID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG5cbiAgICBjb25zdCBzdGF0dXNTZWxlY3QgPSB0aGlzLmZpZWxkKHJvdzEsIFwiU3RhdHVzXCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHN0YXR1c2VzOiB7IHZhbHVlOiBUYXNrU3RhdHVzOyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwidG9kb1wiLCAgICAgICAgbGFiZWw6IFwiVG8gZG9cIiB9LFxuICAgICAgeyB2YWx1ZTogXCJpbi1wcm9ncmVzc1wiLCBsYWJlbDogXCJJbiBwcm9ncmVzc1wiIH0sXG4gICAgICB7IHZhbHVlOiBcImRvbmVcIiwgICAgICAgIGxhYmVsOiBcIkRvbmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJjYW5jZWxsZWRcIiwgICBsYWJlbDogXCJDYW5jZWxsZWRcIiB9LFxuICAgIF07XG4gICAgY29uc3QgZGVmYXVsdFN0YXR1cyA9IHRoaXMucGx1Z2luPy5zZXR0aW5ncz8uZGVmYXVsdFRhc2tTdGF0dXMgPz8gXCJ0b2RvXCI7XG4gICAgZm9yIChjb25zdCBzIG9mIHN0YXR1c2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSBzdGF0dXNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogcy52YWx1ZSwgdGV4dDogcy5sYWJlbCB9KTtcbiAgICAgIGlmICh0ID8gdC5zdGF0dXMgPT09IHMudmFsdWUgOiBzLnZhbHVlID09PSBkZWZhdWx0U3RhdHVzKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHByaW9yaXR5U2VsZWN0ID0gdGhpcy5maWVsZChyb3cxLCBcIlByaW9yaXR5XCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHByaW9yaXRpZXM6IHsgdmFsdWU6IFRhc2tQcmlvcml0eTsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcIm5vbmVcIiwgICBsYWJlbDogXCJOb25lXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwibG93XCIsICAgIGxhYmVsOiBcIkxvd1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIm1lZGl1bVwiLCBsYWJlbDogXCJNZWRpdW1cIiB9LFxuICAgICAgeyB2YWx1ZTogXCJoaWdoXCIsICAgbGFiZWw6IFwiSGlnaFwiIH0sXG4gICAgXTtcbiAgICBjb25zdCBkZWZhdWx0UHJpb3JpdHkgPSB0aGlzLnBsdWdpbj8uc2V0dGluZ3M/LmRlZmF1bHRUYXNrUHJpb3JpdHkgPz8gXCJub25lXCI7XG4gICAgZm9yIChjb25zdCBwIG9mIHByaW9yaXRpZXMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IHByaW9yaXR5U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHAudmFsdWUsIHRleHQ6IHAubGFiZWwgfSk7XG4gICAgICBpZiAodCA/IHQucHJpb3JpdHkgPT09IHAudmFsdWUgOiBwLnZhbHVlID09PSBkZWZhdWx0UHJpb3JpdHkpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gRHVlIGRhdGUgKyB0aW1lXG4gICAgY29uc3Qgcm93MiA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuXG4gICAgY29uc3QgZHVlRGF0ZUlucHV0ID0gdGhpcy5maWVsZChyb3cyLCBcIkRhdGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcImRhdGVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBkdWVEYXRlSW5wdXQudmFsdWUgPSB0Py5kdWVEYXRlID8/IFwiXCI7XG5cbiAgICBjb25zdCBkdWVUaW1lSW5wdXQgPSB0aGlzLmZpZWxkKHJvdzIsIFwiVGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGR1ZVRpbWVJbnB1dC52YWx1ZSA9IHQ/LmR1ZVRpbWUgPz8gXCJcIjtcblxuICAgIC8vIFJlY3VycmVuY2VcbiAgICBjb25zdCByZWNTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiUmVwZWF0XCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHJlY3VycmVuY2VzID0gW1xuICAgICAgeyB2YWx1ZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJOZXZlclwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9REFJTFlcIiwgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IGRheVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZXCIsICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IHdlZWtcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPU1PTlRITFlcIiwgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSBtb250aFwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9WUVBUkxZXCIsICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IHllYXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWTtCWURBWT1NTyxUVSxXRSxUSCxGUlwiLCAgIGxhYmVsOiBcIldlZWtkYXlzXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgciBvZiByZWN1cnJlbmNlcykge1xuICAgICAgY29uc3Qgb3B0ID0gcmVjU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHIudmFsdWUsIHRleHQ6IHIubGFiZWwgfSk7XG4gICAgICBpZiAodD8ucmVjdXJyZW5jZSA9PT0gci52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBBbGVydFxuICAgIGNvbnN0IGFsZXJ0U2VsZWN0ID0gdGhpcy5maWVsZChmb3JtLCBcIkFsZXJ0XCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHRhc2tBbGVydHM6IHsgdmFsdWU6IEFsZXJ0T2Zmc2V0OyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwibm9uZVwiLCAgICBsYWJlbDogXCJOb25lXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiYXQtdGltZVwiLCBsYWJlbDogXCJBdCB0aW1lIG9mIHRhc2tcIiB9LFxuICAgICAgeyB2YWx1ZTogXCI1bWluXCIsICAgIGxhYmVsOiBcIjUgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxMG1pblwiLCAgIGxhYmVsOiBcIjEwIG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMTVtaW5cIiwgICBsYWJlbDogXCIxNSBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjMwbWluXCIsICAgbGFiZWw6IFwiMzAgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxaG91clwiLCAgIGxhYmVsOiBcIjEgaG91ciBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIyaG91cnNcIiwgIGxhYmVsOiBcIjIgaG91cnMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMWRheVwiLCAgICBsYWJlbDogXCIxIGRheSBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIyZGF5c1wiLCAgIGxhYmVsOiBcIjIgZGF5cyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxd2Vla1wiLCAgIGxhYmVsOiBcIjEgd2VlayBiZWZvcmVcIiB9LFxuICAgIF07IFxuXG4gICAgLy8gQ2FsZW5kYXJcbiAgICBjb25zdCBjYWxTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQ2FsZW5kYXJcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgZGVmYXVsdENhbCA9IHRoaXMucGx1Z2luPy5zZXR0aW5ncz8uZGVmYXVsdENhbGVuZGFySWQgPz8gXCJcIjtcbiAgICBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogXCJcIiwgdGV4dDogXCJOb25lXCIgfSk7XG4gICAgZm9yIChjb25zdCBjYWwgb2YgY2FsZW5kYXJzKSB7XG4gICAgICBjb25zdCBvcHQgPSBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogY2FsLmlkLCB0ZXh0OiBjYWwubmFtZSB9KTtcbiAgICAgIGlmICh0ID8gdC5jYWxlbmRhcklkID09PSBjYWwuaWQgOiBjYWwuaWQgPT09IGRlZmF1bHRDYWwpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHVwZGF0ZUNhbENvbG9yID0gKCkgPT4ge1xuICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChjYWxTZWxlY3QudmFsdWUpO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRDb2xvciA9IGNhbCA/IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcikgOiBcInRyYW5zcGFyZW50XCI7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdFdpZHRoID0gXCI0cHhcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0U3R5bGUgPSBcInNvbGlkXCI7XG4gICAgfTtcbiAgICBjYWxTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB1cGRhdGVDYWxDb2xvcik7XG4gICAgdXBkYXRlQ2FsQ29sb3IoKTtcblxuICAgIC8vIFRhZ3NcbiAgICBjb25zdCB0YWdzSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGFnc1wiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIndvcmssIHBlcnNvbmFsICAoY29tbWEgc2VwYXJhdGVkKVwiXG4gICAgfSk7XG4gICAgdGFnc0lucHV0LnZhbHVlID0gdD8udGFncz8uam9pbihcIiwgXCIpID8/IFwiXCI7XG5cbiAgICBjb25zdCBkZWZhdWx0QWxlcnQgPSB0aGlzLnBsdWdpbj8uc2V0dGluZ3M/LmRlZmF1bHRBbGVydCA/PyBcIm5vbmVcIjtcbiAgICBmb3IgKGNvbnN0IGEgb2YgdGFza0FsZXJ0cykge1xuICAgICAgY29uc3Qgb3B0ID0gYWxlcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogYS52YWx1ZSwgdGV4dDogYS5sYWJlbCB9KTtcbiAgICAgIGlmICh0ID8gdC5hbGVydCA9PT0gYS52YWx1ZSA6IGEudmFsdWUgPT09IGRlZmF1bHRBbGVydCkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIXQpIHtcbiAgICAgIGNvbnN0IG5vbmVPcHQgPSBhbGVydFNlbGVjdC5xdWVyeVNlbGVjdG9yKCdvcHRpb25bdmFsdWU9XCJub25lXCJdJykgYXMgSFRNTE9wdGlvbkVsZW1lbnQ7XG4gICAgICBpZiAobm9uZU9wdCkgbm9uZU9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuICAgIFxuICAgIC8vIFx1MjUwMFx1MjUwMCBGb290ZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgZm9vdGVyID0gY29udGVudEVsLmNyZWF0ZURpdihcImNlbS1mb290ZXJcIik7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gZm9vdGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdFwiLCB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuXG4gICAgaWYgKHQgJiYgdC5pZCkge1xuICAgICAgY29uc3QgZGVsZXRlQnRuID0gZm9vdGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1kZWxldGVcIiwgdGV4dDogXCJEZWxldGUgdGFza1wiIH0pO1xuICAgICAgZGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIuZGVsZXRlKHQuaWQpO1xuICAgICAgICB0aGlzLm9uU2F2ZT8uKCk7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHNhdmVCdG4gPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImNmLWJ0bi1wcmltYXJ5XCIsIHRleHQ6IHQ/LmlkID8gXCJTYXZlXCIgOiBcIkFkZCB0YXNrXCJcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIYW5kbGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuY2xvc2UoKSk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSB0aXRsZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHtcbiAgICAgICAgdGl0bGVJbnB1dC5mb2N1cygpO1xuICAgICAgICB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBEdXBsaWNhdGUgY2hlY2sgKG5ldyB0YXNrcyBvbmx5KVxuICAgICAgaWYgKCF0Py5pZCkge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0QWxsKCk7XG4gICAgICAgIGNvbnN0IGR1cGxpY2F0ZSA9IGV4aXN0aW5nLmZpbmQoZSA9PiBlLnRpdGxlLnRvTG93ZXJDYXNlKCkgPT09IHRpdGxlLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShgQSB0YXNrIG5hbWVkIFwiJHt0aXRsZX1cIiBhbHJlYWR5IGV4aXN0cy5gLCA0MDAwKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRhc2tEYXRhID0ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgc3RhdHVzOiAgICAgIHN0YXR1c1NlbGVjdC52YWx1ZSBhcyBUYXNrU3RhdHVzLFxuICAgICAgICBwcmlvcml0eTogICAgcHJpb3JpdHlTZWxlY3QudmFsdWUgYXMgVGFza1ByaW9yaXR5LFxuICAgICAgICBkdWVEYXRlOiAgICAgZHVlRGF0ZUlucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgZHVlVGltZTogICAgIGR1ZVRpbWVJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGNhbGVuZGFySWQ6ICBjYWxTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICByZWN1cnJlbmNlOiAgcmVjU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgbm90ZXM6ICAgICAgIHQ/Lm5vdGVzLFxuICAgICAgICBsb2NhdGlvbjogICAgbG9jYXRpb25JbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIHRhZ3M6ICAgICAgICB0YWdzSW5wdXQudmFsdWUgPyB0YWdzSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiAodD8udGFncyA/PyBbXSksXG4gICAgICAgIGFsZXJ0OiAgICAgICBhbGVydFNlbGVjdC52YWx1ZSBhcyBBbGVydE9mZnNldCxcbiAgICAgICAgdGFnczogICAgICAgICAgICAgIHQ/LnRhZ3MgPz8gW10sXG4gICAgICAgIGNvbnRleHRzOiAgW10sXG4gICAgICAgIGxpbmtlZE5vdGVzOiAgICAgICB0Py5saW5rZWROb3RlcyA/PyBbXSxcbiAgICAgICAgcHJvamVjdHM6ICAgICAgICAgIHQ/LnByb2plY3RzID8/IFtdLFxuICAgICAgICB0aW1lRXN0aW1hdGU6ICAgICAgdD8udGltZUVzdGltYXRlLFxuICAgICAgICB0aW1lRW50cmllczogICAgICAgdD8udGltZUVudHJpZXMgPz8gW10sXG4gICAgICAgIGN1c3RvbUZpZWxkczogICAgICB0Py5jdXN0b21GaWVsZHMgPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogdD8uY29tcGxldGVkSW5zdGFuY2VzID8/IFtdLFxuICAgICAgfTtcblxuICAgICAgaWYgKHQ/LmlkKSB7XG4gICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIudXBkYXRlKHsgLi4udCwgLi4udGFza0RhdGEgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmNyZWF0ZSh0YXNrRGF0YSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9O1xuXG4gICAgc2F2ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGFuZGxlU2F2ZSk7XG4gICAgdGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZSkgPT4ge1xuICAgICAgaWYgKGUua2V5ID09PSBcIkVudGVyXCIpIGhhbmRsZVNhdmUoKTtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFc2NhcGVcIikgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgb25DbG9zZSgpIHsgdGhpcy5jb250ZW50RWwuZW1wdHkoKTsgfVxuXG4gIHByaXZhdGUgZmllbGQocGFyZW50OiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCB3cmFwID0gcGFyZW50LmNyZWF0ZURpdihcImNmLWZpZWxkXCIpO1xuICAgIHdyYXAuY3JlYXRlRGl2KFwiY2YtbGFiZWxcIikuc2V0VGV4dChsYWJlbCk7XG4gICAgcmV0dXJuIHdyYXA7XG4gIH1cbn0iLCAiaW1wb3J0IHsgQ2hyb25pY2xlVGFzaywgVGFza1N0YXR1cywgVGFza1ByaW9yaXR5LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgSXRlbVZpZXcsIFdvcmtzcGFjZUxlYWYsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgVGFza01hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9UYXNrTWFuYWdlclwiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVUYXNrLCBUYXNrU3RhdHVzLCBUYXNrUHJpb3JpdHkgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNvbnN0IFRBU0tfRk9STV9WSUVXX1RZUEUgPSBcImNocm9uaWNsZS10YXNrLWZvcm1cIjtcblxuZXhwb3J0IGNsYXNzIFRhc2tGb3JtVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSB0YXNrTWFuYWdlcjogVGFza01hbmFnZXI7XG4gIHByaXZhdGUgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXI7XG4gIHByaXZhdGUgZWRpdGluZ1Rhc2s6IENocm9uaWNsZVRhc2sgfCBudWxsID0gbnVsbDtcbiAgb25TYXZlPzogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBsZWFmOiBXb3Jrc3BhY2VMZWFmLFxuICAgIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcixcbiAgICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcixcbiAgICBlZGl0aW5nVGFzaz86IENocm9uaWNsZVRhc2ssXG4gICAgb25TYXZlPzogKCkgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLnRhc2tNYW5hZ2VyID0gdGFza01hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nVGFzayA9IGVkaXRpbmdUYXNrID8/IG51bGw7XG4gICAgdGhpcy5vblNhdmUgPSBvblNhdmU7XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcgeyByZXR1cm4gVEFTS19GT1JNX1ZJRVdfVFlQRTsgfVxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5lZGl0aW5nVGFzayA/IFwiRWRpdCB0YXNrXCIgOiBcIk5ldyB0YXNrXCI7IH1cbiAgZ2V0SWNvbigpOiBzdHJpbmcgeyByZXR1cm4gXCJjaGVjay1jaXJjbGVcIjsgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHsgdGhpcy5yZW5kZXIoKTsgfVxuXG4gIGxvYWRUYXNrKHRhc2s6IENocm9uaWNsZVRhc2spIHtcbiAgICB0aGlzLmVkaXRpbmdUYXNrID0gdGFzaztcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29udGFpbmVyLmVtcHR5KCk7XG4gICAgY29udGFpbmVyLmFkZENsYXNzKFwiY2hyb25pY2xlLWZvcm0tcGFnZVwiKTtcblxuICAgIGNvbnN0IHQgPSB0aGlzLmVkaXRpbmdUYXNrO1xuICAgIGNvbnN0IGNhbGVuZGFycyA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEhlYWRlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBoZWFkZXIgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2YtaGVhZGVyXCIpO1xuICAgIGNvbnN0IGNhbmNlbEJ0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tZ2hvc3RcIiwgdGV4dDogXCJDYW5jZWxcIiB9KTtcbiAgICBoZWFkZXIuY3JlYXRlRGl2KFwiY2YtaGVhZGVyLXRpdGxlXCIpLnNldFRleHQodCA/IFwiRWRpdCB0YXNrXCIgOiBcIk5ldyB0YXNrXCIpO1xuICAgIGNvbnN0IHNhdmVCdG4gPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLXByaW1hcnlcIiwgdGV4dDogdCA/IFwiU2F2ZVwiIDogXCJBZGRcIiB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBGb3JtIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGZvcm0gPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2YtZm9ybVwiKTtcblxuICAgIC8vIFRpdGxlXG4gICAgY29uc3QgdGl0bGVGaWVsZCA9IHRoaXMuZmllbGQoZm9ybSwgXCJUaXRsZVwiKTtcbiAgICBjb25zdCB0aXRsZUlucHV0ID0gdGl0bGVGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgY2xzOiBcImNmLWlucHV0IGNmLXRpdGxlLWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJUYXNrIG5hbWVcIixcbiAgICB9KTtcbiAgICB0aXRsZUlucHV0LnZhbHVlID0gdD8udGl0bGUgPz8gXCJcIjtcbiAgICB0aXRsZUlucHV0LmZvY3VzKCk7XG5cbiAgICAvLyBMb2NhdGlvblxuICAgIGNvbnN0IGxvY2F0aW9uSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTG9jYXRpb25cIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIkFkZCBsb2NhdGlvblwiXG4gICAgfSk7XG4gICAgbG9jYXRpb25JbnB1dC52YWx1ZSA9IHQ/LmxvY2F0aW9uID8/IFwiXCI7XG5cbiAgICAvLyBTdGF0dXMgKyBQcmlvcml0eSAoc2lkZSBieSBzaWRlKVxuICAgIGNvbnN0IHJvdzEgPSBmb3JtLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcblxuICAgIGNvbnN0IHN0YXR1c0ZpZWxkID0gdGhpcy5maWVsZChyb3cxLCBcIlN0YXR1c1wiKTtcbiAgICBjb25zdCBzdGF0dXNTZWxlY3QgPSBzdGF0dXNGaWVsZC5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCBzdGF0dXNlczogeyB2YWx1ZTogVGFza1N0YXR1czsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcInRvZG9cIiwgICAgICAgIGxhYmVsOiBcIlRvIGRvXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiaW4tcHJvZ3Jlc3NcIiwgbGFiZWw6IFwiSW4gcHJvZ3Jlc3NcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJkb25lXCIsICAgICAgICBsYWJlbDogXCJEb25lXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiY2FuY2VsbGVkXCIsICAgbGFiZWw6IFwiQ2FuY2VsbGVkXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgcyBvZiBzdGF0dXNlcykge1xuICAgICAgY29uc3Qgb3B0ID0gc3RhdHVzU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHMudmFsdWUsIHRleHQ6IHMubGFiZWwgfSk7XG4gICAgICBpZiAodD8uc3RhdHVzID09PSBzLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHByaW9yaXR5RmllbGQgPSB0aGlzLmZpZWxkKHJvdzEsIFwiUHJpb3JpdHlcIik7XG4gICAgY29uc3QgcHJpb3JpdHlTZWxlY3QgPSBwcmlvcml0eUZpZWxkLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHByaW9yaXRpZXM6IHsgdmFsdWU6IFRhc2tQcmlvcml0eTsgbGFiZWw6IHN0cmluZzsgY29sb3I6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcIm5vbmVcIiwgICBsYWJlbDogXCJOb25lXCIsICAgY29sb3I6IFwiXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwibG93XCIsICAgIGxhYmVsOiBcIkxvd1wiLCAgICBjb2xvcjogXCIjMzRDNzU5XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwibWVkaXVtXCIsIGxhYmVsOiBcIk1lZGl1bVwiLCBjb2xvcjogXCIjRkY5NTAwXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiaGlnaFwiLCAgIGxhYmVsOiBcIkhpZ2hcIiwgICBjb2xvcjogXCIjRkYzQjMwXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgcCBvZiBwcmlvcml0aWVzKSB7XG4gICAgICBjb25zdCBvcHQgPSBwcmlvcml0eVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBwLnZhbHVlLCB0ZXh0OiBwLmxhYmVsIH0pO1xuICAgICAgaWYgKHQ/LnByaW9yaXR5ID09PSBwLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIER1ZSBkYXRlICsgdGltZSAoc2lkZSBieSBzaWRlKVxuICAgIGNvbnN0IHJvdzIgPSBmb3JtLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcblxuICAgIGNvbnN0IGR1ZURhdGVGaWVsZCA9IHRoaXMuZmllbGQocm93MiwgXCJEYXRlXCIpO1xuICAgIGNvbnN0IGR1ZURhdGVJbnB1dCA9IGR1ZURhdGVGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGR1ZURhdGVJbnB1dC52YWx1ZSA9IHQ/LmR1ZURhdGUgPz8gXCJcIjtcblxuICAgIGNvbnN0IGR1ZVRpbWVGaWVsZCA9IHRoaXMuZmllbGQocm93MiwgXCJUaW1lXCIpO1xuICAgIGNvbnN0IGR1ZVRpbWVJbnB1dCA9IGR1ZVRpbWVGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGR1ZVRpbWVJbnB1dC52YWx1ZSA9IHQ/LmR1ZVRpbWUgPz8gXCJcIjtcblxuICAgIC8vIFJlY3VycmVuY2VcbiAgICBjb25zdCByZWNGaWVsZCA9IHRoaXMuZmllbGQoZm9ybSwgXCJSZXBlYXRcIik7XG4gICAgY29uc3QgcmVjU2VsZWN0ID0gcmVjRmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcmVjdXJyZW5jZXMgPSBbXG4gICAgICB7IHZhbHVlOiBcIlwiLCAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIk5ldmVyXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1EQUlMWVwiLCAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgZGF5XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1XRUVLTFlcIiwgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgd2Vla1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9TU9OVEhMWVwiLCAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IG1vbnRoXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1ZRUFSTFlcIiwgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgeWVhclwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZO0JZREFZPU1PLFRVLFdFLFRILEZSXCIsIGxhYmVsOiBcIldlZWtkYXlzXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgciBvZiByZWN1cnJlbmNlcykge1xuICAgICAgY29uc3Qgb3B0ID0gcmVjU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHIudmFsdWUsIHRleHQ6IHIubGFiZWwgfSk7XG4gICAgICBpZiAodD8ucmVjdXJyZW5jZSA9PT0gci52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBBbGVydFxuICAgIGNvbnN0IGFsZXJ0RmllbGQgID0gdGhpcy5maWVsZChmb3JtLCBcIkFsZXJ0XCIpO1xuICAgIGNvbnN0IGFsZXJ0U2VsZWN0ID0gYWxlcnRGaWVsZC5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCBmb3JtQWxlcnRzOiB7IHZhbHVlOiBBbGVydE9mZnNldDsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcIm5vbmVcIiwgICAgbGFiZWw6IFwiTm9uZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImF0LXRpbWVcIiwgbGFiZWw6IFwiQXQgdGltZSBvZiB0YXNrXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiNW1pblwiLCAgICBsYWJlbDogXCI1IG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMTBtaW5cIiwgICBsYWJlbDogXCIxMCBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjE1bWluXCIsICAgbGFiZWw6IFwiMTUgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIzMG1pblwiLCAgIGxhYmVsOiBcIjMwIG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMWhvdXJcIiwgICBsYWJlbDogXCIxIGhvdXIgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMmhvdXJzXCIsICBsYWJlbDogXCIyIGhvdXJzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjFkYXlcIiwgICAgbGFiZWw6IFwiMSBkYXkgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMmRheXNcIiwgICBsYWJlbDogXCIyIGRheXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMXdlZWtcIiwgICBsYWJlbDogXCIxIHdlZWsgYmVmb3JlXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgYSBvZiBmb3JtQWxlcnRzKSB7XG4gICAgICBjb25zdCBvcHQgPSBhbGVydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBhLnZhbHVlLCB0ZXh0OiBhLmxhYmVsIH0pO1xuICAgICAgaWYgKHQ/LmFsZXJ0ID09PSBhLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIENhbGVuZGFyXG4gICAgY29uc3QgY2FsRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQ2FsZW5kYXJcIik7XG4gICAgY29uc3QgY2FsU2VsZWN0ID0gY2FsRmllbGQuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY2FsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IFwiXCIsIHRleHQ6IFwiTm9uZVwiIH0pO1xuICAgIGZvciAoY29uc3QgY2FsIG9mIGNhbGVuZGFycykge1xuICAgICAgY29uc3Qgb3B0ID0gY2FsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGNhbC5pZCwgdGV4dDogY2FsLm5hbWUgfSk7XG4gICAgICBpZiAodD8uY2FsZW5kYXJJZCA9PT0gY2FsLmlkKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBjYWxlbmRhciBzZWxlY3QgZG90IGNvbG9yXG4gICAgY29uc3QgdXBkYXRlQ2FsQ29sb3IgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGNhbFNlbGVjdC52YWx1ZSk7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdENvbG9yID0gY2FsID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSA6IFwidHJhbnNwYXJlbnRcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0V2lkdGggPSBcIjRweFwiO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRTdHlsZSA9IFwic29saWRcIjtcbiAgICB9O1xuICAgIGNhbFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHVwZGF0ZUNhbENvbG9yKTtcbiAgICB1cGRhdGVDYWxDb2xvcigpO1xuXG4gICAgLy8gVGFnc1xuICAgIGNvbnN0IHRhZ3NGaWVsZCA9IHRoaXMuZmllbGQoZm9ybSwgXCJUYWdzXCIpO1xuICAgIGNvbnN0IHRhZ3NJbnB1dCA9IHRhZ3NGaWVsZC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIndvcmssIHBlcnNvbmFsLCB1cmdlbnQgIChjb21tYSBzZXBhcmF0ZWQpXCJcbiAgICB9KTtcbiAgICB0YWdzSW5wdXQudmFsdWUgPSB0Py50YWdzLmpvaW4oXCIsIFwiKSA/PyBcIlwiO1xuXG4gICAgLy8gTGlua2VkIG5vdGVzXG4gICAgY29uc3QgbGlua2VkRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTGlua2VkIG5vdGVzXCIpO1xuICAgIGNvbnN0IGxpbmtlZElucHV0ID0gbGlua2VkRmllbGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJQcm9qZWN0cy9XZWJzaXRlLCBKb3VybmFsLzIwMjQgIChjb21tYSBzZXBhcmF0ZWQpXCJcbiAgICB9KTtcbiAgICBsaW5rZWRJbnB1dC52YWx1ZSA9IHQ/LmxpbmtlZE5vdGVzLmpvaW4oXCIsIFwiKSA/PyBcIlwiO1xuXG4gICAgLy8gTm90ZXNcbiAgICBjb25zdCBub3Rlc0ZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIk5vdGVzXCIpO1xuICAgIGNvbnN0IG5vdGVzSW5wdXQgPSBub3Rlc0ZpZWxkLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcImNmLXRleHRhcmVhXCIsIHBsYWNlaG9sZGVyOiBcIkFkZCBub3Rlcy4uLlwiXG4gICAgfSk7XG4gICAgbm90ZXNJbnB1dC52YWx1ZSA9IHQ/Lm5vdGVzID8/IFwiXCI7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQWN0aW9ucyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVEFTS19GT1JNX1ZJRVdfVFlQRSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSB0aXRsZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHsgdGl0bGVJbnB1dC5mb2N1cygpOyB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTsgcmV0dXJuOyB9XG5cbiAgLy8gQ2hlY2sgZm9yIGR1cGxpY2F0ZSB0aXRsZVxuICAgICAgaWYgKCF0aGlzLmVkaXRpbmdUYXNrKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRBbGwoKTtcbiAgICAgICAgY29uc3QgZHVwbGljYXRlID0gZXhpc3RpbmcuZmluZChcbiAgICAgICAgICB0ID0+IHQudGl0bGUudG9Mb3dlckNhc2UoKSA9PT0gdGl0bGUudG9Mb3dlckNhc2UoKVxuICAgICAgICApO1xuICAgICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShgQSB0YXNrIG5hbWVkIFwiJHt0aXRsZX1cIiBhbHJlYWR5IGV4aXN0cy5gLCA0MDAwKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRhc2tEYXRhID0ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgbG9jYXRpb246ICAgIGxvY2F0aW9uSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBzdGF0dXM6ICAgICAgICBzdGF0dXNTZWxlY3QudmFsdWUgYXMgVGFza1N0YXR1cyxcbiAgICAgICAgcHJpb3JpdHk6ICAgICAgcHJpb3JpdHlTZWxlY3QudmFsdWUgYXMgVGFza1ByaW9yaXR5LFxuICAgICAgICBkdWVEYXRlOiAgICAgICBkdWVEYXRlSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBkdWVUaW1lOiAgICAgICBkdWVUaW1lSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBjYWxlbmRhcklkOiAgICBjYWxTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICByZWN1cnJlbmNlOiAgICByZWNTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICB0YWdzOiAgICAgICAgICB0YWdzSW5wdXQudmFsdWUgPyB0YWdzSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiBbXSxcbiAgICAgICAgY29udGV4dHM6ICAgICAgW10sXG4gICAgICAgIGxpbmtlZE5vdGVzOiAgIGxpbmtlZElucHV0LnZhbHVlID8gbGlua2VkSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiBbXSxcbiAgICAgICAgcHJvamVjdHM6ICAgICAgdD8ucHJvamVjdHMgPz8gW10sXG4gICAgICAgIHRpbWVFbnRyaWVzOiAgIHQ/LnRpbWVFbnRyaWVzID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6IHQ/LmNvbXBsZXRlZEluc3RhbmNlcyA/PyBbXSxcbiAgICAgICAgY3VzdG9tRmllbGRzOiAgdD8uY3VzdG9tRmllbGRzID8/IFtdLFxuICAgICAgICBhbGVydDogICAgICAgICBhbGVydFNlbGVjdC52YWx1ZSBhcyBBbGVydE9mZnNldCxcbiAgICAgICAgbm90ZXM6ICAgICAgICAgbm90ZXNJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICB9O1xuXG4gICAgICBpZiAodCkge1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLnVwZGF0ZSh7IC4uLnQsIC4uLnRhc2tEYXRhIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5jcmVhdGUodGFza0RhdGEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm9uU2F2ZT8uKCk7XG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFRBU0tfRk9STV9WSUVXX1RZUEUpO1xuICAgIH07XG5cbiAgICBzYXZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoYW5kbGVTYXZlKTtcblxuICAgIC8vIFRhYiB0aHJvdWdoIGZpZWxkcyBuYXR1cmFsbHksIEVudGVyIG9uIHRpdGxlIHNhdmVzXG4gICAgdGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZSkgPT4ge1xuICAgICAgaWYgKGUua2V5ID09PSBcIkVudGVyXCIpIGhhbmRsZVNhdmUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZmllbGQocGFyZW50OiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCB3cmFwID0gcGFyZW50LmNyZWF0ZURpdihcImNmLWZpZWxkXCIpO1xuICAgIHdyYXAuY3JlYXRlRGl2KFwiY2YtbGFiZWxcIikuc2V0VGV4dChsYWJlbCk7XG4gICAgcmV0dXJuIHdyYXA7XG4gIH1cbn0iLCAiaW1wb3J0IHsgSXRlbVZpZXcsIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0V2ZW50TWFuYWdlclwiO1xuaW1wb3J0IHsgVGFza01hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9UYXNrTWFuYWdlclwiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVFdmVudCwgQ2hyb25pY2xlVGFzayB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgRXZlbnRNb2RhbCB9IGZyb20gXCIuLi91aS9FdmVudE1vZGFsXCI7XG5pbXBvcnQgeyBFdmVudEZvcm1WaWV3LCBFVkVOVF9GT1JNX1ZJRVdfVFlQRSB9IGZyb20gXCIuL0V2ZW50Rm9ybVZpZXdcIjtcbmltcG9ydCB0eXBlIENocm9uaWNsZVBsdWdpbiBmcm9tIFwiLi4vbWFpblwiO1xuXG5leHBvcnQgY29uc3QgQ0FMRU5EQVJfVklFV19UWVBFID0gXCJjaHJvbmljbGUtY2FsZW5kYXItdmlld1wiO1xudHlwZSBDYWxlbmRhck1vZGUgPSBcImRheVwiIHwgXCJ3ZWVrXCIgfCBcIm1vbnRoXCIgfCBcInllYXJcIjtcbmNvbnN0IEhPVVJfSEVJR0hUID0gNTY7XG5cbmV4cG9ydCBjbGFzcyBDYWxlbmRhclZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIHByaXZhdGUgZXZlbnRNYW5hZ2VyOiAgICBFdmVudE1hbmFnZXI7XG4gIHByaXZhdGUgdGFza01hbmFnZXI6ICAgICBUYXNrTWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSBwbHVnaW46ICAgICAgICAgIENocm9uaWNsZVBsdWdpbjtcbiAgcHJpdmF0ZSBjdXJyZW50RGF0ZTogRGF0ZSAgICAgICAgID0gbmV3IERhdGUoKTtcbiAgcHJpdmF0ZSBtb2RlOiAgICAgICAgQ2FsZW5kYXJNb2RlID0gXCJ3ZWVrXCI7XG4gIHByaXZhdGUgX21vZGVTZXQgICAgICAgICAgICAgICAgICA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICAgZXZlbnRNYW5hZ2VyOiAgICBFdmVudE1hbmFnZXIsXG4gICAgdGFza01hbmFnZXI6ICAgICBUYXNrTWFuYWdlcixcbiAgICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcixcbiAgICBwbHVnaW46ICAgICAgICAgIENocm9uaWNsZVBsdWdpblxuICApIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLmV2ZW50TWFuYWdlciAgICA9IGV2ZW50TWFuYWdlcjtcbiAgICB0aGlzLnRhc2tNYW5hZ2VyICAgICA9IHRhc2tNYW5hZ2VyO1xuICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyID0gY2FsZW5kYXJNYW5hZ2VyO1xuICAgIHRoaXMucGx1Z2luICAgICAgICAgID0gcGx1Z2luO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogICAgc3RyaW5nIHsgcmV0dXJuIENBTEVOREFSX1ZJRVdfVFlQRTsgfVxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gXCJDaHJvbmljbGUgQ2FsZW5kYXJcIjsgfVxuICBnZXRJY29uKCk6ICAgICAgICBzdHJpbmcgeyByZXR1cm4gXCJjYWxlbmRhclwiOyB9XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG5cbiAgICAvLyBTYW1lIHBlcm1hbmVudCBmaXggYXMgdGFzayBkYXNoYm9hcmQgXHUyMDE0IG1ldGFkYXRhQ2FjaGUgZmlyZXMgYWZ0ZXJcbiAgICAvLyBmcm9udG1hdHRlciBpcyBmdWxseSBwYXJzZWQsIHNvIGRhdGEgaXMgZnJlc2ggd2hlbiB3ZSByZS1yZW5kZXJcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBjb25zdCBpbkV2ZW50cyA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMuZXZlbnRNYW5hZ2VyW1wiZXZlbnRzRm9sZGVyXCJdKTtcbiAgICAgICAgY29uc3QgaW5UYXNrcyAgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLnRhc2tNYW5hZ2VyW1widGFza3NGb2xkZXJcIl0pO1xuICAgICAgICBpZiAoaW5FdmVudHMgfHwgaW5UYXNrcykgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC52YXVsdC5vbihcImNyZWF0ZVwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBjb25zdCBpbkV2ZW50cyA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMuZXZlbnRNYW5hZ2VyW1wiZXZlbnRzRm9sZGVyXCJdKTtcbiAgICAgICAgY29uc3QgaW5UYXNrcyAgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLnRhc2tNYW5hZ2VyW1widGFza3NGb2xkZXJcIl0pO1xuICAgICAgICBpZiAoaW5FdmVudHMgfHwgaW5UYXNrcykgc2V0VGltZW91dCgoKSA9PiB0aGlzLnJlbmRlcigpLCAyMDApO1xuICAgICAgfSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwiZGVsZXRlXCIsIChmaWxlKSA9PiB7XG4gICAgICAgIGNvbnN0IGluRXZlbnRzID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5ldmVudE1hbmFnZXJbXCJldmVudHNGb2xkZXJcIl0pO1xuICAgICAgICBjb25zdCBpblRhc2tzICA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMudGFza01hbmFnZXJbXCJ0YXNrc0ZvbGRlclwiXSk7XG4gICAgICAgIGlmIChpbkV2ZW50cyB8fCBpblRhc2tzKSB0aGlzLnJlbmRlcigpO1xuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgcmVuZGVyKCkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29udGFpbmVyLmVtcHR5KCk7XG4gICAgY29udGFpbmVyLmFkZENsYXNzKFwiY2hyb25pY2xlLWNhbC1hcHBcIik7XG5cbiAgICBjb25zdCB0YXNrcyAgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgLy8gQXBwbHkgZGVmYXVsdCB2aWV3IGZyb20gc2V0dGluZ3MgaWYgdGhpcyBpcyB0aGUgZmlyc3QgcmVuZGVyXG4gICAgaWYgKCF0aGlzLl9tb2RlU2V0KSB7XG4gICAgICB0aGlzLm1vZGUgICAgID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdENhbGVuZGFyVmlldyA/PyBcIndlZWtcIjtcbiAgICAgIHRoaXMuX21vZGVTZXQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIEdldCBkYXRlIHJhbmdlIGZvciBjdXJyZW50IHZpZXcgc28gcmVjdXJyZW5jZSBleHBhbnNpb24gaXMgc2NvcGVkXG4gICAgY29uc3QgcmFuZ2VTdGFydCA9IHRoaXMuZ2V0UmFuZ2VTdGFydCgpO1xuICAgIGNvbnN0IHJhbmdlRW5kICAgPSB0aGlzLmdldFJhbmdlRW5kKCk7XG4gICAgY29uc3QgZXZlbnRzICAgICA9IGF3YWl0IHRoaXMuZXZlbnRNYW5hZ2VyLmdldEluUmFuZ2VXaXRoUmVjdXJyZW5jZShyYW5nZVN0YXJ0LCByYW5nZUVuZCk7XG5cbiAgICBjb25zdCBsYXlvdXQgID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1jYWwtbGF5b3V0XCIpO1xuICAgIGNvbnN0IHNpZGViYXIgPSBsYXlvdXQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC1zaWRlYmFyXCIpO1xuICAgIGNvbnN0IG1haW4gICAgPSBsYXlvdXQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC1tYWluXCIpO1xuXG4gICAgdGhpcy5yZW5kZXJTaWRlYmFyKHNpZGViYXIpO1xuICAgIHRoaXMucmVuZGVyVG9vbGJhcihtYWluKTtcblxuICAgIGlmICAgICAgKHRoaXMubW9kZSA9PT0gXCJ5ZWFyXCIpICB0aGlzLnJlbmRlclllYXJWaWV3KG1haW4sIGV2ZW50cywgdGFza3MpO1xuICAgIGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gXCJtb250aFwiKSB0aGlzLnJlbmRlck1vbnRoVmlldyhtYWluLCBldmVudHMsIHRhc2tzKTtcbiAgICBlbHNlIGlmICh0aGlzLm1vZGUgPT09IFwid2Vla1wiKSAgdGhpcy5yZW5kZXJXZWVrVmlldyhtYWluLCBldmVudHMsIHRhc2tzKTtcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyRGF5VmlldyhtYWluLCBldmVudHMsIHRhc2tzKTtcbiAgfVxuXG5wcml2YXRlIGFzeW5jIG9wZW5FdmVudEZ1bGxQYWdlKGV2ZW50PzogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEVWRU5UX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBpZiAoZXhpc3RpbmcpIGV4aXN0aW5nLmRldGFjaCgpO1xuICAgIGNvbnN0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IEVWRU5UX0ZPUk1fVklFV19UWVBFLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7XG4gICAgY29uc3QgZm9ybUxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKEVWRU5UX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBjb25zdCBmb3JtVmlldyA9IGZvcm1MZWFmPy52aWV3IGFzIEV2ZW50Rm9ybVZpZXcgfCB1bmRlZmluZWQ7XG4gICAgaWYgKGZvcm1WaWV3ICYmIGV2ZW50KSBmb3JtVmlldy5sb2FkRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNpZGViYXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbnByaXZhdGUgZ2V0UmFuZ2VTdGFydCgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwiZGF5XCIpIHJldHVybiB0aGlzLmN1cnJlbnREYXRlLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwid2Vla1wiKSB7XG4gICAgICBjb25zdCBzID0gdGhpcy5nZXRXZWVrU3RhcnQoKTtcbiAgICAgIHJldHVybiBzLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb2RlID09PSBcInllYXJcIikgcmV0dXJuIGAke3RoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKX0tMDEtMDFgO1xuICAgIC8vIG1vbnRoXG4gICAgY29uc3QgeSA9IHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBtID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRNb250aCgpO1xuICAgIHJldHVybiBgJHt5fS0ke1N0cmluZyhtKzEpLnBhZFN0YXJ0KDIsXCIwXCIpfS0wMWA7XG4gIH1cblxuICBwcml2YXRlIGdldFJhbmdlRW5kKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJkYXlcIikgcmV0dXJuIHRoaXMuY3VycmVudERhdGUudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJ3ZWVrXCIpIHtcbiAgICAgIGNvbnN0IHMgPSB0aGlzLmdldFdlZWtTdGFydCgpO1xuICAgICAgY29uc3QgZSA9IG5ldyBEYXRlKHMpOyBlLnNldERhdGUoZS5nZXREYXRlKCkgKyA2KTtcbiAgICAgIHJldHVybiBlLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb2RlID09PSBcInllYXJcIikgcmV0dXJuIGAke3RoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKX0tMTItMzFgO1xuICAgIC8vIG1vbnRoXG4gICAgY29uc3QgeSA9IHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBtID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRNb250aCgpO1xuICAgIHJldHVybiBuZXcgRGF0ZSh5LCBtICsgMSwgMCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclNpZGViYXIoc2lkZWJhcjogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBuZXdFdmVudEJ0biA9IHNpZGViYXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImNocm9uaWNsZS1uZXctdGFzay1idG5cIiwgdGV4dDogXCJOZXcgZXZlbnRcIlxuICAgIH0pO1xuICAgIG5ld0V2ZW50QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBuZXcgRXZlbnRNb2RhbChcbiAgICAgICAgdGhpcy5hcHAsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlcixcbiAgICAgICAgdW5kZWZpbmVkLCAoKSA9PiB0aGlzLnJlbmRlcigpLCAoZSkgPT4gdGhpcy5vcGVuRXZlbnRGdWxsUGFnZShlKVxuICAgICAgKS5vcGVuKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlck1pbmlDYWxlbmRhcihzaWRlYmFyKTtcblxuICAgIGNvbnN0IGNhbFNlY3Rpb24gPSBzaWRlYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0cy1zZWN0aW9uXCIpO1xuICAgIGNhbFNlY3Rpb24uY3JlYXRlRGl2KFwiY2hyb25pY2xlLXNlY3Rpb24tbGFiZWxcIikuc2V0VGV4dChcIk15IENhbGVuZGFyc1wiKTtcblxuICAgIGZvciAoY29uc3QgY2FsIG9mIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpKSB7XG4gICAgICBjb25zdCByb3cgICAgPSBjYWxTZWN0aW9uLmNyZWF0ZURpdihcImNocm9uaWNsZS1jYWwtbGlzdC1yb3dcIik7XG4gICAgICBjb25zdCB0b2dnbGUgPSByb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiwgY2xzOiBcImNocm9uaWNsZS1jYWwtdG9nZ2xlXCIgfSk7XG4gICAgICB0b2dnbGUuY2hlY2tlZCA9IGNhbC5pc1Zpc2libGU7XG4gICAgICB0b2dnbGUuc3R5bGUuYWNjZW50Q29sb3IgPSBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpO1xuICAgICAgdG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmNhbGVuZGFyTWFuYWdlci50b2dnbGVWaXNpYmlsaXR5KGNhbC5pZCk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRvdCA9IHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1kb3RcIik7XG4gICAgICBkb3Quc3R5bGUuYmFja2dyb3VuZENvbG9yID0gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKTtcbiAgICAgIHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1uYW1lXCIpLnNldFRleHQoY2FsLm5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTWluaUNhbGVuZGFyKHBhcmVudDogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBtaW5pICAgPSBwYXJlbnQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktY2FsXCIpO1xuICAgIGNvbnN0IGhlYWRlciA9IG1pbmkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktY2FsLWhlYWRlclwiKTtcblxuICAgIGNvbnN0IHByZXZCdG4gICAgPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2hyb25pY2xlLW1pbmktbmF2XCIsIHRleHQ6IFwiXHUyMDM5XCIgfSk7XG4gICAgY29uc3QgbW9udGhMYWJlbCA9IGhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1tb250aC1sYWJlbFwiKTtcbiAgICBjb25zdCBuZXh0QnRuICAgID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNocm9uaWNsZS1taW5pLW5hdlwiLCB0ZXh0OiBcIlx1MjAzQVwiIH0pO1xuXG4gICAgY29uc3QgeWVhciAgPSB0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgY29uc3QgbW9udGggPSB0aGlzLmN1cnJlbnREYXRlLmdldE1vbnRoKCk7XG4gICAgbW9udGhMYWJlbC5zZXRUZXh0KFxuICAgICAgbmV3IERhdGUoeWVhciwgbW9udGgpLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgbW9udGg6IFwibG9uZ1wiLCB5ZWFyOiBcIm51bWVyaWNcIiB9KVxuICAgICk7XG5cbiAgICBwcmV2QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmN1cnJlbnREYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGggLSAxLCAxKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG4gICAgbmV4dEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jdXJyZW50RGF0ZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoICsgMSwgMSk7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgZ3JpZCAgICAgICAgPSBtaW5pLmNyZWF0ZURpdihcImNocm9uaWNsZS1taW5pLWdyaWRcIik7XG4gICAgY29uc3QgZmlyc3REYXkgICAgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgMSkuZ2V0RGF5KCk7XG4gICAgY29uc3QgZGF5c0luTW9udGggPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCArIDEsIDApLmdldERhdGUoKTtcbiAgICBjb25zdCB0b2RheVN0ciAgICA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBmb3IgKGNvbnN0IGQgb2YgW1wiU1wiLFwiTVwiLFwiVFwiLFwiV1wiLFwiVFwiLFwiRlwiLFwiU1wiXSlcbiAgICAgIGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktZGF5LW5hbWVcIikuc2V0VGV4dChkKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlyc3REYXk7IGkrKylcbiAgICAgIGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktZGF5IGNocm9uaWNsZS1taW5pLWRheS1lbXB0eVwiKTtcblxuICAgIGZvciAobGV0IGQgPSAxOyBkIDw9IGRheXNJbk1vbnRoOyBkKyspIHtcbiAgICAgIGNvbnN0IGRhdGVTdHIgPSBgJHt5ZWFyfS0ke1N0cmluZyhtb250aCsxKS5wYWRTdGFydCgyLFwiMFwiKX0tJHtTdHJpbmcoZCkucGFkU3RhcnQoMixcIjBcIil9YDtcbiAgICAgIGNvbnN0IGRheUVsICAgPSBncmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1taW5pLWRheVwiKTtcbiAgICAgIGRheUVsLnNldFRleHQoU3RyaW5nKGQpKTtcbiAgICAgIGlmIChkYXRlU3RyID09PSB0b2RheVN0cikgZGF5RWwuYWRkQ2xhc3MoXCJ0b2RheVwiKTtcbiAgICAgIGRheUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuY3VycmVudERhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZCk7XG4gICAgICAgIHRoaXMubW9kZSA9IFwiZGF5XCI7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgVG9vbGJhciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHJlbmRlclRvb2xiYXIobWFpbjogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCB0b29sYmFyICA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC10b29sYmFyXCIpO1xuICAgIGNvbnN0IG5hdkdyb3VwID0gdG9vbGJhci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2FsLW5hdi1ncm91cFwiKTtcblxuICAgIG5hdkdyb3VwLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNocm9uaWNsZS1jYWwtbmF2LWJ0blwiLCB0ZXh0OiBcIlx1MjAzOVwiIH0pXG4gICAgICAuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMubmF2aWdhdGUoLTEpKTtcbiAgICBuYXZHcm91cC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjaHJvbmljbGUtY2FsLXRvZGF5LWJ0blwiLCB0ZXh0OiBcIlRvZGF5XCIgfSlcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmN1cnJlbnREYXRlID0gbmV3IERhdGUoKTsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgbmF2R3JvdXAuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2hyb25pY2xlLWNhbC1uYXYtYnRuXCIsIHRleHQ6IFwiXHUyMDNBXCIgfSlcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZSgxKSk7XG5cbiAgICB0b29sYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS1jYWwtdG9vbGJhci10aXRsZVwiKS5zZXRUZXh0KHRoaXMuZ2V0VG9vbGJhclRpdGxlKCkpO1xuXG4gICAgY29uc3QgcGlsbHMgPSB0b29sYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS12aWV3LXBpbGxzXCIpO1xuICAgIGZvciAoY29uc3QgW20sIGxhYmVsXSBvZiBbW1wiZGF5XCIsXCJEYXlcIl0sW1wid2Vla1wiLFwiV2Vla1wiXSxbXCJtb250aFwiLFwiTW9udGhcIl0sW1wieWVhclwiLFwiWWVhclwiXV0gYXMgW0NhbGVuZGFyTW9kZSxzdHJpbmddW10pIHtcbiAgICAgIGNvbnN0IHBpbGwgPSBwaWxscy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdmlldy1waWxsXCIpO1xuICAgICAgcGlsbC5zZXRUZXh0KGxhYmVsKTtcbiAgICAgIGlmICh0aGlzLm1vZGUgPT09IG0pIHBpbGwuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICBwaWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMubW9kZSA9IG07IHRoaXMucmVuZGVyKCk7IH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbmF2aWdhdGUoZGlyOiBudW1iZXIpIHtcbiAgICBjb25zdCBkID0gbmV3IERhdGUodGhpcy5jdXJyZW50RGF0ZSk7XG4gICAgaWYgICAgICAodGhpcy5tb2RlID09PSBcImRheVwiKSAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgZGlyKTtcbiAgICBlbHNlIGlmICh0aGlzLm1vZGUgPT09IFwid2Vla1wiKSBkLnNldERhdGUoZC5nZXREYXRlKCkgKyBkaXIgKiA3KTtcbiAgICBlbHNlIGlmICh0aGlzLm1vZGUgPT09IFwieWVhclwiKSBkLnNldEZ1bGxZZWFyKGQuZ2V0RnVsbFllYXIoKSArIGRpcik7XG4gICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgIGQuc2V0TW9udGgoZC5nZXRNb250aCgpICsgZGlyKTtcbiAgICB0aGlzLmN1cnJlbnREYXRlID0gZDtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRUb29sYmFyVGl0bGUoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcInllYXJcIikgIHJldHVybiBTdHJpbmcodGhpcy5jdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpKTtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcIm1vbnRoXCIpIHJldHVybiB0aGlzLmN1cnJlbnREYXRlLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgbW9udGg6IFwibG9uZ1wiLCB5ZWFyOiBcIm51bWVyaWNcIiB9KTtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcImRheVwiKSAgIHJldHVybiB0aGlzLmN1cnJlbnREYXRlLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgd2Vla2RheTogXCJsb25nXCIsIG1vbnRoOiBcImxvbmdcIiwgZGF5OiBcIm51bWVyaWNcIiwgeWVhcjogXCJudW1lcmljXCIgfSk7XG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLmdldFdlZWtTdGFydCgpO1xuICAgIGNvbnN0IGVuZCAgID0gbmV3IERhdGUoc3RhcnQpOyBlbmQuc2V0RGF0ZShlbmQuZ2V0RGF0ZSgpICsgNik7XG4gICAgcmV0dXJuIGAke3N0YXJ0LnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIseyBtb250aDpcInNob3J0XCIsIGRheTpcIm51bWVyaWNcIiB9KX0gXHUyMDEzICR7ZW5kLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIseyBtb250aDpcInNob3J0XCIsIGRheTpcIm51bWVyaWNcIiwgeWVhcjpcIm51bWVyaWNcIiB9KX1gO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRXZWVrU3RhcnQoKTogRGF0ZSB7XG4gICAgY29uc3QgZCA9IG5ldyBEYXRlKHRoaXMuY3VycmVudERhdGUpO1xuICAgIGQuc2V0RGF0ZShkLmdldERhdGUoKSAtIGQuZ2V0RGF5KCkpO1xuICAgIHJldHVybiBkO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFllYXIgdmlldyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHJlbmRlclllYXJWaWV3KG1haW46IEhUTUxFbGVtZW50LCBldmVudHM6IENocm9uaWNsZUV2ZW50W10sIHRhc2tzOiBDaHJvbmljbGVUYXNrW10pIHtcbiAgICBjb25zdCB5ZWFyICAgICA9IHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCB0b2RheVN0ciA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgeWVhckdyaWQgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLWdyaWRcIik7XG5cbiAgICBmb3IgKGxldCBtID0gMDsgbSA8IDEyOyBtKyspIHtcbiAgICAgIGNvbnN0IGNhcmQgPSB5ZWFyR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1tb250aC1jYXJkXCIpO1xuICAgICAgY29uc3QgbmFtZSA9IGNhcmQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXllYXItbW9udGgtbmFtZVwiKTtcbiAgICAgIG5hbWUuc2V0VGV4dChuZXcgRGF0ZSh5ZWFyLCBtKS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7IG1vbnRoOiBcImxvbmdcIiB9KSk7XG4gICAgICBuYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY3VycmVudERhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtLCAxKTsgdGhpcy5tb2RlID0gXCJtb250aFwiOyB0aGlzLnJlbmRlcigpOyB9KTtcblxuICAgICAgY29uc3QgbWluaUdyaWQgICAgPSBjYXJkLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLW1pbmktZ3JpZFwiKTtcbiAgICAgIGNvbnN0IGZpcnN0RGF5ICAgID0gbmV3IERhdGUoeWVhciwgbSwgMSkuZ2V0RGF5KCk7XG4gICAgICBjb25zdCBkYXlzSW5Nb250aCA9IG5ldyBEYXRlKHllYXIsIG0gKyAxLCAwKS5nZXREYXRlKCk7XG5cbiAgICAgIGZvciAoY29uc3QgZCBvZiBbXCJTXCIsXCJNXCIsXCJUXCIsXCJXXCIsXCJUXCIsXCJGXCIsXCJTXCJdKVxuICAgICAgICBtaW5pR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1kYXktbmFtZVwiKS5zZXRUZXh0KGQpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpcnN0RGF5OyBpKyspXG4gICAgICAgIG1pbmlHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLWRheS1lbXB0eVwiKTtcblxuICAgICAgZm9yIChsZXQgZCA9IDE7IGQgPD0gZGF5c0luTW9udGg7IGQrKykge1xuICAgICAgICBjb25zdCBkYXRlU3RyICA9IGAke3llYXJ9LSR7U3RyaW5nKG0rMSkucGFkU3RhcnQoMixcIjBcIil9LSR7U3RyaW5nKGQpLnBhZFN0YXJ0KDIsXCIwXCIpfWA7XG4gICAgICAgIGNvbnN0IGhhc0V2ZW50ID0gZXZlbnRzLnNvbWUoZSA9PiBlLnN0YXJ0RGF0ZSA9PT0gZGF0ZVN0ciAmJiB0aGlzLmlzQ2FsZW5kYXJWaXNpYmxlKGUuY2FsZW5kYXJJZCkpO1xuICAgICAgICBjb25zdCBoYXNUYXNrICA9IHRhc2tzLnNvbWUodCA9PiB0LmR1ZURhdGUgPT09IGRhdGVTdHIgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgICAgICAgY29uc3QgZGF5RWwgICAgPSBtaW5pR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1kYXlcIik7XG4gICAgICAgIGRheUVsLnNldFRleHQoU3RyaW5nKGQpKTtcbiAgICAgICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSBkYXlFbC5hZGRDbGFzcyhcInRvZGF5XCIpO1xuICAgICAgICBpZiAoaGFzRXZlbnQpIGRheUVsLmFkZENsYXNzKFwiaGFzLWV2ZW50XCIpO1xuICAgICAgICBpZiAoaGFzVGFzaykgIGRheUVsLmFkZENsYXNzKFwiaGFzLXRhc2tcIik7XG4gICAgICAgIGRheUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY3VycmVudERhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtLCBkKTsgdGhpcy5tb2RlID0gXCJkYXlcIjsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIE1vbnRoIHZpZXcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSByZW5kZXJNb250aFZpZXcobWFpbjogSFRNTEVsZW1lbnQsIGV2ZW50czogQ2hyb25pY2xlRXZlbnRbXSwgdGFza3M6IENocm9uaWNsZVRhc2tbXSkge1xuICAgIGNvbnN0IHllYXIgICAgID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpO1xuICAgIGNvbnN0IG1vbnRoICAgID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRNb250aCgpO1xuICAgIGNvbnN0IHRvZGF5U3RyID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCBncmlkICAgICA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWdyaWRcIik7XG5cbiAgICBmb3IgKGNvbnN0IGQgb2YgW1wiU3VuXCIsXCJNb25cIixcIlR1ZVwiLFwiV2VkXCIsXCJUaHVcIixcIkZyaVwiLFwiU2F0XCJdKVxuICAgICAgZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtZGF5LW5hbWVcIikuc2V0VGV4dChkKTtcblxuICAgIGNvbnN0IGZpcnN0RGF5ICAgICAgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgMSkuZ2V0RGF5KCk7XG4gICAgY29uc3QgZGF5c0luTW9udGggICA9IG5ldyBEYXRlKHllYXIsIG1vbnRoICsgMSwgMCkuZ2V0RGF0ZSgpO1xuICAgIGNvbnN0IGRheXNJblByZXZNb24gPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgMCkuZ2V0RGF0ZSgpO1xuXG4gICAgZm9yIChsZXQgaSA9IGZpcnN0RGF5IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IGNlbGwgPSBncmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1jZWxsIGNocm9uaWNsZS1tb250aC1jZWxsLW90aGVyXCIpO1xuICAgICAgY2VsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtY2VsbC1udW1cIikuc2V0VGV4dChTdHJpbmcoZGF5c0luUHJldk1vbiAtIGkpKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBkID0gMTsgZCA8PSBkYXlzSW5Nb250aDsgZCsrKSB7XG4gICAgICBjb25zdCBkYXRlU3RyID0gYCR7eWVhcn0tJHtTdHJpbmcobW9udGgrMSkucGFkU3RhcnQoMixcIjBcIil9LSR7U3RyaW5nKGQpLnBhZFN0YXJ0KDIsXCIwXCIpfWA7XG4gICAgICBjb25zdCBjZWxsICAgID0gZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtY2VsbFwiKTtcbiAgICAgIGlmIChkYXRlU3RyID09PSB0b2RheVN0cikgY2VsbC5hZGRDbGFzcyhcInRvZGF5XCIpO1xuICAgICAgY2VsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtY2VsbC1udW1cIikuc2V0VGV4dChTdHJpbmcoZCkpO1xuXG4gICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoKSA9PiB0aGlzLm9wZW5OZXdFdmVudE1vZGFsKGRhdGVTdHIsIHRydWUpKTtcbiAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5zaG93Q2FsQ29udGV4dE1lbnUoZS5jbGllbnRYLCBlLmNsaWVudFksIGRhdGVTdHIsIHRydWUpO1xuICAgICAgfSk7XG5cbiAgICAgIGV2ZW50cy5maWx0ZXIoZSA9PiBlLnN0YXJ0RGF0ZSA9PT0gZGF0ZVN0ciAmJiB0aGlzLmlzQ2FsZW5kYXJWaXNpYmxlKGUuY2FsZW5kYXJJZCkpLnNsaWNlKDAsMylcbiAgICAgICAgLmZvckVhY2goZXZlbnQgPT4ge1xuICAgICAgICAgIGNvbnN0IGNhbCAgID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChldmVudC5jYWxlbmRhcklkID8/IFwiXCIpO1xuICAgICAgICAgIGNvbnN0IGNvbG9yID0gY2FsID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSA6IFwiIzM3OEFERFwiO1xuICAgICAgICAgIGNvbnN0IHBpbGwgID0gY2VsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtZXZlbnQtcGlsbFwiKTtcbiAgICAgICAgICBwaWxsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yICsgXCIzM1wiO1xuICAgICAgICAgIHBpbGwuc3R5bGUuYm9yZGVyTGVmdCAgICAgID0gYDNweCBzb2xpZCAke2NvbG9yfWA7XG4gICAgICAgICAgcGlsbC5zdHlsZS5jb2xvciAgICAgICAgICAgPSBjb2xvcjtcbiAgICAgICAgICBwaWxsLnNldFRleHQoZXZlbnQudGl0bGUpO1xuICAgICAgICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgbmV3IEV2ZW50TW9kYWwodGhpcy5hcHAsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlciwgZXZlbnQsICgpID0+IHRoaXMucmVuZGVyKCksIChlKSA9PiB0aGlzLm9wZW5FdmVudEZ1bGxQYWdlKGUpKS5vcGVuKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICB0YXNrcy5maWx0ZXIodCA9PiB0LmR1ZURhdGUgPT09IGRhdGVTdHIgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKS5zbGljZSgwLDIpXG4gICAgICAgIC5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICAgIGNvbnN0IHBpbGwgPSBjZWxsLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1ldmVudC1waWxsXCIpO1xuICAgICAgICAgIHBpbGwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCIjRkYzQjMwMjJcIjtcbiAgICAgICAgICBwaWxsLnN0eWxlLmJvcmRlckxlZnQgICAgICA9IFwiM3B4IHNvbGlkICNGRjNCMzBcIjtcbiAgICAgICAgICBwaWxsLnN0eWxlLmNvbG9yICAgICAgICAgICA9IFwiI0ZGM0IzMFwiO1xuICAgICAgICAgIHBpbGwuc2V0VGV4dChcIlx1MjcxMyBcIiArIHRhc2sudGl0bGUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCByZW1haW5pbmcgPSA3IC0gKChmaXJzdERheSArIGRheXNJbk1vbnRoKSAlIDcpO1xuICAgIGlmIChyZW1haW5pbmcgPCA3KVxuICAgICAgZm9yIChsZXQgZCA9IDE7IGQgPD0gcmVtYWluaW5nOyBkKyspIHtcbiAgICAgICAgY29uc3QgY2VsbCA9IGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGwgY2hyb25pY2xlLW1vbnRoLWNlbGwtb3RoZXJcIik7XG4gICAgICAgIGNlbGwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGwtbnVtXCIpLnNldFRleHQoU3RyaW5nKGQpKTtcbiAgICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBXZWVrIHZpZXcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSByZW5kZXJXZWVrVmlldyhtYWluOiBIVE1MRWxlbWVudCwgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdLCB0YXNrczogQ2hyb25pY2xlVGFza1tdKSB7XG4gICAgY29uc3Qgd2Vla1N0YXJ0ID0gdGhpcy5nZXRXZWVrU3RhcnQoKTtcbiAgICBjb25zdCBkYXlzOiBEYXRlW10gPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiA3IH0sIChfLCBpKSA9PiB7XG4gICAgICBjb25zdCBkID0gbmV3IERhdGUod2Vla1N0YXJ0KTsgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgaSk7IHJldHVybiBkO1xuICAgIH0pO1xuICAgIGNvbnN0IHRvZGF5U3RyID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIC8vIFRoZSB3ZWVrIGdyaWQ6IHRpbWUtY29sICsgNyBkYXktY29sc1xuICAgIC8vIEVhY2ggZGF5LWNvbCBjb250YWluczogaGVhZGVyIFx1MjE5MiBhbGwtZGF5IHNoZWxmIFx1MjE5MiB0aW1lIGdyaWRcbiAgICAvLyBUaGlzIG1pcnJvcnMgZGF5IHZpZXcgZXhhY3RseSBcdTIwMTQgc2hlbGYgaXMgYWx3YXlzIGJlbG93IHRoZSBkYXRlIGhlYWRlclxuICAgIGNvbnN0IGNhbEdyaWQgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS13ZWVrLWdyaWRcIik7XG5cbiAgICAvLyBUaW1lIGNvbHVtblxuICAgIGNvbnN0IHRpbWVDb2wgPSBjYWxHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS10aW1lLWNvbFwiKTtcbiAgICAvLyBCbGFuayBjZWxsIHRoYXQgYWxpZ25zIHdpdGggdGhlIGRheSBoZWFkZXIgcm93XG4gICAgdGltZUNvbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGltZS1jb2wtaGVhZGVyXCIpO1xuICAgIC8vIEJsYW5rIGNlbGwgdGhhdCBhbGlnbnMgd2l0aCB0aGUgYWxsLWRheSBzaGVsZiByb3dcbiAgICBjb25zdCBzaGVsZlNwYWNlciA9IHRpbWVDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbWUtY29sLXNoZWxmLXNwYWNlclwiKTtcbiAgICBzaGVsZlNwYWNlci5zZXRUZXh0KFwiYWxsLWRheVwiKTtcbiAgICAvLyBIb3VyIGxhYmVsc1xuICAgIGZvciAobGV0IGggPSAwOyBoIDwgMjQ7IGgrKylcbiAgICAgIHRpbWVDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbWUtc2xvdFwiKS5zZXRUZXh0KHRoaXMuZm9ybWF0SG91cihoKSk7XG5cbiAgICAvLyBEYXkgY29sdW1uc1xuICAgIGZvciAoY29uc3QgZGF5IG9mIGRheXMpIHtcbiAgICAgIGNvbnN0IGRhdGVTdHIgICAgICA9IGRheS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICAgIGNvbnN0IGNvbCAgICAgICAgICA9IGNhbEdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1jb2xcIik7XG4gICAgICBjb25zdCBhbGxEYXlFdmVudHMgPSBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgZS5hbGxEYXkgJiYgdGhpcy5pc0NhbGVuZGFyVmlzaWJsZShlLmNhbGVuZGFySWQpKTtcblxuICAgICAgLy8gMS4gRGF5IGhlYWRlclxuICAgICAgY29uc3QgZGF5SGVhZGVyID0gY29sLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktaGVhZGVyXCIpO1xuICAgICAgZGF5SGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktbmFtZVwiKS5zZXRUZXh0KFxuICAgICAgICBkYXkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyB3ZWVrZGF5OiBcInNob3J0XCIgfSkudG9VcHBlckNhc2UoKVxuICAgICAgKTtcbiAgICAgIGNvbnN0IGRheU51bSA9IGRheUhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LW51bVwiKTtcbiAgICAgIGRheU51bS5zZXRUZXh0KFN0cmluZyhkYXkuZ2V0RGF0ZSgpKSk7XG4gICAgICBpZiAoZGF0ZVN0ciA9PT0gdG9kYXlTdHIpIGRheU51bS5hZGRDbGFzcyhcInRvZGF5XCIpO1xuXG4gICAgICAvLyAyLiBBbGwtZGF5IHNoZWxmIFx1MjAxNCBzaXRzIGRpcmVjdGx5IGJlbG93IGhlYWRlciwgc2FtZSBhcyBkYXkgdmlld1xuICAgICAgY29uc3Qgc2hlbGYgPSBjb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXdlZWstYWxsZGF5LXNoZWxmXCIpO1xuICAgICAgZm9yIChjb25zdCBldmVudCBvZiBhbGxEYXlFdmVudHMpXG4gICAgICAgIHRoaXMucmVuZGVyRXZlbnRQaWxsQWxsRGF5KHNoZWxmLCBldmVudCk7XG5cbiAgICAgIC8vIDMuIFRpbWUgZ3JpZFxuICAgICAgY29uc3QgdGltZUdyaWQgPSBjb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS10aW1lLWdyaWRcIik7XG4gICAgICB0aW1lR3JpZC5zdHlsZS5oZWlnaHQgPSBgJHsyNCAqIEhPVVJfSEVJR0hUfXB4YDtcblxuICAgICAgZm9yIChsZXQgaCA9IDA7IGggPCAyNDsgaCsrKSB7XG4gICAgICAgIGNvbnN0IGxpbmUgPSB0aW1lR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtaG91ci1saW5lXCIpO1xuICAgICAgICBsaW5lLnN0eWxlLnRvcCA9IGAke2ggKiBIT1VSX0hFSUdIVH1weGA7XG4gICAgICB9XG5cbiAgICAgIHRpbWVHcmlkLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICBjb25zdCByZWN0ICAgPSB0aW1lR3JpZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgeSAgICAgID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICAgIGNvbnN0IGhvdXIgICA9IE1hdGgubWluKE1hdGguZmxvb3IoeSAvIEhPVVJfSEVJR0hUKSwgMjMpO1xuICAgICAgICBjb25zdCBtaW51dGUgPSBNYXRoLmZsb29yKCh5ICUgSE9VUl9IRUlHSFQpIC8gSE9VUl9IRUlHSFQgKiA2MCAvIDE1KSAqIDE1O1xuICAgICAgICB0aGlzLm9wZW5OZXdFdmVudE1vZGFsKGRhdGVTdHIsIGZhbHNlLCBob3VyLCBtaW51dGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHRpbWVHcmlkLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IHJlY3QgICA9IHRpbWVHcmlkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCB5ICAgICAgPSBlLmNsaWVudFkgLSByZWN0LnRvcDtcbiAgICAgICAgY29uc3QgaG91ciAgID0gTWF0aC5taW4oTWF0aC5mbG9vcih5IC8gSE9VUl9IRUlHSFQpLCAyMyk7XG4gICAgICAgIGNvbnN0IG1pbnV0ZSA9IE1hdGguZmxvb3IoKHkgJSBIT1VSX0hFSUdIVCkgLyBIT1VSX0hFSUdIVCAqIDYwIC8gMTUpICogMTU7XG4gICAgICAgIHRoaXMuc2hvd0NhbENvbnRleHRNZW51KGUuY2xpZW50WCwgZS5jbGllbnRZLCBkYXRlU3RyLCBmYWxzZSwgaG91ciwgbWludXRlKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUaW1lZCBldmVudHNcbiAgICAgIGV2ZW50cy5maWx0ZXIoZSA9PiBlLnN0YXJ0RGF0ZSA9PT0gZGF0ZVN0ciAmJiAhZS5hbGxEYXkgJiYgZS5zdGFydFRpbWUgJiYgdGhpcy5pc0NhbGVuZGFyVmlzaWJsZShlLmNhbGVuZGFySWQpKVxuICAgICAgICAuZm9yRWFjaChldmVudCA9PiB0aGlzLnJlbmRlckV2ZW50UGlsbFRpbWVkKHRpbWVHcmlkLCBldmVudCkpO1xuXG4gICAgICAvLyBUYXNrIGR1ZSBwaWxsc1xuICAgICAgdGFza3MuZmlsdGVyKHQgPT4gdC5kdWVEYXRlID09PSBkYXRlU3RyICYmIHQuc3RhdHVzICE9PSBcImRvbmVcIilcbiAgICAgICAgLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgICAgY29uc3QgdG9wICA9IHRhc2suZHVlVGltZVxuICAgICAgICAgICAgPyAoKCkgPT4geyBjb25zdCBbaCxtXSA9IHRhc2suZHVlVGltZSEuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpOyByZXR1cm4gKGggKyBtLzYwKSAqIEhPVVJfSEVJR0hUOyB9KSgpXG4gICAgICAgICAgICA6IDA7XG4gICAgICAgICAgY29uc3QgcGlsbCA9IHRpbWVHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLWRheS1waWxsXCIpO1xuICAgICAgICAgIHBpbGwuc3R5bGUudG9wICAgICAgICAgICAgID0gYCR7dG9wfXB4YDtcbiAgICAgICAgICBwaWxsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiI0ZGM0IzMDIyXCI7XG4gICAgICAgICAgcGlsbC5zdHlsZS5ib3JkZXJMZWZ0ICAgICAgPSBcIjNweCBzb2xpZCAjRkYzQjMwXCI7XG4gICAgICAgICAgcGlsbC5zdHlsZS5jb2xvciAgICAgICAgICAgPSBcIiNGRjNCMzBcIjtcbiAgICAgICAgICBwaWxsLnNldFRleHQoXCJcdTI3MTMgXCIgKyB0YXNrLnRpdGxlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gTm93IGxpbmVcbiAgICBjb25zdCBub3cgICAgICAgICA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3Qgbm93U3RyICAgICAgPSBub3cudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgdG9kYXlDb2xJZHggPSBkYXlzLmZpbmRJbmRleChkID0+IGQudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF0gPT09IG5vd1N0cik7XG4gICAgaWYgKHRvZGF5Q29sSWR4ID49IDApIHtcbiAgICAgIGNvbnN0IGNvbHMgICAgID0gY2FsR3JpZC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNocm9uaWNsZS1kYXktY29sXCIpO1xuICAgICAgY29uc3QgdG9kYXlDb2wgPSBjb2xzW3RvZGF5Q29sSWR4XSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGNvbnN0IHRnICAgICAgID0gdG9kYXlDb2wucXVlcnlTZWxlY3RvcihcIi5jaHJvbmljbGUtZGF5LXRpbWUtZ3JpZFwiKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmICh0Zykge1xuICAgICAgICBjb25zdCB0b3AgID0gKG5vdy5nZXRIb3VycygpICsgbm93LmdldE1pbnV0ZXMoKSAvIDYwKSAqIEhPVVJfSEVJR0hUO1xuICAgICAgICBjb25zdCBsaW5lID0gdGcuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW5vdy1saW5lXCIpO1xuICAgICAgICBsaW5lLnN0eWxlLnRvcCA9IGAke3RvcH1weGA7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIERheSB2aWV3IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyRGF5VmlldyhtYWluOiBIVE1MRWxlbWVudCwgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdLCB0YXNrczogQ2hyb25pY2xlVGFza1tdKSB7XG4gICAgY29uc3QgZGF0ZVN0ciAgICAgID0gdGhpcy5jdXJyZW50RGF0ZS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCB0b2RheVN0ciAgICAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IGFsbERheUV2ZW50cyA9IGV2ZW50cy5maWx0ZXIoZSA9PiBlLnN0YXJ0RGF0ZSA9PT0gZGF0ZVN0ciAmJiBlLmFsbERheSAmJiB0aGlzLmlzQ2FsZW5kYXJWaXNpYmxlKGUuY2FsZW5kYXJJZCkpO1xuICAgIGNvbnN0IGRheVZpZXcgICAgICA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS12aWV3XCIpO1xuXG4gICAgLy8gRGF5IGhlYWRlclxuICAgIGNvbnN0IGRheUhlYWRlciA9IGRheVZpZXcuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS12aWV3LWhlYWRlclwiKTtcbiAgICBkYXlIZWFkZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1uYW1lLWxhcmdlXCIpLnNldFRleHQoXG4gICAgICB0aGlzLmN1cnJlbnREYXRlLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgd2Vla2RheTogXCJsb25nXCIgfSkudG9VcHBlckNhc2UoKVxuICAgICk7XG4gICAgY29uc3QgbnVtRWwgPSBkYXlIZWFkZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1udW0tbGFyZ2VcIik7XG4gICAgbnVtRWwuc2V0VGV4dChTdHJpbmcodGhpcy5jdXJyZW50RGF0ZS5nZXREYXRlKCkpKTtcbiAgICBpZiAoZGF0ZVN0ciA9PT0gdG9kYXlTdHIpIG51bUVsLmFkZENsYXNzKFwidG9kYXlcIik7XG5cbiAgICAvLyBBbGwtZGF5IHNoZWxmXG4gICAgY29uc3Qgc2hlbGYgICAgICAgID0gZGF5Vmlldy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LWFsbGRheS1zaGVsZlwiKTtcbiAgICBzaGVsZi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LWFsbGRheS1sYWJlbFwiKS5zZXRUZXh0KFwiYWxsLWRheVwiKTtcbiAgICBjb25zdCBzaGVsZkNvbnRlbnQgPSBzaGVsZi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LWFsbGRheS1jb250ZW50XCIpO1xuICAgIGZvciAoY29uc3QgZXZlbnQgb2YgYWxsRGF5RXZlbnRzKVxuICAgICAgdGhpcy5yZW5kZXJFdmVudFBpbGxBbGxEYXkoc2hlbGZDb250ZW50LCBldmVudCk7XG5cbiAgICAvLyBUaW1lIGFyZWFcbiAgICBjb25zdCB0aW1lQXJlYSAgID0gZGF5Vmlldy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LXNpbmdsZS1hcmVhXCIpO1xuICAgIGNvbnN0IHRpbWVMYWJlbHMgPSB0aW1lQXJlYS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LXNpbmdsZS1sYWJlbHNcIik7XG4gICAgY29uc3QgZXZlbnRDb2wgICA9IHRpbWVBcmVhLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktc2luZ2xlLWV2ZW50c1wiKTtcbiAgICBldmVudENvbC5zdHlsZS5oZWlnaHQgPSBgJHsyNCAqIEhPVVJfSEVJR0hUfXB4YDtcblxuICAgIGZvciAobGV0IGggPSAwOyBoIDwgMjQ7IGgrKykge1xuICAgICAgdGltZUxhYmVscy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGltZS1zbG90XCIpLnNldFRleHQodGhpcy5mb3JtYXRIb3VyKGgpKTtcbiAgICAgIGNvbnN0IGxpbmUgPSBldmVudENvbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtaG91ci1saW5lXCIpO1xuICAgICAgbGluZS5zdHlsZS50b3AgPSBgJHtoICogSE9VUl9IRUlHSFR9cHhgO1xuICAgIH1cblxuICAgIGV2ZW50Q29sLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgY29uc3QgcmVjdCAgID0gZXZlbnRDb2wuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCB5ICAgICAgPSBlLmNsaWVudFkgLSByZWN0LnRvcDtcbiAgICAgIGNvbnN0IGhvdXIgICA9IE1hdGgubWluKE1hdGguZmxvb3IoeSAvIEhPVVJfSEVJR0hUKSwgMjMpO1xuICAgICAgY29uc3QgbWludXRlID0gTWF0aC5mbG9vcigoeSAlIEhPVVJfSEVJR0hUKSAvIEhPVVJfSEVJR0hUICogNjAgLyAxNSkgKiAxNTtcbiAgICAgIHRoaXMub3Blbk5ld0V2ZW50TW9kYWwoZGF0ZVN0ciwgZmFsc2UsIGhvdXIsIG1pbnV0ZSk7XG4gICAgfSk7XG5cbiAgICBldmVudENvbC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHJlY3QgICA9IGV2ZW50Q29sLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgeSAgICAgID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICBjb25zdCBob3VyICAgPSBNYXRoLm1pbihNYXRoLmZsb29yKHkgLyBIT1VSX0hFSUdIVCksIDIzKTtcbiAgICAgIGNvbnN0IG1pbnV0ZSA9IE1hdGguZmxvb3IoKHkgJSBIT1VSX0hFSUdIVCkgLyBIT1VSX0hFSUdIVCAqIDYwIC8gMTUpICogMTU7XG4gICAgICB0aGlzLnNob3dDYWxDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZGF0ZVN0ciwgZmFsc2UsIGhvdXIsIG1pbnV0ZSk7XG4gICAgfSk7XG5cbiAgICBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgIWUuYWxsRGF5ICYmIGUuc3RhcnRUaW1lICYmIHRoaXMuaXNDYWxlbmRhclZpc2libGUoZS5jYWxlbmRhcklkKSlcbiAgICAgIC5mb3JFYWNoKGV2ZW50ID0+IHRoaXMucmVuZGVyRXZlbnRQaWxsVGltZWQoZXZlbnRDb2wsIGV2ZW50KSk7XG5cbiAgICB0YXNrcy5maWx0ZXIodCA9PiB0LmR1ZURhdGUgPT09IGRhdGVTdHIgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKVxuICAgICAgLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgIGNvbnN0IHRvcCAgPSB0YXNrLmR1ZVRpbWVcbiAgICAgICAgICA/ICgoKSA9PiB7IGNvbnN0IFtoLG1dID0gdGFzay5kdWVUaW1lIS5zcGxpdChcIjpcIikubWFwKE51bWJlcik7IHJldHVybiAoaCArIG0vNjApICogSE9VUl9IRUlHSFQ7IH0pKClcbiAgICAgICAgICA6IDA7XG4gICAgICAgIGNvbnN0IHBpbGwgPSBldmVudENvbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1kYXktcGlsbFwiKTtcbiAgICAgICAgcGlsbC5zdHlsZS50b3AgICAgICAgICAgICAgPSBgJHt0b3B9cHhgO1xuICAgICAgICBwaWxsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiI0ZGM0IzMDIyXCI7XG4gICAgICAgIHBpbGwuc3R5bGUuYm9yZGVyTGVmdCAgICAgID0gXCIzcHggc29saWQgI0ZGM0IzMFwiO1xuICAgICAgICBwaWxsLnN0eWxlLmNvbG9yICAgICAgICAgICA9IFwiI0ZGM0IzMFwiO1xuICAgICAgICBwaWxsLnNldFRleHQoXCJcdTI3MTMgXCIgKyB0YXNrLnRpdGxlKTtcbiAgICAgIH0pO1xuXG4gICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSB7XG4gICAgICBjb25zdCBub3cgID0gbmV3IERhdGUoKTtcbiAgICAgIGNvbnN0IHRvcCAgPSAobm93LmdldEhvdXJzKCkgKyBub3cuZ2V0TWludXRlcygpIC8gNjApICogSE9VUl9IRUlHSFQ7XG4gICAgICBjb25zdCBsaW5lID0gZXZlbnRDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW5vdy1saW5lXCIpO1xuICAgICAgbGluZS5zdHlsZS50b3AgPSBgJHt0b3B9cHhgO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgb3Blbk5ld0V2ZW50TW9kYWwoZGF0ZVN0cjogc3RyaW5nLCBhbGxEYXk6IGJvb2xlYW4sIGhvdXIgPSA5LCBtaW51dGUgPSAwKSB7XG4gICAgY29uc3QgdGltZVN0ciA9IGAke1N0cmluZyhob3VyKS5wYWRTdGFydCgyLFwiMFwiKX06JHtTdHJpbmcobWludXRlKS5wYWRTdGFydCgyLFwiMFwiKX1gO1xuICAgIGNvbnN0IGVuZFN0ciAgPSBgJHtTdHJpbmcoTWF0aC5taW4oaG91cisxLDIzKSkucGFkU3RhcnQoMixcIjBcIil9OiR7U3RyaW5nKG1pbnV0ZSkucGFkU3RhcnQoMixcIjBcIil9YDtcbiAgICBjb25zdCBwcmVmaWxsID0ge1xuICAgICAgaWQ6IFwiXCIsIHRpdGxlOiBcIlwiLCBhbGxEYXksXG4gICAgICBzdGFydERhdGU6IGRhdGVTdHIsIHN0YXJ0VGltZTogYWxsRGF5ID8gdW5kZWZpbmVkIDogdGltZVN0cixcbiAgICAgIGVuZERhdGU6ICAgZGF0ZVN0ciwgZW5kVGltZTogICBhbGxEYXkgPyB1bmRlZmluZWQgOiBlbmRTdHIsXG4gICAgICBhbGVydDogXCJub25lXCIsIGxpbmtlZFRhc2tJZHM6IFtdLCBjb21wbGV0ZWRJbnN0YW5jZXM6IFtdLCBjcmVhdGVkQXQ6IFwiXCJcbiAgICB9IGFzIENocm9uaWNsZUV2ZW50O1xuXG4gICAgbmV3IEV2ZW50TW9kYWwoXG4gICAgICB0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLFxuICAgICAgcHJlZmlsbCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGUpID0+IHRoaXMub3BlbkV2ZW50RnVsbFBhZ2UoZSA/PyBwcmVmaWxsKVxuICAgICkub3BlbigpO1xuICB9XG5cbnByaXZhdGUgc2hvd0V2ZW50Q29udGV4dE1lbnUoeDogbnVtYmVyLCB5OiBudW1iZXIsIGV2ZW50OiBDaHJvbmljbGVFdmVudCkge1xuICAgIGNvbnN0IG1lbnUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG1lbnUuY2xhc3NOYW1lICA9IFwiY2hyb25pY2xlLWNvbnRleHQtbWVudVwiO1xuICAgIG1lbnUuc3R5bGUubGVmdCA9IGAke3h9cHhgO1xuICAgIG1lbnUuc3R5bGUudG9wICA9IGAke3l9cHhgO1xuXG4gICAgY29uc3QgZWRpdEl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW1cIik7XG4gICAgZWRpdEl0ZW0uc2V0VGV4dChcIkVkaXQgZXZlbnRcIik7XG4gICAgZWRpdEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIG1lbnUucmVtb3ZlKCk7XG4gICAgICBuZXcgRXZlbnRNb2RhbCh0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCBldmVudCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGUpID0+IHRoaXMub3BlbkV2ZW50RnVsbFBhZ2UoZSkpLm9wZW4oKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGRlbGV0ZUl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW0gY2hyb25pY2xlLWNvbnRleHQtZGVsZXRlXCIpO1xuICAgIGRlbGV0ZUl0ZW0uc2V0VGV4dChcIkRlbGV0ZSBldmVudFwiKTtcbiAgICBkZWxldGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICBtZW51LnJlbW92ZSgpO1xuICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuZGVsZXRlKGV2ZW50LmlkKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1lbnUpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IG1lbnUucmVtb3ZlKCksIHsgb25jZTogdHJ1ZSB9KSwgMCk7XG4gIH1cblxuICBwcml2YXRlIHNob3dDYWxDb250ZXh0TWVudSh4OiBudW1iZXIsIHk6IG51bWJlciwgZGF0ZVN0cjogc3RyaW5nLCBhbGxEYXk6IGJvb2xlYW4sIGhvdXIgPSA5LCBtaW51dGUgPSAwKSB7XG4gICAgY29uc3QgbWVudSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbWVudS5jbGFzc05hbWUgICAgPSBcImNocm9uaWNsZS1jb250ZXh0LW1lbnVcIjtcbiAgICBtZW51LnN0eWxlLmxlZnQgICA9IGAke3h9cHhgO1xuICAgIG1lbnUuc3R5bGUudG9wICAgID0gYCR7eX1weGA7XG5cbiAgICBjb25zdCBhZGRJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtXCIpO1xuICAgIGFkZEl0ZW0uc2V0VGV4dChcIk5ldyBldmVudCBoZXJlXCIpO1xuICAgIGFkZEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgbWVudS5yZW1vdmUoKTsgdGhpcy5vcGVuTmV3RXZlbnRNb2RhbChkYXRlU3RyLCBhbGxEYXksIGhvdXIsIG1pbnV0ZSk7IH0pO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtZW51KTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBtZW51LnJlbW92ZSgpLCB7IG9uY2U6IHRydWUgfSksIDApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJFdmVudFBpbGxUaW1lZChjb250YWluZXI6IEhUTUxFbGVtZW50LCBldmVudDogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBjb25zdCBbc2gsIHNtXSA9IChldmVudC5zdGFydFRpbWUgPz8gXCIwOTowMFwiKS5zcGxpdChcIjpcIikubWFwKE51bWJlcik7XG4gICAgY29uc3QgW2VoLCBlbV0gPSAoZXZlbnQuZW5kVGltZSAgID8/IFwiMTA6MDBcIikuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpO1xuICAgIGNvbnN0IHRvcCAgICA9IChzaCArIHNtIC8gNjApICogSE9VUl9IRUlHSFQ7XG4gICAgY29uc3QgaGVpZ2h0ID0gTWF0aC5tYXgoKGVoIC0gc2ggKyAoZW0gLSBzbSkgLyA2MCkgKiBIT1VSX0hFSUdIVCwgMjIpO1xuICAgIGNvbnN0IGNhbCAgICA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoZXZlbnQuY2FsZW5kYXJJZCA/PyBcIlwiKTtcbiAgICBjb25zdCBjb2xvciAgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCIjMzc4QUREXCI7XG5cbiAgICBjb25zdCBwaWxsID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1ldmVudC1waWxsXCIpO1xuICAgIHBpbGwuc3R5bGUudG9wICAgICAgICAgICAgID0gYCR7dG9wfXB4YDtcbiAgICBwaWxsLnN0eWxlLmhlaWdodCAgICAgICAgICA9IGAke2hlaWdodH1weGA7XG4gICAgcGlsbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvciArIFwiMzNcIjtcbiAgICBwaWxsLnN0eWxlLmJvcmRlckxlZnQgICAgICA9IGAzcHggc29saWQgJHtjb2xvcn1gO1xuICAgIHBpbGwuc3R5bGUuY29sb3IgICAgICAgICAgID0gY29sb3I7XG4gICAgcGlsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZXZlbnQtcGlsbC10aXRsZVwiKS5zZXRUZXh0KGV2ZW50LnRpdGxlKTtcbiAgICBpZiAoaGVpZ2h0ID4gMzYgJiYgZXZlbnQuc3RhcnRUaW1lKVxuICAgICAgcGlsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZXZlbnQtcGlsbC10aW1lXCIpLnNldFRleHQodGhpcy5mb3JtYXRUaW1lKGV2ZW50LnN0YXJ0VGltZSkpO1xuXG4gICAgcGlsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBuZXcgRXZlbnRNb2RhbCh0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCBldmVudCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGUpID0+IHRoaXMub3BlbkV2ZW50RnVsbFBhZ2UoZSkpLm9wZW4oKTtcbiAgICB9KTtcblxuICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgdGhpcy5zaG93RXZlbnRDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZXZlbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJFdmVudFBpbGxBbGxEYXkoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZXZlbnQ6IENocm9uaWNsZUV2ZW50KSB7XG4gICAgY29uc3QgY2FsICAgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGV2ZW50LmNhbGVuZGFySWQgPz8gXCJcIik7XG4gICAgY29uc3QgY29sb3IgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCIjMzc4QUREXCI7XG4gICAgY29uc3QgcGlsbCAgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWV2ZW50LXBpbGwtYWxsZGF5XCIpO1xuICAgIHBpbGwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IgKyBcIjMzXCI7XG4gICAgcGlsbC5zdHlsZS5ib3JkZXJMZWZ0ICAgICAgPSBgM3B4IHNvbGlkICR7Y29sb3J9YDtcbiAgICBwaWxsLnN0eWxlLmNvbG9yICAgICAgICAgICA9IGNvbG9yO1xuICAgIHBpbGwuc2V0VGV4dChldmVudC50aXRsZSk7XG4gICAgcGlsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT5cbiAgICAgIG5ldyBFdmVudE1vZGFsKHRoaXMuYXBwLCB0aGlzLmV2ZW50TWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIsIGV2ZW50LCAoKSA9PiB0aGlzLnJlbmRlcigpLCAoZSkgPT4gdGhpcy5vcGVuRXZlbnRGdWxsUGFnZShlKSkub3BlbigpXG4gICAgKTtcblxuICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgdGhpcy5zaG93RXZlbnRDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZXZlbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBpc0NhbGVuZGFyVmlzaWJsZShjYWxlbmRhcklkPzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCFjYWxlbmRhcklkKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChjYWxlbmRhcklkKT8uaXNWaXNpYmxlID8/IHRydWU7XG4gIH1cblxuICBwcml2YXRlIGZvcm1hdEhvdXIoaDogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBpZiAoaCA9PT0gMCkgIHJldHVybiBcIjEyIEFNXCI7XG4gICAgaWYgKGggPCAxMikgICByZXR1cm4gYCR7aH0gQU1gO1xuICAgIGlmIChoID09PSAxMikgcmV0dXJuIFwiMTIgUE1cIjtcbiAgICByZXR1cm4gYCR7aCAtIDEyfSBQTWA7XG4gIH1cblxuICBwcml2YXRlIGZvcm1hdFRpbWUodGltZVN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBbaCwgbV0gPSB0aW1lU3RyLnNwbGl0KFwiOlwiKS5tYXAoTnVtYmVyKTtcbiAgICByZXR1cm4gYCR7aCAlIDEyIHx8IDEyfToke1N0cmluZyhtKS5wYWRTdGFydCgyLFwiMFwiKX0gJHtoID49IDEyID8gXCJQTVwiIDogXCJBTVwifWA7XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgRXZlbnRNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvRXZlbnRNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZUV2ZW50LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSBlZGl0aW5nRXZlbnQ6IENocm9uaWNsZUV2ZW50IHwgbnVsbDtcbiAgcHJpdmF0ZSBvblNhdmU/OiAoKSA9PiB2b2lkO1xuICBwcml2YXRlIG9uRXhwYW5kPzogKGV2ZW50PzogQ2hyb25pY2xlRXZlbnQpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXIsXG4gICAgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXIsXG4gICAgZWRpdGluZ0V2ZW50PzogQ2hyb25pY2xlRXZlbnQsXG4gICAgb25TYXZlPzogKCkgPT4gdm9pZCxcbiAgICBvbkV4cGFuZD86IChldmVudD86IENocm9uaWNsZUV2ZW50KSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5ldmVudE1hbmFnZXIgICAgPSBldmVudE1hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nRXZlbnQgICAgPSBlZGl0aW5nRXZlbnQgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSAgICAgICAgICA9IG9uU2F2ZTtcbiAgICB0aGlzLm9uRXhwYW5kICAgICAgICA9IG9uRXhwYW5kO1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImNocm9uaWNsZS1ldmVudC1tb2RhbFwiKTtcblxuICAgIGNvbnN0IGUgICAgICAgICA9IHRoaXMuZWRpdGluZ0V2ZW50O1xuICAgIGNvbnN0IGNhbGVuZGFycyA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEhlYWRlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBoZWFkZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWhlYWRlclwiKTtcbiAgICBoZWFkZXIuY3JlYXRlRGl2KFwiY2VtLXRpdGxlXCIpLnNldFRleHQoZSAmJiBlLmlkID8gXCJFZGl0IGV2ZW50XCIgOiBcIk5ldyBldmVudFwiKTtcblxuICAgIGNvbnN0IGV4cGFuZEJ0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tZ2hvc3QgY2VtLWV4cGFuZC1idG5cIiB9KTtcbiAgICBleHBhbmRCdG4udGl0bGUgPSBcIk9wZW4gYXMgZnVsbCBwYWdlXCI7XG4gICAgZXhwYW5kQnRuLmlubmVySFRNTCA9IGA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIj48cG9seWxpbmUgcG9pbnRzPVwiMTUgMyAyMSAzIDIxIDlcIi8+PHBvbHlsaW5lIHBvaW50cz1cIjkgMjEgMyAyMSAzIDE1XCIvPjxsaW5lIHgxPVwiMjFcIiB5MT1cIjNcIiB4Mj1cIjE0XCIgeTI9XCIxMFwiLz48bGluZSB4MT1cIjNcIiB5MT1cIjIxXCIgeDI9XCIxMFwiIHkyPVwiMTRcIi8+PC9zdmc+YDtcbiAgICBleHBhbmRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIHRoaXMub25FeHBhbmQ/LihlID8/IHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgU2Nyb2xsYWJsZSBmb3JtIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGZvcm0gPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWZvcm1cIik7XG5cbiAgICAvLyBUaXRsZVxuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGl0bGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLXRpdGxlLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIkV2ZW50IG5hbWVcIlxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSBlPy50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIExvY2F0aW9uXG4gICAgY29uc3QgbG9jYXRpb25JbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJMb2NhdGlvblwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIGxvY2F0aW9uXCJcbiAgICB9KTtcbiAgICBsb2NhdGlvbklucHV0LnZhbHVlID0gZT8ubG9jYXRpb24gPz8gXCJcIjtcblxuICAgIC8vIEFsbCBkYXkgdG9nZ2xlXG4gICAgY29uc3QgYWxsRGF5RmllbGQgID0gdGhpcy5maWVsZChmb3JtLCBcIkFsbCBkYXlcIik7XG4gICAgY29uc3QgYWxsRGF5V3JhcCAgID0gYWxsRGF5RmllbGQuY3JlYXRlRGl2KFwiY2VtLXRvZ2dsZS13cmFwXCIpO1xuICAgIGNvbnN0IGFsbERheVRvZ2dsZSA9IGFsbERheVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiwgY2xzOiBcImNlbS10b2dnbGVcIiB9KTtcbiAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA9IGU/LmFsbERheSA/PyBmYWxzZTtcbiAgICBjb25zdCBhbGxEYXlMYWJlbCAgPSBhbGxEYXlXcmFwLmNyZWF0ZVNwYW4oeyBjbHM6IFwiY2VtLXRvZ2dsZS1sYWJlbFwiIH0pO1xuICAgIGFsbERheUxhYmVsLnNldFRleHQoYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIlllc1wiIDogXCJOb1wiKTtcbiAgICBhbGxEYXlUb2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBhbGxEYXlMYWJlbC5zZXRUZXh0KGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJZZXNcIiA6IFwiTm9cIik7XG4gICAgICB0aW1lRmllbGRzLnN0eWxlLmRpc3BsYXkgPSBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwibm9uZVwiIDogXCJcIjtcbiAgICB9KTtcblxuICAgIC8vIFN0YXJ0ICsgRW5kIGRhdGVcbiAgICBjb25zdCBkYXRlUm93ICAgICAgICA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuICAgIGNvbnN0IHN0YXJ0RGF0ZUlucHV0ID0gdGhpcy5maWVsZChkYXRlUm93LCBcIlN0YXJ0IGRhdGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcImRhdGVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBzdGFydERhdGVJbnB1dC52YWx1ZSA9IGU/LnN0YXJ0RGF0ZSA/PyBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgY29uc3QgZW5kRGF0ZUlucHV0ID0gdGhpcy5maWVsZChkYXRlUm93LCBcIkVuZCBkYXRlXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJkYXRlXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgZW5kRGF0ZUlucHV0LnZhbHVlID0gZT8uZW5kRGF0ZSA/PyBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgc3RhcnREYXRlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBpZiAoIWVuZERhdGVJbnB1dC52YWx1ZSB8fCBlbmREYXRlSW5wdXQudmFsdWUgPCBzdGFydERhdGVJbnB1dC52YWx1ZSkge1xuICAgICAgICBlbmREYXRlSW5wdXQudmFsdWUgPSBzdGFydERhdGVJbnB1dC52YWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFRpbWUgZmllbGRzXG4gICAgY29uc3QgdGltZUZpZWxkcyAgICAgPSBmb3JtLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcbiAgICB0aW1lRmllbGRzLnN0eWxlLmRpc3BsYXkgPSBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwibm9uZVwiIDogXCJcIjtcblxuICAgIGNvbnN0IHN0YXJ0VGltZUlucHV0ID0gdGhpcy5maWVsZCh0aW1lRmllbGRzLCBcIlN0YXJ0IHRpbWVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRpbWVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBzdGFydFRpbWVJbnB1dC52YWx1ZSA9IGU/LnN0YXJ0VGltZSA/PyBcIjA5OjAwXCI7XG5cbiAgICBjb25zdCBlbmRUaW1lSW5wdXQgPSB0aGlzLmZpZWxkKHRpbWVGaWVsZHMsIFwiRW5kIHRpbWVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRpbWVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBlbmRUaW1lSW5wdXQudmFsdWUgPSBlPy5lbmRUaW1lID8/IFwiMTA6MDBcIjtcblxuICAgIC8vIFJlcGVhdFxuICAgIGNvbnN0IHJlY1NlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJSZXBlYXRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcmVjdXJyZW5jZXMgPSBbXG4gICAgICB7IHZhbHVlOiBcIlwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiTmV2ZXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPURBSUxZXCIsICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IGRheVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZXCIsICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgd2Vla1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9TU9OVEhMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgbW9udGhcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVlFQVJMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IHllYXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWTtCWURBWT1NTyxUVSxXRSxUSCxGUlwiLCAgbGFiZWw6IFwiV2Vla2RheXNcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCByIG9mIHJlY3VycmVuY2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSByZWNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogci52YWx1ZSwgdGV4dDogci5sYWJlbCB9KTtcbiAgICAgIGlmIChlPy5yZWN1cnJlbmNlID09PSByLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIEFsZXJ0XG4gICAgY29uc3QgYWxlcnRTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQWxlcnRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgYWxlcnRzOiB7IHZhbHVlOiBBbGVydE9mZnNldDsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcIm5vbmVcIiwgICAgbGFiZWw6IFwiTm9uZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImF0LXRpbWVcIiwgbGFiZWw6IFwiQXQgdGltZSBvZiBldmVudFwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjVtaW5cIiwgICAgbGFiZWw6IFwiNSBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjEwbWluXCIsICAgbGFiZWw6IFwiMTAgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxNW1pblwiLCAgIGxhYmVsOiBcIjE1IG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMzBtaW5cIiwgICBsYWJlbDogXCIzMCBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjFob3VyXCIsICAgbGFiZWw6IFwiMSBob3VyIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJob3Vyc1wiLCAgbGFiZWw6IFwiMiBob3VycyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxZGF5XCIsICAgIGxhYmVsOiBcIjEgZGF5IGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJkYXlzXCIsICAgbGFiZWw6IFwiMiBkYXlzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjF3ZWVrXCIsICAgbGFiZWw6IFwiMSB3ZWVrIGJlZm9yZVwiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IGEgb2YgYWxlcnRzKSB7XG4gICAgICBjb25zdCBvcHQgPSBhbGVydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBhLnZhbHVlLCB0ZXh0OiBhLmxhYmVsIH0pO1xuICAgICAgaWYgKGU/LmFsZXJ0ID09PSBhLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIENhbGVuZGFyXG4gICAgY29uc3QgY2FsU2VsZWN0ID0gdGhpcy5maWVsZChmb3JtLCBcIkNhbGVuZGFyXCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBcIlwiLCB0ZXh0OiBcIk5vbmVcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGNhbCBvZiBjYWxlbmRhcnMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBjYWwuaWQsIHRleHQ6IGNhbC5uYW1lIH0pO1xuICAgICAgaWYgKGU/LmNhbGVuZGFySWQgPT09IGNhbC5pZCkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgdXBkYXRlQ2FsQ29sb3IgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGNhbFNlbGVjdC52YWx1ZSk7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdENvbG9yID0gY2FsID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSA6IFwidHJhbnNwYXJlbnRcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0V2lkdGggPSBcIjRweFwiO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRTdHlsZSA9IFwic29saWRcIjtcbiAgICB9O1xuICAgIGNhbFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHVwZGF0ZUNhbENvbG9yKTtcbiAgICB1cGRhdGVDYWxDb2xvcigpO1xuXG4gICAgLy8gVGFnc1xuICAgIGNvbnN0IHRhZ3NJbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJUYWdzXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwid29yaywgcGVyc29uYWwgIChjb21tYSBzZXBhcmF0ZWQpXCJcbiAgICB9KTtcbiAgICB0YWdzSW5wdXQudmFsdWUgPSBlPy50YWdzPy5qb2luKFwiLCBcIikgPz8gXCJcIjtcblxuICAgIGNvbnN0IGRlZmF1bHRBbGVydCA9IHRoaXMucGx1Z2luPy5zZXR0aW5ncz8uZGVmYXVsdEFsZXJ0ID8/IFwibm9uZVwiO1xuICAgIGZvciAoY29uc3QgYSBvZiBhbGVydHMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGFsZXJ0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGEudmFsdWUsIHRleHQ6IGEubGFiZWwgfSk7XG4gICAgICBpZiAoZT8uYWxlcnQgPT09IGEudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEZvb3RlciAoYWx3YXlzIHZpc2libGUsIG91dHNpZGUgc2Nyb2xsIGFyZWEpIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGZvb3RlciAgICA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZW0tZm9vdGVyXCIpO1xuICAgIGNvbnN0IGNhbmNlbEJ0biA9IGZvb3Rlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tZ2hvc3RcIiwgdGV4dDogXCJDYW5jZWxcIiB9KTtcblxuICAgIGlmIChlICYmIGUuaWQpIHtcbiAgICAgIGNvbnN0IGRlbGV0ZUJ0biA9IGZvb3Rlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tZGVsZXRlXCIsIHRleHQ6IFwiRGVsZXRlIGV2ZW50XCIgfSk7XG4gICAgICBkZWxldGVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuZGVsZXRlKGUuaWQpO1xuICAgICAgICB0aGlzLm9uU2F2ZT8uKCk7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHNhdmVCdG4gPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImNmLWJ0bi1wcmltYXJ5XCIsIHRleHQ6IGUgJiYgZS5pZCA/IFwiU2F2ZVwiIDogXCJBZGQgZXZlbnRcIlxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEhhbmRsZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNhbmNlbEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5jbG9zZSgpKTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0aXRsZSA9IHRpdGxlSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCF0aXRsZSkge1xuICAgICAgICB0aXRsZUlucHV0LmZvY3VzKCk7XG4gICAgICAgIHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGV2ZW50RGF0YSA9IHtcbiAgICAgICAgdGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICBsb2NhdGlvbklucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxsRGF5OiAgICAgIGFsbERheVRvZ2dsZS5jaGVja2VkLFxuICAgICAgICBzdGFydERhdGU6ICAgc3RhcnREYXRlSW5wdXQudmFsdWUsXG4gICAgICAgIHN0YXJ0VGltZTogICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IHVuZGVmaW5lZCA6IHN0YXJ0VGltZUlucHV0LnZhbHVlLFxuICAgICAgICBlbmREYXRlOiAgICAgZW5kRGF0ZUlucHV0LnZhbHVlIHx8IHN0YXJ0RGF0ZUlucHV0LnZhbHVlLFxuICAgICAgICBlbmRUaW1lOiAgICAgYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyB1bmRlZmluZWQgOiBlbmRUaW1lSW5wdXQudmFsdWUsXG4gICAgICAgIHJlY3VycmVuY2U6ICByZWNTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBjYWxlbmRhcklkOiAgY2FsU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgIGFsZXJ0U2VsZWN0LnZhbHVlIGFzIEFsZXJ0T2Zmc2V0LFxuICAgICAgICB0YWdzOiAgICAgICAgICAgICAgZT8udGFncyA/PyBbXSxcbiAgICAgICAgbm90ZXM6ICAgICAgIGU/Lm5vdGVzLFxuICAgICAgICBsaW5rZWRUYXNrSWRzOiAgICAgIGU/LmxpbmtlZFRhc2tJZHMgPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogZT8uY29tcGxldGVkSW5zdGFuY2VzID8/IFtdLFxuICAgICAgfTtcblxuICAgICAgaWYgKGUgJiYgZS5pZCkge1xuICAgICAgICBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci51cGRhdGUoeyAuLi5lLCAuLi5ldmVudERhdGEgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci5jcmVhdGUoZXZlbnREYXRhKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5vblNhdmU/LigpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH07XG5cbiAgICBzYXZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoYW5kbGVTYXZlKTtcbiAgICB0aXRsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChlKSA9PiB7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIikgaGFuZGxlU2F2ZSgpO1xuICAgICAgaWYgKGUua2V5ID09PSBcIkVzY2FwZVwiKSB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGZpZWxkKHBhcmVudDogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3Qgd3JhcCA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZi1maWVsZFwiKTtcbiAgICB3cmFwLmNyZWF0ZURpdihcImNmLWxhYmVsXCIpLnNldFRleHQobGFiZWwpO1xuICAgIHJldHVybiB3cmFwO1xuICB9XG5cbiAgb25DbG9zZSgpIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjZW1GaWVsZChwYXJlbnQ6IEhUTUxFbGVtZW50LCBsYWJlbDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHdyYXAgPSBwYXJlbnQuY3JlYXRlRGl2KFwiY2YtZmllbGRcIik7XG4gICAgd3JhcC5jcmVhdGVEaXYoXCJjZi1sYWJlbFwiKS5zZXRUZXh0KGxhYmVsKTtcbiAgICByZXR1cm4gd3JhcDtcbiAgfVxufSJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FDQUEsc0JBQXVEOzs7QUNFaEQsSUFBTSxrQkFBTixNQUFzQjtBQUFBLEVBSTNCLFlBQVksV0FBZ0MsVUFBc0I7QUFDaEUsU0FBSyxZQUFZO0FBQ2pCLFNBQUssV0FBVztBQUFBLEVBQ2xCO0FBQUEsRUFFQSxTQUE4QjtBQUM1QixXQUFPLENBQUMsR0FBRyxLQUFLLFNBQVM7QUFBQSxFQUMzQjtBQUFBLEVBRUEsUUFBUSxJQUEyQztBQUNqRCxXQUFPLEtBQUssVUFBVSxLQUFLLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRTtBQUFBLEVBQy9DO0FBQUEsRUFFQSxPQUFPLE1BQWMsT0FBeUM7QUFDNUQsVUFBTSxXQUE4QjtBQUFBLE1BQ2xDLElBQUksS0FBSyxXQUFXLElBQUk7QUFBQSxNQUN4QjtBQUFBLE1BQ0E7QUFBQSxNQUNBLFdBQVc7QUFBQSxNQUNYLFlBQVcsb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFBQSxJQUNwQztBQUNBLFNBQUssVUFBVSxLQUFLLFFBQVE7QUFDNUIsU0FBSyxTQUFTO0FBQ2QsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE9BQU8sSUFBWSxTQUEyQztBQUM1RCxVQUFNLE1BQU0sS0FBSyxVQUFVLFVBQVUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFO0FBQ3ZE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QVMsS0FBSyxRQUFRO0FBQUEsRUFDbkM7QUFBQSxFQUVBLE1BQU0sa0JBQWtCLE9BQXdCO0FBQzlDLFVBQU0sRUFBRSxVQUFVLElBQUksS0FBSztBQUMzQixVQUFNLFdBQVcsVUFBVSxnQkFBZ0Isb0JBQW9CLEVBQUUsQ0FBQztBQUNsRSxRQUFJLFNBQVUsVUFBUyxPQUFPO0FBQzlCLFVBQU0sT0FBTyxVQUFVLFFBQVEsS0FBSztBQUNwQyxVQUFNLEtBQUssYUFBYSxFQUFFLE1BQU0sc0JBQXNCLFFBQVEsS0FBSyxDQUFDO0FBQ3BFLGNBQVUsV0FBVyxJQUFJO0FBRXpCLFVBQU0sSUFBSSxRQUFRLGFBQVcsV0FBVyxTQUFTLEdBQUcsQ0FBQztBQUNyRCxVQUFNLFdBQVcsVUFBVSxnQkFBZ0Isb0JBQW9CLEVBQUUsQ0FBQztBQUNsRSxVQUFNLFdBQVcscUNBQVU7QUFDM0IsUUFBSSxZQUFZLE1BQU8sVUFBUyxVQUFVLEtBQUs7QUFBQSxFQUNqRDtBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgIl9iIiwgIl9jIiwgIl9kIiwgIl9lIiwgImUiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJfYiIsICJfYyIsICJfZCIsICJfZSIsICJfZiIsICJfZyIsICJfaCIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiX2IiLCAiX2MiLCAiX2QiLCAiX2UiLCAidCIsICJ0IiwgImdyb3VwcyIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgIl9iIiwgIl9jIiwgIl9kIiwgImUiLCAiZSJdCn0K
