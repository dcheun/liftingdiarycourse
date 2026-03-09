import { db } from '@/lib/db'
import { exercises, sets, workouts } from '@/lib/db/schema'
import { currentUser } from '@clerk/nextjs/server'
import { and, desc, eq, inArray } from 'drizzle-orm'

// Flattened workout entry for UI display
export interface WorkoutEntry {
  id: number
  workoutId: number
  workoutName: string
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

export interface UpdateWorkoutWithExercisesInput extends CreateWorkoutWithExercisesInput {
  id: number
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
        workoutId: workout.id,
        workoutName: workout.name,
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

// Calculate dashboard statistics
export interface DashboardStats {
  totalWorkouts: number
  bestLift: number
  thisWeekWorkouts: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const nestedWorkouts = await getUserWorkouts()

  const totalWorkouts = nestedWorkouts.length

  // Calculate best lift (maximum weight across all sets)
  let bestLift = 0
  for (const workout of nestedWorkouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (set.weight && set.weight > bestLift) {
          bestLift = set.weight
        }
      }
    }
  }

  // Calculate this week's workouts
  const now = new Date()
  const currentWeekStart = new Date(now)
  const dayOfWeek = currentWeekStart.getDay() || 7 // 1=Monday, 7=Sunday
  currentWeekStart.setDate(now.getDate() - (dayOfWeek - 1))
  currentWeekStart.setHours(0, 0, 0, 0)

  const thisWeekWorkouts = nestedWorkouts.filter((w) => {
    const workoutDate = new Date(w.date)
    return workoutDate >= currentWeekStart
  }).length

  return {
    totalWorkouts,
    bestLift,
    thisWeekWorkouts,
  }
}

// Get a single workout by ID for the current user
export async function getWorkoutById(id: number) {
  const user = await currentUser()
  if (!user) {
    return null
  }

  // Get the workout for the current user
  const userWorkouts = await db
    .select({
      id: workouts.id,
      name: workouts.name,
      date: workouts.date,
      duration: workouts.duration,
    })
    .from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, user.id)))

  if (userWorkouts.length === 0) {
    return null
  }

  const workout = userWorkouts[0]

  // Get all exercises for this workout
  const allExercises = await db
    .select({
      id: exercises.id,
      workoutId: exercises.workoutId,
      name: exercises.name,
      order: exercises.order,
    })
    .from(exercises)
    .where(eq(exercises.workoutId, workout.id))

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

  // Combine workout with its exercises
  return {
    ...workout,
    exercises: exercisesByWorkout.get(workout.id) || [],
  }
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

// Update an existing workout with exercises and sets
export async function updateWorkoutWithExercises(input: UpdateWorkoutWithExercisesInput) {
  const user = await currentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // First, verify the workout belongs to the user
  const existingWorkout = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, input.id), eq(workouts.userId, user.id)))

  if (existingWorkout.length === 0) {
    throw new Error('Workout not found')
  }

  // Update workout
  await db
    .update(workouts)
    .set({
      name: input.name,
      date: new Date(input.date),
      duration: input.duration,
      updatedAt: new Date(),
    })
    .where(eq(workouts.id, input.id))

  // Track which exercises and sets are still valid
  const validExerciseIds = new Set<number>()
  const validSetIds = new Set<number>()

  // Process each exercise
  for (const exerciseInput of input.exercises) {
    let exerciseId: number

    if (exerciseInput.id) {
      // Update existing exercise
      await db
        .update(exercises)
        .set({
          name: exerciseInput.name,
          order: exerciseInput.order,
          updatedAt: new Date(),
        })
        .where(eq(exercises.id, exerciseInput.id))

      exerciseId = exerciseInput.id
    } else {
      // Create new exercise
      const exerciseResult = await db
        .insert(exercises)
        .values({
          workoutId: input.id,
          name: exerciseInput.name,
          order: exerciseInput.order,
        })
        .returning()

      exerciseId = exerciseResult[0].id
    }

    validExerciseIds.add(exerciseId)

    // Process sets for this exercise
    for (const setInput of exerciseInput.sets) {
      if (setInput.id) {
        // Update existing set
        await db
          .update(sets)
          .set({
            weight: setInput.weight,
            reps: setInput.reps,
            duration: setInput.duration,
            order: setInput.order,
            updatedAt: new Date(),
          })
          .where(eq(sets.id, setInput.id))

        validSetIds.add(setInput.id)
      } else {
        // Create new set
        const setResult = await db
          .insert(sets)
          .values({
            exerciseId: exerciseId,
            weight: setInput.weight,
            reps: setInput.reps,
            duration: setInput.duration,
            order: setInput.order,
          })
          .returning()

        validSetIds.add(setResult[0].id)
      }
    }
  }

  // Delete exercises that were removed from the workout
  const currentExercises = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(eq(exercises.workoutId, input.id))

  for (const exercise of currentExercises) {
    if (!validExerciseIds.has(exercise.id)) {
      // Delete sets for this exercise first
      await db.delete(sets).where(eq(sets.exerciseId, exercise.id))
      // Then delete the exercise
      await db.delete(exercises).where(eq(exercises.id, exercise.id))
    }
  }

  // Delete sets that were removed (for exercises that still exist)
  const currentSets = await db
    .select({ id: sets.id, exerciseId: sets.exerciseId })
    .from(sets)
    .where(inArray(sets.exerciseId, Array.from(validExerciseIds)))

  for (const set of currentSets) {
    if (!validSetIds.has(set.id)) {
      await db.delete(sets).where(eq(sets.id, set.id))
    }
  }

  // Return the updated workout
  return getWorkoutById(input.id)
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
