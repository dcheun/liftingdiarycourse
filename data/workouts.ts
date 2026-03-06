import { db } from '@/lib/db'
import { exercises, sets, workouts } from '@/lib/db/schema'
import { currentUser } from '@clerk/nextjs/server'
import { and, desc, eq, inArray } from 'drizzle-orm'

// Flattened workout entry for UI display
export interface WorkoutEntry {
  id: number
  date: string
  exercise: string
  sets: number
  reps: number
  weight: number
}

// Input types for creating workouts
export interface CreateWorkoutInput {
  name: string
  date: string
  duration?: number
}

export interface CreateExerciseInput {
  name: string
  order?: number
}

export interface CreateSetInput {
  weight?: number
  reps?: number
  duration?: number
  order?: number
}

export interface CreateWorkoutWithExercisesInput extends CreateWorkoutInput {
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

interface SetData {
  id: number
  exerciseId: number
  weight: number | null
  reps: number | null
  duration: number | null
  order: number | null
}

// Get workouts for the current user
export async function getUserWorkouts() {
  const user = await currentUser()
  if (!user) {
    return []
  }

  // Get workouts for the current user
  const userWorkouts = await db
    .select({
      id: workouts.id,
      name: workouts.name,
      date: workouts.date,
      duration: workouts.duration,
    })
    .from(workouts)
    .where(eq(workouts.userId, user.id))
    .orderBy(desc(workouts.date))

  // Get all exercises for these workouts
  const workoutIds = userWorkouts.map((w) => w.id)
  if (workoutIds.length === 0) {
    return userWorkouts.map((w) => ({ ...w, exercises: [] }))
  }

  const allExercises = await db
    .select({
      id: exercises.id,
      workoutId: exercises.workoutId,
      name: exercises.name,
      order: exercises.order,
    })
    .from(exercises)
    .where(inArray(exercises.workoutId, workoutIds))

  // Get all sets for these exercises
  const exerciseIds = allExercises.map((e) => e.id)
  const allSets: SetData[] =
    exerciseIds.length > 0
      ? await db
          .select({
            id: sets.id,
            exerciseId: sets.exerciseId,
            weight: sets.weight,
            reps: sets.reps,
            duration: sets.duration,
            order: sets.order,
          })
          .from(sets)
          .where(inArray(sets.exerciseId, exerciseIds))
      : []

  // Group sets by exercise
  const setsByExercise = new Map<number, SetData[]>()
  for (const set of allSets) {
    if (!setsByExercise.has(set.exerciseId)) {
      setsByExercise.set(set.exerciseId, [])
    }
    setsByExercise.get(set.exerciseId)!.push(set)
  }

  // Group exercises by workout
  interface ExerciseWithSets {
    id: number
    workoutId: number
    name: string
    order: number | null
    sets: SetData[]
  }

  const exercisesByWorkout = new Map<number, ExerciseWithSets[]>()
  for (const exercise of allExercises) {
    if (!exercisesByWorkout.has(exercise.workoutId)) {
      exercisesByWorkout.set(exercise.workoutId, [])
    }
    const exerciseWithSets: ExerciseWithSets = {
      ...exercise,
      sets: setsByExercise.get(exercise.id) || [],
    }
    exercisesByWorkout.get(exercise.workoutId)!.push(exerciseWithSets)
  }

  // Combine workouts with their exercises
  return userWorkouts.map((workout) => ({
    ...workout,
    exercises: exercisesByWorkout.get(workout.id) || [],
  }))
}

// Get flattened workout entries for the dashboard UI
export async function getUserWorkoutEntries(): Promise<WorkoutEntry[]> {
  const nestedWorkouts = await getUserWorkouts()

  const entries: WorkoutEntry[] = []

  for (const workout of nestedWorkouts) {
    for (const exercise of workout.exercises) {
      const exerciseSets = exercise.sets || []
      const setCount = exerciseSets.length
      const avgReps =
        setCount > 0
          ? Math.round(
              exerciseSets.reduce((sum: number, s: SetData) => sum + (s.reps || 0), 0) / setCount,
            )
          : 0
      const maxWeight =
        setCount > 0
          ? Math.max(...exerciseSets.map((s: SetData) => s.weight || 0))
          : 0

      entries.push({
        id: exercise.id,
        date: workout.date.toISOString().split('T')[0],
        exercise: exercise.name,
        sets: setCount,
        reps: avgReps,
        weight: maxWeight,
      })
    }
  }

  return entries
}

// Get workouts for a specific date for the current user
export async function getUserWorkoutsByDate(date: string) {
  const user = await currentUser()
  if (!user) {
    return []
  }

  // Get workouts for the current user on the specific date
  const userWorkouts = await db
    .select({
      id: workouts.id,
      name: workouts.name,
      date: workouts.date,
      duration: workouts.duration,
    })
    .from(workouts)
    .where(and(eq(workouts.userId, user.id), eq(workouts.date, new Date(date))))
    .orderBy(desc(workouts.date))

  // Get all exercises for these workouts
  const workoutIds = userWorkouts.map((w) => w.id)
  if (workoutIds.length === 0) {
    return userWorkouts.map((w) => ({ ...w, exercises: [] }))
  }

  const allExercises = await db
    .select({
      id: exercises.id,
      workoutId: exercises.workoutId,
      name: exercises.name,
      order: exercises.order,
    })
    .from(exercises)
    .where(inArray(exercises.workoutId, workoutIds))

  // Get all sets for these exercises
  const exerciseIds = allExercises.map((e) => e.id)
  const allSets: SetData[] =
    exerciseIds.length > 0
      ? await db
          .select({
            id: sets.id,
            exerciseId: sets.exerciseId,
            weight: sets.weight,
            reps: sets.reps,
            duration: sets.duration,
            order: sets.order,
          })
          .from(sets)
          .where(inArray(sets.exerciseId, exerciseIds))
      : []

  // Group sets by exercise
  const setsByExercise = new Map<number, SetData[]>()
  for (const set of allSets) {
    if (!setsByExercise.has(set.exerciseId)) {
      setsByExercise.set(set.exerciseId, [])
    }
    setsByExercise.get(set.exerciseId)!.push(set)
  }

  // Group exercises by workout
  interface ExerciseWithSets {
    id: number
    workoutId: number
    name: string
    order: number | null
    sets: SetData[]
  }

  const exercisesByWorkout = new Map<number, ExerciseWithSets[]>()
  for (const exercise of allExercises) {
    if (!exercisesByWorkout.has(exercise.workoutId)) {
      exercisesByWorkout.set(exercise.workoutId, [])
    }
    const exerciseWithSets: ExerciseWithSets = {
      ...exercise,
      sets: setsByExercise.get(exercise.id) || [],
    }
    exercisesByWorkout.get(exercise.workoutId)!.push(exerciseWithSets)
  }

  // Combine workouts with their exercises
  return userWorkouts.map((workout) => ({
    ...workout,
    exercises: exercisesByWorkout.get(workout.id) || [],
  }))
}

// Create a new workout with exercises and sets
export async function createWorkoutWithExercises(input: CreateWorkoutWithExercisesInput) {
  const user = await currentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Create workout
  const workoutResult = await db
    .insert(workouts)
    .values({
      userId: user.id,
      name: input.name,
      date: new Date(input.date),
      duration: input.duration,
    })
    .returning()

  const workout = workoutResult[0]

  // Create exercises
  for (const exerciseInput of input.exercises) {
    const exerciseResult = await db
      .insert(exercises)
      .values({
        workoutId: workout.id,
        name: exerciseInput.name,
        order: exerciseInput.order,
      })
      .returning()

    const exercise = exerciseResult[0]

    // Create sets for this exercise
    if (exerciseInput.sets.length > 0) {
      await db.insert(sets).values(
        exerciseInput.sets.map((set) => ({
          exerciseId: exercise.id,
          weight: set.weight,
          reps: set.reps,
          duration: set.duration,
          order: set.order,
        }))
      )
    }
  }

  return workout
}
