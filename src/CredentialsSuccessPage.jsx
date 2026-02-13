import React from 'react';
import { STYLES } from './ui-config.jsx';
import { exchangeCodeForTokens, getUserInfo } from './pkce-helper';

const Button = ({ children, className = '', ...props }) => (
    <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props}>
        {children}
    </button>
);

export const CredentialsSuccessPage = () => {
    const [user, setUser] = React.useState(null);
    const [accessToken, setAccessToken] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const hasExchangedCode = React.useRef(false);

    React.useEffect(() => {
        const handleCallback = async () => {
            // Prevent double execution in React StrictMode
            if (hasExchangedCode.current) {
                return;
            }
            hasExchangedCode.current = true;
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');

            if (!code) {
                setError('No authorization code found');
                setIsLoading(false);
                return;
            }

            try {
                const domain = import.meta.env.VITE_AUTH0_DOMAIN;
                const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID_PROMPT_CREDENTIALS;
                const redirectUri = `${window.location.origin}/success/credentials`;

                // Get PKCE verifier from sessionStorage
                const verifier = sessionStorage.getItem('pkce_verifier_credentials');
                if (!verifier) {
                    throw new Error('PKCE verifier not found');
                }

                console.log('[CredentialsSuccess] Exchanging code for tokens');

                // Exchange code for tokens
                const tokens = await exchangeCodeForTokens(domain, clientId, code, verifier, redirectUri);
                setAccessToken(tokens.access_token);

                // Get user info
                const userInfo = await getUserInfo(domain, tokens.access_token);
                setUser(userInfo);

                // Clean up
                sessionStorage.removeItem('pkce_verifier_credentials');

                // Remove code from URL
                window.history.replaceState({}, '', window.location.pathname);

                setIsLoading(false);
            } catch (err) {
                console.error('[CredentialsSuccess] Error:', err);
                setError(err.message);
                setIsLoading(false);
            }
        };

        handleCallback();
    }, []);

    const handleBackToLanding = () => {
        window.location.href = '/';
    };

    const handleLogout = () => {
        // Clear any stored tokens
        sessionStorage.clear();
        window.location.href = '/';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Completing authentication...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center max-w-md">
                    <p className="text-red-600 mb-4">{error || 'Authentication failed'}</p>
                    <Button onClick={handleBackToLanding} className={STYLES.secondaryButton + " px-4 py-2"}>
                        Back to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <div className="mb-8">
                    <Button onClick={handleBackToLanding} className="text-gray-600 hover:text-gray-900">
                        ← Back to Demo Selection
                    </Button>
                </div>

                {/* Success Message */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Identifier First Login Successful!</h1>
                        <p className="text-gray-600">You've successfully authenticated using the "Prompt for Credentials" flow</p>
                    </div>

                    {/* User Info */}
                    <div className="border-t pt-6">
                        <div className="flex items-center justify-center mb-6">
                            <img src={user.picture} alt={user.name} className="w-16 h-16 rounded-full mr-4" />
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                                <p className="text-gray-600">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <div className="flex justify-center pt-6 border-t">
                        <Button onClick={handleLogout} className={`${STYLES.dangerButton} px-8 py-3`}>
                            Logout
                        </Button>
                    </div>
                </div>

                {/* Access Token Display */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Access Token</h3>
                    {accessToken ? (
                        <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto text-sm">
{accessToken}
                        </pre>
                    ) : (
                        <p className="text-gray-600">Loading token...</p>
                    )}
                </div>
            </div>
        </div>
    );
};
