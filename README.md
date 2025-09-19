# 🐛 BugTracker Dashboard

A modern, unified bug tracking dashboard that integrates data from Slack, Zendesk, and Shortcut APIs via AWS Lambda and DynamoDB.

## ✨ Features

- **📊 Grafana-style Dashboard**: Interactive charts and metrics using Recharts
- **📋 Bug List**: Detailed table view with filtering and search
- **🔗 Bug Linking**: Manual linking of bugs across different systems
- **📈 Real-time Data**: Live updates from DynamoDB via API Gateway
- **🎨 Modern UI**: Beautiful Ant Design interface with responsive layout
- **🔍 Advanced Filtering**: Filter by priority, source, state, and date range
- **📊 Flow Analytics**: Advanced network flow visualization with Sankey diagrams
- **🎯 Resolution Metrics**: Detailed resolution time analysis and priority breakdown
- **🔄 Real-time Updates**: Live data synchronization across all components

## 🏗️ Architecture

```
Frontend (Next.js) → API Gateway → Lambda Functions → DynamoDB
                                    ↓
                              Slack/Zendesk/Shortcut APIs
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.2** - React framework with SSR
- **React 19.1.1** - UI library
- **TypeScript 5.9.2** - Type safety
- **Ant Design 5.27.1** - UI components
- **Recharts 2.12.0** - Chart library
- **@nivo/sankey 0.99.0** - Flow visualization
- **Redux Toolkit 2.8.2** - State management
- **Styled Components 6.1.19** - CSS-in-JS

### Backend
- **AWS Lambda** - Serverless functions
- **API Gateway** - REST API
- **DynamoDB** - NoSQL database
- **Python 3.x** - Lambda runtime

### Deployment
- **AWS Amplify** - Frontend hosting
- **AWS CloudFormation** - Infrastructure as code
- **GitHub Actions** - CI/CD pipeline

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** and npm
2. **AWS Account** with deployed backend infrastructure
3. **API Gateway URL** from your backend deployment

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.us-west-2.amazonaws.com/dev
   NEXT_PUBLIC_AWS_REGION=us-west-2
   NEXT_PUBLIC_ENVIRONMENT=dev
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/
│   ├── Analytics/
│   │   └── FlowAnalytics.tsx         # Advanced flow visualization and analytics
│   ├── Dashboard/
│   │   ├── GrafanaDashboard.tsx     # Main dashboard with charts
│   │   └── MainDashboard.tsx         # Layout and navigation
│   └── BugList/
│       └── BugList.tsx              # Bug table with filters
├── lib/
│   ├── config.ts                    # Configuration constants
│   └── apiService.ts                # API communication layer
└── pages/                           # Next.js pages
    ├── index.tsx                    # Main dashboard page
    └── api/                         # API routes
```

## 🎯 Dashboard Views

### 1. Dashboard Overview
- **Key Metrics**: Total bugs, high priority, in progress, ready for QA
- **Charts**: Priority distribution, source breakdown, activity timeline
- **Filters**: Date range and source system selection

### 2. Bug List
- **Table View**: Detailed bug information with pagination
- **Search**: Full-text search across tickets and descriptions
- **Filters**: Priority, source, state, and date range
- **Actions**: View details and link bugs

### 3. Analytics
- **Flow Visualization**: Interactive Sankey diagrams showing ticket flow between systems
- **Resolution Metrics**: Detailed analysis of resolution times by priority
- **Source Analytics**: Breakdown of tickets by source system (Slack, Zendesk, Shortcut)
- **Real-time Data**: Live updates from DynamoDB with caching
- **Network Flow**: Visual representation of ticket connections and workflows

### 4. Settings (Coming Soon)
- Dashboard configuration
- User preferences
- API endpoint management

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Your API Gateway URL | Required |
| `NEXT_PUBLIC_AWS_REGION` | AWS region for API calls | `us-west-2` |
| `NEXT_PUBLIC_ENVIRONMENT` | Environment (dev/prod) | `dev` |
| `NEXT_PUBLIC_ENABLE_REAL_TIME_UPDATES` | Enable auto-refresh | `true` |
| `NEXT_PUBLIC_ENABLE_NOTIFICATIONS` | Enable notifications | `true` |

