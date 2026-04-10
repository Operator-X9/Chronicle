import { App, Modal } from "obsidian";
import { ChronicleTask, TaskStatus, TaskPriority, AlertOffset } from "../types";
import { ListManager } from "../data/ListManager";

export class TaskDetailPopup extends Modal {
  private task: ChronicleTask;
  private listManager: ListManager;
  private timeFormat: "12h" | "24h";
  private onEdit: () => void;

  constructor(
    app: App,
    task: ChronicleTask,
    listManager: ListManager,
    timeFormat: "12h" | "24h",
    onEdit: () => void
  ) {
    super(app);
    this.task        = task;
    this.listManager = listManager;
    this.timeFormat  = timeFormat;
    this.onEdit      = onEdit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("cdp-modal");

    const t = this.task;

    // ── Header ───────────────────────────────────────────────────────────
    const header = contentEl.createDiv("cdp-header");
    header.createDiv("cdp-title").setText(t.title);

    // ── Status + Priority badges ─────────────────────────────────────────
    const badgeRow = contentEl.createDiv("cdp-badge-row");
    badgeRow.createSpan({ cls: `cdp-badge cdp-status-${t.status}` }).setText(formatStatus(t.status));
    if (t.priority !== "none") {
      badgeRow.createSpan({ cls: `cdp-badge cdp-priority-${t.priority}` }).setText(formatPriority(t.priority));
    }

    // ── Detail rows ──────────────────────────────────────────────────────
    const body = contentEl.createDiv("cdp-body");

    if (t.dueDate) {
      const timeStr = t.dueTime ? `  ·  ${this.fmtTime(t.dueTime)}` : "";
      this.row(body, "Due", formatDate(t.dueDate) + timeStr);
    }

    if (t.location) this.row(body, "Location", t.location);

    if (t.listId) {
      const list = this.listManager.getById(t.listId);
      if (list) this.listRow(body, list.name, list.color);
    }

    if (t.recurrence) this.row(body, "Repeat", formatRecurrence(t.recurrence));

    if (t.alert && t.alert !== "none") this.row(body, "Alert", formatAlert(t.alert));

    if (t.tags.length > 0) this.row(body, "Tags", t.tags.join(", "));

    if (t.projects.length > 0) this.row(body, "Projects", t.projects.join(", "));

    if (t.linkedNotes.length > 0) this.row(body, "Linked notes", t.linkedNotes.join(", "));

    if (t.timeEstimate) this.row(body, "Estimate", formatDuration(t.timeEstimate));

    if (t.notes) {
      const notesRow = body.createDiv("cdp-row cdp-notes-row");
      notesRow.createDiv("cdp-row-label").setText("Notes");
      notesRow.createDiv("cdp-row-value cdp-notes-text").setText(
        t.notes.length > 400 ? t.notes.slice(0, 400) + "…" : t.notes
      );
    }

    // ── Footer ───────────────────────────────────────────────────────────
    const footer = contentEl.createDiv("cdp-footer");
    footer.createEl("button", { cls: "cf-btn-primary", text: "Edit task" })
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

function formatStatus(s: TaskStatus): string {
  return { todo: "To Do", "in-progress": "In Progress", done: "Done", cancelled: "Cancelled" }[s] ?? s;
}

function formatPriority(p: TaskPriority): string {
  const map: Partial<Record<TaskPriority, string>> = { low: "Low priority", medium: "Medium priority", high: "High priority" };
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

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}
