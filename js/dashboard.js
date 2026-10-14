/* =========================================================
   dashboard.js – Dashboard page (summary of everything)
   ========================================================= */

/* ---------- HELPERS ---------- */

// Completed aur pending tasks ki ginti
function dashboardTaskCounts() {
    const today = todayISO();
    let completed = appData.academicTasks.filter(function (t) { return t.completed; }).length;
    let pending = appData.academicTasks.filter(function (t) { return !t.completed; }).length;

    // Daily plans ke items (academic type chhod do, wo upar gin liye gaye)
    Object.keys(appData.dailyPlans).forEach(function (date) {
        appData.dailyPlans[date].forEach(function (item) {
            if (item.type === "academic") return;
            if (item.done) completed++;
            else if (date === today) pending++;   // sirf aaj ke adhure items pending maane jayenge
        });
    });

    return { completed: completed, pending: pending };
}

// Roadmap ki kisi category ka progress % (subtopics ke hisaab se)
function roadmapCategoryPercent(category) {
    let done = 0;
    let total = 0;
    appData.roadmap.forEach(function (t) {
        if (t.category !== category) return;
        done += t.completedSubtopics.length;
        total += t.subtopics.length;
    });
    return percentOf(done, total);
}

// Academic progress = poori ho chuki units / total units
function academicUnitsPercent() {
    let done = 0;
    let total = 0;
    appData.subjects.forEach(function (s) {
        total += s.units.length;
        done += s.units.filter(function (u) { return u.done; }).length;
    });
    return percentOf(done, total);
}

function dsaSolvedPercent() {
    const total = appData.dsaQuestions.length;
    const solved = appData.dsaQuestions.filter(function (q) { return q.status === "Solved"; }).length;
    return percentOf(solved, total);
}

/* ---------- PAGE RENDER ---------- */

function renderDashboardPage() {
    const view = document.getElementById("app-view");
    const today = todayISO();

    // Waqt ke hisaab se greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : (hour < 17 ? "Good afternoon" : "Good evening");

    const counts = dashboardTaskCounts();

    // Aaj ka target completion
    const plan = todaysPlan();
    const planDone = plan.filter(function (i) { return i.done; }).length;
    const planPercent = percentOf(planDone, plan.length);
    const targetNote = plan.length === 0
        ? 'No targets yet. <a href="#targets">Plan your day</a>'
        : planDone + "/" + plan.length + " targets done";

    // Progress bars
    const dsaPercent = dsaSolvedPercent();
    const academicPercent = academicUnitsPercent();
    const devPercent = roadmapCategoryPercent("Development");

    // Upcoming revisions (overdue bhi shamil, sabse purani pehle)
    const revisions = appData.revisions
        .filter(function (r) { return r.status === "Pending"; })
        .sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); })
        .slice(0, 5);

    const revisionsHTML = revisions.length === 0
        ? '<div class="empty"><div class="empty-icon">🎉</div><p>No pending revisions.</p></div>'
        : revisions.map(function (r) {
            const overdue = daysFromToday(r.dueDate) < 0;
            return `
          <div class="item">
            <div class="item-main">
              <div class="item-title">${escapeHTML(r.title)}</div>
              <div class="item-meta">
                <span class="badge gray">${escapeHTML(r.category)}</span>
                <span>Stage ${r.stage}/${appData.settings.revisionIntervals.length}</span>
              </div>
            </div>
            <span class="badge ${overdue ? "red" : ""}">${relativeDayLabel(r.dueDate)}</span>
          </div>`;
        }).join("");

    // Upcoming exams aur assignments
    const deadlines = appData.academicTasks
        .filter(function (t) {
            return !t.completed && (t.type === "Assignment" || t.type === "Internal Exam" || t.type === "Semester Exam");
        })
        .sort(byDueDate)          // byDueDate planner.js me banaya tha
        .slice(0, 5);

    const deadlinesHTML = deadlines.length === 0
        ? '<div class="empty"><div class="empty-icon">🎉</div><p>No upcoming exams or assignments.</p></div>'
        : deadlines.map(function (t) {
            const diff = daysFromToday(t.dueDate);
            const badge = diff < 0 ? "red" : (diff <= 2 ? "orange" : "");
            return `
          <div class="item">
            <div class="item-main">
              <div class="item-title">${escapeHTML(t.title)}</div>
              <div class="item-meta">
                <span class="badge gray">${escapeHTML(t.type)}</span>
                <span>📅 ${formatDate(t.dueDate)}</span>
              </div>
            </div>
            <span class="badge ${badge}">${relativeDayLabel(t.dueDate)}</span>
          </div>`;
        }).join("");

    view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>${greeting}! 👋</h1>
        <p>Welcome back to CareerTrack &middot; ${formatLongDate(today)}</p>
      </div>
      <a class="btn btn-primary" href="#targets" style="text-decoration:none">🎯 Plan today</a>
    </div>

    <div class="grid grid-3 section">
      ${plannerStatHTML("Completed tasks", counts.completed, "academic + daily targets")}
      ${plannerStatHTML("Pending tasks", counts.pending, "academic + today's targets")}
      <div class="card stat">
        <span class="stat-label">Today's target completion</span>
        <span class="stat-value">${planPercent}%</span>
        ${progressBarHTML(planPercent, planPercent === 100 && plan.length > 0 ? "green" : "")}
        <span class="stat-note">${targetNote}</span>
      </div>
    </div>

    <div class="card section">
      <div class="card-title"><h2>📈 Your progress</h2></div>
      <div class="grid grid-3">
        <div>
          <div class="progress-row"><span>DSA (questions solved)</span><strong>${dsaPercent}%</strong></div>
          ${progressBarHTML(dsaPercent)}
        </div>
        <div>
          <div class="progress-row"><span>Academic (units done)</span><strong>${academicPercent}%</strong></div>
          ${progressBarHTML(academicPercent, "orange")}
        </div>
        <div>
          <div class="progress-row"><span>Development (roadmap)</span><strong>${devPercent}%</strong></div>
          ${progressBarHTML(devPercent, "green")}
        </div>
      </div>
    </div>

    <div class="grid grid-2" style="align-items:start">
      <div class="card">
        <div class="card-title">
          <h2>🔁 Upcoming revisions</h2>
          <a href="#revision" class="small">View all</a>
        </div>
        <div class="list">${revisionsHTML}</div>
      </div>
      <div class="card">
        <div class="card-title">
          <h2>⏰ Exams & assignments</h2>
          <a href="#academic" class="small">View all</a>
        </div>
        <div class="list">${deadlinesHTML}</div>
      </div>
    </div>
  `;
}