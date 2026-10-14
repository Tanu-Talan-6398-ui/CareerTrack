/* =========================================================
   roadmap.js – Preparation Roadmap page
   ========================================================= */

// Page ki current state (filters, kaun se cards khule hain)
const roadmapUI = {
  category: "All",
  status: "All",
  search: "",
  expanded: {}      // { "topic_0": true } -> jo cards khule hain
};

/* ---------- HELPERS ---------- */

function findTopic(topicId) {
  return appData.roadmap.find(function (t) { return t.id === topicId; });
}

// Topic ka completion % = tick kiye hue subtopics / total subtopics
function topicPercent(topic) {
  return percentOf(topic.completedSubtopics.length, topic.subtopics.length);
}

// Progress dekh kar status decide karta hai
function statusFromProgress(topic) {
  const done = topic.completedSubtopics.length;
  if (done === 0) return "Not Started";
  if (done === topic.subtopics.length) return "Completed";
  return "In Progress";
}

function roadmapStatusBadge(status) {
  if (status === "Completed") return "green";
  if (status === "In Progress") return "orange";
  return "gray";
}

// Kya is topic ki koi revision abhi pending hai? (duplicate revisions rokne ke liye)
function topicHasPendingRevision(topicId) {
  return appData.revisions.some(function (r) {
    return r.topicId === topicId && r.status === "Pending";
  });
}

/* ---------- PAGE RENDER ---------- */

