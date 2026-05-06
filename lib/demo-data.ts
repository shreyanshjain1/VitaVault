export type DemoNavItem = { href: string; label: string; description?: string };

export const demoPatient = {
  name: "Elena Cruz",
  age: 34,
  sex: "Female",
  bloodType: "O+",
  email: "elena.cruz@example.com",
  phone: "+63 917 555 0198",
  emergencyContact: "Marco Cruz · +63 917 555 0117",
  address: "Quezon City, Metro Manila",
  allergies: ["Penicillin", "Shellfish"],
  chronicConditions: ["Type 2 Diabetes", "Hypertension"],
  heightCm: 163,
  weightKg: 67,
  bmi: 25.2,
  lastUpdated: "April 24, 2026",
};

export const demoNav: DemoNavItem[] = [
  { href: "/demo", label: "Overview", description: "Public product walkthrough" },
  { href: "/demo/walkthrough", label: "Guided Walkthrough", description: "Recommended reviewer path" },
  { href: "/demo/dashboard", label: "Dashboard", description: "Health command center" },
  { href: "/demo/notifications", label: "Notifications", description: "Unified care inbox" },
  { href: "/demo/care-plan", label: "Care Plan", description: "Prioritized care actions" },
  { href: "/demo/visit-prep", label: "Visit Prep", description: "Doctor visit readiness" },
  { href: "/demo/emergency-card", label: "Emergency Card", description: "Printable emergency profile" },
  { href: "/demo/trends", label: "Health Trends", description: "Clinical analytics layer" },
  { href: "/demo/medication-safety", label: "Medication Safety", description: "Dose and adherence review" },
  { href: "/demo/lab-review", label: "Lab Review", description: "Lab flags and trends" },
  { href: "/demo/vitals-monitor", label: "Vitals Monitor", description: "Vital sign watch board" },
  { href: "/demo/symptom-review", label: "Symptom Review", description: "Symptom review workspace" },
  { href: "/demo/health-profile", label: "Health Profile", description: "Patient baseline" },
  { href: "/demo/medications", label: "Medications", description: "Medication list and adherence" },
  { href: "/demo/appointments", label: "Appointments", description: "Upcoming and completed visits" },
  { href: "/demo/labs", label: "Labs", description: "Lab history and flags" },
  { href: "/demo/vitals", label: "Vitals", description: "Recent vital readings" },
  { href: "/demo/symptoms", label: "Symptoms", description: "Symptom journal" },
  { href: "/demo/vaccinations", label: "Vaccinations", description: "Preventive care" },
  { href: "/demo/doctors", label: "Doctors", description: "Care provider directory" },
  { href: "/demo/documents", label: "Documents", description: "Protected file index" },
  { href: "/demo/care-team", label: "Care Team", description: "Shared access preview" },
  { href: "/demo/ai-insights", label: "AI Insights", description: "AI-assisted summaries" },
  { href: "/demo/alerts", label: "Alerts", description: "Alert events and rules" },
  { href: "/demo/timeline", label: "Timeline", description: "Merged patient activity" },
  { href: "/demo/reminders", label: "Reminders", description: "Follow-up tasks" },
  { href: "/demo/review-queue", label: "Review Queue", description: "Care review workload" },
  { href: "/demo/summary", label: "Summary", description: "Patient handoff summary" },
  { href: "/demo/exports", label: "Exports", description: "Portable reports" },
  { href: "/demo/device-connection", label: "Device Connections", description: "Connected data readiness" },
  { href: "/demo/device-sync-simulator", label: "Device Sync Simulator", description: "Connected-device sync demo" },
  { href: "/demo/audit-log", label: "Audit Log", description: "Unified audit trail" },
  { href: "/demo/api-docs", label: "API Docs", description: "Mobile/device API reference" },
  { href: "/demo/jobs", label: "Jobs", description: "Worker activity" },
  { href: "/demo/ops", label: "Ops", description: "System readiness" },
  { href: "/demo/security", label: "Security", description: "Session and account posture" },
  { href: "/demo/admin", label: "Admin", description: "Business control surface" },
];

