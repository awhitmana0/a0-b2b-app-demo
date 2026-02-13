# Auth0 Organization Router & FGA Demo

A comprehensive full-stack demonstration application showcasing advanced B2B authentication and authorization patterns using Auth0 Organizations and Fine-Grained Authorization (FGA).

## Overview

This project demonstrates two key B2B use cases:

1. **Multi-Flow Organization Authentication**: A complete user onboarding and login system with Auth0 Organizations, supporting multiple authentication strategies including SSO, username/password, and secure invitation-based sign-up.

2. **Fine-Grained Authorization**: A real-time message board built with Firebase, where permissions (viewing, posting, deleting) are controlled by Auth0 FGA with role-based access control.

Both features can be independently enabled or disabled via feature flags in the environment configuration.

## Features

### Authentication & Login Flows

#### Multi-Flow Landing Page
A demonstration hub showcasing four different Auth0 "Login Flow" configurations. Each button on the landing page triggers authentication directly:

1. **Identifier First Login**
   - Uses Auth0's "Prompt for Credentials" setting
   - Redirects directly to Auth0 from landing page
   - Users enter email/username first
   - Auth0 automatically determines their organization
   - No manual organization selection needed
   - Uses dedicated client_id with "Prompt for Credentials" configuration

2. **Organization Prompt**
   - Uses Auth0's "Prompt for Organization" setting
   - Redirects directly to Auth0 from landing page
   - Users select their organization before entering credentials
   - Ideal for users who belong to multiple organizations
   - Uses dedicated client_id with "Prompt for Organization" configuration

3. **Direct Login / No Prompt**
   - Uses Auth0's "No Prompt" setting
   - Two buttons: "Login (Org Only)" and "Login + Connection"
   - Configurable via settings dialog (click ℹ️ icon)
   - Application provides organization parameter (and optionally connection)
   - Most streamlined experience when organization is known
   - Users go directly to Auth0 login screen
   - Uses dedicated client_id with "No Prompt" configuration

4. **Interactive Walkthrough**
   - Full-featured demo with multiple login options
   - Tabbed UI for "Login" and "Sign Up"
   - Existing login flow selector with advanced options
   - Perfect for exploring all authentication strategies
   - Uses main client_id with full customization

**Technical Implementation:**
- Each flow button constructs the Auth0 authorization URL directly with its specific client_id
- No intermediate pages - buttons redirect straight to Auth0
- Flow type stored in localStorage for post-authentication handling
- Auth0 redirects back to the application root with authorization code
- Seamless user experience with no visible intermediate redirects

#### Tabbed User Interface (Custom Flow)
- Clean separation of "Login" and "Sign Up" experiences
- User-friendly design with Tailwind CSS
- Responsive layout for mobile and desktop

#### Multiple Login Flows (Custom Flow)
Existing users can choose from different authentication experiences:
- **Multiple Options**: Standard organization login with all available connections
- **SSO Only**: Direct login through enterprise SSO connection
- **Username/Password Only**: Database connection login
- **Internal Admin Access**: Hidden administrative connection
- **No Parameters**: Basic login without organization context

#### Direct URL Login
- Navigate to `/login/<org_code>` to auto-redirect to organization login
- Seamless deep-linking support for organization-specific authentication

#### "Continue As" Quick Login
- Cookie-based session memory of last authenticated user
- One-click re-authentication bypassing API lookups
- Improved UX for returning users

#### Configurable UI
- Centralized configuration in `src/ui-config.jsx`
- Easy customization of text, icons, and styles
- Feature flags for enabling/disabling functionality

### User Onboarding & Sign-Up

#### Automated Organization Creation Flow
A complete backend-driven sign-up process:
1. Validates organization code uniqueness
2. Creates new organization in Auth0
3. Enables required connections for the organization
4. Generates secure invitation link
5. Redirects user to complete registration with password creation

#### Organization Invitation Handling
- `/onboarding` route processes Auth0 invitation links
- Extracts `invitation` and `organization` query parameters
- Automatically initiates Auth0 authorization with invitation flow

### Fine-Grained Authorization (Auth0 FGA)

