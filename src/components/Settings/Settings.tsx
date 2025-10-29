import React from 'react';
import { Typography, Tabs, Card } from 'antd';
import { SettingOutlined, DatabaseOutlined, ApiOutlined, BellOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import IngestionStatus from './IngestionStatus';

const { Title } = Typography;
const { TabPane } = Tabs;

const SettingsContainer = styled.div`
  padding: 24px;
`;

const Settings: React.FC = () => {
  return (
    <SettingsContainer>
      <Title level={2}>
        <SettingOutlined /> Settings
      </Title>

      <Tabs defaultActiveKey="ingestion" size="large">
        <TabPane
          tab={
            <span>
              <DatabaseOutlined />
              Ingestion Status
            </span>
          }
          key="ingestion"
        >
          <IngestionStatus />
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <ApiOutlined />
              API Configuration
            </span>
          }
          key="api"
        >
          <Card>
            <Title level={4}>API Endpoint</Title>
            <p>
              Current API Gateway URL: <code>{process.env.NEXT_PUBLIC_API_BASE_URL || 'Not configured'}</code>
            </p>
            <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
              Configure via environment variable: <code>NEXT_PUBLIC_API_BASE_URL</code>
            </p>
          </Card>
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <BellOutlined />
              Notifications
            </span>
          }
          key="notifications"
        >
          <Card>
            <Title level={4}>Notification Settings</Title>
            <p>Configure alerts and notifications for ingestion failures.</p>
            <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
              Coming soon: Email alerts, Slack notifications, and custom alert rules.
            </p>
          </Card>
        </TabPane>
      </Tabs>
    </SettingsContainer>
  );
};

export default Settings;

