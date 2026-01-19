# Permissions System

This document describes the complete permissions system, including the permission matrix, middleware stack, and usage patterns.

---

## Table of Contents

- [Permission Matrix](#permission-matrix)
- [Middleware Stack](#middleware-stack)
- [API Examples](#api-examples)
- [Frontend Hooks](#frontend-hooks)
- [Route Protection](#route-protection)

---

## Permission Matrix

Permissions are defined in `lib/permissions/constants.ts:13-226` and organized into two levels:

1. **Organization-level permissions** (based on `org_role`)
2. **Trial-level permissions** (based on `org_role` + `trial_role`)

### Organization Roles

```typescript
type OrgRole = "superadmin" | "admin" | "editor" | "reader";
```

### Trial Roles

```typescript
type TrialRole =
  | "PI" // Principal Investigator
  | "CRC" // Clinical Research Coordinator
  | "Physician"
  | "Nurse"
  | "Data Manager"
  | "Laboratory"
  | "Pharmacist"
  | "Monitor"
  | "CR"; // Clinical Researcher
```

### Organization-Level Permissions

| Permission           | superadmin | admin | editor             | reader             |
| -------------------- | ---------- | ----- | ------------------ | ------------------ |
| **Trials**           |            |       |                    |                    |
| `canViewAllTrials`   | ✅         | ✅    | ❌ (assigned only) | ❌ (assigned only) |
| `canCreateTrial`     | ✅         | ✅    | ❌                 | ❌                 |
| **Organization**     |            |       |                    |                    |
| `canInviteMembers`   | ✅         | ✅    | ❌                 | ❌                 |
| `canRemoveMembers`   | ✅         | ✅    | ❌                 | ❌                 |
| `canManageOrg`       | ✅         | ✅    | ❌                 | ❌                 |
| `canViewOrgSettings` | ✅         | ✅    | ❌                 | ❌                 |

**Source:** `lib/permissions/constants.ts:61-94`

**Key insight:**

- `superadmin` and `admin` have identical permissions
- `editor` and `reader` can only view trials they're assigned to
- Only admins can manage organization settings

### Trial-Level Permissions

Trial permissions depend on **both** `org_role` and `trial_role`:

| Permission          | Org Admin | PI  | CRC | Other Trial Roles |
| ------------------- | --------- | --- | --- | ----------------- |
| **View**            |           |     |     |                   |
| `canViewTrial`      | ✅        | ✅  | ✅  | ✅                |
| `canViewTeam`       | ✅        | ✅  | ✅  | ✅                |
| `canViewPatients`   | ✅        | ✅  | ✅  | ✅                |
| `canViewTasks`      | ✅        | ✅  | ✅  | ✅                |
| **Edit**            |           |     |     |                   |
| `canEditTrial`      | ✅        | ✅  | ✅  | ❌                |
| `canDeleteTrial`    | ✅        | ✅  | ❌  | ❌                |
| **Team**            |           |     |     |                   |
| `canManageTeam`     | ✅        | ✅  | ✅  | ❌                |
| `canAssignPI`       | ✅        | ❌  | ❌  | ❌                |
| **Patients/Tasks**  |           |     |     |                   |
| `canManagePatients` | ✅        | ✅  | ✅  | ✅                |
| `canManageTasks`    | ✅        | ✅  | ✅  | ✅                |

**Source:** `lib/permissions/constants.ts:140-171`

**Key insights:**

- Org admins have full access to all trials (even without trial assignment)
- PI and CRC are "critical roles" with extended permissions
- Only org admins can assign/change the PI role
- Any trial team member can manage patients and tasks

**Permission calculation logic:**

```typescript
// lib/permissions/constants.ts:140-171
export function getTrialPermissions(
  orgRole: OrgRole | null,
  trialRole: TrialRole | null
): TrialPermissions {
  const isOrgAdmin = orgRole && ADMIN_ORG_ROLES.includes(orgRole);
  const isCriticalRole = trialRole && CRITICAL_TRIAL_ROLES.includes(trialRole);
  const isTrialMember = !!trialRole;

  return {
    canViewTrial: isOrgAdmin || isTrialMember,
    canEditTrial: isOrgAdmin || isCriticalRole,
    canManageTeam: isOrgAdmin || isCriticalRole,
    canAssignPI: isOrgAdmin, // Only org admin!
    canDeleteTrial: isOrgAdmin || trialRole === "PI",
    canManagePatients: isOrgAdmin || isTrialMember,
    canManageTasks: isOrgAdmin || isTrialMember,
  };
}
```

---

## Middleware Stack

API routes use a composable middleware pattern:

```
withAuth → withOrgMember → withTrialMember → Handler
```

Each middleware adds context to the `user` object.

### withAuth

**Purpose:** Verify user is authenticated

**Location:** `lib/api/middleware/withAuth.ts`

**Provides:**

```typescript
{
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isStaff: boolean;
}
```

**Usage:**

```typescript
export const GET = withAuth(async (req, ctx, user) => {
  // user is authenticated
});
```

### withOrgMember

**Purpose:** Verify user is an active member of the organization

**Location:** `lib/api/middleware/withOrgMember.ts:33-91`

**Adds to user:**

```typescript
{
  orgMemberId: string; // Or 'staff' for staff users
  orgRole: OrgRole; // 'superadmin' | 'admin' | 'editor' | 'reader'
}
```

**Access rules:**

- Staff with `support_enabled` → allowed (role: `superadmin`)
- Active org member → allowed
- Otherwise → forbidden

**Example:** `app/api/client/[orgId]/trials/route.ts:20`

```typescript
export const GET = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;

  // user.orgRole available
  // user.orgMemberId available

  const canViewAll = user.isStaff || isAdminRole(user.orgRole);
  // ...
});
```

### withTrialMember

**Purpose:** Verify user has access to a specific trial

**Location:** `lib/api/middleware/withTrialMember.ts:63-120`

**Adds to user:**

```typescript
{
  trialRole: TrialRole | null; // null if org admin without trial assignment
}
```

**Access rules:**

- Org admin (superadmin/admin) → allowed (trialRole may be null)
- Staff with `support_enabled` → allowed
- Trial team member → allowed (trialRole set)
- Otherwise → forbidden

**Example for READ (just check access):**

```typescript
export const GET = withTrialMember(async (req, ctx, user) => {
  // User has access, fetch and return data
  const { trialId } = ctx.params;
  // ...
});
```

**Example for WRITE (check specific permission):**

```typescript
export const PATCH = withTrialMember(async (req, ctx, user) => {
  const perms = getTrialPermissions(user.orgRole, user.trialRole);

  if (!perms.canEditTrial) {
    return Response.json({ error: "Cannot edit this trial" }, { status: 403 });
  }

  // Proceed with update
});
```

---

## API Examples

### Organization-Scoped Endpoint

**List all trials in an organization:**

`app/api/client/[orgId]/trials/route.ts:20-121`

```typescript
import { withOrgMember } from "@/lib/api/middleware";
import { isAdminRole } from "@/lib/permissions/constants";

export const GET = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();

  // Check if user can view all trials
  const canViewAll = user.isStaff || isAdminRole(user.orgRole);

  let query = supabase
    .from("trials")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null);

  // If editor/reader, filter to only assigned trials
  if (!canViewAll) {
    const { data: memberTrials } = await supabase
      .from("trial_team_members")
      .select("trial_id")
      .eq("org_member_id", user.orgMemberId);

    const trialIds = (memberTrials || []).map((m) => m.trial_id);

    if (trialIds.length === 0) {
      return Response.json({ trials: [], total: 0 });
    }

    query = query.in("id", trialIds);
  }

  const { data: trials } = await query;
  return Response.json({ trials, total: trials.length });
});
```

**Create a trial (admin only):**

`app/api/client/[orgId]/trials/route.ts:128-175`

```typescript
import { withOrgMember } from "@/lib/api/middleware";
import { isAdminRole } from "@/lib/permissions/constants";

export const POST = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;

  // Check permission (only admins can create trials)
  const perms = getOrgPermissions(user.orgRole);
  if (!perms.canCreateTrial) {
    return Response.json(
      { error: "You do not have permission to create trials" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const supabase = await createClient();

  const { data: trial } = await supabase
    .from("trials")
    .insert({
      org_id: orgId,
      name: body.name,
      protocol_number: body.protocol_number,
      // ...
    })
    .select()
    .single();

  return Response.json(trial, { status: 201 });
});
```

### Trial-Scoped Endpoint

**Get trial details:**

```typescript
import { withTrialMember } from "@/lib/api/middleware";

export const GET = withTrialMember(async (req, ctx, user) => {
  const { trialId } = ctx.params;
  const supabase = await createClient();

  // User has access (middleware verified)
  const { data: trial } = await supabase
    .from("trials")
    .select("*")
    .eq("id", trialId)
    .single();

  return Response.json(trial);
});
```

**Update trial (PI/CRC/admin only):**

```typescript
import { withTrialMember } from "@/lib/api/middleware";
import { getTrialPermissions } from "@/lib/permissions/constants";

export const PATCH = withTrialMember(async (req, ctx, user) => {
  const { trialId } = ctx.params;

  // Check specific permission
  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canEditTrial) {
    return Response.json(
      { error: "You do not have permission to edit this trial" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const supabase = await createClient();

  const { data: trial } = await supabase
    .from("trials")
    .update(body)
    .eq("id", trialId)
    .select()
    .single();

  return Response.json(trial);
});
```

---

## Frontend Hooks

Frontend uses hooks to get permissions for conditional rendering. **Backend still validates - never trust frontend.**

### usePermissions (Org-level)

**Location:** `hooks/usePermissions.ts`

**Usage:**

```typescript
"use client";

import { usePermissions } from "@/hooks/usePermissions";

export function TrialsList({ orgId }: Props) {
  const { canCreateTrial, canInviteMembers, isLoading } = usePermissions(orgId);

  return (
    <div>
      {canCreateTrial && <Button onClick={handleCreate}>Create Trial</Button>}
    </div>
  );
}
```

**Returns:**

```typescript
{
  // Organization permissions
  canViewAllTrials: boolean;
  canCreateTrial: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canManageOrg: boolean;
  canViewOrgSettings: boolean;

  // Role info
  orgRole: OrgRole | null;
  isLoading: boolean;
}
```

### useTrialPermissions (Trial-level)

**Location:** `hooks/useTrialPermissions.ts:41-82`

**Usage:**

```typescript
'use client';

import { useTrialPermissions } from '@/hooks/useTrialPermissions';

export function TrialView({ orgId, teamMembers }: Props) {
  const {
    canEditTrial,
    canManageTeam,
    canAssignPI,
    isLoading
  } = useTrialPermissions(orgId, teamMembers);

  return (
    <div>
      {canEditTrial && <EditableField ... />}
      {canManageTeam && <AddTeamMemberButton />}
      {canAssignPI && <AssignPIDropdown />}
    </div>
  );
}
```

**Parameters:**

- `orgId: string` - Organization ID
- `teamMembers: TrialTeamMember[]` - Team members from `useTrialDetails()`

**Returns:**

```typescript
{
  // Trial permissions
  canViewTrial: boolean;
  canEditTrial: boolean;
  canDeleteTrial: boolean;
  canViewTeam: boolean;
  canManageTeam: boolean;
  canAssignPI: boolean;
  canViewPatients: boolean;
  canManagePatients: boolean;
  canViewTasks: boolean;
  canManageTasks: boolean;

  // Role info
  orgRole: OrgRole | null;
  trialRole: TrialRole | null;
  isTrialMember: boolean;
  isLoading: boolean;
}
```

---

## Route Protection

### Layout Guards

**Location:** `lib/auth/guards.ts`

**Pattern:** Server-side guards in layouts

```typescript
// app/[orgId]/layout.tsx
import { requireOrgAccess } from "@/lib/auth/guards";

export default async function OrgLayout({
  params,
  children,
}: {
  params: { orgId: string };
  children: React.ReactNode;
}) {
  // Redirects to /signin if not authenticated or not a member
  await requireOrgAccess(params.orgId);

  return <AppMain orgId={params.orgId}>{children}</AppMain>;
}
```

**Why layouts instead of middleware?**

- More granular control
- Access to route params
- Easier to debug
- Better error handling

---

## Summary

1. **Backend always validates** - Frontend permissions are hints for UI only
2. **Two-level permissions** - Organization (org_role) + Trial (org_role + trial_role)
3. **Composable middleware** - `withAuth` → `withOrgMember` → `withTrialMember`
4. **Frontend hooks** - `usePermissions()` and `useTrialPermissions()`
5. **Layout guards** - `requireOrgAccess()` for route protection

**Permission matrix source of truth:** `lib/permissions/constants.ts`

For architecture details, see [ARCHITECTURE.md](ARCHITECTURE.md).
For backend patterns, see [BACKEND.md](BACKEND.md).
