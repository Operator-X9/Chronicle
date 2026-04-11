import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type ChroniclePlugin from "../main";
import { CalendarColor, ChronicleCalendar, ChronicleList, ReminderStatus, ReminderPriority, AlertOffset } from "../types";
import { CalendarManager } from "../data/CalendarManager";

export class ChronicleSettingsTab extends PluginSettingTab {
  private plugin: ChroniclePlugin;
  private activeTab: string = "general";

  constructor(app: App, plugin: ChroniclePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("chronicle-settings");

    // ── Tab bar ────────────────────────────────────────────────────────────
    const tabBar = containerEl.createDiv("chronicle-tab-bar");
    const tabs = [
      { id: "general",    label: "General" },
      { id: "calendar",   label: "Calendar" },
      { id: "reminders",  label: "Reminders" },
      { id: "appearance", label: "Appearance" },
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

    // ── Tab content ────────────────────────────────────────────────────────
    const content = containerEl.createDiv("chronicle-tab-content");

    switch (this.activeTab) {
      case "general":    this.renderGeneral(content);    break;
      case "calendar":   this.renderCalendar(content);   break;
      case "reminders":  this.renderReminders(content);  break;
      case "appearance": this.renderAppearance(content); break;
    }
  }

  // ── General ───────────────────────────────────────────────────────────────

  private renderGeneral(el: HTMLElement) {
    this.subHeader(el, "Storage");

    new Setting(el)
      .setName("Reminders folder")
      .setDesc("Where reminder notes are stored in your vault.")
      .addText(text => text
        .setPlaceholder("Chronicle/Reminders")
        .setValue(this.plugin.settings.remindersFolder)
        .onChange(async (value) => {
          this.plugin.settings.remindersFolder = value || "Chronicle/Reminders";
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Events folder")
      .setDesc("Where event notes are stored in your vault.")
      .addText(text => text
        .setPlaceholder("Chronicle/Events")
        .setValue(this.plugin.settings.eventsFolder)
        .onChange(async (value) => {
          this.plugin.settings.eventsFolder = value || "Chronicle/Events";
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Time format")
      .setDesc("How times are displayed throughout Chronicle.")
      .addDropdown(drop => drop
        .addOption("12h", "12-hour (2:30 PM)")
        .addOption("24h", "24-hour (14:30)")
        .setValue(this.plugin.settings.timeFormat)
        .onChange(async (value) => {
          this.plugin.settings.timeFormat = value as "12h" | "24h";
          await this.plugin.saveSettings();
        })
      );

    this.divider(el);
    this.subHeader(el, "Notifications");

    new Setting(el)
      .setName("macOS system notification")
      .setDesc("Show a native macOS notification banner when an alert fires.")
      .addToggle(t => t
        .setValue(this.plugin.settings.notifMacOS ?? true)
        .onChange(async (value) => {
          this.plugin.settings.notifMacOS = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Obsidian in-app toast")
      .setDesc("Show a banner inside Obsidian when an alert fires.")
      .addToggle(t => t
        .setValue(this.plugin.settings.notifObsidian ?? true)
        .onChange(async (value) => {
          this.plugin.settings.notifObsidian = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Sound")
      .setDesc("Play a chime when an alert fires.")
      .addToggle(t => t
        .setValue(this.plugin.settings.notifSound ?? true)
        .onChange(async (value) => {
          this.plugin.settings.notifSound = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Alert for events")
      .setDesc("Enable alerts for calendar events.")
      .addToggle(t => t
        .setValue(this.plugin.settings.notifEvents ?? true)
        .onChange(async (value) => {
          this.plugin.settings.notifEvents = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Alert for reminders")
      .setDesc("Enable alerts for reminders with a due time.")
      .addToggle(t => t
        .setValue(this.plugin.settings.notifReminders ?? true)
        .onChange(async (value) => {
          this.plugin.settings.notifReminders = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Send test notification")
      .setDesc("Fires a test alert using your current settings.")
      .addButton(btn => btn
        .setButtonText("Test now")
        .onClick(() => {
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

  private renderCalendar(el: HTMLElement) {
    this.subHeader(el, "Calendar defaults");

    new Setting(el)
      .setName("Start of week")
      .setDesc("Which day the calendar week starts on.")
      .addDropdown(drop => drop
        .addOption("0", "Sunday")
        .addOption("1", "Monday")
        .addOption("6", "Saturday")
        .setValue(String(this.plugin.settings.startOfWeek))
        .onChange(async (value) => {
          this.plugin.settings.startOfWeek = parseInt(value) as 0 | 1 | 6;
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Default view")
      .setDesc("Which view opens when you launch the calendar.")
      .addDropdown(drop => drop
        .addOption("day",   "Day")
        .addOption("week",  "Week")
        .addOption("month", "Month")
        .addOption("year",  "Year")
        .setValue(this.plugin.settings.defaultCalendarView)
        .onChange(async (value) => {
          this.plugin.settings.defaultCalendarView = value as "day"|"week"|"month"|"year";
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Default calendar")
      .setDesc("Calendar assigned to new events by default.")
      .addDropdown(drop => {
        drop.addOption("", "None");
        for (const cal of this.plugin.calendarManager.getAll()) {
          drop.addOption(cal.id, cal.name);
        }
        drop.setValue(this.plugin.settings.defaultCalendarId ?? "");
        drop.onChange(async (value) => {
          this.plugin.settings.defaultCalendarId = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(el)
      .setName("Default event duration")
      .setDesc("How long new events last by default (minutes).")
      .addSlider(slider => slider
        .setLimits(15, 480, 15)
        .setValue(this.plugin.settings.defaultEventDuration ?? 60)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.defaultEventDuration = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Default event alert")
      .setDesc("Alert offset applied to new events by default.")
      .addDropdown(drop => this.addAlertOptions(drop)
        .setValue(this.plugin.settings.defaultAlert)
        .onChange(async (value) => {
          this.plugin.settings.defaultAlert = value as AlertOffset;
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
      placeholder: "New calendar name",
    });

    const colorSelect = addRow.createEl("input", { type: "color", cls: "cs-color-picker" });
    colorSelect.value = "#378ADD";

    const addBtn = addRow.createEl("button", { cls: "cs-btn-primary", text: "Add calendar" });
    addBtn.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      this.plugin.calendarManager.create(name, colorSelect.value as CalendarColor);
      await this.plugin.saveSettings();
      new Notice(`Calendar "${name}" created`);
      this.display();
    });
  }

  private renderCalendarRow(el: HTMLElement, cal: ChronicleCalendar, isOnly: boolean) {
    const setting = new Setting(el);

    // Color dot preview
    const dot = setting.nameEl.createDiv("cs-cal-dot");
    dot.style.backgroundColor = CalendarManager.colorToHex(cal.color);
    setting.nameEl.createSpan({ text: cal.name });

    setting
      .addColorPicker(picker => {
        // Convert named colors to hex for the picker
        picker.setValue(CalendarManager.colorToHex(cal.color));
        picker.onChange(async (hex) => {
          dot.style.backgroundColor = hex;
          this.plugin.calendarManager.update(cal.id, { color: hex });
          await this.plugin.saveSettings();
        });
      })
      .addText(text => text
        .setValue(cal.name)
        .setPlaceholder("Calendar name")
        .onChange(async (value) => {
          if (!value.trim()) return;
          this.plugin.calendarManager.update(cal.id, { name: value.trim() });
          await this.plugin.saveSettings();
        })
      )
      .addToggle(toggle => toggle
        .setValue(cal.isVisible)
        .setTooltip("Show in views")
        .onChange(async (value) => {
          this.plugin.calendarManager.update(cal.id, { isVisible: value });
          await this.plugin.saveSettings();
        })
      )
      .addButton(btn => btn
        .setIcon("trash")
        .setTooltip("Delete calendar")
        .setDisabled(isOnly)
        .onClick(async () => {
          this.plugin.calendarManager.delete(cal.id);
          await this.plugin.saveSettings();
          new Notice(`Calendar "${cal.name}" deleted`);
          this.display();
        })
      );
  }

  private renderListRow(el: HTMLElement, list: ChronicleList, isOnly: boolean) {
    const setting = new Setting(el);

    const dot = setting.nameEl.createDiv("cs-cal-dot");
    dot.style.backgroundColor = list.color;
    setting.nameEl.createSpan({ text: list.name });

    setting
      .addColorPicker(picker => {
        picker.setValue(list.color);
        picker.onChange(async (hex) => {
          dot.style.backgroundColor = hex;
          this.plugin.listManager.update(list.id, { color: hex });
          await this.plugin.saveSettings();
        });
      })
      .addText(text => text
        .setValue(list.name)
        .setPlaceholder("List name")
        .onChange(async (value) => {
          if (!value.trim()) return;
          this.plugin.listManager.update(list.id, { name: value.trim() });
          await this.plugin.saveSettings();
        })
      )
      .addButton(btn => btn
        .setIcon("trash")
        .setTooltip("Delete list")
        .setDisabled(isOnly)
        .onClick(async () => {
          this.plugin.listManager.delete(list.id);
          await this.plugin.saveSettings();
          new Notice(`List "${list.name}" deleted`);
          this.display();
        })
      );
  }

  // ── Reminders ─────────────────────────────────────────────────────────────

  private renderReminders(el: HTMLElement) {
    this.subHeader(el, "Reminder defaults");

    new Setting(el)
      .setName("Default status")
      .addDropdown(drop => drop
        .addOption("todo",        "To do")
        .addOption("in-progress", "In progress")
        .addOption("done",        "Done")
        .addOption("cancelled",   "Cancelled")
        .setValue(this.plugin.settings.defaultReminderStatus)
        .onChange(async (value) => {
          this.plugin.settings.defaultReminderStatus = value as ReminderStatus;
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Default priority")
      .addDropdown(drop => drop
        .addOption("none",   "None")
        .addOption("low",    "Low")
        .addOption("medium", "Medium")
        .addOption("high",   "High")
        .setValue(this.plugin.settings.defaultReminderPriority)
        .onChange(async (value) => {
          this.plugin.settings.defaultReminderPriority = value as ReminderPriority;
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Default alert")
      .setDesc("Alert offset applied to new reminders by default.")
      .addDropdown(drop => this.addAlertOptions(drop)
        .setValue(this.plugin.settings.defaultAlert)
        .onChange(async (value) => {
          this.plugin.settings.defaultAlert = value as AlertOffset;
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Default list")
      .setDesc("List assigned to new reminders by default.")
      .addDropdown(drop => {
        drop.addOption("", "None");
        for (const list of this.plugin.listManager.getAll()) {
          drop.addOption(list.id, list.name);
        }
        drop.setValue(this.plugin.settings.defaultListId ?? "");
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
      placeholder: "New list name",
    });

    const listColorPicker = addListRow.createEl("input", { type: "color", cls: "cs-color-picker" });
    listColorPicker.value = "#378ADD";

    const addListBtn = addListRow.createEl("button", { cls: "cs-btn-primary", text: "Add list" });
    addListBtn.addEventListener("click", async () => {
      const name = listNameInput.value.trim();
      if (!name) { listNameInput.focus(); return; }
      this.plugin.listManager.create(name, listColorPicker.value);
      await this.plugin.saveSettings();
      new Notice(`List "${name}" created`);
      this.display();
    });

    this.divider(el);
    this.subHeader(el, "Smart list visibility");

    new Setting(el)
      .setName("Show Today count")
      .addToggle(t => t
        .setValue(this.plugin.settings.showTodayCount)
        .onChange(async (value) => {
          this.plugin.settings.showTodayCount = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Show Scheduled count")
      .addToggle(t => t
        .setValue(this.plugin.settings.showScheduledCount)
        .onChange(async (value) => {
          this.plugin.settings.showScheduledCount = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Show Flagged count")
      .addToggle(t => t
        .setValue(this.plugin.settings.showFlaggedCount)
        .onChange(async (value) => {
          this.plugin.settings.showFlaggedCount = value;
          await this.plugin.saveSettings();
        })
      );
  }

  // ── Appearance ────────────────────────────────────────────────────────────

  private renderAppearance(el: HTMLElement) {
    this.subHeader(el, "Layout");

    new Setting(el)
      .setName("Reminder list density")
      .setDesc("Comfortable adds more padding between reminder rows.")
      .addDropdown(drop => drop
        .addOption("compact",     "Compact")
        .addOption("comfortable", "Comfortable")
        .setValue(this.plugin.settings.density ?? "comfortable")
        .onChange(async (value) => {
          this.plugin.settings.density = value as "compact" | "comfortable";
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Show completed count")
      .setDesc("Show the number of completed reminders next to the Completed entry.")
      .addToggle(t => t
        .setValue(this.plugin.settings.showCompletedCount ?? true)
        .onChange(async (value) => {
          this.plugin.settings.showCompletedCount = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(el)
      .setName("Show reminder count subtitle")
      .setDesc("Show '3 reminders' under the list title in the main panel.")
      .addToggle(t => t
        .setValue(this.plugin.settings.showReminderCountSubtitle ?? true)
        .onChange(async (value) => {
          this.plugin.settings.showReminderCountSubtitle = value;
          await this.plugin.saveSettings();
        })
      );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private subHeader(el: HTMLElement, title: string) {
    el.createDiv("cs-sub-header").setText(title);
  }

  private divider(el: HTMLElement) {
    el.createDiv("cs-divider");
  }

  private addAlertOptions(drop: any) {
    return drop
      .addOption("none",    "None")
      .addOption("at-time", "At time")
      .addOption("5min",    "5 minutes before")
      .addOption("10min",   "10 minutes before")
      .addOption("15min",   "15 minutes before")
      .addOption("30min",   "30 minutes before")
      .addOption("1hour",   "1 hour before")
      .addOption("2hours",  "2 hours before")
      .addOption("1day",    "1 day before")
      .addOption("2days",   "2 days before")
      .addOption("1week",   "1 week before");
  }
}