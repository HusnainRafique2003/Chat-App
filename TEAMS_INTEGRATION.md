# Teams API Integration

## Overview
The teams API is now integrated with read-only functionality. Teams are fetched when a workspace is selected and displayed in the sidebar and dashboard.

## API Endpoint

### Read Teams
**Endpoint:** `GET /read`
**Base URL:** `http://178.104.58.236/api/teams`
**Headers:**
- `Content-Type: application/json`
- `token: {login_token}`
- `Authorization: Bearer {login_token}`

**Request Body:**
```json
{
  "workspace_id": "507f1f77bcf86cd799439016"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Teams retrieved successfully",
  "data": {
    "teams": [
      {
        "id": "507f1f77bcf86cd799439014",
        "name": "Development Team",
        "description": "Backend development team",
        "workspace_id": "507f1f77bcf86cd799439011",
        "creator_id": "507f1f77bcf86cd799439012",
        "members_count": 2,
        "members": [
          {
            "user_id": "507f1f77bcf86cd799439012",
            "role": "admin"
          },
          {
            "user_id": "507f1f77bcf86cd799439013",
            "role": "member"
          }
        ],
        "created_at": "2024-01-01T12:00:00.000000Z",
        "updated_at": "2024-01-01T12:00:00.000000Z"
      }
    ]
  }
}
```

## Implementation

### API Composable
**File:** `app/composables/useTeamsApi.ts`

```typescript
export async function getTeams(workspaceId: string): Promise<AxiosResponse>
```

- Fetches teams for a specific workspace
- Automatically includes auth token in request headers
- Sends workspace_id in request body
- Throws error if request fails

### Teams Store
**File:** `app/stores/useTeamStore.ts`

**State:**
- `teams`: Array of team objects
- `loading`: Boolean indicating fetch status
- `currentTeamId`: Currently selected team ID

**Getters:**
- `currentTeam`: Returns the currently selected team object

**Actions:**
- `fetchTeams(workspaceId)`: Fetches teams for a workspace
- `setCurrentTeam(id)`: Sets the active team
- `clearCurrentTeam()`: Clears the active team
- `clearTeams()`: Clears all teams

### Sidebar Component
**File:** `app/components/AppSidebar.vue`

- Displays list of workspaces (left column)
- Displays current workspace details
- Displays list of teams for the current workspace
- Allows switching between teams
- Shows team member count

### Dashboard Layout
**File:** `app/layouts/dashboard.vue`

- Watches for workspace changes
- Automatically fetches teams when workspace is selected
- Clears teams when workspace is deselected

### Dashboard Page
**File:** `app/pages/dashboard.vue`

- Displays user info
- Displays list of teams in grid format
- Shows team name, description, and member count

## Usage Flow

1. **User logs in** → Dashboard loads
2. **Workspaces are fetched** → Displayed in sidebar
3. **User selects workspace** → Teams are fetched automatically
4. **Teams are displayed** → In sidebar and dashboard
5. **User can switch teams** → Click on team in sidebar

## Data Flow

```
Login
  ↓
Dashboard Layout
  ↓
Fetch Workspaces
  ↓
Display Workspaces in Sidebar
  ↓
User Selects Workspace
  ↓
Fetch Teams for Workspace
  ↓
Display Teams in Sidebar & Dashboard
  ↓
User Can Switch Teams
```

## Files Created/Modified

### New Files:
- `app/composables/useTeamsApi.ts` - Teams API client
- `app/stores/useTeamStore.ts` - Teams state management

### Modified Files:
- `app/layouts/dashboard.vue` - Added team fetching logic
- `app/components/AppSidebar.vue` - Added teams display
- `app/pages/dashboard.vue` - Added teams display

## Token Management

Teams API automatically includes the authentication token:
- Token is retrieved from the user store
- Added to `token` header (primary)
- Added to `Authorization` header (fallback)

## Error Handling

- API errors are caught and logged
- Failed requests don't crash the app
- Empty state is shown if no teams available

## Next Steps

Once the backend fixes the token validation issue:
1. Teams will load automatically when workspace is selected
2. Users can switch between teams
3. Team details will be displayed in the dashboard
4. Team members will be visible

## Testing

1. Login to the app
2. Go to dashboard
3. Select a workspace from the sidebar
4. Teams should load and display
5. Click on a team to select it
6. Team details should update in the dashboard
