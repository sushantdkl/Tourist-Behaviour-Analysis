# 🏔️ Kathmandu Valley Tourist Analytics Dashboard

An advanced analytics dashboard designed to help local vendors in Kathmandu Valley understand tourist behavior patterns and make data-driven business decisions.

## 🎯 Features

### Overview Dashboard
- **KPI Cards**: Total tourists, average spending, duration, satisfaction, recommendation rate, total revenue
- **Interactive Charts**: Nationality distribution, spending breakdown, seasonal patterns, travel purposes
- **Top Markets Table**: Detailed view of source markets with market share and spending

### Customer Segmentation (K-Means Clustering)
- **4 Customer Segments** automatically identified using machine learning
- Each cluster includes:
  - Demographic characteristics
  - Spending patterns
  - Accommodation preferences
  - Diagnostic insights explaining WHY the segment behaves this way
  - **Vendor recommendations** for targeting each segment

### Cohort Analysis
- **Monthly Visitor Trends**: Track visitor volume and spending over time
- **Seasonal Performance**: Compare metrics across seasons
- **Return Visitor Analysis**: Understand repeat visitor patterns
- **Cohort Diagnostics**: Insights into what drives cohort differences

### Regression Analysis
- **Spending Factors**: Correlation analysis showing what drives tourist spending
  - Duration impact
  - Group size effect
  - Age correlation
  - Number of attractions visited
- **Satisfaction Drivers**: 
  - Tour guide impact on satisfaction
  - Accommodation type effects
  - Seasonal satisfaction patterns
- **Predictive Insights**: High-value tourist profiles and at-risk segments

### Vendor-Specific Analytics

#### 🏨 Hotels & Accommodations
- Market share by accommodation type
- Average spending and satisfaction per type
- Pricing recommendations based on tourist budgets
- Location insights (Kathmandu, Patan, Bhaktapur)
- Diagnostic alerts for underperforming segments

#### 🎭 Attractions & Tour Operators
- Top attractions by visits and ratings
- Category performance (Religious Sites, Cultural Sites, Activities)
- City-wise analysis
- **Recommended Tour Packages** based on data

#### 🍽️ Restaurants & Food Vendors
- Food spending by nationality
- Daily budget analysis
- Menu and pricing recommendations
- Segment-specific suggestions (Premium, Budget, Pilgrimage)

#### 🛍️ Shopping & Retail
- Shopping behavior by nationality
- Shopper rates and average spend
- Product and strategy recommendations

#### 🚗 Transport Services
- Transport mode analysis
- Service quality diagnostics
- Growth opportunities

### Diagnostics
- **Satisfaction Drivers**: What makes tourists happy/unhappy
- **Spending Patterns**: High spenders vs budget travelers
- **Seasonal Insights**: Actionable recommendations for each season
- **Market Opportunities**: Underserved high-value markets
- **Attraction Performance**: Identify underperforming sites

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: HTML5, Tailwind CSS, Chart.js
- **Analytics**: 
  - ml-kmeans (K-Means clustering)
  - simple-statistics (regression, correlation)
  - lodash (data manipulation)
- **Data Processing**: csv-parse

## 📊 Data Sources

The dashboard processes 4 CSV files:
1. `kathmandu_valley_tourists.csv` - 10,000 tourist records
2. `tourist_attraction_visits.csv` - 92,678 attraction visits
3. `attractions_catalog.csv` - 49 attractions
4. `accommodations_catalog.csv` - 60 hotels

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

```bash
# Navigate to project directory
cd tourist-analytics-dashboard

# Install dependencies
npm install

# Start the server
npm start
```

### Access the Dashboard
Open http://localhost:3000 in your browser

## 📁 Project Structure

```
tourist-analytics-dashboard/
├── server.js                 # Express server
├── package.json
├── public/
│   ├── index.html           # Dashboard UI
│   └── js/
│       └── dashboard.js     # Frontend JavaScript
└── src/
    ├── data/
    │   ├── dataLoader.js    # Data loading and cleaning
    │   └── *.csv            # Data files
    ├── analytics/
    │   ├── advancedAnalytics.js  # Clustering, cohort, regression
    │   └── vendorAnalytics.js    # Vendor-specific insights
    └── routes/
        └── api.js           # API endpoints
```

## 🔌 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/overview` | Dashboard overview statistics |
| `/api/spending-breakdown` | Spending category breakdown |
| `/api/clustering` | Customer segmentation results |
| `/api/cohort` | Cohort analysis data |
| `/api/regression` | Regression analysis results |
| `/api/vendor/accommodation` | Hotel analytics |
| `/api/vendor/attractions` | Attraction analytics |
| `/api/vendor/food` | Restaurant analytics |
| `/api/vendor/shopping` | Shopping analytics |
| `/api/vendor/transport` | Transport analytics |
| `/api/nationality` | Nationality analysis |
| `/api/timeseries` | Time series data |
| `/api/diagnostics` | Diagnostic insights |

## 💡 Key Insights for Vendors

### For Hotels
- **Budget Segment** (Indian, Bangladeshi): Focus on competitive pricing, Hindi-speaking staff
- **Mid-Range** (Chinese, Korean, European): Quality amenities, organized tour partnerships
- **Luxury** (Japanese, American): Premium experiences, English fluency essential

### For Tour Operators
- **High Guide Usage = Higher Satisfaction**: Tourists using guides rate +0.5 higher
- **Cultural Packages**: Combine heritage sites with activities for maximum appeal
- **Nationality-Specific Tours**: Pilgrimage focus for Indians, cultural immersion for Westerners

### For Restaurants
- **Premium Diners**: Japanese, American - offer fine dining options
- **Budget Conscious**: Indian, Thai - value meals and local food
- **Pilgrimage Travelers**: Pure vegetarian options essential

### For Shops
- **Japanese tourists**: Highest per-capita spending on quality items
- **Indian tourists**: Volume market for religious items
- **European tourists**: Handicrafts and authentic souvenirs

## 📈 Diagnostic Framework

The dashboard explains WHY patterns occur:

1. **Cluster Diagnostics**: Why each customer segment behaves differently
2. **Satisfaction Analysis**: Impact of guides, season, accommodation type
3. **Spending Correlations**: What factors influence how much tourists spend
4. **Market Opportunities**: Underserved segments with high potential

## 🎨 Screenshots

The dashboard includes:
- Interactive charts (bar, pie, doughnut, radar, line)
- Responsive design for all screen sizes
- Color-coded performance indicators
- Actionable recommendation cards

## 📝 License

ISC License

---

**Built to empower Kathmandu Valley's local tourism industry with data-driven insights** 🇳🇵
