[← Back to README](README.md)

<a id="edit-tags"></a>

# Edit Tags

<pre>
┌─────────────────────────────────────────────────────────┐
│  Header (AppBar)                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ <a href="./dashboard.md">← Back</a>  Edit Tags                │ │
│  └───────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Import Section                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ 📥 Import from Database                      │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Expense Tags Section                                    │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Expense Tags                                      │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ 🟢 Food & Dining                             │  │ │
│  │ │    [Color: 🟢] [<a href="#edit-tag-modal">Edit</a>] [<a href="#delete-tag-modal">Delete</a>]              │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ 🟡 Transportation                             │  │ │
│  │ │    [Color: 🟡] [<a href="#edit-tag-modal">Edit</a>] [<a href="#delete-tag-modal">Delete</a>]              │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ 🔵 Shopping                                   │  │ │
│  │ │    [Color: 🔵] [<a href="#edit-tag-modal">Edit</a>] [<a href="#delete-tag-modal">Delete</a>]              │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ 🟣 Bills & Utilities                          │  │ │
│  │ │    [Color: 🟣] [<a href="#edit-tag-modal">Edit</a>] [<a href="#delete-tag-modal">Delete</a>]              │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Income Tags Section                                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Income Tags                                       │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ 🔵 Salary                                     │  │ │
│  │ │    [Color: 🔵] [<a href="#edit-tag-modal">Edit</a>] [<a href="#delete-tag-modal">Delete</a>]              │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ 🟢 Freelance                                  │  │ │
│  │ │    [Color: 🟢] [<a href="#edit-tag-modal">Edit</a>] [<a href="#delete-tag-modal">Delete</a>]              │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │ ┌──────────────────────────────────────────────┐  │ │
│  │ │ 🟡 Investment                                 │  │ │
│  │ │    [Color: 🟡] [<a href="#edit-tag-modal">Edit</a>] [<a href="#delete-tag-modal">Delete</a>]              │  │ │
│  │ └──────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Add Tag Form                                            │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Add New Tag                                       │ │
│  │                                                    │ │
│  │ Type                                               │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ [Expense] [Income]                            │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ Name                                               │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ [Enter tag name]                              │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ Color                                              │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ 🟢 🟡 🔵 🟣 🔴 🟠 ⚪ ⚫                        │ │ │
│  │ │ (color picker grid)                           │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ Add Tag                                        │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Info Text                                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ℹ️  Tags are stored locally and specific to this  │ │
│  │    profile. Changes are saved instantly.          │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

## Component Structure

The Edit Tags page consists of:

```
EditTags
├── Header (AppBar with back button)
├── ImportFromDatabaseButton (scans transactions and auto-populates tags)
├── TagsList
│   ├── ExpenseTagsSection
│   │   └── TagItem (name, color picker, edit button, delete button)
│   └── IncomeTagsSection
│       └── TagItem (name, color picker, edit button, delete button)
├── AddTagForm
│   ├── TypeSelector (expense/income)
│   ├── NameInput
│   ├── ColorPicker
│   └── AddButton
└── InfoText ("Tags are stored locally and specific to this profile")
```

## Features

- Tags are loaded from IndexedDB for the active profile
- Each profile has its own independent set of tags
- Tags are categorized by transaction type (expense/income)
- Color coding for visual identification
- Add, edit color, and delete tags instantly (no API calls)
- Renaming tags updates all transactions in the database via API
- All changes are saved to IndexedDB immediately
- **Import from Database**: Button to scan all transactions for the active profile and auto-populate IndexedDB with existing tags (handles duplicates by skipping existing tags)

## Edit Tags Flow

