'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createWorkoutAction } from './actions'

interface ExerciseForm {
  name: string
  sets: {
    weight: string
    reps: string
  }[]
}

export default function NewWorkoutClient() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const [workoutDate, setWorkoutDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [duration, setDuration] = useState('')
  const [exercises, setExercises] = useState<ExerciseForm[]>([
    { name: '', sets: [{ weight: '', reps: '' }] },
  ])
  const [error, setError] = useState<string | null>(null)

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: [{ weight: '', reps: '' }] }])
  }

  const removeExercise = (exerciseIndex: number) => {
    setExercises(exercises.filter((_, i) => i !== exerciseIndex))
  }

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex].sets.push({ weight: '', reps: '' })
    setExercises(newExercises)
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter(
      (_, i) => i !== setIndex
    )
    setExercises(newExercises)
  }

  const updateExerciseName = (exerciseIndex: number, name: string) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex].name = name
    setExercises(newExercises)
  }

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'weight' | 'reps',
    value: string
  ) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex].sets[setIndex][field] = value
    setExercises(newExercises)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Validate exercises
    const validExercises = exercises.filter((ex) => ex.name.trim() !== '')
    if (validExercises.length === 0) {
      setError('Please add at least one exercise')
      setIsSubmitting(false)
      return
    }

    // Prepare input for server action
    const input = {
      name: workoutName,
      date: workoutDate,
      duration: duration ? parseInt(duration, 10) : undefined,
      exercises: validExercises.map((ex, exIndex) => ({
        name: ex.name.trim(),
        order: exIndex,
        sets: ex.sets
          .filter((set) => set.weight !== '' || set.reps !== '')
          .map((set, setIndex) => ({
            weight: set.weight ? parseInt(set.weight, 10) : undefined,
            reps: set.reps ? parseInt(set.reps, 10) : undefined,
            order: setIndex,
          })),
      })),
    }

    const result = await createWorkoutAction(input)

    if (result.success) {
      router.push('/dashboard')
    } else {
      if ('errors' in result && Array.isArray(result.errors)) {
        setError(result.errors.map((e) => e.message).join(', '))
      } else {
        setError('Failed to create workout')
      }
    }

    setIsSubmitting(false)
  }

  return (
    <div className='min-h-screen bg-zinc-50 dark:bg-black'>
      <main className='mx-auto max-w-4xl p-4 sm:p-6'>
        <div className='mb-8'>
          <h2 className='text-2xl font-bold text-black dark:text-white'>Create New Workout</h2>
          <p className='text-gray-600 dark:text-gray-400'>Add a new workout with exercises and sets</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='text-xl text-black dark:text-white'>Workout Details</CardTitle>
              <CardDescription>Enter the basic information for your workout</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Label htmlFor='workoutName' className='text-sm font-medium'>
                  Workout Name *
                </Label>
                <Input
                  id='workoutName'
                  type='text'
                  placeholder='e.g., Upper Body Day'
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  required
                  className='mt-1'
                />
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <Label htmlFor='workoutDate' className='text-sm font-medium'>
                    Date *
                  </Label>
                  <Input
                    id='workoutDate'
                    type='date'
                    value={workoutDate}
                    onChange={(e) => setWorkoutDate(e.target.value)}
                    required
                    className='mt-1'
                  />
                </div>

                <div>
                  <Label htmlFor='duration' className='text-sm font-medium'>
                    Duration (minutes)
                  </Label>
                  <Input
                    id='duration'
                    type='number'
                    placeholder='e.g., 60'
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min='1'
                    className='mt-1'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='space-y-4'>
            {exercises.map((exercise, exerciseIndex) => (
              <Card key={exerciseIndex}>
                <CardHeader className='pb-2'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-lg text-black dark:text-white'>
                      Exercise {exerciseIndex + 1}
                    </CardTitle>
                    {exercises.length > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => removeExercise(exerciseIndex)}
                        className='text-red-600 hover:text-red-700'
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <Label className='text-sm font-medium'>Exercise Name *</Label>
                    <Input
                      type='text'
                      placeholder='e.g., Bench Press'
                      value={exercise.name}
                      onChange={(e) => updateExerciseName(exerciseIndex, e.target.value)}
                      required
                      className='mt-1'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label className='text-sm font-medium'>Sets</Label>
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className='flex items-center gap-2'>
                        <span className='w-16 text-sm text-gray-600 dark:text-gray-400'>
                          Set {setIndex + 1}
                        </span>
                        <Input
                          type='number'
                          placeholder='Weight (lbs)'
                          value={set.weight}
                          onChange={(e) =>
                            updateSet(exerciseIndex, setIndex, 'weight', e.target.value)
                          }
                          className='w-32'
                        />
                        <Input
                          type='number'
                          placeholder='Reps'
                          value={set.reps}
                          onChange={(e) =>
                            updateSet(exerciseIndex, setIndex, 'reps', e.target.value)
                          }
                          className='w-24'
                        />
                        {exercise.sets.length > 1 && (
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => addSet(exerciseIndex)}
                    >
                      Add Set
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className='mt-6 flex items-center gap-4'>
            <Button type='button' variant='outline' onClick={addExercise}>
              Add Exercise
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Workout'}
            </Button>
          </div>

          {error && (
            <p className='mt-4 text-sm text-red-600'>{error}</p>
          )}
        </form>
      </main>
    </div>
  )
}
