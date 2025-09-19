#!/usr/bin/env python3
"""
Test Zendesk API connection with provided credentials
"""

import requests
import base64
import json

def test_zendesk_with_credentials():
    # Provided credentials
    email = "ralph.francisco@everyset.com"
    subdomain = "everyset"
    api_token = "KNQT0hRZpYEnlfCMGDiWf0crs068Y1LdeUOiEYC8"
    
    base_url = f"https://{subdomain}.zendesk.com/api/v2/tickets.json"
    
    print("🎯 Testing Zendesk with Provided Credentials")
    print("=" * 50)
    print(f"📧 Email: {email}")
    print(f"🌐 Subdomain: {subdomain}.zendesk.com")
    print(f"🔑 API Token: {api_token[:8]}...{api_token[-8:]}")
    print(f"🔗 URL: {base_url}")
    print()
    
    # Zendesk API token format: email/token:password
    auth_string = f"{email}/token:{api_token}"
    encoded_auth = base64.b64encode(auth_string.encode()).decode()
    
    headers = {
        'Authorization': f'Basic {encoded_auth}',
        'Content-Type': 'application/json'
    }
    
    print("🧪 Testing API connection...")
    
    try:
        response = requests.get(
            base_url,
            headers=headers,
            params={'per_page': 5, 'sort_by': 'created_at', 'sort_order': 'desc'},
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            tickets = data.get('tickets', [])
            
            print(f"✅ SUCCESS! Connection established")
            print(f"📋 Found {len(tickets)} tickets (showing latest 5)")
            print(f"📄 Total tickets available: {data.get('count', 'Unknown')}")
            
            if tickets:
                print("\n📝 Latest tickets:")
                for i, ticket in enumerate(tickets[:3], 1):
                    print(f"   {i}. ID: {ticket.get('id')}")
                    print(f"      📅 Created: {ticket.get('created_at')}")
                    print(f"      📝 Subject: {ticket.get('subject', 'No subject')[:50]}...")
                    print(f"      👤 Requester: {ticket.get('requester_id')}")
                    print()
            
            # Test pagination
            next_page = data.get('next_page')
            print(f"📄 Has more pages: {'Yes' if next_page else 'No'}")
            
            # Test recent records (last 30 days)
            print("\n🔍 Testing recent records (last 30 days)...")
            from datetime import datetime, timedelta
            
            # Get date 30 days ago
            thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            
            recent_response = requests.get(
                base_url,
                headers=headers,
                params={
                    'per_page': 100,
                    'created_at': f'{thirty_days_ago}T00:00:00Z..',
                    'sort_by': 'created_at',
                    'sort_order': 'desc'
                },
                timeout=30
            )
            
            if recent_response.status_code == 200:
                recent_data = recent_response.json()
                recent_tickets = recent_data.get('tickets', [])
                print(f"📈 Recent tickets (last 30 days): {len(recent_tickets)}")
                
                if recent_tickets:
                    latest_recent = recent_tickets[0]
                    print(f"   📅 Most recent: {latest_recent.get('created_at')}")
                    print(f"   📝 Subject: {latest_recent.get('subject', 'No subject')[:40]}...")
            
            return True
            
        elif response.status_code == 401:
            print("❌ UNAUTHORIZED")
            print("   Possible issues:")
            print("   - API token is invalid or expired")
            print("   - Email address doesn't have API access")
            print("   - API access is disabled for this account")
            
        elif response.status_code == 403:
            print("❌ FORBIDDEN") 
            print("   Possible issues:")
            print("   - Account lacks necessary permissions")
            print("   - API access is restricted")
            
        elif response.status_code == 404:
            print("❌ NOT FOUND")
            print("   Possible issues:")
            print("   - Incorrect Zendesk subdomain")
            print("   - Account may be suspended")
            
        else:
            print(f"❌ ERROR {response.status_code}")
            error_text = response.text[:200] if response.text else "No error details"
            print(f"   Details: {error_text}")
        
        print(f"\n📋 Response headers:")
        for key, value in response.headers.items():
            if key.lower() in ['content-type', 'x-rate-limit', 'x-zendesk']:
                print(f"   {key}: {value}")
                
    except requests.exceptions.Timeout:
        print("⏱️ TIMEOUT - Request took too long")
    except requests.exceptions.ConnectionError:
        print("🚫 CONNECTION ERROR - Cannot reach Zendesk server")
    except Exception as e:
        print(f"❌ EXCEPTION: {str(e)}")
    
    return False

if __name__ == "__main__":
    success = test_zendesk_with_credentials()
    
    if success:
        print("\n🎉 ZENDESK CONNECTION SUCCESSFUL!")
        print("These credentials can be used to fix the ingestion.")
    else:
        print("\n❌ CONNECTION FAILED")
        print("Please verify the credentials and try again.")
