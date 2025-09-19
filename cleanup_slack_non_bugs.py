#!/usr/bin/env python3
"""
Cleanup Script: Remove Slack messages that are NOT bug reports
This script will remove all Slack messages that don't contain "AUTHOR" in their text.
Only legitimate bug reports (with "AUTHOR") will be kept.
"""

import boto3
import time
from botocore.exceptions import ClientError

# Configure AWS session
session = boto3.Session(profile_name='AdministratorAccess12hr-100142810612')
dynamodb = session.resource('dynamodb', region_name='us-west-2')
table = dynamodb.Table('BugTracker-evt-bugtracker')

def cleanup_slack_non_bugs():
    """Remove Slack messages that don't contain 'AUTHOR' (non-bug-report messages)."""
    print("🧹 Starting cleanup of non-bug-report Slack messages...")
    print("This will remove Slack messages that don't contain 'AUTHOR'")
    print("Only legitimate bug reports will be kept.\n")
    
    deleted_count = 0
    kept_count = 0
    total_slack = 0
    batch_items = []
    
    # Scan the table in chunks
    scan_kwargs = {}
    
    while True:
        try:
            response = table.scan(**scan_kwargs)
            
            for item in response['Items']:
                source = item.get('sourceSystem', '')
                
                if source == 'slack':
                    total_slack += 1
                    text = item.get('text', '')
                    
                    # Check if this is a legitimate bug report (contains "AUTHOR")
                    if 'AUTHOR' in text.upper():
                        kept_count += 1
                        print(f"✅ Keeping: {text[:50]}...")
                    else:
                        # This is not a bug report, mark for deletion
                        batch_items.append({
                            'PK': item['PK'],
                            'SK': item['SK']
                        })
                        deleted_count += 1
                        print(f"❌ Deleting: {text[:50]}...")
                        
                        # Delete in batches of 25 (DynamoDB limit)
                        if len(batch_items) >= 25:
                            delete_batch(batch_items)
                            batch_items = []
                            time.sleep(0.1)  # Rate limiting
            
            # Check if there are more items
            if 'LastEvaluatedKey' not in response:
                break
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
            
        except ClientError as e:
            print(f"Error scanning table: {e}")
            break
    
    # Delete any remaining items
    if batch_items:
        delete_batch(batch_items)
    
    print(f"\n📊 Cleanup Results:")
    print(f"Total Slack messages found: {total_slack}")
    print(f"Messages kept (with AUTHOR): {kept_count}")
    print(f"Messages deleted (without AUTHOR): {deleted_count}")
    
    return deleted_count, kept_count

def delete_batch(batch_items):
    """Delete a batch of items from DynamoDB."""
    try:
        with table.batch_writer() as batch:
            for item in batch_items:
                batch.delete_item(
                    Key={
                        'PK': item['PK'],
                        'SK': item['SK']
                    }
                )
        print(f"🗑️  Deleted batch of {len(batch_items)} items")
    except ClientError as e:
        print(f"Error deleting batch: {e}")

def verify_cleanup():
    """Verify the cleanup results."""
    print("\n🔍 Verifying cleanup results...")
    
    try:
        # Count remaining Slack messages
        response = table.scan(
            FilterExpression='sourceSystem = :source',
            ExpressionAttributeValues={':source': 'slack'}
        )
        
        total_slack = response['Count']
        
        # Continue scanning if there are more items
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression='sourceSystem = :source',
                ExpressionAttributeValues={':source': 'slack'},
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            total_slack += response['Count']
        
        print(f"📈 Remaining Slack messages: {total_slack}")
        
        # Count messages with AUTHOR
        response = table.scan(
            FilterExpression='sourceSystem = :source AND contains(#text, :author)',
            ExpressionAttributeNames={'#text': 'text'},
            ExpressionAttributeValues={':source': 'slack', ':author': 'AUTHOR'}
        )
        
        with_author = response['Count']
        
        # Continue scanning if there are more items
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression='sourceSystem = :source AND contains(#text, :author)',
                ExpressionAttributeNames={'#text': 'text'},
                ExpressionAttributeValues={':source': 'slack', ':author': 'AUTHOR'},
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            with_author += response['Count']
        
        print(f"📈 Messages with AUTHOR: {with_author}")
        print(f"📈 Messages without AUTHOR: {total_slack - with_author}")
        
        if total_slack == with_author:
            print("✅ SUCCESS: All remaining Slack messages are legitimate bug reports!")
        else:
            print("⚠️  WARNING: Some non-bug-report messages may still remain")
            
    except ClientError as e:
        print(f"Error verifying cleanup: {e}")

def main():
    print("🗑️  SLACK MESSAGE CLEANUP")
    print("=" * 50)
    print("This will remove Slack messages that are NOT bug reports")
    print("Only messages containing 'AUTHOR' will be kept")
    print("Expected result: Much fewer Slack records in dashboard\n")
    
    try:
        deleted_count, kept_count = cleanup_slack_non_bugs()
        
        verify_cleanup()
        
        print(f"\n🎯 Expected dashboard results after cleanup:")
        print(f"- Slack records: {kept_count} (should be much lower)")
        print(f"- Zendesk records: 5,536 (unchanged)")
        print(f"- Shortcut records: 172 (unchanged)")
        print(f"- Total records: {kept_count + 5536 + 172}")
        
    except Exception as e:
        print(f"Error during cleanup: {e}")

if __name__ == "__main__":
    main()
