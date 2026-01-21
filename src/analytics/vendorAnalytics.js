const ss = require('simple-statistics');
const _ = require('lodash');

class VendorAnalytics {
    constructor() {}

    // =========== HOTEL/ACCOMMODATION ANALYTICS ===========
    getAccommodationInsights(tourists, accommodations) {
        const byType = _.groupBy(tourists, 'accommodation_type');
        
        const typeAnalysis = Object.keys(byType).map(type => {
            const group = byType[type];
            const matchingHotels = accommodations.filter(a => a.hotel_type === type);
            
            return {
                type,
                touristCount: group.length,
                marketShare: ((group.length / tourists.length) * 100).toFixed(1),
                avgSpending: Math.round(ss.mean(group.map(t => t.total_spent_npr))),
                avgAccommodationCost: Math.round(ss.mean(group.map(t => t.accommodation_cost_npr))),
                avgNightlyRate: matchingHotels.length > 0 
                    ? Math.round(ss.mean(matchingHotels.map(h => h.price_per_night)))
                    : 0,
                avgDuration: ss.mean(group.map(t => t.duration_days)).toFixed(1),
                avgSatisfaction: ss.mean(group.map(t => t.satisfaction_score)).toFixed(2),
                topNationalities: this.getTopN(group.map(t => t.nationality), 5),
                topPurposes: this.getTopN(group.map(t => t.travel_purpose), 3),
                seasonalDistribution: this.getDistribution(group, 'season'),
                diagnostics: this.generateAccommodationDiagnostics(type, group, tourists)
            };
        }).sort((a, b) => b.touristCount - a.touristCount);

        // Revenue by accommodation type
        const revenueByType = typeAnalysis.map(t => ({
            type: t.type,
            totalRevenue: Math.round(t.avgAccommodationCost * t.touristCount),
            revenueShare: 0 // Will calculate below
        }));
        
        const totalRevenue = revenueByType.reduce((sum, r) => sum + r.totalRevenue, 0);
        revenueByType.forEach(r => {
            r.revenueShare = ((r.totalRevenue / totalRevenue) * 100).toFixed(1);
        });

        return {
            typeAnalysis,
            revenueByType,
            priceRecommendations: this.generatePriceRecommendations(tourists, accommodations),
            locationInsights: this.getLocationInsights(tourists)
        };
    }

    generateAccommodationDiagnostics(type, group, allTourists) {
        const diagnostics = [];
        const avgSat = ss.mean(group.map(t => t.satisfaction_score));
        const overallAvgSat = ss.mean(allTourists.map(t => t.satisfaction_score));

        if (avgSat < overallAvgSat - 0.3) {
            diagnostics.push({
                issue: 'Below average satisfaction',
                value: avgSat.toFixed(2),
                benchmark: overallAvgSat.toFixed(2),
                reason: `${type} guests report lower satisfaction. Common issues: amenities, service quality, value perception.`,
                action: 'Review guest feedback, improve service touchpoints, consider amenity upgrades.'
            });
        }

        const guideUsageRate = (group.filter(t => t.uses_tour_guide).length / group.length * 100);
        if (guideUsageRate < 30) {
            diagnostics.push({
                issue: 'Low guide usage',
                value: guideUsageRate.toFixed(1) + '%',
                reason: 'Guests may be unaware of guide services or find them too expensive.',
                action: 'Partner with local guides, offer package deals with guided tours.'
            });
        }

        const recommendRate = (group.filter(t => t.would_recommend).length / group.length * 100);
        if (recommendRate < 60) {
            diagnostics.push({
                issue: 'Low recommendation rate',
                value: recommendRate.toFixed(1) + '%',
                reason: 'Guests are not enthusiastic about recommending. Service or value issues.',
                action: 'Implement guest satisfaction program, follow up on feedback.'
            });
        }

        return diagnostics;
    }

