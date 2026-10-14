/* =========================================================
   revision.js – Revision Center (spaced repetition)
   ========================================================= */

const revisionUI = { tab: "due" };  // "due" | "upcoming" | "completed"

/* ---------- START A REVISION CYCLE ----------
   roadmap.js se bulaya jaata hai jab topic padha/complete hota hai. */
function startRevisionCycle(topicId) {
    const topic = findTopic(topicId);
    if (!topic) return;

    const intervals = appData.settings.revisionIntervals;
    const dueDate = addDays(todayISO(), intervals[0]);

    appData.revisions.push({
        id: generateId("rev"), topicId: topicId, title: topic.name, category: topic.category,
        stage: 1, dueDate: dueDate, status: "Pending", completedOn: ""
    });
    topic.nextRevision = dueDate;
    saveData();
    showToast("Revision scheduled for " + formatDate(dueDate) + ".", "success");
}

/* ---------- PAGE RENDER ---------- */

function renderRevisionPage() {
    const view = document.getElementById("app-view");

    view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>🔁 Revision Center</h1>
        <p>Spaced revisions after ${appData.settings.revisionIntervals.join(", ")} days keep topics fresh in memory.</p>
      </div>
    </div>

    <div class="section" id="revision-summary"></div>

    <div class="tabs" id="revision-tabs">
      <button class="tab${revisionUI.tab === "due" ? " active" : ""}" data-tab="due">⏰ Due & Overdue</button>
      <button class="tab${revisionUI.tab === "upcoming" ? " active" : ""}" data-tab="upcoming">📅 Upcoming</button>
      <button class="tab${revisionUI.tab === "completed" ? " active" : ""}" data-tab="completed">✅ Completed</button>
    </div>

    <div class="list" id="revision-list"></div>
  `;

    document.getElementById("revision-tabs").addEventListener("click", function (e) {
        const btn = e.target.closest("[data-tab]");
        if (!btn) return;
        revisionUI.tab = btn.dataset.tab;
        renderRevisionPage();
    });

    document.getElementById("revision-list").addEventListener("click", handleRevisionClick);

    refreshRevisionCenter();
}

function refreshRevisionCenter() {
    renderRevisionSummary();
    renderRevisionList();
}

/* ---------- SUMMARY ---------- */

function renderRevisionSummary() {
    const pending = appData.revisions.filter(function (r) { return r.status === "Pending"; });
    const overdue = pending.filter(function (r) { return daysFromToday(r.dueDate) < 0; }).length;
    const dueToday = pending.filter(function (r) { return daysFromToday(r.dueDate) === 0; }).length;
    const upcoming = pending.filter(function (r) { return daysFromToday(r.dueDate) > 0; }).length;
    const completed = appData.revisions.filter(function (r) { return r.status === "Completed"; }).length;

    document.getElementById("revision-summary").innerHTML = `
    <div class="grid grid-4">
      ${plannerStatHTML("Overdue", overdue, overdue ? "catch up soon" : "none, great!")}
      ${plannerStatHTML("Due today", dueToday, "review these now")}
      ${plannerStatHTML("Upcoming", upcoming, "scheduled ahead")}
      ${plannerStatHTML("Completed", completed, "revision cycles done")}
    </div>`;
}

/* ---------- LIST (tab ke hisaab se) ---------- */

function renderRevisionList() {
    const box = document.getElementById("revision-list");
    let items;

    if (revisionUI.tab === "due") {
        items = appData.revisions.filter(function (r) { return r.status === "Pending" && daysFromToday(r.dueDate) <= 0; });
        items.sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); });
    } else if (revisionUI.tab === "upcoming") {
        items = appData.revisions.filter(function (r) { return r.status === "Pending" && daysFromToday(r.dueDate) > 0; });
        items.sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); });
    } else {
        items = appData.revisions.filter(function (r) { return r.status === "Completed"; });
        items.sort(function (a, b) { return b.completedOn.localeCompare(a.completedOn); });
    }

    if (items.length === 0) {
        const messages = {
            due: ["🎉", "Nothing due right now. Well organized!"],
            upcoming: ["📅", "No upcoming revisions scheduled yet."],
            completed: ["🗂️", "No completed revisions yet."]
        };
        const m = messages[revisionUI.tab];
        box.innerHTML = '<div class="empty"><div class="empty-icon">' + m[0] + "</div><p>" + m[1] + "</p></div>";
        return;
    }

    box.innerHTML = items.map(revisionItemHTML).join("");
}

function revisionItemHTML(r) {
    const totalStages = appData.settings.revisionIntervals.length;

    if (r.status === "Completed") {
        return `
      <div class="item done">
        <div class="item-main">
          <div class="item-title">${escapeHTML(r.title)}</div>
          <div class="item-meta">
            <span class="badge gray">${escapeHTML(r.category)}</span>
            <span>Stage ${r.stage}/${totalStages}</span>
            <span>Completed on ${formatDate(r.completedOn)}</span>
          </div>
        </div>
      </div>`;
    }

    const overdue = daysFromToday(r.dueDate) < 0;
    return `
    <div class="item">
      <div class="item-main">
        <div class="item-title">${escapeHTML(r.title)}</div>
        <div class="item-meta">
          <span class="badge gray">${escapeHTML(r.category)}</span>
          <span class="badge">Stage ${r.stage}/${totalStages}</span>
          <span class="badge ${overdue ? "red" : ""}">${relativeDayLabel(r.dueDate)}</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn btn-sm btn-success" data-action="complete-rev" data-id="${r.id}">✓ Mark revised</button>
        <button class="btn btn-sm btn-danger" data-action="cancel-rev" data-id="${r.id}">Cancel</button>
      </div>
    </div>`;
}

/* ---------- ACTIONS ---------- */

function handleRevisionClick(e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;

    const revision = appData.revisions.find(function (r) { return r.id === el.dataset.id; });
    if (!revision) return;

    if (el.dataset.action === "complete-rev") {
        completeRevision(revision);
    } else if (el.dataset.action === "cancel-rev") {
        confirmAction("Cancel this scheduled revision for \"" + revision.title + "\"?", function () {
            appData.revisions = appData.revisions.filter(function (r) { return r.id !== revision.id; });
            const topic = findTopic(revision.topicId);
            if (topic && topic.nextRevision === revision.dueDate) topic.nextRevision = "";
            saveData();
            refreshRevisionCenter();
            showToast("Revision cancelled.", "success");
        });
    }
}

// Revision complete karo aur, agar stages bache hain, to agla schedule kar do
function completeRevision(revision) {
    revision.status = "Completed";
    revision.completedOn = todayISO();

    const topic = findTopic(revision.topicId);
    const intervals = appData.settings.revisionIntervals;

    if (topic) {
        topic.lastStudied = todayISO();

        if (revision.stage < intervals.length) {
            const nextDue = addDays(todayISO(), intervals[revision.stage]); // stage is 1-indexed
            appData.revisions.push({
                id: generateId("rev"), topicId: revision.topicId, title: revision.title, category: revision.category,
                stage: revision.stage + 1, dueDate: nextDue, status: "Pending", completedOn: ""
            });
            topic.nextRevision = nextDue;
            showToast("Nice! Next revision scheduled for " + formatDate(nextDue) + ".", "success");
        } else {
            topic.nextRevision = "";
            showToast(topic.name + " has completed all revision stages! 🎉", "success");
        }
    }

    saveData();
    refreshRevisionCenter();
}