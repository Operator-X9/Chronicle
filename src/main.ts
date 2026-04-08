import { Plugin } from "obsidian";
import { ChronicleSettings, DEFAULT_SETTINGS } from "./types";
import { CalendarManager } from "./data/CalendarManager";
import { TaskManager } from "./data/TaskManager";
import { EventManager } from "./data/EventManager";

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

    console.log("Chronicle loaded ✓");
  }

  onunload() {
    console.log("Chronicle unloaded");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}