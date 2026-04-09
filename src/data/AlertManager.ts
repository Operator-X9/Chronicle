import { App, Notice, TFile } from "obsidian";
import { TaskManager } from "./TaskManager";
import { EventManager } from "./EventManager";
import { AlertOffset } from "../types";

export class AlertManager {
  private app:          App;
  private taskManager:  TaskManager;
  private eventManager: EventManager;
  private intervalId:   number | null = null;
  private firedAlerts:  Set<string>   = new Set();
  private audioCtx:     AudioContext | null = null;

  // Store handler references so we can remove them in stop()
  private onChanged: ((file: TFile) => void) | null = null;
  private onCreate:  ((file: any)   => void) | null = null;

  constructor(app: App, taskManager: TaskManager, eventManager: EventManager) {
    this.app          = app;
    this.taskManager  = taskManager;
    this.eventManager = eventManager;
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
      const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
      const inTasks  = file.path.startsWith(this.taskManager["tasksFolder"]);
      if (inEvents || inTasks) setTimeout(() => this.check(), 300);
    };

    this.onCreate = (file: any) => {
      const inEvents = file.path.startsWith(this.eventManager["eventsFolder"]);
      const inTasks  = file.path.startsWith(this.taskManager["tasksFolder"]);
      if (inEvents || inTasks) setTimeout(() => this.check(), 500);
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

    // ── Check tasks ──────────────────────────────────────────────────────
    const tasks = await this.taskManager.getAll();
    console.log(`[Chronicle] Checking ${tasks.length} tasks`);

    for (const task of tasks) {
      if (!task.alert || task.alert === "none")                  continue;
      if (!task.dueDate && !task.dueTime)                        continue;
      if (task.status === "done" || task.status === "cancelled") continue;

      const todayStr = new Date().toISOString().split("T")[0];
      const dateStr  = task.dueDate ?? todayStr;
      const alertKey = `task-${task.id}-${dateStr}-${task.alert}`;
      if (this.firedAlerts.has(alertKey)) continue;

      const timeStr = task.dueTime ?? "09:00";
      const dueMs   = new Date(`${dateStr}T${timeStr}`).getTime();
      const alertMs = dueMs - this.offsetToMs(task.alert);

      console.log(`[Chronicle] Task "${task.title}" date="${dateStr}" time="${timeStr}" alert="${task.alert}" fires at ${new Date(alertMs).toLocaleTimeString()} (${Math.round((alertMs - nowMs)/1000)}s)`);

      if (nowMs >= alertMs && nowMs < alertMs + windowMs) {
        console.log(`[Chronicle] FIRING alert for task "${task.title}"`);
        this.fire(alertKey, task.title, this.buildTaskBody(task.dueDate, task.dueTime, task.alert), "task");
      }
    }
  }

  private fire(key: string, title: string, body: string, type: "event" | "task") {
    this.firedAlerts.add(key);
    const icon = type === "event" ? "🗓" : "✓";

    // Native macOS notification — try multiple approaches
    let notifSent = false;

    // Approach 1: osascript (most reliable on macOS regardless of Electron version)
    try {
      const { exec } = (window as any).require("child_process");
      const t = `Chronicle — ${type === "event" ? "Event" : "Task"}`;
      const b = `${title} — ${body}`.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      exec(`osascript -e 'display notification "${b}" with title "${t}" sound name "Glass"'`,
        (err: any) => {
          if (err) console.log("[Chronicle] osascript failed:", err.message);
          else console.log("[Chronicle] osascript notification sent");
        }
      );
      notifSent = true;
    } catch (err) {
      console.log("[Chronicle] osascript unavailable:", err);
    }

    // Approach 2: Electron ipcRenderer → main process (fallback)
    if (!notifSent) {
      try {
        const { ipcRenderer } = (window as any).require("electron");
        ipcRenderer.send("show-notification", {
          title: `Chronicle — ${type === "event" ? "Event" : "Task"}`,
          body:  `${title}\n${body}`,
        });
        console.log("[Chronicle] ipcRenderer notification sent");
      } catch (err) {
        console.log("[Chronicle] ipcRenderer failed:", err);
      }
    }

    // In-app toast — always works
    new Notice(`${icon} ${title}\n${body}`, 8000);

    // Sound
    this.playSound();
  }

  private playSound() {
    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      const ctx  = this.audioCtx;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      for (const [freq, delay] of [[880, 0], [1108, 0.15]] as [number, number][]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        osc.connect(gain);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.5);
      }
    } catch { /* silent fail */ }
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

  private buildTaskBody(dueDate: string, dueTime: string | undefined, alert: AlertOffset): string {
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