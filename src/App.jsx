import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LandingPage } from './LandingPage.jsx';
import { LoginPage } from './LoginPage.jsx';
import { PromptCredentialsLogin } from './PromptCredentialsLogin.jsx';
import { PromptOrganizationLogin } from './PromptOrganizationLogin.jsx';
import { NoPromptLogin } from './NoPromptLogin.jsx';
import { ProfilePage } from './ProfilePage.jsx';
import { OnboardingPage } from './OnboardingPage.jsx'; // <-- Import the new component
import { TEXT, STYLES } from './ui-config.jsx';

// Reusable button component for the loading screen
const Button = ({ children, className = '', ...props }) => (
    <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props}>
        {children}
    </button>
);

// A simple component to protect routes that require authentication
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth0();
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><p>{TEXT.loading}</p></div>;
    }
    return isAuthenticated ? children : <Navigate to="/" replace />;
};

// FlowRouter component to route based on query param
const FlowRouter = () => {
    const { isAuthenticated, loginWithRedirect } = useAuth0();
    const navigate = useNavigate();
    const params = new URLSearchParams(window.location.search);
    const flow = params.get('flow');
    const hasAuthCode = params.get('code') || params.get('state');

    // Check for auto-login flag from localStorage
    const shouldAutoLogin = localStorage.getItem('auth0_auto_login') === 'true';

    // If user is authenticated and came back from Auth0, go to profile
    React.useEffect(() => {
        if (isAuthenticated && hasAuthCode) {
            console.log('[FlowRouter] User authenticated, redirecting to profile');
            navigate('/profile', { replace: true });
        }
    }, [isAuthenticated, hasAuthCode, navigate]);

    // If auto-login flag is set, trigger SYNCHRONOUSLY before render
    if (shouldAutoLogin && !isAuthenticated && !hasAuthCode) {
        console.log('[FlowRouter] Auto-login triggered for flow:', flow);

        // Clear the flag immediately
        localStorage.removeItem('auth0_auto_login');

        const authParams = {};

        // For no-prompt flow, get org from localStorage
        if (flow === 'no-prompt') {
            const org = localStorage.getItem('auth0_auto_login_org');
            const connection = localStorage.getItem('auth0_auto_login_connection');

            if (org) {
                authParams.organization = org;
            }
            if (connection) {
                authParams.connection = connection;
            }

            // Clear the stored values
            localStorage.removeItem('auth0_auto_login_org');
            localStorage.removeItem('auth0_auto_login_connection');
        }

        // Trigger login immediately, synchronously
        setTimeout(() => {
            loginWithRedirect({ authorizationParams: authParams });
        }, 1); // 1ms delay to allow render
    }

    // If auto-login is in progress, show loading
    if (shouldAutoLogin && !isAuthenticated && !hasAuthCode) {
        const colors = {
            'credentials': 'border-blue-600',
            'organization': 'border-purple-600',
            'no-prompt': 'border-green-600'
        };

        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colors[flow] || 'border-blue-600'} mx-auto mb-4`}></div>
                    <p className="text-gray-600">Redirecting to Auth0...</p>
                </div>
            </div>
        );
    }

    // If coming back from Auth0 (has code), show loading while Auth0Provider processes
    if (hasAuthCode && !isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Completing authentication...</p>
                </div>
            </div>
        );
    }

    // Otherwise show the normal pages
    switch(flow) {
        case 'credentials':
            return <PromptCredentialsLogin />;
        case 'organization':
            return <PromptOrganizationLogin />;
        case 'no-prompt':
            return <NoPromptLogin />;
        case 'custom':
            return <LoginPage />;
        default:
            return <LoginPage />;
    }
};

export default function App() {
    const { isLoading, logout } = useAuth0();

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="mb-4">{TEXT.loading}</p>
                <Button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} className={`${STYLES.logoutButton} px-4 py-2`}>
                    Force Logout
                </Button>
            </div>
        );
    }
    
    return (
        <Routes>
            {/* Show landing page only when no flow is selected */}
            <Route path="/" element={
                window.location.search ? <FlowRouter /> : <LandingPage />
            } />
            <Route path="/login/:orgCode" element={<LoginPage />} />

            {/* --- NEW ONBOARDING ROUTE --- */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/message-board"
                element={
                    <ProtectedRoute>
                        <ProfilePage initialView="messageBoard" />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}