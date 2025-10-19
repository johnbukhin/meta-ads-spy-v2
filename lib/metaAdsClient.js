const axios = require('axios');

class MetaAdsClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://graph.facebook.com/v18.0';
    this.rateLimit = {
      requests: 0,
      resetTime: Date.now() + 3600000 // 1 hour
    };
  }

  async checkRateLimit() {
    if (Date.now() > this.rateLimit.resetTime) {
      this.rateLimit.requests = 0;
      this.rateLimit.resetTime = Date.now() + 3600000;
    }
    
    if (this.rateLimit.requests >= 200) {
      throw new Error('Rate limit exceeded. Try again later.');
    }
    
    this.rateLimit.requests++;
  }

  async tryPageIdSearch(searchTerms, countries, activeStatus, limit) {
    if (!searchTerms || searchTerms.length < 3) return null;
    
    try {
      // First, do a regular search to find pages that match the search term exactly
      const response = await axios.get(`${this.baseURL}/ads_archive`, {
        params: {
          access_token: this.accessToken,
          search_terms: searchTerms,
          ad_reached_countries: countries,
          ad_active_status: activeStatus || 'ALL',
          limit: 10, // Small limit for page detection
          fields: 'page_id,page_name'
        },
        timeout: 30000
      });

      if (!response.data.data || response.data.data.length === 0) return null;

      // Look for exact page name match or close match
      const searchLower = searchTerms.toLowerCase();
      const matchingPage = response.data.data.find(ad => 
        ad.page_name && (
          ad.page_name.toLowerCase() === searchLower ||
          ad.page_name.toLowerCase().includes(searchLower) ||
          searchLower.includes(ad.page_name.toLowerCase())
        )
      );

      if (!matchingPage) return null;

      console.log(`Found page match: "${matchingPage.page_name}" (ID: ${matchingPage.page_id}) for search: "${searchTerms}"`);

      // Now do a page-specific search with reach data fields
      const pageSearchResponse = await axios.get(`${this.baseURL}/ads_archive`, {
        params: {
          access_token: this.accessToken,
          search_page_ids: matchingPage.page_id,
          ad_reached_countries: countries,
          ad_active_status: activeStatus || 'ALL',
          limit: limit || 100,
          fields: [
            'id',
            'ad_creation_time',
            'ad_creative_bodies',
            'ad_creative_link_captions',
            'ad_creative_link_descriptions',
            'ad_creative_link_titles',
            'ad_delivery_start_time',
            'ad_delivery_stop_time',
            'ad_snapshot_url',
            'bylines',
            'currency',
            'demographic_distribution',
            'impressions',
            'page_id',
            'page_name',
            'publisher_platforms',
            'spend',
            'estimated_audience_size',
            'reach',
            'eu_total_reach',
            'age_country_gender_reach_breakdown',
            'target_ages',
            'target_gender',
            'target_locations'
          ].join(',')
        },
        timeout: 30000
      });

      console.log('Page-specific API Response sample:', JSON.stringify(pageSearchResponse.data.data?.[0], null, 2));
      return this.processAdsData(pageSearchResponse.data);

    } catch (error) {
      console.log('Page ID search failed, falling back to regular search:', error.message);
      return null; // Fall back to regular search
    }
  }

  async searchAds(params = {}) {
    await this.checkRateLimit();
    
    // EU and LATAM countries that have data access in Meta Ads Library
    const defaultCountries = [
      // EU Countries
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 
      'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 
      'SI', 'ES', 'SE', 'GB', 'NO', 'IS', 'LI', 'CH',
      // LATAM Countries
      'BR', 'AR', 'CL', 'CO', 'MX', 'PE', 'UY'
    ];
    
    // Try to detect if search term is a specific page we should search by page ID
    console.log('Checking for page-specific search for term:', params.searchTerms);
    const pageSearchResult = await this.tryPageIdSearch(params.searchTerms, defaultCountries, params.activeStatus, params.limit);
    if (pageSearchResult) {
      console.log('Using page ID search for:', params.searchTerms);
      return pageSearchResult;
    }
    console.log('No page match found, using regular search for:', params.searchTerms);
    
    const defaultParams = {
      access_token: this.accessToken,
      search_terms: params.searchTerms || '',
      ad_reached_countries: params.countries && params.countries.length > 0 && params.countries[0] !== 'ALL' 
        ? params.countries 
        : defaultCountries,
      ad_active_status: params.activeStatus || 'ALL',
      limit: params.limit || 100,
      fields: [
        'id',
        'ad_creation_time',
        'ad_creative_bodies',
        'ad_creative_link_captions',
        'ad_creative_link_descriptions',
        'ad_creative_link_titles',
        'ad_delivery_start_time',
        'ad_delivery_stop_time',
        'ad_snapshot_url',
        'bylines',
        'currency',
        'demographic_distribution',
        'impressions',
        'page_id',
        'page_name',
        'publisher_platforms',
        'spend',
        'estimated_audience_size',
        'reach',
        'eu_total_reach',
        'age_country_gender_reach_breakdown',
        'target_ages',
        'target_gender',
        'target_locations'
      ].join(',')
    };

    // Add search page filter if provided
    if (params.searchPageIds) {
      defaultParams.search_page_ids = params.searchPageIds;
    }

    // Add date filters if provided
    if (params.adDeliveryDateMin) {
      defaultParams.ad_delivery_date_min = params.adDeliveryDateMin;
    }
    if (params.adDeliveryDateMax) {
      defaultParams.ad_delivery_date_max = params.adDeliveryDateMax;
    }

    try {
      const response = await axios.get(`${this.baseURL}/ads_archive`, {
        params: defaultParams,
        timeout: 30000
      });

      console.log('Meta API Response sample:', JSON.stringify(response.data.data?.[0], null, 2));
      return this.processAdsData(response.data);
    } catch (error) {
      console.error('Error fetching ads:', error.response?.data || error.message);
      throw new Error(`Failed to fetch ads: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  processAdsData(data) {
    if (!data.data) {
      return { ads: [], pagination: null };
    }

    const processedAds = data.data.map(ad => {
      // Extract impression range
      let impressionMin = 0;
      let impressionMax = 0;
      let impressionRaw = null;
      
      if (ad.impressions && ad.impressions !== 'undefined' && ad.impressions !== null) {
        console.log('Processing impressions data:', ad.impressions, 'for ad:', ad.id);
        
        // Handle different impression formats
        if (typeof ad.impressions === 'object' && ad.impressions.lower_bound !== undefined) {
          // New API format: {"lower_bound": "60000", "upper_bound": "69999"}
          impressionMin = parseInt(ad.impressions.lower_bound || '0');
          impressionMax = parseInt(ad.impressions.upper_bound || impressionMin.toString());
          impressionRaw = `${impressionMin.toLocaleString()} - ${impressionMax.toLocaleString()}`;
        } else if (typeof ad.impressions === 'object' && ad.impressions.min !== undefined) {
          // Old object format with min/max
          impressionMin = ad.impressions.min || 0;
          impressionMax = ad.impressions.max || impressionMin;
          impressionRaw = `${impressionMin.toLocaleString()} - ${impressionMax.toLocaleString()}`;
        } else if (typeof ad.impressions === 'string' && ad.impressions.includes(' - ')) {
          // String format: "1,000 - 5,000"
          const impressionRange = ad.impressions.split(' - ');
          impressionMin = parseInt(impressionRange[0]?.replace(/[,<>]/g, '') || '0');
          impressionMax = parseInt(impressionRange[1]?.replace(/[,<>]/g, '') || impressionMin.toString());
          impressionRaw = ad.impressions;
        } else if (typeof ad.impressions === 'string') {
          // Single value or range like "1,000+" or ">10,000"
          const cleanValue = ad.impressions.replace(/[,<>+]/g, '');
          impressionMin = parseInt(cleanValue || '0');
          impressionMax = impressionMin;
          impressionRaw = ad.impressions;
        }
      } else {
        console.log('No impressions data for ad:', ad.id);
      }

      // Extract spend range
      let spendMin = 0;
      let spendMax = 0;
      let spendRaw = null;
      
      if (ad.spend && ad.spend !== 'undefined' && ad.spend !== null) {
        if (typeof ad.spend === 'object' && ad.spend.lower_bound !== undefined) {
          // New API format: {"lower_bound": "3000", "upper_bound": "3499"}
          spendMin = parseFloat(ad.spend.lower_bound || '0');
          spendMax = parseFloat(ad.spend.upper_bound || spendMin.toString());
          spendRaw = `$${spendMin.toLocaleString()} - $${spendMax.toLocaleString()}`;
        } else if (typeof ad.spend === 'object' && ad.spend.min !== undefined) {
          // Old object format
          spendMin = ad.spend.min || 0;
          spendMax = ad.spend.max || spendMin;
          spendRaw = `$${spendMin.toLocaleString()} - $${spendMax.toLocaleString()}`;
        } else if (typeof ad.spend === 'string') {
          // String format
          const spendRange = ad.spend.split(' - ');
          spendMin = parseFloat(spendRange[0]?.replace(/[,$<>]/g, '') || '0');
          spendMax = parseFloat(spendRange[1]?.replace(/[,$<>]/g, '') || spendMin.toString());
          spendRaw = ad.spend;
        }
      }

      // Calculate ad runtime
      let runtimeDays = 0;
      if (ad.ad_delivery_start_time) {
        const startDate = new Date(ad.ad_delivery_start_time);
        const endDate = ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : new Date();
        runtimeDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      }

      // Process EU total reach and breakdown
      let reachData = {
        raw: ad.reach || ad.estimated_audience_size || null,
        estimated: ad.estimated_audience_size || null,
        euTotal: ad.eu_total_reach || null,
        breakdown: ad.age_country_gender_reach_breakdown || [],
        demographicBased: this.calculateReachFromDemographics(ad.demographic_distribution, impressionMin, impressionMax)
      };
      

      // Process targeting data
      const targeting = {
        ages: ad.target_ages || null,
        gender: ad.target_gender || null,
        locations: ad.target_locations || []
      };

      return {
        id: ad.id,
        pageId: ad.page_id,
        pageName: ad.page_name,
        creationTime: ad.ad_creation_time,
        deliveryStartTime: ad.ad_delivery_start_time,
        deliveryStopTime: ad.ad_delivery_stop_time,
        snapshotUrl: ad.ad_snapshot_url,
        currency: ad.currency,
        runtimeDays: runtimeDays,
        isActive: !ad.ad_delivery_stop_time,
        impressions: {
          raw: impressionRaw || ad.impressions,
          min: impressionMin,
          max: impressionMax,
          average: (impressionMin + impressionMax) / 2
        },
        reach: reachData,
        spend: {
          raw: spendRaw || ad.spend,
          min: spendMin,
          max: spendMax,
          average: (spendMin + spendMax) / 2
        },
        targeting: targeting,
        creative: {
          bodies: ad.ad_creative_bodies || [],
          linkCaptions: ad.ad_creative_link_captions || [],
          linkDescriptions: ad.ad_creative_link_descriptions || [],
          linkTitles: ad.ad_creative_link_titles || []
        },
        demographics: ad.demographic_distribution || [],
        platforms: ad.publisher_platforms || [],
        bylines: ad.bylines
      };
    });

    return {
      ads: processedAds,
      pagination: data.paging || null
    };
  }

  async getPageInfo(pageId) {
    await this.checkRateLimit();
    
    try {
      const response = await axios.get(`${this.baseURL}/${pageId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,category,category_list,link,fan_count,followers_count'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching page info:', error.response?.data || error.message);
      return null;
    }
  }

  calculateReachFromDemographics(demographics, impressionMin, impressionMax) {
    if (!demographics || !Array.isArray(demographics) || demographics.length === 0) {
      return null;
    }

    // Calculate total percentage (should be close to 1.0)
    const totalPercentage = demographics.reduce((sum, demo) => sum + parseFloat(demo.percentage || 0), 0);
    
    if (totalPercentage === 0) return null;

    // Estimate reach based on impression range and demographic diversity
    const avgImpressions = (impressionMin + impressionMax) / 2;
    const demographicGroups = demographics.length;
    
    // Basic reach estimation: impressions divided by estimated frequency
    // More demographic groups typically means lower frequency (broader reach)
    const estimatedFrequency = Math.max(1.2, Math.min(3.0, 4.0 - (demographicGroups / 5)));
    const estimatedReach = Math.round(avgImpressions / estimatedFrequency);

    return {
      estimated: estimatedReach,
      confidence: demographicGroups > 10 ? 'high' : demographicGroups > 5 ? 'medium' : 'low',
      demographicGroups: demographicGroups,
      totalPercentage: Math.round(totalPercentage * 100),
      method: 'demographic_extrapolation'
    };
  }
}

module.exports = MetaAdsClient;