/**
 * Gets an organization's details by calling our secure backend proxy.
 */
export const getOrgByName = async (orgName) => {
    const response = await fetch(`/api/organization/name/${encodeURIComponent(orgName)}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get organization details from the backend.");
    }
    return response.json();
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