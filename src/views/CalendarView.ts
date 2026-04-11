import { ItemView, WorkspaceLeaf } from "obsidian";
import { EventManager } from "../data/EventManager";
import { ReminderManager } from "../data/ReminderManager";
import { CalendarManager } from "../data/CalendarManager";
import { ChronicleEvent, ChronicleReminder } from "../types";
import { EventModal } from "../ui/EventModal";
import { EventDetailPopup } from "../ui/EventDetailPopup";
import { EventFormView, EVENT_FORM_VIEW_TYPE } from "./EventFormView";
import type ChroniclePlugin from "../main";
import { formatHour12, formatTime12 } from "../utils/formatters";

export const CALENDAR_VIEW_TYPE = "chronicle-calendar-view";
type CalendarMode = "day" | "week" | "month" | "year";
const HOUR_HEIGHT = 56;

export class CalendarView extends ItemView {
  private eventManager:    EventManager;
  private reminderManager:     ReminderManager;
  private calendarManager: CalendarManager;
  private plugin:          ChroniclePlugin;
  private currentDate: Date         = new Date();
  private mode:        CalendarMode = "week";
  private _modeSet                  = false;
  private _renderVersion            = 0;

  constructor(
    leaf: WorkspaceLeaf,
    eventManager:    EventManager,
    reminderManager:     ReminderManager,
    calendarManager: CalendarManager,
    plugin:          ChroniclePlugin
  ) {
    super(leaf);
    this.eventManager    = eventManager;
    this.reminderManager     = reminderManager;
    this.calendarManager = calendarManager;
    this.plugin          = plugin;
  }

  getViewType():    string { return CALENDAR_VIEW_TYPE; }
  getDisplayText(): string { return "Calendar"; }
  getIcon():        string { return "calendar"; }

  async onOpen() {
    await this.render();

    // Same permanent fix as task dashboard — metadataCache fires after
    // frontmatter is fully parsed, so data is fresh when we re-render
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
        const inTasks  = file.path.startsWith(this.reminderManager["remindersFolder"]);
        if (inEvents || inTasks) this.render();
      })
    );
    this.registerEvent(
      (this.app.workspace as any).on("chronicle:settings-changed", () => this.render())
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
        const inTasks  = file.path.startsWith(this.reminderManager["remindersFolder"]);
        if (inEvents || inTasks) setTimeout(() => this.render(), 200);
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
        const inTasks  = file.path.startsWith(this.reminderManager["remindersFolder"]);
        if (inEvents || inTasks) this.render();
      })
    );
  }

  async render() {
    const version = ++this._renderVersion;
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("chronicle-cal-app");

    const reminders = await this.reminderManager.getAll();

    // Apply default view from settings if this is the first render
    if (!this._modeSet) {
      this.mode     = this.plugin.settings.defaultCalendarView ?? "week";
      this._modeSet = true;
    }

    // Get date range for current view so recurrence expansion is scoped
    const rangeStart = this.getRangeStart();
    const rangeEnd   = this.getRangeEnd();
    const events     = await this.eventManager.getInRangeWithRecurrence(rangeStart, rangeEnd);

    if (this._renderVersion !== version) return;

    const layout  = container.createDiv("chronicle-cal-layout");
    const sidebar = layout.createDiv("chronicle-cal-sidebar");
    const main    = layout.createDiv("chronicle-cal-main");

    this.renderSidebar(sidebar);
    this.renderToolbar(main);

    if      (this.mode === "year")  this.renderYearView(main, events, reminders);
    else if (this.mode === "month") this.renderMonthView(main, events, reminders);
    else if (this.mode === "week")  this.renderWeekView(main, events, reminders);
    else                            this.renderDayView(main, events, reminders);
  }

