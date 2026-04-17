# PROJECT_CONTEXT.md — Chronicle Plugin Context

Read before making changes.

---

## What Chronicle is

Chronicle: from-scratch Obsidian plugin replicating Apple Calendar + Apple Reminders. For users who want Obsidian as "everything app" for reminders + calendar events.

Not fork of TaskNotes (callumalpass/tasknotes) — evaluated but rejected. TaskNotes UI/data tightly coupled, modal-based UI incompatible with Apple design language, Calendars-as-contexts required root-level arch changes replacing essentially every file anyway.

---

## Core design goals

1. **Two separate but connected systems** — Reminders = things to DO (completion state). Events = things that HAPPEN at time (no completion, time slot on calendar).

2. **Lists as first-class contexts** — Lists (Work, Church, Personal, Family) have own color + visibility. Calendars serve same role for Events.

3. **Apple design language** — UI targets macOS Apple Calendar + Reminders aesthetic:
   - Persistent sidebar + main content layout
   - Smart list tiles (Today, Scheduled, All, Flagged) in Reminders style
   - Colored calendar dots in sidebar
   - Event pills in time grid
   - Popup modal for quick creation, expand button opens full-page form
   - Reminders grouped by Today / This Week / Later

4. **Open source, MIT licensed** — https://github.com/Operator-X9/Chronicle

---

## File naming conventions

- **Reminders:** Title only — `Buy groceries.md`
- **Events:** Title only — `Team standup.md`

All metadata in frontmatter, never in filenames.

Default folders (configurable):
- Reminders → `Chronicle/Reminders/`
- Events → `Chronicle/Events/`

---

## Source structure

```
Chronicle/
├── src/
│   ├── main.ts                        Plugin entry point
│   ├── types/
│   │   └── index.ts                   All TypeScript interfaces + DEFAULT_SETTINGS
│   ├── data/
│   │   ├── CalendarManager.ts         CRUD for calendars (in-memory, saved to settings)
│   │   ├── ListManager.ts             CRUD for reminder lists (in-memory, saved to settings)
│   │   ├── ReminderManager.ts         CRUD for reminders (.md files in vault)
│   │   ├── EventManager.ts            CRUD for events (.md files in vault)
│   │   └── AlertManager.ts            Polls for due alerts, fires notifications
│   ├── ui/
│   │   ├── ReminderModal.ts           Quick-create/edit popup for reminders
│   │   ├── ReminderDetailPopup.ts     Detail/edit popup for existing reminders
│   │   ├── EventModal.ts              Quick-create/edit popup for events
│   │   ├── EventDetailPopup.ts        Detail/edit popup for existing events
│   │   ├── tagField.ts                Shared tag input component
│   │   └── SettingsTab.ts             Obsidian settings panel (4 tabs)
│   ├── utils/
│   │   ├── formatters.ts              Shared formatting functions (date, time, status, etc.)
│   │   └── constants.ts               Shared option arrays (ALERT_OPTIONS, STATUS_OPTIONS, etc.)
│   └── views/
│       ├── ReminderView.ts            Reminder dashboard (smart lists, sidebar, cards)
│       ├── ReminderFormView.ts        Full-page reminder creation/editing form
│       ├── CalendarView.ts            Calendar (day/week/month/year)
│       └── EventFormView.ts           Full-page event creation/editing form
├── styles/
│   └── main.css                       All plugin CSS
├── manifest.json
├── versions.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
└── PROJECT_CONTEXT.md
```

---

## Data model

### ChronicleCalendar (stored in plugin settings, not vault files)

```
id           string        — generated from name + timestamp
name         string
color        string        — hex value (e.g. "#378ADD") or legacy named color
isVisible    boolean       — toggled in sidebar
createdAt    string        — ISO 8601
```

### ChronicleList (stored in plugin settings, not vault files)

```
id           string        — generated from name + timestamp
name         string
color        string        — hex value
createdAt    string        — ISO 8601
```

### ChronicleReminder (frontmatter field names)

