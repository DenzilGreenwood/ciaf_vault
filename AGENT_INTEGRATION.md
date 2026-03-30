# CIAF Vault - Agent Tracking Integration Guide

**Phase 1: Agentic Execution Boundaries - Complete ✅**

This guide explains how to integrate the pyciaf agent system with the CIAF Vault for comprehensive tracking of agent identities, actions, privilege escalations, and cryptographic receipts.

---

## 📋 Overview

The CIAF Vault now provides complete support for **Agentic Execution Boundaries** from the pyciaf package, including:

- **Agent Identity Registry** (IAM)
- **Agent Action Log** (Audit Trail)
- **Elevation Grants** (PAM - Privileged Access Management)
- **Cryptographic Receipts** (Evidence Chain)

---

## 🗄️ Database Schema

### Tables Created

**Migration:** `003_agent_tracking.sql`

1. **`agent_identities`** - Agent registry with roles, attributes, status
2. **`agent_actions`** - Complete action log with IAM/PAM decisions
3. **`elevation_grants`** - Temporary privilege escalations with approval workflow
4. **`agent_receipts`** - Cryptographic evidence chain for all actions

### Views

- `active_agents_summary` - Quick stats for all active agents
- `recent_violations` - Last 100 denied actions
- `active_elevations` - Currently valid elevation grants

---

## 🔌 API Endpoints

All endpoints require `x-ciaf-api-key` header.

### Agent Registration

```bash
POST /api/agents/register

{
  "principal_id": "agent-payment-001",
  "principal_type": "agent",  # agent | service | human | system
  "display_name": "Payment Approval Agent",
  "roles": ["payment_approver", "financial_analyst"],
  "attributes": {
    "tenant_id": "acme-corp",
    "environment": "production",
    "department": "finance"
  },
  "created_by": "admin-user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "principal_id": "agent-payment-001",
    "fingerprint": "sha256-hash...",
    "status": "active",
    "created_at": "2026-03-29T..."
  }
}
```

---

### Action Execution (IAM/PAM)

```bash
POST /api/agents/actions/execute

{
  "principal_id": "agent-payment-001",
  "action": "approve_payment",
  "resource": {
    "resource_id": "payment-12345",
    "resource_type": "payment",
    "resource_tenant": "acme-corp"
  },
  "params": {
    "amount": 50000,
    "currency": "USD",
    "recipient": "vendor-xyz"
  },
  "justification": "Approved invoice #INV-2026-001",
  "correlation_id": "workflow-abc-123",
  "elevation_grant_id": "grant-xyz"  # Optional - for PAM
}
```

**Response (Allowed):**
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "reason": "Agent has required role for action 'approve_payment'",
    "action_id": "action-1711...",
    "receipt": {
      "receipt_id": "receipt-agent-1711...",
      "receipt_hash": "sha256-hash...",
      "signature": "hmac-sha256-signature...",
      "prior_receipt_hash": "0000..." // Chain to previous receipt
    },
    "policy_obligations": []
  }
}
```

**Response (Denied):**
```json
{
  "success": false,
  "data": {
    "allowed": false,
    "reason": "Agent lacks required role for action 'approve_payment'. Required: payment_approver or admin",
    "action_id": "action-1711...",
    "elevation_required": true,
    "available_roles": ["viewer", "analyst"]
  },
  "status": 403
}
```

---

### Grant Privilege Elevation

```bash
POST /api/agents/elevations/grant

