[← Back to Manage Profiles](../manage-profiles.md#api-profile-management)

# DELETE /api/profiles

**Endpoint:** `DELETE /api/profiles`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 20 per IP/minute  
**Description:** Delete a profile. This operation is only allowed if no transactions contain the profile. If any transactions use the profile, the deletion will be rejected with an error.

## Request Body

```json
{
  "name": "Business"
}
```

**Fields:**
- `name` (string, required) - Profile name to be deleted

## Validation Rules

- `name` must not be empty
- User must own all transactions that will be deleted
- The profile must not be the currently active profile (enforced client-side)

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "name": "Business",
    "message": "Profile deleted successfully."
  }
}
```

**Response Fields:**
- `name` (string) - The profile name that was deleted
- `message` (string) - Success message

## Behavior

1. Finds all transactions for the authenticated user that have the `name` as their `profile` field

2. If any transactions are found, the deletion is rejected with a 409 Conflict error.

3. If no transactions are found, the profile can be safely deleted (this is a client-side operation in IndexedDB, but the API validates that no transactions reference the profile).

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "name": "Profile name cannot be empty"
    }
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "No transactions found with the specified profile name"
  }
}
```

### 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "PROFILE_IN_USE",
    "message": "Cannot delete profile: it is used in transactions",
    "details": {
      "transactionsCount": 42,
      "message": "This profile is used in 42 transactions. Please delete or reassign all transactions before deleting the profile."
    }
  }
}
```

Or if attempting to delete the active profile:

```json
{
  "success": false,
  "error": {
    "code": "ACTIVE_PROFILE",
    "message": "Cannot delete the currently active profile"
  }
}
```

## Example Usage

**Request:**
```bash
DELETE /api/profiles
Content-Type: application/json
Cookie: session=...

{
  "name": "Business"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Business",
    "message": "Profile deleted successfully."
  }
}
```

## Notes

- Only transactions belonging to the authenticated user are checked
- Deletion is only allowed if no transactions contain the profile
- If any transactions use the profile, deletion is rejected with a 409 Conflict error
- Profile names are case-sensitive
- The profile deletion itself happens client-side in IndexedDB, but this API validates that no transactions reference the profile before allowing deletion
- The active profile should not be deletable (enforced client-side, but also checked server-side for safety)



