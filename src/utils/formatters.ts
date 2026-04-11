import { AlertOffset, ReminderStatus, ReminderPriority } from "../types";

// ── Date formatting ─────────────────────────────────────────────────────────

export function formatDateFull(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

export function formatDateRelative(dateStr: string): string {
  const today    = todayStr();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  if (dateStr === today)    return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Time formatting ─────────────────────────────────────────────────────────

export function formatTime12(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour   = (h % 12) || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatTime(timeStr: string, format: "12h" | "24h"): string {
  return format === "24h" ? timeStr : formatTime12(timeStr);
}

export function formatHour12(h: number): string {
  if (h === 0)  return "12 AM";
  if (h < 12)   return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

// ── Recurrence ──────────────────────────────────────────────────────────────

export function formatRecurrence(rrule: string): string {
  const map: Record<string, string> = {
    "FREQ=DAILY":                        "Every day",
    "FREQ=WEEKLY":                       "Every week",
    "FREQ=MONTHLY":                      "Every month",
    "FREQ=YEARLY":                       "Every year",
    "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR": "Weekdays",
  };
  return map[rrule] ?? rrule;
}

// ── Alert ───────────────────────────────────────────────────────────────────

export function formatAlert(alert: AlertOffset): string {
  const map: Partial<Record<AlertOffset, string>> = {
    "at-time": "At time",
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

// ── Status / Priority ───────────────────────────────────────────────────────

export function formatStatus(s: ReminderStatus): string {
  return { todo: "To Do", "in-progress": "In Progress", done: "Done", cancelled: "Cancelled" }[s] ?? s;
}

export function formatPriority(p: ReminderPriority): string {
  const map: Partial<Record<ReminderPriority, string>> = {
    low: "Low priority", medium: "Medium priority", high: "High priority",
  };
  return map[p] ?? p;
}

// ── Duration ────────────────────────────────────────────────────────────────

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}
