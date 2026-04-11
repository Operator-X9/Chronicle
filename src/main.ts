import { ChronicleSettingsTab } from "./ui/SettingsTab";
import { AlertManager } from "./data/AlertManager";
import { ChronicleSettings, DEFAULT_SETTINGS, ChronicleEvent } from "./types";
import { EventFormView, EVENT_FORM_VIEW_TYPE } from "./views/EventFormView";
import { Plugin } from "obsidian";
import { CalendarManager } from "./data/CalendarManager";
import { ListManager } from "./data/ListManager";
import { ReminderManager } from "./data/ReminderManager";
import { EventManager } from "./data/EventManager";
import { ReminderView, REMINDER_VIEW_TYPE } from "./views/ReminderView";
import { ReminderFormView, REMINDER_FORM_VIEW_TYPE } from "./views/ReminderFormView";
import { CalendarView, CALENDAR_VIEW_TYPE } from "./views/CalendarView";
import { EventModal } from "./ui/EventModal";

export default class ChroniclePlugin extends Plugin {
  settings: ChronicleSettings;
  calendarManager: CalendarManager;
  listManager: ListManager;
  reminderManager!: ReminderManager;
  eventManager: EventManager;
  alertManager: AlertManager;

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
    this.eventManager    = new EventManager(this.app, this.settings.eventsFolder);

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
      callback: () => this.activateReminderView(),
    });
    this.addCommand({
      id: "open-calendar",
      name: "Open calendar",
      callback: () => this.activateCalendarView(),
    });
    this.addCommand({
      id: "new-reminder",
      name: "New reminder",
      hotkeys: [{ modifiers: ["Mod"], key: "n" }],
      callback: () => this.openReminderForm(),
    });
    this.addCommand({
      id: "new-event",
      name: "New event",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "n" }],
      callback: () => this.openEventModal(),
    });

    this.addSettingTab(new ChronicleSettingsTab(this.app, this));
    console.log("Chronicle loaded ✓");
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

  openEventModal(event?: ChronicleEvent) {
    new EventModal(
      this.app,
      this.eventManager,
      this.calendarManager,
      this.reminderManager,
      event,
      undefined,
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
    (this.app.workspace as any).trigger("chronicle:settings-changed");
  }

  async openEventFullPage(event?: ChronicleEvent) {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(EVENT_FORM_VIEW_TYPE)[0];
    if (existing) existing.detach();
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: EVENT_FORM_VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);

    await new Promise(resolve => setTimeout(resolve, 100));
    const formLeaf = workspace.getLeavesOfType(EVENT_FORM_VIEW_TYPE)[0];
    const formView = formLeaf?.view as EventFormView | undefined;
    if (formView && event) formView.loadEvent(event);
  }
}
