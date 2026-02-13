import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { ICONS, TEXT, STYLES } from './ui-config.jsx';

const Button = ({ children, className = '', ...props }) => (
    <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props}>
        {children}
    </button>
);

export const PromptOrganizationLogin = () => {
    const { loginWithRedirect, isAuthenticated } = useAuth0();
    const navigate = useNavigate();

    // Check if we should auto-login immediately
    const params = new URLSearchParams(window.location.search);
    const shouldLogin = params.get('login') === 'true';

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/profile');
        }
    }, [isAuthenticated, navigate]);

    // Auto-login when coming from landing page - do this immediately
    useEffect(() => {
        if (shouldLogin && !isAuthenticated) {
            console.log('[PromptOrganizationLogin] Auto-triggering login');
            loginWithRedirect({
                authorizationParams: {}
            });
        }
    }, [shouldLogin, loginWithRedirect, isAuthenticated]);

    // If auto-login is triggered, show loading instead of the page
    if (shouldLogin && !isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    const handleLogin = async () => {
        // With "Prompt for Organization" flow, Auth0 shows organization selection
        // We just need to call loginWithRedirect with minimal parameters
        await loginWithRedirect({
            authorizationParams: {}
        });
    };

    const handleBackToLanding = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans">
            <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16">
                <div className="max-w-2xl mx-auto">
                    {/* Back Button */}
                    <div className="mb-8">
                        <Button onClick={handleBackToLanding} className="text-gray-600 hover:text-gray-900">
                            {TEXT.backToDemoButton}
                        </Button>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="flex justify-center mb-6">
                            {ICONS.FlowOrganization}
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
                            {TEXT.promptOrganizationLoginTitle}
                        </h1>
                        <p className="text-lg text-gray-600">
                            {TEXT.promptOrganizationLoginDesc}
                        </p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center">
                        <Button
                            onClick={handleLogin}
                            className={`${STYLES.primaryButton} px-8 py-3 text-lg w-full sm:w-auto`}
                        >
                            Login
                        </Button>
                        <p className="mt-6 text-sm text-gray-500">
                            This flow uses Auth0's "Prompt for Organization" setting, which shows organization selection first.
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
                        <h3 className="font-semibold text-purple-900 mb-2">How This Works</h3>
                        <ul className="text-sm text-purple-800 space-y-2">
                            <li>• You'll first be prompted to select your organization</li>
                            <li>• Auth0 presents a list of organizations you belong to</li>
                            <li>• After selecting, you'll enter your credentials</li>
                            <li>• This is useful when users belong to multiple organizations</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};
