import { App, Modal } from "obsidian";
import { ChronicleReminder, ReminderStatus, ReminderPriority, AlertOffset } from "../types";
import { ListManager } from "../data/ListManager";

export class ReminderDetailPopup extends Modal {
  private reminder: ChronicleReminder;
  private listManager: ListManager;
  private timeFormat: "12h" | "24h";
  private onEdit: () => void;

  constructor(
    app: App,
    reminder: ChronicleReminder,
    listManager: ListManager,
    timeFormat: "12h" | "24h",
    onEdit: () => void
  ) {
    super(app);
    this.reminder    = reminder;
    this.listManager = listManager;
    this.timeFormat  = timeFormat;
    this.onEdit      = onEdit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("cdp-modal");

    const r = this.reminder;

    // ── Header ───────────────────────────────────────────────────────────
    const header = contentEl.createDiv("cdp-header");
    header.createDiv("cdp-title").setText(r.title);

    // ── Status + Priority badges ─────────────────────────────────────────
    const badgeRow = contentEl.createDiv("cdp-badge-row");
    badgeRow.createSpan({ cls: `cdp-badge cdp-status-${r.status}` }).setText(formatStatus(r.status));
    if (r.priority !== "none") {
      badgeRow.createSpan({ cls: `cdp-badge cdp-priority-${r.priority}` }).setText(formatPriority(r.priority));
    }

    // ── Detail rows ──────────────────────────────────────────────────────
    const body = contentEl.createDiv("cdp-body");

    if (r.dueDate || r.dueTime) {
      const datePart = r.dueDate ? formatDate(r.dueDate) : "";
      const timePart = r.dueTime ? this.fmtTime(r.dueTime) : "";
      const display  = [datePart, timePart].filter(Boolean).join("  ·  ");
      this.row(body, "Due", display);
    }

    if (r.location) this.row(body, "Location", r.location);

    if (r.listId) {
      const list = this.listManager.getById(r.listId);
      if (list) this.listRow(body, list.name, list.color);
    }

    if (r.recurrence) this.row(body, "Repeat", formatRecurrence(r.recurrence));

    if (r.alert && r.alert !== "none") this.row(body, "Alert", formatAlert(r.alert));

    if (r.tags.length > 0) this.row(body, "Tags", r.tags.join(", "));

    if (r.projects.length > 0) this.row(body, "Projects", r.projects.join(", "));

    if (r.linkedNotes.length > 0) this.row(body, "Linked notes", r.linkedNotes.join(", "));

    if (r.timeEstimate) this.row(body, "Estimate", formatDuration(r.timeEstimate));

    if (r.notes) {
      const notesRow = body.createDiv("cdp-row cdp-notes-row");
      notesRow.createDiv("cdp-row-label").setText("Notes");
      notesRow.createDiv("cdp-row-value cdp-notes-text").setText(
        r.notes.length > 400 ? r.notes.slice(0, 400) + "…" : r.notes
      );
    }

    // ── Footer ───────────────────────────────────────────────────────────
    const footer = contentEl.createDiv("cdp-footer");
    footer.createEl("button", { cls: "cf-btn-primary", text: "Edit reminder" })
      .addEventListener("click", () => { this.close(); this.onEdit(); });
  }

  private row(parent: HTMLElement, label: string, value: string) {
    const row = parent.createDiv("cdp-row");
    row.createDiv("cdp-row-label").setText(label);
    row.createDiv("cdp-row-value").setText(value);
  }

  private listRow(parent: HTMLElement, name: string, color: string) {
    const row = parent.createDiv("cdp-row");
    row.createDiv("cdp-row-label").setText("List");
    const val = row.createDiv("cdp-row-value cdp-cal-value");
    const dot = val.createSpan("cdp-cal-dot");
    dot.style.background = color;
    val.createSpan().setText(name);
  }

  private fmtTime(time: string): string {
    if (this.timeFormat === "24h") return time;
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    return `${((h % 12) || 12)}:${String(m).padStart(2, "0")} ${suffix}`;
  }

  onClose() { this.contentEl.empty(); }
}

// ── Formatters ────────────────────────────────────────────────────────────────

function formatStatus(s: ReminderStatus): string {
  return { todo: "To Do", "in-progress": "In Progress", done: "Done", cancelled: "Cancelled" }[s] ?? s;
}

function formatPriority(p: ReminderPriority): string {
  const map: Partial<Record<ReminderPriority, string>> = { low: "Low priority", medium: "Medium priority", high: "High priority" };
  return map[p] ?? p;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric"
  });
}

function formatRecurrence(rrule: string): string {
  const map: Record<string, string> = {
    "FREQ=DAILY":                        "Every day",
    "FREQ=WEEKLY":                       "Every week",
    "FREQ=MONTHLY":                      "Every month",
    "FREQ=YEARLY":                       "Every year",
    "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR": "Weekdays",
  };
  return map[rrule] ?? rrule;
}

function formatAlert(alert: AlertOffset): string {
  const map: Partial<Record<AlertOffset, string>> = {
    "at-time": "At time of reminder",
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

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}
