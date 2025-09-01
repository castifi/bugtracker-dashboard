#!/bin/bash

# Quick Setup Script for Bug Tracker Dashboard AWS Deployment
echo "🚀 Bug Tracker Dashboard - AWS Deployment Setup"
echo "================================================"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured."
    echo "Please run one of the following:"
    echo "   aws configure"
    echo "   aws sso login"
    exit 1
fi

echo "✅ AWS CLI and credentials verified"

# Prompt for environment variables
echo ""
echo "Please provide the required API tokens:"
echo ""

read -p "Shortcut API Token: " SHORTCUT_API_TOKEN
read -p "Slack Bot Token: " SLACK_BOT_TOKEN
read -p "Zendesk Email: " ZENDESK_EMAIL
read -p "Zendesk API Token: " ZENDESK_API_TOKEN

# Export environment variables
export SHORTCUT_API_TOKEN
export SLACK_BOT_TOKEN
export ZENDESK_EMAIL
export ZENDESK_API_TOKEN

echo ""
echo "✅ Environment variables set"
echo ""

# Confirm deployment
read -p "Ready to deploy to AWS? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting deployment..."
echo ""

# Run deployment script
./deploy-aws.sh

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Deploy frontend to AWS Amplify"
echo "2. Test the dashboard"
echo "3. Monitor ingestion logs"
echo ""
echo "For detailed instructions, see AWS_DEPLOYMENT_GUIDE.md"
