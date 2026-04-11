import { App, Notice, TFile } from "obsidian";
import { ReminderManager } from "./ReminderManager";
import { EventManager } from "./EventManager";
import { AlertOffset } from "../types";

export class AlertManager {
  private getSettings: () => import("../types").ChronicleSettings;
  private app:              App;
  private reminderManager:  ReminderManager;
  private eventManager:     EventManager;
  private intervalId:       number | null = null;
  private firedAlerts:      Set<string>   = new Set();

  // Store handler references so we can remove them in stop()
  private onChanged: ((file: TFile) => void) | null = null;
  private onCreate:  ((file: any)   => void) | null = null;

  constructor(app: App, reminderManager: ReminderManager, eventManager: EventManager, getSettings: () => import("../types").ChronicleSettings) {
    this.app              = app;
    this.reminderManager  = reminderManager;
    this.eventManager     = eventManager;
    this.getSettings      = getSettings;
  }

  start() {
    // Request permission inline
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Delay first check to let vault finish loading
    setTimeout(() => {
      console.log("[Chronicle] AlertManager ready, starting poll");
      this.check();
      this.intervalId = window.setInterval(() => this.check(), 30 * 1000);
    }, 3000);

    // Re-check when files change — store refs so we can remove them
    this.onChanged = (file: TFile) => {
      const inEvents    = file.path.startsWith(this.eventManager["eventsFolder"]);
      const inReminders = file.path.startsWith(this.reminderManager["remindersFolder"]);
      if (inEvents || inReminders) setTimeout(() => this.check(), 300);
    };

    this.onCreate = (file: any) => {
      const inEvents    = file.path.startsWith(this.eventManager["eventsFolder"]);
      const inReminders = file.path.startsWith(this.reminderManager["remindersFolder"]);
      if (inEvents || inReminders) setTimeout(() => this.check(), 500);
    };

    this.app.metadataCache.on("changed", this.onChanged);
    this.app.vault.on("create", this.onCreate);
  }

  stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.onChanged) {
      this.app.metadataCache.off("changed", this.onChanged);
      this.onChanged = null;
    }
    if (this.onCreate) {
      this.app.vault.off("create", this.onCreate);
      this.onCreate = null;
    }
    console.log("[Chronicle] AlertManager stopped");
  }

  async check() {
    const now      = new Date();
    const nowMs    = now.getTime();
    const windowMs = 5 * 60 * 1000;

    console.log(`[Chronicle] Alert check at ${now.toLocaleTimeString()}`);

    // ── Check events ────────────────────────────────────────────────────
    const events = await this.eventManager.getAll();
    console.log(`[Chronicle] Checking ${events.length} events`);

    if (!(this.getSettings().notifEvents ?? true)) return;
    for (const event of events) {
      if (!event.alert || event.alert === "none") continue;
      if (!event.startDate || !event.startTime)   continue;

      const alertKey = `event-${event.id}-${event.startDate}-${event.alert}`;
      if (this.firedAlerts.has(alertKey)) continue;

      const startMs = new Date(`${event.startDate}T${event.startTime}`).getTime();
      const alertMs = startMs - this.offsetToMs(event.alert);

      console.log(`[Chronicle] Event "${event.title}" fires at ${new Date(alertMs).toLocaleTimeString()} (${Math.round((alertMs - nowMs)/1000)}s)`);

      if (nowMs >= alertMs && nowMs < alertMs + windowMs) {
        console.log(`[Chronicle] FIRING alert for event "${event.title}"`);
        this.fire(alertKey, event.title, this.buildEventBody(event.startTime, event.alert), "event");
      }
    }

    // ── Check reminders ──────────────────────────────────────────────────
    const reminders = await this.reminderManager.getAll();
    console.log(`[Chronicle] Checking ${reminders.length} reminders`);

    for (const reminder of reminders) {
      if (!reminder.alert || reminder.alert === "none")                          continue;
      if (!reminder.dueDate && !reminder.dueTime)                               continue;
      if (reminder.status === "done" || reminder.status === "cancelled")        continue;

      const todayStr = new Date().toISOString().split("T")[0];
      const dateStr  = reminder.dueDate ?? todayStr;
      const alertKey = `reminder-${reminder.id}-${dateStr}-${reminder.alert}`;
      if (this.firedAlerts.has(alertKey)) continue;

      const timeStr = reminder.dueTime ?? "09:00";
      const dueMs   = new Date(`${dateStr}T${timeStr}`).getTime();
      const alertMs = dueMs - this.offsetToMs(reminder.alert);

      console.log(`[Chronicle] Reminder "${reminder.title}" date="${dateStr}" time="${timeStr}" alert="${reminder.alert}" fires at ${new Date(alertMs).toLocaleTimeString()} (${Math.round((alertMs - nowMs)/1000)}s)`);

      if (nowMs >= alertMs && nowMs < alertMs + windowMs) {
        console.log(`[Chronicle] FIRING alert for reminder "${reminder.title}"`);
        this.fire(alertKey, reminder.title, this.buildReminderBody(reminder.dueDate, reminder.dueTime, reminder.alert), "reminder");
      }
    }
  }

  public fire(key: string, title: string, body: string, type: "event" | "reminder") {
    this.firedAlerts.add(key);
    const settings   = this.getSettings();
    const doMacOS    = settings.notifMacOS    ?? true;
    const doObsidian = settings.notifObsidian ?? true;
    const doSound    = settings.notifSound    ?? true;
    const icon       = type === "event" ? "🗓" : "✓";

    // ── macOS native notification ──────────────────────────────────────────
    if (doMacOS) {
      const rawSound  = type === "event" ? (settings.notifSoundEvent ?? "Glass") : (settings.notifSoundReminder ?? "Glass");
      const soundName = (doSound && rawSound !== "none") ? rawSound : "";

      let notifSent = false;
      try {
        const { exec } = (window as any).require("child_process");
        const t = `Chronicle — ${type === "event" ? "Event" : "Reminder"}`;
        const b = `${title} — ${body}`.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const soundClause = soundName ? ` sound name "${soundName}"` : "";
        exec(`osascript -e 'display notification "${b}" with title "${t}"${soundClause}'`,
          (err: any) => {
            if (err) console.log("[Chronicle] osascript failed:", err.message);
            else     console.log("[Chronicle] osascript notification sent");
          }
        );
        notifSent = true;
      } catch (err) {
        console.log("[Chronicle] osascript unavailable:", err);
      }

      // Fallback: Electron ipcRenderer
      if (!notifSent) {
        try {
          const { ipcRenderer } = (window as any).require("electron");
          ipcRenderer.send("show-notification", {
            title: `Chronicle — ${type === "event" ? "Event" : "Reminder"}`,
            body:  `${title}\n${body}`,
          });
          console.log("[Chronicle] ipcRenderer notification sent");
        } catch (err) {
          console.log("[Chronicle] ipcRenderer failed:", err);
        }
      }
    }

    // ── In-app toast (independent of macOS toggle) ─────────────────────────
    if (doObsidian) {
      new Notice(`${icon} ${title}\n${body}`, 8000);
    }
  }

  private offsetToMs(offset: AlertOffset): number {
    const map: Record<AlertOffset, number> = {
      "none":    0,       "at-time": 0,
      "5min":    300000,  "10min":   600000,
      "15min":   900000,  "30min":   1800000,
      "1hour":   3600000, "2hours":  7200000,
      "1day":    86400000,"2days":   172800000,
      "1week":   604800000,
    };
    return map[offset] ?? 0;
  }

  private buildEventBody(startTime: string, alert: AlertOffset): string {
    if (alert === "at-time") return `Starting at ${this.formatTime(startTime)}`;
    return `${this.offsetLabel(alert)} — starts at ${this.formatTime(startTime)}`;
  }

  private buildReminderBody(dueDate: string | undefined, dueTime: string | undefined, alert: AlertOffset): string {
    if (!dueDate) return dueTime ? `Due at ${this.formatTime(dueTime)}` : "Due now";
    const dateLabel = new Date(dueDate + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric"
    });
    if (dueTime) {
      if (alert === "at-time") return `Due at ${this.formatTime(dueTime)}`;
      return `${this.offsetLabel(alert)} — due at ${this.formatTime(dueTime)}`;
    }
    return `Due ${dateLabel}`;
  }

  private offsetLabel(offset: AlertOffset): string {
    const map: Record<AlertOffset, string> = {
      "none": "", "at-time": "Now",
      "5min": "5 min", "10min": "10 min", "15min": "15 min", "30min": "30 min",
      "1hour": "1 hour", "2hours": "2 hours",
      "1day": "1 day", "2days": "2 days", "1week": "1 week",
    };
    return map[offset] ?? "";
  }

  private formatTime(timeStr: string): string {
    const [h, m] = timeStr.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
  }
}
