# Repository Agents Guide

Welcome to the Soft Split repository. This guide is designed for AI agents working on this project.

## Project Architecture
This is a monorepo-style project (without explicit workspaces like Lerna/Yarn workspaces) consisting of:
- **`soft-split-frontend/`**: A Next.js (App Router) frontend application.
- **`soft-split-api/`**: A NestJS backend REST API.

These two parts communicate with each other over HTTP.
The default local development URLs are:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:7000`

## General Guidelines
1. **Separation of Concerns**: Be mindful of which directory you are in. Do not import code directly from the frontend into the backend or vice-versa.
2. **Environment Variables**: Both projects use `.env` files. The backend uses `.env` and the frontend uses `.env.local`. Ensure environment variables are correctly maintained.
3. **Database**: The backend uses PostgreSQL. See the backend `AGENTS.md` for more details.
4. **Commands**: Always make sure you are in the correct subdirectory (`soft-split-api/` or `soft-split-frontend/`) before running package manager commands like `npm install`, `npm run build`, or `npm test`.
5. **Pre-commit**: Always run tests and build checks in both directories before concluding a task, if applicable.

Refer to the nested `AGENTS.md` files in `soft-split-frontend/` and `soft-split-api/` for directory-specific instructions.
