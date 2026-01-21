const ss = require('simple-statistics');
const kmeans = require('ml-kmeans');
const _ = require('lodash');

class AdvancedAnalytics {
    constructor() {}

    // =========== CLUSTERING ANALYSIS ===========
    performCustomerSegmentation(tourists) {
        // Prepare features for clustering: spending, duration, satisfaction
        const features = tourists.map(t => [
            t.total_spent_npr / 1000,  // Normalize spending
            t.duration_days,
            t.satisfaction_score,
            t.num_attractions_visited
        ]);

        // Perform K-means clustering with 4 segments
        const k = 4;
        const result = kmeans.kmeans(features, k, { maxIterations: 100 });
        
        // Assign clusters to tourists
        const clusteredTourists = tourists.map((t, i) => ({
            ...t,
            cluster: result.clusters[i]
        }));

        // Analyze each cluster
        const clusterAnalysis = this.analyzeClusterCharacteristics(clusteredTourists);
        
        return {
            clusters: clusterAnalysis,
            centroids: result.centroids,
            touristClusters: clusteredTourists.map(t => ({ 
                tourist_id: t.tourist_id, 
                cluster: t.cluster 
            }))
        };
    }

    analyzeClusterCharacteristics(clusteredTourists) {
        const clusterNames = [
            'Budget Conscious Explorers',
            'Premium Cultural Seekers', 
            'Quick Business Visitors',
            'Leisure Long-stay Tourists'
        ];

        const clusters = _.groupBy(clusteredTourists, 'cluster');
        
        return Object.keys(clusters).map(clusterId => {
            const group = clusters[clusterId];
            const avgSpending = ss.mean(group.map(t => t.total_spent_npr));
            const avgDuration = ss.mean(group.map(t => t.duration_days));
            const avgSatisfaction = ss.mean(group.map(t => t.satisfaction_score));
            const avgAttractions = ss.mean(group.map(t => t.num_attractions_visited));
            
            // Get dominant characteristics
            const topNationality = this.getMostFrequent(group.map(t => t.nationality));
            const topPurpose = this.getMostFrequent(group.map(t => t.travel_purpose));
            const topAccommodation = this.getMostFrequent(group.map(t => t.accommodation_type));
            const topTransport = this.getMostFrequent(group.map(t => t.primary_transport));
            const guideUsageRate = (group.filter(t => t.uses_tour_guide).length / group.length * 100);
            const recommendRate = (group.filter(t => t.would_recommend).length / group.length * 100);

            // Diagnostic: Why this cluster exists
            const diagnostics = this.generateClusterDiagnostics({
                avgSpending, avgDuration, avgSatisfaction, topPurpose, topNationality, guideUsageRate
            });

            return {
                clusterId: parseInt(clusterId),
                name: this.assignClusterName(avgSpending, avgDuration, avgSatisfaction),
                size: group.length,
                percentage: ((group.length / clusteredTourists.length) * 100).toFixed(1),
                characteristics: {
                    avgSpending: Math.round(avgSpending),
                    avgDuration: avgDuration.toFixed(1),
                    avgSatisfaction: avgSatisfaction.toFixed(2),
                    avgAttractions: avgAttractions.toFixed(1),
                    topNationality,
                    topPurpose,
                    topAccommodation,
                    topTransport,
                    guideUsageRate: guideUsageRate.toFixed(1),
                    recommendRate: recommendRate.toFixed(1)
                },
                diagnostics,
                vendorRecommendations: this.generateVendorRecommendations({
                    avgSpending, avgDuration, topPurpose, topNationality, topAccommodation
                })
            };
        });
    }

    assignClusterName(avgSpending, avgDuration, avgSatisfaction) {
        if (avgSpending > 80000 && avgDuration > 8) return 'Premium Long-stay Seekers';
        if (avgSpending > 60000 && avgSatisfaction > 7.5) return 'High-Value Cultural Enthusiasts';
        if (avgSpending < 30000 && avgDuration < 5) return 'Budget Quick Visitors';
        if (avgDuration > 7 && avgSatisfaction > 7) return 'Satisfied Extended Explorers';
        return 'General Tourists';
    }