private async openEventFullPage(event?: ChronicleEvent) {
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

  // ── Sidebar ───────────────────────────────────────────────────────────────

private getRangeStart(): string {
    if (this.mode === "day") return this.currentDate.toISOString().split("T")[0];
    if (this.mode === "week") {
      const s = this.getWeekStart();
      return s.toISOString().split("T")[0];
    }
    if (this.mode === "year") return `${this.currentDate.getFullYear()}-01-01`;
    // month
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();
    return `${y}-${String(m+1).padStart(2,"0")}-01`;
  }

  private getRangeEnd(): string {
    if (this.mode === "day") return this.currentDate.toISOString().split("T")[0];
    if (this.mode === "week") {
      const s = this.getWeekStart();
      const e = new Date(s); e.setDate(e.getDate() + 6);
      return e.toISOString().split("T")[0];
    }
    if (this.mode === "year") return `${this.currentDate.getFullYear()}-12-31`;
    // month
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();
    return new Date(y, m + 1, 0).toISOString().split("T")[0];
  }

  private renderSidebar(sidebar: HTMLElement) {
    const newEventBtn = sidebar.createEl("button", {
      cls: "chronicle-new-task-btn", text: "New event"
    });
    newEventBtn.addEventListener("click", () => {
      new EventModal(
        this.app, this.eventManager, this.calendarManager, this.reminderManager,
        undefined, () => this.render(), (e) => this.openEventFullPage(e)
      ).open();
    });

    this.renderMiniCalendar(sidebar);

    const calSection = sidebar.createDiv("chronicle-lists-section");
    calSection.createDiv("chronicle-section-label").setText("My Calendars");

    for (const cal of this.calendarManager.getAll()) {
      const row    = calSection.createDiv("chronicle-cal-list-row");
      const toggle = row.createEl("input", { type: "checkbox", cls: "chronicle-cal-toggle" });
      toggle.checked = cal.isVisible;
      toggle.style.accentColor = CalendarManager.colorToHex(cal.color);
      toggle.addEventListener("change", () => {
        this.calendarManager.toggleVisibility(cal.id);
        this.render();
      });
      const dot = row.createDiv("chronicle-list-dot");
      dot.style.backgroundColor = CalendarManager.colorToHex(cal.color);
      row.createDiv("chronicle-list-name").setText(cal.name);
    }
  }

  private renderMiniCalendar(parent: HTMLElement) {
    const mini   = parent.createDiv("chronicle-mini-cal");
    const header = mini.createDiv("chronicle-mini-cal-header");

    const prevBtn    = header.createEl("button", { cls: "chronicle-mini-nav", text: "‹" });
    const monthLabel = header.createDiv("chronicle-mini-month-label");
    const nextBtn    = header.createEl("button", { cls: "chronicle-mini-nav", text: "›" });

    const year  = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    monthLabel.setText(
      new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    );

    prevBtn.addEventListener("click", () => {
      this.currentDate = new Date(year, month - 1, 1);
      this.render();
    });
    nextBtn.addEventListener("click", () => {
      this.currentDate = new Date(year, month + 1, 1);
      this.render();
    });

    const grid        = mini.createDiv("chronicle-mini-grid");
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr    = new Date().toISOString().split("T")[0];

    for (const d of ["S","M","T","W","T","F","S"])
      grid.createDiv("chronicle-mini-day-name").setText(d);

    for (let i = 0; i < firstDay; i++)
      grid.createDiv("chronicle-mini-day chronicle-mini-day-empty");

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dayEl   = grid.createDiv("chronicle-mini-day");
      dayEl.setText(String(d));
      if (dateStr === todayStr) dayEl.addClass("today");
      dayEl.addEventListener("click", () => {
        this.currentDate = new Date(year, month, d);
        this.mode = "day";
        this.render();
      });
    }
  }

  // ── Toolbar ───────────────────────────────────────────────────────────────

  private renderToolbar(main: HTMLElement) {
    const toolbar  = main.createDiv("chronicle-cal-toolbar");
    const navGroup = toolbar.createDiv("chronicle-cal-nav-group");

    navGroup.createEl("button", { cls: "chronicle-cal-nav-btn", text: "‹" })
      .addEventListener("click", () => this.navigate(-1));
    navGroup.createEl("button", { cls: "chronicle-cal-today-btn", text: "Today" })
      .addEventListener("click", () => { this.currentDate = new Date(); this.render(); });
    navGroup.createEl("button", { cls: "chronicle-cal-nav-btn", text: "›" })
      .addEventListener("click", () => this.navigate(1));

    toolbar.createDiv("chronicle-cal-toolbar-title").setText(this.getToolbarTitle());

    const pills = toolbar.createDiv("chronicle-view-pills");
    for (const [m, label] of [["day","Day"],["week","Week"],["month","Month"],["year","Year"]] as [CalendarMode,string][]) {
      const pill = pills.createDiv("chronicle-view-pill");
      pill.setText(label);
      if (this.mode === m) pill.addClass("active");
      pill.addEventListener("click", () => { this.mode = m; this.render(); });
    }
  }

  private navigate(dir: number) {
    const d = new Date(this.currentDate);
    if      (this.mode === "day")  d.setDate(d.getDate() + dir);
    else if (this.mode === "week") d.setDate(d.getDate() + dir * 7);
    else if (this.mode === "year") d.setFullYear(d.getFullYear() + dir);
    else                           d.setMonth(d.getMonth() + dir);
    this.currentDate = d;
    this.render();
  }

  private getToolbarTitle(): string {
    if (this.mode === "year")  return String(this.currentDate.getFullYear());
    if (this.mode === "month") return this.currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (this.mode === "day")   return this.currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const start = this.getWeekStart();
    const end   = new Date(start); end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("en-US",{ month:"short", day:"numeric" })} – ${end.toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" })}`;
  }

  private getWeekStart(): Date {
    const d = new Date(this.currentDate);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  // ── Year view ─────────────────────────────────────────────────────────────

  private renderYearView(main: HTMLElement, events: ChronicleEvent[], reminders: ChronicleReminder[]) {
    const year     = this.currentDate.getFullYear();
    const todayStr = new Date().toISOString().split("T")[0];
    const yearGrid = main.createDiv("chronicle-year-grid");

    for (let m = 0; m < 12; m++) {
      const card = yearGrid.createDiv("chronicle-year-month-card");
      const name = card.createDiv("chronicle-year-month-name");
      name.setText(new Date(year, m).toLocaleDateString("en-US", { month: "long" }));
      name.addEventListener("click", () => { this.currentDate = new Date(year, m, 1); this.mode = "month"; this.render(); });

      const miniGrid    = card.createDiv("chronicle-year-mini-grid");
      const firstDay    = new Date(year, m, 1).getDay();
      const daysInMonth = new Date(year, m + 1, 0).getDate();

      for (const d of ["S","M","T","W","T","F","S"])
        miniGrid.createDiv("chronicle-year-day-name").setText(d);

      for (let i = 0; i < firstDay; i++)
        miniGrid.createDiv("chronicle-year-day-empty");

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr  = `${year}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const hasEvent = events.some(e => e.startDate === dateStr && this.isCalendarVisible(e.calendarId));
        const hasTask  = reminders.some(t => t.dueDate === dateStr && t.status !== "done");
        const dayEl    = miniGrid.createDiv("chronicle-year-day");
        dayEl.setText(String(d));
        if (dateStr === todayStr) dayEl.addClass("today");
        if (hasEvent) dayEl.addClass("has-event");
        if (hasTask)  dayEl.addClass("has-task");
        dayEl.addEventListener("click", () => { this.currentDate = new Date(year, m, d); this.mode = "day"; this.render(); });
      }
    }
  }

  // ── Month view ────────────────────────────────────────────────────────────

  private renderMonthView(main: HTMLElement, events: ChronicleEvent[], reminders: ChronicleReminder[]) {
    const year     = this.currentDate.getFullYear();
    const month    = this.currentDate.getMonth();
    const todayStr = new Date().toISOString().split("T")[0];
    const grid     = main.createDiv("chronicle-month-grid");

    for (const d of ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"])
      grid.createDiv("chronicle-month-day-name").setText(d);

    const firstDay      = new Date(year, month, 1).getDay();
    const daysInMonth   = new Date(year, month + 1, 0).getDate();
    const daysInPrevMon = new Date(year, month, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      const cell = grid.createDiv("chronicle-month-cell chronicle-month-cell-other");
      cell.createDiv("chronicle-month-cell-num").setText(String(daysInPrevMon - i));
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const cell    = grid.createDiv("chronicle-month-cell");
      if (dateStr === todayStr) cell.addClass("today");
      cell.createDiv("chronicle-month-cell-num").setText(String(d));

      cell.addEventListener("dblclick", () => this.openNewEventModal(dateStr, true));
      cell.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        this.showCalContextMenu(e.clientX, e.clientY, dateStr, true);
      });

      events.filter(e => e.startDate === dateStr && this.isCalendarVisible(e.calendarId)).slice(0,3)
        .forEach(event => {
          const cal   = this.calendarManager.getById(event.calendarId ?? "");
          const color = cal ? CalendarManager.colorToHex(cal.color) : "#378ADD";
          const pill  = cell.createDiv("chronicle-month-event-pill");
          pill.style.backgroundColor = color + "33";
          pill.style.borderLeft      = `3px solid ${color}`;
          pill.style.color           = color;
          pill.setText(event.title);
          pill.addEventListener("click", (e) => {
            e.stopPropagation();
            new EventDetailPopup(this.app, event, this.calendarManager, this.reminderManager, this.plugin.settings.timeFormat, () => new EventModal(this.app, this.eventManager, this.calendarManager, this.reminderManager, event, () => this.render(), (ev) => this.openEventFullPage(ev)).open()).open();
          });
        });

      reminders.filter(t => t.dueDate === dateStr && t.status !== "done").slice(0,2)
        .forEach(task => {
          const pill = cell.createDiv("chronicle-month-event-pill");
          pill.addClass("chronicle-task-pill");
          pill.setText("✓ " + task.title);
        });
    }

    const remaining = 7 - ((firstDay + daysInMonth) % 7);
    if (remaining < 7)
      for (let d = 1; d <= remaining; d++) {
        const cell = grid.createDiv("chronicle-month-cell chronicle-month-cell-other");
        cell.createDiv("chronicle-month-cell-num").setText(String(d));
      }
  }

  // ── Week view ─────────────────────────────────────────────────────────────

  private renderWeekView(main: HTMLElement, events: ChronicleEvent[], reminders: ChronicleReminder[]) {
    const weekStart = this.getWeekStart();
    const days: Date[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
    });
    const todayStr = new Date().toISOString().split("T")[0];

    // The week grid: time-col + 7 day-cols
    // Each day-col contains: header → all-day shelf → time grid
    // This mirrors day view exactly — shelf is always below the date header
    const calGrid = main.createDiv("chronicle-week-grid");

    // Time column
    const timeCol = calGrid.createDiv("chronicle-time-col");
    // Blank cell that aligns with the day header row
    timeCol.createDiv("chronicle-time-col-header");
    // Blank cell that aligns with the all-day shelf row
    const shelfSpacer = timeCol.createDiv("chronicle-time-col-shelf-spacer");
    shelfSpacer.setText("all-day");
    // Hour labels
    for (let h = 0; h < 24; h++)
      timeCol.createDiv("chronicle-time-slot").setText(formatHour12(h));

    // Day columns
    for (const day of days) {
      const dateStr      = day.toISOString().split("T")[0];
      const col          = calGrid.createDiv("chronicle-day-col");
      const allDayEvents = events.filter(e => e.startDate === dateStr && e.allDay && this.isCalendarVisible(e.calendarId));

      // 1. Day header
      const dayHeader = col.createDiv("chronicle-day-header");
      dayHeader.createDiv("chronicle-day-name").setText(
        day.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
      );
      const dayNum = dayHeader.createDiv("chronicle-day-num");
      dayNum.setText(String(day.getDate()));
      if (dateStr === todayStr) dayNum.addClass("today");

      // 2. All-day shelf — sits directly below header, same as day view
      const shelf = col.createDiv("chronicle-week-allday-shelf");
      for (const event of allDayEvents)
        this.renderEventPillAllDay(shelf, event);

      // 3. Time grid
      const timeGrid = col.createDiv("chronicle-day-time-grid");
      timeGrid.style.height = `${24 * HOUR_HEIGHT}px`;

      for (let h = 0; h < 24; h++) {
        const line = timeGrid.createDiv("chronicle-hour-line");
        line.style.top = `${h * HOUR_HEIGHT}px`;
      }

      timeGrid.addEventListener("dblclick", (e) => {
        const rect   = timeGrid.getBoundingClientRect();
        const y      = e.clientY - rect.top;
        const hour   = Math.min(Math.floor(y / HOUR_HEIGHT), 23);
        const minute = Math.floor((y % HOUR_HEIGHT) / HOUR_HEIGHT * 60 / 15) * 15;
        this.openNewEventModal(dateStr, false, hour, minute);
      });

      timeGrid.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const rect   = timeGrid.getBoundingClientRect();
        const y      = e.clientY - rect.top;
        const hour   = Math.min(Math.floor(y / HOUR_HEIGHT), 23);
        const minute = Math.floor((y % HOUR_HEIGHT) / HOUR_HEIGHT * 60 / 15) * 15;
        this.showCalContextMenu(e.clientX, e.clientY, dateStr, false, hour, minute);
      });

      // Timed events
      events.filter(e => e.startDate === dateStr && !e.allDay && e.startTime && this.isCalendarVisible(e.calendarId))
        .forEach(event => this.renderEventPillTimed(timeGrid, event));

      // Task due pills
      reminders.filter(t => t.dueDate === dateStr && t.status !== "done")
        .forEach(task => {
          const top  = task.dueTime
            ? (() => { const [h,m] = task.dueTime!.split(":").map(Number); return (h + m/60) * HOUR_HEIGHT; })()
            : 0;
          const pill = timeGrid.createDiv("chronicle-task-day-pill");
          pill.style.top             = `${top}px`;
          pill.addClass("chronicle-task-pill");
          pill.setText("✓ " + task.title);
        });
    }

    // Now line
    const now         = new Date();
    const nowStr      = now.toISOString().split("T")[0];
    const todayColIdx = days.findIndex(d => d.toISOString().split("T")[0] === nowStr);
    if (todayColIdx >= 0) {
      const cols     = calGrid.querySelectorAll(".chronicle-day-col");
      const todayCol = cols[todayColIdx] as HTMLElement;
      const tg       = todayCol.querySelector(".chronicle-day-time-grid") as HTMLElement;
      if (tg) {
        const top  = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;
        const line = tg.createDiv("chronicle-now-line");
        line.style.top = `${top}px`;
      }
    }
  }

  // ── Day view ──────────────────────────────────────────────────────────────

  private renderDayView(main: HTMLElement, events: ChronicleEvent[], reminders: ChronicleReminder[]) {
    const dateStr      = this.currentDate.toISOString().split("T")[0];
    const todayStr     = new Date().toISOString().split("T")[0];
    const allDayEvents = events.filter(e => e.startDate === dateStr && e.allDay && this.isCalendarVisible(e.calendarId));
    const dayView      = main.createDiv("chronicle-day-view");

    // Day header
    const dayHeader = dayView.createDiv("chronicle-day-view-header");
    dayHeader.createDiv("chronicle-day-name-large").setText(
      this.currentDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()
    );
    const numEl = dayHeader.createDiv("chronicle-day-num-large");
    numEl.setText(String(this.currentDate.getDate()));
    if (dateStr === todayStr) numEl.addClass("today");

    // All-day shelf
    const shelf        = dayView.createDiv("chronicle-day-allday-shelf");
    shelf.createDiv("chronicle-day-allday-label").setText("all-day");
    const shelfContent = shelf.createDiv("chronicle-day-allday-content");
    for (const event of allDayEvents)
      this.renderEventPillAllDay(shelfContent, event);

    // Time area
    const timeArea   = dayView.createDiv("chronicle-day-single-area");
    const timeLabels = timeArea.createDiv("chronicle-day-single-labels");
    const eventCol   = timeArea.createDiv("chronicle-day-single-events");
    eventCol.style.height = `${24 * HOUR_HEIGHT}px`;

    for (let h = 0; h < 24; h++) {
      timeLabels.createDiv("chronicle-time-slot").setText(formatHour12(h));
      const line = eventCol.createDiv("chronicle-hour-line");
      line.style.top = `${h * HOUR_HEIGHT}px`;
    }

    eventCol.addEventListener("dblclick", (e) => {
      const rect   = eventCol.getBoundingClientRect();
      const y      = e.clientY - rect.top;
      const hour   = Math.min(Math.floor(y / HOUR_HEIGHT), 23);
      const minute = Math.floor((y % HOUR_HEIGHT) / HOUR_HEIGHT * 60 / 15) * 15;
      this.openNewEventModal(dateStr, false, hour, minute);
    });

    eventCol.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const rect   = eventCol.getBoundingClientRect();
      const y      = e.clientY - rect.top;
      const hour   = Math.min(Math.floor(y / HOUR_HEIGHT), 23);
      const minute = Math.floor((y % HOUR_HEIGHT) / HOUR_HEIGHT * 60 / 15) * 15;
      this.showCalContextMenu(e.clientX, e.clientY, dateStr, false, hour, minute);
    });

    events.filter(e => e.startDate === dateStr && !e.allDay && e.startTime && this.isCalendarVisible(e.calendarId))
      .forEach(event => this.renderEventPillTimed(eventCol, event));

    reminders.filter(t => t.dueDate === dateStr && t.status !== "done")
      .forEach(task => {
        const top  = task.dueTime
          ? (() => { const [h,m] = task.dueTime!.split(":").map(Number); return (h + m/60) * HOUR_HEIGHT; })()
          : 0;
        const pill = eventCol.createDiv("chronicle-task-day-pill");
        pill.style.top             = `${top}px`;
        pill.addClass("chronicle-task-pill");
        pill.setText("✓ " + task.title);
      });

    if (dateStr === todayStr) {
      const now  = new Date();
      const top  = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;
      const line = eventCol.createDiv("chronicle-now-line");
      line.style.top = `${top}px`;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private openNewEventModal(dateStr: string, allDay: boolean, hour = 9, minute = 0) {
    const timeStr = `${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`;
    const endStr  = `${String(Math.min(hour+1,23)).padStart(2,"0")}:${String(minute).padStart(2,"0")}`;
    const prefill = {
      id: "", title: "", allDay,
      startDate: dateStr, startTime: allDay ? undefined : timeStr,
      endDate:   dateStr, endTime:   allDay ? undefined : endStr,
      alert: "none", linkedReminderIds: [], completedInstances: [], createdAt: ""
    } as ChronicleEvent;

    new EventModal(
      this.app, this.eventManager, this.calendarManager, this.reminderManager,
      prefill, () => this.render(), (e) => this.openEventFullPage(e ?? prefill)
    ).open();
  }

private showEventContextMenu(x: number, y: number, event: ChronicleEvent) {
    const menu = document.createElement("div");
    menu.className  = "chronicle-context-menu";
    menu.style.left = `${x}px`;
    menu.style.top  = `${y}px`;

    const editItem = menu.createDiv("chronicle-context-item");
    editItem.setText("Edit event");
    editItem.addEventListener("click", () => {
      menu.remove();
      new EventModal(this.app, this.eventManager, this.calendarManager, this.reminderManager, event, () => this.render(), (e) => this.openEventFullPage(e)).open();
    });

    const deleteItem = menu.createDiv("chronicle-context-item chronicle-context-delete");
    deleteItem.setText("Delete event");
    deleteItem.addEventListener("click", async () => {
      menu.remove();
      await this.eventManager.delete(event.id);
      this.render();
    });

    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
  }

  private showCalContextMenu(x: number, y: number, dateStr: string, allDay: boolean, hour = 9, minute = 0) {
    const menu = document.createElement("div");
    menu.className    = "chronicle-context-menu";
    menu.style.left   = `${x}px`;
    menu.style.top    = `${y}px`;

    const addItem = menu.createDiv("chronicle-context-item");
    addItem.setText("New event here");
    addItem.addEventListener("click", () => { menu.remove(); this.openNewEventModal(dateStr, allDay, hour, minute); });

    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
  }

  private renderEventPillTimed(container: HTMLElement, event: ChronicleEvent) {
    const [sh, sm] = (event.startTime ?? "09:00").split(":").map(Number);
    const [eh, em] = (event.endTime   ?? "10:00").split(":").map(Number);
    const top    = (sh + sm / 60) * HOUR_HEIGHT;
    const height = Math.max((eh - sh + (em - sm) / 60) * HOUR_HEIGHT, 22);
    const cal    = this.calendarManager.getById(event.calendarId ?? "");
    const color  = cal ? CalendarManager.colorToHex(cal.color) : "#378ADD";

    const pill = container.createDiv("chronicle-event-pill");
    pill.style.top             = `${top}px`;
    pill.style.height          = `${height}px`;
    pill.style.backgroundColor = color + "33";
    pill.style.borderLeft      = `3px solid ${color}`;
    pill.style.color           = color;
    pill.createDiv("chronicle-event-pill-title").setText(event.title);
    if (height > 36 && event.startTime)
      pill.createDiv("chronicle-event-pill-time").setText(formatTime12(event.startTime));

    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      new EventDetailPopup(this.app, event, this.calendarManager, this.reminderManager, this.plugin.settings.timeFormat, () => new EventModal(this.app, this.eventManager, this.calendarManager, this.reminderManager, event, () => this.render(), (ev) => this.openEventFullPage(ev)).open()).open();
    });

    pill.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showEventContextMenu(e.clientX, e.clientY, event);
    });
  }

  private renderEventPillAllDay(container: HTMLElement, event: ChronicleEvent) {
    const cal   = this.calendarManager.getById(event.calendarId ?? "");
    const color = cal ? CalendarManager.colorToHex(cal.color) : "#378ADD";
    const pill  = container.createDiv("chronicle-event-pill-allday");
    pill.style.backgroundColor = color + "33";
    pill.style.borderLeft      = `3px solid ${color}`;
    pill.style.color           = color;
    pill.setText(event.title);
    pill.addEventListener("click", () =>
      new EventDetailPopup(this.app, event, this.calendarManager, this.reminderManager, this.plugin.settings.timeFormat, () => new EventModal(this.app, this.eventManager, this.calendarManager, this.reminderManager, event, () => this.render(), (ev) => this.openEventFullPage(ev)).open()).open()
    );

    pill.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showEventContextMenu(e.clientX, e.clientY, event);
    });
  }

  private isCalendarVisible(calendarId?: string): boolean {
    if (!calendarId) return true;
    return this.calendarManager.getById(calendarId)?.isVisible ?? true;
  }

}