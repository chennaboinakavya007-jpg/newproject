import { boolean, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const studentProfilesTable = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default(""),
  branch: text("branch").notNull().default("CSE"),
  year: text("year").notNull().default("3rd Year"),
  interests: text("interests")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
});

export const learningTasksTable = pgTable("learning_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  category: text("category").notNull().default("Learning"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const savedProjectsTable = pgTable("saved_projects", {
  projectId: text("project_id").primaryKey(),
  savedAt: timestamp("saved_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
