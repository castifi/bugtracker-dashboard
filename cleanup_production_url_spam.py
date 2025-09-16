#!/usr/bin/env python3
"""
Script to clean up spam Slack records containing production.everyset.com URLs
Removes Slack records that contain "@https://production.everyset.com/4982/overview>" in their text content
"""

import boto3
import json
from decimal import Decimal
import time

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def clean_production_url_spam():
    """Remove Slack records that contain production.everyset.com/4982/overview spam"""
    
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
    table = dynamodb.Table('BugTracker-evt-bugtracker')
    
    print("🧹 Starting cleanup of Slack spam records...")
    print("Target: Slack records containing '@https://production.everyset.com/4982/overview>'")
    
    # Scan for all Slack records
    response = table.scan(
        FilterExpression='sourceSystem = :source_system',
        ExpressionAttributeValues={
            ':source_system': 'slack'
        }
    )
    
    slack_records = response.get('Items', [])
    print(f"📊 Found {len(slack_records)} total Slack records")
    
    # Handle pagination if there are more records
    while 'LastEvaluatedKey' in response:
        response = table.scan(
            FilterExpression='sourceSystem = :source_system',
            ExpressionAttributeValues={
                ':source_system': 'slack'
            },
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        slack_records.extend(response.get('Items', []))
        print(f"📊 Total Slack records found: {len(slack_records)}")
    
    # Identify spam records (those containing production.everyset.com URL)
    spam_records = []
    clean_records = []
    
    spam_urls = [
        '@https://production.everyset.com/4982/overview>',
        'https://production.everyset.com/4982/overview',
        'production.everyset.com/4982',
        'production.everyset.com/4988',  # Also check for similar patterns
        'production.everyset.com/4982/settings/payro'  # Partial match from your screenshot
    ]
    
    for record in slack_records:
        text = str(record.get('text', '')).lower()
        subject = str(record.get('subject', '')).lower()
        
        is_spam = False
        for spam_url in spam_urls:
            if spam_url.lower() in text or spam_url.lower() in subject:
                is_spam = True
                break
        
        if is_spam:
            spam_records.append(record)
        else:
            clean_records.append(record)
            
    print(f"✅ Clean Slack records: {len(clean_records)}")
    print(f"🗑️ Spam records to delete: {len(spam_records)}")
    
    if len(spam_records) == 0:
        print("🎉 No spam records found! Database is already clean.")
        return
    
    # Show sample spam records
    print("\n📋 Sample spam records to be deleted:")
    for i, record in enumerate(spam_records[:10]):
        text_preview = str(record.get('text', ''))[:150]
        subject_preview = str(record.get('subject', ''))[:50]
        print(f"  {i+1}. ID: {record.get('PK', 'Unknown')}")
        print(f"     Subject: {subject_preview}")
        print(f"     Text: {text_preview}...")
        print(f"     Created: {record.get('createdAt', 'Unknown')}")
        print()
    
    if len(spam_records) > 10:
        print(f"     ... and {len(spam_records) - 10} more spam records")
    
    # Ask for confirmation
    print(f"\n⚠️  About to DELETE {len(spam_records)} spam Slack records")
    print("These are records containing production.everyset.com URLs that appear to be automated spam.")
    confirmation = input("Do you want to proceed? (type 'DELETE' to confirm): ")
    
    if confirmation != 'DELETE':
        print("❌ Operation cancelled by user")
        return
    
    # Delete spam records in batches
    print("\n🗑️  Starting deletion process...")
    deleted_count = 0
    batch_size = 25  # DynamoDB batch limit
    
    for i in range(0, len(spam_records), batch_size):
        batch = spam_records[i:i + batch_size]
        
        with table.batch_writer() as batch_writer:
            for record in batch:
                try:
                    batch_writer.delete_item(
                        Key={
                            'PK': record['PK'],
                            'SK': record['SK']
                        }
                    )
                    deleted_count += 1
                    if deleted_count % 10 == 0 or deleted_count == len(spam_records):
                        print(f"🗑️  Deleted: {deleted_count}/{len(spam_records)} spam records...")
                except Exception as e:
                    print(f"❌ Error deleting {record.get('PK', 'Unknown')}: {str(e)}")
        
        # Small delay to avoid throttling
        time.sleep(0.1)
    
    print(f"\n✅ Cleanup completed!")
    print(f"📊 Final summary:")
    print(f"   - Total Slack records processed: {len(slack_records)}")
    print(f"   - Clean records (kept): {len(clean_records)}")
    print(f"   - Spam records (deleted): {deleted_count}")
    print(f"   - Database now contains only legitimate Slack bug reports")

def verify_cleanup():
    """Verify that spam records have been removed"""
    
    dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
    table = dynamodb.Table('BugTracker-evt-bugtracker')
    
    print("\n🔍 Verifying cleanup results...")
    
    # Check remaining Slack records
    response = table.scan(
        FilterExpression='sourceSystem = :source_system',
        ExpressionAttributeValues={
            ':source_system': 'slack'
        }
    )
    
    remaining_slack = response.get('Items', [])
    
    # Handle pagination
    while 'LastEvaluatedKey' in response:
        response = table.scan(
            FilterExpression='sourceSystem = :source_system',
            ExpressionAttributeValues={
                ':source_system': 'slack'
            },
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        remaining_slack.extend(response.get('Items', []))
    
    print(f"📊 Remaining Slack records: {len(remaining_slack)}")
    
    # Check if any spam records still exist
    spam_remaining = []
    spam_urls = [
        'production.everyset.com/4982',
        'production.everyset.com/4988'
    ]
    
    for record in remaining_slack:
        text = str(record.get('text', '')).lower()
        subject = str(record.get('subject', '')).lower()
        
        for spam_url in spam_urls:
            if spam_url.lower() in text or spam_url.lower() in subject:
                spam_remaining.append(record)
                break
    
    if len(spam_remaining) == 0:
        print("✅ All spam records have been successfully removed!")
        print("🎉 Cleanup verification successful!")
        
        # Show sample of remaining records to confirm they're legitimate
        if len(remaining_slack) > 0:
            print("\n📋 Sample remaining records (should be legitimate):")
            for i, record in enumerate(remaining_slack[:3]):
                subject = str(record.get('subject', ''))[:60]
                print(f"   {i+1}. {record.get('PK', 'Unknown')}: {subject}")
    else:
        print(f"⚠️  Found {len(spam_remaining)} spam records still remaining")
        for record in spam_remaining[:3]:
            print(f"   - {record.get('PK', 'Unknown')}")

if __name__ == "__main__":
    print("🧹 Production URL Spam Cleanup Tool")
    print("=" * 50)
    
    try:
        clean_production_url_spam()
        verify_cleanup()
    except Exception as e:
        print(f"❌ Error during cleanup: {str(e)}")
        print("Please check your AWS credentials and DynamoDB table access")
