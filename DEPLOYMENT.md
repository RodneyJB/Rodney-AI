# 🚀 Rodney AI - Deployment Guide

## Deploy to Render

### Step 1: Push to GitHub

```bash
cd "z:\BP WEB\Rodney AI\quickstart-react"
git init
git add .
git commit -m "Initial commit - Rodney AI Monday.com App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rodney-ai-monday-app.git
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to [Render.com](https://render.com) and sign in
2. Click **"New +" → "Static Site"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `rodney-ai-monday-app`
   - **Build Command**: `npm install && npm run deploy:build`
   - **Publish Directory**: `build`
   - **Auto-Deploy**: Yes

5. Click **"Create Static Site"**

### Step 3: Configure Monday.com App

1. Go to Monday.com → **Developers** section
2. Find your "Rodney AI" app
3. Go to **Build → Features**
4. Edit your Board Item Menu feature
5. Under **Deployment**:
   - Select "Client-side code via CLI"
   - Deploy using: `npm run deploy`
   - Or set External hosting URL to your Render URL

### Step 4: Test Your App

1. Open any Monday.com board
2. Right-click on an item (three dots menu)
3. Find **"Apps"** → **"Rodney AI"**
4. Your app should open with the formula interface!

## Features

✅ **Formula Engine** - Use `{ColumnName}` to reference any column  
✅ **Multiple Actions**:
  - Rename items dynamically
  - Update column values  
  - Duplicate items
  - Create subitems

✅ **Live Preview** - See formula results before executing  
✅ **Date Formatting** - Use `{Date|format:YYYY-MM-DD}`

## Example Formulas

```
{Status} - {Name}
TASK-{ID}: {Project Name}
{Client} | {Task} - {Date|format:YYYY-MM-DD}
Subtask 1, Subtask 2, Subtask 3
```

## Environment Variables

Create a `.env` file (already exists) with:

```env
VITE_MONDAY_CLIENT_ID=your_client_id
```

## Local Development

```bash
npm install
npm start
```

This will:
- Start Vite dev server on port 8301
- Create a Monday.com tunnel
- Give you a URL to test in Monday.com

## Troubleshooting

**App doesn't show in menu?**
- Check if the feature is added in Monday.com developer panel
- Verify OAuth scopes include `boards:read` and `boards:write`

**Formula not evaluating?**
- Ensure column names match exactly (case-insensitive)
- Check that the item has data in those columns

**Deployment failed?**
- Run `npm run deploy:build` locally first
- Check build output for errors
