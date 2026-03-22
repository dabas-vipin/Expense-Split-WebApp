# Backend Agents Guide

This folder contains a NestJS application using TypeORM for PostgreSQL database interaction.

## Tech Stack
- **Framework:** NestJS
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **Authentication:** Passport-JWT, Bcrypt
- **Language:** TypeScript

## Guidelines
1. **Modules, Controllers, Providers**: Follow the standard NestJS dependency injection architecture. Isolate domain logic into modules and their respective services.
2. **TypeORM**: When modifying database entities, create and run migrations (`npm run migration:generate`, `npm run migration:run`).
3. **Environment**: This project relies on a `.env` file that must be properly set up. Essential variables include `DATABASE_URL` and `JWT_SECRET`.
4. **Testing**: Run tests using `npm test` or `npm run test:e2e`. Always try to ensure unit tests are covering your changes before marking tasks as complete.
5. **Linting and Formatting**: Adhere to ESLint and Prettier formatting (`npm run lint`, `npm run format`).

## Setup and Run
- Start in dev mode: `npm run start:dev`
- Build the project: `npm run build`
- Run migrations: `npm run migration:run`

Please see the root `AGENTS.md` for broader repository context.