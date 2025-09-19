#!/usr/bin/env python3
"""
Improved Slack cleanup script with better filtering criteria.
This script removes Slack messages that are not valid bug reports.
"""

import boto3
import time
from botocore.exceptions import ClientError

# Configure AWS session
session = boto3.Session(profile_name='AdministratorAccess12hr-100142810612')
dynamodb = session.resource('dynamodb', region_name='us-west-2')
table = dynamodb.Table('BugTracker-evt-bugtracker')

def is_valid_bug_report(text):
    """Check if a Slack message is a valid bug report using structured format."""
    if not text:
        return False
    
    text_lower = text.lower()
    
    # Must have at least 2 of these structured indicators
    structured_indicators = [
        'author',
        'affected url',
        'user type', 
        'priority',
        'affected user info'
    ]
    
    indicators_present = sum(1 for indicator in structured_indicators if indicator in text_lower)
    return indicators_present >= 2

def is_high_quality_bug_report(text):
    """Check for high-quality bug reports with multiple criteria."""
    if not text:
        return False
    
    text_lower = text.lower()
    
    # Core requirements
    has_author = 'author' in text_lower
    has_affected_urls = 'affected url' in text_lower
    has_user_type = 'user type' in text_lower
    
    # Quality indicators
    has_bug_keywords = any(keyword in text_lower for keyword in ['bug', 'error', 'issue', 'problem', 'broken', 'fail'])
    has_priority = 'priority' in text_lower or any(keyword in text_lower for keyword in ['urgent', 'critical', 'emergency'])
    
    # Must have core requirements + at least one quality indicator
    return (has_author and has_affected_urls and has_user_type) and (has_bug_keywords or has_priority)

def cleanup_slack_data():
    """Clean up Slack messages that are not valid bug reports."""
    print("🧹 Starting improved cleanup of Slack messages...")
    print("📋 Using structured format detection (2+ indicators required)")
    
    deleted_count = 0
    kept_count = 0
    total_slack_found = 0
    
    scan_kwargs = {}

    while True:
        try:
            response = table.scan(**scan_kwargs)
            items = response.get('Items', [])

            for item in items:
                if item.get('sourceSystem') == 'slack':
                    total_slack_found += 1
                    text = item.get('text', '')
                    
                    if not is_valid_bug_report(text):
                        # Delete item
                        table.delete_item(
                            Key={
                                'PK': item['PK'],
                                'SK': item['SK']
                            }
                        )
                        deleted_count += 1
                        print(f"❌ Deleted: {text[:70]}...")
                        time.sleep(0.05)  # Rate limit to avoid throttling
                    else:
                        kept_count += 1
                        print(f"✅ Kept: {text[:70]}...")

            if 'LastEvaluatedKey' not in response:
                break
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']

        except ClientError as e:
            print(f"Error during scan or delete: {e}")
            break
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            break

    print(f"\n--- Cleanup Summary ---")
    print(f"Total Slack messages found: {total_slack_found}")
    print(f"Messages kept (valid bug reports): {kept_count}")
    print(f"Messages deleted (non-bug reports): {deleted_count}")
    print("-----------------------")
    return deleted_count, kept_count

def verify_cleanup():
    """Verify the remaining Slack messages in the table."""
    print("\n🔍 Verifying remaining Slack messages...")
    
    valid_bug_reports = 0
    invalid_messages = 0
    
    scan_kwargs = {
        'FilterExpression': 'sourceSystem = :s',
        'ExpressionAttributeValues': {':s': 'slack'}
    }
    
    while True:
        try:
            response = table.scan(**scan_kwargs)
            for item in response['Items']:
                text = item.get('text', '')
                if is_valid_bug_report(text):
                    valid_bug_reports += 1
                else:
                    invalid_messages += 1
            
            if 'LastEvaluatedKey' not in response:
                break
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        except ClientError as e:
            print(f"Error during verification: {e}")
            break

    print(f"Valid bug reports: {valid_bug_reports}")
    print(f"Invalid messages: {invalid_messages}")
    return valid_bug_reports, invalid_messages

if __name__ == "__main__":
    print("🚀 Starting improved Slack cleanup process...")
    print("This will remove Slack messages that don't meet structured bug report criteria.")
    print("✅ Proceeding automatically...")
    
    deleted, kept = cleanup_slack_data()
    print("\n--- Verification ---")
    verify_cleanup()
    print("\n✅ Improved cleanup process completed.")
