import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tag, Space, Button, Input, Select, DatePicker, Modal, message } from 'antd';
import { SearchOutlined, FilterOutlined, LinkOutlined, EyeOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import type { SortOrder } from 'antd/es/table/interface';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Helper function to safely render values that might be objects
// Version: 1.0.1 - Debugging filtering issues
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
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #e8e8e8;
  
  .ant-card-body {
    padding: 24px;
  }
`;

const BugTableCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 1px solid #e8e8e8;
  
  .ant-card-body {
    padding: 0;
  }
  
  .modern-table {
    .ant-table-thead > tr > th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
      font-size: 14px;
      border: none;
      text-align: center;
      padding: 16px 12px;
    }
    
    .ant-table-tbody > tr {
      transition: all 0.2s ease;
      
      &:hover {
        background: #f0f7ff !important;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      &.table-row.even {
        background: #fafafa;
      }
      
      &.table-row.odd {
        background: #ffffff;
      }
      
      td {
        padding: 12px;
        border-bottom: 1px solid #f0f0f0;
        vertical-align: middle;
      }
    }
    
    .ant-table-pagination {
      padding: 16px 24px;
      background: #fafafa;
      border-top: 1px solid #f0f0f0;
    }
  }
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
  apiGatewayUrl = 'https://1kvgw5h1qb.execute-api.us-west-2.amazonaws.com/evt-bugtracker/query-bugs'
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
    Unknown: 'default',
    // Shortcut custom priorities
    'P0 Critical': 'red',
    'P1 High': 'red',
    'P2 Medium': 'orange',
    'P3 Low': 'green',
    'P4 Lowest': 'blue',
    'Not Set': 'default'
  };

  const sourceColors = {
    slack: 'purple',
    zendesk: 'blue',
    shortcut: 'cyan'
  };

  const fetchBugs = useCallback(async () => {
    try {
      setLoading(true);
      
      // Clear existing bugs when changing source filter
      setBugs([]);
      setFilteredBugs([]);
      
      // IMPROVED: Fetch only selected source when filtering, all sources when showing all
      let allBugs: BugItem[] = [];
      const sourcesToFetch = selectedSource === 'all' ? ['slack', 'zendesk', 'shortcut'] : [selectedSource];

      console.log(`🔍 FETCHING DATA - Selected source filter: "${selectedSource}"`);
      console.log(`📋 Sources to fetch: [${sourcesToFetch.join(', ')}]`);

      for (const source of sourcesToFetch) {
        const params = new URLSearchParams({
          query_type: 'by_source',
          source_system: source
        });
        if (timeRange) {
          params.append('start_date', timeRange[0]);
          params.append('end_date', timeRange[1]);
          console.log(`Adding date filter: start_date=${timeRange[0]}, end_date=${timeRange[1]}`);
        }
        
        try {
          const response = await fetch(`${apiGatewayUrl}?${params.toString()}&_t=${Date.now()}`, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`📊 API Response for ${source}:`, {
              hasItems: !!result.items,
              itemCount: result.items?.length || 0,
              sample: result.items?.slice(0, 2).map((item: any) => ({
                id: item.PK,
                sourceSystem: item.sourceSystem
              }))
            });

            if (result.items) {
              allBugs = [...allBugs, ...result.items];
            }
          } else {
            console.error(`❌ Failed to fetch ${source}:`, response.status);
          }
        } catch (error) {
          console.error(`❌ Error fetching ${source}:`, error);
        }
      }

      console.log(`📈 FINAL SUMMARY:`, {
        totalFetched: allBugs.length,
        selectedFilter: selectedSource,
        distribution: {
          slack: allBugs.filter(b => b.sourceSystem === 'slack').length,
          zendesk: allBugs.filter(b => b.sourceSystem === 'zendesk').length,
          shortcut: allBugs.filter(b => b.sourceSystem === 'shortcut').length,
          unknown: allBugs.filter(b => !b.sourceSystem || !['slack', 'zendesk', 'shortcut'].includes(b.sourceSystem)).length
        }
      });

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
    // Reset other filters when source changes
    setSearchText('');
    setSelectedPriority('all');
    setSelectedState('all');
  }, [timeRange, selectedSource, fetchBugs]);

  useEffect(() => {
    // Apply filters
    let filtered = bugs;

    // DEBUG: Check what Slack records we're getting
    const slackRecords = filtered.filter(bug => bug.sourceSystem === 'slack');
    if (slackRecords.length > 0) {
      console.log(`📋 Found ${slackRecords.length} Slack records`);
      console.log('🔍 Sample Slack records:', slackRecords.slice(0, 3).map(bug => ({
        id: bug.PK,
        subject: bug.subject?.substring(0, 50),
        textPreview: bug.text?.substring(0, 100),
        hasAuthor: bug.text?.toUpperCase?.().includes?.('AUTHOR') || false
      })));
    }

    // Debug: Log Shortcut bugs to see their structure
    const shortcutBugs = filtered.filter(bug => bug.sourceSystem === 'shortcut');
    if (shortcutBugs.length > 0) {
      console.log('Shortcut bugs data structure:', shortcutBugs.slice(0, 2));
    }

    // SIMPLIFIED Source filter - since we now fetch only the selected source from API
    console.log('🎯 FILTERING - Current selectedSource:', selectedSource);
    console.log('📊 BEFORE FILTERING - Total bugs:', bugs.length);
    
    // Count bugs by source for debugging
    const sourceCounts = {
      slack: bugs.filter(b => b.sourceSystem === 'slack').length,
      zendesk: bugs.filter(b => b.sourceSystem === 'zendesk').length,
      shortcut: bugs.filter(b => b.sourceSystem === 'shortcut').length,
      other: bugs.filter(b => b.sourceSystem && !['slack', 'zendesk', 'shortcut'].includes(b.sourceSystem)).length,
      null: bugs.filter(b => !b.sourceSystem).length,
    };
    console.log('📈 Source distribution:', sourceCounts);
    
    // Since we fetch only the selected source from API, minimal client-side filtering needed
    // Only apply source filter if selectedSource is 'all' and we have mixed data
    if (selectedSource !== 'all') {
      const beforeFilter = filtered.length;
      
      // Sanity check: alert if wrong source data is present
      const wrongSourceRecords = filtered.filter(bug => {
        const bugSource = (bug.sourceSystem || '').toString().toLowerCase().trim();
        const filterSource = selectedSource.toLowerCase().trim();
        return bugSource !== filterSource;
      });
      
      if (wrongSourceRecords.length > 0) {
        console.error('🚨 UNEXPECTED: Wrong source records found when filtering for', selectedSource);
        console.error('🔍 Wrong source records:', wrongSourceRecords.slice(0, 3).map(b => ({
          id: b.PK,
          expected: selectedSource,
          actual: b.sourceSystem
        })));
        
        // Filter out wrong source records as backup
        filtered = filtered.filter(bug => {
          const bugSource = (bug.sourceSystem || '').toString().toLowerCase().trim();
          const filterSource = selectedSource.toLowerCase().trim();
          return bugSource === filterSource;
        });
        
        console.log(`⚠️ BACKUP FILTER: ${beforeFilter} → ${filtered.length} items (removed ${wrongSourceRecords.length} wrong source records)`);
      } else {
        console.log(`✅ ALL RECORDS MATCH SOURCE: ${filtered.length} items for ${selectedSource}`);
      }
    }

    // Search filter
    if (searchText) {
      filtered = filtered.filter(bug => 
        (bug.PK || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (bug.subject || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (bug.text || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (bug.name || '').toLowerCase().includes(searchText.toLowerCase())
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
  }, [bugs, searchText, selectedPriority, selectedState, selectedSource]);

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

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    console.log('Table change:', { pagination, filters, sorter });
    // Ant Design handles sorting internally when sorter: true is used
  };

  const columns = [
    {
      title: 'Ticket ID',
      dataIndex: 'PK',
      key: 'PK',
      sorter: (a: BugItem, b: BugItem) => (a.PK || '').localeCompare(b.PK || ''),
      sortDirections: ['ascend', 'descend'] as SortOrder[],
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
      sorter: (a: BugItem, b: BugItem) => (a.sourceSystem || '').localeCompare(b.sourceSystem || ''),
      sortDirections: ['ascend', 'descend'] as SortOrder[],
      render: (text: string) => (
        <Tag color={sourceColors[text as keyof typeof sourceColors] || 'default'}>
          {text.charAt(0).toUpperCase() + text.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Title/Subject',
      key: 'title',
      sorter: (a: BugItem, b: BugItem) => {
        const aTitle = (a.subject || a.name || a.text || '').toLowerCase();
        const bTitle = (b.subject || b.name || b.text || '').toLowerCase();
        return aTitle.localeCompare(bTitle);
      },
      sortDirections: ['ascend', 'descend'] as SortOrder[],
      render: (record: BugItem) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {(record?.subject || record?.name || record?.text?.substring(0, 50) || 'No title')}
          </div>
          {record?.text && record.text.length > 50 && (
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
      sorter: (a: BugItem, b: BugItem) => {
        const priorityOrder = { 
          'P0 Critical': 0, 'Critical': 0,
          'P1 High': 1, 'High': 1,
          'P2 Medium': 2, 'Medium': 2,
          'P3 Low': 3, 'Low': 3,
          'P4 Lowest': 4,
          'Not Set': 5, 'Unknown': 5
        };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 5;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 5;
        return aPriority - bPriority;
      },
      sortDirections: ['ascend', 'descend'] as SortOrder[],
      render: (text: string, record: BugItem) => {
        const isCriticalWithoutOwner = text === 'P0 Critical' && 
          (!record.assignee || record.assignee === 'Unassigned' || record.assignee === 'Not Set');
        
        return (
          <Space>
            <Tag color={priorityColors[text as keyof typeof priorityColors] || 'default'}>
              {text || 'Unknown'}
            </Tag>
            {isCriticalWithoutOwner && (
              <span style={{ color: '#ff4d4f', fontSize: '16px' }} title="Critical bug without owner - needs attention!">
                🔥
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      sorter: (a: BugItem, b: BugItem) => {
        const aStatus = (a.state || a.status || 'Unknown').toLowerCase();
        const bStatus = (b.state || b.status || 'Unknown').toLowerCase();
        return aStatus.localeCompare(bStatus);
      },
      sortDirections: ['ascend', 'descend'] as SortOrder[],
      render: (record: BugItem) => (
        <Tag color="green">
          {(record?.state || record?.status || 'Unknown')}
        </Tag>
      ),
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      sorter: (a: BugItem, b: BugItem) => (a.assignee || '').localeCompare(b.assignee || ''),
      sortDirections: ['ascend', 'descend'] as SortOrder[],
      render: (text: string, record: BugItem) => {
        const isCriticalWithoutOwner = record.priority === 'P0 Critical' && 
          (!text || text === 'Unassigned' || text === 'Not Set');
        
        return (
          <Space>
            <span>{text || 'Unassigned'}</span>
            {isCriticalWithoutOwner && (
              <span style={{ color: '#ff4d4f', fontSize: '16px' }} title="Critical bug without owner - needs attention!">
                🔥
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a: BugItem, b: BugItem) => {
        const aDate = new Date(a.createdAt || '').getTime();
        const bDate = new Date(b.createdAt || '').getTime();
        return aDate - bDate;
      },
      sortDirections: ['ascend', 'descend'] as SortOrder[],
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
            <Option value="P0 Critical">P0 Critical</Option>
            <Option value="P1 High">P1 High</Option>
            <Option value="P2 Medium">P2 Medium</Option>
            <Option value="P3 Low">P3 Low</Option>
            <Option value="P4 Lowest">P4 Lowest</Option>
            <Option value="High">High</Option>
            <Option value="Medium">Medium</Option>
            <Option value="Low">Low</Option>
            <Option value="Critical">Critical</Option>
            <Option value="Not Set">Not Set</Option>
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
          onChange={handleTableChange}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} items`,
            size: 'default',
            style: { padding: '16px 0' }
          }}
          scroll={{ x: 1400 }}
          size="middle"
          className="modern-table"
          style={{
            background: '#fff',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
          rowClassName={(record, index) => 
            `table-row ${index % 2 === 0 ? 'even' : 'odd'}`
          }
        />
      </BugTableCard>

      {/* Detail Modal */}
      <Modal
        title="Bug Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
        className="bug-detail-modal"
      >
        {selectedBug && (
          <div style={{ color: '#f0f6fc' }}>
            <h3 style={{ color: '#f0f6fc', marginBottom: '16px' }}>Ticket ID: {selectedBug.PK || 'N/A'}</h3>
            <p style={{ color: '#f0f6fc', marginBottom: '8px' }}><strong>Source:</strong> {selectedBug.sourceSystem || 'N/A'}</p>
            <p style={{ color: '#f0f6fc', marginBottom: '8px' }}><strong>Created:</strong> {selectedBug.createdAt ? new Date(selectedBug.createdAt).toLocaleString() : 'N/A'}</p>
            <p style={{ color: '#f0f6fc', marginBottom: '8px' }}><strong>Updated:</strong> {selectedBug.updatedAt ? new Date(selectedBug.updatedAt).toLocaleString() : 'N/A'}</p>
            {selectedBug.priority && <p style={{ color: '#f0f6fc', marginBottom: '8px' }}><strong>Priority:</strong> {selectedBug.priority}</p>}
            {selectedBug.state && <p style={{ color: '#f0f6fc', marginBottom: '8px' }}><strong>State:</strong> {selectedBug.state}</p>}
            {selectedBug.state_id && selectedBug.sourceSystem === 'shortcut' && <p style={{ color: '#f0f6fc', marginBottom: '8px' }}><strong>State ID:</strong> {safeRender(selectedBug.state_id)}</p>}
            {selectedBug.status && <p style={{ color: '#f0f6fc', marginBottom: '8px' }}><strong>Status:</strong> {selectedBug.status}</p>}
            {selectedBug.subject && <p style={{ color: '#f0f6fc', marginBottom: '8px' }}><strong>Subject:</strong> {selectedBug.subject}</p>}
            {selectedBug.name && <p style={{ color: '#f0f6fc', marginBottom: '8px' }}><strong>Name:</strong> {selectedBug.name}</p>}
            {selectedBug.text && (
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#f0f6fc' }}>Text:</strong>
                <div style={{ 
                  background: '#21262d', 
                  border: '1px solid #30363d',
                  padding: '12px', 
                  marginTop: '8px',
                  borderRadius: '6px',
                  whiteSpace: 'pre-wrap',
                  color: '#f0f6fc',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  fontFamily: 'Monaco, "Courier New", monospace'
                }}>
                  {safeRender(selectedBug.text)}
                </div>
              </div>
            )}
            {selectedBug.author && <p style={{ color: '#f0f6fc', marginBottom: '8px' }}><strong>Author:</strong> {safeRender(selectedBug.author)}</p>}
            {selectedBug.author_id && selectedBug.sourceSystem === 'slack' && <p style={{ color: '#f0f6fc', marginBottom: '8px' }}><strong>Author ID:</strong> {safeRender(selectedBug.author_id)}</p>}
            {selectedBug.requester && <p style={{ color: '#f0f6fc', marginBottom: '8px' }}><strong>Requester:</strong> {safeRender(selectedBug.requester)}</p>}
            {selectedBug.assignee && <p style={{ color: '#f0f6fc', marginBottom: '8px' }}><strong>Assignee:</strong> {safeRender(selectedBug.assignee)}</p>}
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

