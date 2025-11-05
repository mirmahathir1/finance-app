# Authentication

## Overview

### OAuth 2.0 Providers
- Use libraries such as `next-auth` or provider-specific SDKs (e.g., `@react-oauth/google`) to implement OAuth flows.
- Configure provider credentials and redirect URIs according to the provider documentation.

### Notes
- Keep authentication concerns decoupled from app-specific authorization logic.
- Store tokens securely (e.g., HTTP-only cookies) and follow provider best practices.

