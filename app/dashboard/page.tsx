import { getDashboardStats, getUserWorkoutEntries } from '@/data/workouts'
import { currentUser } from '@clerk/nextjs/server'
import DashboardClient from './dashboard-client'

// Server component for dashboard page
export default async function DashboardPage() {
  // Fetch the current user
  const user = await currentUser()
  const userName = user ? `${user.firstName} ${user.lastName}`.trim() || 'User' : 'Guest'

  // Fetch workouts and stats for the current user
  const workouts = await getUserWorkoutEntries()
  const stats = await getDashboardStats()

  return <DashboardClient workouts={workouts} userName={userName} stats={stats} />
}
