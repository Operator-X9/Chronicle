import { ChronicleSettingsTab } from "./ui/SettingsTab";
import { AlertManager } from "./data/AlertManager";
import { ChronicleSettings, DEFAULT_SETTINGS, ChronicleEvent } from "./types";
import { EventFormView, EVENT_FORM_VIEW_TYPE } from "./views/EventFormView";
import { Plugin, WorkspaceLeaf } from "obsidian";
import { ChronicleSettings, DEFAULT_SETTINGS } from "./types";
import { CalendarManager } from "./data/CalendarManager";
import { TaskManager } from "./data/TaskManager";
import { EventManager } from "./data/EventManager";
import { TaskView, TASK_VIEW_TYPE } from "./views/TaskView";
import { TaskFormView, TASK_FORM_VIEW_TYPE } from "./views/TaskFormView";
import { CalendarView, CALENDAR_VIEW_TYPE } from "./views/CalendarView";
import { EventModal } from "./ui/EventModal";

export default class ChroniclePlugin extends Plugin {
  settings: ChronicleSettings;
  calendarManager: CalendarManager;
  taskManager: TaskManager;
  eventManager: EventManager;
  alertManager: AlertManager;

  async onload() {
    await this.loadSettings();

    this.calendarManager = new CalendarManager(
      this.settings.calendars,
      () => this.saveSettings()
    );
    this.taskManager  = new TaskManager(this.app, this.settings.tasksFolder);
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

    // Ribbon — tasks (checklist icon)
    this.addRibbonIcon("check-circle", "Chronicle Tasks", () => this.activateTaskView());

    // Ribbon — calendar
    this.addRibbonIcon("calendar", "Chronicle Calendar", () => this.activateCalendarView());

    // Commands
    this.addCommand({
      id: "open-chronicle",
      name: "Open task dashboard",
      callback: () => this.activateTaskView(),
    });
    this.addCommand({
      id: "open-calendar",
      name: "Open calendar",
      callback: () => this.activateCalendarView(),
    });
    this.addCommand({
      id: "new-task",
      name: "New task",
      hotkeys: [{ modifiers: ["Mod"], key: "n" }],
      callback: () => this.openTaskForm(),
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

  openEventModal(event?: ChronicleEvent) {
    new EventModal(
      this.app,
      this.eventManager,
      this.calendarManager,
      event,
      undefined,
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