```
id                   string     — "reminder-{timestamp36}-{random4}"
title                string
status               "todo" | "in-progress" | "done" | "cancelled"
priority             "none" | "low" | "medium" | "high"
location             string?
dueDate              YYYY-MM-DD?
dueTime              HH:mm?
recurrence           RRULE string?
alert                AlertOffset
listId               string?
tags                 string[]
projects             string[]
linkedNotes          string[]
timeEntries          {startTime: ISO, endTime?: ISO}[]
customFields         {key: string, value: string|number|boolean}[]
completedInstances   string[]   — YYYY-MM-DD, for recurring reminders
notes                string?
createdAt            ISO 8601
completedAt          ISO 8601?
```

`contexts` field removed, no longer used.
Custom fields UI removed. Field kept in type for backwards compat, not exposed in UI.

### ChronicleEvent (frontmatter field names, in creation form order)

```
id                   string     — "event-{timestamp36}-{random4}"
title                string
location             string?
allDay               boolean
startDate            YYYY-MM-DD
startTime            HH:mm?
endDate              YYYY-MM-DD
endTime              HH:mm?
recurrence           RRULE string?
calendarId           string?
alert                AlertOffset
tags                 string[]
linkedNotes          string[]
linkedReminderIds    string[]
completedInstances   string[]
notes                string?
createdAt            ISO 8601
```

`notes` field only in full-page form, not popup modal.

### AlertOffset type

```
"none" | "at-time" | "5min" | "10min" | "15min" | "30min"
| "1hour" | "2hours" | "1day" | "2days" | "1week"
```

---

## ChronicleSettings (all fields)

```typescript
remindersFolder:       string           // "Chronicle/Reminders"
eventsFolder:          string           // "Chronicle/Events"
calendars:             ChronicleCalendar[]
lists:                 ChronicleList[]
defaultCalendarId:     string
defaultListId:         string
defaultReminderStatus: ReminderStatus
defaultReminderPriority: ReminderPriority
defaultAlert:          AlertOffset
startOfWeek:           0 | 1 | 6       // 0=Sun, 1=Mon, 6=Sat
timeFormat:            "12h" | "24h"
defaultCalendarView:   "day"|"week"|"month"|"year"
showTodayList:         boolean
showScheduledList:     boolean
showAllList:           boolean
showFlaggedList:       boolean
showCompletedList:     boolean
smartListOrder:        string[]         // drag-to-reorder persistence
smartListColors:       Record<string, string>  // per-tile hex color
notifMacOS:            boolean          // Native macOS notification
notifObsidian:         boolean          // In-app Obsidian toast
notifSound:            boolean          // Two-tone chime
notifEvents:           boolean          // Alerts for events
notifReminders:        boolean          // Alerts for reminders
defaultEventDuration:  number           // minutes
density:               "compact"|"comfortable"
showTaskCountSubtitle: boolean
defaultCustomFields:   {key, type}[]    // Reserved, UI removed
```

---

## UI patterns

### Creation/editing flow (both reminders and events)
1. Default: popup modal opens (ReminderModal / EventModal)
2. Expand button (⤢) in modal header → closes modal, opens full-page form tab
3. Full-page form: ReminderFormView / EventFormView
4. Both save via respective Manager classes

### Reminder popup (ReminderModal) fields
title, location, status, priority, date, time, list, repeat, alert, tags

### Reminder full-page form (ReminderFormView) fields
All popup fields + linked notes, notes, tags

### Event popup (EventModal) fields
title, location, all-day toggle, start date, end date, start time, end time,
repeat, calendar, alert, tags

### Event full-page form (EventFormView) fields
All popup fields + linked notes, linked reminders, notes

### Notes field
Only in full-page forms, not popups. Intentional.

---

## Shared utilities

### `src/utils/formatters.ts`
Central date/time/status formatting. Eliminates duplication across 6+ files.

Exports:
- `formatDateFull(dateStr)` — "Mon, Apr 11, 2026"
- `formatDateRelative(dateStr)` — "Today" / "Tomorrow" / "Apr 11"
- `formatTime12(timeStr)` — "9:00 AM"
- `formatTime(timeStr, format)` — routes to 12h or 24h
- `formatHour12(h)` — "9 AM", "12 PM"
- `formatRecurrence(rrule)` — "Every week"
- `formatAlert(alert)` — "15 minutes before"
- `formatStatus(s)` — "In Progress"
- `formatPriority(p)` — "High priority"
- `formatDuration(minutes)` — "1 hr 30 min"
- `todayStr()` — current date as "YYYY-MM-DD"

