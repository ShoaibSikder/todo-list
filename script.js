// ============================================
// TASK MASTER - Advanced Todo List App
// ============================================

// ========== STATE MANAGEMENT ==========
let currentUser = null;
let tasks = [];
let filteredTasks = [];
let currentFilter = "all";
let sortBy = "date";
let isDarkMode = false;
const users = [];

// ========== INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  checkUserSession();
  populateCategories();
  setupKeyboardShortcuts();
});

// ========== AUTHENTICATION ==========
function switchTab(tab) {
  document.getElementById("registerForm").classList.remove("active");
  document.getElementById("loginForm").classList.remove("active");

  if (tab === "register") {
    document.getElementById("registerForm").classList.add("active");
  } else {
    document.getElementById("loginForm").classList.add("active");
  }
}

function registerUser() {
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;

  if (!username || !email || !password) {
    alert("Please fill all fields");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];
  if (users.some((u) => u.email === email)) {
    alert("Email already registered");
    return;
  }

  const newUser = { username, email, password, id: Date.now() };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  alert("Registration successful! Please login.");
  clearAuthForm();
  switchTab("login");
}

function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    alert("Invalid email or password");
    return;
  }

  currentUser = user;
  localStorage.setItem("currentUser", JSON.stringify(user));
  loadTasks();
  showApp();
  clearAuthForm();
}

function demoLogin() {
  currentUser = { username: "Demo User", email: "demo@example.com", id: 1 };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  // Load demo tasks
  const demoTasks = [
    {
      id: 1,
      text: "Complete project documentation",
      category: "Work",
      priority: "High",
      dueDate: "2026-05-15",
      completed: false,
    },
    {
      id: 2,
      text: "Buy groceries",
      category: "Shopping",
      priority: "Medium",
      dueDate: "2026-05-10",
      completed: false,
    },
    {
      id: 3,
      text: "Exercise 30 minutes",
      category: "Health",
      priority: "High",
      dueDate: "2026-05-09",
      completed: true,
    },
    {
      id: 4,
      text: "Review JavaScript course",
      category: "Education",
      priority: "Medium",
      dueDate: "2026-05-20",
      completed: false,
    },
  ];

  tasks = demoTasks;
  localStorage.setItem(`tasks_${currentUser.id}`, JSON.stringify(tasks));

  showApp();
  clearAuthForm();
  renderTasks();
  updateStats();
}

function logoutUser() {
  if (confirm("Are you sure you want to logout?")) {
    currentUser = null;
    localStorage.removeItem("currentUser");
    showAuth();
    clearAuthForm();
  }
}

function clearAuthForm() {
  document.getElementById("regUsername").value = "";
  document.getElementById("regEmail").value = "";
  document.getElementById("regPassword").value = "";
  document.getElementById("regConfirmPassword").value = "";
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
}

function checkUserSession() {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    loadTasks();
    showApp();
  } else {
    showAuth();
  }
}

// ========== UI TOGGLING ==========
function showAuth() {
  document.getElementById("authContainer").classList.remove("hidden");
  document.getElementById("appContainer").classList.add("hidden");
  document.getElementById("loginForm").classList.add("active");
}

function showApp() {
  document.getElementById("authContainer").classList.add("hidden");
  document.getElementById("appContainer").classList.remove("hidden");
  document.getElementById("currentUser").textContent = currentUser.username;
}

// ========== TASK MANAGEMENT ==========
function addTask() {
  const taskInput = document.getElementById("taskInput");
  const text = taskInput.value.trim();
  const category = document.getElementById("categorySelect").value;
  const priority = document.getElementById("prioritySelect").value;
  const dueDate = document.getElementById("dueDateInput").value;

  if (!text) {
    alert("Please enter a task");
    return;
  }

  const task = {
    id: Date.now(),
    text,
    category,
    priority,
    dueDate,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(task);
  saveTasks();
  renderTasks();
  updateStats();

  // Clear form
  taskInput.value = "";
  document.getElementById("categorySelect").value = "General";
  document.getElementById("prioritySelect").value = "Medium";
  document.getElementById("dueDateInput").value = "";
  taskInput.focus();
}

function editTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const newText = prompt("Edit task:", task.text);
  if (newText && newText.trim()) {
    task.text = newText.trim();
    saveTasks();
    renderTasks();
  }
}

