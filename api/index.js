// Only load .env file in local development, not on Vercel
if (process.env.NODE_ENV !== 'production') {
    // Explicitly point to the .env file in the *root* directory for local dev
    require('dotenv').config({ path: '../.env' });
}

console.log("[Backend Init] Starting server process...");

// --- NEW: Comprehensive Environment Variable Debugging ---
console.log("--- [Backend Init] Checking Environment Variables ---");
const variables = [
    'VITE_AUTH0_DOMAIN', 'VITE_AUTH0_CLIENT_ID', 'VITE_AUTH0_AUDIENCE',
    'VITE_AUTH0_MGMT_CLIENT_ID', 'VITE_AUTH0_MGMT_CLIENT_SECRET',
    'VITE_FGA_API_HOST', 'VITE_FGA_ISSUER', 'VITE_FGA_STORE_ID',
    'VITE_FGA_CLIENT_ID', 'VITE_FGA_CLIENT_SECRET',
    'VITE_AUTH0_DEFAULT_CONNECTION_ID', 'VITE_AUTH0_DEFAULT_CONNECTION_NAME',
    'VITE_AUTH0_INTERNAL_ADMIN_CONNECTION_ID', 'VITE_AUTH0_DEFAULT_ADMIN_ROLES',
    'VITE_FIREBASE_DATABASE_URL', 'VITE_MESSAGE_BOARD_ENABLED',
    'VITE_FGA_ENABLED', 'VITE_FGA_ROLE_SYNC_ENABLED' // Added the two missing from your list
];
variables.forEach(v => {
    // For secrets, we just check for presence, we don't print the value.
    if (v.includes('SECRET') || v.includes('CLIENT_ID') || v.includes('FIREBASE_DATABASE_URL')) {
        console.log(`${v}: ${process.env[v] ? 'Loaded ✅' : '!!! NOT FOUND !!!'}`);
    } else {
        console.log(`${v}: ${process.env[v] || '!!! NOT FOUND !!!'}`);
    }
});
console.log("-------------------------------------------------");


const express = require('express');
const cors = require('cors');

console.log("[Backend Init] Core modules loaded.");

console.log("[Backend Init] Loading services...");
// These imports are crucial. Ensure these files exist and export their functions.
const auth0Service = require('./services/auth0');
console.log("[Backend Init] ✅ Auth0 Service loaded.");
const fgaService = require('./services/fga');
console.log("[Backend Init] ✅ FGA Service loaded.");
const firebaseService = require('./services/firebase');
console.log("[Backend Init] ✅ Firebase Service loaded.");
console.log("[Backend Init] All services loaded successfully.");

const app = express();
app.use(cors()); // Consider more restrictive CORS for production
app.use(express.json());

console.log("[Backend Init] Express app configured.");

// Create an Express Router specifically for API routes.
// This allows us to define routes without the /api prefix,
// and then mount this router under /api in the main app.
const apiRouter = express.Router();

// --- API Endpoints mounted on apiRouter ---
// The root of the API, e.g., hitting /api/ will hit this.
apiRouter.get('/', (req, res) => {
    console.log("[Backend] API Root endpoint was hit!");
    res.status(200).json({ message: "Hello from the Backend API Root!" });
});

// Health Check Endpoint: /api/health
apiRouter.get('/health', (req, res) => {
    console.log("[Backend] Health check endpoint was hit!");
    res.status(200).json({ status: "ok", message: "Backend is running." });
});

// --- Auth0 Management API Routes ---
// These will be accessible at /api/organization/...
apiRouter.get('/organization/name/:name', async (req, res) => {
    console.log(`[Backend] GET /api/organization/name/${req.params.name}`);
    try {
        const data = await auth0Service.getOrgByName(req.params.name);
        if (!data) {
            return res.status(404).json({ error: `Organization '${req.params.name}' not found.` });
        }
        res.json(data);
    } catch (error) {
        console.error("[Backend] Error in /api/organization/name:", error);
        res.status(error.status || 500).json({ error: error.message || "An unexpected error occurred." });
    }
});

apiRouter.get('/organization/:id/connections', async (req, res) => {
    console.log(`[Backend] GET /api/organization/${req.params.id}/connections`);
    try {
        const data = await auth0Service.getOrgConnections(req.params.id);
        res.json(data);
    } catch (error) {
        console.error("[Backend] Error in /api/organization/:id/connections:", error);
        res.status(500).json({ error: error.message || "An unexpected error occurred." });
    }
});

apiRouter.get('/organization/:id/internal-connection', async (req, res) => {
    console.log(`[Backend] GET /api/organization/${req.params.id}/internal-connection`);
    try {
        const connection = await auth0Service.getInternalAdminConnectionForOrg(req.params.id);
        if (!connection) {
            return res.status(404).json({ error: "Internal admin connection not enabled for this organization." });
        }
        res.json(connection);
    } catch (error) {
        console.error("[Backend] Error in /api/organization/:id/internal-connection:", error);
        res.status(500).json({ error: error.message || "An unexpected error occurred." });
    }
});

// --- FGA Routes ---
// These will be accessible at /api/check, /api/read-relations, /api/write-tuples
apiRouter.post('/check', async (req, res) => {
    console.log("[Backend] POST /api/check");
    const { user, relation, object } = req.body;
    try {
        const data = await fgaService.check(user, relation, object);
        res.json(data);
    } catch (error) {
        console.error("[Backend] Error in /api/check:", error);
        res.status(500).json({ error: error.message || "An unexpected error occurred." });
    }
});

