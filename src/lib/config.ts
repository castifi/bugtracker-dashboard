// Configuration for BugTracker Dashboard
export const config = {
  // API Gateway URL - Will be set by deployment script
  apiGatewayUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://1kvgw5h1qb.execute-api.us-west-2.amazonaws.com/evt-bugtracker/query-bugs',
  
  // AWS Configuration
  awsRegion: process.env.NEXT_PUBLIC_AWS_REGION || 'us-west-2',
  
  // Feature Flags
  enableRealTimeUpdates: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME_UPDATES === 'true',
  enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
  enableExportFeatures: process.env.NEXT_PUBLIC_ENABLE_EXPORT_FEATURES === 'true',
  
  // Grafana Configuration (for future integration)
  grafanaUrl: process.env.GRAFANA_URL,
  grafanaApiKey: process.env.GRAFANA_API_KEY,
  
  // Dashboard Settings
  refreshInterval: 300000, // 5 minutes
  maxRetries: 3,
  timeout: 10000, // 10 seconds
};

// API Endpoints
export const apiEndpoints = {
  queryBugs: '/query-bugs',
  linkBugs: '/link-bugs',
  createSyntheticLink: '/create-synthetic-link',
};

// Chart Colors
export const chartColors = {
  High: '#ff4d4f',
  Medium: '#faad14',
  Low: '#52c41a',
  Critical: '#cf1322',
  Unknown: '#8c8c8c',
  slack: '#4a154b',
  zendesk: '#03363d',
  shortcut: '#0052cc',
};

// Priority Levels
export const priorityLevels = ['Critical', 'High', 'Medium', 'Low', 'Unknown'];

// Source Systems
export const sourceSystems = ['slack', 'zendesk', 'shortcut'];

// Bug States
export const bugStates = [
  'open',
  'closed',
  'pending',
  'Ready for Dev',
  'In Progress',
  'Ready for QA',
  'Blocked'
];