{
  "principal_id": "agent-payment-001",
  "elevated_role": "payment_approver",
  "scope": {
    "actions": ["approve_payment"],
    "resource_types": ["payment"],
    "max_amount": 100000
  },
  "approved_by": "manager-jane",
  "approval_ticket": "INC-2026-001",
  "purpose": "Emergency payment processing during system maintenance",
  "justification": "Regular payment system down, need manual approvals",
  "valid_from": "2026-03-29T10:00:00Z",  # Optional - defaults to now
  "valid_until": "2026-03-29T18:00:00Z",
  "max_uses": 10  # Optional - unlimited if not specified
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "grant_id": "grant-1711...",
    "status": "active",
    "used_count": 0,
    "valid_until": "2026-03-29T18:00:00Z"
  }
}
```

---

### List Agents

```bash
GET /api/agents?status=active&principal_type=agent&tenant_id=acme-corp&limit=50&offset=0
```

---

### Get Agent Details

```bash
GET /api/agents/{principal_id}
```

Returns identity, stats, recent actions, active grants, violations.

---

### List Actions

```bash
GET /api/agents/actions?principal_id=agent-001&decision=false&start_date=2026-03-29
```

---

### List Active Grants

```bash
GET /api/agents/elevations/active?principal_id=agent-001
```

---

## 🐍 Python Integration (pyciaf)

### Example: Register Agent

```python
import requests
from ciaf.agents.core.types import Identity

# Define agent identity
identity = Identity(
    principal_id="agent-payment-001",
    principal_type="agent",
    display_name="Payment Approval Agent",
    roles={"payment_approver", "financial_analyst"},
    attributes={
        "tenant_id": "acme-corp",
        "environment": "production",
        "department": "finance"
    }
)

# Register with vault
response = requests.post(
    "https://your-vault.vercel.app/api/agents/register",
    headers={
        "x-ciaf-api-key": "ciaf_sk_...",
        "Content-Type": "application/json"
    },
    json={
        "principal_id": identity.principal_id,
        "principal_type": identity.principal_type,
        "display_name": identity.display_name,
        "roles": list(identity.roles),
        "attributes": identity.attributes
    }
)

print(response.json())
```

---

### Example: Execute Action with IAM/PAM

```python
from ciaf.agents.core.types import ActionRequest, Resource

# Create action request
resource = Resource(
    resource_id="payment-12345",
    resource_type="payment",
    owner_tenant="acme-corp",
    sensitivity_level="high"
)

action_request = ActionRequest(
    action="approve_payment",
    resource=resource,
    params={"amount": 50000, "currency": "USD"},
    justification="Approved invoice #INV-2026-001",
    correlation_id="workflow-abc-123"
)

# Execute via vault
response = requests.post(
    "https://your-vault.vercel.app/api/agents/actions/execute",
    headers={
        "x-ciaf-api-key": "ciaf_sk_...",
        "Content-Type": "application/json"
    },
    json={
        "principal_id": "agent-payment-001",
        "action": action_request.action,
        "resource": {
            "resource_id": resource.resource_id,
            "resource_type": resource.resource_type,
            "resource_tenant": resource.owner_tenant
        },
        "params": action_request.params,
        "justification": action_request.justification,
        "correlation_id": action_request.correlation_id
    }
)

result = response.json()

if result["data"]["allowed"]:
    # Action approved - proceed with execution
    receipt = result["data"]["receipt"]
    print(f"✅ Action approved: {result['data']['reason']}")
    print(f"📜 Receipt: {receipt['receipt_id']}")
    
    # Store receipt in local pyciaf vault
    # ... local storage logic ...
    
else:
    # Action denied - log violation
    print(f"❌ Action denied: {result['data']['reason']}")
    
    if result["data"].get("elevation_required"):
        print("⬆️ Privilege elevation needed")
        print(f"Available roles: {result['data']['available_roles']}")
```

---

### Example: Grant Elevation

```python
from datetime import datetime, timedelta

# Create elevation grant request
grant_response = requests.post(
    "https://your-vault.vercel.app/api/agents/elevations/grant",
    headers={
        "x-ciaf-api-key": "ciaf_sk_...",
        "Content-Type": "application/json"
    },
    json={
        "principal_id": "agent-payment-001",
        "elevated_role": "payment_approver",
        "scope": {
            "actions": ["approve_payment"],
            "resource_types": ["payment"],
            "max_amount": 100000
        },
        "approved_by": "manager-jane",
        "approval_ticket": "INC-2026-001",
        "purpose": "Emergency payment processing",
        "valid_until": (datetime.now() + timedelta(hours=8)).isoformat(),
        "max_uses": 10
    }
)

grant = grant_response.json()["data"]
print(f"Grant ID: {grant['grant_id']}")

