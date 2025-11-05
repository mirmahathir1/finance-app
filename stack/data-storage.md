# Data Storage & Management

## Storage Overview

This section covers generic storage libraries and approaches. App-specific file layouts and schemas are documented in `design/file-operations.md` and `design/data-models.md`.

## CSV Handling

### papaparse
- CSV parsing and stringification
- Type-safe parsing with TypeScript
- Support for headers and custom delimiters

## Date Management

### date-fns
- Date formatting and manipulation
- Timezone support
- Lightweight alternative to moment.js

## Currency & Number Formatting

### Intl.NumberFormat (Built-in JavaScript API)
- Currency formatting for different locales
- No additional library needed
- Example: `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(123.45)`

<!-- App-specific currency conversion logic lives in design/currency-system.md -->

## Image Handling

### react-image-crop or react-easy-crop
- Image cropping functionality for user-uploaded images
- Responsive and touch-friendly
- Returns cropped image coordinates

### Browser File API (Built-in)
- File upload and preview
- Image validation (format, size)
- Convert to Blob for upload to remote storage

### Image Optimization
- Client-side image resizing before upload
- Compress images to reduce storage (use reasonable size limits)
- Support formats: JPG, PNG, GIF, WebP

## Backups

See `design/file-operations.md` for app-specific backup layout, retention, and restore workflows.

