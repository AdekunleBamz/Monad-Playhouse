# 🚀 Render Deployment Guide for Monad Playhouse Backend

## 📋 Prerequisites
- GitHub account with your Monad Playhouse repository
- MongoDB Atlas account (already set up)
- Render account (free tier available)

## 🔧 Step-by-Step Deployment

### Step 1: Sign Up for Render
1. Go to [Render.com](https://render.com)
2. Click "Get Started" or "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Render to access your GitHub account

### Step 2: Create New Web Service
1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select: `AdekunleBamz/Monad-Playhouse`

### Step 3: Configure Your Service
Fill in these exact settings:

#### Basic Settings:
- **Name**: `monad-playhouse-leaderboard`
- **Region**: Choose closest to your users (US East recommended)
- **Branch**: `master`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### Environment Variables:
Click **"Environment"** tab and add these variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://adebamzzw1_db_user:GSZXxpbNIdVjZSQc@cluster0.fbquz94.mongodb.net/monad-playhouse?retryWrites=true&w=majority&appName=Cluster0` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://monad-playhouse.vercel.app` |
| `MGID_PRIVATE_KEY` | `0x5df267fd6e370e395826236785055179745ed351a6398a2b5ff4c5855b5b27e2` |
| `MGID_CONTRACT_ADDRESS` | `0xceCBFF203C8B6044F52CE23D914A1bfD997541A4` |
| `MONAD_RPC_URL` | `https://rpc.testnet.monad.xyz` |
| `PORT` | `3001` |

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (2-3 minutes)
3. You'll see: "Deploy successful"

### Step 5: Get Your Backend URL
After deployment, you'll get a URL like:
```
https://monad-playhouse-leaderboard.onrender.com
```

Your API endpoints will be:
- Health Check: `https://monad-playhouse-leaderboard.onrender.com/api/health`
- Leaderboard: `https://monad-playhouse-leaderboard.onrender.com/api/leaderboard/1`
- Submit Score: `https://monad-playhouse-leaderboard.onrender.com/api/submit-score`

## 🔍 Verify Deployment

### Test Health Endpoint:
```bash
curl https://monad-playhouse-leaderboard.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": 1234567890,
  "games": 12,
  "message": "Server running with MongoDB storage"
}
```

### Test Leaderboard:
```bash
curl https://monad-playhouse-leaderboard.onrender.com/api/leaderboard/1
```

Expected response:
```json
{
  "success": true,
  "scores": [],
  "totalPlayers": 0,
  "gameType": 1,
  "gameName": "Snake"
}
```

## 🔧 Update Frontend (if needed)

If your frontend isn't connecting to the new backend, update the URL in `public/leaderboard.js`:

```javascript
this.apiBaseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : 'https://monad-playhouse-leaderboard.onrender.com/api';
```

Then redeploy to Vercel:
```bash
git add .
git commit -m "Update backend URL to Render"
git push origin master
vercel --prod
```

## 🚨 Troubleshooting

### Issue: "Build Failed"
**Solution**: Check Render logs for errors. Common issues:
- Missing `package.json` in server directory
- Wrong start command
- Missing dependencies

### Issue: "MongoDB Connection Failed"
**Solution**: 
1. Verify MongoDB URI is correct
2. Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Render)
3. Ensure database exists

### Issue: "CORS Error"
**Solution**: Update CORS_ORIGIN environment variable in Render to match your frontend URL

### Issue: "Service Unavailable"
**Solution**: 
1. Check if service is paused (free tier limitation)
2. Restart the service in Render dashboard
3. Check logs for errors

## 📊 Monitor Your Service

### Render Dashboard Features:
- **Logs**: Real-time deployment and runtime logs
- **Metrics**: CPU, memory usage
- **Deployments**: Automatic deployments on git push
- **Environment**: Easy environment variable management

### Free Tier Limitations:
- **Sleep**: Services sleep after 15 minutes of inactivity
- **Bandwidth**: 100GB/month
- **Build Time**: 500 minutes/month

## 🎯 Mission 7 Ready!

After successful deployment:
1. ✅ **Backend**: Running on Render with MongoDB
2. ✅ **Frontend**: Deployed on Vercel
3. ✅ **Database**: MongoDB Atlas with global access
4. ✅ **Leaderboard**: Global, persistent, real-time

### Test Your Complete Setup:
1. Visit your Vercel frontend
2. Play a game
3. Submit score
4. Check leaderboard
5. Verify score persists after refresh

## 📞 Support

If you encounter issues:
1. Check Render logs in dashboard
2. Verify environment variables
3. Test API endpoints manually
4. Check MongoDB Atlas connection

---

**🎉 Your Monad Playhouse is now globally deployed and ready for Mission 7!**
