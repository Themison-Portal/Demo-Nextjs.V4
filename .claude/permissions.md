# Clinical Trials Management System - Permissions Matrix

**Version:** 1.0 (Final)  
**Date:** January 5, 2026  
**Purpose:** Define who can perform each action in the system

---

## SCOPES

The system operates on **2 distinct scopes** that determine access and permissions:

### Organization Scope

Controls what happens at the organization level:

- Creating/deleting trials
- Pausing/resuming trials
- Inviting organization members
- Managing organization settings
- **Who can do it:** `superadmin` or `admin`

### Trial Scope

Controls everything that happens WITHIN a specific trial:

- Patients, tasks, documents, messages, visits
- **Who can do it (default):** Any `trial_team` member
- **Who can do critical actions:** `PI` or `CRC` (assign people, delete items, configure schedules)

### Extraordinary Permission (Override)

**`superadmin` and `admin` have automatic access to ALL trials**, even if not explicitly assigned to `trial_team`. When accessing a trial, they act as if they were a PI/CRC with full permissions.

This override is **implicit** and applies to all trial scope actions.

---

## ROLES

### Organization Roles

- **`superadmin`** - Complete control: can delete org/users, assign any role, full trial access
- **`admin`** - Same as superadmin EXCEPT cannot delete org/users
- **`editor`** - Can only access assigned trials, work within trials
- **`reader`** - View only in assigned trials

### Trial Roles (Descriptive + Permissions)

- **`PI`** (Principal Investigator) - Elevated permissions for critical actions
- **`CRC`** (Clinical Research Coordinator) - Elevated permissions for critical actions
- **`Physician`** - Descriptive, standard trial team member permissions
- **`Nurse`** - Descriptive, standard trial team member permissions
- **`Lab Technician`** - Descriptive, standard trial team member permissions
- **Custom role** - Text field for non-standard roles, standard permissions

### Staff Role (Themison only)

- **`staff`** - Themison employees (@themison.com)
  - Access via `/console` panel (separate from clinic users)
  - Do NOT belong to any organization by default
  - When `support_enabled = true` → Acts as `superadmin` within that org
  - When `support_enabled = false` → Zero access to that org
  - Can create new organizations
  - Can enable/disable support mode for any organization
  - Stored in `supabase.auth.users` with `role = 'staff'`

---

## PERMISSIONS BY SCOPE

### ORGANIZATION SCOPE ACTIONS

| Action                               | Who Can Do It        | Notes                                      |
| ------------------------------------ | -------------------- | ------------------------------------------ |
| Create organization                  | Staff                | Via `/console` panel                       |
| Delete organization                  | Staff or Superadmin  | Destructive action                         |
| Enable/disable support mode          | Staff                | Acts as superadmin when enabled            |
| Invite organization members          | Superadmin or Admin          | Only superadmin can assign superadmin role |
| Remove organization members          | Superadmin only              | Admin cannot delete users                  |
| Create trial                         | Superadmin or Admin          | Requires at least 1 org member exists      |
| Delete trial                         | Superadmin only              | Destructive action                         |
| Pause/resume trial                   | Superadmin or Admin          | Changes trial status                       |
| Configure organization settings      | Superadmin or Admin          | Features, preferences                      |
| View all trials                      | Superadmin or Admin          | Automatic access                           |
| View calendar (all trials)           | Superadmin or Admin          | Organization-level tool                    |
| View calendar (assigned trials only) | Editor or Reader             | Limited to trial_team assignments          |

---

### TRIAL SCOPE ACTIONS

**Note:** All actions below are accessible by `superadmin` and `admin` automatically (override), even if not in trial_team.

#### Setup & Team Management

| Action                            | Who Can Do It | Notes                                                   |
| --------------------------------- | ------------- | ------------------------------------------------------- |
| Assign team members to trial      | PI or CRC     | Critical: controls trial access                         |
| Remove team members from trial    | PI or CRC     | Critical action                                         |
| Configure visit schedule template | PI or CRC     | Critical: defines structure for all patients            |
| Modify visit schedule template    | PI or CRC     | Does NOT affect existing patients (simple MVP approach) |

#### Patient Management

