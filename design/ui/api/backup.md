[← Back to Backup & Restore](../backup-restore.md#api-backup-restore)

# GET /api/backup

**Endpoint:** `GET /api/backup`  
**Auth:** Authenticated user (session required)  
**Rate limit:** 10 per IP/hour  
**Description:** Streams a single CSV file containing only the logged-in user's transaction data

## Request

No parameters or request body required. The endpoint uses the authenticated user's session to identify which transactions to export.

## Success Response (200 OK)

- **Content-Type:** `text/csv`
- **Content-Disposition:** `attachment; filename="backup-YYYYMMDDTHHmmssZ.csv"`
- **Body:** CSV file content with headers: `profile,occurred_at,amount_minor,currency,type,tags,note,created_at,updated_at`

**Notes:**
- Includes only the current user's transactions (excludes `id` and `user_id` columns)
- Profiles, Tags, and Currencies are NOT included as they are stored in IndexedDB

