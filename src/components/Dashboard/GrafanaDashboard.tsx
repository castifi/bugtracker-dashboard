import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert, Select, DatePicker } from 'antd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styled from 'styled-components';

const { RangePicker } = DatePicker;
const { Option } = Select;

const DashboardContainer = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const MetricCard = styled(Card)`
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .ant-statistic-title {
    font-size: 14px;
    color: #666;
  }
  
  .ant-statistic-content {
    font-size: 24px;
    font-weight: bold;
  }
`;

const ChartCard = styled(Card)`
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .ant-card-head-title {
    font-size: 16px;
    font-weight: 600;
  }
`;

interface BugData {
  total_bugs: number;
  by_priority: Record<string, number>;
  by_state: Record<string, number>;
  by_source: Record<string, number>;
}

interface TimeSeriesData {
  date: string;
  count: number;
}

interface GrafanaDashboardProps {
  apiGatewayUrl?: string;
}

const GrafanaDashboard: React.FC<GrafanaDashboardProps> = ({ 
  apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || '/api/dynamodb-bugs'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bugData, setBugData] = useState<BugData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [timeRange, setTimeRange] = useState<[string, string] | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>('all');

  const COLORS = {
    High: '#ff4d4f',
    Medium: '#faad14',
    Low: '#52c41a',
    Critical: '#cf1322',
    Unknown: '#8c8c8c',
    slack: '#4a154b',
    zendesk: '#03363d',
    shortcut: '#0052cc'
  };

  const fetchBugData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch summary data
      const summaryParams = new URLSearchParams({
        query_type: 'summary'
      });
      if (timeRange) {
        summaryParams.append('start_date', timeRange[0]);
        summaryParams.append('end_date', timeRange[1]);
      }
      
      // Add source filter if not "all"
      if (selectedSource !== 'all') {
        summaryParams.append('source_system', selectedSource);
      }
      
      const summaryResponse = await fetch(`${apiGatewayUrl}?${summaryParams.toString()}`, {
        method: 'GET'
      });

      if (!summaryResponse.ok) {
        throw new Error(`API Error: ${summaryResponse.status}`);
      }

      const summaryData = await summaryResponse.json();
      
      // API returns data directly, not wrapped in success field
      setBugData(summaryData);

      // Fetch time series data
      const timeSeriesParams = new URLSearchParams({
        query_type: 'time_series'
      });
      if (timeRange) {
        timeSeriesParams.append('days', '30');
      } else {
        timeSeriesParams.append('days', '7');
      }
      
      // Add source filter if not "all"
      if (selectedSource !== 'all') {
        timeSeriesParams.append('source_system', selectedSource);
      }
      
      const timeSeriesResponse = await fetch(`${apiGatewayUrl}?${timeSeriesParams.toString()}`, {
        method: 'GET'
      });

      if (timeSeriesResponse.ok) {
        const timeSeriesResult = await timeSeriesResponse.json();
        // API returns data directly, not wrapped in success field
        setTimeSeriesData(timeSeriesResult.data || timeSeriesResult);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching bug data:', err);
    } finally {
      setLoading(false);
    }
  }, [apiGatewayUrl, timeRange, selectedSource]);

  useEffect(() => {
    fetchBugData();
  }, [timeRange, selectedSource, fetchBugData]);

  const handleTimeRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      const [start, end] = dates;
      setTimeRange([
        start.format('YYYY-MM-DD'),
        end.format('YYYY-MM-DD')
      ]);
    } else {
      setTimeRange(null);
    }
  };

  const handleSourceChange = (value: string) => {
    setSelectedSource(value);
  };

  if (loading) {
    return (
      <DashboardContainer>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p>Loading dashboard data...</p>
        </div>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <Alert
          message="Error Loading Dashboard"
          description={error}
          type="error"
          showIcon
          action={
            <button onClick={fetchBugData} style={{ marginLeft: 8 }}>
              Retry
            </button>
          }
        />
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* Header Controls */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <RangePicker
            onChange={handleTimeRangeChange}
            placeholder={['Start Date', 'End Date']}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={12}>
          <Select
            value={selectedSource}
            onChange={handleSourceChange}
            style={{ width: '100%' }}
            placeholder="Filter by source"
          >
            <Option value="all">All Sources</Option>
            <Option value="slack">Slack</Option>
            <Option value="zendesk">Zendesk</Option>
            <Option value="shortcut">Shortcut</Option>
          </Select>
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row gutter={16}>
        <Col span={6}>
          <MetricCard>
            <Statistic
              title="Total Bugs"
              value={bugData?.total_bugs || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </MetricCard>
        </Col>
        <Col span={6}>
          <MetricCard>
            <Statistic
              title="High Priority"
              value={bugData?.by_priority?.High || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </MetricCard>
        </Col>
        <Col span={6}>
          <MetricCard>
            <Statistic
              title="In Progress"
              value={bugData?.by_state?.['In Progress'] || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </MetricCard>
        </Col>
        <Col span={6}>
          <MetricCard>
            <Statistic
              title="Ready for QA"
              value={bugData?.by_state?.['Ready for QA'] || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </MetricCard>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={16}>
        <Col span={12}>
          <ChartCard title="Bugs by Priority">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(bugData?.by_priority || {}).map(([key, value]) => ({
                    name: key,
                    value
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(bugData?.by_priority || {}).map(([key], index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[key as keyof typeof COLORS] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>
        <Col span={12}>
          <ChartCard title="Bugs by Source">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(bugData?.by_source || {}).map(([key, value]) => ({
                name: key.charAt(0).toUpperCase() + key.slice(1),
                value
              }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1890ff" />
            </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={16}>
        <Col span={24}>
          <ChartCard title="Bug Activity Timeline">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>
      </Row>

      {/* Charts Row 3 */}
      <Row gutter={16}>
        <Col span={12}>
          <ChartCard title="Bugs by State">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(bugData?.by_state || {}).map(([key, value]) => ({
                    name: key,
                    value
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(bugData?.by_state || {}).map(([key], index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>
        <Col span={12}>
          <ChartCard title="Priority Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(bugData?.by_priority || {}).map(([key, value]) => ({
                name: key,
                value,
                fill: COLORS[key as keyof typeof COLORS] || '#8884d8'
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>
      </Row>
    </DashboardContainer>
  );
};

export default GrafanaDashboard;
