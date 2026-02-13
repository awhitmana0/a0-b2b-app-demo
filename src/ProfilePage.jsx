import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth0Config } from './auth0-config.js';
import { setCookie, deleteCookie } from './cookie-manager';
import { TEXT, STYLES, FEATURES } from './ui-config.jsx';
import { checkPermission, readUserOrgRelations, writeTuples, updateUserRole } from './fga-api.js';
import { MessageBoard } from './MessageBoard.jsx';
import { AlertCircle } from 'lucide-react';

// --- Reusable UI Components ---
const Button = ({ children, className = '', ...props }) => ( <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props}>{children}</button> );
const Alert = ({ title, children, className = '' }) => ( <div className={`p-4 rounded-md border ${className}`}><div className="flex"><div className="flex-shrink-0"><AlertCircle className="h-5 w-5" /></div><div className="ml-3"><h3 className="text-sm font-medium">{title}</h3><div className="mt-2 text-sm"><p>{children}</p></div></div></div></div> );
function decodeJwtPayload(token) { if (!token || typeof token !== 'string') { return { error: true, message: "Invalid token provided." }; } try { const base64Url = token.split('.')[1]; if (!base64Url) { return { error: true, message: "Token is not a valid JWT (missing payload)." }; } const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); }).join('')); return JSON.parse(jsonPayload); } catch (e) { return { error: true, message: "Failed to decode token." }; } }

