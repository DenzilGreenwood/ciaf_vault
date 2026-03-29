# CIAF Vault - Development Guide

Quick reference for local development and contributing.

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Access at [http://localhost:3000](http://localhost:3000)

### 3. Available Scripts
```bash
npm run dev          # Start dev server (hot reload)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## Project Structure

```
ciaf_vault/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── events/
│   │   │   ├── ingest/       # Event ingestion endpoint
│   │   │   ├── core/         # Query core events
│   │   │   └── web/          # Query web events
│   │   └── stats/            # Dashboard statistics
│   ├── models/               # Models page
│   ├── web/                  # Web events page
│   ├── compliance/           # Compliance page
│   ├── analytics/            # Analytics page
│   ├── receipts/             # Receipts page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Dashboard (home)
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── Navigation.tsx        # Main navigation
│   ├── dashboard/            # Dashboard components
│   ├── models/               # Model components
│   ├── web/                  # Web event components
│   └── compliance/           # Compliance components
├── lib/                      # Utilities & types
│   ├── supabase.ts          # Supabase client
│   ├── types.ts             # TypeScript types
│   ├── database.types.ts    # Generated DB types
│   └── utils.ts             # Helper functions
├── supabase/                # Supabase configuration
│   ├── migrations/          # SQL migrations
│   │   ├── 001_initial_schema.sql
│   │   └── 002_sample_data.sql
│   └── README.md
├── public/                  # Static assets
├── .env.example            # Environment template
├── package.json            # Dependencies
├── tsconfig.json          # TypeScript config
├── tailwind.config.ts     # Tailwind config
├── next.config.js         # Next.js config
├── README.md              # Main documentation
├── DEPLOYMENT.md          # Deployment guide
└── LICENSE                # BUSL-1.1 license
```

## Adding New Features

### 1. Add New Event Type

**Update Types** (`lib/types.ts`):
```typescript
export interface NewEventType extends BaseCIAFEvent {
  custom_field: string
  // ... more fields
}
```

**Update Database** (`supabase/migrations/`):
```sql
CREATE TABLE events_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  custom_field TEXT NOT NULL,
  -- ... more columns
);
```

**Create API Endpoint** (`app/api/events/new/route.ts`):
```typescript
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('events_new')
    .select('*')
  
  return NextResponse.json({ data })
}
```

### 2. Add New Page

**Create Page** (`app/newpage/page.tsx`):
```typescript
export default function NewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Page</h1>
      {/* Content */}
    </div>
  )
}
```

**Add to Navigation** (`components/Navigation.tsx`):
```typescript
const navigation = [
  // ... existing items
  { name: 'New Page', href: '/newpage', icon: YourIcon },
]
```

### 3. Add New Component

**Create Component** (`components/NewComponent.tsx`):
```typescript
'use client'

export function NewComponent() {
  return <div>New Component</div>
}
```

**Use in Page**:
```typescript
import { NewComponent } from '@/components/NewComponent'

export default function Page() {
  return <NewComponent />
}
```

## Working with Supabase

### Query Data
```typescript
const { data, error } = await supabase
  .from('events_core')
  .select('*')
  .eq('org_id', 'org_demo')
  .order('timestamp', { ascending: false })
  .limit(100)
```

### Insert Data
```typescript
const { data, error } = await supabase
  .from('events_core')
  .insert({
    event_id: 'evt_123',
    model_name: 'test-model',
    event_type: 'training',
    stage: 'A',
    metadata: {}
  })
```

### Real-time Subscriptions
```typescript
const channel = supabase
  .channel('events-channel')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'events_core' },
    (payload) => {
      console.log('New event:', payload.new)
    }
  )
  .subscribe()
```

## Styling Guidelines

### Use Tailwind Classes
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
    Title
  </h2>
</div>
```

### Use Utility Function for Conditional Classes
```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  'more-classes'
)}>
```

### Color Palette
- Primary: Blue (`blue-600`)
- Success: Green (`green-600`)
- Warning: Yellow/Orange (`yellow-600`, `orange-600`)
- Danger: Red (`red-600`)
- Info: Indigo (`indigo-600`)

## Testing APIs Locally

### Test Event Ingestion
```bash
curl -X POST http://localhost:3000/api/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "core",
    "event_data": {
      "model_name": "test",
      "event_type": "training",
      "stage": "A",
      "metadata": {},
      "org_id": "test",
      "user_id": "test"
    }
  }'
```

### Test Queries
```bash
# Get stats
curl http://localhost:3000/api/stats

# Get core events
curl http://localhost:3000/api/events/core?limit=10

# Get web events
curl http://localhost:3000/api/events/web?org_id=org_demo
```

## Common Tasks

### Generate Database Types
```bash
npx supabase gen types typescript --linked > lib/database.types.ts
```

### Reset Database
```sql
-- In Supabase SQL Editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then re-run migrations
```

### Clear Local Cache
```bash
rm -rf .next
npm run dev
```

## Debugging Tips

### Enable Verbose Logging
```typescript
// In lib/supabase.ts
export const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
})
```

### Check Browser Console
- Network tab for API calls
- Console for errors
- Application tab for local storage

### Use React DevTools
```bash
# Install React DevTools browser extension
# Inspect component state and props
```

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Style
- Use TypeScript
- Follow ESLint rules
- Use Prettier for formatting
- Write descriptive commit messages

## License Reminder

CIAF Vault is licensed under BUSL-1.1:
- ✅ Non-commercial use, research, evaluation
- ❌ Commercial deployment without license

For commercial use: **Founder@cognitiveinsight.ai**

---

**© 2025 Denzil James Greenwood**
