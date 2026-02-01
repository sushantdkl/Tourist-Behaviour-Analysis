const express = require('express');
const router = express.Router();
const dataLoader = require('../data/dataLoader');
const advancedAnalytics = require('../analytics/advancedAnalytics');
const vendorAnalytics = require('../analytics/vendorAnalytics');
const ss = require('simple-statistics');
const _ = require('lodash');

// Load data once
let data = null;
function getData() {
    if (!data) {
        data = dataLoader.loadAll();
    }
    return data;
}

// =========== OVERVIEW ENDPOINTS ===========
router.get('/overview', (req, res) => {
    const { tourists, attractions, accommodations, visits } = getData();
    
    const overview = {
        totalTourists: tourists.length,
        totalAttractions: attractions.length,
        totalAccommodations: accommodations.length,
        totalVisits: visits.length,
        avgSpending: Math.round(ss.mean(tourists.map(t => t.total_spent_npr))),
        avgDuration: ss.mean(tourists.map(t => t.duration_days)).toFixed(1),
        avgSatisfaction: ss.mean(tourists.map(t => t.satisfaction_score)).toFixed(2),
        recommendRate: ((tourists.filter(t => t.would_recommend).length / tourists.length) * 100).toFixed(1),
        guideUsageRate: ((tourists.filter(t => t.uses_tour_guide).length / tourists.length) * 100).toFixed(1),
        totalRevenue: Math.round(tourists.reduce((sum, t) => sum + t.total_spent_npr, 0)),
        topNationalities: getTopN(tourists.map(t => t.nationality), 10),
        seasonDistribution: getDistribution(tourists, 'season'),
        purposeDistribution: getDistribution(tourists, 'travel_purpose'),
        accommodationDistribution: getDistribution(tourists, 'accommodation_type')
    };
    
    res.json(overview);
});

router.get('/spending-breakdown', (req, res) => {
    const { tourists } = getData();
    
    const breakdown = {
        accommodation: Math.round(ss.mean(tourists.map(t => t.accommodation_cost_npr))),
        food: Math.round(ss.mean(tourists.map(t => t.food_cost_npr))),
        shopping: Math.round(ss.mean(tourists.map(t => t.shopping_cost_npr))),
        activities: Math.round(ss.mean(tourists.map(t => t.activities_cost_npr))),
        transport: Math.round(ss.mean(tourists.map(t => t.transport_cost_npr))),
        guide: Math.round(ss.mean(tourists.filter(t => t.guide_cost_npr > 0).map(t => t.guide_cost_npr)))
    };

    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    
    res.json({
        breakdown,
        percentages: {
            accommodation: ((breakdown.accommodation / total) * 100).toFixed(1),
            food: ((breakdown.food / total) * 100).toFixed(1),
            shopping: ((breakdown.shopping / total) * 100).toFixed(1),
            activities: ((breakdown.activities / total) * 100).toFixed(1),
            transport: ((breakdown.transport / total) * 100).toFixed(1),
            guide: ((breakdown.guide / total) * 100).toFixed(1)
        }
    });
});

