// Drizzle ORM Schema
import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const researchSessions = pgTable('research_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyName: text('company_name').notNull(),
  officialName: text('official_name'),
  ticker: text('ticker'),
  exchange: text('exchange'),
  status: text('status').notNull().default('running'), // 'running' | 'done' | 'error'
  verdict: text('verdict'), // 'INVEST' | 'PASS' | 'WATCH'
  confidence: integer('confidence'),
  report: jsonb('report'), // Full ResearchResult JSON
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ResearchSession = typeof researchSessions.$inferSelect;
export type NewResearchSession = typeof researchSessions.$inferInsert;
