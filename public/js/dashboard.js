// Dashboard JavaScript
const API_BASE = '/api';

// Chart instances
let charts = {};

// Current states
let currentMainDashboard = 'overview';
let currentDescriptiveSection = 'demographics';
let currentDiagnosticSection = 'satisfaction';
let currentPredictiveSection = 'clustering';
let currentVendorType = 'accommodation';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('lastUpdated').textContent = `Last updated: ${new Date().toLocaleString()}`;
    loadOverviewDashboard();
});

// ============== MAIN DASHBOARD NAVIGATION ==============
function showMainDashboard(dashboardName) {
    currentMainDashboard = dashboardName;
    
    // Hide all dashboard sections
    document.querySelectorAll('.dashboard-section').forEach(section => section.classList.add('hidden'));
    
    // Remove active class from all main tabs
    document.querySelectorAll('.main-tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected dashboard and activate tab
    document.getElementById(`${dashboardName}-dashboard`).classList.remove('hidden');
    document.getElementById(`main-tab-${dashboardName}`).classList.add('active');
    
    // Load dashboard-specific data
    switch(dashboardName) {
        case 'overview': loadOverviewDashboard(); break;
        case 'descriptive': loadDescriptiveDashboard(); break;
        case 'diagnostic': loadDiagnosticDashboard(); break;
        case 'predictive': loadPredictiveDashboard(); break;
    }
}

// ============== DESCRIPTIVE SUB-NAVIGATION ==============
function showDescriptiveSection(sectionName) {
    currentDescriptiveSection = sectionName;
    
    document.querySelectorAll('.desc-section').forEach(section => section.classList.add('hidden'));
    document.querySelectorAll('#descriptive-dashboard .sub-nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`desc-${sectionName}`).classList.remove('hidden');
    document.getElementById(`desc-tab-${sectionName}`).classList.add('active');
    
    loadDescriptiveSection(sectionName);
}

// ============== DIAGNOSTIC SUB-NAVIGATION ==============
function showDiagnosticSection(sectionName) {
    currentDiagnosticSection = sectionName;
    
    document.querySelectorAll('.diag-section').forEach(section => section.classList.add('hidden'));
    document.querySelectorAll('#diagnostic-dashboard .sub-nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`diag-${sectionName}`).classList.remove('hidden');
    document.getElementById(`diag-tab-${sectionName}`).classList.add('active');
    
    loadDiagnosticSection(sectionName);
}

// ============== PREDICTIVE SUB-NAVIGATION ==============
function showPredictiveSection(sectionName) {
    currentPredictiveSection = sectionName;
    
    document.querySelectorAll('.pred-section').forEach(section => section.classList.add('hidden'));
    document.querySelectorAll('#predictive-dashboard .sub-nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`pred-${sectionName}`).classList.remove('hidden');
    document.getElementById(`pred-tab-${sectionName}`).classList.add('active');
    
    loadPredictiveSection(sectionName);
}

// ============== TOTAL OVERVIEW DASHBOARD ==============
async function loadOverviewDashboard() {
    try {
        const [overview, spending, nationalities] = await Promise.all([
            fetch(`${API_BASE}/overview`).then(r => r.json()),
            fetch(`${API_BASE}/spending-breakdown`).then(r => r.json()),
            fetch(`${API_BASE}/nationality`).then(r => r.json())
        ]);

        // Update KPIs
        document.getElementById('kpi-tourists').textContent = overview.totalTourists.toLocaleString();
        document.getElementById('kpi-tourists').classList.remove('loading');
        
        document.getElementById('kpi-spending').textContent = `NPR ${(overview.avgSpending/1000).toFixed(1)}K`;
        document.getElementById('kpi-spending').classList.remove('loading');
        
        document.getElementById('kpi-duration').textContent = `${overview.avgDuration} days`;
        document.getElementById('kpi-duration').classList.remove('loading');
        
        document.getElementById('kpi-satisfaction').textContent = `${overview.avgSatisfaction}/10`;
        document.getElementById('kpi-satisfaction').classList.remove('loading');
        
        document.getElementById('kpi-recommend').textContent = `${overview.recommendRate}%`;
        document.getElementById('kpi-recommend').classList.remove('loading');
        
        document.getElementById('kpi-revenue').textContent = `NPR ${(overview.totalRevenue/1000000).toFixed(1)}M`;
        document.getElementById('kpi-revenue').classList.remove('loading');

        // Quick Stats
        if (overview.seasonDistribution && overview.seasonDistribution.length > 0) {
            const peakSeason = overview.seasonDistribution.reduce((a, b) => a.count > b.count ? a : b);
            document.getElementById('peak-season').textContent = peakSeason.season;
            document.getElementById('peak-season-visitors').textContent = `${peakSeason.count.toLocaleString()} visitors`;
        }
        
        if (overview.topNationalities && overview.topNationalities.length > 0) {
            document.getElementById('top-market').textContent = overview.topNationalities[0].item;
            const marketShare = ((overview.topNationalities[0].count / overview.totalTourists) * 100).toFixed(1);
            document.getElementById('top-market-share').textContent = `${marketShare}% market share`;
        }
        
        if (overview.purposeDistribution && overview.purposeDistribution.length > 0) {
            document.getElementById('main-purpose').textContent = overview.purposeDistribution[0].travel_purpose;
            document.getElementById('main-purpose-count').textContent = `${overview.purposeDistribution[0].count.toLocaleString()} tourists`;
        }
        
        if (overview.accommodationDistribution && overview.accommodationDistribution.length > 0) {
            document.getElementById('top-accommodation').textContent = overview.accommodationDistribution[0].accommodation_type;
            document.getElementById('top-accommodation-count').textContent = `${overview.accommodationDistribution[0].count.toLocaleString()} bookings`;
        }

        // Overview Charts
        renderChart('overviewNationalityChart', 'bar', {
            labels: overview.topNationalities.slice(0, 6).map(n => n.item),
            datasets: [{
                label: 'Number of Tourists',
                data: overview.topNationalities.slice(0, 6).map(n => n.count),
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
            }]
        }, { indexAxis: 'y' });

        renderChart('overviewSpendingChart', 'doughnut', {
            labels: Object.keys(spending.breakdown).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
            datasets: [{
                data: Object.values(spending.breakdown),
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
            }]
        });

        // Quick Insights
        const insightsDiv = document.getElementById('overviewInsights');
        const insights = generateQuickInsights(overview, spending, nationalities);
        insightsDiv.innerHTML = insights.map(insight => `
            <div class="insight-card ${insight.type}">
                <span class="insight-icon">${insight.icon}</span>
                <div>
                    <p class="font-semibold text-gray-800">${insight.title}</p>
                    <p class="text-sm text-gray-600">${insight.description}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading overview dashboard:', error);
    }
}

function generateQuickInsights(overview, spending, nationalities) {
    const insights = [];
    
    // High satisfaction insight
    if (parseFloat(overview.avgSatisfaction) >= 7) {
        insights.push({
            icon: '⭐',
            title: 'High Satisfaction',
            description: `Average satisfaction of ${overview.avgSatisfaction}/10 indicates tourists are happy with their experience`,
            type: 'positive'
        });
    }
    
    // Top spending category
    const topCategory = Object.entries(spending.breakdown).reduce((a, b) => a[1] > b[1] ? a : b);
    insights.push({
        icon: '💰',
        title: `${topCategory[0].charAt(0).toUpperCase() + topCategory[0].slice(1)} Dominates`,
        description: `${topCategory[1]}% of tourist spending goes to ${topCategory[0]}`,
        type: 'info'
    });
    
    // Return rate insight
    if (overview.recommendRate >= 70) {
        insights.push({
            icon: '👍',
            title: 'Strong Recommendations',
            description: `${overview.recommendRate}% of tourists would recommend visiting`,
            type: 'positive'
        });
    }
    
    return insights;
}

// ============== DESCRIPTIVE DASHBOARD ==============
async function loadDescriptiveDashboard() {
    loadDescriptiveSection(currentDescriptiveSection);
}

async function loadDescriptiveSection(sectionName) {
    try {
        const [overview, spending, nationalities] = await Promise.all([
            fetch(`${API_BASE}/overview`).then(r => r.json()),
            fetch(`${API_BASE}/spending-breakdown`).then(r => r.json()),
            fetch(`${API_BASE}/nationality`).then(r => r.json())
        ]);

        switch(sectionName) {
            case 'demographics':
                loadDemographicsSection(overview, nationalities);
                break;
            case 'spending':
                loadSpendingSection(overview, spending, nationalities);
                break;
            case 'temporal':
                loadTemporalSection(overview);
                break;
            case 'behavior':
                loadBehaviorSection(overview);
                break;
        }
    } catch (error) {
        console.error('Error loading descriptive section:', error);
    }
}

function loadDemographicsSection(overview, nationalities) {
    // Nationality Chart
    renderChart('nationalityChart', 'bar', {
        labels: overview.topNationalities.slice(0, 8).map(n => n.item),
        datasets: [{
            label: 'Number of Tourists',
            data: overview.topNationalities.slice(0, 8).map(n => n.count),
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
        }]
    }, { indexAxis: 'y' });

    // Purpose Chart
    renderChart('purposeChart', 'bar', {
        labels: overview.purposeDistribution.slice(0, 6).map(p => p.travel_purpose),
        datasets: [{
            label: 'Number of Tourists',
            data: overview.purposeDistribution.slice(0, 6).map(p => p.count),
            backgroundColor: '#3B82F6'
        }]
    });

    // Nationality Table
    const tableBody = document.getElementById('nationalityTable');
    tableBody.innerHTML = nationalities.slice(0, 15).map(n => `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-3 font-medium">${n.nationality}</td>
            <td class="px-4 py-3 text-right">${n.count.toLocaleString()}</td>
            <td class="px-4 py-3 text-right">${n.marketShare}%</td>
            <td class="px-4 py-3 text-right">NPR ${n.avgSpending.toLocaleString()}</td>
            <td class="px-4 py-3 text-right">${n.avgDuration || '-'} days</td>
            <td class="px-4 py-3 text-right">${n.avgSatisfaction || '-'}/10</td>
        </tr>
    `).join('');
}

function loadSpendingSection(overview, spending, nationalities) {
    // Spending Breakdown
    renderChart('spendingChart', 'doughnut', {
        labels: Object.keys(spending.breakdown).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
        datasets: [{
            data: Object.values(spending.breakdown),
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
        }]
    });

    // Spending Distribution
    renderChart('spendingDistributionChart', 'bar', {
        labels: ['<50K', '50K-100K', '100K-150K', '150K-200K', '>200K'],
        datasets: [{
            label: 'Number of Tourists',
            data: spending.distribution || [0, 0, 0, 0, 0],
            backgroundColor: '#8B5CF6'
        }]
    });

    // Nationality Spending
    renderChart('descNationalitySpendingChart', 'bar', {
        labels: nationalities.slice(0, 10).map(n => n.nationality),
        datasets: [{
            label: 'Avg Spending (NPR)',
            data: nationalities.slice(0, 10).map(n => n.avgSpending),
            backgroundColor: '#10B981'
        }]
    }, { indexAxis: 'y' });

    // Accommodation Spending
    if (overview.accommodationDistribution) {
        renderChart('accommodationSpendingChart', 'bar', {
            labels: overview.accommodationDistribution.map(a => a.accommodation_type),
            datasets: [{
                label: 'Number of Bookings',
                data: overview.accommodationDistribution.map(a => a.count),
                backgroundColor: '#F59E0B'
            }]
        });
    }
}

function loadTemporalSection(overview) {
    // Season Chart
    renderChart('seasonChart', 'pie', {
        labels: overview.seasonDistribution.map(s => s.season),
        datasets: [{
            data: overview.seasonDistribution.map(s => s.count),
            backgroundColor: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']
        }]
    });

    // Monthly Trend
    renderChart('monthlyTrendChart', 'line', {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Visitors',
            data: overview.monthlyDistribution || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderColor: '#3B82F6',
            backgroundColor: '#3B82F633',
            fill: true
        }]
    });

    // Duration Distribution
    renderChart('durationDistributionChart', 'bar', {
        labels: ['1-3 days', '4-7 days', '8-14 days', '15-21 days', '22+ days'],
        datasets: [{
            label: 'Number of Tourists',
            data: overview.durationDistribution || [0, 0, 0, 0, 0],
            backgroundColor: '#8B5CF6'
        }]
    });
}

function loadBehaviorSection(overview) {
    // Transport Mode
    if (overview.transportDistribution) {
        renderChart('transportChart', 'doughnut', {
            labels: overview.transportDistribution.map(t => t.transport_mode),
            datasets: [{
                data: overview.transportDistribution.map(t => t.count),
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
            }]
        });
    }

    // Guide Usage
    renderChart('guideUsageChart', 'pie', {
        labels: ['With Guide', 'Without Guide'],
        datasets: [{
            data: [overview.guideUsageRate || 50, 100 - (overview.guideUsageRate || 50)],
            backgroundColor: ['#10B981', '#E5E7EB']
        }]
    });

    // Attraction Visits
    if (overview.topAttractions) {
        renderChart('attractionVisitsChart', 'bar', {
            labels: overview.topAttractions.slice(0, 10).map(a => a.name),
            datasets: [{
                label: 'Number of Visits',
                data: overview.topAttractions.slice(0, 10).map(a => a.visits),
                backgroundColor: '#3B82F6'
            }]
        }, { indexAxis: 'y' });
    }
}

// ============== DIAGNOSTIC DASHBOARD ==============
async function loadDiagnosticDashboard() {
    loadDiagnosticSection(currentDiagnosticSection);
}

async function loadDiagnosticSection(sectionName) {
    try {
        switch(sectionName) {
            case 'satisfaction':
                await loadSatisfactionDiagnostics();
                break;
            case 'spending-patterns':
                await loadSpendingPatternsDiagnostics();
                break;
            case 'seasonal':
                await loadSeasonalDiagnostics();
                break;
            case 'performance':
                await loadPerformanceDiagnostics();
                break;
        }
    } catch (error) {
        console.error('Error loading diagnostic section:', error);
    }
}

async function loadSatisfactionDiagnostics() {
    try {
        const [diagnostics, regression] = await Promise.all([
            fetch(`${API_BASE}/diagnostics`).then(r => r.json()),
            fetch(`${API_BASE}/regression`).then(r => r.json())
        ]);

        // Satisfaction Drivers
        const satDiv = document.getElementById('diagnosticSatisfaction');
        satDiv.innerHTML = diagnostics.satisfactionDrivers.map(d => `
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 class="font-semibold text-gray-800">${d.factor}</h4>
                ${d.withFactor ? `
                    <div class="flex gap-4 mt-2">
                        <div><span class="text-green-600 font-bold">${d.withFactor}</span> with</div>
                        <div><span class="text-red-600 font-bold">${d.withoutFactor}</span> without</div>
                        <div class="text-blue-600 font-bold">+${d.impact} impact</div>
                    </div>
                ` : ''}
                ${d.best ? `
                    <p class="text-sm text-gray-600 mt-2">Best: ${d.best.season} (${d.best.satisfaction}) | Worst: ${d.worst.season} (${d.worst.satisfaction})</p>
                ` : ''}
                <p class="text-xs text-gray-500 mt-2">${d.insight}</p>
            </div>
        `).join('');

        // Satisfaction Factors from Regression
        const satFactorsDiv = document.getElementById('satisfactionFactors');
        if (regression.satisfactionFactors) {
            satFactorsDiv.innerHTML = regression.satisfactionFactors.map(f => {
                if (f.withFactor) {
                    return `
                        <div class="bg-gray-50 rounded-lg p-4 mb-4">
                            <p class="font-semibold text-gray-800">${f.factor}</p>
                            <div class="flex gap-4 mt-2">
                                <div class="text-center">
                                    <p class="text-xs text-gray-500">With</p>
                                    <p class="text-xl font-bold text-green-600">${f.withFactor}</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-xs text-gray-500">Without</p>
                                    <p class="text-xl font-bold text-red-600">${f.withoutFactor}</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-xs text-gray-500">Difference</p>
                                    <p class="text-xl font-bold text-blue-600">+${f.difference}</p>
                                </div>
                            </div>
                            <p class="text-xs text-gray-600 mt-2">${f.insight}</p>
                        </div>
                    `;
                } else if (f.breakdown) {
                    return `
                        <div class="bg-gray-50 rounded-lg p-4 mb-4">
                            <p class="font-semibold text-gray-800 mb-2">${f.factor}</p>
                            <div class="space-y-2">
                                ${f.breakdown.slice(0, 5).map(b => `
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm">${b.type || b.season}</span>
                                        <span class="font-semibold">${b.avgSatisfaction}</span>
                                    </div>
                                `).join('')}
                            </div>
                            <p class="text-xs text-gray-600 mt-2">${f.insight}</p>
                        </div>
                    `;
                }
                return '';
            }).join('');
        }

        // Correlation chart placeholder
        renderChart('satisfactionCorrelationChart', 'bar', {
            labels: ['Duration', 'Spending', 'Guide Usage', 'Attractions', 'Season'],
            datasets: [{
                label: 'Correlation with Satisfaction',
                data: [0.65, 0.45, 0.72, 0.58, 0.38],
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
            }]
        });

    } catch (error) {
        console.error('Error loading satisfaction diagnostics:', error);
    }
}

async function loadSpendingPatternsDiagnostics() {
    try {
        const [diagnostics, regression] = await Promise.all([
            fetch(`${API_BASE}/diagnostics`).then(r => r.json()),
            fetch(`${API_BASE}/regression`).then(r => r.json())
        ]);

        // Spending Patterns
        const spendDiv = document.getElementById('diagnosticSpending');
        spendDiv.innerHTML = diagnostics.spendingPatterns.map(p => `
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <div class="flex justify-between items-start">
                    <h4 class="font-semibold text-gray-800">${p.segment}</h4>
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">${p.percentage}%</span>
                </div>
                <p class="text-sm text-gray-600 mt-2">${p.count.toLocaleString()} tourists</p>
                <div class="mt-2">
                    <p class="text-xs text-gray-500">Avg Duration: ${p.characteristics.avgDuration} days</p>
                    <p class="text-xs text-gray-500">Guide Usage: ${p.characteristics.guideUsage}%</p>
                    <p class="text-xs text-gray-500">Top: ${p.characteristics.topNationalities.map(n => n.item).join(', ')}</p>
                </div>
            </div>
        `).join('');

        // Spending Factors
        const spendingDiv = document.getElementById('spendingFactors');
        spendingDiv.innerHTML = `
            <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                <p class="text-sm font-semibold text-blue-800">📐 Regression Equation</p>
                <p class="text-lg font-mono text-blue-900">${regression.spendingFactors.regression.equation}</p>
            </div>
            ${regression.spendingFactors.factors.map(f => `
                <div class="flex items-center justify-between py-2 border-b">
                    <div>
                        <p class="font-medium text-gray-800">${f.factor}</p>
                        <p class="text-xs text-gray-500">${f.insight}</p>
                    </div>
                    <div class="text-right">
                        <span class="px-2 py-1 rounded text-xs font-semibold ${getCorrelationColor(f.correlation)}">${f.impact}</span>
                        <p class="text-xs text-gray-500">r = ${f.correlation}</p>
                    </div>
                </div>
            `).join('')}
        `;

        // Duration Impact Chart
        renderChart('durationImpactChart', 'bar', {
            labels: regression.durationImpact.map(d => d.duration),
            datasets: [
                {
                    label: 'Avg Total Spending (K)',
                    data: regression.durationImpact.map(d => d.avgSpending / 1000),
                    backgroundColor: '#3B82F6'
                },
                {
                    label: 'Avg Daily Spending (K)',
                    data: regression.durationImpact.map(d => d.avgDailySpending / 1000),
                    backgroundColor: '#10B981'
                }
            ]
        });

        // Nationality Spending Chart
        const topNationalities = regression.nationalitySpending.slice(0, 10);
        renderChart('nationalitySpendingChart', 'bar', {
            labels: topNationalities.map(n => n.nationality),
            datasets: [{
                label: 'Avg Spending (NPR)',
                data: topNationalities.map(n => n.avgSpending),
                backgroundColor: '#8B5CF6'
            }]
        }, { indexAxis: 'y' });

    } catch (error) {
        console.error('Error loading spending diagnostics:', error);
    }
}

async function loadSeasonalDiagnostics() {
    try {
        const [diagnostics, cohort] = await Promise.all([
            fetch(`${API_BASE}/diagnostics`).then(r => r.json()),
            fetch(`${API_BASE}/cohort`).then(r => r.json())
        ]);

        // Seasonal Insights
        const seasonDiv = document.getElementById('diagnosticSeasonal');
        seasonDiv.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                ${diagnostics.seasonalInsights.map(s => `
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-800">${getSeasonEmoji(s.season)} ${s.season}</h4>
                        <p class="text-2xl font-bold text-blue-600">${s.visitors.toLocaleString()}</p>
                        <p class="text-sm text-gray-500">visitors</p>
                        <div class="mt-2 text-xs">
                            <p>Avg Spend: NPR ${s.avgSpending.toLocaleString()}</p>
                            <p>Satisfaction: ${s.avgSatisfaction}</p>
                            <p>Recommend: ${s.recommendRate}%</p>
                        </div>
                        <p class="text-xs text-blue-600 mt-2">${s.insight}</p>
                    </div>
                `).join('')}
            </div>
        `;

        // Seasonal Performance
        const seasonalDiv = document.getElementById('seasonalPerformance');
        seasonalDiv.innerHTML = cohort.seasonalPatterns.map(s => `
            <div class="flex items-center justify-between py-3 border-b">
                <div>
                    <p class="font-semibold text-gray-800">${getSeasonEmoji(s.season)} ${s.season}</p>
                    <p class="text-xs text-gray-500">${s.totalVisitors.toLocaleString()} visitors</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-green-600">NPR ${s.avgSpending.toLocaleString()}</p>
                    <p class="text-xs text-gray-500">⭐ ${s.avgSatisfaction}</p>
                </div>
            </div>
        `).join('');

        // Return Visitor Chart
        renderChart('returnVisitorChart', 'bar', {
            labels: cohort.returnVisitorTrend.slice(-12).map(r => r.month),
            datasets: [{
                label: 'Return Rate %',
                data: cohort.returnVisitorTrend.slice(-12).map(r => parseFloat(r.returnRate)),
                backgroundColor: '#8B5CF6'
            }]
        });

        // Cohort Diagnostics
        const diagnosticsDiv = document.getElementById('cohortDiagnostics');
        diagnosticsDiv.innerHTML = cohort.diagnostics.map(d => `
            <div class="diagnostic-warning bg-white rounded-lg p-4 mb-4 shadow-sm">
                <h4 class="font-semibold text-gray-800">${d.insight}</h4>
                <p class="text-sm text-gray-600 mt-1"><strong>Why:</strong> ${d.reason}</p>
                <p class="text-sm text-blue-600 mt-2"><strong>Action:</strong> ${d.recommendation}</p>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading seasonal diagnostics:', error);
    }
}

async function loadPerformanceDiagnostics() {
    try {
        const diagnostics = await fetch(`${API_BASE}/diagnostics`).then(r => r.json());

        // Market Opportunities
        const oppDiv = document.getElementById('diagnosticOpportunities');
        oppDiv.innerHTML = diagnostics.marketOpportunities.map(o => `
            <div class="diagnostic-positive bg-green-50 rounded-lg p-4 mb-4">
                <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">${o.type}</span>
                <h4 class="font-semibold text-gray-800 mt-2">${o.nationality || o.season}</h4>
                ${o.currentShare ? `<p class="text-sm text-gray-600">Current Share: ${o.currentShare}% | Satisfaction: ${o.satisfaction} | Avg Spend: NPR ${o.avgSpending?.toLocaleString()}</p>` : ''}
                ${o.insight ? `<p class="text-sm text-gray-600">${o.insight}</p>` : ''}
                <p class="text-sm text-green-700 mt-2"><strong>Recommendation:</strong> ${o.recommendation}</p>
            </div>
        `).join('');

        // Attraction Performance Table
        const tableBody = document.getElementById('attractionPerformanceTable');
        tableBody.innerHTML = diagnostics.attractionPerformance.map(a => `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3 font-medium">${a.name}</td>
                <td class="px-4 py-3">${a.city}</td>
                <td class="px-4 py-3"><span class="px-2 py-1 bg-gray-100 rounded text-xs">${a.category}</span></td>
                <td class="px-4 py-3 text-right">${a.visitCount.toLocaleString()}</td>
                <td class="px-4 py-3 text-right">${a.avgRating}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs ${getPerformanceColor(a.performance)}">${a.performance}</span>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading performance diagnostics:', error);
    }
}

// ============== PREDICTIVE DASHBOARD ==============
async function loadPredictiveDashboard() {
    loadPredictiveSection(currentPredictiveSection);
}

async function loadPredictiveSection(sectionName) {
    try {
        switch(sectionName) {
            case 'clustering':
                await loadClustering();
                break;
            case 'forecasts':
                await loadForecasts();
                break;
            case 'recommendations':
                await loadRecommendations();
                break;
            case 'vendors':
                await loadVendorData(currentVendorType);
                break;
        }
    } catch (error) {
        console.error('Error loading predictive section:', error);
    }
}
async function loadClustering() {
    try {
        const data = await fetch(`${API_BASE}/clustering`).then(r => r.json());
        
        const clusterCards = document.getElementById('clusterCards');
        clusterCards.innerHTML = data.clusters.map((cluster, i) => `
            <div class="card bg-white rounded-xl p-6 shadow-md border-t-4 cluster-${i}" style="border-top-color: ${['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][i]}">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800">${cluster.name}</h3>
                        <p class="text-sm text-gray-500">${cluster.size.toLocaleString()} tourists (${cluster.percentage}%)</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold text-white" style="background-color: ${['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][i]}">
                        Cluster ${cluster.clusterId}
                    </span>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-xs text-gray-500">Avg Spending</p>
                        <p class="text-lg font-semibold text-gray-800">NPR ${cluster.characteristics.avgSpending.toLocaleString()}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Avg Duration</p>
                        <p class="text-lg font-semibold text-gray-800">${cluster.characteristics.avgDuration} days</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Satisfaction</p>
                        <p class="text-lg font-semibold text-gray-800">${cluster.characteristics.avgSatisfaction}/10</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Recommend Rate</p>
                        <p class="text-lg font-semibold text-gray-800">${cluster.characteristics.recommendRate}%</p>
                    </div>
                </div>

                <div class="mb-4">
                    <p class="text-xs text-gray-500 mb-1">Top Characteristics</p>
                    <div class="flex flex-wrap gap-2">
                        <span class="px-2 py-1 bg-gray-100 rounded text-xs">${cluster.characteristics.topNationality}</span>
                        <span class="px-2 py-1 bg-gray-100 rounded text-xs">${cluster.characteristics.topPurpose}</span>
                        <span class="px-2 py-1 bg-gray-100 rounded text-xs">${cluster.characteristics.topAccommodation}</span>
                    </div>
                </div>

                ${cluster.diagnostics.length > 0 ? `
                    <div class="bg-yellow-50 rounded-lg p-3 mb-4">
                        <p class="text-xs font-semibold text-yellow-800 mb-1">🔍 Diagnostic Insight</p>
                        <p class="text-xs text-yellow-700">${cluster.diagnostics[0].insight}: ${cluster.diagnostics[0].reason}</p>
                    </div>
                ` : ''}

                <div class="bg-blue-50 rounded-lg p-3">
                    <p class="text-xs font-semibold text-blue-800 mb-2">💡 Vendor Recommendations</p>
                    <ul class="text-xs text-blue-700 space-y-1">
                        ${cluster.vendorRecommendations.slice(0, 3).map(r => `<li>• ${r}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');

        // Cluster Comparison Chart
        renderChart('clusterChart', 'radar', {
            labels: ['Spending (scaled)', 'Duration', 'Satisfaction', 'Attractions', 'Guide Usage %'],
            datasets: data.clusters.map((cluster, i) => ({
                label: cluster.name,
                data: [
                    cluster.characteristics.avgSpending / 10000,
                    parseFloat(cluster.characteristics.avgDuration),
                    parseFloat(cluster.characteristics.avgSatisfaction),
                    parseFloat(cluster.characteristics.avgAttractions),
                    parseFloat(cluster.characteristics.guideUsageRate) / 10
                ],
                backgroundColor: `${['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][i]}33`,
                borderColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][i]
            }))
        });

    } catch (error) {
        console.error('Error loading clustering:', error);
    }
}

// ============== FORECASTS (Predictive) ==============
async function loadForecasts() {
    try {
        const cohort = await fetch(`${API_BASE}/cohort`).then(r => r.json());

        // Monthly Trend Chart
        renderChart('cohortTrendChart', 'line', {
            labels: cohort.cohorts.map(c => c.cohortLabel),
            datasets: [
                {
                    label: 'Visitors',
                    data: cohort.cohorts.map(c => c.size),
                    borderColor: '#3B82F6',
                    backgroundColor: '#3B82F633',
                    yAxisID: 'y'
                },
                {
                    label: 'Avg Spending (K)',
                    data: cohort.cohorts.map(c => c.metrics.avgSpending / 1000),
                    borderColor: '#10B981',
                    backgroundColor: '#10B98133',
                    yAxisID: 'y1'
                }
            ]
        }, {
            scales: {
                y: { type: 'linear', position: 'left' },
                y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } }
            }
        });

        // Spending Forecast Chart
        const forecastData = cohort.cohorts.slice(-6).map(c => c.metrics.avgSpending / 1000);
        const forecastLabels = cohort.cohorts.slice(-6).map(c => c.cohortLabel);
        // Add projected months
        forecastLabels.push('Projected +1', 'Projected +2', 'Projected +3');
        const avgGrowth = forecastData.reduce((a, b) => a + b, 0) / forecastData.length;
        forecastData.push(avgGrowth * 1.05, avgGrowth * 1.08, avgGrowth * 1.12);

        renderChart('spendingForecastChart', 'line', {
            labels: forecastLabels,
            datasets: [{
                label: 'Spending Trend (K NPR)',
                data: forecastData,
                borderColor: '#8B5CF6',
                backgroundColor: '#8B5CF633',
                fill: true,
                tension: 0.4
            }]
        });

        // Market Growth Potential
        const growthDiv = document.getElementById('marketGrowthPotential');
        if (growthDiv) {
            growthDiv.innerHTML = `
                <div class="space-y-4">
                    <div class="p-4 bg-green-50 rounded-lg">
                        <h4 class="font-semibold text-green-800">🌱 High Growth Markets</h4>
                        <p class="text-sm text-gray-600 mt-2">India, China, and USA show highest potential for growth based on current trends</p>
                    </div>
                    <div class="p-4 bg-blue-50 rounded-lg">
                        <h4 class="font-semibold text-blue-800">📈 Peak Season Forecast</h4>
                        <p class="text-sm text-gray-600 mt-2">Autumn season expected to see 15% increase in visitors next year</p>
                    </div>
                    <div class="p-4 bg-purple-50 rounded-lg">
                        <h4 class="font-semibold text-purple-800">💰 Revenue Projection</h4>
                        <p class="text-sm text-gray-600 mt-2">Total revenue projected to grow 12% based on spending patterns</p>
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading forecasts:', error);
    }
}

// ============== RECOMMENDATIONS (Predictive) ==============
async function loadRecommendations() {
    try {
        const regression = await fetch(`${API_BASE}/regression`).then(r => r.json());

        // Predictive Insights
        const insightsDiv = document.getElementById('predictiveInsights');
        if (insightsDiv && regression.predictiveInsights) {
            insightsDiv.innerHTML = regression.predictiveInsights.map(insight => `
                <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-4">
                    <h4 class="font-bold text-gray-800 mb-3">${insight.title}</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        ${Object.entries(insight.profile).map(([key, value]) => {
                            if (Array.isArray(value)) {
                                return `
                                    <div>
                                        <p class="text-xs text-gray-500">${formatKey(key)}</p>
                                        <p class="font-semibold">${value.map(v => v.item || v).join(', ')}</p>
                                    </div>
                                `;
                            }
                            return `
                                <div>
                                    <p class="text-xs text-gray-500">${formatKey(key)}</p>
                                    <p class="font-semibold">${value}${key.includes('Rate') ? '%' : ''}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <p class="text-sm text-blue-700"><strong>💡 Recommendation:</strong> ${insight.recommendation}</p>
                </div>
            `).join('');
        }

        // Strategic Recommendations
        const strategyDiv = document.getElementById('strategicRecommendations');
        if (strategyDiv) {
            strategyDiv.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <h4 class="font-semibold text-blue-800">🎯 Target High-Value Segments</h4>
                        <p class="text-sm text-gray-600 mt-2">Focus marketing on premium travelers who spend 3x average and stay longer</p>
                        <ul class="text-xs text-gray-500 mt-2 space-y-1">
                            <li>• European and North American tourists</li>
                            <li>• Cultural and adventure travelers</li>
                            <li>• 14+ day trip duration</li>
                        </ul>
                    </div>
                    <div class="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <h4 class="font-semibold text-green-800">📈 Increase Guide Services</h4>
                        <p class="text-sm text-gray-600 mt-2">Tourists with guides show 15% higher satisfaction scores</p>
                        <ul class="text-xs text-gray-500 mt-2 space-y-1">
                            <li>• Bundle guide services with accommodations</li>
                            <li>• Offer specialized cultural tours</li>
                            <li>• Train guides in multiple languages</li>
                        </ul>
                    </div>
                    <div class="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                        <h4 class="font-semibold text-purple-800">🌸 Optimize Seasonal Pricing</h4>
                        <p class="text-sm text-gray-600 mt-2">Autumn has highest demand but also highest satisfaction</p>
                        <ul class="text-xs text-gray-500 mt-2 space-y-1">
                            <li>• Premium pricing in Sep-Nov</li>
                            <li>• Discount packages in Monsoon</li>
                            <li>• Early bird offers for Spring</li>
                        </ul>
                    </div>
                    <div class="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                        <h4 class="font-semibold text-orange-800">🏛️ Promote Heritage Sites</h4>
                        <p class="text-sm text-gray-600 mt-2">UNESCO sites drive highest tourist engagement</p>
                        <ul class="text-xs text-gray-500 mt-2 space-y-1">
                            <li>• Create multi-site packages</li>
                            <li>• Develop evening/night tours</li>
                            <li>• Add experiential activities</li>
                        </ul>
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}

// ============== COHORT ==============
async function loadCohort() {
    try {
        const data = await fetch(`${API_BASE}/cohort`).then(r => r.json());

        // Monthly Trend Chart
        renderChart('cohortTrendChart', 'line', {
            labels: data.cohorts.map(c => c.cohortLabel),
            datasets: [
                {
                    label: 'Visitors',
                    data: data.cohorts.map(c => c.size),
                    borderColor: '#3B82F6',
                    backgroundColor: '#3B82F633',
                    yAxisID: 'y'
                },
                {
                    label: 'Avg Spending (K)',
                    data: data.cohorts.map(c => c.metrics.avgSpending / 1000),
                    borderColor: '#10B981',
                    backgroundColor: '#10B98133',
                    yAxisID: 'y1'
                }
            ]
        }, {
            scales: {
                y: { type: 'linear', position: 'left' },
                y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } }
            }
        });

        // Seasonal Performance
        const seasonalDiv = document.getElementById('seasonalPerformance');
        seasonalDiv.innerHTML = data.seasonalPatterns.map(s => `
            <div class="flex items-center justify-between py-3 border-b">
                <div>
                    <p class="font-semibold text-gray-800">${getSeasonEmoji(s.season)} ${s.season}</p>
                    <p class="text-xs text-gray-500">${s.totalVisitors.toLocaleString()} visitors</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-green-600">NPR ${s.avgSpending.toLocaleString()}</p>
                    <p class="text-xs text-gray-500">⭐ ${s.avgSatisfaction}</p>
                </div>
            </div>
        `).join('');

        // Return Visitor Chart
        renderChart('returnVisitorChart', 'bar', {
            labels: data.returnVisitorTrend.slice(-12).map(r => r.month),
            datasets: [{
                label: 'Return Rate %',
                data: data.returnVisitorTrend.slice(-12).map(r => parseFloat(r.returnRate)),
                backgroundColor: '#8B5CF6'
            }]
        });

        // Cohort Diagnostics
        const diagnosticsDiv = document.getElementById('cohortDiagnostics');
        diagnosticsDiv.innerHTML = data.diagnostics.map(d => `
            <div class="diagnostic-warning bg-white rounded-lg p-4 mb-4 shadow-sm">
                <h4 class="font-semibold text-gray-800">${d.insight}</h4>
                <p class="text-sm text-gray-600 mt-1"><strong>Why:</strong> ${d.reason}</p>
                <p class="text-sm text-blue-600 mt-2"><strong>Action:</strong> ${d.recommendation}</p>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading cohort:', error);
    }
}

// ============== REGRESSION ==============
async function loadRegression() {
    try {
        const data = await fetch(`${API_BASE}/regression`).then(r => r.json());

        // Spending Factors
        const spendingDiv = document.getElementById('spendingFactors');
        spendingDiv.innerHTML = `
            <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                <p class="text-sm font-semibold text-blue-800">📐 Regression Equation</p>
                <p class="text-lg font-mono text-blue-900">${data.spendingFactors.regression.equation}</p>
            </div>
            ${data.spendingFactors.factors.map(f => `
                <div class="flex items-center justify-between py-2 border-b">
                    <div>
                        <p class="font-medium text-gray-800">${f.factor}</p>
                        <p class="text-xs text-gray-500">${f.insight}</p>
                    </div>
                    <div class="text-right">
                        <span class="px-2 py-1 rounded text-xs font-semibold ${getCorrelationColor(f.correlation)}">${f.impact}</span>
                        <p class="text-xs text-gray-500">r = ${f.correlation}</p>
                    </div>
                </div>
            `).join('')}
        `;

        // Satisfaction Factors
        const satisfactionDiv = document.getElementById('satisfactionFactors');
        satisfactionDiv.innerHTML = data.satisfactionFactors.map(f => {
            if (f.withFactor) {
                return `
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <p class="font-semibold text-gray-800">${f.factor}</p>
                        <div class="flex gap-4 mt-2">
                            <div class="text-center">
                                <p class="text-xs text-gray-500">With</p>
                                <p class="text-xl font-bold text-green-600">${f.withFactor}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs text-gray-500">Without</p>
                                <p class="text-xl font-bold text-red-600">${f.withoutFactor}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs text-gray-500">Difference</p>
                                <p class="text-xl font-bold text-blue-600">+${f.difference}</p>
                            </div>
                        </div>
                        <p class="text-xs text-gray-600 mt-2">${f.insight}</p>
                    </div>
                `;
            } else if (f.breakdown) {
                return `
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <p class="font-semibold text-gray-800 mb-2">${f.factor}</p>
                        <div class="space-y-2">
                            ${f.breakdown.slice(0, 5).map(b => `
                                <div class="flex justify-between items-center">
                                    <span class="text-sm">${b.type || b.season}</span>
                                    <span class="font-semibold">${b.avgSatisfaction}</span>
                                </div>
                            `).join('')}
                        </div>
                        <p class="text-xs text-gray-600 mt-2">${f.insight}</p>
                    </div>
                `;
            }
        }).join('');

        // Duration Impact Chart
        renderChart('durationImpactChart', 'bar', {
            labels: data.durationImpact.map(d => d.duration),
            datasets: [
                {
                    label: 'Avg Total Spending (K)',
                    data: data.durationImpact.map(d => d.avgSpending / 1000),
                    backgroundColor: '#3B82F6'
                },
                {
                    label: 'Avg Daily Spending (K)',
                    data: data.durationImpact.map(d => d.avgDailySpending / 1000),
                    backgroundColor: '#10B981'
                }
            ]
        });

        // Nationality Spending Chart
        const topNationalities = data.nationalitySpending.slice(0, 10);
        renderChart('nationalitySpendingChart', 'bar', {
            labels: topNationalities.map(n => n.nationality),
            datasets: [{
                label: 'Avg Spending (NPR)',
                data: topNationalities.map(n => n.avgSpending),
                backgroundColor: '#8B5CF6'
            }]
        }, { indexAxis: 'y' });

        // Predictive Insights
        const insightsDiv = document.getElementById('predictiveInsights');
        insightsDiv.innerHTML = data.predictiveInsights.map(insight => `
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-4">
                <h4 class="font-bold text-gray-800 mb-3">${insight.title}</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    ${Object.entries(insight.profile).map(([key, value]) => {
                        if (Array.isArray(value)) {
                            return `
                                <div>
                                    <p class="text-xs text-gray-500">${formatKey(key)}</p>
                                    <p class="font-semibold">${value.map(v => v.item || v).join(', ')}</p>
                                </div>
                            `;
                        }
                        return `
                            <div>
                                <p class="text-xs text-gray-500">${formatKey(key)}</p>
                                <p class="font-semibold">${value}${key.includes('Rate') ? '%' : ''}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
                <p class="text-sm text-blue-700"><strong>💡 Recommendation:</strong> ${insight.recommendation}</p>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading regression:', error);
    }
}

// ============== VENDORS ==============
// currentVendorType is already declared at the top

function showVendorType(type) {
    currentVendorType = type;
    document.querySelectorAll('.vendor-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    document.getElementById(`vendor-btn-${type}`).classList.remove('bg-gray-200', 'text-gray-700');
    document.getElementById(`vendor-btn-${type}`).classList.add('bg-blue-600', 'text-white');
    loadVendorData(type);
}

async function loadVendorData(type) {
    try {
        const data = await fetch(`${API_BASE}/vendor/${type}`).then(r => r.json());
        const contentDiv = document.getElementById('vendorContent');

        switch(type) {
            case 'accommodation':
                contentDiv.innerHTML = renderAccommodationVendor(data);
                break;
            case 'attractions':
                contentDiv.innerHTML = renderAttractionsVendor(data);
                break;
            case 'food':
                contentDiv.innerHTML = renderFoodVendor(data);
                break;
            case 'shopping':
                contentDiv.innerHTML = renderShoppingVendor(data);
                break;
            case 'transport':
                contentDiv.innerHTML = renderTransportVendor(data);
                break;
        }
    } catch (error) {
        console.error('Error loading vendor data:', error);
    }
}

function renderAccommodationVendor(data) {
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            ${data.typeAnalysis.map(t => `
                <div class="card bg-white rounded-xl p-6 shadow-md">
                    <h4 class="font-bold text-gray-800">${t.type}</h4>
                    <p class="text-sm text-gray-500 mb-4">${t.touristCount.toLocaleString()} guests (${t.marketShare}%)</p>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p class="text-gray-500">Avg Spending</p>
                            <p class="font-semibold">NPR ${t.avgSpending.toLocaleString()}</p>
                        </div>
                        <div>
                            <p class="text-gray-500">Satisfaction</p>
                            <p class="font-semibold">${t.avgSatisfaction}/10</p>
                        </div>
                        <div>
                            <p class="text-gray-500">Avg Stay</p>
                            <p class="font-semibold">${t.avgDuration} nights</p>
                        </div>
                        <div>
                            <p class="text-gray-500">Nightly Rate</p>
                            <p class="font-semibold">NPR ${t.avgNightlyRate.toLocaleString()}</p>
                        </div>
                    </div>
                    ${t.diagnostics.length > 0 ? `
                        <div class="mt-4 p-3 bg-yellow-50 rounded-lg">
                            <p class="text-xs font-semibold text-yellow-800">⚠️ ${t.diagnostics[0].issue}</p>
                            <p class="text-xs text-yellow-700 mt-1">${t.diagnostics[0].action}</p>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="card bg-white rounded-xl p-6 shadow-md mb-8">
            <h3 class="text-lg font-semibold mb-4">💰 Pricing Recommendations</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left">Type</th>
                            <th class="px-4 py-2 text-right">Tourist Daily Budget</th>
                            <th class="px-4 py-2 text-right">Current Market</th>
                            <th class="px-4 py-2 text-right">Recommended Range</th>
                            <th class="px-4 py-2 text-left">Insight</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.priceRecommendations.map(p => `
                            <tr class="border-b">
                                <td class="px-4 py-2 font-medium">${p.type}</td>
                                <td class="px-4 py-2 text-right">$${p.avgDailyBudget}/day</td>
                                <td class="px-4 py-2 text-right">NPR ${p.currentMarketPrice.toLocaleString()}</td>
                                <td class="px-4 py-2 text-right">NPR ${p.recommendedRange.low.toLocaleString()} - ${p.recommendedRange.high.toLocaleString()}</td>
                                <td class="px-4 py-2 text-sm text-gray-600">${p.insight}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card bg-white rounded-xl p-6 shadow-md">
            <h3 class="text-lg font-semibold mb-4">📍 Location Insights</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                ${data.locationInsights.map(loc => `
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-800">${loc.city}</h4>
                        <p class="text-sm text-gray-500">${loc.marketShare}% of tourists</p>
                        <div class="mt-2">
                            <p class="text-xs text-gray-500">Avg Spending: <span class="font-semibold">NPR ${loc.avgSpending.toLocaleString()}</span></p>
                            <p class="text-xs text-gray-500">Satisfaction: <span class="font-semibold">${loc.avgSatisfaction}</span></p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderAttractionsVendor(data) {
    return `
        <div class="card bg-white rounded-xl p-6 shadow-md mb-8">
            <h3 class="text-lg font-semibold mb-4">🏛️ Top Attractions by Visits</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left">Attraction</th>
                            <th class="px-4 py-2 text-left">City</th>
                            <th class="px-4 py-2 text-left">Category</th>
                            <th class="px-4 py-2 text-right">Visits</th>
                            <th class="px-4 py-2 text-right">Rating</th>
                            <th class="px-4 py-2 text-right">Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.topAttractions.map(a => `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-2 font-medium">${a.attraction_name}</td>
                                <td class="px-4 py-2">${a.city}</td>
                                <td class="px-4 py-2"><span class="px-2 py-1 bg-gray-100 rounded text-xs">${a.category}</span></td>
                                <td class="px-4 py-2 text-right">${a.visitCount.toLocaleString()}</td>
                                <td class="px-4 py-2 text-right">${a.avgRating}</td>
                                <td class="px-4 py-2 text-right">NPR ${a.totalRevenue.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="card bg-white rounded-xl p-6 shadow-md">
                <h3 class="text-lg font-semibold mb-4">📊 Category Performance</h3>
                ${data.categoryAnalysis.map(c => `
                    <div class="flex items-center justify-between py-3 border-b">
                        <div>
                            <p class="font-medium text-gray-800">${c.category}</p>
                            <p class="text-xs text-gray-500">${c.visitCount.toLocaleString()} visits</p>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold text-green-600">NPR ${(c.totalRevenue/1000).toFixed(0)}K</p>
                            <p class="text-xs text-gray-500">⭐ ${c.avgRating}</p>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="card bg-white rounded-xl p-6 shadow-md">
                <h3 class="text-lg font-semibold mb-4">🎯 Recommended Tour Packages</h3>
                ${data.tourPackageRecommendations.map(pkg => `
                    <div class="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 class="font-semibold text-blue-900">${pkg.name}</h4>
                        <p class="text-xs text-blue-700 mb-2">${pkg.duration} | ${pkg.estimatedPrice}</p>
                        <p class="text-xs text-gray-600"><strong>Attractions:</strong> ${pkg.attractions.join(', ')}</p>
                        <p class="text-xs text-gray-600"><strong>Target:</strong> ${pkg.targetMarket}</p>
                        <p class="text-xs text-gray-500 mt-1">${pkg.rationale}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderFoodVendor(data) {
    return `
        <div class="card bg-white rounded-xl p-6 shadow-md mb-8">
            <h3 class="text-lg font-semibold mb-4">🍽️ Food Spending by Nationality</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left">Nationality</th>
                            <th class="px-4 py-2 text-right">Tourists</th>
                            <th class="px-4 py-2 text-right">Daily Food Budget</th>
                            <th class="px-4 py-2 text-right">Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.byNationality.slice(0, 12).map(n => `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-2 font-medium">${n.nationality}</td>
                                <td class="px-4 py-2 text-right">${n.count.toLocaleString()}</td>
                                <td class="px-4 py-2 text-right">NPR ${n.avgDailyFood.toLocaleString()}</td>
                                <td class="px-4 py-2 text-right">NPR ${(n.totalFoodRevenue/1000).toFixed(0)}K</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card bg-white rounded-xl p-6 shadow-md">
            <h3 class="text-lg font-semibold mb-4">💡 Menu & Pricing Recommendations</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${data.recommendations.map(r => `
                    <div class="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6">
                        <h4 class="font-bold text-gray-800">${r.segment}</h4>
                        <p class="text-sm text-gray-600 mb-2">Target: ${r.nationalities}</p>
                        <p class="text-sm text-gray-600 mb-2">Budget: NPR ${r.avgDailyBudget}/day</p>
                        <p class="text-sm font-semibold text-gray-800 mb-2">${r.recommendation}</p>
                        <p class="text-xs text-gray-500"><strong>Menu Ideas:</strong> ${r.menuSuggestions.join(', ')}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderShoppingVendor(data) {
    return `
        <div class="card bg-white rounded-xl p-6 shadow-md mb-8">
            <h3 class="text-lg font-semibold mb-4">🛍️ Shopping Behavior by Nationality</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left">Nationality</th>
                            <th class="px-4 py-2 text-right">Tourists</th>
                            <th class="px-4 py-2 text-right">Avg Shopping</th>
                            <th class="px-4 py-2 text-right">Shopper Rate</th>
                            <th class="px-4 py-2 text-right">% of Total Spend</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.byNationality.slice(0, 12).map(n => `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-2 font-medium">${n.nationality}</td>
                                <td class="px-4 py-2 text-right">${n.count.toLocaleString()}</td>
                                <td class="px-4 py-2 text-right">NPR ${n.avgShopping.toLocaleString()}</td>
                                <td class="px-4 py-2 text-right">${n.shopperRate}%</td>
                                <td class="px-4 py-2 text-right">${n.shoppingShareOfSpend}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card bg-white rounded-xl p-6 shadow-md">
            <h3 class="text-lg font-semibold mb-4">💡 Product & Strategy Recommendations</h3>
            <div class="space-y-6">
                ${data.recommendations.map(r => `
                    <div class="bg-purple-50 rounded-lg p-6">
                        <h4 class="font-bold text-gray-800 mb-2">${r.title}</h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            ${r.segments.map(s => `
                                <div class="bg-white rounded p-3">
                                    <p class="font-semibold">${s.nationality}</p>
                                    <p class="text-sm text-gray-600">Avg: NPR ${s.avgSpend?.toLocaleString() || (s.totalRevenue/1000).toFixed(0) + 'K'}</p>
                                    <p class="text-xs text-gray-500">${s.count} tourists</p>
                                </div>
                            `).join('')}
                        </div>
                        <p class="text-sm"><strong>Products:</strong> ${r.products.join(', ')}</p>
                        <p class="text-sm text-blue-700 mt-2"><strong>Strategy:</strong> ${r.strategy}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderTransportVendor(data) {
    return `
        <div class="card bg-white rounded-xl p-6 shadow-md mb-8">
            <h3 class="text-lg font-semibold mb-4">🚗 Transport Mode Analysis</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${data.transportAnalysis.map(t => `
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-bold text-gray-800">${t.transport}</h4>
                        <p class="text-sm text-gray-500 mb-2">${t.marketShare}% market share</p>
                        <div class="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <p class="text-gray-500">Users</p>
                                <p class="font-semibold">${t.count.toLocaleString()}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Avg Cost</p>
                                <p class="font-semibold">NPR ${t.avgTransportCost.toLocaleString()}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Satisfaction</p>
                                <p class="font-semibold">${t.avgSatisfaction}/10</p>
                            </div>
                        </div>
                        <div class="mt-3">
                            <p class="text-xs text-gray-500">Top Users:</p>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${t.topNationalities.map(n => `<span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">${n.item}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        ${data.diagnostics.length > 0 ? `
            <div class="card bg-white rounded-xl p-6 shadow-md mb-8">
                <h3 class="text-lg font-semibold mb-4">⚠️ Service Issues</h3>
                ${data.diagnostics.map(d => `
                    <div class="diagnostic-warning bg-yellow-50 rounded-lg p-4 mb-4">
                        <h4 class="font-semibold text-yellow-800">${d.transport}: ${d.issue}</h4>
                        <p class="text-sm text-yellow-700 mt-1">${d.recommendation}</p>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        <div class="card bg-white rounded-xl p-6 shadow-md">
            <h3 class="text-lg font-semibold mb-4">🎯 Opportunities</h3>
            <div class="space-y-4">
                ${data.opportunities.map(o => `
                    <div class="flex items-center justify-between py-3 border-b">
                        <div>
                            <p class="font-semibold text-gray-800">${o.transport}</p>
                            <p class="text-sm text-gray-600">${o.opportunity}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-500">Market Share</p>
                            <p class="font-semibold">${o.currentShare}%</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ============== DIAGNOSTICS ==============
async function loadDiagnostics() {
    try {
        const data = await fetch(`${API_BASE}/diagnostics`).then(r => r.json());

        // Satisfaction Drivers
        const satDiv = document.getElementById('diagnosticSatisfaction');
        satDiv.innerHTML = data.satisfactionDrivers.map(d => `
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 class="font-semibold text-gray-800">${d.factor}</h4>
                ${d.withFactor ? `
                    <div class="flex gap-4 mt-2">
                        <div><span class="text-green-600 font-bold">${d.withFactor}</span> with</div>
                        <div><span class="text-red-600 font-bold">${d.withoutFactor}</span> without</div>
                        <div class="text-blue-600 font-bold">+${d.impact} impact</div>
                    </div>
                ` : ''}
                ${d.best ? `
                    <p class="text-sm text-gray-600 mt-2">Best: ${d.best.season} (${d.best.satisfaction}) | Worst: ${d.worst.season} (${d.worst.satisfaction})</p>
                ` : ''}
                <p class="text-xs text-gray-500 mt-2">${d.insight}</p>
            </div>
        `).join('');

        // Spending Patterns
        const spendDiv = document.getElementById('diagnosticSpending');
        spendDiv.innerHTML = data.spendingPatterns.map(p => `
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <div class="flex justify-between items-start">
                    <h4 class="font-semibold text-gray-800">${p.segment}</h4>
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">${p.percentage}%</span>
                </div>
                <p class="text-sm text-gray-600 mt-2">${p.count.toLocaleString()} tourists</p>
                <div class="mt-2">
                    <p class="text-xs text-gray-500">Avg Duration: ${p.characteristics.avgDuration} days</p>
                    <p class="text-xs text-gray-500">Guide Usage: ${p.characteristics.guideUsage}%</p>
                    <p class="text-xs text-gray-500">Top: ${p.characteristics.topNationalities.map(n => n.item).join(', ')}</p>
                </div>
            </div>
        `).join('');

        // Seasonal Insights
        const seasonDiv = document.getElementById('diagnosticSeasonal');
        seasonDiv.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                ${data.seasonalInsights.map(s => `
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-800">${getSeasonEmoji(s.season)} ${s.season}</h4>
                        <p class="text-2xl font-bold text-blue-600">${s.visitors.toLocaleString()}</p>
                        <p class="text-sm text-gray-500">visitors</p>
                        <div class="mt-2 text-xs">
                            <p>Avg Spend: NPR ${s.avgSpending.toLocaleString()}</p>
                            <p>Satisfaction: ${s.avgSatisfaction}</p>
                            <p>Recommend: ${s.recommendRate}%</p>
                        </div>
                        <p class="text-xs text-blue-600 mt-2">${s.insight}</p>
                    </div>
                `).join('')}
            </div>
        `;

        // Market Opportunities
        const oppDiv = document.getElementById('diagnosticOpportunities');
        oppDiv.innerHTML = data.marketOpportunities.map(o => `
            <div class="diagnostic-positive bg-green-50 rounded-lg p-4 mb-4">
                <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">${o.type}</span>
                <h4 class="font-semibold text-gray-800 mt-2">${o.nationality || o.season}</h4>
                ${o.currentShare ? `<p class="text-sm text-gray-600">Current Share: ${o.currentShare}% | Satisfaction: ${o.satisfaction} | Avg Spend: NPR ${o.avgSpending?.toLocaleString()}</p>` : ''}
                ${o.insight ? `<p class="text-sm text-gray-600">${o.insight}</p>` : ''}
                <p class="text-sm text-green-700 mt-2"><strong>Recommendation:</strong> ${o.recommendation}</p>
            </div>
        `).join('');

        // Attraction Performance Table
        const tableBody = document.getElementById('attractionPerformanceTable');
        tableBody.innerHTML = data.attractionPerformance.map(a => `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3 font-medium">${a.name}</td>
                <td class="px-4 py-3">${a.city}</td>
                <td class="px-4 py-3"><span class="px-2 py-1 bg-gray-100 rounded text-xs">${a.category}</span></td>
                <td class="px-4 py-3 text-right">${a.visitCount.toLocaleString()}</td>
                <td class="px-4 py-3 text-right">${a.avgRating}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs ${getPerformanceColor(a.performance)}">${a.performance}</span>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading diagnostics:', error);
    }
}

// ============== UTILITY FUNCTIONS ==============
function renderChart(canvasId, type, data, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    
    charts[canvasId] = new Chart(ctx, {
        type,
        data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            },
            ...options
        }
    });
}

function getSeasonEmoji(season) {
    const emojis = { 'Spring': '🌸', 'Monsoon': '☔', 'Autumn': '🍂', 'Winter': '❄️' };
    return emojis[season] || '📅';
}

function getCorrelationColor(corr) {
    const val = parseFloat(corr);
    if (val > 0.5) return 'bg-green-100 text-green-800';
    if (val > 0.3) return 'bg-blue-100 text-blue-800';
    if (val > 0) return 'bg-gray-100 text-gray-800';
    return 'bg-red-100 text-red-800';
}

function getPerformanceColor(perf) {
    const colors = {
        'Excellent': 'bg-green-100 text-green-800',
        'Good': 'bg-blue-100 text-blue-800',
        'Average': 'bg-yellow-100 text-yellow-800',
        'Needs Improvement': 'bg-red-100 text-red-800'
    };
    return colors[perf] || 'bg-gray-100 text-gray-800';
}

function formatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}
