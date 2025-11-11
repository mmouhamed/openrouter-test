'use client';

/**
 * Web Search Engine - Real-time Information Retrieval
 * 
 * Features:
 * - Multiple search providers integration
 * - Intelligent query optimization
 * - Result relevance scoring
 * - Content summarization
 * - Real-time fact verification
 */

export interface SearchProvider {
  name: string;
  endpoint: string;
  apiKey?: string;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  capabilities: {
    webSearch: boolean;
    newsSearch: boolean;
    imageSearch: boolean;
    academicSearch: boolean;
  };
}

export interface SearchQuery {
  query: string;
  type: 'general' | 'news' | 'academic' | 'technical' | 'current_events';
  timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year';
  language?: string;
  region?: string;
  maxResults?: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishDate?: Date;
  source: string;
  relevanceScore: number;
  trustScore: number;
  type: 'web' | 'news' | 'academic' | 'wikipedia' | 'official';
  metadata: {
    author?: string;
    domain: string;
    wordCount?: number;
    imageCount?: number;
    hasVideo?: boolean;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  query: SearchQuery;
  suggestions?: string[];
  relatedQueries?: string[];
  qualityScore: number;
}

export class WebSearchEngine {
  private providers: Map<string, SearchProvider> = new Map();
  private rateLimiters: Map<string, { requests: number; resetTime: number }> = new Map();
  private cache: Map<string, { result: SearchResponse; timestamp: number }> = new Map();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize search providers
   */
  private initializeProviders(): void {
    // SerpAPI Google Search
    this.providers.set('serpapi', {
      name: 'SerpAPI',
      endpoint: 'https://serpapi.com/search',
      rateLimits: { requestsPerMinute: 100, requestsPerDay: 5000 },
      capabilities: {
        webSearch: true,
        newsSearch: true,
        imageSearch: true,
        academicSearch: false
      }
    });

    // Bing Search API
    this.providers.set('bing', {
      name: 'Bing Search',
      endpoint: 'https://api.bing.microsoft.com/v7.0/search',
      rateLimits: { requestsPerMinute: 20, requestsPerDay: 1000 },
      capabilities: {
        webSearch: true,
        newsSearch: true,
        imageSearch: true,
        academicSearch: false
      }
    });

    // Perplexity AI (for enhanced search)
    this.providers.set('perplexity', {
      name: 'Perplexity AI',
      endpoint: 'https://api.perplexity.ai/search',
      rateLimits: { requestsPerMinute: 60, requestsPerDay: 2000 },
      capabilities: {
        webSearch: true,
        newsSearch: true,
        imageSearch: false,
        academicSearch: true
      }
    });

    // DuckDuckGo Instant Answer API (free)
    this.providers.set('duckduckgo', {
      name: 'DuckDuckGo',
      endpoint: 'https://api.duckduckgo.com',
      rateLimits: { requestsPerMinute: 30, requestsPerDay: 1000 },
      capabilities: {
        webSearch: true,
        newsSearch: false,
        imageSearch: false,
        academicSearch: false
      }
    });
  }

  /**
   * Perform intelligent web search
   */
  async search(query: SearchQuery): Promise<SearchResponse> {
    const cacheKey = this.generateCacheKey(query);
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    let allResults: SearchResult[] = [];
    let totalResults = 0;

    try {
      // Optimize query for better results
      const optimizedQuery = this.optimizeQuery(query);
      
      // Select best provider(s) for this query
      const selectedProviders = this.selectProvidersForQuery(optimizedQuery);
      
      // Execute searches in parallel
      const searchPromises = selectedProviders.map(provider => 
        this.searchWithProvider(provider, optimizedQuery)
      );

      const providerResults = await Promise.allSettled(searchPromises);
      
      // Combine and process results
      providerResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          allResults.push(...result.value.results);
          totalResults += result.value.totalResults;
        }
      });

      // Deduplicate and rank results
      const processedResults = this.processAndRankResults(allResults, query);
      
      // Generate related queries and suggestions
      const suggestions = this.generateSuggestions(query, processedResults);
      const relatedQueries = this.generateRelatedQueries(query, processedResults);

      const searchResponse: SearchResponse = {
        results: processedResults.slice(0, query.maxResults || 10),
        totalResults,
        searchTime: Date.now() - startTime,
        query: optimizedQuery,
        suggestions,
        relatedQueries,
        qualityScore: this.calculateQualityScore(processedResults)
      };

      // Cache the result
      this.cacheResult(cacheKey, searchResponse);
      
