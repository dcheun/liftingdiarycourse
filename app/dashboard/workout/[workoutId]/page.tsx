import { notFound } from 'next/navigation'
import { getWorkoutById } from '@/data/workouts'
import EditWorkoutClient from './edit-workout-client'

interface PageProps {
  params: Promise<{
    workoutId: string
  }>
}

// Match the client component's WorkoutForm interface
interface ExerciseForm {
  id?: number
  name: string
  sets: {
    id?: number
    weight: string | number
    reps: string | number
  }[]
}

interface WorkoutForm {
  id: number
  name: string
  date: string
  duration?: number | null
  exercises: ExerciseForm[]
}

export default async function EditWorkoutPage({ params }: PageProps) {
  const resolvedParams = await params
  const workoutId = parseInt(resolvedParams.workoutId, 10)

  if (isNaN(workoutId)) {
    notFound()
  }

  const workout = await getWorkoutById(workoutId)

  if (!workout) {
    notFound()
  }

  // Convert date to string and format exercises/sets for client component
  const formattedWorkout = {
    id: workout.id,
    name: workout.name,
    date: workout.date.toISOString().split('T')[0],
    duration: workout.duration,
    exercises: workout.exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      sets: ex.sets.map((set) => ({
        id: set.id,
        weight: set.weight != null ? set.weight.toString() : '',
        reps: set.reps != null ? set.reps.toString() : '',
      })),
    })),
  } satisfies WorkoutForm

  return <EditWorkoutClient initialWorkout={formattedWorkout} />
}
