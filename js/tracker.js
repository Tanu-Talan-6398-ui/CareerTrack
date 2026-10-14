/* =========================================================
   tracker.js – DSA Tracker, Skills Tracker, Projects, Applications
   ========================================================= */

/* ============================================================
   SECTION A: DSA TRACKER
   ============================================================ */

const dsaUI = { search: "", topic: "All", difficulty: "All", status: "All", revisionOnly: false };

function findDsaQuestion(id) {
  return appData.dsaQuestions.find(function (q) { return q.id === id; });
}

// DSA category ke topics ki list (roadmap se, taaki dono jagah naam match karein)
function dsaTopicNames() {
  return appData.roadmap.filter(function (t) { return t.category === "DSA"; }).map(function (t) { return t.name; });
}

function dsaDifficultyBadge(d) {
  if (d === "Easy") return "green";
  if (d === "Medium") return "orange";
  return "red";
}
function dsaStatusBadge(s) {
  if (s === "Solved") return "green";
  if (s === "Attempted") return "orange";
  return "gray";
}

function renderDsaPage() {
  const view = document.getElementById("app-view");
  view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>💻 DSA Tracker</h1>
        <p>Track coding questions topic-wise and revise the ones that need more practice.</p>
      </div>
      <button class="btn btn-primary" id="btn-add-dsa">+ Add question</button>
    </div>

    <div class="section" id="dsa-summary"></div>

    <div class="toolbar">
      <input type="search" id="dsa-search" class="grow" placeholder="Search questions..." value="${escapeHTML(dsaUI.search)}">
      <select id="dsa-topic">${optionsHTML(["All"].concat(dsaTopicNames()), dsaUI.topic)}</select>
      <select id="dsa-difficulty">${optionsHTML(["All"].concat(DSA_DIFFICULTIES), dsaUI.difficulty)}</select>
      <select id="dsa-status">${optionsHTML(["All"].concat(DSA_STATUSES), dsaUI.status)}</select>
      <label class="btn btn-sm" style="cursor:pointer">
        <input type="checkbox" id="dsa-revision-only" ${dsaUI.revisionOnly ? "checked" : ""} style="width:auto;margin-right:6px">
        For revision only
      </label>
    </div>

    <div class="list" id="dsa-list"></div>
  `;

  document.getElementById("btn-add-dsa").addEventListener("click", function () { openDsaForm(null); });

  document.getElementById("dsa-search").addEventListener("input", function () { dsaUI.search = this.value; renderDsaList(); });
  document.getElementById("dsa-topic").addEventListener("change", function () { dsaUI.topic = this.value; renderDsaList(); });
  document.getElementById("dsa-difficulty").addEventListener("change", function () { dsaUI.difficulty = this.value; renderDsaList(); });
  document.getElementById("dsa-status").addEventListener("change", function () { dsaUI.status = this.value; renderDsaList(); });
  document.getElementById("dsa-revision-only").addEventListener("change", function () { dsaUI.revisionOnly = this.checked; renderDsaList(); });

  document.getElementById("dsa-list").addEventListener("click", handleDsaClick);

  refreshDsa();
}

function refreshDsa() {
  renderDsaSummary();
  renderDsaList();
}

function renderDsaSummary() {
  const all = appData.dsaQuestions;
  const solved = all.filter(function (q) { return q.status === "Solved"; });
  const attempted = all.filter(function (q) { return q.status === "Attempted"; }).length;
  const forRevision = all.filter(function (q) { return q.markedForRevision; }).length;

  const perDifficulty = DSA_DIFFICULTIES.map(function (d) {
    const totalOfDiff = all.filter(function (q) { return q.difficulty === d; }).length;
    const solvedOfDiff = solved.filter(function (q) { return q.difficulty === d; }).length;
    return `<div>
              <div class="progress-row"><span>${d}</span><strong>${solvedOfDiff}/${totalOfDiff}</strong></div>
              ${progressBarHTML(percentOf(solvedOfDiff, totalOfDiff), d === "Easy" ? "green" : d === "Hard" ? "" : "orange")}
            </div>`;
  }).join("");

  document.getElementById("dsa-summary").innerHTML = `
    <div class="grid grid-4" style="margin-bottom:16px">
      ${plannerStatHTML("Total questions", all.length, "in your tracker")}
      ${plannerStatHTML("Solved", solved.length, percentOf(solved.length, all.length) + "% of all questions")}
      ${plannerStatHTML("Attempted", attempted, "in progress")}
      ${plannerStatHTML("Marked for revision", forRevision, "need another look")}
    </div>
    <div class="card">
      <div class="card-title"><h2>Progress by difficulty</h2></div>
      <div class="grid grid-3">${perDifficulty}</div>
    </div>`;
}

function renderDsaList() {
  const box = document.getElementById("dsa-list");
  const q = dsaUI.search.trim().toLowerCase();

  const questions = appData.dsaQuestions.filter(function (item) {
    if (q && !item.title.toLowerCase().includes(q)) return false;
    if (dsaUI.topic !== "All" && item.topic !== dsaUI.topic) return false;
    if (dsaUI.difficulty !== "All" && item.difficulty !== dsaUI.difficulty) return false;
    if (dsaUI.status !== "All" && item.status !== dsaUI.status) return false;
    if (dsaUI.revisionOnly && !item.markedForRevision) return false;
    return true;
  });

  if (questions.length === 0) {
    box.innerHTML = '<div class="empty"><div class="empty-icon">💻</div><p>No questions match your filters. Try "+ Add question".</p></div>';
    return;
  }

  box.innerHTML = questions.map(function (item) {
    const linkHTML = item.link
      ? '<a href="' + escapeHTML(item.link) + '" target="_blank" rel="noopener">🔗 Solution link</a>'
      : "";
    return `
      <div class="item">
        <div class="item-main">
          <div class="item-title">${escapeHTML(item.title)} ${item.markedForRevision ? '<span class="badge orange">🔁 revise</span>' : ""}</div>
          <div class="item-meta">
            <span class="badge gray">${escapeHTML(item.topic)}</span>
            <span class="badge ${dsaDifficultyBadge(item.difficulty)}">${escapeHTML(item.difficulty)}</span>
            <span class="badge ${dsaStatusBadge(item.status)}">${escapeHTML(item.status)}</span>
            ${item.dateSolved ? "<span>Solved on " + formatDate(item.dateSolved) + "</span>" : ""}
            ${linkHTML}
          </div>
          ${item.notes ? '<div class="item-meta">📝 ' + escapeHTML(item.notes) + "</div>" : ""}
        </div>
        <div class="item-actions">
          <button class="btn btn-sm" data-action="edit-dsa" data-id="${item.id}">Edit</button>
          <button class="btn btn-sm btn-danger" data-action="delete-dsa" data-id="${item.id}">Delete</button>
        </div>
      </div>`;
  }).join("");
}

function handleDsaClick(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const item = findDsaQuestion(el.dataset.id);
  if (!item) return;

  if (el.dataset.action === "edit-dsa") {
    openDsaForm(item.id);
  } else if (el.dataset.action === "delete-dsa") {
    confirmAction("Delete the question \"" + item.title + "\"?", function () {
      appData.dsaQuestions = appData.dsaQuestions.filter(function (q) { return q.id !== item.id; });
      saveData();
      refreshDsa();
      showToast("Question deleted.", "success");
    });
  }
}

function openDsaForm(id) {
  const editing = id ? findDsaQuestion(id) : null;
  const q = editing || {
    title: "", topic: dsaTopicNames()[0] || "Arrays", difficulty: "Easy", status: "Not Started",
    dateSolved: "", link: "", notes: "", markedForRevision: false
  };

  const body = `
    <div class="form-grid">
      <div class="form-group full">
        <label>Question title *</label>
        <input name="title" value="${escapeHTML(q.title)}" placeholder="e.g. Two Sum">
        <div class="error-text" data-error-for="title"></div>
      </div>
      <div class="form-group">
        <label>Topic</label>
        <select name="topic">${optionsHTML(dsaTopicNames(), q.topic)}</select>
      </div>
      <div class="form-group">
        <label>Difficulty</label>
        <select name="difficulty">${optionsHTML(DSA_DIFFICULTIES, q.difficulty)}</select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select name="status">${optionsHTML(DSA_STATUSES, q.status)}</select>
      </div>
      <div class="form-group">
        <label>Date solved</label>
        <input type="date" name="dateSolved" value="${escapeHTML(q.dateSolved)}">
      </div>
      <div class="form-group full">
        <label>Solution link</label>
        <input type="url" name="link" value="${escapeHTML(q.link)}" placeholder="https://leetcode.com/...">
        <div class="error-text" data-error-for="link"></div>
      </div>
      <div class="form-group full">
        <label>Notes</label>
        <textarea name="notes" placeholder="Approach, mistakes, things to remember...">${escapeHTML(q.notes)}</textarea>
      </div>
      <div class="form-group full">
        <label style="display:flex; align-items:center; gap:8px; font-weight:500">
          <input type="checkbox" name="markedForRevision" style="width:auto" ${q.markedForRevision ? "checked" : ""}>
          Mark this question for revision
        </label>
      </div>
    </div>`;

  openModal(editing ? "Edit question" : "Add question", body, function (form) {
    clearFieldErrors(form);
    const title = getField(form, "title");
    const link = getField(form, "link");
    let valid = true;

    if (!title) { showFieldError(form, "title", "Title is required."); valid = false; }
    if (link && !/^https?:\/\//i.test(link)) { showFieldError(form, "link", "Link should start with http:// or https://"); valid = false; }
    if (!valid) return false;

    const values = {
      title: title, topic: getField(form, "topic"), difficulty: getField(form, "difficulty"),
      status: getField(form, "status"), dateSolved: getField(form, "dateSolved"),
      link: link, notes: getField(form, "notes"), markedForRevision: form.elements.markedForRevision.checked
    };

    // Agar status "Solved" hai aur date khali hai, to aaj ki date bhar do
    if (values.status === "Solved" && !values.dateSolved) values.dateSolved = todayISO();

    if (editing) {
      Object.assign(editing, values);
    } else {
      values.id = generateId("dsa");
      appData.dsaQuestions.push(values);
    }

    saveData();
    refreshDsa();
    showToast(editing ? "Question updated." : "Question added.", "success");
  });
}

/* ============================================================
   SECTION B: SKILLS TRACKER
   ============================================================ */

function findSkill(id) {
  return appData.skills.find(function (s) { return s.id === id; });
}

function renderSkillsPage() {
  const view = document.getElementById("app-view");
  view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>🛠️ Skills Tracker</h1>
        <p>Track your learning progress across technical and soft skills.</p>
      </div>
      <button class="btn btn-primary" id="btn-add-skill">+ Add skill</button>
    </div>
    <div class="grid grid-2" id="skills-list"></div>
  `;

  document.getElementById("btn-add-skill").addEventListener("click", function () { openSkillForm(null); });
  document.getElementById("skills-list").addEventListener("click", handleSkillClick);

  renderSkillsList();
}

