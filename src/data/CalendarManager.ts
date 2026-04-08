import { ChronicleCalendar, CalendarColor } from "../types";

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

  create(name: string, color: CalendarColor): ChronicleCalendar {
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
    this.calendars = this.calendars.filter((c) => c.id !== id);
    this.onUpdate();
  }

  toggleVisibility(id: string): void {
    const cal = this.calendars.find((c) => c.id === id);
    if (cal) {
      cal.isVisible = !cal.isVisible;
      this.onUpdate();
    }
  }

  // Returns CSS hex color for a CalendarColor name
  static colorToHex(color: CalendarColor): string {
    const map: Record<CalendarColor, string> = {
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
    return map[color];
  }

  private generateId(name: string): string {
    const base = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
  }
}