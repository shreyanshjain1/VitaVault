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
  { href: "/demo/dashboard", label: "Dashboard" },
  { href: "/demo/health-profile", label: "Health Profile" },
  { href: "/demo/medications", label: "Medications" },
  { href: "/demo/appointments", label: "Appointments" },
  { href: "/demo/labs", label: "Labs" },
  { href: "/demo/vitals", label: "Vitals" },
  { href: "/demo/symptoms", label: "Symptoms" },
  { href: "/demo/vaccinations", label: "Vaccinations" },
  { href: "/demo/doctors", label: "Doctors" },
  { href: "/demo/documents", label: "Documents" },
  { href: "/demo/care-team", label: "Care Team" },
  { href: "/demo/ai-insights", label: "AI Insights" },
  { href: "/demo/alerts", label: "Alerts" },
  { href: "/demo/timeline", label: "Timeline" },
  { href: "/demo/reminders", label: "Reminders" },
  { href: "/demo/review-queue", label: "Review Queue" },
  { href: "/demo/summary", label: "Summary" },
  { href: "/demo/exports", label: "Exports" },
  { href: "/demo/device-connection", label: "Device Connections" },
  { href: "/demo/jobs", label: "Jobs" },
  { href: "/demo/ops", label: "Ops" },
  { href: "/demo/security", label: "Security" },
  { href: "/demo/admin", label: "Admin" },
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
  { title: "Quarterly endocrinology review", when: "May 4, 2026 · 9:00 AM", location: "St. Luke's BGC", status: "UPCOMING", doctor: "Dr. Santos", note: "Discuss A1C trend and weight management plan" },
  { title: "Eye screening", when: "May 11, 2026 · 2:00 PM", location: "VisionPlus Clinic", status: "UPCOMING", doctor: "Dr. Lim", note: "Annual diabetic retinopathy check" },
  { title: "Annual physical exam", when: "April 10, 2026 · 11:30 AM", location: "Healthway", status: "COMPLETED", doctor: "Dr. Reyes", note: "Updated lab orders and cardiovascular risk review" },
];

export const demoLabs = [
  { test: "HbA1c", value: "6.8%", trend: "Improved from 7.4%", status: "Good", collectedAt: "Apr 20, 2026", lab: "Hi-Precision Diagnostics" },
  { test: "LDL Cholesterol", value: "92 mg/dL", trend: "Stable", status: "Watch", collectedAt: "Apr 20, 2026", lab: "Hi-Precision Diagnostics" },
  { test: "Creatinine", value: "0.88 mg/dL", trend: "Normal", status: "Normal", collectedAt: "Apr 20, 2026", lab: "St. Luke's Lab" },
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
  { name: "Dr. Angela Santos", specialty: "Endocrinology", clinic: "St. Luke's BGC", phone: "+63 2 8789 7700", email: "asantos@stlukes.example.com" },
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
