#!/bin/bash

# This script must be run from the project's root directory (e.g., CoinBack/)

set -e

# --- CONFIGURATION ---
REGION="us-east-1"
CLUSTER="coinback-prod-cluster"
SERVICE="api-service"
DB_SECRET_NAME="prod/coinback/database"
API_TASK_DEF="coinback-api-task"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region ${REGION})
ECR_REPO_URL="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/coinback-backend-api"

# --- STYLES ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=================================================="
echo -e "🚀 COINBACK PRODUCTION DEPLOYMENT SCRIPT"
echo -e "==================================================${NC}\n"

# --- PRE-RUN CHECKS ---
if [ ! -f "./backend/schema.sql" ] || [ ! -f "./backend/routes/users.js" ]; then
    echo -e "${RED}Error: Critical files are missing or script is being run from the wrong directory."
    echo -e "Please ensure you are in the root 'CoinBack' directory before running.${NC}"
    exit 1
fi

if ! command -v psql &> /dev/null || ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: 'psql' and 'jq' are required. Please install them to continue.${NC}"
    echo "On macOS: brew install postgresql jq"
    echo "On Debian/Ubuntu: sudo apt-get install postgresql-client jq"
    exit 1
fi

# --- STAGE 1: APPLY DATABASE SCHEMA ---
echo -e "${YELLOW}====== STAGE 1: APPLYING DATABASE SCHEMA ======\n${NC}"

DB_SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id ${DB_SECRET_NAME} --region ${REGION} --query SecretString --output text)
DB_HOST=$(echo ${DB_SECRET_JSON} | jq -r .DB_HOST)
DB_USER=$(echo ${DB_SECRET_JSON} | jq -r .DB_USER)
DB_NAME=$(echo ${DB_SECRET_JSON} | jq -r .DB_NAME)
export PGPASSWORD=$(echo ${DB_SECRET_JSON} | jq -r .DB_PASSWORD)

echo "Connecting to database '${DB_NAME}' to apply schema..."
psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -f "./backend/schema.sql"
echo -e "${GREEN}✅ Database schema applied successfully.${NC}"

# --- STAGE 2: DEPLOY BACKEND SERVICE ---
echo -e "\n${YELLOW}====== STAGE 2: BUILDING & DEPLOYING BACKEND SERVICE ======\n${NC}"

echo "Logging in to AWS ECR..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_REPO_URL}

echo "Building and pushing the production Docker image..."
docker buildx build \
  -t "${ECR_REPO_URL}:latest" \
  -f ./backend/Dockerfile ./backend \
  --platform linux/amd64 \
  --provenance=false \
  --push

echo -e "${GREEN}✅ Docker image pushed to ECR successfully.${NC}"

echo "Updating ECS service '${SERVICE}' to force a new deployment..."
aws ecs update-service \
  --cluster ${CLUSTER} \
  --service ${SERVICE} \
  --task-definition ${API_TASK_DEF} \
  --force-new-deployment \
  --region ${REGION} > /dev/null

echo "Monitoring deployment stability. This may take a few minutes..."
aws ecs wait services-stable --cluster ${CLUSTER} --services ${SERVICE} --region ${REGION}

echo -e "\n${GREEN}==========================================="
echo -e "   🚀 DEPLOYMENT COMPLETE! 🚀"
echo -e " The Coinback backend is now fully updated."
echo -e "===========================================${NC}"