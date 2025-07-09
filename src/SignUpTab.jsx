import React, { useState } from 'react';
import { ICONS, TEXT, STYLES } from './ui-config.jsx';

// --- Reusable UI Components ---
const Button = ({ children, className = '', ...props }) => ( <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props}>{children}</button> );
const Input = ({ className = '', ...props }) => ( <input className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} /> );
const Tooltip = ({ content, children }) => { const [isOpen, setIsOpen] = React.useState(false); return ( <div className="relative inline-flex" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>{children}{isOpen && ( <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-lg"><p>{content}</p><div className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-900"></div></div> )}</div> ); };

export const SignUpTab = ({ handleSignUp, isSigningUp }) => {
    const [email, setEmail] = useState('');
    const [orgName, setOrgName] = useState('');
    const [orgCode, setOrgCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const onSubmit = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }
        handleSignUp({ email, orgName, orgCode, password });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label htmlFor="signUpEmail" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <Input id="signUpEmail" type="email" placeholder={TEXT.signUpEmailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full" required />
            </div>
            <div>
                <div className="flex items-center mb-1">
                    <label htmlFor="signUpOrgName" className="block text-sm font-medium text-gray-700">{TEXT.signUpOrgNameLabel}</label>
                    <Tooltip content={TEXT.tooltipOrgName}><span className="ml-2 text-gray-400 cursor-pointer">{ICONS.InfoHelp}</span></Tooltip>
                </div>
                <Input id="signUpOrgName" type="text" placeholder={TEXT.signUpOrgNamePlaceholder} value={orgName} onChange={(e) => setOrgName(e.target.value)} className="h-12 w-full" required />
            </div>
            <div>
                <div className="flex items-center mb-1">
                    <label htmlFor="signUpOrgCode" className="block text-sm font-medium text-gray-700">{TEXT.signUpOrgCodeLabel}</label>
                    <Tooltip content={TEXT.tooltipOrgCode}><span className="ml-2 text-gray-400 cursor-pointer">{ICONS.InfoHelp}</span></Tooltip>
                </div>
                <Input id="signUpOrgCode" type="text" placeholder={TEXT.signUpOrgCodePlaceholder} value={orgCode} onChange={(e) => setOrgCode(e.target.value)} className="h-12 w-full" required />
            </div>
            <div>
                <label htmlFor="signUpPassword" className="block text-sm font-medium text-gray-700 mb-1">{TEXT.signUpPasswordLabel}</label>
                <Input id="signUpPassword" type="password" placeholder={TEXT.signUpPasswordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full" required />
            </div>
            <div>
                <label htmlFor="signUpConfirmPassword" className="block text-sm font-medium text-gray-700 mb-1">{TEXT.signUpConfirmPasswordLabel}</label>
                <Input id="signUpConfirmPassword" type="password" placeholder={TEXT.signUpConfirmPasswordPlaceholder} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 w-full" required />
            </div>
            <Button type="submit" className={STYLES.primaryButton + " h-12 w-full !mt-6"} disabled={isSigningUp}>
                {isSigningUp ? 'Signing Up...' : TEXT.signUpButton}
            </Button>
        </form>
    );
};