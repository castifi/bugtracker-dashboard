import json
import boto3
import os
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

# Global variables for caching
SHORTCUT_WORKFLOW_STATES = {}
SHORTCUT_USERS = {}

def lambda_handler(event, context):
    try:
        print("🚀 Starting automated ingestion...")
        
        # Initialize DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        
        # Run ingestion
        result = run_ingestion(table)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Ingestion completed successfully',
                'result': result
            })
        }
    except Exception as e:
        print(f"❌ Lambda handler error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }

def get_shortcut_workflow_states():
    """Fetch and cache Shortcut workflow states"""
    global SHORTCUT_WORKFLOW_STATES
    if SHORTCUT_WORKFLOW_STATES:
        return SHORTCUT_WORKFLOW_STATES
    
    try:
        url = "https://api.app.shortcut.com/api/v3/workflows"
        headers = {
            'Shortcut-Token': os.environ.get('SHORTCUT_API_TOKEN'),
            'Content-Type': 'application/json'
        }
        
        # Create request with headers
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            workflows = json.loads(response.read().decode())
        
        print(f"🔍 Fetched {len(workflows)} workflows from Shortcut")
        
        for workflow in workflows:
            workflow_name = workflow.get('name', 'Unknown')
            states = workflow.get('states', [])
            print(f"📋 Workflow '{workflow_name}' has {len(states)} states")
            
            for state in states:
                state_id = str(state.get('id'))
                state_name = state.get('name', 'Unknown')
                SHORTCUT_WORKFLOW_STATES[state_id] = state_name
                print(f"  - State ID {state_id} -> '{state_name}'")
        
        print(f"✅ Fetched {len(SHORTCUT_WORKFLOW_STATES)} Shortcut workflow states total")
        return SHORTCUT_WORKFLOW_STATES
        
    except Exception as e:
        print(f"❌ Error fetching Shortcut workflow states: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return {}

def get_shortcut_users():
    """Fetch and cache Shortcut users"""
    global SHORTCUT_USERS
    if SHORTCUT_USERS:
        return SHORTCUT_USERS
    
    try:
        url = "https://api.app.shortcut.com/api/v3/members"
        headers = {
            'Shortcut-Token': os.environ.get('SHORTCUT_API_TOKEN'),
            'Content-Type': 'application/json'
        }
        
        # Create request with headers
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            members = json.loads(response.read().decode())
        
        for member in members:
            member_id = str(member.get('id'))
            member_name = member.get('profile', {}).get('name', 'Unknown')
            SHORTCUT_USERS[member_id] = member_name
        
        print(f"✅ Fetched {len(SHORTCUT_USERS)} Shortcut users")
        return SHORTCUT_USERS
        
    except Exception as e:
        print(f"❌ Error fetching Shortcut users: {e}")
        return {}

def get_shortcut_status_name(state_id_or_object):
    """Get Shortcut status name from state ID or object"""
    if not state_id_or_object:
        return 'Unknown'
    
    # If it's already a string (state name), return it
    if isinstance(state_id_or_object, str):
        return state_id_or_object
    
    # If it's an object with a name, return the name
    if isinstance(state_id_or_object, dict) and state_id_or_object.get('name'):
        return state_id_or_object['name']
    
    # If it's an object with an ID, or just an ID
    state_id = None
    if isinstance(state_id_or_object, dict) and state_id_or_object.get('id'):
        state_id = str(state_id_or_object['id'])
    elif isinstance(state_id_or_object, (int, str)):
        state_id = str(state_id_or_object)
    
    if state_id:
        # Get workflow states if not already cached
        if not SHORTCUT_WORKFLOW_STATES:
            get_shortcut_workflow_states()
        
        status_name = SHORTCUT_WORKFLOW_STATES.get(state_id, f'Unknown ({state_id})')
        print(f"🔍 Mapping state ID {state_id} -> '{status_name}' (available states: {list(SHORTCUT_WORKFLOW_STATES.keys())})")
        return status_name
    
    return 'Unknown'

def get_shortcut_user_names(user_ids):
    """Get Shortcut user names from user IDs"""
    if not user_ids:
        return []
    
    # Get users if not already cached
    if not SHORTCUT_USERS:
        get_shortcut_users()
    
    user_names = []
    for user_id in user_ids:
        if isinstance(user_id, str):
            user_name = SHORTCUT_USERS.get(user_id, f'Unknown ({user_id})')
            user_names.append(user_name)
        elif isinstance(user_id, dict) and user_id.get('name'):
            user_names.append(user_id['name'])
        else:
            user_names.append(f'Unknown ({user_id})')
    
    return user_names

def ingest_shortcut_stories_lambda(api_token):
    """Ingest stories from Shortcut"""
    print("🔍 Fetching Shortcut stories...")
    
    if not api_token:
        print("❌ Missing Shortcut API token")
        return []
    
    # Shortcut API endpoint - using the Search API with pagination
    url = "https://api.app.shortcut.com/api/v3/search"
    
    headers = {
        'Shortcut-Token': api_token,
        'Content-Type': 'application/json'
    }
    
    # Use Search API with pagination using 'next' token
    all_stories = []
    next_token = None
    
    while True:
        params = {
            'query': 'bug',
            'detail': 'full'
        }
        
        if next_token:
            params['next'] = next_token
        
        try:
            # Build URL with parameters
            url = "https://api.app.shortcut.com/api/v3/search"
            params = {
                'query': 'bug',
                'detail': 'full'
            }
            
            if next_token:
                params['next'] = next_token
            
            # Add parameters to URL
            url_with_params = url + '?' + urllib.parse.urlencode(params)
            
            headers = {
                'Shortcut-Token': api_token,
                'Content-Type': 'application/json'
            }
            
            # Create request with headers
            req = urllib.request.Request(url_with_params, headers=headers)
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
            stories = data.get('stories', {}).get('data', [])
            
            if not stories:
                break  # No more stories to fetch
                
            all_stories.extend(stories)
            print(f"📄 Fetched {len(stories)} stories")
            
            # Check for next page
            next_token = data.get('stories', {}).get('next')
            if not next_token:
                break  # Last page
                
            # Extract the next token from the URL
            if next_token and 'next=' in next_token:
                next_token = next_token.split('next=')[1]
            else:
                next_token = None
            
        except Exception as e:
            print(f"❌ Error fetching Shortcut stories: {e}")
            break
    
    print(f"✅ Found {len(all_stories)} Shortcut stories total")
    
    # Remove duplicates based on story ID
    unique_stories = {}
    for story in all_stories:
        story_id = story.get('id')
        if story_id and story_id not in unique_stories:
            unique_stories[story_id] = story
    
    all_stories = list(unique_stories.values())
    print(f"✅ After deduplication: {len(all_stories)} unique stories")
    
    shortcut_bugs = []
    
    for story in all_stories:
        # Only include actual bug stories
        story_type = story.get('story_type', 'feature')
        if story_type == 'bug':
            priority = 'High'
            
            # Get owner names from owner IDs
            owner_ids = story.get('owner_ids', [])
            owner_names = get_shortcut_user_names(owner_ids)
            
            bug = {
                'PK': f"SC-{story['id']}",
                'SK': f"shortcut#{story['id']}",
                'sourceSystem': 'shortcut',
                'priority': priority,
                'state': get_shortcut_status_name(story.get('workflow_state_id')),
                'state_id': story.get('workflow_state_id'),
                'name': story.get('name', 'No name'),
                'description': story.get('description', ''),
                'createdAt': story.get('created_at', datetime.now().isoformat()),
                'updatedAt': story.get('updated_at', datetime.now().isoformat()),
                'assignee': ', '.join(owner_names) if owner_names else 'Unassigned',  # Convert array to string
                'assignee_ids': owner_ids,  # Keep the original IDs for reference
                'tags': [label.get('name') for label in story.get('labels', [])]
            }
            shortcut_bugs.append(bug)
    
    print(f"✅ Processed {len(shortcut_bugs)} Shortcut bug stories")
    return shortcut_bugs

def ingest_slack_messages_lambda(api_token):
    """Ingest messages from Slack"""
    print("🔍 Fetching Slack messages...")
    
    if not api_token:
        print("❌ Missing Slack API token")
        return []
    
    try:
        # Get list of channels
        channels_url = "https://slack.com/api/conversations.list"
        headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        }
        
        # Create request with headers
        req = urllib.request.Request(channels_url, headers=headers)
        with urllib.request.urlopen(req) as response:
            channels_data = json.loads(response.read().decode())
        
        channels = channels_data.get('channels', [])
        print(f"✅ Found {len(channels)} Slack channels")
        
        slack_bugs = []
        
        # Look for bug-related channels or messages
        bug_keywords = ['bug', 'error', 'issue', 'problem', 'crash', 'broken']
        
        for channel in channels:
            channel_id = channel.get('id')
            channel_name = channel.get('name', '').lower()
            
            # Skip if channel name doesn't suggest bugs
            if not any(keyword in channel_name for keyword in bug_keywords):
                continue
            
            # Get messages from this channel
            messages_url = f"https://slack.com/api/conversations.history?channel={channel_id}&limit=100"
            req = urllib.request.Request(messages_url, headers=headers)
            
            try:
                with urllib.request.urlopen(req) as response:
                    messages_data = json.loads(response.read().decode())
                
                messages = messages_data.get('messages', [])
                
                for message in messages:
                    text = message.get('text', '').lower()
                    
                    # Check if message contains bug-related keywords
                    if any(keyword in text for keyword in bug_keywords):
                        # Get user info
                        user_id = message.get('user', 'Unknown')
                        user_name = 'Unknown'
                        
                        try:
                            user_url = f"https://slack.com/api/users.info?user={user_id}"
                            req = urllib.request.Request(user_url, headers=headers)
                            with urllib.request.urlopen(req) as response:
                                user_data = json.loads(response.read().decode())
                            user_name = user_data.get('user', {}).get('real_name', 'Unknown')
                        except:
                            pass
                        
                        bug = {
                            'PK': f"SL--{message.get('ts', '').replace('.', '')}",
                            'SK': f"slack#{channel_id}#{message.get('ts', '')}",
                            'sourceSystem': 'slack',
                            'priority': 'Unknown',
                            'state': 'Unknown',
                            'text': message.get('text', ''),
                            'createdAt': datetime.fromtimestamp(float(message.get('ts', 0))).isoformat(),
                            'updatedAt': datetime.fromtimestamp(float(message.get('ts', 0))).isoformat(),
                            'author': user_name,
                            'author_id': user_id,
                            'tags': [channel_name]
                        }
                        slack_bugs.append(bug)
                        
            except Exception as e:
                print(f"⚠️ Error fetching messages from channel {channel_name}: {e}")
                continue
        
        print(f"✅ Processed {len(slack_bugs)} Slack bug messages")
        return slack_bugs
        
    except Exception as e:
        print(f"❌ Error fetching Slack messages: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return []

def ingest_zendesk_tickets_lambda(domain, email, api_token):
    """Ingest tickets from Zendesk"""
    print("🔍 Fetching Zendesk tickets...")
    
    if not all([domain, email, api_token]):
        print("❌ Missing Zendesk credentials")
        return []
    
    try:
        # Zendesk API endpoint for tickets
        url = f"https://{domain}.zendesk.com/api/v2/search.json"
        
        # Search for tickets with specific criteria (bugs, open tickets, etc.)
        params = {
            'query': 'type:ticket status:open,hold,pending',
            'sort_by': 'created_at',
            'sort_order': 'desc'
        }
        
        # Add parameters to URL
        url_with_params = url + '?' + urllib.parse.urlencode(params)
        
        # Create basic auth header
        import base64
        credentials = f"{email}/token:{api_token}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        headers = {
            'Authorization': f'Basic {encoded_credentials}',
            'Content-Type': 'application/json'
        }
        
        # Create request with headers
        req = urllib.request.Request(url_with_params, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
        
        tickets = data.get('results', [])
        print(f"✅ Found {len(tickets)} Zendesk tickets")
        
        zendesk_bugs = []
        
        for ticket in tickets:
            # Only include tickets that are likely bugs (based on tags, subject, etc.)
            subject = ticket.get('subject', '').lower()
            description = ticket.get('description', '').lower()
            tags = [tag.lower() for tag in ticket.get('tags', [])]
            
            # Check if this looks like a bug
            is_bug = (
                'bug' in subject or 'bug' in description or 'bug' in tags or
                'error' in subject or 'error' in description or 'error' in tags or
                'issue' in subject or 'issue' in description or 'issue' in tags or
                'problem' in subject or 'problem' in description or 'problem' in tags
            )
            
            if is_bug:
                # Determine priority
                priority_map = {
                    'urgent': 'Critical',
                    'high': 'High',
                    'normal': 'Medium',
                    'low': 'Low'
                }
                priority = priority_map.get(ticket.get('priority', 'normal'), 'Medium')
                
                bug = {
                    'PK': f"ZD-{ticket['id']}",
                    'SK': f"zendesk#{ticket['id']}",
                    'sourceSystem': 'zendesk',
                    'priority': priority,
                    'status': ticket.get('status', 'Unknown'),
                    'subject': ticket.get('subject', 'No subject'),
                    'text': ticket.get('description', ''),
                    'createdAt': ticket.get('created_at', datetime.now().isoformat()),
                    'updatedAt': ticket.get('updated_at', datetime.now().isoformat()),
                    'requester': ticket.get('requester_id', 'Unknown'),
                    'assignee': ticket.get('assignee_id', 'Unassigned'),
                    'tags': ticket.get('tags', [])
                }
                zendesk_bugs.append(bug)
        
        print(f"✅ Processed {len(zendesk_bugs)} Zendesk bug tickets")
        return zendesk_bugs
        
    except Exception as e:
        print(f"❌ Error fetching Zendesk tickets: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return []

def run_ingestion(table):
    """Run the full ingestion process"""
    try:
        print("🚀 Starting automated ingestion...")
        
        # Initialize API tokens from environment
        SHORTCUT_API_TOKEN = os.environ.get('SHORTCUT_API_TOKEN')
        SLACK_BOT_TOKEN = os.environ.get('SLACK_BOT_TOKEN')
        ZENDESK_DOMAIN = os.environ.get('ZENDESK_DOMAIN')
        ZENDESK_EMAIL = os.environ.get('ZENDESK_EMAIL')
        ZENDESK_API_TOKEN = os.environ.get('ZENDESK_API_TOKEN')
        
        print(f"✅ Environment variables loaded: Shortcut={bool(SHORTCUT_API_TOKEN)}, Slack={bool(SLACK_BOT_TOKEN)}, Zendesk={bool(ZENDESK_API_TOKEN)}")
        
        # Run ingestion for each source
        results = {
            'shortcut': 0,
            'slack': 0,
            'zendesk': 0,
            'errors': []
        }
        
        # Shortcut ingestion
        if SHORTCUT_API_TOKEN:
            try:
                shortcut_bugs = ingest_shortcut_stories_lambda(SHORTCUT_API_TOKEN)
                for bug in shortcut_bugs:
                    table.put_item(Item=bug)
                results['shortcut'] = len(shortcut_bugs)
                print(f"✅ Ingested {len(shortcut_bugs)} Shortcut bugs")
            except Exception as e:
                error_msg = f"Shortcut ingestion error: {str(e)}"
                print(f"❌ {error_msg}")
                results['errors'].append(error_msg)
        
        # Slack ingestion
        if SLACK_BOT_TOKEN:
            try:
                slack_bugs = ingest_slack_messages_lambda(SLACK_BOT_TOKEN)
                for bug in slack_bugs:
                    table.put_item(Item=bug)
                results['slack'] = len(slack_bugs)
                print(f"✅ Ingested {len(slack_bugs)} Slack bugs")
            except Exception as e:
                error_msg = f"Slack ingestion error: {str(e)}"
                print(f"❌ {error_msg}")
                results['errors'].append(error_msg)
        
        # Zendesk ingestion
        if ZENDESK_API_TOKEN:
            try:
                zendesk_bugs = ingest_zendesk_tickets_lambda(ZENDESK_DOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN)
                for bug in zendesk_bugs:
                    table.put_item(Item=bug)
                results['zendesk'] = len(zendesk_bugs)
                print(f"✅ Ingested {len(zendesk_bugs)} Zendesk bugs")
            except Exception as e:
                error_msg = f"Zendesk ingestion error: {str(e)}"
                print(f"❌ {error_msg}")
                results['errors'].append(error_msg)
        
        print(f"🎉 Ingestion completed: {results}")
        return results
        
    except Exception as e:
        error_msg = f"General ingestion error: {str(e)}"
        print(f"❌ {error_msg}")
        return {'errors': [error_msg]}
