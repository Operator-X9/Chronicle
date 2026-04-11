# PROJECT_CONTEXT.md — Chronicle Plugin Context

This file captures the architecture, design decisions, and full context for the
Chronicle Obsidian plugin. Read this before making any changes to the codebase.

---

## What Chronicle is

Chronicle is a from-scratch Obsidian plugin that replicates the look and
functionality of Apple Calendar and Apple Reminders — built for users who want
Obsidian to be their "everything app" for reminders and calendar events.

It is **not** a fork of TaskNotes (callumalpass/tasknotes), though that plugin
was evaluated as a starting point. The decision to start from scratch was made
because TaskNotes's UI and data layers are tightly coupled, its modal-based UI
is fundamentally incompatible with the Apple design language, and the
Calendars-as-contexts system required root-level architectural changes that
would have meant replacing essentially every file anyway.

---

## Core design goals

1. **Two separate but connected systems** — Reminders and Events are distinct types.
   A Reminder is something to DO (has completion state). An Event is something that
   HAPPENS at a time (no completion, has a time slot on the calendar).

2. **Lists as first-class contexts** — Lists (Work, Church, Personal, Family, etc.)
   are full contexts with their own color and visibility.
   Calendars serve the same role for Events.

3. **Apple design language** — The UI targets the aesthetic and interaction
   patterns of macOS Apple Calendar and Apple Reminders specifically:
   - Persistent sidebar + main content layout
   - Smart list tiles (Today, Scheduled, All, Flagged) in the Reminders style
   - Colored calendar dots in the sidebar
   - Event pills in a time grid
   - Popup modal for quick creation, expand button opens full-page form
   - Reminders grouped by Today / This Week / Later

4. **Open source, MIT licensed** — https://github.com/Operator-X9/Chronicle

---

## File naming conventions

- **Reminders:** Title only — `Buy groceries.md`
- **Events:** Title only — `Team standup.md`

All metadata lives in frontmatter, never in filenames.

Default folder locations (configurable in settings):
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

Note: `contexts` field has been removed and is no longer used.
Note: Custom fields UI has been removed. The field still exists in the type
for backwards compatibility but is no longer exposed in the UI.

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

Note: `notes` field is only shown in the full-page form, not the popup modal.

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
4. Both save via their respective Manager classes

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
Only shown in full-page forms, not popups. This is intentional.

---

## Shared utilities

### `src/utils/formatters.ts`
Central location for all date/time/status formatting. Eliminates duplication
that previously existed across 6+ files.

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
Central location for all option arrays used in forms, modals, and settings.
Eliminates copy-pasted arrays that previously appeared in 4+ files.

Exports:
- `ALERT_OPTIONS` — `{ value: AlertOffset, label: string }[]`
- `RECURRENCE_OPTIONS` — `{ value: string, label: string }[]`
- `STATUS_OPTIONS` — `{ value: ReminderStatus, label: string }[]`
- `PRIORITY_OPTIONS` — `{ value: ReminderPriority, label: string }[]`
- `SOUND_OPTIONS` — macOS system sound names

---

## Alert system (AlertManager)

- Polls every 30 seconds via `window.setInterval`
- Also re-checks immediately when any relevant file changes via `metadataCache`
- First check is delayed 3 seconds after startup to let vault load
- Fired alerts tracked in `firedAlerts: Set<string>` (session only, resets on restart)
- Alert key format: `event-{id}-{startDate}-{alert}` / `reminder-{id}-{dueDate}-{alert}`
- Window: 5 minutes (fires if within 5 min past the alert time)
- Reminders with no dueDate but with dueTime use today's date

### Notification channels (all configurable in settings)
1. **macOS native** — via `osascript` (most reliable, works in background)
3. **Sound** — two-tone chime via Web Audio API (880Hz + 1108Hz)

### CalendarManager.colorToHex
Now accepts both hex values (pass-through) and legacy named colors.
Calendars created after the color picker update store hex values directly.

---

## Settings page (SettingsTab.ts)

Opens inside Obsidian's native settings panel (gear icon → Chronicle).
Four horizontal tabs matching Obsidian's native tab style:

- **General** — folder paths, time format, notification channel toggles, test button
- **Calendar** — start of week, default view, default calendar, event duration,
  event alert, calendar management (add/rename/recolor/delete). No colored dot
  shown next to calendar rows (removed as redundant).
- **Reminders** — default status/priority/alert/list, smart list visibility.
  Smart List Visibility section: per-tile color picker + show/hide toggle for each
  tile (Today, Scheduled, All, Completed). No colored dot shown next to rows
  (removed as redundant). "Show Flagged List" toggle was removed.
- **Appearance** — density, show/hide subtitle and completed count

---

## Auto-refresh pattern

Both ReminderView and CalendarView use `metadataCache.on("changed")` to
auto-refresh when any file in their respective folders changes. This is the
correct Obsidian pattern — it fires after frontmatter is fully parsed so data
is always fresh.

Direct `this.render()` calls after write operations have been removed from most
handlers to avoid double-renders and race conditions. The metadataCache listener
handles all re-renders automatically.

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

After deploying: toggle Chronicle off then on in Obsidian Settings →
Community plugins to reload.