    generatePriceRecommendations(tourists, accommodations) {
        const recommendations = [];
        const byType = _.groupBy(tourists, 'accommodation_type');

        Object.keys(byType).forEach(type => {
            const group = byType[type];
            const avgDailyBudget = ss.mean(group.map(t => t.daily_budget_usd));
            const avgAccomSpend = ss.mean(group.map(t => t.accommodation_cost_npr / t.duration_days));
            const matchingHotels = accommodations.filter(a => a.hotel_type === type);
            const avgMarketPrice = matchingHotels.length > 0 
                ? ss.mean(matchingHotels.map(h => h.price_per_night))
                : 0;

            recommendations.push({
                type,
                avgDailyBudget: Math.round(avgDailyBudget),
                avgDailyAccomSpend: Math.round(avgAccomSpend),
                currentMarketPrice: Math.round(avgMarketPrice),
                recommendedRange: {
                    low: Math.round(avgAccomSpend * 0.85),
                    high: Math.round(avgAccomSpend * 1.15)
                },
                insight: avgMarketPrice > avgAccomSpend * 1.2 
                    ? 'Market prices may be too high for this segment'
                    : avgMarketPrice < avgAccomSpend * 0.8
                        ? 'Opportunity to increase prices'
                        : 'Pricing is well-aligned with demand'
            });
        });

        return recommendations;
    }

    getLocationInsights(tourists) {
        const byCity = _.groupBy(tourists, 'accommodation_city');
        
        return Object.keys(byCity).map(city => {
            const group = byCity[city];
            return {
                city,
                touristCount: group.length,
                marketShare: ((group.length / tourists.length) * 100).toFixed(1),
                avgSpending: Math.round(ss.mean(group.map(t => t.total_spent_npr))),
                avgSatisfaction: ss.mean(group.map(t => t.satisfaction_score)).toFixed(2),
                topNationalities: this.getTopN(group.map(t => t.nationality), 3),
                topPurposes: this.getTopN(group.map(t => t.travel_purpose), 3)
            };
        }).sort((a, b) => b.touristCount - a.touristCount);
    }

    // =========== ATTRACTION/TOUR OPERATOR ANALYTICS ===========
    getAttractionInsights(tourists, visits, attractions) {
        // Visits by attraction
        const visitsByAttraction = _.groupBy(visits, 'attraction_id');
        
        const attractionAnalysis = attractions.map(attr => {
            const attrVisits = visitsByAttraction[attr.attraction_id] || [];
            
            return {
                ...attr,
                visitCount: attrVisits.length,
                avgRating: attrVisits.length > 0 
                    ? ss.mean(attrVisits.map(v => v.visit_rating)).toFixed(2)
                    : 0,
                totalRevenue: Math.round(attrVisits.reduce((sum, v) => sum + v.entry_fee_paid, 0)),
                avgFeeCollected: attrVisits.length > 0 
                    ? Math.round(ss.mean(attrVisits.map(v => v.entry_fee_paid)))
                    : 0
            };
        }).sort((a, b) => b.visitCount - a.visitCount);

        // Category analysis
        const byCategory = _.groupBy(visits, 'category');
        const categoryAnalysis = Object.keys(byCategory).map(category => {
            const catVisits = byCategory[category];
            return {
                category,
                visitCount: catVisits.length,
                avgRating: ss.mean(catVisits.map(v => v.visit_rating)).toFixed(2),
                totalRevenue: Math.round(catVisits.reduce((sum, v) => sum + v.entry_fee_paid, 0)),
                topAttractions: this.getTopN(catVisits.map(v => v.attraction_name), 5)
            };
        }).sort((a, b) => b.visitCount - a.visitCount);

        // City analysis
        const byCity = _.groupBy(visits, 'city');
        const cityAnalysis = Object.keys(byCity).map(city => {
            const cityVisits = byCity[city];
            return {
                city,
                visitCount: cityVisits.length,
                avgRating: ss.mean(cityVisits.map(v => v.visit_rating)).toFixed(2),
                totalRevenue: Math.round(cityVisits.reduce((sum, v) => sum + v.entry_fee_paid, 0))
            };
        });

        return {
            topAttractions: attractionAnalysis.slice(0, 15),
            categoryAnalysis,
            cityAnalysis,
            underperformingAttractions: this.findUnderperformingAttractions(attractionAnalysis),
            tourPackageRecommendations: this.generateTourPackages(attractionAnalysis, tourists)
        };
    }