#### Role-Based Access Control
Four distinct roles with hierarchical permissions:
- **Admin**: Full access - view, post, and delete any message
- **Member**: Standard access - view and post messages, delete own posts
- **Locked User**: Read-only access - view messages only
- **Banned User**: No access - completely blocked from message board

#### Permission System
- Real-time permission checks using FGA API
- Granular control over post deletion (owner-based permissions)
- Organization-level access control

#### Just-in-Time (JIT) Provisioning
- Automatic role assignment on first organization login
- Default `member` role for new users
- Optional role synchronization from ID token claims

#### Role Synchronization
- Syncs user roles from custom ID token claims to FGA
- Configurable via `VITE_FGA_ROLE_SYNC_ENABLED` flag
- Ensures consistent permissions across systems

### Message Board

#### Real-Time Features
- Firebase Realtime Database integration
- Live message updates
- Timestamp tracking for all posts

#### Permission-Based UI
- Post creation form shown only to users with `can_post_message` permission
- Delete button appears only on posts where user has `can_delete` permission
- Confirmation dialog for destructive actions

#### User Experience
- Author attribution for all posts
- Formatted timestamps
- Hover-based delete button reveal
- Error handling and loading states

### Backend Architecture

#### Secure API Proxy
- Node.js/Express backend acts as secure intermediary
- All sensitive credentials stored server-side only
- CORS configuration for cross-origin requests

#### Service Layer
Organized into three main services:
- **auth0.js**: Auth0 Management API interactions (organizations, connections, users)
- **fga.js**: FGA API operations (permission checks, tuple writes, role updates)
- **firebase.js**: Firebase Realtime Database operations (post CRUD)

#### API Endpoints
- `GET /api/organization/name/:name` - Fetch organization by name
- `GET /api/organization/:id/connections` - Get organization connections
- `GET /api/organization/:id/internal-connection` - Get internal admin connection
- `POST /api/organization/create` - Create new organization
- `POST /api/organization/:id/invite` - Generate invitation link
- FGA endpoints: check permissions, write tuples, update roles
- Firebase endpoints: get posts, create post, delete post

#### Environment Variable Management
- Comprehensive validation on startup
- Separate configuration for frontend and backend
- Feature flags for selective functionality

### Feature Flags

Control major features via environment variables:

**Frontend Flags:**
- `VITE_MESSAGE_BOARD_ENABLED` - Enable/disable message board UI
- `VITE_FGA_ENABLED` - Enable/disable FGA permission checks
- `VITE_FGA_ROLE_SYNC_ENABLED` - Enable/disable role sync from ID token

**Backend Flags:**
- `MESSAGE_BOARD_ENABLED` - Enable/disable Firebase and message board API routes

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **@auth0/auth0-react** - Auth0 SDK for React
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **dotenv** - Environment variable management

### External Services
- **Auth0** - Authentication and user management
- **Auth0 FGA** - Fine-grained authorization
- **Firebase Realtime Database** - Real-time data storage

### Deployment
- **Vercel** - Serverless deployment platform

## Project Structure

```
a0-b2b-app-demo/
├── api/                          # Backend Express server
│   ├── index.js                  # Main server file with API routes
│   └── services/
│       ├── auth0.js              # Auth0 Management API service
│       ├── fga.js                # Auth0 FGA service
│       └── firebase.js           # Firebase Realtime Database service
├── src/                          # Frontend React application
│   ├── main.jsx                  # React entry point with Auth0Provider
│   ├── App.jsx                   # Main app with routing and flow router
│   ├── LandingPage.jsx           # Multi-flow demo selection landing page
│   ├── LoginPage.jsx             # Login/Sign-up tabbed interface (custom flow)
│   ├── LoginTab.jsx              # Login flow component
│   ├── SignUpTab.jsx             # Sign-up flow component
│   ├── PromptCredentialsLogin.jsx # Identifier-first login flow page
│   ├── PromptOrganizationLogin.jsx # Organization prompt login flow page
│   ├── NoPromptLogin.jsx         # Direct login (no prompt) flow page
│   ├── OnboardingPage.jsx        # Invitation handling
│   ├── ProfilePage.jsx           # User profile and token display
│   ├── MessageBoard.jsx          # Real-time message board
│   ├── auth0-config.js           # Auth0 configuration with flow detection
│   ├── auth0-api.js              # Frontend API client
│   ├── fga-api.js                # FGA API client
│   ├── firebase-api.js           # Firebase API client
│   ├── cookie-manager.js         # Cookie utilities
│   ├── ui-config.jsx             # Centralized UI configuration
│   └── index.css                 # Global styles
├── public/                       # Static assets
├── .env                          # Frontend environment variables
├── vercel.json                   # Vercel deployment configuration
├── vite.config.js                # Vite configuration with proxy
├── tailwind.config.js            # Tailwind CSS configuration
└── package.json                  # Dependencies and scripts
```