    generateClusterDiagnostics(data) {
        const diagnostics = [];
        
        if (data.avgSpending > 70000) {
            diagnostics.push({
                insight: 'High spending segment',
                reason: 'This cluster has significantly higher spending (NPR ' + Math.round(data.avgSpending) + '), likely due to preference for premium services and longer stays.',
                action: 'Target with luxury offerings and personalized experiences.'
            });
        } else if (data.avgSpending < 30000) {
            diagnostics.push({
                insight: 'Budget-conscious segment',
                reason: 'Lower spending indicates price sensitivity. Common among backpackers and pilgrimage tourists.',
                action: 'Offer value packages and group discounts.'
            });
        }

        if (data.guideUsageRate > 50) {
            diagnostics.push({
                insight: 'High guide usage',
                reason: 'Over ' + Math.round(data.guideUsageRate) + '% use tour guides, indicating preference for structured experiences.',
                action: 'Partner with local guides for referral programs.'
            });
        }

        if (data.avgSatisfaction < 7) {
            diagnostics.push({
                insight: 'Below average satisfaction',
                reason: 'Satisfaction score of ' + data.avgSatisfaction.toFixed(1) + ' suggests room for improvement in service quality.',
                action: 'Focus on improving pain points: wait times, language barriers, service consistency.'
            });
        }

        return diagnostics;
    }

    generateVendorRecommendations(data) {
        const recommendations = [];
        
        if (data.avgSpending > 60000) {
            recommendations.push('Premium service positioning - tourists willing to pay more for quality');
            recommendations.push('Focus on exclusive experiences and personalized attention');
        }
        
        if (data.topPurpose === 'Pilgrimage') {
            recommendations.push('Partner with temple management for pilgrimage packages');
            recommendations.push('Offer vegetarian food options prominently');
        }
        
        if (data.topPurpose === 'Cultural Tourism') {
            recommendations.push('Highlight heritage and authenticity in marketing');
            recommendations.push('Offer cultural workshops and local artisan connections');
        }

        if (data.topNationality === 'Indian') {
            recommendations.push('Hindi-speaking staff recommended');
            recommendations.push('Indian payment methods (UPI, Paytm) beneficial');
        }

        if (data.topNationality === 'Chinese') {
            recommendations.push('Mandarin-speaking staff and signage valuable');
            recommendations.push('Accept WeChat Pay/Alipay if possible');
        }

        return recommendations;
    }

    // =========== COHORT ANALYSIS ===========
    performCohortAnalysis(tourists) {
        // Group by arrival month (cohort)
        const cohorts = _.groupBy(tourists, t => {
            const date = new Date(t.arrival_date);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        });

        const cohortMetrics = Object.keys(cohorts).sort().map(cohortId => {
            const group = cohorts[cohortId];
            const [year, month] = cohortId.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            return {
                cohortId,
                cohortLabel: `${monthNames[parseInt(month) - 1]} ${year}`,
                size: group.length,
                metrics: {
                    avgSpending: Math.round(ss.mean(group.map(t => t.total_spent_npr))),
                    avgDuration: ss.mean(group.map(t => t.duration_days)).toFixed(1),
                    avgSatisfaction: ss.mean(group.map(t => t.satisfaction_score)).toFixed(2),
                    recommendRate: ((group.filter(t => t.would_recommend).length / group.length) * 100).toFixed(1),
                    guideUsageRate: ((group.filter(t => t.uses_tour_guide).length / group.length) * 100).toFixed(1)
                },
                topNationalities: this.getTopN(group.map(t => t.nationality), 3),
                topPurposes: this.getTopN(group.map(t => t.travel_purpose), 3)
            };
        });

        // Calculate retention/return visitor rates
        const returnVisitorsByMonth = this.calculateReturnVisitorTrend(tourists);

        // Generate cohort diagnostics
        const diagnostics = this.generateCohortDiagnostics(cohortMetrics);

        return {
            cohorts: cohortMetrics,
            returnVisitorTrend: returnVisitorsByMonth,
            diagnostics,
            seasonalPatterns: this.analyzeSeasonalPatterns(cohortMetrics)
        };
    }

