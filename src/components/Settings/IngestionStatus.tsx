import React, { useState, useEffect } from 'react';
import { Card, Statistic, Tag, Space, Button, Spin, Alert, Typography, Timeline, Row, Col } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  WarningOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  ApiOutlined,
  CloudOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { apiService } from '../../lib/apiService';

const { Title, Text } = Typography;

const StatusContainer = styled.div`
  padding: 24px;
`;

const StatusCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  
  .ant-card-head {
    border-bottom: 1px solid #f0f0f0;
  }
`;

const MetricRow = styled(Row)`
  margin-bottom: 16px;
`;

const StatusTag = styled(Tag)`
  padding: 4px 12px;
  font-size: 13px;
  border-radius: 4px;
`;

interface IngestionStatusData {
  totalItems: number;
  lastUpdate: string | null;
  hoursAgo: number | null;
  recentUpdates24h: number;
  sourceDistribution: {
    slack: number;
    zendesk: number;
    shortcut: number;
  };
  status: 'healthy' | 'warning' | 'error' | 'unknown';
}

const IngestionStatus: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<IngestionStatusData | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchIngestionStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get summary data to check overall status
      const summaryResponse = await apiService.getBugSummary();
      
      if (!summaryResponse.success || !summaryResponse.data) {
        throw new Error(summaryResponse.error || 'Failed to fetch summary data');
      }

      const summary = summaryResponse.data.summary || summaryResponse.data;
      
      // Get all bugs to check recent updates
      const allBugsResponse = await apiService.getAllBugs(100, 'newest');

      if (!allBugsResponse.success || !allBugsResponse.data) {
        throw new Error(allBugsResponse.error || 'Failed to fetch recent bugs');
      }

      const bugs = allBugsResponse.data.items || [];
      
      // Calculate last update time
      let lastUpdate: string | null = null;
      let hoursAgo: number | null = null;
      
      if (bugs.length > 0) {
        const latestBug = bugs[0];
        if (latestBug.updatedAt) {
          lastUpdate = latestBug.updatedAt;
          const now = new Date();
          if (lastUpdate) {
            const updated = new Date(lastUpdate);
            hoursAgo = Math.round((now.getTime() - updated.getTime()) / (1000 * 60 * 60) * 10) / 10;
          }
        }
      }

      // Calculate recent updates (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      
      const recentBugs = bugs.filter((bug: any) => {
        if (!bug.updatedAt) return false;
        const updated = new Date(bug.updatedAt);
        return updated >= oneDayAgo;
      });

      // Determine status
      let status: 'healthy' | 'warning' | 'error' | 'unknown' = 'unknown';
      if (hoursAgo !== null) {
        if (hoursAgo < 2) {
          status = 'healthy';
        } else if (hoursAgo < 24) {
          status = 'warning';
        } else {
          status = 'error';
        }
      }

      setStatusData({
        totalItems: summary.total || 0,
        lastUpdate,
        hoursAgo,
        recentUpdates24h: recentBugs.length,
        sourceDistribution: {
          slack: summary.by_source?.slack || 0,
          zendesk: summary.by_source?.zendesk || 0,
          shortcut: summary.by_source?.shortcut || 0,
        },
        status,
      });

      setLastChecked(new Date());
    } catch (err) {
      console.error('Error fetching ingestion status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatusData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngestionStatus();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchIngestionStatus();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusIcon = () => {
    if (!statusData) return <WarningOutlined />;
    switch (statusData.status) {
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <WarningOutlined />;
    }
  };

  const getStatusTag = () => {
    if (!statusData) return <StatusTag color="default">Unknown</StatusTag>;
    switch (statusData.status) {
      case 'healthy':
        return <StatusTag color="success">Healthy</StatusTag>;
      case 'warning':
        return <StatusTag color="warning">Warning</StatusTag>;
      case 'error':
        return <StatusTag color="error">Error</StatusTag>;
      default:
        return <StatusTag color="default">Unknown</StatusTag>;
    }
  };

  const formatLastUpdate = () => {
    if (!statusData?.lastUpdate) return 'Unknown';
    const date = new Date(statusData.lastUpdate);
    return date.toLocaleString();
  };

  if (loading && !statusData) {
    return (
      <StatusContainer>
        <Spin size="large" tip="Loading ingestion status..." />
      </StatusContainer>
    );
  }

  return (
    <StatusContainer>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>
            <DatabaseOutlined /> Ingestion Status
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchIngestionStatus}
              loading={loading}
            >
              Refresh
            </Button>
            {lastChecked && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Last checked: {lastChecked.toLocaleTimeString()}
              </Text>
            )}
          </Space>
        </div>

        {error && (
          <Alert
            message="Error fetching ingestion status"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        {/* Overall Status */}
        <StatusCard
          title={
            <Space>
              {getStatusIcon()}
              <span>Overall Status</span>
              {getStatusTag()}
            </Space>
          }
        >
          <MetricRow gutter={16}>
            <Col span={8}>
              <Statistic
                title="Total Items"
                value={statusData?.totalItems || 0}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Last Update"
                value={statusData && statusData.hoursAgo !== null ? `${statusData.hoursAgo}h ago` : 'Unknown'}
                prefix={<ClockCircleOutlined />}
                valueStyle={{
                  color: statusData?.status === 'healthy' ? '#52c41a' : 
                         statusData?.status === 'warning' ? '#faad14' : '#ff4d4f'
                }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Updates (24h)"
                value={statusData?.recentUpdates24h || 0}
                prefix={<ApiOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </MetricRow>
          
          {statusData?.lastUpdate && (
            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Last update timestamp: {formatLastUpdate()}
              </Text>
            </div>
          )}
        </StatusCard>

        {/* Source Distribution */}
        <StatusCard title={<><CloudOutlined /> Source Distribution</>}>
          <MetricRow gutter={16}>
            <Col span={8}>
              <Statistic
                title="Zendesk"
                value={statusData?.sourceDistribution.zendesk || 0}
                valueStyle={{ color: '#03363d' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Slack"
                value={statusData?.sourceDistribution.slack || 0}
                valueStyle={{ color: '#4a154b' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Shortcut"
                value={statusData?.sourceDistribution.shortcut || 0}
                valueStyle={{ color: '#0052cc' }}
              />
            </Col>
          </MetricRow>
        </StatusCard>

        {/* Status Timeline */}
        <StatusCard title="Status Information">
          <Timeline>
            <Timeline.Item color={statusData?.status === 'healthy' ? 'green' : 'orange'}>
              <Text strong>Ingestion Health</Text>
              <br />
              <Text type="secondary">
                {statusData?.status === 'healthy' 
                  ? 'Data is being ingested successfully and updates are recent.'
                  : statusData?.status === 'warning'
                  ? 'Data updates are delayed. Ingestion may need attention.'
                  : 'Ingestion appears to be failing. Check Lambda logs and scheduled tasks.'
                }
              </Text>
            </Timeline.Item>
            <Timeline.Item color="blue">
              <Text strong>Scheduled Tasks</Text>
              <br />
              <Text type="secondary">
                Ingestion runs hourly via EventBridge scheduled rules.
              </Text>
            </Timeline.Item>
            <Timeline.Item color="gray">
              <Text strong>Data Freshness</Text>
              <br />
              <Text type="secondary">
                {statusData && statusData.hoursAgo !== null
                  ? `Latest data is ${statusData.hoursAgo} hours old.`
                  : 'Could not determine data freshness.'
                }
              </Text>
            </Timeline.Item>
          </Timeline>
        </StatusCard>
      </Space>
    </StatusContainer>
  );
};

export default IngestionStatus;