### `src/utils/constants.ts`
Central option arrays for forms, modals, settings. Eliminates duplication across 4+ files.

Exports:
- `ALERT_OPTIONS` — `{ value: AlertOffset, label: string }[]`
- `RECURRENCE_OPTIONS` — `{ value: string, label: string }[]`
- `STATUS_OPTIONS` — `{ value: ReminderStatus, label: string }[]`
- `PRIORITY_OPTIONS` — `{ value: ReminderPriority, label: string }[]`
- `SOUND_OPTIONS` — macOS system sound names

---

## Alert system (AlertManager)

- Polls every 30 seconds via `window.setInterval`
- Re-checks immediately on file changes via `metadataCache`
- First check delayed 3 seconds after startup (let vault load)
- Fired alerts tracked in `firedAlerts: Set<string>` (session only, resets on restart)
- Alert key format: `event-{id}-{startDate}-{alert}` / `reminder-{id}-{dueDate}-{alert}`
- Window: 5 minutes (fires if within 5 min past alert time)
- Reminders with no dueDate but with dueTime use today's date

### Notification channels (configurable in settings)
1. **macOS native** — via `osascript` (most reliable, works in background)
2. **Sound** — two-tone chime via Web Audio API (880Hz + 1108Hz)

### CalendarManager.colorToHex
Accepts both hex values (pass-through) and legacy named colors. Calendars created after color picker update store hex directly.

---

## Settings page (SettingsTab.ts)

Inside Obsidian native settings panel (gear icon → Chronicle). Four horizontal tabs:

- **General** — folder paths, time format, notification channel toggles, test button
- **Calendar** — start of week, default view, default calendar, event duration, event alert, calendar management (add/rename/recolor/delete). No colored dot next to calendar rows (removed as redundant).
- **Reminders** — default status/priority/alert/list, smart list visibility. Per-tile color picker + show/hide toggle for each tile (Today, Scheduled, All, Completed). No colored dot next to rows. "Show Flagged List" toggle removed.
- **Appearance** — density, show/hide subtitle and completed count

---

## Auto-refresh pattern

Both ReminderView and CalendarView use `metadataCache.on("changed")` to auto-refresh when files in their folders change. Fires after frontmatter fully parsed — data always fresh.

Direct `this.render()` calls after write ops removed from most handlers to avoid double-renders + race conditions. metadataCache listener handles all re-renders.

---

## Tech stack

| Thing | Choice | Why |
|---|---|---|
| Language | TypeScript | Required for Obsidian plugins |
| Bundler | esbuild (context API) | Fast, watch mode via context.watch() |
| Date parsing | chrono-node v2 | Natural language input |
| Styling | Plain CSS | Obsidian CSS variables handle theming |

---

## Build & development

```bash
npm install
npm run dev          # watch mode
npm run build        # production build
./deploy.sh          # copy to Obsidian vault for testing
```

Vault location: `/Users/local_disk/Desktop/Chronicle/CORE Obsidian Vault Testing`
Plugin installs to: `.obsidian/plugins/chronicle/`

After deploying: toggle Chronicle off then on in Obsidian Settings → Community plugins to reload.

---

## Build phases

### Phase 1 — Data layer ✅
Types, managers, plugin shell.

### Phase 2 — Reminder dashboard ✅
Smart list tiles, sidebar, reminder cards, auto-refresh, completed archive.

### Phase 3 — Calendar view ✅
Day/Week/Month/Year, all-day shelf, recurrence expansion, auto-refresh.

### Phase 4 — Creation forms ✅
Reminder modal + full-page form. Event modal + full-page form. Expand button on both. Delete from modals and context menus.

### Phase 5 — Alerts ✅
macOS notifications (osascript), Obsidian toast, two-tone chime. Per-channel + per-type toggles in settings.

### Phase 6 — Settings page ✅
Four-tab settings panel inside Obsidian native settings. Calendar + List management with custom color picker.

