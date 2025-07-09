// This file calls our own backend, which then uses direct API calls to FGA.

const fgaApiFetch = async (endpoint, body) => {
    const response = await fetch(`/api${endpoint}`, { // Always use the relative /api path
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
    const { allowed } = await fgaApiFetch('/check', { user, relation, object });
    return allowed;
};

export const writeTuples = async (tuples) => {
    console.log(`%c[Frontend]%c Calling backend to WRITE tuples:`, "color: #007acc; font-weight: bold;", "color: default;", tuples);
    await fgaApiFetch('/write-tuples', { writes: tuples });
};

export const readUserOrgRelations = async (user, object) => {
    console.log(`%c[Frontend]%c Calling backend to READ relations for '${user}' on '${object}'`, "color: #007acc; font-weight: bold;", "color: default;");
    const { tuples } = await fgaApiFetch('/read-relations', { user, object });
    return tuples;
};

export const updateUserRole = async (user, object, newRole) => {
    const managedRoles = ['admin', 'member', 'locked_user', 'banned_user'];
    console.log(`%c[Frontend]%c Calling backend to UPDATE role for '${user}' to '${newRole}' on '${object}'`, "color: orange; font-weight: bold;", "color: default;");
    try {
        const existingTuples = await readUserOrgRelations(user, object);
        const deletes = existingTuples
            .filter(t => managedRoles.includes(t.key.relation))
            .map(t => ({ user: t.key.user, relation: t.key.relation, object: t.key.object }));

        const userAlreadyHasNewRole = deletes.some(tuple => tuple.relation === newRole);
        if (userAlreadyHasNewRole && deletes.length === 1) {
            console.log(`%c[Frontend]%c Role '${newRole}' is already set. No update needed.`, "color: green; font-weight: bold;", "color: default;");
            return;
        }

        const writes = [{ user, relation: newRole, object }];
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