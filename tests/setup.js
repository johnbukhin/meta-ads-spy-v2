// Test setup configuration
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'test_token';
process.env.META_APP_ID = process.env.META_APP_ID || 'test_app_id';
process.env.META_APP_SECRET = process.env.META_APP_SECRET || 'test_app_secret';
process.env.PORT = '3001'; // Use different port for tests

// Global test timeout
jest.setTimeout(30000);