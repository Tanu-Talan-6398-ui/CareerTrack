/* =========================================================
   utils.js – Helper functions used everywhere in CareerTrack
   ========================================================= */

/* ---------- 1. DATE HELPERS ----------
   Rule: hum dates ko hamesha "YYYY-MM-DD" text me store karte hain.
   Isse timezone ki wajah se date ek din aage-peeche nahi hoti. */

// Number ko 2 digit banata hai: 5 -> "05"
function pad2(n) {
  return String(n).padStart(2, "0");
}

// Date object ko "YYYY-MM-DD" text me badalta hai (LOCAL time me)
function toISODate(dateObj) {
  return dateObj.getFullYear() + "-" + pad2(dateObj.getMonth() + 1) + "-" + pad2(dateObj.getDate());
}

// Aaj ki date "YYYY-MM-DD" me
function todayISO() {
  return toISODate(new Date());
}

// "YYYY-MM-DD" text ko Date object me badalta hai (local time, dopahar 12 baje)
function parseISODate(isoString) {
  const parts = isoString.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
}

// Kisi date me days jodta hai (negative dene par ghatata hai)
// addDays("2026-09-28", 3) -> "2026-10-01"
function addDays(isoString, days) {
  const d = parseISODate(isoString);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

// Do dates ke beech kitne din ka fark hai (b - a)
// daysBetween("2026-09-28", "2026-09-30") -> 2
function daysBetween(isoA, isoB) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((parseISODate(isoB) - parseISODate(isoA)) / msPerDay);
}

// Aaj se kitne din baad? (past date ke liye negative)
function daysFromToday(isoString) {
  return daysBetween(todayISO(), isoString);
}

// Sundar format: "28 Sep 2026". Khali date par "—" dikhata hai
function formatDate(isoString) {
  if (!isoString) return "—";
  return parseISODate(isoString).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

// Dashboard ke liye lamba format: "Monday, 28 September 2026"
function formatLongDate(isoString) {
  return parseISODate(isoString).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}

// Date ke liye human-friendly label: "Today", "Tomorrow", "In 3 days", "2 days overdue"
function relativeDayLabel(isoString) {
  const diff = daysFromToday(isoString);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return "In " + diff + " days";
  return Math.abs(diff) + " days overdue";
}

/* ---------- 2. ID GENERATOR ----------
   Har record (task, project, question) ko ek unique ID chahiye. */
function generateId(prefix) {
  return (prefix || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- 3. SAFE TEXT (security) ----------
   User ka likha text HTML me dikhane se pehle escape karte hain,
   taaki koi <script> jaisa text page ko kharab na kare. */
function escapeHTML(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------- 4. TOAST MESSAGES ----------
   showToast("Saved!", "success") -> neeche kone me 3 second ke liye message */
function showToast(message, type) {
  const root = document.getElementById("toast-root");
  const toast = document.createElement("div");
  toast.className = "toast " + (type || "");
  toast.textContent = message;
  root.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 3000);
}

/* ---------- 5. MODAL (popup form) ----------
   openModal(title, bodyHTML, onSave)
   - Popup kholta hai jisme form dikhta hai
   - Save dabane par onSave(formElement) chalta hai
   - Agar onSave "false" return kare (validation fail), to popup band nahi hota */
function openModal(title, bodyHTML, onSave, saveLabel) {
  const root = document.getElementById("modal-root");
  root.innerHTML =
    '<div class="modal-backdrop" id="modal-backdrop">' +
      '<div class="modal">' +
        "<h2>" + escapeHTML(title) + "</h2>" +
        '<form id="modal-form" novalidate>' +
          bodyHTML +
          '<div class="modal-actions">' +
            '<button type="button" class="btn" id="modal-cancel">Cancel</button>' +
            '<button type="submit" class="btn btn-primary">' + escapeHTML(saveLabel || "Save") + "</button>" +
          "</div>" +
        "</form>" +
      "</div>" +
    "</div>";

  const form = document.getElementById("modal-form");

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // page reload rokta hai
    const result = onSave(form);
    if (result !== false) closeModal();
  });

  document.getElementById("modal-cancel").addEventListener("click", closeModal);

  // Backdrop (bahar ke dark hisse) par click karne par band
  document.getElementById("modal-backdrop").addEventListener("click", function (e) {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  // Pehla input field pe cursor le jao
  const firstField = form.querySelector("input, select, textarea");
  if (firstField) firstField.focus();
}

function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
}

/* ---------- 6. CONFIRM DIALOG ----------
   Delete jaise khatarnak kaam se pehle poochta hai "Are you sure?" */
function confirmAction(message, onConfirm, confirmLabel) {
  const root = document.getElementById("modal-root");
  root.innerHTML =
    '<div class="modal-backdrop" id="modal-backdrop">' +
      '<div class="modal">' +
        "<h2>Please confirm</h2>" +
        "<p>" + escapeHTML(message) + "</p>" +
        '<div class="modal-actions">' +
          '<button class="btn" id="confirm-no">Cancel</button>' +
          '<button class="btn btn-danger" id="confirm-yes">' + escapeHTML(confirmLabel || "Yes, delete") + "</button>" +
        "</div>" +
      "</div>" +
    "</div>";

  document.getElementById("confirm-no").addEventListener("click", closeModal);
  document.getElementById("confirm-yes").addEventListener("click", function () {
    closeModal();
    onConfirm();
  });
}

/* ---------- 7. FORM HELPERS ---------- */

// Form ke andar name="title" wale field ki value nikalta hai (extra spaces hata kar)
function getField(form, name) {
  const el = form.elements[name];
  return el ? el.value.trim() : "";
}

// Field ke neeche laal error text dikhata hai. Return: hamesha false
function showFieldError(form, name, message) {
  const box = form.querySelector('[data-error-for="' + name + '"]');
  if (box) box.textContent = message;
  return false;
}

// Purane saare error messages saaf karta hai
function clearFieldErrors(form) {
  form.querySelectorAll("[data-error-for]").forEach(function (box) { box.textContent = ""; });
}

// <select> ke <option> tags banata hai. selectedValue wala option pehle se chuna hua hoga
function optionsHTML(list, selectedValue) {
  return list.map(function (item) {
    const selected = item === selectedValue ? " selected" : "";
    return '<option value="' + escapeHTML(item) + '"' + selected + ">" + escapeHTML(item) + "</option>";
  }).join("");
}

/* ---------- 8. SMALL HELPERS ---------- */

// Progress bar ka HTML. percent 0-100. color: "", "green", "orange"
function progressBarHTML(percent, color) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return '<div class="progress"><div class="progress-bar ' + (color || "") + '" style="width:' + p + '%"></div></div>';
}

// Percentage nikalta hai (0 se divide hone par 0 deta hai)
function percentOf(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

// Minutes ko "1h 30m" format me badalta hai
function formatMinutes(mins) {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return r + "m";
  if (r === 0) return h + "h";
  return h + "h " + r + "m";
}

// Priority ke hisaab se badge ka color
function priorityBadgeClass(priority) {
  if (priority === "High") return "red";
  if (priority === "Medium") return "orange";
  return "gray";
}