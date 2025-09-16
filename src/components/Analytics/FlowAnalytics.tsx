import React, { useState, useEffect } from 'react';
import { Card } from 'antd';

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
      setError('Error fetching analytics data: ' + (err as Error).message);
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
      <Card title="Ticket Flow Diagram" className="mb-6">
        <div className="h-80 bg-gray-50 rounded-lg p-4">
          <svg width="100%" height="100%" viewBox="0 0 800 280" className="overflow-visible">
            {/* Background */}
            <rect width="800" height="280" fill="#f8fafc" rx="8" />
            
            {/* Nodes */}
            {/* Slack Node */}
            <g>
              <rect x="50" y="40" width="120" height="200" fill="#4A90E2" rx="8" />
              <text x="110" y="125" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                Slack Reports
              </text>
              <text x="110" y="150" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">
                {analyticsData.summary.total_slack_tickets}
              </text>
            </g>
            
            {/* Zendesk Node */}
            <g>
              <rect x="340" y="65" width="120" height="150" fill="#7ED321" rx="8" />
              <text x="400" y="125" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                Zendesk Tickets
              </text>
              <text x="400" y="150" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">
                {analyticsData.summary.total_zendesk_tickets}
              </text>
            </g>
            
            {/* Shortcut Node */}
            <g>
              <rect x="630" y="90" width="120" height="100" fill="#F5A623" rx="8" />
              <text x="690" y="125" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                Shortcut Cards
              </text>
              <text x="690" y="150" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">
                {analyticsData.summary.total_shortcut_cards}
              </text>
            </g>
            
            {/* Flow Paths - Sankey Style */}
            {/* Slack to Zendesk Flow */}
            <path
              d="M 170 140 Q 255 100 340 140"
              stroke="#60A5FA"
              strokeWidth="60"
              fill="none"
              opacity="0.6"
            />
            
            {/* Zendesk to Shortcut Flow */}
            <path
              d="M 460 140 Q 545 130 630 140"
              stroke="#34D399"
              strokeWidth="35"
              fill="none"
              opacity="0.6"
            />
            
            {/* Flow Labels with Background */}
            <g>
              <rect x="220" y="85" width="100" height="30" fill="white" stroke="#ddd" rx="4" opacity="0.95" />
              <text x="270" y="103" textAnchor="middle" fontSize="12" fontWeight="bold">
                ~93% Flow Rate
              </text>
            </g>
            
            <g>
              <rect x="510" y="105" width="100" height="50" fill="white" stroke="#ddd" rx="4" opacity="0.95" />
              <text x="560" y="123" textAnchor="middle" fontSize="12" fontWeight="bold">
                {analyticsData.summary.connected_tickets} Connected
              </text>
              <text x="560" y="140" textAnchor="middle" fontSize="10" fill="#666">
                Avg: {formatHours(analyticsData.resolution_metrics.average_resolution_hours)}
              </text>
            </g>
            
            {/* Conversion Rate Badge */}
            <g>
              <circle cx="690" cy="210" r="30" fill="#8B5CF6" />
              <text x="690" y="205" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                {getConversionPercentage(analyticsData.source_analytics.conversion_rate.tickets_to_cards)}
              </text>
              <text x="690" y="220" textAnchor="middle" fill="white" fontSize="9">
                End-to-End
              </text>
            </g>
            
            {/* Legend */}
            <g>
              <text x="50" y="260" fontSize="12" fill="#666" fontWeight="bold">Flow Width = Volume</text>
              <line x1="180" y1="255" x2="220" y2="255" stroke="#60A5FA" strokeWidth="6" opacity="0.6" />
              <text x="230" y="259" fontSize="10" fill="#666">High Volume</text>
              <line x1="320" y1="255" x2="360" y2="255" stroke="#34D399" strokeWidth="4" opacity="0.6" />
              <text x="370" y="259" fontSize="10" fill="#666">Connected Flow</text>
            </g>
          </svg>
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
