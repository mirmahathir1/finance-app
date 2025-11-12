[← Back to Edit Tags](../edit-tags.md#api-tag-management)

# GET /api/tags/rename/preview

**Endpoint:** `GET /api/tags/rename/preview?oldName&newName&type&profile`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 50 per IP/minute  
**Description:** Preview how many transactions will be affected by renaming a tag. This endpoint is called before the actual rename operation to show the user how many transactions will be updated.

## Query Parameters

- `oldName` (string, required) - Current tag name to be renamed
- `newName` (string, required) - New tag name
- `type` (string, required) - Transaction type: `"expense"` or `"income"`
- `profile` (string, required) - Profile name to scope the rename operation

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "oldName": "Food & Dining",
    "newName": "Food & Restaurants",
    "type": "expense",
    "profile": "Personal",
    "transactionsAffected": 15,
    "message": "This will update 15 transactions"
  }
}
```

**Response Fields:**
- `oldName` (string) - The old tag name
- `newName` (string) - The new tag name
- `type` (string) - Transaction type
- `profile` (string) - Profile name
- `transactionsAffected` (number) - Number of transactions that will be updated
- `message` (string) - Preview message

## Behavior

1. Counts all transactions for the authenticated user that:
   - Have the specified `profile` name
   - Have the `oldName` tag in their `tags` array
   - Match the specified `type`

2. Checks if a tag with `newName` already exists for this profile and type

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
      "oldName": "Old tag name cannot be empty",
      "newName": "New tag name cannot be empty"
    }
  }
}
```

### 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_TAG",
    "message": "A tag with the new name already exists for this profile and type"
  }
}
```

## Example Usage

**Request:**
```bash
GET /api/tags/rename/preview?oldName=Food%20%26%20Dining&newName=Food%20%26%20Restaurants&type=expense&profile=Personal
Cookie: session=...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "oldName": "Food & Dining",
    "newName": "Food & Restaurants",
    "type": "expense",
    "profile": "Personal",
    "transactionsAffected": 15,
    "message": "This will update 15 transactions"
  }
}
```

## Notes

- This is a read-only operation that does not modify any data
- The count includes all transactions that would be affected by the rename operation
- If `transactionsAffected` is 0, it means no transactions currently use this tag
- The duplicate check ensures the new name doesn't conflict with existing tags



