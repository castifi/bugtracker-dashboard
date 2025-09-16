#!/usr/bin/env python3
"""
Fast cleanup script for production URL spam in Slack records
Uses efficient queries and batch operations
"""

import boto3
import json
from decimal import Decimal
import time
from concurrent.futures import ThreadPoolExecutor
import threading

def clean_spam_fast():
    """Fast cleanup using parallel processing and efficient queries"""
    
    dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
    table = dynamodb.Table('BugTracker-evt-bugtracker')
    
    print("🚀 Fast Spam Cleanup - Production URL Records")
    print("=" * 50)
    
    # Use a more targeted approach - look for recent records first
    spam_patterns = [
        'production.everyset.com/4982',
        'production.everyset.com/4988'
    ]
    
    print("🔍 Quick scan for spam records...")
    
    # Use parallel scanning for speed
    def scan_segment(segment_num, total_segments):
        local_dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
        local_table = local_dynamodb.Table('BugTracker-evt-bugtracker')
        
        spam_found = []
        
        response = local_table.scan(
            FilterExpression='sourceSystem = :source_system',
            ExpressionAttributeValues={':source_system': 'slack'},
            Segment=segment_num,
            TotalSegments=total_segments,
            Select='ALL_ATTRIBUTES'
        )
        
        items = response.get('Items', [])
        
        for item in items:
            text = str(item.get('text', '')).lower()
            subject = str(item.get('subject', '')).lower()
            
            for pattern in spam_patterns:
                if pattern in text or pattern in subject:
                    spam_found.append(item)
                    break
        
        return spam_found
    
    # Use 4 parallel segments for faster scanning
    all_spam = []
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(scan_segment, i, 4) for i in range(4)]
        for future in futures:
            spam_segment = future.result()
            all_spam.extend(spam_segment)
            print(f"📊 Found {len(spam_segment)} spam records in segment")
    
    print(f"\n🎯 Total spam records found: {len(all_spam)}")
    
    if len(all_spam) == 0:
        print("✅ No spam records found!")
        return
    
    # Show first few examples
    print("\n📋 Sample spam records:")
    for i, record in enumerate(all_spam[:5]):
        subject = str(record.get('subject', ''))[:60]
        print(f"  {i+1}. {record.get('PK', 'Unknown')}: {subject}")
    
    if len(all_spam) > 5:
        print(f"     ... and {len(all_spam) - 5} more")
    
    # Quick confirmation
    print(f"\n⚠️  Delete {len(all_spam)} spam records? (y/N): ", end='')
    choice = input().strip().lower()
    
    if choice not in ['y', 'yes']:
        print("❌ Cancelled")
        return
    
    # Fast batch deletion
    print("\n🗑️  Deleting spam records...")
    deleted = 0
    
    # Process in batches of 25 (DynamoDB limit)
    for i in range(0, len(all_spam), 25):
        batch = all_spam[i:i + 25]
        
        with table.batch_writer() as batch_writer:
            for record in batch:
                batch_writer.delete_item(
                    Key={
                        'PK': record['PK'],
                        'SK': record['SK']
                    }
                )
                deleted += 1
        
        print(f"🗑️  Deleted {deleted}/{len(all_spam)}")
    
    print(f"\n✅ Cleanup complete! Deleted {deleted} spam records")

if __name__ == "__main__":
    try:
        clean_spam_fast()
    except Exception as e:
        print(f"❌ Error: {str(e)}")