export const demoDashboardStats = [
  { label: "Open alerts", value: "6", note: "2 critical, 2 warning, 2 info" },
  { label: "Due reminders", value: "14", note: "Medication, appointments, and follow-up tasks" },
  { label: "Documents stored", value: "27", note: "Protected delivery with linked records" },
  { label: "Care members", value: "4", note: "Family, physician, lab staff, and admin support" },
];

export const demoMedications = [
  { name: "Metformin", dosage: "500 mg", frequency: "Twice daily", times: ["08:00", "20:00"], status: "Active", doctor: "Dr. Santos", adherence: "94%", instructions: "After meals" },
  { name: "Losartan", dosage: "50 mg", frequency: "Once daily", times: ["07:00"], status: "Active", doctor: "Dr. Reyes", adherence: "98%", instructions: "Take with water" },
  { name: "Atorvastatin", dosage: "20 mg", frequency: "Nightly", times: ["21:00"], status: "Active", doctor: "Dr. Reyes", adherence: "89%", instructions: "Avoid grapefruit juice" },
];

export const demoAppointments = [
  { title: "Quarterly endocrinology review", when: "May 4, 2026 · 9:00 AM", location: "St. Luke\"s BGC", status: "UPCOMING", doctor: "Dr. Santos", note: "Discuss A1C trend and weight management plan" },
  { title: "Eye screening", when: "May 11, 2026 · 2:00 PM", location: "VisionPlus Clinic", status: "UPCOMING", doctor: "Dr. Lim", note: "Annual diabetic retinopathy check" },
  { title: "Annual physical exam", when: "April 10, 2026 · 11:30 AM", location: "Healthway", status: "COMPLETED", doctor: "Dr. Reyes", note: "Updated lab orders and cardiovascular risk review" },
];

export const demoLabs = [
  { test: "HbA1c", value: "6.8%", trend: "Improved from 7.4%", status: "Good", collectedAt: "Apr 20, 2026", lab: "Hi-Precision Diagnostics" },
  { test: "LDL Cholesterol", value: "92 mg/dL", trend: "Stable", status: "Watch", collectedAt: "Apr 20, 2026", lab: "Hi-Precision Diagnostics" },
  { test: "Creatinine", value: "0.88 mg/dL", trend: "Normal", status: "Normal", collectedAt: "Apr 20, 2026", lab: "St. Luke\"s Lab" },
];

export const demoVitals = [
  { metric: "Blood Pressure", latest: "122 / 78", range: "118–128 / 76–82", note: "Controlled over the last 30 days" },
  { metric: "Fasting Glucose", latest: "109 mg/dL", range: "102–118 mg/dL", note: "Slightly elevated but improving" },
  { metric: "Weight", latest: "67.0 kg", range: "66.6–68.1 kg", note: "Down 1.4 kg from February" },
  { metric: "Heart Rate", latest: "71 bpm", range: "68–77 bpm", note: "Stable resting trend" },
];

export const demoSymptoms = [
  { name: "Morning headache", severity: "Mild", status: "Resolved", loggedAt: "Apr 22, 2026 · 7:15 AM", note: "Likely dehydration, improved after fluids" },
  { name: "Occasional tingling in feet", severity: "Moderate", status: "Monitoring", loggedAt: "Apr 19, 2026 · 8:00 PM", note: "Flagged for next endocrinology review" },
  { name: "Dry eyes", severity: "Mild", status: "Open", loggedAt: "Apr 18, 2026 · 4:20 PM", note: "Related to screen time and sleep quality" },
];

export const demoVaccinations = [
  { name: "Influenza", date: "Oct 12, 2025", provider: "Healthway", status: "Up to date" },
  { name: "COVID-19 booster", date: "Jan 18, 2026", provider: "Makati Med", status: "Up to date" },
  { name: "Pneumococcal", date: "Recommended by Jul 2026", provider: "Primary physician", status: "Due soon" },
];

export const demoDoctors = [
  { name: "Dr. Angela Santos", specialty: "Endocrinology", clinic: "St. Luke\"s BGC", phone: "+63 2 8789 7700", email: "asantos@stlukes.example.com" },
  { name: "Dr. Paolo Reyes", specialty: "Internal Medicine", clinic: "Healthway Quezon City", phone: "+63 2 8123 4567", email: "preyes@healthway.example.com" },
  { name: "Dr. Hazel Lim", specialty: "Ophthalmology", clinic: "VisionPlus Clinic", phone: "+63 2 8555 2100", email: "hlim@visionplus.example.com" },
];

