import { App, Modal } from "obsidian";
import { ChronicleEvent } from "../types";
import { CalendarManager } from "../data/CalendarManager";
import { ReminderManager } from "../data/ReminderManager";
import { formatDateFull, formatRecurrence, formatAlert } from "../utils/formatters";

export class EventDetailPopup extends Modal {
  private event:           ChronicleEvent;
  private calendarManager: CalendarManager;
  private reminderManager: ReminderManager;
  private timeFormat:      "12h" | "24h";
  private onEdit:          () => void;

  constructor(
    app: App,
    event: ChronicleEvent,
    calendarManager: CalendarManager,
    reminderManager: ReminderManager,
    timeFormat: "12h" | "24h",
    onEdit: () => void
  ) {
    super(app);
    this.event           = event;
    this.calendarManager = calendarManager;
    this.reminderManager = reminderManager;
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

    // Linked reminders — fetch names async
    if (ev.linkedReminderIds && ev.linkedReminderIds.length > 0) {
      const allReminders = await this.reminderManager.getAll();
      const linked       = allReminders.filter(r => ev.linkedReminderIds.includes(r.id));
      if (linked.length > 0) {
        const remindersRow = body.createDiv("cdp-row cdp-linked-reminders-row");
        remindersRow.createDiv("cdp-row-label").setText("Reminders");
        const list = remindersRow.createDiv("cdp-row-value cdp-reminder-list");
        for (const reminder of linked) {
          const item = list.createDiv("cdp-reminder-item");
          item.createSpan({ cls: `ctl-status ctl-status-${reminder.status}` });
          item.createSpan({ cls: "cdp-reminder-title" }).setText(reminder.title);
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
    const startDate = formatDateFull(ev.startDate);
    const endDate   = formatDateFull(ev.endDate);
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

