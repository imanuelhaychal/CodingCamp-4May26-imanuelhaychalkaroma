# Design Document

## Overview

The personal dashboard is a single-page web application built with HTML, CSS, and Vanilla JavaScript. It runs entirely in the browser with no backend — all state is persisted via the browser's Local Storage API. The app is structured as a single `index.html` file, one stylesheet (`css/style.css`), and one JavaScript module (`js/app.js`).

The dashboard hosts four widgets arranged in a responsive grid:

- **Greeting Widget** — displays current time, date, and a time-based greeting
- **Focus Timer** — a 25-minute Pomodoro countdown with start/stop/reset controls
- **To-Do List** — task management with add, edit, complete, and delete operations
- **Quick Links** — user-defined URL shortcuts that open in new tabs

All four widgets are rendered on a single viewport (1280×720 or larger) without scrolling. The design prioritizes simplicity: no build tools, no dependencies, no frameworks.

---

## Architecture

The app follows a **widget-per-module** pattern within a single JavaScript file. Each widget is an isolated object with its own state, DOM references, and event handlers. A shared `Storage` utility handles all Local Storage reads and writes. A top-level `init()` function bootstraps all widgets on `DOMContentLoaded`.

```
index.html
├── css/style.css          (all styling)
└── js/app.js              (all behavior)
    ├── Storage             (read/write Local Storage)
    ├── GreetingWidget      (time, date, greeting)
    ├── FocusTimer          (countdown logic, controls)
    ├── TodoList            (task CRUD, persistence)
    └── QuickLinks          (link CRUD, persistence)
```

**Data flow:**

```
User interaction → Widget event handler → Update in-memory state
                                        → Re-render DOM
                                        → Storage.save(key, data)

Page load → Storage.load(key) → Widget.init(data) → Render DOM
```

No global mutable state is shared between widgets. Each widget owns its data array and exposes only the methods needed by event handlers.

**Timer implementation:** `setInterval` drives the Focus Timer countdown (1-second ticks). The interval reference is stored in the widget's closure so it can be cleared on stop/reset. The Greeting Widget uses a separate `setInterval` (60-second ticks) to update the displayed time.

---

## Components and Interfaces

### Storage Utility

Responsible for all Local Storage interaction. Wraps `JSON.stringify`/`JSON.parse` and catches malformed data.

```js
Storage = {
  save(key, value)       // JSON.stringify(value) → localStorage.setItem(key, ...)
  load(key, fallback)    // JSON.parse(localStorage.getItem(key)) → value | fallback
                         // Returns fallback on missing key or JSON parse error
}
```

Keys used:
- `"pd_tasks"` — task list array
- `"pd_links"` — link list array

### GreetingWidget

```js
GreetingWidget = {
  init()          // Render immediately, start 60s interval
  render()        // Update time, date, greeting text in DOM
  getGreeting(hour: number): string  // Pure function: hour → greeting string
  formatTime(date: Date): string     // Pure function: Date → "HH:MM"
  formatDate(date: Date): string     // Pure function: Date → "Weekday, Month D, YYYY"
}
```

### FocusTimer

```js
FocusTimer = {
  init()          // Render initial state (25:00), bind controls
  start()         // Begin setInterval, update button states
  stop()          // Clear interval, update button states
  reset()         // Clear interval, restore 25:00, update button states
  tick()          // Decrement seconds, check for 00:00, re-render
  render()        // Update MM:SS display and button disabled states
  formatTime(totalSeconds: number): string  // Pure: seconds → "MM:SS"
}
```

Internal state:
- `totalSeconds: number` — remaining seconds (starts at 1500)
- `intervalId: number | null` — active interval reference
- `running: boolean`

### TodoList

```js
TodoList = {
  init()                          // Load from Storage, render
  addTask(text: string)           // Create Task, push to array, save, render
  editTask(id: string, text: string)  // Update task text, save, render
  toggleTask(id: string)          // Flip completed flag, save, render
  deleteTask(id: string)          // Remove from array, save, render
  save()                          // Storage.save("pd_tasks", tasks)
  render()                        // Re-render full task list DOM
  renderTask(task: Task): HTMLElement  // Build DOM node for one task
}
```

### QuickLinks

```js
QuickLinks = {
  init()                              // Load from Storage, render
  addLink(label: string, url: string) // Create Link, push to array, save, render
  deleteLink(id: string)              // Remove from array, save, render
  save()                              // Storage.save("pd_links", links)
  render()                            // Re-render full links DOM
  renderLink(link: Link): HTMLElement // Build DOM node for one link
}
```

---

## Data Models

### Task

```js
{
  id: string,          // crypto.randomUUID() or Date.now().toString()
  text: string,        // Non-empty task description
  completed: boolean   // false = incomplete, true = complete
}
```

### Link

```js
{
  id: string,    // crypto.randomUUID() or Date.now().toString()
  label: string, // Non-empty display label
  url: string    // Non-empty URL string (user-provided, not validated beyond non-empty)
}
```

### Storage Schema

Both arrays are stored as JSON strings under their respective keys:

```
localStorage["pd_tasks"] = JSON.stringify(Task[])
localStorage["pd_links"] = JSON.stringify(Link[])
```

On load, if the key is absent or the value is not valid JSON, the widget initializes with `[]`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting message covers all hours

*For any* hour value in the range 0–23, `getGreeting(hour)` SHALL return exactly one of "Good morning", "Good afternoon", "Good evening", or "Good night" — and the result SHALL be consistent with the time-of-day ranges defined in Requirements 1.3–1.6.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

### Property 2: Timer format round-trip

*For any* integer number of seconds in the range 0–1500, `FocusTimer.formatTime(seconds)` SHALL return a string in "MM:SS" format where parsing the minutes and seconds back to total seconds yields the original value.

