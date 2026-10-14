/* =========================================================
   data.js – Roadmap template + sample data
   ========================================================= */

/* ---------- 1. LISTS USED IN DROPDOWNS ---------- */
const ROADMAP_CATEGORIES = ["DSA", "Development", "Core CS", "Aptitude", "Communication"];
const PRIORITIES = ["High", "Medium", "Low"];
const ROADMAP_STATUSES = ["Not Started", "In Progress", "Completed"];
const DSA_DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DSA_STATUSES = ["Not Started", "Attempted", "Solved"];
const APPLICATION_STATUSES = ["Interested", "Applied", "Assessment", "Interview", "Selected", "Rejected"];
const PROJECT_STATUSES = ["Planning", "In Progress", "Completed", "On Hold"];
const ACADEMIC_TYPES = ["Assignment", "Internal Exam", "Semester Exam", "Study Task"];

/* ---------- 2. ROADMAP TEMPLATE ----------
   Har topic: { category, name, subtopics: [...] }
   Baaki fields (status, notes, dates) storage me alag se save hote hain. */
const ROADMAP_TEMPLATE = [
  // ----- DSA -----
  { category: "DSA", name: "Arrays", subtopics: ["Traversal & basic operations", "Prefix sum", "Kadane's algorithm", "Rotate / reverse array", "Matrix basics"] },
  { category: "DSA", name: "Searching and Sorting", subtopics: ["Linear & binary search", "Bubble, selection, insertion sort", "Merge sort", "Quick sort", "Binary search on answer"] },
  { category: "DSA", name: "Two Pointers", subtopics: ["Pair sum in sorted array", "Remove duplicates", "Three sum", "Container with most water"] },
  { category: "DSA", name: "Sliding Window", subtopics: ["Fixed size window", "Variable size window", "Longest substring problems", "Minimum window substring"] },
  { category: "DSA", name: "Linked Lists", subtopics: ["Singly linked list", "Reverse a list", "Detect cycle (Floyd)", "Merge two sorted lists", "Doubly linked list"] },
  { category: "DSA", name: "Stacks and Queues", subtopics: ["Stack using array", "Balanced parentheses", "Next greater element", "Queue & circular queue", "Monotonic stack"] },
  { category: "DSA", name: "Recursion", subtopics: ["Base case & recursive case", "Subsets & permutations", "Backtracking basics", "N-Queens"] },
  { category: "DSA", name: "Trees", subtopics: ["Binary tree traversals", "Height & diameter", "Binary search tree", "Level order traversal", "Lowest common ancestor"] },
  { category: "DSA", name: "Graphs", subtopics: ["Graph representation", "BFS", "DFS", "Shortest path (Dijkstra)", "Topological sort", "Union find"] },
  { category: "DSA", name: "Dynamic Programming", subtopics: ["Memoization vs tabulation", "1D DP (Fibonacci, climbing stairs)", "Knapsack", "Longest common subsequence", "DP on grids"] },

  // ----- DEVELOPMENT -----
  { category: "Development", name: "HTML", subtopics: ["Semantic tags", "Forms & inputs", "Tables & lists", "Accessibility basics"] },
  { category: "Development", name: "CSS", subtopics: ["Box model", "Flexbox", "Grid", "Responsive design & media queries", "Animations & transitions"] },
  { category: "Development", name: "JavaScript", subtopics: ["Variables, data types, operators", "Functions & scope", "Arrays & objects", "ES6 features", "Async JS (promises, fetch)"] },
  { category: "Development", name: "DOM Manipulation", subtopics: ["Selecting elements", "Events & listeners", "Creating / removing elements", "Forms & validation", "LocalStorage"] },
  { category: "Development", name: "Git and GitHub", subtopics: ["init, add, commit", "Branches & merging", "Push, pull, clone", "Pull requests", "Resolving conflicts"] },
  { category: "Development", name: "Backend Fundamentals", subtopics: ["How the web works (HTTP)", "Node.js basics", "REST APIs", "Authentication basics"] },
  { category: "Development", name: "Database Fundamentals", subtopics: ["SQL basics (CRUD)", "Joins", "Indexes", "NoSQL basics (MongoDB)"] },

  // ----- CORE CS -----
  { category: "Core CS", name: "DBMS", subtopics: ["ER model", "Normalization", "SQL queries & joins", "Transactions & ACID", "Indexing"] },
  { category: "Core CS", name: "Operating Systems", subtopics: ["Processes & threads", "CPU scheduling", "Deadlocks", "Memory management", "Paging & virtual memory"] },
  { category: "Core CS", name: "Computer Networks", subtopics: ["OSI & TCP/IP model", "IP addressing", "TCP vs UDP", "HTTP & HTTPS", "DNS"] },
  { category: "Core CS", name: "OOPs", subtopics: ["Classes & objects", "Inheritance", "Polymorphism", "Encapsulation & abstraction", "SOLID basics"] },

  // ----- APTITUDE -----
  { category: "Aptitude", name: "Quantitative Aptitude", subtopics: ["Percentages", "Profit & loss", "Time & work", "Speed, time & distance", "Permutation & combination", "Probability"] },
  { category: "Aptitude", name: "Logical Reasoning", subtopics: ["Series & patterns", "Blood relations", "Seating arrangement", "Syllogisms", "Puzzles"] },
  { category: "Aptitude", name: "Verbal Ability", subtopics: ["Reading comprehension", "Grammar & error spotting", "Synonyms & antonyms", "Sentence correction"] },

  // ----- COMMUNICATION -----
  { category: "Communication", name: "English Speaking", subtopics: ["Daily speaking practice", "Pronunciation", "Vocabulary building", "Listening practice"] },
  { category: "Communication", name: "Self-Introduction", subtopics: ["Structure of a good intro", "Writing your script", "Practice in front of mirror", "Record & review"] },
  { category: "Communication", name: "Interview Communication", subtopics: ["Common HR questions", "STAR method", "Explaining projects clearly", "Body language & confidence"] },
  { category: "Communication", name: "Group Discussion", subtopics: ["GD structure & etiquette", "Opening & closing points", "Current affairs topics", "Practice with friends"] }
];