export const demoDocuments = [
  { name: "A1C-Apr-2026.pdf", type: "Lab Result", linkedTo: "HbA1c · Apr 20, 2026", access: "Protected", size: "284 KB" },
  { name: "Annual-Physical-Summary.pdf", type: "Consult Note", linkedTo: "Annual physical exam", access: "Protected", size: "412 KB" },
  { name: "Eye-Screening-Referral.pdf", type: "Referral", linkedTo: "Ophthalmology", access: "Protected", size: "198 KB" },
];

export const demoCareTeam = {
  members: [
    { name: "Marco Cruz", role: "Caregiver", access: "Medications, appointments, reminders", status: "Active" },
    { name: "Dr. Angela Santos", role: "Doctor", access: "Labs, vitals, summary, alerts", status: "Active" },
    { name: "Hi-Precision Diagnostics", role: "Lab Staff", access: "Lab upload only", status: "Limited" },
    { name: "Admin Support", role: "Admin", access: "Operational oversight", status: "Active" },
  ],
  invites: [
    { recipient: "daughter@example.com", role: "Caregiver", sentAt: "Apr 23, 2026", delivery: "Email sent", status: "Pending" },
    { recipient: "dietitian@example.com", role: "Specialist", sentAt: "Apr 22, 2026", delivery: "Manual link copied", status: "Pending" },
  ],
};

export const demoAiInsights = [
  { title: "Blood sugar stability is improving", severity: "Positive", summary: "Recent fasting glucose and A1C trends suggest better adherence and diet consistency over the last 8 weeks." },
  { title: "Neuropathy watch signal", severity: "Monitor", summary: "Foot tingling has appeared twice this month. Recommend discussing neuropathy screening and vitamin B12 status." },
  { title: "Next preventive gap", severity: "Action", summary: "Pneumococcal vaccine is due soon and eye screening follow-up is already scheduled." },
];

export const demoAlerts = {
  events: [
    { title: "Foot tingling symptom cluster", severity: "WARNING", status: "OPEN", category: "Symptoms", source: "Symptom log", createdAt: "Apr 22, 2026 · 8:40 PM" },
    { title: "Missed atorvastatin twice this week", severity: "INFO", status: "ACKNOWLEDGED", category: "Adherence", source: "Reminder engine", createdAt: "Apr 21, 2026 · 9:05 PM" },
    { title: "A1C remained above target", severity: "WARNING", status: "OPEN", category: "Lab threshold", source: "Lab result", createdAt: "Apr 20, 2026 · 4:30 PM" },
  ],
  rules: [
    { name: "A1C above 6.5%", category: "Lab", severity: "WARNING", status: "Enabled" },
    { name: "Two skipped doses in 7 days", category: "Medication", severity: "INFO", status: "Enabled" },
    { name: "Foot tingling repeated twice in 14 days", category: "Symptoms", severity: "WARNING", status: "Enabled" },
  ],
};

export const demoTimeline = [
  { at: "Apr 24, 2026 · 7:00 AM", type: "Reminder", title: "Morning medications sent", detail: "Metformin and Losartan were marked due and delivered by email + in-app" },
  { at: "Apr 22, 2026 · 8:40 PM", type: "Alert", title: "Foot tingling alert opened", detail: "Created from symptom clustering rule" },
  { at: "Apr 20, 2026 · 4:00 PM", type: "Lab", title: "A1C result uploaded", detail: "Linked document and alert evaluation completed" },
  { at: "Apr 10, 2026 · 12:30 PM", type: "Appointment", title: "Annual physical completed", detail: "Summary export and follow-up tasks created" },
];

export const demoReminders = [
  { title: "Metformin morning dose", when: "Today · 8:00 AM", channel: "Email + in-app", state: "Sent" },
  { title: "Losartan refill review", when: "Tomorrow · 9:00 AM", channel: "In-app", state: "Due" },
  { title: "Eye screening appointment", when: "May 11, 2026 · 1:00 PM", channel: "Email + in-app", state: "Scheduled" },
];

