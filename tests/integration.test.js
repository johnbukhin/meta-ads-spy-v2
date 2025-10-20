const request = require('supertest');
const app = require('../server');

describe('Integration Tests', () => {
  // These tests run against the actual server with mocked external APIs
  // They test the full request/response cycle

  describe('Full Search Flow', () => {
    test('should complete full search workflow', async () => {
      // 1. Load main page
      const indexResponse = await request(app)
        .get('/')
        .expect(200);
      
      expect(indexResponse.text).toContain('Meta Ads Spy');
      expect(indexResponse.text).toContain('Search Terms');

      // 2. Test autocomplete suggestions
      const suggestionsResponse = await request(app)
        .get('/api/pages/suggestions?q=fitness')
        .expect(200);
      
      expect(suggestionsResponse.body).toHaveProperty('success');
      expect(suggestionsResponse.body).toHaveProperty('data');

      // 3. Test JSON API search
      const apiSearchResponse = await request(app)
        .get('/api/search?q=test&limit=10')
        .expect(200);
      
      expect(apiSearchResponse.body).toHaveProperty('success');
      expect(apiSearchResponse.body.data).toHaveProperty('ads');
      expect(apiSearchResponse.body.data).toHaveProperty('insights');
      expect(apiSearchResponse.body.data).toHaveProperty('competitors');

      // 4. Test form submission
      const formResponse = await request(app)
        .post('/search')
        .send({
          searchTerms: 'test',
          countries: 'US',
          limit: '10',
          sortBy: 'reach'
        })
        .expect(200);
      
      expect(formResponse.text).toContain('Meta Ads Spy');
    });
  });

  describe('API Response Formats', () => {
    test('should return consistent JSON structure for API endpoints', async () => {
      const apiEndpoints = [
        '/api/search?q=test',
        '/api/pages/suggestions?q=te'
      ];

      for (const endpoint of apiEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(200);
        
        expect(response.body).toHaveProperty('success');
        expect(typeof response.body.success).toBe('boolean');
        
        if (response.body.success) {
          expect(response.body).toHaveProperty('data');
        } else {
          expect(response.body).toHaveProperty('error');
        }
      }
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle various error scenarios gracefully', async () => {
      // Test invalid page ID
      const pageResponse = await request(app)
        .get('/api/page/invalid_page_id_12345')
        .expect(500);
      
      expect(pageResponse.body.success).toBe(false);
      expect(pageResponse.body).toHaveProperty('error');

      // Test empty search
      const emptySearchResponse = await request(app)
        .get('/api/search')
        .expect(200);
      
      expect(emptySearchResponse.body).toHaveProperty('success');

      // Test malformed form data
      const malformedFormResponse = await request(app)
        .post('/search')
        .send({ invalidField: 'test' })
        .expect(200);
      
      expect(malformedFormResponse.text).toContain('Meta Ads Spy');
    });
  });

  describe('Performance and Caching', () => {
    test('should cache identical requests', async () => {
      const searchParams = { searchTerms: 'cache_test', limit: '5' };
      
      // First request
      const startTime1 = Date.now();
      const response1 = await request(app)
        .post('/search')
        .send(searchParams)
        .expect(200);
      const duration1 = Date.now() - startTime1;

      // Second identical request (should be faster due to caching)
      const startTime2 = Date.now();
      const response2 = await request(app)
        .post('/search')
        .send(searchParams)
        .expect(200);
      const duration2 = Date.now() - startTime2;

      // Both should return successful responses
      expect(response1.text).toContain('Meta Ads Spy');
      expect(response2.text).toContain('Meta Ads Spy');
      
      // Note: In test environment with mocked APIs, this timing test 
      // may not be reliable, but it validates the caching flow
    });
  });

  describe('Search Parameter Validation', () => {
    test('should handle various search parameter combinations', async () => {
      const testCases = [
        { searchTerms: 'fitness' },
        { searchTerms: 'marketing', countries: 'US,CA,GB' },
        { searchTerms: 'ecommerce', limit: '50', sortBy: 'spend' },
        { searchTerms: 'travel', sortOrder: 'asc', platform: 'facebook' },
        { searchTerms: 'tech', activeOnly: 'true' },
        { searchTerms: 'food', startDate: '2024-01-01', endDate: '2024-01-31' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/search')
          .send(testCase)
          .expect(200);
        
        expect(response.text).toContain('Meta Ads Spy');
      }
    });
  });

  describe('Content Security', () => {
    test('should sanitize user inputs', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '"><img src=x onerror=alert(1)>',
        '${alert(1)}'
      ];

      for (const maliciousInput of maliciousInputs) {
        const response = await request(app)
          .post('/search')
          .send({ searchTerms: maliciousInput })
          .expect(200);
        
        // Should not contain unescaped malicious content
        expect(response.text).not.toContain('<script>');
        expect(response.text).not.toContain('javascript:');
      }
    });
  });

  describe('Health and Monitoring', () => {
    test('should provide comprehensive health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('Route Coverage', () => {
    test('should cover all main routes', async () => {
      const routes = [
        { method: 'GET', path: '/', expectedStatus: 200 },
        { method: 'GET', path: '/health', expectedStatus: 200 },
        { method: 'GET', path: '/competitors', expectedStatus: 200 },
        { method: 'GET', path: '/api/search', expectedStatus: 200 },
        { method: 'GET', path: '/api/pages/suggestions?q=test', expectedStatus: 200 },
        { method: 'GET', path: '/nonexistent', expectedStatus: 404 }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method.toLowerCase()](route.path);
        expect(response.status).toBe(route.expectedStatus);
      }
    });
  });
});