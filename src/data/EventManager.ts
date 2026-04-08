import { App, TFile, normalizePath } from "obsidian";
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
      "linked-task-ids":    event.linkedTaskIds,
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
      const cache = this.app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter;
      if (!fm?.id || !fm?.title) return null;

      const content = await this.app.vault.read(file);
      const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
      const notes = bodyMatch?.[1]?.trim() || undefined;

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
        linkedTaskIds:        fm["linked-task-ids"] ?? [],
        completedInstances:   fm["completed-instances"] ?? [],
        createdAt:            fm["created-at"] ?? new Date().toISOString(),
        notes,
      };
    } catch {
      return null;
    }
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