    findUnderperformingAttractions(attractionAnalysis) {
        const avgRating = ss.mean(attractionAnalysis.filter(a => a.visitCount > 0).map(a => parseFloat(a.avgRating)));
        
        return attractionAnalysis
            .filter(a => a.visitCount > 50 && parseFloat(a.avgRating) < avgRating - 0.5)
            .map(a => ({
                ...a,
                issue: 'Below average satisfaction',
                recommendation: 'Review visitor experience, consider improvements to facilities or services'
            }));
    }

    generateTourPackages(attractionAnalysis, tourists) {
        // Get top attractions by category
        const religious = attractionAnalysis.filter(a => a.category === 'Religious Sites').slice(0, 3);
        const cultural = attractionAnalysis.filter(a => a.category === 'Cultural Sites').slice(0, 3);
        const activities = attractionAnalysis.filter(a => a.category === 'Activities').slice(0, 3);

        return [
            {
                name: 'Heritage & Spirituality Package',
                duration: '3 days',
                attractions: [...religious.slice(0, 2), ...cultural.slice(0, 2)].map(a => a.attraction_name),
                targetMarket: 'Indian, Japanese, American tourists',
                estimatedPrice: 'NPR 8,000-12,000',
                rationale: 'Combines most popular religious and cultural sites'
            },
            {
                name: 'Cultural Immersion Package',
                duration: '5 days',
                attractions: [...cultural, ...activities.slice(0, 2)].map(a => a.attraction_name),
                targetMarket: 'European, American tourists',
                estimatedPrice: 'NPR 15,000-25,000',
                rationale: 'Deep cultural experience with hands-on activities'
            },
            {
                name: 'Quick City Highlights',
                duration: '1 day',
                attractions: attractionAnalysis.slice(0, 4).map(a => a.attraction_name),
                targetMarket: 'Business travelers, short-stay visitors',
                estimatedPrice: 'NPR 3,000-5,000',
                rationale: 'Must-see attractions for time-constrained visitors'
            }
        ];
    }

    // =========== RESTAURANT/FOOD VENDOR ANALYTICS ===========
    getFoodInsights(tourists) {
        const byNationality = _.groupBy(tourists, 'nationality');
        
        const nationalityFoodSpending = Object.keys(byNationality).map(nationality => {
            const group = byNationality[nationality];
            const avgDaily = ss.mean(group.map(t => t.food_cost_npr / t.duration_days));
            
            return {
                nationality,
                count: group.length,
                avgTotalFood: Math.round(ss.mean(group.map(t => t.food_cost_npr))),
                avgDailyFood: Math.round(avgDaily),
                avgDuration: ss.mean(group.map(t => t.duration_days)).toFixed(1),
                totalFoodRevenue: Math.round(group.reduce((sum, t) => sum + t.food_cost_npr, 0)),
                marketShare: ((group.length / tourists.length) * 100).toFixed(1)
            };
        }).sort((a, b) => b.avgDailyFood - a.avgDailyFood);

        // Food spending by travel purpose
        const byPurpose = _.groupBy(tourists, 'travel_purpose');
        const purposeFoodSpending = Object.keys(byPurpose).map(purpose => {
            const group = byPurpose[purpose];
            return {
                purpose,
                count: group.length,
                avgDailyFood: Math.round(ss.mean(group.map(t => t.food_cost_npr / t.duration_days))),
                totalFoodRevenue: Math.round(group.reduce((sum, t) => sum + t.food_cost_npr, 0))
            };
        }).sort((a, b) => b.avgDailyFood - a.avgDailyFood);

        // Food spending by season
        const bySeason = _.groupBy(tourists, 'season');
        const seasonalFoodSpending = Object.keys(bySeason).map(season => {
            const group = bySeason[season];
            return {
                season,
                count: group.length,
                avgDailyFood: Math.round(ss.mean(group.map(t => t.food_cost_npr / t.duration_days))),
                totalFoodRevenue: Math.round(group.reduce((sum, t) => sum + t.food_cost_npr, 0))
            };
        });

        return {
            byNationality: nationalityFoodSpending,
            byPurpose: purposeFoodSpending,
            bySeason: seasonalFoodSpending,
            recommendations: this.generateFoodRecommendations(nationalityFoodSpending, purposeFoodSpending)
        };
    }

