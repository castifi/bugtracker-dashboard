#!/usr/bin/env python3
"""
Delete Slack records that appear to be broken or incomplete.
These are likely records that don't show details when clicking the eye icon.
"""

import requests
import boto3
import json

# API Gateway URL
API_URL = "https://1kvgw5h1qb.execute-api.us-west-2.amazonaws.com/evt-bugtracker/query-bugs"

# Initialize DynamoDB for deletion
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
table = dynamodb.Table('BugTracker-evt-bugtracker')

def get_slack_tickets():
    """Get all Slack tickets from the API."""
    print("🔍 Fetching Slack tickets from API...")
    
    params = {
        'query_type': 'by_source',
        'source_system': 'slack'
    }
    
    response = requests.get(API_URL, params=params)
    
    if response.status_code == 200:
        data = response.json()
        tickets = data.get('items', [])
        print(f"✅ Retrieved {len(tickets)} Slack tickets")
        return tickets
    else:
        print(f"❌ API request failed: {response.status_code}")
        return []

def identify_broken_records(tickets):
    """Identify records that might be broken or incomplete."""
    print("🔍 Analyzing records for potential issues...")
    
    broken_records = []
    good_records = []
    
    for ticket in tickets:
        # Check for common indicators of broken records
        issues = []
        
        # Check for essential fields
        if not ticket.get('text'):
            issues.append("missing_text")
        
        if not ticket.get('subject'):
            issues.append("missing_subject")
            
        if not ticket.get('createdAt'):
            issues.append("missing_createdAt")
            
        # Check for Alessi Hartigan (known problematic records)
        text = ticket.get('text', '')
        if 'Alessi Hartigan' in text:
            issues.append("alessi_hartigan_duplicate")
            
        # Check for very short or malformed text
        if text and len(text) < 10:
            issues.append("text_too_short")
            
        # Records with issues are considered "broken"
        if issues:
            broken_records.append({
                'ticket': ticket,
                'issues': issues
            })
        else:
            good_records.append(ticket)
    
    print(f"📊 Analysis complete:")
    print(f"   • Good records: {len(good_records)}")
    print(f"   • Broken records: {len(broken_records)}")
    
    # Show breakdown of issues
    issue_counts = {}
    for record in broken_records:
        for issue in record['issues']:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1
    
    print(f"📋 Issue breakdown:")
    for issue, count in issue_counts.items():
        print(f"   • {issue}: {count}")
    
    return broken_records, good_records

def delete_broken_records(broken_records, dry_run=True):
    """Delete the broken records."""
    deleted_count = 0
    
    print(f"\n{'🔍 DRY RUN - ' if dry_run else '🗑️ DELETING '}Processing {len(broken_records)} broken records...")
    
    for i, record_info in enumerate(broken_records, 1):
        ticket = record_info['ticket']
        issues = record_info['issues']
        
        pk = ticket.get('PK')
        sk = ticket.get('SK')
        text_preview = ticket.get('text', '')[:80] + '...' if len(ticket.get('text', '')) > 80 else ticket.get('text', '')
        
        print(f"\n{i}. {'[DRY RUN] ' if dry_run else ''}Deleting: {pk}")
        print(f"   🚨 Issues: {', '.join(issues)}")
        print(f"   📝 Text: {text_preview}")
        
        if not dry_run:
            try:
                table.delete_item(
                    Key={
                        'PK': pk,
                        'SK': sk
                    }
                )
                deleted_count += 1
                print(f"   ✅ Successfully deleted {pk}")
            except Exception as e:
                print(f"   ❌ Error deleting {pk}: {e}")
        else:
            print(f"   🔍 Would delete: PK={pk}, SK={sk}")
    
    return deleted_count

def main():
    print("🚀 Starting broken Slack record cleanup...")
    print("🎯 Targeting records that likely don't show details properly")
    print("=" * 70)
    
    # Step 1: Get all Slack tickets
    tickets = get_slack_tickets()
    
    if not tickets:
        print("❌ No Slack tickets found!")
        return
    
    # Step 2: Identify broken records
    broken_records, good_records = identify_broken_records(tickets)
    
    if not broken_records:
        print("✅ No broken records found!")
        return
    
    # Step 3: Show what we found
    print(f"\n📊 SUMMARY:")
    print(f"   • Total Slack tickets: {len(tickets)}")
    print(f"   • Good records: {len(good_records)}")
    print(f"   • Broken records: {len(broken_records)}")
    
    # Step 4: Show samples
    print(f"\n📋 SAMPLE BROKEN RECORDS:")
    for i, record_info in enumerate(broken_records[:5]):
        ticket = record_info['ticket']
        issues = record_info['issues']
        print(f"   {i+1}. PK: {ticket['PK']}")
        print(f"      Issues: {', '.join(issues)}")
        text_preview = ticket.get('text', '')[:100] + '...' if len(ticket.get('text', '')) > 100 else ticket.get('text', '')
        print(f"      Text: {text_preview}")
        print()
    
    if len(broken_records) > 5:
        print(f"   ... and {len(broken_records) - 5} more broken records")
    
    # Step 5: Dry run first
    print(f"\n🔍 DRY RUN - No changes will be made:")
    print("-" * 50)
    delete_broken_records(broken_records[:10], dry_run=True)  # Show first 10
    
    # Step 6: Confirm before actual deletion
    print(f"\n⚠️ This will DELETE {len(broken_records)} broken Slack records from DynamoDB!")
    print("🎯 These are likely the records that don't show details when clicked")
    
    while True:
        response = input("\n🤔 Proceed with deletion? (yes/no): ").lower().strip()
        if response in ['yes', 'y']:
            print("\n🗑️ EXECUTING DELETION...")
            print("-" * 50)
            deleted_count = delete_broken_records(broken_records, dry_run=False)
            print(f"\n🎉 Deletion completed! Deleted {deleted_count} broken records.")
            break
        elif response in ['no', 'n']:
            print("❌ Deletion cancelled.")
            break
        else:
            print("Please enter 'yes' or 'no'")

if __name__ == "__main__":
    main()
