import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './LoginPage.jsx';
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
            <Route path="/" element={<LoginPage />} />
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