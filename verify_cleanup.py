#!/usr/bin/env python3
"""
Verification script to check cleanup results
Run this after cleanup to verify record counts
"""

import boto3

def main():
    # Initialize DynamoDB with the correct AWS profile
    session = boto3.Session(profile_name='AdministratorAccess12hr-100142810612')
    dynamodb = session.resource('dynamodb', region_name='us-west-2')
    table = dynamodb.Table('BugTracker-evt-bugtracker')
    
    print("📊 Verifying cleanup results...")
    
    # Count total Slack records
    response = table.scan(
        FilterExpression="sourceSystem = :source",
        ExpressionAttributeValues={':source': 'slack'},
        Select='COUNT'
    )
    total_slack = response['Count']
    
    # Count Alessi Hartigan records (should be 0)
    response = table.scan(
        FilterExpression="sourceSystem = :source AND contains(#txt, :alessi)",
        ExpressionAttributeValues={
            ':source': 'slack',
            ':alessi': 'Alessi Hartigan'
        },
        ExpressionAttributeNames={'#txt': 'text'},
        Select='COUNT'
    )
    alessi_count = response['Count']
    
    # Count production URL records (should be 0)
    response = table.scan(
        FilterExpression="sourceSystem = :source AND contains(#txt, :url)",
        ExpressionAttributeValues={
            ':source': 'slack',
            ':url': 'production.everyset.com'
        },
        ExpressionAttributeNames={'#txt': 'text'},
        Select='COUNT'
    )
    url_count = response['Count']
    
    # Count total records in table
    response = table.scan(Select='COUNT')
    total_records = response['Count']
    
    print(f"📈 CLEANUP VERIFICATION RESULTS:")
    print(f"   Total records in table: {total_records}")
    print(f"   Total Slack records: {total_slack}")
    print(f"   Alessi Hartigan remaining: {alessi_count} (should be 0)")
    print(f"   Production URL remaining: {url_count} (should be 0)")
    
    if alessi_count == 0 and url_count == 0:
        print("✅ Cleanup successful! All duplicate patterns removed.")
    else:
        print("⚠️  Some duplicates remain. Consider running cleanup scripts again.")

if __name__ == "__main__":
    main()
