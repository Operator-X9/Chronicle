import { ItemView, WorkspaceLeaf } from "obsidian";
import { TaskModal } from "../ui/TaskModal";
import type ChroniclePlugin from "../main";
import { ChronicleTask } from "../types";
import { TaskManager } from "../data/TaskManager";
import { CalendarManager } from "../data/CalendarManager";
import { TaskFormView, TASK_FORM_VIEW_TYPE } from "./TaskFormView";
import { EventManager } from "../data/EventManager";

export const TASK_VIEW_TYPE = "chronicle-task-view";

export class TaskView extends ItemView {
  private taskManager: TaskManager;
  private calendarManager: CalendarManager;
  private eventManager: EventManager;
  private plugin: ChroniclePlugin;
  private currentListId: string = "today";

  constructor(
    leaf: WorkspaceLeaf,
    taskManager: TaskManager,
    calendarManager: CalendarManager,
    eventManager: EventManager,
    plugin: ChroniclePlugin
  ) {
    super(leaf);
    this.taskManager    = taskManager;
    this.calendarManager = calendarManager;
    this.eventManager   = eventManager;
    this.plugin         = plugin;
  }

  getViewType(): string { return TASK_VIEW_TYPE; }
  getDisplayText(): string { return "Chronicle"; }
  getIcon(): string { return "check-circle"; }

