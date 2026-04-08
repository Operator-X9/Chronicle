import { ItemView, WorkspaceLeaf, moment } from "obsidian";
import { ChronicleTask, ChronicleCalendar, CalendarColor } from "../types";
import { TaskManager } from "../data/TaskManager";
import { CalendarManager } from "../data/CalendarManager";

export const TASK_VIEW_TYPE = "chronicle-task-view";

export class TaskView extends ItemView {
  private taskManager: TaskManager;
  private calendarManager: CalendarManager;
  private currentListId: string = "today";

  constructor(
    leaf: WorkspaceLeaf,
    taskManager: TaskManager,
    calendarManager: CalendarManager
  ) {
    super(leaf);
    this.taskManager = taskManager;
    this.calendarManager = calendarManager;
  }

  getViewType(): string { return TASK_VIEW_TYPE; }
  getDisplayText(): string { return "Chronicle"; }
  getIcon(): string { return "check-circle"; }

  async onOpen() {
    await this.render();
  }

  async render() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("chronicle-app");

    const all = await this.taskManager.getAll();
    const today = await this.taskManager.getDueToday();
    const scheduled = await this.taskManager.getScheduled();
    const flagged = await this.taskManager.getFlagged();
    const overdue = await this.taskManager.getOverdue();
    const calendars = this.calendarManager.getAll();

    // ── Layout ──────────────────────────────────────────────────────────────
    const layout = container.createDiv("chronicle-layout");
    const sidebar = layout.createDiv("chronicle-sidebar");
    const main = layout.createDiv("chronicle-main");

    // ── Smart list tiles ────────────────────────────────────────────────────
    const tilesGrid = sidebar.createDiv("chronicle-tiles");

    const tiles = [
      { id: "today",     label: "Today",     count: today.length + overdue.length, color: "#FF3B30" },
      { id: "scheduled", label: "Scheduled", count: scheduled.length,              color: "#378ADD" },
      { id: "all",       label: "All",       count: all.filter(t => t.status !== "done").length, color: "#555555" },
      { id: "flagged",   label: "Flagged",   count: flagged.length,                color: "#FF9500" },
    ];

    for (const tile of tiles) {
      const t = tilesGrid.createDiv("chronicle-tile");
      t.style.backgroundColor = tile.color;
      if (tile.id === this.currentListId) t.addClass("active");
      t.createDiv("chronicle-tile-count").setText(String(tile.count));
      t.createDiv("chronicle-tile-label").setText(tile.label);
      t.addEventListener("click", () => {
        this.currentListId = tile.id;
        this.render();
      });
    }

    // ── My Lists ────────────────────────────────────────────────────────────
    const listsSection = sidebar.createDiv("chronicle-lists-section");
    listsSection.createDiv("chronicle-section-label").setText("My Lists");

    for (const cal of calendars) {
      const row = listsSection.createDiv("chronicle-list-row");
      if (cal.id === this.currentListId) row.addClass("active");

      const dot = row.createDiv("chronicle-list-dot");
      dot.style.backgroundColor = CalendarManager.colorToHex(cal.color);

      row.createDiv("chronicle-list-name").setText(cal.name);

      const calTasks = all.filter(
        t => t.calendarId === cal.id && t.status !== "done"
      );
      row.createDiv("chronicle-list-count").setText(String(calTasks.length));

      row.addEventListener("click", () => {
        this.currentListId = cal.id;
        this.render();
      });
    }

