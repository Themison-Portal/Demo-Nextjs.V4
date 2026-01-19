# Backend Guide

This document describes backend patterns, API route structure, middleware, database access, and critical conventions.

---

## Table of Contents

- [API Route Structure](#api-route-structure)
- [Middleware Pattern](#middleware-pattern)
- [Database Access](#database-access)
- [Soft Deletes](#soft-deletes)
- [Error Handling](#error-handling)
- [Audit Logging](#audit-logging-future)

---

## API Route Structure

API routes follow Next.js App Router conventions with a clear separation between client and console endpoints.

### Directory Structure

```
app/api/
├── client/[orgId]/          # Client-facing endpoints (clinics)
│   ├── me/                  # Current user membership info
│   ├── trials/
│   │   ├── route.ts         # GET: list trials, POST: create trial
│   │   └── [trialId]/
│   │       ├── route.ts     # GET: trial details, PATCH: update trial
│   │       └── team/
│   │           └── route.ts # GET: team members, POST: add member
│   └── organization/
│       └── route.ts
│
└── console/                 # Staff-only endpoints
    └── organizations/
        └── route.ts
```

### Route Naming Conventions

```
GET    /api/client/[orgId]/trials           # List trials
POST   /api/client/[orgId]/trials           # Create trial
GET    /api/client/[orgId]/trials/[id]      # Get trial details
PATCH  /api/client/[orgId]/trials/[id]      # Update trial
DELETE /api/client/[orgId]/trials/[id]      # Soft delete trial
```

**Never use:**
- `/api/client/[orgId]/trials/all` (redundant - use GET on collection)
- `/api/client/[orgId]/trials/create` (use POST on collection)
- `/api/client/[orgId]/trials/[id]/update` (use PATCH on resource)

---

## Middleware Pattern

All API routes use composable middleware for authentication and authorization.

### Middleware Stack

```
withAuth → withOrgMember → withTrialMember → Handler
```

Each middleware:
1. Validates access
2. Adds context to `user` object
3. Calls next middleware or handler
4. Returns error response if validation fails

### 1. withAuth

**Location:** `lib/api/middleware/withAuth.ts`

**Purpose:** Verify user is authenticated

**Usage:**

```typescript
import { withAuth } from '@/lib/api/middleware';

export const GET = withAuth(async (req, ctx, user) => {
  // user.id, user.email, user.isStaff available
  // No organization or trial context yet
});
```

**User object:**

```typescript
{
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isStaff: boolean;
}
```

### 2. withOrgMember

**Location:** `lib/api/middleware/withOrgMember.ts`

**Purpose:** Verify user is an active member of the organization

**Usage:**

```typescript
import { withOrgMember } from '@/lib/api/middleware';

export const GET = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;

  // user.orgRole, user.orgMemberId available
  // Can check org-level permissions
});
```

**User object (extends withAuth):**

```typescript
{
  id: string;
  email: string;
  isStaff: boolean;
  orgMemberId: string;        // Or 'staff' for staff users
  orgRole: OrgRole;           // 'superadmin' | 'admin' | 'editor' | 'reader'
}
```

**Example:** `app/api/client/[orgId]/trials/route.ts:20-48`

```typescript
export const GET = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();

  // Check if user can view all trials
  const canViewAll = user.isStaff || isAdminRole(user.orgRole);

  let query = supabase
    .from('trials')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null);

  // If editor/reader, filter to assigned trials
  if (!canViewAll) {
    const { data: memberTrials } = await supabase
      .from('trial_team_members')
      .select('trial_id')
      .eq('org_member_id', user.orgMemberId);

    const trialIds = (memberTrials || []).map(m => m.trial_id);
    query = query.in('id', trialIds);
  }

  const { data: trials } = await query;
  return Response.json({ trials });
});
```

### 3. withTrialMember

**Location:** `lib/api/middleware/withTrialMember.ts`

**Purpose:** Verify user has access to a specific trial

**Usage:**

```typescript
import { withTrialMember } from '@/lib/api/middleware';

export const GET = withTrialMember(async (req, ctx, user) => {
  const { trialId } = ctx.params;

  // user.trialRole available
  // Can check trial-level permissions
});
```

**User object (extends withOrgMember):**

```typescript
{
  id: string;
  email: string;
  isStaff: boolean;
  orgMemberId: string;
  orgRole: OrgRole;
  trialRole: TrialRole | null;  // null if org admin without trial assignment
}
```

**Example (READ - just check access):**

```typescript
export const GET = withTrialMember(async (req, ctx, user) => {
  const { trialId } = ctx.params;
  // User has access, fetch and return data
});
```

**Example (WRITE - check specific permission):**

```typescript
import { getTrialPermissions } from '@/lib/permissions/constants';

export const PATCH = withTrialMember(async (req, ctx, user) => {
  const perms = getTrialPermissions(user.orgRole, user.trialRole);

  if (!perms.canEditTrial) {
    return Response.json(
      { error: 'Cannot edit this trial' },
      { status: 403 }
    );
  }

  // Proceed with update
});
```

---

## Database Access

### Supabase Server Client

**Always use server client in API routes:**

```typescript
import { createClient } from '@/lib/supabase/server';

export const GET = withAuth(async (req, ctx, user) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('trials')
    .select('*')
    .eq('org_id', orgId);

  if (error) {
    console.error('[API] Database error:', error);
    return Response.json(
      { error: 'Failed to fetch trials' },
      { status: 500 }
    );
  }

  return Response.json({ trials: data });
});
```

**Never use client-side Supabase in API routes:**

```typescript
// ❌ WRONG - Don't use client-side client in API routes
import { createClient } from '@/lib/supabase/client';
```

### Query Patterns

**Select with joins:**

```typescript
const { data: trials } = await supabase
  .from('trials')
  .select(`
    *,
    trial_team_members (
      id,
      trial_role,
      organization_members:org_member_id (
        user:user_id (
          id,
          email,
          full_name
        )
      )
    )
  `)
  .eq('org_id', orgId)
  .is('deleted_at', null);
```

**Filter out soft-deleted related records:**

```typescript
const transformedTrials = trials.map((trial) => {
  // Filter out team members whose org membership was deleted
  const teamMembers = (trial.trial_team_members || []).filter(
    (m) => m.organization_members?.deleted_at === null
  );

  return {
    ...trial,
    team_members: teamMembers,
  };
});
```

**Insert with RETURNING:**

```typescript
const { data: trial, error } = await supabase
  .from('trials')
  .insert({
    org_id: orgId,
    name: 'Trial Name',
    protocol_number: 'PROTO-001',
    status: 'active',
  })
  .select()
  .single();
```

**Update:**

```typescript
const { data: trial, error } = await supabase
  .from('trials')
  .update({
    name: 'Updated Name',
    updated_at: new Date().toISOString(),
  })
  .eq('id', trialId)
  .select()
  .single();
```

---

## Soft Deletes

**CRITICAL:** Never hard delete records. Always use soft deletes.

### Pattern

```typescript
// ❌ WRONG - Never hard delete
await supabase
  .from('trials')
  .delete()
  .eq('id', trialId);

// ✅ RIGHT - Soft delete
await supabase
  .from('trials')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', trialId);
```

### Always filter out deleted records

```typescript
// Read operations - filter deleted
const { data } = await supabase
  .from('trials')
  .select('*')
  .eq('org_id', orgId)
  .is('deleted_at', null);  // CRITICAL: Always add this filter
```

### Cascade soft deletes

When deleting a parent record, soft delete related records:

```typescript
// Soft delete trial
await supabase
  .from('trials')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', trialId);

// Soft delete related team members
await supabase
  .from('trial_team_members')
  .update({ deleted_at: new Date().toISOString() })
  .eq('trial_id', trialId);

// Soft delete related patients
await supabase
  .from('patients')
  .update({ deleted_at: new Date().toISOString() })
  .eq('trial_id', trialId);
```

**Note:** Consider using database triggers for cascade soft deletes in the future.

---

## Error Handling

### Standard Error Response

```typescript
// 400 - Bad Request (validation error)
return Response.json(
  { error: 'Trial name is required' },
  { status: 400 }
);

// 401 - Unauthorized (not authenticated)
return Response.json(
  { error: 'Authentication required' },
  { status: 401 }
);

// 403 - Forbidden (authenticated but no permission)
return Response.json(
  { error: 'You do not have permission to edit this trial' },
  { status: 403 }
);

// 404 - Not Found
return Response.json(
  { error: 'Trial not found' },
  { status: 404 }
);

// 500 - Internal Server Error
return Response.json(
  { error: 'Failed to fetch trials' },
  { status: 500 }
);
```

### Error Logging

**Always log database errors:**

```typescript
const { data, error } = await supabase
  .from('trials')
  .select('*');

if (error) {
  console.error('[API] Error fetching trials:', error);
  return Response.json(
    { error: 'Failed to fetch trials' },
    { status: 500 }
  );
}
```

**Log context for debugging:**

```typescript
console.log('[API] Editor/Reader trial access check:', {
  userId: user.id,
  orgMemberId: user.orgMemberId,
  orgRole: user.orgRole,
  trialIds,
});
```

---

## Audit Logging (Future)

Audit logging is planned but not yet implemented. When implemented, it should log all mutations.

### Planned Pattern

```typescript
export const PATCH = withTrialMember(async (req, ctx, user) => {
  const { trialId } = ctx.params;
  const body = await req.json();

  // Fetch current state for audit log
  const { data: before } = await supabase
    .from('trials')
    .select('*')
    .eq('id', trialId)
    .single();

  // Perform update
  const { data: after } = await supabase
    .from('trials')
    .update(body)
    .eq('id', trialId)
    .select()
    .single();

  // Log audit event
  await supabase.from('audit_logs').insert({
    action: 'trial.update',
    user_id: user.id,
    org_id: before.org_id,
    trial_id: trialId,
    resource_type: 'trial',
    resource_id: trialId,
    before,
    after,
    ip_address: req.headers.get('x-forwarded-for'),
    user_agent: req.headers.get('user-agent'),
  });

  return Response.json(after);
});
```

**Audit log schema (planned):**

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,           -- 'trial.create', 'trial.update', 'trial.delete'
  user_id UUID NOT NULL,
  org_id UUID,
  trial_id UUID,
  resource_type TEXT NOT NULL,    -- 'trial', 'patient', 'team_member'
  resource_id UUID NOT NULL,
  before JSONB,                   -- State before change
  after JSONB,                    -- State after change
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Complete API Route Example

**Full example with all best practices:**

`app/api/client/[orgId]/trials/[trialId]/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { withTrialMember } from '@/lib/api/middleware';
import { getTrialPermissions } from '@/lib/permissions/constants';

/**
 * GET /api/client/[orgId]/trials/[trialId]
 * Get trial details
 */
export const GET = withTrialMember(async (req, ctx, user) => {
  const { trialId } = ctx.params;
  const supabase = await createClient();

  const { data: trial, error } = await supabase
    .from('trials')
    .select(`
      *,
      trial_team_members (
        id,
        trial_role,
        organization_members:org_member_id (
          deleted_at,
          user:user_id (
            id,
            email,
            full_name
          )
        )
      )
    `)
    .eq('id', trialId)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('[API] Error fetching trial:', error);
    return Response.json(
      { error: 'Failed to fetch trial' },
      { status: 500 }
    );
  }

  // Filter out deleted team members
  const teamMembers = (trial.trial_team_members || []).filter(
    (m) => m.organization_members?.deleted_at === null
  );

  return Response.json({
    ...trial,
    team_members: teamMembers,
  });
});

/**
 * PATCH /api/client/[orgId]/trials/[trialId]
 * Update trial
 * Requires: canEditTrial permission (admin, PI, or CRC)
 */
export const PATCH = withTrialMember(async (req, ctx, user) => {
  const { trialId } = ctx.params;

  // Check permission
  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canEditTrial) {
    return Response.json(
      { error: 'You do not have permission to edit this trial' },
      { status: 403 }
    );
  }

  // Parse and validate input
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { name, protocol_number, phase, description } = body;

  if (name !== undefined && (!name || typeof name !== 'string')) {
    return Response.json(
      { error: 'Invalid trial name' },
      { status: 400 }
    );
  }

  // Update trial
  const supabase = await createClient();
  const { data: trial, error } = await supabase
    .from('trials')
    .update({
      ...(name && { name: name.trim() }),
      ...(protocol_number !== undefined && { protocol_number }),
      ...(phase !== undefined && { phase }),
      ...(description !== undefined && { description }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', trialId)
    .select()
    .single();

  if (error) {
    console.error('[API] Error updating trial:', error);
    return Response.json(
      { error: 'Failed to update trial' },
      { status: 500 }
    );
  }

  return Response.json(trial);
});
```

---

## Summary

1. **Use middleware** - `withAuth` → `withOrgMember` → `withTrialMember` for all routes
2. **Soft deletes only** - Never hard delete, always use `deleted_at`
3. **Filter deleted records** - Always `.is('deleted_at', null)` in queries
4. **Server-side Supabase** - Use `createClient()` from `@/lib/supabase/server`
5. **Log errors** - Console log all database errors with context
6. **Validate input** - Check required fields and types before database operations
7. **Standard error responses** - Use consistent error format with proper status codes

For permission details, see [PERMISSIONS.md](PERMISSIONS.md).
For architecture patterns, see [ARCHITECTURE.md](ARCHITECTURE.md).
