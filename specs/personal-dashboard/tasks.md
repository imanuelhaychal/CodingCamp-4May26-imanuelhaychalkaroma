# Implementation Plan: Personal Dashboard

## Overview

Build a single-page personal dashboard using HTML, CSS, and Vanilla JavaScript. The implementation is structured as incremental steps: project scaffold → shared utilities → each widget → integration → tests. All tasks involve creating or editing files only — no terminal commands are required.

## Tasks

- [x] 1. Create project scaffold and HTML structure
  - Create `index.html` with the full page structure: four widget sections (greeting, focus timer, to-do list, quick links), a `<div id="test-results">` element (hidden by default), and `<script src="js/app.js">` at the bottom
  - Create empty placeholder files: `css/style.css` and `js/app.js`
  - Create empty `tests/tests.js`
  - Each widget section should have a stable `id` attribute for DOM targeting
  - _Requirements: 9.2, 9.3_

- [x] 2. Implement base CSS layout and typography
  - Write `css/style.css` with a CSS Grid layout that places all four widgets on a single viewport (1280×720 or larger) without scrolling
  - Set base font size ≥ 14px and a consistent typographic scale
  - Ensure text/background color contrast meets WCAG AA (4.5:1 ratio for normal text)
  - Style widget cards, input fields, and buttons with a clean, minimal aesthetic
  - _Requirements: 9.1, 9.4, 9.5_

- [x] 3. Implement the Storage utility in `js/app.js`
  - Write the `Storage` object with `save(key, value)` and `load(key, fallback)` methods
  - `save` uses `JSON.stringify` + `localStorage.setItem`, wrapped in try/catch for quota errors
  - `load` uses `localStorage.getItem` + `JSON.parse`, returning `fallback` on missing key or malformed JSON
  - Define storage key constants: `"pd_tasks"` and `"pd_links"`
  - _Requirements: 6.1, 6.2, 8.5, 8.6, 10.2, 10.3, 10.4_

  - [ ]* 3.1 Write property test for Storage save/load round-trip (Property 9)
    - **Property 9: Storage load is the inverse of save**
    - **Validates: Requirements 6.1, 8.5**
    - In `tests/tests.js`, run 100+ iterations saving random task/link arrays and asserting `load` returns a deeply equal value

  - [ ]* 3.2 Write property test for Storage malformed JSON fallback (Property 10)
    - **Property 10: Malformed storage falls back gracefully**
    - **Validates: Requirements 10.4**
    - In `tests/tests.js`, inject malformed JSON strings directly into `localStorage` and assert `load` returns the fallback without throwing

- [x] 4. Implement the Greeting Widget in `js/app.js`
  - Write the `GreetingWidget` object with `init()`, `render()`, `getGreeting(hour)`, `formatTime(date)`, and `formatDate(date)` methods
  - `getGreeting` maps hour ranges to "Good morning" (5–11), "Good afternoon" (12–17), "Good evening" (18–20), "Good night" (21–4)
  - `formatTime` returns `"HH:MM"` (zero-padded)
  - `formatDate` returns a human-readable string (e.g., "Monday, July 14, 2025")
  - `init` calls `render()` immediately and starts a 60-second `setInterval` to call `render()` again
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 4.1 Write property test for greeting coverage (Property 1)
    - **Property 1: Greeting message covers all hours**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
    - In `tests/tests.js`, assert `getGreeting(hour)` returns a valid, correct greeting for every hour 0–23

  - [ ]* 4.2 Write unit tests for `getGreeting` boundary hours
    - Test hours 0, 4, 5, 11, 12, 17, 18, 20, 21, 23 return the expected greeting string
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

- [x] 5. Implement the Focus Timer in `js/app.js`
  - Write the `FocusTimer` object with `init()`, `start()`, `stop()`, `reset()`, `tick()`, `render()`, and `formatTime(totalSeconds)` methods
  - Internal state: `totalSeconds` (starts at 1500), `intervalId` (null when stopped), `running` (boolean)
  - `start` sets `running = true`, starts `setInterval(tick, 1000)`, calls `render()`
  - `stop` clears the interval, sets `running = false`, calls `render()`
  - `reset` clears the interval, sets `totalSeconds = 1500`, `running = false`, calls `render()`
  - `tick` decrements `totalSeconds`; if it reaches 0, calls `stop()`; always calls `render()`
  - `render` updates the MM:SS display and sets `disabled` on start/stop buttons per running state
  - `formatTime` converts total seconds to `"MM:SS"` (zero-padded)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 5.1 Write property test for timer format round-trip (Property 2)
    - **Property 2: Timer format round-trip**
    - **Validates: Requirements 2.6**
    - In `tests/tests.js`, for all integers 0–1500, assert `formatTime(s)` produces a string whose parsed MM and SS reconstruct the original seconds value

  - [ ]* 5.2 Write unit tests for `FocusTimer.formatTime`
    - Assert `formatTime(1500)` returns `"25:00"`, `formatTime(0)` returns `"00:00"`, `formatTime(90)` returns `"01:30"`
    - _Requirements: 2.6_

