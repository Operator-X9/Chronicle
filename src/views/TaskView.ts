import { ItemView, WorkspaceLeaf, TFile } from "obsidian";
import { ChronicleTask, ChronicleCalendar } from "../types";
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

  async onOpen() { await this.render(); }

  async render() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("chronicle-app");

    const all      = await this.taskManager.getAll();
    const today    = await this.taskManager.getDueToday();
    const scheduled = await this.taskManager.getScheduled();
    const flagged  = await this.taskManager.getFlagged();
    const overdue  = await this.taskManager.getOverdue();
    const calendars = this.calendarManager.getAll();

    const layout  = container.createDiv("chronicle-layout");
    const sidebar = layout.createDiv("chronicle-sidebar");
    const main    = layout.createDiv("chronicle-main");

    // ── Smart list tiles ──────────────────────────────────────────────────
    const tilesGrid = sidebar.createDiv("chronicle-tiles");

    const tiles = [
      { id: "today",     label: "Today",     count: today.length + overdue.length, color: "#FF3B30", badge: overdue.length },
      { id: "scheduled", label: "Scheduled", count: scheduled.length,              color: "#378ADD", badge: 0 },
      { id: "all",       label: "All",       count: all.filter(t => t.status !== "done").length, color: "#636366", badge: 0 },
      { id: "flagged",   label: "Flagged",   count: flagged.length,                color: "#FF9500", badge: 0 },
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
      t.addEventListener("click", () => { this.currentListId = tile.id; this.render(); });
    }

    // ── My Lists ──────────────────────────────────────────────────────────
    const listsSection = sidebar.createDiv("chronicle-lists-section");
    listsSection.createDiv("chronicle-section-label").setText("My Lists");

    for (const cal of calendars) {
      const row = listsSection.createDiv("chronicle-list-row");
      if (cal.id === this.currentListId) row.addClass("active");

      const dot = row.createDiv("chronicle-list-dot");
      dot.style.backgroundColor = CalendarManager.colorToHex(cal.color);

      row.createDiv("chronicle-list-name").setText(cal.name);

      const calCount = all.filter(t => t.calendarId === cal.id && t.status !== "done").length;
      if (calCount > 0) row.createDiv("chronicle-list-count").setText(String(calCount));

      row.addEventListener("click", () => { this.currentListId = cal.id; this.render(); });
    }

    // ── Main panel ────────────────────────────────────────────────────────
    await this.renderMainPanel(main, all, overdue);
  }

  private async renderMainPanel(
    main: HTMLElement,
    all: ChronicleTask[],
    overdue: ChronicleTask[]
  ) {
    const header = main.createDiv("chronicle-main-header");
    const titleEl = header.createDiv("chronicle-main-title");

    let tasks: ChronicleTask[] = [];

    const smartColors: Record<string, string> = {
      today: "#FF3B30", scheduled: "#378ADD", all: "#636366", flagged: "#FF9500"
    };

    if (smartColors[this.currentListId]) {
      const labels: Record<string, string> = {
        today: "Today", scheduled: "Scheduled", all: "All", flagged: "Flagged"
      };
      titleEl.setText(labels[this.currentListId]);
      titleEl.style.color = smartColors[this.currentListId];

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
      tasks = all.filter(t => t.calendarId === this.currentListId && t.status !== "done");
    }

    // Task count subtitle
    const activeTasks = tasks.filter(t => t.status !== "done");
    if (activeTasks.length > 0) {
      header.createDiv("chronicle-main-subtitle").setText(
        `${activeTasks.length} ${activeTasks.length === 1 ? "task" : "tasks"}`
      );
    }

    const listEl = main.createDiv("chronicle-task-list");

    if (tasks.length === 0) {
      this.renderEmptyState(listEl);
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

    // Inline new task entry
    const newRow = listEl.createDiv("chronicle-new-task-row");
    const plusIcon = newRow.createDiv("chronicle-new-task-plus");
    plusIcon.setText("+");
    const newInput = newRow.createEl("input", {
      type: "text",
      placeholder: "New reminder...",
      cls: "chronicle-new-task-input"
    });

    newInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && newInput.value.trim()) {
        const calendarId = smartColors[this.currentListId]
          ? undefined
          : this.currentListId;
        await this.taskManager.create({
          title: newInput.value.trim(),
          status: "todo",
          priority: this.currentListId === "flagged" ? "high" : "none",
          calendarId,
          tags: [], contexts: [], linkedNotes: [], projects: [],
          timeEntries: [], customFields: [], completedInstances: [],
        });
        await this.render();
      }
      if (e.key === "Escape") newInput.blur();
    });
  }

  private renderEmptyState(container: HTMLElement) {
    const empty = container.createDiv("chronicle-empty-state");
    const icon = empty.createDiv("chronicle-empty-icon");
    icon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    empty.createDiv("chronicle-empty-title").setText("All done");
    empty.createDiv("chronicle-empty-subtitle").setText("Nothing left in this list.");
  }

  private renderTaskRow(container: HTMLElement, task: ChronicleTask) {
    const row = container.createDiv("chronicle-task-row");
    const isDone = task.status === "done";

    // Checkbox
    const checkboxWrap = row.createDiv("chronicle-checkbox-wrap");
    const checkbox = checkboxWrap.createDiv("chronicle-checkbox");
    if (isDone) checkbox.addClass("done");

    // Checkmark SVG inside checkbox
    const checkSvg = `<svg class="chronicle-checkmark" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    checkbox.innerHTML = checkSvg;

    checkbox.addEventListener("click", async (e) => {
      e.stopPropagation();
      checkbox.addClass("completing");
      setTimeout(async () => {
        await this.taskManager.update({
          ...task,
          status: isDone ? "todo" : "done",
          completedAt: isDone ? undefined : new Date().toISOString(),
        });
        await this.render();
      }, 300);
    });

    // Content — clicking opens the note
    const content = row.createDiv("chronicle-task-content");
    content.addEventListener("click", () => this.openTaskNote(task));

    const titleEl = content.createDiv("chronicle-task-title");
    titleEl.setText(task.title);
    if (isDone) titleEl.addClass("done");

    // Meta
    const today = new Date().toISOString().split("T")[0];
    if (task.dueDate || task.calendarId) {
      const meta = content.createDiv("chronicle-task-meta");

      if (task.dueDate) {
        const metaDate = meta.createSpan("chronicle-task-date");
        metaDate.setText(this.formatDate(task.dueDate));
        if (task.dueDate < today) metaDate.addClass("overdue");
      }

      if (task.calendarId) {
        const cal = this.calendarManager.getById(task.calendarId);
        if (cal) {
          const calDot = meta.createSpan("chronicle-task-cal-dot");
          calDot.style.backgroundColor = CalendarManager.colorToHex(cal.color);
          meta.createSpan("chronicle-task-cal-name").setText(cal.name);
        }
      }
    }

    // Priority flag
    if (task.priority === "high") {
      const flag = row.createDiv("chronicle-flag");
      flag.setText("⚑");
    }

    // Right-click to delete
    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const menu = document.createElement("div");
      menu.className = "chronicle-context-menu";
      menu.style.left = `${e.clientX}px`;
      menu.style.top  = `${e.clientY}px`;

      const deleteItem = menu.createDiv("chronicle-context-item chronicle-context-delete");
      deleteItem.setText("Delete task");
      deleteItem.addEventListener("click", async () => {
        menu.remove();
        await this.taskManager.delete(task.id);
        await this.render();
      });

      const cancelItem = menu.createDiv("chronicle-context-item");
      cancelItem.setText("Cancel");
      cancelItem.addEventListener("click", () => menu.remove());

      document.body.appendChild(menu);
      setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
    });
  }

  private async openTaskNote(task: ChronicleTask) {
    const folder = this.taskManager["tasksFolder"] as string;
    const path = `${folder}/${task.title}.md`;
    const file = this.app.vault.getFileByPath(path);
    if (file instanceof TFile) {
      const leaf = this.app.workspace.getLeaf("tab");
      await leaf.openFile(file);
    }
  }

  private groupTasks(tasks: ChronicleTask[]): Record<string, ChronicleTask[]> {
    const today   = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    const groups: Record<string, ChronicleTask[]> = {
      "Overdue":   [],
      "Today":     [],
      "This week": [],
      "Later":     [],
      "No date":   [],
    };

    for (const task of tasks) {
      if (task.status === "done") continue;
      if (!task.dueDate)           { groups["No date"].push(task);   continue; }
      if (task.dueDate < today)    { groups["Overdue"].push(task);   continue; }
      if (task.dueDate === today)  { groups["Today"].push(task);     continue; }
      if (task.dueDate <= nextWeek){ groups["This week"].push(task); continue; }
      groups["Later"].push(task);
    }

    return groups;
  }

  private formatDate(dateStr: string): string {
    const today    = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    if (dateStr === today)    return "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short", day: "numeric"
    });
  }
}