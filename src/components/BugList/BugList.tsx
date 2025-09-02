import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tag, Space, Button, Input, Select, DatePicker, Modal, message } from 'antd';
import { SearchOutlined, FilterOutlined, LinkOutlined, EyeOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Helper function to safely render values that might be objects
const safeRender = (value: any): string => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return 'Object';
    }
  }
  return String(value);
};

const BugListContainer = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const FilterCard = styled(Card)`
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const BugTableCard = styled(Card)`
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

interface BugItem {
  PK: string;
  SK: string;
  sourceSystem: string;
  createdAt: string;
  updatedAt: string;
  priority?: string;
  state?: string;
  state_id?: string | any;
  status?: string;
  subject?: string;
  text?: string | any;
  name?: string;
  author?: string | any;
  author_id?: string | any;
  requester?: string | any;
  assignee?: string | any;
}

interface BugListProps {
  apiGatewayUrl?: string;
}

const BugList: React.FC<BugListProps> = ({
  apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || '/api/dynamodb-bugs'
}) => {
  const [loading, setLoading] = useState(false);
  const [bugs, setBugs] = useState<BugItem[]>([]);
  const [filteredBugs, setFilteredBugs] = useState<BugItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<[string, string] | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBug, setSelectedBug] = useState<BugItem | null>(null);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkForm, setLinkForm] = useState({ oldTicketId: '', newTicketId: '' });

  const priorityColors = {
    High: 'red',
    Medium: 'orange',
    Low: 'green',
    Critical: 'volcano',
    Unknown: 'default'
  };

  const sourceColors = {
    slack: 'purple',
    zendesk: 'blue',
    shortcut: 'cyan'
  };

  const fetchBugs = useCallback(async () => {
    try {
      setLoading(true);
      
      // Determine which sources to fetch based on selectedSource filter
      const sources = selectedSource === 'all' ? ['slack', 'zendesk', 'shortcut'] : [selectedSource];
      let allBugs: BugItem[] = [];

      for (const source of sources) {
        const params = new URLSearchParams({
          query_type: 'by_source',
          source_system: source
        });
        if (timeRange) {
          params.append('start_date', timeRange[0]);
          params.append('end_date', timeRange[1]);
          console.log(`Adding date filter: start_date=${timeRange[0]}, end_date=${timeRange[1]}`);
        } else {
          console.log('No date range selected');
        }
        
        const response = await fetch(`${apiGatewayUrl}?${params.toString()}`, {
          method: 'GET'
        });

        if (response.ok) {
          const result = await response.json();
          // Add detailed logging for troubleshooting
          console.log(`By Source API Response for ${source}:`, result);
          console.log(`By Source API URL for ${source}:`, `${apiGatewayUrl}?${params.toString()}`);
          // API returns data directly, not wrapped in success field
          if (result.items) {
            allBugs = [...allBugs, ...result.items];
          }
        }
      }

      setBugs(allBugs);
      setFilteredBugs(allBugs);

    } catch (error) {
      console.error('Error fetching bugs:', error);
      message.error('Failed to fetch bug data');
    } finally {
      setLoading(false);
    }
  }, [apiGatewayUrl, timeRange, selectedSource]);

  useEffect(() => {
    fetchBugs();
  }, [timeRange, selectedSource, fetchBugs]);

  useEffect(() => {
    // Apply filters
    let filtered = bugs;

    // Search filter
    if (searchText) {
      filtered = filtered.filter(bug => 
        bug.PK?.toLowerCase().includes(searchText.toLowerCase()) ||
        bug.subject?.toLowerCase().includes(searchText.toLowerCase()) ||
        bug.text?.toLowerCase().includes(searchText.toLowerCase()) ||
        bug.name?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(bug => bug.priority === selectedPriority);
    }

    // State filter
    if (selectedState !== 'all') {
      filtered = filtered.filter(bug => 
        bug.state === selectedState || bug.status === selectedState
      );
    }

    setFilteredBugs(filtered);
  }, [bugs, searchText, selectedPriority, selectedState]);

  const handleViewDetails = (bug: BugItem) => {
    setSelectedBug(bug);
    setDetailModalVisible(true);
  };

  const handleLinkBugs = (bug: BugItem) => {
    setLinkForm({ oldTicketId: bug.PK, newTicketId: '' });
    setLinkModalVisible(true);
  };

  const handleLinkSubmit = async () => {
    try {
      const response = await fetch(`${apiGatewayUrl}/link-bugs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'link_bugs',
          old_ticket_id: linkForm.oldTicketId,
          new_ticket_id: linkForm.newTicketId
        })
      });

      if (response.ok) {
        message.success('Bugs linked successfully');
        setLinkModalVisible(false);
        fetchBugs(); // Refresh data
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to link bugs');
      }
    } catch (error) {
      console.error('Error linking bugs:', error);
      message.error('Failed to link bugs');
    }
  };

  const columns = [
    {
      title: 'Ticket ID',
      dataIndex: 'PK',
      key: 'PK',
      render: (text: string) => (
        <Tag color="blue" style={{ fontWeight: 'bold' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'sourceSystem',
      key: 'sourceSystem',
      render: (text: string) => (
        <Tag color={sourceColors[text as keyof typeof sourceColors] || 'default'}>
          {text.charAt(0).toUpperCase() + text.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Title/Subject',
      key: 'title',
      render: (record: BugItem) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.subject || record.name || record.text?.substring(0, 50) || 'No title'}
          </div>
          {record.text && record.text.length > 50 && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.text.substring(0, 100)}...
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (text: string) => (
        <Tag color={priorityColors[text as keyof typeof priorityColors] || 'default'}>
          {text || 'Unknown'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: BugItem) => (
        <Tag color="green">
          {record.state || record.status || 'Unknown'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: BugItem) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetails(record)}
            size="small"
          />
          <Button 
            type="text" 
            icon={<LinkOutlined />} 
            onClick={() => handleLinkBugs(record)}
            size="small"
          />
        </Space>
      ),
    },
  ];

  return (
    <BugListContainer>
      {/* Filters */}
      <FilterCard title="Filters">
        <Space wrap>
          <Search
            placeholder="Search tickets, subjects, or text..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            value={selectedPriority}
            onChange={setSelectedPriority}
            placeholder="Priority"
            style={{ width: 120 }}
          >
            <Option value="all">All Priorities</Option>
            <Option value="High">High</Option>
            <Option value="Medium">Medium</Option>
            <Option value="Low">Low</Option>
            <Option value="Critical">Critical</Option>
            <Option value="Unknown">Unknown</Option>
          </Select>
          <Select
            value={selectedSource}
            onChange={setSelectedSource}
            placeholder="Source"
            style={{ width: 120 }}
          >
            <Option value="all">All Sources</Option>
            <Option value="slack">Slack</Option>
            <Option value="zendesk">Zendesk</Option>
            <Option value="shortcut">Shortcut</Option>
          </Select>
          <Select
            value={selectedState}
            onChange={setSelectedState}
            placeholder="Status"
            style={{ width: 150 }}
          >
            <Option value="all">All Statuses</Option>
            <Option value="open">Open</Option>
            <Option value="closed">Closed</Option>
            <Option value="In Progress">In Progress</Option>
            <Option value="Ready for QA">Ready for QA</Option>
            <Option value="Blocked">Blocked</Option>
          </Select>
          <RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                const [start, end] = dates;
                setTimeRange([
                  start.format('YYYY-MM-DD'),
                  end.format('YYYY-MM-DD')
                ]);
              } else {
                setTimeRange(null);
              }
            }}
            placeholder={['Start Date', 'End Date']}
          />
          <Button 
            icon={<FilterOutlined />} 
            onClick={fetchBugs}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </FilterCard>

      {/* Bug Table */}
      <BugTableCard title={`Bug List (${filteredBugs.length} items)`}>
        <Table
          columns={columns}
          dataSource={filteredBugs}
          rowKey="SK"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </BugTableCard>

      {/* Detail Modal */}
      <Modal
        title="Bug Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedBug && (
          <div>
            <h3>Ticket ID: {selectedBug.PK || 'N/A'}</h3>
            <p><strong>Source:</strong> {selectedBug.sourceSystem || 'N/A'}</p>
            <p><strong>Created:</strong> {selectedBug.createdAt ? new Date(selectedBug.createdAt).toLocaleString() : 'N/A'}</p>
            <p><strong>Updated:</strong> {selectedBug.updatedAt ? new Date(selectedBug.updatedAt).toLocaleString() : 'N/A'}</p>
            {selectedBug.priority && <p><strong>Priority:</strong> {selectedBug.priority}</p>}
            {selectedBug.state && <p><strong>State:</strong> {selectedBug.state}</p>}
            {selectedBug.state_id && selectedBug.sourceSystem === 'shortcut' && <p><strong>State ID:</strong> {safeRender(selectedBug.state_id)}</p>}
            {selectedBug.status && <p><strong>Status:</strong> {selectedBug.status}</p>}
            {selectedBug.subject && <p><strong>Subject:</strong> {selectedBug.subject}</p>}
            {selectedBug.name && <p><strong>Name:</strong> {selectedBug.name}</p>}
            {selectedBug.text && (
              <div>
                <strong>Text:</strong>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '10px', 
                  marginTop: '5px',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {safeRender(selectedBug.text)}
                </div>
              </div>
            )}
            {selectedBug.author && <p><strong>Author:</strong> {safeRender(selectedBug.author)}</p>}
            {selectedBug.author_id && selectedBug.sourceSystem === 'slack' && <p><strong>Author ID:</strong> {safeRender(selectedBug.author_id)}</p>}
            {selectedBug.requester && <p><strong>Requester:</strong> {safeRender(selectedBug.requester)}</p>}
            {selectedBug.assignee && <p><strong>Assignee:</strong> {safeRender(selectedBug.assignee)}</p>}
          </div>
        )}
      </Modal>

      {/* Link Modal */}
      <Modal
        title="Link Bugs"
        open={linkModalVisible}
        onOk={handleLinkSubmit}
        onCancel={() => setLinkModalVisible(false)}
        okText="Link"
        cancelText="Cancel"
      >
        <div>
          <p><strong>Old Ticket ID:</strong> {linkForm.oldTicketId}</p>
          <p><strong>New Ticket ID:</strong></p>
          <Input
            value={linkForm.newTicketId}
            onChange={(e) => setLinkForm({ ...linkForm, newTicketId: e.target.value })}
            placeholder="Enter new ticket ID (e.g., ZD-12345)"
          />
        </div>
      </Modal>
    </BugListContainer>
  );
};

export default BugList;

