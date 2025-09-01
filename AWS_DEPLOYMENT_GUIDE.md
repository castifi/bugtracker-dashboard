# AWS Deployment Guide for Bug Tracker Dashboard

This guide will help you deploy the Bug Tracker Dashboard to AWS with automated ingestion.

## Prerequisites

1. **AWS CLI** installed and configured
2. **AWS SSO** or IAM credentials with appropriate permissions
3. **API Tokens** for external services:
   - Shortcut API Token
   - Slack Bot Token
   - Zendesk API Token

## Quick Deployment

### 1. Set Environment Variables

```bash
export SHORTCUT_API_TOKEN="your-shortcut-token"
export SLACK_BOT_TOKEN="your-slack-token"
export ZENDESK_EMAIL="your-zendesk-email"
export ZENDESK_API_TOKEN="your-zendesk-token"
```

### 2. Deploy Backend Infrastructure

```bash
./deploy-aws.sh
```

This will:
- Deploy DynamoDB table
- Create Lambda functions for API and ingestion
- Set up API Gateway
- Configure EventBridge for hourly ingestion
- Create necessary IAM roles and permissions

### 3. Deploy Frontend to AWS Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Connect your GitHub repository
4. Build settings will be automatically detected from `amplify.yml`
5. Deploy

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Lambda API    │
│   (Amplify)     │◄──►│                 │◄──►│                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   EventBridge   │    │  Ingestion      │    │   DynamoDB      │
│   (Scheduler)   │◄──►│  Lambda         │◄──►│   Table         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### Backend Services

1. **DynamoDB Table**: Stores bug data from all sources
2. **API Lambda**: Handles frontend API requests
3. **Ingestion Lambda**: Fetches data from external APIs
4. **API Gateway**: Provides REST API endpoints
5. **EventBridge**: Triggers ingestion every hour

### Frontend

1. **Next.js App**: React-based dashboard
2. **AWS Amplify**: Hosting and CI/CD
3. **Ant Design**: UI components
4. **Recharts**: Data visualization

## Configuration

### Environment Variables

The deployment script creates `.env.local` with:
- `NEXT_PUBLIC_API_BASE_URL`: API Gateway URL
- `NEXT_PUBLIC_AWS_REGION`: AWS region
- `NEXT_PUBLIC_ENVIRONMENT`: Environment name

### API Endpoints

- `GET /bugs?query_type=summary`: Get summary statistics
- `GET /bugs?query_type=time_series`: Get time series data
- `GET /bugs?query_type=by_source&source_system=slack`: Get bugs by source

## Monitoring and Maintenance

### CloudWatch Logs

- **API Lambda**: `/aws/lambda/BugTrackerAPI-dev`
- **Ingestion Lambda**: `/aws/lambda/BugTrackerIngestion-dev`

### Manual Ingestion

Trigger ingestion manually:
```bash
aws lambda invoke \
  --function-name BugTrackerIngestion-dev \
  --region us-west-2 \
  response.json
```

### Monitoring Dashboard

Create CloudWatch dashboard to monitor:
- Lambda execution times
- DynamoDB read/write capacity
- API Gateway requests
- Error rates

## Troubleshooting

### Common Issues

1. **Lambda Timeout**: Increase timeout in CloudFormation template
2. **API Gateway CORS**: CORS headers are configured in Lambda
3. **DynamoDB Permissions**: IAM roles include necessary permissions
4. **Environment Variables**: Check Lambda environment variables

### Logs

Check logs for debugging:
```bash
# API Lambda logs
aws logs tail /aws/lambda/BugTrackerAPI-dev --follow

# Ingestion Lambda logs
aws logs tail /aws/lambda/BugTrackerIngestion-dev --follow
```

## Cost Optimization

1. **DynamoDB**: Uses on-demand billing (pay per request)
2. **Lambda**: Free tier includes 1M requests/month
3. **API Gateway**: Free tier includes 1M requests/month
4. **Amplify**: Free tier includes 15GB storage and 15GB transfer

## Security

1. **API Tokens**: Stored as Lambda environment variables
2. **IAM Roles**: Least privilege principle applied
3. **CORS**: Configured for frontend domain only
4. **HTTPS**: All endpoints use HTTPS

## Updates and Maintenance

### Update Lambda Code

1. Modify the CloudFormation template
2. Redeploy the stack:
```bash
./deploy-aws.sh
```

### Update Frontend

1. Push changes to GitHub
2. Amplify automatically builds and deploys

### Database Migration

1. Export data from old table
2. Import to new table
3. Update Lambda environment variables

## Support

For issues:
1. Check CloudWatch logs
2. Verify environment variables
3. Test API endpoints manually
4. Check IAM permissions
