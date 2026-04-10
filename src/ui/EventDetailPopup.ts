import { App, Modal } from "obsidian";
import { ChronicleEvent, AlertOffset } from "../types";
import { CalendarManager } from "../data/CalendarManager";
import { TaskManager } from "../data/TaskManager";

export class EventDetailPopup extends Modal {
  private event: ChronicleEvent;
  private calendarManager: CalendarManager;
  private taskManager: TaskManager;
  private timeFormat: "12h" | "24h";
  private onEdit: () => void;

  constructor(
    app: App,
    event: ChronicleEvent,
    calendarManager: CalendarManager,
    taskManager: TaskManager,
    timeFormat: "12h" | "24h",
    onEdit: () => void
  ) {
    super(app);
    this.event           = event;
    this.calendarManager = calendarManager;
    this.taskManager     = taskManager;
    this.timeFormat      = timeFormat;
    this.onEdit          = onEdit;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("cdp-modal");

    const ev = this.event;

    // ── Header ───────────────────────────────────────────────────────────
    const header = contentEl.createDiv("cdp-header");
    header.createDiv("cdp-title").setText(ev.title);

    // ── Detail rows ──────────────────────────────────────────────────────
    const body = contentEl.createDiv("cdp-body");

    // Date + time (always shown)
    const dateTimeStr = this.formatDateTime(ev);
    this.row(body, ev.allDay ? "Date" : "When", dateTimeStr);

    if (ev.location) this.row(body, "Location", ev.location);

    if (ev.calendarId) {
      const cal = this.calendarManager.getById(ev.calendarId);
      if (cal) this.calRow(body, cal.name, CalendarManager.colorToHex(cal.color));
    }

    if (ev.recurrence) this.row(body, "Repeat", formatRecurrence(ev.recurrence));

    if (ev.alert && ev.alert !== "none") this.row(body, "Alert", formatAlert(ev.alert));

    if (ev.tags && ev.tags.length > 0) this.row(body, "Tags", ev.tags.join(", "));

    if (ev.linkedNotes && ev.linkedNotes.length > 0)
      this.row(body, "Linked notes", ev.linkedNotes.join(", "));

    // Linked tasks — fetch names async
    if (ev.linkedTaskIds && ev.linkedTaskIds.length > 0) {
      const allTasks = await this.taskManager.getAll();
      const linked   = allTasks.filter(t => ev.linkedTaskIds.includes(t.id));
      if (linked.length > 0) {
        const tasksRow = body.createDiv("cdp-row cdp-linked-tasks-row");
        tasksRow.createDiv("cdp-row-label").setText("Tasks");
        const list = tasksRow.createDiv("cdp-row-value cdp-task-list");
        for (const task of linked) {
          const item = list.createDiv("cdp-task-item");
          item.createSpan({ cls: `ctl-status ctl-status-${task.status}` });
          item.createSpan({ cls: "cdp-task-title" }).setText(task.title);
        }
      }
    }

    if (ev.notes) {
      const notesRow = body.createDiv("cdp-row cdp-notes-row");
      notesRow.createDiv("cdp-row-label").setText("Notes");
      notesRow.createDiv("cdp-row-value cdp-notes-text").setText(
        ev.notes.length > 400 ? ev.notes.slice(0, 400) + "…" : ev.notes
      );
    }

    // ── Footer ───────────────────────────────────────────────────────────
    const footer = contentEl.createDiv("cdp-footer");
    const editBtn = footer.createEl("button", { cls: "cf-btn-primary", text: "Edit event" });
    editBtn.addEventListener("click", () => { this.close(); this.onEdit(); });
  }

  private formatDateTime(ev: ChronicleEvent): string {
    const startDate = formatDate(ev.startDate);
    const endDate   = formatDate(ev.endDate);
    const sameDay   = ev.startDate === ev.endDate;

    if (ev.allDay) {
      return sameDay ? startDate : `${startDate} – ${endDate}`;
    }

    const startTime = ev.startTime ? this.fmtTime(ev.startTime) : "";
    const endTime   = ev.endTime   ? this.fmtTime(ev.endTime)   : "";

    if (sameDay) {
      return startTime && endTime
        ? `${startDate}  ·  ${startTime} – ${endTime}`
        : startDate;
    }
    return `${startDate} ${startTime} – ${endDate} ${endTime}`.trim();
  }

  private row(parent: HTMLElement, label: string, value: string) {
    const row = parent.createDiv("cdp-row");
    row.createDiv("cdp-row-label").setText(label);
    row.createDiv("cdp-row-value").setText(value);
  }

  private calRow(parent: HTMLElement, name: string, color: string) {
    const row = parent.createDiv("cdp-row");
    row.createDiv("cdp-row-label").setText("Calendar");
    const val = row.createDiv("cdp-row-value cdp-cal-value");
    const dot = val.createSpan("cdp-cal-dot");
    dot.style.background = color;
    val.createSpan().setText(name);
  }

  private fmtTime(time: string): string {
    if (this.timeFormat === "24h") return time;
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour   = ((h % 12) || 12);
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
  }

  onClose() { this.contentEl.empty(); }
}

// ── Formatters ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric"
  });
}

function formatRecurrence(rrule: string): string {
  const map: Record<string, string> = {
    "FREQ=DAILY":                         "Every day",
    "FREQ=WEEKLY":                        "Every week",
    "FREQ=MONTHLY":                       "Every month",
    "FREQ=YEARLY":                        "Every year",
    "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR":  "Weekdays",
  };
  return map[rrule] ?? rrule;
}

function formatAlert(alert: AlertOffset): string {
  const map: Partial<Record<AlertOffset, string>> = {
    "at-time": "At time of event",
    "5min":    "5 minutes before",
    "10min":   "10 minutes before",
    "15min":   "15 minutes before",
    "30min":   "30 minutes before",
    "1hour":   "1 hour before",
    "2hours":  "2 hours before",
    "1day":    "1 day before",
    "2days":   "2 days before",
    "1week":   "1 week before",
  };
  return map[alert] ?? alert;
}