# Now use grant in action execution
action_response = requests.post(
    "https://your-vault.vercel.app/api/agents/actions/execute",
    headers={
        "x-ciaf-api-key": "ciaf_sk_...",
        "Content-Type": "application/json"
    },
    json={
        "principal_id": "agent-payment-001",
        "action": "approve_payment",
        "resource": {"resource_id": "payment-12345", "resource_type": "payment"},
        "elevation_grant_id": grant["grant_id"]  # Use elevation grant
    }
)
```

---

## 🎯 Policy Engine

The vault includes a basic **role-based access control (RBAC)** policy engine:

### Default Action-to-Role Mapping

```javascript
const actionRoleMap = {
  'read': ['viewer', 'analyst', 'admin'],
  'write': ['editor', 'admin'],
  'delete': ['admin'],
  'approve_payment': ['payment_approver', 'finance_admin', 'admin'],
  'deploy_model': ['ml_engineer', 'deployment_admin', 'admin'],
  'access_pii': ['data_steward', 'compliance_officer', 'admin']
}
```

**To customize:** Update `app/api/agents/actions/execute/route.ts` → `evaluateIAM()` function.

---

## 🔐 Cryptographic Evidence Chain

Each allowed action generates a **cryptographic receipt** with:

1. **receipt_id** - Unique identifier
2. **params_hash** - SHA-256 hash of action parameters
3. **prior_receipt_hash** - Links to previous receipt (blockchain-style)
4. **receipt_hash** - SHA-256 hash of entire receipt
5. **signature** - HMAC-SHA256 signature using CIAF_API_KEY

### Receipt Verification

Receipts can be verified via:
- Web UI: `/receipts` page
- API: `POST /api/receipts/verify`

---

## 📊 Web UI

### Agent Registry (`/agents`)
- View all registered agents
- Filter by status, type, tenant
- Quick stats (actions, violations, grants)

### Agent Details (`/agents/[id]`)
- Identity card with roles, attributes, fingerprint
- Action statistics (total, allowed, denied)
- Active elevation grants
- Recent violations
- Complete action timeline

### Action Log (`/agents/actions`)
- Searchable/filterable action history
- Shows IAM/PAM decisions
- Correlation ID tracking
- Elevation grant usage

### Elevation Grants (`/agents/elevations`)
- All active grants
- Expiration tracking
- Usage limits monitoring
- Approval details

---

## 🧪 Testing

### 1. Run Database Migration

```bash
# Connect to Supabase and run:
supabase/migrations/003_agent_tracking.sql
```

### 2. Register Test Agent

```bash
curl -X POST https://your-vault.vercel.app/api/agents/register \
  -H "x-ciaf-api-key: ciaf_sk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "principal_id": "test-agent-001",
    "principal_type": "agent",
    "display_name": "Test Agent",
    "roles": ["viewer", "analyst"],
    "attributes": {"tenant_id": "test-corp"}
  }'
```

### 3. Execute Test Action (Should Succeed)

```bash
curl -X POST https://your-vault.vercel.app/api/agents/actions/execute \
  -H "x-ciaf-api-key: ciaf_sk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "principal_id": "test-agent-001",
    "action": "read",
    "resource": {
      "resource_id": "doc-123",
      "resource_type": "document"
    },
    "justification": "Testing read access"
  }'
```

### 4. Execute Test Action (Should Fail - Insufficient Role)

```bash
curl -X POST https://your-vault.vercel.app/api/agents/actions/execute \
  -H "x-ciaf-api-key: ciaf_sk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "principal_id": "test-agent-001",
    "action": "delete",
    "resource": {
      "resource_id": "doc-123",
      "resource_type": "document"
    }
  }'
```

Expected: `"allowed": false, "elevation_required": true`

### 5. Grant Elevation and Retry

```bash
# Create grant
curl -X POST https://your-vault.vercel.app/api/agents/elevations/grant \
  -H "x-ciaf-api-key: ciaf_sk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "principal_id": "test-agent-001",
    "elevated_role": "admin",
    "scope": {"actions": ["delete"]},
    "approved_by": "test-manager",
    "purpose": "Testing PAM",
    "valid_until": "2026-03-30T00:00:00Z"
  }'

