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
    new import_obsidian.Setting(el).setName("Alert for reminders").setDesc("Enable alerts for reminders with a due time.").addToggle(
      (t) => {
        var _a;
        return t.setValue((_a = this.plugin.settings.notifReminders) != null ? _a : true).onChange(async (value) => {
          this.plugin.settings.notifReminders = value;
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
    this.subHeader(el, "Notifications");
    new import_obsidian.Setting(el).setName("Reminder notification sound").setDesc("macOS system sound played when a reminder alert fires.").addDropdown(
      (drop) => {
        var _a;
        return this.addSoundOptions(drop).setValue((_a = this.plugin.settings.notifSoundReminder) != null ? _a : "Glass").onChange(async (value) => {
          this.plugin.settings.notifSoundReminder = value;
          await this.plugin.saveSettings();
        });
      }
    );
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
    return drop.addOption("none", "None (silent)").addOption("Glass", "Glass").addOption("Ping", "Ping").addOption("Tink", "Tink").addOption("Basso", "Basso").addOption("Funk", "Funk").addOption("Hero", "Hero").addOption("Sosumi", "Sosumi").addOption("Submarine", "Submarine").addOption("Blow", "Blow").addOption("Bottle", "Bottle").addOption("Frog", "Frog").addOption("Morse", "Morse").addOption("Pop", "Pop").addOption("Purr", "Purr");
  }
  addAlertOptions(drop) {
    return drop.addOption("none", "None").addOption("at-time", "At time").addOption("5min", "5 minutes before").addOption("10min", "10 minutes before").addOption("15min", "15 minutes before").addOption("30min", "30 minutes before").addOption("1hour", "1 hour before").addOption("2hours", "2 hours before").addOption("1day", "1 day before").addOption("2days", "2 days before").addOption("1week", "1 week before");
  }
};

// src/data/AlertManager.ts
var import_obsidian2 = require("obsidian");
var AlertManager = class {
  constructor(app, reminderManager, eventManager, getSettings) {
    this.intervalId = null;
    this.firedAlerts = /* @__PURE__ */ new Set();
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
      console.log("[Chronicle] AlertManager ready, starting poll");
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
    const reminders = await this.reminderManager.getAll();
    console.log(`[Chronicle] Checking ${reminders.length} reminders`);
    for (const reminder of reminders) {
      if (!reminder.alert || reminder.alert === "none") continue;
      if (!reminder.dueDate && !reminder.dueTime) continue;
      if (reminder.status === "done" || reminder.status === "cancelled") continue;
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const dateStr = (_b = reminder.dueDate) != null ? _b : todayStr;
      const alertKey = `reminder-${reminder.id}-${dateStr}-${reminder.alert}`;
      if (this.firedAlerts.has(alertKey)) continue;
      const timeStr = (_c = reminder.dueTime) != null ? _c : "09:00";
      const dueMs = (/* @__PURE__ */ new Date(`${dateStr}T${timeStr}`)).getTime();
      const alertMs = dueMs - this.offsetToMs(reminder.alert);
      console.log(`[Chronicle] Reminder "${reminder.title}" date="${dateStr}" time="${timeStr}" alert="${reminder.alert}" fires at ${new Date(alertMs).toLocaleTimeString()} (${Math.round((alertMs - nowMs) / 1e3)}s)`);
      if (nowMs >= alertMs && nowMs < alertMs + windowMs) {
        console.log(`[Chronicle] FIRING alert for reminder "${reminder.title}"`);
        this.fire(alertKey, reminder.title, this.buildReminderBody(reminder.dueDate, reminder.dueTime, reminder.alert), "reminder");
      }
    }
  }
  fire(key, title, body, type) {
    var _a, _b, _c, _d, _e;
    this.firedAlerts.add(key);
    const settings = this.getSettings();
    const doMacOS = (_a = settings.notifMacOS) != null ? _a : true;
    const doObsidian = (_b = settings.notifObsidian) != null ? _b : true;
    const doSound = (_c = settings.notifSound) != null ? _c : true;
    const icon = type === "event" ? "\u{1F5D3}" : "\u2713";
    if (doMacOS) {
      const soundName = doSound ? type === "event" ? (_d = settings.notifSoundEvent) != null ? _d : "Glass" : (_e = settings.notifSoundReminder) != null ? _e : "Glass" : "";
      let notifSent = false;
      try {
        const { exec } = window.require("child_process");
        const t = `Chronicle \u2014 ${type === "event" ? "Event" : "Reminder"}`;
        const b = `${title} \u2014 ${body}`.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const soundClause = soundName ? ` sound name "${soundName}"` : "";
        exec(
          `osascript -e 'display notification "${b}" with title "${t}"${soundClause}'`,
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
            title: `Chronicle \u2014 ${type === "event" ? "Event" : "Reminder"}`,
            body: `${title}
${body}`
          });
          console.log("[Chronicle] ipcRenderer notification sent");
        } catch (err) {
          console.log("[Chronicle] ipcRenderer failed:", err);
        }
      }
    }
    if (doObsidian) {
      new import_obsidian2.Notice(`${icon} ${title}
${body}`, 8e3);
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
    if (!dueDate) return dueTime ? `Due at ${this.formatTime(dueTime)}` : "Due now";
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
  showTodayCount: true,
  showScheduledCount: true,
  showFlaggedCount: true,
  notifMacOS: true,
  notifObsidian: true,
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
var import_obsidian3 = require("obsidian");

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
var EventFormView = class extends import_obsidian3.ItemView {
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

// src/data/ReminderManager.ts
var import_obsidian4 = require("obsidian");
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
      if (child instanceof import_obsidian4.TFile && child.extension === "md") {
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
    const path = (0, import_obsidian4.normalizePath)(`${this.remindersFolder}/${full.title}.md`);
    await this.app.vault.create(path, this.reminderToMarkdown(full));
    return full;
  }
  async update(reminder) {
    var _a;
    const file = this.findFileForReminder(reminder.id);
    if (!file) return;
    const expectedPath = (0, import_obsidian4.normalizePath)(`${this.remindersFolder}/${reminder.title}.md`);
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
      if (!(child instanceof import_obsidian4.TFile)) continue;
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
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
        linkedReminderIds: (_l = (_k = fm["linked-reminder-ids"]) != null ? _k : fm["linked-reminder-ids"]) != null ? _l : [],
        completedInstances: (_m = fm["completed-instances"]) != null ? _m : [],
        createdAt: (_n = fm["created-at"]) != null ? _n : (/* @__PURE__ */ new Date()).toISOString(),
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

// src/views/ReminderView.ts
var import_obsidian9 = require("obsidian");

// src/ui/ReminderModal.ts
var import_obsidian6 = require("obsidian");
var ReminderModal = class extends import_obsidian6.Modal {
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
    const statuses = [
      { value: "todo", label: "To do" },
      { value: "in-progress", label: "In progress" },
      { value: "done", label: "Done" },
      { value: "cancelled", label: "Cancelled" }
    ];
    const defaultStatus = (_e = (_d = (_c = this.plugin) == null ? void 0 : _c.settings) == null ? void 0 : _d.defaultReminderStatus) != null ? _e : "todo";
    for (const s of statuses) {
      const opt = statusSelect.createEl("option", { value: s.value, text: s.label });
      if (r ? r.status === s.value : s.value === defaultStatus) opt.selected = true;
    }
    const prioritySelect = this.field(row1, "Priority").createEl("select", { cls: "cf-select" });
    const priorities = [
      { value: "none", label: "None" },
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" }
    ];
    const defaultPriority = (_h = (_g = (_f = this.plugin) == null ? void 0 : _f.settings) == null ? void 0 : _g.defaultReminderPriority) != null ? _h : "none";
    for (const p of priorities) {
      const opt = prioritySelect.createEl("option", { value: p.value, text: p.label });
      if (r ? r.priority === p.value : p.value === defaultPriority) opt.selected = true;
    }
    const row2 = form.createDiv("cf-row");
    const dueDateInput = this.field(row2, "Date").createEl("input", { type: "date", cls: "cf-input" });
    dueDateInput.value = (_i = r == null ? void 0 : r.dueDate) != null ? _i : "";
    const dueTimeInput = this.field(row2, "Time").createEl("input", { type: "time", cls: "cf-input" });
    dueTimeInput.value = (_j = r == null ? void 0 : r.dueTime) != null ? _j : "";
    const recSelect = this.field(form, "Repeat").createEl("select", { cls: "cf-select" });
    const recurrences = [
      { value: "", label: "Never" },
      { value: "FREQ=DAILY", label: "Every day" },
      { value: "FREQ=WEEKLY", label: "Every week" },
      { value: "FREQ=MONTHLY", label: "Every month" },
      { value: "FREQ=YEARLY", label: "Every year" },
      { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", label: "Weekdays" }
    ];
    for (const rec of recurrences) {
      const opt = recSelect.createEl("option", { value: rec.value, text: rec.label });
      if ((r == null ? void 0 : r.recurrence) === rec.value) opt.selected = true;
    }
    const alertSelect = this.field(form, "Alert").createEl("select", { cls: "cf-select" });
    const reminderAlerts = [
      { value: "none", label: "None" },
      { value: "at-time", label: "At time of reminder" },
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
    for (const a of reminderAlerts) {
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
          new import_obsidian6.Notice(`A reminder named "${title}" already exists.`, 4e3);
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
var import_obsidian7 = require("obsidian");
var ReminderDetailPopup = class extends import_obsidian7.Modal {
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
    if (r.dueDate) {
      const timeStr = r.dueTime ? `  \xB7  ${this.fmtTime(r.dueTime)}` : "";
      this.row(body, "Due", formatDate(r.dueDate) + timeStr);
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
    "at-time": "At time of reminder",
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

// src/views/ReminderFormView.ts
var import_obsidian8 = require("obsidian");
var REMINDER_FORM_VIEW_TYPE = "chronicle-reminder-form";
var ReminderFormView = class extends import_obsidian8.ItemView {
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
    const statuses = [
      { value: "todo", label: "To do" },
      { value: "in-progress", label: "In progress" },
      { value: "done", label: "Done" },
      { value: "cancelled", label: "Cancelled" }
    ];
    for (const s of statuses) {
      const opt = statusSelect.createEl("option", { value: s.value, text: s.label });
      if ((r == null ? void 0 : r.status) === s.value) opt.selected = true;
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
      if ((r == null ? void 0 : r.priority) === p.value) opt.selected = true;
    }
    const row2 = form.createDiv("cf-row");
    const dueDateInput = this.field(row2, "Date").createEl("input", { type: "date", cls: "cf-input" });
    dueDateInput.value = (_c = r == null ? void 0 : r.dueDate) != null ? _c : "";
    const dueTimeInput = this.field(row2, "Time").createEl("input", { type: "time", cls: "cf-input" });
    dueTimeInput.value = (_d = r == null ? void 0 : r.dueTime) != null ? _d : "";
    const recSelect = this.field(form, "Repeat").createEl("select", { cls: "cf-select" });
    const recurrences = [
      { value: "", label: "Never" },
      { value: "FREQ=DAILY", label: "Every day" },
      { value: "FREQ=WEEKLY", label: "Every week" },
      { value: "FREQ=MONTHLY", label: "Every month" },
      { value: "FREQ=YEARLY", label: "Every year" },
      { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", label: "Weekdays" }
    ];
    for (const rec of recurrences) {
      const opt = recSelect.createEl("option", { value: rec.value, text: rec.label });
      if ((r == null ? void 0 : r.recurrence) === rec.value) opt.selected = true;
    }
    const alertSelect = this.field(form, "Alert").createEl("select", { cls: "cf-select" });
    const formAlerts = [
      { value: "none", label: "None" },
      { value: "at-time", label: "At time of reminder" },
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
          new import_obsidian8.Notice(`A reminder named "${title}" already exists.`, 4e3);
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
var ReminderView = class extends import_obsidian9.ItemView {
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
    const tiles = [
      { id: "today", label: "Today", count: today.length + overdue.length, color: "#FF3B30", badge: overdue.length },
      { id: "scheduled", label: "Scheduled", count: scheduled.length, color: "#378ADD", badge: 0 },
      { id: "all", label: "All", count: all.filter((r) => r.status !== "done").length, color: "#636366", badge: 0 },
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
    const completedCount = all.filter((r) => r.status === "done").length;
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
      titleEl.style.color = list ? list.color : "var(--text-normal)";
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
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
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
        metaDate.setText(this.formatDate(reminder.dueDate));
        if (reminder.dueDate < todayStr) metaDate.addClass("overdue");
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
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
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
  formatDate(dateStr) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 864e5).toISOString().split("T")[0];
    if (dateStr === today) return "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    return (/* @__PURE__ */ new Date(dateStr + "T00:00:00")).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
var import_obsidian12 = require("obsidian");

// src/ui/EventModal.ts
var import_obsidian10 = require("obsidian");
var EventModal = class extends import_obsidian10.Modal {
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
var import_obsidian11 = require("obsidian");
var EventDetailPopup = class extends import_obsidian11.Modal {
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
    if (ev.recurrence) this.row(body, "Repeat", formatRecurrence2(ev.recurrence));
    if (ev.alert && ev.alert !== "none") this.row(body, "Alert", formatAlert2(ev.alert));
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
  renderYearView(main, events, reminders) {
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
        const hasTask = reminders.some((t) => t.dueDate === dateStr && t.status !== "done");
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
  renderMonthView(main, events, reminders) {
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
          new EventDetailPopup(this.app, event, this.calendarManager, this.reminderManager, this.plugin.settings.timeFormat, () => new EventModal(this.app, this.eventManager, this.calendarManager, this.reminderManager, event, () => this.render(), (ev) => this.openEventFullPage(ev)).open()).open();
        });
      });
      reminders.filter((t) => t.dueDate === dateStr && t.status !== "done").slice(0, 2).forEach((task) => {
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
  renderWeekView(main, events, reminders) {
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
      reminders.filter((t) => t.dueDate === dateStr && t.status !== "done").forEach((task) => {
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
  renderDayView(main, events, reminders) {
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
    reminders.filter((t) => t.dueDate === dateStr && t.status !== "done").forEach((task) => {
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
      pill.createDiv("chronicle-event-pill-time").setText(this.formatTime(event.startTime));
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
    this.reminderManager = new ReminderManager(this.app, this.settings.remindersFolder);
    this.eventManager = new EventManager(this.app, this.settings.eventsFolder);
    this.alertManager = new AlertManager(
      this.app,
      this.reminderManager,
      this.eventManager,
      () => this.settings
    );
    this.alertManager.start();
    this.alertManager.stop();
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
