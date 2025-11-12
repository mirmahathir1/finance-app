[← Back to Edit Tags](../edit-tags.md#api-tag-management)

# POST /api/tags/rename

**Endpoint:** `POST /api/tags/rename`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 20 per IP/minute  
**Description:** Rename a tag across all transactions in the database. Updates all transactions that contain the old tag name to use the new tag name. This endpoint is called after the user confirms the operation following a preview call to `GET /api/tags/rename/preview`.

## Request Body

```json
{
  "oldName": "Food & Dining",
  "newName": "Food & Restaurants",
  "type": "expense",
  "profile": "Personal"
}
```

**Fields:**
- `oldName` (string, required) - Current tag name to be renamed
- `newName` (string, required) - New tag name
- `type` (string, required) - Transaction type: `"expense"` or `"income"`
- `profile` (string, required) - Profile name to scope the rename operation (only transactions with this profile will be updated)

## Validation Rules

- `oldName` must not be empty
- `newName` must not be empty
- `oldName` and `newName` must be different
- `type` must be either `"expense"` or `"income"`
- `profile` must not be empty
- User must own all transactions that will be updated

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "oldName": "Food & Dining",
    "newName": "Food & Restaurants",
    "type": "expense",
    "profile": "Personal",
    "transactionsUpdated": 15,
    "message": "Tag renamed successfully. 15 transactions updated."
  }
}
```

**Response Fields:**
- `oldName` (string) - The old tag name
- `newName` (string) - The new tag name
- `type` (string) - Transaction type
- `profile` (string) - Profile name
- `transactionsUpdated` (number) - Number of transactions that were updated
- `message` (string) - Success message

## Behavior

1. Finds all transactions for the authenticated user that:
   - Have the specified `profile` name
   - Have the `oldName` tag in their `tags` array
   - Match the specified `type` (if provided)

2. Updates each matching transaction:
   - Replaces `oldName` with `newName` in the `tags` array
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
      "oldName": "Old tag name cannot be empty",
      "newName": "New tag name cannot be empty"
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
    "message": "No transactions found with the specified tag name"
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
POST /api/tags/rename
Content-Type: application/json
Cookie: session=...

{
  "oldName": "Food & Dining",
  "newName": "Food & Restaurants",
  "type": "expense",
  "profile": "Personal"
}
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
    "transactionsUpdated": 15,
    "message": "Tag renamed successfully. 15 transactions updated."
  }
}
```

## Notes

- The rename operation is scoped to a specific profile and transaction type
- Only transactions belonging to the authenticated user are updated
- If no transactions are found with the old tag name, the operation still succeeds but returns `transactionsUpdated: 0`
- The operation is atomic - either all matching transactions are updated or none (in case of database errors)
- Tag names are case-sensitive
- The tag must exist in at least one transaction for the specified profile and type to be considered "found"

