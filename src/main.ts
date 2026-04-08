import { Plugin, WorkspaceLeaf } from "obsidian";
import { ChronicleSettings, DEFAULT_SETTINGS } from "./types";
import { CalendarManager } from "./data/CalendarManager";
import { TaskManager } from "./data/TaskManager";
import { EventManager } from "./data/EventManager";
import { TaskView, TASK_VIEW_TYPE } from "./views/TaskView";
import { TaskFormView, TASK_FORM_VIEW_TYPE } from "./views/TaskFormView";
import { EventModal } from "./ui/EventModal";

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
    this.taskManager  = new TaskManager(this.app, this.settings.tasksFolder);
    this.eventManager = new EventManager(this.app, this.settings.eventsFolder);

    // Register views
    this.registerView(
      TASK_VIEW_TYPE,
      (leaf) => new TaskView(leaf, this.taskManager, this.calendarManager, this.eventManager)
    );
    this.registerView(
      TASK_FORM_VIEW_TYPE,
      (leaf) => new TaskFormView(leaf, this.taskManager, this.calendarManager)
    );

    // Ribbon
    this.addRibbonIcon("check-circle", "Chronicle", () => this.activateView());

    // Commands
    this.addCommand({
      id: "open-chronicle",
      name: "Open Chronicle",
      callback: () => this.activateView(),
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

  async openTaskForm() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(TASK_FORM_VIEW_TYPE)[0];
    if (existing) existing.detach();
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: TASK_FORM_VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);

    // Pass refresh callback to the form
    await new Promise(resolve => setTimeout(resolve, 50));
    const formLeaf = workspace.getLeavesOfType(TASK_FORM_VIEW_TYPE)[0];
    if (formLeaf?.view instanceof TaskFormView) {
      (formLeaf.view as TaskFormView).onSave = () => {
        const dashLeaf = workspace.getLeavesOfType(TASK_VIEW_TYPE)[0];
        if (dashLeaf?.view instanceof TaskView) {
          (dashLeaf.view as TaskView).render();
        }
      };
    }
  }

  openEventModal() {
    new EventModal(
      this.app,
      this.eventManager,
      this.calendarManager,
      undefined,
      () => {}
    ).open();
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(TASK_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(TASK_FORM_VIEW_TYPE);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}