    generateFoodRecommendations(nationalityData, purposeData) {
        const recommendations = [];

        // High-spending nationalities
        const highSpenders = nationalityData.filter(n => n.avgDailyFood > 1500);
        if (highSpenders.length > 0) {
            recommendations.push({
                segment: 'Premium Diners',
                nationalities: highSpenders.map(n => n.nationality).join(', '),
                avgDailyBudget: Math.round(ss.mean(highSpenders.map(n => n.avgDailyFood))),
                recommendation: 'Offer premium dining experiences, international cuisine options',
                menuSuggestions: ['Fine dining set menus', 'Wine pairing options', 'Authentic local cuisine with premium presentation']
            });
        }

        // Budget segment
        const budgetSpenders = nationalityData.filter(n => n.avgDailyFood < 800 && n.count > 100);
        if (budgetSpenders.length > 0) {
            recommendations.push({
                segment: 'Budget Conscious',
                nationalities: budgetSpenders.map(n => n.nationality).join(', '),
                avgDailyBudget: Math.round(ss.mean(budgetSpenders.map(n => n.avgDailyFood))),
                recommendation: 'Value meals, set lunch specials, local authentic options',
                menuSuggestions: ['Dal Bhat combos', 'Momo platters', 'Thali meals', 'Budget breakfast sets']
            });
        }

        // Pilgrimage travelers
        const pilgrimagePurpose = purposeData.find(p => p.purpose === 'Pilgrimage');
        if (pilgrimagePurpose) {
            recommendations.push({
                segment: 'Pilgrimage Travelers',
                count: pilgrimagePurpose.count,
                recommendation: 'Vegetarian options, pure/satvik food, temple vicinity locations',
                menuSuggestions: ['Pure vegetarian thali', 'No onion/garlic options', 'Traditional sweets', 'Fresh fruit juices']
            });
        }

        return recommendations;
    }

    // =========== SHOPPING/RETAIL ANALYTICS ===========
    getShoppingInsights(tourists) {
        const byNationality = _.groupBy(tourists, 'nationality');
        
        const nationalityShopping = Object.keys(byNationality).map(nationality => {
            const group = byNationality[nationality];
            return {
                nationality,
                count: group.length,
                avgShopping: Math.round(ss.mean(group.map(t => t.shopping_cost_npr))),
                totalShoppingRevenue: Math.round(group.reduce((sum, t) => sum + t.shopping_cost_npr, 0)),
                shopperRate: ((group.filter(t => t.shopping_cost_npr > 0).length / group.length) * 100).toFixed(1),
                avgTotalSpend: Math.round(ss.mean(group.map(t => t.total_spent_npr))),
                shoppingShareOfSpend: ((ss.mean(group.map(t => t.shopping_cost_npr)) / ss.mean(group.map(t => t.total_spent_npr))) * 100).toFixed(1)
            };
        }).sort((a, b) => b.avgShopping - a.avgShopping);

        // Shopping by interest
        const byInterest = _.groupBy(tourists, 'main_interest');
        const interestShopping = Object.keys(byInterest).map(interest => {
            const group = byInterest[interest];
            return {
                interest,
                count: group.length,
                avgShopping: Math.round(ss.mean(group.map(t => t.shopping_cost_npr))),
                totalRevenue: Math.round(group.reduce((sum, t) => sum + t.shopping_cost_npr, 0))
            };
        }).sort((a, b) => b.avgShopping - a.avgShopping);

        return {
            byNationality: nationalityShopping,
            byInterest: interestShopping,
            topShoppingSegments: nationalityShopping.slice(0, 5),
            recommendations: this.generateShoppingRecommendations(nationalityShopping, interestShopping)
        };
    }