function renderRoadmapPage() {
  const view = document.getElementById("app-view");

  // Category tabs: All + 5 categories
  const tabsHTML = ["All"].concat(ROADMAP_CATEGORIES).map(function (cat) {
    const active = cat === roadmapUI.category ? " active" : "";
    return '<button class="tab' + active + '" data-category="' + escapeHTML(cat) + '">' + escapeHTML(cat) + "</button>";
  }).join("");

  view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>🗺️ Preparation Roadmap</h1>
        <p>Tick subtopics as you learn them. Progress and status update automatically.</p>
      </div>
    </div>

    <div class="section" id="roadmap-summary"></div>

    <div class="tabs" id="roadmap-tabs">${tabsHTML}</div>

    <div class="toolbar">
      <input type="search" id="roadmap-search" class="grow" placeholder="Search topics or subtopics..." value="${escapeHTML(roadmapUI.search)}">
      <select id="roadmap-status">${optionsHTML(["All"].concat(ROADMAP_STATUSES), roadmapUI.status)}</select>
    </div>

    <div class="list" id="roadmap-list"></div>
  `;

  // Category tab click
  document.getElementById("roadmap-tabs").addEventListener("click", function (e) {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    roadmapUI.category = btn.dataset.category;
    renderRoadmapPage();
  });

  // Search: sirf list dobara banti hai (taaki typing ke beech cursor na hate)
  document.getElementById("roadmap-search").addEventListener("input", function () {
    roadmapUI.search = this.value;
    renderRoadmapList();
  });

  document.getElementById("roadmap-status").addEventListener("change", function () {
    roadmapUI.status = this.value;
    renderRoadmapList();
  });

  // Ek hi listener poori list ke liye (event delegation)
  const list = document.getElementById("roadmap-list");
  list.addEventListener("click", handleRoadmapClick);
  list.addEventListener("change", handleRoadmapChange);

  refreshRoadmap();
}

// Summary + list dono dobara banata hai
function refreshRoadmap() {
  renderRoadmapSummary();
  renderRoadmapList();
}

/* ---------- SUMMARY (top ke progress bars) ---------- */

function renderRoadmapSummary() {
  let allDone = 0;
  let allTotal = 0;

  const rows = ROADMAP_CATEGORIES.map(function (cat) {
    const topics = appData.roadmap.filter(function (t) { return t.category === cat; });
    let done = 0;
    let total = 0;
    topics.forEach(function (t) {
      done += t.completedSubtopics.length;
      total += t.subtopics.length;
    });
    allDone += done;
    allTotal += total;

    const completedTopics = topics.filter(function (t) { return t.status === "Completed"; }).length;
    const percent = percentOf(done, total);
    return `
      <div>
        <div class="progress-row">
          <span>${escapeHTML(cat)} <span class="muted small">(${completedTopics}/${topics.length} topics done)</span></span>
          <strong>${percent}%</strong>
        </div>
        ${progressBarHTML(percent)}
      </div>`;
  }).join("");

  document.getElementById("roadmap-summary").innerHTML = `
    <div class="card">
      <div class="card-title">
        <h2>Overall progress</h2>
        <strong>${percentOf(allDone, allTotal)}%</strong>
      </div>
      <div class="grid grid-3">${rows}</div>
    </div>`;
}

/* ---------- TOPIC LIST ---------- */

function renderRoadmapList() {
  const box = document.getElementById("roadmap-list");
  const search = roadmapUI.search.trim().toLowerCase();

  // Filters lagao
  const topics = appData.roadmap.filter(function (t) {
    if (roadmapUI.category !== "All" && t.category !== roadmapUI.category) return false;
    if (roadmapUI.status !== "All" && t.status !== roadmapUI.status) return false;
    if (search) {
      const text = (t.name + " " + t.subtopics.join(" ")).toLowerCase();
      if (!text.includes(search)) return false;
    }
    return true;
  });

  if (topics.length === 0) {
    box.innerHTML = '<div class="empty"><div class="empty-icon">🔍</div><p>No topics match your filters.</p></div>';
    return;
  }

  box.innerHTML = topics.map(topicCardHTML).join("");
}

// Ek topic ka poora card
function topicCardHTML(topic) {
  const percent = topicPercent(topic);
  const isOpen = !!roadmapUI.expanded[topic.id];

  return `
    <div class="card">
      <div class="topic-head" data-action="toggle" data-id="${topic.id}">
        <div class="item-main">
          <div class="item-title">${escapeHTML(topic.name)}</div>
          <div class="item-meta">
            <span class="badge gray">${escapeHTML(topic.category)}</span>
            <span class="badge ${roadmapStatusBadge(topic.status)}">${escapeHTML(topic.status)}</span>
            <span>Last studied: ${formatDate(topic.lastStudied)}</span>
            <span>Next revision: ${formatDate(topic.nextRevision)}</span>
          </div>
        </div>
        <div style="width:140px">
          <div class="progress-row"><span class="muted small">${topic.completedSubtopics.length}/${topic.subtopics.length} subtopics</span><strong>${percent}%</strong></div>
          ${progressBarHTML(percent, percent === 100 ? "green" : "")}
        </div>
        <span class="muted">${isOpen ? "▲" : "▼"}</span>
      </div>
      ${isOpen ? topicBodyHTML(topic) : ""}
    </div>`;
}

// Card khulne par dikhne wala hissa
function topicBodyHTML(topic) {
  const subtopicsHTML = topic.subtopics.map(function (name, index) {
    const checked = topic.completedSubtopics.includes(index) ? " checked" : "";
    return `
      <label class="item" style="cursor:pointer; justify-content:flex-start; gap:10px; padding:8px 12px;">
        <input type="checkbox" data-action="subtopic" data-id="${topic.id}" data-index="${index}"${checked}>
        <span>${escapeHTML(name)}</span>
      </label>`;
  }).join("");

  // Revision button tabhi dikhta hai jab topic shuru ho chuka ho
  const scheduleBtn = topic.status !== "Not Started"
    ? '<button class="btn btn-sm" data-action="schedule" data-id="' + topic.id + '">🔁 Schedule revision</button>'
    : "";

  return `
    <div class="topic-body">
      <h3 style="margin-bottom:8px">Subtopics</h3>
      <div class="list" style="margin-bottom:14px">${subtopicsHTML}</div>

      <div class="form-group" style="margin-bottom:14px">
        <label>Study notes <span class="muted small">(saved automatically when you click outside the box)</span></label>
        <textarea data-action="notes" data-id="${topic.id}" placeholder="Write key points, formulas, doubts...">${escapeHTML(topic.notes)}</textarea>
      </div>

      <div class="btn-group">
        <button class="btn btn-sm btn-primary" data-action="studied" data-id="${topic.id}">✅ I studied this today</button>
        <button class="btn btn-sm btn-success" data-action="complete-all" data-id="${topic.id}">Mark all complete</button>
        ${scheduleBtn}
        <button class="btn btn-sm btn-danger" data-action="reset" data-id="${topic.id}">Reset progress</button>
      </div>
    </div>`;
}

/* ---------- EVENT HANDLERS ---------- */

// Button clicks
function handleRoadmapClick(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;

  const topic = findTopic(el.dataset.id);
  if (!topic) return;
  const action = el.dataset.action;

  if (action === "toggle") {
    roadmapUI.expanded[topic.id] = !roadmapUI.expanded[topic.id];
    renderRoadmapList();

  } else if (action === "studied") {
    topic.lastStudied = todayISO();
    if (topic.status === "Not Started") topic.status = "In Progress";
    saveData();
    refreshRoadmap();
    showToast("Marked as studied today.", "success");
    offerRevisionSchedule(topic);

  } else if (action === "complete-all") {
    topic.completedSubtopics = topic.subtopics.map(function (name, index) { return index; });
    topic.status = "Completed";
    topic.lastStudied = todayISO();
    saveData();
    refreshRoadmap();
    showToast(topic.name + " marked as completed. 🎉", "success");
    offerRevisionSchedule(topic);

  } else if (action === "schedule") {
    if (topicHasPendingRevision(topic.id)) {
      showToast("A revision is already scheduled for this topic.");
    } else {
      offerRevisionSchedule(topic);
    }

  } else if (action === "reset") {
    confirmAction("Reset all progress of \"" + topic.name + "\"? Your notes will be kept.", function () {
      topic.completedSubtopics = [];
      topic.status = "Not Started";
      topic.lastStudied = "";
      saveData();
      refreshRoadmap();
      showToast("Progress reset.", "success");
    }, "Yes, reset");
  }
}

// Checkbox aur textarea ke changes
function handleRoadmapChange(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;

  const topic = findTopic(el.dataset.id);
  if (!topic) return;

  if (el.dataset.action === "notes") {
    topic.notes = el.value.trim();
    saveData();
    showToast("Notes saved.", "success");

  } else if (el.dataset.action === "subtopic") {
    const index = Number(el.dataset.index);
    const previousStatus = topic.status;

    if (el.checked) {
      if (!topic.completedSubtopics.includes(index)) topic.completedSubtopics.push(index);
      topic.lastStudied = todayISO();     // tick karna = aaj padha
    } else {
      topic.completedSubtopics = topic.completedSubtopics.filter(function (i) { return i !== index; });
    }
    topic.completedSubtopics.sort(function (a, b) { return a - b; });
    topic.status = statusFromProgress(topic);

    saveData();
    refreshRoadmap();

    // Abhi-abhi Completed hua hai to revision ka option do
    if (topic.status === "Completed" && previousStatus !== "Completed") {
      showToast(topic.name + " completed! 🎉", "success");
      offerRevisionSchedule(topic);
    }
  }
}

/* ---------- REVISION OFFER ----------
   Topic padhne ke baad poochta hai: "Revision schedule karein?"
   startRevisionCycle() function revision.js (Part 4) me banega. */
function offerRevisionSchedule(topic) {
  if (topicHasPendingRevision(topic.id)) return;   // pehle se scheduled hai

  const days = appData.settings.revisionIntervals.join(", ");
  const body = "<p>You studied <strong>" + escapeHTML(topic.name) + "</strong>.<br>" +
    "Schedule spaced revisions after <strong>" + days + "</strong> days?</p>";

  openModal("Schedule revisions?", body, function () {
    if (typeof startRevisionCycle === "function") {
      startRevisionCycle(topic.id);
      refreshRoadmap();
    } else {
      showToast("Revision Center is not added yet (coming in Part 4).", "error");
    }
  }, "Yes, schedule");
}