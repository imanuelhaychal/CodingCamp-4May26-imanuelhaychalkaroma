// Personal Dashboard — app logic

// ---------------------------------------------------------------------------
// Storage key constants
// ---------------------------------------------------------------------------
const STORAGE_KEY_TASKS    = "pd_tasks";
const STORAGE_KEY_LINKS    = "pd_links";
const STORAGE_KEY_THEME    = "pd_theme";
const STORAGE_KEY_NAME     = "pd_name";
const STORAGE_KEY_DURATION = "pd_timer_duration";
const STORAGE_KEY_SORT     = "pd_sort";

// ---------------------------------------------------------------------------
// Storage utility
// ---------------------------------------------------------------------------
const Storage = {
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Quota exceeded — ignore silently.
    }
  },

  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },
};

// ---------------------------------------------------------------------------
// Theme Manager  (light / dark mode)
// ---------------------------------------------------------------------------
const ThemeManager = {
  /** Current theme: "light" | "dark" */
  theme: "light",

  init() {
    this.theme = Storage.load(STORAGE_KEY_THEME, "light");
    this.apply();

    const btn = document.getElementById("theme-toggle");
    if (btn) btn.addEventListener("click", () => this.toggle());
  },

  apply() {
    document.documentElement.setAttribute("data-theme", this.theme);
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = this.theme === "dark" ? "☀️" : "🌙";
  },

  toggle() {
    this.theme = this.theme === "dark" ? "light" : "dark";
    Storage.save(STORAGE_KEY_THEME, this.theme);
    this.apply();
  },
};

// ---------------------------------------------------------------------------
// Greeting Widget  (with custom name support)
// ---------------------------------------------------------------------------
const GreetingWidget = {
  /** User-supplied name, or empty string. */
  name: "",

  init() {
    this.name = Storage.load(STORAGE_KEY_NAME, "");

    // Populate the name input in the top bar
    const nameInput = document.getElementById("user-name-input");
    if (nameInput) {
      nameInput.value = this.name;
      nameInput.addEventListener("input", () => {
        this.name = nameInput.value.trim();
        Storage.save(STORAGE_KEY_NAME, this.name);
        this.render();
      });
    }

    this.render();
    setInterval(() => this.render(), 60_000);
  },

  render() {
    const now = new Date();
    const timeEl = document.getElementById("greeting-time");
    const dateEl = document.getElementById("greeting-date");
    const msgEl  = document.getElementById("greeting-message");

    if (timeEl) timeEl.textContent = this.formatTime(now);
    if (dateEl) dateEl.textContent = this.formatDate(now);
    if (msgEl) {
      const base = this.getGreeting(now.getHours());
      msgEl.textContent = this.name ? `${base}, ${this.name}!` : base;
    }
  },

  getGreeting(hour) {
    if (hour >= 5  && hour <= 11) return "Good morning";
    if (hour >= 12 && hour <= 17) return "Good afternoon";
    if (hour >= 18 && hour <= 20) return "Good evening";
    return "Good night";
  },

  formatTime(date) {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  },

  formatDate(date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year:    "numeric",
      month:   "long",
      day:     "numeric",
    });
  },
};

// ---------------------------------------------------------------------------
// Focus Timer  (with custom Pomodoro duration)
// ---------------------------------------------------------------------------
const FocusTimer = {
  /** Duration in minutes chosen by the user (default 25). */
  durationMinutes: 25,

  /** Remaining seconds on the countdown. */
  totalSeconds: 1500,

  intervalId: null,
  running: false,

  init() {
    // Restore saved duration
    this.durationMinutes = Storage.load(STORAGE_KEY_DURATION, 25);
    this.totalSeconds    = this.durationMinutes * 60;

    this.render();

    // Control buttons
    const startBtn    = document.getElementById("timer-start");
    const stopBtn     = document.getElementById("timer-stop");
    const resetBtn    = document.getElementById("timer-reset");
    const setBtn      = document.getElementById("timer-set-btn");
    const durationInput = document.getElementById("timer-duration-input");

    if (startBtn) startBtn.addEventListener("click", () => this.start());
    if (stopBtn)  stopBtn.addEventListener("click",  () => this.stop());
    if (resetBtn) resetBtn.addEventListener("click", () => this.reset());

    // Populate the duration input with the saved value
    if (durationInput) durationInput.value = this.durationMinutes;

    // "Set" button applies the new duration (only when timer is stopped)
    if (setBtn && durationInput) {
      setBtn.addEventListener("click", () => {
        if (this.running) return; // don't change mid-session
        const mins = parseInt(durationInput.value, 10);
        if (!isNaN(mins) && mins >= 1 && mins <= 120) {
          this.durationMinutes = mins;
          this.totalSeconds    = mins * 60;
          Storage.save(STORAGE_KEY_DURATION, mins);
          this.render();
        } else {
          durationInput.value = this.durationMinutes; // revert invalid input
        }
      });

      // Also allow pressing Enter in the duration field
      durationInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); setBtn.click(); }
      });
    }
  },

  start() {
    if (this.running) return;
    this.running    = true;
    this.intervalId = setInterval(() => this.tick(), 1000);
    this.render();
  },

  stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.running    = false;
    this.render();
  },

  reset() {
    clearInterval(this.intervalId);
    this.intervalId  = null;
    this.totalSeconds = this.durationMinutes * 60;
    this.running     = false;
    this.render();
  },

  tick() {
    this.totalSeconds -= 1;
    if (this.totalSeconds <= 0) {
      this.totalSeconds = 0;
      this.stop();
      return;
    }
    this.render();
  },

  render() {
    const display    = document.getElementById("timer-display");
    const startBtn   = document.getElementById("timer-start");
    const stopBtn    = document.getElementById("timer-stop");
    const setBtn     = document.getElementById("timer-set-btn");
    const durInput   = document.getElementById("timer-duration-input");

    if (display)  display.textContent = this.formatTime(this.totalSeconds);
    if (startBtn) startBtn.disabled   = this.running;
    if (stopBtn)  stopBtn.disabled    = !this.running;

    // Disable duration controls while running
    if (setBtn)   setBtn.disabled   = this.running;
    if (durInput) durInput.disabled = this.running;
  },

  formatTime(totalSeconds) {
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  },
};