    calculateReturnVisitorTrend(tourists) {
        const monthlyData = _.groupBy(tourists, t => {
            const date = new Date(t.arrival_date);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        });

        return Object.keys(monthlyData).sort().map(month => ({
            month,
            totalVisitors: monthlyData[month].length,
            returnVisitors: monthlyData[month].filter(t => t.previous_visits > 0).length,
            returnRate: ((monthlyData[month].filter(t => t.previous_visits > 0).length / monthlyData[month].length) * 100).toFixed(1)
        }));
    }

    analyzeSeasonalPatterns(cohortMetrics) {
        const seasonalData = {
            Spring: { months: ['03', '04', '05'], cohorts: [] },
            Monsoon: { months: ['06', '07', '08'], cohorts: [] },
            Autumn: { months: ['09', '10', '11'], cohorts: [] },
            Winter: { months: ['12', '01', '02'], cohorts: [] }
        };

        cohortMetrics.forEach(c => {
            const month = c.cohortId.split('-')[1];
            for (const season in seasonalData) {
                if (seasonalData[season].months.includes(month)) {
                    seasonalData[season].cohorts.push(c);
                }
            }
        });

        return Object.keys(seasonalData).map(season => ({
            season,
            totalVisitors: seasonalData[season].cohorts.reduce((sum, c) => sum + c.size, 0),
            avgSpending: seasonalData[season].cohorts.length > 0 
                ? Math.round(ss.mean(seasonalData[season].cohorts.map(c => parseFloat(c.metrics.avgSpending))))
                : 0,
            avgSatisfaction: seasonalData[season].cohorts.length > 0
                ? ss.mean(seasonalData[season].cohorts.map(c => parseFloat(c.metrics.avgSatisfaction))).toFixed(2)
                : 0
        }));
    }

    generateCohortDiagnostics(cohortMetrics) {
        const diagnostics = [];
        
        // Find highest and lowest spending cohorts
        const sorted = [...cohortMetrics].sort((a, b) => b.metrics.avgSpending - a.metrics.avgSpending);
        const highestSpending = sorted[0];
        const lowestSpending = sorted[sorted.length - 1];

        diagnostics.push({
            type: 'spending_variation',
            insight: `Highest spending cohort: ${highestSpending.cohortLabel} (NPR ${highestSpending.metrics.avgSpending})`,
            reason: 'Peak season typically attracts higher-spending tourists seeking premium experiences.',
            recommendation: 'Increase inventory and staffing during peak months.'
        });

        // Find satisfaction trends
        const satisfactionTrend = cohortMetrics.map(c => parseFloat(c.metrics.avgSatisfaction));
        const avgSatisfaction = ss.mean(satisfactionTrend);
        
        const lowSatCohorts = cohortMetrics.filter(c => parseFloat(c.metrics.avgSatisfaction) < avgSatisfaction - 0.3);
        if (lowSatCohorts.length > 0) {
            diagnostics.push({
                type: 'satisfaction_dip',
                insight: `Low satisfaction periods: ${lowSatCohorts.map(c => c.cohortLabel).join(', ')}`,
                reason: 'Possible causes: overcrowding, monsoon weather, service quality issues.',
                recommendation: 'Review operational issues during these periods. Consider capacity management.'
            });
        }

        return diagnostics;
    }

    // =========== REGRESSION ANALYSIS ===========
    performRegressionAnalysis(tourists) {
        // Multiple regression analyses
        const spendingFactors = this.analyzeSpendingFactors(tourists);
        const satisfactionFactors = this.analyzeSatisfactionFactors(tourists);
        const durationImpact = this.analyzeDurationImpact(tourists);
        const nationalitySpending = this.analyzeNationalitySpending(tourists);

        return {
            spendingFactors,
            satisfactionFactors,
            durationImpact,
            nationalitySpending,
            predictiveInsights: this.generatePredictiveInsights(tourists)
        };
    }

