#!/usr/bin/env python3
"""
Shortcut API Test Script - Enhanced
This script helps you test and configure the Shortcut API connection
"""

import requests
import os
from dotenv import load_dotenv

def test_shortcut_api():
    """Test Shortcut API connection"""
    print("🔍 Testing Shortcut API Connection")
    print("=" * 40)
    
    # Load environment variables
    load_dotenv()
    
    # Get API token
    api_token = os.getenv('SHORTCUT_API_TOKEN')
    
    if not api_token or api_token == 'your-shortcut-api-token':
        print("❌ No valid Shortcut API token found!")
        print("\n📋 To get your Shortcut API token:")
        print("1. Go to https://app.shortcut.com/settings/account/api-tokens")
        print("2. Click 'Create Token'")
        print("3. Give it a name like 'BugTracker Integration'")
        print("4. Copy the token and add it to your .env file:")
        print("   SHORTCUT_API_TOKEN=your-actual-token-here")
        print("\n🔄 After adding the token, run this script again.")
        return False
    
    print(f"✅ Found API token: {api_token[:10]}...")
    
    # Test different story endpoints
    story_endpoints = [
        "https://api.app.shortcut.com/api/v3/stories",
        "https://api.app.shortcut.com/api/v3/story",
        "https://api.app.shortcut.com/api/v3/stories/",
        "https://api.app.shortcut.com/api/v3/story/",
        "https://api.app.shortcut.com/api/v3/search/stories",
        "https://api.app.shortcut.com/api/v3/search"
    ]
    
    headers = {
        'Shortcut-Token': api_token,
        'Content-Type': 'application/json'
    }
    
    print("\n🔍 Testing Story Endpoints:")
    for endpoint in story_endpoints:
        print(f"\n🔗 Testing: {endpoint}")
        try:
            response = requests.get(endpoint, headers=headers)
            print(f"📊 Status: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Endpoint working!")
                data = response.json()
                if isinstance(data, list):
                    print(f"📈 Found {len(data)} items")
                    if len(data) > 0:
                        print(f"📝 Sample item keys: {list(data[0].keys())}")
                elif isinstance(data, dict):
                    print(f"📈 Response keys: {list(data.keys())}")
            elif response.status_code == 401:
                print("❌ Unauthorized - Check your API token")
            elif response.status_code == 404:
                print("❌ Endpoint not found")
            else:
                print(f"⚠️ Unexpected status: {response.status_code}")
                if response.status_code == 400:
                    print(f"📄 Response: {response.text[:200]}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    # Test with different parameters
    print("\n🔍 Testing with Parameters:")
    base_url = "https://api.app.shortcut.com/api/v3/stories"
    test_params = [
        {},
        {'limit': 10},
        {'archived': 'false'},
        {'limit': 10, 'archived': 'false'},
        {'updated_at_start': '2024-08-01T00:00:00Z'},
        {'updated_at_start': '2024-08-01T00:00:00Z', 'limit': 10}
    ]
    
    for i, params in enumerate(test_params):
        print(f"\n🔗 Test {i+1}: {base_url} with params: {params}")
        try:
            response = requests.get(base_url, headers=headers, params=params)
            print(f"📊 Status: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Working!")
                data = response.json()
                if isinstance(data, list):
                    print(f"📈 Found {len(data)} items")
            elif response.status_code == 400:
                print(f"❌ Bad Request: {response.text[:200]}")
            else:
                print(f"⚠️ Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    return True

if __name__ == "__main__":
    test_shortcut_api()
