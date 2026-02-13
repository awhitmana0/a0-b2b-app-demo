/**
 * Gets an organization's details by calling our secure backend proxy.
 */
export const getOrgByName = async (orgName) => {
    console.log('[auth0-api] Fetching organization by name:', orgName);
    try {
        const response = await fetch(`/api/organization/name/${encodeURIComponent(orgName)}`);
        console.log('[auth0-api] Response status:', response.status, response.statusText);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                throw new Error(`Failed to get organization details. Status: ${response.status}`);
            }
            throw new Error(errorData.error || errorData.message || "Failed to get organization details from the backend.");
        }

        const data = await response.json();
        console.log('[auth0-api] Organization data received:', data);
        return data;
    } catch (err) {
        console.error('[auth0-api] Error in getOrgByName:', err);
        throw err;
    }
};

/**
 * Gets an organization's enabled connections by calling our secure backend proxy.
 */
export const getOrgConnections = async (orgId) => {
    const response = await fetch(`/api/organization/${orgId}/connections`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get organization connections from the backend.");
    }
    return response.json();
};

/**
 * Checks for and retrieves the internal admin connection for an org by calling our backend.
 */
export const getInternalAdminConnection = async (orgId) => {
    const response = await fetch(`/api/organization/${orgId}/internal-connection`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to check for internal admin connection.");
    }
    return response.json();
};