# Meta Ads Spy - Claude Code Context

## Project Overview
Meta Ads Spy is a web application that allows users to search and analyze Facebook/Meta advertising data using the Meta Ads Library API. The tool provides insights into competitor advertising strategies, spending patterns, and creative content.

## Key Technologies
- **Backend**: Node.js with Express.js
- **Frontend**: EJS templating with Bootstrap and custom CSS
- **API**: Meta Graph API v18.0 (Ads Library)
- **Database**: In-memory caching (Map-based)
- **Deployment**: Vercel (production) + local development

## Core Features Implemented

### 1. Ad Search & Discovery
- **Basic Search**: Search ads by keywords, countries, and date ranges
- **Page-Specific Search**: Automatic detection of page names to switch to page ID search for better reach data
- **Advanced Filtering**: Platform filtering, active status filtering
- **Autocomplete Dropdown**: Real-time suggestions showing competitor Facebook pages with avatars, names, and IDs

### 2. Data Processing & Analytics
- **EU Reach Data**: Special handling for EU/LATAM countries with enhanced reach metrics
- **Impression Processing**: Handles multiple API response formats (object with lower_bound/upper_bound, string ranges)
- **Spend Analysis**: Converts spend ranges to min/max/average values
- **Runtime Calculation**: Days since ad started running
- **Competitor Analysis**: Aggregates data by page/advertiser

### 3. UI/UX Features
- **Dark Theme**: Custom CSS with dark mode design
- **Responsive Design**: Bootstrap-based responsive layout
- **Real-time Autocomplete**: Debounced search with keyboard navigation
- **Simplified Interface**: Removed complex filters (min/max impressions/spend) for better usability
- **Interactive Results**: Sortable results by reach, spend, runtime
- **Visual Elements**: Facebook page avatars, ad snapshots, platform icons

### 4. Performance & Reliability
- **Caching System**: 30-minute cache for API responses
- **Rate Limiting**: Built-in rate limiting for Meta API (200 requests/hour)
- **Error Handling**: Comprehensive error handling with fallbacks
- **Timeout Protection**: 30-second timeouts for API calls

## Environment Configuration
```
META_ACCESS_TOKEN=<your_token>
META_APP_ID=<your_app_id>
META_APP_SECRET=<your_app_secret>
PORT=3000
```

## API Endpoints

### Main Routes
- `GET /` - Main search interface
- `POST /search` - Process search form and display results
- `GET /competitors` - Competitor analysis page
- `GET /health` - Health check endpoint

### API Endpoints
- `GET /api/search` - JSON API for ad search
- `GET /api/page/:pageId` - Get specific page information
- `GET /api/pages/suggestions` - Autocomplete suggestions for pages

## File Structure
```
/Users/yevhen/meta-ads-spy/
├── server.js                 # Main Express server
├── lib/
│   └── metaAdsClient.js     # Meta API client wrapper
├── services/
│   └── adAnalytics.js       # Data processing and analytics
├── views/
│   └── index.ejs            # Main template with search UI
├── public/                  # Static assets
├── .env                     # Environment variables
└── package.json             # Dependencies
```

## Development Commands
- `npm start` - Start development server on http://localhost:3000
- `npm run dev` - Start with nodemon (if configured)

## Recent Improvements (Session History)
1. **UI Simplification**: Removed Advanced Filters section (min/max impressions, min/max spend)
2. **Autocomplete Feature**: Added real-time page suggestions with Facebook avatars
3. **Enhanced API**: New `/api/pages/suggestions` endpoint
4. **Better UX**: Keyboard navigation, click handling, debounced search
5. **Cache Resolution**: Fixed Vercel deployment caching issues
6. **Testing Framework**: Comprehensive automated test suite with Jest and Supertest

## Known Technical Details
- **Meta API Rate Limits**: 200 requests per hour per access token
- **EU Data Availability**: Enhanced reach data available for EU/LATAM countries
- **Cache Duration**: 30 minutes for search results
- **Autocomplete Trigger**: 2+ characters required
- **Default Countries**: EU + LATAM countries for better data coverage

## Future Enhancement Areas
- Export functionality (CSV/Excel)
- Advanced analytics dashboards
- Historical data tracking
- Bulk competitor analysis
- Ad creative analysis tools
- Performance benchmarking

## Troubleshooting Notes
- **Empty Results**: Check environment variables in deployment
- **Cache Issues**: Use private/incognito mode for testing
- **API Errors**: Verify access token validity and rate limits
- **Server Restart**: Required after adding new API endpoints

## Context for New Sessions
When starting a new Claude Code session:
1. Read this CLAUDE.md file first for full project context
2. Check recent git commits for latest changes
3. Review server.js and views/index.ejs for current implementation
4. Test autocomplete functionality at http://localhost:3000
5. Verify environment variables are properly configured

---
*This document should be updated with each significant feature addition or change.*