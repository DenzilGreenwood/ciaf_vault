# CIAF Vault - Deployment Guide 🚀

Complete guide for deploying CIAF Vault to production on Vercel + Supabase.

---

## Prerequisites

- ✅ Vercel account ([vercel.com](https://vercel.com))
- ✅ Supabase account ([supabase.com](https://supabase.com))
- ✅ GitHub account (for repository hosting)
- ✅ Domain name (optional, for custom domain)

---

## Part 1: Supabase Production Setup

### 1.1 Create Production Project

1. Log in to [app.supabase.com](https://app.supabase.com)
2. Click **New Project**
3. Fill in details:
   - **Organization**: Select or create
   - **Name**: `ciaf-vault-prod`
   - **Database Password**: Generate strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (or Pro for production workloads)
4. Click **Create new project**
5. Wait 2-3 minutes for provisioning

### 1.2 Run Database Migrations

1. Go to **SQL Editor** in left sidebar
2. Click **New Query**
3. Copy contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click **Run**
5. Verify success (should see "Success. No rows returned")

**Optional**: Load sample data
- Repeat with `supabase/migrations/002_sample_data.sql`

### 1.3 Enable Real-time

1. Go to **Database** → **Replication**
2. Find these tables and toggle replication **ON**:
   - `events_core`
   - `events_web`
   - `compliance_events`
3. Click **Save**

### 1.4 Configure Row Level Security (RLS)

RLS policies are already created by migration script. To verify:

1. Go to **Authentication** → **Policies**
2. Check each table has policies enabled
3. Customize policies if needed for your org structure

### 1.5 Get API Credentials

1. Go to **Settings** → **API**
2. Copy these values (you'll need them for Vercel):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ Keep `service_role` key secret! Never expose in client code.

---

## Part 2: GitHub Repository Setup

### 2.1 Push to GitHub

```bash
# Initialize git (if not already)
cd ciaf_vault
git init

# Add files
git add .
git commit -m "Initial CIAF Vault deployment"

# Create GitHub repo (via GitHub.com or CLI)
# Then add remote
git remote add origin https://github.com/YOUR_USERNAME/ciaf-vault.git

# Push
git push -u origin main
```

### 2.2 Verify .gitignore

Ensure `.gitignore` includes:
```
.env*.local
.env
node_modules/
.next/
```

Never commit `.env.local` with secrets!

---

## Part 3: Vercel Deployment

### 3.1 Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your GitHub repository
4. Click **Import**

### 3.2 Configure Project

**Framework Preset**: Next.js (auto-detected)

**Root Directory**: `./` (default)

**Build Command**: `npm run build` (default)

**Output Directory**: `.next` (default)

Keep all defaults unless you have specific requirements.

### 3.3 Add Environment Variables

Click **Environment Variables** and add:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production, Preview, Development |

**Optional variables**:
| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_APP_NAME` | `CIAF Vault` | Production |
| `NEXT_PUBLIC_APP_VERSION` | `0.1.0` | Production |
| `CIAF_API_KEY` | Generate random key for API security | Production |

### 3.4 Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for build
3. Your site will be live at `https://your-project.vercel.app`

---

## Part 4: Post-Deployment Configuration

### 4.1 Test the Deployment

#### Visit Dashboard
```
https://your-project.vercel.app
```

Should see the CIAF Vault dashboard (empty if no sample data).

#### Test Event Ingestion
```bash
curl -X POST https://your-project.vercel.app/api/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "core",
    "event_data": {
      "model_name": "test-model",
      "event_type": "training",
      "stage": "A",
      "metadata": {},
      "org_id": "test_org",
      "user_id": "test_user"
    },
    "generate_receipt": true
  }'
```

Should return `{"success": true, ...}`

#### Verify in Dashboard
Refresh dashboard - should see the new event in live stream.

### 4.2 Custom Domain (Optional)

1. In Vercel project, go to **Settings** → **Domains**
2. Add your domain: `vault.yourdomain.com`
3. Follow Vercel's DNS configuration instructions
4. Wait for DNS propagation (5-30 minutes)

### 4.3 Configure Supabase URL Allowlist

For extra security:

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel domain to **Site URL**
3. Add to **Redirect URLs**:
   - `https://your-project.vercel.app/**`
   - `https://vault.yourdomain.com/**` (if using custom domain)

---

## Part 5: Python Integration Setup

### 5.1 Install pyciaf (Client-Side)

```bash
pip install pyciaf
```

### 5.2 Configure Client

```python
from pyciaf import CIAFClient

client = CIAFClient(
    vault_url="https://your-project.vercel.app",
    api_key="your-ciaf-api-key"  # if you set CIAF_API_KEY
)

# Test connection
client.log_training(
    model_name="production-model",
    stage="B",
    metrics={"loss": 0.12}
)
```

### 5.3 Verify Event Appears

Check your dashboard - event should appear in real-time!

---

## Part 6: Performance & Monitoring

### 6.1 Vercel Analytics (Optional)

1. In Vercel project → **Analytics**
2. Enable **Web Analytics**
3. Monitor page views, performance

### 6.2 Supabase Monitoring

1. Supabase Dashboard → **Database** → **Database**
2. Monitor:
   - **Active connections**
   - **Query performance**
   - **Table sizes**

### 6.3 Set Up Materialized View Refresh

For optimal performance, refresh analytics views periodically.

**Option A: Supabase Function (Recommended)**

Create a Supabase Edge Function to run nightly:

```sql
-- Run this in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule refresh at 2 AM daily
SELECT cron.schedule(
    'refresh-ciaf-analytics',
    '0 2 * * *',  -- 2 AM every day
    $$SELECT refresh_analytics_views()$$
);
```

**Option B: External Cron Job**

Hit this endpoint daily:
```bash
curl -X POST https://your-project.vercel.app/api/refresh-views
```

---

## Part 7: Security Hardening

### 7.1 API Key Authentication

Add to `app/api/events/ingest/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  // Verify API key
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.CIAF_API_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  
  // ... rest of code
}
```

### 7.2 Rate Limiting

Install Vercel rate limiting:

```bash
npm install @upstash/ratelimit @upstash/redis
```

Configure in API routes for production.

### 7.3 CORS Configuration

Add to `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST' },
      ],
    },
  ]
}
```

---

## Part 8: Backup & Recovery

### 8.1 Supabase Backups

**Free Plan**: Point-in-time recovery (PITR) not available

**Pro Plan**: 
1. Go to **Database** → **Backups**
2. Enable **Point in Time Recovery**
3. Configure retention period (7-30 days)

### 8.2 Manual Backup

Export data periodically:

```bash
# Using Supabase CLI
supabase db dump -f backup-$(date +%Y%m%d).sql

# Or via pg_dump
pg_dump -h db.yourproject.supabase.co -U postgres -d postgres > backup.sql
```

### 8.3 Vercel Deployment History

Vercel keeps all deployments. To rollback:

1. Go to **Deployments**
2. Find previous working deployment
3. Click **...** → **Promote to Production**

---

## Part 9: Scaling Considerations

### Database Scaling (Supabase)

**When to upgrade**:
- More than 500 MB database size
- More than 2 GB bandwidth/month
- Need more than 2 concurrent connections

**Upgrade path**:
1. Free → Pro ($25/month)
2. Pro → Team ($599/month)
3. Enterprise (custom pricing)

### Compute Scaling (Vercel)

**Hobby** (free):
- 100 GB bandwidth
- 6000 build minutes/month

**Pro** ($20/month):
- 1 TB bandwidth
- Unlimited build minutes
- Commercial use allowed

---

## Part 10: Troubleshooting

### Events Not Appearing

**Check**:
1. Browser console for errors
2. Supabase RLS policies (may be blocking)
3. API endpoint returns 200/201
4. Network tab shows successful POST

**Fix**:
```sql
-- Temporarily disable RLS for debugging
ALTER TABLE events_core DISABLE ROW LEVEL SECURITY;
```

### Real-time Not Working

**Check**:
1. Replication enabled in Supabase
2. WebSocket connection in browser Network tab
3. Browser console for Supabase errors

**Fix**:
- Verify replication: Database → Replication
- Check browser supports WebSockets

### Build Errors on Vercel

**Check**:
1. TypeScript errors: `npm run type-check`
2. Build locally: `npm run build`
3. Missing dependencies: `npm install`

**Fix**:
- Fix TypeScript errors
- Add missing dependencies to `package.json`
- Check Vercel build logs for specific errors

### Database Connection Errors

**Check**:
1. Supabase project not paused (happens on free plan after inactivity)
2. Correct credentials in environment variables
3. Supabase project quota not exceeded

**Fix**:
- Resume project in Supabase dashboard
- Verify environment variables
- Upgrade plan if quota exceeded

---

## ✅ Deployment Checklist

- [ ] Supabase project created
- [ ] Database migrations run successfully
- [ ] Real-time replication enabled
- [ ] API credentials copied
- [ ] GitHub repository created and pushed
- [ ] Vercel project imported
- [ ] Environment variables configured
- [ ] Initial deployment successful
- [ ] Dashboard loads correctly
- [ ] Event ingestion tested via API
- [ ] Real-time events working
- [ ] Custom domain configured (optional)
- [ ] API key authentication enabled (optional)
- [ ] Backups configured
- [ ] Monitoring set up

---

## 🎉 Success!

Your CIAF Vault is now live in production!

**Next Steps**:
1. Share URL with team
2. Integrate with pyciaf clients
3. Configure organization structure
4. Set up compliance frameworks
5. Monitor usage and performance

For support: **Founder@cognitiveinsight.ai**

---

**© 2025 Denzil James Greenwood | Cognitive Insight™**
