#!/usr/bin/env python3
"""
Script to clean up invalid Slack records from DynamoDB
Removes Slack records that don't contain "AUTHOR" in their text content
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

def clean_invalid_slack_records():
    """Remove Slack records that don't contain 'AUTHOR' in their text"""
    
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
    table = dynamodb.Table('BugTracker-evt-bugtracker')
    
    print("🧹 Starting cleanup of invalid Slack records...")
    print("Target: Slack records without 'AUTHOR' in text content")
    
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
    
    # Identify invalid records (those without "AUTHOR" in text)
    invalid_records = []
    valid_records = []
    
    for record in slack_records:
        text = record.get('text', '')
        if isinstance(text, str) and 'AUTHOR' in text.upper():
            valid_records.append(record)
        else:
            invalid_records.append(record)
            
    print(f"✅ Valid Slack records (with AUTHOR): {len(valid_records)}")
    print(f"❌ Invalid Slack records (without AUTHOR): {len(invalid_records)}")
    
    if len(invalid_records) == 0:
        print("🎉 No invalid records found! Database is clean.")
        return
    
    # Show sample invalid records
    print("\n📋 Sample invalid records to be deleted:")
    for i, record in enumerate(invalid_records[:5]):
        text_preview = str(record.get('text', ''))[:100]
        print(f"  {i+1}. ID: {record.get('PK', 'Unknown')}")
        print(f"     Text: {text_preview}...")
        print(f"     Created: {record.get('createdAt', 'Unknown')}")
    
    if len(invalid_records) > 5:
        print(f"     ... and {len(invalid_records) - 5} more")
    
    # Ask for confirmation
    print(f"\n⚠️  About to DELETE {len(invalid_records)} invalid Slack records")
    confirmation = input("Do you want to proceed? (type 'DELETE' to confirm): ")
    
    if confirmation != 'DELETE':
        print("❌ Operation cancelled by user")
        return
    
    # Delete invalid records in batches
    print("\n🗑️  Starting deletion process...")
    deleted_count = 0
    batch_size = 25  # DynamoDB batch limit
    
    for i in range(0, len(invalid_records), batch_size):
        batch = invalid_records[i:i + batch_size]
        
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
                    print(f"🗑️  Deleted: {record.get('PK', 'Unknown')} ({deleted_count}/{len(invalid_records)})")
                except Exception as e:
                    print(f"❌ Error deleting {record.get('PK', 'Unknown')}: {str(e)}")
        
        # Small delay to avoid throttling
        time.sleep(0.1)
    
    print(f"\n✅ Cleanup completed!")
    print(f"📊 Final summary:")
    print(f"   - Total Slack records processed: {len(slack_records)}")
    print(f"   - Valid records (kept): {len(valid_records)}")
    print(f"   - Invalid records (deleted): {deleted_count}")
    print(f"   - Database now contains only valid Slack bug reports")

def verify_cleanup():
    """Verify that only valid Slack records remain"""
    
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
    
    # Check if any invalid records still exist
    invalid_remaining = []
    for record in remaining_slack:
        text = record.get('text', '')
        if not (isinstance(text, str) and 'AUTHOR' in text.upper()):
            invalid_remaining.append(record)
    
    if len(invalid_remaining) == 0:
        print("✅ All remaining Slack records are valid (contain AUTHOR)")
        print("🎉 Cleanup verification successful!")
    else:
        print(f"⚠️  Found {len(invalid_remaining)} invalid records still remaining")
        for record in invalid_remaining[:3]:
            print(f"   - {record.get('PK', 'Unknown')}: {str(record.get('text', ''))[:50]}...")

if __name__ == "__main__":
    print("🧹 Slack Records Cleanup Tool")
    print("=" * 40)
    
    try:
        clean_invalid_slack_records()
        verify_cleanup()
    except Exception as e:
        print(f"❌ Error during cleanup: {str(e)}")
        print("Please check your AWS credentials and DynamoDB table access")
