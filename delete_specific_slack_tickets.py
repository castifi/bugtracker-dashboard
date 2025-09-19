#!/usr/bin/env python3
"""
Delete specific Slack tickets that match a certain text pattern.

This script targets Slack records that start with:
"*AUTHOR* • _<@U06C0374R2S>_ *PLATFORM / COMPANY(s)* • _Alessi Hartigan_"
"""

import boto3
import json
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
table = dynamodb.Table('BugTracker-evt-bugtracker')

def find_matching_slack_records():
    """Find Slack records that match the specific pattern."""
    print("🔍 Scanning for specific Slack records to delete...")
    
    # The pattern to match
    target_pattern = "*AUTHOR*\n• _<@U06C0374R2S>_\n*PLATFORM / COMPANY(s)*\n• _Alessi Hartigan_"
    
    matching_records = []
    
    # Scan all Slack records
    response = table.scan(
        FilterExpression="begins_with(PK, :prefix)",
        ExpressionAttributeValues={':prefix': 'SL-'},
        ProjectionExpression="PK, SK, #text",
        ExpressionAttributeNames={'#text': 'text'}
    )
    
    # Process initial batch
    for item in response['Items']:
        text = item.get('text', '')
        if target_pattern in text:
            matching_records.append(item)
    
    # Handle pagination
    while 'LastEvaluatedKey' in response:
        response = table.scan(
            FilterExpression="begins_with(PK, :prefix)",
            ExpressionAttributeValues={':prefix': 'SL-'},
            ProjectionExpression="PK, SK, #text",
            ExpressionAttributeNames={'#text': 'text'},
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        
        for item in response['Items']:
            text = item.get('text', '')
            if target_pattern in text:
                matching_records.append(item)
    
    print(f"📊 Found {len(matching_records)} matching Slack records")
    
    return matching_records

def delete_records(records, dry_run=True):
    """Delete the specified records."""
    deleted_count = 0
    
    for record in records:
        print(f"🗑️ {'[DRY RUN] ' if dry_run else ''}Deleting: {record['PK']}")
        
        # Show a preview of the text
        text_preview = record.get('text', '')[:150] + '...' if len(record.get('text', '')) > 150 else record.get('text', '')
        print(f"   📝 Text preview: {text_preview}")
        
        if not dry_run:
            try:
                table.delete_item(
                    Key={
                        'PK': record['PK'],
                        'SK': record['SK']
                    }
                )
                deleted_count += 1
                print(f"   ✅ Successfully deleted {record['PK']}")
            except Exception as e:
                print(f"   ❌ Error deleting {record['PK']}: {e}")
        else:
            print(f"   🔍 Would delete: PK={record['PK']}, SK={record['SK']}")
    
    return deleted_count

def main():
    print("🚀 Starting targeted Slack ticket deletion...")
    print("🎯 Target: Alessi Hartigan tickets with @U06C0374R2S")
    print("=" * 60)
    
    # Step 1: Find matching records
    matching_records = find_matching_slack_records()
    
    if not matching_records:
        print("✅ No matching Slack records found!")
        return
    
    # Step 2: Show what we found
    print(f"\n📊 SUMMARY:")
    print(f"   • Found {len(matching_records)} matching records")
    
    # Step 3: Show samples
    print(f"\n📋 SAMPLE RECORDS:")
    for i, record in enumerate(matching_records[:3]):
        print(f"   {i+1}. PK: {record['PK']}")
        print(f"      SK: {record['SK']}")
        text_preview = record.get('text', '')[:100] + '...' if len(record.get('text', '')) > 100 else record.get('text', '')
        print(f"      Text: {text_preview}")
        print()
    
    if len(matching_records) > 3:
        print(f"   ... and {len(matching_records) - 3} more records")
    
    # Step 4: Dry run first
    print(f"\n🔍 DRY RUN - No changes will be made:")
    print("-" * 40)
    delete_records(matching_records, dry_run=True)
    
    # Step 5: Confirm before actual deletion
    print(f"\n⚠️ This will DELETE {len(matching_records)} Slack records from DynamoDB!")
    print("🎯 Only records matching the Alessi Hartigan pattern will be deleted")
    
    while True:
        response = input("\n🤔 Proceed with deletion? (yes/no): ").lower().strip()
        if response in ['yes', 'y']:
            print("\n🗑️ EXECUTING DELETION...")
            print("-" * 40)
            deleted_count = delete_records(matching_records, dry_run=False)
            print(f"\n🎉 Deletion completed! Deleted {deleted_count} records.")
            break
        elif response in ['no', 'n']:
            print("❌ Deletion cancelled.")
            break
        else:
            print("Please enter 'yes' or 'no'")

if __name__ == "__main__":
    main()
