import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  success: boolean;
  summary?: {
    total_bugs: number;
    by_priority: Record<string, number>;
    by_state: Record<string, number>;
    by_source: Record<string, number>;
  };
  time_series?: Array<{
    date: string;
    count: number;
  }>;
  items?: Array<any>;
  error?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { query_type } = req.body || req.query;

  if (!query_type) {
    res.status(400).json({
      success: false,
      error: 'Missing query_type parameter'
    });
    return;
  }

  if (query_type === 'summary') {
    // Mock summary data
    res.status(200).json({
      success: true,
      summary: {
        total_bugs: 42,
        by_priority: {
          High: 8,
          Medium: 15,
          Low: 12,
          Critical: 3,
          Unknown: 4
        },
        by_state: {
          'open': 20,
          'closed': 12,
          'In Progress': 8,
          'Ready for QA': 2
        },
        by_source: {
          slack: 15,
          zendesk: 18,
          shortcut: 9
        }
      }
    });
  } else if (query_type === 'time_series') {
    // Mock time series data
    const timeSeries = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      timeSeries.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 1
      });
    }
    
    res.status(200).json({
      success: true,
      time_series: timeSeries
    });
  } else if (query_type === 'by_source') {
    // Mock source data
    const mockItems = [
      {
        PK: 'ZD-12345',
        SK: 'zendesk#12345',
        sourceSystem: 'zendesk',
        priority: 'High',
        status: 'open',
        subject: 'Login page not working',
        createdAt: '2024-08-30T10:00:00Z',
        updatedAt: '2024-08-30T10:00:00Z'
      },
      {
        PK: 'SL-9876543210.12345',
        SK: 'slack#9876543210.12345',
        sourceSystem: 'slack',
        priority: 'Medium',
        text: 'Users reporting slow performance on mobile app',
        author: 'john.doe',
        createdAt: '2024-08-30T14:30:00Z',
        updatedAt: '2024-08-30T14:30:00Z'
      },
      {
        PK: 'SC-56789',
        SK: 'shortcut#56789',
        sourceSystem: 'shortcut',
        priority: 'Low',
        state: 'In Progress',
        name: 'Fix navigation menu alignment',
        createdAt: '2024-08-29T09:15:00Z',
        updatedAt: '2024-08-30T16:45:00Z'
      }
    ];

    res.status(200).json({
      success: true,
      items: mockItems
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Invalid query_type'
    });
  }
}