| Action                  | Who Can Do It     | Notes                                   |
| ----------------------- | ----------------- | --------------------------------------- |
| Create patient          | Trial team member | Standard action                         |
| View patient dashboard  | Trial team member | Standard action                         |
| Edit patient info       | Trial team member | Standard action                         |
| Delete patient          | PI or CRC         | Critical action                         |
| Assign visit start date | Trial team member | Triggers visit generation from template |

#### Documents

| Action                   | Who Can Do It     | Notes                                         |
| ------------------------ | ----------------- | --------------------------------------------- |
| Upload trial documents   | Trial team member | Includes categorization (Protocol, ICF, etc.) |
| Upload patient documents | Trial team member | Patient-specific files                        |
| Upload visit documents   | Trial team member | Linked to patient + visit + activity          |
| Delete trial documents   | PI or CRC         | Critical action                               |
| Delete patient documents | PI or CRC         | Critical action                               |
| Query documents (RAG)    | Trial team member | Document Assistant access                     |

#### Response Archive

| Action                   | Who Can Do It     | Notes                       |
| ------------------------ | ----------------- | --------------------------- |
| Save response to archive | Trial team member | Personal folders only (MVP) |
| Create/manage folders    | Trial team member | Personal folders only (MVP) |
| Export response          | Trial team member | No restrictions             |

#### Tasks

| Action               | Who Can Do It                 | Notes                                            |
| -------------------- | ----------------------------- | ------------------------------------------------ |
| View tasks           | Trial team member             | Sees assigned/CC'd tasks                         |
| View all trial tasks | Trial team member             | Can filter by person/trial                       |
| Create task          | Trial team member             | From various sources (manual, patient, response) |
| Update task status   | Assigned user or PI/CRC       | Assignee + supervisors                           |
| Reassign task        | PI, CRC, or original assignee | Critical: changes responsibility                 |
| Delete task          | PI or CRC                     | Critical action                                  |

#### Communication Hub

| Action                 | Who Can Do It       | Notes                             |
| ---------------------- | ------------------- | --------------------------------- |
| View messages          | Trial team member   | Only messages where user is To/CC |
| Send message           | Trial team member   | Can message any trial team member |
| Reply to message       | Message participant | To or CC recipient                |
| Start new conversation | Trial team member   | Standard action                   |
| Attach task to message | Trial team member   | Task must exist in trial          |

#### Visits

| Action                  | Who Can Do It     | Notes                         |
| ----------------------- | ----------------- | ----------------------------- |
| Mark visit as completed | Trial team member | Updates visit status          |
| Upload visit documents  | Trial team member | Evidence for visit activities |
| Create task from visit  | Trial team member | Standard workflow             |

---

## SUPPORT MODE

| Scenario                  | Behavior                                                  |
| ------------------------- | --------------------------------------------------------- |
| `support_enabled = true`  | Staff members (@themison.com) act as `superadmin` within org |
| `support_enabled = false` | Staff members have zero access to org                     |

**How it works:**
- Staff members access organizations via `/console` panel
- They see list of all organizations with support_enabled toggle
- When support_enabled = true, staff can enter org and act as superadmin
- This allows Themison team to provide support, conduct showcases, or troubleshoot
- When support work complete, staff disables support mode to revoke access

---

## ACCESS RULES SUMMARY

1. **Organization scope:** Controlled by `org_role` (superadmin/admin only)
2. **Trial scope (standard):** Any `trial_team` member
3. **Trial scope (critical):** PI or CRC only
4. **Override exception:** Superadmin/admin can do EVERYTHING in any trial automatically
5. **Trial visibility:**
   - Superadmin/admin: See ALL trials
   - Editor/reader: See only assigned trials (must be in trial_team)
6. **Calendar visibility:**
   - Superadmin/admin: Cross-trial view (all tasks)
   - Editor/reader: Only tasks from assigned trials

---

## CRITICAL VS STANDARD ACTIONS

### Critical Actions (PI/CRC only)

- Assign/remove team members
- Configure/modify visit schedule
- Delete patients, documents, tasks
- Reassign tasks

### Standard Actions (Any trial team member)