export const demoReviewQueue = [
  { item: "Foot tingling follow-up", source: "Alert + symptom", tone: "Watch", owner: "Dr. Santos", status: "Pending review" },
  { item: "Medication adherence drift", source: "Reminder engine", tone: "Info", owner: "Caregiver", status: "In progress" },
  { item: "Preventive vaccine gap", source: "Summary engine", tone: "Healthy", owner: "Primary care", status: "Queued" },
];

export const demoSummary = {
  snapshot: "Elena Cruz is a 34-year-old patient with diabetes and hypertension currently showing improved glycemic control, stable blood pressure, and one monitored neuropathy-related symptom signal.",
  highlights: [
    "A1C improved from 7.4% to 6.8% this quarter.",
    "Blood pressure remained within target range over the last 30 days.",
    "One warning alert remains open for recurring tingling in feet.",
    "Pneumococcal vaccination is the next preventive care gap.",
  ],
};

export const demoExports = [
  { name: "Patient Summary PDF", format: "Browser PDF", status: "Ready", note: "Compact and standard print modes" },
  { name: "Medication CSV", format: "CSV", status: "Ready", note: "Includes schedules and doctor linkage" },
  { name: "Document Index CSV", format: "CSV", status: "Ready", note: "Shows protected file access references" },
  { name: "Alerts Snapshot CSV", format: "CSV", status: "Ready", note: "Useful for admin review and handoff" },
];

export const demoDevices = [
  { provider: "Health Connect", status: "Active", lastSync: "15 minutes ago", readings: "Glucose, steps, weight" },
  { provider: "Apple Health import", status: "Error", lastSync: "2 days ago", readings: "Weight only", note: "Token refresh needed" },
  { provider: "Bluetooth BP monitor", status: "Active", lastSync: "Today · 6:30 AM", readings: "Blood pressure" },
];

export const demoJobs = [
  { job: "ALERT_SCAN", queue: "alerts", status: "Succeeded", at: "Today · 8:02 AM" },
  { job: "REMINDER_DISPATCH", queue: "reminders", status: "Succeeded", at: "Today · 7:00 AM" },
  { job: "DEVICE_SYNC", queue: "mobile-sync", status: "Retrying", at: "Today · 6:35 AM" },
];

export const demoOps = {
  readiness: [
    { label: "Database", status: "Ready" },
    { label: "Email delivery", status: "Configured" },
    { label: "Internal API auth", status: "Configured" },
    { label: "Redis / job queues", status: "Ready with degraded fallback" },
  ],
  metrics: [
    { label: "Pending invites", value: "2" },
    { label: "Reminder emails (7d)", value: "48" },
    { label: "Resolved alerts (24h)", value: "3" },
    { label: "Sync failures", value: "1" },
  ],
};

export const demoSecurity = {
  posture: [
    { label: "Password status", value: "Configured" },
    { label: "Email verification", value: "Verified" },
    { label: "Active mobile sessions", value: "3" },
    { label: "Protected documents", value: "27 files" },
  ],
  sessions: [
    { device: "Pixel 8 · Android", createdAt: "Apr 23, 2026", lastUsed: "10 minutes ago", expires: "May 23, 2026", state: "Active" },
    { device: "iPad Safari", createdAt: "Apr 19, 2026", lastUsed: "Yesterday", expires: "May 19, 2026", state: "Active" },
    { device: "MacBook Chrome", createdAt: "Apr 10, 2026", lastUsed: "Apr 21, 2026", expires: "May 10, 2026", state: "Revoked" },
  ],
};

export const demoAdmin = {
  metrics: [
    { label: "Total users", value: "148" },
    { label: "Verified users", value: "133" },
    { label: "Deactivated users", value: "4" },
    { label: "Failed jobs", value: "2" },
  ],
  roster: [
    { name: "Elena Cruz", role: "PATIENT", status: "Active", sessions: 3, alerts: 2, documents: 27 },
    { name: "Marco Cruz", role: "CAREGIVER", status: "Active", sessions: 1, alerts: 0, documents: 0 },
    { name: "Admin Support", role: "ADMIN", status: "Active", sessions: 2, alerts: 0, documents: 0 },
    { name: "Dormant Demo User", role: "PATIENT", status: "Deactivated", sessions: 0, alerts: 1, documents: 4 },
  ],
  audit: [
    { source: "user", message: "Admin re-sent verification email to dietitian@example.com", at: "Apr 24, 2026 · 8:10 AM" },
    { source: "security", message: "Revoked all mobile sessions for Dormant Demo User", at: "Apr 24, 2026 · 8:00 AM" },
    { source: "access", message: "Caregiver invite accepted by Marco Cruz", at: "Apr 23, 2026 · 5:15 PM" },
  ],
};

