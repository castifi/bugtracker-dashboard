#!/usr/bin/env python3
"""
Mass cleanup script for Alessi Hartigan duplicate Slack records
Run this script independently to delete 726+ duplicate records
"""

import boto3
import json
from decimal import Decimal

def main():
    # Initialize DynamoDB with the correct AWS profile
    session = boto3.Session(profile_name='AdministratorAccess12hr-100142810612')
    dynamodb = session.resource('dynamodb', region_name='us-west-2')
    table = dynamodb.Table('BugTracker-evt-bugtracker')
    
    print("🧹 Starting Alessi Hartigan cleanup...")
    print("This will delete all Slack records containing 'Alessi Hartigan'")
    
    # Confirm before proceeding
    confirm = input("Are you sure you want to proceed? (yes/no): ")
    if confirm.lower() != 'yes':
        print("❌ Cancelled")
        return
    
    deleted_count = 0
    scan_count = 0
    
    # Scan for Alessi Hartigan records
    response = table.scan(
        FilterExpression="sourceSystem = :source AND contains(#txt, :alessi)",
        ExpressionAttributeValues={
            ':source': 'slack',
            ':alessi': 'Alessi Hartigan'
        },
        ExpressionAttributeNames={
            '#txt': 'text'
        }
    )
    
    while True:
        items = response.get('Items', [])
        scan_count += len(items)
        
        # Delete items in batches
        for item in items:
            try:
                table.delete_item(
                    Key={
                        'PK': item['PK'],
                        'SK': item['SK']
                    }
                )
                deleted_count += 1
                if deleted_count % 50 == 0:
                    print(f"🗑️  Deleted {deleted_count} records...")
            except Exception as e:
                print(f"❌ Error deleting {item['PK']}: {e}")
        
        # Continue scanning if there are more items
        if 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression="sourceSystem = :source AND contains(#txt, :alessi)",
                ExpressionAttributeValues={
                    ':source': 'slack',
                    ':alessi': 'Alessi Hartigan'
                },
                ExpressionAttributeNames={
                    '#txt': 'text'
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
        else:
            break
    
    print(f"✅ Cleanup completed!")
    print(f"📊 Scanned: {scan_count} records")
    print(f"🗑️  Deleted: {deleted_count} records")

if __name__ == "__main__":
    main()