1. Dashboard → Edit Tags Button
2. Load tags from IndexedDB for active profile → Display Tags
3. User Actions:
   - **Import from Database**: Click "Import from Database" → 
     - Scan all transactions for active profile → 
     - Extract unique tags with types → 
     - Add new tags to IndexedDB (skip existing) → 
     - Show success message (e.g., "Added 5 tags, skipped 2 existing")
   - **Manual Edit**: Add/Delete/Modify/Change Color → 
     - Validate → Save to IndexedDB → 
     - Success Message
  - **Rename Tag**: Edit tag name → 
    - Validate → Query `/api/transactions?profile=<active>&tag=<oldName>&limit=1` to get affected count → 
    - Show confirmation dialog with count → 
    - User confirms → Stream `/api/transactions?profile=<active>&tag=<oldName>` and call `PUT /api/transactions/:id` with the updated tags array → 
    - Update tag in IndexedDB → 
    - Show success message with transaction count (e.g., "Tag renamed successfully. 15 transactions updated.")
  - **Delete Tag**: Click delete → 
    - Query `/api/transactions?profile=<active>&tag=<name>&limit=1` to check if tag is used → 
    - If tag is used, show error and block deletion → 
    - If not used, show confirmation dialog → 
    - User confirms → Remove tag from IndexedDB → 
    - Show success message (e.g., "Tag deleted successfully.")

**Note:** Tags are filtered by active profile and transaction type (expense/income). Import from Database option allows users to quickly populate tags from existing transactions. When renaming a tag, all transactions in the database that use the old tag name are updated to use the new name.

## User Flow

1. User navigates to Edit Tags page
2. User sees expense and income tags sections
3. User can add new tags with type, name, and color
4. User can edit existing tags (name, color)
5. User can delete tags
6. User can import tags from database transactions
7. All changes saved instantly to IndexedDB
8. Success message appears after operations

## Error Handling

- **Duplicate tag names**: Prevents creating tags with duplicate names for same type
- **Validation**: Ensures tag name is not empty
- **Success feedback**: Shows success message after operations

## API Endpoints

<a id="api-tag-management"></a>

### Tag Management
- Tag operations no longer have dedicated `/api/tags/*` routes. The UI now scans `/api/transactions` for the active profile to determine usage counts and uses `PUT /api/transactions/:id` to update tag arrays when renaming.
- `GET /api/transactions` — Used for importing tags from database. See [API Response Documentation](./api/transactions-list.md)

**Note:** Tag operations (add, edit color) are performed client-side using IndexedDB. However, when renaming or deleting a tag, the system first calls a preview API to check how many transactions will be affected. For deletion, if any transactions use the tag, deletion is blocked. For renaming, after user confirmation, the system calls the actual operation API to update all transactions in the database.

**Storage:** Tags are stored locally in IndexedDB. Tag names are also stored in transaction records in PostgreSQL (Supabase). When a tag is renamed, both IndexedDB and all related transactions in the database are updated.

## Security Notes

- Tag management (add, edit color) happens client-side (IndexedDB)
- Tag renaming requires API call to update database transactions
- Tags are profile-specific and stored locally
- Import from database only reads user's own transactions
- Tag rename operations update all user's transactions that contain the old tag name

## Edit Tag Modal

<a id="edit-tag-modal"></a>

<pre>
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │              Edit Tag                              │ │
│  │                                                    │ │
│  │  ────────────────────────────────────────────────  │ │
│  │                                                    │ │
│  │  Type                                               │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ [Expense] [Income]                            │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Name                                               │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ Food & Dining                                 │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Color                                              │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ 🟢 🟡 🔵 🟣 🔴 🟠 ⚪ ⚫                        │ │ │
│  │  │ (color picker grid)                           │ │ │
│  │  │ Selected: 🟢                                  │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │          <a href="#edit-tags">Save Changes</a>                         │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │          <a href="#edit-tags">Cancel</a>                          │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

### Features

- **Pre-filled form**: Shows current tag name, type, and color
- **Type selection**: Toggle between Expense and Income
- **Name editing**: Text field to modify tag name
- **Color picker**: Visual color selection grid
- **Save changes**: Updates tag in IndexedDB and, if name changed, updates all transactions in database via API, then redirects back to <a href="#edit-tags">Edit Tags page</a>
- **Cancel**: Returns to <a href="#edit-tags">Edit Tags page</a> without saving

### User Flow