### Phase 7 — Polish pass ✅
- Completed smart list tile (moved from sidebar row into smart list tile grid)
- Smart list visibility toggles wired to actual show/hide behavior
- Drag-to-reorder smart list tiles (HTML5 drag-and-drop, persisted to settings)
- Per-tile color pickers in settings Smart List Visibility section
- Smart list + regular list title text always `var(--text-normal)` (not tile color)
- Rounded corners on Reminders and Calendar main panes
- Full theme compat: CSS rewritten to use Obsidian CSS variables
- "New Reminder" button uses `--interactive-normal`
- Removed redundant colored dots from My Lists, My Calendars, Smart List rows in settings
- "Show Flagged List" toggle removed
- **Codebase refactor:** extracted `src/utils/formatters.ts` + `src/utils/constants.ts`. Net: −110 lines. Task pills in CalendarView use CSS classes instead of hardcoded hex.
- Removed verbose `console.log` from AlertManager
- `CalendarColor` type alias removed; `colorToHex()` signature updated
- Fixed redundant null-coalescing bug in EventManager frontmatter read
- `description` field removed from `ChronicleCalendar` interface
- Unused CSS classes removed from `styles/main.css`
- Beta release 0.1.0 published to GitHub (manual install + BRAT compatible)

### Phase 8 — Remaining (not yet built)


---

## Key technical decisions

**CalendarColor removed** — was union type of named colors, now just `string` (hex from color picker). `colorToHex()` still handles legacy named colors for backwards compat.

**RRULE for recurrence** — both reminders + events use RRULE standard. `EventManager.getInRangeWithRecurrence()` expands recurring events into individual occurrences for date range before rendering.

**Contexts removed** — `contexts` field removed from UI entirely. May still exist in older files but ignored.

**Notes popup exclusion** — notes field intentionally excluded from popup modals. Only in full-page forms. Keeps popup lightweight.

**esbuild context API** — uses `esbuild.context()` + `context.watch()` instead of deprecated `build({ watch: true })`. Required for esbuild 0.17+.

**Smart list tiles are data-driven** — built from `allTiles` map keyed by id (`today`, `scheduled`, `all`, `flagged`, `completed`). Order from `settings.smartListOrder`, colors from `settings.smartListColors`, visibility from per-list boolean flags. Drag-and-drop reorders `smartListOrder` and saves.

**Theme compat via CSS variables** — `styles/main.css` uses no hardcoded colors or fonts. All from Obsidian CSS custom properties: `--color-red/green/orange`, `--interactive-accent`, `--text-on-accent`, `--font-interface`, `--radius-s/m/l`, `--background-primary/secondary`, `--text-normal/muted/faint`, `--interactive-normal/hover`. Alpha variants use `color-mix(in srgb, var(--color-X) N%, transparent)`. Tile count/label text + toggle thumbs keep `#fff` (on user-set or semantic backgrounds).

**Layout rounded corners** — `.chronicle-layout` / `.chronicle-cal-layout` have `background: var(--background-secondary)` + `padding: 8px 8px 8px 0`. Main pane has `border-radius: var(--radius-m)`, secondary color shows as backdrop — mirrors Obsidian settings modal.

**`experimental` branch** — for testing major changes. Merges back to `main` via `git checkout main && git merge experimental && git push`.

**Shared utils pattern** — all formatting in `src/utils/formatters.ts`, all option arrays in `src/utils/constants.ts`. Never duplicate in individual views, modals, or settings files.

---

## Release format

Default body for all GitHub releases:

```
## Chronicle {version}

### Changes since {previous version}
- Example

### Manual installation
1. Download `main.js`, `manifest.json`, and `styles.css` from this release
2. Create folder `.obsidian/plugins/chronicle/` in your vault
3. Place all three files inside that folder
4. Enable Chronicle in Obsidian Settings → Community Plugins

### BRAT installation
1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat)
2. In BRAT settings click **Add Beta Plugin**
3. Enter: `https://github.com/Operator-X9/Chronicle`
4. Enable Chronicle in Community Plugins
```

---

## The user / project owner

- macOS, VS Code
- Node 24, npm 11, Git 2.50
- GitHub: https://github.com/Operator-X9/Chronicle
- Goal: personal "everything app" inside Obsidian — reminders + calendar — feels native and polished, not developer tool
