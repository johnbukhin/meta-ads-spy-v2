const MetaAdsClient = require('../lib/metaAdsClient');

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('MetaAdsClient', () => {
  let client;
  const mockAccessToken = 'test_access_token';

  beforeEach(() => {
    client = new MetaAdsClient(mockAccessToken);
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with correct access token and base URL', () => {
      expect(client.accessToken).toBe(mockAccessToken);
      expect(client.baseURL).toBe('https://graph.facebook.com/v18.0');
    });

    test('should initialize rate limiting properties', () => {
      expect(client.rateLimit.requests).toBe(0);
      expect(client.rateLimit.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests under rate limit', async () => {
      client.rateLimit.requests = 100;
      await expect(client.checkRateLimit()).resolves.toBeUndefined();
      expect(client.rateLimit.requests).toBe(101);
    });

    test('should throw error when rate limit exceeded', async () => {
      client.rateLimit.requests = 200;
      await expect(client.checkRateLimit()).rejects.toThrow('Rate limit exceeded');
    });

    test('should reset rate limit after time expires', async () => {
      client.rateLimit.requests = 200;
      client.rateLimit.resetTime = Date.now() - 1000; // Past time
      
      await expect(client.checkRateLimit()).resolves.toBeUndefined();
      expect(client.rateLimit.requests).toBe(1);
    });
  });

  describe('processAdsData', () => {
    test('should process valid ads data correctly', () => {
      const mockApiResponse = {
        data: [
          {
            id: 'ad123',
            page_id: 'page123',
            page_name: 'Test Page',
            ad_creation_time: '2024-01-01T00:00:00Z',
            ad_delivery_start_time: '2024-01-01T00:00:00Z',
            ad_delivery_stop_time: null,
            impressions: { lower_bound: '1000', upper_bound: '5000' },
            spend: { lower_bound: '100', upper_bound: '500' },
            ad_creative_bodies: ['Test body'],
            ad_creative_link_titles: ['Test title'],
            demographic_distribution: [
              { age: '25-34', gender: 'male', percentage: 0.5 },
              { age: '35-44', gender: 'female', percentage: 0.5 }
            ],
            publisher_platforms: ['facebook', 'instagram'],
            currency: 'USD',
            ad_snapshot_url: 'https://example.com/snapshot'
          }
        ],
        paging: { next: 'https://example.com/next' }
      };

      const result = client.processAdsData(mockApiResponse);

      expect(result.ads).toHaveLength(1);
      const ad = result.ads[0];
      
      expect(ad.id).toBe('ad123');
      expect(ad.pageId).toBe('page123');
      expect(ad.pageName).toBe('Test Page');
      expect(ad.impressions.min).toBe(1000);
      expect(ad.impressions.max).toBe(5000);
      expect(ad.impressions.average).toBe(3000);
      expect(ad.spend.min).toBe(100);
      expect(ad.spend.max).toBe(500);
      expect(ad.spend.average).toBe(300);
      expect(ad.isActive).toBe(true);
      expect(ad.platforms).toEqual(['facebook', 'instagram']);
      expect(ad.creative.bodies).toEqual(['Test body']);
      expect(result.pagination).toEqual({ next: 'https://example.com/next' });
    });

    test('should handle string format impressions', () => {
      const mockApiResponse = {
        data: [
          {
            id: 'ad123',
            impressions: '1,000 - 5,000',
            spend: '$100 - $500',
            ad_delivery_start_time: '2024-01-01T00:00:00Z'
          }
        ]
      };

      const result = client.processAdsData(mockApiResponse);
      const ad = result.ads[0];
      
      expect(ad.impressions.min).toBe(1000);
      expect(ad.impressions.max).toBe(5000);
      expect(ad.spend.min).toBe(100);
      expect(ad.spend.max).toBe(500);
    });

    test('should calculate runtime days correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const mockApiResponse = {
        data: [
          {
            id: 'ad123',
            ad_delivery_start_time: startDate.toISOString(),
            ad_delivery_stop_time: endDate.toISOString()
          }
        ]
      };

      const result = client.processAdsData(mockApiResponse);
      const ad = result.ads[0];
      
      expect(ad.runtimeDays).toBe(30);
      expect(ad.isActive).toBe(false);
    });

    test('should handle empty data', () => {
      const result = client.processAdsData({ data: null });
      expect(result.ads).toEqual([]);
      expect(result.pagination).toBeNull();
    });
  });

  describe('calculateReachFromDemographics', () => {
    test('should calculate reach from demographics', () => {
      const demographics = [
        { age: '25-34', gender: 'male', percentage: 0.4 },
        { age: '35-44', gender: 'female', percentage: 0.6 }
      ];
      
      const result = client.calculateReachFromDemographics(demographics, 1000, 5000);
      
      expect(result).toHaveProperty('estimated');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('demographicGroups', 2);
      expect(result).toHaveProperty('method', 'demographic_extrapolation');
      expect(result.estimated).toBeGreaterThan(0);
    });

    test('should return null for empty demographics', () => {
      const result = client.calculateReachFromDemographics([], 1000, 5000);
      expect(result).toBeNull();
    });

    test('should return null for invalid demographics', () => {
      const result = client.calculateReachFromDemographics(null, 1000, 5000);
      expect(result).toBeNull();
    });
  });

  describe('searchAds', () => {
    beforeEach(() => {
      // Mock successful API response
      axios.get.mockResolvedValue({
        data: {
          data: [
            {
              id: 'ad123',
              page_id: 'page123',
              page_name: 'Test Page',
              impressions: { lower_bound: '1000', upper_bound: '5000' },
              spend: { lower_bound: '100', upper_bound: '500' },
              ad_delivery_start_time: '2024-01-01T00:00:00Z'
            }
          ]
        }
      });
    });

    test('should make API call with correct parameters', async () => {
      const params = {
        searchTerms: 'fitness',
        countries: ['US', 'CA'],
        limit: 50
      };

      await client.searchAds(params);

      expect(axios.get).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/ads_archive',
        expect.objectContaining({
          params: expect.objectContaining({
            access_token: mockAccessToken,
            search_terms: 'fitness',
            limit: 50
          })
        })
      );
    });

    test('should use default countries when none provided', async () => {
      await client.searchAds({ searchTerms: 'test' });

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            ad_reached_countries: expect.arrayContaining(['AT', 'BE', 'BR']) // Default EU/LATAM countries
          })
        })
      );
    });

    test('should handle API errors gracefully', async () => {
      const errorResponse = {
        response: {
          data: {
            error: {
              message: 'Invalid access token'
            }
          }
        }
      };
      
      axios.get.mockRejectedValue(errorResponse);

      await expect(client.searchAds({})).rejects.toThrow('Failed to fetch ads: Invalid access token');
    });

    test('should add date filters when provided', async () => {
      // Reset mocks to avoid interference from page ID search
      axios.get.mockClear();
      
      // Mock the page ID search to return empty (fallback to regular search)
      axios.get.mockResolvedValueOnce({ data: { data: [] } });
      
      // Mock the regular search
      axios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'ad123',
              page_id: 'page123',
              page_name: 'Test Page',
              ad_delivery_start_time: '2024-01-01T00:00:00Z'
            }
          ]
        }
      });

      const params = {
        searchTerms: 'test',
        adDeliveryDateMin: '2024-01-01',
        adDeliveryDateMax: '2024-01-31'
      };

      await client.searchAds(params);

      // Check the second call (regular search) for date filters
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            ad_delivery_date_min: '2024-01-01',
            ad_delivery_date_max: '2024-01-31'
          })
        })
      );
    });
  });

  describe('getPageInfo', () => {
    test('should fetch page info successfully', async () => {
      const mockPageInfo = {
        id: 'page123',
        name: 'Test Page',
        category: 'Business',
        fan_count: 1000
      };

      axios.get.mockResolvedValue({ data: mockPageInfo });

      const result = await client.getPageInfo('page123');

      expect(result).toEqual(mockPageInfo);
      expect(axios.get).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/page123',
        expect.objectContaining({
          params: expect.objectContaining({
            access_token: mockAccessToken,
            fields: 'id,name,category,category_list,link,fan_count,followers_count'
          })
        })
      );
    });

    test('should handle page info errors', async () => {
      axios.get.mockRejectedValue(new Error('Page not found'));

      const result = await client.getPageInfo('invalid_page');

      expect(result).toBeNull();
    });
  });
});