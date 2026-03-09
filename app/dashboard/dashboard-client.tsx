'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { WorkoutEntry } from '@/data/workouts'
import { format } from 'date-fns'
import { useState } from 'react'

interface DashboardClientProps {
  workouts: WorkoutEntry[]
  userName: string
  stats: {
    totalWorkouts: number
    bestLift: number
    thisWeekWorkouts: number
  }
}

export default function DashboardClient({ workouts, userName, stats }: DashboardClientProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  // Format date function according to UI standards
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'do MMM yyyy')
  }

  // Filter workouts for the selected date
  const workoutsForSelectedDate = workouts.filter((workout) => workout.date === selectedDate)

  return (
    <div className='min-h-screen bg-zinc-50 dark:bg-black'>
      <main className='mx-auto max-w-6xl p-4 sm:p-6'>
        <div className='mb-8'>
          <h2 className='mb-2 text-2xl font-bold text-black dark:text-white'>
            Welcome, {userName}!
          </h2>
          <p className='text-gray-600 dark:text-gray-400'>
            Track your lifting progress and workouts
          </p>
        </div>

        <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-lg font-semibold text-black dark:text-white'>
                Total Workouts
              </CardTitle>
              <Badge variant='default'>Count</Badge>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
                {workouts.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-lg font-semibold text-black dark:text-white'>
                Best Lift
              </CardTitle>
              <Badge variant='default'>{stats.bestLift} lbs</Badge>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-green-600 dark:text-green-400'>
                {stats.bestLift} lbs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-lg font-semibold text-black dark:text-white'>
                This Week
              </CardTitle>
              <Badge variant='default'>{stats.thisWeekWorkouts} workouts</Badge>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-purple-600 dark:text-purple-400'>
                {stats.thisWeekWorkouts} workouts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Datepicker Section */}
        <Card className='mb-8'>
          <CardHeader>
            <CardTitle className='text-xl text-black dark:text-white'>Workouts for Date</CardTitle>
            <CardDescription>Select a date to view workouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='mb-6 flex items-center space-x-4'>
              <Label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Select Date:
              </Label>
              <Input
                type='date'
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className='max-w-xs'
              />
            </div>

            {/* Workouts List for Selected Date */}
            {workoutsForSelectedDate.length > 0 ? (
              <>
                <div className='mb-4'>
                  <h3 className='text-lg font-semibold text-black dark:text-white'>
                    {workoutsForSelectedDate[0].workoutName}
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='text-left'>Exercise</TableHead>
                      <TableHead className='text-left'>Sets</TableHead>
                      <TableHead className='text-left'>Reps</TableHead>
                      <TableHead className='text-left'>Weight</TableHead>
                      <TableHead className='text-left'>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workoutsForSelectedDate.map((workout) => (
                      <TableRow key={workout.id} className='hover:bg-gray-50 dark:hover:bg-gray-800'>
                        <TableCell className='font-medium text-gray-900 dark:text-gray-100'>
                          {workout.exercise}
                        </TableCell>
                        <TableCell className='text-gray-900 dark:text-gray-100'>
                          {workout.sets}
                        </TableCell>
                        <TableCell className='text-gray-900 dark:text-gray-100'>
                          {workout.reps}
                        </TableCell>
                        <TableCell className='text-gray-900 dark:text-gray-100'>
                          {workout.weight} lbs
                        </TableCell>
                        <TableCell className='text-gray-900 dark:text-gray-100'>
                          {formatDate(workout.date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Edit Workout Button */}
                <div className='mt-4 flex justify-center'>
                  <Link
                    href={{
                      pathname: `/dashboard/workout/${workoutsForSelectedDate[0].workoutId}`,
                      query: { date: selectedDate },
                    }}
                  >
                    <Button className='w-full sm:w-auto'>Edit Workout</Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className='py-8 text-center'>
                <p className='text-gray-500 dark:text-gray-400'>
                  No workouts logged for {selectedDate}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg text-black dark:text-white'>Add New Workout</CardTitle>
            <CardDescription>Create a new workout with multiple exercises</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href='/dashboard/workout/new'>
              <Button className='w-full'>Create New Workout</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