---

## Build phases

### Phase 1 — Data layer ✅
Types, managers, plugin shell.

### Phase 2 — Reminder dashboard ✅
Smart list tiles, sidebar, reminder cards, auto-refresh, completed archive.

### Phase 3 — Calendar view ✅
Day/Week/Month/Year, all-day shelf, recurrence expansion, auto-refresh.

### Phase 4 — Creation forms ✅
Reminder modal + full-page form. Event modal + full-page form.
Expand button on both modals. Delete from modals and context menus.

### Phase 5 — Alerts ✅
macOS notifications (osascript), Obsidian toast, two-tone chime.
Per-channel and per-type toggles in settings.

### Phase 6 — Settings page ✅
Four-tab settings panel inside Obsidian native settings.
Calendar and List management with custom color picker.

### Phase 7 — Polish pass ✅
- Completed smart list tile (moved from sidebar row into the smart list tile grid)
- Smart list visibility toggles wired to actual show/hide behavior
- Drag-to-reorder smart list tiles (HTML5 drag-and-drop, persisted to settings)
- Per-tile color pickers in settings Smart List Visibility section
- Smart list and regular list title text always `var(--text-normal)` (not tile color)
- Rounded corners on both Reminders and Calendar main panes
- Full theme compatibility: entire CSS rewritten to use Obsidian CSS variables
  (colors, fonts, border-radius, interactive states — responds to themes and accent color)
- "New Reminder" button uses `--interactive-normal` (matches all other plugin buttons)
- Removed redundant colored dots from My Lists, My Calendars, and Smart List rows in settings
- "Show Flagged List" toggle removed from settings
- **Codebase refactor:** extracted `src/utils/formatters.ts` and `src/utils/constants.ts`
  to eliminate duplication across 6+ files. Net: −110 lines. Task pills in CalendarView
  now use CSS classes instead of hardcoded hex colors for full theme compatibility.
- Verbose `console.log` statements removed from AlertManager.
- `CalendarColor` type alias removed (was just `string`); `colorToHex()` signature updated.
- Fixed redundant null-coalescing bug in EventManager frontmatter read.
- `description` field removed from `ChronicleCalendar` interface.
- Unused CSS classes removed from `styles/main.css`.
- Beta release 0.1.0 published to GitHub (compatible with manual install and BRAT).

### Phase 8 — Remaining (not yet built)
- Events linking to reminders (action items for a meeting) — UI wired in EventFormView,
  data field `linkedReminderIds` exists; full bidirectional sync not yet implemented.

---

## Key technical decisions

**CalendarColor removed** — previously a union type of named colors, now just `string`
(hex values from color picker). `colorToHex()` still handles legacy named colors for
backwards compatibility with older saved data.

**RRULE for recurrence** — both reminders and events use RRULE standard.
`EventManager.getInRangeWithRecurrence()` expands recurring events into
individual occurrences for a given date range before rendering.

**Contexts removed** — the `contexts` field has been removed from the UI
entirely. The field may still exist in older files but is ignored.

**Notes popup exclusion** — notes field intentionally excluded from popup
modals. Only available in full-page forms. This keeps the popup lightweight.

**esbuild context API** — uses `esbuild.context()` + `context.watch()` instead
of the deprecated `build({ watch: true })` pattern. Required for esbuild 0.17+.

**Smart list tiles are data-driven** — built from an `allTiles` map keyed by id
(`today`, `scheduled`, `all`, `flagged`, `completed`). Order comes from
`settings.smartListOrder`, colors from `settings.smartListColors`, visibility
from per-list boolean flags. Drag-and-drop reorders `smartListOrder` and saves.

**Theme compatibility via CSS variables** — `styles/main.css` uses no hardcoded
colors or fonts. All values come from Obsidian's CSS custom properties:
`--color-red/green/orange`, `--interactive-accent`, `--text-on-accent`,
`--font-interface`, `--radius-s/m/l`, `--background-primary/secondary`,
`--text-normal/muted/faint`, `--interactive-normal/hover`. Alpha variants use
`color-mix(in srgb, var(--color-X) N%, transparent)` — supported in Obsidian's
Chromium/Electron. Tile count/label text and toggle thumbs intentionally keep
`#fff` as they are on user-set or semantic backgrounds.

**Layout rounded corners** — `.chronicle-layout` / `.chronicle-cal-layout` have
`background: var(--background-secondary)` and `padding: 8px 8px 8px 0`. The
main pane has `border-radius: var(--radius-m)`, making the secondary color show
as a backdrop — mirroring how the Obsidian settings modal works.

**`experimental` branch** — created for testing major changes. Merges back to
`main` via `git checkout main && git merge experimental && git push`.

**Shared utils pattern** — all formatting logic lives in `src/utils/formatters.ts`
and all option arrays live in `src/utils/constants.ts`. Never duplicate these in
individual views, modals, or settings files.

---

## The user / project owner

- On macOS, using VS Code
- Has Node 24, npm 11, Git 2.50
- GitHub: https://github.com/Operator-X9/Chronicle
- Goal: a personal "everything app" inside Obsidian — reminders and calendar —
  that feels native and polished, not like a developer tool
