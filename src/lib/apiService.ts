import { config, apiEndpoints } from './config';

export interface BugQueryParams {
  query_type: 'by_ticket_id' | 'by_priority' | 'by_state' | 'by_source' | 'summary' | 'time_series';
  params?: Record<string, any>;
  time_range?: {
    start_date: string;
    end_date: string;
  };
}

export interface BugLinkParams {
  action: 'link_bugs' | 'create_synthetic_link';
  old_ticket_id: string;
  new_ticket_id: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.apiGatewayUrl;
    this.timeout = config.timeout;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Query bugs with various filters
  async queryBugs(params: BugQueryParams): Promise<ApiResponse> {
    return this.makeRequest(apiEndpoints.queryBugs, {
      method: 'GET',
      body: JSON.stringify(params),
    });
  }

  // Link bugs manually
  async linkBugs(params: BugLinkParams): Promise<ApiResponse> {
    return this.makeRequest(apiEndpoints.linkBugs, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Get bug summary statistics
  async getBugSummary(timeRange?: { start_date: string; end_date: string }): Promise<ApiResponse> {
    return this.queryBugs({
      query_type: 'summary',
      time_range: timeRange,
    });
  }

  // Get bugs by priority
  async getBugsByPriority(
    priority: string,
    timeRange?: { start_date: string; end_date: string }
  ): Promise<ApiResponse> {
    return this.queryBugs({
      query_type: 'by_priority',
      params: { priority },
      time_range: timeRange,
    });
  }

  // Get bugs by state
  async getBugsByState(
    state: string,
    timeRange?: { start_date: string; end_date: string }
  ): Promise<ApiResponse> {
    return this.queryBugs({
      query_type: 'by_state',
      params: { state },
      time_range: timeRange,
    });
  }

  // Get bugs by source system
  async getBugsBySource(
    sourceSystem: string,
    timeRange?: { start_date: string; end_date: string }
  ): Promise<ApiResponse> {
    return this.queryBugs({
      query_type: 'by_source',
      params: { source_system: sourceSystem },
      time_range: timeRange,
    });
  }

  // Get time series data
  async getTimeSeriesData(days: number = 7): Promise<ApiResponse> {
    return this.queryBugs({
      query_type: 'time_series',
      params: { days },
    });
  }

  // Get bugs by ticket ID
  async getBugsByTicketId(ticketId: string): Promise<ApiResponse> {
    return this.queryBugs({
      query_type: 'by_ticket_id',
      params: { ticket_id: ticketId },
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.makeRequest('/health', {
      method: 'GET',
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
