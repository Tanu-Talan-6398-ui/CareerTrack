/* =========================================================
   planner.js – Academic Planner page
   ========================================================= */

const plannerUI = {
  tab: "tasks",          // "tasks" ya "subjects"
  search: "",
  type: "All",
  subject: "All",
  priority: "All",
  status: "Pending"      // By default sirf pending tasks dikhte hain
};

/* ---------- HELPERS ---------- */

function findAcademicTask(id) {
  return appData.academicTasks.find(function (t) { return t.id === id; });
}

function findSubject(id) {
  return appData.subjects.find(function (s) { return s.id === id; });
}

function subjectNames() {
  return appData.subjects.map(function (s) { return s.name; });
}

// Pending hai aur due date nikal chuki hai
function isTaskOverdue(task) {
  return !task.completed && daysFromToday(task.dueDate) < 0;
}

// Sort ke liye: pehle wali due date pehle (ISO text ko seedha compare kar sakte hain)
function byDueDate(a, b) {
  return a.dueDate.localeCompare(b.dueDate);
}

function plannerStatHTML(label, value, note) {
  return `<div class="card stat">
            <span class="stat-label">${label}</span>
            <span class="stat-value">${value}</span>
            <span class="stat-note">${note}</span>
          </div>`;
}

/* ---------- PAGE SHELL ---------- */