function renderSkillsList() {
  const box = document.getElementById("skills-list");
  if (appData.skills.length === 0) {
    box.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🛠️</div><p>No skills yet. Click "+ Add skill" to start tracking.</p></div>';
    return;
  }

  box.innerHTML = appData.skills.map(function (s) {
    return `
      <div class="card">
        <div class="card-title">
          <h2>${escapeHTML(s.name)}</h2>
          <strong>${s.progress}%</strong>
        </div>
        ${progressBarHTML(s.progress, s.progress === 100 ? "green" : "")}
        <p class="small muted" style="margin-top:12px"><strong>Goal:</strong> ${escapeHTML(s.goal || "—")}</p>
        <p class="small muted" style="margin-top:6px"><strong>Completed so far:</strong> ${escapeHTML(s.topicsCompleted || "—")}</p>
        ${s.notes ? '<p class="small muted" style="margin-top:6px">📝 ' + escapeHTML(s.notes) + "</p>" : ""}
        <div class="btn-group" style="margin-top:14px">
          <button class="btn btn-sm" data-action="edit-skill" data-id="${s.id}">Edit</button>
          <button class="btn btn-sm btn-danger" data-action="delete-skill" data-id="${s.id}">Delete</button>
        </div>
      </div>`;
  }).join("");
}