// =========== ADVANCED ANALYTICS ENDPOINTS ===========
router.get('/clustering', async (req, res) => {
    try {
        const { tourists } = getData();
        const clusterAnalysis = await advancedAnalytics.performCustomerSegmentation(tourists);
        res.json(clusterAnalysis);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/cohort', (req, res) => {
    const { tourists } = getData();
    const cohortAnalysis = advancedAnalytics.performCohortAnalysis(tourists);
    res.json(cohortAnalysis);
});

router.get('/regression', (req, res) => {
    const { tourists } = getData();
    const regressionAnalysis = advancedAnalytics.performRegressionAnalysis(tourists);
    res.json(regressionAnalysis);
});

// =========== VENDOR-SPECIFIC ENDPOINTS ===========
router.get('/vendor/accommodation', (req, res) => {
    const { tourists, accommodations } = getData();
    const insights = vendorAnalytics.getAccommodationInsights(tourists, accommodations);
    res.json(insights);
});

router.get('/vendor/attractions', (req, res) => {
    const { tourists, visits, attractions } = getData();
    const insights = vendorAnalytics.getAttractionInsights(tourists, visits, attractions);
    res.json(insights);
});

router.get('/vendor/food', (req, res) => {
    const { tourists } = getData();
    const insights = vendorAnalytics.getFoodInsights(tourists);
    res.json(insights);
});

router.get('/vendor/shopping', (req, res) => {
    const { tourists } = getData();
    const insights = vendorAnalytics.getShoppingInsights(tourists);
    res.json(insights);
});

router.get('/vendor/transport', (req, res) => {
    const { tourists } = getData();
    const insights = vendorAnalytics.getTransportInsights(tourists);
    res.json(insights);
});

// =========== NATIONALITY ANALYSIS ===========
// List all nationalities
router.get('/nationality', (req, res) => {
    const { tourists } = getData();
    const nationalities = [...new Set(tourists.map(t => t.nationality))];
    res.json(nationalities.map(nat => {
        const group = tourists.filter(t => t.nationality === nat);
        return {
            nationality: nat,
            count: group.length,
            marketShare: ((group.length / tourists.length) * 100).toFixed(1),
            avgSpending: Math.round(ss.mean(group.map(t => t.total_spent_npr)))
        };
    }).sort((a, b) => b.count - a.count));
});

// Get specific nationality details
router.get('/nationality/:nationality', (req, res) => {
    const { tourists, visits } = getData();
    const nationality = req.params.nationality;

    const filtered = tourists.filter(t => t.nationality.toLowerCase() === nationality.toLowerCase());
    if (filtered.length === 0) {
        return res.status(404).json({ error: 'Nationality not found' });
    }

    const touristIds = new Set(filtered.map(t => t.tourist_id));
    const nationalityVisits = visits.filter(v => touristIds.has(v.tourist_id));

    res.json({
        nationality,
        count: filtered.length,
        marketShare: ((filtered.length / tourists.length) * 100).toFixed(1),
        avgSpending: Math.round(ss.mean(filtered.map(t => t.total_spent_npr))),
        avgDuration: ss.mean(filtered.map(t => t.duration_days)).toFixed(1),
        avgSatisfaction: ss.mean(filtered.map(t => t.satisfaction_score)).toFixed(2),
        recommendRate: ((filtered.filter(t => t.would_recommend).length / filtered.length) * 100).toFixed(1),
        ageDistribution: getAgeDistribution(filtered),
        purposeDistribution: getDistribution(filtered, 'travel_purpose'),
        accommodationPreference: getDistribution(filtered, 'accommodation_type'),
        transportPreference: getDistribution(filtered, 'primary_transport'),
        seasonDistribution: getDistribution(filtered, 'season'),
        topAttractions: getTopN(nationalityVisits.map(v => v.attraction_name), 10),
        spendingBreakdown: {
            accommodation: Math.round(ss.mean(filtered.map(t => t.accommodation_cost_npr))),
            food: Math.round(ss.mean(filtered.map(t => t.food_cost_npr))),
            shopping: Math.round(ss.mean(filtered.map(t => t.shopping_cost_npr))),
            activities: Math.round(ss.mean(filtered.map(t => t.activities_cost_npr))),
            transport: Math.round(ss.mean(filtered.map(t => t.transport_cost_npr)))
        }
    });
});

// =========== TIME SERIES DATA ===========
router.get('/timeseries', (req, res) => {
    const { tourists } = getData();
    
    const monthlyData = _.groupBy(tourists, t => {
        const date = new Date(t.arrival_date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });

    const timeSeries = Object.keys(monthlyData).sort().map(month => {
        const group = monthlyData[month];
        return {
            month,
            visitors: group.length,
            avgSpending: Math.round(ss.mean(group.map(t => t.total_spent_npr))),
            totalRevenue: Math.round(group.reduce((sum, t) => sum + t.total_spent_npr, 0)),
            avgSatisfaction: ss.mean(group.map(t => t.satisfaction_score)).toFixed(2)
        };
    });

    res.json(timeSeries);
});

// =========== DIAGNOSTICS ===========
router.get('/diagnostics', (req, res) => {
    const { tourists, visits, attractions } = getData();
    
    const diagnostics = {
        satisfactionDrivers: analyzeSatisfactionDrivers(tourists),
        spendingPatterns: analyzeSpendingPatterns(tourists),
        seasonalInsights: analyzeSeasonalPatterns(tourists),
        attractionPerformance: analyzeAttractionPerformance(visits, attractions),
        marketOpportunities: identifyMarketOpportunities(tourists)
    };

    res.json(diagnostics);
});

// =========== HELPER FUNCTIONS ===========
function getTopN(arr, n = 5) {
    const counts = _.countBy(arr);
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([item, count]) => ({ item, count, percentage: ((count / arr.length) * 100).toFixed(1) }));
}

function getDistribution(arr, field) {
    const counts = _.countBy(arr, field);
    const total = arr.length;
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => ({
            [field]: key,
            count,
            percentage: ((count / total) * 100).toFixed(1)
        }));
}

