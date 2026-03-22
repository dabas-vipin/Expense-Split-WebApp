# Frontend Agents Guide

This folder contains a Next.js (App Router) application that forms the user interface of the Soft Split platform.

## Tech Stack
- **Framework:** Next.js `15.1.0`
- **React:** React `18.2.0` (Note: Mismatched with typical Next.js 15 setups. Watch out for type issues in `react@^18.2.0` and `@types/react@^19`)
- **UI Components:** Radix UI components, Tailwind CSS, Lucide Icons
- **Forms and State:** React Hook Form with Zod validation
- **HTTP Client:** Axios
- **Language:** TypeScript

## Guidelines
1. **Component Styling**: Always utilize Tailwind CSS and Radix UI components (found in `components/`). Avoid raw CSS. Use `tailwind-merge` (`cn` utility) for dynamic classes.
2. **Next.js App Router Conventions**: Ensure usage of `layout.tsx`, `page.tsx`, and `route.ts`. Be mindful of Server Components vs. Client Components (use `"use client"` when hooks are needed).
3. **Environment**: This project relies on `.env.local`. Specifically, `NEXT_PUBLIC_API_URL` is needed to communicate with the `soft-split-api`.
4. **Validations**: Define request validation schemas using `zod` and implement them into `react-hook-form`.

## Setup and Run
- Start in dev mode: `npm run dev`
- Build the project: `npm run build`
- Run linting: `npm run lint`

Please see the root `AGENTS.md` for broader repository context.