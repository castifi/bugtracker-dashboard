#!/usr/bin/env python3
"""
Cleanup script for duplicate Slack records in DynamoDB.

The issue: Python's hash() function is non-deterministic, causing the same Slack message
to get different PKs each time ingestion runs, creating duplicate records.

This script:
1. Identifies duplicate Slack records (same SK, different PKs)
2. Keeps the record with the earliest createdAt timestamp  
3. Deletes all other duplicates
"""

import boto3
import json
from collections import defaultdict
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
table = dynamodb.Table('BugTracker-evt-bugtracker')

def scan_duplicate_slack_records():
    """Scan for duplicate Slack records grouped by SK."""
    print("🔍 Scanning for duplicate Slack records...")
    
    # Track records by SK
    sk_groups = defaultdict(list)
    
    # Scan all Slack records
    response = table.scan(
        FilterExpression="begins_with(PK, :prefix)",
        ExpressionAttributeValues={':prefix': 'SL-'},
        ProjectionExpression="PK, SK, createdAt, #text",
        ExpressionAttributeNames={'#text': 'text'}
    )
    
    # Process initial batch
    for item in response['Items']:
        sk_groups[item['SK']].append(item)
    
    # Handle pagination
    while 'LastEvaluatedKey' in response:
        response = table.scan(
            FilterExpression="begins_with(PK, :prefix)",
            ExpressionAttributeValues={':prefix': 'SL-'},
            ProjectionExpression="PK, SK, createdAt, #text",
            ExpressionAttributeNames={'#text': 'text'},
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        
        for item in response['Items']:
            sk_groups[item['SK']].append(item)
    
    # Find duplicates
    duplicates = {sk: records for sk, records in sk_groups.items() if len(records) > 1}
    
    print(f"📊 Found {len(duplicates)} Slack messages with duplicates")
    print(f"📈 Total duplicate records to clean: {sum(len(records) - 1 for records in duplicates.values())}")
    
    return duplicates

def cleanup_duplicates(duplicates, dry_run=True):
    """Clean up duplicate records, keeping the earliest one."""
    total_deleted = 0
    
    for sk, records in duplicates.items():
        print(f"\n🔍 Processing SK: {sk}")
        print(f"   Found {len(records)} duplicates")
        
        # Sort by createdAt to find the earliest
        try:
            records.sort(key=lambda x: datetime.fromisoformat(x.get('createdAt', '1970-01-01T00:00:00')))
        except Exception as e:
            print(f"   ⚠️ Error sorting by createdAt: {e}")
            # Fallback: sort by PK
            records.sort(key=lambda x: x['PK'])
        
        # Keep the first (earliest), delete the rest
        keep_record = records[0]
        delete_records = records[1:]
        
        print(f"   ✅ Keeping: {keep_record['PK']} (created: {keep_record.get('createdAt', 'unknown')})")
        print(f"   🗑️ Deleting {len(delete_records)} duplicates:")
        
        for record in delete_records:
            print(f"      - {record['PK']} (created: {record.get('createdAt', 'unknown')})")
            
            if not dry_run:
                try:
                    table.delete_item(
                        Key={
                            'PK': record['PK'],
                            'SK': record['SK']
                        }
                    )
                    total_deleted += 1
                    print(f"        ✅ Deleted {record['PK']}")
                except Exception as e:
                    print(f"        ❌ Error deleting {record['PK']}: {e}")
        
        # Show preview of the text to confirm it's the same message
        text_preview = keep_record.get('text', '')[:100] + '...' if len(keep_record.get('text', '')) > 100 else keep_record.get('text', '')
        print(f"   📝 Message preview: {text_preview}")
    
    return total_deleted

def main():
    print("🚀 Starting Slack duplicate cleanup...")
    print("=" * 60)
    
    # Step 1: Find duplicates
    duplicates = scan_duplicate_slack_records()
    
    if not duplicates:
        print("✅ No duplicate Slack records found!")
        return
    
    # Step 2: Show summary
    print(f"\n📊 SUMMARY:")
    print(f"   • {len(duplicates)} unique messages with duplicates")
    total_duplicates = sum(len(records) - 1 for records in duplicates.values())
    print(f"   • {total_duplicates} total duplicate records to delete")
    
    # Step 3: Show top offenders
    print(f"\n🔥 TOP OFFENDERS:")
    sorted_duplicates = sorted(duplicates.items(), key=lambda x: len(x[1]), reverse=True)
    for i, (sk, records) in enumerate(sorted_duplicates[:5]):
        print(f"   {i+1}. {len(records)} copies: {sk}")
    
    # Step 4: Dry run first
    print(f"\n🔍 DRY RUN - No changes will be made:")
    print("-" * 40)
    cleanup_duplicates(duplicates, dry_run=True)
    
    # Step 5: Confirm before actual deletion
    print(f"\n⚠️ This will DELETE {total_duplicates} duplicate records from DynamoDB!")
    print("✅ Original messages will be preserved (keeping earliest timestamp)")
    
    while True:
        response = input("\n🤔 Proceed with cleanup? (yes/no): ").lower().strip()
        if response in ['yes', 'y']:
            print("\n🗑️ EXECUTING CLEANUP...")
            print("-" * 40)
            deleted_count = cleanup_duplicates(duplicates, dry_run=False)
            print(f"\n🎉 Cleanup completed! Deleted {deleted_count} duplicate records.")
            break
        elif response in ['no', 'n']:
            print("❌ Cleanup cancelled.")
            break
        else:
            print("Please enter 'yes' or 'no'")

if __name__ == "__main__":
    main()
