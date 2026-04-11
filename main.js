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

// src/utils/constants.ts
var ALERT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "at-time", label: "At time" },
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
var RECURRENCE_OPTIONS = [
  { value: "", label: "Never" },
  { value: "FREQ=DAILY", label: "Every day" },
  { value: "FREQ=WEEKLY", label: "Every week" },
  { value: "FREQ=MONTHLY", label: "Every month" },
  { value: "FREQ=YEARLY", label: "Every year" },
  { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", label: "Weekdays" }
];
var STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" }
];
var PRIORITY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];
var SOUND_OPTIONS = [
  { value: "none", label: "None (silent)" },
  { value: "Glass", label: "Glass" },
  { value: "Ping", label: "Ping" },
  { value: "Tink", label: "Tink" },
  { value: "Basso", label: "Basso" },
  { value: "Funk", label: "Funk" },
  { value: "Hero", label: "Hero" },
  { value: "Sosumi", label: "Sosumi" },
  { value: "Submarine", label: "Submarine" },
  { value: "Blow", label: "Blow" },
  { value: "Bottle", label: "Bottle" },
  { value: "Frog", label: "Frog" },
  { value: "Morse", label: "Morse" },
  { value: "Pop", label: "Pop" },
  { value: "Purr", label: "Purr" }
];

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
    new import_obsidian.Setting(el).setName("Reminders folder").setDesc("Where reminder notes are stored in your vault.").addText(
      (text) => text.setPlaceholder("Chronicle/Reminders").setValue(this.plugin.settings.remindersFolder).onChange(async (value) => {
        this.plugin.settings.remindersFolder = value || "Chronicle/Reminders";
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
    new import_obsidian.Setting(el).setName("Show notifications").setDesc("Show a macOS notification banner (via Obsidian) when an alert fires.").addToggle(
      (t) => {
        var _a;
        return t.setValue((_a = this.plugin.settings.notifMacOS) != null ? _a : true).onChange(async (value) => {
          this.plugin.settings.notifMacOS = value;
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
    new import_obsidian.Setting(el).setName("Alert for reminders").setDesc("Enable alerts for reminders with a due time.").addToggle(
      (t) => {
        var _a;
        return t.setValue((_a = this.plugin.settings.notifReminders) != null ? _a : true).onChange(async (value) => {
          this.plugin.settings.notifReminders = value;
          await this.plugin.saveSettings();
        });
      }
    );
    new import_obsidian.Setting(el).setName("Test reminder notification").setDesc("Fires a test reminder alert using your current settings.").addButton(
      (btn) => btn.setButtonText("Test reminder").onClick(() => {
        this.plugin.alertManager.fire(
          "settings-test-reminder",
          "Chronicle test",
          "Your reminder notifications are working.",
          "reminder"
        );
        this.plugin.alertManager["firedAlerts"].delete("settings-test-reminder");
      })
    );
    new import_obsidian.Setting(el).setName("Test event notification").setDesc("Fires a test event alert using your current settings.").addButton(
      (btn) => btn.setButtonText("Test event").onClick(() => {
        this.plugin.alertManager.fire(
          "settings-test-event",
          "Chronicle test",
          "Your event notifications are working.",
          "event"
        );
        this.plugin.alertManager["firedAlerts"].delete("settings-test-event");
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
    new import_obsidian.Setting(el).setName("Event notification sound").setDesc("macOS system sound played when an event alert fires.").addDropdown(
      (drop) => {
        var _a;
        return this.addSoundOptions(drop).setValue((_a = this.plugin.settings.notifSoundEvent) != null ? _a : "Glass").onChange(async (value) => {
          this.plugin.settings.notifSoundEvent = value;
          await this.plugin.saveSettings();
        });
      }
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
    setting.nameEl.createSpan({ text: cal.name });
    setting.addColorPicker((picker) => {
      picker.setValue(CalendarManager.colorToHex(cal.color));
      picker.onChange(async (hex) => {
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
    setting.nameEl.createSpan({ text: list.name });
    setting.addColorPicker((picker) => {
      picker.setValue(list.color);
      picker.onChange(async (hex) => {
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
    var _a, _b;
    this.subHeader(el, "Reminder defaults");
    new import_obsidian.Setting(el).setName("Default status").addDropdown(
      (drop) => drop.addOption("todo", "To do").addOption("in-progress", "In progress").addOption("done", "Done").addOption("cancelled", "Cancelled").setValue(this.plugin.settings.defaultReminderStatus).onChange(async (value) => {
        this.plugin.settings.defaultReminderStatus = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(el).setName("Default priority").addDropdown(
      (drop) => drop.addOption("none", "None").addOption("low", "Low").addOption("medium", "Medium").addOption("high", "High").setValue(this.plugin.settings.defaultReminderPriority).onChange(async (value) => {
        this.plugin.settings.defaultReminderPriority = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(el).setName("Default alert").setDesc("Alert offset applied to new reminders by default.").addDropdown(
      (drop) => this.addAlertOptions(drop).setValue(this.plugin.settings.defaultAlert).onChange(async (value) => {
        this.plugin.settings.defaultAlert = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(el).setName("Default list").setDesc("List assigned to new reminders by default.").addDropdown((drop) => {
      var _a2;
      drop.addOption("", "None");
      for (const list of this.plugin.listManager.getAll()) {
        drop.addOption(list.id, list.name);
      }
      drop.setValue((_a2 = this.plugin.settings.defaultListId) != null ? _a2 : "");
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
    this.subHeader(el, "Notifications");
    new import_obsidian.Setting(el).setName("Reminder notification sound").setDesc("macOS system sound played when a reminder alert fires.").addDropdown(
      (drop) => {
        var _a2;
        return this.addSoundOptions(drop).setValue((_a2 = this.plugin.settings.notifSoundReminder) != null ? _a2 : "Glass").onChange(async (value) => {
          this.plugin.settings.notifSoundReminder = value;
          await this.plugin.saveSettings();
        });
      }
    );
    this.divider(el);
    this.subHeader(el, "Smart list visibility");
    const smartLists = [
      { id: "today", label: "Today", showKey: "showTodayList", defaultColor: "#FF3B30" },
      { id: "scheduled", label: "Scheduled", showKey: "showScheduledList", defaultColor: "#378ADD" },
      { id: "all", label: "All", showKey: "showAllList", defaultColor: "#636366" },
      { id: "completed", label: "Completed", showKey: "showCompletedList", defaultColor: "#34C759" }
    ];
    for (const sl of smartLists) {
      const colors = (_a = this.plugin.settings.smartListColors) != null ? _a : {};
      const currentColor = (_b = colors[sl.id]) != null ? _b : sl.defaultColor;
      const setting = new import_obsidian.Setting(el).setName(sl.label);
      setting.addColorPicker((picker) => {
        picker.setValue(currentColor);
        picker.onChange(async (hex) => {
          if (!this.plugin.settings.smartListColors) this.plugin.settings.smartListColors = {};
          this.plugin.settings.smartListColors[sl.id] = hex;
          await this.plugin.saveSettings();
        });
      }).addToggle(
        (t) => {
          var _a2;
          return t.setValue((_a2 = this.plugin.settings[sl.showKey]) != null ? _a2 : true).onChange(async (value) => {
            this.plugin.settings[sl.showKey] = value;
            await this.plugin.saveSettings();
          });
        }
      );
    }
  }
  // ── Appearance ────────────────────────────────────────────────────────────
  renderAppearance(el) {
    this.subHeader(el, "Layout");
    new import_obsidian.Setting(el).setName("Reminder list density").setDesc("Comfortable adds more padding between reminder rows.").addDropdown(
      (drop) => {
        var _a;
        return drop.addOption("compact", "Compact").addOption("comfortable", "Comfortable").setValue((_a = this.plugin.settings.density) != null ? _a : "comfortable").onChange(async (value) => {
          this.plugin.settings.density = value;
          await this.plugin.saveSettings();
        });
      }
    );
    new import_obsidian.Setting(el).setName("Show completed count").setDesc("Show the number of completed reminders next to the Completed entry.").addToggle(
      (t) => {
        var _a;
        return t.setValue((_a = this.plugin.settings.showCompletedCount) != null ? _a : true).onChange(async (value) => {
          this.plugin.settings.showCompletedCount = value;
          await this.plugin.saveSettings();
        });
      }
    );
    new import_obsidian.Setting(el).setName("Show reminder count subtitle").setDesc("Show '3 reminders' under the list title in the main panel.").addToggle(
      (t) => {
        var _a;
        return t.setValue((_a = this.plugin.settings.showReminderCountSubtitle) != null ? _a : true).onChange(async (value) => {
          this.plugin.settings.showReminderCountSubtitle = value;
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
  addSoundOptions(drop) {
    for (const s of SOUND_OPTIONS) drop.addOption(s.value, s.label);
    return drop;
  }
  addAlertOptions(drop) {
    for (const a of ALERT_OPTIONS) drop.addOption(a.value, a.label);
    return drop;
  }
};

// src/data/AlertManager.ts
var AlertManager = class {
  constructor(app, reminderManager, eventManager, getSettings) {
    this.intervalId = null;
    this.firedAlerts = /* @__PURE__ */ new Set();
    this.isChecking = false;
    // Store handler references so we can remove them in stop()
    this.onChanged = null;
    this.onCreate = null;
    this.app = app;
    this.reminderManager = reminderManager;
    this.eventManager = eventManager;
    this.getSettings = getSettings;
  }
  start() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setTimeout(() => {
      this.check();
      this.intervalId = window.setInterval(() => this.check(), 30 * 1e3);
    }, 3e3);
    this.onChanged = (file) => {
      const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
      const inReminders = file.path.startsWith(this.reminderManager["remindersFolder"]);
      if (inEvents || inReminders) setTimeout(() => this.check(), 300);
    };
    this.onCreate = (file) => {
      const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
      const inReminders = file.path.startsWith(this.reminderManager["remindersFolder"]);
      if (inEvents || inReminders) setTimeout(() => this.check(), 500);
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
  }
  async check() {
    if (this.isChecking) return;
    this.isChecking = true;
    try {
      await this._check();
    } finally {
      this.isChecking = false;
    }
  }
  async _check() {
    var _a, _b, _c, _d;
    const nowMs = Date.now();
    const windowMs = 5 * 60 * 1e3;
    if ((_a = this.getSettings().notifEvents) != null ? _a : true) {
      const events = await this.eventManager.getAll();
      for (const event of events) {
        if (!event.alert || event.alert === "none") continue;
        if (!event.startDate || !event.startTime) continue;
        const alertKey = `event-${event.id}-${event.startDate}-${event.alert}`;
        if (this.firedAlerts.has(alertKey)) continue;
        const startMs = (/* @__PURE__ */ new Date(`${event.startDate}T${event.startTime}`)).getTime();
        const alertMs = startMs - this.offsetToMs(event.alert);
        if (nowMs >= alertMs && nowMs < alertMs + windowMs) {
          this.fire(alertKey, event.title, this.buildEventBody(event.startTime, event.alert), "event");
        }
      }
    }
    if ((_b = this.getSettings().notifReminders) != null ? _b : true) {
      const reminders = await this.reminderManager.getAll();
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      for (const reminder of reminders) {
        if (!reminder.alert || reminder.alert === "none") continue;
        if (!reminder.dueDate && !reminder.dueTime) continue;
        if (reminder.status === "done" || reminder.status === "cancelled") continue;
        const dateStr = (_c = reminder.dueDate) != null ? _c : today;
        const alertKey = `reminder-${reminder.id}-${dateStr}-${reminder.alert}`;
        if (this.firedAlerts.has(alertKey)) continue;
        const timeStr = (_d = reminder.dueTime) != null ? _d : "09:00";
        const dueMs = (/* @__PURE__ */ new Date(`${dateStr}T${timeStr}`)).getTime();
        const alertMs = dueMs - this.offsetToMs(reminder.alert);
        if (nowMs >= alertMs && nowMs < alertMs + windowMs) {
          this.fire(alertKey, reminder.title, this.buildReminderBody(reminder.dueDate, reminder.dueTime, reminder.alert), "reminder");
        }
      }
    }
  }
  fire(key, title, body, type) {
    var _a, _b, _c, _d;
    this.firedAlerts.add(key);
    const settings = this.getSettings();
    const doNotif = (_a = settings.notifMacOS) != null ? _a : true;
    const doSound = (_b = settings.notifSound) != null ? _b : true;
    const rawSound = type === "event" ? (_c = settings.notifSoundEvent) != null ? _c : "Glass" : (_d = settings.notifSoundReminder) != null ? _d : "Glass";
    if (doNotif && Notification.permission === "granted") {
      new Notification(`Chronicle \u2014 ${type === "event" ? "Event" : "Reminder"}`, {
        body: `${title}
${body}`,
        silent: true
        // we control sound separately below
      });
    }
    if (doSound && rawSound && rawSound !== "none") {
      try {
        const { exec } = window.require("child_process");
        exec(`afplay "/System/Library/Sounds/${rawSound}.aiff"`);
      } catch (e) {
      }
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
  buildReminderBody(dueDate, dueTime, alert) {
    if (!dueDate) return dueTime ? `At ${this.formatTime(dueTime)}` : "Now";
    const dateLabel = (/* @__PURE__ */ new Date(dueDate + "T00:00:00")).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
    if (dueTime) {
      if (alert === "at-time") return `At ${this.formatTime(dueTime)}`;
      return `${this.offsetLabel(alert)} \u2014 at ${this.formatTime(dueTime)}`;
    }
    return dateLabel;
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
  remindersFolder: "Chronicle/Reminders",
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
  defaultReminderStatus: "todo",
  defaultReminderPriority: "none",
  defaultAlert: "none",
  startOfWeek: 0,
  timeFormat: "12h",
  defaultCalendarView: "week",
  showTodayList: true,
  showScheduledList: true,
  showAllList: true,
  showFlaggedList: true,
  showCompletedList: true,
  smartListOrder: ["today", "scheduled", "all", "flagged", "completed"],
  smartListColors: {
    today: "#FF3B30",
    scheduled: "#378ADD",
    all: "#636366",
    flagged: "#FF9500",
    completed: "#34C759"
  },
  notifMacOS: true,
  notifSound: true,
  notifEvents: true,
  notifReminders: true,
  notifSoundEvent: "Glass",
  notifSoundReminder: "Glass",
  defaultEventDuration: 60,
  density: "comfortable",
  showCompletedCount: true,
  showReminderCountSubtitle: true,
  defaultCustomFields: []
};

// src/views/EventFormView.ts
var import_obsidian2 = require("obsidian");

// src/ui/tagField.ts
function buildTagField(app, wrapper, initial) {
  const selected = [...initial];
  const inner = wrapper.createDiv("ctf-inner");
  const chipsRow = inner.createDiv("ctf-chips");
  const textInput = inner.createEl("input", {
    type: "text",
    cls: "ctf-input",
    placeholder: selected.length === 0 ? "Add tags\u2026" : ""
  });
  const dropdown = inner.createDiv("ctf-dropdown");
  dropdown.style.display = "none";
  const renderChips = () => {
    chipsRow.empty();
    for (const tag of selected) {
      const chip = chipsRow.createDiv("ctf-chip");
      chip.createSpan({ cls: "ctf-chip-label" }).setText(tag);
      const remove = chip.createEl("button", { cls: "ctf-chip-remove", text: "\xD7" });
      remove.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        selected.splice(selected.indexOf(tag), 1);
        renderChips();
        updatePlaceholder();
      });
    }
    textInput.placeholder = selected.length === 0 ? "Add tags\u2026" : "";
  };
  const updatePlaceholder = () => {
    textInput.placeholder = selected.length === 0 ? "Add tags\u2026" : "";
  };
  const getVaultTags = () => {
    const raw = app.metadataCache.getTags();
    if (!raw) return [];
    return Object.keys(raw).map((t) => t.startsWith("#") ? t.slice(1) : t);
  };
  const closeDropdown = () => {
    dropdown.style.display = "none";
    dropdown.empty();
  };
  const addTag = (tag) => {
    const clean = tag.trim().replace(/^#/, "");
    if (!clean || selected.includes(clean)) return;
    selected.push(clean);
    textInput.value = "";
    renderChips();
    closeDropdown();
  };
  textInput.addEventListener("input", () => {
    const q = textInput.value.trim().replace(/^#/, "");
    dropdown.empty();
    if (!q) {
      closeDropdown();
      return;
    }
    const vaultTags = getVaultTags();
    const matches = vaultTags.filter((t) => !selected.includes(t) && t.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
    if (matches.length === 0) {
      closeDropdown();
      return;
    }
    dropdown.style.display = "";
    for (const tag of matches) {
      const item = dropdown.createDiv("ctf-result-item");
      item.createSpan({ cls: "ctf-tag-hash", text: "#" });
      item.createSpan({ cls: "ctf-tag-label" }).setText(tag);
      item.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        addTag(tag);
      });
    }
  });
  textInput.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === ",") {
      ev.preventDefault();
      addTag(textInput.value);
    }
    if (ev.key === "Backspace" && textInput.value === "" && selected.length > 0) {
      selected.pop();
      renderChips();
    }
  });
  textInput.addEventListener("blur", () => {
    if (textInput.value.trim()) addTag(textInput.value);
    setTimeout(closeDropdown, 150);
  });
  renderChips();
  return { getTags: () => [...selected] };
}

// src/views/EventFormView.ts
var EVENT_FORM_VIEW_TYPE = "chronicle-event-form";
var EventFormView = class extends import_obsidian2.ItemView {
  constructor(leaf, eventManager, calendarManager, reminderManager, editingEvent, onSave) {
    super(leaf);
    this.editingEvent = null;
    this.eventManager = eventManager;
    this.calendarManager = calendarManager;
    this.reminderManager = reminderManager;
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("chronicle-form-page");
    const e = this.editingEvent;
    const calendars = this.calendarManager.getAll();
    const allReminders = await this.reminderManager.getAll();
    let linkedIds = [...(_a = e == null ? void 0 : e.linkedReminderIds) != null ? _a : []];
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
    for (const rec of RECURRENCE_OPTIONS) {
      const opt = recSelect.createEl("option", { value: rec.value, text: rec.label });
      if ((e == null ? void 0 : e.recurrence) === rec.value) opt.selected = true;
    }
    const alertSelect = this.field(form, "Alert").createEl("select", { cls: "cf-select" });
    for (const a of ALERT_OPTIONS) {
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
    const tagField = buildTagField(this.app, this.field(form, "Tags"), (_i = e == null ? void 0 : e.tags) != null ? _i : []);
    const linkedInput = this.field(form, "Linked notes").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Projects/Website, Journal/2024  (comma separated)"
    });
    linkedInput.value = (_k = (_j = e == null ? void 0 : e.linkedNotes) == null ? void 0 : _j.join(", ")) != null ? _k : "";
    const linkedRemindersField = this.field(form, "Linked reminders");
    const linkedList = linkedRemindersField.createDiv("ctl-list");
    const renderLinkedList = () => {
      linkedList.empty();
      const items = allReminders.filter((r) => linkedIds.includes(r.id));
      if (items.length === 0) {
        linkedList.createDiv("ctl-empty").setText("No linked reminders");
      }
      for (const reminder of items) {
        const row = linkedList.createDiv("ctl-item");
        row.createSpan({ cls: `ctl-status ctl-status-${reminder.status}` });
        row.createSpan({ cls: "ctl-title" }).setText(reminder.title);
        const unlinkBtn = row.createEl("button", { cls: "ctl-unlink", text: "\xD7" });
        unlinkBtn.addEventListener("click", () => {
          linkedIds = linkedIds.filter((id) => id !== reminder.id);
          renderLinkedList();
        });
      }
    };
    renderLinkedList();
    const searchWrap = linkedRemindersField.createDiv("ctl-search-wrap");
    const searchInput = searchWrap.createEl("input", {
      type: "text",
      cls: "cf-input ctl-search",
      placeholder: "Search reminders to link\u2026"
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
      const matches = allReminders.filter((r) => !linkedIds.includes(r.id) && r.title.toLowerCase().includes(q)).slice(0, 6);
      if (matches.length === 0) {
        closeSearch();
        return;
      }
      searchResults.style.display = "";
      for (const reminder of matches) {
        const item = searchResults.createDiv("ctl-result-item");
        item.createSpan({ cls: `ctl-status ctl-status-${reminder.status}` });
        item.createSpan({ cls: "ctl-result-title" }).setText(reminder.title);
        item.addEventListener("mousedown", (ev) => {
          ev.preventDefault();
          linkedIds.push(reminder.id);
          searchInput.value = "";
          closeSearch();
          renderLinkedList();
        });
      }
    });
    searchInput.addEventListener("blur", () => {
      setTimeout(closeSearch, 150);
    });
    const newReminderWrap = linkedRemindersField.createDiv("ctl-new-wrap");
    const newReminderInput = newReminderWrap.createEl("input", {
      type: "text",
      cls: "cf-input ctl-new-input",
      placeholder: "New reminder title\u2026"
    });
    const addReminderBtn = newReminderWrap.createEl("button", { cls: "cf-btn-primary ctl-add-btn", text: "Add reminder" });
    const createAndLink = async () => {
      const title = newReminderInput.value.trim();
      if (!title) return;
      const newReminder = await this.reminderManager.create({
        title,
        status: "todo",
        priority: "none",
        alert: "none",
        tags: [],
        linkedNotes: [],
        projects: [],
        timeEntries: [],
        customFields: [],
        completedInstances: []
      });
      allReminders.push(newReminder);
      linkedIds.push(newReminder.id);
      newReminderInput.value = "";
      renderLinkedList();
    };
    addReminderBtn.addEventListener("click", createAndLink);
    newReminderInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        createAndLink();
      }
    });
    const notesInput = this.field(form, "Notes").createEl("textarea", {
      cls: "cf-textarea",
      placeholder: "Add notes..."
    });
    notesInput.value = (_l = e == null ? void 0 : e.notes) != null ? _l : "";
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
        linkedNotes: linkedInput.value ? linkedInput.value.split(",").map((s) => s.trim()).filter(Boolean) : (_a2 = e == null ? void 0 : e.linkedNotes) != null ? _a2 : [],
        tags: tagField.getTags(),
        linkedReminderIds: linkedIds,
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
var import_obsidian12 = require("obsidian");

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

// src/data/ReminderManager.ts
var import_obsidian3 = require("obsidian");
var ReminderManager = class {
  constructor(app, remindersFolder) {
    this.app = app;
    this.remindersFolder = remindersFolder;
  }
  // ── Read ────────────────────────────────────────────────────────────────────
  async getAll() {
    const folder = this.app.vault.getFolderByPath(this.remindersFolder);
    if (!folder) return [];
    const reminders = [];
    for (const child of folder.children) {
      if (child instanceof import_obsidian3.TFile && child.extension === "md") {
        const reminder = await this.fileToReminder(child);
        if (reminder) reminders.push(reminder);
      }
    }
    return reminders;
  }
  async getById(id) {
    var _a;
    const all = await this.getAll();
    return (_a = all.find((r) => r.id === id)) != null ? _a : null;
  }
  // ── Write ───────────────────────────────────────────────────────────────────
  async create(reminder) {
    await this.ensureFolder();
    const full = {
      ...reminder,
      id: this.generateId(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const path = (0, import_obsidian3.normalizePath)(`${this.remindersFolder}/${full.title}.md`);
    await this.app.vault.create(path, this.reminderToMarkdown(full));
    return full;
  }
  async update(reminder) {
    var _a;
    const file = this.findFileForReminder(reminder.id);
    if (!file) return;
    const expectedPath = (0, import_obsidian3.normalizePath)(`${this.remindersFolder}/${reminder.title}.md`);
    if (file.path !== expectedPath) {
      await this.app.fileManager.renameFile(file, expectedPath);
    }
    const updatedFile = (_a = this.app.vault.getFileByPath(expectedPath)) != null ? _a : file;
    await this.app.vault.modify(updatedFile, this.reminderToMarkdown(reminder));
  }
  async delete(id) {
    const file = this.findFileForReminder(id);
    if (file) await this.app.vault.delete(file);
  }
  async markComplete(id) {
    const reminder = await this.getById(id);
    if (!reminder) return;
    await this.update({
      ...reminder,
      status: "done",
      completedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  // ── Filters ─────────────────────────────────────────────────────────────────
  async getDueToday() {
    const today = this.todayStr();
    const all = await this.getAll();
    return all.filter(
      (r) => r.status !== "done" && r.status !== "cancelled" && r.dueDate === today
    );
  }
  async getOverdue() {
    const today = this.todayStr();
    const all = await this.getAll();
    return all.filter(
      (r) => r.status !== "done" && r.status !== "cancelled" && !!r.dueDate && r.dueDate < today
    );
  }
  async getScheduled() {
    const all = await this.getAll();
    return all.filter(
      (r) => r.status !== "done" && r.status !== "cancelled" && !!r.dueDate
    );
  }
  async getFlagged() {
    const all = await this.getAll();
    return all.filter((r) => r.priority === "high" && r.status !== "done");
  }
  // ── Serialisation ───────────────────────────────────────────────────────────
  reminderToMarkdown(reminder) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const fm = {
      id: reminder.id,
      title: reminder.title,
      "location": (_a = reminder.location) != null ? _a : null,
      status: reminder.status,
      priority: reminder.priority,
      tags: reminder.tags,
      projects: reminder.projects,
      "linked-notes": reminder.linkedNotes,
      "list-id": (_b = reminder.listId) != null ? _b : null,
      "due-date": (_c = reminder.dueDate) != null ? _c : null,
      "due-time": (_d = reminder.dueTime) != null ? _d : null,
      recurrence: (_e = reminder.recurrence) != null ? _e : null,
      "alert": (_f = reminder.alert) != null ? _f : "none",
      "time-estimate": (_g = reminder.timeEstimate) != null ? _g : null,
      "time-entries": reminder.timeEntries,
      "custom-fields": reminder.customFields,
      "completed-instances": reminder.completedInstances,
      "created-at": reminder.createdAt,
      "completed-at": (_h = reminder.completedAt) != null ? _h : null
    };
    const yaml = Object.entries(fm).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n");
    const body = reminder.notes ? `
${reminder.notes}` : "";
    return `---
${yaml}
---
${body}`;
  }
  async fileToReminder(file) {
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
        // read new list-id; fall back to legacy calendar-id so old reminders still show their list
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
  findFileForReminder(id) {
    var _a;
    const folder = this.app.vault.getFolderByPath(this.remindersFolder);
    if (!folder) return null;
    for (const child of folder.children) {
      if (!(child instanceof import_obsidian3.TFile)) continue;
      const cache = this.app.metadataCache.getFileCache(child);
      if (((_a = cache == null ? void 0 : cache.frontmatter) == null ? void 0 : _a.id) === id) return child;
    }
    return null;
  }
  async ensureFolder() {
    if (!this.app.vault.getFolderByPath(this.remindersFolder)) {
      await this.app.vault.createFolder(this.remindersFolder);
    }
  }
  generateId() {
    return `reminder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
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
      "linked-reminder-ids": event.linkedReminderIds,
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
        linkedReminderIds: (_k = fm["linked-reminder-ids"]) != null ? _k : [],
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

// src/views/ReminderView.ts
var import_obsidian8 = require("obsidian");

// src/ui/ReminderModal.ts
var import_obsidian5 = require("obsidian");
var ReminderModal = class extends import_obsidian5.Modal {
  constructor(app, reminderManager, listManager, editingReminder, onSave, onExpand, plugin) {
    super(app);
    this.reminderManager = reminderManager;
    this.listManager = listManager;
    this.editingReminder = editingReminder != null ? editingReminder : null;
    this.onSave = onSave;
    this.onExpand = onExpand;
    this.plugin = plugin;
  }
  onOpen() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("chronicle-event-modal");
    const r = this.editingReminder;
    const lists = this.listManager.getAll();
    const header = contentEl.createDiv("cem-header");
    header.createDiv("cem-title").setText(r ? "Edit reminder" : "New reminder");
    const expandBtn = header.createEl("button", { cls: "cf-btn-ghost cem-expand-btn" });
    expandBtn.title = "Open as full page";
    expandBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
    expandBtn.addEventListener("click", () => {
      var _a2;
      this.close();
      (_a2 = this.onExpand) == null ? void 0 : _a2.call(this, r != null ? r : void 0);
    });
    const form = contentEl.createDiv("cem-form");
    const titleInput = this.field(form, "Title").createEl("input", {
      type: "text",
      cls: "cf-input cf-title-input",
      placeholder: "Reminder name"
    });
    titleInput.value = (_a = r == null ? void 0 : r.title) != null ? _a : "";
    titleInput.focus();
    const locationInput = this.field(form, "Location").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Add location"
    });
    locationInput.value = (_b = r == null ? void 0 : r.location) != null ? _b : "";
    const row1 = form.createDiv("cf-row");
    const statusSelect = this.field(row1, "Status").createEl("select", { cls: "cf-select" });
    const defaultStatus = (_e = (_d = (_c = this.plugin) == null ? void 0 : _c.settings) == null ? void 0 : _d.defaultReminderStatus) != null ? _e : "todo";
    for (const s of STATUS_OPTIONS) {
      const opt = statusSelect.createEl("option", { value: s.value, text: s.label });
      if (r ? r.status === s.value : s.value === defaultStatus) opt.selected = true;
    }
    const prioritySelect = this.field(row1, "Priority").createEl("select", { cls: "cf-select" });
    const defaultPriority = (_h = (_g = (_f = this.plugin) == null ? void 0 : _f.settings) == null ? void 0 : _g.defaultReminderPriority) != null ? _h : "none";
    for (const p of PRIORITY_OPTIONS) {
      const opt = prioritySelect.createEl("option", { value: p.value, text: p.label });
      if (r ? r.priority === p.value : p.value === defaultPriority) opt.selected = true;
    }
    const row2 = form.createDiv("cf-row");
    const dueDateInput = this.field(row2, "Date").createEl("input", { type: "date", cls: "cf-input" });
    dueDateInput.value = (_i = r == null ? void 0 : r.dueDate) != null ? _i : "";
    const dueTimeInput = this.field(row2, "Time").createEl("input", { type: "time", cls: "cf-input" });
    dueTimeInput.value = (_j = r == null ? void 0 : r.dueTime) != null ? _j : "";
    const recSelect = this.field(form, "Repeat").createEl("select", { cls: "cf-select" });
    for (const rec of RECURRENCE_OPTIONS) {
      const opt = recSelect.createEl("option", { value: rec.value, text: rec.label });
      if ((r == null ? void 0 : r.recurrence) === rec.value) opt.selected = true;
    }
    const alertSelect = this.field(form, "Alert").createEl("select", { cls: "cf-select" });
    const defaultAlert = (_m = (_l = (_k = this.plugin) == null ? void 0 : _k.settings) == null ? void 0 : _l.defaultAlert) != null ? _m : "none";
    for (const a of ALERT_OPTIONS) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if (r ? r.alert === a.value : a.value === defaultAlert) opt.selected = true;
    }
    const listSelect = this.field(form, "List").createEl("select", { cls: "cf-select" });
    const defaultListId = (_p = (_o = (_n = this.plugin) == null ? void 0 : _n.settings) == null ? void 0 : _o.defaultListId) != null ? _p : "";
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
    const tagField = buildTagField(this.app, this.field(form, "Tags"), (_q = r == null ? void 0 : r.tags) != null ? _q : []);
    const footer = contentEl.createDiv("cem-footer");
    const cancelBtn = footer.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });
    if (r && r.id) {
      const deleteBtn = footer.createEl("button", { cls: "cf-btn-delete", text: "Delete reminder" });
      deleteBtn.addEventListener("click", async () => {
        var _a2;
        await this.reminderManager.delete(r.id);
        (_a2 = this.onSave) == null ? void 0 : _a2.call(this);
        this.close();
      });
    }
    const saveBtn = footer.createEl("button", {
      cls: "cf-btn-primary",
      text: (r == null ? void 0 : r.id) ? "Save" : "Add reminder"
    });
    cancelBtn.addEventListener("click", () => this.close());
    const handleSave = async () => {
      var _a2, _b2, _c2, _d2, _e2, _f2;
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.focus();
        titleInput.classList.add("cf-error");
        return;
      }
      if (!(r == null ? void 0 : r.id)) {
        const existing = await this.reminderManager.getAll();
        const duplicate = existing.find((e) => e.title.toLowerCase() === title.toLowerCase());
        if (duplicate) {
          new import_obsidian5.Notice(`A reminder named "${title}" already exists.`, 4e3);
          titleInput.classList.add("cf-error");
          titleInput.focus();
          return;
        }
      }
      const reminderData = {
        title,
        status: statusSelect.value,
        priority: prioritySelect.value,
        dueDate: dueDateInput.value || void 0,
        dueTime: dueTimeInput.value || void 0,
        listId: listSelect.value || void 0,
        recurrence: recSelect.value || void 0,
        alert: alertSelect.value,
        location: locationInput.value || void 0,
        tags: tagField.getTags(),
        notes: r == null ? void 0 : r.notes,
        linkedNotes: (_a2 = r == null ? void 0 : r.linkedNotes) != null ? _a2 : [],
        projects: (_b2 = r == null ? void 0 : r.projects) != null ? _b2 : [],
        timeEstimate: r == null ? void 0 : r.timeEstimate,
        timeEntries: (_c2 = r == null ? void 0 : r.timeEntries) != null ? _c2 : [],
        customFields: (_d2 = r == null ? void 0 : r.customFields) != null ? _d2 : [],
        completedInstances: (_e2 = r == null ? void 0 : r.completedInstances) != null ? _e2 : []
      };
      if (r == null ? void 0 : r.id) {
        await this.reminderManager.update({ ...r, ...reminderData });
      } else {
        await this.reminderManager.create(reminderData);
      }
      (_f2 = this.onSave) == null ? void 0 : _f2.call(this);
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

// src/ui/ReminderDetailPopup.ts
var import_obsidian6 = require("obsidian");

// src/utils/formatters.ts
function formatDateFull(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
function formatDateRelative(dateStr) {
  const today = todayStr();
  const tomorrow = new Date(Date.now() + 864e5).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  return (/* @__PURE__ */ new Date(dateStr + "T00:00:00")).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatTime12(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}
function formatHour12(h) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
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
    "at-time": "At time",
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
function formatStatus(s) {
  var _a;
  return (_a = { todo: "To Do", "in-progress": "In Progress", done: "Done", cancelled: "Cancelled" }[s]) != null ? _a : s;
}
function formatPriority(p) {
  var _a;
  const map = {
    low: "Low priority",
    medium: "Medium priority",
    high: "High priority"
  };
  return (_a = map[p]) != null ? _a : p;
}
function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}
function todayStr() {
  return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
}

// src/ui/ReminderDetailPopup.ts
var ReminderDetailPopup = class extends import_obsidian6.Modal {
  constructor(app, reminder, listManager, timeFormat, onEdit) {
    super(app);
    this.reminder = reminder;
    this.listManager = listManager;
    this.timeFormat = timeFormat;
    this.onEdit = onEdit;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("cdp-modal");
    const r = this.reminder;
    const header = contentEl.createDiv("cdp-header");
    header.createDiv("cdp-title").setText(r.title);
    const badgeRow = contentEl.createDiv("cdp-badge-row");
    badgeRow.createSpan({ cls: `cdp-badge cdp-status-${r.status}` }).setText(formatStatus(r.status));
    if (r.priority !== "none") {
      badgeRow.createSpan({ cls: `cdp-badge cdp-priority-${r.priority}` }).setText(formatPriority(r.priority));
    }
    const body = contentEl.createDiv("cdp-body");
    if (r.dueDate || r.dueTime) {
      const datePart = r.dueDate ? formatDateFull(r.dueDate) : "";
      const timePart = r.dueTime ? this.fmtTime(r.dueTime) : "";
      const display = [datePart, timePart].filter(Boolean).join("  \xB7  ");
      this.row(body, "At", display);
    }
    if (r.location) this.row(body, "Location", r.location);
    if (r.listId) {
      const list = this.listManager.getById(r.listId);
      if (list) this.listRow(body, list.name, list.color);
    }
    if (r.recurrence) this.row(body, "Repeat", formatRecurrence(r.recurrence));
    if (r.alert && r.alert !== "none") this.row(body, "Alert", formatAlert(r.alert));
    if (r.tags.length > 0) this.row(body, "Tags", r.tags.join(", "));
    if (r.projects.length > 0) this.row(body, "Projects", r.projects.join(", "));
    if (r.linkedNotes.length > 0) this.row(body, "Linked notes", r.linkedNotes.join(", "));
    if (r.timeEstimate) this.row(body, "Estimate", formatDuration(r.timeEstimate));
    if (r.notes) {
      const notesRow = body.createDiv("cdp-row cdp-notes-row");
      notesRow.createDiv("cdp-row-label").setText("Notes");
      notesRow.createDiv("cdp-row-value cdp-notes-text").setText(
        r.notes.length > 400 ? r.notes.slice(0, 400) + "\u2026" : r.notes
      );
    }
    const footer = contentEl.createDiv("cdp-footer");
    footer.createEl("button", { cls: "cf-btn-primary", text: "Edit reminder" }).addEventListener("click", () => {
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

// src/views/ReminderFormView.ts
var import_obsidian7 = require("obsidian");
var REMINDER_FORM_VIEW_TYPE = "chronicle-reminder-form";
var ReminderFormView = class extends import_obsidian7.ItemView {
  constructor(leaf, reminderManager, listManager, editingReminder, onSave) {
    super(leaf);
    this.editingReminder = null;
    this.reminderManager = reminderManager;
    this.listManager = listManager;
    this.editingReminder = editingReminder != null ? editingReminder : null;
    this.onSave = onSave;
  }
  getViewType() {
    return REMINDER_FORM_VIEW_TYPE;
  }
  getDisplayText() {
    return this.editingReminder ? "Edit reminder" : "New reminder";
  }
  getIcon() {
    return "check-circle";
  }
  async onOpen() {
    this.render();
  }
  loadReminder(reminder) {
    this.editingReminder = reminder;
    this.render();
  }
  render() {
    var _a, _b, _c, _d, _e, _f, _g;
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("chronicle-form-page");
    const r = this.editingReminder;
    const lists = this.listManager.getAll();
    const header = container.createDiv("cf-header");
    const cancelBtn = header.createEl("button", { cls: "cf-btn-ghost", text: "Cancel" });
    header.createDiv("cf-header-title").setText(r ? "Edit reminder" : "New reminder");
    const saveBtn = header.createEl("button", { cls: "cf-btn-primary", text: r ? "Save" : "Add" });
    const form = container.createDiv("cf-form");
    const titleInput = this.field(form, "Title").createEl("input", {
      type: "text",
      cls: "cf-input cf-title-input",
      placeholder: "Reminder name"
    });
    titleInput.value = (_a = r == null ? void 0 : r.title) != null ? _a : "";
    titleInput.focus();
    const locationInput = this.field(form, "Location").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Add location"
    });
    locationInput.value = (_b = r == null ? void 0 : r.location) != null ? _b : "";
    const row1 = form.createDiv("cf-row");
    const statusSelect = this.field(row1, "Status").createEl("select", { cls: "cf-select" });
    for (const s of STATUS_OPTIONS) {
      const opt = statusSelect.createEl("option", { value: s.value, text: s.label });
      if ((r == null ? void 0 : r.status) === s.value) opt.selected = true;
    }
    const prioritySelect = this.field(row1, "Priority").createEl("select", { cls: "cf-select" });
    for (const p of PRIORITY_OPTIONS) {
      const opt = prioritySelect.createEl("option", { value: p.value, text: p.label });
      if ((r == null ? void 0 : r.priority) === p.value) opt.selected = true;
    }
    const row2 = form.createDiv("cf-row");
    const dueDateInput = this.field(row2, "Date").createEl("input", { type: "date", cls: "cf-input" });
    dueDateInput.value = (_c = r == null ? void 0 : r.dueDate) != null ? _c : "";
    const dueTimeInput = this.field(row2, "Time").createEl("input", { type: "time", cls: "cf-input" });
    dueTimeInput.value = (_d = r == null ? void 0 : r.dueTime) != null ? _d : "";
    const recSelect = this.field(form, "Repeat").createEl("select", { cls: "cf-select" });
    for (const rec of RECURRENCE_OPTIONS) {
      const opt = recSelect.createEl("option", { value: rec.value, text: rec.label });
      if ((r == null ? void 0 : r.recurrence) === rec.value) opt.selected = true;
    }
    const alertSelect = this.field(form, "Alert").createEl("select", { cls: "cf-select" });
    for (const a of ALERT_OPTIONS) {
      const opt = alertSelect.createEl("option", { value: a.value, text: a.label });
      if ((r == null ? void 0 : r.alert) === a.value) opt.selected = true;
    }
    const listSelect = this.field(form, "List").createEl("select", { cls: "cf-select" });
    listSelect.createEl("option", { value: "", text: "None" });
    for (const list of lists) {
      const opt = listSelect.createEl("option", { value: list.id, text: list.name });
      if ((r == null ? void 0 : r.listId) === list.id) opt.selected = true;
    }
    const updateListColor = () => {
      const list = this.listManager.getById(listSelect.value);
      listSelect.style.borderLeftColor = list ? list.color : "transparent";
      listSelect.style.borderLeftWidth = "4px";
      listSelect.style.borderLeftStyle = "solid";
    };
    listSelect.addEventListener("change", updateListColor);
    updateListColor();
    const tagField = buildTagField(this.app, this.field(form, "Tags"), (_e = r == null ? void 0 : r.tags) != null ? _e : []);
    const linkedInput = this.field(form, "Linked notes").createEl("input", {
      type: "text",
      cls: "cf-input",
      placeholder: "Projects/Website, Journal/2024  (comma separated)"
    });
    linkedInput.value = (_f = r == null ? void 0 : r.linkedNotes.join(", ")) != null ? _f : "";
    const notesInput = this.field(form, "Notes").createEl("textarea", {
      cls: "cf-textarea",
      placeholder: "Add notes..."
    });
    notesInput.value = (_g = r == null ? void 0 : r.notes) != null ? _g : "";
    cancelBtn.addEventListener("click", () => {
      this.app.workspace.detachLeavesOfType(REMINDER_FORM_VIEW_TYPE);
    });
    const handleSave = async () => {
      var _a2, _b2, _c2, _d2, _e2;
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.focus();
        titleInput.classList.add("cf-error");
        return;
      }
      if (!this.editingReminder) {
        const existing = await this.reminderManager.getAll();
        const duplicate = existing.find((e) => e.title.toLowerCase() === title.toLowerCase());
        if (duplicate) {
          new import_obsidian7.Notice(`A reminder named "${title}" already exists.`, 4e3);
          titleInput.classList.add("cf-error");
          titleInput.focus();
          return;
        }
      }
      const reminderData = {
        title,
        location: locationInput.value || void 0,
        status: statusSelect.value,
        priority: prioritySelect.value,
        dueDate: dueDateInput.value || void 0,
        dueTime: dueTimeInput.value || void 0,
        listId: listSelect.value || void 0,
        recurrence: recSelect.value || void 0,
        alert: alertSelect.value,
        tags: tagField.getTags(),
        linkedNotes: linkedInput.value ? linkedInput.value.split(",").map((s) => s.trim()).filter(Boolean) : [],
        projects: (_a2 = r == null ? void 0 : r.projects) != null ? _a2 : [],
        timeEntries: (_b2 = r == null ? void 0 : r.timeEntries) != null ? _b2 : [],
        completedInstances: (_c2 = r == null ? void 0 : r.completedInstances) != null ? _c2 : [],
        customFields: (_d2 = r == null ? void 0 : r.customFields) != null ? _d2 : [],
        notes: notesInput.value || void 0
      };
      if (r) {
        await this.reminderManager.update({ ...r, ...reminderData });
      } else {
        await this.reminderManager.create(reminderData);
      }
      (_e2 = this.onSave) == null ? void 0 : _e2.call(this);
      this.app.workspace.detachLeavesOfType(REMINDER_FORM_VIEW_TYPE);
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

// src/views/ReminderView.ts
var REMINDER_VIEW_TYPE = "chronicle-reminder-view";
var ReminderView = class extends import_obsidian8.ItemView {
  constructor(leaf, reminderManager, listManager, plugin) {
    super(leaf);
    this.currentListId = "today";
    this._renderVersion = 0;
    this.reminderManager = reminderManager;
    this.listManager = listManager;
    this.plugin = plugin;
  }
  getViewType() {
    return REMINDER_VIEW_TYPE;
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
        if (file.path.startsWith(this.reminderManager["remindersFolder"])) {
          this.render();
        }
      })
    );
    this.registerEvent(
      this.app.workspace.on("chronicle:settings-changed", () => this.render())
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (file.path.startsWith(this.reminderManager["remindersFolder"])) {
          setTimeout(() => this.render(), 200);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file.path.startsWith(this.reminderManager["remindersFolder"])) {
          this.render();
        }
      })
    );
  }
  async render() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    const version = ++this._renderVersion;
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("chronicle-app");
    const all = await this.reminderManager.getAll();
    const today = await this.reminderManager.getDueToday();
    const scheduled = await this.reminderManager.getScheduled();
    const flagged = await this.reminderManager.getFlagged();
    const overdue = await this.reminderManager.getOverdue();
    const lists = this.listManager.getAll();
    if (this._renderVersion !== version) return;
    const layout = container.createDiv("chronicle-layout");
    const sidebar = layout.createDiv("chronicle-sidebar");
    const main = layout.createDiv("chronicle-main");
    const newReminderBtn = sidebar.createEl("button", {
      cls: "chronicle-new-reminder-btn",
      text: "New Reminder"
    });
    newReminderBtn.addEventListener("click", () => this.openReminderForm());
    const tilesGrid = sidebar.createDiv("chronicle-tiles");
    const settings = this.plugin.settings;
    const colors = (_a = settings.smartListColors) != null ? _a : {};
    const allTiles = {
      today: { label: "Today", count: today.length + overdue.length, color: (_b = colors.today) != null ? _b : "#FF3B30", badge: overdue.length, visible: (_c = settings.showTodayList) != null ? _c : true },
      scheduled: { label: "Scheduled", count: scheduled.length, color: (_d = colors.scheduled) != null ? _d : "#378ADD", badge: 0, visible: (_e = settings.showScheduledList) != null ? _e : true },
      all: { label: "All", count: all.filter((r) => r.status !== "done").length, color: (_f = colors.all) != null ? _f : "#636366", badge: 0, visible: (_g = settings.showAllList) != null ? _g : true },
      flagged: { label: "Flagged", count: flagged.length, color: (_h = colors.flagged) != null ? _h : "#FF9500", badge: 0, visible: (_i = settings.showFlaggedList) != null ? _i : true },
      completed: { label: "Completed", count: all.filter((r) => r.status === "done").length, color: (_j = colors.completed) != null ? _j : "#34C759", badge: 0, visible: (_k = settings.showCompletedList) != null ? _k : true }
    };
    const order = ((_l = settings.smartListOrder) == null ? void 0 : _l.length) ? settings.smartListOrder : ["today", "scheduled", "all", "flagged", "completed"];
    for (const id of Object.keys(allTiles)) {
      if (!order.includes(id)) order.push(id);
    }
    let dragSrcId = null;
    for (const id of order) {
      const tile = allTiles[id];
      if (!tile || !tile.visible) continue;
      const t = tilesGrid.createDiv("chronicle-tile");
      t.dataset.tileId = id;
      t.draggable = true;
      t.style.backgroundColor = tile.color;
      if (id === this.currentListId) t.addClass("active");
      const topRow = t.createDiv("chronicle-tile-top");
      topRow.createDiv("chronicle-tile-count").setText(String(tile.count));
      if (tile.badge > 0) {
        const badge = topRow.createDiv("chronicle-tile-badge");
        badge.setText(String(tile.badge));
        badge.title = `${tile.badge} overdue`;
      }
      t.createDiv("chronicle-tile-label").setText(tile.label);
      t.addEventListener("click", () => {
        this.currentListId = id;
        this.render();
      });
      t.addEventListener("dragstart", (e) => {
        var _a2;
        dragSrcId = id;
        t.addClass("chronicle-tile-dragging");
        (_a2 = e.dataTransfer) == null ? void 0 : _a2.setData("text/plain", id);
      });
      t.addEventListener("dragend", () => {
        t.removeClass("chronicle-tile-dragging");
        tilesGrid.querySelectorAll(".chronicle-tile-drag-over").forEach((el) => el.removeClass("chronicle-tile-drag-over"));
      });
      t.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (dragSrcId && dragSrcId !== id) {
          tilesGrid.querySelectorAll(".chronicle-tile-drag-over").forEach((el) => el.removeClass("chronicle-tile-drag-over"));
          t.addClass("chronicle-tile-drag-over");
        }
      });
      t.addEventListener("drop", async (e) => {
        e.preventDefault();
        if (!dragSrcId || dragSrcId === id) return;
        const newOrder = [...order];
        const srcIdx = newOrder.indexOf(dragSrcId);
        const dstIdx = newOrder.indexOf(id);
        if (srcIdx !== -1 && dstIdx !== -1) {
          newOrder.splice(srcIdx, 1);
          newOrder.splice(dstIdx, 0, dragSrcId);
          this.plugin.settings.smartListOrder = newOrder;
          await this.plugin.saveSettings();
          this.render();
        }
        dragSrcId = null;
      });
    }
    if (allTiles[this.currentListId] && !allTiles[this.currentListId].visible) {
      this.currentListId = (_m = order.find((id) => {
        var _a2;
        return (_a2 = allTiles[id]) == null ? void 0 : _a2.visible;
      })) != null ? _m : "today";
    }
    const listsSection = sidebar.createDiv("chronicle-lists-section");
    listsSection.createDiv("chronicle-section-label").setText("My Lists");
    for (const list of lists) {
      const row = listsSection.createDiv("chronicle-list-row");
      if (list.id === this.currentListId) row.addClass("active");
      const dot = row.createDiv("chronicle-list-dot");
      dot.style.backgroundColor = list.color;
      row.createDiv("chronicle-list-name").setText(list.name);
      const listCount = all.filter((r) => r.listId === list.id && r.status !== "done").length;
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
    let reminders = [];
    const SMART_LIST_IDS = ["today", "scheduled", "all", "flagged", "completed"];
    const SMART_LABELS = {
      today: "Today",
      scheduled: "Scheduled",
      all: "All",
      flagged: "Flagged",
      completed: "Completed"
    };
    if (SMART_LIST_IDS.includes(this.currentListId)) {
      titleEl.setText(SMART_LABELS[this.currentListId]);
      titleEl.style.color = "var(--text-normal)";
      switch (this.currentListId) {
        case "today":
          reminders = [...overdue, ...await this.reminderManager.getDueToday()];
          break;
        case "scheduled":
          reminders = await this.reminderManager.getScheduled();
          break;
        case "flagged":
          reminders = await this.reminderManager.getFlagged();
          break;
        case "all":
          reminders = all.filter((r) => r.status !== "done");
          break;
        case "completed":
          reminders = all.filter((r) => r.status === "done");
          break;
      }
    } else {
      const list = this.listManager.getById(this.currentListId);
      titleEl.setText((_a = list == null ? void 0 : list.name) != null ? _a : "List");
      titleEl.style.color = "var(--text-normal)";
      reminders = all.filter((r) => r.listId === this.currentListId && r.status !== "done");
    }
    const isCompleted = this.currentListId === "completed";
    const activeCount = isCompleted ? reminders : reminders.filter((r) => r.status !== "done");
    const showSubtitle = (_b = this.plugin.settings.showReminderCountSubtitle) != null ? _b : true;
    if (activeCount.length > 0 && showSubtitle) {
      const subtitle = header.createDiv("chronicle-main-subtitle");
      if (isCompleted) {
        const clearBtn = subtitle.createEl("button", {
          cls: "chronicle-clear-btn",
          text: "Clear all"
        });
        clearBtn.addEventListener("click", async () => {
          const all2 = await this.reminderManager.getAll();
          for (const r of all2.filter((r2) => r2.status === "done")) {
            await this.reminderManager.delete(r.id);
          }
          await this.render();
        });
      } else {
        subtitle.setText(
          `${activeCount.length} ${activeCount.length === 1 ? "reminder" : "reminders"}`
        );
      }
    }
    const listEl = main.createDiv("chronicle-reminder-list");
    if (reminders.length === 0) {
      this.renderEmptyState(listEl);
    } else {
      const groups = this.groupReminders(reminders);
      for (const [group, groupReminders] of Object.entries(groups)) {
        if (groupReminders.length === 0) continue;
        listEl.createDiv("chronicle-group-label").setText(group);
        const card = listEl.createDiv("chronicle-reminder-card-group");
        for (const reminder of groupReminders) {
          this.renderReminderRow(card, reminder);
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
  renderReminderRow(container, reminder) {
    const row = container.createDiv("chronicle-reminder-row");
    const isDone = reminder.status === "done";
    const isArchive = this.currentListId === "completed";
    const checkboxWrap = row.createDiv("chronicle-checkbox-wrap");
    const checkbox = checkboxWrap.createDiv("chronicle-checkbox");
    if (isDone) checkbox.addClass("done");
    checkbox.innerHTML = `<svg class="chronicle-checkmark" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    checkbox.addEventListener("click", async (e) => {
      e.stopPropagation();
      checkbox.addClass("completing");
      setTimeout(async () => {
        await this.reminderManager.update({
          ...reminder,
          status: isDone ? "todo" : "done",
          completedAt: isDone ? void 0 : (/* @__PURE__ */ new Date()).toISOString()
        });
      }, 300);
    });
    const content = row.createDiv("chronicle-reminder-content");
    if (!isArchive) content.addEventListener("click", () => {
      new ReminderDetailPopup(
        this.app,
        reminder,
        this.listManager,
        this.plugin.settings.timeFormat,
        () => this.openReminderForm(reminder)
      ).open();
    });
    const titleEl = content.createDiv("chronicle-reminder-title");
    titleEl.setText(reminder.title);
    if (isDone) titleEl.addClass("done");
    const today = todayStr();
    const metaRow = content.createDiv("chronicle-reminder-meta");
    if (isArchive && reminder.completedAt) {
      const completedDate = new Date(reminder.completedAt);
      metaRow.createSpan("chronicle-reminder-date").setText(
        "Completed " + completedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      );
    } else if (reminder.dueDate || reminder.listId) {
      if (reminder.dueDate) {
        const metaDate = metaRow.createSpan("chronicle-reminder-date");
        metaDate.setText(formatDateRelative(reminder.dueDate));
        if (reminder.dueDate < today) metaDate.addClass("overdue");
      }
      if (reminder.listId) {
        const list = this.listManager.getById(reminder.listId);
        if (list) {
          const listDot = metaRow.createSpan("chronicle-reminder-cal-dot");
          listDot.style.backgroundColor = list.color;
          metaRow.createSpan("chronicle-reminder-cal-name").setText(list.name);
        }
      }
    }
    if (!isArchive && reminder.priority === "high") {
      row.createDiv("chronicle-flag").setText("\u2691");
    }
    if (isArchive) {
      const actions = row.createDiv("chronicle-archive-actions");
      const restoreBtn = actions.createEl("button", { cls: "chronicle-archive-btn", text: "Restore" });
      restoreBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.reminderManager.update({ ...reminder, status: "todo", completedAt: void 0 });
      });
      const deleteBtn = actions.createEl("button", { cls: "chronicle-archive-btn chronicle-archive-btn-delete", text: "Delete" });
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.reminderManager.delete(reminder.id);
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
      editItem.setText("Edit reminder");
      editItem.addEventListener("click", () => {
        menu.remove();
        this.openReminderForm(reminder);
      });
      const deleteItem = menu.createDiv("chronicle-context-item chronicle-context-delete");
      deleteItem.setText("Delete reminder");
      deleteItem.addEventListener("click", async () => {
        menu.remove();
        await this.reminderManager.delete(reminder.id);
      });
      const cancelItem = menu.createDiv("chronicle-context-item");
      cancelItem.setText("Cancel");
      cancelItem.addEventListener("click", () => menu.remove());
      document.body.appendChild(menu);
      setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
    });
  }
  groupReminders(reminders) {
    var _a, _b;
    const today = todayStr();
    const nextWeek = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().split("T")[0];
    if (this.currentListId === "completed") {
      const groups2 = { "Today": [], "This week": [], "Earlier": [] };
      for (const reminder of reminders) {
        const d = (_b = (_a = reminder.completedAt) == null ? void 0 : _a.split("T")[0]) != null ? _b : "";
        if (d === today) groups2["Today"].push(reminder);
        else if (d >= weekAgo) groups2["This week"].push(reminder);
        else groups2["Earlier"].push(reminder);
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
    for (const reminder of reminders) {
      if (reminder.status === "done") continue;
      if (!reminder.dueDate) {
        groups["No date"].push(reminder);
        continue;
      }
      if (reminder.dueDate < today) {
        groups["Overdue"].push(reminder);
        continue;
      }
      if (reminder.dueDate === today) {
        groups["Today"].push(reminder);
        continue;
      }
      if (reminder.dueDate <= nextWeek) {
        groups["This week"].push(reminder);
        continue;
      }
      groups["Later"].push(reminder);
    }
    return groups;
  }
  async openReminderForm(reminder) {
    new ReminderModal(
      this.app,
      this.reminderManager,
      this.listManager,
      reminder,
      void 0,
      (r) => this.openReminderFullPage(r),
      this.plugin
    ).open();
  }
  async openReminderFullPage(reminder) {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(REMINDER_FORM_VIEW_TYPE)[0];
    if (existing) existing.detach();
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: REMINDER_FORM_VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const formLeaf = workspace.getLeavesOfType(REMINDER_FORM_VIEW_TYPE)[0];
    const formView = formLeaf == null ? void 0 : formLeaf.view;
    if (formView && reminder) formView.loadReminder(reminder);
  }
};

// src/views/CalendarView.ts
var import_obsidian11 = require("obsidian");

// src/ui/EventModal.ts
var import_obsidian9 = require("obsidian");
var EventModal = class extends import_obsidian9.Modal {
  constructor(app, eventManager, calendarManager, reminderManager, editingEvent, onSave, onExpand) {
    super(app);
    this.eventManager = eventManager;
    this.calendarManager = calendarManager;
    this.reminderManager = reminderManager;
    this.editingEvent = editingEvent != null ? editingEvent : null;
    this.onSave = onSave;
    this.onExpand = onExpand;
  }
  async onOpen() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("chronicle-event-modal");
    const e = this.editingEvent;
    const calendars = this.calendarManager.getAll();
    const allReminders = await this.reminderManager.getAll();
    let linkedIds = [...(_a = e == null ? void 0 : e.linkedReminderIds) != null ? _a : []];
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
    for (const rec of RECURRENCE_OPTIONS) {
      const opt = recSelect.createEl("option", { value: rec.value, text: rec.label });
      if ((e == null ? void 0 : e.recurrence) === rec.value) opt.selected = true;
    }
    const alertSelect = this.field(form, "Alert").createEl("select", { cls: "cf-select" });
    for (const a of ALERT_OPTIONS) {
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
    const tagField = buildTagField(this.app, this.field(form, "Tags"), (_i = e == null ? void 0 : e.tags) != null ? _i : []);
    const linkedField = this.field(form, "Linked reminders");
    const linkedList = linkedField.createDiv("ctl-list");
    const renderLinkedList = () => {
      linkedList.empty();
      const items = allReminders.filter((r) => linkedIds.includes(r.id));
      if (items.length === 0) {
        linkedList.createDiv("ctl-empty").setText("No linked reminders");
      }
      for (const reminder of items) {
        const row = linkedList.createDiv("ctl-item");
        row.createSpan({ cls: `ctl-status ctl-status-${reminder.status}` });
        row.createSpan({ cls: "ctl-title" }).setText(reminder.title);
        const unlinkBtn = row.createEl("button", { cls: "ctl-unlink", text: "\xD7" });
        unlinkBtn.addEventListener("click", () => {
          linkedIds = linkedIds.filter((id) => id !== reminder.id);
          renderLinkedList();
        });
      }
    };
    renderLinkedList();
    const searchWrap = linkedField.createDiv("ctl-search-wrap");
    const searchInput = searchWrap.createEl("input", {
      type: "text",
      cls: "cf-input ctl-search",
      placeholder: "Search reminders to link\u2026"
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
      const matches = allReminders.filter((r) => !linkedIds.includes(r.id) && r.title.toLowerCase().includes(q)).slice(0, 6);
      if (matches.length === 0) {
        closeSearch();
        return;
      }
      searchResults.style.display = "";
      for (const reminder of matches) {
        const item = searchResults.createDiv("ctl-result-item");
        item.createSpan({ cls: `ctl-status ctl-status-${reminder.status}` });
        item.createSpan({ cls: "ctl-result-title" }).setText(reminder.title);
        item.addEventListener("mousedown", (ev) => {
          ev.preventDefault();
          linkedIds.push(reminder.id);
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
        tags: tagField.getTags(),
        notes: e == null ? void 0 : e.notes,
        linkedNotes: (_a2 = e == null ? void 0 : e.linkedNotes) != null ? _a2 : [],
        linkedReminderIds: linkedIds,
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
var import_obsidian10 = require("obsidian");
var EventDetailPopup = class extends import_obsidian10.Modal {
  constructor(app, event, calendarManager, reminderManager, timeFormat, onEdit) {
    super(app);
    this.event = event;
    this.calendarManager = calendarManager;
    this.reminderManager = reminderManager;
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
    if (ev.recurrence) this.row(body, "Repeat", formatRecurrence(ev.recurrence));
    if (ev.alert && ev.alert !== "none") this.row(body, "Alert", formatAlert(ev.alert));
    if (ev.tags && ev.tags.length > 0) this.row(body, "Tags", ev.tags.join(", "));
    if (ev.linkedNotes && ev.linkedNotes.length > 0)
      this.row(body, "Linked notes", ev.linkedNotes.join(", "));
    if (ev.linkedReminderIds && ev.linkedReminderIds.length > 0) {
      const allReminders = await this.reminderManager.getAll();
      const linked = allReminders.filter((r) => ev.linkedReminderIds.includes(r.id));
      if (linked.length > 0) {
        const remindersRow = body.createDiv("cdp-row cdp-linked-reminders-row");
        remindersRow.createDiv("cdp-row-label").setText("Reminders");
        const list = remindersRow.createDiv("cdp-row-value cdp-reminder-list");
        for (const reminder of linked) {
          const item = list.createDiv("cdp-reminder-item");
          item.createSpan({ cls: `ctl-status ctl-status-${reminder.status}` });
          item.createSpan({ cls: "cdp-reminder-title" }).setText(reminder.title);
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
    const startDate = formatDateFull(ev.startDate);
    const endDate = formatDateFull(ev.endDate);
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

// src/views/CalendarView.ts
var CALENDAR_VIEW_TYPE = "chronicle-calendar-view";
var HOUR_HEIGHT = 56;
var CalendarView = class extends import_obsidian11.ItemView {
  constructor(leaf, eventManager, reminderManager, calendarManager, plugin) {
    super(leaf);
    this.currentDate = /* @__PURE__ */ new Date();
    this.mode = "week";
    this._modeSet = false;
    this._renderVersion = 0;
    this.eventManager = eventManager;
    this.reminderManager = reminderManager;
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
        const inTasks = file.path.startsWith(this.reminderManager["remindersFolder"]);
        if (inEvents || inTasks) this.render();
      })
    );
    this.registerEvent(
      this.app.workspace.on("chronicle:settings-changed", () => this.render())
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
        const inTasks = file.path.startsWith(this.reminderManager["remindersFolder"]);
        if (inEvents || inTasks) setTimeout(() => this.render(), 200);
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
        const inTasks = file.path.startsWith(this.reminderManager["remindersFolder"]);
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
    const reminders = await this.reminderManager.getAll();
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
    if (this.mode === "year") this.renderYearView(main, events, reminders);
    else if (this.mode === "month") this.renderMonthView(main, events, reminders);
    else if (this.mode === "week") this.renderWeekView(main, events, reminders);
    else this.renderDayView(main, events, reminders);
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
        this.reminderManager,
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
    const todayStr2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    for (const d of ["S", "M", "T", "W", "T", "F", "S"])
      grid.createDiv("chronicle-mini-day-name").setText(d);
    for (let i = 0; i < firstDay; i++)
      grid.createDiv("chronicle-mini-day chronicle-mini-day-empty");
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEl = grid.createDiv("chronicle-mini-day");
      dayEl.setText(String(d));
      if (dateStr === todayStr2) dayEl.addClass("today");
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
  renderYearView(main, events, reminders) {
    const year = this.currentDate.getFullYear();
    const todayStr2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
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
        const hasTask = reminders.some((t) => t.dueDate === dateStr && t.status !== "done");
        const dayEl = miniGrid.createDiv("chronicle-year-day");
        dayEl.setText(String(d));
        if (dateStr === todayStr2) dayEl.addClass("today");
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
  renderMonthView(main, events, reminders) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const todayStr2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
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
      if (dateStr === todayStr2) cell.addClass("today");
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
          new EventDetailPopup(this.app, event, this.calendarManager, this.reminderManager, this.plugin.settings.timeFormat, () => new EventModal(this.app, this.eventManager, this.calendarManager, this.reminderManager, event, () => this.render(), (ev) => this.openEventFullPage(ev)).open()).open();
        });
      });
      reminders.filter((t) => t.dueDate === dateStr && t.status !== "done").slice(0, 2).forEach((task) => {
        const pill = cell.createDiv("chronicle-month-event-pill");
        pill.addClass("chronicle-task-pill");
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
  renderWeekView(main, events, reminders) {
    const weekStart = this.getWeekStart();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
    const todayStr2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const calGrid = main.createDiv("chronicle-week-grid");
    const timeCol = calGrid.createDiv("chronicle-time-col");
    timeCol.createDiv("chronicle-time-col-header");
    const shelfSpacer = timeCol.createDiv("chronicle-time-col-shelf-spacer");
    shelfSpacer.setText("all-day");
    for (let h = 0; h < 24; h++)
      timeCol.createDiv("chronicle-time-slot").setText(formatHour12(h));
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
      if (dateStr === todayStr2) dayNum.addClass("today");
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
      reminders.filter((t) => t.dueDate === dateStr && t.status !== "done").forEach((task) => {
        const top = task.dueTime ? (() => {
          const [h, m] = task.dueTime.split(":").map(Number);
          return (h + m / 60) * HOUR_HEIGHT;
        })() : 0;
        const pill = timeGrid.createDiv("chronicle-task-day-pill");
        pill.style.top = `${top}px`;
        pill.addClass("chronicle-task-pill");
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
  renderDayView(main, events, reminders) {
    const dateStr = this.currentDate.toISOString().split("T")[0];
    const todayStr2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const allDayEvents = events.filter((e) => e.startDate === dateStr && e.allDay && this.isCalendarVisible(e.calendarId));
    const dayView = main.createDiv("chronicle-day-view");
    const dayHeader = dayView.createDiv("chronicle-day-view-header");
    dayHeader.createDiv("chronicle-day-name-large").setText(
      this.currentDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()
    );
    const numEl = dayHeader.createDiv("chronicle-day-num-large");
    numEl.setText(String(this.currentDate.getDate()));
    if (dateStr === todayStr2) numEl.addClass("today");
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
      timeLabels.createDiv("chronicle-time-slot").setText(formatHour12(h));
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
    reminders.filter((t) => t.dueDate === dateStr && t.status !== "done").forEach((task) => {
      const top = task.dueTime ? (() => {
        const [h, m] = task.dueTime.split(":").map(Number);
        return (h + m / 60) * HOUR_HEIGHT;
      })() : 0;
      const pill = eventCol.createDiv("chronicle-task-day-pill");
      pill.style.top = `${top}px`;
      pill.addClass("chronicle-task-pill");
      pill.setText("\u2713 " + task.title);
    });
    if (dateStr === todayStr2) {
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
      linkedReminderIds: [],
      completedInstances: [],
      createdAt: ""
    };
    new EventModal(
      this.app,
      this.eventManager,
      this.calendarManager,
      this.reminderManager,
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
      new EventModal(this.app, this.eventManager, this.calendarManager, this.reminderManager, event, () => this.render(), (e) => this.openEventFullPage(e)).open();
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
      pill.createDiv("chronicle-event-pill-time").setText(formatTime12(event.startTime));
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      new EventDetailPopup(this.app, event, this.calendarManager, this.reminderManager, this.plugin.settings.timeFormat, () => new EventModal(this.app, this.eventManager, this.calendarManager, this.reminderManager, event, () => this.render(), (ev) => this.openEventFullPage(ev)).open()).open();
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
      () => new EventDetailPopup(this.app, event, this.calendarManager, this.reminderManager, this.plugin.settings.timeFormat, () => new EventModal(this.app, this.eventManager, this.calendarManager, this.reminderManager, event, () => this.render(), (ev) => this.openEventFullPage(ev)).open()).open()
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
};

// src/main.ts
var ChroniclePlugin = class extends import_obsidian12.Plugin {
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
    this.reminderManager = new ReminderManager(this.app, this.settings.remindersFolder);
    this.eventManager = new EventManager(this.app, this.settings.eventsFolder);
    this.alertManager = new AlertManager(
      this.app,
      this.reminderManager,
      this.eventManager,
      () => this.settings
    );
    this.alertManager.start();
    this.registerView(
      REMINDER_VIEW_TYPE,
      (leaf) => new ReminderView(leaf, this.reminderManager, this.listManager, this)
    );
    this.registerView(
      REMINDER_FORM_VIEW_TYPE,
      (leaf) => new ReminderFormView(leaf, this.reminderManager, this.listManager)
    );
    this.registerView(
      CALENDAR_VIEW_TYPE,
      (leaf) => new CalendarView(leaf, this.eventManager, this.reminderManager, this.calendarManager, this)
    );
    this.registerView(
      EVENT_FORM_VIEW_TYPE,
      (leaf) => new EventFormView(leaf, this.eventManager, this.calendarManager, this.reminderManager)
    );
    this.addRibbonIcon("check-circle", "Chronicle Reminders", () => this.activateReminderView());
    this.addRibbonIcon("calendar", "Chronicle Calendar", () => this.activateCalendarView());
    this.addCommand({
      id: "open-chronicle",
      name: "Open reminder dashboard",
      callback: () => this.activateReminderView()
    });
    this.addCommand({
      id: "open-calendar",
      name: "Open calendar",
      callback: () => this.activateCalendarView()
    });
    this.addCommand({
      id: "new-reminder",
      name: "New reminder",
      hotkeys: [{ modifiers: ["Mod"], key: "n" }],
      callback: () => this.openReminderForm()
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
  async activateReminderView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(REMINDER_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: REMINDER_VIEW_TYPE, active: true });
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
  async openReminderForm() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(REMINDER_FORM_VIEW_TYPE)[0];
    if (existing) existing.detach();
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: REMINDER_FORM_VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);
  }
  openEventModal(event) {
    new EventModal(
      this.app,
      this.eventManager,
      this.calendarManager,
      this.reminderManager,
      event,
      void 0,
      (e) => this.openEventFullPage(e)
    ).open();
  }
  onunload() {
    this.alertManager.stop();
    this.app.workspace.detachLeavesOfType(REMINDER_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(REMINDER_FORM_VIEW_TYPE);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3VpL1NldHRpbmdzVGFiLnRzIiwgInNyYy9kYXRhL0NhbGVuZGFyTWFuYWdlci50cyIsICJzcmMvdXRpbHMvY29uc3RhbnRzLnRzIiwgInNyYy9kYXRhL0FsZXJ0TWFuYWdlci50cyIsICJzcmMvdHlwZXMvaW5kZXgudHMiLCAic3JjL3ZpZXdzL0V2ZW50Rm9ybVZpZXcudHMiLCAic3JjL3VpL3RhZ0ZpZWxkLnRzIiwgInNyYy9kYXRhL0xpc3RNYW5hZ2VyLnRzIiwgInNyYy9kYXRhL1JlbWluZGVyTWFuYWdlci50cyIsICJzcmMvZGF0YS9FdmVudE1hbmFnZXIudHMiLCAic3JjL3ZpZXdzL1JlbWluZGVyVmlldy50cyIsICJzcmMvdWkvUmVtaW5kZXJNb2RhbC50cyIsICJzcmMvdWkvUmVtaW5kZXJEZXRhaWxQb3B1cC50cyIsICJzcmMvdXRpbHMvZm9ybWF0dGVycy50cyIsICJzcmMvdmlld3MvUmVtaW5kZXJGb3JtVmlldy50cyIsICJzcmMvdmlld3MvQ2FsZW5kYXJWaWV3LnRzIiwgInNyYy91aS9FdmVudE1vZGFsLnRzIiwgInNyYy91aS9FdmVudERldGFpbFBvcHVwLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBDaHJvbmljbGVTZXR0aW5nc1RhYiB9IGZyb20gXCIuL3VpL1NldHRpbmdzVGFiXCI7XG5pbXBvcnQgeyBBbGVydE1hbmFnZXIgfSBmcm9tIFwiLi9kYXRhL0FsZXJ0TWFuYWdlclwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlU2V0dGluZ3MsIERFRkFVTFRfU0VUVElOR1MsIENocm9uaWNsZUV2ZW50IH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IEV2ZW50Rm9ybVZpZXcsIEVWRU5UX0ZPUk1fVklFV19UWVBFIH0gZnJvbSBcIi4vdmlld3MvRXZlbnRGb3JtVmlld1wiO1xuaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi9kYXRhL0NhbGVuZGFyTWFuYWdlclwiO1xuaW1wb3J0IHsgTGlzdE1hbmFnZXIgfSBmcm9tIFwiLi9kYXRhL0xpc3RNYW5hZ2VyXCI7XG5pbXBvcnQgeyBSZW1pbmRlck1hbmFnZXIgfSBmcm9tIFwiLi9kYXRhL1JlbWluZGVyTWFuYWdlclwiO1xuaW1wb3J0IHsgRXZlbnRNYW5hZ2VyIH0gZnJvbSBcIi4vZGF0YS9FdmVudE1hbmFnZXJcIjtcbmltcG9ydCB7IFJlbWluZGVyVmlldywgUkVNSU5ERVJfVklFV19UWVBFIH0gZnJvbSBcIi4vdmlld3MvUmVtaW5kZXJWaWV3XCI7XG5pbXBvcnQgeyBSZW1pbmRlckZvcm1WaWV3LCBSRU1JTkRFUl9GT1JNX1ZJRVdfVFlQRSB9IGZyb20gXCIuL3ZpZXdzL1JlbWluZGVyRm9ybVZpZXdcIjtcbmltcG9ydCB7IENhbGVuZGFyVmlldywgQ0FMRU5EQVJfVklFV19UWVBFIH0gZnJvbSBcIi4vdmlld3MvQ2FsZW5kYXJWaWV3XCI7XG5pbXBvcnQgeyBFdmVudE1vZGFsIH0gZnJvbSBcIi4vdWkvRXZlbnRNb2RhbFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaHJvbmljbGVQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5nczogQ2hyb25pY2xlU2V0dGluZ3M7XG4gIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyO1xuICBsaXN0TWFuYWdlcjogTGlzdE1hbmFnZXI7XG4gIHJlbWluZGVyTWFuYWdlciE6IFJlbWluZGVyTWFuYWdlcjtcbiAgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXI7XG4gIGFsZXJ0TWFuYWdlcjogQWxlcnRNYW5hZ2VyO1xuXG4gIGFzeW5jIG9ubG9hZCgpIHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBuZXcgQ2FsZW5kYXJNYW5hZ2VyKFxuICAgICAgdGhpcy5zZXR0aW5ncy5jYWxlbmRhcnMsXG4gICAgICAoKSA9PiB0aGlzLnNhdmVTZXR0aW5ncygpXG4gICAgKTtcbiAgICB0aGlzLmxpc3RNYW5hZ2VyID0gbmV3IExpc3RNYW5hZ2VyKFxuICAgICAgdGhpcy5zZXR0aW5ncy5saXN0cyxcbiAgICAgICgpID0+IHRoaXMuc2F2ZVNldHRpbmdzKClcbiAgICApO1xuICAgIHRoaXMucmVtaW5kZXJNYW5hZ2VyID0gbmV3IFJlbWluZGVyTWFuYWdlcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncy5yZW1pbmRlcnNGb2xkZXIpO1xuICAgIHRoaXMuZXZlbnRNYW5hZ2VyICAgID0gbmV3IEV2ZW50TWFuYWdlcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncy5ldmVudHNGb2xkZXIpO1xuXG4gICAgdGhpcy5hbGVydE1hbmFnZXIgPSBuZXcgQWxlcnRNYW5hZ2VyKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLnJlbWluZGVyTWFuYWdlcixcbiAgICAgIHRoaXMuZXZlbnRNYW5hZ2VyLFxuICAgICAgKCkgPT4gdGhpcy5zZXR0aW5nc1xuICAgICk7XG4gICAgdGhpcy5hbGVydE1hbmFnZXIuc3RhcnQoKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KFxuICAgICAgUkVNSU5ERVJfVklFV19UWVBFLFxuICAgICAgKGxlYWYpID0+IG5ldyBSZW1pbmRlclZpZXcobGVhZiwgdGhpcy5yZW1pbmRlck1hbmFnZXIsIHRoaXMubGlzdE1hbmFnZXIsIHRoaXMpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgIFJFTUlOREVSX0ZPUk1fVklFV19UWVBFLFxuICAgICAgKGxlYWYpID0+IG5ldyBSZW1pbmRlckZvcm1WaWV3KGxlYWYsIHRoaXMucmVtaW5kZXJNYW5hZ2VyLCB0aGlzLmxpc3RNYW5hZ2VyKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlclZpZXcoXG4gICAgICBDQUxFTkRBUl9WSUVXX1RZUEUsXG4gICAgICAobGVhZikgPT4gbmV3IENhbGVuZGFyVmlldyhsZWFmLCB0aGlzLmV2ZW50TWFuYWdlciwgdGhpcy5yZW1pbmRlck1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlclZpZXcoXG4gICAgICBFVkVOVF9GT1JNX1ZJRVdfVFlQRSxcbiAgICAgIChsZWFmKSA9PiBuZXcgRXZlbnRGb3JtVmlldyhsZWFmLCB0aGlzLmV2ZW50TWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIsIHRoaXMucmVtaW5kZXJNYW5hZ2VyKVxuICAgICk7XG5cbiAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJjaGVjay1jaXJjbGVcIiwgXCJDaHJvbmljbGUgUmVtaW5kZXJzXCIsICgpID0+IHRoaXMuYWN0aXZhdGVSZW1pbmRlclZpZXcoKSk7XG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwiY2FsZW5kYXJcIiwgXCJDaHJvbmljbGUgQ2FsZW5kYXJcIiwgKCkgPT4gdGhpcy5hY3RpdmF0ZUNhbGVuZGFyVmlldygpKTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvcGVuLWNocm9uaWNsZVwiLFxuICAgICAgbmFtZTogXCJPcGVuIHJlbWluZGVyIGRhc2hib2FyZFwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHRoaXMuYWN0aXZhdGVSZW1pbmRlclZpZXcoKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib3Blbi1jYWxlbmRhclwiLFxuICAgICAgbmFtZTogXCJPcGVuIGNhbGVuZGFyXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5hY3RpdmF0ZUNhbGVuZGFyVmlldygpLFxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJuZXctcmVtaW5kZXJcIixcbiAgICAgIG5hbWU6IFwiTmV3IHJlbWluZGVyXCIsXG4gICAgICBob3RrZXlzOiBbeyBtb2RpZmllcnM6IFtcIk1vZFwiXSwga2V5OiBcIm5cIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm9wZW5SZW1pbmRlckZvcm0oKSxcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibmV3LWV2ZW50XCIsXG4gICAgICBuYW1lOiBcIk5ldyBldmVudFwiLFxuICAgICAgaG90a2V5czogW3sgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSwga2V5OiBcIm5cIiB9XSxcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLm9wZW5FdmVudE1vZGFsKCksXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IENocm9uaWNsZVNldHRpbmdzVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG4gICAgY29uc29sZS5sb2coXCJDaHJvbmljbGUgbG9hZGVkIFx1MjcxM1wiKTtcbiAgfVxuXG4gIGFzeW5jIGFjdGl2YXRlUmVtaW5kZXJWaWV3KCkge1xuICAgIGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcbiAgICBsZXQgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoUkVNSU5ERVJfVklFV19UWVBFKVswXTtcbiAgICBpZiAoIWxlYWYpIHtcbiAgICAgIGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogUkVNSU5ERVJfVklFV19UWVBFLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgfVxuICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICB9XG5cbiAgYXN5bmMgYWN0aXZhdGVDYWxlbmRhclZpZXcoKSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGxldCBsZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShDQUxFTkRBUl9WSUVXX1RZUEUpWzBdO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBDQUxFTkRBUl9WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBhc3luYyBvcGVuUmVtaW5kZXJGb3JtKCkge1xuICAgIGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcbiAgICBjb25zdCBleGlzdGluZyA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoUkVNSU5ERVJfRk9STV9WSUVXX1RZUEUpWzBdO1xuICAgIGlmIChleGlzdGluZykgZXhpc3RpbmcuZGV0YWNoKCk7XG4gICAgY29uc3QgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogUkVNSU5ERVJfRk9STV9WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIG9wZW5FdmVudE1vZGFsKGV2ZW50PzogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBuZXcgRXZlbnRNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy5ldmVudE1hbmFnZXIsXG4gICAgICB0aGlzLmNhbGVuZGFyTWFuYWdlcixcbiAgICAgIHRoaXMucmVtaW5kZXJNYW5hZ2VyLFxuICAgICAgZXZlbnQsXG4gICAgICB1bmRlZmluZWQsXG4gICAgICAoZSkgPT4gdGhpcy5vcGVuRXZlbnRGdWxsUGFnZShlKVxuICAgICkub3BlbigpO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgdGhpcy5hbGVydE1hbmFnZXIuc3RvcCgpO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoUkVNSU5ERVJfVklFV19UWVBFKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFJFTUlOREVSX0ZPUk1fVklFV19UWVBFKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKENBTEVOREFSX1ZJRVdfVFlQRSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICAodGhpcy5hcHAud29ya3NwYWNlIGFzIGFueSkudHJpZ2dlcihcImNocm9uaWNsZTpzZXR0aW5ncy1jaGFuZ2VkXCIpO1xuICB9XG5cbiAgYXN5bmMgb3BlbkV2ZW50RnVsbFBhZ2UoZXZlbnQ/OiBDaHJvbmljbGVFdmVudCkge1xuICAgIGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcbiAgICBjb25zdCBleGlzdGluZyA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoRVZFTlRfRk9STV9WSUVXX1RZUEUpWzBdO1xuICAgIGlmIChleGlzdGluZykgZXhpc3RpbmcuZGV0YWNoKCk7XG4gICAgY29uc3QgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogRVZFTlRfRk9STV9WSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcblxuICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTtcbiAgICBjb25zdCBmb3JtTGVhZiA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoRVZFTlRfRk9STV9WSUVXX1RZUEUpWzBdO1xuICAgIGNvbnN0IGZvcm1WaWV3ID0gZm9ybUxlYWY/LnZpZXcgYXMgRXZlbnRGb3JtVmlldyB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZm9ybVZpZXcgJiYgZXZlbnQpIGZvcm1WaWV3LmxvYWRFdmVudChldmVudCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgQ2hyb25pY2xlUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVDYWxlbmRhciwgQ2hyb25pY2xlTGlzdCwgUmVtaW5kZXJTdGF0dXMsIFJlbWluZGVyUHJpb3JpdHksIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IEFMRVJUX09QVElPTlMsIFNPVU5EX09QVElPTlMgfSBmcm9tIFwiLi4vdXRpbHMvY29uc3RhbnRzXCI7XG5cbmV4cG9ydCBjbGFzcyBDaHJvbmljbGVTZXR0aW5nc1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwcml2YXRlIHBsdWdpbjogQ2hyb25pY2xlUGx1Z2luO1xuICBwcml2YXRlIGFjdGl2ZVRhYjogc3RyaW5nID0gXCJnZW5lcmFsXCI7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogQ2hyb25pY2xlUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuYWRkQ2xhc3MoXCJjaHJvbmljbGUtc2V0dGluZ3NcIik7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgVGFiIGJhciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB0YWJCYXIgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFiLWJhclwiKTtcbiAgICBjb25zdCB0YWJzID0gW1xuICAgICAgeyBpZDogXCJnZW5lcmFsXCIsICAgIGxhYmVsOiBcIkdlbmVyYWxcIiB9LFxuICAgICAgeyBpZDogXCJjYWxlbmRhclwiLCAgIGxhYmVsOiBcIkNhbGVuZGFyXCIgfSxcbiAgICAgIHsgaWQ6IFwicmVtaW5kZXJzXCIsICBsYWJlbDogXCJSZW1pbmRlcnNcIiB9LFxuICAgICAgeyBpZDogXCJhcHBlYXJhbmNlXCIsIGxhYmVsOiBcIkFwcGVhcmFuY2VcIiB9LFxuICAgIF07XG5cbiAgICBmb3IgKGNvbnN0IHRhYiBvZiB0YWJzKSB7XG4gICAgICBjb25zdCB0YWJFbCA9IHRhYkJhci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFiXCIpO1xuICAgICAgdGFiRWwuc2V0VGV4dCh0YWIubGFiZWwpO1xuICAgICAgaWYgKHRoaXMuYWN0aXZlVGFiID09PSB0YWIuaWQpIHRhYkVsLmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgdGFiRWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5hY3RpdmVUYWIgPSB0YWIuaWQ7XG4gICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFRhYiBjb250ZW50IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGNvbnRlbnQgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGFiLWNvbnRlbnRcIik7XG5cbiAgICBzd2l0Y2ggKHRoaXMuYWN0aXZlVGFiKSB7XG4gICAgICBjYXNlIFwiZ2VuZXJhbFwiOiAgICB0aGlzLnJlbmRlckdlbmVyYWwoY29udGVudCk7ICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImNhbGVuZGFyXCI6ICAgdGhpcy5yZW5kZXJDYWxlbmRhcihjb250ZW50KTsgICBicmVhaztcbiAgICAgIGNhc2UgXCJyZW1pbmRlcnNcIjogIHRoaXMucmVuZGVyUmVtaW5kZXJzKGNvbnRlbnQpOyAgYnJlYWs7XG4gICAgICBjYXNlIFwiYXBwZWFyYW5jZVwiOiB0aGlzLnJlbmRlckFwcGVhcmFuY2UoY29udGVudCk7IGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBHZW5lcmFsIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyR2VuZXJhbChlbDogSFRNTEVsZW1lbnQpIHtcbiAgICB0aGlzLnN1YkhlYWRlcihlbCwgXCJTdG9yYWdlXCIpO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIlJlbWluZGVycyBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiV2hlcmUgcmVtaW5kZXIgbm90ZXMgYXJlIHN0b3JlZCBpbiB5b3VyIHZhdWx0LlwiKVxuICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XG4gICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIkNocm9uaWNsZS9SZW1pbmRlcnNcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnJlbWluZGVyc0ZvbGRlcilcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlbWluZGVyc0ZvbGRlciA9IHZhbHVlIHx8IFwiQ2hyb25pY2xlL1JlbWluZGVyc1wiO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJFdmVudHMgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIldoZXJlIGV2ZW50IG5vdGVzIGFyZSBzdG9yZWQgaW4geW91ciB2YXVsdC5cIilcbiAgICAgIC5hZGRUZXh0KHRleHQgPT4gdGV4dFxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJDaHJvbmljbGUvRXZlbnRzXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5ldmVudHNGb2xkZXIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ldmVudHNGb2xkZXIgPSB2YWx1ZSB8fCBcIkNocm9uaWNsZS9FdmVudHNcIjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiVGltZSBmb3JtYXRcIilcbiAgICAgIC5zZXREZXNjKFwiSG93IHRpbWVzIGFyZSBkaXNwbGF5ZWQgdGhyb3VnaG91dCBDaHJvbmljbGUuXCIpXG4gICAgICAuYWRkRHJvcGRvd24oZHJvcCA9PiBkcm9wXG4gICAgICAgIC5hZGRPcHRpb24oXCIxMmhcIiwgXCIxMi1ob3VyICgyOjMwIFBNKVwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiMjRoXCIsIFwiMjQtaG91ciAoMTQ6MzApXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy50aW1lRm9ybWF0KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MudGltZUZvcm1hdCA9IHZhbHVlIGFzIFwiMTJoXCIgfCBcIjI0aFwiO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIHRoaXMuZGl2aWRlcihlbCk7XG4gICAgdGhpcy5zdWJIZWFkZXIoZWwsIFwiTm90aWZpY2F0aW9uc1wiKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IG5vdGlmaWNhdGlvbnNcIilcbiAgICAgIC5zZXREZXNjKFwiU2hvdyBhIG1hY09TIG5vdGlmaWNhdGlvbiBiYW5uZXIgKHZpYSBPYnNpZGlhbikgd2hlbiBhbiBhbGVydCBmaXJlcy5cIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3RpZk1hY09TID8/IHRydWUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3RpZk1hY09TID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIlNvdW5kXCIpXG4gICAgICAuc2V0RGVzYyhcIlBsYXkgYSBjaGltZSB3aGVuIGFuIGFsZXJ0IGZpcmVzLlwiKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+IHRcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGlmU291bmQgPz8gdHJ1ZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGlmU291bmQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiQWxlcnQgZm9yIGV2ZW50c1wiKVxuICAgICAgLnNldERlc2MoXCJFbmFibGUgYWxlcnRzIGZvciBjYWxlbmRhciBldmVudHMuXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90aWZFdmVudHMgPz8gdHJ1ZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGlmRXZlbnRzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkFsZXJ0IGZvciByZW1pbmRlcnNcIilcbiAgICAgIC5zZXREZXNjKFwiRW5hYmxlIGFsZXJ0cyBmb3IgcmVtaW5kZXJzIHdpdGggYSBkdWUgdGltZS5cIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub3RpZlJlbWluZGVycyA/PyB0cnVlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm90aWZSZW1pbmRlcnMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiVGVzdCByZW1pbmRlciBub3RpZmljYXRpb25cIilcbiAgICAgIC5zZXREZXNjKFwiRmlyZXMgYSB0ZXN0IHJlbWluZGVyIGFsZXJ0IHVzaW5nIHlvdXIgY3VycmVudCBzZXR0aW5ncy5cIilcbiAgICAgIC5hZGRCdXR0b24oYnRuID0+IGJ0blxuICAgICAgICAuc2V0QnV0dG9uVGV4dChcIlRlc3QgcmVtaW5kZXJcIilcbiAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLmFsZXJ0TWFuYWdlci5maXJlKFxuICAgICAgICAgICAgXCJzZXR0aW5ncy10ZXN0LXJlbWluZGVyXCIsXG4gICAgICAgICAgICBcIkNocm9uaWNsZSB0ZXN0XCIsXG4gICAgICAgICAgICBcIllvdXIgcmVtaW5kZXIgbm90aWZpY2F0aW9ucyBhcmUgd29ya2luZy5cIixcbiAgICAgICAgICAgIFwicmVtaW5kZXJcIlxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uYWxlcnRNYW5hZ2VyW1wiZmlyZWRBbGVydHNcIl0uZGVsZXRlKFwic2V0dGluZ3MtdGVzdC1yZW1pbmRlclwiKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiVGVzdCBldmVudCBub3RpZmljYXRpb25cIilcbiAgICAgIC5zZXREZXNjKFwiRmlyZXMgYSB0ZXN0IGV2ZW50IGFsZXJ0IHVzaW5nIHlvdXIgY3VycmVudCBzZXR0aW5ncy5cIilcbiAgICAgIC5hZGRCdXR0b24oYnRuID0+IGJ0blxuICAgICAgICAuc2V0QnV0dG9uVGV4dChcIlRlc3QgZXZlbnRcIilcbiAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLmFsZXJ0TWFuYWdlci5maXJlKFxuICAgICAgICAgICAgXCJzZXR0aW5ncy10ZXN0LWV2ZW50XCIsXG4gICAgICAgICAgICBcIkNocm9uaWNsZSB0ZXN0XCIsXG4gICAgICAgICAgICBcIllvdXIgZXZlbnQgbm90aWZpY2F0aW9ucyBhcmUgd29ya2luZy5cIixcbiAgICAgICAgICAgIFwiZXZlbnRcIlxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uYWxlcnRNYW5hZ2VyW1wiZmlyZWRBbGVydHNcIl0uZGVsZXRlKFwic2V0dGluZ3MtdGVzdC1ldmVudFwiKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgQ2FsZW5kYXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSByZW5kZXJDYWxlbmRhcihlbDogSFRNTEVsZW1lbnQpIHtcbiAgICB0aGlzLnN1YkhlYWRlcihlbCwgXCJDYWxlbmRhciBkZWZhdWx0c1wiKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJTdGFydCBvZiB3ZWVrXCIpXG4gICAgICAuc2V0RGVzYyhcIldoaWNoIGRheSB0aGUgY2FsZW5kYXIgd2VlayBzdGFydHMgb24uXCIpXG4gICAgICAuYWRkRHJvcGRvd24oZHJvcCA9PiBkcm9wXG4gICAgICAgIC5hZGRPcHRpb24oXCIwXCIsIFwiU3VuZGF5XCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCIxXCIsIFwiTW9uZGF5XCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCI2XCIsIFwiU2F0dXJkYXlcIilcbiAgICAgICAgLnNldFZhbHVlKFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdGFydE9mV2VlaykpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdGFydE9mV2VlayA9IHBhcnNlSW50KHZhbHVlKSBhcyAwIHwgMSB8IDY7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgdmlld1wiKVxuICAgICAgLnNldERlc2MoXCJXaGljaCB2aWV3IG9wZW5zIHdoZW4geW91IGxhdW5jaCB0aGUgY2FsZW5kYXIuXCIpXG4gICAgICAuYWRkRHJvcGRvd24oZHJvcCA9PiBkcm9wXG4gICAgICAgIC5hZGRPcHRpb24oXCJkYXlcIiwgICBcIkRheVwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwid2Vla1wiLCAgXCJXZWVrXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJtb250aFwiLCBcIk1vbnRoXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJ5ZWFyXCIsICBcIlllYXJcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRDYWxlbmRhclZpZXcpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Q2FsZW5kYXJWaWV3ID0gdmFsdWUgYXMgXCJkYXlcInxcIndlZWtcInxcIm1vbnRoXCJ8XCJ5ZWFyXCI7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgY2FsZW5kYXJcIilcbiAgICAgIC5zZXREZXNjKFwiQ2FsZW5kYXIgYXNzaWduZWQgdG8gbmV3IGV2ZW50cyBieSBkZWZhdWx0LlwiKVxuICAgICAgLmFkZERyb3Bkb3duKGRyb3AgPT4ge1xuICAgICAgICBkcm9wLmFkZE9wdGlvbihcIlwiLCBcIk5vbmVcIik7XG4gICAgICAgIGZvciAoY29uc3QgY2FsIG9mIHRoaXMucGx1Z2luLmNhbGVuZGFyTWFuYWdlci5nZXRBbGwoKSkge1xuICAgICAgICAgIGRyb3AuYWRkT3B0aW9uKGNhbC5pZCwgY2FsLm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGRyb3Auc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdENhbGVuZGFySWQgPz8gXCJcIik7XG4gICAgICAgIGRyb3Aub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdENhbGVuZGFySWQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJEZWZhdWx0IGV2ZW50IGR1cmF0aW9uXCIpXG4gICAgICAuc2V0RGVzYyhcIkhvdyBsb25nIG5ldyBldmVudHMgbGFzdCBieSBkZWZhdWx0IChtaW51dGVzKS5cIilcbiAgICAgIC5hZGRTbGlkZXIoc2xpZGVyID0+IHNsaWRlclxuICAgICAgICAuc2V0TGltaXRzKDE1LCA0ODAsIDE1KVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdEV2ZW50RHVyYXRpb24gPz8gNjApXG4gICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0RXZlbnREdXJhdGlvbiA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJEZWZhdWx0IGV2ZW50IGFsZXJ0XCIpXG4gICAgICAuc2V0RGVzYyhcIkFsZXJ0IG9mZnNldCBhcHBsaWVkIHRvIG5ldyBldmVudHMgYnkgZGVmYXVsdC5cIilcbiAgICAgIC5hZGREcm9wZG93bihkcm9wID0+IHRoaXMuYWRkQWxlcnRPcHRpb25zKGRyb3ApXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0QWxlcnQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRBbGVydCA9IHZhbHVlIGFzIEFsZXJ0T2Zmc2V0O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJFdmVudCBub3RpZmljYXRpb24gc291bmRcIilcbiAgICAgIC5zZXREZXNjKFwibWFjT1Mgc3lzdGVtIHNvdW5kIHBsYXllZCB3aGVuIGFuIGV2ZW50IGFsZXJ0IGZpcmVzLlwiKVxuICAgICAgLmFkZERyb3Bkb3duKGRyb3AgPT4gdGhpcy5hZGRTb3VuZE9wdGlvbnMoZHJvcClcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGlmU291bmRFdmVudCA/PyBcIkdsYXNzXCIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGlmU291bmRFdmVudCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIHRoaXMuZGl2aWRlcihlbCk7XG4gICAgdGhpcy5zdWJIZWFkZXIoZWwsIFwiTXkgQ2FsZW5kYXJzXCIpO1xuICAgIGVsLmNyZWF0ZURpdihcImNzLWRlc2NcIikuc2V0VGV4dChcIkFkZCwgcmVuYW1lLCByZWNvbG9yLCBvciBkZWxldGUgY2FsZW5kYXJzLlwiKTtcblxuICAgIGZvciAoY29uc3QgY2FsIG9mIHRoaXMucGx1Z2luLmNhbGVuZGFyTWFuYWdlci5nZXRBbGwoKSkge1xuICAgICAgdGhpcy5yZW5kZXJDYWxlbmRhclJvdyhlbCwgY2FsLCB0aGlzLnBsdWdpbi5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCkubGVuZ3RoID09PSAxKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpdmlkZXIoZWwpO1xuXG4gICAgY29uc3QgYWRkUm93ID0gZWwuY3JlYXRlRGl2KFwiY3MtYWRkLXJvd1wiKTtcbiAgICBjb25zdCBuYW1lSW5wdXQgPSBhZGRSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIGNsczogXCJjcy10ZXh0LWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJOZXcgY2FsZW5kYXIgbmFtZVwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY29sb3JTZWxlY3QgPSBhZGRSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY29sb3JcIiwgY2xzOiBcImNzLWNvbG9yLXBpY2tlclwiIH0pO1xuICAgIGNvbG9yU2VsZWN0LnZhbHVlID0gXCIjMzc4QUREXCI7XG5cbiAgICBjb25zdCBhZGRCdG4gPSBhZGRSb3cuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY3MtYnRuLXByaW1hcnlcIiwgdGV4dDogXCJBZGQgY2FsZW5kYXJcIiB9KTtcbiAgICBhZGRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBuYW1lSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCFuYW1lKSB7IG5hbWVJbnB1dC5mb2N1cygpOyByZXR1cm47IH1cbiAgICAgIHRoaXMucGx1Z2luLmNhbGVuZGFyTWFuYWdlci5jcmVhdGUobmFtZSwgY29sb3JTZWxlY3QudmFsdWUpO1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICBuZXcgTm90aWNlKGBDYWxlbmRhciBcIiR7bmFtZX1cIiBjcmVhdGVkYCk7XG4gICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyQ2FsZW5kYXJSb3coZWw6IEhUTUxFbGVtZW50LCBjYWw6IENocm9uaWNsZUNhbGVuZGFyLCBpc09ubHk6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBzZXR0aW5nID0gbmV3IFNldHRpbmcoZWwpO1xuXG4gICAgc2V0dGluZy5uYW1lRWwuY3JlYXRlU3Bhbih7IHRleHQ6IGNhbC5uYW1lIH0pO1xuXG4gICAgc2V0dGluZ1xuICAgICAgLmFkZENvbG9yUGlja2VyKHBpY2tlciA9PiB7XG4gICAgICAgIC8vIENvbnZlcnQgbmFtZWQgY29sb3JzIHRvIGhleCBmb3IgdGhlIHBpY2tlclxuICAgICAgICBwaWNrZXIuc2V0VmFsdWUoQ2FsZW5kYXJNYW5hZ2VyLmNvbG9yVG9IZXgoY2FsLmNvbG9yKSk7XG4gICAgICAgIHBpY2tlci5vbkNoYW5nZShhc3luYyAoaGV4KSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uY2FsZW5kYXJNYW5hZ2VyLnVwZGF0ZShjYWwuaWQsIHsgY29sb3I6IGhleCB9KTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XG4gICAgICAgIC5zZXRWYWx1ZShjYWwubmFtZSlcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiQ2FsZW5kYXIgbmFtZVwiKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHJldHVybjtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5jYWxlbmRhck1hbmFnZXIudXBkYXRlKGNhbC5pZCwgeyBuYW1lOiB2YWx1ZS50cmltKCkgfSk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKHRvZ2dsZSA9PiB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKGNhbC5pc1Zpc2libGUpXG4gICAgICAgIC5zZXRUb29sdGlwKFwiU2hvdyBpbiB2aWV3c1wiKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uY2FsZW5kYXJNYW5hZ2VyLnVwZGF0ZShjYWwuaWQsIHsgaXNWaXNpYmxlOiB2YWx1ZSB9KTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oYnRuID0+IGJ0blxuICAgICAgICAuc2V0SWNvbihcInRyYXNoXCIpXG4gICAgICAgIC5zZXRUb29sdGlwKFwiRGVsZXRlIGNhbGVuZGFyXCIpXG4gICAgICAgIC5zZXREaXNhYmxlZChpc09ubHkpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5jYWxlbmRhck1hbmFnZXIuZGVsZXRlKGNhbC5pZCk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgbmV3IE5vdGljZShgQ2FsZW5kYXIgXCIke2NhbC5uYW1lfVwiIGRlbGV0ZWRgKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckxpc3RSb3coZWw6IEhUTUxFbGVtZW50LCBsaXN0OiBDaHJvbmljbGVMaXN0LCBpc09ubHk6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBzZXR0aW5nID0gbmV3IFNldHRpbmcoZWwpO1xuXG4gICAgc2V0dGluZy5uYW1lRWwuY3JlYXRlU3Bhbih7IHRleHQ6IGxpc3QubmFtZSB9KTtcblxuICAgIHNldHRpbmdcbiAgICAgIC5hZGRDb2xvclBpY2tlcihwaWNrZXIgPT4ge1xuICAgICAgICBwaWNrZXIuc2V0VmFsdWUobGlzdC5jb2xvcik7XG4gICAgICAgIHBpY2tlci5vbkNoYW5nZShhc3luYyAoaGV4KSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4ubGlzdE1hbmFnZXIudXBkYXRlKGxpc3QuaWQsIHsgY29sb3I6IGhleCB9KTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XG4gICAgICAgIC5zZXRWYWx1ZShsaXN0Lm5hbWUpXG4gICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIkxpc3QgbmFtZVwiKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgaWYgKCF2YWx1ZS50cmltKCkpIHJldHVybjtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5saXN0TWFuYWdlci51cGRhdGUobGlzdC5pZCwgeyBuYW1lOiB2YWx1ZS50cmltKCkgfSk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKGJ0biA9PiBidG5cbiAgICAgICAgLnNldEljb24oXCJ0cmFzaFwiKVxuICAgICAgICAuc2V0VG9vbHRpcChcIkRlbGV0ZSBsaXN0XCIpXG4gICAgICAgIC5zZXREaXNhYmxlZChpc09ubHkpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5saXN0TWFuYWdlci5kZWxldGUobGlzdC5pZCk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgbmV3IE5vdGljZShgTGlzdCBcIiR7bGlzdC5uYW1lfVwiIGRlbGV0ZWRgKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgUmVtaW5kZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyUmVtaW5kZXJzKGVsOiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMuc3ViSGVhZGVyKGVsLCBcIlJlbWluZGVyIGRlZmF1bHRzXCIpO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgc3RhdHVzXCIpXG4gICAgICAuYWRkRHJvcGRvd24oZHJvcCA9PiBkcm9wXG4gICAgICAgIC5hZGRPcHRpb24oXCJ0b2RvXCIsICAgICAgICBcIlRvIGRvXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJpbi1wcm9ncmVzc1wiLCBcIkluIHByb2dyZXNzXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJkb25lXCIsICAgICAgICBcIkRvbmVcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImNhbmNlbGxlZFwiLCAgIFwiQ2FuY2VsbGVkXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0UmVtaW5kZXJTdGF0dXMpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0UmVtaW5kZXJTdGF0dXMgPSB2YWx1ZSBhcyBSZW1pbmRlclN0YXR1cztcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCBwcmlvcml0eVwiKVxuICAgICAgLmFkZERyb3Bkb3duKGRyb3AgPT4gZHJvcFxuICAgICAgICAuYWRkT3B0aW9uKFwibm9uZVwiLCAgIFwiTm9uZVwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwibG93XCIsICAgIFwiTG93XCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJtZWRpdW1cIiwgXCJNZWRpdW1cIilcbiAgICAgICAgLmFkZE9wdGlvbihcImhpZ2hcIiwgICBcIkhpZ2hcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRSZW1pbmRlclByaW9yaXR5KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFJlbWluZGVyUHJpb3JpdHkgPSB2YWx1ZSBhcyBSZW1pbmRlclByaW9yaXR5O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJEZWZhdWx0IGFsZXJ0XCIpXG4gICAgICAuc2V0RGVzYyhcIkFsZXJ0IG9mZnNldCBhcHBsaWVkIHRvIG5ldyByZW1pbmRlcnMgYnkgZGVmYXVsdC5cIilcbiAgICAgIC5hZGREcm9wZG93bihkcm9wID0+IHRoaXMuYWRkQWxlcnRPcHRpb25zKGRyb3ApXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0QWxlcnQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRBbGVydCA9IHZhbHVlIGFzIEFsZXJ0T2Zmc2V0O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJEZWZhdWx0IGxpc3RcIilcbiAgICAgIC5zZXREZXNjKFwiTGlzdCBhc3NpZ25lZCB0byBuZXcgcmVtaW5kZXJzIGJ5IGRlZmF1bHQuXCIpXG4gICAgICAuYWRkRHJvcGRvd24oZHJvcCA9PiB7XG4gICAgICAgIGRyb3AuYWRkT3B0aW9uKFwiXCIsIFwiTm9uZVwiKTtcbiAgICAgICAgZm9yIChjb25zdCBsaXN0IG9mIHRoaXMucGx1Z2luLmxpc3RNYW5hZ2VyLmdldEFsbCgpKSB7XG4gICAgICAgICAgZHJvcC5hZGRPcHRpb24obGlzdC5pZCwgbGlzdC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBkcm9wLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRMaXN0SWQgPz8gXCJcIik7XG4gICAgICAgIGRyb3Aub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdExpc3RJZCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5kaXZpZGVyKGVsKTtcbiAgICB0aGlzLnN1YkhlYWRlcihlbCwgXCJNeSBMaXN0c1wiKTtcbiAgICBlbC5jcmVhdGVEaXYoXCJjcy1kZXNjXCIpLnNldFRleHQoXCJBZGQsIHJlbmFtZSwgcmVjb2xvciwgb3IgZGVsZXRlIGxpc3RzLlwiKTtcblxuICAgIGZvciAoY29uc3QgbGlzdCBvZiB0aGlzLnBsdWdpbi5saXN0TWFuYWdlci5nZXRBbGwoKSkge1xuICAgICAgdGhpcy5yZW5kZXJMaXN0Um93KGVsLCBsaXN0LCB0aGlzLnBsdWdpbi5saXN0TWFuYWdlci5nZXRBbGwoKS5sZW5ndGggPT09IDEpO1xuICAgIH1cblxuICAgIHRoaXMuZGl2aWRlcihlbCk7XG5cbiAgICBjb25zdCBhZGRMaXN0Um93ID0gZWwuY3JlYXRlRGl2KFwiY3MtYWRkLXJvd1wiKTtcbiAgICBjb25zdCBsaXN0TmFtZUlucHV0ID0gYWRkTGlzdFJvdy5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgY2xzOiBcImNzLXRleHQtaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIk5ldyBsaXN0IG5hbWVcIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGxpc3RDb2xvclBpY2tlciA9IGFkZExpc3RSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY29sb3JcIiwgY2xzOiBcImNzLWNvbG9yLXBpY2tlclwiIH0pO1xuICAgIGxpc3RDb2xvclBpY2tlci52YWx1ZSA9IFwiIzM3OEFERFwiO1xuXG4gICAgY29uc3QgYWRkTGlzdEJ0biA9IGFkZExpc3RSb3cuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY3MtYnRuLXByaW1hcnlcIiwgdGV4dDogXCJBZGQgbGlzdFwiIH0pO1xuICAgIGFkZExpc3RCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBsaXN0TmFtZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghbmFtZSkgeyBsaXN0TmFtZUlucHV0LmZvY3VzKCk7IHJldHVybjsgfVxuICAgICAgdGhpcy5wbHVnaW4ubGlzdE1hbmFnZXIuY3JlYXRlKG5hbWUsIGxpc3RDb2xvclBpY2tlci52YWx1ZSk7XG4gICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgIG5ldyBOb3RpY2UoYExpc3QgXCIke25hbWV9XCIgY3JlYXRlZGApO1xuICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmRpdmlkZXIoZWwpO1xuICAgIHRoaXMuc3ViSGVhZGVyKGVsLCBcIk5vdGlmaWNhdGlvbnNcIik7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiUmVtaW5kZXIgbm90aWZpY2F0aW9uIHNvdW5kXCIpXG4gICAgICAuc2V0RGVzYyhcIm1hY09TIHN5c3RlbSBzb3VuZCBwbGF5ZWQgd2hlbiBhIHJlbWluZGVyIGFsZXJ0IGZpcmVzLlwiKVxuICAgICAgLmFkZERyb3Bkb3duKGRyb3AgPT4gdGhpcy5hZGRTb3VuZE9wdGlvbnMoZHJvcClcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGlmU291bmRSZW1pbmRlciA/PyBcIkdsYXNzXCIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vdGlmU291bmRSZW1pbmRlciA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIHRoaXMuZGl2aWRlcihlbCk7XG4gICAgdGhpcy5zdWJIZWFkZXIoZWwsIFwiU21hcnQgbGlzdCB2aXNpYmlsaXR5XCIpO1xuXG4gICAgdHlwZSBTbWFydExpc3RFbnRyeSA9IHsgaWQ6IHN0cmluZzsgbGFiZWw6IHN0cmluZzsgc2hvd0tleTogXCJzaG93VG9kYXlMaXN0XCIgfCBcInNob3dTY2hlZHVsZWRMaXN0XCIgfCBcInNob3dBbGxMaXN0XCIgfCBcInNob3dDb21wbGV0ZWRMaXN0XCI7IGRlZmF1bHRDb2xvcjogc3RyaW5nIH07XG4gICAgY29uc3Qgc21hcnRMaXN0czogU21hcnRMaXN0RW50cnlbXSA9IFtcbiAgICAgIHsgaWQ6IFwidG9kYXlcIiwgICAgIGxhYmVsOiBcIlRvZGF5XCIsICAgICBzaG93S2V5OiBcInNob3dUb2RheUxpc3RcIiwgICAgIGRlZmF1bHRDb2xvcjogXCIjRkYzQjMwXCIgfSxcbiAgICAgIHsgaWQ6IFwic2NoZWR1bGVkXCIsIGxhYmVsOiBcIlNjaGVkdWxlZFwiLCBzaG93S2V5OiBcInNob3dTY2hlZHVsZWRMaXN0XCIsIGRlZmF1bHRDb2xvcjogXCIjMzc4QUREXCIgfSxcbiAgICAgIHsgaWQ6IFwiYWxsXCIsICAgICAgIGxhYmVsOiBcIkFsbFwiLCAgICAgICBzaG93S2V5OiBcInNob3dBbGxMaXN0XCIsICAgICAgIGRlZmF1bHRDb2xvcjogXCIjNjM2MzY2XCIgfSxcbiAgICAgIHsgaWQ6IFwiY29tcGxldGVkXCIsIGxhYmVsOiBcIkNvbXBsZXRlZFwiLCBzaG93S2V5OiBcInNob3dDb21wbGV0ZWRMaXN0XCIsIGRlZmF1bHRDb2xvcjogXCIjMzRDNzU5XCIgfSxcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCBzbCBvZiBzbWFydExpc3RzKSB7XG4gICAgICBjb25zdCBjb2xvcnMgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zbWFydExpc3RDb2xvcnMgPz8ge307XG4gICAgICBjb25zdCBjdXJyZW50Q29sb3IgPSBjb2xvcnNbc2wuaWRdID8/IHNsLmRlZmF1bHRDb2xvcjtcblxuICAgICAgY29uc3Qgc2V0dGluZyA9IG5ldyBTZXR0aW5nKGVsKS5zZXROYW1lKHNsLmxhYmVsKTtcblxuICAgICAgc2V0dGluZ1xuICAgICAgICAuYWRkQ29sb3JQaWNrZXIocGlja2VyID0+IHtcbiAgICAgICAgICBwaWNrZXIuc2V0VmFsdWUoY3VycmVudENvbG9yKTtcbiAgICAgICAgICBwaWNrZXIub25DaGFuZ2UoYXN5bmMgKGhleCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnBsdWdpbi5zZXR0aW5ncy5zbWFydExpc3RDb2xvcnMpIHRoaXMucGx1Z2luLnNldHRpbmdzLnNtYXJ0TGlzdENvbG9ycyA9IHt9O1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc21hcnRMaXN0Q29sb3JzW3NsLmlkXSA9IGhleDtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5nc1tzbC5zaG93S2V5XSA/PyB0cnVlKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzW3NsLnNob3dLZXldID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBBcHBlYXJhbmNlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyQXBwZWFyYW5jZShlbDogSFRNTEVsZW1lbnQpIHtcbiAgICB0aGlzLnN1YkhlYWRlcihlbCwgXCJMYXlvdXRcIik7XG5cbiAgICBuZXcgU2V0dGluZyhlbClcbiAgICAgIC5zZXROYW1lKFwiUmVtaW5kZXIgbGlzdCBkZW5zaXR5XCIpXG4gICAgICAuc2V0RGVzYyhcIkNvbWZvcnRhYmxlIGFkZHMgbW9yZSBwYWRkaW5nIGJldHdlZW4gcmVtaW5kZXIgcm93cy5cIilcbiAgICAgIC5hZGREcm9wZG93bihkcm9wID0+IGRyb3BcbiAgICAgICAgLmFkZE9wdGlvbihcImNvbXBhY3RcIiwgICAgIFwiQ29tcGFjdFwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiY29tZm9ydGFibGVcIiwgXCJDb21mb3J0YWJsZVwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVuc2l0eSA/PyBcImNvbWZvcnRhYmxlXCIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZW5zaXR5ID0gdmFsdWUgYXMgXCJjb21wYWN0XCIgfCBcImNvbWZvcnRhYmxlXCI7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoZWwpXG4gICAgICAuc2V0TmFtZShcIlNob3cgY29tcGxldGVkIGNvdW50XCIpXG4gICAgICAuc2V0RGVzYyhcIlNob3cgdGhlIG51bWJlciBvZiBjb21wbGV0ZWQgcmVtaW5kZXJzIG5leHQgdG8gdGhlIENvbXBsZXRlZCBlbnRyeS5cIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93Q29tcGxldGVkQ291bnQgPz8gdHJ1ZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dDb21wbGV0ZWRDb3VudCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGVsKVxuICAgICAgLnNldE5hbWUoXCJTaG93IHJlbWluZGVyIGNvdW50IHN1YnRpdGxlXCIpXG4gICAgICAuc2V0RGVzYyhcIlNob3cgJzMgcmVtaW5kZXJzJyB1bmRlciB0aGUgbGlzdCB0aXRsZSBpbiB0aGUgbWFpbiBwYW5lbC5cIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93UmVtaW5kZXJDb3VudFN1YnRpdGxlID8/IHRydWUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93UmVtaW5kZXJDb3VudFN1YnRpdGxlID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEhlbHBlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSBzdWJIZWFkZXIoZWw6IEhUTUxFbGVtZW50LCB0aXRsZTogc3RyaW5nKSB7XG4gICAgZWwuY3JlYXRlRGl2KFwiY3Mtc3ViLWhlYWRlclwiKS5zZXRUZXh0KHRpdGxlKTtcbiAgfVxuXG4gIHByaXZhdGUgZGl2aWRlcihlbDogSFRNTEVsZW1lbnQpIHtcbiAgICBlbC5jcmVhdGVEaXYoXCJjcy1kaXZpZGVyXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRTb3VuZE9wdGlvbnMoZHJvcDogYW55KSB7XG4gICAgZm9yIChjb25zdCBzIG9mIFNPVU5EX09QVElPTlMpIGRyb3AuYWRkT3B0aW9uKHMudmFsdWUsIHMubGFiZWwpO1xuICAgIHJldHVybiBkcm9wO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRBbGVydE9wdGlvbnMoZHJvcDogYW55KSB7XG4gICAgZm9yIChjb25zdCBhIG9mIEFMRVJUX09QVElPTlMpIGRyb3AuYWRkT3B0aW9uKGEudmFsdWUsIGEubGFiZWwpO1xuICAgIHJldHVybiBkcm9wO1xuICB9XG59IiwgImltcG9ydCB7IENocm9uaWNsZUNhbGVuZGFyIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBDYWxlbmRhck1hbmFnZXIge1xuICBwcml2YXRlIGNhbGVuZGFyczogQ2hyb25pY2xlQ2FsZW5kYXJbXTtcbiAgcHJpdmF0ZSBvblVwZGF0ZTogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW10sIG9uVXBkYXRlOiAoKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5jYWxlbmRhcnMgPSBjYWxlbmRhcnM7XG4gICAgdGhpcy5vblVwZGF0ZSA9IG9uVXBkYXRlO1xuICB9XG5cbiAgZ2V0QWxsKCk6IENocm9uaWNsZUNhbGVuZGFyW10ge1xuICAgIHJldHVybiBbLi4udGhpcy5jYWxlbmRhcnNdO1xuICB9XG5cbiAgZ2V0QnlJZChpZDogc3RyaW5nKTogQ2hyb25pY2xlQ2FsZW5kYXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNhbGVuZGFycy5maW5kKChjKSA9PiBjLmlkID09PSBpZCk7XG4gIH1cblxuICBjcmVhdGUobmFtZTogc3RyaW5nLCBjb2xvcjogc3RyaW5nKTogQ2hyb25pY2xlQ2FsZW5kYXIge1xuICAgIGNvbnN0IGNhbGVuZGFyOiBDaHJvbmljbGVDYWxlbmRhciA9IHtcbiAgICAgIGlkOiB0aGlzLmdlbmVyYXRlSWQobmFtZSksXG4gICAgICBuYW1lLFxuICAgICAgY29sb3IsXG4gICAgICBpc1Zpc2libGU6IHRydWUsXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuICAgIHRoaXMuY2FsZW5kYXJzLnB1c2goY2FsZW5kYXIpO1xuICAgIHRoaXMub25VcGRhdGUoKTtcbiAgICByZXR1cm4gY2FsZW5kYXI7XG4gIH1cblxuICB1cGRhdGUoaWQ6IHN0cmluZywgY2hhbmdlczogUGFydGlhbDxDaHJvbmljbGVDYWxlbmRhcj4pOiB2b2lkIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLmNhbGVuZGFycy5maW5kSW5kZXgoKGMpID0+IGMuaWQgPT09IGlkKTtcbiAgICBpZiAoaWR4ID09PSAtMSkgcmV0dXJuO1xuICAgIHRoaXMuY2FsZW5kYXJzW2lkeF0gPSB7IC4uLnRoaXMuY2FsZW5kYXJzW2lkeF0sIC4uLmNoYW5nZXMgfTtcbiAgICB0aGlzLm9uVXBkYXRlKCk7XG4gIH1cblxuICBkZWxldGUoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGlkeCA9IHRoaXMuY2FsZW5kYXJzLmZpbmRJbmRleCgoYykgPT4gYy5pZCA9PT0gaWQpO1xuICAgIGlmIChpZHggIT09IC0xKSB0aGlzLmNhbGVuZGFycy5zcGxpY2UoaWR4LCAxKTtcbiAgICB0aGlzLm9uVXBkYXRlKCk7XG4gIH1cblxuICB0b2dnbGVWaXNpYmlsaXR5KGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBjYWwgPSB0aGlzLmNhbGVuZGFycy5maW5kKChjKSA9PiBjLmlkID09PSBpZCk7XG4gICAgaWYgKGNhbCkge1xuICAgICAgY2FsLmlzVmlzaWJsZSA9ICFjYWwuaXNWaXNpYmxlO1xuICAgICAgdGhpcy5vblVwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBjb2xvclRvSGV4KGNvbG9yOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8vIElmIGFscmVhZHkgYSBoZXggdmFsdWUsIHJldHVybiBpdCBkaXJlY3RseVxuICAgIGlmIChjb2xvci5zdGFydHNXaXRoKFwiI1wiKSkgcmV0dXJuIGNvbG9yO1xuXG4gICAgLy8gTGVnYWN5IG5hbWVkIGNvbG9yIG1hcFxuICAgIGNvbnN0IG1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgIGJsdWU6ICAgXCIjMzc4QUREXCIsXG4gICAgICBncmVlbjogIFwiIzM0Qzc1OVwiLFxuICAgICAgcHVycGxlOiBcIiNBRjUyREVcIixcbiAgICAgIG9yYW5nZTogXCIjRkY5NTAwXCIsXG4gICAgICByZWQ6ICAgIFwiI0ZGM0IzMFwiLFxuICAgICAgdGVhbDogICBcIiMzMEIwQzdcIixcbiAgICAgIHBpbms6ICAgXCIjRkYyRDU1XCIsXG4gICAgICB5ZWxsb3c6IFwiI0ZGRDYwQVwiLFxuICAgICAgZ3JheTogICBcIiM4RThFOTNcIixcbiAgICB9O1xuICAgIHJldHVybiBtYXBbY29sb3JdID8/IFwiIzM3OEFERFwiO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUlkKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYmFzZSA9IG5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csIFwiLVwiKS5yZXBsYWNlKC9bXmEtejAtOS1dL2csIFwiXCIpO1xuICAgIGNvbnN0IHN1ZmZpeCA9IERhdGUubm93KCkudG9TdHJpbmcoMzYpO1xuICAgIHJldHVybiBgJHtiYXNlfS0ke3N1ZmZpeH1gO1xuICB9XG59IiwgImltcG9ydCB7IEFsZXJ0T2Zmc2V0LCBSZW1pbmRlclN0YXR1cywgUmVtaW5kZXJQcmlvcml0eSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG4vLyBcdTI1MDBcdTI1MDAgQWxlcnQgb3B0aW9ucyAodXNlZCBpbiBtb2RhbHMsIGZvcm1zLCBhbmQgc2V0dGluZ3MpIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgY29uc3QgQUxFUlRfT1BUSU9OUzogeyB2YWx1ZTogQWxlcnRPZmZzZXQ7IGxhYmVsOiBzdHJpbmcgfVtdID0gW1xuICB7IHZhbHVlOiBcIm5vbmVcIiwgICAgbGFiZWw6IFwiTm9uZVwiIH0sXG4gIHsgdmFsdWU6IFwiYXQtdGltZVwiLCBsYWJlbDogXCJBdCB0aW1lXCIgfSxcbiAgeyB2YWx1ZTogXCI1bWluXCIsICAgIGxhYmVsOiBcIjUgbWludXRlcyBiZWZvcmVcIiB9LFxuICB7IHZhbHVlOiBcIjEwbWluXCIsICAgbGFiZWw6IFwiMTAgbWludXRlcyBiZWZvcmVcIiB9LFxuICB7IHZhbHVlOiBcIjE1bWluXCIsICAgbGFiZWw6IFwiMTUgbWludXRlcyBiZWZvcmVcIiB9LFxuICB7IHZhbHVlOiBcIjMwbWluXCIsICAgbGFiZWw6IFwiMzAgbWludXRlcyBiZWZvcmVcIiB9LFxuICB7IHZhbHVlOiBcIjFob3VyXCIsICAgbGFiZWw6IFwiMSBob3VyIGJlZm9yZVwiIH0sXG4gIHsgdmFsdWU6IFwiMmhvdXJzXCIsICBsYWJlbDogXCIyIGhvdXJzIGJlZm9yZVwiIH0sXG4gIHsgdmFsdWU6IFwiMWRheVwiLCAgICBsYWJlbDogXCIxIGRheSBiZWZvcmVcIiB9LFxuICB7IHZhbHVlOiBcIjJkYXlzXCIsICAgbGFiZWw6IFwiMiBkYXlzIGJlZm9yZVwiIH0sXG4gIHsgdmFsdWU6IFwiMXdlZWtcIiwgICBsYWJlbDogXCIxIHdlZWsgYmVmb3JlXCIgfSxcbl07XG5cbi8vIFx1MjUwMFx1MjUwMCBSZWN1cnJlbmNlIHByZXNldHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBjb25zdCBSRUNVUlJFTkNFX09QVElPTlM6IHsgdmFsdWU6IHN0cmluZzsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gIHsgdmFsdWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJOZXZlclwiIH0sXG4gIHsgdmFsdWU6IFwiRlJFUT1EQUlMWVwiLCAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSBkYXlcIiB9LFxuICB7IHZhbHVlOiBcIkZSRVE9V0VFS0xZXCIsICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiRXZlcnkgd2Vla1wiIH0sXG4gIHsgdmFsdWU6IFwiRlJFUT1NT05USExZXCIsICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSBtb250aFwiIH0sXG4gIHsgdmFsdWU6IFwiRlJFUT1ZRUFSTFlcIiwgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJFdmVyeSB5ZWFyXCIgfSxcbiAgeyB2YWx1ZTogXCJGUkVRPVdFRUtMWTtCWURBWT1NTyxUVSxXRSxUSCxGUlwiLCAgbGFiZWw6IFwiV2Vla2RheXNcIiB9LFxuXTtcblxuLy8gXHUyNTAwXHUyNTAwIFJlbWluZGVyIHN0YXR1cyBvcHRpb25zIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgY29uc3QgU1RBVFVTX09QVElPTlM6IHsgdmFsdWU6IFJlbWluZGVyU3RhdHVzOyBsYWJlbDogc3RyaW5nIH1bXSA9IFtcbiAgeyB2YWx1ZTogXCJ0b2RvXCIsICAgICAgICBsYWJlbDogXCJUbyBkb1wiIH0sXG4gIHsgdmFsdWU6IFwiaW4tcHJvZ3Jlc3NcIiwgbGFiZWw6IFwiSW4gcHJvZ3Jlc3NcIiB9LFxuICB7IHZhbHVlOiBcImRvbmVcIiwgICAgICAgIGxhYmVsOiBcIkRvbmVcIiB9LFxuICB7IHZhbHVlOiBcImNhbmNlbGxlZFwiLCAgIGxhYmVsOiBcIkNhbmNlbGxlZFwiIH0sXG5dO1xuXG4vLyBcdTI1MDBcdTI1MDAgUmVtaW5kZXIgcHJpb3JpdHkgb3B0aW9ucyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IGNvbnN0IFBSSU9SSVRZX09QVElPTlM6IHsgdmFsdWU6IFJlbWluZGVyUHJpb3JpdHk7IGxhYmVsOiBzdHJpbmcgfVtdID0gW1xuICB7IHZhbHVlOiBcIm5vbmVcIiwgICBsYWJlbDogXCJOb25lXCIgfSxcbiAgeyB2YWx1ZTogXCJsb3dcIiwgICAgbGFiZWw6IFwiTG93XCIgfSxcbiAgeyB2YWx1ZTogXCJtZWRpdW1cIiwgbGFiZWw6IFwiTWVkaXVtXCIgfSxcbiAgeyB2YWx1ZTogXCJoaWdoXCIsICAgbGFiZWw6IFwiSGlnaFwiIH0sXG5dO1xuXG4vLyBcdTI1MDBcdTI1MDAgbWFjT1Mgc3lzdGVtIHNvdW5kcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IGNvbnN0IFNPVU5EX09QVElPTlM6IHsgdmFsdWU6IHN0cmluZzsgbGFiZWw6IHN0cmluZyB9W10gPSBbXG4gIHsgdmFsdWU6IFwibm9uZVwiLCAgICAgIGxhYmVsOiBcIk5vbmUgKHNpbGVudClcIiB9LFxuICB7IHZhbHVlOiBcIkdsYXNzXCIsICAgICBsYWJlbDogXCJHbGFzc1wiIH0sXG4gIHsgdmFsdWU6IFwiUGluZ1wiLCAgICAgIGxhYmVsOiBcIlBpbmdcIiB9LFxuICB7IHZhbHVlOiBcIlRpbmtcIiwgICAgICBsYWJlbDogXCJUaW5rXCIgfSxcbiAgeyB2YWx1ZTogXCJCYXNzb1wiLCAgICAgbGFiZWw6IFwiQmFzc29cIiB9LFxuICB7IHZhbHVlOiBcIkZ1bmtcIiwgICAgICBsYWJlbDogXCJGdW5rXCIgfSxcbiAgeyB2YWx1ZTogXCJIZXJvXCIsICAgICAgbGFiZWw6IFwiSGVyb1wiIH0sXG4gIHsgdmFsdWU6IFwiU29zdW1pXCIsICAgIGxhYmVsOiBcIlNvc3VtaVwiIH0sXG4gIHsgdmFsdWU6IFwiU3VibWFyaW5lXCIsIGxhYmVsOiBcIlN1Ym1hcmluZVwiIH0sXG4gIHsgdmFsdWU6IFwiQmxvd1wiLCAgICAgIGxhYmVsOiBcIkJsb3dcIiB9LFxuICB7IHZhbHVlOiBcIkJvdHRsZVwiLCAgICBsYWJlbDogXCJCb3R0bGVcIiB9LFxuICB7IHZhbHVlOiBcIkZyb2dcIiwgICAgICBsYWJlbDogXCJGcm9nXCIgfSxcbiAgeyB2YWx1ZTogXCJNb3JzZVwiLCAgICAgbGFiZWw6IFwiTW9yc2VcIiB9LFxuICB7IHZhbHVlOiBcIlBvcFwiLCAgICAgICBsYWJlbDogXCJQb3BcIiB9LFxuICB7IHZhbHVlOiBcIlB1cnJcIiwgICAgICBsYWJlbDogXCJQdXJyXCIgfSxcbl07XG4iLCAiaW1wb3J0IHsgQXBwIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBSZW1pbmRlck1hbmFnZXIgfSBmcm9tIFwiLi9SZW1pbmRlck1hbmFnZXJcIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuL0V2ZW50TWFuYWdlclwiO1xuaW1wb3J0IHsgQWxlcnRPZmZzZXQsIENocm9uaWNsZVNldHRpbmdzIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBBbGVydE1hbmFnZXIge1xuICBwcml2YXRlIGdldFNldHRpbmdzOiAoKSA9PiBDaHJvbmljbGVTZXR0aW5ncztcbiAgcHJpdmF0ZSBhcHA6ICAgICAgICAgICAgICBBcHA7XG4gIHByaXZhdGUgcmVtaW5kZXJNYW5hZ2VyOiAgUmVtaW5kZXJNYW5hZ2VyO1xuICBwcml2YXRlIGV2ZW50TWFuYWdlcjogICAgIEV2ZW50TWFuYWdlcjtcbiAgcHJpdmF0ZSBpbnRlcnZhbElkOiAgICAgICBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBmaXJlZEFsZXJ0czogICAgICBTZXQ8c3RyaW5nPiAgID0gbmV3IFNldCgpO1xuICBwcml2YXRlIGlzQ2hlY2tpbmc6ICAgICAgIGJvb2xlYW4gICAgICAgPSBmYWxzZTtcblxuICAvLyBTdG9yZSBoYW5kbGVyIHJlZmVyZW5jZXMgc28gd2UgY2FuIHJlbW92ZSB0aGVtIGluIHN0b3AoKVxuICBwcml2YXRlIG9uQ2hhbmdlZDogKChmaWxlOiBhbnkpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgb25DcmVhdGU6ICAoKGZpbGU6IGFueSkgICA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCByZW1pbmRlck1hbmFnZXI6IFJlbWluZGVyTWFuYWdlciwgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXIsIGdldFNldHRpbmdzOiAoKSA9PiBDaHJvbmljbGVTZXR0aW5ncykge1xuICAgIHRoaXMuYXBwICAgICAgICAgICAgICA9IGFwcDtcbiAgICB0aGlzLnJlbWluZGVyTWFuYWdlciAgPSByZW1pbmRlck1hbmFnZXI7XG4gICAgdGhpcy5ldmVudE1hbmFnZXIgICAgID0gZXZlbnRNYW5hZ2VyO1xuICAgIHRoaXMuZ2V0U2V0dGluZ3MgICAgICA9IGdldFNldHRpbmdzO1xuICB9XG5cbiAgc3RhcnQoKSB7XG4gICAgLy8gUmVxdWVzdCBwZXJtaXNzaW9uIGlubGluZVxuICAgIGlmIChcIk5vdGlmaWNhdGlvblwiIGluIHdpbmRvdyAmJiBOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJkZWZhdWx0XCIpIHtcbiAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbigpO1xuICAgIH1cblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5jaGVjaygpO1xuICAgICAgdGhpcy5pbnRlcnZhbElkID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHRoaXMuY2hlY2soKSwgMzAgKiAxMDAwKTtcbiAgICB9LCAzMDAwKTtcblxuICAgIC8vIFJlLWNoZWNrIHdoZW4gZmlsZXMgY2hhbmdlIFx1MjAxNCBzdG9yZSByZWZzIHNvIHdlIGNhbiByZW1vdmUgdGhlbVxuICAgIHRoaXMub25DaGFuZ2VkID0gKGZpbGU6IGFueSkgPT4ge1xuICAgICAgY29uc3QgaW5FdmVudHMgICAgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLmV2ZW50TWFuYWdlcltcImV2ZW50c0ZvbGRlclwiXSk7XG4gICAgICBjb25zdCBpblJlbWluZGVycyA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMucmVtaW5kZXJNYW5hZ2VyW1wicmVtaW5kZXJzRm9sZGVyXCJdKTtcbiAgICAgIGlmIChpbkV2ZW50cyB8fCBpblJlbWluZGVycykgc2V0VGltZW91dCgoKSA9PiB0aGlzLmNoZWNrKCksIDMwMCk7XG4gICAgfTtcblxuICAgIHRoaXMub25DcmVhdGUgPSAoZmlsZTogYW55KSA9PiB7XG4gICAgICBjb25zdCBpbkV2ZW50cyAgICA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMuZXZlbnRNYW5hZ2VyW1wiZXZlbnRzRm9sZGVyXCJdKTtcbiAgICAgIGNvbnN0IGluUmVtaW5kZXJzID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5yZW1pbmRlck1hbmFnZXJbXCJyZW1pbmRlcnNGb2xkZXJcIl0pO1xuICAgICAgaWYgKGluRXZlbnRzIHx8IGluUmVtaW5kZXJzKSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuY2hlY2soKSwgNTAwKTtcbiAgICB9O1xuXG4gICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5vbihcImNoYW5nZWRcIiwgdGhpcy5vbkNoYW5nZWQpO1xuICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwiY3JlYXRlXCIsIHRoaXMub25DcmVhdGUpO1xuICB9XG5cbiAgc3RvcCgpIHtcbiAgICBpZiAodGhpcy5pbnRlcnZhbElkICE9PSBudWxsKSB7XG4gICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsSWQpO1xuICAgICAgdGhpcy5pbnRlcnZhbElkID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMub25DaGFuZ2VkKSB7XG4gICAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9mZihcImNoYW5nZWRcIiwgdGhpcy5vbkNoYW5nZWQpO1xuICAgICAgdGhpcy5vbkNoYW5nZWQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy5vbkNyZWF0ZSkge1xuICAgICAgdGhpcy5hcHAudmF1bHQub2ZmKFwiY3JlYXRlXCIsIHRoaXMub25DcmVhdGUpO1xuICAgICAgdGhpcy5vbkNyZWF0ZSA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY2hlY2soKSB7XG4gICAgaWYgKHRoaXMuaXNDaGVja2luZykgcmV0dXJuO1xuICAgIHRoaXMuaXNDaGVja2luZyA9IHRydWU7XG4gICAgdHJ5IHsgYXdhaXQgdGhpcy5fY2hlY2soKTsgfSBmaW5hbGx5IHsgdGhpcy5pc0NoZWNraW5nID0gZmFsc2U7IH1cbiAgfVxuXG4gIGFzeW5jIF9jaGVjaygpIHtcbiAgICBjb25zdCBub3dNcyAgICA9IERhdGUubm93KCk7XG4gICAgY29uc3Qgd2luZG93TXMgPSA1ICogNjAgKiAxMDAwO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIENoZWNrIGV2ZW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBpZiAodGhpcy5nZXRTZXR0aW5ncygpLm5vdGlmRXZlbnRzID8/IHRydWUpIHtcbiAgICAgIGNvbnN0IGV2ZW50cyA9IGF3YWl0IHRoaXMuZXZlbnRNYW5hZ2VyLmdldEFsbCgpO1xuICAgICAgZm9yIChjb25zdCBldmVudCBvZiBldmVudHMpIHtcbiAgICAgICAgaWYgKCFldmVudC5hbGVydCB8fCBldmVudC5hbGVydCA9PT0gXCJub25lXCIpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoIWV2ZW50LnN0YXJ0RGF0ZSB8fCAhZXZlbnQuc3RhcnRUaW1lKSAgIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IGFsZXJ0S2V5ID0gYGV2ZW50LSR7ZXZlbnQuaWR9LSR7ZXZlbnQuc3RhcnREYXRlfS0ke2V2ZW50LmFsZXJ0fWA7XG4gICAgICAgIGlmICh0aGlzLmZpcmVkQWxlcnRzLmhhcyhhbGVydEtleSkpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IHN0YXJ0TXMgPSBuZXcgRGF0ZShgJHtldmVudC5zdGFydERhdGV9VCR7ZXZlbnQuc3RhcnRUaW1lfWApLmdldFRpbWUoKTtcbiAgICAgICAgY29uc3QgYWxlcnRNcyA9IHN0YXJ0TXMgLSB0aGlzLm9mZnNldFRvTXMoZXZlbnQuYWxlcnQpO1xuXG4gICAgICAgIGlmIChub3dNcyA+PSBhbGVydE1zICYmIG5vd01zIDwgYWxlcnRNcyArIHdpbmRvd01zKSB7XG4gICAgICAgICAgdGhpcy5maXJlKGFsZXJ0S2V5LCBldmVudC50aXRsZSwgdGhpcy5idWlsZEV2ZW50Qm9keShldmVudC5zdGFydFRpbWUsIGV2ZW50LmFsZXJ0KSwgXCJldmVudFwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBDaGVjayByZW1pbmRlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgaWYgKHRoaXMuZ2V0U2V0dGluZ3MoKS5ub3RpZlJlbWluZGVycyA/PyB0cnVlKSB7XG4gICAgICBjb25zdCByZW1pbmRlcnMgPSBhd2FpdCB0aGlzLnJlbWluZGVyTWFuYWdlci5nZXRBbGwoKTtcbiAgICAgIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICAgIGZvciAoY29uc3QgcmVtaW5kZXIgb2YgcmVtaW5kZXJzKSB7XG4gICAgICAgIGlmICghcmVtaW5kZXIuYWxlcnQgfHwgcmVtaW5kZXIuYWxlcnQgPT09IFwibm9uZVwiKSAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIGlmICghcmVtaW5kZXIuZHVlRGF0ZSAmJiAhcmVtaW5kZXIuZHVlVGltZSkgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIGlmIChyZW1pbmRlci5zdGF0dXMgPT09IFwiZG9uZVwiIHx8IHJlbWluZGVyLnN0YXR1cyA9PT0gXCJjYW5jZWxsZWRcIikgIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IGRhdGVTdHIgID0gcmVtaW5kZXIuZHVlRGF0ZSA/PyB0b2RheTtcbiAgICAgICAgY29uc3QgYWxlcnRLZXkgPSBgcmVtaW5kZXItJHtyZW1pbmRlci5pZH0tJHtkYXRlU3RyfS0ke3JlbWluZGVyLmFsZXJ0fWA7XG4gICAgICAgIGlmICh0aGlzLmZpcmVkQWxlcnRzLmhhcyhhbGVydEtleSkpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IHRpbWVTdHIgPSByZW1pbmRlci5kdWVUaW1lID8/IFwiMDk6MDBcIjtcbiAgICAgICAgY29uc3QgZHVlTXMgICA9IG5ldyBEYXRlKGAke2RhdGVTdHJ9VCR7dGltZVN0cn1gKS5nZXRUaW1lKCk7XG4gICAgICAgIGNvbnN0IGFsZXJ0TXMgPSBkdWVNcyAtIHRoaXMub2Zmc2V0VG9NcyhyZW1pbmRlci5hbGVydCk7XG5cbiAgICAgICAgaWYgKG5vd01zID49IGFsZXJ0TXMgJiYgbm93TXMgPCBhbGVydE1zICsgd2luZG93TXMpIHtcbiAgICAgICAgICB0aGlzLmZpcmUoYWxlcnRLZXksIHJlbWluZGVyLnRpdGxlLCB0aGlzLmJ1aWxkUmVtaW5kZXJCb2R5KHJlbWluZGVyLmR1ZURhdGUsIHJlbWluZGVyLmR1ZVRpbWUsIHJlbWluZGVyLmFsZXJ0KSwgXCJyZW1pbmRlclwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBmaXJlKGtleTogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCBib2R5OiBzdHJpbmcsIHR5cGU6IFwiZXZlbnRcIiB8IFwicmVtaW5kZXJcIikge1xuICAgIHRoaXMuZmlyZWRBbGVydHMuYWRkKGtleSk7XG4gICAgY29uc3Qgc2V0dGluZ3MgID0gdGhpcy5nZXRTZXR0aW5ncygpO1xuICAgIGNvbnN0IGRvTm90aWYgICA9IHNldHRpbmdzLm5vdGlmTWFjT1MgPz8gdHJ1ZTtcbiAgICBjb25zdCBkb1NvdW5kICAgPSBzZXR0aW5ncy5ub3RpZlNvdW5kID8/IHRydWU7XG4gICAgY29uc3QgcmF3U291bmQgID0gdHlwZSA9PT0gXCJldmVudFwiID8gKHNldHRpbmdzLm5vdGlmU291bmRFdmVudCA/PyBcIkdsYXNzXCIpIDogKHNldHRpbmdzLm5vdGlmU291bmRSZW1pbmRlciA/PyBcIkdsYXNzXCIpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFdlYiBOb3RpZmljYXRpb24gKHNob3dzIGFzIFwiT2JzaWRpYW5cIiBpbiBtYWNPUyBOb3RpZmljYXRpb24gQ2VudHJlKSBcdTI1MDBcdTI1MDBcbiAgICBpZiAoZG9Ob3RpZiAmJiBOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpIHtcbiAgICAgIG5ldyBOb3RpZmljYXRpb24oYENocm9uaWNsZSBcdTIwMTQgJHt0eXBlID09PSBcImV2ZW50XCIgPyBcIkV2ZW50XCIgOiBcIlJlbWluZGVyXCJ9YCwge1xuICAgICAgICBib2R5OiAgIGAke3RpdGxlfVxcbiR7Ym9keX1gLFxuICAgICAgICBzaWxlbnQ6IHRydWUsICAgLy8gd2UgY29udHJvbCBzb3VuZCBzZXBhcmF0ZWx5IGJlbG93XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgU291bmQgdmlhIGFmcGxheSAobWFjT1Mgc3lzdGVtIHNvdW5kcywgaW5kZXBlbmRlbnQgb2Ygbm90aWZpY2F0aW9uKSBcdTI1MDBcdTI1MDBcbiAgICBpZiAoZG9Tb3VuZCAmJiByYXdTb3VuZCAmJiByYXdTb3VuZCAhPT0gXCJub25lXCIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHsgZXhlYyB9ID0gKHdpbmRvdyBhcyBhbnkpLnJlcXVpcmUoXCJjaGlsZF9wcm9jZXNzXCIpO1xuICAgICAgICBleGVjKGBhZnBsYXkgXCIvU3lzdGVtL0xpYnJhcnkvU291bmRzLyR7cmF3U291bmR9LmFpZmZcImApO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvZmZzZXRUb01zKG9mZnNldDogQWxlcnRPZmZzZXQpOiBudW1iZXIge1xuICAgIGNvbnN0IG1hcDogUmVjb3JkPEFsZXJ0T2Zmc2V0LCBudW1iZXI+ID0ge1xuICAgICAgXCJub25lXCI6ICAgIDAsICAgICAgIFwiYXQtdGltZVwiOiAwLFxuICAgICAgXCI1bWluXCI6ICAgIDMwMDAwMCwgIFwiMTBtaW5cIjogICA2MDAwMDAsXG4gICAgICBcIjE1bWluXCI6ICAgOTAwMDAwLCAgXCIzMG1pblwiOiAgIDE4MDAwMDAsXG4gICAgICBcIjFob3VyXCI6ICAgMzYwMDAwMCwgXCIyaG91cnNcIjogIDcyMDAwMDAsXG4gICAgICBcIjFkYXlcIjogICAgODY0MDAwMDAsXCIyZGF5c1wiOiAgIDE3MjgwMDAwMCxcbiAgICAgIFwiMXdlZWtcIjogICA2MDQ4MDAwMDAsXG4gICAgfTtcbiAgICByZXR1cm4gbWFwW29mZnNldF0gPz8gMDtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRFdmVudEJvZHkoc3RhcnRUaW1lOiBzdHJpbmcsIGFsZXJ0OiBBbGVydE9mZnNldCk6IHN0cmluZyB7XG4gICAgaWYgKGFsZXJ0ID09PSBcImF0LXRpbWVcIikgcmV0dXJuIGBTdGFydGluZyBhdCAke3RoaXMuZm9ybWF0VGltZShzdGFydFRpbWUpfWA7XG4gICAgcmV0dXJuIGAke3RoaXMub2Zmc2V0TGFiZWwoYWxlcnQpfSBcdTIwMTQgc3RhcnRzIGF0ICR7dGhpcy5mb3JtYXRUaW1lKHN0YXJ0VGltZSl9YDtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRSZW1pbmRlckJvZHkoZHVlRGF0ZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBkdWVUaW1lOiBzdHJpbmcgfCB1bmRlZmluZWQsIGFsZXJ0OiBBbGVydE9mZnNldCk6IHN0cmluZyB7XG4gICAgaWYgKCFkdWVEYXRlKSByZXR1cm4gZHVlVGltZSA/IGBBdCAke3RoaXMuZm9ybWF0VGltZShkdWVUaW1lKX1gIDogXCJOb3dcIjtcbiAgICBjb25zdCBkYXRlTGFiZWwgPSBuZXcgRGF0ZShkdWVEYXRlICsgXCJUMDA6MDA6MDBcIikudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwge1xuICAgICAgd2Vla2RheTogXCJzaG9ydFwiLCBtb250aDogXCJzaG9ydFwiLCBkYXk6IFwibnVtZXJpY1wiXG4gICAgfSk7XG4gICAgaWYgKGR1ZVRpbWUpIHtcbiAgICAgIGlmIChhbGVydCA9PT0gXCJhdC10aW1lXCIpIHJldHVybiBgQXQgJHt0aGlzLmZvcm1hdFRpbWUoZHVlVGltZSl9YDtcbiAgICAgIHJldHVybiBgJHt0aGlzLm9mZnNldExhYmVsKGFsZXJ0KX0gXHUyMDE0IGF0ICR7dGhpcy5mb3JtYXRUaW1lKGR1ZVRpbWUpfWA7XG4gICAgfVxuICAgIHJldHVybiBkYXRlTGFiZWw7XG4gIH1cblxuICBwcml2YXRlIG9mZnNldExhYmVsKG9mZnNldDogQWxlcnRPZmZzZXQpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1hcDogUmVjb3JkPEFsZXJ0T2Zmc2V0LCBzdHJpbmc+ID0ge1xuICAgICAgXCJub25lXCI6IFwiXCIsIFwiYXQtdGltZVwiOiBcIk5vd1wiLFxuICAgICAgXCI1bWluXCI6IFwiNSBtaW5cIiwgXCIxMG1pblwiOiBcIjEwIG1pblwiLCBcIjE1bWluXCI6IFwiMTUgbWluXCIsIFwiMzBtaW5cIjogXCIzMCBtaW5cIixcbiAgICAgIFwiMWhvdXJcIjogXCIxIGhvdXJcIiwgXCIyaG91cnNcIjogXCIyIGhvdXJzXCIsXG4gICAgICBcIjFkYXlcIjogXCIxIGRheVwiLCBcIjJkYXlzXCI6IFwiMiBkYXlzXCIsIFwiMXdlZWtcIjogXCIxIHdlZWtcIixcbiAgICB9O1xuICAgIHJldHVybiBtYXBbb2Zmc2V0XSA/PyBcIlwiO1xuICB9XG5cbiAgcHJpdmF0ZSBmb3JtYXRUaW1lKHRpbWVTdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgW2gsIG1dID0gdGltZVN0ci5zcGxpdChcIjpcIikubWFwKE51bWJlcik7XG4gICAgcmV0dXJuIGAke2ggJSAxMiB8fCAxMn06JHtTdHJpbmcobSkucGFkU3RhcnQoMixcIjBcIil9ICR7aCA+PSAxMiA/IFwiUE1cIiA6IFwiQU1cIn1gO1xuICB9XG59XG4iLCAiLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENhbGVuZGFycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IGludGVyZmFjZSBDaHJvbmljbGVDYWxlbmRhciB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgY29sb3I6IHN0cmluZztcbiAgaXNWaXNpYmxlOiBib29sZWFuO1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIExpc3RzIChyZW1pbmRlciBvcmdhbmlzYXRpb24pIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgaW50ZXJmYWNlIENocm9uaWNsZUxpc3Qge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbG9yOiBzdHJpbmc7ICAgIC8vIGhleCB2YWx1ZSBlLmcuIFwiIzM3OEFERFwiXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgUmVtaW5kZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgdHlwZSBSZW1pbmRlclN0YXR1cyA9IFwidG9kb1wiIHwgXCJpbi1wcm9ncmVzc1wiIHwgXCJkb25lXCIgfCBcImNhbmNlbGxlZFwiO1xuZXhwb3J0IHR5cGUgUmVtaW5kZXJQcmlvcml0eSA9IFwibm9uZVwiIHwgXCJsb3dcIiB8IFwibWVkaXVtXCIgfCBcImhpZ2hcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUaW1lRW50cnkge1xuICBzdGFydFRpbWU6IHN0cmluZzsgICAvLyBJU08gODYwMVxuICBlbmRUaW1lPzogc3RyaW5nOyAgICAvLyBJU08gODYwMVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEN1c3RvbUZpZWxkIHtcbiAga2V5OiBzdHJpbmc7XG4gIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENocm9uaWNsZVJlbWluZGVyIHtcbiAgLy8gLS0tIENvcmUgLS0tXG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHN0YXR1czogUmVtaW5kZXJTdGF0dXM7XG4gIHByaW9yaXR5OiBSZW1pbmRlclByaW9yaXR5O1xuXG4gIC8vIC0tLSBTY2hlZHVsaW5nIC0tLVxuICBkdWVEYXRlPzogc3RyaW5nOyAgICAgICAvLyBZWVlZLU1NLUREXG4gIGR1ZVRpbWU/OiBzdHJpbmc7ICAgICAgIC8vIEhIOm1tXG4gIHJlY3VycmVuY2U/OiBzdHJpbmc7ICAgIC8vIFJSVUxFIHN0cmluZyBlLmcuIFwiRlJFUT1XRUVLTFk7QllEQVk9TU9cIlxuICBhbGVydDogQWxlcnRPZmZzZXQ7XG5cbiAgLy8gLS0tIE9yZ2FuaXNhdGlvbiAtLS1cbiAgbG9jYXRpb24/OiBzdHJpbmc7XG4gIGxpc3RJZD86IHN0cmluZzsgICAgICAgIC8vIGxpbmtzIHRvIGEgQ2hyb25pY2xlTGlzdFxuICB0YWdzOiBzdHJpbmdbXTtcbiAgbGlua2VkTm90ZXM6IHN0cmluZ1tdOyAgLy8gd2lraWxpbmsgcGF0aHMgZS5nLiBbXCJQcm9qZWN0cy9XZWJzaXRlXCJdXG4gIHByb2plY3RzOiBzdHJpbmdbXTtcblxuICAvLyAtLS0gVGltZSB0cmFja2luZyAtLS1cbiAgdGltZUVzdGltYXRlPzogbnVtYmVyOyAgLy8gbWludXRlc1xuICB0aW1lRW50cmllczogVGltZUVudHJ5W107XG5cbiAgLy8gLS0tIEN1c3RvbSAtLS1cbiAgY3VzdG9tRmllbGRzOiBDdXN0b21GaWVsZFtdO1xuXG4gIC8vIC0tLSBSZWN1cnJlbmNlIGNvbXBsZXRpb24gLS0tXG4gIGNvbXBsZXRlZEluc3RhbmNlczogc3RyaW5nW107IC8vIFlZWVktTU0tREQgZGF0ZXNcblxuICAvLyAtLS0gTWV0YSAtLS1cbiAgY3JlYXRlZEF0OiBzdHJpbmc7ICAgICAgLy8gSVNPIDg2MDFcbiAgY29tcGxldGVkQXQ/OiBzdHJpbmc7ICAgLy8gSVNPIDg2MDFcbiAgbm90ZXM/OiBzdHJpbmc7ICAgICAgICAgLy8gYm9keSBjb250ZW50IG9mIHRoZSBub3RlXG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBFdmVudHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIEFsZXJ0T2Zmc2V0ID1cbiAgfCBcIm5vbmVcIlxuICB8IFwiYXQtdGltZVwiXG4gIHwgXCI1bWluXCIgfCBcIjEwbWluXCIgfCBcIjE1bWluXCIgfCBcIjMwbWluXCJcbiAgfCBcIjFob3VyXCIgfCBcIjJob3Vyc1wiXG4gIHwgXCIxZGF5XCIgfCBcIjJkYXlzXCIgfCBcIjF3ZWVrXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hyb25pY2xlRXZlbnQge1xuICAvLyAtLS0gQ29yZSAoaW4gZm9ybSBvcmRlcikgLS0tXG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGxvY2F0aW9uPzogc3RyaW5nO1xuICBhbGxEYXk6IGJvb2xlYW47XG4gIHN0YXJ0RGF0ZTogc3RyaW5nOyAgICAgIC8vIFlZWVktTU0tRERcbiAgc3RhcnRUaW1lPzogc3RyaW5nOyAgICAgLy8gSEg6bW0gICh1bmRlZmluZWQgd2hlbiBhbGxEYXkpXG4gIGVuZERhdGU6IHN0cmluZzsgICAgICAgIC8vIFlZWVktTU0tRERcbiAgZW5kVGltZT86IHN0cmluZzsgICAgICAgLy8gSEg6bW0gICh1bmRlZmluZWQgd2hlbiBhbGxEYXkpXG4gIHJlY3VycmVuY2U/OiBzdHJpbmc7ICAgIC8vIFJSVUxFIHN0cmluZ1xuICBjYWxlbmRhcklkPzogc3RyaW5nOyAgICAvLyBsaW5rcyB0byBhIENocm9uaWNsZUNhbGVuZGFyXG4gIGFsZXJ0OiBBbGVydE9mZnNldDtcbiAgbm90ZXM/OiBzdHJpbmc7ICAgICAgICAgLy8gYm9keSBjb250ZW50IG9mIHRoZSBub3RlXG4gIGxpbmtlZE5vdGVzPzogc3RyaW5nW107XG4gIHRhZ3M/OiBzdHJpbmdbXTtcblxuICAvLyAtLS0gQ29ubmVjdGlvbnMgLS0tXG4gIGxpbmtlZFJlbWluZGVySWRzOiBzdHJpbmdbXTsgICAvLyBDaHJvbmljbGUgcmVtaW5kZXIgSURzXG5cbiAgLy8gLS0tIE1ldGEgLS0tXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xuICBjb21wbGV0ZWRJbnN0YW5jZXM6IHN0cmluZ1tdO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgUGx1Z2luIHNldHRpbmdzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgaW50ZXJmYWNlIENocm9uaWNsZVNldHRpbmdzIHtcbiAgLy8gRm9sZGVyIHBhdGhzXG4gIHJlbWluZGVyc0ZvbGRlcjogc3RyaW5nO1xuICBldmVudHNGb2xkZXI6IHN0cmluZztcblxuICAvLyBDYWxlbmRhcnMgXHUyMDE0IGZvciBldmVudHMgKHN0b3JlZCBpbiBzZXR0aW5ncywgbm90IGFzIGZpbGVzKVxuICBjYWxlbmRhcnM6IENocm9uaWNsZUNhbGVuZGFyW107XG4gIGRlZmF1bHRDYWxlbmRhcklkOiBzdHJpbmc7XG5cbiAgLy8gTGlzdHMgXHUyMDE0IGZvciByZW1pbmRlcnMgKHN0b3JlZCBpbiBzZXR0aW5ncywgbm90IGFzIGZpbGVzKVxuICBsaXN0czogQ2hyb25pY2xlTGlzdFtdO1xuICBkZWZhdWx0TGlzdElkOiBzdHJpbmc7XG5cbiAgLy8gRGVmYXVsdHNcbiAgZGVmYXVsdFJlbWluZGVyU3RhdHVzOiBSZW1pbmRlclN0YXR1cztcbiAgZGVmYXVsdFJlbWluZGVyUHJpb3JpdHk6IFJlbWluZGVyUHJpb3JpdHk7XG4gIGRlZmF1bHRBbGVydDogQWxlcnRPZmZzZXQ7XG5cbiAgLy8gRGlzcGxheVxuICBzdGFydE9mV2VlazogMCB8IDEgfCA2OyAgLy8gMD1TdW4sIDE9TW9uLCA2PVNhdFxuICB0aW1lRm9ybWF0OiBcIjEyaFwiIHwgXCIyNGhcIjtcbiAgZGVmYXVsdENhbGVuZGFyVmlldzogXCJkYXlcIiB8IFwid2Vla1wiIHwgXCJtb250aFwiIHwgXCJ5ZWFyXCI7XG5cbiAgLy8gU21hcnQgbGlzdHMgdmlzaWJpbGl0eVxuICBzaG93VG9kYXlMaXN0OiBib29sZWFuO1xuICBzaG93U2NoZWR1bGVkTGlzdDogYm9vbGVhbjtcbiAgc2hvd0FsbExpc3Q6IGJvb2xlYW47XG4gIHNob3dGbGFnZ2VkTGlzdDogYm9vbGVhbjtcbiAgc2hvd0NvbXBsZXRlZExpc3Q6IGJvb2xlYW47XG5cbiAgLy8gU21hcnQgbGlzdCBvcmRlciAoYXJyYXkgb2Ygc21hcnQgbGlzdCBJRHMpXG4gIHNtYXJ0TGlzdE9yZGVyOiBzdHJpbmdbXTtcblxuICAvLyBTbWFydCBsaXN0IGNvbG9ycyAoa2V5ZWQgYnkgc21hcnQgbGlzdCBJRClcbiAgc21hcnRMaXN0Q29sb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXG4gIC8vIE5vdGlmaWNhdGlvbiBjaGFubmVsc1xuICBub3RpZk1hY09TOiBib29sZWFuO1xuICBub3RpZlNvdW5kOiBib29sZWFuO1xuICBub3RpZkV2ZW50czogYm9vbGVhbjtcbiAgbm90aWZSZW1pbmRlcnM6IGJvb2xlYW47XG5cbiAgLy8gTm90aWZpY2F0aW9uIHNvdW5kcyAobWFjT1Mgc291bmQgbmFtZXMsIGUuZy4gXCJHbGFzc1wiLCBcIlBpbmdcIiwgXCJub25lXCIpXG4gIG5vdGlmU291bmRFdmVudDogc3RyaW5nO1xuICBub3RpZlNvdW5kUmVtaW5kZXI6IHN0cmluZztcblxuICAvLyBFdmVudHNcbiAgZGVmYXVsdEV2ZW50RHVyYXRpb246IG51bWJlcjtcblxuICAvLyBBcHBlYXJhbmNlXG4gIGRlbnNpdHk6IFwiY29tcGFjdFwiIHwgXCJjb21mb3J0YWJsZVwiO1xuICBzaG93Q29tcGxldGVkQ291bnQ6IGJvb2xlYW47XG4gIHNob3dSZW1pbmRlckNvdW50U3VidGl0bGU6IGJvb2xlYW47XG5cbiAgLy8gQ3VzdG9tIGZpZWxkIHRlbXBsYXRlc1xuICBkZWZhdWx0Q3VzdG9tRmllbGRzOiB7IGtleTogc3RyaW5nOyB0eXBlOiBcInRleHRcIiB8IFwibnVtYmVyXCIgfCBcImRhdGVcIiB8IFwiY2hlY2tib3hcIiB9W107XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBDaHJvbmljbGVTZXR0aW5ncyA9IHtcbiAgcmVtaW5kZXJzRm9sZGVyOiBcIkNocm9uaWNsZS9SZW1pbmRlcnNcIixcbiAgZXZlbnRzRm9sZGVyOiBcIkNocm9uaWNsZS9FdmVudHNcIixcbiAgY2FsZW5kYXJzOiBbXG4gICAgeyBpZDogXCJwZXJzb25hbFwiLCBuYW1lOiBcIlBlcnNvbmFsXCIsIGNvbG9yOiBcIiMzNzhBRERcIiwgaXNWaXNpYmxlOiB0cnVlLCBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9LFxuICAgIHsgaWQ6IFwid29ya1wiLCAgICAgbmFtZTogXCJXb3JrXCIsICAgICBjb2xvcjogXCIjMzRDNzU5XCIsIGlzVmlzaWJsZTogdHJ1ZSwgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSxcbiAgXSxcbiAgZGVmYXVsdENhbGVuZGFySWQ6IFwicGVyc29uYWxcIixcbiAgbGlzdHM6IFtcbiAgICB7IGlkOiBcInBlcnNvbmFsXCIsIG5hbWU6IFwiUGVyc29uYWxcIiwgY29sb3I6IFwiIzM3OEFERFwiLCBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9LFxuICAgIHsgaWQ6IFwid29ya1wiLCAgICAgbmFtZTogXCJXb3JrXCIsICAgICBjb2xvcjogXCIjMzRDNzU5XCIsIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0sXG4gIF0sXG4gIGRlZmF1bHRMaXN0SWQ6IFwicGVyc29uYWxcIixcbiAgZGVmYXVsdFJlbWluZGVyU3RhdHVzOiBcInRvZG9cIixcbiAgZGVmYXVsdFJlbWluZGVyUHJpb3JpdHk6IFwibm9uZVwiLFxuICBkZWZhdWx0QWxlcnQ6IFwibm9uZVwiLFxuICBzdGFydE9mV2VlazogMCxcbiAgdGltZUZvcm1hdDogXCIxMmhcIixcbiAgZGVmYXVsdENhbGVuZGFyVmlldzogXCJ3ZWVrXCIsXG4gIHNob3dUb2RheUxpc3Q6IHRydWUsXG4gIHNob3dTY2hlZHVsZWRMaXN0OiB0cnVlLFxuICBzaG93QWxsTGlzdDogdHJ1ZSxcbiAgc2hvd0ZsYWdnZWRMaXN0OiB0cnVlLFxuICBzaG93Q29tcGxldGVkTGlzdDogdHJ1ZSxcbiAgc21hcnRMaXN0T3JkZXI6IFtcInRvZGF5XCIsIFwic2NoZWR1bGVkXCIsIFwiYWxsXCIsIFwiZmxhZ2dlZFwiLCBcImNvbXBsZXRlZFwiXSxcbiAgc21hcnRMaXN0Q29sb3JzOiB7XG4gICAgdG9kYXk6ICAgICBcIiNGRjNCMzBcIixcbiAgICBzY2hlZHVsZWQ6IFwiIzM3OEFERFwiLFxuICAgIGFsbDogICAgICAgXCIjNjM2MzY2XCIsXG4gICAgZmxhZ2dlZDogICBcIiNGRjk1MDBcIixcbiAgICBjb21wbGV0ZWQ6IFwiIzM0Qzc1OVwiLFxuICB9LFxuICBub3RpZk1hY09TOiB0cnVlLFxuICBub3RpZlNvdW5kOiB0cnVlLFxuICBub3RpZkV2ZW50czogdHJ1ZSxcbiAgbm90aWZSZW1pbmRlcnM6IHRydWUsXG4gIG5vdGlmU291bmRFdmVudDogXCJHbGFzc1wiLFxuICBub3RpZlNvdW5kUmVtaW5kZXI6IFwiR2xhc3NcIixcbiAgZGVmYXVsdEV2ZW50RHVyYXRpb246IDYwLFxuICBkZW5zaXR5OiBcImNvbWZvcnRhYmxlXCIsXG4gIHNob3dDb21wbGV0ZWRDb3VudDogdHJ1ZSxcbiAgc2hvd1JlbWluZGVyQ291bnRTdWJ0aXRsZTogdHJ1ZSxcbiAgZGVmYXVsdEN1c3RvbUZpZWxkczogW10sXG59O1xuIiwgImltcG9ydCB7IEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBFdmVudE1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9FdmVudE1hbmFnZXJcIjtcbmltcG9ydCB7IENhbGVuZGFyTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0NhbGVuZGFyTWFuYWdlclwiO1xuaW1wb3J0IHsgUmVtaW5kZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvUmVtaW5kZXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVFdmVudCwgQWxlcnRPZmZzZXQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGJ1aWxkVGFnRmllbGQgfSBmcm9tIFwiLi4vdWkvdGFnRmllbGRcIjtcbmltcG9ydCB7IEFMRVJUX09QVElPTlMsIFJFQ1VSUkVOQ0VfT1BUSU9OUyB9IGZyb20gXCIuLi91dGlscy9jb25zdGFudHNcIjtcblxuZXhwb3J0IGNvbnN0IEVWRU5UX0ZPUk1fVklFV19UWVBFID0gXCJjaHJvbmljbGUtZXZlbnQtZm9ybVwiO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRGb3JtVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSByZW1pbmRlck1hbmFnZXI6IFJlbWluZGVyTWFuYWdlcjtcbiAgcHJpdmF0ZSBlZGl0aW5nRXZlbnQ6IENocm9uaWNsZUV2ZW50IHwgbnVsbCA9IG51bGw7XG4gIG9uU2F2ZT86ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbGVhZjogV29ya3NwYWNlTGVhZixcbiAgICBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcixcbiAgICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcixcbiAgICByZW1pbmRlck1hbmFnZXI6IFJlbWluZGVyTWFuYWdlcixcbiAgICBlZGl0aW5nRXZlbnQ/OiBDaHJvbmljbGVFdmVudCxcbiAgICBvblNhdmU/OiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMuZXZlbnRNYW5hZ2VyICAgID0gZXZlbnRNYW5hZ2VyO1xuICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyID0gY2FsZW5kYXJNYW5hZ2VyO1xuICAgIHRoaXMucmVtaW5kZXJNYW5hZ2VyID0gcmVtaW5kZXJNYW5hZ2VyO1xuICAgIHRoaXMuZWRpdGluZ0V2ZW50ICAgID0gZWRpdGluZ0V2ZW50ID8/IG51bGw7XG4gICAgdGhpcy5vblNhdmUgICAgICAgICAgPSBvblNhdmU7XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiAgICBzdHJpbmcgeyByZXR1cm4gRVZFTlRfRk9STV9WSUVXX1RZUEU7IH1cbiAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuZWRpdGluZ0V2ZW50ID8gXCJFZGl0IGV2ZW50XCIgOiBcIk5ldyBldmVudFwiOyB9XG4gIGdldEljb24oKTogICAgICAgIHN0cmluZyB7IHJldHVybiBcImNhbGVuZGFyXCI7IH1cblxuICBhc3luYyBvbk9wZW4oKSB7IGF3YWl0IHRoaXMucmVuZGVyKCk7IH1cblxuICBsb2FkRXZlbnQoZXZlbnQ6IENocm9uaWNsZUV2ZW50KSB7XG4gICAgdGhpcy5lZGl0aW5nRXZlbnQgPSBldmVudDtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgYXN5bmMgcmVuZGVyKCkge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29udGFpbmVyLmVtcHR5KCk7XG4gICAgY29udGFpbmVyLmFkZENsYXNzKFwiY2hyb25pY2xlLWZvcm0tcGFnZVwiKTtcblxuICAgIGNvbnN0IGUgICAgICAgICA9IHRoaXMuZWRpdGluZ0V2ZW50O1xuICAgIGNvbnN0IGNhbGVuZGFycyA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgLy8gRmV0Y2ggYWxsIHJlbWluZGVycyB1cGZyb250IGZvciBsaW5rZWQtcmVtaW5kZXJzIFVJXG4gICAgY29uc3QgYWxsUmVtaW5kZXJzID0gYXdhaXQgdGhpcy5yZW1pbmRlck1hbmFnZXIuZ2V0QWxsKCk7XG4gICAgbGV0IGxpbmtlZElkczogc3RyaW5nW10gPSBbLi4uKGU/LmxpbmtlZFJlbWluZGVySWRzID8/IFtdKV07XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjZi1oZWFkZXJcIik7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdFwiLCB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZi1oZWFkZXItdGl0bGVcIikuc2V0VGV4dChlID8gXCJFZGl0IGV2ZW50XCIgOiBcIk5ldyBldmVudFwiKTtcbiAgICBjb25zdCBzYXZlQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1wcmltYXJ5XCIsIHRleHQ6IGUgPyBcIlNhdmVcIiA6IFwiQWRkXCIgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9ybSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb3JtID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNmLWZvcm1cIik7XG5cbiAgICAvLyBUaXRsZVxuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGl0bGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLXRpdGxlLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIkV2ZW50IG5hbWVcIlxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSBlPy50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIExvY2F0aW9uXG4gICAgY29uc3QgbG9jYXRpb25JbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJMb2NhdGlvblwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIGxvY2F0aW9uXCJcbiAgICB9KTtcbiAgICBsb2NhdGlvbklucHV0LnZhbHVlID0gZT8ubG9jYXRpb24gPz8gXCJcIjtcblxuICAgIC8vIEFsbCBkYXkgdG9nZ2xlXG4gICAgY29uc3QgYWxsRGF5V3JhcCAgID0gdGhpcy5maWVsZChmb3JtLCBcIkFsbCBkYXlcIikuY3JlYXRlRGl2KFwiY2VtLXRvZ2dsZS13cmFwXCIpO1xuICAgIGNvbnN0IGFsbERheVRvZ2dsZSA9IGFsbERheVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiwgY2xzOiBcImNlbS10b2dnbGVcIiB9KTtcbiAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA9IGU/LmFsbERheSA/PyBmYWxzZTtcbiAgICBjb25zdCBhbGxEYXlMYWJlbCAgPSBhbGxEYXlXcmFwLmNyZWF0ZVNwYW4oeyBjbHM6IFwiY2VtLXRvZ2dsZS1sYWJlbFwiIH0pO1xuICAgIGFsbERheUxhYmVsLnNldFRleHQoYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIlllc1wiIDogXCJOb1wiKTtcbiAgICBhbGxEYXlUb2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICBhbGxEYXlMYWJlbC5zZXRUZXh0KGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJZZXNcIiA6IFwiTm9cIik7XG4gICAgICB0aW1lRmllbGRzLnN0eWxlLmRpc3BsYXkgPSBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwibm9uZVwiIDogXCJcIjtcbiAgICB9KTtcblxuICAgIC8vIERhdGVzXG4gICAgY29uc3QgZGF0ZVJvdyAgICAgID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG4gICAgY29uc3Qgc3RhcnREYXRlSW5wdXQgPSB0aGlzLmZpZWxkKGRhdGVSb3csIFwiU3RhcnQgZGF0ZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0RGF0ZUlucHV0LnZhbHVlID0gZT8uc3RhcnREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBjb25zdCBlbmREYXRlSW5wdXQgPSB0aGlzLmZpZWxkKGRhdGVSb3csIFwiRW5kIGRhdGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcImRhdGVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBlbmREYXRlSW5wdXQudmFsdWUgPSBlPy5lbmREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBzdGFydERhdGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmICghZW5kRGF0ZUlucHV0LnZhbHVlIHx8IGVuZERhdGVJbnB1dC52YWx1ZSA8IHN0YXJ0RGF0ZUlucHV0LnZhbHVlKSB7XG4gICAgICAgIGVuZERhdGVJbnB1dC52YWx1ZSA9IHN0YXJ0RGF0ZUlucHV0LnZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVGltZSBmaWVsZHMgKGhpZGRlbiB3aGVuIGFsbC1kYXkpXG4gICAgY29uc3QgdGltZUZpZWxkcyA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuICAgIHRpbWVGaWVsZHMuc3R5bGUuZGlzcGxheSA9IGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJub25lXCIgOiBcIlwiO1xuXG4gICAgY29uc3Qgc3RhcnRUaW1lSW5wdXQgPSB0aGlzLmZpZWxkKHRpbWVGaWVsZHMsIFwiU3RhcnQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0VGltZUlucHV0LnZhbHVlID0gZT8uc3RhcnRUaW1lID8/IFwiMDk6MDBcIjtcblxuICAgIGNvbnN0IGVuZFRpbWVJbnB1dCA9IHRoaXMuZmllbGQodGltZUZpZWxkcywgXCJFbmQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGVuZFRpbWVJbnB1dC52YWx1ZSA9IGU/LmVuZFRpbWUgPz8gXCIxMDowMFwiO1xuXG4gICAgLy8gUmVwZWF0XG4gICAgY29uc3QgcmVjU2VsZWN0ID0gdGhpcy5maWVsZChmb3JtLCBcIlJlcGVhdFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBmb3IgKGNvbnN0IHJlYyBvZiBSRUNVUlJFTkNFX09QVElPTlMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IHJlY1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiByZWMudmFsdWUsIHRleHQ6IHJlYy5sYWJlbCB9KTtcbiAgICAgIGlmIChlPy5yZWN1cnJlbmNlID09PSByZWMudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gQWxlcnRcbiAgICBjb25zdCBhbGVydFNlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJBbGVydFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGEgb2YgQUxFUlRfT1BUSU9OUykge1xuICAgICAgY29uc3Qgb3B0ID0gYWxlcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogYS52YWx1ZSwgdGV4dDogYS5sYWJlbCB9KTtcbiAgICAgIGlmIChlPy5hbGVydCA9PT0gYS52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBDYWxlbmRhclxuICAgIGNvbnN0IGNhbFNlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJDYWxlbmRhclwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogXCJcIiwgdGV4dDogXCJOb25lXCIgfSk7XG4gICAgZm9yIChjb25zdCBjYWwgb2YgY2FsZW5kYXJzKSB7XG4gICAgICBjb25zdCBvcHQgPSBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogY2FsLmlkLCB0ZXh0OiBjYWwubmFtZSB9KTtcbiAgICAgIGlmIChlPy5jYWxlbmRhcklkID09PSBjYWwuaWQpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuICAgIGNvbnN0IHVwZGF0ZUNhbENvbG9yID0gKCkgPT4ge1xuICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChjYWxTZWxlY3QudmFsdWUpO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRDb2xvciA9IGNhbCA/IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcikgOiBcInRyYW5zcGFyZW50XCI7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdFdpZHRoID0gXCI0cHhcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0U3R5bGUgPSBcInNvbGlkXCI7XG4gICAgfTtcbiAgICBjYWxTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB1cGRhdGVDYWxDb2xvcik7XG4gICAgdXBkYXRlQ2FsQ29sb3IoKTtcblxuICAgIC8vIFRhZ3NcbiAgICBjb25zdCB0YWdGaWVsZCA9IGJ1aWxkVGFnRmllbGQodGhpcy5hcHAsIHRoaXMuZmllbGQoZm9ybSwgXCJUYWdzXCIpLCBlPy50YWdzID8/IFtdKTtcblxuICAgIC8vIExpbmtlZCBub3Rlc1xuICAgIGNvbnN0IGxpbmtlZElucHV0ID0gdGhpcy5maWVsZChmb3JtLCBcIkxpbmtlZCBub3Rlc1wiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIlByb2plY3RzL1dlYnNpdGUsIEpvdXJuYWwvMjAyNCAgKGNvbW1hIHNlcGFyYXRlZClcIlxuICAgIH0pO1xuICAgIGxpbmtlZElucHV0LnZhbHVlID0gZT8ubGlua2VkTm90ZXM/LmpvaW4oXCIsIFwiKSA/PyBcIlwiO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIExpbmtlZCByZW1pbmRlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgbGlua2VkUmVtaW5kZXJzRmllbGQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTGlua2VkIHJlbWluZGVyc1wiKTtcbiAgICBjb25zdCBsaW5rZWRMaXN0ICAgICAgICAgICA9IGxpbmtlZFJlbWluZGVyc0ZpZWxkLmNyZWF0ZURpdihcImN0bC1saXN0XCIpO1xuXG4gICAgY29uc3QgcmVuZGVyTGlua2VkTGlzdCA9ICgpID0+IHtcbiAgICAgIGxpbmtlZExpc3QuZW1wdHkoKTtcbiAgICAgIGNvbnN0IGl0ZW1zID0gYWxsUmVtaW5kZXJzLmZpbHRlcihyID0+IGxpbmtlZElkcy5pbmNsdWRlcyhyLmlkKSk7XG4gICAgICBpZiAoaXRlbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGxpbmtlZExpc3QuY3JlYXRlRGl2KFwiY3RsLWVtcHR5XCIpLnNldFRleHQoXCJObyBsaW5rZWQgcmVtaW5kZXJzXCIpO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCByZW1pbmRlciBvZiBpdGVtcykge1xuICAgICAgICBjb25zdCByb3cgPSBsaW5rZWRMaXN0LmNyZWF0ZURpdihcImN0bC1pdGVtXCIpO1xuICAgICAgICByb3cuY3JlYXRlU3Bhbih7IGNsczogYGN0bC1zdGF0dXMgY3RsLXN0YXR1cy0ke3JlbWluZGVyLnN0YXR1c31gIH0pO1xuICAgICAgICByb3cuY3JlYXRlU3Bhbih7IGNsczogXCJjdGwtdGl0bGVcIiB9KS5zZXRUZXh0KHJlbWluZGVyLnRpdGxlKTtcbiAgICAgICAgY29uc3QgdW5saW5rQnRuID0gcm93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImN0bC11bmxpbmtcIiwgdGV4dDogXCJcdTAwRDdcIiB9KTtcbiAgICAgICAgdW5saW5rQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgbGlua2VkSWRzID0gbGlua2VkSWRzLmZpbHRlcihpZCA9PiBpZCAhPT0gcmVtaW5kZXIuaWQpO1xuICAgICAgICAgIHJlbmRlckxpbmtlZExpc3QoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgICByZW5kZXJMaW5rZWRMaXN0KCk7XG5cbiAgICAvLyBTZWFyY2ggdG8gbGluayBleGlzdGluZyByZW1pbmRlcnNcbiAgICBjb25zdCBzZWFyY2hXcmFwICAgID0gbGlua2VkUmVtaW5kZXJzRmllbGQuY3JlYXRlRGl2KFwiY3RsLXNlYXJjaC13cmFwXCIpO1xuICAgIGNvbnN0IHNlYXJjaElucHV0ICAgPSBzZWFyY2hXcmFwLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dCBjdGwtc2VhcmNoXCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJTZWFyY2ggcmVtaW5kZXJzIHRvIGxpbmtcdTIwMjZcIlxuICAgIH0pO1xuICAgIGNvbnN0IHNlYXJjaFJlc3VsdHMgPSBzZWFyY2hXcmFwLmNyZWF0ZURpdihcImN0bC1yZXN1bHRzXCIpO1xuICAgIHNlYXJjaFJlc3VsdHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuXG4gICAgY29uc3QgY2xvc2VTZWFyY2ggPSAoKSA9PiB7XG4gICAgICBzZWFyY2hSZXN1bHRzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgIHNlYXJjaFJlc3VsdHMuZW1wdHkoKTtcbiAgICB9O1xuXG4gICAgc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHEgPSBzZWFyY2hJbnB1dC52YWx1ZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICAgIHNlYXJjaFJlc3VsdHMuZW1wdHkoKTtcbiAgICAgIGlmICghcSkgeyBjbG9zZVNlYXJjaCgpOyByZXR1cm47IH1cblxuICAgICAgY29uc3QgbWF0Y2hlcyA9IGFsbFJlbWluZGVyc1xuICAgICAgICAuZmlsdGVyKHIgPT4gIWxpbmtlZElkcy5pbmNsdWRlcyhyLmlkKSAmJiByLnRpdGxlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocSkpXG4gICAgICAgIC5zbGljZSgwLCA2KTtcblxuICAgICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAwKSB7IGNsb3NlU2VhcmNoKCk7IHJldHVybjsgfVxuICAgICAgc2VhcmNoUmVzdWx0cy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgIGZvciAoY29uc3QgcmVtaW5kZXIgb2YgbWF0Y2hlcykge1xuICAgICAgICBjb25zdCBpdGVtID0gc2VhcmNoUmVzdWx0cy5jcmVhdGVEaXYoXCJjdGwtcmVzdWx0LWl0ZW1cIik7XG4gICAgICAgIGl0ZW0uY3JlYXRlU3Bhbih7IGNsczogYGN0bC1zdGF0dXMgY3RsLXN0YXR1cy0ke3JlbWluZGVyLnN0YXR1c31gIH0pO1xuICAgICAgICBpdGVtLmNyZWF0ZVNwYW4oeyBjbHM6IFwiY3RsLXJlc3VsdC10aXRsZVwiIH0pLnNldFRleHQocmVtaW5kZXIudGl0bGUpO1xuICAgICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKGV2KSA9PiB7XG4gICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBsaW5rZWRJZHMucHVzaChyZW1pbmRlci5pZCk7XG4gICAgICAgICAgc2VhcmNoSW5wdXQudmFsdWUgPSBcIlwiO1xuICAgICAgICAgIGNsb3NlU2VhcmNoKCk7XG4gICAgICAgICAgcmVuZGVyTGlua2VkTGlzdCgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoY2xvc2VTZWFyY2gsIDE1MCk7XG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgbmV3IHJlbWluZGVyIGFuZCBsaW5rIGl0XG4gICAgY29uc3QgbmV3UmVtaW5kZXJXcmFwICA9IGxpbmtlZFJlbWluZGVyc0ZpZWxkLmNyZWF0ZURpdihcImN0bC1uZXctd3JhcFwiKTtcbiAgICBjb25zdCBuZXdSZW1pbmRlcklucHV0ID0gbmV3UmVtaW5kZXJXcmFwLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dCBjdGwtbmV3LWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJOZXcgcmVtaW5kZXIgdGl0bGVcdTIwMjZcIlxuICAgIH0pO1xuICAgIGNvbnN0IGFkZFJlbWluZGVyQnRuID0gbmV3UmVtaW5kZXJXcmFwLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1wcmltYXJ5IGN0bC1hZGQtYnRuXCIsIHRleHQ6IFwiQWRkIHJlbWluZGVyXCIgfSk7XG5cbiAgICBjb25zdCBjcmVhdGVBbmRMaW5rID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSBuZXdSZW1pbmRlcklucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHJldHVybjtcbiAgICAgIGNvbnN0IG5ld1JlbWluZGVyID0gYXdhaXQgdGhpcy5yZW1pbmRlck1hbmFnZXIuY3JlYXRlKHtcbiAgICAgICAgdGl0bGUsXG4gICAgICAgIHN0YXR1czogICAgICAgICAgICAgXCJ0b2RvXCIsXG4gICAgICAgIHByaW9yaXR5OiAgICAgICAgICAgXCJub25lXCIsXG4gICAgICAgIGFsZXJ0OiAgICAgICAgICAgICAgXCJub25lXCIsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgW10sXG4gICAgICAgIGxpbmtlZE5vdGVzOiAgICAgICAgW10sXG4gICAgICAgIHByb2plY3RzOiAgICAgICAgICAgW10sXG4gICAgICAgIHRpbWVFbnRyaWVzOiAgICAgICAgW10sXG4gICAgICAgIGN1c3RvbUZpZWxkczogICAgICAgW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogW10sXG4gICAgICB9KTtcbiAgICAgIGFsbFJlbWluZGVycy5wdXNoKG5ld1JlbWluZGVyKTtcbiAgICAgIGxpbmtlZElkcy5wdXNoKG5ld1JlbWluZGVyLmlkKTtcbiAgICAgIG5ld1JlbWluZGVySW5wdXQudmFsdWUgPSBcIlwiO1xuICAgICAgcmVuZGVyTGlua2VkTGlzdCgpO1xuICAgIH07XG5cbiAgICBhZGRSZW1pbmRlckJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY3JlYXRlQW5kTGluayk7XG4gICAgbmV3UmVtaW5kZXJJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXYpID0+IHtcbiAgICAgIGlmIChldi5rZXkgPT09IFwiRW50ZXJcIikgeyBldi5wcmV2ZW50RGVmYXVsdCgpOyBjcmVhdGVBbmRMaW5rKCk7IH1cbiAgICB9KTtcblxuICAgIC8vIE5vdGVzXG4gICAgY29uc3Qgbm90ZXNJbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJOb3Rlc1wiKS5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJjZi10ZXh0YXJlYVwiLCBwbGFjZWhvbGRlcjogXCJBZGQgbm90ZXMuLi5cIlxuICAgIH0pO1xuICAgIG5vdGVzSW5wdXQudmFsdWUgPSBlPy5ub3RlcyA/PyBcIlwiO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEFjdGlvbnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY2FuY2VsQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKEVWRU5UX0ZPUk1fVklFV19UWVBFKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0aXRsZSA9IHRpdGxlSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCF0aXRsZSkgeyB0aXRsZUlucHV0LmZvY3VzKCk7IHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpOyByZXR1cm47IH1cblxuICAgICAgY29uc3QgZXZlbnREYXRhID0ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgbG9jYXRpb246ICAgIGxvY2F0aW9uSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBhbGxEYXk6ICAgICAgYWxsRGF5VG9nZ2xlLmNoZWNrZWQsXG4gICAgICAgIHN0YXJ0RGF0ZTogICBzdGFydERhdGVJbnB1dC52YWx1ZSxcbiAgICAgICAgc3RhcnRUaW1lOiAgIGFsbERheVRvZ2dsZS5jaGVja2VkID8gdW5kZWZpbmVkIDogc3RhcnRUaW1lSW5wdXQudmFsdWUsXG4gICAgICAgIGVuZERhdGU6ICAgICBlbmREYXRlSW5wdXQudmFsdWUgfHwgc3RhcnREYXRlSW5wdXQudmFsdWUsXG4gICAgICAgIGVuZFRpbWU6ICAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IHVuZGVmaW5lZCA6IGVuZFRpbWVJbnB1dC52YWx1ZSxcbiAgICAgICAgcmVjdXJyZW5jZTogIHJlY1NlbGVjdC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGNhbGVuZGFySWQ6ICBjYWxTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBhbGVydDogICAgICAgYWxlcnRTZWxlY3QudmFsdWUgYXMgQWxlcnRPZmZzZXQsXG4gICAgICAgIG5vdGVzOiAgICAgICBub3Rlc0lucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgbGlua2VkTm90ZXM6IGxpbmtlZElucHV0LnZhbHVlID8gbGlua2VkSW5wdXQudmFsdWUuc3BsaXQoXCIsXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiAoZT8ubGlua2VkTm90ZXMgPz8gW10pLFxuICAgICAgICB0YWdzOiAgICAgICAgdGFnRmllbGQuZ2V0VGFncygpLFxuICAgICAgICBsaW5rZWRSZW1pbmRlcklkczogIGxpbmtlZElkcyxcbiAgICAgICAgY29tcGxldGVkSW5zdGFuY2VzOiBlPy5jb21wbGV0ZWRJbnN0YW5jZXMgPz8gW10sXG4gICAgICB9O1xuXG4gICAgICBpZiAoZT8uaWQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIudXBkYXRlKHsgLi4uZSwgLi4uZXZlbnREYXRhIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuY3JlYXRlKGV2ZW50RGF0YSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoRVZFTlRfRk9STV9WSUVXX1RZUEUpO1xuICAgIH07XG5cbiAgICBzYXZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoYW5kbGVTYXZlKTtcbiAgICB0aXRsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldikgPT4ge1xuICAgICAgaWYgKGV2LmtleSA9PT0gXCJFbnRlclwiKSBoYW5kbGVTYXZlKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGZpZWxkKHBhcmVudDogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3Qgd3JhcCA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZi1maWVsZFwiKTtcbiAgICB3cmFwLmNyZWF0ZURpdihcImNmLWxhYmVsXCIpLnNldFRleHQobGFiZWwpO1xuICAgIHJldHVybiB3cmFwO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbi8qKlxuICogUmVwbGFjZXMgYSBwbGFpbiB0ZXh0IGlucHV0IHdpdGggYSB0YWctY2hpcCBmaWVsZCB0aGF0OlxuICogIC0gU2hvd3MgY3VycmVudGx5IHNlbGVjdGVkIHRhZ3MgYXMgcmVtb3ZhYmxlIGNoaXBzXG4gKiAgLSBIYXMgYSB0ZXh0IGlucHV0IHRoYXQgc2VhcmNoZXMgZXhpc3RpbmcgdmF1bHQgdGFncyBhcyB5b3UgdHlwZVxuICogIC0gU2hvd3MgYSBkcm9wZG93biBvZiBtYXRjaGluZyB0YWdzIGJlbG93IHRoZSBpbnB1dFxuICogIC0gTGV0cyB5b3UgdHlwZSBhIG5ldyB0YWcgYW5kIHByZXNzIEVudGVyIC8gY29tbWEgdG8gYWRkIGl0XG4gKlxuICogQHBhcmFtIGFwcCAgICAgIFx1MjAxNCBPYnNpZGlhbiBBcHAgaW5zdGFuY2UgKGZvciBtZXRhZGF0YUNhY2hlKVxuICogQHBhcmFtIHdyYXBwZXIgIFx1MjAxNCBUaGUgY29udGFpbmVyIGVsZW1lbnQgKHJlcGxhY2VzIHRoZSBjZi1maWVsZCBjb250ZW50IGFyZWEpXG4gKiBAcGFyYW0gaW5pdGlhbCAgXHUyMDE0IFRhZ3MgYWxyZWFkeSBvbiB0aGUgaXRlbSBiZWluZyBlZGl0ZWRcbiAqIEByZXR1cm5zICAgICAgICBnZXRUYWdzIFx1MjAxNCBjYWxsIHRoaXMgYmVmb3JlIHNhdmluZyB0byBnZXQgdGhlIGN1cnJlbnQgdGFnIGxpc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkVGFnRmllbGQoXG4gIGFwcDogQXBwLFxuICB3cmFwcGVyOiBIVE1MRWxlbWVudCxcbiAgaW5pdGlhbDogc3RyaW5nW11cbik6IHsgZ2V0VGFnczogKCkgPT4gc3RyaW5nW10gfSB7XG4gIGNvbnN0IHNlbGVjdGVkOiBzdHJpbmdbXSA9IFsuLi5pbml0aWFsXTtcblxuICBjb25zdCBpbm5lciA9IHdyYXBwZXIuY3JlYXRlRGl2KFwiY3RmLWlubmVyXCIpO1xuXG4gIGNvbnN0IGNoaXBzUm93ID0gaW5uZXIuY3JlYXRlRGl2KFwiY3RmLWNoaXBzXCIpO1xuICBjb25zdCB0ZXh0SW5wdXQgPSBpbm5lci5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICB0eXBlOiBcInRleHRcIixcbiAgICBjbHM6IFwiY3RmLWlucHV0XCIsXG4gICAgcGxhY2Vob2xkZXI6IHNlbGVjdGVkLmxlbmd0aCA9PT0gMCA/IFwiQWRkIHRhZ3NcdTIwMjZcIiA6IFwiXCIsXG4gIH0pO1xuXG4gIGNvbnN0IGRyb3Bkb3duID0gaW5uZXIuY3JlYXRlRGl2KFwiY3RmLWRyb3Bkb3duXCIpO1xuICBkcm9wZG93bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cbiAgY29uc3QgcmVuZGVyQ2hpcHMgPSAoKSA9PiB7XG4gICAgY2hpcHNSb3cuZW1wdHkoKTtcbiAgICBmb3IgKGNvbnN0IHRhZyBvZiBzZWxlY3RlZCkge1xuICAgICAgY29uc3QgY2hpcCA9IGNoaXBzUm93LmNyZWF0ZURpdihcImN0Zi1jaGlwXCIpO1xuICAgICAgY2hpcC5jcmVhdGVTcGFuKHsgY2xzOiBcImN0Zi1jaGlwLWxhYmVsXCIgfSkuc2V0VGV4dCh0YWcpO1xuICAgICAgY29uc3QgcmVtb3ZlID0gY2hpcC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjdGYtY2hpcC1yZW1vdmVcIiwgdGV4dDogXCJcdTAwRDdcIiB9KTtcbiAgICAgIHJlbW92ZS5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChldikgPT4ge1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBzZWxlY3RlZC5zcGxpY2Uoc2VsZWN0ZWQuaW5kZXhPZih0YWcpLCAxKTtcbiAgICAgICAgcmVuZGVyQ2hpcHMoKTtcbiAgICAgICAgdXBkYXRlUGxhY2Vob2xkZXIoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0ZXh0SW5wdXQucGxhY2Vob2xkZXIgPSBzZWxlY3RlZC5sZW5ndGggPT09IDAgPyBcIkFkZCB0YWdzXHUyMDI2XCIgOiBcIlwiO1xuICB9O1xuXG4gIGNvbnN0IHVwZGF0ZVBsYWNlaG9sZGVyID0gKCkgPT4ge1xuICAgIHRleHRJbnB1dC5wbGFjZWhvbGRlciA9IHNlbGVjdGVkLmxlbmd0aCA9PT0gMCA/IFwiQWRkIHRhZ3NcdTIwMjZcIiA6IFwiXCI7XG4gIH07XG5cbiAgY29uc3QgZ2V0VmF1bHRUYWdzID0gKCk6IHN0cmluZ1tdID0+IHtcbiAgICBjb25zdCByYXcgPSAoYXBwLm1ldGFkYXRhQ2FjaGUgYXMgYW55KS5nZXRUYWdzKCkgYXMgUmVjb3JkPHN0cmluZywgbnVtYmVyPiB8IG51bGw7XG4gICAgaWYgKCFyYXcpIHJldHVybiBbXTtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMocmF3KS5tYXAodCA9PiB0LnN0YXJ0c1dpdGgoXCIjXCIpID8gdC5zbGljZSgxKSA6IHQpO1xuICB9O1xuXG4gIGNvbnN0IGNsb3NlRHJvcGRvd24gPSAoKSA9PiB7XG4gICAgZHJvcGRvd24uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgIGRyb3Bkb3duLmVtcHR5KCk7XG4gIH07XG5cbiAgY29uc3QgYWRkVGFnID0gKHRhZzogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgY2xlYW4gPSB0YWcudHJpbSgpLnJlcGxhY2UoL14jLywgXCJcIik7XG4gICAgaWYgKCFjbGVhbiB8fCBzZWxlY3RlZC5pbmNsdWRlcyhjbGVhbikpIHJldHVybjtcbiAgICBzZWxlY3RlZC5wdXNoKGNsZWFuKTtcbiAgICB0ZXh0SW5wdXQudmFsdWUgPSBcIlwiO1xuICAgIHJlbmRlckNoaXBzKCk7XG4gICAgY2xvc2VEcm9wZG93bigpO1xuICB9O1xuXG4gIHRleHRJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgIGNvbnN0IHEgPSB0ZXh0SW5wdXQudmFsdWUudHJpbSgpLnJlcGxhY2UoL14jLywgXCJcIik7XG4gICAgZHJvcGRvd24uZW1wdHkoKTtcbiAgICBpZiAoIXEpIHsgY2xvc2VEcm9wZG93bigpOyByZXR1cm47IH1cblxuICAgIGNvbnN0IHZhdWx0VGFncyA9IGdldFZhdWx0VGFncygpO1xuICAgIGNvbnN0IG1hdGNoZXMgPSB2YXVsdFRhZ3NcbiAgICAgIC5maWx0ZXIodCA9PiAhc2VsZWN0ZWQuaW5jbHVkZXModCkgJiYgdC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEudG9Mb3dlckNhc2UoKSkpXG4gICAgICAuc2xpY2UoMCwgOCk7XG5cbiAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDApIHsgY2xvc2VEcm9wZG93bigpOyByZXR1cm47IH1cblxuICAgIGRyb3Bkb3duLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgIGZvciAoY29uc3QgdGFnIG9mIG1hdGNoZXMpIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSBkcm9wZG93bi5jcmVhdGVEaXYoXCJjdGYtcmVzdWx0LWl0ZW1cIik7XG4gICAgICBpdGVtLmNyZWF0ZVNwYW4oeyBjbHM6IFwiY3RmLXRhZy1oYXNoXCIsIHRleHQ6IFwiI1wiIH0pO1xuICAgICAgaXRlbS5jcmVhdGVTcGFuKHsgY2xzOiBcImN0Zi10YWctbGFiZWxcIiB9KS5zZXRUZXh0KHRhZyk7XG4gICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKGV2KSA9PiB7XG4gICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGFkZFRhZyh0YWcpO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICB0ZXh0SW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2KSA9PiB7XG4gICAgaWYgKGV2LmtleSA9PT0gXCJFbnRlclwiIHx8IGV2LmtleSA9PT0gXCIsXCIpIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBhZGRUYWcodGV4dElucHV0LnZhbHVlKTtcbiAgICB9XG4gICAgaWYgKGV2LmtleSA9PT0gXCJCYWNrc3BhY2VcIiAmJiB0ZXh0SW5wdXQudmFsdWUgPT09IFwiXCIgJiYgc2VsZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgc2VsZWN0ZWQucG9wKCk7XG4gICAgICByZW5kZXJDaGlwcygpO1xuICAgIH1cbiAgfSk7XG5cbiAgdGV4dElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAvLyBDb21taXQgYW55IHR5cGVkIHRleHRcbiAgICBpZiAodGV4dElucHV0LnZhbHVlLnRyaW0oKSkgYWRkVGFnKHRleHRJbnB1dC52YWx1ZSk7XG4gICAgc2V0VGltZW91dChjbG9zZURyb3Bkb3duLCAxNTApO1xuICB9KTtcblxuICByZW5kZXJDaGlwcygpO1xuXG4gIHJldHVybiB7IGdldFRhZ3M6ICgpID0+IFsuLi5zZWxlY3RlZF0gfTtcbn1cbiIsICJpbXBvcnQgeyBDaHJvbmljbGVMaXN0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBMaXN0TWFuYWdlciB7XG4gIHByaXZhdGUgbGlzdHM6IENocm9uaWNsZUxpc3RbXTtcbiAgcHJpdmF0ZSBvblVwZGF0ZTogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihsaXN0czogQ2hyb25pY2xlTGlzdFtdLCBvblVwZGF0ZTogKCkgPT4gdm9pZCkge1xuICAgIHRoaXMubGlzdHMgICAgPSBsaXN0cztcbiAgICB0aGlzLm9uVXBkYXRlID0gb25VcGRhdGU7XG4gIH1cblxuICBnZXRBbGwoKTogQ2hyb25pY2xlTGlzdFtdIHtcbiAgICByZXR1cm4gWy4uLnRoaXMubGlzdHNdO1xuICB9XG5cbiAgZ2V0QnlJZChpZDogc3RyaW5nKTogQ2hyb25pY2xlTGlzdCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMubGlzdHMuZmluZCgobCkgPT4gbC5pZCA9PT0gaWQpO1xuICB9XG5cbiAgY3JlYXRlKG5hbWU6IHN0cmluZywgY29sb3I6IHN0cmluZyk6IENocm9uaWNsZUxpc3Qge1xuICAgIGNvbnN0IGxpc3Q6IENocm9uaWNsZUxpc3QgPSB7XG4gICAgICBpZDogICAgICAgIHRoaXMuZ2VuZXJhdGVJZChuYW1lKSxcbiAgICAgIG5hbWUsXG4gICAgICBjb2xvcixcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG4gICAgdGhpcy5saXN0cy5wdXNoKGxpc3QpO1xuICAgIHRoaXMub25VcGRhdGUoKTtcbiAgICByZXR1cm4gbGlzdDtcbiAgfVxuXG4gIHVwZGF0ZShpZDogc3RyaW5nLCBjaGFuZ2VzOiBQYXJ0aWFsPENocm9uaWNsZUxpc3Q+KTogdm9pZCB7XG4gICAgY29uc3QgaWR4ID0gdGhpcy5saXN0cy5maW5kSW5kZXgoKGwpID0+IGwuaWQgPT09IGlkKTtcbiAgICBpZiAoaWR4ID09PSAtMSkgcmV0dXJuO1xuICAgIHRoaXMubGlzdHNbaWR4XSA9IHsgLi4udGhpcy5saXN0c1tpZHhdLCAuLi5jaGFuZ2VzIH07XG4gICAgdGhpcy5vblVwZGF0ZSgpO1xuICB9XG5cbiAgZGVsZXRlKGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLmxpc3RzLmZpbmRJbmRleCgobCkgPT4gbC5pZCA9PT0gaWQpO1xuICAgIGlmIChpZHggIT09IC0xKSB0aGlzLmxpc3RzLnNwbGljZShpZHgsIDEpO1xuICAgIHRoaXMub25VcGRhdGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVJZChuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJhc2UgICA9IG5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csIFwiLVwiKS5yZXBsYWNlKC9bXmEtejAtOS1dL2csIFwiXCIpO1xuICAgIGNvbnN0IHN1ZmZpeCA9IERhdGUubm93KCkudG9TdHJpbmcoMzYpO1xuICAgIHJldHVybiBgJHtiYXNlfS0ke3N1ZmZpeH1gO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQ2hyb25pY2xlUmVtaW5kZXIsIFJlbWluZGVyU3RhdHVzLCBSZW1pbmRlclByaW9yaXR5LCBBbGVydE9mZnNldCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgQXBwLCBURmlsZSwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgUmVtaW5kZXJNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCwgcHJpdmF0ZSByZW1pbmRlcnNGb2xkZXI6IHN0cmluZykge31cblxuICAvLyBcdTI1MDBcdTI1MDAgUmVhZCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBnZXRBbGwoKTogUHJvbWlzZTxDaHJvbmljbGVSZW1pbmRlcltdPiB7XG4gICAgY29uc3QgZm9sZGVyID0gdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMucmVtaW5kZXJzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgcmVtaW5kZXJzOiBDaHJvbmljbGVSZW1pbmRlcltdID0gW107XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRGaWxlICYmIGNoaWxkLmV4dGVuc2lvbiA9PT0gXCJtZFwiKSB7XG4gICAgICAgIGNvbnN0IHJlbWluZGVyID0gYXdhaXQgdGhpcy5maWxlVG9SZW1pbmRlcihjaGlsZCk7XG4gICAgICAgIGlmIChyZW1pbmRlcikgcmVtaW5kZXJzLnB1c2gocmVtaW5kZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVtaW5kZXJzO1xuICB9XG5cbiAgYXN5bmMgZ2V0QnlJZChpZDogc3RyaW5nKTogUHJvbWlzZTxDaHJvbmljbGVSZW1pbmRlciB8IG51bGw+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmluZCgocikgPT4gci5pZCA9PT0gaWQpID8/IG51bGw7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgV3JpdGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgYXN5bmMgY3JlYXRlKHJlbWluZGVyOiBPbWl0PENocm9uaWNsZVJlbWluZGVyLCBcImlkXCIgfCBcImNyZWF0ZWRBdFwiPik6IFByb21pc2U8Q2hyb25pY2xlUmVtaW5kZXI+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcigpO1xuXG4gICAgY29uc3QgZnVsbDogQ2hyb25pY2xlUmVtaW5kZXIgPSB7XG4gICAgICAuLi5yZW1pbmRlcixcbiAgICAgIGlkOiB0aGlzLmdlbmVyYXRlSWQoKSxcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICBjb25zdCBwYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLnJlbWluZGVyc0ZvbGRlcn0vJHtmdWxsLnRpdGxlfS5tZGApO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCB0aGlzLnJlbWluZGVyVG9NYXJrZG93bihmdWxsKSk7XG4gICAgcmV0dXJuIGZ1bGw7XG4gIH1cblxuICBhc3luYyB1cGRhdGUocmVtaW5kZXI6IENocm9uaWNsZVJlbWluZGVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmluZEZpbGVGb3JSZW1pbmRlcihyZW1pbmRlci5pZCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG5cbiAgICBjb25zdCBleHBlY3RlZFBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMucmVtaW5kZXJzRm9sZGVyfS8ke3JlbWluZGVyLnRpdGxlfS5tZGApO1xuICAgIGlmIChmaWxlLnBhdGggIT09IGV4cGVjdGVkUGF0aCkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAuZmlsZU1hbmFnZXIucmVuYW1lRmlsZShmaWxlLCBleHBlY3RlZFBhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZUJ5UGF0aChleHBlY3RlZFBhdGgpID8/IGZpbGU7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KHVwZGF0ZWRGaWxlLCB0aGlzLnJlbWluZGVyVG9NYXJrZG93bihyZW1pbmRlcikpO1xuICB9XG5cbiAgYXN5bmMgZGVsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvclJlbWluZGVyKGlkKTtcbiAgICBpZiAoZmlsZSkgYXdhaXQgdGhpcy5hcHAudmF1bHQuZGVsZXRlKGZpbGUpO1xuICB9XG5cbiAgYXN5bmMgbWFya0NvbXBsZXRlKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCByZW1pbmRlciA9IGF3YWl0IHRoaXMuZ2V0QnlJZChpZCk7XG4gICAgaWYgKCFyZW1pbmRlcikgcmV0dXJuO1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHtcbiAgICAgIC4uLnJlbWluZGVyLFxuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIGNvbXBsZXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfSk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRmlsdGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBhc3luYyBnZXREdWVUb2RheSgpOiBQcm9taXNlPENocm9uaWNsZVJlbWluZGVyW10+IHtcbiAgICBjb25zdCB0b2RheSA9IHRoaXMudG9kYXlTdHIoKTtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKFxuICAgICAgKHIpID0+IHIuc3RhdHVzICE9PSBcImRvbmVcIiAmJiByLnN0YXR1cyAhPT0gXCJjYW5jZWxsZWRcIiAmJiByLmR1ZURhdGUgPT09IHRvZGF5XG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldE92ZXJkdWUoKTogUHJvbWlzZTxDaHJvbmljbGVSZW1pbmRlcltdPiB7XG4gICAgY29uc3QgdG9kYXkgPSB0aGlzLnRvZGF5U3RyKCk7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcihcbiAgICAgIChyKSA9PiByLnN0YXR1cyAhPT0gXCJkb25lXCIgJiYgci5zdGF0dXMgIT09IFwiY2FuY2VsbGVkXCIgJiYgISFyLmR1ZURhdGUgJiYgci5kdWVEYXRlIDwgdG9kYXlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgZ2V0U2NoZWR1bGVkKCk6IFByb21pc2U8Q2hyb25pY2xlUmVtaW5kZXJbXT4ge1xuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgcmV0dXJuIGFsbC5maWx0ZXIoXG4gICAgICAocikgPT4gci5zdGF0dXMgIT09IFwiZG9uZVwiICYmIHIuc3RhdHVzICE9PSBcImNhbmNlbGxlZFwiICYmICEhci5kdWVEYXRlXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldEZsYWdnZWQoKTogUHJvbWlzZTxDaHJvbmljbGVSZW1pbmRlcltdPiB7XG4gICAgY29uc3QgYWxsID0gYXdhaXQgdGhpcy5nZXRBbGwoKTtcbiAgICByZXR1cm4gYWxsLmZpbHRlcigocikgPT4gci5wcmlvcml0eSA9PT0gXCJoaWdoXCIgJiYgci5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTZXJpYWxpc2F0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVtaW5kZXJUb01hcmtkb3duKHJlbWluZGVyOiBDaHJvbmljbGVSZW1pbmRlcik6IHN0cmluZyB7XG4gICAgY29uc3QgZm06IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgICAgaWQ6ICAgICAgICAgICAgICAgICAgICByZW1pbmRlci5pZCxcbiAgICAgIHRpdGxlOiAgICAgICAgICAgICAgICAgcmVtaW5kZXIudGl0bGUsXG4gICAgICBcImxvY2F0aW9uXCI6ICAgICAgICAgICAgcmVtaW5kZXIubG9jYXRpb24gPz8gbnVsbCxcbiAgICAgIHN0YXR1czogICAgICAgICAgICAgICAgcmVtaW5kZXIuc3RhdHVzLFxuICAgICAgcHJpb3JpdHk6ICAgICAgICAgICAgICByZW1pbmRlci5wcmlvcml0eSxcbiAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgICAgcmVtaW5kZXIudGFncyxcbiAgICAgIHByb2plY3RzOiAgICAgICAgICAgICAgcmVtaW5kZXIucHJvamVjdHMsXG4gICAgICBcImxpbmtlZC1ub3Rlc1wiOiAgICAgICAgcmVtaW5kZXIubGlua2VkTm90ZXMsXG4gICAgICBcImxpc3QtaWRcIjogICAgICAgICAgICAgcmVtaW5kZXIubGlzdElkID8/IG51bGwsXG4gICAgICBcImR1ZS1kYXRlXCI6ICAgICAgICAgICAgcmVtaW5kZXIuZHVlRGF0ZSA/PyBudWxsLFxuICAgICAgXCJkdWUtdGltZVwiOiAgICAgICAgICAgIHJlbWluZGVyLmR1ZVRpbWUgPz8gbnVsbCxcbiAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICAgcmVtaW5kZXIucmVjdXJyZW5jZSA/PyBudWxsLFxuICAgICAgXCJhbGVydFwiOiAgICAgICAgICAgICAgIHJlbWluZGVyLmFsZXJ0ID8/IFwibm9uZVwiLFxuICAgICAgXCJ0aW1lLWVzdGltYXRlXCI6ICAgICAgIHJlbWluZGVyLnRpbWVFc3RpbWF0ZSA/PyBudWxsLFxuICAgICAgXCJ0aW1lLWVudHJpZXNcIjogICAgICAgIHJlbWluZGVyLnRpbWVFbnRyaWVzLFxuICAgICAgXCJjdXN0b20tZmllbGRzXCI6ICAgICAgIHJlbWluZGVyLmN1c3RvbUZpZWxkcyxcbiAgICAgIFwiY29tcGxldGVkLWluc3RhbmNlc1wiOiByZW1pbmRlci5jb21wbGV0ZWRJbnN0YW5jZXMsXG4gICAgICBcImNyZWF0ZWQtYXRcIjogICAgICAgICAgcmVtaW5kZXIuY3JlYXRlZEF0LFxuICAgICAgXCJjb21wbGV0ZWQtYXRcIjogICAgICAgIHJlbWluZGVyLmNvbXBsZXRlZEF0ID8/IG51bGwsXG4gICAgfTtcblxuICAgIGNvbnN0IHlhbWwgPSBPYmplY3QuZW50cmllcyhmbSlcbiAgICAgIC5tYXAoKFtrLCB2XSkgPT4gYCR7a306ICR7SlNPTi5zdHJpbmdpZnkodil9YClcbiAgICAgIC5qb2luKFwiXFxuXCIpO1xuXG4gICAgY29uc3QgYm9keSA9IHJlbWluZGVyLm5vdGVzID8gYFxcbiR7cmVtaW5kZXIubm90ZXN9YCA6IFwiXCI7XG4gICAgcmV0dXJuIGAtLS1cXG4ke3lhbWx9XFxuLS0tXFxuJHtib2R5fWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGZpbGVUb1JlbWluZGVyKGZpbGU6IFRGaWxlKTogUHJvbWlzZTxDaHJvbmljbGVSZW1pbmRlciB8IG51bGw+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICAgIGNvbnN0IGZtID0gY2FjaGU/LmZyb250bWF0dGVyO1xuICAgICAgaWYgKCFmbT8uaWQgfHwgIWZtPy50aXRsZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgICAgY29uc3QgYm9keU1hdGNoID0gY29udGVudC5tYXRjaCgvXi0tLVxcbltcXHNcXFNdKj9cXG4tLS1cXG4oW1xcc1xcU10qKSQvKTtcbiAgICAgIGNvbnN0IG5vdGVzID0gYm9keU1hdGNoPy5bMV0/LnRyaW0oKSB8fCB1bmRlZmluZWQ7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkOiAgICAgICAgICAgICAgICAgZm0uaWQsXG4gICAgICAgIHRpdGxlOiAgICAgICAgICAgICAgZm0udGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICAgICAgICAgZm0ubG9jYXRpb24gPz8gdW5kZWZpbmVkLFxuICAgICAgICBzdGF0dXM6ICAgICAgICAgICAgIChmbS5zdGF0dXMgYXMgUmVtaW5kZXJTdGF0dXMpID8/IFwidG9kb1wiLFxuICAgICAgICBwcmlvcml0eTogICAgICAgICAgIChmbS5wcmlvcml0eSBhcyBSZW1pbmRlclByaW9yaXR5KSA/PyBcIm5vbmVcIixcbiAgICAgICAgZHVlRGF0ZTogICAgICAgICAgICBmbVtcImR1ZS1kYXRlXCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgZHVlVGltZTogICAgICAgICAgICBmbVtcImR1ZS10aW1lXCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgcmVjdXJyZW5jZTogICAgICAgICBmbS5yZWN1cnJlbmNlID8/IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgICAgICAgICAoZm0uYWxlcnQgYXMgQWxlcnRPZmZzZXQpID8/IFwibm9uZVwiLFxuICAgICAgICAvLyByZWFkIG5ldyBsaXN0LWlkOyBmYWxsIGJhY2sgdG8gbGVnYWN5IGNhbGVuZGFyLWlkIHNvIG9sZCByZW1pbmRlcnMgc3RpbGwgc2hvdyB0aGVpciBsaXN0XG4gICAgICAgIGxpc3RJZDogICAgICAgICAgICAgZm1bXCJsaXN0LWlkXCJdID8/IGZtW1wiY2FsZW5kYXItaWRcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICB0YWdzOiAgICAgICAgICAgICAgIGZtLnRhZ3MgPz8gW10sXG4gICAgICAgIGxpbmtlZE5vdGVzOiAgICAgICAgZm1bXCJsaW5rZWQtbm90ZXNcIl0gPz8gW10sXG4gICAgICAgIHByb2plY3RzOiAgICAgICAgICAgZm0ucHJvamVjdHMgPz8gW10sXG4gICAgICAgIHRpbWVFc3RpbWF0ZTogICAgICAgZm1bXCJ0aW1lLWVzdGltYXRlXCJdID8/IHVuZGVmaW5lZCxcbiAgICAgICAgdGltZUVudHJpZXM6ICAgICAgICBmbVtcInRpbWUtZW50cmllc1wiXSA/PyBbXSxcbiAgICAgICAgY3VzdG9tRmllbGRzOiAgICAgICBmbVtcImN1c3RvbS1maWVsZHNcIl0gPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogZm1bXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCJdID8/IFtdLFxuICAgICAgICBjcmVhdGVkQXQ6ICAgICAgICAgIGZtW1wiY3JlYXRlZC1hdFwiXSA/PyBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGNvbXBsZXRlZEF0OiAgICAgICAgZm1bXCJjb21wbGV0ZWQtYXRcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBub3RlcyxcbiAgICAgIH07XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgSGVscGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIGZpbmRGaWxlRm9yUmVtaW5kZXIoaWQ6IHN0cmluZyk6IFRGaWxlIHwgbnVsbCB7XG4gICAgY29uc3QgZm9sZGVyID0gdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMucmVtaW5kZXJzRm9sZGVyKTtcbiAgICBpZiAoIWZvbGRlcikgcmV0dXJuIG51bGw7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmICghKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoY2hpbGQpO1xuICAgICAgaWYgKGNhY2hlPy5mcm9udG1hdHRlcj8uaWQgPT09IGlkKSByZXR1cm4gY2hpbGQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVGb2xkZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy5yZW1pbmRlcnNGb2xkZXIpKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIodGhpcy5yZW1pbmRlcnNGb2xkZXIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgcmVtaW5kZXItJHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA2KX1gO1xuICB9XG5cbiAgcHJpdmF0ZSB0b2RheVN0cigpOiBzdHJpbmcge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBURmlsZSwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlRXZlbnQsIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudE1hbmFnZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwLCBwcml2YXRlIGV2ZW50c0ZvbGRlcjogc3RyaW5nKSB7fVxuXG4gIGFzeW5jIGdldEFsbCgpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50W10+IHtcbiAgICBjb25zdCBmb2xkZXIgPSB0aGlzLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodGhpcy5ldmVudHNGb2xkZXIpO1xuICAgIGlmICghZm9sZGVyKSByZXR1cm4gW107XG5cbiAgICBjb25zdCBldmVudHM6IENocm9uaWNsZUV2ZW50W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbiAgICAgICAgY29uc3QgZXZlbnQgPSBhd2FpdCB0aGlzLmZpbGVUb0V2ZW50KGNoaWxkKTtcbiAgICAgICAgaWYgKGV2ZW50KSBldmVudHMucHVzaChldmVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBldmVudHM7XG4gIH1cblxuICBhc3luYyBjcmVhdGUoZXZlbnQ6IE9taXQ8Q2hyb25pY2xlRXZlbnQsIFwiaWRcIiB8IFwiY3JlYXRlZEF0XCI+KTogUHJvbWlzZTxDaHJvbmljbGVFdmVudD4ge1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKCk7XG5cbiAgICBjb25zdCBmdWxsOiBDaHJvbmljbGVFdmVudCA9IHtcbiAgICAgIC4uLmV2ZW50LFxuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZCgpLFxuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIGNvbnN0IHBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMuZXZlbnRzRm9sZGVyfS8ke2Z1bGwudGl0bGV9Lm1kYCk7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIHRoaXMuZXZlbnRUb01hcmtkb3duKGZ1bGwpKTtcbiAgICByZXR1cm4gZnVsbDtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZShldmVudDogQ2hyb25pY2xlRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maW5kRmlsZUZvckV2ZW50KGV2ZW50LmlkKTtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcblxuICAgIGNvbnN0IGV4cGVjdGVkUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy5ldmVudHNGb2xkZXJ9LyR7ZXZlbnQudGl0bGV9Lm1kYCk7XG4gICAgaWYgKGZpbGUucGF0aCAhPT0gZXhwZWN0ZWRQYXRoKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIGV4cGVjdGVkUGF0aCk7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKGV4cGVjdGVkUGF0aCkgPz8gZmlsZTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkodXBkYXRlZEZpbGUsIHRoaXMuZXZlbnRUb01hcmtkb3duKGV2ZW50KSk7XG4gIH1cblxuICBhc3luYyBkZWxldGUoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbmRGaWxlRm9yRXZlbnQoaWQpO1xuICAgIGlmIChmaWxlKSBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUoZmlsZSk7XG4gIH1cblxuICBhc3luYyBnZXRJblJhbmdlKHN0YXJ0RGF0ZTogc3RyaW5nLCBlbmREYXRlOiBzdHJpbmcpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50W10+IHtcbiAgICBjb25zdCBhbGwgPSBhd2FpdCB0aGlzLmdldEFsbCgpO1xuICAgIHJldHVybiBhbGwuZmlsdGVyKChlKSA9PiBlLnN0YXJ0RGF0ZSA+PSBzdGFydERhdGUgJiYgZS5zdGFydERhdGUgPD0gZW5kRGF0ZSk7XG4gIH1cblxuLy8gRXhwYW5kcyByZWN1cnJpbmcgZXZlbnRzIGludG8gb2NjdXJyZW5jZXMgd2l0aGluIGEgZGF0ZSByYW5nZS5cbiAgLy8gUmV0dXJucyBhIGZsYXQgbGlzdCBvZiBDaHJvbmljbGVFdmVudCBvYmplY3RzLCBvbmUgcGVyIG9jY3VycmVuY2UsXG4gIC8vIGVhY2ggd2l0aCBzdGFydERhdGUvZW5kRGF0ZSBzZXQgdG8gdGhlIG9jY3VycmVuY2UgZGF0ZS5cbiAgYXN5bmMgZ2V0SW5SYW5nZVdpdGhSZWN1cnJlbmNlKHJhbmdlU3RhcnQ6IHN0cmluZywgcmFuZ2VFbmQ6IHN0cmluZyk6IFByb21pc2U8Q2hyb25pY2xlRXZlbnRbXT4ge1xuICAgIGNvbnN0IGFsbCAgICA9IGF3YWl0IHRoaXMuZ2V0QWxsKCk7XG4gICAgY29uc3QgcmVzdWx0OiBDaHJvbmljbGVFdmVudFtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIGFsbCkge1xuICAgICAgaWYgKCFldmVudC5yZWN1cnJlbmNlKSB7XG4gICAgICAgIC8vIE5vbi1yZWN1cnJpbmcgXHUyMDE0IGluY2x1ZGUgaWYgaXQgZmFsbHMgaW4gcmFuZ2VcbiAgICAgICAgaWYgKGV2ZW50LnN0YXJ0RGF0ZSA+PSByYW5nZVN0YXJ0ICYmIGV2ZW50LnN0YXJ0RGF0ZSA8PSByYW5nZUVuZCkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gRXhwYW5kIHJlY3VycmVuY2Ugd2l0aGluIHJhbmdlXG4gICAgICBjb25zdCBvY2N1cnJlbmNlcyA9IHRoaXMuZXhwYW5kUmVjdXJyZW5jZShldmVudCwgcmFuZ2VTdGFydCwgcmFuZ2VFbmQpO1xuICAgICAgcmVzdWx0LnB1c2goLi4ub2NjdXJyZW5jZXMpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIGV4cGFuZFJlY3VycmVuY2UoZXZlbnQ6IENocm9uaWNsZUV2ZW50LCByYW5nZVN0YXJ0OiBzdHJpbmcsIHJhbmdlRW5kOiBzdHJpbmcpOiBDaHJvbmljbGVFdmVudFtdIHtcbiAgICBjb25zdCByZXN1bHRzOiBDaHJvbmljbGVFdmVudFtdID0gW107XG4gICAgY29uc3QgcnVsZSA9IGV2ZW50LnJlY3VycmVuY2UgPz8gXCJcIjtcblxuICAgIC8vIFBhcnNlIFJSVUxFIHBhcnRzXG4gICAgY29uc3QgZnJlcSAgICA9IHRoaXMucnJ1bGVQYXJ0KHJ1bGUsIFwiRlJFUVwiKTtcbiAgICBjb25zdCBieURheSAgID0gdGhpcy5ycnVsZVBhcnQocnVsZSwgXCJCWURBWVwiKTtcbiAgICBjb25zdCB1bnRpbCAgID0gdGhpcy5ycnVsZVBhcnQocnVsZSwgXCJVTlRJTFwiKTtcbiAgICBjb25zdCBjb3VudFN0ciA9IHRoaXMucnJ1bGVQYXJ0KHJ1bGUsIFwiQ09VTlRcIik7XG4gICAgY29uc3QgY291bnQgICA9IGNvdW50U3RyID8gcGFyc2VJbnQoY291bnRTdHIpIDogOTk5O1xuXG4gICAgY29uc3Qgc3RhcnQgICA9IG5ldyBEYXRlKGV2ZW50LnN0YXJ0RGF0ZSArIFwiVDAwOjAwOjAwXCIpO1xuICAgIGNvbnN0IHJFbmQgICAgPSBuZXcgRGF0ZShyYW5nZUVuZCArIFwiVDAwOjAwOjAwXCIpO1xuICAgIGNvbnN0IHJTdGFydCAgPSBuZXcgRGF0ZShyYW5nZVN0YXJ0ICsgXCJUMDA6MDA6MDBcIik7XG4gICAgY29uc3QgdW50aWxEYXRlID0gdW50aWwgPyBuZXcgRGF0ZSh1bnRpbC5zbGljZSgwLDgpLnJlcGxhY2UoLyhcXGR7NH0pKFxcZHsyfSkoXFxkezJ9KS8sXCIkMS0kMi0kM1wiKSArIFwiVDAwOjAwOjAwXCIpIDogbnVsbDtcblxuICAgIGNvbnN0IGRheU5hbWVzID0gW1wiU1VcIixcIk1PXCIsXCJUVVwiLFwiV0VcIixcIlRIXCIsXCJGUlwiLFwiU0FcIl07XG4gICAgY29uc3QgYnlEYXlzICAgPSBieURheSA/IGJ5RGF5LnNwbGl0KFwiLFwiKSA6IFtdO1xuXG4gICAgbGV0IGN1cnJlbnQgICA9IG5ldyBEYXRlKHN0YXJ0KTtcbiAgICBsZXQgZ2VuZXJhdGVkID0gMDtcblxuICAgIHdoaWxlIChjdXJyZW50IDw9IHJFbmQgJiYgZ2VuZXJhdGVkIDwgY291bnQpIHtcbiAgICAgIGlmICh1bnRpbERhdGUgJiYgY3VycmVudCA+IHVudGlsRGF0ZSkgYnJlYWs7XG5cbiAgICAgIGNvbnN0IGRhdGVTdHIgPSBjdXJyZW50LnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgICAvLyBDYWxjdWxhdGUgZHVyYXRpb24gdG8gYXBwbHkgdG8gZWFjaCBvY2N1cnJlbmNlXG4gICAgICBjb25zdCBkdXJhdGlvbk1zID0gbmV3IERhdGUoZXZlbnQuZW5kRGF0ZSArIFwiVDAwOjAwOjAwXCIpLmdldFRpbWUoKSAtIHN0YXJ0LmdldFRpbWUoKTtcbiAgICAgIGNvbnN0IGVuZERhdGUgICAgPSBuZXcgRGF0ZShjdXJyZW50LmdldFRpbWUoKSArIGR1cmF0aW9uTXMpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuXG4gICAgICBpZiAoY3VycmVudCA+PSByU3RhcnQgJiYgIWV2ZW50LmNvbXBsZXRlZEluc3RhbmNlcy5pbmNsdWRlcyhkYXRlU3RyKSkge1xuICAgICAgICByZXN1bHRzLnB1c2goeyAuLi5ldmVudCwgc3RhcnREYXRlOiBkYXRlU3RyLCBlbmREYXRlIH0pO1xuICAgICAgICBnZW5lcmF0ZWQrKztcbiAgICAgIH1cblxuICAgICAgLy8gQWR2YW5jZSB0byBuZXh0IG9jY3VycmVuY2VcbiAgICAgIGlmIChmcmVxID09PSBcIkRBSUxZXCIpIHtcbiAgICAgICAgY3VycmVudC5zZXREYXRlKGN1cnJlbnQuZ2V0RGF0ZSgpICsgMSk7XG4gICAgICB9IGVsc2UgaWYgKGZyZXEgPT09IFwiV0VFS0xZXCIpIHtcbiAgICAgICAgaWYgKGJ5RGF5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gRmluZCBuZXh0IG1hdGNoaW5nIHdlZWtkYXlcbiAgICAgICAgICBjdXJyZW50LnNldERhdGUoY3VycmVudC5nZXREYXRlKCkgKyAxKTtcbiAgICAgICAgICBsZXQgc2FmZXR5ID0gMDtcbiAgICAgICAgICB3aGlsZSAoIWJ5RGF5cy5pbmNsdWRlcyhkYXlOYW1lc1tjdXJyZW50LmdldERheSgpXSkgJiYgc2FmZXR5KysgPCA3KSB7XG4gICAgICAgICAgICBjdXJyZW50LnNldERhdGUoY3VycmVudC5nZXREYXRlKCkgKyAxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudC5zZXREYXRlKGN1cnJlbnQuZ2V0RGF0ZSgpICsgNyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZnJlcSA9PT0gXCJNT05USExZXCIpIHtcbiAgICAgICAgY3VycmVudC5zZXRNb250aChjdXJyZW50LmdldE1vbnRoKCkgKyAxKTtcbiAgICAgIH0gZWxzZSBpZiAoZnJlcSA9PT0gXCJZRUFSTFlcIikge1xuICAgICAgICBjdXJyZW50LnNldEZ1bGxZZWFyKGN1cnJlbnQuZ2V0RnVsbFllYXIoKSArIDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7IC8vIFVua25vd24gZnJlcSBcdTIwMTQgc3RvcCB0byBhdm9pZCBpbmZpbml0ZSBsb29wXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICBwcml2YXRlIHJydWxlUGFydChydWxlOiBzdHJpbmcsIGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXRjaCA9IHJ1bGUubWF0Y2gobmV3IFJlZ0V4cChgKD86Xnw7KSR7a2V5fT0oW147XSspYCkpO1xuICAgIHJldHVybiBtYXRjaCA/IG1hdGNoWzFdIDogXCJcIjtcbiAgfVxuXG4gIHByaXZhdGUgZXZlbnRUb01hcmtkb3duKGV2ZW50OiBDaHJvbmljbGVFdmVudCk6IHN0cmluZyB7XG4gICAgY29uc3QgZm06IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgICAgaWQ6ICAgICAgICAgICAgICAgICAgIGV2ZW50LmlkLFxuICAgICAgdGl0bGU6ICAgICAgICAgICAgICAgIGV2ZW50LnRpdGxlLFxuICAgICAgbG9jYXRpb246ICAgICAgICAgICAgIGV2ZW50LmxvY2F0aW9uID8/IG51bGwsXG4gICAgICBcImFsbC1kYXlcIjogICAgICAgICAgICBldmVudC5hbGxEYXksXG4gICAgICBcInN0YXJ0LWRhdGVcIjogICAgICAgICBldmVudC5zdGFydERhdGUsXG4gICAgICBcInN0YXJ0LXRpbWVcIjogICAgICAgICBldmVudC5zdGFydFRpbWUgPz8gbnVsbCxcbiAgICAgIFwiZW5kLWRhdGVcIjogICAgICAgICAgIGV2ZW50LmVuZERhdGUsXG4gICAgICBcImVuZC10aW1lXCI6ICAgICAgICAgICBldmVudC5lbmRUaW1lID8/IG51bGwsXG4gICAgICByZWN1cnJlbmNlOiAgICAgICAgICAgZXZlbnQucmVjdXJyZW5jZSA/PyBudWxsLFxuICAgICAgXCJjYWxlbmRhci1pZFwiOiAgICAgICAgZXZlbnQuY2FsZW5kYXJJZCA/PyBudWxsLFxuICAgICAgYWxlcnQ6ICAgICAgICAgICAgICAgIGV2ZW50LmFsZXJ0LFxuICAgICAgXCJ0YWdzXCI6ICAgICAgICAgICAgICAgZXZlbnQudGFncyA/PyBbXSxcbiAgICAgIFwibGlua2VkLW5vdGVzXCI6ICAgICAgIGV2ZW50LmxpbmtlZE5vdGVzID8/IFtdLFxuICAgICAgXCJsaW5rZWQtcmVtaW5kZXItaWRzXCI6IGV2ZW50LmxpbmtlZFJlbWluZGVySWRzLFxuICAgICAgXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCI6IGV2ZW50LmNvbXBsZXRlZEluc3RhbmNlcyxcbiAgICAgIFwiY3JlYXRlZC1hdFwiOiAgICAgICAgIGV2ZW50LmNyZWF0ZWRBdCxcbiAgICB9O1xuXG4gICAgY29uc3QgeWFtbCA9IE9iamVjdC5lbnRyaWVzKGZtKVxuICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHtKU09OLnN0cmluZ2lmeSh2KX1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCBib2R5ID0gZXZlbnQubm90ZXMgPyBgXFxuJHtldmVudC5ub3Rlc31gIDogXCJcIjtcbiAgICByZXR1cm4gYC0tLVxcbiR7eWFtbH1cXG4tLS1cXG4ke2JvZHl9YDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmlsZVRvRXZlbnQoZmlsZTogVEZpbGUpOiBQcm9taXNlPENocm9uaWNsZUV2ZW50IHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgICAgY29uc3QgZm0gPSBjYWNoZT8uZnJvbnRtYXR0ZXI7XG4gICAgICBpZiAoIWZtPy5pZCB8fCAhZm0/LnRpdGxlKSByZXR1cm4gbnVsbDtcblxuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBjb25zdCBib2R5TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eLS0tXFxuW1xcc1xcU10qP1xcbi0tLVxcbihbXFxzXFxTXSopJC8pO1xuICAgICAgY29uc3Qgbm90ZXMgPSBib2R5TWF0Y2g/LlsxXT8udHJpbSgpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6ICAgICAgICAgICAgICAgICAgIGZtLmlkLFxuICAgICAgICB0aXRsZTogICAgICAgICAgICAgICAgZm0udGl0bGUsXG4gICAgICAgIGxvY2F0aW9uOiAgICAgICAgICAgICBmbS5sb2NhdGlvbiA/PyB1bmRlZmluZWQsXG4gICAgICAgIGFsbERheTogICAgICAgICAgICAgICBmbVtcImFsbC1kYXlcIl0gPz8gdHJ1ZSxcbiAgICAgICAgc3RhcnREYXRlOiAgICAgICAgICAgIGZtW1wic3RhcnQtZGF0ZVwiXSxcbiAgICAgICAgc3RhcnRUaW1lOiAgICAgICAgICAgIGZtW1wic3RhcnQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIGVuZERhdGU6ICAgICAgICAgICAgICBmbVtcImVuZC1kYXRlXCJdLFxuICAgICAgICBlbmRUaW1lOiAgICAgICAgICAgICAgZm1bXCJlbmQtdGltZVwiXSA/PyB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgICBmbS5yZWN1cnJlbmNlID8/IHVuZGVmaW5lZCxcbiAgICAgICAgY2FsZW5kYXJJZDogICAgICAgICAgIGZtW1wiY2FsZW5kYXItaWRcIl0gPz8gdW5kZWZpbmVkLFxuICAgICAgICBhbGVydDogICAgICAgICAgICAgICAgKGZtLmFsZXJ0IGFzIEFsZXJ0T2Zmc2V0KSA/PyBcIm5vbmVcIixcbiAgICAgICAgdGFnczogICAgICAgICAgICAgICAgIGZtW1widGFnc1wiXSA/PyBbXSxcbiAgICAgICAgbGlua2VkTm90ZXM6ICAgICAgICAgIGZtW1wibGlua2VkLW5vdGVzXCJdID8/IFtdLFxuICAgICAgICBsaW5rZWRSZW1pbmRlcklkczogICAgZm1bXCJsaW5rZWQtcmVtaW5kZXItaWRzXCJdID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6ICAgZm1bXCJjb21wbGV0ZWQtaW5zdGFuY2VzXCJdID8/IFtdLFxuICAgICAgICBjcmVhdGVkQXQ6ICAgICAgICAgICAgZm1bXCJjcmVhdGVkLWF0XCJdID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgbm90ZXMsXG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5kRmlsZUZvckV2ZW50KGlkOiBzdHJpbmcpOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aCh0aGlzLmV2ZW50c0ZvbGRlcik7XG4gICAgaWYgKCFmb2xkZXIpIHJldHVybiBudWxsO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoIShjaGlsZCBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG4gICAgICBjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGNoaWxkKTtcbiAgICAgIGlmIChjYWNoZT8uZnJvbnRtYXR0ZXI/LmlkID09PSBpZCkgcmV0dXJuIGNoaWxkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHRoaXMuZXZlbnRzRm9sZGVyKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKHRoaXMuZXZlbnRzRm9sZGVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGV2ZW50LSR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgNil9YDtcbiAgfVxufSIsICJpbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgUmVtaW5kZXJNb2RhbCB9IGZyb20gXCIuLi91aS9SZW1pbmRlck1vZGFsXCI7XG5pbXBvcnQgeyBSZW1pbmRlckRldGFpbFBvcHVwIH0gZnJvbSBcIi4uL3VpL1JlbWluZGVyRGV0YWlsUG9wdXBcIjtcbmltcG9ydCB0eXBlIENocm9uaWNsZVBsdWdpbiBmcm9tIFwiLi4vbWFpblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlUmVtaW5kZXIgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IFJlbWluZGVyTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL1JlbWluZGVyTWFuYWdlclwiO1xuaW1wb3J0IHsgTGlzdE1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9MaXN0TWFuYWdlclwiO1xuaW1wb3J0IHsgUmVtaW5kZXJGb3JtVmlldywgUkVNSU5ERVJfRk9STV9WSUVXX1RZUEUgfSBmcm9tIFwiLi9SZW1pbmRlckZvcm1WaWV3XCI7XG5pbXBvcnQgeyBmb3JtYXREYXRlUmVsYXRpdmUsIHRvZGF5U3RyIH0gZnJvbSBcIi4uL3V0aWxzL2Zvcm1hdHRlcnNcIjtcblxuZXhwb3J0IGNvbnN0IFJFTUlOREVSX1ZJRVdfVFlQRSA9IFwiY2hyb25pY2xlLXJlbWluZGVyLXZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIFJlbWluZGVyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSByZW1pbmRlck1hbmFnZXI6IFJlbWluZGVyTWFuYWdlcjtcbiAgcHJpdmF0ZSBsaXN0TWFuYWdlcjogTGlzdE1hbmFnZXI7XG4gIHByaXZhdGUgcGx1Z2luOiBDaHJvbmljbGVQbHVnaW47XG4gIHByaXZhdGUgY3VycmVudExpc3RJZDogc3RyaW5nID0gXCJ0b2RheVwiO1xuICBwcml2YXRlIF9yZW5kZXJWZXJzaW9uID0gMDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBsZWFmOiBXb3Jrc3BhY2VMZWFmLFxuICAgIHJlbWluZGVyTWFuYWdlcjogUmVtaW5kZXJNYW5hZ2VyLFxuICAgIGxpc3RNYW5hZ2VyOiBMaXN0TWFuYWdlcixcbiAgICBwbHVnaW46IENocm9uaWNsZVBsdWdpblxuICApIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLnJlbWluZGVyTWFuYWdlciA9IHJlbWluZGVyTWFuYWdlcjtcbiAgICB0aGlzLmxpc3RNYW5hZ2VyICAgICA9IGxpc3RNYW5hZ2VyO1xuICAgIHRoaXMucGx1Z2luICAgICAgICAgID0gcGx1Z2luO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHsgcmV0dXJuIFJFTUlOREVSX1ZJRVdfVFlQRTsgfVxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gXCJSZW1pbmRlcnNcIjsgfVxuICBnZXRJY29uKCk6IHN0cmluZyB7IHJldHVybiBcImNoZWNrLWNpcmNsZVwiOyB9XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5yZW1pbmRlck1hbmFnZXJbXCJyZW1pbmRlcnNGb2xkZXJcIl0pKSB7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgICh0aGlzLmFwcC53b3Jrc3BhY2UgYXMgYW55KS5vbihcImNocm9uaWNsZTpzZXR0aW5ncy1jaGFuZ2VkXCIsICgpID0+IHRoaXMucmVuZGVyKCkpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC52YXVsdC5vbihcImNyZWF0ZVwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5yZW1pbmRlck1hbmFnZXJbXCJyZW1pbmRlcnNGb2xkZXJcIl0pKSB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnJlbmRlcigpLCAyMDApO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAudmF1bHQub24oXCJkZWxldGVcIiwgKGZpbGUpID0+IHtcbiAgICAgICAgaWYgKGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMucmVtaW5kZXJNYW5hZ2VyW1wicmVtaW5kZXJzRm9sZGVyXCJdKSkge1xuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHJlbmRlcigpIHtcbiAgICBjb25zdCB2ZXJzaW9uID0gKyt0aGlzLl9yZW5kZXJWZXJzaW9uO1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29udGFpbmVyLmVtcHR5KCk7XG4gICAgY29udGFpbmVyLmFkZENsYXNzKFwiY2hyb25pY2xlLWFwcFwiKTtcblxuICAgIGNvbnN0IGFsbCAgICAgICA9IGF3YWl0IHRoaXMucmVtaW5kZXJNYW5hZ2VyLmdldEFsbCgpO1xuICAgIGNvbnN0IHRvZGF5ICAgICA9IGF3YWl0IHRoaXMucmVtaW5kZXJNYW5hZ2VyLmdldER1ZVRvZGF5KCk7XG4gICAgY29uc3Qgc2NoZWR1bGVkID0gYXdhaXQgdGhpcy5yZW1pbmRlck1hbmFnZXIuZ2V0U2NoZWR1bGVkKCk7XG4gICAgY29uc3QgZmxhZ2dlZCAgID0gYXdhaXQgdGhpcy5yZW1pbmRlck1hbmFnZXIuZ2V0RmxhZ2dlZCgpO1xuICAgIGNvbnN0IG92ZXJkdWUgICA9IGF3YWl0IHRoaXMucmVtaW5kZXJNYW5hZ2VyLmdldE92ZXJkdWUoKTtcbiAgICBjb25zdCBsaXN0cyAgICAgPSB0aGlzLmxpc3RNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgaWYgKHRoaXMuX3JlbmRlclZlcnNpb24gIT09IHZlcnNpb24pIHJldHVybjtcblxuICAgIGNvbnN0IGxheW91dCAgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxheW91dFwiKTtcbiAgICBjb25zdCBzaWRlYmFyID0gbGF5b3V0LmNyZWF0ZURpdihcImNocm9uaWNsZS1zaWRlYmFyXCIpO1xuICAgIGNvbnN0IG1haW4gICAgPSBsYXlvdXQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1haW5cIik7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTmV3IHJlbWluZGVyIGJ1dHRvbiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBuZXdSZW1pbmRlckJ0biA9IHNpZGViYXIuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcImNocm9uaWNsZS1uZXctcmVtaW5kZXItYnRuXCIsIHRleHQ6IFwiTmV3IFJlbWluZGVyXCJcbiAgICB9KTtcbiAgICBuZXdSZW1pbmRlckJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5vcGVuUmVtaW5kZXJGb3JtKCkpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFNtYXJ0IGxpc3QgdGlsZXMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgdGlsZXNHcmlkID0gc2lkZWJhci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGlsZXNcIik7XG5cbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMucGx1Z2luLnNldHRpbmdzO1xuICAgIGNvbnN0IGNvbG9ycyAgID0gc2V0dGluZ3Muc21hcnRMaXN0Q29sb3JzID8/IHt9O1xuICAgIGNvbnN0IGFsbFRpbGVzOiBSZWNvcmQ8c3RyaW5nLCB7IGxhYmVsOiBzdHJpbmc7IGNvdW50OiBudW1iZXI7IGNvbG9yOiBzdHJpbmc7IGJhZGdlOiBudW1iZXI7IHZpc2libGU6IGJvb2xlYW4gfT4gPSB7XG4gICAgICB0b2RheTogICAgIHsgbGFiZWw6IFwiVG9kYXlcIiwgICAgIGNvdW50OiB0b2RheS5sZW5ndGggKyBvdmVyZHVlLmxlbmd0aCwgICAgICAgICAgICAgICAgY29sb3I6IGNvbG9ycy50b2RheSAgICAgPz8gXCIjRkYzQjMwXCIsIGJhZGdlOiBvdmVyZHVlLmxlbmd0aCwgdmlzaWJsZTogc2V0dGluZ3Muc2hvd1RvZGF5TGlzdCAgICAgPz8gdHJ1ZSB9LFxuICAgICAgc2NoZWR1bGVkOiB7IGxhYmVsOiBcIlNjaGVkdWxlZFwiLCBjb3VudDogc2NoZWR1bGVkLmxlbmd0aCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBjb2xvcnMuc2NoZWR1bGVkID8/IFwiIzM3OEFERFwiLCBiYWRnZTogMCwgICAgICAgICAgICAgdmlzaWJsZTogc2V0dGluZ3Muc2hvd1NjaGVkdWxlZExpc3QgID8/IHRydWUgfSxcbiAgICAgIGFsbDogICAgICAgeyBsYWJlbDogXCJBbGxcIiwgICAgICAgY291bnQ6IGFsbC5maWx0ZXIociA9PiByLnN0YXR1cyAhPT0gXCJkb25lXCIpLmxlbmd0aCwgIGNvbG9yOiBjb2xvcnMuYWxsICAgICAgID8/IFwiIzYzNjM2NlwiLCBiYWRnZTogMCwgICAgICAgICAgICAgdmlzaWJsZTogc2V0dGluZ3Muc2hvd0FsbExpc3QgICAgICAgID8/IHRydWUgfSxcbiAgICAgIGZsYWdnZWQ6ICAgeyBsYWJlbDogXCJGbGFnZ2VkXCIsICAgY291bnQ6IGZsYWdnZWQubGVuZ3RoLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogY29sb3JzLmZsYWdnZWQgICA/PyBcIiNGRjk1MDBcIiwgYmFkZ2U6IDAsICAgICAgICAgICAgIHZpc2libGU6IHNldHRpbmdzLnNob3dGbGFnZ2VkTGlzdCAgICA/PyB0cnVlIH0sXG4gICAgICBjb21wbGV0ZWQ6IHsgbGFiZWw6IFwiQ29tcGxldGVkXCIsIGNvdW50OiBhbGwuZmlsdGVyKHIgPT4gci5zdGF0dXMgPT09IFwiZG9uZVwiKS5sZW5ndGgsICBjb2xvcjogY29sb3JzLmNvbXBsZXRlZCA/PyBcIiMzNEM3NTlcIiwgYmFkZ2U6IDAsICAgICAgICAgICAgIHZpc2libGU6IHNldHRpbmdzLnNob3dDb21wbGV0ZWRMaXN0ICA/PyB0cnVlIH0sXG4gICAgfTtcblxuICAgIGNvbnN0IG9yZGVyOiBzdHJpbmdbXSA9IHNldHRpbmdzLnNtYXJ0TGlzdE9yZGVyPy5sZW5ndGhcbiAgICAgID8gc2V0dGluZ3Muc21hcnRMaXN0T3JkZXJcbiAgICAgIDogW1widG9kYXlcIiwgXCJzY2hlZHVsZWRcIiwgXCJhbGxcIiwgXCJmbGFnZ2VkXCIsIFwiY29tcGxldGVkXCJdO1xuXG4gICAgLy8gRW5zdXJlIGFueSBJRHMgbm90IGluIHNhdmVkIG9yZGVyIGFyZSBhcHBlbmRlZCAoZnV0dXJlLXByb29mKVxuICAgIGZvciAoY29uc3QgaWQgb2YgT2JqZWN0LmtleXMoYWxsVGlsZXMpKSB7XG4gICAgICBpZiAoIW9yZGVyLmluY2x1ZGVzKGlkKSkgb3JkZXIucHVzaChpZCk7XG4gICAgfVxuXG4gICAgbGV0IGRyYWdTcmNJZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgICBmb3IgKGNvbnN0IGlkIG9mIG9yZGVyKSB7XG4gICAgICBjb25zdCB0aWxlID0gYWxsVGlsZXNbaWRdO1xuICAgICAgaWYgKCF0aWxlIHx8ICF0aWxlLnZpc2libGUpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCB0ID0gdGlsZXNHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlXCIpO1xuICAgICAgdC5kYXRhc2V0LnRpbGVJZCA9IGlkO1xuICAgICAgdC5kcmFnZ2FibGUgPSB0cnVlO1xuICAgICAgdC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aWxlLmNvbG9yO1xuICAgICAgaWYgKGlkID09PSB0aGlzLmN1cnJlbnRMaXN0SWQpIHQuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG5cbiAgICAgIGNvbnN0IHRvcFJvdyA9IHQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtdG9wXCIpO1xuICAgICAgdG9wUm93LmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlLWNvdW50XCIpLnNldFRleHQoU3RyaW5nKHRpbGUuY291bnQpKTtcblxuICAgICAgaWYgKHRpbGUuYmFkZ2UgPiAwKSB7XG4gICAgICAgIGNvbnN0IGJhZGdlID0gdG9wUm93LmNyZWF0ZURpdihcImNocm9uaWNsZS10aWxlLWJhZGdlXCIpO1xuICAgICAgICBiYWRnZS5zZXRUZXh0KFN0cmluZyh0aWxlLmJhZGdlKSk7XG4gICAgICAgIGJhZGdlLnRpdGxlID0gYCR7dGlsZS5iYWRnZX0gb3ZlcmR1ZWA7XG4gICAgICB9XG5cbiAgICAgIHQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbGUtbGFiZWxcIikuc2V0VGV4dCh0aWxlLmxhYmVsKTtcblxuICAgICAgdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmN1cnJlbnRMaXN0SWQgPSBpZDsgdGhpcy5yZW5kZXIoKTsgfSk7XG5cbiAgICAgIC8vIFx1MjUwMFx1MjUwMCBEcmFnLWFuZC1kcm9wIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgICAgdC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIChlKSA9PiB7XG4gICAgICAgIGRyYWdTcmNJZCA9IGlkO1xuICAgICAgICB0LmFkZENsYXNzKFwiY2hyb25pY2xlLXRpbGUtZHJhZ2dpbmdcIik7XG4gICAgICAgIGUuZGF0YVRyYW5zZmVyPy5zZXREYXRhKFwidGV4dC9wbGFpblwiLCBpZCk7XG4gICAgICB9KTtcbiAgICAgIHQuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgKCkgPT4ge1xuICAgICAgICB0LnJlbW92ZUNsYXNzKFwiY2hyb25pY2xlLXRpbGUtZHJhZ2dpbmdcIik7XG4gICAgICAgIHRpbGVzR3JpZC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNocm9uaWNsZS10aWxlLWRyYWctb3ZlclwiKS5mb3JFYWNoKGVsID0+IGVsLnJlbW92ZUNsYXNzKFwiY2hyb25pY2xlLXRpbGUtZHJhZy1vdmVyXCIpKTtcbiAgICAgIH0pO1xuICAgICAgdC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoZHJhZ1NyY0lkICYmIGRyYWdTcmNJZCAhPT0gaWQpIHtcbiAgICAgICAgICB0aWxlc0dyaWQucXVlcnlTZWxlY3RvckFsbChcIi5jaHJvbmljbGUtdGlsZS1kcmFnLW92ZXJcIikuZm9yRWFjaChlbCA9PiBlbC5yZW1vdmVDbGFzcyhcImNocm9uaWNsZS10aWxlLWRyYWctb3ZlclwiKSk7XG4gICAgICAgICAgdC5hZGRDbGFzcyhcImNocm9uaWNsZS10aWxlLWRyYWctb3ZlclwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0LmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKCFkcmFnU3JjSWQgfHwgZHJhZ1NyY0lkID09PSBpZCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBuZXdPcmRlciA9IFsuLi5vcmRlcl07XG4gICAgICAgIGNvbnN0IHNyY0lkeCAgPSBuZXdPcmRlci5pbmRleE9mKGRyYWdTcmNJZCk7XG4gICAgICAgIGNvbnN0IGRzdElkeCAgPSBuZXdPcmRlci5pbmRleE9mKGlkKTtcbiAgICAgICAgaWYgKHNyY0lkeCAhPT0gLTEgJiYgZHN0SWR4ICE9PSAtMSkge1xuICAgICAgICAgIG5ld09yZGVyLnNwbGljZShzcmNJZHgsIDEpO1xuICAgICAgICAgIG5ld09yZGVyLnNwbGljZShkc3RJZHgsIDAsIGRyYWdTcmNJZCk7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc21hcnRMaXN0T3JkZXIgPSBuZXdPcmRlcjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICAgIGRyYWdTcmNJZCA9IG51bGw7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGxpc3Qgd2FzIGhpZGRlbiwgZmFsbCBiYWNrIHRvIGZpcnN0IHZpc2libGVcbiAgICBpZiAoYWxsVGlsZXNbdGhpcy5jdXJyZW50TGlzdElkXSAmJiAhYWxsVGlsZXNbdGhpcy5jdXJyZW50TGlzdElkXS52aXNpYmxlKSB7XG4gICAgICB0aGlzLmN1cnJlbnRMaXN0SWQgPSBvcmRlci5maW5kKGlkID0+IGFsbFRpbGVzW2lkXT8udmlzaWJsZSkgPz8gXCJ0b2RheVwiO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBNeSBMaXN0cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBsaXN0c1NlY3Rpb24gPSBzaWRlYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0cy1zZWN0aW9uXCIpO1xuICAgIGxpc3RzU2VjdGlvbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtc2VjdGlvbi1sYWJlbFwiKS5zZXRUZXh0KFwiTXkgTGlzdHNcIik7XG5cbiAgICBmb3IgKGNvbnN0IGxpc3Qgb2YgbGlzdHMpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGxpc3RzU2VjdGlvbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1yb3dcIik7XG4gICAgICBpZiAobGlzdC5pZCA9PT0gdGhpcy5jdXJyZW50TGlzdElkKSByb3cuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG5cbiAgICAgIGNvbnN0IGRvdCA9IHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbGlzdC1kb3RcIik7XG4gICAgICBkb3Quc3R5bGUuYmFja2dyb3VuZENvbG9yID0gbGlzdC5jb2xvcjtcblxuICAgICAgcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LW5hbWVcIikuc2V0VGV4dChsaXN0Lm5hbWUpO1xuXG4gICAgICBjb25zdCBsaXN0Q291bnQgPSBhbGwuZmlsdGVyKHIgPT4gci5saXN0SWQgPT09IGxpc3QuaWQgJiYgci5zdGF0dXMgIT09IFwiZG9uZVwiKS5sZW5ndGg7XG4gICAgICBpZiAobGlzdENvdW50ID4gMCkgcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LWNvdW50XCIpLnNldFRleHQoU3RyaW5nKGxpc3RDb3VudCkpO1xuXG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50TGlzdElkID0gbGlzdC5pZDsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE1haW4gcGFuZWwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgYXdhaXQgdGhpcy5yZW5kZXJNYWluUGFuZWwobWFpbiwgYWxsLCBvdmVyZHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVuZGVyTWFpblBhbmVsKFxuICAgIG1haW46IEhUTUxFbGVtZW50LFxuICAgIGFsbDogQ2hyb25pY2xlUmVtaW5kZXJbXSxcbiAgICBvdmVyZHVlOiBDaHJvbmljbGVSZW1pbmRlcltdXG4gICkge1xuICAgIGNvbnN0IGhlYWRlciAgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluLWhlYWRlclwiKTtcbiAgICBjb25zdCB0aXRsZUVsID0gaGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1tYWluLXRpdGxlXCIpO1xuXG4gICAgbGV0IHJlbWluZGVyczogQ2hyb25pY2xlUmVtaW5kZXJbXSA9IFtdO1xuXG4gICAgY29uc3QgU01BUlRfTElTVF9JRFMgPSBbXCJ0b2RheVwiLCBcInNjaGVkdWxlZFwiLCBcImFsbFwiLCBcImZsYWdnZWRcIiwgXCJjb21wbGV0ZWRcIl07XG4gICAgY29uc3QgU01BUlRfTEFCRUxTOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgdG9kYXk6IFwiVG9kYXlcIiwgc2NoZWR1bGVkOiBcIlNjaGVkdWxlZFwiLCBhbGw6IFwiQWxsXCIsXG4gICAgICBmbGFnZ2VkOiBcIkZsYWdnZWRcIiwgY29tcGxldGVkOiBcIkNvbXBsZXRlZFwiLFxuICAgIH07XG5cbiAgICBpZiAoU01BUlRfTElTVF9JRFMuaW5jbHVkZXModGhpcy5jdXJyZW50TGlzdElkKSkge1xuICAgICAgdGl0bGVFbC5zZXRUZXh0KFNNQVJUX0xBQkVMU1t0aGlzLmN1cnJlbnRMaXN0SWRdKTtcbiAgICAgIHRpdGxlRWwuc3R5bGUuY29sb3IgPSBcInZhcigtLXRleHQtbm9ybWFsKVwiO1xuXG4gICAgICBzd2l0Y2ggKHRoaXMuY3VycmVudExpc3RJZCkge1xuICAgICAgICBjYXNlIFwidG9kYXlcIjpcbiAgICAgICAgICByZW1pbmRlcnMgPSBbLi4ub3ZlcmR1ZSwgLi4uKGF3YWl0IHRoaXMucmVtaW5kZXJNYW5hZ2VyLmdldER1ZVRvZGF5KCkpXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInNjaGVkdWxlZFwiOlxuICAgICAgICAgIHJlbWluZGVycyA9IGF3YWl0IHRoaXMucmVtaW5kZXJNYW5hZ2VyLmdldFNjaGVkdWxlZCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZmxhZ2dlZFwiOlxuICAgICAgICAgIHJlbWluZGVycyA9IGF3YWl0IHRoaXMucmVtaW5kZXJNYW5hZ2VyLmdldEZsYWdnZWQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImFsbFwiOlxuICAgICAgICAgIHJlbWluZGVycyA9IGFsbC5maWx0ZXIociA9PiByLnN0YXR1cyAhPT0gXCJkb25lXCIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiY29tcGxldGVkXCI6XG4gICAgICAgICAgcmVtaW5kZXJzID0gYWxsLmZpbHRlcihyID0+IHIuc3RhdHVzID09PSBcImRvbmVcIik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGxpc3QgPSB0aGlzLmxpc3RNYW5hZ2VyLmdldEJ5SWQodGhpcy5jdXJyZW50TGlzdElkKTtcbiAgICAgIHRpdGxlRWwuc2V0VGV4dChsaXN0Py5uYW1lID8/IFwiTGlzdFwiKTtcbiAgICAgIHRpdGxlRWwuc3R5bGUuY29sb3IgPSBcInZhcigtLXRleHQtbm9ybWFsKVwiO1xuICAgICAgcmVtaW5kZXJzID0gYWxsLmZpbHRlcihyID0+IHIubGlzdElkID09PSB0aGlzLmN1cnJlbnRMaXN0SWQgJiYgci5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBpc0NvbXBsZXRlZCAgPSB0aGlzLmN1cnJlbnRMaXN0SWQgPT09IFwiY29tcGxldGVkXCI7XG4gICAgY29uc3QgYWN0aXZlQ291bnQgID0gaXNDb21wbGV0ZWQgPyByZW1pbmRlcnMgOiByZW1pbmRlcnMuZmlsdGVyKHIgPT4gci5zdGF0dXMgIT09IFwiZG9uZVwiKTtcbiAgICBjb25zdCBzaG93U3VidGl0bGUgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93UmVtaW5kZXJDb3VudFN1YnRpdGxlID8/IHRydWU7XG4gICAgaWYgKGFjdGl2ZUNvdW50Lmxlbmd0aCA+IDAgJiYgc2hvd1N1YnRpdGxlKSB7XG4gICAgICBjb25zdCBzdWJ0aXRsZSA9IGhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWFpbi1zdWJ0aXRsZVwiKTtcbiAgICAgIGlmIChpc0NvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCBjbGVhckJ0biA9IHN1YnRpdGxlLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgICBjbHM6IFwiY2hyb25pY2xlLWNsZWFyLWJ0blwiLCB0ZXh0OiBcIkNsZWFyIGFsbFwiXG4gICAgICAgIH0pO1xuICAgICAgICBjbGVhckJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGFsbDIgPSBhd2FpdCB0aGlzLnJlbWluZGVyTWFuYWdlci5nZXRBbGwoKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IHIgb2YgYWxsMi5maWx0ZXIociA9PiByLnN0YXR1cyA9PT0gXCJkb25lXCIpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlbWluZGVyTWFuYWdlci5kZWxldGUoci5pZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3VidGl0bGUuc2V0VGV4dChcbiAgICAgICAgICBgJHthY3RpdmVDb3VudC5sZW5ndGh9ICR7YWN0aXZlQ291bnQubGVuZ3RoID09PSAxID8gXCJyZW1pbmRlclwiIDogXCJyZW1pbmRlcnNcIn1gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdEVsID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtcmVtaW5kZXItbGlzdFwiKTtcblxuICAgIGlmIChyZW1pbmRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnJlbmRlckVtcHR5U3RhdGUobGlzdEVsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZ3JvdXBzID0gdGhpcy5ncm91cFJlbWluZGVycyhyZW1pbmRlcnMpO1xuICAgICAgZm9yIChjb25zdCBbZ3JvdXAsIGdyb3VwUmVtaW5kZXJzXSBvZiBPYmplY3QuZW50cmllcyhncm91cHMpKSB7XG4gICAgICAgIGlmIChncm91cFJlbWluZGVycy5sZW5ndGggPT09IDApIGNvbnRpbnVlO1xuICAgICAgICBsaXN0RWwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWdyb3VwLWxhYmVsXCIpLnNldFRleHQoZ3JvdXApO1xuICAgICAgICBjb25zdCBjYXJkID0gbGlzdEVsLmNyZWF0ZURpdihcImNocm9uaWNsZS1yZW1pbmRlci1jYXJkLWdyb3VwXCIpO1xuICAgICAgICBmb3IgKGNvbnN0IHJlbWluZGVyIG9mIGdyb3VwUmVtaW5kZXJzKSB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJSZW1pbmRlclJvdyhjYXJkLCByZW1pbmRlcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckVtcHR5U3RhdGUoY29udGFpbmVyOiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IGVtcHR5ID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1lbXB0eS1zdGF0ZVwiKTtcbiAgICBjb25zdCBpY29uICA9IGVtcHR5LmNyZWF0ZURpdihcImNocm9uaWNsZS1lbXB0eS1pY29uXCIpO1xuICAgIGljb24uaW5uZXJIVE1MID0gYDxzdmcgd2lkdGg9XCI0OFwiIGhlaWdodD1cIjQ4XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS4yXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+PHBhdGggZD1cIk0yMiAxMS4wOFYxMmExMCAxMCAwIDEgMS01LjkzLTkuMTRcIi8+PHBvbHlsaW5lIHBvaW50cz1cIjIyIDQgMTIgMTQuMDEgOSAxMS4wMVwiLz48L3N2Zz5gO1xuICAgIGVtcHR5LmNyZWF0ZURpdihcImNocm9uaWNsZS1lbXB0eS10aXRsZVwiKS5zZXRUZXh0KFwiQWxsIGRvbmVcIik7XG4gICAgZW1wdHkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWVtcHR5LXN1YnRpdGxlXCIpLnNldFRleHQoXCJOb3RoaW5nIGxlZnQgaW4gdGhpcyBsaXN0LlwiKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyUmVtaW5kZXJSb3coY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcmVtaW5kZXI6IENocm9uaWNsZVJlbWluZGVyKSB7XG4gICAgY29uc3Qgcm93ICAgICAgID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1yZW1pbmRlci1yb3dcIik7XG4gICAgY29uc3QgaXNEb25lICAgID0gcmVtaW5kZXIuc3RhdHVzID09PSBcImRvbmVcIjtcbiAgICBjb25zdCBpc0FyY2hpdmUgPSB0aGlzLmN1cnJlbnRMaXN0SWQgPT09IFwiY29tcGxldGVkXCI7XG5cbiAgICAvLyBDaGVja2JveFxuICAgIGNvbnN0IGNoZWNrYm94V3JhcCA9IHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2hlY2tib3gtd3JhcFwiKTtcbiAgICBjb25zdCBjaGVja2JveCAgICAgPSBjaGVja2JveFdyYXAuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNoZWNrYm94XCIpO1xuICAgIGlmIChpc0RvbmUpIGNoZWNrYm94LmFkZENsYXNzKFwiZG9uZVwiKTtcbiAgICBjaGVja2JveC5pbm5lckhUTUwgPSBgPHN2ZyBjbGFzcz1cImNocm9uaWNsZS1jaGVja21hcmtcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIjZmZmXCIgc3Ryb2tlLXdpZHRoPVwiM1wiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPjxwb2x5bGluZSBwb2ludHM9XCIyMCA2IDkgMTcgNCAxMlwiLz48L3N2Zz5gO1xuXG4gICAgY2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgY2hlY2tib3guYWRkQ2xhc3MoXCJjb21wbGV0aW5nXCIpO1xuICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMucmVtaW5kZXJNYW5hZ2VyLnVwZGF0ZSh7XG4gICAgICAgICAgLi4ucmVtaW5kZXIsXG4gICAgICAgICAgc3RhdHVzOiAgICAgIGlzRG9uZSA/IFwidG9kb1wiIDogXCJkb25lXCIsXG4gICAgICAgICAgY29tcGxldGVkQXQ6IGlzRG9uZSA/IHVuZGVmaW5lZCA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgfSk7XG4gICAgICB9LCAzMDApO1xuICAgIH0pO1xuXG4gICAgLy8gQ29udGVudFxuICAgIGNvbnN0IGNvbnRlbnQgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXJlbWluZGVyLWNvbnRlbnRcIik7XG4gICAgaWYgKCFpc0FyY2hpdmUpIGNvbnRlbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIG5ldyBSZW1pbmRlckRldGFpbFBvcHVwKFxuICAgICAgICB0aGlzLmFwcCwgcmVtaW5kZXIsIHRoaXMubGlzdE1hbmFnZXIsXG4gICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRpbWVGb3JtYXQsXG4gICAgICAgICgpID0+IHRoaXMub3BlblJlbWluZGVyRm9ybShyZW1pbmRlcilcbiAgICAgICkub3BlbigpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgdGl0bGVFbCA9IGNvbnRlbnQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXJlbWluZGVyLXRpdGxlXCIpO1xuICAgIHRpdGxlRWwuc2V0VGV4dChyZW1pbmRlci50aXRsZSk7XG4gICAgaWYgKGlzRG9uZSkgdGl0bGVFbC5hZGRDbGFzcyhcImRvbmVcIik7XG5cbiAgICAvLyBNZXRhIHJvd1xuICAgIGNvbnN0IHRvZGF5ID0gdG9kYXlTdHIoKTtcbiAgICBjb25zdCBtZXRhUm93ICA9IGNvbnRlbnQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXJlbWluZGVyLW1ldGFcIik7XG5cbiAgICBpZiAoaXNBcmNoaXZlICYmIHJlbWluZGVyLmNvbXBsZXRlZEF0KSB7XG4gICAgICBjb25zdCBjb21wbGV0ZWREYXRlID0gbmV3IERhdGUocmVtaW5kZXIuY29tcGxldGVkQXQpO1xuICAgICAgbWV0YVJvdy5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXJlbWluZGVyLWRhdGVcIikuc2V0VGV4dChcbiAgICAgICAgXCJDb21wbGV0ZWQgXCIgKyBjb21wbGV0ZWREYXRlLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHtcbiAgICAgICAgICBtb250aDogXCJzaG9ydFwiLCBkYXk6IFwibnVtZXJpY1wiLCB5ZWFyOiBcIm51bWVyaWNcIlxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHJlbWluZGVyLmR1ZURhdGUgfHwgcmVtaW5kZXIubGlzdElkKSB7XG4gICAgICBpZiAocmVtaW5kZXIuZHVlRGF0ZSkge1xuICAgICAgICBjb25zdCBtZXRhRGF0ZSA9IG1ldGFSb3cuY3JlYXRlU3BhbihcImNocm9uaWNsZS1yZW1pbmRlci1kYXRlXCIpO1xuICAgICAgICBtZXRhRGF0ZS5zZXRUZXh0KGZvcm1hdERhdGVSZWxhdGl2ZShyZW1pbmRlci5kdWVEYXRlKSk7XG4gICAgICAgIGlmIChyZW1pbmRlci5kdWVEYXRlIDwgdG9kYXkpIG1ldGFEYXRlLmFkZENsYXNzKFwib3ZlcmR1ZVwiKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZW1pbmRlci5saXN0SWQpIHtcbiAgICAgICAgY29uc3QgbGlzdCA9IHRoaXMubGlzdE1hbmFnZXIuZ2V0QnlJZChyZW1pbmRlci5saXN0SWQpO1xuICAgICAgICBpZiAobGlzdCkge1xuICAgICAgICAgIGNvbnN0IGxpc3REb3QgPSBtZXRhUm93LmNyZWF0ZVNwYW4oXCJjaHJvbmljbGUtcmVtaW5kZXItY2FsLWRvdFwiKTtcbiAgICAgICAgICBsaXN0RG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGxpc3QuY29sb3I7XG4gICAgICAgICAgbWV0YVJvdy5jcmVhdGVTcGFuKFwiY2hyb25pY2xlLXJlbWluZGVyLWNhbC1uYW1lXCIpLnNldFRleHQobGlzdC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFByaW9yaXR5IGZsYWdcbiAgICBpZiAoIWlzQXJjaGl2ZSAmJiByZW1pbmRlci5wcmlvcml0eSA9PT0gXCJoaWdoXCIpIHtcbiAgICAgIHJvdy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZmxhZ1wiKS5zZXRUZXh0KFwiXHUyNjkxXCIpO1xuICAgIH1cblxuICAgIC8vIEFyY2hpdmUgYWN0aW9uc1xuICAgIGlmIChpc0FyY2hpdmUpIHtcbiAgICAgIGNvbnN0IGFjdGlvbnMgPSByb3cuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWFyY2hpdmUtYWN0aW9uc1wiKTtcbiAgICAgIGNvbnN0IHJlc3RvcmVCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNocm9uaWNsZS1hcmNoaXZlLWJ0blwiLCB0ZXh0OiBcIlJlc3RvcmVcIiB9KTtcbiAgICAgIHJlc3RvcmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVtaW5kZXJNYW5hZ2VyLnVwZGF0ZSh7IC4uLnJlbWluZGVyLCBzdGF0dXM6IFwidG9kb1wiLCBjb21wbGV0ZWRBdDogdW5kZWZpbmVkIH0pO1xuICAgICAgfSk7XG4gICAgICBjb25zdCBkZWxldGVCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNocm9uaWNsZS1hcmNoaXZlLWJ0biBjaHJvbmljbGUtYXJjaGl2ZS1idG4tZGVsZXRlXCIsIHRleHQ6IFwiRGVsZXRlXCIgfSk7XG4gICAgICBkZWxldGVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGF3YWl0IHRoaXMucmVtaW5kZXJNYW5hZ2VyLmRlbGV0ZShyZW1pbmRlci5pZCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSaWdodC1jbGljayBjb250ZXh0IG1lbnVcbiAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBtZW51ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG1lbnUuY2xhc3NOYW1lICA9IFwiY2hyb25pY2xlLWNvbnRleHQtbWVudVwiO1xuICAgICAgbWVudS5zdHlsZS5sZWZ0ID0gYCR7ZS5jbGllbnRYfXB4YDtcbiAgICAgIG1lbnUuc3R5bGUudG9wICA9IGAke2UuY2xpZW50WX1weGA7XG5cbiAgICAgIGNvbnN0IGVkaXRJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtXCIpO1xuICAgICAgZWRpdEl0ZW0uc2V0VGV4dChcIkVkaXQgcmVtaW5kZXJcIik7XG4gICAgICBlZGl0SXRlbS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyBtZW51LnJlbW92ZSgpOyB0aGlzLm9wZW5SZW1pbmRlckZvcm0ocmVtaW5kZXIpOyB9KTtcblxuICAgICAgY29uc3QgZGVsZXRlSXRlbSA9IG1lbnUuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbnRleHQtaXRlbSBjaHJvbmljbGUtY29udGV4dC1kZWxldGVcIik7XG4gICAgICBkZWxldGVJdGVtLnNldFRleHQoXCJEZWxldGUgcmVtaW5kZXJcIik7XG4gICAgICBkZWxldGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7IG1lbnUucmVtb3ZlKCk7IGF3YWl0IHRoaXMucmVtaW5kZXJNYW5hZ2VyLmRlbGV0ZShyZW1pbmRlci5pZCk7IH0pO1xuXG4gICAgICBjb25zdCBjYW5jZWxJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtXCIpO1xuICAgICAgY2FuY2VsSXRlbS5zZXRUZXh0KFwiQ2FuY2VsXCIpO1xuICAgICAgY2FuY2VsSXRlbS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gbWVudS5yZW1vdmUoKSk7XG5cbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobWVudSk7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBtZW51LnJlbW92ZSgpLCB7IG9uY2U6IHRydWUgfSksIDApO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBncm91cFJlbWluZGVycyhyZW1pbmRlcnM6IENocm9uaWNsZVJlbWluZGVyW10pOiBSZWNvcmQ8c3RyaW5nLCBDaHJvbmljbGVSZW1pbmRlcltdPiB7XG4gICAgY29uc3QgdG9kYXkgICAgPSB0b2RheVN0cigpO1xuICAgIGNvbnN0IG5leHRXZWVrID0gbmV3IERhdGUoRGF0ZS5ub3coKSArIDcgKiA4NjQwMDAwMCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3Qgd2Vla0FnbyAgPSBuZXcgRGF0ZShEYXRlLm5vdygpIC0gNyAqIDg2NDAwMDAwKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIGlmICh0aGlzLmN1cnJlbnRMaXN0SWQgPT09IFwiY29tcGxldGVkXCIpIHtcbiAgICAgIGNvbnN0IGdyb3VwczogUmVjb3JkPHN0cmluZywgQ2hyb25pY2xlUmVtaW5kZXJbXT4gPSB7IFwiVG9kYXlcIjogW10sIFwiVGhpcyB3ZWVrXCI6IFtdLCBcIkVhcmxpZXJcIjogW10gfTtcbiAgICAgIGZvciAoY29uc3QgcmVtaW5kZXIgb2YgcmVtaW5kZXJzKSB7XG4gICAgICAgIGNvbnN0IGQgPSByZW1pbmRlci5jb21wbGV0ZWRBdD8uc3BsaXQoXCJUXCIpWzBdID8/IFwiXCI7XG4gICAgICAgIGlmIChkID09PSB0b2RheSkgICAgICAgZ3JvdXBzW1wiVG9kYXlcIl0ucHVzaChyZW1pbmRlcik7XG4gICAgICAgIGVsc2UgaWYgKGQgPj0gd2Vla0FnbykgZ3JvdXBzW1wiVGhpcyB3ZWVrXCJdLnB1c2gocmVtaW5kZXIpO1xuICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgIGdyb3Vwc1tcIkVhcmxpZXJcIl0ucHVzaChyZW1pbmRlcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ3JvdXBzO1xuICAgIH1cblxuICAgIGNvbnN0IGdyb3VwczogUmVjb3JkPHN0cmluZywgQ2hyb25pY2xlUmVtaW5kZXJbXT4gPSB7XG4gICAgICBcIk92ZXJkdWVcIjogW10sIFwiVG9kYXlcIjogW10sIFwiVGhpcyB3ZWVrXCI6IFtdLCBcIkxhdGVyXCI6IFtdLCBcIk5vIGRhdGVcIjogW10sXG4gICAgfTtcbiAgICBmb3IgKGNvbnN0IHJlbWluZGVyIG9mIHJlbWluZGVycykge1xuICAgICAgaWYgKHJlbWluZGVyLnN0YXR1cyA9PT0gXCJkb25lXCIpIGNvbnRpbnVlO1xuICAgICAgaWYgKCFyZW1pbmRlci5kdWVEYXRlKSAgICAgICAgICAgICAgICAgIHsgZ3JvdXBzW1wiTm8gZGF0ZVwiXS5wdXNoKHJlbWluZGVyKTsgICBjb250aW51ZTsgfVxuICAgICAgaWYgKHJlbWluZGVyLmR1ZURhdGUgPCB0b2RheSkgICAgICAgICAgICB7IGdyb3Vwc1tcIk92ZXJkdWVcIl0ucHVzaChyZW1pbmRlcik7ICAgY29udGludWU7IH1cbiAgICAgIGlmIChyZW1pbmRlci5kdWVEYXRlID09PSB0b2RheSkgICAgICAgICAgeyBncm91cHNbXCJUb2RheVwiXS5wdXNoKHJlbWluZGVyKTsgICAgIGNvbnRpbnVlOyB9XG4gICAgICBpZiAocmVtaW5kZXIuZHVlRGF0ZSA8PSBuZXh0V2VlaykgICAgICAgIHsgZ3JvdXBzW1wiVGhpcyB3ZWVrXCJdLnB1c2gocmVtaW5kZXIpOyBjb250aW51ZTsgfVxuICAgICAgZ3JvdXBzW1wiTGF0ZXJcIl0ucHVzaChyZW1pbmRlcik7XG4gICAgfVxuICAgIHJldHVybiBncm91cHM7XG4gIH1cblxuXG4gIGFzeW5jIG9wZW5SZW1pbmRlckZvcm0ocmVtaW5kZXI/OiBDaHJvbmljbGVSZW1pbmRlcikge1xuICAgIG5ldyBSZW1pbmRlck1vZGFsKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLnJlbWluZGVyTWFuYWdlcixcbiAgICAgIHRoaXMubGlzdE1hbmFnZXIsXG4gICAgICByZW1pbmRlcixcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgIChyKSA9PiB0aGlzLm9wZW5SZW1pbmRlckZ1bGxQYWdlKHIpLFxuICAgICAgdGhpcy5wbHVnaW5cbiAgICApLm9wZW4oKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5SZW1pbmRlckZ1bGxQYWdlKHJlbWluZGVyPzogQ2hyb25pY2xlUmVtaW5kZXIpIHtcbiAgICBjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFJFTUlOREVSX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBpZiAoZXhpc3RpbmcpIGV4aXN0aW5nLmRldGFjaCgpO1xuICAgIGNvbnN0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IFJFTUlOREVSX0ZPUk1fVklFV19UWVBFLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7XG4gICAgY29uc3QgZm9ybUxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFJFTUlOREVSX0ZPUk1fVklFV19UWVBFKVswXTtcbiAgICBjb25zdCBmb3JtVmlldyA9IGZvcm1MZWFmPy52aWV3IGFzIFJlbWluZGVyRm9ybVZpZXcgfCB1bmRlZmluZWQ7XG4gICAgaWYgKGZvcm1WaWV3ICYmIHJlbWluZGVyKSBmb3JtVmlldy5sb2FkUmVtaW5kZXIocmVtaW5kZXIpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVSZW1pbmRlciwgUmVtaW5kZXJTdGF0dXMsIFJlbWluZGVyUHJpb3JpdHksIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSBDaHJvbmljbGVQbHVnaW4gZnJvbSBcIi4uL21haW5cIjtcbmltcG9ydCB7IFJlbWluZGVyTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL1JlbWluZGVyTWFuYWdlclwiO1xuaW1wb3J0IHsgTGlzdE1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9MaXN0TWFuYWdlclwiO1xuaW1wb3J0IHsgYnVpbGRUYWdGaWVsZCB9IGZyb20gXCIuL3RhZ0ZpZWxkXCI7XG5pbXBvcnQgeyBBTEVSVF9PUFRJT05TLCBSRUNVUlJFTkNFX09QVElPTlMsIFNUQVRVU19PUFRJT05TLCBQUklPUklUWV9PUFRJT05TIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnN0YW50c1wiO1xuXG5leHBvcnQgY2xhc3MgUmVtaW5kZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZW1pbmRlck1hbmFnZXI6IFJlbWluZGVyTWFuYWdlcjtcbiAgcHJpdmF0ZSBsaXN0TWFuYWdlcjogTGlzdE1hbmFnZXI7XG4gIHByaXZhdGUgZWRpdGluZ1JlbWluZGVyOiBDaHJvbmljbGVSZW1pbmRlciB8IG51bGw7XG4gIHByaXZhdGUgb25TYXZlPzogKCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBvbkV4cGFuZD86IChyZW1pbmRlcj86IENocm9uaWNsZVJlbWluZGVyKSA9PiB2b2lkO1xuICBwcml2YXRlIHBsdWdpbj86IENocm9uaWNsZVBsdWdpbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICByZW1pbmRlck1hbmFnZXI6IFJlbWluZGVyTWFuYWdlcixcbiAgICBsaXN0TWFuYWdlcjogTGlzdE1hbmFnZXIsXG4gICAgZWRpdGluZ1JlbWluZGVyPzogQ2hyb25pY2xlUmVtaW5kZXIsXG4gICAgb25TYXZlPzogKCkgPT4gdm9pZCxcbiAgICBvbkV4cGFuZD86IChyZW1pbmRlcj86IENocm9uaWNsZVJlbWluZGVyKSA9PiB2b2lkLFxuICAgIHBsdWdpbj86IENocm9uaWNsZVBsdWdpblxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMucmVtaW5kZXJNYW5hZ2VyID0gcmVtaW5kZXJNYW5hZ2VyO1xuICAgIHRoaXMubGlzdE1hbmFnZXIgICAgID0gbGlzdE1hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nUmVtaW5kZXIgPSBlZGl0aW5nUmVtaW5kZXIgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSAgICAgICAgICA9IG9uU2F2ZTtcbiAgICB0aGlzLm9uRXhwYW5kICAgICAgICA9IG9uRXhwYW5kO1xuICAgIHRoaXMucGx1Z2luICAgICAgICAgID0gcGx1Z2luO1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImNocm9uaWNsZS1ldmVudC1tb2RhbFwiKTtcblxuICAgIGNvbnN0IHIgICAgID0gdGhpcy5lZGl0aW5nUmVtaW5kZXI7XG4gICAgY29uc3QgbGlzdHMgPSB0aGlzLmxpc3RNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEhlYWRlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBoZWFkZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2VtLWhlYWRlclwiKTtcbiAgICBoZWFkZXIuY3JlYXRlRGl2KFwiY2VtLXRpdGxlXCIpLnNldFRleHQociA/IFwiRWRpdCByZW1pbmRlclwiIDogXCJOZXcgcmVtaW5kZXJcIik7XG5cbiAgICBjb25zdCBleHBhbmRCdG4gPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLWdob3N0IGNlbS1leHBhbmQtYnRuXCIgfSk7XG4gICAgZXhwYW5kQnRuLnRpdGxlID0gXCJPcGVuIGFzIGZ1bGwgcGFnZVwiO1xuICAgIGV4cGFuZEJ0bi5pbm5lckhUTUwgPSBgPHN2ZyB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+PHBvbHlsaW5lIHBvaW50cz1cIjE1IDMgMjEgMyAyMSA5XCIvPjxwb2x5bGluZSBwb2ludHM9XCI5IDIxIDMgMjEgMyAxNVwiLz48bGluZSB4MT1cIjIxXCIgeTE9XCIzXCIgeDI9XCIxNFwiIHkyPVwiMTBcIi8+PGxpbmUgeDE9XCIzXCIgeTE9XCIyMVwiIHgyPVwiMTBcIiB5Mj1cIjE0XCIvPjwvc3ZnPmA7XG4gICAgZXhwYW5kQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY2xvc2UoKTsgdGhpcy5vbkV4cGFuZD8uKHIgPz8gdW5kZWZpbmVkKTsgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9ybSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb3JtID0gY29udGVudEVsLmNyZWF0ZURpdihcImNlbS1mb3JtXCIpO1xuXG4gICAgLy8gVGl0bGVcbiAgICBjb25zdCB0aXRsZUlucHV0ID0gdGhpcy5maWVsZChmb3JtLCBcIlRpdGxlXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dCBjZi10aXRsZS1pbnB1dFwiLCBwbGFjZWhvbGRlcjogXCJSZW1pbmRlciBuYW1lXCJcbiAgICB9KTtcbiAgICB0aXRsZUlucHV0LnZhbHVlID0gcj8udGl0bGUgPz8gXCJcIjtcbiAgICB0aXRsZUlucHV0LmZvY3VzKCk7XG5cbiAgICAvLyBMb2NhdGlvblxuICAgIGNvbnN0IGxvY2F0aW9uSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTG9jYXRpb25cIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIkFkZCBsb2NhdGlvblwiXG4gICAgfSk7XG4gICAgbG9jYXRpb25JbnB1dC52YWx1ZSA9IHI/LmxvY2F0aW9uID8/IFwiXCI7XG5cbiAgICAvLyBTdGF0dXMgKyBQcmlvcml0eVxuICAgIGNvbnN0IHJvdzEgPSBmb3JtLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcblxuICAgIGNvbnN0IHN0YXR1c1NlbGVjdCA9IHRoaXMuZmllbGQocm93MSwgXCJTdGF0dXNcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgZGVmYXVsdFN0YXR1cyA9IHRoaXMucGx1Z2luPy5zZXR0aW5ncz8uZGVmYXVsdFJlbWluZGVyU3RhdHVzID8/IFwidG9kb1wiO1xuICAgIGZvciAoY29uc3QgcyBvZiBTVEFUVVNfT1BUSU9OUykge1xuICAgICAgY29uc3Qgb3B0ID0gc3RhdHVzU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHMudmFsdWUsIHRleHQ6IHMubGFiZWwgfSk7XG4gICAgICBpZiAociA/IHIuc3RhdHVzID09PSBzLnZhbHVlIDogcy52YWx1ZSA9PT0gZGVmYXVsdFN0YXR1cykgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmlvcml0eVNlbGVjdCA9IHRoaXMuZmllbGQocm93MSwgXCJQcmlvcml0eVwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCBkZWZhdWx0UHJpb3JpdHkgPSB0aGlzLnBsdWdpbj8uc2V0dGluZ3M/LmRlZmF1bHRSZW1pbmRlclByaW9yaXR5ID8/IFwibm9uZVwiO1xuICAgIGZvciAoY29uc3QgcCBvZiBQUklPUklUWV9PUFRJT05TKSB7XG4gICAgICBjb25zdCBvcHQgPSBwcmlvcml0eVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBwLnZhbHVlLCB0ZXh0OiBwLmxhYmVsIH0pO1xuICAgICAgaWYgKHIgPyByLnByaW9yaXR5ID09PSBwLnZhbHVlIDogcC52YWx1ZSA9PT0gZGVmYXVsdFByaW9yaXR5KSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIER1ZSBkYXRlICsgdGltZVxuICAgIGNvbnN0IHJvdzIgPSBmb3JtLmNyZWF0ZURpdihcImNmLXJvd1wiKTtcbiAgICBjb25zdCBkdWVEYXRlSW5wdXQgPSB0aGlzLmZpZWxkKHJvdzIsIFwiRGF0ZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJkYXRlXCIsIGNsczogXCJjZi1pbnB1dFwiIH0pO1xuICAgIGR1ZURhdGVJbnB1dC52YWx1ZSA9IHI/LmR1ZURhdGUgPz8gXCJcIjtcbiAgICBjb25zdCBkdWVUaW1lSW5wdXQgPSB0aGlzLmZpZWxkKHJvdzIsIFwiVGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0aW1lXCIsIGNsczogXCJjZi1pbnB1dFwiIH0pO1xuICAgIGR1ZVRpbWVJbnB1dC52YWx1ZSA9IHI/LmR1ZVRpbWUgPz8gXCJcIjtcblxuICAgIC8vIFJlcGVhdFxuICAgIGNvbnN0IHJlY1NlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJSZXBlYXRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgZm9yIChjb25zdCByZWMgb2YgUkVDVVJSRU5DRV9PUFRJT05TKSB7XG4gICAgICBjb25zdCBvcHQgPSByZWNTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogcmVjLnZhbHVlLCB0ZXh0OiByZWMubGFiZWwgfSk7XG4gICAgICBpZiAocj8ucmVjdXJyZW5jZSA9PT0gcmVjLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIEFsZXJ0XG4gICAgY29uc3QgYWxlcnRTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQWxlcnRcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgY29uc3QgZGVmYXVsdEFsZXJ0ID0gdGhpcy5wbHVnaW4/LnNldHRpbmdzPy5kZWZhdWx0QWxlcnQgPz8gXCJub25lXCI7XG4gICAgZm9yIChjb25zdCBhIG9mIEFMRVJUX09QVElPTlMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGFsZXJ0U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IGEudmFsdWUsIHRleHQ6IGEubGFiZWwgfSk7XG4gICAgICBpZiAociA/IHIuYWxlcnQgPT09IGEudmFsdWUgOiBhLnZhbHVlID09PSBkZWZhdWx0QWxlcnQpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gTGlzdFxuICAgIGNvbnN0IGxpc3RTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTGlzdFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjb25zdCBkZWZhdWx0TGlzdElkID0gdGhpcy5wbHVnaW4/LnNldHRpbmdzPy5kZWZhdWx0TGlzdElkID8/IFwiXCI7XG4gICAgbGlzdFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBcIlwiLCB0ZXh0OiBcIk5vbmVcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGxpc3Qgb2YgbGlzdHMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGxpc3RTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogbGlzdC5pZCwgdGV4dDogbGlzdC5uYW1lIH0pO1xuICAgICAgaWYgKHIgPyByLmxpc3RJZCA9PT0gbGlzdC5pZCA6IGxpc3QuaWQgPT09IGRlZmF1bHRMaXN0SWQpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuICAgIGNvbnN0IHVwZGF0ZUxpc3RDb2xvciA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGxpc3QgPSB0aGlzLmxpc3RNYW5hZ2VyLmdldEJ5SWQobGlzdFNlbGVjdC52YWx1ZSk7XG4gICAgICBsaXN0U2VsZWN0LnN0eWxlLmJvcmRlckxlZnRDb2xvciA9IGxpc3QgPyBsaXN0LmNvbG9yIDogXCJ0cmFuc3BhcmVudFwiO1xuICAgICAgbGlzdFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0V2lkdGggPSBcIjRweFwiO1xuICAgICAgbGlzdFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0U3R5bGUgPSBcInNvbGlkXCI7XG4gICAgfTtcbiAgICBsaXN0U2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdXBkYXRlTGlzdENvbG9yKTtcbiAgICB1cGRhdGVMaXN0Q29sb3IoKTtcblxuICAgIC8vIFRhZ3NcbiAgICBjb25zdCB0YWdGaWVsZCA9IGJ1aWxkVGFnRmllbGQodGhpcy5hcHAsIHRoaXMuZmllbGQoZm9ybSwgXCJUYWdzXCIpLCByPy50YWdzID8/IFtdKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBGb290ZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgZm9vdGVyICAgID0gY29udGVudEVsLmNyZWF0ZURpdihcImNlbS1mb290ZXJcIik7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gZm9vdGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdFwiLCB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuXG4gICAgaWYgKHIgJiYgci5pZCkge1xuICAgICAgY29uc3QgZGVsZXRlQnRuID0gZm9vdGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1kZWxldGVcIiwgdGV4dDogXCJEZWxldGUgcmVtaW5kZXJcIiB9KTtcbiAgICAgIGRlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLnJlbWluZGVyTWFuYWdlci5kZWxldGUoci5pZCk7XG4gICAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2F2ZUJ0biA9IGZvb3Rlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiY2YtYnRuLXByaW1hcnlcIiwgdGV4dDogcj8uaWQgPyBcIlNhdmVcIiA6IFwiQWRkIHJlbWluZGVyXCJcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIYW5kbGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuY2xvc2UoKSk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSB0aXRsZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghdGl0bGUpIHsgdGl0bGVJbnB1dC5mb2N1cygpOyB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTsgcmV0dXJuOyB9XG5cbiAgICAgIGlmICghcj8uaWQpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLnJlbWluZGVyTWFuYWdlci5nZXRBbGwoKTtcbiAgICAgICAgY29uc3QgZHVwbGljYXRlID0gZXhpc3RpbmcuZmluZChlID0+IGUudGl0bGUudG9Mb3dlckNhc2UoKSA9PT0gdGl0bGUudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIGlmIChkdXBsaWNhdGUpIHtcbiAgICAgICAgICBuZXcgTm90aWNlKGBBIHJlbWluZGVyIG5hbWVkIFwiJHt0aXRsZX1cIiBhbHJlYWR5IGV4aXN0cy5gLCA0MDAwKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmNsYXNzTGlzdC5hZGQoXCJjZi1lcnJvclwiKTtcbiAgICAgICAgICB0aXRsZUlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlbWluZGVyRGF0YSA9IHtcbiAgICAgICAgdGl0bGUsXG4gICAgICAgIHN0YXR1czogICAgICAgICAgICAgc3RhdHVzU2VsZWN0LnZhbHVlIGFzIFJlbWluZGVyU3RhdHVzLFxuICAgICAgICBwcmlvcml0eTogICAgICAgICAgIHByaW9yaXR5U2VsZWN0LnZhbHVlIGFzIFJlbWluZGVyUHJpb3JpdHksXG4gICAgICAgIGR1ZURhdGU6ICAgICAgICAgICAgZHVlRGF0ZUlucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgZHVlVGltZTogICAgICAgICAgICBkdWVUaW1lSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBsaXN0SWQ6ICAgICAgICAgICAgIGxpc3RTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICByZWN1cnJlbmNlOiAgICAgICAgIHJlY1NlbGVjdC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGFsZXJ0OiAgICAgICAgICAgICAgYWxlcnRTZWxlY3QudmFsdWUgYXMgQWxlcnRPZmZzZXQsXG4gICAgICAgIGxvY2F0aW9uOiAgICAgICAgICAgbG9jYXRpb25JbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgdGFnRmllbGQuZ2V0VGFncygpLFxuICAgICAgICBub3RlczogICAgICAgICAgICAgIHI/Lm5vdGVzLFxuICAgICAgICBsaW5rZWROb3RlczogICAgICAgIHI/LmxpbmtlZE5vdGVzID8/IFtdLFxuICAgICAgICBwcm9qZWN0czogICAgICAgICAgIHI/LnByb2plY3RzID8/IFtdLFxuICAgICAgICB0aW1lRXN0aW1hdGU6ICAgICAgIHI/LnRpbWVFc3RpbWF0ZSxcbiAgICAgICAgdGltZUVudHJpZXM6ICAgICAgICByPy50aW1lRW50cmllcyA/PyBbXSxcbiAgICAgICAgY3VzdG9tRmllbGRzOiAgICAgICByPy5jdXN0b21GaWVsZHMgPz8gW10sXG4gICAgICAgIGNvbXBsZXRlZEluc3RhbmNlczogcj8uY29tcGxldGVkSW5zdGFuY2VzID8/IFtdLFxuICAgICAgfTtcblxuICAgICAgaWYgKHI/LmlkKSB7XG4gICAgICAgIGF3YWl0IHRoaXMucmVtaW5kZXJNYW5hZ2VyLnVwZGF0ZSh7IC4uLnIsIC4uLnJlbWluZGVyRGF0YSB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IHRoaXMucmVtaW5kZXJNYW5hZ2VyLmNyZWF0ZShyZW1pbmRlckRhdGEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm9uU2F2ZT8uKCk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhhbmRsZVNhdmUpO1xuICAgIHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGUpID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiKSBoYW5kbGVTYXZlKCk7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiRXNjYXBlXCIpIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7IHRoaXMuY29udGVudEVsLmVtcHR5KCk7IH1cblxuICBwcml2YXRlIGZpZWxkKHBhcmVudDogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3Qgd3JhcCA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZi1maWVsZFwiKTtcbiAgICB3cmFwLmNyZWF0ZURpdihcImNmLWxhYmVsXCIpLnNldFRleHQobGFiZWwpO1xuICAgIHJldHVybiB3cmFwO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQ2hyb25pY2xlUmVtaW5kZXIgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IExpc3RNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvTGlzdE1hbmFnZXJcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVGdWxsLCBmb3JtYXRSZWN1cnJlbmNlLCBmb3JtYXRBbGVydCwgZm9ybWF0U3RhdHVzLCBmb3JtYXRQcmlvcml0eSwgZm9ybWF0RHVyYXRpb24gfSBmcm9tIFwiLi4vdXRpbHMvZm9ybWF0dGVyc1wiO1xuXG5leHBvcnQgY2xhc3MgUmVtaW5kZXJEZXRhaWxQb3B1cCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZW1pbmRlcjogQ2hyb25pY2xlUmVtaW5kZXI7XG4gIHByaXZhdGUgbGlzdE1hbmFnZXI6IExpc3RNYW5hZ2VyO1xuICBwcml2YXRlIHRpbWVGb3JtYXQ6IFwiMTJoXCIgfCBcIjI0aFwiO1xuICBwcml2YXRlIG9uRWRpdDogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICByZW1pbmRlcjogQ2hyb25pY2xlUmVtaW5kZXIsXG4gICAgbGlzdE1hbmFnZXI6IExpc3RNYW5hZ2VyLFxuICAgIHRpbWVGb3JtYXQ6IFwiMTJoXCIgfCBcIjI0aFwiLFxuICAgIG9uRWRpdDogKCkgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMucmVtaW5kZXIgICAgPSByZW1pbmRlcjtcbiAgICB0aGlzLmxpc3RNYW5hZ2VyID0gbGlzdE1hbmFnZXI7XG4gICAgdGhpcy50aW1lRm9ybWF0ICA9IHRpbWVGb3JtYXQ7XG4gICAgdGhpcy5vbkVkaXQgICAgICA9IG9uRWRpdDtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJjZHAtbW9kYWxcIik7XG5cbiAgICBjb25zdCByID0gdGhpcy5yZW1pbmRlcjtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIZWFkZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaGVhZGVyID0gY29udGVudEVsLmNyZWF0ZURpdihcImNkcC1oZWFkZXJcIik7XG4gICAgaGVhZGVyLmNyZWF0ZURpdihcImNkcC10aXRsZVwiKS5zZXRUZXh0KHIudGl0bGUpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFN0YXR1cyArIFByaW9yaXR5IGJhZGdlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBiYWRnZVJvdyA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZHAtYmFkZ2Utcm93XCIpO1xuICAgIGJhZGdlUm93LmNyZWF0ZVNwYW4oeyBjbHM6IGBjZHAtYmFkZ2UgY2RwLXN0YXR1cy0ke3Iuc3RhdHVzfWAgfSkuc2V0VGV4dChmb3JtYXRTdGF0dXMoci5zdGF0dXMpKTtcbiAgICBpZiAoci5wcmlvcml0eSAhPT0gXCJub25lXCIpIHtcbiAgICAgIGJhZGdlUm93LmNyZWF0ZVNwYW4oeyBjbHM6IGBjZHAtYmFkZ2UgY2RwLXByaW9yaXR5LSR7ci5wcmlvcml0eX1gIH0pLnNldFRleHQoZm9ybWF0UHJpb3JpdHkoci5wcmlvcml0eSkpO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBEZXRhaWwgcm93cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBib2R5ID0gY29udGVudEVsLmNyZWF0ZURpdihcImNkcC1ib2R5XCIpO1xuXG4gICAgaWYgKHIuZHVlRGF0ZSB8fCByLmR1ZVRpbWUpIHtcbiAgICAgIGNvbnN0IGRhdGVQYXJ0ID0gci5kdWVEYXRlID8gZm9ybWF0RGF0ZUZ1bGwoci5kdWVEYXRlKSA6IFwiXCI7XG4gICAgICBjb25zdCB0aW1lUGFydCA9IHIuZHVlVGltZSA/IHRoaXMuZm10VGltZShyLmR1ZVRpbWUpIDogXCJcIjtcbiAgICAgIGNvbnN0IGRpc3BsYXkgID0gW2RhdGVQYXJ0LCB0aW1lUGFydF0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oXCIgIFx1MDBCNyAgXCIpO1xuICAgICAgdGhpcy5yb3coYm9keSwgXCJBdFwiLCBkaXNwbGF5KTtcbiAgICB9XG5cbiAgICBpZiAoci5sb2NhdGlvbikgdGhpcy5yb3coYm9keSwgXCJMb2NhdGlvblwiLCByLmxvY2F0aW9uKTtcblxuICAgIGlmIChyLmxpc3RJZCkge1xuICAgICAgY29uc3QgbGlzdCA9IHRoaXMubGlzdE1hbmFnZXIuZ2V0QnlJZChyLmxpc3RJZCk7XG4gICAgICBpZiAobGlzdCkgdGhpcy5saXN0Um93KGJvZHksIGxpc3QubmFtZSwgbGlzdC5jb2xvcik7XG4gICAgfVxuXG4gICAgaWYgKHIucmVjdXJyZW5jZSkgdGhpcy5yb3coYm9keSwgXCJSZXBlYXRcIiwgZm9ybWF0UmVjdXJyZW5jZShyLnJlY3VycmVuY2UpKTtcblxuICAgIGlmIChyLmFsZXJ0ICYmIHIuYWxlcnQgIT09IFwibm9uZVwiKSB0aGlzLnJvdyhib2R5LCBcIkFsZXJ0XCIsIGZvcm1hdEFsZXJ0KHIuYWxlcnQpKTtcblxuICAgIGlmIChyLnRhZ3MubGVuZ3RoID4gMCkgdGhpcy5yb3coYm9keSwgXCJUYWdzXCIsIHIudGFncy5qb2luKFwiLCBcIikpO1xuXG4gICAgaWYgKHIucHJvamVjdHMubGVuZ3RoID4gMCkgdGhpcy5yb3coYm9keSwgXCJQcm9qZWN0c1wiLCByLnByb2plY3RzLmpvaW4oXCIsIFwiKSk7XG5cbiAgICBpZiAoci5saW5rZWROb3Rlcy5sZW5ndGggPiAwKSB0aGlzLnJvdyhib2R5LCBcIkxpbmtlZCBub3Rlc1wiLCByLmxpbmtlZE5vdGVzLmpvaW4oXCIsIFwiKSk7XG5cbiAgICBpZiAoci50aW1lRXN0aW1hdGUpIHRoaXMucm93KGJvZHksIFwiRXN0aW1hdGVcIiwgZm9ybWF0RHVyYXRpb24oci50aW1lRXN0aW1hdGUpKTtcblxuICAgIGlmIChyLm5vdGVzKSB7XG4gICAgICBjb25zdCBub3Rlc1JvdyA9IGJvZHkuY3JlYXRlRGl2KFwiY2RwLXJvdyBjZHAtbm90ZXMtcm93XCIpO1xuICAgICAgbm90ZXNSb3cuY3JlYXRlRGl2KFwiY2RwLXJvdy1sYWJlbFwiKS5zZXRUZXh0KFwiTm90ZXNcIik7XG4gICAgICBub3Rlc1Jvdy5jcmVhdGVEaXYoXCJjZHAtcm93LXZhbHVlIGNkcC1ub3Rlcy10ZXh0XCIpLnNldFRleHQoXG4gICAgICAgIHIubm90ZXMubGVuZ3RoID4gNDAwID8gci5ub3Rlcy5zbGljZSgwLCA0MDApICsgXCJcdTIwMjZcIiA6IHIubm90ZXNcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEZvb3RlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb290ZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiY2RwLWZvb3RlclwiKTtcbiAgICBmb290ZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2YtYnRuLXByaW1hcnlcIiwgdGV4dDogXCJFZGl0IHJlbWluZGVyXCIgfSlcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmNsb3NlKCk7IHRoaXMub25FZGl0KCk7IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByb3cocGFyZW50OiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICAgIGNvbnN0IHJvdyA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZHAtcm93XCIpO1xuICAgIHJvdy5jcmVhdGVEaXYoXCJjZHAtcm93LWxhYmVsXCIpLnNldFRleHQobGFiZWwpO1xuICAgIHJvdy5jcmVhdGVEaXYoXCJjZHAtcm93LXZhbHVlXCIpLnNldFRleHQodmFsdWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBsaXN0Um93KHBhcmVudDogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZywgY29sb3I6IHN0cmluZykge1xuICAgIGNvbnN0IHJvdyA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZHAtcm93XCIpO1xuICAgIHJvdy5jcmVhdGVEaXYoXCJjZHAtcm93LWxhYmVsXCIpLnNldFRleHQoXCJMaXN0XCIpO1xuICAgIGNvbnN0IHZhbCA9IHJvdy5jcmVhdGVEaXYoXCJjZHAtcm93LXZhbHVlIGNkcC1jYWwtdmFsdWVcIik7XG4gICAgY29uc3QgZG90ID0gdmFsLmNyZWF0ZVNwYW4oXCJjZHAtY2FsLWRvdFwiKTtcbiAgICBkb3Quc3R5bGUuYmFja2dyb3VuZCA9IGNvbG9yO1xuICAgIHZhbC5jcmVhdGVTcGFuKCkuc2V0VGV4dChuYW1lKTtcbiAgfVxuXG4gIHByaXZhdGUgZm10VGltZSh0aW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLnRpbWVGb3JtYXQgPT09IFwiMjRoXCIpIHJldHVybiB0aW1lO1xuICAgIGNvbnN0IFtoLCBtXSA9IHRpbWUuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpO1xuICAgIGNvbnN0IHN1ZmZpeCA9IGggPj0gMTIgPyBcIlBNXCIgOiBcIkFNXCI7XG4gICAgcmV0dXJuIGAkeygoaCAlIDEyKSB8fCAxMil9OiR7U3RyaW5nKG0pLnBhZFN0YXJ0KDIsIFwiMFwiKX0gJHtzdWZmaXh9YDtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7IHRoaXMuY29udGVudEVsLmVtcHR5KCk7IH1cbn1cblxuIiwgImltcG9ydCB7IEFsZXJ0T2Zmc2V0LCBSZW1pbmRlclN0YXR1cywgUmVtaW5kZXJQcmlvcml0eSB9IGZyb20gXCIuLi90eXBlc1wiO1xuXG4vLyBcdTI1MDBcdTI1MDAgRGF0ZSBmb3JtYXR0aW5nIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RGF0ZUZ1bGwoZGF0ZVN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgW3ksIG0sIGRdID0gZGF0ZVN0ci5zcGxpdChcIi1cIikubWFwKE51bWJlcik7XG4gIHJldHVybiBuZXcgRGF0ZSh5LCBtIC0gMSwgZCkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwge1xuICAgIHdlZWtkYXk6IFwic2hvcnRcIiwgbW9udGg6IFwic2hvcnRcIiwgZGF5OiBcIm51bWVyaWNcIiwgeWVhcjogXCJudW1lcmljXCIsXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RGF0ZVJlbGF0aXZlKGRhdGVTdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHRvZGF5ICAgID0gdG9kYXlTdHIoKTtcbiAgY29uc3QgdG9tb3Jyb3cgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgODY0MDAwMDApLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICBpZiAoZGF0ZVN0ciA9PT0gdG9kYXkpICAgIHJldHVybiBcIlRvZGF5XCI7XG4gIGlmIChkYXRlU3RyID09PSB0b21vcnJvdykgcmV0dXJuIFwiVG9tb3Jyb3dcIjtcbiAgcmV0dXJuIG5ldyBEYXRlKGRhdGVTdHIgKyBcIlQwMDowMDowMFwiKS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7IG1vbnRoOiBcInNob3J0XCIsIGRheTogXCJudW1lcmljXCIgfSk7XG59XG5cbi8vIFx1MjUwMFx1MjUwMCBUaW1lIGZvcm1hdHRpbmcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRUaW1lMTIodGltZVN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgW2gsIG1dID0gdGltZVN0ci5zcGxpdChcIjpcIikubWFwKE51bWJlcik7XG4gIGNvbnN0IHN1ZmZpeCA9IGggPj0gMTIgPyBcIlBNXCIgOiBcIkFNXCI7XG4gIGNvbnN0IGhvdXIgICA9IChoICUgMTIpIHx8IDEyO1xuICByZXR1cm4gYCR7aG91cn06JHtTdHJpbmcobSkucGFkU3RhcnQoMiwgXCIwXCIpfSAke3N1ZmZpeH1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0VGltZSh0aW1lU3RyOiBzdHJpbmcsIGZvcm1hdDogXCIxMmhcIiB8IFwiMjRoXCIpOiBzdHJpbmcge1xuICByZXR1cm4gZm9ybWF0ID09PSBcIjI0aFwiID8gdGltZVN0ciA6IGZvcm1hdFRpbWUxMih0aW1lU3RyKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEhvdXIxMihoOiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAoaCA9PT0gMCkgIHJldHVybiBcIjEyIEFNXCI7XG4gIGlmIChoIDwgMTIpICAgcmV0dXJuIGAke2h9IEFNYDtcbiAgaWYgKGggPT09IDEyKSByZXR1cm4gXCIxMiBQTVwiO1xuICByZXR1cm4gYCR7aCAtIDEyfSBQTWA7XG59XG5cbi8vIFx1MjUwMFx1MjUwMCBSZWN1cnJlbmNlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0UmVjdXJyZW5jZShycnVsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgIFwiRlJFUT1EQUlMWVwiOiAgICAgICAgICAgICAgICAgICAgICAgIFwiRXZlcnkgZGF5XCIsXG4gICAgXCJGUkVRPVdFRUtMWVwiOiAgICAgICAgICAgICAgICAgICAgICAgXCJFdmVyeSB3ZWVrXCIsXG4gICAgXCJGUkVRPU1PTlRITFlcIjogICAgICAgICAgICAgICAgICAgICAgXCJFdmVyeSBtb250aFwiLFxuICAgIFwiRlJFUT1ZRUFSTFlcIjogICAgICAgICAgICAgICAgICAgICAgIFwiRXZlcnkgeWVhclwiLFxuICAgIFwiRlJFUT1XRUVLTFk7QllEQVk9TU8sVFUsV0UsVEgsRlJcIjogXCJXZWVrZGF5c1wiLFxuICB9O1xuICByZXR1cm4gbWFwW3JydWxlXSA/PyBycnVsZTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwIEFsZXJ0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0QWxlcnQoYWxlcnQ6IEFsZXJ0T2Zmc2V0KTogc3RyaW5nIHtcbiAgY29uc3QgbWFwOiBQYXJ0aWFsPFJlY29yZDxBbGVydE9mZnNldCwgc3RyaW5nPj4gPSB7XG4gICAgXCJhdC10aW1lXCI6IFwiQXQgdGltZVwiLFxuICAgIFwiNW1pblwiOiAgICBcIjUgbWludXRlcyBiZWZvcmVcIixcbiAgICBcIjEwbWluXCI6ICAgXCIxMCBtaW51dGVzIGJlZm9yZVwiLFxuICAgIFwiMTVtaW5cIjogICBcIjE1IG1pbnV0ZXMgYmVmb3JlXCIsXG4gICAgXCIzMG1pblwiOiAgIFwiMzAgbWludXRlcyBiZWZvcmVcIixcbiAgICBcIjFob3VyXCI6ICAgXCIxIGhvdXIgYmVmb3JlXCIsXG4gICAgXCIyaG91cnNcIjogIFwiMiBob3VycyBiZWZvcmVcIixcbiAgICBcIjFkYXlcIjogICAgXCIxIGRheSBiZWZvcmVcIixcbiAgICBcIjJkYXlzXCI6ICAgXCIyIGRheXMgYmVmb3JlXCIsXG4gICAgXCIxd2Vla1wiOiAgIFwiMSB3ZWVrIGJlZm9yZVwiLFxuICB9O1xuICByZXR1cm4gbWFwW2FsZXJ0XSA/PyBhbGVydDtcbn1cblxuLy8gXHUyNTAwXHUyNTAwIFN0YXR1cyAvIFByaW9yaXR5IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0U3RhdHVzKHM6IFJlbWluZGVyU3RhdHVzKTogc3RyaW5nIHtcbiAgcmV0dXJuIHsgdG9kbzogXCJUbyBEb1wiLCBcImluLXByb2dyZXNzXCI6IFwiSW4gUHJvZ3Jlc3NcIiwgZG9uZTogXCJEb25lXCIsIGNhbmNlbGxlZDogXCJDYW5jZWxsZWRcIiB9W3NdID8/IHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRQcmlvcml0eShwOiBSZW1pbmRlclByaW9yaXR5KTogc3RyaW5nIHtcbiAgY29uc3QgbWFwOiBQYXJ0aWFsPFJlY29yZDxSZW1pbmRlclByaW9yaXR5LCBzdHJpbmc+PiA9IHtcbiAgICBsb3c6IFwiTG93IHByaW9yaXR5XCIsIG1lZGl1bTogXCJNZWRpdW0gcHJpb3JpdHlcIiwgaGlnaDogXCJIaWdoIHByaW9yaXR5XCIsXG4gIH07XG4gIHJldHVybiBtYXBbcF0gPz8gcDtcbn1cblxuLy8gXHUyNTAwXHUyNTAwIER1cmF0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RHVyYXRpb24obWludXRlczogbnVtYmVyKTogc3RyaW5nIHtcbiAgaWYgKG1pbnV0ZXMgPCA2MCkgcmV0dXJuIGAke21pbnV0ZXN9IG1pbmA7XG4gIGNvbnN0IGggPSBNYXRoLmZsb29yKG1pbnV0ZXMgLyA2MCk7XG4gIGNvbnN0IG0gPSBtaW51dGVzICUgNjA7XG4gIHJldHVybiBtID4gMCA/IGAke2h9IGhyICR7bX0gbWluYCA6IGAke2h9IGhyYDtcbn1cblxuLy8gXHUyNTAwXHUyNTAwIEhlbHBlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBmdW5jdGlvbiB0b2RheVN0cigpOiBzdHJpbmcge1xuICByZXR1cm4gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbn1cbiIsICJpbXBvcnQgeyBJdGVtVmlldywgV29ya3NwYWNlTGVhZiwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVSZW1pbmRlciwgUmVtaW5kZXJTdGF0dXMsIFJlbWluZGVyUHJpb3JpdHksIEFsZXJ0T2Zmc2V0IH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBSZW1pbmRlck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9SZW1pbmRlck1hbmFnZXJcIjtcbmltcG9ydCB7IExpc3RNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvTGlzdE1hbmFnZXJcIjtcbmltcG9ydCB7IGJ1aWxkVGFnRmllbGQgfSBmcm9tIFwiLi4vdWkvdGFnRmllbGRcIjtcbmltcG9ydCB7IEFMRVJUX09QVElPTlMsIFJFQ1VSUkVOQ0VfT1BUSU9OUywgU1RBVFVTX09QVElPTlMsIFBSSU9SSVRZX09QVElPTlMgfSBmcm9tIFwiLi4vdXRpbHMvY29uc3RhbnRzXCI7XG5cbmV4cG9ydCBjb25zdCBSRU1JTkRFUl9GT1JNX1ZJRVdfVFlQRSA9IFwiY2hyb25pY2xlLXJlbWluZGVyLWZvcm1cIjtcblxuZXhwb3J0IGNsYXNzIFJlbWluZGVyRm9ybVZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gIHByaXZhdGUgcmVtaW5kZXJNYW5hZ2VyOiBSZW1pbmRlck1hbmFnZXI7XG4gIHByaXZhdGUgbGlzdE1hbmFnZXI6IExpc3RNYW5hZ2VyO1xuICBwcml2YXRlIGVkaXRpbmdSZW1pbmRlcjogQ2hyb25pY2xlUmVtaW5kZXIgfCBudWxsID0gbnVsbDtcbiAgb25TYXZlPzogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBsZWFmOiBXb3Jrc3BhY2VMZWFmLFxuICAgIHJlbWluZGVyTWFuYWdlcjogUmVtaW5kZXJNYW5hZ2VyLFxuICAgIGxpc3RNYW5hZ2VyOiBMaXN0TWFuYWdlcixcbiAgICBlZGl0aW5nUmVtaW5kZXI/OiBDaHJvbmljbGVSZW1pbmRlcixcbiAgICBvblNhdmU/OiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMucmVtaW5kZXJNYW5hZ2VyID0gcmVtaW5kZXJNYW5hZ2VyO1xuICAgIHRoaXMubGlzdE1hbmFnZXIgICAgID0gbGlzdE1hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nUmVtaW5kZXIgPSBlZGl0aW5nUmVtaW5kZXIgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSAgICAgICAgICA9IG9uU2F2ZTtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7IHJldHVybiBSRU1JTkRFUl9GT1JNX1ZJRVdfVFlQRTsgfVxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5lZGl0aW5nUmVtaW5kZXIgPyBcIkVkaXQgcmVtaW5kZXJcIiA6IFwiTmV3IHJlbWluZGVyXCI7IH1cbiAgZ2V0SWNvbigpOiBzdHJpbmcgeyByZXR1cm4gXCJjaGVjay1jaXJjbGVcIjsgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHsgdGhpcy5yZW5kZXIoKTsgfVxuXG4gIGxvYWRSZW1pbmRlcihyZW1pbmRlcjogQ2hyb25pY2xlUmVtaW5kZXIpIHtcbiAgICB0aGlzLmVkaXRpbmdSZW1pbmRlciA9IHJlbWluZGVyO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXSBhcyBIVE1MRWxlbWVudDtcbiAgICBjb250YWluZXIuZW1wdHkoKTtcbiAgICBjb250YWluZXIuYWRkQ2xhc3MoXCJjaHJvbmljbGUtZm9ybS1wYWdlXCIpO1xuXG4gICAgY29uc3QgciAgICAgPSB0aGlzLmVkaXRpbmdSZW1pbmRlcjtcbiAgICBjb25zdCBsaXN0cyA9IHRoaXMubGlzdE1hbmFnZXIuZ2V0QWxsKCk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoXCJjZi1oZWFkZXJcIik7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdFwiLCB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZi1oZWFkZXItdGl0bGVcIikuc2V0VGV4dChyID8gXCJFZGl0IHJlbWluZGVyXCIgOiBcIk5ldyByZW1pbmRlclwiKTtcbiAgICBjb25zdCBzYXZlQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1wcmltYXJ5XCIsIHRleHQ6IHIgPyBcIlNhdmVcIiA6IFwiQWRkXCIgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9ybSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb3JtID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNmLWZvcm1cIik7XG5cbiAgICAvLyBUaXRsZVxuICAgIGNvbnN0IHRpdGxlSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiVGl0bGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgY2xzOiBcImNmLWlucHV0IGNmLXRpdGxlLWlucHV0XCIsIHBsYWNlaG9sZGVyOiBcIlJlbWluZGVyIG5hbWVcIlxuICAgIH0pO1xuICAgIHRpdGxlSW5wdXQudmFsdWUgPSByPy50aXRsZSA/PyBcIlwiO1xuICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcblxuICAgIC8vIExvY2F0aW9uXG4gICAgY29uc3QgbG9jYXRpb25JbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJMb2NhdGlvblwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiQWRkIGxvY2F0aW9uXCJcbiAgICB9KTtcbiAgICBsb2NhdGlvbklucHV0LnZhbHVlID0gcj8ubG9jYXRpb24gPz8gXCJcIjtcblxuICAgIC8vIFN0YXR1cyArIFByaW9yaXR5XG4gICAgY29uc3Qgcm93MSA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuXG4gICAgY29uc3Qgc3RhdHVzU2VsZWN0ID0gdGhpcy5maWVsZChyb3cxLCBcIlN0YXR1c1wiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBmb3IgKGNvbnN0IHMgb2YgU1RBVFVTX09QVElPTlMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IHN0YXR1c1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBzLnZhbHVlLCB0ZXh0OiBzLmxhYmVsIH0pO1xuICAgICAgaWYgKHI/LnN0YXR1cyA9PT0gcy52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmlvcml0eVNlbGVjdCA9IHRoaXMuZmllbGQocm93MSwgXCJQcmlvcml0eVwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBmb3IgKGNvbnN0IHAgb2YgUFJJT1JJVFlfT1BUSU9OUykge1xuICAgICAgY29uc3Qgb3B0ID0gcHJpb3JpdHlTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogcC52YWx1ZSwgdGV4dDogcC5sYWJlbCB9KTtcbiAgICAgIGlmIChyPy5wcmlvcml0eSA9PT0gcC52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBEdWUgZGF0ZSArIHRpbWVcbiAgICBjb25zdCByb3cyID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG4gICAgY29uc3QgZHVlRGF0ZUlucHV0ID0gdGhpcy5maWVsZChyb3cyLCBcIkRhdGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIiB9KTtcbiAgICBkdWVEYXRlSW5wdXQudmFsdWUgPSByPy5kdWVEYXRlID8/IFwiXCI7XG4gICAgY29uc3QgZHVlVGltZUlucHV0ID0gdGhpcy5maWVsZChyb3cyLCBcIlRpbWVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIiB9KTtcbiAgICBkdWVUaW1lSW5wdXQudmFsdWUgPSByPy5kdWVUaW1lID8/IFwiXCI7XG5cbiAgICAvLyBSZXBlYXRcbiAgICBjb25zdCByZWNTZWxlY3QgPSB0aGlzLmZpZWxkKGZvcm0sIFwiUmVwZWF0XCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGZvciAoY29uc3QgcmVjIG9mIFJFQ1VSUkVOQ0VfT1BUSU9OUykge1xuICAgICAgY29uc3Qgb3B0ID0gcmVjU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHJlYy52YWx1ZSwgdGV4dDogcmVjLmxhYmVsIH0pO1xuICAgICAgaWYgKHI/LnJlY3VycmVuY2UgPT09IHJlYy52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBBbGVydFxuICAgIGNvbnN0IGFsZXJ0U2VsZWN0ID0gdGhpcy5maWVsZChmb3JtLCBcIkFsZXJ0XCIpLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcImNmLXNlbGVjdFwiIH0pO1xuICAgIGZvciAoY29uc3QgYSBvZiBBTEVSVF9PUFRJT05TKSB7XG4gICAgICBjb25zdCBvcHQgPSBhbGVydFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBhLnZhbHVlLCB0ZXh0OiBhLmxhYmVsIH0pO1xuICAgICAgaWYgKHI/LmFsZXJ0ID09PSBhLnZhbHVlKSBvcHQuc2VsZWN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIExpc3RcbiAgICBjb25zdCBsaXN0U2VsZWN0ID0gdGhpcy5maWVsZChmb3JtLCBcIkxpc3RcIikuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwiY2Ytc2VsZWN0XCIgfSk7XG4gICAgbGlzdFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiBcIlwiLCB0ZXh0OiBcIk5vbmVcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGxpc3Qgb2YgbGlzdHMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IGxpc3RTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogbGlzdC5pZCwgdGV4dDogbGlzdC5uYW1lIH0pO1xuICAgICAgaWYgKHI/Lmxpc3RJZCA9PT0gbGlzdC5pZCkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgdXBkYXRlTGlzdENvbG9yID0gKCkgPT4ge1xuICAgICAgY29uc3QgbGlzdCA9IHRoaXMubGlzdE1hbmFnZXIuZ2V0QnlJZChsaXN0U2VsZWN0LnZhbHVlKTtcbiAgICAgIGxpc3RTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdENvbG9yID0gbGlzdCA/IGxpc3QuY29sb3IgOiBcInRyYW5zcGFyZW50XCI7XG4gICAgICBsaXN0U2VsZWN0LnN0eWxlLmJvcmRlckxlZnRXaWR0aCA9IFwiNHB4XCI7XG4gICAgICBsaXN0U2VsZWN0LnN0eWxlLmJvcmRlckxlZnRTdHlsZSA9IFwic29saWRcIjtcbiAgICB9O1xuICAgIGxpc3RTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB1cGRhdGVMaXN0Q29sb3IpO1xuICAgIHVwZGF0ZUxpc3RDb2xvcigpO1xuXG4gICAgLy8gVGFnc1xuICAgIGNvbnN0IHRhZ0ZpZWxkID0gYnVpbGRUYWdGaWVsZCh0aGlzLmFwcCwgdGhpcy5maWVsZChmb3JtLCBcIlRhZ3NcIiksIHI/LnRhZ3MgPz8gW10pO1xuXG4gICAgLy8gTGlua2VkIG5vdGVzXG4gICAgY29uc3QgbGlua2VkSW5wdXQgPSB0aGlzLmZpZWxkKGZvcm0sIFwiTGlua2VkIG5vdGVzXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiUHJvamVjdHMvV2Vic2l0ZSwgSm91cm5hbC8yMDI0ICAoY29tbWEgc2VwYXJhdGVkKVwiXG4gICAgfSk7XG4gICAgbGlua2VkSW5wdXQudmFsdWUgPSByPy5saW5rZWROb3Rlcy5qb2luKFwiLCBcIikgPz8gXCJcIjtcblxuICAgIC8vIE5vdGVzXG4gICAgY29uc3Qgbm90ZXNJbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJOb3Rlc1wiKS5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJjZi10ZXh0YXJlYVwiLCBwbGFjZWhvbGRlcjogXCJBZGQgbm90ZXMuLi5cIlxuICAgIH0pO1xuICAgIG5vdGVzSW5wdXQudmFsdWUgPSByPy5ub3RlcyA/PyBcIlwiO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEFjdGlvbnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY2FuY2VsQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFJFTUlOREVSX0ZPUk1fVklFV19UWVBFKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0aXRsZSA9IHRpdGxlSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCF0aXRsZSkgeyB0aXRsZUlucHV0LmZvY3VzKCk7IHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpOyByZXR1cm47IH1cblxuICAgICAgaWYgKCF0aGlzLmVkaXRpbmdSZW1pbmRlcikge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMucmVtaW5kZXJNYW5hZ2VyLmdldEFsbCgpO1xuICAgICAgICBjb25zdCBkdXBsaWNhdGUgPSBleGlzdGluZy5maW5kKGUgPT4gZS50aXRsZS50b0xvd2VyQ2FzZSgpID09PSB0aXRsZS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgaWYgKGR1cGxpY2F0ZSkge1xuICAgICAgICAgIG5ldyBOb3RpY2UoYEEgcmVtaW5kZXIgbmFtZWQgXCIke3RpdGxlfVwiIGFscmVhZHkgZXhpc3RzLmAsIDQwMDApO1xuICAgICAgICAgIHRpdGxlSW5wdXQuY2xhc3NMaXN0LmFkZChcImNmLWVycm9yXCIpO1xuICAgICAgICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVtaW5kZXJEYXRhID0ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgbG9jYXRpb246ICAgICAgICAgICBsb2NhdGlvbklucHV0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgc3RhdHVzOiAgICAgICAgICAgICBzdGF0dXNTZWxlY3QudmFsdWUgYXMgUmVtaW5kZXJTdGF0dXMsXG4gICAgICAgIHByaW9yaXR5OiAgICAgICAgICAgcHJpb3JpdHlTZWxlY3QudmFsdWUgYXMgUmVtaW5kZXJQcmlvcml0eSxcbiAgICAgICAgZHVlRGF0ZTogICAgICAgICAgICBkdWVEYXRlSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBkdWVUaW1lOiAgICAgICAgICAgIGR1ZVRpbWVJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGxpc3RJZDogICAgICAgICAgICAgbGlzdFNlbGVjdC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIHJlY3VycmVuY2U6ICAgICAgICAgcmVjU2VsZWN0LnZhbHVlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgYWxlcnQ6ICAgICAgICAgICAgICBhbGVydFNlbGVjdC52YWx1ZSBhcyBBbGVydE9mZnNldCxcbiAgICAgICAgdGFnczogICAgICAgICAgICAgICB0YWdGaWVsZC5nZXRUYWdzKCksXG4gICAgICAgIGxpbmtlZE5vdGVzOiAgICAgICAgbGlua2VkSW5wdXQudmFsdWUgPyBsaW5rZWRJbnB1dC52YWx1ZS5zcGxpdChcIixcIikubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKSA6IFtdLFxuICAgICAgICBwcm9qZWN0czogICAgICAgICAgIHI/LnByb2plY3RzID8/IFtdLFxuICAgICAgICB0aW1lRW50cmllczogICAgICAgIHI/LnRpbWVFbnRyaWVzID8/IFtdLFxuICAgICAgICBjb21wbGV0ZWRJbnN0YW5jZXM6IHI/LmNvbXBsZXRlZEluc3RhbmNlcyA/PyBbXSxcbiAgICAgICAgY3VzdG9tRmllbGRzOiAgICAgICByPy5jdXN0b21GaWVsZHMgPz8gW10sXG4gICAgICAgIG5vdGVzOiAgICAgICAgICAgICAgbm90ZXNJbnB1dC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICB9O1xuXG4gICAgICBpZiAocikge1xuICAgICAgICBhd2FpdCB0aGlzLnJlbWluZGVyTWFuYWdlci51cGRhdGUoeyAuLi5yLCAuLi5yZW1pbmRlckRhdGEgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLnJlbWluZGVyTWFuYWdlci5jcmVhdGUocmVtaW5kZXJEYXRhKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5vblNhdmU/LigpO1xuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShSRU1JTkRFUl9GT1JNX1ZJRVdfVFlQRSk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhhbmRsZVNhdmUpO1xuICAgIHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGUpID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiKSBoYW5kbGVTYXZlKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGZpZWxkKHBhcmVudDogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3Qgd3JhcCA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZi1maWVsZFwiKTtcbiAgICB3cmFwLmNyZWF0ZURpdihcImNmLWxhYmVsXCIpLnNldFRleHQobGFiZWwpO1xuICAgIHJldHVybiB3cmFwO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgSXRlbVZpZXcsIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEV2ZW50TWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0V2ZW50TWFuYWdlclwiO1xuaW1wb3J0IHsgUmVtaW5kZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvUmVtaW5kZXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDYWxlbmRhck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9DYWxlbmRhck1hbmFnZXJcIjtcbmltcG9ydCB7IENocm9uaWNsZUV2ZW50LCBDaHJvbmljbGVSZW1pbmRlciB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgRXZlbnRNb2RhbCB9IGZyb20gXCIuLi91aS9FdmVudE1vZGFsXCI7XG5pbXBvcnQgeyBFdmVudERldGFpbFBvcHVwIH0gZnJvbSBcIi4uL3VpL0V2ZW50RGV0YWlsUG9wdXBcIjtcbmltcG9ydCB7IEV2ZW50Rm9ybVZpZXcsIEVWRU5UX0ZPUk1fVklFV19UWVBFIH0gZnJvbSBcIi4vRXZlbnRGb3JtVmlld1wiO1xuaW1wb3J0IHR5cGUgQ2hyb25pY2xlUGx1Z2luIGZyb20gXCIuLi9tYWluXCI7XG5pbXBvcnQgeyBmb3JtYXRIb3VyMTIsIGZvcm1hdFRpbWUxMiB9IGZyb20gXCIuLi91dGlscy9mb3JtYXR0ZXJzXCI7XG5cbmV4cG9ydCBjb25zdCBDQUxFTkRBUl9WSUVXX1RZUEUgPSBcImNocm9uaWNsZS1jYWxlbmRhci12aWV3XCI7XG50eXBlIENhbGVuZGFyTW9kZSA9IFwiZGF5XCIgfCBcIndlZWtcIiB8IFwibW9udGhcIiB8IFwieWVhclwiO1xuY29uc3QgSE9VUl9IRUlHSFQgPSA1NjtcblxuZXhwb3J0IGNsYXNzIENhbGVuZGFyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBldmVudE1hbmFnZXI6ICAgIEV2ZW50TWFuYWdlcjtcbiAgcHJpdmF0ZSByZW1pbmRlck1hbmFnZXI6ICAgICBSZW1pbmRlck1hbmFnZXI7XG4gIHByaXZhdGUgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXI7XG4gIHByaXZhdGUgcGx1Z2luOiAgICAgICAgICBDaHJvbmljbGVQbHVnaW47XG4gIHByaXZhdGUgY3VycmVudERhdGU6IERhdGUgICAgICAgICA9IG5ldyBEYXRlKCk7XG4gIHByaXZhdGUgbW9kZTogICAgICAgIENhbGVuZGFyTW9kZSA9IFwid2Vla1wiO1xuICBwcml2YXRlIF9tb2RlU2V0ICAgICAgICAgICAgICAgICAgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfcmVuZGVyVmVyc2lvbiAgICAgICAgICAgID0gMDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBsZWFmOiBXb3Jrc3BhY2VMZWFmLFxuICAgIGV2ZW50TWFuYWdlcjogICAgRXZlbnRNYW5hZ2VyLFxuICAgIHJlbWluZGVyTWFuYWdlcjogICAgIFJlbWluZGVyTWFuYWdlcixcbiAgICBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcixcbiAgICBwbHVnaW46ICAgICAgICAgIENocm9uaWNsZVBsdWdpblxuICApIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLmV2ZW50TWFuYWdlciAgICA9IGV2ZW50TWFuYWdlcjtcbiAgICB0aGlzLnJlbWluZGVyTWFuYWdlciAgICAgPSByZW1pbmRlck1hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5wbHVnaW4gICAgICAgICAgPSBwbHVnaW47XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiAgICBzdHJpbmcgeyByZXR1cm4gQ0FMRU5EQVJfVklFV19UWVBFOyB9XG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7IHJldHVybiBcIkNhbGVuZGFyXCI7IH1cbiAgZ2V0SWNvbigpOiAgICAgICAgc3RyaW5nIHsgcmV0dXJuIFwiY2FsZW5kYXJcIjsgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHtcbiAgICBhd2FpdCB0aGlzLnJlbmRlcigpO1xuXG4gICAgLy8gU2FtZSBwZXJtYW5lbnQgZml4IGFzIHRhc2sgZGFzaGJvYXJkIFx1MjAxNCBtZXRhZGF0YUNhY2hlIGZpcmVzIGFmdGVyXG4gICAgLy8gZnJvbnRtYXR0ZXIgaXMgZnVsbHkgcGFyc2VkLCBzbyBkYXRhIGlzIGZyZXNoIHdoZW4gd2UgcmUtcmVuZGVyXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5vbihcImNoYW5nZWRcIiwgKGZpbGUpID0+IHtcbiAgICAgICAgY29uc3QgaW5FdmVudHMgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLmV2ZW50TWFuYWdlcltcImV2ZW50c0ZvbGRlclwiXSk7XG4gICAgICAgIGNvbnN0IGluVGFza3MgID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5yZW1pbmRlck1hbmFnZXJbXCJyZW1pbmRlcnNGb2xkZXJcIl0pO1xuICAgICAgICBpZiAoaW5FdmVudHMgfHwgaW5UYXNrcykgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICAodGhpcy5hcHAud29ya3NwYWNlIGFzIGFueSkub24oXCJjaHJvbmljbGU6c2V0dGluZ3MtY2hhbmdlZFwiLCAoKSA9PiB0aGlzLnJlbmRlcigpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAudmF1bHQub24oXCJjcmVhdGVcIiwgKGZpbGUpID0+IHtcbiAgICAgICAgY29uc3QgaW5FdmVudHMgPSBmaWxlLnBhdGguc3RhcnRzV2l0aCh0aGlzLmV2ZW50TWFuYWdlcltcImV2ZW50c0ZvbGRlclwiXSk7XG4gICAgICAgIGNvbnN0IGluVGFza3MgID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5yZW1pbmRlck1hbmFnZXJbXCJyZW1pbmRlcnNGb2xkZXJcIl0pO1xuICAgICAgICBpZiAoaW5FdmVudHMgfHwgaW5UYXNrcykgc2V0VGltZW91dCgoKSA9PiB0aGlzLnJlbmRlcigpLCAyMDApO1xuICAgICAgfSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwiZGVsZXRlXCIsIChmaWxlKSA9PiB7XG4gICAgICAgIGNvbnN0IGluRXZlbnRzID0gZmlsZS5wYXRoLnN0YXJ0c1dpdGgodGhpcy5ldmVudE1hbmFnZXJbXCJldmVudHNGb2xkZXJcIl0pO1xuICAgICAgICBjb25zdCBpblRhc2tzICA9IGZpbGUucGF0aC5zdGFydHNXaXRoKHRoaXMucmVtaW5kZXJNYW5hZ2VyW1wicmVtaW5kZXJzRm9sZGVyXCJdKTtcbiAgICAgICAgaWYgKGluRXZlbnRzIHx8IGluVGFza3MpIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBhc3luYyByZW5kZXIoKSB7XG4gICAgY29uc3QgdmVyc2lvbiA9ICsrdGhpcy5fcmVuZGVyVmVyc2lvbjtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdIGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuICAgIGNvbnRhaW5lci5hZGRDbGFzcyhcImNocm9uaWNsZS1jYWwtYXBwXCIpO1xuXG4gICAgY29uc3QgcmVtaW5kZXJzID0gYXdhaXQgdGhpcy5yZW1pbmRlck1hbmFnZXIuZ2V0QWxsKCk7XG5cbiAgICAvLyBBcHBseSBkZWZhdWx0IHZpZXcgZnJvbSBzZXR0aW5ncyBpZiB0aGlzIGlzIHRoZSBmaXJzdCByZW5kZXJcbiAgICBpZiAoIXRoaXMuX21vZGVTZXQpIHtcbiAgICAgIHRoaXMubW9kZSAgICAgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Q2FsZW5kYXJWaWV3ID8/IFwid2Vla1wiO1xuICAgICAgdGhpcy5fbW9kZVNldCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gR2V0IGRhdGUgcmFuZ2UgZm9yIGN1cnJlbnQgdmlldyBzbyByZWN1cnJlbmNlIGV4cGFuc2lvbiBpcyBzY29wZWRcbiAgICBjb25zdCByYW5nZVN0YXJ0ID0gdGhpcy5nZXRSYW5nZVN0YXJ0KCk7XG4gICAgY29uc3QgcmFuZ2VFbmQgICA9IHRoaXMuZ2V0UmFuZ2VFbmQoKTtcbiAgICBjb25zdCBldmVudHMgICAgID0gYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuZ2V0SW5SYW5nZVdpdGhSZWN1cnJlbmNlKHJhbmdlU3RhcnQsIHJhbmdlRW5kKTtcblxuICAgIGlmICh0aGlzLl9yZW5kZXJWZXJzaW9uICE9PSB2ZXJzaW9uKSByZXR1cm47XG5cbiAgICBjb25zdCBsYXlvdXQgID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1jYWwtbGF5b3V0XCIpO1xuICAgIGNvbnN0IHNpZGViYXIgPSBsYXlvdXQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC1zaWRlYmFyXCIpO1xuICAgIGNvbnN0IG1haW4gICAgPSBsYXlvdXQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC1tYWluXCIpO1xuXG4gICAgdGhpcy5yZW5kZXJTaWRlYmFyKHNpZGViYXIpO1xuICAgIHRoaXMucmVuZGVyVG9vbGJhcihtYWluKTtcblxuICAgIGlmICAgICAgKHRoaXMubW9kZSA9PT0gXCJ5ZWFyXCIpICB0aGlzLnJlbmRlclllYXJWaWV3KG1haW4sIGV2ZW50cywgcmVtaW5kZXJzKTtcbiAgICBlbHNlIGlmICh0aGlzLm1vZGUgPT09IFwibW9udGhcIikgdGhpcy5yZW5kZXJNb250aFZpZXcobWFpbiwgZXZlbnRzLCByZW1pbmRlcnMpO1xuICAgIGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gXCJ3ZWVrXCIpICB0aGlzLnJlbmRlcldlZWtWaWV3KG1haW4sIGV2ZW50cywgcmVtaW5kZXJzKTtcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyRGF5VmlldyhtYWluLCBldmVudHMsIHJlbWluZGVycyk7XG4gIH1cblxucHJpdmF0ZSBhc3luYyBvcGVuRXZlbnRGdWxsUGFnZShldmVudD86IENocm9uaWNsZUV2ZW50KSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgaWYgKGV4aXN0aW5nKSBleGlzdGluZy5kZXRhY2goKTtcbiAgICBjb25zdCBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBFVkVOVF9GT1JNX1ZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pO1xuICAgIHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuXG4gICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMCkpO1xuICAgIGNvbnN0IGZvcm1MZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShFVkVOVF9GT1JNX1ZJRVdfVFlQRSlbMF07XG4gICAgY29uc3QgZm9ybVZpZXcgPSBmb3JtTGVhZj8udmlldyBhcyBFdmVudEZvcm1WaWV3IHwgdW5kZWZpbmVkO1xuICAgIGlmIChmb3JtVmlldyAmJiBldmVudCkgZm9ybVZpZXcubG9hZEV2ZW50KGV2ZW50KTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTaWRlYmFyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5wcml2YXRlIGdldFJhbmdlU3RhcnQoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcImRheVwiKSByZXR1cm4gdGhpcy5jdXJyZW50RGF0ZS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcIndlZWtcIikge1xuICAgICAgY29uc3QgcyA9IHRoaXMuZ2V0V2Vla1N0YXJ0KCk7XG4gICAgICByZXR1cm4gcy50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJ5ZWFyXCIpIHJldHVybiBgJHt0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCl9LTAxLTAxYDtcbiAgICAvLyBtb250aFxuICAgIGNvbnN0IHkgPSB0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgY29uc3QgbSA9IHRoaXMuY3VycmVudERhdGUuZ2V0TW9udGgoKTtcbiAgICByZXR1cm4gYCR7eX0tJHtTdHJpbmcobSsxKS5wYWRTdGFydCgyLFwiMFwiKX0tMDFgO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRSYW5nZUVuZCgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwiZGF5XCIpIHJldHVybiB0aGlzLmN1cnJlbnREYXRlLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwid2Vla1wiKSB7XG4gICAgICBjb25zdCBzID0gdGhpcy5nZXRXZWVrU3RhcnQoKTtcbiAgICAgIGNvbnN0IGUgPSBuZXcgRGF0ZShzKTsgZS5zZXREYXRlKGUuZ2V0RGF0ZSgpICsgNik7XG4gICAgICByZXR1cm4gZS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJ5ZWFyXCIpIHJldHVybiBgJHt0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCl9LTEyLTMxYDtcbiAgICAvLyBtb250aFxuICAgIGNvbnN0IHkgPSB0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgY29uc3QgbSA9IHRoaXMuY3VycmVudERhdGUuZ2V0TW9udGgoKTtcbiAgICByZXR1cm4gbmV3IERhdGUoeSwgbSArIDEsIDApLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJTaWRlYmFyKHNpZGViYXI6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgbmV3RXZlbnRCdG4gPSBzaWRlYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJjaHJvbmljbGUtbmV3LXRhc2stYnRuXCIsIHRleHQ6IFwiTmV3IGV2ZW50XCJcbiAgICB9KTtcbiAgICBuZXdFdmVudEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgbmV3IEV2ZW50TW9kYWwoXG4gICAgICAgIHRoaXMuYXBwLCB0aGlzLmV2ZW50TWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIsIHRoaXMucmVtaW5kZXJNYW5hZ2VyLFxuICAgICAgICB1bmRlZmluZWQsICgpID0+IHRoaXMucmVuZGVyKCksIChlKSA9PiB0aGlzLm9wZW5FdmVudEZ1bGxQYWdlKGUpXG4gICAgICApLm9wZW4oKTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyTWluaUNhbGVuZGFyKHNpZGViYXIpO1xuXG4gICAgY29uc3QgY2FsU2VjdGlvbiA9IHNpZGViYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWxpc3RzLXNlY3Rpb25cIik7XG4gICAgY2FsU2VjdGlvbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtc2VjdGlvbi1sYWJlbFwiKS5zZXRUZXh0KFwiTXkgQ2FsZW5kYXJzXCIpO1xuXG4gICAgZm9yIChjb25zdCBjYWwgb2YgdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QWxsKCkpIHtcbiAgICAgIGNvbnN0IHJvdyAgICA9IGNhbFNlY3Rpb24uY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC1saXN0LXJvd1wiKTtcbiAgICAgIGNvbnN0IHRvZ2dsZSA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiLCBjbHM6IFwiY2hyb25pY2xlLWNhbC10b2dnbGVcIiB9KTtcbiAgICAgIHRvZ2dsZS5jaGVja2VkID0gY2FsLmlzVmlzaWJsZTtcbiAgICAgIHRvZ2dsZS5zdHlsZS5hY2NlbnRDb2xvciA9IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcik7XG4gICAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLnRvZ2dsZVZpc2liaWxpdHkoY2FsLmlkKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZG90ID0gcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LWRvdFwiKTtcbiAgICAgIGRvdC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpO1xuICAgICAgcm93LmNyZWF0ZURpdihcImNocm9uaWNsZS1saXN0LW5hbWVcIikuc2V0VGV4dChjYWwubmFtZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNaW5pQ2FsZW5kYXIocGFyZW50OiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IG1pbmkgICA9IHBhcmVudC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1jYWxcIik7XG4gICAgY29uc3QgaGVhZGVyID0gbWluaS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1jYWwtaGVhZGVyXCIpO1xuXG4gICAgY29uc3QgcHJldkJ0biAgICA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjaHJvbmljbGUtbWluaS1uYXZcIiwgdGV4dDogXCJcdTIwMzlcIiB9KTtcbiAgICBjb25zdCBtb250aExhYmVsID0gaGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1taW5pLW1vbnRoLWxhYmVsXCIpO1xuICAgIGNvbnN0IG5leHRCdG4gICAgPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2hyb25pY2xlLW1pbmktbmF2XCIsIHRleHQ6IFwiXHUyMDNBXCIgfSk7XG5cbiAgICBjb25zdCB5ZWFyICA9IHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBtb250aCA9IHRoaXMuY3VycmVudERhdGUuZ2V0TW9udGgoKTtcbiAgICBtb250aExhYmVsLnNldFRleHQoXG4gICAgICBuZXcgRGF0ZSh5ZWFyLCBtb250aCkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyBtb250aDogXCJsb25nXCIsIHllYXI6IFwibnVtZXJpY1wiIH0pXG4gICAgKTtcblxuICAgIHByZXZCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY3VycmVudERhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCAtIDEsIDEpO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9KTtcbiAgICBuZXh0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmN1cnJlbnREYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGggKyAxLCAxKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBncmlkICAgICAgICA9IG1pbmkuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktZ3JpZFwiKTtcbiAgICBjb25zdCBmaXJzdERheSAgICA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCAxKS5nZXREYXkoKTtcbiAgICBjb25zdCBkYXlzSW5Nb250aCA9IG5ldyBEYXRlKHllYXIsIG1vbnRoICsgMSwgMCkuZ2V0RGF0ZSgpO1xuICAgIGNvbnN0IHRvZGF5U3RyICAgID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIGZvciAoY29uc3QgZCBvZiBbXCJTXCIsXCJNXCIsXCJUXCIsXCJXXCIsXCJUXCIsXCJGXCIsXCJTXCJdKVxuICAgICAgZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1kYXktbmFtZVwiKS5zZXRUZXh0KGQpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaXJzdERheTsgaSsrKVxuICAgICAgZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbWluaS1kYXkgY2hyb25pY2xlLW1pbmktZGF5LWVtcHR5XCIpO1xuXG4gICAgZm9yIChsZXQgZCA9IDE7IGQgPD0gZGF5c0luTW9udGg7IGQrKykge1xuICAgICAgY29uc3QgZGF0ZVN0ciA9IGAke3llYXJ9LSR7U3RyaW5nKG1vbnRoKzEpLnBhZFN0YXJ0KDIsXCIwXCIpfS0ke1N0cmluZyhkKS5wYWRTdGFydCgyLFwiMFwiKX1gO1xuICAgICAgY29uc3QgZGF5RWwgICA9IGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1pbmktZGF5XCIpO1xuICAgICAgZGF5RWwuc2V0VGV4dChTdHJpbmcoZCkpO1xuICAgICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSBkYXlFbC5hZGRDbGFzcyhcInRvZGF5XCIpO1xuICAgICAgZGF5RWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5jdXJyZW50RGF0ZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkKTtcbiAgICAgICAgdGhpcy5tb2RlID0gXCJkYXlcIjtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBUb29sYmFyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyVG9vbGJhcihtYWluOiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IHRvb2xiYXIgID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY2FsLXRvb2xiYXJcIik7XG4gICAgY29uc3QgbmF2R3JvdXAgPSB0b29sYmFyLmNyZWF0ZURpdihcImNocm9uaWNsZS1jYWwtbmF2LWdyb3VwXCIpO1xuXG4gICAgbmF2R3JvdXAuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2hyb25pY2xlLWNhbC1uYXYtYnRuXCIsIHRleHQ6IFwiXHUyMDM5XCIgfSlcbiAgICAgIC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5uYXZpZ2F0ZSgtMSkpO1xuICAgIG5hdkdyb3VwLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNocm9uaWNsZS1jYWwtdG9kYXktYnRuXCIsIHRleHQ6IFwiVG9kYXlcIiB9KVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpOyB0aGlzLnJlbmRlcigpOyB9KTtcbiAgICBuYXZHcm91cC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjaHJvbmljbGUtY2FsLW5hdi1idG5cIiwgdGV4dDogXCJcdTIwM0FcIiB9KVxuICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLm5hdmlnYXRlKDEpKTtcblxuICAgIHRvb2xiYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNhbC10b29sYmFyLXRpdGxlXCIpLnNldFRleHQodGhpcy5nZXRUb29sYmFyVGl0bGUoKSk7XG5cbiAgICBjb25zdCBwaWxscyA9IHRvb2xiYXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXZpZXctcGlsbHNcIik7XG4gICAgZm9yIChjb25zdCBbbSwgbGFiZWxdIG9mIFtbXCJkYXlcIixcIkRheVwiXSxbXCJ3ZWVrXCIsXCJXZWVrXCJdLFtcIm1vbnRoXCIsXCJNb250aFwiXSxbXCJ5ZWFyXCIsXCJZZWFyXCJdXSBhcyBbQ2FsZW5kYXJNb2RlLHN0cmluZ11bXSkge1xuICAgICAgY29uc3QgcGlsbCA9IHBpbGxzLmNyZWF0ZURpdihcImNocm9uaWNsZS12aWV3LXBpbGxcIik7XG4gICAgICBwaWxsLnNldFRleHQobGFiZWwpO1xuICAgICAgaWYgKHRoaXMubW9kZSA9PT0gbSkgcGlsbC5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5tb2RlID0gbTsgdGhpcy5yZW5kZXIoKTsgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBuYXZpZ2F0ZShkaXI6IG51bWJlcikge1xuICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSh0aGlzLmN1cnJlbnREYXRlKTtcbiAgICBpZiAgICAgICh0aGlzLm1vZGUgPT09IFwiZGF5XCIpICBkLnNldERhdGUoZC5nZXREYXRlKCkgKyBkaXIpO1xuICAgIGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gXCJ3ZWVrXCIpIGQuc2V0RGF0ZShkLmdldERhdGUoKSArIGRpciAqIDcpO1xuICAgIGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gXCJ5ZWFyXCIpIGQuc2V0RnVsbFllYXIoZC5nZXRGdWxsWWVhcigpICsgZGlyKTtcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5zZXRNb250aChkLmdldE1vbnRoKCkgKyBkaXIpO1xuICAgIHRoaXMuY3VycmVudERhdGUgPSBkO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIGdldFRvb2xiYXJUaXRsZSgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwieWVhclwiKSAgcmV0dXJuIFN0cmluZyh0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCkpO1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwibW9udGhcIikgcmV0dXJuIHRoaXMuY3VycmVudERhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyBtb250aDogXCJsb25nXCIsIHllYXI6IFwibnVtZXJpY1wiIH0pO1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwiZGF5XCIpICAgcmV0dXJuIHRoaXMuY3VycmVudERhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyB3ZWVrZGF5OiBcImxvbmdcIiwgbW9udGg6IFwibG9uZ1wiLCBkYXk6IFwibnVtZXJpY1wiLCB5ZWFyOiBcIm51bWVyaWNcIiB9KTtcbiAgICBjb25zdCBzdGFydCA9IHRoaXMuZ2V0V2Vla1N0YXJ0KCk7XG4gICAgY29uc3QgZW5kICAgPSBuZXcgRGF0ZShzdGFydCk7IGVuZC5zZXREYXRlKGVuZC5nZXREYXRlKCkgKyA2KTtcbiAgICByZXR1cm4gYCR7c3RhcnQudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIix7IG1vbnRoOlwic2hvcnRcIiwgZGF5OlwibnVtZXJpY1wiIH0pfSBcdTIwMTMgJHtlbmQudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIix7IG1vbnRoOlwic2hvcnRcIiwgZGF5OlwibnVtZXJpY1wiLCB5ZWFyOlwibnVtZXJpY1wiIH0pfWA7XG4gIH1cblxuICBwcml2YXRlIGdldFdlZWtTdGFydCgpOiBEYXRlIHtcbiAgICBjb25zdCBkID0gbmV3IERhdGUodGhpcy5jdXJyZW50RGF0ZSk7XG4gICAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpIC0gZC5nZXREYXkoKSk7XG4gICAgcmV0dXJuIGQ7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgWWVhciB2aWV3IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyWWVhclZpZXcobWFpbjogSFRNTEVsZW1lbnQsIGV2ZW50czogQ2hyb25pY2xlRXZlbnRbXSwgcmVtaW5kZXJzOiBDaHJvbmljbGVSZW1pbmRlcltdKSB7XG4gICAgY29uc3QgeWVhciAgICAgPSB0aGlzLmN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgY29uc3QgdG9kYXlTdHIgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoXCJUXCIpWzBdO1xuICAgIGNvbnN0IHllYXJHcmlkID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1ncmlkXCIpO1xuXG4gICAgZm9yIChsZXQgbSA9IDA7IG0gPCAxMjsgbSsrKSB7XG4gICAgICBjb25zdCBjYXJkID0geWVhckdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXllYXItbW9udGgtY2FyZFwiKTtcbiAgICAgIGNvbnN0IG5hbWUgPSBjYXJkLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLW1vbnRoLW5hbWVcIik7XG4gICAgICBuYW1lLnNldFRleHQobmV3IERhdGUoeWVhciwgbSkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZW4tVVNcIiwgeyBtb250aDogXCJsb25nXCIgfSkpO1xuICAgICAgbmFtZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmN1cnJlbnREYXRlID0gbmV3IERhdGUoeWVhciwgbSwgMSk7IHRoaXMubW9kZSA9IFwibW9udGhcIjsgdGhpcy5yZW5kZXIoKTsgfSk7XG5cbiAgICAgIGNvbnN0IG1pbmlHcmlkICAgID0gY2FyZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1taW5pLWdyaWRcIik7XG4gICAgICBjb25zdCBmaXJzdERheSAgICA9IG5ldyBEYXRlKHllYXIsIG0sIDEpLmdldERheSgpO1xuICAgICAgY29uc3QgZGF5c0luTW9udGggPSBuZXcgRGF0ZSh5ZWFyLCBtICsgMSwgMCkuZ2V0RGF0ZSgpO1xuXG4gICAgICBmb3IgKGNvbnN0IGQgb2YgW1wiU1wiLFwiTVwiLFwiVFwiLFwiV1wiLFwiVFwiLFwiRlwiLFwiU1wiXSlcbiAgICAgICAgbWluaUdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXllYXItZGF5LW5hbWVcIikuc2V0VGV4dChkKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaXJzdERheTsgaSsrKVxuICAgICAgICBtaW5pR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUteWVhci1kYXktZW1wdHlcIik7XG5cbiAgICAgIGZvciAobGV0IGQgPSAxOyBkIDw9IGRheXNJbk1vbnRoOyBkKyspIHtcbiAgICAgICAgY29uc3QgZGF0ZVN0ciAgPSBgJHt5ZWFyfS0ke1N0cmluZyhtKzEpLnBhZFN0YXJ0KDIsXCIwXCIpfS0ke1N0cmluZyhkKS5wYWRTdGFydCgyLFwiMFwiKX1gO1xuICAgICAgICBjb25zdCBoYXNFdmVudCA9IGV2ZW50cy5zb21lKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgdGhpcy5pc0NhbGVuZGFyVmlzaWJsZShlLmNhbGVuZGFySWQpKTtcbiAgICAgICAgY29uc3QgaGFzVGFzayAgPSByZW1pbmRlcnMuc29tZSh0ID0+IHQuZHVlRGF0ZSA9PT0gZGF0ZVN0ciAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpO1xuICAgICAgICBjb25zdCBkYXlFbCAgICA9IG1pbmlHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS15ZWFyLWRheVwiKTtcbiAgICAgICAgZGF5RWwuc2V0VGV4dChTdHJpbmcoZCkpO1xuICAgICAgICBpZiAoZGF0ZVN0ciA9PT0gdG9kYXlTdHIpIGRheUVsLmFkZENsYXNzKFwidG9kYXlcIik7XG4gICAgICAgIGlmIChoYXNFdmVudCkgZGF5RWwuYWRkQ2xhc3MoXCJoYXMtZXZlbnRcIik7XG4gICAgICAgIGlmIChoYXNUYXNrKSAgZGF5RWwuYWRkQ2xhc3MoXCJoYXMtdGFza1wiKTtcbiAgICAgICAgZGF5RWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jdXJyZW50RGF0ZSA9IG5ldyBEYXRlKHllYXIsIG0sIGQpOyB0aGlzLm1vZGUgPSBcImRheVwiOyB0aGlzLnJlbmRlcigpOyB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgTW9udGggdmlldyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHJlbmRlck1vbnRoVmlldyhtYWluOiBIVE1MRWxlbWVudCwgZXZlbnRzOiBDaHJvbmljbGVFdmVudFtdLCByZW1pbmRlcnM6IENocm9uaWNsZVJlbWluZGVyW10pIHtcbiAgICBjb25zdCB5ZWFyICAgICA9IHRoaXMuY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBtb250aCAgICA9IHRoaXMuY3VycmVudERhdGUuZ2V0TW9udGgoKTtcbiAgICBjb25zdCB0b2RheVN0ciA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgZ3JpZCAgICAgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS1tb250aC1ncmlkXCIpO1xuXG4gICAgZm9yIChjb25zdCBkIG9mIFtcIlN1blwiLFwiTW9uXCIsXCJUdWVcIixcIldlZFwiLFwiVGh1XCIsXCJGcmlcIixcIlNhdFwiXSlcbiAgICAgIGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWRheS1uYW1lXCIpLnNldFRleHQoZCk7XG5cbiAgICBjb25zdCBmaXJzdERheSAgICAgID0gbmV3IERhdGUoeWVhciwgbW9udGgsIDEpLmdldERheSgpO1xuICAgIGNvbnN0IGRheXNJbk1vbnRoICAgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCArIDEsIDApLmdldERhdGUoKTtcbiAgICBjb25zdCBkYXlzSW5QcmV2TW9uID0gbmV3IERhdGUoeWVhciwgbW9udGgsIDApLmdldERhdGUoKTtcblxuICAgIGZvciAobGV0IGkgPSBmaXJzdERheSAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCBjZWxsID0gZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtY2VsbCBjaHJvbmljbGUtbW9udGgtY2VsbC1vdGhlclwiKTtcbiAgICAgIGNlbGwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGwtbnVtXCIpLnNldFRleHQoU3RyaW5nKGRheXNJblByZXZNb24gLSBpKSk7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgZCA9IDE7IGQgPD0gZGF5c0luTW9udGg7IGQrKykge1xuICAgICAgY29uc3QgZGF0ZVN0ciA9IGAke3llYXJ9LSR7U3RyaW5nKG1vbnRoKzEpLnBhZFN0YXJ0KDIsXCIwXCIpfS0ke1N0cmluZyhkKS5wYWRTdGFydCgyLFwiMFwiKX1gO1xuICAgICAgY29uc3QgY2VsbCAgICA9IGdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGxcIik7XG4gICAgICBpZiAoZGF0ZVN0ciA9PT0gdG9kYXlTdHIpIGNlbGwuYWRkQ2xhc3MoXCJ0b2RheVwiKTtcbiAgICAgIGNlbGwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWNlbGwtbnVtXCIpLnNldFRleHQoU3RyaW5nKGQpKTtcblxuICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKCkgPT4gdGhpcy5vcGVuTmV3RXZlbnRNb2RhbChkYXRlU3RyLCB0cnVlKSk7XG4gICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuc2hvd0NhbENvbnRleHRNZW51KGUuY2xpZW50WCwgZS5jbGllbnRZLCBkYXRlU3RyLCB0cnVlKTtcbiAgICAgIH0pO1xuXG4gICAgICBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgdGhpcy5pc0NhbGVuZGFyVmlzaWJsZShlLmNhbGVuZGFySWQpKS5zbGljZSgwLDMpXG4gICAgICAgIC5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgICAgICBjb25zdCBjYWwgICA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoZXZlbnQuY2FsZW5kYXJJZCA/PyBcIlwiKTtcbiAgICAgICAgICBjb25zdCBjb2xvciA9IGNhbCA/IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcikgOiBcIiMzNzhBRERcIjtcbiAgICAgICAgICBjb25zdCBwaWxsICA9IGNlbGwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWV2ZW50LXBpbGxcIik7XG4gICAgICAgICAgcGlsbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvciArIFwiMzNcIjtcbiAgICAgICAgICBwaWxsLnN0eWxlLmJvcmRlckxlZnQgICAgICA9IGAzcHggc29saWQgJHtjb2xvcn1gO1xuICAgICAgICAgIHBpbGwuc3R5bGUuY29sb3IgICAgICAgICAgID0gY29sb3I7XG4gICAgICAgICAgcGlsbC5zZXRUZXh0KGV2ZW50LnRpdGxlKTtcbiAgICAgICAgICBwaWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIG5ldyBFdmVudERldGFpbFBvcHVwKHRoaXMuYXBwLCBldmVudCwgdGhpcy5jYWxlbmRhck1hbmFnZXIsIHRoaXMucmVtaW5kZXJNYW5hZ2VyLCB0aGlzLnBsdWdpbi5zZXR0aW5ncy50aW1lRm9ybWF0LCAoKSA9PiBuZXcgRXZlbnRNb2RhbCh0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzLnJlbWluZGVyTWFuYWdlciwgZXZlbnQsICgpID0+IHRoaXMucmVuZGVyKCksIChldikgPT4gdGhpcy5vcGVuRXZlbnRGdWxsUGFnZShldikpLm9wZW4oKSkub3BlbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgcmVtaW5kZXJzLmZpbHRlcih0ID0+IHQuZHVlRGF0ZSA9PT0gZGF0ZVN0ciAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpLnNsaWNlKDAsMilcbiAgICAgICAgLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgICAgY29uc3QgcGlsbCA9IGNlbGwuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW1vbnRoLWV2ZW50LXBpbGxcIik7XG4gICAgICAgICAgcGlsbC5hZGRDbGFzcyhcImNocm9uaWNsZS10YXNrLXBpbGxcIik7XG4gICAgICAgICAgcGlsbC5zZXRUZXh0KFwiXHUyNzEzIFwiICsgdGFzay50aXRsZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHJlbWFpbmluZyA9IDcgLSAoKGZpcnN0RGF5ICsgZGF5c0luTW9udGgpICUgNyk7XG4gICAgaWYgKHJlbWFpbmluZyA8IDcpXG4gICAgICBmb3IgKGxldCBkID0gMTsgZCA8PSByZW1haW5pbmc7IGQrKykge1xuICAgICAgICBjb25zdCBjZWxsID0gZ3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtY2VsbCBjaHJvbmljbGUtbW9udGgtY2VsbC1vdGhlclwiKTtcbiAgICAgICAgY2VsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbW9udGgtY2VsbC1udW1cIikuc2V0VGV4dChTdHJpbmcoZCkpO1xuICAgICAgfVxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFdlZWsgdmlldyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwcml2YXRlIHJlbmRlcldlZWtWaWV3KG1haW46IEhUTUxFbGVtZW50LCBldmVudHM6IENocm9uaWNsZUV2ZW50W10sIHJlbWluZGVyczogQ2hyb25pY2xlUmVtaW5kZXJbXSkge1xuICAgIGNvbnN0IHdlZWtTdGFydCA9IHRoaXMuZ2V0V2Vla1N0YXJ0KCk7XG4gICAgY29uc3QgZGF5czogRGF0ZVtdID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogNyB9LCAoXywgaSkgPT4ge1xuICAgICAgY29uc3QgZCA9IG5ldyBEYXRlKHdlZWtTdGFydCk7IGQuc2V0RGF0ZShkLmdldERhdGUoKSArIGkpOyByZXR1cm4gZDtcbiAgICB9KTtcbiAgICBjb25zdCB0b2RheVN0ciA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICAvLyBUaGUgd2VlayBncmlkOiB0aW1lLWNvbCArIDcgZGF5LWNvbHNcbiAgICAvLyBFYWNoIGRheS1jb2wgY29udGFpbnM6IGhlYWRlciBcdTIxOTIgYWxsLWRheSBzaGVsZiBcdTIxOTIgdGltZSBncmlkXG4gICAgLy8gVGhpcyBtaXJyb3JzIGRheSB2aWV3IGV4YWN0bHkgXHUyMDE0IHNoZWxmIGlzIGFsd2F5cyBiZWxvdyB0aGUgZGF0ZSBoZWFkZXJcbiAgICBjb25zdCBjYWxHcmlkID0gbWFpbi5jcmVhdGVEaXYoXCJjaHJvbmljbGUtd2Vlay1ncmlkXCIpO1xuXG4gICAgLy8gVGltZSBjb2x1bW5cbiAgICBjb25zdCB0aW1lQ29sID0gY2FsR3JpZC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtdGltZS1jb2xcIik7XG4gICAgLy8gQmxhbmsgY2VsbCB0aGF0IGFsaWducyB3aXRoIHRoZSBkYXkgaGVhZGVyIHJvd1xuICAgIHRpbWVDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbWUtY29sLWhlYWRlclwiKTtcbiAgICAvLyBCbGFuayBjZWxsIHRoYXQgYWxpZ25zIHdpdGggdGhlIGFsbC1kYXkgc2hlbGYgcm93XG4gICAgY29uc3Qgc2hlbGZTcGFjZXIgPSB0aW1lQ29sLmNyZWF0ZURpdihcImNocm9uaWNsZS10aW1lLWNvbC1zaGVsZi1zcGFjZXJcIik7XG4gICAgc2hlbGZTcGFjZXIuc2V0VGV4dChcImFsbC1kYXlcIik7XG4gICAgLy8gSG91ciBsYWJlbHNcbiAgICBmb3IgKGxldCBoID0gMDsgaCA8IDI0OyBoKyspXG4gICAgICB0aW1lQ29sLmNyZWF0ZURpdihcImNocm9uaWNsZS10aW1lLXNsb3RcIikuc2V0VGV4dChmb3JtYXRIb3VyMTIoaCkpO1xuXG4gICAgLy8gRGF5IGNvbHVtbnNcbiAgICBmb3IgKGNvbnN0IGRheSBvZiBkYXlzKSB7XG4gICAgICBjb25zdCBkYXRlU3RyICAgICAgPSBkYXkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgICBjb25zdCBjb2wgICAgICAgICAgPSBjYWxHcmlkLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktY29sXCIpO1xuICAgICAgY29uc3QgYWxsRGF5RXZlbnRzID0gZXZlbnRzLmZpbHRlcihlID0+IGUuc3RhcnREYXRlID09PSBkYXRlU3RyICYmIGUuYWxsRGF5ICYmIHRoaXMuaXNDYWxlbmRhclZpc2libGUoZS5jYWxlbmRhcklkKSk7XG5cbiAgICAgIC8vIDEuIERheSBoZWFkZXJcbiAgICAgIGNvbnN0IGRheUhlYWRlciA9IGNvbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LWhlYWRlclwiKTtcbiAgICAgIGRheUhlYWRlci5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LW5hbWVcIikuc2V0VGV4dChcbiAgICAgICAgZGF5LnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgd2Vla2RheTogXCJzaG9ydFwiIH0pLnRvVXBwZXJDYXNlKClcbiAgICAgICk7XG4gICAgICBjb25zdCBkYXlOdW0gPSBkYXlIZWFkZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1udW1cIik7XG4gICAgICBkYXlOdW0uc2V0VGV4dChTdHJpbmcoZGF5LmdldERhdGUoKSkpO1xuICAgICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSBkYXlOdW0uYWRkQ2xhc3MoXCJ0b2RheVwiKTtcblxuICAgICAgLy8gMi4gQWxsLWRheSBzaGVsZiBcdTIwMTQgc2l0cyBkaXJlY3RseSBiZWxvdyBoZWFkZXIsIHNhbWUgYXMgZGF5IHZpZXdcbiAgICAgIGNvbnN0IHNoZWxmID0gY29sLmNyZWF0ZURpdihcImNocm9uaWNsZS13ZWVrLWFsbGRheS1zaGVsZlwiKTtcbiAgICAgIGZvciAoY29uc3QgZXZlbnQgb2YgYWxsRGF5RXZlbnRzKVxuICAgICAgICB0aGlzLnJlbmRlckV2ZW50UGlsbEFsbERheShzaGVsZiwgZXZlbnQpO1xuXG4gICAgICAvLyAzLiBUaW1lIGdyaWRcbiAgICAgIGNvbnN0IHRpbWVHcmlkID0gY29sLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktdGltZS1ncmlkXCIpO1xuICAgICAgdGltZUdyaWQuc3R5bGUuaGVpZ2h0ID0gYCR7MjQgKiBIT1VSX0hFSUdIVH1weGA7XG5cbiAgICAgIGZvciAobGV0IGggPSAwOyBoIDwgMjQ7IGgrKykge1xuICAgICAgICBjb25zdCBsaW5lID0gdGltZUdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWhvdXItbGluZVwiKTtcbiAgICAgICAgbGluZS5zdHlsZS50b3AgPSBgJHtoICogSE9VUl9IRUlHSFR9cHhgO1xuICAgICAgfVxuXG4gICAgICB0aW1lR3JpZC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgY29uc3QgcmVjdCAgID0gdGltZUdyaWQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IHkgICAgICA9IGUuY2xpZW50WSAtIHJlY3QudG9wO1xuICAgICAgICBjb25zdCBob3VyICAgPSBNYXRoLm1pbihNYXRoLmZsb29yKHkgLyBIT1VSX0hFSUdIVCksIDIzKTtcbiAgICAgICAgY29uc3QgbWludXRlID0gTWF0aC5mbG9vcigoeSAlIEhPVVJfSEVJR0hUKSAvIEhPVVJfSEVJR0hUICogNjAgLyAxNSkgKiAxNTtcbiAgICAgICAgdGhpcy5vcGVuTmV3RXZlbnRNb2RhbChkYXRlU3RyLCBmYWxzZSwgaG91ciwgbWludXRlKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aW1lR3JpZC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCByZWN0ICAgPSB0aW1lR3JpZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgeSAgICAgID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICAgIGNvbnN0IGhvdXIgICA9IE1hdGgubWluKE1hdGguZmxvb3IoeSAvIEhPVVJfSEVJR0hUKSwgMjMpO1xuICAgICAgICBjb25zdCBtaW51dGUgPSBNYXRoLmZsb29yKCh5ICUgSE9VUl9IRUlHSFQpIC8gSE9VUl9IRUlHSFQgKiA2MCAvIDE1KSAqIDE1O1xuICAgICAgICB0aGlzLnNob3dDYWxDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZGF0ZVN0ciwgZmFsc2UsIGhvdXIsIG1pbnV0ZSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gVGltZWQgZXZlbnRzXG4gICAgICBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgIWUuYWxsRGF5ICYmIGUuc3RhcnRUaW1lICYmIHRoaXMuaXNDYWxlbmRhclZpc2libGUoZS5jYWxlbmRhcklkKSlcbiAgICAgICAgLmZvckVhY2goZXZlbnQgPT4gdGhpcy5yZW5kZXJFdmVudFBpbGxUaW1lZCh0aW1lR3JpZCwgZXZlbnQpKTtcblxuICAgICAgLy8gVGFzayBkdWUgcGlsbHNcbiAgICAgIHJlbWluZGVycy5maWx0ZXIodCA9PiB0LmR1ZURhdGUgPT09IGRhdGVTdHIgJiYgdC5zdGF0dXMgIT09IFwiZG9uZVwiKVxuICAgICAgICAuZm9yRWFjaCh0YXNrID0+IHtcbiAgICAgICAgICBjb25zdCB0b3AgID0gdGFzay5kdWVUaW1lXG4gICAgICAgICAgICA/ICgoKSA9PiB7IGNvbnN0IFtoLG1dID0gdGFzay5kdWVUaW1lIS5zcGxpdChcIjpcIikubWFwKE51bWJlcik7IHJldHVybiAoaCArIG0vNjApICogSE9VUl9IRUlHSFQ7IH0pKClcbiAgICAgICAgICAgIDogMDtcbiAgICAgICAgICBjb25zdCBwaWxsID0gdGltZUdyaWQuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRhc2stZGF5LXBpbGxcIik7XG4gICAgICAgICAgcGlsbC5zdHlsZS50b3AgICAgICAgICAgICAgPSBgJHt0b3B9cHhgO1xuICAgICAgICAgIHBpbGwuYWRkQ2xhc3MoXCJjaHJvbmljbGUtdGFzay1waWxsXCIpO1xuICAgICAgICAgIHBpbGwuc2V0VGV4dChcIlx1MjcxMyBcIiArIHRhc2sudGl0bGUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBOb3cgbGluZVxuICAgIGNvbnN0IG5vdyAgICAgICAgID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBub3dTdHIgICAgICA9IG5vdy50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCB0b2RheUNvbElkeCA9IGRheXMuZmluZEluZGV4KGQgPT4gZC50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXSA9PT0gbm93U3RyKTtcbiAgICBpZiAodG9kYXlDb2xJZHggPj0gMCkge1xuICAgICAgY29uc3QgY29scyAgICAgPSBjYWxHcmlkLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY2hyb25pY2xlLWRheS1jb2xcIik7XG4gICAgICBjb25zdCB0b2RheUNvbCA9IGNvbHNbdG9kYXlDb2xJZHhdIGFzIEhUTUxFbGVtZW50O1xuICAgICAgY29uc3QgdGcgICAgICAgPSB0b2RheUNvbC5xdWVyeVNlbGVjdG9yKFwiLmNocm9uaWNsZS1kYXktdGltZS1ncmlkXCIpIGFzIEhUTUxFbGVtZW50O1xuICAgICAgaWYgKHRnKSB7XG4gICAgICAgIGNvbnN0IHRvcCAgPSAobm93LmdldEhvdXJzKCkgKyBub3cuZ2V0TWludXRlcygpIC8gNjApICogSE9VUl9IRUlHSFQ7XG4gICAgICAgIGNvbnN0IGxpbmUgPSB0Zy5jcmVhdGVEaXYoXCJjaHJvbmljbGUtbm93LWxpbmVcIik7XG4gICAgICAgIGxpbmUuc3R5bGUudG9wID0gYCR7dG9wfXB4YDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRGF5IHZpZXcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSByZW5kZXJEYXlWaWV3KG1haW46IEhUTUxFbGVtZW50LCBldmVudHM6IENocm9uaWNsZUV2ZW50W10sIHJlbWluZGVyczogQ2hyb25pY2xlUmVtaW5kZXJbXSkge1xuICAgIGNvbnN0IGRhdGVTdHIgICAgICA9IHRoaXMuY3VycmVudERhdGUudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG4gICAgY29uc3QgdG9kYXlTdHIgICAgID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcbiAgICBjb25zdCBhbGxEYXlFdmVudHMgPSBldmVudHMuZmlsdGVyKGUgPT4gZS5zdGFydERhdGUgPT09IGRhdGVTdHIgJiYgZS5hbGxEYXkgJiYgdGhpcy5pc0NhbGVuZGFyVmlzaWJsZShlLmNhbGVuZGFySWQpKTtcbiAgICBjb25zdCBkYXlWaWV3ICAgICAgPSBtYWluLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktdmlld1wiKTtcblxuICAgIC8vIERheSBoZWFkZXJcbiAgICBjb25zdCBkYXlIZWFkZXIgPSBkYXlWaWV3LmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktdmlldy1oZWFkZXJcIik7XG4gICAgZGF5SGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktbmFtZS1sYXJnZVwiKS5zZXRUZXh0KFxuICAgICAgdGhpcy5jdXJyZW50RGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoXCJlbi1VU1wiLCB7IHdlZWtkYXk6IFwibG9uZ1wiIH0pLnRvVXBwZXJDYXNlKClcbiAgICApO1xuICAgIGNvbnN0IG51bUVsID0gZGF5SGVhZGVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1kYXktbnVtLWxhcmdlXCIpO1xuICAgIG51bUVsLnNldFRleHQoU3RyaW5nKHRoaXMuY3VycmVudERhdGUuZ2V0RGF0ZSgpKSk7XG4gICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSBudW1FbC5hZGRDbGFzcyhcInRvZGF5XCIpO1xuXG4gICAgLy8gQWxsLWRheSBzaGVsZlxuICAgIGNvbnN0IHNoZWxmICAgICAgICA9IGRheVZpZXcuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1hbGxkYXktc2hlbGZcIik7XG4gICAgc2hlbGYuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1hbGxkYXktbGFiZWxcIikuc2V0VGV4dChcImFsbC1kYXlcIik7XG4gICAgY29uc3Qgc2hlbGZDb250ZW50ID0gc2hlbGYuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1hbGxkYXktY29udGVudFwiKTtcbiAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIGFsbERheUV2ZW50cylcbiAgICAgIHRoaXMucmVuZGVyRXZlbnRQaWxsQWxsRGF5KHNoZWxmQ29udGVudCwgZXZlbnQpO1xuXG4gICAgLy8gVGltZSBhcmVhXG4gICAgY29uc3QgdGltZUFyZWEgICA9IGRheVZpZXcuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1zaW5nbGUtYXJlYVwiKTtcbiAgICBjb25zdCB0aW1lTGFiZWxzID0gdGltZUFyZWEuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWRheS1zaW5nbGUtbGFiZWxzXCIpO1xuICAgIGNvbnN0IGV2ZW50Q29sICAgPSB0aW1lQXJlYS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZGF5LXNpbmdsZS1ldmVudHNcIik7XG4gICAgZXZlbnRDb2wuc3R5bGUuaGVpZ2h0ID0gYCR7MjQgKiBIT1VSX0hFSUdIVH1weGA7XG5cbiAgICBmb3IgKGxldCBoID0gMDsgaCA8IDI0OyBoKyspIHtcbiAgICAgIHRpbWVMYWJlbHMuY3JlYXRlRGl2KFwiY2hyb25pY2xlLXRpbWUtc2xvdFwiKS5zZXRUZXh0KGZvcm1hdEhvdXIxMihoKSk7XG4gICAgICBjb25zdCBsaW5lID0gZXZlbnRDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWhvdXItbGluZVwiKTtcbiAgICAgIGxpbmUuc3R5bGUudG9wID0gYCR7aCAqIEhPVVJfSEVJR0hUfXB4YDtcbiAgICB9XG5cbiAgICBldmVudENvbC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgIGNvbnN0IHJlY3QgICA9IGV2ZW50Q29sLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgeSAgICAgID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICBjb25zdCBob3VyICAgPSBNYXRoLm1pbihNYXRoLmZsb29yKHkgLyBIT1VSX0hFSUdIVCksIDIzKTtcbiAgICAgIGNvbnN0IG1pbnV0ZSA9IE1hdGguZmxvb3IoKHkgJSBIT1VSX0hFSUdIVCkgLyBIT1VSX0hFSUdIVCAqIDYwIC8gMTUpICogMTU7XG4gICAgICB0aGlzLm9wZW5OZXdFdmVudE1vZGFsKGRhdGVTdHIsIGZhbHNlLCBob3VyLCBtaW51dGUpO1xuICAgIH0pO1xuXG4gICAgZXZlbnRDb2wuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCByZWN0ICAgPSBldmVudENvbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IHkgICAgICA9IGUuY2xpZW50WSAtIHJlY3QudG9wO1xuICAgICAgY29uc3QgaG91ciAgID0gTWF0aC5taW4oTWF0aC5mbG9vcih5IC8gSE9VUl9IRUlHSFQpLCAyMyk7XG4gICAgICBjb25zdCBtaW51dGUgPSBNYXRoLmZsb29yKCh5ICUgSE9VUl9IRUlHSFQpIC8gSE9VUl9IRUlHSFQgKiA2MCAvIDE1KSAqIDE1O1xuICAgICAgdGhpcy5zaG93Q2FsQ29udGV4dE1lbnUoZS5jbGllbnRYLCBlLmNsaWVudFksIGRhdGVTdHIsIGZhbHNlLCBob3VyLCBtaW51dGUpO1xuICAgIH0pO1xuXG4gICAgZXZlbnRzLmZpbHRlcihlID0+IGUuc3RhcnREYXRlID09PSBkYXRlU3RyICYmICFlLmFsbERheSAmJiBlLnN0YXJ0VGltZSAmJiB0aGlzLmlzQ2FsZW5kYXJWaXNpYmxlKGUuY2FsZW5kYXJJZCkpXG4gICAgICAuZm9yRWFjaChldmVudCA9PiB0aGlzLnJlbmRlckV2ZW50UGlsbFRpbWVkKGV2ZW50Q29sLCBldmVudCkpO1xuXG4gICAgcmVtaW5kZXJzLmZpbHRlcih0ID0+IHQuZHVlRGF0ZSA9PT0gZGF0ZVN0ciAmJiB0LnN0YXR1cyAhPT0gXCJkb25lXCIpXG4gICAgICAuZm9yRWFjaCh0YXNrID0+IHtcbiAgICAgICAgY29uc3QgdG9wICA9IHRhc2suZHVlVGltZVxuICAgICAgICAgID8gKCgpID0+IHsgY29uc3QgW2gsbV0gPSB0YXNrLmR1ZVRpbWUhLnNwbGl0KFwiOlwiKS5tYXAoTnVtYmVyKTsgcmV0dXJuIChoICsgbS82MCkgKiBIT1VSX0hFSUdIVDsgfSkoKVxuICAgICAgICAgIDogMDtcbiAgICAgICAgY29uc3QgcGlsbCA9IGV2ZW50Q29sLmNyZWF0ZURpdihcImNocm9uaWNsZS10YXNrLWRheS1waWxsXCIpO1xuICAgICAgICBwaWxsLnN0eWxlLnRvcCAgICAgICAgICAgICA9IGAke3RvcH1weGA7XG4gICAgICAgIHBpbGwuYWRkQ2xhc3MoXCJjaHJvbmljbGUtdGFzay1waWxsXCIpO1xuICAgICAgICBwaWxsLnNldFRleHQoXCJcdTI3MTMgXCIgKyB0YXNrLnRpdGxlKTtcbiAgICAgIH0pO1xuXG4gICAgaWYgKGRhdGVTdHIgPT09IHRvZGF5U3RyKSB7XG4gICAgICBjb25zdCBub3cgID0gbmV3IERhdGUoKTtcbiAgICAgIGNvbnN0IHRvcCAgPSAobm93LmdldEhvdXJzKCkgKyBub3cuZ2V0TWludXRlcygpIC8gNjApICogSE9VUl9IRUlHSFQ7XG4gICAgICBjb25zdCBsaW5lID0gZXZlbnRDb2wuY3JlYXRlRGl2KFwiY2hyb25pY2xlLW5vdy1saW5lXCIpO1xuICAgICAgbGluZS5zdHlsZS50b3AgPSBgJHt0b3B9cHhgO1xuICAgIH1cbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBIZWxwZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgb3Blbk5ld0V2ZW50TW9kYWwoZGF0ZVN0cjogc3RyaW5nLCBhbGxEYXk6IGJvb2xlYW4sIGhvdXIgPSA5LCBtaW51dGUgPSAwKSB7XG4gICAgY29uc3QgdGltZVN0ciA9IGAke1N0cmluZyhob3VyKS5wYWRTdGFydCgyLFwiMFwiKX06JHtTdHJpbmcobWludXRlKS5wYWRTdGFydCgyLFwiMFwiKX1gO1xuICAgIGNvbnN0IGVuZFN0ciAgPSBgJHtTdHJpbmcoTWF0aC5taW4oaG91cisxLDIzKSkucGFkU3RhcnQoMixcIjBcIil9OiR7U3RyaW5nKG1pbnV0ZSkucGFkU3RhcnQoMixcIjBcIil9YDtcbiAgICBjb25zdCBwcmVmaWxsID0ge1xuICAgICAgaWQ6IFwiXCIsIHRpdGxlOiBcIlwiLCBhbGxEYXksXG4gICAgICBzdGFydERhdGU6IGRhdGVTdHIsIHN0YXJ0VGltZTogYWxsRGF5ID8gdW5kZWZpbmVkIDogdGltZVN0cixcbiAgICAgIGVuZERhdGU6ICAgZGF0ZVN0ciwgZW5kVGltZTogICBhbGxEYXkgPyB1bmRlZmluZWQgOiBlbmRTdHIsXG4gICAgICBhbGVydDogXCJub25lXCIsIGxpbmtlZFJlbWluZGVySWRzOiBbXSwgY29tcGxldGVkSW5zdGFuY2VzOiBbXSwgY3JlYXRlZEF0OiBcIlwiXG4gICAgfSBhcyBDaHJvbmljbGVFdmVudDtcblxuICAgIG5ldyBFdmVudE1vZGFsKFxuICAgICAgdGhpcy5hcHAsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlciwgdGhpcy5yZW1pbmRlck1hbmFnZXIsXG4gICAgICBwcmVmaWxsLCAoKSA9PiB0aGlzLnJlbmRlcigpLCAoZSkgPT4gdGhpcy5vcGVuRXZlbnRGdWxsUGFnZShlID8/IHByZWZpbGwpXG4gICAgKS5vcGVuKCk7XG4gIH1cblxucHJpdmF0ZSBzaG93RXZlbnRDb250ZXh0TWVudSh4OiBudW1iZXIsIHk6IG51bWJlciwgZXZlbnQ6IENocm9uaWNsZUV2ZW50KSB7XG4gICAgY29uc3QgbWVudSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbWVudS5jbGFzc05hbWUgID0gXCJjaHJvbmljbGUtY29udGV4dC1tZW51XCI7XG4gICAgbWVudS5zdHlsZS5sZWZ0ID0gYCR7eH1weGA7XG4gICAgbWVudS5zdHlsZS50b3AgID0gYCR7eX1weGA7XG5cbiAgICBjb25zdCBlZGl0SXRlbSA9IG1lbnUuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWNvbnRleHQtaXRlbVwiKTtcbiAgICBlZGl0SXRlbS5zZXRUZXh0KFwiRWRpdCBldmVudFwiKTtcbiAgICBlZGl0SXRlbS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgbWVudS5yZW1vdmUoKTtcbiAgICAgIG5ldyBFdmVudE1vZGFsKHRoaXMuYXBwLCB0aGlzLmV2ZW50TWFuYWdlciwgdGhpcy5jYWxlbmRhck1hbmFnZXIsIHRoaXMucmVtaW5kZXJNYW5hZ2VyLCBldmVudCwgKCkgPT4gdGhpcy5yZW5kZXIoKSwgKGUpID0+IHRoaXMub3BlbkV2ZW50RnVsbFBhZ2UoZSkpLm9wZW4oKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGRlbGV0ZUl0ZW0gPSBtZW51LmNyZWF0ZURpdihcImNocm9uaWNsZS1jb250ZXh0LWl0ZW0gY2hyb25pY2xlLWNvbnRleHQtZGVsZXRlXCIpO1xuICAgIGRlbGV0ZUl0ZW0uc2V0VGV4dChcIkRlbGV0ZSBldmVudFwiKTtcbiAgICBkZWxldGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICBtZW51LnJlbW92ZSgpO1xuICAgICAgYXdhaXQgdGhpcy5ldmVudE1hbmFnZXIuZGVsZXRlKGV2ZW50LmlkKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1lbnUpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IG1lbnUucmVtb3ZlKCksIHsgb25jZTogdHJ1ZSB9KSwgMCk7XG4gIH1cblxuICBwcml2YXRlIHNob3dDYWxDb250ZXh0TWVudSh4OiBudW1iZXIsIHk6IG51bWJlciwgZGF0ZVN0cjogc3RyaW5nLCBhbGxEYXk6IGJvb2xlYW4sIGhvdXIgPSA5LCBtaW51dGUgPSAwKSB7XG4gICAgY29uc3QgbWVudSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbWVudS5jbGFzc05hbWUgICAgPSBcImNocm9uaWNsZS1jb250ZXh0LW1lbnVcIjtcbiAgICBtZW51LnN0eWxlLmxlZnQgICA9IGAke3h9cHhgO1xuICAgIG1lbnUuc3R5bGUudG9wICAgID0gYCR7eX1weGA7XG5cbiAgICBjb25zdCBhZGRJdGVtID0gbWVudS5jcmVhdGVEaXYoXCJjaHJvbmljbGUtY29udGV4dC1pdGVtXCIpO1xuICAgIGFkZEl0ZW0uc2V0VGV4dChcIk5ldyBldmVudCBoZXJlXCIpO1xuICAgIGFkZEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgbWVudS5yZW1vdmUoKTsgdGhpcy5vcGVuTmV3RXZlbnRNb2RhbChkYXRlU3RyLCBhbGxEYXksIGhvdXIsIG1pbnV0ZSk7IH0pO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtZW51KTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBtZW51LnJlbW92ZSgpLCB7IG9uY2U6IHRydWUgfSksIDApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJFdmVudFBpbGxUaW1lZChjb250YWluZXI6IEhUTUxFbGVtZW50LCBldmVudDogQ2hyb25pY2xlRXZlbnQpIHtcbiAgICBjb25zdCBbc2gsIHNtXSA9IChldmVudC5zdGFydFRpbWUgPz8gXCIwOTowMFwiKS5zcGxpdChcIjpcIikubWFwKE51bWJlcik7XG4gICAgY29uc3QgW2VoLCBlbV0gPSAoZXZlbnQuZW5kVGltZSAgID8/IFwiMTA6MDBcIikuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpO1xuICAgIGNvbnN0IHRvcCAgICA9IChzaCArIHNtIC8gNjApICogSE9VUl9IRUlHSFQ7XG4gICAgY29uc3QgaGVpZ2h0ID0gTWF0aC5tYXgoKGVoIC0gc2ggKyAoZW0gLSBzbSkgLyA2MCkgKiBIT1VSX0hFSUdIVCwgMjIpO1xuICAgIGNvbnN0IGNhbCAgICA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEJ5SWQoZXZlbnQuY2FsZW5kYXJJZCA/PyBcIlwiKTtcbiAgICBjb25zdCBjb2xvciAgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCIjMzc4QUREXCI7XG5cbiAgICBjb25zdCBwaWxsID0gY29udGFpbmVyLmNyZWF0ZURpdihcImNocm9uaWNsZS1ldmVudC1waWxsXCIpO1xuICAgIHBpbGwuc3R5bGUudG9wICAgICAgICAgICAgID0gYCR7dG9wfXB4YDtcbiAgICBwaWxsLnN0eWxlLmhlaWdodCAgICAgICAgICA9IGAke2hlaWdodH1weGA7XG4gICAgcGlsbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvciArIFwiMzNcIjtcbiAgICBwaWxsLnN0eWxlLmJvcmRlckxlZnQgICAgICA9IGAzcHggc29saWQgJHtjb2xvcn1gO1xuICAgIHBpbGwuc3R5bGUuY29sb3IgICAgICAgICAgID0gY29sb3I7XG4gICAgcGlsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZXZlbnQtcGlsbC10aXRsZVwiKS5zZXRUZXh0KGV2ZW50LnRpdGxlKTtcbiAgICBpZiAoaGVpZ2h0ID4gMzYgJiYgZXZlbnQuc3RhcnRUaW1lKVxuICAgICAgcGlsbC5jcmVhdGVEaXYoXCJjaHJvbmljbGUtZXZlbnQtcGlsbC10aW1lXCIpLnNldFRleHQoZm9ybWF0VGltZTEyKGV2ZW50LnN0YXJ0VGltZSkpO1xuXG4gICAgcGlsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBuZXcgRXZlbnREZXRhaWxQb3B1cCh0aGlzLmFwcCwgZXZlbnQsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzLnJlbWluZGVyTWFuYWdlciwgdGhpcy5wbHVnaW4uc2V0dGluZ3MudGltZUZvcm1hdCwgKCkgPT4gbmV3IEV2ZW50TW9kYWwodGhpcy5hcHAsIHRoaXMuZXZlbnRNYW5hZ2VyLCB0aGlzLmNhbGVuZGFyTWFuYWdlciwgdGhpcy5yZW1pbmRlck1hbmFnZXIsIGV2ZW50LCAoKSA9PiB0aGlzLnJlbmRlcigpLCAoZXYpID0+IHRoaXMub3BlbkV2ZW50RnVsbFBhZ2UoZXYpKS5vcGVuKCkpLm9wZW4oKTtcbiAgICB9KTtcblxuICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgdGhpcy5zaG93RXZlbnRDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZXZlbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJFdmVudFBpbGxBbGxEYXkoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZXZlbnQ6IENocm9uaWNsZUV2ZW50KSB7XG4gICAgY29uc3QgY2FsICAgPSB0aGlzLmNhbGVuZGFyTWFuYWdlci5nZXRCeUlkKGV2ZW50LmNhbGVuZGFySWQgPz8gXCJcIik7XG4gICAgY29uc3QgY29sb3IgPSBjYWwgPyBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpIDogXCIjMzc4QUREXCI7XG4gICAgY29uc3QgcGlsbCAgPSBjb250YWluZXIuY3JlYXRlRGl2KFwiY2hyb25pY2xlLWV2ZW50LXBpbGwtYWxsZGF5XCIpO1xuICAgIHBpbGwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IgKyBcIjMzXCI7XG4gICAgcGlsbC5zdHlsZS5ib3JkZXJMZWZ0ICAgICAgPSBgM3B4IHNvbGlkICR7Y29sb3J9YDtcbiAgICBwaWxsLnN0eWxlLmNvbG9yICAgICAgICAgICA9IGNvbG9yO1xuICAgIHBpbGwuc2V0VGV4dChldmVudC50aXRsZSk7XG4gICAgcGlsbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT5cbiAgICAgIG5ldyBFdmVudERldGFpbFBvcHVwKHRoaXMuYXBwLCBldmVudCwgdGhpcy5jYWxlbmRhck1hbmFnZXIsIHRoaXMucmVtaW5kZXJNYW5hZ2VyLCB0aGlzLnBsdWdpbi5zZXR0aW5ncy50aW1lRm9ybWF0LCAoKSA9PiBuZXcgRXZlbnRNb2RhbCh0aGlzLmFwcCwgdGhpcy5ldmVudE1hbmFnZXIsIHRoaXMuY2FsZW5kYXJNYW5hZ2VyLCB0aGlzLnJlbWluZGVyTWFuYWdlciwgZXZlbnQsICgpID0+IHRoaXMucmVuZGVyKCksIChldikgPT4gdGhpcy5vcGVuRXZlbnRGdWxsUGFnZShldikpLm9wZW4oKSkub3BlbigpXG4gICAgKTtcblxuICAgIHBpbGwuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgdGhpcy5zaG93RXZlbnRDb250ZXh0TWVudShlLmNsaWVudFgsIGUuY2xpZW50WSwgZXZlbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBpc0NhbGVuZGFyVmlzaWJsZShjYWxlbmRhcklkPzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCFjYWxlbmRhcklkKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChjYWxlbmRhcklkKT8uaXNWaXNpYmxlID8/IHRydWU7XG4gIH1cblxufSIsICJpbXBvcnQgeyBBcHAsIE1vZGFsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBFdmVudE1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9FdmVudE1hbmFnZXJcIjtcbmltcG9ydCB7IENhbGVuZGFyTWFuYWdlciB9IGZyb20gXCIuLi9kYXRhL0NhbGVuZGFyTWFuYWdlclwiO1xuaW1wb3J0IHsgUmVtaW5kZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvUmVtaW5kZXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVFdmVudCwgQWxlcnRPZmZzZXQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGJ1aWxkVGFnRmllbGQgfSBmcm9tIFwiLi90YWdGaWVsZFwiO1xuaW1wb3J0IHsgQUxFUlRfT1BUSU9OUywgUkVDVVJSRU5DRV9PUFRJT05TIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnN0YW50c1wiO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBldmVudE1hbmFnZXI6IEV2ZW50TWFuYWdlcjtcbiAgcHJpdmF0ZSBjYWxlbmRhck1hbmFnZXI6IENhbGVuZGFyTWFuYWdlcjtcbiAgcHJpdmF0ZSByZW1pbmRlck1hbmFnZXI6IFJlbWluZGVyTWFuYWdlcjtcbiAgcHJpdmF0ZSBlZGl0aW5nRXZlbnQ6IENocm9uaWNsZUV2ZW50IHwgbnVsbDtcbiAgcHJpdmF0ZSBvblNhdmU/OiAoKSA9PiB2b2lkO1xuICBwcml2YXRlIG9uRXhwYW5kPzogKGV2ZW50PzogQ2hyb25pY2xlRXZlbnQpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgZXZlbnRNYW5hZ2VyOiBFdmVudE1hbmFnZXIsXG4gICAgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXIsXG4gICAgcmVtaW5kZXJNYW5hZ2VyOiBSZW1pbmRlck1hbmFnZXIsXG4gICAgZWRpdGluZ0V2ZW50PzogQ2hyb25pY2xlRXZlbnQsXG4gICAgb25TYXZlPzogKCkgPT4gdm9pZCxcbiAgICBvbkV4cGFuZD86IChldmVudD86IENocm9uaWNsZUV2ZW50KSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5ldmVudE1hbmFnZXIgICAgPSBldmVudE1hbmFnZXI7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5yZW1pbmRlck1hbmFnZXIgPSByZW1pbmRlck1hbmFnZXI7XG4gICAgdGhpcy5lZGl0aW5nRXZlbnQgICAgPSBlZGl0aW5nRXZlbnQgPz8gbnVsbDtcbiAgICB0aGlzLm9uU2F2ZSAgICAgICAgICA9IG9uU2F2ZTtcbiAgICB0aGlzLm9uRXhwYW5kICAgICAgICA9IG9uRXhwYW5kO1xuICB9XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImNocm9uaWNsZS1ldmVudC1tb2RhbFwiKTtcblxuICAgIGNvbnN0IGUgICAgICAgICA9IHRoaXMuZWRpdGluZ0V2ZW50O1xuICAgIGNvbnN0IGNhbGVuZGFycyA9IHRoaXMuY2FsZW5kYXJNYW5hZ2VyLmdldEFsbCgpO1xuXG4gICAgLy8gRmV0Y2ggYWxsIHJlbWluZGVycyB1cGZyb250IGZvciBsaW5rZWQtcmVtaW5kZXJzIFVJXG4gICAgY29uc3QgYWxsUmVtaW5kZXJzID0gYXdhaXQgdGhpcy5yZW1pbmRlck1hbmFnZXIuZ2V0QWxsKCk7XG4gICAgbGV0IGxpbmtlZElkczogc3RyaW5nW10gPSBbLi4uKGU/LmxpbmtlZFJlbWluZGVySWRzID8/IFtdKV07XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZW0taGVhZGVyXCIpO1xuICAgIGhlYWRlci5jcmVhdGVEaXYoXCJjZW0tdGl0bGVcIikuc2V0VGV4dChlICYmIGUuaWQgPyBcIkVkaXQgZXZlbnRcIiA6IFwiTmV3IGV2ZW50XCIpO1xuXG4gICAgY29uc3QgZXhwYW5kQnRuID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdCBjZW0tZXhwYW5kLWJ0blwiIH0pO1xuICAgIGV4cGFuZEJ0bi50aXRsZSA9IFwiT3BlbiBhcyBmdWxsIHBhZ2VcIjtcbiAgICBleHBhbmRCdG4uaW5uZXJIVE1MID0gYDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPjxwb2x5bGluZSBwb2ludHM9XCIxNSAzIDIxIDMgMjEgOVwiLz48cG9seWxpbmUgcG9pbnRzPVwiOSAyMSAzIDIxIDMgMTVcIi8+PGxpbmUgeDE9XCIyMVwiIHkxPVwiM1wiIHgyPVwiMTRcIiB5Mj1cIjEwXCIvPjxsaW5lIHgxPVwiM1wiIHkxPVwiMjFcIiB4Mj1cIjEwXCIgeTI9XCIxNFwiLz48L3N2Zz5gO1xuICAgIGV4cGFuZEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgdGhpcy5vbkV4cGFuZD8uKGUgPz8gdW5kZWZpbmVkKTtcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBTY3JvbGxhYmxlIGZvcm0gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgZm9ybSA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJjZW0tZm9ybVwiKTtcblxuICAgIC8vIFRpdGxlXG4gICAgY29uc3QgdGl0bGVJbnB1dCA9IHRoaXMuZmllbGQoZm9ybSwgXCJUaXRsZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXQgY2YtdGl0bGUtaW5wdXRcIiwgcGxhY2Vob2xkZXI6IFwiRXZlbnQgbmFtZVwiXG4gICAgfSk7XG4gICAgdGl0bGVJbnB1dC52YWx1ZSA9IGU/LnRpdGxlID8/IFwiXCI7XG4gICAgdGl0bGVJbnB1dC5mb2N1cygpO1xuXG4gICAgLy8gTG9jYXRpb25cbiAgICBjb25zdCBsb2NhdGlvbklucHV0ID0gdGhpcy5maWVsZChmb3JtLCBcIkxvY2F0aW9uXCIpLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJjZi1pbnB1dFwiLCBwbGFjZWhvbGRlcjogXCJBZGQgbG9jYXRpb25cIlxuICAgIH0pO1xuICAgIGxvY2F0aW9uSW5wdXQudmFsdWUgPSBlPy5sb2NhdGlvbiA/PyBcIlwiO1xuXG4gICAgLy8gQWxsIGRheSB0b2dnbGVcbiAgICBjb25zdCBhbGxEYXlGaWVsZCAgPSB0aGlzLmZpZWxkKGZvcm0sIFwiQWxsIGRheVwiKTtcbiAgICBjb25zdCBhbGxEYXlXcmFwICAgPSBhbGxEYXlGaWVsZC5jcmVhdGVEaXYoXCJjZW0tdG9nZ2xlLXdyYXBcIik7XG4gICAgY29uc3QgYWxsRGF5VG9nZ2xlID0gYWxsRGF5V3JhcC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiLCBjbHM6IFwiY2VtLXRvZ2dsZVwiIH0pO1xuICAgIGFsbERheVRvZ2dsZS5jaGVja2VkID0gZT8uYWxsRGF5ID8/IGZhbHNlO1xuICAgIGNvbnN0IGFsbERheUxhYmVsICA9IGFsbERheVdyYXAuY3JlYXRlU3Bhbih7IGNsczogXCJjZW0tdG9nZ2xlLWxhYmVsXCIgfSk7XG4gICAgYWxsRGF5TGFiZWwuc2V0VGV4dChhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IFwiWWVzXCIgOiBcIk5vXCIpO1xuICAgIGFsbERheVRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGFsbERheUxhYmVsLnNldFRleHQoYWxsRGF5VG9nZ2xlLmNoZWNrZWQgPyBcIlllc1wiIDogXCJOb1wiKTtcbiAgICAgIHRpbWVGaWVsZHMuc3R5bGUuZGlzcGxheSA9IGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJub25lXCIgOiBcIlwiO1xuICAgIH0pO1xuXG4gICAgLy8gU3RhcnQgKyBFbmQgZGF0ZVxuICAgIGNvbnN0IGRhdGVSb3cgICAgICAgID0gZm9ybS5jcmVhdGVEaXYoXCJjZi1yb3dcIik7XG4gICAgY29uc3Qgc3RhcnREYXRlSW5wdXQgPSB0aGlzLmZpZWxkKGRhdGVSb3csIFwiU3RhcnQgZGF0ZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0RGF0ZUlucHV0LnZhbHVlID0gZT8uc3RhcnREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBjb25zdCBlbmREYXRlSW5wdXQgPSB0aGlzLmZpZWxkKGRhdGVSb3csIFwiRW5kIGRhdGVcIikuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcImRhdGVcIiwgY2xzOiBcImNmLWlucHV0XCJcbiAgICB9KTtcbiAgICBlbmREYXRlSW5wdXQudmFsdWUgPSBlPy5lbmREYXRlID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdChcIlRcIilbMF07XG5cbiAgICBzdGFydERhdGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmICghZW5kRGF0ZUlucHV0LnZhbHVlIHx8IGVuZERhdGVJbnB1dC52YWx1ZSA8IHN0YXJ0RGF0ZUlucHV0LnZhbHVlKSB7XG4gICAgICAgIGVuZERhdGVJbnB1dC52YWx1ZSA9IHN0YXJ0RGF0ZUlucHV0LnZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVGltZSBmaWVsZHNcbiAgICBjb25zdCB0aW1lRmllbGRzICAgICA9IGZvcm0uY3JlYXRlRGl2KFwiY2Ytcm93XCIpO1xuICAgIHRpbWVGaWVsZHMuc3R5bGUuZGlzcGxheSA9IGFsbERheVRvZ2dsZS5jaGVja2VkID8gXCJub25lXCIgOiBcIlwiO1xuXG4gICAgY29uc3Qgc3RhcnRUaW1lSW5wdXQgPSB0aGlzLmZpZWxkKHRpbWVGaWVsZHMsIFwiU3RhcnQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIHN0YXJ0VGltZUlucHV0LnZhbHVlID0gZT8uc3RhcnRUaW1lID8/IFwiMDk6MDBcIjtcblxuICAgIGNvbnN0IGVuZFRpbWVJbnB1dCA9IHRoaXMuZmllbGQodGltZUZpZWxkcywgXCJFbmQgdGltZVwiKS5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGltZVwiLCBjbHM6IFwiY2YtaW5wdXRcIlxuICAgIH0pO1xuICAgIGVuZFRpbWVJbnB1dC52YWx1ZSA9IGU/LmVuZFRpbWUgPz8gXCIxMDowMFwiO1xuXG4gICAgLy8gUmVwZWF0XG4gICAgY29uc3QgcmVjU2VsZWN0ID0gdGhpcy5maWVsZChmb3JtLCBcIlJlcGVhdFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBmb3IgKGNvbnN0IHJlYyBvZiBSRUNVUlJFTkNFX09QVElPTlMpIHtcbiAgICAgIGNvbnN0IG9wdCA9IHJlY1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHZhbHVlOiByZWMudmFsdWUsIHRleHQ6IHJlYy5sYWJlbCB9KTtcbiAgICAgIGlmIChlPy5yZWN1cnJlbmNlID09PSByZWMudmFsdWUpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gQWxlcnRcbiAgICBjb25zdCBhbGVydFNlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJBbGVydFwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGEgb2YgQUxFUlRfT1BUSU9OUykge1xuICAgICAgY29uc3Qgb3B0ID0gYWxlcnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogYS52YWx1ZSwgdGV4dDogYS5sYWJlbCB9KTtcbiAgICAgIGlmIChlPy5hbGVydCA9PT0gYS52YWx1ZSkgb3B0LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBDYWxlbmRhclxuICAgIGNvbnN0IGNhbFNlbGVjdCA9IHRoaXMuZmllbGQoZm9ybSwgXCJDYWxlbmRhclwiKS5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJjZi1zZWxlY3RcIiB9KTtcbiAgICBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogXCJcIiwgdGV4dDogXCJOb25lXCIgfSk7XG4gICAgZm9yIChjb25zdCBjYWwgb2YgY2FsZW5kYXJzKSB7XG4gICAgICBjb25zdCBvcHQgPSBjYWxTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogY2FsLmlkLCB0ZXh0OiBjYWwubmFtZSB9KTtcbiAgICAgIGlmIChlPy5jYWxlbmRhcklkID09PSBjYWwuaWQpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuICAgIGNvbnN0IHVwZGF0ZUNhbENvbG9yID0gKCkgPT4ge1xuICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChjYWxTZWxlY3QudmFsdWUpO1xuICAgICAgY2FsU2VsZWN0LnN0eWxlLmJvcmRlckxlZnRDb2xvciA9IGNhbCA/IENhbGVuZGFyTWFuYWdlci5jb2xvclRvSGV4KGNhbC5jb2xvcikgOiBcInRyYW5zcGFyZW50XCI7XG4gICAgICBjYWxTZWxlY3Quc3R5bGUuYm9yZGVyTGVmdFdpZHRoID0gXCI0cHhcIjtcbiAgICAgIGNhbFNlbGVjdC5zdHlsZS5ib3JkZXJMZWZ0U3R5bGUgPSBcInNvbGlkXCI7XG4gICAgfTtcbiAgICBjYWxTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB1cGRhdGVDYWxDb2xvcik7XG4gICAgdXBkYXRlQ2FsQ29sb3IoKTtcblxuICAgIC8vIFRhZ3NcbiAgICBjb25zdCB0YWdGaWVsZCA9IGJ1aWxkVGFnRmllbGQodGhpcy5hcHAsIHRoaXMuZmllbGQoZm9ybSwgXCJUYWdzXCIpLCBlPy50YWdzID8/IFtdKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBMaW5rZWQgcmVtaW5kZXJzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGxpbmtlZEZpZWxkID0gdGhpcy5maWVsZChmb3JtLCBcIkxpbmtlZCByZW1pbmRlcnNcIik7XG4gICAgY29uc3QgbGlua2VkTGlzdCAgPSBsaW5rZWRGaWVsZC5jcmVhdGVEaXYoXCJjdGwtbGlzdFwiKTtcblxuICAgIGNvbnN0IHJlbmRlckxpbmtlZExpc3QgPSAoKSA9PiB7XG4gICAgICBsaW5rZWRMaXN0LmVtcHR5KCk7XG4gICAgICBjb25zdCBpdGVtcyA9IGFsbFJlbWluZGVycy5maWx0ZXIociA9PiBsaW5rZWRJZHMuaW5jbHVkZXMoci5pZCkpO1xuICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBsaW5rZWRMaXN0LmNyZWF0ZURpdihcImN0bC1lbXB0eVwiKS5zZXRUZXh0KFwiTm8gbGlua2VkIHJlbWluZGVyc1wiKTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgcmVtaW5kZXIgb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3Qgcm93ID0gbGlua2VkTGlzdC5jcmVhdGVEaXYoXCJjdGwtaXRlbVwiKTtcbiAgICAgICAgcm93LmNyZWF0ZVNwYW4oeyBjbHM6IGBjdGwtc3RhdHVzIGN0bC1zdGF0dXMtJHtyZW1pbmRlci5zdGF0dXN9YCB9KTtcbiAgICAgICAgcm93LmNyZWF0ZVNwYW4oeyBjbHM6IFwiY3RsLXRpdGxlXCIgfSkuc2V0VGV4dChyZW1pbmRlci50aXRsZSk7XG4gICAgICAgIGNvbnN0IHVubGlua0J0biA9IHJvdy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjdGwtdW5saW5rXCIsIHRleHQ6IFwiXHUwMEQ3XCIgfSk7XG4gICAgICAgIHVubGlua0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIGxpbmtlZElkcyA9IGxpbmtlZElkcy5maWx0ZXIoaWQgPT4gaWQgIT09IHJlbWluZGVyLmlkKTtcbiAgICAgICAgICByZW5kZXJMaW5rZWRMaXN0KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gICAgcmVuZGVyTGlua2VkTGlzdCgpO1xuXG4gICAgLy8gU2VhcmNoIHRvIGxpbmsgZXhpc3RpbmcgcmVtaW5kZXJzXG4gICAgY29uc3Qgc2VhcmNoV3JhcCAgICA9IGxpbmtlZEZpZWxkLmNyZWF0ZURpdihcImN0bC1zZWFyY2gtd3JhcFwiKTtcbiAgICBjb25zdCBzZWFyY2hJbnB1dCAgID0gc2VhcmNoV3JhcC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLCBjbHM6IFwiY2YtaW5wdXQgY3RsLXNlYXJjaFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiU2VhcmNoIHJlbWluZGVycyB0byBsaW5rXHUyMDI2XCJcbiAgICB9KTtcbiAgICBjb25zdCBzZWFyY2hSZXN1bHRzID0gc2VhcmNoV3JhcC5jcmVhdGVEaXYoXCJjdGwtcmVzdWx0c1wiKTtcbiAgICBzZWFyY2hSZXN1bHRzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcblxuICAgIGNvbnN0IGNsb3NlU2VhcmNoID0gKCkgPT4ge1xuICAgICAgc2VhcmNoUmVzdWx0cy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICBzZWFyY2hSZXN1bHRzLmVtcHR5KCk7XG4gICAgfTtcblxuICAgIHNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBxID0gc2VhcmNoSW5wdXQudmFsdWUudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgICBzZWFyY2hSZXN1bHRzLmVtcHR5KCk7XG4gICAgICBpZiAoIXEpIHsgY2xvc2VTZWFyY2goKTsgcmV0dXJuOyB9XG5cbiAgICAgIGNvbnN0IG1hdGNoZXMgPSBhbGxSZW1pbmRlcnNcbiAgICAgICAgLmZpbHRlcihyID0+ICFsaW5rZWRJZHMuaW5jbHVkZXMoci5pZCkgJiYgci50aXRsZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEpKVxuICAgICAgICAuc2xpY2UoMCwgNik7XG5cbiAgICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMCkgeyBjbG9zZVNlYXJjaCgpOyByZXR1cm47IH1cbiAgICAgIHNlYXJjaFJlc3VsdHMuc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICBmb3IgKGNvbnN0IHJlbWluZGVyIG9mIG1hdGNoZXMpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHNlYXJjaFJlc3VsdHMuY3JlYXRlRGl2KFwiY3RsLXJlc3VsdC1pdGVtXCIpO1xuICAgICAgICBpdGVtLmNyZWF0ZVNwYW4oeyBjbHM6IGBjdGwtc3RhdHVzIGN0bC1zdGF0dXMtJHtyZW1pbmRlci5zdGF0dXN9YCB9KTtcbiAgICAgICAgaXRlbS5jcmVhdGVTcGFuKHsgY2xzOiBcImN0bC1yZXN1bHQtdGl0bGVcIiB9KS5zZXRUZXh0KHJlbWluZGVyLnRpdGxlKTtcbiAgICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChldikgPT4ge1xuICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgbGlua2VkSWRzLnB1c2gocmVtaW5kZXIuaWQpO1xuICAgICAgICAgIHNlYXJjaElucHV0LnZhbHVlID0gXCJcIjtcbiAgICAgICAgICBjbG9zZVNlYXJjaCgpO1xuICAgICAgICAgIHJlbmRlckxpbmtlZExpc3QoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBzZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICAvLyBTbWFsbCBkZWxheSBzbyBtb3VzZWRvd24gY2FuIGZpcmUgZmlyc3RcbiAgICAgIHNldFRpbWVvdXQoY2xvc2VTZWFyY2gsIDE1MCk7XG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRm9vdGVyIChhbHdheXMgdmlzaWJsZSwgb3V0c2lkZSBzY3JvbGwgYXJlYSkgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgZm9vdGVyICAgID0gY29udGVudEVsLmNyZWF0ZURpdihcImNlbS1mb290ZXJcIik7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gZm9vdGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1naG9zdFwiLCB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuXG4gICAgaWYgKGUgJiYgZS5pZCkge1xuICAgICAgY29uc3QgZGVsZXRlQnRuID0gZm9vdGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNmLWJ0bi1kZWxldGVcIiwgdGV4dDogXCJEZWxldGUgZXZlbnRcIiB9KTtcbiAgICAgIGRlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB0aGlzLmV2ZW50TWFuYWdlci5kZWxldGUoZS5pZCk7XG4gICAgICAgIHRoaXMub25TYXZlPy4oKTtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2F2ZUJ0biA9IGZvb3Rlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwiY2YtYnRuLXByaW1hcnlcIiwgdGV4dDogZSAmJiBlLmlkID8gXCJTYXZlXCIgOiBcIkFkZCBldmVudFwiXG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGFuZGxlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY2FuY2VsQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuXG4gICAgY29uc3QgaGFuZGxlU2F2ZSA9IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRpdGxlID0gdGl0bGVJbnB1dC52YWx1ZS50cmltKCk7XG4gICAgICBpZiAoIXRpdGxlKSB7XG4gICAgICAgIHRpdGxlSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgdGl0bGVJbnB1dC5jbGFzc0xpc3QuYWRkKFwiY2YtZXJyb3JcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZXZlbnREYXRhID0ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgbG9jYXRpb246ICAgIGxvY2F0aW9uSW5wdXQudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBhbGxEYXk6ICAgICAgYWxsRGF5VG9nZ2xlLmNoZWNrZWQsXG4gICAgICAgIHN0YXJ0RGF0ZTogICBzdGFydERhdGVJbnB1dC52YWx1ZSxcbiAgICAgICAgc3RhcnRUaW1lOiAgIGFsbERheVRvZ2dsZS5jaGVja2VkID8gdW5kZWZpbmVkIDogc3RhcnRUaW1lSW5wdXQudmFsdWUsXG4gICAgICAgIGVuZERhdGU6ICAgICBlbmREYXRlSW5wdXQudmFsdWUgfHwgc3RhcnREYXRlSW5wdXQudmFsdWUsXG4gICAgICAgIGVuZFRpbWU6ICAgICBhbGxEYXlUb2dnbGUuY2hlY2tlZCA/IHVuZGVmaW5lZCA6IGVuZFRpbWVJbnB1dC52YWx1ZSxcbiAgICAgICAgcmVjdXJyZW5jZTogIHJlY1NlbGVjdC52YWx1ZSB8fCB1bmRlZmluZWQsXG4gICAgICAgIGNhbGVuZGFySWQ6ICBjYWxTZWxlY3QudmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICBhbGVydDogICAgICAgYWxlcnRTZWxlY3QudmFsdWUgYXMgQWxlcnRPZmZzZXQsXG4gICAgICAgIHRhZ3M6ICAgICAgICAgICAgICAgdGFnRmllbGQuZ2V0VGFncygpLFxuICAgICAgICBub3RlczogICAgICAgICAgICAgIGU/Lm5vdGVzLFxuICAgICAgICBsaW5rZWROb3RlczogICAgICAgIGU/LmxpbmtlZE5vdGVzID8/IFtdLFxuICAgICAgICBsaW5rZWRSZW1pbmRlcklkczogIGxpbmtlZElkcyxcbiAgICAgICAgY29tcGxldGVkSW5zdGFuY2VzOiBlPy5jb21wbGV0ZWRJbnN0YW5jZXMgPz8gW10sXG4gICAgICB9O1xuXG4gICAgICBpZiAoZSAmJiBlLmlkKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXZlbnRNYW5hZ2VyLnVwZGF0ZSh7IC4uLmUsIC4uLmV2ZW50RGF0YSB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXZlbnRNYW5hZ2VyLmNyZWF0ZShldmVudERhdGEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm9uU2F2ZT8uKCk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfTtcblxuICAgIHNhdmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhhbmRsZVNhdmUpO1xuICAgIHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2KSA9PiB7XG4gICAgICBpZiAoZXYua2V5ID09PSBcIkVudGVyXCIpIGhhbmRsZVNhdmUoKTtcbiAgICAgIGlmIChldi5rZXkgPT09IFwiRXNjYXBlXCIpIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZmllbGQocGFyZW50OiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCB3cmFwID0gcGFyZW50LmNyZWF0ZURpdihcImNmLWZpZWxkXCIpO1xuICAgIHdyYXAuY3JlYXRlRGl2KFwiY2YtbGFiZWxcIikuc2V0VGV4dChsYWJlbCk7XG4gICAgcmV0dXJuIHdyYXA7XG4gIH1cblxuICBvbkNsb3NlKCkge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBDaHJvbmljbGVFdmVudCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgQ2FsZW5kYXJNYW5hZ2VyIH0gZnJvbSBcIi4uL2RhdGEvQ2FsZW5kYXJNYW5hZ2VyXCI7XG5pbXBvcnQgeyBSZW1pbmRlck1hbmFnZXIgfSBmcm9tIFwiLi4vZGF0YS9SZW1pbmRlck1hbmFnZXJcIjtcbmltcG9ydCB7IGZvcm1hdERhdGVGdWxsLCBmb3JtYXRSZWN1cnJlbmNlLCBmb3JtYXRBbGVydCB9IGZyb20gXCIuLi91dGlscy9mb3JtYXR0ZXJzXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudERldGFpbFBvcHVwIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIGV2ZW50OiAgICAgICAgICAgQ2hyb25pY2xlRXZlbnQ7XG4gIHByaXZhdGUgY2FsZW5kYXJNYW5hZ2VyOiBDYWxlbmRhck1hbmFnZXI7XG4gIHByaXZhdGUgcmVtaW5kZXJNYW5hZ2VyOiBSZW1pbmRlck1hbmFnZXI7XG4gIHByaXZhdGUgdGltZUZvcm1hdDogICAgICBcIjEyaFwiIHwgXCIyNGhcIjtcbiAgcHJpdmF0ZSBvbkVkaXQ6ICAgICAgICAgICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgZXZlbnQ6IENocm9uaWNsZUV2ZW50LFxuICAgIGNhbGVuZGFyTWFuYWdlcjogQ2FsZW5kYXJNYW5hZ2VyLFxuICAgIHJlbWluZGVyTWFuYWdlcjogUmVtaW5kZXJNYW5hZ2VyLFxuICAgIHRpbWVGb3JtYXQ6IFwiMTJoXCIgfCBcIjI0aFwiLFxuICAgIG9uRWRpdDogKCkgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuZXZlbnQgICAgICAgICAgID0gZXZlbnQ7XG4gICAgdGhpcy5jYWxlbmRhck1hbmFnZXIgPSBjYWxlbmRhck1hbmFnZXI7XG4gICAgdGhpcy5yZW1pbmRlck1hbmFnZXIgPSByZW1pbmRlck1hbmFnZXI7XG4gICAgdGhpcy50aW1lRm9ybWF0ICAgICAgPSB0aW1lRm9ybWF0O1xuICAgIHRoaXMub25FZGl0ICAgICAgICAgID0gb25FZGl0O1xuICB9XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcImNkcC1tb2RhbFwiKTtcblxuICAgIGNvbnN0IGV2ID0gdGhpcy5ldmVudDtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBIZWFkZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaGVhZGVyID0gY29udGVudEVsLmNyZWF0ZURpdihcImNkcC1oZWFkZXJcIik7XG4gICAgaGVhZGVyLmNyZWF0ZURpdihcImNkcC10aXRsZVwiKS5zZXRUZXh0KGV2LnRpdGxlKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBEZXRhaWwgcm93cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBib2R5ID0gY29udGVudEVsLmNyZWF0ZURpdihcImNkcC1ib2R5XCIpO1xuXG4gICAgLy8gRGF0ZSArIHRpbWUgKGFsd2F5cyBzaG93bilcbiAgICBjb25zdCBkYXRlVGltZVN0ciA9IHRoaXMuZm9ybWF0RGF0ZVRpbWUoZXYpO1xuICAgIHRoaXMucm93KGJvZHksIGV2LmFsbERheSA/IFwiRGF0ZVwiIDogXCJXaGVuXCIsIGRhdGVUaW1lU3RyKTtcblxuICAgIGlmIChldi5sb2NhdGlvbikgdGhpcy5yb3coYm9keSwgXCJMb2NhdGlvblwiLCBldi5sb2NhdGlvbik7XG5cbiAgICBpZiAoZXYuY2FsZW5kYXJJZCkge1xuICAgICAgY29uc3QgY2FsID0gdGhpcy5jYWxlbmRhck1hbmFnZXIuZ2V0QnlJZChldi5jYWxlbmRhcklkKTtcbiAgICAgIGlmIChjYWwpIHRoaXMuY2FsUm93KGJvZHksIGNhbC5uYW1lLCBDYWxlbmRhck1hbmFnZXIuY29sb3JUb0hleChjYWwuY29sb3IpKTtcbiAgICB9XG5cbiAgICBpZiAoZXYucmVjdXJyZW5jZSkgdGhpcy5yb3coYm9keSwgXCJSZXBlYXRcIiwgZm9ybWF0UmVjdXJyZW5jZShldi5yZWN1cnJlbmNlKSk7XG5cbiAgICBpZiAoZXYuYWxlcnQgJiYgZXYuYWxlcnQgIT09IFwibm9uZVwiKSB0aGlzLnJvdyhib2R5LCBcIkFsZXJ0XCIsIGZvcm1hdEFsZXJ0KGV2LmFsZXJ0KSk7XG5cbiAgICBpZiAoZXYudGFncyAmJiBldi50YWdzLmxlbmd0aCA+IDApIHRoaXMucm93KGJvZHksIFwiVGFnc1wiLCBldi50YWdzLmpvaW4oXCIsIFwiKSk7XG5cbiAgICBpZiAoZXYubGlua2VkTm90ZXMgJiYgZXYubGlua2VkTm90ZXMubGVuZ3RoID4gMClcbiAgICAgIHRoaXMucm93KGJvZHksIFwiTGlua2VkIG5vdGVzXCIsIGV2LmxpbmtlZE5vdGVzLmpvaW4oXCIsIFwiKSk7XG5cbiAgICAvLyBMaW5rZWQgcmVtaW5kZXJzIFx1MjAxNCBmZXRjaCBuYW1lcyBhc3luY1xuICAgIGlmIChldi5saW5rZWRSZW1pbmRlcklkcyAmJiBldi5saW5rZWRSZW1pbmRlcklkcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBhbGxSZW1pbmRlcnMgPSBhd2FpdCB0aGlzLnJlbWluZGVyTWFuYWdlci5nZXRBbGwoKTtcbiAgICAgIGNvbnN0IGxpbmtlZCAgICAgICA9IGFsbFJlbWluZGVycy5maWx0ZXIociA9PiBldi5saW5rZWRSZW1pbmRlcklkcy5pbmNsdWRlcyhyLmlkKSk7XG4gICAgICBpZiAobGlua2VkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgcmVtaW5kZXJzUm93ID0gYm9keS5jcmVhdGVEaXYoXCJjZHAtcm93IGNkcC1saW5rZWQtcmVtaW5kZXJzLXJvd1wiKTtcbiAgICAgICAgcmVtaW5kZXJzUm93LmNyZWF0ZURpdihcImNkcC1yb3ctbGFiZWxcIikuc2V0VGV4dChcIlJlbWluZGVyc1wiKTtcbiAgICAgICAgY29uc3QgbGlzdCA9IHJlbWluZGVyc1Jvdy5jcmVhdGVEaXYoXCJjZHAtcm93LXZhbHVlIGNkcC1yZW1pbmRlci1saXN0XCIpO1xuICAgICAgICBmb3IgKGNvbnN0IHJlbWluZGVyIG9mIGxpbmtlZCkge1xuICAgICAgICAgIGNvbnN0IGl0ZW0gPSBsaXN0LmNyZWF0ZURpdihcImNkcC1yZW1pbmRlci1pdGVtXCIpO1xuICAgICAgICAgIGl0ZW0uY3JlYXRlU3Bhbih7IGNsczogYGN0bC1zdGF0dXMgY3RsLXN0YXR1cy0ke3JlbWluZGVyLnN0YXR1c31gIH0pO1xuICAgICAgICAgIGl0ZW0uY3JlYXRlU3Bhbih7IGNsczogXCJjZHAtcmVtaW5kZXItdGl0bGVcIiB9KS5zZXRUZXh0KHJlbWluZGVyLnRpdGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChldi5ub3Rlcykge1xuICAgICAgY29uc3Qgbm90ZXNSb3cgPSBib2R5LmNyZWF0ZURpdihcImNkcC1yb3cgY2RwLW5vdGVzLXJvd1wiKTtcbiAgICAgIG5vdGVzUm93LmNyZWF0ZURpdihcImNkcC1yb3ctbGFiZWxcIikuc2V0VGV4dChcIk5vdGVzXCIpO1xuICAgICAgbm90ZXNSb3cuY3JlYXRlRGl2KFwiY2RwLXJvdy12YWx1ZSBjZHAtbm90ZXMtdGV4dFwiKS5zZXRUZXh0KFxuICAgICAgICBldi5ub3Rlcy5sZW5ndGggPiA0MDAgPyBldi5ub3Rlcy5zbGljZSgwLCA0MDApICsgXCJcdTIwMjZcIiA6IGV2Lm5vdGVzXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBGb290ZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgZm9vdGVyID0gY29udGVudEVsLmNyZWF0ZURpdihcImNkcC1mb290ZXJcIik7XG4gICAgY29uc3QgZWRpdEJ0biA9IGZvb3Rlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjZi1idG4tcHJpbWFyeVwiLCB0ZXh0OiBcIkVkaXQgZXZlbnRcIiB9KTtcbiAgICBlZGl0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY2xvc2UoKTsgdGhpcy5vbkVkaXQoKTsgfSk7XG4gIH1cblxuICBwcml2YXRlIGZvcm1hdERhdGVUaW1lKGV2OiBDaHJvbmljbGVFdmVudCk6IHN0cmluZyB7XG4gICAgY29uc3Qgc3RhcnREYXRlID0gZm9ybWF0RGF0ZUZ1bGwoZXYuc3RhcnREYXRlKTtcbiAgICBjb25zdCBlbmREYXRlICAgPSBmb3JtYXREYXRlRnVsbChldi5lbmREYXRlKTtcbiAgICBjb25zdCBzYW1lRGF5ICAgPSBldi5zdGFydERhdGUgPT09IGV2LmVuZERhdGU7XG5cbiAgICBpZiAoZXYuYWxsRGF5KSB7XG4gICAgICByZXR1cm4gc2FtZURheSA/IHN0YXJ0RGF0ZSA6IGAke3N0YXJ0RGF0ZX0gXHUyMDEzICR7ZW5kRGF0ZX1gO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IGV2LnN0YXJ0VGltZSA/IHRoaXMuZm10VGltZShldi5zdGFydFRpbWUpIDogXCJcIjtcbiAgICBjb25zdCBlbmRUaW1lICAgPSBldi5lbmRUaW1lICAgPyB0aGlzLmZtdFRpbWUoZXYuZW5kVGltZSkgICA6IFwiXCI7XG5cbiAgICBpZiAoc2FtZURheSkge1xuICAgICAgcmV0dXJuIHN0YXJ0VGltZSAmJiBlbmRUaW1lXG4gICAgICAgID8gYCR7c3RhcnREYXRlfSAgXHUwMEI3ICAke3N0YXJ0VGltZX0gXHUyMDEzICR7ZW5kVGltZX1gXG4gICAgICAgIDogc3RhcnREYXRlO1xuICAgIH1cbiAgICByZXR1cm4gYCR7c3RhcnREYXRlfSAke3N0YXJ0VGltZX0gXHUyMDEzICR7ZW5kRGF0ZX0gJHtlbmRUaW1lfWAudHJpbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByb3cocGFyZW50OiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICAgIGNvbnN0IHJvdyA9IHBhcmVudC5jcmVhdGVEaXYoXCJjZHAtcm93XCIpO1xuICAgIHJvdy5jcmVhdGVEaXYoXCJjZHAtcm93LWxhYmVsXCIpLnNldFRleHQobGFiZWwpO1xuICAgIHJvdy5jcmVhdGVEaXYoXCJjZHAtcm93LXZhbHVlXCIpLnNldFRleHQodmFsdWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxSb3cocGFyZW50OiBIVE1MRWxlbWVudCwgbmFtZTogc3RyaW5nLCBjb2xvcjogc3RyaW5nKSB7XG4gICAgY29uc3Qgcm93ID0gcGFyZW50LmNyZWF0ZURpdihcImNkcC1yb3dcIik7XG4gICAgcm93LmNyZWF0ZURpdihcImNkcC1yb3ctbGFiZWxcIikuc2V0VGV4dChcIkNhbGVuZGFyXCIpO1xuICAgIGNvbnN0IHZhbCA9IHJvdy5jcmVhdGVEaXYoXCJjZHAtcm93LXZhbHVlIGNkcC1jYWwtdmFsdWVcIik7XG4gICAgY29uc3QgZG90ID0gdmFsLmNyZWF0ZVNwYW4oXCJjZHAtY2FsLWRvdFwiKTtcbiAgICBkb3Quc3R5bGUuYmFja2dyb3VuZCA9IGNvbG9yO1xuICAgIHZhbC5jcmVhdGVTcGFuKCkuc2V0VGV4dChuYW1lKTtcbiAgfVxuXG4gIHByaXZhdGUgZm10VGltZSh0aW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLnRpbWVGb3JtYXQgPT09IFwiMjRoXCIpIHJldHVybiB0aW1lO1xuICAgIGNvbnN0IFtoLCBtXSA9IHRpbWUuc3BsaXQoXCI6XCIpLm1hcChOdW1iZXIpO1xuICAgIGNvbnN0IHN1ZmZpeCA9IGggPj0gMTIgPyBcIlBNXCIgOiBcIkFNXCI7XG4gICAgY29uc3QgaG91ciAgID0gKChoICUgMTIpIHx8IDEyKTtcbiAgICByZXR1cm4gYCR7aG91cn06JHtTdHJpbmcobSkucGFkU3RhcnQoMiwgXCIwXCIpfSAke3N1ZmZpeH1gO1xuICB9XG5cbiAgb25DbG9zZSgpIHsgdGhpcy5jb250ZW50RWwuZW1wdHkoKTsgfVxufVxuXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ0FBLHNCQUF1RDs7O0FDRWhELElBQU0sa0JBQU4sTUFBc0I7QUFBQSxFQUkzQixZQUFZLFdB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QUMzQixVQUFNLFdBQVcsVUFBVSxnQkFBZ0Isb0JBQW9CLEVBQUUsQ0FBQztBQUNsRSxRQUFJLFNBQVUsVUFBUyxPQUFPO0FBQzlCLFVBQU0sT0FBTyxVQUFVLFFBQVEsS0FBSztBQUNwQyxVQUFNLEtBQUssYUFBYSxFQUFFLE1BQU0sc0JBQXNCLFFBQVEsS0FBSyxDQUFDO0FBQ3BFLGNBQVUsV0FBVyxJQUFJO0FBRXpCLFVBQU0sSUFBSSxRQUFRLGFBQVcsV0FBVyxTQUFTLEdBQUcsQ0FBQztBQUNyRCxVQUFNLFdBQVcsVUFBVSxnQkFBZ0Isb0JBQW9CLEVBQUUsQ0FBQztBQUNsRSxVQUFNLFdBQVcscUNBQVU7QUFDM0IsUUFBSSxZQUFZLE1BQU8sVUFBUyxVQUFVLEtBQUs7QUFBQSxFQUNqRDtBQUNGOyIsCiAgIm5hbWVzIjogWyJfYSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiX2IiLCAiX2MiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJfYiIsICJfYyIsICJfZCIsICJfZSIsICJfZiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgIl9iIiwgIl9jIiwgIl9kIiwgIl9lIiwgIl9hIiwgInIiLCAiZ3JvdXBzIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiX2IiLCAiX2MiLCAiaW1wb3J0X29ic2lkaWFuIiwgInRvZGF5U3RyIl0KfQo=
