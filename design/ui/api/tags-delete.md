[← Back to Edit Tags](../edit-tags.md#api-tag-management)

# DELETE /api/tags

**Endpoint:** `DELETE /api/tags`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 20 per IP/minute  
**Description:** Delete a tag. This operation is only allowed if no transactions contain the tag. If any transactions use the tag, the deletion will be rejected with an error.

## Request Body

```json
{
  "name": "Food & Dining",
  "type": "expense",
  "profile": "Personal"
}
```

**Fields:**
- `name` (string, required) - Tag name to be deleted
- `type` (string, required) - Transaction type: `"expense"` or `"income"`
- `profile` (string, required) - Profile name to scope the delete operation (only transactions with this profile will be updated)

## Validation Rules

- `name` must not be empty
- `type` must be either `"expense"` or `"income"`
- `profile` must not be empty
- User must own all transactions that will be updated

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "name": "Food & Dining",
    "type": "expense",
    "profile": "Personal",
    "message": "Tag deleted successfully."
  }
}
```

**Response Fields:**
- `name` (string) - The tag name that was deleted
- `type` (string) - Transaction type
- `profile` (string) - Profile name
- `message` (string) - Success message

## Behavior

1. Finds all transactions for the authenticated user that:
   - Have the specified `profile` name
   - Have the tag `name` in their `tags` array
   - Match the specified `type`

2. If any transactions are found, the deletion is rejected with a 409 Conflict error.

3. If no transactions are found, the tag can be safely deleted (this is a client-side operation in IndexedDB, but the API validates that no transactions reference the tag).

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

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "TAG_NOT_FOUND",
    "message": "Tag not found"
  }
}
```

### 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "TAG_IN_USE",
    "message": "Cannot delete tag: it is used in transactions",
    "details": {
      "transactionsCount": 15,
      "message": "This tag is used in 15 transactions. Please remove the tag from all transactions before deleting it."
    }
  }
}
```

## Example Usage

**Request:**
```bash
DELETE /api/tags
Content-Type: application/json
Cookie: session=...

{
  "name": "Food & Dining",
  "type": "expense",
  "profile": "Personal"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Food & Dining",
    "type": "expense",
    "profile": "Personal",
    "message": "Tag deleted successfully."
  }
}
```

## Notes

- The delete operation is scoped to a specific profile and transaction type
- Only transactions belonging to the authenticated user are checked
- Deletion is only allowed if no transactions contain the tag
- If any transactions use the tag, deletion is rejected with a 409 Conflict error
- Tag names are case-sensitive
- The tag deletion itself happens client-side in IndexedDB, but this API validates that no transactions reference the tag before allowing deletion



