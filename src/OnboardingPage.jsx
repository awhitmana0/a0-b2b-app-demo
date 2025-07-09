import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { TEXT } from './ui-config.jsx';

export const OnboardingPage = () => {
    const { loginWithRedirect, isLoading } = useAuth0();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const invitation = searchParams.get('invitation');
        const organization = searchParams.get('organization');

        // If the required parameters are in the URL, trigger the login
        if (invitation && organization) {
            console.log(`[Onboarding] Found invitation and organization. Redirecting to Auth0...`);
            loginWithRedirect({
                authorizationParams: {
                    invitation,
                    organization,
                }
            });
        }
    }, [searchParams, loginWithRedirect]);

    // Display a loading message to the user while the redirect happens.
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>{TEXT.loading}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-2xl font-bold text-gray-800">Processing your invitation...</h1>
            <p className="mt-2 text-gray-600">You will be redirected momentarily.</p>
        </div>
    );
};