export const demoTourSteps = [
  {
    step: "01",
    title: "Start with the health command center",
    route: "/demo/dashboard",
    status: "Start here",
    body: "Shows the patient snapshot, current risk posture, active reminders, and recent activity in one reviewer-friendly screen.",
  },
  {
    step: "02",
    title: "Review the care workflow hubs",
    route: "/notifications",
    status: "Workflow hubs",
    body: "Notification Center, Care Plan, Visit Prep, and Emergency Card show how VitaVault turns records into next actions.",
  },
  {
    step: "03",
    title: "Inspect clinical review depth",
    route: "/trends",
    status: "Clinical review",
    body: "Health Trends, Medication Safety, Lab Review, Vitals Monitor, and Symptom Review show interpretation surfaces on top of records.",
  },
  {
    step: "04",
    title: "Open the core health record modules",
    route: "/demo/health-profile",
    status: "Records",
    body: "Review the structured patient profile, medications, appointments, labs, vitals, symptoms, vaccinations, doctors, and documents.",
  },
  {
    step: "05",
    title: "Inspect action workflows",
    route: "/demo/alerts",
    status: "Alerts and review",
    body: "Alert rules, reminder queues, AI insights, review queue, and summary exports show that VitaVault goes beyond storage.",
  },
  {
    step: "06",
    title: "Review collaboration and operations",
    route: "/demo/care-team",
    status: "Business-ready",
    body: "Care-team access, security controls, audit log, admin visibility, device connections, jobs, and ops pages show the operational product layer.",
  },
];

export const demoPersona = {
  patient: "Elena Cruz",
  profile: "34-year-old patient managing Type 2 Diabetes and Hypertension",
  reviewerGoal: "Evaluate the product surface without needing a configured database or login flow.",
  recommendedPath: ["Dashboard", "Notifications", "Care Plan", "Visit Prep", "Health Trends", "Summary", "Security", "Admin"],
  showcaseStrengths: [
    "Broad health-record coverage",
    "Care-team sharing foundations",
    "Alerts, reminders, review queue, and jobs",
    "Mobile/device sync API groundwork",
    "Security, admin, ops, exports, and public demo surfaces",
  ],
};

export const demoShowcaseMetrics = [
  { label: "Demo modules", value: "25", note: "Public read-only pages plus a guided walkthrough for reviewers" },
  { label: "Clinical records", value: "9", note: "Profile, meds, labs, vitals, symptoms, vaccines, doctors, documents, timeline" },
  { label: "Workflow layers", value: "12+", note: "Notifications, care plan, visit prep, alerts, reminders, review, exports, device sync, jobs" },
  { label: "Ops surfaces", value: "5", note: "Security, audit log, admin, ops, jobs, and reviewer-friendly controls" },
];

export const demoReadinessChecklist = [
  { label: "No-login product walkthrough", status: "Ready", detail: "The /demo surface can be shared with reviewers even while database-backed deployment is being configured." },
  { label: "Demo persona consistency", status: "Ready", detail: "Core demo pages revolve around Elena Cruz and her care-management workflow." },
  { label: "Reviewer path", status: "Ready", detail: "The overview now explains the best route through the product surface." },
  { label: "Real-app handoff", status: "Preview", detail: "The demo links to login/signup for the real authenticated experience when environment variables are configured." },
];

export const demoFeatureHighlights = [
  { title: "Health command center", body: "The dashboard brings together patient context, alerts, reminders, recent activity, and care tasks.", status: "Core" },
  { title: "Care workflow hubs", body: "Notification Center, Care Plan, Visit Prep, and Emergency Card show practical workflows for daily care management.", status: "Workflow" },
  { title: "Clinical review layer", body: "Trends, Medication Safety, Lab Review, Vitals Monitor, and Symptom Review turn health records into review-ready signals.", status: "Review" },
  { title: "Patient handoff packet", body: "The summary and exports surfaces present printable reports that can support doctor visits and care coordination.", status: "Business" },
  { title: "Connected care foundation", body: "Care-team access, device sync, mobile tokens, alerting, jobs, audit, and ops pages show how the app can grow into a real product.", status: "Architecture" },
];


