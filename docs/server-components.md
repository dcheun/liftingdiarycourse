# Server Components Coding Standards

Server components are the default in Next.js 16 and form the foundation of this application's architecture. Understanding their behavior, especially regarding async operations, is critical.

## Critical Rule: Await Params

In Next.js 16, the `params` prop passed to server components is **always a Promise** and **must be awaited** before use.

### WRONG - Forgetting to Await

```typescript
// ❌ This will cause a runtime error
export default async function Page({ params }: PageProps) {
  const workoutId = params.workoutId // Error: params is a Promise
  // ...
}
```

### CORRECT - Properly Awaiting Params

```typescript
// ✅ This is correct
export default async function Page({ params }: PageProps) {
  const resolvedParams = await params // Await the params promise
  const workoutId = resolvedParams.workoutId // Now params is accessible
  // ...
}
```

## Server Component Architecture

Server components are **rendered on the server**, making them:
- **Secure by default**: Data is never exposed to the client
- **Fast**: No JavaScript bundles are sent to the browser
- **Efficient**: Can fetch data directly from the database without API calls

## Async Operations

Server components can be async, but they must properly await all async operations:

```typescript
import { getWorkoutById } from '@/data/workouts'
import { currentUser } from '@clerk/nextjs/server'

export default async function EditWorkoutPage({ params }: PageProps) {
  // 1. Await params (CRITICAL)
  const resolvedParams = await params
  const workoutId = parseInt(resolvedParams.workoutId, 10)

  // 2. Check if ID is valid
  if (isNaN(workoutId)) {
    notFound()
  }

  // 3. Await async data fetching
  const workout = await getWorkoutById(workoutId)

  if (!workout) {
    notFound()
  }

  // 4. Convert data for client component
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
        weight: set.weight?.toString() || '',
        reps: set.reps?.toString() || '',
      })),
    })),
  }

  // 5. Pass data to client component
  return <EditWorkoutClient initialWorkout={formattedWorkout} />
}
```

## Common Patterns

### Matching URL Parameters

```typescript
interface PageProps {
  params: Promise<{
    workoutId: string
  }>
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params
  const { workoutId } = resolvedParams

  // Use the parameter
  const workout = await getWorkoutById(workoutId)
  // ...
}
```

### Multiple Parameters

```typescript
interface PageProps {
  params: Promise<{
    date: string
    workoutId: string
  }>
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params
  const { date, workoutId } = resolvedParams

  // Use both parameters
  const workouts = await getUserWorkoutsByDate(date)
  const workout = await getWorkoutById(workoutId)
  // ...
}
```

### Conditional Rendering with Awaited Params

```typescript
export default async function Page({ params }: PageProps) {
  const resolvedParams = await params
  const { workoutId } = resolvedParams

  if (!workoutId) {
    return <div>Invalid workout ID</div>
  }

  const workout = await getWorkoutById(workoutId)

  if (!workout) {
    notFound()
  }

  return <WorkoutDetails workout={workout} />
}
```

## Integration with Client Components

Server components are responsible for:
1. Fetching and preparing data
2. Converting data formats (e.g., Date to string)
3. Passing data as props to client components

Client components should **never** fetch data directly - they should only receive data from server components.

```typescript
// ✅ CORRECT: Server component fetches data
export default async function Page({ params }: PageProps) {
  const resolvedParams = await params
  const workout = await getWorkoutById(parseInt(resolvedParams.workoutId, 10))

  return <WorkoutClient workout={workout} />
}

// ❌ WRONG: Client component should not fetch data
'use client'

export default function WorkoutClient({ workout }) {
  useEffect(() => {
    // Never fetch data in client components
    fetchWorkout(workout.id)
  }, [workout.id])
  // ...
}
```

## Key Requirements

1. **Always Await Params**: The `params` prop is a Promise and must be awaited
2. **Server-Only Data Fetching**: All data fetching should happen in server components
3. **Type Safety**: Use `Promise` for the params type definition
4. **Error Handling**: Handle invalid params and missing data appropriately
5. **Data Preparation**: Convert data formats before passing to client components

## Resources

- [Next.js Server Components Documentation](https://nextjs.org/docs/app/building-your-application/rendering/server-components)