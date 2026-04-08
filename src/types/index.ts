// ─── Calendars ───────────────────────────────────────────────────────────────

export type CalendarColor =
  | "blue" | "green" | "purple" | "orange"
  | "red" | "teal" | "pink" | "yellow" | "gray";

export interface ChronicleCalendar {
  id: string;
  name: string;
  color: CalendarColor;
  description?: string;
  isVisible: boolean;
  createdAt: string;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus = "todo" | "in-progress" | "done" | "cancelled";
export type TaskPriority = "none" | "low" | "medium" | "high";

export interface TimeEntry {
  startTime: string;   // ISO 8601
  endTime?: string;    // ISO 8601
}

export interface CustomField {
  key: string;
  value: string | number | boolean;
}

export interface ChronicleTask {
  // --- Core ---
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;

  // --- Scheduling ---
  dueDate?: string;       // YYYY-MM-DD
  dueTime?: string;       // HH:mm
  recurrence?: string;    // RRULE string e.g. "FREQ=WEEKLY;BYDAY=MO"

  // --- Organisation ---
  calendarId?: string;    // links to a ChronicleCalendar
  tags: string[];
  contexts: string[];     // e.g. ["@home", "@work"]
  linkedNotes: string[];  // wikilink paths e.g. ["Projects/Website"]
  projects: string[];

  // --- Time tracking ---
  timeEstimate?: number;  // minutes
  timeEntries: TimeEntry[];

  // --- Custom ---
  customFields: CustomField[];

  // --- Recurrence completion ---
  completedInstances: string[]; // YYYY-MM-DD dates

  // --- Meta ---
  createdAt: string;      // ISO 8601
  completedAt?: string;   // ISO 8601
  notes?: string;         // body content of the note
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type AlertOffset =
  | "none"
  | "at-time"
  | "5min" | "10min" | "15min" | "30min"
  | "1hour" | "2hours"
  | "1day" | "2days" | "1week";

export interface ChronicleEvent {
  // --- Core (in form order) ---
  id: string;
  title: string;
  location?: string;
  allDay: boolean;
  startDate: string;      // YYYY-MM-DD
  startTime?: string;     // HH:mm  (undefined when allDay)
  endDate: string;        // YYYY-MM-DD
  endTime?: string;       // HH:mm  (undefined when allDay)
  recurrence?: string;    // RRULE string
  calendarId?: string;    // links to a ChronicleCalendar
  alert: AlertOffset;
  notes?: string;         // body content of the note

  // --- Connections ---
  linkedTaskIds: string[];   // Chronicle task IDs

  // --- Meta ---
  createdAt: string;
  completedInstances: string[];
}

// ─── Plugin settings ─────────────────────────────────────────────────────────

export interface ChronicleSettings {
  // Folder paths
  tasksFolder: string;
  eventsFolder: string;

  // Calendars (stored in settings, not as files)
  calendars: ChronicleCalendar[];
  defaultCalendarId: string;

  // Defaults
  defaultTaskStatus: TaskStatus;
  defaultTaskPriority: TaskPriority;
  defaultAlert: AlertOffset;

  // Display
  startOfWeek: 0 | 1 | 6;  // 0=Sun, 1=Mon, 6=Sat
  timeFormat: "12h" | "24h";
  defaultCalendarView: "day" | "week" | "month" | "year";

  // Smart lists visibility
  showTodayCount: boolean;
  showScheduledCount: boolean;
  showFlaggedCount: boolean;
}

export const DEFAULT_SETTINGS: ChronicleSettings = {
  tasksFolder: "Chronicle/Tasks",
  eventsFolder: "Chronicle/Events",
  calendars: [
    { id: "personal", name: "Personal", color: "blue",   isVisible: true, createdAt: new Date().toISOString() },
    { id: "work",     name: "Work",     color: "green",  isVisible: true, createdAt: new Date().toISOString() },
  ],
  defaultCalendarId: "personal",
  defaultTaskStatus: "todo",
  defaultTaskPriority: "none",
  defaultAlert: "none",
  startOfWeek: 0,
  timeFormat: "12h",
  defaultCalendarView: "week",
  showTodayCount: true,
  showScheduledCount: true,
  showFlaggedCount: true,
};