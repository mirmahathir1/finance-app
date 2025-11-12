[← Back to View Transactions](../view-transactions.md#api-transaction-management)

# DELETE /api/transactions/:id

**Endpoint:** `DELETE /api/transactions/:id`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 30 per IP/minute  
**Description:** Delete transaction

## Path Parameters

- `id` (string, required) - Transaction UUID

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

