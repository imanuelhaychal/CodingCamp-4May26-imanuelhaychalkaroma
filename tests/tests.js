// Personal Dashboard — tests

// ---------------------------------------------------------------------------
// Minimal assertion helpers
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;
const results = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    results.push({ ok: true, message });
  } else {
    failed++;
    results.push({ ok: false, message });
    console.error(`FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

function assertDeepEqual(actual, expected, message) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`
  );
}

// ---------------------------------------------------------------------------
// Lightweight property-test runner
// ---------------------------------------------------------------------------
/**
 * Run a property test for `iterations` iterations.
 *
 * @param {string}   name        - Human-readable property name
 * @param {number}   iterations  - Number of random inputs to try
 * @param {Function} generatorFn - () => input
 * @param {Function} propertyFn  - (input) => boolean
 */
function property(name, iterations, generatorFn, propertyFn) {
  for (let i = 0; i < iterations; i++) {
    const input = generatorFn();
    const holds = propertyFn(input);
    if (!holds) {
      failed++;
      results.push({ ok: false, message: `${name} — counterexample: ${JSON.stringify(input)}` });
      console.error(`FAIL (property): ${name} — counterexample: ${JSON.stringify(input)}`);
      return;
    }
  }
  passed++;
  results.push({ ok: true, message: `${name} (${iterations} iterations)` });
}

// ---------------------------------------------------------------------------
// Random generators
// ---------------------------------------------------------------------------
const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !@#$%";

