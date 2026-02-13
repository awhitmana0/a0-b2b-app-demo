import React from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { auth0Config } from './auth0-config.js';
import { LandingPage } from './LandingPage.jsx';
import { AutoLoginPage } from './AutoLoginPage.jsx';
import { LoginPage } from './LoginPage.jsx';
import { CredentialsSuccessPage } from './CredentialsSuccessPage.jsx';
import { OrganizationSuccessPage } from './OrganizationSuccessPage.jsx';
import { NoPromptSuccessPage } from './NoPromptSuccessPage.jsx';
import { ProfilePage } from './ProfilePage.jsx';
import { OnboardingPage } from './OnboardingPage.jsx';
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


// Wrap routes that need Auth0Provider (custom flow only)
const CustomFlowRoutes = () => {
    const params = new URLSearchParams(window.location.search);
    const flow = params.get('flow');

    return (
        <Auth0Provider
            domain={auth0Config.domain}
            clientId={auth0Config.clientId}
            authorizationParams={{
                redirect_uri: `${window.location.origin}/profile`,
                audience: auth0Config.audience,
            }}
        >
            <Routes>
                <Route path="/" element={
                    flow === 'custom' ? <LoginPage /> : <LandingPage />
                } />
                <Route path="/login/:orgCode" element={<LoginPage />} />
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
        </Auth0Provider>
    );
};

export default function App() {
    return (
        <Routes>
            {/* Success pages - each has its own Auth0Provider with specific client_id */}
            <Route path="/success/credentials" element={<CredentialsSuccessPage />} />
            <Route path="/success/organization" element={<OrganizationSuccessPage />} />
            <Route path="/success/no-prompt" element={<NoPromptSuccessPage />} />

            {/* All other routes use the custom flow Auth0Provider */}
            <Route path="/*" element={<CustomFlowRoutes />} />
        </Routes>
    );
}