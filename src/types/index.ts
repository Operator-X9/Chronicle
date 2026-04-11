// ─── Calendars ───────────────────────────────────────────────────────────────

export type CalendarColor = string;

export interface ChronicleCalendar {
  id: string;
  name: string;
  color: CalendarColor;
  description?: string;
  isVisible: boolean;
  createdAt: string;
}

// ─── Lists (reminder organisation) ───────────────────────────────────────────

export interface ChronicleList {
  id: string;
  name: string;
  color: string;    // hex value e.g. "#378ADD"
  createdAt: string;
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export type ReminderStatus = "todo" | "in-progress" | "done" | "cancelled";
export type ReminderPriority = "none" | "low" | "medium" | "high";

export interface TimeEntry {
  startTime: string;   // ISO 8601
  endTime?: string;    // ISO 8601
}

export interface CustomField {
  key: string;
  value: string | number | boolean;
}

export interface ChronicleReminder {
  // --- Core ---
  id: string;
  title: string;
  status: ReminderStatus;
  priority: ReminderPriority;

  // --- Scheduling ---
  dueDate?: string;       // YYYY-MM-DD
  dueTime?: string;       // HH:mm
  recurrence?: string;    // RRULE string e.g. "FREQ=WEEKLY;BYDAY=MO"
  alert: AlertOffset;

  // --- Organisation ---
  location?: string;
  listId?: string;        // links to a ChronicleList
  tags: string[];
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
  linkedNotes?: string[];
  tags?: string[];

  // --- Connections ---
  linkedReminderIds: string[];   // Chronicle reminder IDs

  // --- Meta ---
  createdAt: string;
  completedInstances: string[];
}

// ─── Plugin settings ─────────────────────────────────────────────────────────

export interface ChronicleSettings {
  // Folder paths
  remindersFolder: string;
  eventsFolder: string;

  // Calendars — for events (stored in settings, not as files)
  calendars: ChronicleCalendar[];
  defaultCalendarId: string;

  // Lists — for reminders (stored in settings, not as files)
  lists: ChronicleList[];
  defaultListId: string;

  // Defaults
  defaultReminderStatus: ReminderStatus;
  defaultReminderPriority: ReminderPriority;
  defaultAlert: AlertOffset;

  // Display
  startOfWeek: 0 | 1 | 6;  // 0=Sun, 1=Mon, 6=Sat
  timeFormat: "12h" | "24h";
  defaultCalendarView: "day" | "week" | "month" | "year";

  // Smart lists visibility
  showTodayList: boolean;
  showScheduledList: boolean;
  showAllList: boolean;
  showFlaggedList: boolean;
  showCompletedList: boolean;

  // Smart list order (array of smart list IDs)
  smartListOrder: string[];

  // Smart list colors (keyed by smart list ID)
  smartListColors: Record<string, string>;

  // Notification channels
  notifMacOS: boolean;
  notifSound: boolean;
  notifEvents: boolean;
  notifReminders: boolean;

  // Notification sounds (macOS sound names, e.g. "Glass", "Ping", "none")
  notifSoundEvent: string;
  notifSoundReminder: string;

  // Events
  defaultEventDuration: number;

  // Appearance
  density: "compact" | "comfortable";
  showCompletedCount: boolean;
  showReminderCountSubtitle: boolean;

  // Custom field templates
  defaultCustomFields: { key: string; type: "text" | "number" | "date" | "checkbox" }[];
}

export const DEFAULT_SETTINGS: ChronicleSettings = {
  remindersFolder: "Chronicle/Reminders",
  eventsFolder: "Chronicle/Events",
  calendars: [
    { id: "personal", name: "Personal", color: "#378ADD", isVisible: true, createdAt: new Date().toISOString() },
    { id: "work",     name: "Work",     color: "#34C759", isVisible: true, createdAt: new Date().toISOString() },
  ],
  defaultCalendarId: "personal",
  lists: [
    { id: "personal", name: "Personal", color: "#378ADD", createdAt: new Date().toISOString() },
    { id: "work",     name: "Work",     color: "#34C759", createdAt: new Date().toISOString() },
  ],
  defaultListId: "personal",
  defaultReminderStatus: "todo",
  defaultReminderPriority: "none",
  defaultAlert: "none",
  startOfWeek: 0,
  timeFormat: "12h",
  defaultCalendarView: "week",
  showTodayList: true,
  showScheduledList: true,
  showAllList: true,
  showFlaggedList: true,
  showCompletedList: true,
  smartListOrder: ["today", "scheduled", "all", "flagged", "completed"],
  smartListColors: {
    today:     "#FF3B30",
    scheduled: "#378ADD",
    all:       "#636366",
    flagged:   "#FF9500",
    completed: "#34C759",
  },
  notifMacOS: true,
  notifSound: true,
  notifEvents: true,
  notifReminders: true,
  notifSoundEvent: "Glass",
  notifSoundReminder: "Glass",
  defaultEventDuration: 60,
  density: "comfortable",
  showCompletedCount: true,
  showReminderCountSubtitle: true,
  defaultCustomFields: [],
};
