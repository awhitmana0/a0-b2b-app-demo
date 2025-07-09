import React, { useState, useEffect, useRef } from 'react';
import { ICONS, TEXT, STYLES, LOGIN_FLOW_OPTIONS } from './ui-config.jsx';

// --- Reusable UI Components ---
const Button = ({ children, className = '', ...props }) => ( <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props}>{children}</button> );
const Input = ({ className = '', ...props }) => ( <input className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} /> );

// --- Dropdown Menu Component ---
const DropdownMenu = ({ trigger, items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleItemClick = (action) => {
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <div>
                {React.cloneElement(trigger, { onClick: () => setIsOpen(!isOpen) })}
            </div>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {items.map((item) => (
                            <button
                                key={item.value}
                                onClick={() => handleItemClick(item.action)}
                                className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                role="menuitem"
                                disabled={item.disabled}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const LoginTab = ({ ssoId, setSsoId, executeLoginFlow, lastLoginInfo, handleContinueAs }) => {
    
    const loginMenuItems = LOGIN_FLOW_OPTIONS.map(option => ({
        ...option,
        action: () => executeLoginFlow(option.value, { ssoId }),
        disabled: option.value !== 'default' && !ssoId,
    }));

    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="ssoIdInput" className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full">{ICONS.InputKey}<Input id="ssoIdInput" type="text" placeholder={TEXT.inputPlaceholder} value={ssoId} onChange={(e) => setSsoId(e.target.value)} className="pl-10 h-12 w-full" /></div>
                    <DropdownMenu
                        trigger={
                            <Button className={`${STYLES.primaryButton} h-12 px-6 w-full sm:w-auto`}>
                                <span>{TEXT.continueButton}</span>
                                {ICONS.ContinueArrow}
                            </Button>
                        }
                        items={loginMenuItems}
                    />
                </div>
            </div>
            {lastLoginInfo && (
                <>
                    <div className="relative flex items-center"><div className="flex-grow border-t border-gray-300"></div><span className="flex-shrink mx-4 text-sm text-gray-500">or</span><div className="flex-grow border-t border-gray-300"></div></div>
                    <Button onClick={handleContinueAs} className={`${STYLES.secondaryButton} h-12 w-full`}>Continue as {lastLoginInfo.email}</Button>
                </>
            )}
        </div>
    );
};