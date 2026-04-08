import { Plugin, WorkspaceLeaf } from "obsidian";
import { ChronicleSettings, DEFAULT_SETTINGS } from "./types";
import { CalendarManager } from "./data/CalendarManager";
import { TaskManager } from "./data/TaskManager";
import { EventManager } from "./data/EventManager";
import { TaskView, TASK_VIEW_TYPE } from "./views/TaskView";

export default class ChroniclePlugin extends Plugin {
  settings: ChronicleSettings;
  calendarManager: CalendarManager;
  taskManager: TaskManager;
  eventManager: EventManager;

  async onload() {
    await this.loadSettings();

    this.calendarManager = new CalendarManager(
      this.settings.calendars,
      () => this.saveSettings()
    );
    this.taskManager = new TaskManager(this.app, this.settings.tasksFolder);
    this.eventManager = new EventManager(this.app, this.settings.eventsFolder);

    // Register the task view
    this.registerView(
      TASK_VIEW_TYPE,
      (leaf) => new TaskView(leaf, this.taskManager, this.calendarManager)
    );

    // Ribbon button
    this.addRibbonIcon("check-circle", "Chronicle", () => {
      this.activateView();
    });

    // Command palette
    this.addCommand({
      id: "open-chronicle",
      name: "Open Chronicle",
      callback: () => this.activateView(),
    });

    console.log("Chronicle loaded ✓");
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
}