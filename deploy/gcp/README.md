# GCP Deployment

Deploy the Finance App on Google Cloud Platform.

> **Status**: 🚧 Coming Soon - Deployment guide in progress

## Overview

This guide will cover multiple GCP deployment strategies:

1. **Cloud Run** - Serverless containers (Recommended)
2. **App Engine** - Platform-as-a-Service
3. **Compute Engine** - Virtual machines
4. **GKE** - Google Kubernetes Engine
5. **Cloud Functions** - Serverless (with adaptations)

## Architecture Options

### Option 1: Cloud Run (Recommended)

```
┌─────────────────┐
│   Cloud Run     │ ◄── Automatic scaling
│   Container     │     HTTPS by default
└────────┬────────┘
         │
    ┌────┴────┐
    │Cloud SQL│
    │PostgreSQL│
    └─────────┘
```

**Pros:**
- Fully managed, serverless
- Auto-scaling (0 to N)
- Pay per request
- Built-in HTTPS
- Easy deployment

**Cons:**
- Cold starts (minimal)
- Request timeout limits

### Option 2: App Engine (Simple)

```
┌─────────────────┐
│   App Engine    │ ◄── Managed platform
│   Standard      │     Auto-scaling
└────────┬────────┘
         │
    ┌────┴────┐
    │Cloud SQL│
    │PostgreSQL│
    └─────────┘
```

**Pros:**
- Zero infrastructure management
- Built-in scaling
- Multiple runtime versions

**Cons:**
- Less flexible than Cloud Run
- Platform-specific constraints

### Option 3: GKE (Enterprise)

Full Kubernetes deployment for complex applications with microservices.

### Option 4: Compute Engine (Traditional)

Virtual machines with full control, similar to AWS EC2.

## Prerequisites

