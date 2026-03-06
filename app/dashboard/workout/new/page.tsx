import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import NewWorkoutClient from './new-workout-client'

export default async function NewWorkoutPage() {
  // Check authentication
  const user = await currentUser()

  if (!user) {
    redirect('/')
  }

  return <NewWorkoutClient />
}
