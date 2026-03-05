import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

// Workouts table
export const workouts = pgTable('workouts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  date: timestamp('date').notNull(),
  duration: integer('duration'), // in minutes
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Exercises table
export const exercises = pgTable('exercises', {
  id: serial('id').primaryKey(),
  workoutId: integer('workout_id')
    .notNull()
    .references(() => workouts.id),
  name: text('name').notNull(),
  order: integer('order'), // to maintain the sequence of exercises in a workout
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Sets table
export const sets = pgTable('sets', {
  id: serial('id').primaryKey(),
  exerciseId: integer('exercise_id')
    .notNull()
    .references(() => exercises.id),
  weight: integer('weight'), // in kg or lbs
  reps: integer('reps'),
  duration: integer('duration'), // in seconds
  order: integer('order'), // to maintain the sequence of sets in an exercise
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
