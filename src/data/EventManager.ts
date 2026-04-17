import { App, TFile, normalizePath, parseYaml } from "obsidian";
import { ChronicleEvent, AlertOffset } from "../types";

export class EventManager {
  constructor(private app: App, private eventsFolder: string) {}

  async getAll(): Promise<ChronicleEvent[]> {
    const folder = this.app.vault.getFolderByPath(this.eventsFolder);
    if (!folder) return [];

    const events: ChronicleEvent[] = [];
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === "md") {
        const event = await this.fileToEvent(child);
        if (event) events.push(event);
      }
    }
    return events;
  }

  async create(event: Omit<ChronicleEvent, "id" | "createdAt">): Promise<ChronicleEvent> {
    await this.ensureFolder();

    const full: ChronicleEvent = {
      ...event,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    const path = normalizePath(`${this.eventsFolder}/${full.title}.md`);
    await this.app.vault.create(path, this.eventToMarkdown(full));
    return full;
  }

  async update(event: ChronicleEvent): Promise<void> {
    const file = this.findFileForEvent(event.id);
    if (!file) return;

    const expectedPath = normalizePath(`${this.eventsFolder}/${event.title}.md`);
    if (file.path !== expectedPath) {
      await this.app.fileManager.renameFile(file, expectedPath);
    }

    const updatedFile = this.app.vault.getFileByPath(expectedPath) ?? file;
    await this.app.vault.modify(updatedFile, this.eventToMarkdown(event));
  }

  async delete(id: string): Promise<void> {
    const file = this.findFileForEvent(id);
    if (file) await this.app.vault.delete(file);
  }

  async getInRange(startDate: string, endDate: string): Promise<ChronicleEvent[]> {
    const all = await this.getAll();
    return all.filter((e) => e.startDate >= startDate && e.startDate <= endDate);
  }

  // Expands recurring events into occurrences within a date range.
  async getInRangeWithRecurrence(rangeStart: string, rangeEnd: string): Promise<ChronicleEvent[]> {
    const all    = await this.getAll();
    const result: ChronicleEvent[] = [];

    for (const event of all) {
      if (!event.recurrence) {
        if (event.startDate >= rangeStart && event.startDate <= rangeEnd) {
          result.push(event);
        }
        continue;
      }

      const occurrences = this.expandRecurrence(event, rangeStart, rangeEnd);
      result.push(...occurrences);
    }

    return result;
  }

  private expandRecurrence(event: ChronicleEvent, rangeStart: string, rangeEnd: string): ChronicleEvent[] {
    const results: ChronicleEvent[] = [];
    const rule = event.recurrence ?? "";

    const freq    = this.rrulePart(rule, "FREQ");
    const byDay   = this.rrulePart(rule, "BYDAY");
    const until   = this.rrulePart(rule, "UNTIL");
    const countStr = this.rrulePart(rule, "COUNT");
    const count   = countStr ? parseInt(countStr) : 999;

    const start   = new Date(event.startDate + "T00:00:00");
    const rEnd    = new Date(rangeEnd + "T00:00:00");
    const rStart  = new Date(rangeStart + "T00:00:00");
    const untilDate = until ? new Date(until.slice(0,8).replace(/(\d{4})(\d{2})(\d{2})/,"$1-$2-$3") + "T00:00:00") : null;

    const dayNames = ["SU","MO","TU","WE","TH","FR","SA"];
    const byDays   = byDay ? byDay.split(",") : [];

    let current   = new Date(start);
    let generated = 0;

    while (current <= rEnd && generated < count) {
      if (untilDate && current > untilDate) break;

      const dateStr = current.toISOString().split("T")[0];

      const durationMs = new Date(event.endDate + "T00:00:00").getTime() - start.getTime();
      const endDate    = new Date(current.getTime() + durationMs).toISOString().split("T")[0];

      if (current >= rStart && !event.completedInstances.includes(dateStr)) {
        results.push({ ...event, startDate: dateStr, endDate });
        generated++;
      }

      if (freq === "DAILY") {
        current.setDate(current.getDate() + 1);
      } else if (freq === "WEEKLY") {
        if (byDays.length > 0) {
          current.setDate(current.getDate() + 1);
          let safety = 0;
          while (!byDays.includes(dayNames[current.getDay()]) && safety++ < 7) {
            current.setDate(current.getDate() + 1);
          }
        } else {
          current.setDate(current.getDate() + 7);
        }
      } else if (freq === "MONTHLY") {
        current.setMonth(current.getMonth() + 1);
      } else if (freq === "YEARLY") {
        current.setFullYear(current.getFullYear() + 1);
      } else {
        break;
      }
    }

    return results;
  }

  private rrulePart(rule: string, key: string): string {
    const match = rule.match(new RegExp(`(?:^|;)${key}=([^;]+)`));
    return match ? match[1] : "";
  }

  private eventToMarkdown(event: ChronicleEvent): string {
    const fm: Record<string, unknown> = {
      id:                   event.id,
      title:                event.title,
      location:             event.location ?? null,
      "all-day":            event.allDay,
      "start-date":         event.startDate,
      "start-time":         event.startTime ?? null,
      "end-date":           event.endDate,
      "end-time":           event.endTime ?? null,
      recurrence:           event.recurrence ?? null,
      "calendar-id":        event.calendarId ?? null,
      alert:                event.alert,
      "tags":               event.tags ?? [],
      "linked-notes":       event.linkedNotes ?? [],
      "linked-reminder-ids": event.linkedReminderIds,
      "completed-instances": event.completedInstances,
      "created-at":         event.createdAt,
    };

    const yaml = Object.entries(fm)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join("\n");

    const body = event.notes ? `\n${event.notes}` : "";
    return `---\n${yaml}\n---\n${body}`;
  }

  private async fileToEvent(file: TFile): Promise<ChronicleEvent | null> {
    try {
      const content = await this.app.vault.read(file);
      const fm      = this.parseFrontmatter(content);
      if (!fm?.id || !fm?.title) return null;

      const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
      const notes     = bodyMatch?.[1]?.trim() || undefined;

      return {
        id:                   fm.id,
        title:                fm.title,
        location:             fm.location ?? undefined,
        allDay:               fm["all-day"] ?? true,
        startDate:            fm["start-date"],
        startTime:            fm["start-time"] ?? undefined,
        endDate:              fm["end-date"],
        endTime:              fm["end-time"] ?? undefined,
        recurrence:           fm.recurrence ?? undefined,
        calendarId:           fm["calendar-id"] ?? undefined,
        alert:                (fm.alert as AlertOffset) ?? "none",
        tags:                 fm["tags"] ?? [],
        linkedNotes:          fm["linked-notes"] ?? [],
        linkedReminderIds:    fm["linked-reminder-ids"] ?? [],
        completedInstances:   fm["completed-instances"] ?? [],
        createdAt:            fm["created-at"] ?? new Date().toISOString(),
        notes,
      };
    } catch {
      return null;
    }
  }

  private parseFrontmatter(content: string): Record<string, any> | null {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;
    try { return parseYaml(match[1]) ?? null; } catch { return null; }
  }

  private findFileForEvent(id: string): TFile | null {
    const folder = this.app.vault.getFolderByPath(this.eventsFolder);
    if (!folder) return null;
    for (const child of folder.children) {
      if (!(child instanceof TFile)) continue;
      const cache = this.app.metadataCache.getFileCache(child);
      if (cache?.frontmatter?.id === id) return child;
    }
    return null;
  }

  private async ensureFolder(): Promise<void> {
    if (!this.app.vault.getFolderByPath(this.eventsFolder)) {
      await this.app.vault.createFolder(this.eventsFolder);
    }
  }

  private generateId(): string {
    return `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }
}