      return searchResponse;

    } catch (error) {
      console.error('Search failed:', error);
      
      // Return fallback response
      return {
        results: [],
        totalResults: 0,
        searchTime: Date.now() - startTime,
        query,
        qualityScore: 0
      };
    }
  }

  /**
   * Search with a specific provider
   */
  private async searchWithProvider(
    providerName: string, 
    query: SearchQuery
  ): Promise<{ results: SearchResult[]; totalResults: number } | null> {
    const provider = this.providers.get(providerName);
    if (!provider) return null;

    // Check rate limits
    if (!this.checkRateLimit(providerName)) {
      console.warn(`Rate limit exceeded for provider: ${providerName}`);
      return null;
    }

    try {
      switch (providerName) {
        case 'serpapi':
          return await this.searchWithSerpAPI(query);
        case 'bing':
          return await this.searchWithBing(query);
        case 'perplexity':
          return await this.searchWithPerplexity(query);
        case 'duckduckgo':
          return await this.searchWithDuckDuckGo(query);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Search failed with provider ${providerName}:`, error);
      return null;
    }
  }

  /**
   * SerpAPI Google Search implementation
   */
  private async searchWithSerpAPI(query: SearchQuery): Promise<{ results: SearchResult[]; totalResults: number }> {
    const apiKey = process.env.NEXT_PUBLIC_SERPAPI_KEY;
    if (!apiKey) {
      throw new Error('SerpAPI key not configured');
    }

    const params = new URLSearchParams({
      engine: 'google',
      q: query.query,
      api_key: apiKey,
      num: Math.min(query.maxResults || 10, 20).toString(),
      hl: query.language || 'en',
      gl: query.region || 'us'
    });

    if (query.timeframe) {
      params.append('tbs', this.convertTimeframeToPeriod(query.timeframe));
    }

    const response = await fetch(`https://serpapi.com/search?${params}`);
    const data = await response.json();

    const results: SearchResult[] = (data.organic_results || []).map((item: any) => ({
      title: item.title || '',
      url: item.link || '',
      snippet: item.snippet || '',
      source: 'Google',
      relevanceScore: this.calculateRelevanceScore(item, query),
      trustScore: this.calculateTrustScore(item.link),
      type: 'web' as const,
      metadata: {
        domain: new URL(item.link || 'https://example.com').hostname,
        wordCount: item.snippet?.split(' ').length || 0
      }
    }));

    return {
      results,
      totalResults: data.search_information?.total_results || results.length
    };
  }

  /**
   * Bing Search API implementation
   */
  private async searchWithBing(query: SearchQuery): Promise<{ results: SearchResult[]; totalResults: number }> {
    const apiKey = process.env.NEXT_PUBLIC_BING_SEARCH_KEY;
    if (!apiKey) {
      throw new Error('Bing Search API key not configured');
    }

    const params = new URLSearchParams({
      q: query.query,
      count: Math.min(query.maxResults || 10, 50).toString(),
      mkt: `${query.language || 'en'}-${query.region || 'US'}`,
      responseFilter: 'Webpages'
    });

    if (query.timeframe) {
      params.append('freshness', this.convertTimeframeToFreshness(query.timeframe));
    }

    const response = await fetch(`https://api.bing.microsoft.com/v7.0/search?${params}`, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey
      }
    });

    const data = await response.json();

    const results: SearchResult[] = (data.webPages?.value || []).map((item: any) => ({
      title: item.name || '',
      url: item.url || '',
      snippet: item.snippet || '',
      publishDate: item.dateLastCrawled ? new Date(item.dateLastCrawled) : undefined,
      source: 'Bing',
      relevanceScore: this.calculateRelevanceScore(item, query),
      trustScore: this.calculateTrustScore(item.url),
      type: 'web' as const,
      metadata: {
        domain: new URL(item.url || 'https://example.com').hostname
      }
    }));

    return {
      results,
      totalResults: data.webPages?.totalEstimatedMatches || results.length
    };
  }

  /**
   * Perplexity AI search implementation
   */
  private async searchWithPerplexity(query: SearchQuery): Promise<{ results: SearchResult[]; totalResults: number }> {
    const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    // Perplexity uses a different approach - it's more like a chat completion with search
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: `Search for current information about: ${query.query}. Please provide sources and citations.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse Perplexity response to extract sources
    const results: SearchResult[] = this.parsePerplexityResponse(content, query);

    return {
      results,
      totalResults: results.length
    };
  }

  /**
   * DuckDuckGo Instant Answer implementation
   */
  private async searchWithDuckDuckGo(query: SearchQuery): Promise<{ results: SearchResult[]; totalResults: number }> {
    const params = new URLSearchParams({
      q: query.query,
      format: 'json',
      no_html: '1',
      skip_disambig: '1'
    });

    const response = await fetch(`https://api.duckduckgo.com/?${params}`);
    const data = await response.json();

    const results: SearchResult[] = [];

    // Add abstract if available
    if (data.Abstract) {
      results.push({
        title: data.Heading || 'DuckDuckGo Instant Answer',
        url: data.AbstractURL || '',
        snippet: data.Abstract,
        source: 'DuckDuckGo',
        relevanceScore: 0.9,
        trustScore: 0.8,
        type: 'web' as const,
        metadata: {
          domain: 'duckduckgo.com'
        }
      });
    }

    // Add related topics
    (data.RelatedTopics || []).forEach((topic: any, index: number) => {
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.split(' - ')[0] || '',
          url: topic.FirstURL,
          snippet: topic.Text,
          source: 'DuckDuckGo',
          relevanceScore: 0.7 - (index * 0.1),
          trustScore: 0.7,
          type: 'web' as const,
          metadata: {
            domain: new URL(topic.FirstURL).hostname
          }
        });
      }
    });

    return {
      results: results.slice(0, query.maxResults || 10),
      totalResults: results.length
    };
  }

  /**
   * Optimize query for better search results
   */
  private optimizeQuery(query: SearchQuery): SearchQuery {
    let optimizedQueryText = query.query;

    // Add current year for time-sensitive queries
    if (query.type === 'current_events' || query.type === 'news') {
      const currentYear = new Date().getFullYear();
      if (!optimizedQueryText.includes(currentYear.toString())) {
        optimizedQueryText += ` ${currentYear}`;
      }
    }

    // Add specific terms for different query types
    switch (query.type) {
      case 'technical':
        optimizedQueryText += ' technical documentation guide';
        break;
      case 'academic':
        optimizedQueryText += ' research paper study';
        break;
      case 'news':
        optimizedQueryText += ' latest news updates';
        break;
    }

    return {
      ...query,
      query: optimizedQueryText
    };
  }

  /**
   * Select best providers for a given query
   */
  private selectProvidersForQuery(query: SearchQuery): string[] {
    const providers: string[] = [];

    // Always try DuckDuckGo first (free and reliable)
    providers.push('duckduckgo');

    // Add other providers based on query type and availability
    if (process.env.NEXT_PUBLIC_SERPAPI_KEY && query.type !== 'academic') {
      providers.push('serpapi');
    }

    if (process.env.NEXT_PUBLIC_BING_SEARCH_KEY) {
      providers.push('bing');
    }

    if (process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY && (query.type === 'current_events' || query.type === 'academic')) {
      providers.push('perplexity');
    }

    return providers.slice(0, 2); // Limit to 2 providers for performance
  }

  /**
   * Process and rank search results
   */
  private processAndRankResults(results: SearchResult[], query: SearchQuery): SearchResult[] {
    // Remove duplicates
    const seen = new Set<string>();
    const uniqueResults = results.filter(result => {
      const key = `${result.title}|${result.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Calculate final scores and rank
    uniqueResults.forEach(result => {
      result.relevanceScore = this.calculateFinalRelevanceScore(result, query);
    });

    // Sort by relevance score
    return uniqueResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .filter(result => result.relevanceScore > 0.1); // Filter low-quality results
  }

  /**
   * Helper methods
   */
  private generateCacheKey(query: SearchQuery): string {
    return `search_${JSON.stringify(query)}`;
  }

  private getCachedResult(key: string): SearchResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    this.cache.delete(key);
    return null;
  }

  private cacheResult(key: string, result: SearchResponse): void {
    this.cache.set(key, { result, timestamp: Date.now() });
  }

  private checkRateLimit(providerName: string): boolean {
    const now = Date.now();
    const limiter = this.rateLimiters.get(providerName);
    
    if (!limiter || now > limiter.resetTime) {
      this.rateLimiters.set(providerName, { requests: 1, resetTime: now + 60000 });
      return true;
    }

    const provider = this.providers.get(providerName);
    if (limiter.requests >= (provider?.rateLimits.requestsPerMinute || 10)) {
      return false;
    }

    limiter.requests++;
    return true;
  }

  private calculateRelevanceScore(item: any, query: SearchQuery): number {
    const queryTerms = query.query.toLowerCase().split(' ');
    const title = (item.title || item.name || '').toLowerCase();
    const snippet = (item.snippet || '').toLowerCase();
    
    let score = 0;
    
    queryTerms.forEach(term => {
      if (title.includes(term)) score += 0.3;
      if (snippet.includes(term)) score += 0.2;
    });

    return Math.min(score, 1.0);
  }

  private calculateTrustScore(url: string): number {
    try {
      const domain = new URL(url).hostname;
      
      // High trust domains
      const highTrust = ['wikipedia.org', 'github.com', 'stackoverflow.com', 'mozilla.org'];
      if (highTrust.some(trusted => domain.includes(trusted))) return 0.9;
      
      // Medium trust domains
      const mediumTrust = ['.edu', '.gov', '.org'];
      if (mediumTrust.some(trusted => domain.includes(trusted))) return 0.8;
      
      return 0.6; // Default trust score
    } catch {
      return 0.3;
    }
  }

  private calculateFinalRelevanceScore(result: SearchResult, query: SearchQuery): number {
    let score = result.relevanceScore * 0.7 + result.trustScore * 0.3;
    
    // Boost recent content for time-sensitive queries
    if (query.timeframe && result.publishDate) {
      const age = Date.now() - result.publishDate.getTime();
      const maxAge = this.getMaxAgeForTimeframe(query.timeframe);
      if (age < maxAge) {
        score *= 1.2;
      }
    }

    return Math.min(score, 1.0);
  }

  private calculateQualityScore(results: SearchResult[]): number {
    if (results.length === 0) return 0;
    
    const avgRelevance = results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length;
    const avgTrust = results.reduce((sum, r) => sum + r.trustScore, 0) / results.length;
    
    return (avgRelevance + avgTrust) / 2;
  }

  private generateSuggestions(query: SearchQuery, results: SearchResult[]): string[] {
    const suggestions: string[] = [];
    const queryTerms = query.query.toLowerCase().split(' ');
    
    // Extract common terms from top results
    const topResults = results.slice(0, 5);
    const termFreq = new Map<string, number>();
    
    topResults.forEach(result => {
      const words = `${result.title} ${result.snippet}`.toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 3 && !queryTerms.includes(word));
      
      words.forEach(word => {
        termFreq.set(word, (termFreq.get(word) || 0) + 1);
      });
    });

    // Get top terms as suggestions
    const sortedTerms = Array.from(termFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => term);

    sortedTerms.forEach(term => {
      suggestions.push(`${query.query} ${term}`);
    });

    return suggestions;
  }

  private generateRelatedQueries(query: SearchQuery, results: SearchResult[]): string[] {
    const related: string[] = [];
    
    // Generate variations
    related.push(`how to ${query.query}`);
    related.push(`${query.query} examples`);
    related.push(`${query.query} vs alternatives`);
    
    return related.slice(0, 3);
  }

  private convertTimeframeToPeriod(timeframe: string): string {
    const mapping = {
      'hour': 'qdr:h',
      'day': 'qdr:d',
      'week': 'qdr:w',
      'month': 'qdr:m',
      'year': 'qdr:y'
    };
    return mapping[timeframe as keyof typeof mapping] || '';
  }

  private convertTimeframeToFreshness(timeframe: string): string {
    const mapping = {
      'day': 'Day',
      'week': 'Week',
      'month': 'Month'
    };
    return mapping[timeframe as keyof typeof mapping] || '';
  }

  private getMaxAgeForTimeframe(timeframe: string): number {
    const mapping = {
      'hour': 3600000,
      'day': 86400000,
      'week': 604800000,
      'month': 2592000000,
      'year': 31536000000
    };
    return mapping[timeframe as keyof typeof mapping] || 86400000;
  }

  private parsePerplexityResponse(content: string, query: SearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    
    // Simple parsing - in production you'd want more sophisticated extraction
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('http')) {
        const urlMatch = line.match(/https?:\/\/[^\s\)]+/);
        if (urlMatch) {
          results.push({
            title: `Perplexity Result ${index + 1}`,
            url: urlMatch[0],
            snippet: line.substring(0, 200),
            source: 'Perplexity AI',
            relevanceScore: 0.8,
            trustScore: 0.7,
            type: 'web',
            metadata: {
              domain: new URL(urlMatch[0]).hostname
            }
          });
        }
      }
    });

    return results;
  }

  // Public utility methods
  async searchSimple(query: string): Promise<SearchResult[]> {
    const searchQuery: SearchQuery = {
      query,
      type: 'general',
      maxResults: 5
    };
    
    const response = await this.search(searchQuery);
    return response.results;
  }

  async searchNews(query: string): Promise<SearchResult[]> {
    const searchQuery: SearchQuery = {
      query,
      type: 'news',
      timeframe: 'week',
      maxResults: 5
    };
    
    const response = await this.search(searchQuery);
    return response.results;
  }

  async searchTechnical(query: string): Promise<SearchResult[]> {
    const searchQuery: SearchQuery = {
      query,
      type: 'technical',
      maxResults: 5
    };
    
    const response = await this.search(searchQuery);
    return response.results;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getStats(): {
    cacheSize: number;
    providersConfigured: string[];
    rateLimitStatus: Record<string, any>;
  } {
    return {
      cacheSize: this.cache.size,
      providersConfigured: Array.from(this.providers.keys()),
      rateLimitStatus: Object.fromEntries(this.rateLimiters.entries())
    };
  }
}

export default WebSearchEngine;