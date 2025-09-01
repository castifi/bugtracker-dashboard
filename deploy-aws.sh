#!/bin/bash

# AWS Deployment Script for Bug Tracker Dashboard
set -e

echo "🚀 Starting AWS deployment for Bug Tracker Dashboard..."

# Configuration
STACK_NAME="bugtracker-dashboard"
ENVIRONMENT="dev"
REGION="us-west-2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' or 'aws sso login' first."
    exit 1
fi

print_status "AWS credentials verified"

# Check if required environment variables are set
if [ -z "$SHORTCUT_API_TOKEN" ]; then
    print_error "SHORTCUT_API_TOKEN environment variable is not set"
    exit 1
fi

if [ -z "$SLACK_BOT_TOKEN" ]; then
    print_error "SLACK_BOT_TOKEN environment variable is not set"
    exit 1
fi

if [ -z "$ZENDESK_EMAIL" ]; then
    print_error "ZENDESK_EMAIL environment variable is not set"
    exit 1
fi

if [ -z "$ZENDESK_API_TOKEN" ]; then
    print_error "ZENDESK_API_TOKEN environment variable is not set"
    exit 1
fi

print_status "Environment variables verified"

# Deploy CloudFormation stack
print_status "Deploying CloudFormation stack: $STACK_NAME"

aws cloudformation deploy \
    --template-file infrastructure/template-api-only.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        ShortcutApiToken=$SHORTCUT_API_TOKEN \
        SlackBotToken=$SLACK_BOT_TOKEN \
        ZendeskDomain="everyset" \
        ZendeskEmail=$ZENDESK_EMAIL \
        ZendeskApiToken=$ZENDESK_API_TOKEN \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

print_status "CloudFormation stack deployed successfully"

# Get stack outputs
print_status "Getting stack outputs..."

API_GATEWAY_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

DYNAMODB_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DynamoDBTableName`].OutputValue' \
    --output text)

print_status "API Gateway URL: $API_GATEWAY_URL"
print_status "DynamoDB Table: $DYNAMODB_TABLE"

# Create environment file for frontend
print_status "Creating environment configuration for frontend..."

cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=$API_GATEWAY_URL
NEXT_PUBLIC_AWS_REGION=$REGION
NEXT_PUBLIC_ENVIRONMENT=$ENVIRONMENT
EOF

print_status "Environment file created: .env.local"

# Instructions for frontend deployment
print_status "Backend deployment completed!"
echo ""
print_warning "Next steps:"
echo "1. Deploy the frontend to AWS Amplify:"
echo "   - Go to AWS Amplify Console"
echo "   - Connect your GitHub repository"
echo "   - Build settings will be automatically detected from amplify.yml"
echo ""
echo "2. Update the frontend API configuration:"
echo "   - The API Gateway URL is: $API_GATEWAY_URL"
echo "   - Update src/lib/config.ts with this URL"
echo ""
echo "3. Test the deployment:"
echo "   - The ingestion Lambda will run every hour automatically"
echo "   - You can manually trigger it from the AWS Lambda console"
echo ""
print_status "Deployment completed successfully! 🎉"
