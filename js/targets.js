/* =========================================================
   targets.js – Today's Targets page (rule-based recommendation)
   ========================================================= */

/* ---------- HELPERS ---------- */

// Aaj ka plan (agar pehli baar hai to khali array bana kar deta hai)
function todaysPlan() {
  const today = todayISO();
  if (!appData.dailyPlans[today]) appData.dailyPlans[today] = [];
  return appData.dailyPlans[today];
}

function planTotalMinutes() {
  return todaysPlan().reduce(function (sum, item) { return sum + item.minutes; }, 0);
}

function planCompletedMinutes() {
  return todaysPlan().filter(function (i) { return i.done; })
    .reduce(function (sum, item) { return sum + item.minutes; }, 0);
}

function remainingMinutes() {
  return Math.max(0, appData.settings.dailyStudyMinutes - planTotalMinutes());
}

// Kya yeh candidate pehle se aaj ke plan me hai?
function isAlreadyInPlan(type, refId) {
  return todaysPlan().some(function (i) { return i.type === type && i.refId === refId; });
}

/* ---------- RECOMMENDATION ENGINE ---------- */

function buildRecommendations() {
  const candidates = [];
  const weight = appData.settings.academicWeight; // "Low" | "Balanced" | "High"

  /* --- 1. Revisions: overdue aur aaj due --- */
  appData.revisions.forEach(function (r) {
    if (r.status !== "Pending") return;
    const diff = daysFromToday(r.dueDate);
    if (diff > 0) return; // future revision, abhi nahi
    candidates.push({
      type: "revision", refId: r.id, title: "Revise: " + r.title, category: r.category,
      minutes: 20,
      score: diff < 0 ? 100 : 90,
      reason: diff < 0 ? Math.abs(diff) + " day(s) overdue — revise before you forget" : "Revision due today"
    });
  });

  /* --- 2. Academic tasks: deadlines aur exams --- */
  appData.academicTasks.forEach(function (t) {
    if (t.completed) return;
    const diff = daysFromToday(t.dueDate);
    if (diff > 14) return; // bahut door ki cheez abhi recommend mat karo

    let score;
    const isExam = t.type === "Internal Exam" || t.type === "Semester Exam";
    if (diff < 0) score = 99;
    else if (isExam && diff <= 3) score = 95;
    else if (isExam && diff <= 7) score = 80;
    else if (t.priority === "High") score = 70;
    else if (t.priority === "Medium") score = 55;
    else score = 40;

    // Academic weight setting se adjust karo
    if (weight === "High") score = Math.min(100, score + 15);
    if (weight === "Low") score = Math.max(0, score - 15);

    let reason;
    if (diff < 0) reason = "Overdue by " + Math.abs(diff) + " day(s)";
    else if (isExam) reason = t.type + " in " + (diff === 0 ? "today" : diff + " day(s)");
    else reason = t.priority + " priority, due in " + diff + " day(s)";

    candidates.push({
      type: "academic", refId: t.id, title: t.title, category: t.subject,
      minutes: Math.min(t.estimatedMinutes, 90), score: score, reason: reason
    });
  });

  /* --- 3. Roadmap topics jo abhi complete nahi hue --- */
  appData.roadmap.forEach(function (topic) {
    if (topic.status === "Completed") return;
    if (!appData.settings.preferredCategories.includes(topic.category)) return;

    let score = topic.status === "In Progress" ? 45 : 30;
    // Bahut din se na padhe topic ko thoda upar utha do
    if (topic.lastStudied && daysFromToday(topic.lastStudied) <= -10) score += 8;

    candidates.push({
      type: "roadmap", refId: topic.id, title: "Study: " + topic.name, category: topic.category,
      minutes: 30, score: score,
      reason: topic.status === "In Progress" ? "Continue this in-progress topic" : "Not started yet"
    });
  });

  // Jo pehle se plan me hai, unhe recommendation me mat dikhao
  const filtered = candidates.filter(function (c) { return !isAlreadyInPlan(c.type, c.refId); });

  filtered.sort(function (a, b) { return b.score - a.score; });
  return filtered.slice(0, 8);
}

/* ---------- PAGE RENDER ---------- */