- GCP Account ([Get $300 free credit](https://cloud.google.com/free))
- Google Cloud SDK (`gcloud`) installed
- Docker (for Cloud Run/GKE)
- Project created in GCP Console

## Quick Start (Coming Soon)

### 1. Set Up Project

```bash
# Install gcloud CLI
# macOS: brew install google-cloud-sdk
# Windows: Download from cloud.google.com

# Initialize and authenticate
gcloud init
gcloud auth login

# Create project
gcloud projects create finance-app-prod --name="Finance App"
gcloud config set project finance-app-prod

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com
```

### 2. Set Up Cloud SQL Database

```bash
# Create PostgreSQL instance
gcloud sql instances create finance-app-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1

# Set root password
gcloud sql users set-password postgres \
  --instance=finance-app-db \
  --password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create finance_app \
  --instance=finance-app-db

# Get connection name
gcloud sql instances describe finance-app-db \
  --format="value(connectionName)"
```

### 3. Deploy to Cloud Run

```bash
# Build container image
gcloud builds submit \
  --tag gcr.io/finance-app-prod/finance-app \
  --dockerfile deploy/docker/Dockerfile

# Deploy to Cloud Run
gcloud run deploy finance-app \
  --image gcr.io/finance-app-prod/finance-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances finance-app-db \
  --set-env-vars DATABASE_URL="postgresql://..." \
  --set-env-vars SESSION_SECRET="..."

# Get service URL
gcloud run services describe finance-app \
  --region us-central1 \
  --format="value(status.url)"
```

## Services Used

### Compute
- **Cloud Run** - Serverless containers (recommended)
- **App Engine** - PaaS for web apps
- **Compute Engine** - Virtual machines
- **GKE** - Managed Kubernetes

### Database
- **Cloud SQL** - Managed PostgreSQL
- **AlloyDB** - High-performance PostgreSQL (premium)

### Networking
- **Cloud Load Balancing** - Global load balancer
- **Cloud CDN** - Content delivery network
- **Cloud DNS** - DNS management
- **Cloud Armor** - DDoS protection

### Security
- **IAM** - Identity and access management
- **Secret Manager** - Secret storage
- **VPC** - Virtual private cloud
- **Cloud KMS** - Encryption key management

### Monitoring
- **Cloud Logging** - Centralized logging
- **Cloud Monitoring** - Metrics and dashboards
- **Cloud Trace** - Distributed tracing
- **Error Reporting** - Error tracking

### Storage
- **Cloud Storage** - Object storage (for backups)
- **Persistent Disk** - Block storage

## Cost Estimation

### Small Deployment (Development)
- Cloud SQL db-f1-micro: ~$7/month
- Cloud Run (minimal traffic): ~$5/month
- **Total**: ~$12/month

### Medium Deployment (Production)
- Cloud SQL db-g1-small: ~$25/month
- Cloud Run (moderate traffic): ~$30/month
- Cloud CDN: ~$10/month
- **Total**: ~$65/month

### Large Deployment (High Traffic)
- Cloud SQL db-n1-standard-1: ~$95/month
- Cloud Run (high traffic): ~$100/month
- Cloud CDN: ~$30/month
- Load Balancing: ~$20/month
- **Total**: ~$245/month

*Prices are estimates. GCP offers sustained use discounts.*

### Free Tier Benefits

GCP Free Tier includes:
- Cloud Run: 2 million requests/month
- Cloud SQL: db-f1-micro (up to limits)
- Cloud Storage: 5GB storage
- Cloud Build: 120 build-minutes/day

## Environment Variables

### Using Secret Manager (Recommended)

```bash
# Create secrets
echo -n "postgresql://..." | \
  gcloud secrets create DATABASE_URL --data-file=-

echo -n "your-secret" | \
  gcloud secrets create SESSION_SECRET --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:YOUR-SERVICE-ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"

# Deploy with secrets
gcloud run deploy finance-app \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest"
```

### Using Environment Variables

```bash
# Set env vars directly (less secure)
gcloud run services update finance-app \
  --set-env-vars "SESSION_SECRET=your-secret,EMAIL_PROVIDER=brevo"
```

## Database Connection

### Cloud SQL Proxy (Development)

```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy \
  https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64

chmod +x cloud-sql-proxy

# Start proxy
./cloud-sql-proxy YOUR-PROJECT:REGION:INSTANCE-NAME
```

### Unix Socket (Cloud Run)

Cloud Run automatically provides Unix socket connection:

```bash
DATABASE_URL="postgresql://user:pass@/database?host=/cloudsql/PROJECT:REGION:INSTANCE"
```

### Public IP (Not Recommended)

```bash
# Enable public IP
gcloud sql instances patch finance-app-db \
  --assign-ip

# Add authorized network
gcloud sql instances patch finance-app-db \
  --authorized-networks=YOUR_IP
```

## Security Best Practices

1. **Use Secret Manager** for sensitive data
2. **Enable Cloud SQL IAM authentication**
3. **Use private IP** for Cloud SQL when possible
4. **Enable SSL** for database connections
5. **Configure VPC Service Controls** for data protection
6. **Enable Cloud Armor** for DDoS protection
7. **Use workload identity** for GKE
8. **Regular security scans** with Container Analysis

## Monitoring & Alerts

### Cloud Monitoring Dashboards

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50 \
  --format json

# Create alert policy (CPU)
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High CPU Alert" \
  --condition-display-name="CPU > 80%" \
  --condition-threshold-value=0.8
```

### Log-Based Metrics

Monitor errors, latency, and custom metrics from application logs.

## Backup Strategy

### Cloud SQL Automated Backups

```bash
# Enable automated backups
gcloud sql instances patch finance-app-db \
  --backup-start-time=03:00

# Create on-demand backup
gcloud sql backups create \
  --instance=finance-app-db

# List backups
gcloud sql backups list --instance=finance-app-db

# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=finance-app-db
```

### Export to Cloud Storage

```bash
# Create backup bucket
gsutil mb gs://finance-app-backups

# Export database
gcloud sql export sql finance-app-db \
  gs://finance-app-backups/backup-$(date +%Y%m%d).sql \
  --database=finance_app
```

## Disaster Recovery

- **RPO**: 5 minutes with automated backups
- **RTO**: 10-20 minutes
- Regional and multi-regional options
- Point-in-time recovery available

## CI/CD Integration

### GitHub Actions + GCP

```yaml
# .github/workflows/deploy-gcp.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
      
      - name: Build and push image
        run: |
          gcloud builds submit \
            --tag gcr.io/${{ secrets.GCP_PROJECT }}/finance-app
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy finance-app \
            --image gcr.io/${{ secrets.GCP_PROJECT }}/finance-app \
            --region us-central1 \
            --platform managed
```

### Cloud Build Triggers

```yaml
# cloudbuild.yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/finance-app', '-f', 'deploy/docker/Dockerfile', '.']
  
  # Push the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/finance-app']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'finance-app'
      - '--image=gcr.io/$PROJECT_ID/finance-app'
      - '--region=us-central1'
      - '--platform=managed'

images:
  - 'gcr.io/$PROJECT_ID/finance-app'
```

## Terraform Example (Coming Soon)

```hcl
# terraform/main.tf
resource "google_cloud_run_service" "finance_app" {
  name     = "finance-app"
  location = "us-central1"

  template {
    spec {
      containers {
        image = "gcr.io/finance-app-prod/finance-app"
        
        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.database_url.secret_id
              key  = "latest"
            }
          }
        }
      }
    }
  }
}

