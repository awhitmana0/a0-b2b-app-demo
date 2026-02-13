import React from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const AutoLoginContent = () => {
    const { loginWithRedirect, isAuthenticated } = useAuth0();
    const navigate = useNavigate();

    const params = new URLSearchParams(window.location.search);
    const flow = params.get('flow');
    const auto = params.get('auto');
    const org = params.get('org');
    const connection = params.get('connection');
    const hasCode = params.get('code');

    React.useEffect(() => {
        // If authenticated, redirect to success page
        if (isAuthenticated) {
            const successMap = {
                'credentials': '/success/credentials',
                'organization': '/success/organization',
                'no-prompt': '/success/no-prompt',
            };
            navigate(successMap[flow] || '/profile', { replace: true });
            return;
        }

        // If not authenticated and no code, trigger login
        if (!isAuthenticated && !hasCode) {
            const authParams = {
                redirect_uri: window.location.origin // Callback to same page
            };

            // Add org for no-prompt flow
            if (flow === 'no-prompt' && org) {
                authParams.organization = org;
            }
            if (connection) {
                authParams.connection = connection;
            }

            console.log('[AutoLoginPage] Triggering loginWithRedirect for flow:', flow, authParams);
            loginWithRedirect({ authorizationParams: authParams });
        }
    }, [isAuthenticated, hasCode, flow, org, connection, loginWithRedirect, navigate]);

    const colors = {
        'credentials': 'border-blue-600',
        'organization': 'border-purple-600',
        'no-prompt': 'border-green-600',
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colors[flow] || 'border-blue-600'} mx-auto mb-4`}></div>
                <p className="text-gray-600">{hasCode ? 'Completing authentication...' : 'Redirecting to Auth0...'}</p>
            </div>
        </div>
    );
};

export const AutoLoginPage = () => {
    const params = new URLSearchParams(window.location.search);
    const flow = params.get('flow');

    const clientIds = {
        'credentials': import.meta.env.VITE_AUTH0_CLIENT_ID_PROMPT_CREDENTIALS,
        'organization': import.meta.env.VITE_AUTH0_CLIENT_ID_PROMPT_ORG,
        'no-prompt': import.meta.env.VITE_AUTH0_CLIENT_ID_NO_PROMPT,
    };

    const clientId = clientIds[flow];

    return (
        <Auth0Provider
            domain={import.meta.env.VITE_AUTH0_DOMAIN}
            clientId={clientId}
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            }}
            useRefreshTokens={true}
            cacheLocation="localstorage"
        >
            <AutoLoginContent />
        </Auth0Provider>
    );
};