function randomString(minLen = 1, maxLen = 20) {
  const len = minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
  let s = "";
  for (let i = 0; i < len; i++) {
    s += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return s;
}

function randomNonEmptyString() {
  // Ensure at least one non-whitespace character
  return randomString(1, 20).replace(/^\s+|\s+$/g, "") || "x";
}

function randomWhitespaceString() {
  const ws = [" ", "\t", "\n", "\r"];
  const len = 1 + Math.floor(Math.random() * 10);
  let s = "";
  for (let i = 0; i < len; i++) {
    s += ws[Math.floor(Math.random() * ws.length)];
  }
  return s;
}

function randomTask() {
  return {
    id: Math.random().toString(36).slice(2),
    text: randomNonEmptyString(),
    completed: Math.random() < 0.5,
  };
}

function randomLink() {
  return {
    id: Math.random().toString(36).slice(2),
    label: randomNonEmptyString(),
    url: "https://" + randomNonEmptyString().replace(/\s/g, "") + ".com",
  };
}

function randomTaskArray(maxLen = 10) {
  const len = Math.floor(Math.random() * (maxLen + 1));
  const arr = [];
  for (let i = 0; i < len; i++) arr.push(randomTask());
  return arr;
}

function randomLinkArray(maxLen = 10) {
  const len = Math.floor(Math.random() * (maxLen + 1));
  const arr = [];
  for (let i = 0; i < len; i++) arr.push(randomLink());
  return arr;
}

// ---------------------------------------------------------------------------
// GreetingWidget tests
// ---------------------------------------------------------------------------

// Property 1: Greeting message covers all hours
// Validates: Requirements 1.3, 1.4, 1.5, 1.6
property(
  "Property 1: getGreeting returns a valid greeting for every hour 0–23",
  24,
  () => Math.floor(Math.random() * 24),
  (hour) => {
    const valid = ["Good morning", "Good afternoon", "Good evening", "Good night"];
    const result = GreetingWidget.getGreeting(hour);
    if (!valid.includes(result)) return false;
    // Check correct mapping
    if (hour >= 5  && hour <= 11 && result !== "Good morning")   return false;
    if (hour >= 12 && hour <= 17 && result !== "Good afternoon") return false;
    if (hour >= 18 && hour <= 20 && result !== "Good evening")   return false;
    if ((hour >= 21 || hour <= 4) && result !== "Good night")    return false;
    return true;
  }
);

// Unit tests for getGreeting boundary hours
const greetingCases = [
  [0,  "Good night"],
  [4,  "Good night"],
  [5,  "Good morning"],
  [11, "Good morning"],
  [12, "Good afternoon"],
  [17, "Good afternoon"],
  [18, "Good evening"],
  [20, "Good evening"],
  [21, "Good night"],
  [23, "Good night"],
];
greetingCases.forEach(([hour, expected]) => {
  assertEqual(GreetingWidget.getGreeting(hour), expected, `getGreeting(${hour}) === "${expected}"`);
});

// ---------------------------------------------------------------------------
// FocusTimer tests
// ---------------------------------------------------------------------------

// Property 2: Timer format round-trip
// Validates: Requirements 2.6
property(
  "Property 2: FocusTimer.formatTime round-trips for all seconds 0–1500",
  200,
  () => Math.floor(Math.random() * 1501),
  (seconds) => {
    const str = FocusTimer.formatTime(seconds);
    const [mm, ss] = str.split(":").map(Number);
    return mm * 60 + ss === seconds;
  }
);

// Unit tests for FocusTimer.formatTime
assertEqual(FocusTimer.formatTime(1500), "25:00", "formatTime(1500) === '25:00'");
assertEqual(FocusTimer.formatTime(0),    "00:00", "formatTime(0) === '00:00'");
assertEqual(FocusTimer.formatTime(90),   "01:30", "formatTime(90) === '01:30'");

// ---------------------------------------------------------------------------
// Storage tests
// ---------------------------------------------------------------------------

// Property 9: Storage load is the inverse of save
// Validates: Requirements 6.1, 8.5
property(
  "Property 9: Storage.save then Storage.load returns original value",
  100,
  () => (Math.random() < 0.5 ? randomTaskArray() : randomLinkArray()),
  (data) => {
    const key = "__test_storage__";
    Storage.save(key, data);
    const loaded = Storage.load(key, null);
    return JSON.stringify(loaded) === JSON.stringify(data);
  }
);

// Property 10: Malformed storage falls back gracefully
// Validates: Requirements 10.4
property(
  "Property 10: Storage.load with malformed JSON returns fallback without throwing",
  100,
  () => {
    const malformed = ["{bad json", "undefined", "null}", "[[", "{'key': 'value'}"];
    return malformed[Math.floor(Math.random() * malformed.length)];
  },
  (badJson) => {
    const key = "__test_malformed__";
    try {
      localStorage.setItem(key, badJson);
      const result = Storage.load(key, "FALLBACK");
      return result === "FALLBACK";
    } catch (e) {
      return false;
    }
  }
);

// ---------------------------------------------------------------------------
// TodoList tests
// ---------------------------------------------------------------------------

// Helper: reset TodoList state before each group of tests
function resetTodoList() {
  TodoList.tasks = [];
}

// Property 3: Task list addition grows the list
// Validates: Requirements 3.2
property(
  "Property 3: addTask with non-empty text grows list by 1",
  100,
  () => randomNonEmptyString(),
  (text) => {
    resetTodoList();
    const before = TodoList.tasks.length;
    const added = TodoList.addTask(text);
    if (!added) return false;
    if (TodoList.tasks.length !== before + 1) return false;
    const newTask = TodoList.tasks[TodoList.tasks.length - 1];
    if (newTask.text !== text.trim()) return false;
    if (newTask.completed !== false) return false;
    return true;
  }
);

// Property 4: Whitespace-only task text is rejected
// Validates: Requirements 3.3
property(
  "Property 4: addTask with whitespace-only string leaves list unchanged",
  100,
  () => randomWhitespaceString(),
  (text) => {
    resetTodoList();
    const before = TodoList.tasks.length;
    const added = TodoList.addTask(text);
    return !added && TodoList.tasks.length === before;
  }
);

// Property 5: Task edit preserves identity
// Validates: Requirements 4.2
property(
  "Property 5: editTask updates only the target task's text",
  100,
  () => ({ tasks: [randomTask(), randomTask(), randomTask()], newText: randomNonEmptyString() }),
  ({ tasks, newText }) => {
    TodoList.tasks = tasks.map((t) => ({ ...t }));
    const target = TodoList.tasks[1];
    const originalId        = target.id;
    const originalCompleted = target.completed;
    const othersBefore = TodoList.tasks.filter((t) => t.id !== target.id).map((t) => ({ ...t }));

    const updated = TodoList.editTask(target.id, newText);
    if (!updated) return false;

    const after = TodoList.tasks.find((t) => t.id === originalId);
    if (!after) return false;
    if (after.text !== newText.trim()) return false;
    if (after.id !== originalId) return false;
    if (after.completed !== originalCompleted) return false;

    // All other tasks unchanged
    const othersAfter = TodoList.tasks.filter((t) => t.id !== originalId);
    return JSON.stringify(othersAfter) === JSON.stringify(othersBefore);
  }
);

// Property 6: Completion toggle is an involution
// Validates: Requirements 5.1, 5.2
property(
  "Property 6: toggleTask twice returns task to original completed state",
  100,
  () => randomTask(),
  (task) => {
    TodoList.tasks = [{ ...task }];
    const original = task.completed;
    TodoList.toggleTask(task.id);
    TodoList.toggleTask(task.id);
    return TodoList.tasks[0].completed === original;
  }
);

// Property 7: Task list serialization round-trip
// Validates: Requirements 6.3
property(
  "Property 7: Task list JSON round-trip preserves all fields",
  100,
  () => randomTaskArray(),
  (tasks) => {
    const roundTripped = JSON.parse(JSON.stringify(tasks));
    return JSON.stringify(roundTripped) === JSON.stringify(tasks);
  }
);

// Unit tests for TodoList
resetTodoList();
assert(!TodoList.addTask(""),    'addTask("") returns false');
assert(!TodoList.addTask("   "), 'addTask("   ") returns false');
assertEqual(TodoList.tasks.length, 0, "No tasks added after empty/whitespace inputs");

resetTodoList();
TodoList.addTask("Task A");
TodoList.addTask("Task B");
TodoList.addTask("Task C");
const idB = TodoList.tasks[1].id;
TodoList.deleteTask(idB);
assertEqual(TodoList.tasks.length, 2, "deleteTask removes exactly one task");
assert(TodoList.tasks.every((t) => t.id !== idB), "deleteTask removes the correct task");
assert(TodoList.tasks.some((t) => t.text === "Task A"), "Task A still present after delete");
assert(TodoList.tasks.some((t) => t.text === "Task C"), "Task C still present after delete");

resetTodoList();
TodoList.addTask("Original text");
const taskId = TodoList.tasks[0].id;
assert(!TodoList.editTask(taskId, ""),    'editTask with "" returns false');
assert(!TodoList.editTask(taskId, "  "), 'editTask with "  " returns false');
assertEqual(TodoList.tasks[0].text, "Original text", "editTask with empty string does not update task");

// ---------------------------------------------------------------------------
// QuickLinks tests
// ---------------------------------------------------------------------------

// Helper: reset QuickLinks state before each group of tests
function resetQuickLinks() {
  QuickLinks.links = [];
}

// Property 8: Link list serialization round-trip
// Validates: Requirements 8.7
property(
  "Property 8: Link list JSON round-trip preserves all fields",
  100,
  () => randomLinkArray(),
  (links) => {
    const roundTripped = JSON.parse(JSON.stringify(links));
    return JSON.stringify(roundTripped) === JSON.stringify(links);
  }
);

// Unit tests for QuickLinks
resetQuickLinks();
assert(!QuickLinks.addLink("", "https://example.com"), 'addLink("", url) returns false');
assertEqual(QuickLinks.links.length, 0, "No link added when label is empty");

resetQuickLinks();
assert(!QuickLinks.addLink("Example", ""), 'addLink(label, "") returns false');
assertEqual(QuickLinks.links.length, 0, "No link added when url is empty");

resetQuickLinks();
assert(!QuickLinks.addLink("", ""), 'addLink("", "") returns false');
assertEqual(QuickLinks.links.length, 0, "No link added when both label and url are empty");

resetQuickLinks();
QuickLinks.addLink("Link A", "https://a.com");
QuickLinks.addLink("Link B", "https://b.com");
QuickLinks.addLink("Link C", "https://c.com");
const linkBId = QuickLinks.links[1].id;
QuickLinks.deleteLink(linkBId);
assertEqual(QuickLinks.links.length, 2, "deleteLink removes exactly one link");
assert(QuickLinks.links.every((l) => l.id !== linkBId), "deleteLink removes the correct link");
assert(QuickLinks.links.some((l) => l.label === "Link A"), "Link A still present after delete");
assert(QuickLinks.links.some((l) => l.label === "Link C"), "Link C still present after delete");

resetQuickLinks();
const added = QuickLinks.addLink("  My Site  ", "  https://mysite.com  ");
assert(added, "addLink with padded inputs returns true");
assertEqual(QuickLinks.links[0].label, "My Site",              "addLink trims label");
assertEqual(QuickLinks.links[0].url,   "https://mysite.com",   "addLink trims url");

// ---------------------------------------------------------------------------
// Output results
// ---------------------------------------------------------------------------
const total = passed + failed;
console.log(`\nTest results: ${passed}/${total} passed, ${failed} failed`);

// Render results table into #test-results if present
const container = document.getElementById("test-results");
if (container) {
  container.style.display = "block";
  const summary = document.createElement("p");
  summary.textContent = `${passed}/${total} tests passed, ${failed} failed`;
  summary.style.fontWeight = "bold";
  summary.style.color = failed > 0 ? "red" : "green";
  container.appendChild(summary);

  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.width = "100%";
  table.style.fontSize = "13px";

  results.forEach(({ ok, message }) => {
    const tr = document.createElement("tr");
    tr.style.background = ok ? "#e6ffe6" : "#ffe6e6";
    const statusTd = document.createElement("td");
    statusTd.textContent = ok ? "✓" : "✗";
    statusTd.style.padding = "4px 8px";
    statusTd.style.fontWeight = "bold";
    statusTd.style.color = ok ? "green" : "red";
    const msgTd = document.createElement("td");
    msgTd.textContent = message;
    msgTd.style.padding = "4px 8px";
    tr.appendChild(statusTd);
    tr.appendChild(msgTd);
    table.appendChild(tr);
  });

  container.appendChild(table);
}
