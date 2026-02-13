# Auth0 Organization Login Flows Demo

A demonstration application showcasing three different Auth0 "Login Flow" configurations for B2B organization authentication.

## Overview

This application demonstrates how Auth0's organization login flow settings affect the user authentication experience. Each flow represents a different way to handle organization-based authentication, configured at the Auth0 application level.

## The Three Organization Flows

### 1. Identifier First Login

**Auth0 Configuration:** "Prompt for Credentials"

**User Experience:**
- User enters their email or username first
- Auth0 automatically identifies which organization they belong to
- User is then prompted for their password or redirected to SSO
- No manual organization selection required

**Best For:**
- Users who belong to only one organization
- Simplified login experience
- Consumer-like authentication flow in B2B context

**How to Experience:**
1. Visit the landing page at `http://localhost:3002`
2. Click "Try This Flow" on the **Identifier First Login** card
3. You'll be redirected directly to Auth0
4. Enter your email/username when prompted
5. Complete authentication

---

### 2. Organization Prompt

**Auth0 Configuration:** "Prompt for Organization"

**User Experience:**
- User is first prompted to select their organization
- Auth0 presents a list of organizations the user belongs to
- After selecting, user enters their credentials
- Explicit organization choice before authentication

**Best For:**
- Users who belong to multiple organizations
- Scenarios requiring explicit organization selection
- Multi-tenant applications where organization context matters upfront

**How to Experience:**
1. Visit the landing page at `http://localhost:3002`
2. Click "Try This Flow" on the **Organization Prompt** card
3. You'll be redirected directly to Auth0
4. Select your organization from the list
5. Enter your credentials
6. Complete authentication

---

### 3. Direct Login (No Prompt)

**Auth0 Configuration:** "No Prompt"

**User Experience:**
- Application provides the organization parameter
- No organization or identifier prompts are shown
- User goes directly to the login screen for the specified organization
- Most streamlined experience when organization is pre-determined

**Best For:**
- Deep-linked login flows (e.g., from organization-specific URLs)
- Single-tenant application instances
- When organization context is known before login
- Minimizing login friction

**How to Experience:**
1. Visit the landing page at `http://localhost:3002`
2. Click the ℹ️ icon on the **Direct Login (No Prompt)** card to configure settings (optional):
   - Set organization code (default: "alpha")
   - Set connection name (optional, default: "hooli-azure")
3. Click **"Login (Org Only)"** to login with organization parameter only
4. OR click **"Login + Connection"** to include both organization and connection parameters
5. You'll be redirected directly to Auth0
6. Login screen appears immediately with no prompts
7. Complete authentication

---

## How It Works

### Technical Implementation

Each flow button on the landing page:

1. **Constructs an Auth0 authorization URL** with the appropriate client_id
2. **Redirects directly to Auth0** - no intermediate pages
3. **Uses a different Auth0 application** configured with the specific "Login Flow" setting

```javascript
// Example: Building the authorization URL
const authUrl = new URL(`https://${auth0Domain}/authorize`);
authUrl.searchParams.set('client_id', clientId); // Different per flow
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');

// For Direct Login, add organization parameter
if (flow === 'no-prompt') {
  authUrl.searchParams.set('organization', orgId);
}

window.location.href = authUrl.toString();
```

### Auth0 Configuration Required

You must create **three separate Auth0 applications**, each with a different "Login Flow" setting:

1. **Application 1:** Set to "Prompt for Credentials"
2. **Application 2:** Set to "Prompt for Organization"
3. **Application 3:** Set to "No Prompt"

All applications must have:
- Identical callback URLs: `http://localhost:3002`
- Identical logout URLs: `http://localhost:3002`
- Identical web origins: `http://localhost:3002`
- Same organizations enabled

### Environment Variables

```env
VITE_AUTH0_DOMAIN="your-tenant.auth0.com"
VITE_AUTH0_AUDIENCE="demonstration"

# Three client IDs - one per flow
VITE_AUTH0_CLIENT_ID_PROMPT_CREDENTIALS="your_credentials_client_id"
VITE_AUTH0_CLIENT_ID_PROMPT_ORG="your_org_prompt_client_id"
VITE_AUTH0_CLIENT_ID_NO_PROMPT="your_no_prompt_client_id"

# Direct Login defaults (optional)
VITE_NO_PROMPT_DEFAULT_ORG_CODE="alpha"
VITE_NO_PROMPT_DEFAULT_CONNECTION="hooli-azure"
```

## Running the Demo

### Prerequisites
- Node.js v18+
- Auth0 tenant with organizations enabled
- Three Auth0 applications configured (see above)

### Start the Application

**Terminal 1 - Backend:**
```bash
cd api
node index.js
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Open:** `http://localhost:3002`

## User Flow

1. **Landing Page** - User sees three flow demonstration cards
2. **Click Info** - Each card has an ℹ️ icon explaining what that flow demonstrates
3. **Try Flow** - User clicks "Try This Flow" button
4. **Auth0 Redirect** - Direct redirect to Auth0 (no intermediate pages)
5. **Authentication** - User experiences the specific flow behavior
6. **Callback** - Auth0 redirects back to the application
7. **Profile Page** - User lands on profile page showing their authenticated session

## Comparing the Flows

| Feature | Identifier First | Organization Prompt | Direct Login |
|---------|-----------------|-----------------------|--------------|
| **User enters email first** | ✅ Yes | ❌ No | ❌ No |
| **User selects org** | ❌ No | ✅ Yes | ❌ No |
| **App provides org** | ❌ No | ❌ No | ✅ Yes |
| **Best for single org users** | ✅ Yes | ❌ No | ✅ Yes |
| **Best for multi-org users** | ❌ No | ✅ Yes | ❌ No |
| **Most streamlined** | ⚡ Medium | ⚡ Medium | ⚡ Fastest |
| **Requires app logic** | ❌ No | ❌ No | ✅ Yes (org lookup) |

## Documentation

For more information about Auth0 Organization Login Flows:

📖 [Official Auth0 Documentation](https://auth0.com/docs/manage-users/organizations/login-flows-for-organizations)

## Purpose

This demo helps developers:
- **Understand** the differences between Auth0's organization login flow settings
- **Experience** each flow from an end-user perspective
- **Decide** which flow best fits their B2B application requirements
- **Implement** organization-based authentication with confidence

Each flow solves different B2B authentication challenges. This application lets you test them side-by-side to make an informed decision for your use case.