function getAgeDistribution(tourists) {
    const buckets = [
        { label: '18-25', min: 18, max: 25 },
        { label: '26-35', min: 26, max: 35 },
        { label: '36-45', min: 36, max: 45 },
        { label: '46-55', min: 46, max: 55 },
        { label: '56-65', min: 56, max: 65 },
        { label: '65+', min: 65, max: 100 }
    ];

    return buckets.map(bucket => ({
        ageGroup: bucket.label,
        count: tourists.filter(t => t.age >= bucket.min && t.age <= bucket.max).length,
        percentage: ((tourists.filter(t => t.age >= bucket.min && t.age <= bucket.max).length / tourists.length) * 100).toFixed(1)
    }));
}

function analyzeSatisfactionDrivers(tourists) {
    const drivers = [];

    // Guide impact
    const withGuide = tourists.filter(t => t.uses_tour_guide);
    const withoutGuide = tourists.filter(t => !t.uses_tour_guide);
    drivers.push({
        factor: 'Tour Guide Usage',
        withFactor: ss.mean(withGuide.map(t => t.satisfaction_score)).toFixed(2),
        withoutFactor: ss.mean(withoutGuide.map(t => t.satisfaction_score)).toFixed(2),
        impact: (ss.mean(withGuide.map(t => t.satisfaction_score)) - ss.mean(withoutGuide.map(t => t.satisfaction_score))).toFixed(2),
        insight: 'Tour guides significantly boost satisfaction through expertise and convenience'
    });

    // Season impact
    const bySeason = _.groupBy(tourists, 'season');
    const seasonSat = Object.keys(bySeason).map(s => ({
        season: s,
        satisfaction: ss.mean(bySeason[s].map(t => t.satisfaction_score)).toFixed(2)
    })).sort((a, b) => b.satisfaction - a.satisfaction);
    
    drivers.push({
        factor: 'Season',
        best: seasonSat[0],
        worst: seasonSat[seasonSat.length - 1],
        insight: `${seasonSat[0].season} provides best experience, ${seasonSat[seasonSat.length - 1].season} needs improvement`
    });

    return drivers;
}

function analyzeSpendingPatterns(tourists) {
    const patterns = [];

    // High vs low spenders
    const avgSpend = ss.mean(tourists.map(t => t.total_spent_npr));
    const highSpenders = tourists.filter(t => t.total_spent_npr > avgSpend * 1.5);
    const lowSpenders = tourists.filter(t => t.total_spent_npr < avgSpend * 0.5);

    patterns.push({
        segment: 'High Spenders (>1.5x average)',
        count: highSpenders.length,
        percentage: ((highSpenders.length / tourists.length) * 100).toFixed(1),
        characteristics: {
            avgDuration: ss.mean(highSpenders.map(t => t.duration_days)).toFixed(1),
            topNationalities: getTopN(highSpenders.map(t => t.nationality), 3),
            guideUsage: ((highSpenders.filter(t => t.uses_tour_guide).length / highSpenders.length) * 100).toFixed(1)
        }
    });

    patterns.push({
        segment: 'Budget Travelers (<0.5x average)',
        count: lowSpenders.length,
        percentage: ((lowSpenders.length / tourists.length) * 100).toFixed(1),
        characteristics: {
            avgDuration: ss.mean(lowSpenders.map(t => t.duration_days)).toFixed(1),
            topNationalities: getTopN(lowSpenders.map(t => t.nationality), 3),
            guideUsage: ((lowSpenders.filter(t => t.uses_tour_guide).length / lowSpenders.length) * 100).toFixed(1)
        }
    });

    return patterns;
}

