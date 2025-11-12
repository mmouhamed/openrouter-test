/**
 * Shared health check service to prevent multiple simultaneous calls
 */

interface HealthStatus {
  health: 'good' | 'degraded' | 'critical';
  timestamp: number;
}

class HealthCheckService {
  private static instance: HealthCheckService;
  private cache: HealthStatus | null = null;
  private pendingRequest: Promise<HealthStatus> | null = null;
  private readonly CACHE_DURATION = 5000; // 5 seconds

  static getInstance(): HealthCheckService {
    if (!this.instance) {
      this.instance = new HealthCheckService();
    }
    return this.instance;
  }

  private isCacheValid(): boolean {
    return this.cache !== null && 
           (Date.now() - this.cache.timestamp) < this.CACHE_DURATION;
  }

  async getHealth(): Promise<'good' | 'degraded' | 'critical'> {
    // Return cached result if valid
    if (this.isCacheValid()) {
      return this.cache!.health;
    }

    // If there's already a pending request, wait for it
    if (this.pendingRequest) {
      const result = await this.pendingRequest;
      return result.health;
    }

    // Make new request
    this.pendingRequest = this.fetchHealth();
    
    try {
      const result = await this.pendingRequest;
      this.cache = result;
      return result.health;
    } finally {
      this.pendingRequest = null;
    }
  }

  private async fetchHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch('/api/chat?action=health');
      const data = await response.json();
      return {
        health: data.health,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      return {
        health: 'critical',
        timestamp: Date.now()
      };
    }
  }
}

export const healthCheckService = HealthCheckService.getInstance();