export const ProfilePage = ({ initialView }) => {
    const { user, logout, getAccessTokenSilently, getIdTokenClaims } = useAuth0();
    const navigate = useNavigate();

    const [decodedIdToken, setDecodedIdToken] = useState(null);
    const [rawAccessToken, setRawAccessToken] = useState(null);
    const [decodedAccessToken, setDecodedAccessToken] = useState(null);
    const [accessTokenError, setAccessTokenError] = useState(null);
    const [organizationId, setOrganizationId] = useState(null);
    const [permissions, setPermissions] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!user) return;
            try {
                const idTokenClaims = await getIdTokenClaims();
                const decodedId = decodeJwtPayload(idTokenClaims.__raw);
                const orgId = decodedId.org_id;

                if (!orgId) {
                    setAccessTokenError("No Organization ID found in your token. Please log in with an organization to use its features.");
                    setPermissions({ isBanned: true });
                    return;
                }
                
                setOrganizationId(orgId);

                const pendingDetailsStr = localStorage.getItem('pendingLoginDetails');
                if (pendingDetailsStr && user.email) {
                    const pendingDetails = JSON.parse(pendingDetailsStr);
                    const cookieData = {
                        email: user.email,
                        ssoId: pendingDetails.ssoId,
                        organizationId: orgId,
                        loginFlow: pendingDetails.loginFlow,
                        connectionName: user['https://demo.okta.com/connection_name'] || null,
                    };
                    setCookie('lastLoginInfo', JSON.stringify(cookieData), 30);
                    localStorage.removeItem('pendingLoginDetails');
                }

                if (FEATURES.fga) {
                    const userIdentifier = `user:${user.sub}`;
                    const orgIdentifier = `organization:${orgId}`;
                    if (FEATURES.fgaRoleSync) {
                        const primaryRole = decodedId['https://demo.okta.com/primary_role'];
                        if (primaryRole) {
                            await updateUserRole(userIdentifier, orgIdentifier, primaryRole);
                        } else {
                            const existingRelations = await readUserOrgRelations(userIdentifier, orgIdentifier);
                            if (existingRelations.length === 0) {
                                await writeTuples([{ user: userIdentifier, relation: 'member', object: orgIdentifier }]);
                            }
                        }
                    }
                    const [canView, canPost, isBanned] = await Promise.all([
                        checkPermission(userIdentifier, 'can_view_board', orgIdentifier),
                        checkPermission(userIdentifier, 'can_post_message', orgIdentifier),
                        checkPermission(userIdentifier, 'banned_user', orgIdentifier),
                    ]);
                    setPermissions({ canViewBoard: canView, canPostMessage: canPost, isBanned });
                } else {
                    setPermissions({ canViewBoard: true, canPostMessage: true, isBanned: false });
                }

                const accessToken = await getAccessTokenSilently({ authorizationParams: { audience: auth0Config.audience } });
                setRawAccessToken(accessToken);
                setDecodedIdToken(decodedId);
                const decodedAccess = decodeJwtPayload(accessToken);
                if (decodedAccess.error) {
                    setAccessTokenError("Token could not be decoded (it may be opaque).");
                    setDecodedAccessToken(null);
                } else {
                    setDecodedAccessToken(decodedAccess);
                    setAccessTokenError(null);
                }
            } catch (e) {
                console.error('Error during initial data fetch:', e);
                setAccessTokenError(`An error occurred: ${e.message}`);
                setPermissions({});
            }
        };
        fetchAllData();
    }, [user, getAccessTokenSilently, getIdTokenClaims]);

    const handleLogoutAndClear = () => {
        deleteCookie('lastLoginInfo');
        logout({ logoutParams: { returnTo: window.location.origin } });
    };

    const handleBackToLanding = () => {
        window.location.href = '/';
    };
    
    if (FEATURES.messageBoard && initialView === 'messageBoard') {
        if (!permissions) {
            return <div className="min-h-screen flex items-center justify-center"><p>{TEXT.loading} Permissions...</p></div>;
        }
        if (permissions.isBanned) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                    <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
                    <p className="mt-2 text-gray-600">You are banned from this organization's message board.</p>
                    <button onClick={() => navigate('/profile')} className="mt-6 text-blue-600 hover:underline">
                        Return to Profile
                    </button>
                </div>
            );
        }
        return <MessageBoard user={user} organizationId={organizationId} permissions={permissions} onBack={() => navigate('/profile')} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-md border">
                {/* Back to Landing Button */}
                <div className="mb-6">
                    <Button onClick={handleBackToLanding} className="text-gray-600 hover:text-gray-900">
                        {TEXT.backToDemoButton}
                    </Button>
                </div>

                <div className="flex flex-col items-center text-center">
                    <img src={user.picture} alt={user.name} className="w-24 h-24 rounded-full mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900">{TEXT.welcome}, {user.name}</h1>
                    <p className="text-gray-600 mt-1">{user.email}</p>

                    {/* Display which flow was used */}
                    {auth0Config.flow && auth0Config.flow !== 'custom' && (
                        <div className="mt-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            Login Flow: {auth0Config.flow}
                        </div>
                    )}

                    <div className="mt-6 flex flex-col sm:flex-row flex-wrap justify-center gap-4">
                        {FEATURES.messageBoard && organizationId && permissions && !permissions.isBanned && (
                            <button onClick={() => navigate('/message-board')} className={`inline-flex items-center justify-center rounded-md text-sm font-medium w-full sm:w-auto px-6 py-2 ${STYLES.primaryButton}`}>
                                View Message Board
                            </button>
                        )}
                        <Button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} className={`${STYLES.dangerButton} w-full sm:w-auto px-6 py-2`}>{TEXT.logoutButton}</Button>
                        <Button onClick={handleLogoutAndClear} className={`${STYLES.secondaryButton} w-full sm:w-auto px-6 py-2`}>{TEXT.logoutAndClearButton}</Button>
                    </div>
                </div>
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-2">{TEXT.idTokenTitle}</h2>
                    <pre className={STYLES.tokenBox}>{decodedIdToken ? JSON.stringify(decodedIdToken, null, 2) : TEXT.loading}</pre>
                </div>
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-2">{TEXT.accessTokenTitle}</h2>
                    {accessTokenError && (<Alert title="Token Information" className="mb-4 bg-yellow-50 border-yellow-300 text-yellow-800">{accessTokenError}</Alert>)}
                    <pre className={STYLES.tokenBox}>{decodedAccessToken ? JSON.stringify(decodedAccessToken, null, 2) : rawAccessToken || TEXT.loading}</pre>
                </div>
            </div>
        </div>
    );
};