function analyzeSeasonalPatterns(tourists) {
    const bySeason = _.groupBy(tourists, 'season');
    
    return Object.keys(bySeason).map(season => ({
        season,
        visitors: bySeason[season].length,
        avgSpending: Math.round(ss.mean(bySeason[season].map(t => t.total_spent_npr))),
        avgSatisfaction: ss.mean(bySeason[season].map(t => t.satisfaction_score)).toFixed(2),
        recommendRate: ((bySeason[season].filter(t => t.would_recommend).length / bySeason[season].length) * 100).toFixed(1),
        insight: getSeasonalInsight(season, bySeason[season], tourists)
    }));
}

function getSeasonalInsight(season, seasonTourists, allTourists) {
    const avgSat = ss.mean(allTourists.map(t => t.satisfaction_score));
    const seasonSat = ss.mean(seasonTourists.map(t => t.satisfaction_score));
    
    if (season === 'Autumn') return 'Peak season with highest tourist volume and spending';
    if (season === 'Spring') return 'Second peak with pleasant weather and festivals';
    if (season === 'Monsoon') return 'Low season with reduced prices - opportunity for long-stay visitors';
    if (season === 'Winter') return 'Moderate season with clear mountain views';
    return '';
}

function analyzeAttractionPerformance(visits, attractions) {
    const byAttraction = _.groupBy(visits, 'attraction_id');
    
    return attractions.map(attr => {
        const attrVisits = byAttraction[attr.attraction_id] || [];
        const avgRating = attrVisits.length > 0 ? ss.mean(attrVisits.map(v => v.visit_rating)) : 0;
        
        return {
            attraction_id: attr.attraction_id,
            name: attr.attraction_name,
            city: attr.city,
            category: attr.category,
            visitCount: attrVisits.length,
            avgRating: avgRating.toFixed(2),
            performance: avgRating > 8 ? 'Excellent' : avgRating > 7 ? 'Good' : avgRating > 6 ? 'Average' : 'Needs Improvement'
        };
    }).sort((a, b) => b.visitCount - a.visitCount).slice(0, 20);
}

function identifyMarketOpportunities(tourists) {
    const opportunities = [];

    // Underserved markets with high satisfaction
    const byNationality = _.groupBy(tourists, 'nationality');
    Object.keys(byNationality).forEach(nat => {
        const group = byNationality[nat];
        const marketShare = (group.length / tourists.length) * 100;
        const avgSat = ss.mean(group.map(t => t.satisfaction_score));
        const avgSpend = ss.mean(group.map(t => t.total_spent_npr));

        if (marketShare < 5 && avgSat > 7.5 && avgSpend > 50000) {
            opportunities.push({
                type: 'Underserved High-Value Market',
                nationality: nat,
                currentShare: marketShare.toFixed(1),
                satisfaction: avgSat.toFixed(2),
                avgSpending: Math.round(avgSpend),
                recommendation: `Increase marketing to ${nat} market - high satisfaction and spending potential`
            });
        }
    });

    // Seasonal opportunities
    const bySeason = _.groupBy(tourists, 'season');
    const monsoonTourists = bySeason['Monsoon'] || [];
    if (monsoonTourists.length > 0) {
        const monsoonSpend = ss.mean(monsoonTourists.map(t => t.total_spent_npr / t.duration_days));
        opportunities.push({
            type: 'Seasonal Opportunity',
            season: 'Monsoon',
            insight: 'Lower volume but longer stays',
            avgDailySpend: Math.round(monsoonSpend),
            recommendation: 'Create monsoon packages with indoor activities, cultural experiences'
        });
    }

    return opportunities;
}

module.exports = router;
