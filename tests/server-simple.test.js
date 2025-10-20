const request = require('supertest');

// Create a simplified test version that doesn't import the full server
describe('Server Basic Tests', () => {
  let app;

  beforeAll(() => {
    // Mock MetaAdsClient before requiring server
    jest.doMock('../lib/metaAdsClient', () => {
      return jest.fn().mockImplementation(() => ({
        searchAds: jest.fn().mockResolvedValue({
          ads: [{
            pageId: 'test123',
            pageName: 'Test Page',
            impressions: { average: 1000 },
            spend: { average: 100 }
          }]
        }),
        getPageInfo: jest.fn().mockResolvedValue({
          id: 'test123',
          name: 'Test Page'
        })
      }));
    });

    // Now require the server
    app = require('../server');
  });

  afterAll(() => {
    jest.dontMock('../lib/metaAdsClient');
  });

  test('should render main page', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.text).toContain('Meta Ads Spy');
  });

  test('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
  });

  test('should handle autocomplete requests', async () => {
    const response = await request(app)
      .get('/api/pages/suggestions?q=test')
      .expect(200);
    
    expect(response.body).toHaveProperty('success');
  });

  test('should handle 404 errors', async () => {
    await request(app)
      .get('/nonexistent')
      .expect(404);
  });
});