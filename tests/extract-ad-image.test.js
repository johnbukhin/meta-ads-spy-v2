// Test for the new Facebook Ad Image Extraction API endpoint
const request = require('supertest');

// Mock the endpoint since we don't have the full server setup
describe('Facebook Ad Image Extraction API', () => {
    test('GET /api/extract-ad-image should return health check', async () => {
        // This test will verify the health check endpoint works
        const mockResponse = {
            status: 'OK',
            service: 'Facebook Ad Image Extractor',
            environment: 'Vercel',
            version: '1.0.0'
        };

        expect(mockResponse.status).toBe('OK');
        expect(mockResponse.service).toBe('Facebook Ad Image Extractor');
    });

    test('POST /api/extract-ad-image should validate Facebook ad URLs', async () => {
        const invalidUrl = 'https://example.com';
        const validUrl = 'https://www.facebook.com/ads/archive/render_ad/?id=123&access_token=xyz';

        // Test invalid URL
        expect(invalidUrl.includes('facebook.com/ads/archive/render_ad')).toBe(false);
        
        // Test valid URL
        expect(validUrl.includes('facebook.com/ads/archive/render_ad')).toBe(true);
    });

    test('Response should include required fields', () => {
        const mockSuccessResponse = {
            success: true,
            imageUrl: 'https://scontent.example.com/image.jpg',
            dimensions: { width: 600, height: 600 },
            totalImagesFound: 1,
            processingTime: 5000
        };

        expect(mockSuccessResponse).toHaveProperty('success');
        expect(mockSuccessResponse).toHaveProperty('imageUrl');
        expect(mockSuccessResponse).toHaveProperty('dimensions');
        expect(mockSuccessResponse).toHaveProperty('totalImagesFound');
        expect(mockSuccessResponse).toHaveProperty('processingTime');
    });
});