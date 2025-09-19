#!/usr/bin/env python3
"""
Test Zendesk API connection with provided token
"""

import requests
import json
from datetime import datetime

def test_zendesk_connection():
    # Zendesk configuration
    token = "KNQT0hRZpYEnlfCMGDiWf0crs068Y1LdeUOiEYC8"
    
    # Try different possible Zendesk subdomains/URLs
    possible_urls = [
        "https://everyset.zendesk.com/api/v2/tickets.json",
        "https://everyset-support.zendesk.com/api/v2/tickets.json", 
        "https://support.everyset.com/api/v2/tickets.json"
    ]
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("🔍 Testing Zendesk API connection...")
    print(f"🔑 Token: {token[:8]}...{token[-8:]}")
    print()
    
    for url in possible_urls:
        print(f"📞 Testing: {url}")
        try:
            response = requests.get(
                url,
                headers=headers,
                params={'per_page': 5},  # Limit to 5 tickets for testing
                timeout=30
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                tickets = data.get('tickets', [])
                print(f"   ✅ SUCCESS! Found {len(tickets)} tickets")
                
                if tickets:
                    latest_ticket = tickets[0]
                    print(f"   📋 Latest ticket ID: {latest_ticket.get('id')}")
                    print(f"   📅 Created: {latest_ticket.get('created_at')}")
                    print(f"   📝 Subject: {latest_ticket.get('subject', 'No subject')[:50]}...")
                
                # Test pagination/next page
                next_page = data.get('next_page')
                print(f"   📄 Has more pages: {'Yes' if next_page else 'No'}")
                
                return True, url
                
            elif response.status_code == 401:
                print(f"   ❌ UNAUTHORIZED - Token may be invalid")
            elif response.status_code == 403:
                print(f"   ❌ FORBIDDEN - Token may lack permissions")
            elif response.status_code == 404:
                print(f"   ❌ NOT FOUND - URL may be incorrect")
            else:
                print(f"   ❌ ERROR: {response.text[:100]}...")
                
        except requests.exceptions.Timeout:
            print(f"   ⏱️  TIMEOUT - Request took too long")
        except requests.exceptions.ConnectionError:
            print(f"   🚫 CONNECTION ERROR - Cannot reach server")
        except Exception as e:
            print(f"   ❌ EXCEPTION: {str(e)}")
        
        print()
    
    return False, None

def test_zendesk_auth_methods():
    """Test different authentication methods"""
    token = "KNQT0hRZpYEnlfCMGDiWf0crs068Y1LdeUOiEYC8"
    base_url = "https://everyset.zendesk.com/api/v2/tickets.json"
    
    print("🔐 Testing different authentication methods...")
    
    # Method 1: Bearer token
    headers1 = {'Authorization': f'Bearer {token}'}
    
    # Method 2: Basic auth with token
    headers2 = {'Authorization': f'Basic {token}'}
    
    # Method 3: API token (if it's an API token, not OAuth)
    # This would require email/token combination
    
    auth_methods = [
        ("Bearer Token", headers1),
        ("Basic Auth", headers2)
    ]
    
    for method_name, headers in auth_methods:
        print(f"🧪 Testing {method_name}...")
        try:
            response = requests.get(
                base_url,
                headers=headers,
                params={'per_page': 1},
                timeout=15
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print(f"   ✅ {method_name} WORKS!")
                return True
            else:
                print(f"   ❌ Failed: {response.text[:50]}...")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        print()
    
    return False

if __name__ == "__main__":
    print("🎯 Zendesk API Connection Test")
    print("=" * 50)
    
    # Test main connection
    success, working_url = test_zendesk_connection()
    
    if not success:
        print("\n🔄 Trying alternative authentication methods...")
        auth_success = test_zendesk_auth_methods()
        
        if not auth_success:
            print("\n❌ ALL TESTS FAILED")
            print("Possible issues:")
            print("- Token is invalid or expired")
            print("- Wrong Zendesk subdomain") 
            print("- Token lacks proper permissions")
            print("- Account may be suspended")
    else:
        print(f"\n✅ CONNECTION SUCCESSFUL!")
        print(f"Working URL: {working_url}")
        print("Zendesk integration should work with this configuration.")
