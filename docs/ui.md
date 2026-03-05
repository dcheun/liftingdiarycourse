# UI Coding Standards

This document outlines the UI coding standards for this project to ensure consistency and maintainability across the codebase.

## Component Usage

### shadcn UI Components Only

All UI components in this project MUST be sourced from shadcn UI. **ABSOLUTELY NO custom components should be created**. This ensures:

- Consistent styling and design language
- Reusable, well-tested components
- Easy maintenance and updates
- Standardized user experience

When implementing new UI elements, always check the shadcn UI component library first before considering any alternatives.

### Available Components

Refer to the shadcn UI documentation for available components and their usage patterns. Common components include:

- Buttons
- Input fields
- Cards
- Modals
- Tables
- Forms
- Navigation components

## Date Formatting

### Library

All date formatting MUST be done using the `date-fns` library.

### Format

Dates should be formatted using the following pattern:

- `1st Sep 2025`
- `2nd Aug 2025`
- `3rd Jan 2026`
- `4th Jun 2024`

This format uses:

- Ordinal suffixes (1st, 2nd, 3rd, 4th)
- Abbreviated month names
- Full year

### Implementation

When formatting dates, use the `format` function from date-fns with the pattern `'do MMM yyyy'`:

```typescript
import { format } from 'date-fns'

const formattedDate = format(new Date(), 'do MMM yyyy')
```

This ensures all dates in the application follow the same consistent format.
