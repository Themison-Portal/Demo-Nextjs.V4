# Themison - Clinical Trials Platform

> A comprehensive clinical trial management system for research organizations

---

## Overview

Themison helps research organizations manage trials, patients, documentation, tasks, and team communication with a focus on compliance, security, and usability.

**Key Features:**
- Multi-tenant architecture with granular permissions
- Role-based access control (org + trial levels)
- Patient enrollment and visit schedules
- Document management with AI assistance
- Complete audit logging for compliance

---

## Tech Stack

- **Frontend**: Next.js 16.1.1 (App Router), React 19, TypeScript
- **UI**: Shadcn/ui components + Radix UI primitives, Tailwind CSS 4
- **State**: TanStack Query (data fetching & caching)
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth)
- **Architecture**: Component → Hook → Service → Backend (strict layers)

---

## Quick Start

```bash
# Install dependencies
npm install

# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
supabase start

# Configure environment (copy local credentials from supabase start output)
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<local_service_role_key>
EOF

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Important:** Always use local Supabase for development. Never point to production.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Components                          │
│              (components/app, components/ui)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    React Hooks                              │
│           (hooks/client, hooks/usePermissions)              │
│          TanStack Query: useQuery, useMutation              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│        (services/client, services/console)                  │
│           Pure functions, fetch to API routes               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend API                               │
│               (app/api/client, app/api/console)             │
│      Middleware: withAuth → withOrgMember → withTrialMember │
│              Direct Supabase calls + RLS                    │
└─────────────────────────────────────────────────────────────┘
```

**Never skip layers.** Components call hooks, hooks call services, services call API routes.

---

## Documentation

Detailed guides are organized by topic in `docs/`:

### Core Documentation

**[📐 Architecture Guide](docs/ARCHITECTURE.md)** - Start here
- Folder structure and organization
- Layer separation (Component → Hook → Service → Backend)
- State management with TanStack Query
- Naming conventions and import patterns
- Server vs Client Components

**[🔐 Permissions System](docs/PERMISSIONS.md)**
- Complete permission matrix (org + trial levels)
- Middleware stack (withAuth → withOrgMember → withTrialMember)
- Real API examples with access control
- Frontend hooks for conditional rendering
- Route protection patterns

**[⚙️ Backend Patterns](docs/BACKEND.md)**
- API route structure and conventions
- Middleware composition patterns
- Database access with Supabase
- Soft delete implementation
- Error handling and logging

**[🎨 UI & Layout](docs/UI_LAYOUT.md)**
- 3-zone layout system (Sidebar, Header, Main)
- Shadcn/ui component library usage
- Non-boxed design patterns
- Padding and spacing conventions
- Component composition guidelines

**[🗄️ Supabase Guide](docs/supabase.md)**
- Local development setup
- Database schema overview
- Migration workflow
- RLS policies and patterns
- Critical patterns (soft deletes, multi-tenancy)

**[🔄 User Flows](docs/user-flows.md)**
- Complete user flows by feature area
- Step-by-step interaction patterns

### Additional Resources

- [Project Rules](.claude/CLAUDE.md) - Development rules and conventions for AI

---

## Development Workflow

### Common Tasks

```bash
# Start local Supabase
supabase start

# Create database migration
supabase migration new your_migration_name

# Apply migrations locally
supabase db push

# Stop local Supabase
supabase stop

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

### Critical Conventions

1. **TanStack Query for all backend data** - Never use `useState` for data from the backend
2. **Soft deletes only** - Never hard delete, use `deleted_at` column
3. **Backend validates permissions** - Frontend conditionally renders, backend enforces
4. **Follow layer architecture** - Component → Hook → Service → Backend (no shortcuts)

---

## Environment Setup

### Local Development (Required)

**Always use local Supabase.** Never point local development to production.

```bash
# Start local Supabase
supabase start

# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from_supabase_start>
SUPABASE_SERVICE_ROLE_KEY=<from_supabase_start>
```

### Production (Reference Only)

```bash
# DO NOT USE LOCALLY
NEXT_PUBLIC_SUPABASE_URL=https://npfouzkvpnyjusdozymu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<prod_service_role_key>
```

---

## Project Rules

These rules are non-negotiable:

- **Use Shadcn/Radix components** → Never recreate existing UI primitives (Button, Input, Card, etc.)
- **No hardcoded env values** → Use `lib/constants.ts` → `process.env`
- **Soft deletes only** → `.update({ deleted_at: ... })` + filter `.is('deleted_at', null)`
- **Permissions in backend only** → Middleware validates, frontend hints UI
- **Audit log every mutation** → In API routes only (future implementation)
- **Components = zero logic** → Props in, render out
- **Follow layer architecture** → Component → Hook → Service → Backend (no shortcuts)

---

## Key Files Referenced

Quick links to important files:

- **Routes**: `lib/routes.ts` - Centralized route definitions
- **Permissions**: `lib/permissions/constants.ts` - Permission matrix
- **Auth**: `lib/auth/getUser.ts` - Server-side auth
- **Middleware**: `lib/api/middleware/` - API middleware stack
- **Layout**: `components/app/shared/AppMain.tsx` - Main layout component

---

## Common Issues

### "Cannot connect to Supabase"
- Ensure `supabase start` is running
- Verify `.env.local` has correct local credentials
- Check you're NOT pointing to production

### "Permission denied"
- Check user's `org_role` and `trial_role`
- See [docs/PERMISSIONS.md](docs/PERMISSIONS.md) for permission matrix
- Backend ALWAYS validates (RLS + middleware)

### "Module not found"
- Ensure imports use `@/` alias (not relative paths)
- TypeScript paths configured in `tsconfig.json`

---

## License

Proprietary - All rights reserved
