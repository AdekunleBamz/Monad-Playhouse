# 🚀 Monad Playhouse Deployment Guide

## 🔒 Security First!

**NEVER commit sensitive data to Git!** This guide shows you how to deploy securely.

## 📋 Prerequisites

1. **MongoDB Atlas Account** - Get your connection string
2. **Render Account** - For backend deployment
3. **Vercel Account** - For frontend deployment

## 🔧 Environment Setup

### 1. Local Development
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your real values
nano .env
```

### 2. Production Environment Variables

#### For Render (Backend):
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `NODE_ENV`: `production`
- `CORS_ORIGIN`: Your Vercel frontend URL

#### For Vercel (Frontend):
- No sensitive data needed (frontend only)

## 🚀 Deployment Steps

### Backend (Render)
1. Go to [Render.com](https://render.com)
2. Connect your GitHub repository
3. Create new Web Service
4. Configure:
   - **Name**: `monad-playhouse-leaderboard`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add your MongoDB URI

### Frontend (Vercel)
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Deploy automatically

## 🔐 Security Checklist

- ✅ `.env` is in `.gitignore`
- ✅ No credentials in code
- ✅ Environment variables set in cloud platforms
- ✅ MongoDB IP whitelist configured
- ✅ HTTPS enabled on all endpoints

## 📊 Verification

After deployment, test:
1. Frontend loads: `https://your-vercel-url.vercel.app`
2. Backend health: `https://your-render-url.onrender.com/api/health`
3. Leaderboard submission works
4. Scores persist in MongoDB

## 🆘 Troubleshooting

### MongoDB Connection Issues
- Check IP whitelist in MongoDB Atlas
- Verify connection string format
- Ensure environment variables are set

### CORS Issues
- Update CORS_ORIGIN in backend environment variables
- Check frontend URL matches backend CORS settings

## 📞 Support

For issues, check:
1. Render logs
2. Vercel deployment logs
3. Browser console errors
4. Network tab for API calls
