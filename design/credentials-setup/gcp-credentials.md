[← Back to README](README.md)

# Google Cloud Platform (GCP) Credentials Setup

Google Cloud Platform is used for deploying the **Next.js application to Cloud Run**, storing Docker images, and CI/CD pipelines.

**Deployment Architecture:**
- **Application**: Next.js app deployed to Google Cloud Run (serverless)
- **Database**: Neon PostgreSQL (external, not on GCP)
- **Email**: Brevo (external, not on GCP)

## Prerequisites
- A Google account
- A credit card (required for GCP account, though free tier credits are available)

## Steps to Get GCP Credentials

### 1. Create a GCP Account
1. Go to [https://cloud.google.com](https://cloud.google.com)
2. Click **"Get started for free"** or **"Start free"**
3. Sign in with your Google account
4. Complete the account setup:
   - Enter your country/region
   - Accept the terms of service
   - Add a credit card (required, but you won't be charged unless you exceed free tier)
   - Verify your account if required
5. You'll receive $300 in free credits for 90 days

### 2. Create a New Project
1. Go to the [GCP Console](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click **"New Project"**
4. Fill in the project details:
   - **Project name**: e.g., "finance-app" or "finance-app-production"
   - **Project ID**: Auto-generated or customize (must be globally unique)
   - **Organization**: Select if you have one (optional)
   - **Location**: Select your organization location (optional)
5. Click **"Create"**
6. Wait for the project to be created (usually a few seconds)
7. Select the new project from the project dropdown

### 3. Enable Required APIs
Enable the APIs needed for your application:

1. Go to **"APIs & Services"** → **"Library"** in the GCP Console
2. Search for and enable the following APIs:
   - **Cloud Run API** (for serverless container deployment) - **Required**
   - **Container Registry API** or **Artifact Registry API** (for Docker image storage) - **Required**
   - **Cloud Build API** (for CI/CD, optional)
   - **Cloud SQL Admin API** (not needed - using Neon PostgreSQL instead)

**To enable an API:**
- Search for the API name
- Click on it
- Click **"Enable"**
- Wait for the API to be enabled

### 4. Set Up Authentication

#### Option A: Service Account (Recommended for CI/CD and Production)
1. Go to **"IAM & Admin"** → **"Service Accounts"**
2. Click **"Create Service Account"**
3. Fill in the details:
   - **Service account name**: e.g., "finance-app-deployer"
   - **Service account ID**: Auto-generated
   - **Description**: "Service account for deploying finance app"
4. Click **"Create and Continue"**
5. Grant roles:
   - **Cloud Run Admin** (for deploying to Cloud Run)
   - **Storage Admin** (for Container Registry/Artifact Registry)
   - **Cloud Build Service Account** (if using Cloud Build)
6. Click **"Continue"** → **"Done"**
7. Click on the created service account
8. Go to the **"Keys"** tab
9. Click **"Add Key"** → **"Create new key"**
10. Select **"JSON"** format
11. Click **"Create"**
12. **Download the JSON key file** - this is your service account credentials

#### Option B: User Account (For Local Development)
1. Install Google Cloud SDK:
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. Authenticate:
   ```bash
   gcloud auth login
   ```

3. Set your project:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

4. Set application default credentials:
   ```bash
   gcloud auth application-default login
   ```

### 5. Set Up Container Registry or Artifact Registry

#### Container Registry (Legacy, but still supported)
1. Container Registry is automatically enabled when you enable the API
2. Your registry URL will be: `gcr.io/YOUR_PROJECT_ID`

#### Artifact Registry (Recommended)
1. Go to **"Artifact Registry"** in the GCP Console
2. Click **"Create Repository"**
3. Fill in the details:
   - **Name**: e.g., "finance-app"
   - **Format**: Docker
   - **Mode**: Standard (or Regional for better performance)
   - **Region**: Choose a region close to your deployment
4. Click **"Create"**
5. Your registry URL will be: `REGION-docker.pkg.dev/YOUR_PROJECT_ID/REPOSITORY_NAME`

### 6. Configure Docker Authentication
1. Configure Docker to use gcloud as a credential helper:
   ```bash
   gcloud auth configure-docker
   ```

2. For Artifact Registry:
   ```bash
   gcloud auth configure-docker REGION-docker.pkg.dev
   ```

### 7. Set Up Environment Variables

#### For Local Development
```env
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
GCP_SERVICE_ACCOUNT_KEY_PATH=path/to/service-account-key.json
```

#### For CI/CD (GitHub Actions, etc.)
Store these as secrets:
- `GCP_PROJECT_ID`
- `GCP_SERVICE_ACCOUNT_KEY` (the entire JSON content)
- `GCP_REGION`

### 8. Deploy to Cloud Run (Example)

1. Build and tag your Docker image:
   ```bash
   docker build -t gcr.io/YOUR_PROJECT_ID/finance-app .
   ```

2. Push to Container Registry:
   ```bash
   docker push gcr.io/YOUR_PROJECT_ID/finance-app
   ```

3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy finance-app \
     --image gcr.io/YOUR_PROJECT_ID/finance-app \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### 9. Set Up Cloud Build (Optional, for CI/CD)

1. Go to **"Cloud Build"** → **"Triggers"**
2. Click **"Create Trigger"**
3. Connect your repository (GitHub, GitLab, Bitbucket, or Cloud Source Repositories)
4. Configure the trigger:
   - **Name**: e.g., "finance-app-deploy"
   - **Event**: Push to a branch (e.g., `main` or `master`)
   - **Source**: Select your repository and branch
   - **Configuration**: Cloud Build configuration file (create `cloudbuild.yaml`)
5. Click **"Create"**

## Free Tier and Pricing
- **Free Tier**: $300 credit for 90 days
- **Always Free**: Some services have always-free tiers
- **Cloud Run**: 2 million requests per month free
- **Container Registry**: 0.5 GB storage free
- **Cloud Build**: 120 build-minutes per day free

Monitor your usage in the GCP Console to avoid unexpected charges.

## Security Best Practices
- **Never commit service account keys to version control**
- Store service account keys securely (use secret management tools)
- Use least-privilege principle for service account roles
- Rotate service account keys periodically
- Enable audit logging for production projects
- Use separate projects for development and production
- Enable billing alerts to monitor costs

## Required IAM Roles
For deploying to Cloud Run:
- **Cloud Run Admin**: Deploy and manage Cloud Run services
- **Service Account User**: Use service accounts
- **Storage Admin**: Push/pull Docker images

For Cloud Build:
- **Cloud Build Service Account**: Run builds
- **Cloud Run Developer**: Deploy to Cloud Run from builds

## Troubleshooting
- **Permission denied**: Check that your account/service account has the required IAM roles
- **API not enabled**: Ensure all required APIs are enabled in your project
- **Billing not enabled**: Some services require billing to be enabled
- **Image push fails**: Verify Docker authentication is configured correctly
- **Deployment fails**: Check Cloud Run logs in the GCP Console

## Additional Resources
- [GCP Documentation](https://cloud.google.com/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [GCP Free Tier](https://cloud.google.com/free)
- [GCP Support](https://cloud.google.com/support)

