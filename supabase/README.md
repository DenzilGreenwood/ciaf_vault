# Supabase Setup Instructions

## Prerequisites
- Supabase account (https://supabase.com)
- Supabase CLI (optional, for local development)

## Steps

### 1. Create Supabase Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose your organization
4. Set project name: `ciaf-vault`
5. Set database password (save this!)
6. Select region closest to your users
7. Click "Create new project"

### 2. Run Database Migrations

#### Option A: Using Supabase Dashboard (Recommended for first-time setup)
1. Navigate to your project dashboard
2. Go to "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of `migrations/001_initial_schema.sql`
5. Paste into the SQL editor
6. Click "Run"
7. Repeat for `migrations/002_sample_data.sql` (optional, for testing)

#### Option B: Using Supabase CLI (Advanced)
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 3. Configure Environment Variables

1. Get your Supabase credentials:
   - Go to Project Settings > API
   - Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy "service_role" key (optional) → `SUPABASE_SERVICE_ROLE_KEY`

2. Create `.env.local` file in project root:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Enable Real-time (Optional)

For live event streaming:

1. Go to Database > Replication
2. Enable replication for these tables:
   - `events_core`
   - `events_web`
   - `compliance_events`
3. Save changes

### 5. Configure Row Level Security (RLS)

The schema includes basic RLS policies. To customize:

1. Go to Authentication > Policies
2. Review policies for each table
3. Modify based on your security requirements

### 6. Verify Setup

Run this query in SQL Editor to verify:

```sql
SELECT 
  (SELECT COUNT(*) FROM events_core) as core_events,
  (SELECT COUNT(*) FROM events_web) as web_events,
  (SELECT COUNT(*) FROM receipts) as receipts,
  (SELECT COUNT(*) FROM compliance_events) as compliance_events;
```

You should see non-zero counts if sample data was loaded.

## Next Steps

- Test the application: `npm run dev`
- Configure authentication (if needed)
- Set up scheduled jobs for materialized view refresh
- Review and adjust RLS policies for production

## Troubleshooting

**Issue: Migration fails**
- Check SQL syntax errors in the output
- Ensure extensions are enabled
- Verify PostgreSQL version compatibility

**Issue: RLS blocking queries**
- Temporarily disable RLS: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
- Review your RLS policies
- Use service_role key for testing

**Issue: Real-time not working**
- Verify replication is enabled for tables
- Check browser console for WebSocket errors
- Ensure anon key has correct permissions

## Support

For issues specific to CIAF Vault: Founder@cognitiveinsight.ai
For Supabase issues: https://supabase.com/docs