function renderTargetsPage() {
  const view = document.getElementById("app-view");

  view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>🎯 Today's Targets</h1>
        <p>${formatLongDate(todayISO())}</p>
      </div>
      <button class="btn" id="btn-add-custom">+ Add custom task</button>
    </div>

    <div class="section" id="targets-summary"></div>

    <div class="info-box section">
      <strong>How recommendations work:</strong> tasks are scored using overdue revisions,
      upcoming exams and deadlines, task priority, and your in-progress topics —
      not randomly generated. Nearer deadlines and overdue revisions always rank higher.
    </div>

    <div class="grid grid-2" style="align-items:start">
      <div class="card">
        <div class="card-title">
          <h2>✨ Recommended for you</h2>
          <button class="btn btn-sm" id="btn-autofill">⚡ Auto-fill</button>
        </div>
        <div class="list" id="recommend-list"></div>
      </div>

      <div class="card">
        <div class="card-title">
          <h2>📋 Today's Plan</h2>
          <span class="badge" id="plan-count-badge"></span>
        </div>
        <div class="list" id="plan-list"></div>
      </div>
    </div>
  `;

  document.getElementById("btn-add-custom").addEventListener("click", openCustomTaskForm);
  document.getElementById("btn-autofill").addEventListener("click", autoFillPlan);

  document.getElementById("recommend-list").addEventListener("click", handleRecommendClick);
  document.getElementById("plan-list").addEventListener("click", handlePlanClick);
  document.getElementById("plan-list").addEventListener("change", handlePlanChange);

  refreshTargets();
}

function refreshTargets() {
  renderTargetsSummary();
  renderRecommendList();
  renderPlanList();
}

/* ---------- SUMMARY (time + progress) ---------- */

function renderTargetsSummary() {
  const total = appData.settings.dailyStudyMinutes;
  const planned = planTotalMinutes();
  const completed = planCompletedMinutes();
  const remaining = remainingMinutes();
  const overbooked = planned > total;
  const doneCount = todaysPlan().filter(function (i) { return i.done; }).length;
  const totalCount = todaysPlan().length;
  const percent = percentOf(doneCount, totalCount);

  document.getElementById("targets-summary").innerHTML = `
    <div class="grid grid-4">
      <div class="card stat">
        <span class="stat-label">Available today</span>
        <span class="stat-value">${formatMinutes(total)}</span>
        <span class="stat-note">set in Settings</span>
      </div>
      <div class="card stat">
        <span class="stat-label">Planned</span>
        <span class="stat-value">${formatMinutes(planned)}</span>
        <span class="stat-note ${overbooked ? "" : ""}">${overbooked ? "⚠ over your daily time" : "of today's budget"}</span>
      </div>
      <div class="card stat">
        <span class="stat-label">Remaining time</span>
        <span class="stat-value">${formatMinutes(remaining)}</span>
        <span class="stat-note">still free today</span>
      </div>
      <div class="card">
        <span class="stat-label">Completion</span>
        <div style="margin:8px 0 4px">${progressBarHTML(percent, percent === 100 ? "green" : "")}</div>
        <span class="stat-note">${doneCount}/${totalCount} tasks done (${percent}%)</span>
      </div>
    </div>`;
}

/* ---------- RECOMMENDATIONS LIST ---------- */

function renderRecommendList() {
  const box = document.getElementById("recommend-list");
  const recs = buildRecommendations();

  if (recs.length === 0) {
    box.innerHTML = '<div class="empty"><div class="empty-icon">🎉</div><p>No urgent recommendations right now. Great job staying on top of things!</p></div>';
    return;
  }

  box.innerHTML = recs.map(function (r, index) {
    return `
      <div class="item">
        <div class="item-main">
          <div class="item-title">${escapeHTML(r.title)}</div>
          <div class="item-meta">
            <span class="badge gray">${escapeHTML(r.category)}</span>
            <span>⏱ ${formatMinutes(r.minutes)}</span>
            <span class="muted">${escapeHTML(r.reason)}</span>
          </div>
        </div>
        <button class="btn btn-sm btn-primary" data-action="add-rec" data-index="${index}">+ Add</button>
      </div>`;
  }).join("");

  // Index se dobara candidate dhoondh sakein isliye array ko element par attach kar dete hain
  box.dataset.cache = JSON.stringify(recs);
}

function handleRecommendClick(e) {
  const btn = e.target.closest("[data-action='add-rec']");
  if (!btn) return;

  const recs = JSON.parse(document.getElementById("recommend-list").dataset.cache || "[]");
  const rec = recs[Number(btn.dataset.index)];
  if (!rec) return;

  addToPlan(rec.type, rec.refId, rec.title, rec.category, rec.minutes, "recommended");
  showToast("Added to today's plan.", "success");
  refreshTargets();
}

// Remaining time me jitne fit hon, utne top recommendations apne aap jod deta hai
function autoFillPlan() {
  let free = remainingMinutes();
  const recs = buildRecommendations();
  let added = 0;

  recs.forEach(function (r) {
    if (r.minutes <= free) {
      addToPlan(r.type, r.refId, r.title, r.category, r.minutes, "recommended");
      free -= r.minutes;
      added++;
    }
  });

  if (added === 0) {
    showToast("Not enough remaining time to auto-fill, or nothing to recommend.", "error");
  } else {
    showToast(added + " task(s) added automatically.", "success");
  }
  refreshTargets();
}

/* ---------- TODAY'S PLAN LIST ---------- */

function addToPlan(type, refId, title, category, minutes, source) {
  todaysPlan().push({
    id: generateId("plan"), type: type, refId: refId,
    title: title, category: category, minutes: minutes,
    done: false, source: source
  });
  saveData();
}

function renderPlanList() {
  const plan = todaysPlan();
  document.getElementById("plan-count-badge").textContent = plan.length + " task" + (plan.length === 1 ? "" : "s");

  const box = document.getElementById("plan-list");
  if (plan.length === 0) {
    box.innerHTML = '<div class="empty"><div class="empty-icon">🗒️</div><p>Your plan is empty. Add a recommendation or a custom task.</p></div>';
    return;
  }

  box.innerHTML = plan.map(function (item) {
    return `
      <div class="item${item.done ? " done" : ""}">
        <div class="item-main">
          <div class="item-title">${escapeHTML(item.title)}</div>
          <div class="item-meta">
            <span class="badge gray">${escapeHTML(item.category || "Custom")}</span>
            <span>⏱
              <input type="number" min="5" max="300" step="5" value="${item.minutes}"
                style="width:60px; display:inline-block; padding:3px 6px"
                data-action="edit-minutes" data-id="${item.id}"> min
            </span>
            <span class="badge ${item.source === "custom" ? "" : "green"}">${item.source === "custom" ? "Custom" : "Recommended"}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn btn-sm ${item.done ? "" : "btn-success"}" data-action="toggle-done" data-id="${item.id}">${item.done ? "↩ Undo" : "✓ Done"}</button>
          <button class="btn btn-sm btn-danger" data-action="remove-plan" data-id="${item.id}">✕</button>
        </div>
      </div>`;
  }).join("");
}

function handlePlanClick(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const plan = todaysPlan();
  const item = plan.find(function (i) { return i.id === el.dataset.id; });
  if (!item) return;

  if (el.dataset.action === "toggle-done") {
    item.done = !item.done;
    // Agar roadmap topic tha aur done kiya, to "last studied" update kar do
    if (item.done && item.type === "roadmap") {
      const topic = findTopic(item.refId);
      if (topic) topic.lastStudied = todayISO();
    }
    saveData();
    refreshTargets();

  } else if (el.dataset.action === "remove-plan") {
    appData.dailyPlans[todayISO()] = plan.filter(function (i) { return i.id !== item.id; });
    saveData();
    refreshTargets();
    showToast("Removed from plan.", "success");
  }
}

function handlePlanChange(e) {
  const el = e.target.closest("[data-action='edit-minutes']");
  if (!el) return;
  const item = todaysPlan().find(function (i) { return i.id === el.dataset.id; });
  let val = Number(el.value);
  if (!Number.isInteger(val) || val < 5) val = 5;
  if (val > 300) val = 300;
  item.minutes = val;
  saveData();
  renderTargetsSummary();
}

/* ---------- CUSTOM TASK FORM ---------- */

function openCustomTaskForm() {
  const body = `
    <div class="form-grid">
      <div class="form-group full">
        <label>Task title *</label>
        <input name="title" placeholder="e.g. Revise resume">
        <div class="error-text" data-error-for="title"></div>
      </div>
      <div class="form-group">
        <label>Category</label>
        <input name="category" placeholder="e.g. Personal, Extra">
      </div>
      <div class="form-group">
        <label>Duration (minutes) *</label>
        <input type="number" name="minutes" min="5" max="300" step="5" value="30">
        <div class="error-text" data-error-for="minutes"></div>
      </div>
    </div>`;

  openModal("Add custom task", body, function (form) {
    clearFieldErrors(form);
    const title = getField(form, "title");
    const minutes = Number(getField(form, "minutes"));
    let valid = true;

    if (!title) { showFieldError(form, "title", "Title is required."); valid = false; }
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 300) {
      showFieldError(form, "minutes", "Enter whole minutes between 5 and 300.");
      valid = false;
    }
    if (!valid) return false;

    addToPlan("custom", generateId("custom"), title, getField(form, "category") || "Custom", minutes, "custom");
    refreshTargets();
    showToast("Custom task added.", "success");
  });
}