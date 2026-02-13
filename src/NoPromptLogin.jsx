import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { ICONS, TEXT, STYLES } from './ui-config.jsx';
import { getOrgByName } from './auth0-api';
import { Settings, X } from 'lucide-react';

const Button = ({ children, className = '', ...props }) => (
    <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props}>
        {children}
    </button>
);

const Dialog = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const NoPromptLogin = () => {
    const { loginWithRedirect, isAuthenticated } = useAuth0();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Get defaults from env or localStorage
    const getStoredOrgCode = () => localStorage.getItem('noPromptOrgCode') || import.meta.env.VITE_NO_PROMPT_DEFAULT_ORG_CODE || 'alpha';
    const getStoredConnection = () => localStorage.getItem('noPromptConnection') || import.meta.env.VITE_NO_PROMPT_DEFAULT_CONNECTION || '';

    const [orgCode, setOrgCode] = useState(getStoredOrgCode());
    const [connectionName, setConnectionName] = useState(getStoredConnection());
    const [tempOrgCode, setTempOrgCode] = useState(orgCode);
    const [tempConnection, setTempConnection] = useState(connectionName);

    // Check if we should auto-login immediately
    const params = new URLSearchParams(window.location.search);
    const shouldLogin = params.get('login') === 'true';
    const org = params.get('org');
    const connection = params.get('connection');

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/profile');
        }
    }, [isAuthenticated, navigate]);

    // Auto-login when coming from landing page with parameters
    useEffect(() => {
        if (shouldLogin && org && !isAuthenticated) {
            console.log('[NoPromptLogin] Auto-triggering login with org:', org, 'connection:', connection);

            const authParams = {
                organization: org
            };

            if (connection) {
                authParams.connection = connection;
            }

            loginWithRedirect({
                authorizationParams: authParams
            });
        }
    }, [shouldLogin, org, connection, loginWithRedirect, isAuthenticated]);

    // If auto-login is triggered, show loading instead of the page
    if (shouldLogin && org && !isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    const handleLogin = async (withConnection = false) => {
        setError('');
        setIsLoading(true);

        try {
            let orgId = orgCode.trim();

            // If the input doesn't look like an org ID (doesn't start with org_),
            // treat it as an organization name and look it up
            if (!orgId.startsWith('org_')) {
                console.log('[NoPromptLogin] Looking up organization by name:', orgId);
                const org = await getOrgByName(orgId);
                console.log('[NoPromptLogin] Organization lookup result:', org);

                if (!org) {
                    throw new Error(`Organization '${orgId}' not found.`);
                }
                orgId = org.id;
                console.log('[NoPromptLogin] Using organization ID:', orgId);
            }

            // Store login details for later use
            localStorage.setItem('pendingLoginDetails', JSON.stringify({
                ssoId: orgCode.trim(),
                loginFlow: 'no-prompt'
            }));

            // Build authorization parameters
            const authParams = {
                organization: orgId
            };

            if (withConnection && connectionName.trim()) {
                authParams.connection = connectionName.trim();
                console.log('[NoPromptLogin] Including connection:', connectionName.trim());
            }

            console.log('[NoPromptLogin] Calling loginWithRedirect with params:', authParams);

            // With "No Prompt" flow, the app provides the organization parameter
            // Auth0 will go directly to the login screen without prompting
            await loginWithRedirect({
                authorizationParams: authParams
            });
        } catch (err) {
            console.error('[NoPromptLogin] Error during login:', err);
            setError(err.message || 'An error occurred during login.');
            setIsLoading(false);
        }
    };

    const handleSaveSettings = () => {
        setOrgCode(tempOrgCode);
        setConnectionName(tempConnection);
        localStorage.setItem('noPromptOrgCode', tempOrgCode);
        localStorage.setItem('noPromptConnection', tempConnection);
        setIsSettingsOpen(false);
    };

    const handleOpenSettings = () => {
        setTempOrgCode(orgCode);
        setTempConnection(connectionName);
        setIsSettingsOpen(true);
    };

    const handleBackToLanding = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans">
            {/* Settings Dialog */}
            <Dialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Direct Login Settings">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="settings-org" className="block text-sm font-medium text-gray-700 mb-2">
                            Organization Code
                        </label>
                        <input
                            id="settings-org"
                            type="text"
                            value={tempOrgCode}
                            onChange={(e) => setTempOrgCode(e.target.value)}
                            placeholder="e.g., alpha"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Organization code will be looked up to get the org ID
                        </p>
                    </div>

                    <div>
                        <label htmlFor="settings-connection" className="block text-sm font-medium text-gray-700 mb-2">
                            Connection Name (Optional)
                        </label>
                        <input
                            id="settings-connection"
                            type="text"
                            value={tempConnection}
                            onChange={(e) => setTempConnection(e.target.value)}
                            placeholder="e.g., hooli-azure"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Used for "Login with Connection" button
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button onClick={() => setIsSettingsOpen(false)} className={`${STYLES.secondaryButton} px-4 py-2`}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveSettings} className={`${STYLES.primaryButton} px-4 py-2`}>
                            Save Settings
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Floating Settings Button */}
            <button
                onClick={handleOpenSettings}
                className="fixed bottom-8 right-8 bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-40"
                title="Configure Direct Login Settings"
            >
                <Settings className="h-6 w-6" />
            </button>

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
                            {ICONS.FlowNoPrompt}
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
                            {TEXT.noPromptLoginTitle}
                        </h1>
                        <p className="text-lg text-gray-600">
                            {TEXT.noPromptLoginDesc}
                        </p>
                    </div>

                    {/* Current Settings Display */}
                    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">Current Settings:</h3>
                        <div className="text-sm text-blue-800 space-y-1">
                            <p><strong>Organization:</strong> {orgCode}</p>
                            {connectionName && <p><strong>Connection:</strong> {connectionName}</p>}
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                            Click the <Settings className="inline h-3 w-3" /> button to change these settings
                        </p>
                    </div>

                    {/* Login Buttons Card */}
                    <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
                        <div className="space-y-4">
                            <Button
                                onClick={() => handleLogin(false)}
                                disabled={isLoading}
                                className={`${STYLES.primaryButton} px-8 py-3 text-lg w-full`}
                            >
                                {isLoading ? 'Loading...' : 'Login (Organization Only)'}
                            </Button>

                            {connectionName && (
                                <Button
                                    onClick={() => handleLogin(true)}
                                    disabled={isLoading}
                                    className={`bg-purple-600 text-white hover:bg-purple-700 px-8 py-3 text-lg w-full`}
                                >
                                    {isLoading ? 'Loading...' : 'Login with Connection'}
                                </Button>
                            )}

                            {error && (
                                <p className="text-red-600 text-sm mt-2">{error}</p>
                            )}
                        </div>

                        <div className="mt-6 text-sm text-gray-500 space-y-2">
                            <p><strong>Organization Only:</strong> Provides just the organization parameter to Auth0</p>
                            {connectionName && (
                                <p><strong>With Connection:</strong> Provides organization + connection (bypasses connection selection)</p>
                            )}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="font-semibold text-green-900 mb-2">How This Works</h3>
                        <ul className="text-sm text-green-800 space-y-2">
                            <li>• The application provides the organization parameter directly</li>
                            <li>• No organization selection or identifier prompts are shown</li>
                            <li>• Users go directly to the login screen for that organization</li>
                            <li>• Optional: Add connection parameter to skip connection selection</li>
                            <li>• Most streamlined experience when organization is known</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};
