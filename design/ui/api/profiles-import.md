[← Back to Manage Profiles](../manage-profiles.md#api-profile-management)

# Profile Import from Database

**Endpoint:** `GET /api/transactions`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 100 per IP/minute  
**Description:** Fetch all transactions to extract unique profile names for importing into IndexedDB

## Query Parameters

When importing profiles, the endpoint is called **without** the `profile` parameter to fetch all transactions:

- `from` (string, optional) - Start date filter in YYYY-MM-DD format (typically omitted to get all transactions)
- `to` (string, optional) - End date filter in YYYY-MM-DD format (typically omitted to get all transactions)
- `type` (string, optional) - Transaction type filter (typically omitted to get all transactions)
- `limit` (number, optional) - Number of transactions to return per page (default: 50, may need pagination to get all)
- `offset` (number, optional) - Number of transactions to skip for pagination (default: 0)

**Note:** To import all profiles, the client should fetch all transactions (using pagination if necessary) without any filters, then extract unique `profile` values from the response.

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
      },
      {
        "id": "uuid",
        "userId": "uuid",
        "profile": "Business",
        "occurredAt": "2024-01-14",
        "amountMinor": 250000,
        "currency": "USD",
        "type": "income",
        "tags": ["Salary"],
        "note": "Monthly salary",
        "createdAt": "2024-01-14T09:00:00Z",
        "updatedAt": "2024-01-14T09:00:00Z"
      },
      {
        "id": "uuid",
        "userId": "uuid",
        "profile": "Personal",
        "occurredAt": "2024-01-12",
        "amountMinor": 5000,
        "currency": "USD",
        "type": "expense",
        "tags": ["Transportation"],
        "note": "Gas",
        "createdAt": "2024-01-12T14:20:00Z",
        "updatedAt": "2024-01-12T14:20:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## Client-Side Processing

After fetching transactions, the client:

1. Extracts all unique `profile` values from the transactions array
2. Filters out any profiles that already exist in IndexedDB
3. Adds new profiles to IndexedDB
4. If no active profile exists, sets the first imported profile as active
5. Shows success message with count of added profiles

## Example Implementation Flow

```
1. User clicks "Import from Database" button
2. Client calls GET /api/transactions (without profile filter)
3. If pagination.hasMore is true, fetch additional pages until all transactions are retrieved
4. Extract unique profile names: ["Personal", "Business", "Family"]
5. Check IndexedDB for existing profiles: ["Personal"] (already exists)
6. Add new profiles to IndexedDB: ["Business", "Family"]
7. Display success: "Added 2 profiles, skipped 1 existing"
```

## Error Handling

- **Network errors**: Shows error message "Failed to import profiles. Please check your connection and try again."
- **Empty transactions**: Shows message "No transactions found. Create some transactions first."
- **No new profiles**: Shows message "All profiles from your transactions are already imported."

## Notes

- Profile import is a read-only operation - it only reads from the database and writes to IndexedDB
- Existing transactions in the database are not modified
- Profile names are extracted as-is from transaction records
- If a profile name appears in transactions but doesn't exist in IndexedDB, it will be added
- The import operation respects user authentication and only imports profiles from the current user's transactions

