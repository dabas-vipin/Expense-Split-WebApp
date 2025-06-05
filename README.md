# Soft Split

A modern expense splitting application built with Next.js and NestJS.

## Project Structure

- `soft-split-frontend/`: Next.js frontend application
- `soft-split-api/`: NestJS backend API

## Features

- User authentication
- Group creation and management
- Expense tracking and splitting
- Real-time balance calculations
- Responsive design

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd soft-split-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=7000
```

4. Run migrations:
```bash
npm run migration:run
```

5. Start the development server:
```bash
npm run start:dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd soft-split-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with:
```
NEXT_PUBLIC_API_URL=http://localhost:7000
```

4. Start the development server:
```bash
npm run dev
```

## Development

- Frontend runs on: http://localhost:3000
- Backend runs on: http://localhost:7000

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 