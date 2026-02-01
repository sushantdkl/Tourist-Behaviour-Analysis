const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const ss = require('simple-statistics');
const _ = require('lodash');

// Data loading functions
function getDataDir() {
    const possiblePaths = [
        path.join(process.cwd(), 'src', 'data'),
        path.join(__dirname, '..', 'src', 'data'),
    ];
    
    for (const p of possiblePaths) {
        if (fs.existsSync(path.join(p, 'kathmandu_valley_tourists.csv'))) {
            return p;
        }
    }
    return possiblePaths[0];
}

function loadCSV(filename) {
    const dataDir = getDataDir();
    const filePath = path.join(dataDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    return parse(content, {
        columns: true,
        skip_empty_lines: true,
        cast: true,
        cast_date: false
    });
}

let cachedData = null;

function getData() {
    if (cachedData) return cachedData;
    
    const rawTourists = loadCSV('kathmandu_valley_tourists.csv');
    const rawAttractions = loadCSV('attractions_catalog.csv');
    const rawAccommodations = loadCSV('accommodations_catalog.csv');
    const rawVisits = loadCSV('tourist_attraction_visits.csv');

    // Clean tourist data
    const tourists = rawTourists.map(row => ({
        tourist_id: parseInt(row.tourist_id),
        nationality: row.nationality,
        age: parseInt(row.age),
        gender: row.gender,
        travel_purpose: row.travel_purpose,
        duration_days: parseInt(row.duration_days),
        season: row.season,
        group_size: parseInt(row.group_size),
        travel_with: row.travel_with,
        previous_visits: parseInt(row.previous_visits_to_nepal),
        accommodation_type: row.accommodation_type,
        accommodation_city: row.accommodation_city,
        num_attractions_visited: parseInt(row.num_attractions_visited),
        primary_transport: row.primary_transport,
        uses_tour_guide: row.uses_tour_guide === 'True',
        daily_budget_usd: parseFloat(row.daily_budget_usd),
        accommodation_cost_npr: parseFloat(row.accommodation_cost_npr),
        food_cost_npr: parseFloat(row.food_cost_npr),
        shopping_cost_npr: parseFloat(row.shopping_cost_npr),
        activities_cost_npr: parseFloat(row.activities_cost_npr),
        transport_cost_npr: parseFloat(row.transport_cost_npr),
        guide_cost_npr: parseFloat(row.guide_cost_npr),
        total_spent_npr: parseFloat(row.total_spent_npr),
        information_source: row.information_source,
        main_interest: row.main_interest,
        satisfaction_score: parseFloat(row.satisfaction_score),
        would_recommend: row.would_recommend === 'True'
    })).filter(row => !isNaN(row.tourist_id) && row.total_spent_npr > 0);

    const attractions = rawAttractions.map(row => ({
        attraction_id: parseInt(row.attraction_id),
        attraction_name: row.attraction_name,
        city: row.city,
        category: row.category,
        entry_fee_foreigner: parseFloat(row.entry_fee_foreigner_npr),
        popularity_score: parseFloat(row.popularity_score)
    }));

    const accommodations = rawAccommodations.map(row => ({
        hotel_id: parseInt(row.hotel_id),
        hotel_type: row.hotel_type,
        city: row.city,
        price_per_night: parseFloat(row.price_per_night_npr),
        rating: parseFloat(row.rating)
    }));

    const visits = rawVisits.map(row => ({
        tourist_id: parseInt(row.tourist_id),
        attraction_id: parseInt(row.attraction_id),
        attraction_name: row.attraction_name,
        city: row.city,
        category: row.category,
        entry_fee_paid: parseFloat(row.entry_fee_paid),
        visit_rating: parseFloat(row.visit_rating)
    })).filter(row => !isNaN(row.tourist_id));

    cachedData = { tourists, attractions, accommodations, visits };
    return cachedData;
}

function getTopN(arr, n) {
    const counts = _.countBy(arr);
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([label, count]) => ({ label, count }));
}

function getDistribution(data, field) {
    const counts = _.countBy(data, field);
    return Object.entries(counts).map(([label, count]) => ({ label, count }));
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { tourists, attractions, accommodations, visits } = getData();

        // Get transport distribution
        const transportCounts = _.countBy(tourists, 'primary_transport');
        const transportDistribution = Object.entries(transportCounts).map(([transport_mode, count]) => ({
            transport_mode,
            count
        })).sort((a, b) => b.count - a.count);

        // Get top attractions from visits
        const attractionCounts = _.countBy(visits, 'attraction_name');
        const topAttractions = Object.entries(attractionCounts).map(([name, visitCount]) => ({
            name,
            visits: visitCount
        })).sort((a, b) => b.visits - a.visits).slice(0, 15);

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
            accommodationDistribution: getDistribution(tourists, 'accommodation_type'),
            transportDistribution: transportDistribution,
            topAttractions: topAttractions
        };

        res.status(200).json(overview);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to load data', 
            message: error.message,
            stack: error.stack
        });
    }
};