resource "google_sql_database_instance" "main" {
  name             = "finance-app-db"
  database_version = "POSTGRES_16"
  region           = "us-central1"

  settings {
    tier = "db-f1-micro"
  }
}
```

## Custom Domain

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service finance-app \
  --domain app.yourdomain.com \
  --region us-central1

# Follow DNS instructions provided
# Add the records to your DNS provider
```

## Scaling Configuration

```bash
# Configure autoscaling
gcloud run services update finance-app \
  --min-instances=1 \
  --max-instances=100 \
  --concurrency=80 \
  --cpu=1 \
  --memory=512Mi \
  --timeout=300
```

## Troubleshooting

### Cloud Run Deployment Fails

```bash
# Check logs
gcloud run services logs read finance-app --region us-central1

# Test container locally
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  gcr.io/finance-app-prod/finance-app
```

### Cloud SQL Connection Issues

```bash
# Test connection with Cloud SQL Proxy
./cloud-sql-proxy YOUR-CONNECTION-NAME

# Check IAM permissions
gcloud projects get-iam-policy finance-app-prod

# Verify service account has cloudsql.client role
```

### High Latency

- Ensure Cloud Run and Cloud SQL in same region
- Enable Cloud CDN for static assets
- Review Cloud Monitoring metrics
- Consider read replicas for Cloud SQL

## Migration Guide

### From Local/Docker to GCP

1. **Export Database**
   ```bash
   pg_dump -h localhost -U user -d finance_app > backup.sql
   ```

2. **Import to Cloud SQL**
   ```bash
   gcloud sql import sql finance-app-db \
     gs://your-bucket/backup.sql \
     --database=finance_app
   ```

3. **Deploy Application**
   - Follow Cloud Run deployment above
   - Update environment variables
   - Test thoroughly

### From Other Cloud Providers

- Use database migration tools
- Set up Cloud Storage for data transfer
- Consider hybrid deployment during migration

## Best Practices

1. **Use Cloud Run** for most applications (cost-effective)
2. **Enable Cloud Armor** for production
3. **Set up monitoring alerts** early
4. **Use Secret Manager** for all secrets
5. **Enable automatic backups**
6. **Configure budgets and alerts** to avoid surprises
7. **Use Cloud CDN** for better performance
8. **Test in staging** before production deploys

## Next Steps

1. **Set up GCP account** and enable billing
2. **Create project** and enable APIs
3. **Deploy Cloud SQL** instance
4. **Deploy to Cloud Run**
5. **Configure custom domain**
6. **Set up monitoring and alerts**
7. **Configure CI/CD pipeline**

## Additional Resources

- [GCP Documentation](https://cloud.google.com/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Best Practices](https://cloud.google.com/sql/docs/postgres/best-practices)
- [GCP Architecture Center](https://cloud.google.com/architecture)
- [Cloud Run Pricing Calculator](https://cloud.google.com/products/calculator)

## Contributing

Help us complete this guide:
- Share your GCP deployment experience
- Submit Terraform templates
- Add troubleshooting tips
- Improve cost optimization strategies

## Related Deployment Options

- [Local Development](../local-prod/README.md)
- [Docker Deployment](../docker/README.md)
- [Vercel Deployment](../vercel/README.md)
- [AWS Deployment](../aws/README.md)