1. User clicks "Edit" button on a tag in edit-tags page
2. Modal opens with pre-filled tag information
3. User modifies name, type, or color
4. User clicks "Save Changes"
5. System validates changes:
   - If tag name changed: 
     - Calls `GET /api/tags/rename/preview` to get affected transaction count
     - Shows confirmation dialog: "This will update X transactions. Continue?"
     - User confirms → Calls `POST /api/tags/rename` to update all transactions in database
   - Updates tag in IndexedDB (name, type, color)
6. Modal closes and redirects to <a href="#edit-tags">Edit Tags page</a>
7. Updated tag is displayed in the list
8. Success message displayed: "Tag renamed successfully. X transactions updated." (if name changed)

### Error Handling

- **Validation**: Ensures tag name is not empty
- **Duplicate names**: Prevents creating tags with duplicate names for the same type
- **API errors**: If database update fails, shows error "Failed to update tag in database. Please try again."
- **Network errors**: Shows error "Failed to rename tag. Please check your connection and try again."

## Delete Tag Modal

<a id="delete-tag-modal"></a>

<pre>
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │              Delete Tag                            │ │
│  │                                                    │ │
│  │  ────────────────────────────────────────────────  │ │
│  │                                                    │ │
│  │  Are you sure you want to delete this tag?        │ │
│  │                                                    │ │
│  │  🟢 Food & Dining                                 │ │
│  │                                                    │ │
│  │  [If tag is used:]                                │ │
│  │  ❌ This tag is used in 15 transactions.         │ │
│  │     Deletion is not allowed.                      │ │
│  │                                                    │ │
│  │  [If tag is not used:]                            │ │
│  │  ✓ No transactions use this tag.                  │ │
│  │                                                    │ │
│  │  ⚠️  This action cannot be undone.                │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │          Delete (disabled if tag is used)      │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │          <a href="#edit-tags">Cancel</a>                               │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
</pre>

### Features

- **Usage check**: Checks if tag is used in transactions (fetched via API)
- **Error display**: If tag is used, shows error message and disables delete button
- **Confirmation dialog**: If tag is not used, asks user to confirm deletion
- **Tag display**: Shows the tag being deleted (name and color)
- **Warning message**: Clear indication that action cannot be undone (only shown if deletion is allowed)
- **Delete button**: Confirms deletion (only enabled if tag is not in use), calls API to validate, then removes from IndexedDB
- **Cancel button**: Returns to <a href="#edit-tags">Edit Tags page</a> without deleting

### User Flow

1. User clicks "Delete" button on a tag in edit-tags page
2. System calls `GET /api/tags/delete/preview` to check if tag is used in transactions
3. If tag is used:
   - Modal opens showing error: "This tag is used in X transactions. Deletion is not allowed."
   - Delete button is disabled or shows error message
   - User must remove tag from all transactions before deletion is allowed
4. If tag is not used:
   - Modal opens with confirmation dialog
   - User reviews the tag information and warning
   - User clicks "Delete" to confirm
   - System calls `DELETE /api/tags` to validate deletion
   - Tag is removed from IndexedDB
   - Modal closes and redirects to <a href="#edit-tags">Edit Tags page</a>
   - Tag is removed from the list
   - Success message displayed: "Tag deleted successfully."

### Error Handling

- **Preview errors**: If preview API fails, shows error "Failed to check affected transactions. Please try again."
- **Tag in use**: If tag is used in transactions, shows error "This tag is used in X transactions. Deletion is not allowed. Please remove the tag from all transactions before deleting it."
- **Confirmation required**: User must explicitly click Delete button (only if tag is not in use)
- **API errors**: If validation fails, shows error "Failed to delete tag. Please try again."
- **Network errors**: Shows error "Failed to delete tag. Please check your connection and try again."
- **Success feedback**: Shows success message after deletion

### Security Notes

- Deletion is only allowed if no transactions contain the tag
- If any transactions use the tag, deletion is blocked with an error message
- The tag is removed from IndexedDB only after validation confirms no transactions reference the tag
- Only transactions belonging to the authenticated user are checked
