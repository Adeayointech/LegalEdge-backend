# Getting Started with Law Firm Platform

## Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Installation

### 1. Clone and Install Dependencies

```bash
# Navigate to project
cd Law-firm-platform

# Install root dependencies
npm install

# Install all workspace dependencies
npm install --workspaces
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb lawfirm_db

# Or using psql:
psql -U postgres
CREATE DATABASE lawfirm_db;
\q
```

### 3. Environment Configuration

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit backend/.env with your settings:
# - DATABASE_URL (PostgreSQL connection)
# - JWT_SECRET (generate secure key)
# - SMTP settings (for email reminders)
```

### 4. Initialize Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) View database
npm run prisma:studio
```

### 5. Start Development Servers

```bash
# Start both backend and frontend
npm run dev

# Or individually:
npm run dev:backend   # Backend on http://localhost:5000
npm run dev:frontend  # Frontend on http://localhost:3000
```

## Project Structure

```
Law-firm-platform/
├── backend/                # Express API
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── src/
│       ├── index.ts       # Server entry
│       ├── lib/           # Utilities (Prisma, logger)
│       └── routes/        # API endpoints (to be added)
│
├── frontend/              # React app
│   └── src/
│       ├── main.tsx       # App entry
│       ├── App.tsx        # Routes
│       └── components/    # UI components (to be added)
│
└── shared/               # Shared TypeScript types (to be added)
```

## Available Scripts

```bash
# Development
npm run dev              # Start all services
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio

# Production
npm run build           # Build all workspaces
npm start               # Start production server
```

## Next Steps

1. ✅ Project structure created
2. ✅ Database schema designed
3. 🔄 Implement authentication API
4. 🔄 Build case management endpoints
5. 🔄 Create frontend UI components
6. 🔄 Add document upload functionality
7. 🔄 Implement deadline reminders
8. 🔄 Build analytics dashboard

## Need Help?

Check the documentation:
- [Database Schema](backend/prisma/SCHEMA_DOCS.md)
- API documentation (coming soon)
- Frontend component guide (coming soon)