    analyzeSpendingFactors(tourists) {
        // Analyze what factors influence total spending
        const factors = [];

        // Duration impact
        const durationCorr = ss.sampleCorrelation(
            tourists.map(t => t.duration_days),
            tourists.map(t => t.total_spent_npr)
        );
        factors.push({
            factor: 'Duration (days)',
            correlation: durationCorr.toFixed(3),
            impact: durationCorr > 0.5 ? 'Strong Positive' : durationCorr > 0.3 ? 'Moderate Positive' : 'Weak',
            insight: `Each additional day adds approximately NPR ${Math.round(ss.mean(tourists.map(t => t.total_spent_npr / t.duration_days)))} to spending`
        });

        // Group size impact
        const groupCorr = ss.sampleCorrelation(
            tourists.map(t => t.group_size),
            tourists.map(t => t.total_spent_npr)
        );
        factors.push({
            factor: 'Group Size',
            correlation: groupCorr.toFixed(3),
            impact: groupCorr > 0.3 ? 'Positive' : groupCorr < -0.1 ? 'Negative' : 'Minimal',
            insight: 'Larger groups tend to spend more on group activities but may seek budget options per person'
        });

        // Age impact
        const ageCorr = ss.sampleCorrelation(
            tourists.map(t => t.age),
            tourists.map(t => t.total_spent_npr)
        );
        factors.push({
            factor: 'Age',
            correlation: ageCorr.toFixed(3),
            impact: ageCorr > 0.2 ? 'Moderate Positive' : 'Weak',
            insight: 'Older tourists tend to have higher budgets and preference for comfort'
        });

        // Number of attractions impact
        const attractionsCorr = ss.sampleCorrelation(
            tourists.map(t => t.num_attractions_visited),
            tourists.map(t => t.total_spent_npr)
        );
        factors.push({
            factor: 'Attractions Visited',
            correlation: attractionsCorr.toFixed(3),
            impact: attractionsCorr > 0.4 ? 'Strong Positive' : 'Moderate',
            insight: 'More attractions = higher activity costs and entry fees'
        });

        // Simple linear regression for spending prediction
        const regression = ss.linearRegression(
            tourists.map(t => [t.duration_days, t.total_spent_npr])
        );

        return {
            factors,
            regression: {
                slope: regression.m.toFixed(2),
                intercept: regression.b.toFixed(2),
                equation: `Spending = ${regression.m.toFixed(0)} × Days + ${regression.b.toFixed(0)}`
            }
        };
    }

    analyzeSatisfactionFactors(tourists) {
        const factors = [];

        // Guide usage impact
        const withGuide = tourists.filter(t => t.uses_tour_guide);
        const withoutGuide = tourists.filter(t => !t.uses_tour_guide);
        
        factors.push({
            factor: 'Tour Guide Usage',
            withFactor: ss.mean(withGuide.map(t => t.satisfaction_score)).toFixed(2),
            withoutFactor: ss.mean(withoutGuide.map(t => t.satisfaction_score)).toFixed(2),
            difference: (ss.mean(withGuide.map(t => t.satisfaction_score)) - ss.mean(withoutGuide.map(t => t.satisfaction_score))).toFixed(2),
            insight: 'Tour guides significantly improve satisfaction through expert knowledge and convenience'
        });

        // Accommodation type impact
        const byAccommodation = _.groupBy(tourists, 'accommodation_type');
        const accommodationSatisfaction = Object.keys(byAccommodation).map(type => ({
            type,
            avgSatisfaction: ss.mean(byAccommodation[type].map(t => t.satisfaction_score)).toFixed(2),
            count: byAccommodation[type].length
        })).sort((a, b) => b.avgSatisfaction - a.avgSatisfaction);

        factors.push({
            factor: 'Accommodation Type',
            breakdown: accommodationSatisfaction,
            insight: 'Higher-end accommodations correlate with better satisfaction'
        });

        // Season impact
        const bySeason = _.groupBy(tourists, 'season');
        const seasonSatisfaction = Object.keys(bySeason).map(season => ({
            season,
            avgSatisfaction: ss.mean(bySeason[season].map(t => t.satisfaction_score)).toFixed(2),
            count: bySeason[season].length
        })).sort((a, b) => b.avgSatisfaction - a.avgSatisfaction);

        factors.push({
            factor: 'Season',
            breakdown: seasonSatisfaction,
            insight: 'Weather and crowd levels significantly impact satisfaction'
        });

        return factors;
    }