## Setup & Installation

### Prerequisites

1. [Node.js](https://nodejs.org/) v18 or later
2. [Auth0 Tenant](https://auth0.com/) - Sign up for free
3. [Firebase Project](https://firebase.google.com/) with Realtime Database enabled
4. [Auth0 FGA Store](https://fga.dev/) - Create a store in your Auth0 tenant

### Environment Configuration

You need to configure environment variables in two locations:

#### 1. Root `.env` File (Frontend Configuration)

Create `.env` in the project root:

```env
# Auth0 Application Credentials
# From your Regular Web Application in the Auth0 Dashboard
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_regular_web_app_client_id
VITE_AUTH0_AUDIENCE=demonstration

# Multi-Flow Client IDs (for different Auth0 Login Flow configurations)
# Create 3 additional applications in Auth0 Dashboard, each with different "Login Flow" settings
VITE_AUTH0_CLIENT_ID_PROMPT_CREDENTIALS=your_prompt_credentials_client_id
VITE_AUTH0_CLIENT_ID_PROMPT_ORG=your_prompt_org_client_id
VITE_AUTH0_CLIENT_ID_NO_PROMPT=your_no_prompt_client_id

# Feature Flags
VITE_MESSAGE_BOARD_ENABLED=true
VITE_FGA_ENABLED=true
VITE_FGA_ROLE_SYNC_ENABLED=true
```

#### 2. Backend Environment Variables

For **local development**, create `api/local.env`:

```env
# Auth0 Management API Credentials
# From your Machine to Machine Application
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_MGMT_CLIENT_ID=your_m2m_client_id
VITE_AUTH0_MGMT_CLIENT_SECRET=your_m2m_client_secret
VITE_AUTH0_AUDIENCE=https://your-tenant.us.auth0.com/api/v2/

# Auth0 FGA Credentials
VITE_FGA_API_HOST=api.us1.fga.dev
VITE_FGA_ISSUER=fga.us.auth0.com
VITE_FGA_STORE_ID=your_fga_store_id
VITE_FGA_CLIENT_ID=your_fga_client_id
VITE_FGA_CLIENT_SECRET=your_fga_client_secret

# Firebase Configuration
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Sign-Up Flow Configuration
VITE_AUTH0_CLIENT_ID=your_regular_web_app_client_id
VITE_AUTH0_DEFAULT_CONNECTION_ID=con_xxxxxxxxxxxx
VITE_AUTH0_DEFAULT_CONNECTION_NAME=Username-Password-Authentication
VITE_AUTH0_INTERNAL_ADMIN_CONNECTION_ID=con_yyyyyyyyyyyy
VITE_AUTH0_DEFAULT_ADMIN_ROLES=rol_zzzzzzzzzzzz

# Feature Flags
VITE_MESSAGE_BOARD_ENABLED=true
VITE_FGA_ENABLED=true
VITE_FGA_ROLE_SYNC_ENABLED=true
```

For **Vercel deployment**, set these as environment variables in the Vercel dashboard.

### Installation Steps

#### Terminal 1: Backend Server

```bash
# Navigate to API directory
cd api

# Install dependencies
npm install

# Start the backend (reads from local.env in development)
node index.js
```

You should see: `[Backend Init] Express app configured.`

#### Terminal 2: Frontend Development Server

```bash
# From project root
npm install

# Start Vite dev server
npm run dev
```

The application will be available at `http://localhost:3002`

The Vite dev server proxies API requests to the backend at `http://localhost:3001`

## Auth0 Configuration

### 1. Create Regular Web Applications

You need to create **four** Regular Web Applications in your Auth0 Dashboard:

#### Application 1: Main Application (Custom Walkthrough)
- Application Type: Regular Web Application
- **Login Flow**: Any setting (this will be your full-featured demo)
- Allowed Callback URLs: `http://localhost:3002`, `https://your-domain.vercel.app`
- Allowed Logout URLs: `http://localhost:3002`, `https://your-domain.vercel.app`
- Allowed Web Origins: `http://localhost:3002`, `https://your-domain.vercel.app`
- Use this Client ID for `VITE_AUTH0_CLIENT_ID`

#### Application 2: Prompt for Credentials Flow
- Application Type: Regular Web Application
- **Login Flow**: Set to "Prompt for Credentials" (identifier-first)
- Same callback/logout/origins URLs as above
- Use this Client ID for `VITE_AUTH0_CLIENT_ID_PROMPT_CREDENTIALS`

#### Application 3: Prompt for Organization Flow
- Application Type: Regular Web Application
- **Login Flow**: Set to "Prompt for Organization"
- Same callback/logout/origins URLs as above
- Use this Client ID for `VITE_AUTH0_CLIENT_ID_PROMPT_ORG`

#### Application 4: No Prompt Flow
- Application Type: Regular Web Application
- **Login Flow**: Set to "No Prompt"
- Same callback/logout/origins URLs as above
- Use this Client ID for `VITE_AUTH0_CLIENT_ID_NO_PROMPT`

**Important**: All four applications must have identical:
- Allowed Callback URLs
- Allowed Logout URLs
- Allowed Web Origins
- Organization settings (enable the same organizations for all)

### 2. Create a Machine to Machine Application

Grant permissions for Auth0 Management API:
- `read:organizations`
- `create:organizations`
- `update:organizations`
- `read:organization_connections`
- `create:organization_connections`
- `read:organization_invitations`
- `create:organization_invitations`
- `read:users`
- `create:users`
- `update:users`
- `read:connections`
- `read:roles`

### 3. Create an Auth0 Action (Login Flow)

Add custom claims to ID and Access tokens:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://demo.okta.com';

  // Determine primary role from user's roles
  const getPrimaryRole = (roles) => {
    if (!roles || roles.length === 0) return "member";
    if (roles.includes("banned_user")) return "banned_user";
    if (roles.includes("locked_user")) return "locked_user";
    if (roles.includes("admin")) return "admin";
    if (roles.includes("member")) return "member";
    return "member";
  };

  const primaryRole = getPrimaryRole(event.authorization.roles);

  // Set custom claims
  api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
  api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
  api.idToken.setCustomClaim(`${namespace}/primary_role`, primaryRole);
  api.idToken.setCustomClaim(`${namespace}/created_at`, event.user.created_at);
  api.accessToken.setCustomClaim(`${namespace}/created_at`, event.user.created_at);
  api.idToken.setCustomClaim(`${namespace}/connection_name`, event.connection.name);
};
```

### 4. Configure Organizations

Create at least one test organization with:
- A database connection (Username-Password-Authentication)
- Optionally, an enterprise SSO connection for testing

## Auth0 FGA Authorization Model

In your FGA Store, configure this authorization model:

```
model
  schema 1.1

type user

type organization
  relations
    define admin: [user]
    define banned_user: [user]
    define locked_user: [user]
    define member: [user]
    define can_view_board: admin or member or locked_user
    define can_post_message: admin or member

type post
  relations
    define owner: [user]
    define parent: [organization]
    define can_delete: owner or admin from parent
```

### Permission Logic

- **can_view_board**: Admins, members, and locked users can view
- **can_post_message**: Admins and members can post
- **can_delete**: Post owner or organization admins can delete

## Usage

### Exploring the Multi-Flow Landing Page

1. Navigate to `http://localhost:3002`
2. You'll see four cards representing different Auth0 login flow configurations
3. Click the ℹ️ icon on any card to learn about that flow and see parameter examples
4. Each flow button redirects directly to Auth0 with the appropriate client_id

### Testing Individual Login Flows

#### Identifier First Login
1. Click the "Try This Flow" button on the Identifier First Login card
2. **Redirects directly to Auth0** (no intermediate page)
3. Enter your email/username at the Auth0 prompt
4. Auth0 automatically determines your organization
5. Complete authentication
6. You'll be redirected back to `/profile`

#### Organization Prompt Login
1. Click the "Try This Flow" button on the Organization Prompt card
2. **Redirects directly to Auth0** (no intermediate page)
3. Select your organization from the Auth0 prompt
4. Enter your credentials
5. Complete authentication
6. You'll be redirected back to `/profile`

#### Direct Login (No Prompt)
1. Click the ℹ️ icon to configure settings (optional):
   - Set organization code (default: "alpha")
   - Set connection name (default: "hooli-azure")
   - Click "Save Settings"
2. Click **"Login (Org Only)"** to login with just organization parameter
3. OR click **"Login + Connection"** to include connection parameter
4. **Redirects directly to Auth0** (no intermediate page)
5. You'll go directly to the login screen without any prompts
6. Complete authentication
7. You'll be redirected back to `/profile`

#### Interactive Walkthrough (Custom Flow)
1. Click the "Try This Flow" button on the Interactive Walkthrough card
2. You'll navigate to the full-featured login page
3. On the Login tab, select a login flow from the dropdown
4. Enter an organization SSO ID (e.g., `acme-corp`)
5. Click "Continue" to initiate authentication

### Creating a New Organization

1. Navigate to the Sign Up tab
2. Fill in:
   - Email address
   - Organization display name
   - Unique organization code (URL-safe)
3. Click "Sign Up"
4. Complete the Auth0 invitation flow
5. Set your password and finish registration

### Using the Message Board

1. After authentication, click "View Message Board" from your profile
2. Post messages (if you have `can_post_message` permission)
3. Delete your own posts or any post if you're an admin
4. Messages update in real-time via Firebase

### Managing User Permissions

Permissions are controlled by FGA tuples. Use the FGA API or dashboard to:

1. Grant admin role: Write tuple `user:auth0|123 -> admin -> organization:org_abc`
2. Lock a user: Write tuple `user:auth0|123 -> locked_user -> organization:org_abc`
3. Ban a user: Write tuple `user:auth0|123 -> banned_user -> organization:org_abc`

Role changes are synced automatically if `VITE_FGA_ROLE_SYNC_ENABLED=true`.

## Deployment

The project is configured for Vercel deployment via `vercel.json`:

1. Push your code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

The configuration includes:
- Static build for the React frontend
- Serverless function for the Express API
- API rewrites and CORS headers

## Development Notes

### Proxy Configuration

The Vite dev server proxies API requests from `/api/*` to `http://localhost:3001` (backend server). This avoids CORS issues during development.

### Cookie Management

The "Continue As" feature uses cookies to store:
- Last authenticated email
- Organization ID
- SSO ID
- Login flow type
- Connection name

Cookies are cleared on "Logout & Clear Session".

### Feature Flag Implementation

Feature flags in `src/ui-config.jsx` control:
- Visibility of message board UI elements
- Execution of FGA permission checks
- Role synchronization behavior

Set flags to `false` to demo without FGA or Firebase.

## Troubleshooting

### Backend Not Starting
- Check that all required environment variables are set
- Verify `api/local.env` exists for local development
- Ensure port 3001 is not in use

### Frontend Not Connecting to Backend
- Verify backend is running on port 3001
- Check Vite proxy configuration in `vite.config.js`
- Inspect browser console for CORS errors

### Auth0 Login Errors
- Verify callback URLs match exactly (no trailing slashes)
- Check that organization exists and has connections enabled
- Ensure M2M app has required Management API permissions

### FGA Permission Errors
- Verify FGA credentials are correct
- Check that authorization model is deployed in FGA
- Ensure required tuples exist for user and organization
- Review FGA API logs for detailed error messages

### Firebase Connection Issues
- Verify Firebase database URL is correct
- Check Firebase security rules allow reads/writes
- Ensure Firebase project is on a paid plan if needed

## License

This project is provided as-is for demonstration purposes. See LICENSE file for details.

## Support

For issues or questions:
- Auth0 Documentation: https://auth0.com/docs
- Auth0 FGA Documentation: https://docs.fga.dev
- Firebase Documentation: https://firebase.google.com/docs

---

Built with Auth0, React, and Firebase
