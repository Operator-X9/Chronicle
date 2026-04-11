import { ChronicleCalendar } from "../types";

export class CalendarManager {
  private calendars: ChronicleCalendar[];
  private onUpdate: () => void;

  constructor(calendars: ChronicleCalendar[], onUpdate: () => void) {
    this.calendars = calendars;
    this.onUpdate = onUpdate;
  }

  getAll(): ChronicleCalendar[] {
    return [...this.calendars];
  }

  getById(id: string): ChronicleCalendar | undefined {
    return this.calendars.find((c) => c.id === id);
  }

  create(name: string, color: string): ChronicleCalendar {
    const calendar: ChronicleCalendar = {
      id: this.generateId(name),
      name,
      color,
      isVisible: true,
      createdAt: new Date().toISOString(),
    };
    this.calendars.push(calendar);
    this.onUpdate();
    return calendar;
  }

  update(id: string, changes: Partial<ChronicleCalendar>): void {
    const idx = this.calendars.findIndex((c) => c.id === id);
    if (idx === -1) return;
    this.calendars[idx] = { ...this.calendars[idx], ...changes };
    this.onUpdate();
  }

  delete(id: string): void {
    const idx = this.calendars.findIndex((c) => c.id === id);
    if (idx !== -1) this.calendars.splice(idx, 1);
    this.onUpdate();
  }

  toggleVisibility(id: string): void {
    const cal = this.calendars.find((c) => c.id === id);
    if (cal) {
      cal.isVisible = !cal.isVisible;
      this.onUpdate();
    }
  }

  static colorToHex(color: string): string {
    // If already a hex value, return it directly
    if (color.startsWith("#")) return color;

    // Legacy named color map
    const map: Record<string, string> = {
      blue:   "#378ADD",
      green:  "#34C759",
      purple: "#AF52DE",
      orange: "#FF9500",
      red:    "#FF3B30",
      teal:   "#30B0C7",
      pink:   "#FF2D55",
      yellow: "#FFD60A",
      gray:   "#8E8E93",
    };
    return map[color] ?? "#378ADD";
  }

  private generateId(name: string): string {
    const base = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
  }
}