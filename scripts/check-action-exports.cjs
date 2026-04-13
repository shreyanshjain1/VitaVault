#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const actionsPath = path.join(process.cwd(), 'app', 'actions.ts');
if (!fs.existsSync(actionsPath)) {
  console.error('✖ app/actions.ts not found.');
  process.exit(1);
}

const source = fs.readFileSync(actionsPath, 'utf8');

const requiredExports = [
  'addDoctor',
  'updateDoctor',
  'deleteDoctor',
  'saveMedication',
  'updateMedication',
  'deleteMedication',
  'logMedicationStatus',
  'saveAppointment',
  'updateAppointment',
  'deleteAppointment',
  'saveLabResult',
  'updateLabResult',
  'deleteLabResult',
  'saveVital',
  'updateVital',
  'deleteVital',
  'saveSymptom',
  'updateSymptom',
  'toggleSymptomResolved',
  'deleteSymptom',
  'saveVaccination',
  'updateVaccination',
  'deleteVaccination',
  'uploadDocument',
  'updateDocumentMetadata',
  'deleteDocument',
  'saveHealthProfile',
  'signupAction',
  'loginAction',
];

const missing = requiredExports.filter((name) => {
  const pattern = new RegExp(`export\\s+async\\s+function\\s+${name}\\s*\\(`);
  return !pattern.test(source);
});

const duplicateNames = [];
for (const name of requiredExports) {
  const pattern = new RegExp(`export\\s+async\\s+function\\s+${name}\\s*\\(`, 'g');
  const matches = source.match(pattern) || [];
  if (matches.length > 1) duplicateNames.push(name);
}

if (missing.length || duplicateNames.length) {
  console.error('✖ app/actions.ts failed the action export contract.');
  if (missing.length) {
    console.error('\nMissing exports:');
    for (const name of missing) console.error(`- ${name}`);
  }
  if (duplicateNames.length) {
    console.error('\nDuplicate exports:');
    for (const name of duplicateNames) console.error(`- ${name}`);
  }
  console.error('\nFix app/actions.ts before pushing or deploying.');
  process.exit(1);
}

console.log('✔ app/actions.ts satisfies the action export contract.');
