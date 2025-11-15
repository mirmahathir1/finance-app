[← Back to Statistics](../statistics.md#api-statistics)

# GET /api/statistics

**Endpoint:** `GET /api/statistics?profile&from&to&currency`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 60 per IP/minute  
**Description:** Aggregated metrics for specific currency and profile

## Query Parameters

- `profile` (string, required) - Profile name filter
- `from` (string, required) - Start date filter in YYYY-MM-DD format
- `to` (string, required) - End date filter in YYYY-MM-DD format
- `currency` (string, required) - Currency code filter (3-letter ISO code, e.g., "USD", "EUR")

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": {
        "amountMinor": 250000,
        "currency": "USD"
      },
      "totalExpense": {
        "amountMinor": 180000,
        "currency": "USD"
      },
      "netBalance": {
        "amountMinor": 70000,
        "currency": "USD"
      }
    },
    "expenseBreakdown": [
      {
        "tag": "Food & Dining",
        "amountMinor": 63000,
        "currency": "USD",
        "percentage": 35
      },
      {
        "tag": "Transportation",
        "amountMinor": 45000,
        "currency": "USD",
        "percentage": 25
      }
    ],
    "incomeBreakdown": [
      {
        "tag": "Salary",
        "amountMinor": 250000,
        "currency": "USD",
        "percentage": 100
      }
    ],
    "period": {
      "from": "2024-01-01",
      "to": "2024-01-31",
      "currency": "USD"
    }
  }
}
```

**Notes:**
- The API always returns totals for the requested currency; the UI can optionally fetch rates from https://open.er-api.com to convert and merge other currencies client-side before rendering.

