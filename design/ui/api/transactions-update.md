[← Back to View Transactions](../view-transactions.md#api-transaction-management)

# PUT /api/transactions/:id

**Endpoint:** `PUT /api/transactions/:id`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 30 per IP/minute  
**Description:** Update transaction (includes tag names array)

## Path Parameters

- `id` (string, required) - Transaction UUID

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

## Success Response (200 OK)

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

