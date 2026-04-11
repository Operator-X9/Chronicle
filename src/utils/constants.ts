import { AlertOffset, ReminderStatus, ReminderPriority } from "../types";

// ── Alert options (used in modals, forms, and settings) ─────────────────────

export const ALERT_OPTIONS: { value: AlertOffset; label: string }[] = [
  { value: "none",    label: "None" },
  { value: "at-time", label: "At time" },
  { value: "5min",    label: "5 minutes before" },
  { value: "10min",   label: "10 minutes before" },
  { value: "15min",   label: "15 minutes before" },
  { value: "30min",   label: "30 minutes before" },
  { value: "1hour",   label: "1 hour before" },
  { value: "2hours",  label: "2 hours before" },
  { value: "1day",    label: "1 day before" },
  { value: "2days",   label: "2 days before" },
  { value: "1week",   label: "1 week before" },
];

// ── Recurrence presets ──────────────────────────────────────────────────────

export const RECURRENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "",                                   label: "Never" },
  { value: "FREQ=DAILY",                         label: "Every day" },
  { value: "FREQ=WEEKLY",                        label: "Every week" },
  { value: "FREQ=MONTHLY",                       label: "Every month" },
  { value: "FREQ=YEARLY",                        label: "Every year" },
  { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",  label: "Weekdays" },
];

// ── Reminder status options ─────────────────────────────────────────────────

export const STATUS_OPTIONS: { value: ReminderStatus; label: string }[] = [
  { value: "todo",        label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "done",        label: "Done" },
  { value: "cancelled",   label: "Cancelled" },
];

// ── Reminder priority options ───────────────────────────────────────────────

export const PRIORITY_OPTIONS: { value: ReminderPriority; label: string }[] = [
  { value: "none",   label: "None" },
  { value: "low",    label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High" },
];

// ── macOS system sounds ─────────────────────────────────────────────────────

export const SOUND_OPTIONS: { value: string; label: string }[] = [
  { value: "none",      label: "None (silent)" },
  { value: "Glass",     label: "Glass" },
  { value: "Ping",      label: "Ping" },
  { value: "Tink",      label: "Tink" },
  { value: "Basso",     label: "Basso" },
  { value: "Funk",      label: "Funk" },
  { value: "Hero",      label: "Hero" },
  { value: "Sosumi",    label: "Sosumi" },
  { value: "Submarine", label: "Submarine" },
  { value: "Blow",      label: "Blow" },
  { value: "Bottle",    label: "Bottle" },
  { value: "Frog",      label: "Frog" },
  { value: "Morse",     label: "Morse" },
  { value: "Pop",       label: "Pop" },
  { value: "Purr",      label: "Purr" },
];
