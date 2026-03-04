#!/usr/bin/env bash
# Deploy prototype and website to GCP Cloud Run (UAT)
# Prerequisites: gcloud auth login (kashif@metaklouds.com)

set -e

PROJECT_ID="${GCP_PROJECT_ID:-musaed-app}"
REGION="us-central1"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/musaed"
ENV="uat"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== Deploying to UAT (project: ${PROJECT_ID}) ==="
echo "Using account: $(gcloud config get-value account)"
echo ""

cd "$REPO_ROOT"

# 0. Ensure authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
  echo "Error: Not authenticated. Run: gcloud auth login"
  exit 1
fi

# 1. Create project if it doesn't exist
if ! gcloud projects describe "$PROJECT_ID" &>/dev/null; then
  echo "Creating project ${PROJECT_ID}..."
  gcloud projects create "$PROJECT_ID" --name="Musaed"
fi

gcloud config set project "$PROJECT_ID"

# 2. Enable required APIs
echo "Enabling APIs..."
gcloud services enable artifactregistry.googleapis.com run.googleapis.com --project="$PROJECT_ID"

# 3. Create Artifact Registry repo if it doesn't exist
if ! gcloud artifacts repositories describe musaed --location="$REGION" --project="$PROJECT_ID" &>/dev/null 2>&1; then
  echo "Creating Artifact Registry repository..."
  gcloud artifacts repositories create musaed \
    --repository-format=docker \
    --location="$REGION" \
    --project="$PROJECT_ID"
fi

# 4. Configure Docker for Artifact Registry
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# 5. Build and deploy prototype
echo ""
echo "=== Building prototype ==="
SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
PROTOTYPE_IMAGE="${REGISTRY}/prototype:${ENV}-${SHA}"

docker build --platform linux/amd64 -f apps/prototype/Dockerfile -t "$PROTOTYPE_IMAGE" .
docker push "$PROTOTYPE_IMAGE"

echo "Deploying prototype to Cloud Run..."
gcloud run deploy musaed-prototype-${ENV} \
  --image "$PROTOTYPE_IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --project="$PROJECT_ID"

# 6. Build and deploy website
echo ""
echo "=== Building website ==="
WEBSITE_IMAGE="${REGISTRY}/website:${ENV}-${SHA}"

docker build --platform linux/amd64 -f apps/website/Dockerfile -t "$WEBSITE_IMAGE" .
docker push "$WEBSITE_IMAGE"

echo "Deploying website to Cloud Run..."
gcloud run deploy musaed-website-${ENV} \
  --image "$WEBSITE_IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --project="$PROJECT_ID"

echo ""
echo "=== UAT deployment complete ==="
echo "Prototype: $(gcloud run services describe musaed-prototype-uat --region=$REGION --format='value(status.url)' 2>/dev/null || echo 'check Console')"
echo "Website:   $(gcloud run services describe musaed-website-uat --region=$REGION --format='value(status.url)' 2>/dev/null || echo 'check Console')"