// ---------------------------------------------------------------------------
// To-Do List  (with duplicate prevention + sorting)
// ---------------------------------------------------------------------------
const TodoList = {
  /** @type {Array<{id: string, text: string, completed: boolean}>} */
  tasks: [],

  /** Current sort mode: "none" | "az" | "za" | "pending" | "completed" */
  sortMode: "none",

  init() {
    this.tasks    = Storage.load(STORAGE_KEY_TASKS, []);
    this.sortMode = Storage.load(STORAGE_KEY_SORT, "none");

    // Restore sort select
    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.value = this.sortMode;
      sortSelect.addEventListener("change", () => {
        this.sortMode = sortSelect.value;
        Storage.save(STORAGE_KEY_SORT, this.sortMode);
        this.render();
      });
    }

    this.render();

    const form  = document.getElementById("todo-add-form");
    const input = document.getElementById("todo-input");

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text   = input ? input.value : "";
        const result = this.addTask(text);
        if (result === true && input) {
          input.value = "";
          this.clearDuplicateWarning();
        } else if (result === "duplicate") {
          this.showDuplicateWarning(text.trim());
          if (input) input.focus();
        } else {
          if (input) input.focus();
        }
      });
    }
  },

  /**
   * Add a task. Returns:
   *   true        — added successfully
   *   "duplicate" — a task with the same text (case-insensitive) already exists
   *   false       — empty / whitespace input
   */
  addTask(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return false;

    // Duplicate check (case-insensitive)
    const isDuplicate = this.tasks.some(
      (t) => t.text.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) return "duplicate";

    const id = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString() + Math.random().toString(36).slice(2);

    this.tasks.push({ id, text: trimmed, completed: false });
    this.save();
    this.render();
    return true;
  },

  editTask(id, text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return false;

    const task = this.tasks.find((t) => t.id === id);
    if (!task) return false;

    // Duplicate check — ignore the task being edited itself
    const isDuplicate = this.tasks.some(
      (t) => t.id !== id && t.text.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) return "duplicate";

    task.text = trimmed;
    this.save();
    this.render();
    return true;
  },

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    this.save();
    this.render();
  },

  deleteTask(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.save();
    this.render();
  },

  save() {
    Storage.save(STORAGE_KEY_TASKS, this.tasks);
  },

  /** Return a sorted copy of tasks according to the current sortMode. */
  getSortedTasks() {
    const copy = [...this.tasks];
    switch (this.sortMode) {
      case "az":
        return copy.sort((a, b) => a.text.localeCompare(b.text));
      case "za":
        return copy.sort((a, b) => b.text.localeCompare(a.text));
      case "pending":
        return copy.sort((a, b) => Number(a.completed) - Number(b.completed));
      case "completed":
        return copy.sort((a, b) => Number(b.completed) - Number(a.completed));
      default:
        return copy; // insertion order
    }
  },

  render() {
    const list = document.getElementById("todo-task-list");
    if (!list) return;

    list.innerHTML = "";
    this.getSortedTasks().forEach((task) => {
      list.appendChild(this.renderTask(task));
    });
  },

  showDuplicateWarning(text) {
    const el = document.getElementById("todo-duplicate-warning");
    if (el) {
      el.textContent = `"${text}" is already in your list.`;
      el.classList.add("visible");
    }
  },

  clearDuplicateWarning() {
    const el = document.getElementById("todo-duplicate-warning");
    if (el) {
      el.textContent = "";
      el.classList.remove("visible");
    }
  },

  renderTask(task) {
    const li = document.createElement("li");
    if (task.completed) li.classList.add("completed");

    // Completion toggle
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "btn-icon";
    toggleBtn.setAttribute("aria-label", task.completed ? "Mark incomplete" : "Mark complete");
    toggleBtn.textContent = task.completed ? "✓" : "○";
    toggleBtn.addEventListener("click", () => {
      this.clearDuplicateWarning();
      this.toggleTask(task.id);
    });

    // Task text
    const textSpan = document.createElement("span");
    textSpan.textContent = task.text;
    textSpan.style.flex = "1";

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn-icon";
    editBtn.setAttribute("aria-label", "Edit task");
    editBtn.textContent = "✎";

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-icon danger";
    deleteBtn.setAttribute("aria-label", "Delete task");
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", () => {
      this.clearDuplicateWarning();
      this.deleteTask(task.id);
    });

    // Inline edit controls
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.value = task.text;
    editInput.style.flex = "1";
    editInput.style.display = "none";
    editInput.setAttribute("aria-label", "Edit task text");

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "btn-icon";
    confirmBtn.setAttribute("aria-label", "Confirm edit");
    confirmBtn.textContent = "✔";
    confirmBtn.style.display = "none";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn-icon";
    cancelBtn.setAttribute("aria-label", "Cancel edit");
    cancelBtn.textContent = "✖";
    cancelBtn.style.display = "none";

    // Inline edit warning
    const editWarning = document.createElement("span");
    editWarning.className = "edit-duplicate-warning";
    editWarning.style.display = "none";

    const enterEditMode = () => {
      textSpan.style.display   = "none";
      editBtn.style.display    = "none";
      editInput.style.display  = "";
      confirmBtn.style.display = "";
      cancelBtn.style.display  = "";
      editInput.focus();
      editInput.select();
    };

    const exitEditMode = () => {
      editInput.style.display   = "none";
      confirmBtn.style.display  = "none";
      cancelBtn.style.display   = "none";
      editWarning.style.display = "none";
      textSpan.style.display    = "";
      editBtn.style.display     = "";
      editInput.value = task.text;
    };

    const confirmEdit = () => {
      const result = this.editTask(task.id, editInput.value);
      if (result === "duplicate") {
        editWarning.textContent  = `"${editInput.value.trim()}" already exists.`;
        editWarning.style.display = "";
        editInput.focus();
      } else if (!result) {
        editInput.focus(); // empty input
      }
      // On success render() refreshes the DOM automatically
    };

    editBtn.addEventListener("click", enterEditMode);
    cancelBtn.addEventListener("click", exitEditMode);
    confirmBtn.addEventListener("click", confirmEdit);
    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter")  { e.preventDefault(); confirmEdit(); }
      if (e.key === "Escape") { exitEditMode(); }
    });

    li.appendChild(toggleBtn);
    li.appendChild(textSpan);
    li.appendChild(editInput);
    li.appendChild(editWarning);
    li.appendChild(editBtn);
    li.appendChild(confirmBtn);
    li.appendChild(cancelBtn);
    li.appendChild(deleteBtn);

    return li;
  },
};

