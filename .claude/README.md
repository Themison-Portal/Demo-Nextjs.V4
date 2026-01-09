# Themison - Clinical Trials Management System

## What is Themison?

Themison is a comprehensive clinical trial management platform designed for research organizations to manage trials, patients, documents, tasks, and team communication in a single unified system. The platform combines traditional trial management with AI-powered document assistance (RAG) to help research teams quickly extract information from protocol documents.

## Core Capabilities

- **Multi-tenant architecture** - Organizations manage multiple trials with granular permissions
- **Patient management** - Enroll patients, track visits, monitor progress against protocol schedules
- **Document Assistant (RAG)** - Query protocol documents using AI to extract specific information
- **Task management** - Auto-generated tasks from visit schedules with team assignment rules
- **Communication hub** - Internal messaging between trial team members
- **Response archive** - Save and organize AI-generated responses into personal folders
- **Audit logging** - Complete immutable audit trail for compliance

## Tech Stack

**Frontend:**
- Next.js 16.1.1 (App Router)
- React + TypeScript
- Zustand (UI state)
- TanStack Query (data fetching)

**Backend:**
- Next.js API routes (`app/api/`)
- Supabase (PostgreSQL + Auth)
- RAG/AI integration for document querying

**Architecture:**
- Layered: `Component → Hook → Service → Backend`
- Never skip layers - strict separation of concerns

## Supabase Project

**Project:** demo
**ID:** `npfouzkvpnyjusdozymu`
**Region:** eu-west-1
**Status:** ACTIVE_HEALTHY
**PostgreSQL:** v17.6

## Key Architectural Decisions

1. **Patients belong to trials** (not organization-wide)
2. **Two permission scopes:** Organization scope (create/pause trials) vs Trial scope (everything within trial)
3. **Three permission levels:** Standard (trial team), Critical (PI/CRC only), Extraordinary (superadmin/admin override)
4. **Soft deletes everywhere** - `deleted_at` timestamp for compliance
5. **Audit logging in backend only** - Never in frontend or services
6. **Services can call other services** - Cross-domain operations encouraged

## Documentation Index

| File | Purpose |
|------|---------|
| **[architecture.md](./architecture.md)** | Layered architecture: Component→Hook→Service→Backend, folder structure |
| **[backend.md](./backend.md)** | Permission middleware, audit logging, soft deletes, API patterns |
| **[user-flows.md](./user-flows.md)** | All 40 user flows organized by area (setup, patients, documents, tasks, etc.) |
| **[permissions.md](./permissions.md)** | Complete permissions matrix: roles, scopes, critical vs standard actions |
| **[supabase.md](./supabase.md)** | Supabase project details, connection info, database patterns |
| **[REPORTS/](./REPORTS/)** | Implementation reports for features and fixes (chronological) |

## Important Conventions

### Never Skip Layers
```typescript
// WRONG
function TaskList() {
  const tasks = await taskService.getAll()
}

// RIGHT
function TaskList() {
  const { tasks } = useTasks(trialId)
}
```

### Always Use Middleware for Permissions
```typescript
// app/api/orgs/[orgId]/trials/route.ts
export const POST = withOrgPermission(async (req, ctx, user) => {
  // create trial
})
```

### Always Soft Delete
```typescript
// WRONG
await supabase.from('tasks').delete().eq('id', taskId)

// RIGHT
await supabase
  .from('tasks')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', taskId)
```

### Always Audit Log (Backend Only)
```typescript
// After mutation succeeds
await supabase.from('audit_logs').insert({
  action: 'task.delete',
  user_id: user.id,
  resource_id: task.id,
  before: task,
  after: null
})
```

## Quick Start Context

When working on Themison:
1. Check which **scope** the action belongs to (org vs trial)
2. Verify **permissions** required (standard vs critical)
3. Follow **architecture layers** strictly
4. Use **soft deletes** for all deletions
5. Add **audit logging** for all mutations (backend only)
6. Remember **superadmin/admin override** - they can access all trials

## Common Patterns

**Organization Scope Actions:**
- Create trial, invite members, pause trial
- Requires: `superadmin` or `admin`

**Trial Scope Actions (Standard):**
- Create patient, upload document, send message
- Requires: Any `trial_team` member

**Trial Scope Actions (Critical):**
- Delete patient, assign team members, configure visit schedule
- Requires: `PI` or `CRC` (or superadmin/admin override)

---

## Implementation Reports

When significant features or fixes are implemented, create a report in `.claude/REPORTS/`:

**Naming Convention:**

- Features: `[MONTH_DD-FEATURE_or_SCOPE-BRIEF_IDENTIFIER].md`
  - Example: `JAN_09-DATABASE-INITIAL_SCHEMA.md`
  - Example: `JAN_15-RAG-DOCUMENT_ASSISTANT.md`

- Fixes: `[MONTH_DD-FIX-FEATURE_or_SCOPE-BRIEF_IDENTIFIER].md`
  - Example: `JAN_10-FIX-RLS-PATIENT_POLICIES.md`
  - Example: `JAN_20-FIX-AUTH-EMAIL_CONFIRMATION.md`

**Report Template:**

```markdown
# [Feature/Fix Title]

**Date:** [Date]
**Project:** Themison
**Type:** FEATURE/FIX - [Scope]

## Summary
[Brief overview]

## Implementation Details
[What was done]

## Files Modified/Created
[List of changes]

## Testing
[How to test]

## Next Steps
[Follow-up tasks]

**Status:** ✅ COMPLETED
```

**Trigger Phrase:** When the user says "crear reporte" or "create report", generate a detailed implementation report for the work just completed.

---

For detailed information, see the other documentation files in this directory.
