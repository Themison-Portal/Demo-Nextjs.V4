# Architecture Guide

This document describes the folder structure, layer separation, state management, and naming conventions used in the Themison platform.

---

## Table of Contents

- [Folder Structure](#folder-structure)
- [Layer Separation](#layer-separation)
- [State Management](#state-management)
- [Naming Conventions](#naming-conventions)
- [Import Patterns](#import-patterns)
- [File Organization Rules](#file-organization-rules)

---

## Folder Structure

```
demo/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Public auth pages (signin, signup)
│   ├── [orgId]/                   # Organization-scoped app (protected)
│   │   ├── dashboard/
│   │   ├── trials/
│   │   ├── organization/
│   │   ├── settings/
│   │   └── layout.tsx             # Protected layout with requireOrgAccess()
│   └── api/                       # Backend API routes
│       ├── client/[orgId]/        # Client-facing endpoints
│       │   ├── trials/
│       │   ├── me/
│       │   └── organization/
│       └── console/               # Staff-only endpoints
│           └── organizations/
│
├── components/                    # UI components
│   ├── ui/                        # Headless components (Button, Card, etc.)
│   ├── auth/                      # Auth-related components
│   ├── app/                       # Client app components
│   │   ├── shared/                # Shared components (AppMain, AppSidebar)
│   │   ├── dashboard/
│   │   ├── trials/                # TrialView, TrialsList, TrialCard, etc.
│   │   └── organization/
│   └── console/                   # Staff console components
│
├── hooks/                         # React hooks (TanStack Query wrappers)
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   ├── useTrialPermissions.ts
│   └── client/                    # Client app hooks
│       ├── useOrganization.ts
│       ├── useTrials.ts
│       └── useTrialDetails.ts
│
├── services/                      # Service layer (pure functions)
│   ├── client/                    # Client app services
│   │   ├── organizations.ts
│   │   └── trials.ts
│   ├── console/                   # Console services
│   └── trials/
│       └── types.ts               # Shared types
│
├── lib/                           # Configuration & utilities
│   ├── api/middleware/            # API middleware
│   │   ├── withAuth.ts
│   │   ├── withOrgMember.ts
│   │   └── withTrialMember.ts
│   ├── auth/                      # Auth utilities
│   │   ├── getUser.ts             # Server-side auth
│   │   └── guards.ts              # Layout guards (requireOrgAccess)
│   ├── permissions/
│   │   └── constants.ts           # Permission matrix
│   ├── routes.ts                  # Centralized route definitions
│   └── supabase/
│       ├── client.ts              # Client-side Supabase client
│       └── server.ts              # Server-side Supabase client
│
├── .claude/                       # AI assistant documentation
│   ├── CLAUDE.md                  # Project rules for AI
│   ├── user-flows.md              # User flows by feature
│   └── REPORTS/                   # Historical reports
│
└── supabase/                      # Supabase config & migrations
    ├── migrations/                # Database migrations
    └── config.toml
```

---

## Layer Separation

The architecture follows a strict 4-layer pattern:

```
Component → Hook → Service → Backend
```

**Never skip layers.** Each layer has a specific responsibility.

### Layer 1: Components

**Responsibility:** UI rendering only, zero business logic

**Location:** `components/`

**Rules:**
- Accept props, render JSX
- Call hooks (never services directly)
- Use `'use client'` directive (all are Client Components)
- Zero data fetching logic

**Example:** `components/app/trials/TrialsList.tsx:14-24`

```typescript
'use client';

import { useTrials } from '@/hooks/client/useTrials';
import { usePermissions } from '@/hooks/usePermissions';

export function TrialsList({ orgId }: TrialsListProps) {
  const { trials, isLoading, error, createTrial } = useTrials(orgId);
  const { canCreateTrial } = usePermissions(orgId);

  // Just render - no business logic
  return (
    <div>
      {trials.map((trial) => (
        <TrialCard key={trial.id} {...trial} />
      ))}
    </div>
  );
}
```

### Layer 2: Hooks

**Responsibility:** Connect services to UI, manage TanStack Query cache

**Location:** `hooks/` and `hooks/client/`

**Rules:**
- Wrap service functions with `useQuery` or `useMutation`
- Manage cache invalidation
- Return loading/error states
- Must use `'use client'` directive

**Example:** `hooks/client/useTrials.ts:16-54`

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTrials, createTrial } from '@/services/client/trials';

export function useTrials(orgId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['client', 'trials', orgId];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getTrials(orgId),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateTrialInput) => createTrial(orgId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    trials: data?.trials || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
    createTrial: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
```

### Layer 3: Services

**Responsibility:** API calls to backend routes (pure functions)

**Location:** `services/client/` and `services/console/`

**Rules:**
- Pure functions (no React hooks)
- Call `fetch()` to API routes
- No `'use client'` directive (not React-specific)
- Can be used server-side or client-side

**Example:** `services/client/trials.ts:21-33`

```typescript
export async function getTrials(orgId: string): Promise<TrialListResponse> {
  const response = await fetch(`/api/client/${orgId}/trials`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch trials');
  }

  return response.json();
}
```

### Layer 4: Backend (API Routes)

**Responsibility:** Database access, permission validation, business logic

**Location:** `app/api/client/` and `app/api/console/`

**Rules:**
- Use middleware for auth/permissions
- Direct Supabase calls via `createClient()`
- Validate input
- Return JSON responses

**Example:** `app/api/client/[orgId]/trials/route.ts:20-48`

```typescript
import { createClient } from '@/lib/supabase/server';
import { withOrgMember } from '@/lib/api/middleware';
import { isAdminRole } from '@/lib/permissions/constants';

export const GET = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();

  const canViewAll = user.isStaff || isAdminRole(user.orgRole);

  let query = supabase
    .from('trials')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null);

  // If editor/reader, filter to only assigned trials
  if (!canViewAll) {
    const { data: memberTrials } = await supabase
      .from('trial_team_members')
      .select('trial_id')
      .eq('org_member_id', user.orgMemberId);

    const trialIds = (memberTrials || []).map((m) => m.trial_id);
    query = query.in('id', trialIds);
  }

  const { data: trials } = await query;
  return Response.json({ trials, total: trials.length });
});
```

---

## State Management

### TanStack Query for Backend Data

**All data from the backend uses TanStack Query** - never `useState`.

```typescript
// ❌ WRONG - Never use useState for backend data
const [trials, setTrials] = useState([]);
useEffect(() => {
  fetch('/api/trials').then(res => res.json()).then(setTrials);
}, []);

// ✅ RIGHT - Use TanStack Query
const { trials, isLoading } = useTrials(orgId);
```

**Why TanStack Query?**
- Automatic caching
- Background refetching
- Request deduplication
- Loading/error states
- Optimistic updates
- Cache invalidation

**Query Keys Convention:**

```typescript
// Format: [scope, resource, ...identifiers]
['client', 'trials', orgId]
['client', 'trial', orgId, trialId]
['console', 'organizations']
['console', 'organization', orgId]
```

### useState for Local UI State

Use `useState` ONLY for local UI state (not backend data):

```typescript
// ✅ Good uses of useState
const [isModalOpen, setIsModalOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [selectedTab, setSelectedTab] = useState('overview');
```

### No Zustand (Currently)

The codebase previously mentioned Zustand but **does not currently use it**. TanStack Query serves as the global state manager for backend data.

If Zustand is added in the future, it should ONLY manage UI state (sidebar open/closed, modal state, filters), never backend data.

---

## Naming Conventions

### Components

Components use function-based naming (not Next.js types):

| Pattern | Purpose | Example |
|---------|---------|---------|
| `*View.tsx` | Main view for a page/section | `TrialView.tsx`, `DashboardView.tsx` |
| `*List.tsx` | List of items | `TrialsList.tsx`, `OrganizationList.tsx` |
| `*Card.tsx` | Card component for single item | `TrialCard.tsx`, `OrganizationCard.tsx` |
| `*Modal.tsx` | Modal dialog | `CreateTrialModal.tsx`, `InviteMemberModal.tsx` |
| `*Form.tsx` | Form component | `TrialForm.tsx`, `OrganizationForm.tsx` |
| `*Shell.tsx` | Layout wrapper with navigation | `AppShell.tsx`, `ConsoleShell.tsx` |

**Never use:**
- `*Page.tsx` (reserved for Next.js `page.tsx`)
- `*Layout.tsx` (reserved for Next.js `layout.tsx`)

### Hooks

```typescript
// TanStack Query hooks (plural for lists)
useTrials()        // List of trials
useOrganizations() // List of organizations

// TanStack Query hooks (singular for single item)
useTrial()         // Single trial
useOrganization()  // Single organization

// Permission hooks
usePermissions()      // Org-level permissions
useTrialPermissions() // Trial-level permissions

// Auth hook
useAuth()          // Current user
```

### Services

```typescript
// services/client/trials.ts
export async function getTrials(orgId: string)
export async function getTrialById(orgId: string, trialId: string)
export async function createTrial(orgId: string, input: CreateTrialInput)
export async function updateTrial(orgId: string, trialId: string, input: UpdateTrialInput)
```

Naming pattern: `verb + Resource` (e.g., `getTrials`, `createTrial`, `updateTrial`)

---

## Import Patterns

### Always Use Path Alias

```typescript
// ✅ RIGHT - Use @ alias
import { Button } from '@/components/ui/button';
import { useTrials } from '@/hooks/client/useTrials';
import { createClient } from '@/lib/supabase/server';

// ❌ WRONG - Relative paths
import { Button } from '../../../components/ui/button';
```

### Import Order

```typescript
// 1. External packages
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

// 2. Internal imports (grouped by type)
import { useAuth } from '@/hooks/useAuth';
import { getTrials } from '@/services/client/trials';
import { ROUTES } from '@/lib/routes';

// 3. Types (can be inline or separate)
import type { Trial, CreateTrialInput } from '@/services/trials/types';
```

---

## File Organization Rules

### `app/` Directory

**Only Next.js files:**
- `page.tsx` - Page component
- `layout.tsx` - Layout wrapper
- `loading.tsx` - Loading state
- `error.tsx` - Error boundary
- `route.ts` - API route handler

**Pages are Server Components by default:**

```typescript
// app/[orgId]/trials/page.tsx
export default function TrialsPage({ params }: { params: { orgId: string } }) {
  return <TrialsList orgId={params.orgId} />;
}
```

**API routes use middleware:**

```typescript
// app/api/client/[orgId]/trials/route.ts
export const GET = withOrgMember(async (req, ctx, user) => {
  // Handler logic
});
```

### `components/` Directory

**Naming:**
- Files: PascalCase matching component name (`TrialCard.tsx`)
- Folders: lowercase with hyphens (`components/app/trials/`)

**Client Components:**

All UI components use `'use client'` directive:

```typescript
'use client';

export function TrialCard({ trial }: TrialCardProps) {
  // Component logic
}
```

### `hooks/` Directory

**Structure:**
- `hooks/` - Shared hooks (auth, permissions)
- `hooks/client/` - Client app hooks (trials, organizations)
- `hooks/console/` - Console hooks (if needed)

**All hooks are Client Components:**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';

export function useTrials(orgId: string) {
  // Hook logic
}
```

### `services/` Directory

**Pure functions, no React:**

```typescript
// NO 'use client' directive
// Can be used server-side or client-side

export async function getTrials(orgId: string) {
  // Service logic
}
```

**Structure:**
- `services/client/` - Client app services
- `services/console/` - Console services
- `services/[resource]/types.ts` - Shared types

---

## Server vs Client Components

### Server Components (Default in `app/`)

- Can fetch data directly
- Can use `createClient()` from `@/lib/supabase/server`
- Cannot use hooks or browser APIs
- Smaller bundle size

```typescript
// app/[orgId]/trials/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function TrialsPage({ params }: { params: { orgId: string } }) {
  const supabase = await createClient();
  const { data } = await supabase.from('trials').select('*');

  return <TrialsList trials={data} />;
}
```

### Client Components (`'use client'`)

- Can use hooks (useState, useEffect, TanStack Query)
- Can use browser APIs
- Required for interactivity

```typescript
'use client';

import { useTrials } from '@/hooks/client/useTrials';

export function TrialsList({ orgId }: TrialsListProps) {
  const { trials, isLoading } = useTrials(orgId);
  // ...
}
```

**General Rule:** Start with Server Components, add `'use client'` only when needed (hooks, interactivity, browser APIs).

---

## Summary

1. **Strict layers:** Component → Hook → Service → Backend (never skip)
2. **TanStack Query for all backend data** (never `useState`)
3. **Naming conventions:** `*View`, `*List`, `*Card`, `*Modal`, `*Form` (never `*Page`/`*Layout`)
4. **Path alias:** Always use `@/` (never relative paths)
5. **Server Components by default** in `app/`, Client Components everywhere else
6. **Pure functions in services** (no React hooks)

For permission system details, see [PERMISSIONS.md](PERMISSIONS.md).
For backend patterns, see [BACKEND.md](BACKEND.md).
For UI layout, see [UI_LAYOUT.md](UI_LAYOUT.md).