function handleSkillClick(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const skill = findSkill(el.dataset.id);
  if (!skill) return;

  if (el.dataset.action === "edit-skill") {
    openSkillForm(skill.id);
  } else if (el.dataset.action === "delete-skill") {
    confirmAction("Delete the skill \"" + skill.name + "\"?", function () {
      appData.skills = appData.skills.filter(function (s) { return s.id !== skill.id; });
      saveData();
      renderSkillsList();
      showToast("Skill deleted.", "success");
    });
  }
}

function openSkillForm(id) {
  const editing = id ? findSkill(id) : null;
  const s = editing || { name: "", goal: "", topicsCompleted: "", progress: 0, notes: "" };

  const body = `
    <div class="form-grid">
      <div class="form-group full">
        <label>Skill name *</label>
        <input name="name" value="${escapeHTML(s.name)}" placeholder="e.g. Python">
        <div class="error-text" data-error-for="name"></div>
      </div>
      <div class="form-group full">
        <label>Learning goal</label>
        <input name="goal" value="${escapeHTML(s.goal)}" placeholder="e.g. Build 2 projects">
      </div>
      <div class="form-group full">
        <label>Topics completed</label>
        <input name="topicsCompleted" value="${escapeHTML(s.topicsCompleted)}" placeholder="e.g. Basics, Loops, Functions">
      </div>
      <div class="form-group">
        <label>Progress (%) *</label>
        <input type="number" name="progress" min="0" max="100" step="5" value="${s.progress}">
        <div class="error-text" data-error-for="progress"></div>
      </div>
      <div class="form-group full">
        <label>Notes</label>
        <textarea name="notes">${escapeHTML(s.notes)}</textarea>
      </div>
    </div>`;

  openModal(editing ? "Edit skill" : "Add skill", body, function (form) {
    clearFieldErrors(form);
    const name = getField(form, "name");
    const progress = Number(getField(form, "progress"));
    let valid = true;

    if (!name) { showFieldError(form, "name", "Skill name is required."); valid = false; }
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      showFieldError(form, "progress", "Enter a whole number between 0 and 100.");
      valid = false;
    }
    if (!valid) return false;

    const values = {
      name: name, goal: getField(form, "goal"), topicsCompleted: getField(form, "topicsCompleted"),
      progress: progress, notes: getField(form, "notes")
    };

    if (editing) {
      Object.assign(editing, values);
    } else {
      values.id = generateId("skill");
      appData.skills.push(values);
    }

    saveData();
    renderSkillsList();
    showToast(editing ? "Skill updated." : "Skill added.", "success");
  });
}

