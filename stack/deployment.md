# Deployment & Containerization

## Docker

### Dockerfile
- Multi-stage builds for optimized image size
- Base image: `node:18-alpine` or `node:20-alpine`

## Google Cloud Platform

### Google Cloud Run or Google Kubernetes Engine (GKE)
- Serverless container deployment
- Auto-scaling capabilities
- HTTPS enabled by default

### Google Container Registry (GCR) or Artifact Registry
- Docker image storage

## CI/CD

### Google Cloud Build (optional)
- Automated builds on git push
- Deployment pipeline

## Deployment Commands

### Docker Build
```bash
# Build Docker image
docker build -t $APP_NAME .

# Run Docker container
docker run -p 3000:3000 --env-file .env $APP_NAME
```

### Deploy to Google Cloud Run
```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/$PROJECT_ID/$APP_NAME

# Deploy to Cloud Run
gcloud run deploy $APP_NAME \
  --image gcr.io/$PROJECT_ID/$APP_NAME \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

