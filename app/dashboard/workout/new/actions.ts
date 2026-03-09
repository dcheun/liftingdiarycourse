'use server'

import { z } from 'zod'
import { createWorkoutWithExercises, updateWorkoutWithExercises } from '@/data/workouts'

// Define set schema
const setSchema = z.object({
  weight: z.number().positive().optional(),
  reps: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
  order: z.number().int().optional(),
})

// Define exercise schema
const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  order: z.number().int().optional(),
  sets: z.array(setSchema),
})

// Define workout schema
const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  duration: z.number().int().positive().optional(),
  exercises: z.array(exerciseSchema).min(1, 'At least one exercise is required'),
})

// Input type
interface CreateWorkoutActionInput {
  name: string
  date: string
  duration?: number
  exercises: {
    name: string
    order?: number
    sets: {
      weight?: number
      reps?: number
      duration?: number
      order?: number
    }[]
  }[]
}

export async function createWorkoutAction(input: CreateWorkoutActionInput) {
  try {
    // Validate all input
    const validated = createWorkoutSchema.parse(input)

    // Call data layer helper
    const workout = await createWorkoutWithExercises(validated)

    return { success: true, workout }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      }
    }

    console.error('Create workout error:', error)
    return { success: false, error: 'Failed to create workout' }
  }
}

// Define update input types (all fields optional for partial updates)
interface UpdateSetInput {
  id?: number
  weight?: number
  reps?: number
  duration?: number
  order?: number
}

interface UpdateExerciseInput {
  id?: number
  name: string
  order?: number
  sets: UpdateSetInput[]
}

export interface UpdateWorkoutInput {
  id: number
  name: string
  date: string
  duration?: number
  exercises: UpdateExerciseInput[]
}

// Re-export for client use
export type { UpdateWorkoutWithExercisesInput } from '@/data/workouts'

// Update an existing workout
export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  try {
    // Validate input
    const setSchema = z.object({
      id: z.number().positive().optional(),
      weight: z.number().positive().optional(),
      reps: z.number().int().positive().optional(),
      duration: z.number().int().positive().optional(),
      order: z.number().int().optional(),
    })

    const exerciseSchema = z.object({
      id: z.number().positive().optional(),
      name: z.string().min(1, 'Exercise name is required'),
      order: z.number().int().optional(),
      sets: z.array(setSchema),
    })

    const updateWorkoutSchema = z.object({
      id: z.number().positive(),
      name: z.string().min(1, 'Workout name is required').max(100),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
      duration: z.number().int().positive().optional(),
      exercises: z.array(exerciseSchema).min(1, 'At least one exercise is required'),
    })

    const validated = updateWorkoutSchema.parse(input)

    // Call data layer helper
    const result = await updateWorkoutWithExercises(validated)

    return { success: true, workout: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      }
    }

    console.error('Update workout error:', error)
    return { success: false, error: 'Failed to update workout' }
  }
}