/* ============================================================
   SECTION C: PROJECTS TRACKER
   ============================================================ */

function findProject(id) {
  return appData.projects.find(function (p) { return p.id === id; });
}

function projectStatusBadge(status) {
  if (status === "Completed") return "green";
  if (status === "In Progress") return "orange";
  if (status === "On Hold") return "red";
  return "gray";
}

function renderProjectsPage() {
  const view = document.getElementById("app-view");
  view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>📁 Projects Tracker</h1>
        <p>Track your placement and personal projects, and their tasks.</p>
      </div>
      <button class="btn btn-primary" id="btn-add-project">+ Add project</button>
    </div>
    <div class="grid grid-2" id="projects-list"></div>
  `;

  document.getElementById("btn-add-project").addEventListener("click", function () { openProjectForm(null); });

  const box = document.getElementById("projects-list");
  box.addEventListener("click", handleProjectClick);
  box.addEventListener("change", handleProjectChange);

  renderProjectsList();
}

function renderProjectsList() {
  const box = document.getElementById("projects-list");
  if (appData.projects.length === 0) {
    box.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📁</div><p>No projects yet. Click "+ Add project" to start.</p></div>';
    return;
  }
  box.innerHTML = appData.projects.map(projectCardHTML).join("");
}

function projectCardHTML(p) {
  const doneTasks = p.tasks.filter(function (t) { return t.done; }).length;
  const percent = percentOf(doneTasks, p.tasks.length);

  const tasksHTML = p.tasks.length === 0
    ? '<p class="muted small">No tasks yet.</p>'
    : '<div class="list">' + p.tasks.map(function (t) {
        return `
          <div class="item${t.done ? " done" : ""}" style="padding:6px 10px">
            <label class="item-main" style="display:flex; gap:8px; align-items:center; cursor:pointer">
              <input type="checkbox" data-action="toggle-ptask" data-project="${p.id}" data-id="${t.id}" ${t.done ? "checked" : ""}>
              <span class="small">${escapeHTML(t.title)}</span>
            </label>
            <button class="btn btn-sm btn-danger" data-action="delete-ptask" data-project="${p.id}" data-id="${t.id}">✕</button>
          </div>`;
      }).join("") + "</div>";

  const links = [];
  if (p.githubLink) links.push('<a href="' + escapeHTML(p.githubLink) + '" target="_blank" rel="noopener">🔗 GitHub</a>');
  if (p.deployLink) links.push('<a href="' + escapeHTML(p.deployLink) + '" target="_blank" rel="noopener">🌐 Live demo</a>');

  return `
    <div class="card">
      <div class="card-title">
        <h2>${escapeHTML(p.name)}</h2>
        <span class="badge ${projectStatusBadge(p.status)}">${escapeHTML(p.status)}</span>
      </div>
      <p class="small muted">${escapeHTML(p.description || "No description yet.")}</p>
      <div class="item-meta" style="margin:10px 0">
        ${p.techStack ? '<span class="badge gray">' + escapeHTML(p.techStack) + "</span>" : ""}
        ${p.deadline ? "<span>📅 " + formatDate(p.deadline) + "</span>" : ""}
        ${links.join(" ")}
      </div>
      <div class="progress-row"><span class="muted small">${doneTasks}/${p.tasks.length} tasks done</span><strong>${percent}%</strong></div>
      ${progressBarHTML(percent, percent === 100 ? "green" : "")}
      <div style="margin:12px 0">${tasksHTML}</div>
      <div class="btn-group">
        <button class="btn btn-sm btn-primary" data-action="add-ptask" data-project="${p.id}">+ Add task</button>
        <button class="btn btn-sm" data-action="edit-project" data-project="${p.id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-action="delete-project" data-project="${p.id}">Delete</button>
      </div>
    </div>`;
}

function handleProjectClick(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const project = findProject(el.dataset.project);
  if (!project) return;
  const action = el.dataset.action;

  if (action === "add-ptask") {
    openProjectTaskForm(project.id);

  } else if (action === "delete-ptask") {
    project.tasks = project.tasks.filter(function (t) { return t.id !== el.dataset.id; });
    saveData();
    renderProjectsList();

  } else if (action === "edit-project") {
    openProjectForm(project.id);

  } else if (action === "delete-project") {
    confirmAction("Delete the project \"" + project.name + "\"? All its tasks will be deleted too.", function () {
      appData.projects = appData.projects.filter(function (p) { return p.id !== project.id; });
      saveData();
      renderProjectsList();
      showToast("Project deleted.", "success");
    });
  }
}

function handleProjectChange(e) {
  const el = e.target.closest("[data-action='toggle-ptask']");
  if (!el) return;
  const project = findProject(el.dataset.project);
  const task = project.tasks.find(function (t) { return t.id === el.dataset.id; });
  task.done = el.checked;
  saveData();
  renderProjectsList();
}

function openProjectTaskForm(projectId) {
  const body = `
    <div class="form-group">
      <label>Task *</label>
      <input name="title" placeholder="e.g. Connect to database">
      <div class="error-text" data-error-for="title"></div>
    </div>`;

  openModal("Add task", body, function (form) {
    clearFieldErrors(form);
    const title = getField(form, "title");
    if (!title) return showFieldError(form, "title", "Task is required.");

    const project = findProject(projectId);
    project.tasks.push({ id: generateId("ptask"), title: title, done: false });
    saveData();
    renderProjectsList();
    showToast("Task added.", "success");
  });
}

function openProjectForm(id) {
  const editing = id ? findProject(id) : null;
  const p = editing || {
    name: "", description: "", techStack: "", status: "Planning",
    deadline: addDays(todayISO(), 30), githubLink: "", deployLink: ""
  };

  const body = `
    <div class="form-grid">
      <div class="form-group full">
        <label>Project name *</label>
        <input name="name" value="${escapeHTML(p.name)}" placeholder="e.g. CareerTrack Planner">
        <div class="error-text" data-error-for="name"></div>
      </div>
      <div class="form-group full">
        <label>Description</label>
        <textarea name="description">${escapeHTML(p.description)}</textarea>
      </div>
      <div class="form-group">
        <label>Tech stack</label>
        <input name="techStack" value="${escapeHTML(p.techStack)}" placeholder="e.g. HTML, CSS, JS">
      </div>
      <div class="form-group">
        <label>Status</label>
        <select name="status">${optionsHTML(PROJECT_STATUSES, p.status)}</select>
      </div>
      <div class="form-group">
        <label>Deadline</label>
        <input type="date" name="deadline" value="${escapeHTML(p.deadline)}">
      </div>
      <div class="form-group">
        <label>GitHub link</label>
        <input type="url" name="githubLink" value="${escapeHTML(p.githubLink)}" placeholder="https://github.com/...">
        <div class="error-text" data-error-for="githubLink"></div>
      </div>
      <div class="form-group full">
        <label>Live demo link</label>
        <input type="url" name="deployLink" value="${escapeHTML(p.deployLink)}" placeholder="https://...">
        <div class="error-text" data-error-for="deployLink"></div>
      </div>
    </div>`;

  openModal(editing ? "Edit project" : "Add project", body, function (form) {
    clearFieldErrors(form);
    const name = getField(form, "name");
    const github = getField(form, "githubLink");
    const deploy = getField(form, "deployLink");
    let valid = true;

    if (!name) { showFieldError(form, "name", "Project name is required."); valid = false; }
    if (github && !/^https?:\/\//i.test(github)) { showFieldError(form, "githubLink", "Should start with http:// or https://"); valid = false; }
    if (deploy && !/^https?:\/\//i.test(deploy)) { showFieldError(form, "deployLink", "Should start with http:// or https://"); valid = false; }
    if (!valid) return false;

    const values = {
      name: name, description: getField(form, "description"), techStack: getField(form, "techStack"),
      status: getField(form, "status"), deadline: getField(form, "deadline"),
      githubLink: github, deployLink: deploy
    };

    if (editing) {
      Object.assign(editing, values);
    } else {
      values.id = generateId("proj");
      values.tasks = [];
      appData.projects.push(values);
    }

    saveData();
    renderProjectsList();
    showToast(editing ? "Project updated." : "Project added.", "success");
  });
}

/* ============================================================
   SECTION D: PLACEMENT APPLICATION TRACKER
   ============================================================ */

function findApplication(id) {
  return appData.applications.find(function (a) { return a.id === id; });
}

function applicationStatusBadge(status) {
  if (status === "Selected") return "green";
  if (status === "Rejected") return "red";
  if (status === "Interview" || status === "Assessment") return "orange";
  return "gray";
}

function renderApplicationsPage() {
  const view = document.getElementById("app-view");
  view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>💼 Placement Applications</h1>
        <p>Track internship and placement applications end-to-end.</p>
      </div>
      <button class="btn btn-primary" id="btn-add-app">+ Add application</button>
    </div>
    <div class="section" id="app-summary"></div>
    <div class="list" id="app-list"></div>
  `;

  document.getElementById("btn-add-app").addEventListener("click", function () { openApplicationForm(null); });

  const box = document.getElementById("app-list");
  box.addEventListener("click", handleApplicationClick);
  box.addEventListener("change", handleApplicationChange);

  refreshApplications();
}

