[← Back to Create Transaction](../create-transaction.md#api-create-transaction)

# POST /api/transactions

**Endpoint:** `POST /api/transactions`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 30 per IP/minute  
**Description:** Create transaction (includes profile name and tag names array in body)

## Request Body

```json
{
  "profile": "Personal",
  "occurredAt": "2024-01-15",
  "amountMinor": 10000,
  "currency": "USD",
  "type": "expense",
  "tags": ["Food & Dining"],
  "note": "Grocery shopping at Walmart"
}
```

**Fields:**
- `profile` (string, required) - Profile name (stored as text in database)
- `occurredAt` (string, required) - Transaction date in YYYY-MM-DD format
- `amountMinor` (number, required) - Amount in minor units (integer, e.g., 10000 = $100.00)
- `currency` (string, required) - Currency code (3-letter ISO code, e.g., "USD", "EUR")
- `type` (string, required) - Transaction type: `"expense"` or `"income"`
- `tags` (string[], required) - Array of tag names (stored as text array in database)
- `note` (string, optional) - Optional transaction note/description

## Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "uuid",
      "userId": "uuid",
      "profile": "Personal",
      "occurredAt": "2024-01-15",
      "amountMinor": 10000,
      "currency": "USD",
      "type": "expense",
      "tags": ["Food & Dining"],
      "note": "Grocery shopping at Walmart",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Notes:**
- Profile, tags, and currencies are managed in IndexedDB on the frontend

