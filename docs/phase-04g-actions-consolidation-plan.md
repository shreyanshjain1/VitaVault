# Phase 04G - Consolidated actions export fix

This patch replaces `app/actions.ts` with a consolidated version that includes all CRUD exports expected by the current pages:

- Doctors: updateDoctor, deleteDoctor
- Appointments: updateAppointment, deleteAppointment
- Labs: updateLabResult, deleteLabResult
- Documents: updateDocumentMetadata, deleteDocument
- Medications: updateMedication, deleteMedication
- Vitals: updateVital, deleteVital
- Symptoms: updateSymptom, toggleSymptomResolved, deleteSymptom
- Vaccinations: updateVaccination, deleteVaccination

This is meant to stop later patches from reintroducing missing-export regressions.
