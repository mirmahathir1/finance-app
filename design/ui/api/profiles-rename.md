[← Back to Manage Profiles](../manage-profiles.md#api-profile-management)

# POST /api/profiles/rename

**Endpoint:** `POST /api/profiles/rename`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 20 per IP/minute  
**Description:** Rename a profile across all transactions in the database. Updates all transactions that have the old profile name to use the new profile name. This endpoint is called after the user confirms the operation following a preview call to `GET /api/profiles/rename/preview`.

## Request Body

```json
{
  "oldName": "Business",
  "newName": "Business Account"
}
```

**Fields:**
- `oldName` (string, required) - Current profile name to be renamed
- `newName` (string, required) - New profile name

## Validation Rules

- `oldName` must not be empty
- `newName` must not be empty
- `oldName` and `newName` must be different
- User must own all transactions that will be updated

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "oldName": "Business",
    "newName": "Business Account",
    "transactionsUpdated": 42,
    "message": "Profile renamed successfully. 42 transactions updated."
  }
}
```

**Response Fields:**
- `oldName` (string) - The old profile name
- `newName` (string) - The new profile name
- `transactionsUpdated` (number) - Number of transactions that were updated
- `message` (string) - Success message

## Behavior

1. Finds all transactions for the authenticated user that have the `oldName` as their `profile` field

2. Updates each matching transaction:
   - Changes the `profile` field from `oldName` to `newName`
   - Updates the `updatedAt` timestamp

3. Returns the count of updated transactions

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "oldName": "Old profile name cannot be empty",
      "newName": "New profile name cannot be empty"
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
    "code": "DUPLICATE_PROFILE",
    "message": "A profile with the new name already exists in your transactions"
  }
}
```

## Example Usage

**Request:**
```bash
POST /api/profiles/rename
Content-Type: application/json
Cookie: session=...

{
  "oldName": "Business",
  "newName": "Business Account"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "oldName": "Business",
    "newName": "Business Account",
    "transactionsUpdated": 42,
    "message": "Profile renamed successfully. 42 transactions updated."
  }
}
```

## Notes

- The rename operation updates all transactions belonging to the authenticated user that have the old profile name
- Only transactions belonging to the authenticated user are updated
- If no transactions are found with the old profile name, the operation still succeeds but returns `transactionsUpdated: 0`
- The operation is atomic - either all matching transactions are updated or none (in case of database errors)
- Profile names are case-sensitive
- The profile must exist in at least one transaction to be considered "found"
- This operation does not update IndexedDB - the frontend should handle IndexedDB updates separately