function refreshApplications() {
  renderApplicationSummary();
  renderApplicationList();
}

function renderApplicationSummary() {
  const all = appData.applications;
  const statsHTML = APPLICATION_STATUSES.map(function (status) {
    const count = all.filter(function (a) { return a.status === status; }).length;
    return `<div class="card stat">
              <span class="stat-label">${status}</span>
              <span class="stat-value">${count}</span>
            </div>`;
  }).join("");

  document.getElementById("app-summary").innerHTML = `<div class="grid grid-3">${statsHTML}</div>`;
}

function renderApplicationList() {
  const box = document.getElementById("app-list");
  if (appData.applications.length === 0) {
    box.innerHTML = '<div class="empty"><div class="empty-icon">💼</div><p>No applications yet. Click "+ Add application" to start tracking.</p></div>';
    return;
  }

  const sorted = appData.applications.slice().sort(function (a, b) {
    return (b.appliedDate || "").localeCompare(a.appliedDate || "");
  });

  box.innerHTML = sorted.map(function (a) {
    return `
      <div class="item">
        <div class="item-main">
          <div class="item-title">${escapeHTML(a.company)} — ${escapeHTML(a.role)}</div>
          <div class="item-meta">
            <span>Applied: ${a.appliedDate ? formatDate(a.appliedDate) : "Not yet applied"}</span>
            ${a.interviewDate ? "<span>🗓 Interview: " + formatDate(a.interviewDate) + "</span>" : ""}
            ${a.link ? '<a href="' + escapeHTML(a.link) + '" target="_blank" rel="noopener">🔗 Job link</a>' : ""}
          </div>
          ${a.notes ? '<div class="item-meta">📝 ' + escapeHTML(a.notes) + "</div>" : ""}
        </div>
        <div class="item-actions">
          <select data-action="change-status" data-id="${a.id}">${optionsHTML(APPLICATION_STATUSES, a.status)}</select>
          <button class="btn btn-sm" data-action="edit-app" data-id="${a.id}">Edit</button>
          <button class="btn btn-sm btn-danger" data-action="delete-app" data-id="${a.id}">Delete</button>
        </div>
      </div>`;
  }).join("");
}

