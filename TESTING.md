# Testing Strategy for Meta Ads Spy

## Overview
This document outlines the comprehensive testing framework for the Meta Ads Spy application, ensuring all key functionality works properly after code changes and deployments.

## Test Structure

### 1. Unit Tests
**Location**: `tests/`
**Purpose**: Test individual components in isolation

#### `adAnalytics.test.js`
- **Sorting Functions**: Tests all sorting methods (reach, spend, runtime, impressions)
- **Filtering Logic**: Tests all filter combinations (impressions, spend, platform, status, dates)
- **Analytics Calculations**: Tests competitor analysis and insights generation
- **Caching System**: Tests cache storage, retrieval, and expiration
- **Edge Cases**: Tests empty data, invalid inputs, and boundary conditions

#### `metaAdsClient.test.js`
- **API Integration**: Tests Meta API client with mocked responses
- **Data Processing**: Tests conversion of API responses to internal format
- **Rate Limiting**: Tests rate limit enforcement and reset logic
- **Error Handling**: Tests API error scenarios and fallbacks
- **Reach Calculations**: Tests demographic-based reach estimation

### 2. API Tests
**Location**: `tests/server.test.js`
**Purpose**: Test HTTP endpoints and request/response handling

#### Endpoint Coverage
- `GET /` - Main interface rendering
- `POST /search` - Search form processing
- `GET /api/search` - JSON search API
- `GET /api/pages/suggestions` - Autocomplete suggestions
- `GET /api/page/:pageId` - Page information retrieval
- `GET /health` - Health check endpoint
- `GET /competitors` - Competitor analysis page

#### Test Scenarios
- **Success Cases**: Valid requests with expected responses
- **Error Handling**: Invalid inputs, API failures, rate limiting
- **Parameter Validation**: Different combinations of search parameters
- **Response Formats**: Consistent JSON structure validation
- **Caching Behavior**: Cache hits and misses

### 3. Integration Tests
**Location**: `tests/integration.test.js`
**Purpose**: Test complete user workflows and system behavior

#### Full Workflow Tests
- **Search Flow**: Complete search from form submission to results display
- **Autocomplete Flow**: Real-time suggestions and selection
- **Navigation Flow**: Page-to-page navigation and state management
- **Error Recovery**: System behavior during failures

#### Cross-Component Tests
- **Data Flow**: From API → Processing → UI rendering
- **Cache Integration**: Multi-request caching behavior
- **Security**: Input sanitization and XSS prevention
- **Performance**: Response time validation

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test adAnalytics.test.js

# Run specific test suite
npm test -- --testNamePattern="Sorting"
```

### Coverage Targets
- **Overall Coverage**: > 80%
- **Critical Functions**: > 95%
- **API Endpoints**: 100%
- **Error Paths**: > 70%

## Continuous Integration

### Pre-Deployment Checklist
1. **All tests pass**: `npm test`
2. **Coverage meets targets**: `npm run test:coverage`
3. **No security vulnerabilities**: `npm audit`
4. **Linting passes**: `npm run lint` (if configured)

### GitHub Actions Integration (Recommended)
Create `.github/workflows/test.yml`:
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Test Data Management

### Mock Data Strategy
- **Consistent Test Data**: Use shared mock objects across tests
- **Edge Cases**: Include boundary conditions and invalid data
- **Realistic Data**: Mirror actual API response formats
- **Isolation**: Each test uses fresh data to prevent interference

### Environment Configuration
- **Test Environment**: Separate configuration from production
- **Mock APIs**: No actual Meta API calls during testing
- **Test Database**: In-memory or separate test data storage

## Quality Gates

### Required for Deployment
1. **All tests pass** ✅
2. **Coverage above 80%** ✅
3. **No critical security issues** ✅
4. **Performance tests pass** ✅

### Code Quality Checks
- **TypeScript/ESLint**: Static analysis (if configured)
- **Dependency Audit**: Security vulnerability scanning
- **Bundle Size**: Performance impact assessment

## Test Maintenance

### Regular Updates
- **New Features**: Add tests for every new feature
- **Bug Fixes**: Add regression tests for fixed bugs
- **API Changes**: Update mocks when Meta API changes
- **Performance**: Add performance regression tests

### Documentation Updates
- **Test Coverage**: Update this document when adding new test types
- **Known Issues**: Document any test limitations or known flaky tests
- **Dependencies**: Keep test dependency versions updated

## Debugging Failed Tests

### Common Issues
1. **Environment Variables**: Ensure test environment is properly configured
2. **Async Operations**: Check for proper async/await usage and timeouts
3. **Mock Mismatches**: Verify mocks match actual API behavior
4. **Race Conditions**: Look for timing-dependent test failures

### Debug Commands
```bash
# Run single test with verbose output
npm test -- --verbose adAnalytics.test.js

# Run tests with debug logging
DEBUG=* npm test

# Run tests without coverage (faster for debugging)
npm test -- --collectCoverage=false
```

## Performance Testing

### Response Time Targets
- **API Endpoints**: < 500ms average
- **Search Results**: < 2 seconds
- **Autocomplete**: < 200ms
- **Page Load**: < 3 seconds

### Load Testing (Manual)
```bash
# Install autocannon for load testing
npm install -g autocannon

# Test search endpoint
autocannon -c 10 -d 30 http://localhost:3000/api/search?q=test

# Test autocomplete endpoint
autocannon -c 20 -d 15 http://localhost:3000/api/pages/suggestions?q=fitness
```

## Security Testing

### Automated Security Checks
- **Dependency Vulnerabilities**: `npm audit`
- **Input Validation**: XSS and injection prevention tests
- **Authentication**: Access control verification
- **Rate Limiting**: Abuse prevention testing

### Manual Security Testing
- **Cross-Site Scripting (XSS)**: Manual input testing
- **SQL Injection**: Database query safety (if applicable)
- **Authentication Bypass**: Access control verification
- **Rate Limit Evasion**: Abuse scenario testing

## Deployment Validation

### Smoke Tests (Production)
After deployment, run these quick validation tests:

1. **Health Check**: `curl https://your-domain.com/health`
2. **Main Page**: Verify UI loads correctly
3. **Search Function**: Test basic search functionality
4. **API Endpoints**: Verify all APIs respond correctly

### Rollback Criteria
If any of these fail, consider rollback:
- Health check returns error
- Critical functionality broken
- Performance degradation > 50%
- Error rate > 5%

---

**Remember**: Tests are your safety net. Run them before every deployment and keep them updated as your application evolves.