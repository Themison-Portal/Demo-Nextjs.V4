# Themison Product Demo Backend Architecture

## Stack

- Next.js 16.1.1 App Router → API routes in `app/api/`
- Supabase server client for DB queries
- Supabase Auth → magic link, password setup, login

---

## Permission layers

Two layers of permission checks:

| Layer          | Question                                    | Where            |
| -------------- | ------------------------------------------- | ---------------- |
| **Middleware** | Can user access this scope?                 | Wrapper function |
| **Handler**    | Can user operate on this specific resource? | Inside handler   |

---

## Middleware: Scope access

Three levels:

| Level      | Who passes                                          | Use for                                      |
| ---------- | --------------------------------------------------- | -------------------------------------------- |
| `org`      | superadmin, admin, staff+support                    | Create trial, invite members, org settings   |
| `trial`    | trial_team member, superadmin, admin, staff+support | Create patient, create task, upload document |
| `critical` | PI, CRC, superadmin, admin, staff+support           | Delete, reassign, configure schedule         |

**Implementation:**

```typescript
// lib/middleware.ts

export const withAuth =
  (handler: AuthHandler) => async (req: Request, ctx: Context) => {
    const user = await getUser(req);
    if (!user) return unauthorized();
    return handler(req, ctx, user);
  };

export const withOrgPermission = (handler: AuthHandler) =>
  withAuth(async (req, ctx, user) => {
    const orgId = ctx.params.orgId;

    // Staff with support
    if (user.role === "staff") {
      const org = await getOrg(orgId);
      if (!org.support_enabled) return forbidden();
      return handler(req, ctx, user);
    }

    // Must be superadmin or admin
    if (!["superadmin", "admin"].includes(user.org_role)) {
      return forbidden();
    }

    return handler(req, ctx, user);
  });

export const withTrialPermission = (handler: AuthHandler) =>
  withAuth(async (req, ctx, user) => {
    const trialId = ctx.params.trialId;
    const orgId = await getOrgFromTrial(trialId);

    // Staff with support
    if (user.role === "staff") {
      const org = await getOrg(orgId);
      if (!org.support_enabled) return forbidden();
      return handler(req, ctx, user);
    }

    // Superadmin/admin override
    if (["superadmin", "admin"].includes(user.org_role)) {
      return handler(req, ctx, user);
    }

    // Must be in trial team
    const member = await getTrialMember(user.id, trialId);
    if (!member) return forbidden();

    return handler(req, ctx, user);
  });

export const withCriticalPermission = (handler: AuthHandler) =>
  withAuth(async (req, ctx, user) => {
    const trialId = ctx.params.trialId;
    const orgId = await getOrgFromTrial(trialId);

    // Staff with support
    if (user.role === "staff") {
      const org = await getOrg(orgId);
      if (!org.support_enabled) return forbidden();
      return handler(req, ctx, user);
    }

    // Superadmin/admin override
    if (["superadmin", "admin"].includes(user.org_role)) {
      return handler(req, ctx, user);
    }

    // Must be PI or CRC
    const member = await getTrialMember(user.id, trialId);
    if (!member || !["PI", "CRC"].includes(member.trial_role)) {
      return forbidden();
    }

    return handler(req, ctx, user);
  });
```

**Usage:**

```typescript
// app/api/orgs/[orgId]/trials/route.ts
export const POST = withOrgPermission(async (req, ctx, user) => {
  // create trial
});

// app/api/trials/[trialId]/tasks/route.ts
export const POST = withTrialPermission(async (req, ctx, user) => {
  // create task
});

// app/api/trials/[trialId]/tasks/[taskId]/route.ts
export const DELETE = withCriticalPermission(async (req, ctx, user) => {
  // soft delete task
});
```

---

## Handler: Resource-specific checks

Some permissions depend on the specific resource, not just the scope.

| Case                  | Check                         |
| --------------------- | ----------------------------- |
| Update task status    | Assignee OR PI/CRC            |
| Reassign task         | PI, CRC, OR original assignee |
| View message          | User is in To OR CC           |
| Manage archive folder | User owns the folder          |

