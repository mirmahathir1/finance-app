[← Back to Manage Profiles](../manage-profiles.md#api-profile-management)

# GET /api/profiles/delete/preview

**Endpoint:** `GET /api/profiles/delete/preview?name`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 50 per IP/minute  
**Description:** Preview how many transactions contain a profile. This endpoint is called before the actual delete operation to check if deletion is allowed. If any transactions contain the profile, deletion will be blocked.

## Query Parameters

- `name` (string, required) - Profile name to be deleted

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "name": "Business",
    "transactionsAffected": 42,
    "canDelete": false,
    "message": "This profile is used in 42 transactions. Deletion is not allowed."
  }
}
```

**Response Fields:**
- `name` (string) - The profile name to be deleted
- `transactionsAffected` (number) - Number of transactions that contain this profile
- `canDelete` (boolean) - Whether deletion is allowed (true if transactionsAffected is 0, false otherwise)
- `message` (string) - Preview message indicating if deletion is allowed

## Behavior

1. Counts all transactions for the authenticated user that have the `name` as their `profile` field

2. Returns the count of transactions that contain the profile and whether deletion is allowed

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

## Example Usage

**Request:**
```bash
GET /api/profiles/delete/preview?name=Business
Cookie: session=...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Business",
    "transactionsAffected": 42,
    "canDelete": false,
    "message": "This profile is used in 42 transactions. Deletion is not allowed."
  }
}
```

## Notes

- This is a read-only operation that does not modify any data
- The count includes all transactions that contain this profile
- If `transactionsAffected` is 0, deletion is allowed (`canDelete: true`)
- If `transactionsAffected` is greater than 0, deletion is blocked (`canDelete: false`)
- Deletion is only allowed if no transactions contain the profile



