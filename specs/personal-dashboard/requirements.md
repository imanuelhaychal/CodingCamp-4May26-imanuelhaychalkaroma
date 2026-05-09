# Requirements Document

## Introduction

A personal dashboard web app built with HTML, CSS, and Vanilla JavaScript that runs entirely in the browser with no backend server. The dashboard provides a greeting with current time and date, a focus timer, a to-do list, and a quick links panel. All user data is persisted using the browser's Local Storage API. The app is designed to be clean, minimal, and fast — suitable for use as a standalone web page or browser extension.

## Glossary

- **Dashboard**: The single-page web application that hosts all widgets.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-based greeting message.
- **Focus_Timer**: The UI component that implements a 25-minute countdown timer with start, stop, and reset controls.
- **Todo_List**: The UI component that manages a list of user tasks with add, edit, complete, and delete operations.
- **Quick_Links**: The UI component that displays user-defined shortcut buttons that open external URLs.
- **Storage**: The browser's Local Storage API used to persist all user data client-side.
- **Task**: A single to-do item with a text description and a completion state.
- **Link**: A user-defined entry consisting of a label and a URL stored in Quick_Links.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a personalized greeting when I open the dashboard, so that I have immediate context about the time of day.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format, updated every minute.
2. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g., "Monday, July 14, 2025").
3. WHEN the local time is between 05:00 and 11:59, THE Greeting_Widget SHALL display the message "Good morning".
4. WHEN the local time is between 12:00 and 17:59, THE Greeting_Widget SHALL display the message "Good afternoon".
5. WHEN the local time is between 18:00 and 20:59, THE Greeting_Widget SHALL display the message "Good evening".
6. WHEN the local time is between 21:00 and 04:59, THE Greeting_Widget SHALL display the message "Good night".
7. THE Greeting_Widget SHALL update the displayed time without requiring a page reload.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can use the Pomodoro technique to manage my focus sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a countdown value of 25 minutes and 00 seconds (25:00).
2. WHEN the user activates the start control, THE Focus_Timer SHALL begin counting down one second at a time.
3. WHEN the user activates the stop control, THE Focus_Timer SHALL pause the countdown at the current value.
4. WHEN the user activates the reset control, THE Focus_Timer SHALL return the countdown value to 25:00 and stop any active countdown.
5. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically.
6. WHILE the countdown is active, THE Focus_Timer SHALL display the remaining time in MM:SS format.
7. WHILE the countdown is active, THE Focus_Timer SHALL disable the start control.
8. WHILE the countdown is paused or stopped, THE Focus_Timer SHALL disable the stop control.

---

### Requirement 3: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add tasks to a list and see them displayed, so that I can track what I need to do.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an input field for entering task text.
2. WHEN the user submits a non-empty task text, THE Todo_List SHALL add the task to the list and clear the input field.
3. IF the user submits an empty or whitespace-only input, THEN THE Todo_List SHALL not add a task and SHALL keep the input field focused.
4. THE Todo_List SHALL display each task with its text, a completion toggle, an edit control, and a delete control.
5. WHEN the Dashboard loads, THE Todo_List SHALL retrieve and display all tasks previously saved in Storage.

---

### Requirement 4: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit the text of an existing task, so that I can correct or update it without deleting and re-adding it.

#### Acceptance Criteria

1. WHEN the user activates the edit control on a task, THE Todo_List SHALL replace the task's text display with an editable input field pre-filled with the current task text.
2. WHEN the user confirms the edit with a non-empty value, THE Todo_List SHALL update the task text and return to the display view.
3. IF the user confirms the edit with an empty or whitespace-only value, THEN THE Todo_List SHALL not update the task and SHALL keep the edit input focused.
4. WHEN the user cancels the edit, THE Todo_List SHALL discard the change and return to the display view.

---

### Requirement 5: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks I no longer need, so that I can manage my task list effectively.

#### Acceptance Criteria

1. WHEN the user activates the completion toggle on an incomplete task, THE Todo_List SHALL mark the task as complete and apply a visual distinction (e.g., strikethrough text).
2. WHEN the user activates the completion toggle on a complete task, THE Todo_List SHALL mark the task as incomplete and remove the visual distinction.
3. WHEN the user activates the delete control on a task, THE Todo_List SHALL remove the task from the list permanently.

---

### Requirement 6: To-Do List — Persistence

**User Story:** As a user, I want my tasks to be saved automatically, so that they are still available when I reopen the dashboard.

#### Acceptance Criteria

1. WHEN a task is added, edited, completed, or deleted, THE Todo_List SHALL save the updated task list to Storage immediately.
2. THE Storage SHALL persist the task list as a JSON-serialized array of Task objects, each containing a unique identifier, text, and completion state.
3. FOR ALL valid task list states, serializing then deserializing the task list SHALL produce an equivalent task list (round-trip property).

---

### Requirement 7: Quick Links — Display and Open

**User Story:** As a user, I want to see my saved website shortcuts as clickable buttons, so that I can navigate to my favorite sites quickly.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Quick_Links SHALL retrieve and display all links previously saved in Storage.
2. THE Quick_Links SHALL display each link as a labeled button showing the link's label text.
3. WHEN the user activates a link button, THE Quick_Links SHALL open the associated URL in a new browser tab.

---

### Requirement 8: Quick Links — Add and Delete

**User Story:** As a user, I want to add and remove quick link shortcuts, so that I can customize my dashboard to my most-used sites.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide input fields for entering a link label and a link URL.
2. WHEN the user submits a non-empty label and a non-empty URL, THE Quick_Links SHALL add the link to the list and clear both input fields.
3. IF the user submits with an empty label or an empty URL, THEN THE Quick_Links SHALL not add the link.
4. WHEN the user activates the delete control on a link, THE Quick_Links SHALL remove the link from the list permanently.
5. WHEN a link is added or deleted, THE Quick_Links SHALL save the updated link list to Storage immediately.
6. THE Storage SHALL persist the link list as a JSON-serialized array of Link objects, each containing a unique identifier, label, and URL.
7. FOR ALL valid link list states, serializing then deserializing the link list SHALL produce an equivalent link list (round-trip property).

---

### Requirement 9: Layout and Visual Design

**User Story:** As a user, I want the dashboard to have a clean, readable layout, so that I can use it comfortably without visual clutter.

#### Acceptance Criteria

1. THE Dashboard SHALL render all four widgets (Greeting_Widget, Focus_Timer, Todo_List, Quick_Links) on a single page without requiring scrolling on a 1280×720 viewport or larger.
2. THE Dashboard SHALL use a single CSS file located at `css/style.css` for all styling.
3. THE Dashboard SHALL use a single JavaScript file located at `js/app.js` for all behavior.
4. THE Dashboard SHALL apply a consistent typographic scale with a base font size of at least 14px.
5. THE Dashboard SHALL provide sufficient color contrast between text and background to meet WCAG AA contrast ratio (4.5:1 for normal text).

---

### Requirement 10: Browser Compatibility and Storage Resilience

**User Story:** As a user, I want the dashboard to work reliably across modern browsers and handle missing data gracefully, so that I never see a broken experience.

#### Acceptance Criteria

1. THE Dashboard SHALL function correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari.
2. IF Storage does not contain a saved task list, THEN THE Todo_List SHALL initialize with an empty list.
3. IF Storage does not contain a saved link list, THEN THE Quick_Links SHALL initialize with an empty list.
4. IF Storage contains malformed JSON for the task list or link list, THEN THE Dashboard SHALL initialize the affected widget with an empty list and SHALL not throw an unhandled exception.