### API Endpoints

The dashboard expects these API Gateway endpoints:

- `GET /bugs?query_type=summary` - Get summary statistics and analytics data
- `GET /bugs` - Query bugs with various filters
- `POST /link-bugs` - Link bugs manually
- `POST /create-synthetic-link` - Create synthetic ticket links

## 📊 Data Sources

### DynamoDB Schema
- **Primary Key**: `ticketId` (e.g., `ZD-12345`, `SC-56789`, `SL-9876543210.12345`)
- **Sort Key**: `sourceSystem#recordId`
- **GSIs**: `priority-index`, `state-index`, `source-index`

### Supported Sources
1. **Slack**: Messages from support channels
2. **Zendesk**: Bug tickets with "bug" tag
3. **Shortcut**: Bug stories in active workflows

## 🎨 Customization

### Adding New Charts

1. **Create chart component**:
   ```tsx
   const NewChart: React.FC = () => {
     // Your chart implementation
   };
   ```

2. **Add to GrafanaDashboard**:
   ```tsx
   <ChartCard title="New Chart">
     <NewChart />
   </ChartCard>
   ```

### Adding New Filters

1. **Update config.ts**:
   ```tsx
   export const newFilters = ['option1', 'option2'];
   ```

2. **Add to components**:
   ```tsx
   <Select options={newFilters} onChange={handleChange} />
   ```

## 🔄 Data Flow

1. **Ingestion**: Lambda functions fetch data hourly from APIs
2. **Storage**: Data stored in DynamoDB with unified schema
3. **Query**: Dashboard queries via API Gateway
4. **Display**: Charts and tables render data in real-time

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

### Deploy to AWS Amplify

1. **Connect repository** to AWS Amplify
2. **Set environment variables** in Amplify console:
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_AWS_REGION`
   - `NEXT_PUBLIC_ENVIRONMENT`
3. **Deploy automatically** on push to main branch

### Deploy to AWS S3

1. **Build static files**:
   ```bash
   npm run deploy
   ```

2. **Upload to S3**:
   ```bash
   aws s3 sync out/ s3://your-bucket-name/
   ```

3. **Configure CloudFront** for CDN

## 🛠️ Development

### Adding New Features

1. **Create component** in appropriate directory
2. **Add to navigation** in `MainDashboard.tsx`
3. **Update types** if needed
4. **Test thoroughly** with real data

### Testing

```bash
# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Run development server
npm run dev
```

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Errors**:
   - Verify API Gateway URL is correct
   - Check CORS configuration
   - Ensure Lambda functions are deployed

2. **No Data Displayed**:
   - Check DynamoDB table has data
   - Verify API endpoints are working
   - Check browser console for errors

3. **Build Errors**:
   - Clear `.next` directory
   - Reinstall dependencies
   - Check TypeScript types

### Debug Mode

Enable debug logging:

```tsx
// In components
console.log('API Response:', response);
```

## 📈 Performance

### Optimization Tips

1. **Use pagination** for large datasets
2. **Implement caching** for frequently accessed data
3. **Optimize queries** with proper DynamoDB indexes
4. **Use lazy loading** for charts

### Monitoring

- **Browser DevTools**: Network and performance tabs
- **CloudWatch**: Lambda function metrics
- **DynamoDB**: Read/write capacity monitoring

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-feature`
3. **Commit changes**: `git commit -am 'Add new feature'`
4. **Push to branch**: `git push origin feature/new-feature`
5. **Submit pull request**

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review the backend documentation
3. Open an issue on GitHub

---

**Ready to track bugs like a pro? 🚀**

## 📊 Current Status

- **Total Records**: 6,804 tickets across all systems
- **Slack Messages**: 1,093 (with filtering for bug reports)
- **Zendesk Tickets**: 5,537 bug tickets
- **Shortcut Cards**: 174 bug stories
- **API Endpoint**: `https://l1izv51p40.execute-api.us-west-2.amazonaws.com/dev`
- **Frontend**: Deployed on AWS Amplify