apiRouter.post('/read-relations', async (req, res) => {
    console.log("[Backend] POST /api/read-relations");
    const { user, object } = req.body;
    try {
        const data = await fgaService.readRelations(user, object);
        res.json(data);
    } catch (error) {
        console.error("[Backend] Error in /api/read-relations:", error);
        res.status(500).json({ error: error.message || "An unexpected error occurred." });
    }
});

apiRouter.post('/write-tuples', async (req, res) => {
    console.log("[Backend] POST /api/write-tuples");
    const { writes, deletes } = req.body;
    try {
        const data = await fgaService.write(writes, deletes);
        res.json(data);
    } catch (error) {
        console.error("[Backend] Error in /api/write-tuples:", error);
        res.status(500).json({ error: error.message || "An unexpected error occurred." });
    }
});

// --- Firebase Routes (conditional based on VITE_MESSAGE_BOARD_ENABLED) ---
// These will be accessible at /api/posts/...
if (process.env.VITE_MESSAGE_BOARD_ENABLED === 'true') {
    console.log("[Backend Init] Message board feature is ENABLED. Registering Firebase routes...");
    apiRouter.get('/posts/:orgId', async (req, res) => {
        console.log(`[Backend] GET /api/posts/${req.params.orgId}`);
        try {
            const data = await firebaseService.getPosts(req.params.orgId);
            res.json(data);
        } catch (error) {
            console.error("[Backend] Error in /api/posts (GET):", error);
            res.status(500).json({ error: error.message || "An unexpected error occurred." });
        }
    });
    apiRouter.post('/posts/:orgId', async (req, res) => {
        console.log(`[Backend] POST /api/posts/${req.params.orgId}`);
        try {
            const data = await firebaseService.createPost(req.params.orgId, req.body);
            res.status(201).json(data);
        } catch (error) {
            console.error("[Backend] Error in /api/posts (POST):", error);
            res.status(500).json({ error: error.message || "An unexpected error occurred." });
        }
    });
    apiRouter.delete('/posts/:orgId/:postKey', async (req, res) => {
        console.log(`[Backend] DELETE /api/posts/${req.params.orgId}/${req.params.postKey}`);
        try {
            const data = await firebaseService.deletePost(req.params.orgId, req.params.postKey);
            res.json(data);
        } catch (error) {
            console.error("[Backend] Error in /api/posts (DELETE):", error);
            res.status(500).json({ error: error.message || "An unexpected error occurred." });
        }
    });
} else {
    console.log("[Backend Init] Message board feature is DISABLED. Skipping Firebase routes.");
}

// --- Sign-Up Route ---
// This will be accessible at /api/signup
apiRouter.post('/signup', async (req, res) => {
    console.log("[Backend] POST /api/signup");
    const { email, orgName, orgCode, password } = req.body;
    if (!email || !orgName || !orgCode || !password) {
        return res.status(400).json({ error: "Email, organization name, code, and password are required." });
    }
    try {
        let organization = await auth0Service.getOrgByName(orgCode);
        if (organization) {
            return res.status(409).json({ error: `An organization with the code '${orgCode}' already exists.` });
        }
        let user = await auth0Service.findUserByEmail(email);
        if (user) {
            return res.status(409).json({ error: `A user with the email '${email}' already exists.` });
        }
        organization = await auth0Service.createOrganization(orgCode, orgName);
        const internalAdminConnectionId = process.env.VITE_AUTH0_INTERNAL_ADMIN_CONNECTION_ID;
        if (internalAdminConnectionId) {
            await auth0Service.addConnectionToOrganization(organization.id, internalAdminConnectionId, false);
        }
        const defaultConnectionId = process.env.VITE_AUTH0_DEFAULT_CONNECTION_ID;
        if (defaultConnectionId) {
            await auth0Service.addConnectionToOrganization(organization.id, defaultConnectionId, true);
        }
        user = await auth0Service.createUser(email, password);
        await auth0Service.addMembersToOrganization(organization.id, user.user_id);
        const adminRoles = process.env.VITE_AUTH0_DEFAULT_ADMIN_ROLES.split(',');
        // Filter out any empty strings that might result from a trailing comma or just a comma-separated list with no values
        if (adminRoles.length > 0 && adminRoles[0]) {
            const filteredAdminRoles = adminRoles.filter(role => role.trim() !== '');
            if (filteredAdminRoles.length > 0) {
                 await auth0Service.assignRolesToMember(organization.id, user.user_id, filteredAdminRoles);
            }
        }
        res.status(201).json({
            message: "Sign-up process completed successfully. Please log in.",
            organizationId: organization.id,
        });
    } catch (error) {
        console.error("[Backend] Sign-up Error:", error);
        res.status(500).json({ error: error.message || "An unexpected error occurred during sign-up." });
    }
});

// --- Mount the apiRouter at the /api path ---
// All routes defined on apiRouter will now be prefixed with /api
app.use('/api', apiRouter);
console.log("[Backend Init] API router mounted under /api.");

// --- Catch-all for unhandled /api routes ---
// This middleware will catch any requests that start with /api but weren't
// matched by any of the routes defined on `apiRouter`.
app.use('/api/*', (req, res) => {
    console.warn(`[Backend] Unhandled /api route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: "API endpoint not found for this path." });
});

// --- Start server only when run directly for local development ---
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`✅ Backend API running on port ${PORT}`);
    });
}

// --- Vercel Export ---
// This exports the Express app instance, making it a Vercel serverless function.
module.exports = app;