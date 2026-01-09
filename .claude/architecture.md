# Themison Product Demo Architecture

## Main rule

**Component → Hook → Service → Backend**

Never skip layers.

---

## Responsibilities by layer

### Component / Page

- Renders UI
- Captures user events
- Calls functions exposed by hooks
- **DOES NOT**: handle business logic, decide what data to fetch, transform data

### Hook

- Exposes data ready to render
- Exposes functions to execute actions
- Handles loading/error states
- **DOES NOT**: fetch directly from backend, contain complex business logic

### Service

- Calls the backend
- Transforms responses if needed
- Can call other services
- **DOES NOT**: hold state, know about React

### Backend (API routes)

- Validates permissions
- Executes business logic
- Persists to DB
- **DOES NOT**: know about UI

---

## Services can call other services

Identified cross-domain operations:

| Operation                          | Origin service             | Calls             |
| ---------------------------------- | -------------------------- | ----------------- |
| Create task from RAG response      | `documentAssistantService` | `taskService`     |
| Share response via message         | `documentAssistantService` | `messageService`  |
| Attach task to message             | `messageService`           | `taskService`     |
| Auto-generate tasks on enroll      | `visitService`             | `taskService`     |
| Create task from patient dashboard | `patientService`           | `taskService`     |
| Upload visit document              | `visitService`             | `documentService` |

---

## Folder structure

```
src/
├── app/                    # Pages and API routes
├── services/               # Logic, can call each other
├── hooks/                  # Connect services with React
├── stores/                 # UI state (Zustand)
├── components/             # Reusable UI
└── lib/                    # External config (Supabase)
```

---

## Prohibitions

### 1. Component calls service directly

WRONG:

```typescript
function TaskList() {
  const tasks = await taskService.getAll();
}
```

RIGHT:

```typescript
function TaskList() {
  const { tasks } = useTasks(trialId);
}
```

### 2. Component contains business logic

WRONG:

```typescript
function TaskCard({ task, user }) {
  const canDelete = user.trial_role === "PI" || user.trial_role === "CRC";
}
```

RIGHT:

```typescript
function TaskCard({ task, canDelete, onDelete }) {
  // only renders props
}
```

### 3. Hook calls backend directly

WRONG:

```typescript
function useTasks() {
  const { data } = await supabase.from("tasks").select();
}
```

RIGHT:

```typescript
function useTasks() {
  return useQuery({
    queryFn: () => taskService.getByTrialId(trialId),
  });
}
```

---

## Permissions

Validated in the **backend**, not in services or hooks.

Frontend can hide UI based on permissions (UX only), but real validation lives in API routes.

---

## Flow examples

### Flow 22: Create task from Document Assistant

**Service:**

```typescript
// services/documentAssistant.service.ts

import { taskService } from "./task.service";

export const documentAssistantService = {
  createTaskFromResponse: async (response: RAGResponse, trialId: string) => {
    return taskService.create({
      title: response.query,
      description: response.answer,
      source: "document_assistant",
      source_id: response.id,
      trial_id: trialId,
      type: "AD",
    });
  },
};
```

**Hook:**

```typescript
// hooks/useDocumentAssistant.ts

export function useDocumentAssistant(trialId: string) {
  const createTaskMutation = useMutation({
    mutationFn: (response: RAGResponse) =>
      documentAssistantService.createTaskFromResponse(response, trialId),
  });

  return {
    createTaskFromResponse: createTaskMutation.mutateAsync,
    isCreatingTask: createTaskMutation.isPending,
  };
}
```

**Component:**

```typescript
// components/domain/ResponseCard.tsx

interface ResponseCardProps {
  response: RAGResponse;
  onCreateTask: (response: RAGResponse) => void;
  isCreatingTask: boolean;
}

export function ResponseCard({
  response,
  onCreateTask,
  isCreatingTask,
}: ResponseCardProps) {
  return (
    <div>
      <p>{response.answer}</p>
      <button onClick={() => onCreateTask(response)} disabled={isCreatingTask}>
        Create Task
      </button>
    </div>
  );
}
```

**Page:**

```typescript
// app/[orgId]/trials/[trialId]/documents/page.tsx

export default function DocumentAssistantPage() {
  const { createTaskFromResponse, isCreatingTask } =
    useDocumentAssistant(trialId);
  const { responses } = useResponseArchive(trialId);

  return (
    <div>
      {responses.map((response) => (
        <ResponseCard
          key={response.id}
          response={response}
          onCreateTask={createTaskFromResponse}
          isCreatingTask={isCreatingTask}
        />
      ))}
    </div>
  );
}
```

---

### Flow 35: Auto-generate tasks on patient enrollment

This cross-domain operation happens in the **backend**.

Frontend only calls enroll:

```typescript
// services/patient.service.ts

export const patientService = {
  enroll: async (patientId: string, visitStartDate: Date) => {
    return api.post(`/patients/${patientId}/enroll`, {
      visit_start_date: visitStartDate,
    });
  },
};
```

The backend internally generates visits and tasks based on the template and the trial's assignment rules.
