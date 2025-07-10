# Auth0 Organization Router & FGA Demo

This project is a comprehensive, full-stack demonstration application showcasing advanced B2B authentication and authorization patterns.

It is broken into two main parts:
1.  **Organization Login & Onboarding:** A complete, multi-flow system for new user sign-up and existing user login using **Auth0 Organizations**. This includes direct login, SSO, and a secure backend-driven user invitation flow.
2.  **Fine-Grained Authorization:** A real-time message board built with **Firebase**, where all user permissions (viewing, posting, deleting) are controlled by a centralized **Auth0 FGA** model.

The FGA and Firebase Message Board features are controlled by feature flags and can be disabled in the environment files if they are not needed for your demonstration.

## Features

### Authentication & Login
- **Tabbed Interface**: A clean UI separating the "Login" and "Sign Up" flows.
- **Dynamic Login Flows**: A dropdown menu allows existing users to test different login experiences:
  - **Multiple Options**: The standard organization login flow.
  - **SSO Only**: Forces login through the first available enterprise connection for an organization.
  - **Username/Password Only**: Forces login through the default database connection.
  - **Internal Admin Access**: Forces login through a hidden, internal-only connection.
  - **No Parameters**: A standard login flow without any organization context.
- **Direct URL Login**: Users can navigate to `/login/<org_code>` to be automatically redirected to their organization's login page.
- **"Continue As" Quick Login**: A cookie-based session remembers the last user, providing a one-click login experience that bypasses all API lookups.
- **Configurable UI**: Key UI text, icons, and styles are managed in a central configuration file (`src/ui-config.jsx`).

### User Onboarding & Sign-Up
- **Automated Invitation Flow**: A multi-step sign-up process that:
  1.  Validates that the chosen organization code is unique.
  2.  Creates a new organization in Auth0.
  3.  Enables the necessary connections for the new organization.
  4.  Generates a secure organization invitation link and redirects the user to complete the sign-up and password creation process.

### Authorization (Auth0 FGA)
- **Fine-Grained Access Control**: Utilizes Auth0 FGA to manage permissions for the real-time message board.
- **Role-Based Permissions**: The FGA model defines `admin`, `member`, `locked_user`, and `banned_user` roles with specific permissions:
  - **Admins**: Can view, post, and delete any message.
  - **Members**: Can view and post messages, and delete their own messages.
  - **Locked Users**: Can only view the message board (read-only).
  - **Banned Users**: Are blocked from viewing the message board entirely.
- **Just-in-Time (JIT) Provisioning**:
  - On first login to an organization, a user is automatically assigned the `member` role in FGA.
  - The application can be configured to sync a user's role from a custom claim in their ID token to FGA, ensuring roles are always up-to-date.

### Backend & Security
- **Secure Backend Proxy**: A Node.js/Express server acts as a secure proxy for all sensitive API calls.
- **Credential Protection**: All secret keys (`client_secret`, API tokens) are stored and used exclusively on the backend, never exposed to the frontend.
- **Centralized API Logic**: All interactions with external services (Auth0 Management API, FGA, Firebase) are neatly organized into service modules on the backend.

### Feature Flags
- The application uses environment variables to enable or disable major features:
  - `VITE_MESSAGE_BOARD_ENABLED`: Toggles the entire message board feature on the frontend.
  - `MESSAGE_BOARD_ENABLED`: Toggles the Firebase initialization and API routes on the backend.
  - `VITE_FGA_ENABLED`: Toggles all FGA permission checks on the frontend.
  - `VITE_FGA_ROLE_SYNC_ENABLED`: Toggles the Just-in-Time role synchronization from the ID token.

---


## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Authentication**: Auth0
- **Authorization**: Auth0 FGA
- **Database**: Firebase Realtime Database
- **Routing**: React Router DOM

---

## Setup & Installation

