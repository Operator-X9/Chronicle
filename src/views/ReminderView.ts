import { ItemView, WorkspaceLeaf } from "obsidian";
import { ReminderModal } from "../ui/ReminderModal";
import { ReminderDetailPopup } from "../ui/ReminderDetailPopup";
import type ChroniclePlugin from "../main";
import { ChronicleReminder } from "../types";
import { ReminderManager } from "../data/ReminderManager";
import { ListManager } from "../data/ListManager";
import { ReminderFormView, REMINDER_FORM_VIEW_TYPE } from "./ReminderFormView";

export const REMINDER_VIEW_TYPE = "chronicle-reminder-view";

export class ReminderView extends ItemView {
  private reminderManager: ReminderManager;
  private listManager: ListManager;
  private plugin: ChroniclePlugin;
  private currentListId: string = "today";
  private _renderVersion = 0;

  constructor(
    leaf: WorkspaceLeaf,
    reminderManager: ReminderManager,
    listManager: ListManager,
    plugin: ChroniclePlugin
  ) {
    super(leaf);
    this.reminderManager = reminderManager;
    this.listManager     = listManager;
    this.plugin          = plugin;
  }

  getViewType(): string { return REMINDER_VIEW_TYPE; }
  getDisplayText(): string { return "Reminders"; }
  getIcon(): string { return "check-circle"; }

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
      (this.app.workspace as any).on("chronicle:settings-changed", () => this.render())
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
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("chronicle-app");

    const all       = await this.reminderManager.getAll();
    const today     = await this.reminderManager.getDueToday();
    const scheduled = await this.reminderManager.getScheduled();
    const flagged   = await this.reminderManager.getFlagged();
    const overdue   = await this.reminderManager.getOverdue();
    const lists     = this.listManager.getAll();

    if (this._renderVersion !== version) return;

    const layout  = container.createDiv("chronicle-layout");
    const sidebar = layout.createDiv("chronicle-sidebar");
    const main    = layout.createDiv("chronicle-main");

    // ── New reminder button ───────────────────────────────────────────────────
    const newReminderBtn = sidebar.createEl("button", {
      cls: "chronicle-new-reminder-btn", text: "New Reminder"
    });
    newReminderBtn.addEventListener("click", () => this.openReminderForm());

    // ── Smart list tiles ──────────────────────────────────────────────────
    const tilesGrid = sidebar.createDiv("chronicle-tiles");

    const tiles = [
      { id: "today",     label: "Today",     count: today.length + overdue.length, color: "#FF3B30", badge: overdue.length },
      { id: "scheduled", label: "Scheduled", count: scheduled.length,              color: "#378ADD", badge: 0 },
      { id: "all",       label: "All",       count: all.filter(r => r.status !== "done").length, color: "#636366", badge: 0 },
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
    const completedCount = all.filter(r => r.status === "done").length;
    if (completedCount > 0) completedRow.createDiv("chronicle-list-count").setText(String(completedCount));
    completedRow.addEventListener("click", () => { this.currentListId = "completed"; this.render(); });

    // ── My Lists ──────────────────────────────────────────────────────────
    const listsSection = sidebar.createDiv("chronicle-lists-section");
    listsSection.createDiv("chronicle-section-label").setText("My Lists");

    for (const list of lists) {
      const row = listsSection.createDiv("chronicle-list-row");
      if (list.id === this.currentListId) row.addClass("active");

      const dot = row.createDiv("chronicle-list-dot");
      dot.style.backgroundColor = list.color;

      row.createDiv("chronicle-list-name").setText(list.name);

      const listCount = all.filter(r => r.listId === list.id && r.status !== "done").length;
      if (listCount > 0) row.createDiv("chronicle-list-count").setText(String(listCount));

      row.addEventListener("click", () => { this.currentListId = list.id; this.render(); });
    }

    // ── Main panel ────────────────────────────────────────────────────────
    await this.renderMainPanel(main, all, overdue);
  }