/* ---------- 3. DEFAULT SETTINGS ---------- */
function defaultSettings() {
  return {
    dailyStudyMinutes: 240,                       // roz kitne minute padh sakte hain
    preferredCategories: ["DSA", "Development", "Core CS", "Aptitude", "Communication"],
    academicWeight: "Balanced",                   // "Low", "Balanced", "High" (academic ko kitna priority)
    revisionIntervals: [1, 3, 7, 14],             // spaced revision ke din
    theme: "light"                                // "light" ya "dark"
  };
}

/* ---------- 4. SAMPLE DATA ----------
   Pehli baar app khulne par yeh data dikhta hai.
   Dates "aaj" ke hisaab se banti hain, isliye hamesha relevant rehti hain. */
function buildSampleData() {
  const today = todayISO();

  /* --- Roadmap: template se progress records banao --- */
  const roadmap = ROADMAP_TEMPLATE.map(function (t, index) {
    return {
      id: "topic_" + index,
      category: t.category,
      name: t.name,
      subtopics: t.subtopics,
      completedSubtopics: [],       // kaun se subtopics ho chuke (index numbers)
      status: "Not Started",
      notes: "",
      lastStudied: "",
      nextRevision: ""
    };
  });

  // Helper: naam se topic dhoondh kar uska progress set karta hai
  function setTopic(name, status, doneCount, notes, lastStudiedDaysAgo) {
    const topic = roadmap.find(function (t) { return t.name === name; });
    topic.status = status;
    topic.completedSubtopics = [];
    for (let i = 0; i < doneCount; i++) topic.completedSubtopics.push(i);
    topic.notes = notes || "";
    if (lastStudiedDaysAgo !== null) topic.lastStudied = addDays(today, -lastStudiedDaysAgo);
  }

  setTopic("Arrays", "Completed", 5, "Kadane and prefix sum are very important.", 6);
  setTopic("Searching and Sorting", "In Progress", 3, "Revise merge sort dry run.", 2);
  setTopic("Two Pointers", "In Progress", 2, "", 1);
  setTopic("HTML", "Completed", 4, "", 12);
  setTopic("CSS", "Completed", 5, "Flexbox + Grid done.", 9);
  setTopic("JavaScript", "In Progress", 3, "Practice array methods daily.", 1);
  setTopic("DBMS", "In Progress", 2, "Normalization needs revision.", 3);
  setTopic("Quantitative Aptitude", "In Progress", 2, "", 4);
  setTopic("Self-Introduction", "Completed", 4, "Script ready.", 7);

  /* --- Revisions: kuch due, kuch overdue, kuch upcoming, ek completed --- */
  const revisions = [
    { id: generateId("rev"), topicId: "topic_0", title: "Arrays", category: "DSA",
      stage: 2, dueDate: today, status: "Pending", completedOn: "" },
    { id: generateId("rev"), topicId: "topic_10", title: "HTML", category: "Development",
      stage: 3, dueDate: addDays(today, -2), status: "Pending", completedOn: "" },
    { id: generateId("rev"), topicId: "topic_11", title: "CSS", category: "Development",
      stage: 2, dueDate: addDays(today, 2), status: "Pending", completedOn: "" },
    { id: generateId("rev"), topicId: "topic_25", title: "Self-Introduction", category: "Communication",
      stage: 3, dueDate: addDays(today, 5), status: "Pending", completedOn: "" },
    { id: generateId("rev"), topicId: "topic_0", title: "Arrays", category: "DSA",
      stage: 1, dueDate: addDays(today, -3), status: "Completed", completedOn: addDays(today, -3) }
  ];

  // Roadmap ke nextRevision ko revisions se match karo
  roadmap.find(function (t) { return t.id === "topic_0"; }).nextRevision = today;
  roadmap.find(function (t) { return t.id === "topic_10"; }).nextRevision = addDays(today, -2);
  roadmap.find(function (t) { return t.id === "topic_11"; }).nextRevision = addDays(today, 2);
   roadmap.find(function (t) { return t.id === "topic_25"; }).nextRevision = addDays(today, 5);

  /* --- Academic tasks --- */
  const academicTasks = [
    { id: generateId("acad"), title: "Internal Exam – Data Structures", subject: "Data Structures",
      type: "Internal Exam", dueDate: addDays(today, 4), estimatedMinutes: 120, priority: "High",
      completed: false, unitsNote: "Unit 1-3: Arrays, Linked Lists, Stacks" },
    { id: generateId("acad"), title: "DBMS Assignment 2 – ER Diagram", subject: "DBMS",
      type: "Assignment", dueDate: addDays(today, 2), estimatedMinutes: 90, priority: "High",
      completed: false, unitsNote: "Unit 2: ER model" },
    { id: generateId("acad"), title: "Mathematics – Unit 3 Practice", subject: "Mathematics",
      type: "Study Task", dueDate: addDays(today, 9), estimatedMinutes: 60, priority: "Medium",
      completed: false, unitsNote: "Unit 3: Matrices" },
    { id: generateId("acad"), title: "Semester Exam – Operating Systems", subject: "Operating Systems",
      type: "Semester Exam", dueDate: addDays(today, 24), estimatedMinutes: 180, priority: "Medium",
      completed: false, unitsNote: "Unit 1-5" },
    { id: generateId("acad"), title: "English Lab Report", subject: "English",
      type: "Assignment", dueDate: addDays(today, -1), estimatedMinutes: 45, priority: "Low",
      completed: true, unitsNote: "" }
  ];
  
    /* --- Subjects and their units --- */
  // unit() ek chhota helper hai jo ek unit ka object banata hai
  function unit(title, done) {
    return { id: generateId("unit"), title: title, done: done };
  }
  const subjects = [
    { id: generateId("subj"), name: "Data Structures", units: [
      unit("Unit 1 – Arrays & Strings", true), unit("Unit 2 – Linked Lists", true),
      unit("Unit 3 – Stacks & Queues", false), unit("Unit 4 – Trees", false), unit("Unit 5 – Graphs", false) ] },
    { id: generateId("subj"), name: "DBMS", units: [
      unit("Unit 1 – Introduction & ER Model", true), unit("Unit 2 – Relational Model & SQL", false),
      unit("Unit 3 – Normalization", false), unit("Unit 4 – Transactions & Concurrency", false) ] },
    { id: generateId("subj"), name: "Mathematics", units: [
      unit("Unit 1 – Differential Calculus", true), unit("Unit 2 – Integral Calculus", true),
      unit("Unit 3 – Matrices", false), unit("Unit 4 – Probability", false) ] },
    { id: generateId("subj"), name: "Operating Systems", units: [
      unit("Unit 1 – Processes & Threads", false), unit("Unit 2 – CPU Scheduling", false),
      unit("Unit 3 – Deadlocks", false), unit("Unit 4 – Memory Management", false), unit("Unit 5 – File Systems", false) ] },
    { id: generateId("subj"), name: "English", units: [
      unit("Unit 1 – Grammar", true), unit("Unit 2 – Technical Writing", true), unit("Unit 3 – Presentation Skills", true) ] }
  ];
  /* --- DSA questions --- */
  function q(title, topic, difficulty, status, solvedDaysAgo, link, notes, revise) {
    return {
      id: generateId("dsa"), title: title, topic: topic, difficulty: difficulty, status: status,
      dateSolved: solvedDaysAgo === null ? "" : addDays(today, -solvedDaysAgo),
      link: link, notes: notes, markedForRevision: revise
    };
  }
  const dsaQuestions = [
    q("Two Sum", "Arrays", "Easy", "Solved", 6, "https://leetcode.com/problems/two-sum/", "Use hashmap for O(n).", false),
    q("Maximum Subarray", "Arrays", "Medium", "Solved", 5, "https://leetcode.com/problems/maximum-subarray/", "Kadane's algorithm.", true),
    q("Best Time to Buy and Sell Stock", "Arrays", "Easy", "Solved", 5, "", "", false),
    q("Binary Search", "Searching and Sorting", "Easy", "Solved", 3, "https://leetcode.com/problems/binary-search/", "", false),
    q("Merge Sort Implementation", "Searching and Sorting", "Medium", "Attempted", null, "", "Merge step is confusing.", true),
    q("Valid Palindrome", "Two Pointers", "Easy", "Solved", 2, "https://leetcode.com/problems/valid-palindrome/", "", false),
    q("3Sum", "Two Pointers", "Medium", "Attempted", null, "https://leetcode.com/problems/3sum/", "Duplicates handling.", true),
    q("Longest Substring Without Repeating Characters", "Sliding Window", "Medium", "Not Started", null, "", "", false),
    q("Reverse Linked List", "Linked Lists", "Easy", "Not Started", null, "https://leetcode.com/problems/reverse-linked-list/", "", false),
    q("Valid Parentheses", "Stacks and Queues", "Easy", "Not Started", null, "", "", false),
    q("Climbing Stairs", "Dynamic Programming", "Easy", "Not Started", null, "", "", false)
  ];

  /* --- Skills --- */
  const skills = [
    { id: generateId("skill"), name: "JavaScript", goal: "Build 3 projects and master ES6", topicsCompleted: "Variables, Functions, Arrays, DOM basics", progress: 45, notes: "Practice daily for 1 hour." },
    { id: generateId("skill"), name: "Java", goal: "Solve DSA problems confidently in Java", topicsCompleted: "Syntax, OOPs basics", progress: 40, notes: "" },
    { id: generateId("skill"), name: "SQL", goal: "Write joins and subqueries without help", topicsCompleted: "SELECT, WHERE, GROUP BY", progress: 35, notes: "" },
    { id: generateId("skill"), name: "DBMS", goal: "Clear interview-level DBMS questions", topicsCompleted: "ER model, Keys", progress: 30, notes: "Normalization pending." },
    { id: generateId("skill"), name: "DSA", goal: "Solve 200 questions before placements", topicsCompleted: "Arrays, Searching, Sorting basics", progress: 25, notes: "" },
    { id: generateId("skill"), name: "Communication", goal: "Speak confidently in interviews", topicsCompleted: "Self-introduction script", progress: 50, notes: "Record yourself weekly." }
  ];

  /* --- Projects --- */
  const projects = [
    { id: generateId("proj"), name: "CareerTrack Planner", description: "Study and placement planner built with HTML, CSS and JavaScript.",
      techStack: "HTML, CSS, JavaScript", status: "In Progress", deadline: addDays(today, 30),
      githubLink: "", deployLink: "",
      tasks: [
        { id: generateId("ptask"), title: "Design dashboard layout", done: true },
        { id: generateId("ptask"), title: "Build Today's Targets logic", done: false },
        { id: generateId("ptask"), title: "Deploy on GitHub Pages", done: false }
      ] },
    { id: generateId("proj"), name: "Personal Portfolio Website", description: "Portfolio showcasing my projects and skills.",
      techStack: "HTML, CSS", status: "Planning", deadline: addDays(today, 45),
      githubLink: "", deployLink: "",
      tasks: [
        { id: generateId("ptask"), title: "Collect project screenshots", done: false },
        { id: generateId("ptask"), title: "Write About Me section", done: false }
      ] }
  ];

  /* --- Job / internship applications --- */
  const applications = [
    { id: generateId("app"), company: "TechNova Solutions", role: "Software Development Intern", appliedDate: addDays(today, -7),
      status: "Applied", interviewDate: "", link: "", notes: "Applied through college portal." },
    { id: generateId("app"), company: "DataWave Analytics", role: "Data Analyst Intern", appliedDate: addDays(today, -14),
      status: "Interview", interviewDate: addDays(today, 3), link: "", notes: "Revise SQL and projects." },
    { id: generateId("app"), company: "CloudBridge", role: "Frontend Developer Intern", appliedDate: "",
      status: "Interested", interviewDate: "", link: "", notes: "Deadline to apply soon." }
  ];

  /* --- Poora data ek object me --- */
  return {
    roadmap: roadmap,
    revisions: revisions,
    academicTasks: academicTasks,
    subjects : subjects,
    dsaQuestions: dsaQuestions,
    skills: skills,
    projects: projects,
    applications: applications,
    dailyPlans: {},              // { "2026-09-28": [ {...target}, ... ] } – har din ka plan
    settings: defaultSettings()
  };
}