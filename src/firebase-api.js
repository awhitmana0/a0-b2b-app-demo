/**
 * Fetches all posts for a given organization by calling our secure backend.
 * @param {string} orgId - The organization ID.
 * @returns {Promise<Array>} An array of post objects.
 */
export const getPostsForOrg = async (orgId) => {
    if (!orgId) return [];
    const response = await fetch(`/api/posts/${orgId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch posts from the backend.");
    }
    return response.json();
};

/**
 * Creates a new post by calling our secure backend.
 * @param {string} orgId - The organization ID.
 * @param {object} postData - The data for the new post { author, content }.
 * @returns {Promise<object>} The newly created post object.
 */
export const createPost = async (orgId, postData) => {
    if (!orgId) throw new Error("Org ID is required to create a post.");
    const response = await fetch(`/api/posts/${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
    });
    if (!response.ok) {
        throw new Error("Failed to create post via the backend.");
    }
    return response.json();
};

/**
 * Deletes a post by calling our secure backend.
 * @param {string} orgId - The organization ID.
 * @param {string} postKey - The unique Firebase key of the post to delete.
 */
export const deletePost = async (orgId, postKey) => {
    if (!orgId || !postKey) throw new Error("Org ID and Post Key are required for deletion.");
    const response = await fetch(`/api/posts/${orgId}/${postKey}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error("Failed to delete post via the backend.");
    }
    return response.json();
};