    generateShoppingRecommendations(nationalityData, interestData) {
        const recommendations = [];

        // Top shopping nationalities
        const topShoppers = nationalityData.slice(0, 3);
        recommendations.push({
            title: 'Target High-Value Shoppers',
            segments: topShoppers.map(n => ({
                nationality: n.nationality,
                avgSpend: n.avgShopping,
                count: n.count
            })),
            products: ['Premium handicrafts', 'Authentic thangka paintings', 'Quality pashmina', 'Silver jewelry'],
            strategy: 'Position premium products, offer certificates of authenticity'
        });

        // Volume opportunity
        const volumeMarket = nationalityData.filter(n => n.count > 500 && n.avgShopping > 2000);
        if (volumeMarket.length > 0) {
            recommendations.push({
                title: 'Volume Market Opportunity',
                segments: volumeMarket.map(n => ({
                    nationality: n.nationality,
                    totalRevenue: n.totalShoppingRevenue,
                    count: n.count
                })),
                products: ['Souvenirs', 'Religious items', 'Budget handicrafts', 'Prayer flags'],
                strategy: 'Stock popular items, offer bundle deals'
            });
        }

        return recommendations;
    }

    // =========== TRANSPORT ANALYTICS ===========
    getTransportInsights(tourists) {
        const byTransport = _.groupBy(tourists, 'primary_transport');
        
        const transportAnalysis = Object.keys(byTransport).map(transport => {
            const group = byTransport[transport];
            return {
                transport,
                count: group.length,
                marketShare: ((group.length / tourists.length) * 100).toFixed(1),
                avgTransportCost: Math.round(ss.mean(group.map(t => t.transport_cost_npr))),
                avgTotalSpend: Math.round(ss.mean(group.map(t => t.total_spent_npr))),
                avgSatisfaction: ss.mean(group.map(t => t.satisfaction_score)).toFixed(2),
                topNationalities: this.getTopN(group.map(t => t.nationality), 3),
                topAccommodations: this.getTopN(group.map(t => t.accommodation_type), 3)
            };
        }).sort((a, b) => b.count - a.count);

        return {
            transportAnalysis,
            diagnostics: this.generateTransportDiagnostics(transportAnalysis),
            opportunities: this.identifyTransportOpportunities(transportAnalysis)
        };
    }

    generateTransportDiagnostics(transportAnalysis) {
        const diagnostics = [];
        const avgSat = ss.mean(transportAnalysis.map(t => parseFloat(t.avgSatisfaction)));

        transportAnalysis.forEach(t => {
            if (parseFloat(t.avgSatisfaction) < avgSat - 0.3) {
                diagnostics.push({
                    transport: t.transport,
                    issue: 'Below average satisfaction',
                    value: t.avgSatisfaction,
                    recommendation: `Improve ${t.transport} experience - possible issues with pricing, availability, or quality`
                });
            }
        });

        return diagnostics;
    }

    identifyTransportOpportunities(transportAnalysis) {
        return transportAnalysis.map(t => ({
            transport: t.transport,
            currentShare: t.marketShare,
            avgCost: t.avgTransportCost,
            opportunity: parseFloat(t.marketShare) < 15 
                ? 'Growth opportunity - increase visibility and service quality'
                : parseFloat(t.marketShare) > 25 
                    ? 'Dominant segment - maintain quality, explore premium offerings'
                    : 'Stable segment - focus on differentiation'
        }));
    }

    // =========== HELPER FUNCTIONS ===========
    getTopN(arr, n = 3) {
        const counts = _.countBy(arr);
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([item, count]) => ({ item, count, percentage: ((count / arr.length) * 100).toFixed(1) }));
    }

    getDistribution(arr, field) {
        const counts = _.countBy(arr, field);
        const total = arr.length;
        return Object.entries(counts).map(([key, count]) => ({
            [field]: key,
            count,
            percentage: ((count / total) * 100).toFixed(1)
        }));
    }
}

module.exports = new VendorAnalytics();
