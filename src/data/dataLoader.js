const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

class DataLoader {
    constructor() {
        // Try multiple paths for Vercel compatibility
        this.dataDir = this.findDataDir();
        this.tourists = null;
        this.attractions = null;
        this.accommodations = null;
        this.visits = null;
    }

    findDataDir() {
        const possiblePaths = [
            path.join(__dirname),
            path.join(process.cwd(), 'src', 'data'),
            path.join(process.cwd(), 'src/data'),
            path.resolve('./src/data')
        ];
        
        for (const p of possiblePaths) {
            try {
                if (fs.existsSync(path.join(p, 'kathmandu_valley_tourists.csv'))) {
                    console.log(`Found data directory at: ${p}`);
                    return p;
                }
            } catch (e) {
                // continue to next path
            }
        }
        
        // Default fallback
        console.log(`Using default __dirname: ${__dirname}`);
        return __dirname;
    }

    loadCSV(filename) {
        const filePath = path.join(this.dataDir, filename);
        console.log(`Loading CSV from: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf-8');
        return parse(content, {
            columns: true,
            skip_empty_lines: true,
            cast: true,
            cast_date: false
        });
    }

    cleanTouristData(data) {
        return data.map(row => ({
            tourist_id: parseInt(row.tourist_id),
            nationality: row.nationality,
            age: parseInt(row.age),
            gender: row.gender,
            travel_purpose: row.travel_purpose,
            arrival_date: new Date(row.arrival_date),
            departure_date: new Date(row.departure_date),
            duration_days: parseInt(row.duration_days),
            season: row.season,
            group_size: parseInt(row.group_size),
            travel_with: row.travel_with,
            previous_visits: parseInt(row.previous_visits_to_nepal),
            hotel_id: parseInt(row.hotel_id),
            accommodation_type: row.accommodation_type,
            accommodation_city: row.accommodation_city,
            cities_visited: row.cities_visited ? row.cities_visited.split(',').map(c => c.trim()) : [],
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
    }

    cleanAttractionData(data) {
        return data.map(row => ({
            attraction_id: parseInt(row.attraction_id),
            attraction_name: row.attraction_name,
            city: row.city,
            category: row.category,
            entry_fee_foreigner: parseFloat(row.entry_fee_foreigner_npr),
            entry_fee_saarc: parseFloat(row.entry_fee_saarc_npr),
            avg_duration_min: parseFloat(row.avg_visit_duration_min),
            popularity_score: parseFloat(row.popularity_score)
        }));
    }

    cleanAccommodationData(data) {
        return data.map(row => ({
            hotel_id: parseInt(row.hotel_id),
            hotel_type: row.hotel_type,
            city: row.city,
            area: row.area,
            price_per_night: parseFloat(row.price_per_night_npr),
            rating: parseFloat(row.rating),
            has_wifi: row.has_wifi === 'True',
            has_breakfast: row.has_breakfast === 'True'
        }));
    }

    cleanVisitsData(data) {
        return data.map(row => ({
            tourist_id: parseInt(row.tourist_id),
            attraction_id: parseInt(row.attraction_id),
            attraction_name: row.attraction_name,
            city: row.city,
            category: row.category,
            entry_fee_paid: parseFloat(row.entry_fee_paid),
            visit_rating: parseFloat(row.visit_rating)
        })).filter(row => !isNaN(row.tourist_id));
    }

    loadAll() {
        console.log('Loading and cleaning data...');
        
        const rawTourists = this.loadCSV('kathmandu_valley_tourists.csv');
        const rawAttractions = this.loadCSV('attractions_catalog.csv');
        const rawAccommodations = this.loadCSV('accommodations_catalog.csv');
        const rawVisits = this.loadCSV('tourist_attraction_visits.csv');

        this.tourists = this.cleanTouristData(rawTourists);
        this.attractions = this.cleanAttractionData(rawAttractions);
        this.accommodations = this.cleanAccommodationData(rawAccommodations);
        this.visits = this.cleanVisitsData(rawVisits);

        console.log(`Loaded ${this.tourists.length} tourists`);
        console.log(`Loaded ${this.attractions.length} attractions`);
        console.log(`Loaded ${this.accommodations.length} accommodations`);
        console.log(`Loaded ${this.visits.length} visits`);

        return {
            tourists: this.tourists,
            attractions: this.attractions,
            accommodations: this.accommodations,
            visits: this.visits
        };
    }

    getTourists() {
        if (!this.tourists) this.loadAll();
        return this.tourists;
    }

    getAttractions() {
        if (!this.attractions) this.loadAll();
        return this.attractions;
    }

    getAccommodations() {
        if (!this.accommodations) this.loadAll();
        return this.accommodations;
    }

    getVisits() {
        if (!this.visits) this.loadAll();
        return this.visits;
    }
}

module.exports = new DataLoader();
