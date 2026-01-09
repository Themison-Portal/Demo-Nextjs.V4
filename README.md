# Themison - Clinical Trials Management System

> Clinical trial management platform for research organizations

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Local Development Setup](#local-development-setup)
- [Project Structure](#project-structure)
- [Architecture & Conventions](#architecture--conventions)
- [Development Workflow](#development-workflow)
- [Documentation](#documentation)

---

## Overview

Themison is a comprehensive clinical trial management platform that helps research organizations manage trials, patients, documents, tasks, and team communication. Key features:

- Multi-tenant architecture with granular permissions
- Patient enrollment and visit schedule tracking
- AI-powered Document Assistant (RAG) for protocol queries
- Auto-generated tasks from visit schedules
- Internal team communication hub
- Complete audit logging for compliance

---

## Tech Stack

**Frontend:**

- Next.js 16.1.1 (App Router)
- React 19 + TypeScript
- TailwindCSS 4
- Zustand (UI state management)
- TanStack Query (data fetching)

**Backend:**

- Next.js API routes (`app/api/`)
- Supabase (PostgreSQL + Auth)
- Row Level Security (RLS) for permissions

**Architecture Pattern:**

```
Component → Hook → Service → Backend
```

Never skip layers. See [Architecture Guide](./.claude/architecture.md) for details.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm/yarn/pnpm
- Supabase CLI (for local development)

### Installation

```bash
# Install dependencies
npm install

# Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase

# Login to Supabase
supabase login
```

---

## Local Development Setup

### ⚠️ IMPORTANT: Always Use Local Database

**NEVER point your local development environment to the production database.**

We use Supabase's local development environment to ensure production data is never affected.

### Option 1: Supabase Local (Recommended)

```bash
# Start local Supabase (runs PostgreSQL, Auth, Storage locally)
supabase start

# This will output local credentials:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# anon key: <local_anon_key>
# service_role key: <local_service_role_key>
```

Create `.env.local` with local credentials:

```bash
# .env.local (LOCAL DEVELOPMENT ONLY)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local_anon_key_from_supabase_start>
SUPABASE_SERVICE_ROLE_KEY=<local_service_role_key_from_supabase_start>
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Option 2: Supabase Development Branch

Alternatively, you can create a development branch on Supabase:

```bash
# Link to project
supabase link --project-ref npfouzkvpnyjusdozymu

# Create development branch
supabase branches create dev

# This creates an isolated database branch
# Update .env.local with branch credentials
```

### Stopping Local Supabase

```bash
# Stop local Supabase
supabase stop

# Stop and reset all data
supabase stop --no-backup
```

---

## Project Structure

```
demo/
├── app/                    # Next.js App Router
│   ├── api/               # Backend API routes
│   ├── [orgId]/           # Organization-scoped pages
│   └── dashboard/         # Dashboard pages
├── src/
│   ├── components/        # Reusable UI components
│   ├── hooks/             # React hooks (connect services to UI)
│   ├── services/          # Business logic (can call each other)
│   ├── stores/            # Zustand stores (UI state)
│   └── lib/               # External config (Supabase client, etc.)
├── .claude/               # AI assistant documentation
├── public/                # Static assets
└── supabase/              # Supabase migrations and config
    ├── migrations/        # Database migrations
    └── config.toml        # Supabase configuration
```

---

## Architecture & Conventions

### Layered Architecture

**ALWAYS follow this pattern:**

```typescript
Component → Hook → Service → Backend
```

**Example:**

```typescript
// ❌ WRONG - Component calling service directly
function TaskList() {
  const tasks = await taskService.getAll(); // NO!
}

// ✅ RIGHT - Component → Hook → Service
function TaskList() {
  const { tasks } = useTasks(trialId); // Hook calls service
}
```

### Critical Conventions

#### 1. Soft Deletes Only

```typescript
// ❌ WRONG
await supabase.from("tasks").delete().eq("id", taskId);

// ✅ RIGHT
await supabase
  .from("tasks")
  .update({ deleted_at: new Date().toISOString() })
  .eq("id", taskId);

// Always filter out deleted records
await supabase.from("tasks").select("*").is("deleted_at", null);
```

#### 2. Audit Logging (Backend Only)

```typescript
// After every mutation, log in backend
await supabase.from("audit_logs").insert({
  action: "task.delete",
  user_id: user.id,
  org_id: task.org_id,
  trial_id: task.trial_id,
  resource_type: "task",
  resource_id: task.id,
  before: task,
  after: null,
  ip_address: req.headers.get("x-forwarded-for"),
  user_agent: req.headers.get("user-agent"),
});
```

#### 3. Permission Middleware

```typescript
// app/api/orgs/[orgId]/trials/route.ts
export const POST = withOrgPermission(async (req, ctx, user) => {
  // Create trial - organization scope
});

// app/api/trials/[trialId]/tasks/route.ts
export const POST = withTrialPermission(async (req, ctx, user) => {
  // Create task - trial scope
});

// app/api/trials/[trialId]/tasks/[taskId]/route.ts
export const DELETE = withCriticalPermission(async (req, ctx, user) => {
  // Delete task - critical action (PI/CRC only)
});
```

### Permission Scopes

1. **Organization Scope** - Create/pause trials, invite members

   - Requires: `superadmin` or `admin`

2. **Trial Scope (Standard)** - Create patient, upload docs, send messages

   - Requires: Any `trial_team` member

3. **Trial Scope (Critical)** - Delete patient, assign team, configure schedule
   - Requires: `PI` or `CRC` role (or superadmin/admin override)

---

## Development Workflow

### Database Migrations

```bash
# Create new migration
supabase migration new migration_name

# Apply migrations locally
supabase db push

# Apply migrations to remote (after testing locally)
supabase db push --db-url <remote_db_url>
```

### Code Quality

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Commit with descriptive messages
git commit -m "feat: add patient enrollment flow"

# Push and create PR
git push origin feature/your-feature-name
```

---

## Documentation

Detailed documentation is available in the `.claude/` directory:

| File                                                 | Purpose                              |
| ---------------------------------------------------- | ------------------------------------ |
| [.claude/README.md](./.claude/README.md)             | Quick reference and conventions      |
| [.claude/architecture.md](./.claude/architecture.md) | Layered architecture deep dive       |
| [.claude/backend.md](./.claude/backend.md)           | Permission middleware, audit logging |
| [.claude/user-flows.md](./.claude/user-flows.md)     | All 40 user flows by area            |
| [.claude/permissions.md](./.claude/permissions.md)   | Complete permissions matrix          |
| [.claude/supabase.md](./.claude/supabase.md)         | Supabase project details             |

---

## Environment Variables

### Local Development (`.env.local`)

```bash
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<local_service_role_key>
```

### Production (DO NOT USE LOCALLY)

```bash
# PRODUCTION - Never use these in local development!
NEXT_PUBLIC_SUPABASE_URL=https://npfouzkvpnyjusdozymu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<prod_service_role_key>
```

---

## Common Issues

### "Cannot connect to Supabase"

- Make sure `supabase start` is running
- Check `.env.local` has correct local credentials
- Verify you're NOT pointing to production database

### "Permission denied"

- Check your user's `org_role` and `trial_role`
- Verify RLS policies are correct
- See [permissions.md](./.claude/permissions.md)

### "Migration failed"

- Test migrations locally first with `supabase db push`
- Never run migrations directly on production
- Use Supabase dashboard or branches for testing

---

## Team

**Themison** - Clinical Trials Management Platform

For questions or support, reach out to the development team.

---

## License

Proprietary - All rights reserved
