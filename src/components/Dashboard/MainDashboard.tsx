import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Typography, Card } from 'antd';
import { 
  DashboardOutlined, 
  BugOutlined, 
  BarChartOutlined, 
  SettingOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import GrafanaDashboard from '../Dashboard/GrafanaDashboard';
import BugList from '../BugList/BugList';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledHeader = styled(Header)`
  background: #001529;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .logo {
    color: white;
    font-size: 20px;
    font-weight: bold;
  }
  
  .header-actions {
    color: white;
  }
`;

const StyledSider = styled(Sider)`
  background: #001529;
  
  .ant-menu {
    background: #001529;
  }
  
  .ant-menu-item {
    color: #fff;
    
    &:hover {
      background: #1890ff;
    }
  }
  
  .ant-menu-item-selected {
    background: #1890ff;
  }
`;

const StyledContent = styled(Content)`
  background: #f0f2f5;
  overflow: auto;
`;

const ContentContainer = styled.div`
  padding: 24px;
  min-height: calc(100vh - 64px);
`;

const StatusCard = styled(Card)`
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

enum DashboardView {
  OVERVIEW = 'overview',
  BUG_LIST = 'bug_list',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings'
}

const MainDashboard: React.FC = () => {
  const [selectedView, setSelectedView] = useState<DashboardView>(DashboardView.OVERVIEW);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleMenuClick = (key: string) => {
    setSelectedView(key as DashboardView);
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
    setRefreshKey(prev => prev + 1);
  };

  // Use useEffect to set the initial date on client side only
  useEffect(() => {
    setLastRefresh(new Date());
  }, []);

  const renderContent = () => {
    switch (selectedView) {
      case DashboardView.OVERVIEW:
        return <GrafanaDashboard key={refreshKey} />;
      case DashboardView.BUG_LIST:
        return <BugList key={refreshKey} />;
      case DashboardView.ANALYTICS:
        return (
          <div>
            <Title level={2}>Analytics Dashboard</Title>
            <p>Advanced analytics and reporting features coming soon...</p>
          </div>
        );
      case DashboardView.SETTINGS:
        return (
          <div>
            <Title level={2}>Settings</Title>
            <p>Configuration and preferences coming soon...</p>
          </div>
        );
      default:
        return <GrafanaDashboard key={refreshKey} />;
    }
  };

  const menuItems = [
    {
      key: DashboardView.OVERVIEW,
      icon: <DashboardOutlined />,
      label: 'Dashboard Overview',
    },
    {
      key: DashboardView.BUG_LIST,
      icon: <BugOutlined />,
      label: 'Bug List',
    },
    {
      key: DashboardView.ANALYTICS,
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: DashboardView.SETTINGS,
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  return (
    <StyledLayout>
      <StyledHeader>
        <div className="logo">
          🐛 BugTracker Dashboard
        </div>
        <div className="header-actions">
          <Space>
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              style={{ color: 'white' }}
            >
              Refresh
            </Button>
            <span style={{ color: '#ccc', fontSize: '12px' }}>
              Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Loading...'}
            </span>
          </Space>
        </div>
      </StyledHeader>
      
      <Layout>
        <StyledSider width={250}>
          <Menu
            mode="inline"
            selectedKeys={[selectedView]}
            items={menuItems}
            onClick={({ key }) => handleMenuClick(key)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </StyledSider>
        
        <StyledContent>
          <ContentContainer>
            {renderContent()}
          </ContentContainer>
        </StyledContent>
      </Layout>
    </StyledLayout>
  );
};

export default MainDashboard;
