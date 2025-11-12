# UI Design Documentation

[← Back to Main README](../README.md)

## Documentation Structure

### Overview & Architecture
1. **[Overview](./overview.md)** - Application overview and key features
2. **[Architecture](./architecture.md)** - High-level system architecture
3. **[Data Models](./data-models.md)** - SQL schema and TypeScript interfaces

### User Experience
4. **[UI/UX Guidelines](./ui-ux-guidelines.md)** - Design system and guidelines

### Technical Documentation
5. **[Deployment](../stack/deployment.md)** - Deployment, PWA configuration, and environment variables

### Page Documentation
10. **[Dashboard](./dashboard.md)** - Main home page for logged-in users
11. **[Sign In](./signin.md)** - Authentication page (with guest mode option and link to sign up)
12. **[Sign Up](./signup.md)** - User registration page
13. **[Verify](./verify.md)** - Email verification page
14. **[Set Password](./set-password.md)** - Password setup page
15. **[Forgot Password](./forgot-password.md)** - Password reset request page
16. **[Reset Password](./reset-password.md)** - Password reset page
17. **[Setup](./setup.md)** - Initial setup page for first-time users
18. **[Create Transaction](./create-transaction.md)** - Create expense/income transaction page
19. **[View Transactions](./view-transactions.md)** - View and manage transactions page
20. **[Edit Tags](./edit-tags.md)** - Manage tags page
21. **[Statistics](./statistics.md)** - Statistics and charts page
22. **[Manage Currencies](./manage-currencies.md)** - Currency management page
23. **[Manage Profiles](./manage-profiles.md)** - Profile management page
24. **[Backup & Restore](./backup-restore.md)** - Backup and restore page
25. **[Mock Email](./mock-email.md)** - Mock email page for demonstration

## Quick Links

- For developers starting implementation: Start with [Architecture](./architecture.md) and [Data Models](./data-models.md)
- For UI/UX designers: See [UI/UX Guidelines](./ui-ux-guidelines.md) (shared components, design system, and guidelines)
- For understanding user experience: Check individual page documentation (each page includes its user flow and component structure)
- For backend development: Review [Data Models](./data-models.md) (includes Prisma operations and data persistence), [Architecture](./architecture.md) (security, error handling, state management, best practices), [Deployment](../stack/deployment.md) (environment variables), and individual page documentation (each page includes its API endpoints)
- For authentication: See [Sign In](./signin.md) (includes guest mode implementation), [Sign Up](./signup.md), [Verify](./verify.md), [Set Password](./set-password.md), [Forgot Password](./forgot-password.md), and [Reset Password](./reset-password.md) (each includes API endpoints and security notes)
- For API endpoints: See individual page documentation (each page includes its relevant API endpoints)
- For currency system details: See [Manage Currencies](./manage-currencies.md) (includes IndexedDB operations, multi-currency support, and implementation details)
- For setting up third-party services: See [Credentials Setup](../credentials-setup/README.md)
