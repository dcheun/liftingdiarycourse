# Database Schema for Workout Logging App

This document describes the normalized database schema for the workout logging application using Drizzle ORM with PostgreSQL.

## Schema Overview

The schema is designed with normalization principles to avoid data redundancy while maintaining efficient querying capabilities. It follows a 1-to-many relationship pattern:
- Workouts contain multiple exercises
- Exercises contain multiple sets

## Tables

### 1. Workouts
Stores information about individual workout sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier for the workout |
| userId | UUID NOT NULL | Reference to the user who performed the workout |
| name | TEXT NOT NULL | Name/title of the workout |
| description | TEXT | Optional description of the workout |
| date | TIMESTAMP NOT NULL | Date and time when the workout was performed |
| duration | INTEGER | Duration of the workout in minutes |
| createdAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the workout was created |
| updatedAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the workout was last updated |

### 2. Exercises
Stores information about exercises performed within workouts.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier for the exercise |
| workoutId | INTEGER NOT NULL REFERENCES workouts(id) | Reference to the workout this exercise belongs to |
| name | TEXT NOT NULL | Name of the exercise |
| category | TEXT | Category or type of exercise (e.g., 'Chest', 'Back', 'Legs') |
| order | INTEGER | Order of the exercise within the workout (for sequencing) |
| createdAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the exercise was created |
| updatedAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the exercise was last updated |

### 3. Sets
Stores information about individual sets performed for exercises.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier for the set |
| exerciseId | INTEGER NOT NULL REFERENCES exercises(id) | Reference to the exercise this set belongs to |
| weight | INTEGER | Weight used for the set (in kg or lbs) |
| reps | INTEGER | Number of repetitions performed |
| duration | INTEGER | Duration of the set (in seconds) |
| order | INTEGER | Order of the set within the exercise (for sequencing) |
| createdAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the set was created |
| updatedAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the set was last updated |

### 4. Users
Stores user information for authentication.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PRIMARY KEY DEFAULT RANDOM() | Unique identifier for the user |
| name | TEXT | User's name |
| email | TEXT NOT NULL UNIQUE | User's email address |
| emailVerified | TIMESTAMP | Timestamp when email was verified |
| image | TEXT | URL to user's profile image |
| createdAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the user was created |
| updatedAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the user was last updated |

### 5. Accounts
Stores authentication account information.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier for the account |
| userId | UUID NOT NULL REFERENCES users(id) | Reference to the user |
| type | TEXT NOT NULL | Type of account (e.g., 'oauth', 'email') |
| provider | TEXT NOT NULL | Authentication provider (e.g., 'google', 'github') |
| providerAccountId | TEXT NOT NULL | Provider's unique account identifier |
| refresh_token | TEXT | Refresh token for OAuth |
| access_token | TEXT | Access token for OAuth |
| expires_at | INTEGER | Expiration timestamp |
| token_type | TEXT | Type of token |
| scope | TEXT | Scope of permissions |
| id_token | TEXT | ID token for OAuth |
| session_state | TEXT | Session state |
| createdAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the account was created |
| updatedAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the account was last updated |

### 6. Sessions
Stores user session information.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier for the session |
| sessionToken | TEXT NOT NULL UNIQUE | Session token |
| userId | UUID NOT NULL REFERENCES users(id) | Reference to the user |
| expires | TIMESTAMP NOT NULL | Expiration timestamp |
| createdAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the session was created |
| updatedAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the session was last updated |

### 7. Verification Tokens
Stores tokens used for email verification.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier for the token |
| identifier | TEXT NOT NULL | Identifier (typically email) |
| token | TEXT NOT NULL | Verification token |
| expires | TIMESTAMP NOT NULL | Expiration timestamp |
| createdAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the token was created |
| updatedAt | TIMESTAMP NOT NULL DEFAULT NOW() | Timestamp when the token was last updated |

## Relationships

1. **Workouts → Exercises**: One-to-many relationship
2. **Exercises → Sets**: One-to-many relationship
3. **Users → Accounts**: One-to-many relationship
4. **Users → Sessions**: One-to-many relationship

## Design Considerations

1. **Normalization**: The schema is normalized to reduce redundancy and improve data integrity.
2. **UUIDs**: User IDs use UUIDs for better security and distributed system compatibility.
3. **Timestamps**: All tables include createdAt and updatedAt timestamps for tracking changes.
4. **Order Fields**: Each table that needs ordering (exercises and sets) includes an order field to maintain sequence.
5. **References**: Proper foreign key constraints ensure data integrity.
6. **Flexibility**: The schema allows for various workout types and exercise categories while maintaining structure.

## Usage with Drizzle ORM

The schema is designed to work seamlessly with Drizzle ORM. You can use the generated TypeScript types for type-safe database operations.