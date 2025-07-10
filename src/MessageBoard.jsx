import React, { useState, useEffect, useCallback } from 'react';
import { getPostsForOrg, createPost, deletePost } from './firebase-api';
import { checkPermission, writeTuples } from './fga-api';
import { TEXT, STYLES, FEATURES, ICONS } from './ui-config.jsx';

// --- Reusable UI Components (Copied for this component's use) ---
const Button = ({ children, className = '', ...props }) => (
    <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props}>
        {children}
    </button>
);
const Input = ({ className = '', ...props }) => (
    <input className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
);

const Dialog = ({ isOpen, onCancel, onConfirm, title, children, confirmText = "Confirm", confirmStyle = STYLES.primaryButton }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <Button onClick={onCancel} className={STYLES.iconButton}>{ICONS.DialogClose}</Button>
                </div>
                <div className="p-6 text-sm text-gray-700">{children}</div>
                <div className="flex justify-end p-6 border-t space-x-4">
                    <Button onClick={onCancel} className={`${STYLES.secondaryButton} px-4 py-2`}>Cancel</Button>
                    <Button onClick={onConfirm} className={`${confirmStyle} px-4 py-2`}>{confirmText}</Button>
                </div>
            </div>
        </div>
    );
};


export const MessageBoard = ({ user, organizationId, permissions, onBack }) => {
    const [posts, setPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // --- NEW: State for the delete confirmation dialog ---
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);

    const checkDeletePermissions = useCallback(async (fetchedPosts) => {
        if (!FEATURES.fga) {
            // If FGA is not enabled, assume user can delete their own posts for demo purposes
            return fetchedPosts.map(p => ({ ...p, canDelete: p.author === user.email }));
        }
        const userIdentifier = `user:${user.sub}`;
        const checks = fetchedPosts.map(post => 
            // FGA check for 'can_delete' on 'post:post_id'
            checkPermission(userIdentifier, 'can_delete', `post:${post.post_id}`)
        );
        const results = await Promise.all(checks);
        return fetchedPosts.map((post, index) => ({
            ...post,
            canDelete: results[index],
        }));
    }, [user.sub, user.email]); // Added user.email to dependencies for canDelete fallback

    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const fetchedPosts = await getPostsForOrg(organizationId);
            const postsWithPerms = await checkDeletePermissions(fetchedPosts);
            postsWithPerms.sort((a, b) => b.date_posted - a.date_posted);
            setPosts(postsWithPerms);
        } catch (err) {
            console.error("Error fetching posts:", err);
            setError("Could not load posts.");
        } finally {
            setIsLoading(false);
        }
    }, [organizationId, checkDeletePermissions]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;
        try {
            // 1. Create the post in Firebase. The response 'newPost' will contain 'post_id' (the UUID)
            const newPost = await createPost(organizationId, { author: user.email, content: newPostContent });
            
            // 2. If FGA is enabled, write the FGA tuples for the new post
            if (FEATURES.fga) {
                // Use newPost.post_id (the UUID) as the unique identifier for the FGA 'post' object
                await writeTuples([
                    { user: `user:${user.sub}`, relation: 'owner', object: `post:${newPost.post_id}` },
                    { user: `organization:${organizationId}`, relation: 'parent', object: `post:${newPost.post_id}` }
                ]);
            }
            
            // Clear the input and refetch posts to update the UI
            setNewPostContent('');
            fetchPosts();
        } catch (err) {
            console.error("Error submitting post or writing FGA tuples:", err);
            setError("Failed to submit post.");
        }
    };
    
    // --- UPDATED DELETE FLOW ---
    // Step 1: User clicks the delete icon, which opens the dialog.
    const attemptDeletePost = (postKey) => {
        setPostToDelete(postKey);
        setIsDeleteDialogOpen(true);
    };

    // Step 2: User confirms in the dialog, which runs the actual deletion.
    const handleConfirmDelete = async () => {
        if (!postToDelete) return;
        try {
            // Delete the post from Firebase
            await deletePost(organizationId, postToDelete);
            
            // Note: FGA tuples for deleted posts are typically handled by a webhook
            // or a background job that listens for Firebase deletions and updates FGA.
            // For this demo, we're not explicitly deleting FGA tuples here on frontend,
            // assuming the FGA model's `can_delete` check will prevent access to non-existent posts.
            
            fetchPosts(); // Refresh the posts list
        } catch (err) {
            console.error("Error deleting post:", err);
            setError("Failed to delete post.");
        } finally {
            // Close the dialog and clear the state
            setIsDeleteDialogOpen(false);
            setPostToDelete(null);
        }
    };

    const formatDate = (timestamp) => new Date(timestamp * 1000).toLocaleString();

    return (
        <>
            <Dialog
                isOpen={isDeleteDialogOpen}
                onCancel={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Post"
                confirmText="Delete"
                confirmStyle={STYLES.dangerButton}
            >
                <p>Are you sure you want to permanently delete this post? This action cannot be undone.</p>
            </Dialog>

            <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
                <div className="w-full max-w-3xl bg-white p-6 sm:p-8 rounded-xl shadow-md border">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Message Board</h1>
                        <Button onClick={onBack} className={`${STYLES.secondaryButton} px-4 py-2`}>
                            Back to Profile
                        </Button>
                    </div>
                    
                    {permissions.canPostMessage && (
                        <form onSubmit={handlePostSubmit} className="flex flex-col sm:flex-row gap-4 mb-6">
                            <Input type="text" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Write a new post..." className="h-12" />
                            <Button type="submit" className={`${STYLES.primaryButton} h-12 px-6`}>Post</Button>
                        </form>
                    )}

                    {error && <p className={STYLES.errorText}>{error}</p>}
                    
                    <div className="h-[50vh] overflow-y-auto pr-4 border rounded-lg">
                        {isLoading ? (
                            <p className="text-center p-8 text-gray-500">{TEXT.loading}</p>
                        ) : posts.length > 0 ? (
                            posts.map((post) => (
                                <div key={post.key} className="p-4 border-b last:border-b-0 group hover:bg-gray-50">
                                    <div className="flex justify-between items-start gap-4">
                                        <p className="text-gray-800 flex-grow">{post.content}</p>
                                        {post.canDelete && (
                                            <Button 
                                                onClick={() => attemptDeletePost(post.key)} 
                                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                                                title="Delete Post"
                                            >
                                                {ICONS.DeletePost}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                        <span>By: {post.author}</span>
                                        <span>{formatDate(post.date_posted)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center p-8 text-gray-500">No posts yet. Be the first!</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
