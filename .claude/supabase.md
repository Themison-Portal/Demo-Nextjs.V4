# Supabase Project Configuration

## Project Details

**Name:** demo
**Project ID:** `npfouzkvpnyjusdozymu`
**Reference:** `npfouzkvpnyjusdozymu`
**Region:** eu-west-1
**Status:** ACTIVE_HEALTHY
**Created:** 2026-01-09

## Database

**Host:** db.npfouzkvpnyjusdozymu.supabase.co
**PostgreSQL Version:** 17.6.1.063
**Engine:** PostgreSQL 17
**Release Channel:** General Availability (GA)

## Organization

**Organization ID:** `xosovrzmtmpxtywiucbb`
**Organization Slug:** `xosovrzmtmpxtywiucbb`

## Connection

This is the primary Supabase project for the Themison application. When using MCP Supabase tools, always reference this project ID:

```typescript
project_id: "npfouzkvpnyjusdozymu"
```

## Database Schema Patterns

### Soft Deletes
All tables that support deletion MUST include a `deleted_at` timestamp column:

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- other columns...
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
```

Always filter out soft-deleted records:

```sql
SELECT * FROM tasks
WHERE deleted_at IS NULL;
```

### Audit Logs
Every mutation must be logged in the `audit_logs` table:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,           -- e.g., 'task.create', 'patient.delete'
  user_id UUID NOT NULL,
  org_id UUID NOT NULL,
  trial_id UUID,
  resource_type TEXT NOT NULL,    -- e.g., 'task', 'patient', 'document'
  resource_id UUID NOT NULL,
  before JSONB,                   -- State before mutation
  after JSONB,                    -- State after mutation
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Audit logs are **immutable** - no updates or deletes allowed.

### Multi-tenancy

All data is scoped by organization and/or trial:

```sql
-- Organization-level tables
CREATE TABLE trials (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  -- ...
);

-- Trial-level tables
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  trial_id UUID NOT NULL REFERENCES trials(id),
  -- NOT org_id - patients belong to trials only
  -- ...
);
```

### Permission Checking

Use Row Level Security (RLS) policies:

```sql
-- Example: Trial team members can view patients
CREATE POLICY "trial_team_view_patients" ON patients
FOR SELECT
USING (
  trial_id IN (
    SELECT trial_id FROM trial_team_members
    WHERE user_id = auth.uid()
  )
  OR
  -- Superadmin/admin override
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
    AND org_role IN ('superadmin', 'admin')
  )
);
```

## Auth Structure

Themison uses a **mirror table pattern** with Supabase Auth:

### Core Auth Tables

```sql
-- 1. Mirror of auth.users (ALL users in system)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Themison staff (@themison.com)
CREATE TABLE staff_members (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- active, inactive
  hired_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clinic users (invited to organizations)
CREATE TABLE organization_members (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL, -- superadmin, admin, editor, reader
  status TEXT DEFAULT 'active', -- active, pending, inactive
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, org_id)
);

-- 4. Track invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  org_id UUID REFERENCES organizations(id),
  org_role TEXT NOT NULL,
  invited_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- pending, accepted, expired
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Auto-sync Trigger

```sql
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Always create user mirror
  INSERT INTO users (id, email) VALUES (NEW.id, NEW.email);

  -- If @themison.com AND email confirmed → create staff
  IF NEW.email LIKE '%@themison.com' AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO staff_members (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Auth Flows

**Staff Signup (@themison.com):**
1. User visits `/console/signup` (public endpoint)
2. User enters `@themison.com` email
3. Supabase sends confirmation email
4. User confirms → `auth.users.email_confirmed_at` set
5. Trigger creates: `users` + `staff_members`
6. User can access `/console`

**Clinic User Invitation:**
1. Staff creates org → assigns owner/admin emails
2. System calls `auth.admin.inviteUserByEmail()`
3. Supabase sends magic link
4. User clicks → auto-authenticated
5. User completes profile + password
6. System creates: `users` + `organization_members` with `org_role`

### Why Mirror Table?

- ✅ Easy joins with other tables (`tasks.assigned_to → users.id`)
- ✅ Store additional metadata (full_name, avatar, preferences)
- ✅ Fast queries without hitting `auth.users`
- ✅ Complete visibility of all users in DB
- ✅ Automatic sync via trigger

## Key Tables

Core tables (to be created during schema design):

**Auth:**
- `users` - Mirror of auth.users
- `staff_members` - Themison staff (@themison.com)
- `organization_members` - Users in orgs with `org_role`
- `invitations` - Track pending/accepted/expired invitations

**Multi-tenancy:**
- `organizations` - Multi-tenant root
- `trials` - Clinical trials within orgs
- `trial_team_members` - Users assigned to trials with `trial_role`

**Patients & Visits:**
- `patients` - Enrolled in specific trials
- `visits` - Patient visit schedule instances
- `visit_activities` - Activities within visits

**Tasks & Documents:**
- `tasks` - Work items for team members
- `documents` - Trial and patient documents (RAG-indexed)

**Communication:**
- `messages` - Communication hub threads
- `message_participants` - To/CC recipients

**Response Archive:**
- `response_folders` - User-created folders
- `response_snippets` - Saved RAG responses

**Audit:**
- `audit_logs` - Immutable action log

## Environment Variables

Expected configuration in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://npfouzkvpnyjusdozymu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

## API Access

When using the Supabase MCP plugin, all operations should target:

```javascript
project_id: "npfouzkvpnyjusdozymu"
```

Example operations:
- `list_tables` - View current schema
- `execute_sql` - Query data (read-only for safety)
- `apply_migration` - DDL operations (schema changes)
- `get_advisors` - Security and performance checks

## Notes

- Always use the `npfouzkvpnyjusdozymu` project ID when working with Supabase MCP tools
- Check for advisor warnings after schema changes using `get_advisors`
- Use migrations for all DDL changes (never execute DDL via `execute_sql`)
- Project is in eu-west-1 (Ireland) region
