import { ChronicleReminder, ReminderStatus, ReminderPriority, AlertOffset } from "../types";
import { App, TFile, normalizePath, parseYaml } from "obsidian";

export class ReminderManager {
  constructor(private app: App, private remindersFolder: string) {}

  // ── Read ────────────────────────────────────────────────────────────────────

  async getAll(): Promise<ChronicleReminder[]> {
    const folder = this.app.vault.getFolderByPath(this.remindersFolder);
    if (!folder) return [];

    const reminders: ChronicleReminder[] = [];
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === "md") {
        const reminder = await this.fileToReminder(child);
        if (reminder) reminders.push(reminder);
      }
    }
    return reminders;
  }

  async getById(id: string): Promise<ChronicleReminder | null> {
    const all = await this.getAll();
    return all.find((r) => r.id === id) ?? null;
  }

  // ── Write ───────────────────────────────────────────────────────────────────

  async create(reminder: Omit<ChronicleReminder, "id" | "createdAt">): Promise<ChronicleReminder> {
    await this.ensureFolder();

    const full: ChronicleReminder = {
      ...reminder,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    const path = normalizePath(`${this.remindersFolder}/${full.title}.md`);
    await this.app.vault.create(path, this.reminderToMarkdown(full));
    return full;
  }

  async update(reminder: ChronicleReminder): Promise<void> {
    const file = this.findFileForReminder(reminder.id);
    if (!file) return;

    const expectedPath = normalizePath(`${this.remindersFolder}/${reminder.title}.md`);
    if (file.path !== expectedPath) {
      await this.app.fileManager.renameFile(file, expectedPath);
    }

    const updatedFile = this.app.vault.getFileByPath(expectedPath) ?? file;
    await this.app.vault.modify(updatedFile, this.reminderToMarkdown(reminder));
  }

  async delete(id: string): Promise<void> {
    const file = this.findFileForReminder(id);
    if (file) await this.app.vault.delete(file);
  }

  async markComplete(id: string): Promise<void> {
    const reminder = await this.getById(id);
    if (!reminder) return;
    await this.update({
      ...reminder,
      status: "done",
      completedAt: new Date().toISOString(),
    });
  }

  // ── Filters ─────────────────────────────────────────────────────────────────

  async getDueToday(): Promise<ChronicleReminder[]> {
    const today = this.todayStr();
    const all = await this.getAll();
    return all.filter(
      (r) => r.status !== "done" && r.status !== "cancelled" && r.dueDate === today
    );
  }

  async getOverdue(): Promise<ChronicleReminder[]> {
    const today = this.todayStr();
    const all = await this.getAll();
    return all.filter(
      (r) => r.status !== "done" && r.status !== "cancelled" && !!r.dueDate && r.dueDate < today
    );
  }

  async getScheduled(): Promise<ChronicleReminder[]> {
    const all = await this.getAll();
    return all.filter(
      (r) => r.status !== "done" && r.status !== "cancelled" && !!r.dueDate
    );
  }

  // ── Serialisation ───────────────────────────────────────────────────────────

  private reminderToMarkdown(reminder: ChronicleReminder): string {
    const fm: Record<string, unknown> = {
      id:                    reminder.id,
      title:                 reminder.title,
      "location":            reminder.location ?? null,
      status:                reminder.status,
      priority:              reminder.priority,
      tags:                  reminder.tags,
      projects:              reminder.projects,
      "linked-notes":        reminder.linkedNotes,
      "list-id":             reminder.listId ?? null,
      "due-date":            reminder.dueDate ?? null,
      "due-time":            reminder.dueTime ?? null,
      recurrence:            reminder.recurrence ?? null,
      "alert":               reminder.alert ?? "none",
      "time-estimate":       reminder.timeEstimate ?? null,
      "time-entries":        reminder.timeEntries,
      "custom-fields":       reminder.customFields,
      "completed-instances": reminder.completedInstances,
      "created-at":          reminder.createdAt,
      "completed-at":        reminder.completedAt ?? null,
    };

    const yaml = Object.entries(fm)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join("\n");

    const body = reminder.notes ? `\n${reminder.notes}` : "";
    return `---\n${yaml}\n---\n${body}`;
  }

  private async fileToReminder(file: TFile): Promise<ChronicleReminder | null> {
    try {
      const content = await this.app.vault.read(file);
      const fm      = this.parseFrontmatter(content);
      if (!fm?.id || !fm?.title) return null;

      const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
      const notes     = bodyMatch?.[1]?.trim() || undefined;

      return {
        id:                 fm.id,
        title:              fm.title,
        location:           fm.location ?? undefined,
        status:             (fm.status as ReminderStatus) ?? "todo",
        priority:           (fm.priority as ReminderPriority) ?? "none",
        dueDate:            fm["due-date"] ?? undefined,
        dueTime:            fm["due-time"] ?? undefined,
        recurrence:         fm.recurrence ?? undefined,
        alert:              (fm.alert as AlertOffset) ?? "none",
        listId:             fm["list-id"] ?? fm["calendar-id"] ?? undefined,
        tags:               fm.tags ?? [],
        linkedNotes:        fm["linked-notes"] ?? [],
        projects:           fm.projects ?? [],
        timeEstimate:       fm["time-estimate"] ?? undefined,
        timeEntries:        fm["time-entries"] ?? [],
        customFields:       fm["custom-fields"] ?? [],
        completedInstances: fm["completed-instances"] ?? [],
        createdAt:          fm["created-at"] ?? new Date().toISOString(),
        completedAt:        fm["completed-at"] ?? undefined,
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

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private findFileForReminder(id: string): TFile | null {
    const folder = this.app.vault.getFolderByPath(this.remindersFolder);
    if (!folder) return null;
    for (const child of folder.children) {
      if (!(child instanceof TFile)) continue;
      const cache = this.app.metadataCache.getFileCache(child);
      if (cache?.frontmatter?.id === id) return child;
    }
    return null;
  }

  private async ensureFolder(): Promise<void> {
    if (!this.app.vault.getFolderByPath(this.remindersFolder)) {
      await this.app.vault.createFolder(this.remindersFolder);
    }
  }

  private generateId(): string {
    return `reminder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  private todayStr(): string {
    return new Date().toISOString().split("T")[0];
  }
}
