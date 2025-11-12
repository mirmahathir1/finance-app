[← Back to Manage Profiles](../manage-profiles.md#api-profile-management)

# GET /api/profiles/rename/preview

**Endpoint:** `GET /api/profiles/rename/preview?oldName&newName`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 50 per IP/minute  
**Description:** Preview how many transactions will be affected by renaming a profile. This endpoint is called before the actual rename operation to show the user how many transactions will be updated.

## Query Parameters

- `oldName` (string, required) - Current profile name to be renamed
- `newName` (string, required) - New profile name

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "oldName": "Business",
    "newName": "Business Account",
    "transactionsAffected": 42,
    "message": "This will update 42 transactions"
  }
}
```

**Response Fields:**
- `oldName` (string) - The old profile name
- `newName` (string) - The new profile name
- `transactionsAffected` (number) - Number of transactions that will be updated
- `message` (string) - Preview message

## Behavior

1. Counts all transactions for the authenticated user that have the `oldName` as their `profile` field

2. Checks if any transactions already exist with the `newName` profile

3. Returns the count of transactions that would be affected

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
GET /api/profiles/rename/preview?oldName=Business&newName=Business%20Account
Cookie: session=...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "oldName": "Business",
    "newName": "Business Account",
    "transactionsAffected": 42,
    "message": "This will update 42 transactions"
  }
}
```

## Notes

- This is a read-only operation that does not modify any data
- The count includes all transactions that would be affected by the rename operation
- If `transactionsAffected` is 0, it means no transactions currently use this profile
- The duplicate check ensures the new name doesn't conflict with existing profiles



