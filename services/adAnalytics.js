class AdAnalytics {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  sortAdsByReach(ads, sortOrder = 'desc') {
    return ads.sort((a, b) => {
      const aReach = a.reach?.euTotal || a.reach?.estimated || a.reach?.demographicBased?.estimated || 0;
      const bReach = b.reach?.euTotal || b.reach?.estimated || b.reach?.demographicBased?.estimated || 0;
      
      if (sortOrder === 'desc') {
        return bReach - aReach;
      } else {
        return aReach - bReach;
      }
    });
  }

  sortAdsByRuntime(ads, sortOrder = 'desc') {
    return ads.sort((a, b) => {
      const aRuntime = a.runtimeDays || 0;
      const bRuntime = b.runtimeDays || 0;
      
      if (sortOrder === 'desc') {
        return bRuntime - aRuntime;
      } else {
        return aRuntime - bRuntime;
      }
    });
  }

  sortAdsByImpressions(ads, sortOrder = 'desc') {
    return ads.sort((a, b) => {
      const aImpressions = a.impressions.average;
      const bImpressions = b.impressions.average;
      
      if (sortOrder === 'desc') {
        return bImpressions - aImpressions;
      } else {
        return aImpressions - bImpressions;
      }
    });
  }

  sortAdsBySpend(ads, sortOrder = 'desc') {
    return ads.sort((a, b) => {
      const aSpend = a.spend.average;
      const bSpend = b.spend.average;
      
      if (sortOrder === 'desc') {
        return bSpend - aSpend;
      } else {
        return aSpend - bSpend;
      }
    });
  }

  getCompetitorAnalysis(ads) {
    const competitorMap = new Map();

    ads.forEach(ad => {
      const pageId = ad.pageId;
      const pageName = ad.pageName;

      if (!competitorMap.has(pageId)) {
        competitorMap.set(pageId, {
          pageId,
          pageName,
          totalAds: 0,
          totalImpressions: { min: 0, max: 0, average: 0 },
          totalSpend: { min: 0, max: 0, average: 0 },
          ads: [],
          activeAds: 0,
          platforms: new Set(),
          demographics: new Map()
        });
      }

      const competitor = competitorMap.get(pageId);
      competitor.totalAds++;
      competitor.ads.push(ad);

      // Aggregate impressions
      competitor.totalImpressions.min += ad.impressions.min;
      competitor.totalImpressions.max += ad.impressions.max;
      competitor.totalImpressions.average += ad.impressions.average;

      // Aggregate spend
      competitor.totalSpend.min += ad.spend.min;
      competitor.totalSpend.max += ad.spend.max;
      competitor.totalSpend.average += ad.spend.average;

      // Count active ads
      if (!ad.deliveryStopTime) {
        competitor.activeAds++;
      }

      // Collect platforms
      ad.platforms.forEach(platform => competitor.platforms.add(platform));

      // Collect demographics
      ad.demographics.forEach(demo => {
        const key = `${demo.age}:${demo.gender}`;
        if (!competitor.demographics.has(key)) {
          competitor.demographics.set(key, 0);
        }
        competitor.demographics.set(key, competitor.demographics.get(key) + 1);
      });
    });

    // Convert to array and sort by total impressions
    return Array.from(competitorMap.values())
      .map(competitor => ({
        ...competitor,
        platforms: Array.from(competitor.platforms),
        demographics: Object.fromEntries(competitor.demographics),
        averageImpressionsPerAd: competitor.totalImpressions.average / competitor.totalAds,
        averageSpendPerAd: competitor.totalSpend.average / competitor.totalAds
      }))
      .sort((a, b) => b.totalImpressions.average - a.totalImpressions.average);
  }

  filterAds(ads, filters = {}) {
    let filteredAds = [...ads];

    // Filter by search term in creative content
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredAds = filteredAds.filter(ad => {
        const content = [
          ...ad.creative.bodies,
          ...ad.creative.linkTitles,
          ...ad.creative.linkDescriptions,
          ...ad.creative.linkCaptions,
          ad.pageName
        ].join(' ').toLowerCase();
        
        return content.includes(searchTerm);
      });
    }

    // Filter by minimum impressions
    if (filters.minImpressions) {
      filteredAds = filteredAds.filter(ad => 
        ad.impressions.average >= filters.minImpressions
      );
    }

    // Filter by maximum impressions
    if (filters.maxImpressions) {
      filteredAds = filteredAds.filter(ad => 
        ad.impressions.average <= filters.maxImpressions
      );
    }

    // Filter by minimum spend
    if (filters.minSpend) {
      filteredAds = filteredAds.filter(ad => 
        ad.spend.average >= filters.minSpend
      );
    }

    // Filter by maximum spend
    if (filters.maxSpend) {
      filteredAds = filteredAds.filter(ad => 
        ad.spend.average <= filters.maxSpend
      );
    }

    // Filter by platform
    if (filters.platform) {
      filteredAds = filteredAds.filter(ad => 
        ad.platforms.includes(filters.platform)
      );
    }

    // Filter by active status
    if (filters.activeOnly === true) {
      filteredAds = filteredAds.filter(ad => !ad.deliveryStopTime);
    } else if (filters.activeOnly === false) {
      filteredAds = filteredAds.filter(ad => ad.deliveryStopTime);
    }

    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredAds = filteredAds.filter(ad => 
        new Date(ad.deliveryStartTime) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredAds = filteredAds.filter(ad => {
        const adEndDate = ad.deliveryStopTime ? 
          new Date(ad.deliveryStopTime) : new Date();
        return adEndDate <= endDate;
      });
    }

    // Filter by page ID (competitor filter)
    if (filters.pageId) {
      filteredAds = filteredAds.filter(ad => ad.pageId === filters.pageId);
    }

    return filteredAds;
  }

  getTopPerformingAds(ads, metric = 'reach', limit = 10) {
    let sortedAds;
    if (metric === 'spend') {
      sortedAds = this.sortAdsBySpend(ads);
    } else if (metric === 'runtime') {
      sortedAds = this.sortAdsByRuntime(ads);
    } else if (metric === 'reach') {
      sortedAds = this.sortAdsByReach(ads);
    } else if (metric === 'impressions') {
      sortedAds = this.sortAdsByImpressions(ads);
    } else {
      sortedAds = this.sortAdsByReach(ads);
    }
    
    return sortedAds.slice(0, limit);
  }

  getAdInsights(ads) {
    if (ads.length === 0) {
      return {
        totalAds: 0,
        totalImpressions: 0,
        totalSpend: 0,
        averageImpressions: 0,
        averageSpend: 0,
        topPlatforms: [],
        uniqueCompetitors: 0
      };
    }

    const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions.average, 0);
    const totalSpend = ads.reduce((sum, ad) => sum + ad.spend.average, 0);
    
    const platformCounts = new Map();
    const uniquePages = new Set();
    
    ads.forEach(ad => {
      uniquePages.add(ad.pageId);
      ad.platforms.forEach(platform => {
        platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1);
      });
    });

    const topPlatforms = Array.from(platformCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([platform, count]) => ({ platform, count }));

    return {
      totalAds: ads.length,
      totalImpressions,
      totalSpend,
      averageImpressions: totalImpressions / ads.length,
      averageSpend: totalSpend / ads.length,
      topPlatforms,
      uniqueCompetitors: uniquePages.size
    };
  }

  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = AdAnalytics;