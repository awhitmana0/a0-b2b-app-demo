// This version now correctly reads VITE_ prefixed variables to match Vercel's environment.
const AUTH0_DOMAIN = process.env.VITE_AUTH0_DOMAIN;
const AUTH0_MGMT_CLIENT_ID = process.env.VITE_AUTH0_MGMT_CLIENT_ID;
const AUTH0_MGMT_CLIENT_SECRET = process.env.VITE_AUTH0_MGMT_CLIENT_SECRET;
const AUTH0_TOKEN_CACHE = { token: null, expiresAt: 0 };

const getAuth0MgmtToken = async () => {
    if (AUTH0_TOKEN_CACHE.token && AUTH0_TOKEN_CACHE.expiresAt > Date.now() + 60000) return AUTH0_TOKEN_CACHE.token;
    const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: AUTH0_MGMT_CLIENT_ID,
            client_secret: AUTH0_MGMT_CLIENT_SECRET,
            audience: `https://${AUTH0_DOMAIN}/api/v2/`,
            grant_type: 'client_credentials',
        }),
    });
    if (!response.ok) throw new Error('Failed to fetch Auth0 Management API token.');
    const data = await response.json();
    AUTH0_TOKEN_CACHE.token = data.access_token;
    AUTH0_TOKEN_CACHE.expiresAt = Date.now() + (data.expires_in * 1000);
    return AUTH0_TOKEN_CACHE.token;
};
const mgmtApiCall = async (endpoint, options = {}) => {
    const token = await getAuth0MgmtToken();
    const response = await fetch(`https://${AUTH0_DOMAIN}/api/v2${endpoint}`, {
        ...options,
        headers: { ...options.headers, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        if (response.status === 404) return null;
        const errorData = await response.json();
        throw new Error(errorData.message || `Auth0 Management API error: ${response.status}`);
    }
    if (response.status === 204) return { success: true };
    return response.json();
};
const getOrgByName = (name) => mgmtApiCall(`/organizations/name/${name}`);
const getOrgConnections = (id) => mgmtApiCall(`/organizations/${id}/enabled_connections`);
const createOrganization = (name, displayName) => mgmtApiCall('/organizations', { method: 'POST', body: JSON.stringify({ name: name.toLowerCase().replace(/\s+/g, '-'), display_name: displayName }) });
const findUserByEmail = async (email) => {
    const defaultConnectionName = process.env.VITE_AUTH0_DEFAULT_CONNECTION_NAME;
    if (!defaultConnectionName) throw new Error("VITE_AUTH0_DEFAULT_CONNECTION_NAME is not set.");
    const users = await mgmtApiCall(`/users-by-email?email=${encodeURIComponent(email)}`);
    if (!users || users.length === 0) return null;
    return users.find(user => user.identities.some(identity => identity.connection === defaultConnectionName)) || null;
};
const createUser = (email, password) => {
    const connectionName = process.env.VITE_AUTH0_DEFAULT_CONNECTION_NAME;
    if (!connectionName) throw new Error("VITE_AUTH0_DEFAULT_CONNECTION_NAME is not set.");
    return mgmtApiCall('/users', {
        method: 'POST',
        body: JSON.stringify({ email, password, connection: connectionName }),
    });
};
const addMembersToOrganization = (orgId, userId) => mgmtApiCall(`/organizations/${orgId}/members`, { method: 'POST', body: JSON.stringify({ members: [userId] }) });
const assignRolesToMember = (orgId, userId, roles) => mgmtApiCall(`/organizations/${orgId}/members/${userId}/roles`, { method: 'POST', body: JSON.stringify({ roles }) });
const createOrganizationInvitation = async (orgId, email) => {
    const inviterName = process.env.VITE_AUTH0_MGMT_CLIENT_ID;
    const frontendClientId = process.env.VITE_AUTH0_CLIENT_ID;
    const adminRoles = process.env.VITE_AUTH0_DEFAULT_ADMIN_ROLES.split(',');
    if (!frontendClientId) throw new Error("VITE_AUTH0_CLIENT_ID is not set.");
    const invitationPayload = {
        inviter: { name: inviterName },
        invitee: { email },
        client_id: frontendClientId,
        roles: (adminRoles.length > 0 && adminRoles[0]) ? adminRoles : [],
    };
    return mgmtApiCall(`/organizations/${orgId}/invitations`, { method: 'POST', body: JSON.stringify(invitationPayload) });
};
const addConnectionToOrganization = (orgId, connectionId, showAsButton = true) => mgmtApiCall(`/organizations/${orgId}/enabled_connections`, { method: 'POST', body: JSON.stringify({ connection_id: connectionId, assign_membership_on_login: false, show_as_button: showAsButton }) });
const getInternalAdminConnectionForOrg = async (orgId) => {
    const internalAdminId = process.env.VITE_AUTH0_INTERNAL_ADMIN_CONNECTION_ID;
    if (!internalAdminId) throw new Error("VITE_AUTH0_INTERNAL_ADMIN_CONNECTION_ID is not set.");
    const connections = await getOrgConnections(orgId);
    if (!connections) return null;
    return connections.find(c => c.connection_id === internalAdminId) || null;
};
module.exports = { getOrgByName, getOrgConnections, createOrganization, findUserByEmail, createUser, addMembersToOrganization, assignRolesToMember, createOrganizationInvitation, addConnectionToOrganization, getInternalAdminConnectionForOrg };