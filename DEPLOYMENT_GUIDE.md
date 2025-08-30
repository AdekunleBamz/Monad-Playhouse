# 🌍 Global Leaderboard Deployment Guide

## Quick Setup Options (Choose One)

### Option 1: MongoDB Atlas (Recommended - 5 minutes)
1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for free account
   - Create a new cluster (free tier)

2. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

3. **Deploy to Railway/Render**
   - Go to [Railway](https://railway.app) or [Render](https://render.com)
   - Connect your GitHub repo
   - Add environment variable: `MONGODB_URI=your_connection_string`
   - Deploy!

### Option 2: Supabase (PostgreSQL - 10 minutes)
1. **Create Supabase Account**
   - Go to [Supabase](https://supabase.com)
   - Create new project
   - Get database URL

2. **Use Supabase Version**
   - Replace `leaderboard-server.js` with Supabase version
   - Deploy to Railway/Render

### Option 3: Firebase (Google - 8 minutes)
1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project
   - Enable Firestore Database

2. **Use Firebase Version**
   - Replace server with Firebase version
   - Deploy to Firebase Hosting

## Current Setup (Local Testing)

### Start Local Server
```bash
cd server
npm install
node leaderboard-server.js
```

### Test API
```bash
curl http://localhost:3001/api/health
```

## Deployment Steps

### 1. MongoDB Atlas Setup (Recommended)

#### Step 1: Create MongoDB Atlas Account
1. Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free"
3. Fill in your details
4. Choose "Free" plan (M0)

#### Step 2: Create Database
1. Click "Build a Database"
2. Choose "FREE" tier
3. Select cloud provider (AWS/Google Cloud/Azure)
4. Choose region (closest to your users)
5. Click "Create"

#### Step 3: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password

#### Step 4: Deploy Server
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Choose "Deploy from GitHub repo"
5. Select your repository
6. Add environment variable:
   - Key: `MONGODB_URI`
   - Value: `mongodb+srv://username:password@cluster.mongodb.net/monad-playhouse?retryWrites=true&w=majority`

### 2. Update Frontend (One Line Change)

In `public/leaderboard.js`, change:
```javascript
this.apiBaseUrl = 'http://localhost:3001/api';
```

To your deployed server URL:
```javascript
this.apiBaseUrl = 'https://your-railway-app.railway.app/api';
```

### 3. Deploy Frontend

#### Option A: GitHub Pages
1. Push your code to GitHub
2. Go to Settings > Pages
3. Choose "Deploy from branch"
4. Select `main` branch and `/` folder

#### Option B: Netlify
1. Go to [Netlify](https://netlify.com)
2. Drag and drop your project folder
3. Deploy!

#### Option C: Vercel
1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repo
3. Deploy!

## Environment Variables

### Required for MongoDB
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/monad-playhouse?retryWrites=true&w=majority
PORT=3001
```

### Optional
```
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

## Testing Your Deployment

### 1. Test Server Health
```bash
curl https://your-server-url.com/api/health
```

### 2. Test Score Submission
```bash
curl -X POST https://your-server-url.com/api/submit-score \
  -H "Content-Type: application/json" \
  -d '{
    "gameType": 1,
    "score": 1000,
    "playerName": "Test Player",
    "gameDuration": 30,
    "playerAddress": "0x1234567890abcdef"
  }'
```

### 3. Test Leaderboard
```bash
curl https://your-server-url.com/api/leaderboard/1
```

## Security Features

### Built-in Protection
- ✅ Score validation (max/min scores)
- ✅ Duplicate submission prevention
- ✅ Game duration validation
- ✅ Player address validation
- ✅ Rate limiting (1 submission per minute per player)

### Additional Security (Optional)
- Add API key authentication
- Implement IP-based rate limiting
- Add request logging
- Set up monitoring alerts

## Monitoring & Analytics

### Built-in Metrics
- Total players per game
- Average scores
- Top scores
- Last played timestamps

### Optional Additions
- Real-time player count
- Score distribution charts
- Player activity heatmaps
- Achievement tracking

## Cost Estimation

### MongoDB Atlas (Free Tier)
- **Storage**: 512MB (enough for ~100,000 scores)
- **Bandwidth**: 1GB/month
- **Cost**: $0/month

### Railway/Render (Free Tier)
- **Server**: 500 hours/month
- **Bandwidth**: 100GB/month
- **Cost**: $0/month

### Total Cost: $0/month for small to medium usage!

## Troubleshooting

### Common Issues

#### 1. Connection Failed
```
Error: MongoDB connection failed
```
**Solution**: Check your connection string and network access

#### 2. CORS Errors
```
Error: CORS policy blocked
```
**Solution**: Add your frontend domain to CORS settings

#### 3. Score Not Submitting
```
Error: Score validation failed
```
**Solution**: Check score limits and game duration

### Performance Tips

1. **Database Indexes**: Already configured for optimal performance
2. **Caching**: Consider adding Redis for high-traffic scenarios
3. **CDN**: Use Cloudflare for global content delivery
4. **Monitoring**: Set up alerts for server health

## Next Steps

### Phase 1: Basic Global Leaderboard ✅
- MongoDB Atlas setup
- Railway deployment
- Frontend integration

### Phase 2: Enhanced Features (Optional)
- Real-time updates with WebSockets
- Player profiles and achievements
- Tournament system
- Social features (friends, challenges)

### Phase 3: Advanced Analytics (Optional)
- Score analytics dashboard
- Player behavior insights
- Game performance metrics
- Revenue tracking

## Support

If you need help:
1. Check the troubleshooting section
2. Review MongoDB Atlas documentation
3. Check Railway/Render deployment logs
4. Test API endpoints individually

---

**🎉 Your leaderboard will be global, fast, and reliable!**
