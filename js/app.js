/* =========================================================
   app.js – Navigation and app start (loaded LAST)
   ========================================================= */

// URL hash -> kaun sa page render function chalega
const PAGES = {
    dashboard: renderDashboardPage,
    targets: renderTargetsPage,
    roadmap: renderRoadmapPage,
    academic: renderPlannerPage,
    revision: renderRevisionPage,
    dsa: renderDsaPage,
    skills: renderSkillsPage,
    projects: renderProjectsPage,
    applications: renderApplicationsPage,
    settings: renderSettingsPage
};

/* ---------- MOBILE SIDEBAR ---------- */

function openSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebar-overlay").classList.add("show");
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebar-overlay").classList.remove("show");
}

/* ---------- ROUTER ---------- */

function showCurrentPage() {
    let page = window.location.hash.replace("#", "");

    // Galat ya khali hash par dashboard dikhao
    if (!Object.prototype.hasOwnProperty.call(PAGES, page)) page = "dashboard";

    closeModal();
    closeSidebar();

    try {
        PAGES[page]();
    } catch (error) {
        console.error("Page failed to render:", page, error);
        document.getElementById("app-view").innerHTML =
            '<div class="card"><h2>Something went wrong</h2>' +
            '<p class="muted">This page could not be displayed. Open the browser Console (F12) to see the error.</p></div>';
    }

    // Sidebar me current page ka link highlight karo
    document.querySelectorAll(".nav-link").forEach(function (link) {
        link.classList.toggle("active", link.dataset.page === page);
    });

    window.scrollTo(0, 0);
}

/* ---------- START ---------- */

document.addEventListener("DOMContentLoaded", function () {
    loadData();        // storage.js: saved data ya sample data
    applyTheme();      // settings.js: light / dark

    // Mobile menu
    document.getElementById("menu-toggle").addEventListener("click", openSidebar);
    document.getElementById("sidebar-overlay").addEventListener("click", closeSidebar);
    // Wahi link dobara dabane par hashchange nahi hota, isliye menu yahan band karte hain
    document.querySelector(".nav").addEventListener("click", closeSidebar);

    // URL ka hash badalne par page badlo
    window.addEventListener("hashchange", showCurrentPage);

    showCurrentPage();
});