- [x] 6. Implement the To-Do List in `js/app.js`
  - Write the `TodoList` object with `init()`, `addTask(text)`, `editTask(id, text)`, `toggleTask(id)`, `deleteTask(id)`, `save()`, `render()`, and `renderTask(task)` methods
  - `init` calls `Storage.load("pd_tasks", [])`, stores the result, calls `render()`, and binds the add-task form submit handler
  - `addTask` trims input; rejects empty/whitespace-only strings (keeps input focused); otherwise creates a Task with `id` (via `crypto.randomUUID()` or fallback), `text`, `completed: false`; pushes to array; calls `save()` and `render()`
  - `editTask` finds the task by id; rejects empty/whitespace-only replacement text (keeps edit input focused); updates `text`; calls `save()` and `render()`
  - `toggleTask` flips the `completed` boolean; calls `save()` and `render()`
  - `deleteTask` removes the task by id; calls `save()` and `render()`
  - `renderTask` builds a DOM element with text display, completion toggle, edit control, and delete control; applies strikethrough styling when `completed` is true
  - Bind edit/cancel/confirm controls inline within `renderTask`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2_

  - [ ]* 6.1 Write property test for task addition grows list (Property 3)
    - **Property 3: Task list addition grows the list**
    - **Validates: Requirements 3.2**
    - In `tests/tests.js`, run 100+ iterations with random non-empty strings; assert list length increases by exactly 1 and new task has correct text and `completed: false`

  - [ ]* 6.2 Write property test for whitespace-only task rejection (Property 4)
    - **Property 4: Whitespace-only task text is rejected**
    - **Validates: Requirements 3.3**
    - In `tests/tests.js`, run 100+ iterations with random whitespace-only strings; assert list length is unchanged

  - [ ]* 6.3 Write property test for task edit preserves identity (Property 5)
    - **Property 5: Task edit preserves identity**
    - **Validates: Requirements 4.2**
    - In `tests/tests.js`, run 100+ iterations; assert `editTask` updates only the target task's `text`, leaving `id`, `completed`, and all other tasks unchanged

  - [ ]* 6.4 Write property test for completion toggle involution (Property 6)
    - **Property 6: Completion toggle is an involution**
    - **Validates: Requirements 5.1, 5.2**
    - In `tests/tests.js`, run 100+ iterations; assert calling `toggleTask(id)` twice returns the task to its original `completed` state

  - [ ]* 6.5 Write property test for task list serialization round-trip (Property 7)
    - **Property 7: Task list serialization round-trip**
    - **Validates: Requirements 6.3**
    - In `tests/tests.js`, run 100+ iterations with random task arrays; assert `JSON.parse(JSON.stringify(tasks))` is deeply equal to the original

  - [ ]* 6.6 Write unit tests for TodoList operations
    - Test `addTask("")` and `addTask("   ")` do not add items
    - Test `deleteTask` removes the correct item and leaves others intact
    - Test `editTask` with empty string does not update the task
    - _Requirements: 3.3, 4.3, 5.3_

- [x] 7. Checkpoint — Verify To-Do List logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Quick Links in `js/app.js`
  - Write the `QuickLinks` object with `init()`, `addLink(label, url)`, `deleteLink(id)`, `save()`, `render()`, and `renderLink(link)` methods
  - `init` calls `Storage.load("pd_links", [])`, stores the result, calls `render()`, and binds the add-link form submit handler
  - `addLink` trims both inputs; rejects if either label or url is empty; creates a Link with `id`, `label`, `url`; pushes to array; calls `save()` and `render()`
  - `deleteLink` removes the link by id; calls `save()` and `render()`
  - `renderLink` builds a DOM element: a button showing the label that opens the URL in a new tab (`window.open(url, "_blank")`), plus a delete control
  - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 8.1 Write property test for link list serialization round-trip (Property 8)
    - **Property 8: Link list serialization round-trip**
    - **Validates: Requirements 8.7**
    - In `tests/tests.js`, run 100+ iterations with random link arrays; assert `JSON.parse(JSON.stringify(links))` is deeply equal to the original

  - [ ]* 8.2 Write unit tests for QuickLinks operations
    - Test `addLink("", "https://example.com")` does not add a link
    - Test `addLink("Example", "")` does not add a link
    - Test `deleteLink` removes the correct link and leaves others intact
    - _Requirements: 8.3, 8.4_

- [x] 9. Wire all widgets together in `js/app.js`
  - Add a top-level `init()` function that calls `GreetingWidget.init()`, `FocusTimer.init()`, `TodoList.init()`, and `QuickLinks.init()`
  - Attach `init` to the `DOMContentLoaded` event: `document.addEventListener("DOMContentLoaded", init)`
  - Verify all widget DOM selectors match the `id` attributes defined in `index.html`
  - _Requirements: 9.1, 9.2, 9.3, 10.1_

- [x] 10. Complete the test file `tests/tests.js`
  - Write a minimal hand-rolled assertion helper (`assert`, `assertEqual`, `assertDeepEqual`) with no external dependencies
  - Write a lightweight property-test runner: a `property(name, iterations, generatorFn, propertyFn)` helper that loops `iterations` times, calling `generatorFn()` to produce inputs and `propertyFn(input)` to assert the property
  - Implement all unit and property tests described in tasks 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1–6.6, 8.1, 8.2 as concrete test cases in this file
  - Extract the pure functions under test (`getGreeting`, `FocusTimer.formatTime`, `Storage.save`/`load`, `TodoList` logic, `QuickLinks` logic) so they can be called without a DOM — either by duplicating the pure logic in the test file or by structuring `js/app.js` so pure functions are accessible via a global object
  - Output a pass/fail summary to `console.log` and render a results table into `<div id="test-results">` if present
  - _Requirements: 6.3, 8.7, 10.4_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Open `tests/tests.js` in a browser (via `index.html` with a `<script src="tests/tests.js">` tag, or directly) and confirm all unit and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- All implementation is file creation/editing only — no terminal commands are needed
- Property tests validate universal correctness properties across 100+ random inputs
- Unit tests validate specific examples and edge cases
- `tests/tests.js` is a required deliverable and must be created as part of task 10
