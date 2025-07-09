import React, { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrgByName, getOrgConnections, getInternalAdminConnection } from './auth0-api';
import { getCookie, setCookie } from './cookie-manager';
import { ICONS, TEXT, STYLES, LOGIN_FLOW_OPTIONS } from './ui-config.jsx';
import { Shield, Briefcase, Zap, Heart, AlertCircle } from 'lucide-react';
import { LoginTab } from './LoginTab.jsx';
import { SignUpTab } from './SignUpTab.jsx';

// --- Reusable UI Components ---
const Button = ({ children, className = '', ...props }) => ( <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props}>{children}</button> );
const Dialog = ({ isOpen, onCancel, onConfirm, title, children, confirmText = "Confirm & Continue", showConfirmButton = true }) => { if (!isOpen) return null; return ( <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-md"><div className="flex items-center justify-between p-6 border-b"><h3 className="text-lg font-semibold">{title}</h3><Button onClick={onCancel} className={STYLES.iconButton}>{ICONS.DialogClose}</Button></div><div className="p-6 text-sm text-gray-700">{children}</div><div className="flex justify-end p-6 border-t space-x-4"><Button onClick={onCancel} className={STYLES.secondaryButton + " px-4 py-2"}>{showConfirmButton ? "Cancel" : "Close"}</Button>{showConfirmButton && ( <Button onClick={onConfirm} className={STYLES.primaryButton + " px-4 py-2"}>{confirmText}</Button> )}</div></div></div> ); };
const Switch = ({ id, checked, onCheckedChange, className = '' }) => { return ( <button id={id} type="button" role="switch" aria-checked={checked} onClick={() => onCheckedChange(!checked)} className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-gray-900' : 'bg-gray-300'} ${className}`}><span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} /></button> ); };
const Tabs = ({ tabs, activeTab, setActiveTab }) => { const activeTabContent = tabs.find(tab => tab.value === activeTab)?.content; return ( <div><div className="border-b border-gray-200"><nav className="-mb-px flex space-x-6" aria-label="Tabs">{tabs.map((tab) => ( <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${ activeTab === tab.value ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }`}>{tab.label}</button> ))}</nav></div><div className="pt-8">{activeTabContent}</div></div> ); };
const Alert = ({ title, children, className = '' }) => ( <div className={`p-4 rounded-md border text-left ${className}`}><div className="flex"><div className="flex-shrink-0"><AlertCircle className="h-5 w-5" /></div><div className="ml-3"><h3 className="text-sm font-medium">{title}</h3><div className="mt-2 text-sm"><p>{children}</p></div></div></div></div> );

export const LoginPage = () => {
    const { loginWithRedirect, isAuthenticated } = useAuth0();
    const { orgCode } = useParams();
    const navigate = useNavigate();

    const [ssoId, setSsoId] = useState('');
    const [lastLoginInfo, setLastLoginInfo] = useState(null);
    const [error, setError] = useState('');
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [loginParamsToConfirm, setLoginParamsToConfirm] = useState(null);
    const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
    const [showParamsDialog, setShowParamsDialog] = useState(true);
    const [activeTab, setActiveTab] = useState('login');
    const [isSigningUp, setIsSigningUp] = useState(false);

    const executeLoginFlow = async (flow, details = {}, forceRedirect = false) => {
        setError('');
        const { ssoId, organizationId, email, connectionName } = details;
        const loginParams = {};
        if (email) loginParams.login_hint = email;
        if (connectionName) loginParams.connection = connectionName;
        try {
            localStorage.setItem('pendingLoginDetails', JSON.stringify({ ssoId, loginFlow: flow }));
            if (flow === 'default') {
                if (showParamsDialog && !forceRedirect) {
                    setLoginParamsToConfirm(loginParams);
                    setIsConfirmDialogOpen(true);
                } else {
                    await loginWithRedirect({ authorizationParams: loginParams });
                }
                return;
            }
            let orgIdToUse = organizationId;
            if (!orgIdToUse && ssoId) {
                const org = await getOrgByName(ssoId);
                if (!org) {
                    if (forceRedirect) {
                        navigate('/', { replace: true });
                        throw new Error(TEXT.errorOrgNotFoundDeepLink);
                    }
                    throw new Error(`Organization '${ssoId}' not found.`);
                }
                orgIdToUse = org.id;
            }
            if (!orgIdToUse) throw new Error(TEXT.errorMissingSsoId);
            loginParams.organization = orgIdToUse;
            if (!connectionName) {
                if (flow === 'sso_only' || flow === 'username_password_only' || flow === 'internal_admin') {
                    const connections = await getOrgConnections(orgIdToUse);
                    let foundConnection;
                    if (flow === 'sso_only') {
                        foundConnection = connections.find(c => c.connection.strategy !== 'auth0');
                        if (!foundConnection) throw new Error(TEXT.errorNoSsoConnection);
                    } else if (flow === 'username_password_only') {
                        foundConnection = connections.find(c => c.connection.strategy === 'auth0');
                        if (!foundConnection) throw new Error(TEXT.errorNoDbConnection);
                    } else {
                        const adminConnection = await getInternalAdminConnection(orgIdToUse);
                        foundConnection = adminConnection;
                        if (!foundConnection) throw new Error("Internal admin connection not enabled for this org.");
                    }
                    loginParams.connection = foundConnection.connection.name;
                }
            }
            if (showParamsDialog && !forceRedirect) {
                setLoginParamsToConfirm(loginParams);
                setIsConfirmDialogOpen(true);
            } else {
                await loginWithRedirect({ authorizationParams: loginParams });
            }
        } catch (err) {
            setError(err.message);
        }
    };
    
    useEffect(() => {
        if (orgCode && !isAuthenticated) {
            executeLoginFlow('multiple_options', { ssoId: orgCode }, true);
        }
    }, [orgCode, isAuthenticated]);
    
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/profile');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        const storedLoginInfo = getCookie('lastLoginInfo');
        if (storedLoginInfo) setLastLoginInfo(JSON.parse(storedLoginInfo));
        const showParamsPref = getCookie('showParamsPreference');
        if (showParamsPref !== null) setShowParamsDialog(showParamsPref === 'true');
    }, []);

    const handleSwitchChange = (newState) => {
        setShowParamsDialog(newState);
        setCookie('showParamsPreference', newState, 365);
    };
    
    const handleContinueAs = () => {
        if (!lastLoginInfo) return;
        executeLoginFlow(lastLoginInfo.loginFlow, lastLoginInfo);
    };
    const handleConfirmLogin = async () => {
        if (!loginParamsToConfirm) return;
        await loginWithRedirect({ authorizationParams: loginParamsToConfirm });
    };

    const handleSignUp = async (signUpData) => {
        setError('');
        setIsSigningUp(true);
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signUpData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Sign-up failed.");
            
            // Automatically log the user in after successful sign-up
            executeLoginFlow(
                'username_password_only',
                { ssoId: signUpData.orgCode, email: signUpData.email, organizationId: data.organizationId }
            );

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSigningUp(false);
        }
    };

    const tabs = [
        {
            label: "Login",
            value: "login",
            content: (
                <LoginTab
                    ssoId={ssoId}
                    setSsoId={setSsoId}
                    executeLoginFlow={executeLoginFlow}
                    lastLoginInfo={lastLoginInfo}
                    handleContinueAs={handleContinueAs}
                />
            )
        },
        {
            label: "Sign Up",
            value: "signup",
            content: (
                <SignUpTab
                    handleSignUp={handleSignUp}
                    isSigningUp={isSigningUp}
                />
            )
        }
    ];

    return (
        <>
            <Dialog isOpen={isConfirmDialogOpen} onCancel={() => setIsConfirmDialogOpen(false)} onConfirm={handleConfirmLogin} title={TEXT.confirmDialogTitle}><p className="text-gray-600 mb-4">{TEXT.confirmDialogBody}</p><pre className={STYLES.tokenBox}>{JSON.stringify(loginParamsToConfirm, null, 2)}</pre></Dialog>
            <Dialog isOpen={isInfoDialogOpen} onCancel={() => setIsInfoDialogOpen(false)} title={TEXT.infoDialogTitle} showConfirmButton={false}><p>{TEXT.infoDialogBody}</p></Dialog>
            <div className="min-h-screen bg-white text-gray-800 font-sans">
                <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="flex justify-center items-center space-x-6 mb-8">{ICONS.HeaderShield}{ICONS.HeaderBriefcase}{ICONS.HeaderZap}{ICONS.HeaderHeart}</div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">{TEXT.mainTitle}</h1>
                        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">{TEXT.mainSubtitle}</p>
                    </div>
                    
                    {error === TEXT.errorOrgNotFoundDeepLink && (
                        <div className="mt-8 max-w-xl mx-auto">
                            <Alert title="Organization Not Found" className="bg-red-50 border-red-300 text-red-800">
                                {error}
                            </Alert>
                        </div>
                    )}

                    <div className="mt-8 max-w-xl mx-auto bg-gray-50 p-6 sm:p-8 rounded-xl border border-gray-200 text-left">
                        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>
                    
                    {error && error !== TEXT.errorOrgNotFoundDeepLink && (
                        <p className={`${STYLES.errorText} text-center`}>{error}</p>
                    )}

                    <div className="mt-12 max-w-lg mx-auto flex items-center justify-center space-x-3">
                        <Switch id="show-params-switch" checked={showParamsDialog} onCheckedChange={handleSwitchChange} />
                        <label htmlFor="show-params-switch" className="text-sm text-gray-600 cursor-pointer">Show Parameters Before Sending</label>
                    </div>
                </main>
            </div>
        </>
    );
};