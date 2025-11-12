[← Back to View Transactions](../view-transactions.md#api-transaction-management)

# GET /api/transactions

**Endpoint:** `GET /api/transactions?profile&from&to&type&limit&offset`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 100 per IP/minute  
**Description:** List transactions (paged, filtered by profile name)

## Query Parameters

- `profile` (string, optional) - Profile name filter
- `from` (string, optional) - Start date filter in YYYY-MM-DD format
- `to` (string, optional) - End date filter in YYYY-MM-DD format
- `type` (string, optional) - Transaction type filter: `"expense"` or `"income"`
- `limit` (number, optional) - Number of transactions to return (default: 50)
- `offset` (number, optional) - Number of transactions to skip for pagination (default: 0)

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
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
    ],
    "pagination": {
      "total": 45,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

