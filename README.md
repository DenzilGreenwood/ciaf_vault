# CIAF Vault 🛡️

**Single Source of Truth for AI Lifecycle Events**

CIAF Vault is a comprehensive web platform for monitoring, auditing, and governing AI systems using the Cognitive Insight™ Audit Framework (CIAF). Built with Next.js 14, Supabase, and designed for deployment on Vercel, it provides real-time observability into AI model lifecycles, shadow AI detection, compliance tracking, and cryptographic audit trails.

---

## 🌟 Features

### Core AI Model Lifecycle Tracking
- **Training Events**: Monitor model training with epoch-level snapshots
- **Inference Events**: Track prediction workloads and model performance
- **Deployment Events**: Manage model deployments across environments
- **Monitoring Events**: Continuous model health and drift detection
- **LCM Stages (A-H)**: Full lifecycle stage tracking with Lazy Capsule Materialization

### Web AI Governance
- **Shadow AI Detection**: Identify unauthorized AI tool usage (ChatGPT, Midjourney, etc.)
- **Policy Enforcement**: Real-time policy decisions (Allow/Warn/Block)
- **Sensitivity Scoring**: Content sensitivity analysis (0-100%)
- **PII Detection**: Automated detection of personal identifiable information
- **Browser Integration**: Track AI usage across web applications

### Compliance & Audit
- **Multi-Framework Support**: GDPR, HIPAA, SOC2, ISO27001, and custom frameworks
- **Real-time Compliance Scoring**: Overall compliance health dashboard
- **Violation Tracking**: Critical, high, medium, and low severity findings
- **Audit Trails**: Complete immutable record of all actions and changes
- **Remediation Workflows**: Track compliance issue resolution

### Cryptographic Receipts
- **Hash Chains**: SHA-256 content hashing for tamper detection
- **Merkle Proofs**: Cryptographic proof of event integrity
- **Digital Signatures**: Ed25519 signature verification
- **Receipt Verification**: Independent verification of audit trail

### Real-time Dashboard
- **Live Event Stream**: Real-time event ingestion (WebSocket-powered)
- **Statistics Cards**: Total events, shadow AI, compliance metrics
- **Event Distribution**: Visual breakdown by type
- **Timeline Analytics**: 7-day event trends
- **Search & Filters**: Advanced filtering capabilities

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase Edge Functions
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Real-time**: Supabase Realtime (WebSocket subscriptions)
- **Charts**: Recharts for data visualization
- **Deployment**: Vercel (recommended)

### Database Schema
Complete PostgreSQL schema with:
- `events_core` - AI model lifecycle events
- `events_web` - Web AI governance events
- `receipts` - Cryptographic audit receipts
- `compliance_events` - Regulatory compliance tracking
- `audit_trails` - Complete system audit log
- `training_snapshots` - ML training checkpoints

