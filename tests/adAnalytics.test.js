const AdAnalytics = require('../services/adAnalytics');

describe('AdAnalytics Service', () => {
  let analytics;
  let mockAds;

  beforeEach(() => {
    analytics = new AdAnalytics();
    mockAds = [
      {
        id: 'ad1',
        pageId: 'page1',
        pageName: 'Test Page 1',
        impressions: { min: 1000, max: 5000, average: 3000 },
        spend: { min: 100, max: 500, average: 300 },
        reach: { euTotal: 2500 },
        runtimeDays: 30,
        platforms: ['facebook', 'instagram'],
        demographics: [
          { age: '25-34', gender: 'male', percentage: 0.4 },
          { age: '35-44', gender: 'female', percentage: 0.6 }
        ],
        deliveryStopTime: null,
        creative: {
          bodies: ['Test ad body'],
          linkTitles: ['Test title'],
          linkDescriptions: ['Test description'],
          linkCaptions: ['Test caption']
        }
      },
      {
        id: 'ad2',
        pageId: 'page2',
        pageName: 'Test Page 2',
        impressions: { min: 2000, max: 8000, average: 5000 },
        spend: { min: 200, max: 800, average: 500 },
        reach: { euTotal: 4000 },
        runtimeDays: 45,
        platforms: ['facebook'],
        demographics: [
          { age: '18-24', gender: 'female', percentage: 0.8 },
          { age: '25-34', gender: 'male', percentage: 0.2 }
        ],
        deliveryStopTime: '2024-01-01',
        creative: {
          bodies: ['Another test ad'],
          linkTitles: ['Another title'],
          linkDescriptions: ['Another description'],
          linkCaptions: ['Another caption']
        }
      }
    ];
  });

  describe('sortAdsByReach', () => {
    test('should sort ads by reach in descending order by default', () => {
      const sorted = analytics.sortAdsByReach(mockAds);
      expect(sorted[0].reach.euTotal).toBe(4000);
      expect(sorted[1].reach.euTotal).toBe(2500);
    });

    test('should sort ads by reach in ascending order when specified', () => {
      const sorted = analytics.sortAdsByReach(mockAds, 'asc');
      expect(sorted[0].reach.euTotal).toBe(2500);
      expect(sorted[1].reach.euTotal).toBe(4000);
    });
  });

  describe('sortAdsBySpend', () => {
    test('should sort ads by spend average in descending order', () => {
      const sorted = analytics.sortAdsBySpend(mockAds);
      expect(sorted[0].spend.average).toBe(500);
      expect(sorted[1].spend.average).toBe(300);
    });

    test('should sort ads by spend in ascending order when specified', () => {
      const sorted = analytics.sortAdsBySpend(mockAds, 'asc');
      expect(sorted[0].spend.average).toBe(300);
      expect(sorted[1].spend.average).toBe(500);
    });
  });

  describe('sortAdsByRuntime', () => {
    test('should sort ads by runtime in descending order', () => {
      const sorted = analytics.sortAdsByRuntime(mockAds);
      expect(sorted[0].runtimeDays).toBe(45);
      expect(sorted[1].runtimeDays).toBe(30);
    });
  });

  describe('sortAdsByImpressions', () => {
    test('should sort ads by impressions average', () => {
      const sorted = analytics.sortAdsByImpressions(mockAds);
      expect(sorted[0].impressions.average).toBe(5000);
      expect(sorted[1].impressions.average).toBe(3000);
    });
  });

  describe('filterAds', () => {
    test('should filter by minimum impressions', () => {
      const filtered = analytics.filterAds(mockAds, { minImpressions: 4000 });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('ad2');
    });

    test('should filter by maximum spend', () => {
      const filtered = analytics.filterAds(mockAds, { maxSpend: 400 });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('ad1');
    });

    test('should filter by platform', () => {
      const filtered = analytics.filterAds(mockAds, { platform: 'instagram' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('ad1');
    });

    test('should filter by active status', () => {
      const activeAds = analytics.filterAds(mockAds, { activeOnly: true });
      expect(activeAds).toHaveLength(1);
      expect(activeAds[0].id).toBe('ad1');

      const inactiveAds = analytics.filterAds(mockAds, { activeOnly: false });
      expect(inactiveAds).toHaveLength(1);
      expect(inactiveAds[0].id).toBe('ad2');
    });

    test('should filter by page ID', () => {
      const filtered = analytics.filterAds(mockAds, { pageId: 'page1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].pageId).toBe('page1');
    });
  });

  describe('getCompetitorAnalysis', () => {
    test('should aggregate competitor data correctly', () => {
      const competitors = analytics.getCompetitorAnalysis(mockAds);
      
      expect(competitors).toHaveLength(2);
      
      const competitor1 = competitors.find(c => c.pageId === 'page1');
      expect(competitor1.totalAds).toBe(1);
      expect(competitor1.pageName).toBe('Test Page 1');
      expect(competitor1.activeAds).toBe(1);
      expect(competitor1.platforms).toContain('facebook');
      expect(competitor1.platforms).toContain('instagram');
      
      const competitor2 = competitors.find(c => c.pageId === 'page2');
      expect(competitor2.totalAds).toBe(1);
      expect(competitor2.activeAds).toBe(0);
      expect(competitor2.platforms).toEqual(['facebook']);
    });

    test('should sort competitors by total impressions', () => {
      const competitors = analytics.getCompetitorAnalysis(mockAds);
      expect(competitors[0].totalImpressions.average).toBeGreaterThan(competitors[1].totalImpressions.average);
    });
  });

  describe('getTopPerformingAds', () => {
    test('should return top ads by reach', () => {
      const topAds = analytics.getTopPerformingAds(mockAds, 'reach', 1);
      expect(topAds).toHaveLength(1);
      expect(topAds[0].reach.euTotal).toBe(4000);
    });

    test('should return top ads by spend', () => {
      const topAds = analytics.getTopPerformingAds(mockAds, 'spend', 1);
      expect(topAds).toHaveLength(1);
      expect(topAds[0].spend.average).toBe(500);
    });

    test('should limit results correctly', () => {
      const topAds = analytics.getTopPerformingAds(mockAds, 'reach', 5);
      expect(topAds.length).toBeLessThanOrEqual(2); // We only have 2 mock ads
    });
  });

  describe('getAdInsights', () => {
    test('should calculate insights correctly', () => {
      const insights = analytics.getAdInsights(mockAds);
      
      expect(insights.totalAds).toBe(2);
      expect(insights.totalImpressions).toBe(8000); // 3000 + 5000
      expect(insights.totalSpend).toBe(800); // 300 + 500
      expect(insights.averageImpressions).toBe(4000); // 8000 / 2
      expect(insights.averageSpend).toBe(400); // 800 / 2
      expect(insights.uniqueCompetitors).toBe(2);
      expect(insights.topPlatforms[0].platform).toBe('facebook');
    });

    test('should handle empty ads array', () => {
      const insights = analytics.getAdInsights([]);
      
      expect(insights.totalAds).toBe(0);
      expect(insights.totalImpressions).toBe(0);
      expect(insights.totalSpend).toBe(0);
      expect(insights.averageImpressions).toBe(0);
      expect(insights.averageSpend).toBe(0);
      expect(insights.uniqueCompetitors).toBe(0);
      expect(insights.topPlatforms).toEqual([]);
    });
  });

  describe('Cache functionality', () => {
    test('should store and retrieve cached data', () => {
      const testData = { test: 'data' };
      const key = 'test-key';
      
      analytics.setCachedData(key, testData);
      const retrieved = analytics.getCachedData(key);
      
      expect(retrieved).toEqual(testData);
    });

    test('should return null for non-existent cache key', () => {
      const retrieved = analytics.getCachedData('non-existent');
      expect(retrieved).toBeNull();
    });

    test('should clear cache', () => {
      analytics.setCachedData('test', { data: 'test' });
      analytics.clearCache();
      const retrieved = analytics.getCachedData('test');
      expect(retrieved).toBeNull();
    });
  });
});