    analyzeDurationImpact(tourists) {
        const durationBuckets = [
            { label: '1-3 days', min: 1, max: 3 },
            { label: '4-7 days', min: 4, max: 7 },
            { label: '8-14 days', min: 8, max: 14 },
            { label: '15+ days', min: 15, max: 100 }
        ];

        return durationBuckets.map(bucket => {
            const group = tourists.filter(t => t.duration_days >= bucket.min && t.duration_days <= bucket.max);
            return {
                duration: bucket.label,
                count: group.length,
                avgSpending: Math.round(ss.mean(group.map(t => t.total_spent_npr))),
                avgDailySpending: Math.round(ss.mean(group.map(t => t.total_spent_npr / t.duration_days))),
                avgSatisfaction: ss.mean(group.map(t => t.satisfaction_score)).toFixed(2),
                recommendRate: ((group.filter(t => t.would_recommend).length / group.length) * 100).toFixed(1)
            };
        });
    }

    analyzeNationalitySpending(tourists) {
        const byNationality = _.groupBy(tourists, 'nationality');
        
        return Object.keys(byNationality).map(nationality => {
            const group = byNationality[nationality];
            return {
                nationality,
                count: group.length,
                marketShare: ((group.length / tourists.length) * 100).toFixed(1),
                avgSpending: Math.round(ss.mean(group.map(t => t.total_spent_npr))),
                avgDuration: ss.mean(group.map(t => t.duration_days)).toFixed(1),
                avgSatisfaction: ss.mean(group.map(t => t.satisfaction_score)).toFixed(2),
                topPurpose: this.getMostFrequent(group.map(t => t.travel_purpose)),
                topAccommodation: this.getMostFrequent(group.map(t => t.accommodation_type)),
                guideUsageRate: ((group.filter(t => t.uses_tour_guide).length / group.length) * 100).toFixed(1),
                totalRevenue: Math.round(group.reduce((sum, t) => sum + t.total_spent_npr, 0))
            };
        }).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }

    generatePredictiveInsights(tourists) {
        const insights = [];

        // High-value tourist profile
        const highValueTourists = tourists.filter(t => t.total_spent_npr > 80000);
        if (highValueTourists.length > 0) {
            insights.push({
                type: 'high_value_profile',
                title: 'High-Value Tourist Profile',
                profile: {
                    avgAge: Math.round(ss.mean(highValueTourists.map(t => t.age))),
                    topNationalities: this.getTopN(highValueTourists.map(t => t.nationality), 3),
                    avgDuration: ss.mean(highValueTourists.map(t => t.duration_days)).toFixed(1),
                    topPurposes: this.getTopN(highValueTourists.map(t => t.travel_purpose), 3),
                    guideUsageRate: ((highValueTourists.filter(t => t.uses_tour_guide).length / highValueTourists.length) * 100).toFixed(1)
                },
                recommendation: 'Target marketing towards this profile for maximum revenue'
            });
        }

        // At-risk segments (low satisfaction)
        const lowSatTourists = tourists.filter(t => t.satisfaction_score < 6);
        if (lowSatTourists.length > 0) {
            insights.push({
                type: 'at_risk_segment',
                title: 'At-Risk Segment Analysis',
                profile: {
                    count: lowSatTourists.length,
                    percentage: ((lowSatTourists.length / tourists.length) * 100).toFixed(1),
                    topNationalities: this.getTopN(lowSatTourists.map(t => t.nationality), 3),
                    commonIssues: this.getTopN(lowSatTourists.map(t => t.travel_purpose), 3),
                    avgSpending: Math.round(ss.mean(lowSatTourists.map(t => t.total_spent_npr)))
                },
                recommendation: 'Address service gaps for these segments to improve overall ratings'
            });
        }

        return insights;
    }

    // =========== HELPER FUNCTIONS ===========
    getMostFrequent(arr) {
        const counts = _.countBy(arr);
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    getTopN(arr, n = 3) {
        const counts = _.countBy(arr);
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([item, count]) => ({ item, count, percentage: ((count / arr.length) * 100).toFixed(1) }));
    }
}

module.exports = new AdvancedAnalytics();
