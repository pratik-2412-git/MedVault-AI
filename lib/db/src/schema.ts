/**
 * lib/db/src/schema.ts
 *
 * Drizzle ORM table definitions for MedVault AI.
 * Compatible with drizzle-orm 0.31.x + @types/pg 8.23.x
 */

import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

// ─── Facilities ───────────────────────────────────────────────────────────────

export const facilitiesTable = pgTable('facilities', {
  id:        serial('id').primaryKey(),
  name:      text('name').notNull(),
  city:      text('city').notNull(),
  state:     text('state').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Patients ─────────────────────────────────────────────────────────────────

export const patientsTable = pgTable('patients', {
  id:                serial('id').primaryKey(),
  patientId:         text('patient_id').notNull().unique(),
  name:              text('name').notNull(),
  age:               integer('age').notNull(),
  gender:            text('gender').notNull(),
  healthId:          text('health_id').notNull().unique(),
  allergies:         text('allergies').array().notNull().default([]),
  chronicConditions: text('chronic_conditions').array().notNull().default([]),
  currentMedicines:  text('current_medicines').array().notNull().default([]),
  facilityId:        integer('facility_id').references(() => facilitiesTable.id),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Doctors ──────────────────────────────────────────────────────────────────

export const doctorsTable = pgTable('doctors', {
  id:                 serial('id').primaryKey(),
  registrationNumber: text('registration_number').notNull().unique(),
  name:               text('name').notNull(),
  specialization:     text('specialization').notNull(),
  facilityId:         integer('facility_id').references(() => facilitiesTable.id),
  email:              text('email').notNull().unique(),
  role:               text('role').notNull().default('doctor'),
  verified:           boolean('verified').notNull().default(true),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Clinical Records ─────────────────────────────────────────────────────────

export const clinicalRecordsTable = pgTable('clinical_records', {
  id:          serial('id').primaryKey(),
  patientId:   integer('patient_id').notNull().references(() => patientsTable.id),
  recordType:  text('record_type').notNull(),
  title:       text('title').notNull(),
  description: text('description').notNull(),
  date:        date('date').notNull(),
  verified:    boolean('verified').notNull().default(false),
  verifiedBy:  integer('verified_by').references(() => doctorsTable.id),
  createdBy:   integer('created_by').references(() => doctorsTable.id),
  updatedBy:   integer('updated_by').references(() => doctorsTable.id),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt:   timestamp('deleted_at', { withTimezone: true }),
});

// ─── Documents ────────────────────────────────────────────────────────────────

export const documentsTable = pgTable('documents', {
  id:         serial('id').primaryKey(),
  recordId:   integer('record_id').notNull().references(() => clinicalRecordsTable.id),
  fileName:   text('file_name').notNull(),
  fileUrl:    text('file_url').notNull(),
  uploadedBy: integer('uploaded_by').references(() => doctorsTable.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── AI Summaries ─────────────────────────────────────────────────────────────

export const aiSummariesTable = pgTable('ai_summaries', {
  id:          serial('id').primaryKey(),
  patientId:   integer('patient_id').notNull().references(() => patientsTable.id),
  generatedBy: text('generated_by').notNull(),
  claims:      jsonb('claims'),
  disclaimer:  text('disclaimer'),
  recordCount: integer('record_count').notNull().default(0),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const auditLogsTable = pgTable('audit_logs', {
  id:        serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patientsTable.id),
  event:     text('event').notNull(),
  actor:     text('actor').notNull(),
  purpose:   text('purpose'),
  tone:      text('tone').notNull().default('info'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Consents ─────────────────────────────────────────────────────────────────

export const consentsTable = pgTable('consents', {
  id:            serial('id').primaryKey(),
  patientId:     integer('patient_id').notNull().references(() => patientsTable.id),
  patientName:   text('patient_name').notNull(),
  provider:      text('provider').notNull(),
  purpose:       text('purpose').notNull(),
  sharedRecords: text('shared_records').array().notNull().default([]),
  durationDays:  integer('duration_days').notNull().default(30),
  status:        text('status').notNull().default('Pending'),
  requestedAt:   timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt:     timestamp('expires_at', { withTimezone: true }),
});