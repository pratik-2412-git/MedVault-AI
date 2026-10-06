/**
 * MedVault-AI Seed Script
 * Run from project root:
 *   cd D:\Users\Partha Sen\Desktop\MedVault-AI
 *   set DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/medvault
 *   npx tsx scripts/seed.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  facilitiesTable,
  patientsTable,
  doctorsTable,
  clinicalRecordsTable,
  documentsTable,
  auditLogsTable,
} from "../lib/db/src/schema/medvault";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set before running the seed script.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ─── TRUNCATE ALL TABLES ──────────────────────────────────────────────────────
async function truncateAll() {
  await pool.query(`
    TRUNCATE TABLE
      audit_logs, consents, ai_summary_claims, ai_summaries,
      documents, clinical_records, patients, doctors, facilities
    RESTART IDENTITY CASCADE;
  `);
  console.log("✓ Truncated all tables");
}

// ─── FACILITIES ───────────────────────────────────────────────────────────────
async function seedFacilities() {
  const rows = await db
    .insert(facilitiesTable)
    .values([
      { name: "Kolkata Care Hospital",         type: "Hospital",        location: "Kolkata, West Bengal" },
      { name: "Apollo Gleneagles Hospital",    type: "Hospital",        location: "Kolkata, West Bengal" },
      { name: "AIIMS New Delhi",               type: "Government Hospital", location: "New Delhi" },
      { name: "Fortis Hospital Bangalore",     type: "Hospital",        location: "Bangalore, Karnataka" },
      { name: "Manipal Hospital Chennai",      type: "Hospital",        location: "Chennai, Tamil Nadu" },
      { name: "Lilavati Hospital Mumbai",      type: "Hospital",        location: "Mumbai, Maharashtra" },
      { name: "Medanta The Medicity",          type: "Hospital",        location: "Gurugram, Haryana" },
      { name: "Ruby General Hospital",         type: "Hospital",        location: "Kolkata, West Bengal" },
      { name: "Narayana Health City",          type: "Hospital",        location: "Bangalore, Karnataka" },
      { name: "Tata Medical Center",           type: "Cancer Center",   location: "Kolkata, West Bengal" },
    ])
    .returning();
  console.log(`✓ Seeded ${rows.length} facilities`);
  return rows;
}

// ─── DOCTORS ──────────────────────────────────────────────────────────────────
async function seedDoctors(facilities: { id: number }[]) {
  const rows = await db
    .insert(doctorsTable)
    .values([
      { registrationNumber: "DOC-REG-0001", name: "Dr. Arjun Mehta",       specialization: "Endocrinology",       facilityId: facilities[0].id, email: "arjun.mehta@kolkatacare.in",       role: "Doctor",          verified: true },
      { registrationNumber: "DOC-REG-0002", name: "Dr. Priya Nair",        specialization: "Cardiology",          facilityId: facilities[1].id, email: "priya.nair@apollogleneagles.in",  role: "Doctor",          verified: true },
      { registrationNumber: "DOC-REG-0003", name: "Dr. Suresh Iyer",       specialization: "General Surgery",     facilityId: facilities[2].id, email: "suresh.iyer@aiims.edu",           role: "Doctor",          verified: true },
      { registrationNumber: "DOC-REG-0004", name: "Dr. Kavitha Reddy",     specialization: "Neurology",           facilityId: facilities[3].id, email: "kavitha.reddy@fortis.in",         role: "Doctor",          verified: true },
      { registrationNumber: "DOC-REG-0005", name: "Dr. Ramesh Babu",       specialization: "Orthopedics",         facilityId: facilities[4].id, email: "ramesh.babu@manipal.in",          role: "Doctor",          verified: true },
      { registrationNumber: "DOC-REG-0006", name: "Dr. Anita Sharma",      specialization: "Pulmonology",         facilityId: facilities[5].id, email: "anita.sharma@lilavati.in",        role: "Senior Doctor",   verified: true },
      { registrationNumber: "DOC-REG-0007", name: "Dr. Vikram Singh",      specialization: "Gastroenterology",    facilityId: facilities[6].id, email: "vikram.singh@medanta.in",         role: "Doctor",          verified: true },
      { registrationNumber: "DOC-REG-0008", name: "Dr. Sunita Das",        specialization: "Dermatology",         facilityId: facilities[7].id, email: "sunita.das@rubygeneral.in",       role: "Doctor",          verified: true },
      { registrationNumber: "DOC-REG-0009", name: "Dr. Mohan Krishna",     specialization: "Nephrology",          facilityId: facilities[8].id, email: "mohan.krishna@narayanahealth.in", role: "Doctor",          verified: true },
      { registrationNumber: "DOC-REG-0010", name: "Dr. Deepa Menon",       specialization: "Oncology",            facilityId: facilities[9].id, email: "deepa.menon@tatamедical.in",      role: "Senior Doctor",   verified: true },
      { registrationNumber: "DOC-REG-0011", name: "Dr. Rajiv Bose",        specialization: "Psychiatry",          facilityId: facilities[0].id, email: "rajiv.bose@kolkatacare.in",        role: "Doctor",          verified: true },
      { registrationNumber: "DOC-REG-0012", name: "Dr. Lalitha Krishnan",  specialization: "Obstetrics & Gynaecology", facilityId: facilities[1].id, email: "lalitha.krishnan@apollogleneagles.in", role: "Doctor", verified: true },
    ])
    .returning();
  console.log(`✓ Seeded ${rows.length} doctors`);
  return rows;
}

// ─── PATIENTS ─────────────────────────────────────────────────────────────────
async function seedPatients(facilities: { id: number }[]) {
  const rows = await db
    .insert(patientsTable)
    .values([
      // PAT-0001 — Ananya Sen (exact spec)
      {
        patientId: "PAT-0001", name: "Ananya Sen",        age: 42, gender: "Female",
        healthId: "HLT-IND-2048-00127",
        allergy: "Penicillin",
        conditions: ["Type 2 Diabetes", "Hypertension"],
        medicines: ["Metformin 500 mg", "Amlodipine 5 mg"],
        facilityId: facilities[0].id, avatarInitials: "AS",
      },
      // PAT-0002
      {
        patientId: "PAT-0002", name: "Rohan Chatterjee",  age: 35, gender: "Male",
        healthId: "HLT-IND-2048-00214",
        allergy: "Sulfa drugs",
        conditions: ["Asthma", "Allergic Rhinitis"],
        medicines: ["Salbutamol Inhaler", "Montelukast 10 mg"],
        facilityId: facilities[1].id, avatarInitials: "RC",
      },
      // PAT-0003
      {
        patientId: "PAT-0003", name: "Meera Pillai",      age: 58, gender: "Female",
        healthId: "HLT-IND-2048-00389",
        allergy: "NSAIDs",
        conditions: ["Rheumatoid Arthritis", "Osteoporosis"],
        medicines: ["Methotrexate 15 mg", "Calcium + Vit D3"],
        facilityId: facilities[2].id, avatarInitials: "MP",
      },
      // PAT-0004
      {
        patientId: "PAT-0004", name: "Aditya Kumar",      age: 29, gender: "Male",
        healthId: "HLT-IND-2048-00451",
        allergy: "None known",
        conditions: ["Epilepsy"],
        medicines: ["Levetiracetam 500 mg"],
        facilityId: facilities[3].id, avatarInitials: "AK",
      },
      // PAT-0005
      {
        patientId: "PAT-0005", name: "Fatima Shaikh",     age: 47, gender: "Female",
        healthId: "HLT-IND-2048-00523",
        allergy: "Latex",
        conditions: ["Chronic Kidney Disease Stage 3", "Hypertension"],
        medicines: ["Amlodipine 10 mg", "Erythropoietin injections"],
        facilityId: facilities[4].id, avatarInitials: "FS",
      },
      // PAT-0006
      {
        patientId: "PAT-0006", name: "Suresh Nambiar",    age: 63, gender: "Male",
        healthId: "HLT-IND-2048-00612",
        allergy: "Aspirin",
        conditions: ["Coronary Artery Disease", "Type 2 Diabetes"],
        medicines: ["Atorvastatin 40 mg", "Clopidogrel 75 mg", "Metformin 1000 mg"],
        facilityId: facilities[5].id, avatarInitials: "SN",
      },
      // PAT-0007
      {
        patientId: "PAT-0007", name: "Priya Venkatesh",   age: 33, gender: "Female",
        healthId: "HLT-IND-2048-00734",
        allergy: "Codeine",
        conditions: ["Migraine", "Hypothyroidism"],
        medicines: ["Levothyroxine 50 mcg", "Sumatriptan 50 mg"],
        facilityId: facilities[6].id, avatarInitials: "PV",
      },
      // PAT-0008
      {
        patientId: "PAT-0008", name: "Bikash Mondal",     age: 52, gender: "Male",
        healthId: "HLT-IND-2048-00818",
        allergy: "None known",
        conditions: ["Chronic Obstructive Pulmonary Disease", "Hypertension"],
        medicines: ["Tiotropium Inhaler", "Losartan 50 mg"],
        facilityId: facilities[7].id, avatarInitials: "BM",
      },
      // PAT-0009
      {
        patientId: "PAT-0009", name: "Lakshmi Devi",      age: 70, gender: "Female",
        healthId: "HLT-IND-2048-00945",
        allergy: "Penicillin",
        conditions: ["Atrial Fibrillation", "Heart Failure", "Type 2 Diabetes"],
        medicines: ["Warfarin 5 mg", "Furosemide 40 mg", "Digoxin 0.125 mg"],
        facilityId: facilities[8].id, avatarInitials: "LD",
      },
      // PAT-0010
      {
        patientId: "PAT-0010", name: "Arnav Ghosh",       age: 24, gender: "Male",
        healthId: "HLT-IND-2048-01023",
        allergy: "None known",
        conditions: ["Type 1 Diabetes"],
        medicines: ["Insulin Glargine 20 units", "Insulin Aspart as needed"],
        facilityId: facilities[9].id, avatarInitials: "AG",
      },
      // PAT-0011
      {
        patientId: "PAT-0011", name: "Deepika Rao",       age: 44, gender: "Female",
        healthId: "HLT-IND-2048-01156",
        allergy: "Ibuprofen",
        conditions: ["Fibromyalgia", "Depression"],
        medicines: ["Duloxetine 60 mg", "Pregabalin 75 mg"],
        facilityId: facilities[0].id, avatarInitials: "DR",
      },
      // PAT-0012
      {
        patientId: "PAT-0012", name: "Mohammed Iqbal",    age: 55, gender: "Male",
        healthId: "HLT-IND-2048-01289",
        allergy: "Contrast dye",
        conditions: ["Liver Cirrhosis", "Portal Hypertension"],
        medicines: ["Propranolol 40 mg", "Lactulose 30 ml"],
        facilityId: facilities[1].id, avatarInitials: "MI",
      },
      // PAT-0013
      {
        patientId: "PAT-0013", name: "Savita Kulkarni",   age: 38, gender: "Female",
        healthId: "HLT-IND-2048-01374",
        allergy: "None known",
        conditions: ["Polycystic Ovary Syndrome", "Insulin Resistance"],
        medicines: ["Metformin 500 mg", "Oral Contraceptive Pill"],
        facilityId: facilities[2].id, avatarInitials: "SK",
      },
      // PAT-0014
      {
        patientId: "PAT-0014", name: "Harish Patel",      age: 61, gender: "Male",
        healthId: "HLT-IND-2048-01498",
        allergy: "Morphine",
        conditions: ["Benign Prostatic Hyperplasia", "Hypertension"],
        medicines: ["Tamsulosin 0.4 mg", "Amlodipine 5 mg"],
        facilityId: facilities[3].id, avatarInitials: "HP",
      },
      // PAT-0015
      {
        patientId: "PAT-0015", name: "Anjali Mishra",     age: 27, gender: "Female",
        healthId: "HLT-IND-2048-01563",
        allergy: "None known",
        conditions: ["Iron Deficiency Anaemia"],
        medicines: ["Ferrous Sulfate 200 mg", "Folic Acid 5 mg"],
        facilityId: facilities[4].id, avatarInitials: "AM",
      },
      // PAT-0016
      {
        patientId: "PAT-0016", name: "Debashish Roy",     age: 49, gender: "Male",
        healthId: "HLT-IND-2048-01647",
        allergy: "Tetracycline",
        conditions: ["Peptic Ulcer Disease", "GERD"],
        medicines: ["Pantoprazole 40 mg", "Amoxicillin 1000 mg", "Clarithromycin 500 mg"],
        facilityId: facilities[5].id, avatarInitials: "DR",
      },
      // PAT-0017
      {
        patientId: "PAT-0017", name: "Nalini Subramanian",age: 66, gender: "Female",
        healthId: "HLT-IND-2048-01729",
        allergy: "Penicillin",
        conditions: ["Alzheimer's Disease (Early Stage)", "Hypertension"],
        medicines: ["Donepezil 10 mg", "Ramipril 5 mg"],
        facilityId: facilities[6].id, avatarInitials: "NS",
      },
      // PAT-0018
      {
        patientId: "PAT-0018", name: "Tarun Biswas",      age: 31, gender: "Male",
        healthId: "HLT-IND-2048-01834",
        allergy: "None known",
        conditions: ["Ankylosing Spondylitis"],
        medicines: ["Naproxen 500 mg", "Adalimumab 40 mg fortnightly"],
        facilityId: facilities[7].id, avatarInitials: "TB",
      },
      // PAT-0019
      {
        patientId: "PAT-0019", name: "Sunanda Bose",      age: 53, gender: "Female",
        healthId: "HLT-IND-2048-01912",
        allergy: "Erythromycin",
        conditions: ["Breast Cancer (Stage II, in remission)", "Hypothyroidism"],
        medicines: ["Tamoxifen 20 mg", "Levothyroxine 75 mcg"],
        facilityId: facilities[8].id, avatarInitials: "SB",
      },
      // PAT-0020
      {
        patientId: "PAT-0020", name: "Kiran Joshi",       age: 40, gender: "Male",
        healthId: "HLT-IND-2048-02045",
        allergy: "None known",
        conditions: ["Hypertension", "Dyslipidaemia"],
        medicines: ["Telmisartan 40 mg", "Rosuvastatin 10 mg"],
        facilityId: facilities[9].id, avatarInitials: "KJ",
      },
      // PAT-0021
      {
        patientId: "PAT-0021", name: "Geeta Sinha",       age: 59, gender: "Female",
        healthId: "HLT-IND-2048-02178",
        allergy: "Sulfa drugs",
        conditions: ["Type 2 Diabetes", "Diabetic Neuropathy"],
        medicines: ["Insulin Glargine 30 units", "Pregabalin 150 mg"],
        facilityId: facilities[0].id, avatarInitials: "GS",
      },
      // PAT-0022
      {
        patientId: "PAT-0022", name: "Partha Sarathi Das", age: 45, gender: "Male",
        healthId: "HLT-IND-2048-02263",
        allergy: "Ampicillin",
        conditions: ["Psoriasis", "Psoriatic Arthritis"],
        medicines: ["Methotrexate 10 mg", "Betamethasone cream"],
        facilityId: facilities[1].id, avatarInitials: "PD",
      },
      // PAT-0023
      {
        patientId: "PAT-0023", name: "Revathi Iyer",      age: 36, gender: "Female",
        healthId: "HLT-IND-2048-02341",
        allergy: "None known",
        conditions: ["Systemic Lupus Erythematosus"],
        medicines: ["Hydroxychloroquine 200 mg", "Prednisolone 10 mg"],
        facilityId: facilities[2].id, avatarInitials: "RI",
      },
      // PAT-0024
      {
        patientId: "PAT-0024", name: "Santosh Reddy",     age: 72, gender: "Male",
        healthId: "HLT-IND-2048-02489",
        allergy: "Penicillin",
        conditions: ["Parkinson's Disease", "Depression"],
        medicines: ["Levodopa/Carbidopa 250/25 mg", "Sertraline 50 mg"],
        facilityId: facilities[3].id, avatarInitials: "SR",
      },
      // PAT-0025
      {
        patientId: "PAT-0025", name: "Nisha Agarwal",     age: 22, gender: "Female",
        healthId: "HLT-IND-2048-02567",
        allergy: "None known",
        conditions: ["Anxiety Disorder", "Insomnia"],
        medicines: ["Escitalopram 10 mg", "Melatonin 3 mg"],
        facilityId: facilities[4].id, avatarInitials: "NA",
      },
    ])
    .returning();
  console.log(`✓ Seeded ${rows.length} patients`);
  return rows;
}

// ─── CLINICAL RECORDS ─────────────────────────────────────────────────────────
async function seedClinicalRecords(
  patients: { id: number; patientId: string }[],
  facilities: { id: number }[],
) {
  const byPid = Object.fromEntries(patients.map((p) => [p.patientId, p]));
  const f = facilities; // shorthand

  const records = [
    // ── PAT-0001 Ananya Sen ──────────────────────────────────────────────────
    { patientId: byPid["PAT-0001"].id, title: "Appendectomy",                      category: "Surgery",      recordDate: "2019-06-15", facilityId: f[0].id, detail: "Laparoscopic appendectomy performed under general anaesthesia. No complications. Discharged after 48 hours.", status: "Verified", sourceDocument: "OT-Notes-2019-06-15", createdBy: "system" },
    { patientId: byPid["PAT-0001"].id, title: "Hypertension Diagnosed",            category: "Diagnosis",    recordDate: "2023-03-10", facilityId: f[0].id, detail: "BP recorded at 158/96 mmHg on three separate readings. Diagnosed with Stage 2 Hypertension. Started on Amlodipine 5 mg.", status: "Verified", sourceDocument: "OPD-2023-03-10", createdBy: "system" },
    { patientId: byPid["PAT-0001"].id, title: "Type 2 Diabetes Diagnosed",         category: "Diagnosis",    recordDate: "2024-01-22", facilityId: f[0].id, detail: "Fasting blood glucose 186 mg/dL, HbA1c 8.9%. Diagnosed with Type 2 Diabetes Mellitus. Initiated Metformin 500 mg twice daily.", status: "Verified", sourceDocument: "OPD-2024-01-22", createdBy: "system" },
    { patientId: byPid["PAT-0001"].id, title: "HbA1c Result — 8.2%",              category: "Laboratory",   recordDate: "2025-08-10", facilityId: f[0].id, detail: "HbA1c: 8.2% (target < 7.0%). Fasting glucose: 162 mg/dL. Lipid profile within normal limits. Renal function normal.", status: "Verified", sourceDocument: "LAB-2025-08-10", createdBy: "system" },
    { patientId: byPid["PAT-0001"].id, title: "Prescription — Metformin & Amlodipine", category: "Prescription", recordDate: "2025-08-12", facilityId: f[0].id, detail: "Metformin 500 mg twice daily with meals. Amlodipine 5 mg once daily in the morning. Review in 3 months.", status: "Verified", sourceDocument: "RX-2025-08-12", createdBy: "system" },
    { patientId: byPid["PAT-0001"].id, title: "Annual Eye Examination",            category: "Consultation", recordDate: "2025-01-18", facilityId: f[0].id, detail: "Diabetic retinopathy screening: no retinopathy detected. Visual acuity 6/6 bilateral. Next screening in 12 months.", status: "Verified", sourceDocument: "OPHTHAL-2025-01-18", createdBy: "system" },
    { patientId: byPid["PAT-0001"].id, title: "Penicillin Allergy Documented",     category: "Allergy",      recordDate: "2018-04-05", facilityId: f[0].id, detail: "Patient developed urticaria and mild angioedema following Amoxicillin 500 mg. Penicillin allergy confirmed. Allergy band applied.", status: "Verified", sourceDocument: "ALLERGY-2018-04-05", createdBy: "system" },

    // ── PAT-0002 Rohan Chatterjee ─────────────────────────────────────────────
    { patientId: byPid["PAT-0002"].id, title: "Asthma Diagnosis",                  category: "Diagnosis",    recordDate: "2018-09-12", facilityId: f[1].id, detail: "Spirometry: FEV1/FVC 68%. Diagnosed with mild persistent asthma. Salbutamol inhaler prescribed for acute episodes.", status: "Verified", sourceDocument: "PULM-2018-09-12", createdBy: "system" },
    { patientId: byPid["PAT-0002"].id, title: "Allergic Rhinitis Diagnosis",       category: "Diagnosis",    recordDate: "2019-03-20", facilityId: f[1].id, detail: "Skin prick test positive for dust mites and pollen. Diagnosed with allergic rhinitis. Montelukast 10 mg added.", status: "Verified", sourceDocument: "ALLERGY-2019-03-20", createdBy: "system" },
    { patientId: byPid["PAT-0002"].id, title: "Sulfa Drug Allergy Documented",     category: "Allergy",      recordDate: "2020-07-08", facilityId: f[1].id, detail: "Developed maculopapular rash after Trimethoprim-Sulfamethoxazole. Sulfa drug allergy documented in records.", status: "Verified", sourceDocument: "ALLERGY-2020-07-08", createdBy: "system" },
    { patientId: byPid["PAT-0002"].id, title: "Pulmonary Function Test",           category: "Laboratory",   recordDate: "2023-11-15", facilityId: f[1].id, detail: "FEV1: 82% predicted, FVC: 91% predicted, FEV1/FVC: 72%. Mild obstructive pattern. Continue current inhalers.", status: "Verified", sourceDocument: "PFT-2023-11-15", createdBy: "system" },
    { patientId: byPid["PAT-0002"].id, title: "Asthma Review — Well Controlled",  category: "Consultation", recordDate: "2024-06-10", facilityId: f[1].id, detail: "ACQ score 0.8 — well controlled. No nocturnal symptoms. Salbutamol use < 2 times/week. Continue current regimen.", status: "Verified", sourceDocument: "OPD-2024-06-10", createdBy: "system" },
    { patientId: byPid["PAT-0002"].id, title: "COVID-19 Vaccination — Dose 1",    category: "Vaccination",  recordDate: "2021-05-18", facilityId: f[1].id, detail: "Covishield (ChAdOx1-S) Dose 1 administered. Batch: 4121Z008. No adverse reaction observed. Second dose scheduled.", status: "Verified", sourceDocument: "VAX-2021-05-18", createdBy: "system" },
    { patientId: byPid["PAT-0002"].id, title: "COVID-19 Vaccination — Dose 2",    category: "Vaccination",  recordDate: "2021-08-10", facilityId: f[1].id, detail: "Covishield Dose 2 administered. Batch: 4121Z199. Mild fever and arm soreness reported — resolved within 24 hours.", status: "Verified", sourceDocument: "VAX-2021-08-10", createdBy: "system" },
    { patientId: byPid["PAT-0002"].id, title: "CBC and IgE Panel",                category: "Laboratory",   recordDate: "2025-02-20", facilityId: f[1].id, detail: "Total IgE: 480 IU/mL (elevated). Eosinophils: 6%. CBC otherwise normal. Consistent with atopic disease.", status: "Verified", sourceDocument: "LAB-2025-02-20", createdBy: "system" },

    // ── PAT-0003 Meera Pillai ─────────────────────────────────────────────────
    { patientId: byPid["PAT-0003"].id, title: "Rheumatoid Arthritis Diagnosed",    category: "Diagnosis",    recordDate: "2015-04-22", facilityId: f[2].id, detail: "RF positive (148 IU/mL), anti-CCP positive. Bilateral small joint swelling. Diagnosed with seropositive RA. Methotrexate initiated.", status: "Verified", sourceDocument: "RHEUM-2015-04-22", createdBy: "system" },
    { patientId: byPid["PAT-0003"].id, title: "Osteoporosis DEXA Scan",           category: "Laboratory",   recordDate: "2020-08-15", facilityId: f[2].id, detail: "DEXA: Lumbar spine T-score -2.7, femoral neck T-score -2.4. Diagnosed with osteoporosis. Calcium + Vit D3 and weight-bearing exercises advised.", status: "Verified", sourceDocument: "DEXA-2020-08-15", createdBy: "system" },
    { patientId: byPid["PAT-0003"].id, title: "NSAID Allergy — Bronchospasm",      category: "Allergy",      recordDate: "2017-02-10", facilityId: f[2].id, detail: "Acute bronchospasm following Ibuprofen 400 mg. NSAID hypersensitivity documented. Paracetamol safe alternative confirmed.", status: "Verified", sourceDocument: "ER-2017-02-10", createdBy: "system" },
    { patientId: byPid["PAT-0003"].id, title: "Methotrexate LFT Monitoring",      category: "Laboratory",   recordDate: "2024-03-05", facilityId: f[2].id, detail: "ALT 38 U/L, AST 32 U/L, ALP 78 U/L. LFTs within acceptable range for Methotrexate therapy. Continue current dose.", status: "Verified", sourceDocument: "LAB-2024-03-05", createdBy: "system" },
    { patientId: byPid["PAT-0003"].id, title: "RA Disease Activity Assessment",   category: "Consultation", recordDate: "2025-01-12", facilityId: f[2].id, detail: "DAS28 score: 3.1 (low disease activity). Morning stiffness < 30 min. Tender joints: 2. Swollen joints: 1. Continue Methotrexate.", status: "Verified", sourceDocument: "OPD-2025-01-12", createdBy: "system" },
    { patientId: byPid["PAT-0003"].id, title: "Repeat DEXA Scan",                 category: "Laboratory",   recordDate: "2025-03-20", facilityId: f[2].id, detail: "Lumbar spine T-score -2.4 (improved from -2.7). Femoral neck T-score -2.2. Calcium + Vit D supplementation effective.", status: "Verified", sourceDocument: "DEXA-2025-03-20", createdBy: "system" },
    { patientId: byPid["PAT-0003"].id, title: "Influenza Vaccination 2024",       category: "Vaccination",  recordDate: "2024-10-08", facilityId: f[2].id, detail: "Inactivated Influenza Vaccine administered (quadrivalent). Recommended for immunocompromised patients on Methotrexate.", status: "Verified", sourceDocument: "VAX-2024-10-08", createdBy: "system" },

    // ── PAT-0004 Aditya Kumar ─────────────────────────────────────────────────
    { patientId: byPid["PAT-0004"].id, title: "Epilepsy Diagnosed — GTCS",        category: "Diagnosis",    recordDate: "2019-11-03", facilityId: f[3].id, detail: "Two unprovoked generalised tonic-clonic seizures. EEG: generalised spike-wave discharges. MRI Brain: normal. Diagnosed with idiopathic generalised epilepsy.", status: "Verified", sourceDocument: "NEURO-2019-11-03", createdBy: "system" },
    { patientId: byPid["PAT-0004"].id, title: "Levetiracetam Initiated",          category: "Prescription", recordDate: "2019-11-10", facilityId: f[3].id, detail: "Levetiracetam 500 mg twice daily started. Counselled on driving restrictions and seizure precautions. Follow-up in 1 month.", status: "Verified", sourceDocument: "RX-2019-11-10", createdBy: "system" },
    { patientId: byPid["PAT-0004"].id, title: "Seizure-Free — 12 Month Review",   category: "Consultation", recordDate: "2021-01-15", facilityId: f[3].id, detail: "No seizures in past 12 months. EEG normalised. Levetiracetam continued. Driving restriction lifted as per neurology protocol.", status: "Verified", sourceDocument: "OPD-2021-01-15", createdBy: "system" },
    { patientId: byPid["PAT-0004"].id, title: "Routine Blood Panel",              category: "Laboratory",   recordDate: "2023-07-22", facilityId: f[3].id, detail: "CBC, LFT, RFT all within normal limits. Levetiracetam level: 28 mcg/mL (therapeutic range 12–46). Continue current dose.", status: "Verified", sourceDocument: "LAB-2023-07-22", createdBy: "system" },
    { patientId: byPid["PAT-0004"].id, title: "Annual Neurology Review 2024",     category: "Consultation", recordDate: "2024-12-05", facilityId: f[3].id, detail: "Seizure-free for 5 years. Patient counselled on medication adherence. Considering gradual dose reduction in 2025 if EEG remains normal.", status: "Verified", sourceDocument: "OPD-2024-12-05", createdBy: "system" },
    { patientId: byPid["PAT-0004"].id, title: "Repeat EEG",                      category: "Laboratory",   recordDate: "2025-04-10", facilityId: f[3].id, detail: "EEG: no epileptiform activity. Background rhythm normal. Supports consideration of gradual medication withdrawal with close monitoring.", status: "Verified", sourceDocument: "EEG-2025-04-10", createdBy: "system" },
    { patientId: byPid["PAT-0004"].id, title: "COVID-19 Vaccination",             category: "Vaccination",  recordDate: "2022-01-20", facilityId: f[3].id, detail: "Covaxin (BBV152) administered. No drug interaction with Levetiracetam. Post-vaccination monitoring: no adverse events.", status: "Verified", sourceDocument: "VAX-2022-01-20", createdBy: "system" },

    // ── PAT-0005 Fatima Shaikh ────────────────────────────────────────────────
    { patientId: byPid["PAT-0005"].id, title: "CKD Stage 3 Diagnosed",            category: "Diagnosis",    recordDate: "2021-06-14", facilityId: f[4].id, detail: "eGFR 42 mL/min/1.73m². Serum creatinine 1.8 mg/dL. Urine ACR 85 mg/g. Diagnosed CKD Stage 3b. Nephrology referral made.", status: "Verified", sourceDocument: "NEPH-2021-06-14", createdBy: "system" },
    { patientId: byPid["PAT-0005"].id, title: "Latex Allergy Documented",         category: "Allergy",      recordDate: "2020-03-11", facilityId: f[4].id, detail: "Anaphylactic reaction during minor procedure. Latex identified as trigger. All future procedures must use latex-free equipment.", status: "Verified", sourceDocument: "ER-2020-03-11", createdBy: "system" },
    { patientId: byPid["PAT-0005"].id, title: "Renal Function Panel — Q3 2024",   category: "Laboratory",   recordDate: "2024-09-05", facilityId: f[4].id, detail: "eGFR 39 mL/min. Serum creatinine 1.95 mg/dL. Potassium 4.8 mEq/L. Haemoglobin 9.8 g/dL — erythropoietin dose adjusted.", status: "Verified", sourceDocument: "LAB-2024-09-05", createdBy: "system" },
    { patientId: byPid["PAT-0005"].id, title: "Erythropoietin Therapy Review",    category: "Consultation", recordDate: "2024-10-15", facilityId: f[4].id, detail: "Hb response to EPO adequate. Iron stores: ferritin 180 ng/mL. Blood pressure controlled at 134/84 mmHg. Continue Amlodipine 10 mg.", status: "Verified", sourceDocument: "OPD-2024-10-15", createdBy: "system" },
    { patientId: byPid["PAT-0005"].id, title: "Renal Ultrasound",                 category: "Radiology",    recordDate: "2023-04-22", facilityId: f[4].id, detail: "Right kidney 9.2 cm, left kidney 9.0 cm. Cortical thinning bilaterally. No hydronephrosis. No renal calculi. Consistent with CKD.", status: "Verified", sourceDocument: "USG-2023-04-22", createdBy: "system" },
    { patientId: byPid["PAT-0005"].id, title: "Dietary Counselling for CKD",      category: "Consultation", recordDate: "2025-02-18", facilityId: f[4].id, detail: "Low potassium, low phosphate, protein-restricted diet advised. Fluid restriction 1.5 L/day. Salt restriction < 2 g/day. Dietitian referral given.", status: "Verified", sourceDocument: "DIET-2025-02-18", createdBy: "system" },
    { patientId: byPid["PAT-0005"].id, title: "Renal Function Panel — Q2 2025",   category: "Laboratory",   recordDate: "2025-06-10", facilityId: f[4].id, detail: "eGFR 37 mL/min — slight decline. Creatinine 2.1 mg/dL. Discussed possibility of dialysis planning if eGFR falls below 20. Patient informed.", status: "Verified", sourceDocument: "LAB-2025-06-10", createdBy: "system" },

    // ── PAT-0006 Suresh Nambiar ───────────────────────────────────────────────
    { patientId: byPid["PAT-0006"].id, title: "Coronary Angioplasty — LAD Stent", category: "Surgery",      recordDate: "2019-09-18", facilityId: f[5].id, detail: "PTCA with drug-eluting stent to proximal LAD (90% stenosis). Procedure successful. Dual antiplatelet therapy initiated.", status: "Verified", sourceDocument: "CATH-2019-09-18", createdBy: "system" },
    { patientId: byPid["PAT-0006"].id, title: "Aspirin Allergy — GI Bleed",       category: "Allergy",      recordDate: "2022-03-07", facilityId: f[5].id, detail: "Upper GI bleed triggered by Aspirin. OGD: gastric erosions. Aspirin stopped permanently. Switched to Clopidogrel monotherapy.", status: "Verified", sourceDocument: "ER-2022-03-07", createdBy: "system" },
    { patientId: byPid["PAT-0006"].id, title: "Cardiac Stress Test — Normal",     category: "Laboratory",   recordDate: "2023-05-20", facilityId: f[5].id, detail: "TMT: negative for inducible ischaemia at 10 METS. BP response normal. No arrhythmias. Stent patent. Annual review scheduled.", status: "Verified", sourceDocument: "TMT-2023-05-20", createdBy: "system" },
    { patientId: byPid["PAT-0006"].id, title: "HbA1c and Lipid Panel",            category: "Laboratory",   recordDate: "2024-08-14", facilityId: f[5].id, detail: "HbA1c: 7.4%. LDL: 62 mg/dL (target met on Atorvastatin 40 mg). HDL: 48 mg/dL. TG: 118 mg/dL. Good metabolic control.", status: "Verified", sourceDocument: "LAB-2024-08-14", createdBy: "system" },
    { patientId: byPid["PAT-0006"].id, title: "Cardiology Annual Review 2024",    category: "Consultation", recordDate: "2024-11-05", facilityId: f[5].id, detail: "NYHA Class I. No angina or dyspnoea. BP 128/78 mmHg. Continue Clopidogrel, Atorvastatin, Metformin. Echo: EF 58%.", status: "Verified", sourceDocument: "OPD-2024-11-05", createdBy: "system" },
    { patientId: byPid["PAT-0006"].id, title: "2D Echocardiogram",                category: "Radiology",    recordDate: "2025-03-12", facilityId: f[5].id, detail: "LV EF 60%. No regional wall motion abnormality. Mild diastolic dysfunction Grade 1. Valves: normal. Stent region: no wall motion abnormality.", status: "Verified", sourceDocument: "ECHO-2025-03-12", createdBy: "system" },
    { patientId: byPid["PAT-0006"].id, title: "Influenza Vaccination 2025",       category: "Vaccination",  recordDate: "2025-01-15", facilityId: f[5].id, detail: "Inactivated Influenza Vaccine administered. Recommended for cardiovascular patients. No adverse reaction.", status: "Verified", sourceDocument: "VAX-2025-01-15", createdBy: "system" },

    // ── PAT-0007 Priya Venkatesh ──────────────────────────────────────────────
    { patientId: byPid["PAT-0007"].id, title: "Hypothyroidism Diagnosed",         category: "Diagnosis",    recordDate: "2017-08-22", facilityId: f[6].id, detail: "TSH: 12.4 mIU/L. Free T4: 0.7 ng/dL. Diagnosed with primary hypothyroidism. Levothyroxine 50 mcg initiated.", status: "Verified", sourceDocument: "ENDO-2017-08-22", createdBy: "system" },
    { patientId: byPid["PAT-0007"].id, title: "Migraine with Aura Diagnosed",     category: "Diagnosis",    recordDate: "2020-02-14", facilityId: f[6].id, detail: "Classic migraine with visual aura. 4–6 attacks/month. MRI Brain: no structural abnormality. Sumatriptan 50 mg for acute episodes.", status: "Verified", sourceDocument: "NEURO-2020-02-14", createdBy: "system" },
    { patientId: byPid["PAT-0007"].id, title: "Codeine Allergy — Nausea/Vomiting", category: "Allergy",    recordDate: "2019-05-30", facilityId: f[6].id, detail: "Severe nausea, vomiting and pruritus after Codeine Phosphate 30 mg. Opioid sensitivity documented. Avoid all codeine-containing preparations.", status: "Verified", sourceDocument: "ALLERGY-2019-05-30", createdBy: "system" },
    { patientId: byPid["PAT-0007"].id, title: "Thyroid Function Test — 2024",     category: "Laboratory",   recordDate: "2024-04-18", facilityId: f[6].id, detail: "TSH: 2.1 mIU/L (well controlled). Free T4: 1.1 ng/dL. Continue Levothyroxine 50 mcg. Next TFT in 12 months.", status: "Verified", sourceDocument: "LAB-2024-04-18", createdBy: "system" },
    { patientId: byPid["PAT-0007"].id, title: "Migraine Frequency Review",        category: "Consultation", recordDate: "2024-09-10", facilityId: f[6].id, detail: "Migraine frequency reduced to 1–2 attacks/month with Sumatriptan. Trigger diary reviewed — stress and sleep deprivation identified.", status: "Verified", sourceDocument: "OPD-2024-09-10", createdBy: "system" },
    { patientId: byPid["PAT-0007"].id, title: "Thyroid Ultrasound",               category: "Radiology",    recordDate: "2023-11-05", facilityId: f[6].id, detail: "Thyroid gland mildly enlarged. Echotexture heterogeneous. No nodule > 1 cm. Features consistent with autoimmune thyroiditis (Hashimoto's).", status: "Verified", sourceDocument: "USG-2023-11-05", createdBy: "system" },
    { patientId: byPid["PAT-0007"].id, title: "Anti-TPO Antibody Test",           category: "Laboratory",   recordDate: "2023-11-05", facilityId: f[6].id, detail: "Anti-TPO antibodies: 420 IU/mL (elevated). Confirms Hashimoto's thyroiditis as underlying aetiology. Levothyroxine dose maintained.", status: "Verified", sourceDocument: "LAB-2023-11-05", createdBy: "system" },

    // ── PAT-0008 Bikash Mondal ────────────────────────────────────────────────
    { patientId: byPid["PAT-0008"].id, title: "COPD Diagnosed — GOLD Stage II",   category: "Diagnosis",    recordDate: "2018-03-14", facilityId: f[7].id, detail: "30 pack-year smoking history. FEV1 65% predicted. Post-bronchodilator FEV1/FVC 0.62. GOLD Stage II COPD. Smoking cessation counselled.", status: "Verified", sourceDocument: "PULM-2018-03-14", createdBy: "system" },
    { patientId: byPid["PAT-0008"].id, title: "Hypertension Diagnosed",           category: "Diagnosis",    recordDate: "2020-07-22", facilityId: f[7].id, detail: "BP consistently elevated (162/98 mmHg). No end-organ damage. Started Losartan 50 mg. ABPM confirmed diagnosis.", status: "Verified", sourceDocument: "OPD-2020-07-22", createdBy: "system" },
    { patientId: byPid["PAT-0008"].id, title: "COPD Exacerbation — Hospitalised", category: "Hospital Visit", recordDate: "2022-12-08", facilityId: f[7].id, detail: "Acute exacerbation requiring hospitalisation. SpO2 88% on room air. IV antibiotics (Moxifloxacin), systemic steroids, nebulisation. Discharged after 5 days.", status: "Verified", sourceDocument: "IP-2022-12-08", createdBy: "system" },
    { patientId: byPid["PAT-0008"].id, title: "Pulmonary Function Test 2024",     category: "Laboratory",   recordDate: "2024-02-19", facilityId: f[7].id, detail: "FEV1 58% predicted (declined from 65%). FVC 72%. FEV1/FVC 0.59. GOLD Stage III re-evaluation. Tiotropium continued.", status: "Verified", sourceDocument: "PFT-2024-02-19", createdBy: "system" },
    { patientId: byPid["PAT-0008"].id, title: "Chest X-Ray 2024",                 category: "Radiology",    recordDate: "2024-02-19", facilityId: f[7].id, detail: "Hyperinflated lungs. Flattened diaphragm. No consolidation. Increased bronchovascular markings. Consistent with COPD. No acute infection.", status: "Verified", sourceDocument: "CXR-2024-02-19", createdBy: "system" },
    { patientId: byPid["PAT-0008"].id, title: "Pneumococcal Vaccination",         category: "Vaccination",  recordDate: "2023-08-15", facilityId: f[7].id, detail: "Pneumococcal Conjugate Vaccine (PCV15) administered. Recommended for COPD patients to prevent pneumococcal pneumonia.", status: "Verified", sourceDocument: "VAX-2023-08-15", createdBy: "system" },
    { patientId: byPid["PAT-0008"].id, title: "BP Control Review",                category: "Consultation", recordDate: "2025-05-10", facilityId: f[7].id, detail: "BP 138/84 mmHg. Well controlled on Losartan 50 mg. Renal function and electrolytes normal. Continue current medications.", status: "Verified", sourceDocument: "OPD-2025-05-10", createdBy: "system" },

    // ── PAT-0009 Lakshmi Devi ─────────────────────────────────────────────────
    { patientId: byPid["PAT-0009"].id, title: "Atrial Fibrillation Diagnosed",    category: "Diagnosis",    recordDate: "2016-02-28", facilityId: f[8].id, detail: "Persistent AF on 12-lead ECG. CHA2DS2-VASc score 4. Rate control with Digoxin. Warfarin anticoagulation initiated. Target INR 2–3.", status: "Verified", sourceDocument: "CARDIO-2016-02-28", createdBy: "system" },
    { patientId: byPid["PAT-0009"].id, title: "Heart Failure Diagnosed",          category: "Diagnosis",    recordDate: "2018-06-10", facilityId: f[8].id, detail: "NYHA Class II. Echo: EF 38% (HFrEF). BNP 580 pg/mL. Furosemide 40 mg added. Carvedilol and Enalapril initiated.", status: "Verified", sourceDocument: "CARDIO-2018-06-10", createdBy: "system" },
    { patientId: byPid["PAT-0009"].id, title: "Type 2 Diabetes Diagnosed",        category: "Diagnosis",    recordDate: "2019-09-14", facilityId: f[8].id, detail: "HbA1c 9.1%. Fasting glucose 198 mg/dL. Diabetic diet counselled. Low-dose antidiabetic therapy not initiated given HF — monitoring continued.", status: "Verified", sourceDocument: "OPD-2019-09-14", createdBy: "system" },
    { patientId: byPid["PAT-0009"].id, title: "INR Monitoring — Warfarin",        category: "Laboratory",   recordDate: "2024-11-20", facilityId: f[8].id, detail: "INR: 2.4 (therapeutic range 2.0–3.0). Warfarin 5 mg maintained. No bleeding events. Next INR in 4 weeks.", status: "Verified", sourceDocument: "LAB-2024-11-20", createdBy: "system" },
    { patientId: byPid["PAT-0009"].id, title: "2D Echo — Heart Failure Review",   category: "Radiology",    recordDate: "2024-08-05", facilityId: f[8].id, detail: "EF improved to 45% (from 38%). Mild mitral regurgitation. LVEDD 58 mm. BNP 320 pg/mL. Optimised heart failure medications.", status: "Verified", sourceDocument: "ECHO-2024-08-05", createdBy: "system" },
    { patientId: byPid["PAT-0009"].id, title: "Penicillin Allergy Confirmed",     category: "Allergy",      recordDate: "2010-04-18", facilityId: f[8].id, detail: "Anaphylaxis to Ampicillin IV. Resuscitated in emergency. Penicillin allergy with cross-reactivity to aminopenicillins documented.", status: "Verified", sourceDocument: "ER-2010-04-18", createdBy: "system" },
    { patientId: byPid["PAT-0009"].id, title: "Geriatric Medicine Review",        category: "Consultation", recordDate: "2025-07-08", facilityId: f[8].id, detail: "Polypharmacy review: 8 medications assessed. No significant drug interactions. Fall risk assessment: moderate. Physiotherapy referral given.", status: "Verified", sourceDocument: "GER-2025-07-08", createdBy: "system" },

    // ── PAT-0010 Arnav Ghosh ──────────────────────────────────────────────────
    { patientId: byPid["PAT-0010"].id, title: "Type 1 Diabetes Diagnosed",        category: "Diagnosis",    recordDate: "2015-03-05", facilityId: f[9].id, detail: "DKA at presentation. Blood glucose 480 mg/dL. pH 7.18. GAD antibodies positive. Diagnosed with T1DM. Insulin regimen initiated.", status: "Verified", sourceDocument: "ER-2015-03-05", createdBy: "system" },
    { patientId: byPid["PAT-0010"].id, title: "Continuous Glucose Monitor Started", category: "Consultation", recordDate: "2022-06-14", facilityId: f[9].id, detail: "FreeStyle Libre CGM initiated. Patient educated on glucose trends, time-in-range targets. Insulin dose titration based on CGM data.", status: "Verified", sourceDocument: "OPD-2022-06-14", createdBy: "system" },
    { patientId: byPid["PAT-0010"].id, title: "HbA1c — Q4 2024",                  category: "Laboratory",   recordDate: "2024-12-10", facilityId: f[9].id, detail: "HbA1c: 7.2% (well controlled). Time-in-range 78%. Hypoglycaemia episodes: 2 mild events in past month. Adjust basal insulin if needed.", status: "Verified", sourceDocument: "LAB-2024-12-10", createdBy: "system" },
    { patientId: byPid["PAT-0010"].id, title: "Urine Microalbuminuria Screen",    category: "Laboratory",   recordDate: "2024-12-10", facilityId: f[9].id, detail: "Urine ACR: 18 mg/g (normal < 30). No early nephropathy. Annual screening to continue. BP 118/72 mmHg. No antihypertensives required.", status: "Verified", sourceDocument: "LAB-2024-12-10", createdBy: "system" },
    { patientId: byPid["PAT-0010"].id, title: "Ophthalmology Screening — Clear",  category: "Consultation", recordDate: "2024-11-22", facilityId: f[9].id, detail: "No diabetic retinopathy. Background vitreous clear. Visual acuity 6/6 bilateral. Annual fundoscopy to continue.", status: "Verified", sourceDocument: "OPHTHAL-2024-11-22", createdBy: "system" },
    { patientId: byPid["PAT-0010"].id, title: "Insulin Dose Adjustment",          category: "Prescription", recordDate: "2025-01-08", facilityId: f[9].id, detail: "Glargine reduced from 22 to 20 units at bedtime. Aspart dose ratio adjusted: 1 unit per 15 g carbohydrates. Review CGM trends in 4 weeks.", status: "Verified", sourceDocument: "RX-2025-01-08", createdBy: "system" },
    { patientId: byPid["PAT-0010"].id, title: "Foot Examination — Diabetic",      category: "Consultation", recordDate: "2025-04-15", facilityId: f[9].id, detail: "Monofilament sensation intact. Pedal pulses palpable. No callus or ulceration. Foot care education reinforced. Annual review scheduled.", status: "Verified", sourceDocument: "OPD-2025-04-15", createdBy: "system" },

    // ── PAT-0011 Deepika Rao ──────────────────────────────────────────────────
    { patientId: byPid["PAT-0011"].id, title: "Fibromyalgia Diagnosed",           category: "Diagnosis",    recordDate: "2020-05-18", facilityId: f[0].id, detail: "Widespread pain > 3 months. FIQ score 62. Tender points 14/18. ACR 2010 criteria met. Multidisciplinary pain management initiated.", status: "Verified", sourceDocument: "PAIN-2020-05-18", createdBy: "system" },
    { patientId: byPid["PAT-0011"].id, title: "Depression Diagnosed",             category: "Diagnosis",    recordDate: "2021-03-10", facilityId: f[0].id, detail: "PHQ-9 score: 16 (moderately severe). Co-morbid with fibromyalgia. Duloxetine 60 mg initiated — dual benefit for pain and mood.", status: "Verified", sourceDocument: "PSYCH-2021-03-10", createdBy: "system" },
    { patientId: byPid["PAT-0011"].id, title: "Ibuprofen Allergy — GI Upset",    category: "Allergy",      recordDate: "2019-08-22", facilityId: f[0].id, detail: "Severe gastritis and GI bleeding following Ibuprofen 400 mg. NSAID allergy/intolerance documented. Avoid all NSAIDs.", status: "Verified", sourceDocument: "ALLERGY-2019-08-22", createdBy: "system" },
    { patientId: byPid["PAT-0011"].id, title: "Psychiatric Review — PHQ-9",      category: "Consultation", recordDate: "2024-06-20", facilityId: f[0].id, detail: "PHQ-9 score: 8 (mild depression). Significant improvement on Duloxetine. Pain scores also reduced (VAS 4/10 from 7/10). Continue current regimen.", status: "Verified", sourceDocument: "OPD-2024-06-20", createdBy: "system" },
    { patientId: byPid["PAT-0011"].id, title: "Sleep Study — Mild Sleep Apnoea", category: "Laboratory",   recordDate: "2023-09-14", facilityId: f[0].id, detail: "AHI: 12 events/hour. Mild obstructive sleep apnoea. Positional therapy and weight loss advised. CPAP deferred. Follow-up in 6 months.", status: "Verified", sourceDocument: "SLEEP-2023-09-14", createdBy: "system" },
    { patientId: byPid["PAT-0011"].id, title: "Physiotherapy Discharge Report",  category: "Consultation", recordDate: "2025-02-28", facilityId: f[0].id, detail: "24-session physiotherapy programme completed. Functional capacity improved — 6MWT distance 420 m. Hydrotherapy recommended for continued benefit.", status: "Verified", sourceDocument: "PHYSIO-2025-02-28", createdBy: "system" },
    { patientId: byPid["PAT-0011"].id, title: "Routine Bloods — Annual",         category: "Laboratory",   recordDate: "2025-05-05", facilityId: f[0].id, detail: "CBC, LFT, RFT, TFT all normal. CRP: 4.2 mg/L (mildly elevated, consistent with fibromyalgia). Vitamin D: 28 ng/mL — supplement initiated.", status: "Verified", sourceDocument: "LAB-2025-05-05", createdBy: "system" },

    // ── PAT-0012 Mohammed Iqbal ───────────────────────────────────────────────
    { patientId: byPid["PAT-0012"].id, title: "Liver Cirrhosis Diagnosed",        category: "Diagnosis",    recordDate: "2017-11-08", facilityId: f[1].id, detail: "Child-Pugh Class B. Liver biopsy: bridging fibrosis (Metavir F4). Aetiology: alcohol-related. Abstinence counselled. Hepatology follow-up arranged.", status: "Verified", sourceDocument: "HEPAT-2017-11-08", createdBy: "system" },
    { patientId: byPid["PAT-0012"].id, title: "Oesophageal Varices — Banding",   category: "Surgery",      recordDate: "2019-07-22", facilityId: f[1].id, detail: "OGD: Grade III oesophageal varices. Three banding sessions performed. Propranolol 40 mg initiated for secondary prophylaxis.", status: "Verified", sourceDocument: "OGD-2019-07-22", createdBy: "system" },
    { patientId: byPid["PAT-0012"].id, title: "Contrast Dye Allergy Documented", category: "Allergy",      recordDate: "2020-09-15", facilityId: f[1].id, detail: "Contrast-induced nephropathy and urticaria following CT with IV contrast. Pre-medication protocol required for any future contrast studies.", status: "Verified", sourceDocument: "ALLERGY-2020-09-15", createdBy: "system" },
    { patientId: byPid["PAT-0012"].id, title: "LFT and AFP — 2024",               category: "Laboratory",   recordDate: "2024-05-18", facilityId: f[1].id, detail: "Bilirubin 2.8 mg/dL, Albumin 2.9 g/dL, PT 16s. AFP: 12 ng/mL (normal). Liver ultrasound: no focal lesion. 6-monthly HCC surveillance.", status: "Verified", sourceDocument: "LAB-2024-05-18", createdBy: "system" },
    { patientId: byPid["PAT-0012"].id, title: "Ascites Management",               category: "Consultation", recordDate: "2024-08-12", facilityId: f[1].id, detail: "Moderate ascites on examination. Paracentesis: 4L removed. Albumin 8g/L infused post-procedure. Lactulose dose optimised for hepatic encephalopathy prevention.", status: "Verified", sourceDocument: "OPD-2024-08-12", createdBy: "system" },
    { patientId: byPid["PAT-0012"].id, title: "Liver Ultrasound — 6 Month",      category: "Radiology",    recordDate: "2025-01-10", facilityId: f[1].id, detail: "Coarse liver echotexture. Nodular surface. Portal vein 14 mm. Mild ascites. No focal hepatic lesion identified. HCC surveillance continued.", status: "Verified", sourceDocument: "USG-2025-01-10", createdBy: "system" },
    { patientId: byPid["PAT-0012"].id, title: "Hepatitis B Vaccination",          category: "Vaccination",  recordDate: "2018-03-20", facilityId: f[1].id, detail: "Full Hepatitis B vaccination course (3 doses) completed. Anti-HBs titre: 142 mIU/mL — adequate seroprotection confirmed.", status: "Verified", sourceDocument: "VAX-2018-03-20", createdBy: "system" },

    // ── PAT-0013 Savita Kulkarni ──────────────────────────────────────────────
    { patientId: byPid["PAT-0013"].id, title: "PCOS Diagnosed",                   category: "Diagnosis",    recordDate: "2016-10-12", facilityId: f[2].id, detail: "Rotterdam criteria met: oligomenorrhoea, polycystic ovaries on USG, elevated androgens (testosterone 68 ng/dL). PCOS diagnosed.", status: "Verified", sourceDocument: "GYNAE-2016-10-12", createdBy: "system" },
    { patientId: byPid["PAT-0013"].id, title: "Insulin Resistance Confirmed",     category: "Laboratory",   recordDate: "2018-04-20", facilityId: f[2].id, detail: "OGTT: 2h glucose 158 mg/dL. HOMA-IR: 3.8 (elevated). Fasting insulin 22 mIU/mL. Metformin 500 mg initiated for insulin sensitisation.", status: "Verified", sourceDocument: "LAB-2018-04-20", createdBy: "system" },
    { patientId: byPid["PAT-0013"].id, title: "Pelvic Ultrasound — 2023",         category: "Radiology",    recordDate: "2023-06-15", facilityId: f[2].id, detail: "Right ovary: 12 follicles, volume 12 cm³. Left ovary: 10 follicles, volume 10 cm³. Pearl necklace pattern. Consistent with PCOS.", status: "Verified", sourceDocument: "USG-2023-06-15", createdBy: "system" },
    { patientId: byPid["PAT-0013"].id, title: "Gynaecology Review — 2024",        category: "Consultation", recordDate: "2024-01-25", facilityId: f[2].id, detail: "Menstrual cycles regularised on OCP. Weight: 74 kg (BMI 28.1). Lifestyle modification ongoing. Metformin continued. Fertility counselling provided.", status: "Verified", sourceDocument: "OPD-2024-01-25", createdBy: "system" },
    { patientId: byPid["PAT-0013"].id, title: "Lipid Profile and HbA1c",          category: "Laboratory",   recordDate: "2025-03-08", facilityId: f[2].id, detail: "HbA1c: 5.8% (pre-diabetic range). LDL 118 mg/dL. HDL 42 mg/dL. TG 145 mg/dL. Continue Metformin. Dietary review recommended.", status: "Verified", sourceDocument: "LAB-2025-03-08", createdBy: "system" },
    { patientId: byPid["PAT-0013"].id, title: "Thyroid Screening",                category: "Laboratory",   recordDate: "2024-07-22", facilityId: f[2].id, detail: "TSH: 2.8 mIU/L (normal). Free T4: 0.9 ng/dL. No thyroid disorder. Annual monitoring recommended given PCOS.", status: "Verified", sourceDocument: "LAB-2024-07-22", createdBy: "system" },
    { patientId: byPid["PAT-0013"].id, title: "OCP Prescription Review",          category: "Prescription", recordDate: "2025-05-12", facilityId: f[2].id, detail: "Combined OCP (Ethinyl oestradiol 30 mcg + Levonorgestrel 150 mcg) continued. BP 118/74 mmHg. No contraindications. Annual review.", status: "Verified", sourceDocument: "RX-2025-05-12", createdBy: "system" },

    // ── PAT-0014 Harish Patel ─────────────────────────────────────────────────
    { patientId: byPid["PAT-0014"].id, title: "BPH Diagnosed",                    category: "Diagnosis",    recordDate: "2019-05-10", facilityId: f[3].id, detail: "IPSS score 18 (moderate-severe). PSA: 2.8 ng/mL. TRUS: prostate volume 58 mL. Diagnosed with BPH. Tamsulosin 0.4 mg initiated.", status: "Verified", sourceDocument: "UROL-2019-05-10", createdBy: "system" },
    { patientId: byPid["PAT-0014"].id, title: "Hypertension Diagnosed",           category: "Diagnosis",    recordDate: "2021-02-18", facilityId: f[3].id, detail: "BP 168/102 mmHg on 3 readings. No secondary cause identified. Amlodipine 5 mg initiated. Lifestyle advice given.", status: "Verified", sourceDocument: "OPD-2021-02-18", createdBy: "system" },
    { patientId: byPid["PAT-0014"].id, title: "Morphine Allergy Documented",      category: "Allergy",      recordDate: "2018-09-04", facilityId: f[3].id, detail: "Post-operative morphine administration caused respiratory depression and severe pruritus. Opioid allergy documented. Tramadol also avoided.", status: "Verified", sourceDocument: "ALLERGY-2018-09-04", createdBy: "system" },
    { patientId: byPid["PAT-0014"].id, title: "PSA and Uroflowmetry 2024",        category: "Laboratory",   recordDate: "2024-04-14", facilityId: f[3].id, detail: "PSA: 3.1 ng/mL (age-adjusted, acceptable). Uroflowmetry: Qmax 10 mL/s (reduced). Post-void residual 80 mL. BPH progressing. Dose review.", status: "Verified", sourceDocument: "LAB-2024-04-14", createdBy: "system" },
    { patientId: byPid["PAT-0014"].id, title: "Urology Review — BPH",            category: "Consultation", recordDate: "2024-08-20", facilityId: f[3].id, detail: "IPSS score improved to 12 on Tamsulosin. No haematuria. Renal function normal. Watchful waiting continued. TURP discussed as future option.", status: "Verified", sourceDocument: "OPD-2024-08-20", createdBy: "system" },
    { patientId: byPid["PAT-0014"].id, title: "BP Control Review",               category: "Consultation", recordDate: "2025-03-25", facilityId: f[3].id, detail: "BP 132/82 mmHg on Amlodipine 5 mg. Well controlled. No ankle oedema. Serum electrolytes normal. Continue current regimen.", status: "Verified", sourceDocument: "OPD-2025-03-25", createdBy: "system" },
    { patientId: byPid["PAT-0014"].id, title: "Renal Ultrasound",                category: "Radiology",    recordDate: "2023-11-08", facilityId: f[3].id, detail: "Kidneys normal size, no hydronephrosis. Bladder wall mildly thickened. Post-void residual 90 mL. Consistent with outflow obstruction from BPH.", status: "Verified", sourceDocument: "USG-2023-11-08", createdBy: "system" },

    // ── PAT-0015 Anjali Mishra ────────────────────────────────────────────────
    { patientId: byPid["PAT-0015"].id, title: "Iron Deficiency Anaemia Diagnosed", category: "Diagnosis",   recordDate: "2024-02-12", facilityId: f[4].id, detail: "Hb 8.4 g/dL, MCV 68 fL, serum ferritin 6 ng/mL. Dietary deficiency and menorrhagia identified as causes. Ferrous sulfate 200 mg initiated.", status: "Verified", sourceDocument: "OPD-2024-02-12", createdBy: "system" },
    { patientId: byPid["PAT-0015"].id, title: "Pelvic USG — Menorrhagia",        category: "Radiology",    recordDate: "2024-03-05", facilityId: f[4].id, detail: "Uterus normal size. Endometrial thickness 12 mm (proliferative phase). No fibroids. No ovarian pathology. Cause of menorrhagia: dysfunctional uterine bleeding.", status: "Verified", sourceDocument: "USG-2024-03-05", createdBy: "system" },
    { patientId: byPid["PAT-0015"].id, title: "CBC — 3 Month Follow-up",         category: "Laboratory",   recordDate: "2024-05-20", facilityId: f[4].id, detail: "Hb 10.8 g/dL (improved from 8.4). Ferritin 28 ng/mL. Continue Ferrous Sulfate. Folic Acid 5 mg added. Dietary advice on iron-rich foods.", status: "Verified", sourceDocument: "LAB-2024-05-20", createdBy: "system" },
    { patientId: byPid["PAT-0015"].id, title: "CBC — 6 Month Follow-up",         category: "Laboratory",   recordDate: "2024-08-15", facilityId: f[4].id, detail: "Hb 12.2 g/dL (normalised). Ferritin 52 ng/mL. MCV 82 fL. Anaemia resolved. Continue supplementation for 3 more months to replenish stores.", status: "Verified", sourceDocument: "LAB-2024-08-15", createdBy: "system" },
    { patientId: byPid["PAT-0015"].id, title: "Gynaecology Consultation",        category: "Consultation", recordDate: "2024-09-10", facilityId: f[4].id, detail: "Menstrual blood loss assessed as heavy (PBAC score 185). Progesterone-only pill recommended to reduce blood loss. Anaemia management reviewed.", status: "Verified", sourceDocument: "GYNAE-2024-09-10", createdBy: "system" },
    { patientId: byPid["PAT-0015"].id, title: "Ferritin Level — 12 Months",      category: "Laboratory",   recordDate: "2025-02-10", facilityId: f[4].id, detail: "Ferritin: 68 ng/mL. Hb: 12.6 g/dL. Iron stores adequately replenished. Supplementation tapered to maintenance dose. Annual monitoring planned.", status: "Verified", sourceDocument: "LAB-2025-02-10", createdBy: "system" },
    { patientId: byPid["PAT-0015"].id, title: "Nutritional Counselling",         category: "Consultation", recordDate: "2025-03-12", facilityId: f[4].id, detail: "Diet rich in haem iron (red meat, liver) and non-haem iron (spinach, lentils) with Vitamin C sources advised. Avoid tea/coffee with meals.", status: "Verified", sourceDocument: "DIET-2025-03-12", createdBy: "system" },

    // ── PAT-0016 through PAT-0025 — concise records ──────────────────────────
    // PAT-0016 Debashish Roy
    { patientId: byPid["PAT-0016"].id, title: "H. pylori Positive — Peptic Ulcer",  category: "Diagnosis",    recordDate: "2021-08-14", facilityId: f[5].id, detail: "OGD: 1.5 cm gastric ulcer. CLO test positive for H. pylori. Triple therapy: Pantoprazole 40 mg + Amoxicillin 1g + Clarithromycin 500 mg × 14 days.", status: "Verified", sourceDocument: "OGD-2021-08-14", createdBy: "system" },
    { patientId: byPid["PAT-0016"].id, title: "H. pylori Eradication Confirmed",    category: "Laboratory",   recordDate: "2021-10-05", facilityId: f[5].id, detail: "Urea breath test: negative. H. pylori eradication confirmed. Pantoprazole continued for 4 more weeks. Repeat OGD in 8 weeks.", status: "Verified", sourceDocument: "UBT-2021-10-05", createdBy: "system" },
    { patientId: byPid["PAT-0016"].id, title: "Tetracycline Allergy Documented",    category: "Allergy",      recordDate: "2019-04-22", facilityId: f[5].id, detail: "Photosensitivity reaction and oesophageal ulceration following Doxycycline. Tetracycline class contraindicated.", status: "Verified", sourceDocument: "ALLERGY-2019-04-22", createdBy: "system" },
    { patientId: byPid["PAT-0016"].id, title: "Repeat OGD — Ulcer Healed",         category: "Consultation", recordDate: "2021-12-08", facilityId: f[5].id, detail: "OGD: gastric ulcer healed. No dysplasia on biopsy. GERD symptoms controlled with PPI. Lifestyle modification: avoid alcohol, NSAIDs, spicy food.", status: "Verified", sourceDocument: "OGD-2021-12-08", createdBy: "system" },
    { patientId: byPid["PAT-0016"].id, title: "GERD Annual Review",                category: "Consultation", recordDate: "2024-09-18", facilityId: f[5].id, detail: "GERD symptoms controlled (GERD-Q score 6). Pantoprazole 40 mg maintenance dose. No alarm symptoms. Dietary triggers diary reviewed.", status: "Verified", sourceDocument: "OPD-2024-09-18", createdBy: "system" },
    { patientId: byPid["PAT-0016"].id, title: "Stool Antigen Test",               category: "Laboratory",   recordDate: "2024-11-20", facilityId: f[5].id, detail: "H. pylori stool antigen test: negative. No recurrence of infection. Continue PPI therapy. Annual symptom review planned.", status: "Verified", sourceDocument: "LAB-2024-11-20", createdBy: "system" },
    { patientId: byPid["PAT-0016"].id, title: "Upper Abdominal Ultrasound",       category: "Radiology",    recordDate: "2023-07-14", facilityId: f[5].id, detail: "Liver, pancreas, gallbladder: normal. No gallstones. No biliary dilatation. Stomach wall not assessable. Incidental finding: mild fatty liver.", status: "Verified", sourceDocument: "USG-2023-07-14", createdBy: "system" },

    // PAT-0017 Nalini Subramanian
    { patientId: byPid["PAT-0017"].id, title: "Alzheimer's Disease Diagnosed",    category: "Diagnosis",    recordDate: "2022-06-15", facilityId: f[6].id, detail: "MMSE: 22/30. MoCA: 19/30. MRI: hippocampal atrophy. Amyloid PET: positive. Early-stage Alzheimer's disease diagnosed. Donepezil 10 mg initiated.", status: "Verified", sourceDocument: "NEURO-2022-06-15", createdBy: "system" },
    { patientId: byPid["PAT-0017"].id, title: "Penicillin Allergy Documented",    category: "Allergy",      recordDate: "2005-03-18", facilityId: f[6].id, detail: "Anaphylaxis following Penicillin V. Adrenaline administered. Penicillin allergy with anaphylaxis history — avoid all beta-lactams.", status: "Verified", sourceDocument: "ER-2005-03-18", createdBy: "system" },
    { patientId: byPid["PAT-0017"].id, title: "Cognitive Assessment 2024",        category: "Consultation", recordDate: "2024-04-20", facilityId: f[6].id, detail: "MMSE: 20/30. Stable on Donepezil. Caregiver (daughter) educated on dementia management. Occupational therapy referral made.", status: "Verified", sourceDocument: "OPD-2024-04-20", createdBy: "system" },
    { patientId: byPid["PAT-0017"].id, title: "MRI Brain — Annual Review",        category: "Radiology",    recordDate: "2024-06-12", facilityId: f[6].id, detail: "Progressive hippocampal volume loss. Cortical atrophy temporal and parietal lobes. No new infarcts. Changes consistent with Alzheimer's progression.", status: "Verified", sourceDocument: "MRI-2024-06-12", createdBy: "system" },
    { patientId: byPid["PAT-0017"].id, title: "BP Monitoring — Ramipril",         category: "Laboratory",   recordDate: "2024-09-08", facilityId: f[6].id, detail: "BP 136/82 mmHg. Renal function stable: creatinine 0.9 mg/dL, potassium 4.2 mEq/L. Continue Ramipril 5 mg. Annual review.", status: "Verified", sourceDocument: "LAB-2024-09-08", createdBy: "system" },
    { patientId: byPid["PAT-0017"].id, title: "Influenza and Pneumococcal Vax",  category: "Vaccination",  recordDate: "2024-10-15", facilityId: f[6].id, detail: "Influenza vaccine (quadrivalent) and Pneumococcal vaccine (PPSV23) administered. Recommended for elderly patients on immunomodulators.", status: "Verified", sourceDocument: "VAX-2024-10-15", createdBy: "system" },
    { patientId: byPid["PAT-0017"].id, title: "Geriatric Falls Risk Assessment",  category: "Consultation", recordDate: "2025-01-22", facilityId: f[6].id, detail: "Timed Up and Go test: 16 seconds (high risk). 2 falls in past year. Walking aid recommended. Home safety assessment arranged. Physiotherapy referral.", status: "Verified", sourceDocument: "GER-2025-01-22", createdBy: "system" },

    // PAT-0018 Tarun Biswas
    { patientId: byPid["PAT-0018"].id, title: "Ankylosing Spondylitis Diagnosed", category: "Diagnosis",    recordDate: "2020-09-08", facilityId: f[7].id, detail: "HLA-B27 positive. MRI sacroiliac joints: bilateral sacroiliitis Grade 3. BASDAI 6.2. Modified NY criteria met. Naproxen + Adalimumab initiated.", status: "Verified", sourceDocument: "RHEUM-2020-09-08", createdBy: "system" },
    { patientId: byPid["PAT-0018"].id, title: "Adalimumab Initiation",            category: "Prescription", recordDate: "2020-10-01", facilityId: f[7].id, detail: "Adalimumab 40 mg SC fortnightly commenced. TB screening (Mantoux and CXR): negative. Hepatitis B and C: negative. Immunisation record reviewed.", status: "Verified", sourceDocument: "RX-2020-10-01", createdBy: "system" },
    { patientId: byPid["PAT-0018"].id, title: "BASDAI Review — 2023",             category: "Consultation", recordDate: "2023-06-18", facilityId: f[7].id, detail: "BASDAI score: 3.4 (improved from 6.2). Morning stiffness 30 min. Pain VAS 3/10. Adalimumab effective. Continue current regimen.", status: "Verified", sourceDocument: "OPD-2023-06-18", createdBy: "system" },
    { patientId: byPid["PAT-0018"].id, title: "MRI Spine — Sacroiliac Joints",    category: "Radiology",    recordDate: "2024-03-22", facilityId: f[7].id, detail: "Reduced bone marrow oedema in sacroiliac joints compared to 2020. Partial ankylosis. Syndesmophytes at L4–L5. Disease progression slowed on biologics.", status: "Verified", sourceDocument: "MRI-2024-03-22", createdBy: "system" },
    { patientId: byPid["PAT-0018"].id, title: "CRP and ESR Panel",                category: "Laboratory",   recordDate: "2024-08-10", facilityId: f[7].id, detail: "CRP: 8 mg/L (mildly elevated). ESR: 24 mm/hr. Low inflammatory activity. Consistent with well-controlled AS. Continue Adalimumab fortnightly.", status: "Verified", sourceDocument: "LAB-2024-08-10", createdBy: "system" },
    { patientId: byPid["PAT-0018"].id, title: "Uveitis Episode — Treated",        category: "Hospital Visit", recordDate: "2022-11-14", facilityId: f[7].id, detail: "Acute anterior uveitis (right eye). Treated with topical corticosteroids and mydriatics. Resolved within 3 weeks. Ophthalmology follow-up arranged.", status: "Verified", sourceDocument: "OPHTHAL-2022-11-14", createdBy: "system" },
    { patientId: byPid["PAT-0018"].id, title: "Routine LFT and CBC on Biologics", category: "Laboratory",   recordDate: "2025-04-08", facilityId: f[7].id, detail: "CBC: no cytopenias. LFT: normal. No signs of hepatotoxicity. Adalimumab monitoring bloods satisfactory. Next monitoring in 6 months.", status: "Verified", sourceDocument: "LAB-2025-04-08", createdBy: "system" },

    // PAT-0019 Sunanda Bose
    { patientId: byPid["PAT-0019"].id, title: "Breast Cancer Diagnosed — Stage II", category: "Diagnosis",  recordDate: "2019-04-18", facilityId: f[8].id, detail: "Right breast lump 2.8 cm. Biopsy: invasive ductal carcinoma, ER+ PR+ HER2-. Axillary LN: 2 positive. Stage IIA. MDT: surgery + chemo + hormone therapy.", status: "Verified", sourceDocument: "ONCO-2019-04-18", createdBy: "system" },
    { patientId: byPid["PAT-0019"].id, title: "Modified Radical Mastectomy",       category: "Surgery",     recordDate: "2019-06-10", facilityId: f[8].id, detail: "Right modified radical mastectomy performed. Clear margins achieved. 4 of 18 axillary nodes positive. Adjuvant chemotherapy recommended.", status: "Verified", sourceDocument: "OT-2019-06-10", createdBy: "system" },
    { patientId: byPid["PAT-0019"].id, title: "Erythromycin Allergy Documented",   category: "Allergy",     recordDate: "2020-01-08", facilityId: f[8].id, detail: "Severe QT prolongation noted on ECG after Erythromycin 500 mg. Macrolide class documented as contraindicated. Azithromycin also avoided.", status: "Verified", sourceDocument: "ALLERGY-2020-01-08", createdBy: "system" },
    { patientId: byPid["PAT-0019"].id, title: "Chemotherapy Completed",            category: "Consultation", recordDate: "2019-12-15", facilityId: f[8].id, detail: "6 cycles AC-T chemotherapy completed. Tolerability good. Grade 2 nausea, Grade 1 alopecia. Post-chemo imaging: complete radiological response.", status: "Verified", sourceDocument: "ONCO-2019-12-15", createdBy: "system" },
    { patientId: byPid["PAT-0019"].id, title: "Tamoxifen Therapy — 5 Year Review", category: "Consultation", recordDate: "2024-08-22", facilityId: f[8].id, detail: "5 years of Tamoxifen completed. No recurrence on annual mammogram and CT. Switching to Letrozole for extended adjuvant therapy. Bone density monitoring started.", status: "Verified", sourceDocument: "OPD-2024-08-22", createdBy: "system" },
    { patientId: byPid["PAT-0019"].id, title: "Annual Mammogram — Clear",          category: "Radiology",   recordDate: "2025-04-10", facilityId: f[8].id, detail: "Bilateral mammogram: no suspicious lesion. Left breast: no abnormality. Right chest wall: no local recurrence. Scar tissue stable. BIRADS 1.", status: "Verified", sourceDocument: "MAMMO-2025-04-10", createdBy: "system" },
    { patientId: byPid["PAT-0019"].id, title: "TFT and Thyroid USG",               category: "Laboratory",  recordDate: "2025-01-15", facilityId: f[8].id, detail: "TSH: 8.2 mIU/L. Free T4: 0.6 ng/dL. Hypothyroidism diagnosed — possibly treatment-related. Levothyroxine 75 mcg initiated.", status: "Verified", sourceDocument: "LAB-2025-01-15", createdBy: "system" },

    // PAT-0020 Kiran Joshi
    { patientId: byPid["PAT-0020"].id, title: "Hypertension Diagnosed",            category: "Diagnosis",   recordDate: "2022-03-14", facilityId: f[9].id, detail: "BP 152/94 mmHg on 3 readings. ABPM confirmed. No secondary cause. Telmisartan 40 mg initiated. Lifestyle: salt restriction, exercise, DASH diet.", status: "Verified", sourceDocument: "OPD-2022-03-14", createdBy: "system" },
    { patientId: byPid["PAT-0020"].id, title: "Dyslipidaemia Diagnosed",           category: "Diagnosis",   recordDate: "2022-03-14", facilityId: f[9].id, detail: "LDL 172 mg/dL, HDL 38 mg/dL, TG 195 mg/dL. 10-year ASCVD risk: 8%. Rosuvastatin 10 mg initiated alongside lifestyle modification.", status: "Verified", sourceDocument: "OPD-2022-03-14", createdBy: "system" },
    { patientId: byPid["PAT-0020"].id, title: "Lipid Panel — 6 Month Follow-up",  category: "Laboratory",  recordDate: "2022-10-05", facilityId: f[9].id, detail: "LDL reduced to 98 mg/dL. HDL 44 mg/dL. TG 142 mg/dL. Good response to Rosuvastatin. Continue current dose. BP 136/82 mmHg.", status: "Verified", sourceDocument: "LAB-2022-10-05", createdBy: "system" },
    { patientId: byPid["PAT-0020"].id, title: "Annual Cardiac Risk Review 2024",   category: "Consultation", recordDate: "2024-07-18", facilityId: f[9].id, detail: "Recalculated 10-year ASCVD risk: 5% (improved). BP 128/80 mmHg. LDL 88 mg/dL. No end-organ damage. Continue medications. ECG: normal.", status: "Verified", sourceDocument: "OPD-2024-07-18", createdBy: "system" },
    { patientId: byPid["PAT-0020"].id, title: "Renal Function — Telmisartan Check", category: "Laboratory", recordDate: "2024-07-18", facilityId: f[9].id, detail: "Creatinine 0.9 mg/dL. eGFR 95 mL/min. Potassium 4.0 mEq/L. No renal impairment on ARB. Continue Telmisartan 40 mg.", status: "Verified", sourceDocument: "LAB-2024-07-18", createdBy: "system" },
    { patientId: byPid["PAT-0020"].id, title: "ECG — Routine Screening",          category: "Laboratory",  recordDate: "2025-02-20", facilityId: f[9].id, detail: "Normal sinus rhythm. Rate 72 bpm. PR, QRS, QT intervals normal. No ischaemic changes. Axis normal. No LVH criteria met.", status: "Verified", sourceDocument: "ECG-2025-02-20", createdBy: "system" },
    { patientId: byPid["PAT-0020"].id, title: "Lifestyle Counselling",            category: "Consultation", recordDate: "2025-04-08", facilityId: f[9].id, detail: "BMI 27.2. Advised 150 min/week moderate exercise. Mediterranean diet reviewed. Alcohol: 2 units/week. Smoking: never. Stress management discussed.", status: "Verified", sourceDocument: "OPD-2025-04-08", createdBy: "system" },

    // PAT-0021 Geeta Sinha
    { patientId: byPid["PAT-0021"].id, title: "Type 2 Diabetes with Neuropathy",   category: "Diagnosis",   recordDate: "2017-07-12", facilityId: f[0].id, detail: "HbA1c 11.2%. Distal symmetric polyneuropathy confirmed on NCS. Insulin Glargine 30 units initiated. Pregabalin 150 mg for neuropathic pain.", status: "Verified", sourceDocument: "ENDO-2017-07-12", createdBy: "system" },
    { patientId: byPid["PAT-0021"].id, title: "Sulfa Drug Allergy Documented",     category: "Allergy",     recordDate: "2015-09-20", facilityId: f[0].id, detail: "Stevens-Johnson Syndrome following Co-trimoxazole. Hospitalised for 10 days. Sulfa drugs contraindicated — severe allergy documented.", status: "Verified", sourceDocument: "ALLERGY-2015-09-20", createdBy: "system" },
    { patientId: byPid["PAT-0021"].id, title: "HbA1c — Q1 2025",                  category: "Laboratory",  recordDate: "2025-02-15", facilityId: f[0].id, detail: "HbA1c: 8.8% (suboptimal). Fasting glucose 178 mg/dL. Glargine dose increased to 34 units. Dietary compliance discussed.", status: "Verified", sourceDocument: "LAB-2025-02-15", createdBy: "system" },
    { patientId: byPid["PAT-0021"].id, title: "Nerve Conduction Study 2024",       category: "Laboratory",  recordDate: "2024-05-22", facilityId: f[0].id, detail: "Reduced sensory nerve conduction velocity bilateral lower limbs. Motor NCS mildly reduced. Progression from baseline 2017 study. Pregabalin dose maintained.", status: "Verified", sourceDocument: "NCS-2024-05-22", createdBy: "system" },
    { patientId: byPid["PAT-0021"].id, title: "Diabetic Foot Review",              category: "Consultation", recordDate: "2024-11-08", facilityId: f[0].id, detail: "Reduced vibration sensation bilateral. Mild callus right first toe. ABI 0.9 (borderline). Foot care nurse referral made. Custom insoles prescribed.", status: "Verified", sourceDocument: "OPD-2024-11-08", createdBy: "system" },
    { patientId: byPid["PAT-0021"].id, title: "Ophthalmology — Moderate NPDR",    category: "Consultation", recordDate: "2025-01-20", facilityId: f[0].id, detail: "Moderate non-proliferative diabetic retinopathy detected. No macular oedema. Pan-retinal photocoagulation not yet required. Strict glycaemic control essential.", status: "Verified", sourceDocument: "OPHTHAL-2025-01-20", createdBy: "system" },
    { patientId: byPid["PAT-0021"].id, title: "Renal Function — Microalbuminuria", category: "Laboratory",  recordDate: "2025-03-10", facilityId: f[0].id, detail: "Urine ACR: 85 mg/g (microalbuminuria). eGFR 62 mL/min. Early diabetic nephropathy. ACE inhibitor initiated to slow progression.", status: "Verified", sourceDocument: "LAB-2025-03-10", createdBy: "system" },

    // PAT-0022 Partha Sarathi Das
    { patientId: byPid["PAT-0022"].id, title: "Psoriasis Diagnosed",               category: "Diagnosis",   recordDate: "2018-02-22", facilityId: f[1].id, detail: "PASI score 18 (moderate-severe plaque psoriasis). Scalp, elbows, knees affected. BSA 22%. Methotrexate 10 mg/week initiated after topical therapy failed.", status: "Verified", sourceDocument: "DERM-2018-02-22", createdBy: "system" },
    { patientId: byPid["PAT-0022"].id, title: "Psoriatic Arthritis Diagnosed",    category: "Diagnosis",    recordDate: "2020-04-14", facilityId: f[1].id, detail: "Enthesitis right Achilles tendon. DIP joint swelling both hands. CASPAR criteria met. Psoriatic arthritis diagnosed. Methotrexate dose optimised.", status: "Verified", sourceDocument: "RHEUM-2020-04-14", createdBy: "system" },
    { patientId: byPid["PAT-0022"].id, title: "Ampicillin Allergy Documented",    category: "Allergy",      recordDate: "2016-07-10", facilityId: f[1].id, detail: "Morbilliform rash and urticaria following Ampicillin. Aminopenicillin allergy documented. Cephalosporins with caution only.", status: "Verified", sourceDocument: "ALLERGY-2016-07-10", createdBy: "system" },
    { patientId: byPid["PAT-0022"].id, title: "Methotrexate LFT and CBC",         category: "Laboratory",   recordDate: "2024-06-18", facilityId: f[1].id, detail: "ALT 42 U/L (mildly elevated). AST 38 U/L. CBC: no cytopenias. Folic acid supplementation confirmed. Methotrexate continued at current dose.", status: "Verified", sourceDocument: "LAB-2024-06-18", createdBy: "system" },
    { patientId: byPid["PAT-0022"].id, title: "PASI Assessment 2025",             category: "Consultation", recordDate: "2025-03-05", facilityId: f[1].id, detail: "PASI score: 6 (significantly reduced from 18). BSA 8%. Scalp and elbows mildly affected. Methotrexate + Betamethasone cream effective regimen.", status: "Verified", sourceDocument: "OPD-2025-03-05", createdBy: "system" },
    { patientId: byPid["PAT-0022"].id, title: "Joint X-Ray — PsA Monitoring",    category: "Radiology",    recordDate: "2024-10-20", facilityId: f[1].id, detail: "X-rays hands and feet: minimal juxta-articular erosions DIP joints. No pencil-in-cup deformity. Disease progression limited. Continue Methotrexate.", status: "Verified", sourceDocument: "XRAY-2024-10-20", createdBy: "system" },
    { patientId: byPid["PAT-0022"].id, title: "Dermatology Photography Review",   category: "Consultation", recordDate: "2025-06-10", facilityId: f[1].id, detail: "Clinical photography compared with 2018 baseline. 70% reduction in plaque area and thickness. Patient satisfaction high. Consider dose reduction trial.", status: "Verified", sourceDocument: "DERM-2025-06-10", createdBy: "system" },

    // PAT-0023 Revathi Iyer
    { patientId: byPid["PAT-0023"].id, title: "SLE Diagnosed",                    category: "Diagnosis",    recordDate: "2021-01-18", facilityId: f[2].id, detail: "ANA positive (titre 1:320, homogeneous). Anti-dsDNA: 280 IU/mL. C3/C4 low. Malar rash, photosensitivity, arthritis, proteinuria. ACR/EULAR criteria met.", status: "Verified", sourceDocument: "RHEUM-2021-01-18", createdBy: "system" },
    { patientId: byPid["PAT-0023"].id, title: "Hydroxychloroquine Initiated",     category: "Prescription", recordDate: "2021-02-01", facilityId: f[2].id, detail: "Hydroxychloroquine 200 mg daily started. Baseline ophthalmology exam: normal. Annual eye screening scheduled. Sun protection counselled.", status: "Verified", sourceDocument: "RX-2021-02-01", createdBy: "system" },
    { patientId: byPid["PAT-0023"].id, title: "Lupus Nephritis Biopsy",           category: "Laboratory",   recordDate: "2022-08-10", facilityId: f[2].id, detail: "Renal biopsy: Class III focal lupus nephritis. Prednisolone 40 mg and Mycophenolate Mofetil initiated. Baseline eGFR 72 mL/min.", status: "Verified", sourceDocument: "BIOPSY-2022-08-10", createdBy: "system" },
    { patientId: byPid["PAT-0023"].id, title: "SLE Disease Activity — 2024",      category: "Consultation", recordDate: "2024-05-14", facilityId: f[2].id, detail: "SLEDAI score: 4 (low activity). No active nephritis. Proteinuria 0.4 g/day. eGFR 68 mL/min. Prednisolone tapered to 10 mg. Continue Hydroxychloroquine.", status: "Verified", sourceDocument: "OPD-2024-05-14", createdBy: "system" },
    { patientId: byPid["PAT-0023"].id, title: "Anti-dsDNA and Complement",        category: "Laboratory",   recordDate: "2025-01-22", facilityId: f[2].id, detail: "Anti-dsDNA: 48 IU/mL (reduced). C3: 0.78 g/L (near normal). Disease serologically improving. Continue current immunosuppression.", status: "Verified", sourceDocument: "LAB-2025-01-22", createdBy: "system" },
    { patientId: byPid["PAT-0023"].id, title: "Ophthalmology HCQ Screening",      category: "Consultation", recordDate: "2024-11-05", facilityId: f[2].id, detail: "Humphrey visual field: no scotoma. OCT macula: no bull's eye maculopathy. Hydroxychloroquine retinal toxicity: not detected. Annual review.", status: "Verified", sourceDocument: "OPHTHAL-2024-11-05", createdBy: "system" },
    { patientId: byPid["PAT-0023"].id, title: "Bone Density DEXA — Steroid Use",  category: "Radiology",   recordDate: "2025-02-18", facilityId: f[2].id, detail: "Lumbar spine T-score -1.8 (osteopenia). Risk from long-term steroid use. Calcium 1000 mg + Vit D 800 IU daily. Consider bisphosphonate.", status: "Verified", sourceDocument: "DEXA-2025-02-18", createdBy: "system" },

    // PAT-0024 Santosh Reddy
    { patientId: byPid["PAT-0024"].id, title: "Parkinson's Disease Diagnosed",    category: "Diagnosis",    recordDate: "2018-10-22", facilityId: f[3].id, detail: "Resting tremor right hand, bradykinesia, rigidity. DAT scan: reduced dopaminergic uptake bilateral. Idiopathic PD diagnosed. Levodopa/Carbidopa 250/25 mg initiated.", status: "Verified", sourceDocument: "NEURO-2018-10-22", createdBy: "system" },
    { patientId: byPid["PAT-0024"].id, title: "Depression Co-morbidity",          category: "Diagnosis",    recordDate: "2020-06-15", facilityId: f[3].id, detail: "PHQ-9: 14 (moderate depression). Common in Parkinson's disease. Sertraline 50 mg initiated — safe profile with Levodopa.", status: "Verified", sourceDocument: "PSYCH-2020-06-15", createdBy: "system" },
    { patientId: byPid["PAT-0024"].id, title: "Penicillin Allergy Documented",    category: "Allergy",      recordDate: "1995-05-08", facilityId: f[3].id, detail: "Generalised urticaria following Penicillin G injection in childhood. Documented in all previous records. Avoid Penicillin and aminopenicillins.", status: "Verified", sourceDocument: "ALLERGY-1995-05-08", createdBy: "system" },
    { patientId: byPid["PAT-0024"].id, title: "UPDRS Motor Assessment 2024",      category: "Consultation", recordDate: "2024-03-18", facilityId: f[3].id, detail: "UPDRS Part III motor score: 28 (moderate impairment). On-off fluctuations noted. Levodopa dose timing adjusted. Physiotherapy and speech therapy referred.", status: "Verified", sourceDocument: "OPD-2024-03-18", createdBy: "system" },
    { patientId: byPid["PAT-0024"].id, title: "DaTscan — Disease Progression",    category: "Radiology",    recordDate: "2023-08-14", facilityId: f[3].id, detail: "DAT scan: further reduction in striatal uptake bilaterally compared to 2018. Consistent with Parkinson's progression. No atypical features.", status: "Verified", sourceDocument: "DATSCAN-2023-08-14", createdBy: "system" },
    { patientId: byPid["PAT-0024"].id, title: "Fall Risk and Gait Assessment",    category: "Consultation", recordDate: "2025-02-12", facilityId: f[3].id, detail: "3 falls in past 6 months. Festination and postural instability noted. Home physiotherapy 3x/week arranged. Hip protectors recommended.", status: "Verified", sourceDocument: "GER-2025-02-12", createdBy: "system" },
    { patientId: byPid["PAT-0024"].id, title: "Geriatric Polypharmacy Review",    category: "Consultation", recordDate: "2025-06-05", facilityId: f[3].id, detail: "7 medications reviewed. No major interactions. Anticholinergic burden low. Constipation managed. Sertraline continued for depression. Annual review.", status: "Verified", sourceDocument: "GER-2025-06-05", createdBy: "system" },

    // PAT-0025 Nisha Agarwal
    { patientId: byPid["PAT-0025"].id, title: "Generalised Anxiety Disorder",     category: "Diagnosis",    recordDate: "2023-09-10", facilityId: f[4].id, detail: "GAD-7 score: 16 (severe). Persistent worry, restlessness, poor concentration. CBT referral made. Escitalopram 10 mg initiated.", status: "Verified", sourceDocument: "PSYCH-2023-09-10", createdBy: "system" },
    { patientId: byPid["PAT-0025"].id, title: "Insomnia Diagnosed",               category: "Diagnosis",    recordDate: "2023-10-05", facilityId: f[4].id, detail: "ISI score: 19 (severe insomnia). Sleep onset > 90 min. Sleep efficiency 52%. CBT-I recommended. Melatonin 3 mg at bedtime added.", status: "Verified", sourceDocument: "OPD-2023-10-05", createdBy: "system" },
    { patientId: byPid["PAT-0025"].id, title: "CBT Progress Review",              category: "Consultation", recordDate: "2024-03-18", facilityId: f[4].id, detail: "8 sessions of CBT completed. GAD-7 reduced to 8 (mild). Sleep diary: sleep efficiency improved to 72%. Escitalopram continued.", status: "Verified", sourceDocument: "PSYCH-2024-03-18", createdBy: "system" },
    { patientId: byPid["PAT-0025"].id, title: "Thyroid and CBC Screen",           category: "Laboratory",   recordDate: "2024-01-15", facilityId: f[4].id, detail: "TSH 2.4 mIU/L (normal). CBC: no anaemia. Ferritin 62 ng/mL. Vitamin D 32 ng/mL (adequate). Ruling out organic causes of anxiety.", status: "Verified", sourceDocument: "LAB-2024-01-15", createdBy: "system" },
    { patientId: byPid["PAT-0025"].id, title: "Escitalopram 6-Month Review",      category: "Consultation", recordDate: "2024-05-20", facilityId: f[4].id, detail: "GAD-7 score: 6. Functioning well. No suicidal ideation. No side effects. Continue Escitalopram 10 mg for minimum 12 months. Review at 12 months.", status: "Verified", sourceDocument: "OPD-2024-05-20", createdBy: "system" },
    { patientId: byPid["PAT-0025"].id, title: "Sleep Study — ISI Follow-up",      category: "Laboratory",   recordDate: "2024-09-08", facilityId: f[4].id, detail: "ISI score: 9 (sub-threshold insomnia). Sleep efficiency 78%. Sleep latency 25 min. Significant improvement. CBT-I techniques maintained.", status: "Verified", sourceDocument: "LAB-2024-09-08", createdBy: "system" },
    { patientId: byPid["PAT-0025"].id, title: "Annual Mental Health Review 2025",  category: "Consultation", recordDate: "2025-08-05", facilityId: f[4].id, detail: "GAD-7: 4 (minimal anxiety). ISI: 6 (normal sleep). Functioning excellent. Discussing tapering Escitalopram over 3 months. Melatonin to continue.", status: "Verified", sourceDocument: "OPD-2025-08-05", createdBy: "system" },
  ];

  const inserted = await db
    .insert(clinicalRecordsTable)
    .values(records)
    .returning();
  console.log(`✓ Seeded ${inserted.length} clinical records`);
  return inserted;
}

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
async function seedDocuments(
  patients: { id: number; patientId: string }[],
  records: { id: number; patientId: number; title: string }[],
) {
  const docRows = records.slice(0, 30).map((r) => ({
    patientId: r.patientId,
    recordId: r.id,
    name: `${r.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
    documentType: "PDF",
    verified: true,
  }));
  const inserted = await db.insert(documentsTable).values(docRows).returning();
  console.log(`✓ Seeded ${inserted.length} documents`);
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
async function seedAuditLogs(patients: { id: number; patientId: string }[]) {
  const logs = patients.slice(0, 5).map((p) => ({
    patientId: p.id,
    event: "RECORD_VIEWED",
    actor: "system-seed",
    purpose: "Initial data seeding",
    tone: "info",
  }));
  await db.insert(auditLogsTable).values(logs).returning();
  console.log(`✓ Seeded ${logs.length} audit log entries`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Starting MedVault-AI seed...\n");
  await truncateAll();
  const facilities = await seedFacilities();
  await seedDoctors(facilities);
  const patients = await seedPatients(facilities);
  const records = await seedClinicalRecords(patients, facilities);
  await seedDocuments(patients, records);
  await seedAuditLogs(patients);
  console.log("\n✅ Seed complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  pool.end();
  process.exit(1);
});