    // ── Main panel ──────────────────────────────────────────────────────────
    await this.renderMainPanel(main, all, overdue, calendars);
  }

  private async renderMainPanel(
    main: HTMLElement,
    all: ChronicleTask[],
    overdue: ChronicleTask[],
    calendars: ChronicleCalendar[]
  ) {
    // Title
    const header = main.createDiv("chronicle-main-header");
    const titleEl = header.createDiv("chronicle-main-title");

    let tasks: ChronicleTask[] = [];

    const smartLists: Record<string, string> = {
      today: "Today", scheduled: "Scheduled", all: "All", flagged: "Flagged"
    };

    if (smartLists[this.currentListId]) {
      titleEl.setText(smartLists[this.currentListId]);
      titleEl.style.color = {
        today: "#FF3B30", scheduled: "#378ADD", all: "#555555", flagged: "#FF9500"
      }[this.currentListId] ?? "var(--text-normal)";

      switch (this.currentListId) {
        case "today":
          tasks = [...overdue, ...(await this.taskManager.getDueToday())];
          break;
        case "scheduled":
          tasks = await this.taskManager.getScheduled();
          break;
        case "flagged":
          tasks = await this.taskManager.getFlagged();
          break;
        case "all":
          tasks = all.filter(t => t.status !== "done");
          break;
      }
    } else {
      const cal = this.calendarManager.getById(this.currentListId);
      titleEl.setText(cal?.name ?? "List");
      titleEl.style.color = cal ? CalendarManager.colorToHex(cal.color) : "var(--text-normal)";
      tasks = all.filter(
        t => t.calendarId === this.currentListId && t.status !== "done"
      );
    }

    // Task list
    const listEl = main.createDiv("chronicle-task-list");

    if (tasks.length === 0) {
      listEl.createDiv("chronicle-empty").setText("No tasks");
    } else {
      const groups = this.groupTasks(tasks);
      for (const [group, groupTasks] of Object.entries(groups)) {
        if (groupTasks.length === 0) continue;
        listEl.createDiv("chronicle-group-label").setText(group);
        for (const task of groupTasks) {
          this.renderTaskRow(listEl, task);
        }
      }
    }

    // New task inline entry
    const newRow = listEl.createDiv("chronicle-new-task-row");
    const newInput = newRow.createEl("input", {
      type: "text",
      placeholder: "New reminder...",
      cls: "chronicle-new-task-input"
    });
    newInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && newInput.value.trim()) {
        await this.taskManager.create({
          title: newInput.value.trim(),
          status: "todo",
          priority: this.currentListId === "flagged" ? "high" : "none",
          calendarId: Object.values({
            today: undefined, scheduled: undefined,
            all: undefined, flagged: undefined
          }).includes(this.currentListId as any)
            ? undefined
            : this.currentListId,
          tags: [], contexts: [], linkedNotes: [], projects: [],
          timeEntries: [], customFields: [], completedInstances: [],
        });
        await this.render();
      }
    });
  }

  private renderTaskRow(container: HTMLElement, task: ChronicleTask) {
    const row = container.createDiv("chronicle-task-row");

    // Checkbox
    const checkbox = row.createDiv("chronicle-checkbox");
    if (task.status === "done") checkbox.addClass("done");
    checkbox.addEventListener("click", async () => {
      await this.taskManager.update({
        ...task,
        status: task.status === "done" ? "todo" : "done",
        completedAt: task.status === "done" ? undefined : new Date().toISOString(),
      });
      await this.render();
    });

    // Content
    const content = row.createDiv("chronicle-task-content");
    const titleEl = content.createDiv("chronicle-task-title");
    titleEl.setText(task.title);
    if (task.status === "done") titleEl.addClass("done");

    // Meta row
    if (task.dueDate || task.calendarId) {
      const meta = content.createDiv("chronicle-task-meta");

      if (task.dueDate) {
        const today = new Date().toISOString().split("T")[0];
        const metaDate = meta.createDiv("chronicle-task-date");
        metaDate.setText(this.formatDate(task.dueDate));
        if (task.dueDate < today) metaDate.addClass("overdue");
      }
    }

    // Priority flag
    if (task.priority === "high") {
      row.createDiv("chronicle-flag").setText("⚑");
    }
  }

  private groupTasks(tasks: ChronicleTask[]): Record<string, ChronicleTask[]> {
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    const groups: Record<string, ChronicleTask[]> = {
      "Overdue": [],
      "Today": [],
      "This week": [],
      "Later": [],
      "No date": [],
    };

    for (const task of tasks) {
      if (!task.dueDate) { groups["No date"].push(task); continue; }
      if (task.dueDate < today) { groups["Overdue"].push(task); continue; }
      if (task.dueDate === today) { groups["Today"].push(task); continue; }
      if (task.dueDate <= nextWeek) { groups["This week"].push(task); continue; }
      groups["Later"].push(task);
    }

    return groups;
  }

  private formatDate(dateStr: string): string {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    if (dateStr === today) return "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short", day: "numeric"
    });
  }
}