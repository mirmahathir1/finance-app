# Finance App

A personal finance tracking application built with Next.js, TypeScript, and PostgreSQL.

## Documentation

This repository contains comprehensive documentation organized into the following sections:

### 📋 [Design Documentation](./ui/README.md)
Complete design and architecture documentation including:
- Application overview and features
- System architecture
- Data models and schemas
- UI components and user flows
- API design and authentication
- Implementation guidelines

### 🛠️ [Technology Stack](./stack/README.md)
Technology stack documentation covering:
- Core technologies (Next.js, TypeScript, Material UI)
- Authentication and data storage
- Deployment and security
- Performance optimization

### 🔐 [Credentials Setup](./credentials-setup/README.md)
Step-by-step guides for setting up third-party services:
- [Brevo Credentials](./credentials-setup/brevo-credentials.md) - Email service for user verification (production)
- [Neon Credentials](./credentials-setup/neon-credentials.md) - PostgreSQL database hosting (production)
- [GCP Credentials](./credentials-setup/gcp-credentials.md) - Google Cloud Run deployment for Next.js app

**Production Deployment:**
- Next.js app → Google Cloud Run
- Database → Neon PostgreSQL
- Email → Brevo (Sendinblue)

## Key Features

- Multi-currency transaction tracking
- Profile-based data organization
- Tag-based categorization
- Guest mode for exploration
- PWA support
- Data backup and restore

For detailed information, see the [Design Documentation](./ui/README.md).

