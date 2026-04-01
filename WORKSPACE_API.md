# Workspace API Integration

## Overview
The workspace API is now simplified to support **read-only** operations. All create, update, delete, and member management functionality has been removed.

## API Endpoint

### Read Workspaces
**Endpoint:** `GET /read`
**Base URL:** `http://178.104.58.236/api/workspaces`
**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {token}`
- `token: {token}`

**Response:**
```json
{
  "success": true,
  "message": "Workspaces retrieved successfully",
  "data": {
    "workspaces": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "My Workspace",
        "description": "Workspace description",
        "creator_id": "507f1f77bcf86cd799439012",
        "created_at": "2024-01-01T12:00:00.000000Z",
        "updated_at": "2024-01-01T12:00:00.000000Z",
        "members": []
      }
    ]
  }
}
```

## Implementation

### API Composable
**File:** `app/composables/useWorkspacesApi.ts`

```typescript
export async function getWorkspaces(): Promise<AxiosResponse>
```

- Fetches all workspaces for the authenticated user
- Automatically includes auth token in request headers
- Throws error if request fails

### Workspace Store
**File:** `app/stores/useWorkspaceStore.ts`

**State:**
- `workspaces`: Array of workspace objects
- `loading`: Boolean indicating fetch status
- `currentWorkspaceId`: Currently selected workspace ID

**Getters:**
- `currentWorkspace`: Returns the currently selected workspace object

**Actions:**
- `fetchWorkspaces()`: Fetches workspaces from API
- `setCurrentWorkspace(id)`: Sets the active workspace
- `clearCurrentWorkspace()`: Clears the active workspace

### Sidebar Component
**File:** `app/components/AppSidebar.vue`

- Displays list of available workspaces
- Allows switching between workspaces
- Shows current workspace details (name, description)
- Shows channels and direct messages (placeholder)

## Usage

### In Components
```typescript
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

const workspaceStore = useWorkspaceStore()

// Fetch workspaces
await workspaceStore.fetchWorkspaces()

// Switch workspace
workspaceStore.setCurrentWorkspace(workspaceId)

// Get current workspace
const current = workspaceStore.currentWorkspace
```

### In Dashboard
The dashboard automatically:
1. Fetches workspaces on mount
2. Displays the sidebar with workspace list
3. Allows switching between workspaces
4. Shows current workspace details

## Removed Functionality

The following functions have been removed:
- `createWorkspace()` - Create new workspace
- `updateWorkspace()` - Update workspace details
- `deleteWorkspace()` - Delete workspace
- `addMembersToWorkspace()` - Add members to workspace
- `removeMembersFromWorkspace()` - Remove members from workspace

The following components/modals have been removed from active use:
- `WorkspaceModal.vue` - Modal for creating/editing workspaces
- Create workspace button in sidebar

## Files Modified

- `app/composables/useWorkspacesApi.ts` - Simplified to only `getWorkspaces()`
- `app/stores/useWorkspaceStore.ts` - Removed all CRUD operations
- `app/components/AppSidebar.vue` - Removed create workspace button and modal

## Token Management

The workspace API automatically includes the authentication token in all requests:
- Token is retrieved from the user store
- Added to `Authorization` header as `Bearer {token}`
- Also added to `token` header for compatibility

If the token is missing or invalid, the API will return a 401 error.
