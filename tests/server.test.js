const request = require('supertest');
// Mock the MetaAdsClient before requiring the server
jest.mock('../lib/metaAdsClient');

const app = require('../server');

const MetaAdsClient = require('../lib/metaAdsClient');

describe('Server API Endpoints', () => {
  let mockMetaClient;

  beforeEach(() => {
    // Create mock instance
    mockMetaClient = {
      searchAds: jest.fn(),
      getPageInfo: jest.fn()
    };
    
    // Mock the constructor to return our mock instance
    MetaAdsClient.mockImplementation(() => mockMetaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    test('should render index page', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.text).toContain('Meta Ads Spy');
    });
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/pages/suggestions', () => {
    test('should return suggestions for valid query', async () => {
      const mockAds = [
        {
          pageId: 'page1',
          pageName: 'Test Page 1'
        },
        {
          pageId: 'page2',
          pageName: 'Test Page 2'
        }
      ];

      mockMetaClient.searchAds.mockResolvedValue({ ads: mockAds });

      const response = await request(app)
        .get('/api/pages/suggestions?q=test')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('pageId', 'page1');
      expect(response.body.data[0]).toHaveProperty('pageName', 'Test Page 1');
      expect(response.body.data[0]).toHaveProperty('avatarUrl');
    });

    test('should return empty array for short query', async () => {
      const response = await request(app)
        .get('/api/pages/suggestions?q=a')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    test('should handle API errors gracefully', async () => {
      mockMetaClient.searchAds.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/api/pages/suggestions?q=test')
        .expect(200);
      
      expect(response.body.success).toBe(false);
      expect(response.body.data).toEqual([]);
      expect(response.body.error).toBe('API Error');
    });

    test('should limit and sort suggestions', async () => {
      const mockAds = Array.from({ length: 20 }, (_, i) => ({
        pageId: `page${i}`,
        pageName: `Page ${String.fromCharCode(90 - i)}` // Z, Y, X, etc.
      }));

      mockMetaClient.searchAds.mockResolvedValue({ ads: mockAds });

      const response = await request(app)
        .get('/api/pages/suggestions?q=test')
        .expect(200);
      
      expect(response.body.data).toHaveLength(10); // Limited to 10
      // Should be sorted alphabetically
      expect(response.body.data[0].pageName < response.body.data[1].pageName).toBe(true);
    });
  });

  describe('GET /api/search', () => {
    test('should search ads and return JSON', async () => {
      const mockAds = [
        {
          id: 'ad1',
          pageId: 'page1',
          pageName: 'Test Page',
          impressions: { average: 5000 },
          spend: { average: 500 }
        }
      ];

      mockMetaClient.searchAds.mockResolvedValue({ 
        ads: mockAds,
        pagination: { next: 'next_url' }
      });

      const response = await request(app)
        .get('/api/search?q=fitness')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.ads).toHaveLength(1);
      expect(response.body.data.ads[0].id).toBe('ad1');
      expect(response.body.data).toHaveProperty('insights');
      expect(response.body.data).toHaveProperty('competitors');
      expect(response.body.data.pagination).toEqual({ next: 'next_url' });
    });

    test('should handle search errors', async () => {
      mockMetaClient.searchAds.mockRejectedValue(new Error('Search failed'));

      const response = await request(app)
        .get('/api/search?q=test')
        .expect(500);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Search failed');
    });

    test('should apply sorting parameters', async () => {
      const mockAds = [
        { id: 'ad1', spend: { average: 100 } },
        { id: 'ad2', spend: { average: 200 } }
      ];

      mockMetaClient.searchAds.mockResolvedValue({ ads: mockAds });

      const response = await request(app)
        .get('/api/search?q=test&sortBy=spend&sortOrder=desc')
        .expect(200);
      
      expect(response.body.data.ads[0].spend.average).toBe(200);
      expect(response.body.data.ads[1].spend.average).toBe(100);
    });
  });

  describe('GET /api/page/:pageId', () => {
    test('should return page info', async () => {
      const mockPageInfo = {
        id: 'page123',
        name: 'Test Page',
        category: 'Business'
      };

      mockMetaClient.getPageInfo.mockResolvedValue(mockPageInfo);

      const response = await request(app)
        .get('/api/page/page123')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPageInfo);
    });

    test('should handle page info errors', async () => {
      mockMetaClient.getPageInfo.mockRejectedValue(new Error('Page not found'));

      const response = await request(app)
        .get('/api/page/invalid')
        .expect(500);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Page not found');
    });
  });

  describe('POST /search', () => {
    test('should process search form and render results', async () => {
      const mockAds = [
        {
          id: 'ad1',
          pageId: 'page1',
          pageName: 'Test Page',
          impressions: { average: 5000 },
          spend: { average: 500 },
          platforms: ['facebook']
        }
      ];

      mockMetaClient.searchAds.mockResolvedValue({ ads: mockAds });

      const response = await request(app)
        .post('/search')
        .send({
          searchTerms: 'fitness',
          countries: 'US,CA',
          limit: '50',
          sortBy: 'reach',
          sortOrder: 'desc'
        })
        .expect(200);
      
      expect(response.text).toContain('Meta Ads Spy');
      expect(mockMetaClient.searchAds).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerms: 'fitness',
          countries: ['US', 'CA'],
          limit: 50
        })
      );
    });

    test('should handle search form errors', async () => {
      mockMetaClient.searchAds.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .post('/search')
        .send({ searchTerms: 'test' })
        .expect(200);
      
      expect(response.text).toContain('API Error');
    });

    test('should use cached data when available', async () => {
      const mockAds = [{ id: 'ad1' }];
      
      // First request - will cache
      mockMetaClient.searchAds.mockResolvedValueOnce({ ads: mockAds });
      
      await request(app)
        .post('/search')
        .send({ searchTerms: 'test' });
      
      // Second identical request - should use cache
      await request(app)
        .post('/search')
        .send({ searchTerms: 'test' });
      
      // Should only call API once due to caching
      expect(mockMetaClient.searchAds).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /competitors', () => {
    test('should render competitors page', async () => {
      const response = await request(app)
        .get('/competitors')
        .expect(200);
      
      expect(response.text).toContain('Competitor Analysis');
    });

    test('should search competitors when query provided', async () => {
      const mockAds = [
        {
          pageId: 'page1',
          pageName: 'Competitor 1',
          impressions: { average: 5000 }
        }
      ];

      mockMetaClient.searchAds.mockResolvedValue({ ads: mockAds });

      const response = await request(app)
        .get('/competitors?q=fitness')
        .expect(200);
      
      expect(response.text).toContain('Competitor Analysis');
      expect(mockMetaClient.searchAds).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerms: 'fitness',
          limit: 500
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/nonexistent-route')
        .expect(404);
      
      expect(response.text).toContain('Page not found');
    });
  });
});