'use server'

import { z } from 'zod'
import { createWorkoutWithExercises } from '@/data/workouts'

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
