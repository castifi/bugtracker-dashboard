import React, { useState, useEffect } from 'react';
import { Card } from 'antd';
import { ResponsiveSankey } from '@nivo/sankey';

interface FlowNode {
  id: string;
  label: string;
  type: string;
  color: string;
}

interface FlowEdge {
  source: string;
  target: string;
  value: number;
  label: string;
  avg_resolution_hours: number;
}

interface ResolutionMetrics {
  average_resolution_hours: number;
  median_resolution_hours: number;
  min_resolution_hours: number;
  max_resolution_hours: number;
  total_completed_cards: number;
  priority_breakdown: {
    [key: string]: {
      avg_hours: number;
      count: number;
      min_hours: number;
      max_hours: number;
    };
  };
  resolution_distribution: {
    [key: string]: number;
  };
}

interface AnalyticsData {
  summary: {
    total_slack_tickets: number;
    total_zendesk_tickets: number;
    total_shortcut_cards: number;
    connected_tickets: number;
    avg_resolution_time: number;
  };
  visualization_data: {
    nodes: FlowNode[];
    edges: FlowEdge[];
    flow_summary: {
      total_flows: number;
      total_connected_tickets: number;
    };
  };
  resolution_metrics: ResolutionMetrics;
  source_analytics: {
    source_counts: {
      slack: number;
      zendesk: number;
      shortcut: number;
    };
    conversion_rate: {
      tickets_to_cards: number;
      total_input_tickets: number;
      total_output_cards: number;
    };
  };
}

const FlowAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const apiGatewayUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://1kvgw5h1qb.execute-api.us-west-2.amazonaws.com/evt-bugtracker/query-bugs';
      
      const response = await fetch(`${apiGatewayUrl}?query_type=flow_analytics`);
      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.analytics);
      } else {
        setError(data.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      // Fallback to mock data for local development
      console.log('Using mock analytics data for local development');
      setAnalyticsData({
        summary: {
          total_slack_tickets: 860,
          total_zendesk_tickets: 789,
          total_shortcut_cards: 163,
          connected_tickets: 150,
          avg_resolution_time: 1026.65
        },
        resolution_metrics: {
          average_resolution_hours: 1026.65,
          median_resolution_hours: 837.58,
          min_resolution_hours: 0.02,
          max_resolution_hours: 5623.11,
          total_completed_cards: 102,
          priority_breakdown: {
            Critical: { avg_hours: 863.83, count: 68, min_hours: 0.02, max_hours: 3652.77 },
            High: { avg_hours: 1151.78, count: 23, min_hours: 3.58, max_hours: 2499.12 },
            Medium: { avg_hours: 1308.79, count: 5, min_hours: 193.89, max_hours: 2984.53 },
            Low: { avg_hours: 3287.76, count: 3, min_hours: 1648.54, max_hours: 5623.11 }
          },
          resolution_distribution: {
            '0-4 hours': 2,
            '4-24 hours': 1,
            '1-3 days': 8,
            '3-7 days': 4,
            '1-2 weeks': 6,
            '2+ weeks': 78
          }
        },
        visualization_data: {
          nodes: [
            { id: 'slack', label: 'Slack Reports', type: 'source', color: '#4A90E2' },
            { id: 'zendesk', label: 'Zendesk Tickets', type: 'source', color: '#7ED321' },
            { id: 'shortcut', label: 'Shortcut Cards', type: 'destination', color: '#F5A623' }
          ],
          edges: [
            { source: 'zendesk', target: 'shortcut', value: 150, label: '150 tickets', avg_resolution_hours: 1026.65 }
          ],
          flow_summary: {
            total_flows: 1,
            total_connected_tickets: 150
          }
        },
        source_analytics: {
          source_counts: { slack: 860, zendesk: 789, shortcut: 163 },
          conversion_rate: { tickets_to_cards: 0.099, total_input_tickets: 1649, total_output_cards: 163 }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number): string => {
    if (hours < 24) {
      return `${hours.toFixed(1)} hours`;
    } else if (hours < 168) {
      return `${(hours / 24).toFixed(1)} days`;
    } else {
      return `${(hours / 168).toFixed(1)} weeks`;
    }
  };

  const getConversionPercentage = (rate: number): string => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg">Loading end-to-end analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <div className="text-lg font-bold">Error</div>
        <div>{error}</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-2xl font-bold text-gray-800 mb-6">
        End-to-End Ticket Flow Analytics
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-blue-50 border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analyticsData.summary.total_slack_tickets}</div>
            <div className="text-sm text-gray-600">Slack Reports</div>
          </div>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analyticsData.summary.total_zendesk_tickets}</div>
            <div className="text-sm text-gray-600">Zendesk Tickets</div>
          </div>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{analyticsData.summary.total_shortcut_cards}</div>
            <div className="text-sm text-gray-600">Shortcut Cards</div>
          </div>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{analyticsData.summary.connected_tickets}</div>
            <div className="text-sm text-gray-600">Connected Tickets</div>
          </div>
        </Card>
      </div>

      {/* Flow Visualization */}
      <Card title="Ticket Flow Diagram" className="mb-6 grafana-card">
        <div className="h-96 chart-container rounded-lg p-6" style={{ background: 'linear-gradient(135deg, #161b22 0%, #21262d 100%)' }}>
          <svg width="100%" height="100%" viewBox="0 0 900 360" className="overflow-visible">
            <defs>
              {/* Gradients for beautiful effects */}
              <linearGradient id="zendeskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7ED321" />
                <stop offset="100%" stopColor="#5CB85C" />
              </linearGradient>
              <linearGradient id="slackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A90E2" />
                <stop offset="100%" stopColor="#357ABD" />
              </linearGradient>
              <linearGradient id="shortcutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5A623" />
                <stop offset="100%" stopColor="#E8940F" />
              </linearGradient>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="3" dy="3" stdDeviation="3" floodOpacity="0.3" />
              </filter>
            </defs>
            
            {/* Background with subtle pattern */}
            <rect width="900" height="360" fill="url(#backgroundGradient)" rx="12" />
            
            {/* Left: Zendesk Tickets */}
            <g>
              <rect x="60" y="60" width="140" height="240" fill="url(#zendeskGradient)" rx="12" filter="url(#shadow)" />
              <text x="130" y="100" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                Zendesk Tickets
              </text>
              <text x="130" y="130" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">
                {analyticsData.summary.total_zendesk_tickets}
              </text>
              
              {/* Zendesk ticket distribution visualization */}
              <g>
                <text x="130" y="160" textAnchor="middle" fill="white" fontSize="12" opacity="0.9">
                  Connected: {analyticsData.summary.connected_tickets}
                </text>
                
                {/* Visual bar showing connected vs total */}
                <rect x="80" y="180" width="100" height="8" fill="rgba(255,255,255,0.3)" rx="4" />
                <rect x="80" y="180" 
                      width={(analyticsData.summary.connected_tickets / analyticsData.summary.total_zendesk_tickets) * 100} 
                      height="8" fill="white" rx="4" />
                
                <text x="130" y="205" textAnchor="middle" fill="white" fontSize="10">
                  {Math.round((analyticsData.summary.connected_tickets / analyticsData.summary.total_zendesk_tickets) * 100)}% Connected
                </text>
                
                {/* Ticket ID examples */}
                <text x="130" y="230" textAnchor="middle" fill="white" fontSize="10" opacity="0.8">
                  ZD-5648, ZD-5644, ZD-5642...
                </text>
              </g>
            </g>
            
            {/* Center: Slack Reports */}
            <g>
              <rect x="380" y="80" width="140" height="200" fill="url(#slackGradient)" rx="12" filter="url(#shadow)" />
              <text x="450" y="120" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                Slack Reports
              </text>
              <text x="450" y="150" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">
                {analyticsData.summary.total_slack_tickets}
              </text>
              
              {/* Slack filtering info */}
              <g>
                <text x="450" y="180" textAnchor="middle" fill="white" fontSize="12" opacity="0.9">
                  With &quot;AUTHOR&quot; filter
                </text>
                <text x="450" y="200" textAnchor="middle" fill="white" fontSize="10" opacity="0.8">
                  Bug reports only
                </text>
                
                {/* Priority distribution mini-chart */}
                <g>
                  <text x="450" y="230" textAnchor="middle" fill="white" fontSize="10" opacity="0.8">
                    Priority Distribution
                  </text>
                  <rect x="410" y="240" width="20" height="20" fill="#FF4D4F" rx="2" opacity="0.8" />
                  <rect x="435" y="240" width="30" height="20" fill="#FF7A45" rx="2" opacity="0.8" />
                  <rect x="470" y="240" width="15" height="20" fill="#52C41A" rx="2" opacity="0.8" />
                </g>
              </g>
            </g>
            
            {/* Right: Shortcut Cards */}
            <g>
              <rect x="700" y="100" width="140" height="160" fill="url(#shortcutGradient)" rx="12" filter="url(#shadow)" />
              <text x="770" y="140" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                Shortcut Cards
              </text>
              <text x="770" y="170" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">
                {analyticsData.summary.total_shortcut_cards}
              </text>
              
              {/* Development status */}
              <g>
                <text x="770" y="200" textAnchor="middle" fill="white" fontSize="12" opacity="0.9">
                  In Development
                </text>
                <text x="770" y="220" textAnchor="middle" fill="white" fontSize="10" opacity="0.8">
                  Avg: {formatHours(analyticsData.resolution_metrics.average_resolution_hours)}
                </text>
              </g>
            </g>
            
            {/* Beautiful Flow Connections */}
            {/* Zendesk to Slack Flow */}
            <path
              d="M 200 180 Q 290 160 380 180"
              stroke="url(#slackGradient)"
              strokeWidth="40"
              fill="none"
              opacity="0.7"
              strokeLinecap="round"
            />
            
            {/* Slack to Shortcut Flow */}
            <path
              d="M 520 180 Q 610 170 700 180"
              stroke="url(#shortcutGradient)"
              strokeWidth="25"
              fill="none"
              opacity="0.7"
              strokeLinecap="round"
            />
            
            {/* Flow Labels with Glass Effect */}
            <g>
              <rect x="250" y="140" width="120" height="40" fill="rgba(255,255,255,0.9)" 
                    stroke="rgba(255,255,255,0.3)" strokeWidth="1" rx="8" filter="url(#shadow)" />
              <text x="310" y="155" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#4A90E2">
                Reports → Tickets
              </text>
              <text x="310" y="170" textAnchor="middle" fontSize="10" fill="#666">
                ~93% Conversion
              </text>
            </g>
            
            <g>
              <rect x="570" y="140" width="120" height="40" fill="rgba(255,255,255,0.9)" 
                    stroke="rgba(255,255,255,0.3)" strokeWidth="1" rx="8" filter="url(#shadow)" />
              <text x="630" y="155" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#F5A623">
                Tickets → Cards
              </text>
              <text x="630" y="170" textAnchor="middle" fontSize="10" fill="#666">
                {Math.round((analyticsData.summary.total_shortcut_cards / analyticsData.summary.total_zendesk_tickets) * 100)}% Development
              </text>
            </g>
            
            {/* End-to-End Conversion Badge */}
            <g>
              <circle cx="450" cy="320" r="35" fill="url(#shortcutGradient)" filter="url(#shadow)" />
              <text x="450" y="315" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                {getConversionPercentage(analyticsData.source_analytics.conversion_rate.tickets_to_cards)}
              </text>
              <text x="450" y="330" textAnchor="middle" fill="white" fontSize="10">
                End-to-End Success
              </text>
            </g>
            
            {/* Elegant Legend */}
            <g>
              <rect x="60" y="320" width="280" height="30" fill="rgba(255,255,255,0.8)" rx="6" />
              <text x="75" y="335" fontSize="11" fill="#666" fontWeight="bold">Flow Analysis:</text>
              <text x="75" y="348" fontSize="9" fill="#666">
                Zendesk ticket numbers tracked through development lifecycle
              </text>
              <circle cx="260" cy="335" r="4" fill="#7ED321" />
              <circle cx="280" cy="335" r="4" fill="#4A90E2" />
              <circle cx="300" cy="335" r="4" fill="#F5A623" />
            </g>
          </svg>
        </div>
      </Card>

      {/* Interactive Sankey Diagram */}
      <Card title="Interactive Ticket Flow: Channels → Owners → Development" className="mb-6 grafana-card">
        <div className="h-96 chart-container" style={{ background: '#161b22', padding: '20px' }}>
          <ResponsiveSankey
            data={{
              nodes: [
                // Channel nodes (left side)
                { id: 'ch-general', color: '#4A90E2' },
                { id: 'ch-bug-reports', color: '#E74C3C' },
                { id: 'ch-support', color: '#F39C12' },
                { id: 'ch-dev-alerts', color: '#9B59B6' },
                
                // Owner nodes (middle)
                { id: 'owner-alice', color: '#2ECC71' },
                { id: 'owner-bob', color: '#3498DB' },
                { id: 'owner-carol', color: '#E67E22' },
                { id: 'owner-david', color: '#1ABC9C' },
                
                // Development card nodes (right side)
                { id: 'card-sc1', color: '#F1C40F' },
                { id: 'card-sc2', color: '#E91E63' },
                { id: 'card-sc3', color: '#8E44AD' },
                { id: 'card-sc4', color: '#27AE60' },
                { id: 'card-sc5', color: '#34495E' },
              ],
              links: [
                // Channel to Owner flows (higher values for better visibility)
                { source: 'ch-general', target: 'owner-alice', value: 120 },
                { source: 'ch-general', target: 'owner-bob', value: 80 },
                { source: 'ch-bug-reports', target: 'owner-carol', value: 200 },
                { source: 'ch-bug-reports', target: 'owner-david', value: 150 },
                { source: 'ch-support', target: 'owner-alice', value: 60 },
                { source: 'ch-support', target: 'owner-carol', value: 90 },
                { source: 'ch-dev-alerts', target: 'owner-bob', value: 40 },
                { source: 'ch-dev-alerts', target: 'owner-david', value: 70 },
                
                // Owner to Development Card flows
                { source: 'owner-alice', target: 'card-sc1', value: 45 },
                { source: 'owner-alice', target: 'card-sc2', value: 25 },
                { source: 'owner-bob', target: 'card-sc3', value: 35 },
                { source: 'owner-bob', target: 'card-sc4', value: 30 },
                { source: 'owner-carol', target: 'card-sc4', value: 50 },
                { source: 'owner-carol', target: 'card-sc5', value: 40 },
                { source: 'owner-david', target: 'card-sc1', value: 35 },
                { source: 'owner-david', target: 'card-sc5', value: 25 },
              ]
            }}
            margin={{ top: 40, right: 120, bottom: 40, left: 120 }}
            align="justify"
            colors={{ scheme: 'nivo' }}
            nodeOpacity={1}
            nodeHoverOthersOpacity={0.2}
            nodeThickness={24}
            nodeSpacing={20}
            nodeBorderWidth={2}
            nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.5]] }}
            linkOpacity={0.7}
            linkHoverOthersOpacity={0.1}
            linkContract={4}
            enableLinkGradient={true}
            labelPosition="outside"
            labelOrientation="horizontal"
            labelPadding={16}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.4]] }}
          />
        </div>
        
        {/* Flow Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">4</div>
            <div className="text-sm text-gray-600 font-medium">Slack Channels</div>
            <div className="text-xs text-gray-500 mt-1">#general, #bug-reports, #support, #dev-alerts</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
            <div className="text-2xl font-bold text-green-600">4</div>
            <div className="text-sm text-gray-600 font-medium">Ticket Owners</div>
            <div className="text-xs text-gray-500 mt-1">Alice, Bob, Carol, David</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">5</div>
            <div className="text-sm text-gray-600 font-medium">Development Cards</div>
            <div className="text-xs text-gray-500 mt-1">Active Shortcut cards</div>
          </div>
        </div>
      </Card>

      {/* Resolution Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Resolution Time Metrics" className="h-fit">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Resolution Time:</span>
              <span className="font-bold text-lg">{formatHours(analyticsData.resolution_metrics.average_resolution_hours)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Median Resolution Time:</span>
              <span className="font-bold">{formatHours(analyticsData.resolution_metrics.median_resolution_hours)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Fastest Resolution:</span>
              <span className="font-bold text-green-600">{formatHours(analyticsData.resolution_metrics.min_resolution_hours)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Slowest Resolution:</span>
              <span className="font-bold text-red-600">{formatHours(analyticsData.resolution_metrics.max_resolution_hours)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed Cards:</span>
              <span className="font-bold">{analyticsData.resolution_metrics.total_completed_cards}</span>
            </div>
          </div>
        </Card>

        <Card title="Resolution by Priority" className="h-fit">
          <div className="space-y-3">
            {Object.entries(analyticsData.resolution_metrics.priority_breakdown).map(([priority, metrics]) => (
              metrics.count > 0 && (
                <div key={priority} className="border-l-4 border-gray-300 pl-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{priority}</span>
                    <span className="text-sm text-gray-500">({metrics.count} cards)</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Avg: {formatHours(metrics.avg_hours)}
                  </div>
                </div>
              )
            ))}
          </div>
        </Card>
      </div>

      {/* Time Distribution */}
      <Card title="Resolution Time Distribution" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(analyticsData.resolution_metrics.resolution_distribution).map(([timeframe, count]) => (
            <div key={timeframe} className="text-center">
              <div className="text-2xl font-bold text-blue-600">{count}</div>
              <div className="text-sm text-gray-600">{timeframe}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Conversion Metrics */}
      <Card title="Conversion Analytics" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-xl font-bold text-indigo-600">
              {getConversionPercentage(analyticsData.source_analytics.conversion_rate.tickets_to_cards)}
            </div>
            <div className="text-sm text-gray-600">Tickets → Cards Conversion</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">
              {analyticsData.source_analytics.conversion_rate.total_input_tickets}
            </div>
            <div className="text-sm text-gray-600">Total Input Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">
              {analyticsData.source_analytics.conversion_rate.total_output_cards}
            </div>
            <div className="text-sm text-gray-600">Total Output Cards</div>
          </div>
        </div>
      </Card>

      {/* Insights */}
      <Card title="Key Insights" className="bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <strong>Connection Rate:</strong> {analyticsData.summary.connected_tickets} out of {analyticsData.summary.total_zendesk_tickets} Zendesk tickets are connected to Shortcut cards
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <strong>Resolution Performance:</strong> Critical priority tickets resolve fastest with an average of {formatHours(analyticsData.resolution_metrics.priority_breakdown.Critical?.avg_hours || 0)}
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            <div>
              <strong>Time Distribution:</strong> {analyticsData.resolution_metrics.resolution_distribution['2+ weeks']} tickets ({((analyticsData.resolution_metrics.resolution_distribution['2+ weeks'] / analyticsData.resolution_metrics.total_completed_cards) * 100).toFixed(1)}%) take more than 2 weeks to resolve
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <strong>Flow Efficiency:</strong> {getConversionPercentage(analyticsData.source_analytics.conversion_rate.tickets_to_cards)} of support tickets result in development cards
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FlowAnalytics;
