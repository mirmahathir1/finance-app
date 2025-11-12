[← Back to Edit Tags](../edit-tags.md#api-tag-management)

# GET /api/tags/delete/preview

**Endpoint:** `GET /api/tags/delete/preview?name&type&profile`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 50 per IP/minute  
**Description:** Preview how many transactions contain a tag. This endpoint is called before the actual delete operation to check if deletion is allowed. If any transactions contain the tag, deletion will be blocked.

## Query Parameters

- `name` (string, required) - Tag name to be deleted
- `type` (string, required) - Transaction type: `"expense"` or `"income"`
- `profile` (string, required) - Profile name to scope the delete operation

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "name": "Food & Dining",
    "type": "expense",
    "profile": "Personal",
    "transactionsAffected": 15,
    "canDelete": false,
    "message": "This tag is used in 15 transactions. Deletion is not allowed."
  }
}
```

**Response Fields:**
- `name` (string) - The tag name to be deleted
- `type` (string) - Transaction type
- `profile` (string) - Profile name
- `transactionsAffected` (number) - Number of transactions that contain this tag
- `canDelete` (boolean) - Whether deletion is allowed (true if transactionsAffected is 0, false otherwise)
- `message` (string) - Preview message indicating if deletion is allowed

## Behavior

1. Counts all transactions for the authenticated user that:
   - Have the specified `profile` name
   - Have the tag `name` in their `tags` array
   - Match the specified `type`

2. Returns the count of transactions that contain the tag and whether deletion is allowed

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "name": "Tag name cannot be empty"
    }
  }
}
```

## Example Usage

**Request:**
```bash
GET /api/tags/delete/preview?name=Food%20%26%20Dining&type=expense&profile=Personal
Cookie: session=...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Food & Dining",
    "type": "expense",
    "profile": "Personal",
    "transactionsAffected": 15,
    "canDelete": false,
    "message": "This tag is used in 15 transactions. Deletion is not allowed."
  }
}
```

## Notes

- This is a read-only operation that does not modify any data
- The count includes all transactions that contain this tag
- If `transactionsAffected` is 0, deletion is allowed (`canDelete: true`)
- If `transactionsAffected` is greater than 0, deletion is blocked (`canDelete: false`)
- Deletion is only allowed if no transactions contain the tag



