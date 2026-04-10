import { ChronicleTask, TaskStatus, TaskPriority, AlertOffset } from "../types";
import { App, TFile, normalizePath } from "obsidian";

export class TaskManager {
  constructor(private app: App, private tasksFolder: string) {}

  // ── Read ────────────────────────────────────────────────────────────────────

  async getAll(): Promise<ChronicleTask[]> {
    const folder = this.app.vault.getFolderByPath(this.tasksFolder);
    if (!folder) return [];

    const tasks: ChronicleTask[] = [];
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === "md") {
        const task = await this.fileToTask(child);
        if (task) tasks.push(task);
      }
    }
    return tasks;
  }

  async getById(id: string): Promise<ChronicleTask | null> {
    const all = await this.getAll();
    return all.find((t) => t.id === id) ?? null;
  }

  // ── Write ───────────────────────────────────────────────────────────────────

  async create(task: Omit<ChronicleTask, "id" | "createdAt">): Promise<ChronicleTask> {
    await this.ensureFolder();

    const full: ChronicleTask = {
      ...task,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    const path = normalizePath(`${this.tasksFolder}/${full.title}.md`);
    await this.app.vault.create(path, this.taskToMarkdown(full));
    return full;
  }

  async update(task: ChronicleTask): Promise<void> {
    const file = this.findFileForTask(task.id);
    if (!file) return;

    const expectedPath = normalizePath(`${this.tasksFolder}/${task.title}.md`);
    if (file.path !== expectedPath) {
      await this.app.fileManager.renameFile(file, expectedPath);
    }

    const updatedFile = this.app.vault.getFileByPath(expectedPath) ?? file;
    await this.app.vault.modify(updatedFile, this.taskToMarkdown(task));
  }

  async delete(id: string): Promise<void> {
    const file = this.findFileForTask(id);
    if (file) await this.app.vault.delete(file);
  }

  async markComplete(id: string): Promise<void> {
    const task = await this.getById(id);
    if (!task) return;
    await this.update({
      ...task,
      status: "done",
      completedAt: new Date().toISOString(),
    });
  }

  // ── Filters ─────────────────────────────────────────────────────────────────

  async getDueToday(): Promise<ChronicleTask[]> {
    const today = this.todayStr();
    const all = await this.getAll();
    return all.filter(
      (t) => t.status !== "done" && t.status !== "cancelled" && t.dueDate === today
    );
  }

  async getOverdue(): Promise<ChronicleTask[]> {
    const today = this.todayStr();
    const all = await this.getAll();
    return all.filter(
      (t) => t.status !== "done" && t.status !== "cancelled" && !!t.dueDate && t.dueDate < today
    );
  }

  async getScheduled(): Promise<ChronicleTask[]> {
    const all = await this.getAll();
    return all.filter(
      (t) => t.status !== "done" && t.status !== "cancelled" && !!t.dueDate
    );
  }

  async getFlagged(): Promise<ChronicleTask[]> {
    const all = await this.getAll();
    return all.filter((t) => t.priority === "high" && t.status !== "done");
  }

  // ── Serialisation ───────────────────────────────────────────────────────────

  private taskToMarkdown(task: ChronicleTask): string {
    const fm: Record<string, unknown> = {
      id:                    task.id,
      title:                 task.title,
      "location":            task.location ?? null,
      status:                task.status,
      priority:              task.priority,
      tags:                  task.tags,
      projects:              task.projects,
      "linked-notes":        task.linkedNotes,
      "list-id":             task.listId ?? null,
      "due-date":            task.dueDate ?? null,
      "due-time":            task.dueTime ?? null,
      recurrence:            task.recurrence ?? null,
      "alert":               task.alert ?? "none",
      "time-estimate":       task.timeEstimate ?? null,
      "time-entries":        task.timeEntries,
      "custom-fields":       task.customFields,
      "completed-instances": task.completedInstances,
      "created-at":          task.createdAt,
      "completed-at":        task.completedAt ?? null,
    };

    const yaml = Object.entries(fm)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join("\n");

    const body = task.notes ? `\n${task.notes}` : "";
    return `---\n${yaml}\n---\n${body}`;
  }

  private async fileToTask(file: TFile): Promise<ChronicleTask | null> {
    try {
      const cache = this.app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter;
      if (!fm?.id || !fm?.title) return null;

      const content = await this.app.vault.read(file);
      const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
      const notes = bodyMatch?.[1]?.trim() || undefined;

      return {
        id:                 fm.id,
        title:              fm.title,
        location:           fm.location ?? undefined,
        status:             (fm.status as TaskStatus) ?? "todo",
        priority:           (fm.priority as TaskPriority) ?? "none",
        dueDate:            fm["due-date"] ?? undefined,
        dueTime:            fm["due-time"] ?? undefined,
        recurrence:         fm.recurrence ?? undefined,
        alert:              (fm.alert as AlertOffset) ?? "none",
        // read new list-id; fall back to legacy calendar-id so old tasks still show their list
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

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private findFileForTask(id: string): TFile | null {
    const folder = this.app.vault.getFolderByPath(this.tasksFolder);
    if (!folder) return null;
    for (const child of folder.children) {
      if (!(child instanceof TFile)) continue;
      const cache = this.app.metadataCache.getFileCache(child);
      if (cache?.frontmatter?.id === id) return child;
    }
    return null;
  }

  private async ensureFolder(): Promise<void> {
    if (!this.app.vault.getFolderByPath(this.tasksFolder)) {
      await this.app.vault.createFolder(this.tasksFolder);
    }
  }

  private generateId(): string {
    return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  private todayStr(): string {
    return new Date().toISOString().split("T")[0];
  }
}
