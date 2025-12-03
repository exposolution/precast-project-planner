# AI Rules for PréFab Application

This document outlines the technical stack and specific library usage guidelines for the PréFab application. Adhering to these rules ensures consistency, maintainability, and leverages the strengths of the chosen technologies.

## Tech Stack Overview

*   **Frontend Framework:** React (with TypeScript)
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **UI Component Library:** shadcn/ui (built on Radix UI primitives)
*   **Routing:** React Router DOM
*   **Data Fetching & State Management:** React Query (@tanstack/react-query)
*   **Backend & Database:** Supabase (client-side integration)
*   **Icons:** Lucide React
*   **Date Manipulation:** date-fns
*   **Form Management & Validation:** React Hook Form with Zod

## Library Usage Guidelines

To maintain a consistent and efficient codebase, please follow these guidelines for library usage:

1.  **UI Components:**
    *   **Always prefer `shadcn/ui` components.** These are pre-configured with Tailwind CSS and provide a consistent look and feel.
    *   If a specific `shadcn/ui` component is not available or requires significant deviation from its default behavior, create a new custom component in `src/components/` and style it using Tailwind CSS.
    *   **Do NOT modify `shadcn/ui` component files directly.** If a change is needed, create a new component that wraps or extends the `shadcn/ui` component.

2.  **Styling:**
    *   **Use Tailwind CSS exclusively for all styling.** Avoid inline styles, separate CSS modules, or other styling solutions.
    *   Leverage Tailwind's utility classes for layout, spacing, colors, typography, and responsiveness.

3.  **Routing:**
    *   **Use `react-router-dom` for all client-side navigation.**
    *   All main application routes should be defined within `src/App.tsx`.

4.  **Data Fetching & Server State:**
    *   **Utilize `@tanstack/react-query` for all data fetching, caching, and synchronization with the server.** This includes fetching lists, single items, and handling mutations (create, update, delete).

5.  **Backend & Database Interactions:**
    *   **Supabase is the designated backend service.** All database operations (CRUD) should be performed using the `@supabase/supabase-js` client.
    *   Database interaction logic should be encapsulated within custom React Query hooks (e.g., `useObras`, `useCreateForma`).

6.  **Forms:**
    *   **Use `react-hook-form` for managing form state, validation, and submission.**
    *   **Use `zod` for defining form schemas and validation rules.**

7.  **Date Handling:**
    *   **All date manipulation, formatting, and parsing should be done using `date-fns`.**

8.  **Icons:**
    *   **Use icons from the `lucide-react` library.**

9.  **Toasts/Notifications:**
    *   **For general, non-blocking notifications, use the `sonner` library.**
    *   The existing `use-toast.ts` hook and `Toaster` component (from `shadcn/ui`) can be used for more traditional "toast" messages if a specific UI pattern requires it, but `sonner` is preferred for modern, accessible notifications.

10. **New Components & File Structure:**
    *   **Always create a new, dedicated file for every new component or hook.**
    *   Place page-level components in `src/pages/`.
    *   Place reusable UI components in `src/components/`.
    *   Place custom hooks in `src/hooks/`.
    *   Aim for small, focused components (ideally under 100 lines of code). Refactor larger components into smaller, more manageable pieces when necessary.

11. **Utility Functions:**
    *   General utility functions (e.g., `cn` for Tailwind class merging) should reside in `src/lib/utils.ts`.