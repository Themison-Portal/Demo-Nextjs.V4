# UI Layout Guide

This document describes the layout system, UI component library, padding conventions, and design patterns used in the Themison client application.

---

## Table of Contents

- [UI Component Library](#ui-component-library)
- [3-Zone Layout System](#3-zone-layout-system)
- [Padding System](#padding-system)
- [Non-Boxed Design](#non-boxed-design)
- [Component Patterns](#component-patterns)
- [AppMain Implementation](#appmain-implementation)

---

## UI Component Library

### Shadcn/ui + Radix UI

The project uses **Shadcn/ui** as the primary component library, built on top of **Radix UI primitives**.

**Location:** `components/ui/`

**Available components:**
- Button, Card, Badge
- Input, Label, Switch
- Modal, Popover, Select
- Calendar, DatePicker
- Spinner

### Golden Rule: Don't Reinvent the Wheel

**Always check if a component exists in Shadcn/Radix before creating a custom one.**

```typescript
// ✅ GOOD - Use existing Shadcn component
import { Button } from '@/components/ui/button';

export function CreateTrialButton() {
  return <Button variant="outline">Create Trial</Button>;
}
```

```typescript
// ❌ BAD - Don't recreate existing components
export function CustomButton({ children, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="rounded-md bg-primary px-4 py-2"  // ❌ Reinventing Button
    >
      {children}
    </button>
  );
}
```

**When to use Shadcn/Radix:**
- ✅ Forms (Input, Label, Switch, Select)
- ✅ Buttons (Button with variants)
- ✅ Overlays (Modal, Popover)
- ✅ Date inputs (Calendar, DatePicker)
- ✅ Layout containers (Card)

**When to create custom components:**
- ✅ Business logic components (TrialCard, TrialsList, TrialView)
- ✅ Composite components combining multiple Shadcn components
- ✅ Domain-specific layouts (AppMain, AppSidebar)

### Adding New Shadcn Components

If you need a Shadcn component that's not yet installed:

```bash
# Check available components at https://ui.shadcn.com/docs/components

# Example: adding Dialog component
npx shadcn-ui@latest add dialog

# This will add the component to components/ui/dialog.tsx
```

**Important:** Always prefer Shadcn/Radix components over building custom ones. They provide:
- Accessibility (ARIA, keyboard navigation)
- Consistent design system
- Battle-tested patterns
- TypeScript support

---

## 3-Zone Layout System

The main layout (`AppMain`) divides the screen into 3 fixed zones with controlled scrolling:

```
┌─────────────┬───────────────────────────────────────┐
│             │  HEADER (fixed, no scroll)            │
│  SIDEBAR    ├───────────────────────────────────────┤
│  (fixed,    │                                       │
│  no scroll) │  MAIN (scrollable, bg-gray)           │
│             │  ← ONLY SCROLLABLE AREA               │
│             │                                       │
│             │  All page content renders here        │
│             │                                       │
└─────────────┴───────────────────────────────────────┘
```

### Behavior

- **Sidebar:** `position: fixed`, always visible, no scroll
- **Header:** `position: fixed`, above main content, no scroll
- **Main:** `overflow-y: auto`, only scrollable area, contains `{children}`

**Why this pattern?**
- Clean, modern layout (see Clinify benchmark)
- Consistent navigation always visible
- Single scroll area prevents nested scroll confusion
- Content area maximizes vertical space

---

## Padding System

The main area has **consistent padding** on all sides:

```tsx
<main className="p-6">  {/* or p-8 based on needs */}
  {children}
</main>
```

**Rules:**
- Content NEVER touches viewport edges
- Padding present ALWAYS (consistent spacing)
- Generous spacing between header and content

**Visual:**

```
┌────────────────────────────────────────┐
│  MAIN (bg-gray-50)                     │
│  ↑ p-6 (1.5rem / 24px)                 │
│  ┌────────────────────────────────┐ ← │
│  │  Content Area                  │   │
│  │  (Cards, sections, etc.)       │   │
│  └────────────────────────────────┘   │
│                                     ↓  │
└────────────────────────────────────────┘
    ← p-6 →                    ← p-6 →
```

---

## Non-Boxed Design

The design uses **background contrast** instead of nested borders.

### Golden Rule

```
Main background:   gray-50 (#FAFAFA)
Cards/Sections:    white (bg-white) with rounded-lg
```

### Visual Example

```
┌──────────────────────────────────────────┐
│  MAIN (bg-gray-50, p-6)                  │
│                                          │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓          │
│  ┃ Card (bg-white, rounded) ┃          │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛          │
│                                          │
│  ┏━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━┓        │
│  ┃   Card 1   ┃  ┃   Card 2   ┃        │
│  ┗━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━┛        │
│                                          │
└──────────────────────────────────────────┘
```

### Why It Works

- ✅ **Clean visual contrast** - White cards "float" on gray background
- ✅ **Clear hierarchy** - No confusing nested borders
- ✅ **Modern design** - Professional look (industry benchmark: Clinify)
- ✅ **NON-BOXED** - Avoids `border` inside `border` inside `border`

---

## Component Patterns

### Page Components (in `app/`)

**Minimal logic - just render:**

```typescript
// app/[orgId]/trials/page.tsx
export default function TrialsPage({ params }: { params: { orgId: string } }) {
  return <TrialsList orgId={params.orgId} />;
}
```

### View Components (in `components/`)

**Main view for a section - uses Shadcn components:**

```typescript
// components/app/trials/TrialsList.tsx
'use client';

import { useTrials } from '@/hooks/client/useTrials';
import { Button } from '@/components/ui/button';  // Shadcn component

export function TrialsList({ orgId }: TrialsListProps) {
  const { trials, isLoading } = useTrials(orgId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Select a Trial</h1>
        <Button variant="outline">Create New Trial</Button>  {/* Shadcn */}
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trials.map((trial) => (
          <TrialCard key={trial.id} {...trial} />
        ))}
      </div>
    </div>
  );
}
```

### Card Components

**Individual item display - combines Shadcn Card with custom content:**

```typescript
// components/app/trials/TrialCard.tsx
import { Card, CardContent } from '@/components/ui/card';  // Shadcn

export function TrialCard({ id, name, phase, orgId }: TrialCardProps) {
  return (
    <Card className="hover:border-gray-300 transition-colors">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <p className="text-sm text-gray-600">{phase}</p>
      </CardContent>
    </Card>
  );
}
```

**Note:** Use Shadcn `Card` component instead of raw divs for consistency.

---

## AppMain Implementation

**Location:** `components/app/shared/AppMain.tsx`

**Structure:**

```typescript
'use client';

export function AppMain({
  orgId,
  children,
}: {
  orgId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - fixed, no scroll */}
      <AppSidebar orgId={orgId} />

      {/* Right side - header + scrollable main */}
      <div className="flex-1 flex flex-col">
        {/* Header - fixed, no scroll */}
        <header className="h-16 border-b border-gray-200 bg-white">
          {/* Breadcrumbs, actions, etc. */}
        </header>

        {/* Main - scrollable area with gray background */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Key CSS classes:**
- `flex h-screen` - Full viewport height with flex layout
- `flex-1 overflow-y-auto` - Scrollable main area
- `bg-gray-50` - Gray background for contrast
- `p-6` - Consistent padding (24px)

---

## Rules for Views/Components

Any component rendered inside `<main>` must follow these rules:

### ✅ DO

**Use white cards on gray background:**

```tsx
export function DashboardView() {
  return (
    <div className="space-y-6">
      {/* Cards with white background */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        Content
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          Card 1
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          Card 2
        </div>
      </div>
    </div>
  );
}
```

**Use Tailwind spacing utilities:**

```tsx
<div className="space-y-6">      {/* Vertical spacing between children */}
<div className="gap-4">          {/* Grid gap */}
<div className="mb-4">           {/* Margin bottom */}
```

### ❌ DON'T

**Don't add redundant padding:**

```tsx
// ❌ WRONG - Padding already provided by AppMain
export function BadView() {
  return (
    <div className="p-6 bg-white">  {/* ❌ Redundant padding */}
      ...
    </div>
  );
}
```

**Don't compete with main background:**

```tsx
// ❌ WRONG - Background competes with main's bg-gray-50
export function BadView() {
  return (
    <div className="bg-gray-100">  {/* ❌ Confusing contrast */}
      ...
    </div>
  );
}
```

**Don't use nested scroll containers:**

```tsx
// ❌ WRONG - Creates nested scrolling
export function BadView() {
  return (
    <div className="overflow-y-auto h-full">  {/* ❌ Nested scroll */}
      ...
    </div>
  );
}
```

---

## Tailwind Class Patterns

### Card Variants

```tsx
// Standard card
<div className="bg-white rounded-lg p-4 border border-gray-200">

// Hover effect
<div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">

// Card with shadow (optional)
<div className="bg-white rounded-lg p-4 shadow-sm">

// Large card
<div className="bg-white rounded-lg p-6 border border-gray-200">
```

### Spacing

```tsx
// Vertical stacking (space between children)
<div className="space-y-4">   {/* 1rem / 16px */}
<div className="space-y-6">   {/* 1.5rem / 24px */}

// Grid gap
<div className="grid grid-cols-3 gap-4">   {/* 1rem / 16px */}
<div className="grid grid-cols-3 gap-6">   {/* 1.5rem / 24px */}

// Padding
<div className="p-4">    {/* 1rem / 16px */}
<div className="p-6">    {/* 1.5rem / 24px */}
<div className="p-8">    {/* 2rem / 32px */}
```

### Text Styles

```tsx
// Headings
<h1 className="text-xl font-bold text-gray-900">     {/* Page title */}
<h2 className="text-lg font-semibold text-gray-900"> {/* Section title */}
<h3 className="text-base font-medium text-gray-900"> {/* Card title */}

// Body text
<p className="text-gray-600">      {/* Secondary text */}
<p className="text-sm text-gray-600"> {/* Small text */}
<p className="text-gray-900">      {/* Primary text */}
```

---

## Empty States

**Pattern for empty states:**

```tsx
export function TrialsList({ orgId }: TrialsListProps) {
  const { trials, isLoading } = useTrials(orgId);

  if (trials.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-gray-900">Trials</h1>

        <div className="bg-white rounded-lg border border-gray-100">
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {/* Icon */}
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-6">
              <FlaskConical className="h-6 w-6 text-blue-600" />
            </div>

            {/* Message */}
            <h2 className="text-lg font-normal text-gray-900 mb-2">
              Create your first clinical trial
            </h2>
            <p className="text-gray-800 max-w-md mb-4">
              Start managing your clinical research by creating a trial.
            </p>

            {/* Action */}
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              <span>Create Trial</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Normal list rendering...
}
```

**Example:** `components/app/trials/TrialsList.tsx:44-109`

---

## Loading States

**Pattern for loading states:**

```tsx
export function TrialsList({ orgId }: TrialsListProps) {
  const { trials, isLoading } = useTrials(orgId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading trials...</div>
      </div>
    );
  }

  // Normal rendering...
}
```

---

## Summary

### Component Library
1. **Use Shadcn/Radix first** - Never recreate existing components
2. **Check components/ui/** - Before building custom UI primitives
3. **Add via CLI** - `npx shadcn-ui@latest add <component>`
4. **Custom only for domain logic** - TrialCard, TrialsList, etc.

### Layout System
1. **3-zone layout** - Sidebar (fixed), Header (fixed), Main (scrollable)
2. **Main has padding** - `p-6` or `p-8`, consistent spacing
3. **Non-boxed design** - Gray background + white cards (no nested borders)
4. **White cards** - `bg-white rounded-lg p-4 border border-gray-200`
5. **Spacing utilities** - `space-y-6`, `gap-4`, `p-6`
6. **Don't add redundant padding** - Main already provides it
7. **Single scroll area** - Only main scrolls, never nested

For component architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).
For complete examples, see `components/app/trials/TrialsList.tsx`.

---

**Reference:**
- Benchmark: Clinify dashboard (clean contrast design)
- Implementation: `components/app/shared/AppMain.tsx`
- Example: `components/app/trials/TrialsList.tsx`
