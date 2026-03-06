# Authentication Guidelines

This document outlines the authentication standards for this application using Clerk.

## Overview

This application uses **Clerk** for authentication and user management. Clerk provides a complete authentication solution with user management, session handling, and secure access control.

## Server-Side Authentication

### Importing

Always import authentication helpers from `@clerk/nextjs/server`:

```typescript
import { currentUser, auth } from '@clerk/nextjs/server';
```

### Getting the Current User

Use `currentUser()` to fetch the full user object in Server Components and Server Actions:

```typescript
import { currentUser } from '@clerk/nextjs/server';

export async function getUserWorkouts() {
  const user = await currentUser();

  if (!user) {
    return [];
  }

  // Access user properties
  const userId = user.id;
  const firstName = user.firstName;
  const lastName = user.lastName;
  const email = user.emailAddresses[0]?.emailAddress;

  // Perform user-specific operations...
}
```

### Auth Helper

For simpler authentication checks, use the `auth()` helper:

```typescript
import { auth } from '@clerk/nextjs/server';

export async function someAction() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Continue with authenticated operation...
}
```

## User Data Access

### Database Queries

All database queries **MUST** filter by the current user's ID to ensure data isolation:

```typescript
import { eq } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { workouts } from '@/lib/db/schema';

export async function getUserData() {
  const user = await currentUser();

  if (!user) {
    return [];
  }

  // Always filter by userId
  const userData = await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, user.id));

  return userData;
}
```

### Displaying User Information

When displaying the user's name, handle cases where name fields may be null:

```typescript
const user = await currentUser();
const userName = user
  ? `${user.firstName} ${user.lastName}`.trim() || 'User'
  : 'Guest';
```

## Client-Side Authentication

### useUser Hook

In Client Components, use the `useUser` hook:

```typescript
'use client';

import { useUser } from '@clerk/nextjs';

export default function UserProfile() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {user.firstName}!</div>;
}
```

## Security Requirements

### User Isolation

- **NEVER** return data that belongs to other users
- **ALWAYS** filter database queries by `userId`
- **ALWAYS** verify authentication before performing data operations

### Protected Routes

Server Components automatically require authentication when using `currentUser()` or `auth()`. Handle unauthenticated users appropriately:

```typescript
export default async function ProtectedPage() {
  const user = await currentUser();

  if (!user) {
    return <div>Please sign in to view this page</div>;
  }

  return <div>Protected content</div>;
}
```

## Key Principles

1. **Server-First**: Prefer fetching user data in Server Components
2. **Data Isolation**: Always filter queries by user ID
3. **Graceful Degradation**: Handle unauthenticated users gracefully
4. **Type Safety**: Use TypeScript types for user data

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Reference](https://clerk.com/docs/references/nextjs)