function deleteTask(id) {
  if (confirm("Are you sure you want to delete this task?")) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
  }
}

function toggleComplete(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    updateStats();
  }
}

function duplicateTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    const newTask = {
      ...task,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      completed: false,
    };
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateStats();
  }
}

// ========== FILTERING & SEARCHING ==========
function filterTasks(filter) {
  currentFilter = filter;

  // Update active button
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");

  const today = new Date().toISOString().split("T")[0];

  switch (filter) {
    case "completed":
      filteredTasks = tasks.filter((t) => t.completed);
      break;
    case "pending":
      filteredTasks = tasks.filter((t) => !t.completed);
      break;
    case "today":
      filteredTasks = tasks.filter((t) => t.dueDate === today);
      break;
    case "high":
      filteredTasks = tasks.filter(
        (t) => t.priority === "High" && !t.completed,
      );
      break;
    default:
      filteredTasks = tasks;
  }

  renderTasks();
}

function searchTasks() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  filteredTasks = tasks.filter(
    (t) =>
      t.text.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query),
  );
  renderTasks();
}

function sortTasks() {
  sortBy = sortBy === "date" ? "priority" : "date";

  if (sortBy === "priority") {
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    filteredTasks.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );
  } else {
    filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  renderTasks();
}

// ========== RENDERING ==========
function renderTasks() {
  const taskList = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");

  if (!filteredTasks || filteredTasks.length === 0) {
    taskList.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  taskList.innerHTML = filteredTasks
    .map(
      (task) => `
        <li class="task-item ${task.completed ? "completed" : ""}">
            <input type="checkbox" class="task-checkbox" 
                   ${task.completed ? "checked" : ""} 
                   onchange="toggleComplete(${task.id})">
            
            <div class="task-content">
                <div class="task-text">${escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <span class="task-category">📁 ${task.category}</span>
                    <span class="priority-badge ${task.priority.toLowerCase()}">
                        ${task.priority}
                    </span>
                    ${task.dueDate ? `<span class="task-date">📅 ${formatDate(task.dueDate)}</span>` : ""}
                </div>
            </div>
            
            <div class="task-actions">
                <button class="task-btn edit-btn" onclick="editTask(${task.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn duplicate-btn" onclick="duplicateTask(${task.id})" title="Duplicate">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="task-btn delete-btn" onclick="deleteTask(${task.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </li>
    `,
    )
    .join("");
}

function populateCategories() {
  const categories = [
    "General",
    "Work",
    "Personal",
    "Shopping",
    "Health",
    "Education",
  ];
  const categoryList = document.getElementById("categoryList");

  categoryList.innerHTML = categories
    .map(
      (cat) => `
        <div class="category-item" onclick="filterByCategory('${cat}')">${cat}</div>
    `,
    )
    .join("");
}

function filterByCategory(category) {
  filteredTasks = tasks.filter((t) => t.category === category);
  renderTasks();
}

// ========== STATISTICS ==========
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const completionRate =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("pendingTasks").textContent = pending;
  document.getElementById("completionRate").textContent = completionRate + "%";
}

// ========== STORAGE ==========
function saveTasks() {
  if (currentUser) {
    localStorage.setItem(`tasks_${currentUser.id}`, JSON.stringify(tasks));
  }
}

function loadTasks() {
  if (currentUser) {
    const saved = localStorage.getItem(`tasks_${currentUser.id}`);
    tasks = saved ? JSON.parse(saved) : [];
    filteredTasks = [...tasks];
    renderTasks();
    updateStats();
  }
}

// ========== THEME ==========
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark-mode", isDarkMode);
  localStorage.setItem("darkMode", isDarkMode);
}

function loadTheme() {
  isDarkMode = localStorage.getItem("darkMode") === "true";
  if (isDarkMode) {
    document.body.classList.add("dark-mode");
  }
}

// ========== UTILITIES ==========
function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ========== KEYBOARD SHORTCUTS ==========
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + N: New task
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      document.getElementById("taskInput").focus();
    }
    // Ctrl/Cmd + K: Search
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      document.getElementById("searchInput").focus();
    }
    // Escape: Clear search
    if (e.key === "Escape") {
      document.getElementById("searchInput").value = "";
      searchTasks();
    }
  });
}
