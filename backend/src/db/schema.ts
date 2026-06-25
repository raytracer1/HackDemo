import { pgTable, uuid, text, integer, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';

export const demoStatusEnum = pgEnum('demo_status', [
  'uploading',
  'processing_narration',
  'processing_audio',
  'completed',
  'failed',
]);

export const demos = pgTable('demos', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull().default(''),
  status: demoStatusEnum('status').notNull().default('uploading'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const steps = pgTable('steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  demo_id: uuid('demo_id')
    .notNull()
    .references(() => demos.id, { onDelete: 'cascade' }),
  index: integer('index').notNull(),
  description: text('description').notNull(),
  narration: text('narration'),
  screenshot_key: text('screenshot_key').notNull(),
  audio_key: text('audio_key'),
  duration_ms: integer('duration_ms'),
  start_time: integer('start_time').notNull(),
  end_time: integer('end_time').notNull(),
  page_url: text('page_url').notNull().default(''),
  page_title: text('page_title').notNull().default(''),
  highlights: jsonb('highlights').default('[]'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
