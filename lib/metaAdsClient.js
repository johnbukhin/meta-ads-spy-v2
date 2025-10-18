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
        'spend'
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
      
      if (ad.impressions && ad.impressions !== 'undefined' && ad.impressions !== null) {
        console.log('Processing impressions data:', ad.impressions, 'for ad:', ad.id);
        
        // Handle different impression formats
        if (typeof ad.impressions === 'string' && ad.impressions.includes(' - ')) {
          const impressionRange = ad.impressions.split(' - ');
          impressionMin = parseInt(impressionRange[0]?.replace(/[,<>]/g, '') || '0');
          impressionMax = parseInt(impressionRange[1]?.replace(/[,<>]/g, '') || impressionMin.toString());
        } else if (typeof ad.impressions === 'string') {
          // Single value or range like "1,000+" or ">10,000"
          const cleanValue = ad.impressions.replace(/[,<>+]/g, '');
          impressionMin = parseInt(cleanValue || '0');
          impressionMax = impressionMin;
        } else if (typeof ad.impressions === 'object' && ad.impressions.min !== undefined) {
          // Object format with min/max
          impressionMin = ad.impressions.min || 0;
          impressionMax = ad.impressions.max || impressionMin;
        }
      } else {
        console.log('No impressions data for ad:', ad.id);
      }

      // Extract spend range
      let spendMin = 0;
      let spendMax = 0;
      
      if (ad.spend) {
        const spendRange = ad.spend.split(' - ');
        spendMin = parseFloat(spendRange[0]?.replace(/[,$<>]/g, '') || '0');
        spendMax = parseFloat(spendRange[1]?.replace(/[,$<>]/g, '') || spendMin.toString());
      }

      return {
        id: ad.id,
        pageId: ad.page_id,
        pageName: ad.page_name,
        creationTime: ad.ad_creation_time,
        deliveryStartTime: ad.ad_delivery_start_time,
        deliveryStopTime: ad.ad_delivery_stop_time,
        snapshotUrl: ad.ad_snapshot_url,
        currency: ad.currency,
        impressions: {
          raw: ad.impressions,
          min: impressionMin,
          max: impressionMax,
          average: (impressionMin + impressionMax) / 2
        },
        spend: {
          raw: ad.spend,
          min: spendMin,
          max: spendMax,
          average: (spendMin + spendMax) / 2
        },
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
}

module.exports = MetaAdsClient;