export const demoProductHubs = [
  { label: "Notification Center", href: "/demo/notifications", layer: "Care workflow", body: "Unified inbox for alerts, reminders, appointments, labs, documents, care invites, and device sync issues." },
  { label: "Care Plan Hub", href: "/demo/care-plan", layer: "Care workflow", body: "Readiness score, prioritized actions, upcoming care timeline, providers, active meds, and latest vitals." },
  { label: "Visit Prep", href: "/demo/visit-prep", layer: "Care workflow", body: "Provider-ready appointment prep with missing context, recent labs, symptoms, vitals, documents, and doctor packet handoff." },
  { label: "Emergency Card", href: "/demo/emergency-card", layer: "Reports", body: "Printable emergency profile with blood type, allergies, conditions, contacts, active medications, and latest vitals." },
  { label: "Health Trends", href: "/demo/trends", layer: "Clinical review", body: "Trend coverage, risk scoring, vital averages, lab flags, symptom severity, adherence, and merged clinical timeline." },
  { label: "Medication Safety", href: "/demo/medication-safety", layer: "Clinical review", body: "Dose board, adherence signal, missed/skipped rates, medication reminders, safety actions, and provider context." },
  { label: "Lab Review", href: "/demo/lab-review", layer: "Clinical review", body: "Lab readiness, abnormal/borderline action queue, trend cards, document coverage, and provider review guidance." },
  { label: "Vitals Monitor", href: "/demo/vitals-monitor", layer: "Clinical review", body: "Latest/previous readings, deltas, watch-zone detection, averages, timeline, and device connection signal." },
  { label: "Symptom Review", href: "/demo/symptom-review", layer: "Clinical review", body: "Severity breakdown, unresolved symptom metrics, body-area clusters, action queue, filters, and handoff signals." },
  { label: "Device Sync Simulator", href: "/demo/device-sync-simulator", layer: "Platform", body: "Simulated Apple Health, Health Connect, BP monitor, pulse ox, and smart scale sync flow for reviewer demos." },
  { label: "Audit Log", href: "/demo/audit-log", layer: "Security/Ops", body: "Unified audit feed for care access, alerts, reminders, jobs, and mobile/API session events." },
  { label: "Mobile API Docs", href: "/demo/api-docs", layer: "Platform", body: "Product-facing documentation for mobile login, bearer sessions, device connections, and reading ingestion." },
];

export const demoFeatureMatrix = [
  { layer: "Patient records", modules: "Profile, medications, appointments, doctors, labs, vitals, symptoms, vaccines, documents", value: "Broad structured health data coverage" },
  { layer: "Care workflows", modules: "Notifications, care plan, visit prep, reminders, alerts, review queue", value: "Turns stored records into clear next actions" },
  { layer: "Clinical review", modules: "Trends, medication safety, lab review, vitals monitor, symptom review", value: "Adds interpretation surfaces without requiring a new schema" },
  { layer: "Reports", modules: "Summary packet, emergency card, exports, print views", value: "Supports doctor visits and portable handoffs" },
  { layer: "Platform", modules: "Device sync APIs, jobs, ops, admin, audit, security", value: "Shows production-minded backend and operations work" },
];


export const demoNotifications = {
  metrics: [
    { label: "Critical items", value: "2", note: "Open alerts and severe symptoms first" },
    { label: "Due today", value: "6", note: "Medications, reminders, and appointment prep" },
    { label: "Care invites", value: "2", note: "Pending caregiver and specialist access" },
    { label: "Device issues", value: "1", note: "Apple Health import needs token refresh" },
  ],
  inbox: [
    { source: "Alert", priority: "Critical", title: "Foot tingling cluster needs review", detail: "Recurring neuropathy-like symptom flagged for endocrinology visit." },
    { source: "Reminder", priority: "High", title: "Losartan refill review due", detail: "Medication reminder is due tomorrow and should be confirmed." },
    { source: "Lab", priority: "Medium", title: "LDL still in watch range", detail: "Latest LDL result is stable but should be included in the doctor packet." },
    { source: "Device", priority: "Medium", title: "Apple Health sync failed", detail: "Token refresh needed before the next device import." },
  ],
};

