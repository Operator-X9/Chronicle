import { ChronicleList } from "../types";

export class ListManager {
  private lists: ChronicleList[];
  private onUpdate: () => void;

  constructor(lists: ChronicleList[], onUpdate: () => void) {
    this.lists    = lists;
    this.onUpdate = onUpdate;
  }

  getAll(): ChronicleList[] {
    return [...this.lists];
  }

  getById(id: string): ChronicleList | undefined {
    return this.lists.find((l) => l.id === id);
  }

  create(name: string, color: string): ChronicleList {
    const list: ChronicleList = {
      id:        this.generateId(name),
      name,
      color,
      createdAt: new Date().toISOString(),
    };
    this.lists.push(list);
    this.onUpdate();
    return list;
  }

  update(id: string, changes: Partial<ChronicleList>): void {
    const idx = this.lists.findIndex((l) => l.id === id);
    if (idx === -1) return;
    this.lists[idx] = { ...this.lists[idx], ...changes };
    this.onUpdate();
  }

  delete(id: string): void {
    const idx = this.lists.findIndex((l) => l.id === id);
    if (idx !== -1) this.lists.splice(idx, 1);
    this.onUpdate();
  }

  private generateId(name: string): string {
    const base   = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
  }
}
