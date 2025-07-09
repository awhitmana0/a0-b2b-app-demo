// This file acts as a secure client, calling our own backend,
// which then uses direct API calls to FGA. No secrets are exposed to the browser.

const fgaApiFetch = async (endpoint, body) => {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An error occurred with the FGA backend service.");
    }
    return response.json();
};

export const checkPermission = async (user, relation, object) => {
    console.log(`%c[Frontend]%c Calling backend to CHECK: Can '${user}' do '${relation}' on '${object}'?`, "color: #007acc; font-weight: bold;", "color: default;");
    const { allowed } = await fgaApiFetch('/api/check', { user, relation, object });
    return allowed;
};

export const writeTuples = async (tuples) => {
    console.log(`%c[Frontend]%c Calling backend to WRITE tuples:`, "color: #007acc; font-weight: bold;", "color: default;", tuples);
    await fgaApiFetch('/api/write-tuples', { writes: tuples });
};

export const readUserOrgRelations = async (user, object) => {
    console.log(`%c[Frontend]%c Calling backend to READ relations for '${user}' on '${object}'`, "color: #007acc; font-weight: bold;", "color: default;");
    const { tuples } = await fgaApiFetch('/api/read-relations', { user, object });
    return tuples;
};

/**
 * Updates a user's primary role in an organization by deleting old roles
 * and writing the new one in a single transaction. It is now idempotent.
 * @param {string} user - The user identifier (e.g., 'user:some_id').
 * @param {string} object - The organization identifier (e.g., 'organization:some_org').
 * @param {string} newRole - The new role to assign (e.g., 'admin', 'member').
 */
export const updateUserRole = async (user, object, newRole) => {
    const managedRoles = ['admin', 'member', 'locked_user', 'banned_user'];

    console.log(`%c[Frontend]%c Calling backend to UPDATE role for '${user}' to '${newRole}' on '${object}'`, "color: orange; font-weight: bold;", "color: default;");
    
    try {
        const existingTuples = await readUserOrgRelations(user, object);
        
        const deletes = existingTuples
            .filter(t => managedRoles.includes(t.key.relation))
            .map(t => ({ user: t.key.user, relation: t.key.relation, object: t.key.object }));

        // --- CORRECTED LOGIC ---
        // Check if the user already has the new role.
        const userAlreadyHasNewRole = deletes.some(tuple => tuple.relation === newRole);
        
        // If the user already has the role and no other roles need to be deleted, do nothing.
        if (userAlreadyHasNewRole && deletes.length === 1) {
            console.log(`%c[Frontend]%c Role '${newRole}' is already set. No update needed.`, "color: green; font-weight: bold;", "color: default;");
            return; // Exit successfully
        }
        // --- END CORRECTED LOGIC ---

        const writes = [{ user, relation: newRole, object }];

        // The payload for the backend
        const payload = {};
        if (writes && writes.length > 0) payload.writes = writes;
        if (deletes && deletes.length > 0) payload.deletes = deletes;

        if (Object.keys(payload).length === 0) {
            console.log(`%c[Frontend]%c No role changes necessary.`, "color: green; font-weight: bold;", "color: default;");
            return;
        }

        await fetch('/api/write-tuples', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        console.log(`%c[Frontend]%c Role UPDATE successful.`, "color: green; font-weight: bold;", "color: default;");

    } catch (error) {
        console.error("Error updating user role:", error);
        throw error;
    }
};