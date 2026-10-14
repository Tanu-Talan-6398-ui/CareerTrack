/* =========================================================
   settings.js – Settings page + theme
   ========================================================= */

// Theme lagata hai: <html data-theme="dark"> (CSS ise padhti hai)
function applyTheme() {
    document.documentElement.setAttribute("data-theme", appData.settings.theme === "dark" ? "dark" : "light");
}

function renderSettingsPage() {
    const view = document.getElementById("app-view");
    const s = appData.settings;

    // Category checkboxes
    const categoriesHTML = ROADMAP_CATEGORIES.map(function (cat) {
        const checked = s.preferredCategories.includes(cat) ? " checked" : "";
        return `
      <label class="item" style="cursor:pointer; justify-content:flex-start; gap:10px; padding:8px 12px; font-weight:500">
        <input type="checkbox" name="category" value="${escapeHTML(cat)}"${checked}> ${escapeHTML(cat)}
      </label>`;
    }).join("");

    view.innerHTML = `
    <div class="page-header">
      <div>
        <h1>⚙️ Settings</h1>
        <p>Customize how CareerTrack plans your day.</p>
      </div>
    </div>

    <form id="settings-form" novalidate>
      <div class="card section">
        <div class="card-title"><h2>Study preferences</h2></div>
        <div class="form-grid">
          <div class="form-group">
            <label>Daily available study time (minutes) *</label>
            <input type="number" name="dailyStudyMinutes" min="30" max="720" step="5" value="${s.dailyStudyMinutes}">
            <div class="error-text" data-error-for="dailyStudyMinutes"></div>
          </div>
          <div class="form-group">
            <label>Academic priority</label>
            <select name="academicWeight">${optionsHTML(["Low", "Balanced", "High"], s.academicWeight)}</select>
            <span class="muted small">High = exams and assignments rank above placement prep.</span>
          </div>
          <div class="form-group full">
            <label>Preferred study categories (used in recommendations)</label>
            <div class="grid grid-3">${categoriesHTML}</div>
            <div class="error-text" data-error-for="categories"></div>
          </div>
        </div>
      </div>

      <div class="card section">
        <div class="card-title"><h2>Revision & appearance</h2></div>
        <div class="form-grid">
          <div class="form-group">
            <label>Revision intervals (days, comma separated) *</label>
            <input name="intervals" value="${escapeHTML(s.revisionIntervals.join(", "))}" placeholder="1, 3, 7, 14">
            <span class="muted small">Example: 1, 3, 7, 14 means revise after 1, 3, 7 and 14 days.</span>
            <div class="error-text" data-error-for="intervals"></div>
          </div>
          <div class="form-group">
            <label>Theme</label>
            <select name="theme">
              <option value="light"${s.theme === "light" ? " selected" : ""}>Light</option>
              <option value="dark"${s.theme === "dark" ? " selected" : ""}>Dark</option>
            </select>
          </div>
        </div>
      </div>

      <button type="submit" class="btn btn-primary">💾 Save settings</button>
    </form>

    <div class="card" style="margin-top:22px">
      <div class="card-title"><h2>Data</h2></div>
      <p class="muted small" style="margin-bottom:12px">
        Your data is stored only in this browser. Resetting removes all your changes and restores the sample data.
      </p>
      <button class="btn btn-danger" id="btn-reset-data">Reset to sample data</button>
    </div>
  `;

    document.getElementById("settings-form").addEventListener("submit", saveSettingsFromForm);

    document.getElementById("btn-reset-data").addEventListener("click", function () {
        confirmAction(
            "This will delete ALL your data (tasks, DSA questions, projects, applications, plans) and restore the sample data. This cannot be undone.",
            function () {
                resetData();
                applyTheme();
                renderSettingsPage();
                showToast("All data has been reset to sample data.", "success");
            },
            "Yes, reset everything"
        );
    });
}

function saveSettingsFromForm(event) {
    event.preventDefault();
    const form = event.target;
    clearFieldErrors(form);
    let valid = true;

    // 1. Daily minutes
    const minutes = Number(getField(form, "dailyStudyMinutes"));
    if (!Number.isInteger(minutes) || minutes < 30 || minutes > 720) {
        showFieldError(form, "dailyStudyMinutes", "Enter whole minutes between 30 and 720.");
        valid = false;
    }

    // 2. Categories (kam se kam ek)
    const categories = Array.from(form.querySelectorAll('input[name="category"]:checked'))
        .map(function (box) { return box.value; });
    if (categories.length === 0) {
        showFieldError(form, "categories", "Select at least one category.");
        valid = false;
    }

    // 3. Revision intervals: "1, 3, 7, 14" -> [1, 3, 7, 14]
    const parts = getField(form, "intervals").split(",")
        .map(function (p) { return p.trim(); })
        .filter(function (p) { return p !== ""; });
    const intervals = parts.map(Number);
    const intervalsOk = intervals.length >= 1 && intervals.length <= 6 &&
        intervals.every(function (n) { return Number.isInteger(n) && n >= 1 && n <= 90; });
    if (!intervalsOk) {
        showFieldError(form, "intervals", "Enter 1 to 6 whole numbers between 1 and 90, like: 1, 3, 7, 14");
        valid = false;
    }

    if (!valid) return;

    appData.settings.dailyStudyMinutes = minutes;
    appData.settings.preferredCategories = categories;
    appData.settings.academicWeight = getField(form, "academicWeight");
    appData.settings.revisionIntervals = intervals;
    appData.settings.theme = getField(form, "theme");

    saveData();
    applyTheme();
    showToast("Settings saved.", "success");
}