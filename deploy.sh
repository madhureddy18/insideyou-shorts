#!/usr/bin/env bash
# One-command deploy of InsideYou Studio to Cloud Run. Run it in Google Cloud Shell:
#   bash deploy.sh
# Safe to re-run: it updates the app with the latest code from this folder.
set -euo pipefail

PROJECT="${PROJECT:-katha-tv-512618}"
REGION="${REGION:-asia-south1}"
SERVICE="insideyou-studio"
JOB="insideyou-worker"
SA_NAME="shorts-app"
BUCKET="${PROJECT}-insideyou-shorts"
REPO="shorts"

say(){ printf "\n\033[1;33m==> %s\033[0m\n" "$*"; }

gcloud config set project "$PROJECT" >/dev/null
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
SA="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/app:$(date +%Y%m%d-%H%M%S)"

say "Enabling Google APIs (first time takes ~1 min)"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com \
  storage.googleapis.com aiplatform.googleapis.com iam.googleapis.com texttospeech.googleapis.com --quiet

say "Storage bucket for your Shorts"
gcloud storage buckets describe "gs://${BUCKET}" >/dev/null 2>&1 || \
  gcloud storage buckets create "gs://${BUCKET}" --location="$REGION" --uniform-bucket-level-access --quiet

say "Service account the app runs as (no key files needed)"
gcloud iam service-accounts describe "$SA" >/dev/null 2>&1 || \
  gcloud iam service-accounts create "$SA_NAME" --display-name="InsideYou Studio app" --quiet
sleep 5
for ROLE in roles/aiplatform.user roles/run.developer roles/logging.logWriter roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:${SA}" --role="$ROLE" \
    --condition=None --quiet >/dev/null
done
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" --member="serviceAccount:${SA}" \
  --role=roles/storage.objectAdmin --quiet >/dev/null
gcloud iam service-accounts add-iam-policy-binding "$SA" --member="serviceAccount:${SA}" \
  --role=roles/iam.serviceAccountUser --quiet >/dev/null

say "Letting Cloud Build build the container"
BUILD_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
for ROLE in roles/cloudbuild.builds.builder roles/artifactregistry.writer roles/storage.admin roles/logging.logWriter; do
  gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:${BUILD_SA}" --role="$ROLE" \
    --condition=None --quiet >/dev/null
done
gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "$REPO" --repository-format=docker --location="$REGION" --quiet

say "Building the app (~3-5 min)"
gcloud builds submit --tag "$IMAGE" --region "$REGION" \
  --gcs-source-staging-dir "gs://${BUCKET}/build-source" --gcs-log-dir "gs://${BUCKET}/build-logs" --quiet .

current_env(){  # read an env var from the already-deployed app (so re-deploys keep your password)
  gcloud run services describe "$SERVICE" --region "$REGION" --format=json 2>/dev/null | python3 -c \
    "import json,sys;e=json.load(sys.stdin)['spec']['template']['spec']['containers'][0].get('env',[]);print(next((x.get('value','') for x in e if x['name']=='$1'),''))" 2>/dev/null || true
}
APP_PASSWORD="${APP_PASSWORD:-$(current_env APP_PASSWORD)}"   # optional: no password = no login screen
APP_SECRET="${APP_SECRET:-$(current_env APP_SECRET)}"
APP_SECRET="${APP_SECRET:-$(python3 -c 'import secrets;print(secrets.token_hex(24))')}"
ENVS="PROJECT_ID=${PROJECT},BUCKET=${BUCKET},REGION=${REGION},WORKER_JOB=${JOB},RUN_MODE=cloudrun"

say "Deploying the worker (does the heavy video work)"
gcloud run jobs deploy "$JOB" --image "$IMAGE" --region "$REGION" --service-account "$SA" \
  --command python --args="-m,app.worker" --task-timeout 21600 --max-retries 0 \
  --cpu 2 --memory 4Gi --set-env-vars "$ENVS" --quiet

say "Deploying the web app"
if ! gcloud run deploy "$SERVICE" --image "$IMAGE" --region "$REGION" --service-account "$SA" \
    --no-invoker-iam-check --cpu 1 --memory 1Gi --min-instances 0 --max-instances 2 --timeout 300 \
    --set-env-vars "${ENVS}${APP_PASSWORD:+,APP_PASSWORD=${APP_PASSWORD}},APP_SECRET=${APP_SECRET}" --quiet; then
  say "Retrying with public access flag"
  gcloud run deploy "$SERVICE" --image "$IMAGE" --region "$REGION" --service-account "$SA" \
    --allow-unauthenticated --cpu 1 --memory 1Gi --min-instances 0 --max-instances 2 --timeout 300 \
    --set-env-vars "${ENVS}${APP_PASSWORD:+,APP_PASSWORD=${APP_PASSWORD}},APP_SECRET=${APP_SECRET}" --quiet
fi

URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')
say "Done! Open your app: ${URL}"
echo "Bookmark it on your phone (Chrome menu -> Add to Home screen)."
