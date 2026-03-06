# Data Mutations Guidelines

This document outlines the coding standards for data mutations in this application.

## Overview

Data mutations (create, update, delete operations) follow a strict pattern to ensure type safety, validation, and maintainability.

## Architecture

### Three-Layer Pattern

1. **Database Layer** (`/lib/db`): Drizzle ORM schema and connection
2. **Data Layer** (`/data`): Helper functions that wrap database calls
3. **Action Layer** (`actions.ts`): Server Actions that expose mutations to components

## Data Layer Helper Functions

All database mutations MUST be performed through helper functions in the `/data` directory.

### Requirements

- Use Drizzle ORM for all database operations
- Never use raw SQL
- Always filter by user ID for data isolation
- Return typed data structures

### Example

```typescript
// /data/workouts.ts
import { db } from '@/lib/db';
import { workouts, exercises, sets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

export async function createWorkout(workoutData: CreateWorkoutInput) {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const result = await db
    .insert(workouts)
    .values({
      userId: user.id,
      name: workoutData.name,
      date: new Date(workoutData.date),
      duration: workoutData.duration,
    })
    .returning();

  return result[0];
}

export async function updateWorkout(workoutId: number, workoutData: UpdateWorkoutInput) {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const result = await db
    .update(workouts)
    .set({
      name: workoutData.name,
      date: new Date(workoutData.date),
      duration: workoutData.duration,
    })
    .where(eq(workouts.id, workoutId))
    .returning();

  return result[0];
}

export async function deleteWorkout(workoutId: number) {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  await db
    .delete(workouts)
    .where(eq(workouts.id, workoutId));
}
```

## Server Actions

All data mutations exposed to components MUST be done via Server Actions in colocated `actions.ts` files.

### File Location

Place `actions.ts` files colocated with the feature they serve:

```
app/
  dashboard/
    page.tsx
    actions.ts        # Server actions for dashboard
  workouts/
    [id]/
      page.tsx
      actions.ts      # Server actions for workout detail
```

### Requirements

1. **MUST** use the `'use server'` directive
2. **MUST** be async functions
3. **MUST** have typed parameters (NO `FormData`)
4. **MUST** validate all arguments using Zod
5. **MUST** call data layer helper functions (not direct db access)
6. **MUST** handle authentication

### Parameter Typing

Server actions must have explicit TypeScript interfaces for parameters:

```typescript
// actions.ts
'use server';

import { z } from 'zod';
import { createWorkout, updateWorkout, deleteWorkout } from '@/data/workouts';

// Define input types
interface CreateWorkoutActionInput {
  name: string;
  date: string;
  duration?: number;
}

interface UpdateWorkoutActionInput {
  workoutId: number;
  name: string;
  date: string;
  duration?: number;
}

interface DeleteWorkoutActionInput {
  workoutId: number;
}
```

### Zod Validation

ALL server actions MUST validate arguments using Zod schemas:

```typescript
// actions.ts
'use server';

import { z } from 'zod';
import { createWorkout, updateWorkout, deleteWorkout } from '@/data/workouts';

// Define Zod schemas
const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  duration: z.number().int().positive().optional(),
});

const updateWorkoutSchema = z.object({
  workoutId: z.number().int().positive(),
  name: z.string().min(1, 'Workout name is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  duration: z.number().int().positive().optional(),
});

const deleteWorkoutSchema = z.object({
  workoutId: z.number().int().positive(),
});

// Server actions with validation
export async function createWorkoutAction(input: CreateWorkoutActionInput) {
  // Validate input
  const validated = createWorkoutSchema.parse(input);

  // Call data layer helper
  const workout = await createWorkout(validated);

  return { success: true, workout };
}

export async function updateWorkoutAction(input: UpdateWorkoutActionInput) {
  const validated = updateWorkoutSchema.parse(input);

  const workout = await updateWorkout(validated.workoutId, validated);

  return { success: true, workout };
}

export async function deleteWorkoutAction(input: DeleteWorkoutActionInput) {
  const validated = deleteWorkoutSchema.parse(input);

  await deleteWorkout(validated.workoutId);

  return { success: true };
}
```

### Error Handling

Server actions should handle errors gracefully:

```typescript
export async function createWorkoutAction(input: CreateWorkoutActionInput) {
  try {
    const validated = createWorkoutSchema.parse(input);
    const workout = await createWorkout(validated);
    return { success: true, workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, error: 'Failed to create workout' };
  }
}
```

## Complete Example

### Data Layer (`/data/workouts.ts`)