See [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) for full schema.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (20+ recommended)
- Supabase account ([supabase.com](https://supabase.com))
- Vercel account (optional, for deployment)

### 1. Clone & Install
```bash
cd ciaf_vault
npm install
```

### 2. Set Up Supabase

#### Create Project
1. Go to [app.supabase.com](https://app.supabase.com)
2. Create new project: `ciaf-vault`
3. Save your database password

#### Run Migrations
In Supabase Dashboard → SQL Editor:
1. Run `supabase/migrations/001_initial_schema.sql`
2. (Optional) Run `supabase/migrations/002_sample_data.sql` for demo data

See detailed setup: [`supabase/README.md`](supabase/README.md)

### 3. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these values from Supabase Dashboard → Settings → API

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📡 API Usage

### Ingest Events

#### Core AI Event
```bash
curl -X POST http://localhost:3000/api/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "core",
    "event_data": {
      "model_name": "sentiment-analyzer",
      "model_version": "2.1.0",
      "event_type": "training",
      "stage": "B",
      "lcm_stage": "training",
      "metadata": {
        "epoch": 10,
        "loss": 0.23,
        "accuracy": 0.94
      },
      "org_id": "org_demo",
      "user_id": "user_alice"
    },
    "generate_receipt": true
  }'
```

#### Web AI Event
```bash
curl -X POST http://localhost:3000/api/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "web",
    "event_data": {
      "org_id": "org_demo",
      "user_id": "user_bob",
      "tool_name": "ChatGPT",
      "tool_category": "chatbot",
      "event_type": "tool_detected",
      "policy_decision": "warn",
      "sensitivity_score": 0.65,
      "is_shadow_ai": true,
      "pii_detected": false,
      "metadata": {
        "url": "chat.openai.com",
        "browser": "Chrome"
      }
    },
    "generate_receipt": true
  }'
```

### Query Events
```bash
# Get core events
GET /api/events/core?limit=50&model_name=sentiment-analyzer

# Get web events
GET /api/events/web?org_id=org_demo&shadow_ai=true

# Get statistics
GET /api/stats
```

---

## 🐍 Python Integration (pyciaf)

CIAF Vault is designed to work seamlessly with the `pyciaf` Python package:

```python
from pyciaf import CIAFClient

# Initialize client
client = CIAFClient(
    vault_url="http://localhost:3000",
    api_key="your-api-key"  # optional
)

# Log training event
client.log_training(
    model_name="fraud-detector",
    model_version="1.0.0",
    stage="B",
    metrics={"loss": 0.15, "accuracy": 0.96},
    generate_receipt=True
)

# Log inference event
client.log_inference(
    model_name="fraud-detector",
    predictions=1523,
    flagged=12
)

# Log web AI event
client.log_web_event(
    tool_name="GitHub Copilot",
    user_id="dev_charlie",
    org_id="acme_corp",
    policy_decision="allow",
    is_shadow_ai=False
)
```

---

## 🎨 Customization

### Modify Dashboard
Edit [`app/page.tsx`](app/page.tsx) and components in [`components/dashboard/`](components/dashboard/)

### Add Custom Events
1. Extend types in [`lib/types.ts`](lib/types.ts)
2. Update database schema in `supabase/migrations/`
3. Create API endpoint in `app/api/`

### Custom Compliance Frameworks
Add frameworks in Supabase:
```sql
INSERT INTO compliance_events (framework, control_id, status, ...)
VALUES ('Custom-Framework', 'CF-001', 'compliant', ...);
```

---

## 🚢 Deployment

### Deploy to Vercel

#### 1. Connect Repository
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### 2. Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### 3. Deploy
```bash
vercel --prod
```

Your CIAF Vault will be live at `https://your-project.vercel.app`

### Enable Real-time
In Supabase Dashboard → Database → Replication:
- Enable replication for `events_core`, `events_web`, `compliance_events`

---

## 📊 Dashboard Pages

| Page | URL | Description |
|------|-----|-------------|
| **Dashboard** | `/` | Live event stream, statistics, timeline |
| **Models** | `/models` | AI model lifecycle events (training, inference, deployment) |
| **Web Events** | `/web` | Shadow AI detection, policy enforcement |
| **Compliance** | `/compliance` | GDPR, HIPAA, SOC2 compliance tracking |
| **Analytics** | `/analytics` | Trends, insights, usage patterns *(coming soon)* |
| **Receipts** | `/receipts` | Receipt verification, hash chain validation |

---

## 🔐 Security

### Row Level Security (RLS)
Supabase RLS policies enforce organization-level data isolation:
```sql
CREATE POLICY "Users see own org data"
ON events_web FOR SELECT
USING (org_id = current_setting('app.current_org_id'));
```

### API Security
- Service role key for event ingestion (server-side only)
- Anon key for client-side queries (restricted by RLS)
- Optional API key authentication (`CIAF_API_KEY` env var)

### Cryptographic Integrity
- SHA-256 content hashing
- Ed25519 digital signatures
- Merkle tree proofs for event chains

---

## 📚 Documentation

- [Supabase Setup Guide](supabase/README.md)
- [Database Schema](supabase/migrations/001_initial_schema.sql)
- [API Types](lib/types.ts)
- [CIAF Framework Documentation](https://github.com/DenzilGreenwood/pyciaf)

---

## 🤝 Contributing

CIAF Vault is licensed under BUSL-1.1. Contributions are welcome under the same license terms:

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Submit a pull request

See [LICENSE](LICENSE) for contribution requirements.

---

## 📄 License

**Business Source License 1.1 (BUSL-1.1)**

- **Licensor**: Denzil James Greenwood / CognitiveInsight.ai
- **Change Date**: January 1, 2029
- **Change License**: Apache 2.0

**Permitted Use**:
- ✅ Non-commercial research & education
- ✅ Internal evaluation (90 days)
- ✅ Personal use
- ✅ Open source contributions

**Prohibited Without Commercial License**:
- ❌ Commercial SaaS/hosted services
- ❌ Revenue-generating deployments
- ❌ White-label products
- ❌ Competitive products

For commercial licensing: **Founder@cognitiveinsight.ai**

See [LICENSE](LICENSE) for full terms.

---

## 🏛️ Trademarks

- **Cognitive Insight™** - Trademark of Denzil James Greenwood
- **LCM™** (Lazy Capsule Materialization) - Trademark of Denzil James Greenwood

---

## 💼 Support

- **Technical Support**: Founder@cognitiveinsight.ai
- **Commercial Licensing**: Founder@cognitiveinsight.ai
- **Documentation**: [GitHub Repository](https://github.com/DenzilGreenwood/pyciaf)
- **Website**: [CognitiveInsight.ai](https://cognitiveinsight.ai)

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - PostgreSQL backend
- [Vercel](https://vercel.com/) - Deployment platform
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Recharts](https://recharts.org/) - Data visualization

---

## 🎯 Roadmap

- [ ] Advanced analytics with custom dashboards
- [ ] Webhook notifications for critical events
- [ ] Multi-tenancy with organization management
- [ ] AI model registry integration
- [ ] Automated compliance report generation
- [ ] Mobile application
- [ ] Blockchain anchoring for receipts
- [ ] MLOps platform integrations (MLflow, Weights & Biases)

---

**© 2025 Denzil James Greenwood | Cognitive Insight™ | LCM™**

*Defensive Publication Notice: This software establishes prior art for CIAF and Lazy Capsule Materialization (LCM) to prevent proprietary capture.*