# Retry with grant_id
curl -X POST https://your-vault.vercel.app/api/agents/actions/execute \
  -H "x-ciaf-api-key: ciaf_sk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "principal_id": "test-agent-001",
    "action": "delete",
    "resource": {"resource_id": "doc-123", "resource_type": "document"},
    "elevation_grant_id": "grant-..."
  }'
```

Expected: `"allowed": true`

---

## 🔄 Integration Workflow

```
┌─────────────┐
│  pyciaf     │
│  Agent      │
└──────┬──────┘
       │
       │ 1. Register Identity
       ├─────────────────────────────────────┐
       │                                     │
       v                                     v
┌──────────────────┐              ┌─────────────────┐
│ POST /register   │              │ agent_identities│
│ - principal_id   │─────────────>│ - fingerprint   │
│ - roles          │              │ - status        │
│ - attributes     │              └─────────────────┘
└──────────────────┘
       │
       │ 2. Execute Action
       v
┌──────────────────────┐
│ POST /actions/execute│
│ - action             │
│ - resource           │
│ - justification      │
└──────┬───────────────┘
       │
       │ 3. IAM/PAM Evaluation
       v
┌──────────────────────┐
│  Policy Engine       │
│  - Check roles       │
│  - Check grants      │
│  - Evaluate scope    │
└──────┬───────────────┘
       │
       ├──> ❌ Denied ────────────────────┐
       │                                  │
       └──> ✅ Allowed                    v
              │                    ┌──────────────┐
              v                    │ agent_actions│
       ┌──────────────┐            │ decision:    │
       │ Generate     │            │ FALSE        │
       │ Receipt      │            └──────────────┘
       └──────┬───────┘
              │
              v
       ┌──────────────────┐
       │ agent_receipts   │
       │ - receipt_hash   │
       │ - signature      │
       │ - prior_hash     │ ─┐ (Hash Chain)
       └──────────────────┘  │
              │<──────────────┘
              v
       ┌──────────────────┐
       │ Return to Agent  │
       │ - Allow/Deny     │
       │ - Receipt        │
       │ - Obligations    │
       └──────────────────┘
```

---

## 📝 Next Steps

### Phase 2: Watermarking (Future)
- Image/text/PDF watermark tracking
- Fragment verification results
- Tamper detection alerts

### Phase 3: Enhanced Provenance (Future)
- Dataset capsule tracking
- Merkle tree visualizations
- Anchor derivation explorer

---

## 🔧 Configuration

**Environment Variable Required:**

```env
CIAF_API_KEY=ciaf_sk_7Rx9mK3pN8vQ2wL6tZ4sY1bC5dE0fG9hJ8aM7nP6rT5uX4vW3yZ2xA1bD6cF9gH2jK5
```

All API endpoints validate this key via `x-ciaf-api-key` header.

---

## 📚 Related Files

- **Migration:** `supabase/migrations/003_agent_tracking.sql`
- **Types:** `lib/types.ts` (AgentIdentity, AgentAction, ElevationGrant, AgentReceipt)
- **API Routes:**
  - `app/api/agents/register/route.ts`
  - `app/api/agents/route.ts`
  - `app/api/agents/[id]/route.ts`
  - `app/api/agents/actions/execute/route.ts`
  - `app/api/agents/actions/route.ts`
  - `app/api/agents/elevations/grant/route.ts`
  - `app/api/agents/elevations/active/route.ts`
- **Pages:**
  - `app/agents/page.tsx`
  - `app/agents/[id]/page.tsx`
  - `app/agents/actions/page.tsx`
  - `app/agents/elevations/page.tsx`

---

## ✅ Phase 1 Complete

**Agent Tracking System is production-ready!**

All components implemented:
- ✅ Database tables (4 new + 3 views)
- ✅ TypeScript types
- ✅ API endpoints (7 endpoints)
- ✅ Web UI (4 pages)
- ✅ Navigation updated
- ✅ IAM/PAM policy engine
- ✅ Cryptographic receipt chain
- ✅ Integration documentation

**Ready for pyciaf integration!**
