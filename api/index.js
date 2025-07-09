const express = require('express');
const cors = require('cors');
require('dotenv').config();

const auth0Service = require('./services/auth0');
const fgaService = require('./services/fga');
const firebaseService = require('./services/firebase');

const app = express();
app.use(cors());
app.use(express.json());

// --- API Endpoints ---
app.get('/', (req, res) => res.status(200).json({ message: "Hello from the Backend!" }));

// --- Auth0 Management API Routes ---
app.get('/organization/name/:name', async (req, res) => {
    try {
        const data = await auth0Service.getOrgByName(req.params.name);
        if (!data) return res.status(404).json({ error: `Organization '${req.params.name}' not found.` });
        res.json(data);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

app.get('/organization/:id/connections', async (req, res) => {
    try {
        const data = await auth0Service.getOrgConnections(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/organization/:id/internal-connection', async (req, res) => {
    try {
        const connection = await auth0Service.getInternalAdminConnectionForOrg(req.params.id);
        if (!connection) {
            return res.status(404).json({ error: "Internal admin connection not enabled for this organization." });
        }
        res.json(connection);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- FGA Routes ---
app.post('/check', async (req, res) => {
    const { user, relation, object } = req.body;
    try {
        const data = await fgaService.check(user, relation, object);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/read-relations', async (req, res) => {
    const { user, object } = req.body;
    try {
        const data = await fgaService.readRelations(user, object);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/write-tuples', async (req, res) => {
    const { writes, deletes } = req.body;
    try {
        const data = await fgaService.write(writes, deletes);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Sign-Up Route ---
app.post('/signup', async (req, res) => {
    const { email, orgName, orgCode } = req.body;
    if (!email || !orgName || !orgCode) {
        return res.status(400).json({ error: "Email, organization name, and organization code are required." });
    }

    try {
        let organization = await auth0Service.getOrgByName(orgCode);
        if (organization) {
            return res.status(409).json({ error: `An organization with the code '${orgCode}' already exists.` });
        }

        organization = await auth0Service.createOrganization(orgCode, orgName);
        console.log(`[Backend] Created organization: ${organization.id}`);

        const internalAdminConnectionId = process.env.AUTH0_INTERNAL_ADMIN_CONNECTION_ID;
        if (internalAdminConnectionId) {
            await auth0Service.addConnectionToOrganization(organization.id, internalAdminConnectionId, false);
        }
        const defaultConnectionId = process.env.AUTH0_DEFAULT_CONNECTION_ID;
        if (defaultConnectionId) {
            await auth0Service.addConnectionToOrganization(organization.id, defaultConnectionId, true);
        }

        console.log(`[Backend] Creating invitation for ${email} to join ${organization.id}`);
        const invitation = await auth0Service.createOrganizationInvitation(organization.id, email);
        
        res.status(201).json({
            message: "Invitation sent successfully.",
            invitationUrl: invitation.invitation_url,
        });

    } catch (error) {
        console.error("[Backend] Sign-up Error:", error);
        res.status(500).json({ error: error.message || "An unexpected error occurred during sign-up." });
    }
});

// --- Conditionally Register Firebase Routes ---
if (process.env.MESSAGE_BOARD_ENABLED === 'true') {
    console.log("✅ Message board feature is enabled. Registering Firebase routes...");
    
    app.get('/posts/:orgId', async (req, res) => {
        try {
            const data = await firebaseService.getPosts(req.params.orgId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/posts/:orgId', async (req, res) => {
        try {
            const data = await firebaseService.createPost(req.params.orgId, req.body);
            res.status(201).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.delete('/posts/:orgId/:postKey', async (req, res) => {
        try {
            const data = await firebaseService.deletePost(req.params.orgId, req.params.postKey);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
} else {
    console.log("ℹ️ Message board feature is disabled. Skipping Firebase routes.");
}

// --- Vercel Export ---
// This line allows Vercel to use your Express app as a serverless function.
module.exports = app;