function handleApplicationClick(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const app = findApplication(el.dataset.id);
  if (!app) return;

  if (el.dataset.action === "edit-app") {
    openApplicationForm(app.id);
  } else if (el.dataset.action === "delete-app") {
    confirmAction("Delete the application to \"" + app.company + "\"?", function () {
      appData.applications = appData.applications.filter(function (a) { return a.id !== app.id; });
      saveData();
      refreshApplications();
      showToast("Application deleted.", "success");
    });
  }
}

function handleApplicationChange(e) {
  const el = e.target.closest("[data-action='change-status']");
  if (!el) return;
  const app = findApplication(el.dataset.id);
  app.status = el.value;
  saveData();
  renderApplicationSummary();
  showToast("Status updated to " + app.status + ".", "success");
}

function openApplicationForm(id) {
  const editing = id ? findApplication(id) : null;
  const a = editing || {
    company: "", role: "", appliedDate: todayISO(), status: "Interested",
    interviewDate: "", link: "", notes: ""
  };

  const body = `
    <div class="form-grid">
      <div class="form-group full">
        <label>Company name *</label>
        <input name="company" value="${escapeHTML(a.company)}" placeholder="e.g. TechNova Solutions">
        <div class="error-text" data-error-for="company"></div>
      </div>
      <div class="form-group full">
        <label>Job role *</label>
        <input name="role" value="${escapeHTML(a.role)}" placeholder="e.g. Software Development Intern">
        <div class="error-text" data-error-for="role"></div>
      </div>
      <div class="form-group">
        <label>Application date</label>
        <input type="date" name="appliedDate" value="${escapeHTML(a.appliedDate)}">
      </div>
      <div class="form-group">
        <label>Status</label>
        <select name="status">${optionsHTML(APPLICATION_STATUSES, a.status)}</select>
      </div>
      <div class="form-group">
        <label>Interview date</label>
        <input type="date" name="interviewDate" value="${escapeHTML(a.interviewDate)}">
      </div>
      <div class="form-group">
        <label>Job description link</label>
        <input type="url" name="link" value="${escapeHTML(a.link)}" placeholder="https://...">
        <div class="error-text" data-error-for="link"></div>
      </div>
      <div class="form-group full">
        <label>Notes</label>
        <textarea name="notes">${escapeHTML(a.notes)}</textarea>
      </div>
    </div>`;

  openModal(editing ? "Edit application" : "Add application", body, function (form) {
    clearFieldErrors(form);
    const company = getField(form, "company");
    const role = getField(form, "role");
    const link = getField(form, "link");
    let valid = true;

    if (!company) { showFieldError(form, "company", "Company name is required."); valid = false; }
    if (!role) { showFieldError(form, "role", "Job role is required."); valid = false; }
    if (link && !/^https?:\/\//i.test(link)) { showFieldError(form, "link", "Should start with http:// or https://"); valid = false; }
    if (!valid) return false;

    const values = {
      company: company, role: role, appliedDate: getField(form, "appliedDate"),
      status: getField(form, "status"), interviewDate: getField(form, "interviewDate"),
      link: link, notes: getField(form, "notes")
    };

    if (editing) {
      Object.assign(editing, values);
    } else {
      values.id = generateId("app");
      appData.applications.push(values);
    }

    saveData();
    refreshApplications();
    showToast(editing ? "Application updated." : "Application added.", "success");
  });
}