**Validates: Requirements 2.6**

### Property 3: Task list addition grows the list

*For any* task list state and any non-empty task text, calling `addTask(text)` SHALL result in the task list length increasing by exactly one, and the new task SHALL appear in the list with the provided text and `completed: false`.

**Validates: Requirements 3.2**

### Property 4: Whitespace-only task text is rejected

*For any* string composed entirely of whitespace characters, calling `addTask(text)` SHALL leave the task list unchanged.

**Validates: Requirements 3.3**

### Property 5: Task edit preserves identity

*For any* task in the list and any non-empty replacement text, calling `editTask(id, text)` SHALL update only that task's `text` field, leaving its `id`, `completed` state, and all other tasks unchanged.

**Validates: Requirements 4.2**

### Property 6: Completion toggle is an involution

*For any* task, calling `toggleTask(id)` twice in succession SHALL return the task to its original `completed` state (round-trip / involution property).

**Validates: Requirements 5.1, 5.2**

### Property 7: Task list serialization round-trip

*For any* valid task list (array of Task objects), serializing it to JSON and deserializing it SHALL produce an array that is deeply equal to the original — same length, same `id`, `text`, and `completed` values for every element.

**Validates: Requirements 6.3**

### Property 8: Link list serialization round-trip

*For any* valid link list (array of Link objects), serializing it to JSON and deserializing it SHALL produce an array that is deeply equal to the original — same length, same `id`, `label`, and `url` values for every element.

**Validates: Requirements 8.7**

### Property 9: Storage load is the inverse of save

*For any* valid data value (task list or link list), calling `Storage.save(key, value)` followed immediately by `Storage.load(key, fallback)` SHALL return a value deeply equal to the original.

**Validates: Requirements 6.1, 8.5**

### Property 10: Malformed storage falls back gracefully

*For any* key whose stored value is not valid JSON, `Storage.load(key, fallback)` SHALL return the fallback value without throwing an exception.

**Validates: Requirements 10.4**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage.getItem` returns `null` (key absent) | `Storage.load` returns the provided fallback (`[]`) |
| `localStorage.getItem` returns malformed JSON | `JSON.parse` is wrapped in `try/catch`; returns fallback |
| `localStorage.setItem` throws (storage quota exceeded) | Caught silently; in-memory state remains correct |
| Task/link add with empty or whitespace-only input | Rejected in the widget before any state mutation; input kept focused |
| Task edit confirmed with empty/whitespace value | Rejected; edit input kept focused |
| `crypto.randomUUID` unavailable (very old browsers) | Falls back to `Date.now().toString() + Math.random()` for ID generation |
| Timer reaches 00:00 | `clearInterval` called; start button re-enabled; stop button disabled |

No unhandled exceptions should propagate to the browser console during normal use or on first load with empty storage.

---

## Testing Strategy

### Approach

Because this project uses no build tools or test framework setup, tests are written as a **self-contained test file** (`tests/tests.js`) that can be opened directly in a browser or run with a simple script tag. The test file uses a minimal hand-rolled assertion helper (no external dependencies) and exercises the pure functions and storage logic extracted from `js/app.js`.

Property-based testing is applicable here because several core functions are pure (no DOM, no side effects) and have well-defined universal properties across their input spaces. A lightweight property-based approach is implemented inline: each property test runs a generator loop for a configurable number of iterations (minimum 100).

### What Is Tested

**Unit / Example tests** (specific inputs, concrete assertions):
- `getGreeting` returns correct string for boundary hours (0, 5, 12, 18, 21, 23)
- `FocusTimer.formatTime` returns `"25:00"` for 1500 seconds, `"00:00"` for 0
- `addTask` with a valid string adds one item
- `addTask` with `""` and `"   "` does not add an item
- `editTask` updates text without changing id or completed
- `toggleTask` flips completed state
- `deleteTask` removes the correct item
- `addLink` / `deleteLink` behave symmetrically
- `Storage.load` returns fallback for missing key and for malformed JSON

**Property tests** (generator loop, 100+ iterations each):
- **Feature: personal-dashboard, Property 1:** `getGreeting(hour)` returns a valid greeting for every hour 0–23
- **Feature: personal-dashboard, Property 2:** `formatTime(seconds)` round-trips for all seconds 0–1500
- **Feature: personal-dashboard, Property 3:** `addTask` with random non-empty text grows list by 1 and contains the text
- **Feature: personal-dashboard, Property 4:** `addTask` with random whitespace-only strings leaves list unchanged
- **Feature: personal-dashboard, Property 5:** `editTask` with random non-empty text updates only the target task
- **Feature: personal-dashboard, Property 6:** `toggleTask` twice returns task to original completed state
- **Feature: personal-dashboard, Property 7:** Task list JSON round-trip preserves all fields
- **Feature: personal-dashboard, Property 8:** Link list JSON round-trip preserves all fields
- **Feature: personal-dashboard, Property 9:** `Storage.save` then `Storage.load` returns original value
- **Feature: personal-dashboard, Property 10:** `Storage.load` with malformed JSON returns fallback without throwing

### Test File Structure

```
tests/
  tests.js    (self-contained; no external dependencies)
```

The test file exports a results summary to the browser console and optionally renders a pass/fail table in a `<div id="test-results">` element if present in the page.

### What Is Not Tested

- DOM rendering and layout (visual correctness requires manual inspection)
- Timer interval behavior (requires real-time execution; covered by manual testing)
- Cross-browser compatibility (covered by manual testing in Chrome, Firefox, Edge, Safari)
- WCAG contrast ratios (requires manual or tool-assisted audit)
