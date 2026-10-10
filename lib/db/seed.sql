-- MedVault AI — Seed Data
-- Safe to re-run: every INSERT is ON CONFLICT DO NOTHING (needs migrations/002 applied first)
-- Run AFTER schema.sql

BEGIN;

-- ─── Facilities ────────────────────────────────────────────────────────────────
INSERT INTO facilities (name, city, state) VALUES
  ('Kolkata Care Hospital',      'Kolkata',     'West Bengal'),
  ('Apollo Hospitals Chennai',   'Chennai',     'Tamil Nadu'),
  ('AIIMS New Delhi',            'New Delhi',   'Delhi'),
  ('Manipal Hospital Bengaluru', 'Bengaluru',   'Karnataka'),
  ('Fortis Escorts Mumbai',      'Mumbai',      'Maharashtra'),
  ('Medanta Gurugram',           'Gurugram',    'Haryana'),
  ('KIMS Hyderabad',             'Hyderabad',   'Telangana'),
  ('Max Super Specialty Noida',  'Noida',       'Uttar Pradesh'),
  ('Ruby General Hospital',      'Kolkata',     'West Bengal'),
  ('Christian Medical College',  'Vellore',     'Tamil Nadu'),
  ('Narayana Health Ahmedabad',  'Ahmedabad',   'Gujarat'),
  ('Kokilaben Hospital Mumbai',  'Mumbai',      'Maharashtra')
ON CONFLICT DO NOTHING;

-- ─── Doctors (DOC-REG-0001 to DOC-REG-0012) ───────────────────────────────────
INSERT INTO doctors (registration_number, name, specialization, facility_id, email, role, verified) VALUES
  ('DOC-REG-0001', 'Dr. Arjun Mehta',       'Cardiology',            (SELECT id FROM facilities WHERE name='Kolkata Care Hospital'),      'arjun.mehta@kolkatacare.in',       'doctor', TRUE),
  ('DOC-REG-0002', 'Dr. Priya Nair',        'Endocrinology',         (SELECT id FROM facilities WHERE name='Apollo Hospitals Chennai'),    'priya.nair@apollochennai.in',      'doctor', TRUE),
  ('DOC-REG-0003', 'Dr. Rohan Sharma',      'General Surgery',       (SELECT id FROM facilities WHERE name='AIIMS New Delhi'),            'rohan.sharma@aiims.in',            'doctor', TRUE),
  ('DOC-REG-0004', 'Dr. Sunita Reddy',      'Neurology',             (SELECT id FROM facilities WHERE name='Manipal Hospital Bengaluru'),  'sunita.reddy@manipal.in',          'doctor', TRUE),
  ('DOC-REG-0005', 'Dr. Vikram Patel',      'Orthopedics',           (SELECT id FROM facilities WHERE name='Fortis Escorts Mumbai'),      'vikram.patel@fortismumbai.in',     'doctor', TRUE),
  ('DOC-REG-0006', 'Dr. Kavitha Iyer',      'Pulmonology',           (SELECT id FROM facilities WHERE name='Medanta Gurugram'),           'kavitha.iyer@medanta.in',          'doctor', TRUE),
  ('DOC-REG-0007', 'Dr. Anil Kumar',        'Gastroenterology',      (SELECT id FROM facilities WHERE name='KIMS Hyderabad'),             'anil.kumar@kims.in',               'doctor', TRUE),
  ('DOC-REG-0008', 'Dr. Meena Joshi',       'Obstetrics & Gynecology',(SELECT id FROM facilities WHERE name='Max Super Specialty Noida'),  'meena.joshi@maxnoida.in',          'doctor', TRUE),
  ('DOC-REG-0009', 'Dr. Sanjay Bose',       'Internal Medicine',     (SELECT id FROM facilities WHERE name='Ruby General Hospital'),      'sanjay.bose@rubygeneral.in',       'doctor', TRUE),
  ('DOC-REG-0010', 'Dr. Lakshmi Varma',     'Dermatology',           (SELECT id FROM facilities WHERE name='Christian Medical College'),  'lakshmi.varma@cmcvellore.in',      'doctor', TRUE),
  ('DOC-REG-0011', 'Dr. Rahul Gupta',       'Nephrology',            (SELECT id FROM facilities WHERE name='Narayana Health Ahmedabad'),  'rahul.gupta@narayanaahd.in',       'doctor', TRUE),
  ('DOC-REG-0012', 'Dr. Anjali Desai',      'Oncology',              (SELECT id FROM facilities WHERE name='Kokilaben Hospital Mumbai'),  'anjali.desai@kokilaben.in',        'doctor', TRUE)
ON CONFLICT (registration_number) DO NOTHING;

-- ─── Patients (PAT-0001 to PAT-0025) ─────────────────────────────────────────
INSERT INTO patients (patient_id, name, age, gender, health_id, allergies, chronic_conditions, current_medicines, facility_id) VALUES

-- PAT-0001: Ananya Sen (prescribed)
('PAT-0001','Ananya Sen',42,'Female','HLT-IND-2048-00127',
  ARRAY['Penicillin'],
  ARRAY['Type 2 Diabetes','Hypertension'],
  ARRAY['Metformin 500 mg','Amlodipine 5 mg'],
  (SELECT id FROM facilities WHERE name='Kolkata Care Hospital')),

-- PAT-0002
('PAT-0002','Rajesh Bhatia',55,'Male','HLT-IND-2048-00128',
  ARRAY['Sulfonamides'],
  ARRAY['Coronary Artery Disease','Hyperlipidemia'],
  ARRAY['Atorvastatin 40 mg','Aspirin 75 mg','Metoprolol 25 mg'],
  (SELECT id FROM facilities WHERE name='Apollo Hospitals Chennai')),

-- PAT-0003
('PAT-0003','Deepa Krishnan',34,'Female','HLT-IND-2048-00129',
  ARRAY['Latex','Ibuprofen'],
  ARRAY['Asthma'],
  ARRAY['Salbutamol Inhaler','Budesonide Inhaler'],
  (SELECT id FROM facilities WHERE name='AIIMS New Delhi')),

-- PAT-0004
('PAT-0004','Mohan Iyer',67,'Male','HLT-IND-2048-00130',
  ARRAY['None known'],
  ARRAY['Chronic Kidney Disease Stage 3','Hypertension'],
  ARRAY['Amlodipine 10 mg','Losartan 50 mg','Calcium carbonate 500 mg'],
  (SELECT id FROM facilities WHERE name='Manipal Hospital Bengaluru')),

-- PAT-0005
('PAT-0005','Priya Kapoor',28,'Female','HLT-IND-2048-00131',
  ARRAY['Penicillin','Aspirin'],
  ARRAY['Rheumatoid Arthritis'],
  ARRAY['Methotrexate 10 mg weekly','Folic acid 5 mg weekly','Hydroxychloroquine 200 mg'],
  (SELECT id FROM facilities WHERE name='Fortis Escorts Mumbai')),

