# ForceGraph.tsx Refactoring Summary

## Overview

Refactored `ForceGraph.tsx` from a 1398-line monolithic component into a modular architecture with separate dialog components and custom hooks.

## Changes Made

### File Size Reduction

-   **Before**: 1398 lines
-   **After**: 1025 lines
-   **Reduction**: 373 lines (27% smaller)

### New Components Created

#### 1. AddFamilyMemberDialog.tsx

-   **Location**: `/components/ForceGraph/AddFamilyMemberDialog.tsx`
-   **Lines**: 94
-   **Purpose**: Dialog with 3 buttons for creating parent, child, or partner
-   **Props**:
    -   `onCreateParent`: () => void
    -   `onCreateChild`: () => void
    -   `onCreatePartner`: () => void
    -   `onClose`: () => void

#### 2. CoupleSelectionDialog.tsx

-   **Location**: `/components/ForceGraph/CoupleSelectionDialog.tsx`
-   **Lines**: 106
-   **Purpose**: Smart dialog for selecting existing couple or creating new one
-   **Props**:
    -   `role`: 'parent' | 'child'
    -   `couples`: string[]
    -   `onSelectCouple`: (coupleId: string | null) => void
    -   `onClose`: () => void

#### 3. FlipEdgeDialog.tsx

-   **Location**: `/components/ForceGraph/FlipEdgeDialog.tsx`
-   **Lines**: 67
-   **Purpose**: Dialog for changing person↔couple relationship types
-   **Props**:
    -   `edge`: { type: string }
    -   `onFlip`: () => void
    -   `onClose`: () => void

### Custom Hooks Created

#### 1. useFamilyMemberActions.ts

-   **Location**: `/components/ForceGraph/useFamilyMemberActions.ts`
-   **Lines**: 158
-   **Purpose**: Manages all family member creation logic
-   **Returns**:
    -   State:
        -   `showRelationDialog`: boolean
        -   `showCoupleSelectionDialog`: boolean
        -   `coupleSelectionData`: { role, couples } | null
    -   Actions:
        -   `handleCreateParent`: () => Promise<void>
        -   `handleCreateChild`: () => Promise<void>
        -   `handleCreatePartner`: () => Promise<void>
        -   `createPersonWithCouple`: (role, coupleId) => Promise<void>
        -   `openAddFamilyDialog`: (personId) => void
        -   `closeDialogs`: () => void

#### 2. useFlipEdge.ts

-   **Location**: `/components/ForceGraph/useFlipEdge.ts`
-   **Lines**: 47
-   **Purpose**: Manages edge relationship flipping
-   **Returns**:
    -   `selectedEdge`: Edge | null
    -   `showFlipEdgeDialog`: boolean
    -   `openFlipEdgeDialog`: (edge) => void
    -   `closeFlipEdgeDialog`: () => void
    -   `handleFlipEdge`: () => Promise<void>

## Code Organization Benefits

### Before

-   Single 1398-line file with all logic
-   Difficult to test individual features
-   Hard to maintain and understand
-   Dialog JSX mixed with visualization logic

### After

-   Main component: 1025 lines (25% smaller)
-   3 separate dialog components (267 lines total)
-   2 custom hooks (205 lines total)
-   Total new code: 472 lines in organized modules
-   Clear separation of concerns
-   Easier to test and maintain
-   Reusable components and hooks

## Integration Points

### In ForceGraph.tsx

```typescript
// Import statements
import { AddFamilyMemberDialog } from "./ForceGraph/AddFamilyMemberDialog";
import { CoupleSelectionDialog } from "./ForceGraph/CoupleSelectionDialog";
import { FlipEdgeDialog } from "./ForceGraph/FlipEdgeDialog";
import { useFamilyMemberActions } from "./ForceGraph/useFamilyMemberActions";
import { useFlipEdge } from "./ForceGraph/useFlipEdge";

// Hook usage in component
const familyMemberActions = useFamilyMemberActions(fetchData);
const flipEdgeActions = useFlipEdge(fetchData);

// D3 event handlers updated
.on("click", (event, d) => {
    flipEdgeActions.openFlipEdgeDialog(d);
})

// JSX rendering
{familyMemberActions.showRelationDialog && (
    <AddFamilyMemberDialog
        onCreateParent={familyMemberActions.handleCreateParent}
        onCreateChild={familyMemberActions.handleCreateChild}
        onCreatePartner={familyMemberActions.handleCreatePartner}
        onClose={familyMemberActions.closeDialogs}
    />
)}
```

## Testing Checklist

-   [ ] Create parent functionality works
-   [ ] Create child functionality works
-   [ ] Create partner functionality works
-   [ ] Couple selection dialog appears when needed
-   [ ] Single couple auto-confirmation works
-   [ ] Multiple couple selection works
-   [ ] Flip edge dialog appears on edge click
-   [ ] Edge relationship flipping works
-   [ ] All dialogs close properly
-   [ ] Graph refreshes after operations

## Future Improvements

1. **Further Extraction Opportunities**:

    - D3 rendering logic could be moved to a custom hook
    - Node rendering logic could be extracted to separate functions
    - Layout calculation could be separated

2. **Component Enhancement**:

    - Add error boundaries to dialogs
    - Add loading states during API calls
    - Add animations for dialog transitions

3. **Testing**:
    - Write unit tests for custom hooks
    - Write integration tests for dialog workflows
    - Add E2E tests for complete user flows

## Summary

This refactoring successfully reduced the main component size by 27% while improving code organization and maintainability. The extracted components and hooks are reusable and follow React best practices with clear separation of concerns.