export const demoCarePlanHub = {
  readiness: 82,
  actions: [
    { title: "Discuss neuropathy watch signal", priority: "High", owner: "Dr. Santos", detail: "Foot tingling appeared twice this month and is linked to an open alert." },
    { title: "Confirm Losartan refill", priority: "Medium", owner: "Patient + caregiver", detail: "Refill reminder is queued for tomorrow morning." },
    { title: "Schedule pneumococcal vaccine", priority: "Medium", owner: "Primary care", detail: "Preventive care gap is due by July 2026." },
  ],
  timeline: [
    { title: "Quarterly endocrinology review", body: "May 4, 2026 at St. Luke's BGC", status: "Upcoming" },
    { title: "Eye screening", body: "May 11, 2026 at VisionPlus Clinic", status: "Scheduled" },
    { title: "Medication refill review", body: "Losartan review reminder is due tomorrow", status: "Due" },
  ],
};

export const demoTrendsHub = {
  metrics: [
    { label: "Trend coverage", value: "88%", note: "Vitals, labs, symptoms, and medication logs are represented" },
    { label: "Risk score", value: "24", note: "Mild risk from abnormal labs and unresolved symptoms" },
    { label: "30-day vitals", value: "18", note: "Recent readings available for review" },
    { label: "90-day labs", value: "7", note: "Three flagged for provider context" },
  ],
  trends: [
    { metric: "HbA1c", latest: "6.8%", previous: "7.4%", direction: "Improving", note: "Glycemic trend is moving toward target." },
    { metric: "Blood Pressure", latest: "122/78", previous: "128/82", direction: "Stable", note: "Controlled over recent readings." },
    { metric: "Weight", latest: "67.0 kg", previous: "68.4 kg", direction: "Improving", note: "Gradual reduction since February." },
  ],
};

export const demoMedicationSafetyHub = {
  readiness: 79,
  doseBoard: [
    { medication: "Metformin", time: "08:00 / 20:00", status: "Due today", adherence: "94%" },
    { medication: "Losartan", time: "07:00", status: "Sent", adherence: "98%" },
    { medication: "Atorvastatin", time: "21:00", status: "Watch", adherence: "89%" },
  ],
  actions: [
    { title: "Atorvastatin adherence drift", detail: "Two skipped doses were detected this week.", priority: "Watch" },
    { title: "Losartan refill review", detail: "Refill reminder is due tomorrow.", priority: "Due" },
    { title: "Medication list is provider-linked", detail: "All active medications are linked to a doctor.", priority: "Healthy" },
  ],
};

export const demoVisitPrepHub = {
  readiness: 86,
  nextVisit: "Quarterly endocrinology review · May 4, 2026 · Dr. Angela Santos",
  checklist: [
    { item: "Recent labs attached", status: "Ready" },
    { item: "Medication list current", status: "Ready" },
    { item: "Symptom notes complete", status: "Attention" },
    { item: "Doctor packet available", status: "Ready" },
  ],
  tasks: [
    { title: "Ask about foot tingling", detail: "Recurring symptom signal should be reviewed for neuropathy screening.", priority: "High" },
    { title: "Bring A1C and LDL context", detail: "Latest lab document and summary are linked.", priority: "Medium" },
    { title: "Confirm vaccine schedule", detail: "Pneumococcal vaccine is due soon.", priority: "Medium" },
  ],
};

export const demoLabReviewHub = {
  readiness: 84,
  breakdown: [
    { flag: "Normal", count: "4", note: "Creatinine, CBC, electrolytes, liver panel" },
    { flag: "Borderline", count: "2", note: "LDL and fasting glucose" },
    { flag: "High", count: "1", note: "A1C remains above ideal target" },
  ],
  trendCards: [
    { test: "HbA1c", latest: "6.8%", previous: "7.4%", status: "Improving" },
    { test: "LDL Cholesterol", latest: "92 mg/dL", previous: "95 mg/dL", status: "Watch" },
    { test: "Creatinine", latest: "0.88 mg/dL", previous: "0.91 mg/dL", status: "Normal" },
  ],
};

