# Supabase Configuration & Development

---

## Project Details

**Name:** demo
**Project ID:** `npfouzkvpnyjusdozymu`
**Region:** eu-west-1 (Ireland)
**PostgreSQL:** 17.6
**Status:** ACTIVE_HEALTHY

**Production URL:** `https://npfouzkvpnyjusdozymu.supabase.co`

---

## Local Development Setup

### 1. Install Supabase CLI

```bash
brew install supabase/tap/supabase
```

### 2. Start Local Supabase

```bash
# From project root
supabase start
```

This will output local credentials:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
anon key: eyJh... (local anon key)
service_role key: eyJh... (local service role key)
```

### 3. Configure Environment

Create `.env.local` with **local credentials**:

```bash
# .env.local - LOCAL DEVELOPMENT ONLY
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local_anon_key_from_supabase_start>
SUPABASE_SERVICE_ROLE_KEY=<local_service_role_key_from_supabase_start>
```

**CRITICAL:** Never use production credentials locally.

### 4. Stop Local Supabase

```bash
# Stop (preserves data)
supabase stop

# Stop and reset all data
supabase stop --no-backup
```

---

## Development Workflow

### Creating Migrations

```bash
# Create new migration
supabase migration new your_migration_name

# Edit the generated file in supabase/migrations/
```

### Applying Migrations

```bash
# Apply to local database
supabase db push

# OR reset local DB and apply all migrations
supabase db reset
```

### Diffing Changes

```bash
# Generate migration from schema changes made in Studio
supabase db diff -f migration_name

# This creates a new migration file with the changes
```

### Checking Status

```bash
# Check which migrations have been applied
supabase migration list

# View local database URL
supabase status
```

---

## Database Schema

Schema is managed via migrations in `supabase/migrations/`. Key tables:

### Auth & Users

```sql
-- Mirror of auth.users (all users)
users (
  id UUID PK,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at, updated_at
)

-- Themison staff (@themison.com)
staff_members (
  user_id UUID PK → users(id),
  status TEXT,
  hired_at TIMESTAMPTZ
)
```

### Organizations & Members

```sql
organizations (
  id UUID PK,
  name TEXT,
  slug TEXT UNIQUE,
  support_enabled BOOLEAN,
  settings JSONB,
  deleted_at TIMESTAMPTZ
)

-- Organization memberships
organization_members (
  id UUID PK,                    -- Unique membership ID
  user_id UUID → users(id),       -- NULL when user deleted
  org_id UUID → organizations(id),
  org_role TEXT,                  -- superadmin, admin, editor, reader
  status TEXT,                    -- active, pending, inactive
  user_snapshot JSONB,            -- Preserved when user deleted
  deleted_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ
)

invitations (
  id UUID PK,
  email TEXT,
  org_id UUID → organizations(id),
  org_role TEXT,
  invited_by UUID → users(id),
  status TEXT,                    -- pending, accepted, expired, revoked
  token TEXT,                     -- URL-safe token
  expires_at TIMESTAMPTZ
)
```

**Note:** `organization_members` uses `id` as PK (not composite key). This enables referencing memberships from other tables, soft delete with user data snapshot, and clean re-invitation flow.

### Trials & Team

```sql
trials (
  id UUID PK,
  org_id UUID → organizations(id),
  name TEXT,
  protocol_number TEXT,
  phase TEXT,                     -- Phase I, II, III, IV
  status TEXT,                    -- active, paused, completed, terminated
  start_date DATE,
  end_date DATE,
  description TEXT,
  settings JSONB,
  deleted_at TIMESTAMPTZ
)

