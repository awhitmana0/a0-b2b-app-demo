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
    'VITE_FIREBASE_DATABASE_URL', 'VITE_MESSAGE_BOARD_ENABLED'
];
variables.forEach(v => {
    // For secrets, we just check for presence, we don't print the value.
    if (v.includes('SECRET')) {
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
const auth0Service = require('./services/auth0');
console.log("[Backend Init] ✅ Auth0 Service loaded.");
const fgaService = require('./services/fga');
console.log("[Backend Init] ✅ FGA Service loaded.");
const firebaseService = require('./services/firebase');
console.log("[Backend Init] ✅ Firebase Service loaded.");
console.log("[Backend Init] All services loaded successfully.");

const app = express();
app.use(cors());
app.use(express.json());

console.log("[Backend Init] Express app configured.");

// --- API Endpoints ---
app.get('/', (req, res) => res.status(200).json({ message: "Hello from the Backend!" }));

app.get('/health', (req, res) => {
    console.log("[Backend] Health check endpoint was hit!");
    res.status(200).json({ status: "ok", message: "Backend is running." });
});

// --- Auth0 Management API Routes ---
app.get('/organization/name/:name', async (req, res) => { try { const data = await auth0Service.getOrgByName(req.params.name); if (!data) return res.status(404).json({ error: `Organization '${req.params.name}' not found.` }); res.json(data); } catch (error) { res.status(error.status || 500).json({ error: error.message }); } });
app.get('/organization/:id/connections', async (req, res) => { try { const data = await auth0Service.getOrgConnections(req.params.id); res.json(data); } catch (error) { res.status(500).json({ error: error.message }); } });
app.get('/organization/:id/internal-connection', async (req, res) => { try { const connection = await auth0Service.getInternalAdminConnectionForOrg(req.params.id); if (!connection) { return res.status(404).json({ error: "Internal admin connection not enabled for this organization." }); } res.json(connection); } catch (error) { res.status(500).json({ error: error.message }); } });

// --- FGA Routes ---
app.post('/check', async (req, res) => { const { user, relation, object } = req.body; try { const data = await fgaService.check(user, relation, object); res.json(data); } catch (error) { res.status(500).json({ error: error.message }); } });
app.post('/read-relations', async (req, res) => { const { user, object } = req.body; try { const data = await fgaService.readRelations(user, object); res.json(data); } catch (error) { res.status(500).json({ error: error.message }); } });
app.post('/write-tuples', async (req, res) => { const { writes, deletes } = req.body; try { const data = await fgaService.write(writes, deletes); res.json(data); } catch (error) { res.status(500).json({ error: error.message }); } });

// --- Firebase Routes ---
if (process.env.VITE_MESSAGE_BOARD_ENABLED === 'true') {
    console.log("[Backend Init] Message board feature is ENABLED. Registering Firebase routes...");
    app.get('/posts/:orgId', async (req, res) => { try { const data = await firebaseService.getPosts(req.params.orgId); res.json(data); } catch (error) { res.status(500).json({ error: error.message }); } });
    app.post('/posts/:orgId', async (req, res) => { try { const data = await firebaseService.createPost(req.params.orgId, req.body); res.status(201).json(data); } catch (error) { res.status(500).json({ error: error.message }); } });
    app.delete('/posts/:orgId/:postKey', async (req, res) => { try { const data = await firebaseService.deletePost(req.params.orgId, req.params.postKey); res.json(data); } catch (error) { res.status(500).json({ error: error.message }); } });
} else {
    console.log("[Backend Init] Message board feature is DISABLED. Skipping Firebase routes.");
}

// --- Sign-Up Route ---
app.post('/signup', async (req, res) => {
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
        if (adminRoles.length > 0 && adminRoles[0]) {
            await auth0Service.assignRolesToMember(organization.id, user.user_id, adminRoles);
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

// --- Start server only when run directly for local development ---
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`✅ Backend API running on port ${PORT}`);
    });
}

// --- Vercel Export ---
module.exports = app;