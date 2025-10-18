require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const MetaAdsClient = require('./lib/metaAdsClient');
const AdAnalytics = require('./services/adAnalytics');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize services
const metaClient = new MetaAdsClient(process.env.META_ACCESS_TOKEN);
const analytics = new AdAnalytics();

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Meta Ads Spy',
    error: null,
    results: null 
  });
});

app.post('/search', async (req, res) => {
  try {
    const {
      searchTerms,
      countries,
      searchPageIds,
      limit,
      sortBy,
      sortOrder,
      minImpressions,
      maxImpressions,
      minSpend,
      maxSpend,
      platform,
      activeOnly,
      startDate,
      endDate
    } = req.body;

    // Build search parameters
    const searchParams = {
      searchTerms: searchTerms || '',
      countries: countries && countries.trim() ? countries.split(',').map(c => c.trim()) : ['ALL'],
      searchPageIds: searchPageIds ? searchPageIds.split(',').map(id => id.trim()) : undefined,
      limit: parseInt(limit) || 100
    };

    // Add date filters if provided
    if (startDate) searchParams.adDeliveryDateMin = startDate;
    if (endDate) searchParams.adDeliveryDateMax = endDate;

    // Check cache first
    const cacheKey = JSON.stringify(searchParams);
    let adsData = analytics.getCachedData(cacheKey);

    if (!adsData) {
      // Fetch from API
      const response = await metaClient.searchAds(searchParams);
      adsData = response.ads;
      analytics.setCachedData(cacheKey, adsData);
    }

    // Apply additional filters
    const filters = {
      minImpressions: minImpressions ? parseInt(minImpressions) : undefined,
      maxImpressions: maxImpressions ? parseInt(maxImpressions) : undefined,
      minSpend: minSpend ? parseFloat(minSpend) : undefined,
      maxSpend: maxSpend ? parseFloat(maxSpend) : undefined,
      platform: platform || undefined,
      activeOnly: activeOnly === 'true' ? true : activeOnly === 'false' ? false : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      pageId: req.body.pageId || undefined
    };

    let filteredAds = analytics.filterAds(adsData, filters);

    // Sort results
    if (sortBy === 'spend') {
      filteredAds = analytics.sortAdsBySpend(filteredAds, sortOrder || 'desc');
    } else {
      filteredAds = analytics.sortAdsByImpressions(filteredAds, sortOrder || 'desc');
    }

    // Get insights and competitor analysis
    const insights = analytics.getAdInsights(filteredAds);
    const competitors = analytics.getCompetitorAnalysis(filteredAds);
    const topAds = analytics.getTopPerformingAds(filteredAds, sortBy || 'impressions', 10);

    const results = {
      ads: filteredAds,
      insights,
      competitors,
      topAds,
      totalResults: filteredAds.length,
      searchParams: req.body
    };

    res.render('index', { 
      title: 'Meta Ads Spy',
      error: null,
      results 
    });

  } catch (error) {
    console.error('Search error:', error);
    res.render('index', { 
      title: 'Meta Ads Spy',
      error: error.message,
      results: null 
    });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const searchParams = {
      searchTerms: req.query.q || '',
      countries: req.query.countries && req.query.countries.trim() ? req.query.countries.split(',') : ['ALL'],
      limit: parseInt(req.query.limit) || 100
    };

    const response = await metaClient.searchAds(searchParams);
    let ads = response.ads;

    // Apply sorting
    const sortBy = req.query.sortBy || 'impressions';
    const sortOrder = req.query.sortOrder || 'desc';

    if (sortBy === 'spend') {
      ads = analytics.sortAdsBySpend(ads, sortOrder);
    } else {
      ads = analytics.sortAdsByImpressions(ads, sortOrder);
    }

    const insights = analytics.getAdInsights(ads);
    const competitors = analytics.getCompetitorAnalysis(ads);

    res.json({
      success: true,
      data: {
        ads,
        insights,
        competitors,
        pagination: response.pagination
      }
    });

  } catch (error) {
    console.error('API search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/page/:pageId', async (req, res) => {
  try {
    const pageInfo = await metaClient.getPageInfo(req.params.pageId);
    res.json({
      success: true,
      data: pageInfo
    });
  } catch (error) {
    console.error('Page info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/competitors', async (req, res) => {
  const searchTerm = req.query.q || '';
  
  try {
    if (!searchTerm) {
      return res.render('competitors', { 
        title: 'Competitor Analysis',
        competitors: [],
        searchTerm: ''
      });
    }

    const searchParams = {
      searchTerms: searchTerm,
      limit: 500
    };

    const response = await metaClient.searchAds(searchParams);
    const competitors = analytics.getCompetitorAnalysis(response.ads);

    res.render('competitors', { 
      title: 'Competitor Analysis',
      competitors,
      searchTerm
    });

  } catch (error) {
    console.error('Competitors error:', error);
    res.render('competitors', { 
      title: 'Competitor Analysis',
      competitors: [],
      searchTerm,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error',
    message: 'Something went wrong!' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    title: '404',
    message: 'Page not found' 
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('./package.json').version
  });
});

// Only listen if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Meta Ads Spy server running at http://localhost:${port}`);
    
    if (!process.env.META_ACCESS_TOKEN) {
      console.warn('WARNING: META_ACCESS_TOKEN not set. Please configure your .env file.');
    }
  });
}

// Export the app for Vercel
module.exports = app;