import React from 'react';
import { Shield, Briefcase, Zap, Heart, Key, ArrowRight, ChevronDown, X, HelpCircle, Trash2 } from 'lucide-react';

// --- ICONS ---
export const ICONS = {
  HeaderShield: <Shield className="h-10 w-10 text-blue-600" />,
  HeaderBriefcase: <Briefcase className="h-10 w-10 text-gray-500" />,
  HeaderZap: <Zap className="h-10 w-10 text-gray-500" />,
  HeaderHeart: <Heart className="h-10 w-10 text-gray-500" />,
  InputKey: <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />,
  ContinueArrow: <ArrowRight className="ml-2 h-4 w-4" />,
  SelectChevron: <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />,
  DialogClose: <X className="h-4 w-4" />,
  InfoHelp: <HelpCircle className="h-5 w-5" />,
  DeletePost: <Trash2 className="h-4 w-4" />,
};

// --- TEXT CONTENT ---
export const TEXT = {
  // Main Page
  mainTitle: "Auth0 Organization Router",
  mainSubtitle: "Auth0 Organizations allows our business-to-business (B2B) customers to better manage their partners and customers, and to customize the ways that end-users access their applications and APIs.",
  
  // Login Column
  loginColumnTitle: "Existing User Login",
  loginFlowTitle: "Select Login Flow",
  inputPlaceholder: "Enter your customer SSO ID",
  inputPlaceholderDisabled: "Not applicable",
  continueButton: "Continue",
  
  // Sign-Up Column
  signUpColumnTitle: "New User Sign Up",
  signUpEmailPlaceholder: "Enter your email address",
  signUpOrgNameLabel: "Organization Display Name",
  signUpOrgNamePlaceholder: "e.g., Acme Corporation",
  signUpOrgCodeLabel: "Organization SSO Code",
  signUpOrgCodePlaceholder: "e.g., acme-corp",
  signUpPasswordLabel: "Password",
  signUpPasswordPlaceholder: "Create a strong password",
  signUpConfirmPasswordLabel: "Confirm Password",
  signUpConfirmPasswordPlaceholder: "Confirm your password",
  signUpButton: "Sign Up",
  tooltipOrgName: "This is the full, user-friendly name of your organization that will be displayed to users.",
  tooltipOrgCode: "This is the unique, URL-friendly code your team will use to log in. It cannot be changed.",

  // Dialogs & Profile Page
  confirmDialogTitle: "Confirm Authorization Parameters",
  confirmDialogBody: "The following parameters will be sent to Auth0. Does this look correct?",
  infoDialogTitle: "About Login Flows",
  infoDialogBody: "The following toggles will change what the user will experience in their login flow. Usually these are integrated into the application flow but they are exposed here to demonstrate how additional parameters to the Auth0 authorization request can impact what the user sees.",
  welcome: "Welcome",
  logoutButton: "Log Out",
  logoutAndClearButton: "Logout & Clear Session",
  idTokenTitle: "ID Token (Decoded Payload)",
  accessTokenTitle: "Access Token (Decoded Payload)",
  loading: "Loading...",
  
  // Errors
  errorOrgNotFound: 'Organization not found. Please try another.',
  errorOrgNotFoundDeepLink: "The organization you are trying to log into could not be found. Please check the name or sign up for a new organization.",
  errorNoSsoConnection: 'No SSO connection found for this organization.',
  errorNoDbConnection: 'No Username/Password connection found for this organization.',
  errorInvalidFlow: 'Invalid login flow selected.',
  errorMissingSsoId: 'Please enter a customer SSO ID.',
};

// --- STYLING & COLORS ---
export const STYLES = {
  primaryButton: "bg-blue-600 text-white hover:bg-blue-700",
  secondaryButton: "bg-gray-200 hover:bg-gray-300",
  dangerButton: "bg-red-600 text-white hover:bg-red-700",
  logoutButton: "bg-gray-700 text-white hover:bg-gray-800",
  errorText: "mt-4 text-red-600",
  tokenBox: "p-4 bg-gray-900 text-white rounded-md text-sm overflow-x-auto",
  iconButton: "p-1 h-auto text-gray-400 hover:text-gray-700",
};

// --- LOGIN FLOW OPTIONS ---
export const LOGIN_FLOW_OPTIONS = [
  { value: 'multiple_options', label: 'Flow with Multiple Login Options' },
  { value: 'sso_only', label: 'Flow with SSO only' },
  { value: 'username_password_only', label: 'Flow with Username Password Only' },
  { value: 'internal_admin', label: 'Internal Admin Access' },
  { value: 'default', label: 'Login with no Additional Parameters' },
];

// --- FEATURE FLAGS ---
export const FEATURES = {
    messageBoard: import.meta.env.VITE_MESSAGE_BOARD_ENABLED === 'true',
    fga: import.meta.env.VITE_FGA_ENABLED === 'true',
    fgaRoleSync: import.meta.env.VITE_FGA_ROLE_SYNC_ENABLED === 'true',
};