Follow these steps to get the application running locally. You will need two terminal windows.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- An [Auth0 Tenant](https://auth0.com/)
- A [Firebase Realtime Database](https://firebase.google.com/)
- An [Auth0 FGA Store](https://fga.dev/)

### 2. Environment Variables (`.env` files)

You need to create two `.env` files.

#### A. Root `.env` File

In the project's root directory, create a `.env` file for the **frontend**.

```env
# --- Frontend Auth0 App Credentials ---
# From your Regular Web Application in the Auth0 Dashboard
VITE_AUTH0_DOMAIN="YOUR_AUTH0_DOMAIN"
VITE_AUTH0_CLIENT_ID="YOUR_REGULAR_WEB_APP_CLIENT_ID"
VITE_AUTH0_AUDIENCE="demonstration" # Or your API identifier

# --- Feature Flags ---
VITE_MESSAGE_BOARD_ENABLED=true
VITE_FGA_ENABLED=true
VITE_FGA_ROLE_SYNC_ENABLED=true
```
B. Backend .env FileIn the backend/ directory, create a .env file for the backend server.
```env
# --- FGA Credentials ---
# From your FGA Store Dashboard
FGA_API_HOST="api.us1.fga.dev" # Or your region
FGA_ISSUER="fga.us.auth0.com" # Or your region
FGA_STORE_ID="YOUR_FGA_STORE_ID"
FGA_CLIENT_ID="YOUR_FGA_CLIENT_ID"
FGA_CLIENT_SECRET="YOUR_FGA_CLIENT_SECRET"

# --- Auth0 Management API Credentials ---
# From your Machine to Machine Application in the Auth0 Dashboard
AUTH0_DOMAIN="YOUR_AUTH0_DOMAIN"
AUTH0_MGMT_CLIENT_ID="YOUR_M2M_APP_CLIENT_ID"
AUTH0_MGMT_CLIENT_SECRET="YOUR_M2M_APP_CLIENT_SECRET"

# --- Sign-Up Flow Configuration ---
AUTH0_FRONTEND_CLIENT_ID="YOUR_REGULAR_WEB_APP_CLIENT_ID" # Same as VITE_AUTH0_CLIENT_ID
AUTH0_DEFAULT_CONNECTION_ID="con_xxxxxxxxxxxxxxxx"
AUTH0_DEFAULT_CONNECTION_NAME="Username-Password-Authentication"
AUTH0_INTERNAL_ADMIN_CONNECTION_ID="con_yyyyyyyyyyyyyyyy"
AUTH0_DEFAULT_ADMIN_ROLES="rol_zzzzzzzzzzzzzzzz" # Comma-separated if multiple

# --- Firebase Configuration ---
FIREBASE_DATABASE_URL="YOUR_FIREBASE_DATABASE_URL"

# --- Server Port & Feature Flags ---
PORT=3001
MESSAGE_BOARD_ENABLED=true
```

3. Running the Application

# Terminal 1: Start the Backend
Navigate to the backend directory

```
cd backend
```
# Install dependencies
```
npm install
```
# Start the server
```
npm run dev
```
You should see: ✅ Backend server running on port 3001


# Terminal 2: Start the Frontend
Navigate to the project's root directory

# Install dependencies
```
npm install
```

# Start the server
```
npm run dev
```

Your application will be available at http://localhost:3002 (or https if you've enabled SSL).

Auth0 Configuration Checklist

For the application to work, ensure the following are configured in your Auth0 tenant:
1. Regular Web Application:<br />
    Allowed Callback URLs: http://localhost:3002<br />
    Allowed Logout URLs: http://localhost:3002<br />
    Allowed Web Origins: http://localhost:3002<br />

2. Machine to Machine Application:API Permissions: Authorize it for the Auth0 Management API and grant all necessary create:*, read:*, and delete:* permissions for users, organizations, and roles.Connection Authorization: In the create:users permission, ensure you have explicitly enabled the connection you are using (e.g., "Username-Password-Authentication").
3. Auth0 Action (for Custom Claims):Create a Login Flow action to add the org_id and primary_role claims to the ID Token.

```

exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://demo.okta.com';

  // Function to determine the primary role
  const getPrimaryRole = (roles) => {
    if (!roles || roles.length === 0) {
      return "member"; // Default to "member" if no roles are present
    }

    if (roles.includes("banned_user")) {
      return "banned_user";
    }
    if (roles.includes("locked_user")) {
      return "locked_user";
    }
    if (roles.includes("admin")) {
      return "admin";
    }
    if (roles.includes("member")) {
      return "member";
    }
    return "member"; // Default to "member" if none of the specific roles are found
  };

  const primaryRole = getPrimaryRole(event.authorization.roles);

  // Set custom claims
  api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
  api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);

  // The primaryRole will always be set now, so no need for an if check
  api.idToken.setCustomClaim(`${namespace}/primary_role`, primaryRole);

  api.idToken.setCustomClaim(`${namespace}/created_at`, event.user.created_at);
  api.accessToken.setCustomClaim(`${namespace}/created_at`, event.user.created_at);

  api.idToken.setCustomClaim(`${namespace}/connection_name`, event.connection.name);
};
```

Auth0 FGA ModelIn your FGA Store, use the following authorization model:
```
model
  schema 1.1

type user

type organization
  relations
    define admin: [user]
    define banned_user: [user]
    define can_post_message: admin or member
    define can_view_board: admin or member or locked_user
    define locked_user: [user]
    define member: [user]

type post
  relations
    define can_delete: owner or admin from parent
    define owner: [user]
    define parent: [organization]

```