-- PAT-0006
('PAT-0006','Suresh Nambiar',48,'Male','HLT-IND-2048-00132',
  ARRAY['Codeine'],
  ARRAY['Type 2 Diabetes','Peripheral Neuropathy'],
  ARRAY['Insulin Glargine 20 units','Pregabalin 75 mg','Metformin 1000 mg'],
  (SELECT id FROM facilities WHERE name='Medanta Gurugram')),

-- PAT-0007
('PAT-0007','Fatima Sheikh',39,'Female','HLT-IND-2048-00133',
  ARRAY['None known'],
  ARRAY['Hypothyroidism'],
  ARRAY['Levothyroxine 50 mcg'],
  (SELECT id FROM facilities WHERE name='KIMS Hyderabad')),

-- PAT-0008
('PAT-0008','Aryan Verma',22,'Male','HLT-IND-2048-00134',
  ARRAY['Cephalosporins'],
  ARRAY['Epilepsy'],
  ARRAY['Valproate 500 mg','Levetiracetam 500 mg'],
  (SELECT id FROM facilities WHERE name='Max Super Specialty Noida')),

-- PAT-0009
('PAT-0009','Meera Pillai',60,'Female','HLT-IND-2048-00135',
  ARRAY['Morphine'],
  ARRAY['Osteoporosis','Vitamin D Deficiency'],
  ARRAY['Alendronate 70 mg weekly','Vitamin D3 60000 IU monthly','Calcium citrate 500 mg'],
  (SELECT id FROM facilities WHERE name='Ruby General Hospital')),

-- PAT-0010
('PAT-0010','Dinesh Rao',44,'Male','HLT-IND-2048-00136',
  ARRAY['Tetracycline'],
  ARRAY['Peptic Ulcer Disease','GERD'],
  ARRAY['Pantoprazole 40 mg','Amoxicillin 500 mg','Clarithromycin 500 mg'],
  (SELECT id FROM facilities WHERE name='Christian Medical College')),

-- PAT-0011
('PAT-0011','Anita Sharma',51,'Female','HLT-IND-2048-00137',
  ARRAY['Peanuts','Shellfish'],
  ARRAY['Hyperthyroidism','Atrial Fibrillation'],
  ARRAY['Carbimazole 10 mg','Warfarin 2 mg','Digoxin 0.125 mg'],
  (SELECT id FROM facilities WHERE name='Narayana Health Ahmedabad')),

-- PAT-0012
('PAT-0012','Kiran Desai',36,'Male','HLT-IND-2048-00138',
  ARRAY['None known'],
  ARRAY['Psoriasis'],
  ARRAY['Methotrexate 15 mg weekly','Topical Clobetasol'],
  (SELECT id FROM facilities WHERE name='Kokilaben Hospital Mumbai')),

-- PAT-0013
('PAT-0013','Sunita Garg',58,'Female','HLT-IND-2048-00139',
  ARRAY['Contrast dye'],
  ARRAY['Chronic Obstructive Pulmonary Disease','Hypertension'],
  ARRAY['Tiotropium Inhaler','Formoterol Inhaler','Amlodipine 5 mg'],
  (SELECT id FROM facilities WHERE name='Kolkata Care Hospital')),

-- PAT-0014
('PAT-0014','Vivek Malhotra',31,'Male','HLT-IND-2048-00140',
  ARRAY['Sulfonamides'],
  ARRAY['None'],
  ARRAY['None'],
  (SELECT id FROM facilities WHERE name='Apollo Hospitals Chennai')),

-- PAT-0015
('PAT-0015','Rekha Joshi',45,'Female','HLT-IND-2048-00141',
  ARRAY['Latex'],
  ARRAY['Migraine','Depression'],
  ARRAY['Topiramate 50 mg','Sertraline 50 mg','Sumatriptan 50 mg PRN'],
  (SELECT id FROM facilities WHERE name='AIIMS New Delhi')),

-- PAT-0016
('PAT-0016','Praveen Kumar',63,'Male','HLT-IND-2048-00142',
  ARRAY['None known'],
  ARRAY['Benign Prostatic Hyperplasia','Hypertension'],
  ARRAY['Tamsulosin 0.4 mg','Finasteride 5 mg','Telmisartan 40 mg'],
  (SELECT id FROM facilities WHERE name='Manipal Hospital Bengaluru')),

-- PAT-0017
('PAT-0017','Nandita Roy',27,'Female','HLT-IND-2048-00143',
  ARRAY['Penicillin'],
  ARRAY['Polycystic Ovary Syndrome','Insulin Resistance'],
  ARRAY['Metformin 500 mg','Spironolactone 50 mg','Oral contraceptive'],
  (SELECT id FROM facilities WHERE name='Fortis Escorts Mumbai')),

-- PAT-0018
('PAT-0018','Amar Singh',70,'Male','HLT-IND-2048-00144',
  ARRAY['None known'],
  ARRAY['Parkinson Disease','Hypertension'],
  ARRAY['Levodopa-Carbidopa 100/25 mg','Pramipexole 0.5 mg','Amlodipine 5 mg'],
  (SELECT id FROM facilities WHERE name='Medanta Gurugram')),

-- PAT-0019
('PAT-0019','Geeta Pandey',40,'Female','HLT-IND-2048-00145',
  ARRAY['Aspirin','NSAIDs'],
  ARRAY['Systemic Lupus Erythematosus'],
  ARRAY['Hydroxychloroquine 400 mg','Prednisolone 10 mg','Calcium carbonate 500 mg'],
  (SELECT id FROM facilities WHERE name='KIMS Hyderabad')),

-- PAT-0020
('PAT-0020','Siddharth Chandra',52,'Male','HLT-IND-2048-00146',
  ARRAY['Iodine'],
  ARRAY['Type 1 Diabetes'],
  ARRAY['Insulin Aspart 12 units TID','Insulin Glargine 24 units OD'],
  (SELECT id FROM facilities WHERE name='Max Super Specialty Noida')),

-- PAT-0021
('PAT-0021','Pooja Menon',33,'Female','HLT-IND-2048-00147',
  ARRAY['Metronidazole'],
  ARRAY['Irritable Bowel Syndrome'],
  ARRAY['Mebeverine 135 mg','Probiotics'],
  (SELECT id FROM facilities WHERE name='Ruby General Hospital')),

-- PAT-0022
('PAT-0022','Harish Tiwari',47,'Male','HLT-IND-2048-00148',
  ARRAY['None known'],
  ARRAY['Gout','Hypertension'],
  ARRAY['Allopurinol 300 mg','Febuxostat 80 mg','Losartan 50 mg'],
  (SELECT id FROM facilities WHERE name='Christian Medical College')),

-- PAT-0023
('PAT-0023','Shweta Bansal',38,'Female','HLT-IND-2048-00149',
  ARRAY['Shellfish','Penicillin'],
  ARRAY['Iron Deficiency Anemia','Hypothyroidism'],
  ARRAY['Ferrous sulphate 200 mg','Levothyroxine 75 mcg'],
  (SELECT id FROM facilities WHERE name='Narayana Health Ahmedabad')),

