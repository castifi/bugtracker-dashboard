#!/bin/bash

# BugTracker Ingestion Monitor
# Use this script to check the status of automated ingestion

echo "🔍 BugTracker Automated Ingestion Monitor"
echo "=========================================="
echo "📅 $(date)"
echo ""

# Check if crontab is set up
echo "📋 Crontab Status:"
if crontab -l 2>/dev/null | grep -q "run_ingestion.sh"; then
    echo "✅ Automated ingestion is configured"
    crontab -l | grep "run_ingestion.sh"
else
    echo "❌ No automated ingestion configured"
fi
echo ""

# Check recent log entries
echo "📊 Recent Ingestion Logs:"
if [ -f "/tmp/bugtracker_ingestion.log" ]; then
    echo "✅ Log file exists"
    echo "📝 Last 10 log entries:"
    tail -10 /tmp/bugtracker_ingestion.log
else
    echo "❌ No log file found yet"
fi
echo ""

# Check current data in DynamoDB
echo "🗄️ Current DynamoDB Data:"
aws dynamodb scan --table-name BugTracker-evt-bugtracker --profile AdministratorAccess12hr-100142810612 --region us-west-2 --output json --select COUNT 2>/dev/null | jq '.Count' | sed 's/^/📈 Total bugs: /'

echo ""
echo "🎯 Next scheduled run:"
echo "⏰ Every hour at minute 0 (e.g., 9:00, 10:00, 11:00, etc.)"
echo ""
echo "🔄 To run ingestion manually: ./run_ingestion.sh"
echo "📋 To view logs: tail -f /tmp/bugtracker_ingestion.log"

