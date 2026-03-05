# Data Fetching Guidelines

All data fetching within this application must be done via **server components**. This is a critical requirement for security and application architecture.

## Server Components Only

Data should **never** be fetched via:
- Route handlers
- Client components
- Any other method besides server components

## Database Access

All database queries must be performed through helper functions located in the `/data` directory. These functions must utilize **drizzle ORM** for database operations.

### Important Security Note

All database queries must ensure that **logged-in users can only access their own data**. Users should **never** be able to access data belonging to other users.

## Example Structure

```typescript
// Example of proper data fetching in a server component
import { getUserWorkouts } from '@/data/workouts'

export default async function Dashboard() {
  const workouts = await getUserWorkouts() // This function uses drizzle ORM
  // ... component logic
}
```

## Key Requirements

1. **Server Components**: All data fetching must happen in server components
2. **Drizzle ORM**: Never use raw SQL - always use drizzle ORM helpers
3. **User Isolation**: Queries must always filter data by the current user