export const demoVitalsMonitorHub = {
  readiness: 81,
  metrics: [
    { metric: "Blood Pressure", latest: "122/78", previous: "128/82", delta: "-6/-4", status: "Controlled" },
    { metric: "Fasting Glucose", latest: "109 mg/dL", previous: "118 mg/dL", delta: "-9", status: "Watch" },
    { metric: "Oxygen Saturation", latest: "98%", previous: "97%", delta: "+1", status: "Healthy" },
    { metric: "Weight", latest: "67.0 kg", previous: "68.4 kg", delta: "-1.4", status: "Improving" },
  ],
  deviceSignals: [
    { provider: "Smart BP Monitor", status: "Active", lastSync: "Today · 6:30 AM" },
    { provider: "Smart Scale", status: "Active", lastSync: "Yesterday · 7:10 AM" },
  ],
};

export const demoSymptomReviewHub = {
  readiness: 76,
  severity: [
    { severity: "Mild", count: "2", status: "Mostly resolved" },
    { severity: "Moderate", count: "1", status: "Monitoring" },
    { severity: "Severe", count: "0", status: "Clear" },
  ],
  clusters: [
    { area: "Feet", count: "2", signal: "Neuropathy watch" },
    { area: "Head", count: "1", signal: "Resolved hydration-related headache" },
    { area: "Eyes", count: "1", signal: "Dryness noted for eye screening" },
  ],
};

export const demoDeviceSyncSimulatorHub = {
  providers: [
    { provider: "Apple Health", readings: "Weight, steps", status: "Available" },
    { provider: "Android Health Connect", readings: "Glucose, activity", status: "Available" },
    { provider: "Smart BP Monitor", readings: "Systolic/diastolic BP", status: "Available" },
    { provider: "Pulse Oximeter", readings: "SpO2 and heart rate", status: "Available" },
    { provider: "Smart Scale", readings: "Weight and BMI", status: "Available" },
  ],
  recentSyncs: [
    { job: "Smart BP Monitor", status: "Succeeded", result: "Created BP reading and mirrored vital" },
    { job: "Pulse Oximeter", status: "Succeeded", result: "Created SpO2 reading and mirrored vital" },
    { job: "Apple Health", status: "Retrying", result: "Token refresh needed" },
  ],
};

export const demoEmergencyCardHub = {
  profile: [
    { label: "Patient", value: "Elena Cruz · 34F" },
    { label: "Blood type", value: "O+" },
    { label: "Allergies", value: "Penicillin, Shellfish" },
    { label: "Emergency contact", value: "Marco Cruz · +63 917 555 0117" },
  ],
  critical: [
    "Type 2 Diabetes and Hypertension are active chronic conditions.",
    "Active medications: Metformin, Losartan, Atorvastatin.",
    "Latest BP is controlled at 122/78; latest fasting glucose is 109 mg/dL.",
  ],
};

export const demoAuditLogHub = [
  { source: "ACCESS", action: "Caregiver invite accepted", actor: "Marco Cruz", target: "Elena Cruz shared workspace", at: "Apr 23, 2026 · 5:15 PM" },
  { source: "ALERT", action: "Alert opened", actor: "Reminder engine", target: "Foot tingling symptom cluster", at: "Apr 22, 2026 · 8:40 PM" },
  { source: "REMINDER", action: "Reminder sent", actor: "System", target: "Morning medication dose", at: "Apr 24, 2026 · 7:00 AM" },
  { source: "SESSION", action: "Mobile token revoked", actor: "Admin Support", target: "Dormant Demo User", at: "Apr 24, 2026 · 8:00 AM" },
];

export const demoApiDocsHub = {
  endpoints: [
    { method: "POST", path: "/api/mobile/auth/login", purpose: "Create bearer-token mobile session" },
    { method: "GET", path: "/api/mobile/auth/me", purpose: "Validate current mobile user" },
    { method: "POST", path: "/api/mobile/auth/logout", purpose: "Revoke mobile token" },
    { method: "GET", path: "/api/mobile/connections", purpose: "List connected providers" },
    { method: "POST", path: "/api/mobile/device-readings", purpose: "Ingest device reading payloads" },
  ],
  security: [
    "Bearer tokens are scoped to mobile sessions and can be revoked from the Security or Admin workspace.",
    "Device readings are normalized into VitaVault records after validation.",
    "The public demo shows API shape without exposing secrets or accepting writes.",
  ],
};