  private async renderMainPanel(
    main: HTMLElement,
    all: ChronicleReminder[],
    overdue: ChronicleReminder[]
  ) {
    const header  = main.createDiv("chronicle-main-header");
    const titleEl = header.createDiv("chronicle-main-title");

    let reminders: ChronicleReminder[] = [];

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
          reminders = [...overdue, ...(await this.reminderManager.getDueToday())];
          break;
        case "scheduled":
          reminders = await this.reminderManager.getScheduled();
          break;
        case "flagged":
          reminders = await this.reminderManager.getFlagged();
          break;
        case "all":
          reminders = all.filter(r => r.status !== "done");
          break;
        case "completed":
          reminders = all.filter(r => r.status === "done");
          break;
      }
    } else {
      const list = this.listManager.getById(this.currentListId);
      titleEl.setText(list?.name ?? "List");
      titleEl.style.color = list ? list.color : "var(--text-normal)";
      reminders = all.filter(r => r.listId === this.currentListId && r.status !== "done");
    }

    const isCompleted  = this.currentListId === "completed";
    const activeCount  = isCompleted ? reminders : reminders.filter(r => r.status !== "done");
    const showSubtitle = this.plugin.settings.showReminderCountSubtitle ?? true;
    if (activeCount.length > 0 && showSubtitle) {
      const subtitle = header.createDiv("chronicle-main-subtitle");
      if (isCompleted) {
        const clearBtn = subtitle.createEl("button", {
          cls: "chronicle-clear-btn", text: "Clear all"
        });
        clearBtn.addEventListener("click", async () => {
          const all2 = await this.reminderManager.getAll();
          for (const r of all2.filter(r => r.status === "done")) {
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

  private renderEmptyState(container: HTMLElement) {
    const empty = container.createDiv("chronicle-empty-state");
    const icon  = empty.createDiv("chronicle-empty-icon");
    icon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    empty.createDiv("chronicle-empty-title").setText("All done");
    empty.createDiv("chronicle-empty-subtitle").setText("Nothing left in this list.");
  }

  private renderReminderRow(container: HTMLElement, reminder: ChronicleReminder) {
    const row       = container.createDiv("chronicle-reminder-row");
    const isDone    = reminder.status === "done";
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
        await this.reminderManager.update({
          ...reminder,
          status:      isDone ? "todo" : "done",
          completedAt: isDone ? undefined : new Date().toISOString(),
        });
      }, 300);
    });

    // Content
    const content = row.createDiv("chronicle-reminder-content");
    if (!isArchive) content.addEventListener("click", () => {
      new ReminderDetailPopup(
        this.app, reminder, this.listManager,
        this.plugin.settings.timeFormat,
        () => this.openReminderForm(reminder)
      ).open();
    });

    const titleEl = content.createDiv("chronicle-reminder-title");
    titleEl.setText(reminder.title);
    if (isDone) titleEl.addClass("done");

    // Meta row
    const todayStr = new Date().toISOString().split("T")[0];
    const metaRow  = content.createDiv("chronicle-reminder-meta");

    if (isArchive && reminder.completedAt) {
      const completedDate = new Date(reminder.completedAt);
      metaRow.createSpan("chronicle-reminder-date").setText(
        "Completed " + completedDate.toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric"
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

    // Priority flag
    if (!isArchive && reminder.priority === "high") {
      row.createDiv("chronicle-flag").setText("⚑");
    }

    // Archive actions
    if (isArchive) {
      const actions = row.createDiv("chronicle-archive-actions");
      const restoreBtn = actions.createEl("button", { cls: "chronicle-archive-btn", text: "Restore" });
      restoreBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.reminderManager.update({ ...reminder, status: "todo", completedAt: undefined });
      });
      const deleteBtn = actions.createEl("button", { cls: "chronicle-archive-btn chronicle-archive-btn-delete", text: "Delete" });
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.reminderManager.delete(reminder.id);
      });
      return;
    }

    // Right-click context menu
    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const menu = document.createElement("div");
      menu.className  = "chronicle-context-menu";
      menu.style.left = `${e.clientX}px`;
      menu.style.top  = `${e.clientY}px`;

      const editItem = menu.createDiv("chronicle-context-item");
      editItem.setText("Edit reminder");
      editItem.addEventListener("click", () => { menu.remove(); this.openReminderForm(reminder); });

      const deleteItem = menu.createDiv("chronicle-context-item chronicle-context-delete");
      deleteItem.setText("Delete reminder");
      deleteItem.addEventListener("click", async () => { menu.remove(); await this.reminderManager.delete(reminder.id); });

      const cancelItem = menu.createDiv("chronicle-context-item");
      cancelItem.setText("Cancel");
      cancelItem.addEventListener("click", () => menu.remove());

      document.body.appendChild(menu);
      setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
    });
  }

  private groupReminders(reminders: ChronicleReminder[]): Record<string, ChronicleReminder[]> {
    const today    = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const weekAgo  = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    if (this.currentListId === "completed") {
      const groups: Record<string, ChronicleReminder[]> = { "Today": [], "This week": [], "Earlier": [] };
      for (const reminder of reminders) {
        const d = reminder.completedAt?.split("T")[0] ?? "";
        if (d === today)       groups["Today"].push(reminder);
        else if (d >= weekAgo) groups["This week"].push(reminder);
        else                   groups["Earlier"].push(reminder);
      }
      return groups;
    }

    const groups: Record<string, ChronicleReminder[]> = {
      "Overdue": [], "Today": [], "This week": [], "Later": [], "No date": [],
    };
    for (const reminder of reminders) {
      if (reminder.status === "done") continue;
      if (!reminder.dueDate)                  { groups["No date"].push(reminder);   continue; }
      if (reminder.dueDate < today)            { groups["Overdue"].push(reminder);   continue; }
      if (reminder.dueDate === today)          { groups["Today"].push(reminder);     continue; }
      if (reminder.dueDate <= nextWeek)        { groups["This week"].push(reminder); continue; }
      groups["Later"].push(reminder);
    }
    return groups;
  }

  private formatDate(dateStr: string): string {
    const today    = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    if (dateStr === today)    return "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  async openReminderForm(reminder?: ChronicleReminder) {
    new ReminderModal(
      this.app,
      this.reminderManager,
      this.listManager,
      reminder,
      undefined,
      (r) => this.openReminderFullPage(r),
      this.plugin
    ).open();
  }

  async openReminderFullPage(reminder?: ChronicleReminder) {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(REMINDER_FORM_VIEW_TYPE)[0];
    if (existing) existing.detach();
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: REMINDER_FORM_VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);

    await new Promise(resolve => setTimeout(resolve, 100));
    const formLeaf = workspace.getLeavesOfType(REMINDER_FORM_VIEW_TYPE)[0];
    const formView = formLeaf?.view as ReminderFormView | undefined;
    if (formView && reminder) formView.loadReminder(reminder);
  }
}
