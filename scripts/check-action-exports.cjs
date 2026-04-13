#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const actionsPath = path.join(process.cwd(), "app", "actions.ts");
if (!fs.existsSync(actionsPath)) {
  console.error("[actions:check] Missing app/actions.ts");
  process.exit(1);
}

const source = fs.readFileSync(actionsPath, "utf8");
const exportMatches = [...source.matchAll(/export\s+async\s+function\s+(\w+)/g)].map((m) => m[1]);
const exported = new Set(exportMatches);

const required = [
  "signupAction",
  "loginAction",
  "saveHealthProfile",
  "addDoctor",
  "updateDoctor",
  "deleteDoctor",
  "saveMedication",
  "updateMedication",
  "deleteMedication",
  "logMedicationStatus",
  "saveAppointment",
  "updateAppointment",
  "deleteAppointment",
  "saveLabResult",
  "updateLabResult",
  "deleteLabResult",
  "saveVital",
  "updateVital",
  "deleteVital",
  "saveSymptom",
  "updateSymptom",
  "toggleSymptomResolved",
  "deleteSymptom",
  "saveVaccination",
  "updateVaccination",
  "deleteVaccination",
  "uploadDocument",
  "updateDocumentMetadata",
  "deleteDocument"
];

const missing = required.filter((name) => !exported.has(name));
if (missing.length) {
  console.error("[actions:check] Missing required exports from app/actions.ts:");
  for (const name of missing) console.error(` - ${name}`);
  process.exit(1);
}

console.log(`[actions:check] OK. Verified ${required.length} required action exports.`);