  async onOpen() {
    await this.render();

    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (file.path.startsWith(this.taskManager["tasksFolder"])) {
          this.render();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (file.path.startsWith(this.taskManager["tasksFolder"])) {
          setTimeout(() => this.render(), 200);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file.path.startsWith(this.taskManager["tasksFolder"])) {
          this.render();
        }
      })
    );
  }

  async render() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("chronicle-app");

    const all       = await this.taskManager.getAll();
    const today     = await this.taskManager.getDueToday();
    const scheduled = await this.taskManager.getScheduled();
    const flagged   = await this.taskManager.getFlagged();
    const overdue   = await this.taskManager.getOverdue();
    const calendars = this.calendarManager.getAll();

    const layout  = container.createDiv("chronicle-layout");
    const sidebar = layout.createDiv("chronicle-sidebar");
    const main    = layout.createDiv("chronicle-main");

    // ── New task button ───────────────────────────────────────────────────
    const newTaskBtn = sidebar.createEl("button", {
      cls: "chronicle-new-task-btn", text: "New task"
    });
    newTaskBtn.addEventListener("click", () => this.openTaskForm());

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

    // ── Completed archive entry ───────────────────────────────────────────
    const completedRow = sidebar.createDiv("chronicle-list-row");
    if (this.currentListId === "completed") completedRow.addClass("active");
    const completedIcon = completedRow.createDiv("chronicle-completed-icon");
    completedIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    completedRow.createDiv("chronicle-list-name").setText("Completed");
    const completedCount = all.filter(t => t.status === "done").length;
    if (completedCount > 0) completedRow.createDiv("chronicle-list-count").setText(String(completedCount));
    completedRow.addEventListener("click", () => { this.currentListId = "completed"; this.render(); });

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
    const header  = main.createDiv("chronicle-main-header");
    const titleEl = header.createDiv("chronicle-main-title");

    let tasks: ChronicleTask[] = [];

    const smartColors: Record<string, string> = {
      today: "#FF3B30", scheduled: "#378ADD", all: "#636366",
      flagged: "#FF9500", completed: "#34C759"
    };

    if (smartColors[this.currentListId]) {
      const labels: Record<string, string> = {
        today: "Today", scheduled: "Scheduled", all: "All",
        flagged: "Flagged", completed: "Completed"
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
        case "completed":
          tasks = all.filter(t => t.status === "done");
          break;
      }
    } else {
      const cal = this.calendarManager.getById(this.currentListId);
      titleEl.setText(cal?.name ?? "List");
      titleEl.style.color = cal
        ? CalendarManager.colorToHex(cal.color)
        : "var(--text-normal)";
      tasks = all.filter(
        t => t.calendarId === this.currentListId && t.status !== "done"
      );
    }

    const isCompleted = this.currentListId === "completed";
    const countTasks  = isCompleted ? tasks : tasks.filter(t => t.status !== "done");
    const showSubtitle = this.plugin.settings.showTaskCountSubtitle ?? true;
    if (countTasks.length > 0 && showSubtitle) {
      const subtitle = header.createDiv("chronicle-main-subtitle");
      if (isCompleted) {
        const clearBtn = subtitle.createEl("button", {
          cls: "chronicle-clear-btn", text: "Clear all"
        });
        clearBtn.addEventListener("click", async () => {
          const all2 = await this.taskManager.getAll();
          for (const t of all2.filter(t => t.status === "done")) {
            await this.taskManager.delete(t.id);
          }
          await this.render();
        });
      } else {
        subtitle.setText(
          `${countTasks.length} ${countTasks.length === 1 ? "task" : "tasks"}`
        );
      }
    }

    const listEl = main.createDiv("chronicle-task-list");

    if (tasks.length === 0) {
      this.renderEmptyState(listEl);
    } else {
      const groups = this.groupTasks(tasks);
      for (const [group, groupTasks] of Object.entries(groups)) {
        if (groupTasks.length === 0) continue;
        listEl.createDiv("chronicle-group-label").setText(group);
        const card = listEl.createDiv("chronicle-task-card-group");
        for (const task of groupTasks) {
          this.renderTaskRow(card, task);
        }
      }
    }
  }

  private renderEmptyState(container: HTMLElement) {
    const empty = container.createDiv("chronicle-empty-state");
    const icon  = empty.createDiv("chronicle-empty-icon");
    icon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    empty.createDiv("chronicle-empty-title").setText("All done");
    empty.createDiv("chronicle-empty-subtitle").setText("Nothing left in this list.");
  }

  private renderTaskRow(container: HTMLElement, task: ChronicleTask) {
    const row       = container.createDiv("chronicle-task-row");
    const isDone    = task.status === "done";
    const isArchive = this.currentListId === "completed";

    // Checkbox
    const checkboxWrap = row.createDiv("chronicle-checkbox-wrap");
    const checkbox     = checkboxWrap.createDiv("chronicle-checkbox");
    if (isDone) checkbox.addClass("done");
    checkbox.innerHTML = `<svg class="chronicle-checkmark" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

    checkbox.addEventListener("click", async (e) => {
      e.stopPropagation();
      checkbox.addClass("completing");
      setTimeout(async () => {
        await this.taskManager.update({
          ...task,
          status:      isDone ? "todo" : "done",
          completedAt: isDone ? undefined : new Date().toISOString(),
        });
      }, 300);
    });

    // Content
    const content = row.createDiv("chronicle-task-content");
    if (!isArchive) content.addEventListener("click", () => this.openTaskForm(task));

    const titleEl = content.createDiv("chronicle-task-title");
    titleEl.setText(task.title);
    if (isDone) titleEl.addClass("done");

    // Meta
    const todayStr = new Date().toISOString().split("T")[0];
    const metaRow  = content.createDiv("chronicle-task-meta");

    if (isArchive && task.completedAt) {
      const completedDate = new Date(task.completedAt);
      metaRow.createSpan("chronicle-task-date").setText(
        "Completed " + completedDate.toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric"
        })
      );
    } else if (task.dueDate || task.calendarId) {
      if (task.dueDate) {
        const metaDate = metaRow.createSpan("chronicle-task-date");
        metaDate.setText(this.formatDate(task.dueDate));
        if (task.dueDate < todayStr) metaDate.addClass("overdue");
      }
      if (task.calendarId) {
        const cal = this.calendarManager.getById(task.calendarId);
        if (cal) {
          const calDot = metaRow.createSpan("chronicle-task-cal-dot");
          calDot.style.backgroundColor = CalendarManager.colorToHex(cal.color);
          metaRow.createSpan("chronicle-task-cal-name").setText(cal.name);
        }
      }
    }

    // Priority flag (non-archive only)
    if (!isArchive && task.priority === "high") {
      row.createDiv("chronicle-flag").setText("⚑");
    }

    // Archive: Restore + Delete buttons
    if (isArchive) {
      const actions = row.createDiv("chronicle-archive-actions");

      const restoreBtn = actions.createEl("button", {
        cls: "chronicle-archive-btn", text: "Restore"
      });
      restoreBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.taskManager.update({ ...task, status: "todo", completedAt: undefined });
      });

      const deleteBtn = actions.createEl("button", {
        cls: "chronicle-archive-btn chronicle-archive-btn-delete", text: "Delete"
      });
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.taskManager.delete(task.id);
      });

      return;
    }

    // Right-click context menu (non-archive)
    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const menu = document.createElement("div");
      menu.className  = "chronicle-context-menu";
      menu.style.left = `${e.clientX}px`;
      menu.style.top  = `${e.clientY}px`;

      const editItem = menu.createDiv("chronicle-context-item");
      editItem.setText("Edit task");
      editItem.addEventListener("click", () => { menu.remove(); this.openTaskForm(task); });

      const deleteItem = menu.createDiv("chronicle-context-item chronicle-context-delete");
      deleteItem.setText("Delete task");
      deleteItem.addEventListener("click", async () => {
        menu.remove();
        await this.taskManager.delete(task.id);
      });

      const cancelItem = menu.createDiv("chronicle-context-item");
      cancelItem.setText("Cancel");
      cancelItem.addEventListener("click", () => menu.remove());

      document.body.appendChild(menu);
      setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
    });
  }

  private groupTasks(tasks: ChronicleTask[]): Record<string, ChronicleTask[]> {
    const today    = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const weekAgo  = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    if (this.currentListId === "completed") {
      const groups: Record<string, ChronicleTask[]> = {
        "Today":     [],
        "This week": [],
        "Earlier":   [],
      };
      for (const task of tasks) {
        const d = task.completedAt?.split("T")[0] ?? "";
        if (d === today)       groups["Today"].push(task);
        else if (d >= weekAgo) groups["This week"].push(task);
        else                   groups["Earlier"].push(task);
      }
      return groups;
    }

    const groups: Record<string, ChronicleTask[]> = {
      "Overdue":   [],
      "Today":     [],
      "This week": [],
      "Later":     [],
      "No date":   [],
    };

    for (const task of tasks) {
      if (task.status === "done") continue;
      if (!task.dueDate)            { groups["No date"].push(task);   continue; }
      if (task.dueDate < today)     { groups["Overdue"].push(task);   continue; }
      if (task.dueDate === today)   { groups["Today"].push(task);     continue; }
      if (task.dueDate <= nextWeek) { groups["This week"].push(task); continue; }
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

  async openTaskForm(task?: ChronicleTask) {
    new TaskModal(
      this.app,
      this.taskManager,
      this.calendarManager,
      task,
      undefined,
      (t) => this.openTaskFullPage(t),
      this.plugin
    ).open();
  }

  async openTaskFullPage(task?: ChronicleTask) {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(TASK_FORM_VIEW_TYPE)[0];
    if (existing) existing.detach();
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: TASK_FORM_VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);

    await new Promise(resolve => setTimeout(resolve, 100));
    const formLeaf = workspace.getLeavesOfType(TASK_FORM_VIEW_TYPE)[0];
    const formView = formLeaf?.view as TaskFormView | undefined;
    if (formView && task) formView.loadTask(task);
  }
}