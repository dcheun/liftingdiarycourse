import { getUserWorkoutEntries, WorkoutEntry } from '@/data/workouts';
import { currentUser } from '@clerk/nextjs/server';
import DashboardClient from './dashboard-client';

// Server component for dashboard page
export default async function DashboardPage() {
  // Fetch the current user
  const user = await currentUser();
  const userName = user ? `${user.firstName} ${user.lastName}`.trim() || 'User' : 'Guest';

  // Fetch workouts for the current user
  const workouts = await getUserWorkoutEntries();

  // For demonstration purposes, we'll use mock data if no workouts exist
  // In a real implementation, the actual workouts would be returned from the database
  const mockWorkouts: WorkoutEntry[] = [
    { id: 1, date: '2023-06-15', exercise: 'Bench Press', sets: 3, reps: 10, weight: 135 },
    { id: 2, date: '2023-06-16', exercise: 'Squats', sets: 4, reps: 8, weight: 185 },
    { id: 3, date: '2023-06-17', exercise: 'Deadlift', sets: 3, reps: 5, weight: 225 },
  ];

  // Use real workouts if available, otherwise use mock data
  const userWorkouts = workouts.length > 0 ? workouts : mockWorkouts;

  return <DashboardClient workouts={userWorkouts} userName={userName} />;
}
