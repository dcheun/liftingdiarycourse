# Routing Guidelines

This document outlines the routing standards for this Next.js application.

## Overview

All application routes are organized under the `/dashboard` path. The root path (`/`) serves as a landing page that directs users to the dashboard after authentication.

## Route Structure

```
app/
├── page.tsx              # Landing page (public)
├── layout.tsx            # Root layout with header/user controls
└── dashboard/            # Protected dashboard routes
    ├── page.tsx          # Dashboard home
    ├── dashboard-client.tsx
    └── workout/          # Workout-related routes
        ├── new/          # Create new workout
        │   ├── page.tsx
        │   └── actions.ts
        └── [workoutId]/  # Individual workout (dynamic route)
            ├── page.tsx
            └── edit-workout-client.tsx
```

## Dashboard Routes

All routes under `/dashboard` are **protected routes** and should only be accessible to logged-in users.

### Accessible Paths

| Route | Purpose |
|-------|---------|
| `/dashboard` | Main dashboard page showing stats and recent workouts |
| `/dashboard/workout/new` | Create a new workout entry |
| `/dashboard/workout/[workoutId]` | View/edit specific workout by ID |

## Route Protection

### Middleware-Based Protection

Route protection is implemented using **Next.js Middleware** (`middleware.ts`). The middleware intercepts all incoming requests and redirects unauthenticated users to the sign-in page.

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/dashboard(.*)', '/(api|trpc)(.*)'],
};
```

### Server Component Protection

For additional protection at the component level, Server Components should use `currentUser()` or `auth()`:

```typescript
import { currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    return <div>Please sign in to view this page</div>;
  }

  return <DashboardClient user={user} />;
}
```

## Navigation

### From Landing Page

The landing page (`app/page.tsx`) provides a "Go to Dashboard" link for authenticated users:

```tsx
<SignedIn>
  <a href="/dashboard">Go to Dashboard</a>
</SignedIn>
```

### From Header Navigation

The root layout (`app/layout.tsx`) includes a navigation link in the header:

```tsx
<SignedIn>
  <nav className="flex space-x-4">
    <a href="/dashboard" className="px-3 py-2 text-sm font-medium">
      Dashboard
    </a>
  </nav>
</SignedIn>
```

## Dynamic Routes

### Workout Detail Page

The workout detail page uses a dynamic route parameter:

```
/dashboard/workout/[workoutId]/page.tsx
```

Access via:
```tsx
<a href={`/dashboard/workout/${workout.id}`}>
  View Workout
</a>
```

## Best Practices

1. **Always use relative links** within the dashboard to maintain navigation context
2. **Handle unauthenticated access gracefully** - either redirect or show a friendly message
3. **Use the UserButton component** for sign-out functionality in the header
4. **Ensure all data-fetching functions** in protected routes verify user authentication
5. **Keep route paths consistent** with the folder structure under `/dashboard`

## Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Clerk Middleware Protection](https://clerk.com/docs/references/nextjs/clerk-middleware)
- [Protected Routes with Clerk](https://clerk.com/docs/nextjs/protected-routes)