- Create patients, tasks, documents
- View/edit patient info
- Upload documents
- Query Document Assistant
- Send messages
- Mark visits complete
- Update task status (if assigned)

---

## DECISIONS MADE

1. **Scopes:** Organization vs Trial - clearly separated ✅
2. **Override:** Superadmin/admin have full access to all trials ✅
3. **Critical actions:** PI/CRC for deletions, assignments, schedule config ✅
4. **Response folders:** Personal only (MVP) ✅
5. **Visit schedule modification:** Does NOT affect existing patients ✅
6. **Calendar:** Organization-scope tool, filtered by role ✅
7. **Document types:** Categorized when uploaded (Protocol, ICF, etc.) ✅
8. **Patient documents:** Same table as visit documents, optional visit/activity link ✅

---

## IMPLEMENTATION NOTES

### For DB Schema

- `users.role` enum: staff (for Themison employees)
- `org_role` enum: superadmin, admin, editor, reader (for organization members)
- `trial_role` in `trial_team_member`: PI, CRC, Physician, Nurse, Lab Technician, or custom text
- Staff members: stored in users table with role = 'staff', NOT in organization_membership
- Clinic users: stored in users table + organization_membership with org_role
- Trial access check: `(user IN trial_team) OR (org_role IN ['superadmin', 'admin']) OR (role = 'staff' AND support_enabled = true)`
- Critical action check: `(trial_role IN ['PI', 'CRC']) OR (org_role IN ['superadmin', 'admin']) OR (role = 'staff' AND support_enabled = true)`
- Consider soft deletes for audit trail

### For API/Backend

```javascript
// Staff access check helper
function isStaffWithSupport(user, org_id) {
  if (user.role !== 'staff') return false;
  
  const org = getOrganization(org_id);
  return org.support_enabled === true;
}

// Organization scope middleware
function requiresOrgPermission(requiredRole) {
  return (req, res, next) => {
    const org_id = req.params.org_id;
    
    // Staff with support enabled acts as superadmin
    if (req.user.role === 'staff' && isStaffWithSupport(req.user, org_id)) {
      req.actingAs = 'superadmin';
      return next();
    }
    
    // Regular org permission check
    if (!["superadmin", "admin"].includes(req.user.org_role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    if (requiredRole === "superadmin" && req.user.org_role !== "superadmin") {
      return res.status(403).json({ error: "Superadmin only" });
    }
    next();
  };
}

// Trial scope middleware
function requiresTrialAccess(trial_id) {
  return (req, res, next) => {
    const org_id = getTrialOrganization(trial_id);
    
    // Staff with support enabled has access
    if (req.user.role === 'staff' && isStaffWithSupport(req.user, org_id)) {
      req.hasTrialOverride = true;
      return next();
    }
    
    // Superadmin/admin automatic access
    if (["superadmin", "admin"].includes(req.user.org_role)) {
      req.hasTrialOverride = true;
      return next();
    }

    // Check trial team membership
    if (!isInTrialTeam(req.user.id, trial_id)) {
      return res.status(403).json({ error: "Not in trial team" });
    }
    next();
  };
}

// Critical action middleware
function requiresCriticalPermission(trial_id) {
  return (req, res, next) => {
    const org_id = getTrialOrganization(trial_id);
    
    // Staff with support enabled can do critical actions
    if (req.user.role === 'staff' && isStaffWithSupport(req.user, org_id)) {
      return next();
    }
    
    // Superadmin/admin override
    if (["superadmin", "admin"].includes(req.user.org_role)) {
      return next();
    }

    // Check if PI or CRC
    const trialRole = getTrialRole(req.user.id, trial_id);
    if (!["PI", "CRC"].includes(trialRole)) {
      return res.status(403).json({ error: "Requires PI or CRC role" });
    }
    next();
  };
}
```

### For Frontend

- Hide organization-scope actions for editor/reader
- Hide critical actions unless user is PI/CRC (or superadmin/admin)
- Filter trial list based on org_role and trial_team membership
- Calendar: Show all trials for superadmin/admin, filtered for others
- Don't rely only on frontend validation (backend must enforce)

---

**END OF DOCUMENT**