```typescript
import { db } from '@/lib/db';
import { workouts, exercises, sets } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

// Types
export interface CreateWorkoutInput {
  name: string;
  date: string;
  duration?: number;
  exercises: CreateExerciseInput[];
}

export interface CreateExerciseInput {
  name: string;
  order?: number;
  sets: CreateSetInput[];
}

export interface CreateSetInput {
  weight?: number;
  reps?: number;
  duration?: number;
  order?: number;
}

// Helper function to create a workout with nested data
export async function createWorkoutWithExercises(input: CreateWorkoutInput) {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Create workout
  const workoutResult = await db
    .insert(workouts)
    .values({
      userId: user.id,
      name: input.name,
      date: new Date(input.date),
      duration: input.duration,
    })
    .returning();

  const workout = workoutResult[0];

  // Create exercises
  for (const exerciseInput of input.exercises) {
    const exerciseResult = await db
      .insert(exercises)
      .values({
        workoutId: workout.id,
        name: exerciseInput.name,
        order: exerciseInput.order,
      })
      .returning();

    const exercise = exerciseResult[0];

    // Create sets for this exercise
    if (exerciseInput.sets.length > 0) {
      await db.insert(sets).values(
        exerciseInput.sets.map((set) => ({
          exerciseId: exercise.id,
          weight: set.weight,
          reps: set.reps,
          duration: set.duration,
          order: set.order,
        }))
      );
    }
  }

  return workout;
}
```

### Server Actions (`app/dashboard/actions.ts`)

```typescript
'use server';

import { z } from 'zod';
import { createWorkoutWithExercises } from '@/data/workouts';

// Define set schema
const setSchema = z.object({
  weight: z.number().positive().optional(),
  reps: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
  order: z.number().int().optional(),
});

// Define exercise schema
const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  order: z.number().int().optional(),
  sets: z.array(setSchema),
});

// Define workout schema
const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  duration: z.number().int().positive().optional(),
  exercises: z.array(exerciseSchema).min(1, 'At least one exercise is required'),
});

// Input type
interface CreateWorkoutActionInput {
  name: string;
  date: string;
  duration?: number;
  exercises: {
    name: string;
    order?: number;
    sets: {
      weight?: number;
      reps?: number;
      duration?: number;
      order?: number;
    }[];
  }[];
}

export async function createWorkoutAction(input: CreateWorkoutActionInput) {
  try {
    // Validate all input
    const validated = createWorkoutSchema.parse(input);

    // Call data layer helper
    const workout = await createWorkoutWithExercises(validated);

    return { success: true, workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      };
    }

    console.error('Create workout error:', error);
    return { success: false, error: 'Failed to create workout' };
  }
}
```

### Usage in Component

```typescript
// app/dashboard/page.tsx or component
'use client';

import { createWorkoutAction } from './actions';
import { useState } from 'react';

export default function WorkoutForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);

    // Convert FormData to typed object (NOT passing FormData to server action)
    const input = {
      name: formData.get('name') as string,
      date: formData.get('date') as string,
      duration: formData.get('duration')
        ? parseInt(formData.get('duration') as string, 10)
        : undefined,
      exercises: [
        {
          name: formData.get('exerciseName') as string,
          sets: [
            {
              weight: formData.get('weight')
                ? parseInt(formData.get('weight') as string, 10)
                : undefined,
              reps: formData.get('reps')
                ? parseInt(formData.get('reps') as string, 10)
                : undefined,
            },
          ],
        },
      ],
    };

    const result = await createWorkoutAction(input);

    if (result.success) {
      // Handle success
    } else {
      // Handle error
    }

    setIsSubmitting(false);
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Key Principles

1. **Typed Parameters**: Server actions must have explicit TypeScript types
2. **No FormData**: Never pass `FormData` directly to server actions
3. **Zod Validation**: Always validate with Zod schemas
4. **Data Layer**: All DB calls go through `/data` helper functions
5. **User Isolation**: Always verify user authentication and filter by user ID
6. **Error Handling**: Return structured error responses
7. **Server Actions Only**: All mutations go through colocated `actions.ts` files

## Anti-Patterns

### ❌ Don't pass FormData to server actions

```typescript
// BAD
export async function badAction(formData: FormData) {
  // This is not allowed
}
```

### ❌ Don't use raw SQL

```typescript
// BAD
await db.execute('INSERT INTO workouts ...');
```

### ❌ Don't access database directly from server actions

```typescript
// BAD - actions.ts
'use server';
import { db } from '@/lib/db';

export async function badAction(input: SomeInput) {
  await db.insert(workouts).values(...); // Direct DB access
}
```

### ❌ Don't skip validation

```typescript
// BAD
export async function badAction(input: any) {
  // No Zod validation
  await createWorkout(input);
}
```

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Zod Documentation](https://zod.dev/)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
