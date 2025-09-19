#!/usr/bin/env python3
"""
Test Zendesk API connection using API token authentication (email/token format)
"""

import requests
import base64
import json

def test_zendesk_api_token():
    # This looks like a Zendesk API token, not OAuth token
    api_token = "KNQT0hRZpYEnlfCMGDiWf0crs068Y1LdeUOiEYC8"
    
    # Common Zendesk admin emails to try
    possible_emails = [
        "admin@everyset.com",
        "support@everyset.com", 
        "help@everyset.com",
        "no-reply@everyset.com",
        "contact@everyset.com"
    ]
    
    # Zendesk subdomains to try
    subdomains = [
        "everyset",
        "everyset-support",
        "support-everyset",
        "help-everyset"
    ]
    
    print("🔍 Testing Zendesk API Token Authentication...")
    print(f"🔑 API Token: {api_token[:8]}...{api_token[-8:]}")
    print()
    
    for subdomain in subdomains:
        base_url = f"https://{subdomain}.zendesk.com/api/v2/tickets.json"
        print(f"🌐 Testing subdomain: {subdomain}.zendesk.com")
        
        for email in possible_emails:
            print(f"   📧 Trying email: {email}")
            
            # Zendesk API token format: email/token:password
            auth_string = f"{email}/token:{api_token}"
            encoded_auth = base64.b64encode(auth_string.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_auth}',
                'Content-Type': 'application/json'
            }
            
            try:
                response = requests.get(
                    base_url,
                    headers=headers,
                    params={'per_page': 3},
                    timeout=15
                )
                
                print(f"      Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    tickets = data.get('tickets', [])
                    print(f"      ✅ SUCCESS! Found {len(tickets)} tickets")
                    
                    if tickets:
                        latest = tickets[0]
                        print(f"      📋 Latest ticket: {latest.get('id')}")
                        print(f"      📅 Created: {latest.get('created_at')}")
                        print(f"      📝 Subject: {latest.get('subject', 'No subject')[:40]}...")
                    
                    print(f"\n🎉 WORKING CONFIGURATION:")
                    print(f"   Subdomain: {subdomain}.zendesk.com")
                    print(f"   Email: {email}")
                    print(f"   API Token: {api_token}")
                    return True, subdomain, email
                    
                elif response.status_code == 401:
                    print(f"      ❌ Unauthorized")
                elif response.status_code == 403:
                    print(f"      ❌ Forbidden")
                elif response.status_code == 404:
                    print(f"      ❌ Not Found")
                else:
                    error_text = response.text[:50] if response.text else "Unknown error"
                    print(f"      ❌ Error {response.status_code}: {error_text}...")
                    
            except requests.exceptions.Timeout:
                print(f"      ⏱️  Timeout")
            except Exception as e:
                print(f"      ❌ Exception: {str(e)[:30]}...")
        
        print()
    
    return False, None, None

if __name__ == "__main__":
    print("🎯 Zendesk API Token Test")
    print("=" * 50)
    
    success, subdomain, email = test_zendesk_api_token()
    
    if not success:
        print("❌ ALL TESTS FAILED")
        print("\nPossible solutions:")
        print("1. Verify the API token is correct and active")
        print("2. Check the Zendesk subdomain (might not be 'everyset')")
        print("3. Confirm the admin email address")
        print("4. Ensure API access is enabled in Zendesk settings")
        print("5. Check if IP restrictions are blocking access")
    else:
        print("\n✅ ZENDESK CONNECTION SUCCESSFUL!")
        print("This configuration can be used to fix the ingestion.")
