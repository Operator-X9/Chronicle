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
    const idx = this.calendars.findIndex((c) => c.id === id);
    if (idx !== -1) this.calendars.splice(idx, 1);
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
  renderListRow(el, list, isOnly) {
    const setting = new import_obsidian.Setting(el);
    const dot = setting.nameEl.createDiv("cs-cal-dot");
    dot.style.backgroundColor = list.color;
    setting.nameEl.createSpan({ text: list.name });
    setting.addColorPicker((picker) => {
      picker.setValue(list.color);
      picker.onChange(async (hex) => {
        dot.style.backgroundColor = hex;
        this.plugin.listManager.update(list.id, { color: hex });
        await this.plugin.saveSettings();
      });
    }).addText(
      (text) => text.setValue(list.name).setPlaceholder("List name").onChange(async (value) => {
        if (!value.trim()) return;
        this.plugin.listManager.update(list.id, { name: value.trim() });
        await this.plugin.saveSettings();
      })
    ).addButton(
      (btn) => btn.setIcon("trash").setTooltip("Delete list").setDisabled(isOnly).onClick(async () => {
        this.plugin.listManager.delete(list.id);
        await this.plugin.saveSettings();
        new import_obsidian.Notice(`List "${list.name}" deleted`);
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
    new import_obsidian.Setting(el).setName("Default list").setDesc("List assigned to new tasks by default.").addDropdown((drop) => {
      var _a;
      drop.addOption("", "None");
      for (const list of this.plugin.listManager.getAll()) {
        drop.addOption(list.id, list.name);
      }
      drop.setValue((_a = this.plugin.settings.defaultListId) != null ? _a : "");
      drop.onChange(async (value) => {
        this.plugin.settings.defaultListId = value;
        await this.plugin.saveSettings();
      });
    });
    this.divider(el);
    this.subHeader(el, "My Lists");
    el.createDiv("cs-desc").setText("Add, rename, recolor, or delete lists.");
    for (const list of this.plugin.listManager.getAll()) {
      this.renderListRow(el, list, this.plugin.listManager.getAll().length === 1);
    }
    this.divider(el);
    const addListRow = el.createDiv("cs-add-row");
    const listNameInput = addListRow.createEl("input", {
      type: "text",
      cls: "cs-text-input",
      placeholder: "New list name"
    });
    const listColorPicker = addListRow.createEl("input", { type: "color", cls: "cs-color-picker" });
    listColorPicker.value = "#378ADD";
    const addListBtn = addListRow.createEl("button", { cls: "cs-btn-primary", text: "Add list" });
    addListBtn.addEventListener("click", async () => {
      const name = listNameInput.value.trim();
      if (!name) {
        listNameInput.focus();
        return;
      }
      this.plugin.listManager.create(name, listColorPicker.value);
      await this.plugin.saveSettings();
      new import_obsidian.Notice(`List "${name}" created`);
      this.display();
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

// src/types/index.ts
var DEFAULT_SETTINGS = {
  tasksFolder: "Chronicle/Tasks",
  eventsFolder: "Chronicle/Events",
  calendars: [
    { id: "personal", name: "Personal", color: "#378ADD", isVisible: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "work", name: "Work", color: "#34C759", isVisible: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() }
  ],
  defaultCalendarId: "personal",
  lists: [
    { id: "personal", name: "Personal", color: "#378ADD", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "work", name: "Work", color: "#34C759", createdAt: (/* @__PURE__ */ new Date()).toISOString() }
  ],
  defaultListId: "personal",
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

// src/views/EventFormView.ts
var import_obsidian3 = require("obsidian");
var EVENT_FORM_VIEW_TYPE = "chronicle-event-form";
var EventFormView = class extends import_obsidian3.ItemView {
  constructor(leaf, eventManager, calendarManager, taskManager, editingEvent, onSave) {
    super(leaf);
    this.editingEvent = null;
    this.eventManager = eventManager;
    this.calendarManager = calendarManager;
    this.taskManager = taskManager;
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
    await this.render();
  }
  loadEvent(event) {
    this.editingEvent = event;
    this.render();
  }
  async render() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("chronicle-form-page");
    const e = this.editingEvent;
    const calendars = this.calendarManager.getAll();
    const allTasks = await this.taskManager.getAll();
    let linkedIds = [...(_a = e == null ? void 0 : e.linkedTaskIds) != null ? _a : []];
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
    titleInput.value = (_b = e == null ? void 0 : e.title) != null ? _b : "";
    titleInput.focus();
    const locationInput = this.field(form, "Location").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Add location"
    });
    locationInput.value = (_c = e == null ? void 0 : e.location) != null ? _c : "";
    const allDayWrap = this.field(form, "All day").createDiv("cem-toggle-wrap");
    const allDayToggle = allDayWrap.createEl("input", { type: "checkbox", cls: "cem-toggle" });
    allDayToggle.checked = (_d = e == null ? void 0 : e.allDay) != null ? _d : false;
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
    startDateInput.value = (_e = e == null ? void 0 : e.startDate) != null ? _e : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const endDateInput = this.field(dateRow, "End date").createEl("input", {
      type: "date",
      cls: "cf-input"
    });
    endDateInput.value = (_f = e == null ? void 0 : e.endDate) != null ? _f : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
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
    startTimeInput.value = (_g = e == null ? void 0 : e.startTime) != null ? _g : "09:00";
    const endTimeInput = this.field(timeFields, "End time").createEl("input", {
      type: "time",
      cls: "cf-input"
    });
    endTimeInput.value = (_h = e == null ? void 0 : e.endTime) != null ? _h : "10:00";
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
    tagsInput.value = (_j = (_i = e == null ? void 0 : e.tags) == null ? void 0 : _i.join(", ")) != null ? _j : "";
    const linkedInput = this.field(form, "Linked notes").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Projects/Website, Journal/2024  (comma separated)"
    });
    linkedInput.value = (_l = (_k = e == null ? void 0 : e.linkedNotes) == null ? void 0 : _k.join(", ")) != null ? _l : "";
    const linkedTasksField = this.field(form, "Linked tasks");
    const linkedList = linkedTasksField.createDiv("ctl-list");
    const renderLinkedList = () => {
      linkedList.empty();
      const items = allTasks.filter((t) => linkedIds.includes(t.id));
      if (items.length === 0) {
        linkedList.createDiv("ctl-empty").setText("No linked tasks");
      }
      for (const task of items) {
        const row = linkedList.createDiv("ctl-item");
        row.createSpan({ cls: `ctl-status ctl-status-${task.status}` });
        row.createSpan({ cls: "ctl-title" }).setText(task.title);
        const unlinkBtn = row.createEl("button", { cls: "ctl-unlink", text: "\xD7" });
        unlinkBtn.addEventListener("click", () => {
          linkedIds = linkedIds.filter((id) => id !== task.id);
          renderLinkedList();
        });
      }
    };
    renderLinkedList();
    const searchWrap = linkedTasksField.createDiv("ctl-search-wrap");
    const searchInput = searchWrap.createEl("input", {
      type: "text",
      cls: "cf-input ctl-search",
      placeholder: "Search tasks to link\u2026"
    });
    const searchResults = searchWrap.createDiv("ctl-results");
    searchResults.style.display = "none";
    const closeSearch = () => {
      searchResults.style.display = "none";
      searchResults.empty();
    };
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase().trim();
      searchResults.empty();
      if (!q) {
        closeSearch();
        return;
      }
      const matches = allTasks.filter((t) => !linkedIds.includes(t.id) && t.title.toLowerCase().includes(q)).slice(0, 6);
      if (matches.length === 0) {
        closeSearch();
        return;
      }
      searchResults.style.display = "";
      for (const task of matches) {
        const item = searchResults.createDiv("ctl-result-item");
        item.createSpan({ cls: `ctl-status ctl-status-${task.status}` });
        item.createSpan({ cls: "ctl-result-title" }).setText(task.title);
        item.addEventListener("mousedown", (ev) => {
          ev.preventDefault();
          linkedIds.push(task.id);
          searchInput.value = "";
          closeSearch();
          renderLinkedList();
        });
      }
    });
    searchInput.addEventListener("blur", () => {
      setTimeout(closeSearch, 150);
    });
    const newTaskWrap = linkedTasksField.createDiv("ctl-new-wrap");
    const newTaskInput = newTaskWrap.createEl("input", {
      type: "text",
      cls: "cf-input ctl-new-input",
      placeholder: "New task title\u2026"
    });
    const addTaskBtn = newTaskWrap.createEl("button", { cls: "cf-btn-primary ctl-add-btn", text: "Add task" });
    const createAndLink = async () => {
      const title = newTaskInput.value.trim();
      if (!title) return;
      const newTask = await this.taskManager.create({
        title,
        status: "todo",
        priority: "none",
        calendarId: calSelect.value || void 0,
        tags: [],
        linkedNotes: [],
        projects: [],
        timeEntries: [],
        customFields: [],
        completedInstances: []
      });
      allTasks.push(newTask);
      linkedIds.push(newTask.id);
      newTaskInput.value = "";
      renderLinkedList();
    };
    addTaskBtn.addEventListener("click", createAndLink);
    newTaskInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        createAndLink();
      }
    });
    const notesInput = this.field(form, "Notes").createEl("textarea", {
      cls: "cf-textarea",
      placeholder: "Add notes..."
    });
    notesInput.value = (_m = e == null ? void 0 : e.notes) != null ? _m : "";
    cancelBtn.addEventListener("click", () => {
      this.app.workspace.detachLeavesOfType(EVENT_FORM_VIEW_TYPE);
    });
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
        notes: notesInput.value || void 0,
        linkedNotes: linkedInput.value ? linkedInput.value.split(",").map((s) => s.trim()).filter(Boolean) : (_a2 = e == null ? void 0 : e.linkedNotes) != null ? _a2 : [],
        tags: tagsInput.value ? tagsInput.value.split(",").map((s) => s.trim()).filter(Boolean) : (_b2 = e == null ? void 0 : e.tags) != null ? _b2 : [],
        linkedTaskIds: linkedIds,
        completedInstances: (_c2 = e == null ? void 0 : e.completedInstances) != null ? _c2 : []
      };
      if (e == null ? void 0 : e.id) {
        await this.eventManager.update({ ...e, ...eventData });
      } else {
        await this.eventManager.create(eventData);
      }
      (_d2 = this.onSave) == null ? void 0 : _d2.call(this);
      this.app.workspace.detachLeavesOfType(EVENT_FORM_VIEW_TYPE);
    };
    saveBtn.addEventListener("click", handleSave);
    titleInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") handleSave();
    });
  }
  field(parent, label) {
    const wrap = parent.createDiv("cf-field");
    wrap.createDiv("cf-label").setText(label);
    return wrap;
  }
};

// src/main.ts
var import_obsidian13 = require("obsidian");

// src/data/ListManager.ts
var ListManager = class {
  constructor(lists, onUpdate) {
    this.lists = lists;
    this.onUpdate = onUpdate;
  }
  getAll() {
    return [...this.lists];
  }
  getById(id) {
    return this.lists.find((l) => l.id === id);
  }
  create(name, color) {
    const list = {
      id: this.generateId(name),
      name,
      color,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.lists.push(list);
    this.onUpdate();
    return list;
  }
  update(id, changes) {
    const idx = this.lists.findIndex((l) => l.id === id);
    if (idx === -1) return;
    this.lists[idx] = { ...this.lists[idx], ...changes };
    this.onUpdate();
  }
  delete(id) {
    const idx = this.lists.findIndex((l) => l.id === id);
    if (idx !== -1) this.lists.splice(idx, 1);
    this.onUpdate();
  }
  generateId(name) {
    const base = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
  }
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
  // ── Filters ─────────────────────────────────────────────────────────────────
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
      "list-id": (_b = task.listId) != null ? _b : null,
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s;
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
        // read new list-id; fall back to legacy calendar-id so old tasks still show their list
        listId: (_j = (_i = fm["list-id"]) != null ? _i : fm["calendar-id"]) != null ? _j : void 0,
        tags: (_k = fm.tags) != null ? _k : [],
        linkedNotes: (_l = fm["linked-notes"]) != null ? _l : [],
        projects: (_m = fm.projects) != null ? _m : [],
        timeEstimate: (_n = fm["time-estimate"]) != null ? _n : void 0,
        timeEntries: (_o = fm["time-entries"]) != null ? _o : [],
        customFields: (_p = fm["custom-fields"]) != null ? _p : [],
        completedInstances: (_q = fm["completed-instances"]) != null ? _q : [],
        createdAt: (_r = fm["created-at"]) != null ? _r : (/* @__PURE__ */ new Date()).toISOString(),
        completedAt: (_s = fm["completed-at"]) != null ? _s : void 0,
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
var import_obsidian9 = require("obsidian");

// src/ui/TaskModal.ts
var import_obsidian6 = require("obsidian");
var TaskModal = class extends import_obsidian6.Modal {
  constructor(app, taskManager, listManager, editingTask, onSave, onExpand, plugin) {
    super(app);
    this.taskManager = taskManager;
    this.listManager = listManager;
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
    const lists = this.listManager.getAll();
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
    const dueDateInput = this.field(row2, "Date").createEl("input", { type: "date", cls: "cf-input" });
    dueDateInput.value = (_i = t == null ? void 0 : t.dueDate) != null ? _i : "";
    const dueTimeInput = this.field(row2, "Time").createEl("input", { type: "time", cls: "cf-input" });
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
    const defaultAlert = (_m = (_l = (_k = this.plugin) == null ? void 0 : _k.settings) == null ? void 0 : _l.defaultAlert) != null ? _m : "none";
    for (const a of taskAlerts) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if (t ? t.alert === a.value : a.value === defaultAlert) opt.selected = true;
    }
    const listSelect = this.field(form, "List").createEl("select", { cls: "cf-select" });
    const defaultListId = (_p = (_o = (_n = this.plugin) == null ? void 0 : _n.settings) == null ? void 0 : _o.defaultListId) != null ? _p : "";
    listSelect.createEl("option", { value: "", text: "None" });
    for (const list of lists) {
      const opt = listSelect.createEl("option", { value: list.id, text: list.name });
      if (t ? t.listId === list.id : list.id === defaultListId) opt.selected = true;
    }
    const updateListColor = () => {
      const list = this.listManager.getById(listSelect.value);
      listSelect.style.borderLeftColor = list ? list.color : "transparent";
      listSelect.style.borderLeftWidth = "4px";
      listSelect.style.borderLeftStyle = "solid";
    };
    listSelect.addEventListener("change", updateListColor);
    updateListColor();
    const tagsInput = this.field(form, "Tags").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "work, personal  (comma separated)"
    });
    tagsInput.value = (_r = (_q = t == null ? void 0 : t.tags) == null ? void 0 : _q.join(", ")) != null ? _r : "";
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
      var _a2, _b2, _c2, _d2, _e2, _f2, _g2;
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
        listId: listSelect.value || void 0,
        recurrence: recSelect.value || void 0,
        alert: alertSelect.value,
        location: locationInput.value || void 0,
        tags: tagsInput.value ? tagsInput.value.split(",").map((s) => s.trim()).filter(Boolean) : (_a2 = t == null ? void 0 : t.tags) != null ? _a2 : [],
        notes: t == null ? void 0 : t.notes,
        linkedNotes: (_b2 = t == null ? void 0 : t.linkedNotes) != null ? _b2 : [],
        projects: (_c2 = t == null ? void 0 : t.projects) != null ? _c2 : [],
        timeEstimate: t == null ? void 0 : t.timeEstimate,
        timeEntries: (_d2 = t == null ? void 0 : t.timeEntries) != null ? _d2 : [],
        customFields: (_e2 = t == null ? void 0 : t.customFields) != null ? _e2 : [],
        completedInstances: (_f2 = t == null ? void 0 : t.completedInstances) != null ? _f2 : []
      };
      if (t == null ? void 0 : t.id) {
        await this.taskManager.update({ ...t, ...taskData });
      } else {
        await this.taskManager.create(taskData);
      }
      (_g2 = this.onSave) == null ? void 0 : _g2.call(this);
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

// src/ui/TaskDetailPopup.ts
var import_obsidian7 = require("obsidian");
var TaskDetailPopup = class extends import_obsidian7.Modal {
  constructor(app, task, listManager, timeFormat, onEdit) {
    super(app);
    this.task = task;
    this.listManager = listManager;
    this.timeFormat = timeFormat;
    this.onEdit = onEdit;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("cdp-modal");
    const t = this.task;
    const header = contentEl.createDiv("cdp-header");
    header.createDiv("cdp-title").setText(t.title);
    const badgeRow = contentEl.createDiv("cdp-badge-row");
    badgeRow.createSpan({ cls: `cdp-badge cdp-status-${t.status}` }).setText(formatStatus(t.status));
    if (t.priority !== "none") {
      badgeRow.createSpan({ cls: `cdp-badge cdp-priority-${t.priority}` }).setText(formatPriority(t.priority));
    }
    const body = contentEl.createDiv("cdp-body");
    if (t.dueDate) {
      const timeStr = t.dueTime ? `  \xB7  ${this.fmtTime(t.dueTime)}` : "";
      this.row(body, "Due", formatDate(t.dueDate) + timeStr);
    }
    if (t.location) this.row(body, "Location", t.location);
    if (t.listId) {
      const list = this.listManager.getById(t.listId);
      if (list) this.listRow(body, list.name, list.color);
    }
    if (t.recurrence) this.row(body, "Repeat", formatRecurrence(t.recurrence));
    if (t.alert && t.alert !== "none") this.row(body, "Alert", formatAlert(t.alert));
    if (t.tags.length > 0) this.row(body, "Tags", t.tags.join(", "));
    if (t.projects.length > 0) this.row(body, "Projects", t.projects.join(", "));
    if (t.linkedNotes.length > 0) this.row(body, "Linked notes", t.linkedNotes.join(", "));
    if (t.timeEstimate) this.row(body, "Estimate", formatDuration(t.timeEstimate));
    if (t.notes) {
      const notesRow = body.createDiv("cdp-row cdp-notes-row");
      notesRow.createDiv("cdp-row-label").setText("Notes");
      notesRow.createDiv("cdp-row-value cdp-notes-text").setText(
        t.notes.length > 400 ? t.notes.slice(0, 400) + "\u2026" : t.notes
      );
    }
    const footer = contentEl.createDiv("cdp-footer");
    footer.createEl("button", { cls: "cf-btn-primary", text: "Edit task" }).addEventListener("click", () => {
      this.close();
      this.onEdit();
    });
  }
  row(parent, label, value) {
    const row = parent.createDiv("cdp-row");
    row.createDiv("cdp-row-label").setText(label);
    row.createDiv("cdp-row-value").setText(value);
  }
  listRow(parent, name, color) {
    const row = parent.createDiv("cdp-row");
    row.createDiv("cdp-row-label").setText("List");
    const val = row.createDiv("cdp-row-value cdp-cal-value");
    const dot = val.createSpan("cdp-cal-dot");
    dot.style.background = color;
    val.createSpan().setText(name);
  }
  fmtTime(time) {
    if (this.timeFormat === "24h") return time;
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
  }
  onClose() {
    this.contentEl.empty();
  }
};
function formatStatus(s) {
  var _a;
  return (_a = { todo: "To Do", "in-progress": "In Progress", done: "Done", cancelled: "Cancelled" }[s]) != null ? _a : s;
}
function formatPriority(p) {
  var _a;
  const map = { low: "Low priority", medium: "Medium priority", high: "High priority" };
  return (_a = map[p]) != null ? _a : p;
}
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
function formatRecurrence(rrule) {
  var _a;
  const map = {
    "FREQ=DAILY": "Every day",
    "FREQ=WEEKLY": "Every week",
    "FREQ=MONTHLY": "Every month",
    "FREQ=YEARLY": "Every year",
    "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR": "Weekdays"
  };
  return (_a = map[rrule]) != null ? _a : rrule;
}
function formatAlert(alert) {
  var _a;
  const map = {
    "at-time": "At time of event",
    "5min": "5 minutes before",
    "10min": "10 minutes before",
    "15min": "15 minutes before",
    "30min": "30 minutes before",
    "1hour": "1 hour before",
    "2hours": "2 hours before",
    "1day": "1 day before",
    "2days": "2 days before",
    "1week": "1 week before"
  };
  return (_a = map[alert]) != null ? _a : alert;
}
function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

// src/views/TaskFormView.ts
var import_obsidian8 = require("obsidian");
var TASK_FORM_VIEW_TYPE = "chronicle-task-form";
var TaskFormView = class extends import_obsidian8.ItemView {
  constructor(leaf, taskManager, listManager, editingTask, onSave) {
    super(leaf);
    this.editingTask = null;
    this.taskManager = taskManager;
    this.listManager = listManager;
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
    const lists = this.listManager.getAll();
    const header = container.createDiv("cf-header");
    const cancelBtn = header.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });
    header.createDiv("cf-header-title").setText(t ? "Edit task" : "New task");
    const saveBtn = header.createEl("button", { cls: "cf-btn-primary", text: t ? "Save" : "Add" });
    const form = container.createDiv("cf-form");
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
    const dueDateInput = this.field(row2, "Date").createEl("input", { type: "date", cls: "cf-input" });
    dueDateInput.value = (_c = t == null ? void 0 : t.dueDate) != null ? _c : "";
    const dueTimeInput = this.field(row2, "Time").createEl("input", { type: "time", cls: "cf-input" });
    dueTimeInput.value = (_d = t == null ? void 0 : t.dueTime) != null ? _d : "";
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
    const listSelect = this.field(form, "List").createEl("select", { cls: "cf-select" });
    listSelect.createEl("option", { value: "", text: "None" });
    for (const list of lists) {
      const opt = listSelect.createEl("option", { value: list.id, text: list.name });
      if ((t == null ? void 0 : t.listId) === list.id) opt.selected = true;
    }
    const updateListColor = () => {
      const list = this.listManager.getById(listSelect.value);
      listSelect.style.borderLeftColor = list ? list.color : "transparent";
      listSelect.style.borderLeftWidth = "4px";
      listSelect.style.borderLeftStyle = "solid";
    };
    listSelect.addEventListener("change", updateListColor);
    updateListColor();
    const tagsInput = this.field(form, "Tags").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "work, personal  (comma separated)"
    });
    tagsInput.value = (_e = t == null ? void 0 : t.tags.join(", ")) != null ? _e : "";
    const linkedInput = this.field(form, "Linked notes").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Projects/Website, Journal/2024  (comma separated)"
    });
    linkedInput.value = (_f = t == null ? void 0 : t.linkedNotes.join(", ")) != null ? _f : "";
    const notesInput = this.field(form, "Notes").createEl("textarea", {
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
        const duplicate = existing.find((e) => e.title.toLowerCase() === title.toLowerCase());
        if (duplicate) {
          new import_obsidian8.Notice(`A task named "${title}" already exists.`, 4e3);
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
        listId: listSelect.value || void 0,
        recurrence: recSelect.value || void 0,
        alert: alertSelect.value,
        tags: tagsInput.value ? tagsInput.value.split(",").map((s) => s.trim()).filter(Boolean) : [],
        linkedNotes: linkedInput.value ? linkedInput.value.split(",").map((s) => s.trim()).filter(Boolean) : [],
        projects: (_a2 = t == null ? void 0 : t.projects) != null ? _a2 : [],
        timeEntries: (_b2 = t == null ? void 0 : t.timeEntries) != null ? _b2 : [],
        completedInstances: (_c2 = t == null ? void 0 : t.completedInstances) != null ? _c2 : [],
        customFields: (_d2 = t == null ? void 0 : t.customFields) != null ? _d2 : [],
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
var TaskView = class extends import_obsidian9.ItemView {
  constructor(leaf, taskManager, listManager, plugin) {
    super(leaf);
    this.currentListId = "today";
    this._renderVersion = 0;
    this.taskManager = taskManager;
    this.listManager = listManager;
    this.plugin = plugin;
  }
  getViewType() {
    return TASK_VIEW_TYPE;
  }
  getDisplayText() {
    return "Reminders";
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
      this.app.workspace.on("chronicle:settings-changed", () => this.render())
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
    const version = ++this._renderVersion;
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("chronicle-app");
    const all = await this.taskManager.getAll();
    const today = await this.taskManager.getDueToday();
    const scheduled = await this.taskManager.getScheduled();
    const flagged = await this.taskManager.getFlagged();
    const overdue = await this.taskManager.getOverdue();
    const lists = this.listManager.getAll();
    if (this._renderVersion !== version) return;
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
    for (const list of lists) {
      const row = listsSection.createDiv("chronicle-list-row");
      if (list.id === this.currentListId) row.addClass("active");
      const dot = row.createDiv("chronicle-list-dot");
      dot.style.backgroundColor = list.color;
      row.createDiv("chronicle-list-name").setText(list.name);
      const listCount = all.filter((t) => t.listId === list.id && t.status !== "done").length;
      if (listCount > 0) row.createDiv("chronicle-list-count").setText(String(listCount));
      row.addEventListener("click", () => {
        this.currentListId = list.id;
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
      const list = this.listManager.getById(this.currentListId);
      titleEl.setText((_a = list == null ? void 0 : list.name) != null ? _a : "List");
      titleEl.style.color = list ? list.color : "var(--text-normal)";
      tasks = all.filter((t) => t.listId === this.currentListId && t.status !== "done");
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
    if (!isArchive) content.addEventListener("click", () => {
      new TaskDetailPopup(
        this.app,
        task,
        this.listManager,
        this.plugin.settings.timeFormat,
        () => this.openTaskForm(task)
      ).open();
    });
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
    } else if (task.dueDate || task.listId) {
      if (task.dueDate) {
        const metaDate = metaRow.createSpan("chronicle-task-date");
        metaDate.setText(this.formatDate(task.dueDate));
        if (task.dueDate < todayStr) metaDate.addClass("overdue");
      }
      if (task.listId) {
        const list = this.listManager.getById(task.listId);
        if (list) {
          const listDot = metaRow.createSpan("chronicle-task-cal-dot");
          listDot.style.backgroundColor = list.color;
          metaRow.createSpan("chronicle-task-cal-name").setText(list.name);
        }
      }
    }
    if (!isArchive && task.priority === "high") {
      row.createDiv("chronicle-flag").setText("\u2691");
    }
    if (isArchive) {
      const actions = row.createDiv("chronicle-archive-actions");
      const restoreBtn = actions.createEl("button", { cls: "chronicle-archive-btn", text: "Restore" });
      restoreBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.taskManager.update({ ...task, status: "todo", completedAt: void 0 });
      });
      const deleteBtn = actions.createEl("button", { cls: "chronicle-archive-btn chronicle-archive-btn-delete", text: "Delete" });
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
      const groups2 = { "Today": [], "This week": [], "Earlier": [] };
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
    return (/* @__PURE__ */ new Date(dateStr + "T00:00:00")).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  async openTaskForm(task) {
    new TaskModal(
      this.app,
      this.taskManager,
      this.listManager,
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
var import_obsidian12 = require("obsidian");

// src/ui/EventModal.ts
var import_obsidian10 = require("obsidian");
var EventModal = class extends import_obsidian10.Modal {
  constructor(app, eventManager, calendarManager, taskManager, editingEvent, onSave, onExpand) {
    super(app);
    this.eventManager = eventManager;
    this.calendarManager = calendarManager;
    this.taskManager = taskManager;
    this.editingEvent = editingEvent != null ? editingEvent : null;
    this.onSave = onSave;
    this.onExpand = onExpand;
  }
  async onOpen() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("chronicle-event-modal");
    const e = this.editingEvent;
    const calendars = this.calendarManager.getAll();
    const allTasks = await this.taskManager.getAll();
    let linkedIds = [...(_a = e == null ? void 0 : e.linkedTaskIds) != null ? _a : []];
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
    titleInput.value = (_b = e == null ? void 0 : e.title) != null ? _b : "";
    titleInput.focus();
    const locationInput = this.field(form, "Location").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Add location"
    });
    locationInput.value = (_c = e == null ? void 0 : e.location) != null ? _c : "";
    const allDayField = this.field(form, "All day");
    const allDayWrap = allDayField.createDiv("cem-toggle-wrap");
    const allDayToggle = allDayWrap.createEl("input", { type: "checkbox", cls: "cem-toggle" });
    allDayToggle.checked = (_d = e == null ? void 0 : e.allDay) != null ? _d : false;
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
    startDateInput.value = (_e = e == null ? void 0 : e.startDate) != null ? _e : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const endDateInput = this.field(dateRow, "End date").createEl("input", {
      type: "date",
      cls: "cf-input"
    });
    endDateInput.value = (_f = e == null ? void 0 : e.endDate) != null ? _f : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
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
    startTimeInput.value = (_g = e == null ? void 0 : e.startTime) != null ? _g : "09:00";
    const endTimeInput = this.field(timeFields, "End time").createEl("input", {
      type: "time",
      cls: "cf-input"
    });
    endTimeInput.value = (_h = e == null ? void 0 : e.endTime) != null ? _h : "10:00";
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
    tagsInput.value = (_j = (_i = e == null ? void 0 : e.tags) == null ? void 0 : _i.join(", ")) != null ? _j : "";
    const linkedField = this.field(form, "Linked tasks");
    const linkedList = linkedField.createDiv("ctl-list");
    const renderLinkedList = () => {
      linkedList.empty();
      const items = allTasks.filter((t) => linkedIds.includes(t.id));
      if (items.length === 0) {
        linkedList.createDiv("ctl-empty").setText("No linked tasks");
      }
      for (const task of items) {
        const row = linkedList.createDiv("ctl-item");
        row.createSpan({ cls: `ctl-status ctl-status-${task.status}` });
        row.createSpan({ cls: "ctl-title" }).setText(task.title);
        const unlinkBtn = row.createEl("button", { cls: "ctl-unlink", text: "\xD7" });
        unlinkBtn.addEventListener("click", () => {
          linkedIds = linkedIds.filter((id) => id !== task.id);
          renderLinkedList();
        });
      }
    };
    renderLinkedList();
    const searchWrap = linkedField.createDiv("ctl-search-wrap");
    const searchInput = searchWrap.createEl("input", {
      type: "text",
      cls: "cf-input ctl-search",
      placeholder: "Search tasks to link\u2026"
    });
    const searchResults = searchWrap.createDiv("ctl-results");
    searchResults.style.display = "none";
    const closeSearch = () => {
      searchResults.style.display = "none";
      searchResults.empty();
    };
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase().trim();
      searchResults.empty();
      if (!q) {
        closeSearch();
        return;
      }
      const matches = allTasks.filter((t) => !linkedIds.includes(t.id) && t.title.toLowerCase().includes(q)).slice(0, 6);
      if (matches.length === 0) {
        closeSearch();
        return;
      }
      searchResults.style.display = "";
      for (const task of matches) {
        const item = searchResults.createDiv("ctl-result-item");
        item.createSpan({ cls: `ctl-status ctl-status-${task.status}` });
        item.createSpan({ cls: "ctl-result-title" }).setText(task.title);
        item.addEventListener("mousedown", (ev) => {
          ev.preventDefault();
          linkedIds.push(task.id);
          searchInput.value = "";
          closeSearch();
          renderLinkedList();
        });
      }
    });
    searchInput.addEventListener("blur", () => {
      setTimeout(closeSearch, 150);
    });
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
        tags: tagsInput.value ? tagsInput.value.split(",").map((s) => s.trim()).filter(Boolean) : (_a2 = e == null ? void 0 : e.tags) != null ? _a2 : [],
        notes: e == null ? void 0 : e.notes,
        linkedNotes: (_b2 = e == null ? void 0 : e.linkedNotes) != null ? _b2 : [],
        linkedTaskIds: linkedIds,
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
    titleInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") handleSave();
      if (ev.key === "Escape") this.close();
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
};

// src/ui/EventDetailPopup.ts
var import_obsidian11 = require("obsidian");
var EventDetailPopup = class extends import_obsidian11.Modal {
  constructor(app, event, calendarManager, taskManager, timeFormat, onEdit) {
    super(app);
    this.event = event;
    this.calendarManager = calendarManager;
    this.taskManager = taskManager;
    this.timeFormat = timeFormat;
    this.onEdit = onEdit;
  }
  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("cdp-modal");
    const ev = this.event;
    const header = contentEl.createDiv("cdp-header");
    header.createDiv("cdp-title").setText(ev.title);
    const body = contentEl.createDiv("cdp-body");
    const dateTimeStr = this.formatDateTime(ev);
    this.row(body, ev.allDay ? "Date" : "When", dateTimeStr);
    if (ev.location) this.row(body, "Location", ev.location);
    if (ev.calendarId) {
      const cal = this.calendarManager.getById(ev.calendarId);
      if (cal) this.calRow(body, cal.name, CalendarManager.colorToHex(cal.color));
    }
    if (ev.recurrence) this.row(body, "Repeat", formatRecurrence2(ev.recurrence));
    if (ev.alert && ev.alert !== "none") this.row(body, "Alert", formatAlert2(ev.alert));
    if (ev.tags && ev.tags.length > 0) this.row(body, "Tags", ev.tags.join(", "));
    if (ev.linkedNotes && ev.linkedNotes.length > 0)
      this.row(body, "Linked notes", ev.linkedNotes.join(", "));
    if (ev.linkedTaskIds && ev.linkedTaskIds.length > 0) {
      const allTasks = await this.taskManager.getAll();
      const linked = allTasks.filter((t) => ev.linkedTaskIds.includes(t.id));
      if (linked.length > 0) {
        const tasksRow = body.createDiv("cdp-row cdp-linked-tasks-row");
        tasksRow.createDiv("cdp-row-label").setText("Tasks");
        const list = tasksRow.createDiv("cdp-row-value cdp-task-list");
        for (const task of linked) {
          const item = list.createDiv("cdp-task-item");
          item.createSpan({ cls: `ctl-status ctl-status-${task.status}` });
          item.createSpan({ cls: "cdp-task-title" }).setText(task.title);
        }
      }
    }
    if (ev.notes) {
      const notesRow = body.createDiv("cdp-row cdp-notes-row");
      notesRow.createDiv("cdp-row-label").setText("Notes");
      notesRow.createDiv("cdp-row-value cdp-notes-text").setText(
        ev.notes.length > 400 ? ev.notes.slice(0, 400) + "\u2026" : ev.notes
      );
    }
    const footer = contentEl.createDiv("cdp-footer");
    const editBtn = footer.createEl("button", { cls: "cf-btn-primary", text: "Edit event" });
    editBtn.addEventListener("click", () => {
      this.close();
      this.onEdit();
    });
  }
  formatDateTime(ev) {
    const startDate = formatDate2(ev.startDate);
    const endDate = formatDate2(ev.endDate);
    const sameDay = ev.startDate === ev.endDate;
    if (ev.allDay) {
      return sameDay ? startDate : `${startDate} \u2013 ${endDate}`;
    }
    const startTime = ev.startTime ? this.fmtTime(ev.startTime) : "";
    const endTime = ev.endTime ? this.fmtTime(ev.endTime) : "";
    if (sameDay) {
      return startTime && endTime ? `${startDate}  \xB7  ${startTime} \u2013 ${endTime}` : startDate;
    }
    return `${startDate} ${startTime} \u2013 ${endDate} ${endTime}`.trim();
  }
  row(parent, label, value) {
    const row = parent.createDiv("cdp-row");
    row.createDiv("cdp-row-label").setText(label);
    row.createDiv("cdp-row-value").setText(value);
  }
  calRow(parent, name, color) {
    const row = parent.createDiv("cdp-row");
    row.createDiv("cdp-row-label").setText("Calendar");
    const val = row.createDiv("cdp-row-value cdp-cal-value");
    const dot = val.createSpan("cdp-cal-dot");
    dot.style.background = color;
    val.createSpan().setText(name);
  }
  fmtTime(time) {
    if (this.timeFormat === "24h") return time;
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
  }
  onClose() {
    this.contentEl.empty();
  }
};
function formatDate2(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
function formatRecurrence2(rrule) {
  var _a;
  const map = {
    "FREQ=DAILY": "Every day",
    "FREQ=WEEKLY": "Every week",
    "FREQ=MONTHLY": "Every month",
    "FREQ=YEARLY": "Every year",
    "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR": "Weekdays"
  };
  return (_a = map[rrule]) != null ? _a : rrule;
}
function formatAlert2(alert) {
  var _a;
  const map = {
    "at-time": "At time of event",
    "5min": "5 minutes before",
    "10min": "10 minutes before",
    "15min": "15 minutes before",
    "30min": "30 minutes before",
    "1hour": "1 hour before",
    "2hours": "2 hours before",
    "1day": "1 day before",
    "2days": "2 days before",
    "1week": "1 week before"
  };
  return (_a = map[alert]) != null ? _a : alert;
}

// src/views/CalendarView.ts
var CALENDAR_VIEW_TYPE = "chronicle-calendar-view";
var HOUR_HEIGHT = 56;
var CalendarView = class extends import_obsidian12.ItemView {
  constructor(leaf, eventManager, taskManager, calendarManager, plugin) {
    super(leaf);
    this.currentDate = /* @__PURE__ */ new Date();
    this.mode = "week";
    this._modeSet = false;
    this._renderVersion = 0;
    this.eventManager = eventManager;
    this.taskManager = taskManager;
    this.calendarManager = calendarManager;
    this.plugin = plugin;
  }
  getViewType() {
    return CALENDAR_VIEW_TYPE;
  }
  getDisplayText() {
    return "Calendar";
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
      this.app.workspace.on("chronicle:settings-changed", () => this.render())
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
    const version = ++this._renderVersion;
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
    if (this._renderVersion !== version) return;
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
        this.taskManager,
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
          new EventDetailPopup(this.app, event, this.calendarManager, this.taskManager, this.plugin.settings.timeFormat, () => new EventModal(this.app, this.eventManager, this.calendarManager, this.taskManager, event, () => this.render(), (ev) => this.openEventFullPage(ev)).open()).open();
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
      this.taskManager,
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
      new EventModal(this.app, this.eventManager, this.calendarManager, this.taskManager, event, () => this.render(), (e) => this.openEventFullPage(e)).open();
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
      new EventDetailPopup(this.app, event, this.calendarManager, this.taskManager, this.plugin.settings.timeFormat, () => new EventModal(this.app, this.eventManager, this.calendarManager, this.taskManager, event, () => this.render(), (ev) => this.openEventFullPage(ev)).open()).open();
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
      () => new EventDetailPopup(this.app, event, this.calendarManager, this.taskManager, this.plugin.settings.timeFormat, () => new EventModal(this.app, this.eventManager, this.calendarManager, this.taskManager, event, () => this.render(), (ev) => this.openEventFullPage(ev)).open()).open()
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
var ChroniclePlugin = class extends import_obsidian13.Plugin {
  async onload() {
    await this.loadSettings();
    this.calendarManager = new CalendarManager(
      this.settings.calendars,
      () => this.saveSettings()
    );
    this.listManager = new ListManager(
      this.settings.lists,
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
      (leaf) => new TaskView(leaf, this.taskManager, this.listManager, this)
    );
    this.registerView(
      TASK_FORM_VIEW_TYPE,
      (leaf) => new TaskFormView(leaf, this.taskManager, this.listManager)
    );
    this.registerView(
      CALENDAR_VIEW_TYPE,
      (leaf) => new CalendarView(leaf, this.eventManager, this.taskManager, this.calendarManager, this)
    );
    this.registerView(
      EVENT_FORM_VIEW_TYPE,
      (leaf) => new EventFormView(leaf, this.eventManager, this.calendarManager, this.taskManager)
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
      this.taskManager,
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
    this.app.workspace.trigger("chronicle:settings-changed");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3VpL1NldHRpbmdzVGFiLnRzIiwgInNyYy9kYXRhL0NhbGVuZGFyTWFuYWdlci50cyIsICJzcmMvZGF0YS9BbGVydE1hbmFnZXIudHMiLCAic3JjL3R5cGVzL2luZGV4LnRzIiwgInNyYy92aWV3cy9FdmVudEZvcm1WaWV3LnRzIiwgInNyYy9kYXRhL0xpc3RNYW5hZ2VyLnRzIiwgInNyYy9kYXRhL1Rhc2tNYW5hZ2VyLnRzIiwgInNyYy9kYXRhL0V2ZW50TWFuYWdlci50cyIsICJzcmMvdmlld3MvVGFza1ZpZXcudHMiLCAic3JjL3VpL1Rhc2tNb2RhbC50cyIsICJzcmMvdWkvVGFza0RldGFpbFBvcHVwLnRzIiwgInNyYy92aWV3cy9UYXNrRm9ybVZpZXcudHMiLCAic3JjL3ZpZXdzL0NhbGVuZGFyVmlldy50cyIsICJzcmMvdWkvRXZlbnRNb2RhbC50cyIsICJzcmMvdWkvRXZlbnREZXRhaWxQb3B1cC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQ2hyb25pY2xlU2V0dGluZ3NUYWIgfSBmcm9tIFwiLi91aS9TZXR0aW5nc1RhYlwiO1xuaW1wb3J0IHsgQWxlcnRNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9BbGVydE1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZVNldHRpbmdzLCBERUZBVUxUX1NFVFRJTkdTLCBDaHJvbmljbGVFdmVudCB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBFdmVudEZvcm1WaWV3LCBFVkVOVF9GT1JNX1ZJRVdfVFlQRSB9IGZyb20gXCIuL3ZpZXdzL0V2ZW50Rm9ybVZpZXdcIjtcbmltcG9ydCB7IFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IExpc3RNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9MaXN0TWFuYWdlclwiO1xuaW1wb3J0IHsgVGFza01hbmFnZXIgfSBmcm9tIFwiLi9kYXRhL1Rhc2tNYW5hZ2VyXCI7XG5pbXBvcnQgeyBFdmVudE1hbmFnZXIgfSBmcm9tIFwiLi9kYXRhL0V2ZW50TWFuYWdlclwiO1xuaW1wb3J0IHsgVGFza1ZpZXcsIFRBU0tfVklFV19UWVBFIH0gZnJvbSBcIi4vdmlld3MvVGFza1ZpZXdcIjtcbmltcG9ydCB7IFRhc2tGb3JtVmlldywgVEFTS19GT1JNX1ZJRVdfVFlQRSB9IGZyb20gXCIuL3ZpZXdzL1Rhc2tGb3JtVmlld1wiO1xuaW1wb3J0IHsgQ2FsZW5kYXJWaWV3LCBDQUxFTkRBUl9WSUVXX1RZUEUgfSBmcm9tIFwiLi92aWV3cy9DYWxlbmRhclZpZXdcIjtcbmltcG9ydCB7IEV2ZW50TW9kYWwgfSBmcm9tIFwiLi91aS9FdmVudE1vZGFsXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENocm9uaWNsZVBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBDaHJvbmljbGVTZXR0aW5ncztcbiAgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXI7XG4gIGxpc3RNYW5hZ2VyOiBMaXN0TWFuYWdlcjtcbiAgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyO1xuICBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcjtcbiAgYWxlcnRNYW5hZ2VyOiBBbGVydE1hbmFnZXI7XG5cbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IG5ldyBDYWxlbmRhck1hbmFnZXIoXG4gICAgICB0aGlzLnNldHRpbmdzLmNhbGVuZGFycyxcbiAgICAgICgpID0+IHRoaXMuc2F2ZVNldHRpbmdzKClcbiAgICApO1xuICAgIHRoaXMubGlzdE1hbmFnZXIgPSBuZXcgTGlzdE1hbmFnZXIoXG4gICAgICB0aGlzLnNldHRpbmdzLmxpc3RzLFxuICAgICAgKCkgPT4gdGhpcy5zYXZlU2V0dGluZ3MoKVxuICAgICk7XG4gICAgdGhpcy50YXNrTWFuYWdlciAgPSBuZXcgVGFza01hbmFnZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MudGFza3NGb2xkZXIpO1xuICAgIHRoaXMuZXZlbnRNYW5hZ2VyID0gbmV3IEV2ZW50TWFuYWdlcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncy5ldmVudHNGb2xkZXIpO1xuXG4gICAgdGhpcy5hbGVydE1hbmFnZXIgPSBuZXcgQWxlcnRNYW5hZ2VyKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLnRhc2tNYW5hZ2VyLFxuICAgICAgdGhpcy5ldmVudE1hbmFnZXIsXG4gICAgICAoKSA9PiB0aGlzLnNldHRpbmdzXG4gICAgKTtcbiAgICB0aGlzLmFsZXJ0TWFuYWdlci5zdGFydCgpO1xuICAgIHRoaXMuYWxlcnRNYW5hZ2VyLnN0b3AoKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KFxuICAgICAgVEFTS19WSUVXX1RZUEUsXG4gICAgICAobGVhZikgPT4gbmV3IFRhc2tWaWV3KGxlYWYsIHRoaXMudGFza01hbmFnZXIsIHRoaXMubGlzdE1hbmFnZXIsIHRoaXMpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgIFRBU0tfRk9STV9WSUVXX1RZUEUsXG4gICAgICAobGVhZikgPT4gbmV3IFRhc2tGb3JtVmlldyhsZWFmLCB0aGlzLnRhc2tNYW5hZ2VyLCB0aGlzLmxpc3RNYW5hZ2VyKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlclZpZXcoXG4gICAgICBDQUxFTkRBUl9WSUVXX1RZUEUsXG4gICAgICAobGVhZikgPT4gbmV3IENhbGVuZGFyVmlldyhsZWFmLCB0aGlzLmV2ZW50TWFuYWdlciwgdGhpcy50YXNrTWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIsIHRoaXMpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgIEVWRU5UX0ZPUk1fVklFV19UWVBFLFxuICAgICAgKGxlYWYpID0+IG5ldyBFdmVudEZvcm1WaWV3KGxlYWYsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlciwgdGhpcy50YXNrTWFuYWdlcilcbiAgICApO1xuXG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwiY2hlY2stY2lyY2xlXCIsIFwiQ2hyb25pY2xlIFRhc2tzXCIsICgpID0+IHRoaXMuYWN0aXZhdGVUYXNrVmlldygpKTtcbiAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJjYWxlbmRhclwiLCBcIkNocm9uaWNsZSBDYWxlbmRhclwiLCAoKSA9PiB0aGlzLmFjdGl2YXRlQ2FsZW5kYXJWaWV3KCkpO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9wZW4tY2hyb25pY2xlXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gdGFzayBkYXNoYm9hcmRcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLmFjdGl2YXRlVGFza1ZpZXcoKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib3Blbi1jYWxlbmRhclwiLFxuICAgICAgbmFtZTogXCJPcGVuIGNhbGVuZGFyXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5hY3RpdmF0ZUNhbGVuZGFyVmlldygpLFxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJuZXctdGFza1wiLFxuICAgICAgbmFtZTogXCJOZXcgdGFza1wiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIl0sIGtleTogXCJuXCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5vcGVuVGFza0Zvcm0oKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibmV3LWV2ZW50XCIsXG4gICAgICBuYW1lOiBcIk5ldyBldmVudFwiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIm5cIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm9wZW5FdmVudE1vZGFsKCksXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IENocm9uaWNsZVNldHRpbmdzVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG4gICAgY29uc29sZS5sb2coXCJDaHJvbmljbGUgbG9hZGVkIFx1MjcxM1wiKTtcbiAgfVxuXG4gIGFzeW5jIGFjdGl2YXRlVGFza1ZpZXcoKSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGxldCBsZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShUQVNLX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKCFsZWFmKSB7XG4gICAgICBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IFRBU0tfVklFV19UWVBFLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgfVxuICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgYXN5bmMgYWN0aXZhdGVDYWxlbmRhclZpZXcoKSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGxldCBsZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShDQUxFTkRBUl9WSUVXX1RZUEUpWzBdO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBDQUxFTkRBUl9WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBhc3luYyBvcGVuVGFza0Zvcm0oKSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShUQVNLX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBpZiAoZXhpc3RpbmcpIGV4aXN0aW5nLmRldGFjaCgpO1xuICAgIGNvbnN0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IFRBU0tfRk9STV9WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIG9wZW5FdmVudE1vZGFsKGV2ZW50PzogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBuZXcgRXZlbnRNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy5ldmVudE1hbmFnZXIsXG4gICAgICB0aGlzLmNhbGVuZGFyTWFuYWdlcixcbiAgICAgIHRoaXMudGFza01hbmFnZXIsXG4gICAgICBldmVudCxcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgIChlKSA9PiB0aGlzLm9wZW5FdmVudEZ1bGxQYWdlKGUpXG4gICAgKS5vcGVuKCk7XG4gIH1cblxuICBvbnVubG9hZCgpIHtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFRBU0tfVklFV19UWVBFKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFRBU0tfRk9STV9WSUVXX1RZUEUpO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoQ0FMRU5EQVJfVklFV19UWVBFKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKEVWRU5UX0ZPUk1fVklFV19UWVBFKTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgICh0aGlzLmFwcC53b3Jrc3BhY2UgYXMgYW55KS50cmlnZ2VyKFwiY2hyb25pY2xlOnNldHRpbmdzLWNoYW5nZWRcIik7XG4gIH1cblxuICBhc3luYyBvcGVuRXZlbnRGdWxsUGFnZShldmVudD86IENocm9uaWNsZUV2ZW50KSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKGV4aXN0aW5nKSBleGlzdGluZy5kZXRhY2goKTtcbiAgICBjb25zdCBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBFVkVOVF9GT1JNX1ZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuXG4gICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMCkpO1xuICAgIGNvbnN0IGZvcm1MZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgY29uc3QgZm9ybVZpZXcgPSBmb3JtTGVhZj8udmlldyBhcyBFdmVudEZvcm1WaWV3IHwgdW5kZWZpbmVkO1xuICAgIGlmIChmb3JtVmlldyAmJiBldmVudCkgZm9ybVZpZXcubG9hZEV2ZW50KGV2ZW50KTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSBDaHJvbmljbGVQbHVnaW4gZnJvbSBcIi4uL21haW5cIjtcbmltcG9ydCB7IENhbGVuZGFyQ29sb3IsIENocm9uaWNsZUNhbGVuZGFyLCBDaHJvbmljbGVMaXN0LCBUYXNrU3RhdHVzLCBUYXNrUHJpb3JpdHksIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcblxuZXhwb3J0IGNsYXNzIENocm9uaWNsZVNldHRpbmdzVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHByaXZhdGUgcGx1Z2luOiBDaHJvbmljbGVQbHVnaW47XG4gIHByaXZhdGUgYWN0aXZlVGFiOiBzdHJpbmcgPSBcImdlbmVyYWxcIjtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBDaHJvbmljbGVQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5hZGRDbGFzcyhcImNocm9uaWNsZS1zZXR0aW5nc1wiKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBUYWIgYmFyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHRhYkJhciA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdihcImNocm9uaWNsZS10YWItYmFyXCIpO1xuICAgIGNvbnN0IHRhYnMgPSBbXG4gICAgICB7IGlkOiBcImdlbmVyYWxcIiwgICAgbGFiZWw6IFwiR2VuZXJhbFwiIH0sXG4gICAgICB7IGlkOiBcImNhbGVuZGFyXCIsICAgbGFiZWw6IFwiQ2FsZW5kYXJcIiB9LFxuICAgICAgeyBpZDogXCJyZW1pbmRlcnNcIiwgIGxhYmVsOiBcIlJlbWluZGVyc1wiIH0sXG4gICAgICB7IGlkOiBcImFwcGVhcmFuY2VcIiwgbGFiZWw6IFwiQXBwZWFyYW5jZVwiIH0sXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgdGFiIG9mIHRhYnMpIHtcbiAgICAgIGNvbnN0IHRhYkVsID0gdGFiQmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS10YWJcIik7XG4gICAgICB0YWJFbC5zZXRUZXh0KHRhYi5sYWJlbCk7XG4gICAgICBpZiAodGhpcy5hY3RpdmVUYWIgPT09IHRhYi5pZCkgdGFiRWwuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICB0YWJFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmFjdGl2ZVRhYiA9IHRhYi5pZDtcbiAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgVGFiIGNvbnRlbnQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgY29udGVudCA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdihcImNocm9uaWNsZS10YWItY29udGVudFwiKTtcblxuICAgIHN3aXRjaCAodGhpcy5hY3RpdmVUYWIpIHtcbiAgICAgIGNhc2UgXCJnZW5lcmFsXCI6ICAgIHRoaXMucmVuZGVyR2VuZXJhbChjb250ZW50KTsgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiY2FsZW5kYXJcIjogICB0aGlzLnJlbmRlckNhbGVuZGFyKGNvbnRlbnQpOyAgIGJyZWFrO1xuICAgICAgY2FzZSBcInJlbWluZGVyc1wiOiAgdGhpcy5yZW5kZXJSZW1pbmRlcnMoY29udGVudCk7ICBicmVhaztcbiAgICAgIGNhc2UgXCJhcHBlYXJhbmNlXCI6IHRoaXMucmVuZGVyQXBwZWFyYW5jZShjb250ZW50KTsgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEdlbmVyYWwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSByZW5kZXJHZW5lcmFsKGVsOiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMuc3ViSGVhZGVyKGVsLCBcIlN0b3JhZ2VcIik7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiVGFza3MgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIldoZXJlIHRhc2sgbm90ZXMgYXJlIHN0b3JlZCBpbiB5b3VyIHZhdWx0LlwiKVxuICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XG4gICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIkNocm9uaWNsZS9UYXNrc1wiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MudGFza3NGb2xkZXIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50YXNrc0ZvbGRlciA9IHZhbHVlIHx8IFwiQ2hyb25pY2xlL1Rhc2tzXCI7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkV2ZW50cyBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiV2hlcmUgZXZlbnQgbm90ZXMgYXJlIHN0b3JlZCBpbiB5b3VyIHZhdWx0LlwiKVxuICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XG4gICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIkNocm9uaWNsZS9FdmVudHNcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmV2ZW50c0ZvbGRlcilcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmV2ZW50c0ZvbGRlciA9IHZhbHVlIHx8IFwiQ2hyb25pY2xlL0V2ZW50c1wiO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJUaW1lIGZvcm1hdFwiKVxuICAgICAgLnNldERlc2MoXCJIb3cgdGltZXMgYXJlIGRpc3BsYXllZCB0aHJvdWdob3V0IENocm9uaWNsZS5cIilcbiAgICAgIC5hZGREcm9wZG93bihkcm9wID0+IGRyb3BcbiAgICAgICAgLmFkZE9wdGlvbihcIjEyaFwiLCBcIjEyLWhvdXIgKDI6MzAgUE0pXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCIyNGhcIiwgXCIyNC1ob3VyICgxNDozMClcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnRpbWVGb3JtYXQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50aW1lRm9ybWF0ID0gdmFsdWUgYXMgXCIxMmhcIiB8IFwiMjRoXCI7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgdGhpcy5kaXZpZGVyKGVsKTtcbiAgICB0aGlzLnN1YkhlYWRlcihlbCwgXCJOb3RpZmljYXRpb25zXCIpO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIm1hY09TIHN5c3RlbSBub3RpZmljYXRpb25cIilcbiAgICAgIC5zZXREZXNjKFwiU2hvdyBhIG5hdGl2ZSBtYWNPUyBub3RpZmljYXRpb24gYmFubmVyIHdoZW4gYW4gYWxlcnQgZmlyZXMuXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90aWZNYWNPUyA/PyB0cnVlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90aWZNYWNPUyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJPYnNpZGlhbiBpbi1hcHAgdG9hc3RcIilcbiAgICAgIC5zZXREZXNjKFwiU2hvdyBhIGJhbm5lciBpbnNpZGUgT2JzaWRpYW4gd2hlbiBhbiBhbGVydCBmaXJlcy5cIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3RpZk9ic2lkaWFuID8/IHRydWUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3RpZk9ic2lkaWFuID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIlNvdW5kXCIpXG4gICAgICAuc2V0RGVzYyhcIlBsYXkgYSBjaGltZSB3aGVuIGFuIGFsZXJ0IGZpcmVzLlwiKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+IHRcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGlmU291bmQgPz8gdHJ1ZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGlmU291bmQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiQWxlcnQgZm9yIGV2ZW50c1wiKVxuICAgICAgLnNldERlc2MoXCJFbmFibGUgYWxlcnRzIGZvciBjYWxlbmRhciBldmVudHMuXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90aWZFdmVudHMgPz8gdHJ1ZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGlmRXZlbnRzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkFsZXJ0IGZvciB0YXNrc1wiKVxuICAgICAgLnNldERlc2MoXCJFbmFibGUgYWxlcnRzIGZvciB0YXNrcyB3aXRoIGEgZHVlIHRpbWUuXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90aWZUYXNrcyA/PyB0cnVlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90aWZUYXNrcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJTZW5kIHRlc3Qgbm90aWZpY2F0aW9uXCIpXG4gICAgICAuc2V0RGVzYyhcIkZpcmVzIGEgdGVzdCBhbGVydCB1c2luZyB5b3VyIGN1cnJlbnQgc2V0dGluZ3MuXCIpXG4gICAgICAuYWRkQnV0dG9uKGJ0biA9PiBidG5cbiAgICAgICAgLnNldEJ1dHRvblRleHQoXCJUZXN0IG5vd1wiKVxuICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uYWxlcnRNYW5hZ2VyLmZpcmUoXG4gICAgICAgICAgICBcInNldHRpbmdzLXRlc3RcIixcbiAgICAgICAgICAgIFwiQ2hyb25pY2xlIHRlc3RcIixcbiAgICAgICAgICAgIFwiWW91ciBub3RpZmljYXRpb25zIGFyZSB3b3JraW5nLlwiLFxuICAgICAgICAgICAgXCJldmVudFwiXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5hbGVydE1hbmFnZXJbXCJmaXJlZEFsZXJ0c1wiXS5kZWxldGUoXCJzZXR0aW5ncy10ZXN0XCIpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBDYWxlbmRhciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHJlbmRlckNhbGVuZGFyKGVsOiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMuc3ViSGVhZGVyKGVsLCBcIkNhbGVuZGFyIGRlZmF1bHRzXCIpO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIlN0YXJ0IG9mIHdlZWtcIilcbiAgICAgIC5zZXREZXNjKFwiV2hpY2ggZGF5IHRoZSBjYWxlbmRhciB3ZWVrIHN0YXJ0cyBvbi5cIilcbiAgICAgIC5hZGREcm9wZG93bihkcm9wID0+IGRyb3BcbiAgICAgICAgLmFkZE9wdGlvbihcIjBcIiwgXCJTdW5kYXlcIilcbiAgICAgICAgLmFkZE9wdGlvbihcIjFcIiwgXCJNb25kYXlcIilcbiAgICAgICAgLmFkZE9wdGlvbihcIjZcIiwgXCJTYXR1cmRheVwiKVxuICAgICAgICAuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLnN0YXJ0T2ZXZWVrKSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN0YXJ0T2ZXZWVrID0gcGFyc2VJbnQodmFsdWUpIGFzIDAgfCAxIHwgNjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCB2aWV3XCIpXG4gICAgICAuc2V0RGVzYyhcIldoaWNoIHZpZXcgb3BlbnMgd2hlbiB5b3UgbGF1bmNoIHRoZSBjYWxlbmRhci5cIilcbiAgICAgIC5hZGREcm9wZG93bihkcm9wID0+IGRyb3BcbiAgICAgICAgLmFkZE9wdGlvbihcImRheVwiLCAgIFwiRGF5XCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJ3ZWVrXCIsICBcIldlZWtcIilcbiAgICAgICAgLmFkZE9wdGlvbihcIm1vbnRoXCIsIFwiTW9udGhcIilcbiAgICAgICAgLmFkZE9wdGlvbihcInllYXJcIiwgIFwiWWVhclwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdENhbGVuZGFyVmlldylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRDYWxlbmRhclZpZXcgPSB2YWx1ZSBhcyBcImRheVwifFwid2Vla1wifFwibW9udGhcInxcInllYXJcIjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCBjYWxlbmRhclwiKVxuICAgICAgLnNldERlc2MoXCJDYWxlbmRhciBhc3NpZ25lZCB0byBuZXcgZXZlbnRzIGJ5IGRlZmF1bHQuXCIpXG4gICAgICAuYWRkRHJvcGRvd24oZHJvcCA9PiB7XG4gICAgICAgIGRyb3AuYWRkT3B0aW9uKFwiXCIsIFwiTm9uZVwiKTtcbiAgICAgICAgZm9yIChjb25zdCBjYWwgb2YgdGhpcy5wbHVnaW4uY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpKSB7XG4gICAgICAgICAgZHJvcC5hZGRPcHRpb24oY2FsLmlkLCBjYWwubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZHJvcC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Q2FsZW5kYXJJZCA/PyBcIlwiKTtcbiAgICAgICAgZHJvcC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Q2FsZW5kYXJJZCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgZXZlbnQgZHVyYXRpb25cIilcbiAgICAgIC5zZXREZXNjKFwiSG93IGxvbmcgbmV3IGV2ZW50cyBsYXN0IGJ5IGRlZmF1bHQgKG1pbnV0ZXMpLlwiKVxuICAgICAgLmFkZFNsaWRlcihzbGlkZXIgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMTUsIDQ4MCwgMTUpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0RXZlbnREdXJhdGlvbiA/PyA2MClcbiAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRFdmVudER1cmF0aW9uID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgZXZlbnQgYWxlcnRcIilcbiAgICAgIC5zZXREZXNjKFwiQWxlcnQgb2Zmc2V0IGFwcGxpZWQgdG8gbmV3IGV2ZW50cyBieSBkZWZhdWx0LlwiKVxuICAgICAgLmFkZERyb3Bkb3duKGRyb3AgPT4gdGhpcy5hZGRBbGVydE9wdGlvbnMoZHJvcClcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRBbGVydClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRBbGVydCA9IHZhbHVlIGFzIEFsZXJ0T2Zmc2V0O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIHRoaXMuZGl2aWRlcihlbCk7XG4gICAgdGhpcy5zdWJIZWFkZXIoZWwsIFwiTXkgQ2FsZW5kYXJzXCIpO1xuICAgIGVsLmNyZWF0ZURpdihcImNzLWRlc2NcIikuc2V0VGV4dChcIkFkZCwgcmVuYW1lLCByZWNvbG9yLCBvciBkZWxldGUgY2FsZW5kYXJzLlwiKTtcblxuICAgIGZvciAoY29uc3QgY2FsIG9mIHRoaXMucGx1Z2luLmNhbGVuZGFyTWFuYWdlci5nZXRBbGwoKSkge1xuICAgICAgdGhpcy5yZW5kZXJDYWxlbmRhclJvdyhlbCwgY2FsLCB0aGlzLnBsdWdpbi5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCkubGVuZ3RoID09PSAxKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpdmlkZXIoZWwpO1xuXG4gICAgY29uc3QgYWRkUm93ID0gZWwuY3JlYXRlRGl2KFwiY3MtYWRkLXJvd1wiKTtcbiAgICBjb25zdCBuYW1lSW5wdXQgPSBhZGRSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIGNsczogXCJjcy10ZXh0LWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJOZXcgY2FsZW5kYXIgbmFtZVwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY29sb3JTZWxlY3QgPSBhZGRSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY29sb3JcIiwgY2xzOiBcImNzLWNvbG9yLXBpY2tlclwiIH0pO1xuICAgIGNvbG9yU2VsZWN0LnZhbHVlID0gXCIjMzc4QUREXCI7XG5cbiAgICBjb25zdCBhZGRCdG4gPSBhZGRSb3cuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY3MtYnRuLXByaW1hcnlcIiwgdGV4dDogXCJBZGQgY2FsZW5kYXJcIiB9KTtcbiAgICBhZGRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBuYW1lSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCFuYW1lKSB7IG5hbWVJbnB1dC5mb2N1cygpOyByZXR1cm47IH1cbiAgICAgIHRoaXMucGx1Z2luLmNhbGVuZGFyTWFuYWdlci5jcmVhdGUobmFtZSwgY29sb3JTZWxlY3QudmFsdWUgYXMgQ2FsZW5kYXJDb2xvcik7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgIG5ldyBOb3RpY2UoYENhbGVuZGFyIFwiJHtuYW1lfVwiIGNyZWF0ZWRgKTtcbiAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJDYWxlbmRhclJvdyhlbDogSFRNTEVsZW1lbnQsIGNhbDogQ2hyb25pY2xlQ2FsZW5kYXIsIGlzT25seTogYm9vbGVhbikge1xuICAgIGNvbnN0IHNldHRpbmcgPSBuZXcgU2V0dGluZyhlbCk7XG5cbiAgICAvLyBDb2xvciBkb3QgcHJldmlld1xuICAgIGNvbnN0IGRvdCA9IHNldHRpbmcubmFtZUVsLmNyZWF0ZURpdihcImNzLWNhbC1kb3RcIik7XG4gICAgZG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcik7XG4gICAgc2V0dGluZy5uYW1lRWwuY3JlYXRlU3Bhbih7IHRleHQ6IGNhbC5uYW1lIH0pO1xuXG4gICAgc2V0dGluZ1xuICAgICAgLmFkZENvbG9yUGlja2VyKHBpY2tlciA9PiB7XG4gICAgICAgIC8vIENvbnZlcnQgbmFtZWQgY29sb3JzIHRvIGhleCBmb3IgdGhlIHBpY2tlclxuICAgICAgICBwaWNrZXIuc2V0VmFsdWUoQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSk7XG4gICAgICAgIHBpY2tlci5vbkNoYW5nZShhc3luYyAoaGV4KSA9PiB7XG4gICAgICAgICAgZG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGhleDtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5jYWxlbmRhck1hbmFnZXIudXBkYXRlKGNhbC5pZCwgeyBjb2xvcjogaGV4IH0pO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAuYWRkVGV4dCh0ZXh0ID0+IHRleHRcbiAgICAgICAgLnNldFZhbHVlKGNhbC5uYW1lKVxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJDYWxlbmRhciBuYW1lXCIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBpZiAoIXZhbHVlLnRyaW0oKSkgcmV0dXJuO1xuICAgICAgICAgIHRoaXMucGx1Z2luLmNhbGVuZGFyTWFuYWdlci51cGRhdGUoY2FsLmlkLCB7IG5hbWU6IHZhbHVlLnRyaW0oKSB9KTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUoY2FsLmlzVmlzaWJsZSlcbiAgICAgICAgLnNldFRvb2x0aXAoXCJTaG93IGluIHZpZXdzXCIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5jYWxlbmRhck1hbmFnZXIudXBkYXRlKGNhbC5pZCwgeyBpc1Zpc2libGU6IHZhbHVlIH0pO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbihidG4gPT4gYnRuXG4gICAgICAgIC5zZXRJY29uKFwidHJhc2hcIilcbiAgICAgICAgLnNldFRvb2x0aXAoXCJEZWxldGUgY2FsZW5kYXJcIilcbiAgICAgICAgLnNldERpc2FibGVkKGlzT25seSlcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLmNhbGVuZGFyTWFuYWdlci5kZWxldGUoY2FsLmlkKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICBuZXcgTm90aWNlKGBDYWxlbmRhciBcIiR7Y2FsLm5hbWV9XCIgZGVsZXRlZGApO1xuICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTGlzdFJvdyhlbDogSFRNTEVsZW1lbnQsIGxpc3Q6IENocm9uaWNsZUxpc3QsIGlzT25seTogYm9vbGVhbikge1xuICAgIGNvbnN0IHNldHRpbmcgPSBuZXcgU2V0dGluZyhlbCk7XG5cbiAgICBjb25zdCBkb3QgPSBzZXR0aW5nLm5hbWVFbC5jcmVhdGVEaXYoXCJjcy1jYWwtZG90XCIpO1xuICAgIGRvdC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBsaXN0LmNvbG9yO1xuICAgIHNldHRpbmcubmFtZUVsLmNyZWF0ZVNwYW4oeyB0ZXh0OiBsaXN0Lm5hbWUgfSk7XG5cbiAgICBzZXR0aW5nXG4gICAgICAuYWRkQ29sb3JQaWNrZXIocGlja2VyID0+IHtcbiAgICAgICAgcGlja2VyLnNldFZhbHVlKGxpc3QuY29sb3IpO1xuICAgICAgICBwaWNrZXIub25DaGFuZ2UoYXN5bmMgKGhleCkgPT4ge1xuICAgICAgICAgIGRvdC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBoZXg7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ubGlzdE1hbmFnZXIudXBkYXRlKGxpc3QuaWQsIHsgY29sb3I6IGhleCB9KTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XG4gICAgICAgIC5zZXRWYWx1ZShsaXN0Lm5hbWUpXG4gICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIkxpc3QgbmFtZVwiKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHJldHVybjtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5saXN0TWFuYWdlci51cGRhdGUobGlzdC5pZCwgeyBuYW1lOiB2YWx1ZS50cmltKCkgfSk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKGJ0biA9PiBidG5cbiAgICAgICAgLnNldEljb24oXCJ0cmFzaFwiKVxuICAgICAgICAuc2V0VG9vbHRpcChcIkRlbGV0ZSBsaXN0XCIpXG4gICAgICAgIC5zZXREaXNhYmxlZChpc09ubHkpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5saXN0TWFuYWdlci5kZWxldGUobGlzdC5pZCk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgbmV3IE5vdGljZShgTGlzdCBcIiR7bGlzdC5uYW1lfVwiIGRlbGV0ZWRgKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgUmVtaW5kZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyUmVtaW5kZXJzKGVsOiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMuc3ViSGVhZGVyKGVsLCBcIlRhc2sgZGVmYXVsdHNcIik7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCBzdGF0dXNcIilcbiAgICAgIC5hZGREcm9wZG93bihkcm9wID0+IGRyb3BcbiAgICAgICAgLmFkZE9wdGlvbihcInRvZG9cIiwgICAgICAgIFwiVG8gZG9cIilcbiAgICAgICAgLmFkZE9wdGlvbihcImluLXByb2dyZXNzXCIsIFwiSW4gcHJvZ3Jlc3NcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImRvbmVcIiwgICAgICAgIFwiRG9uZVwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiY2FuY2VsbGVkXCIsICAgXCJDYW5jZWxsZWRcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUYXNrU3RhdHVzKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRhc2tTdGF0dXMgPSB2YWx1ZSBhcyBUYXNrU3RhdHVzO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJEZWZhdWx0IHByaW9yaXR5XCIpXG4gICAgICAuYWRkRHJvcGRvd24oZHJvcCA9PiBkcm9wXG4gICAgICAgIC5hZGRPcHRpb24oXCJub25lXCIsICAgXCJOb25lXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJsb3dcIiwgICAgXCJMb3dcIilcbiAgICAgICAgLmFkZE9wdGlvbihcIm1lZGl1bVwiLCBcIk1lZGl1bVwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiaGlnaFwiLCAgIFwiSGlnaFwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRhc2tQcmlvcml0eSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUYXNrUHJpb3JpdHkgPSB2YWx1ZSBhcyBUYXNrUHJpb3JpdHk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgYWxlcnRcIilcbiAgICAgIC5zZXREZXNjKFwiQWxlcnQgb2Zmc2V0IGFwcGxpZWQgdG8gbmV3IHRhc2tzIGJ5IGRlZmF1bHQuXCIpXG4gICAgICAuYWRkRHJvcGRvd24oZHJvcCA9PiB0aGlzLmFkZEFsZXJ0T3B0aW9ucyhkcm9wKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdEFsZXJ0KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdEFsZXJ0ID0gdmFsdWUgYXMgQWxlcnRPZmZzZXQ7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgbGlzdFwiKVxuICAgICAgLnNldERlc2MoXCJMaXN0IGFzc2lnbmVkIHRvIG5ldyB0YXNrcyBieSBkZWZhdWx0LlwiKVxuICAgICAgLmFkZERyb3Bkb3duKGRyb3AgPT4ge1xuICAgICAgICBkcm9wLmFkZE9wdGlvbihcIlwiLCBcIk5vbmVcIik7XG4gICAgICAgIGZvciAoY29uc3QgbGlzdCBvZiB0aGlzLnBsdWdpbi5saXN0TWFuYWdlci5nZXRBbGwoKSkge1xuICAgICAgICAgIGRyb3AuYWRkT3B0aW9uKGxpc3QuaWQsIGxpc3QubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZHJvcC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0TGlzdElkID8/IFwiXCIpO1xuICAgICAgICBkcm9wLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRMaXN0SWQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIHRoaXMuZGl2aWRlcihlbCk7XG4gICAgdGhpcy5zdWJIZWFkZXIoZWwsIFwiTXkgTGlzdHNcIik7XG4gICAgZWwuY3JlYXRlRGl2KFwiY3MtZGVzY1wiKS5zZXRUZXh0KFwiQWRkLCByZW5hbWUsIHJlY29sb3IsIG9yIGRlbGV0ZSBsaXN0cy5cIik7XG5cbiAgICBmb3IgKGNvbnN0IGxpc3Qgb2YgdGhpcy5wbHVnaW4ubGlzdE1hbmFnZXIuZ2V0QWxsKCkpIHtcbiAgICAgIHRoaXMucmVuZGVyTGlzdFJvdyhlbCwgbGlzdCwgdGhpcy5wbHVnaW4ubGlzdE1hbmFnZXIuZ2V0QWxsKCkubGVuZ3RoID09PSAxKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpdmlkZXIoZWwpO1xuXG4gICAgY29uc3QgYWRkTGlzdFJvdyA9IGVsLmNyZWF0ZURpdihcImNzLWFkZC1yb3dcIik7XG4gICAgY29uc3QgbGlzdE5hbWVJbnB1dCA9IGFkZExpc3RSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIGNsczogXCJjcy10ZXh0LWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJOZXcgbGlzdCBuYW1lXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0Q29sb3JQaWNrZXIgPSBhZGRMaXN0Um93LmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNvbG9yXCIsIGNsczogXCJjcy1jb2xvci1waWNrZXJcIiB9KTtcbiAgICBsaXN0Q29sb3JQaWNrZXIudmFsdWUgPSBcIiMzNzhBRERcIjtcblxuICAgIGNvbnN0IGFkZExpc3RCdG4gPSBhZGRMaXN0Um93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNzLWJ0bi1wcmltYXJ5XCIsIHRleHQ6IFwiQWRkIGxpc3RcIiB9KTtcbiAgICBhZGRMaXN0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBuYW1lID0gbGlzdE5hbWVJbnB1dC52YWx1ZS50cmltKCk7XG4gICAgICBpZiAoIW5hbWUpIHsgbGlzdE5hbWVJbnB1dC5mb2N1cygpOyByZXR1cm47IH1cbiAgICAgIHRoaXMucGx1Z2luLmxpc3RNYW5hZ2VyLmNyZWF0ZShuYW1lLCBsaXN0Q29sb3JQaWNrZXIudmFsdWUpO1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICBuZXcgTm90aWNlKGBMaXN0IFwiJHtuYW1lfVwiIGNyZWF0ZWRgKTtcbiAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5kaXZpZGVyKGVsKTtcbiAgICB0aGlzLnN1YkhlYWRlcihlbCwgXCJTbWFydCBsaXN0IHZpc2liaWxpdHlcIik7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBUb2RheSBjb3VudFwiKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+IHRcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUb2RheUNvdW50KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1RvZGF5Q291bnQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBTY2hlZHVsZWQgY291bnRcIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93U2NoZWR1bGVkQ291bnQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93U2NoZWR1bGVkQ291bnQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBGbGFnZ2VkIGNvdW50XCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd0ZsYWdnZWRDb3VudClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dGbGFnZ2VkQ291bnQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgQXBwZWFyYW5jZSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHJlbmRlckFwcGVhcmFuY2UoZWw6IEhUTUxFbGVtZW50KSB7XG4gICAgdGhpcy5zdWJIZWFkZXIoZWwsIFwiTGF5b3V0XCIpO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIlRhc2sgbGlzdCBkZW5zaXR5XCIpXG4gICAgICAuc2V0RGVzYyhcIkNvbWZvcnRhYmxlIGFkZHMgbW9yZSBwYWRkaW5nIGJldHdlZW4gdGFzayByb3dzLlwiKVxuICAgICAgLmFkZERyb3Bkb3duKGRyb3AgPT4gZHJvcFxuICAgICAgICAuYWRkT3B0aW9uKFwiY29tcGFjdFwiLCAgICAgXCJDb21wYWN0XCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJjb21mb3J0YWJsZVwiLCBcIkNvbWZvcnRhYmxlXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZW5zaXR5ID8/IFwiY29tZm9ydGFibGVcIilcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlbnNpdHkgPSB2YWx1ZSBhcyBcImNvbXBhY3RcIiB8IFwiY29tZm9ydGFibGVcIjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBjb21wbGV0ZWQgY291bnRcIilcbiAgICAgIC5zZXREZXNjKFwiU2hvdyB0aGUgbnVtYmVyIG9mIGNvbXBsZXRlZCB0YXNrcyBuZXh0IHRvIHRoZSBDb21wbGV0ZWQgZW50cnkuXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd0NvbXBsZXRlZENvdW50ID8/IHRydWUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93Q29tcGxldGVkQ291bnQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyB0YXNrIGNvdW50IHN1YnRpdGxlXCIpXG4gICAgICAuc2V0RGVzYyhcIlNob3cgJzMgdGFza3MnIHVuZGVyIHRoZSBsaXN0IHRpdGxlIGluIHRoZSBtYWluIHBhbmVsLlwiKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+IHRcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUYXNrQ291bnRTdWJ0aXRsZSA/PyB0cnVlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1Rhc2tDb3VudFN1YnRpdGxlID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEhlbHBlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSBzdWJIZWFkZXIoZWw6IEhUTUxFbGVtZW50LCB0aXRsZTogc3RyaW5nKSB7XG4gICAgZWwuY3JlYXRlRGl2KFwiY3Mtc3ViLWhlYWRlclwiKS5zZXRUZXh0KHRpdGxlKTtcbiAgfVxuXG4gIHByaXZhdGUgZGl2aWRlcihlbDogSFRNTEVsZW1lbnQpIHtcbiAgICBlbC5jcmVhdGVEaXYoXCJjcy1kaXZpZGVyXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRBbGVydE9wdGlvbnMoZHJvcDogYW55KSB7XG4gICAgcmV0dXJuIGRyb3BcbiAgICAgIC5hZGRPcHRpb24oXCJub25lXCIsICAgIFwiTm9uZVwiKVxuICAgICAgLmFkZE9wdGlvbihcImF0LXRpbWVcIiwgXCJBdCB0aW1lXCIpXG4gICAgICAuYWRkT3B0aW9uKFwiNW1pblwiLCAgICBcIjUgbWludXRlcyBiZWZvcmVcIilcbiAgICAgIC5hZGRPcHRpb24oXCIxMG1pblwiLCAgIFwiMTAgbWludXRlcyBiZWZvcmVcIilcbiAgICAgIC5hZGRPcHRpb24oXCIxNW1pblwiLCAgIFwiMTUgbWludXRlcyBiZWZvcmVcIilcbiAgICAgIC5hZGRPcHRpb24oXCIzMG1pblwiLCAgIFwiMzAgbWludXRlcyBiZWZvcmVcIilcbiAgICAgIC5hZGRPcHRpb24oXCIxaG91clwiLCAgIFwiMSBob3VyIGJlZm9yZVwiKVxuICAgICAgLmFkZE9wdGlvbihcIjJob3Vyc1wiLCAgXCIyIGhvdXJzIGJlZm9yZVwiKVxuICAgICAgLmFkZE9wdGlvbihcIjFkYXlcIiwgICAgXCIxIGRheSBiZWZvcmVcIilcbiAgICAgIC5hZGRPcHRpb24oXCIyZGF5c1wiLCAgIFwiMiBkYXlzIGJlZm9yZVwiKVxuICAgICAgLmFkZE9wdGlvbihcIjF3ZWVrXCIsICAgXCIxIHdlZWsgYmVmb3JlXCIpO1xuICB9XG59IiwgImltcG9ydCB7IENocm9uaWNsZUNhbGVuZGFyLCBDYWxlbmRhckNvbG9yIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBDYWxlbmRhck1hbmFnZXIge1xuICBwcml2YXRlIGNhbGVuZGFyczogQ2hyb25pY2xlQ2FsZW5kYXJbXTtcbiAgcHJpdmF0ZSBvblVwZGF0ZTogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW10sIG9uVXBkYXRlOiAoKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5jYWxlbmRhcnMgPSBjYWxlbmRhcnM7XG4gICAgdGhpcy5vblVwZGF0ZSA9IG9uVXBkYXRlO1xuICB9XG5cbiAgZ2V0QWxsKCk6IENocm9uaWNsZUNhbGVuZGFyW10ge1xuICAgIHJldHVybiBbLi4udGhpcy5jYWxlbmRhcnNdO1xuICB9XG5cbiAgZ2V0QnlJZChpZDogc3RyaW5nKTogQ2hyb25pY2xlQ2FsZW5kYXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNhbGVuZGFycy5maW5kKChjKSA9PiBjLmlkID09PSBpZCk7XG4gIH1cblxuICBjcmVhdGUobmFtZTogc3RyaW5nLCBjb2xvcjogQ2FsZW5kYXJDb2xvcik6IENocm9uaWNsZUNhbGVuZGFyIHtcbiAgICBjb25zdCBjYWxlbmRhcjogQ2hyb25pY2xlQ2FsZW5kYXIgPSB7XG4gICAgICBpZDogdGhpcy5nZW5lcmF0ZUlkKG5hbWUpLFxuICAgICAgbmFtZSxcbiAgICAgIGNvbG9yLFxuICAgICAgaXNWaXNpYmxlOiB0cnVlLFxuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcbiAgICB0aGlzLmNhbGVuZGFycy5wdXNoKGNhbGVuZGFyKTtcbiAgICB0aGlzLm9uVXBkYXRlKCk7XG4gICAgcmV0dXJuIGNhbGVuZGFyO1xuICB9XG5cbiAgdXBkYXRlKGlkOiBzdHJpbmcsIGNoYW5nZXM6IFBhcnRpYWw8Q2hyb25pY2xlQ2FsZW5kYXI+KTogdm9pZCB7XG4gICAgY29uc3QgaWR4ID0gdGhpcy5jYWxlbmRhcnMuZmluZEluZGV4KChjKSA9PiBjLmlkID09PSBpZCk7XG4gICAgaWYgKGlkeCA9PT0gLTEpIHJldHVybjtcbiAgICB0aGlzLmNhbGVuZGFyc1tpZHhdID0geyAuLi50aGlzLmNhbGVuZGFyc1tpZHhdLCAuLi5jaGFuZ2VzIH07XG4gICAgdGhpcy5vblVwZGF0ZSgpO1xuICB9XG5cbiAgZGVsZXRlKGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLmNhbGVuZGFycy5maW5kSW5kZXgoKGMpID0+IGMuaWQgPT09IGlkKTtcbiAgICBpZiAoaWR4ICE9PSAtMSkgdGhpcy5jYWxlbmRhcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgdGhpcy5vblVwZGF0ZSgpO1xuICB9XG5cbiAgdG9nZ2xlVmlzaWJpbGl0eShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhcnMuZmluZCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICAgIGlmIChjYWwpIHtcbiAgICAgIGNhbC5pc1Zpc2libGUgPSAhY2FsLmlzVmlzaWJsZTtcbiAgICAgIHRoaXMub25VcGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZXR1cm5zIENTUyBoZXggY29sb3IgZm9yIGEgQ2FsZW5kYXJDb2xvciBuYW1lXG4gIHN0YXRpYyBjb2xvclRvSGV4KGNvbG9yOiBDYWxlbmRhckNvbG9yKTogc3RyaW5nIHtcbiAgICAvLyBJZiBhbHJlYWR5IGEgaGV4IHZhbHVlLCByZXR1cm4gaXQgZGlyZWN0bHlcbiAgICBpZiAoY29sb3Iuc3RhcnRzV2l0aChcIiNcIikpIHJldHVybiBjb2xvcjtcblxuICAgIC8vIExlZ2FjeSBuYW1lZCBjb2xvciBtYXBcbiAgICBjb25zdCBtYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICBibHVlOiAgIFwiIzM3OEFERFwiLFxuICAgICAgZ3JlZW46ICBcIiMzNEM3NTlcIixcbiAgICAgIHB1cnBsZTogXCIjQUY1MkRFXCIsXG4gICAgICBvcmFuZ2U6IFwiI0ZGOTUwMFwiLFxuICAgICAgcmVkOiAgICBcIiNGRjNCMzBcIixcbiAgICAgIHRlYWw6ICAgXCIjMzBCMEM3XCIsXG4gICAgICBwaW5rOiAgIFwiI0ZGMkQ1NVwiLFxuICAgICAgeWVsbG93OiBcIiNGRkQ2MEFcIixcbiAgICAgIGdyYXk6ICAgXCIjOEU4RTkzXCIsXG4gICAgfTtcbiAgICByZXR1cm4gbWFwW2NvbG9yXSA/PyBcIiMzNzhBRERcIjtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVJZChuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJhc2UgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCBcIi1cIikucmVwbGFjZSgvW15hLXowLTktXS9nLCBcIlwiKTtcbiAgICBjb25zdCBzdWZmaXggPSBEYXRlLm5vdygpLnRvU3RyaW5nKDM2KTtcbiAgICByZXR1cm4gYCR7YmFzZX0tJHtzdWZmaXh9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFRhc2tNYW5hZ2VyIH0gZnJvbSBcIi4vVGFza01hbmFnZXJcIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuL0V2ZW50TWFuYWdlclwiO1xuaW1wb3J0IHsgQWxlcnRPZmZzZXQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIEFsZXJ0TWFuYWdlciB7XG4gIHByaXZhdGUgZ2V0U2V0dGluZ3M6ICgpID0+IGltcG9ydChcIi4uL3R5cGVzXCIpLkNocm9uaWNsZVNldHRpbmdzO1xuICBwcml2YXRlIGFwcDogICAgICAgICAgQXBwO1xuICBwcml2YXRlIHRhc2tNYW5hZ2VyOiAgVGFza01hbmFnZXI7XG4gIHByaXZhdGUgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXI7XG4gIHByaXZhdGUgaW50ZXJ2YWxJZDogICBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBmaXJlZEFsZXJ0czogIFNldDxzdHJpbmc+ICAgPSBuZXcgU2V0KCk7XG4gIHByaXZhdGUgYXVkaW9DdHg6ICAgICBBdWRpb0NvbnRleHQgfCBudWxsID0gbnVsbDtcblxuICAvLyBTdG9yZSBoYW5kbGVyIHJlZmVyZW5jZXMgc28gd2UgY2FuIHJlbW92ZSB0aGVtIGluIHN0b3AoKVxuICBwcml2YXRlIG9uQ2hhbmdlZDogKChmaWxlOiBURmlsZSkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBvbkNyZWF0ZTogICgoZmlsZTogYW55KSAgID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlciwgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXIsIGdldFNldHRpbmdzOiAoKSA9PiBpbXBvcnQoXCIuLi90eXBlc1wiKS5DaHJvbmljbGVTZXR0aW5ncykge1xuICAgIHRoaXMuYXBwICAgICAgICAgID0gYXBwO1xuICAgIHRoaXMudGFza01hbmFnZXIgID0gdGFza01hbmFnZXI7XG4gICAgdGhpcy5ldmVudE1hbmFnZXIgPSBldmVudE1hbmFnZXI7XG4gICAgdGhpcy5nZXRTZXR0aW5ncyAgPSBnZXRTZXR0aW5ncztcbiAgfVxuXG4gIHN0YXJ0KCkge1xuICAgIC8vIFJlcXVlc3QgcGVybWlzc2lvbiBpbmxpbmVcbiAgICBpZiAoXCJOb3RpZmljYXRpb25cIiBpbiB3aW5kb3cgJiYgTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZGVmYXVsdFwiKSB7XG4gICAgICBOb3RpZmljYXRpb24ucmVxdWVzdFBlcm1pc3Npb24oKTtcbiAgICB9XG5cbiAgICAvLyBEZWxheSBmaXJzdCBjaGVjayB0byBsZXQgdmF1bHQgZmluaXNoIGxvYWRpbmdcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiW0Nocm9uaWNsZV0gQWxlcnRNYW5hZ2VyIHJlYWR5LCBzdGFydGluZyBwb2xsXCIpO1xuICAgICAgdGhpcy5jaGVjaygpO1xuICAgICAgdGhpcy5pbnRlcnZhbElkID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHRoaXMuY2hlY2soKSwgMzAgKiAxMDAwKTtcbiAgICB9LCAzMDAwKTtcblxuICAgIC8vIFJlLWNoZWNrIHdoZW4gZmlsZXMgY2hhbmdlIFx1MjAxNCBzdG9yZSByZWZzIHNvIHdlIGNhbiByZW1vdmUgdGhlbVxuICAgIHRoaXMub25DaGFuZ2VkID0gKGZpbGU6IFRGaWxlKSA9PiB7XG4gICAgICBjb25zdCBpbkV2ZW50cyA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMuZXZlbnRNYW5hZ2VyW1wiZXZlbnRzRm9sZGVyXCJdKTtcbiAgICAgIGNvbnN0IGluVGFza3MgID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKTtcbiAgICAgIGlmIChpbkV2ZW50cyB8fCBpblRhc2tzKSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuY2hlY2soKSwgMzAwKTtcbiAgICB9O1xuXG4gICAgdGhpcy5vbkNyZWF0ZSA9IChmaWxlOiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IGluRXZlbnRzID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5ldmVudE1hbmFnZXJbXCJldmVudHNGb2xkZXJcIl0pO1xuICAgICAgY29uc3QgaW5UYXNrcyAgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLnRhc2tNYW5hZ2VyW1widGFza3NGb2xkZXJcIl0pO1xuICAgICAgaWYgKGluRXZlbnRzIHx8IGluVGFza3MpIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5jaGVjaygpLCA1MDApO1xuICAgIH07XG5cbiAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCB0aGlzLm9uQ2hhbmdlZCk7XG4gICAgdGhpcy5hcHAudmF1bHQub24oXCJjcmVhdGVcIiwgdGhpcy5vbkNyZWF0ZSk7XG4gIH1cblxuICBzdG9wKCkge1xuICAgIGlmICh0aGlzLmludGVydmFsSWQgIT09IG51bGwpIHtcbiAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWxJZCk7XG4gICAgICB0aGlzLmludGVydmFsSWQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy5vbkNoYW5nZWQpIHtcbiAgICAgIHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUub2ZmKFwiY2hhbmdlZFwiLCB0aGlzLm9uQ2hhbmdlZCk7XG4gICAgICB0aGlzLm9uQ2hhbmdlZCA9IG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLm9uQ3JlYXRlKSB7XG4gICAgICB0aGlzLmFwcC52YXVsdC5vZmYoXCJjcmVhdGVcIiwgdGhpcy5vbkNyZWF0ZSk7XG4gICAgICB0aGlzLm9uQ3JlYXRlID0gbnVsbDtcbiAgICB9XG4gICAgY29uc29sZS5sb2coXCJbQ2hyb25pY2xlXSBBbGVydE1hbmFnZXIgc3RvcHBlZFwiKTtcbiAgfVxuXG4gIGFzeW5jIGNoZWNrKCkge1xuICAgIGNvbnN0IG5vdyAgICAgID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBub3dNcyAgICA9IG5vdy5nZXRUaW1lKCk7XG4gICAgY29uc3Qgd2luZG93TXMgPSA1ICogNjAgKiAxMDAwO1xuXG4gICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIEFsZXJ0IGNoZWNrIGF0ICR7bm93LnRvTG9jYWxlVGltZVN0cmluZygpfWApO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIENoZWNrIGV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBldmVudHMgPSBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci5nZXRBbGwoKTtcbiAgICBjb25zb2xlLmxvZyhgW0Nocm9uaWNsZV0gQ2hlY2tpbmcgJHtldmVudHMubGVuZ3RofSBldmVudHNgKTtcblxuICAgIGlmICghKHRoaXMuZ2V0U2V0dGluZ3MoKS5ub3RpZkV2ZW50cyA/PyB0cnVlKSkgcmV0dXJuO1xuICAgIGZvciAoY29uc3QgZXZlbnQgb2YgZXZlbnRzKSB7XG4gICAgICBpZiAoIWV2ZW50LmFsZXJ0IHx8IGV2ZW50LmFsZXJ0ID09PSBcIm5vbmVcIikgY29udGludWU7XG4gICAgICBpZiAoIWV2ZW50LnN0YXJ0RGF0ZSB8fCAhZXZlbnQuc3RhcnRUaW1lKSAgIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBhbGVydEtleSA9IGBldmVudC0ke2V2ZW50LmlkfS0ke2V2ZW50LnN0YXJ0RGF0ZX0tJHtldmVudC5hbGVydH1gO1xuICAgICAgaWYgKHRoaXMuZmlyZWRBbGVydHMuaGFzKGFsZXJ0S2V5KSkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IHN0YXJ0TXMgPSBuZXcgRGF0ZShgJHtldmVudC5zdGFydERhdGV9VCR7ZXZlbnQuc3RhcnRUaW1lfWApLmdldFRpbWUoKTtcbiAgICAgIGNvbnN0IGFsZXJ0TXMgPSBzdGFydE1zIC0gdGhpcy5vZmZzZXRUb01zKGV2ZW50LmFsZXJ0KTtcblxuICAgICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIEV2ZW50IFwiJHtldmVudC50aXRsZX1cIiBmaXJlcyBhdCAke25ldyBEYXRlKGFsZXJ0TXMpLnRvTG9jYWxlVGltZVN0cmluZygpfSAoJHtNYXRoLnJvdW5kKChhbGVydE1zIC0gbm93TXMpLzEwMDApfXMpYCk7XG5cbiAgICAgIGlmIChub3dNcyA+PSBhbGVydE1zICYmIG5vd01zIDwgYWxlcnRNcyArIHdpbmRvd01zKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbQ2hyb25pY2xlXSBGSVJJTkcgYWxlcnQgZm9yIGV2ZW50IFwiJHtldmVudC50aXRsZX1cImApO1xuICAgICAgICB0aGlzLmZpcmUoYWxlcnRLZXksIGV2ZW50LnRpdGxlLCB0aGlzLmJ1aWxkRXZlbnRCb2R5KGV2ZW50LnN0YXJ0VGltZSwgZXZlbnQuYWxlcnQpLCBcImV2ZW50XCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBDaGVjayB0YXNrcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB0YXNrcyA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0QWxsKCk7XG4gICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIENoZWNraW5nICR7dGFza3MubGVuZ3RofSB0YXNrc2ApO1xuXG4gICAgZm9yIChjb25zdCB0YXNrIG9mIHRhc2tzKSB7XG4gICAgICBpZiAoIXRhc2suYWxlcnQgfHwgdGFzay5hbGVydCA9PT0gXCJub25lXCIpICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICBpZiAoIXRhc2suZHVlRGF0ZSAmJiAhdGFzay5kdWVUaW1lKSAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgaWYgKHRhc2suc3RhdHVzID09PSBcImRvbmVcIiB8fCB0YXNrLnN0YXR1cyA9PT0gXCJjYW5jZWxsZWRcIikgY29udGludWU7XG5cbiAgICAgIGNvbnN0IHRvZGF5U3RyID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICAgIGNvbnN0IGRhdGVTdHIgID0gdGFzay5kdWVEYXRlID8/IHRvZGF5U3RyO1xuICAgICAgY29uc3QgYWxlcnRLZXkgPSBgdGFzay0ke3Rhc2suaWR9LSR7ZGF0ZVN0cn0tJHt0YXNrLmFsZXJ0fWA7XG4gICAgICBpZiAodGhpcy5maXJlZEFsZXJ0cy5oYXMoYWxlcnRLZXkpKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgdGltZVN0ciA9IHRhc2suZHVlVGltZSA/PyBcIjA5OjAwXCI7XG4gICAgICBjb25zdCBkdWVNcyAgID0gbmV3IERhdGUoYCR7ZGF0ZVN0cn1UJHt0aW1lU3RyfWApLmdldFRpbWUoKTtcbiAgICAgIGNvbnN0IGFsZXJ0TXMgPSBkdWVNcyAtIHRoaXMub2Zmc2V0VG9Ncyh0YXNrLmFsZXJ0KTtcblxuICAgICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIFRhc2sgXCIke3Rhc2sudGl0bGV9XCIgZGF0ZT1cIiR7ZGF0ZVN0cn1cIiB0aW1lPVwiJHt0aW1lU3RyfVwiIGFsZXJ0PVwiJHt0YXNrLmFsZXJ0fVwiIGZpcmVzIGF0ICR7bmV3IERhdGUoYWxlcnRNcykudG9Mb2NhbGVUaW1lU3RyaW5nKCl9ICgke01hdGgucm91bmQoKGFsZXJ0TXMgLSBub3dNcykvMTAwMCl9cylgKTtcblxuICAgICAgaWYgKG5vd01zID49IGFsZXJ0TXMgJiYgbm93TXMgPCBhbGVydE1zICsgd2luZG93TXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFtDaHJvbmljbGVdIEZJUklORyBhbGVydCBmb3IgdGFzayBcIiR7dGFzay50aXRsZX1cImApO1xuICAgICAgICB0aGlzLmZpcmUoYWxlcnRLZXksIHRhc2sudGl0bGUsIHRoaXMuYnVpbGRUYXNrQm9keSh0YXNrLmR1ZURhdGUsIHRhc2suZHVlVGltZSwgdGFzay5hbGVydCksIFwidGFza1wiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZmlyZShrZXk6IHN0cmluZywgdGl0bGU6IHN0cmluZywgYm9keTogc3RyaW5nLCB0eXBlOiBcImV2ZW50XCIgfCBcInRhc2tcIikge1xuICAgIHRoaXMuZmlyZWRBbGVydHMuYWRkKGtleSk7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLmdldFNldHRpbmdzKCk7XG4gICAgY29uc3QgZG9NYWNPUyAgICA9IHNldHRpbmdzLm5vdGlmTWFjT1MgICAgPz8gdHJ1ZTtcbiAgICBjb25zdCBkb09ic2lkaWFuID0gc2V0dGluZ3Mubm90aWZPYnNpZGlhbiA/PyB0cnVlO1xuICAgIGNvbnN0IGRvU291bmQgICAgPSBzZXR0aW5ncy5ub3RpZlNvdW5kICAgID8/IHRydWU7XG4gICAgY29uc3QgaWNvbiA9IHR5cGUgPT09IFwiZXZlbnRcIiA/IFwiXHVEODNEXHVEREQzXCIgOiBcIlx1MjcxM1wiO1xuXG4gICAgLy8gTmF0aXZlIG1hY09TIG5vdGlmaWNhdGlvbiBcdTIwMTQgdHJ5IG11bHRpcGxlIGFwcHJvYWNoZXNcbiAgICBpZiAoZG9NYWNPUykge1xuICAgIGxldCBub3RpZlNlbnQgPSBmYWxzZTtcblxuICAgIC8vIEFwcHJvYWNoIDE6IG9zYXNjcmlwdCAobW9zdCByZWxpYWJsZSBvbiBtYWNPUyByZWdhcmRsZXNzIG9mIEVsZWN0cm9uIHZlcnNpb24pXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHsgZXhlYyB9ID0gKHdpbmRvdyBhcyBhbnkpLnJlcXVpcmUoXCJjaGlsZF9wcm9jZXNzXCIpO1xuICAgICAgY29uc3QgdCA9IGBDaHJvbmljbGUgXHUyMDE0ICR7dHlwZSA9PT0gXCJldmVudFwiID8gXCJFdmVudFwiIDogXCJUYXNrXCJ9YDtcbiAgICAgIGNvbnN0IGIgPSBgJHt0aXRsZX0gXHUyMDE0ICR7Ym9keX1gLnJlcGxhY2UoL1xcXFwvZywgXCJcXFxcXFxcXFwiKS5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJyk7XG4gICAgICBleGVjKGBvc2FzY3JpcHQgLWUgJ2Rpc3BsYXkgbm90aWZpY2F0aW9uIFwiJHtifVwiIHdpdGggdGl0bGUgXCIke3R9XCIgc291bmQgbmFtZSBcIkdsYXNzXCInYCxcbiAgICAgICAgKGVycjogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgY29uc29sZS5sb2coXCJbQ2hyb25pY2xlXSBvc2FzY3JpcHQgZmFpbGVkOlwiLCBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIltDaHJvbmljbGVdIG9zYXNjcmlwdCBub3RpZmljYXRpb24gc2VudFwiKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIG5vdGlmU2VudCA9IHRydWU7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIltDaHJvbmljbGVdIG9zYXNjcmlwdCB1bmF2YWlsYWJsZTpcIiwgZXJyKTtcbiAgICB9XG5cbiAgICAvLyBBcHByb2FjaCAyOiBFbGVjdHJvbiBpcGNSZW5kZXJlciBcdTIxOTIgbWFpbiBwcm9jZXNzIChmYWxsYmFjaylcbiAgICBpZiAoIW5vdGlmU2VudCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyBpcGNSZW5kZXJlciB9ID0gKHdpbmRvdyBhcyBhbnkpLnJlcXVpcmUoXCJlbGVjdHJvblwiKTtcbiAgICAgICAgaXBjUmVuZGVyZXIuc2VuZChcInNob3ctbm90aWZpY2F0aW9uXCIsIHtcbiAgICAgICAgICB0aXRsZTogYENocm9uaWNsZSBcdTIwMTQgJHt0eXBlID09PSBcImV2ZW50XCIgPyBcIkV2ZW50XCIgOiBcIlRhc2tcIn1gLFxuICAgICAgICAgIGJvZHk6ICBgJHt0aXRsZX1cXG4ke2JvZHl9YCxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiW0Nocm9uaWNsZV0gaXBjUmVuZGVyZXIgbm90aWZpY2F0aW9uIHNlbnRcIik7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJbQ2hyb25pY2xlXSBpcGNSZW5kZXJlciBmYWlsZWQ6XCIsIGVycik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSW4tYXBwIHRvYXN0XG4gICAgaWYgKGRvT2JzaWRpYW4pIHtcbiAgICAgIG5ldyBOb3RpY2UoYCR7aWNvbn0gJHt0aXRsZX1cXG4ke2JvZHl9YCwgODAwMCk7XG4gICAgfVxuXG4gICAgLy8gU291bmRcbiAgICBpZiAoZG9Tb3VuZCkge1xuICAgICAgdGhpcy5wbGF5U291bmQoKTtcbiAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwbGF5U291bmQoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy5hdWRpb0N0eCkgdGhpcy5hdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgICAgIGNvbnN0IGN0eCAgPSB0aGlzLmF1ZGlvQ3R4O1xuICAgICAgY29uc3QgZ2FpbiA9IGN0eC5jcmVhdGVHYWluKCk7XG4gICAgICBnYWluLmNvbm5lY3QoY3R4LmRlc3RpbmF0aW9uKTtcbiAgICAgIGdhaW4uZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLjMsIGN0eC5jdXJyZW50VGltZSk7XG4gICAgICBnYWluLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSgwLjAwMSwgY3R4LmN1cnJlbnRUaW1lICsgMC42KTtcbiAgICAgIGZvciAoY29uc3QgW2ZyZXEsIGRlbGF5XSBvZiBbWzg4MCwgMF0sIFsxMTA4LCAwLjE1XV0gYXMgW251bWJlciwgbnVtYmVyXVtdKSB7XG4gICAgICAgIGNvbnN0IG9zYyA9IGN0eC5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gICAgICAgIG9zYy50eXBlID0gXCJzaW5lXCI7XG4gICAgICAgIG9zYy5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoZnJlcSwgY3R4LmN1cnJlbnRUaW1lICsgZGVsYXkpO1xuICAgICAgICBvc2MuY29ubmVjdChnYWluKTtcbiAgICAgICAgb3NjLnN0YXJ0KGN0eC5jdXJyZW50VGltZSArIGRlbGF5KTtcbiAgICAgICAgb3NjLnN0b3AoY3R4LmN1cnJlbnRUaW1lICsgZGVsYXkgKyAwLjUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggeyAvKiBzaWxlbnQgZmFpbCAqLyB9XG4gIH1cblxuICBwcml2YXRlIG9mZnNldFRvTXMob2Zmc2V0OiBBbGVydE9mZnNldCk6IG51bWJlciB7XG4gICAgY29uc3QgbWFwOiBSZWNvcmQ8QWxlcnRPZmZzZXQsIG51bWJlcj4gPSB7XG4gICAgICBcIm5vbmVcIjogICAgMCwgICAgICAgXCJhdC10aW1lXCI6IDAsXG4gICAgICBcIjVtaW5cIjogICAgMzAwMDAwLCAgXCIxMG1pblwiOiAgIDYwMDAwMCxcbiAgICAgIFwiMTVtaW5cIjogICA5MDAwMDAsICBcIjMwbWluXCI6ICAgMTgwMDAwMCxcbiAgICAgIFwiMWhvdXJcIjogICAzNjAwMDAwLCBcIjJob3Vyc1wiOiAgNzIwMDAwMCxcbiAgICAgIFwiMWRheVwiOiAgICA4NjQwMDAwMCxcIjJkYXlzXCI6ICAgMTcyODAwMDAwLFxuICAgICAgXCIxd2Vla1wiOiAgIDYwNDgwMDAwMCxcbiAgICB9O1xuICAgIHJldHVybiBtYXBbb2Zmc2V0XSA/PyAwO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZEV2ZW50Qm9keShzdGFydFRpbWU6IHN0cmluZywgYWxlcnQ6IEFsZXJ0T2Zmc2V0KTogc3RyaW5nIHtcbiAgICBpZiAoYWxlcnQgPT09IFwiYXQtdGltZVwiKSByZXR1cm4gYFN0YXJ0aW5nIGF0ICR7dGhpcy5mb3JtYXRUaW1lKHN0YXJ0VGltZSl9YDtcbiAgICByZXR1cm4gYCR7dGhpcy5vZmZzZXRMYWJlbChhbGVydCl9IFx1MjAxNCBzdGFydHMgYXQgJHt0aGlzLmZvcm1hdFRpbWUoc3RhcnRUaW1lKX1gO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZFRhc2tCb2R5KGR1ZURhdGU6IHN0cmluZywgZHVlVGltZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBhbGVydDogQWxlcnRPZmZzZXQpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRhdGVMYWJlbCA9IG5ldyBEYXRlKGR1ZURhdGUgKyBcIlQwMDowMDowMFwiKS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7XG4gICAgICB3ZWVrZGF5OiBcInNob3J0XCIsIG1vbnRoOiBcInNob3J0XCIsIGRheTogXCJudW1lcmljXCJcbiAgICB9KTtcbiAgICBpZiAoZHVlVGltZSkge1xuICAgICAgaWYgKGFsZXJ0ID09PSBcImF0LXRpbWVcIikgcmV0dXJuIGBEdWUgYXQgJHt0aGlzLmZvcm1hdFRpbWUoZHVlVGltZSl9YDtcbiAgICAgIHJldHVybiBgJHt0aGlzLm9mZnNldExhYmVsKGFsZXJ0KX0gXHUyMDE0IGR1ZSBhdCAke3RoaXMuZm9ybWF0VGltZShkdWVUaW1lKX1gO1xuICAgIH1cbiAgICByZXR1cm4gYER1ZSAke2RhdGVMYWJlbH1gO1xuICB9XG5cbiAgcHJpdmF0ZSBvZmZzZXRMYWJlbChvZmZzZXQ6IEFsZXJ0T2Zmc2V0KTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXA6IFJlY29yZDxBbGVydE9mZnNldCwgc3RyaW5nPiA9IHtcbiAgICAgIFwibm9uZVwiOiBcIlwiLCBcImF0LXRpbWVcIjogXCJOb3dcIixcbiAgICAgIFwiNW1pblwiOiBcIjUgbWluXCIsIFwiMTBtaW5cIjogXCIxMCBtaW5cIiwgXCIxNW1pblwiOiBcIjE1IG1pblwiLCBcIjMwbWluXCI6IFwiMzAgbWluXCIsXG4gICAgICBcIjFob3VyXCI6IFwiMSBob3VyXCIsIFwiMmhvdXJzXCI6IFwiMiBob3Vyc1wiLFxuICAgICAgXCIxZGF5XCI6IFwiMSBkYXlcIiwgXCIyZGF5c1wiOiBcIjIgZGF5c1wiLCBcIjF3ZWVrXCI6IFwiMSB3ZWVrXCIsXG4gICAgfTtcbiAgICByZXR1cm4gbWFwW29mZnNldF0gPz8gXCJcIjtcbiAgfVxuXG4gIHByaXZhdGUgZm9ybWF0VGltZSh0aW1lU3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IFtoLCBtXSA9IHRpbWVTdHIuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpO1xuICAgIHJldHVybiBgJHtoICUgMTIgfHwgMTJ9OiR7U3RyaW5nKG0pLnBhZFN0YXJ0KDIsXCIwXCIpfSAke2ggPj0gMTIgPyBcIlBNXCIgOiBcIkFNXCJ9YDtcbiAgfVxufSIsICIvLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2FsZW5kYXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgdHlwZSBDYWxlbmRhckNvbG9yID0gc3RyaW5nO1xuXG5leHBvcnQgaW50ZXJmYWNlIENocm9uaWNsZUNhbGVuZGFyIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBjb2xvcjogQ2FsZW5kYXJDb2xvcjtcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIGlzVmlzaWJsZTogYm9vbGVhbjtcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBMaXN0cyAodGFzayBvcmdhbmlzYXRpb24pIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgaW50ZXJmYWNlIENocm9uaWNsZUxpc3Qge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbG9yOiBzdHJpbmc7ICAgIC8vIGhleCB2YWx1ZSBlLmcuIFwiIzM3OEFERFwiXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgVGFza3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIFRhc2tTdGF0dXMgPSBcInRvZG9cIiB8IFwiaW4tcHJvZ3Jlc3NcIiB8IFwiZG9uZVwiIHwgXCJjYW5jZWxsZWRcIjtcbmV4cG9ydCB0eXBlIFRhc2tQcmlvcml0eSA9IFwibm9uZVwiIHwgXCJsb3dcIiB8IFwibWVkaXVtXCIgfCBcImhpZ2hcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUaW1lRW50cnkge1xuICBzdGFydFRpbWU6IHN0cmluZzsgICAvLyBJU08gODYwMVxuICBlbmRUaW1lPzogc3RyaW5nOyAgICAvLyBJU08gODYwMVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEN1c3RvbUZpZWxkIHtcbiAga2V5OiBzdHJpbmc7XG4gIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENocm9uaWNsZVRhc2sge1xuICAvLyAtLS0gQ29yZSAtLS1cbiAgaWQ6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgc3RhdHVzOiBUYXNrU3RhdHVzO1xuICBwcmlvcml0eTogVGFza1ByaW9yaXR5O1xuXG4gIC8vIC0tLSBTY2hlZHVsaW5nIC0tLVxuICBkdWVEYXRlPzogc3RyaW5nOyAgICAgICAvLyBZWVlZLU1NLUREXG4gIGR1ZVRpbWU/OiBzdHJpbmc7ICAgICAgIC8vIEhIOm1tXG4gIHJlY3VycmVuY2U/OiBzdHJpbmc7ICAgIC8vIFJSVUxFIHN0cmluZyBlLmcuIFwiRlJFUT1XRUVLTFk7QllEQVk9TU9cIlxuICBhbGVydDogQWxlcnRPZmZzZXQ7XG5cbiAgLy8gLS0tIE9yZ2FuaXNhdGlvbiAtLS1cbiAgbG9jYXRpb24/OiBzdHJpbmc7XG4gIGxpc3RJZD86IHN0cmluZzsgICAgICAgIC8vIGxpbmtzIHRvIGEgQ2hyb25pY2xlTGlzdFxuICB0YWdzOiBzdHJpbmdbXTtcbiAgbGlua2VkTm90ZXM6IHN0cmluZ1tdOyAgLy8gd2lraWxpbmsgcGF0aHMgZS5nLiBbXCJQcm9qZWN0cy9XZWJzaXRlXCJdXG4gIHByb2plY3RzOiBzdHJpbmdbXTtcblxuICAvLyAtLS0gVGltZSB0cmFja2luZyAtLS1cbiAgdGltZUVzdGltYXRlPzogbnVtYmVyOyAgLy8gbWludXRlc1xuICB0aW1lRW50cmllczogVGltZUVudHJ5W107XG5cbiAgLy8gLS0tIEN1c3RvbSAtLS1cbiAgY3VzdG9tRmllbGRzOiBDdXN0b21GaWVsZFtdO1xuXG4gIC8vIC0tLSBSZWN1cnJlbmNlIGNvbXBsZXRpb24gLS0tXG4gIGNvbXBsZXRlZEluc3RhbmNlczogc3RyaW5nW107IC8vIFlZWVktTU0tREQgZGF0ZXNcblxuICAvLyAtLS0gTWV0YSAtLS1cbiAgY3JlYXRlZEF0OiBzdHJpbmc7ICAgICAgLy8gSVNPIDg2MDFcbiAgY29tcGxldGVkQXQ/OiBzdHJpbmc7ICAgLy8gSVNPIDg2MDFcbiAgbm90ZXM/OiBzdHJpbmc7ICAgICAgICAgLy8gYm9keSBjb250ZW50IG9mIHRoZSBub3RlXG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBFdmVudHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIEFsZXJ0T2Zmc2V0ID1cbiAgfCBcIm5vbmVcIlxuICB8IFwiYXQtdGltZVwiXG4gIHwgXCI1bWluXCIgfCBcIjEwbWluXCIgfCBcIjE1bWluXCIgfCBcIjMwbWluXCJcbiAgfCBcIjFob3VyXCIgfCBcIjJob3Vyc1wiXG4gIHwgXCIxZGF5XCIgfCBcIjJkYXlzXCIgfCBcIjF3ZWVrXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hyb25pY2xlRXZlbnQge1xuICAvLyAtLS0gQ29yZSAoaW4gZm9ybSBvcmRlcikgLS0tXG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGxvY2F0aW9uPzogc3RyaW5nO1xuICBhbGxEYXk6IGJvb2xlYW47XG4gIHN0YXJ0RGF0ZTogc3RyaW5nOyAgICAgIC8vIFlZWVktTU0tRERcbiAgc3RhcnRUaW1lPzogc3RyaW5nOyAgICAgLy8gSEg6bW0gICh1bmRlZmluZWQgd2hlbiBhbGxEYXkpXG4gIGVuZERhdGU6IHN0cmluZzsgICAgICAgIC8vIFlZWVktTU0tRERcbiAgZW5kVGltZT86IHN0cmluZzsgICAgICAgLy8gSEg6bW0gICh1bmRlZmluZWQgd2hlbiBhbGxEYXkpXG4gIHJlY3VycmVuY2U/OiBzdHJpbmc7ICAgIC8vIFJSVUxFIHN0cmluZ1xuICBjYWxlbmRhcklkPzogc3RyaW5nOyAgICAvLyBsaW5rcyB0byBhIENocm9uaWNsZUNhbGVuZGFyXG4gIGFsZXJ0OiBBbGVydE9mZnNldDtcbiAgbm90ZXM/OiBzdHJpbmc7ICAgICAgICAgLy8gYm9keSBjb250ZW50IG9mIHRoZSBub3RlXG4gIGxpbmtlZE5vdGVzPzogc3RyaW5nW107XG4gIHRhZ3M/OiBzdHJpbmdbXTtcblxuICAvLyAtLS0gQ29ubmVjdGlvbnMgLS0tXG4gIGxpbmtlZFRhc2tJZHM6IHN0cmluZ1tdOyAgIC8vIENocm9uaWNsZSB0YXNrIElEc1xuXG4gIC8vIC0tLSBNZXRhIC0tLVxuICBjcmVhdGVkQXQ6IHN0cmluZztcbiAgY29tcGxldGVkSW5zdGFuY2VzOiBzdHJpbmdbXTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFBsdWdpbiBzZXR0aW5ncyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVTZXR0aW5ncyB7XG4gIC8vIEZvbGRlciBwYXRoc1xuICB0YXNrc0ZvbGRlcjogc3RyaW5nO1xuICBldmVudHNGb2xkZXI6IHN0cmluZztcblxuICAvLyBDYWxlbmRhcnMgXHUyMDE0IGZvciBldmVudHMgKHN0b3JlZCBpbiBzZXR0aW5ncywgbm90IGFzIGZpbGVzKVxuICBjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW107XG4gIGRlZmF1bHRDYWxlbmRhcklkOiBzdHJpbmc7XG5cbiAgLy8gTGlzdHMgXHUyMDE0IGZvciB0YXNrcyAoc3RvcmVkIGluIHNldHRpbmdzLCBub3QgYXMgZmlsZXMpXG4gIGxpc3RzOiBDaHJvbmljbGVMaXN0W107XG4gIGRlZmF1bHRMaXN0SWQ6IHN0cmluZztcblxuICAvLyBEZWZhdWx0c1xuICBkZWZhdWx0VGFza1N0YXR1czogVGFza1N0YXR1cztcbiAgZGVmYXVsdFRhc2tQcmlvcml0eTogVGFza1ByaW9yaXR5O1xuICBkZWZhdWx0QWxlcnQ6IEFsZXJ0T2Zmc2V0O1xuXG4gIC8vIERpc3BsYXlcbiAgc3RhcnRPZldlZWs6IDAgfCAxIHwgNjsgIC8vIDA9U3VuLCAxPU1vbiwgNj1TYXRcbiAgdGltZUZvcm1hdDogXCIxMmhcIiB8IFwiMjRoXCI7XG4gIGRlZmF1bHRDYWxlbmRhclZpZXc6IFwiZGF5XCIgfCBcIndlZWtcIiB8IFwibW9udGhcIiB8IFwieWVhclwiO1xuXG4gIC8vIFNtYXJ0IGxpc3RzIHZpc2liaWxpdHlcbiAgc2hvd1RvZGF5Q291bnQ6IGJvb2xlYW47XG4gIHNob3dTY2hlZHVsZWRDb3VudDogYm9vbGVhbjtcbiAgc2hvd0ZsYWdnZWRDb3VudDogYm9vbGVhbjtcblxuICAvLyBOb3RpZmljYXRpb24gY2hhbm5lbHNcbiAgbm90aWZNYWNPUzogYm9vbGVhbjtcbiAgbm90aWZPYnNpZGlhbjogYm9vbGVhbjtcbiAgbm90aWZTb3VuZDogYm9vbGVhbjtcbiAgbm90aWZFdmVudHM6IGJvb2xlYW47XG4gIG5vdGlmVGFza3M6IGJvb2xlYW47XG5cbiAgLy8gRXZlbnRzXG4gIGRlZmF1bHRFdmVudER1cmF0aW9uOiBudW1iZXI7XG5cbiAgLy8gQXBwZWFyYW5jZVxuICBkZW5zaXR5OiBcImNvbXBhY3RcIiB8IFwiY29tZm9ydGFibGVcIjtcbiAgc2hvd0NvbXBsZXRlZENvdW50OiBib29sZWFuO1xuICBzaG93VGFza0NvdW50U3VidGl0bGU6IGJvb2xlYW47XG5cbiAgLy8gQ3VzdG9tIGZpZWxkIHRlbXBsYXRlc1xuICBkZWZhdWx0Q3VzdG9tRmllbGRzOiB7IGtleTogc3RyaW5nOyB0eXBlOiBcInRleHRcIiB8IFwibnVtYmVyXCIgfCBcImRhdGVcIiB8IFwiY2hlY2tib3hcIiB9W107XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBDaHJvbmljbGVTZXR0aW5ncyA9IHtcbiAgdGFza3NGb2xkZXI6IFwiQ2hyb25pY2xlL1Rhc2tzXCIsXG4gIGV2ZW50c0ZvbGRlcjogXCJDaHJvbmljbGUvRXZlbnRzXCIsXG4gIGNhbGVuZGFyczogW1xuICAgIHsgaWQ6IFwicGVyc29uYWxcIiwgbmFtZTogXCJQZXJzb25hbFwiLCBjb2xvcjogXCIjMzc4QUREXCIsIGlzVmlzaWJsZTogdHJ1ZSwgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSxcbiAgICB7IGlkOiBcIndvcmtcIiwgICAgIG5hbWU6IFwiV29ya1wiLCAgICAgY29sb3I6IFwiIzM0Qzc1OVwiLCBpc1Zpc2libGU6IHRydWUsIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0sXG4gIF0sXG4gIGRlZmF1bHRDYWxlbmRhcklkOiBcInBlcnNvbmFsXCIsXG4gIGxpc3RzOiBbXG4gICAgeyBpZDogXCJwZXJzb25hbFwiLCBuYW1lOiBcIlBlcnNvbmFsXCIsIGNvbG9yOiBcIiMzNzhBRERcIiwgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSxcbiAgICB7IGlkOiBcIndvcmtcIiwgICAgIG5hbWU6IFwiV29ya1wiLCAgICAgY29sb3I6IFwiIzM0Qzc1OVwiLCBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9LFxuICBdLFxuICBkZWZhdWx0TGlzdElkOiBcInBlcnNvbmFsXCIsXG4gIGRlZmF1bHRUYXNrU3RhdHVzOiBcInRvZG9cIixcbiAgZGVmYXVsdFRhc2tQcmlvcml0eTogXCJub25lXCIsXG4gIGRlZmF1bHRBbGVydDogXCJub25lXCIsXG4gIHN0YXJ0T2ZXZWVrOiAwLFxuICB0aW1lRm9ybWF0OiBcIjEyaFwiLFxuICBkZWZhdWx0Q2FsZW5kYXJWaWV3OiBcIndlZWtcIixcbiAgc2hvd1RvZGF5Q291bnQ6IHRydWUsXG4gIHNob3dTY2hlZHVsZWRDb3VudDogdHJ1ZSxcbiAgc2hvd0ZsYWdnZWRDb3VudDogdHJ1ZSxcbiAgbm90aWZNYWNPUzogdHJ1ZSxcbiAgbm90aWZPYnNpZGlhbjogdHJ1ZSxcbiAgbm90aWZTb3VuZDogdHJ1ZSxcbiAgbm90aWZFdmVudHM6IHRydWUsXG4gIG5vdGlmVGFza3M6IHRydWUsXG4gIGRlZmF1bHRFdmVudER1cmF0aW9uOiA2MCxcbiAgZGVuc2l0eTogXCJjb21mb3J0YWJsZVwiLFxuICBzaG93Q29tcGxldGVkQ291bnQ6IHRydWUsXG4gIHNob3dUYXNrQ291bnRTdWJ0aXRsZTogdHJ1ZSxcbiAgZGVmYXVsdEN1c3RvbUZpZWxkczogW10sXG59O1xuIiwgImltcG9ydCB7IEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBFdmVudE1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9FdmVudE1hbmFnZXJcIjtcbmltcG9ydCB7IENhbGVuZGFyTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0NhbGVuZGFyTWFuYWdlclwiO1xuaW1wb3J0IHsgVGFza01hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9UYXNrTWFuYWdlclwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlRXZlbnQsIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjb25zdCBFVkVOVF9GT1JNX1ZJRVdfVFlQRSA9IFwiY2hyb25pY2xlLWV2ZW50LWZvcm1cIjtcblxuZXhwb3J0IGNsYXNzIEV2ZW50Rm9ybVZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIHByaXZhdGUgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXI7XG4gIHByaXZhdGUgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXI7XG4gIHByaXZhdGUgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyO1xuICBwcml2YXRlIGVkaXRpbmdFdmVudDogQ2hyb25pY2xlRXZlbnQgfCBudWxsID0gbnVsbDtcbiAgb25TYXZlPzogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBsZWFmOiBXb3Jrc3BhY2VMZWFmLFxuICAgIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyLFxuICAgIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyLFxuICAgIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcixcbiAgICBlZGl0aW5nRXZlbnQ/OiBDaHJvbmljbGVFdmVudCxcbiAgICBvblNhdmU/OiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMuZXZlbnRNYW5hZ2VyICAgID0gZXZlbnRNYW5hZ2VyO1xuICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyID0gY2FsZW5kYXJNYW5hZ2VyO1xuICAgIHRoaXMudGFza01hbmFnZXIgICAgID0gdGFza01hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nRXZlbnQgICAgPSBlZGl0aW5nRXZlbnQgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSAgICAgICAgICA9IG9uU2F2ZTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6ICAgIHN0cmluZyB7IHJldHVybiBFVkVOVF9GT1JNX1ZJRVdfVFlQRTsgfVxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5lZGl0aW5nRXZlbnQgPyBcIkVkaXQgZXZlbnRcIiA6IFwiTmV3IGV2ZW50XCI7IH1cbiAgZ2V0SWNvbigpOiAgICAgICAgc3RyaW5nIHsgcmV0dXJuIFwiY2FsZW5kYXJcIjsgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHsgYXdhaXQgdGhpcy5yZW5kZXIoKTsgfVxuXG4gIGxvYWRFdmVudChldmVudDogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICB0aGlzLmVkaXRpbmdFdmVudCA9IGV2ZW50O1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBhc3luYyByZW5kZXIoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb250YWluZXIuZW1wdHkoKTtcbiAgICBjb250YWluZXIuYWRkQ2xhc3MoXCJjaHJvbmljbGUtZm9ybS1wYWdlXCIpO1xuXG4gICAgY29uc3QgZSAgICAgICAgID0gdGhpcy5lZGl0aW5nRXZlbnQ7XG4gICAgY29uc3QgY2FsZW5kYXJzID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCk7XG5cbiAgICAvLyBGZXRjaCBhbGwgdGFza3MgdXBmcm9udCBmb3IgbGlua2VkLXRhc2tzIFVJXG4gICAgY29uc3QgYWxsVGFza3MgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEFsbCgpO1xuICAgIGxldCBsaW5rZWRJZHM6IHN0cmluZ1tdID0gWy4uLihlPy5saW5rZWRUYXNrSWRzID8/IFtdKV07XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjZi1oZWFkZXJcIik7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdFwiLCB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZi1oZWFkZXItdGl0bGVcIikuc2V0VGV4dChlID8gXCJFZGl0IGV2ZW50XCIgOiBcIk5ldyBldmVudFwiKTtcbiAgICBjb25zdCBzYXZlQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1wcmltYXJ5XCIsIHRleHQ6IGUgPyBcIlNhdmVcIiA6IFwiQWRkXCIgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9ybSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb3JtID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNmLWZvcm1cIik7XG5cbiAgICAvLyBUaXRsZVxuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGl0bGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLXRpdGxlLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIkV2ZW50IG5hbWVcIlxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSBlPy50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIExvY2F0aW9uXG4gICAgY29uc3QgbG9jYXRpb25JbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJMb2NhdGlvblwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIGxvY2F0aW9uXCJcbiAgICB9KTtcbiAgICBsb2NhdGlvbklucHV0LnZhbHVlID0gZT8ubG9jYXRpb24gPz8gXCJcIjtcblxuICAgIC8vIEFsbCBkYXkgdG9nZ2xlXG4gICAgY29uc3QgYWxsRGF5V3JhcCAgID0gdGhpcy5maWVsZChmb3JtLCBcIkFsbCBkYXlcIikuY3JlYXRlRGl2KFwiY2VtLXRvZ2dsZS13cmFwXCIpO1xuICAgIGNvbnN0IGFsbERheVRvZ2dsZSA9IGFsbERheVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiwgY2xzOiBcImNlbS10b2dnbGVcIiB9KTtcbiAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA9IGU/LmFsbERheSA/PyBmYWxzZTtcbiAgICBjb25zdCBhbGxEYXlMYWJlbCAgPSBhbGxEYXlXcmFwLmNyZWF0ZVNwYW4oeyBjbHM6IFwiY2VtLXRvZ2dsZS1sYWJlbFwiIH0pO1xuICAgIGFsbERheUxhYmVsLnNldFRleHQoYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIlllc1wiIDogXCJOb1wiKTtcbiAgICBhbGxEYXlUb2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBhbGxEYXlMYWJlbC5zZXRUZXh0KGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJZZXNcIiA6IFwiTm9cIik7XG4gICAgICB0aW1lRmllbGRzLnN0eWxlLmRpc3BsYXkgPSBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwibm9uZVwiIDogXCJcIjtcbiAgICB9KTtcblxuICAgIC8vIERhdGVzXG4gICAgY29uc3QgZGF0ZVJvdyAgICAgID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG4gICAgY29uc3Qgc3RhcnREYXRlSW5wdXQgPSB0aGlzLmZpZWxkKGRhdGVSb3csIFwiU3RhcnQgZGF0ZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0RGF0ZUlucHV0LnZhbHVlID0gZT8uc3RhcnREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBjb25zdCBlbmREYXRlSW5wdXQgPSB0aGlzLmZpZWxkKGRhdGVSb3csIFwiRW5kIGRhdGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcImRhdGVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBlbmREYXRlSW5wdXQudmFsdWUgPSBlPy5lbmREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBzdGFydERhdGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmICghZW5kRGF0ZUlucHV0LnZhbHVlIHx8IGVuZERhdGVJbnB1dC52YWx1ZSA8IHN0YXJ0RGF0ZUlucHV0LnZhbHVlKSB7XG4gICAgICAgIGVuZERhdGVJbnB1dC52YWx1ZSA9IHN0YXJ0RGF0ZUlucHV0LnZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVGltZSBmaWVsZHMgKGhpZGRlbiB3aGVuIGFsbC1kYXkpXG4gICAgY29uc3QgdGltZUZpZWxkcyA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuICAgIHRpbWVGaWVsZHMuc3R5bGUuZGlzcGxheSA9IGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJub25lXCIgOiBcIlwiO1xuXG4gICAgY29uc3Qgc3RhcnRUaW1lSW5wdXQgPSB0aGlzLmZpZWxkKHRpbWVGaWVsZHMsIFwiU3RhcnQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0VGltZUlucHV0LnZhbHVlID0gZT8uc3RhcnRUaW1lID8/IFwiMDk6MDBcIjtcblxuICAgIGNvbnN0IGVuZFRpbWVJbnB1dCA9IHRoaXMuZmllbGQodGltZUZpZWxkcywgXCJFbmQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGVuZFRpbWVJbnB1dC52YWx1ZSA9IGU/LmVuZFRpbWUgPz8gXCIxMDowMFwiO1xuXG4gICAgLy8gUmVwZWF0XG4gICAgY29uc3QgcmVjU2VsZWN0ID0gdGhpcy5maWVsZChmb3JtLCBcIlJlcGVhdFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCByZWN1cnJlbmNlcyA9IFtcbiAgICAgIHsgdmFsdWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJOZXZlclwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9REFJTFlcIiwgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgZGF5XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1XRUVLTFlcIiwgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSB3ZWVrXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiRlJFUT1NT05USExZXCIsICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSBtb250aFwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9WUVBUkxZXCIsICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgeWVhclwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZO0JZREFZPU1PLFRVLFdFLFRILEZSXCIsICBsYWJlbDogXCJXZWVrZGF5c1wiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IHIgb2YgcmVjdXJyZW5jZXMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IHJlY1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiByLnZhbHVlLCB0ZXh0OiByLmxhYmVsIH0pO1xuICAgICAgaWYgKGU/LnJlY3VycmVuY2UgPT09IHIudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gQWxlcnRcbiAgICBjb25zdCBhbGVydFNlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJBbGVydFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCBhbGVydHM6IHsgdmFsdWU6IEFsZXJ0T2Zmc2V0OyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwibm9uZVwiLCAgICBsYWJlbDogXCJOb25lXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiYXQtdGltZVwiLCBsYWJlbDogXCJBdCB0aW1lIG9mIGV2ZW50XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiNW1pblwiLCAgICBsYWJlbDogXCI1IG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMTBtaW5cIiwgICBsYWJlbDogXCIxMCBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjE1bWluXCIsICAgbGFiZWw6IFwiMTUgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIzMG1pblwiLCAgIGxhYmVsOiBcIjMwIG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMWhvdXJcIiwgICBsYWJlbDogXCIxIGhvdXIgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMmhvdXJzXCIsICBsYWJlbDogXCIyIGhvdXJzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjFkYXlcIiwgICAgbGFiZWw6IFwiMSBkYXkgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMmRheXNcIiwgICBsYWJlbDogXCIyIGRheXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMXdlZWtcIiwgICBsYWJlbDogXCIxIHdlZWsgYmVmb3JlXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgYSBvZiBhbGVydHMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGFsZXJ0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGEudmFsdWUsIHRleHQ6IGEubGFiZWwgfSk7XG4gICAgICBpZiAoZT8uYWxlcnQgPT09IGEudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gQ2FsZW5kYXJcbiAgICBjb25zdCBjYWxTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQ2FsZW5kYXJcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY2FsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IFwiXCIsIHRleHQ6IFwiTm9uZVwiIH0pO1xuICAgIGZvciAoY29uc3QgY2FsIG9mIGNhbGVuZGFycykge1xuICAgICAgY29uc3Qgb3B0ID0gY2FsU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGNhbC5pZCwgdGV4dDogY2FsLm5hbWUgfSk7XG4gICAgICBpZiAoZT8uY2FsZW5kYXJJZCA9PT0gY2FsLmlkKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cbiAgICBjb25zdCB1cGRhdGVDYWxDb2xvciA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNhbCA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoY2FsU2VsZWN0LnZhbHVlKTtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0Q29sb3IgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCJ0cmFuc3BhcmVudFwiO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRXaWR0aCA9IFwiNHB4XCI7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdFN0eWxlID0gXCJzb2xpZFwiO1xuICAgIH07XG4gICAgY2FsU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdXBkYXRlQ2FsQ29sb3IpO1xuICAgIHVwZGF0ZUNhbENvbG9yKCk7XG5cbiAgICAvLyBUYWdzXG4gICAgY29uc3QgdGFnc0lucHV0ID0gdGhpcy5maWVsZChmb3JtLCBcIlRhZ3NcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJ3b3JrLCBwZXJzb25hbCAgKGNvbW1hIHNlcGFyYXRlZClcIlxuICAgIH0pO1xuICAgIHRhZ3NJbnB1dC52YWx1ZSA9IGU/LnRhZ3M/LmpvaW4oXCIsIFwiKSA/PyBcIlwiO1xuXG4gICAgLy8gTGlua2VkIG5vdGVzXG4gICAgY29uc3QgbGlua2VkSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTGlua2VkIG5vdGVzXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiUHJvamVjdHMvV2Vic2l0ZSwgSm91cm5hbC8yMDI0ICAoY29tbWEgc2VwYXJhdGVkKVwiXG4gICAgfSk7XG4gICAgbGlua2VkSW5wdXQudmFsdWUgPSBlPy5saW5rZWROb3Rlcz8uam9pbihcIiwgXCIpID8/IFwiXCI7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTGlua2VkIHRhc2tzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGxpbmtlZFRhc2tzRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTGlua2VkIHRhc2tzXCIpO1xuICAgIGNvbnN0IGxpbmtlZExpc3QgICAgICAgPSBsaW5rZWRUYXNrc0ZpZWxkLmNyZWF0ZURpdihcImN0bC1saXN0XCIpO1xuXG4gICAgY29uc3QgcmVuZGVyTGlua2VkTGlzdCA9ICgpID0+IHtcbiAgICAgIGxpbmtlZExpc3QuZW1wdHkoKTtcbiAgICAgIGNvbnN0IGl0ZW1zID0gYWxsVGFza3MuZmlsdGVyKHQgPT4gbGlua2VkSWRzLmluY2x1ZGVzKHQuaWQpKTtcbiAgICAgIGlmIChpdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbGlua2VkTGlzdC5jcmVhdGVEaXYoXCJjdGwtZW1wdHlcIikuc2V0VGV4dChcIk5vIGxpbmtlZCB0YXNrc1wiKTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgdGFzayBvZiBpdGVtcykge1xuICAgICAgICBjb25zdCByb3cgPSBsaW5rZWRMaXN0LmNyZWF0ZURpdihcImN0bC1pdGVtXCIpO1xuICAgICAgICByb3cuY3JlYXRlU3Bhbih7IGNsczogYGN0bC1zdGF0dXMgY3RsLXN0YXR1cy0ke3Rhc2suc3RhdHVzfWAgfSk7XG4gICAgICAgIHJvdy5jcmVhdGVTcGFuKHsgY2xzOiBcImN0bC10aXRsZVwiIH0pLnNldFRleHQodGFzay50aXRsZSk7XG4gICAgICAgIGNvbnN0IHVubGlua0J0biA9IHJvdy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjdGwtdW5saW5rXCIsIHRleHQ6IFwiXHUwMEQ3XCIgfSk7XG4gICAgICAgIHVubGlua0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIGxpbmtlZElkcyA9IGxpbmtlZElkcy5maWx0ZXIoaWQgPT4gaWQgIT09IHRhc2suaWQpO1xuICAgICAgICAgIHJlbmRlckxpbmtlZExpc3QoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgICByZW5kZXJMaW5rZWRMaXN0KCk7XG5cbiAgICAvLyBTZWFyY2ggdG8gbGluayBleGlzdGluZyB0YXNrc1xuICAgIGNvbnN0IHNlYXJjaFdyYXAgICAgPSBsaW5rZWRUYXNrc0ZpZWxkLmNyZWF0ZURpdihcImN0bC1zZWFyY2gtd3JhcFwiKTtcbiAgICBjb25zdCBzZWFyY2hJbnB1dCAgID0gc2VhcmNoV3JhcC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXQgY3RsLXNlYXJjaFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiU2VhcmNoIHRhc2tzIHRvIGxpbmtcdTIwMjZcIlxuICAgIH0pO1xuICAgIGNvbnN0IHNlYXJjaFJlc3VsdHMgPSBzZWFyY2hXcmFwLmNyZWF0ZURpdihcImN0bC1yZXN1bHRzXCIpO1xuICAgIHNlYXJjaFJlc3VsdHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuXG4gICAgY29uc3QgY2xvc2VTZWFyY2ggPSAoKSA9PiB7XG4gICAgICBzZWFyY2hSZXN1bHRzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgIHNlYXJjaFJlc3VsdHMuZW1wdHkoKTtcbiAgICB9O1xuXG4gICAgc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHEgPSBzZWFyY2hJbnB1dC52YWx1ZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICAgIHNlYXJjaFJlc3VsdHMuZW1wdHkoKTtcbiAgICAgIGlmICghcSkgeyBjbG9zZVNlYXJjaCgpOyByZXR1cm47IH1cblxuICAgICAgY29uc3QgbWF0Y2hlcyA9IGFsbFRhc2tzXG4gICAgICAgIC5maWx0ZXIodCA9PiAhbGlua2VkSWRzLmluY2x1ZGVzKHQuaWQpICYmIHQudGl0bGUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxKSlcbiAgICAgICAgLnNsaWNlKDAsIDYpO1xuXG4gICAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDApIHsgY2xvc2VTZWFyY2goKTsgcmV0dXJuOyB9XG4gICAgICBzZWFyY2hSZXN1bHRzLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgZm9yIChjb25zdCB0YXNrIG9mIG1hdGNoZXMpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHNlYXJjaFJlc3VsdHMuY3JlYXRlRGl2KFwiY3RsLXJlc3VsdC1pdGVtXCIpO1xuICAgICAgICBpdGVtLmNyZWF0ZVNwYW4oeyBjbHM6IGBjdGwtc3RhdHVzIGN0bC1zdGF0dXMtJHt0YXNrLnN0YXR1c31gIH0pO1xuICAgICAgICBpdGVtLmNyZWF0ZVNwYW4oeyBjbHM6IFwiY3RsLXJlc3VsdC10aXRsZVwiIH0pLnNldFRleHQodGFzay50aXRsZSk7XG4gICAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZXYpID0+IHtcbiAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGxpbmtlZElkcy5wdXNoKHRhc2suaWQpO1xuICAgICAgICAgIHNlYXJjaElucHV0LnZhbHVlID0gXCJcIjtcbiAgICAgICAgICBjbG9zZVNlYXJjaCgpO1xuICAgICAgICAgIHJlbmRlckxpbmtlZExpc3QoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBzZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KGNsb3NlU2VhcmNoLCAxNTApO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIG5ldyB0YXNrIGFuZCBsaW5rIGl0XG4gICAgY29uc3QgbmV3VGFza1dyYXAgID0gbGlua2VkVGFza3NGaWVsZC5jcmVhdGVEaXYoXCJjdGwtbmV3LXdyYXBcIik7XG4gICAgY29uc3QgbmV3VGFza0lucHV0ID0gbmV3VGFza1dyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGN0bC1uZXctaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIk5ldyB0YXNrIHRpdGxlXHUyMDI2XCJcbiAgICB9KTtcbiAgICBjb25zdCBhZGRUYXNrQnRuID0gbmV3VGFza1dyYXAuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLXByaW1hcnkgY3RsLWFkZC1idG5cIiwgdGV4dDogXCJBZGQgdGFza1wiIH0pO1xuXG4gICAgY29uc3QgY3JlYXRlQW5kTGluayA9IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRpdGxlID0gbmV3VGFza0lucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHJldHVybjtcbiAgICAgIGNvbnN0IG5ld1Rhc2sgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmNyZWF0ZSh7XG4gICAgICAgIHRpdGxlLFxuICAgICAgICBzdGF0dXM6ICAgICAgICAgICAgIFwidG9kb1wiLFxuICAgICAgICBwcmlvcml0eTogICAgICAgICAgIFwibm9uZVwiLFxuICAgICAgICBjYWxlbmRhcklkOiAgICAgICAgIGNhbFNlbGVjdC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgW10sXG4gICAgICAgIGxpbmtlZE5vdGVzOiAgICAgICAgW10sXG4gICAgICAgIHByb2plY3RzOiAgICAgICAgICAgW10sXG4gICAgICAgIHRpbWVFbnRyaWVzOiAgICAgICAgW10sXG4gICAgICAgIGN1c3RvbUZpZWxkczogICAgICAgW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogW10sXG4gICAgICB9KTtcbiAgICAgIGFsbFRhc2tzLnB1c2gobmV3VGFzayk7XG4gICAgICBsaW5rZWRJZHMucHVzaChuZXdUYXNrLmlkKTtcbiAgICAgIG5ld1Rhc2tJbnB1dC52YWx1ZSA9IFwiXCI7XG4gICAgICByZW5kZXJMaW5rZWRMaXN0KCk7XG4gICAgfTtcblxuICAgIGFkZFRhc2tCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNyZWF0ZUFuZExpbmspO1xuICAgIG5ld1Rhc2tJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXYpID0+IHtcbiAgICAgIGlmIChldi5rZXkgPT09IFwiRW50ZXJcIikgeyBldi5wcmV2ZW50RGVmYXVsdCgpOyBjcmVhdGVBbmRMaW5rKCk7IH1cbiAgICB9KTtcblxuICAgIC8vIE5vdGVzXG4gICAgY29uc3Qgbm90ZXNJbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJOb3Rlc1wiKS5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJjZi10ZXh0YXJlYVwiLCBwbGFjZWhvbGRlcjogXCJBZGQgbm90ZXMuLi5cIlxuICAgIH0pO1xuICAgIG5vdGVzSW5wdXQudmFsdWUgPSBlPy5ub3RlcyA/PyBcIlwiO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEFjdGlvbnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY2FuY2VsQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKEVWRU5UX0ZPUk1fVklFV19UWVBFKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0aXRsZSA9IHRpdGxlSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCF0aXRsZSkgeyB0aXRsZUlucHV0LmZvY3VzKCk7IHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpOyByZXR1cm47IH1cblxuICAgICAgY29uc3QgZXZlbnREYXRhID0ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgbG9jYXRpb246ICAgIGxvY2F0aW9uSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBhbGxEYXk6ICAgICAgYWxsRGF5VG9nZ2xlLmNoZWNrZWQsXG4gICAgICAgIHN0YXJ0RGF0ZTogICBzdGFydERhdGVJbnB1dC52YWx1ZSxcbiAgICAgICAgc3RhcnRUaW1lOiAgIGFsbERheVRvZ2dsZS5jaGVja2VkID8gdW5kZWZpbmVkIDogc3RhcnRUaW1lSW5wdXQudmFsdWUsXG4gICAgICAgIGVuZERhdGU6ICAgICBlbmREYXRlSW5wdXQudmFsdWUgfHwgc3RhcnREYXRlSW5wdXQudmFsdWUsXG4gICAgICAgIGVuZFRpbWU6ICAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IHVuZGVmaW5lZCA6IGVuZFRpbWVJbnB1dC52YWx1ZSxcbiAgICAgICAgcmVjdXJyZW5jZTogIHJlY1NlbGVjdC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGNhbGVuZGFySWQ6ICBjYWxTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBhbGVydDogICAgICAgYWxlcnRTZWxlY3QudmFsdWUgYXMgQWxlcnRPZmZzZXQsXG4gICAgICAgIG5vdGVzOiAgICAgICBub3Rlc0lucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgbGlua2VkTm90ZXM6IGxpbmtlZElucHV0LnZhbHVlID8gbGlua2VkSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiAoZT8ubGlua2VkTm90ZXMgPz8gW10pLFxuICAgICAgICB0YWdzOiAgICAgICAgdGFnc0lucHV0LnZhbHVlID8gdGFnc0lucHV0LnZhbHVlLnNwbGl0KFwiLFwiKS5tYXAocyA9PiBzLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pIDogKGU/LnRhZ3MgPz8gW10pLFxuICAgICAgICBsaW5rZWRUYXNrSWRzOiAgICAgIGxpbmtlZElkcyxcbiAgICAgICAgY29tcGxldGVkSW5zdGFuY2VzOiBlPy5jb21wbGV0ZWRJbnN0YW5jZXMgPz8gW10sXG4gICAgICB9O1xuXG4gICAgICBpZiAoZT8uaWQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIudXBkYXRlKHsgLi4uZSwgLi4uZXZlbnREYXRhIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuY3JlYXRlKGV2ZW50RGF0YSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoRVZFTlRfRk9STV9WSUVXX1RZUEUpO1xuICAgIH07XG5cbiAgICBzYXZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoYW5kbGVTYXZlKTtcbiAgICB0aXRsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldikgPT4ge1xuICAgICAgaWYgKGV2LmtleSA9PT0gXCJFbnRlclwiKSBoYW5kbGVTYXZlKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGZpZWxkKHBhcmVudDogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3Qgd3JhcCA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZi1maWVsZFwiKTtcbiAgICB3cmFwLmNyZWF0ZURpdihcImNmLWxhYmVsXCIpLnNldFRleHQobGFiZWwpO1xuICAgIHJldHVybiB3cmFwO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQ2hyb25pY2xlTGlzdCB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgTGlzdE1hbmFnZXIge1xuICBwcml2YXRlIGxpc3RzOiBDaHJvbmljbGVMaXN0W107XG4gIHByaXZhdGUgb25VcGRhdGU6ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IobGlzdHM6IENocm9uaWNsZUxpc3RbXSwgb25VcGRhdGU6ICgpID0+IHZvaWQpIHtcbiAgICB0aGlzLmxpc3RzICAgID0gbGlzdHM7XG4gICAgdGhpcy5vblVwZGF0ZSA9IG9uVXBkYXRlO1xuICB9XG5cbiAgZ2V0QWxsKCk6IENocm9uaWNsZUxpc3RbXSB7XG4gICAgcmV0dXJuIFsuLi50aGlzLmxpc3RzXTtcbiAgfVxuXG4gIGdldEJ5SWQoaWQ6IHN0cmluZyk6IENocm9uaWNsZUxpc3QgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmxpc3RzLmZpbmQoKGwpID0+IGwuaWQgPT09IGlkKTtcbiAgfVxuXG4gIGNyZWF0ZShuYW1lOiBzdHJpbmcsIGNvbG9yOiBzdHJpbmcpOiBDaHJvbmljbGVMaXN0IHtcbiAgICBjb25zdCBsaXN0OiBDaHJvbmljbGVMaXN0ID0ge1xuICAgICAgaWQ6ICAgICAgICB0aGlzLmdlbmVyYXRlSWQobmFtZSksXG4gICAgICBuYW1lLFxuICAgICAgY29sb3IsXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuICAgIHRoaXMubGlzdHMucHVzaChsaXN0KTtcbiAgICB0aGlzLm9uVXBkYXRlKCk7XG4gICAgcmV0dXJuIGxpc3Q7XG4gIH1cblxuICB1cGRhdGUoaWQ6IHN0cmluZywgY2hhbmdlczogUGFydGlhbDxDaHJvbmljbGVMaXN0Pik6IHZvaWQge1xuICAgIGNvbnN0IGlkeCA9IHRoaXMubGlzdHMuZmluZEluZGV4KChsKSA9PiBsLmlkID09PSBpZCk7XG4gICAgaWYgKGlkeCA9PT0gLTEpIHJldHVybjtcbiAgICB0aGlzLmxpc3RzW2lkeF0gPSB7IC4uLnRoaXMubGlzdHNbaWR4XSwgLi4uY2hhbmdlcyB9O1xuICAgIHRoaXMub25VcGRhdGUoKTtcbiAgfVxuXG4gIGRlbGV0ZShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgaWR4ID0gdGhpcy5saXN0cy5maW5kSW5kZXgoKGwpID0+IGwuaWQgPT09IGlkKTtcbiAgICBpZiAoaWR4ICE9PSAtMSkgdGhpcy5saXN0cy5zcGxpY2UoaWR4LCAxKTtcbiAgICB0aGlzLm9uVXBkYXRlKCk7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBiYXNlICAgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCBcIi1cIikucmVwbGFjZSgvW15hLXowLTktXS9nLCBcIlwiKTtcbiAgICBjb25zdCBzdWZmaXggPSBEYXRlLm5vdygpLnRvU3RyaW5nKDM2KTtcbiAgICByZXR1cm4gYCR7YmFzZX0tJHtzdWZmaXh9YDtcbiAgfVxufVxuIiwgImltcG9ydCB7IENocm9uaWNsZVRhc2ssIFRhc2tTdGF0dXMsIFRhc2tQcmlvcml0eSwgQWxlcnRPZmZzZXQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IEFwcCwgVEZpbGUsIG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIFRhc2tNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCwgcHJpdmF0ZSB0YXNrc0ZvbGRlcjogc3RyaW5nKSB7fVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBSZWFkIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIGFzeW5jIGdldEFsbCgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgdGFza3M6IENocm9uaWNsZVRhc2tbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSAmJiBjaGlsZC5leHRlbnNpb24gPT09IFwibWRcIikge1xuICAgICAgICBjb25zdCB0YXNrID0gYXdhaXQgdGhpcy5maWxlVG9UYXNrKGNoaWxkKTtcbiAgICAgICAgaWYgKHRhc2spIHRhc2tzLnB1c2godGFzayk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXNrcztcbiAgfVxuXG4gIGFzeW5jIGdldEJ5SWQoaWQ6IHN0cmluZyk6IFByb21pc2U8Q2hyb25pY2xlVGFzayB8IG51bGw+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmluZCgodCkgPT4gdC5pZCA9PT0gaWQpID8/IG51bGw7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgV3JpdGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgY3JlYXRlKHRhc2s6IE9taXQ8Q2hyb25pY2xlVGFzaywgXCJpZFwiIHwgXCJjcmVhdGVkQXRcIj4pOiBQcm9taXNlPENocm9uaWNsZVRhc2s+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcigpO1xuXG4gICAgY29uc3QgZnVsbDogQ2hyb25pY2xlVGFzayA9IHtcbiAgICAgIC4uLnRhc2ssXG4gICAgICBpZDogdGhpcy5nZW5lcmF0ZUlkKCksXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgY29uc3QgcGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy50YXNrc0ZvbGRlcn0vJHtmdWxsLnRpdGxlfS5tZGApO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCB0aGlzLnRhc2tUb01hcmtkb3duKGZ1bGwpKTtcbiAgICByZXR1cm4gZnVsbDtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZSh0YXNrOiBDaHJvbmljbGVUYXNrKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JUYXNrKHRhc2suaWQpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuO1xuXG4gICAgY29uc3QgZXhwZWN0ZWRQYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLnRhc2tzRm9sZGVyfS8ke3Rhc2sudGl0bGV9Lm1kYCk7XG4gICAgaWYgKGZpbGUucGF0aCAhPT0gZXhwZWN0ZWRQYXRoKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIGV4cGVjdGVkUGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKGV4cGVjdGVkUGF0aCkgPz8gZmlsZTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkodXBkYXRlZEZpbGUsIHRoaXMudGFza1RvTWFya2Rvd24odGFzaykpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvclRhc2soaWQpO1xuICAgIGlmIChmaWxlKSBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBtYXJrQ29tcGxldGUoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRhc2sgPSBhd2FpdCB0aGlzLmdldEJ5SWQoaWQpO1xuICAgIGlmICghdGFzaykgcmV0dXJuO1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHtcbiAgICAgIC4uLnRhc2ssXG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgY29tcGxldGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBGaWx0ZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIGFzeW5jIGdldER1ZVRvZGF5KCk6IFByb21pc2U8Q2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgdG9kYXkgPSB0aGlzLnRvZGF5U3RyKCk7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcihcbiAgICAgICh0KSA9PiB0LnN0YXR1cyAhPT0gXCJkb25lXCIgJiYgdC5zdGF0dXMgIT09IFwiY2FuY2VsbGVkXCIgJiYgdC5kdWVEYXRlID09PSB0b2RheVxuICAgICk7XG4gIH1cblxuICBhc3luYyBnZXRPdmVyZHVlKCk6IFByb21pc2U8Q2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgdG9kYXkgPSB0aGlzLnRvZGF5U3RyKCk7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcihcbiAgICAgICh0KSA9PiB0LnN0YXR1cyAhPT0gXCJkb25lXCIgJiYgdC5zdGF0dXMgIT09IFwiY2FuY2VsbGVkXCIgJiYgISF0LmR1ZURhdGUgJiYgdC5kdWVEYXRlIDwgdG9kYXlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgZ2V0U2NoZWR1bGVkKCk6IFByb21pc2U8Q2hyb25pY2xlVGFza1tdPiB7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcihcbiAgICAgICh0KSA9PiB0LnN0YXR1cyAhPT0gXCJkb25lXCIgJiYgdC5zdGF0dXMgIT09IFwiY2FuY2VsbGVkXCIgJiYgISF0LmR1ZURhdGVcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgZ2V0RmxhZ2dlZCgpOiBQcm9taXNlPENocm9uaWNsZVRhc2tbXT4ge1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoKHQpID0+IHQucHJpb3JpdHkgPT09IFwiaGlnaFwiICYmIHQuc3RhdHVzICE9PSBcImRvbmVcIik7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2VyaWFsaXNhdGlvbiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHRhc2tUb01hcmtkb3duKHRhc2s6IENocm9uaWNsZVRhc2spOiBzdHJpbmcge1xuICAgIGNvbnN0IGZtOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICAgIGlkOiAgICAgICAgICAgICAgICAgICAgdGFzay5pZCxcbiAgICAgIHRpdGxlOiAgICAgICAgICAgICAgICAgdGFzay50aXRsZSxcbiAgICAgIFwibG9jYXRpb25cIjogICAgICAgICAgICB0YXNrLmxvY2F0aW9uID8/IG51bGwsXG4gICAgICBzdGF0dXM6ICAgICAgICAgICAgICAgIHRhc2suc3RhdHVzLFxuICAgICAgcHJpb3JpdHk6ICAgICAgICAgICAgICB0YXNrLnByaW9yaXR5LFxuICAgICAgdGFnczogICAgICAgICAgICAgICAgICB0YXNrLnRhZ3MsXG4gICAgICBwcm9qZWN0czogICAgICAgICAgICAgIHRhc2sucHJvamVjdHMsXG4gICAgICBcImxpbmtlZC1ub3Rlc1wiOiAgICAgICAgdGFzay5saW5rZWROb3RlcyxcbiAgICAgIFwibGlzdC1pZFwiOiAgICAgICAgICAgICB0YXNrLmxpc3RJZCA/PyBudWxsLFxuICAgICAgXCJkdWUtZGF0ZVwiOiAgICAgICAgICAgIHRhc2suZHVlRGF0ZSA/PyBudWxsLFxuICAgICAgXCJkdWUtdGltZVwiOiAgICAgICAgICAgIHRhc2suZHVlVGltZSA/PyBudWxsLFxuICAgICAgcmVjdXJyZW5jZTogICAgICAgICAgICB0YXNrLnJlY3VycmVuY2UgPz8gbnVsbCxcbiAgICAgIFwiYWxlcnRcIjogICAgICAgICAgICAgICB0YXNrLmFsZXJ0ID8/IFwibm9uZVwiLFxuICAgICAgXCJ0aW1lLWVzdGltYXRlXCI6ICAgICAgIHRhc2sudGltZUVzdGltYXRlID8/IG51bGwsXG4gICAgICBcInRpbWUtZW50cmllc1wiOiAgICAgICAgdGFzay50aW1lRW50cmllcyxcbiAgICAgIFwiY3VzdG9tLWZpZWxkc1wiOiAgICAgICB0YXNrLmN1c3RvbUZpZWxkcyxcbiAgICAgIFwiY29tcGxldGVkLWluc3RhbmNlc1wiOiB0YXNrLmNvbXBsZXRlZEluc3RhbmNlcyxcbiAgICAgIFwiY3JlYXRlZC1hdFwiOiAgICAgICAgICB0YXNrLmNyZWF0ZWRBdCxcbiAgICAgIFwiY29tcGxldGVkLWF0XCI6ICAgICAgICB0YXNrLmNvbXBsZXRlZEF0ID8/IG51bGwsXG4gICAgfTtcblxuICAgIGNvbnN0IHlhbWwgPSBPYmplY3QuZW50cmllcyhmbSlcbiAgICAgIC5tYXAoKFtrLCB2XSkgPT4gYCR7a306ICR7SlNPTi5zdHJpbmdpZnkodil9YClcbiAgICAgIC5qb2luKFwiXFxuXCIpO1xuXG4gICAgY29uc3QgYm9keSA9IHRhc2subm90ZXMgPyBgXFxuJHt0YXNrLm5vdGVzfWAgOiBcIlwiO1xuICAgIHJldHVybiBgLS0tXFxuJHt5YW1sfVxcbi0tLVxcbiR7Ym9keX1gO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBmaWxlVG9UYXNrKGZpbGU6IFRGaWxlKTogUHJvbWlzZTxDaHJvbmljbGVUYXNrIHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgICAgY29uc3QgZm0gPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG4gICAgICBpZiAoIWZtPy5pZCB8fCAhZm0/LnRpdGxlKSByZXR1cm4gbnVsbDtcblxuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBjb25zdCBib2R5TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eLS0tXFxuW1xcc1xcU10qP1xcbi0tLVxcbihbXFxzXFxTXSopJC8pO1xuICAgICAgY29uc3Qgbm90ZXMgPSBib2R5TWF0Y2g/LlsxXT8udHJpbSgpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6ICAgICAgICAgICAgICAgICBmbS5pZCxcbiAgICAgICAgdGl0bGU6ICAgICAgICAgICAgICBmbS50aXRsZSxcbiAgICAgICAgbG9jYXRpb246ICAgICAgICAgICBmbS5sb2NhdGlvbiA/PyB1bmRlZmluZWQsXG4gICAgICAgIHN0YXR1czogICAgICAgICAgICAgKGZtLnN0YXR1cyBhcyBUYXNrU3RhdHVzKSA/PyBcInRvZG9cIixcbiAgICAgICAgcHJpb3JpdHk6ICAgICAgICAgICAoZm0ucHJpb3JpdHkgYXMgVGFza1ByaW9yaXR5KSA/PyBcIm5vbmVcIixcbiAgICAgICAgZHVlRGF0ZTogICAgICAgICAgICBmbVtcImR1ZS1kYXRlXCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgZHVlVGltZTogICAgICAgICAgICBmbVtcImR1ZS10aW1lXCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgcmVjdXJyZW5jZTogICAgICAgICBmbS5yZWN1cnJlbmNlID8/IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgICAgICAgICAoZm0uYWxlcnQgYXMgQWxlcnRPZmZzZXQpID8/IFwibm9uZVwiLFxuICAgICAgICAvLyByZWFkIG5ldyBsaXN0LWlkOyBmYWxsIGJhY2sgdG8gbGVnYWN5IGNhbGVuZGFyLWlkIHNvIG9sZCB0YXNrcyBzdGlsbCBzaG93IHRoZWlyIGxpc3RcbiAgICAgICAgbGlzdElkOiAgICAgICAgICAgICBmbVtcImxpc3QtaWRcIl0gPz8gZm1bXCJjYWxlbmRhci1pZFwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgZm0udGFncyA/PyBbXSxcbiAgICAgICAgbGlua2VkTm90ZXM6ICAgICAgICBmbVtcImxpbmtlZC1ub3Rlc1wiXSA/PyBbXSxcbiAgICAgICAgcHJvamVjdHM6ICAgICAgICAgICBmbS5wcm9qZWN0cyA/PyBbXSxcbiAgICAgICAgdGltZUVzdGltYXRlOiAgICAgICBmbVtcInRpbWUtZXN0aW1hdGVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICB0aW1lRW50cmllczogICAgICAgIGZtW1widGltZS1lbnRyaWVzXCJdID8/IFtdLFxuICAgICAgICBjdXN0b21GaWVsZHM6ICAgICAgIGZtW1wiY3VzdG9tLWZpZWxkc1wiXSA/PyBbXSxcbiAgICAgICAgY29tcGxldGVkSW5zdGFuY2VzOiBmbVtcImNvbXBsZXRlZC1pbnN0YW5jZXNcIl0gPz8gW10sXG4gICAgICAgIGNyZWF0ZWRBdDogICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgY29tcGxldGVkQXQ6ICAgICAgICBmbVtcImNvbXBsZXRlZC1hdFwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIG5vdGVzLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgZmluZEZpbGVGb3JUYXNrKGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIG51bGw7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmICghKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoY2hpbGQpO1xuICAgICAgaWYgKGNhY2hlPy5mcm9udG1hdHRlcj8uaWQgPT09IGlkKSByZXR1cm4gY2hpbGQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy50YXNrc0ZvbGRlcikpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcih0aGlzLnRhc2tzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYHRhc2stJHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA2KX1gO1xuICB9XG5cbiAgcHJpdmF0ZSB0b2RheVN0cigpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBURmlsZSwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlRXZlbnQsIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudE1hbmFnZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwLCBwcml2YXRlIGV2ZW50c0ZvbGRlcjogc3RyaW5nKSB7fVxuXG4gIGFzeW5jIGdldEFsbCgpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50W10+IHtcbiAgICBjb25zdCBmb2xkZXIgPSB0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy5ldmVudHNGb2xkZXIpO1xuICAgIGlmICghZm9sZGVyKSByZXR1cm4gW107XG5cbiAgICBjb25zdCBldmVudHM6IENocm9uaWNsZUV2ZW50W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbiAgICAgICAgY29uc3QgZXZlbnQgPSBhd2FpdCB0aGlzLmZpbGVUb0V2ZW50KGNoaWxkKTtcbiAgICAgICAgaWYgKGV2ZW50KSBldmVudHMucHVzaChldmVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBldmVudHM7XG4gIH1cblxuICBhc3luYyBjcmVhdGUoZXZlbnQ6IE9taXQ8Q2hyb25pY2xlRXZlbnQsIFwiaWRcIiB8IFwiY3JlYXRlZEF0XCI+KTogUHJvbWlzZTxDaHJvbmljbGVFdmVudD4ge1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKCk7XG5cbiAgICBjb25zdCBmdWxsOiBDaHJvbmljbGVFdmVudCA9IHtcbiAgICAgIC4uLmV2ZW50LFxuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZCgpLFxuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIGNvbnN0IHBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMuZXZlbnRzRm9sZGVyfS8ke2Z1bGwudGl0bGV9Lm1kYCk7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIHRoaXMuZXZlbnRUb01hcmtkb3duKGZ1bGwpKTtcbiAgICByZXR1cm4gZnVsbDtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZShldmVudDogQ2hyb25pY2xlRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvckV2ZW50KGV2ZW50LmlkKTtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcblxuICAgIGNvbnN0IGV4cGVjdGVkUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy5ldmVudHNGb2xkZXJ9LyR7ZXZlbnQudGl0bGV9Lm1kYCk7XG4gICAgaWYgKGZpbGUucGF0aCAhPT0gZXhwZWN0ZWRQYXRoKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIGV4cGVjdGVkUGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKGV4cGVjdGVkUGF0aCkgPz8gZmlsZTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkodXBkYXRlZEZpbGUsIHRoaXMuZXZlbnRUb01hcmtkb3duKGV2ZW50KSk7XG4gIH1cblxuICBhc3luYyBkZWxldGUoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbmRGaWxlRm9yRXZlbnQoaWQpO1xuICAgIGlmIChmaWxlKSBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBnZXRJblJhbmdlKHN0YXJ0RGF0ZTogc3RyaW5nLCBlbmREYXRlOiBzdHJpbmcpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50W10+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKChlKSA9PiBlLnN0YXJ0RGF0ZSA+PSBzdGFydERhdGUgJiYgZS5zdGFydERhdGUgPD0gZW5kRGF0ZSk7XG4gIH1cblxuLy8gRXhwYW5kcyByZWN1cnJpbmcgZXZlbnRzIGludG8gb2NjdXJyZW5jZXMgd2l0aGluIGEgZGF0ZSByYW5nZS5cbiAgLy8gUmV0dXJucyBhIGZsYXQgbGlzdCBvZiBDaHJvbmljbGVFdmVudCBvYmplY3RzLCBvbmUgcGVyIG9jY3VycmVuY2UsXG4gIC8vIGVhY2ggd2l0aCBzdGFydERhdGUvZW5kRGF0ZSBzZXQgdG8gdGhlIG9jY3VycmVuY2UgZGF0ZS5cbiAgYXN5bmMgZ2V0SW5SYW5nZVdpdGhSZWN1cnJlbmNlKHJhbmdlU3RhcnQ6IHN0cmluZywgcmFuZ2VFbmQ6IHN0cmluZyk6IFByb21pc2U8Q2hyb25pY2xlRXZlbnRbXT4ge1xuICAgIGNvbnN0IGFsbCAgICA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgY29uc3QgcmVzdWx0OiBDaHJvbmljbGVFdmVudFtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIGFsbCkge1xuICAgICAgaWYgKCFldmVudC5yZWN1cnJlbmNlKSB7XG4gICAgICAgIC8vIE5vbi1yZWN1cnJpbmcgXHUyMDE0IGluY2x1ZGUgaWYgaXQgZmFsbHMgaW4gcmFuZ2VcbiAgICAgICAgaWYgKGV2ZW50LnN0YXJ0RGF0ZSA+PSByYW5nZVN0YXJ0ICYmIGV2ZW50LnN0YXJ0RGF0ZSA8PSByYW5nZUVuZCkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gRXhwYW5kIHJlY3VycmVuY2Ugd2l0aGluIHJhbmdlXG4gICAgICBjb25zdCBvY2N1cnJlbmNlcyA9IHRoaXMuZXhwYW5kUmVjdXJyZW5jZShldmVudCwgcmFuZ2VTdGFydCwgcmFuZ2VFbmQpO1xuICAgICAgcmVzdWx0LnB1c2goLi4ub2NjdXJyZW5jZXMpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGV4cGFuZFJlY3VycmVuY2UoZXZlbnQ6IENocm9uaWNsZUV2ZW50LCByYW5nZVN0YXJ0OiBzdHJpbmcsIHJhbmdlRW5kOiBzdHJpbmcpOiBDaHJvbmljbGVFdmVudFtdIHtcbiAgICBjb25zdCByZXN1bHRzOiBDaHJvbmljbGVFdmVudFtdID0gW107XG4gICAgY29uc3QgcnVsZSA9IGV2ZW50LnJlY3VycmVuY2UgPz8gXCJcIjtcblxuICAgIC8vIFBhcnNlIFJSVUxFIHBhcnRzXG4gICAgY29uc3QgZnJlcSAgICA9IHRoaXMucnJ1bGVQYXJ0KHJ1bGUsIFwiRlJFUVwiKTtcbiAgICBjb25zdCBieURheSAgID0gdGhpcy5ycnVsZVBhcnQocnVsZSwgXCJCWURBWVwiKTtcbiAgICBjb25zdCB1bnRpbCAgID0gdGhpcy5ycnVsZVBhcnQocnVsZSwgXCJVTlRJTFwiKTtcbiAgICBjb25zdCBjb3VudFN0ciA9IHRoaXMucnJ1bGVQYXJ0KHJ1bGUsIFwiQ09VTlRcIik7XG4gICAgY29uc3QgY291bnQgICA9IGNvdW50U3RyID8gcGFyc2VJbnQoY291bnRTdHIpIDogOTk5O1xuXG4gICAgY29uc3Qgc3RhcnQgICA9IG5ldyBEYXRlKGV2ZW50LnN0YXJ0RGF0ZSArIFwiVDAwOjAwOjAwXCIpO1xuICAgIGNvbnN0IHJFbmQgICAgPSBuZXcgRGF0ZShyYW5nZUVuZCArIFwiVDAwOjAwOjAwXCIpO1xuICAgIGNvbnN0IHJTdGFydCAgPSBuZXcgRGF0ZShyYW5nZVN0YXJ0ICsgXCJUMDA6MDA6MDBcIik7XG4gICAgY29uc3QgdW50aWxEYXRlID0gdW50aWwgPyBuZXcgRGF0ZSh1bnRpbC5zbGljZSgwLDgpLnJlcGxhY2UoLyhcXGR7NH0pKFxcZHsyfSkoXFxkezJ9KS8sXCIkMS0kMi0kM1wiKSArIFwiVDAwOjAwOjAwXCIpIDogbnVsbDtcblxuICAgIGNvbnN0IGRheU5hbWVzID0gW1wiU1VcIixcIk1PXCIsXCJUVVwiLFwiV0VcIixcIlRIXCIsXCJGUlwiLFwiU0FcIl07XG4gICAgY29uc3QgYnlEYXlzICAgPSBieURheSA/IGJ5RGF5LnNwbGl0KFwiLFwiKSA6IFtdO1xuXG4gICAgbGV0IGN1cnJlbnQgICA9IG5ldyBEYXRlKHN0YXJ0KTtcbiAgICBsZXQgZ2VuZXJhdGVkID0gMDtcblxuICAgIHdoaWxlIChjdXJyZW50IDw9IHJFbmQgJiYgZ2VuZXJhdGVkIDwgY291bnQpIHtcbiAgICAgIGlmICh1bnRpbERhdGUgJiYgY3VycmVudCA+IHVudGlsRGF0ZSkgYnJlYWs7XG5cbiAgICAgIGNvbnN0IGRhdGVTdHIgPSBjdXJyZW50LnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgICAvLyBDYWxjdWxhdGUgZHVyYXRpb24gdG8gYXBwbHkgdG8gZWFjaCBvY2N1cnJlbmNlXG4gICAgICBjb25zdCBkdXJhdGlvbk1zID0gbmV3IERhdGUoZXZlbnQuZW5kRGF0ZSArIFwiVDAwOjAwOjAwXCIpLmdldFRpbWUoKSAtIHN0YXJ0LmdldFRpbWUoKTtcbiAgICAgIGNvbnN0IGVuZERhdGUgICAgPSBuZXcgRGF0ZShjdXJyZW50LmdldFRpbWUoKSArIGR1cmF0aW9uTXMpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgICBpZiAoY3VycmVudCA+PSByU3RhcnQgJiYgIWV2ZW50LmNvbXBsZXRlZEluc3RhbmNlcy5pbmNsdWRlcyhkYXRlU3RyKSkge1xuICAgICAgICByZXN1bHRzLnB1c2goeyAuLi5ldmVudCwgc3RhcnREYXRlOiBkYXRlU3RyLCBlbmREYXRlIH0pO1xuICAgICAgICBnZW5lcmF0ZWQrKztcbiAgICAgIH1cblxuICAgICAgLy8gQWR2YW5jZSB0byBuZXh0IG9jY3VycmVuY2VcbiAgICAgIGlmIChmcmVxID09PSBcIkRBSUxZXCIpIHtcbiAgICAgICAgY3VycmVudC5zZXREYXRlKGN1cnJlbnQuZ2V0RGF0ZSgpICsgMSk7XG4gICAgICB9IGVsc2UgaWYgKGZyZXEgPT09IFwiV0VFS0xZXCIpIHtcbiAgICAgICAgaWYgKGJ5RGF5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gRmluZCBuZXh0IG1hdGNoaW5nIHdlZWtkYXlcbiAgICAgICAgICBjdXJyZW50LnNldERhdGUoY3VycmVudC5nZXREYXRlKCkgKyAxKTtcbiAgICAgICAgICBsZXQgc2FmZXR5ID0gMDtcbiAgICAgICAgICB3aGlsZSAoIWJ5RGF5cy5pbmNsdWRlcyhkYXlOYW1lc1tjdXJyZW50LmdldERheSgpXSkgJiYgc2FmZXR5KysgPCA3KSB7XG4gICAgICAgICAgICBjdXJyZW50LnNldERhdGUoY3VycmVudC5nZXREYXRlKCkgKyAxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudC5zZXREYXRlKGN1cnJlbnQuZ2V0RGF0ZSgpICsgNyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZnJlcSA9PT0gXCJNT05USExZXCIpIHtcbiAgICAgICAgY3VycmVudC5zZXRNb250aChjdXJyZW50LmdldE1vbnRoKCkgKyAxKTtcbiAgICAgIH0gZWxzZSBpZiAoZnJlcSA9PT0gXCJZRUFSTFlcIikge1xuICAgICAgICBjdXJyZW50LnNldEZ1bGxZZWFyKGN1cnJlbnQuZ2V0RnVsbFllYXIoKSArIDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7IC8vIFVua25vd24gZnJlcSBcdTIwMTQgc3RvcCB0byBhdm9pZCBpbmZpbml0ZSBsb29wXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICBwcml2YXRlIHJydWxlUGFydChydWxlOiBzdHJpbmcsIGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXRjaCA9IHJ1bGUubWF0Y2gobmV3IFJlZ0V4cChgKD86Xnw7KSR7a2V5fT0oW147XSspYCkpO1xuICAgIHJldHVybiBtYXRjaCA/IG1hdGNoWzFdIDogXCJcIjtcbiAgfVxuXG4gIHByaXZhdGUgZXZlbnRUb01hcmtkb3duKGV2ZW50OiBDaHJvbmljbGVFdmVudCk6IHN0cmluZyB7XG4gICAgY29uc3QgZm06IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgICAgaWQ6ICAgICAgICAgICAgICAgICAgIGV2ZW50LmlkLFxuICAgICAgdGl0bGU6ICAgICAgICAgICAgICAgIGV2ZW50LnRpdGxlLFxuICAgICAgbG9jYXRpb246ICAgICAgICAgICAgIGV2ZW50LmxvY2F0aW9uID8/IG51bGwsXG4gICAgICBcImFsbC1kYXlcIjogICAgICAgICAgICBldmVudC5hbGxEYXksXG4gICAgICBcInN0YXJ0LWRhdGVcIjogICAgICAgICBldmVudC5zdGFydERhdGUsXG4gICAgICBcInN0YXJ0LXRpbWVcIjogICAgICAgICBldmVudC5zdGFydFRpbWUgPz8gbnVsbCxcbiAgICAgIFwiZW5kLWRhdGVcIjogICAgICAgICAgIGV2ZW50LmVuZERhdGUsXG4gICAgICBcImVuZC10aW1lXCI6ICAgICAgICAgICBldmVudC5lbmRUaW1lID8/IG51bGwsXG4gICAgICByZWN1cnJlbmNlOiAgICAgICAgICAgZXZlbnQucmVjdXJyZW5jZSA/PyBudWxsLFxuICAgICAgXCJjYWxlbmRhci1pZFwiOiAgICAgICAgZXZlbnQuY2FsZW5kYXJJZCA/PyBudWxsLFxuICAgICAgYWxlcnQ6ICAgICAgICAgICAgICAgIGV2ZW50LmFsZXJ0LFxuICAgICAgXCJ0YWdzXCI6ICAgICAgICAgICAgICAgZXZlbnQudGFncyA/PyBbXSxcbiAgICAgIFwibGlua2VkLW5vdGVzXCI6ICAgICAgIGV2ZW50LmxpbmtlZE5vdGVzID8/IFtdLFxuICAgICAgXCJsaW5rZWQtdGFzay1pZHNcIjogICAgZXZlbnQubGlua2VkVGFza0lkcyxcbiAgICAgIFwiY29tcGxldGVkLWluc3RhbmNlc1wiOiBldmVudC5jb21wbGV0ZWRJbnN0YW5jZXMsXG4gICAgICBcImNyZWF0ZWQtYXRcIjogICAgICAgICBldmVudC5jcmVhdGVkQXQsXG4gICAgfTtcblxuICAgIGNvbnN0IHlhbWwgPSBPYmplY3QuZW50cmllcyhmbSlcbiAgICAgIC5tYXAoKFtrLCB2XSkgPT4gYCR7a306ICR7SlNPTi5zdHJpbmdpZnkodil9YClcbiAgICAgIC5qb2luKFwiXFxuXCIpO1xuXG4gICAgY29uc3QgYm9keSA9IGV2ZW50Lm5vdGVzID8gYFxcbiR7ZXZlbnQubm90ZXN9YCA6IFwiXCI7XG4gICAgcmV0dXJuIGAtLS1cXG4ke3lhbWx9XFxuLS0tXFxuJHtib2R5fWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGZpbGVUb0V2ZW50KGZpbGU6IFRGaWxlKTogUHJvbWlzZTxDaHJvbmljbGVFdmVudCB8IG51bGw+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICAgIGNvbnN0IGZtID0gY2FjaGU/LmZyb250bWF0dGVyO1xuICAgICAgaWYgKCFmbT8uaWQgfHwgIWZtPy50aXRsZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgICAgY29uc3QgYm9keU1hdGNoID0gY29udGVudC5tYXRjaCgvXi0tLVxcbltcXHNcXFNdKj9cXG4tLS1cXG4oW1xcc1xcU10qKSQvKTtcbiAgICAgIGNvbnN0IG5vdGVzID0gYm9keU1hdGNoPy5bMV0/LnRyaW0oKSB8fCB1bmRlZmluZWQ7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkOiAgICAgICAgICAgICAgICAgICBmbS5pZCxcbiAgICAgICAgdGl0bGU6ICAgICAgICAgICAgICAgIGZtLnRpdGxlLFxuICAgICAgICBsb2NhdGlvbjogICAgICAgICAgICAgZm0ubG9jYXRpb24gPz8gdW5kZWZpbmVkLFxuICAgICAgICBhbGxEYXk6ICAgICAgICAgICAgICAgZm1bXCJhbGwtZGF5XCJdID8/IHRydWUsXG4gICAgICAgIHN0YXJ0RGF0ZTogICAgICAgICAgICBmbVtcInN0YXJ0LWRhdGVcIl0sXG4gICAgICAgIHN0YXJ0VGltZTogICAgICAgICAgICBmbVtcInN0YXJ0LXRpbWVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBlbmREYXRlOiAgICAgICAgICAgICAgZm1bXCJlbmQtZGF0ZVwiXSxcbiAgICAgICAgZW5kVGltZTogICAgICAgICAgICAgIGZtW1wiZW5kLXRpbWVcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICByZWN1cnJlbmNlOiAgICAgICAgICAgZm0ucmVjdXJyZW5jZSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGNhbGVuZGFySWQ6ICAgICAgICAgICBmbVtcImNhbGVuZGFyLWlkXCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgICAgICAgICAgIChmbS5hbGVydCBhcyBBbGVydE9mZnNldCkgPz8gXCJub25lXCIsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgICBmbVtcInRhZ3NcIl0gPz8gW10sXG4gICAgICAgIGxpbmtlZE5vdGVzOiAgICAgICAgICBmbVtcImxpbmtlZC1ub3Rlc1wiXSA/PyBbXSxcbiAgICAgICAgbGlua2VkVGFza0lkczogICAgICAgIGZtW1wibGlua2VkLXRhc2staWRzXCJdID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6ICAgZm1bXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCJdID8/IFtdLFxuICAgICAgICBjcmVhdGVkQXQ6ICAgICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgbm90ZXMsXG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5kRmlsZUZvckV2ZW50KGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLmV2ZW50c0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBudWxsO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoIShjaGlsZCBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGNoaWxkKTtcbiAgICAgIGlmIChjYWNoZT8uZnJvbnRtYXR0ZXI/LmlkID09PSBpZCkgcmV0dXJuIGNoaWxkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMuZXZlbnRzRm9sZGVyKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKHRoaXMuZXZlbnRzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGV2ZW50LSR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNil9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgVGFza01vZGFsIH0gZnJvbSBcIi4uL3VpL1Rhc2tNb2RhbFwiO1xuaW1wb3J0IHsgVGFza0RldGFpbFBvcHVwIH0gZnJvbSBcIi4uL3VpL1Rhc2tEZXRhaWxQb3B1cFwiO1xuaW1wb3J0IHR5cGUgQ2hyb25pY2xlUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVUYXNrIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL1Rhc2tNYW5hZ2VyXCI7XG5pbXBvcnQgeyBMaXN0TWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0xpc3RNYW5hZ2VyXCI7XG5pbXBvcnQgeyBUYXNrRm9ybVZpZXcsIFRBU0tfRk9STV9WSUVXX1RZUEUgfSBmcm9tIFwiLi9UYXNrRm9ybVZpZXdcIjtcblxuZXhwb3J0IGNvbnN0IFRBU0tfVklFV19UWVBFID0gXCJjaHJvbmljbGUtdGFzay12aWV3XCI7XG5cbmV4cG9ydCBjbGFzcyBUYXNrVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSB0YXNrTWFuYWdlcjogVGFza01hbmFnZXI7XG4gIHByaXZhdGUgbGlzdE1hbmFnZXI6IExpc3RNYW5hZ2VyO1xuICBwcml2YXRlIHBsdWdpbjogQ2hyb25pY2xlUGx1Z2luO1xuICBwcml2YXRlIGN1cnJlbnRMaXN0SWQ6IHN0cmluZyA9IFwidG9kYXlcIjtcbiAgcHJpdmF0ZSBfcmVuZGVyVmVyc2lvbiA9IDA7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbGVhZjogV29ya3NwYWNlTGVhZixcbiAgICB0YXNrTWFuYWdlcjogVGFza01hbmFnZXIsXG4gICAgbGlzdE1hbmFnZXI6IExpc3RNYW5hZ2VyLFxuICAgIHBsdWdpbjogQ2hyb25pY2xlUGx1Z2luXG4gICkge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMudGFza01hbmFnZXIgPSB0YXNrTWFuYWdlcjtcbiAgICB0aGlzLmxpc3RNYW5hZ2VyID0gbGlzdE1hbmFnZXI7XG4gICAgdGhpcy5wbHVnaW4gICAgICA9IHBsdWdpbjtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7IHJldHVybiBUQVNLX1ZJRVdfVFlQRTsgfVxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gXCJSZW1pbmRlcnNcIjsgfVxuICBnZXRJY29uKCk6IHN0cmluZyB7IHJldHVybiBcImNoZWNrLWNpcmNsZVwiOyB9XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKSkge1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICAodGhpcy5hcHAud29ya3NwYWNlIGFzIGFueSkub24oXCJjaHJvbmljbGU6c2V0dGluZ3MtY2hhbmdlZFwiLCAoKSA9PiB0aGlzLnJlbmRlcigpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAudmF1bHQub24oXCJjcmVhdGVcIiwgKGZpbGUpID0+IHtcbiAgICAgICAgaWYgKGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMudGFza01hbmFnZXJbXCJ0YXNrc0ZvbGRlclwiXSkpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMucmVuZGVyKCksIDIwMCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC52YXVsdC5vbihcImRlbGV0ZVwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKSkge1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHJlbmRlcigpIHtcbiAgICBjb25zdCB2ZXJzaW9uID0gKyt0aGlzLl9yZW5kZXJWZXJzaW9uO1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29udGFpbmVyLmVtcHR5KCk7XG4gICAgY29udGFpbmVyLmFkZENsYXNzKFwiY2hyb25pY2xlLWFwcFwiKTtcblxuICAgIGNvbnN0IGFsbCAgICAgICA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0QWxsKCk7XG4gICAgY29uc3QgdG9kYXkgICAgID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXREdWVUb2RheSgpO1xuICAgIGNvbnN0IHNjaGVkdWxlZCA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0U2NoZWR1bGVkKCk7XG4gICAgY29uc3QgZmxhZ2dlZCAgID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRGbGFnZ2VkKCk7XG4gICAgY29uc3Qgb3ZlcmR1ZSAgID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRPdmVyZHVlKCk7XG4gICAgY29uc3QgbGlzdHMgICAgID0gdGhpcy5saXN0TWFuYWdlci5nZXRBbGwoKTtcblxuICAgIGlmICh0aGlzLl9yZW5kZXJWZXJzaW9uICE9PSB2ZXJzaW9uKSByZXR1cm47XG5cbiAgICBjb25zdCBsYXlvdXQgID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1sYXlvdXRcIik7XG4gICAgY29uc3Qgc2lkZWJhciA9IGxheW91dC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtc2lkZWJhclwiKTtcbiAgICBjb25zdCBtYWluICAgID0gbGF5b3V0LmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluXCIpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE5ldyB0YXNrIGJ1dHRvbiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBuZXdUYXNrQnRuID0gc2lkZWJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiY2hyb25pY2xlLW5ldy10YXNrLWJ0blwiLCB0ZXh0OiBcIk5ldyB0YXNrXCJcbiAgICB9KTtcbiAgICBuZXdUYXNrQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLm9wZW5UYXNrRm9ybSgpKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBTbWFydCBsaXN0IHRpbGVzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHRpbGVzR3JpZCA9IHNpZGViYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGVzXCIpO1xuXG4gICAgY29uc3QgdGlsZXMgPSBbXG4gICAgICB7IGlkOiBcInRvZGF5XCIsICAgICBsYWJlbDogXCJUb2RheVwiLCAgICAgY291bnQ6IHRvZGF5Lmxlbmd0aCArIG92ZXJkdWUubGVuZ3RoLCBjb2xvcjogXCIjRkYzQjMwXCIsIGJhZGdlOiBvdmVyZHVlLmxlbmd0aCB9LFxuICAgICAgeyBpZDogXCJzY2hlZHVsZWRcIiwgbGFiZWw6IFwiU2NoZWR1bGVkXCIsIGNvdW50OiBzY2hlZHVsZWQubGVuZ3RoLCAgICAgICAgICAgICAgY29sb3I6IFwiIzM3OEFERFwiLCBiYWRnZTogMCB9LFxuICAgICAgeyBpZDogXCJhbGxcIiwgICAgICAgbGFiZWw6IFwiQWxsXCIsICAgICAgIGNvdW50OiBhbGwuZmlsdGVyKHQgPT4gdC5zdGF0dXMgIT09IFwiZG9uZVwiKS5sZW5ndGgsIGNvbG9yOiBcIiM2MzYzNjZcIiwgYmFkZ2U6IDAgfSxcbiAgICAgIHsgaWQ6IFwiZmxhZ2dlZFwiLCAgIGxhYmVsOiBcIkZsYWdnZWRcIiwgICBjb3VudDogZmxhZ2dlZC5sZW5ndGgsICAgICAgICAgICAgICAgIGNvbG9yOiBcIiNGRjk1MDBcIiwgYmFkZ2U6IDAgfSxcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCB0aWxlIG9mIHRpbGVzKSB7XG4gICAgICBjb25zdCB0ID0gdGlsZXNHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlXCIpO1xuICAgICAgdC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aWxlLmNvbG9yO1xuICAgICAgaWYgKHRpbGUuaWQgPT09IHRoaXMuY3VycmVudExpc3RJZCkgdC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcblxuICAgICAgY29uc3QgdG9wUm93ID0gdC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGlsZS10b3BcIik7XG4gICAgICB0b3BSb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtY291bnRcIikuc2V0VGV4dChTdHJpbmcodGlsZS5jb3VudCkpO1xuXG4gICAgICBpZiAodGlsZS5iYWRnZSA+IDApIHtcbiAgICAgICAgY29uc3QgYmFkZ2UgPSB0b3BSb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtYmFkZ2VcIik7XG4gICAgICAgIGJhZGdlLnNldFRleHQoU3RyaW5nKHRpbGUuYmFkZ2UpKTtcbiAgICAgICAgYmFkZ2UudGl0bGUgPSBgJHt0aWxlLmJhZGdlfSBvdmVyZHVlYDtcbiAgICAgIH1cblxuICAgICAgdC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGlsZS1sYWJlbFwiKS5zZXRUZXh0KHRpbGUubGFiZWwpO1xuICAgICAgdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmN1cnJlbnRMaXN0SWQgPSB0aWxlLmlkOyB0aGlzLnJlbmRlcigpOyB9KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQ29tcGxldGVkIGFyY2hpdmUgZW50cnkgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgY29tcGxldGVkUm93ID0gc2lkZWJhci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1yb3dcIik7XG4gICAgaWYgKHRoaXMuY3VycmVudExpc3RJZCA9PT0gXCJjb21wbGV0ZWRcIikgY29tcGxldGVkUm93LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuICAgIGNvbnN0IGNvbXBsZXRlZEljb24gPSBjb21wbGV0ZWRSb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbXBsZXRlZC1pY29uXCIpO1xuICAgIGNvbXBsZXRlZEljb24uaW5uZXJIVE1MID0gYDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPjxwYXRoIGQ9XCJNMjIgMTEuMDhWMTJhMTAgMTAgMCAxIDEtNS45My05LjE0XCIvPjxwb2x5bGluZSBwb2ludHM9XCIyMiA0IDEyIDE0LjAxIDkgMTEuMDFcIi8+PC9zdmc+YDtcbiAgICBjb21wbGV0ZWRSb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3QtbmFtZVwiKS5zZXRUZXh0KFwiQ29tcGxldGVkXCIpO1xuICAgIGNvbnN0IGNvbXBsZXRlZENvdW50ID0gYWxsLmZpbHRlcih0ID0+IHQuc3RhdHVzID09PSBcImRvbmVcIikubGVuZ3RoO1xuICAgIGlmIChjb21wbGV0ZWRDb3VudCA+IDApIGNvbXBsZXRlZFJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1jb3VudFwiKS5zZXRUZXh0KFN0cmluZyhjb21wbGV0ZWRDb3VudCkpO1xuICAgIGNvbXBsZXRlZFJvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmN1cnJlbnRMaXN0SWQgPSBcImNvbXBsZXRlZFwiOyB0aGlzLnJlbmRlcigpOyB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBNeSBMaXN0cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBsaXN0c1NlY3Rpb24gPSBzaWRlYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0cy1zZWN0aW9uXCIpO1xuICAgIGxpc3RzU2VjdGlvbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtc2VjdGlvbi1sYWJlbFwiKS5zZXRUZXh0KFwiTXkgTGlzdHNcIik7XG5cbiAgICBmb3IgKGNvbnN0IGxpc3Qgb2YgbGlzdHMpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGxpc3RzU2VjdGlvbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1yb3dcIik7XG4gICAgICBpZiAobGlzdC5pZCA9PT0gdGhpcy5jdXJyZW50TGlzdElkKSByb3cuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG5cbiAgICAgIGNvbnN0IGRvdCA9IHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1kb3RcIik7XG4gICAgICBkb3Quc3R5bGUuYmFja2dyb3VuZENvbG9yID0gbGlzdC5jb2xvcjtcblxuICAgICAgcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LW5hbWVcIikuc2V0VGV4dChsaXN0Lm5hbWUpO1xuXG4gICAgICBjb25zdCBsaXN0Q291bnQgPSBhbGwuZmlsdGVyKHQgPT4gdC5saXN0SWQgPT09IGxpc3QuaWQgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKS5sZW5ndGg7XG4gICAgICBpZiAobGlzdENvdW50ID4gMCkgcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LWNvdW50XCIpLnNldFRleHQoU3RyaW5nKGxpc3RDb3VudCkpO1xuXG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50TGlzdElkID0gbGlzdC5pZDsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE1haW4gcGFuZWwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgYXdhaXQgdGhpcy5yZW5kZXJNYWluUGFuZWwobWFpbiwgYWxsLCBvdmVyZHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVuZGVyTWFpblBhbmVsKFxuICAgIG1haW46IEhUTUxFbGVtZW50LFxuICAgIGFsbDogQ2hyb25pY2xlVGFza1tdLFxuICAgIG92ZXJkdWU6IENocm9uaWNsZVRhc2tbXVxuICApIHtcbiAgICBjb25zdCBoZWFkZXIgID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWFpbi1oZWFkZXJcIik7XG4gICAgY29uc3QgdGl0bGVFbCA9IGhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWFpbi10aXRsZVwiKTtcblxuICAgIGxldCB0YXNrczogQ2hyb25pY2xlVGFza1tdID0gW107XG5cbiAgICBjb25zdCBzbWFydENvbG9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgIHRvZGF5OiBcIiNGRjNCMzBcIiwgc2NoZWR1bGVkOiBcIiMzNzhBRERcIiwgYWxsOiBcIiM2MzYzNjZcIixcbiAgICAgIGZsYWdnZWQ6IFwiI0ZGOTUwMFwiLCBjb21wbGV0ZWQ6IFwiIzM0Qzc1OVwiXG4gICAgfTtcblxuICAgIGlmIChzbWFydENvbG9yc1t0aGlzLmN1cnJlbnRMaXN0SWRdKSB7XG4gICAgICBjb25zdCBsYWJlbHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICAgIHRvZGF5OiBcIlRvZGF5XCIsIHNjaGVkdWxlZDogXCJTY2hlZHVsZWRcIiwgYWxsOiBcIkFsbFwiLFxuICAgICAgICBmbGFnZ2VkOiBcIkZsYWdnZWRcIiwgY29tcGxldGVkOiBcIkNvbXBsZXRlZFwiXG4gICAgICB9O1xuICAgICAgdGl0bGVFbC5zZXRUZXh0KGxhYmVsc1t0aGlzLmN1cnJlbnRMaXN0SWRdKTtcbiAgICAgIHRpdGxlRWwuc3R5bGUuY29sb3IgPSBzbWFydENvbG9yc1t0aGlzLmN1cnJlbnRMaXN0SWRdO1xuXG4gICAgICBzd2l0Y2ggKHRoaXMuY3VycmVudExpc3RJZCkge1xuICAgICAgICBjYXNlIFwidG9kYXlcIjpcbiAgICAgICAgICB0YXNrcyA9IFsuLi5vdmVyZHVlLCAuLi4oYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXREdWVUb2RheSgpKV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzY2hlZHVsZWRcIjpcbiAgICAgICAgICB0YXNrcyA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0U2NoZWR1bGVkKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJmbGFnZ2VkXCI6XG4gICAgICAgICAgdGFza3MgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEZsYWdnZWQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImFsbFwiOlxuICAgICAgICAgIHRhc2tzID0gYWxsLmZpbHRlcih0ID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJjb21wbGV0ZWRcIjpcbiAgICAgICAgICB0YXNrcyA9IGFsbC5maWx0ZXIodCA9PiB0LnN0YXR1cyA9PT0gXCJkb25lXCIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBsaXN0ID0gdGhpcy5saXN0TWFuYWdlci5nZXRCeUlkKHRoaXMuY3VycmVudExpc3RJZCk7XG4gICAgICB0aXRsZUVsLnNldFRleHQobGlzdD8ubmFtZSA/PyBcIkxpc3RcIik7XG4gICAgICB0aXRsZUVsLnN0eWxlLmNvbG9yID0gbGlzdCA/IGxpc3QuY29sb3IgOiBcInZhcigtLXRleHQtbm9ybWFsKVwiO1xuICAgICAgdGFza3MgPSBhbGwuZmlsdGVyKHQgPT4gdC5saXN0SWQgPT09IHRoaXMuY3VycmVudExpc3RJZCAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGlzQ29tcGxldGVkID0gdGhpcy5jdXJyZW50TGlzdElkID09PSBcImNvbXBsZXRlZFwiO1xuICAgIGNvbnN0IGNvdW50VGFza3MgID0gaXNDb21wbGV0ZWQgPyB0YXNrcyA6IHRhc2tzLmZpbHRlcih0ID0+IHQuc3RhdHVzICE9PSBcImRvbmVcIik7XG4gICAgY29uc3Qgc2hvd1N1YnRpdGxlID0gdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1Rhc2tDb3VudFN1YnRpdGxlID8/IHRydWU7XG4gICAgaWYgKGNvdW50VGFza3MubGVuZ3RoID4gMCAmJiBzaG93U3VidGl0bGUpIHtcbiAgICAgIGNvbnN0IHN1YnRpdGxlID0gaGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluLXN1YnRpdGxlXCIpO1xuICAgICAgaWYgKGlzQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IGNsZWFyQnRuID0gc3VidGl0bGUuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIGNsczogXCJjaHJvbmljbGUtY2xlYXItYnRuXCIsIHRleHQ6IFwiQ2xlYXIgYWxsXCJcbiAgICAgICAgfSk7XG4gICAgICAgIGNsZWFyQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgYWxsMiA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0QWxsKCk7XG4gICAgICAgICAgZm9yIChjb25zdCB0IG9mIGFsbDIuZmlsdGVyKHQgPT4gdC5zdGF0dXMgPT09IFwiZG9uZVwiKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5kZWxldGUodC5pZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3VidGl0bGUuc2V0VGV4dChcbiAgICAgICAgICBgJHtjb3VudFRhc2tzLmxlbmd0aH0gJHtjb3VudFRhc2tzLmxlbmd0aCA9PT0gMSA/IFwidGFza1wiIDogXCJ0YXNrc1wifWBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBsaXN0RWwgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLWxpc3RcIik7XG5cbiAgICBpZiAodGFza3MubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnJlbmRlckVtcHR5U3RhdGUobGlzdEVsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZ3JvdXBzID0gdGhpcy5ncm91cFRhc2tzKHRhc2tzKTtcbiAgICAgIGZvciAoY29uc3QgW2dyb3VwLCBncm91cFRhc2tzXSBvZiBPYmplY3QuZW50cmllcyhncm91cHMpKSB7XG4gICAgICAgIGlmIChncm91cFRhc2tzLmxlbmd0aCA9PT0gMCkgY29udGludWU7XG4gICAgICAgIGxpc3RFbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZ3JvdXAtbGFiZWxcIikuc2V0VGV4dChncm91cCk7XG4gICAgICAgIGNvbnN0IGNhcmQgPSBsaXN0RWwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stY2FyZC1ncm91cFwiKTtcbiAgICAgICAgZm9yIChjb25zdCB0YXNrIG9mIGdyb3VwVGFza3MpIHtcbiAgICAgICAgICB0aGlzLnJlbmRlclRhc2tSb3coY2FyZCwgdGFzayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckVtcHR5U3RhdGUoY29udGFpbmVyOiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IGVtcHR5ID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1lbXB0eS1zdGF0ZVwiKTtcbiAgICBjb25zdCBpY29uICA9IGVtcHR5LmNyZWF0ZURpdihcImNocm9uaWNsZS1lbXB0eS1pY29uXCIpO1xuICAgIGljb24uaW5uZXJIVE1MID0gYDxzdmcgd2lkdGg9XCI0OFwiIGhlaWdodD1cIjQ4XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS4yXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+PHBhdGggZD1cIk0yMiAxMS4wOFYxMmExMCAxMCAwIDEgMS01LjkzLTkuMTRcIi8+PHBvbHlsaW5lIHBvaW50cz1cIjIyIDQgMTIgMTQuMDEgOSAxMS4wMVwiLz48L3N2Zz5gO1xuICAgIGVtcHR5LmNyZWF0ZURpdihcImNocm9uaWNsZS1lbXB0eS10aXRsZVwiKS5zZXRUZXh0KFwiQWxsIGRvbmVcIik7XG4gICAgZW1wdHkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWVtcHR5LXN1YnRpdGxlXCIpLnNldFRleHQoXCJOb3RoaW5nIGxlZnQgaW4gdGhpcyBsaXN0LlwiKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyVGFza1Jvdyhjb250YWluZXI6IEhUTUxFbGVtZW50LCB0YXNrOiBDaHJvbmljbGVUYXNrKSB7XG4gICAgY29uc3Qgcm93ICAgICAgID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLXJvd1wiKTtcbiAgICBjb25zdCBpc0RvbmUgICAgPSB0YXNrLnN0YXR1cyA9PT0gXCJkb25lXCI7XG4gICAgY29uc3QgaXNBcmNoaXZlID0gdGhpcy5jdXJyZW50TGlzdElkID09PSBcImNvbXBsZXRlZFwiO1xuXG4gICAgLy8gQ2hlY2tib3hcbiAgICBjb25zdCBjaGVja2JveFdyYXAgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNoZWNrYm94LXdyYXBcIik7XG4gICAgY29uc3QgY2hlY2tib3ggICAgID0gY2hlY2tib3hXcmFwLmNyZWF0ZURpdihcImNocm9uaWNsZS1jaGVja2JveFwiKTtcbiAgICBpZiAoaXNEb25lKSBjaGVja2JveC5hZGRDbGFzcyhcImRvbmVcIik7XG4gICAgY2hlY2tib3guaW5uZXJIVE1MID0gYDxzdmcgY2xhc3M9XCJjaHJvbmljbGUtY2hlY2ttYXJrXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiI2ZmZlwiIHN0cm9rZS13aWR0aD1cIjNcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIj48cG9seWxpbmUgcG9pbnRzPVwiMjAgNiA5IDE3IDQgMTJcIi8+PC9zdmc+YDtcblxuICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoZSkgPT4ge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGNoZWNrYm94LmFkZENsYXNzKFwiY29tcGxldGluZ1wiKTtcbiAgICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLnVwZGF0ZSh7XG4gICAgICAgICAgLi4udGFzayxcbiAgICAgICAgICBzdGF0dXM6ICAgICAgaXNEb25lID8gXCJ0b2RvXCIgOiBcImRvbmVcIixcbiAgICAgICAgICBjb21wbGV0ZWRBdDogaXNEb25lID8gdW5kZWZpbmVkIDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICB9KTtcbiAgICAgIH0sIDMwMCk7XG4gICAgfSk7XG5cbiAgICAvLyBDb250ZW50XG4gICAgY29uc3QgY29udGVudCA9IHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1jb250ZW50XCIpO1xuICAgIGlmICghaXNBcmNoaXZlKSBjb250ZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBuZXcgVGFza0RldGFpbFBvcHVwKFxuICAgICAgICB0aGlzLmFwcCwgdGFzaywgdGhpcy5saXN0TWFuYWdlcixcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MudGltZUZvcm1hdCxcbiAgICAgICAgKCkgPT4gdGhpcy5vcGVuVGFza0Zvcm0odGFzaylcbiAgICAgICkub3BlbigpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgdGl0bGVFbCA9IGNvbnRlbnQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stdGl0bGVcIik7XG4gICAgdGl0bGVFbC5zZXRUZXh0KHRhc2sudGl0bGUpO1xuICAgIGlmIChpc0RvbmUpIHRpdGxlRWwuYWRkQ2xhc3MoXCJkb25lXCIpO1xuXG4gICAgLy8gTWV0YSByb3dcbiAgICBjb25zdCB0b2RheVN0ciA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgbWV0YVJvdyAgPSBjb250ZW50LmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLW1ldGFcIik7XG5cbiAgICBpZiAoaXNBcmNoaXZlICYmIHRhc2suY29tcGxldGVkQXQpIHtcbiAgICAgIGNvbnN0IGNvbXBsZXRlZERhdGUgPSBuZXcgRGF0ZSh0YXNrLmNvbXBsZXRlZEF0KTtcbiAgICAgIG1ldGFSb3cuY3JlYXRlU3BhbihcImNocm9uaWNsZS10YXNrLWRhdGVcIikuc2V0VGV4dChcbiAgICAgICAgXCJDb21wbGV0ZWQgXCIgKyBjb21wbGV0ZWREYXRlLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHtcbiAgICAgICAgICBtb250aDogXCJzaG9ydFwiLCBkYXk6IFwibnVtZXJpY1wiLCB5ZWFyOiBcIm51bWVyaWNcIlxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHRhc2suZHVlRGF0ZSB8fCB0YXNrLmxpc3RJZCkge1xuICAgICAgaWYgKHRhc2suZHVlRGF0ZSkge1xuICAgICAgICBjb25zdCBtZXRhRGF0ZSA9IG1ldGFSb3cuY3JlYXRlU3BhbihcImNocm9uaWNsZS10YXNrLWRhdGVcIik7XG4gICAgICAgIG1ldGFEYXRlLnNldFRleHQodGhpcy5mb3JtYXREYXRlKHRhc2suZHVlRGF0ZSkpO1xuICAgICAgICBpZiAodGFzay5kdWVEYXRlIDwgdG9kYXlTdHIpIG1ldGFEYXRlLmFkZENsYXNzKFwib3ZlcmR1ZVwiKTtcbiAgICAgIH1cbiAgICAgIGlmICh0YXNrLmxpc3RJZCkge1xuICAgICAgICBjb25zdCBsaXN0ID0gdGhpcy5saXN0TWFuYWdlci5nZXRCeUlkKHRhc2subGlzdElkKTtcbiAgICAgICAgaWYgKGxpc3QpIHtcbiAgICAgICAgICBjb25zdCBsaXN0RG90ID0gbWV0YVJvdy5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXRhc2stY2FsLWRvdFwiKTtcbiAgICAgICAgICBsaXN0RG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGxpc3QuY29sb3I7XG4gICAgICAgICAgbWV0YVJvdy5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXRhc2stY2FsLW5hbWVcIikuc2V0VGV4dChsaXN0Lm5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUHJpb3JpdHkgZmxhZ1xuICAgIGlmICghaXNBcmNoaXZlICYmIHRhc2sucHJpb3JpdHkgPT09IFwiaGlnaFwiKSB7XG4gICAgICByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWZsYWdcIikuc2V0VGV4dChcIlx1MjY5MVwiKTtcbiAgICB9XG5cbiAgICAvLyBBcmNoaXZlIGFjdGlvbnNcbiAgICBpZiAoaXNBcmNoaXZlKSB7XG4gICAgICBjb25zdCBhY3Rpb25zID0gcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1hcmNoaXZlLWFjdGlvbnNcIik7XG4gICAgICBjb25zdCByZXN0b3JlQnRuID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjaHJvbmljbGUtYXJjaGl2ZS1idG5cIiwgdGV4dDogXCJSZXN0b3JlXCIgfSk7XG4gICAgICByZXN0b3JlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLnVwZGF0ZSh7IC4uLnRhc2ssIHN0YXR1czogXCJ0b2RvXCIsIGNvbXBsZXRlZEF0OiB1bmRlZmluZWQgfSk7XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRlbGV0ZUJ0biA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2hyb25pY2xlLWFyY2hpdmUtYnRuIGNocm9uaWNsZS1hcmNoaXZlLWJ0bi1kZWxldGVcIiwgdGV4dDogXCJEZWxldGVcIiB9KTtcbiAgICAgIGRlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5kZWxldGUodGFzay5pZCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSaWdodC1jbGljayBjb250ZXh0IG1lbnVcbiAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBtZW51ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG1lbnUuY2xhc3NOYW1lICA9IFwiY2hyb25pY2xlLWNvbnRleHQtbWVudVwiO1xuICAgICAgbWVudS5zdHlsZS5sZWZ0ID0gYCR7ZS5jbGllbnRYfXB4YDtcbiAgICAgIG1lbnUuc3R5bGUudG9wICA9IGAke2UuY2xpZW50WX1weGA7XG5cbiAgICAgIGNvbnN0IGVkaXRJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtXCIpO1xuICAgICAgZWRpdEl0ZW0uc2V0VGV4dChcIkVkaXQgdGFza1wiKTtcbiAgICAgIGVkaXRJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IG1lbnUucmVtb3ZlKCk7IHRoaXMub3BlblRhc2tGb3JtKHRhc2spOyB9KTtcblxuICAgICAgY29uc3QgZGVsZXRlSXRlbSA9IG1lbnUuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbnRleHQtaXRlbSBjaHJvbmljbGUtY29udGV4dC1kZWxldGVcIik7XG4gICAgICBkZWxldGVJdGVtLnNldFRleHQoXCJEZWxldGUgdGFza1wiKTtcbiAgICAgIGRlbGV0ZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHsgbWVudS5yZW1vdmUoKTsgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5kZWxldGUodGFzay5pZCk7IH0pO1xuXG4gICAgICBjb25zdCBjYW5jZWxJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtXCIpO1xuICAgICAgY2FuY2VsSXRlbS5zZXRUZXh0KFwiQ2FuY2VsXCIpO1xuICAgICAgY2FuY2VsSXRlbS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gbWVudS5yZW1vdmUoKSk7XG5cbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobWVudSk7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBtZW51LnJlbW92ZSgpLCB7IG9uY2U6IHRydWUgfSksIDApO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBncm91cFRhc2tzKHRhc2tzOiBDaHJvbmljbGVUYXNrW10pOiBSZWNvcmQ8c3RyaW5nLCBDaHJvbmljbGVUYXNrW10+IHtcbiAgICBjb25zdCB0b2RheSAgICA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgbmV4dFdlZWsgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgNyAqIDg2NDAwMDAwKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCB3ZWVrQWdvICA9IG5ldyBEYXRlKERhdGUubm93KCkgLSA3ICogODY0MDAwMDApLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgaWYgKHRoaXMuY3VycmVudExpc3RJZCA9PT0gXCJjb21wbGV0ZWRcIikge1xuICAgICAgY29uc3QgZ3JvdXBzOiBSZWNvcmQ8c3RyaW5nLCBDaHJvbmljbGVUYXNrW10+ID0geyBcIlRvZGF5XCI6IFtdLCBcIlRoaXMgd2Vla1wiOiBbXSwgXCJFYXJsaWVyXCI6IFtdIH07XG4gICAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGFza3MpIHtcbiAgICAgICAgY29uc3QgZCA9IHRhc2suY29tcGxldGVkQXQ/LnNwbGl0KFwiVFwiKVswXSA/PyBcIlwiO1xuICAgICAgICBpZiAoZCA9PT0gdG9kYXkpICAgICAgIGdyb3Vwc1tcIlRvZGF5XCJdLnB1c2godGFzayk7XG4gICAgICAgIGVsc2UgaWYgKGQgPj0gd2Vla0FnbykgZ3JvdXBzW1wiVGhpcyB3ZWVrXCJdLnB1c2godGFzayk7XG4gICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgZ3JvdXBzW1wiRWFybGllclwiXS5wdXNoKHRhc2spO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICB9XG5cbiAgICBjb25zdCBncm91cHM6IFJlY29yZDxzdHJpbmcsIENocm9uaWNsZVRhc2tbXT4gPSB7XG4gICAgICBcIk92ZXJkdWVcIjogW10sIFwiVG9kYXlcIjogW10sIFwiVGhpcyB3ZWVrXCI6IFtdLCBcIkxhdGVyXCI6IFtdLCBcIk5vIGRhdGVcIjogW10sXG4gICAgfTtcbiAgICBmb3IgKGNvbnN0IHRhc2sgb2YgdGFza3MpIHtcbiAgICAgIGlmICh0YXNrLnN0YXR1cyA9PT0gXCJkb25lXCIpIGNvbnRpbnVlO1xuICAgICAgaWYgKCF0YXNrLmR1ZURhdGUpICAgICAgICAgICAgeyBncm91cHNbXCJObyBkYXRlXCJdLnB1c2godGFzayk7ICAgY29udGludWU7IH1cbiAgICAgIGlmICh0YXNrLmR1ZURhdGUgPCB0b2RheSkgICAgIHsgZ3JvdXBzW1wiT3ZlcmR1ZVwiXS5wdXNoKHRhc2spOyAgIGNvbnRpbnVlOyB9XG4gICAgICBpZiAodGFzay5kdWVEYXRlID09PSB0b2RheSkgICB7IGdyb3Vwc1tcIlRvZGF5XCJdLnB1c2godGFzayk7ICAgICBjb250aW51ZTsgfVxuICAgICAgaWYgKHRhc2suZHVlRGF0ZSA8PSBuZXh0V2VlaykgeyBncm91cHNbXCJUaGlzIHdlZWtcIl0ucHVzaCh0YXNrKTsgY29udGludWU7IH1cbiAgICAgIGdyb3Vwc1tcIkxhdGVyXCJdLnB1c2godGFzayk7XG4gICAgfVxuICAgIHJldHVybiBncm91cHM7XG4gIH1cblxuICBwcml2YXRlIGZvcm1hdERhdGUoZGF0ZVN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCB0b2RheSAgICA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgdG9tb3Jyb3cgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgODY0MDAwMDApLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGlmIChkYXRlU3RyID09PSB0b2RheSkgICAgcmV0dXJuIFwiVG9kYXlcIjtcbiAgICBpZiAoZGF0ZVN0ciA9PT0gdG9tb3Jyb3cpIHJldHVybiBcIlRvbW9ycm93XCI7XG4gICAgcmV0dXJuIG5ldyBEYXRlKGRhdGVTdHIgKyBcIlQwMDowMDowMFwiKS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7IG1vbnRoOiBcInNob3J0XCIsIGRheTogXCJudW1lcmljXCIgfSk7XG4gIH1cblxuICBhc3luYyBvcGVuVGFza0Zvcm0odGFzaz86IENocm9uaWNsZVRhc2spIHtcbiAgICBuZXcgVGFza01vZGFsKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLnRhc2tNYW5hZ2VyLFxuICAgICAgdGhpcy5saXN0TWFuYWdlcixcbiAgICAgIHRhc2ssXG4gICAgICB1bmRlZmluZWQsXG4gICAgICAodCkgPT4gdGhpcy5vcGVuVGFza0Z1bGxQYWdlKHQpLFxuICAgICAgdGhpcy5wbHVnaW5cbiAgICApLm9wZW4oKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5UYXNrRnVsbFBhZ2UodGFzaz86IENocm9uaWNsZVRhc2spIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFRBU0tfRk9STV9WSUVXX1RZUEUpWzBdO1xuICAgIGlmIChleGlzdGluZykgZXhpc3RpbmcuZGV0YWNoKCk7XG4gICAgY29uc3QgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogVEFTS19GT1JNX1ZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuXG4gICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMCkpO1xuICAgIGNvbnN0IGZvcm1MZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShUQVNLX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBjb25zdCBmb3JtVmlldyA9IGZvcm1MZWFmPy52aWV3IGFzIFRhc2tGb3JtVmlldyB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZm9ybVZpZXcgJiYgdGFzaykgZm9ybVZpZXcubG9hZFRhc2sodGFzayk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZVRhc2ssIFRhc2tTdGF0dXMsIFRhc2tQcmlvcml0eSwgQWxlcnRPZmZzZXQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IFRhc2tNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvVGFza01hbmFnZXJcIjtcbmltcG9ydCB7IExpc3RNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvTGlzdE1hbmFnZXJcIjtcblxuZXhwb3J0IGNsYXNzIFRhc2tNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSB0YXNrTWFuYWdlcjogVGFza01hbmFnZXI7XG4gIHByaXZhdGUgbGlzdE1hbmFnZXI6IExpc3RNYW5hZ2VyO1xuICBwcml2YXRlIGVkaXRpbmdUYXNrOiBDaHJvbmljbGVUYXNrIHwgbnVsbDtcbiAgcHJpdmF0ZSBvblNhdmU/OiAoKSA9PiB2b2lkO1xuICBwcml2YXRlIG9uRXhwYW5kPzogKHRhc2s/OiBDaHJvbmljbGVUYXNrKSA9PiB2b2lkO1xuICBwcml2YXRlIHBsdWdpbjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcixcbiAgICBsaXN0TWFuYWdlcjogTGlzdE1hbmFnZXIsXG4gICAgZWRpdGluZ1Rhc2s/OiBDaHJvbmljbGVUYXNrLFxuICAgIG9uU2F2ZT86ICgpID0+IHZvaWQsXG4gICAgb25FeHBhbmQ/OiAodGFzaz86IENocm9uaWNsZVRhc2spID0+IHZvaWQsXG4gICAgcGx1Z2luPzogYW55XG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy50YXNrTWFuYWdlciA9IHRhc2tNYW5hZ2VyO1xuICAgIHRoaXMubGlzdE1hbmFnZXIgPSBsaXN0TWFuYWdlcjtcbiAgICB0aGlzLmVkaXRpbmdUYXNrID0gZWRpdGluZ1Rhc2sgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSAgICAgID0gb25TYXZlO1xuICAgIHRoaXMub25FeHBhbmQgICAgPSBvbkV4cGFuZDtcbiAgICB0aGlzLnBsdWdpbiAgICAgID0gcGx1Z2luO1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImNocm9uaWNsZS1ldmVudC1tb2RhbFwiKTtcblxuICAgIGNvbnN0IHQgICAgID0gdGhpcy5lZGl0aW5nVGFzaztcbiAgICBjb25zdCBsaXN0cyA9IHRoaXMubGlzdE1hbmFnZXIuZ2V0QWxsKCk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZW0taGVhZGVyXCIpO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZW0tdGl0bGVcIikuc2V0VGV4dCh0ID8gXCJFZGl0IHRhc2tcIiA6IFwiTmV3IHRhc2tcIik7XG5cbiAgICBjb25zdCBleHBhbmRCdG4gPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWdob3N0IGNlbS1leHBhbmQtYnRuXCIgfSk7XG4gICAgZXhwYW5kQnRuLnRpdGxlID0gXCJPcGVuIGFzIGZ1bGwgcGFnZVwiO1xuICAgIGV4cGFuZEJ0bi5pbm5lckhUTUwgPSBgPHN2ZyB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+PHBvbHlsaW5lIHBvaW50cz1cIjE1IDMgMjEgMyAyMSA5XCIvPjxwb2x5bGluZSBwb2ludHM9XCI5IDIxIDMgMjEgMyAxNVwiLz48bGluZSB4MT1cIjIxXCIgeTE9XCIzXCIgeDI9XCIxNFwiIHkyPVwiMTBcIi8+PGxpbmUgeDE9XCIzXCIgeTE9XCIyMVwiIHgyPVwiMTBcIiB5Mj1cIjE0XCIvPjwvc3ZnPmA7XG4gICAgZXhwYW5kQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY2xvc2UoKTsgdGhpcy5vbkV4cGFuZD8uKHQgPz8gdW5kZWZpbmVkKTsgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9ybSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb3JtID0gY29udGVudEVsLmNyZWF0ZURpdihcImNlbS1mb3JtXCIpO1xuXG4gICAgLy8gVGl0bGVcbiAgICBjb25zdCB0aXRsZUlucHV0ID0gdGhpcy5maWVsZChmb3JtLCBcIlRpdGxlXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dCBjZi10aXRsZS1pbnB1dFwiLCBwbGFjZWhvbGRlcjogXCJUYXNrIG5hbWVcIlxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSB0Py50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIExvY2F0aW9uXG4gICAgY29uc3QgbG9jYXRpb25JbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJMb2NhdGlvblwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIGxvY2F0aW9uXCJcbiAgICB9KTtcbiAgICBsb2NhdGlvbklucHV0LnZhbHVlID0gdD8ubG9jYXRpb24gPz8gXCJcIjtcblxuICAgIC8vIFN0YXR1cyArIFByaW9yaXR5XG4gICAgY29uc3Qgcm93MSA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuXG4gICAgY29uc3Qgc3RhdHVzU2VsZWN0ID0gdGhpcy5maWVsZChyb3cxLCBcIlN0YXR1c1wiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCBzdGF0dXNlczogeyB2YWx1ZTogVGFza1N0YXR1czsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcInRvZG9cIiwgICAgICAgIGxhYmVsOiBcIlRvIGRvXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiaW4tcHJvZ3Jlc3NcIiwgbGFiZWw6IFwiSW4gcHJvZ3Jlc3NcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJkb25lXCIsICAgICAgICBsYWJlbDogXCJEb25lXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiY2FuY2VsbGVkXCIsICAgbGFiZWw6IFwiQ2FuY2VsbGVkXCIgfSxcbiAgICBdO1xuICAgIGNvbnN0IGRlZmF1bHRTdGF0dXMgPSB0aGlzLnBsdWdpbj8uc2V0dGluZ3M/LmRlZmF1bHRUYXNrU3RhdHVzID8/IFwidG9kb1wiO1xuICAgIGZvciAoY29uc3QgcyBvZiBzdGF0dXNlcykge1xuICAgICAgY29uc3Qgb3B0ID0gc3RhdHVzU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHMudmFsdWUsIHRleHQ6IHMubGFiZWwgfSk7XG4gICAgICBpZiAodCA/IHQuc3RhdHVzID09PSBzLnZhbHVlIDogcy52YWx1ZSA9PT0gZGVmYXVsdFN0YXR1cykgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmlvcml0eVNlbGVjdCA9IHRoaXMuZmllbGQocm93MSwgXCJQcmlvcml0eVwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCBwcmlvcml0aWVzOiB7IHZhbHVlOiBUYXNrUHJpb3JpdHk7IGxhYmVsOiBzdHJpbmcgfVtdID0gW1xuICAgICAgeyB2YWx1ZTogXCJub25lXCIsICAgbGFiZWw6IFwiTm9uZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImxvd1wiLCAgICBsYWJlbDogXCJMb3dcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJtZWRpdW1cIiwgbGFiZWw6IFwiTWVkaXVtXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiaGlnaFwiLCAgIGxhYmVsOiBcIkhpZ2hcIiB9LFxuICAgIF07XG4gICAgY29uc3QgZGVmYXVsdFByaW9yaXR5ID0gdGhpcy5wbHVnaW4/LnNldHRpbmdzPy5kZWZhdWx0VGFza1ByaW9yaXR5ID8/IFwibm9uZVwiO1xuICAgIGZvciAoY29uc3QgcCBvZiBwcmlvcml0aWVzKSB7XG4gICAgICBjb25zdCBvcHQgPSBwcmlvcml0eVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBwLnZhbHVlLCB0ZXh0OiBwLmxhYmVsIH0pO1xuICAgICAgaWYgKHQgPyB0LnByaW9yaXR5ID09PSBwLnZhbHVlIDogcC52YWx1ZSA9PT0gZGVmYXVsdFByaW9yaXR5KSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIER1ZSBkYXRlICsgdGltZVxuICAgIGNvbnN0IHJvdzIgPSBmb3JtLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcbiAgICBjb25zdCBkdWVEYXRlSW5wdXQgPSB0aGlzLmZpZWxkKHJvdzIsIFwiRGF0ZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJkYXRlXCIsIGNsczogXCJjZi1pbnB1dFwiIH0pO1xuICAgIGR1ZURhdGVJbnB1dC52YWx1ZSA9IHQ/LmR1ZURhdGUgPz8gXCJcIjtcbiAgICBjb25zdCBkdWVUaW1lSW5wdXQgPSB0aGlzLmZpZWxkKHJvdzIsIFwiVGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0aW1lXCIsIGNsczogXCJjZi1pbnB1dFwiIH0pO1xuICAgIGR1ZVRpbWVJbnB1dC52YWx1ZSA9IHQ/LmR1ZVRpbWUgPz8gXCJcIjtcblxuICAgIC8vIFJlcGVhdFxuICAgIGNvbnN0IHJlY1NlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJSZXBlYXRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcmVjdXJyZW5jZXMgPSBbXG4gICAgICB7IHZhbHVlOiBcIlwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiTmV2ZXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPURBSUxZXCIsICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IGRheVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZXCIsICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgd2Vla1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9TU9OVEhMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgbW9udGhcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVlFQVJMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IHllYXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWTtCWURBWT1NTyxUVSxXRSxUSCxGUlwiLCAgbGFiZWw6IFwiV2Vla2RheXNcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCByIG9mIHJlY3VycmVuY2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSByZWNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogci52YWx1ZSwgdGV4dDogci5sYWJlbCB9KTtcbiAgICAgIGlmICh0Py5yZWN1cnJlbmNlID09PSByLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIEFsZXJ0XG4gICAgY29uc3QgYWxlcnRTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQWxlcnRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgdGFza0FsZXJ0czogeyB2YWx1ZTogQWxlcnRPZmZzZXQ7IGxhYmVsOiBzdHJpbmcgfVtdID0gW1xuICAgICAgeyB2YWx1ZTogXCJub25lXCIsICAgIGxhYmVsOiBcIk5vbmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJhdC10aW1lXCIsIGxhYmVsOiBcIkF0IHRpbWUgb2YgdGFza1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIjVtaW5cIiwgICAgbGFiZWw6IFwiNSBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjEwbWluXCIsICAgbGFiZWw6IFwiMTAgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxNW1pblwiLCAgIGxhYmVsOiBcIjE1IG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMzBtaW5cIiwgICBsYWJlbDogXCIzMCBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjFob3VyXCIsICAgbGFiZWw6IFwiMSBob3VyIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJob3Vyc1wiLCAgbGFiZWw6IFwiMiBob3VycyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxZGF5XCIsICAgIGxhYmVsOiBcIjEgZGF5IGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJkYXlzXCIsICAgbGFiZWw6IFwiMiBkYXlzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjF3ZWVrXCIsICAgbGFiZWw6IFwiMSB3ZWVrIGJlZm9yZVwiIH0sXG4gICAgXTtcbiAgICBjb25zdCBkZWZhdWx0QWxlcnQgPSB0aGlzLnBsdWdpbj8uc2V0dGluZ3M/LmRlZmF1bHRBbGVydCA/PyBcIm5vbmVcIjtcbiAgICBmb3IgKGNvbnN0IGEgb2YgdGFza0FsZXJ0cykge1xuICAgICAgY29uc3Qgb3B0ID0gYWxlcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogYS52YWx1ZSwgdGV4dDogYS5sYWJlbCB9KTtcbiAgICAgIGlmICh0ID8gdC5hbGVydCA9PT0gYS52YWx1ZSA6IGEudmFsdWUgPT09IGRlZmF1bHRBbGVydCkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBMaXN0XG4gICAgY29uc3QgbGlzdFNlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJMaXN0XCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IGRlZmF1bHRMaXN0SWQgPSB0aGlzLnBsdWdpbj8uc2V0dGluZ3M/LmRlZmF1bHRMaXN0SWQgPz8gXCJcIjtcbiAgICBsaXN0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IFwiXCIsIHRleHQ6IFwiTm9uZVwiIH0pO1xuICAgIGZvciAoY29uc3QgbGlzdCBvZiBsaXN0cykge1xuICAgICAgY29uc3Qgb3B0ID0gbGlzdFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBsaXN0LmlkLCB0ZXh0OiBsaXN0Lm5hbWUgfSk7XG4gICAgICBpZiAodCA/IHQubGlzdElkID09PSBsaXN0LmlkIDogbGlzdC5pZCA9PT0gZGVmYXVsdExpc3RJZCkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgdXBkYXRlTGlzdENvbG9yID0gKCkgPT4ge1xuICAgICAgY29uc3QgbGlzdCA9IHRoaXMubGlzdE1hbmFnZXIuZ2V0QnlJZChsaXN0U2VsZWN0LnZhbHVlKTtcbiAgICAgIGxpc3RTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdENvbG9yID0gbGlzdCA/IGxpc3QuY29sb3IgOiBcInRyYW5zcGFyZW50XCI7XG4gICAgICBsaXN0U2VsZWN0LnN0eWxlLmJvcmRlckxlZnRXaWR0aCA9IFwiNHB4XCI7XG4gICAgICBsaXN0U2VsZWN0LnN0eWxlLmJvcmRlckxlZnRTdHlsZSA9IFwic29saWRcIjtcbiAgICB9O1xuICAgIGxpc3RTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB1cGRhdGVMaXN0Q29sb3IpO1xuICAgIHVwZGF0ZUxpc3RDb2xvcigpO1xuXG4gICAgLy8gVGFnc1xuICAgIGNvbnN0IHRhZ3NJbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJUYWdzXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLCBwbGFjZWhvbGRlcjogXCJ3b3JrLCBwZXJzb25hbCAgKGNvbW1hIHNlcGFyYXRlZClcIlxuICAgIH0pO1xuICAgIHRhZ3NJbnB1dC52YWx1ZSA9IHQ/LnRhZ3M/LmpvaW4oXCIsIFwiKSA/PyBcIlwiO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEZvb3RlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb290ZXIgICAgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWZvb3RlclwiKTtcbiAgICBjb25zdCBjYW5jZWxCdG4gPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWdob3N0XCIsIHRleHQ6IFwiQ2FuY2VsXCIgfSk7XG5cbiAgICBpZiAodCAmJiB0LmlkKSB7XG4gICAgICBjb25zdCBkZWxldGVCdG4gPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWRlbGV0ZVwiLCB0ZXh0OiBcIkRlbGV0ZSB0YXNrXCIgfSk7XG4gICAgICBkZWxldGVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy50YXNrTWFuYWdlci5kZWxldGUodC5pZCk7XG4gICAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2F2ZUJ0biA9IGZvb3Rlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiY2YtYnRuLXByaW1hcnlcIiwgdGV4dDogdD8uaWQgPyBcIlNhdmVcIiA6IFwiQWRkIHRhc2tcIlxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEhhbmRsZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNhbmNlbEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5jbG9zZSgpKTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0aXRsZSA9IHRpdGxlSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCF0aXRsZSkgeyB0aXRsZUlucHV0LmZvY3VzKCk7IHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpOyByZXR1cm47IH1cblxuICAgICAgaWYgKCF0Py5pZCkge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMudGFza01hbmFnZXIuZ2V0QWxsKCk7XG4gICAgICAgIGNvbnN0IGR1cGxpY2F0ZSA9IGV4aXN0aW5nLmZpbmQoZSA9PiBlLnRpdGxlLnRvTG93ZXJDYXNlKCkgPT09IHRpdGxlLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShgQSB0YXNrIG5hbWVkIFwiJHt0aXRsZX1cIiBhbHJlYWR5IGV4aXN0cy5gLCA0MDAwKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRhc2tEYXRhID0ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgc3RhdHVzOiAgICAgICAgICAgICBzdGF0dXNTZWxlY3QudmFsdWUgYXMgVGFza1N0YXR1cyxcbiAgICAgICAgcHJpb3JpdHk6ICAgICAgICAgICBwcmlvcml0eVNlbGVjdC52YWx1ZSBhcyBUYXNrUHJpb3JpdHksXG4gICAgICAgIGR1ZURhdGU6ICAgICAgICAgICAgZHVlRGF0ZUlucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgZHVlVGltZTogICAgICAgICAgICBkdWVUaW1lSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBsaXN0SWQ6ICAgICAgICAgICAgIGxpc3RTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICByZWN1cnJlbmNlOiAgICAgICAgIHJlY1NlbGVjdC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGFsZXJ0OiAgICAgICAgICAgICAgYWxlcnRTZWxlY3QudmFsdWUgYXMgQWxlcnRPZmZzZXQsXG4gICAgICAgIGxvY2F0aW9uOiAgICAgICAgICAgbG9jYXRpb25JbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgdGFnc0lucHV0LnZhbHVlID8gdGFnc0lucHV0LnZhbHVlLnNwbGl0KFwiLFwiKS5tYXAocyA9PiBzLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pIDogKHQ/LnRhZ3MgPz8gW10pLFxuICAgICAgICBub3RlczogICAgICAgICAgICAgIHQ/Lm5vdGVzLFxuICAgICAgICBsaW5rZWROb3RlczogICAgICAgIHQ/LmxpbmtlZE5vdGVzID8/IFtdLFxuICAgICAgICBwcm9qZWN0czogICAgICAgICAgIHQ/LnByb2plY3RzID8/IFtdLFxuICAgICAgICB0aW1lRXN0aW1hdGU6ICAgICAgIHQ/LnRpbWVFc3RpbWF0ZSxcbiAgICAgICAgdGltZUVudHJpZXM6ICAgICAgICB0Py50aW1lRW50cmllcyA/PyBbXSxcbiAgICAgICAgY3VzdG9tRmllbGRzOiAgICAgICB0Py5jdXN0b21GaWVsZHMgPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogdD8uY29tcGxldGVkSW5zdGFuY2VzID8/IFtdLFxuICAgICAgfTtcblxuICAgICAgaWYgKHQ/LmlkKSB7XG4gICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIudXBkYXRlKHsgLi4udCwgLi4udGFza0RhdGEgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmNyZWF0ZSh0YXNrRGF0YSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9O1xuXG4gICAgc2F2ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGFuZGxlU2F2ZSk7XG4gICAgdGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZSkgPT4ge1xuICAgICAgaWYgKGUua2V5ID09PSBcIkVudGVyXCIpIGhhbmRsZVNhdmUoKTtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFc2NhcGVcIikgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgb25DbG9zZSgpIHsgdGhpcy5jb250ZW50RWwuZW1wdHkoKTsgfVxuXG4gIHByaXZhdGUgZmllbGQocGFyZW50OiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCB3cmFwID0gcGFyZW50LmNyZWF0ZURpdihcImNmLWZpZWxkXCIpO1xuICAgIHdyYXAuY3JlYXRlRGl2KFwiY2YtbGFiZWxcIikuc2V0VGV4dChsYWJlbCk7XG4gICAgcmV0dXJuIHdyYXA7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVUYXNrLCBUYXNrU3RhdHVzLCBUYXNrUHJpb3JpdHksIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBMaXN0TWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0xpc3RNYW5hZ2VyXCI7XG5cbmV4cG9ydCBjbGFzcyBUYXNrRGV0YWlsUG9wdXAgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgdGFzazogQ2hyb25pY2xlVGFzaztcbiAgcHJpdmF0ZSBsaXN0TWFuYWdlcjogTGlzdE1hbmFnZXI7XG4gIHByaXZhdGUgdGltZUZvcm1hdDogXCIxMmhcIiB8IFwiMjRoXCI7XG4gIHByaXZhdGUgb25FZGl0OiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHRhc2s6IENocm9uaWNsZVRhc2ssXG4gICAgbGlzdE1hbmFnZXI6IExpc3RNYW5hZ2VyLFxuICAgIHRpbWVGb3JtYXQ6IFwiMTJoXCIgfCBcIjI0aFwiLFxuICAgIG9uRWRpdDogKCkgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMudGFzayAgICAgICAgPSB0YXNrO1xuICAgIHRoaXMubGlzdE1hbmFnZXIgPSBsaXN0TWFuYWdlcjtcbiAgICB0aGlzLnRpbWVGb3JtYXQgID0gdGltZUZvcm1hdDtcbiAgICB0aGlzLm9uRWRpdCAgICAgID0gb25FZGl0O1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImNkcC1tb2RhbFwiKTtcblxuICAgIGNvbnN0IHQgPSB0aGlzLnRhc2s7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZHAtaGVhZGVyXCIpO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZHAtdGl0bGVcIikuc2V0VGV4dCh0LnRpdGxlKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBTdGF0dXMgKyBQcmlvcml0eSBiYWRnZXMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgYmFkZ2VSb3cgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2RwLWJhZGdlLXJvd1wiKTtcbiAgICBiYWRnZVJvdy5jcmVhdGVTcGFuKHsgY2xzOiBgY2RwLWJhZGdlIGNkcC1zdGF0dXMtJHt0LnN0YXR1c31gIH0pLnNldFRleHQoZm9ybWF0U3RhdHVzKHQuc3RhdHVzKSk7XG4gICAgaWYgKHQucHJpb3JpdHkgIT09IFwibm9uZVwiKSB7XG4gICAgICBiYWRnZVJvdy5jcmVhdGVTcGFuKHsgY2xzOiBgY2RwLWJhZGdlIGNkcC1wcmlvcml0eS0ke3QucHJpb3JpdHl9YCB9KS5zZXRUZXh0KGZvcm1hdFByaW9yaXR5KHQucHJpb3JpdHkpKTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRGV0YWlsIHJvd3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgYm9keSA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZHAtYm9keVwiKTtcblxuICAgIGlmICh0LmR1ZURhdGUpIHtcbiAgICAgIGNvbnN0IHRpbWVTdHIgPSB0LmR1ZVRpbWUgPyBgICBcdTAwQjcgICR7dGhpcy5mbXRUaW1lKHQuZHVlVGltZSl9YCA6IFwiXCI7XG4gICAgICB0aGlzLnJvdyhib2R5LCBcIkR1ZVwiLCBmb3JtYXREYXRlKHQuZHVlRGF0ZSkgKyB0aW1lU3RyKTtcbiAgICB9XG5cbiAgICBpZiAodC5sb2NhdGlvbikgdGhpcy5yb3coYm9keSwgXCJMb2NhdGlvblwiLCB0LmxvY2F0aW9uKTtcblxuICAgIGlmICh0Lmxpc3RJZCkge1xuICAgICAgY29uc3QgbGlzdCA9IHRoaXMubGlzdE1hbmFnZXIuZ2V0QnlJZCh0Lmxpc3RJZCk7XG4gICAgICBpZiAobGlzdCkgdGhpcy5saXN0Um93KGJvZHksIGxpc3QubmFtZSwgbGlzdC5jb2xvcik7XG4gICAgfVxuXG4gICAgaWYgKHQucmVjdXJyZW5jZSkgdGhpcy5yb3coYm9keSwgXCJSZXBlYXRcIiwgZm9ybWF0UmVjdXJyZW5jZSh0LnJlY3VycmVuY2UpKTtcblxuICAgIGlmICh0LmFsZXJ0ICYmIHQuYWxlcnQgIT09IFwibm9uZVwiKSB0aGlzLnJvdyhib2R5LCBcIkFsZXJ0XCIsIGZvcm1hdEFsZXJ0KHQuYWxlcnQpKTtcblxuICAgIGlmICh0LnRhZ3MubGVuZ3RoID4gMCkgdGhpcy5yb3coYm9keSwgXCJUYWdzXCIsIHQudGFncy5qb2luKFwiLCBcIikpO1xuXG4gICAgaWYgKHQucHJvamVjdHMubGVuZ3RoID4gMCkgdGhpcy5yb3coYm9keSwgXCJQcm9qZWN0c1wiLCB0LnByb2plY3RzLmpvaW4oXCIsIFwiKSk7XG5cbiAgICBpZiAodC5saW5rZWROb3Rlcy5sZW5ndGggPiAwKSB0aGlzLnJvdyhib2R5LCBcIkxpbmtlZCBub3Rlc1wiLCB0LmxpbmtlZE5vdGVzLmpvaW4oXCIsIFwiKSk7XG5cbiAgICBpZiAodC50aW1lRXN0aW1hdGUpIHRoaXMucm93KGJvZHksIFwiRXN0aW1hdGVcIiwgZm9ybWF0RHVyYXRpb24odC50aW1lRXN0aW1hdGUpKTtcblxuICAgIGlmICh0Lm5vdGVzKSB7XG4gICAgICBjb25zdCBub3Rlc1JvdyA9IGJvZHkuY3JlYXRlRGl2KFwiY2RwLXJvdyBjZHAtbm90ZXMtcm93XCIpO1xuICAgICAgbm90ZXNSb3cuY3JlYXRlRGl2KFwiY2RwLXJvdy1sYWJlbFwiKS5zZXRUZXh0KFwiTm90ZXNcIik7XG4gICAgICBub3Rlc1Jvdy5jcmVhdGVEaXYoXCJjZHAtcm93LXZhbHVlIGNkcC1ub3Rlcy10ZXh0XCIpLnNldFRleHQoXG4gICAgICAgIHQubm90ZXMubGVuZ3RoID4gNDAwID8gdC5ub3Rlcy5zbGljZSgwLCA0MDApICsgXCJcdTIwMjZcIiA6IHQubm90ZXNcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEZvb3RlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb290ZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2RwLWZvb3RlclwiKTtcbiAgICBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLXByaW1hcnlcIiwgdGV4dDogXCJFZGl0IHRhc2tcIiB9KVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY2xvc2UoKTsgdGhpcy5vbkVkaXQoKTsgfSk7XG4gIH1cblxuICBwcml2YXRlIHJvdyhwYXJlbnQ6IEhUTUxFbGVtZW50LCBsYWJlbDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgY29uc3Qgcm93ID0gcGFyZW50LmNyZWF0ZURpdihcImNkcC1yb3dcIik7XG4gICAgcm93LmNyZWF0ZURpdihcImNkcC1yb3ctbGFiZWxcIikuc2V0VGV4dChsYWJlbCk7XG4gICAgcm93LmNyZWF0ZURpdihcImNkcC1yb3ctdmFsdWVcIikuc2V0VGV4dCh2YWx1ZSk7XG4gIH1cblxuICBwcml2YXRlIGxpc3RSb3cocGFyZW50OiBIVE1MRWxlbWVudCwgbmFtZTogc3RyaW5nLCBjb2xvcjogc3RyaW5nKSB7XG4gICAgY29uc3Qgcm93ID0gcGFyZW50LmNyZWF0ZURpdihcImNkcC1yb3dcIik7XG4gICAgcm93LmNyZWF0ZURpdihcImNkcC1yb3ctbGFiZWxcIikuc2V0VGV4dChcIkxpc3RcIik7XG4gICAgY29uc3QgdmFsID0gcm93LmNyZWF0ZURpdihcImNkcC1yb3ctdmFsdWUgY2RwLWNhbC12YWx1ZVwiKTtcbiAgICBjb25zdCBkb3QgPSB2YWwuY3JlYXRlU3BhbihcImNkcC1jYWwtZG90XCIpO1xuICAgIGRvdC5zdHlsZS5iYWNrZ3JvdW5kID0gY29sb3I7XG4gICAgdmFsLmNyZWF0ZVNwYW4oKS5zZXRUZXh0KG5hbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBmbXRUaW1lKHRpbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMudGltZUZvcm1hdCA9PT0gXCIyNGhcIikgcmV0dXJuIHRpbWU7XG4gICAgY29uc3QgW2gsIG1dID0gdGltZS5zcGxpdChcIjpcIikubWFwKE51bWJlcik7XG4gICAgY29uc3Qgc3VmZml4ID0gaCA+PSAxMiA/IFwiUE1cIiA6IFwiQU1cIjtcbiAgICByZXR1cm4gYCR7KChoICUgMTIpIHx8IDEyKX06JHtTdHJpbmcobSkucGFkU3RhcnQoMiwgXCIwXCIpfSAke3N1ZmZpeH1gO1xuICB9XG5cbiAgb25DbG9zZSgpIHsgdGhpcy5jb250ZW50RWwuZW1wdHkoKTsgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDAgRm9ybWF0dGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gZm9ybWF0U3RhdHVzKHM6IFRhc2tTdGF0dXMpOiBzdHJpbmcge1xuICByZXR1cm4geyB0b2RvOiBcIlRvIERvXCIsIFwiaW4tcHJvZ3Jlc3NcIjogXCJJbiBQcm9ncmVzc1wiLCBkb25lOiBcIkRvbmVcIiwgY2FuY2VsbGVkOiBcIkNhbmNlbGxlZFwiIH1bc10gPz8gcztcbn1cblxuZnVuY3Rpb24gZm9ybWF0UHJpb3JpdHkocDogVGFza1ByaW9yaXR5KTogc3RyaW5nIHtcbiAgY29uc3QgbWFwOiBQYXJ0aWFsPFJlY29yZDxUYXNrUHJpb3JpdHksIHN0cmluZz4+ID0geyBsb3c6IFwiTG93IHByaW9yaXR5XCIsIG1lZGl1bTogXCJNZWRpdW0gcHJpb3JpdHlcIiwgaGlnaDogXCJIaWdoIHByaW9yaXR5XCIgfTtcbiAgcmV0dXJuIG1hcFtwXSA/PyBwO1xufVxuXG5mdW5jdGlvbiBmb3JtYXREYXRlKGRhdGVTdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IFt5LCBtLCBkXSA9IGRhdGVTdHIuc3BsaXQoXCItXCIpLm1hcChOdW1iZXIpO1xuICByZXR1cm4gbmV3IERhdGUoeSwgbSAtIDEsIGQpLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHtcbiAgICB3ZWVrZGF5OiBcInNob3J0XCIsIG1vbnRoOiBcInNob3J0XCIsIGRheTogXCJudW1lcmljXCIsIHllYXI6IFwibnVtZXJpY1wiXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRSZWN1cnJlbmNlKHJydWxlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBtYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgXCJGUkVRPURBSUxZXCI6ICAgICAgICAgICAgICAgICAgICAgICAgXCJFdmVyeSBkYXlcIixcbiAgICBcIkZSRVE9V0VFS0xZXCI6ICAgICAgICAgICAgICAgICAgICAgICBcIkV2ZXJ5IHdlZWtcIixcbiAgICBcIkZSRVE9TU9OVEhMWVwiOiAgICAgICAgICAgICAgICAgICAgICBcIkV2ZXJ5IG1vbnRoXCIsXG4gICAgXCJGUkVRPVlFQVJMWVwiOiAgICAgICAgICAgICAgICAgICAgICAgXCJFdmVyeSB5ZWFyXCIsXG4gICAgXCJGUkVRPVdFRUtMWTtCWURBWT1NTyxUVSxXRSxUSCxGUlwiOiBcIldlZWtkYXlzXCIsXG4gIH07XG4gIHJldHVybiBtYXBbcnJ1bGVdID8/IHJydWxlO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRBbGVydChhbGVydDogQWxlcnRPZmZzZXQpOiBzdHJpbmcge1xuICBjb25zdCBtYXA6IFBhcnRpYWw8UmVjb3JkPEFsZXJ0T2Zmc2V0LCBzdHJpbmc+PiA9IHtcbiAgICBcImF0LXRpbWVcIjogXCJBdCB0aW1lIG9mIGV2ZW50XCIsXG4gICAgXCI1bWluXCI6ICAgIFwiNSBtaW51dGVzIGJlZm9yZVwiLFxuICAgIFwiMTBtaW5cIjogICBcIjEwIG1pbnV0ZXMgYmVmb3JlXCIsXG4gICAgXCIxNW1pblwiOiAgIFwiMTUgbWludXRlcyBiZWZvcmVcIixcbiAgICBcIjMwbWluXCI6ICAgXCIzMCBtaW51dGVzIGJlZm9yZVwiLFxuICAgIFwiMWhvdXJcIjogICBcIjEgaG91ciBiZWZvcmVcIixcbiAgICBcIjJob3Vyc1wiOiAgXCIyIGhvdXJzIGJlZm9yZVwiLFxuICAgIFwiMWRheVwiOiAgICBcIjEgZGF5IGJlZm9yZVwiLFxuICAgIFwiMmRheXNcIjogICBcIjIgZGF5cyBiZWZvcmVcIixcbiAgICBcIjF3ZWVrXCI6ICAgXCIxIHdlZWsgYmVmb3JlXCIsXG4gIH07XG4gIHJldHVybiBtYXBbYWxlcnRdID8/IGFsZXJ0O1xufVxuXG5mdW5jdGlvbiBmb3JtYXREdXJhdGlvbihtaW51dGVzOiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAobWludXRlcyA8IDYwKSByZXR1cm4gYCR7bWludXRlc30gbWluYDtcbiAgY29uc3QgaCA9IE1hdGguZmxvb3IobWludXRlcyAvIDYwKTtcbiAgY29uc3QgbSA9IG1pbnV0ZXMgJSA2MDtcbiAgcmV0dXJuIG0gPiAwID8gYCR7aH0gaHIgJHttfSBtaW5gIDogYCR7aH0gaHJgO1xufVxuIiwgImltcG9ydCB7IEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZVRhc2ssIFRhc2tTdGF0dXMsIFRhc2tQcmlvcml0eSwgQWxlcnRPZmZzZXQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IFRhc2tNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvVGFza01hbmFnZXJcIjtcbmltcG9ydCB7IExpc3RNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvTGlzdE1hbmFnZXJcIjtcblxuZXhwb3J0IGNvbnN0IFRBU0tfRk9STV9WSUVXX1RZUEUgPSBcImNocm9uaWNsZS10YXNrLWZvcm1cIjtcblxuZXhwb3J0IGNsYXNzIFRhc2tGb3JtVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSB0YXNrTWFuYWdlcjogVGFza01hbmFnZXI7XG4gIHByaXZhdGUgbGlzdE1hbmFnZXI6IExpc3RNYW5hZ2VyO1xuICBwcml2YXRlIGVkaXRpbmdUYXNrOiBDaHJvbmljbGVUYXNrIHwgbnVsbCA9IG51bGw7XG4gIG9uU2F2ZT86ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbGVhZjogV29ya3NwYWNlTGVhZixcbiAgICB0YXNrTWFuYWdlcjogVGFza01hbmFnZXIsXG4gICAgbGlzdE1hbmFnZXI6IExpc3RNYW5hZ2VyLFxuICAgIGVkaXRpbmdUYXNrPzogQ2hyb25pY2xlVGFzayxcbiAgICBvblNhdmU/OiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMudGFza01hbmFnZXIgPSB0YXNrTWFuYWdlcjtcbiAgICB0aGlzLmxpc3RNYW5hZ2VyID0gbGlzdE1hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nVGFzayA9IGVkaXRpbmdUYXNrID8/IG51bGw7XG4gICAgdGhpcy5vblNhdmUgICAgICA9IG9uU2F2ZTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7IHJldHVybiBUQVNLX0ZPUk1fVklFV19UWVBFOyB9XG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmVkaXRpbmdUYXNrID8gXCJFZGl0IHRhc2tcIiA6IFwiTmV3IHRhc2tcIjsgfVxuICBnZXRJY29uKCk6IHN0cmluZyB7IHJldHVybiBcImNoZWNrLWNpcmNsZVwiOyB9XG5cbiAgYXN5bmMgb25PcGVuKCkgeyB0aGlzLnJlbmRlcigpOyB9XG5cbiAgbG9hZFRhc2sodGFzazogQ2hyb25pY2xlVGFzaykge1xuICAgIHRoaXMuZWRpdGluZ1Rhc2sgPSB0YXNrO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb250YWluZXIuZW1wdHkoKTtcbiAgICBjb250YWluZXIuYWRkQ2xhc3MoXCJjaHJvbmljbGUtZm9ybS1wYWdlXCIpO1xuXG4gICAgY29uc3QgdCAgICAgPSB0aGlzLmVkaXRpbmdUYXNrO1xuICAgIGNvbnN0IGxpc3RzID0gdGhpcy5saXN0TWFuYWdlci5nZXRBbGwoKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIZWFkZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaGVhZGVyID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNmLWhlYWRlclwiKTtcbiAgICBjb25zdCBjYW5jZWxCdG4gPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWdob3N0XCIsIHRleHQ6IFwiQ2FuY2VsXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZURpdihcImNmLWhlYWRlci10aXRsZVwiKS5zZXRUZXh0KHQgPyBcIkVkaXQgdGFza1wiIDogXCJOZXcgdGFza1wiKTtcbiAgICBjb25zdCBzYXZlQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1wcmltYXJ5XCIsIHRleHQ6IHQgPyBcIlNhdmVcIiA6IFwiQWRkXCIgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9ybSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb3JtID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNmLWZvcm1cIik7XG5cbiAgICAvLyBUaXRsZVxuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGl0bGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLXRpdGxlLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIlRhc2sgbmFtZVwiXG4gICAgfSk7XG4gICAgdGl0bGVJbnB1dC52YWx1ZSA9IHQ/LnRpdGxlID8/IFwiXCI7XG4gICAgdGl0bGVJbnB1dC5mb2N1cygpO1xuXG4gICAgLy8gTG9jYXRpb25cbiAgICBjb25zdCBsb2NhdGlvbklucHV0ID0gdGhpcy5maWVsZChmb3JtLCBcIkxvY2F0aW9uXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLCBwbGFjZWhvbGRlcjogXCJBZGQgbG9jYXRpb25cIlxuICAgIH0pO1xuICAgIGxvY2F0aW9uSW5wdXQudmFsdWUgPSB0Py5sb2NhdGlvbiA/PyBcIlwiO1xuXG4gICAgLy8gU3RhdHVzICsgUHJpb3JpdHlcbiAgICBjb25zdCByb3cxID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG5cbiAgICBjb25zdCBzdGF0dXNTZWxlY3QgPSB0aGlzLmZpZWxkKHJvdzEsIFwiU3RhdHVzXCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNvbnN0IHN0YXR1c2VzOiB7IHZhbHVlOiBUYXNrU3RhdHVzOyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwidG9kb1wiLCAgICAgICAgbGFiZWw6IFwiVG8gZG9cIiB9LFxuICAgICAgeyB2YWx1ZTogXCJpbi1wcm9ncmVzc1wiLCBsYWJlbDogXCJJbiBwcm9ncmVzc1wiIH0sXG4gICAgICB7IHZhbHVlOiBcImRvbmVcIiwgICAgICAgIGxhYmVsOiBcIkRvbmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJjYW5jZWxsZWRcIiwgICBsYWJlbDogXCJDYW5jZWxsZWRcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCBzIG9mIHN0YXR1c2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSBzdGF0dXNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogcy52YWx1ZSwgdGV4dDogcy5sYWJlbCB9KTtcbiAgICAgIGlmICh0Py5zdGF0dXMgPT09IHMudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgcHJpb3JpdHlTZWxlY3QgPSB0aGlzLmZpZWxkKHJvdzEsIFwiUHJpb3JpdHlcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcHJpb3JpdGllczogeyB2YWx1ZTogVGFza1ByaW9yaXR5OyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgICAgIHsgdmFsdWU6IFwibm9uZVwiLCAgIGxhYmVsOiBcIk5vbmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJsb3dcIiwgICAgbGFiZWw6IFwiTG93XCIgfSxcbiAgICAgIHsgdmFsdWU6IFwibWVkaXVtXCIsIGxhYmVsOiBcIk1lZGl1bVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImhpZ2hcIiwgICBsYWJlbDogXCJIaWdoXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgcCBvZiBwcmlvcml0aWVzKSB7XG4gICAgICBjb25zdCBvcHQgPSBwcmlvcml0eVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBwLnZhbHVlLCB0ZXh0OiBwLmxhYmVsIH0pO1xuICAgICAgaWYgKHQ/LnByaW9yaXR5ID09PSBwLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIER1ZSBkYXRlICsgdGltZVxuICAgIGNvbnN0IHJvdzIgPSBmb3JtLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcbiAgICBjb25zdCBkdWVEYXRlSW5wdXQgPSB0aGlzLmZpZWxkKHJvdzIsIFwiRGF0ZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJkYXRlXCIsIGNsczogXCJjZi1pbnB1dFwiIH0pO1xuICAgIGR1ZURhdGVJbnB1dC52YWx1ZSA9IHQ/LmR1ZURhdGUgPz8gXCJcIjtcbiAgICBjb25zdCBkdWVUaW1lSW5wdXQgPSB0aGlzLmZpZWxkKHJvdzIsIFwiVGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0aW1lXCIsIGNsczogXCJjZi1pbnB1dFwiIH0pO1xuICAgIGR1ZVRpbWVJbnB1dC52YWx1ZSA9IHQ/LmR1ZVRpbWUgPz8gXCJcIjtcblxuICAgIC8vIFJlcGVhdFxuICAgIGNvbnN0IHJlY1NlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJSZXBlYXRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcmVjdXJyZW5jZXMgPSBbXG4gICAgICB7IHZhbHVlOiBcIlwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiTmV2ZXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPURBSUxZXCIsICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IGRheVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZXCIsICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgd2Vla1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9TU9OVEhMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgbW9udGhcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVlFQVJMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IHllYXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWTtCWURBWT1NTyxUVSxXRSxUSCxGUlwiLCAgbGFiZWw6IFwiV2Vla2RheXNcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCByIG9mIHJlY3VycmVuY2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSByZWNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogci52YWx1ZSwgdGV4dDogci5sYWJlbCB9KTtcbiAgICAgIGlmICh0Py5yZWN1cnJlbmNlID09PSByLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIEFsZXJ0XG4gICAgY29uc3QgYWxlcnRTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQWxlcnRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgZm9ybUFsZXJ0czogeyB2YWx1ZTogQWxlcnRPZmZzZXQ7IGxhYmVsOiBzdHJpbmcgfVtdID0gW1xuICAgICAgeyB2YWx1ZTogXCJub25lXCIsICAgIGxhYmVsOiBcIk5vbmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJhdC10aW1lXCIsIGxhYmVsOiBcIkF0IHRpbWUgb2YgdGFza1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIjVtaW5cIiwgICAgbGFiZWw6IFwiNSBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjEwbWluXCIsICAgbGFiZWw6IFwiMTAgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxNW1pblwiLCAgIGxhYmVsOiBcIjE1IG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMzBtaW5cIiwgICBsYWJlbDogXCIzMCBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjFob3VyXCIsICAgbGFiZWw6IFwiMSBob3VyIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJob3Vyc1wiLCAgbGFiZWw6IFwiMiBob3VycyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxZGF5XCIsICAgIGxhYmVsOiBcIjEgZGF5IGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJkYXlzXCIsICAgbGFiZWw6IFwiMiBkYXlzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjF3ZWVrXCIsICAgbGFiZWw6IFwiMSB3ZWVrIGJlZm9yZVwiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IGEgb2YgZm9ybUFsZXJ0cykge1xuICAgICAgY29uc3Qgb3B0ID0gYWxlcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogYS52YWx1ZSwgdGV4dDogYS5sYWJlbCB9KTtcbiAgICAgIGlmICh0Py5hbGVydCA9PT0gYS52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBMaXN0XG4gICAgY29uc3QgbGlzdFNlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJMaXN0XCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGxpc3RTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogXCJcIiwgdGV4dDogXCJOb25lXCIgfSk7XG4gICAgZm9yIChjb25zdCBsaXN0IG9mIGxpc3RzKSB7XG4gICAgICBjb25zdCBvcHQgPSBsaXN0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGxpc3QuaWQsIHRleHQ6IGxpc3QubmFtZSB9KTtcbiAgICAgIGlmICh0Py5saXN0SWQgPT09IGxpc3QuaWQpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuICAgIGNvbnN0IHVwZGF0ZUxpc3RDb2xvciA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGxpc3QgPSB0aGlzLmxpc3RNYW5hZ2VyLmdldEJ5SWQobGlzdFNlbGVjdC52YWx1ZSk7XG4gICAgICBsaXN0U2VsZWN0LnN0eWxlLmJvcmRlckxlZnRDb2xvciA9IGxpc3QgPyBsaXN0LmNvbG9yIDogXCJ0cmFuc3BhcmVudFwiO1xuICAgICAgbGlzdFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0V2lkdGggPSBcIjRweFwiO1xuICAgICAgbGlzdFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0U3R5bGUgPSBcInNvbGlkXCI7XG4gICAgfTtcbiAgICBsaXN0U2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdXBkYXRlTGlzdENvbG9yKTtcbiAgICB1cGRhdGVMaXN0Q29sb3IoKTtcblxuICAgIC8vIFRhZ3NcbiAgICBjb25zdCB0YWdzSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGFnc1wiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIndvcmssIHBlcnNvbmFsICAoY29tbWEgc2VwYXJhdGVkKVwiXG4gICAgfSk7XG4gICAgdGFnc0lucHV0LnZhbHVlID0gdD8udGFncy5qb2luKFwiLCBcIikgPz8gXCJcIjtcblxuICAgIC8vIExpbmtlZCBub3Rlc1xuICAgIGNvbnN0IGxpbmtlZElucHV0ID0gdGhpcy5maWVsZChmb3JtLCBcIkxpbmtlZCBub3Rlc1wiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIlByb2plY3RzL1dlYnNpdGUsIEpvdXJuYWwvMjAyNCAgKGNvbW1hIHNlcGFyYXRlZClcIlxuICAgIH0pO1xuICAgIGxpbmtlZElucHV0LnZhbHVlID0gdD8ubGlua2VkTm90ZXMuam9pbihcIiwgXCIpID8/IFwiXCI7XG5cbiAgICAvLyBOb3Rlc1xuICAgIGNvbnN0IG5vdGVzSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTm90ZXNcIikuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICBjbHM6IFwiY2YtdGV4dGFyZWFcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIG5vdGVzLi4uXCJcbiAgICB9KTtcbiAgICBub3Rlc0lucHV0LnZhbHVlID0gdD8ubm90ZXMgPz8gXCJcIjtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBBY3Rpb25zIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNhbmNlbEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShUQVNLX0ZPUk1fVklFV19UWVBFKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0aXRsZSA9IHRpdGxlSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCF0aXRsZSkgeyB0aXRsZUlucHV0LmZvY3VzKCk7IHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpOyByZXR1cm47IH1cblxuICAgICAgaWYgKCF0aGlzLmVkaXRpbmdUYXNrKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRBbGwoKTtcbiAgICAgICAgY29uc3QgZHVwbGljYXRlID0gZXhpc3RpbmcuZmluZChlID0+IGUudGl0bGUudG9Mb3dlckNhc2UoKSA9PT0gdGl0bGUudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIGlmIChkdXBsaWNhdGUpIHtcbiAgICAgICAgICBuZXcgTm90aWNlKGBBIHRhc2sgbmFtZWQgXCIke3RpdGxlfVwiIGFscmVhZHkgZXhpc3RzLmAsIDQwMDApO1xuICAgICAgICAgIHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpO1xuICAgICAgICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdGFza0RhdGEgPSB7XG4gICAgICAgIHRpdGxlLFxuICAgICAgICBsb2NhdGlvbjogICAgICAgICAgIGxvY2F0aW9uSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBzdGF0dXM6ICAgICAgICAgICAgIHN0YXR1c1NlbGVjdC52YWx1ZSBhcyBUYXNrU3RhdHVzLFxuICAgICAgICBwcmlvcml0eTogICAgICAgICAgIHByaW9yaXR5U2VsZWN0LnZhbHVlIGFzIFRhc2tQcmlvcml0eSxcbiAgICAgICAgZHVlRGF0ZTogICAgICAgICAgICBkdWVEYXRlSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBkdWVUaW1lOiAgICAgICAgICAgIGR1ZVRpbWVJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGxpc3RJZDogICAgICAgICAgICAgbGlzdFNlbGVjdC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgcmVjU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgICAgICAgICBhbGVydFNlbGVjdC52YWx1ZSBhcyBBbGVydE9mZnNldCxcbiAgICAgICAgdGFnczogICAgICAgICAgICAgICB0YWdzSW5wdXQudmFsdWUgPyB0YWdzSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiBbXSxcbiAgICAgICAgbGlua2VkTm90ZXM6ICAgICAgICBsaW5rZWRJbnB1dC52YWx1ZSA/IGxpbmtlZElucHV0LnZhbHVlLnNwbGl0KFwiLFwiKS5tYXAocyA9PiBzLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pIDogW10sXG4gICAgICAgIHByb2plY3RzOiAgICAgICAgICAgdD8ucHJvamVjdHMgPz8gW10sXG4gICAgICAgIHRpbWVFbnRyaWVzOiAgICAgICAgdD8udGltZUVudHJpZXMgPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogdD8uY29tcGxldGVkSW5zdGFuY2VzID8/IFtdLFxuICAgICAgICBjdXN0b21GaWVsZHM6ICAgICAgIHQ/LmN1c3RvbUZpZWxkcyA/PyBbXSxcbiAgICAgICAgbm90ZXM6ICAgICAgICAgICAgICBub3Rlc0lucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgIH07XG5cbiAgICAgIGlmICh0KSB7XG4gICAgICAgIGF3YWl0IHRoaXMudGFza01hbmFnZXIudXBkYXRlKHsgLi4udCwgLi4udGFza0RhdGEgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmNyZWF0ZSh0YXNrRGF0YSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVEFTS19GT1JNX1ZJRVdfVFlQRSk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhhbmRsZVNhdmUpO1xuICAgIHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGUpID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiKSBoYW5kbGVTYXZlKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGZpZWxkKHBhcmVudDogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3Qgd3JhcCA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZi1maWVsZFwiKTtcbiAgICB3cmFwLmNyZWF0ZURpdihcImNmLWxhYmVsXCIpLnNldFRleHQobGFiZWwpO1xuICAgIHJldHVybiB3cmFwO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgSXRlbVZpZXcsIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0V2ZW50TWFuYWdlclwiO1xuaW1wb3J0IHsgVGFza01hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9UYXNrTWFuYWdlclwiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVFdmVudCwgQ2hyb25pY2xlVGFzayB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgRXZlbnRNb2RhbCB9IGZyb20gXCIuLi91aS9FdmVudE1vZGFsXCI7XG5pbXBvcnQgeyBFdmVudERldGFpbFBvcHVwIH0gZnJvbSBcIi4uL3VpL0V2ZW50RGV0YWlsUG9wdXBcIjtcbmltcG9ydCB7IEV2ZW50Rm9ybVZpZXcsIEVWRU5UX0ZPUk1fVklFV19UWVBFIH0gZnJvbSBcIi4vRXZlbnRGb3JtVmlld1wiO1xuaW1wb3J0IHR5cGUgQ2hyb25pY2xlUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5cbmV4cG9ydCBjb25zdCBDQUxFTkRBUl9WSUVXX1RZUEUgPSBcImNocm9uaWNsZS1jYWxlbmRhci12aWV3XCI7XG50eXBlIENhbGVuZGFyTW9kZSA9IFwiZGF5XCIgfCBcIndlZWtcIiB8IFwibW9udGhcIiB8IFwieWVhclwiO1xuY29uc3QgSE9VUl9IRUlHSFQgPSA1NjtcblxuZXhwb3J0IGNsYXNzIENhbGVuZGFyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBldmVudE1hbmFnZXI6ICAgIEV2ZW50TWFuYWdlcjtcbiAgcHJpdmF0ZSB0YXNrTWFuYWdlcjogICAgIFRhc2tNYW5hZ2VyO1xuICBwcml2YXRlIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICBwcml2YXRlIHBsdWdpbjogICAgICAgICAgQ2hyb25pY2xlUGx1Z2luO1xuICBwcml2YXRlIGN1cnJlbnREYXRlOiBEYXRlICAgICAgICAgPSBuZXcgRGF0ZSgpO1xuICBwcml2YXRlIG1vZGU6ICAgICAgICBDYWxlbmRhck1vZGUgPSBcIndlZWtcIjtcbiAgcHJpdmF0ZSBfbW9kZVNldCAgICAgICAgICAgICAgICAgID0gZmFsc2U7XG4gIHByaXZhdGUgX3JlbmRlclZlcnNpb24gICAgICAgICAgICA9IDA7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbGVhZjogV29ya3NwYWNlTGVhZixcbiAgICBldmVudE1hbmFnZXI6ICAgIEV2ZW50TWFuYWdlcixcbiAgICB0YXNrTWFuYWdlcjogICAgIFRhc2tNYW5hZ2VyLFxuICAgIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyLFxuICAgIHBsdWdpbjogICAgICAgICAgQ2hyb25pY2xlUGx1Z2luXG4gICkge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMuZXZlbnRNYW5hZ2VyICAgID0gZXZlbnRNYW5hZ2VyO1xuICAgIHRoaXMudGFza01hbmFnZXIgICAgID0gdGFza01hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5wbHVnaW4gICAgICAgICAgPSBwbHVnaW47XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiAgICBzdHJpbmcgeyByZXR1cm4gQ0FMRU5EQVJfVklFV19UWVBFOyB9XG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7IHJldHVybiBcIkNhbGVuZGFyXCI7IH1cbiAgZ2V0SWNvbigpOiAgICAgICAgc3RyaW5nIHsgcmV0dXJuIFwiY2FsZW5kYXJcIjsgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHtcbiAgICBhd2FpdCB0aGlzLnJlbmRlcigpO1xuXG4gICAgLy8gU2FtZSBwZXJtYW5lbnQgZml4IGFzIHRhc2sgZGFzaGJvYXJkIFx1MjAxNCBtZXRhZGF0YUNhY2hlIGZpcmVzIGFmdGVyXG4gICAgLy8gZnJvbnRtYXR0ZXIgaXMgZnVsbHkgcGFyc2VkLCBzbyBkYXRhIGlzIGZyZXNoIHdoZW4gd2UgcmUtcmVuZGVyXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5vbihcImNoYW5nZWRcIiwgKGZpbGUpID0+IHtcbiAgICAgICAgY29uc3QgaW5FdmVudHMgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLmV2ZW50TWFuYWdlcltcImV2ZW50c0ZvbGRlclwiXSk7XG4gICAgICAgIGNvbnN0IGluVGFza3MgID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKTtcbiAgICAgICAgaWYgKGluRXZlbnRzIHx8IGluVGFza3MpIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgKHRoaXMuYXBwLndvcmtzcGFjZSBhcyBhbnkpLm9uKFwiY2hyb25pY2xlOnNldHRpbmdzLWNoYW5nZWRcIiwgKCkgPT4gdGhpcy5yZW5kZXIoKSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwiY3JlYXRlXCIsIChmaWxlKSA9PiB7XG4gICAgICAgIGNvbnN0IGluRXZlbnRzID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5ldmVudE1hbmFnZXJbXCJldmVudHNGb2xkZXJcIl0pO1xuICAgICAgICBjb25zdCBpblRhc2tzICA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMudGFza01hbmFnZXJbXCJ0YXNrc0ZvbGRlclwiXSk7XG4gICAgICAgIGlmIChpbkV2ZW50cyB8fCBpblRhc2tzKSBzZXRUaW1lb3V0KCgpID0+IHRoaXMucmVuZGVyKCksIDIwMCk7XG4gICAgICB9KVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAudmF1bHQub24oXCJkZWxldGVcIiwgKGZpbGUpID0+IHtcbiAgICAgICAgY29uc3QgaW5FdmVudHMgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLmV2ZW50TWFuYWdlcltcImV2ZW50c0ZvbGRlclwiXSk7XG4gICAgICAgIGNvbnN0IGluVGFza3MgID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy50YXNrTWFuYWdlcltcInRhc2tzRm9sZGVyXCJdKTtcbiAgICAgICAgaWYgKGluRXZlbnRzIHx8IGluVGFza3MpIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBhc3luYyByZW5kZXIoKSB7XG4gICAgY29uc3QgdmVyc2lvbiA9ICsrdGhpcy5fcmVuZGVyVmVyc2lvbjtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuICAgIGNvbnRhaW5lci5hZGRDbGFzcyhcImNocm9uaWNsZS1jYWwtYXBwXCIpO1xuXG4gICAgY29uc3QgdGFza3MgID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRBbGwoKTtcblxuICAgIC8vIEFwcGx5IGRlZmF1bHQgdmlldyBmcm9tIHNldHRpbmdzIGlmIHRoaXMgaXMgdGhlIGZpcnN0IHJlbmRlclxuICAgIGlmICghdGhpcy5fbW9kZVNldCkge1xuICAgICAgdGhpcy5tb2RlICAgICA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRDYWxlbmRhclZpZXcgPz8gXCJ3ZWVrXCI7XG4gICAgICB0aGlzLl9tb2RlU2V0ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBHZXQgZGF0ZSByYW5nZSBmb3IgY3VycmVudCB2aWV3IHNvIHJlY3VycmVuY2UgZXhwYW5zaW9uIGlzIHNjb3BlZFxuICAgIGNvbnN0IHJhbmdlU3RhcnQgPSB0aGlzLmdldFJhbmdlU3RhcnQoKTtcbiAgICBjb25zdCByYW5nZUVuZCAgID0gdGhpcy5nZXRSYW5nZUVuZCgpO1xuICAgIGNvbnN0IGV2ZW50cyAgICAgPSBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci5nZXRJblJhbmdlV2l0aFJlY3VycmVuY2UocmFuZ2VTdGFydCwgcmFuZ2VFbmQpO1xuXG4gICAgaWYgKHRoaXMuX3JlbmRlclZlcnNpb24gIT09IHZlcnNpb24pIHJldHVybjtcblxuICAgIGNvbnN0IGxheW91dCAgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC1sYXlvdXRcIik7XG4gICAgY29uc3Qgc2lkZWJhciA9IGxheW91dC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2FsLXNpZGViYXJcIik7XG4gICAgY29uc3QgbWFpbiAgICA9IGxheW91dC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2FsLW1haW5cIik7XG5cbiAgICB0aGlzLnJlbmRlclNpZGViYXIoc2lkZWJhcik7XG4gICAgdGhpcy5yZW5kZXJUb29sYmFyKG1haW4pO1xuXG4gICAgaWYgICAgICAodGhpcy5tb2RlID09PSBcInllYXJcIikgIHRoaXMucmVuZGVyWWVhclZpZXcobWFpbiwgZXZlbnRzLCB0YXNrcyk7XG4gICAgZWxzZSBpZiAodGhpcy5tb2RlID09PSBcIm1vbnRoXCIpIHRoaXMucmVuZGVyTW9udGhWaWV3KG1haW4sIGV2ZW50cywgdGFza3MpO1xuICAgIGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gXCJ3ZWVrXCIpICB0aGlzLnJlbmRlcldlZWtWaWV3KG1haW4sIGV2ZW50cywgdGFza3MpO1xuICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJEYXlWaWV3KG1haW4sIGV2ZW50cywgdGFza3MpO1xuICB9XG5cbnByaXZhdGUgYXN5bmMgb3BlbkV2ZW50RnVsbFBhZ2UoZXZlbnQ/OiBDaHJvbmljbGVFdmVudCkge1xuICAgIGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcbiAgICBjb25zdCBleGlzdGluZyA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoRVZFTlRfRk9STV9WSUVXX1RZUEUpWzBdO1xuICAgIGlmIChleGlzdGluZykgZXhpc3RpbmcuZGV0YWNoKCk7XG4gICAgY29uc3QgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogRVZFTlRfRk9STV9WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcblxuICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTtcbiAgICBjb25zdCBmb3JtTGVhZiA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoRVZFTlRfRk9STV9WSUVXX1RZUEUpWzBdO1xuICAgIGNvbnN0IGZvcm1WaWV3ID0gZm9ybUxlYWY/LnZpZXcgYXMgRXZlbnRGb3JtVmlldyB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZm9ybVZpZXcgJiYgZXZlbnQpIGZvcm1WaWV3LmxvYWRFdmVudChldmVudCk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU2lkZWJhciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxucHJpdmF0ZSBnZXRSYW5nZVN0YXJ0KCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJkYXlcIikgcmV0dXJuIHRoaXMuY3VycmVudERhdGUudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJ3ZWVrXCIpIHtcbiAgICAgIGNvbnN0IHMgPSB0aGlzLmdldFdlZWtTdGFydCgpO1xuICAgICAgcmV0dXJuIHMudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgfVxuICAgIGlmICh0aGlzLm1vZGUgPT09IFwieWVhclwiKSByZXR1cm4gYCR7dGhpcy5jdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpfS0wMS0wMWA7XG4gICAgLy8gbW9udGhcbiAgICBjb25zdCB5ID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpO1xuICAgIGNvbnN0IG0gPSB0aGlzLmN1cnJlbnREYXRlLmdldE1vbnRoKCk7XG4gICAgcmV0dXJuIGAke3l9LSR7U3RyaW5nKG0rMSkucGFkU3RhcnQoMixcIjBcIil9LTAxYDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UmFuZ2VFbmQoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcImRheVwiKSByZXR1cm4gdGhpcy5jdXJyZW50RGF0ZS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcIndlZWtcIikge1xuICAgICAgY29uc3QgcyA9IHRoaXMuZ2V0V2Vla1N0YXJ0KCk7XG4gICAgICBjb25zdCBlID0gbmV3IERhdGUocyk7IGUuc2V0RGF0ZShlLmdldERhdGUoKSArIDYpO1xuICAgICAgcmV0dXJuIGUudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgfVxuICAgIGlmICh0aGlzLm1vZGUgPT09IFwieWVhclwiKSByZXR1cm4gYCR7dGhpcy5jdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpfS0xMi0zMWA7XG4gICAgLy8gbW9udGhcbiAgICBjb25zdCB5ID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpO1xuICAgIGNvbnN0IG0gPSB0aGlzLmN1cnJlbnREYXRlLmdldE1vbnRoKCk7XG4gICAgcmV0dXJuIG5ldyBEYXRlKHksIG0gKyAxLCAwKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyU2lkZWJhcihzaWRlYmFyOiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IG5ld0V2ZW50QnRuID0gc2lkZWJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiY2hyb25pY2xlLW5ldy10YXNrLWJ0blwiLCB0ZXh0OiBcIk5ldyBldmVudFwiXG4gICAgfSk7XG4gICAgbmV3RXZlbnRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIG5ldyBFdmVudE1vZGFsKFxuICAgICAgICB0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzLnRhc2tNYW5hZ2VyLFxuICAgICAgICB1bmRlZmluZWQsICgpID0+IHRoaXMucmVuZGVyKCksIChlKSA9PiB0aGlzLm9wZW5FdmVudEZ1bGxQYWdlKGUpXG4gICAgICApLm9wZW4oKTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyTWluaUNhbGVuZGFyKHNpZGViYXIpO1xuXG4gICAgY29uc3QgY2FsU2VjdGlvbiA9IHNpZGViYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3RzLXNlY3Rpb25cIik7XG4gICAgY2FsU2VjdGlvbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtc2VjdGlvbi1sYWJlbFwiKS5zZXRUZXh0KFwiTXkgQ2FsZW5kYXJzXCIpO1xuXG4gICAgZm9yIChjb25zdCBjYWwgb2YgdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCkpIHtcbiAgICAgIGNvbnN0IHJvdyAgICA9IGNhbFNlY3Rpb24uY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC1saXN0LXJvd1wiKTtcbiAgICAgIGNvbnN0IHRvZ2dsZSA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiLCBjbHM6IFwiY2hyb25pY2xlLWNhbC10b2dnbGVcIiB9KTtcbiAgICAgIHRvZ2dsZS5jaGVja2VkID0gY2FsLmlzVmlzaWJsZTtcbiAgICAgIHRvZ2dsZS5zdHlsZS5hY2NlbnRDb2xvciA9IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcik7XG4gICAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLnRvZ2dsZVZpc2liaWxpdHkoY2FsLmlkKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZG90ID0gcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LWRvdFwiKTtcbiAgICAgIGRvdC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpO1xuICAgICAgcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LW5hbWVcIikuc2V0VGV4dChjYWwubmFtZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNaW5pQ2FsZW5kYXIocGFyZW50OiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IG1pbmkgICA9IHBhcmVudC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1jYWxcIik7XG4gICAgY29uc3QgaGVhZGVyID0gbWluaS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1jYWwtaGVhZGVyXCIpO1xuXG4gICAgY29uc3QgcHJldkJ0biAgICA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjaHJvbmljbGUtbWluaS1uYXZcIiwgdGV4dDogXCJcdTIwMzlcIiB9KTtcbiAgICBjb25zdCBtb250aExhYmVsID0gaGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1taW5pLW1vbnRoLWxhYmVsXCIpO1xuICAgIGNvbnN0IG5leHRCdG4gICAgPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2hyb25pY2xlLW1pbmktbmF2XCIsIHRleHQ6IFwiXHUyMDNBXCIgfSk7XG5cbiAgICBjb25zdCB5ZWFyICA9IHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBtb250aCA9IHRoaXMuY3VycmVudERhdGUuZ2V0TW9udGgoKTtcbiAgICBtb250aExhYmVsLnNldFRleHQoXG4gICAgICBuZXcgRGF0ZSh5ZWFyLCBtb250aCkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyBtb250aDogXCJsb25nXCIsIHllYXI6IFwibnVtZXJpY1wiIH0pXG4gICAgKTtcblxuICAgIHByZXZCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY3VycmVudERhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCAtIDEsIDEpO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9KTtcbiAgICBuZXh0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmN1cnJlbnREYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGggKyAxLCAxKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBncmlkICAgICAgICA9IG1pbmkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktZ3JpZFwiKTtcbiAgICBjb25zdCBmaXJzdERheSAgICA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCAxKS5nZXREYXkoKTtcbiAgICBjb25zdCBkYXlzSW5Nb250aCA9IG5ldyBEYXRlKHllYXIsIG1vbnRoICsgMSwgMCkuZ2V0RGF0ZSgpO1xuICAgIGNvbnN0IHRvZGF5U3RyICAgID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIGZvciAoY29uc3QgZCBvZiBbXCJTXCIsXCJNXCIsXCJUXCIsXCJXXCIsXCJUXCIsXCJGXCIsXCJTXCJdKVxuICAgICAgZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1kYXktbmFtZVwiKS5zZXRUZXh0KGQpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaXJzdERheTsgaSsrKVxuICAgICAgZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1kYXkgY2hyb25pY2xlLW1pbmktZGF5LWVtcHR5XCIpO1xuXG4gICAgZm9yIChsZXQgZCA9IDE7IGQgPD0gZGF5c0luTW9udGg7IGQrKykge1xuICAgICAgY29uc3QgZGF0ZVN0ciA9IGAke3llYXJ9LSR7U3RyaW5nKG1vbnRoKzEpLnBhZFN0YXJ0KDIsXCIwXCIpfS0ke1N0cmluZyhkKS5wYWRTdGFydCgyLFwiMFwiKX1gO1xuICAgICAgY29uc3QgZGF5RWwgICA9IGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktZGF5XCIpO1xuICAgICAgZGF5RWwuc2V0VGV4dChTdHJpbmcoZCkpO1xuICAgICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSBkYXlFbC5hZGRDbGFzcyhcInRvZGF5XCIpO1xuICAgICAgZGF5RWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5jdXJyZW50RGF0ZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkKTtcbiAgICAgICAgdGhpcy5tb2RlID0gXCJkYXlcIjtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBUb29sYmFyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyVG9vbGJhcihtYWluOiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IHRvb2xiYXIgID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2FsLXRvb2xiYXJcIik7XG4gICAgY29uc3QgbmF2R3JvdXAgPSB0b29sYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS1jYWwtbmF2LWdyb3VwXCIpO1xuXG4gICAgbmF2R3JvdXAuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2hyb25pY2xlLWNhbC1uYXYtYnRuXCIsIHRleHQ6IFwiXHUyMDM5XCIgfSlcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZSgtMSkpO1xuICAgIG5hdkdyb3VwLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNocm9uaWNsZS1jYWwtdG9kYXktYnRuXCIsIHRleHQ6IFwiVG9kYXlcIiB9KVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpOyB0aGlzLnJlbmRlcigpOyB9KTtcbiAgICBuYXZHcm91cC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjaHJvbmljbGUtY2FsLW5hdi1idG5cIiwgdGV4dDogXCJcdTIwM0FcIiB9KVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKDEpKTtcblxuICAgIHRvb2xiYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC10b29sYmFyLXRpdGxlXCIpLnNldFRleHQodGhpcy5nZXRUb29sYmFyVGl0bGUoKSk7XG5cbiAgICBjb25zdCBwaWxscyA9IHRvb2xiYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXZpZXctcGlsbHNcIik7XG4gICAgZm9yIChjb25zdCBbbSwgbGFiZWxdIG9mIFtbXCJkYXlcIixcIkRheVwiXSxbXCJ3ZWVrXCIsXCJXZWVrXCJdLFtcIm1vbnRoXCIsXCJNb250aFwiXSxbXCJ5ZWFyXCIsXCJZZWFyXCJdXSBhcyBbQ2FsZW5kYXJNb2RlLHN0cmluZ11bXSkge1xuICAgICAgY29uc3QgcGlsbCA9IHBpbGxzLmNyZWF0ZURpdihcImNocm9uaWNsZS12aWV3LXBpbGxcIik7XG4gICAgICBwaWxsLnNldFRleHQobGFiZWwpO1xuICAgICAgaWYgKHRoaXMubW9kZSA9PT0gbSkgcGlsbC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5tb2RlID0gbTsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBuYXZpZ2F0ZShkaXI6IG51bWJlcikge1xuICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSh0aGlzLmN1cnJlbnREYXRlKTtcbiAgICBpZiAgICAgICh0aGlzLm1vZGUgPT09IFwiZGF5XCIpICBkLnNldERhdGUoZC5nZXREYXRlKCkgKyBkaXIpO1xuICAgIGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gXCJ3ZWVrXCIpIGQuc2V0RGF0ZShkLmdldERhdGUoKSArIGRpciAqIDcpO1xuICAgIGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gXCJ5ZWFyXCIpIGQuc2V0RnVsbFllYXIoZC5nZXRGdWxsWWVhcigpICsgZGlyKTtcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5zZXRNb250aChkLmdldE1vbnRoKCkgKyBkaXIpO1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBkO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIGdldFRvb2xiYXJUaXRsZSgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwieWVhclwiKSAgcmV0dXJuIFN0cmluZyh0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCkpO1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwibW9udGhcIikgcmV0dXJuIHRoaXMuY3VycmVudERhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyBtb250aDogXCJsb25nXCIsIHllYXI6IFwibnVtZXJpY1wiIH0pO1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwiZGF5XCIpICAgcmV0dXJuIHRoaXMuY3VycmVudERhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyB3ZWVrZGF5OiBcImxvbmdcIiwgbW9udGg6IFwibG9uZ1wiLCBkYXk6IFwibnVtZXJpY1wiLCB5ZWFyOiBcIm51bWVyaWNcIiB9KTtcbiAgICBjb25zdCBzdGFydCA9IHRoaXMuZ2V0V2Vla1N0YXJ0KCk7XG4gICAgY29uc3QgZW5kICAgPSBuZXcgRGF0ZShzdGFydCk7IGVuZC5zZXREYXRlKGVuZC5nZXREYXRlKCkgKyA2KTtcbiAgICByZXR1cm4gYCR7c3RhcnQudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIix7IG1vbnRoOlwic2hvcnRcIiwgZGF5OlwibnVtZXJpY1wiIH0pfSBcdTIwMTMgJHtlbmQudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIix7IG1vbnRoOlwic2hvcnRcIiwgZGF5OlwibnVtZXJpY1wiLCB5ZWFyOlwibnVtZXJpY1wiIH0pfWA7XG4gIH1cblxuICBwcml2YXRlIGdldFdlZWtTdGFydCgpOiBEYXRlIHtcbiAgICBjb25zdCBkID0gbmV3IERhdGUodGhpcy5jdXJyZW50RGF0ZSk7XG4gICAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpIC0gZC5nZXREYXkoKSk7XG4gICAgcmV0dXJuIGQ7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgWWVhciB2aWV3IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyWWVhclZpZXcobWFpbjogSFRNTEVsZW1lbnQsIGV2ZW50czogQ2hyb25pY2xlRXZlbnRbXSwgdGFza3M6IENocm9uaWNsZVRhc2tbXSkge1xuICAgIGNvbnN0IHllYXIgICAgID0gdGhpcy5jdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpO1xuICAgIGNvbnN0IHRvZGF5U3RyID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCB5ZWFyR3JpZCA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLXllYXItZ3JpZFwiKTtcblxuICAgIGZvciAobGV0IG0gPSAwOyBtIDwgMTI7IG0rKykge1xuICAgICAgY29uc3QgY2FyZCA9IHllYXJHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLW1vbnRoLWNhcmRcIik7XG4gICAgICBjb25zdCBuYW1lID0gY2FyZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1tb250aC1uYW1lXCIpO1xuICAgICAgbmFtZS5zZXRUZXh0KG5ldyBEYXRlKHllYXIsIG0pLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgbW9udGg6IFwibG9uZ1wiIH0pKTtcbiAgICAgIG5hbWUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50RGF0ZSA9IG5ldyBEYXRlKHllYXIsIG0sIDEpOyB0aGlzLm1vZGUgPSBcIm1vbnRoXCI7IHRoaXMucmVuZGVyKCk7IH0pO1xuXG4gICAgICBjb25zdCBtaW5pR3JpZCAgICA9IGNhcmQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXllYXItbWluaS1ncmlkXCIpO1xuICAgICAgY29uc3QgZmlyc3REYXkgICAgPSBuZXcgRGF0ZSh5ZWFyLCBtLCAxKS5nZXREYXkoKTtcbiAgICAgIGNvbnN0IGRheXNJbk1vbnRoID0gbmV3IERhdGUoeWVhciwgbSArIDEsIDApLmdldERhdGUoKTtcblxuICAgICAgZm9yIChjb25zdCBkIG9mIFtcIlNcIixcIk1cIixcIlRcIixcIldcIixcIlRcIixcIkZcIixcIlNcIl0pXG4gICAgICAgIG1pbmlHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLWRheS1uYW1lXCIpLnNldFRleHQoZCk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlyc3REYXk7IGkrKylcbiAgICAgICAgbWluaUdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXllYXItZGF5LWVtcHR5XCIpO1xuXG4gICAgICBmb3IgKGxldCBkID0gMTsgZCA8PSBkYXlzSW5Nb250aDsgZCsrKSB7XG4gICAgICAgIGNvbnN0IGRhdGVTdHIgID0gYCR7eWVhcn0tJHtTdHJpbmcobSsxKS5wYWRTdGFydCgyLFwiMFwiKX0tJHtTdHJpbmcoZCkucGFkU3RhcnQoMixcIjBcIil9YDtcbiAgICAgICAgY29uc3QgaGFzRXZlbnQgPSBldmVudHMuc29tZShlID0+IGUuc3RhcnREYXRlID09PSBkYXRlU3RyICYmIHRoaXMuaXNDYWxlbmRhclZpc2libGUoZS5jYWxlbmRhcklkKSk7XG4gICAgICAgIGNvbnN0IGhhc1Rhc2sgID0gdGFza3Muc29tZSh0ID0+IHQuZHVlRGF0ZSA9PT0gZGF0ZVN0ciAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpO1xuICAgICAgICBjb25zdCBkYXlFbCAgICA9IG1pbmlHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLWRheVwiKTtcbiAgICAgICAgZGF5RWwuc2V0VGV4dChTdHJpbmcoZCkpO1xuICAgICAgICBpZiAoZGF0ZVN0ciA9PT0gdG9kYXlTdHIpIGRheUVsLmFkZENsYXNzKFwidG9kYXlcIik7XG4gICAgICAgIGlmIChoYXNFdmVudCkgZGF5RWwuYWRkQ2xhc3MoXCJoYXMtZXZlbnRcIik7XG4gICAgICAgIGlmIChoYXNUYXNrKSAgZGF5RWwuYWRkQ2xhc3MoXCJoYXMtdGFza1wiKTtcbiAgICAgICAgZGF5RWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50RGF0ZSA9IG5ldyBEYXRlKHllYXIsIG0sIGQpOyB0aGlzLm1vZGUgPSBcImRheVwiOyB0aGlzLnJlbmRlcigpOyB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgTW9udGggdmlldyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHJlbmRlck1vbnRoVmlldyhtYWluOiBIVE1MRWxlbWVudCwgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdLCB0YXNrczogQ2hyb25pY2xlVGFza1tdKSB7XG4gICAgY29uc3QgeWVhciAgICAgPSB0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgY29uc3QgbW9udGggICAgPSB0aGlzLmN1cnJlbnREYXRlLmdldE1vbnRoKCk7XG4gICAgY29uc3QgdG9kYXlTdHIgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IGdyaWQgICAgID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtZ3JpZFwiKTtcblxuICAgIGZvciAoY29uc3QgZCBvZiBbXCJTdW5cIixcIk1vblwiLFwiVHVlXCIsXCJXZWRcIixcIlRodVwiLFwiRnJpXCIsXCJTYXRcIl0pXG4gICAgICBncmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1kYXktbmFtZVwiKS5zZXRUZXh0KGQpO1xuXG4gICAgY29uc3QgZmlyc3REYXkgICAgICA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCAxKS5nZXREYXkoKTtcbiAgICBjb25zdCBkYXlzSW5Nb250aCAgID0gbmV3IERhdGUoeWVhciwgbW9udGggKyAxLCAwKS5nZXREYXRlKCk7XG4gICAgY29uc3QgZGF5c0luUHJldk1vbiA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCAwKS5nZXREYXRlKCk7XG5cbiAgICBmb3IgKGxldCBpID0gZmlyc3REYXkgLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3QgY2VsbCA9IGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGwgY2hyb25pY2xlLW1vbnRoLWNlbGwtb3RoZXJcIik7XG4gICAgICBjZWxsLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1jZWxsLW51bVwiKS5zZXRUZXh0KFN0cmluZyhkYXlzSW5QcmV2TW9uIC0gaSkpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGQgPSAxOyBkIDw9IGRheXNJbk1vbnRoOyBkKyspIHtcbiAgICAgIGNvbnN0IGRhdGVTdHIgPSBgJHt5ZWFyfS0ke1N0cmluZyhtb250aCsxKS5wYWRTdGFydCgyLFwiMFwiKX0tJHtTdHJpbmcoZCkucGFkU3RhcnQoMixcIjBcIil9YDtcbiAgICAgIGNvbnN0IGNlbGwgICAgPSBncmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1jZWxsXCIpO1xuICAgICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSBjZWxsLmFkZENsYXNzKFwidG9kYXlcIik7XG4gICAgICBjZWxsLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1jZWxsLW51bVwiKS5zZXRUZXh0KFN0cmluZyhkKSk7XG5cbiAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsICgpID0+IHRoaXMub3Blbk5ld0V2ZW50TW9kYWwoZGF0ZVN0ciwgdHJ1ZSkpO1xuICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnNob3dDYWxDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZGF0ZVN0ciwgdHJ1ZSk7XG4gICAgICB9KTtcblxuICAgICAgZXZlbnRzLmZpbHRlcihlID0+IGUuc3RhcnREYXRlID09PSBkYXRlU3RyICYmIHRoaXMuaXNDYWxlbmRhclZpc2libGUoZS5jYWxlbmRhcklkKSkuc2xpY2UoMCwzKVxuICAgICAgICAuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICAgICAgY29uc3QgY2FsICAgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGV2ZW50LmNhbGVuZGFySWQgPz8gXCJcIik7XG4gICAgICAgICAgY29uc3QgY29sb3IgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCIjMzc4QUREXCI7XG4gICAgICAgICAgY29uc3QgcGlsbCAgPSBjZWxsLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1ldmVudC1waWxsXCIpO1xuICAgICAgICAgIHBpbGwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IgKyBcIjMzXCI7XG4gICAgICAgICAgcGlsbC5zdHlsZS5ib3JkZXJMZWZ0ICAgICAgPSBgM3B4IHNvbGlkICR7Y29sb3J9YDtcbiAgICAgICAgICBwaWxsLnN0eWxlLmNvbG9yICAgICAgICAgICA9IGNvbG9yO1xuICAgICAgICAgIHBpbGwuc2V0VGV4dChldmVudC50aXRsZSk7XG4gICAgICAgICAgcGlsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBuZXcgRXZlbnREZXRhaWxQb3B1cCh0aGlzLmFwcCwgZXZlbnQsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzLnRhc2tNYW5hZ2VyLCB0aGlzLnBsdWdpbi5zZXR0aW5ncy50aW1lRm9ybWF0LCAoKSA9PiBuZXcgRXZlbnRNb2RhbCh0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzLnRhc2tNYW5hZ2VyLCBldmVudCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGV2KSA9PiB0aGlzLm9wZW5FdmVudEZ1bGxQYWdlKGV2KSkub3BlbigpKS5vcGVuKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICB0YXNrcy5maWx0ZXIodCA9PiB0LmR1ZURhdGUgPT09IGRhdGVTdHIgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKS5zbGljZSgwLDIpXG4gICAgICAgIC5mb3JFYWNoKHRhc2sgPT4ge1xuICAgICAgICAgIGNvbnN0IHBpbGwgPSBjZWxsLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1ldmVudC1waWxsXCIpO1xuICAgICAgICAgIHBpbGwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCIjRkYzQjMwMjJcIjtcbiAgICAgICAgICBwaWxsLnN0eWxlLmJvcmRlckxlZnQgICAgICA9IFwiM3B4IHNvbGlkICNGRjNCMzBcIjtcbiAgICAgICAgICBwaWxsLnN0eWxlLmNvbG9yICAgICAgICAgICA9IFwiI0ZGM0IzMFwiO1xuICAgICAgICAgIHBpbGwuc2V0VGV4dChcIlx1MjcxMyBcIiArIHRhc2sudGl0bGUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCByZW1haW5pbmcgPSA3IC0gKChmaXJzdERheSArIGRheXNJbk1vbnRoKSAlIDcpO1xuICAgIGlmIChyZW1haW5pbmcgPCA3KVxuICAgICAgZm9yIChsZXQgZCA9IDE7IGQgPD0gcmVtYWluaW5nOyBkKyspIHtcbiAgICAgICAgY29uc3QgY2VsbCA9IGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGwgY2hyb25pY2xlLW1vbnRoLWNlbGwtb3RoZXJcIik7XG4gICAgICAgIGNlbGwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGwtbnVtXCIpLnNldFRleHQoU3RyaW5nKGQpKTtcbiAgICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBXZWVrIHZpZXcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSByZW5kZXJXZWVrVmlldyhtYWluOiBIVE1MRWxlbWVudCwgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdLCB0YXNrczogQ2hyb25pY2xlVGFza1tdKSB7XG4gICAgY29uc3Qgd2Vla1N0YXJ0ID0gdGhpcy5nZXRXZWVrU3RhcnQoKTtcbiAgICBjb25zdCBkYXlzOiBEYXRlW10gPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiA3IH0sIChfLCBpKSA9PiB7XG4gICAgICBjb25zdCBkID0gbmV3IERhdGUod2Vla1N0YXJ0KTsgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgaSk7IHJldHVybiBkO1xuICAgIH0pO1xuICAgIGNvbnN0IHRvZGF5U3RyID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIC8vIFRoZSB3ZWVrIGdyaWQ6IHRpbWUtY29sICsgNyBkYXktY29sc1xuICAgIC8vIEVhY2ggZGF5LWNvbCBjb250YWluczogaGVhZGVyIFx1MjE5MiBhbGwtZGF5IHNoZWxmIFx1MjE5MiB0aW1lIGdyaWRcbiAgICAvLyBUaGlzIG1pcnJvcnMgZGF5IHZpZXcgZXhhY3RseSBcdTIwMTQgc2hlbGYgaXMgYWx3YXlzIGJlbG93IHRoZSBkYXRlIGhlYWRlclxuICAgIGNvbnN0IGNhbEdyaWQgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS13ZWVrLWdyaWRcIik7XG5cbiAgICAvLyBUaW1lIGNvbHVtblxuICAgIGNvbnN0IHRpbWVDb2wgPSBjYWxHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS10aW1lLWNvbFwiKTtcbiAgICAvLyBCbGFuayBjZWxsIHRoYXQgYWxpZ25zIHdpdGggdGhlIGRheSBoZWFkZXIgcm93XG4gICAgdGltZUNvbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGltZS1jb2wtaGVhZGVyXCIpO1xuICAgIC8vIEJsYW5rIGNlbGwgdGhhdCBhbGlnbnMgd2l0aCB0aGUgYWxsLWRheSBzaGVsZiByb3dcbiAgICBjb25zdCBzaGVsZlNwYWNlciA9IHRpbWVDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbWUtY29sLXNoZWxmLXNwYWNlclwiKTtcbiAgICBzaGVsZlNwYWNlci5zZXRUZXh0KFwiYWxsLWRheVwiKTtcbiAgICAvLyBIb3VyIGxhYmVsc1xuICAgIGZvciAobGV0IGggPSAwOyBoIDwgMjQ7IGgrKylcbiAgICAgIHRpbWVDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbWUtc2xvdFwiKS5zZXRUZXh0KHRoaXMuZm9ybWF0SG91cihoKSk7XG5cbiAgICAvLyBEYXkgY29sdW1uc1xuICAgIGZvciAoY29uc3QgZGF5IG9mIGRheXMpIHtcbiAgICAgIGNvbnN0IGRhdGVTdHIgICAgICA9IGRheS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICAgIGNvbnN0IGNvbCAgICAgICAgICA9IGNhbEdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1jb2xcIik7XG4gICAgICBjb25zdCBhbGxEYXlFdmVudHMgPSBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgZS5hbGxEYXkgJiYgdGhpcy5pc0NhbGVuZGFyVmlzaWJsZShlLmNhbGVuZGFySWQpKTtcblxuICAgICAgLy8gMS4gRGF5IGhlYWRlclxuICAgICAgY29uc3QgZGF5SGVhZGVyID0gY29sLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktaGVhZGVyXCIpO1xuICAgICAgZGF5SGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktbmFtZVwiKS5zZXRUZXh0KFxuICAgICAgICBkYXkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyB3ZWVrZGF5OiBcInNob3J0XCIgfSkudG9VcHBlckNhc2UoKVxuICAgICAgKTtcbiAgICAgIGNvbnN0IGRheU51bSA9IGRheUhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LW51bVwiKTtcbiAgICAgIGRheU51bS5zZXRUZXh0KFN0cmluZyhkYXkuZ2V0RGF0ZSgpKSk7XG4gICAgICBpZiAoZGF0ZVN0ciA9PT0gdG9kYXlTdHIpIGRheU51bS5hZGRDbGFzcyhcInRvZGF5XCIpO1xuXG4gICAgICAvLyAyLiBBbGwtZGF5IHNoZWxmIFx1MjAxNCBzaXRzIGRpcmVjdGx5IGJlbG93IGhlYWRlciwgc2FtZSBhcyBkYXkgdmlld1xuICAgICAgY29uc3Qgc2hlbGYgPSBjb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXdlZWstYWxsZGF5LXNoZWxmXCIpO1xuICAgICAgZm9yIChjb25zdCBldmVudCBvZiBhbGxEYXlFdmVudHMpXG4gICAgICAgIHRoaXMucmVuZGVyRXZlbnRQaWxsQWxsRGF5KHNoZWxmLCBldmVudCk7XG5cbiAgICAgIC8vIDMuIFRpbWUgZ3JpZFxuICAgICAgY29uc3QgdGltZUdyaWQgPSBjb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS10aW1lLWdyaWRcIik7XG4gICAgICB0aW1lR3JpZC5zdHlsZS5oZWlnaHQgPSBgJHsyNCAqIEhPVVJfSEVJR0hUfXB4YDtcblxuICAgICAgZm9yIChsZXQgaCA9IDA7IGggPCAyNDsgaCsrKSB7XG4gICAgICAgIGNvbnN0IGxpbmUgPSB0aW1lR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtaG91ci1saW5lXCIpO1xuICAgICAgICBsaW5lLnN0eWxlLnRvcCA9IGAke2ggKiBIT1VSX0hFSUdIVH1weGA7XG4gICAgICB9XG5cbiAgICAgIHRpbWVHcmlkLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICBjb25zdCByZWN0ICAgPSB0aW1lR3JpZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgeSAgICAgID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICAgIGNvbnN0IGhvdXIgICA9IE1hdGgubWluKE1hdGguZmxvb3IoeSAvIEhPVVJfSEVJR0hUKSwgMjMpO1xuICAgICAgICBjb25zdCBtaW51dGUgPSBNYXRoLmZsb29yKCh5ICUgSE9VUl9IRUlHSFQpIC8gSE9VUl9IRUlHSFQgKiA2MCAvIDE1KSAqIDE1O1xuICAgICAgICB0aGlzLm9wZW5OZXdFdmVudE1vZGFsKGRhdGVTdHIsIGZhbHNlLCBob3VyLCBtaW51dGUpO1xuICAgICAgfSk7XG5cbiAgICAgIHRpbWVHcmlkLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IHJlY3QgICA9IHRpbWVHcmlkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCB5ICAgICAgPSBlLmNsaWVudFkgLSByZWN0LnRvcDtcbiAgICAgICAgY29uc3QgaG91ciAgID0gTWF0aC5taW4oTWF0aC5mbG9vcih5IC8gSE9VUl9IRUlHSFQpLCAyMyk7XG4gICAgICAgIGNvbnN0IG1pbnV0ZSA9IE1hdGguZmxvb3IoKHkgJSBIT1VSX0hFSUdIVCkgLyBIT1VSX0hFSUdIVCAqIDYwIC8gMTUpICogMTU7XG4gICAgICAgIHRoaXMuc2hvd0NhbENvbnRleHRNZW51KGUuY2xpZW50WCwgZS5jbGllbnRZLCBkYXRlU3RyLCBmYWxzZSwgaG91ciwgbWludXRlKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUaW1lZCBldmVudHNcbiAgICAgIGV2ZW50cy5maWx0ZXIoZSA9PiBlLnN0YXJ0RGF0ZSA9PT0gZGF0ZVN0ciAmJiAhZS5hbGxEYXkgJiYgZS5zdGFydFRpbWUgJiYgdGhpcy5pc0NhbGVuZGFyVmlzaWJsZShlLmNhbGVuZGFySWQpKVxuICAgICAgICAuZm9yRWFjaChldmVudCA9PiB0aGlzLnJlbmRlckV2ZW50UGlsbFRpbWVkKHRpbWVHcmlkLCBldmVudCkpO1xuXG4gICAgICAvLyBUYXNrIGR1ZSBwaWxsc1xuICAgICAgdGFza3MuZmlsdGVyKHQgPT4gdC5kdWVEYXRlID09PSBkYXRlU3RyICYmIHQuc3RhdHVzICE9PSBcImRvbmVcIilcbiAgICAgICAgLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgICAgY29uc3QgdG9wICA9IHRhc2suZHVlVGltZVxuICAgICAgICAgICAgPyAoKCkgPT4geyBjb25zdCBbaCxtXSA9IHRhc2suZHVlVGltZSEuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpOyByZXR1cm4gKGggKyBtLzYwKSAqIEhPVVJfSEVJR0hUOyB9KSgpXG4gICAgICAgICAgICA6IDA7XG4gICAgICAgICAgY29uc3QgcGlsbCA9IHRpbWVHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLWRheS1waWxsXCIpO1xuICAgICAgICAgIHBpbGwuc3R5bGUudG9wICAgICAgICAgICAgID0gYCR7dG9wfXB4YDtcbiAgICAgICAgICBwaWxsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiI0ZGM0IzMDIyXCI7XG4gICAgICAgICAgcGlsbC5zdHlsZS5ib3JkZXJMZWZ0ICAgICAgPSBcIjNweCBzb2xpZCAjRkYzQjMwXCI7XG4gICAgICAgICAgcGlsbC5zdHlsZS5jb2xvciAgICAgICAgICAgPSBcIiNGRjNCMzBcIjtcbiAgICAgICAgICBwaWxsLnNldFRleHQoXCJcdTI3MTMgXCIgKyB0YXNrLnRpdGxlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gTm93IGxpbmVcbiAgICBjb25zdCBub3cgICAgICAgICA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3Qgbm93U3RyICAgICAgPSBub3cudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgdG9kYXlDb2xJZHggPSBkYXlzLmZpbmRJbmRleChkID0+IGQudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF0gPT09IG5vd1N0cik7XG4gICAgaWYgKHRvZGF5Q29sSWR4ID49IDApIHtcbiAgICAgIGNvbnN0IGNvbHMgICAgID0gY2FsR3JpZC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNocm9uaWNsZS1kYXktY29sXCIpO1xuICAgICAgY29uc3QgdG9kYXlDb2wgPSBjb2xzW3RvZGF5Q29sSWR4XSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGNvbnN0IHRnICAgICAgID0gdG9kYXlDb2wucXVlcnlTZWxlY3RvcihcIi5jaHJvbmljbGUtZGF5LXRpbWUtZ3JpZFwiKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmICh0Zykge1xuICAgICAgICBjb25zdCB0b3AgID0gKG5vdy5nZXRIb3VycygpICsgbm93LmdldE1pbnV0ZXMoKSAvIDYwKSAqIEhPVVJfSEVJR0hUO1xuICAgICAgICBjb25zdCBsaW5lID0gdGcuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW5vdy1saW5lXCIpO1xuICAgICAgICBsaW5lLnN0eWxlLnRvcCA9IGAke3RvcH1weGA7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIERheSB2aWV3IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyRGF5VmlldyhtYWluOiBIVE1MRWxlbWVudCwgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdLCB0YXNrczogQ2hyb25pY2xlVGFza1tdKSB7XG4gICAgY29uc3QgZGF0ZVN0ciAgICAgID0gdGhpcy5jdXJyZW50RGF0ZS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCB0b2RheVN0ciAgICAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IGFsbERheUV2ZW50cyA9IGV2ZW50cy5maWx0ZXIoZSA9PiBlLnN0YXJ0RGF0ZSA9PT0gZGF0ZVN0ciAmJiBlLmFsbERheSAmJiB0aGlzLmlzQ2FsZW5kYXJWaXNpYmxlKGUuY2FsZW5kYXJJZCkpO1xuICAgIGNvbnN0IGRheVZpZXcgICAgICA9IG1haW4uY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS12aWV3XCIpO1xuXG4gICAgLy8gRGF5IGhlYWRlclxuICAgIGNvbnN0IGRheUhlYWRlciA9IGRheVZpZXcuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS12aWV3LWhlYWRlclwiKTtcbiAgICBkYXlIZWFkZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1uYW1lLWxhcmdlXCIpLnNldFRleHQoXG4gICAgICB0aGlzLmN1cnJlbnREYXRlLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgd2Vla2RheTogXCJsb25nXCIgfSkudG9VcHBlckNhc2UoKVxuICAgICk7XG4gICAgY29uc3QgbnVtRWwgPSBkYXlIZWFkZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1udW0tbGFyZ2VcIik7XG4gICAgbnVtRWwuc2V0VGV4dChTdHJpbmcodGhpcy5jdXJyZW50RGF0ZS5nZXREYXRlKCkpKTtcbiAgICBpZiAoZGF0ZVN0ciA9PT0gdG9kYXlTdHIpIG51bUVsLmFkZENsYXNzKFwidG9kYXlcIik7XG5cbiAgICAvLyBBbGwtZGF5IHNoZWxmXG4gICAgY29uc3Qgc2hlbGYgICAgICAgID0gZGF5Vmlldy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LWFsbGRheS1zaGVsZlwiKTtcbiAgICBzaGVsZi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LWFsbGRheS1sYWJlbFwiKS5zZXRUZXh0KFwiYWxsLWRheVwiKTtcbiAgICBjb25zdCBzaGVsZkNvbnRlbnQgPSBzaGVsZi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LWFsbGRheS1jb250ZW50XCIpO1xuICAgIGZvciAoY29uc3QgZXZlbnQgb2YgYWxsRGF5RXZlbnRzKVxuICAgICAgdGhpcy5yZW5kZXJFdmVudFBpbGxBbGxEYXkoc2hlbGZDb250ZW50LCBldmVudCk7XG5cbiAgICAvLyBUaW1lIGFyZWFcbiAgICBjb25zdCB0aW1lQXJlYSAgID0gZGF5Vmlldy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LXNpbmdsZS1hcmVhXCIpO1xuICAgIGNvbnN0IHRpbWVMYWJlbHMgPSB0aW1lQXJlYS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LXNpbmdsZS1sYWJlbHNcIik7XG4gICAgY29uc3QgZXZlbnRDb2wgICA9IHRpbWVBcmVhLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktc2luZ2xlLWV2ZW50c1wiKTtcbiAgICBldmVudENvbC5zdHlsZS5oZWlnaHQgPSBgJHsyNCAqIEhPVVJfSEVJR0hUfXB4YDtcblxuICAgIGZvciAobGV0IGggPSAwOyBoIDwgMjQ7IGgrKykge1xuICAgICAgdGltZUxhYmVscy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGltZS1zbG90XCIpLnNldFRleHQodGhpcy5mb3JtYXRIb3VyKGgpKTtcbiAgICAgIGNvbnN0IGxpbmUgPSBldmVudENvbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtaG91ci1saW5lXCIpO1xuICAgICAgbGluZS5zdHlsZS50b3AgPSBgJHtoICogSE9VUl9IRUlHSFR9cHhgO1xuICAgIH1cblxuICAgIGV2ZW50Q29sLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgY29uc3QgcmVjdCAgID0gZXZlbnRDb2wuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCB5ICAgICAgPSBlLmNsaWVudFkgLSByZWN0LnRvcDtcbiAgICAgIGNvbnN0IGhvdXIgICA9IE1hdGgubWluKE1hdGguZmxvb3IoeSAvIEhPVVJfSEVJR0hUKSwgMjMpO1xuICAgICAgY29uc3QgbWludXRlID0gTWF0aC5mbG9vcigoeSAlIEhPVVJfSEVJR0hUKSAvIEhPVVJfSEVJR0hUICogNjAgLyAxNSkgKiAxNTtcbiAgICAgIHRoaXMub3Blbk5ld0V2ZW50TW9kYWwoZGF0ZVN0ciwgZmFsc2UsIGhvdXIsIG1pbnV0ZSk7XG4gICAgfSk7XG5cbiAgICBldmVudENvbC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHJlY3QgICA9IGV2ZW50Q29sLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgeSAgICAgID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICBjb25zdCBob3VyICAgPSBNYXRoLm1pbihNYXRoLmZsb29yKHkgLyBIT1VSX0hFSUdIVCksIDIzKTtcbiAgICAgIGNvbnN0IG1pbnV0ZSA9IE1hdGguZmxvb3IoKHkgJSBIT1VSX0hFSUdIVCkgLyBIT1VSX0hFSUdIVCAqIDYwIC8gMTUpICogMTU7XG4gICAgICB0aGlzLnNob3dDYWxDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZGF0ZVN0ciwgZmFsc2UsIGhvdXIsIG1pbnV0ZSk7XG4gICAgfSk7XG5cbiAgICBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgIWUuYWxsRGF5ICYmIGUuc3RhcnRUaW1lICYmIHRoaXMuaXNDYWxlbmRhclZpc2libGUoZS5jYWxlbmRhcklkKSlcbiAgICAgIC5mb3JFYWNoKGV2ZW50ID0+IHRoaXMucmVuZGVyRXZlbnRQaWxsVGltZWQoZXZlbnRDb2wsIGV2ZW50KSk7XG5cbiAgICB0YXNrcy5maWx0ZXIodCA9PiB0LmR1ZURhdGUgPT09IGRhdGVTdHIgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKVxuICAgICAgLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgIGNvbnN0IHRvcCAgPSB0YXNrLmR1ZVRpbWVcbiAgICAgICAgICA/ICgoKSA9PiB7IGNvbnN0IFtoLG1dID0gdGFzay5kdWVUaW1lIS5zcGxpdChcIjpcIikubWFwKE51bWJlcik7IHJldHVybiAoaCArIG0vNjApICogSE9VUl9IRUlHSFQ7IH0pKClcbiAgICAgICAgICA6IDA7XG4gICAgICAgIGNvbnN0IHBpbGwgPSBldmVudENvbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFzay1kYXktcGlsbFwiKTtcbiAgICAgICAgcGlsbC5zdHlsZS50b3AgICAgICAgICAgICAgPSBgJHt0b3B9cHhgO1xuICAgICAgICBwaWxsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiI0ZGM0IzMDIyXCI7XG4gICAgICAgIHBpbGwuc3R5bGUuYm9yZGVyTGVmdCAgICAgID0gXCIzcHggc29saWQgI0ZGM0IzMFwiO1xuICAgICAgICBwaWxsLnN0eWxlLmNvbG9yICAgICAgICAgICA9IFwiI0ZGM0IzMFwiO1xuICAgICAgICBwaWxsLnNldFRleHQoXCJcdTI3MTMgXCIgKyB0YXNrLnRpdGxlKTtcbiAgICAgIH0pO1xuXG4gICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSB7XG4gICAgICBjb25zdCBub3cgID0gbmV3IERhdGUoKTtcbiAgICAgIGNvbnN0IHRvcCAgPSAobm93LmdldEhvdXJzKCkgKyBub3cuZ2V0TWludXRlcygpIC8gNjApICogSE9VUl9IRUlHSFQ7XG4gICAgICBjb25zdCBsaW5lID0gZXZlbnRDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW5vdy1saW5lXCIpO1xuICAgICAgbGluZS5zdHlsZS50b3AgPSBgJHt0b3B9cHhgO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgb3Blbk5ld0V2ZW50TW9kYWwoZGF0ZVN0cjogc3RyaW5nLCBhbGxEYXk6IGJvb2xlYW4sIGhvdXIgPSA5LCBtaW51dGUgPSAwKSB7XG4gICAgY29uc3QgdGltZVN0ciA9IGAke1N0cmluZyhob3VyKS5wYWRTdGFydCgyLFwiMFwiKX06JHtTdHJpbmcobWludXRlKS5wYWRTdGFydCgyLFwiMFwiKX1gO1xuICAgIGNvbnN0IGVuZFN0ciAgPSBgJHtTdHJpbmcoTWF0aC5taW4oaG91cisxLDIzKSkucGFkU3RhcnQoMixcIjBcIil9OiR7U3RyaW5nKG1pbnV0ZSkucGFkU3RhcnQoMixcIjBcIil9YDtcbiAgICBjb25zdCBwcmVmaWxsID0ge1xuICAgICAgaWQ6IFwiXCIsIHRpdGxlOiBcIlwiLCBhbGxEYXksXG4gICAgICBzdGFydERhdGU6IGRhdGVTdHIsIHN0YXJ0VGltZTogYWxsRGF5ID8gdW5kZWZpbmVkIDogdGltZVN0cixcbiAgICAgIGVuZERhdGU6ICAgZGF0ZVN0ciwgZW5kVGltZTogICBhbGxEYXkgPyB1bmRlZmluZWQgOiBlbmRTdHIsXG4gICAgICBhbGVydDogXCJub25lXCIsIGxpbmtlZFRhc2tJZHM6IFtdLCBjb21wbGV0ZWRJbnN0YW5jZXM6IFtdLCBjcmVhdGVkQXQ6IFwiXCJcbiAgICB9IGFzIENocm9uaWNsZUV2ZW50O1xuXG4gICAgbmV3IEV2ZW50TW9kYWwoXG4gICAgICB0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzLnRhc2tNYW5hZ2VyLFxuICAgICAgcHJlZmlsbCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGUpID0+IHRoaXMub3BlbkV2ZW50RnVsbFBhZ2UoZSA/PyBwcmVmaWxsKVxuICAgICkub3BlbigpO1xuICB9XG5cbnByaXZhdGUgc2hvd0V2ZW50Q29udGV4dE1lbnUoeDogbnVtYmVyLCB5OiBudW1iZXIsIGV2ZW50OiBDaHJvbmljbGVFdmVudCkge1xuICAgIGNvbnN0IG1lbnUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG1lbnUuY2xhc3NOYW1lICA9IFwiY2hyb25pY2xlLWNvbnRleHQtbWVudVwiO1xuICAgIG1lbnUuc3R5bGUubGVmdCA9IGAke3h9cHhgO1xuICAgIG1lbnUuc3R5bGUudG9wICA9IGAke3l9cHhgO1xuXG4gICAgY29uc3QgZWRpdEl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW1cIik7XG4gICAgZWRpdEl0ZW0uc2V0VGV4dChcIkVkaXQgZXZlbnRcIik7XG4gICAgZWRpdEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIG1lbnUucmVtb3ZlKCk7XG4gICAgICBuZXcgRXZlbnRNb2RhbCh0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzLnRhc2tNYW5hZ2VyLCBldmVudCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGUpID0+IHRoaXMub3BlbkV2ZW50RnVsbFBhZ2UoZSkpLm9wZW4oKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGRlbGV0ZUl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW0gY2hyb25pY2xlLWNvbnRleHQtZGVsZXRlXCIpO1xuICAgIGRlbGV0ZUl0ZW0uc2V0VGV4dChcIkRlbGV0ZSBldmVudFwiKTtcbiAgICBkZWxldGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICBtZW51LnJlbW92ZSgpO1xuICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuZGVsZXRlKGV2ZW50LmlkKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1lbnUpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IG1lbnUucmVtb3ZlKCksIHsgb25jZTogdHJ1ZSB9KSwgMCk7XG4gIH1cblxuICBwcml2YXRlIHNob3dDYWxDb250ZXh0TWVudSh4OiBudW1iZXIsIHk6IG51bWJlciwgZGF0ZVN0cjogc3RyaW5nLCBhbGxEYXk6IGJvb2xlYW4sIGhvdXIgPSA5LCBtaW51dGUgPSAwKSB7XG4gICAgY29uc3QgbWVudSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbWVudS5jbGFzc05hbWUgICAgPSBcImNocm9uaWNsZS1jb250ZXh0LW1lbnVcIjtcbiAgICBtZW51LnN0eWxlLmxlZnQgICA9IGAke3h9cHhgO1xuICAgIG1lbnUuc3R5bGUudG9wICAgID0gYCR7eX1weGA7XG5cbiAgICBjb25zdCBhZGRJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtXCIpO1xuICAgIGFkZEl0ZW0uc2V0VGV4dChcIk5ldyBldmVudCBoZXJlXCIpO1xuICAgIGFkZEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgbWVudS5yZW1vdmUoKTsgdGhpcy5vcGVuTmV3RXZlbnRNb2RhbChkYXRlU3RyLCBhbGxEYXksIGhvdXIsIG1pbnV0ZSk7IH0pO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtZW51KTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBtZW51LnJlbW92ZSgpLCB7IG9uY2U6IHRydWUgfSksIDApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJFdmVudFBpbGxUaW1lZChjb250YWluZXI6IEhUTUxFbGVtZW50LCBldmVudDogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBjb25zdCBbc2gsIHNtXSA9IChldmVudC5zdGFydFRpbWUgPz8gXCIwOTowMFwiKS5zcGxpdChcIjpcIikubWFwKE51bWJlcik7XG4gICAgY29uc3QgW2VoLCBlbV0gPSAoZXZlbnQuZW5kVGltZSAgID8/IFwiMTA6MDBcIikuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpO1xuICAgIGNvbnN0IHRvcCAgICA9IChzaCArIHNtIC8gNjApICogSE9VUl9IRUlHSFQ7XG4gICAgY29uc3QgaGVpZ2h0ID0gTWF0aC5tYXgoKGVoIC0gc2ggKyAoZW0gLSBzbSkgLyA2MCkgKiBIT1VSX0hFSUdIVCwgMjIpO1xuICAgIGNvbnN0IGNhbCAgICA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoZXZlbnQuY2FsZW5kYXJJZCA/PyBcIlwiKTtcbiAgICBjb25zdCBjb2xvciAgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCIjMzc4QUREXCI7XG5cbiAgICBjb25zdCBwaWxsID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1ldmVudC1waWxsXCIpO1xuICAgIHBpbGwuc3R5bGUudG9wICAgICAgICAgICAgID0gYCR7dG9wfXB4YDtcbiAgICBwaWxsLnN0eWxlLmhlaWdodCAgICAgICAgICA9IGAke2hlaWdodH1weGA7XG4gICAgcGlsbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvciArIFwiMzNcIjtcbiAgICBwaWxsLnN0eWxlLmJvcmRlckxlZnQgICAgICA9IGAzcHggc29saWQgJHtjb2xvcn1gO1xuICAgIHBpbGwuc3R5bGUuY29sb3IgICAgICAgICAgID0gY29sb3I7XG4gICAgcGlsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZXZlbnQtcGlsbC10aXRsZVwiKS5zZXRUZXh0KGV2ZW50LnRpdGxlKTtcbiAgICBpZiAoaGVpZ2h0ID4gMzYgJiYgZXZlbnQuc3RhcnRUaW1lKVxuICAgICAgcGlsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZXZlbnQtcGlsbC10aW1lXCIpLnNldFRleHQodGhpcy5mb3JtYXRUaW1lKGV2ZW50LnN0YXJ0VGltZSkpO1xuXG4gICAgcGlsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBuZXcgRXZlbnREZXRhaWxQb3B1cCh0aGlzLmFwcCwgZXZlbnQsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzLnRhc2tNYW5hZ2VyLCB0aGlzLnBsdWdpbi5zZXR0aW5ncy50aW1lRm9ybWF0LCAoKSA9PiBuZXcgRXZlbnRNb2RhbCh0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzLnRhc2tNYW5hZ2VyLCBldmVudCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGV2KSA9PiB0aGlzLm9wZW5FdmVudEZ1bGxQYWdlKGV2KSkub3BlbigpKS5vcGVuKCk7XG4gICAgfSk7XG5cbiAgICBwaWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHRoaXMuc2hvd0V2ZW50Q29udGV4dE1lbnUoZS5jbGllbnRYLCBlLmNsaWVudFksIGV2ZW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyRXZlbnRQaWxsQWxsRGF5KGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGV2ZW50OiBDaHJvbmljbGVFdmVudCkge1xuICAgIGNvbnN0IGNhbCAgID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChldmVudC5jYWxlbmRhcklkID8/IFwiXCIpO1xuICAgIGNvbnN0IGNvbG9yID0gY2FsID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSA6IFwiIzM3OEFERFwiO1xuICAgIGNvbnN0IHBpbGwgID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1ldmVudC1waWxsLWFsbGRheVwiKTtcbiAgICBwaWxsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yICsgXCIzM1wiO1xuICAgIHBpbGwuc3R5bGUuYm9yZGVyTGVmdCAgICAgID0gYDNweCBzb2xpZCAke2NvbG9yfWA7XG4gICAgcGlsbC5zdHlsZS5jb2xvciAgICAgICAgICAgPSBjb2xvcjtcbiAgICBwaWxsLnNldFRleHQoZXZlbnQudGl0bGUpO1xuICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+XG4gICAgICBuZXcgRXZlbnREZXRhaWxQb3B1cCh0aGlzLmFwcCwgZXZlbnQsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzLnRhc2tNYW5hZ2VyLCB0aGlzLnBsdWdpbi5zZXR0aW5ncy50aW1lRm9ybWF0LCAoKSA9PiBuZXcgRXZlbnRNb2RhbCh0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzLnRhc2tNYW5hZ2VyLCBldmVudCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGV2KSA9PiB0aGlzLm9wZW5FdmVudEZ1bGxQYWdlKGV2KSkub3BlbigpKS5vcGVuKClcbiAgICApO1xuXG4gICAgcGlsbC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB0aGlzLnNob3dFdmVudENvbnRleHRNZW51KGUuY2xpZW50WCwgZS5jbGllbnRZLCBldmVudCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGlzQ2FsZW5kYXJWaXNpYmxlKGNhbGVuZGFySWQ/OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoIWNhbGVuZGFySWQpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGNhbGVuZGFySWQpPy5pc1Zpc2libGUgPz8gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgZm9ybWF0SG91cihoOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGlmIChoID09PSAwKSAgcmV0dXJuIFwiMTIgQU1cIjtcbiAgICBpZiAoaCA8IDEyKSAgIHJldHVybiBgJHtofSBBTWA7XG4gICAgaWYgKGggPT09IDEyKSByZXR1cm4gXCIxMiBQTVwiO1xuICAgIHJldHVybiBgJHtoIC0gMTJ9IFBNYDtcbiAgfVxuXG4gIHByaXZhdGUgZm9ybWF0VGltZSh0aW1lU3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IFtoLCBtXSA9IHRpbWVTdHIuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpO1xuICAgIHJldHVybiBgJHtoICUgMTIgfHwgMTJ9OiR7U3RyaW5nKG0pLnBhZFN0YXJ0KDIsXCIwXCIpfSAke2ggPj0gMTIgPyBcIlBNXCIgOiBcIkFNXCJ9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIE1vZGFsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBFdmVudE1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9FdmVudE1hbmFnZXJcIjtcbmltcG9ydCB7IENhbGVuZGFyTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0NhbGVuZGFyTWFuYWdlclwiO1xuaW1wb3J0IHsgVGFza01hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9UYXNrTWFuYWdlclwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlRXZlbnQsIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIGV2ZW50TWFuYWdlcjogRXZlbnRNYW5hZ2VyO1xuICBwcml2YXRlIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICBwcml2YXRlIHRhc2tNYW5hZ2VyOiBUYXNrTWFuYWdlcjtcbiAgcHJpdmF0ZSBlZGl0aW5nRXZlbnQ6IENocm9uaWNsZUV2ZW50IHwgbnVsbDtcbiAgcHJpdmF0ZSBvblNhdmU/OiAoKSA9PiB2b2lkO1xuICBwcml2YXRlIG9uRXhwYW5kPzogKGV2ZW50PzogQ2hyb25pY2xlRXZlbnQpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXIsXG4gICAgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXIsXG4gICAgdGFza01hbmFnZXI6IFRhc2tNYW5hZ2VyLFxuICAgIGVkaXRpbmdFdmVudD86IENocm9uaWNsZUV2ZW50LFxuICAgIG9uU2F2ZT86ICgpID0+IHZvaWQsXG4gICAgb25FeHBhbmQ/OiAoZXZlbnQ/OiBDaHJvbmljbGVFdmVudCkgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuZXZlbnRNYW5hZ2VyICAgID0gZXZlbnRNYW5hZ2VyO1xuICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyID0gY2FsZW5kYXJNYW5hZ2VyO1xuICAgIHRoaXMudGFza01hbmFnZXIgICAgID0gdGFza01hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nRXZlbnQgICAgPSBlZGl0aW5nRXZlbnQgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSAgICAgICAgICA9IG9uU2F2ZTtcbiAgICB0aGlzLm9uRXhwYW5kICAgICAgICA9IG9uRXhwYW5kO1xuICB9XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImNocm9uaWNsZS1ldmVudC1tb2RhbFwiKTtcblxuICAgIGNvbnN0IGUgICAgICAgICA9IHRoaXMuZWRpdGluZ0V2ZW50O1xuICAgIGNvbnN0IGNhbGVuZGFycyA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgLy8gRmV0Y2ggYWxsIHRhc2tzIHVwZnJvbnQgZm9yIGxpbmtlZC10YXNrcyBVSVxuICAgIGNvbnN0IGFsbFRhc2tzID0gYXdhaXQgdGhpcy50YXNrTWFuYWdlci5nZXRBbGwoKTtcbiAgICBsZXQgbGlua2VkSWRzOiBzdHJpbmdbXSA9IFsuLi4oZT8ubGlua2VkVGFza0lkcyA/PyBbXSldO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEhlYWRlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBoZWFkZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWhlYWRlclwiKTtcbiAgICBoZWFkZXIuY3JlYXRlRGl2KFwiY2VtLXRpdGxlXCIpLnNldFRleHQoZSAmJiBlLmlkID8gXCJFZGl0IGV2ZW50XCIgOiBcIk5ldyBldmVudFwiKTtcblxuICAgIGNvbnN0IGV4cGFuZEJ0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tZ2hvc3QgY2VtLWV4cGFuZC1idG5cIiB9KTtcbiAgICBleHBhbmRCdG4udGl0bGUgPSBcIk9wZW4gYXMgZnVsbCBwYWdlXCI7XG4gICAgZXhwYW5kQnRuLmlubmVySFRNTCA9IGA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIj48cG9seWxpbmUgcG9pbnRzPVwiMTUgMyAyMSAzIDIxIDlcIi8+PHBvbHlsaW5lIHBvaW50cz1cIjkgMjEgMyAyMSAzIDE1XCIvPjxsaW5lIHgxPVwiMjFcIiB5MT1cIjNcIiB4Mj1cIjE0XCIgeTI9XCIxMFwiLz48bGluZSB4MT1cIjNcIiB5MT1cIjIxXCIgeDI9XCIxMFwiIHkyPVwiMTRcIi8+PC9zdmc+YDtcbiAgICBleHBhbmRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIHRoaXMub25FeHBhbmQ/LihlID8/IHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgU2Nyb2xsYWJsZSBmb3JtIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGZvcm0gPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWZvcm1cIik7XG5cbiAgICAvLyBUaXRsZVxuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGl0bGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLXRpdGxlLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIkV2ZW50IG5hbWVcIlxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSBlPy50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIExvY2F0aW9uXG4gICAgY29uc3QgbG9jYXRpb25JbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJMb2NhdGlvblwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIGxvY2F0aW9uXCJcbiAgICB9KTtcbiAgICBsb2NhdGlvbklucHV0LnZhbHVlID0gZT8ubG9jYXRpb24gPz8gXCJcIjtcblxuICAgIC8vIEFsbCBkYXkgdG9nZ2xlXG4gICAgY29uc3QgYWxsRGF5RmllbGQgID0gdGhpcy5maWVsZChmb3JtLCBcIkFsbCBkYXlcIik7XG4gICAgY29uc3QgYWxsRGF5V3JhcCAgID0gYWxsRGF5RmllbGQuY3JlYXRlRGl2KFwiY2VtLXRvZ2dsZS13cmFwXCIpO1xuICAgIGNvbnN0IGFsbERheVRvZ2dsZSA9IGFsbERheVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiwgY2xzOiBcImNlbS10b2dnbGVcIiB9KTtcbiAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA9IGU/LmFsbERheSA/PyBmYWxzZTtcbiAgICBjb25zdCBhbGxEYXlMYWJlbCAgPSBhbGxEYXlXcmFwLmNyZWF0ZVNwYW4oeyBjbHM6IFwiY2VtLXRvZ2dsZS1sYWJlbFwiIH0pO1xuICAgIGFsbERheUxhYmVsLnNldFRleHQoYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIlllc1wiIDogXCJOb1wiKTtcbiAgICBhbGxEYXlUb2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBhbGxEYXlMYWJlbC5zZXRUZXh0KGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJZZXNcIiA6IFwiTm9cIik7XG4gICAgICB0aW1lRmllbGRzLnN0eWxlLmRpc3BsYXkgPSBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwibm9uZVwiIDogXCJcIjtcbiAgICB9KTtcblxuICAgIC8vIFN0YXJ0ICsgRW5kIGRhdGVcbiAgICBjb25zdCBkYXRlUm93ICAgICAgICA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuICAgIGNvbnN0IHN0YXJ0RGF0ZUlucHV0ID0gdGhpcy5maWVsZChkYXRlUm93LCBcIlN0YXJ0IGRhdGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcImRhdGVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBzdGFydERhdGVJbnB1dC52YWx1ZSA9IGU/LnN0YXJ0RGF0ZSA/PyBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgY29uc3QgZW5kRGF0ZUlucHV0ID0gdGhpcy5maWVsZChkYXRlUm93LCBcIkVuZCBkYXRlXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJkYXRlXCIsIGNsczogXCJjZi1pbnB1dFwiXG4gICAgfSk7XG4gICAgZW5kRGF0ZUlucHV0LnZhbHVlID0gZT8uZW5kRGF0ZSA/PyBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgc3RhcnREYXRlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBpZiAoIWVuZERhdGVJbnB1dC52YWx1ZSB8fCBlbmREYXRlSW5wdXQudmFsdWUgPCBzdGFydERhdGVJbnB1dC52YWx1ZSkge1xuICAgICAgICBlbmREYXRlSW5wdXQudmFsdWUgPSBzdGFydERhdGVJbnB1dC52YWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFRpbWUgZmllbGRzXG4gICAgY29uc3QgdGltZUZpZWxkcyAgICAgPSBmb3JtLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcbiAgICB0aW1lRmllbGRzLnN0eWxlLmRpc3BsYXkgPSBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwibm9uZVwiIDogXCJcIjtcblxuICAgIGNvbnN0IHN0YXJ0VGltZUlucHV0ID0gdGhpcy5maWVsZCh0aW1lRmllbGRzLCBcIlN0YXJ0IHRpbWVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRpbWVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBzdGFydFRpbWVJbnB1dC52YWx1ZSA9IGU/LnN0YXJ0VGltZSA/PyBcIjA5OjAwXCI7XG5cbiAgICBjb25zdCBlbmRUaW1lSW5wdXQgPSB0aGlzLmZpZWxkKHRpbWVGaWVsZHMsIFwiRW5kIHRpbWVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRpbWVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBlbmRUaW1lSW5wdXQudmFsdWUgPSBlPy5lbmRUaW1lID8/IFwiMTA6MDBcIjtcblxuICAgIC8vIFJlcGVhdFxuICAgIGNvbnN0IHJlY1NlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJSZXBlYXRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgcmVjdXJyZW5jZXMgPSBbXG4gICAgICB7IHZhbHVlOiBcIlwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiTmV2ZXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPURBSUxZXCIsICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IGRheVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZXCIsICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgd2Vla1wiIH0sXG4gICAgICB7IHZhbHVlOiBcIkZSRVE9TU9OVEhMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgbW9udGhcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVlFQVJMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIkV2ZXJ5IHllYXJcIiB9LFxuICAgICAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWTtCWURBWT1NTyxUVSxXRSxUSCxGUlwiLCAgbGFiZWw6IFwiV2Vla2RheXNcIiB9LFxuICAgIF07XG4gICAgZm9yIChjb25zdCByIG9mIHJlY3VycmVuY2VzKSB7XG4gICAgICBjb25zdCBvcHQgPSByZWNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogci52YWx1ZSwgdGV4dDogci5sYWJlbCB9KTtcbiAgICAgIGlmIChlPy5yZWN1cnJlbmNlID09PSByLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIEFsZXJ0XG4gICAgY29uc3QgYWxlcnRTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQWxlcnRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgYWxlcnRzOiB7IHZhbHVlOiBBbGVydE9mZnNldDsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gICAgICB7IHZhbHVlOiBcIm5vbmVcIiwgICAgbGFiZWw6IFwiTm9uZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcImF0LXRpbWVcIiwgbGFiZWw6IFwiQXQgdGltZSBvZiBldmVudFwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjVtaW5cIiwgICAgbGFiZWw6IFwiNSBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjEwbWluXCIsICAgbGFiZWw6IFwiMTAgbWludXRlcyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxNW1pblwiLCAgIGxhYmVsOiBcIjE1IG1pbnV0ZXMgYmVmb3JlXCIgfSxcbiAgICAgIHsgdmFsdWU6IFwiMzBtaW5cIiwgICBsYWJlbDogXCIzMCBtaW51dGVzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjFob3VyXCIsICAgbGFiZWw6IFwiMSBob3VyIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJob3Vyc1wiLCAgbGFiZWw6IFwiMiBob3VycyBiZWZvcmVcIiB9LFxuICAgICAgeyB2YWx1ZTogXCIxZGF5XCIsICAgIGxhYmVsOiBcIjEgZGF5IGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjJkYXlzXCIsICAgbGFiZWw6IFwiMiBkYXlzIGJlZm9yZVwiIH0sXG4gICAgICB7IHZhbHVlOiBcIjF3ZWVrXCIsICAgbGFiZWw6IFwiMSB3ZWVrIGJlZm9yZVwiIH0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IGEgb2YgYWxlcnRzKSB7XG4gICAgICBjb25zdCBvcHQgPSBhbGVydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBhLnZhbHVlLCB0ZXh0OiBhLmxhYmVsIH0pO1xuICAgICAgaWYgKGU/LmFsZXJ0ID09PSBhLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIENhbGVuZGFyXG4gICAgY29uc3QgY2FsU2VsZWN0ID0gdGhpcy5maWVsZChmb3JtLCBcIkNhbGVuZGFyXCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBcIlwiLCB0ZXh0OiBcIk5vbmVcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGNhbCBvZiBjYWxlbmRhcnMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGNhbFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBjYWwuaWQsIHRleHQ6IGNhbC5uYW1lIH0pO1xuICAgICAgaWYgKGU/LmNhbGVuZGFySWQgPT09IGNhbC5pZCkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgdXBkYXRlQ2FsQ29sb3IgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGNhbFNlbGVjdC52YWx1ZSk7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdENvbG9yID0gY2FsID8gQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSA6IFwidHJhbnNwYXJlbnRcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0V2lkdGggPSBcIjRweFwiO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRTdHlsZSA9IFwic29saWRcIjtcbiAgICB9O1xuICAgIGNhbFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHVwZGF0ZUNhbENvbG9yKTtcbiAgICB1cGRhdGVDYWxDb2xvcigpO1xuXG4gICAgLy8gVGFnc1xuICAgIGNvbnN0IHRhZ3NJbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJUYWdzXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwid29yaywgcGVyc29uYWwgIChjb21tYSBzZXBhcmF0ZWQpXCJcbiAgICB9KTtcbiAgICB0YWdzSW5wdXQudmFsdWUgPSBlPy50YWdzPy5qb2luKFwiLCBcIikgPz8gXCJcIjtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBMaW5rZWQgdGFza3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgbGlua2VkRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTGlua2VkIHRhc2tzXCIpO1xuICAgIGNvbnN0IGxpbmtlZExpc3QgID0gbGlua2VkRmllbGQuY3JlYXRlRGl2KFwiY3RsLWxpc3RcIik7XG5cbiAgICBjb25zdCByZW5kZXJMaW5rZWRMaXN0ID0gKCkgPT4ge1xuICAgICAgbGlua2VkTGlzdC5lbXB0eSgpO1xuICAgICAgY29uc3QgaXRlbXMgPSBhbGxUYXNrcy5maWx0ZXIodCA9PiBsaW5rZWRJZHMuaW5jbHVkZXModC5pZCkpO1xuICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBsaW5rZWRMaXN0LmNyZWF0ZURpdihcImN0bC1lbXB0eVwiKS5zZXRUZXh0KFwiTm8gbGlua2VkIHRhc2tzXCIpO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCB0YXNrIG9mIGl0ZW1zKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IGxpbmtlZExpc3QuY3JlYXRlRGl2KFwiY3RsLWl0ZW1cIik7XG4gICAgICAgIHJvdy5jcmVhdGVTcGFuKHsgY2xzOiBgY3RsLXN0YXR1cyBjdGwtc3RhdHVzLSR7dGFzay5zdGF0dXN9YCB9KTtcbiAgICAgICAgcm93LmNyZWF0ZVNwYW4oeyBjbHM6IFwiY3RsLXRpdGxlXCIgfSkuc2V0VGV4dCh0YXNrLnRpdGxlKTtcbiAgICAgICAgY29uc3QgdW5saW5rQnRuID0gcm93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImN0bC11bmxpbmtcIiwgdGV4dDogXCJcdTAwRDdcIiB9KTtcbiAgICAgICAgdW5saW5rQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgbGlua2VkSWRzID0gbGlua2VkSWRzLmZpbHRlcihpZCA9PiBpZCAhPT0gdGFzay5pZCk7XG4gICAgICAgICAgcmVuZGVyTGlua2VkTGlzdCgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHJlbmRlckxpbmtlZExpc3QoKTtcblxuICAgIC8vIFNlYXJjaCB0byBsaW5rIGV4aXN0aW5nIHRhc2tzXG4gICAgY29uc3Qgc2VhcmNoV3JhcCAgICA9IGxpbmtlZEZpZWxkLmNyZWF0ZURpdihcImN0bC1zZWFyY2gtd3JhcFwiKTtcbiAgICBjb25zdCBzZWFyY2hJbnB1dCAgID0gc2VhcmNoV3JhcC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXQgY3RsLXNlYXJjaFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiU2VhcmNoIHRhc2tzIHRvIGxpbmtcdTIwMjZcIlxuICAgIH0pO1xuICAgIGNvbnN0IHNlYXJjaFJlc3VsdHMgPSBzZWFyY2hXcmFwLmNyZWF0ZURpdihcImN0bC1yZXN1bHRzXCIpO1xuICAgIHNlYXJjaFJlc3VsdHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuXG4gICAgY29uc3QgY2xvc2VTZWFyY2ggPSAoKSA9PiB7XG4gICAgICBzZWFyY2hSZXN1bHRzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgIHNlYXJjaFJlc3VsdHMuZW1wdHkoKTtcbiAgICB9O1xuXG4gICAgc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHEgPSBzZWFyY2hJbnB1dC52YWx1ZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICAgIHNlYXJjaFJlc3VsdHMuZW1wdHkoKTtcbiAgICAgIGlmICghcSkgeyBjbG9zZVNlYXJjaCgpOyByZXR1cm47IH1cblxuICAgICAgY29uc3QgbWF0Y2hlcyA9IGFsbFRhc2tzXG4gICAgICAgIC5maWx0ZXIodCA9PiAhbGlua2VkSWRzLmluY2x1ZGVzKHQuaWQpICYmIHQudGl0bGUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxKSlcbiAgICAgICAgLnNsaWNlKDAsIDYpO1xuXG4gICAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDApIHsgY2xvc2VTZWFyY2goKTsgcmV0dXJuOyB9XG4gICAgICBzZWFyY2hSZXN1bHRzLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgZm9yIChjb25zdCB0YXNrIG9mIG1hdGNoZXMpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHNlYXJjaFJlc3VsdHMuY3JlYXRlRGl2KFwiY3RsLXJlc3VsdC1pdGVtXCIpO1xuICAgICAgICBpdGVtLmNyZWF0ZVNwYW4oeyBjbHM6IGBjdGwtc3RhdHVzIGN0bC1zdGF0dXMtJHt0YXNrLnN0YXR1c31gIH0pO1xuICAgICAgICBpdGVtLmNyZWF0ZVNwYW4oeyBjbHM6IFwiY3RsLXJlc3VsdC10aXRsZVwiIH0pLnNldFRleHQodGFzay50aXRsZSk7XG4gICAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZXYpID0+IHtcbiAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpOyAvLyBrZWVwIGZvY3VzIG9uIGlucHV0IHNvIGJsdXIgZG9lc24ndCBmaXJlIGZpcnN0XG4gICAgICAgICAgbGlua2VkSWRzLnB1c2godGFzay5pZCk7XG4gICAgICAgICAgc2VhcmNoSW5wdXQudmFsdWUgPSBcIlwiO1xuICAgICAgICAgIGNsb3NlU2VhcmNoKCk7XG4gICAgICAgICAgcmVuZGVyTGlua2VkTGlzdCgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgIC8vIFNtYWxsIGRlbGF5IHNvIG1vdXNlZG93biBjYW4gZmlyZSBmaXJzdFxuICAgICAgc2V0VGltZW91dChjbG9zZVNlYXJjaCwgMTUwKTtcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBGb290ZXIgKGFsd2F5cyB2aXNpYmxlLCBvdXRzaWRlIHNjcm9sbCBhcmVhKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb290ZXIgICAgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWZvb3RlclwiKTtcbiAgICBjb25zdCBjYW5jZWxCdG4gPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWdob3N0XCIsIHRleHQ6IFwiQ2FuY2VsXCIgfSk7XG5cbiAgICBpZiAoZSAmJiBlLmlkKSB7XG4gICAgICBjb25zdCBkZWxldGVCdG4gPSBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWRlbGV0ZVwiLCB0ZXh0OiBcIkRlbGV0ZSBldmVudFwiIH0pO1xuICAgICAgZGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXZlbnRNYW5hZ2VyLmRlbGV0ZShlLmlkKTtcbiAgICAgICAgdGhpcy5vblNhdmU/LigpO1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBzYXZlQnRuID0gZm9vdGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJjZi1idG4tcHJpbWFyeVwiLCB0ZXh0OiBlICYmIGUuaWQgPyBcIlNhdmVcIiA6IFwiQWRkIGV2ZW50XCJcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIYW5kbGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuY2xvc2UoKSk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSB0aXRsZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHtcbiAgICAgICAgdGl0bGVJbnB1dC5mb2N1cygpO1xuICAgICAgICB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBldmVudERhdGEgPSB7XG4gICAgICAgIHRpdGxlLFxuICAgICAgICBsb2NhdGlvbjogICAgbG9jYXRpb25JbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGFsbERheTogICAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCxcbiAgICAgICAgc3RhcnREYXRlOiAgIHN0YXJ0RGF0ZUlucHV0LnZhbHVlLFxuICAgICAgICBzdGFydFRpbWU6ICAgYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyB1bmRlZmluZWQgOiBzdGFydFRpbWVJbnB1dC52YWx1ZSxcbiAgICAgICAgZW5kRGF0ZTogICAgIGVuZERhdGVJbnB1dC52YWx1ZSB8fCBzdGFydERhdGVJbnB1dC52YWx1ZSxcbiAgICAgICAgZW5kVGltZTogICAgIGFsbERheVRvZ2dsZS5jaGVja2VkID8gdW5kZWZpbmVkIDogZW5kVGltZUlucHV0LnZhbHVlLFxuICAgICAgICByZWN1cnJlbmNlOiAgcmVjU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsZW5kYXJJZDogIGNhbFNlbGVjdC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGFsZXJ0OiAgICAgICBhbGVydFNlbGVjdC52YWx1ZSBhcyBBbGVydE9mZnNldCxcbiAgICAgICAgdGFnczogICAgICAgICAgICAgICB0YWdzSW5wdXQudmFsdWUgPyB0YWdzSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiAoZT8udGFncyA/PyBbXSksXG4gICAgICAgIG5vdGVzOiAgICAgICAgICAgICAgZT8ubm90ZXMsXG4gICAgICAgIGxpbmtlZE5vdGVzOiAgICAgICAgZT8ubGlua2VkTm90ZXMgPz8gW10sXG4gICAgICAgIGxpbmtlZFRhc2tJZHM6ICAgICAgbGlua2VkSWRzLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6IGU/LmNvbXBsZXRlZEluc3RhbmNlcyA/PyBbXSxcbiAgICAgIH07XG5cbiAgICAgIGlmIChlICYmIGUuaWQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIudXBkYXRlKHsgLi4uZSwgLi4uZXZlbnREYXRhIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuY3JlYXRlKGV2ZW50RGF0YSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9O1xuXG4gICAgc2F2ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGFuZGxlU2F2ZSk7XG4gICAgdGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXYpID0+IHtcbiAgICAgIGlmIChldi5rZXkgPT09IFwiRW50ZXJcIikgaGFuZGxlU2F2ZSgpO1xuICAgICAgaWYgKGV2LmtleSA9PT0gXCJFc2NhcGVcIikgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBmaWVsZChwYXJlbnQ6IEhUTUxFbGVtZW50LCBsYWJlbDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHdyYXAgPSBwYXJlbnQuY3JlYXRlRGl2KFwiY2YtZmllbGRcIik7XG4gICAgd3JhcC5jcmVhdGVEaXYoXCJjZi1sYWJlbFwiKS5zZXRUZXh0KGxhYmVsKTtcbiAgICByZXR1cm4gd3JhcDtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENocm9uaWNsZUV2ZW50LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL1Rhc2tNYW5hZ2VyXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudERldGFpbFBvcHVwIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIGV2ZW50OiBDaHJvbmljbGVFdmVudDtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSB0YXNrTWFuYWdlcjogVGFza01hbmFnZXI7XG4gIHByaXZhdGUgdGltZUZvcm1hdDogXCIxMmhcIiB8IFwiMjRoXCI7XG4gIHByaXZhdGUgb25FZGl0OiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIGV2ZW50OiBDaHJvbmljbGVFdmVudCxcbiAgICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcixcbiAgICB0YXNrTWFuYWdlcjogVGFza01hbmFnZXIsXG4gICAgdGltZUZvcm1hdDogXCIxMmhcIiB8IFwiMjRoXCIsXG4gICAgb25FZGl0OiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5ldmVudCAgICAgICAgICAgPSBldmVudDtcbiAgICB0aGlzLmNhbGVuZGFyTWFuYWdlciA9IGNhbGVuZGFyTWFuYWdlcjtcbiAgICB0aGlzLnRhc2tNYW5hZ2VyICAgICA9IHRhc2tNYW5hZ2VyO1xuICAgIHRoaXMudGltZUZvcm1hdCAgICAgID0gdGltZUZvcm1hdDtcbiAgICB0aGlzLm9uRWRpdCAgICAgICAgICA9IG9uRWRpdDtcbiAgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJjZHAtbW9kYWxcIik7XG5cbiAgICBjb25zdCBldiA9IHRoaXMuZXZlbnQ7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZHAtaGVhZGVyXCIpO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZHAtdGl0bGVcIikuc2V0VGV4dChldi50aXRsZSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRGV0YWlsIHJvd3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgYm9keSA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZHAtYm9keVwiKTtcblxuICAgIC8vIERhdGUgKyB0aW1lIChhbHdheXMgc2hvd24pXG4gICAgY29uc3QgZGF0ZVRpbWVTdHIgPSB0aGlzLmZvcm1hdERhdGVUaW1lKGV2KTtcbiAgICB0aGlzLnJvdyhib2R5LCBldi5hbGxEYXkgPyBcIkRhdGVcIiA6IFwiV2hlblwiLCBkYXRlVGltZVN0cik7XG5cbiAgICBpZiAoZXYubG9jYXRpb24pIHRoaXMucm93KGJvZHksIFwiTG9jYXRpb25cIiwgZXYubG9jYXRpb24pO1xuXG4gICAgaWYgKGV2LmNhbGVuZGFySWQpIHtcbiAgICAgIGNvbnN0IGNhbCA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoZXYuY2FsZW5kYXJJZCk7XG4gICAgICBpZiAoY2FsKSB0aGlzLmNhbFJvdyhib2R5LCBjYWwubmFtZSwgQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSk7XG4gICAgfVxuXG4gICAgaWYgKGV2LnJlY3VycmVuY2UpIHRoaXMucm93KGJvZHksIFwiUmVwZWF0XCIsIGZvcm1hdFJlY3VycmVuY2UoZXYucmVjdXJyZW5jZSkpO1xuXG4gICAgaWYgKGV2LmFsZXJ0ICYmIGV2LmFsZXJ0ICE9PSBcIm5vbmVcIikgdGhpcy5yb3coYm9keSwgXCJBbGVydFwiLCBmb3JtYXRBbGVydChldi5hbGVydCkpO1xuXG4gICAgaWYgKGV2LnRhZ3MgJiYgZXYudGFncy5sZW5ndGggPiAwKSB0aGlzLnJvdyhib2R5LCBcIlRhZ3NcIiwgZXYudGFncy5qb2luKFwiLCBcIikpO1xuXG4gICAgaWYgKGV2LmxpbmtlZE5vdGVzICYmIGV2LmxpbmtlZE5vdGVzLmxlbmd0aCA+IDApXG4gICAgICB0aGlzLnJvdyhib2R5LCBcIkxpbmtlZCBub3Rlc1wiLCBldi5saW5rZWROb3Rlcy5qb2luKFwiLCBcIikpO1xuXG4gICAgLy8gTGlua2VkIHRhc2tzIFx1MjAxNCBmZXRjaCBuYW1lcyBhc3luY1xuICAgIGlmIChldi5saW5rZWRUYXNrSWRzICYmIGV2LmxpbmtlZFRhc2tJZHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgYWxsVGFza3MgPSBhd2FpdCB0aGlzLnRhc2tNYW5hZ2VyLmdldEFsbCgpO1xuICAgICAgY29uc3QgbGlua2VkICAgPSBhbGxUYXNrcy5maWx0ZXIodCA9PiBldi5saW5rZWRUYXNrSWRzLmluY2x1ZGVzKHQuaWQpKTtcbiAgICAgIGlmIChsaW5rZWQubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCB0YXNrc1JvdyA9IGJvZHkuY3JlYXRlRGl2KFwiY2RwLXJvdyBjZHAtbGlua2VkLXRhc2tzLXJvd1wiKTtcbiAgICAgICAgdGFza3NSb3cuY3JlYXRlRGl2KFwiY2RwLXJvdy1sYWJlbFwiKS5zZXRUZXh0KFwiVGFza3NcIik7XG4gICAgICAgIGNvbnN0IGxpc3QgPSB0YXNrc1Jvdy5jcmVhdGVEaXYoXCJjZHAtcm93LXZhbHVlIGNkcC10YXNrLWxpc3RcIik7XG4gICAgICAgIGZvciAoY29uc3QgdGFzayBvZiBsaW5rZWQpIHtcbiAgICAgICAgICBjb25zdCBpdGVtID0gbGlzdC5jcmVhdGVEaXYoXCJjZHAtdGFzay1pdGVtXCIpO1xuICAgICAgICAgIGl0ZW0uY3JlYXRlU3Bhbih7IGNsczogYGN0bC1zdGF0dXMgY3RsLXN0YXR1cy0ke3Rhc2suc3RhdHVzfWAgfSk7XG4gICAgICAgICAgaXRlbS5jcmVhdGVTcGFuKHsgY2xzOiBcImNkcC10YXNrLXRpdGxlXCIgfSkuc2V0VGV4dCh0YXNrLnRpdGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChldi5ub3Rlcykge1xuICAgICAgY29uc3Qgbm90ZXNSb3cgPSBib2R5LmNyZWF0ZURpdihcImNkcC1yb3cgY2RwLW5vdGVzLXJvd1wiKTtcbiAgICAgIG5vdGVzUm93LmNyZWF0ZURpdihcImNkcC1yb3ctbGFiZWxcIikuc2V0VGV4dChcIk5vdGVzXCIpO1xuICAgICAgbm90ZXNSb3cuY3JlYXRlRGl2KFwiY2RwLXJvdy12YWx1ZSBjZHAtbm90ZXMtdGV4dFwiKS5zZXRUZXh0KFxuICAgICAgICBldi5ub3Rlcy5sZW5ndGggPiA0MDAgPyBldi5ub3Rlcy5zbGljZSgwLCA0MDApICsgXCJcdTIwMjZcIiA6IGV2Lm5vdGVzXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBGb290ZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgZm9vdGVyID0gY29udGVudEVsLmNyZWF0ZURpdihcImNkcC1mb290ZXJcIik7XG4gICAgY29uc3QgZWRpdEJ0biA9IGZvb3Rlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tcHJpbWFyeVwiLCB0ZXh0OiBcIkVkaXQgZXZlbnRcIiB9KTtcbiAgICBlZGl0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY2xvc2UoKTsgdGhpcy5vbkVkaXQoKTsgfSk7XG4gIH1cblxuICBwcml2YXRlIGZvcm1hdERhdGVUaW1lKGV2OiBDaHJvbmljbGVFdmVudCk6IHN0cmluZyB7XG4gICAgY29uc3Qgc3RhcnREYXRlID0gZm9ybWF0RGF0ZShldi5zdGFydERhdGUpO1xuICAgIGNvbnN0IGVuZERhdGUgICA9IGZvcm1hdERhdGUoZXYuZW5kRGF0ZSk7XG4gICAgY29uc3Qgc2FtZURheSAgID0gZXYuc3RhcnREYXRlID09PSBldi5lbmREYXRlO1xuXG4gICAgaWYgKGV2LmFsbERheSkge1xuICAgICAgcmV0dXJuIHNhbWVEYXkgPyBzdGFydERhdGUgOiBgJHtzdGFydERhdGV9IFx1MjAxMyAke2VuZERhdGV9YDtcbiAgICB9XG5cbiAgICBjb25zdCBzdGFydFRpbWUgPSBldi5zdGFydFRpbWUgPyB0aGlzLmZtdFRpbWUoZXYuc3RhcnRUaW1lKSA6IFwiXCI7XG4gICAgY29uc3QgZW5kVGltZSAgID0gZXYuZW5kVGltZSAgID8gdGhpcy5mbXRUaW1lKGV2LmVuZFRpbWUpICAgOiBcIlwiO1xuXG4gICAgaWYgKHNhbWVEYXkpIHtcbiAgICAgIHJldHVybiBzdGFydFRpbWUgJiYgZW5kVGltZVxuICAgICAgICA/IGAke3N0YXJ0RGF0ZX0gIFx1MDBCNyAgJHtzdGFydFRpbWV9IFx1MjAxMyAke2VuZFRpbWV9YFxuICAgICAgICA6IHN0YXJ0RGF0ZTtcbiAgICB9XG4gICAgcmV0dXJuIGAke3N0YXJ0RGF0ZX0gJHtzdGFydFRpbWV9IFx1MjAxMyAke2VuZERhdGV9ICR7ZW5kVGltZX1gLnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgcm93KHBhcmVudDogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICBjb25zdCByb3cgPSBwYXJlbnQuY3JlYXRlRGl2KFwiY2RwLXJvd1wiKTtcbiAgICByb3cuY3JlYXRlRGl2KFwiY2RwLXJvdy1sYWJlbFwiKS5zZXRUZXh0KGxhYmVsKTtcbiAgICByb3cuY3JlYXRlRGl2KFwiY2RwLXJvdy12YWx1ZVwiKS5zZXRUZXh0KHZhbHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgY2FsUm93KHBhcmVudDogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZywgY29sb3I6IHN0cmluZykge1xuICAgIGNvbnN0IHJvdyA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZHAtcm93XCIpO1xuICAgIHJvdy5jcmVhdGVEaXYoXCJjZHAtcm93LWxhYmVsXCIpLnNldFRleHQoXCJDYWxlbmRhclwiKTtcbiAgICBjb25zdCB2YWwgPSByb3cuY3JlYXRlRGl2KFwiY2RwLXJvdy12YWx1ZSBjZHAtY2FsLXZhbHVlXCIpO1xuICAgIGNvbnN0IGRvdCA9IHZhbC5jcmVhdGVTcGFuKFwiY2RwLWNhbC1kb3RcIik7XG4gICAgZG90LnN0eWxlLmJhY2tncm91bmQgPSBjb2xvcjtcbiAgICB2YWwuY3JlYXRlU3BhbigpLnNldFRleHQobmFtZSk7XG4gIH1cblxuICBwcml2YXRlIGZtdFRpbWUodGltZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy50aW1lRm9ybWF0ID09PSBcIjI0aFwiKSByZXR1cm4gdGltZTtcbiAgICBjb25zdCBbaCwgbV0gPSB0aW1lLnNwbGl0KFwiOlwiKS5tYXAoTnVtYmVyKTtcbiAgICBjb25zdCBzdWZmaXggPSBoID49IDEyID8gXCJQTVwiIDogXCJBTVwiO1xuICAgIGNvbnN0IGhvdXIgICA9ICgoaCAlIDEyKSB8fCAxMik7XG4gICAgcmV0dXJuIGAke2hvdXJ9OiR7U3RyaW5nKG0pLnBhZFN0YXJ0KDIsIFwiMFwiKX0gJHtzdWZmaXh9YDtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7IHRoaXMuY29udGVudEVsLmVtcHR5KCk7IH1cbn1cblxuLy8gXHUyNTAwXHUyNTAwIEZvcm1hdHRlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGZvcm1hdERhdGUoZGF0ZVN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgW3ksIG0sIGRdID0gZGF0ZVN0ci5zcGxpdChcIi1cIikubWFwKE51bWJlcik7XG4gIHJldHVybiBuZXcgRGF0ZSh5LCBtIC0gMSwgZCkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwge1xuICAgIHdlZWtkYXk6IFwic2hvcnRcIiwgbW9udGg6IFwic2hvcnRcIiwgZGF5OiBcIm51bWVyaWNcIiwgeWVhcjogXCJudW1lcmljXCJcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFJlY3VycmVuY2UocnJ1bGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICBcIkZSRVE9REFJTFlcIjogICAgICAgICAgICAgICAgICAgICAgICAgXCJFdmVyeSBkYXlcIixcbiAgICBcIkZSRVE9V0VFS0xZXCI6ICAgICAgICAgICAgICAgICAgICAgICAgXCJFdmVyeSB3ZWVrXCIsXG4gICAgXCJGUkVRPU1PTlRITFlcIjogICAgICAgICAgICAgICAgICAgICAgIFwiRXZlcnkgbW9udGhcIixcbiAgICBcIkZSRVE9WUVBUkxZXCI6ICAgICAgICAgICAgICAgICAgICAgICAgXCJFdmVyeSB5ZWFyXCIsXG4gICAgXCJGUkVRPVdFRUtMWTtCWURBWT1NTyxUVSxXRSxUSCxGUlwiOiAgXCJXZWVrZGF5c1wiLFxuICB9O1xuICByZXR1cm4gbWFwW3JydWxlXSA/PyBycnVsZTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0QWxlcnQoYWxlcnQ6IEFsZXJ0T2Zmc2V0KTogc3RyaW5nIHtcbiAgY29uc3QgbWFwOiBQYXJ0aWFsPFJlY29yZDxBbGVydE9mZnNldCwgc3RyaW5nPj4gPSB7XG4gICAgXCJhdC10aW1lXCI6IFwiQXQgdGltZSBvZiBldmVudFwiLFxuICAgIFwiNW1pblwiOiAgICBcIjUgbWludXRlcyBiZWZvcmVcIixcbiAgICBcIjEwbWluXCI6ICAgXCIxMCBtaW51dGVzIGJlZm9yZVwiLFxuICAgIFwiMTVtaW5cIjogICBcIjE1IG1pbnV0ZXMgYmVmb3JlXCIsXG4gICAgXCIzMG1pblwiOiAgIFwiMzAgbWludXRlcyBiZWZvcmVcIixcbiAgICBcIjFob3VyXCI6ICAgXCIxIGhvdXIgYmVmb3JlXCIsXG4gICAgXCIyaG91cnNcIjogIFwiMiBob3VycyBiZWZvcmVcIixcbiAgICBcIjFkYXlcIjogICAgXCIxIGRheSBiZWZvcmVcIixcbiAgICBcIjJkYXlzXCI6ICAgXCIyIGRheXMgYmVmb3JlXCIsXG4gICAgXCIxd2Vla1wiOiAgIFwiMSB3ZWVrIGJlZm9yZVwiLFxuICB9O1xuICByZXR1cm4gbWFwW2FsZXJ0XSA/PyBhbGVydDtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FDQUEsc0JBQXVEOzs7QUNFaEQsSUFBTSxrQkFBTixNQUFzQjtBQUFBLEVBSTNCLFlBQVksV0FBZ0MsVUFBc0I7QUFDaEUsU0FBSyxZQUFZO0FBQ2pCLFNBQUssV0FBVztBQUFBLEVBQ2xCO0FBQUEsRUFFQSxTQUE4QjtBQUM1QixXQUFPLENBQUMsR0FBRyxLQUFLLFNBQVM7QUFBQSxFQUMzQjtBQUFBLEVBRUEsUUFBUSxJQUEyQztBQUNqRCxXQUFPLEtBQUssVUFBVSxLQUFLLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRTtBQUFBLEVBQy9DO0FBQUEsRUFFQSxPQUFPLE1BQWMsT0FBeUM7QUFDNUQsVUFBTSxXQUE4QjtBQUFBLE1BQ2xDLElBQUksS0FBSyxXQUFXLElBQUk7QUFBQSxNQUN4QjtBQUFBLE1BQ0E7QUFBQSxNQUNBLFdBQVc7QUFBQSxNQUNYLFlBQVcsb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFBQSxJQUNwQztBQUNBLFNBQUssVUFBVSxLQUFLLFFBQVE7QUFDNUIsU0FBSyxTQUFTO0FBQ2QsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE9BQU8sSUFBWSxTQUEyQztBQUM1RCxVQUFNLE1BQU0sS0FBSyxVQUFVLFVBQVUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxF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QUFLO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBLENBQUMsTUFBTSxLQUFLLGtCQUFrQixDQUFDO0FBQUEsSUFDakMsRUFBRSxLQUFLO0FBQUEsRUFDVDtBQUFBLEVBRUEsV0FBVztBQUNULFNBQUssSUFBSSxVQUFVLG1CQUFtQixjQUFjO0FBQ3BELFNBQUssSUFBSSxVQUFVLG1CQUFtQixtQkFBbUI7QUFDekQsU0FBSyxJQUFJLFVBQVUsbUJBQW1CLGtCQUFrQjtBQUN4RCxTQUFLLElBQUksVUFBVSxtQkFBbUIsb0JBQW9CO0FBQUEsRUFDNUQ7QUFBQSxFQUVBLE1BQU0sZUFBZTtBQUNuQixTQUFLLFdBQVcsT0FBTyxPQUFPLENBQUMsR0FBRyxrQkFBa0IsTUFBTSxLQUFLLFNBQVMsQ0FBQztBQUFBLEVBQzNFO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDbkIsVUFBTSxLQUFLLFNBQVMsS0FBSyxRQUFRO0FBQ2pDLElBQUMsS0FBSyxJQUFJLFVBQWtCLFFBQVEsNEJBQTRCO0FBQUEsRUFDbEU7QUFBQSxFQUVBLE1BQU0sa0JBQWtCLE9BQXdCO0FBQzlDLFVBQU0sRUFBRSxVQUFVLElBQUksS0FBSztBQUMzQixVQUFNLFdBQVcsVUFBVSxnQkFBZ0Isb0JBQW9CLEVBQUUsQ0FBQztBQUNsRSxRQUFJLFNBQVUsVUFBUyxPQUFPO0FBQzlCLFVBQU0sT0FBTyxVQUFVLFFBQVEsS0FBSztBQUNwQyxVQUFNLEtBQUssYUFBYSxFQUFFLE1BQU0sc0JBQXNCLFFBQVEsS0FBSyxDQUFDO0FBQ3BFLGNBQVUsV0FBVyxJQUFJO0FBRXpCLFVBQU0sSUFBSSxRQUFRLGFBQVcsV0FBVyxTQUFTLEdBQUcsQ0FBQztBQUNyRCxVQUFNLFdBQVcsVUFBVSxnQkFBZ0Isb0JBQW9CLEVBQUUsQ0FBQztBQUNsRSxVQUFNLFdBQVcscUNBQVU7QUFDM0IsUUFBSSxZQUFZLE1BQU8sVUFBUyxVQUFVLEtBQUs7QUFBQSxFQUNqRDtBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgIl9iIiwgIl9jIiwgIl9kIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiX2IiLCAiX2MiLCAiX2QiLCAiX2UiLCAiX2YiLCAiX2ciLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJfYiIsICJfYyIsICJfZCIsICJfZSIsICJ0IiwgImdyb3VwcyIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgIl9iIiwgIl9jIiwgIl9kIiwgImltcG9ydF9vYnNpZGlhbiIsICJmb3JtYXRSZWN1cnJlbmNlIiwgImZvcm1hdEFsZXJ0IiwgImZvcm1hdERhdGUiXQp9Cg==