-- PAT-0024
('PAT-0024','Manoj Kulkarni',59,'Male','HLT-IND-2048-00150',
  ARRAY['None known'],
  ARRAY['Heart Failure','Atrial Fibrillation','Hypertension'],
  ARRAY['Furosemide 40 mg','Spironolactone 25 mg','Bisoprolol 5 mg','Apixaban 5 mg'],
  (SELECT id FROM facilities WHERE name='Kokilaben Hospital Mumbai')),

-- PAT-0025
('PAT-0025','Kaveri Nair',29,'Female','HLT-IND-2048-00151',
  ARRAY['None known'],
  ARRAY['None'],
  ARRAY['None'],
  (SELECT id FROM facilities WHERE name='Kolkata Care Hospital'))

ON CONFLICT (patient_id) DO NOTHING;

-- ─── Clinical Records ─────────────────────────────────────────────────────────
-- Helper: we reference patient/doctor IDs by lookup below

-- PAT-0001: Ananya Sen
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0001'),'surgery',
 'Appendectomy',
 'Emergency appendectomy performed for acute appendicitis. Procedure completed without complications. Patient discharged on post-operative day 3.',
 '2019-06-15',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0003')),

((SELECT id FROM patients WHERE patient_id='PAT-0001'),'diagnosis',
 'Hypertension Diagnosed',
 'Patient presented with consistently elevated BP readings (>140/90 mmHg) over 3 separate visits. Stage 1 hypertension confirmed. Amlodipine 5 mg commenced.',
 '2023-03-10',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001')),

((SELECT id FROM patients WHERE patient_id='PAT-0001'),'diagnosis',
 'Type 2 Diabetes Mellitus Diagnosed',
 'Fasting blood glucose 148 mg/dL, HbA1c 8.4%. Diagnosed with Type 2 Diabetes Mellitus. Diet counselling given; Metformin 500 mg initiated.',
 '2024-01-22',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0001'),'lab_report',
 'HbA1c Report — 8.2%',
 'HbA1c: 8.2% (reference <7%). Fasting glucose: 138 mg/dL. Serum creatinine: 0.9 mg/dL. eGFR: 78. Lipid profile within normal limits. Glycaemic control suboptimal; dose review recommended.',
 '2025-08-10',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0001'),'prescription',
 'Prescription — Metformin 500 mg & Amlodipine 5 mg',
 'Continuing Metformin 500 mg twice daily with meals for Type 2 Diabetes. Amlodipine 5 mg once daily for Hypertension. Review in 3 months with HbA1c and renal function tests.',
 '2025-08-12',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'))
ON CONFLICT DO NOTHING;

-- PAT-0002: Rajesh Bhatia
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0002'),'diagnosis',
 'Coronary Artery Disease Diagnosed',
 'Chest pain on exertion for 3 months. ECG showed ST-segment changes. Coronary angiography confirmed 70% LAD stenosis. Medical management initiated.',
 '2021-04-18',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001')),

((SELECT id FROM patients WHERE patient_id='PAT-0002'),'surgery',
 'Percutaneous Coronary Intervention (PCI)',
 'Drug-eluting stent placed in LAD. Procedure successful, no complications. Dual antiplatelet therapy started: Aspirin 75 mg + Clopidogrel 75 mg.',
 '2021-05-02',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001')),

((SELECT id FROM patients WHERE patient_id='PAT-0002'),'lab_report',
 'Lipid Profile — Elevated LDL',
 'Total cholesterol: 248 mg/dL. LDL: 162 mg/dL. HDL: 38 mg/dL. Triglycerides: 240 mg/dL. Atorvastatin dose increased to 40 mg.',
 '2022-09-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001')),

((SELECT id FROM patients WHERE patient_id='PAT-0002'),'hospital_visit',
 'Cardiology Follow-up',
 'Stable angina. Echo: EF 52%. No new wall motion abnormality. Continue current medications. Lifestyle modification counselling repeated.',
 '2024-02-20',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001')),

((SELECT id FROM patients WHERE patient_id='PAT-0002'),'prescription',
 'Updated Cardiac Medication Plan',
 'Atorvastatin 40 mg OD, Aspirin 75 mg OD, Metoprolol 25 mg BD. Clopidogrel discontinued (>1 year post-PCI). Annual echocardiogram advised.',
 '2025-06-10',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'))
ON CONFLICT DO NOTHING;

-- PAT-0003: Deepa Krishnan
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0003'),'diagnosis',
 'Bronchial Asthma Diagnosed',
 'Recurrent wheezing and breathlessness since childhood. Spirometry: FEV1/FVC 68%, reversibility 15%. Mild persistent asthma. Inhalers prescribed.',
 '2012-07-05',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006')),

((SELECT id FROM patients WHERE patient_id='PAT-0003'),'allergy_note',
 'Latex & NSAID Allergy Confirmed',
 'Contact urticaria on latex exposure confirmed by patch test. Ibuprofen caused bronchospasm. Both documented as known allergies. Avoid latex gloves and NSAIDs.',
 '2015-03-22',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006')),

((SELECT id FROM patients WHERE patient_id='PAT-0003'),'hospital_visit',
 'Acute Asthma Exacerbation',
 'Presented with severe breathlessness, SpO2 88% on room air. Nebulised salbutamol and IV hydrocortisone given. Responded well; discharged after 2 days.',
 '2022-01-18',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006')),

((SELECT id FROM patients WHERE patient_id='PAT-0003'),'lab_report',
 'Spirometry & FeNO Test',
 'FEV1/FVC: 71% post-bronchodilator. FeNO: 48 ppb (elevated, indicating eosinophilic airway inflammation). ICS dose increased.',
 '2024-08-30',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006')),

((SELECT id FROM patients WHERE patient_id='PAT-0003'),'prescription',
 'Asthma Step-Up Therapy',
 'Salbutamol 100 mcg MDI PRN, Budesonide/Formoterol 160/4.5 mcg BD. Written asthma action plan provided. Review in 6 weeks.',
 '2025-01-12',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006'))
ON CONFLICT DO NOTHING;

-- PAT-0004: Mohan Iyer
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0004'),'diagnosis',
 'Chronic Kidney Disease Stage 3 Diagnosed',
 'eGFR 42 mL/min/1.73m² on two readings 3 months apart. Urine PCR 180 mg/g. CKD Stage 3b with proteinuria. Nephrology referral made.',
 '2020-11-09',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0011'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0011')),

((SELECT id FROM patients WHERE patient_id='PAT-0004'),'lab_report',
 'Renal Function Panel',
 'Creatinine: 1.9 mg/dL. BUN: 28. eGFR: 38. Potassium: 4.8 mEq/L. Phosphorus: 4.2. Haemoglobin: 10.8 g/dL (CKD-related anaemia). EPO therapy considered.',
 '2023-05-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0011'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0011')),

((SELECT id FROM patients WHERE patient_id='PAT-0004'),'prescription',
 'CKD Management Regimen',
 'Losartan 50 mg OD (renoprotective), Amlodipine 10 mg OD, Calcium carbonate 500 mg TID with meals (phosphate binder). Low-protein diet advised.',
 '2023-05-15',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0011'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0011')),

((SELECT id FROM patients WHERE patient_id='PAT-0004'),'hospital_visit',
 'Nephrology Review — CKD Monitoring',
 'Stable. eGFR 36. No acute decompensation. Blood pressure 138/84. Dietary compliance improving. Continue current plan with 3-monthly labs.',
 '2024-11-20',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0011'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0011')),

((SELECT id FROM patients WHERE patient_id='PAT-0004'),'vaccination',
 'Pneumococcal & Influenza Vaccines',
 'PPSV23 administered (CKD indication). Influenza vaccine (seasonal quadrivalent) given. Both tolerated well. Next influenza vaccine due annual.',
 '2025-02-03',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0011'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0011'))
ON CONFLICT DO NOTHING;

-- PAT-0005: Priya Kapoor
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0005'),'diagnosis',
 'Rheumatoid Arthritis Diagnosed',
 'Symmetrical small joint polyarthritis for 6 months. Anti-CCP positive (>340 U/mL). RF positive. DAS28 score 5.8. Seropositive RA confirmed.',
 '2019-03-11',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0005'),'allergy_note',
 'Penicillin & Aspirin Allergy',
 'Documented anaphylaxis with amoxicillin (2018). Aspirin causes urticaria. Both noted. Azithromycin for infections; avoid all aspirin/NSAIDs.',
 '2019-03-11',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0005'),'lab_report',
 'Rheumatology Labs — Disease Monitoring',
 'ESR: 68 mm/hr. CRP: 32 mg/L. Anti-CCP: 280 U/mL (improving). LFT normal (on Methotrexate monitoring). No hepatotoxicity signs.',
 '2022-07-19',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0005'),'prescription',
 'DMARD Therapy',
 'Methotrexate 10 mg weekly + Folic acid 5 mg weekly (day after MTX). Hydroxychloroquine 200 mg BD. Annual eye review for HCQ retinopathy.',
 '2023-01-08',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0005'),'hospital_visit',
 'Rheumatology Review — Stable Disease',
 'DAS28 score 2.9 (low activity). Patient tolerating DMARDs well. Joint swelling markedly reduced. Continue current regimen. Next review in 4 months.',
 '2025-05-15',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'))
ON CONFLICT DO NOTHING;

-- PAT-0006: Suresh Nambiar
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0006'),'diagnosis',
 'Type 2 Diabetes with Peripheral Neuropathy',
 'Long-standing diabetes (10 years). Burning and tingling in both feet for 18 months. Vibration sense reduced. Confirmed diabetic peripheral neuropathy.',
 '2018-06-22',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0006'),'lab_report',
 'Diabetic Annual Review Labs',
 'HbA1c: 9.1%. Fasting glucose: 188 mg/dL. Urine microalbumin: 42 mg/g (microalbuminuria). eGFR: 64. LDL: 128 mg/dL.',
 '2023-08-05',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0006'),'prescription',
 'Insulin Initiation',
 'Insulin Glargine 20 units OD added due to poor glycaemic control on oral agents. Metformin 1000 mg BD continued. Pregabalin 75 mg BD for neuropathic pain.',
 '2023-08-10',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0006'),'hospital_visit',
 'Diabetic Foot Clinic',
 'Bilateral foot examination: no active ulcers. ABI 0.9 (normal). Monofilament testing: reduced sensation in plantar surface. Podiatry referral made.',
 '2024-04-17',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0006'),'vaccination',
 'Annual Influenza & Pneumococcal Vaccine',
 'Influenza QIV administered. PCV13 given (diabetic patient). Both tolerated without adverse effects.',
 '2025-01-20',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'))
ON CONFLICT DO NOTHING;

-- PAT-0007: Fatima Sheikh
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0007'),'diagnosis',
 'Hypothyroidism Diagnosed',
 'Fatigue, weight gain, cold intolerance for 8 months. TSH: 12.4 mIU/L. Free T4: 0.6 ng/dL. Primary hypothyroidism confirmed. Levothyroxine initiated.',
 '2017-09-28',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0007'),'lab_report',
 'Thyroid Function Test — Stable',
 'TSH: 2.8 mIU/L (normal). Free T4: 1.2 ng/dL. Thyroid peroxidase antibodies positive (Hashimoto thyroiditis). Dose maintained at 50 mcg.',
 '2022-02-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0007'),'prescription',
 'Levothyroxine Prescription',
 'Levothyroxine 50 mcg OD on empty stomach. 6-monthly TSH monitoring. Avoid calcium/iron supplements within 4 hours of dose.',
 '2022-02-15',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0007'),'hospital_visit',
 'Antenatal Thyroid Screening',
 'Patient planned pregnancy. TSH target <2.5 mIU/L in 1st trimester. Current TSH 1.9, adequate. Levothyroxine dose unchanged. Obstetric referral made.',
 '2024-06-03',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0008'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0008')),

((SELECT id FROM patients WHERE patient_id='PAT-0007'),'lab_report',
 'Postpartum Thyroid Check',
 'TSH: 3.4 mIU/L post-delivery. Returning to pre-pregnancy dose. Monitor for postpartum thyroiditis at 3 months.',
 '2025-04-10',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'))
ON CONFLICT DO NOTHING;

-- PAT-0008: Aryan Verma
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0008'),'diagnosis',
 'Juvenile Myoclonic Epilepsy Diagnosed',
 'Morning myoclonic jerks and 2 generalised tonic-clonic seizures. EEG: 3-4 Hz generalised spike-wave. Diagnosis: Juvenile Myoclonic Epilepsy. Valproate started.',
 '2017-11-03',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0008'),'allergy_note',
 'Cephalosporin Allergy',
 'Cefixime caused urticaria and facial angioedema at age 16. Allergy confirmed. Use macrolides or fluoroquinolones for bacterial infections.',
 '2019-06-20',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0008'),'lab_report',
 'VPA Levels & LFT',
 'Valproate serum level: 72 mcg/mL (therapeutic 50-100). ALT: 28 U/L, AST: 24 U/L. Normal LFTs. No hepatotoxicity. Continue current dose.',
 '2023-03-16',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0008'),'prescription',
 'Add-On Levetiracetam',
 'Valproate 500 mg BD continued. Levetiracetam 500 mg BD added due to breakthrough seizures. Monitor mood; levetiracetam may cause irritability.',
 '2024-01-09',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0008'),'hospital_visit',
 'Neurology Review — Seizure Free',
 'Seizure free for 14 months on dual AEDs. Driving licence not yet reinstated (< 1 year seizure free). Continue current regimen. Review in 6 months.',
 '2025-03-28',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'))
ON CONFLICT DO NOTHING;

-- PAT-0009: Meera Pillai
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0009'),'diagnosis',
 'Osteoporosis Diagnosed',
 'DEXA scan: L-spine T-score -2.8, femoral neck -2.5. Vitamin D: 14 ng/mL (deficient). FRAX 10-year hip fracture risk 8.2%. Bisphosphonate initiated.',
 '2020-09-07',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005')),

((SELECT id FROM patients WHERE patient_id='PAT-0009'),'surgery',
 'Right Hip ORIF after Fall',
 'Intertrochanteric fracture following fall. Open reduction and internal fixation with dynamic hip screw. Physiotherapy started day 2 post-op.',
 '2022-12-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005')),

((SELECT id FROM patients WHERE patient_id='PAT-0009'),'lab_report',
 'Bone Biochemistry Panel',
 'Calcium: 9.1 mg/dL. ALP: 88 U/L. PTH: 62 pg/mL (slightly elevated). Vitamin D: 32 ng/mL (after supplementation). Improving.',
 '2024-03-05',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005')),

((SELECT id FROM patients WHERE patient_id='PAT-0009'),'prescription',
 'Osteoporosis Treatment Plan',
 'Alendronate 70 mg weekly (take with full glass of water, remain upright 30 min). Vitamin D3 60000 IU monthly. Calcium citrate 500 mg BD. Fall prevention programme referral.',
 '2024-03-06',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005')),

((SELECT id FROM patients WHERE patient_id='PAT-0009'),'vaccination',
 'Shingles Vaccine',
 'Shingrix (RZV) 1st dose administered (age ≥60 indication). 2nd dose due in 2-6 months. No adverse effects.',
 '2025-02-18',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'))
ON CONFLICT DO NOTHING;

-- PAT-0010: Dinesh Rao
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0010'),'diagnosis',
 'Peptic Ulcer Disease & GERD',
 'Epigastric pain for 4 months, worsens at night. UGI endoscopy: 8mm duodenal ulcer. Rapid urease test positive (H. pylori). Triple therapy initiated.',
 '2021-08-17',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007')),

((SELECT id FROM patients WHERE patient_id='PAT-0010'),'lab_report',
 'H. pylori Eradication Test',
 'Urea breath test: negative (H. pylori eradicated). Repeat endoscopy: ulcer healed. Maintenance PPI continued for 8 additional weeks.',
 '2021-10-22',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007')),

((SELECT id FROM patients WHERE patient_id='PAT-0010'),'allergy_note',
 'Tetracycline Allergy',
 'Doxycycline caused severe photosensitivity reaction. Tetracycline class documented as allergy. Use alternative antibiotics.',
 '2022-04-06',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007')),

((SELECT id FROM patients WHERE patient_id='PAT-0010'),'hospital_visit',
 'GI Review — Reflux Management',
 'GERD symptoms persistent. 24-hour pH-impedance study confirms pathological acid reflux. Pantoprazole dose optimised. Dietary advice reinforced.',
 '2023-11-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007')),

((SELECT id FROM patients WHERE patient_id='PAT-0010'),'prescription',
 'Long-Term PPI Therapy',
 'Pantoprazole 40 mg OD 30 min before breakfast. Antacid gel PRN. Avoid NSAIDs, coffee, alcohol, and late meals. Colonoscopy recommended at age 45.',
 '2025-01-30',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007'))
ON CONFLICT DO NOTHING;

-- PAT-0011: Anita Sharma
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0011'),'diagnosis',
 'Hyperthyroidism & Atrial Fibrillation',
 'Palpitations, weight loss, tremors for 3 months. TSH <0.01. T4: 3.8. Radioiodine uptake confirms Graves disease. New AF on ECG. Cardiology co-management.',
 '2019-10-12',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001')),

((SELECT id FROM patients WHERE patient_id='PAT-0011'),'lab_report',
 'Thyroid Autoantibodies & Echo',
 'TRAb: 8.4 IU/L (elevated). Echo: mildly dilated LA, EF 58%. No thrombus. CHA2DS2-VASc score 2. Anticoagulation initiated.',
 '2020-01-08',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001')),

((SELECT id FROM patients WHERE patient_id='PAT-0011'),'prescription',
 'Antithyroid & Anticoagulation Therapy',
 'Carbimazole 10 mg TID tapering to maintenance. Warfarin 2 mg OD (target INR 2-3). Digoxin 0.125 mg OD for rate control. Regular INR checks.',
 '2020-02-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001')),

((SELECT id FROM patients WHERE patient_id='PAT-0011'),'allergy_note',
 'Peanut & Shellfish Allergy',
 'Anaphylaxis documented with peanut (2016). Shellfish causes urticaria. EpiPen prescribed. Allergy bracelet worn.',
 '2020-03-01',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001')),

((SELECT id FROM patients WHERE patient_id='PAT-0011'),'hospital_visit',
 'AF Review — Rate Controlled',
 'Ventricular rate 78 bpm. INR 2.4 (therapeutic). Thyroid function improving. Carbimazole dose reduced. Echocardiogram: LA size normalising.',
 '2025-03-22',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'))
ON CONFLICT DO NOTHING;

-- PAT-0012: Kiran Desai
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0012'),'diagnosis',
 'Plaque Psoriasis Diagnosed',
 'Well-demarcated erythematous plaques with silvery scales on elbows, knees and scalp. PASI score 16 (moderate-to-severe). Dermatology referral.',
 '2018-04-25',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0010'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0010')),

((SELECT id FROM patients WHERE patient_id='PAT-0012'),'lab_report',
 'Psoriatic Arthritis Screening',
 'Joint X-rays: no erosions. Rheumatoid factor: negative. CRP: 12 mg/L. No evidence of psoriatic arthritis at this time. Annual rheumatology review advised.',
 '2021-09-10',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0010'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0010')),

((SELECT id FROM patients WHERE patient_id='PAT-0012'),'lab_report',
 'MTX Monitoring — LFT',
 'ALT: 32 U/L, AST: 28 U/L, ALP: 72 U/L. CBC: WBC 5.2, Hb 13.8, Platelets 210. Methotrexate monitoring within safe limits.',
 '2023-06-18',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0010'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0010')),

((SELECT id FROM patients WHERE patient_id='PAT-0012'),'prescription',
 'Systemic Psoriasis Treatment',
 'Methotrexate 15 mg weekly. Folic acid 5 mg (day after MTX). Clobetasol 0.05% ointment for scalp BD for 2 weeks then maintenance. Avoid alcohol.',
 '2023-06-20',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0010'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0010')),

((SELECT id FROM patients WHERE patient_id='PAT-0012'),'hospital_visit',
 'Dermatology Review — Good Response',
 'PASI score reduced to 4 (90% improvement). Patient satisfied. Continue maintenance Methotrexate. 6-monthly review. Screen for TB before biologic if needed.',
 '2025-04-07',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0010'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0010'))
ON CONFLICT DO NOTHING;

-- PAT-0013: Sunita Garg
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0013'),'diagnosis',
 'COPD — GOLD Stage 2',
 '30 pack-year smoking history. Dyspnoea on exertion, chronic productive cough. Spirometry: FEV1 62% predicted, FEV1/FVC 0.61. GOLD Stage 2 COPD.',
 '2016-07-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006')),