**These checks go inside the handler, after middleware:**

```typescript
// app/api/trials/[trialId]/tasks/[taskId]/status/route.ts

export const PATCH = withTrialPermission(async (req, ctx, user) => {
  const task = await getTask(ctx.params.taskId);

  // Resource-specific check
  const isAssignee = task.assigned_to_id === user.id;
  const isPIorCRC = await checkTrialRole(user.id, task.trial_id, ["PI", "CRC"]);

  if (!isAssignee && !isPIorCRC) {
    return forbidden();
  }

  // update status...
});
```

```typescript
// app/api/trials/[trialId]/tasks/[taskId]/reassign/route.ts

export const PATCH = withTrialPermission(async (req, ctx, user) => {
  const task = await getTask(ctx.params.taskId);

  // Resource-specific check
  const isOriginalAssignee = task.assigned_to_id === user.id;
  const isPIorCRC = await checkTrialRole(user.id, task.trial_id, ["PI", "CRC"]);

  if (!isOriginalAssignee && !isPIorCRC) {
    return forbidden();
  }

  // reassign...
});
```

```typescript
// app/api/trials/[trialId]/messages/[messageId]/route.ts

export const GET = withTrialPermission(async (req, ctx, user) => {
  const message = await getMessage(ctx.params.messageId);

  // Resource-specific check
  const isParticipant =
    message.to_ids.includes(user.id) ||
    message.cc_ids.includes(user.id) ||
    message.sender_id === user.id;

  if (!isParticipant) {
    return forbidden();
  }

  return Response.json(message);
});
```

---

## Summary

| What                          | Where                    | Example         |
| ----------------------------- | ------------------------ | --------------- |
| Can access org?               | `withOrgPermission`      | Create trial    |
| Can access trial?             | `withTrialPermission`    | Create task     |
| Can do critical actions?      | `withCriticalPermission` | Delete patient  |
| Can operate on this resource? | Inside handler           | Update own task |

---

## Soft deletes

All delete operations use soft delete:

```typescript
// WRONG
await supabase.from("tasks").delete().eq("id", taskId);

// RIGHT
await supabase
  .from("tasks")
  .update({ deleted_at: new Date().toISOString() })
  .eq("id", taskId);
```

All queries filter out deleted records:

```typescript
await supabase
  .from("tasks")
  .select("*")
  .eq("trial_id", trialId)
  .is("deleted_at", null); // Always include this
```

---

## Audit logging

### What it is

Immutable record of every mutation in the system. Required for clinical trial compliance. Superadmin can access for audits.

### Where it runs

**Backend only.** Never in frontend, never in services.

Why:

- Frontend is not trustworthy (user can manipulate)
- Backend has access to real state (before/after)
- It's a compliance requirement, not UX

### When to log

After every mutation that changes data:

- Create → log with `before: null`, `after: newRecord`
- Update → log with `before: oldRecord`, `after: newRecord`
- Delete → log with `before: oldRecord`, `after: null`

### What to log

| Field           | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| `action`        | What happened: `task.create`, `patient.delete`, `document.upload` |
| `user_id`       | Who did it                                                        |
| `org_id`        | Organization context                                              |
| `trial_id`      | Trial context (if applicable)                                     |
| `resource_type` | Entity type: `task`, `patient`, `document`, `message`             |
| `resource_id`   | ID of affected resource                                           |
| `before`        | State before mutation (JSON)                                      |
| `after`         | State after mutation (JSON)                                       |
| `ip_address`    | From request headers                                              |
| `user_agent`    | From request headers                                              |

### Usage pattern

```typescript
export const DELETE = withCriticalPermission(async (req, ctx, user) => {
  const task = await getTask(ctx.params.taskId);

  // 1. Execute mutation
  await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", task.id);

  // 2. Log after mutation succeeds
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

  return Response.json({ success: true });
});
```

### Action naming convention

Format: `resource.action`

Examples:

- `task.create`
- `task.update`
- `task.delete`
- `task.reassign`
- `patient.enroll`
- `document.upload`
- `message.send`
- `trial.pause`
- `member.invite`
