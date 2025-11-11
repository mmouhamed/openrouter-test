export interface EnhancedImage {
  url: string;
  alt: string;
  caption?: string;
  source?: string;
  relevanceScore?: number;
  width?: number;
  height?: number;
  tags?: string[];
}

export interface ImageSearchOptions {
  maxImages?: number;
  preferredSources?: string[];
  includeIllustrations?: boolean;
  includePhotos?: boolean;
  includeIcons?: boolean;
  contentType?: 'technical' | 'educational' | 'business' | 'general';
}

class ImageEnhancementService {
  private readonly UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
  private readonly PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
  
  /**
   * Extract meaningful topics and keywords from text content
   */
  extractTopicsForImageSearch(text: string): string[] {
    // Technical terms that often benefit from visual representation
    const technicalTerms = text.match(/\b(AI|artificial intelligence|machine learning|ML|deep learning|neural network|algorithm|data|chart|graph|visualization|architecture|design|code|programming|software|system|network|database|API|framework|library|technology|innovation|analysis|model|pattern|structure|interface|dashboard|metrics|performance|optimization|cloud|security|blockchain|IoT|automation|robotics|analytics|big data|statistics|computer vision|NLP|natural language processing)\b/gi);
    
    // Business and educational concepts
    const businessTerms = text.match(/\b(strategy|marketing|finance|sales|business|management|leadership|team|collaboration|productivity|growth|revenue|customer|client|market|startup|entrepreneur|investment|planning|process|workflow|efficiency|innovation|digital transformation|e-commerce|branding|advertising)\b/gi);
    
    // Scientific and educational terms
    const scientificTerms = text.match(/\b(science|research|experiment|study|analysis|theory|hypothesis|discovery|innovation|laboratory|medicine|biology|chemistry|physics|mathematics|engineering|environment|sustainability|climate|energy|space|astronomy)\b/gi);
    
    // Design and visual concepts
    const designTerms = text.match(/\b(design|user interface|UI|UX|user experience|wireframe|prototype|mockup|layout|typography|color|visual|graphic|illustration|icon|logo|brand|creative|art|aesthetic|modern|minimal|responsive)\b/gi);
    
    const allTerms = [
      ...(technicalTerms || []),
      ...(businessTerms || []),
      ...(scientificTerms || []),
      ...(designTerms || [])
    ];
    
    // Remove duplicates and convert to lowercase
    const uniqueTerms = [...new Set(allTerms.map(term => term.toLowerCase()))];
    
    // Sort by relevance (longer terms first, then by frequency in text)
    return uniqueTerms
      .sort((a, b) => {
        const aCount = (text.toLowerCase().match(new RegExp(a, 'g')) || []).length;
        const bCount = (text.toLowerCase().match(new RegExp(b, 'g')) || []).length;
        if (aCount !== bCount) return bCount - aCount;
        return b.length - a.length;
      })
      .slice(0, 8); // Limit to most relevant terms
  }

  /**
   * Determine content type based on the text
   */
  private determineContentType(text: string): 'technical' | 'educational' | 'business' | 'general' {
    const technicalKeywords = ['code', 'programming', 'algorithm', 'API', 'database', 'software', 'technical', 'system'];
    const businessKeywords = ['business', 'market', 'strategy', 'sales', 'revenue', 'customer', 'management'];
    const educationalKeywords = ['learn', 'tutorial', 'guide', 'explain', 'understand', 'concept', 'theory'];
    
    const lowerText = text.toLowerCase();
    
    const technicalCount = technicalKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const businessCount = businessKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const educationalCount = educationalKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    if (technicalCount > businessCount && technicalCount > educationalCount) return 'technical';
    if (businessCount > educationalCount) return 'business';
    if (educationalCount > 0) return 'educational';
    
    return 'general';
  }