function renderPlannerPage() {
  const view = document.getElementById("app-view");

  view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>🎓 Academic Planner</h1>
        <p>Manage subjects, assignments, exams and deadlines.</p>
      </div>
      <div class="btn-group">
        <button class="btn" id="btn-add-subject">+ Add Subject</button>
        <button class="btn btn-primary" id="btn-add-task">+ Add Task</button>
      </div>
    </div>

    <div class="section" id="planner-summary"></div>

    <div class="tabs" id="planner-tabs">
      <button class="tab${plannerUI.tab === "tasks" ? " active" : ""}" data-tab="tasks">📋 Tasks & Deadlines</button>
      <button class="tab${plannerUI.tab === "subjects" ? " active" : ""}" data-tab="subjects">📚 Subjects & Units</button>
    </div>

    <div id="planner-panel"></div>
  `;

  document.getElementById("btn-add-task").addEventListener("click", function () { openTaskForm(null); });
  document.getElementById("btn-add-subject").addEventListener("click", function () { openSubjectForm(null); });

  document.getElementById("planner-tabs").addEventListener("click", function (e) {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    plannerUI.tab = btn.dataset.tab;
    renderPlannerPage();
  });

  // Ek hi listener panel ke saare buttons ke liye
  const panel = document.getElementById("planner-panel");
  panel.addEventListener("click", handlePlannerClick);
  panel.addEventListener("change", handlePlannerChange);

  refreshPlanner();
}

function refreshPlanner() {
  renderPlannerSummary();
  renderPlannerPanel();
}

/* ---------- SUMMARY: stats + upcoming deadlines ---------- */

function renderPlannerSummary() {
  const all = appData.academicTasks;
  const pending = all.filter(function (t) { return !t.completed; });
  const overdueCount = pending.filter(isTaskOverdue).length;
  const dueSoon = pending.filter(function (t) {
    const d = daysFromToday(t.dueDate);
    return d >= 0 && d <= 7;
  }).length;

  const upcoming = pending.slice().sort(byDueDate).slice(0, 5);

  const upcomingHTML = upcoming.length === 0
    ? '<div class="empty"><div class="empty-icon">🎉</div><p>No pending deadlines. You are all caught up!</p></div>'
    : upcoming.map(function (t) {
        const badge = isTaskOverdue(t) ? "red" : (daysFromToday(t.dueDate) <= 2 ? "orange" : "");
        return `
          <div class="item">
            <div class="item-main">
              <div class="item-title">${escapeHTML(t.title)}</div>
              <div class="item-meta">
                <span class="badge gray">${escapeHTML(t.type)}</span>
                <span>${escapeHTML(t.subject)}</span>
                <span>📅 ${formatDate(t.dueDate)}</span>
              </div>
            </div>
            <span class="badge ${badge}">${relativeDayLabel(t.dueDate)}</span>
          </div>`;
      }).join("");

  document.getElementById("planner-summary").innerHTML = `
    <div class="grid grid-4" style="margin-bottom:16px">
      ${plannerStatHTML("Pending tasks", pending.length, "still to complete")}
      ${plannerStatHTML("Completed", all.length - pending.length, "tasks finished")}
      ${plannerStatHTML("Due in 7 days", dueSoon, "needs attention soon")}
      ${plannerStatHTML("Overdue", overdueCount, overdueCount ? "finish these first" : "nothing overdue 👍")}
    </div>
    <div class="card">
      <div class="card-title"><h2>⏰ Upcoming deadlines</h2></div>
      <div class="list">${upcomingHTML}</div>
    </div>`;
}

/* ---------- PANEL (tab ke hisaab se) ---------- */

function renderPlannerPanel() {
  const panel = document.getElementById("planner-panel");

  if (plannerUI.tab === "subjects") {
    panel.innerHTML = renderSubjectsHTML();
    return;
  }

  // Agar filter wala subject delete ho chuka hai to filter hata do
  if (plannerUI.subject !== "All" && !subjectNames().includes(plannerUI.subject)) {
    plannerUI.subject = "All";
  }

  panel.innerHTML = `
    <div class="toolbar">
      <input type="search" id="task-search" class="grow" placeholder="Search tasks..." value="${escapeHTML(plannerUI.search)}">
      <select id="task-filter-type">${optionsHTML(["All"].concat(ACADEMIC_TYPES), plannerUI.type)}</select>
      <select id="task-filter-subject">${optionsHTML(["All"].concat(subjectNames()), plannerUI.subject)}</select>
      <select id="task-filter-priority">${optionsHTML(["All"].concat(PRIORITIES), plannerUI.priority)}</select>
      <select id="task-filter-status">${optionsHTML(["All", "Pending", "Completed", "Overdue"], plannerUI.status)}</select>
    </div>
    <div class="list" id="task-list"></div>`;

  document.getElementById("task-search").addEventListener("input", function () {
    plannerUI.search = this.value;
    renderTaskList();
  });
  [["task-filter-type", "type"], ["task-filter-subject", "subject"],
   ["task-filter-priority", "priority"], ["task-filter-status", "status"]].forEach(function (pair) {
    document.getElementById(pair[0]).addEventListener("change", function () {
      plannerUI[pair[1]] = this.value;
      renderTaskList();
    });
  });

  renderTaskList();
}

/* ---------- TASKS LIST ---------- */

function renderTaskList() {
  const box = document.getElementById("task-list");
  const q = plannerUI.search.trim().toLowerCase();

  const tasks = appData.academicTasks.filter(function (t) {
    if (q && !(t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q))) return false;
    if (plannerUI.type !== "All" && t.type !== plannerUI.type) return false;
    if (plannerUI.subject !== "All" && t.subject !== plannerUI.subject) return false;
    if (plannerUI.priority !== "All" && t.priority !== plannerUI.priority) return false;
    if (plannerUI.status === "Pending" && t.completed) return false;
    if (plannerUI.status === "Completed" && !t.completed) return false;
    if (plannerUI.status === "Overdue" && !isTaskOverdue(t)) return false;
    return true;
  });

  // Pending pehle, phir completed. Andar due date ke hisaab se.
  tasks.sort(function (a, b) {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return byDueDate(a, b);
  });

  if (tasks.length === 0) {
    box.innerHTML = '<div class="empty"><div class="empty-icon">📭</div><p>No tasks found. Try changing the filters or click "+ Add Task".</p></div>';
    return;
  }

  box.innerHTML = tasks.map(taskItemHTML).join("");
}

function taskItemHTML(task) {
  const overdue = isTaskOverdue(task);
  let dueBadge = "";
  if (!task.completed) {
    const cls = overdue ? "red" : (daysFromToday(task.dueDate) <= 2 ? "orange" : "");
    dueBadge = '<span class="badge ' + cls + '">' + relativeDayLabel(task.dueDate) + "</span>";
  }

  return `
    <div class="item${task.completed ? " done" : ""}">
      <div class="item-main">
        <div class="item-title">${escapeHTML(task.title)}</div>
        <div class="item-meta">
          <span class="badge gray">${escapeHTML(task.type)}</span>
          <span>${escapeHTML(task.subject)}</span>
          <span>📅 ${formatDate(task.dueDate)}</span>
          <span>⏱ ${formatMinutes(task.estimatedMinutes)}</span>
          <span class="badge ${priorityBadgeClass(task.priority)}">${escapeHTML(task.priority)} priority</span>
          ${dueBadge}
        </div>
        ${task.unitsNote ? '<div class="item-meta">📝 ' + escapeHTML(task.unitsNote) + "</div>" : ""}
      </div>
      <div class="item-actions">
        <button class="btn btn-sm ${task.completed ? "" : "btn-success"}" data-action="toggle-task" data-id="${task.id}">${task.completed ? "↩ Undo" : "✓ Done"}</button>
        <button class="btn btn-sm" data-action="edit-task" data-id="${task.id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-action="delete-task" data-id="${task.id}">Delete</button>
      </div>
    </div>`;
}

/* ---------- SUBJECTS TAB ---------- */

function renderSubjectsHTML() {
  if (appData.subjects.length === 0) {
    return '<div class="empty"><div class="empty-icon">📚</div><p>No subjects yet. Click "+ Add Subject" to start.</p></div>';
  }
  return '<div class="grid grid-2">' + appData.subjects.map(subjectCardHTML).join("") + "</div>";
}

function subjectCardHTML(subject) {
  const doneUnits = subject.units.filter(function (u) { return u.done; }).length;
  const percent = percentOf(doneUnits, subject.units.length);
  const pendingTasks = appData.academicTasks.filter(function (t) {
    return t.subject === subject.name && !t.completed;
  }).length;

  const unitsHTML = subject.units.length === 0
    ? '<p class="muted small">No units yet. Add your first unit.</p>'
    : '<div class="list">' + subject.units.map(function (u) {
        return `
          <div class="item${u.done ? " done" : ""}" style="padding:8px 12px">
            <label class="item-main" style="display:flex; gap:10px; align-items:center; cursor:pointer;">
              <input type="checkbox" data-action="toggle-unit" data-subject="${subject.id}" data-id="${u.id}"${u.done ? " checked" : ""}>
              <span class="item-title">${escapeHTML(u.title)}</span>
            </label>
            <div class="item-actions">
              <button class="btn btn-sm" data-action="edit-unit" data-subject="${subject.id}" data-id="${u.id}">Edit</button>
              <button class="btn btn-sm btn-danger" data-action="delete-unit" data-subject="${subject.id}" data-id="${u.id}">✕</button>
            </div>
          </div>`;
      }).join("") + "</div>";

  return `
    <div class="card">
      <div class="card-title">
        <h2>${escapeHTML(subject.name)}</h2>
        <span class="badge ${pendingTasks ? "orange" : "green"}">${pendingTasks} pending task${pendingTasks === 1 ? "" : "s"}</span>
      </div>
      <div class="progress-row"><span class="muted small">${doneUnits}/${subject.units.length} units completed</span><strong>${percent}%</strong></div>
      ${progressBarHTML(percent, percent === 100 ? "green" : "")}
      <div style="margin:14px 0">${unitsHTML}</div>
      <div class="btn-group">
        <button class="btn btn-sm btn-primary" data-action="add-unit" data-subject="${subject.id}">+ Add unit</button>
        <button class="btn btn-sm" data-action="rename-subject" data-subject="${subject.id}">Rename</button>
        <button class="btn btn-sm btn-danger" data-action="delete-subject" data-subject="${subject.id}">Delete</button>
      </div>
    </div>`;
}

/* ---------- EVENT HANDLERS ---------- */

function handlePlannerClick(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;

  const action = el.dataset.action;
  const id = el.dataset.id;
  const subjectId = el.dataset.subject;

  if (action === "toggle-task") {
    const task = findAcademicTask(id);
    task.completed = !task.completed;
    saveData();
    refreshPlanner();
    showToast(task.completed ? "Task marked as done. ✅" : "Task moved back to pending.", "success");

  } else if (action === "edit-task") {
    openTaskForm(id);

  } else if (action === "delete-task") {
    const task = findAcademicTask(id);
    confirmAction("Delete the task \"" + task.title + "\"?", function () {
      appData.academicTasks = appData.academicTasks.filter(function (t) { return t.id !== id; });
      saveData();
      refreshPlanner();
      showToast("Task deleted.", "success");
    });

  } else if (action === "add-unit") {
    openUnitForm(subjectId, null);

  } else if (action === "edit-unit") {
    openUnitForm(subjectId, id);

  } else if (action === "delete-unit") {
    const subject = findSubject(subjectId);
    const unit = subject.units.find(function (u) { return u.id === id; });
    confirmAction("Delete the unit \"" + unit.title + "\"?", function () {
      subject.units = subject.units.filter(function (u) { return u.id !== id; });
      saveData();
      refreshPlanner();
      showToast("Unit deleted.", "success");
    });

  } else if (action === "rename-subject") {
    openSubjectForm(subjectId);

  } else if (action === "delete-subject") {
    const subject = findSubject(subjectId);
    const taskCount = appData.academicTasks.filter(function (t) { return t.subject === subject.name; }).length;
    const message = "Delete the subject \"" + subject.name + "\"? Its " + subject.units.length +
      " unit(s) and " + taskCount + " task(s) will also be deleted.";
    confirmAction(message, function () {
      appData.academicTasks = appData.academicTasks.filter(function (t) { return t.subject !== subject.name; });
      appData.subjects = appData.subjects.filter(function (s) { return s.id !== subjectId; });
      saveData();
      refreshPlanner();
      showToast("Subject deleted.", "success");
    });
  }
}

// Unit ka checkbox
function handlePlannerChange(e) {
  const el = e.target.closest("[data-action]");
  if (!el || el.dataset.action !== "toggle-unit") return;

  const subject = findSubject(el.dataset.subject);
  const unit = subject.units.find(function (u) { return u.id === el.dataset.id; });
  unit.done = el.checked;
  saveData();
  refreshPlanner();
}

/* ---------- FORMS ---------- */

// Task add / edit form. taskId = null matlab naya task
function openTaskForm(taskId) {
  if (appData.subjects.length === 0) {
    showToast("Please add a subject first.", "error");
    return;
  }

  const editing = taskId ? findAcademicTask(taskId) : null;
  const t = editing || {
    title: "", subject: appData.subjects[0].name, type: "Assignment",
    dueDate: addDays(todayISO(), 7), estimatedMinutes: 60, priority: "Medium", unitsNote: ""
  };

  const body = `
    <div class="form-grid">
      <div class="form-group full">
        <label>Title *</label>
        <input name="title" value="${escapeHTML(t.title)}" placeholder="e.g. DBMS Assignment 3">
        <div class="error-text" data-error-for="title"></div>
      </div>
      <div class="form-group">
        <label>Subject *</label>
        <select name="subject">${optionsHTML(subjectNames(), t.subject)}</select>
      </div>
      <div class="form-group">
        <label>Type</label>
        <select name="type">${optionsHTML(ACADEMIC_TYPES, t.type)}</select>
      </div>
      <div class="form-group">
        <label>Due date *</label>
        <input type="date" name="dueDate" value="${escapeHTML(t.dueDate)}">
        <div class="error-text" data-error-for="dueDate"></div>
      </div>
      <div class="form-group">
        <label>Estimated study time (minutes) *</label>
        <input type="number" name="minutes" min="5" max="600" step="5" value="${t.estimatedMinutes}">
        <div class="error-text" data-error-for="minutes"></div>
      </div>
      <div class="form-group">
        <label>Priority</label>
        <select name="priority">${optionsHTML(PRIORITIES, t.priority)}</select>
      </div>
      <div class="form-group">
        <label>Units / topics covered</label>
        <input name="unitsNote" value="${escapeHTML(t.unitsNote)}" placeholder="e.g. Unit 2: ER model">
      </div>
    </div>`;

  openModal(editing ? "Edit task" : "Add task", body, function (form) {
    clearFieldErrors(form);

    const title = getField(form, "title");
    const dueDate = getField(form, "dueDate");
    const minutes = Number(getField(form, "minutes"));
    let valid = true;

    if (!title) { showFieldError(form, "title", "Title is required."); valid = false; }
    if (!dueDate) { showFieldError(form, "dueDate", "Please choose a due date."); valid = false; }
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 600) {
      showFieldError(form, "minutes", "Enter whole minutes between 5 and 600.");
      valid = false;
    }
    if (!valid) return false;     // popup khula rahega

    const values = {
      title: title,
      subject: getField(form, "subject"),
      type: getField(form, "type"),
      dueDate: dueDate,
      estimatedMinutes: minutes,
      priority: getField(form, "priority"),
      unitsNote: getField(form, "unitsNote")
    };

    if (editing) {
      Object.assign(editing, values);
    } else {
      values.id = generateId("acad");
      values.completed = false;
      appData.academicTasks.push(values);
    }

    saveData();
    refreshPlanner();
    showToast(editing ? "Task updated." : "Task added.", "success");
  });
}

// Subject add / rename form
function openSubjectForm(subjectId) {
  const editing = subjectId ? findSubject(subjectId) : null;

  const body = `
    <div class="form-group">
      <label>Subject name *</label>
      <input name="name" value="${escapeHTML(editing ? editing.name : "")}" placeholder="e.g. Computer Networks">
      <div class="error-text" data-error-for="name"></div>
    </div>`;

  openModal(editing ? "Rename subject" : "Add subject", body, function (form) {
    clearFieldErrors(form);
    const name = getField(form, "name");

    if (!name) return showFieldError(form, "name", "Subject name is required.");

    // Same naam ka doosra subject nahi hona chahiye
    const duplicate = appData.subjects.some(function (s) {
      return (!editing || s.id !== editing.id) && s.name.toLowerCase() === name.toLowerCase();
    });
    if (duplicate) return showFieldError(form, "name", "This subject already exists.");

    if (editing) {
      const oldName = editing.name;
      editing.name = name;
      // Is subject ke saare tasks ka naam bhi badlo
      appData.academicTasks.forEach(function (t) {
        if (t.subject === oldName) t.subject = name;
      });
      if (plannerUI.subject === oldName) plannerUI.subject = name;
    } else {
      appData.subjects.push({ id: generateId("subj"), name: name, units: [] });
    }

    saveData();
    refreshPlanner();
    showToast(editing ? "Subject renamed." : "Subject added.", "success");
  });
}

// Unit add / edit form
function openUnitForm(subjectId, unitId) {
  const subject = findSubject(subjectId);
  const editing = unitId ? subject.units.find(function (u) { return u.id === unitId; }) : null;

  const body = `
    <div class="form-group">
      <label>Unit name and topics *</label>
      <input name="title" value="${escapeHTML(editing ? editing.title : "")}" placeholder="e.g. Unit 3 – Normalization">
      <div class="error-text" data-error-for="title"></div>
    </div>`;

  openModal(editing ? "Edit unit" : "Add unit to " + subject.name, body, function (form) {
    clearFieldErrors(form);
    const title = getField(form, "title");
    if (!title) return showFieldError(form, "title", "Unit name is required.");

    if (editing) {
      editing.title = title;
    } else {
      subject.units.push({ id: generateId("unit"), title: title, done: false });
    }

    saveData();
    refreshPlanner();
    showToast(editing ? "Unit updated." : "Unit added.", "success");
  });
}