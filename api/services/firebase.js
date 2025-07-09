const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set, push, remove } = require('firebase/database');
const { v4: uuidv4 } = require('uuid');

const FIREBASE_DATABASE_URL = process.env.VITE_FIREBASE_DATABASE_URL;
let db;

if (process.env.VITE_MESSAGE_BOARD_ENABLED === 'true') {
    if (FIREBASE_DATABASE_URL) {
        const firebaseConfig = { databaseURL: FIREBASE_DATABASE_URL };
        const firebaseApp = initializeApp(firebaseConfig);
        db = getDatabase(firebaseApp);
    } else {
        console.warn("⚠️ Firebase Database URL not found, but feature is enabled. Firebase calls will fail.");
    }
}
const getPosts = async (orgId) => {
    if (!db) throw new Error("Firebase service is not configured on the server.");
    const postsRef = ref(db, `demo/posts/${orgId}`);
    const snapshot = await get(postsRef);
    if (snapshot.exists()) {
        const postsObject = snapshot.val();
        return Object.keys(postsObject).map(key => ({ key, ...postsObject[key] }));
    }
    return [];
};
const createPost = async (orgId, postData) => {
    if (!db) throw new Error("Firebase service is not configured on the server.");
    const postsRef = ref(db, `demo/posts/${orgId}`);
    const newPostRef = push(postsRef);
    const newPost = { post_id: uuidv4(), author: postData.author, content: postData.content, date_posted: Math.floor(Date.now() / 1000) };
    await set(newPostRef, newPost);
    return newPost;
};
const deletePost = async (orgId, postKey) => {
    if (!db) throw new Error("Firebase service is not configured on the server.");
    const postRef = ref(db, `demo/posts/${orgId}/${postKey}`);
    await remove(postRef);
    return { message: "Post deleted successfully." };
};
module.exports = { getPosts, createPost, deletePost };