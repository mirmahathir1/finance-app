[← Back to Backup & Restore](../backup-restore.md#api-backup-restore)

# POST /api/restore

**Endpoint:** `POST /api/restore`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 5 per IP/hour  
**Description:** Accepts a CSV file produced by `GET /api/backup` and restores the logged-in user's transaction data

## Request Headers

- `Content-Type`: `multipart/form-data` (when using form upload) or `text/csv` (when sending CSV directly)
- `X-Restore-Confirm`: `finance-app` (required, double confirmation header)

## Request Body

**Option 1: Multipart Form Data**
- Field name: `file`
- Content-Type: `text/csv`
- File: CSV file created by `GET /api/backup`

**Option 2: Direct CSV Body**
- Content-Type: `text/csv`
- Body: Raw CSV content with headers: `profile,occurred_at,amount_minor,currency,type,tags,note,created_at,updated_at`

**CSV Format:**
- UTF-8 encoded
- Comma delimiter
- Double-quote as quote character
- Headers: `profile,occurred_at,amount_minor,currency,type,tags,note,created_at,updated_at`
- Does NOT include `id` or `user_id` columns

**Behavior:**
Deletes all existing transaction data for the logged-in user, then performs a full transactional restore of the user's transactions from the CSV with schema/header validation and integrity checks. New `id` values are generated and `user_id` is set from the session.

## Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "restored": {
      "transactionCount": 150,
      "deletedCount": 120
    }
  },
  "message": "Backup restored successfully"
}
```

