import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Helper function to convert DynamoDB format to plain objects
function convertDynamoDBItem(item: any): any {
  const converted: any = {};
  
  for (const [key, value] of Object.entries(item)) {
    if (value && typeof value === 'object') {
      if ('S' in value) {
        converted[key] = value.S;
      } else if ('N' in value) {
        converted[key] = parseFloat(value.N as string);
      } else if ('BOOL' in value) {
        converted[key] = value.BOOL;
      } else if ('L' in value) {
        converted[key] = (value.L as any[]).map((item: any) => convertDynamoDBItem(item));
      } else if ('M' in value) {
        converted[key] = convertDynamoDBItem(value.M as any);
      } else {
        converted[key] = value;
      }
    } else {
      converted[key] = value;
    }
  }
  
  return converted;
}

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

export default async function handler(
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

  try {
    const { query_type } = req.query;

    if (query_type === 'summary') {
      // Get source filter if provided
      const source_system = req.query.source_system as string;
      const start_date = req.query.start_date as string;
      const end_date = req.query.end_date as string;
      
      // Use AWS CLI to scan DynamoDB table
      let command = 'aws dynamodb scan --table-name BugTracker-dev --profile AdministratorAccess12hr-100142810612 --region us-west-2 --output json';
      
      // Apply source filter if specified
      if (source_system && source_system !== 'all') {
        command = `aws dynamodb scan --table-name BugTracker-dev --filter-expression "sourceSystem = :source" --expression-attribute-values '{":source":{"S":"${source_system}"}}' --profile AdministratorAccess12hr-100142810612 --region us-west-2 --output json`;
      }
      
      const { stdout } = await execAsync(command);
      
      const response = JSON.parse(stdout);
      const items = response.Items || [];

      // Apply date filtering if provided
      let filteredItems = items;
      if (start_date && end_date) {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        
        filteredItems = items.filter((item: any) => {
          const convertedItem = convertDynamoDBItem(item);
          const created_at = new Date(convertedItem.createdAt);
          return created_at >= startDate && created_at <= endDate;
        });
      }

      // Calculate summary statistics
      const total_bugs = filteredItems.length;
      const by_priority: Record<string, number> = {};
      const by_state: Record<string, number> = {};
      const by_source: Record<string, number> = {};

      for (const item of filteredItems as any[]) {
        // Convert DynamoDB format to plain object
        const convertedItem = convertDynamoDBItem(item);
        
        // Priority distribution
        const priority = convertedItem.priority || 'Unknown';
        by_priority[priority] = (by_priority[priority] || 0) + 1;

        // State/Status distribution
        const state = convertedItem.state || convertedItem.status || 'Unknown';
        by_state[state] = (by_state[state] || 0) + 1;

        // Source distribution
        const source = convertedItem.sourceSystem || 'Unknown';
        by_source[source] = (by_source[source] || 0) + 1;
      }

      res.status(200).json({
        success: true,
        summary: {
          total_bugs,
          by_priority,
          by_state,
          by_source
        }
      });
    } else if (query_type === 'time_series') {
      // Get source filter if provided
      const source_system = req.query.source_system as string;
      const start_date = req.query.start_date as string;
      const end_date = req.query.end_date as string;
      const days = req.query.days as string;
      
      // Use AWS CLI to scan DynamoDB table
      let command = 'aws dynamodb scan --table-name BugTracker-dev --profile AdministratorAccess12hr-100142810612 --region us-west-2 --output json';
      
      // Apply source filter if specified
      if (source_system && source_system !== 'all') {
        command = `aws dynamodb scan --table-name BugTracker-dev --filter-expression "sourceSystem = :source" --expression-attribute-values '{":source":{"S":"${source_system}"}}' --profile AdministratorAccess12hr-100142810612 --region us-west-2 --output json`;
      }
      
      const { stdout } = await execAsync(command);
      
      const response = JSON.parse(stdout);
      const items = response.Items || [];

      // Determine date range
      let end_date_obj = new Date();
      let start_date_obj: Date;
      
      if (start_date && end_date) {
        // Use provided date range
        start_date_obj = new Date(start_date);
        end_date_obj = new Date(end_date);
      } else {
        // Use default range based on days parameter
        const daysToSubtract = parseInt(days) || 7;
        start_date_obj = new Date(end_date_obj.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
      }

      // Apply date filtering
      const filteredItems = items.filter((item: any) => {
        const convertedItem = convertDynamoDBItem(item);
        const created_at = new Date(convertedItem.createdAt);
        return created_at >= start_date_obj && created_at <= end_date_obj;
      });

      // Group by date
      const daily_counts: Record<string, number> = {};
      for (const item of filteredItems as any[]) {
        const convertedItem = convertDynamoDBItem(item);
        const created_at = new Date(convertedItem.createdAt);
        const date_str = created_at.toISOString().split('T')[0];
        daily_counts[date_str] = (daily_counts[date_str] || 0) + 1;
      }

      // Fill in missing dates with 0
      const time_series = [];
      const current_date = new Date(start_date_obj);
      while (current_date <= end_date_obj) {
        const date_str = current_date.toISOString().split('T')[0];
        time_series.push({
          date: date_str,
          count: daily_counts[date_str] || 0
        });
        current_date.setDate(current_date.getDate() + 1);
      }

      res.status(200).json({
        success: true,
        time_series
      });
    } else if (query_type === 'by_source') {
      // Get bugs by source system
      const source_system = req.query.source_system as string;

      let command;
      if (source_system === 'all' || !source_system) {
        command = 'aws dynamodb scan --table-name BugTracker-dev --profile AdministratorAccess12hr-100142810612 --region us-west-2 --output json';
      } else {
        command = `aws dynamodb scan --table-name BugTracker-dev --filter-expression "sourceSystem = :source" --expression-attribute-values '{":source":{"S":"${source_system}"}}' --profile AdministratorAccess12hr-100142810612 --region us-west-2 --output json`;
      }

      const { stdout } = await execAsync(command);
      const response = JSON.parse(stdout);

      // Convert DynamoDB items to plain objects
      const convertedItems = (response.Items || []).map(convertDynamoDBItem);

      res.status(200).json({
        success: true,
        items: convertedItems
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid query_type'
      });
    }
  } catch (error) {
    console.error('Error querying DynamoDB:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred'
    });
  }
}
