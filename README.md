# Meta Ads Spy

A comprehensive Facebook/Meta advertising intelligence tool that helps analyze competitor advertising strategies and discover high-performing ads using the Meta Ads Library API.

## Features

🔍 **Smart Search**
- Search ads by keywords with automatic page detection
- Real-time autocomplete with competitor page suggestions
- Filter by countries, platforms, and date ranges

📊 **Advanced Analytics**
- EU reach data for enhanced insights
- Competitor analysis with aggregated metrics
- Sort by reach, spend, or runtime
- Top performing ads identification

🎨 **Modern UI**
- Dark theme optimized for professional use
- Responsive design for all devices
- Simplified interface with essential filters
- Facebook page avatars and ad snapshots

⚡ **Performance**
- 30-minute intelligent caching
- Rate limiting compliance
- Debounced search with keyboard navigation

## Prerequisites

Before running this application, you need:

1. **Meta Developer Account**: Create an account at https://developers.facebook.com
2. **Meta App**: Create a new app in Meta for Developers
3. **Access Token**: Generate an access token with ads_read permissions
4. **Identity Verification**: Complete Facebook's identity verification process for political/social ads access

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file:
   ```
   META_ACCESS_TOKEN=your_meta_access_token_here
   META_APP_ID=your_app_id_here
   META_APP_SECRET=your_app_secret_here
   PORT=3000
   ```

## Getting Meta API Access

### Step 1: Create Meta App
1. Go to https://developers.facebook.com
2. Click "Get Started" and create a developer account
3. Create a new app and select "Other" as the use case
4. Note your App ID and App Secret

### Step 2: Generate Access Token
1. Go to your app dashboard
2. Navigate to Tools > Graph API Explorer
3. Select your app and generate a User Access Token
4. Add `ads_read` permission
5. Generate token and copy it to your .env file

### Step 3: Identity Verification (Required for Political/Social Ads)
1. Visit https://facebook.com/ID
2. Complete the identity verification process
3. This process can take up to 48 hours

## Usage

### Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

Visit http://localhost:3000 in your browser.

### Web Interface

#### Search Ads
- Enter keywords to search for ads
- Filter by country, date range, impressions, spend
- Sort results by impressions or spend
- View detailed insights and competitor analysis

#### Competitor Analysis
- Navigate to `/competitors`
- Search by industry keywords
- View top competitors ranked by total impressions
- Analyze competitor performance metrics

### API Endpoints

#### Search Ads
```
GET /api/search?q=keyword&sortBy=impressions&sortOrder=desc
```

Parameters:
- `q`: Search term
- `countries`: Comma-separated country codes
- `limit`: Number of results (default: 100)
- `sortBy`: 'impressions' or 'spend'
- `sortOrder`: 'asc' or 'desc'

#### Get Page Info
```
GET /api/page/:pageId
```

## API Limitations

### Meta Ads Library API Restrictions
- **Rate Limit**: 200 calls per hour
- **Geographic Scope**: Only works for ads in EU, Brazil (limited), or political/social ads globally
- **Data Precision**: Impressions and spend are provided as ranges, not exact values
- **Access Requirements**: Requires identity verification for political/social ads

### Data Availability
- Political and social issue ads: Global coverage
- Regular ads: EU and Brazil only
- Historical data: Up to 7 years for political ads, 1 year for EU/Brazil ads

## Project Structure

```
meta-ads-spy/
├── server.js              # Express server and routes
├── lib/
│   └── metaAdsClient.js   # Meta API client
├── services/
│   └── adAnalytics.js     # Data processing and analytics
├── views/
│   └── index.ejs          # Main UI template
├── CLAUDE.md              # Claude Code context documentation
├── REQUIREMENTS.md        # Product requirements document
└── README.md              # This file
```

## Development

For Claude Code sessions, start by reading:
1. `CLAUDE.md` - Full project context and technical details
2. `REQUIREMENTS.md` - Product requirements and feature roadmap

## Key Features Explained

### Impression-Based Sorting
- Ads are sorted by average impressions (calculated from min-max ranges)
- Competitor rankings based on total impression volume
- Performance comparisons across different advertisers

### Advanced Filtering
- Minimum/Maximum impressions and spend thresholds
- Platform-specific filtering (Facebook, Instagram, etc.)
- Active vs inactive ad status
- Date range filtering

### Competitor Intelligence
- Automatic competitor discovery from search results
- Performance metrics aggregation
- Platform usage analysis
- Ad volume and spending patterns

### Rate Limiting & Caching
- Built-in rate limiting to stay within API limits
- 30-minute caching to reduce redundant API calls
- Graceful error handling for rate limit exceeded

## Contributing

This is a functional Meta Ads spy tool. To extend functionality:

1. Add more sophisticated filtering options
2. Implement data export features (CSV, JSON)
3. Add historical tracking and trend analysis
4. Enhance the UI with charts and visualizations
5. Add email alerts for new competitor ads

## Important Notes

- **Legal Compliance**: Ensure you comply with Meta's terms of service and your local data protection laws
- **Rate Limits**: The app respects Meta's 200 calls/hour limit
- **Data Accuracy**: Impression and spend data are estimates provided as ranges
- **Access Requirements**: Full functionality requires completing Meta's identity verification process

## Troubleshooting

### "Rate limit exceeded" error
- Wait for the rate limit to reset (1 hour)
- Reduce search frequency
- Use caching effectively

### "No ads found" for searches
- Verify your access token has correct permissions
- Remember that regular ads are only available for EU/Brazil
- Try searching for political or social issue ads for global coverage

### Authentication errors
- Check that your access token is valid and not expired
- Ensure you've completed identity verification
- Verify your app has the necessary permissions

For support, check the Meta for Developers documentation or create an issue in this repository.