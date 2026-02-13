import React, { useState } from 'react';
import { ICONS, TEXT, STYLES } from './ui-config.jsx';
import { getOrgByName } from './auth0-api';
import { generatePKCE } from './pkce-helper';
import { Settings, X, Info, ExternalLink } from 'lucide-react';

const Button = ({ children, className = '', ...props }) => (
    <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props}>
        {children}
    </button>
);

const Dialog = ({ isOpen, onClose, title, children, size = "md" }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        md: "max-w-md",
        lg: "max-w-2xl",
        xl: "max-w-4xl"
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}`}>
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const FlowCard = ({ icon, title, description, flow, colorClass, onInfoClick, onDirectLogin }) => {
    const handleClick = () => {
        // For credentials and organization flows, use direct Auth0 login
        if (flow === 'credentials' || flow === 'organization') {
            onDirectLogin(flow);
        } else {
            // For custom flow, just navigate to the page
            localStorage.setItem('auth0_flow', flow);
            window.location.href = `/?flow=${flow}`;
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200 hover:border-${colorClass}-500 cursor-pointer relative`} onClick={handleClick}>
            {/* Info Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onInfoClick();
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-colors"
                title="Learn more about this flow"
            >
                <Info className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gray-50 rounded-full">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600 flex-grow">{description}</p>
                <Button className={`${STYLES.primaryButton} px-6 py-2 w-full`}>
                    {TEXT.tryThisFlowButton}
                </Button>
            </div>
        </div>
    );
};

const DirectLoginCard = ({ icon, title, description, onLoginOrg, onLoginConnection, onInfoClick, isLoading, connectionName }) => {
    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-200 hover:border-green-500 relative">
            {/* Info Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onInfoClick();
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-colors"
                title="Learn more and configure settings"
            >
                <Info className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gray-50 rounded-full">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600 flex-grow">{description}</p>

                {/* Two Login Buttons */}
                <div className="w-full space-y-2">
                    <Button
                        onClick={onLoginOrg}
                        disabled={isLoading}
                        className={`${STYLES.primaryButton} px-4 py-2 w-full text-sm`}
                    >
                        {isLoading ? 'Loading...' : 'Login (Org Only)'}
                    </Button>

                    {connectionName && (
                        <Button
                            onClick={onLoginConnection}
                            disabled={isLoading}
                            className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 w-full text-sm"
                        >
                            {isLoading ? 'Loading...' : 'Login + Connection'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

const FLOW_INFO = {
    credentials: {
        title: "Identifier First Login",
        points: [
            "User enters their email or username first",
            "Auth0 automatically identifies which organization they belong to",
            "No manual organization selection required",
            "Ideal for users who belong to only one organization",
            "Demonstrates the 'Prompt for Credentials' login flow setting"
        ],
        params: "No parameters required - Auth0 handles everything"
    },
    organization: {
        title: "Organization Prompt",
        points: [
            "User is prompted to select their organization first",
            "Then enters their credentials for that organization",
            "Useful when users belong to multiple organizations",
            "Shows a list of available organizations",
            "Demonstrates the 'Prompt for Organization' login flow setting"
        ],
        params: "No parameters required - Auth0 shows organization picker"
    },
    noPrompt: {
        title: "Direct Login (No Prompt)",
        points: [
            "Application provides the organization parameter directly",
            "No organization or identifier prompts are shown",
            "User goes straight to the login screen",
            "Most streamlined experience when organization is known",
            "Optionally include connection parameter to skip connection selection",
            "Demonstrates the 'No Prompt' login flow setting"
        ],
        params: `Example: { organization: "org_abc123" }\nWith connection: { organization: "org_abc123", connection: "google-oauth2" }`
    },
    custom: {
        title: "Interactive Walkthrough",
        points: [
            "Full-featured demonstration with multiple options",
            "Choose from different authentication strategies",
            "Test SSO-only, username/password-only, or multiple options",
            "Includes sign-up flow with organization creation",
            "Shows how to programmatically control the login experience",
            "Great for exploring all Auth0 organization features"
        ],
        params: "Various parameters depending on selected flow"
    }
};

export const LandingPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [currentFlow, setCurrentFlow] = useState(null);
    const [error, setError] = useState('');

    const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
    const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE;
    const clientIds = {
        'credentials': import.meta.env.VITE_AUTH0_CLIENT_ID_PROMPT_CREDENTIALS,
        'organization': import.meta.env.VITE_AUTH0_CLIENT_ID_PROMPT_ORG,
        'no-prompt': import.meta.env.VITE_AUTH0_CLIENT_ID_NO_PROMPT,
    };


    // Get defaults from env or localStorage
    const getStoredOrgCode = () => localStorage.getItem('noPromptOrgCode') || import.meta.env.VITE_NO_PROMPT_DEFAULT_ORG_CODE || 'alpha';
    const getStoredConnection = () => localStorage.getItem('noPromptConnection') || import.meta.env.VITE_NO_PROMPT_DEFAULT_CONNECTION || '';

    const [orgCode, setOrgCode] = useState(getStoredOrgCode());
    const [connectionName, setConnectionName] = useState(getStoredConnection());
    const [tempOrgCode, setTempOrgCode] = useState(orgCode);
    const [tempConnection, setTempConnection] = useState(connectionName);

    const handleDirectFlowLogin = async (flow) => {
        const clientId = clientIds[flow];
        const redirectUri = `${window.location.origin}/success/${flow}`;

        // Generate PKCE
        const { verifier, challenge } = await generatePKCE();

        // Store verifier for later token exchange
        sessionStorage.setItem(`pkce_verifier_${flow}`, verifier);

        // Build Auth0 authorization URL
        const authUrl = new URL(`https://${auth0Domain}/authorize`);
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'openid profile email');
        authUrl.searchParams.set('code_challenge', challenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');
        if (auth0Audience) {
            authUrl.searchParams.set('audience', auth0Audience);
        }

        console.log('[LandingPage] Redirecting to Auth0 with PKCE');
        window.location.href = authUrl.toString();
    };

    const handleDirectLogin = async (withConnection = false) => {
        setError('');
        setIsLoading(true);

        try {
            // Store flow in localStorage for persistence across auth redirect
            localStorage.setItem('auth0_flow', 'no-prompt');

            let orgId = orgCode.trim();

            // If the input doesn't look like an org ID, look it up
            if (!orgId.startsWith('org_')) {
                console.log('[LandingPage] Looking up organization by name:', orgId);
                const org = await getOrgByName(orgId);
                if (!org) {
                    throw new Error(`Organization '${orgId}' not found.`);
                }
                orgId = org.id;
                console.log('[LandingPage] Using organization ID:', orgId);
            }

            const clientId = clientIds['no-prompt'];
            const redirectUri = `${window.location.origin}/success/no-prompt`;

            // Generate PKCE
            const { verifier, challenge } = await generatePKCE();

            // Store verifier for later token exchange
            sessionStorage.setItem('pkce_verifier_no-prompt', verifier);

            // Build Auth0 authorization URL
            const authUrl = new URL(`https://${auth0Domain}/authorize`);
            authUrl.searchParams.set('client_id', clientId);
            authUrl.searchParams.set('redirect_uri', redirectUri);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('scope', 'openid profile email');
            authUrl.searchParams.set('code_challenge', challenge);
            authUrl.searchParams.set('code_challenge_method', 'S256');
            authUrl.searchParams.set('organization', orgId);

            if (withConnection && connectionName.trim()) {
                authUrl.searchParams.set('connection', connectionName.trim());
            }

            if (auth0Audience) {
                authUrl.searchParams.set('audience', auth0Audience);
            }

            console.log('[LandingPage] Redirecting to Auth0 with PKCE');
            window.location.href = authUrl.toString();
        } catch (err) {
            console.error('[LandingPage] Error during login:', err);
            setError(err.message || 'An error occurred during login.');
            setIsLoading(false);
        }
    };

    const handleSaveSettings = () => {
        setOrgCode(tempOrgCode);
        setConnectionName(tempConnection);
        localStorage.setItem('noPromptOrgCode', tempOrgCode);
        localStorage.setItem('noPromptConnection', tempConnection);
    };

    const handleShowInfo = (flow) => {
        setCurrentFlow(flow);
        setTempOrgCode(orgCode);
        setTempConnection(connectionName);
        setIsInfoOpen(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 font-sans">
            {/* Info Dialog */}
            <Dialog
                isOpen={isInfoOpen}
                onClose={() => {
                    setIsInfoOpen(false);
                    // If Direct Login flow, reset temp values if not saved
                    if (currentFlow === 'noPrompt') {
                        setTempOrgCode(orgCode);
                        setTempConnection(connectionName);
                    }
                }}
                title={currentFlow ? FLOW_INFO[currentFlow]?.title : "Flow Information"}
                size="lg"
            >
                {currentFlow && FLOW_INFO[currentFlow] && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3 text-lg">What This Demonstrates:</h4>
                            <ul className="space-y-2">
                                {FLOW_INFO[currentFlow].points.map((point, idx) => (
                                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                                        <span className="mr-2 text-blue-600 font-bold">•</span>
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Settings for Direct Login */}
                        {currentFlow === 'noPrompt' && (
                            <div className="pt-6 border-t">
                                <h4 className="font-semibold text-gray-900 mb-3 text-lg flex items-center">
                                    <Settings className="h-5 w-5 mr-2 text-gray-600" />
                                    Configure Settings
                                </h4>
                                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
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
                                            Used for "Login + Connection" button
                                        </p>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button onClick={handleSaveSettings} className={`${STYLES.primaryButton} px-4 py-2`}>
                                            Save Settings
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-6 border-t">
                            <h4 className="font-semibold text-gray-900 mb-3 text-lg">Parameters Example:</h4>
                            <pre className="text-sm bg-gray-900 text-white p-4 rounded overflow-x-auto">
{FLOW_INFO[currentFlow].params}
                            </pre>
                        </div>
                    </div>
                )}
            </Dialog>

            <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16">
                {/* Header */}
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <div className="flex justify-center items-center space-x-6 mb-8">
                        {ICONS.HeaderShield}
                        {ICONS.HeaderBriefcase}
                        {ICONS.HeaderZap}
                        {ICONS.HeaderHeart}
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
                        {TEXT.landingTitle}
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                        {TEXT.landingSubtitle}
                    </p>

                    {/* Documentation Link */}
                    <div className="mt-6">
                        <a
                            href="https://auth0.com/docs/manage-users/organizations/login-flows-for-organizations"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                            <span>Read Official Auth0 Documentation</span>
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="max-w-6xl mx-auto mb-8">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                            {error}
                        </div>
                    </div>
                )}

                {/* Flow Cards Grid */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FlowCard
                        icon={ICONS.FlowCredentials}
                        title={TEXT.flowCredentialsTitle}
                        description={TEXT.flowCredentialsDesc}
                        flow="credentials"
                        colorClass="blue"
                        onInfoClick={() => handleShowInfo('credentials')}
                        onDirectLogin={handleDirectFlowLogin}
                    />
                    <FlowCard
                        icon={ICONS.FlowOrganization}
                        title={TEXT.flowOrganizationTitle}
                        description={TEXT.flowOrganizationDesc}
                        flow="organization"
                        colorClass="purple"
                        onInfoClick={() => handleShowInfo('organization')}
                        onDirectLogin={handleDirectFlowLogin}
                    />
                    <DirectLoginCard
                        icon={ICONS.FlowNoPrompt}
                        title={TEXT.flowNoPromptTitle}
                        description={TEXT.flowNoPromptDesc}
                        onLoginOrg={() => handleDirectLogin(false)}
                        onLoginConnection={() => handleDirectLogin(true)}
                        onInfoClick={() => handleShowInfo('noPrompt')}
                        isLoading={isLoading}
                        connectionName={connectionName}
                    />
                    <FlowCard
                        icon={ICONS.FlowCustom}
                        title={TEXT.flowCustomTitle}
                        description={TEXT.flowCustomDesc}
                        flow="custom"
                        colorClass="orange"
                        onInfoClick={() => handleShowInfo('custom')}
                    />
                </div>

                {/* Info Footer */}
                <div className="max-w-4xl mx-auto mt-16 text-center space-y-4">
                    <p className="text-sm text-gray-500">
                        Each flow demonstrates a different Auth0 "Login Flow" configuration. Click the <Info className="inline h-4 w-4" /> icon on any card to learn more.
                    </p>
                    <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-400">
                            For more information, visit the{' '}
                            <a
                                href="https://auth0.com/docs/manage-users/organizations/login-flows-for-organizations"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600 underline"
                            >
                                Auth0 Organizations Documentation
                            </a>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};
