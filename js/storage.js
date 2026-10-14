/* =========================================================
   storage.js – Save & load data using browser LocalStorage
   ========================================================= */

// LocalStorage me data is "key" naam se save hota hai
const STORAGE_KEY = "careertrack_data_v1";

// Poora app data is variable me rehta hai (memory me).
// Har page is "appData" ko padhta aur badalta hai, phir saveData() bulata hai.
let appData = null;

/* ---------- LOAD ----------
   App start hone par ek baar chalta hai */
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      // Pehle se saved data mila -> use karo (overwrite NAHI karte)
      appData = JSON.parse(saved);
      ensureDataShape();
    } else {
      // Pehli baar: sample data banao aur save karo
      appData = buildSampleData();
      saveData();
    }
  } catch (error) {
    // Data corrupt ho gaya ya LocalStorage band hai
    console.error("Could not load saved data, using sample data instead:", error);
    appData = buildSampleData();
  }
}

/* ---------- SAVE ----------
   Jab bhi appData badle (add / edit / delete), yeh call karo */
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    return true;
  } catch (error) {
    console.error("Could not save data:", error);
    showToast("Could not save data. Browser storage may be full or blocked.", "error");
    return false;
  }
}

/* ---------- RESET ----------
   Sab kuch hata kar dobara sample data daalta hai */
function resetData() {
  appData = buildSampleData();
  saveData();
}

/* ---------- SAFETY CHECK ----------
   Agar aage ke version me koi naya field jodenge, to purane saved data me
   woh field nahi hoga aur app crash hoga. Yeh function missing fields bhar deta hai. */
function ensureDataShape() {
  const defaults = buildSampleData();
   const arrayKeys = ["roadmap", "revisions", "academicTasks", "subjects", "dsaQuestions", "skills", "projects", "applications"];
  arrayKeys.forEach(function (key) {
    if (!Array.isArray(appData[key])) appData[key] = defaults[key];
  });

  if (!appData.dailyPlans || typeof appData.dailyPlans !== "object") appData.dailyPlans = {};

  // Settings: missing fields default se bharo, jo hain unhe mat chhedo
  appData.settings = Object.assign(defaultSettings(), appData.settings || {});
}