-- Trial team members
trial_team_members (
  id UUID PK,
  trial_id UUID → trials(id),
  org_member_id UUID → organization_members(id),  -- References membership, not user
  trial_role TEXT,                                -- PI, CRC, Physician, Nurse, etc.
  status TEXT,                                    -- active, inactive
  notes TEXT,
  contact_info TEXT,
  settings JSONB,
  assigned_at TIMESTAMPTZ,
  assigned_by UUID → users(id)
)
```

**Note:** `trial_team_members` references `organization_members.id` instead of `users.id` directly. Trial access is tied to org membership.

### Visit Schedules (Templates)

```sql
visit_schedule_templates (
  id UUID PK,
  trial_id UUID → trials(id),
  visit_name TEXT,                -- "Screening", "Baseline", "Week 4"
  visit_order INTEGER,
  days_from_start INTEGER,        -- 0 for baseline, 7 for week 1
  window_before_days INTEGER,
  window_after_days INTEGER,
  description TEXT
)

visit_schedule_activities (
  id UUID PK,
  visit_schedule_id UUID → visit_schedule_templates(id),
  activity_name TEXT,             -- "Blood draw", "ECG", "Vital signs"
  activity_order INTEGER,
  is_required BOOLEAN,
  description TEXT
)
```

---

## Critical Patterns

### 1. Soft Deletes

All deletable tables have `deleted_at TIMESTAMPTZ`:

```sql
-- ALWAYS filter soft-deleted records
SELECT * FROM trials
WHERE deleted_at IS NULL;

-- Soft delete (never hard delete)
UPDATE trials
SET deleted_at = NOW()
WHERE id = 'trial-id';
```

### 2. User Deletion with Snapshot

When a user is deleted from `auth.users`:
- `organization_members.user_id` → `NULL`
- `organization_members.user_snapshot` → `{ email, full_name }` (preserved)
- `trial_team_members` cascade deleted (via org_member FK)

### 3. Multi-tenancy

All data scoped by `org_id` (organizations) or `trial_id` (trials):

```sql
-- Org-level data
SELECT * FROM trials WHERE org_id = 'org-id';

-- Trial-level data (patients belong to trials, not orgs)
SELECT * FROM patients WHERE trial_id = 'trial-id';
```

### 4. Automatic User Mirroring

Trigger on `auth.users` automatically creates:
- Entry in `users` table (mirror)
- Entry in `staff_members` if email is `@themison.com` and confirmed

```sql
-- Trigger: on_auth_user_created
-- Handles new user signup
-- Creates users + staff_members if @themison.com
```

---

## Row Level Security (RLS)

All tables have RLS enabled. Key policies:

### Staff Access
```sql
-- Staff can view all trials in orgs with support_enabled
CREATE POLICY "staff_view_trials" ON trials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = trials.org_id AND support_enabled = true
    )
  );
```

### Org Admin Access
```sql
-- Org admins can view all trials in their org
CREATE POLICY "org_admin_view_trials" ON trials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
        AND org_id = trials.org_id
        AND org_role IN ('superadmin', 'admin')
        AND deleted_at IS NULL
    )
  );
```

### Trial Team Access
```sql
-- Trial team members can view their assigned trials
CREATE POLICY "trials_team_view" ON trials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trial_team_members ttm
      JOIN organization_members om ON om.id = ttm.org_member_id
      WHERE ttm.trial_id = trials.id
        AND om.user_id = auth.uid()
        AND om.deleted_at IS NULL
    )
  );
```

---

## Environment Variables

### Local Development
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<local_service_role_key>
```

### Production (Reference Only - DO NOT USE LOCALLY)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://npfouzkvpnyjusdozymu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<prod_service_role_key>
```

---

## MCP Supabase Access

When using Supabase MCP tools, always use:

```javascript
project_id: "npfouzkvpnyjusdozymu"
```

Common operations:
- `list_tables` - View current schema
- `execute_sql` - Query data (SELECT only for safety)
- `apply_migration` - Apply migration file
- `get_advisors` - Check for security/performance issues

---

## Quick Reference

```bash
# Start local Supabase
supabase start

# Create migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset local DB
supabase db reset

# Stop Supabase
supabase stop
```

**Always develop locally. Never point local environment to production.**
