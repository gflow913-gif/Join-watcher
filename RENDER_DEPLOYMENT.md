# Render.com Deployment Guide

## Choose Your Deployment Method

### ⭐ OPTION A: Background Worker (RECOMMENDED)
Best for Discord bots - runs 24/7 without sleeping!

### 📋 OPTION B: Web Service with Keep-Alive
Uses the Express server already in your code.

---

## OPTION A: Background Worker (Recommended)

### Why Use This?
- ✅ Runs 24/7 without sleeping
- ✅ No need for UptimeRobot or keep-alive pings
- ✅ More reliable for Discord bots
- ⚠️ No HTTP endpoint (Express server won't be used)

### Setup Steps:

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **Deploy on Render:**
   - Go to [Render.com](https://render.com) and login
   - Click **"New +"** → **"Background Worker"**
   - Connect your GitHub repository
   - Configure:
     - **Name:** `discord-bot`
     - **Environment:** `Node`
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Plan:** **Free**

3. **Add Environment Variable:**
   - Click **"Environment"** tab
   - Add: `DISCORD_BOT_TOKEN` = `your_bot_token_here`

4. **Click "Create Background Worker"**

✅ **Done! Your bot will run 24/7!**

---

## OPTION B: Web Service (With Express Server)

### Why Use This?
- ✅ Keeps the Express server active
- ✅ Provides HTTP endpoint for webhooks or health checks
- ⚠️ Requires UptimeRobot to prevent sleeping
- ⚠️ Less reliable than Background Worker

### Setup Steps:

1. **Push to GitHub** (same as Option A)

2. **Deploy on Render:**
   - Go to [Render.com](https://render.com) and login
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Configure:
     - **Name:** `discord-bot`
     - **Environment:** `Node`
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Plan:** **Free**

3. **Add Environment Variable:**
   - Click **"Environment"** tab
   - Add: `DISCORD_BOT_TOKEN` = `your_bot_token_here`

4. **Create Web Service**

5. **Set Up Keep-Alive (REQUIRED):**
   - Go to [uptimerobot.com](https://uptimerobot.com)
   - Create monitor:
     - Type: `HTTP(s)`
     - URL: Your Render URL (e.g., `https://your-bot.onrender.com`)
     - Interval: `5 minutes`

---

## Which Option Should I Choose?

| Feature | Background Worker | Web Service |
|---------|------------------|-------------|
| **Always Online** | ✅ Yes | ⚠️ Needs UptimeRobot |
| **Reliability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **HTTP Endpoint** | ❌ No | ✅ Yes |
| **Setup Complexity** | Easy | Medium |

**Recommendation:** Use **Background Worker** unless you specifically need the HTTP endpoint.

## ⚠️ Important Warnings

### Data Persistence Issue
Your bot currently stores data in JSON files (member_data.json, casino_data.json, etc.). 

**On Render.com free tier:**
- **No persistent disk storage** - all data is lost on restart!
- Services restart every time you deploy or after ~24 hours

**Solutions:**
1. **Migrate to PostgreSQL** (Recommended for production)
   - Render offers free PostgreSQL database (expires after 30 days)
   - Requires code changes to use database instead of JSON files

2. **Accept data loss** (OK for testing only)
   - Bot data will reset on each restart

### Render Free Tier Limits
- **750 hours/month** - enough for one bot to run continuously
- **0.1 CPU** - sufficient for small Discord bots
- **PostgreSQL databases expire after 30 days**
- **Background Workers don't auto-sleep** (unlike Web Services)

## Deployment Checklist

### For Background Worker (Option A):
- [ ] Code pushed to GitHub
- [ ] Render Background Worker created
- [ ] DISCORD_BOT_TOKEN added to environment variables
- [ ] Bot is online in Discord

### For Web Service (Option B):
- [ ] Code pushed to GitHub
- [ ] Render Web Service created
- [ ] DISCORD_BOT_TOKEN added to environment variables
- [ ] UptimeRobot monitor configured (required!)
- [ ] Bot is online in Discord

## Troubleshooting

**Bot shows offline:**
- Check Render logs for errors
- Verify DISCORD_BOT_TOKEN is correct in environment variables
- For Background Worker: Check if the worker is running in Render dashboard
- For Web Service: Make sure UptimeRobot is pinging your service every 5 minutes

**Data keeps resetting:**
- This is expected with JSON file storage on Render
- Consider migrating to PostgreSQL for data persistence

**Deployment fails:**
- Check build logs on Render dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility (>=18.0.0)

## Next Steps (Optional)

If you need data persistence, I can help you:
1. Set up Render PostgreSQL database
2. Migrate your JSON storage to PostgreSQL
3. Update all data manager utilities

Let me know if you need help with any of these steps!