// ---------------------------------------------------------------------------
// Quick Links
// ---------------------------------------------------------------------------
const QuickLinks = {
  /** @type {Array<{id: string, label: string, url: string}>} */
  links: [],

  init() {
    this.links = Storage.load(STORAGE_KEY_LINKS, []);
    this.render();

    const form       = document.getElementById("links-add-form");
    const labelInput = document.getElementById("links-label-input");
    const urlInput   = document.getElementById("links-url-input");

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const label = labelInput ? labelInput.value : "";
        const url   = urlInput   ? urlInput.value   : "";
        const added = this.addLink(label, url);
        if (added) {
          if (labelInput) labelInput.value = "";
          if (urlInput)   urlInput.value   = "";
        }
      });
    }
  },

  addLink(label, url) {
    const trimmedLabel = (label || "").trim();
    const trimmedUrl   = (url   || "").trim();
    if (!trimmedLabel || !trimmedUrl) return false;

    const id = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString() + Math.random().toString(36).slice(2);

    this.links.push({ id, label: trimmedLabel, url: trimmedUrl });
    this.save();
    this.render();
    return true;
  },

  deleteLink(id) {
    this.links = this.links.filter((l) => l.id !== id);
    this.save();
    this.render();
  },

  save() {
    Storage.save(STORAGE_KEY_LINKS, this.links);
  },

  render() {
    const container = document.getElementById("links-container");
    if (!container) return;
    container.innerHTML = "";
    this.links.forEach((link) => container.appendChild(this.renderLink(link)));
  },

  renderLink(link) {
    const wrapper = document.createElement("div");
    wrapper.className = "link-item";

    const linkBtn = document.createElement("button");
    linkBtn.type = "button";
    linkBtn.className = "link-btn";
    linkBtn.textContent = link.label;
    linkBtn.setAttribute("aria-label", `Open ${link.label}`);
    linkBtn.addEventListener("click", () => window.open(link.url, "_blank"));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-icon danger";
    deleteBtn.setAttribute("aria-label", `Delete ${link.label}`);
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", () => this.deleteLink(link.id));

    wrapper.appendChild(linkBtn);
    wrapper.appendChild(deleteBtn);
    return wrapper;
  },
};

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
function init() {
  ThemeManager.init();
  GreetingWidget.init();
  FocusTimer.init();
  TodoList.init();
  QuickLinks.init();
}

document.addEventListener("DOMContentLoaded", init);
