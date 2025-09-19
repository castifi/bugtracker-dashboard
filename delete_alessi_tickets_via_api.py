#!/usr/bin/env python3
"""
Delete specific Alessi Hartigan Slack tickets using the API Gateway.
This is faster than scanning DynamoDB directly.
"""

import requests
import json
import boto3

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
        'source_system': 'slack',
        'start_date': '2025-09-01',
        'end_date': '2025-09-16'
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

def find_alessi_tickets(tickets):
    """Find tickets that match the Alessi Hartigan pattern."""
    print("🎯 Looking for Alessi Hartigan tickets...")
    
    # Pattern to match (more flexible)
    target_patterns = [
        "Alessi Hartigan",
        "<@U06C0374R2S>",  # The specific user ID
        "U06C0374R2S"      # User ID without brackets
    ]
    
    matching_tickets = []
    
    for ticket in tickets:
        text = ticket.get('text', '')
        
        # Check if any of the patterns match
        if any(pattern in text for pattern in target_patterns):
            matching_tickets.append(ticket)
    
    print(f"📊 Found {len(matching_tickets)} Alessi Hartigan tickets")
    return matching_tickets

def delete_tickets(tickets, dry_run=True):
    """Delete the specified tickets."""
    deleted_count = 0
    
    print(f"\n{'🔍 DRY RUN - ' if dry_run else '🗑️ DELETING '}Processing {len(tickets)} tickets...")
    
    for i, ticket in enumerate(tickets, 1):
        pk = ticket.get('PK')
        sk = ticket.get('SK')
        text_preview = ticket.get('text', '')[:100] + '...' if len(ticket.get('text', '')) > 100 else ticket.get('text', '')
        
        print(f"\n{i}. {'[DRY RUN] ' if dry_run else ''}Deleting: {pk}")
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
    print("🚀 Starting targeted Alessi Hartigan ticket deletion...")
    print("🎯 Using API Gateway for faster retrieval")
    print("=" * 60)
    
    # Step 1: Get all Slack tickets
    tickets = get_slack_tickets()
    
    if not tickets:
        print("❌ No Slack tickets found!")
        return
    
    # Step 2: Find Alessi tickets
    alessi_tickets = find_alessi_tickets(tickets)
    
    if not alessi_tickets:
        print("✅ No Alessi Hartigan tickets found!")
        return
    
    # Step 3: Show what we found
    print(f"\n📊 SUMMARY:")
    print(f"   • Total Slack tickets: {len(tickets)}")
    print(f"   • Alessi Hartigan tickets: {len(alessi_tickets)}")
    
    # Step 4: Show samples
    print(f"\n📋 SAMPLE ALESSI TICKETS:")
    for i, ticket in enumerate(alessi_tickets[:3]):
        print(f"   {i+1}. PK: {ticket['PK']}")
        text_preview = ticket.get('text', '')[:150] + '...' if len(ticket.get('text', '')) > 150 else ticket.get('text', '')
        print(f"      Text: {text_preview}")
        print()
    
    if len(alessi_tickets) > 3:
        print(f"   ... and {len(alessi_tickets) - 3} more tickets")
    
    # Step 5: Dry run first
    print(f"\n🔍 DRY RUN - No changes will be made:")
    print("-" * 40)
    delete_tickets(alessi_tickets, dry_run=True)
    
    # Step 6: Confirm before actual deletion
    print(f"\n⚠️ This will DELETE {len(alessi_tickets)} Alessi Hartigan tickets from DynamoDB!")
    
    while True:
        response = input("\n🤔 Proceed with deletion? (yes/no): ").lower().strip()
        if response in ['yes', 'y']:
            print("\n🗑️ EXECUTING DELETION...")
            print("-" * 40)
            deleted_count = delete_tickets(alessi_tickets, dry_run=False)
            print(f"\n🎉 Deletion completed! Deleted {deleted_count} tickets.")
            break
        elif response in ['no', 'n']:
            print("❌ Deletion cancelled.")
            break
        else:
            print("Please enter 'yes' or 'no'")

if __name__ == "__main__":
    main()