  /**
   * Search for images using Unsplash API
   */
  private async searchUnsplash(query: string, options: ImageSearchOptions = {}): Promise<EnhancedImage[]> {
    if (!this.UNSPLASH_ACCESS_KEY) {
      console.warn('Unsplash API key not configured');
      return this.getFallbackImages(query, options);
    }

    try {
      const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${options.maxImages || 3}&orientation=landscape`, {
        headers: {
          'Authorization': `Client-ID ${this.UNSPLASH_ACCESS_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.results.map((photo: {
        urls: { regular: string };
        alt_description?: string;
        description?: string;
        user: { name: string };
        width: number;
        height: number;
        tags?: { title: string }[];
      }, index: number) => ({
        url: photo.urls.regular,
        alt: photo.alt_description || `Image related to ${query}`,
        caption: photo.description || `Visual representation: ${query}`,
        source: `Unsplash - ${photo.user.name}`,
        relevanceScore: 0.9 - (index * 0.1),
        width: photo.width,
        height: photo.height,
        tags: photo.tags?.map((tag) => tag.title) || []
      }));
    } catch (error) {
      console.error('Unsplash search failed:', error);
      return this.getFallbackImages(query, options);
    }
  }

  /**
   * Search for images using Pexels API
   */
  private async searchPexels(query: string, options: ImageSearchOptions = {}): Promise<EnhancedImage[]> {
    if (!this.PEXELS_API_KEY) {
      console.warn('Pexels API key not configured');
      return [];
    }

    try {
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${options.maxImages || 3}&orientation=landscape`, {
        headers: {
          'Authorization': this.PEXELS_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.photos.map((photo: {
        src: { large: string };
        alt?: string;
        photographer: string;
        width: number;
        height: number;
      }, index: number) => ({
        url: photo.src.large,
        alt: photo.alt || `Image related to ${query}`,
        caption: `Visual illustration: ${query}`,
        source: `Pexels - ${photo.photographer}`,
        relevanceScore: 0.85 - (index * 0.1),
        width: photo.width,
        height: photo.height,
        tags: []
      }));
    } catch (error) {
      console.error('Pexels search failed:', error);
      return [];
    }
  }

  /**
   * Get curated tech-focused placeholder images
   */
  private getFallbackImages(query: string, options: ImageSearchOptions = {}): EnhancedImage[] {
    const contentType = options.contentType || 'general';
    const maxImages = options.maxImages || 2;
    
    // Curated high-quality placeholders for different content types
    const imageCollections = {
      technical: [
        {
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=800&h=600&q=80',
          alt: 'Abstract technology visualization',
          caption: 'Technology and Innovation',
          source: 'Curated Collection',
          relevanceScore: 0.8
        },
        {
          url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&h=600&q=80',
          alt: 'Data visualization dashboard',
          caption: 'Data Analytics and Insights',
          source: 'Curated Collection',
          relevanceScore: 0.7
        },
        {
          url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&h=600&q=80',
          alt: 'Code on computer screen',
          caption: 'Software Development',
          source: 'Curated Collection',
          relevanceScore: 0.75
        }
      ],
      business: [
        {
          url: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=800&h=600&q=80',
          alt: 'Business meeting and collaboration',
          caption: 'Business Strategy and Growth',
          source: 'Curated Collection',
          relevanceScore: 0.8
        },
        {
          url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&h=600&q=80',
          alt: 'Business analytics charts',
          caption: 'Business Analytics and Metrics',
          source: 'Curated Collection',
          relevanceScore: 0.7
        }
      ],
      educational: [
        {
          url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&h=600&q=80',
          alt: 'Learning and education concept',
          caption: 'Learning and Knowledge',
          source: 'Curated Collection',
          relevanceScore: 0.8
        },
        {
          url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&h=600&q=80',
          alt: 'Study and research materials',
          caption: 'Research and Study',
          source: 'Curated Collection',
          relevanceScore: 0.7
        }
      ],
      general: [
        {
          url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&h=600&q=80',
          alt: 'Modern abstract design',
          caption: 'Innovation and Creativity',
          source: 'Curated Collection',
          relevanceScore: 0.6
        }
      ]
    };

    const collection = imageCollections[contentType] || imageCollections.general;
    return collection.slice(0, maxImages);
  }

  /**
   * Main method to enhance content with relevant images
   */
  async enhanceContentWithImages(
    text: string, 
    options: ImageSearchOptions = {}
  ): Promise<EnhancedImage[]> {
    const topics = this.extractTopicsForImageSearch(text);
    
    if (topics.length === 0) {
      return [];
    }

    const contentType = this.determineContentType(text);
    const enhancedOptions = { ...options, contentType };
    
    // Use the most relevant topic for image search
    const primaryTopic = topics[0];
    
    try {
      // Try multiple sources and combine results
      const [unsplashImages, pexelsImages] = await Promise.allSettled([
        this.searchUnsplash(primaryTopic, { ...enhancedOptions, maxImages: 2 }),
        this.searchPexels(primaryTopic, { ...enhancedOptions, maxImages: 1 })
      ]);
      
      const allImages: EnhancedImage[] = [];
      
      if (unsplashImages.status === 'fulfilled') {
        allImages.push(...unsplashImages.value);
      }
      
      if (pexelsImages.status === 'fulfilled') {
        allImages.push(...pexelsImages.value);
      }
      
      // If we don't have enough images, add fallbacks
      if (allImages.length === 0) {
        return this.getFallbackImages(primaryTopic, enhancedOptions);
      }
      
      // Sort by relevance score and limit results
      return allImages
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, options.maxImages || 2);
        
    } catch (error) {
      console.error('Image enhancement failed:', error);
      return this.getFallbackImages(primaryTopic, enhancedOptions);
    }
  }

  /**
   * Check if content should have images enhanced
   */
  shouldEnhanceWithImages(text: string): boolean {
    // Temporarily disabled - generic fallback images are not contextually relevant
    return false;
    
    // Original logic preserved for future use:
    // Don't enhance very short responses
    // if (text.length < 100) return false;
    // 
    // Don't enhance if it's mostly code
    // const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).join('').length;
    // if (codeBlocks > text.length * 0.5) return false;
    // 
    // Enhance if it contains topics that benefit from visualization
    // const visualTopics = ['concept', 'architecture', 'design', 'process', 'system', 'model', 'analysis', 'visualization', 'workflow'];
    // const hasVisualTopics = visualTopics.some(topic => 
    //   text.toLowerCase().includes(topic)
    // );
    // 
    // return hasVisualTopics || text.length > 500;
  }
}

export const imageEnhancementService = new ImageEnhancementService();