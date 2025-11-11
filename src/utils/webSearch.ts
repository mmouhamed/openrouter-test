/**
 * Web Search Utility
 * Provides web search functionality using SerpAPI
 */

import { WebSource, SearchQuery } from '@/types/chat';

interface SerpSearchParams {
  engine: 'google';
  q: string;
  api_key: string;
  num?: number;
  hl?: string;
  gl?: string;
}

interface SerpOrganicResult {
  title: string;
  link: string;
  snippet: string;
  source?: string;
  date?: string;
  position: number;
}

interface SerpSearchResponse {
  organic_results?: SerpOrganicResult[];
  error?: string;
  search_metadata?: {
    status: string;
    processing_time_ms: number;
  };
}

/**
 * Performs web search using SerpAPI
 */
export async function performWebSearch(
  query: string,
  maxResults: number = 5
): Promise<{ success: boolean; sources: WebSource[]; error?: string }> {
  try {
    // Check if SerpAPI key is configured
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      console.warn('SerpAPI key not configured - web search disabled');
      return { 
        success: false, 
        sources: [], 
        error: 'Web search not configured' 
      };
    }

    // Clean and optimize the search query
    const cleanQuery = cleanSearchQuery(query);
    
    const searchParams: SerpSearchParams = {
      engine: 'google',
      q: cleanQuery,
      api_key: apiKey,
      num: Math.min(maxResults, 10), // Limit to 10 results max
      hl: 'en',
      gl: 'us'
    };

    const searchUrl = 'https://serpapi.com/search?' + new URLSearchParams(searchParams as any).toString();

    console.log('Performing web search:', { query: cleanQuery, maxResults });

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ChatQora Web Search',
      },
    });

    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
    }

    const data: SerpSearchResponse = await response.json();

    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    if (!data.organic_results || data.organic_results.length === 0) {
      return {
        success: false,
        sources: [],
        error: 'No search results found'
      };
    }

    // Convert SerpAPI results to WebSource format
    const sources: WebSource[] = data.organic_results
      .slice(0, maxResults)
      .map((result, index) => ({
        title: cleanTitle(result.title),
        url: result.link,
        snippet: cleanSnippet(result.snippet),
        relevance: calculateRelevance(result, query, index),
        trustScore: calculateTrustScore(result.link),
        source: extractDomain(result.link),
        publishDate: result.date ? new Date(result.date) : undefined
      }));

    console.log(`Web search completed: ${sources.length} sources found`);
    
    return {
      success: true,
      sources: sources
    };

  } catch (error) {
    console.error('Web search error:', error);
    return {
      success: false,
      sources: [],
      error: error instanceof Error ? error.message : 'Unknown search error'
    };
  }
}

/**
 * Generates optimized search prompts for the AI model
 */
export function createSearchContext(sources: WebSource[], originalQuery: string): string {
  if (sources.length === 0) {
    return '';
  }

  const searchContext = `
Based on the user's question "${originalQuery}", I found the following current information from the web:

${sources.map((source, index) => `
${index + 1}. **${source.title}** (${source.source})
   ${source.snippet}
   Source: ${source.url}
`).join('')}

Please use this current information to provide an accurate and up-to-date response to the user's question. Cite specific sources when relevant.
`;

  return searchContext.trim();
}

/**
 * Cleans and optimizes search queries
 */
function cleanSearchQuery(query: string): string {
  // Remove common conversational phrases
  let cleaned = query
    .replace(/^(what|how|can you|please|could you|tell me|explain|describe)\s+/i, '')
    .replace(/\s+(please|thanks?|thank you)$/i, '')
    .replace(/[?!.]+$/, '');

  // Add current year for time-sensitive queries
  if (/\b(current|latest|recent|new|today|2024|2025)\b/i.test(cleaned)) {
    cleaned += ' 2024 2025';
  }

  // Enhance technical queries
  if (/\b(API|SDK|framework|library|technology|programming)\b/i.test(cleaned)) {
    cleaned += ' documentation guide';
  }

  return cleaned.trim();
}

/**
 * Cleans and truncates titles
 */
function cleanTitle(title: string): string {
  // Remove common suffixes and clean up
  return title
    .replace(/\s*-\s*(Wikipedia|Stack Overflow|GitHub|Google|YouTube).*$/i, '')
    .replace(/\s*\|\s*.*$/i, '')
    .trim()
    .substring(0, 100);
}

/**
 * Cleans and truncates snippets
 */
function cleanSnippet(snippet: string): string {
  // Clean up snippet text
  return snippet
    .replace(/\s*\.\.\.\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200);
}

/**
 * Calculates relevance score based on position and query match
 */
function calculateRelevance(result: SerpOrganicResult, query: string, position: number): number {
  let score = 1.0 - (position * 0.1); // Base score decreases with position
  
  // Boost score for query terms in title
  const queryWords = query.toLowerCase().split(/\s+/);
  const titleWords = result.title.toLowerCase();
  const snippetWords = result.snippet.toLowerCase();
  
  queryWords.forEach(word => {
    if (word.length > 2) { // Skip short words
      if (titleWords.includes(word)) score += 0.1;
      if (snippetWords.includes(word)) score += 0.05;
    }
  });
  
  return Math.min(score, 1.0);
}

/**
 * Calculates trust score based on domain reputation
 */
function calculateTrustScore(url: string): number {
  const domain = extractDomain(url).toLowerCase();
  
  // High trust domains
  const highTrust = [
    'wikipedia.org', 'github.com', 'stackoverflow.com', 
    'mozilla.org', 'w3.org', 'ietf.org', 'rfc-editor.org',
    'microsoft.com', 'google.com', 'apple.com', 'amazon.com',
    'ieee.org', 'acm.org', 'nature.com', 'science.org',
    'nist.gov', 'nih.gov', 'cdc.gov', 'fda.gov'
  ];
  
  // Medium trust domains
  const mediumTrust = [
    'medium.com', 'dev.to', 'hashnode.com', 'freecodecamp.org',
    'codecademy.com', 'tutorialspoint.com', 'geeksforgeeks.org',
    'techcrunch.com', 'arstechnica.com', 'wired.com'
  ];
  
  if (highTrust.some(trusted => domain.includes(trusted))) return 0.9;
  if (mediumTrust.some(trusted => domain.includes(trusted))) return 0.7;
  if (domain.includes('.edu') || domain.includes('.gov')) return 0.85;
  if (domain.includes('.org')) return 0.75;
  
  return 0.6; // Default trust score
}

/**
 * Extracts domain name from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Determines if a query would benefit from web search
 */
export function shouldUseWebSearch(query: string): boolean {
  const webSearchIndicators = [
    /\b(current|latest|recent|new|today|now|2024|2025)\b/i,
    /\b(what('s|\s+is)\s+(happening|going\s+on))\b/i,
    /\b(latest\s+(news|updates|version|release))\b/i,
    /\b(current\s+(status|situation|price|rate))\b/i,
    /\b(how\s+to\s+.+\s+(now|today|recently))\b/i,
    /\b(best\s+.+\s+(2024|2025))\b/i,
    /\b(trends?|trending)\b/i,
    /\b(stock|price|weather|news|sports)\b/i
  ];
  
  return webSearchIndicators.some(pattern => pattern.test(query));
}