((SELECT id FROM patients WHERE patient_id='PAT-0013'),'allergy_note',
 'Contrast Dye Allergy',
 'Hives and hypotension following IV contrast for CT scan (2014). Documented contrast allergy. Pre-medicate with steroids + antihistamine if IV contrast required.',
 '2016-07-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006')),

((SELECT id FROM patients WHERE patient_id='PAT-0013'),'hospital_visit',
 'Acute Exacerbation of COPD',
 'Increased breathlessness, purulent sputum, fever. CXR: hyperinflated lungs, no consolidation. IV Methylprednisolone, nebulisers, oxygen. Discharged day 5.',
 '2023-02-20',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006')),

((SELECT id FROM patients WHERE patient_id='PAT-0013'),'lab_report',
 'PFT & ABG Assessment',
 'Post-BD FEV1: 59% predicted. ABG: pH 7.38, PaO2 72 mmHg, PaCO2 46. Mild hypoxaemia. Walking oxygen saturation drops to 88% on exertion.',
 '2024-09-18',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006')),

((SELECT id FROM patients WHERE patient_id='PAT-0013'),'prescription',
 'COPD Maintenance Therapy',
 'Tiotropium 18 mcg via HandiHaler OD. Formoterol/Budesonide 12/400 mcg BD. Rescue salbutamol PRN. Smoking cessation support. Pulmonary rehabilitation enrolled.',
 '2025-01-08',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0006'))
ON CONFLICT DO NOTHING;

-- PAT-0014: Vivek Malhotra
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0014'),'hospital_visit',
 'Sports Injury — Right Knee',
 'ACL tear confirmed on MRI following football match. Orthopaedic referral for arthroscopic reconstruction. Physiotherapy initiated for muscle strengthening.',
 '2022-03-09',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005')),

((SELECT id FROM patients WHERE patient_id='PAT-0014'),'surgery',
 'Arthroscopic ACL Reconstruction',
 'Right knee ACL reconstruction using patellar tendon autograft. Procedure uneventful. Post-op rehabilitation protocol commenced.',
 '2022-05-18',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005')),

((SELECT id FROM patients WHERE patient_id='PAT-0014'),'vaccination',
 'Tetanus Booster',
 'Tdap booster administered following soft tissue injury. Last tetanus >10 years ago. No adverse reaction.',
 '2022-03-09',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005')),

((SELECT id FROM patients WHERE patient_id='PAT-0014'),'lab_report',
 'Pre-Operative Bloods',
 'Hb: 14.6 g/dL. Platelets: 240. PT: 12.8s, APTT: 29s. Glucose: 92 mg/dL. ECG: normal sinus rhythm. Fit for general anaesthesia.',
 '2022-05-10',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005')),

((SELECT id FROM patients WHERE patient_id='PAT-0014'),'hospital_visit',
 'Post-Op Physiotherapy Review',
 'Knee flexion 0-110°. Quadriceps strength 80% compared to contralateral limb. Return to light jogging cleared. Sport-specific training in 4 weeks.',
 '2023-01-22',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0005'))
ON CONFLICT DO NOTHING;

-- PAT-0015: Rekha Joshi
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0015'),'diagnosis',
 'Chronic Migraine & Depression',
 'Headaches >15 days/month for >3 months. PHQ-9 score 14 (moderate depression). Dual diagnosis: chronic migraine and major depressive disorder.',
 '2020-11-30',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0015'),'allergy_note',
 'Latex Allergy',
 'Contact dermatitis with latex gloves (occupational). Patch test positive. Healthcare workers informed. Nitrile gloves required for all procedures.',
 '2021-02-08',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0015'),'prescription',
 'Migraine Prophylaxis & Antidepressant',
 'Topiramate 50 mg ON (migraine prophylaxis). Sertraline 50 mg OD (depression). Sumatriptan 50 mg PRN for acute attacks (max 2/week). Headache diary recommended.',
 '2021-03-01',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0015'),'hospital_visit',
 'Psychiatry Review — Improved Mood',
 'PHQ-9 score 7 (mild). Sleep improved. Headache frequency reduced to 8/month. Sertraline dose maintained. CBT sessions ongoing. Review in 3 months.',
 '2023-09-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0015'),'lab_report',
 'Topiramate Metabolic Monitoring',
 'Serum bicarbonate: 20 mEq/L (mildly low — topiramate effect). Renal function normal. No kidney stones on ultrasound. Increase fluid intake advised.',
 '2025-02-26',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'))
ON CONFLICT DO NOTHING;

-- PAT-0016: Praveen Kumar
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0016'),'diagnosis',
 'Benign Prostatic Hyperplasia',
 'Weak urinary stream, nocturia x3, post-void residue 85 mL. PSA: 2.8 ng/mL. TRUS: prostate volume 52 cc. BPH confirmed. Alpha-blocker initiated.',
 '2019-05-20',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009')),

((SELECT id FROM patients WHERE patient_id='PAT-0016'),'lab_report',
 'PSA Monitoring — Annual',
 'PSA: 3.1 ng/mL (stable, no significant rise). Prostate volume 58 cc. IPSS score 14. Finasteride added to reduce prostate volume long-term.',
 '2022-07-11',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009')),

((SELECT id FROM patients WHERE patient_id='PAT-0016'),'prescription',
 'BPH Dual Therapy',
 'Tamsulosin 0.4 mg OD at bedtime. Finasteride 5 mg OD. Telmisartan 40 mg OD for hypertension. Annual PSA, renal function, and post-void residue check.',
 '2022-07-12',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009')),

((SELECT id FROM patients WHERE patient_id='PAT-0016'),'hospital_visit',
 'Urology Review',
 'IPSS score improved to 9. Post-void residue 40 mL. Blood pressure 132/82 on Telmisartan. No urological emergency. Continue dual therapy.',
 '2024-10-05',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009')),

((SELECT id FROM patients WHERE patient_id='PAT-0016'),'vaccination',
 'Herpes Zoster Vaccine',
 'Shingrix (RZV) dose 1 administered (age ≥60 indication). 2nd dose scheduled in 3 months. Patient counselled on expected mild injection site reactions.',
 '2025-01-15',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'))
ON CONFLICT DO NOTHING;

-- PAT-0017: Nandita Roy
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0017'),'diagnosis',
 'Polycystic Ovary Syndrome',
 'Irregular cycles (oligomenorrhoea), acne, hirsutism. Pelvic USG: polycystic ovarian morphology. Testosterone: 68 ng/dL. HOMA-IR 3.2. PCOS confirmed.',
 '2021-06-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0008'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0008')),

((SELECT id FROM patients WHERE patient_id='PAT-0017'),'allergy_note',
 'Penicillin Allergy',
 'Amoxicillin caused rash and pruritus. Documented penicillin allergy. Use azithromycin or cephalosporins (with caution) for respiratory infections.',
 '2021-06-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0008'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0008')),

((SELECT id FROM patients WHERE patient_id='PAT-0017'),'lab_report',
 'Hormonal Profile & Metabolic Panel',
 'FSH: 6.8, LH: 14.2, LH:FSH ratio 2.1. AMH: 8.4 ng/mL (elevated). Fasting insulin: 22 mIU/L. HbA1c: 5.7% (pre-diabetic range). Lipids normal.',
 '2022-09-28',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0008'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0008')),

((SELECT id FROM patients WHERE patient_id='PAT-0017'),'prescription',
 'PCOS Management',
 'Metformin 500 mg BD (insulin sensitiser). Spironolactone 50 mg OD (anti-androgen for acne/hirsutism). OCP for cycle regulation. Regular weight and BP monitoring.',
 '2022-10-05',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0008'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0008')),

((SELECT id FROM patients WHERE patient_id='PAT-0017'),'hospital_visit',
 'Gynaecology Follow-up',
 'Cycles now every 35 days (improved). Acne 70% reduced. Weight stable. No fertility concerns raised at this visit. Continue current regimen. Annual review.',
 '2025-05-20',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0008'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0008'))
ON CONFLICT DO NOTHING;

-- PAT-0018: Amar Singh
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0018'),'diagnosis',
 'Parkinson Disease Diagnosed',
 'Right-hand tremor at rest, bradykinesia, rigidity. DaTscan: reduced dopamine uptake in left striatum. Idiopathic Parkinson disease. Levodopa therapy initiated.',
 '2018-08-22',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0018'),'prescription',
 'Parkinson Medication Regimen',
 'Levodopa-Carbidopa 100/25 mg TID (taken 30 min before meals). Pramipexole 0.5 mg TID (dopamine agonist). Amlodipine 5 mg OD for hypertension.',
 '2019-02-11',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0018'),'hospital_visit',
 'Neurology Review — Motor Fluctuations',
 'Experiencing "wearing-off" phenomenon. End-of-dose deterioration. Levodopa frequency increased to QID. DBS candidacy evaluation initiated.',
 '2022-11-03',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0018'),'lab_report',
 'Parkinson Neuropsychiatric Screen',
 'MMSE: 26/30 (mild cognitive impairment). GDS-15: 6 (borderline depression). Olfaction markedly reduced (hyposmia). Refer to geriatric psychiatry.',
 '2024-04-18',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0018'),'hospital_visit',
 'Physiotherapy & Fall Prevention',
 'Two falls in past 6 months. Berg Balance Scale 38/56. Gait training and balance exercises programme started. Walking aid (tripod stick) recommended.',
 '2025-04-02',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'))
ON CONFLICT DO NOTHING;

-- PAT-0019: Geeta Pandey
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0019'),'diagnosis',
 'Systemic Lupus Erythematosus',
 'Malar rash, photosensitivity, joint pains, and oral ulcers. ANA titre 1:320 (speckled). Anti-dsDNA positive. C3: 64 mg/dL (low). SLE confirmed. SLICC criteria met.',
 '2016-12-19',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0019'),'allergy_note',
 'Aspirin & NSAID Allergy',
 'Aspirin triggers lupus flare (drug-induced lupus exacerbation). Ibuprofen causes severe rash. Documented. Use paracetamol for analgesia only.',
 '2017-01-05',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0019'),'lab_report',
 'SLE Activity Markers',
 'Anti-dsDNA: 120 IU/mL (elevated). C3: 72 mg/dL, C4: 10 mg/dL (reduced). Urine PCR 280 mg/g (lupus nephritis screen positive). Renal biopsy recommended.',
 '2023-07-08',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0019'),'prescription',
 'SLE Immunosuppressive Regimen',
 'Hydroxychloroquine 400 mg OD (all SLE patients). Prednisolone 10 mg OD (reducing course). Calcium carbonate 500 mg BD (steroid bone protection). Sun protection mandatory.',
 '2023-07-15',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004')),

((SELECT id FROM patients WHERE patient_id='PAT-0019'),'hospital_visit',
 'Rheumatology Review — Stable',
 'SLEDAI score 4 (mild activity). Urine PCR normalised. Prednisolone tapered to 5 mg. Hydroxychloroquine eye check due. Continue monitoring.',
 '2025-06-11',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0004'))
ON CONFLICT DO NOTHING;

-- PAT-0020: Siddharth Chandra
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0020'),'diagnosis',
 'Type 1 Diabetes Mellitus',
 'Polyuria, polydipsia, weight loss for 2 months. Glucose 388 mg/dL. C-peptide: 0.1 ng/mL (low). GAD65 antibody positive. Type 1 DM confirmed. Insulin started immediately.',
 '2004-03-10',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0020'),'allergy_note',
 'Iodine Contrast Allergy',
 'Urticarial reaction with iodine-based contrast dye. Documented. Pre-medicate with steroids + antihistamine if IV contrast required. Gadolinium MRI contrast safe.',
 '2010-06-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0020'),'lab_report',
 'Continuous Glucose & HbA1c Review',
 'HbA1c: 7.2% (well-controlled). Time-in-range 68%. Kidney function normal. Ophthalmology: no retinopathy. Foot exam: protective sensation intact.',
 '2023-11-22',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0020'),'prescription',
 'Basal-Bolus Insulin Regimen',
 'Insulin Aspart 12 units TID with meals. Insulin Glargine 24 units OD at bedtime. Glucose monitoring 4 times daily. Sick day rules and hypoglycaemia management plan provided.',
 '2024-01-08',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0020'),'hospital_visit',
 'Diabetology Annual Review',
 'No complications detected. Patient managing well with basal-bolus. CGM (FreeStyle Libre) discussed and prescribed. Annual dilated eye exam and microalbumin check booked.',
 '2025-05-30',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'))
ON CONFLICT DO NOTHING;

-- PAT-0021: Pooja Menon
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0021'),'diagnosis',
 'Irritable Bowel Syndrome — Mixed Type',
 'Alternating constipation and diarrhoea, abdominal bloating, cramping for 2 years. Colonoscopy: normal. Coeliac screen negative. Rome IV criteria met: IBS-M.',
 '2021-04-30',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007')),

((SELECT id FROM patients WHERE patient_id='PAT-0021'),'lab_report',
 'GI Exclusion Panel',
 'Coeliac antibodies: negative. H. pylori breath test: negative. Faecal calprotectin: 28 mcg/g (normal — excludes IBD). Thyroid: normal. IBS confirmed.',
 '2021-05-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007')),

((SELECT id FROM patients WHERE patient_id='PAT-0021'),'allergy_note',
 'Metronidazole Allergy',
 'Severe nausea and disulfiram-like reaction with metronidazole. Documented. Use tinidazole or alternatives for anaerobic/protozoal infections.',
 '2022-07-22',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007')),

((SELECT id FROM patients WHERE patient_id='PAT-0021'),'prescription',
 'IBS Treatment Plan',
 'Mebeverine 135 mg TID 20 min before meals (antispasmodic). Probiotics (Lactobacillus acidophilus 10 billion CFU) OD. Low-FODMAP diet advice provided. Stress management counselling.',
 '2022-08-01',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007')),

((SELECT id FROM patients WHERE patient_id='PAT-0021'),'hospital_visit',
 'GI Review — Symptom Improvement',
 'Symptom frequency reduced by 60% on low-FODMAP diet. Bristol Stool Scale improved. Bloating mild. Continue Mebeverine PRN. Reassurance provided. Annual review.',
 '2024-11-12',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0007'))
ON CONFLICT DO NOTHING;

-- PAT-0022: Harish Tiwari
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0022'),'diagnosis',
 'Gout — First Attack',
 'Acute monoarthritis of right first MTP joint. Uric acid: 9.4 mg/dL. Joint aspiration: monosodium urate crystals. Acute gout confirmed. Colchicine given.',
 '2020-07-19',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009')),

((SELECT id FROM patients WHERE patient_id='PAT-0022'),'lab_report',
 'Uric Acid & Renal Screen',
 'Uric acid: 8.8 mg/dL (persistent elevation). Creatinine: 1.1 mg/dL. eGFR: 72. 24-hour urine uric acid: 680 mg (overproducer pattern). Xanthine oxidase inhibitor indicated.',
 '2021-09-06',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009')),

((SELECT id FROM patients WHERE patient_id='PAT-0022'),'prescription',
 'Urate-Lowering Therapy',
 'Allopurinol 300 mg OD (titrate to target uric acid <6 mg/dL). Febuxostat 80 mg OD if allopurinol inadequate. Losartan 50 mg OD (uricosuric + antihypertensive). Low-purine diet.',
 '2021-09-10',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009')),

((SELECT id FROM patients WHERE patient_id='PAT-0022'),'lab_report',
 'Uric Acid Target Achievement',
 'Uric acid: 5.6 mg/dL (target achieved). No acute attacks in 18 months. Renal function stable. Continue dual xanthine oxidase inhibitor + losartan. Annual review.',
 '2024-02-28',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009')),

((SELECT id FROM patients WHERE patient_id='PAT-0022'),'hospital_visit',
 'Joint Health Review',
 'No tophi palpable. No joint erosions on X-ray. Uric acid 5.4 mg/dL. BP 126/80. Patient very compliant. Reduce allopurinol to 200 mg if uric acid <5 on next check.',
 '2025-07-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'))
ON CONFLICT DO NOTHING;

-- PAT-0023: Shweta Bansal
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0023'),'diagnosis',
 'Iron Deficiency Anaemia & Hypothyroidism',
 'Fatigue, hair loss, pallor. Hb: 9.4 g/dL. MCV: 72 fL. Ferritin: 6 ng/mL. TSH: 8.2 mIU/L. Dual diagnosis: IDA and hypothyroidism. Treatment started.',
 '2022-03-28',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0023'),'allergy_note',
 'Shellfish & Penicillin Allergy',
 'Shellfish causes acute urticaria. Amoxicillin caused anaphylactic shock (2018). Both documented as severe allergies. EpiPen prescribed.',
 '2022-03-28',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0023'),'prescription',
 'IDA & Hypothyroid Treatment',
 'Ferrous sulphate 200 mg BD (take with vitamin C, separate from levothyroxine by 4 hours). Levothyroxine 75 mcg OD on empty stomach. Recheck TFT and CBC in 8 weeks.',
 '2022-04-02',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0023'),'lab_report',
 'Response to Treatment',
 'Hb: 12.6 g/dL (improved). Ferritin: 28 ng/mL. TSH: 2.4 mIU/L (normalised). Reticulocyte count 3.2% (active erythropoiesis). Continue iron for 3 more months.',
 '2022-09-14',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002')),

((SELECT id FROM patients WHERE patient_id='PAT-0023'),'hospital_visit',
 'Annual Thyroid & Haematology Check',
 'TSH 2.1 mIU/L. Hb 13.2 g/dL. Ferritin 42 ng/mL. Both conditions well-controlled. Continue levothyroxine 75 mcg, ferrous sulphate discontinued (repleted). Annual review.',
 '2025-01-09',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0002'))
ON CONFLICT DO NOTHING;

-- PAT-0024: Manoj Kulkarni
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0024'),'diagnosis',
 'Heart Failure with Reduced EF & AF',
 'Dyspnoea on minimal exertion, bilateral ankle oedema, orthopnoea. Echo: EF 32%, dilated LV. ECG: AF with rapid ventricular rate. HFrEF + AF. Admission for stabilisation.',
 '2017-11-05',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001')),

((SELECT id FROM patients WHERE patient_id='PAT-0024'),'hospital_visit',
 'Acute Decompensated Heart Failure',
 'Increased fluid retention. Weight +4 kg in 1 week. IV furosemide given. Diuresis achieved: 3.2 L. Bisoprolol and ACE inhibitor optimised. Echo: EF improved to 38%.',
 '2023-03-18',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001')),

((SELECT id FROM patients WHERE patient_id='PAT-0024'),'lab_report',
 'BNP & Cardiac Labs',
 'BNP: 820 pg/mL (elevated). Creatinine: 1.4 mg/dL. eGFR: 52. Potassium: 4.1 mEq/L. INR on Warfarin: 1.8 (subtherapeutic — switched to Apixaban).',
 '2024-08-22',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001')),

((SELECT id FROM patients WHERE patient_id='PAT-0024'),'prescription',
 'Optimised Heart Failure Regimen',
 'Furosemide 40 mg OD, Spironolactone 25 mg OD, Bisoprolol 5 mg OD, Apixaban 5 mg BD. Daily weight monitoring. Fluid restriction 1.5 L/day. Sodium restriction.',
 '2024-08-25',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001')),

((SELECT id FROM patients WHERE patient_id='PAT-0024'),'hospital_visit',
 'Cardiology 3-Month Review',
 'NYHA Class II (improved from III). BNP 420 pg/mL (improved). Weight stable. No hospitalisation since last visit. ICD implantation discussed given EF <35% history.',
 '2025-07-08',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0001'))
ON CONFLICT DO NOTHING;

-- PAT-0025: Kaveri Nair
INSERT INTO clinical_records (patient_id, record_type, title, description, date, verified, verified_by, created_by) VALUES
((SELECT id FROM patients WHERE patient_id='PAT-0025'),'vaccination',
 'Routine Vaccination — HPV Series',
 'HPV vaccine (Gardasil 9) dose 1 of 3 administered. Part of preventive care programme. No adverse reactions. Dose 2 due in 2 months.',
 '2024-03-10',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009')),

((SELECT id FROM patients WHERE patient_id='PAT-0025'),'vaccination',
 'HPV Vaccine Dose 2',
 'Gardasil 9 dose 2 of 3 completed. No adverse effects. Dose 3 due in 4 months.',
 '2024-05-12',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009')),

((SELECT id FROM patients WHERE patient_id='PAT-0025'),'vaccination',
 'HPV Vaccine Dose 3',
 'Gardasil 9 series complete. 3/3 doses administered. Patient fully immunised. No further HPV doses required.',
 '2024-09-08',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009')),

((SELECT id FROM patients WHERE patient_id='PAT-0025'),'lab_report',
 'Preventive Health Screening',
 'CBC: Hb 12.8 g/dL (borderline low). Ferritin: 18 ng/mL (low normal). TSH: 2.1 mIU/L. Glucose 88 mg/dL. Lipids within normal limits. Dietary iron and vitamin C advice given.',
 '2024-09-10',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009')),

((SELECT id FROM patients WHERE patient_id='PAT-0025'),'hospital_visit',
 'Well Woman Screening',
 'Pap smear: normal (NILM). Breast exam: no lumps. BMI 22.1. BP 110/70. Vitamins and iron-rich diet reinforced. Next cervical screening in 3 years.',
 '2025-03-18',TRUE,(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'),(SELECT id FROM doctors WHERE registration_number='DOC-REG-0009'))
ON CONFLICT DO NOTHING;

COMMIT;